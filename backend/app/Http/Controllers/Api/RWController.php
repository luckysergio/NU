<?php
// app/Http/Controllers/Api/RWController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RWService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class RWController extends Controller
{
    protected RWService $service;

    public function __construct(RWService $service)
    {
        $this->service = $service;
        ini_set('max_execution_time', 120);
    }

    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'kelurahan_id' => 'nullable|exists:kelurahans,id',
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
                'message' => 'List RW berhasil diambil',
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
            $data = $this->service->find($id);

            return response()->json([
                'success' => true,
                'message' => 'Detail RW berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'RW tidak ditemukan',
            ], 404);
        }
    }

    public function availableForAnakRanting(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'kelurahan_id' => 'nullable|exists:kelurahans,id',
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
            $data = $this->service->availableForAnakRanting(
                $request->query('ignore_organization_id'),
                $request->query('kelurahan_id')
            );

            return response()->json([
                'success' => true,
                'message' => 'List RW tersedia untuk Anak Ranting berhasil diambil',
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
            'kelurahan_id' => 'required|exists:kelurahans,id',
            'nomor' => 'required|string|max:10',
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
            $rw = $this->service->create($validator->validated());

            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'RW berhasil dibuat',
                'data' => $rw,
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
            'kelurahan_id' => 'required|exists:kelurahans,id',
            'nomor' => 'required|string|max:10',
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
            $rw = $this->service->update($id, $validator->validated());

            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'RW berhasil diupdate',
                'data' => $rw,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->delete($id);

            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'RW berhasil dihapus',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}