<?php

namespace App\Http\Controllers\Api;

use Throwable;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Services\ProgramThemeService;
use App\Models\ProgramTheme;

class ProgramThemeController extends Controller
{
    protected ProgramThemeService $service;

    public function __construct(ProgramThemeService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make(
            $request->all(),
            [
                'search' => 'nullable|string|max:255',
                'tahun' => 'nullable|integer|min:2000|max:2100',
                'from_year' => 'nullable|integer|min:2000|max:2100',
                'to_year' => 'nullable|integer|min:2000|max:2100',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'organization_id' => 'nullable|exists:organizations,id',
                'per_page' => 'nullable|integer|min:1|max:100',
                'page' => 'nullable|integer|min:1',
                'bypass_cache' => 'nullable|boolean',
                '_t' => 'nullable|integer',
            ]
        );

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
                'message' => 'List tema program',
                'data' => $data,
            ]);
        } catch (Throwable $e) {
            Log::error('ProgramThemeController index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getActiveThemes(): JsonResponse
    {
        try {
            $themes = ProgramTheme::where('is_active', true)
                ->orderBy('tahun', 'desc')
                ->orderBy('nama')
                ->get(['id', 'nama', 'tahun', 'tanggal_mulai', 'tanggal_selesai']);

            return response()->json([
                'success' => true,
                'message' => 'List tema aktif',
                'data' => $themes,
            ]);
        } catch (Throwable $e) {
            Log::error('ProgramThemeController getActiveThemes error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getAvailableYears(): JsonResponse
    {
        try {
            $years = $this->service->getAvailableYears();

            return response()->json([
                'success' => true,
                'message' => 'List tahun yang tersedia',
                'data' => $years,
            ]);
        } catch (Throwable $e) {
            Log::error('ProgramThemeController getAvailableYears error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $data = $this->service->findById($id);

            return response()->json([
                'success' => true,
                'message' => 'Detail tema program',
                'data' => $data,
            ]);
        } catch (Throwable $e) {
            Log::error('ProgramThemeController show error: ' . $e->getMessage(), [
                'id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            $statusCode = $e->getCode() === 403 ? 403 : 404;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    public function getThemeStatistics(int $themeId, int $mwcId): JsonResponse
    {
        try {
            $data = $this->service->getThemeStatisticsForMWC($themeId, $mwcId);

            return response()->json([
                'success' => true,
                'message' => 'Statistik tema program',
                'data' => $data,
            ]);
        } catch (Throwable $e) {
            Log::error('ProgramThemeController getThemeStatistics error: ' . $e->getMessage(), [
                'theme_id' => $themeId,
                'mwc_id' => $mwcId,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make(
            $request->all(),
            $this->rules()
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $theme = $this->service->store($validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Tema program berhasil dibuat',
                'data' => $theme,
            ], 201);
        } catch (Throwable $e) {
            Log::error('ProgramThemeController store error: ' . $e->getMessage(), [
                'data' => $validator->validated(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make(
            $request->all(),
            $this->rules($id)
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $theme = $this->service->update($id, $validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Tema program berhasil diubah',
                'data' => $theme,
            ]);
        } catch (Throwable $e) {
            Log::error('ProgramThemeController update error: ' . $e->getMessage(), [
                'id' => $id,
                'data' => $validator->validated(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->destroy($id);

            return response()->json([
                'success' => true,
                'message' => 'Tema program berhasil dihapus',
            ]);
        } catch (Throwable $e) {
            Log::error('ProgramThemeController destroy error: ' . $e->getMessage(), [
                'id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    private function rules(?int $id = null): array
    {
        return [
            'organization_id' => [
                'nullable',
                'exists:organizations,id',
            ],
            'nama' => [
                'required',
                'string',
                'max:255',
            ],
            'deskripsi' => [
                'nullable',
                'string',
            ],
            'tahun' => [
                'required',
                'integer',
                'min:2000',
                'max:2100',
            ],
            'tanggal_mulai' => [
                'required',
                'date',
            ],
            'tanggal_selesai' => [
                'required',
                'date',
                'after_or_equal:tanggal_mulai',
            ],
            'is_active' => [
                'nullable',
                'boolean',
            ],
        ];
    }
}