import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';

type ClientMeta = {
  id: string;
  userId?: string;
};

type SignalMessage = {
  type: 'join-room' | 'offer' | 'answer' | 'ice-candidate' | 'leave' | 'peer-left';
  roomId: string;
  from?: string;
  to?: string;
  payload?: any;
  userId?: string;
};

// Managed hosts (Render/Railway) provide PORT. Keep SIGNALING_PORT for local use.
const PORT = Number(process.env.PORT || process.env.SIGNALING_PORT || 3005);

const server = createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  response.writeHead(404);
  response.end();
});
const wss = new WebSocketServer({ server });


const rooms = new Map<string, Map<string, { ws: WebSocket; meta: ClientMeta }>>();

function safeSend(ws: WebSocket, data: any) {
  try {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
  } catch (e) {
    console.warn('safeSend failed', e);
  }
}

wss.on('connection', (ws: WebSocket) => {
  let clientId = `c_${Math.random().toString(36).slice(2, 9)}`;
  let joinedRoom: string | null = null;

  ws.on('message', (raw: any) => {
    try {
      const msg = JSON.parse(raw.toString()) as SignalMessage;
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case 'join-room': {
          const room = msg.roomId;
          clientId = msg.from || clientId;
          joinedRoom = room;
          const meta: ClientMeta = { id: clientId, userId: msg.userId };
          if (!rooms.has(room)) rooms.set(room, new Map());
          rooms.get(room)!.set(clientId, { ws, meta });

        
          for (const [otherId, entry] of rooms.get(room)!.entries()) {
            if (otherId === clientId) continue;
            safeSend(entry.ws, { type: 'peer-joined', roomId: room, from: clientId, userId: msg.userId });
          }

          console.log(`client ${clientId} joined room ${room}`);
          break;
        }

        case 'offer':
        case 'answer':
        case 'ice-candidate': {
          const room = msg.roomId;
          if (!room || !rooms.has(room)) return;

         
          if (msg.to) {
            const target = rooms.get(room)!.get(msg.to);
            if (target) safeSend(target.ws, msg);
          } else {
            for (const [otherId, entry] of rooms.get(room)!.entries()) {
              if (otherId === msg.from) continue;
              safeSend(entry.ws, msg);
            }
          }
          break;
        }

        case 'leave': {
          const room = msg.roomId;
          if (!room || !rooms.has(room)) return;
          rooms.get(room)!.delete(msg.from || clientId);
          for (const [, entry] of rooms.get(room)!.entries()) {
            safeSend(entry.ws, { type: 'peer-left', roomId: room, from: msg.from || clientId });
          }
          console.log(`client ${msg.from || clientId} left room ${room}`);
          break;
        }

        default:
          console.warn('unknown message type', msg.type);
      }
    } catch (e) {
      console.error('invalid message', e);
    }
  });

  ws.on('close', () => {
    if (!joinedRoom) return;
    const map = rooms.get(joinedRoom);
    if (!map) return;
    map.delete(clientId);
    for (const [, entry] of map.entries()) {
      safeSend(entry.ws, { type: 'peer-left', roomId: joinedRoom, from: clientId });
    }
    console.log(`connection closed ${clientId} from ${joinedRoom}`);
  });

  ws.on('error', (err: unknown) => console.error('ws error', err));
});

server.listen(PORT, () => console.log(`WebSocket signaling server running on port ${PORT}`));

process.on('SIGINT', () => {
  console.log('Shutting down signaling server');
  wss.close(() => server.close(() => process.exit(0)));
});
