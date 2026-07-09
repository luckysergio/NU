<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class ProgramTheme extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'nama',
        'deskripsi',
        'tahun',
        'tanggal_mulai',
        'tanggal_selesai',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'tahun' => 'integer',
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function workPrograms(): HasMany
    {
        return $this->hasMany(WorkProgram::class, 'theme_id');
    }

    public function getStatusAttribute(): string
    {
        if (!$this->is_active) {
            return 'nonaktif';
        }

        if (!$this->tanggal_selesai) {
            return 'aktif';
        }

        return Carbon::parse($this->tanggal_selesai)->isFuture()
            || Carbon::parse($this->tanggal_selesai)->isToday()
            ? 'aktif'
            : 'expired';
    }

    public function getPeriodeLabelAttribute(): string
    {
        return "Periode {$this->tahun}";
    }

    /**
     * Scope untuk filter berdasarkan tahun
     *
     * @param Builder $query
     * @param int|null $tahun
     * @return Builder
     */
    public function scopeTahun(Builder $query, ?int $tahun): Builder
    {
        if ($tahun) {
            return $query->where('tahun', $tahun);
        }
        return $query;
    }

    /**
     * Scope untuk filter berdasarkan range tahun
     *
     * @param Builder $query
     * @param int|null $fromYear
     * @param int|null $toYear
     * @return Builder
     */
    public function scopeTahunRange(Builder $query, ?int $fromYear, ?int $toYear): Builder
    {
        if ($fromYear) {
            $query->where('tahun', '>=', $fromYear);
        }
        if ($toYear) {
            $query->where('tahun', '<=', $toYear);
        }
        return $query;
    }
}