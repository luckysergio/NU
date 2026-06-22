<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\KecamatanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class KecamatanController extends Controller
{
    protected KecamatanService $service;

    public function __construct(
        KecamatanService $service
    ) {
        $this->service = $service;
    }

    /*
    |--------------------------------------------------------------------------
    | LIST
    |--------------------------------------------------------------------------
    */

    public function index(
        Request $request
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            [
                'kota_id' => ['nullable', 'exists:kotas,id'],
                'search' => ['nullable', 'string', 'max:255'],
                'per_page' => ['nullable', 'integer', 'between:1,1000'],
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'List kecamatan',
            'data' => $this->service->getAll($request),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL
    |--------------------------------------------------------------------------
    */

    public function show(
        int $id
    ): JsonResponse {

        return response()->json([
            'success' => true,
            'message' => 'Detail kecamatan',
            'data' => $this->service->findById($id),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE FOR MWC
    |--------------------------------------------------------------------------
    */

    public function availableForMWC(
        Request $request
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            [
                'kota_id' => ['required', 'exists:kotas,id'],
                'ignore_organization_id' => ['nullable', 'exists:organizations,id'],
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'List kecamatan tersedia untuk MWC',
            'data' => $this->service->availableForMWC(
                $request->query('ignore_organization_id'),
                $request->query('kota_id')
            ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY KOTA
    |--------------------------------------------------------------------------
    */

    public function getByKota(
        Request $request,
        int $kotaId
    ): JsonResponse {

        return response()->json([
            'success' => true,
            'message' => 'List kecamatan berdasarkan kota',
            'data' => $this->service->getByKota($kotaId),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(
        Request $request
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            [
                'kota_id' => ['required', 'exists:kotas,id'],
                'nama' => ['required', 'string', 'max:255'],
                'kode' => ['nullable', 'string', 'max:50'],
                'is_active' => ['nullable', 'boolean'],
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
            $kecamatan = $this->service->store(
                $validator->validated(),
                $request
            );

            return response()->json([
                'success' => true,
                'message' => 'Kecamatan berhasil dibuat',
                'data' => $kecamatan,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        int $id
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            [
                'kota_id' => ['required', 'exists:kotas,id'],
                'nama' => ['required', 'string', 'max:255'],
                'kode' => ['nullable', 'string', 'max:50'],
                'is_active' => ['nullable', 'boolean'],
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
            $kecamatan = $this->service->update(
                $id,
                $validator->validated(),
                $request
            );

            return response()->json([
                'success' => true,
                'message' => 'Kecamatan berhasil diupdate',
                'data' => $kecamatan,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function destroy(
        Request $request,
        int $id
    ): JsonResponse {

        try {
            $this->service->destroy($id, $request);

            return response()->json([
                'success' => true,
                'message' => 'Kecamatan berhasil dihapus',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}