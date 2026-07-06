<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AnggotaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Auth\Access\AuthorizationException;

class AnggotaController extends Controller
{
    protected AnggotaService $service;

    public function __construct(AnggotaService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'search'               => 'nullable|string|max:255',
            'organization_id'      => 'nullable|exists:organizations,id',
            'organization_type_id' => 'nullable|exists:organization_types,id',
            'jabatan_id'           => 'nullable|exists:jabatans,id',
            'is_active'            => 'nullable|string|in:true,false,1,0',
            'level_slug'           => 'nullable|string|max:50',
            'per_page'             => 'nullable|integer|min:1|max:100',
            'bypass_cache'         => 'nullable|boolean',
            '_t'                   => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
            ], 422);
        }

        if ($request->boolean('bypass_cache')) {
            $this->service->clearCache();
        }

        try {
            $data = $this->service->getAll($request);
            
            return response()->json([
                'success' => true,
                'message' => 'List data anggota berhasil diambil',
                'data'    => $data,
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan internal server.',
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Detail anggota berhasil ditemukan',
                'data'    => $this->service->findById($id),
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Data anggota tidak ditemukan',
            ], 404);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'organization_id' => 'required|exists:organizations,id',
            'jabatan_id'      => 'nullable|exists:jabatans,id',
            'no_anggota'      => 'nullable|string|max:50',
            'nama'            => 'required|string|max:255',
            'no_hp'           => 'nullable|string|max:20',
            'alamat'          => 'nullable|string',
            'is_active'       => 'nullable|in:true,false,1,0,on,off',
            'foto'            => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $validated = $validator->validated();
            $validated['is_active'] = $request->has('is_active') ? $request->boolean('is_active') : true;
            
            $anggota = $this->service->store($validated, $request);
            
            return response()->json([
                'success' => true,
                'message' => 'Anggota berhasil dibuat',
                'data'    => $anggota,
            ], 201);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'organization_id' => 'required|exists:organizations,id',
            'jabatan_id'      => 'nullable|exists:jabatans,id',
            'no_anggota'      => 'nullable|string|max:50',
            'nama'            => 'required|string|max:255',
            'no_hp'           => 'nullable|string|max:20',
            'alamat'          => 'nullable|string',
            'is_active'       => 'nullable|in:true,false,1,0,on,off',
            'foto'            => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $validated = $validator->validated();
            if ($request->has('is_active')) {
                $validated['is_active'] = $request->boolean('is_active');
            }
            
            $anggota = $this->service->update($id, $validated, $request);
            
            return response()->json([
                'success' => true,
                'message' => 'Anggota berhasil diupdate',
                'data'    => $anggota,
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->destroy($id);
            
            return response()->json([
                'success' => true,
                'message' => 'Anggota berhasil dihapus',
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function checkNoAnggota(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'no_anggota' => 'required|string|max:50',
            'exclude_id' => 'nullable|integer|exists:anggotas,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $isAvailable = $this->service->validateNoAnggotaExists(
                $request->no_anggota,
                $request->integer('exclude_id') ?: null
            );

            return response()->json([
                'success' => true,
                'data'    => [
                    'is_available' => $isAvailable,
                    'message'      => $isAvailable ? 'Nomor anggota tersedia' : 'Nomor anggota sudah terdaftar',
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function statistics(): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Statistik data anggota berhasil dimuat',
                'data'    => $this->service->getStatistics(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}