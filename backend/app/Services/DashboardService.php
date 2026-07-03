<?php
// app/Services/DashboardService.php

namespace App\Services;

use App\Models\Anggota;
use App\Models\Organization;
use App\Models\WorkProgram;
use App\Models\ProgramTheme;
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

    public function index(): array
    {
        return [
            'organizations' => $this->organizationSummary(),
            'members' => $this->memberSummary(),
            'programs' => $this->programSummary(),
        ];
    }

    public function getStatistics(): array
    {
        $organizationSummary = $this->organizationSummary();
        
        $totals = [];
        foreach ($organizationSummary['statistics'] as $slug => $data) {
            $totals[$slug] = $data['count'];
        }
        $totals['total'] = $organizationSummary['total'];
        
        return [
            'total_organizations' => $organizationSummary['total'],
            'statistics' => $organizationSummary['statistics'],
            'totals' => $totals,
        ];
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
            $query = Organization::query();
            $this->applyOrganizationScope($query);
            
            return [
                'total' => (clone $query)->count(),
                'statistics' => [
                    'pc' => [
                        'count' => (clone $query)->whereHas('level', fn($q) => $q->where('slug', 'pc'))->count(),
                        'label' => 'PCNU',
                        'slug' => 'pc',
                        'color' => 'purple',
                    ],
                    'mwc' => [
                        'count' => (clone $query)->whereHas('level', fn($q) => $q->where('slug', 'mwc'))->count(),
                        'label' => 'MWCNU',
                        'slug' => 'mwc',
                        'color' => 'blue',
                    ],
                    'ranting' => [
                        'count' => (clone $query)->whereHas('level', fn($q) => $q->where('slug', 'ranting'))->count(),
                        'label' => 'RANTING',
                        'slug' => 'ranting',
                        'color' => 'green',
                    ],
                    'anak_ranting' => [
                        'count' => (clone $query)->whereHas('level', fn($q) => $q->where('slug', 'anak-ranting'))->count(),
                        'label' => 'ANAK RANTING',
                        'slug' => 'anak-ranting',
                        'color' => 'teal',
                    ],
                    'lembaga' => [
                        'count' => (clone $query)->whereHas('level', fn($q) => $q->where('slug', 'lembaga'))->count(),
                        'label' => 'LEMBAGA',
                        'slug' => 'lembaga',
                        'color' => 'orange',
                    ],
                    'banom' => [
                        'count' => (clone $query)->whereHas('level', fn($q) => $q->where('slug', 'banom'))->count(),
                        'label' => 'BANOM',
                        'slug' => 'banom',
                        'color' => 'pink',
                    ],
                ],
            ];
        });
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
            $organizationQuery = Organization::query();
            $this->applyOrganizationScope($organizationQuery);
            
            $organizations = $organizationQuery
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

            foreach ($activeThemes as $theme) {
                $query = WorkProgram::query();
                $query->with(['theme', 'organization', 'activities'])
                    ->where('theme_id', $theme->id);

                $this->applyProgramScope($query);

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
        $pcOrganization = $theme->organization;

        if (!$pcOrganization) {
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

        $mwcOrganizations = Organization::where('parent_id', $pcOrganization->id)
            ->whereHas('level', fn($q) => $q->where('slug', 'mwc'))
            ->with(['workPrograms' => fn($q) => $q->where('theme_id', $theme->id)->with('activities')])
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
            'pc_organization' => [
                'id' => $pcOrganization->id,
                'nama' => $pcOrganization->nama,
            ],
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
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($themeId) {
            $theme = ProgramTheme::with('organization')->findOrFail($themeId);
            $pcOrganization = $theme->organization;

            if (!$pcOrganization) {
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

            $mwcOrganizations = Organization::where('parent_id', $pcOrganization->id)
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
                'pc_organization' => [
                    'id' => $pcOrganization->id,
                    'nama' => $pcOrganization->nama,
                ],
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

        if ($this->isSuperAdmin($user)) {
            return;
        }

        if ($user->organization) {
            $ids = array_merge([$user->organization->id], $user->organization->descendants());
            $query->whereIn('id', $ids);
        }
    }

    protected function applyProgramScope(Builder $query): void
    {
        $user = Auth::user();
        
        if (!$user) {
            return;
        }

        if ($this->isSuperAdmin($user)) {
            return;
        }

        if ($user->organization) {
            $ids = array_merge([$user->organization->id], $user->organization->descendants());
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
            return in_array($user->role, ['super_admin', 'Super Admin', 'admin']);
        }

        if (method_exists($user, 'roles')) {
            return $user->roles()->whereIn('name', ['super_admin', 'Super Admin', 'admin'])->exists();
        }

        return false;
    }

    protected function getCacheKey(string $key, ?User $user): string
    {
        $suffix = $user && $this->isSuperAdmin($user) ? 'superadmin' : ($user?->organization_id ?? 'guest');
        return self::CACHE_PREFIX . $key . '_' . $suffix;
    }
}