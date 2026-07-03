<?php
namespace App\Events;

use App\Models\Organization;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrganizationDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $organizationId;

    public function __construct(int $organizationId)
    {
        $this->organizationId = $organizationId;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('organizations'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'organization.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->organizationId,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}