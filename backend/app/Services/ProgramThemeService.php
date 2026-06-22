<?php

namespace App\Services;

use App\Models\ProgramTheme;
use App\Models\User;
use App\Models\Organization;
use App\Models\WorkProgram;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ProgramThemeService
{
    public function getAll(Request $request)
    {
        try {
            /** @var User|null $user */
            $user = auth('api')->user();

            if (!$user) {
                throw new \Exception('User tidak ditemukan atau token tidak valid', 401);
            }

            $search = trim((string) $request->query('search', ''));
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $organizationId = $request->query('organization_id');

            $query = ProgramTheme::with([
                'creator',
                'organization',
            ]);

            /*
            |--------------------------------------------------------------------------
            | ACCESS FILTER
            |--------------------------------------------------------------------------
            */

            if (!$user->isSuperAdmin()) {
                $pcId = $user->organization ? $user->organization->getPcId() : null;

                if ($pcId) {
                    $query->where('organization_id', $pcId);
                } else {
                    // If user has no organization, return empty result
                    return ProgramTheme::query()->paginate(0);
                }
            }

            /*
            |--------------------------------------------------------------------------
            | ORGANIZATION FILTER (for Super Admin)
            |--------------------------------------------------------------------------
            */

            if ($organizationId && $user->isSuperAdmin()) {
                $query->where('organization_id', $organizationId);
            }

            /*
            |--------------------------------------------------------------------------
            | SEARCH
            |--------------------------------------------------------------------------
            */

            if ($search) {
                $search = strtolower($search);
                $query->where(function ($q) use ($search) {
                    $q->whereRaw('LOWER(nama) LIKE ?', ["%{$search}%"])
                      ->orWhereRaw('LOWER(deskripsi) LIKE ?', ["%{$search}%"]);
                });
            }

            /*
            |--------------------------------------------------------------------------
            | DATE FILTER
            |--------------------------------------------------------------------------
            */

            if ($startDate) {
                $query->whereDate('tanggal_mulai', '>=', $startDate);
            }

            if ($endDate) {
                $query->whereDate('tanggal_selesai', '<=', $endDate);
            }

            $perPage = (int) $request->input('per_page', 10);
            $perPage = max(1, min($perPage, 100));

            $themes = $query->latest()->paginate($perPage);
            
            // Add statistics to each theme
            foreach ($themes->items() as $theme) {
                $this->addThemeStatistics($theme);
            }

            return $themes;

        } catch (\Exception $e) {
            Log::error('ProgramThemeService getAll error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function findById(int $id): ProgramTheme
    {
        try {
            /** @var User|null $user */
            $user = auth('api')->user();

            if (!$user) {
                throw new \Exception('User tidak ditemukan', 401);
            }

            $theme = ProgramTheme::with([
                'creator',
                'organization',
                'workPrograms' => function ($query) {
                    $query->with(['activities']);
                },
            ])->findOrFail($id);

            if (!$user->isSuperAdmin()) {
                $pcId = $user->organization ? $user->organization->getPcId() : null;

                if ($theme->organization_id !== $pcId) {
                    throw new \Exception('Anda tidak memiliki akses ke tema ini', 403);
                }
            }

            // Add statistics to theme
            $this->addThemeStatistics($theme);

            return $theme;

        } catch (\Exception $e) {
            Log::error('ProgramThemeService findById error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Add statistics to theme
     */
    private function addThemeStatistics(ProgramTheme $theme): void
    {
        // Get PC organization (the owner of the theme)
        $pcOrganization = $theme->organization;
        
        if (!$pcOrganization) {
            $theme->statistics = [
                'total_work_programs' => 0,
                'total_activities' => 0,
                'organizations_status' => [],
            ];
            return;
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
            ->get();
        
        $organizationsStatus = [];
        $totalWorkPrograms = 0;
        $totalActivities = 0;
        
        foreach ($mwcOrganizations as $mwc) {
            // Get work programs that belong to this MWC and this theme
            $workPrograms = $mwc->workPrograms->filter(function ($wp) use ($theme) {
                return $wp->theme_id === $theme->id;
            });
            
            $workProgramCount = $workPrograms->count();
            $totalWorkPrograms += $workProgramCount;
            
            // Count activities from these work programs
            $activitiesCount = 0;
            foreach ($workPrograms as $wp) {
                $activitiesCount += $wp->activities->count();
            }
            $totalActivities += $activitiesCount;
            
            $organizationsStatus[] = [
                'id' => $mwc->id,
                'nama' => $mwc->nama,
                'level' => $mwc->level?->nama,
                'level_slug' => $mwc->level?->slug,
                'has_work_program' => $workProgramCount > 0,
                'work_program_count' => $workProgramCount,
                'activities_count' => $activitiesCount,
                'status' => $workProgramCount > 0 ? 'SUDAH MEMBUAT' : 'BELUM MEMBUAT',
                'status_color' => $workProgramCount > 0 ? 'green' : 'gray',
            ];
        }
        
        $theme->statistics = [
            'total_work_programs' => $totalWorkPrograms,
            'total_activities' => $totalActivities,
            'organizations_status' => $organizationsStatus,
            'pc_organization' => [
                'id' => $pcOrganization->id,
                'nama' => $pcOrganization->nama,
            ],
        ];
    }

    /**
     * Get theme statistics for a specific organization (MWC)
     */
    public function getThemeStatisticsForMWC(int $themeId, int $mwcId): array
    {
        try {
            $theme = ProgramTheme::findOrFail($themeId);
            $mwc = Organization::findOrFail($mwcId);
            
            // Get work programs under this MWC that use this theme
            $workPrograms = WorkProgram::where('theme_id', $themeId)
                ->where('organization_id', $mwcId)
                ->with(['activities'])
                ->get();
            
            $workProgramCount = $workPrograms->count();
            $activitiesCount = 0;
            
            foreach ($workPrograms as $wp) {
                $activitiesCount += $wp->activities->count();
            }
            
            return [
                'theme_id' => $themeId,
                'theme_name' => $theme->nama,
                'mwc_id' => $mwcId,
                'mwc_name' => $mwc->nama,
                'has_work_program' => $workProgramCount > 0,
                'work_program_count' => $workProgramCount,
                'activities_count' => $activitiesCount,
                'status' => $workProgramCount > 0 ? 'SUDAH MEMBUAT' : 'BELUM MEMBUAT',
                'work_programs' => $workPrograms->map(function ($wp) {
                    return [
                        'id' => $wp->id,
                        'nama_program' => $wp->nama_program,
                        'activities_count' => $wp->activities->count(),
                        'activities' => $wp->activities->map(function ($activity) {
                            return [
                                'id' => $activity->id,
                                'nama_kegiatan' => $activity->nama_kegiatan,
                                'tanggal_pelaksanaan' => $activity->tanggal_pelaksanaan,
                            ];
                        }),
                    ];
                }),
            ];
            
        } catch (\Exception $e) {
            Log::error('ProgramThemeService getThemeStatisticsForMWC error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function store(array $data): ProgramTheme
    {
        try {
            /** @var User|null $user */
            $user = auth('api')->user();

            if (!$user) {
                throw new \Exception('User tidak ditemukan', 401);
            }

            // Get organization_id from request or use user's PC ID
            $organizationId = $data['organization_id'] ?? null;
            
            if ($user->isSuperAdmin() && $organizationId) {
                // Super admin can specify organization
                $targetOrgId = $organizationId;
            } else {
                // Non-super admin uses their PC organization
                $targetOrgId = $user->organization ? $user->organization->getPcId() : null;
            }

            if (!$targetOrgId) {
                throw new \Exception('Organisasi tidak ditemukan.');
            }

            $isActive = $data['is_active'] ?? $this->calculateIsActive(
                $data['tanggal_mulai'],
                $data['tanggal_selesai']
            );

            $theme = ProgramTheme::create([
                'organization_id' => $targetOrgId,
                'nama' => $data['nama'],
                'deskripsi' => $data['deskripsi'] ?? null,
                'periode' => $data['periode'] ?? null,
                'tanggal_mulai' => $data['tanggal_mulai'],
                'tanggal_selesai' => $data['tanggal_selesai'],
                'is_active' => $isActive,
                'created_by' => $user->id,
            ]);
            
            // Load relations for fresh theme
            $theme->load(['creator', 'organization']);
            
            // Add statistics after creation
            $this->addThemeStatistics($theme);
            
            return $theme;

        } catch (\Exception $e) {
            Log::error('ProgramThemeService store error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function update(int $id, array $data): ProgramTheme
    {
        try {
            /** @var User|null $user */
            $user = auth('api')->user();

            if (!$user) {
                throw new \Exception('User tidak ditemukan', 401);
            }

            $theme = ProgramTheme::findOrFail($id);

            if (!$user->isSuperAdmin()) {
                $pcId = $user->organization ? $user->organization->getPcId() : null;

                if ($theme->organization_id !== $pcId) {
                    throw new \Exception('Anda tidak memiliki akses untuk mengupdate tema ini', 403);
                }
            }

            // For super admin, allow organization change
            if ($user->isSuperAdmin() && isset($data['organization_id'])) {
                $theme->organization_id = $data['organization_id'];
            }

            $autoActive = $this->calculateIsActive(
                $data['tanggal_mulai'],
                $data['tanggal_selesai']
            );

            $theme->update([
                'nama' => $data['nama'],
                'deskripsi' => $data['deskripsi'] ?? null,
                'periode' => $data['periode'] ?? null,
                'tanggal_mulai' => $data['tanggal_mulai'],
                'tanggal_selesai' => $data['tanggal_selesai'],
                'is_active' => $data['is_active'] ?? $autoActive,
            ]);

            // Load relations for fresh theme
            $freshTheme = $theme->fresh();
            $freshTheme->load(['creator', 'organization']);
            
            // Refresh statistics
            $this->addThemeStatistics($freshTheme);

            return $freshTheme;

        } catch (\Exception $e) {
            Log::error('ProgramThemeService update error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function destroy(int $id): bool
    {
        try {
            /** @var User|null $user */
            $user = auth('api')->user();

            if (!$user) {
                throw new \Exception('User tidak ditemukan', 401);
            }

            $theme = ProgramTheme::findOrFail($id);

            if (!$user->isSuperAdmin()) {
                $pcId = $user->organization ? $user->organization->getPcId() : null;

                if ($theme->organization_id !== $pcId) {
                    throw new \Exception('Anda tidak memiliki akses untuk menghapus tema ini', 403);
                }
            }

            // Check if theme has work programs
            if ($theme->workPrograms()->count() > 0) {
                throw new \Exception('Tema tidak dapat dihapus karena sudah memiliki program kerja terkait');
            }

            return $theme->delete();

        } catch (\Exception $e) {
            Log::error('ProgramThemeService destroy error: ' . $e->getMessage());
            throw $e;
        }
    }

    private function calculateIsActive(string $startDate, string $endDate): bool
    {
        $today = Carbon::today();
        return $today->between(Carbon::parse($startDate), Carbon::parse($endDate));
    }
}