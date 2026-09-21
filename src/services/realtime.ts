import { io, type Socket } from 'socket.io-client';
import { resolveApiBaseUrl } from './api-url.js';

export const createRealtimeSocket = (token: string): Socket => {
  const socketUrl = resolveApiBaseUrl().replace(/\/api\/?$/, '');

  return io(socketUrl, {
    auth: token !== 'cookie' ? { token } : undefined,
    withCredentials: true,
    transports: ['websocket'],
  });
};