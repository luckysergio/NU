<?php

namespace Database\Seeders;

use App\Models\Kecamatan;
use App\Models\Kelurahan;
use App\Models\Kota;
use App\Models\RW;
use App\Models\Organization;
use App\Models\OrganizationLevel;
use App\Models\OrganizationType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OrganizationSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | MASTER DATA
        |--------------------------------------------------------------------------
        */

        $kota = Kota::where(
            'nama',
            'Kota Tangerang'
        )->first();

        if (!$kota) {
            return;
        }

        $pcLevel = OrganizationLevel::where(
            'slug',
            'pc'
        )->first();

        $mwcLevel = OrganizationLevel::where(
            'slug',
            'mwc'
        )->first();

        $rantingLevel = OrganizationLevel::where(
            'slug',
            'ranting'
        )->first();

        $anakRantingLevel = OrganizationLevel::where(
            'slug',
            'anak-ranting'
        )->first();

        $lembagaLevel = OrganizationLevel::where(
            'slug',
            'lembaga'
        )->first();

        $banomLevel = OrganizationLevel::where(
            'slug',
            'banom'
        )->first();

        /*
        |--------------------------------------------------------------------------
        | GET ORGANIZATION TYPES FOR LEMBAGA AND BANOM
        |--------------------------------------------------------------------------
        */

        // Get Lembaga Types
        $lembagaTypes = OrganizationType::where('organization_level_id', $lembagaLevel->id)
            ->where('is_active', true)
            ->get();

        // If no lembaga types exist, create default ones
        if ($lembagaTypes->isEmpty()) {
            
            $defaultLembagaTypes = [
                ['nama' => 'LP Ma\'arif', 'deskripsi' => 'Lembaga Pendidikan Ma\'arif'],
                ['nama' => 'Lembaga Dakwah', 'deskripsi' => 'Lembaga Dakwah Nahdlatul Ulama'],
                ['nama' => 'Lembaga Sosial', 'deskripsi' => 'Lembaga Sosial Nahdlatul Ulama'],
                ['nama' => 'Lembaga Ekonomi', 'deskripsi' => 'Lembaga Ekonomi Nahdlatul Ulama'],
                ['nama' => 'Lembaga Kesehatan', 'deskripsi' => 'Lembaga Kesehatan Nahdlatul Ulama'],
                ['nama' => 'Lembaga Lingkungan Hidup', 'deskripsi' => 'Lembaga Lingkungan Hidup Nahdlatul Ulama'],
                ['nama' => 'Lembaga Seni Budaya', 'deskripsi' => 'Lembaga Seni Budaya Nahdlatul Ulama'],
            ];

            foreach ($defaultLembagaTypes as $type) {
                $lembagaTypes->push(OrganizationType::create([
                    'organization_level_id' => $lembagaLevel->id,
                    'nama' => $type['nama'],
                    'slug' => Str::slug($type['nama']),
                    'deskripsi' => $type['deskripsi'],
                    'is_active' => true,
                ]));
            }
            
        }

        // Get Banom Types
        $banomTypes = OrganizationType::where('organization_level_id', $banomLevel->id)
            ->where('is_active', true)
            ->get();

        // If no banom types exist, create default ones
        if ($banomTypes->isEmpty()) {
            
            $defaultBanomTypes = [
                ['nama' => 'GP Ansor', 'deskripsi' => 'Gerakan Pemuda Ansor'],
                ['nama' => 'IPNU', 'deskripsi' => 'Ikatan Pelajar Nahdlatul Ulama'],
                ['nama' => 'IPPNU', 'deskripsi' => 'Ikatan Pelajar Putri Nahdlatul Ulama'],
                ['nama' => 'Fatayat', 'deskripsi' => 'Fatayat Nahdlatul Ulama'],
                ['nama' => 'Muslimat', 'deskripsi' => 'Muslimat Nahdlatul Ulama'],
                ['nama' => 'Pagar Nusa', 'deskripsi' => 'Perguruan Pencak Silat Pagar Nusa'],
                ['nama' => 'Banser', 'deskripsi' => 'Barisan Ansar Serbaguna'],
            ];

            foreach ($defaultBanomTypes as $type) {
                $banomTypes->push(OrganizationType::create([
                    'organization_level_id' => $banomLevel->id,
                    'nama' => $type['nama'],
                    'slug' => Str::slug($type['nama']),
                    'deskripsi' => $type['deskripsi'],
                    'is_active' => true,
                ]));
            }
            
        }

        /*
        |--------------------------------------------------------------------------
        | PC
        |--------------------------------------------------------------------------
        */

        $pcName = 'PCNU Kota Tangerang';

        $pc = Organization::updateOrCreate(
            [
                'slug' => Str::slug($pcName),
            ],
            [
                'organization_level_id' => $pcLevel->id,
                'organization_type_id' => null,
                'parent_id' => null,
                'kota_id' => $kota->id,
                'kecamatan_id' => null,
                'kelurahan_id' => null,
                'rw_id' => null,
                'nama' => $pcName,
                'slug' => Str::slug($pcName),
                'alamat' => 'Kota Tangerang',
                'telepon' => null,
                'email' => null,
                'logo' => null,
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | MWC
        |--------------------------------------------------------------------------
        */

        $kecamatans = Kecamatan::all();

        if ($kecamatans->isEmpty()) {
            return;
        }

        foreach ($kecamatans as $kecamatan) {
            $mwcName = 'MWC NU ' . $kecamatan->nama;

            $mwc = Organization::updateOrCreate(
                [
                    'slug' => Str::slug($mwcName),
                ],
                [
                    'organization_level_id' => $mwcLevel->id,
                    'organization_type_id' => null,
                    'parent_id' => $pc->id,
                    'kota_id' => $kota->id,
                    'kecamatan_id' => $kecamatan->id,
                    'kelurahan_id' => null,
                    'rw_id' => null,
                    'nama' => $mwcName,
                    'slug' => Str::slug($mwcName),
                    'alamat' => $kecamatan->nama,
                    'telepon' => null,
                    'email' => null,
                    'logo' => null,
                    'is_active' => true,
                ]
            );

            /*
            |--------------------------------------------------------------------------
            | RANTING
            |--------------------------------------------------------------------------
            */

            $kelurahans = Kelurahan::where(
                'kecamatan_id',
                $kecamatan->id
            )->get();

            if ($kelurahans->isEmpty()) {
                continue;
            }

            foreach ($kelurahans as $kelurahan) {
                $rantingName = 'Ranting NU ' . $kelurahan->nama;

                $ranting = Organization::updateOrCreate(
                    [
                        'slug' => Str::slug($rantingName),
                    ],
                    [
                        'organization_level_id' => $rantingLevel->id,
                        'organization_type_id' => null,
                        'parent_id' => $mwc->id,
                        'kota_id' => $kota->id,
                        'kecamatan_id' => $kecamatan->id,
                        'kelurahan_id' => $kelurahan->id,
                        'rw_id' => null,
                        'nama' => $rantingName,
                        'slug' => Str::slug($rantingName),
                        'alamat' => $kelurahan->nama,
                        'telepon' => null,
                        'email' => null,
                        'logo' => null,
                        'is_active' => true,
                    ]
                );

                /*
                |--------------------------------------------------------------------------
                | ANAK RANTING (RW Level)
                |--------------------------------------------------------------------------
                */

                $rws = RW::where(
                    'kelurahan_id',
                    $kelurahan->id
                )->get();

                if ($rws->isEmpty()) {
                    continue;
                }

                foreach ($rws as $rw) {
                    $anakRantingName = 'Anak Ranting NU ' . $kelurahan->nama . ' RW ' . $rw->nomor;

                    Organization::updateOrCreate(
                        [
                            'slug' => Str::slug($anakRantingName),
                        ],
                        [
                            'organization_level_id' => $anakRantingLevel->id,
                            'organization_type_id' => null,
                            'parent_id' => $ranting->id,
                            'kota_id' => $kota->id,
                            'kecamatan_id' => $kecamatan->id,
                            'kelurahan_id' => $kelurahan->id,
                            'rw_id' => $rw->id,
                            'nama' => $anakRantingName,
                            'slug' => Str::slug($anakRantingName),
                            'alamat' => $kelurahan->nama . ' RW ' . $rw->nomor,
                            'telepon' => null,
                            'email' => null,
                            'logo' => null,
                            'is_active' => true,
                        ]
                    );
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | LEMBAGA (Institutions)
        |--------------------------------------------------------------------------
        */

        $mwcs = Organization::where(
            'organization_level_id',
            $mwcLevel->id
        )->get();

        if ($lembagaTypes->isNotEmpty()) {
            foreach ($lembagaTypes as $type) {
                // Lembaga tingkat PC
                $lembagaPcName = $type->nama . ' Kota Tangerang';
                Organization::updateOrCreate(
                    [
                        'slug' => Str::slug($lembagaPcName),
                    ],
                    [
                        'organization_level_id' => $lembagaLevel->id,
                        'organization_type_id' => $type->id,
                        'parent_id' => $pc->id,
                        'kota_id' => $kota->id,
                        'kecamatan_id' => null,
                        'kelurahan_id' => null,
                        'rw_id' => null,
                        'nama' => $lembagaPcName,
                        'slug' => Str::slug($lembagaPcName),
                        'alamat' => 'Kota Tangerang',
                        'telepon' => null,
                        'email' => null,
                        'logo' => null,
                        'is_active' => true,
                    ]
                );

                // Lembaga tingkat MWC
                foreach ($mwcs as $mwc) {
                    if ($mwc->kecamatan) {
                        $lembagaMwcName = $type->nama . ' ' . $mwc->kecamatan->nama;
                        Organization::updateOrCreate(
                            [
                                'slug' => Str::slug($lembagaMwcName),
                            ],
                            [
                                'organization_level_id' => $lembagaLevel->id,
                                'organization_type_id' => $type->id,
                                'parent_id' => $mwc->id,
                                'kota_id' => $kota->id,
                                'kecamatan_id' => $mwc->kecamatan_id,
                                'kelurahan_id' => null,
                                'rw_id' => null,
                                'nama' => $lembagaMwcName,
                                'slug' => Str::slug($lembagaMwcName),
                                'alamat' => $mwc->kecamatan->nama,
                                'telepon' => null,
                                'email' => null,
                                'logo' => null,
                                'is_active' => true,
                            ]
                        );
                    }
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | BANOM (Badan Otonom)
        | Struktur:
        | 1. Banom tingkat PC -> parent = PC
        | 2. Banom tingkat MWC -> parent = Banom tingkat PC (bukan MWC langsung)
        |--------------------------------------------------------------------------
        */

        if ($banomTypes->isNotEmpty()) {
            // Store created PC-level banoms for reference
            $pcBanoms = [];
            
            foreach ($banomTypes as $type) {
                // Banom tingkat PC (Kota)
                $banomPcName = $type->nama . ' Kota Tangerang';
                $banomPc = Organization::updateOrCreate(
                    [
                        'slug' => Str::slug($banomPcName),
                    ],
                    [
                        'organization_level_id' => $banomLevel->id,
                        'organization_type_id' => $type->id,
                        'parent_id' => $pc->id,
                        'kota_id' => $kota->id,
                        'kecamatan_id' => null,
                        'kelurahan_id' => null,
                        'rw_id' => null,
                        'nama' => $banomPcName,
                        'slug' => Str::slug($banomPcName),
                        'alamat' => 'Kota Tangerang',
                        'telepon' => null,
                        'email' => null,
                        'logo' => null,
                        'is_active' => true,
                    ]
                );
                
                // Store reference for this banom type
                $pcBanoms[$type->id] = $banomPc;
            }
            
            // Banom tingkat MWC - parent = Banom tingkat PC (bukan MWC)
            foreach ($mwcs as $mwc) {
                if ($mwc->kecamatan) {
                    foreach ($banomTypes as $type) {
                        // Get the PC-level banom for this type
                        $parentBanomPc = $pcBanoms[$type->id] ?? null;
                        
                        if ($parentBanomPc) {
                            $banomMwcName = $type->nama . ' ' . $mwc->kecamatan->nama;
                            Organization::updateOrCreate(
                                [
                                    'slug' => Str::slug($banomMwcName),
                                ],
                                [
                                    'organization_level_id' => $banomLevel->id,
                                    'organization_type_id' => $type->id,
                                    'parent_id' => $parentBanomPc->id,
                                    'kota_id' => $kota->id,
                                    'kecamatan_id' => $mwc->kecamatan_id,
                                    'kelurahan_id' => null,
                                    'rw_id' => null,
                                    'nama' => $banomMwcName,
                                    'slug' => Str::slug($banomMwcName),
                                    'alamat' => $mwc->kecamatan->nama,
                                    'telepon' => null,
                                    'email' => null,
                                    'logo' => null,
                                    'is_active' => true,
                                ]
                            );
                        }
                    }
                }
            }
        }
    }
}