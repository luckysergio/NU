<?php

namespace App\Events;

use App\Models\Anggota;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnggotaCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Anggota $anggota;

    public function __construct(Anggota $anggota)
    {
        $this->anggota = $anggota->load(['organization', 'jabatan']);
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
        return 'anggota.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->anggota->id,
            'data' => $this->anggota->toArray(),
            'timestamp' => now()->toIso8601String(),
        ];
    }
}