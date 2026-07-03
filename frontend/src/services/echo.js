// services/echo.js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

// Debug: cek environment variables
console.log('Reverb Config:', {
  key: import.meta.env.VITE_REVERB_APP_KEY,
  host: import.meta.env.VITE_REVERB_HOST,
  port: import.meta.env.VITE_REVERB_PORT,
  scheme: import.meta.env.VITE_REVERB_SCHEME,
});

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY || 'your-app-key',
  wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
  wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
  wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
  forceTLS: false, // Development: false
  enabledTransports: ['ws'],
  disableStats: true,
  // Tambahkan untuk debug
  authEndpoint: '/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      Accept: 'application/json',
    },
  },
});

// Event listener untuk debug
echo.connector.socket?.on('open', () => {
  console.log('[Reverb] ✅ Connected successfully!');
});

echo.connector.socket?.on('close', (event) => {
  console.log('[Reverb] ❌ Connection closed:', event.code, event.reason);
});

echo.connector.socket?.on('error', (error) => {
  console.error('[Reverb] ❌ Connection error:', error);
});

export default echo;