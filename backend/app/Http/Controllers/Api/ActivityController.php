<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use App\Services\ActivityService;

class ActivityController extends Controller
{
    protected ActivityService $service;

    public function __construct(
        ActivityService $service
    ) {
        $this->service = $service;
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */

    public function index(
        Request $request
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            [
                'search' => [
                    'nullable',
                    'string',
                    'max:255',
                ],
                'organization_id' => [
                    'nullable',
                    'exists:organizations,id',
                ],
                'work_program_id' => [
                    'nullable',
                    'exists:work_programs,id',
                ],
                'status' => [
                    'nullable',
                    'string',
                    'in:draft,completed,cancelled',
                ],
                'per_page' => [
                    'nullable',
                    'integer',
                    'min:1',
                    'max:1000',
                ],
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'List kegiatan',
            'data' => $this->service->getAll(
                $request,
                auth('api')->user()
            ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    public function show(
        int $id
    ): JsonResponse {

        try {
            $activity = $this->service->findById(
                $id,
                auth('api')->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Detail kegiatan',
                'data' => $activity,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(
        Request $request
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            $this->rules()
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $activity = $this->service->store(
                $validator->validated(),
                $request,
                auth('api')->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Kegiatan berhasil dibuat',
                'data' => $activity,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        int $id
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            $this->rules()
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $activity = $this->service->update(
                $id,
                $validator->validated(),
                $request,
                auth('api')->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Kegiatan berhasil diupdate',
                'data' => $activity,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function destroy(
        Request $request,
        int $id
    ): JsonResponse {

        try {
            $this->service->destroy(
                $id,
                $request,
                auth('api')->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Kegiatan berhasil dihapus',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE STATUS
    |--------------------------------------------------------------------------
    */

    public function updateStatus(
        Request $request,
        int $id
    ): JsonResponse {

        $validator = Validator::make(
            $request->all(),
            [
                'status' => [
                    'required',
                    'string',
                    'in:draft,completed,cancelled',
                ],
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $activity = $this->service->updateStatus(
                $id,
                $request->status,
                auth('api')->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Status kegiatan berhasil diupdate',
                'data' => $activity,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATION RULES
    |--------------------------------------------------------------------------
    */

    private function rules(): array
    {
        return [
            'work_program_id' => [
                'required',
                'exists:work_programs,id',
            ],
            'organization_id' => [
                'required',
                'exists:organizations,id',
            ],
            'penanggung_jawab_id' => [
                'required',
                'exists:anggotas,id',
            ],
            'nama_kegiatan' => [
                'required',
                'string',
                'max:255',
            ],
            'tanggal_pelaksanaan' => [
                'required',
                'date',
            ],
            'status' => [
                'nullable',
                'string',
                'in:draft,completed,cancelled',
            ],
            'total_pengeluaran' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'catatan' => [
                'nullable',
                'string',
            ],

            // Participant organizations untuk absensi
            'participant_organization_ids' => [
                'nullable',
                'array',
            ],
            'participant_organization_ids.*' => [
                'exists:organizations,id',
            ],

            // Attendance - anggota yang hadir
            'attendance_anggota_ids' => [
                'nullable',
                'array',
            ],
            'attendance_anggota_ids.*' => [
                'exists:anggotas,id',
            ],

            // Absent anggota dengan kritik & saran
            'absent_anggota_data' => [
                'nullable',
                'array',
            ],
            'absent_anggota_data.*.anggota_id' => [
                'required',
                'exists:anggotas,id',
            ],
            'absent_anggota_data.*.kritik' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'absent_anggota_data.*.saran' => [
                'nullable',
                'string',
                'max:1000',
            ],

            // Deleted attendance anggota IDs
            'deleted_attendance_anggota_ids' => [
                'nullable',
                'array',
            ],
            'deleted_attendance_anggota_ids.*' => [
                'integer',
            ],

            // Photos
            'photos' => [
                'nullable',
                'array',
                'max:5',
            ],
            'photos.*' => [
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'deleted_photo_ids' => [
                'nullable',
                'array',
            ],
            'deleted_photo_ids.*' => [
                'integer',
            ],

            // Expense photos
            'expense_photos' => [
                'nullable',
                'array',
            ],
            'expense_photos.*' => [
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'deleted_expense_photo_ids' => [
                'nullable',
                'array',
            ],
            'deleted_expense_photo_ids.*' => [
                'integer',
            ],

            // Attendance files (opsional, untuk backup)
            'attendance_files' => [
                'nullable',
                'array',
            ],
            'attendance_files.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:10240',
            ],
            'deleted_attendance_ids' => [
                'nullable',
                'array',
            ],
            'deleted_attendance_ids.*' => [
                'integer',
            ],
        ];
    }
}