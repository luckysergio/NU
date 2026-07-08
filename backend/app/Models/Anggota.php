<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Anggota extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'anggotas';

    protected $fillable = [
        'organization_id',
        'jabatan_id',
        'no_anggota',
        'nama',
        'no_hp',
        'alamat',
        'foto',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function jabatan(): BelongsTo
    {
        return $this->belongsTo(Jabatan::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class, 'penanggung_jawab_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(ActivityAttendance::class);
    }

    public function attendedActivities(): BelongsToMany
    {
        return $this->belongsToMany(
            Activity::class,
            'activity_attendances',
            'anggota_id',
            'activity_id'
        )->withTimestamps();
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(MemberCertificate::class);
    }

    public function scopeAccessibleByUser(Builder $query, User $user): Builder
    {
        if ($user->isSuperAdmin()) {
            return $query;
        }

        $accessibleIds = $user->getAccessibleOrganizationIds();
        
        if ($accessibleIds === null) {
            return $query;
        }

        if (empty($accessibleIds)) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn('anggotas.organization_id', $accessibleIds);
    }

    public function scopeByOrganizationIds(Builder $query, array $organizationIds): Builder
    {
        if (empty($organizationIds)) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn('anggotas.organization_id', $organizationIds);
    }

    public function scopeByLevel(Builder $query, string $levelSlug): Builder
    {
        return $query->whereHas('organization.level', fn($q) => $q->where('slug', $levelSlug));
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('anggotas.is_active', true);
    }

    public function scopeByOrganization(Builder $query, int $organizationId): Builder
    {
        return $query->where('anggotas.organization_id', $organizationId);
    }

    public function scopeByJabatan(Builder $query, int $jabatanId): Builder
    {
        return $query->where('anggotas.jabatan_id', $jabatanId);
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (empty($search)) {
            return $query;
        }
        
        return $query->where(function ($q) use ($search) {
            $q->where('anggotas.nama', 'LIKE', "%{$search}%")
              ->orWhere('anggotas.no_anggota', 'LIKE', "%{$search}%");
        });
    }

    public function scopeWithRelations(Builder $query): Builder
    {
        return $query->with([
            'organization' => function ($q) {
                $q->select(['id', 'nama', 'slug', 'organization_level_id'])
                  ->with(['level' => function ($q2) {
                      $q2->select(['id', 'nama', 'slug', 'display_name']);
                  }]);
            },
            'jabatan' => fn($q) => $q->select(['id', 'nama', 'slug']),
        ]);
    }

    public function scopeWithCounts(Builder $query): Builder
    {
        return $query->withCount([
            'attendances as total_kehadiran',
            'certificates as total_sertifikat',
        ]);
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->is_active ? 'Aktif' : 'Tidak Aktif';
    }

    public function getStatusBadgeAttribute(): string
    {
        return $this->is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600';
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->nama} ({$this->no_anggota})";
    }

    public function getOrganizationNameAttribute(): string
    {
        return $this->organization?->nama ?? '-';
    }

    public function getJabatanNameAttribute(): string
    {
        return $this->jabatan?->nama ?? '-';
    }
}