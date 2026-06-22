<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    protected UserService $service;

    public function __construct(
        UserService $service
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

            'message' => 'List user',

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

            'message' => 'Detail user',

            'data' => $this->service
                ->findById($id),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE ROLES
    |--------------------------------------------------------------------------
    */

    public function availableRoles(
        int $organizationId
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' => 'Available roles',

            'data' => $this->service
                ->availableRoles($organizationId),
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

                'role_id' => [
                    'required',
                    'exists:roles,id',
                ],

                'organization_id' => [
                    'required',
                    'exists:organizations,id',
                ],

                'name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'email' => [
                    'required',
                    'email',
                    'max:255',
                    'unique:users,email',
                ],

                'phone' => [
                    'nullable',
                    'string',
                    'max:20',
                ],

                'password' => [
                    'required',
                    'string',
                    'min:6',
                ],

                'is_active' => [
                    'nullable',
                    'boolean',
                ],

                'is_blocked' => [
                    'nullable',
                    'boolean',
                ],

                'can_login' => [
                    'nullable',
                    'boolean',
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

        $user = $this->service->store(
            $validator->validated(),
            $request
        );

        return response()->json([

            'success' => true,

            'message' => 'User berhasil dibuat',

            'data' => $user,

        ], 201);
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

                'role_id' => [
                    'required',
                    'exists:roles,id',
                ],

                'organization_id' => [
                    'required',
                    'exists:organizations,id',
                ],

                'name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'email' => [
                    'required',
                    'email',
                    'max:255',
                    Rule::unique('users')
                        ->ignore($id),
                ],

                'phone' => [
                    'nullable',
                    'string',
                    'max:20',
                ],

                'password' => [
                    'nullable',
                    'string',
                    'min:6',
                ],

                'is_active' => [
                    'nullable',
                    'boolean',
                ],

                'is_blocked' => [
                    'nullable',
                    'boolean',
                ],

                'can_login' => [
                    'nullable',
                    'boolean',
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

        $user = $this->service->update(
            $id,
            $validator->validated(),
            $request
        );

        return response()->json([

            'success' => true,

            'message' => 'User berhasil diupdate',

            'data' => $user,
        ]);
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

        $this->service->destroy(
            $id,
            $request
        );

        return response()->json([

            'success' => true,

            'message' => 'User berhasil dihapus',
        ]);
    }
}