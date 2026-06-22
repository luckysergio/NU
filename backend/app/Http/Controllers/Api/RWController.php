<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RWService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class RWController extends Controller
{
    protected RWService $service;

    public function __construct(
        RWService $service
    ) {
        $this->service = $service;
    }

    public function index(
        Request $request
    ): JsonResponse {

        return response()->json([
            'status' => true,
            'data' => $this->service->getAll(
                $request->all()
            ),
        ]);
    }

    public function show(
        int $id
    ): JsonResponse {

        return response()->json([
            'status' => true,
            'data' => $this->service->find($id),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE FOR ANAK RANTING
    |--------------------------------------------------------------------------
    */

    public function availableForAnakRanting(
        Request $request
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            [
                'kelurahan_id' => [
                    'nullable',
                    'exists:kelurahans,id',
                ],
                'ignore_organization_id' => [
                    'nullable',
                    'exists:organizations,id',
                ],
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        return response()->json([
            'status' => true,
            'message' => 'List RW tersedia untuk Anak Ranting',
            'data' => $this->service->availableForAnakRanting(
                $request->query('ignore_organization_id'),
                $request->query('kelurahan_id')
            ),
        ]);
    }

    public function store(
        Request $request
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            [
                'kelurahan_id' => [
                    'required',
                    'exists:kelurahans,id',
                ],

                'nomor' => [
                    'required',
                    'string',
                    'max:5',
                ],

                'is_active' => [
                    'nullable',
                    'boolean',
                ],
            ]
        );

        if ($validator->fails()) {

            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $rw = $this->service->create(
            $validator->validated()
        );

        return response()->json([
            'status'  => true,
            'message' => 'RW berhasil dibuat',
            'data'    => $rw->load([
                'kelurahan',
                'kelurahan.kecamatan',
                'kelurahan.kecamatan.kota',
            ]),
        ], 201);
    }

    public function update(
        Request $request,
        int $id
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            [
                'kelurahan_id' => [
                    'required',
                    'exists:kelurahans,id',
                ],

                'nomor' => [
                    'required',
                    'string',
                    'max:5',
                ],

                'is_active' => [
                    'nullable',
                    'boolean',
                ],
            ]
        );

        if ($validator->fails()) {

            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $rw = $this->service->update(
            $id,
            $validator->validated()
        );

        return response()->json([
            'status'  => true,
            'message' => 'RW berhasil diubah',
            'data'    => $rw,
        ]);
    }

    public function destroy(
        int $id
    ): JsonResponse {

        try {
            $this->service->delete($id);

            return response()->json([
                'status'  => true,
                'message' => 'RW berhasil dihapus',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}