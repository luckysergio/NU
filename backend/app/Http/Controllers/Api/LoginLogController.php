<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LoginLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoginLogController extends Controller
{
    protected LoginLogService $service;

    public function __construct(
        LoginLogService $service
    ) {
        $this->service = $service;
    }

    public function index(
        Request $request
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' => 'List log login',

            'data' => $this->service
                ->getAll($request),
        ]);
    }

    public function show(
        int $id
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' => 'Detail log login',

            'data' => $this->service
                ->findById($id),
        ]);
    }
}
