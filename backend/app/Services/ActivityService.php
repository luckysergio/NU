<?php

namespace App\Services;

use App\Models\User;
use App\Models\Anggota;
use App\Models\Activity;
use App\Models\Organization;
use App\Models\WorkProgram;
use Illuminate\Http\Request;
use App\Models\ActivityPhoto;
use App\Events\ActivityCreated;
use App\Events\ActivityUpdated;
use App\Events\ActivityDeleted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use App\Models\ActivityExpensePhoto;
use App\Models\ActivityAttendance;
use App\Models\ActivityParticipant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ActivityService
{
    protected const CACHE_DURATION = 600;
    protected const CACHE_PREFIX = 'activities:';
    protected const CACHE_TRACKER_KEY = 'activities:active_keys';

    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function getAll(Request $request, User $user): LengthAwarePaginator
    {
        try {
            $filters = $this->extractFilters($request);
            $bypassCache = $request->query('bypass_cache', false);

            if ($bypassCache || $request->query('_t')) {
                return $this->buildActivityQuery($user, $filters)->paginate($filters['per_page']);
            }

            $cacheKey = $this->getCacheKey('list', $filters);

            return $this->rememberCache($cacheKey, function () use ($user, $filters) {
                return $this->buildActivityQuery($user, $filters)->paginate($filters['per_page']);
            });
        } catch (\Throwable $e) {
            Log::error('ActivityService::getAll error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'user_id' => $user?->id,
            ]);
            throw $e;
        }
    }

    private function buildActivityQuery(User $user, array $filters)
    {
        $query = Activity::query()
            ->with([
                'organization',
                'organization.level',
                'workProgram',
                'workProgram.organization',
                'workProgram.theme',
                'penanggungJawab',
                'penanggungJawab.jabatan',
                'creator',
                'photos',
                'expensePhotos',
                'attendances',
                'attendances.anggota',
                'attendances.anggota.jabatan',
                'participantOrganizations',
                'participantOrganizations.level',
                'participantOrganizations.anggotas',
                'participantOrganizations.anggotas.jabatan',
                'documents',
            ]);

        if (!empty($filters['search'])) {
            $search = strtolower($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(nama_kegiatan) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(catatan) LIKE ?', ["%{$search}%"]);
            });
        }

        if (!empty($filters['organization_id'])) {
            $query->where('organization_id', $filters['organization_id']);
        }

        if (!empty($filters['work_program_id'])) {
            $query->where('work_program_id', $filters['work_program_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['theme_id'])) {
            $query->whereHas('workProgram', function ($q) use ($filters) {
                $q->where('theme_id', $filters['theme_id']);
            });
        }

        if ($user && $user->organization && $user->organization->level && $user->organization->level->slug === 'ranting') {
            $query->where('organization_id', $user->organization->id);
        } else {
            $accessibleIds = $this->getAccessibleOrganizationIds($user);
            if (!empty($accessibleIds)) {
                $query->whereIn('organization_id', $accessibleIds);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        $sortOrder = $filters['sort_order'] === 'asc' ? 'asc' : 'desc';
        return $query->orderBy('tanggal_pelaksanaan', $sortOrder);
    }

    public function findById(int $id, User $user): Activity
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);

        return $this->rememberCache($cacheKey, function () use ($id, $user) {
            return $this->activityQuery($user)
                ->with([
                    'participantOrganizations',
                    'participantOrganizations.level',
                    'participantOrganizations.anggotas',
                    'participantOrganizations.anggotas.jabatan',
                    'attendances.anggota',
                    'attendances.anggota.jabatan',
                    'documents',
                ])
                ->findOrFail($id);
        });
    }

    public function store(array $data, Request $request, User $user): Activity
    {
        return DB::transaction(function () use ($data, $request, $user) {
            $this->validateRelations($data, $user);

            $activity = Activity::create([
                'work_program_id' => $data['work_program_id'],
                'organization_id' => $data['organization_id'],
                'penanggung_jawab_id' => $data['penanggung_jawab_id'],
                'nama_kegiatan' => $data['nama_kegiatan'],
                'tanggal_pelaksanaan' => $data['tanggal_pelaksanaan'],
                'status' => $data['status'] ?? 'draft',
                'total_pengeluaran' => $data['total_pengeluaran'] ?? 0,
                'catatan' => $data['catatan'] ?? null,
                'created_by' => $user->id,
            ]);

            $this->handleParticipantOrganizations($activity, $data);
            $this->handleAttendance($activity, $data);
            $this->handleAbsentAnggota($activity, $data);

            if ($request->hasFile('photos')) {
                $this->uploadActivityPhotos($activity, $request->file('photos'));
            }

            if ($request->hasFile('expense_photos')) {
                $this->uploadExpensePhotos($activity, $request->file('expense_photos'));
            }

            if ($request->hasFile('attendance_files')) {
                $this->uploadAttendanceFiles($activity, $request->file('attendance_files'), $user);
            }

            ActivityLogService::log(
                'ACTIVITY',
                'CREATE',
                $activity,
                null,
                $activity->toArray(),
                'Menambahkan kegiatan',
                $request
            );

            $activity->load([
                'workProgram.theme',
                'organization',
                'penanggungJawab',
                'creator',
                'photos',
                'expensePhotos',
                'attendances.anggota',
                'attendances.anggota.jabatan',
                'participantOrganizations',
                'participantOrganizations.anggotas',
                'participantOrganizations.anggotas.jabatan',
                'documents',
            ]);

            $this->clearCache();

            if ($activity->workProgram && $activity->workProgram->theme_id) {
                $this->clearThemeChartCache($activity->workProgram->theme_id);
            }

            $this->dashboardService->clearAllCache();

            broadcast(new ActivityCreated($activity))->toOthers();

            return $activity;
        });
    }

    public function update(int $id, array $data, Request $request, User $user): Activity
    {
        return DB::transaction(function () use ($id, $data, $request, $user) {
            $activity = $this->findByIdWithoutCache($id, $user);

            $this->validateRelations($data, $user);

            $oldThemeId = $activity->workProgram?->theme_id;

            $payload = [
                'work_program_id' => $data['work_program_id'],
                'organization_id' => $data['organization_id'],
                'penanggung_jawab_id' => $data['penanggung_jawab_id'],
                'nama_kegiatan' => $data['nama_kegiatan'],
                'tanggal_pelaksanaan' => $data['tanggal_pelaksanaan'],
                'status' => $data['status'] ?? $activity->status,
                'total_pengeluaran' => $data['total_pengeluaran'] ?? 0,
                'catatan' => $data['catatan'] ?? null,
            ];

            $changes = ActivityLogService::detectChanges($activity, $payload);

            $activity->update($payload);

            $this->handleParticipantOrganizations($activity, $data, true);
            $this->handleDeletedAttendance($activity, $data);
            $this->handleAttendance($activity, $data);
            $this->handleAbsentAnggota($activity, $data);
            $this->handleDeletedPhotos($activity, $data);
            $this->handleDeletedExpensePhotos($activity, $data);
            $this->handleDeletedAttendanceFiles($activity, $data);

            if ($request->hasFile('photos')) {
                $this->uploadActivityPhotos($activity, $request->file('photos'));
            }

            if ($request->hasFile('expense_photos')) {
                $this->uploadExpensePhotos($activity, $request->file('expense_photos'));
            }

            if ($request->hasFile('attendance_files')) {
                $this->uploadAttendanceFiles($activity, $request->file('attendance_files'), $user);
            }

            ActivityLogService::log(
                'ACTIVITY',
                'UPDATE',
                $activity,
                $changes['old_values'],
                $changes['new_values'],
                'Mengubah kegiatan',
                $request
            );

            $activity->load([
                'workProgram.theme',
                'organization',
                'penanggungJawab',
                'creator',
                'photos',
                'expensePhotos',
                'attendances.anggota',
                'attendances.anggota.jabatan',
                'participantOrganizations',
                'participantOrganizations.anggotas',
                'participantOrganizations.anggotas.jabatan',
                'documents',
            ]);

            $this->clearCache();

            $newThemeId = $activity->workProgram?->theme_id;
            if ($oldThemeId) {
                $this->clearThemeChartCache($oldThemeId);
            }
            if ($newThemeId && $newThemeId !== $oldThemeId) {
                $this->clearThemeChartCache($newThemeId);
            }

            $this->dashboardService->clearAllCache();

            // broadcast(new ActivityUpdated($activity))->toOthers();

            return $activity;
        });
    }

    public function destroy(int $id, Request $request, User $user): bool
    {
        return DB::transaction(function () use ($id, $request, $user) {
            $activity = $this->findByIdWithoutCache($id, $user);

            $themeId = $activity->workProgram?->theme_id;
            $workProgramId = $activity->work_program_id;
            $organizationId = $activity->organization_id;

            ActivityLogService::log(
                'ACTIVITY',
                'DELETE',
                $activity,
                $activity->toArray(),
                null,
                'Menghapus kegiatan',
                $request
            );

            $this->deleteFiles($activity);

            ActivityParticipant::where('activity_id', $activity->id)->delete();
            ActivityAttendance::where('activity_id', $activity->id)->delete();

            $activity->delete();

            $this->clearCache();

            if ($themeId) {
                $this->clearThemeChartCache($themeId);
            }

            $this->dashboardService->clearAllCache();

            broadcast(new ActivityDeleted($id, $workProgramId, $themeId, $organizationId))->toOthers();

            return true;
        });
    }

    public function updateStatus(int $id, string $status, User $user): Activity
    {
        $validStatuses = ['draft', 'completed', 'cancelled'];
        if (!in_array($status, $validStatuses)) {
            throw new \Exception('Status tidak valid');
        }

        $activity = $this->findByIdWithoutCache($id, $user);
        $activity->update(['status' => $status]);

        $this->clearCache();

        // ✅ BARU: Clear dashboard cache
        $this->dashboardService->clearAllCache();

        broadcast(new ActivityUpdated($activity))->toOthers();

        return $activity;
    }

    private function findByIdWithoutCache(int $id, User $user): Activity
    {
        return $this->activityQuery($user)
            ->with([
                'participantOrganizations',
                'participantOrganizations.level',
                'participantOrganizations.anggotas',
                'participantOrganizations.anggotas.jabatan',
                'attendances.anggota',
                'attendances.anggota.jabatan',
                'workProgram.theme',
                'photos',
                'expensePhotos',
                'documents',
            ])
            ->findOrFail($id);
    }

    private function activityQuery(User $user, ?Request $request = null)
    {
        $query = Activity::query()
            ->with([
                'organization',
                'organization.level',
                'workProgram',
                'workProgram.organization',
                'workProgram.theme',
                'penanggungJawab',
                'penanggungJawab.jabatan',
                'creator',
                'photos',
                'expensePhotos',
                'attendances',
                'attendances.anggota',
                'attendances.anggota.jabatan',
                'participantOrganizations',
                'participantOrganizations.level',
                'participantOrganizations.anggotas',
                'participantOrganizations.anggotas.jabatan',
                'documents',
            ]);

        if ($user && $user->organization && $user->organization->level && $user->organization->level->slug === 'ranting') {
            $query->where('organization_id', $user->organization->id);
        } else {
            $query->whereIn('organization_id', $this->getAccessibleOrganizationIds($user));
        }

        return $query;
    }

    private function getAccessibleOrganizationIds(User $user): array
    {
        if (!$user) {
            return [];
        }

        if ($user->isSuperAdmin()) {
            return Organization::pluck('id')->toArray();
        }

        if (!$user->organization) {
            return [];
        }

        $ids = [$user->organization->id];

        $descendants = $user->organization->descendants();
        if (is_array($descendants)) {
            $ids = array_merge($ids, $descendants);
        }

        if ($user->organization->level && $user->organization->level->slug === 'ranting') {
            $parentId = $user->organization->parent_id;
            if ($parentId && !in_array($parentId, $ids)) {
                $ids[] = $parentId;
            }
        }

        return array_unique($ids);
    }

    private function validateRelations(array $data, User $user): void
    {
        $allowed = $this->getAccessibleOrganizationIds($user);

        if (!in_array($data['organization_id'], $allowed)) {
            throw new \Exception('Organisasi tidak dapat diakses.');
        }

        $program = WorkProgram::findOrFail($data['work_program_id']);
        $isProgramValid = in_array($program->organization_id, $allowed);

        if (!$isProgramValid && $user->organization && $user->organization->level && $user->organization->level->slug === 'ranting') {
            $isProgramValid = ($program->organization_id === $user->organization->parent_id);
        }

        if (!$isProgramValid) {
            throw new \Exception('Program kerja tidak valid.');
        }

        $anggota = Anggota::findOrFail($data['penanggung_jawab_id']);

        if (!in_array($anggota->organization_id, $allowed)) {
            throw new \Exception('Penanggung jawab tidak valid.');
        }
    }

    private function handleParticipantOrganizations(Activity $activity, array $data, bool $isUpdate = false): void
    {
        if (!isset($data['participant_organization_ids'])) return;

        $orgIds = is_string($data['participant_organization_ids'])
            ? json_decode($data['participant_organization_ids'], true)
            : $data['participant_organization_ids'];

        if (!is_array($orgIds)) return;

        if ($isUpdate) {
            ActivityParticipant::where('activity_id', $activity->id)->delete();
        }

        foreach ($orgIds as $orgId) {
            ActivityParticipant::create([
                'activity_id' => $activity->id,
                'organization_id' => $orgId,
            ]);
        }
    }

    private function handleAttendance(Activity $activity, array $data): void
    {
        if (!isset($data['attendance_anggota_ids'])) return;

        $anggotaIds = is_string($data['attendance_anggota_ids'])
            ? json_decode($data['attendance_anggota_ids'], true)
            : $data['attendance_anggota_ids'];

        if (!is_array($anggotaIds)) return;

        foreach ($anggotaIds as $anggotaId) {
            ActivityAttendance::updateOrCreate(
                [
                    'activity_id' => $activity->id,
                    'anggota_id' => $anggotaId,
                ],
                [
                    'recorded_by' => auth('api')->id(),
                    'catatan' => json_encode([
                        'status' => 'hadir',
                        'checked_in_at' => now()->toIso8601String(),
                    ]),
                ]
            );
        }
    }

    private function handleAbsentAnggota(Activity $activity, array $data): void
    {
        if (!isset($data['absent_anggota_data'])) return;

        $absentData = is_string($data['absent_anggota_data'])
            ? json_decode($data['absent_anggota_data'], true)
            : $data['absent_anggota_data'];

        if (!is_array($absentData)) return;

        foreach ($absentData as $absentItem) {
            ActivityAttendance::updateOrCreate(
                [
                    'activity_id' => $activity->id,
                    'anggota_id' => $absentItem['anggota_id'],
                ],
                [
                    'recorded_by' => auth('api')->id(),
                    'catatan' => json_encode([
                        'status' => 'tidak_hadir',
                        'kritik' => $absentItem['kritik'] ?? null,
                        'saran' => $absentItem['saran'] ?? null,
                    ]),
                ]
            );
        }
    }

    private function handleDeletedAttendance(Activity $activity, array $data): void
    {
        if (!isset($data['deleted_attendance_anggota_ids'])) return;

        $deletedAnggotaIds = is_string($data['deleted_attendance_anggota_ids'])
            ? json_decode($data['deleted_attendance_anggota_ids'], true)
            : $data['deleted_attendance_anggota_ids'];

        if (!is_array($deletedAnggotaIds) || empty($deletedAnggotaIds)) return;

        ActivityAttendance::where('activity_id', $activity->id)
            ->whereIn('anggota_id', $deletedAnggotaIds)
            ->delete();
    }

    private function handleDeletedPhotos(Activity $activity, array $data): void
    {
        if (!isset($data['deleted_photo_ids'])) return;

        $deletedPhotoIds = is_string($data['deleted_photo_ids'])
            ? json_decode($data['deleted_photo_ids'], true)
            : $data['deleted_photo_ids'];

        if (!is_array($deletedPhotoIds) || empty($deletedPhotoIds)) return;

        foreach ($activity->photos as $photo) {
            if (in_array($photo->id, $deletedPhotoIds)) {
                Storage::disk('public')->delete($photo->file_path);
                $photo->delete();
            }
        }
    }

    private function handleDeletedExpensePhotos(Activity $activity, array $data): void
    {
        if (!isset($data['deleted_expense_photo_ids'])) return;

        $deletedExpensePhotoIds = is_string($data['deleted_expense_photo_ids'])
            ? json_decode($data['deleted_expense_photo_ids'], true)
            : $data['deleted_expense_photo_ids'];

        if (!is_array($deletedExpensePhotoIds) || empty($deletedExpensePhotoIds)) return;

        foreach ($activity->expensePhotos as $photo) {
            if (in_array($photo->id, $deletedExpensePhotoIds)) {
                Storage::disk('public')->delete($photo->file_path);
                $photo->delete();
            }
        }
    }

    private function handleDeletedAttendanceFiles(Activity $activity, array $data): void
    {
        if (!isset($data['deleted_attendance_ids'])) return;

        $deletedAttendanceIds = is_string($data['deleted_attendance_ids'])
            ? json_decode($data['deleted_attendance_ids'], true)
            : $data['deleted_attendance_ids'];

        if (!is_array($deletedAttendanceIds) || empty($deletedAttendanceIds)) return;

        foreach ($activity->attendances as $attendance) {
            if (in_array($attendance->id, $deletedAttendanceIds)) {
                $catatan = json_decode($attendance->catatan, true);

                if ($catatan && isset($catatan['type']) && $catatan['type'] === 'attendance_file') {
                    if (isset($catatan['file_path'])) {
                        Storage::disk('public')->delete($catatan['file_path']);
                    }
                    $attendance->delete();
                }
            }
        }
    }

    private function uploadActivityPhotos(Activity $activity, array $files): void
    {
        foreach ($files as $file) {
            $path = $file->store('activities/photos', 'public');
            ActivityPhoto::create([
                'activity_id' => $activity->id,
                'file_path' => $path,
            ]);
        }
    }

    private function uploadExpensePhotos(Activity $activity, array $files): void
    {
        foreach ($files as $file) {
            $path = $file->store('activities/expenses', 'public');
            ActivityExpensePhoto::create([
                'activity_id' => $activity->id,
                'file_path' => $path,
            ]);
        }
    }

    private function uploadAttendanceFiles(Activity $activity, array $files, User $user): void
    {
        foreach ($files as $file) {
            $path = $file->store('activities/attendances', 'public');

            ActivityAttendance::create([
                'activity_id' => $activity->id,
                'anggota_id' => null,
                'recorded_by' => $user->id,
                'catatan' => json_encode([
                    'type' => 'attendance_file',
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $file->extension(),
                ]),
            ]);
        }
    }

    private function deleteFiles(Activity $activity): void
    {
        $this->deletePhotoOnly($activity);
        $this->deleteExpenseOnly($activity);
        $this->deleteAttendanceOnly($activity);
    }

    private function deletePhotoOnly(Activity $activity): void
    {
        foreach ($activity->photos as $photo) {
            Storage::disk('public')->delete($photo->file_path);
            $photo->delete();
        }
    }

    private function deleteExpenseOnly(Activity $activity): void
    {
        foreach ($activity->expensePhotos as $photo) {
            Storage::disk('public')->delete($photo->file_path);
            $photo->delete();
        }
    }

    private function deleteAttendanceOnly(Activity $activity): void
    {
        foreach ($activity->attendances as $attendance) {
            $catatan = json_decode($attendance->catatan, true);

            if ($catatan && isset($catatan['type']) && $catatan['type'] === 'attendance_file') {
                if (isset($catatan['file_path'])) {
                    Storage::disk('public')->delete($catatan['file_path']);
                }
            }
            $attendance->delete();
        }
    }

    private function clearThemeChartCache(?int $themeId = null): void
    {
        if (!$themeId) return;

        $users = User::all();

        foreach ($users as $user) {
            $suffix = $this->getUserCacheSuffix($user);
            $cacheKey = 'dashboard_theme_chart_' . $themeId . '_' . $suffix;
            Cache::forget($cacheKey);
        }

        Cache::forget('dashboard_theme_chart_' . $themeId . '_guest');

        Log::info("Theme chart cache cleared for theme_id: {$themeId}");
    }

    private function getUserCacheSuffix(User $user): string
    {
        if ($user->isSuperAdmin()) {
            return 'superadmin';
        } elseif ($user->role?->slug === 'admin' && $user->organization?->level?->slug === 'mwc') {
            return 'admin_mwc_' . $user->organization_id;
        } elseif ($user->role?->slug === 'admin' && $user->organization?->level?->slug === 'pc') {
            return 'admin_pc_' . $user->organization_id;
        } elseif ($user->role?->slug === 'admin' && $user->organization?->level?->slug === 'ranting') {
            return 'admin_ranting_' . $user->organization_id;
        }
        return 'user_' . $user->id;
    }

    private function extractFilters(Request $request): array
    {
        return [
            'search' => trim((string) $request->query('search', '')),
            'organization_id' => $request->query('organization_id'),
            'work_program_id' => $request->query('work_program_id'),
            'status' => $request->query('status'),
            'theme_id' => $request->query('theme_id'),
            'sort_order' => $request->query('sort_order', 'desc'),
            'per_page' => min((int) $request->input('per_page', 10), 100),
            'page' => (int) $request->query('page', 1),
        ];
    }

    private function getCacheKey(string $key, array $params = []): string
    {
        $userId = auth('api')->id() ?? 'guest';
        $paramString = !empty($params) ? '_' . md5(json_encode($params)) : '';
        return self::CACHE_PREFIX . $userId . ':' . $key . $paramString;
    }

    private function rememberCache(string $key, \Closure $callback)
    {
        $activeKeys = Cache::get(self::CACHE_TRACKER_KEY, []);
        if (!in_array($key, $activeKeys)) {
            $activeKeys[] = $key;
            Cache::put(self::CACHE_TRACKER_KEY, $activeKeys, now()->addDays(7));
        }

        return Cache::remember($key, self::CACHE_DURATION, $callback);
    }

    public function clearCache(): void
    {
        $activeKeys = Cache::get(self::CACHE_TRACKER_KEY, []);

        foreach ($activeKeys as $key) {
            Cache::forget($key);
        }

        Cache::forget(self::CACHE_TRACKER_KEY);

        Log::info('Targeted activity cache cleared successfully.');
    }
}
