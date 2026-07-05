<?php
// app/Http/Controllers/Api/UserController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    protected UserService $service;

    public function __construct(UserService $service)
    {
        $this->service = $service;
    }

    /**
     * Get list of users
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
            'role_id' => 'nullable|integer|exists:roles,id',
            'organization_id' => 'nullable|integer|exists:organizations,id',
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
                'message' => 'List user berhasil diambil',
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
     * Get user detail
     */
    public function show(int $id): JsonResponse
    {
        try {
            $data = $this->service->findById($id);

            return response()->json([
                'success' => true,
                'message' => 'Detail user berhasil diambil',
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
                'message' => 'User tidak ditemukan',
            ], 404);
        }
    }

    /**
     * Get available roles for organization
     */
    public function availableRoles(int $organizationId): JsonResponse
    {
        try {
            $data = $this->service->availableRoles($organizationId);

            return response()->json([
                'success' => true,
                'message' => 'Daftar role yang tersedia berhasil diambil',
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
     * Get user statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $data = $this->service->getStatistics();

            return response()->json([
                'success' => true,
                'message' => 'Statistik user berhasil diambil',
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
     * Create new user
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'role_id' => 'required|exists:roles,id',
            'organization_id' => 'required|exists:organizations,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'is_active' => 'nullable|boolean',
            'is_blocked' => 'nullable|boolean',
            'can_login' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = $this->service->store($validator->validated(), $request);

            return response()->json([
                'success' => true,
                'message' => 'User berhasil dibuat',
                'data' => $user,
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
     * Update user
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'role_id' => 'required|exists:roles,id',
            'organization_id' => 'required|exists:organizations,id',
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users')->ignore($id),
            ],
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
            'is_active' => 'nullable|boolean',
            'is_blocked' => 'nullable|boolean',
            'can_login' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = $this->service->update($id, $validator->validated(), $request);

            return response()->json([
                'success' => true,
                'message' => 'User berhasil diupdate',
                'data' => $user,
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
     * Delete user
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $this->service->destroy($id, $request);

            return response()->json([
                'success' => true,
                'message' => 'User berhasil dihapus',
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
     * Toggle user status
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        try {
            $user = $this->service->toggleStatus($id, $request);

            return response()->json([
                'success' => true,
                'message' => 'Status user berhasil diubah',
                'data' => $user,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Toggle user block
     */
    public function toggleBlock(Request $request, int $id): JsonResponse
    {
        try {
            $user = $this->service->toggleBlock($id, $request);

            return response()->json([
                'success' => true,
                'message' => $user->is_blocked ? 'User berhasil diblokir' : 'User berhasil dibuka blokirnya',
                'data' => $user,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}