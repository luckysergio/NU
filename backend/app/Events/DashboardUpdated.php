<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DashboardUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public array $payload
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('dashboard'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'dashboard.updated';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}