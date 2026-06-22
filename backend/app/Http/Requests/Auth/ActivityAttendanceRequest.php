<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ActivityAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'activity_id' => 'required|exists:activities,id',
            'attendances' => 'nullable|array',
            'attendances.*.anggota_id' => 'required|exists:anggotas,id',
            'attendances.*.is_present' => 'required|boolean',
            'attendances.*.kritik' => 'nullable|string|max:1000',
            'attendances.*.saran' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'activity_id.required' => 'ID kegiatan wajib diisi',
            'activity_id.exists' => 'Kegiatan tidak ditemukan',
            'attendances.array' => 'Format absensi tidak valid',
            'attendances.*.anggota_id.required' => 'ID anggota wajib diisi',
            'attendances.*.anggota_id.exists' => 'Anggota tidak ditemukan',
            'attendances.*.is_present.required' => 'Status kehadiran wajib diisi',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Jika attendances tidak ada, set sebagai array kosong
        if (!$this->has('attendances') || $this->attendances === null) {
            $this->merge([
                'attendances' => [],
            ]);
        }
    }

    /**
     * Get the validated data.
     */
    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);
        
        // Pastikan attendances selalu array
        if (!isset($validated['attendances']) || $validated['attendances'] === null) {
            $validated['attendances'] = [];
        }
        
        return $validated;
    }
}