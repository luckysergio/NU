<?php

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

    public function __construct(
        OrganizationService $service
    ) {
        $this->service = $service;
    }

    /*
    |--------------------------------------------------------------------------
    | List Organization
    |--------------------------------------------------------------------------
    */

    public function index(
        Request $request
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            [

                'organization_level_id' => [
                    'nullable',
                    'exists:organization_levels,id',
                ],

                'organization_type_id' => [
                    'nullable',
                    'exists:organization_types,id',
                ],

                'parent_id' => [
                    'nullable',
                    'exists:organizations,id',
                ],

                'kota_id' => [
                    'nullable',
                    'exists:kotas,id',
                ],

                'kecamatan_id' => [
                    'nullable',
                    'exists:kecamatans,id',
                ],

                'kelurahan_id' => [
                    'nullable',
                    'exists:kelurahans,id',
                ],

                'rw_id' => [
                    'nullable',
                    'exists:rws,id',
                ],

                'search' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                /*
                |--------------------------------------------------------------------------
                | PER PAGE SAFE
                |--------------------------------------------------------------------------
                */

                'per_page' => [
                    'nullable',
                    'integer',
                    'between:1,1000',
                ],
            ]
        );

        if ($validator->fails()) {

            return response()->json([

                'success' => false,

                'message' => 'Validasi gagal',

                'errors' => $validator->errors(),

            ], 422);
        }

        return response()->json([

            'success' => true,

            'message' => 'List organisasi',

            'filters' => [

                'organization_level_id' =>
                    $request->organization_level_id,

                'organization_type_id' =>
                    $request->organization_type_id,

                'parent_id' =>
                    $request->parent_id,

                'kota_id' =>
                    $request->kota_id,

                'kecamatan_id' =>
                    $request->kecamatan_id,

                'kelurahan_id' =>
                    $request->kelurahan_id,

                'rw_id' =>
                    $request->rw_id,

                'search' =>
                    $request->search,
            ],

            'data' => $this->service
                ->getAll($request),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Detail Organization
    |--------------------------------------------------------------------------
    */

    public function show(
        int $id
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' => 'Detail organisasi',

            'data' => $this->service
                ->findById($id),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Store Organization
    |--------------------------------------------------------------------------
    */

    public function store(
        Request $request
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            $this->rules()
        );

        $this->validateByLevel(
            $validator,
            $request
        );

        if ($validator->fails()) {

            return response()->json([

                'success' => false,

                'message' => 'Validasi gagal',

                'errors' => $validator->errors(),

            ], 422);
        }

        try {

            $organization = $this->service
                ->store(
                    $validator->validated(),
                    $request
                );

            return response()->json([

                'success' => true,

                'message' =>
                    'Organisasi berhasil dibuat',

                'data' => $organization,

            ], 201);

        } catch (\Throwable $e) {

            return response()->json([

                'success' => false,

                'message' => $e->getMessage(),

            ], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Update Organization
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        int $id
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            $this->rules()
        );

        $this->validateByLevel(
            $validator,
            $request,
            $id
        );

        if ($validator->fails()) {

            return response()->json([

                'success' => false,

                'message' => 'Validasi gagal',

                'errors' => $validator->errors(),

            ], 422);
        }

        try {

            $organization = $this->service
                ->update(
                    $id,
                    $validator->validated(),
                    $request
                );

            return response()->json([

                'success' => true,

                'message' =>
                    'Organisasi berhasil diupdate',

                'data' => $organization,

            ]);

        } catch (\Throwable $e) {

            return response()->json([

                'success' => false,

                'message' => $e->getMessage(),

            ], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Organization
    |--------------------------------------------------------------------------
    */

    public function destroy(
        Request $request,
        int $id
    ): JsonResponse {

        try {

            $this->service->destroy(
                $id,
                $request
            );

            return response()->json([

                'success' => true,

                'message' =>
                    'Organisasi berhasil dihapus',
            ]);

        } catch (\Throwable $e) {

            return response()->json([

                'success' => false,

                'message' => $e->getMessage(),

            ], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET AVAILABLE PARENTS FOR LEMBAGA/BANOM
    |--------------------------------------------------------------------------
    */

    public function getAvailableParentsForLembagaBanom(Request $request): JsonResponse
    {
        try {
            $levelId = $request->query('organization_level_id');
            $organizationTypeId = $request->query('organization_type_id');
            $currentId = $request->query('current_id');

            if (!$levelId) {
                return response()->json([
                    'success' => false,
                    'message' => 'organization_level_id is required'
                ], 400);
            }

            $parents = $this->service->getAvailableParentsForLembagaBanom(
                (int) $levelId,
                $organizationTypeId ? (int) $organizationTypeId : null,
                $currentId ? (int) $currentId : null
            );

            return response()->json([
                'success' => true,
                'data' => $parents,
                'message' => 'Data parent berhasil diambil'
            ]);

        } catch (\Throwable $e) {
            Log::error('Error in getAvailableParentsForLembagaBanom: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET TYPES WITH BANOM PC
    |--------------------------------------------------------------------------
    */

    public function getTypesWithBanomPc(Request $request): JsonResponse
    {
        try {
            $levelId = $request->query('organization_level_id');
            $currentId = $request->query('current_id');

            if (!$levelId) {
                return response()->json([
                    'success' => false,
                    'message' => 'organization_level_id is required'
                ], 400);
            }

            $types = $this->service->getTypesWithBanomPc(
                (int) $levelId,
                $currentId ? (int) $currentId : null
            );

            return response()->json([
                'success' => true,
                'data' => $types,
                'message' => 'Data tipe dengan Banom PC berhasil diambil'
            ]);

        } catch (\Throwable $e) {
            Log::error('Error in getTypesWithBanomPc: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET AVAILABLE TYPES FOR BANOM
    |--------------------------------------------------------------------------
    */

    public function getAvailableTypesForBanom(Request $request): JsonResponse
    {
        try {
            $levelId = $request->query('organization_level_id');
            $isBanomPc = $request->query('is_banom_pc', 'true') === 'true';
            $currentId = $request->query('current_id');

            if (!$levelId) {
                return response()->json([
                    'success' => false,
                    'message' => 'organization_level_id is required'
                ], 400);
            }

            $types = $this->service->getAvailableTypesForBanom(
                (int) $levelId,
                $isBanomPc,
                $currentId ? (int) $currentId : null
            );

            return response()->json([
                'success' => true,
                'data' => $types,
                'message' => 'Data tipe Banom berhasil diambil'
            ]);

        } catch (\Throwable $e) {
            Log::error('Error in getAvailableTypesForBanom: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET AVAILABLE TYPES FOR PARENT
    |--------------------------------------------------------------------------
    */

    public function getAvailableTypesForParent(Request $request): JsonResponse
    {
        try {
            $parentId = $request->query('parent_id');
            $levelId = $request->query('organization_level_id');
            $currentId = $request->query('current_id');

            if (!$parentId || !$levelId) {
                return response()->json([
                    'success' => false,
                    'message' => 'parent_id and organization_level_id are required'
                ], 400);
            }

            $types = $this->service->getAvailableTypesForParent(
                (int) $parentId,
                (int) $levelId,
                $currentId ? (int) $currentId : null
            );

            return response()->json([
                'success' => true,
                'data' => $types,
                'message' => 'Data tipe berhasil diambil'
            ]);

        } catch (\Throwable $e) {
            Log::error('Error in getAvailableTypesForParent: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET USED KECAMATAN FOR BANOM
    |--------------------------------------------------------------------------
    */

    public function getUsedKecamatanForBanom(Request $request): JsonResponse
    {
        try {
            $typeId = $request->query('type_id');
            $currentId = $request->query('current_id');

            if (!$typeId) {
                return response()->json([
                    'success' => false,
                    'message' => 'type_id is required'
                ], 400);
            }

            $usedKecamatanIds = $this->service->getUsedKecamatanForBanom(
                (int) $typeId,
                $currentId ? (int) $currentId : null
            );

            return response()->json([
                'success' => true,
                'data' => $usedKecamatanIds,
                'message' => 'Data kecamatan yang digunakan berhasil diambil'
            ]);

        } catch (\Throwable $e) {
            Log::error('Error in getUsedKecamatanForBanom: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Base Rules
    |--------------------------------------------------------------------------
    */

    private function rules(): array
    {
        return [

            'organization_level_id' => [
                'required',
                'exists:organization_levels,id',
            ],

            'organization_type_id' => [
                'nullable',
                'exists:organization_types,id',
            ],

            'parent_id' => [
                'nullable',
                'exists:organizations,id',
            ],

            'kota_id' => [
                'nullable',
                'exists:kotas,id',
            ],

            'kecamatan_id' => [
                'nullable',
                'exists:kecamatans,id',
            ],

            'kelurahan_id' => [
                'nullable',
                'exists:kelurahans,id',
            ],

            'rw_id' => [
                'nullable',
                'exists:rws,id',
            ],

            'nama' => [
                'required',
                'string',
                'max:255',
            ],

            'alamat' => [
                'nullable',
                'string',
            ],

            'telepon' => [
                'nullable',
                'string',
                'max:20',
            ],

            'email' => [
                'nullable',
                'email',
                'max:255',
            ],

            'logo' => [
                'nullable',
                'string',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATION BY LEVEL
    |--------------------------------------------------------------------------
    */

    private function validateByLevel(
        ValidationValidator $validator,
        Request $request,
        ?int $organizationId = null
    ): void {

        $validator->after(function (
            ValidationValidator $validator
        ) use (
            $request,
            $organizationId
        ) {

            $levelId = $request->organization_level_id;

            if (!$levelId) {
                return;
            }

            $level = OrganizationLevel::find($levelId);

            if (!$level) {
                return;
            }

            $slug = strtolower($level->slug);

            /*
            |--------------------------------------------------------------------------
            | PC
            |--------------------------------------------------------------------------
            */

            if ($slug === 'pc') {

                if (!$request->kota_id) {

                    $validator->errors()->add(
                        'kota_id',
                        'Kota wajib dipilih untuk level PC.'
                    );
                } else {

                    $exists = Organization::where(
                        'kota_id',
                        $request->kota_id
                    )
                    ->whereHas('level', function ($q) {
                        $q->where('slug', 'pc');
                    })
                    ->when($organizationId, function ($q) use ($organizationId) {
                        $q->where('id', '!=', $organizationId);
                    })
                    ->exists();

                    if ($exists) {

                        $validator->errors()->add(
                            'kota_id',
                            'Kota sudah digunakan oleh PC lain.'
                        );
                    }
                }
            }

            /*
            |--------------------------------------------------------------------------
            | MWC
            |--------------------------------------------------------------------------
            */

            if ($slug === 'mwc') {

                if (!$request->kecamatan_id) {

                    $validator->errors()->add(
                        'kecamatan_id',
                        'Kecamatan wajib dipilih untuk level MWC.'
                    );
                } else {

                    $exists = Organization::where(
                        'kecamatan_id',
                        $request->kecamatan_id
                    )
                    ->whereHas('level', function ($q) {
                        $q->where('slug', 'mwc');
                    })
                    ->when($organizationId, function ($q) use ($organizationId) {
                        $q->where('id', '!=', $organizationId);
                    })
                    ->exists();

                    if ($exists) {

                        $validator->errors()->add(
                            'kecamatan_id',
                            'Kecamatan sudah digunakan oleh MWC lain.'
                        );
                    }
                }
            }

            /*
            |--------------------------------------------------------------------------
            | RANTING
            |--------------------------------------------------------------------------
            */

            if ($slug === 'ranting') {

                if (!$request->kelurahan_id) {

                    $validator->errors()->add(
                        'kelurahan_id',
                        'Kelurahan wajib dipilih untuk level Ranting.'
                    );
                } else {

                    $exists = Organization::where(
                        'kelurahan_id',
                        $request->kelurahan_id
                    )
                    ->whereHas('level', function ($q) {
                        $q->where('slug', 'ranting');
                    })
                    ->when($organizationId, function ($q) use ($organizationId) {
                        $q->where('id', '!=', $organizationId);
                    })
                    ->exists();

                    if ($exists) {

                        $validator->errors()->add(
                            'kelurahan_id',
                            'Kelurahan sudah digunakan oleh Ranting lain.'
                        );
                    }
                }
            }

            /*
            |--------------------------------------------------------------------------
            | ANAK RANTING
            |--------------------------------------------------------------------------
            */

            if ($slug === 'anak-ranting') {

                if (!$request->rw_id) {

                    $validator->errors()->add(
                        'rw_id',
                        'RW wajib dipilih untuk level Anak Ranting.'
                    );
                } else {

                    $exists = Organization::where(
                        'rw_id',
                        $request->rw_id
                    )
                    ->whereHas('level', function ($q) {
                        $q->where('slug', 'anak-ranting');
                    })
                    ->when($organizationId, function ($q) use ($organizationId) {
                        $q->where('id', '!=', $organizationId);
                    })
                    ->exists();

                    if ($exists) {

                        $validator->errors()->add(
                            'rw_id',
                            'RW sudah digunakan oleh Anak Ranting lain.'
                        );
                    }
                }
            }

            /*
            |--------------------------------------------------------------------------
            | LEMBAGA / BANOM
            |--------------------------------------------------------------------------
            */

            if (in_array($slug, ['lembaga', 'banom'])) {
                // Parent wajib untuk Lembaga dan Banom
                if (!$request->parent_id) {
                    $validator->errors()->add(
                        'parent_id',
                        'Organisasi induk wajib dipilih untuk level ' . ucfirst($slug) . '.'
                    );
                }

                // Untuk Lembaga: type_id wajib
                if ($slug === 'lembaga' && !$request->organization_type_id) {
                    $validator->errors()->add(
                        'organization_type_id',
                        'Tipe organisasi wajib dipilih untuk level Lembaga.'
                    );
                }

                // Untuk Banom MWC: kecamatan wajib
                if ($slug === 'banom' && $request->parent_id) {
                    // Cek apakah parent adalah Banom PC (level_id = 6)
                    $parent = Organization::find($request->parent_id);
                    if ($parent && $parent->organization_level_id === 6) {
                        if (!$request->kecamatan_id) {
                            $validator->errors()->add(
                                'kecamatan_id',
                                'Kecamatan wajib dipilih untuk Banom tingkat MWC.'
                            );
                        }
                    }
                }

                // Untuk Banom PC: type_id wajib
                if ($slug === 'banom' && $request->parent_id) {
                    $parent = Organization::find($request->parent_id);
                    if ($parent && $parent->organization_level_id === 1) {
                        if (!$request->organization_type_id) {
                            $validator->errors()->add(
                                'organization_type_id',
                                'Tipe organisasi wajib dipilih untuk Banom tingkat PC.'
                            );
                        }
                    }
                }
            }
        });
    }
}