<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DashboardOrganizationCountUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $totalOrganizations;
    public array $statistics;
    public array $totals;

    public function __construct(int $totalOrganizations, array $statistics = [], array $totals = [])
    {
        $this->totalOrganizations = $totalOrganizations;
        $this->statistics = $statistics;
        $this->totals = $totals;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('dashboard'),
            new Channel('organizations'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'dashboard.organization.count.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'total_organizations' => $this->totalOrganizations,
            'statistics' => $this->statistics,
            'totals' => $this->totals,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}