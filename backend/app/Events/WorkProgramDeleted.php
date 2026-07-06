<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkProgramDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $workProgramId;
    public ?int $themeId;
    public ?int $organizationId;

    public function __construct(int $workProgramId, ?int $themeId = null, ?int $organizationId = null)
    {
        $this->workProgramId = $workProgramId;
        $this->themeId = $themeId;
        $this->organizationId = $organizationId;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('work-programs'),
            new Channel('dashboard'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'work-program.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->workProgramId,
            'theme_id' => $this->themeId,
            'organization_id' => $this->organizationId,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}