<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DocumentSpecificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DocumentSpecificationController
extends Controller
{
    protected DocumentSpecificationService $service;

    public function __construct(
        DocumentSpecificationService $service
    ) {
        $this->service = $service;
    }

    public function index(
        Request $request
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' =>
            'List spesifikasi dokumen',

            'data' => $this->service
                ->getAll($request),
        ]);
    }

    public function show(
        int $id
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' =>
            'Detail spesifikasi dokumen',

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
                    'unique:document_specifications,nama',
                ],

                'deskripsi' => [
                    'nullable',
                    'string',
                ],

                'urutan' => [
                    'required',
                    'integer',
                    'min:1',
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

        $documentSpecification =
            $this->service->store(
                $validator->validated(),
                $request
            );

        return response()->json([

            'success' => true,

            'message' =>
            'Spesifikasi dokumen berhasil dibuat',

            'data' =>
            $documentSpecification,

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
                    'unique:document_specifications,nama,' . $id,
                ],

                'deskripsi' => [
                    'nullable',
                    'string',
                ],

                'urutan' => [
                    'required',
                    'integer',
                    'min:1',
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

        $documentSpecification =
            $this->service->update(
                $id,
                $validator->validated(),
                $request
            );

        return response()->json([

            'success' => true,

            'message' =>
            'Spesifikasi dokumen berhasil diupdate',

            'data' =>
            $documentSpecification,
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
            'Spesifikasi dokumen berhasil dihapus',
        ]);
    }
}
