<?php

namespace App\Services;

use App\Models\User;
use App\Models\Anggota;
use App\Models\Activity;
use App\Models\Organization;
use App\Models\WorkProgram;
use Illuminate\Http\Request;
use App\Models\ActivityPhoto;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\ActivityAttendance;
use App\Models\ActivityExpensePhoto;
use App\Models\ActivityParticipant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ActivityService
{
    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */

    public function getAll(
        Request $request,
        User $user
    ): LengthAwarePaginator {

        $search = trim(
            strtolower(
                $request->search ?? ''
            )
        );

        $perPage = (int) (
            $request->per_page ?? 10
        );

        $sortOrder = $request->sort_order ?? 'asc';
        
        return $this->activityQuery($user, $request)

            ->when(
                $search,
                function ($query) use ($search) {
                    $query->whereRaw(
                        'LOWER(nama_kegiatan) LIKE ?',
                        ["%{$search}%"]
                    );
                }
            )

            ->when(
                $request->organization_id,
                function ($query) use ($request) {
                    $query->where(
                        'organization_id',
                        $request->organization_id
                    );
                }
            )

            ->when(
                $request->work_program_id,
                function ($query) use ($request) {
                    $query->where(
                        'work_program_id',
                        $request->work_program_id
                    );
                }
            )

            ->when(
                $request->status,
                function ($query) use ($request) {
                    $query->where('status', $request->status);
                }
            )

            ->orderBy(
                'tanggal_pelaksanaan',
                $sortOrder === 'asc' ? 'asc' : 'desc'
            )

            ->paginate($perPage);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    public function findById(
        int $id,
        User $user
    ): Activity {

        $activity = $this->activityQuery($user)
            ->with([
                'participantOrganizations',
                'participantOrganizations.level',
                'attendances.anggota',
                'attendances.anggota.jabatan',
            ])
            ->findOrFail($id);

        return $activity;
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(
        array $data,
        Request $request,
        User $user
    ): Activity {

        DB::beginTransaction();

        try {

            $this->validateRelations(
                $data,
                $user
            );

            $activity = Activity::create([

                'work_program_id' =>
                    $data['work_program_id'],

                'organization_id' =>
                    $data['organization_id'],

                'penanggung_jawab_id' =>
                    $data['penanggung_jawab_id'],

                'nama_kegiatan' =>
                    $data['nama_kegiatan'],

                'tanggal_pelaksanaan' =>
                    $data['tanggal_pelaksanaan'],

                'status' =>
                    $data['status'] ?? 'draft',

                'total_pengeluaran' =>
                    $data['total_pengeluaran'] ?? 0,

                'catatan' =>
                    $data['catatan'] ?? null,

                'created_by' =>
                    $user->id,
            ]);

            // Handle participant organizations (untuk absensi)
            if (isset($data['participant_organization_ids']) && is_array($data['participant_organization_ids'])) {
                foreach ($data['participant_organization_ids'] as $orgId) {
                    ActivityParticipant::create([
                        'activity_id' => $activity->id,
                        'organization_id' => $orgId,
                    ]);
                }
            }

            // Handle attendance (anggota yang hadir)
            if (isset($data['attendance_anggota_ids']) && is_array($data['attendance_anggota_ids'])) {
                foreach ($data['attendance_anggota_ids'] as $anggotaId) {
                    ActivityAttendance::create([
                        'activity_id' => $activity->id,
                        'anggota_id' => $anggotaId,
                        'is_present' => true,
                        'checked_in_at' => now(),
                    ]);
                }
            }

            // Handle attendance with kritik & saran (anggota tidak hadir)
            if (isset($data['absent_anggota_data']) && is_array($data['absent_anggota_data'])) {
                foreach ($data['absent_anggota_data'] as $absentData) {
                    ActivityAttendance::create([
                        'activity_id' => $activity->id,
                        'anggota_id' => $absentData['anggota_id'],
                        'is_present' => false,
                        'kritik' => $absentData['kritik'] ?? null,
                        'saran' => $absentData['saran'] ?? null,
                    ]);
                }
            }

            if ($request->hasFile('photos')) {
                $this->uploadActivityPhotos(
                    $activity,
                    $request->file('photos')
                );
            }

            if ($request->hasFile('expense_photos')) {
                $this->uploadExpensePhotos(
                    $activity,
                    $request->file('expense_photos')
                );
            }

            if ($request->hasFile('attendance_files')) {
                $this->uploadAttendanceFiles(
                    $activity,
                    $request->file('attendance_files')
                );
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

            DB::commit();

            return $this->findById(
                $activity->id,
                $user
            );

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(
        int $id,
        array $data,
        Request $request,
        User $user
    ): Activity {

        DB::beginTransaction();

        try {

            $activity = $this->findById(
                $id,
                $user
            );

            $this->validateRelations(
                $data,
                $user
            );

            $payload = [

                'work_program_id' =>
                    $data['work_program_id'],

                'organization_id' =>
                    $data['organization_id'],

                'penanggung_jawab_id' =>
                    $data['penanggung_jawab_id'],

                'nama_kegiatan' =>
                    $data['nama_kegiatan'],

                'tanggal_pelaksanaan' =>
                    $data['tanggal_pelaksanaan'],

                'status' =>
                    $data['status'] ?? $activity->status,

                'total_pengeluaran' =>
                    $data['total_pengeluaran'] ?? 0,

                'catatan' =>
                    $data['catatan'] ?? null,
            ];

            $changes =
                ActivityLogService::detectChanges(
                    $activity,
                    $payload
                );

            $activity->update(
                $payload
            );

            // Handle participant organizations
            if (isset($data['participant_organization_ids'])) {
                $newOrgIds = is_array($data['participant_organization_ids']) 
                    ? $data['participant_organization_ids'] 
                    : json_decode($data['participant_organization_ids'], true);
                
                if (is_array($newOrgIds)) {
                    // Delete old participants
                    ActivityParticipant::where('activity_id', $activity->id)->delete();
                    
                    // Add new participants
                    foreach ($newOrgIds as $orgId) {
                        ActivityParticipant::create([
                            'activity_id' => $activity->id,
                            'organization_id' => $orgId,
                        ]);
                    }
                }
            }

            // Handle deleted attendance anggota
            if (isset($data['deleted_attendance_anggota_ids'])) {
                $deletedAnggotaIds = is_string($data['deleted_attendance_anggota_ids']) 
                    ? json_decode($data['deleted_attendance_anggota_ids'], true) 
                    : $data['deleted_attendance_anggota_ids'];
                
                if (is_array($deletedAnggotaIds) && !empty($deletedAnggotaIds)) {
                    ActivityAttendance::where('activity_id', $activity->id)
                        ->whereIn('anggota_id', $deletedAnggotaIds)
                        ->delete();
                }
            }

            // Handle attendance (anggota yang hadir)
            if (isset($data['attendance_anggota_ids'])) {
                $presentAnggotaIds = is_array($data['attendance_anggota_ids']) 
                    ? $data['attendance_anggota_ids'] 
                    : json_decode($data['attendance_anggota_ids'], true);
                
                if (is_array($presentAnggotaIds)) {
                    foreach ($presentAnggotaIds as $anggotaId) {
                        ActivityAttendance::updateOrCreate(
                            [
                                'activity_id' => $activity->id,
                                'anggota_id' => $anggotaId,
                            ],
                            [
                                'is_present' => true,
                                'checked_in_at' => now(),
                                'kritik' => null,
                                'saran' => null,
                            ]
                        );
                    }
                }
            }

            // Handle absent anggota with kritik & saran
            if (isset($data['absent_anggota_data'])) {
                $absentData = is_string($data['absent_anggota_data']) 
                    ? json_decode($data['absent_anggota_data'], true) 
                    : $data['absent_anggota_data'];
                
                if (is_array($absentData)) {
                    foreach ($absentData as $absentItem) {
                        ActivityAttendance::updateOrCreate(
                            [
                                'activity_id' => $activity->id,
                                'anggota_id' => $absentItem['anggota_id'],
                            ],
                            [
                                'is_present' => false,
                                'checked_in_at' => null,
                                'kritik' => $absentItem['kritik'] ?? null,
                                'saran' => $absentItem['saran'] ?? null,
                            ]
                        );
                    }
                }
            }

            // Handle deleted photos
            if (isset($data['deleted_photo_ids'])) {
                $deletedPhotoIds = is_string($data['deleted_photo_ids']) 
                    ? json_decode($data['deleted_photo_ids'], true) 
                    : $data['deleted_photo_ids'];
                
                if (is_array($deletedPhotoIds) && !empty($deletedPhotoIds)) {
                    foreach ($activity->photos as $photo) {
                        if (in_array($photo->id, $deletedPhotoIds)) {
                            Storage::disk('public')->delete($photo->file_path);
                            $photo->delete();
                        }
                    }
                }
            }

            // Handle deleted expense photos
            if (isset($data['deleted_expense_photo_ids'])) {
                $deletedExpensePhotoIds = is_string($data['deleted_expense_photo_ids']) 
                    ? json_decode($data['deleted_expense_photo_ids'], true) 
                    : $data['deleted_expense_photo_ids'];
                
                if (is_array($deletedExpensePhotoIds) && !empty($deletedExpensePhotoIds)) {
                    foreach ($activity->expensePhotos as $photo) {
                        if (in_array($photo->id, $deletedExpensePhotoIds)) {
                            Storage::disk('public')->delete($photo->file_path);
                            $photo->delete();
                        }
                    }
                }
            }

            // Handle deleted attendance files
            if (isset($data['deleted_attendance_ids'])) {
                $deletedAttendanceIds = is_string($data['deleted_attendance_ids']) 
                    ? json_decode($data['deleted_attendance_ids'], true) 
                    : $data['deleted_attendance_ids'];
                
                if (is_array($deletedAttendanceIds) && !empty($deletedAttendanceIds)) {
                    foreach ($activity->attendances as $attendance) {
                        if (in_array($attendance->id, $deletedAttendanceIds)) {
                            Storage::disk('public')->delete($attendance->file_path);
                            $attendance->delete();
                        }
                    }
                }
            }

            if ($request->hasFile('photos')) {
                $this->uploadActivityPhotos(
                    $activity,
                    $request->file('photos')
                );
            }

            if ($request->hasFile('expense_photos')) {
                $this->uploadExpensePhotos(
                    $activity,
                    $request->file('expense_photos')
                );
            }

            if ($request->hasFile('attendance_files')) {
                $this->uploadAttendanceFiles(
                    $activity,
                    $request->file('attendance_files')
                );
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

            DB::commit();

            return $this->findById(
                $activity->id,
                $user
            );

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function destroy(
        int $id,
        Request $request,
        User $user
    ): bool {

        DB::beginTransaction();

        try {

            $activity = $this->findById(
                $id,
                $user
            );

            ActivityLogService::log(
                'ACTIVITY',
                'DELETE',
                $activity,
                $activity->toArray(),
                null,
                'Menghapus kegiatan',
                $request
            );

            $this->deleteFiles(
                $activity
            );

            // Delete participants
            ActivityParticipant::where('activity_id', $activity->id)->delete();
            
            // Delete attendance records
            ActivityAttendance::where('activity_id', $activity->id)->delete();

            $activity->delete();

            DB::commit();

            return true;

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    /**
     * Update activity status
     */
    public function updateStatus(
        int $id,
        string $status,
        User $user
    ): Activity {

        $activity = $this->findById($id, $user);
        
        $validStatuses = ['draft', 'completed', 'cancelled'];
        if (!in_array($status, $validStatuses)) {
            throw new \Exception('Status tidak valid');
        }

        $activity->update(['status' => $status]);

        return $activity;
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY
    |--------------------------------------------------------------------------
    */

    private function activityQuery(
        User $user,
        ?Request $request = null
    ) {

        $query = Activity::query()

            ->with([
                'organization',
                'organization.level',
                'workProgram',
                'workProgram.organization',
                'penanggungJawab',
                'penanggungJawab.jabatan',
                'creator',
                'photos',
                'expensePhotos',
                'attendances',
                'attendances.anggota',
                'participantOrganizations',
                'participantOrganizations.level',
            ]);

        if ($user->organization && $user->organization->level && $user->organization->level->slug === 'ranting') {
            $query->where('organization_id', $user->organization->id);
        } else {
            $query->whereIn(
                'organization_id',
                $this->getAccessibleOrganizationIds($user)
            );
        }

        return $query;
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESS ORGANIZATION
    |--------------------------------------------------------------------------
    */

    private function getAccessibleOrganizationIds(
        User $user
    ): array {

        if ($user->isSuperAdmin()) {
            return Organization::pluck('id')->toArray();
        }

        if (!$user->organization) {
            return [];
        }

        $ids = [$user->organization->id];
        $ids = array_merge($ids, $user->organization->descendants());
        
        if ($user->organization->level && $user->organization->level->slug === 'ranting') {
            $parentId = $user->organization->parent_id;
            if ($parentId && !in_array($parentId, $ids)) {
                $ids[] = $parentId;
            }
        }
        
        return $ids;
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE
    |--------------------------------------------------------------------------
    */

    private function validateRelations(
        array $data,
        User $user
    ): void {

        $allowed =
            $this->getAccessibleOrganizationIds(
                $user
            );

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

    /*
    |--------------------------------------------------------------------------
    | UPLOADS
    |--------------------------------------------------------------------------
    */

    private function uploadActivityPhotos(
        Activity $activity,
        array $files
    ): void {

        foreach ($files as $file) {
            $path = $file->store('activities/photos', 'public');
            ActivityPhoto::create([
                'activity_id' => $activity->id,
                'file_path' => $path,
            ]);
        }
    }

    private function uploadExpensePhotos(
        Activity $activity,
        array $files
    ): void {

        foreach ($files as $file) {
            $path = $file->store('activities/expenses', 'public');
            ActivityExpensePhoto::create([
                'activity_id' => $activity->id,
                'file_path' => $path,
            ]);
        }
    }

    private function uploadAttendanceFiles(
        Activity $activity,
        array $files
    ): void {

        foreach ($files as $file) {
            $path = $file->store('activities/attendances', 'public');
            ActivityAttendance::create([
                'activity_id' => $activity->id,
                'file_path' => $path,
                'file_type' => $file->extension(),
                'file_name' => $file->getClientOriginalName(),
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE FILES
    |--------------------------------------------------------------------------
    */

    private function deleteFiles(
        Activity $activity
    ): void {
        $this->deletePhotoOnly($activity);
        $this->deleteExpenseOnly($activity);
        $this->deleteAttendanceOnly($activity);
    }

    private function deletePhotoOnly(
        Activity $activity
    ): void {
        foreach ($activity->photos as $photo) {
            Storage::disk('public')->delete($photo->file_path);
            $photo->delete();
        }
    }

    private function deleteExpenseOnly(
        Activity $activity
    ): void {
        foreach ($activity->expensePhotos as $photo) {
            Storage::disk('public')->delete($photo->file_path);
            $photo->delete();
        }
    }

    private function deleteAttendanceOnly(
        Activity $activity
    ): void {
        foreach ($activity->attendances as $attendance) {
            Storage::disk('public')->delete($attendance->file_path);
            $attendance->delete();
        }
    }
}