<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\BlockedIp;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBlockedIp
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {

        $blocked = BlockedIp::where(
            'ip_address',
            $request->ip()
        )
        ->where('is_active', true)
        ->first();

        if ($blocked) {

            /*
            |--------------------------------------------------------------------------
            | AUTO EXPIRE
            |--------------------------------------------------------------------------
            */

            if ($blocked->isExpired()) {

                $blocked->update([

                    'is_active' => false,
                ]);

            } else {

                return response()->json([

                    'success' => false,

                    'message' =>
                        'IP address diblokir',

                    'reason' =>
                        $blocked->reason,

                    'blocked_until' =>
                        $blocked->blocked_until,

                ], 403);
            }
        }

        return $next($request);
    }
}