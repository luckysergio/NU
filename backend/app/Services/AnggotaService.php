<?php

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
    protected const CACHE_DURATION = 600; // 10 menit
    protected const CACHE_PREFIX = 'anggota_';
    protected const CACHE_TAG = 'anggota';
    protected const MAX_FILE_SIZE = 2048;
    protected const IMAGE_QUALITY = 80;
    protected const IMAGE_MAX_WIDTH = 800;
    protected const IMAGE_MAX_HEIGHT = 800;

    protected function authUser(): ?User
    {
        return Auth::user();
    }

    /**
     * Get accessible organization IDs based on user role (Optimized with User Isolation Cache)
     */
    protected function getAccessibleOrganizationIds(): array
    {
        $authUser = $this->authUser();
        if (!$authUser) return [];

        $cacheKey = 'accessible_orgs_u' . $authUser->id;
        
        return Cache::remember($cacheKey, 3600, function () use ($authUser) {
            $accessibleIds = $authUser->getAccessibleOrganizationIds();
            
            if ($accessibleIds === null) {
                return Organization::pluck('id')->toArray();
            }
            
            return $accessibleIds;
        });
    }

    /**
     * Validate if user has access to a specific organization
     */
    protected function validateOrganizationAccess(int $organizationId): void
    {
        $authUser = $this->authUser();
        if (!$authUser) throw new AuthorizationException('Unauthorized');
        if ($authUser->isSuperAdmin()) return;

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
        
        // PENTING: Cache key sekarang membedakan hak akses scope user agar tidak bocor silang browser
        $cacheKey = $this->getCacheKey('list', $filters);
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($filters) {
            return $this->buildAnggotaQuery($filters)->paginate($filters['per_page']);
        });
    }

    public function findById(int $id): Anggota
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($id) {
            $anggota = Anggota::withRelations()->findOrFail($id);
            $this->validateOrganizationAccess($anggota->organization_id);
            return $anggota;
        });
    }

    public function store(array $data, Request $request): Anggota
    {
        return DB::transaction(function () use ($data, $request) {
            $this->validateOrganizationAccess($data['organization_id']);
            $noAnggota = $this->generateNoAnggota($data);

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

            $this->clearCache();

            broadcast(new AnggotaCreated($anggota))->toOthers();
            $this->broadcastDashboardUpdate();

            return $anggota->load(['organization.level', 'jabatan']);
        });
    }

    public function update(int $id, array $data, Request $request): Anggota
    {
        return DB::transaction(function () use ($id, $data, $request) {
            $anggota = Anggota::findOrFail($id);
            $this->validateOrganizationAccess($data['organization_id']);
            $noAnggota = $this->validateNoAnggota($data, $anggota);

            $fotoPath = $anggota->foto;
            if ($request->hasFile('foto')) {
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

            $this->clearCache();

            broadcast(new AnggotaUpdated($anggota->fresh(['organization.level', 'jabatan'])))->toOthers();
            $this->broadcastDashboardUpdate();

            return $anggota->load(['organization.level', 'jabatan']);
        });
    }

    public function destroy(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $anggota = Anggota::findOrFail($id);
            $this->validateOrganizationAccess($anggota->organization_id);

            if ($anggota->foto) {
                Storage::disk('public')->delete($anggota->foto);
            }

            $anggota->delete();
            $this->clearCache();

            broadcast(new AnggotaDeleted($id))->toOthers();
            $this->broadcastDashboardUpdate();

            return true;
        });
    }

    private function uploadPhoto(UploadedFile $file): string
    {
        if (($file->getSize() / 1024) > self::MAX_FILE_SIZE) {
            throw new \Exception('Ukuran file terlalu besar. Maksimal 2MB.');
        }

        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'webp'])) {
            throw new \Exception('Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau WEBP.');
        }

        try {
            $manager = new ImageManager(new Driver());
            $image = $manager->read($file->getPathname());
            
            if ($image->width() > self::IMAGE_MAX_WIDTH || $image->height() > self::IMAGE_MAX_HEIGHT) {
                $image->scaleDown(self::IMAGE_MAX_WIDTH, self::IMAGE_MAX_HEIGHT);
            }
            
            $filename = 'anggota_' . time() . '_' . Str::random(10) . '.jpg';
            $path = 'anggotas/' . date('Y') . '/' . date('m') . '/' . $filename;
            
            $fullPath = storage_path('app/public/' . $path);
            $directory = dirname($fullPath);
            
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }
            
            $image->toJpeg(self::IMAGE_QUALITY);
            $image->save($fullPath);
            
            return $path;
        } catch (\Exception $e) {
            Log::error('Failed to process photo: ' . $e->getMessage());
            throw new \Exception('Gagal memproses foto.');
        }
    }

    public function getStatistics(): array
    {
        $authUser = $this->authUser();
        
        $baseQuery = Anggota::active()->accessibleByUser($authUser);
        $total = $baseQuery->count();

        $countsGrouped = Anggota::active()
            ->accessibleByUser($authUser)
            ->join('organizations', 'anggotas.organization_id', '=', 'organizations.id')
            ->join('organization_levels', 'organizations.organization_level_id', '=', 'organization_levels.id')
            ->select('organization_levels.slug', DB::raw('count(anggotas.id) as total_count'))
            ->groupBy('organization_levels.slug')
            ->pluck('total_count', 'organization_levels.slug')
            ->toArray();

        $statistics = [];
        $levels = OrganizationLevel::all();

        foreach ($levels as $level) {
            $statistics[$level->slug] = [
                'count' => $countsGrouped[$level->slug] ?? 0,
                'label' => $this->getLevelDisplayName($level->slug),
                'slug'  => $level->slug,
                'color' => $this->getLevelColor($level->slug),
            ];
        }

        return [
            'total' => $total,
            'statistics' => $statistics,
        ];
    }

    private function broadcastDashboardUpdate(): void
    {
        try {
            $stats = $this->getStatistics();
            broadcast(new DashboardMemberCountUpdated($stats['total'], $stats['statistics'], []))->toOthers();
        } catch (\Exception $e) {
            Log::error('Failed to broadcast dashboard: ' . $e->getMessage());
        }
    }

    private function getLevelDisplayName(string $slug): string
    {
        $names = ['pc' => 'PCNU', 'mwc' => 'MWCNU', 'ranting' => 'RANTING', 'anak_ranting' => 'ANAK RANTING', 'lembaga' => 'LEMBAGA', 'banom' => 'BANOM'];
        return $names[$slug] ?? strtoupper($slug);
    }

    private function getLevelColor(string $slug): string
    {
        $colors = ['pc' => 'purple', 'mwc' => 'blue', 'ranting' => 'green', 'anak_ranting' => 'teal', 'lembaga' => 'orange', 'banom' => 'pink'];
        return $colors[$slug] ?? 'gray';
    }

    private function extractFilters(Request $request): array
    {
        return [
            'search'               => trim((string) $request->query('search')),
            'organization_id'      => $request->query('organization_id'),
            'organization_type_id' => $request->query('organization_type_id'),
            'jabatan_id'           => $request->query('jabatan_id'),
            'is_active'            => $request->query('is_active'),
            'level_slug'           => $request->query('level_slug'),
            'per_page'             => min((int) $request->query('per_page', 10), 100),
            'page'                 => (int) $request->query('page', 1),
        ];
    }

    private function buildAnggotaQuery(array $filters)
    {
        $authUser = $this->authUser();
        $query = Anggota::withRelations()->accessibleByUser($authUser);

        if ($filters['search']) {
            $query->search($filters['search']);
        }

        if ($filters['organization_id']) {
            $query->byOrganization((int) $filters['organization_id']);
        }

        if ($filters['organization_type_id']) {
            $query->whereHas('organization', function ($q) use ($filters) {
                $q->where('organization_type_id', $filters['organization_type_id']);
            });
        }

        if ($filters['jabatan_id']) {
            $query->byJabatan((int) $filters['jabatan_id']);
        }

        if ($filters['is_active'] !== null && $filters['is_active'] !== '') {
            $isActive = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
            $isActive ? $query->active() : $query->where('is_active', false);
        }

        if ($filters['level_slug']) {
            $query->byLevel($filters['level_slug']);
        }

        return $query->orderBy('nama', 'asc');
    }

    private function generateNoAnggota(array $data): string
    {
        if (!empty($data['no_anggota'])) {
            if (Anggota::where('no_anggota', $data['no_anggota'])->exists()) {
                throw new \Exception('Nomor anggota sudah terdaftar.');
            }
            return $data['no_anggota'];
        }

        $year = date('Y');
        $last = Anggota::where('no_anggota', 'LIKE', "NU-{$year}-%")
            ->orderByDesc('id')
            ->first();

        $nextNumber = $last ? (int) explode('-', $last->no_anggota)[2] + 1 : 1;

        return sprintf('NU-%s-%06d', $year, $nextNumber);
    }

    private function validateNoAnggota(array $data, Anggota $anggota): string
    {
        if (!empty($data['no_anggota']) && $data['no_anggota'] !== $anggota->no_anggota) {
            if (Anggota::where('no_anggota', $data['no_anggota'])->where('id', '!=', $anggota->id)->exists()) {
                throw new \Exception('Nomor anggota sudah terdaftar.');
            }
            return $data['no_anggota'];
        }

        return $anggota->no_anggota;
    }

    public function validateNoAnggotaExists(string $noAnggota, ?int $excludeId = null): bool
    {
        $query = Anggota::where('no_anggota', $noAnggota);
        if ($excludeId) $query->where('id', '!=', $excludeId);
        return !$query->exists();
    }

    /**
     * FIX KEY CACHE: Mengisolasi key cache berdasarkan User ID & Organization ID agar tidak bocor silang browser/role
     */
    private function getCacheKey(string $key, array $params = []): string
    {
        $userId = Auth::id() ?? 'guest';
        $orgId = Auth::user()?->organization_id ?? 'none';
        
        // Menggabungkan konteks kepemilikan struktur data ke string hash md5
        $context = [
            'u' => $userId,
            'o' => $orgId,
            'p' => $params
        ];

        return self::CACHE_PREFIX . $key . '_' . md5(json_encode($context));
    }

    public function clearCache(): void
    {
        try {
            Cache::forget('accessible_orgs_u' . Auth::id());
            Log::info('Cache Anggota cleared for user session.');
        } catch (\Exception $e) {
            Log::warning('Failed to clear cache: ' . $e->getMessage());
        }
    }
}