<?php
// database/seeders/JabatanSeeder.php

namespace Database\Seeders;

use App\Models\Jabatan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class JabatanSeeder extends Seeder
{
    public function run(): void
    {
        $jabatans = [
            // ============================================
            // STRUKTUR SYURIAH (PC, MWC, Ranting, Anak Ranting)
            // ============================================
            [
                'nama' => 'Rois Syuriah',
                'slug' => 'rois-syuriah',
                'deskripsi' => 'Pimpinan tertinggi di bidang syuriah/keagamaan',
                'level' => null,
                'levels' => ['pc', 'mwc', 'ranting', 'anak-ranting'],
                'is_active' => true,
            ],
            [
                'nama' => 'Wakil Rois',
                'slug' => 'wakil-rois',
                'deskripsi' => 'Wakil pimpinan di bidang syuriah/keagamaan',
                'level' => null,
                'levels' => ['pc', 'mwc', 'ranting', 'anak-ranting'],
                'is_active' => true,
            ],
            [
                'nama' => 'Katib Syuriah',
                'slug' => 'katib-syuriah',
                'deskripsi' => 'Sekretaris di bidang syuriah/keagamaan',
                'level' => null,
                'levels' => ['pc', 'mwc', 'ranting', 'anak-ranting'],
                'is_active' => true,
            ],
            [
                'nama' => 'Wakil Katib',
                'slug' => 'wakil-katib',
                'deskripsi' => 'Wakil sekretaris di bidang syuriah/keagamaan',
                'level' => null,
                'levels' => ['pc', 'mwc', 'ranting', 'anak-ranting'],
                'is_active' => true,
            ],
            [
                'nama' => "A'wan",
                'slug' => 'awan',
                'deskripsi' => 'Anggota di bidang syuriah/keagamaan',
                'level' => null,
                'levels' => ['pc', 'mwc', 'ranting', 'anak-ranting'],
                'is_active' => true,
            ],
            
            // ============================================
            // STRUKTUR TANFIDZIYAH (PC, MWC, Ranting, Anak Ranting)
            // ============================================
            [
                'nama' => 'Ketua Tanfidziyah',
                'slug' => 'ketua-tanfidziyah',
                'deskripsi' => 'Pimpinan tertinggi di bidang eksekutif/organisasi',
                'level' => null,
                'levels' => ['pc', 'mwc', 'ranting', 'anak-ranting'],
                'is_active' => true,
            ],
            [
                'nama' => 'Wakil Ketua',
                'slug' => 'wakil-ketua',
                'deskripsi' => 'Wakil pimpinan di bidang eksekutif/organisasi',
                'level' => null,
                'levels' => ['pc', 'mwc', 'ranting', 'anak-ranting'],
                'is_active' => true,
            ],
            [
                'nama' => 'Sekretaris',
                'slug' => 'sekretaris',
                'deskripsi' => 'Sekretaris organisasi',
                'level' => null,
                'levels' => ['pc', 'mwc', 'ranting', 'anak-ranting'],
                'is_active' => true,
            ],
            [
                'nama' => 'Wakil Sekretaris',
                'slug' => 'wakil-sekretaris',
                'deskripsi' => 'Wakil sekretaris organisasi',
                'level' => null,
                'levels' => ['pc', 'mwc', 'ranting', 'anak-ranting'],
                'is_active' => true,
            ],
            [
                'nama' => 'Bendahara',
                'slug' => 'bendahara',
                'deskripsi' => 'Bendahara organisasi',
                'level' => null,
                'levels' => ['pc', 'mwc', 'ranting', 'anak-ranting'],
                'is_active' => true,
            ],
            [
                'nama' => 'Wakil Bendahara',
                'slug' => 'wakil-bendahara',
                'deskripsi' => 'Wakil bendahara organisasi',
                'level' => null,
                'levels' => ['pc', 'mwc', 'ranting', 'anak-ranting'],
                'is_active' => true,
            ],
            
            // ============================================
            // STRUKTUR LEMBAGA
            // ============================================
            [
                'nama' => 'Penasihat',
                'slug' => 'penasihat',
                'deskripsi' => 'Memberikan arahan dan nasihat kepada organisasi',
                'level' => 'lembaga',
                'levels' => null,
                'is_active' => true,
            ],
            [
                'nama' => 'Ketua',
                'slug' => 'ketua-lembaga',
                'deskripsi' => 'Pimpinan tertinggi organisasi',
                'level' => 'lembaga',
                'levels' => null,
                'is_active' => true,
            ],
            [
                'nama' => 'Wakil Ketua',
                'slug' => 'wakil-ketua-lembaga',
                'deskripsi' => 'Wakil pimpinan organisasi',
                'level' => 'lembaga',
                'levels' => null,
                'is_active' => true,
            ],
            [
                'nama' => 'Sekretaris',
                'slug' => 'sekretaris-lembaga',
                'deskripsi' => 'Sekretaris organisasi',
                'level' => 'lembaga',
                'levels' => null,
                'is_active' => true,
            ],
            [
                'nama' => 'Bendahara',
                'slug' => 'bendahara-lembaga',
                'deskripsi' => 'Bendahara organisasi',
                'level' => 'lembaga',
                'levels' => null,
                'is_active' => true,
            ],
            [
                'nama' => 'Humas',
                'slug' => 'humas',
                'deskripsi' => 'Bidang hubungan masyarakat dan komunikasi',
                'level' => 'lembaga',
                'levels' => null,
                'is_active' => true,
            ],
            [
                'nama' => 'Fundraising',
                'slug' => 'fundraising',
                'deskripsi' => 'Bidang penggalangan dana dan sumber daya',
                'level' => 'lembaga',
                'levels' => null,
                'is_active' => true,
            ],
            [
                'nama' => 'Perlengkapan',
                'slug' => 'perlengkapan',
                'deskripsi' => 'Bidang perlengkapan dan logistik',
                'level' => 'lembaga',
                'levels' => null,
                'is_active' => true,
            ],
            
            
            [
                'nama' => 'Penasihat',
                'slug' => 'penasihat-banom',
                'deskripsi' => 'Memberikan arahan dan nasihat kepada organisasi',
                'level' => 'banom',
                'levels' => null,
                'is_active' => true,
            ],
            [
                'nama' => 'Ketua',
                'slug' => 'ketua-banom',
                'deskripsi' => 'Pimpinan tertinggi organisasi',
                'level' => 'banom',
                'levels' => null,
                'is_active' => true,
            ],
            [
                'nama' => 'Wakil Ketua',
                'slug' => 'wakil-ketua-banom',
                'deskripsi' => 'Wakil pimpinan organisasi',
                'level' => 'banom',
                'levels' => null,
                'is_active' => true,
            ],
            [
                'nama' => 'Sekretaris',
                'slug' => 'sekretaris-banom',
                'deskripsi' => 'Sekretaris organisasi',
                'level' => 'banom',
                'levels' => null,
                'is_active' => true,
            ],
            [
                'nama' => 'Bendahara',
                'slug' => 'bendahara-banom',
                'deskripsi' => 'Bendahara organisasi',
                'level' => 'banom',
                'levels' => null,
                'is_active' => true,
            ],
            [
                'nama' => 'Humas',
                'slug' => 'humas-banom',
                'deskripsi' => 'Bidang hubungan masyarakat dan komunikasi',
                'level' => 'banom',
                'levels' => null,
                'is_active' => true,
            ],
            [
                'nama' => 'Fundraising',
                'slug' => 'fundraising-banom',
                'deskripsi' => 'Bidang penggalangan dana dan sumber daya',
                'level' => 'banom',
                'levels' => null,
                'is_active' => true,
            ],
            [
                'nama' => 'Perlengkapan',
                'slug' => 'perlengkapan-banom',
                'deskripsi' => 'Bidang perlengkapan dan logistik',
                'level' => 'banom',
                'levels' => null,
                'is_active' => true,
            ],
        ];

        foreach ($jabatans as $item) {
            Jabatan::updateOrCreate(
                [
                    'slug' => $item['slug'],
                ],
                [
                    'nama' => $item['nama'],
                    'slug' => $item['slug'],
                    'deskripsi' => $item['deskripsi'] ?? null,
                    'level' => $item['level'],
                    'levels' => $item['levels'],
                    'is_active' => $item['is_active'],
                ]
            );
        }
    }
}