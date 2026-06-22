<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProgramGoalService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ProgramGoalController extends Controller
{
    protected ProgramGoalService $service;

    public function __construct(
        ProgramGoalService $service
    ) {
        $this->service = $service;
    }

    public function index(
        Request $request
    ): JsonResponse {

        return response()->json([
            'success' => true,
            'message' => 'List tujuan program',
            'data' => $this->service->getAll($request),
        ]);
    }

    public function show(
        int $id
    ): JsonResponse {

        return response()->json([
            'success' => true,
            'message' => 'Detail tujuan program',
            'data' => $this->service->findById($id),
        ]);
    }

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

        $goal = $this->service->store(
            $validator->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Tujuan program berhasil dibuat',
            'data' => $goal,
        ], 201);
    }

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

        $goal = $this->service->update(
            $id,
            $validator->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Tujuan program berhasil diperbarui',
            'data' => $goal,
        ]);
    }

    public function destroy(
        int $id
    ): JsonResponse {

        $this->service->destroy($id);

        return response()->json([
            'success' => true,
            'message' => 'Tujuan program berhasil dihapus',
        ]);
    }

    private function rules(): array
    {
        return [

            'nama' => [
                'required',
                'string',
                'max:255',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],
        ];
    }
}