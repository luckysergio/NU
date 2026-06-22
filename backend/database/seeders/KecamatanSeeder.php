<?php

namespace Database\Seeders;

use App\Models\Kecamatan;
use App\Models\Kota;
use Illuminate\Database\Seeder;

class KecamatanSeeder extends Seeder
{
    public function run(): void
    {
        $kota = Kota::first();

        $data = [

            'Batuceper',
            'Benda',
            'Cibodas',
            'Ciledug',
            'Cipondoh',
            'Jatiuwung',
            'Karang Tengah',
            'Karawaci',
            'Larangan',
            'Neglasari',
            'Periuk',
            'Pinang',
            'Tangerang',

        ];

        foreach ($data as $index => $nama) {

            Kecamatan::create([
                'kota_id' => $kota->id,
                'nama' => $nama,
                'kode' => '3671' . str_pad($index + 1, 2, '0', STR_PAD_LEFT),
                'is_active' => true,
            ]);
        }
    }
}