<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Ambil Role
        |--------------------------------------------------------------------------
        */

        $role = Role::where(
            'slug',
            'super-admin'
        )->first();

        /*
        |--------------------------------------------------------------------------
        | Ambil Organization PC
        |--------------------------------------------------------------------------
        */

        /*
        |--------------------------------------------------------------------------
        | Create User
        |--------------------------------------------------------------------------
        */

        User::updateOrCreate(

            [
                'email' => 'adminpcnutangerang@gmail.com'
            ],

            [

                'role_id' => $role->id,

                /*
                |--------------------------------------------------------------------------
                | Basic
                |--------------------------------------------------------------------------
                */

                'name' => 'Super Admin',

                'email' => 'adminpcnutangerang@gmail.com',

                'phone' => '081210243379',

                'password' => 'adminpcnutangerang!_@',

                /*
                |--------------------------------------------------------------------------
                | Security
                |--------------------------------------------------------------------------
                */

                'is_active' => true,

                'is_blocked' => false,

                'can_login' => true,

                'blocked_at' => null,

                'email_verified_at' => now(),
            ]
        );
    }
}