<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProgramThemeDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $themeId;

    public function __construct(int $themeId)
    {
        $this->themeId = $themeId;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('program-themes'),
            new Channel('dashboard'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'program-theme.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->themeId,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}