<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $data = [

            [
                'nama' => 'Super Admin',
                'slug' => 'super-admin',
            ],

            [
                'nama' => 'Admin',
                'slug' => 'admin',
            ],

            [
                'nama' => 'Operator',
                'slug' => 'operator',
            ],

            [
                'nama' => 'Anggota',
                'slug' => 'anggota',
            ],

        ];

        foreach ($data as $item) {

            Role::updateOrCreate(
                [
                    'slug' => $item['slug']
                ],
                $item
            );
        }
    }
}