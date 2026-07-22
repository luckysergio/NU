<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;

class Jabatan extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama',
        'slug',
        'deskripsi',
        'level',
        'levels',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'levels' => 'array',
    ];

    public function anggotas()
    {
        return $this->hasMany(Anggota::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeByLevel(Builder $query, string $level): Builder
    {
        return $query->where(function ($q) use ($level) {
            $q->where('level', $level)
              ->orWhereJsonContains('levels', $level);
        });
    }

    public function scopeByLevels(Builder $query, array $levels): Builder
    {
        return $query->where(function ($q) use ($levels) {
            $q->whereIn('level', $levels)
              ->orWhere(function ($sub) use ($levels) {
                  foreach ($levels as $level) {
                      $sub->orWhereJsonContains('levels', $level);
                  }
              });
        });
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (empty($search)) {
            return $query;
        }

        $search = strtolower($search);
        
        return $query->where(function ($q) use ($search) {
            $q->whereRaw('LOWER(nama) LIKE ?', ["%{$search}%"])
                ->orWhereRaw('LOWER(slug) LIKE ?', ["%{$search}%"])
                ->orWhereRaw('LOWER(deskripsi) LIKE ?', ["%{$search}%"]);
        });
    }

    public function scopeBySlug(Builder $query, string $slug): Builder
    {
        return $query->where('slug', $slug);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('nama', 'asc');
    }

    public function getFormattedNameAttribute(): string
    {
        return ucwords(str_replace('-', ' ', $this->nama));
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->is_active ? 'Aktif' : 'Tidak Aktif';
    }

    public function getStatusBadgeAttribute(): string
    {
        return $this->is_active 
            ? 'bg-emerald-100 text-emerald-700' 
            : 'bg-gray-100 text-gray-600';
    }

    public function getLevelDisplayAttribute(): string
    {
        $levels = [
            'pc' => 'PCNU',
            'mwc' => 'MWCNU',
            'ranting' => 'RANTING',
            'anak-ranting' => 'ANAK RANTING',
            'lembaga' => 'LEMBAGA',
            'banom' => 'BANOM',
        ];
        
        if ($this->level) {
            return $levels[$this->level] ?? ucfirst($this->level);
        }
        
        if ($this->levels && is_array($this->levels)) {
            $display = array_map(function($l) use ($levels) {
                return $levels[$l] ?? ucfirst($l);
            }, $this->levels);
            return implode(', ', $display);
        }
        
        return 'Semua Level';
    }
}