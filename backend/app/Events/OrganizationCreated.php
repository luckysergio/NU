<?php

namespace App\Events;

use App\Models\Organization;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrganizationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Organization $organization;

    public function __construct(Organization $organization)
    {
        $this->organization = $organization->load(['level', 'type', 'parent', 'parent.level']);
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('organizations'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'organization.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->organization->id,
            'data' => $this->organization->toArray(),
            'timestamp' => now()->toIso8601String(),
        ];
    }
}