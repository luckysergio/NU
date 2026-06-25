<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [

        /*
        |--------------------------------------------------------------------------
        | Relations
        |--------------------------------------------------------------------------
        */

        'role_id',
        'organization_id',

        /*
        |--------------------------------------------------------------------------
        | Basic
        |--------------------------------------------------------------------------
        */

        'name',
        'email',
        'phone',
        'password',

        /*
        |--------------------------------------------------------------------------
        | Security
        |--------------------------------------------------------------------------
        */

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

    protected function casts(): array
    {
        return [

            'email_verified_at' => 'datetime',

            'last_login_at' => 'datetime',

            'blocked_at' => 'datetime',

            'password' => 'hashed',

            'is_active' => 'boolean',

            'is_blocked' => 'boolean',

            'can_login' => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | JWT
    |--------------------------------------------------------------------------
    */

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Role Helpers
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Organization Helpers
    |--------------------------------------------------------------------------
    */

    public function organizationLevel(): ?string
    {
        return $this->organization?->level?->slug;
    }

    public function organizationLevelOrder(): int
    {
        return match ($this->organizationLevel()) {

            'pc'       => 1,
            'mwc'      => 2,
            'ranting'  => 3,
            'lembaga'  => 4,
            'banom'    => 5,

            default    => 999,
        };
    }

    /**
     * Get the PC (Pimpinan Cabang) organization ID for the user
     * This will traverse up the organization hierarchy to find the PC level
     */
    public function getPcId(): ?int
    {
        // Super admin tidak memiliki PC ID
        if ($this->isSuperAdmin()) {
            return null;
        }

        // Jika user tidak memiliki organisasi
        if (!$this->organization) {
            return null;
        }

        // Jika organisasi user sudah level PC, return ID-nya
        if ($this->isPC()) {
            return $this->organization->id;
        }

        // Jika organisasi user adalah MWC atau di bawahnya, cari parent PC
        // Asumsi: struktur organisasi berjenjang dan PC adalah root untuk cabang tertentu
        $pc = $this->organization->getPc();
        
        return $pc?->id;
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

    public function isLembaga(): bool
    {
        return $this->organizationLevel() === 'lembaga';
    }

    public function isBanom(): bool
    {
        return $this->organizationLevel() === 'banom';
    }

    /*
    |--------------------------------------------------------------------------
    | Hierarchy Access Helpers
    |--------------------------------------------------------------------------
    */

    public function canAccessOrganization(
        ?Organization $organization
    ): bool {

        if (!$organization) {
            return false;
        }

        /*
        |--------------------------------------------------------------------------
        | SUPER ADMIN
        |--------------------------------------------------------------------------
        */

        if ($this->isSuperAdmin()) {
            return true;
        }

        /*
        |--------------------------------------------------------------------------
        | USER ORGANIZATION
        |--------------------------------------------------------------------------
        */

        if (!$this->organization) {
            return false;
        }

        /*
        |--------------------------------------------------------------------------
        | SAME ORGANIZATION
        |--------------------------------------------------------------------------
        */

        if (
            $this->organization->id ===
            $organization->id
        ) {
            return true;
        }

        /*
        |--------------------------------------------------------------------------
        | PC
        | PC dapat akses semua dibawahnya
        |--------------------------------------------------------------------------
        */

        if ($this->isPC()) {

            return $organization->isDescendantOf(
                $this->organization->id
            );
        }

        /*
        |--------------------------------------------------------------------------
        | MWC
        | MWC dapat akses ranting dibawahnya
        |--------------------------------------------------------------------------
        */

        if ($this->isMWC()) {

            return $organization->isDescendantOf(
                $this->organization->id
            );
        }

        /*
        |--------------------------------------------------------------------------
        | RANTING
        |--------------------------------------------------------------------------
        */

        if ($this->isRanting()) {

            return false;
        }

        /*
        |--------------------------------------------------------------------------
        | LEMBAGA / BANOM
        |--------------------------------------------------------------------------
        */

        if (
            $this->isLembaga() ||
            $this->isBanom()
        ) {

            return false;
        }

        return false;
    }

    /*
    |--------------------------------------------------------------------------
    | Permission Helpers
    |--------------------------------------------------------------------------
    */

    public function canView(): bool
    {
        return true;
    }

    public function canCreate(): bool
    {
        return
            $this->isSuperAdmin()
            || $this->isAdmin()
            || $this->isOperator();
    }

    public function canEdit(): bool
    {
        return
            $this->isSuperAdmin()
            || $this->isAdmin();
    }

    public function canDelete(): bool
    {
        return
            $this->isSuperAdmin()
            || $this->isAdmin();
    }

    public function canViewLogs(): bool
    {
        return $this->isSuperAdmin();
    }

    public function canViewDevices(): bool
    {
        return $this->isSuperAdmin();
    }

    /*
    |--------------------------------------------------------------------------
    | Security Helpers
    |--------------------------------------------------------------------------
    */

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
        return
            $this->can_login
            && !$this->is_blocked
            && $this->is_active;
    }

    public function recordedAttendances()
{
    return $this->hasMany(
        ActivityAttendance::class,
        'recorded_by'
    );
}
}