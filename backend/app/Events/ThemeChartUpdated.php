<?php
// app/Events/ThemeChartUpdated.php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ThemeChartUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $themeId,
        public array $data
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('theme-chart.' . $this->themeId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'theme.chart.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'theme_id' => $this->themeId,
            'data' => $this->data,
            'updated_at' => now()->toISOString(),
        ];
    }
}