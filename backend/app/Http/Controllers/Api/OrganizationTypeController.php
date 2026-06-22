<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OrganizationTypeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OrganizationTypeController extends Controller
{
    protected OrganizationTypeService $service;

    public function __construct(
        OrganizationTypeService $service
    ) {
        $this->service = $service;
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
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

                'search' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

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

            'message' => 'List tipe organisasi',

            'data' => $this->service
                ->getAll($request),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE BY LEVEL
    |--------------------------------------------------------------------------
    */

    public function availableByLevel(
        int $levelId
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' =>
            'List tipe organisasi tersedia',

            'data' => $this->service
                ->getAvailableByLevel($levelId),
        ]);
    }

    public function unusedByLevel(
        Request $request,
        int $levelId
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' =>
            'List tipe organisasi yang belum digunakan',

            'data' => $this->service
                ->getUnusedByLevel(
                    $levelId,
                    $request->query('ignore_organization_id')
                ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    public function show(
        int $id
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' => 'Detail tipe organisasi',

            'data' => $this->service
                ->findById($id),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(
        Request $request
    ): JsonResponse {

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

            $type = $this->service->store(
                $validator->validated(),
                $request
            );

            return response()->json([

                'success' => true,

                'message' =>
                'Tipe organisasi berhasil dibuat',

                'data' => $type,

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
    | UPDATE
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

        if ($validator->fails()) {

            return response()->json([

                'success' => false,

                'message' => 'Validasi gagal',

                'errors' => $validator->errors(),

            ], 422);
        }

        try {

            $type = $this->service->update(
                $id,
                $validator->validated(),
                $request
            );

            return response()->json([

                'success' => true,

                'message' =>
                'Tipe organisasi berhasil diupdate',

                'data' => $type,
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
    | DELETE
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
                'Tipe organisasi berhasil dihapus',
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
    | RULES
    |--------------------------------------------------------------------------
    */

    private function rules(): array
    {
        return [

            'organization_level_id' => [
                'required',
                'exists:organization_levels,id',
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

            'is_active' => [
                'nullable',
                'boolean',
            ],
        ];
    }
}
