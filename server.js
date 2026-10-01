import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4322;

// MIME types for static asset serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

// =========================================================================
// 1. HTTP SERVER (Static files & Room API)
// =========================================================================

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  // Root redirect to polydice.html
  if (pathname === '/' || pathname === '') {
    pathname = '/polydice.html';
  }

  // REST API: Quick room status check
  if (pathname === '/api/rooms' && req.method === 'GET') {
    const publicRooms = Array.from(rooms.values()).map(r => ({
      id: r.id,
      playerCount: r.players.size,
      hostName: r.players.get(r.hostId)?.name || 'Host',
      activeTurn: r.players.get(r.activeTurnPlayerId)?.name || null
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ rooms: publicRooms }));
    return;
  }

  const filePath = path.normalize(path.join(__dirname, pathname));

  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

// =========================================================================
// 2. ROOM & MULTIPLAYER WEBSOCKET BROKER
// =========================================================================

const wss = new WebSocketServer({ server });

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} name
 * @property {boolean} isHost
 * @property {boolean} connected
 * @property {Array} trayDice
 * @property {Array} poolMaterials
 * @property {Array} poolStyles
 * @property {WebSocket} ws
 */

/**
 * @typedef {Object} Room
 * @property {string} id
 * @property {string} hostId
 * @property {string} activeTurnPlayerId
 * @property {Map<string, Player>} players
 * @property {Array} rollLog
 */

const rooms = new Map();

function generateRoomId() {
  const words = ['TAVERN', 'DRAGON', 'DUNGEON', 'CRYSTAL', 'MYSTIC', 'SHADOW', 'TITAN', 'SOLAR', 'ASTRAL', 'GOBLIN'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${word}-${num}`;
}

function getSafeRoomSnapshot(room) {
  const playersList = Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    isHost: p.id === room.hostId,
    isTurn: p.id === room.activeTurnPlayerId,
    connected: p.connected,
    trayDice: p.trayDice || [],
    poolMaterials: p.poolMaterials || [],
    poolStyles: p.poolStyles || []
  }));

  return {
    roomId: room.id,
    hostId: room.hostId,
    activeTurnPlayerId: room.activeTurnPlayerId,
    activeTurnPlayerName: room.players.get(room.activeTurnPlayerId)?.name || null,
    players: playersList,
    rollLog: room.rollLog.slice(-50)
  };
}

function broadcastToRoom(room, message, excludeWs = null) {
  const data = typeof message === 'string' ? message : JSON.stringify(message);
  for (const player of room.players.values()) {
    if (player.connected && player.ws && player.ws.readyState === WebSocket.OPEN) {
      if (player.ws !== excludeWs) {
        player.ws.send(data);
      }
    }
  }
}

wss.on('connection', (ws) => {
  let currentRoomId = null;
  let currentPlayerId = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (e) {
      return;
    }

    switch (msg.action) {
      // -------------------------------------------------------------
      // CREATE OR JOIN ROOM
      // -------------------------------------------------------------
      case 'join_room': {
        const reqRoomId = (msg.roomId || '').trim().toUpperCase() || generateRoomId();
        const playerName = (msg.playerName || '').trim() || `Player ${Math.floor(100 + Math.random() * 900)}`;
        const playerId = msg.playerId || ('p_' + crypto.randomBytes(4).toString('hex'));

        let room = rooms.get(reqRoomId);
        let isHost = false;

        if (!room) {
          room = {
            id: reqRoomId,
            hostId: playerId,
            activeTurnPlayerId: playerId,
            players: new Map(),
            rollLog: []
          };
          rooms.set(reqRoomId, room);
          isHost = true;
        } else if (room.players.size === 0 || !room.players.has(room.hostId)) {
          room.hostId = playerId;
          isHost = true;
        }

        currentRoomId = reqRoomId;
        currentPlayerId = playerId;

        const player = {
          id: playerId,
          name: playerName,
          isHost: isHost || room.hostId === playerId,
          connected: true,
          trayDice: msg.trayDice || ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'],
          poolMaterials: msg.poolMaterials || [],
          poolStyles: msg.poolStyles || [],
          ws
        };

        room.players.set(playerId, player);

        // If no active turn player or active player disconnected, set to current
        if (!room.activeTurnPlayerId || !room.players.has(room.activeTurnPlayerId)) {
          room.activeTurnPlayerId = playerId;
        }

        // Send confirmation to the joining player
        ws.send(JSON.stringify({
          action: 'joined_room_success',
          playerId,
          isHost: player.isHost,
          room: getSafeRoomSnapshot(room)
        }));

        // Broadcast updated room state to all other players
        broadcastToRoom(room, {
          action: 'room_state_updated',
          event: `${playerName} joined the room`,
          room: getSafeRoomSnapshot(room)
        }, ws);

        console.log(`[PolyDice Server] ${playerName} (${playerId}) joined room ${reqRoomId}`);
        break;
      }

      // -------------------------------------------------------------
      // SYNC TRAY STATE (Dice Pool, Materials, Styles)
      // -------------------------------------------------------------
      case 'sync_tray': {
        if (!currentRoomId || !currentPlayerId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;

        const player = room.players.get(currentPlayerId);
        if (!player) return;

        if (Array.isArray(msg.trayDice)) player.trayDice = msg.trayDice;
        if (Array.isArray(msg.poolMaterials)) player.poolMaterials = msg.poolMaterials;
        if (Array.isArray(msg.poolStyles)) player.poolStyles = msg.poolStyles;

        broadcastToRoom(room, {
          action: 'player_tray_updated',
          playerId: currentPlayerId,
          trayDice: player.trayDice,
          poolMaterials: player.poolMaterials,
          poolStyles: player.poolStyles
        }, ws);
        break;
      }

      // -------------------------------------------------------------
      // SET ACTIVE TURN (Host Only)
      // -------------------------------------------------------------
      case 'set_turn': {
        if (!currentRoomId || !currentPlayerId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;

        // Ensure only the host can officially change turns
        if (room.hostId !== currentPlayerId) {
          ws.send(JSON.stringify({ action: 'error', message: 'Only the room host can change turns' }));
          return;
        }

        const targetPlayerId = msg.targetPlayerId;
        const targetPlayer = room.players.get(targetPlayerId);
        if (!targetPlayer) return;

        room.activeTurnPlayerId = targetPlayerId;

        console.log(`[PolyDice Server] Host passed turn to ${targetPlayer.name} (${targetPlayerId}) in room ${room.id}`);

        broadcastToRoom(room, {
          action: 'turn_changed',
          activeTurnPlayerId: targetPlayerId,
          activeTurnPlayerName: targetPlayer.name,
          forceFocus: true, // Notifies all clients to switch view to this player's tray
          room: getSafeRoomSnapshot(room)
        });
        break;
      }

      // -------------------------------------------------------------
      // AUTHORITATIVE SERVER-SIDE RNG ROLL
      // -------------------------------------------------------------
      case 'request_roll': {
        if (!currentRoomId || !currentPlayerId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;

        const player = room.players.get(currentPlayerId);
        if (!player) return;

        // Verify turn permissions: allow active player OR host
        if (room.activeTurnPlayerId !== currentPlayerId && room.hostId !== currentPlayerId) {
          ws.send(JSON.stringify({ action: 'error', message: "It is not your turn to roll!" }));
          return;
        }

        const diceTypes = Array.isArray(msg.diceTypes) && msg.diceTypes.length > 0
          ? msg.diceTypes
          : (player.trayDice && player.trayDice.length > 0 ? player.trayDice : ['d20']);

        const targets = [];
        let total = 0;

        // Secure Cryptographic RNG computation on server
        for (const type of diceTypes) {
          const rawNum = parseInt(String(type).replace(/\D/g, ''), 10);
          const maxVal = (!isNaN(rawNum) && rawNum > 0) ? rawNum : 6;

          // crypto.randomInt(min, max) -> [min, max - 1]
          const rollVal = crypto.randomInt(1, maxVal + 1);
          targets.push(rollVal);
          total += rollVal;
        }

        const rollLogEntry = {
          id: 'roll_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
          timestamp: Date.now(),
          playerId: player.id,
          playerName: player.name,
          diceTypes,
          targets,
          total,
          rollPower: typeof msg.rollPower === 'number' ? msg.rollPower : 1.0
        };

        room.rollLog.push(rollLogEntry);
        if (room.rollLog.length > 100) {
          room.rollLog.shift();
        }

        console.log(`[PolyDice Server] ROLL in ${room.id} by ${player.name}: ${diceTypes.join(', ')} -> [${targets.join(', ')}] = ${total}`);

        // Broadcast verified roll event with targets to all connected room clients for 3D physics playback
        broadcastToRoom(room, {
          action: 'broadcast_roll',
          roll: rollLogEntry,
          room: getSafeRoomSnapshot(room)
        });
        break;
      }

      // -------------------------------------------------------------
      // CHAT / ROLL ANNOTATION MESSAGE
      // -------------------------------------------------------------
      case 'chat_message': {
        if (!currentRoomId || !currentPlayerId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;

        const player = room.players.get(currentPlayerId);
        if (!player) return;

        const text = String(msg.text || '').trim();
        if (!text) return;

        broadcastToRoom(room, {
          action: 'chat_message',
          id: 'chat_' + Date.now(),
          timestamp: Date.now(),
          senderId: player.id,
          senderName: player.name,
          text
        });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!currentRoomId || !currentPlayerId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const player = room.players.get(currentPlayerId);
    if (player) {
      player.connected = false;
      console.log(`[PolyDice Server] ${player.name} (${player.id}) disconnected from ${currentRoomId}`);

      // If host disconnected, reassign to next available connected player
      if (room.hostId === currentPlayerId) {
        const nextHost = Array.from(room.players.values()).find(p => p.connected && p.id !== currentPlayerId);
        if (nextHost) {
          room.hostId = nextHost.id;
          nextHost.isHost = true;
          console.log(`[PolyDice Server] Host transferred to ${nextHost.name} in room ${room.id}`);
        }
      }

      // If active turn player disconnected, reassign turn to host
      if (room.activeTurnPlayerId === currentPlayerId) {
        room.activeTurnPlayerId = room.hostId;
      }

      broadcastToRoom(room, {
        action: 'room_state_updated',
        event: `${player.name} disconnected`,
        room: getSafeRoomSnapshot(room)
      });
    }

    // Clean up empty room after 10 minutes of inactivity
    const activeCount = Array.from(room.players.values()).filter(p => p.connected).length;
    if (activeCount === 0) {
      setTimeout(() => {
        const stillActive = Array.from(room.players.values()).filter(p => p.connected).length;
        if (stillActive === 0) {
          rooms.delete(room.id);
          console.log(`[PolyDice Server] Pruned inactive room ${room.id}`);
        }
      }, 10 * 60 * 1000);
    }
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🎲 PolyDice Multiplayer Room Server is Live!`);
  console.log(`📡 URL: http://localhost:${PORT}/polydice.html`);
  console.log(`⚡ WebSocket Broker listening on port ${PORT}`);
  console.log(`=======================================================`);
});
