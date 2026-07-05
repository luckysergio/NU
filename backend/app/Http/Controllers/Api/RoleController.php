<?php
// app/Http/Controllers/Api/RoleController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    protected RoleService $service;

    public function __construct(RoleService $service)
    {
        $this->service = $service;
    }

    /**
     * Get list of roles
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
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
                'message' => 'List role berhasil diambil',
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
     * Get role detail
     */
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $data = $this->service->findById($id, $request);

            return response()->json([
                'success' => true,
                'message' => 'Detail role berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Role tidak ditemukan',
            ], 404);
        }
    }

    /**
     * Get available roles for assignment
     */
    public function available(Request $request): JsonResponse
    {
        try {
            $data = $this->service->getAvailableRoles($request);

            return response()->json([
                'success' => true,
                'message' => 'Available roles berhasil diambil',
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
     * Get role statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $data = $this->service->getStatistics($request);

            return response()->json([
                'success' => true,
                'message' => 'Statistik role berhasil diambil',
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
     * Create new role
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:100|unique:roles,nama',
            'deskripsi' => 'nullable|string|max:500',
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
            $role = $this->service->store($validator->validated(), $request);

            return response()->json([
                'success' => true,
                'message' => 'Role berhasil dibuat',
                'data' => $role,
            ], 201);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update role
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:100|unique:roles,nama,' . $id,
            'deskripsi' => 'nullable|string|max:500',
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
            $role = $this->service->update($id, $validator->validated(), $request);

            return response()->json([
                'success' => true,
                'message' => 'Role berhasil diupdate',
                'data' => $role,
            ]);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete role
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $this->service->destroy($id, $request);

            return response()->json([
                'success' => true,
                'message' => 'Role berhasil dihapus',
            ]);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Toggle role status
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        try {
            $role = $this->service->toggleStatus($id, $request);

            return response()->json([
                'success' => true,
                'message' => $role->is_active ? 'Role berhasil diaktifkan' : 'Role berhasil dinonaktifkan',
                'data' => $role,
            ]);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}