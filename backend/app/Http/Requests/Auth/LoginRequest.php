<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'email' => [
                'required',
                'email',
            ],

            'password' => [
                'required',
                'string',
                'min:6',
            ],

            'g-recaptcha-response' => [
                'required',
                'string',
            ],
        ];
    }

    public function messages(): array
    {
        return [

            'email.required' =>
                'Email wajib diisi',

            'email.email' =>
                'Format email tidak valid',

            'password.required' =>
                'Password wajib diisi',

            'password.min' =>
                'Password minimal 6 karakter',

            'g-recaptcha-response.required' =>
                'Captcha wajib diisi',
        ];
    }
}