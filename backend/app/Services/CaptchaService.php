<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CaptchaService
{
    public function verify(?string $token): bool
    {
        if (!$token) {
            return false;
        }

        try {

            $response = Http::asForm()->post(

                'https://www.google.com/recaptcha/api/siteverify',

                [

                    'secret' => env('NOCAPTCHA_SECRET'),

                    'response' => $token,
                ]
            );

            if (!$response->successful()) {

                Log::error(
                    'Captcha request failed',
                    [
                        'response' => $response->body()
                    ]
                );

                return false;
            }

            $result = $response->json();

            /*
            |--------------------------------------------------------------------------
            | Required Success
            |--------------------------------------------------------------------------
            */

            if (!($result['success'] ?? false)) {
                return false;
            }

            /*
            |--------------------------------------------------------------------------
            | Score Validation (v3)
            |--------------------------------------------------------------------------
            */

            $score = $result['score'] ?? 0;

            if ($score < 0.5) {
                return false;
            }

            /*
            |--------------------------------------------------------------------------
            | Optional Action Validation
            |--------------------------------------------------------------------------
            */

            if (
                isset($result['action']) &&
                $result['action'] !== 'login'
            ) {
                return false;
            }

            return true;

        } catch (\Throwable $e) {

            Log::error(
                'Captcha verify error',
                [
                    'message' => $e->getMessage()
                ]
            );

            return false;
        }
    }
}