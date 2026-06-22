<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OrganizationLevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OrganizationLevelController extends Controller
{
    protected OrganizationLevelService $service;

    public function __construct(
        OrganizationLevelService $service
    ) {
        $this->service = $service;
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json([

            'success' => true,

            'message' => 'List level organisasi',

            'data' => $this->service->getAll($request),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([

            'success' => true,

            'message' => 'Detail level organisasi',

            'data' => $this->service->findById($id),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make(
            $request->all(),
            [

                'nama' => [
                    'required',
                    'string',
                    'max:100',
                ],

                'urutan' => [
                    'required',
                    'integer',
                    'min:1',
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

        $data = $this->service->store(
            $validator->validated(),
            $request
        );

        return response()->json([

            'success' => true,

            'message' => 'Level organisasi berhasil dibuat',

            'data' => $data,

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
                    'max:100',
                ],

                'urutan' => [
                    'required',
                    'integer',
                    'min:1',
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

        $data = $this->service->update(
            $id,
            $validator->validated(),
            $request
        );

        return response()->json([

            'success' => true,

            'message' => 'Level organisasi berhasil diupdate',

            'data' => $data,
        ]);
    }

    public function destroy(
        Request $request,
        int $id
    ): JsonResponse {

        $this->service->destroy($id, $request);

        return response()->json([

            'success' => true,

            'message' => 'Level organisasi berhasil dihapus',
        ]);
    }
}
