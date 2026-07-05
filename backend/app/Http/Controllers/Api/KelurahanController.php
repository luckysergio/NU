<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\KelurahanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class KelurahanController extends Controller
{
    protected KelurahanService $service;

    public function __construct(KelurahanService $service)
    {
        $this->service = $service;
        ini_set('max_execution_time', 120);
    }

    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'kecamatan_id' => 'nullable|exists:kecamatans,id',
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
                'message' => 'List kelurahan berhasil diambil',
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
                'message' => 'Detail kelurahan berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kelurahan tidak ditemukan',
            ], 404);
        }
    }

    public function availableForRanting(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'kecamatan_id' => 'nullable|exists:kecamatans,id',
            'kota_id' => 'nullable|exists:kotas,id',
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
            $data = $this->service->availableForRanting(
                $request->query('ignore_organization_id'),
                $request->query('kota_id'),
                $request->query('kecamatan_id')
            );

            return response()->json([
                'success' => true,
                'message' => 'List kelurahan tersedia untuk Ranting berhasil diambil',
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
            'kecamatan_id' => 'required|exists:kecamatans,id',
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
            $kelurahan = $this->service->store($validator->validated(), $request);

            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'Kelurahan berhasil dibuat',
                'data' => $kelurahan,
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
            'kecamatan_id' => 'required|exists:kecamatans,id',
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
            $kelurahan = $this->service->update($id, $validator->validated(), $request);

            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'Kelurahan berhasil diupdate',
                'data' => $kelurahan,
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
                'message' => 'Kelurahan berhasil dihapus',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}