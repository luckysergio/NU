<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use App\Models\ProgramTheme;
use App\Models\Organization;
use App\Models\Anggota;
use App\Models\WorkProgram;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $service
    ) {}

    /**
     * Get dashboard statistics
     */
    public function index()
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Dashboard berhasil diambil.',
                'data' => $this->service->index(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check if user is Super Admin
     */
    protected function isSuperAdmin($user): bool
    {
        if (!$user) {
            return false;
        }

        if (method_exists($user, 'isSuperAdmin')) {
            return $user->isSuperAdmin();
        }

        if (method_exists($user, 'hasRole')) {
            return $user->hasRole('super_admin') || $user->hasRole('Super Admin');
        }

        if (isset($user->role)) {
            return $user->role === 'super_admin' || $user->role === 'Super Admin' || $user->role === 'admin';
        }

        if (method_exists($user, 'roles')) {
            return $user->roles()->whereIn('name', ['super_admin', 'Super Admin', 'admin'])->exists();
        }

        return false;
    }

    /**
     * Get organizations detail
     */
    public function getOrganizationsDetail(Request $request)
    {
        try {
            $authUser = Auth::user();
            
            if ($authUser && $this->isSuperAdmin($authUser)) {
                $organizations = Organization::with(['level', 'type', 'parent'])
                    ->when($request->query('level'), function ($q, $level) {
                        $q->whereHas('level', function ($sub) use ($level) {
                            $sub->where('slug', $level);
                        });
                    })
                    ->orderBy('nama')
                    ->get();
            } else {
                $pcId = $authUser?->organization?->getPcId();
                if (!$pcId) {
                    $organizations = collect([]);
                } else {
                    $descendantIds = Organization::find($pcId)?->descendants() ?? [];
                    $organizations = Organization::with(['level', 'type', 'parent'])
                        ->whereIn('id', array_merge([$pcId], $descendantIds))
                        ->when($request->query('level'), function ($q, $level) {
                            $q->whereHas('level', function ($sub) use ($level) {
                                $sub->where('slug', $level);
                            });
                        })
                        ->orderBy('nama')
                        ->get();
                }
            }

            return response()->json([
                'success' => true,
                'data' => $organizations,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get members detail
     */
    public function getMembersDetail(Request $request)
    {
        try {
            $authUser = Auth::user();
            
            if ($authUser && $this->isSuperAdmin($authUser)) {
                $query = Anggota::with(['organization', 'organization.level', 'jabatan']);
                
                if ($request->query('organization_id')) {
                    $query->where('organization_id', $request->query('organization_id'));
                }
                
                if ($request->query('level')) {
                    $query->whereHas('organization.level', function ($q) use ($request) {
                        $q->where('slug', $request->query('level'));
                    });
                }
                
                $members = $query->orderBy('nama')->paginate($request->query('per_page', 20));
            } else {
                $pcId = $authUser?->organization?->getPcId();
                if (!$pcId) {
                    $members = collect([]);
                } else {
                    $descendantIds = Organization::find($pcId)?->descendants() ?? [];
                    $organizationIds = array_merge([$pcId], $descendantIds);
                    
                    $query = Anggota::with(['organization', 'organization.level', 'jabatan'])
                        ->whereIn('organization_id', $organizationIds);
                    
                    if ($request->query('organization_id')) {
                        $query->where('organization_id', $request->query('organization_id'));
                    }
                    
                    if ($request->query('level')) {
                        $query->whereHas('organization.level', function ($q) use ($request) {
                            $q->where('slug', $request->query('level'));
                        });
                    }
                    
                    $members = $query->orderBy('nama')->paginate($request->query('per_page', 20));
                }
            }

            return response()->json([
                'success' => true,
                'data' => $members,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get work programs detail
     */
    public function getWorkProgramsDetail(Request $request)
    {
        try {
            $authUser = Auth::user();
            
            if ($authUser && $this->isSuperAdmin($authUser)) {
                $query = WorkProgram::with(['organization', 'organization.level', 'theme', 'activities']);
                
                if ($request->query('theme_id')) {
                    $query->where('theme_id', $request->query('theme_id'));
                }
                
                if ($request->query('mwc_id')) {
                    $query->where('organization_id', $request->query('mwc_id'));
                }
                
                $programs = $query->orderBy('nama_program')->paginate($request->query('per_page', 20));
            } else {
                $pcId = $authUser?->organization?->getPcId();
                if (!$pcId) {
                    $programs = collect([]);
                } else {
                    $mwcIds = Organization::where('parent_id', $pcId)
                        ->whereHas('level', function ($q) {
                            $q->where('slug', 'mwc');
                        })
                        ->pluck('id')
                        ->toArray();
                    
                    $query = WorkProgram::with(['organization', 'organization.level', 'theme', 'activities'])
                        ->whereIn('organization_id', $mwcIds);
                    
                    if ($request->query('theme_id')) {
                        $query->where('theme_id', $request->query('theme_id'));
                    }
                    
                    if ($request->query('mwc_id')) {
                        $query->where('organization_id', $request->query('mwc_id'));
                    }
                    
                    $programs = $query->orderBy('nama_program')->paginate($request->query('per_page', 20));
                }
            }

            return response()->json([
                'success' => true,
                'data' => $programs,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get theme detail
     */
    public function getThemeDetail(int $themeId)
    {
        try {
            $theme = ProgramTheme::with(['organization'])->findOrFail($themeId);
            $data = $this->service->getThemeStatistics($theme);
            
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get chart data for a specific theme
     * Endpoint: GET /api/dashboard/themes/{themeId}/chart
     * 
     * @param int $themeId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getThemeChartData(int $themeId)
    {
        try {
            $data = $this->service->getThemeChartData($themeId);
            
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}