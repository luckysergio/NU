<?php

namespace App\Services;

use App\Models\User;
use App\Models\Anggota;
use App\Models\Activity;
use App\Models\Organization;
use App\Models\ActivityAttendance;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class ActivityAttendanceService
{
    /**
     * Validasi hak akses
     */
    protected function authorizeActivity(Activity $activity): void
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Unauthorized');
        }

        if ($user->isSuperAdmin()) {
            return;
        }

        if ($user->isAdmin()) {
            return;
        }

        if ($user->isOperator() && $user->canAccessOrganization($activity->organization)) {
            return;
        }

        abort(403, 'Anda tidak memiliki akses ke kegiatan ini.');
    }

    /**
     * Get accessible organization IDs for user
     */
    protected function getAccessibleOrganizationIds(User $user): array
    {
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
            $children = Organization::where('parent_id', $user->organization_id)
                ->whereHas('level', function ($q) {
                    $q->where('slug', 'anak-ranting');
                })
                ->pluck('id')
                ->toArray();
            $organizationIds = array_merge($organizationIds, $children);
        }

        return array_unique($organizationIds);
    }

    /**
     * Get all activities with attendance status
     */
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
                ->withCount('anggotas')
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

    /**
     * Detail absensi kegiatan
     */
    public function getAttendance(Activity $activity): array
    {
        $this->authorizeActivity($activity);

        // Ambil organisasi peserta
        $organizationIds = $activity
            ->participantOrganizations()
            ->pluck('organizations.id');

        // Ambil organisasi dengan anggota aktif
        $organizations = Organization::query()
            ->whereIn('id', $organizationIds)
            ->with([
                'level',
                'type',
                'anggotas' => function ($query) {
                    $query->where('is_active', true)->orderBy('nama');
                }
            ])
            ->orderBy('nama')
            ->get();

        // Ambil ID anggota yang sudah hadir
        $attendanceIds = ActivityAttendance::query()
            ->where('activity_id', $activity->id)
            ->pluck('anggota_id')
            ->toArray();

        // Hitung total peserta
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
    }

    /**
     * Simpan absensi
     */
    public function saveAttendance(Activity $activity, array $anggotaIds, int $userId): void
    {
        $this->authorizeActivity($activity);

        // Validasi: ambil organisasi peserta kegiatan
        $organizationIds = $activity
            ->participantOrganizations()
            ->pluck('organizations.id')
            ->toArray();

        if (empty($organizationIds)) {
            throw new \Exception('Kegiatan belum memiliki organisasi peserta.');
        }

        // Ambil semua anggota yang boleh diabsen (dari organisasi peserta)
        $allowedAnggotaIds = Anggota::query()
            ->whereIn('organization_id', $organizationIds)
            ->where('is_active', true)
            ->pluck('id')
            ->toArray();

        // Validasi setiap anggota yang diinput ada di daftar yang diizinkan
        foreach ($anggotaIds as $anggotaId) {
            if (!in_array($anggotaId, $allowedAnggotaIds)) {
                throw new \Exception('Terdapat anggota yang tidak termasuk organisasi peserta kegiatan.');
            }
        }

        DB::transaction(function () use ($activity, $anggotaIds, $userId) {
            // Hapus absensi lama
            ActivityAttendance::query()
                ->where('activity_id', $activity->id)
                ->delete();

            // Simpan absensi baru
            foreach ($anggotaIds as $anggotaId) {
                ActivityAttendance::create([
                    'activity_id' => $activity->id,
                    'anggota_id' => $anggotaId,
                    'recorded_by' => $userId,
                ]);
            }

            // Update status kegiatan jika semua sudah hadir
            $organizationIds = $activity
                ->participantOrganizations()
                ->pluck('organizations.id')
                ->toArray();

            $totalParticipants = Anggota::whereIn('organization_id', $organizationIds)
                ->where('is_active', true)
                ->count();

            if ($totalParticipants > 0 && count($anggotaIds) >= $totalParticipants) {
                $activity->update(['status' => 'completed']);
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | FITUR MANAJEMEN ORGANISASI PESERTA
    |--------------------------------------------------------------------------
    */

    /**
     * Get available organizations for adding to activity
     */
    public function getAvailableOrganizations(Activity $activity): array
    {
        $this->authorizeActivity($activity);

        /** @var User|null $user */
        $user = Auth::user();

        // Get accessible organizations for user
        $accessibleOrgIds = $this->getAccessibleOrganizationIds($user);

        // Get already selected organizations
        $selectedOrgIds = $activity->participantOrganizations()->pluck('organizations.id')->toArray();

        // Get available organizations (not yet selected)
        $availableOrganizations = Organization::query()
            ->whereIn('id', $accessibleOrgIds)
            ->whereNotIn('id', $selectedOrgIds)
            ->with(['level', 'type'])
            ->orderBy('nama')
            ->get();

        // Get selected organizations with details
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
    }

    /**
     * Add participants (organizations) to activity
     */
    public function addParticipants(Activity $activity, array $organizationIds): void
    {
        $this->authorizeActivity($activity);

        /** @var User|null $user */
        $user = Auth::user();

        $accessibleOrgIds = $this->getAccessibleOrganizationIds($user);

        // Validasi setiap organisasi yang ditambahkan
        foreach ($organizationIds as $orgId) {
            if (!in_array($orgId, $accessibleOrgIds)) {
                throw new \Exception('Anda tidak memiliki akses ke organisasi tersebut.');
            }
        }

        DB::transaction(function () use ($activity, $organizationIds) {
            // Sync without detaching (add new, keep existing)
            $activity->participantOrganizations()->syncWithoutDetaching($organizationIds);
        });
    }

    /**
     * Remove participants (organizations) from activity
     */
    public function removeParticipants(Activity $activity, array $organizationIds): void
    {
        $this->authorizeActivity($activity);

        DB::transaction(function () use ($activity, $organizationIds) {
            // Remove organizations
            $activity->participantOrganizations()->detach($organizationIds);

            // Also remove attendance for removed organizations
            $anggotaIds = Anggota::whereIn('organization_id', $organizationIds)
                ->pluck('id')
                ->toArray();

            if (!empty($anggotaIds)) {
                ActivityAttendance::where('activity_id', $activity->id)
                    ->whereIn('anggota_id', $anggotaIds)
                    ->delete();
            }
        });
    }

    /**
     * Get anggota from selected participant organizations
     */
    public function getParticipantAnggota(Activity $activity): array
    {
        $this->authorizeActivity($activity);

        // Get participant organization IDs
        $organizationIds = $activity
            ->participantOrganizations()
            ->pluck('organizations.id')
            ->toArray();

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

        // Get all anggota from participant organizations
        $organizations = Organization::query()
            ->whereIn('id', $organizationIds)
            ->with([
                'level',
                'type',
                'anggotas' => function ($query) {
                    $query->where('is_active', true)->orderBy('nama');
                }
            ])
            ->orderBy('nama')
            ->get();

        // Get all anggota with organization info
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

        // Get attendance IDs for this activity
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
    }
}