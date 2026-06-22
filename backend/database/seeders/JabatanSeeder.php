<?php

namespace Database\Seeders;

use App\Models\Jabatan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class JabatanSeeder extends Seeder
{
    public function run(): void
    {
        $data = [

            'Ketua',
            'Wakil Ketua',
            'Sekretaris',
            'Bendahara',
            'Anggota',
        ];

        foreach ($data as $item) {

            Jabatan::updateOrCreate(

                [
                    'slug' => Str::slug($item),
                ],

                [

                    'nama' => $item,

                    'slug' => Str::slug($item),

                    'is_active' => true,
                ]
            );
        }
    }
}
