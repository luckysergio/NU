<?php

namespace App\Services;

use App\Models\User;
use App\Models\Anggota;
use App\Models\Activity;
use App\Models\Organization;
use App\Models\ActivityAttendance;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class ActivityAttendanceService
{
    protected const CACHE_DURATION = 3600;
    protected const CACHE_PREFIX = 'activity_attendance:';
    protected const CACHE_TRACKER_KEY = 'activity_attendance:active_keys';

    protected function rememberCache(string $key, \Closure $callback, int $duration = 300)
    {
        $activeKeys = Cache::get(self::CACHE_TRACKER_KEY, []);
        if (!in_array($key, $activeKeys)) {
            $activeKeys[] = $key;
            Cache::put(self::CACHE_TRACKER_KEY, $activeKeys, now()->addDays(7));
        }

        return Cache::remember($key, $duration, $callback);
    }

    protected function authorizeActivity(Activity $activity): void
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Unauthorized');
        }

        if ($user->isSuperAdmin() || $user->isAdmin()) {
            return;
        }

        if ($user->isOperator() && $user->canAccessOrganization($activity->organization)) {
            return;
        }

        abort(403, 'Anda tidak memiliki akses ke kegiatan ini.');
    }

    protected function canAccessAllOrganizationsForAttendance(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin();
    }

    protected function getAccessibleOrganizationIds(User $user): array
    {
        $cacheKey = 'accessible_orgs_u' . $user->id;

        return Cache::remember($cacheKey, 3600, function () use ($user) {
            if ($user->isSuperAdmin()) {
                return Organization::pluck('id')->toArray();
            }

            if (!$user->organization_id) {
                return [];
            }

            $organizationIds = [$user->organization_id];

            if ($user->isPC() || $user->isMWC()) {
                $userOrg = Organization::find($user->organization_id);
                if ($userOrg) {
                    $descendants = $userOrg->descendants();
                    $organizationIds = array_merge($organizationIds, $descendants);
                }
            }

            if ($user->isRanting()) {
                $userOrg = Organization::find($user->organization_id);
                if ($userOrg) {
                    $children = Organization::where('parent_id', $user->organization_id)
                        ->whereHas('level', function ($q) {
                            $q->where('slug', 'anak-ranting');
                        })
                        ->pluck('id')
                        ->toArray();
                    $organizationIds = array_merge($organizationIds, $children);
                }
            }

            return array_unique($organizationIds);
        });
    }

    public function getAllOrganizations(User $user): array
    {
        if (!$this->canAccessAllOrganizationsForAttendance($user)) {
            throw new \Exception('Akses ditolak. Hanya admin yang dapat mengakses.');
        }

        $cacheKey = self::CACHE_PREFIX . 'all_organizations_admin_' . $user->id;

        return Cache::remember($cacheKey, 3600, function () {
            $organizations = Organization::query()
                ->with(['level', 'type'])
                ->orderBy('nama')
                ->get();

            $grouped = [
                'pc' => [], 'mwc' => [], 'ranting' => [],
                'anak_ranting' => [], 'lembaga' => [], 'banom' => [],
            ];

            foreach ($organizations as $org) {
                $levelSlug = $org->level?->slug ?? 'unknown';
                if (isset($grouped[$levelSlug])) {
                    $grouped[$levelSlug][] = $org;
                }
            }

            return [
                'all_organizations' => $organizations,
                'grouped_by_level' => $grouped,
                'total' => $organizations->count(),
            ];
        });
    }

    public function getAllActivities(Request $request): array
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Unauthorized');
        }

        $accessibleOrgIds = $this->getAccessibleOrganizationIds($user);

        $query = Activity::query()
            ->with([
                'organization.level',
                'organization.type',
                'participantOrganizations.level',
                'participantOrganizations.type'
            ]);

        if (!$user->isSuperAdmin()) {
            $query->whereIn('organization_id', $accessibleOrgIds);
        }

        if ($request->has('search') && $request->search) {
            $search = strtolower($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(nama_kegiatan) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(catatan) LIKE ?', ["%{$search}%"]);
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $query->orderBy('tanggal_pelaksanaan', 'desc');

        $activities = $query->paginate($request->per_page ?? 10);

        foreach ($activities as $activity) {
            $totalParticipants = $activity->participantOrganizations()
                ->withCount(['anggotas' => fn($q) => $q->active()])
                ->get()
                ->sum('anggotas_count');

            $attendanceCount = ActivityAttendance::where('activity_id', $activity->id)->count();

            $activity->total_participants = $totalParticipants;
            $activity->attendance_count = $attendanceCount;
            $activity->attendance_percentage = $totalParticipants > 0 
                ? round(($attendanceCount / $totalParticipants) * 100, 2) 
                : 0;
            $activity->is_fully_attended = $attendanceCount >= $totalParticipants && $totalParticipants > 0;
        }

        return [
            'activities' => $activities,
            'accessible_organization_ids' => $accessibleOrgIds,
        ];
    }

    public function getAttendance(Activity $activity): array
    {
        $this->authorizeActivity($activity);
        $cacheKey = self::CACHE_PREFIX . 'attendance_' . $activity->id;

        return $this->rememberCache($cacheKey, function () use ($activity) {
            $organizationIds = $activity->participantOrganizations()->pluck('organizations.id');

            $organizations = Organization::query()
                ->whereIn('id', $organizationIds)
                ->with([
                    'level',
                    'type',
                    'anggotas' => function ($query) {
                        $query->active()
                              ->with(['biodata:id,nama,no_anggota,no_hp', 'jabatan:id,nama']);
                    }
                ])
                ->orderBy('nama')
                ->get();

            foreach ($organizations as $org) {
                $org->anggotas = $org->anggotas->sortBy('nama')->values();
            }

            $attendanceIds = ActivityAttendance::query()
                ->where('activity_id', $activity->id)
                ->pluck('anggota_id')
                ->toArray();

            $totalParticipants = 0;
            foreach ($organizations as $org) {
                $totalParticipants += $org->anggotas->count();
            }

            return [
                'activity' => [
                    'id' => $activity->id,
                    'nama_kegiatan' => $activity->nama_kegiatan,
                    'tanggal_pelaksanaan' => $activity->tanggal_pelaksanaan,
                    'status' => $activity->status,
                    'catatan' => $activity->catatan,
                ],
                'organizations' => $organizations,
                'attendance_ids' => $attendanceIds,
                'total_participants' => $totalParticipants,
                'attended_count' => count($attendanceIds),
                'attendance_percentage' => $totalParticipants > 0 
                    ? round((count($attendanceIds) / $totalParticipants) * 100, 2) 
                    : 0,
            ];
        }, 300);
    }

    public function saveAttendance(Activity $activity, array $anggotaIds, int $userId): void
    {
        $this->authorizeActivity($activity);

        $organizationIds = $activity->participantOrganizations()->pluck('organizations.id')->toArray();

        if (empty($organizationIds)) {
            throw new \Exception('Kegiatan belum memiliki organisasi peserta.');
        }

        $allowedAnggotaIds = Anggota::query()
            ->whereIn('organization_id', $organizationIds)
            ->active()
            ->pluck('id')
            ->toArray();

        foreach ($anggotaIds as $anggotaId) {
            if (!in_array($anggotaId, $allowedAnggotaIds)) {
                throw new \Exception('Terdapat anggota yang tidak termasuk organisasi peserta kegiatan atau tidak aktif.');
            }
        }

        DB::transaction(function () use ($activity, $anggotaIds, $userId) {
            ActivityAttendance::query()->where('activity_id', $activity->id)->delete();

            foreach ($anggotaIds as $anggotaId) {
                ActivityAttendance::create([
                    'activity_id' => $activity->id,
                    'anggota_id' => $anggotaId,
                    'recorded_by' => $userId,
                ]);
            }

            $orgIds = $activity->participantOrganizations()->pluck('organizations.id')->toArray();
            $totalParticipants = Anggota::whereIn('organization_id', $orgIds)->active()->count();

            if ($totalParticipants > 0 && count($anggotaIds) >= $totalParticipants) {
                $activity->update(['status' => 'completed']);
            }
        });

        $this->clearCache($activity->id);
    }

    public function getAllOrganizationsUnderPC(User $user): array
    {
        if (!$user->isSuperAdmin() && !$user->isPC()) {
            throw new \Exception('Akses ditolak. Hanya Super Admin dan PC yang dapat mengakses.');
        }

        $cacheKey = self::CACHE_PREFIX . 'all_orgs_under_pc_' . $user->organization_id;

        return Cache::remember($cacheKey, 86400, function () use ($user) {
            $pcId = $user->organization_id;
            $pcOrg = Organization::find($pcId);
            
            if (!$pcOrg) {
                return [];
            }

            $descendantIds = $pcOrg->descendants();
            $allOrgIds = array_merge([$pcId], $descendantIds);

            $organizations = Organization::query()
                ->whereIn('id', $allOrgIds)
                ->with(['level', 'type'])
                ->orderBy('nama')
                ->get();

            $grouped = [
                'pc' => [], 'mwc' => [], 'ranting' => [],
                'anak_ranting' => [], 'lembaga' => [], 'banom' => [],
            ];

            foreach ($organizations as $org) {
                $levelSlug = $org->level?->slug ?? 'unknown';
                if (isset($grouped[$levelSlug])) {
                    $grouped[$levelSlug][] = $org;
                }
            }

            return [
                'all_organizations' => $organizations,
                'grouped_by_level' => $grouped,
                'total' => $organizations->count(),
            ];
        });
    }

    public function getAvailableOrganizations(Activity $activity): array
    {
        $this->authorizeActivity($activity);
        $user = Auth::user();
        $cacheKey = self::CACHE_PREFIX . 'available_orgs_' . $activity->id;

        return $this->rememberCache($cacheKey, function () use ($activity, $user) {
            $selectedOrgIds = $activity->participantOrganizations()->pluck('organizations.id')->toArray();

            if ($this->canAccessAllOrganizationsForAttendance($user)) {
                $availableOrganizations = Organization::query()
                    ->whereNotIn('id', $selectedOrgIds)
                    ->with(['level', 'type'])
                    ->orderBy('nama')
                    ->get();
            } else {
                $accessibleOrgIds = $this->getAccessibleOrganizationIds($user);
                $availableOrganizations = Organization::query()
                    ->whereIn('id', $accessibleOrgIds)
                    ->whereNotIn('id', $selectedOrgIds)
                    ->with(['level', 'type'])
                    ->orderBy('nama')
                    ->get();
            }

            $selectedOrganizations = Organization::query()
                ->whereIn('id', $selectedOrgIds)
                ->with(['level', 'type'])
                ->orderBy('nama')
                ->get();

            return [
                'activity_id' => $activity->id,
                'activity_name' => $activity->nama_kegiatan,
                'selected_organization_ids' => $selectedOrgIds,
                'selected_organizations' => $selectedOrganizations,
                'available_organizations' => $availableOrganizations,
                'total_selected' => count($selectedOrgIds),
                'total_available' => $availableOrganizations->count(),
            ];
        }, 3600);
    }

    public function addParticipants(Activity $activity, array $organizationIds): void
    {
        $this->authorizeActivity($activity);
        $user = Auth::user();

        if (!$this->canAccessAllOrganizationsForAttendance($user)) {
            $accessibleOrgIds = $this->getAccessibleOrganizationIds($user);
            foreach ($organizationIds as $orgId) {
                if (!in_array($orgId, $accessibleOrgIds)) {
                    throw new \Exception('Anda tidak memiliki akses ke organisasi tersebut.');
                }
            }
        }

        DB::transaction(function () use ($activity, $organizationIds) {
            $activity->participantOrganizations()->syncWithoutDetaching($organizationIds);
        });

        $this->clearCache($activity->id);
    }

    public function removeParticipants(Activity $activity, array $organizationIds): void
    {
        $this->authorizeActivity($activity);

        DB::transaction(function () use ($activity, $organizationIds) {
            $activity->participantOrganizations()->detach($organizationIds);

            $anggotaIds = Anggota::whereIn('organization_id', $organizationIds)->pluck('id')->toArray();

            if (!empty($anggotaIds)) {
                ActivityAttendance::where('activity_id', $activity->id)
                    ->whereIn('anggota_id', $anggotaIds)
                    ->delete();
            }
        });

        $this->clearCache($activity->id);
    }

    public function getParticipantAnggota(Activity $activity): array
    {
        $this->authorizeActivity($activity);
        $cacheKey = self::CACHE_PREFIX . 'participant_anggotas_' . $activity->id;

        return $this->rememberCache($cacheKey, function () use ($activity) {
            $organizationIds = $activity->participantOrganizations()->pluck('organizations.id')->toArray();

            if (empty($organizationIds)) {
                return [
                    'activity_id' => $activity->id,
                    'activity_name' => $activity->nama_kegiatan,
                    'organizations' => [],
                    'total_anggota' => 0,
                    'anggotas' => [],
                    'attendance_ids' => [],
                    'attended_count' => 0,
                    'message' => 'Belum ada organisasi peserta',
                ];
            }

            $organizations = Organization::query()
                ->whereIn('id', $organizationIds)
                ->with([
                    'level',
                    'type',
                    'anggotas' => function ($query) {
                        $query->active()
                              ->with(['biodata:id,nama,no_anggota,no_hp', 'jabatan:id,nama']);
                    }
                ])
                ->orderBy('nama')
                ->get();

            foreach ($organizations as $org) {
                $org->anggotas = $org->anggotas->sortBy('nama')->values();
            }

            $allAnggota = [];
            $totalAnggota = 0;

            foreach ($organizations as $org) {
                foreach ($org->anggotas as $anggota) {
                    $allAnggota[] = [
                        'id' => $anggota->id,
                        'nama' => $anggota->nama,
                        'no_anggota' => $anggota->no_anggota,
                        'jabatan' => $anggota->jabatan?->nama,
                        'jabatan_id' => $anggota->jabatan_id,
                        'no_hp' => $anggota->no_hp,
                        'organization_id' => $org->id,
                        'organization_name' => $org->nama,
                        'is_active' => $anggota->is_active,
                    ];
                    $totalAnggota++;
                }
            }

            $attendanceIds = ActivityAttendance::query()
                ->where('activity_id', $activity->id)
                ->pluck('anggota_id')
                ->toArray();

            return [
                'activity_id' => $activity->id,
                'activity_name' => $activity->nama_kegiatan,
                'organizations' => $organizations,
                'anggotas' => $allAnggota,
                'total_anggota' => $totalAnggota,
                'attendance_ids' => $attendanceIds,
                'attended_count' => count($attendanceIds),
                'attendance_percentage' => $totalAnggota > 0 
                    ? round((count($attendanceIds) / $totalAnggota) * 100, 2) 
                    : 0,
            ];
        }, 1800);
    }

    public function clearCache(int $activityId): void
    {
        $keysToClear = [
            self::CACHE_PREFIX . 'attendance_' . $activityId,
            self::CACHE_PREFIX . 'available_orgs_' . $activityId,
            self::CACHE_PREFIX . 'participant_anggotas_' . $activityId,
        ];

        foreach ($keysToClear as $key) {
            Cache::forget($key);
        }

        Log::info('Activity attendance cache cleared for activity: ' . $activityId);
    }

    public function clearAllCache(): void
    {
        $activeKeys = Cache::get(self::CACHE_TRACKER_KEY, []);
        foreach ($activeKeys as $key) {
            Cache::forget($key);
        }
        Cache::forget(self::CACHE_TRACKER_KEY);
        Log::info('All activity attendance cache cleared');
    }
}