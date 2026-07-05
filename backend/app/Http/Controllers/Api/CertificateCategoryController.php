<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CertificateCategory;
use App\Services\CertificateCategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Cache;

class CertificateCategoryController extends Controller
{
    protected CertificateCategoryService $service;

    public function __construct(CertificateCategoryService $service)
    {
        $this->service = $service;
    }

    /**
     * Display a listing of certificate categories
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'per_page' => 'nullable|integer|min:1|max:100',
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

        if ($request->bypass_cache) {
            Cache::flush();
        }

        try {
            $data = $this->service->getAll($request);

            return response()->json([
                'success' => true,
                'message' => 'List kategori sertifikat',
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
     * Display the specified certificate category
     */
    public function show(int $id): JsonResponse
    {
        try {
            $category = $this->service->findById($id);

            return response()->json([
                'success' => true,
                'message' => 'Detail kategori sertifikat',
                'data' => $category,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori sertifikat tidak ditemukan',
            ], 404);
        }
    }

    /**
     * Display certificate category by slug
     */
    public function showBySlug(string $slug): JsonResponse
    {
        try {
            $category = $this->service->findBySlug($slug);

            return response()->json([
                'success' => true,
                'message' => 'Detail kategori sertifikat',
                'data' => $category,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori sertifikat tidak ditemukan',
            ], 404);
        }
    }

    /**
     * Get active categories for dropdown
     */
    public function active(Request $request): JsonResponse
    {
        try {
            $categories = $this->service->getActiveCategories();

            return response()->json([
                'success' => true,
                'message' => 'Kategori sertifikat aktif',
                'data' => $categories,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get categories with certificate count
     */
    public function withCount(Request $request): JsonResponse
    {
        try {
            $categories = $this->service->getWithCertificateCount();

            return response()->json([
                'success' => true,
                'message' => 'Kategori sertifikat dengan jumlah sertifikat',
                'data' => $categories,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created certificate category
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'is_active' => 'nullable|in:true,false,1,0,on,off,yes,no',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $validated = $validator->validated();

            if (isset($validated['is_active'])) {
                $validated['is_active'] = filter_var($validated['is_active'], FILTER_VALIDATE_BOOLEAN);
            } else {
                $validated['is_active'] = true;
            }

            $category = $this->service->store($validated, $request);

            return response()->json([
                'success' => true,
                'message' => 'Kategori sertifikat berhasil dibuat',
                'data' => $category,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update the specified certificate category
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'is_active' => 'nullable|in:true,false,1,0,on,off,yes,no',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $validated = $validator->validated();

            if (isset($validated['is_active'])) {
                $validated['is_active'] = filter_var($validated['is_active'], FILTER_VALIDATE_BOOLEAN);
            }

            $category = $this->service->update($id, $validated, $request);

            return response()->json([
                'success' => true,
                'message' => 'Kategori sertifikat berhasil diupdate',
                'data' => $category,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Toggle category status
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        try {
            $category = $this->service->toggleStatus($id, $request);

            return response()->json([
                'success' => true,
                'message' => 'Status kategori sertifikat berhasil diubah',
                'data' => $category,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove the specified certificate category
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $this->service->destroy($id, $request);

            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'Kategori sertifikat berhasil dihapus',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Check if slug is available
     */
    public function checkSlug(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'slug' => 'required|string|max:255',
            'exclude_id' => 'nullable|integer|exists:certificate_categories,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $slug = $request->slug;
            $excludeId = $request->exclude_id;

            $exists = CertificateCategory::where('slug', $slug)
                ->when($excludeId, function ($q) use ($excludeId) {
                    return $q->where('id', '!=', $excludeId);
                })
                ->exists();

            return response()->json([
                'success' => true,
                'data' => [
                    'is_available' => !$exists,
                    'message' => !$exists ? 'Slug tersedia' : 'Slug sudah digunakan',
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}