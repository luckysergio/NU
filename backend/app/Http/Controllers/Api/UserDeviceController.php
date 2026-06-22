<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserDeviceResource;
use App\Services\UserDeviceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserDeviceController extends Controller
{
    protected UserDeviceService $service;

    public function __construct(
        UserDeviceService $service
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

        $devices = $this->service
            ->getAll($request);

        return response()->json([

            'success' => true,

            'message' =>
                'Daftar perangkat user',

            'data' => UserDeviceResource::collection(
                $devices
            ),

            'meta' => [

                'current_page' =>
                    $devices->currentPage(),

                'last_page' =>
                    $devices->lastPage(),

                'per_page' =>
                    $devices->perPage(),

                'total' =>
                    $devices->total(),
            ],
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

        $device = $this->service
            ->findById($id);

        return response()->json([

            'success' => true,

            'message' =>
                'Detail perangkat user',

            'data' => new UserDeviceResource(
                $device
            ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function destroy(
        int $id
    ): JsonResponse {

        $this->service->destroy($id);

        return response()->json([

            'success' => true,

            'message' =>
                'Perangkat berhasil dihapus',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE USER DEVICES
    |--------------------------------------------------------------------------
    */

    public function destroyByUser(
        int $userId
    ): JsonResponse {

        $this->service->deleteByUser(
            $userId
        );

        return response()->json([

            'success' => true,

            'message' =>
                'Semua perangkat user berhasil dihapus',
        ]);
    }
}