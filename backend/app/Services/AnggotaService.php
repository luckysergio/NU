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
    protected const CACHE_DURATION = 600;
    protected const CACHE_PREFIX = 'anggota:';
    protected const CACHE_TRACKER_KEY = 'anggota:active_keys';
    
    protected const MAX_FILE_SIZE = 2048;
    protected const IMAGE_QUALITY = 80;
    protected const IMAGE_MAX_WIDTH = 800;
    protected const IMAGE_MAX_HEIGHT = 800;

    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    protected function authUser(): ?User
    {
        return Auth::user();
    }

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

    protected function validateEnumValues(array $data): void
    {
        if (!empty($data['jenis_kelamin']) && !in_array($data['jenis_kelamin'], Anggota::JENIS_KELAMIN)) {
            throw new \Exception('Jenis kelamin tidak valid.');
        }

        if (!empty($data['status_perkawinan']) && !in_array($data['status_perkawinan'], Anggota::STATUS_PERKAWINAN)) {
            throw new \Exception('Status perkawinan tidak valid.');
        }

        if (!empty($data['pendidikan']) && !in_array($data['pendidikan'], Anggota::PENDIDIKAN)) {
            throw new \Exception('Pendidikan tidak valid.');
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
        
        return $this->rememberCache($cacheKey, function () use ($filters) {
            return $this->buildAnggotaQuery($filters)->paginate($filters['per_page']);
        });
    }

    public function findById(int $id): Anggota
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);
        
        return $this->rememberCache($cacheKey, function () use ($id) {
            $anggota = Anggota::withRelations()->findOrFail($id);
            $this->validateOrganizationAccess($anggota->organization_id);
            return $anggota;
        });
    }

    public function store(array $data, Request $request): Anggota
    {
        return DB::transaction(function () use ($data, $request) {
            $this->validateOrganizationAccess($data['organization_id']);
            
            if (empty($data['no_anggota'])) {
                throw new \Exception('Nomor anggota wajib diisi.');
            }
            
            if (Anggota::where('no_anggota', $data['no_anggota'])->exists()) {
                throw new \Exception('Nomor anggota sudah terdaftar.');
            }

            $this->validateEnumValues($data);

            $fotoPath = null;
            if ($request->hasFile('foto')) {
                $fotoPath = $this->uploadPhoto($request->file('foto'));
            }

            $anggota = Anggota::create([
                'organization_id' => $data['organization_id'],
                'jabatan_id' => $data['jabatan_id'] ?? null,
                'no_anggota' => $data['no_anggota'],
                'nama' => $data['nama'],
                'jenis_kelamin' => $data['jenis_kelamin'] ?? null,
                'status_perkawinan' => $data['status_perkawinan'] ?? null,
                'pendidikan' => $data['pendidikan'] ?? null,
                'no_hp' => $data['no_hp'] ?? null,
                'alamat' => $data['alamat'] ?? null,
                'deskripsi' => $data['deskripsi'] ?? null,
                'foto' => $fotoPath,
                'is_active' => $data['is_active'] ?? true,
            ]);

            $this->clearCache();
            
            $this->dashboardService->clearAllCache();

            $anggota = $anggota->load(['organization.level', 'jabatan']);

            broadcast(new AnggotaCreated($anggota))->toOthers();
            $this->broadcastDashboardUpdate();

            return $anggota;
        });
    }

    public function update(int $id, array $data, Request $request): Anggota
    {
        return DB::transaction(function () use ($id, $data, $request) {
            $anggota = Anggota::findOrFail($id);
            $this->validateOrganizationAccess($data['organization_id']);
            
            if (empty($data['no_anggota'])) {
                throw new \Exception('Nomor anggota wajib diisi.');
            }
            
            if ($data['no_anggota'] !== $anggota->no_anggota) {
                if (Anggota::where('no_anggota', $data['no_anggota'])
                    ->where('id', '!=', $anggota->id)
                    ->exists()) {
                    throw new \Exception('Nomor anggota sudah terdaftar.');
                }
            }

            $this->validateEnumValues($data);

            $fotoPath = $anggota->foto;
            if ($request->hasFile('foto')) {
                if ($anggota->foto) {
                    Storage::disk('public')->delete($anggota->foto);
                }
                $fotoPath = $this->uploadPhoto($request->file('foto'));
            }

            $anggota->update([
                'organization_id' => $data['organization_id'],
                'jabatan_id' => $data['jabatan_id'] ?? null,
                'no_anggota' => $data['no_anggota'],
                'nama' => $data['nama'],
                'jenis_kelamin' => $data['jenis_kelamin'] ?? null,
                'status_perkawinan' => $data['status_perkawinan'] ?? null,
                'pendidikan' => $data['pendidikan'] ?? null,
                'no_hp' => $data['no_hp'] ?? null,
                'alamat' => $data['alamat'] ?? null,
                'deskripsi' => $data['deskripsi'] ?? null,
                'foto' => $fotoPath,
                'is_active' => $data['is_active'] ?? true,
            ]);

            $this->clearCache();
            
            $this->dashboardService->clearAllCache();

            $anggota = $anggota->fresh(['organization.level', 'jabatan']);

            broadcast(new AnggotaUpdated($anggota))->toOthers();
            $this->broadcastDashboardUpdate();

            return $anggota;
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
            
            $this->dashboardService->clearAllCache();

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
        $total = Anggota::query()
            ->where('anggotas.is_active', true)
            ->count();

        $countsGrouped = Anggota::query()
            ->where('anggotas.is_active', true)
            ->join('organizations', 'anggotas.organization_id', '=', 'organizations.id')
            ->join('organization_levels', 'organizations.organization_level_id', '=', 'organization_levels.id')
            ->select(
                'organization_levels.slug', 
                DB::raw('count(anggotas.id) as total_count')
            )
            ->groupBy('organization_levels.slug', 'organization_levels.id')
            ->pluck('total_count', 'organization_levels.slug')
            ->toArray();

        $statistics = [];
        $totals = [];
        $levels = OrganizationLevel::all();

        foreach ($levels as $level) {
            $count = $countsGrouped[$level->slug] ?? 0;
            
            $statistics[$level->slug] = [
                'count' => $count,
                'display' => $this->getLevelDisplayName($level->slug),
                'name' => $level->nama,
                'slug' => $level->slug,
                'color' => $this->getLevelColor($level->slug),
            ];
            
            $totals[$level->slug] = $count;
        }
        
        $totals['total'] = $total;

        return [
            'total' => $total,
            'statistics' => $statistics,
            'totals' => $totals,
        ];
    }

    public function getUserStatistics(): array
    {
        $authUser = $this->authUser();
        
        $total = Anggota::query()
            ->where('anggotas.is_active', true)
            ->accessibleByUser($authUser)
            ->count();

        $countsGrouped = Anggota::query()
            ->where('anggotas.is_active', true)
            ->accessibleByUser($authUser)
            ->join('organizations', 'anggotas.organization_id', '=', 'organizations.id')
            ->join('organization_levels', 'organizations.organization_level_id', '=', 'organization_levels.id')
            ->select(
                'organization_levels.slug', 
                DB::raw('count(anggotas.id) as total_count')
            )
            ->groupBy('organization_levels.slug', 'organization_levels.id')
            ->pluck('total_count', 'organization_levels.slug')
            ->toArray();

        $statistics = [];
        $totals = [];
        $levels = OrganizationLevel::all();

        foreach ($levels as $level) {
            $count = $countsGrouped[$level->slug] ?? 0;
            
            $statistics[$level->slug] = [
                'count' => $count,
                'display' => $this->getLevelDisplayName($level->slug),
                'name' => $level->nama,
                'slug' => $level->slug,
                'color' => $this->getLevelColor($level->slug),
            ];
            
            $totals[$level->slug] = $count;
        }
        
        $totals['total'] = $total;

        return [
            'total' => $total,
            'statistics' => $statistics,
            'totals' => $totals,
        ];
    }

    private function broadcastDashboardUpdate(): void
    {
        try {
            $stats = $this->getStatistics();
            
            broadcast(new DashboardMemberCountUpdated(
                $stats['total'], 
                $stats['statistics'], 
                $stats['totals']
            ))->toOthers();
            
        } catch (\Exception $e) {
            Log::error('Failed to broadcast dashboard: ' . $e->getMessage());
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
            'banom' => 'BANOM'
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
            'banom' => 'pink'
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
            'jenis_kelamin' => $request->query('jenis_kelamin'),
            'status_perkawinan' => $request->query('status_perkawinan'),
            'pendidikan' => $request->query('pendidikan'),
            'per_page' => min((int) $request->query('per_page', 10), 1000),
            'page' => (int) $request->query('page', 1),
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
            $query->where('anggotas.is_active', $isActive);
        }

        if ($filters['level_slug']) {
            $query->byLevel($filters['level_slug']);
        }

        if ($filters['jenis_kelamin']) {
            $query->byJenisKelamin($filters['jenis_kelamin']);
        }

        if ($filters['status_perkawinan']) {
            $query->byStatusPerkawinan($filters['status_perkawinan']);
        }

        if ($filters['pendidikan']) {
            $query->byPendidikan($filters['pendidikan']);
        }

        return $query->orderBy('anggotas.nama', 'asc');
    }

    public function validateNoAnggotaExists(string $noAnggota, ?int $excludeId = null): bool
    {
        $query = Anggota::where('no_anggota', $noAnggota);
        if ($excludeId) $query->where('id', '!=', $excludeId);
        return !$query->exists();
    }

    private function getCacheKey(string $key, array $params = []): string
    {
        $userId = Auth::id() ?? 'guest';
        $paramString = !empty($params) ? '_' . md5(json_encode($params)) : '';
        return self::CACHE_PREFIX . $userId . ':' . $key . $paramString;
    }

    private function rememberCache(string $key, \Closure $callback)
    {
        $activeKeys = Cache::get(self::CACHE_TRACKER_KEY, []);
        if (!in_array($key, $activeKeys)) {
            $activeKeys[] = $key;
            Cache::put(self::CACHE_TRACKER_KEY, $activeKeys, now()->addDays(7));
        }

        return Cache::remember($key, self::CACHE_DURATION, $callback);
    }

    public function clearCache(): void
    {
        $activeKeys = Cache::get(self::CACHE_TRACKER_KEY, []);
        
        foreach ($activeKeys as $key) {
            Cache::forget($key);
        }

        Cache::forget(self::CACHE_TRACKER_KEY);
        
        $userId = Auth::id();
        if ($userId) {
            Cache::forget('accessible_orgs_u' . $userId);
        }
        
        Log::info('Targeted anggota cache cleared successfully.');
    }
}