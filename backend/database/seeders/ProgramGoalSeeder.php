<?php

namespace Database\Seeders;

use App\Models\ProgramGoal;
use Illuminate\Database\Seeder;

class ProgramGoalSeeder extends Seeder
{
    public function run(): void
    {
        $goals = [

            'Meningkatkan kualitas keagamaan warga',
            'Memperkuat akidah Ahlussunnah wal Jamaah',
            'Meningkatkan kapasitas kader',
            'Meningkatkan kualitas pendidikan',
            'Meningkatkan kesejahteraan umat',
            'Memperkuat kemandirian ekonomi warga',
            'Meningkatkan pelayanan kesehatan masyarakat',
            'Meningkatkan kepedulian sosial',
            'Memperkuat tata kelola organisasi',
            'Meningkatkan partisipasi anggota',
            'Meningkatkan kualitas pelayanan organisasi',
            'Memperluas syiar Islam rahmatan lil alamin',
            'Meningkatkan literasi digital warga',
            'Meningkatkan ketahanan keluarga',
            'Meningkatkan peran pemuda dalam organisasi',
            'Meningkatkan pemberdayaan perempuan',
            'Meningkatkan pelestarian budaya Islam Nusantara',
            'Meningkatkan kesiapsiagaan bencana',
            'Memperkuat kolaborasi antar lembaga',
            'Mewujudkan masyarakat yang mandiri dan berdaya',
        ];

        foreach ($goals as $goal) {

            ProgramGoal::updateOrCreate(
                ['nama' => $goal],
                ['is_active' => true]
            );
        }
    }
}