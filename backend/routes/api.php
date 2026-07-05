<?php

use App\Http\Controllers\Api\ActivityAttendanceController;
use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AnggotaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlockedIpController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentSpecificationController;
use App\Http\Controllers\Api\JabatanController;
use App\Http\Controllers\Api\KecamatanController;
use App\Http\Controllers\Api\KelurahanController;
use App\Http\Controllers\Api\KotaController;
use App\Http\Controllers\Api\RWController;
use App\Http\Controllers\Api\LoginLogController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\OrganizationLevelController;
use App\Http\Controllers\Api\OrganizationTypeController;
use App\Http\Controllers\Api\ProgramFieldController;
use App\Http\Controllers\Api\ProgramGoalController;
use App\Http\Controllers\Api\ProgramTargetController;
use App\Http\Controllers\Api\ProgramThemeController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\UserDeviceController;
use App\Http\Controllers\Api\WorkProgramController;
use Illuminate\Support\Facades\Route;

Route::middleware([
    'blocked.ip',
])->group(function () {

    Route::prefix('auth')->group(function () {
        Route::post(
            '/login',
            [AuthController::class, 'login']
        )->middleware('throttle:5,1');

        Route::middleware([
            'auth:api'
        ])->group(function () {

            Route::get(
                '/me',
                [AuthController::class, 'me']
            );

            Route::post(
                '/refresh',
                [AuthController::class, 'refresh']
            )->middleware('throttle:10,1');

            Route::post(
                '/logout',
                [AuthController::class, 'logout']
            );
        });
    });

    Route::middleware([
        'auth:api',
    ])->group(function () {

        Route::prefix('dashboard')->group(function () {
            // Dashboard utama - mengambil semua data dashboard
            Route::get('/', [DashboardController::class, 'index']);

            // PERBAIKAN: Statistik dashboard untuk real-time dan data awal
            Route::get('/statistics', [DashboardController::class, 'getStatistics']);

            // Refresh dashboard
            Route::post('/refresh', [DashboardController::class, 'refresh']);

            // Detail data
            Route::get('/organizations', [DashboardController::class, 'getOrganizationsDetail']);
            Route::get('/members', [DashboardController::class, 'getMembersDetail']);
            Route::get('/work-programs', [DashboardController::class, 'getWorkProgramsDetail']);

            // Theme routes
            Route::prefix('themes')->group(function () {
                Route::get('/{themeId}', [DashboardController::class, 'getThemeDetail']);
                Route::get('/{themeId}/chart', [DashboardController::class, 'getThemeChartData']);
                Route::post('/{themeId}/refresh', [DashboardController::class, 'refreshThemeChart']);
                Route::get('/{themeId}/statistics', [DashboardController::class, 'getThemeStatistics']);
            });
        });

        Route::prefix('certificates')->group(function () {
            // Certificate routes
            Route::get('/', [CertificateController::class, 'index']);
            Route::get('/categories', [CertificateController::class, 'getCategories']);
            Route::get('/anggota/{anggotaId}', [CertificateController::class, 'getByAnggota']);
            Route::get('/{id}', [CertificateController::class, 'show']);
            Route::get('/{id}/download', [CertificateController::class, 'download']);
            Route::post('/', [CertificateController::class, 'store']);
            Route::put('/{id}', [CertificateController::class, 'update']);
            Route::delete('/{id}', [CertificateController::class, 'destroy']);

            // Category management routes
            Route::post('/categories', [CertificateController::class, 'storeCategory']);
            Route::put('/categories/{id}', [CertificateController::class, 'updateCategory']);
            Route::delete('/categories/{id}', [CertificateController::class, 'destroyCategory']);
        });

        Route::get(
            'work-programs/available-themes',
            [WorkProgramController::class, 'getAvailableThemesForMWC']
        );

        Route::get(
            'work-programs/active',
            [ProgramThemeController::class, 'getActiveThemes']
        );

        Route::get(
            'organizations/types-with-banom-pc',
            [OrganizationController::class, 'getTypesWithBanomPc']
        );

        Route::get(
            'organizations/available-types-for-banom',
            [OrganizationController::class, 'getAvailableTypesForBanom']
        );

        Route::get(
            'organizations/available-types-for-parent',
            [OrganizationController::class, 'getAvailableTypesForParent']
        );

        Route::get(
            'organizations/available-parents-lembaga-banom',
            [OrganizationController::class, 'getAvailableParentsForLembagaBanom']
        );

        Route::get(
            'organizations/used-kecamatan-for-banom',
            [OrganizationController::class, 'getUsedKecamatanForBanom']
        );

        Route::get(
            'organizations',
            [OrganizationController::class, 'index']
        );

        Route::get(
            'organizations/{organization}',
            [OrganizationController::class, 'show']
        );

        Route::get(
            'organizations/level-filters/{levelId}',
            [OrganizationController::class, 'getLevelFilters']
        );

        Route::get(
            'organizations/by-level',
            [OrganizationController::class, 'getByLevel']
        );

        Route::get(
            'organizations/{organization}/children',
            [OrganizationController::class, 'getChildren']
        );

        Route::get(
            'organizations/{organization}/ancestors',
            [OrganizationController::class, 'getAncestors']
        );

        Route::get(
            'organizations/export',
            [OrganizationController::class, 'export']
        );

        Route::get(
            'organizations/statistics',
            [OrganizationController::class, 'statistics']
        );

        Route::get(
            'organizations/search',
            [OrganizationController::class, 'search']
        );

        Route::get(
            'organizations/available-parents',
            [OrganizationController::class, 'getAvailableParents']
        );

        Route::post(
            'organizations',
            [OrganizationController::class, 'store']
        )->middleware('role_or_level:super-admin,admin,pc,operator,pc');

        Route::put(
            'organizations/{organization}',
            [OrganizationController::class, 'update']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::patch(
            'organizations/{organization}/toggle-active',
            [OrganizationController::class, 'toggleActive']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::delete(
            'organizations/{organization}',
            [OrganizationController::class, 'destroy']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::delete(
            'organizations/bulk',
            [OrganizationController::class, 'bulkDelete']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::get(
            'organization-levels',
            [OrganizationLevelController::class, 'index']
        );

        Route::get(
            'organization-levels/{organizationLevel}',
            [OrganizationLevelController::class, 'show']
        );

        Route::post(
            'organization-levels',
            [OrganizationLevelController::class, 'store']
        )->middleware('role:super-admin');

        Route::put(
            'organization-levels/{organizationLevel}',
            [OrganizationLevelController::class, 'update']
        )->middleware('role:super-admin');

        Route::delete(
            'organization-levels/{organizationLevel}',
            [OrganizationLevelController::class, 'destroy']
        )->middleware('role:super-admin');

        Route::get(
            'organization-types/unused-by-level/{levelId}',
            [OrganizationTypeController::class, 'unusedByLevel']
        );

        Route::get(
            'organization-types/by-level/{organizationLevelId}',
            [OrganizationTypeController::class, 'getByLevel']
        );

        Route::get(
            'organization-types',
            [OrganizationTypeController::class, 'index']
        );

        Route::get(
            'organization-types/{organizationType}',
            [OrganizationTypeController::class, 'show']
        );

        Route::post(
            'organization-types',
            [OrganizationTypeController::class, 'store']
        )->middleware('role_or_level:super-admin,admin,pc');


        Route::put(
            'organization-types/{organizationType}',
            [OrganizationTypeController::class, 'update']
        )->middleware('role_or_level:super-admin,admin,pc');


        Route::delete(
            'organization-types/{organizationType}',
            [OrganizationTypeController::class, 'destroy']
        )->middleware('role_or_level:super-admin,admin,pc');


        Route::get(
            'roles',
            [RoleController::class, 'index']
        );

        Route::get(
            'roles/{role}',
            [RoleController::class, 'show']
        );

        Route::post(
            'roles',
            [RoleController::class, 'store']
        )->middleware('role:super-admin');

        Route::put(
            'roles/{role}',
            [RoleController::class, 'update']
        )->middleware('role:super-admin');

        Route::delete(
            'roles/{role}',
            [RoleController::class, 'destroy']
        )->middleware('role:super-admin');

        Route::prefix('jabatans')->group(function () {
            Route::get('/', [JabatanController::class, 'index']);
            Route::get('/active', [JabatanController::class, 'active']);
            Route::get('/by-level', [JabatanController::class, 'byLevel']);
            Route::get('/statistics', [JabatanController::class, 'statistics']);
            Route::get('/{id}', [JabatanController::class, 'show']);
            Route::post('/', [JabatanController::class, 'store']);
            Route::put('/{id}', [JabatanController::class, 'update']);
            Route::delete('/{id}', [JabatanController::class, 'destroy']);
            Route::patch('/{id}/toggle-active', [JabatanController::class, 'toggleActive']);
        });

        Route::get(
            'users/available-roles/{organizationId}',
            [UserController::class, 'availableRoles']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::get(
            'users',
            [UserController::class, 'index']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::get(
            'users/{user}',
            [UserController::class, 'show']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::post(
            'users',
            [UserController::class, 'store']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::put(
            'users/{user}',
            [UserController::class, 'update']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::delete(
            'users/{user}',
            [UserController::class, 'destroy']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::get(
            'anggotas',
            [AnggotaController::class, 'index']
        );

        Route::get(
            'anggotas/{anggota}',
            [AnggotaController::class, 'show']
        );

        Route::post(
            'anggotas',
            [AnggotaController::class, 'store']
        )->middleware('role:super-admin,admin,operator');

        Route::put(
            'anggotas/{anggota}',
            [AnggotaController::class, 'update']
        )->middleware('role:super-admin,admin,operator');

        Route::delete(
            'anggotas/{anggota}',
            [AnggotaController::class, 'destroy']
        )->middleware('role:super-admin,admin,operator');

        Route::get(
            'document-specifications',
            [DocumentSpecificationController::class, 'index']
        );

        Route::get(
            'document-specifications/{documentSpecification}',
            [DocumentSpecificationController::class, 'show']
        );

        Route::post(
            'document-specifications',
            [DocumentSpecificationController::class, 'store']
        )->middleware('role:super-admin');

        Route::put(
            'document-specifications/{documentSpecification}',
            [DocumentSpecificationController::class, 'update']
        )->middleware('role:super-admin');

        Route::delete(
            'document-specifications/{documentSpecification}',
            [DocumentSpecificationController::class, 'destroy']
        )->middleware('role:super-admin');

        Route::get(
            'kotas/available-for-pc',
            [KotaController::class, 'availableForPC']
        );

        Route::get(
            'kecamatans/by-kota/{kotaId}',
            [KecamatanController::class, 'getByKota']
        );

        Route::get(
            'kecamatans/available-for-banom',
            [KecamatanController::class, 'availableForBanom']
        );

        Route::get(
            'kecamatans/available-for-mwc',
            [KecamatanController::class, 'availableForMWC']
        );

        Route::get(
            'kelurahans/available-for-ranting',
            [KelurahanController::class, 'availableForRanting']
        );

        Route::get(
            'rws/available-for-anak-ranting',
            [RWController::class, 'availableForAnakRanting']
        );

        Route::get(
            'kotas',
            [KotaController::class, 'index']
        );

        Route::get(
            'kotas/{kota}',
            [KotaController::class, 'show']
        );

        Route::get(
            'kecamatans',
            [KecamatanController::class, 'index']
        );

        Route::get(
            'kecamatans/{kecamatan}',
            [KecamatanController::class, 'show']
        );

        Route::get(
            'kelurahans',
            [KelurahanController::class, 'index']
        );

        Route::get(
            'kelurahans/{kelurahan}',
            [KelurahanController::class, 'show']
        );

        Route::get(
            'rws',
            [RWController::class, 'index']
        );

        Route::get(
            'rws/{id}',
            [RWController::class, 'show']
        );

        Route::get(
            'rws/available-for-anak-ranting',
            [RWController::class, 'availableForAnakRanting']
        );

        Route::post(
            'kotas',
            [KotaController::class, 'store']
        )->middleware('role:super-admin');

        Route::put(
            'kotas/{kota}',
            [KotaController::class, 'update']
        )->middleware('role:super-admin');

        Route::delete(
            'kotas/{kota}',
            [KotaController::class, 'destroy']
        )->middleware('role:super-admin');

        Route::post(
            'kecamatans',
            [KecamatanController::class, 'store']
        )->middleware('role:super-admin');

        Route::put(
            'kecamatans/{kecamatan}',
            [KecamatanController::class, 'update']
        )->middleware('role:super-admin');

        Route::delete(
            'kecamatans/{kecamatan}',
            [KecamatanController::class, 'destroy']
        )->middleware('role:super-admin');

        Route::post(
            'kelurahans',
            [KelurahanController::class, 'store']
        )->middleware('role:super-admin');

        Route::put(
            'kelurahans/{kelurahan}',
            [KelurahanController::class, 'update']
        )->middleware('role:super-admin');

        Route::delete(
            'kelurahans/{kelurahan}',
            [KelurahanController::class, 'destroy']
        )->middleware('role:super-admin');

        Route::post(
            'rws',
            [RWController::class, 'store']
        )->middleware('role_or_level:super-admin,admin,pc');


        Route::put(
            'rws/{id}',
            [RWController::class, 'update']
        )->middleware('role:super-admin');

        Route::delete(
            'rws/{id}',
            [RWController::class, 'destroy']
        )->middleware('role:super-admin');

        Route::get(
            'program-themes',
            [ProgramThemeController::class, 'index']
        );

        Route::get(
            'program-themes/{id}',
            [ProgramThemeController::class, 'show']
        );

        Route::get(
            'program-themes/{id}/statistics/{mwcId}',
            [ProgramThemeController::class, 'getThemeStatistics']
        );

        Route::get(
            'program-fields',
            [ProgramFieldController::class, 'index']
        );

        Route::get(
            'program-fields/{id}',
            [ProgramFieldController::class, 'show']
        );

        Route::get(
            'program-targets',
            [ProgramTargetController::class, 'index']
        );

        Route::get(
            'program-targets/{id}',
            [ProgramTargetController::class, 'show']
        );

        Route::get(
            'program-goals',
            [ProgramGoalController::class, 'index']
        );

        Route::get(
            'program-goals/{id}',
            [ProgramGoalController::class, 'show']
        );

        Route::post(
            'program-themes',
            [ProgramThemeController::class, 'store']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::put(
            'program-themes/{id}',
            [ProgramThemeController::class, 'update']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::delete(
            'program-themes/{id}',
            [ProgramThemeController::class, 'destroy']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::post(
            'program-fields',
            [ProgramFieldController::class, 'store']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::put(
            'program-fields/{id}',
            [ProgramFieldController::class, 'update']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::delete(
            'program-fields/{id}',
            [ProgramFieldController::class, 'destroy']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::post(
            'program-targets',
            [ProgramTargetController::class, 'store']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::put(
            'program-targets/{id}',
            [ProgramTargetController::class, 'update']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::delete(
            'program-targets/{id}',
            [ProgramTargetController::class, 'destroy']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::post(
            'program-goals',
            [ProgramGoalController::class, 'store']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::put(
            'program-goals/{id}',
            [ProgramGoalController::class, 'update']
        )->middleware('role_or_level:super-admin,admin,pc');

        Route::delete(
            'program-goals/{id}',
            [ProgramGoalController::class, 'destroy']
        )->middleware('role_or_level:super-admin,admin,pc');

        /*
        |--------------------------------------------------------------------------
        | PROGRAM KERJA MWC - READ (Semua Role)
        |--------------------------------------------------------------------------
        */
        Route::get(
            'work-programs',
            [WorkProgramController::class, 'index']
        );

        Route::get(
            'work-programs/{id}',
            [WorkProgramController::class, 'show']
        );

        Route::get(
            'work-programs/{id}/statistics',
            [WorkProgramController::class, 'getProgramStatistics']
        );

        /*
        |--------------------------------------------------------------------------
        | PROGRAM KERJA MWC - WRITE (Super Admin, Admin PC, Admin MWC)
        |--------------------------------------------------------------------------
        */
        Route::post(
            'work-programs',
            [WorkProgramController::class, 'store']
        )->middleware('role_or_level:super-admin,admin,pc,admin,mwc');

        Route::put(
            'work-programs/{id}',
            [WorkProgramController::class, 'update']
        )->middleware('role_or_level:super-admin,admin,pc,admin,mwc');

        Route::delete(
            'work-programs/{id}',
            [WorkProgramController::class, 'destroy']
        )->middleware('role_or_level:super-admin,admin,pc,admin,mwc');

        /*
        |--------------------------------------------------------------------------
        | KEGIATAN - READ (Semua Role)
        |--------------------------------------------------------------------------
        */
        Route::get(
            '/activities',
            [ActivityController::class, 'index']
        );

        Route::get(
            '/activities/{id}',
            [ActivityController::class, 'show']
        );

        /*
        |--------------------------------------------------------------------------
        | KEGIATAN - WRITE (Super Admin, Admin, Operator)
        |--------------------------------------------------------------------------
        */
        Route::post(
            '/activities',
            [ActivityController::class, 'store']
        )->middleware('role:super-admin,admin,operator');

        Route::post(
            '/activities/{id}',
            [ActivityController::class, 'update']
        )->middleware('role:super-admin,admin,operator');

        Route::patch(
            '/activities/{id}/status',
            [ActivityController::class, 'updateStatus']
        )->middleware('role:super-admin,admin,operator');

        Route::delete(
            '/activities/{id}',
            [ActivityController::class, 'destroy']
        )->middleware('role:super-admin,admin,operator');

        /*
        |--------------------------------------------------------------------------
        | ABSENSI KEGIATAN - Admin & Operator (dengan role_or_level)
        |--------------------------------------------------------------------------
        */
        Route::get(
            '/activities/{activity}/attendance',
            [ActivityAttendanceController::class, 'show']
        )->middleware('role_or_level:super-admin,admin,pc,operator,pc,admin,mwc,operator,mwc,admin,ranting,operator,ranting');

        // =============================================
        // 3. SIMPAN ABSENSI
        // =============================================
        Route::post(
            '/activities/{activity}/attendance',
            [ActivityAttendanceController::class, 'store']
        )->middleware('role_or_level:super-admin,admin,pc,operator,pc,admin,mwc,operator,mwc,admin,ranting,operator,ranting');

        // =============================================
        // 4. MANAJEMEN ORGANISASI PESERTA
        // =============================================

        // 4a. Get organisasi yang tersedia untuk ditambahkan
        Route::get(
            '/activities/{activity}/available-organizations',
            [ActivityAttendanceController::class, 'getAvailableOrganizations']
        )->middleware('role_or_level:super-admin,admin,pc,operator,pc,admin,mwc,operator,mwc,admin,ranting,operator,ranting');

        // 4b. Tambah organisasi peserta
        Route::post(
            '/activities/{activity}/participants',
            [ActivityAttendanceController::class, 'addParticipants']
        )->middleware('role_or_level:super-admin,admin,pc,operator,pc,admin,mwc,operator,mwc,admin,ranting,operator,ranting');

        // 4c. Hapus organisasi peserta
        Route::delete(
            '/activities/{activity}/participants',
            [ActivityAttendanceController::class, 'removeParticipants']
        )->middleware('role_or_level:super-admin,admin,pc,operator,pc,admin,mwc,operator,mwc,admin,ranting,operator,ranting');

        // 4d. Get anggota dari organisasi peserta
        Route::get(
            '/activities/{activity}/participant-anggotas',
            [ActivityAttendanceController::class, 'getParticipantAnggota']
        )->middleware('role_or_level:super-admin,admin,pc,operator,pc,admin,mwc,operator,mwc,admin,ranting,operator,ranting');

        /*
        |--------------------------------------------------------------------------
        | LOG ACTIVITY - HANYA SUPER ADMIN
        |--------------------------------------------------------------------------
        */
        Route::prefix('activity-logs')->middleware('auth:api')->group(function () {
            Route::get('/', [ActivityLogController::class, 'index']);
            Route::get('/modules', [ActivityLogController::class, 'modules']);
            Route::get('/actions', [ActivityLogController::class, 'actions']);
            Route::get('/users', [ActivityLogController::class, 'users']);
            Route::get('/{id}', [ActivityLogController::class, 'show']);
            Route::delete('/{id}', [ActivityLogController::class, 'destroy']);
        });

        /*
        |--------------------------------------------------------------------------
        | LOGIN LOGS - HANYA SUPER ADMIN
        |--------------------------------------------------------------------------
        */
        Route::prefix('login-logs')->middleware('role:super-admin')->group(function () {
            Route::get('/', [LoginLogController::class, 'index']);
            Route::get('/{id}', [LoginLogController::class, 'show']);
            Route::delete('/{id}', [LoginLogController::class, 'destroy']);
        });

        /*
        |--------------------------------------------------------------------------
        | USER DEVICES - HANYA SUPER ADMIN
        |--------------------------------------------------------------------------
        */
        Route::prefix('user-devices')->middleware('role:super-admin')->group(function () {
            Route::get('/', [UserDeviceController::class, 'index']);
            Route::get('/{id}', [UserDeviceController::class, 'show']);
            Route::delete('/{id}', [UserDeviceController::class, 'destroy']);
            Route::delete('/user/{userId}', [UserDeviceController::class, 'destroyByUser']);
        });

        /*
        |--------------------------------------------------------------------------
        | BLOCKED IPS - HANYA SUPER ADMIN
        |--------------------------------------------------------------------------
        */
        Route::prefix('blocked-ips')->middleware('role:super-admin')->group(function () {
            Route::get('/', [BlockedIpController::class, 'index']);
            Route::post('/', [BlockedIpController::class, 'store']);
            Route::get('/{id}', [BlockedIpController::class, 'show']);
            Route::put('/{id}', [BlockedIpController::class, 'update']);
            Route::delete('/{id}', [BlockedIpController::class, 'destroy']);
            Route::patch('/{id}/activate', [BlockedIpController::class, 'activate']);
            Route::patch('/{id}/deactivate', [BlockedIpController::class, 'deactivate']);
        });
    });
});
