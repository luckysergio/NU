<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            KotaSeeder::class,
            KecamatanSeeder::class,
            KelurahanSeeder::class,
            RWSeeder::class,
            RoleSeeder::class,
            OrganizationLevelSeeder::class,
            OrganizationTypeSeeder::class,
            OrganizationSeeder::class,
            UserSeeder::class,
            JabatanSeeder::class,
            AnggotaSeeder::class,
            DocumentSpecificationSeeder::class,
            ProgramFieldSeeder::class,
            ProgramTargetSeeder::class,
            ProgramGoalSeeder::class,
        ]);
    }
}
