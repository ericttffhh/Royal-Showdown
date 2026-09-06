/**
 * 皇室對決 3D - 雲端伺服器帳號與全存檔自動即時同步系統 (Cloud Server Account & Save Sync Engine)
 * 解決跨設備 (電腦 ↔ 手機 / iPhone) 存檔隔離問題，讓玩家登入帳號即自動由伺服器讀取與儲存最高等級存檔
 */

class CloudSyncService {
  constructor() {
    this.apiEndpoint = 'https://api.restful-api.dev/objects';
    this.syncDebounceTimer = null;
    this.isSyncing = false;
    this.lastSyncTimestamp = 0;
    this.cloudRegistryKey = 'royal_cloud_account_registry_v2';
  }

  // 根據使用者識別碼產生唯一雲端雜湊鍵
  getAccountKey(user) {
    if (!user) return 'guest_default';
    if (user.googleId) return `google_${user.googleId}`;
    if (user.email && user.email.includes('@')) return `email_${user.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    if (user.username) return `user_${encodeURIComponent(user.username.toLowerCase().trim())}`;
    return `id_${user.id}`;
  }

  // 取得或快取雲端物件 ID
  getLocalCloudObjectId(accountKey) {
    try {
      const reg = JSON.parse(localStorage.getItem(this.cloudRegistryKey) || '{}');
      return reg[accountKey] || null;
    } catch (e) {
      return null;
    }
  }

  // 快取雲端物件 ID
  setLocalCloudObjectId(accountKey, objectId) {
    try {
      const reg = JSON.parse(localStorage.getItem(this.cloudRegistryKey) || '{}');
      reg[accountKey] = objectId;
      localStorage.setItem(this.cloudRegistryKey, JSON.stringify(reg));
    } catch (e) {
      console.warn('快取雲端物件 ID 失敗:', e);
    }
  }

  /**
   * 自動由雲端伺服器載入該帳號存檔
   * @param {Object} user 用戶物件
   * @returns {Promise<Object|null>} 伺服器端存檔資料
   */
  async loadAccountFromServer(user) {
    if (!user) return null;
    const accountKey = this.getAccountKey(user);
    const objectId = this.getLocalCloudObjectId(accountKey);

    // 1. 若本地已知該帳號的 Cloud Object ID，直接拉取
    if (objectId) {
      try {
        const res = await fetch(`${this.apiEndpoint}/${objectId}`, { cache: 'no-store' });
        if (res.ok) {
          const item = await res.json();
          if (item?.data?.save) {
            console.log('✅ [CloudSync] 成功從雲端伺服器載入帳號存檔 (透過 Direct ID):', accountKey);
            return item.data.save;
          }
        }
      } catch (e) {
        console.warn('Direct ID 雲端拉取失敗，嘗試按標籤搜尋:', e);
      }
    }

    // 2. 若為全新設備 (例如手機新開)，從全域伺服器查詢該帳號
    try {
      const res = await fetch(`${this.apiEndpoint}?name=ROYAL_ACCOUNT_${accountKey}`, { cache: 'no-store' });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          // 取最新一筆
          const latestItem = list.sort((a, b) => (b.data?.timestamp || 0) - (a.data?.timestamp || 0))[0];
          if (latestItem?.id) {
            this.setLocalCloudObjectId(accountKey, latestItem.id);
          }
          if (latestItem?.data?.save) {
            console.log('✅ [CloudSync] 成功從雲端伺服器按帳號鍵檢索到存檔:', accountKey);
            return latestItem.data.save;
          }
        }
      }
    } catch (err) {
      console.warn('雲端伺服器帳號搜尋異常:', err);
    }

    return null;
  }

  /**
   * 自動將帳號與存檔即時儲存至雲端伺服器 (附帶 Debounce 防頻繁呼叫)
   * @param {Object} user 用戶物件
   * @param {Object} saveData 遊戲存檔資料
   */
  scheduleSaveToServer(user, saveData) {
    if (!user) return;
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    this.syncDebounceTimer = setTimeout(() => {
      this.saveAccountToServer(user, saveData);
    }, 1200); // 1.2秒內無新操作即自動向伺服器同步
  }

  /**
   * 立即儲存至雲端伺服器
   */
  async saveAccountToServer(user, saveData) {
    if (!user || !saveData) return false;
    const accountKey = this.getAccountKey(user);
    const objectName = `ROYAL_ACCOUNT_${accountKey}`;
    const objectId = this.getLocalCloudObjectId(accountKey);

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
        timestamp: Date.now(),
        clientTime: new Date().toISOString()
      }
    };

    try {
      this.isSyncing = true;
      let res;

      if (objectId) {
        // 更新已有雲端存檔
        res = await fetch(`${this.apiEndpoint}/${objectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      // 若 PUT 失敗或尚無 ID，則發送 POST 建立新紀錄
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
        this.lastSyncTimestamp = Date.now();
        console.log('☁️ [CloudSync] 帳號存檔已即時同步至雲端伺服器:', accountKey, `(Level ${saveData.playerLevel || 1})`);
        return true;
      }
    } catch (e) {
      console.warn('☁️ [CloudSync] 雲端同步暫時離線 (下次連線時自動重試):', e);
    } finally {
      this.isSyncing = false;
    }

    return false;
  }
}

export const cloudSync = new CloudSyncService();
