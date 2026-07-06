<?php

namespace App\Events;

use App\Models\WorkProgram;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkProgramUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public WorkProgram $workProgram;

    public function __construct(WorkProgram $workProgram)
    {
        $this->workProgram = $workProgram->load(['theme', 'organization', 'activities']);
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
        return 'work-program.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->workProgram->id,
            'theme_id' => $this->workProgram->theme_id,
            'organization_id' => $this->workProgram->organization_id,
            'data' => $this->workProgram->toArray(),
            'timestamp' => now()->toIso8601String(),
        ];
    }
}