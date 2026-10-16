type WebSocketEventHandler = (data: any) => void;

class WebSocketClientService {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private listeners: Map<string, Set<WebSocketEventHandler>> = new Map();
  private reconnectTimeout: any = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 10000;
  private isExplicitlyClosed = false;
  private activeRooms: Set<string> = new Set();
  private pingInterval: any = null;

  connect(token?: string) {
    if (token) {
      this.token = token;
    }

    // Don't reconnect if already open or connecting with same token
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      if (this.token && this.socket.readyState === WebSocket.OPEN) {
        this.send({ type: 'AUTH', token: this.token });
      }
      return;
    }

    this.isExplicitlyClosed = false;
    clearTimeout(this.reconnectTimeout);

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const queryToken = this.token ? `?token=${encodeURIComponent(this.token)}` : '';
      const wsUrl = `${protocol}//${host}/ws${queryToken}`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        // Re-join any active rooms
        this.activeRooms.forEach(room => {
          this.send({ type: 'JOIN_ROOM', room });
        });

        // Start ping heartbeat every 20 seconds
        clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.send({ type: 'PING' });
          }
        }, 20000);

        this.emit('STATUS_CHANGE', { connected: true });
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type) {
            this.emit(payload.type, payload);
            this.emit('*', payload);
          }
        } catch (err) {
          console.warn('[WS-Client] Parse error:', err);
        }
      };

      this.socket.onclose = (event) => {
        clearInterval(this.pingInterval);
        this.emit('STATUS_CHANGE', { connected: false });
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[WS-Client] Socket error notice:', err);
      };
    } catch (e) {
      console.warn('[WS-Client] Connect error:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    clearTimeout(this.reconnectTimeout);
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    clearTimeout(this.reconnectTimeout);
    clearInterval(this.pingInterval);
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {}
      this.socket = null;
    }
  }

  send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
      } catch (err) {
        console.warn('[WS-Client] Send error:', err);
      }
    }
  }

  joinRoom(room: string) {
    this.activeRooms.add(room);
    this.send({ type: 'JOIN_ROOM', room });
  }

  leaveRoom(room: string) {
    this.activeRooms.delete(room);
    this.send({ type: 'LEAVE_ROOM', room });
  }

  on(eventType: string, handler: WebSocketEventHandler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);
    return () => this.off(eventType, handler);
  }

  off(eventType: string, handler: WebSocketEventHandler) {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  private emit(eventType: string, data: any) {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach(h => {
        try {
          h(data);
        } catch (e) {
          console.error('[WS-Client] Handler error for event:', eventType, e);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketClientService();
