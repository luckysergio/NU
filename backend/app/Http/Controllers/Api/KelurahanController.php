<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\KelurahanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class KelurahanController extends Controller
{
    protected KelurahanService $service;

    public function __construct(
        KelurahanService $service
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

            'message' =>
                'List kelurahan',

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

            'message' =>
                'Detail kelurahan',

            'data' => $this->service
                ->findById($id),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE FOR RANTING
    |--------------------------------------------------------------------------
    */

    public function availableForRanting(
        Request $request
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' =>
                'List kelurahan tersedia untuk ranting',

            'data' => $this->service
                ->availableForRanting(

                    $request->query(
                        'ignore_organization_id'
                    ),

                    $request->query(
                        'kota_id'
                    ),

                    $request->query(
                        'kecamatan_id'
                    )
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

                'kecamatan_id' => [
                    'required',
                    'exists:kecamatans,id',
                ],

                'nama' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'kode' => [
                    'nullable',
                    'string',
                    'max:50',
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

            $kelurahan = $this->service
                ->store(
                    $validator->validated(),
                    $request
                );

            return response()->json([

                'success' => true,

                'message' =>
                    'Kelurahan berhasil dibuat',

                'data' => $kelurahan,

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

                'kecamatan_id' => [
                    'required',
                    'exists:kecamatans,id',
                ],

                'nama' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'kode' => [
                    'nullable',
                    'string',
                    'max:50',
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

            $kelurahan = $this->service
                ->update(
                    $id,
                    $validator->validated(),
                    $request
                );

            return response()->json([

                'success' => true,

                'message' =>
                    'Kelurahan berhasil diupdate',

                'data' => $kelurahan,
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
                    'Kelurahan berhasil dihapus',
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