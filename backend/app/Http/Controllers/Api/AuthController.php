<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    protected AuthService $service;

    public function __construct(
        AuthService $service
    ) {
        $this->service = $service;
    }

    public function login(
        LoginRequest $request
    ): JsonResponse {

        $result = $this->service->login(

            $request->only(
                'email',
                'password'
            ),

            $request
        );

        return response()->json([

            'success' => $result['success'],

            'message' => $result['message'],

            'data' => $result['success']
                ? [

                    'access_token' =>
                        $result['token'],

                    'token_type' =>
                        $result['token_type'],

                    'expires_in' =>
                        $result['expires_in'],

                    'user' =>
                        new UserResource(
                            $result['user']
                        ),
                ]
                : null,

        ], $result['code']);
    }

    public function me(): JsonResponse
    {
        return response()->json([

            'success' => true,

            'data' => new UserResource(
                $this->service->me()
            ),
        ]);
    }

    public function refresh(): JsonResponse
    {
        $result = $this->service->refresh();

        return response()->json([

            'success' => $result['success'],

            'message' => $result['message'],

            'data' => $result['success']
                ? [

                    'access_token' =>
                        $result['token'],

                    'token_type' =>
                        $result['token_type'],

                    'expires_in' =>
                        $result['expires_in'],

                    'user' =>
                        new UserResource(
                            $result['user']
                        ),
                ]
                : null,

        ], $result['code']);
    }

    public function logout(): JsonResponse
    {
        $result = $this->service->logout();

        return response()->json([

            'success' => $result['success'],

            'message' => $result['message'],

        ], $result['code']);
    }
}