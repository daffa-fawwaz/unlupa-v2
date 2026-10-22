import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'url';
import { verifyJwtToken } from './services/authService';

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  email?: string;
  role?: string;
  rooms?: Set<string>;
  isAlive?: boolean;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private userSockets: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private roomSockets: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  initialize(server: HttpServer) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const { pathname, query } = parse(request.url || '', true);

      // Strictly handle WebSocket requests on path /ws
      // Do not touch any other paths (e.g. Vite HMR or other upgrade requests)
      if (pathname === '/ws') {
        let token = (query.token as string) || '';

        // Also check Authorization header or unlupa_token cookie
        const authHeader = request.headers['authorization'];
        if (!token && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7).trim();
        } else if (!token && request.headers.cookie) {
          const match = request.headers.cookie.match(/(?:^|;\s*)unlupa_token=([^;]+)/);
          if (match) {
            token = decodeURIComponent(match[1]).trim();
          }
        }

        let userPayload: any = null;
        if (token) {
          try {
            userPayload = verifyJwtToken(token);
          } catch (err) {
            console.warn('[WS] Token verification warning (connecting unauthenticated):', err);
          }
        }

        this.wss!.handleUpgrade(request, socket, head, (ws) => {
          const authWs = ws as AuthenticatedWebSocket;
          authWs.rooms = new Set();
          authWs.isAlive = true;

          if (userPayload?.sub) {
            authWs.userId = userPayload.sub;
            authWs.email = userPayload.email;
            authWs.role = userPayload.role;
            this.registerUserSocket(userPayload.sub, authWs);
          }

          this.wss!.emit('connection', authWs, request);
        });
      }
    });

    this.wss.on('connection', (ws: AuthenticatedWebSocket) => {
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Send initial connection acknowledgement
      ws.send(JSON.stringify({
        type: 'CONNECTED',
        userId: ws.userId || null,
        message: 'Connected to Unlupa WebSocket Server',
        timestamp: new Date().toISOString(),
      }));

      ws.on('message', (messageRaw: any) => {
        try {
          const data = JSON.parse(messageRaw.toString());

          // Handle late client authentication
          if (data.type === 'AUTH' && data.token) {
            try {
              const payload = verifyJwtToken(data.token);
              if (payload?.sub) {
                if (ws.userId) {
                  this.unregisterUserSocket(ws.userId, ws);
                }
                ws.userId = payload.sub;
                ws.email = payload.email;
                ws.role = payload.role;
                this.registerUserSocket(payload.sub, ws);
                ws.send(JSON.stringify({
                  type: 'AUTH_SUCCESS',
                  userId: payload.sub,
                  timestamp: new Date().toISOString(),
                }));
              }
            } catch (err) {
              ws.send(JSON.stringify({ type: 'AUTH_ERROR', message: 'Token tidak valid' }));
            }
          } else if (data.type === 'JOIN_ROOM' && typeof data.room === 'string') {
            this.joinRoom(ws, data.room);
            ws.send(JSON.stringify({ type: 'ROOM_JOINED', room: data.room }));
          } else if (data.type === 'LEAVE_ROOM' && typeof data.room === 'string') {
            this.leaveRoom(ws, data.room);
            ws.send(JSON.stringify({ type: 'ROOM_LEFT', room: data.room }));
          } else if (data.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
          }
        } catch (err) {
          console.warn('[WS] Failed to parse message:', err);
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.unregisterUserSocket(ws.userId, ws);
        }
        if (ws.rooms) {
          ws.rooms.forEach(room => this.leaveRoom(ws, room));
        }
      });

      ws.on('error', (err) => {
        console.warn('[WS] Socket error:', err);
      });
    });

    // Heartbeat ping interval every 30 seconds
    const interval = setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((ws: WebSocket) => {
        const authWs = ws as AuthenticatedWebSocket;
        if (authWs.isAlive === false) {
          return authWs.terminate();
        }
        authWs.isAlive = false;
        authWs.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });

    console.log('[WS] WebSocket Server active on /ws');
  }

  private registerUserSocket(userId: string, ws: AuthenticatedWebSocket) {
    const cleanId = userId.replace(/^std-user-/, '').replace(/^user-/, '');
    if (!this.userSockets.has(cleanId)) {
      this.userSockets.set(cleanId, new Set());
    }
    this.userSockets.get(cleanId)!.add(ws);
  }

  private unregisterUserSocket(userId: string, ws: AuthenticatedWebSocket) {
    const cleanId = userId.replace(/^std-user-/, '').replace(/^user-/, '');
    const sockets = this.userSockets.get(cleanId);
    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) {
        this.userSockets.delete(cleanId);
      }
    }
  }

  joinRoom(ws: AuthenticatedWebSocket, room: string) {
    if (!this.roomSockets.has(room)) {
      this.roomSockets.set(room, new Set());
    }
    this.roomSockets.get(room)!.add(ws);
    ws.rooms?.add(room);
  }

  leaveRoom(ws: AuthenticatedWebSocket, room: string) {
    const sockets = this.roomSockets.get(room);
    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) {
        this.roomSockets.delete(room);
      }
    }
    ws.rooms?.delete(room);
  }

  /**
   * Send realtime payload to all active sockets belonging to a specific user
   */
  broadcastToUser(userId: string, data: any) {
    const cleanId = userId.replace(/^std-user-/, '').replace(/^user-/, '');
    const sockets = this.userSockets.get(cleanId);
    if (!sockets || sockets.size === 0) return;
    const msg = JSON.stringify(data);
    sockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(msg);
        } catch (e) {
          console.warn('[WS] Send error to user:', cleanId, e);
        }
      }
    });
  }

  /**
   * Send realtime payload to all active sockets in a specific room (e.g. class:classId)
   */
  broadcastToRoom(room: string, data: any) {
    const sockets = this.roomSockets.get(room);
    if (!sockets || sockets.size === 0) return;
    const msg = JSON.stringify(data);
    sockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(msg);
        } catch (e) {
          console.warn('[WS] Send error to room:', room, e);
        }
      }
    });
  }

  /**
   * Broadcast payload to every connected client
   */
  broadcastAll(data: any) {
    if (!this.wss) return;
    const msg = JSON.stringify(data);
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(msg);
        } catch (e) {
          console.warn('[WS] Broadcast all error:', e);
        }
      }
    });
  }
}

export const wsManager = new WebSocketManager();
