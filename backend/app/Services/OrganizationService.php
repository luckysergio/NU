<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\OrganizationLevel;
use App\Models\OrganizationType;
use App\Events\OrganizationCreated;
use App\Events\OrganizationUpdated;
use App\Events\OrganizationDeleted;
use App\Events\DashboardOrganizationCountUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Collection;

class OrganizationService
{
    protected const CACHE_DURATION = 300;
    protected const CACHE_PREFIX = 'organizations_';
    protected const CACHE_TAG = 'organizations';
    
    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function getAll(Request $request)
    {
        $filters = $this->extractFilters($request);
        $bypassCache = $request->query('bypass_cache', false);
        
        if ($bypassCache || $request->query('_t')) {
            return $this->buildOrganizationQuery($filters)->paginate($filters['per_page']);
        }
        
        $cacheKey = $this->getCacheKey('list', $filters);
        
        return $this->rememberWithTag($cacheKey, function () use ($filters) {
            return $this->buildOrganizationQuery($filters)->paginate($filters['per_page']);
        });
    }

    public function findById(int $id): Organization
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);
        
        return $this->rememberWithTag($cacheKey, function () use ($id) {
            return Organization::with([
                'level', 'type', 'parent', 'parent.level', 'parent.type',
                'children', 'children.level', 'children.type',
                'kota', 'kecamatan', 'kelurahan', 'rw', 'users'
            ])->findOrFail($id);
        });
    }

    public function store(array $data, Request $request): Organization
    {
        DB::beginTransaction();

        try {
            $this->validateUniqueArea($data);
            $this->validateLembagaBanomUnique($data);

            $organization = Organization::create($this->preparePayload($data));

            DB::commit();

            $this->clearCache();

            broadcast(new OrganizationCreated($organization));
            $this->broadcastDashboardUpdate();

            return $organization->load(['level', 'type', 'parent', 'parent.level']);

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function update(int $id, array $data, Request $request): Organization
    {
        DB::beginTransaction();

        try {
            $organization = Organization::findOrFail($id);

            $this->validateUniqueArea($data, $organization->id);
            $this->validateLembagaBanomUnique($data, $organization->id);

            $organization->update($this->preparePayload($data));

            DB::commit();

            $this->clearCache();

            broadcast(new OrganizationUpdated($organization->fresh(['level', 'type', 'parent', 'parent.level'])));
            $this->broadcastDashboardUpdate();

            return $organization->load(['level', 'type', 'parent', 'parent.level']);

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

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

            $this->clearCache();

            broadcast(new OrganizationDeleted($id));
            $this->broadcastDashboardUpdate();

            return true;

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    private function broadcastDashboardUpdate(): void
    {
        try {
            $totalOrganizations = Organization::count();
            
            $statistics = [];
            $totals = [];
            $levels = OrganizationLevel::all();
            
            foreach ($levels as $level) {
                $count = Organization::where('organization_level_id', $level->id)->count();
                
                $statistics[$level->slug] = [
                    'count' => $count,
                    'display' => $this->getLevelDisplayName($level->slug),
                    'name' => $level->nama,
                    'slug' => $level->slug,
                    'color' => $this->getLevelColor($level->slug),
                ];
                
                $totals[$level->slug] = $count;
            }
            
            $totals['total'] = $totalOrganizations;
            
            broadcast(new DashboardOrganizationCountUpdated($totalOrganizations, $statistics, $totals));
            
            Log::info('Dashboard broadcast sent: total=' . $totalOrganizations);
            
        } catch (\Exception $e) {
            Log::error('Failed to broadcast dashboard update: ' . $e->getMessage());
        }
    }

    private function getLevelDisplayName(string $slug): string
    {
        $names = [
            'pc' => 'PCNU',
            'mwc' => 'MWCNU',
            'ranting' => 'RANTING',
            'anak-ranting' => 'ANAK RANTING',
            'lembaga' => 'LEMBAGA',
            'banom' => 'BANOM',
        ];
        return $names[$slug] ?? strtoupper($slug);
    }

    private function getLevelColor(string $slug): string
    {
        $colors = [
            'pc' => 'purple',
            'mwc' => 'blue',
            'ranting' => 'green',
            'anak-ranting' => 'teal',
            'lembaga' => 'orange',
            'banom' => 'pink',
        ];
        return $colors[$slug] ?? 'gray';
    }

    public function getLevelFilters(int $levelId): array
    {
        $cacheKey = $this->getCacheKey('level_filters_' . $levelId);
        
        return $this->rememberWithTag($cacheKey, function () use ($levelId) {
            $level = OrganizationLevel::findOrFail($levelId);

            return [
                'level' => $level,
                'show_kota' => $level->slug === 'pc',
                'show_kecamatan' => $level->slug === 'mwc',
                'show_kelurahan' => $level->slug === 'ranting',
                'show_rw' => $level->slug === 'anak-ranting',
                'show_organization_type' => in_array($level->slug, ['lembaga', 'banom']),
                'organization_types' => $this->getOrganizationTypesForLevel($level),
            ];
        });
    }

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

    public function getAvailableTypesForLembagaByParent(
        int $parentId,
        int $levelId,
        ?int $currentId = null
    ) {
        $cacheKey = $this->getCacheKey('available_types_lembaga_parent_' . $parentId . '_' . $levelId . '_' . $currentId);
        
        return $this->rememberWithTag($cacheKey, function () use ($parentId, $levelId, $currentId) {
            $parent = Organization::with('level')->find($parentId);
            
            if (!$parent) {
                return collect([]);
            }

            $parentSlug = $parent->level?->slug;

            $query = OrganizationType::where('organization_level_id', $levelId)
                ->where('is_active', true);

            if ($parentSlug === 'pc') {
            } elseif ($parentSlug === 'mwc') {
                $usedTypeIds = Organization::where('parent_id', $parentId)
                    ->where('organization_level_id', $levelId)
                    ->when($currentId, fn($q) => $q->where('id', '!=', $currentId))
                    ->pluck('organization_type_id')
                    ->toArray();

                if (!empty($usedTypeIds)) {
                    $query->whereNotIn('id', $usedTypeIds);
                }
            } else {
                return collect([]);
            }

            return $query->orderBy('nama')->get();
        });
    }

    public function getTypesWithBanomPc(int $levelId, ?int $currentId = null)
    {
        $cacheKey = $this->getCacheKey('types_with_banom_pc_' . $levelId . '_' . $currentId);
        
        return $this->rememberWithTag($cacheKey, function () use ($levelId, $currentId) {
            return Organization::where('organization_level_id', $levelId)
                ->whereHas('parent.level', fn($q) => $q->where('slug', 'pc'))
                ->whereNotNull('organization_type_id')
                ->when($currentId, fn($q) => $q->where('id', '!=', $currentId))
                ->with('type')
                ->get()
                ->pluck('type')
                ->filter()
                ->values();
        });
    }

    public function getAvailableTypesForBanom(
        int $levelId,
        bool $isBanomPc = true,
        ?int $currentId = null
    ) {
        $cacheKey = $this->getCacheKey('available_types_banom_' . $levelId . '_' . ($isBanomPc ? 'pc' : 'mwc') . '_' . $currentId);
        
        return $this->rememberWithTag($cacheKey, function () use ($levelId, $isBanomPc, $currentId) {
            $allTypes = OrganizationType::where('organization_level_id', $levelId)
                ->where('is_active', true)
                ->orderBy('nama')
                ->get();
            
            $typesWithBanomPc = $this->getTypesWithBanomPc($levelId, $currentId);
            $usedTypeIds = $typesWithBanomPc->pluck('id')->toArray();
            
            return $allTypes->filter(function ($type) use ($usedTypeIds, $isBanomPc) {
                $exists = in_array($type->id, $usedTypeIds);
                return $isBanomPc ? !$exists : $exists;
            })->values();
        });
    }

    public function getAvailableTypesForParent(
        int $parentId,
        int $levelId,
        ?int $currentId = null
    ) {
        $cacheKey = $this->getCacheKey('available_types_parent_' . $parentId . '_' . $levelId . '_' . $currentId);
        
        return $this->rememberWithTag($cacheKey, function () use ($parentId, $levelId, $currentId) {
            $usedTypeIds = Organization::where('parent_id', $parentId)
                ->where('organization_level_id', $levelId)
                ->when($currentId, fn($q) => $q->where('id', '!=', $currentId))
                ->pluck('organization_type_id')
                ->toArray();

            return OrganizationType::where('organization_level_id', $levelId)
                ->where('is_active', true)
                ->whereNotIn('id', $usedTypeIds)
                ->orderBy('nama')
                ->get();
        });
    }

    public function getUsedKecamatanForBanom(int $typeId, ?int $currentId = null): array
    {
        $cacheKey = $this->getCacheKey('used_kecamatan_banom_' . $typeId . '_' . $currentId);
        
        return $this->rememberWithTag($cacheKey, function () use ($typeId, $currentId) {
            $banomLevel = OrganizationLevel::where('slug', 'banom')->first();
            
            if (!$banomLevel) {
                return [];
            }
            
            return Organization::where('organization_type_id', $typeId)
                ->where('organization_level_id', $banomLevel->id)
                ->whereNotNull('kecamatan_id')
                ->when($currentId, fn($q) => $q->where('id', '!=', $currentId))
                ->pluck('kecamatan_id')
                ->toArray();
        });
    }

    private function extractFilters(Request $request): array
    {
        return [
            'search' => trim((string) $request->query('search')),
            'levelId' => $request->query('organization_level_id'),
            'typeId' => $request->query('organization_type_id'),
            'parentId' => $request->query('parent_id'),
            'kotaId' => $request->query('kota_id'),
            'kecamatanId' => $request->query('kecamatan_id'),
            'kelurahanId' => $request->query('kelurahan_id'),
            'rwId' => $request->query('rw_id'),
            'per_page' => min((int) $request->query('per_page', 10), 1000),
            'page' => (int) $request->query('page', 1),
        ];
    }

    private function buildOrganizationQuery(array $filters)
    {
        return Organization::query()
            ->with(['level', 'type', 'parent', 'parent.level', 'parent.type', 'kota', 'kecamatan', 'kelurahan', 'rw'])
            ->leftJoin('organization_levels', 'organizations.organization_level_id', '=', 'organization_levels.id')
            ->select('organizations.*')
            ->when($filters['search'], function ($query) use ($filters) {
                $search = strtolower($filters['search']);
                $query->where(function ($q) use ($search) {
                    $q->whereRaw('LOWER(organizations.nama) LIKE ?', ["%{$search}%"])
                      ->orWhereRaw('LOWER(organizations.slug) LIKE ?', ["%{$search}%"]);
                });
            })
            ->when($filters['levelId'], fn($q) => $q->where('organizations.organization_level_id', $filters['levelId']))
            ->when($filters['typeId'], fn($q) => $q->where('organizations.organization_type_id', $filters['typeId']))
            ->when($filters['parentId'], fn($q) => $q->where('organizations.parent_id', $filters['parentId']))
            ->when($filters['kotaId'], fn($q) => $q->where('organizations.kota_id', $filters['kotaId']))
            ->when($filters['kecamatanId'], fn($q) => $q->where('organizations.kecamatan_id', $filters['kecamatanId']))
            ->when($filters['kelurahanId'], fn($q) => $q->where('organizations.kelurahan_id', $filters['kelurahanId']))
            ->when($filters['rwId'], fn($q) => $q->where('organizations.rw_id', $filters['rwId']))
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
            ->orderBy('organizations.nama', 'asc');
    }

    private function preparePayload(array $data): array
    {
        return [
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
    }

    private function getOrganizationTypesForLevel(OrganizationLevel $level): Collection
    {
        if (!in_array($level->slug, ['lembaga', 'banom'])) {
            return collect([]);
        }

        return OrganizationType::where('organization_level_id', $level->id)
            ->where('is_active', true)
            ->orderBy('nama')
            ->get();
    }

    private function validateUniqueArea(array $data, ?int $ignoreId = null): void
    {
        $level = OrganizationLevel::find($data['organization_level_id']);
        if (!$level) return;

        $rules = [
            'pc' => ['field' => 'kota_id', 'message' => 'Kota sudah digunakan oleh organisasi PC lain.'],
            'mwc' => ['field' => 'kecamatan_id', 'message' => 'Kecamatan sudah digunakan oleh organisasi MWC lain.'],
            'ranting' => ['field' => 'kelurahan_id', 'message' => 'Kelurahan sudah digunakan oleh organisasi Ranting lain.'],
            'anak-ranting' => ['field' => 'rw_id', 'message' => 'RW sudah digunakan oleh organisasi Anak Ranting lain.'],
        ];

        $slug = strtolower($level->slug);

        if (isset($rules[$slug])) {
            $rule = $rules[$slug];
            $field = $rule['field'];
            
            if (!empty($data[$field])) {
                $exists = Organization::where($field, $data[$field])
                    ->whereHas('level', fn($q) => $q->where('slug', $slug))
                    ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
                    ->exists();

                if ($exists) {
                    throw new \Exception($rule['message']);
                }
            }
        }

        if ($slug === 'lembaga' && !empty($data['organization_type_id']) && !empty($data['parent_id'])) {
            $exists = Organization::where('organization_type_id', $data['organization_type_id'])
                ->where('parent_id', $data['parent_id'])
                ->where('organization_level_id', $data['organization_level_id'])
                ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
                ->exists();

            if ($exists) {
                throw new \Exception('Tipe organisasi ini sudah digunakan untuk organisasi induk yang sama.');
            }
        }

        if ($slug === 'banom' && !empty($data['organization_type_id']) && !empty($data['kecamatan_id'])) {
            $exists = Organization::where('organization_type_id', $data['organization_type_id'])
                ->where('kecamatan_id', $data['kecamatan_id'])
                ->where('organization_level_id', $data['organization_level_id'])
                ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
                ->exists();

            if ($exists) {
                throw new \Exception('Tipe Banom ini sudah terdaftar untuk kecamatan yang sama.');
            }
        }
    }

    private function validateLembagaBanomUnique(array $data, ?int $ignoreId = null): void
    {
        $level = OrganizationLevel::find($data['organization_level_id']);
        if (!$level || !in_array($level->slug, ['lembaga', 'banom'])) return;

        if ($level->slug === 'lembaga' && !empty($data['organization_type_id']) && !empty($data['parent_id'])) {
            $parent = Organization::find($data['parent_id']);
            
            if ($parent && $parent->level->slug === 'pc') {
                $exists = Organization::where('organization_type_id', $data['organization_type_id'])
                    ->whereHas('parent', fn($q) => $q->whereHas('level', fn($sub) => $sub->where('slug', 'pc')))
                    ->where('organization_level_id', $data['organization_level_id'])
                    ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
                    ->exists();

                if ($exists) {
                    throw new \Exception('Tipe organisasi ini sudah terdaftar untuk tingkat PC. Hanya boleh satu lembaga per tipe di tingkat PC.');
                }
            }
        }
    }

    private function getAvailableParentsForLembaga(
        int $levelId,
        ?int $organizationTypeId = null,
        ?int $currentId = null
    ) {
        $cacheKey = $this->getCacheKey('available_parents_lembaga_' . $levelId . '_' . $organizationTypeId . '_' . $currentId);
        
        return $this->rememberWithTag($cacheKey, function () use ($levelId, $organizationTypeId, $currentId) {
            $query = Organization::whereHas('level', fn($q) => $q->whereIn('slug', ['pc', 'mwc']))
                ->where('is_active', true)
                ->with(['level', 'type']);

            if ($organizationTypeId) {
                $usedParentIds = Organization::where('organization_type_id', $organizationTypeId)
                    ->where('organization_level_id', $levelId)
                    ->whereNotNull('parent_id')
                    ->when($currentId, fn($q) => $q->where('id', '!=', $currentId))
                    ->pluck('parent_id')
                    ->toArray();

                if (!empty($usedParentIds)) {
                    $query->whereNotIn('id', $usedParentIds);
                }
            }

            $results = $query->orderBy('nama')->get();
            return $this->sortLembagaParents($results);
        });
    }

    private function getAvailableParentsForBanom(
        int $levelId,
        ?int $organizationTypeId = null,
        ?int $currentId = null
    ) {
        $cacheKey = $this->getCacheKey('available_parents_banom_' . $levelId . '_' . $organizationTypeId . '_' . $currentId);
        
        return $this->rememberWithTag($cacheKey, function () use ($levelId, $organizationTypeId, $currentId) {
            $results = collect();

            $pcParents = $this->getAvailablePcForBanom($organizationTypeId, $currentId, $levelId);
            foreach ($pcParents as $pc) {
                $pc->_parent_type = 'pcnu';
                $pc->_display_name = $pc->nama . ' (PCNU) - Untuk Banom Tingkat Kota';
                $results->push($pc);
            }

            $banomPcParents = $this->getAvailableBanomPcForBanom($organizationTypeId, $currentId, $levelId);
            foreach ($banomPcParents as $banom) {
                $banom->_parent_type = 'banom_pc';
                $banom->_display_name = $banom->nama . ' (Banom ' . ($banom->type?->nama ?? '') . ' Tingkat Kota) - Untuk Banom Tingkat Kecamatan';
                $results->push($banom);
            }

            return $results->sortBy(fn($item) => $item->_parent_type === 'pcnu' ? 0 : 1)->values();
        });
    }

    private function getAvailablePcForBanom(?int $organizationTypeId, ?int $currentId, int $levelId)
    {
        $query = Organization::whereHas('level', fn($q) => $q->where('slug', 'pc'))
            ->where('is_active', true)
            ->with(['level', 'type']);

        if ($organizationTypeId) {
            $pcWithBanom = Organization::where('organization_type_id', $organizationTypeId)
                ->where('organization_level_id', $levelId)
                ->whereNotNull('parent_id')
                ->whereHas('parent.level', fn($q) => $q->where('slug', 'pc'))
                ->when($currentId, fn($q) => $q->where('id', '!=', $currentId))
                ->pluck('parent_id')
                ->toArray();
            
            if (!empty($pcWithBanom)) {
                $query->whereNotIn('id', $pcWithBanom);
            }
        }

        return $query->orderBy('nama')->get();
    }

    private function getAvailableBanomPcForBanom(?int $organizationTypeId, ?int $currentId, int $levelId)
    {
        $query = Organization::where('organization_level_id', $levelId)
            ->where('is_active', true)
            ->whereHas('parent.level', fn($q) => $q->where('slug', 'pc'))
            ->with(['level', 'parent', 'parent.level', 'type']);

        if ($organizationTypeId) {
            $query->where('organization_type_id', $organizationTypeId);
            
            $banomWithChild = Organization::where('organization_type_id', $organizationTypeId)
                ->where('organization_level_id', $levelId)
                ->whereNotNull('parent_id')
                ->whereHas('parent.level', fn($q) => $q->where('slug', 'banom'))
                ->whereHas('parent.parent.level', fn($q) => $q->where('slug', 'pc'))
                ->when($currentId, fn($q) => $q->where('id', '!=', $currentId))
                ->pluck('parent_id')
                ->toArray();
            
            if (!empty($banomWithChild)) {
                $query->whereNotIn('id', $banomWithChild);
            }
        }

        return $query->orderBy('nama')->get();
    }

    private function sortLembagaParents(Collection $parents): Collection
    {
        if ($parents->isEmpty()) return $parents;
        
        return $parents->sort(function ($a, $b) {
            $aIsPC = $a->level?->slug === 'pc';
            $bIsPC = $b->level?->slug === 'pc';
            
            if ($aIsPC && !$bIsPC) return -1;
            if (!$aIsPC && $bIsPC) return 1;
            
            return strcasecmp($a->nama, $b->nama);
        })->values();
    }

    private function getCacheKey(string $key, array $params = []): string
    {
        $paramString = !empty($params) ? '_' . md5(json_encode($params)) : '';
        return self::CACHE_PREFIX . $key . $paramString;
    }

    private function rememberWithTag(string $key, \Closure $callback)
    {
        try {
            if (method_exists(Cache::getStore(), 'tags')) {
                return Cache::tags([self::CACHE_TAG])->remember($key, self::CACHE_DURATION, $callback);
            }
        } catch (\Exception $e) {
            Log::warning('Cache tags not supported, using fallback: ' . $e->getMessage());
        }
        
        return Cache::remember($key, self::CACHE_DURATION, $callback);
    }

    private function clearCache(): void
    {
        try {
            if (method_exists(Cache::getStore(), 'tags')) {
                Cache::tags([self::CACHE_TAG])->flush();
                Log::info('Cache organizations cleared using tags');
                return;
            }
        } catch (\Exception $e) {
            Log::warning('Failed to clear cache with tags: ' . $e->getMessage());
        }
        
        try {
            Cache::flush();
            Log::info('Cache organizations flushed completely');
        } catch (\Exception $e) {
            Log::error('Failed to flush cache: ' . $e->getMessage());
        }
    }
}