<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\JabatanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JabatanController extends Controller
{
    protected JabatanService $service;

    public function __construct(
        JabatanService $service
    ) {
        $this->service = $service;
    }

    public function index(
        Request $request
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' => 'List jabatan',

            'data' => $this->service
                ->getAll($request),
        ]);
    }

    public function show(
        int $id
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' => 'Detail jabatan',

            'data' => $this->service
                ->findById($id),
        ]);
    }

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
                    'unique:jabatans,nama',
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

                'message' => 'Validasi gagal',

                'errors' =>
                $validator->errors(),

            ], 422);
        }

        $jabatan = $this->service
            ->store(
                $validator->validated(),
                $request
            );

        return response()->json([

            'success' => true,

            'message' =>
            'Jabatan berhasil dibuat',

            'data' => $jabatan,

        ], 201);
    }

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
                    'unique:jabatans,nama,' . $id,
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

                'message' => 'Validasi gagal',

                'errors' =>
                $validator->errors(),

            ], 422);
        }

        $jabatan = $this->service
            ->update(
                $id,
                $validator->validated(),
                $request
            );

        return response()->json([

            'success' => true,

            'message' =>
            'Jabatan berhasil diupdate',

            'data' => $jabatan,
        ]);
    }

    public function destroy(
        Request $request,
        int $id
    ): JsonResponse {

        $this->service->destroy(
            $id,
            $request
        );

        return response()->json([

            'success' => true,

            'message' =>
            'Jabatan berhasil dihapus',
        ]);
    }
}
