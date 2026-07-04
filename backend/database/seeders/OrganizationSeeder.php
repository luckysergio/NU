<?php
// database/seeders/OrganizationSeeder.php

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

        $kota = Kota::where('nama', 'Kota Tangerang')->first();

        if (!$kota) {
            $this->command->error('Kota Tangerang tidak ditemukan!');
            return;
        }

        $pcLevel = OrganizationLevel::where('slug', 'pc')->first();
        $mwcLevel = OrganizationLevel::where('slug', 'mwc')->first();
        $rantingLevel = OrganizationLevel::where('slug', 'ranting')->first();

        if (!$pcLevel || !$mwcLevel || !$rantingLevel) {
            $this->command->error('Organization Level tidak ditemukan!');
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | PC
        |--------------------------------------------------------------------------
        */

        $pcName = 'PCNU Kota Tangerang';

        $pc = Organization::updateOrCreate(
            ['slug' => Str::slug($pcName)],
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

        $this->command->info('✅ PCNU Kota Tangerang created/updated');

        /*
        |--------------------------------------------------------------------------
        | MWC (Kecamatan Level)
        |--------------------------------------------------------------------------
        */

        $kecamatans = Kecamatan::where('is_active', true)->get();

        if ($kecamatans->isEmpty()) {
            $this->command->warn('⚠️ Tidak ada kecamatan ditemukan!');
            return;
        }

        $mwcCount = 0;

        foreach ($kecamatans as $kecamatan) {
            $mwcName = 'MWC NU ' . $kecamatan->nama;

            $mwc = Organization::updateOrCreate(
                ['slug' => Str::slug($mwcName)],
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

            $mwcCount++;
            $this->command->info("  ✅ MWC {$kecamatan->nama} created/updated");

            /*
            |--------------------------------------------------------------------------
            | RANTING (Kelurahan Level)
            |--------------------------------------------------------------------------
            */

            $kelurahans = Kelurahan::where('kecamatan_id', $kecamatan->id)
                ->where('is_active', true)
                ->get();

            if ($kelurahans->isEmpty()) {
                $this->command->warn("  ⚠️ Tidak ada kelurahan untuk kecamatan {$kecamatan->nama}");
                continue;
            }

            $rantingCount = 0;

            foreach ($kelurahans as $kelurahan) {
                $rantingName = 'Ranting NU ' . $kelurahan->nama;

                $ranting = Organization::updateOrCreate(
                    ['slug' => Str::slug($rantingName)],
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

                $rantingCount++;
            }

            $this->command->info("  ✅ {$rantingCount} Ranting created/updated for MWC {$kecamatan->nama}");
        }
    }
}