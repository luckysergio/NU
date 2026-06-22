<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\OrganizationLevel;
use App\Models\OrganizationType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrganizationService
{
    public function getAll(Request $request)
    {
        $search = trim((string) $request->query('search'));

        $levelId = $request->query('organization_level_id');
        $typeId = $request->query('organization_type_id');
        $parentId = $request->query('parent_id');

        $kotaId = $request->query('kota_id');
        $kecamatanId = $request->query('kecamatan_id');
        $kelurahanId = $request->query('kelurahan_id');
        $rwId = $request->query('rw_id');

        $perPage = $request->query('per_page', 10);

        if (!is_numeric($perPage) || (int) $perPage <= 0) {
            $perPage = 10;
        }

        $perPage = (int) $perPage;

        if ($perPage > 1000) {
            $perPage = 1000;
        }

        return Organization::query()

            ->with([
                'level',
                'type',
                'parent',
                'parent.level',
                'parent.type',
                'kota',
                'kecamatan',
                'kelurahan',
                'rw',
            ])

            ->leftJoin(
                'organization_levels',
                'organizations.organization_level_id',
                '=',
                'organization_levels.id'
            )

            ->select('organizations.*')

            ->when($search, function ($query) use ($search) {
                $search = strtolower($search);
                $query->where(function ($q) use ($search) {
                    $q->whereRaw('LOWER(organizations.nama) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('LOWER(organizations.slug) LIKE ?', ["%{$search}%"]);
                });
            })

            ->when($levelId, fn($q) => $q->where('organizations.organization_level_id', $levelId))
            ->when($typeId, fn($q) => $q->where('organizations.organization_type_id', $typeId))
            ->when($parentId, fn($q) => $q->where('organizations.parent_id', $parentId))
            ->when($kotaId, fn($q) => $q->where('organizations.kota_id', $kotaId))
            ->when($kecamatanId, fn($q) => $q->where('organizations.kecamatan_id', $kecamatanId))
            ->when($kelurahanId, fn($q) => $q->where('organizations.kelurahan_id', $kelurahanId))
            ->when($rwId, fn($q) => $q->where('organizations.rw_id', $rwId))

            ->orderByRaw("
                CASE organization_levels.slug
                    WHEN 'pc' THEN 1
                    WHEN 'mwc' THEN 2
                    WHEN 'ranting' THEN 3
                    WHEN 'anak-ranting' THEN 4
                    WHEN 'lembaga' THEN 5
                    WHEN 'banom' THEN 6
                    ELSE 99
                END ASC
            ")

            ->orderBy('organizations.nama', 'asc')

            ->paginate($perPage);
    }

    public function findById(int $id): Organization
    {
        return Organization::with([
            'level',
            'type',
            'parent',
            'parent.level',
            'parent.type',
            'children',
            'children.level',
            'children.type',
            'kota',
            'kecamatan',
            'kelurahan',
            'rw',
            'users',
        ])->findOrFail($id);
    }

    public function getLevelFilters(int $levelId): array
    {
        $level = OrganizationLevel::findOrFail($levelId);

        return [
            'level' => $level,
            'show_kota' => $level->slug === 'pc',
            'show_kecamatan' => $level->slug === 'mwc',
            'show_kelurahan' => $level->slug === 'ranting',
            'show_rw' => $level->slug === 'anak-ranting',
            'show_organization_type' => in_array($level->slug, ['lembaga', 'banom']),
            'organization_types' => in_array($level->slug, ['lembaga', 'banom'])
                ? OrganizationType::where('organization_level_id', $level->id)
                    ->where('is_active', true)
                    ->orderBy('nama')
                    ->get()
                : [],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | GET AVAILABLE PARENTS FOR LEMBAGA
    |--------------------------------------------------------------------------
    */

    /**
     * Get available parents for Lembaga
     * Parent bisa PC atau MWC
     * 
     * @param int $levelId
     * @param int|null $organizationTypeId
     * @param int|null $currentId
     * @return \Illuminate\Support\Collection
     */
    public function getAvailableParentsForLembaga(
        int $levelId,
        ?int $organizationTypeId = null,
        ?int $currentId = null
    ) {
        $level = OrganizationLevel::findOrFail($levelId);
        
        if ($level->slug !== 'lembaga') {
            throw new \Exception('Level harus Lembaga');
        }

        // Lembaga: parent = PC atau MWC
        $query = Organization::query()
            ->whereHas('level', function ($q) {
                $q->whereIn('slug', ['pc', 'mwc']);
            })
            ->where('is_active', true)
            ->with(['level', 'type']);

        // Filter: organisasi yang belum memiliki lembaga dengan type yang sama
        if ($organizationTypeId) {
            $usedParentIds = Organization::where('organization_type_id', $organizationTypeId)
                ->where('organization_level_id', $levelId)
                ->whereNotNull('parent_id')
                ->when($currentId, function ($q) use ($currentId) {
                    $q->where('id', '!=', $currentId);
                })
                ->pluck('parent_id')
                ->toArray();

            if (!empty($usedParentIds)) {
                $query->whereNotIn('id', $usedParentIds);
            }
        }

        $results = $query->orderBy('nama')->get();
        
        // Sort: PC first, then MWC
        return $this->sortLembagaParents($results);
    }

    /*
    |--------------------------------------------------------------------------
    | GET AVAILABLE PARENTS FOR BANOM
    |--------------------------------------------------------------------------
    */

    /**
     * Get available parents for Banom
     * - Banom tingkat PC: parent = PC (yang belum memiliki Banom PC)
     * - Banom tingkat MWC: parent = Banom tingkat PC (yang belum memiliki Banom MWC)
     * 
     * @param int $levelId
     * @param int|null $organizationTypeId
     * @param int|null $currentId
     * @return \Illuminate\Support\Collection
     */
    public function getAvailableParentsForBanom(
        int $levelId,
        ?int $organizationTypeId = null,
        ?int $currentId = null
    ) {
        $level = OrganizationLevel::findOrFail($levelId);
        
        if ($level->slug !== 'banom') {
            throw new \Exception('Level harus Banom');
        }

        $results = collect();

        // 1. Get PC (untuk Banom tingkat PC) - hanya PC yang belum memiliki Banom PC
        $pcParents = $this->getAvailablePcForBanom($organizationTypeId, $currentId, $levelId);
        
        foreach ($pcParents as $pc) {
            $pc->_parent_type = 'pcnu';
            $pc->_display_name = $pc->nama . ' (PCNU) - Untuk Banom Tingkat Kota';
            $results->push($pc);
        }

        // 2. Get Banom tingkat PC (untuk Banom tingkat MWC) - hanya Banom PC yang belum memiliki Banom MWC
        $banomPcParents = $this->getAvailableBanomPcForBanom($organizationTypeId, $currentId, $levelId);
        
        foreach ($banomPcParents as $banom) {
            $banom->_parent_type = 'banom_pc';
            $banom->_display_name = $banom->nama . ' (Banom ' . ($banom->type?->nama ?? '') . ' Tingkat Kota) - Untuk Banom Tingkat Kecamatan';
            $results->push($banom);
        }

        // Sort: PC first, then Banom PC
        return $results->sortBy(function ($item) {
            return $item->_parent_type === 'pcnu' ? 0 : 1;
        })->values();
    }

    /*
    |--------------------------------------------------------------------------
    | GET AVAILABLE PARENTS FOR LEMBAGA/BANOM (Legacy)
    |--------------------------------------------------------------------------
    */

    /**
     * Get available parents for Lembaga/Banom
     * 
     * @deprecated Use getAvailableParentsForLembaga or getAvailableParentsForBanom instead
     */
    public function getAvailableParentsForLembagaBanom(
        int $levelId,
        ?int $organizationTypeId = null,
        ?int $currentId = null
    ) {
        $level = OrganizationLevel::findOrFail($levelId);
        
        if ($level->slug === 'lembaga') {
            return $this->getAvailableParentsForLembaga($levelId, $organizationTypeId, $currentId);
        }
        
        if ($level->slug === 'banom') {
            return $this->getAvailableParentsForBanom($levelId, $organizationTypeId, $currentId);
        }
        
        throw new \Exception('Level harus Lembaga atau Banom');
    }

    /*
    |--------------------------------------------------------------------------
    | GET TYPES WITH BANOM PC
    |--------------------------------------------------------------------------
    */

    /**
     * Get organization types that already have Banom PC (parent = PC)
     * 
     * @param int $levelId
     * @param int|null $currentId
     * @return \Illuminate\Support\Collection
     */
    public function getTypesWithBanomPc(
        int $levelId,
        ?int $currentId = null
    ) {
        $banomPc = Organization::where('organization_level_id', $levelId)
            ->whereHas('parent.level', function ($q) {
                $q->where('slug', 'pc');
            })
            ->whereNotNull('organization_type_id')
            ->when($currentId, function ($q) use ($currentId) {
                $q->where('id', '!=', $currentId);
            })
            ->with('type')
            ->get();
        
        return $banomPc->pluck('type')->filter()->values();
    }

    /*
    |--------------------------------------------------------------------------
    | GET AVAILABLE TYPES FOR BANOM
    |--------------------------------------------------------------------------
    */

    /**
     * Get available types for Banom
     * - For Banom PC: show types that DON'T have Banom PC yet
     * - For Banom MWC: show types that HAVE Banom PC
     * 
     * @param int $levelId
     * @param bool $isBanomPc
     * @param int|null $currentId
     * @return \Illuminate\Support\Collection
     */
    public function getAvailableTypesForBanom(
        int $levelId,
        bool $isBanomPc = true,
        ?int $currentId = null
    ) {
        $allTypes = OrganizationType::where('organization_level_id', $levelId)
            ->where('is_active', true)
            ->orderBy('nama')
            ->get();
        
        $typesWithBanomPc = $this->getTypesWithBanomPc($levelId, $currentId);
        $typesWithBanomPcIds = $typesWithBanomPc->pluck('id')->toArray();
        
        if ($isBanomPc) {
            // For Banom PC: show types that DON'T have Banom PC yet
            return $allTypes->filter(function ($type) use ($typesWithBanomPcIds) {
                return !in_array($type->id, $typesWithBanomPcIds);
            })->values();
        } else {
            // For Banom MWC: show types that HAVE Banom PC
            return $allTypes->filter(function ($type) use ($typesWithBanomPcIds) {
                return in_array($type->id, $typesWithBanomPcIds);
            })->values();
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET AVAILABLE TYPES FOR LEMBAGA/BANOM AT PARENT LEVEL
    |--------------------------------------------------------------------------
    */

    /**
     * Get available types for Lembaga/Banom at parent level
     */
    public function getAvailableTypesForParent(
        int $parentId,
        int $levelId,
        ?int $currentId = null
    ) {
        $usedTypeIds = Organization::where('parent_id', $parentId)
            ->where('organization_level_id', $levelId)
            ->when($currentId, function ($q) use ($currentId) {
                $q->where('id', '!=', $currentId);
            })
            ->pluck('organization_type_id')
            ->toArray();

        return OrganizationType::where('organization_level_id', $levelId)
            ->where('is_active', true)
            ->whereNotIn('id', $usedTypeIds)
            ->orderBy('nama')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | GET USED KECAMATAN FOR BANOM
    |--------------------------------------------------------------------------
    */

    /**
     * Get kecamatan IDs that already have Banom with specific type
     * 
     * @param int $typeId
     * @param int|null $currentId
     * @return array
     */
    public function getUsedKecamatanForBanom(
        int $typeId,
        ?int $currentId = null
    ): array {
        // Get Banom level ID
        $banomLevel = OrganizationLevel::where('slug', 'banom')->first();
        
        if (!$banomLevel) {
            return [];
        }
        
        // ============ PERBAIKAN ============
        // Ambil semua Banom dengan type ini yang memiliki kecamatan_id
        // Ini adalah Banom yang SUDAH TERDAFTAR (termasuk Banom PC dan Banom MWC)
        // Yang penting: kita ambil semua Banom dengan type_id yang sama
        $usedKecamatanIds = Organization::where('organization_type_id', $typeId)
            ->where('organization_level_id', $banomLevel->id)
            ->whereNotNull('kecamatan_id')
            ->when($currentId, function ($q) use ($currentId) {
                $q->where('id', '!=', $currentId);
            })
            ->pluck('kecamatan_id')
            ->toArray();
        
        return $usedKecamatanIds;
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(array $data, Request $request): Organization
    {
        DB::beginTransaction();

        try {
            $this->validateUniqueArea($data);
            $this->validateLembagaBanomUnique($data);

            $organization = Organization::create([
                'organization_level_id' => $data['organization_level_id'],
                'organization_type_id' => $data['organization_type_id'] ?? null,
                'parent_id' => $data['parent_id'] ?? null,
                'kota_id' => $data['kota_id'] ?? null,
                'kecamatan_id' => $data['kecamatan_id'] ?? null,
                'kelurahan_id' => $data['kelurahan_id'] ?? null,
                'rw_id' => $data['rw_id'] ?? null,
                'nama' => $data['nama'],
                'slug' => Str::slug($data['nama']),
                'alamat' => $data['alamat'] ?? null,
                'telepon' => $data['telepon'] ?? null,
                'email' => $data['email'] ?? null,
                'logo' => $data['logo'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            DB::commit();

            return $organization->load(['level', 'type', 'parent', 'parent.level']);

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

    public function update(int $id, array $data, Request $request): Organization
    {
        DB::beginTransaction();

        try {
            $organization = Organization::findOrFail($id);

            $this->validateUniqueArea($data, $organization->id);
            $this->validateLembagaBanomUnique($data, $organization->id);

            $payload = [
                'organization_level_id' => $data['organization_level_id'],
                'organization_type_id' => $data['organization_type_id'] ?? null,
                'parent_id' => $data['parent_id'] ?? null,
                'kota_id' => $data['kota_id'] ?? null,
                'kecamatan_id' => $data['kecamatan_id'] ?? null,
                'kelurahan_id' => $data['kelurahan_id'] ?? null,
                'rw_id' => $data['rw_id'] ?? null,
                'nama' => $data['nama'],
                'slug' => Str::slug($data['nama']),
                'alamat' => $data['alamat'] ?? null,
                'telepon' => $data['telepon'] ?? null,
                'email' => $data['email'] ?? null,
                'logo' => $data['logo'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ];

            $organization->update($payload);

            DB::commit();

            return $organization->load(['level', 'type', 'parent', 'parent.level']);

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

    public function destroy(int $id, Request $request): bool
    {
        DB::beginTransaction();

        try {
            $organization = Organization::findOrFail($id);

            if ($organization->children()->exists()) {
                throw new \Exception('Organisasi masih memiliki organisasi turunan.');
            }

            $organization->delete();

            DB::commit();
            return true;

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE HELPER METHODS
    |--------------------------------------------------------------------------
    */

    /**
     * Sort Lembaga parents: PC first, then MWC
     */
    private function sortLembagaParents($parents)
    {
        if (!$parents || $parents->isEmpty()) {
            return $parents;
        }
        
        return $parents->sort(function ($a, $b) {
            $aIsPC = $a->level?->slug === 'pc';
            $bIsPC = $b->level?->slug === 'pc';
            
            if ($aIsPC && !$bIsPC) return -1;
            if (!$aIsPC && $bIsPC) return 1;
            
            return strcasecmp($a->nama, $b->nama);
        })->values();
    }

    /**
     * Get available PC for Banom (PC yang belum memiliki Banom PC)
     */
    private function getAvailablePcForBanom(?int $organizationTypeId, ?int $currentId, int $levelId)
    {
        $query = Organization::whereHas('level', function ($q) {
            $q->where('slug', 'pc');
        })
        ->where('is_active', true)
        ->with(['level', 'type']);

        // Filter: hanya PC yang belum memiliki Banom PC dengan type tertentu
        if ($organizationTypeId) {
            // Cari PC yang sudah memiliki Banom PC dengan type ini
            $pcWithBanom = Organization::where('organization_type_id', $organizationTypeId)
                ->where('organization_level_id', $levelId)
                ->whereNotNull('parent_id')
                ->whereHas('parent.level', function ($q) {
                    $q->where('slug', 'pc');
                })
                ->when($currentId, function ($q) use ($currentId) {
                    $q->where('id', '!=', $currentId);
                })
                ->pluck('parent_id')
                ->toArray();
            
            if (!empty($pcWithBanom)) {
                $query->whereNotIn('id', $pcWithBanom);
            }
        }

        return $query->orderBy('nama')->get();
    }

    /**
     * Get available Banom PC for Banom (Banom PC yang belum memiliki Banom MWC)
     */
    private function getAvailableBanomPcForBanom(?int $organizationTypeId, ?int $currentId, int $levelId)
    {
        $query = Organization::where('organization_level_id', $levelId)
            ->where('is_active', true)
            ->whereHas('parent.level', function ($q) {
                $q->where('slug', 'pc');
            })
            ->with(['level', 'parent', 'parent.level', 'type']);

        // Filter: Banom PC yang belum memiliki Banom MWC
        if ($organizationTypeId) {
            $query->where('organization_type_id', $organizationTypeId);
            
            // Cari Banom PC yang sudah memiliki Banom MWC dengan type ini
            $banomWithChild = Organization::where('organization_type_id', $organizationTypeId)
                ->where('organization_level_id', $levelId)
                ->whereNotNull('parent_id')
                ->whereHas('parent.level', function ($q) {
                    $q->where('slug', 'banom');
                })
                ->whereHas('parent.parent.level', function ($q) {
                    $q->where('slug', 'pc');
                })
                ->when($currentId, function ($q) use ($currentId) {
                    $q->where('id', '!=', $currentId);
                })
                ->pluck('parent_id')
                ->toArray();
            
            if (!empty($banomWithChild)) {
                $query->whereNotIn('id', $banomWithChild);
            }
        }

        return $query->orderBy('nama')->get();
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE UNIQUE AREA
    |--------------------------------------------------------------------------
    */

    private function validateUniqueArea(array $data, ?int $ignoreId = null): void
    {
        $level = OrganizationLevel::find($data['organization_level_id']);

        if (!$level) {
            return;
        }

        $slug = strtolower($level->slug);

        // PC -> kota unique
        if ($slug === 'pc' && !empty($data['kota_id'])) {
            $exists = Organization::where('kota_id', $data['kota_id'])
                ->whereHas('level', function ($q) {
                    $q->where('slug', 'pc');
                })
                ->when($ignoreId, function ($q) use ($ignoreId) {
                    $q->where('id', '!=', $ignoreId);
                })
                ->exists();

            if ($exists) {
                throw new \Exception('Kota sudah digunakan oleh organisasi PC lain.');
            }
        }

        // MWC -> kecamatan unique
        if ($slug === 'mwc' && !empty($data['kecamatan_id'])) {
            $exists = Organization::where('kecamatan_id', $data['kecamatan_id'])
                ->whereHas('level', function ($q) {
                    $q->where('slug', 'mwc');
                })
                ->when($ignoreId, function ($q) use ($ignoreId) {
                    $q->where('id', '!=', $ignoreId);
                })
                ->exists();

            if ($exists) {
                throw new \Exception('Kecamatan sudah digunakan oleh organisasi MWC lain.');
            }
        }

        // Ranting -> kelurahan unique
        if ($slug === 'ranting' && !empty($data['kelurahan_id'])) {
            $exists = Organization::where('kelurahan_id', $data['kelurahan_id'])
                ->whereHas('level', function ($q) {
                    $q->where('slug', 'ranting');
                })
                ->when($ignoreId, function ($q) use ($ignoreId) {
                    $q->where('id', '!=', $ignoreId);
                })
                ->exists();

            if ($exists) {
                throw new \Exception('Kelurahan sudah digunakan oleh organisasi Ranting lain.');
            }
        }

        // Anak Ranting -> RW unique
        if ($slug === 'anak-ranting' && !empty($data['rw_id'])) {
            $exists = Organization::where('rw_id', $data['rw_id'])
                ->whereHas('level', function ($q) {
                    $q->where('slug', 'anak-ranting');
                })
                ->when($ignoreId, function ($q) use ($ignoreId) {
                    $q->where('id', '!=', $ignoreId);
                })
                ->exists();

            if ($exists) {
                throw new \Exception('RW sudah digunakan oleh organisasi Anak Ranting lain.');
            }
        }

        // LEMBAGA: type unique per parent
        if ($slug === 'lembaga' && !empty($data['organization_type_id']) && !empty($data['parent_id'])) {
            $exists = Organization::where('organization_type_id', $data['organization_type_id'])
                ->where('parent_id', $data['parent_id'])
                ->where('organization_level_id', $data['organization_level_id'])
                ->when($ignoreId, function ($q) use ($ignoreId) {
                    $q->where('id', '!=', $ignoreId);
                })
                ->exists();

            if ($exists) {
                throw new \Exception('Tipe organisasi ini sudah digunakan untuk organisasi induk yang sama.');
            }
        }

        // BANOM: type + kecamatan harus unique (satu kecamatan hanya boleh satu Banom per tipe)
        if ($slug === 'banom' && !empty($data['organization_type_id']) && !empty($data['kecamatan_id'])) {
            $exists = Organization::where('organization_type_id', $data['organization_type_id'])
                ->where('kecamatan_id', $data['kecamatan_id'])
                ->where('organization_level_id', $data['organization_level_id'])
                ->when($ignoreId, function ($q) use ($ignoreId) {
                    $q->where('id', '!=', $ignoreId);
                })
                ->exists();

            if ($exists) {
                throw new \Exception('Tipe Banom ini sudah terdaftar untuk kecamatan yang sama.');
            }
        }
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE LEMBAGA/BANOM UNIQUE (One type per parent PC)
    |--------------------------------------------------------------------------
    */

    private function validateLembagaBanomUnique(array $data, ?int $ignoreId = null): void
    {
        $level = OrganizationLevel::find($data['organization_level_id']);

        if (!$level || !in_array($level->slug, ['lembaga', 'banom'])) {
            return;
        }

        // Hanya untuk LEMBAGA: satu type per parent PC
        if ($level->slug === 'lembaga' && !empty($data['organization_type_id']) && !empty($data['parent_id'])) {
            $parent = Organization::find($data['parent_id']);
            
            if ($parent && $parent->level->slug === 'pc') {
                $exists = Organization::where('organization_type_id', $data['organization_type_id'])
                    ->whereHas('parent', function ($q) {
                        $q->whereHas('level', function ($sub) {
                            $sub->where('slug', 'pc');
                        });
                    })
                    ->where('organization_level_id', $data['organization_level_id'])
                    ->when($ignoreId, function ($q) use ($ignoreId) {
                        $q->where('id', '!=', $ignoreId);
                    })
                    ->exists();

                if ($exists) {
                    throw new \Exception('Tipe organisasi ini sudah terdaftar untuk tingkat PC. Hanya boleh satu lembaga per tipe di tingkat PC.');
                }
            }
        }
    }
}