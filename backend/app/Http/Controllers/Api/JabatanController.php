<?php
// app/Http/Controllers/Api/JabatanController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\JabatanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class JabatanController extends Controller
{
    protected JabatanService $service;

    public function __construct(JabatanService $service)
    {
        $this->service = $service;
        ini_set('max_execution_time', 120);
    }

    /**
     * Get list of jabatan
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:active,inactive',
            'level' => 'nullable|string|max:50',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
            'bypass_cache' => 'nullable|boolean',
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
                'message' => 'List jabatan berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get active jabatan for dropdown
     */
    public function active(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'level' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $this->service->getActiveJabatan($request->query('level'));

            return response()->json([
                'success' => true,
                'message' => 'Daftar jabatan aktif berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get jabatan by level
     */
    public function byLevel(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'level' => 'required|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $this->service->getByLevel($request->level);

            return response()->json([
                'success' => true,
                'message' => 'Data jabatan berdasarkan level berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get jabatan detail
     */
    public function show(int $id): JsonResponse
    {
        try {
            $data = $this->service->findById($id);

            return response()->json([
                'success' => true,
                'message' => 'Detail jabatan berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Jabatan tidak ditemukan',
            ], 404);
        }
    }

    /**
     * Get jabatan statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $data = $this->service->getStatistics();

            return response()->json([
                'success' => true,
                'message' => 'Statistik jabatan berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create new jabatan
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:100|unique:jabatans,nama',
            'deskripsi' => 'nullable|string|max:500',
            'level' => 'nullable|string|max:50',
            'levels' => 'nullable|array',
            'levels.*' => 'string|max:50',
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
            $jabatan = $this->service->store($validator->validated(), $request);

            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'Jabatan berhasil dibuat',
                'data' => $jabatan,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update jabatan
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:100|unique:jabatans,nama,' . $id,
            'deskripsi' => 'nullable|string|max:500',
            'level' => 'nullable|string|max:50',
            'levels' => 'nullable|array',
            'levels.*' => 'string|max:50',
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
            $jabatan = $this->service->update($id, $validator->validated(), $request);

            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'Jabatan berhasil diupdate',
                'data' => $jabatan,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete jabatan
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $this->service->destroy($id, $request);

            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'Jabatan berhasil dihapus',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Toggle jabatan status
     */
    public function toggleActive(Request $request, int $id): JsonResponse
    {
        try {
            $jabatan = $this->service->toggleActive($id, $request);

            return response()->json([
                'success' => true,
                'message' => $jabatan->is_active ? 'Jabatan berhasil diaktifkan' : 'Jabatan berhasil dinonaktifkan',
                'data' => $jabatan,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}