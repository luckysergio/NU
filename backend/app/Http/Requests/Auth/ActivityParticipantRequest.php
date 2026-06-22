<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ActivityParticipantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'activity_id' => [
                'required',
                'exists:activities,id',
            ],
            'organization_ids' => [
                'nullable',
                'array',
            ],
            'organization_ids.*' => [
                'exists:organizations,id',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'activity_id.required' => 'ID kegiatan wajib diisi',
            'activity_id.exists' => 'Kegiatan tidak ditemukan',
            'organization_ids.array' => 'Format organisasi tidak valid',
            'organization_ids.*.exists' => 'Organisasi tidak ditemukan',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Jika organization_ids tidak ada atau null, set sebagai array kosong
        if (!$this->has('organization_ids') || $this->organization_ids === null) {
            $this->merge([
                'organization_ids' => [],
            ]);
        }
    }
}