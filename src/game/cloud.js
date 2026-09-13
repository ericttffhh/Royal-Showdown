import PeerPackage from 'peerjs';
const Peer = PeerPackage.Peer || PeerPackage;

/**
 * 皇室對決 3D - 帳號名稱 / Gmail 跨設備全自動雲端即時同步引擎 (Zero-Friction Auto Cloud Sync)
 * 結合 WebRTC P2P 直連、Vercel Serverless 與同網域 API，徹底杜絕 CORS 攔截
 */

class CloudSyncService {
  constructor() {
    this.syncDebounceTimer = null;
    this.isSyncing = false;
    this.lastSavedTimestamp = 0;
    this.lastLoadedTimestamp = 0;
    this.pinRegistryKey = 'royal_cloud_pin_registry_v5';
    this.localCacheRegistryKey = 'royal_cloud_slug_cache_v5';
    this.updateListeners = [];
    this.heartbeatTimer = null;
    this.currentUserGetter = null;
    this.currentPeerHost = null;

    this.setupWindowListeners();
  }

  // 註冊遠端存檔變更監聽器
  onRemoteUpdate(callback) {
    if (typeof callback === 'function') {
      this.updateListeners.push(callback);
    }
  }

  notifyRemoteUpdate(newSaveData) {
    this.updateListeners.forEach(cb => {
      try {
        cb(newSaveData);
      } catch (e) {
        console.error('Remote update listener error:', e);
      }
    });
  }

  // 將字串轉為安全唯一的 URL 識別 Slug
  toSafeSlug(prefix, str) {
    if (!str || !str.trim()) return null;
    const clean = str.trim().toLowerCase();
    let hex = '';
    for (let i = 0; i < clean.length; i++) {
      hex += clean.charCodeAt(i).toString(16).padStart(4, '0');
    }
    return `${prefix}_${hex}`;
  }

  // 根據使用者帳號物件提取所有關聯的唯一雲端識別碼 (訪客帳號完全獨立，不生成共享 Slug)
  getAccountSlugs(user) {
    if (!user || user.authType === 'guest') return [];
    const slugs = [];

    // 1. 根據 Google Sub ID 綁定 (全球唯一)
    if (user.googleId) {
      const gSlug = this.toSafeSlug('royal_g', String(user.googleId));
      if (gSlug) slugs.push(gSlug);
    }

    // 2. 根據 Gmail / 電子郵件綁定 (全球唯一)
    if (user.email && user.email.includes('@')) {
      const eSlug = this.toSafeSlug('royal_e', user.email.trim().toLowerCase());
      if (eSlug) slugs.push(eSlug);
    }

    // 3. 根據本地具名已註冊帳號綁定 (非預設訪客名)
    if (user.authType === 'local' && user.username && user.username.trim()) {
      const u = user.username.trim();
      if (u !== '皇家領主' && !u.startsWith('皇家領主 #') && u !== '訪客領主') {
        const uSlug = this.toSafeSlug('royal_u', u);
        if (uSlug) slugs.push(uSlug);
      }
    }

    return slugs;
  }

  // 設定視窗與背景監聽器
  setupWindowListeners() {
    if (typeof window === 'undefined') return;

    const triggerQuickSync = () => {
      if (this.currentUserGetter) {
        const user = this.currentUserGetter();
        if (user && user.authType !== 'guest') {
          this.checkAndPullRemote(user);
        }
      }
    };

    window.addEventListener('focus', triggerQuickSync);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        triggerQuickSync();
      }
    });
    window.addEventListener('online', triggerQuickSync);

    // 啟動背景心跳自動校準 (僅對已登入/具名帳號)
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && !this.isSyncing) {
        triggerQuickSync();
      }
    }, 8000);
  }

  setAccountProvider(provider) {
    this.currentUserGetter = provider;
  }

  /**
   * 檢查並自動拉取遠端最新存檔資料包 (僅對已登入帳號生效，訪客完全本地隔離)
   */
  async checkAndPullRemote(user) {
    if (!user || user.authType === 'guest' || this.isSyncing) return null;
    try {
      const remoteData = await this.loadAccountFromServer(user);
      if (remoteData) {
        const remoteTimestamp = remoteData.timestamp || 0;
        const remoteLevel = remoteData.playerLevel || remoteData.save?.playerLevel || 1;
        
        if (remoteTimestamp > this.lastLoadedTimestamp || remoteLevel > 1) {
          this.lastLoadedTimestamp = Math.max(this.lastLoadedTimestamp, remoteTimestamp);
          const savePayload = remoteData.save || remoteData;
          this.notifyRemoteUpdate(savePayload);
          return savePayload;
        }
      }
    } catch (e) {}
    return null;
  }

  /**
   * 由雲端伺服器載入該帳號 (以專屬 Google ID / Gmail / 註冊用戶名 查詢)
   */
  async loadAccountFromServer(user) {
    if (!user || user.authType === 'guest') return null;
    const slugs = this.getAccountSlugs(user);
    if (slugs.length === 0) return null;

    // 1. 透過內部 /api/cloud 伺服器 API 查詢專屬 Slug
    for (const slug of slugs) {
      try {
        const res = await fetch(`/api/cloud?key=${slug}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.playerLevel || data.save?.playerLevel || data.gold !== undefined)) {
            this.lastLoadedTimestamp = Math.max(this.lastLoadedTimestamp, data.timestamp || 0);
            return data.save || data;
          }
        }
      } catch (e) {}
    }

    // 2. 本地快取保底
    try {
      const cacheMap = JSON.parse(localStorage.getItem(this.localCacheRegistryKey) || '{}');
      for (const slug of slugs) {
        if (cacheMap[slug]) {
          return cacheMap[slug].save || cacheMap[slug];
        }
      }
    } catch (e) {}

    return null;
  }

  /**
   * 防抖排程即時同步
   */
  scheduleSaveToServer(user, saveData) {
    if (!user || user.authType === 'guest') return;
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    this.syncDebounceTimer = setTimeout(() => {
      this.saveAccountToServer(user, saveData);
    }, 500);
  }

  /**
   * 將帳號的完整存檔資料包全自動上傳並綁定至帳號專屬 Slug
   */
  async saveAccountToServer(user, saveData) {
    if (!user || user.authType === 'guest' || !saveData) return false;
    const slugs = this.getAccountSlugs(user);
    if (slugs.length === 0) return false;

    const now = Date.now();
    this.lastSavedTimestamp = now;

    const payload = {
      username: user.username || '',
      email: user.email || '',
      googleId: user.googleId || '',
      save: saveData,
      playerLevel: saveData.playerLevel || 1,
      gold: saveData.gold || 0,
      gems: saveData.gems || 0,
      trophies: saveData.trophies || 1000,
      timestamp: now,
      clientTime: new Date().toISOString()
    };
    const bodyStr = JSON.stringify(payload);

    // 更新本地專屬快取
    try {
      const cacheMap = JSON.parse(localStorage.getItem(this.localCacheRegistryKey) || '{}');
      slugs.forEach(s => cacheMap[s] = payload);
      localStorage.setItem(this.localCacheRegistryKey, JSON.stringify(cacheMap));
    } catch (e) {}

    this.isSyncing = true;
    let anySuccess = false;

    // 儲存至該帳號專屬 Slug (不覆蓋其他用戶)
    for (const key of slugs) {
      try {
        const res = await fetch(`/api/cloud?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyStr
        });
        if (res.ok) {
          anySuccess = true;
        }
      } catch (e) {}
    }

    this.isSyncing = false;
    return anySuccess;
  }

  /**
   * 4 位數極短碼輔助上傳 (同時啟動 WebRTC P2P 雲端通道)
   */
  async uploadWithShortPin(saveData, user) {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const payload = {
      pin: pin,
      save: saveData,
      user: user ? { username: user.username, email: user.email } : { username: '皇家領主' },
      playerLevel: saveData.playerLevel || 1,
      gold: saveData.gold || 0,
      gems: saveData.gems || 0,
      trophies: saveData.trophies || 1000,
      timestamp: Date.now()
    };
    const bodyStr = JSON.stringify(payload);

    // 同步儲存至帳號與 /api/cloud
    this.saveAccountToServer(user, saveData);

    try {
      await fetch(`/api/cloud?pin=${pin}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      });
    } catch (e) {}

    // 啟動 WebRTC P2P 存檔廣播伺服器 (0 CORS、直接傳送給手機)
    try {
      if (this.currentPeerHost) {
        try { this.currentPeerHost.destroy(); } catch (e) {}
      }
      const peerHost = new Peer(`royal-pin-${pin}`, { debug: 0 });
      this.currentPeerHost = peerHost;
      peerHost.on('connection', (conn) => {
        conn.on('open', () => {
          conn.send({ type: 'sync_save_payload', save: saveData, user });
          console.log(`🎉 [WebRTC-P2P] 存檔已透過 P2P 成功即時傳送至手機！`);
        });
      });
    } catch (e) {}

    return { success: true, pin: pin, code: pin, level: saveData.playerLevel || 1 };
  }

  /**
   * 使用 4 位數極短碼從雲端載入存檔 (結合 /api/cloud 與 WebRTC P2P)
   */
  async downloadWithShortPin(pin) {
    if (!pin || !pin.trim()) return null;
    const cleanPin = pin.trim();

    // 1. 由 /api/cloud 載入
    try {
      const res = await fetch(`/api/cloud?pin=${cleanPin}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.save || data.playerLevel)) {
          return data.save || data;
        }
      }
    } catch (e) {}

    // 2. 由 WebRTC P2P 直連拉取
    const p2pPromise = new Promise((resolve) => {
      try {
        const clientPeer = new Peer({ debug: 0 });
        const targetPeerId = `royal-pin-${cleanPin}`;
        const timeout = setTimeout(() => {
          try { clientPeer.destroy(); } catch (e) {}
          resolve(null);
        }, 3000);

        clientPeer.on('open', () => {
          const conn = clientPeer.connect(targetPeerId, { reliable: true });
          conn.on('data', (msg) => {
            if (msg && msg.save) {
              clearTimeout(timeout);
              try { clientPeer.destroy(); } catch (e) {}
              resolve(msg.save);
            }
          });
        });
        clientPeer.on('error', () => {
          clearTimeout(timeout);
          resolve(null);
        });
      } catch (e) {
        resolve(null);
      }
    });

    const p2pResult = await p2pPromise;
    if (p2pResult) return p2pResult;

    return null;
  }

  /**
   * 清空該帳號在雲端伺服器的所有存檔 (重置)
   */
  async clearServerData(user) {
    if (!user) return false;
    const slugs = this.getAccountSlugs(user);

    for (const slug of slugs) {
      try {
        const emptyPayload = JSON.stringify({
          username: user.username,
          save: { playerLevel: 1, gold: 2000, gems: 300, trophies: 1000 },
          timestamp: Date.now()
        });
        await fetch(`/api/cloud?key=${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: emptyPayload
        });
      } catch (e) {}
    }

    try {
      const cacheMap = JSON.parse(localStorage.getItem(this.localCacheRegistryKey) || '{}');
      slugs.forEach(s => delete cacheMap[s]);
      localStorage.setItem(this.localCacheRegistryKey, JSON.stringify(cacheMap));
    } catch (e) {}

    this.lastSavedTimestamp = Date.now();
    this.lastLoadedTimestamp = Date.now();
    return true;
  }
}

/**
 * 🛰️ 輕量級跨設備 WebSockets MQTT 實時廣播協議
 * 支援全球手機、電腦、平板跨網段 100% 真實即時在線心跳互通
 */
class SimpleMqttPresenceRelay {
  constructor(topic, onMessage) {
    this.topic = topic;
    this.onMessage = onMessage;
    this.brokers = [
      'wss://broker.emqx.io:8084/mqtt',
      'wss://broker.hivemq.com:8884/mqtt'
    ];
    this.currentBrokerIdx = 0;
    this.ws = null;
    this.connected = false;
    this.pingTimer = null;
    this.reconnectTimer = null;
    this.connect();
  }

  connect() {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return;
    try {
      const url = this.brokers[this.currentBrokerIdx];
      this.ws = new WebSocket(url, ['mqtt']);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        const clientId = 'clash_' + Math.random().toString(36).substring(2, 10);
        this.ws.send(this.encodeConnect(clientId));
      };

      this.ws.onmessage = (event) => {
        try {
          const buf = new Uint8Array(event.data);
          if (buf.length === 0) return;
          const packetType = buf[0] >> 4;

          if (packetType === 2) { // CONNACK
            this.connected = true;
            this.ws.send(this.encodeSubscribe(this.topic, 1));
            if (this.pingTimer) clearInterval(this.pingTimer);
            this.pingTimer = setInterval(() => {
              if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(new Uint8Array([0xc0, 0x00])); // PINGREQ
              }
            }, 25000);
          } else if (packetType === 3) { // PUBLISH
            const data = this.decodePublish(buf);
            if (data) this.onMessage?.(data);
          }
        } catch (e) {}
      };

      this.ws.onerror = () => {};
      this.ws.onclose = () => {
        this.connected = false;
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.currentBrokerIdx = (this.currentBrokerIdx + 1) % this.brokers.length;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), 4000);
      };
    } catch (e) {
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connect(), 4000);
    }
  }

  publish(obj) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.connected) return;
    try {
      const payload = JSON.stringify(obj);
      const packet = this.encodePublish(this.topic, payload);
      this.ws.send(packet);
    } catch (e) {}
  }

  encodeConnect(clientId) {
    const proto = [0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, 0x04, 0x02, 0x00, 0x3c];
    const idBytes = new TextEncoder().encode(clientId);
    const idLen = [idBytes.length >> 8, idBytes.length & 0xff];
    const remLen = proto.length + 2 + idBytes.length;
    const packet = new Uint8Array(2 + remLen);
    packet[0] = 0x10;
    packet[1] = remLen;
    packet.set(proto, 2);
    packet.set(idLen, 2 + proto.length);
    packet.set(idBytes, 2 + proto.length + 2);
    return packet;
  }

  encodeSubscribe(topic, msgId) {
    const topicBytes = new TextEncoder().encode(topic);
    const remLen = 2 + 2 + topicBytes.length + 1;
    const packet = new Uint8Array(2 + remLen);
    packet[0] = 0x82;
    packet[1] = remLen;
    packet[2] = msgId >> 8;
    packet[3] = msgId & 0xff;
    packet[4] = topicBytes.length >> 8;
    packet[5] = topicBytes.length & 0xff;
    packet.set(topicBytes, 6);
    packet[6 + topicBytes.length] = 0x00;
    return packet;
  }

  encodePublish(topic, payloadStr) {
    const topicBytes = new TextEncoder().encode(topic);
    const payloadBytes = new TextEncoder().encode(payloadStr);
    const remLen = 2 + topicBytes.length + payloadBytes.length;
    const lenBytes = [];
    let l = remLen;
    do {
      let digit = l % 128;
      l = Math.floor(l / 128);
      if (l > 0) digit |= 0x80;
      lenBytes.push(digit);
    } while (l > 0);

    const packet = new Uint8Array(1 + lenBytes.length + remLen);
    packet[0] = 0x30;
    packet.set(lenBytes, 1);
    const offset = 1 + lenBytes.length;
    packet[offset] = topicBytes.length >> 8;
    packet[offset + 1] = topicBytes.length & 0xff;
    packet.set(topicBytes, offset + 2);
    packet.set(payloadBytes, offset + 2 + topicBytes.length);
    return packet;
  }

  decodePublish(buf) {
    let offset = 1;
    let multiplier = 1;
    let length = 0;
    let digit;
    do {
      digit = buf[offset++];
      length += (digit & 127) * multiplier;
      multiplier *= 128;
    } while ((digit & 128) !== 0 && offset < buf.length);

    const topicLen = (buf[offset] << 8) | buf[offset + 1];
    offset += 2 + topicLen;
    const payloadBytes = buf.subarray(offset);
    const text = new TextDecoder('utf-8').decode(payloadBytes);
    return JSON.parse(text);
  }
}

/**
 * 👥 全球真實實時在線人數心跳廣播與診斷引擎 (100% Genuine Real Presence & Telemetry)
 */
export class PresenceTracker {
  constructor() {
    this.sessionId = `client_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    this.storageKey = 'royal_showdown_live_presence_registry_v2';
    this.broadcast = null;
    this.heartbeatTimer = null;
    this.currentMode = 'lobby';
    this.listeners = new Set();
    this.remoteMemoryMap = new Map();

    // 1. 同設備跨分頁即時廣播
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcast = new BroadcastChannel('royal_presence_channel');
        this.broadcast.onmessage = (e) => {
          if (e.data && e.data.type === 'heartbeat') {
            this.recordPresence(e.data.payload);
            this.notifyListeners();
          } else if (e.data && e.data.type === 'leave') {
            this.removeRemotePresence(e.data.sessionId);
            this.notifyListeners();
          }
        };
      }
    } catch (e) {}

    // 2. 跨設備全球真實在線 MQTT 廣播網關 (支援手機/電腦/異地網路)
    this.mqtt = new SimpleMqttPresenceRelay('royal-showdown-3d/presence/global-v1', (data) => {
      if (!data || !data.sessionId) return;
      if (data.sessionId === this.sessionId) return; // 忽略自己發送的回聲
      if (data.isLeaving) {
        this.removeRemotePresence(data.sessionId);
      } else {
        this.recordPresence(data);
      }
      this.notifyListeners();
    });

    this.startHeartbeat();
  }

  onPresenceChange(cb) {
    if (typeof cb === 'function') this.listeners.add(cb);
  }

  offPresenceChange(cb) {
    this.listeners.delete(cb);
  }

  notifyListeners() {
    const list = this.getActivePlayers();
    this.listeners.forEach(cb => {
      try { cb(list); } catch (e) {}
    });
  }

  setMode(mode) {
    this.currentMode = mode;
    this.sendHeartbeat();
  }

  startHeartbeat() {
    this.sendHeartbeat();
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, 4000);

    // 視窗離開時清除心跳
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.removeSelfPresence();
      });
    }
  }

  getSelfPayload() {
    let username = '皇家領主';
    let level = 1;
    let trophies = 1000;
    try {
      const currentUserId = localStorage.getItem('royal_clash_current_user_id');
      const accountsRaw = localStorage.getItem('royal_clash_accounts_v1');
      if (accountsRaw) {
        const accounts = JSON.parse(accountsRaw);
        const cur = (accounts && Array.isArray(accounts)) ? (accounts.find(a => a.id === currentUserId) || accounts[0]) : null;
        if (cur && cur.username) username = cur.username;
        if (cur && cur.level) level = cur.level;
      }
      const saveRaw = localStorage.getItem(`royal_clash_save_user_${currentUserId || 'guest'}`);
      if (saveRaw) {
        const save = JSON.parse(saveRaw);
        if (save.playerLevel) level = save.playerLevel;
        if (save.trophies) trophies = save.trophies;
      }
    } catch (e) {}

    return {
      sessionId: this.sessionId,
      username,
      level,
      trophies,
      mode: this.currentMode || 'lobby',
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? '📱 手機端' : '💻 桌面端') : '🌐 網頁'
    };
  }

  sendHeartbeat() {
    const payload = this.getSelfPayload();
    this.recordPresence(payload);

    // 1. 本地跨標籤頁廣播
    try {
      this.broadcast?.postMessage({ type: 'heartbeat', payload });
    } catch (e) {}

    // 2. 全球跨設備 MQTT 實時廣播
    try {
      this.mqtt?.publish(payload);
    } catch (e) {}
  }

  recordPresence(payload) {
    if (!payload || !payload.sessionId) return;
    this.remoteMemoryMap.set(payload.sessionId, payload);

    try {
      const raw = localStorage.getItem(this.storageKey);
      const map = raw ? JSON.parse(raw) : {};
      map[payload.sessionId] = payload;
      
      // 清理超過 18 秒未發送心跳的離線 Session
      const cutoff = Date.now() - 18000;
      Object.keys(map).forEach(key => {
        if (!map[key].timestamp || map[key].timestamp < cutoff) {
          delete map[key];
        }
      });

      localStorage.setItem(this.storageKey, JSON.stringify(map));
    } catch (e) {}
  }

  removeRemotePresence(sessionId) {
    if (!sessionId) return;
    this.remoteMemoryMap.delete(sessionId);
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const map = JSON.parse(raw);
        delete map[sessionId];
        localStorage.setItem(this.storageKey, JSON.stringify(map));
      }
    } catch (e) {}
  }

  removeSelfPresence() {
    try {
      this.mqtt?.publish({ sessionId: this.sessionId, isLeaving: true });
    } catch (e) {}
    try {
      this.broadcast?.postMessage({ type: 'leave', sessionId: this.sessionId });
    } catch (e) {}
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const map = JSON.parse(raw);
        delete map[this.sessionId];
        localStorage.setItem(this.storageKey, JSON.stringify(map));
      }
    } catch (e) {}
  }

  // 獲取目前真實在線的所有活躍玩家清單 (合併本機 + 遠端設備)
  getActivePlayers() {
    try {
      const cutoff = Date.now() - 18000;
      const mergedMap = new Map();

      // 1. 記憶體中接收到的跨設備遠端玩家
      this.remoteMemoryMap.forEach((val, key) => {
        if (key !== this.sessionId && val.timestamp >= cutoff) {
          mergedMap.set(key, { ...val, isSelf: false });
        }
      });

      // 2. 本地儲存中的同機/跨分頁玩家
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const localMap = JSON.parse(raw);
        Object.keys(localMap).forEach(key => {
          if (key !== this.sessionId && localMap[key] && localMap[key].timestamp >= cutoff) {
            mergedMap.set(key, { ...localMap[key], isSelf: false });
          }
        });
      }

      const list = [];
      // 確保自身永遠在列表第一位
      const selfPayload = this.getSelfPayload();
      selfPayload.isSelf = true;
      list.push(selfPayload);

      mergedMap.forEach(player => {
        list.push(player);
      });

      return list;
    } catch (e) {
      return [{ ...this.getSelfPayload(), isSelf: true }];
    }
  }

  // 實測真實伺服器節點延遲 (毫秒)
  async measureRealPing(url = window.location.href) {
    const start = performance.now();
    try {
      await fetch(`${url}?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        mode: 'no-cors'
      });
      return Math.max(1, Math.round(performance.now() - start));
    } catch (e) {
      return new Promise((resolve) => {
        const img = new Image();
        const imgStart = performance.now();
        img.onload = img.onerror = () => {
          resolve(Math.max(1, Math.round(performance.now() - imgStart)));
        };
        img.src = `${url}?_t=${Date.now()}`;
        setTimeout(() => resolve(Math.max(1, Math.round(performance.now() - start))), 1500);
      });
    }
  }
}

export const cloudSync = new CloudSyncService();
export const presenceTracker = new PresenceTracker();


