<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Anggota extends Model
{
    use HasFactory;

    protected $table = 'anggotas';

    protected $fillable = [
        'biodata_id',
        'organization_id',
        'jabatan_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function biodata(): BelongsTo
    {
        return $this->belongsTo(Biodata::class);
    }

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

    public function scopeAccessibleByUser(Builder $query, User $user): Builder
    {
        if ($user->isSuperAdmin()) {
            return $query;
        }

        $accessibleIds = $user->getAccessibleOrganizationIds();
        
        if ($accessibleIds === null) return $query;
        if (empty($accessibleIds)) return $query->whereRaw('1 = 0');

        return $query->whereIn('anggotas.organization_id', $accessibleIds);
    }

    public function scopeByOrganization(Builder $query, int $organizationId): Builder
    {
        return $query->where('anggotas.organization_id', $organizationId);
    }

    public function scopeByLevel(Builder $query, string $levelSlug): Builder
    {
        return $query->whereHas('organization.level', fn($q) => $q->where('slug', $levelSlug));
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereHas('biodata', fn($q) => $q->where('is_active', true));
    }

    public function scopeByJabatan(Builder $query, int $jabatanId): Builder
    {
        return $query->where('anggotas.jabatan_id', $jabatanId);
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (empty($search)) return $query;
        
        return $query->whereHas('biodata', function ($q) use ($search) {
            $q->where('nama', 'LIKE', "%{$search}%")
              ->orWhere('no_anggota', 'LIKE', "%{$search}%")
              ->orWhere('deskripsi', 'LIKE', "%{$search}%");
        });
    }

    public function scopeByJenisKelamin(Builder $query, string $jenisKelamin): Builder
    {
        return $query->whereHas('biodata', fn($q) => $q->where('jenis_kelamin', $jenisKelamin));
    }

    public function scopeByStatusPerkawinan(Builder $query, string $statusPerkawinan): Builder
    {
        return $query->whereHas('biodata', fn($q) => $q->where('status_perkawinan', $statusPerkawinan));
    }

    public function scopeByPendidikan(Builder $query, string $pendidikan): Builder
    {
        return $query->whereHas('biodata', fn($q) => $q->where('pendidikan', $pendidikan));
    }

    public function scopeWithRelations(Builder $query): Builder
    {
        return $query->with([
            'biodata' => fn($q) => $q->select([
                'id', 
                'no_anggota', 
                'nama', 
                'no_hp', 
                'foto', 
                'is_active', 
                'tempat_lahir', 
                'tanggal_lahir',
                'jenis_kelamin',
                'status_perkawinan',
                'pendidikan',   
                'alamat',       
                'deskripsi'     
            ]),
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
        ]);
    }

    public function getNoAnggotaAttribute(): ?string { return $this->biodata?->no_anggota; }
    public function getNamaAttribute(): ?string { return $this->biodata?->nama; }
    public function getNoHpAttribute(): ?string { return $this->biodata?->no_hp; }
    public function getJenisKelaminAttribute(): ?string { return $this->biodata?->jenis_kelamin; }
    public function getStatusPerkawinanAttribute(): ?string { return $this->biodata?->status_perkawinan; }
    public function getPendidikanAttribute(): ?string { return $this->biodata?->pendidikan; }
    public function getAlamatAttribute(): ?string { return $this->biodata?->alamat; }
    public function getDeskripsiAttribute(): ?string { return $this->biodata?->deskripsi; }
    public function getFotoAttribute(): ?string { return $this->biodata?->foto; }
    public function getTempatLahirAttribute(): ?string { return $this->biodata?->tempat_lahir; }
    public function getTanggalLahirAttribute(): ?string { return $this->biodata?->tanggal_lahir ? $this->biodata->tanggal_lahir->format('Y-m-d') : null; }
    public function getIsActiveAttribute(): ?bool { return $this->biodata?->is_active; }

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