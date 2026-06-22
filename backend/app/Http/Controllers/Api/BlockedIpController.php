<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BlockedIpService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BlockedIpController extends Controller
{
    protected BlockedIpService $service;

    public function __construct(
        BlockedIpService $service
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

            'message' => 'Daftar blocked IP',

            'data' => $this->service
                ->getAll($request),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    public function show(
        int $id
    ): JsonResponse {

        return response()->json([

            'success' => true,

            'message' => 'Detail blocked IP',

            'data' => $this->service
                ->findById($id),
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

        $validated = $request->validate([

            'ip_address' => [
                'required',
                'ip',
            ],

            'reason' => [
                'nullable',
                'string',
            ],

            'minutes' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $blocked = $this->service->block(

            $validated['ip_address'],

            $validated['reason'] ?? null,

            $validated['minutes'] ?? null
        );

        return response()->json([

            'success' => true,

            'message' => 'IP berhasil diblokir',

            'data' => $blocked,
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

        $validated = $request->validate([

            'reason' => [
                'nullable',
                'string',
            ],

            'minutes' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],
        ]);

        $blocked = $this->service->update(
            $id,
            $validated
        );

        return response()->json([

            'success' => true,

            'message' => 'Blocked IP berhasil diupdate',

            'data' => $blocked,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UNBLOCK
    |--------------------------------------------------------------------------
    */

    public function unblock(
        int $id
    ): JsonResponse {

        $blocked = $this->service
            ->unblock($id);

        return response()->json([

            'success' => true,

            'message' => 'IP berhasil dibuka',

            'data' => $blocked,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DESTROY
    |--------------------------------------------------------------------------
    */

    public function destroy(
        int $id
    ): JsonResponse {

        $this->service->delete($id);

        return response()->json([

            'success' => true,

            'message' => 'Blocked IP berhasil dihapus',
        ]);
    }
}