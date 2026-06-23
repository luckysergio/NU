<?php

use App\Http\Middleware\CheckBlockedIp;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\RoleOrLevelMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))

    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )

    ->withMiddleware(function (Middleware $middleware) {

        $middleware->alias([

            'role' => RoleMiddleware::class,
            'role_or_level' => RoleOrLevelMiddleware::class,
            'blocked.ip' => CheckBlockedIp::class,

        ]);
    })

    ->withExceptions(function (Exceptions $exceptions) {

        //
    })->create();