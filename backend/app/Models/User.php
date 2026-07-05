<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
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

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function loginLogs()
    {
        return $this->hasMany(LoginLog::class);
    }

    public function devices()
    {
        return $this->hasMany(UserDevice::class);
    }

    public function recordedAttendances()
    {
        return $this->hasMany(ActivityAttendance::class, 'recorded_by');
    }

    public function roleSlug(): ?string
    {
        return $this->role?->slug;
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
     * 
     * @return array|null Array of organization IDs, or null if Super Admin (can access all)
     */
    public function getAccessibleOrganizationIds(): ?array
    {
        // Super Admin: null berarti bisa mengakses semua
        if ($this->isSuperAdmin()) {
            return null;
        }

        // Admin PC: akses semua data di bawah PC
        if ($this->isPC() && $this->isAdmin()) {
            return $this->organization?->getAllDescendantIds() ?? [];
        }

        // Admin MWC: akses MWC, Ranting, Anak Ranting, Lembaga
        if ($this->isMWC() && $this->isAdmin()) {
            return $this->organization?->getAllDescendantIds() ?? [];
        }

        // Admin Ranting: akses Ranting dan Anak Ranting
        if ($this->isRanting() && $this->isAdmin()) {
            return $this->organization?->getAllDescendantIds() ?? [];
        }

        // Admin Anak Ranting: akses hanya Anak Ranting sendiri
        if ($this->isAnakRanting() && $this->isAdmin()) {
            return [$this->organization_id];
        }

        // Lembaga: akses hanya Lembaga sendiri
        if ($this->isLembaga() && $this->isAdmin()) {
            return [$this->organization_id];
        }

        // Banom: akses hanya Banom sendiri
        if ($this->isBanom() && $this->isAdmin()) {
            return [$this->organization_id];
        }

        // Operator atau role lain: akses hanya organisasi sendiri
        return [$this->organization_id];
    }

    /**
     * Check if user can access a specific organization
     */
    public function canAccessOrganization(?Organization $organization): bool
    {
        if (!$organization) {
            return false;
        }

        if ($this->isSuperAdmin()) {
            return true;
        }

        if (!$this->organization) {
            return false;
        }

        $accessibleIds = $this->getAccessibleOrganizationIds();
        
        // Jika null berarti Super Admin (sudah dihandle di atas)
        if ($accessibleIds === null) {
            return true;
        }

        return in_array($organization->id, $accessibleIds);
    }

    /**
     * Check if user can access a specific organization by ID
     */
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
        if ($this->isSuperAdmin()) {
            return null;
        }

        if (!$this->organization) {
            return null;
        }

        if ($this->isPC()) {
            return $this->organization->id;
        }

        $pc = $this->organization->getPc();
        return $pc?->id;
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

    public function isBlocked(): bool
    {
        return $this->is_blocked;
    }

    public function isActive(): bool
    {
        return $this->is_active;
    }

    public function canLogin(): bool
    {
        return $this->can_login && !$this->is_blocked && $this->is_active;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        if (empty($search)) return $query;
        
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