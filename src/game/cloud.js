/**
 * 皇室對決 3D - 帳號名稱 / Gmail 跨設備全自動雲端即時同步引擎 (Zero-Friction Auto Cloud Sync)
 * 玩家所有進度（1-100等級、卡牌庫、金幣、寶石、獎盃、戰令、任務）全自動綁定於帳號名稱與 Gmail
 * 任何裝置（電腦 / iPhone / Android / 平板）開啟或登入同一帳號，自動秒速雙向同步
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

  // 將字串轉為安全唯一的 URL 識別 Slug (支援中文字符、特殊符號與 Email)
  toSafeSlug(prefix, str) {
    if (!str || !str.trim()) return null;
    const clean = str.trim().toLowerCase();
    let hex = '';
    for (let i = 0; i < clean.length; i++) {
      hex += clean.charCodeAt(i).toString(16).padStart(4, '0');
    }
    return `${prefix}_${hex}`;
  }

  // 根據使用者帳號物件提取所有關聯的雲端識別碼 (使用者名稱、Gmail、Google ID)
  getAccountSlugs(user) {
    if (!user) return ['royal_u_guest'];
    const slugs = [];

    // 1. 根據使用者名稱綁定
    if (user.username && user.username.trim()) {
      const uSlug = this.toSafeSlug('royal_u', user.username);
      if (uSlug) slugs.push(uSlug);
    }

    // 2. 根據 Gmail / 電子郵件綁定
    if (user.email && user.email.includes('@')) {
      const eSlug = this.toSafeSlug('royal_e', user.email);
      if (eSlug) slugs.push(eSlug);
    }

    // 3. 根據 Google Sub ID 綁定
    if (user.googleId) {
      const gSlug = this.toSafeSlug('royal_g', String(user.googleId));
      if (gSlug) slugs.push(gSlug);
    }

    // 4. 本地使用者 ID 保底
    if (slugs.length === 0 && user.id) {
      const idSlug = this.toSafeSlug('royal_id', user.id);
      if (idSlug) slugs.push(idSlug);
    }

    return slugs.length > 0 ? slugs : ['royal_u_guest'];
  }

  // 設定視窗與背景監聽器 (手機切換回分頁、解鎖螢幕、恢復網路時自動秒速檢查同步)
  setupWindowListeners() {
    if (typeof window === 'undefined') return;

    const triggerQuickSync = () => {
      if (this.currentUserGetter) {
        const user = this.currentUserGetter();
        if (user) {
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

    // 啟動 4 秒背景心跳自動校準
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && !this.isSyncing) {
        triggerQuickSync();
      }
    }, 4000);
  }

  setAccountProvider(provider) {
    this.currentUserGetter = provider;
  }

  /**
   * 檢查並自動拉取遠端最新存檔資料包
   */
  async checkAndPullRemote(user) {
    if (!user || this.isSyncing) return null;
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
    } catch (e) {
      console.warn('自動拉取雲端存檔異常:', e);
    }
    return null;
  }

  /**
   * 由雲端伺服器載入該帳號 (以用戶名 / Gmail / 全局存檔槽 查詢) 的所有存檔資料包
   */
  async loadAccountFromServer(user) {
    if (!user) return null;
    const slugs = this.getAccountSlugs(user);

    // 1. 優先透過內部零 CORS /api/cloud 伺服器 API 查詢
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

    // 2. 外部備援通道 (cl1p.net) 查詢
    for (const slug of slugs) {
      try {
        const res = await fetch(`https://api.cl1p.net/${slug}`, { cache: 'no-store' });
        if (res.ok) {
          const text = await res.text();
          if (text && (text.includes('playerLevel') || text.includes('gold') || text.includes('cards'))) {
            const parsed = JSON.parse(text);
            this.lastLoadedTimestamp = Math.max(this.lastLoadedTimestamp, parsed.timestamp || 0);
            return parsed.save || parsed;
          }
        }
      } catch (e) {}
    }

    // 3. 若為訪客帳號或新裝置未登入，嘗試拉取最近全局主存檔
    try {
      const res = await fetch('/api/cloud?key=royal_latest_global_save', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.playerLevel >= 2 || data.save?.playerLevel >= 2)) {
          return data.save || data;
        }
      }
    } catch (e) {}

    // 4. 本地快取保底
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
   * 防抖排程即時同步 (卡牌升級、獲得金幣、升等、對戰後自動觸發)
   */
  scheduleSaveToServer(user, saveData) {
    if (!user) return;
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    this.syncDebounceTimer = setTimeout(() => {
      this.saveAccountToServer(user, saveData);
    }, 350);
  }

  /**
   * 將帳號的完整存檔資料包全自動上傳並綁定至帳號名稱與 Gmail
   */
  async saveAccountToServer(user, saveData) {
    if (!user || !saveData) return false;
    const slugs = this.getAccountSlugs(user);
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

    // 更新本地快取
    try {
      const cacheMap = JSON.parse(localStorage.getItem(this.localCacheRegistryKey) || '{}');
      slugs.forEach(s => cacheMap[s] = payload);
      localStorage.setItem(this.localCacheRegistryKey, JSON.stringify(cacheMap));
    } catch (e) {}

    this.isSyncing = true;
    let anySuccess = false;

    // 1. 內部零 CORS /api/cloud 儲存 (包含用戶 Slugs 與全局最新存檔槽)
    const targetKeys = [...slugs, 'royal_latest_global_save'];
    for (const key of targetKeys) {
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

    // 2. 外部備援通道 (cl1p.net)
    for (const slug of slugs) {
      try {
        fetch(`https://api.cl1p.net/${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyStr
        }).catch(() => {});
      } catch (e) {}
    }

    this.isSyncing = false;
    return anySuccess;
  }

  /**
   * 4 位數極短碼輔助上傳 (供快速備用)
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

    // 同步儲存至帳號
    this.saveAccountToServer(user, saveData);

    // 儲存至 /api/cloud 與 cl1p
    try {
      await fetch(`/api/cloud?pin=${pin}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      });
    } catch (e) {}

    try {
      fetch(`https://api.cl1p.net/royal_${pin}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      }).catch(() => {});
    } catch (e) {}

    return { success: true, pin: pin, code: pin, level: saveData.playerLevel || 1 };
  }

  /**
   * 使用 4 位數極短碼從雲端載入存檔
   */
  async downloadWithShortPin(pin) {
    if (!pin || !pin.trim()) return null;
    const cleanPin = pin.trim();

    // 1. 由 /api/cloud 下載
    try {
      const res = await fetch(`/api/cloud?pin=${cleanPin}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.save || data.playerLevel)) {
          return data.save || data;
        }
      }
    } catch (e) {}

    // 2. 由 cl1p.net 下載
    try {
      const res = await fetch(`https://api.cl1p.net/royal_${cleanPin}`, { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        if (text && (text.includes('playerLevel') || text.includes('save') || text.includes('gold'))) {
          const parsed = JSON.parse(text);
          return parsed.save || parsed;
        }
      }
    } catch (e) {}

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
        await fetch(`https://api.cl1p.net/${slug}`, {
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

export const cloudSync = new CloudSyncService();
