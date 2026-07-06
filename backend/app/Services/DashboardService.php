<?php

namespace App\Services;

use App\Models\Anggota;
use App\Models\Organization;
use App\Models\OrganizationLevel;
use App\Models\WorkProgram;
use App\Models\ProgramTheme;
use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DashboardService
{
    protected const CACHE_DURATION = 300;
    protected const CACHE_PREFIX = 'dashboard_';
    protected const DEFAULT_PC_ORGANIZATION_ID = 1;

    public function index(): array
    {
        return [
            'organizations' => $this->organizationSummary(),
            'members' => $this->memberSummary(),
            'programs' => $this->programSummary(),
        ];
    }

    /**
     * ✅ Get statistics khusus untuk Program Theme Broadcast
     */
    public function getProgramThemeStatistics(): array
    {
        $activeThemes = ProgramTheme::where('is_active', true)
            ->with(['organization'])
            ->get();

        $totalThemes = $activeThemes->count();

        $themesData = $activeThemes->map(function ($theme) {
            return [
                'id' => $theme->id,
                'nama' => $theme->nama,
                'organization_id' => $theme->organization_id,
                'organization_name' => $theme->organization?->nama,
                'tanggal_mulai' => $theme->tanggal_mulai,
                'tanggal_selesai' => $theme->tanggal_selesai,
            ];
        })->toArray();

        $statistics = [
            'total_active' => $totalThemes,
            'total_inactive' => ProgramTheme::where('is_active', false)->count(),
            'total_all' => ProgramTheme::count(),
        ];

        return [
            'total_themes' => $totalThemes,
            'active_themes' => $themesData,
            'statistics' => $statistics,
        ];
    }

    /**
     * ✅ PERBAIKAN: Tambahkan data tema untuk realtime
     */
    public function getStatistics(): array
    {
        $organizationSummary = $this->organizationSummary();
        $memberSummary = $this->memberSummary();
        $user = Auth::user();
        
        $totals = [];
        foreach ($organizationSummary['statistics'] as $slug => $data) {
            $totals[$slug] = $data['count'];
        }
        $totals['total'] = $organizationSummary['total'];
        
        $memberStatistics = [];
        $levels = OrganizationLevel::all();
        
        foreach ($levels as $level) {
            $count = Anggota::whereHas('organization.level', function ($query) use ($level) {
                $query->where('organization_levels.id', $level->id);
            })->where('is_active', true)->count();
            
            $memberStatistics[$level->slug] = [
                'count' => $count,
                'label' => $this->getLevelDisplayName($level->slug),
                'slug' => $level->slug,
                'color' => $this->getLevelColor($level->slug),
            ];
        }
        
        $totalWorkPrograms = $this->getTotalWorkPrograms($user);
        $totalActivities = $this->getTotalActivities($user);
        
        $programStats = $this->getProgramThemeStatistics();
        
        return [
            'total_organizations' => $organizationSummary['total'],
            'statistics' => $organizationSummary['statistics'],
            'totals' => $totals,
            'total_members' => $memberSummary['total'] ?? 0,
            'member_statistics' => $memberStatistics,
            'programs' => $this->programSummary(),
            'total_themes' => $programStats['total_themes'],
            'active_themes' => $programStats['active_themes'],
            'program_statistics' => $programStats['statistics'],
            'total_work_programs' => $totalWorkPrograms,
            'total_activities' => $totalActivities,
        ];
    }

    /**
     * ✅ Get organization IDs berdasarkan role user
     */
    protected function getAccessibleOrganizationIds(?User $user): array
    {
        if (!$user) {
            return [];
        }

        if ($this->isSuperAdmin($user)) {
            return $this->getAllOrganizationIdsUnder(self::DEFAULT_PC_ORGANIZATION_ID);
        }

        if ($this->isAdminPC($user)) {
            return $this->getAllOrganizationIdsUnder(self::DEFAULT_PC_ORGANIZATION_ID);
        }

        if ($this->isAdminMWC($user) && $user->organization_id) {
            return $this->getAllOrganizationIdsUnder($user->organization_id);
        }

        if ($this->isAdminRanting($user) && $user->organization_id) {
            return $this->getAllOrganizationIdsUnder($user->organization_id);
        }

        if ($user->organization_id) {
            return [$user->organization_id];
        }

        return [];
    }

    protected function getAllPcOrganizationIds(): array
    {
        return $this->getAllOrganizationIdsUnder(self::DEFAULT_PC_ORGANIZATION_ID);
    }

    /**
     * ✅ PERBAIKAN: Hitung work programs berdasarkan accessible organization IDs
     */
    protected function getTotalWorkPrograms(?User $user): int
    {
        if (!$user) {
            return 0;
        }

        $organizationIds = $this->getAccessibleOrganizationIds($user);
        
        if (empty($organizationIds)) {
            return 0;
        }

        return WorkProgram::whereIn('organization_id', $organizationIds)->count();
    }

    /**
     * ✅ PERBAIKAN: Hitung activities berdasarkan organization_id langsung
     * PC: semua kegiatan dari semua organisasi
     * MWC: semua kegiatan dari MWC + Ranting di bawahnya
     * Ranting: hanya kegiatan dari Ranting-nya sendiri
     */
    protected function getTotalActivities(?User $user): int
    {
        if (!$user) {
            return 0;
        }

        $organizationIds = $this->getAccessibleOrganizationIds($user);
        
        if (empty($organizationIds)) {
            return 0;
        }

        // ✅ BENAR: Cek organization_id langsung dari Activity
        // Activity bisa dibuat oleh MWC atau Ranting, jadi cek langsung
        return Activity::whereIn('organization_id', $organizationIds)->count();
    }

    protected function getAllOrganizationIdsUnder(int $parentId): array
    {
        $ids = [$parentId];
        $children = Organization::where('parent_id', $parentId)->pluck('id')->toArray();
        $ids = array_merge($ids, $children);
        
        foreach ($children as $childId) {
            $descendants = $this->getAllOrganizationIdsUnder($childId);
            $ids = array_merge($ids, $descendants);
        }
        
        return array_unique($ids);
    }

    public function refreshDashboard(): array
    {
        $user = Auth::user();
        
        if ($user) {
            $cacheKey = $this->getCacheKey('organizations', $user);
            Cache::forget($cacheKey);
            
            $cacheKey = $this->getCacheKey('members', $user);
            Cache::forget($cacheKey);
            
            $cacheKey = $this->getCacheKey('programs', $user);
            Cache::forget($cacheKey);
        }

        return [
            'organizations' => $this->organizationSummary(),
            'members' => $this->memberSummary(),
            'programs' => $this->programSummary(),
        ];
    }

    public function refreshThemeChart(int $themeId): array
    {
        $user = Auth::user();
        
        if ($user) {
            $cacheKey = $this->getCacheKey('theme_chart_' . $themeId, $user);
            Cache::forget($cacheKey);
        }

        return $this->getThemeChartData($themeId);
    }

    public function organizationSummary(): array
    {
        $user = Auth::user();
        
        if (!$user) {
            return $this->emptyOrganizationSummary();
        }

        $cacheKey = $this->getCacheKey('organizations', $user);
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($user) {
            $organizationIds = $this->getAllPcOrganizationIds();
            
            if (empty($organizationIds)) {
                return $this->emptyOrganizationSummary();
            }

            return [
                'total' => Organization::whereIn('id', $organizationIds)->count(),
                'statistics' => [
                    'pc' => [
                        'count' => $this->getOrganizationCountByLevel($organizationIds, 'pc'),
                        'label' => 'PCNU',
                        'slug' => 'pc',
                        'color' => 'purple',
                    ],
                    'mwc' => [
                        'count' => $this->getOrganizationCountByLevel($organizationIds, 'mwc'),
                        'label' => 'MWCNU',
                        'slug' => 'mwc',
                        'color' => 'blue',
                    ],
                    'ranting' => [
                        'count' => $this->getOrganizationCountByLevel($organizationIds, 'ranting'),
                        'label' => 'RANTING',
                        'slug' => 'ranting',
                        'color' => 'green',
                    ],
                    'anak_ranting' => [
                        'count' => $this->getOrganizationCountByLevel($organizationIds, 'anak-ranting'),
                        'label' => 'ANAK RANTING',
                        'slug' => 'anak-ranting',
                        'color' => 'teal',
                    ],
                    'lembaga' => [
                        'count' => $this->getOrganizationCountByLevel($organizationIds, 'lembaga'),
                        'label' => 'LEMBAGA',
                        'slug' => 'lembaga',
                        'color' => 'orange',
                    ],
                    'banom' => [
                        'count' => $this->getOrganizationCountByLevel($organizationIds, 'banom'),
                        'label' => 'BANOM',
                        'slug' => 'banom',
                        'color' => 'pink',
                    ],
                ],
            ];
        });
    }

    protected function getOrganizationCountByLevel(array $organizationIds, string $levelSlug): int
    {
        return Organization::whereIn('id', $organizationIds)
            ->whereHas('level', fn($q) => $q->where('slug', $levelSlug))
            ->count();
    }

    protected function emptyOrganizationSummary(): array
    {
        return [
            'total' => 0,
            'statistics' => [
                'pc' => ['count' => 0, 'label' => 'PCNU', 'slug' => 'pc', 'color' => 'purple'],
                'mwc' => ['count' => 0, 'label' => 'MWCNU', 'slug' => 'mwc', 'color' => 'blue'],
                'ranting' => ['count' => 0, 'label' => 'RANTING', 'slug' => 'ranting', 'color' => 'green'],
                'anak_ranting' => ['count' => 0, 'label' => 'ANAK RANTING', 'slug' => 'anak-ranting', 'color' => 'teal'],
                'lembaga' => ['count' => 0, 'label' => 'LEMBAGA', 'slug' => 'lembaga', 'color' => 'orange'],
                'banom' => ['count' => 0, 'label' => 'BANOM', 'slug' => 'banom', 'color' => 'pink'],
            ],
        ];
    }

    protected function memberSummary(): array
    {
        $user = Auth::user();
        
        if (!$user) {
            return ['total' => 0, 'details' => []];
        }

        $cacheKey = $this->getCacheKey('members', $user);
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($user) {
            $organizationIds = $this->getAllPcOrganizationIds();
            
            if (empty($organizationIds)) {
                return ['total' => 0, 'details' => []];
            }
            
            $organizations = Organization::whereIn('id', $organizationIds)
                ->withCount(['anggotas' => fn($q) => $q->where('is_active', true)])
                ->orderBy('nama')
                ->get();

            return [
                'total' => Anggota::whereIn('organization_id', $organizations->pluck('id'))
                    ->where('is_active', true)
                    ->count(),
                'details' => $organizations->map(fn($org) => [
                    'organization_id' => $org->id,
                    'organization' => $org->nama,
                    'total' => $org->anggotas_count,
                ])->values(),
            ];
        });
    }

    protected function programSummary(): Collection
    {
        $user = Auth::user();
        
        if (!$user) {
            return collect([]);
        }

        $cacheKey = $this->getCacheKey('programs', $user);
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($user) {
            $activeThemes = ProgramTheme::where('is_active', true)->get();
            
            if ($activeThemes->isEmpty()) {
                return collect([]);
            }

            $result = collect();
            $organizationIds = $this->getAccessibleOrganizationIds($user);
            
            if (empty($organizationIds)) {
                return collect([]);
            }

            foreach ($activeThemes as $theme) {
                $query = WorkProgram::query();
                $query->with(['theme', 'organization', 'activities'])
                    ->where('theme_id', $theme->id)
                    ->whereIn('organization_id', $organizationIds);

                $workPrograms = $query->get();
                
                $totalProgram = $workPrograms->count();
                $totalKegiatan = $workPrograms->sum(fn($p) => $p->activities->count());
                
                $organizations = $workPrograms
                    ->pluck('organization.nama')
                    ->filter()
                    ->unique()
                    ->values();

                $result->push([
                    'theme_id' => $theme->id,
                    'theme' => $theme->nama,
                    'total_program' => $totalProgram,
                    'total_kegiatan' => $totalKegiatan,
                    'organizations' => $organizations,
                ]);
            }

            return $result;
        });
    }

    public function getThemeStatistics(ProgramTheme $theme): array
    {
        $user = Auth::user();
        $organizationIds = $this->getAccessibleOrganizationIds($user);
        
        if (empty($organizationIds)) {
            return [
                'theme_id' => $theme->id,
                'theme_name' => $theme->nama,
                'theme_period' => $theme->periode,
                'tanggal_mulai' => $theme->tanggal_mulai,
                'tanggal_selesai' => $theme->tanggal_selesai,
                'total_work_programs' => 0,
                'total_activities' => 0,
                'mwc_status' => [],
            ];
        }

        $mwcOrganizations = Organization::whereIn('id', $organizationIds)
            ->whereHas('level', fn($q) => $q->where('slug', 'mwc'))
            ->with(['workPrograms' => fn($q) => $q->where('theme_id', $theme->id)->with('activities')])
            ->orderBy('nama')
            ->get();

        $mwcStatus = [];
        $totalWorkPrograms = 0;
        $totalActivities = 0;

        foreach ($mwcOrganizations as $mwc) {
            $workPrograms = $mwc->workPrograms->filter(fn($wp) => $wp->theme_id === $theme->id);
            $workProgramCount = $workPrograms->count();
            $totalWorkPrograms += $workProgramCount;

            $activitiesCount = 0;
            $activitiesData = [];

            foreach ($workPrograms as $wp) {
                $activitiesCount += $wp->activities->count();
                foreach ($wp->activities as $activity) {
                    $activitiesData[] = [
                        'activity_id' => $activity->id,
                        'activity_name' => $activity->nama_kegiatan,
                        'work_program_id' => $wp->id,
                        'work_program_name' => $wp->nama_program,
                        'tanggal_pelaksanaan' => $activity->tanggal_pelaksanaan,
                    ];
                }
            }

            $totalActivities += $activitiesCount;

            $mwcStatus[] = [
                'mwc_id' => $mwc->id,
                'mwc_name' => $mwc->nama,
                'has_work_program' => $workProgramCount > 0,
                'work_program_count' => $workProgramCount,
                'activities_count' => $activitiesCount,
                'status' => $workProgramCount > 0 ? 'SUDAH MEMBUAT' : 'BELUM MEMBUAT',
                'status_color' => $workProgramCount > 0 ? 'green' : 'gray',
                'work_programs' => $workPrograms->map(fn($wp) => [
                    'id' => $wp->id,
                    'nama_program' => $wp->nama_program,
                    'status' => $wp->status,
                    'activities_count' => $wp->activities->count(),
                ]),
                'activities' => $activitiesData,
            ];
        }

        return [
            'theme_id' => $theme->id,
            'theme_name' => $theme->nama,
            'theme_period' => $theme->periode,
            'tanggal_mulai' => $theme->tanggal_mulai,
            'tanggal_selesai' => $theme->tanggal_selesai,
            'is_active' => $theme->is_active,
            'total_mwc' => $mwcOrganizations->count(),
            'total_work_programs' => $totalWorkPrograms,
            'total_activities' => $totalActivities,
            'mwc_status' => $mwcStatus,
        ];
    }

    public function getThemeChartData(int $themeId): array
    {
        $user = Auth::user();
        $cacheKey = $this->getCacheKey('theme_chart_' . $themeId, $user);
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($themeId, $user) {
            $theme = ProgramTheme::with('organization')->findOrFail($themeId);
            $organizationIds = $this->getAccessibleOrganizationIds($user);
            
            if (empty($organizationIds)) {
                return [
                    'theme_id' => $theme->id,
                    'theme_name' => $theme->nama,
                    'theme_period' => $theme->periode,
                    'labels' => [],
                    'datasets' => [],
                    'mwc_data' => [],
                    'total_mwc' => 0,
                    'total_activities' => 0,
                    'total_programs' => 0,
                ];
            }

            $mwcOrganizations = Organization::whereIn('id', $organizationIds)
                ->whereHas('level', fn($q) => $q->where('slug', 'mwc'))
                ->with(['workPrograms' => fn($q) => $q->where('theme_id', $theme->id)->with('activities')])
                ->orderBy('nama')
                ->get();

            $labels = [];
            $activitiesCount = [];
            $programCount = [];
            $mwcData = [];

            foreach ($mwcOrganizations as $mwc) {
                $workPrograms = $mwc->workPrograms->filter(fn($wp) => $wp->theme_id === $theme->id);
                $workProgramCount = $workPrograms->count();
                $activitiesCountTotal = $workPrograms->sum(fn($wp) => $wp->activities->count());

                $labels[] = $mwc->nama;
                $activitiesCount[] = $activitiesCountTotal;
                $programCount[] = $workProgramCount;

                $mwcData[] = [
                    'mwc_id' => $mwc->id,
                    'mwc_name' => $mwc->nama,
                    'work_program_count' => $workProgramCount,
                    'activities_count' => $activitiesCountTotal,
                    'has_work_program' => $workProgramCount > 0,
                    'work_programs' => $workPrograms->map(fn($wp) => [
                        'id' => $wp->id,
                        'nama_program' => $wp->nama_program,
                        'status' => $wp->status,
                        'activities_count' => $wp->activities->count(),
                    ]),
                ];
            }

            return [
                'theme_id' => $themeId,
                'theme_name' => $theme->nama,
                'theme_period' => $theme->periode,
                'labels' => $labels,
                'datasets' => [
                    [
                        'label' => 'Jumlah Kegiatan',
                        'data' => $activitiesCount,
                        'backgroundColor' => 'rgba(16, 185, 129, 0.7)',
                        'borderColor' => 'rgb(16, 185, 129)',
                        'borderWidth' => 2,
                        'borderRadius' => 4,
                    ],
                    [
                        'label' => 'Jumlah Program Kerja',
                        'data' => $programCount,
                        'backgroundColor' => 'rgba(139, 92, 246, 0.7)',
                        'borderColor' => 'rgb(139, 92, 246)',
                        'borderWidth' => 2,
                        'borderRadius' => 4,
                    ],
                ],
                'mwc_data' => $mwcData,
                'total_mwc' => $mwcOrganizations->count(),
                'total_activities' => array_sum($activitiesCount),
                'total_programs' => array_sum($programCount),
            ];
        });
    }

    protected function applyOrganizationScope(Builder $query): void
    {
        $user = Auth::user();
        
        if (!$user) {
            return;
        }

        $ids = $this->getAllPcOrganizationIds();
        if (!empty($ids)) {
            $query->whereIn('id', $ids);
        }
    }

    protected function applyProgramScope(Builder $query): void
    {
        $user = Auth::user();
        
        if (!$user) {
            return;
        }

        $ids = $this->getAccessibleOrganizationIds($user);
        if (!empty($ids)) {
            $query->whereIn('organization_id', $ids);
        }
    }

    protected function isSuperAdmin(?User $user): bool
    {
        if (!$user) return false;

        if (method_exists($user, 'isSuperAdmin')) {
            return $user->isSuperAdmin();
        }

        if (method_exists($user, 'hasRole')) {
            return $user->hasRole('super_admin') || $user->hasRole('Super Admin');
        }

        if (isset($user->role)) {
            return in_array($user->role, ['super_admin', 'Super Admin']);
        }

        if (method_exists($user, 'roles')) {
            return $user->roles()->whereIn('name', ['super_admin', 'Super Admin'])->exists();
        }

        return false;
    }

    protected function isAdminPC(?User $user): bool
    {
        if (!$user) return false;
        
        $role = $user->role->slug ?? null;
        $level = $user->organization->level->slug ?? null;
        
        return $role === 'admin' && $level === 'pc';
    }

    protected function isAdminMWC(?User $user): bool
    {
        if (!$user) return false;
        
        $role = $user->role->slug ?? null;
        $level = $user->organization->level->slug ?? null;
        
        return $role === 'admin' && $level === 'mwc';
    }

    protected function isAdminRanting(?User $user): bool
    {
        if (!$user) return false;
        
        $role = $user->role->slug ?? null;
        $level = $user->organization->level->slug ?? null;
        
        return $role === 'admin' && $level === 'ranting';
    }

    protected function getCacheKey(string $key, ?User $user): string
    {
        $suffix = 'guest';
        if ($user) {
            if ($this->isSuperAdmin($user)) {
                $suffix = 'superadmin';
            } elseif ($this->isAdminMWC($user)) {
                $suffix = 'admin_mwc_' . $user->organization_id;
            } elseif ($this->isAdminPC($user)) {
                $suffix = 'admin_pc_' . $user->organization_id;
            } elseif ($this->isAdminRanting($user)) {
                $suffix = 'admin_ranting_' . $user->organization_id;
            } else {
                $suffix = 'user_' . $user->id;
            }
        }
        return self::CACHE_PREFIX . $key . '_' . $suffix;
    }

    private function getLevelDisplayName(string $slug): string
    {
        $names = [
            'pc' => 'PCNU',
            'mwc' => 'MWCNU',
            'ranting' => 'RANTING',
            'anak_ranting' => 'ANAK RANTING',
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
            'anak_ranting' => 'teal',
            'lembaga' => 'orange',
            'banom' => 'pink',
        ];
        return $colors[$slug] ?? 'gray';
    }
}