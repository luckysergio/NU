<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ActivityDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $activityId;
    public ?int $workProgramId;
    public ?int $themeId;
    public ?int $organizationId;

    public function __construct(int $activityId, ?int $workProgramId = null, ?int $themeId = null, ?int $organizationId = null)
    {
        $this->activityId = $activityId;
        $this->workProgramId = $workProgramId;
        $this->themeId = $themeId;
        $this->organizationId = $organizationId;
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
        return 'activity.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->activityId,
            'work_program_id' => $this->workProgramId,
            'theme_id' => $this->themeId,
            'organization_id' => $this->organizationId,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}