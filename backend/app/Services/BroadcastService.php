<?php

namespace App\Services;

use App\Events\DashboardUpdated;

class BroadcastService
{
    public function dashboardUpdated(): void
    {
        event(new DashboardUpdated([
            'updated_at' => now()->toISOString(),
        ]));
    }
}