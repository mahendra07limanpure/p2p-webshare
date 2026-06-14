import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// Reuse existing socket instance if already created (prevents double-connect in React StrictMode)
const socket = globalThis.__socket ?? io(URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});

globalThis.__socket = socket;

export default socket;
export { socket };