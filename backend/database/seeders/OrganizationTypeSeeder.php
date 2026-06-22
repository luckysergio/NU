<?php

namespace Database\Seeders;

use App\Models\OrganizationLevel;
use App\Models\OrganizationType;
use Illuminate\Database\Seeder;

class OrganizationTypeSeeder extends Seeder
{
    public function run(): void
    {
        $lembagaLevel = OrganizationLevel::where(
            'slug',
            'lembaga'
        )->firstOrFail();

        $banomLevel = OrganizationLevel::where(
            'slug',
            'banom'
        )->firstOrFail();

        /*
        |--------------------------------------------------------------------------
        | LEMBAGA NU
        |--------------------------------------------------------------------------
        */

        $lembagas = [

            [
                'nama' => 'Lembaga Dakwah Nahdlatul Ulama',
                'slug' => 'ldnu',
                'deskripsi' => 'Bidang dakwah dan pengembangan umat',
            ],

            [
                'nama' => 'Lembaga Pendidikan Ma’arif NU',
                'slug' => 'lp-marif-nu',
                'deskripsi' => 'Bidang pendidikan formal dan non formal',
            ],

            [
                'nama' => 'Lembaga Bahtsul Masail NU',
                'slug' => 'lbmnu',
                'deskripsi' => 'Kajian hukum dan keagamaan',
            ],

            [
                'nama' => 'Lembaga Kesehatan NU',
                'slug' => 'lknu',
                'deskripsi' => 'Bidang kesehatan warga NU',
            ],

            [
                'nama' => 'Lembaga Perekonomian NU',
                'slug' => 'lpnu',
                'deskripsi' => 'Pengembangan ekonomi umat',
            ],

            [
                'nama' => 'Lembaga Wakaf dan Pertanahan NU',
                'slug' => 'lwpnu',
                'deskripsi' => 'Pengelolaan wakaf dan aset',
            ],

            [
                'nama' => 'Lembaga Amil Zakat Infaq dan Sedekah NU',
                'slug' => 'lazisnu',
                'deskripsi' => 'Pengelolaan zakat dan sedekah',
            ],

            [
                'nama' => 'Lembaga Ta’lif wan Nasyr NU',
                'slug' => 'ltnnu',
                'deskripsi' => 'Publikasi dan media NU',
            ],

            [
                'nama' => 'Lembaga Seni Budaya Muslimin Indonesia',
                'slug' => 'lesbumi',
                'deskripsi' => 'Pengembangan seni dan budaya',
            ],

            [
                'nama' => 'Lembaga Kemaslahatan Keluarga NU',
                'slug' => 'lkknu',
                'deskripsi' => 'Bidang keluarga dan sosial',
            ],

            [
                'nama' => 'Lembaga Penyuluhan dan Bantuan Hukum NU',
                'slug' => 'lpbhnu',
                'deskripsi' => 'Pendampingan hukum masyarakat',
            ],

            [
                'nama' => 'Lembaga Penanggulangan Bencana dan Perubahan Iklim NU',
                'slug' => 'lpbinu',
                'deskripsi' => 'Bidang kebencanaan dan lingkungan',
            ],

            [
                'nama' => 'Lembaga Falakiyah NU',
                'slug' => 'lfnu',
                'deskripsi' => 'Kajian falak dan astronomi Islam',
            ],

            [
                'nama' => 'Lembaga Pertanian NU',
                'slug' => 'lpn',
                'deskripsi' => 'Pengembangan pertanian warga',
            ],

            [
                'nama' => 'Lembaga Pendidikan Tinggi NU',
                'slug' => 'lptnu',
                'deskripsi' => 'Koordinasi perguruan tinggi NU',
            ],
        ];

        foreach ($lembagas as $item) {

            OrganizationType::updateOrCreate(
                [
                    'slug' => $item['slug'],
                ],
                [
                    'organization_level_id' => $lembagaLevel->id,
                    'nama' => $item['nama'],
                    'deskripsi' => $item['deskripsi'],
                    'is_active' => true,
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | BANOM NU
        |--------------------------------------------------------------------------
        */

        $banoms = [

            [
                'nama' => 'Gerakan Pemuda Ansor',
                'slug' => 'gp-ansor',
                'deskripsi' => 'Organisasi kepemudaan NU',
            ],

            [
                'nama' => 'Barisan Ansor Serbaguna',
                'slug' => 'banser',
                'deskripsi' => 'Satuan semi otonom GP Ansor',
            ],

            [
                'nama' => 'Muslimat NU',
                'slug' => 'muslimat-nu',
                'deskripsi' => 'Badan otonom perempuan NU',
            ],

            [
                'nama' => 'Fatayat NU',
                'slug' => 'fatayat-nu',
                'deskripsi' => 'Organisasi perempuan muda NU',
            ],

            [
                'nama' => 'Ikatan Pelajar Nahdlatul Ulama',
                'slug' => 'ipnu',
                'deskripsi' => 'Organisasi pelajar NU',
            ],

            [
                'nama' => 'Ikatan Pelajar Putri Nahdlatul Ulama',
                'slug' => 'ippnu',
                'deskripsi' => 'Organisasi pelajar putri NU',
            ],

            [
                'nama' => 'Pergerakan Mahasiswa Islam Indonesia',
                'slug' => 'pmii',
                'deskripsi' => 'Organisasi mahasiswa NU',
            ],

            [
                'nama' => 'Ikatan Sarjana Nahdlatul Ulama',
                'slug' => 'isnu',
                'deskripsi' => 'Organisasi sarjana NU',
            ],

            [
                'nama' => 'Jam’iyyah Ahlith Thariqah Al-Mu’tabarah An-Nahdliyah',
                'slug' => 'jatman',
                'deskripsi' => 'Organisasi tarekat NU',
            ],

            [
                'nama' => 'Persatuan Guru Nahdlatul Ulama',
                'slug' => 'pergunu',
                'deskripsi' => 'Organisasi guru NU',
            ],

            [
                'nama' => 'Serikat Buruh Muslimin Indonesia',
                'slug' => 'sarbumusi',
                'deskripsi' => 'Organisasi buruh NU',
            ],

            [
                'nama' => 'Pagar Nusa',
                'slug' => 'pagar-nusa',
                'deskripsi' => 'Perguruan pencak silat NU',
            ],
        ];

        foreach ($banoms as $item) {

            OrganizationType::updateOrCreate(
                [
                    'slug' => $item['slug'],
                ],
                [
                    'organization_level_id' => $banomLevel->id,
                    'nama' => $item['nama'],
                    'deskripsi' => $item['deskripsi'],
                    'is_active' => true,
                ]
            );
        }
    }
}