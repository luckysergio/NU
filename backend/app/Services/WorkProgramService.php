<?php

namespace App\Services;

use App\Models\User;
use App\Models\WorkProgram;
use App\Models\Organization;
use App\Models\ProgramTheme;
use App\Events\WorkProgramCreated;
use App\Events\WorkProgramUpdated;
use App\Events\WorkProgramDeleted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Auth\Access\AuthorizationException;

class WorkProgramService
{
    protected const CACHE_DURATION = 600; // 10 menit
    protected const CACHE_PREFIX = 'work-programs:';
    protected const CACHE_TRACKER_KEY = 'work-programs:active_keys';

    /*
    |--------------------------------------------------------------------------
    | AUTH USER
    |--------------------------------------------------------------------------
    */

    protected function authUser(): ?User
    {
        /** @var User|null */
        return Auth::user();
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL - ✅ DENGAN CACHE & OPTIMIZED QUERY
    |--------------------------------------------------------------------------
    */

    public function getAll(Request $request)
    {
        $filters = $this->extractFilters($request);
        $bypassCache = $request->query('bypass_cache', false);
        
        // ✅ Bypass cache jika ada parameter _t atau bypass_cache
        if ($bypassCache || $request->query('_t')) {
            return $this->buildWorkProgramQuery($filters)->paginate($filters['per_page']);
        }

        $cacheKey = $this->getCacheKey('list', $filters);
        
        return $this->rememberCache($cacheKey, function () use ($filters) {
            $workPrograms = $this->buildWorkProgramQuery($filters)->paginate($filters['per_page']);
            
            // ✅ Batch add statistics untuk performa
            foreach ($workPrograms->items() as $program) {
                $this->addWorkProgramStatistics($program);
            }
            
            return $workPrograms;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | BUILD QUERY - ✅ OPTIMIZED
    |--------------------------------------------------------------------------
    */

    private function buildWorkProgramQuery(array $filters)
    {
        /** @var User|null $authUser */
        $authUser = $this->authUser();

        $query = WorkProgram::with([
            'organization:id,nama,parent_id,organization_level_id',
            'organization.level:id,nama,slug',
            'theme:id,nama,periode',
            'field:id,nama',
            'target:id,nama',
            'goal:id,nama',
            'creator:id,name',
            'activities:id,work_program_id,nama_kegiatan,organization_id',
        ]);

        // ✅ Search dengan LOWER() untuk case-insensitive
        if (!empty($filters['search'])) {
            $search = strtolower($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(nama_program) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(deskripsi) LIKE ?', ["%{$search}%"]);
            });
        }

        // ✅ Filter Tahun
        if (!empty($filters['tahun'])) {
            $query->where('tahun', $filters['tahun']);
        }

        // ✅ Filter Status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // ✅ Filter Theme
        if (!empty($filters['theme_id'])) {
            $query->where('theme_id', $filters['theme_id']);
        }

        // ✅ Hak Akses Organisasi
        if ($authUser) {
            $organization = $authUser->organization;

            if ($authUser->isSuperAdmin()) {
                // Super Admin: lihat semua
            } elseif (!$organization) {
                $query->whereRaw('1 = 0');
            } elseif ($authUser->isPC()) {
                $query->whereHas('organization', function ($q) use ($organization) {
                    $q->where('parent_id', $organization->id);
                });
            } elseif ($authUser->isMWC()) {
                $query->where('organization_id', $organization->id);
            } elseif ($authUser->isRanting()) {
                $allowedIds = [$organization->id];
                if ($organization->parent_id) {
                    $allowedIds[] = $organization->parent_id;
                }
                $query->whereIn('organization_id', array_unique($allowedIds));
            } elseif ($authUser->isLembaga() || $authUser->isBanom()) {
                $query->where('organization_id', $organization->id);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        // ✅ Filter organization tambahan (hanya untuk Super Admin)
        if (!empty($filters['organization_id']) && $authUser?->isSuperAdmin()) {
            $query->where('organization_id', $filters['organization_id']);
        }

        // ✅ Order by optimized
        return $query
            ->orderBy('created_at', 'desc')
            ->orderBy('nama_program', 'asc');
    }

    /*
    |--------------------------------------------------------------------------
    | FIND BY ID - ✅ DENGAN CACHE
    |--------------------------------------------------------------------------
    */

    public function findById(int $id): WorkProgram
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);
        
        return $this->rememberCache($cacheKey, function () use ($id) {
            $program = WorkProgram::with([
                'organization:id,nama,parent_id,organization_level_id',
                'organization.level:id,nama,slug',
                'theme:id,nama,periode,tanggal_mulai,tanggal_selesai',
                'field:id,nama',
                'target:id,nama',
                'goal:id,nama',
                'creator:id,name,email',
                'activities:id,work_program_id,nama_kegiatan,organization_id,tanggal_pelaksanaan,status',
            ])->findOrFail($id);

            $this->checkAccess($program);
            $this->addWorkProgramStatistics($program);

            return $program;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ADD WORK PROGRAM STATISTICS - ✅ OPTIMIZED
    |--------------------------------------------------------------------------
    */

    private function addWorkProgramStatistics(WorkProgram $program): void
    {
        $activities = $program->activities;

        // ✅ Hitung kegiatan MWC (organization_id sama dengan program)
        $mwcActivitiesCount = $activities->filter(function ($activity) use ($program) {
            return $activity->organization_id === $program->organization_id;
        })->count();

        $totalActivities = $activities->count();

        $mwcOrganization = $program->organization;

        if ($mwcOrganization && $mwcOrganization->isMWC()) {
            // ✅ Optimized query dengan select() untuk limit kolom
            $rantingOrganizations = Organization::where('parent_id', $mwcOrganization->id)
                ->whereHas('level', function ($q) {
                    $q->where('slug', 'ranting');
                })
                ->select('id', 'nama', 'parent_id')
                ->with(['activities' => function ($q) use ($program) {
                    $q->select('id', 'work_program_id', 'organization_id', 'nama_kegiatan')
                        ->where('work_program_id', $program->id);
                }])
                ->get();

            $rantingStatus = [];
            $totalRantingActivities = 0;

            foreach ($rantingOrganizations as $ranting) {
                $rantingActivities = $ranting->activities->filter(function ($activity) use ($program) {
                    return $activity->work_program_id === $program->id;
                });

                $activityCount = $rantingActivities->count();
                $totalRantingActivities += $activityCount;

                $rantingStatus[] = [
                    'id' => $ranting->id,
                    'nama' => $ranting->nama,
                    'level' => 'Ranting',
                    'level_slug' => 'ranting',
                    'has_activities' => $activityCount > 0,
                    'activities_count' => $activityCount,
                    'status' => $activityCount > 0 ? 'SUDAH ADA KEGIATAN' : 'BELUM ADA KEGIATAN',
                    'status_color' => $activityCount > 0 ? 'green' : 'gray',
                ];
            }

            $program->statistics = [
                'total_activities' => $totalActivities,
                'mwc_activities_count' => $mwcActivitiesCount,
                'total_ranting_activities' => $totalRantingActivities,
                'ranting_status' => $rantingStatus,
                'mwc_organization' => [
                    'id' => $mwcOrganization->id,
                    'nama' => $mwcOrganization->nama,
                ],
            ];

            $program->mwc_activities_count = $mwcActivitiesCount;
        } else {
            $program->statistics = [
                'total_activities' => $totalActivities,
                'mwc_activities_count' => $mwcActivitiesCount,
                'ranting_status' => [],
            ];

            $program->mwc_activities_count = $mwcActivitiesCount;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET PROGRAM STATISTICS FOR MWC
    |--------------------------------------------------------------------------
    */

    public function getProgramStatisticsForMWC(int $programId): array
    {
        $program = WorkProgram::with([
            'organization:id,nama',
            'activities:id,work_program_id,organization_id,nama_kegiatan,tanggal_pelaksanaan',
        ])->findOrFail($programId);

        $this->checkAccess($program);

        $mwcOrganization = $program->organization;

        if (!$mwcOrganization || !$mwcOrganization->isMWC()) {
            return [
                'program_id' => $program->id,
                'program_name' => $program->nama_program,
                'total_activities' => $program->activities->count(),
                'mwc_activities_count' => 0,
                'ranting_status' => [],
                'message' => 'Program kerja ini bukan milik MWC',
            ];
        }

        $mwcActivitiesCount = $program->activities->filter(function ($activity) use ($program) {
            return $activity->organization_id === $program->organization_id;
        })->count();

        $rantingOrganizations = Organization::where('parent_id', $mwcOrganization->id)
            ->whereHas('level', function ($q) {
                $q->where('slug', 'ranting');
            })
            ->select('id', 'nama')
            ->with(['activities' => function ($q) use ($program) {
                $q->select('id', 'work_program_id', 'organization_id', 'nama_kegiatan', 'tanggal_pelaksanaan')
                    ->where('work_program_id', $program->id);
            }])
            ->get();

        $rantingStatus = [];
        $totalRantingActivities = 0;

        foreach ($rantingOrganizations as $ranting) {
            $rantingActivities = $ranting->activities->filter(function ($activity) use ($program) {
                return $activity->work_program_id === $program->id;
            });

            $activityCount = $rantingActivities->count();
            $totalRantingActivities += $activityCount;

            $rantingStatus[] = [
                'id' => $ranting->id,
                'nama' => $ranting->nama,
                'has_activities' => $activityCount > 0,
                'activities_count' => $activityCount,
                'activities' => $rantingActivities->map(function ($activity) {
                    return [
                        'id' => $activity->id,
                        'nama_kegiatan' => $activity->nama_kegiatan,
                        'tanggal_pelaksanaan' => $activity->tanggal_pelaksanaan,
                    ];
                }),
                'status' => $activityCount > 0 ? 'SUDAH ADA KEGIATAN' : 'BELUM ADA KEGIATAN',
            ];
        }

        return [
            'program_id' => $program->id,
            'program_name' => $program->nama_program,
            'mwc_organization' => [
                'id' => $mwcOrganization->id,
                'nama' => $mwcOrganization->nama,
            ],
            'total_activities' => $program->activities->count(),
            'mwc_activities_count' => $mwcActivitiesCount,
            'total_ranting_activities' => $totalRantingActivities,
            'ranting_status' => $rantingStatus,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | STORE - ✅ DENGAN CACHE CLEAR & BROADCAST
    |--------------------------------------------------------------------------
    */

    public function store(array $data, Request $request): WorkProgram
    {
        return DB::transaction(function () use ($data, $request) {
            /** @var User|null $authUser */
            $authUser = $this->authUser();

            // ✅ Force organization_id berdasarkan role user
            if ($authUser && ($authUser->isMWC() || $authUser->isRanting() || $authUser->isLembaga() || $authUser->isBanom())) {
                $data['organization_id'] = $authUser->organization_id;
            }

            if ($authUser && $authUser->isAdmin() && $authUser->isMWC()) {
                $data['organization_id'] = $authUser->organization_id;
            }

            $this->validateOrganizationAccess($data['organization_id']);

            $program = WorkProgram::create([
                'organization_id' => $data['organization_id'],
                'theme_id' => $data['theme_id'] ?? null,
                'field_id' => $data['field_id'],
                'target_id' => $data['target_id'],
                'goal_id' => $data['goal_id'],
                'nama_program' => $data['nama_program'],
                'deskripsi' => $data['deskripsi'] ?? null,
                'tahun' => $data['tahun'],
                'status' => $data['status'] ?? 'draft',
                'created_by' => Auth::id(),
            ]);

            // ✅ Load relations lengkap
            $program->load([
                'organization.level',
                'theme',
                'field',
                'target',
                'goal',
                'creator',
                'activities',
            ]);

            $this->addWorkProgramStatistics($program);

            // ✅ Clear cache DULU
            $this->clearCache();

            // ✅ Broadcast event untuk realtime chart
            broadcast(new WorkProgramCreated($program))->toOthers();

            return $program;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE - ✅ DENGAN CACHE CLEAR & BROADCAST
    |--------------------------------------------------------------------------
    */

    public function update(int $id, array $data, Request $request): WorkProgram
    {
        return DB::transaction(function () use ($id, $data, $request) {
            $program = WorkProgram::findOrFail($id);

            $this->checkAccess($program);

            /** @var User|null $authUser */
            $authUser = $this->authUser();

            if ($authUser && ($authUser->isMWC() || $authUser->isRanting() || $authUser->isLembaga() || $authUser->isBanom())) {
                $data['organization_id'] = $authUser->organization_id;
            }

            if ($authUser && $authUser->isAdmin() && $authUser->isMWC()) {
                $data['organization_id'] = $authUser->organization_id;
            }

            $this->validateOrganizationAccess($data['organization_id']);

            $program->update([
                'organization_id' => $data['organization_id'],
                'theme_id' => $data['theme_id'] ?? null,
                'field_id' => $data['field_id'],
                'target_id' => $data['target_id'],
                'goal_id' => $data['goal_id'],
                'nama_program' => $data['nama_program'],
                'deskripsi' => $data['deskripsi'] ?? null,
                'tahun' => $data['tahun'],
                'status' => $data['status'],
            ]);

            // ✅ Load relations lengkap
            $program->load([
                'organization.level',
                'theme',
                'field',
                'target',
                'goal',
                'creator',
                'activities',
            ]);

            $this->addWorkProgramStatistics($program);

            // ✅ Clear cache DULU
            $this->clearCache();

            // ✅ Broadcast event untuk realtime chart
            broadcast(new WorkProgramUpdated($program))->toOthers();

            return $program;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DESTROY - ✅ DENGAN CACHE CLEAR & BROADCAST
    |--------------------------------------------------------------------------
    */

    public function destroy(int $id, Request $request): bool
    {
        return DB::transaction(function () use ($id, $request) {
            $program = WorkProgram::findOrFail($id);

            $this->checkAccess($program);

            // ✅ Simpan data sebelum delete untuk event payload
            $themeId = $program->theme_id;
            $organizationId = $program->organization_id;

            // ✅ Hapus activities terlebih dahulu
            $program->activities()->delete();

            $program->delete();

            // ✅ Clear cache DULU
            $this->clearCache();

            // ✅ Broadcast event untuk realtime chart
            broadcast(new WorkProgramDeleted($id, $themeId, $organizationId))->toOthers();

            return true;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK PROGRAM ACCESS
    |--------------------------------------------------------------------------
    */

    protected function checkAccess(WorkProgram $program): void
    {
        /** @var User|null $authUser */
        $authUser = $this->authUser();

        if (!$authUser) {
            throw new AuthorizationException('Unauthorized');
        }

        if ($authUser->isSuperAdmin()) {
            return;
        }

        if ($authUser->isAdmin() && $authUser->isPC()) {
            $programOrg = $program->organization;
            if (!$programOrg || $programOrg->parent_id !== $authUser->organization_id) {
                throw new AuthorizationException('Anda tidak memiliki akses ke program kerja ini');
            }
            return;
        }

        if ($authUser->isAdmin() && $authUser->isMWC()) {
            if ($program->organization_id !== $authUser->organization_id) {
                throw new AuthorizationException('Anda hanya dapat mengakses program kerja organisasi Anda sendiri');
            }
            return;
        }

        if ($authUser->isAdmin()) {
            if ($program->organization_id !== $authUser->organization_id) {
                throw new AuthorizationException('Anda hanya dapat mengakses program kerja organisasi Anda sendiri');
            }
            return;
        }

        if ($authUser->isPC()) {
            $programOrg = $program->organization;
            if (!$programOrg || $programOrg->parent_id !== $authUser->organization_id) {
                throw new AuthorizationException('Anda tidak memiliki akses ke program kerja ini');
            }
            return;
        }

        if ($authUser->isRanting()) {
            $programOrg = $program->organization;
            if (!$programOrg || $programOrg->id !== $authUser->organization->parent_id) {
                throw new AuthorizationException('Anda tidak memiliki akses ke program kerja ini');
            }
            return;
        }

        if (($authUser->isMWC() || $authUser->isLembaga() || $authUser->isBanom())
            && $program->organization_id !== $authUser->organization_id
        ) {
            throw new AuthorizationException('Anda hanya dapat mengakses program kerja organisasi Anda sendiri');
        }
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE ORGANIZATION ACCESS
    |--------------------------------------------------------------------------
    */

    protected function validateOrganizationAccess(int $organizationId): void
    {
        /** @var User|null $authUser */
        $authUser = $this->authUser();

        if (!$authUser) {
            throw new AuthorizationException('Unauthorized');
        }

        if ($authUser->isSuperAdmin()) {
            return;
        }

        if ($authUser->isAdmin() && $authUser->isPC()) {
            $org = Organization::find($organizationId);
            if (!$org || $org->parent_id !== $authUser->organization_id) {
                throw new AuthorizationException('Anda hanya dapat membuat program kerja untuk MWC di bawah organisasi Anda');
            }
            return;
        }

        if ($authUser->isAdmin() && $authUser->isMWC() && $authUser->organization_id !== $organizationId) {
            throw new AuthorizationException('Anda hanya dapat membuat program kerja untuk organisasi Anda sendiri');
        }

        if ($authUser->isAdmin() && $authUser->organization_id !== $organizationId) {
            throw new AuthorizationException('Anda hanya dapat membuat program kerja untuk organisasi Anda sendiri');
        }

        if (($authUser->isMWC() || $authUser->isLembaga() || $authUser->isBanom())
            && $authUser->organization_id !== $organizationId
        ) {
            throw new AuthorizationException('Anda hanya dapat membuat program kerja untuk organisasi Anda sendiri');
        }

        if ($authUser->isRanting()) {
            throw new AuthorizationException('Ranting tidak dapat membuat program kerja. Hanya dapat membuat kegiatan.');
        }

        if ($authUser->isPC()) {
            $org = Organization::find($organizationId);
            if (!$org || $org->parent_id !== $authUser->organization_id) {
                throw new AuthorizationException('Anda hanya dapat membuat program kerja untuk MWC di bawah organisasi Anda');
            }
            return;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET AVAILABLE THEMES FOR MWC
    |--------------------------------------------------------------------------
    */

    public function getAvailableThemesForMWC(): array
    {
        $authUser = Auth::user();

        if (!$authUser) {
            throw new AuthorizationException('Unauthorized');
        }

        $organizationId = $authUser->organization_id;

        if (!$organizationId) {
            return [
                'available_themes' => [],
                'total_themes' => 0,
                'used_themes' => 0,
                'available_count' => 0,
            ];
        }

        $usedThemeIds = WorkProgram::query()
            ->where('organization_id', $organizationId)
            ->whereNotNull('theme_id')
            ->distinct()
            ->pluck('theme_id');

        $availableThemes = ProgramTheme::query()
            ->where('is_active', true)
            ->whereNotIn('id', $usedThemeIds)
            ->orderBy('nama')
            ->get();

        $totalActiveThemes = ProgramTheme::where('is_active', true)->count();
        $usedActiveThemes = ProgramTheme::where('is_active', true)
            ->whereIn('id', $usedThemeIds)
            ->count();

        return [
            'organization_id' => $organizationId,
            'used_theme_ids' => $usedThemeIds,
            'available_themes' => $availableThemes,
            'total_themes' => $totalActiveThemes,
            'used_themes' => $usedActiveThemes,
            'available_count' => $availableThemes->count(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | CACHE ENGINE - SAMA DENGAN OrganizationService & AnggotaService
    |--------------------------------------------------------------------------
    */

    private function extractFilters(Request $request): array
    {
        return [
            'search' => trim((string) $request->query('search')),
            'tahun' => $request->query('tahun'),
            'status' => $request->query('status'),
            'theme_id' => $request->query('theme_id'),
            'organization_id' => $request->query('organization_id'),
            'per_page' => min((int) $request->input('per_page', 10), 100),
            'page' => (int) $request->query('page', 1),
        ];
    }

    private function getCacheKey(string $key, array $params = []): string
    {
        $userId = Auth::id() ?? 'guest';
        $paramString = !empty($params) ? '_' . md5(json_encode($params)) : '';
        return self::CACHE_PREFIX . $userId . ':' . $key . $paramString;
    }

    /**
     * ✅ Remember cache dengan tracker (sama seperti OrganizationService)
     */
    private function rememberCache(string $key, \Closure $callback)
    {
        $activeKeys = Cache::get(self::CACHE_TRACKER_KEY, []);
        if (!in_array($key, $activeKeys)) {
            $activeKeys[] = $key;
            Cache::put(self::CACHE_TRACKER_KEY, $activeKeys, now()->addDays(7));
        }

        return Cache::remember($key, self::CACHE_DURATION, $callback);
    }

    /**
     * ✅ Clear cache menggunakan tracker
     */
    public function clearCache(): void
    {
        $activeKeys = Cache::get(self::CACHE_TRACKER_KEY, []);
        
        foreach ($activeKeys as $key) {
            Cache::forget($key);
        }

        Cache::forget(self::CACHE_TRACKER_KEY);
        
        Log::info('Targeted work program cache cleared successfully.');
    }
}