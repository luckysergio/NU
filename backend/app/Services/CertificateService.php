<?php

namespace App\Services;

use App\Models\User;
use App\Models\Biodata;
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

    public function getAll(Request $request, User $user): LengthAwarePaginator
    {
        $search = trim(strtolower($request->search ?? ''));
        $perPage = (int) ($request->per_page ?? 10);
        $sortOrder = $request->sort_order ?? 'desc';

        $query = MemberCertificate::query()
            ->with(['biodata', 'category'])
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->whereRaw('LOWER(nama) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('LOWER(nomor_sertifikat) LIKE ?', ["%{$search}%"])
                        ->orWhereHas('biodata', function ($a) use ($search) {
                            $a->whereRaw('LOWER(nama) LIKE ?', ["%{$search}%"])
                              ->orWhereRaw('LOWER(no_anggota) LIKE ?', ["%{$search}%"]);
                        });
                });
            })
            ->when($request->biodata_id, fn($q) => $q->where('biodata_id', $request->biodata_id))
            ->when($request->certificate_category_id, fn($q) => $q->where('certificate_category_id', $request->certificate_category_id))
            ->when($request->is_active, fn($q) => $q->whereHas('category', fn($c) => $c->where('is_active', true)))
            ->orderBy('created_at', $sortOrder === 'asc' ? 'asc' : 'desc');

        $accessibleBiodataIds = $this->getAccessibleBiodataIds($user);
        if (!empty($accessibleBiodataIds) && !$user->isSuperAdmin()) {
            $query->whereIn('biodata_id', $accessibleBiodataIds);
        }

        return $query->paginate($perPage);
    }

    public function findById(int $id, User $user): MemberCertificate
    {
        $certificate = MemberCertificate::with([
            'biodata',
            'category'
        ])->findOrFail($id);

        $this->validateAccess($certificate, $user);

        return $certificate;
    }

    public function store(array $data, Request $request, User $user): MemberCertificate
    {
        DB::beginTransaction();

        try {
            $this->validateBiodataAccess($data['biodata_id'], $user);

            $this->validateCategory($data['certificate_category_id']);

            $nomorSertifikat = $data['nomor_sertifikat'] ?? $this->generateCertificateNumber();

            $filePath = null;
            $fileSize = null;
            if ($request->hasFile('file')) {
                $uploadResult = $this->uploadFile($request->file('file'));
                $filePath = $uploadResult['path'];
                $fileSize = $uploadResult['size'];
            }

            $certificate = MemberCertificate::create([
                'biodata_id' => $data['biodata_id'],
                'certificate_category_id' => $data['certificate_category_id'],
                'nama' => $data['nama'],
                'nomor_sertifikat' => $nomorSertifikat,
                'tanggal_terbit' => $data['tanggal_terbit'] ?? now(),
                'tanggal_expired' => $data['tanggal_expired'] ?? null,
                'file' => $filePath,
                'size' => $fileSize,
            ]);

            DB::commit();

            $this->clearCache();

            Log::info('Certificate created: ' . $certificate->id . ' by user: ' . $user->id);

            return $certificate->load(['biodata', 'category']);

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function update(int $id, array $data, Request $request, User $user): MemberCertificate
    {
        DB::beginTransaction();

        try {
            $certificate = MemberCertificate::findOrFail($id);
            $this->validateAccess($certificate, $user);

            if (isset($data['biodata_id'])) {
                $this->validateBiodataAccess($data['biodata_id'], $user);
            }

            if (isset($data['certificate_category_id'])) {
                $this->validateCategory($data['certificate_category_id']);
            }

            if ($request->hasFile('file')) {
                if ($certificate->file) {
                    Storage::disk('public')->delete($certificate->file);
                }
                $uploadResult = $this->uploadFile($request->file('file'));
                $data['file'] = $uploadResult['path'];
                $data['size'] = $uploadResult['size'];
            }

            $certificate->update($data);

            DB::commit();

            $this->clearCache();

            Log::info('Certificate updated: ' . $certificate->id . ' by user: ' . $user->id);

            return $certificate->load(['biodata', 'category']);

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(int $id, User $user): bool
    {
        DB::beginTransaction();

        try {
            $certificate = MemberCertificate::findOrFail($id);
            $this->validateAccess($certificate, $user);

            if ($certificate->file) {
                Storage::disk('public')->delete($certificate->file);
            }

            $certificate->forceDelete();

            DB::commit();

            $this->clearCache();

            Log::info('Certificate deleted permanently: ' . $id . ' by user: ' . $user->id);

            return true;

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

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
        
        return response()->download($filePath, $originalName);
    }

    public function getByBiodata(int $biodataId, User $user): array
    {
        $this->validateBiodataAccess($biodataId, $user);

        return MemberCertificate::with(['category'])
            ->where('biodata_id', $biodataId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    public function getCategories(): array
    {
        return CertificateCategory::where('is_active', true)
            ->orderBy('nama')
            ->get()
            ->toArray();
    }

    public function storeCategory(array $data, User $user): CertificateCategory
    {
        if (!$user->isSuperAdmin() && !$user->isAdmin()) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk membuat kategori sertifikat');
        }

        $existing = CertificateCategory::where('nama', $data['nama'])->first();
        if ($existing) {
            throw new \Exception('Kategori dengan nama "' . $data['nama'] . '" sudah ada');
        }

        $slug = Str::slug($data['nama']);
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

        $this->clearCache();
        Log::info('Certificate category created: ' . $category->id . ' by user: ' . $user->id);

        return $category;
    }

    public function updateCategory(int $id, array $data, User $user): CertificateCategory
    {
        if (!$user->isSuperAdmin() && !$user->isAdmin()) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk mengupdate kategori sertifikat');
        }

        $category = CertificateCategory::findOrFail($id);

        if (isset($data['nama'])) {
            $existing = CertificateCategory::where('nama', $data['nama'])
                ->where('id', '!=', $id)
                ->first();
            if ($existing) {
                throw new \Exception('Kategori dengan nama "' . $data['nama'] . '" sudah ada');
            }
            
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
        $this->clearCache();
        Log::info('Certificate category updated: ' . $category->id . ' by user: ' . $user->id);

        return $category;
    }

    public function destroyCategory(int $id, User $user): bool
    {
        if (!$user->isSuperAdmin() && !$user->isAdmin()) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk menghapus kategori sertifikat');
        }

        $category = CertificateCategory::findOrFail($id);

        $certificateCount = MemberCertificate::where('certificate_category_id', $id)->count();
        if ($certificateCount > 0) {
            throw new \Exception('Kategori tidak dapat dihapus karena masih digunakan oleh ' . $certificateCount . ' sertifikat');
        }

        $category->delete();
        $this->clearCache();
        Log::info('Certificate category deleted: ' . $id . ' by user: ' . $user->id);

        return true;
    }

    private function validateBiodataAccess(int $biodataId, User $user): void
    {
        $accessibleIds = $this->getAccessibleBiodataIds($user);
        
        if (!$user->isSuperAdmin() && !in_array($biodataId, $accessibleIds)) {
            throw new AuthorizationException('Anda tidak memiliki akses ke data anggota tersebut');
        }
    }

    private function validateAccess(MemberCertificate $certificate, User $user): void
    {
        $this->validateBiodataAccess($certificate->biodata_id, $user);
    }

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

    private function getAccessibleBiodataIds(User $user): array
    {
        if ($user->isSuperAdmin()) {
            return Biodata::pluck('id')->toArray();
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
            ->pluck('biodata_id')
            ->unique()
            ->toArray();
    }

    private function uploadFile(UploadedFile $file): array
    {
        $fileSize = $file->getSize() / 1024;
        if ($fileSize > self::MAX_FILE_SIZE) {
            throw new \Exception('Ukuran file maksimal ' . (self::MAX_FILE_SIZE / 1024) . 'MB');
        }

        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, self::ALLOWED_EXTENSIONS)) {
            throw new \Exception('Format file tidak didukung. Gunakan: ' . implode(', ', self::ALLOWED_EXTENSIONS));
        }

        try {
            $filename = 'certificate_' . time() . '_' . Str::random(10) . '.' . $extension;
            $path = 'certificates/' . date('Y') . '/' . date('m') . '/' . $filename;
            
            $fullPath = storage_path('app/public/' . $path);
            $directory = dirname($fullPath);
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            Storage::disk('public')->put($path, file_get_contents($file));
            
            Log::info('File uploaded: ' . $path . ' (Size: ' . $fileSize . 'KB)');
            
            return [
                'path' => $path,
                'size' => (int) round($fileSize),
            ];

        } catch (\Exception $e) {
            Log::error('Failed to upload file: ' . $e->getMessage());
            throw new \Exception('Gagal mengupload file: ' . $e->getMessage());
        }
    }

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