<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(
        Request $request,
        Closure $next,
        string ...$roles
    ): Response {

        $user = auth('api')->user();

        if (!$user) {

            return response()->json([

                'success' => false,

                'message' => 'Unauthorized',

            ], 401);
        }

        $userRole = $user->role?->slug;

        if (!in_array($userRole, $roles)) {

            return response()->json([

                'success' => false,

                'message' => 'Anda tidak memiliki akses',

            ], 403);
        }

        return $next($request);
    }
}