<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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

    // RELATIONS
    public function level(): BelongsTo
    {
        return $this->belongsTo(OrganizationLevel::class, 'organization_level_id');
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(OrganizationType::class, 'organization_type_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Organization::class, 'parent_id');
    }

    public function kota(): BelongsTo { return $this->belongsTo(Kota::class); }
    public function kecamatan(): BelongsTo { return $this->belongsTo(Kecamatan::class); }
    public function kelurahan(): BelongsTo { return $this->belongsTo(Kelurahan::class); }
    public function rw(): BelongsTo { return $this->belongsTo(RW::class); }
    public function users(): HasMany { return $this->hasMany(User::class); }
    public function anggotas(): HasMany { return $this->hasMany(Anggota::class); }
    public function programThemes(): HasMany { return $this->hasMany(ProgramTheme::class, 'organization_id'); }
    public function workPrograms(): HasMany { return $this->hasMany(WorkProgram::class); }
    public function activities(): HasMany { return $this->hasMany(Activity::class); }
    public function activityParticipants(): HasMany { return $this->hasMany(ActivityParticipant::class); }

    public function participatedActivities(): BelongsToMany
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

    public function isPC(): bool { return $this->levelSlug() === 'pc'; }
    public function isMWC(): bool { return $this->levelSlug() === 'mwc'; }
    public function isRanting(): bool { return $this->levelSlug() === 'ranting'; }
    public function isAnakRanting(): bool { return $this->levelSlug() === 'anak-ranting'; }
    public function isLembaga(): bool { return $this->levelSlug() === 'lembaga'; }
    public function isBanom(): bool { return $this->levelSlug() === 'banom'; }

    public function ancestors(): array
    {
        $ancestors = [];
        $current = $this->relationLoaded('parent') ? $this->parent : $this->parent()->first();

        while ($current) {
            $ancestors[] = $current->id;
            $current = $current->parent;
        }

        return $ancestors;
    }

    public function descendants(): array
    {
        $children = $this->children()->with('children')->get();
        $ids = [];

        foreach ($children as $child) {
            $ids[] = $child->id;
            $ids = array_merge($ids, $child->descendants());
        }
        
        return array_unique($ids);
    }

    public function getAllDescendantIds(): array
    {
        return array_unique(array_merge([$this->id], $this->descendants()));
    }

    public function getAllAncestorIds(): array
    {
        return array_unique(array_merge([$this->id], $this->ancestors()));
    }

    public function isDescendantOf(int $organizationId): bool
    {
        return in_array($organizationId, $this->ancestors());
    }

    public function getPc(): ?self
    {
        if ($this->isPC()) return $this;

        $current = $this->parent;
        while ($current) {
            if ($current->isPC()) return $current;
            $current = $current->parent;
        }

        return null;
    }

    public function getPcId(): ?int
    {
        return $this->getPc()?->id;
    }

    public function getMwc(): ?self
    {
        if ($this->isMWC()) return $this;

        $current = $this->parent;
        while ($current) {
            if ($current->isMWC()) return $current;
            $current = $current->parent;
        }

        return null;
    }

    public function getMwcId(): ?int
    {
        return $this->getMwc()?->id;
    }

    public function isUnderPc(int $pcId): bool
    {
        return $this->getPcId() === $pcId;
    }

    public function isUnderMwc(int $mwcId): bool
    {
        return $this->getMwcId() === $mwcId;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('organizations.is_active', true);
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
            $q->where('organizations.nama', 'LIKE', "%{$search}%")
              ->orWhere('organizations.slug', 'LIKE', "%{$search}%")
              ->orWhere('organizations.alamat', 'LIKE', "%{$search}%");
        });
    }

    public function scopeByLevel(Builder $query, string $levelSlug): Builder
    {
        return $query->whereHas('level', fn($q) => $q->where('slug', $levelSlug));
    }

    public function scopeAccessibleByUser(Builder $query, User $user): Builder
    {
        if ($user->isSuperAdmin()) return $query;

        $accessibleIds = $user->getAccessibleOrganizationIds();
        if ($accessibleIds === null) return $query;
        if (empty($accessibleIds)) return $query->whereRaw('1 = 0');

        return $query->whereIn('organizations.id', $accessibleIds);
    }

    // ACCESSORS (Format Baru Laravel 12 + Pencegahan N+1 Cache)
    protected function fullAddress(): Attribute
    {
        return Attribute::make(
            get: function ($value, $attributes) {
                $parts = [];
                if (!empty($attributes['alamat'])) $parts[] = $attributes['alamat'];
                if ($this->relationLoaded('kelurahan') && $this->kelurahan) $parts[] = $this->kelurahan->nama;
                if ($this->relationLoaded('kecamatan') && $this->kecamatan) $parts[] = $this->kecamatan->nama;
                if ($this->relationLoaded('kota') && $this->kota) $parts[] = $this->kota->nama;
                
                return implode(', ', $parts);
            }
        );
    }

    protected function statusLabel(): Attribute
    {
        return Attribute::make(
            get: fn ($value, $attributes) => $attributes['is_active'] ? 'Aktif' : 'Tidak Aktif',
        );
    }

    protected function levelName(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->level?->nama ?? '-',
        );
    }

    protected function levelDisplayName(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->level?->display_name ?? $this->level?->nama ?? '-',
        );
    }

    protected function parentName(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->parent?->nama ?? '-',
        );
    }

    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: function ($value, $attributes) {
                $levelName = $this->level_display_name;
                return $levelName !== '-' ? "{$attributes['nama']} ({$levelName})" : $attributes['nama'];
            }
        );
    }
}