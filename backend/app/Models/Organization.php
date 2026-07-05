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

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function level()
    {
        return $this->belongsTo(OrganizationLevel::class, 'organization_level_id');
    }

    public function type()
    {
        return $this->belongsTo(OrganizationType::class, 'organization_type_id');
    }

    public function parent()
    {
        return $this->belongsTo(Organization::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Organization::class, 'parent_id');
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
        return $this->hasMany(Anggota::class);
    }

    public function programThemes()
    {
        return $this->hasMany(ProgramTheme::class, 'organization_id');
    }

    public function workPrograms()
    {
        return $this->hasMany(WorkProgram::class);
    }

    public function activities()
    {
        return $this->hasMany(Activity::class);
    }

    public function activityParticipants()
    {
        return $this->hasMany(ActivityParticipant::class);
    }

    public function participatedActivities()
    {
        return $this->belongsToMany(
            Activity::class,
            'activity_participants',
            'organization_id',
            'activity_id'
        )->withTimestamps();
    }

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
            $ids = array_merge($ids, $child->descendants());
        }

        return $ids;
    }

    public function isDescendantOf(int $organizationId): bool
    {
        return in_array($organizationId, $this->ancestors());
    }

    public function getPc(): ?self
    {
        if ($this->isPC()) {
            return $this;
        }

        $current = $this;
        while ($current->parent) {
            $current = $current->parent;
            if ($current->isPC()) {
                return $current;
            }
        }

        return null;
    }

    public function getPcId(): ?int
    {
        $pc = $this->getPc();
        return $pc?->id;
    }

    public function getMwc(): ?self
    {
        if ($this->isMWC()) {
            return $this;
        }

        $current = $this;
        while ($current->parent) {
            $current = $current->parent;
            if ($current->isMWC()) {
                return $current;
            }
        }

        return null;
    }

    public function getMwcId(): ?int
    {
        $mwc = $this->getMwc();
        return $mwc?->id;
    }

    public function isUnderPc(int $pcId): bool
    {
        $pc = $this->getPc();
        return $pc && $pc->id === $pcId;
    }

    public function isUnderMwc(int $mwcId): bool
    {
        $mwc = $this->getMwc();
        return $mwc && $mwc->id === $mwcId;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query
            ->leftJoin('organization_levels', 'organizations.organization_level_id', '=', 'organization_levels.id')
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

    public function scopePcOnly(Builder $query): Builder
    {
        return $query->whereHas('level', fn($q) => $q->where('slug', 'pc'));
    }

    public function scopeMwcOnly(Builder $query): Builder
    {
        return $query->whereHas('level', fn($q) => $q->where('slug', 'mwc'));
    }

    public function scopeRantingOnly(Builder $query): Builder
    {
        return $query->whereHas('level', fn($q) => $q->where('slug', 'ranting'));
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        if (empty($search)) return $query;
        
        return $query->where(function ($q) use ($search) {
            $q->where('nama', 'LIKE', "%{$search}%")
              ->orWhere('slug', 'LIKE', "%{$search}%")
              ->orWhere('alamat', 'LIKE', "%{$search}%");
        });
    }

    public function scopeByLevel(Builder $query, string $levelSlug): Builder
    {
        return $query->whereHas('level', fn($q) => $q->where('slug', $levelSlug));
    }

    public function getFullAddressAttribute(): string
    {
        $parts = [];
        if ($this->alamat) $parts[] = $this->alamat;
        if ($this->kelurahan) $parts[] = $this->kelurahan->nama;
        if ($this->kecamatan) $parts[] = $this->kecamatan->nama;
        if ($this->kota) $parts[] = $this->kota->nama;
        
        return implode(', ', $parts);
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->is_active ? 'Aktif' : 'Tidak Aktif';
    }

    public function getLevelNameAttribute(): string
    {
        return $this->level?->nama ?? '-';
    }
}