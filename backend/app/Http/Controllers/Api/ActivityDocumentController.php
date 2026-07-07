<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ActivityDocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Auth\Access\AuthorizationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityDocumentController extends Controller
{
    protected ActivityDocumentService $service;

    public function __construct(ActivityDocumentService $service)
    {
        $this->service = $service;
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX - List documents by activity
    |--------------------------------------------------------------------------
    */

    public function index(Request $request, int $activityId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:50',
            'file_type' => 'nullable|string|max:20',
            'sort_by' => 'nullable|string|in:uploaded_at,file_name,file_size,created_at',
            'sort_order' => 'nullable|string|in:asc,desc',
            'per_page' => 'nullable|integer|min:1|max:100',
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
            $data = $this->service->getAllByActivity($activityId, $request);

            return response()->json([
                'success' => true,
                'message' => 'List dokumen kegiatan berhasil diambil',
                'data' => $data,
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            Log::error('ActivityDocument index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan internal server',
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW - Get single document
    |--------------------------------------------------------------------------
    */

    public function show(int $id): JsonResponse
    {
        try {
            $document = $this->service->findById($id);

            return response()->json([
                'success' => true,
                'message' => 'Detail dokumen berhasil diambil',
                'data' => $document,
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            Log::error('ActivityDocument show error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Dokumen tidak ditemukan',
            ], 404);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STORE - Upload documents
    |--------------------------------------------------------------------------
    */

    public function store(Request $request, int $activityId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'documents' => 'required|array|max:10',
            'documents.*' => 'required|file|max:10240', // 10MB
            'description' => 'nullable|string|max:500',
            'category' => 'nullable|string|in:proposal,laporan,surat,anggaran,notulensi,sertifikat,dokumentasi,lainnya',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $result = $this->service->upload($activityId, $request);

            $message = "Berhasil mengupload {$result['success_count']} dokumen";
            if ($result['error_count'] > 0) {
                $message .= " ({$result['error_count']} file gagal)";
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $result,
            ], 201);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            Log::error('ActivityDocument upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE - Update document metadata
    |--------------------------------------------------------------------------
    */

    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'description' => 'nullable|string|max:500',
            'category' => 'nullable|string|in:proposal,laporan,surat,anggaran,notulensi,sertifikat,dokumentasi,lainnya',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $document = $this->service->update($id, $validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Dokumen berhasil diupdate',
                'data' => $document,
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            Log::error('ActivityDocument update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DESTROY - Delete document
    |--------------------------------------------------------------------------
    */

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->destroy($id);

            return response()->json([
                'success' => true,
                'message' => 'Dokumen berhasil dihapus',
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            Log::error('ActivityDocument destroy error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DOWNLOAD - Download document file
    |--------------------------------------------------------------------------
    */

    public function download(int $id)
    {
        try {
            return $this->service->download($id);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            Log::error('ActivityDocument download error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS - Get document statistics
    |--------------------------------------------------------------------------
    */

    public function statistics(int $activityId): JsonResponse
    {
        try {
            $stats = $this->service->getStatistics($activityId);

            return response()->json([
                'success' => true,
                'message' => 'Statistik dokumen berhasil diambil',
                'data' => $stats,
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            Log::error('ActivityDocument statistics error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan internal server',
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | OPTIONS - Get category options and allowed file types
    |--------------------------------------------------------------------------
    */

    public function options(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'categories' => $this->service->getCategoryOptions(),
                'allowed_file_types' => $this->service->getAllowedFileTypes(),
                'max_file_size' => 10485760, // 10MB
                'max_image_size' => 5242880, // 5MB
                'max_files_per_upload' => 10,
            ],
        ]);
    }
}