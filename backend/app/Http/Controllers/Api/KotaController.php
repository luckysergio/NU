<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\KotaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class KotaController extends Controller
{
    protected KotaService $service;

    public function __construct(
        KotaService $service
    ) {
        $this->service = $service;
    }

    /*
    |--------------------------------------------------------------------------
    | LIST
    |--------------------------------------------------------------------------
    */

    public function index(
        Request $request
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' => 'List kota',

            'data' => $this->service
                ->getAll($request),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL
    |--------------------------------------------------------------------------
    */

    public function show(
        int $id
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' => 'Detail kota',

            'data' => $this->service
                ->findById($id),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE FOR PC
    |--------------------------------------------------------------------------
    */

    public function availableForPC(
        Request $request
    ): JsonResponse {

        $ignoreOrganizationId =
            $request->query(
                'ignore_organization_id'
            );

        return response()->json([

            'success' => true,

            'message' =>
                'List kota tersedia untuk PC',

            'data' => $this->service
                ->availableForPC(
                    $ignoreOrganizationId
                ),
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
            [

                'nama' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'kode' => [
                    'required',
                    'string',
                    'max:20',
                    'unique:kotas,kode',
                ],

                'is_active' => [
                    'nullable',
                    'boolean',
                ],
            ]
        );

        if ($validator->fails()) {

            return response()->json([

                'success' => false,

                'message' =>
                    'Validasi gagal',

                'errors' =>
                    $validator->errors(),

            ], 422);
        }

        try {

            $kota = $this->service->store(
                $validator->validated(),
                $request
            );

            return response()->json([

                'success' => true,

                'message' =>
                    'Kota berhasil dibuat',

                'data' => $kota,

            ], 201);

        } catch (\Throwable $e) {

            return response()->json([

                'success' => false,

                'message' =>
                    $e->getMessage(),

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
            [

                'nama' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'kode' => [
                    'required',
                    'string',
                    'max:20',
                    'unique:kotas,kode,' . $id,
                ],

                'is_active' => [
                    'nullable',
                    'boolean',
                ],
            ]
        );

        if ($validator->fails()) {

            return response()->json([

                'success' => false,

                'message' =>
                    'Validasi gagal',

                'errors' =>
                    $validator->errors(),

            ], 422);
        }

        try {

            $kota = $this->service->update(
                $id,
                $validator->validated(),
                $request
            );

            return response()->json([

                'success' => true,

                'message' =>
                    'Kota berhasil diupdate',

                'data' => $kota,
            ]);

        } catch (\Throwable $e) {

            return response()->json([

                'success' => false,

                'message' =>
                    $e->getMessage(),

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
                    'Kota berhasil dihapus',
            ]);

        } catch (\Throwable $e) {

            return response()->json([

                'success' => false,

                'message' =>
                    $e->getMessage(),

            ], 422);
        }
    }
}