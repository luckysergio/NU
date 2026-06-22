<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProgramFieldService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProgramFieldController extends Controller
{
    public function __construct(
        protected ProgramFieldService $service
    ) {}

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $this->service->getAll($request)
        ]);
    }

    public function show(int $id)
    {
        return response()->json([
            'success' => true,
            'data' => $this->service->findById($id)
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make(
            $request->all(),
            $this->rules()
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => $this->service->store(
                $validator->validated()
            )
        ], 201);
    }

    public function update(
        Request $request,
        int $id
    ) {

        $validator = Validator::make(
            $request->all(),
            $this->rules()
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => $this->service->update(
                $id,
                $validator->validated()
            )
        ]);
    }

    public function destroy(int $id)
    {
        $this->service->destroy($id);

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil dihapus'
        ]);
    }

    private function rules(): array
    {
        return [
            'nama' => [
                'required',
                'string',
                'max:255'
            ],

            'is_active' => [
                'nullable',
                'boolean'
            ],
        ];
    }
}
