<?php

namespace App\Services;

use App\Models\UserDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserDeviceService
{
    public function getAll(Request $request)
    {
        $search = $request->query('search');

        return UserDevice::query()

            ->with([
                'user.role',
                'user.organization',
            ])

            /*
            |--------------------------------------------------------------------------
            | SEARCH
            |--------------------------------------------------------------------------
            */

            ->when($search, function ($query) use ($search) {

                $query->where(function ($q) use ($search) {

                    $q->whereRaw(
                        'LOWER(device) LIKE ?',
                        ['%' . strtolower($search) . '%']
                    )

                    ->orWhereRaw(
                        'LOWER(browser) LIKE ?',
                        ['%' . strtolower($search) . '%']
                    )

                    ->orWhereRaw(
                        'LOWER(platform) LIKE ?',
                        ['%' . strtolower($search) . '%']
                    )

                    ->orWhereRaw(
                        'LOWER(ip_address) LIKE ?',
                        ['%' . strtolower($search) . '%']
                    );
                });
            })

            /*
            |--------------------------------------------------------------------------
            | SORT
            |--------------------------------------------------------------------------
            */

            ->latest('last_login_at')

            ->paginate(
                $request->query('per_page', 10)
            );
    }

    public function findById(int $id): UserDevice
    {
        return UserDevice::with([
            'user.role',
            'user.organization',
        ])->findOrFail($id);
    }

    public function destroy(int $id): bool
    {
        DB::beginTransaction();

        try {

            $device = UserDevice::findOrFail($id);

            $device->delete();

            DB::commit();

            return true;

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE USER DEVICES
    |--------------------------------------------------------------------------
    */

    public function deleteByUser(
        int $userId
    ): bool {

        DB::beginTransaction();

        try {

            UserDevice::where(
                'user_id',
                $userId
            )->delete();

            DB::commit();

            return true;

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK UNKNOWN DEVICE
    |--------------------------------------------------------------------------
    */

    public function isUnknownDevice(
        int $userId,
        string $ipAddress,
        string $browser,
        string $platform
    ): bool {

        return !UserDevice::where([

            'user_id' => $userId,

            'ip_address' => $ipAddress,

            'browser' => $browser,

            'platform' => $platform,

        ])->exists();
    }
}