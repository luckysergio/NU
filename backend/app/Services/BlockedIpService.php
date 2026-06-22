<?php

namespace App\Services;

use App\Models\BlockedIp;
use App\Models\LoginLog;
use Illuminate\Http\Request;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BlockedIpService
{
    /*
    |--------------------------------------------------------------------------
    | LIST
    |--------------------------------------------------------------------------
    */

    public function getAll(
        Request $request
    ): LengthAwarePaginator {

        $search = strtolower(
            $request->query('search', '')
        );

        return BlockedIp::query()

            ->when($search, function ($query) use ($search) {

                $query->whereRaw(
                    'LOWER(ip_address) LIKE ?',
                    ['%' . $search . '%']
                );
            })

            ->latest()

            ->paginate(
                (int) $request->query('per_page', 10)
            );
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    public function findById(
        int $id
    ): BlockedIp {

        return BlockedIp::findOrFail($id);
    }

    /*
    |--------------------------------------------------------------------------
    | BLOCK IP
    |--------------------------------------------------------------------------
    */

    public function block(
        string $ip,
        ?string $reason = null,
        ?int $minutes = null
    ): BlockedIp {

        return BlockedIp::updateOrCreate(

            [
                'ip_address' => $ip,
            ],

            [
                'reason' => $reason,

                'blocked_until' => $minutes
                    ? now()->addMinutes($minutes)
                    : null,

                'is_active' => true,
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(
        int $id,
        array $data
    ): BlockedIp {

        $blocked = BlockedIp::findOrFail($id);

        $blocked->update([

            'reason' => $data['reason'] ?? $blocked->reason,

            'blocked_until' =>
                isset($data['minutes'])
                    ? (
                        $data['minutes']
                            ? now()->addMinutes(
                                $data['minutes']
                            )
                            : null
                    )
                    : $blocked->blocked_until,

            'is_active' =>
                $data['is_active']
                    ?? $blocked->is_active,
        ]);

        return $blocked->fresh();
    }

    /*
    |--------------------------------------------------------------------------
    | UNBLOCK
    |--------------------------------------------------------------------------
    */

    public function unblock(
        int $id
    ): BlockedIp {

        $blocked = BlockedIp::findOrFail($id);

        $blocked->update([

            'is_active' => false,
        ]);

        return $blocked->fresh();
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function delete(
        int $id
    ): bool {

        $blocked = BlockedIp::findOrFail($id);

        return $blocked->delete();
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK BLOCKED
    |--------------------------------------------------------------------------
    */

    public function isBlocked(
        string $ip
    ): bool {

        $blocked = BlockedIp::where(
            'ip_address',
            $ip
        )
        ->where('is_active', true)
        ->first();

        if (!$blocked) {
            return false;
        }

        /*
        |--------------------------------------------------------------------------
        | AUTO EXPIRE
        |--------------------------------------------------------------------------
        */

        if ($blocked->isExpired()) {

            $blocked->update([
                'is_active' => false,
            ]);

            return false;
        }

        return true;
    }

    /*
    |--------------------------------------------------------------------------
    | AUTO BLOCK BRUTE FORCE
    |--------------------------------------------------------------------------
    */

    public function autoBlockFromFailedLogin(
        string $ip
    ): void {

        $failedCount = LoginLog::where(
            'ip_address',
            $ip
        )

        ->where('is_success', false)

        ->where(
            'created_at',
            '>=',
            now()->subMinutes(10)
        )

        ->count();

        /*
        |--------------------------------------------------------------------------
        | BLOCK IF TOO MANY FAILURES
        |--------------------------------------------------------------------------
        */

        if ($failedCount >= 5) {

            $this->block(

                $ip,

                'Terlalu banyak login gagal',

                60
            );
        }
    }
}