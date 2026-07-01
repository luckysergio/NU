// src/services/echo.js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let echoInstance = null;
let connectionAttempts = 0;
const MAX_ATTEMPTS = 5;

export const getEcho = () => {
  if (!echoInstance && connectionAttempts < MAX_ATTEMPTS) {
    try {
      const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
      const reverbHost = import.meta.env.VITE_REVERB_HOST || '127.0.0.1';
      const reverbPort = import.meta.env.VITE_REVERB_PORT || 8080;
      const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || 'http';

      console.log('🔌 Connecting to Reverb:', { reverbHost, reverbPort, reverbScheme });

      echoInstance = new Echo({
        broadcaster: 'reverb',
        key: reverbKey,
        wsHost: reverbHost,
        wsPort: reverbPort,
        wssPort: reverbPort,
        forceTLS: reverbScheme === 'https',
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        reverb: {
          key: reverbKey,
        },
      });

      // Cek koneksi setelah beberapa saat
      setTimeout(() => {
        try {
          if (echoInstance && echoInstance.connector) {
            const socket = echoInstance.connector.socket;
            if (socket) {
              console.log('✅ Echo connected, readyState:', socket.readyState);
              if (socket.readyState === 1) {
                connectionAttempts = 0;
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Error checking echo connection:', error.message);
        }
      }, 1000);

      connectionAttempts = 0;
    } catch (error) {
      connectionAttempts++;
      console.error(`❌ Echo connection error (attempt ${connectionAttempts}/${MAX_ATTEMPTS}):`, error);
      echoInstance = null;
      
      if (connectionAttempts >= MAX_ATTEMPTS) {
        console.warn('⚠️ Max connection attempts reached, real-time features disabled');
      }
    }
  }
  return echoInstance;
};

export const reconnectEcho = () => {
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch (e) {
      // ignore
    }
    echoInstance = null;
  }
  connectionAttempts = 0;
  return getEcho();
};

// Cek koneksi secara periodik
let connectionCheckInterval = null;

export const startConnectionCheck = () => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  
  connectionCheckInterval = setInterval(() => {
    try {
      if (echoInstance && echoInstance.connector) {
        const socket = echoInstance.connector.socket;
        if (socket && socket.readyState === 3) { // CLOSED
          console.log('🔌 WebSocket disconnected, attempting reconnect...');
          reconnectEcho();
        }
      }
    } catch (error) {
      // ignore
    }
  }, 30000); // Cek setiap 30 detik
};

export const stopConnectionCheck = () => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
};

// Initialize echo
const echo = getEcho();

// Start connection check jika echo berhasil dibuat
if (echo) {
  startConnectionCheck();
}

export default echo;

// Helper functions
export const isEchoConnected = () => {
  if (!echoInstance) return false;
  try {
    const socket = echoInstance.connector?.socket;
    return socket && socket.readyState === 1;
  } catch (error) {
    return false;
  }
};

export const forceReconnect = () => {
  console.log('🔄 Force reconnecting Echo...');
  return reconnectEcho();
};