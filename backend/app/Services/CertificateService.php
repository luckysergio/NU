<?php

namespace App\Services;

use App\Models\User;
use App\Models\Anggota;
use App\Models\Organization;
use App\Models\MemberCertificate;
use App\Models\CertificateCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class CertificateService
{
    protected const CACHE_DURATION = 300;
    protected const CACHE_PREFIX = 'certificates_';
    protected const CACHE_TAG = 'certificates';
    protected const MAX_FILE_SIZE = 5120; // 5MB in KB
    protected const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];

    /**
     * Get all certificates with filters
     */
    public function getAll(Request $request, User $user): LengthAwarePaginator
    {
        $search = trim(strtolower($request->search ?? ''));
        $perPage = (int) ($request->per_page ?? 10);
        $sortOrder = $request->sort_order ?? 'desc';

        $query = MemberCertificate::query()
            ->with(['anggota', 'anggota.organization', 'anggota.jabatan', 'category'])
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->whereRaw('LOWER(nama) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('LOWER(nomor_sertifikat) LIKE ?', ["%{$search}%"])
                        ->orWhereHas('anggota', function ($a) use ($search) {
                            $a->whereRaw('LOWER(nama) LIKE ?', ["%{$search}%"]);
                        });
                });
            })
            ->when($request->anggota_id, fn($q) => $q->where('anggota_id', $request->anggota_id))
            ->when($request->certificate_category_id, fn($q) => $q->where('certificate_category_id', $request->certificate_category_id))
            ->when($request->is_active, fn($q) => $q->whereHas('category', fn($c) => $c->where('is_active', true)))
            ->orderBy('created_at', $sortOrder === 'asc' ? 'asc' : 'desc');

        // Filter berdasarkan akses anggota
        $accessibleAnggotaIds = $this->getAccessibleAnggotaIds($user);
        if (!empty($accessibleAnggotaIds) && !$user->isSuperAdmin()) {
            $query->whereIn('anggota_id', $accessibleAnggotaIds);
        }

        return $query->paginate($perPage);
    }

    /**
     * Find certificate by ID
     */
    public function findById(int $id, User $user): MemberCertificate
    {
        $certificate = MemberCertificate::with([
            'anggota',
            'anggota.organization',
            'anggota.organization.level',
            'anggota.jabatan',
            'category'
        ])->findOrFail($id);

        $this->validateAccess($certificate, $user);

        return $certificate;
    }

    /**
     * Store new certificate
     */
    public function store(array $data, Request $request, User $user): MemberCertificate
    {
        DB::beginTransaction();

        try {
            // Validasi akses anggota
            $this->validateAnggotaAccess($data['anggota_id'], $user);

            // Validasi kategori
            $this->validateCategory($data['certificate_category_id']);

            // Generate nomor sertifikat jika tidak ada
            $nomorSertifikat = $data['nomor_sertifikat'] ?? $this->generateCertificateNumber();

            // Upload file
            $filePath = null;
            $fileSize = null;
            if ($request->hasFile('file')) {
                $uploadResult = $this->uploadFile($request->file('file'));
                $filePath = $uploadResult['path'];
                $fileSize = $uploadResult['size'];
            }

            $certificate = MemberCertificate::create([
                'anggota_id' => $data['anggota_id'],
                'certificate_category_id' => $data['certificate_category_id'],
                'nama' => $data['nama'],
                'nomor_sertifikat' => $nomorSertifikat,
                'tanggal_terbit' => $data['tanggal_terbit'] ?? now(),
                'tanggal_expired' => $data['tanggal_expired'] ?? null,
                'file' => $filePath,
                'size' => $fileSize,
            ]);

            DB::commit();

            // Clear cache
            $this->clearCache();

            Log::info('Certificate created: ' . $certificate->id . ' by user: ' . $user->id);

            return $certificate->load(['anggota', 'category']);

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update certificate
     */
    public function update(int $id, array $data, Request $request, User $user): MemberCertificate
    {
        DB::beginTransaction();

        try {
            $certificate = MemberCertificate::findOrFail($id);
            $this->validateAccess($certificate, $user);

            // Validasi akses anggota
            if (isset($data['anggota_id'])) {
                $this->validateAnggotaAccess($data['anggota_id'], $user);
            }

            // Validasi kategori
            if (isset($data['certificate_category_id'])) {
                $this->validateCategory($data['certificate_category_id']);
            }

            // Upload file baru jika ada
            if ($request->hasFile('file')) {
                // Hapus file lama
                if ($certificate->file) {
                    Storage::disk('public')->delete($certificate->file);
                }
                $uploadResult = $this->uploadFile($request->file('file'));
                $data['file'] = $uploadResult['path'];
                $data['size'] = $uploadResult['size'];
            }

            $certificate->update($data);

            DB::commit();

            // Clear cache
            $this->clearCache();

            Log::info('Certificate updated: ' . $certificate->id . ' by user: ' . $user->id);

            return $certificate->load(['anggota', 'category']);

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete certificate (Hard Delete)
     */
    public function destroy(int $id, User $user): bool
    {
        DB::beginTransaction();

        try {
            $certificate = MemberCertificate::findOrFail($id);
            $this->validateAccess($certificate, $user);

            // Hapus file
            if ($certificate->file) {
                Storage::disk('public')->delete($certificate->file);
            }

            // Hard delete (menghapus permanen)
            $certificate->forceDelete();

            DB::commit();

            // Clear cache
            $this->clearCache();

            Log::info('Certificate deleted permanently: ' . $id . ' by user: ' . $user->id);

            return true;

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Download certificate file
     * 
     * @return BinaryFileResponse
     */
    public function download(int $id, User $user): BinaryFileResponse
    {
        $certificate = MemberCertificate::findOrFail($id);
        $this->validateAccess($certificate, $user);

        if (!$certificate->file) {
            throw new \Exception('File tidak ditemukan');
        }

        $filePath = storage_path('app/public/' . $certificate->file);
        
        if (!file_exists($filePath)) {
            throw new \Exception('File tidak ditemukan di storage');
        }

        Log::info('Certificate downloaded: ' . $certificate->id . ' by user: ' . $user->id);

        $originalName = $certificate->nama . '.' . pathinfo($certificate->file, PATHINFO_EXTENSION);
        
        // Menggunakan response()->download() untuk menghindari error intelephense
        return response()->download($filePath, $originalName);
    }

    /**
     * Get certificates by anggota
     */
    public function getByAnggota(int $anggotaId, User $user): array
    {
        $this->validateAnggotaAccess($anggotaId, $user);

        return MemberCertificate::with(['category'])
            ->where('anggota_id', $anggotaId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Get categories
     */
    public function getCategories(): array
    {
        return CertificateCategory::where('is_active', true)
            ->orderBy('nama')
            ->get()
            ->toArray();
    }

    /**
     * Store new certificate category
     */
    public function storeCategory(array $data, User $user): CertificateCategory
    {
        // Cek apakah user memiliki izin (hanya super admin dan admin)
        if (!$user->isSuperAdmin() && !$user->isAdmin()) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk membuat kategori sertifikat');
        }

        // Validasi nama kategori unik
        $existing = CertificateCategory::where('nama', $data['nama'])->first();
        if ($existing) {
            throw new \Exception('Kategori dengan nama "' . $data['nama'] . '" sudah ada');
        }

        // Generate slug dari nama
        $slug = Str::slug($data['nama']);
        
        // Cek duplikasi slug
        $slugCount = CertificateCategory::where('slug', 'LIKE', $slug . '%')->count();
        if ($slugCount > 0) {
            $slug = $slug . '-' . ($slugCount + 1);
        }

        $category = CertificateCategory::create([
            'nama' => $data['nama'],
            'slug' => $slug,
            'deskripsi' => $data['deskripsi'] ?? null,
            'is_active' => true,
        ]);

        // Clear cache
        $this->clearCache();

        Log::info('Certificate category created: ' . $category->id . ' by user: ' . $user->id);

        return $category;
    }

    /**
     * Update certificate category
     */
    public function updateCategory(int $id, array $data, User $user): CertificateCategory
    {
        // Cek apakah user memiliki izin
        if (!$user->isSuperAdmin() && !$user->isAdmin()) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk mengupdate kategori sertifikat');
        }

        $category = CertificateCategory::findOrFail($id);

        // Validasi nama kategori unik (kecuali untuk kategori yang sama)
        if (isset($data['nama'])) {
            $existing = CertificateCategory::where('nama', $data['nama'])
                ->where('id', '!=', $id)
                ->first();
            if ($existing) {
                throw new \Exception('Kategori dengan nama "' . $data['nama'] . '" sudah ada');
            }
            
            // Update slug jika nama berubah
            $slug = Str::slug($data['nama']);
            $slugCount = CertificateCategory::where('slug', 'LIKE', $slug . '%')
                ->where('id', '!=', $id)
                ->count();
            if ($slugCount > 0) {
                $slug = $slug . '-' . ($slugCount + 1);
            }
            $data['slug'] = $slug;
        }

        $category->update($data);

        // Clear cache
        $this->clearCache();

        Log::info('Certificate category updated: ' . $category->id . ' by user: ' . $user->id);

        return $category;
    }

    /**
     * Delete certificate category
     */
    public function destroyCategory(int $id, User $user): bool
    {
        // Cek apakah user memiliki izin
        if (!$user->isSuperAdmin() && !$user->isAdmin()) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk menghapus kategori sertifikat');
        }

        $category = CertificateCategory::findOrFail($id);

        // Cek apakah kategori masih digunakan oleh sertifikat
        $certificateCount = MemberCertificate::where('certificate_category_id', $id)->count();
        if ($certificateCount > 0) {
            throw new \Exception('Kategori tidak dapat dihapus karena masih digunakan oleh ' . $certificateCount . ' sertifikat');
        }

        $category->delete();

        // Clear cache
        $this->clearCache();

        Log::info('Certificate category deleted: ' . $id . ' by user: ' . $user->id);

        return true;
    }

    /**
     * Validate anggota access
     */
    private function validateAnggotaAccess(int $anggotaId, User $user): void
    {
        $accessibleIds = $this->getAccessibleAnggotaIds($user);
        
        if (!$user->isSuperAdmin() && !in_array($anggotaId, $accessibleIds)) {
            throw new AuthorizationException('Anda tidak memiliki akses ke anggota tersebut');
        }
    }

    /**
     * Validate certificate access
     */
    private function validateAccess(MemberCertificate $certificate, User $user): void
    {
        $this->validateAnggotaAccess($certificate->anggota_id, $user);
    }

    /**
     * Validate category exists and active
     */
    private function validateCategory(int $categoryId): void
    {
        $category = CertificateCategory::find($categoryId);
        if (!$category) {
            throw new \Exception('Kategori sertifikat tidak ditemukan');
        }
        if (!$category->is_active) {
            throw new \Exception('Kategori sertifikat tidak aktif');
        }
    }

    /**
     * Get accessible anggota IDs
     */
    private function getAccessibleAnggotaIds(User $user): array
    {
        if ($user->isSuperAdmin()) {
            return Anggota::pluck('id')->toArray();
        }

        if (!$user->organization_id) {
            return [];
        }

        $organizationIds = [$user->organization_id];
        $userOrg = $user->organization;
        
        if ($userOrg && ($user->isPC() || $user->isMWC())) {
            $organizationIds = array_merge($organizationIds, $userOrg->descendants());
        }
        
        if ($userOrg && $user->isRanting()) {
            $children = Organization::where('parent_id', $user->organization_id)
                ->whereHas('level', fn($q) => $q->where('slug', 'anak-ranting'))
                ->pluck('id')
                ->toArray();
            $organizationIds = array_merge($organizationIds, $children);
        }

        return Anggota::whereIn('organization_id', array_unique($organizationIds))
            ->pluck('id')
            ->toArray();
    }

    /**
     * Upload file with validation
     */
    private function uploadFile(UploadedFile $file): array
    {
        // Validasi ukuran
        $fileSize = $file->getSize() / 1024; // Convert to KB
        if ($fileSize > self::MAX_FILE_SIZE) {
            throw new \Exception('Ukuran file maksimal ' . (self::MAX_FILE_SIZE / 1024) . 'MB');
        }

        // Validasi ekstensi
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, self::ALLOWED_EXTENSIONS)) {
            throw new \Exception('Format file tidak didukung. Gunakan: ' . implode(', ', self::ALLOWED_EXTENSIONS));
        }

        try {
            $filename = 'certificate_' . time() . '_' . Str::random(10) . '.' . $extension;
            $path = 'certificates/' . date('Y') . '/' . date('m') . '/' . $filename;
            
            // Pastikan direktori ada
            $fullPath = storage_path('app/public/' . $path);
            $directory = dirname($fullPath);
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            // Simpan file
            Storage::disk('public')->put($path, file_get_contents($file));
            
            Log::info('File uploaded: ' . $path . ' (Size: ' . $fileSize . 'KB)');
            
            return [
                'path' => $path,
                // PERBAIKAN: Bulatkan nilai size menjadi integer
                // Karena kolom 'size' di database bertipe bigint
                'size' => (int) round($fileSize), // Pembulatan ke integer terdekat
            ];

        } catch (\Exception $e) {
            Log::error('Failed to upload file: ' . $e->getMessage());
            throw new \Exception('Gagal mengupload file: ' . $e->getMessage());
        }
    }

    /**
     * Generate certificate number
     */
    private function generateCertificateNumber(): string
    {
        $prefix = 'SK-' . date('Y') . '-';
        $last = MemberCertificate::where('nomor_sertifikat', 'like', $prefix . '%')
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = 1;
        if ($last) {
            $parts = explode('-', $last->nomor_sertifikat);
            $lastNumber = (int) end($parts);
            $nextNumber = $lastNumber + 1;
        }

        return $prefix . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Clear cache
     */
    private function clearCache(): void
    {
        try {
            Cache::tags([self::CACHE_TAG])->flush();
            Log::info('Cache certificates cleared');
        } catch (\Exception $e) {
            Log::warning('Failed to clear cache: ' . $e->getMessage());
        }
    }
}