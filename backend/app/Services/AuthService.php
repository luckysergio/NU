<?php

namespace App\Services;

use App\Models\BlockedIp;
use App\Models\LoginLog;
use App\Models\User;
use App\Models\UserDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Jenssegers\Agent\Agent;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\JWTGuard;

class AuthService
{
    protected CaptchaService $captchaService;

    public function __construct(
        CaptchaService $captchaService
    ) {
        $this->captchaService = $captchaService;
    }

    /*
    |--------------------------------------------------------------------------
    | GUARD
    |--------------------------------------------------------------------------
    */

    protected function guard(): JWTGuard
    {
        /** @var JWTGuard $guard */
        $guard = Auth::guard('api');

        return $guard;
    }

    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    public function login(
        array $credentials,
        Request $request
    ): array {

        DB::beginTransaction();

        try {

            $ipAddress = $request->ip();

            /*
            |--------------------------------------------------------------------------
            | BLOCKED IP CHECK
            |--------------------------------------------------------------------------
            */

            $blockedIp = BlockedIp::query()

                ->where('ip_address', $ipAddress)

                ->where('is_active', true)

                ->first();

            if ($blockedIp) {

                /*
                |--------------------------------------------------------------------------
                | AUTO EXPIRE
                |--------------------------------------------------------------------------
                */

                if ($blockedIp->isExpired()) {

                    $blockedIp->update([
                        'is_active' => false
                    ]);

                } else {

                    DB::rollBack();

                    return [

                        'success' => false,

                        'message' =>
                            'IP address diblokir sementara',

                        'code' => 403,
                    ];
                }
            }

            /*
            |--------------------------------------------------------------------------
            | CAPTCHA VALIDATION
            |--------------------------------------------------------------------------
            */

            $captchaToken = $request->input(
                'g-recaptcha-response'
            );

            if (
                !$this->captchaService
                    ->verify($captchaToken)
            ) {

                DB::rollBack();

                return [

                    'success' => false,

                    'message' =>
                        'Captcha tidak valid',

                    'code' => 422,
                ];
            }

            /*
            |--------------------------------------------------------------------------
            | LOGIN ATTEMPT
            |--------------------------------------------------------------------------
            */

            $token = $this->guard()
                ->attempt($credentials);

            /*
            |--------------------------------------------------------------------------
            | INVALID LOGIN
            |--------------------------------------------------------------------------
            */

            if (!$token) {

                LoginLog::create([

                    'email' =>
                        $credentials['email'] ?? null,

                    'ip_address' => $ipAddress,

                    'user_agent' =>
                        $request->userAgent(),

                    'is_success' => false,
                ]);

                /*
                |--------------------------------------------------------------------------
                | AUTO BLOCK SUSPICIOUS IP
                |--------------------------------------------------------------------------
                |
                | Example:
                | 10 failed login attempts in 10 minutes
                |
                */

                $failedAttempts = LoginLog::query()

                    ->where('ip_address', $ipAddress)

                    ->where('is_success', false)

                    ->where(
                        'created_at',
                        '>=',
                        now()->subMinutes(10)
                    )

                    ->count();

                if ($failedAttempts >= 10) {

                    BlockedIp::updateOrCreate(

                        [
                            'ip_address' => $ipAddress
                        ],

                        [
                            'reason' =>
                                'Terlalu banyak login gagal',

                            'blocked_until' =>
                                now()->addMinutes(30),

                            'is_active' => true,
                        ]
                    );

                    Log::warning(
                        'Suspicious IP blocked',
                        [
                            'ip_address' => $ipAddress,
                            'attempts' => $failedAttempts,
                        ]
                    );
                }

                DB::commit();

                return [

                    'success' => false,

                    'message' =>
                        'Email atau password salah',

                    'code' => 401,
                ];
            }

            /*
            |--------------------------------------------------------------------------
            | USER
            |--------------------------------------------------------------------------
            */

            /** @var User|null $user */
            $user = $this->guard()->user();

            if (!$user) {

                DB::rollBack();

                return [

                    'success' => false,

                    'message' =>
                        'User tidak ditemukan',

                    'code' => 404,
                ];
            }

            /*
            |--------------------------------------------------------------------------
            | ACCOUNT VALIDATION
            |--------------------------------------------------------------------------
            */

            if (!$user->canLogin()) {

                /*
                |--------------------------------------------------------------------------
                | SAVE FAILED LOGIN
                |--------------------------------------------------------------------------
                */

                LoginLog::create([

                    'user_id' => $user->id,

                    'email' => $user->email,

                    'ip_address' => $ipAddress,

                    'user_agent' =>
                        $request->userAgent(),

                    'is_success' => false,
                ]);

                $this->guard()->logout();

                DB::commit();

                return [

                    'success' => false,

                    'message' =>
                        'Akun tidak dapat login',

                    'code' => 403,
                ];
            }

            /*
            |--------------------------------------------------------------------------
            | UPDATE LAST LOGIN
            |--------------------------------------------------------------------------
            */

            $user->update([

                'last_login_at' => now(),

                'last_login_ip' => $ipAddress,
            ]);

            /*
            |--------------------------------------------------------------------------
            | LOGIN LOG SUCCESS
            |--------------------------------------------------------------------------
            */

            LoginLog::create([

                'user_id' => $user->id,

                'email' => $user->email,

                'ip_address' => $ipAddress,

                'user_agent' =>
                    $request->userAgent(),

                'is_success' => true,
            ]);

            /*
            |--------------------------------------------------------------------------
            | DEVICE TRACKING
            |--------------------------------------------------------------------------
            */

            $agent = new Agent();

            $agent->setUserAgent(
                $request->userAgent()
            );

            UserDevice::updateOrCreate(

                [
                    'user_id' => $user->id,

                    'ip_address' => $ipAddress,
                ],

                [
                    'device' =>
                        $agent->device(),

                    'browser' =>
                        $agent->browser(),

                    'platform' =>
                        $agent->platform(),

                    'last_login_at' => now(),
                ]
            );

            /*
            |--------------------------------------------------------------------------
            | LOAD RELATIONS
            |--------------------------------------------------------------------------
            */

            $user->load([
                'role',
                'organization.level',
            ]);

            DB::commit();

            return [

                'success' => true,

                'message' =>
                    'Login berhasil',

                'token' => $token,

                'token_type' => 'bearer',

                'expires_in' => $this->guard()
                        ->factory()
                        ->getTTL() * 60,

                'user' => $user,

                'code' => 200,
            ];

        } catch (JWTException $e) {

            DB::rollBack();

            report($e);

            return [

                'success' => false,

                'message' =>
                    'Token authentication gagal',

                'code' => 500,
            ];

        } catch (\Throwable $e) {

            DB::rollBack();

            report($e);

            return [

                'success' => false,

                'message' => config('app.debug')
                    ? $e->getMessage()
                    : 'Terjadi kesalahan server',

                'code' => 500,
            ];
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ME
    |--------------------------------------------------------------------------
    */

    public function me(): ?User
    {
        /** @var User|null $user */
        $user = $this->guard()->user();

        if (!$user) {
            return null;
        }

        return $user->load([
            'role',
            'organization.level',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | REFRESH TOKEN
    |--------------------------------------------------------------------------
    */

    public function refresh(): array
    {
        try {

            $token = $this->guard()->refresh();

            /** @var User|null $user */
            $user = $this->guard()->user();

            return [

                'success' => true,

                'message' =>
                    'Refresh token berhasil',

                'token' => $token,

                'token_type' => 'bearer',

                'expires_in' => $this->guard()
                        ->factory()
                        ->getTTL() * 60,

                'user' => $user?->load([
                    'role',
                    'organization.level',
                ]),

                'code' => 200,
            ];

        } catch (\Throwable $e) {

            report($e);

            return [

                'success' => false,

                'message' =>
                    'Refresh token gagal',

                'code' => 401,
            ];
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    */

    public function logout(): array
    {
        try {

            $this->guard()->logout();

            return [

                'success' => true,

                'message' =>
                    'Logout berhasil',

                'code' => 200,
            ];

        } catch (\Throwable $e) {

            report($e);

            return [

                'success' => false,

                'message' =>
                    'Logout gagal',

                'code' => 500,
            ];
        }
    }
}