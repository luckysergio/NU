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
    public function index(): array
    {
        return [
            'organizations' => $this->organizationSummary(),
            'members'       => $this->memberSummary(),
            'programs'      => $this->programSummary(),
        ];
    }

    public function refreshDashboard(): array
    {
        $user = Auth::user();
        
        if ($user) {
            $cacheKey = 'dashboard_organizations_' . ($this->isSuperAdmin($user) ? 'superadmin' : $user->organization_id);
            Cache::forget($cacheKey);
            
            $cacheKey = 'dashboard_members_' . ($this->isSuperAdmin($user) ? 'superadmin' : $user->organization_id);
            Cache::forget($cacheKey);
            
            $cacheKey = 'dashboard_programs_' . ($this->isSuperAdmin($user) ? 'superadmin' : $user->organization_id);
            Cache::forget($cacheKey);
        }

        return [
            'organizations' => $this->organizationSummary(),
            'members'       => $this->memberSummary(),
            'programs'      => $this->programSummary(),
        ];
    }

    public function refreshThemeChart(int $themeId): array
    {
        $user = Auth::user();
        
        if ($user) {
            $cacheKey = 'dashboard_theme_chart_' . $themeId . '_' . ($this->isSuperAdmin($user) ? 'superadmin' : $user->organization_id);
            Cache::forget($cacheKey);
        }

        return $this->getThemeChartData($themeId);
    }

    protected function isSuperAdmin(?User $user): bool
    {
        if (!$user) {
            return false;
        }

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

    protected function organizationSummary(): array
    {
        $user = Auth::user();
        
        if (!$user) {
            return $this->emptyOrganizationSummary();
        }

        $cacheKey = 'dashboard_organizations_' . ($this->isSuperAdmin($user) ? 'superadmin' : $user->organization_id);
        
        return Cache::remember($cacheKey, 300, function () use ($user) {
            $query = Organization::query();
            $this->applyOrganizationScope($query);
            
            return [
                'total' => (clone $query)->count(),
                'pc' => (clone $query)->whereHas('level', fn($q) => $q->where('slug', 'pc'))->count(),
                'mwc' => (clone $query)->whereHas('level', fn($q) => $q->where('slug', 'mwc'))->count(),
                'ranting' => (clone $query)->whereHas('level', fn($q) => $q->where('slug', 'ranting'))->count(),
                'anak_ranting' => (clone $query)->whereHas('level', fn($q) => $q->where('slug', 'anak-ranting'))->count(),
                'lembaga' => (clone $query)->whereHas('level', fn($q) => $q->where('slug', 'lembaga'))->count(),
                'banom' => (clone $query)->whereHas('level', fn($q) => $q->where('slug', 'banom'))->count(),
            ];
        });
    }

    protected function emptyOrganizationSummary(): array
    {
        return [
            'total' => 0,
            'pc' => 0,
            'mwc' => 0,
            'ranting' => 0,
            'anak_ranting' => 0,
            'lembaga' => 0,
            'banom' => 0,
        ];
    }

    protected function memberSummary(): array
    {
        $user = Auth::user();
        
        if (!$user) {
            return ['total' => 0, 'details' => []];
        }

        $cacheKey = 'dashboard_members_' . ($this->isSuperAdmin($user) ? 'superadmin' : $user->organization_id);
        
        return Cache::remember($cacheKey, 300, function () use ($user) {
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

        $cacheKey = 'dashboard_programs_' . ($this->isSuperAdmin($user) ? 'superadmin' : $user->organization_id);
        
        return Cache::remember($cacheKey, 300, function () use ($user) {
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
        $cacheKey = 'dashboard_theme_chart_' . $themeId . '_' . ($this->isSuperAdmin($user) ? 'superadmin' : $user->organization_id);
        
        return Cache::remember($cacheKey, 300, function () use ($themeId) {
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
}