<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\ActivityAttendance;
use App\Models\ActivityParticipant;
use App\Models\Anggota;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ActivityAttendanceService
{
    /*
    |--------------------------------------------------------------------------
    | PARTICIPANTS
    |--------------------------------------------------------------------------
    */

    public function getParticipants(
        int $activityId,
        User $user
    ): array {
        $activity = Activity::findOrFail($activityId);

        $this->checkAccess($activity, $user);

        $participants = $activity
            ->participantOrganizations()
            ->with('level')
            ->get()
            ->map(function ($org) {
                return [
                    'id'         => $org->id,
                    'nama'       => $org->nama,
                    'level'      => $org->level?->nama,
                    'level_slug' => $org->level?->slug,
                ];
            });

        return [
            'success' => true,
            'data'    => $participants,
        ];
    }

    public function addParticipants(
        int $activityId,
        ?array $organizationIds,
        User $user
    ): array {

        $activity = Activity::findOrFail($activityId);

        $this->checkAccess($activity, $user);

        DB::beginTransaction();

        try {

            ActivityParticipant::where(
                'activity_id',
                $activityId
            )->delete();

            $organizationIds = $organizationIds ?? [];

            foreach ($organizationIds as $orgId) {

                ActivityParticipant::create([
                    'activity_id'     => $activityId,
                    'organization_id' => $orgId,
                ]);

                $anggotas = Anggota::where(
                    'organization_id',
                    $orgId
                )->get();

                foreach ($anggotas as $anggota) {

                    ActivityAttendance::firstOrCreate([
                        'activity_id' => $activityId,
                        'anggota_id'  => $anggota->id,
                    ], [
                        'is_present' => false,
                    ]);
                }
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Peserta berhasil disimpan',
            ];
        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ATTENDANCE
    |--------------------------------------------------------------------------
    */

    public function getAttendance(
        int $activityId,
        User $user
    ): array {

        $activity = Activity::findOrFail($activityId);

        $this->checkAccess($activity, $user);

        $participantIds = ActivityParticipant::where(
            'activity_id',
            $activityId
        )
            ->pluck('organization_id')
            ->toArray();

        $allOrgIds = array_unique(
            array_merge(
                [$activity->organization_id],
                $participantIds
            )
        );

        $organizations = Organization::with('level')
            ->whereIn('id', $allOrgIds)
            ->get()
            ->keyBy('id');

        $attendanceMap = ActivityAttendance::where(
            'activity_id',
            $activityId
        )
            ->get()
            ->keyBy('anggota_id');

        $result = [];

        foreach ($allOrgIds as $orgId) {

            $org = $organizations[$orgId] ?? null;

            if (!$org) {
                continue;
            }

            $anggotas = Anggota::with('jabatan')
                ->where('organization_id', $orgId)
                ->get()
                ->map(function ($anggota) use ($attendanceMap) {

                    $attendance =
                        $attendanceMap[$anggota->id]
                        ?? null;

                    return [
                        'id'             => $anggota->id,
                        'nama'           => $anggota->nama,
                        'jabatan'        => $anggota->jabatan?->nama,
                        'is_present'     => (bool) ($attendance?->is_present),
                        'checked_in_at'  => $attendance?->checked_in_at,
                        'kritik'         => $attendance?->kritik,
                        'saran'          => $attendance?->saran,
                    ];
                });

            $result[] = [
                'organization_id' => $org->id,
                'organization'    => $org->nama,
                'level'           => $org->level?->nama,
                'anggotas'        => $anggotas,
            ];
        }

        return [
            'success' => true,
            'data'    => $result,
        ];
    }

    public function saveAttendance(
        int $activityId,
        array $data,
        User $user
    ): array {

        $activity = Activity::findOrFail($activityId);

        $this->checkAccess($activity, $user);

        DB::beginTransaction();

        try {

            foreach (
                ($data['attendances'] ?? [])
                as $attendance
            ) {

                ActivityAttendance::updateOrCreate(
                    [
                        'activity_id' => $activityId,
                        'anggota_id'  => $attendance['anggota_id'],
                    ],
                    [
                        'is_present' => $attendance['is_present'] ?? false,

                        'checked_in_at' =>
                            ($attendance['is_present'] ?? false)
                            ? now()
                            : null,

                        'kritik' =>
                            $attendance['kritik'] ?? null,

                        'saran' =>
                            $attendance['saran'] ?? null,
                    ]
                );
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Absensi berhasil disimpan',
            ];
        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | AUTO GENERATE ATTENDANCE
    |--------------------------------------------------------------------------
    */

    public function generateOrganizerAttendance(
        Activity $activity
    ): void {

        $anggotas = Anggota::where(
            'organization_id',
            $activity->organization_id
        )->get();

        foreach ($anggotas as $anggota) {

            ActivityAttendance::firstOrCreate([
                'activity_id' => $activity->id,
                'anggota_id'  => $anggota->id,
            ], [
                'is_present' => false,
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESS
    |--------------------------------------------------------------------------
    */

    private function checkAccess(
        Activity $activity,
        User $user
    ): void {

        if ($user->isSuperAdmin()) {
            return;
        }

        $ids = $this->getAccessibleOrganizationIds(
            $user
        );

        if (
            !in_array(
                $activity->organization_id,
                $ids
            )
        ) {
            throw new \Exception(
                'Anda tidak memiliki akses ke kegiatan ini'
            );
        }
    }

    private function getAccessibleOrganizationIds(
        User $user
    ): array {

        if ($user->isSuperAdmin()) {
            return Organization::pluck('id')
                ->toArray();
        }

        if (!$user->organization) {
            return [];
        }

        $organization = $user->organization;

        $ids = [
            $organization->id
        ];

        $ids = array_merge(
            $ids,
            $organization->descendants()
        );

        if ($organization->parent_id) {
            $ids[] = $organization->parent_id;
        }

        return array_unique($ids);
    }
}
