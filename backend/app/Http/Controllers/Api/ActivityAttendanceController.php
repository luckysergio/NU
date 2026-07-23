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
    public function __construct(protected ActivityAttendanceService $service) {}

    public function getAllOrganizations()
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Data organisasi berhasil diambil',
                'data' => $this->service->getAllOrganizations(Auth::user()),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal: ' . $e->getMessage()], $e->getCode() === 403 ? 403 : 500);
        }
    }

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
            return response()->json(['success' => false, 'message' => 'Gagal: ' . $e->getMessage()], $e->getCode() === 403 ? 403 : 500);
        }
    }

    public function show(Activity $activity)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Detail absensi berhasil diambil',
                'data' => $this->service->getAttendance($activity),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal: ' . $e->getMessage()], $e->getCode() === 403 ? 403 : 500);
        }
    }

    public function store(Request $request, Activity $activity)
    {
        $validator = Validator::make($request->all(), [
            'biodata_ids' => ['required', 'array'],
            'biodata_ids.*' => ['integer', 'exists:biodatas,id'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        try {
            $this->service->saveAttendance($activity, $validator->validated()['biodata_ids'], Auth::user()->id);

            return response()->json([
                'success' => true,
                'message' => 'Absensi berhasil disimpan.',
                'data' => $this->service->getAttendance($activity),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal: ' . $e->getMessage()], $e->getCode() === 403 ? 403 : 422);
        }
    }

    public function getAllOrganizationsUnderPC()
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Data organisasi berhasil diambil',
                'data' => $this->service->getAllOrganizationsUnderPC(Auth::user()),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal: ' . $e->getMessage()], $e->getCode() === 403 ? 403 : 500);
        }
    }

    public function getAvailableOrganizations(Activity $activity)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Data organisasi tersedia berhasil diambil',
                'data' => $this->service->getAvailableOrganizations($activity),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal: ' . $e->getMessage()], $e->getCode() === 403 ? 403 : 500);
        }
    }

    public function addParticipants(Request $request, Activity $activity)
    {
        $validator = Validator::make($request->all(), [
            'organization_ids' => ['required', 'array'],
            'organization_ids.*' => ['integer', 'exists:organizations,id'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        try {
            $this->service->addParticipants($activity, $validator->validated()['organization_ids']);
            return response()->json([
                'success' => true,
                'message' => 'Peserta berhasil ditambahkan',
                'data' => $this->service->getAvailableOrganizations($activity),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal: ' . $e->getMessage()], $e->getCode() === 403 ? 403 : 422);
        }
    }

    public function removeParticipants(Request $request, Activity $activity)
    {
        $validator = Validator::make($request->all(), [
            'organization_ids' => ['required', 'array'],
            'organization_ids.*' => ['integer', 'exists:organizations,id'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        try {
            $this->service->removeParticipants($activity, $validator->validated()['organization_ids']);
            return response()->json([
                'success' => true,
                'message' => 'Peserta berhasil dihapus',
                'data' => $this->service->getAvailableOrganizations($activity),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal: ' . $e->getMessage()], $e->getCode() === 403 ? 403 : 422);
        }
    }

    public function getParticipantAnggota(Activity $activity)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Data anggota peserta berhasil diambil',
                'data' => $this->service->getParticipantAnggota($activity),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal: ' . $e->getMessage()], $e->getCode() === 403 ? 403 : 500);
        }
    }
}