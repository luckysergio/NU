<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'name' => $this->name,

            'email' => $this->email,

            'username' => $this->username,

            'phone' => $this->phone,

            'role' => [
                'id' => $this->role?->id,
                'nama' => $this->role?->nama,
                'slug' => $this->role?->slug,
            ],

            'organization' => [
                'id' => $this->organization?->id,
                'nama' => $this->organization?->nama,
                'level' => $this->organization?->level?->slug,
            ],

            'last_login_at' => $this->last_login_at,

            'last_login_ip' => $this->last_login_ip,
        ];
    }
}
