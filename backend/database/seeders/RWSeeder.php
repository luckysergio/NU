<?php

namespace Database\Seeders;

use App\Models\RW;
use App\Models\Kelurahan;
use Illuminate\Database\Seeder;

class RWSeeder extends Seeder
{
    public function run(): void
    {
        $data = [

            // TANGERANG
            'Cikokol' => 15,
            'Sukasari' => 16,
            'Tanah Tinggi' => 16,
            'Buaran Indah' => 9,
            'Babakan' => 8,
            'Kelapa Indah' => 7,
            'Sukarasa' => 5,
            'Suka Asih' => 4,

            // LARANGAN
            'Larangan Selatan' => 15,
            'Gaga' => 15,
            'Larangan Utara' => 13,
            'Kreo' => 13,
            'Larangan Indah' => 10,
            'Cipadu Jaya' => 9,
            'Cipadu' => 8,
            'Kreo Selatan' => 8,

            // KARANG TENGAH
            'Karang Tengah' => 16,
            'Karang Timur' => 14,
            'Karang Mulya' => 13,
            'Pedurenan' => 12,
            'Pondok Bahar' => 7,
            'Pondok Pucung' => 7,
            'Parung Jaya' => 5,

            // CILEDUG
            'Sudimara Barat' => 15,
            'Sudimara Selatan' => 12,
            'Sudimara Jaya' => 12,
            'Sudimara Timur' => 14,
            'Paninggilan' => 14,
            'Paninggilan Utara' => 13,
            'Parung Serab' => 11,
            'Tajur' => 14,

            // PINANG
            'Kunciran Indah' => 15,
            'Kunciran' => 10,
            'Pinang' => 8,
            'Panunggangan' => 7,
            'Panunggangan Timur' => 7,
            'Panunggangan Utara' => 6,
            'Sudimara Pinang' => 6,
            'Neroktog' => 6,
            'Kunciran Jaya' => 5,
            'Cipete' => 5,
            'Pakojan' => 4,

            // CIPONDOH
            'Cipondoh' => 16,
            'Cipondoh Indah' => 11,
            'Cipondoh Makmur' => 9,
            'Gondrong' => 10,
            'Kenanga' => 9,
            'Ketapang' => 7,
            'Petir' => 11,
            'Poris Plawad' => 11,
            'Poris Plawad Indah' => 12,
            'Poris Plawad Utara' => 8,

            // KARAWACI
            'Karawaci Baru' => 14,
            'Cimone' => 8,
            'Cimone Jaya' => 8,
            'Pabuaran' => 7,
            'Pabuaran Tumpeng' => 9,
            'Bugel' => 7,
            'Gerendeng' => 6,
            'Suka Jadi' => 6,
            'Pasar Baru' => 7,
            'Margasari' => 11,
            'Nambo Jaya' => 6,
            'Karawaci' => 9,
            'Koang Jaya' => 4,
            'Sumur Pacing' => 6,

            // CIBODAS
            'Cibodas Baru' => 23,
            'Cibodasari' => 19,
            'Cibodas' => 14,
            'Jatiuwung' => 11,
            'Panunggangan Barat' => 12,
            'Uwung Jaya' => 12,

            // JATIUWUNG
            'Alam Jaya' => 8,
            'Gandasari' => 7,
            'Jatake' => 7,
            'Keroncong' => 7,
            'Manis Jaya' => 6,
            'Pasir Jaya' => 6,

            // PERIUK
            'Gebang Raya' => 25,
            'Sangiang Jaya' => 14,
            'Gembor' => 12,
            'Periuk' => 13,
            'Periuk Jaya' => 8,

            // BATUCEPER
            'Batuceper' => 8,
            'Batujaya' => 7,
            'Batusari' => 6,
            'Kebon Besar' => 8,
            'Poris Gaga' => 7,
            'Poris Gaga Baru' => 6,
            'Poris Jaya' => 5,

            // BENDA
            'Belendung' => 11,
            'Benda' => 9,
            'Jurumudi' => 8,
            'Jurumudi Baru' => 7,
            'Pajang' => 5,

            // NEGLASARI
            'Karang Anyar' => 9,
            'Karang Sari' => 9,
            'Kedaung Baru' => 4,
            'Kedaung Wetan' => 8,
            'Mekarsari' => 7,
            'Neglasari' => 7,
            'Selapajang Jaya' => 6,
        ];

        foreach ($data as $kelurahanNama => $jumlahRW) {

            $kelurahan = Kelurahan::where(
                'nama',
                $kelurahanNama
            )->first();

            if (!$kelurahan) {
                continue;
            }

            for ($i = 1; $i <= $jumlahRW; $i++) {

                RW::updateOrCreate(
                    [
                        'kelurahan_id' => $kelurahan->id,
                        'nomor' => str_pad(
                            $i,
                            3,
                            '0',
                            STR_PAD_LEFT
                        ),
                    ],
                    [
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
