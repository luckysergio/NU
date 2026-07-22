<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CertificateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class CertificateController extends Controller
{
    protected CertificateService $service;

    public function __construct(CertificateService $service)
    {
        $this->service = $service;
    }

    /**
     * Get all certificates
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
            'biodata_id' => 'nullable|exists:biodatas,id',
            'certificate_category_id' => 'nullable|exists:certificate_categories,id',
            'is_active' => 'nullable|boolean',
            'per_page' => 'nullable|integer|min:1|max:1000',
            'sort_order' => 'nullable|in:asc,desc',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();
            $data = $this->service->getAll($request, $user);

            return response()->json([
                'success' => true,
                'message' => 'List sertifikat berhasil diambil',
                'data' => $data,
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
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
            $user = Auth::user();
            $data = $this->service->findById($id, $user);

            return response()->json([
                'success' => true,
                'message' => 'Detail sertifikat berhasil diambil',
                'data' => $data,
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sertifikat tidak ditemukan',
            ], 404);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'biodata_id' => 'required|exists:biodatas,id',
            'certificate_category_id' => 'required|exists:certificate_categories,id',
            'nama' => 'required|string|max:255',
            'nomor_sertifikat' => 'nullable|string|max:100',
            'tanggal_terbit' => 'nullable|date',
            'tanggal_expired' => 'nullable|date|after:tanggal_terbit',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();
            $data = $validator->validated();
            $certificate = $this->service->store($data, $request, $user);

            return response()->json([
                'success' => true,
                'message' => 'Sertifikat berhasil dibuat',
                'data' => $certificate,
            ], 201);
        } catch (AuthorizationException $e) {
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

    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'biodata_id' => 'nullable|exists:biodatas,id',
            'certificate_category_id' => 'nullable|exists:certificate_categories,id',
            'nama' => 'nullable|string|max:255',
            'nomor_sertifikat' => 'nullable|string|max:100',
            'tanggal_terbit' => 'nullable|date',
            'tanggal_expired' => 'nullable|date|after:tanggal_terbit',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();
            $data = array_filter($validator->validated(), fn($value) => $value !== null);
            $certificate = $this->service->update($id, $data, $request, $user);

            return response()->json([
                'success' => true,
                'message' => 'Sertifikat berhasil diupdate',
                'data' => $certificate,
            ]);
        } catch (AuthorizationException $e) {
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

    public function destroy(int $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $this->service->destroy($id, $user);

            return response()->json([
                'success' => true,
                'message' => 'Sertifikat berhasil dihapus',
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function download(int $id)
    {
        try {
            $user = Auth::user();
            return $this->service->download($id, $user);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengunduh file',
            ], 500);
        }
    }

    public function getByBiodata(int $biodataId): JsonResponse
    {
        try {
            $user = Auth::user();
            $data = $this->service->getByBiodata($biodataId, $user);

            return response()->json([
                'success' => true,
                'message' => 'Sertifikat anggota berhasil diambil',
                'data' => $data,
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getCategories(): JsonResponse
    {
        try {
            $data = $this->service->getCategories();

            return response()->json([
                'success' => true,
                'message' => 'Kategori sertifikat berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255|unique:certificate_categories,nama',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();
            $data = $validator->validated();
            $category = $this->service->storeCategory($data, $user);

            return response()->json([
                'success' => true,
                'message' => 'Kategori sertifikat berhasil dibuat',
                'data' => $category,
            ], 201);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'sometimes|string|max:255|unique:certificate_categories,nama,' . $id,
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = Auth::user();
            $data = $validator->validated();
            $category = $this->service->updateCategory($id, $data, $user);

            return response()->json([
                'success' => true,
                'message' => 'Kategori sertifikat berhasil diupdate',
                'data' => $category,
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroyCategory(int $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $this->service->destroyCategory($id, $user);

            return response()->json([
                'success' => true,
                'message' => 'Kategori sertifikat berhasil dihapus',
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }
}