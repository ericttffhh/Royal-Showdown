/**
 * 皇室對決 3D - 雲端伺服器帳號與全存檔極速即時雙向同步系統 (Real-Time Cloud Account & Save Engine)
 * 實現電腦 ↔ 手機 (iPhone/Safari/PWA) 秒級實時雙向同步，切換設備或遊玩時無感即時刷新
 */

class CloudSyncService {
  constructor() {
    this.apiEndpoint = 'https://api.restful-api.dev/objects';
    this.syncDebounceTimer = null;
    this.isSyncing = false;
    this.lastSavedTimestamp = 0;
    this.lastLoadedTimestamp = 0;
    this.cloudRegistryKey = 'royal_cloud_account_registry_v3';
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

    // 1. 若本地已知該帳號的 Cloud Object ID，直接秒速讀取
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
        console.warn('Direct ID 雲端拉取失敗，轉按標籤搜尋:', e);
      }
    }

    // 2. 若為新設備 (例如新打開手機)，按帳號名稱全域查詢
    try {
      const res = await fetch(`${this.apiEndpoint}?name=ROYAL_ACCOUNT_${accountKey}`, { cache: 'no-store' });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const latestItem = list.sort((a, b) => (b.data?.timestamp || 0) - (a.data?.timestamp || 0))[0];
          if (latestItem?.id) {
            this.setLocalCloudObjectId(accountKey, latestItem.id);
          }
          if (latestItem?.data?.save) {
            this.lastLoadedTimestamp = latestItem.data.timestamp || Date.now();
            return latestItem.data;
          }
        }
      }
    } catch (err) {
      console.warn('雲端伺服器帳號搜尋異常:', err);
    }

    return null;
  }

  /**
   * 極速防抖排程儲存 (400ms 響應)
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
        console.log(`☁️ [RealtimeSync] 帳號 ${user.username} (Lv.${saveData.playerLevel || 1}) 雲端即時同步成功！`);
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
        // 嘗試從伺服器刪除物件
        await fetch(`${this.apiEndpoint}/${objectId}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('刪除雲端物件失敗:', e);
    }

    // 重置本地快取鍵值
    this.setLocalCloudObjectId(accountKey, null);
    this.lastSavedTimestamp = Date.now();
    this.lastLoadedTimestamp = Date.now();
    console.log('🗑️ [CloudSync] 已清空伺服器端帳號存檔紀錄:', accountKey);
    return true;
  }
}

export const cloudSync = new CloudSyncService();
