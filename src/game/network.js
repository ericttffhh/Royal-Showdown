import { Peer } from 'peerjs';

/**
 * WebRTC P2P Room Matchmaking & Synchronization
 */

export class NetworkEngine {
  constructor(callbacks = {}) {
    this.callbacks = callbacks; // { onConnected, onData, onError, onDisconnected, onPeerJoined, onPeerLeft }
    this.peer = null;
    this.conn = null; // 當作為客端時連接至房主的連線
    this.conns = []; // 當作為房主時所維護的多個好友連線列表
    this.isHost = false;
    this.roomCode = '';
  }

  // 生成 6 位大亂鬥 / 雙人對戰房間代碼
  static generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'ROYAL';
    for (let i = 0; i < 3; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom(onCodeReady, customPrefix = 'clash3d') {
    this.disconnect();
    this.isHost = true;
    this.conns = [];
    this.roomCode = NetworkEngine.generateRoomCode();
    const peerId = `${customPrefix}-${this.roomCode.toLowerCase()}`;

    this.peer = new Peer(peerId, { debug: 1 });

    this.peer.on('open', (id) => {
      onCodeReady?.(this.roomCode);
    });

    this.peer.on('connection', (conn) => {
      this.conns.push(conn);
      this.setupHostPeerConnection(conn);
    });

    this.peer.on('error', (err) => {
      console.error('Peer host error:', err);
      this.callbacks.onError?.(err.type === 'unavailable-id' ? '房間代碼已被佔用，請重新創建' : '網路連線異常，請重試');
    });
  }

  joinRoom(code, customPrefix = 'clash3d') {
    this.disconnect();
    this.isHost = false;
    this.roomCode = code.trim().toUpperCase();
    const targetPeerId = `${customPrefix}-${this.roomCode.toLowerCase()}`;

    this.peer = new Peer({ debug: 1 });

    this.peer.on('open', () => {
      this.conn = this.peer.connect(targetPeerId, { reliable: true });
      this.setupClientConnection();
    });

    this.peer.on('error', (err) => {
      console.error('Peer join error:', err);
      this.callbacks.onError?.('無法連線至指定房間，請確認房間代碼是否正確且房主在線');
    });
  }

  setupHostPeerConnection(conn) {
    conn.on('open', () => {
      this.callbacks.onPeerJoined?.(conn.peer, this.conns.length);
      this.callbacks.onConnected?.(true);
    });

    conn.on('data', (data) => {
      this.callbacks.onData?.(data, conn.peer);
    });

    conn.on('close', () => {
      this.conns = this.conns.filter(c => c !== conn);
      this.callbacks.onPeerLeft?.(conn.peer, this.conns.length);
      if (this.conns.length === 0) {
        this.callbacks.onDisconnected?.();
      }
    });

    conn.on('error', (err) => {
      console.warn('Peer connection error:', err);
      this.callbacks.onError?.(err);
    });
  }

  setupClientConnection() {
    if (!this.conn) return;

    this.conn.on('open', () => {
      this.callbacks.onConnected?.(false);
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

  // 廣播或單播資料
  send(data) {
    if (this.isHost) {
      // 房主向所有在線好友群發廣播
      this.conns.forEach(c => {
        if (c && c.open) {
          try { c.send(data); } catch (e) {}
        }
      });
    } else {
      // 客端發送給房主
      if (this.conn && this.conn.open) {
        try { this.conn.send(data); } catch (e) {}
      }
    }
  }

  getConnectedCount() {
    return this.isHost ? this.conns.length : (this.conn && this.conn.open ? 1 : 0);
  }

  disconnect() {
    if (this.conn) {
      try { this.conn.close(); } catch (e) {}
      this.conn = null;
    }
    if (this.conns && this.conns.length > 0) {
      this.conns.forEach(c => {
        try { c.close(); } catch (e) {}
      });
      this.conns = [];
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
  }
}
