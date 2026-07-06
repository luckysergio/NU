<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DashboardProgramCountUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $totalThemes;
    public array $activeThemes;
    public array $statistics;

    public function __construct(int $totalThemes, array $activeThemes, array $statistics)
    {
        $this->totalThemes = $totalThemes;
        $this->activeThemes = $activeThemes;
        $this->statistics = $statistics;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('dashboard'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'dashboard.program.count.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'total_themes' => $this->totalThemes,
            'active_themes' => $this->activeThemes,
            'statistics' => $this->statistics,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}