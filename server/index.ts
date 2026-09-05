import { createServer, type IncomingMessage } from "node:http";
import { parse } from "node:url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import type { ClientMessage } from "../src/shared/types";
import { Room } from "./room";
import { randomCode } from "./engine";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

const rooms = new Map<string, Room>();
const ROOM_IDLE_MS = 45 * 60 * 1000;

function createRoom(): Room {
  const code = randomCode((c) => rooms.has(c));
  const room = new Room(code);
  rooms.set(code, room);
  return room;
}

// Reap rooms nobody has touched for a while.
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (room.isEmpty && now - room.lastActivity > ROOM_IDLE_MS) {
      room.destroy();
      rooms.delete(code);
    }
  }
}, 60_000).unref();

const app = next({ dev, hostname, port, turbopack: dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url ?? "/", true));
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req: IncomingMessage, socket, head) => {
    const { pathname } = parse(req.url ?? "/");
    if (pathname !== "/ws") {
      // Let Next (HMR) handle its own upgrades in dev; otherwise drop.
      if (!dev) socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  });

  wss.on("connection", (ws: WebSocket & { isAlive?: boolean }) => {
    let room: Room | null = null;
    ws.isAlive = true;
    ws.on("pong", () => (ws.isAlive = true));

    ws.on("message", (data) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return;
      }
      if (!msg || typeof msg !== "object") return;

      switch (msg.type) {
        case "ping":
          ws.send(JSON.stringify({ type: "pong", now: Date.now() }));
          return;
        case "host:create": {
          room?.leave(ws);
          room = createRoom();
          room.attachHost(ws, room.hostToken);
          return;
        }
        case "host:attach": {
          const target = rooms.get(String(msg.code));
          if (!target) return ws.send(JSON.stringify({ type: "error", code: "room-not-found", message: "That room has expired." }));
          if (!target.attachHost(ws, String(msg.hostToken))) {
            return ws.send(JSON.stringify({ type: "error", code: "bad-token", message: "You're not the host of this room." }));
          }
          room?.leave(ws);
          room = target;
          return;
        }
        case "join": {
          const target = rooms.get(String(msg.code).trim());
          if (!target) return ws.send(JSON.stringify({ type: "error", code: "room-not-found", message: "No room with that code. Check the big screen!" }));
          room?.leave(ws);
          room = target;
          target.join(ws, String(msg.name ?? ""), msg.avatar);
          return;
        }
        case "rejoin": {
          const target = rooms.get(String(msg.code));
          if (!target || !target.rejoin(ws, String(msg.id), String(msg.token))) {
            return ws.send(JSON.stringify({ type: "error", code: "room-not-found", message: "That game is over. Join a new one!" }));
          }
          room?.leave(ws);
          room = target;
          return;
        }
        default:
          room?.handle(ws, msg);
      }
    });

    ws.on("close", () => room?.leave(ws));
    ws.on("error", () => room?.leave(ws));
  });

  // Keepalive so proxies don't drop idle sockets.
  setInterval(() => {
    for (const client of wss.clients as Set<WebSocket & { isAlive?: boolean }>) {
      if (client.isAlive === false) {
        client.terminate();
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
  }, 25_000).unref();

  server.listen(port, hostname, () => {
    console.log(`\n  🏪  Slurplash ready → http://localhost:${port}\n`);
  });
});
