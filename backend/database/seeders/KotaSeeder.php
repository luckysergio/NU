<?php

namespace Database\Seeders;

use App\Models\Kota;
use Illuminate\Database\Seeder;

class KotaSeeder extends Seeder
{
    public function run(): void
    {
        Kota::create([
            'nama' => 'Kota Tangerang',
            'kode' => '3671',
            'is_active' => true,
        ]);
    }
}