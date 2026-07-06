<?php

namespace App\Events;

use App\Models\ProgramTheme;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProgramThemeCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ProgramTheme $theme;

    public function __construct(ProgramTheme $theme)
    {
        $this->theme = $theme->load(['creator', 'organization']);
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
        return 'program-theme.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->theme->id,
            'data' => $this->theme->toArray(),
            'timestamp' => now()->toIso8601String(),
        ];
    }
}