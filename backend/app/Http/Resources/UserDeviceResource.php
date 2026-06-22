<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserDeviceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(
        Request $request
    ): array {

        return [

            'id' => $this->id,

            'device' => $this->device,

            'browser' => $this->browser,

            'platform' => $this->platform,

            'ip_address' => $this->ip_address,

            'last_login_at' => $this->last_login_at,

            'user' => $this->whenLoaded(
                'user',
                function () {

                    return [

                        'id' => $this->user?->id,

                        'name' => $this->user?->name,

                        'email' => $this->user?->email,

                        'role' => $this->user?->role?->nama,

                        'organization' =>
                            $this->user?->organization?->nama,
                    ];
                }
            ),

            'created_at' => $this->created_at,
        ];
    }
}