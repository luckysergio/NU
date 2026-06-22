<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WorkProgramService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class WorkProgramController extends Controller
{
    protected WorkProgramService $service;

    public function __construct(
        WorkProgramService $service
    ) {
        $this->service = $service;
    }

    public function index(
        Request $request
    ): JsonResponse {

        return response()->json([
            'success' => true,
            'data' => $this->service->getAll(
                $request
            ),
        ]);
    }

    public function show(
        int $id
    ): JsonResponse {

        return response()->json([
            'success' => true,
            'data' => $this->service->findById($id),
        ]);
    }

    /**
     * Get program statistics with ranting status
     * GET /api/work-programs/{id}/statistics
     */
    public function getProgramStatistics(
        int $id
    ): JsonResponse {

        try {
            $statistics = $this->service->getProgramStatisticsForMWC($id);

            return response()->json([
                'success' => true,
                'message' => 'Statistik program kerja',
                'data' => $statistics,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(
        Request $request
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            [
                'organization_id' => [
                    'required',
                    'exists:organizations,id'
                ],

                'theme_id' => [
                    'nullable',
                    'exists:program_themes,id'
                ],

                'field_id' => [
                    'required',
                    'exists:program_fields,id'
                ],

                'target_id' => [
                    'required',
                    'exists:program_targets,id'
                ],

                'goal_id' => [
                    'required',
                    'exists:program_goals,id'
                ],

                'nama_program' => [
                    'required',
                    'string',
                    'max:255'
                ],

                'deskripsi' => [
                    'nullable',
                    'string'
                ],

                'tahun' => [
                    'required',
                    'integer',
                    'min:2000',
                    'max:' . (date('Y') + 10)
                ],

                'status' => [
                    'nullable',
                    'in:draft,aktif,selesai'
                ],
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $program = $this->service->store(
                $validator->validated(),
                $request
            );

            return response()->json([
                'success' => true,
                'message' => 'Program kerja berhasil dibuat',
                'data' => $program,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(
        Request $request,
        int $id
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            [
                'organization_id' => [
                    'required',
                    'exists:organizations,id'
                ],

                'theme_id' => [
                    'nullable',
                    'exists:program_themes,id'
                ],

                'field_id' => [
                    'required',
                    'exists:program_fields,id'
                ],

                'target_id' => [
                    'required',
                    'exists:program_targets,id'
                ],

                'goal_id' => [
                    'required',
                    'exists:program_goals,id'
                ],

                'nama_program' => [
                    'required',
                    'string',
                    'max:255'
                ],

                'deskripsi' => [
                    'nullable',
                    'string'
                ],

                'tahun' => [
                    'required',
                    'integer',
                    'min:2000',
                    'max:' . (date('Y') + 10)
                ],

                'status' => [
                    'required',
                    'in:draft,aktif,selesai'
                ],
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $program = $this->service->update(
                $id,
                $validator->validated(),
                $request
            );

            return response()->json([
                'success' => true,
                'message' => 'Program kerja berhasil diubah',
                'data' => $program,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(
        Request $request,
        int $id
    ): JsonResponse {

        try {
            $this->service->destroy($id, $request);

            return response()->json([
                'success' => true,
                'message' => 'Program kerja berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET AVAILABLE THEMES FOR MWC
    |--------------------------------------------------------------------------
    */

    public function getAvailableThemesForMWC(): JsonResponse
    {
        try {

            $result = $this->service
                ->getAvailableThemesForMWC();

            return response()->json([

                'success' => true,

                'message' =>
                'Data tema tersedia berhasil diambil',

                'data' => $result,

            ]);
        } catch (\Throwable $e) {

            return response()->json([

                'success' => false,

                'message' => $e->getMessage(),

            ], 500);
        }
    }
}