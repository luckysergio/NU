<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RoleOrLevelMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Request  $request
     * @param  Closure  $next
     * @param  string  ...$rolesAndLevels
     * @return JsonResponse|mixed
     */
    public function handle(
        Request $request,
        Closure $next,
        string ...$rolesAndLevels
    ) {

        $user = auth('api')->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $userRole = $user->role?->slug;
        
        // Get user organization level
        $userLevel = null;
        $organization = $user->organization;
        
        if ($organization) {
            // Jika organization adalah object dengan relasi level
            if (is_object($organization) && method_exists($organization, 'level')) {
                $level = $organization->level;
                if ($level && is_object($level) && isset($level->slug)) {
                    $userLevel = $level->slug;
                } elseif (is_string($level) || is_numeric($level)) {
                    $userLevel = (string) $level;
                }
            } 
            // Jika organization adalah object dengan property level
            elseif (is_object($organization) && isset($organization->level)) {
                $level = $organization->level;
                if (is_object($level) && isset($level->slug)) {
                    $userLevel = $level->slug;
                } elseif (is_string($level) || is_numeric($level)) {
                    $userLevel = (string) $level;
                }
            }
            // Jika organization adalah string atau integer (level langsung)
            elseif (is_string($organization) || is_numeric($organization)) {
                $userLevel = (string) $organization;
            }
        }

        // Jika user tidak punya role, tolak
        if (!$userRole) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses',
            ], 403);
        }

        // Jika tidak ada parameter yang diberikan, tolak
        if (empty($rolesAndLevels)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke resource ini',
            ], 403);
        }

        // Cek setiap parameter yang diberikan
        foreach ($rolesAndLevels as $roleOrLevel) {
            // Format 1: "role,level" (dipisahkan koma) - Contoh: "admin,pc"
            if (str_contains($roleOrLevel, ',')) {
                $parts = explode(',', $roleOrLevel);
                $role = trim($parts[0]);
                $level = trim($parts[1] ?? '');
                
                if ($userRole === $role && $userLevel === $level) {
                    return $next($request);
                }
                continue;
            }
            
            // Format 2: "role|level" (dipisahkan pipe) - Contoh: "admin|pc"
            // Untuk backward compatibility
            if (str_contains($roleOrLevel, '|')) {
                $parts = explode('|', $roleOrLevel);
                $role = trim($parts[0]);
                $level = trim($parts[1] ?? '');
                
                if ($userRole === $role && $userLevel === $level) {
                    return $next($request);
                }
                continue;
            }
            
            // Format 3: Hanya role saja - Contoh: "super-admin"
            if ($userRole === $roleOrLevel) {
                return $next($request);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'Anda tidak memiliki akses ke resource ini',
        ], 403);
    }
}