<?php
// app/Services/AnggotaService.php

namespace App\Services;

use App\Models\User;
use App\Models\Anggota;
use App\Models\Organization;
use App\Models\OrganizationLevel;
use App\Events\AnggotaCreated;
use App\Events\AnggotaUpdated;
use App\Events\AnggotaDeleted;
use App\Events\DashboardMemberCountUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Auth\Access\AuthorizationException;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Http\UploadedFile;

class AnggotaService
{
    protected const CACHE_DURATION = 300;
    protected const CACHE_PREFIX = 'anggota_';
    protected const CACHE_TAG = 'anggota';
    protected const MAX_FILE_SIZE = 2048; // 2MB in KB
    protected const IMAGE_QUALITY = 80;
    protected const IMAGE_MAX_WIDTH = 800;
    protected const IMAGE_MAX_HEIGHT = 800;

    protected function authUser(): ?User
    {
        return Auth::user();
    }

    protected function getAccessibleOrganizationIds(): array
    {
        $authUser = $this->authUser();

        if (!$authUser) {
            return [];
        }

        if ($authUser->isSuperAdmin()) {
            return Organization::pluck('id')->toArray();
        }

        if (!$authUser->organization_id) {
            return [];
        }

        $organizationIds = [$authUser->organization_id];

        $userOrg = Organization::find($authUser->organization_id);
        if ($userOrg) {
            if ($authUser->isPC() || $authUser->isMWC()) {
                $organizationIds = array_merge($organizationIds, $userOrg->descendants());
            }

            if ($authUser->isRanting()) {
                $children = Organization::where('parent_id', $authUser->organization_id)
                    ->whereHas('level', fn($q) => $q->where('slug', 'anak-ranting'))
                    ->pluck('id')
                    ->toArray();
                $organizationIds = array_merge($organizationIds, $children);
            }
        }

        return array_unique($organizationIds);
    }

    protected function validateOrganizationAccess(int $organizationId): void
    {
        $authUser = $this->authUser();

        if (!$authUser) {
            throw new AuthorizationException('Unauthorized');
        }

        if ($authUser->isSuperAdmin()) {
            return;
        }

        $accessibleIds = $this->getAccessibleOrganizationIds();

        if (!in_array($organizationId, $accessibleIds)) {
            throw new AuthorizationException('Anda tidak memiliki akses ke organisasi tersebut');
        }
    }

    public function getAll(Request $request)
    {
        $filters = $this->extractFilters($request);
        $bypassCache = $request->query('bypass_cache', false);
        
        if ($bypassCache || $request->query('_t')) {
            return $this->buildAnggotaQuery($filters)->paginate($filters['per_page']);
        }
        
        $cacheKey = $this->getCacheKey('list', $filters);
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($filters) {
            return $this->buildAnggotaQuery($filters)->paginate($filters['per_page']);
        });
    }

    public function findById(int $id): Anggota
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($id) {
            $anggota = Anggota::with([
                'organization.level',
                'organization.type',
                'jabatan',
            ])->findOrFail($id);

            $this->validateOrganizationAccess($anggota->organization_id);

            return $anggota;
        });
    }

    public function store(array $data, Request $request): Anggota
    {
        DB::beginTransaction();

        try {
            $this->validateOrganizationAccess($data['organization_id']);

            $noAnggota = $this->generateNoAnggota($data);

            // Proses upload foto jika ada
            $fotoPath = null;
            if ($request->hasFile('foto')) {
                $fotoPath = $this->uploadPhoto($request->file('foto'));
            }

            $anggota = Anggota::create([
                'organization_id' => $data['organization_id'],
                'jabatan_id'      => $data['jabatan_id'] ?? null,
                'no_anggota'      => $noAnggota,
                'nama'            => $data['nama'],
                'no_hp'           => $data['no_hp'] ?? null,
                'alamat'          => $data['alamat'] ?? null,
                'foto'            => $fotoPath,
                'is_active'       => $data['is_active'] ?? true,
            ]);

            DB::commit();

            $this->clearCache();

            broadcast(new AnggotaCreated($anggota));
            $this->broadcastDashboardUpdate();

            return $anggota->load([
                'organization.level',
                'organization.type',
                'jabatan',
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function update(int $id, array $data, Request $request): Anggota
    {
        DB::beginTransaction();

        try {
            $anggota = Anggota::findOrFail($id);

            $this->validateOrganizationAccess($data['organization_id']);

            $noAnggota = $this->validateNoAnggota($data, $anggota);

            $oldValues = $anggota->toArray();

            // Proses upload foto jika ada
            $fotoPath = $anggota->foto;
            if ($request->hasFile('foto')) {
                // Hapus foto lama jika ada
                if ($anggota->foto) {
                    Storage::disk('public')->delete($anggota->foto);
                }
                $fotoPath = $this->uploadPhoto($request->file('foto'));
            }

            $anggota->update([
                'organization_id' => $data['organization_id'],
                'jabatan_id'      => $data['jabatan_id'] ?? null,
                'no_anggota'      => $noAnggota,
                'nama'            => $data['nama'],
                'no_hp'           => $data['no_hp'] ?? null,
                'alamat'          => $data['alamat'] ?? null,
                'foto'            => $fotoPath,
                'is_active'       => $data['is_active'] ?? true,
            ]);

            DB::commit();

            $this->clearCache();

            broadcast(new AnggotaUpdated($anggota->fresh([
                'organization.level',
                'organization.type',
                'jabatan',
            ])));
            $this->broadcastDashboardUpdate();

            return $anggota->load([
                'organization.level',
                'organization.type',
                'jabatan',
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(int $id, Request $request): bool
    {
        DB::beginTransaction();

        try {
            $anggota = Anggota::findOrFail($id);

            $this->validateOrganizationAccess($anggota->organization_id);

            // Hapus foto jika ada
            if ($anggota->foto) {
                Storage::disk('public')->delete($anggota->foto);
            }

            $anggota->delete();

            DB::commit();

            $this->clearCache();

            broadcast(new AnggotaDeleted($id));
            $this->broadcastDashboardUpdate();

            return true;

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Upload photo with compression - Sama seperti ActivityService
     */
    private function uploadPhoto(UploadedFile $file): string
    {
        // Validasi ukuran file (maksimal 2MB)
        $fileSize = $file->getSize() / 1024; // Convert to KB
        if ($fileSize > self::MAX_FILE_SIZE) {
            throw new \Exception('Ukuran file terlalu besar. Maksimal 2MB.');
        }

        // Validasi tipe file
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $allowedExtensions)) {
            throw new \Exception('Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau WEBP.');
        }

        try {
            // Buat ImageManager dengan driver GD
            $manager = new ImageManager(new Driver());
            
            // Baca gambar
            $image = $manager->read($file->getPathname());
            
            // Dapatkan dimensi asli
            $width = $image->width();
            $height = $image->height();
            
            // Resize jika lebih besar dari max dimensi
            if ($width > self::IMAGE_MAX_WIDTH || $height > self::IMAGE_MAX_HEIGHT) {
                $image->scaleDown(
                    self::IMAGE_MAX_WIDTH,
                    self::IMAGE_MAX_HEIGHT
                );
            }
            
            // PERBAIKAN: Path sama dengan ActivityService
            $filename = 'anggota_' . time() . '_' . Str::random(10) . '.jpg';
            $path = 'anggotas/' . date('Y') . '/' . date('m') . '/' . $filename;
            
            // Pastikan direktori ada
            $fullPath = storage_path('app/public/' . $path);
            $directory = dirname($fullPath);
            
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }
            
            // Compress dan simpan sebagai JPEG dengan kualitas 80%
            $image->toJpeg(self::IMAGE_QUALITY);
            $image->save($fullPath);
            
            Log::info('Foto anggota diupload: ' . $path . ' (Size: ' . $fileSize . 'KB)');
            
            return $path;

        } catch (\Exception $e) {
            Log::error('Failed to process photo: ' . $e->getMessage());
            throw new \Exception('Gagal memproses foto: ' . $e->getMessage());
        }
    }

    /**
     * Delete foto from storage
     */
    private function deletePhoto(string $path): void
    {
        try {
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
                Log::info('Foto anggota dihapus: ' . $path);
            }
        } catch (\Exception $e) {
            Log::error('Failed to delete photo: ' . $e->getMessage());
        }
    }

    private function broadcastDashboardUpdate(): void
    {
        try {
            Log::info('===== broadcastDashboardUpdate() START =====');
            
            $totalMembers = Anggota::where('is_active', true)->count();
            Log::info('Total members: ' . $totalMembers);

            $statistics = [];
            $levels = OrganizationLevel::all();

            foreach ($levels as $level) {
                $count = Anggota::whereHas('organization.level', function ($query) use ($level) {
                    $query->where('organization_levels.id', $level->id);
                })->where('is_active', true)->count();

                $statistics[$level->slug] = [
                    'count' => $count,
                    'label' => $this->getLevelDisplayName($level->slug),
                    'slug' => $level->slug,
                    'color' => $this->getLevelColor($level->slug),
                ];
            }

            broadcast(new DashboardMemberCountUpdated($totalMembers, $statistics, []));

            Log::info('Dashboard member broadcast sent: total=' . $totalMembers . ', levels=' . count($statistics));
            Log::info('===== broadcastDashboardUpdate() END =====');

        } catch (\Exception $e) {
            Log::error('Failed to broadcast dashboard member update: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
        }
    }

    private function getLevelDisplayName(string $slug): string
    {
        $names = [
            'pc' => 'PCNU',
            'mwc' => 'MWCNU',
            'ranting' => 'RANTING',
            'anak-ranting' => 'ANAK RANTING',
            'lembaga' => 'LEMBAGA',
            'banom' => 'BANOM',
        ];
        return $names[$slug] ?? strtoupper($slug);
    }

    private function getLevelColor(string $slug): string
    {
        $colors = [
            'pc' => 'purple',
            'mwc' => 'blue',
            'ranting' => 'green',
            'anak-ranting' => 'teal',
            'lembaga' => 'orange',
            'banom' => 'pink',
        ];
        return $colors[$slug] ?? 'gray';
    }

    private function extractFilters(Request $request): array
    {
        return [
            'search' => trim((string) $request->query('search')),
            'organization_id' => $request->query('organization_id'),
            'organization_type_id' => $request->query('organization_type_id'),
            'jabatan_id' => $request->query('jabatan_id'),
            'is_active' => $request->query('is_active'),
            'level_slug' => $request->query('level_slug'),
            'per_page' => min((int) $request->query('per_page', 10), 1000),
            'page' => (int) $request->query('page', 1),
        ];
    }

    private function buildAnggotaQuery(array $filters)
    {
        $authUser = $this->authUser();
        $accessibleIds = $this->getAccessibleOrganizationIds();

        return Anggota::query()
            ->with([
                'organization.level',
                'organization.type',
                'jabatan',
            ])
            ->when(!empty($accessibleIds) && !$authUser->isSuperAdmin(), 
                fn($q) => $q->whereIn('organization_id', $accessibleIds))
            ->when($filters['search'], function ($query) use ($filters) {
                $search = strtolower($filters['search']);
                $query->where(function ($q) use ($search) {
                    $q->whereRaw('LOWER(nama) LIKE ?', ["%{$search}%"])
                      ->orWhereRaw('LOWER(no_anggota) LIKE ?', ["%{$search}%"])
                      ->orWhereRaw('LOWER(no_hp) LIKE ?', ["%{$search}%"]);
                });
            })
            ->when($filters['organization_id'], fn($q) => $q->where('organization_id', $filters['organization_id']))
            ->when($filters['organization_type_id'], function ($q) use ($filters) {
                $q->whereHas('organization', fn($sub) => $sub->where('organization_type_id', $filters['organization_type_id']));
            })
            ->when($filters['jabatan_id'], fn($q) => $q->where('jabatan_id', $filters['jabatan_id']))
            ->when($filters['is_active'] !== null && $filters['is_active'] !== '', 
                fn($q) => $q->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN)))
            ->when($filters['level_slug'], function ($q) use ($filters) {
                $q->whereHas('organization.level', fn($sub) => $sub->where('slug', $filters['level_slug']));
            })
            ->orderBy('nama', 'asc');
    }

    private function generateNoAnggota(array $data): string
    {
        if (!empty($data['no_anggota'])) {
            $existing = Anggota::where('no_anggota', $data['no_anggota'])->first();
            if ($existing) {
                throw new \Exception('Nomor anggota sudah terdaftar. Silakan gunakan nomor yang berbeda.');
            }
            return $data['no_anggota'];
        }

        $year = date('Y');
        $last = Anggota::where('no_anggota', 'like', "NU-{$year}-%")
            ->orderByDesc('id')
            ->first();

        $nextNumber = $last ? (int) explode('-', $last->no_anggota)[2] + 1 : 1;

        return sprintf('NU-%s-%06d', $year, $nextNumber);
    }

    private function validateNoAnggota(array $data, Anggota $anggota): string
    {
        if (!empty($data['no_anggota']) && $data['no_anggota'] !== $anggota->no_anggota) {
            $existing = Anggota::where('no_anggota', $data['no_anggota'])
                ->where('id', '!=', $anggota->id)
                ->first();

            if ($existing) {
                throw new \Exception('Nomor anggota sudah terdaftar. Silakan gunakan nomor yang berbeda.');
            }
            return $data['no_anggota'];
        }

        return $anggota->no_anggota;
    }

    public function validateNoAnggotaExists(string $noAnggota, ?int $excludeId = null): bool
    {
        $query = Anggota::where('no_anggota', $noAnggota);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        return !$query->exists();
    }

    private function getCacheKey(string $key, array $params = []): string
    {
        $paramString = !empty($params) ? '_' . md5(json_encode($params)) : '';
        return self::CACHE_PREFIX . $key . $paramString;
    }

    private function clearCache(): void
    {
        try {
            Cache::tags([self::CACHE_TAG])->flush();
            Log::info('Cache anggota cleared');
        } catch (\Exception $e) {
            Log::warning('Failed to clear cache: ' . $e->getMessage());
        }
    }
}