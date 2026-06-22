<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Organization extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [

        'organization_level_id',

        'organization_type_id',

        'parent_id',

        'kota_id',

        'kecamatan_id',

        'kelurahan_id',

        'rw_id',

        'nama',

        'slug',

        'alamat',

        'telepon',

        'email',

        'logo',

        'is_active',
    ];

    protected function casts(): array
    {
        return [

            'is_active' => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function level()
    {
        return $this->belongsTo(
            OrganizationLevel::class,
            'organization_level_id'
        );
    }

    public function type()
    {
        return $this->belongsTo(
            OrganizationType::class,
            'organization_type_id'
        );
    }

    public function parent()
    {
        return $this->belongsTo(
            Organization::class,
            'parent_id'
        );
    }

    public function children()
    {
        return $this->hasMany(
            Organization::class,
            'parent_id'
        );
    }

    public function kota()
    {
        return $this->belongsTo(Kota::class);
    }

    public function kecamatan()
    {
        return $this->belongsTo(Kecamatan::class);
    }

    public function kelurahan()
    {
        return $this->belongsTo(Kelurahan::class);
    }

    public function rw()
    {
        return $this->belongsTo(RW::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function anggotas()
    {
        return $this->hasMany(
            Anggota::class
        );
    }

    public function programThemes()
    {
        return $this->hasMany(
            ProgramTheme::class,
            'organization_id'
        );
    }

    public function workPrograms()
    {
        return $this->hasMany(
            WorkProgram::class
        );
    }

    public function activities()
    {
        return $this->hasMany(
            Activity::class
        );
    }

    public function activityParticipants()
    {
        return $this->hasMany(
            ActivityParticipant::class
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Level Helpers
    |--------------------------------------------------------------------------
    */

    public function levelSlug(): ?string
    {
        return $this->level?->slug;
    }

    public function isPC(): bool
    {
        return $this->levelSlug() === 'pc';
    }

    public function isMWC(): bool
    {
        return $this->levelSlug() === 'mwc';
    }

    public function isRanting(): bool
    {
        return $this->levelSlug() === 'ranting';
    }

    public function isAnakRanting(): bool
    {
        return $this->levelSlug() === 'anak-ranting';
    }

    public function isLembaga(): bool
    {
        return $this->levelSlug() === 'lembaga';
    }

    public function isBanom(): bool
    {
        return $this->levelSlug() === 'banom';
    }

    /*
    |--------------------------------------------------------------------------
    | Hierarchy Helpers
    |--------------------------------------------------------------------------
    */

    public function ancestors(): array
    {
        $ancestors = [];

        $parent = $this->parent;

        while ($parent) {

            $ancestors[] = $parent->id;

            $parent = $parent->parent;
        }

        return $ancestors;
    }

    public function descendants(): array
    {
        $ids = [];

        foreach ($this->children as $child) {

            $ids[] = $child->id;

            $ids = array_merge(
                $ids,
                $child->descendants()
            );
        }

        return $ids;
    }

    public function isDescendantOf(
        int $organizationId
    ): bool {

        return in_array(
            $organizationId,
            $this->ancestors()
        );
    }

    /**
     * Get the PC (Pimpinan Cabang) organization in the hierarchy
     * This will traverse up the hierarchy to find the PC level
     */
    public function getPc(): ?self
    {
        // If current organization is PC, return itself
        if ($this->isPC()) {
            return $this;
        }

        // Traverse up the hierarchy to find PC
        $current = $this;

        while ($current->parent) {
            $current = $current->parent;
            if ($current->isPC()) {
                return $current;
            }
        }

        return null;
    }

    /**
     * Get the PC ID (Pimpinan Cabang) for this organization
     */
    public function getPcId(): ?int
    {
        $pc = $this->getPc();
        return $pc?->id;
    }

    /**
     * Get the MWC (Majelis Wakil Cabang) organization in the hierarchy
     * This will traverse up the hierarchy to find the MWC level
     */
    public function getMwc(): ?self
    {
        // If current organization is MWC, return itself
        if ($this->isMWC()) {
            return $this;
        }

        // Traverse up the hierarchy to find MWC
        $current = $this;

        while ($current->parent) {
            $current = $current->parent;
            if ($current->isMWC()) {
                return $current;
            }
        }

        return null;
    }

    /**
     * Get the MWC ID for this organization
     */
    public function getMwcId(): ?int
    {
        $mwc = $this->getMwc();
        return $mwc?->id;
    }

    /**
     * Check if this organization is under a specific PC
     */
    public function isUnderPc(int $pcId): bool
    {
        $pc = $this->getPc();
        return $pc && $pc->id === $pcId;
    }

    /**
     * Check if this organization is under a specific MWC
     */
    public function isUnderMwc(int $mwcId): bool
    {
        $mwc = $this->getMwc();
        return $mwc && $mwc->id === $mwcId;
    }

    /*
    |--------------------------------------------------------------------------
    | Scope
    |--------------------------------------------------------------------------
    */

    public function scopeOrdered(
        Builder $query
    ): Builder {

        return $query

            ->leftJoin(
                'organization_levels',
                'organizations.organization_level_id',
                '=',
                'organization_levels.id'
            )

            ->orderByRaw("
                CASE organization_levels.slug
                    WHEN 'pc' THEN 1
                    WHEN 'mwc' THEN 2
                    WHEN 'ranting' THEN 3
                    WHEN 'anak-ranting' THEN 4
                    WHEN 'lembaga' THEN 5
                    WHEN 'banom' THEN 6
                    ELSE 999
                END
            ")

            ->orderBy('organizations.nama')

            ->select('organizations.*');
    }

    /**
     * Scope to get only PC organizations
     */
    public function scopePcOnly(Builder $query): Builder
    {
        return $query->whereHas('level', function ($q) {
            $q->where('slug', 'pc');
        });
    }

    /**
     * Scope to get only MWC organizations
     */
    public function scopeMwcOnly(Builder $query): Builder
    {
        return $query->whereHas('level', function ($q) {
            $q->where('slug', 'mwc');
        });
    }

    /**
     * Scope to get only Ranting organizations
     */
    public function scopeRantingOnly(Builder $query): Builder
    {
        return $query->whereHas('level', function ($q) {
            $q->where('slug', 'ranting');
        });
    }

    /**
     * Scope to get active organizations only
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
