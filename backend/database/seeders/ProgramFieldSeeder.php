<?php

namespace Database\Seeders;

use App\Models\ProgramField;
use Illuminate\Database\Seeder;

class ProgramFieldSeeder extends Seeder
{
    public function run(): void
    {
        $fields = [

            'Keagamaan',
            'Pendidikan',
            'Dakwah',
            'Kesehatan',
            'Ekonomi Umat',
            'Sosial Kemasyarakatan',
            'Kepemudaan',
            'Pemberdayaan Perempuan',
            'Kaderisasi',
            'Teknologi dan Informasi',
            'Lingkungan Hidup',
            'Kebencanaan',
            'Pertanian dan Ketahanan Pangan',
            'Hubungan Antar Lembaga',
            'Seni dan Budaya Islam',
            'Hukum dan Advokasi',
            'Penguatan Organisasi',
            'Pengembangan SDM',
            'Keuangan dan Kemandirian Organisasi',
            'Publikasi dan Media',
        ];

        foreach ($fields as $field) {

            ProgramField::updateOrCreate(
                ['nama' => $field],
                ['is_active' => true]
            );
        }
    }
}