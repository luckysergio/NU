<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    protected RoleService $service;

    public function __construct(
        RoleService $service
    ) {
        $this->service = $service;
    }

    public function index(
        Request $request
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' => 'List role',

            'data' => $this->service
                ->getAll($request),
        ]);
    }

    public function show(
        int $id
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' => 'Detail role',

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
                    'unique:roles,nama',
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

        $role = $this->service->store(
            $validator->validated(),
            $request
        );

        return response()->json([

            'success' => true,

            'message' => 'Role berhasil dibuat',

            'data' => $role,

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
                    Rule::unique('roles')
                        ->ignore($id),
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

        $role = $this->service->update(
            $id,
            $validator->validated(),
            $request
        );

        return response()->json([

            'success' => true,

            'message' => 'Role berhasil diupdate',

            'data' => $role,
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

            'message' => 'Role berhasil dihapus',
        ]);
    }
}
