<?php

namespace Database\Seeders;

use App\Models\OrganizationLevel;
use Illuminate\Database\Seeder;

class OrganizationLevelSeeder extends Seeder
{
    public function run(): void
    {
        $data = [

            [
                'nama' => 'PC',
                'slug' => 'pc',
                'urutan' => 1,
            ],

            [
                'nama' => 'MWC',
                'slug' => 'mwc',
                'urutan' => 2,
            ],

            [
                'nama' => 'Ranting',
                'slug' => 'ranting',
                'urutan' => 3,
            ],

            [
                'nama' => 'Anak Ranting',
                'slug' => 'anak-ranting',
                'urutan' => 4,
            ],

            [
                'nama' => 'Lembaga',
                'slug' => 'lembaga',
                'urutan' => 5,
            ],

            [
                'nama' => 'Banom',
                'slug' => 'banom',
                'urutan' => 6,
            ],

        ];

        foreach ($data as $item) {

            OrganizationLevel::updateOrCreate(
                [
                    'slug' => $item['slug']
                ],
                $item
            );
        }
    }
}
