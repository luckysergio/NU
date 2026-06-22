<?php

namespace App\Services;

use App\Models\RW;
use App\Models\Organization;

class RWService
{
    public function getAll(array $filters = [])
    {
        $query = RW::with([
            'kelurahan',
            'kelurahan.kecamatan',
            'kelurahan.kecamatan.kota',
        ]);

        if (!empty($filters['kelurahan_id'])) {

            $query->where(
                'kelurahan_id',
                $filters['kelurahan_id']
            );
        }

        if (!empty($filters['search'])) {

            $search = strtolower(
                $filters['search']
            );

            $query->whereRaw(
                'LOWER(nomor) LIKE ?',
                ["%{$search}%"]
            );
        }

        return $query
            ->orderBy('nomor')
            ->get();
    }

    public function find(int $id): RW
    {
        return RW::with([
            'kelurahan',
            'kelurahan.kecamatan',
            'kelurahan.kecamatan.kota',
            'organizations',
        ])->findOrFail($id);
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE FOR ANAK RANTING
    |--------------------------------------------------------------------------
    */

    public function availableForAnakRanting(
        ?int $ignoreOrganizationId = null,
        ?int $kelurahanId = null
    ) {
        // Ambil ID RW yang sudah digunakan oleh organisasi Anak Ranting
        $usedRwIds = Organization::query()
            ->whereHas('level', function ($q) {
                $q->where('slug', 'anak-ranting');
            })
            ->whereNotNull('rw_id')
            ->when($ignoreOrganizationId, function ($q) use ($ignoreOrganizationId) {
                $q->where('id', '!=', $ignoreOrganizationId);
            })
            ->pluck('rw_id')
            ->toArray();

        // Query RW yang belum digunakan
        $query = RW::query()
            ->with([
                'kelurahan',
                'kelurahan.kecamatan',
                'kelurahan.kecamatan.kota',
            ])
            ->where('is_active', true);

        // Filter berdasarkan kelurahan jika ada
        if ($kelurahanId) {
            $query->where('kelurahan_id', $kelurahanId);
        }

        // Exclude RW yang sudah digunakan
        if (!empty($usedRwIds)) {
            $query->whereNotIn('id', $usedRwIds);
        }

        return $query
            ->orderBy('nomor', 'asc')
            ->get();
    }

    public function create(array $data): RW
    {
        return RW::create([
            'kelurahan_id' => $data['kelurahan_id'],
            'nomor'        => $data['nomor'],
            'is_active'    => $data['is_active'] ?? true,
        ]);
    }

    public function update(
        int $id,
        array $data
    ): RW {

        $rw = RW::findOrFail($id);

        $rw->update([
            'kelurahan_id' => $data['kelurahan_id'],
            'nomor'        => $data['nomor'],
            'is_active'    => $data['is_active'] ?? true,
        ]);

        return $rw->fresh([
            'kelurahan',
            'kelurahan.kecamatan',
            'kelurahan.kecamatan.kota',
        ]);
    }

    public function delete(int $id): void
    {
        $rw = RW::findOrFail($id);

        // Cek apakah RW sudah digunakan oleh organisasi Anak Ranting
        $hasOrganization = Organization::where('rw_id', $id)
            ->whereHas('level', function ($q) {
                $q->where('slug', 'anak-ranting');
            })
            ->exists();

        if ($hasOrganization) {
            throw new \Exception('RW sedang digunakan oleh organisasi Anak Ranting dan tidak dapat dihapus.');
        }

        $rw->delete();
    }
}