<?php
// app/Http/Controllers/Api/KotaController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\KotaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class KotaController extends Controller
{
    protected KotaService $service;

    public function __construct(KotaService $service)
    {
        $this->service = $service;
        ini_set('max_execution_time', 120);
    }

    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
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
                'message' => 'List kota berhasil diambil',
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
                'message' => 'Detail kota berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kota tidak ditemukan',
            ], 404);
        }
    }

    public function availableForPC(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ignore_organization_id' => 'nullable|integer|exists:organizations,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $ignoreOrganizationId = $request->query('ignore_organization_id');

        try {
            $data = $this->service->availableForPC($ignoreOrganizationId);

            return response()->json([
                'success' => true,
                'message' => 'List kota tersedia untuk PC berhasil diambil',
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
            'nama' => 'required|string|max:100',
            'kode' => 'required|string|max:20|unique:kotas,kode',
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
            // Kirim request ke service untuk logging
            $kota = $this->service->store($validator->validated(), $request);

            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'Kota berhasil dibuat',
                'data' => $kota,
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
            'nama' => 'required|string|max:100',
            'kode' => 'required|string|max:20|unique:kotas,kode,' . $id,
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
            // Kirim request ke service untuk logging
            $kota = $this->service->update($id, $validator->validated(), $request);

            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'Kota berhasil diupdate',
                'data' => $kota,
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
            // Kirim request ke service untuk logging
            $this->service->destroy($id, $request);

            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'Kota berhasil dihapus',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}