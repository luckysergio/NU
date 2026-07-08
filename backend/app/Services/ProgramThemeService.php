<?php

namespace App\Services;

use App\Models\ProgramTheme;
use App\Models\User;
use App\Models\Organization;
use App\Models\WorkProgram;
use App\Models\Activity;
use App\Events\ProgramThemeCreated;
use App\Events\ProgramThemeUpdated;
use App\Events\ProgramThemeDeleted;
use App\Events\DashboardProgramCountUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class ProgramThemeService
{
    protected const CACHE_DURATION = 600;
    protected const CACHE_PREFIX = 'program-themes:';
    protected const CACHE_TRACKER_KEY = 'program-themes:active_keys';

    private function getAuthenticatedUser(): User
    {
        $user = auth('api')->user();
        
        if (!$user instanceof User) {
            throw new \Exception('User tidak ditemukan atau token tidak valid', 401);
        }
        
        return $user;
    }

    public function getAll(Request $request)
    {
        try {
            $user = $this->getAuthenticatedUser();

            $filters = $this->extractFilters($request);
            $bypassCache = $request->query('bypass_cache', false);
            
            if ($bypassCache || $request->query('_t')) {
                $themes = $this->buildQuery($filters, $user)->latest()->paginate($filters['per_page']);
                
                foreach ($themes->items() as $theme) {
                    $this->addThemeStatistics($theme);
                }
                
                return $themes;
            }

            $cacheKey = $this->getCacheKey('list', $filters);
            
            return $this->rememberCache($cacheKey, function () use ($filters, $user) {
                $themes = $this->buildQuery($filters, $user)->latest()->paginate($filters['per_page']);
                
                foreach ($themes->items() as $theme) {
                    $this->addThemeStatistics($theme);
                }
                
                return $themes;
            });

        } catch (\Exception $e) {
            Log::error('ProgramThemeService getAll error: ' . $e->getMessage());
            throw $e;
        }
    }

    private function buildQuery(array $filters, User $user)
    {
        $query = ProgramTheme::with(['creator', 'organization']);

        if (!$user->isSuperAdmin()) {
            $pcId = $user->organization ? $user->organization->getPcId() : null;
            if ($pcId) {
                $query->where('organization_id', $pcId);
            } else {
                return ProgramTheme::query();
            }
        }

        if ($filters['organization_id'] && $user->isSuperAdmin()) {
            $query->where('organization_id', $filters['organization_id']);
        }

        if ($filters['search']) {
            $search = strtolower($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(nama) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(deskripsi) LIKE ?', ["%{$search}%"]);
            });
        }

        if ($filters['start_date']) {
            $query->whereDate('tanggal_mulai', '>=', $filters['start_date']);
        }

        if ($filters['end_date']) {
            $query->whereDate('tanggal_selesai', '<=', $filters['end_date']);
        }

        return $query;
    }

    public function findById(int $id): ProgramTheme
    {
        try {
            $user = $this->getAuthenticatedUser();

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

            $this->addThemeStatistics($theme);

            return $theme;

        } catch (\Exception $e) {
            Log::error('ProgramThemeService findById error: ' . $e->getMessage());
            throw $e;
        }
    }

    private function addThemeStatistics(ProgramTheme $theme): void
    {
        $pcOrganization = $theme->organization;
        
        if (!$pcOrganization) {
            $theme->statistics = [
                'total_work_programs' => 0,
                'total_activities' => 0,
                'organizations_status' => [],
            ];
            return;
        }
        
        $mwcOrganizations = Organization::where('parent_id', $pcOrganization->id)
            ->whereHas('level', function ($q) {
                $q->where('slug', 'mwc');
            })
            ->get();
        
        $organizationsStatus = [];
        $totalWorkPrograms = 0;
        $totalActivities = 0;
        
        foreach ($mwcOrganizations as $mwc) {
            $workPrograms = WorkProgram::where('theme_id', $theme->id)
                ->where('organization_id', $mwc->id)
                ->get();
            
            $workProgramCount = $workPrograms->count();
            $totalWorkPrograms += $workProgramCount;
            
            $activities = Activity::whereHas('workProgram', function ($q) use ($theme, $mwc) {
                $q->where('theme_id', $theme->id)
                  ->where('organization_id', $mwc->id);
            })
            ->with([
                'workProgram',
                'organization',
                'penanggungJawab.jabatan',
                'participantOrganizations.level',
                'participantOrganizations.anggotas.jabatan',
                'attendances.anggota.jabatan',
                'photos',
                'expensePhotos',
                'documents',
            ])
            ->get();

            $activitiesCount = $activities->count();
            $totalActivities += $activitiesCount;

            // ✅ BARU: Format activities untuk frontend
            $activitiesData = $activities->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'nama_kegiatan' => $activity->nama_kegiatan,
                    'tanggal_pelaksanaan' => $activity->tanggal_pelaksanaan,
                    'status' => $activity->status,
                    'total_pengeluaran' => $activity->total_pengeluaran,
                    'catatan' => $activity->catatan,
                    'work_program' => $activity->workProgram ? [
                        'id' => $activity->workProgram->id,
                        'nama_program' => $activity->workProgram->nama_program,
                    ] : null,
                    'organization' => $activity->organization ? [
                        'id' => $activity->organization->id,
                        'nama' => $activity->organization->nama,
                    ] : null,
                    'penanggung_jawab' => $activity->penanggungJawab ? [
                        'id' => $activity->penanggungJawab->id,
                        'nama' => $activity->penanggungJawab->nama,
                        'jabatan' => $activity->penanggungJawab->jabatan ? [
                            'nama' => $activity->penanggungJawab->jabatan->nama,
                        ] : null,
                    ] : null,
                    'participant_organizations' => $activity->participantOrganizations->map(function ($org) {
                        return [
                            'id' => $org->id,
                            'nama' => $org->nama,
                            'level' => $org->level ? [
                                'nama' => $org->level->nama,
                                'display_name' => $org->level->display_name ?? $org->level->nama,
                            ] : null,
                            'anggotas' => $org->anggotas->map(function ($anggota) {
                                return [
                                    'id' => $anggota->id,
                                    'nama' => $anggota->nama,
                                    'jabatan' => $anggota->jabatan ? [
                                        'nama' => $anggota->jabatan->nama,
                                    ] : null,
                                ];
                            }),
                        ];
                    }),
                    'attendances' => $activity->attendances->map(function ($attendance) {
                        return [
                            'id' => $attendance->id,
                            'anggota_id' => $attendance->anggota_id,
                            'anggota' => $attendance->anggota ? [
                                'id' => $attendance->anggota->id,
                                'nama' => $attendance->anggota->nama,
                                'jabatan' => $attendance->anggota->jabatan ? [
                                    'nama' => $attendance->anggota->jabatan->nama,
                                ] : null,
                            ] : null,
                        ];
                    }),
                    'photos' => $activity->photos->map(function ($photo) {
                        return [
                            'id' => $photo->id,
                            'file_path' => $photo->file_path,
                        ];
                    }),
                    'expense_photos' => $activity->expensePhotos->map(function ($photo) {
                        return [
                            'id' => $photo->id,
                            'file_path' => $photo->file_path,
                        ];
                    }),
                    'documents' => $activity->documents->map(function ($doc) {
                        return [
                            'id' => $doc->id,
                            'name' => $doc->name ?? $doc->file_name,
                            'file_name' => $doc->file_name,
                            'file_path' => $doc->file_path,
                            'file_type' => $doc->file_type,
                            'file_size' => $doc->file_size,
                            'category' => $doc->category,
                            'description' => $doc->description,
                        ];
                    }),
                ];
            })->toArray();

            $organizationsStatus[] = [
                'id' => $mwc->id,
                'nama' => $mwc->nama,
                'level' => $mwc->level?->nama,
                'level_slug' => $mwc->level?->slug,
                'has_work_program' => $workProgramCount > 0,
                'work_program_count' => $workProgramCount,
                'activities_count' => $activitiesCount,
                'activities' => $activitiesData,
                'status' => $workProgramCount > 0 ? 'SUDAH MEMBUAT' : 'BELUM MEMBUAT',
                'status_color' => $workProgramCount > 0 ? 'green' : 'gray',
            ];
        }
        
        $theme->statistics = [
            'theme_id' => $theme->id,
            'total_work_programs' => $totalWorkPrograms,
            'total_activities' => $totalActivities,
            'organizations_status' => $organizationsStatus,
            'pc_organization' => [
                'id' => $pcOrganization->id,
                'nama' => $pcOrganization->nama,
            ],
        ];
    }

    public function getThemeStatisticsForMWC(int $themeId, int $mwcId): array
    {
        try {
            $theme = ProgramTheme::findOrFail($themeId);
            $mwc = Organization::findOrFail($mwcId);
            
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
        return DB::transaction(function () use ($data) {
            $user = $this->getAuthenticatedUser();

            $organizationId = $data['organization_id'] ?? null;
            
            if ($user->isSuperAdmin() && $organizationId) {
                $targetOrgId = $organizationId;
            } else {
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
            
            $theme->load(['creator', 'organization']);
            $this->addThemeStatistics($theme);
            
            $this->clearCache();
            
            broadcast(new ProgramThemeCreated($theme))->toOthers();
            $this->broadcastDashboardUpdate();
            
            return $theme;
        });
    }

    public function update(int $id, array $data): ProgramTheme
    {
        return DB::transaction(function () use ($id, $data) {
            $user = $this->getAuthenticatedUser();

            $theme = ProgramTheme::findOrFail($id);

            if (!$user->isSuperAdmin()) {
                $pcId = $user->organization ? $user->organization->getPcId() : null;

                if ($theme->organization_id !== $pcId) {
                    throw new \Exception('Anda tidak memiliki akses untuk mengupdate tema ini', 403);
                }
            }

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

            $freshTheme = $theme->fresh();
            $freshTheme->load(['creator', 'organization']);
            $this->addThemeStatistics($freshTheme);
            
            $this->clearCache();
            
            broadcast(new ProgramThemeUpdated($freshTheme))->toOthers();
            $this->broadcastDashboardUpdate();

            return $freshTheme;
        });
    }

    public function destroy(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $user = $this->getAuthenticatedUser();

            $theme = ProgramTheme::findOrFail($id);

            if (!$user->isSuperAdmin()) {
                $pcId = $user->organization ? $user->organization->getPcId() : null;

                if ($theme->organization_id !== $pcId) {
                    throw new \Exception('Anda tidak memiliki akses untuk menghapus tema ini', 403);
                }
            }

            if ($theme->workPrograms()->count() > 0) {
                throw new \Exception('Tema tidak dapat dihapus karena sudah memiliki program kerja terkait');
            }

            $theme->delete();
            
            $this->clearCache();
            
            broadcast(new ProgramThemeDeleted($id))->toOthers();
            $this->broadcastDashboardUpdate();

            return true;
        });
    }

    public function getStatistics(): array
    {
        $totalThemes = ProgramTheme::count();
        
        $activeThemes = ProgramTheme::where('is_active', true)
            ->with(['organization'])
            ->get()
            ->map(function ($theme) {
                return [
                    'id' => $theme->id,
                    'nama' => $theme->nama,
                    'organization_id' => $theme->organization_id,
                    'organization_name' => $theme->organization?->nama,
                    'tanggal_mulai' => $theme->tanggal_mulai,
                    'tanggal_selesai' => $theme->tanggal_selesai,
                ];
            })
            ->toArray();
        
        $statistics = [
            'total_active' => count($activeThemes),
            'total_inactive' => $totalThemes - count($activeThemes),
            'total_all' => $totalThemes,
        ];

        return [
            'total_themes' => $totalThemes,
            'active_themes' => $activeThemes,
            'statistics' => $statistics,
        ];
    }

    private function broadcastDashboardUpdate(): void
    {
        try {
            $stats = $this->getStatistics();
            
            broadcast(new DashboardProgramCountUpdated(
                $stats['total_themes'],
                $stats['active_themes'],
                $stats['statistics']
            ))->toOthers();
            
        } catch (\Exception $e) {
            Log::error('Failed to broadcast program dashboard: ' . $e->getMessage());
        }
    }

    private function calculateIsActive(string $startDate, string $endDate): bool
    {
        $today = Carbon::today();
        return $today->between(Carbon::parse($startDate), Carbon::parse($endDate));
    }

    private function extractFilters(Request $request): array
    {
        return [
            'search' => trim((string) $request->query('search', '')),
            'start_date' => $request->query('start_date'),
            'end_date' => $request->query('end_date'),
            'organization_id' => $request->query('organization_id'),
            'per_page' => max(1, min((int) $request->input('per_page', 10), 100)),
        ];
    }

    private function getCacheKey(string $key, array $params = []): string
    {
        $userId = auth('api')->id() ?? 'guest';
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
        
        Log::info('Targeted program theme cache cleared successfully.');
    }
}