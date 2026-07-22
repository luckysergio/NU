import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY || 'your-app-key',
  wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
  wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
  wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
  forceTLS: false,
  enabledTransports: ['ws'],
  disableStats: true,
  authEndpoint: '/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      Accept: 'application/json',
    },
  },
});

export default echo;