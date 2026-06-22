<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Anggota;
use App\Models\Jabatan;
use App\Models\Organization;

class AnggotaSeeder extends Seeder
{
    public function run(): void
    {
        $ketua = Jabatan::whereRaw(
            'LOWER(nama) = ?',
            ['ketua']
        )->first();

        if (!$ketua) {

            $this->command->error(
                'Jabatan Ketua tidak ditemukan'
            );

            return;
        }

        $organizations = Organization::all();

        $counter = 1;

        foreach ($organizations as $organization) {

            $exists = Anggota::where(
                'organization_id',
                $organization->id
            )
            ->where(
                'jabatan_id',
                $ketua->id
            )
            ->exists();

            if ($exists) {
                continue;
            }

            Anggota::create([

                'organization_id' =>
                    $organization->id,

                'jabatan_id' =>
                    $ketua->id,

                'no_anggota' =>
                    sprintf(
                        'NU-%s-%06d',
                        date('Y'),
                        $counter++
                    ),

                'nama' =>
                    'Ketua ' .
                    $organization->nama,

                'no_hp' =>
                    '081200000000',

                'alamat' =>
                    $organization->alamat,

                'is_active' => true,
            ]);
        }

        $this->command->info(
            'Seeder anggota ketua berhasil dibuat.'
        );
    }
}