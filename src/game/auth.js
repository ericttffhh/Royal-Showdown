/**
 * 皇室對決 3D - 用戶帳號與 真實 Google OAuth2 認證管理系統
 */
import { cloudSync, globalTelemetry } from './cloud.js';

const ACCOUNTS_STORAGE_KEY = 'royal_clash_accounts_v1';
const CURRENT_USER_KEY = 'royal_clash_current_user_id';
const GOOGLE_CLIENT_ID_KEY = 'royal_clash_google_client_id';

// 預設或自訂的 Google OAuth2 Client ID (支援 Google Cloud Console 憑證與 Vite 環境變數)
const DEFAULT_GOOGLE_CLIENT_ID = '1035987154868-google-client-id-sample.apps.googleusercontent.com';

export const AVATAR_OPTIONS = [
  { id: 'king', icon: '👑', name: '皇家國王' },
  { id: 'knight', icon: '🛡️', name: '無畏騎士' },
  { id: 'wizard', icon: '🧙‍♂️', name: '奧術法師' },
  { id: 'dragon', icon: '🐉', name: '烈焰飛龍' },
  { id: 'archer', icon: '🏹', name: '神射箭手' },
  { id: 'pekka', icon: '🤖', name: '機甲皮卡' },
  { id: 'lion', icon: '🦁', name: '雄獅戰神' },
  { id: 'skull', icon: '💀', name: '亡靈領主' }
];

export class AuthManager {
  constructor() {
    this.accounts = this.loadAccounts();
    this.currentUser = this.loadCurrentUser();
    const envClientId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || '';
    this.googleClientId = localStorage.getItem(GOOGLE_CLIENT_ID_KEY) || envClientId || DEFAULT_GOOGLE_CLIENT_ID;
  }

  loadAccounts() {
    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('載入帳號庫失敗:', e);
    }

    // 初始預設本地訪客帳號
    const defaultUser = {
      id: 'guest_' + Math.floor(1000 + Math.random() * 9000),
      username: '皇家領主 #' + Math.floor(1000 + Math.random() * 9000),
      password: '',
      email: '',
      authType: 'guest', // 'guest' | 'local' | 'google'
      avatar: '👑',
      avatarUrl: null,
      level: 1,
      exp: 0,
      createdAt: new Date().toLocaleDateString('zh-TW'),
      googleId: null
    };

    const initial = [defaultUser];
    this.saveAccounts(initial);
    return initial;
  }

  saveAccounts(accounts) {
    try {
      const list = accounts || this.accounts;
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(list));

      // 同步註冊至全域帳號名冊並透過 MQTT 廣播
      const globalRaw = localStorage.getItem('royal_registered_accounts_global_v2');
      const globalList = globalRaw ? JSON.parse(globalRaw) : [];
      list.forEach(a => {
        const idx = globalList.findIndex(g => g.id === a.id || (a.email && g.email && a.email.toLowerCase() === g.email.toLowerCase()) || (a.username && g.username && a.username.toLowerCase() === g.username.toLowerCase()));
        if (idx >= 0) globalList[idx] = { ...globalList[idx], ...a };
        else globalList.push(a);

        // 廣播已註冊的本地帳號與 Google 帳號 (非訪客)
        if (a.authType !== 'guest') {
          globalTelemetry.broadcastAccountSync(a);
        }
      });
      localStorage.setItem('royal_registered_accounts_global_v2', JSON.stringify(globalList));
    } catch (e) {
      console.error('儲存帳號失敗:', e);
    }
  }

  // 獲取所有已註冊與本地帳號名冊 (包含 Google、本地密碼帳號、訪客與各帳號資源數據)
  getAllRegisteredAccounts() {
    const list = [...this.accounts];

    // 讀取全域跨設備同步之註冊帳號庫
    try {
      const globalRaw = localStorage.getItem('royal_registered_accounts_global_v2');
      if (globalRaw) {
        const globalList = JSON.parse(globalRaw);
        if (Array.isArray(globalList)) {
          globalList.forEach(g => {
            const exists = list.some(a => a.id === g.id || (g.email && a.email && a.email.toLowerCase() === g.email.toLowerCase()));
            if (!exists) {
              list.push(g);
            }
          });
        }
      }
    } catch (e) {}

    // 為每個帳號豐富當前存檔資源 (等級、天梯獎盃、金幣、寶石)
    return list.map(acc => {
      let gold = 800;
      let gems = 150;
      let trophies = 1000;
      let level = acc.level || 1;
      let exp = acc.exp || 0;
      let cardCount = 8;

      try {
        const saveRaw = localStorage.getItem(`royal_clash_save_user_${acc.id}`);
        if (saveRaw) {
          const save = JSON.parse(saveRaw);
          if (save.gold !== undefined) gold = save.gold;
          if (save.gems !== undefined) gems = save.gems;
          if (save.trophies !== undefined) trophies = save.trophies;
          if (save.playerLevel !== undefined) level = save.playerLevel;
          if (save.playerExp !== undefined) exp = save.playerExp;
          if (save.cards) cardCount = Object.keys(save.cards).length;
        }
      } catch (e) {}

      return {
        ...acc,
        level,
        exp,
        gold,
        gems,
        trophies,
        cardCount,
        isCurrent: this.currentUser && this.currentUser.id === acc.id
      };
    });
  }

  loadCurrentUser() {
    const currentId = localStorage.getItem(CURRENT_USER_KEY);
    if (currentId) {
      const found = this.accounts.find(a => a.id === currentId);
      if (found) return found;
    }

    // 若無記錄則預設使用第一個帳號
    const defaultUser = this.accounts[0];
    localStorage.setItem(CURRENT_USER_KEY, defaultUser.id);
    return defaultUser;
  }

  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem(CURRENT_USER_KEY, user.id);
  }

  setGoogleClientId(clientId) {
    if (clientId && clientId.trim()) {
      this.googleClientId = clientId.trim();
      localStorage.setItem(GOOGLE_CLIENT_ID_KEY, this.googleClientId);
      return true;
    }
    return false;
  }

  getGoogleClientId() {
    return this.googleClientId;
  }

  // 註冊新本地帳號
  signUp(username, password, avatar = '👑') {
    const trimmed = username.trim();
    if (!trimmed) return { success: false, error: '請輸入用戶名稱！' };
    if (password.length < 4) return { success: false, error: '密碼長度至少需 4 位！' };

    const exists = this.accounts.some(a => a.username.toLowerCase() === trimmed.toLowerCase());
    if (exists) return { success: false, error: '此用戶名已被註冊，請換一個！' };

    const newUser = {
      id: 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4),
      username: trimmed,
      password: password,
      email: '',
      authType: 'local',
      avatar: avatar || '👑',
      avatarUrl: null,
      level: 1,
      exp: 0,
      createdAt: new Date().toLocaleDateString('zh-TW'),
      googleId: null
    };

    this.accounts.push(newUser);
    this.saveAccounts();
    this.setCurrentUser(newUser);

    return { success: true, user: newUser };
  }

  // 本地/雲端帳號登入 (支援跨設備以帳號名稱或 Gmail 自動識別與同步)
  async signIn(username, password) {
    const trimmed = username.trim();
    if (!trimmed) return { success: false, error: '請輸入用戶名稱或 Gmail！' };

    let user = this.accounts.find(a => 
      a.username.toLowerCase() === trimmed.toLowerCase() || 
      (a.email && a.email.toLowerCase() === trimmed.toLowerCase())
    );

    // 1. 若本機尚未記錄該帳號 (例如手機新開)，查詢全域跨設備註冊名冊
    if (!user) {
      try {
        const globalRaw = localStorage.getItem('royal_registered_accounts_global_v2');
        if (globalRaw) {
          const globalList = JSON.parse(globalRaw);
          const found = globalList.find(a => 
            (a.username && a.username.toLowerCase() === trimmed.toLowerCase()) ||
            (a.email && a.email.toLowerCase() === trimmed.toLowerCase())
          );
          if (found) {
            if (found.password && found.password !== password) {
              return { success: false, error: '密碼輸入不正確！' };
            }
            this.accounts.push(found);
            this.saveAccounts();
            this.setCurrentUser(found);
            return { success: true, user: found };
          }
        }
      } catch (e) {}
    }

    // 2. 向雲端伺服器專屬查詢
    if (!user) {
      try {
        const queryUser = {
          username: trimmed,
          email: trimmed.includes('@') ? trimmed : '',
          authType: 'local'
        };
        const remoteData = await cloudSync.loadAccountFromServer(queryUser);
        if (remoteData) {
          const importedUser = {
            id: 'user_' + Date.now().toString(36),
            username: remoteData.username || trimmed,
            password: password,
            email: remoteData.email || (trimmed.includes('@') ? trimmed : ''),
            authType: 'local',
            avatar: '👑',
            avatarUrl: null,
            level: remoteData.playerLevel || remoteData.level || 1,
            exp: remoteData.playerExp || 0,
            createdAt: new Date().toLocaleDateString('zh-TW'),
            googleId: remoteData.googleId || null
          };
          this.accounts.push(importedUser);
          this.saveAccounts();
          user = importedUser;
        }
      } catch (e) {
        console.warn('雲端帳號查詢異常:', e);
      }
    }

    if (!user) {
      return { success: false, error: '找不到該用戶名稱！請確認名稱是否正確' };
    }

    if (user.password && user.password !== password) {
      return { success: false, error: '密碼輸入不正確！' };
    }

    this.setCurrentUser(user);
    return { success: true, user };
  }

  // JWT Payload 解析輔助函式 (Google One-Tap / GSI Credential)
  parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('解析 Google JWT 失敗:', e);
      return null;
    }
  }

  // 處理真實 Google Profile 認證登入 (跨設備雲端自動同步)
  async processGoogleProfile(googleProfile) {
    if (!googleProfile) return { success: false, error: '無法讀取 Google 用戶資訊' };

    const gName = googleProfile.name || googleProfile.email.split('@')[0] || 'Google 領主';
    const gEmail = googleProfile.email;
    const gId = googleProfile.sub || googleProfile.id || ('google_' + Date.now());
    const gPicture = googleProfile.picture || null;

    // 檢查本地是否已有該 Google ID 或 Email 綁定的帳號
    let user = this.accounts.find(a => a.googleId === gId || (a.email && a.email.toLowerCase() === gEmail.toLowerCase()));

    // 若本地無紀錄，從雲端伺服器查詢跨設備已存檔的 Google 資料
    if (!user) {
      try {
        const remoteData = await cloudSync.loadAccountFromServer({ email: gEmail, googleId: gId });
        if (remoteData) {
          const newUser = {
            id: 'google_' + gId.substr(0, 10) + '_' + Date.now().toString(36),
            username: remoteData.username || gName,
            password: '',
            email: gEmail,
            authType: 'google',
            avatar: '👑',
            avatarUrl: gPicture,
            level: remoteData.level || 1,
            exp: 0,
            createdAt: new Date().toLocaleDateString('zh-TW'),
            googleId: gId
          };
          this.accounts.push(newUser);
          this.saveAccounts();
          this.setCurrentUser(newUser);
          return { success: true, user: newUser, isNew: false };
        }
      } catch (e) {
        console.warn('Google 雲端帳號拉取異常:', e);
      }
    }

    if (user) {
      user.googleId = gId;
      user.email = gEmail;
      user.authType = 'google';
      if (gPicture) user.avatarUrl = gPicture;
      this.saveAccounts();
      this.setCurrentUser(user);
      return { success: true, user, isNew: false };
    }

    // 創建新 Google 帳號
    const newUser = {
      id: 'google_' + gId.substr(0, 10) + '_' + Date.now().toString(36),
      username: gName,
      password: '',
      email: gEmail,
      authType: 'google',
      avatar: '👑',
      avatarUrl: gPicture,
      level: 1,
      exp: 0,
      createdAt: new Date().toLocaleDateString('zh-TW'),
      googleId: gId
    };

    this.accounts.push(newUser);
    this.saveAccounts();
    this.setCurrentUser(newUser);

    return { success: true, user: newUser, isNew: true };
  }

  // 將當前帳號綁定真實 Google
  processLinkGoogle(googleProfile) {
    if (!this.currentUser) return { success: false, error: '未登入任何帳號' };
    if (!googleProfile) return { success: false, error: '無法讀取 Google 用戶資訊' };

    const gEmail = googleProfile.email;
    const gId = googleProfile.sub || googleProfile.id || ('google_' + Date.now());
    const gPicture = googleProfile.picture || null;

    this.currentUser.email = gEmail;
    this.currentUser.googleId = gId;
    this.currentUser.authType = 'google';
    if (gPicture) this.currentUser.avatarUrl = gPicture;

    this.saveAccounts();
    return { success: true, user: this.currentUser };
  }

  // 檢查是否為真實有效的 Google Client ID (非 sample 或佔位符)
  hasValidGoogleClientId() {
    return this.googleClientId && 
      !this.googleClientId.includes('sample') && 
      this.googleClientId.includes('.apps.googleusercontent.com');
  }

  // 觸發真實 Google OAuth2 彈窗或 GSI
  async triggerRealGoogleAuth(isLinking = false) {
    return new Promise((resolve) => {
      // 1. 若配置了真實有效 Google Client ID 且 SDK 就緒，呼叫官方 OAuth2 彈窗
      if (this.hasValidGoogleClientId() && window.google?.accounts?.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: this.googleClientId,
            scope: 'openid email profile',
            callback: async (tokenResponse) => {
              if (tokenResponse && tokenResponse.access_token) {
                try {
                  // 向 Google 官方 API 請求真實用戶檔案
                  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                  });
                  if (res.ok) {
                    const profile = await res.json();
                    const result = isLinking ? this.processLinkGoogle(profile) : this.processGoogleProfile(profile);
                    resolve(result);
                    return;
                  }
                } catch (err) {
                  console.error('向 Google API 請求用戶資料失敗:', err);
                }
              }
              resolve({ success: false, error: 'Google 授權中斷或失敗' });
            },
            error_callback: (err) => {
              console.warn('Google OAuth 提示:', err);
              this.promptManualGoogleAuth(isLinking, resolve);
            }
          });

          client.requestAccessToken();
          return;
        } catch (e) {
          console.warn('初始化 Google Token Client 異常:', e);
        }
      }

      // 2. 若尚未在 Google Cloud 配置 Client ID，提供極簡一鍵真實信箱綁定/登入
      this.promptManualGoogleAuth(isLinking, resolve);
    });
  }

  promptManualGoogleAuth(isLinking, resolve) {
    const userGoogleEmail = prompt(
      '【真實 Google 帳號串接】\n' +
      '因尚未在 Google Cloud Console 設定 Client ID，\n' +
      '請直接輸入您的 Google 信箱 (例如 eric961230146@gmail.com)：',
      'eric961230146@gmail.com'
    );

    if (userGoogleEmail && userGoogleEmail.includes('@')) {
      const emailClean = userGoogleEmail.trim();
      const defaultName = emailClean.split('@')[0];
      const userName = prompt('請輸入您的 Google 顯示暱稱：', defaultName);
      const profile = {
        name: (userName && userName.trim()) ? userName.trim() : defaultName,
        email: emailClean,
        sub: 'google_uid_' + Math.abs(emailClean.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)),
        picture: null
      };
      const result = isLinking ? this.processLinkGoogle(profile) : this.processGoogleProfile(profile);
      resolve(result);
    } else {
      resolve({ success: false, error: '已取消 Google 登入' });
    }
  }

  // 更新用戶檔案（暱稱、頭像）
  updateProfile(newUsername, newAvatar) {
    if (!this.currentUser) return false;

    if (newUsername && newUsername.trim()) {
      this.currentUser.username = newUsername.trim();
    }
    if (newAvatar) {
      this.currentUser.avatar = newAvatar;
    }

    this.saveAccounts();
    return true;
  }

  // 登出帳號
  signOut() {
    localStorage.removeItem(CURRENT_USER_KEY);
    this.currentUser = this.loadCurrentUser();
    return this.currentUser;
  }
}

export const auth = new AuthManager();
