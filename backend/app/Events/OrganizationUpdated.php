<?php
// app/Events/OrganizationUpdated.php

namespace App\Events;

use App\Models\Organization;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrganizationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $action;
    public ?array $organization;
    public ?int $deletedId;
    public string $timestamp;

    public function __construct(string $action, ?Organization $organization = null, ?int $deletedId = null)
    {
        $this->action = $action;
        $this->deletedId = $deletedId;
        $this->timestamp = now()->toISOString();

        if ($organization) {
            $this->organization = [
                'id' => $organization->id,
                'nama' => $organization->nama,
                'slug' => $organization->slug,
                'level' => $organization->level?->nama,
                'level_slug' => $organization->level?->slug,
                'type' => $organization->type?->nama,
                'is_active' => $organization->is_active,
                'parent_id' => $organization->parent_id,
                'parent_name' => $organization->parent?->nama,
                'kota' => $organization->kota?->nama,
                'kecamatan' => $organization->kecamatan?->nama,
                'kelurahan' => $organization->kelurahan?->nama,
                'rw' => $organization->rw?->nomor,
                'alamat' => $organization->alamat,
                'telepon' => $organization->telepon,
                'email' => $organization->email,
                'created_at' => $organization->created_at?->toISOString(),
                'updated_at' => $organization->updated_at?->toISOString(),
            ];
        } else {
            $this->organization = null;
        }
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('organizations'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'organization.updated';
    }

    public function broadcastWith(): array
    {
        $payload = [
            'action' => $this->action,
            'timestamp' => $this->timestamp,
        ];

        if ($this->deletedId) {
            $payload['deleted_id'] = $this->deletedId;
        }

        if ($this->organization) {
            $payload['organization'] = $this->organization;
        }

        return $payload;
    }
}