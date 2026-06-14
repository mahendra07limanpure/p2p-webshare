const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { randomBytes } = require('crypto');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const rooms = {};

io.on('connection', (socket) => {
  console.log('🔌 connected:', socket.id);

  // --- FIX 1: Server generates roomId and emits 'room-created' ---
  socket.on('create-room', () => {
   const roomId = randomBytes(3).toString('hex').toUpperCase();
    rooms[roomId] = { senderId: socket.id, receiverId: null };
    socket.join(roomId);
    socket.emit('room-created', { roomId }); // ← client expects this
    console.log(`📦 Room created: ${roomId} by ${socket.id}`);
  });

  // --- FIX 2: Accept { roomId } object, emit 'room-joined' and 'peer-joined' ---
socket.on('join-room', ({ roomId }) => {
    console.log(`🔍 join-room received: "${roomId}" from ${socket.id}`);
    console.log(`🔍 existing rooms:`, Object.keys(rooms));
    const room = rooms[roomId];
    if (!room) {
      console.log(`❌ Room "${roomId}" not found in:`, rooms);
      socket.emit('room-not-found');
      return;
    }
    room.receiverId = socket.id;
    socket.join(roomId);
    socket.emit('room-joined', { roomId });
    io.to(room.senderId).emit('peer-joined');
    console.log(`👤 Receiver joined room: ${roomId}`);
});

  // --- FIX 3: Unified 'signal' relay replacing offer/answer/ice-candidate ---
  socket.on('signal', ({ roomId, data }) => {
    socket.to(roomId).emit('signal', { data }); // relay to the other peer
  });

  // --- Disconnect: unchanged ---
  socket.on('disconnect', () => {
    console.log('❌ disconnected:', socket.id);
    for (const [roomId, room] of Object.entries(rooms)) {
      if (room.senderId === socket.id || room.receiverId === socket.id) {
        socket.to(roomId).emit('peer-disconnected');
        delete rooms[roomId];
        console.log(`🗑️ Room ${roomId} cleaned up`);
      }
    }
  });
});

const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_URL) {
  setInterval(() => {
    fetch(RENDER_URL).catch(() => {});
    console.log('🏓 Keep-alive ping sent');
  }, 14 * 60 * 1000);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Signaling server running on http://localhost:${PORT}`);
});