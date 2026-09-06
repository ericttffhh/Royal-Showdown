import { Peer } from 'peerjs';

/**
 * WebRTC P2P Room Matchmaking & Synchronization
 */

export class NetworkEngine {
  constructor(callbacks = {}) {
    this.callbacks = callbacks; // { onConnected, onData, onError, onDisconnected }
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.roomCode = '';
  }

  // Generate a random 6-character room code
  static generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'ROYAL';
    for (let i = 0; i < 3; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom(onCodeReady) {
    this.isHost = true;
    this.roomCode = NetworkEngine.generateRoomCode();
    const peerId = `clash3d-${this.roomCode.toLowerCase()}`;

    this.peer = new Peer(peerId, {
      debug: 1
    });

    this.peer.on('open', (id) => {
      onCodeReady?.(this.roomCode);
    });

    this.peer.on('connection', (conn) => {
      this.conn = conn;
      this.setupConnection();
    });

    this.peer.on('error', (err) => {
      console.error('Peer error:', err);
      this.callbacks.onError?.(err.type === 'unavailable-id' ? '房间代码已被占用，请重试' : '网络连接异常');
    });
  }

  joinRoom(code) {
    this.isHost = false;
    this.roomCode = code.trim().toUpperCase();
    const targetPeerId = `clash3d-${this.roomCode.toLowerCase()}`;

    this.peer = new Peer({ debug: 1 });

    this.peer.on('open', () => {
      this.conn = this.peer.connect(targetPeerId, { reliable: true });
      this.setupConnection();
    });

    this.peer.on('error', (err) => {
      console.error('Join error:', err);
      this.callbacks.onError?.('无法连接至指定房间，请检查房间码是否正确');
    });
  }

  setupConnection() {
    if (!this.conn) return;

    this.conn.on('open', () => {
      this.callbacks.onConnected?.(this.isHost);
    });

    this.conn.on('data', (data) => {
      this.callbacks.onData?.(data);
    });

    this.conn.on('close', () => {
      this.callbacks.onDisconnected?.();
    });

    this.conn.on('error', (err) => {
      this.callbacks.onError?.(err);
    });
  }

  send(data) {
    if (this.conn && this.conn.open) {
      this.conn.send(data);
    }
  }

  disconnect() {
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}
