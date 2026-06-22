<?php

namespace App\Services;

use App\Models\User;
use App\Models\Anggota;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Auth\Access\AuthorizationException;

class AnggotaService
{
    /*
    |--------------------------------------------------------------------------
    | AUTH USER
    |--------------------------------------------------------------------------
    */

    protected function authUser(): ?User
    {
        /** @var User|null */
        return Auth::user();
    }

    /*
    |--------------------------------------------------------------------------
    | GET ACCESSIBLE ORGANIZATION IDS
    |--------------------------------------------------------------------------
    */

    protected function getAccessibleOrganizationIds(): array
    {
        $authUser = $this->authUser();

        if (!$authUser) {
            return [];
        }

        // Super Admin dapat mengakses semua organisasi
        if ($authUser->isSuperAdmin()) {
            return Organization::pluck('id')->toArray();
        }

        // User tanpa organisasi
        if (!$authUser->organization_id) {
            return [];
        }

        $organizationIds = [];

        // Tambahkan organisasi user sendiri
        $organizationIds[] = $authUser->organization_id;

        // Jika user adalah PC, dapat mengakses semua descendant (MWC, Ranting, Anak Ranting, Lembaga, Banom)
        if ($authUser->isPC()) {
            $userOrg = Organization::find($authUser->organization_id);
            if ($userOrg) {
                $descendants = $userOrg->descendants();
                $organizationIds = array_merge($organizationIds, $descendants);
            }
        }

        // Jika user adalah MWC, dapat mengakses child organisations (Ranting, dll)
        if ($authUser->isMWC()) {
            $children = Organization::where('parent_id', $authUser->organization_id)->pluck('id')->toArray();
            $organizationIds = array_merge($organizationIds, $children);
        }

        // Jika user adalah Ranting, hanya dapat mengakses organisasinya sendiri (sudah ditambahkan di awal)
        // Jika user adalah Lembaga atau Banom, hanya dapat mengakses organisasinya sendiri

        return array_unique($organizationIds);
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE ORGANIZATION ACCESS
    |--------------------------------------------------------------------------
    */

    protected function validateOrganizationAccess(int $organizationId): void
    {
        $authUser = $this->authUser();

        if (!$authUser) {
            throw new AuthorizationException('Unauthorized');
        }

        // Super Admin bisa akses semua
        if ($authUser->isSuperAdmin()) {
            return;
        }

        $accessibleIds = $this->getAccessibleOrganizationIds();

        if (!in_array($organizationId, $accessibleIds)) {
            throw new AuthorizationException('Anda tidak memiliki akses ke organisasi tersebut');
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL
    |--------------------------------------------------------------------------
    */

    public function getAll(Request $request)
    {
        $search = $request->query('search');
        $organizationId = $request->query('organization_id');
        $jabatanId = $request->query('jabatan_id');
        $isActive = $request->query('is_active');

        $authUser = $this->authUser();
        $accessibleIds = $this->getAccessibleOrganizationIds();

        return Anggota::query()

            ->with([
                'organization.level',
                'jabatan',
            ])

            /*
            |--------------------------------------------------------------------------
            | ORGANIZATION ACCESS
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($accessibleIds) && !$authUser->isSuperAdmin(),
                function ($query) use ($accessibleIds) {
                    $query->whereIn('organization_id', $accessibleIds);
                }
            )

            /*
            |--------------------------------------------------------------------------
            | SEARCH
            |--------------------------------------------------------------------------
            */

            ->when(
                $search,
                function ($query) use ($search) {
                    $query->where(function ($q) use ($search) {
                        $q->whereRaw(
                            'LOWER(nama) LIKE ?',
                            ['%' . strtolower($search) . '%']
                        )

                            ->orWhereRaw(
                                'LOWER(no_anggota) LIKE ?',
                                ['%' . strtolower($search) . '%']
                            )

                            ->orWhereRaw(
                                'LOWER(no_hp) LIKE ?',
                                ['%' . strtolower($search) . '%']
                            )

                            ->orWhereRaw(
                                'LOWER(alamat) LIKE ?',
                                ['%' . strtolower($search) . '%']
                            );
                    });
                }
            )

            /*
            |--------------------------------------------------------------------------
            | FILTER ORGANIZATION
            |--------------------------------------------------------------------------
            */

            ->when(
                $organizationId,
                function ($query) use ($organizationId) {
                    $query->where('organization_id', $organizationId);
                }
            )

            /*
            |--------------------------------------------------------------------------
            | FILTER JABATAN
            |--------------------------------------------------------------------------
            */

            ->when(
                $jabatanId,
                function ($query) use ($jabatanId) {
                    $query->where('jabatan_id', $jabatanId);
                }
            )

            /*
            |--------------------------------------------------------------------------
            | FILTER ACTIVE
            |--------------------------------------------------------------------------
            */

            ->when(
                $isActive !== null,
                function ($query) use ($isActive) {
                    $query->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
                }
            )

            ->orderBy('nama')

            ->paginate($request->query('per_page', 10));
    }

    /*
    |--------------------------------------------------------------------------
    | FIND BY ID
    |--------------------------------------------------------------------------
    */

    public function findById(int $id): Anggota
    {
        $anggota = Anggota::with([
            'organization.level',
            'organization.type',
            'jabatan',
        ])->findOrFail($id);

        // Validasi akses
        $this->validateOrganizationAccess($anggota->organization_id);

        return $anggota;
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(array $data, Request $request): Anggota
    {
        DB::beginTransaction();

        try {
            // Validasi akses
            $this->validateOrganizationAccess($data['organization_id']);

            // Validasi nomor anggota jika diisi
            if (!empty($data['no_anggota'])) {
                // Cek apakah nomor anggota sudah digunakan
                $existingAnggota = Anggota::where('no_anggota', $data['no_anggota'])->first();
                if ($existingAnggota) {
                    throw new \Exception('Nomor anggota sudah terdaftar. Silakan gunakan nomor yang berbeda.');
                }
                $noAnggota = $data['no_anggota'];
            } else {
                // Generate nomor anggota otomatis jika tidak diisi
                $noAnggota = $this->generateNoAnggota();
            }

            $anggota = Anggota::create([

                'organization_id' =>
                $data['organization_id'],

                'jabatan_id' =>
                $data['jabatan_id'],

                'no_anggota' =>
                $noAnggota,

                'nama' =>
                $data['nama'],

                'no_hp' =>
                $data['no_hp'] ?? null,

                'alamat' =>
                $data['alamat'] ?? null,

                'is_active' =>
                $data['is_active'] ?? true,
            ]);

            ActivityLogService::log(
                module: 'Anggota',
                action: 'CREATE',
                model: $anggota,
                newValues: $anggota->toArray(),
                description: 'Menambahkan anggota',
                request: $request
            );

            DB::commit();

            return $anggota->load([
                'organization.level',
                'jabatan',
            ]);
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

    public function update(int $id, array $data, Request $request): Anggota
    {
        DB::beginTransaction();

        try {
            $anggota = Anggota::findOrFail($id);

            // Validasi akses
            $this->validateOrganizationAccess($data['organization_id']);

            // Validasi nomor anggota jika diubah
            if (!empty($data['no_anggota']) && $data['no_anggota'] !== $anggota->no_anggota) {
                // Cek apakah nomor anggota sudah digunakan oleh anggota lain
                $existingAnggota = Anggota::where('no_anggota', $data['no_anggota'])
                    ->where('id', '!=', $id)
                    ->first();
                    
                if ($existingAnggota) {
                    throw new \Exception('Nomor anggota sudah terdaftar. Silakan gunakan nomor yang berbeda.');
                }
                $noAnggota = $data['no_anggota'];
            } else {
                // Jika tidak ada perubahan, gunakan nomor yang sudah ada
                $noAnggota = $anggota->no_anggota;
            }

            $changes = ActivityLogService::detectChanges($anggota, [
                'organization_id' => $data['organization_id'],
                'jabatan_id' => $data['jabatan_id'],
                'no_anggota' => $noAnggota,
                'nama' => $data['nama'],
                'no_hp' => $data['no_hp'] ?? null,
                'alamat' => $data['alamat'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            $anggota->update([
                'organization_id' => $data['organization_id'],
                'jabatan_id' => $data['jabatan_id'],
                'no_anggota' => $noAnggota,
                'nama' => $data['nama'],
                'no_hp' => $data['no_hp'] ?? null,
                'alamat' => $data['alamat'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            if (!empty($changes['old_values']) || !empty($changes['new_values'])) {
                ActivityLogService::log(
                    module: 'Anggota',
                    action: 'UPDATE',
                    model: $anggota,
                    oldValues: $changes['old_values'],
                    newValues: $changes['new_values'],
                    description: 'Mengubah anggota',
                    request: $request
                );
            }

            DB::commit();

            return $anggota->load([
                'organization.level',
                'jabatan',
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DESTROY
    |--------------------------------------------------------------------------
    */

    public function destroy(int $id, Request $request): bool
    {
        DB::beginTransaction();

        try {
            $anggota = Anggota::findOrFail($id);

            // Validasi akses
            $this->validateOrganizationAccess($anggota->organization_id);

            $oldValues = $anggota->toArray();
            $anggota->delete();

            ActivityLogService::log(
                module: 'Anggota',
                action: 'DELETE',
                oldValues: $oldValues,
                description: 'Menghapus anggota',
                request: $request
            );

            DB::commit();
            return true;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GENERATE NO ANGGOTA (DEFAULT)
    |--------------------------------------------------------------------------
    */

    protected function generateNoAnggota(): string
    {
        $year = date('Y');

        $last = Anggota::where(
            'no_anggota',
            'like',
            "NU-{$year}-%"
        )
            ->orderByDesc('id')
            ->first();

        $nextNumber = 1;

        if ($last) {
            $parts = explode('-', $last->no_anggota);
            $lastNumber = (int) end($parts);
            $nextNumber = $lastNumber + 1;
        }

        return sprintf(
            'NU-%s-%06d',
            $year,
            $nextNumber
        );
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE NO ANGGOTA (Optional helper)
    |--------------------------------------------------------------------------
    */

    public function validateNoAnggota(string $noAnggota, ?int $excludeId = null): bool
    {
        $query = Anggota::where('no_anggota', $noAnggota);
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        return !$query->exists();
    }
}