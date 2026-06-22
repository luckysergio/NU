<?php

namespace Database\Seeders;

use App\Models\DocumentSpecification;
use Illuminate\Database\Seeder;

class DocumentSpecificationSeeder
extends Seeder
{
    public function run(): void
    {
        $data = [

            [
                'nama' =>
                'Sangat Rahasia',

                'slug' =>
                'sangat-rahasia',

                'deskripsi' =>
                'Dokumen hanya dapat diakses pihak tertentu',

                'urutan' => 1,
            ],

            [
                'nama' =>
                'Rahasia',

                'slug' =>
                'rahasia',

                'deskripsi' =>
                'Dokumen terbatas internal pimpinan',

                'urutan' => 2,
            ],

            [
                'nama' =>
                'Internal',

                'slug' =>
                'internal',

                'deskripsi' =>
                'Dokumen internal organisasi',

                'urutan' => 3,
            ],

            [
                'nama' =>
                'Public',

                'slug' =>
                'public',

                'deskripsi' =>
                'Dokumen dapat diakses publik',

                'urutan' => 4,
            ],
        ];

        foreach ($data as $item) {

            DocumentSpecification::updateOrCreate(

                [
                    'slug' => $item['slug'],
                ],

                $item
            );
        }
    }
}
