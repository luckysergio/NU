<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ActivityAttendanceRequest;
use App\Http\Requests\ActivityParticipantRequest;
use App\Models\Activity;
use App\Models\Anggota;
use App\Models\Organization;
use App\Services\ActivityAttendanceService;
use Illuminate\Support\Facades\Auth;

class ActivityAttendanceController extends Controller
{
    protected ActivityAttendanceService $attendanceService;

    public function __construct(
        ActivityAttendanceService $attendanceService
    ) {
        $this->attendanceService = $attendanceService;
    }

    /*
    |--------------------------------------------------------------------------
    | PARTICIPANTS
    |--------------------------------------------------------------------------
    */

    public function getParticipants(
        int $activityId
    ) {
        try {

            $result = $this->attendanceService
                ->getParticipants(
                    $activityId,
                    Auth::user()
                );

            return response()->json(
                $result,
                200
            );

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function addParticipants(
        ActivityParticipantRequest $request
    ) {
        try {

            $result = $this->attendanceService
                ->addParticipants(
                    $request->activity_id,
                    $request->organization_ids,
                    Auth::user()
                );

            return response()->json(
                $result,
                200
            );

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ATTENDANCE
    |--------------------------------------------------------------------------
    */

    public function getAttendance(
        int $activityId
    ) {
        try {

            $result = $this->attendanceService
                ->getAttendance(
                    $activityId,
                    Auth::user()
                );

            return response()->json(
                $result,
                200
            );

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function saveAttendance(
        ActivityAttendanceRequest $request
    ) {
        try {

            $result = $this->attendanceService
                ->saveAttendance(
                    $request->activity_id,
                    $request->validated(),
                    Auth::user()
                );

            return response()->json(
                $result,
                200
            );

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ORGANIZATION PICKER
    |--------------------------------------------------------------------------
    */

    public function getAvailableOrganizations(
        int $activityId
    ) {
        try {

            $activity = Activity::with(
                'organization.level'
            )->findOrFail($activityId);

            $existingIds = $activity
                ->participantOrganizations()
                ->pluck('organization_id')
                ->toArray();

            $organizations = Organization::with(
                'level'
            )
                ->whereNotIn(
                    'id',
                    $existingIds
                )
                ->where(
                    'id',
                    '!=',
                    $activity->organization_id
                )
                ->orderBy('nama')
                ->get()
                ->map(function ($org) {

                    return [
                        'id'           => $org->id,
                        'nama'         => $org->nama,
                        'level'        => $org->level?->nama,
                        'level_slug'   => $org->level?->slug,
                        'parent_id'    => $org->parent_id,
                        'kecamatan_id' => $org->kecamatan_id,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $organizations,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ORGANIZATION MEMBERS
    |--------------------------------------------------------------------------
    */

    public function getAnggotaByOrganization(
        int $organizationId
    ) {
        try {

            $anggotas = Anggota::with([
                'jabatan'
            ])
                ->where(
                    'organization_id',
                    $organizationId
                )
                ->orderBy('nama')
                ->get()
                ->map(function ($anggota) {

                    return [
                        'id' => $anggota->id,
                        'nama' => $anggota->nama,
                        'jabatan' => $anggota->jabatan?->nama,
                        'organization_id' => $anggota->organization_id,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $anggotas,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
