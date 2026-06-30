<?php

namespace App\Services;

use App\Models\Anggota;
use App\Models\Organization;
use App\Models\WorkProgram;
use App\Models\ProgramTheme;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

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

    /*
    |--------------------------------------------------------------------------
    | ORGANIZATION SUMMARY
    |--------------------------------------------------------------------------
    */

    protected function organizationSummary(): array
    {
        $query = Organization::query();

        $this->applyOrganizationScope($query);

        return [
            'total' => (clone $query)->count(),

            'pc' => (clone $query)
                ->whereHas('level', function (Builder $query) {
                    $query->where('slug', 'pc');
                })
                ->count(),

            'mwc' => (clone $query)
                ->whereHas('level', function (Builder $query) {
                    $query->where('slug', 'mwc');
                })
                ->count(),

            'ranting' => (clone $query)
                ->whereHas('level', function (Builder $query) {
                    $query->where('slug', 'ranting');
                })
                ->count(),

            'anak_ranting' => (clone $query)
                ->whereHas('level', function (Builder $query) {
                    $query->where('slug', 'anak-ranting');
                })
                ->count(),

            'lembaga' => (clone $query)
                ->whereHas('level', function (Builder $query) {
                    $query->where('slug', 'lembaga');
                })
                ->count(),

            'banom' => (clone $query)
                ->whereHas('level', function (Builder $query) {
                    $query->where('slug', 'banom');
                })
                ->count(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | MEMBER SUMMARY
    |--------------------------------------------------------------------------
    */

    protected function memberSummary(): array
    {
        $organizationQuery = Organization::query();

        $this->applyOrganizationScope($organizationQuery);

        $organizations = $organizationQuery
            ->withCount([
                'anggotas' => function (Builder $query) {
                    $query->where('is_active', true);
                }
            ])
            ->orderBy('nama')
            ->get();

        return [
            'total' => Anggota::query()
                ->whereIn(
                    'organization_id',
                    $organizations->pluck('id')
                )
                ->where('is_active', true)
                ->count(),

            'details' => $organizations
                ->map(function (Organization $organization) {
                    return [
                        'organization_id' => $organization->id,
                        'organization'    => $organization->nama,
                        'total'           => $organization->anggotas_count,
                    ];
                })
                ->values(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | PROGRAM SUMMARY
    |--------------------------------------------------------------------------
    */

    protected function programSummary(): Collection
    {
        $query = WorkProgram::query()
            ->with([
                'theme',
                'organization',
                'activities',
            ]);

        $this->applyProgramScope($query);

        return $query
            ->get()
            ->groupBy('theme_id')
            ->map(function (Collection $programs) {

                $theme = $programs->first()?->theme;

                return [
                    'theme_id' => $theme?->id,
                    'theme' => $theme?->nama,

                    'total_program' => $programs->count(),

                    'total_kegiatan' => $programs->sum(
                        fn (WorkProgram $program) => $program->activities->count()
                    ),

                    'organizations' => $programs
                        ->pluck('organization.nama')
                        ->filter()
                        ->unique()
                        ->values(),
                ];
            })
            ->values();
    }

    /**
     * Get theme statistics for a single theme
     */
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
            ->whereHas('level', function ($q) {
                $q->where('slug', 'mwc');
            })
            ->with(['workPrograms' => function ($q) use ($theme) {
                $q->where('theme_id', $theme->id)
                    ->with(['activities']);
            }])
            ->get();

        $mwcStatus = [];
        $totalWorkPrograms = 0;
        $totalActivities = 0;

        foreach ($mwcOrganizations as $mwc) {
            $workPrograms = $mwc->workPrograms->filter(function ($wp) use ($theme) {
                return $wp->theme_id === $theme->id;
            });

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
                'work_programs' => $workPrograms->map(function ($wp) {
                    return [
                        'id' => $wp->id,
                        'nama_program' => $wp->nama_program,
                        'status' => $wp->status,
                        'activities_count' => $wp->activities->count(),
                    ];
                }),
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

    /**
     * Get chart data for a specific theme
     * Returns data for chart visualization (Bar Chart)
     */
    public function getThemeChartData(int $themeId): array
    {
        $theme = ProgramTheme::with(['organization'])->findOrFail($themeId);
        
        $pcOrganization = $theme->organization;

        if (!$pcOrganization) {
            return [
                'theme_id' => $themeId,
                'theme_name' => $theme->nama,
                'labels' => [],
                'datasets' => [],
                'mwc_data' => [],
                'total_mwc' => 0,
                'total_activities' => 0,
                'total_programs' => 0,
            ];
        }

        // Get all MWC organizations under this PC
        $mwcOrganizations = Organization::where('parent_id', $pcOrganization->id)
            ->whereHas('level', function ($q) {
                $q->where('slug', 'mwc');
            })
            ->with(['workPrograms' => function ($q) use ($theme) {
                $q->where('theme_id', $theme->id)
                    ->with(['activities']);
            }])
            ->orderBy('nama')
            ->get();

        $labels = [];
        $activitiesCount = [];
        $programCount = [];
        $mwcData = [];

        foreach ($mwcOrganizations as $mwc) {
            $workPrograms = $mwc->workPrograms->filter(function ($wp) use ($theme) {
                return $wp->theme_id === $theme->id;
            });

            $workProgramCount = $workPrograms->count();
            $activitiesCountTotal = 0;

            foreach ($workPrograms as $wp) {
                $activitiesCountTotal += $wp->activities->count();
            }

            $labels[] = $mwc->nama;
            $activitiesCount[] = $activitiesCountTotal;
            $programCount[] = $workProgramCount;

            $mwcData[] = [
                'mwc_id' => $mwc->id,
                'mwc_name' => $mwc->nama,
                'work_program_count' => $workProgramCount,
                'activities_count' => $activitiesCountTotal,
                'has_work_program' => $workProgramCount > 0,
                'work_programs' => $workPrograms->map(function ($wp) {
                    return [
                        'id' => $wp->id,
                        'nama_program' => $wp->nama_program,
                        'status' => $wp->status,
                        'activities_count' => $wp->activities->count(),
                    ];
                }),
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
    }

    /*
    |--------------------------------------------------------------------------
    | FILTER ORGANIZATION
    |--------------------------------------------------------------------------
    */

    protected function applyOrganizationScope(Builder $query): void
    {
        $user = Auth::user();

        if (!$user) {
            return;
        }

        if (
            method_exists($user, 'isSuperAdmin') &&
            $user->isSuperAdmin()
        ) {
            return;
        }

        if (
            method_exists($user, 'organization') &&
            $user->organization
        ) {
            $ids = array_merge(
                [$user->organization->id],
                $user->organization->descendants()
            );

            $query->whereIn('id', $ids);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FILTER PROGRAM
    |--------------------------------------------------------------------------
    */

    protected function applyProgramScope(Builder $query): void
    {
        $user = Auth::user();

        if (!$user) {
            return;
        }

        if (
            method_exists($user, 'isSuperAdmin') &&
            $user->isSuperAdmin()
        ) {
            return;
        }

        if (
            method_exists($user, 'organization') &&
            $user->organization
        ) {
            $ids = array_merge(
                [$user->organization->id],
                $user->organization->descendants()
            );

            $query->whereIn('organization_id', $ids);
        }
    }
}