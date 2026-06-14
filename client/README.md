# Beam — P2P WebShare (new UI)

A re-skinned frontend for the p2p-webshare project. Same WebRTC + Socket.io
mechanics, completely new "glassmorphism / aurora gradient" UI built with
React + Vite + Tailwind.

## Setup

```bash
# 1. Install dependencies
cd client
npm install

# 2. Configure the signaling server URL
cp .env.example .env
# edit .env if your server isn't on http://localhost:3001

# 3. Run the dev server
npm run dev
# → http://localhost:5173

# 4. In another terminal, run your server (the one you copied)
cd ../server
npm install
node index.js
```

## Build for production

```bash
npm run build    # outputs to client/dist
npm run preview  # preview the production build locally
```

If deploying to Vercel/Netlify, set the `VITE_SERVER_URL` environment
variable to your deployed signaling server's URL (e.g.
`https://your-server.onrender.com`).

## ⚠️ Important: matching your server's socket events

This frontend assumes the signaling protocol described in the original
repo's README (documented in detail at the top of `src/socket.js`):

| Direction | Event | Payload |
|---|---|---|
| client → server | `create-room` | — |
| client → server | `join-room` | `{ roomId }` |
| client → server | `signal` | `{ roomId, data }` |
| server → client | `room-created` | `{ roomId }` |
| server → client | `room-joined` | `{ roomId }` |
| server → client | `room-not-found` | — |
| server → client | `peer-joined` | — |
| server → client | `signal` | `{ data }` |
| server → client | `peer-disconnected` | — |

**Open `server/index.js` from the folder you copied and check the
`socket.on(...)` / `io.emit(...)` calls.** If the event names or payload
shapes differ even slightly, update only the corresponding lines in
`src/hooks/useWebRTC.js` (the `emit`/`on` calls near the bottom of the
file) — no other file needs to change.

One other thing to check: this UI uppercases whatever room code the user
types (`roomInput.trim().toUpperCase()` in `Receiver.jsx`). If your server
generates lowercase or mixed-case room IDs, either make the server
generate uppercase IDs, or remove `.toUpperCase()` in `Receiver.jsx`.

## What changed from the original

- Brand-new UI: dark/light "aurora" gradient background, frosted glass
  cards, animated "beam" connector between Send/Receive on the home screen.
- Same core logic: 16KB chunked transfer over a WebRTC DataChannel,
  SHA-256 hash computed before sending and verified on arrival,
  `bufferedAmountLowThreshold` flow control, auto-download on completion,
  invite-link auto-fill (`?room=CODE`), graceful disconnect handling.
- File structure:
  ```
  client/
  ├── index.html              # Tailwind CDN, fonts, aurora background CSS
  ├── src/
  │   ├── App.jsx              # routing (home / send / receive), theme toggle
  │   ├── socket.js             # socket.io client + protocol docs
  │   ├── hooks/
  │   │   └── useWebRTC.js      # signaling + WebRTC + chunking/hashing
  │   └── components/
  │       ├── ui.jsx            # GlassPanel, buttons, progress bar, etc.
  │       ├── Home.jsx
  │       ├── Sender.jsx
  │       └── Receiver.jsx
  ```
