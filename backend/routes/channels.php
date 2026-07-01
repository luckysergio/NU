<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('dashboard', function () {
    return true;
});

Broadcast::channel('theme-chart.{themeId}', function ($user, $themeId) {
    return true;
});

Broadcast::channel('organizations', function ($user) {
    return true;
});