const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = process.env.PORT || 3000;

// rooms: slug -> Map<peerId, WebSocket>
const rooms = new Map();

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
};

const server = http.createServer((req, res) => {
  // Anything under /room/* serves the SPA
  const filePath = req.url.startsWith('/room/')
    ? path.join(__dirname, 'public', 'index.html')
    : path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const params = new URL(req.url, 'http://x').searchParams;
  const slug = params.get('room');

  if (!slug) { ws.close(1008, 'room param required'); return; }

  const peerId = uid();

  if (!rooms.has(slug)) rooms.set(slug, new Map());
  const room = rooms.get(slug);

  const existingIds = [...room.keys()];

  room.set(peerId, ws);

  // Tell the newcomer their ID and who's already here
  ws.send(JSON.stringify({ type: 'welcome', peerId, peers: existingIds }));

  // Tell existing peers someone joined
  broadcast(room, peerId, { type: 'peer-joined', peerId });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // Relay signal (offer/answer/ice) to a specific peer
    if (msg.type === 'signal' && msg.to) {
      const target = room.get(msg.to);
      if (target?.readyState === WebSocket.OPEN) {
        target.send(JSON.stringify({ type: 'signal', from: peerId, data: msg.data }));
      }
    }
  });

  ws.on('close', () => {
    room.delete(peerId);
    if (room.size === 0) rooms.delete(slug);
    broadcast(room, null, { type: 'peer-left', peerId });
  });
});

function broadcast(room, excludeId, msg) {
  const payload = JSON.stringify(msg);
  for (const [id, ws] of room) {
    if (id !== excludeId && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(`Example room: http://localhost:${PORT}/room/standup`);
});
