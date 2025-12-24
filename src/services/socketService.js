// src/services/socketService.js
import { io } from 'socket.io-client';


// Use Vite env variable or fallback to deploy link
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://100.31.177.152';

let socket;

export function connectSocket(token) {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
    });
  }
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
