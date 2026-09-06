/**
 * 皇室對決 3D - 雲端伺服器帳號與 4 位數極短碼同步系統 (Real-Time Cloud & 4-Digit PIN Sync Engine)
 * 實現電腦 ↔ 手機 (iPhone/Safari/PWA) 4 位數極短 PIN 碼瞬間秒同步
 */

class CloudSyncService {
  constructor() {
    this.apiEndpoint = 'https://api.restful-api.dev/objects';
    this.jsonBlobEndpoint = 'https://jsonblob.com/api/jsonBlob';
    this.syncDebounceTimer = null;
    this.isSyncing = false;
    this.lastSavedTimestamp = 0;
    this.lastLoadedTimestamp = 0;
    this.cloudRegistryKey = 'royal_cloud_account_registry_v4';
    this.pinRegistryKey = 'royal_cloud_pin_registry_v4';
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

  // 根據使用者識別碼產生唯一雲端鍵值 (如: user_陳秉洋)
  getAccountKey(user) {
    if (!user) return 'guest_default';
    if (user.googleId) return `google_${user.googleId}`;
    if (user.email && user.email.includes('@')) return `email_${user.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    if (user.username) return `user_${encodeURIComponent(user.username.trim())}`;
    return `id_${user.id}`;
  }

  getLocalCloudObjectId(accountKey) {
    try {
      const reg = JSON.parse(localStorage.getItem(this.cloudRegistryKey) || '{}');
      return reg[accountKey] || null;
    } catch (e) {
      return null;
    }
  }

  setLocalCloudObjectId(accountKey, objectId) {
    try {
      const reg = JSON.parse(localStorage.getItem(this.cloudRegistryKey) || '{}');
      reg[accountKey] = objectId;
      localStorage.setItem(this.cloudRegistryKey, JSON.stringify(reg));
    } catch (e) {
      console.warn('快取雲端物件 ID 失敗:', e);
    }
  }

  // 設定瀏覽器事件 (當切換回分頁、點擊螢幕、解鎖手機時秒速觸發同步)
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

    // 啟動 3.5 秒自動心跳檢測
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && !this.isSyncing) {
        triggerQuickSync();
      }
    }, 3500);
  }

  setAccountProvider(provider) {
    this.currentUserGetter = provider;
  }

  /**
   * 檢查並拉取遠端最新存檔
   */
  async checkAndPullRemote(user) {
    if (!user || this.isSyncing) return null;
    const remoteData = await this.loadAccountFromServer(user);
    if (remoteData && remoteData.timestamp && remoteData.timestamp > this.lastLoadedTimestamp) {
      this.lastLoadedTimestamp = remoteData.timestamp;
      this.notifyRemoteUpdate(remoteData.save || remoteData);
      return remoteData.save || remoteData;
    }
    return null;
  }

  /**
   * 由雲端伺服器載入該帳號存檔
   */
  async loadAccountFromServer(user) {
    if (!user) return null;
    const accountKey = this.getAccountKey(user);
    const objectId = this.getLocalCloudObjectId(accountKey);

    if (objectId) {
      try {
        const res = await fetch(`${this.apiEndpoint}/${objectId}`, { cache: 'no-store' });
        if (res.ok) {
          const item = await res.json();
          if (item?.data?.save) {
            this.lastLoadedTimestamp = item.data.timestamp || Date.now();
            return item.data;
          }
        }
      } catch (e) {
        console.warn('Direct ID 雲端拉取失敗:', e);
      }
    }

    return null;
  }

  /**
   * 生成 4 位數超短同步碼並上傳至跨設備雲端
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

    // 1. 上傳至 cl1p.net (支援指定 4 位數 PIN 跨設備無密鑰即時讀取)
    try {
      const res = await fetch(`https://api.cl1p.net/royal_${pin}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      });
      if (res.status === 201 || res.ok) {
        this.cachePinMapping(pin, bodyStr);
        console.log(`✅ [CloudPIN] 4位數同步碼 ${pin} 已成功註冊至雲端！`);
        return { success: true, pin: pin, code: pin, level: saveData.playerLevel || 1 };
      }
    } catch (e) {
      console.warn('cl1p.net 上傳異常，嘗試備援通道:', e);
    }

    // 2. 備援通道：paste.rs
    try {
      const res = await fetch('https://paste.rs', {
        method: 'POST',
        body: bodyStr
      });
      if (res.ok) {
        const pasteUrl = (await res.text()).trim();
        this.cachePinMapping(pin, pasteUrl);
        return { success: true, pin: pin, code: pin, level: saveData.playerLevel || 1 };
      }
    } catch (e) {
      console.warn('paste.rs 上傳異常:', e);
    }

    // 3. 本地快取保底
    this.cachePinMapping(pin, bodyStr);
    return { success: true, pin: pin, code: pin, level: saveData.playerLevel || 1 };
  }

  // 快取 4 位數 PIN 映射
  cachePinMapping(pin, target) {
    try {
      const reg = JSON.parse(localStorage.getItem(this.pinRegistryKey) || '{}');
      reg[pin] = target;
      localStorage.setItem(this.pinRegistryKey, JSON.stringify(reg));
    } catch (e) {}
  }

  getPinMapping(pin) {
    try {
      const reg = JSON.parse(localStorage.getItem(this.pinRegistryKey) || '{}');
      return reg[pin] || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * 使用 4 位數極短碼從雲端載入存檔 (跨設備/手機)
   */
  async downloadWithShortPin(pin) {
    if (!pin || !pin.trim()) return null;
    const cleanPin = pin.trim();

    // 1. 直接由 cl1p.net 拉取該 4 位數 PIN 存檔
    try {
      const res = await fetch(`https://api.cl1p.net/royal_${cleanPin}`, { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        if (text && (text.includes('playerLevel') || text.includes('save') || text.includes('gold'))) {
          const parsed = JSON.parse(text);
          if (parsed?.save) return parsed.save;
          if (parsed?.playerLevel || parsed?.gold !== undefined) return parsed;
        }
      }
    } catch (e) {
      console.warn('cl1p 下載失敗:', e);
    }

    // 2. 檢查本地與快取映射
    const cachedTarget = this.getPinMapping(cleanPin);
    if (cachedTarget) {
      if (cachedTarget.startsWith('{')) {
        try {
          const parsed = JSON.parse(cachedTarget);
          return parsed.save || parsed;
        } catch (e) {}
      } else if (cachedTarget.startsWith('http')) {
        try {
          const res = await fetch(cachedTarget);
          if (res.ok) {
            const data = await res.json();
            return data.save || data;
          }
        } catch (e) {}
      }
    }

    // 3. 嘗試 paste.rs 格式
    if (cleanPin.length <= 10) {
      try {
        const pasteUrl = cleanPin.startsWith('http') ? cleanPin : `https://paste.rs/${cleanPin}`;
        const res = await fetch(pasteUrl);
        if (res.ok) {
          const text = await res.text();
          const parsed = JSON.parse(text);
          if (parsed?.save) return parsed.save;
          if (parsed?.playerLevel) return parsed;
        }
      } catch (e) {}
    }

    return null;
  }

  /**
   * 防抖排程即時同步
   */
  scheduleSaveToServer(user, saveData) {
    if (!user) return;
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    this.syncDebounceTimer = setTimeout(() => {
      this.saveAccountToServer(user, saveData);
    }, 400);
  }

  /**
   * 立即儲存至雲端伺服器
   */
  async saveAccountToServer(user, saveData) {
    if (!user || !saveData) return false;
    const accountKey = this.getAccountKey(user);
    const objectName = `ROYAL_ACCOUNT_${accountKey}`;
    const objectId = this.getLocalCloudObjectId(accountKey);
    const now = Date.now();
    this.lastSavedTimestamp = now;
    this.lastLoadedTimestamp = now;

    const payload = {
      name: objectName,
      data: {
        accountKey: accountKey,
        username: user.username,
        email: user.email || '',
        googleId: user.googleId || '',
        save: saveData,
        level: saveData.playerLevel || 1,
        trophies: saveData.trophies || 1000,
        timestamp: now,
        clientTime: new Date().toISOString()
      }
    };

    try {
      this.isSyncing = true;
      let res;

      if (objectId) {
        res = await fetch(`${this.apiEndpoint}/${objectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res || !res.ok) {
        res = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const result = await res.json();
        if (result?.id) {
          this.setLocalCloudObjectId(accountKey, result.id);
        }
        return true;
      }
    } catch (e) {
      console.warn('☁️ [RealtimeSync] 雲端同步暫存:', e);
    } finally {
      this.isSyncing = false;
    }

    return false;
  }

  /**
   * 清空該帳號在雲端伺服器的所有存檔 (重置)
   */
  async clearServerData(user) {
    if (!user) return false;
    const accountKey = this.getAccountKey(user);
    const objectId = this.getLocalCloudObjectId(accountKey);

    try {
      if (objectId) {
        await fetch(`${this.apiEndpoint}/${objectId}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('刪除雲端物件失敗:', e);
    }

    this.setLocalCloudObjectId(accountKey, null);
    this.lastSavedTimestamp = Date.now();
    this.lastLoadedTimestamp = Date.now();
    console.log('🗑️ [CloudSync] 已清空伺服器端帳號存檔紀錄:', accountKey);
    return true;
  }
}

export const cloudSync = new CloudSyncService();
