<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Reverb Server
    |--------------------------------------------------------------------------
    */

    'default' => env('REVERB_SERVER', 'reverb'),

    /*
    |--------------------------------------------------------------------------
    | Reverb Servers
    |--------------------------------------------------------------------------
    */

    'servers' => [

        'reverb' => [
            'host' => env('REVERB_SERVER_HOST', '0.0.0.0'),
            'port' => (int) env('REVERB_SERVER_PORT', 8080),
            'path' => env('REVERB_SERVER_PATH', ''),
            'hostname' => env('REVERB_HOST', '127.0.0.1'),

            'options' => [
                'tls' => [],
            ],

            'max_request_size' => (int) env('REVERB_MAX_REQUEST_SIZE', 10000),

            'scaling' => [
                'enabled' => env('REVERB_SCALING_ENABLED', false),

                'channel' => env('REVERB_SCALING_CHANNEL', 'reverb'),

                'server' => [
                    'url' => env('REDIS_URL'),

                    'host' => env('REDIS_HOST', '127.0.0.1'),

                    'port' => (int) env('REDIS_PORT', 6379),

                    'username' => env('REDIS_USERNAME'),

                    'password' => env('REDIS_PASSWORD'),

                    'database' => (int) env('REDIS_DB', 0),

                    'timeout' => (int) env('REDIS_TIMEOUT', 60),
                ],
            ],

            'pulse_ingest_interval' => (int) env('REVERB_PULSE_INGEST_INTERVAL', 15),

            'telescope_ingest_interval' => (int) env('REVERB_TELESCOPE_INGEST_INTERVAL', 15),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Applications
    |--------------------------------------------------------------------------
    */

    'apps' => [

        'provider' => 'config',

        'apps' => [

            [

                'app_id' => env('REVERB_APP_ID'),

                'key' => env('REVERB_APP_KEY'),

                'secret' => env('REVERB_APP_SECRET'),

                'options' => [

                    'host' => env('REVERB_HOST', '127.0.0.1'),

                    'port' => (int) env('REVERB_PORT', 8080),

                    'scheme' => env('REVERB_SCHEME', 'http'),

                    'useTLS' => env('REVERB_SCHEME') === 'https',

                ],

                'allowed_origins' => ['*'],

                'ping_interval' => (int) env('REVERB_APP_PING_INTERVAL', 60),

                'activity_timeout' => (int) env('REVERB_APP_ACTIVITY_TIMEOUT', 30),

                'max_connections' => env('REVERB_APP_MAX_CONNECTIONS'),

                'max_message_size' => (int) env('REVERB_APP_MAX_MESSAGE_SIZE', 10000),

                'accept_client_events_from' => env(
                    'REVERB_APP_ACCEPT_CLIENT_EVENTS_FROM',
                    'members'
                ),

                'rate_limiting' => [

                    'enabled' => env('REVERB_APP_RATE_LIMITING_ENABLED', false),

                    'max_attempts' => (int) env(
                        'REVERB_APP_RATE_LIMIT_MAX_ATTEMPTS',
                        60
                    ),

                    'decay_seconds' => (int) env(
                        'REVERB_APP_RATE_LIMIT_DECAY_SECONDS',
                        60
                    ),

                    'terminate_on_limit' => env(
                        'REVERB_APP_RATE_LIMIT_TERMINATE',
                        false
                    ),

                ],

            ],

        ],

    ],

];