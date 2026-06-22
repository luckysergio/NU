<?php

namespace Database\Seeders;

use App\Models\Kelurahan;
use App\Models\Kecamatan;
use Illuminate\Database\Seeder;

class KelurahanSeeder extends Seeder
{
    public function run(): void
    {
        $data = [

            /*
            |--------------------------------------------------------------------------
            | BATUCEPER
            |--------------------------------------------------------------------------
            */

            'Batuceper' => [
                'Batuceper',
                'Batujaya',
                'Batusari',
                'Kebon Besar',
                'Poris Gaga',
                'Poris Gaga Baru',
                'Poris Jaya',
            ],

            /*
            |--------------------------------------------------------------------------
            | BENDA
            |--------------------------------------------------------------------------
            */

            'Benda' => [
                'Belendung',
                'Benda',
                'Jurumudi',
                'Jurumudi Baru',
                'Pajang',
            ],

            /*
            |--------------------------------------------------------------------------
            | CIBODAS
            |--------------------------------------------------------------------------
            */

            'Cibodas' => [
                'Cibodas',
                'Cibodas Baru',
                'Cibodasari',
                'Jatiuwung',
                'Panunggangan Barat',
                'Uwung Jaya',
            ],

            /*
            |--------------------------------------------------------------------------
            | CILEDUG
            |--------------------------------------------------------------------------
            */

            'Ciledug' => [
                'Paninggilan',
                'Paninggilan Utara',
                'Parung Serab',
                'Sudimara Barat',
                'Sudimara Jaya',
                'Sudimara Selatan',
                'Sudimara Timur',
                'Tajur',
            ],

            /*
            |--------------------------------------------------------------------------
            | CIPONDOH
            |--------------------------------------------------------------------------
            */

            'Cipondoh' => [
                'Cipondoh',
                'Cipondoh Indah',
                'Cipondoh Makmur',
                'Gondrong',
                'Kenanga',
                'Ketapang',
                'Petir',
                'Poris Plawad',
                'Poris Plawad Indah',
                'Poris Plawad Utara',
            ],

            /*
            |--------------------------------------------------------------------------
            | JATIUWUNG
            |--------------------------------------------------------------------------
            */

            'Jatiuwung' => [
                'Alam Jaya',
                'Gandasari',
                'Jatake',
                'Keroncong',
                'Manis Jaya',
                'Pasir Jaya',
            ],

            /*
            |--------------------------------------------------------------------------
            | KARANG TENGAH
            |--------------------------------------------------------------------------
            */

            'Karang Tengah' => [
                'Karang Mulya',
                'Karang Tengah',
                'Karang Timur',
                'Parung Jaya',
                'Pedurenan',
                'Pondok Bahar',
                'Pondok Pucung',
            ],

            /*
            |--------------------------------------------------------------------------
            | KARAWACI
            |--------------------------------------------------------------------------
            */

            'Karawaci' => [
                'Bugel',
                'Cimone',
                'Cimone Jaya',
                'Gerendeng',
                'Karawaci',
                'Karawaci Baru',
                'Koang Jaya',
                'Margasari',
                'Nambo Jaya',
                'Pabuaran',
                'Pabuaran Tumpeng',
                'Pasar Baru',
                'Suka Jadi',
                'Sumur Pacing',
                'Tanah Tinggi',
                'Tangerang Barat',
            ],

            /*
            |--------------------------------------------------------------------------
            | LARANGAN
            |--------------------------------------------------------------------------
            */

            'Larangan' => [
                'Cipadu',
                'Cipadu Jaya',
                'Gaga',
                'Kreo',
                'Kreo Selatan',
                'Larangan Indah',
                'Larangan Selatan',
                'Larangan Utara',
            ],

            /*
            |--------------------------------------------------------------------------
            | NEGLASARI
            |--------------------------------------------------------------------------
            */

            'Neglasari' => [
                'Karang Anyar',
                'Karang Sari',
                'Kedaung Baru',
                'Kedaung Wetan',
                'Mekarsari',
                'Neglasari',
                'Selapajang Jaya',
            ],

            /*
            |--------------------------------------------------------------------------
            | PERIUK
            |--------------------------------------------------------------------------
            */

            'Periuk' => [
                'Gebang Raya',
                'Gembor',
                'Periuk',
                'Periuk Jaya',
                'Sangiang Jaya',
            ],

            /*
            |--------------------------------------------------------------------------
            | PINANG
            |--------------------------------------------------------------------------
            */

            'Pinang' => [
                'Cipete',
                'Kunciran',
                'Kunciran Indah',
                'Kunciran Jaya',
                'Neroktog',
                'Pakojan',
                'Panunggangan',
                'Panunggangan Timur',
                'Panunggangan Utara',
                'Pinang',
                'Sudimara Pinang',
            ],

            /*
            |--------------------------------------------------------------------------
            | TANGERANG
            |--------------------------------------------------------------------------
            */

            'Tangerang' => [
                'Babakan',
                'Buaran Indah',
                'Cikokol',
                'Kelapa Indah',
                'Suka Asih',
                'Sukarasa',
                'Sukasari',
                'Tanah Tinggi',
            ],

        ];

        foreach ($data as $namaKecamatan => $kelurahans) {

            $kecamatan = Kecamatan::where('nama', $namaKecamatan)->first();

            foreach ($kelurahans as $index => $namaKelurahan) {

                Kelurahan::create([
                    'kecamatan_id' => $kecamatan->id,
                    'nama' => $namaKelurahan,
                    'kode' => $kecamatan->kode . str_pad($index + 1, 2, '0', STR_PAD_LEFT),
                    'is_active' => true,
                ]);
            }
        }
    }
}