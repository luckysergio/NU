<?php

namespace App\Http\Controllers\Api;

use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Services\ActivityAttendanceService;
use Illuminate\Support\Facades\Validator;

class ActivityAttendanceController extends Controller
{
    public function __construct(
        protected ActivityAttendanceService $service
    ) {}

    /**
     * ✅ BARU: Get ALL organizations (untuk admin ranting)
     * GET /api/attendance/organizations
     */
    public function getAllOrganizations()
    {
        try {
            $user = Auth::user();
            $data = $this->service->getAllOrganizations($user);

            return response()->json([
                'success' => true,
                'message' => 'Data organisasi berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data organisasi: ' . $e->getMessage(),
            ], $e->getCode() === 403 ? 403 : 500);
        }
    }

    /**
     * Get all activities with attendance status
     * GET /api/attendance/activities
     */
    public function index(Request $request)
    {
        try {
            $data = $this->service->getAllActivities($request);
            
            return response()->json([
                'success' => true,
                'message' => 'Daftar kegiatan berhasil diambil',
                'data' => $data['activities'],
                'accessible_organization_ids' => $data['accessible_organization_ids'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data kegiatan: ' . $e->getMessage(),
            ], $e->getCode() === 403 ? 403 : 500);
        }
    }

    /**
     * Detail Absensi
     * GET /api/attendance/activities/{activity}
     */
    public function show(Activity $activity)
    {
        try {
            $data = $this->service->getAttendance($activity);

            return response()->json([
                'success' => true,
                'message' => 'Detail absensi berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail absensi: ' . $e->getMessage(),
            ], $e->getCode() === 403 ? 403 : 500);
        }
    }

    /**
     * Simpan Absensi
     * POST /api/attendance/activities/{activity}/attendance
     */
    public function store(Request $request, Activity $activity)
    {
        $validator = Validator::make($request->all(), [
            'anggota_ids' => [
                'required',
                'array',
            ],
            'anggota_ids.*' => [
                'integer',
                'exists:anggotas,id',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $this->service->saveAttendance(
                $activity,
                $validator->validated()['anggota_ids'],
                Auth::user()->id
            );

            $data = $this->service->getAttendance($activity);

            return response()->json([
                'success' => true,
                'message' => 'Absensi berhasil disimpan.',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan absensi: ' . $e->getMessage(),
            ], $e->getCode() === 403 ? 403 : 422);
        }
    }

    /**
     * Get all organizations under PC
     * GET /api/attendance/organizations-under-pc
     */
    public function getAllOrganizationsUnderPC()
    {
        try {
            $user = Auth::user();
            $data = $this->service->getAllOrganizationsUnderPC($user);

            return response()->json([
                'success' => true,
                'message' => 'Data organisasi berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data organisasi: ' . $e->getMessage(),
            ], $e->getCode() === 403 ? 403 : 500);
        }
    }

    /**
     * Get available organizations for activity
     * GET /api/attendance/activities/{activity}/available-organizations
     */
    public function getAvailableOrganizations(Activity $activity)
    {
        try {
            $data = $this->service->getAvailableOrganizations($activity);

            return response()->json([
                'success' => true,
                'message' => 'Data organisasi tersedia berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data organisasi tersedia: ' . $e->getMessage(),
            ], $e->getCode() === 403 ? 403 : 500);
        }
    }

    /**
     * Add participants to activity
     * POST /api/attendance/activities/{activity}/participants
     */
    public function addParticipants(Request $request, Activity $activity)
    {
        $validator = Validator::make($request->all(), [
            'organization_ids' => [
                'required',
                'array',
            ],
            'organization_ids.*' => [
                'integer',
                'exists:organizations,id',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $this->service->addParticipants(
                $activity,
                $validator->validated()['organization_ids']
            );

            $data = $this->service->getAvailableOrganizations($activity);

            return response()->json([
                'success' => true,
                'message' => 'Peserta berhasil ditambahkan',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan peserta: ' . $e->getMessage(),
            ], $e->getCode() === 403 ? 403 : 422);
        }
    }

    /**
     * Remove participants from activity
     * DELETE /api/attendance/activities/{activity}/participants
     */
    public function removeParticipants(Request $request, Activity $activity)
    {
        $validator = Validator::make($request->all(), [
            'organization_ids' => [
                'required',
                'array',
            ],
            'organization_ids.*' => [
                'integer',
                'exists:organizations,id',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $this->service->removeParticipants(
                $activity,
                $validator->validated()['organization_ids']
            );

            $data = $this->service->getAvailableOrganizations($activity);

            return response()->json([
                'success' => true,
                'message' => 'Peserta berhasil dihapus',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus peserta: ' . $e->getMessage(),
            ], $e->getCode() === 403 ? 403 : 422);
        }
    }

    public function getParticipantAnggota(Activity $activity)
    {
        try {
            $data = $this->service->getParticipantAnggota($activity);

            return response()->json([
                'success' => true,
                'message' => 'Data anggota peserta berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data anggota peserta: ' . $e->getMessage(),
            ], $e->getCode() === 403 ? 403 : 500);
        }
    }
}