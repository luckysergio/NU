<?php

namespace App\Services;

use App\Models\User;
use App\Models\WorkProgram;
use App\Models\Organization;
use App\Models\ProgramTheme;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Auth\Access\AuthorizationException;

class WorkProgramService
{
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
    | GET ALL
    |--------------------------------------------------------------------------
    */

    public function getAll(Request $request)
    {
        $search = $request->query('search');
        $tahun = $request->query('tahun');
        $status = $request->query('status');
        $organizationId = $request->query('organization_id');

        /** @var User|null $authUser */
        $authUser = $this->authUser();

        $query = WorkProgram::with([
            'organization.level',
            'theme',
            'field',
            'target',
            'goal',
            'creator',
            'activities',
        ]);

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($search) {
            $search = strtolower(trim($search));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(nama_program) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(deskripsi) LIKE ?', ["%{$search}%"]);
            });
        }

        /*
        |--------------------------------------------------------------------------
        | FILTER TAHUN
        |--------------------------------------------------------------------------
        */

        if ($tahun) {
            $query->where('tahun', $tahun);
        }

        /*
        |--------------------------------------------------------------------------
        | FILTER STATUS
        |--------------------------------------------------------------------------
        */

        if ($status) {
            $query->where('status', $status);
        }

        /*
        |--------------------------------------------------------------------------
        | HAK AKSES ORGANISASI
        |--------------------------------------------------------------------------
        */

        if ($authUser) {

            $organization = $authUser->organization;

            if ($authUser->isSuperAdmin()) {

                // lihat semua

            } elseif (!$organization) {

                $query->whereRaw('1 = 0');
            }

            /*
    |--------------------------------------------------------------------------
    | PC
    |--------------------------------------------------------------------------
    */ elseif ($authUser->isPC()) {

                $query->whereHas(
                    'organization',
                    function ($q) use ($organization) {
                        $q->where(
                            'parent_id',
                            $organization->id
                        );
                    }
                );
            }

            /*
    |--------------------------------------------------------------------------
    | MWC
    |--------------------------------------------------------------------------
    */ elseif ($authUser->isMWC()) {

                $query->where(
                    'organization_id',
                    $organization->id
                );
            }

            /*
    |--------------------------------------------------------------------------
    | RANTING
    |--------------------------------------------------------------------------
    */ elseif ($authUser->isRanting()) {

                $allowedIds = [];

                // program kerja milik ranting sendiri
                $allowedIds[] = $organization->id;

                // program kerja milik MWC induk
                if ($organization->parent_id) {
                    $allowedIds[] =
                        $organization->parent_id;
                }

                $query->whereIn(
                    'organization_id',
                    array_unique($allowedIds)
                );
            }

            /*
    |--------------------------------------------------------------------------
    | LEMBAGA / BANOM
    |--------------------------------------------------------------------------
    */ elseif (
                $authUser->isLembaga() ||
                $authUser->isBanom()
            ) {

                $query->where(
                    'organization_id',
                    $organization->id
                );
            } else {

                $query->whereRaw('1 = 0');
            }
        }

        // Filter organization tambahan (hanya untuk Super Admin)
        if ($organizationId && $authUser?->isSuperAdmin()) {
            $query->where('organization_id', $organizationId);
        }

        $workPrograms = $query
            ->orderBy('created_at', 'desc')
            ->orderBy('nama_program')
            ->paginate((int) $request->input('per_page', 10));

        // Add statistics to each work program
        foreach ($workPrograms->items() as $program) {
            $this->addWorkProgramStatistics($program);
        }

        return $workPrograms;
    }

    /*
    |--------------------------------------------------------------------------
    | FIND BY ID
    |--------------------------------------------------------------------------
    */

    public function findById(int $id): WorkProgram
    {
        $program = WorkProgram::with([
            'organization.level',
            'theme',
            'field',
            'target',
            'goal',
            'creator',
            'activities',
        ])->findOrFail($id);

        $this->checkAccess($program);
        $this->addWorkProgramStatistics($program);

        return $program;
    }

    /*
    |--------------------------------------------------------------------------
    | ADD WORK PROGRAM STATISTICS
    |--------------------------------------------------------------------------
    */

    private function addWorkProgramStatistics(WorkProgram $program): void
    {
        // Get all activities for this work program
        $activities = $program->activities;

        // Hitung kegiatan yang dibuat oleh MWC (organization_id sama dengan program)
        $mwcActivitiesCount = $activities->filter(function ($activity) use ($program) {
            return $activity->organization_id === $program->organization_id;
        })->count();

        $totalActivities = $activities->count();

        // Get the MWC organization (owner of the work program)
        $mwcOrganization = $program->organization;

        if ($mwcOrganization && $mwcOrganization->isMWC()) {
            // Get all Ranting organizations under this MWC
            $rantingOrganizations = Organization::where('parent_id', $mwcOrganization->id)
                ->whereHas('level', function ($q) {
                    $q->where('slug', 'ranting');
                })
                ->with(['activities' => function ($q) use ($program) {
                    $q->where('work_program_id', $program->id);
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
                    'level' => $ranting->level?->nama,
                    'level_slug' => $ranting->level?->slug,
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

            // Add direct property for easy access in frontend
            $program->mwc_activities_count = $mwcActivitiesCount;
        } else {
            $program->statistics = [
                'total_activities' => $totalActivities,
                'mwc_activities_count' => $mwcActivitiesCount,
                'ranting_status' => [],
            ];

            // Add direct property for easy access in frontend
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
            'organization',
            'activities',
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

        // Hitung kegiatan MWC
        $mwcActivitiesCount = $program->activities->filter(function ($activity) use ($program) {
            return $activity->organization_id === $program->organization_id;
        })->count();

        // Get all Ranting organizations under this MWC
        $rantingOrganizations = Organization::where('parent_id', $mwcOrganization->id)
            ->whereHas('level', function ($q) {
                $q->where('slug', 'ranting');
            })
            ->with(['activities' => function ($q) use ($program) {
                $q->where('work_program_id', $program->id);
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
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(array $data, Request $request): WorkProgram
    {
        DB::beginTransaction();

        try {
            /** @var User|null $authUser */
            $authUser = $this->authUser();

            // Jika user adalah MWC, Ranting, Lembaga, atau Banom, force organization_id ke organisasinya sendiri
            if ($authUser && ($authUser->isMWC() || $authUser->isRanting() || $authUser->isLembaga() || $authUser->isBanom())) {
                $data['organization_id'] = $authUser->organization_id;
            }

            // Jika user adalah Admin MWC, force organization_id ke organisasinya sendiri
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

            DB::commit();

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

            return $program;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(int $id, array $data, Request $request): WorkProgram
    {
        DB::beginTransaction();

        try {
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

            DB::commit();

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

            return $program;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DESTROY
    |--------------------------------------------------------------------------
    */

    public function destroy(int $id, Request $request): bool
    {
        DB::beginTransaction();

        try {
            $program = WorkProgram::findOrFail($id);

            $this->checkAccess($program);

            $program->delete();

            DB::commit();
            return true;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
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

        // Ranting bisa mengakses program kerja milik MWC induknya
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

        // Ranting tidak bisa membuat program kerja (hanya bisa membuat kegiatan)
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

        // Get used theme IDs from work programs of this MWC
        $usedThemeIds = WorkProgram::query()
            ->where('organization_id', $organizationId)
            ->whereNotNull('theme_id')
            ->distinct()
            ->pluck('theme_id');

        // Hanya tema yang aktif (is_active = true)
        $availableThemes = ProgramTheme::query()
            ->where('is_active', true)
            ->whereNotIn('id', $usedThemeIds)
            ->orderBy('nama')
            ->get();

        // Hitung total tema yang aktif
        $totalActiveThemes = ProgramTheme::where('is_active', true)->count();

        // Hitung tema aktif yang sudah digunakan
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
}
