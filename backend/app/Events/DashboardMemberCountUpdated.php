<?php
// app/Events/DashboardMemberCountUpdated.php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DashboardMemberCountUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $totalMembers;
    public array $statistics;
    public array $totals;

    public function __construct(int $totalMembers, array $statistics = [], array $totals = [])
    {
        $this->totalMembers = $totalMembers;
        $this->statistics = $statistics;
        $this->totals = $totals;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('dashboard'),
            new Channel('anggota'),
        ];
    }

    // PERBAIKAN: Tambahkan prefix 'dashboard.' agar match dengan frontend
    public function broadcastAs(): string
    {
        return 'dashboard.member.count.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'total_members' => $this->totalMembers,
            'statistics' => $this->statistics,
            'totals' => $this->totals,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}