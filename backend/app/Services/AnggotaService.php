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

        // Jika user adalah PC, dapat mengakses semua descendant
        if ($authUser->isPC()) {
            $userOrg = Organization::find($authUser->organization_id);
            if ($userOrg) {
                $descendants = $userOrg->descendants();
                $organizationIds = array_merge($organizationIds, $descendants);
            }
        }

        // Jika user adalah MWC, dapat mengakses semua descendant
        if ($authUser->isMWC()) {
            $userOrg = Organization::find($authUser->organization_id);
            if ($userOrg) {
                $descendants = $userOrg->descendants();
                $organizationIds = array_merge($organizationIds, $descendants);
            }
        }

        // Jika user adalah Ranting, dapat mengakses Anak Ranting di bawahnya
        if ($authUser->isRanting()) {
            $children = Organization::where('parent_id', $authUser->organization_id)
                ->whereHas('level', function ($q) {
                    $q->where('slug', 'anak-ranting');
                })
                ->pluck('id')
                ->toArray();
            $organizationIds = array_merge($organizationIds, $children);
        }

        // Lembaga/Banom/Anak Ranting hanya dapat mengakses organisasinya sendiri

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
        $levelSlug = $request->query('level_slug');
        $organizationTypeId = $request->query('organization_type_id');

        $authUser = $this->authUser();
        $accessibleIds = $this->getAccessibleOrganizationIds();

        $query = Anggota::query()
            ->with([
                'organization.level',
                'organization.type',
                'jabatan',
            ]);

        // Filter berdasarkan akses organisasi
        if (!empty($accessibleIds) && !$authUser->isSuperAdmin()) {
            $query->whereIn('organization_id', $accessibleIds);
        }

        // Filter berdasarkan level organisasi
        if ($levelSlug) {
            $query->whereHas('organization.level', function ($q) use ($levelSlug) {
                $q->where('slug', $levelSlug);
            });
        }

        // Filter berdasarkan tipe organisasi (untuk Lembaga/Banom)
        if ($organizationTypeId) {
            $query->whereHas('organization', function ($q) use ($organizationTypeId) {
                $q->where('organization_type_id', $organizationTypeId);
            });
        }

        // Filter pencarian
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(nama) LIKE ?', ['%' . strtolower($search) . '%'])
                    ->orWhereRaw('LOWER(no_anggota) LIKE ?', ['%' . strtolower($search) . '%'])
                    ->orWhereRaw('LOWER(no_hp) LIKE ?', ['%' . strtolower($search) . '%'])
                    ->orWhereRaw('LOWER(alamat) LIKE ?', ['%' . strtolower($search) . '%']);
            });
        }

        // Filter organisasi
        if ($organizationId) {
            $query->where('organization_id', $organizationId);
        }

        // Filter jabatan
        if ($jabatanId) {
            $query->where('jabatan_id', $jabatanId);
        }

        // Filter status aktif
        if ($isActive !== null) {
            $query->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
        }

        return $query
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
            $this->validateOrganizationAccess($data['organization_id']);

            if (!empty($data['no_anggota'])) {
                $existingAnggota = Anggota::where('no_anggota', $data['no_anggota'])->first();
                if ($existingAnggota) {
                    throw new \Exception('Nomor anggota sudah terdaftar. Silakan gunakan nomor yang berbeda.');
                }
                $noAnggota = $data['no_anggota'];
            } else {
                $noAnggota = $this->generateNoAnggota();
            }

            $anggota = Anggota::create([
                'organization_id' => $data['organization_id'],
                'jabatan_id'      => $data['jabatan_id'] ?? null,
                'no_anggota'      => $noAnggota,
                'nama'            => $data['nama'],
                'no_hp'           => $data['no_hp'] ?? null,
                'alamat'          => $data['alamat'] ?? null,
                'is_active'       => $data['is_active'] ?? true,
            ]);

            if (class_exists(ActivityLogService::class)) {
                ActivityLogService::log(
                    module: 'Anggota',
                    action: 'CREATE',
                    model: $anggota,
                    newValues: $anggota->toArray(),
                    description: 'Menambahkan anggota',
                    request: $request
                );
            }

            DB::commit();

            return $anggota->load([
                'organization.level',
                'organization.type',
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

            $this->validateOrganizationAccess($data['organization_id']);

            if (!empty($data['no_anggota']) && $data['no_anggota'] !== $anggota->no_anggota) {
                $existingAnggota = Anggota::where('no_anggota', $data['no_anggota'])
                    ->where('id', '!=', $id)
                    ->first();

                if ($existingAnggota) {
                    throw new \Exception('Nomor anggota sudah terdaftar. Silakan gunakan nomor yang berbeda.');
                }
                $noAnggota = $data['no_anggota'];
            } else {
                $noAnggota = $anggota->no_anggota;
            }

            $oldValues = $anggota->toArray();

            $anggota->update([
                'organization_id' => $data['organization_id'],
                'jabatan_id'      => $data['jabatan_id'] ?? null,
                'no_anggota'      => $noAnggota,
                'nama'            => $data['nama'],
                'no_hp'           => $data['no_hp'] ?? null,
                'alamat'          => $data['alamat'] ?? null,
                'is_active'       => $data['is_active'] ?? true,
            ]);

            $newValues = $anggota->toArray();

            if (class_exists(ActivityLogService::class)) {
                ActivityLogService::log(
                    module: 'Anggota',
                    action: 'UPDATE',
                    model: $anggota,
                    oldValues: $oldValues,
                    newValues: $newValues,
                    description: 'Mengubah anggota',
                    request: $request
                );
            }

            DB::commit();

            return $anggota->load([
                'organization.level',
                'organization.type',
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

            $this->validateOrganizationAccess($anggota->organization_id);

            $oldValues = $anggota->toArray();
            $anggota->delete();

            if (class_exists(ActivityLogService::class)) {
                ActivityLogService::log(
                    module: 'Anggota',
                    action: 'DELETE',
                    oldValues: $oldValues,
                    description: 'Menghapus anggota',
                    request: $request
                );
            }

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

        $last = Anggota::where('no_anggota', 'like', "NU-{$year}-%")
            ->orderByDesc('id')
            ->first();

        $nextNumber = 1;

        if ($last) {
            $parts = explode('-', $last->no_anggota);
            $lastNumber = (int) end($parts);
            $nextNumber = $lastNumber + 1;
        }

        return sprintf('NU-%s-%06d', $year, $nextNumber);
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