<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class OrganizationLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama',
        'slug',
        'urutan',
    ];

    public function organizations()
    {
        return $this->hasMany(Organization::class);
    }
}