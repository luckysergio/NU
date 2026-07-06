<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'role_id',
        'organization_id',
        'name',
        'email',
        'phone',
        'password',
        'foto',
        'is_active',
        'is_blocked',
        'can_login',
        'blocked_at',
        'last_login_at',
        'last_login_ip',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'blocked_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'is_blocked' => 'boolean',
        'can_login' => 'boolean',
    ];

    // =========================================================================
    // JWT RELATIONSHIPS & CLAIMS
    // =========================================================================

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->roleSlug(),
            'organization_id' => $this->organization_id
        ];
    }

    // =========================================================================
    // RELATIONSHIPS
    // =========================================================================

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function loginLogs(): HasMany
    {
        return $this->hasMany(LoginLog::class);
    }

    public function devices(): HasMany
    {
        return $this->hasMany(UserDevice::class);
    }

    public function recordedAttendances(): HasMany
    {
        return $this->hasMany(ActivityAttendance::class, 'recorded_by');
    }

    // =========================================================================
    // ROLES & ACCESS HELPER METHODS (Optimized to prevent N+1 queries)
    // =========================================================================

    public function roleSlug(): ?string
    {
        // Gunakan relation loaded check untuk menghindari query berulang
        return $this->relationLoaded('role') ? $this->role?->slug : $this->role()->value('slug');
    }

    public function isSuperAdmin(): bool
    {
        return $this->roleSlug() === 'super-admin';
    }

    public function isAdmin(): bool
    {
        return $this->roleSlug() === 'admin';
    }

    public function isOperator(): bool
    {
        return $this->roleSlug() === 'operator';
    }

    public function isAnggota(): bool
    {
        return $this->roleSlug() === 'anggota';
    }

    public function organizationLevel(): ?string
    {
        if (!$this->organization_id) {
            return null;
        }
        return $this->organization?->level?->slug;
    }

    public function isPC(): bool
    {
        return $this->organizationLevel() === 'pc';
    }

    public function isMWC(): bool
    {
        return $this->organizationLevel() === 'mwc';
    }

    public function isRanting(): bool
    {
        return $this->organizationLevel() === 'ranting';
    }

    public function isAnakRanting(): bool
    {
        return $this->organizationLevel() === 'anak-ranting';
    }

    public function isLembaga(): bool
    {
        return $this->organizationLevel() === 'lembaga';
    }

    public function isBanom(): bool
    {
        return $this->organizationLevel() === 'banom';
    }

    /**
     * Get accessible organization IDs based on user role
     */
    public function getAccessibleOrganizationIds(): ?array
    {
        if ($this->isSuperAdmin()) {
            return null;
        }

        if (!$this->organization_id) {
            return [];
        }

        // Admin tingkat struktural (PC, MWC, Ranting) dapat mengakses seluruh turunan/descendants nya
        if ($this->isAdmin() && in_array($this->organizationLevel(), ['pc', 'mwc', 'ranting'])) {
            return $this->organization?->getAllDescendantIds() ?? [$this->organization_id];
        }

        // Anak Ranting, Lembaga, Banom, Operator, atau role struktural default: Hanya lingkup organisasinya sendiri
        return [$this->organization_id];
    }

    public function canAccessOrganization(?Organization $organization): bool
    {
        if (!$organization) {
            return false;
        }

        if ($this->isSuperAdmin()) {
            return true;
        }

        return $this->canAccessOrganizationId($organization->id);
    }

    public function canAccessOrganizationId(int $organizationId): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $accessibleIds = $this->getAccessibleOrganizationIds();
        
        if ($accessibleIds === null) {
            return true;
        }

        return in_array($organizationId, $accessibleIds);
    }

    public function getPcId(): ?int
    {
        if ($this->isSuperAdmin() || !$this->organization_id) {
            return null;
        }

        if ($this->isPC()) {
            return $this->organization_id;
        }

        return $this->organization?->getPc()?->id;
    }

    public function canCreate(): bool
    {
        return $this->isSuperAdmin() || $this->isAdmin() || $this->isOperator();
    }

    public function canEdit(): bool
    {
        return $this->isSuperAdmin() || $this->isAdmin();
    }

    public function canDelete(): bool
    {
        return $this->isSuperAdmin() || $this->isAdmin();
    }

    public function canViewLogs(): bool
    {
        return $this->isSuperAdmin();
    }

    public function canLogin(): bool
    {
        return $this->can_login && !$this->is_blocked && $this->is_active;
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (empty($search)) {
            return $query;
        }
        
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'LIKE', "%{$search}%")
              ->orWhere('email', 'LIKE', "%{$search}%")
              ->orWhere('phone', 'LIKE', "%{$search}%");
        });
    }

    public function scopeByRole(Builder $query, string $roleSlug): Builder
    {
        return $query->whereHas('role', fn($q) => $q->where('slug', $roleSlug));
    }

    public function scopeByOrganization(Builder $query, int $organizationId): Builder
    {
        return $query->where('organization_id', $organizationId);
    }

    // =========================================================================
    // ACCESSORS (CUSTOM ATTRIBUTES)
    // =========================================================================

    public function getFullNameAttribute(): string
    {
        return $this->name;
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->is_active ? 'Aktif' : 'Tidak Aktif';
    }

    public function getRoleNameAttribute(): string
    {
        return $this->role?->nama ?? '-';
    }

    public function getOrganizationNameAttribute(): string
    {
        return $this->organization?->nama ?? '-';
    }
}