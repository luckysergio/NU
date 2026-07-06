<?php

namespace App\Events;

use App\Models\Activity;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ActivityUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Activity $activity;

    public function __construct(Activity $activity)
    {
        $this->activity = $activity->load(['workProgram']);
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('activities'),
            new Channel('dashboard'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'activity.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->activity->id,
            'work_program_id' => $this->activity->work_program_id,
            'theme_id' => $this->activity->workProgram?->theme_id,
            'organization_id' => $this->activity->workProgram?->organization_id,
            'data' => $this->activity->toArray(),
            'timestamp' => now()->toIso8601String(),
        ];
    }
}