<?php
// app/Http/Controllers/Api/KecamatanController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\KecamatanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class KecamatanController extends Controller
{
    protected KecamatanService $service;

    public function __construct(KecamatanService $service)
    {
        $this->service = $service;
        ini_set('max_execution_time', 120);
    }

    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'kota_id' => 'nullable|exists:kotas,id',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
            'bypass_cache' => 'nullable|boolean',
            '_t' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $this->service->getAll($request);

            return response()->json([
                'success' => true,
                'message' => 'List kecamatan berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $data = $this->service->findById($id);

            return response()->json([
                'success' => true,
                'message' => 'Detail kecamatan berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kecamatan tidak ditemukan',
            ], 404);
        }
    }

    public function availableForMWC(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'kota_id' => 'required|exists:kotas,id',
            'ignore_organization_id' => 'nullable|exists:organizations,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $this->service->availableForMWC(
                $request->query('ignore_organization_id'),
                $request->query('kota_id')
            );

            return response()->json([
                'success' => true,
                'message' => 'List kecamatan tersedia untuk MWC berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getByKota(Request $request, int $kotaId): JsonResponse
    {
        try {
            $data = $this->service->getByKota($kotaId);

            return response()->json([
                'success' => true,
                'message' => 'List kecamatan berdasarkan kota berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'kota_id' => 'required|exists:kotas,id',
            'nama' => 'required|string|max:100',
            'kode' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $kecamatan = $this->service->store($validator->validated(), $request);

            Cache::flush();

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

    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'kota_id' => 'required|exists:kotas,id',
            'nama' => 'required|string|max:100',
            'kode' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $kecamatan = $this->service->update($id, $validator->validated(), $request);

            Cache::flush();

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

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $this->service->destroy($id, $request);

            Cache::flush();

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