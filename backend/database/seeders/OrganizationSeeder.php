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
    }
}