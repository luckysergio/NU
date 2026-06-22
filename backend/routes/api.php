<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\ActivityAttendanceController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AnggotaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlockedIpController;
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

        /*
        |--------------------------------------------------------------------------
        | ORGANIZATIONS (SPECIFIC ROUTES MUST COME FIRST)
        |--------------------------------------------------------------------------
        */

        Route::get(
            'organizations/available-parents-lembaga-banom',
            [OrganizationController::class, 'getAvailableParentsForLembagaBanom']
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
            'organizations/used-kecamatan-for-banom',
            [OrganizationController::class, 'getUsedKecamatanForBanom']
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

        Route::patch(
            'organizations/{organization}/toggle-active',
            [OrganizationController::class, 'toggleActive']
        );

        Route::delete(
            'organizations/bulk',
            [OrganizationController::class, 'bulkDelete']
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

        Route::get(
            'organizations',
            [OrganizationController::class, 'index']
        );

        Route::get(
            'organizations/{organization}',
            [OrganizationController::class, 'show']
        );

        /*
        |--------------------------------------------------------------------------
        | ORGANIZATION LEVELS
        |--------------------------------------------------------------------------
        */

        Route::get(
            'organization-levels',
            [OrganizationLevelController::class, 'index']
        );

        Route::get(
            'organization-levels/{organizationLevel}',
            [OrganizationLevelController::class, 'show']
        );

        /*
        |--------------------------------------------------------------------------
        | ORGANIZATION TYPES
        |--------------------------------------------------------------------------
        */

        Route::get(
            'organization-types/unused-by-level/{levelId}',
            [OrganizationTypeController::class, 'unusedByLevel']
        );

        Route::get(
            'organization-types',
            [OrganizationTypeController::class, 'index']
        );

        Route::get(
            'organization-types/{organizationType}',
            [OrganizationTypeController::class, 'show']
        );

        /*
        |--------------------------------------------------------------------------
        | ROLES
        |--------------------------------------------------------------------------
        */

        Route::get(
            'roles',
            [RoleController::class, 'index']
        );

        Route::get(
            'roles/{role}',
            [RoleController::class, 'show']
        );

        /*
        |--------------------------------------------------------------------------
        | JABATANS
        |--------------------------------------------------------------------------
        */

        Route::get(
            'jabatans',
            [JabatanController::class, 'index']
        );

        Route::get(
            'jabatans/{jabatan}',
            [JabatanController::class, 'show']
        );

        /*
        |--------------------------------------------------------------------------
        | REGION MASTER
        |--------------------------------------------------------------------------
        */

        Route::get(
            'kotas',
            [KotaController::class, 'index']
        );

        Route::get(
            'kecamatans/by-kota/{kotaId}',
            [KecamatanController::class, 'getByKota']
        );

        Route::get(
            'kotas/available-for-pc',
            [KotaController::class, 'availableForPC']
        );

        Route::get(
            'kotas/{kota}',
            [KotaController::class, 'show']
        );

        Route::get(
            'kecamatans/available-for-mwc',
            [KecamatanController::class, 'availableForMWC']
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
            'kelurahans/available-for-ranting',
            [KelurahanController::class, 'availableForRanting']
        );

        Route::get(
            'kelurahans',
            [KelurahanController::class, 'index']
        );

        Route::get(
            'kelurahans/{kelurahan}',
            [KelurahanController::class, 'show']
        );

        /*
        |--------------------------------------------------------------------------
        | RW
        |--------------------------------------------------------------------------
        */

        Route::get('work-programs/active', [ProgramThemeController::class, 'getActiveThemes']);

        Route::get(
            'rws/available-for-anak-ranting',
            [RWController::class, 'availableForAnakRanting']
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
            'work-programs/available-themes',
            [WorkProgramController::class, 'getAvailableThemesForMWC']
        );

        Route::get('program-themes/{id}/statistics/{mwcId}', [ProgramThemeController::class, 'getThemeStatistics']);

        Route::get(
            'program-themes',
            [ProgramThemeController::class, 'index']
        );

        Route::get(
            'program-themes/{id}',
            [ProgramThemeController::class, 'show']
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

        Route::get(
            'work-programs',
            [WorkProgramController::class, 'index']
        );

        Route::get(
            'work-programs/{id}',
            [WorkProgramController::class, 'show']
        );

        Route::get('work-programs/{id}/statistics', [WorkProgramController::class, 'getProgramStatistics']);

        /*
        |--------------------------------------------------------------------------
        | ACTIVITIES
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

        Route::get(
            '/activities/{activityId}/participants',
            [ActivityAttendanceController::class, 'getParticipants']
        );

        Route::get(
            '/activities/{activityId}/available-organizations',
            [ActivityAttendanceController::class, 'getAvailableOrganizations']
        );

        Route::get(
            '/activities/{activityId}/attendance',
            [ActivityAttendanceController::class, 'getAttendance']
        );

        Route::get(
            '/activities/organizations/{organizationId}/anggotas',
            [ActivityAttendanceController::class, 'getAnggotaByOrganization']
        );
    });

    Route::middleware([
        'auth:api',
        'role:super-admin,admin,operator',
    ])->group(function () {

        /*
        |--------------------------------------------------------------------------
        | USERS
        |--------------------------------------------------------------------------
        */

        Route::get(
            'users/available-roles/{organizationId}',
            [UserController::class, 'availableRoles']
        );

        Route::apiResource(
            'users',
            UserController::class
        );

        /*
        |--------------------------------------------------------------------------
        | ORGANIZATIONS (WRITE OPERATIONS)
        |--------------------------------------------------------------------------
        */

        Route::post(
            'organizations',
            [OrganizationController::class, 'store']
        );

        Route::put(
            'organizations/{organization}',
            [OrganizationController::class, 'update']
        );

        Route::delete(
            'organizations/{organization}',
            [OrganizationController::class, 'destroy']
        );

        /*
        |--------------------------------------------------------------------------
        | ORGANIZATION LEVELS
        |--------------------------------------------------------------------------
        */

        Route::get(
            'organization-types/by-level/{organizationLevelId}',
            [OrganizationTypeController::class, 'getByLevel']
        );

        Route::post(
            'organization-levels',
            [OrganizationLevelController::class, 'store']
        );

        Route::put(
            'organization-levels/{organizationLevel}',
            [OrganizationLevelController::class, 'update']
        );

        Route::delete(
            'organization-levels/{organizationLevel}',
            [OrganizationLevelController::class, 'destroy']
        );

        /*
        |--------------------------------------------------------------------------
        | ORGANIZATION TYPES
        |--------------------------------------------------------------------------
        */

        Route::post(
            'organization-types',
            [OrganizationTypeController::class, 'store']
        );

        Route::put(
            'organization-types/{organizationType}',
            [OrganizationTypeController::class, 'update']
        );

        Route::delete(
            'organization-types/{organizationType}',
            [OrganizationTypeController::class, 'destroy']
        );

        /*
        |--------------------------------------------------------------------------
        | ROLES
        |--------------------------------------------------------------------------
        */

        Route::post(
            'roles',
            [RoleController::class, 'store']
        );

        Route::put(
            'roles/{role}',
            [RoleController::class, 'update']
        );

        Route::delete(
            'roles/{role}',
            [RoleController::class, 'destroy']
        );

        /*
        |--------------------------------------------------------------------------
        | REGION MASTER (WRITE OPERATIONS)
        |--------------------------------------------------------------------------
        */

        Route::post(
            'kotas',
            [KotaController::class, 'store']
        );

        Route::put(
            'kotas/{kota}',
            [KotaController::class, 'update']
        );

        Route::delete(
            'kotas/{kota}',
            [KotaController::class, 'destroy']
        );

        Route::post(
            'kecamatans',
            [KecamatanController::class, 'store']
        );

        Route::put(
            'kecamatans/{kecamatan}',
            [KecamatanController::class, 'update']
        );

        Route::delete(
            'kecamatans/{kecamatan}',
            [KecamatanController::class, 'destroy']
        );

        Route::post(
            'kelurahans',
            [KelurahanController::class, 'store']
        );

        Route::put(
            'kelurahans/{kelurahan}',
            [KelurahanController::class, 'update']
        );

        Route::delete(
            'kelurahans/{kelurahan}',
            [KelurahanController::class, 'destroy']
        );

        Route::post(
            'rws',
            [RWController::class, 'store']
        );

        Route::put(
            'rws/{id}',
            [RWController::class, 'update']
        );

        Route::delete(
            'rws/{id}',
            [RWController::class, 'destroy']
        );

        /*
        |--------------------------------------------------------------------------
        | MASTER DATA
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'anggotas',
            AnggotaController::class
        );

        Route::post(
            'jabatans',
            [JabatanController::class, 'store']
        );

        Route::put(
            'jabatans/{jabatan}',
            [JabatanController::class, 'update']
        );

        Route::delete(
            'jabatans/{jabatan}',
            [JabatanController::class, 'destroy']
        );

        Route::apiResource(
            'document-specifications',
            DocumentSpecificationController::class
        );

        Route::post(
            'program-themes',
            [ProgramThemeController::class, 'store']
        );

        Route::put(
            'program-themes/{id}',
            [ProgramThemeController::class, 'update']
        );

        Route::delete(
            'program-themes/{id}',
            [ProgramThemeController::class, 'destroy']
        );

        Route::apiResource(
            'program-fields',
            ProgramFieldController::class
        )->except(['index', 'show']);

        Route::apiResource(
            'program-targets',
            ProgramTargetController::class
        )->except(['index', 'show']);

        Route::apiResource(
            'program-goals',
            ProgramGoalController::class
        )->except(['index', 'show']);

        Route::post(
            'work-programs',
            [WorkProgramController::class, 'store']
        );

        Route::put(
            'work-programs/{id}',
            [WorkProgramController::class, 'update']
        );

        Route::delete(
            'work-programs/{id}',
            [WorkProgramController::class, 'destroy']
        );

        /*
        |--------------------------------------------------------------------------
        | ACTIVITIES (WRITE OPERATIONS)
        |--------------------------------------------------------------------------
        */

        Route::post(
            '/activities',
            [ActivityController::class, 'store']
        );

        Route::post(
            '/activities/{id}',
            [ActivityController::class, 'update']
        );

        Route::patch(
            '/activities/{id}/status',
            [ActivityController::class, 'updateStatus']
        );

        Route::delete(
            '/activities/{id}',
            [ActivityController::class, 'destroy']
        );

        Route::post(
            '/activities/{activityId}/participants',
            [ActivityAttendanceController::class, 'addParticipants']
        );

        Route::post(
            '/activities/{activityId}/attendance/admin',
            [ActivityAttendanceController::class, 'saveAttendance']
        );

        Route::post(
            '/activities/{activityId}/attendance/self',
            [ActivityAttendanceController::class, 'selfAttendance']
        );

        Route::post(
            '/activities/{activityId}/feedback',
            [ActivityAttendanceController::class, 'submitFeedback']
        );
    });


    Route::middleware([
        'auth:api',
        'role:super-admin',
    ])->group(function () {

        /*
        |--------------------------------------------------------------------------
        | ACTIVITY LOGS
        |--------------------------------------------------------------------------
        */

        Route::prefix('activity-logs')->group(function () {

            Route::get(
                '/',
                [ActivityLogController::class, 'index']
            );

            Route::get(
                '/modules',
                [ActivityLogController::class, 'modules']
            );

            Route::get(
                '/actions',
                [ActivityLogController::class, 'actions']
            );

            Route::get(
                '/{id}',
                [ActivityLogController::class, 'show']
            );

            Route::delete(
                '/{id}',
                [ActivityLogController::class, 'destroy']
            );
        });

        /*
        |--------------------------------------------------------------------------
        | LOGIN LOGS
        |--------------------------------------------------------------------------
        */

        Route::prefix('login-logs')->group(function () {

            Route::get(
                '/',
                [LoginLogController::class, 'index']
            );

            Route::get(
                '/{id}',
                [LoginLogController::class, 'show']
            );

            Route::delete(
                '/{id}',
                [LoginLogController::class, 'destroy']
            );
        });

        /*
        |--------------------------------------------------------------------------
        | USER DEVICES
        |--------------------------------------------------------------------------
        */

        Route::prefix('user-devices')->group(function () {

            Route::get(
                '/',
                [UserDeviceController::class, 'index']
            );

            Route::get(
                '/{id}',
                [UserDeviceController::class, 'show']
            );

            Route::delete(
                '/{id}',
                [UserDeviceController::class, 'destroy']
            );

            Route::delete(
                '/user/{userId}',
                [UserDeviceController::class, 'destroyByUser']
            );
        });

        /*
        |--------------------------------------------------------------------------
        | BLOCKED IPS
        |--------------------------------------------------------------------------
        */

        Route::prefix('blocked-ips')->group(function () {

            Route::get(
                '/',
                [BlockedIpController::class, 'index']
            );

            Route::post(
                '/',
                [BlockedIpController::class, 'store']
            );

            Route::get(
                '/{id}',
                [BlockedIpController::class, 'show']
            );

            Route::put(
                '/{id}',
                [BlockedIpController::class, 'update']
            );

            Route::delete(
                '/{id}',
                [BlockedIpController::class, 'destroy']
            );

            Route::patch(
                '/{id}/activate',
                [BlockedIpController::class, 'activate']
            );

            Route::patch(
                '/{id}/deactivate',
                [BlockedIpController::class, 'deactivate']
            );
        });
    });
});
