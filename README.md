# voiceover

Minimal browser-based voice chat. No accounts, no installs — just share a link.

## How it works

- Navigate to `/room/<name>` (or type a room name on the landing page) to join a voice call
- Everyone with the same room URL is connected via WebRTC peer-to-peer audio
- Avatars pulse when someone is speaking
- Copy the room link with one click to invite others

The Node.js server is a lightweight WebSocket signaling relay — it never touches audio. All audio flows directly between browsers.

## Stack

- **Server:** Node.js + [`ws`](https://github.com/websockets/ws) (no framework)
- **Client:** Vanilla JS, WebRTC, Web Audio API

## Run locally

```bash
npm install
npm start
# http://localhost:3000
```

Set `PORT` to override the default:

```bash
PORT=8080 npm start
```

## Deploy

The server requires no database or external services. Any platform that runs Node.js works (Railway, Fly, Render, etc.).

For production, put the server behind HTTPS/WSS — browsers require a secure context to access the microphone.
