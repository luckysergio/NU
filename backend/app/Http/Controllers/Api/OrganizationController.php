<?php
// app/Http/Controllers/Api/OrganizationController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationLevel;
use App\Services\OrganizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Validator as ValidationValidator;

class OrganizationController extends Controller
{
    protected OrganizationService $service;

    public function __construct(OrganizationService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'organization_level_id' => 'nullable|exists:organization_levels,id',
            'organization_type_id' => 'nullable|exists:organization_types,id',
            'parent_id' => 'nullable|exists:organizations,id',
            'kota_id' => 'nullable|exists:kotas,id',
            'kecamatan_id' => 'nullable|exists:kecamatans,id',
            'kelurahan_id' => 'nullable|exists:kelurahans,id',
            'rw_id' => 'nullable|exists:rws,id',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|between:1,1000',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validasi gagal', $validator->errors(), 422);
        }

        return $this->successResponse(
            'List organisasi',
            $this->service->getAll($request),
            $this->extractFilters($request)
        );
    }

    public function show(int $id): JsonResponse
    {
        return $this->successResponse(
            'Detail organisasi',
            $this->service->findById($id)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), $this->rules());
        $this->validateByLevel($validator, $request);

        if ($validator->fails()) {
            return $this->errorResponse('Validasi gagal', $validator->errors(), 422);
        }

        try {
            $organization = $this->service->store($validator->validated(), $request);
            return $this->successResponse('Organisasi berhasil dibuat', $organization, null, 201);
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), null, 422);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), $this->rules());
        $this->validateByLevel($validator, $request, $id);

        if ($validator->fails()) {
            return $this->errorResponse('Validasi gagal', $validator->errors(), 422);
        }

        try {
            $organization = $this->service->update($id, $validator->validated(), $request);
            return $this->successResponse('Organisasi berhasil diupdate', $organization);
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), null, 422);
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $this->service->destroy($id, $request);
            return $this->successResponse('Organisasi berhasil dihapus');
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), null, 422);
        }
    }

    public function getAvailableParentsForLembagaBanom(Request $request): JsonResponse
    {
        try {
            $levelId = $request->query('organization_level_id');
            $organizationTypeId = $request->query('organization_type_id');
            $currentId = $request->query('current_id');

            if (!$levelId) {
                return $this->errorResponse('organization_level_id is required', null, 400);
            }

            $parents = $this->service->getAvailableParentsForLembagaBanom(
                (int) $levelId,
                $organizationTypeId ? (int) $organizationTypeId : null,
                $currentId ? (int) $currentId : null
            );

            return $this->successResponse('Data parent berhasil diambil', $parents);
        } catch (\Throwable $e) {
            Log::error('Error in getAvailableParentsForLembagaBanom: ' . $e->getMessage());
            return $this->errorResponse('Terjadi kesalahan: ' . $e->getMessage(), null, 500);
        }
    }

    public function getAvailableTypesForLembagaByParent(Request $request): JsonResponse
    {
        try {
            $parentId = $request->query('parent_id');
            $levelId = $request->query('organization_level_id');
            $currentId = $request->query('current_id');

            if (!$parentId || !$levelId) {
                return $this->errorResponse('parent_id and organization_level_id are required', null, 400);
            }

            $types = $this->service->getAvailableTypesForLembagaByParent(
                (int) $parentId,
                (int) $levelId,
                $currentId ? (int) $currentId : null
            );

            return $this->successResponse('Data tipe Lembaga berhasil diambil', $types);
        } catch (\Throwable $e) {
            Log::error('Error in getAvailableTypesForLembagaByParent: ' . $e->getMessage());
            return $this->errorResponse('Terjadi kesalahan: ' . $e->getMessage(), null, 500);
        }
    }

    public function getTypesWithBanomPc(Request $request): JsonResponse
    {
        try {
            $levelId = $request->query('organization_level_id');
            $currentId = $request->query('current_id');

            if (!$levelId) {
                return $this->errorResponse('organization_level_id is required', null, 400);
            }

            $types = $this->service->getTypesWithBanomPc(
                (int) $levelId,
                $currentId ? (int) $currentId : null
            );

            return $this->successResponse('Data tipe dengan Banom PC berhasil diambil', $types);
        } catch (\Throwable $e) {
            Log::error('Error in getTypesWithBanomPc: ' . $e->getMessage());
            return $this->errorResponse('Terjadi kesalahan: ' . $e->getMessage(), null, 500);
        }
    }

    public function getAvailableTypesForBanom(Request $request): JsonResponse
    {
        try {
            $levelId = $request->query('organization_level_id');
            $isBanomPc = $request->query('is_banom_pc', 'true') === 'true';
            $currentId = $request->query('current_id');

            if (!$levelId) {
                return $this->errorResponse('organization_level_id is required', null, 400);
            }

            $types = $this->service->getAvailableTypesForBanom(
                (int) $levelId,
                $isBanomPc,
                $currentId ? (int) $currentId : null
            );

            return $this->successResponse('Data tipe Banom berhasil diambil', $types);
        } catch (\Throwable $e) {
            Log::error('Error in getAvailableTypesForBanom: ' . $e->getMessage());
            return $this->errorResponse('Terjadi kesalahan: ' . $e->getMessage(), null, 500);
        }
    }

    public function getAvailableTypesForParent(Request $request): JsonResponse
    {
        try {
            $parentId = $request->query('parent_id');
            $levelId = $request->query('organization_level_id');
            $currentId = $request->query('current_id');

            if (!$parentId || !$levelId) {
                return $this->errorResponse('parent_id and organization_level_id are required', null, 400);
            }

            $types = $this->service->getAvailableTypesForParent(
                (int) $parentId,
                (int) $levelId,
                $currentId ? (int) $currentId : null
            );

            return $this->successResponse('Data tipe berhasil diambil', $types);
        } catch (\Throwable $e) {
            Log::error('Error in getAvailableTypesForParent: ' . $e->getMessage());
            return $this->errorResponse('Terjadi kesalahan: ' . $e->getMessage(), null, 500);
        }
    }

    public function getUsedKecamatanForBanom(Request $request): JsonResponse
    {
        try {
            $typeId = $request->query('type_id');
            $currentId = $request->query('current_id');

            if (!$typeId) {
                return $this->errorResponse('type_id is required', null, 400);
            }

            $usedKecamatanIds = $this->service->getUsedKecamatanForBanom(
                (int) $typeId,
                $currentId ? (int) $currentId : null
            );

            return $this->successResponse('Data kecamatan yang digunakan berhasil diambil', $usedKecamatanIds);
        } catch (\Throwable $e) {
            Log::error('Error in getUsedKecamatanForBanom: ' . $e->getMessage());
            return $this->errorResponse('Terjadi kesalahan: ' . $e->getMessage(), null, 500);
        }
    }

    // ============================================
    // VALIDATION
    // ============================================

    private function rules(): array
    {
        return [
            'organization_level_id' => 'required|exists:organization_levels,id',
            'organization_type_id' => 'nullable|exists:organization_types,id',
            'parent_id' => 'nullable|exists:organizations,id',
            'kota_id' => 'nullable|exists:kotas,id',
            'kecamatan_id' => 'nullable|exists:kecamatans,id',
            'kelurahan_id' => 'nullable|exists:kelurahans,id',
            'rw_id' => 'nullable|exists:rws,id',
            'nama' => 'required|string|max:255',
            'alamat' => 'nullable|string',
            'telepon' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'logo' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ];
    }

    private function validateByLevel(ValidationValidator $validator, Request $request, ?int $organizationId = null): void
    {
        $validator->after(function ($validator) use ($request, $organizationId) {
            $levelId = $request->organization_level_id;
            if (!$levelId) return;

            $level = OrganizationLevel::find($levelId);
            if (!$level) return;

            $slug = strtolower($level->slug);
            $fieldRules = $this->getLevelValidationRules($slug, $request, $organizationId);

            foreach ($fieldRules as $field => $rule) {
                if (!$rule['condition']()) {
                    $validator->errors()->add($field, $rule['message']);
                }
            }

            if (in_array($slug, ['lembaga', 'banom'])) {
                $this->validateLembagaBanom($validator, $request, $slug);
            }
        });
    }

    private function getLevelValidationRules(string $slug, Request $request, ?int $organizationId): array
    {
        $rules = [];

        switch ($slug) {
            case 'pc':
                $rules['kota_id'] = [
                    'condition' => fn() => (bool) $request->kota_id,
                    'message' => 'Kota wajib dipilih untuk level PC.'
                ];
                break;
            case 'mwc':
                $rules['kecamatan_id'] = [
                    'condition' => fn() => (bool) $request->kecamatan_id,
                    'message' => 'Kecamatan wajib dipilih untuk level MWC.'
                ];
                break;
            case 'ranting':
                $rules['kelurahan_id'] = [
                    'condition' => fn() => (bool) $request->kelurahan_id,
                    'message' => 'Kelurahan wajib dipilih untuk level Ranting.'
                ];
                break;
            case 'anak-ranting':
                $rules['rw_id'] = [
                    'condition' => fn() => (bool) $request->rw_id,
                    'message' => 'RW wajib dipilih untuk level Anak Ranting.'
                ];
                break;
        }

        return $rules;
    }

    private function validateLembagaBanom(ValidationValidator $validator, Request $request, string $slug): void
    {
        if (!$request->parent_id) {
            $validator->errors()->add(
                'parent_id',
                'Organisasi induk wajib dipilih untuk level ' . ucfirst($slug) . '.'
            );
        }

        if ($slug === 'lembaga' && !$request->organization_type_id) {
            $validator->errors()->add(
                'organization_type_id',
                'Tipe organisasi wajib dipilih untuk level Lembaga.'
            );
        }

        if ($slug === 'banom' && $request->parent_id) {
            $parent = Organization::find($request->parent_id);
            
            if ($parent && $parent->organization_level_id === 6 && !$request->kecamatan_id) {
                $validator->errors()->add(
                    'kecamatan_id',
                    'Kecamatan wajib dipilih untuk Banom tingkat MWC.'
                );
            }

            if ($parent && $parent->organization_level_id === 1 && !$request->organization_type_id) {
                $validator->errors()->add(
                    'organization_type_id',
                    'Tipe organisasi wajib dipilih untuk Banom tingkat PC.'
                );
            }
        }
    }

    // ============================================
    // RESPONSE HELPERS
    // ============================================

    private function successResponse(string $message, $data = null, $filters = null, int $status = 200): JsonResponse
    {
        $response = ['success' => true, 'message' => $message];
        if ($filters) $response['filters'] = $filters;
        if ($data) $response['data'] = $data;
        return response()->json($response, $status);
    }

    private function errorResponse(string $message, $errors = null, int $status = 422): JsonResponse
    {
        $response = ['success' => false, 'message' => $message];
        if ($errors) $response['errors'] = $errors;
        return response()->json($response, $status);
    }

    private function extractFilters(Request $request): array
    {
        return [
            'organization_level_id' => $request->organization_level_id,
            'organization_type_id' => $request->organization_type_id,
            'parent_id' => $request->parent_id,
            'kota_id' => $request->kota_id,
            'kecamatan_id' => $request->kecamatan_id,
            'kelurahan_id' => $request->kelurahan_id,
            'rw_id' => $request->rw_id,
            'search' => $request->search,
        ];
    }
}