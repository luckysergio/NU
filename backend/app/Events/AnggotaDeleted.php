<?php
// app/Events/AnggotaDeleted.php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnggotaDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $anggotaId;

    public function __construct(int $anggotaId)
    {
        $this->anggotaId = $anggotaId;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('anggota'),
            new Channel('dashboard'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'anggota.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->anggotaId,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}