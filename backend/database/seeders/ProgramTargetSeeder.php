<?php

namespace Database\Seeders;

use App\Models\ProgramTarget;
use Illuminate\Database\Seeder;

class ProgramTargetSeeder extends Seeder
{
    public function run(): void
    {
        $targets = [

            'Pengurus NU',
            'Banom NU',
            'Lembaga NU',
            'Kader NU',
            'Anggota NU',
            'Santri',
            'Pelajar',
            'Mahasiswa',
            'Guru dan Tenaga Pendidikan',
            'Tokoh Agama',
            'Masyarakat Umum',
            'Pelaku UMKM',
            'Petani',
            'Nelayan',
            'Perempuan',
            'Pemuda',
            'Anak-anak',
            'Kelompok Rentan',
        ];

        foreach ($targets as $target) {

            ProgramTarget::updateOrCreate(
                ['nama' => $target],
                ['is_active' => true]
            );
        }
    }
}