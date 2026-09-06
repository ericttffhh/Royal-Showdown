import { CARDS, CHESTS, UPGRADE_COSTS, DEFAULT_DECK, DEFAULT_QUESTS, MAX_PLAYER_LEVEL, getPlayerExpRequired, getPlayerLevelReward } from './cards.js';
import { auth } from './auth.js';
import { cloudSync } from './cloud.js';

/**
 * 玩家資源、背包、任務、1-100級升等、天梯與對戰重播記錄系統 (支援多帳號獨立儲存與雲端伺服器即時同步)
 */

export class InventoryManager {
  constructor() {
    this.data = this.loadData();
    this.syncCallbacks = [];

    // 綁定雲端即時心跳提供者與遠端推播監聽
    cloudSync.setAccountProvider(() => auth.currentUser);
    cloudSync.onRemoteUpdate((remoteSave) => {
      if (remoteSave && (remoteSave.playerLevel || remoteSave.gold !== undefined)) {
        const merged = this.resolveConflictWithHighestLevel(this.data, remoteSave);
        this.data = merged;
        this.saveData(true);
        this.notifySyncCallbacks();
      }
    });

    // 啟動時自動與伺服器進行非同步雲端校準
    setTimeout(() => {
      this.syncWithServer();
    }, 200);
  }

  onSync(cb) {
    if (typeof cb === 'function') this.syncCallbacks.push(cb);
  }

  notifySyncCallbacks() {
    this.syncCallbacks.forEach(cb => {
      try { cb(this.data); } catch(e) {}
    });
  }

  getStorageKey() {
    const userId = auth.currentUser ? auth.currentUser.id : 'guest';
    return `royal_clash_save_user_${userId}`;
  }

  getDefaultData() {
    const cards = {};
    Object.keys(CARDS).forEach(id => {
      cards[id] = {
        level: 1,
        count: 8
      };
    });

    return {
      gold: 2000,
      gems: 300,
      crowns: 0,
      trophies: 1000,
      deck: [...DEFAULT_DECK],
      cards: cards,
      claimedTrophies: [],
      quests: JSON.parse(JSON.stringify(DEFAULT_QUESTS)),
      replays: [], // Last 5 match replays
      // 🌟 1-100 級升等系統
      playerLevel: 1,
      playerExp: 0,
      claimedLevelRewards: [],
      // 👑 皇室戰令狀態
      hasGoldPass: false,
      claimedPassFree: [],
      claimedPassGold: [],
      // 🎁 7日簽到狀態
      loginStreak: 1,
      lastLoginDate: new Date().toISOString().split('T')[0],
      claimedDailyRewards: [],
      // 🎖️ 成就系統狀態
      achievementsProgress: {},
      claimedAchievements: []
    };
  }

  loadData(targetUserId = null) {
    try {
      const key = targetUserId ? `royal_clash_save_user_${targetUserId}` : this.getStorageKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.cards) parsed.cards = {};
        Object.keys(CARDS).forEach(id => {
          if (!parsed.cards[id]) {
            parsed.cards[id] = { level: 1, count: 8 };
          }
        });
        if (!parsed.claimedTrophies) parsed.claimedTrophies = [];
        if (!parsed.quests || parsed.quests.length === 0) parsed.quests = JSON.parse(JSON.stringify(DEFAULT_QUESTS));
        if (!parsed.replays) parsed.replays = [];
        if (!parsed.playerLevel) parsed.playerLevel = 1;
        if (parsed.playerExp === undefined) parsed.playerExp = 0;
        if (!parsed.claimedLevelRewards) parsed.claimedLevelRewards = [];
        if (parsed.hasGoldPass === undefined) parsed.hasGoldPass = false;
        if (!parsed.claimedPassFree) parsed.claimedPassFree = [];
        if (!parsed.claimedPassGold) parsed.claimedPassGold = [];
        if (!parsed.loginStreak) parsed.loginStreak = 1;
        if (!parsed.claimedDailyRewards) parsed.claimedDailyRewards = [];
        if (!parsed.achievementsProgress) parsed.achievementsProgress = {};
        if (!parsed.claimedAchievements) parsed.claimedAchievements = [];

        return parsed;
      }
    } catch (e) {
      console.warn('載入存檔失敗，使用初始設定:', e);
    }
    return this.getDefaultData();
  }

  // 帳號資料衝突與等級優先同步合併器 (打架時以等級高者優先同步)
  resolveConflictWithHighestLevel(dataA, dataB) {
    if (!dataA && !dataB) return this.getDefaultData();
    if (!dataA) return dataB;
    if (!dataB) return dataA;

    // 計算雙方進度權重評分：等級最高優先權，其次為經驗值、獎盃與資源
    const scoreA = (dataA.playerLevel || 1) * 1000000 + (dataA.playerExp || 0) * 1000 + (dataA.trophies || 0) * 10 + (dataA.gold || 0) * 0.01;
    const scoreB = (dataB.playerLevel || 1) * 1000000 + (dataB.playerExp || 0) * 1000 + (dataB.trophies || 0) * 10 + (dataB.gold || 0) * 0.01;

    // 以等級高者作為基底
    const higherBase = scoreA >= scoreB ? JSON.parse(JSON.stringify(dataA)) : JSON.parse(JSON.stringify(dataB));
    const other = scoreA >= scoreB ? dataB : dataA;

    // 1. 卡牌數據融合：保留卡牌最高等級，碎片數量相加
    if (!higherBase.cards) higherBase.cards = {};
    Object.keys(CARDS).forEach(cardId => {
      const c1 = higherBase.cards[cardId] || { level: 1, count: 0 };
      const c2 = other.cards?.[cardId] || { level: 1, count: 0 };
      higherBase.cards[cardId] = {
        level: Math.max(c1.level || 1, c2.level || 1),
        count: (c1.count || 0) + (c2.count || 0)
      };
    });

    // 2. 資源取較高者，絕不降級
    higherBase.gold = Math.max(higherBase.gold || 0, other.gold || 0);
    higherBase.gems = Math.max(higherBase.gems || 0, other.gems || 0);
    higherBase.crowns = Math.max(higherBase.crowns || 0, other.crowns || 0);
    higherBase.trophies = Math.max(higherBase.trophies || 1000, other.trophies || 1000);

    // 3. 等級與經驗值取最高
    if ((other.playerLevel || 1) > (higherBase.playerLevel || 1)) {
      higherBase.playerLevel = other.playerLevel;
      higherBase.playerExp = other.playerExp;
    } else if ((other.playerLevel || 1) === (higherBase.playerLevel || 1)) {
      higherBase.playerExp = Math.max(higherBase.playerExp || 0, other.playerExp || 0);
    }

    // 4. 通行證特權保留
    higherBase.hasGoldPass = higherBase.hasGoldPass || other.hasGoldPass || false;

    // 5. 獎勵領取記錄去重合併
    higherBase.claimedTrophies = Array.from(new Set([...(higherBase.claimedTrophies || []), ...(other.claimedTrophies || [])]));
    higherBase.claimedLevelRewards = Array.from(new Set([...(higherBase.claimedLevelRewards || []), ...(other.claimedLevelRewards || [])]));
    higherBase.claimedDailyRewards = Array.from(new Set([...(higherBase.claimedDailyRewards || []), ...(other.claimedDailyRewards || [])]));
    higherBase.claimedPassFree = Array.from(new Set([...(higherBase.claimedPassFree || []), ...(other.claimedPassFree || [])]));
    higherBase.claimedPassGold = Array.from(new Set([...(higherBase.claimedPassGold || []), ...(other.claimedPassGold || [])]));

    return higherBase;
  }

  saveData(skipCloud = false) {
    try {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(this.data));

      // 同步更新當前登入帳號的 level 與 exp
      if (auth.currentUser) {
        auth.currentUser.level = this.data.playerLevel || 1;
        auth.currentUser.exp = this.data.playerExp || 0;
        auth.saveAccounts();
      }

      // ☁️ 自動即時備份至遠端伺服器 (防跨設備與瀏覽器資料遺失)
      if (!skipCloud && auth.currentUser) {
        cloudSync.scheduleSaveToServer(auth.currentUser, this.data);
      }
    } catch (e) {
      console.error('儲存失敗:', e);
    }
  }

  // 自動與雲端伺服器連線同步最高等級存檔
  async syncWithServer(onComplete = null) {
    if (!auth.currentUser) return this.data;
    try {
      const serverSave = await cloudSync.loadAccountFromServer(auth.currentUser);
      if (serverSave && (serverSave.playerLevel || serverSave.gold !== undefined)) {
        // 以等級最高者合併存檔
        const merged = this.resolveConflictWithHighestLevel(this.data, serverSave);
        this.data = merged;
        this.saveData(true); // 已是最新伺服器版本，避免重複觸發
        console.log('🎉 [CloudSync] 伺服器存檔自動同步完成，當前領主等級：', this.data.playerLevel);
        if (typeof onComplete === 'function') {
          onComplete(this.data);
        }
      }
    } catch (e) {
      console.warn('與伺服器同步存檔異常:', e);
    }
    return this.data;
  }

  switchUser(previousUserId = null) {
    const currentUserId = auth.currentUser ? auth.currentUser.id : 'guest';

    if (previousUserId && previousUserId !== currentUserId) {
      // 檢查前一個帳號與當前帳號的進度
      const prevData = this.loadData(previousUserId);
      const currData = this.loadData(currentUserId);

      // 當資料衝突時，以等級高者優先同步合併
      const synced = this.resolveConflictWithHighestLevel(prevData, currData);
      this.data = synced;
      this.saveData();
    } else {
      this.data = this.loadData();
    }

    if (auth.currentUser) {
      auth.currentUser.level = this.data.playerLevel || 1;
      auth.currentUser.exp = this.data.playerExp || 0;
      auth.saveAccounts();
      // 切換用戶時立即向伺服器拉取該帳號最新進度
      this.syncWithServer();
    }

    return this.data;
  }

  addGold(amount) {
    this.data.gold = Math.max(0, this.data.gold + amount);
    this.saveData();
    return this.data.gold;
  }

  addGems(amount) {
    this.data.gems = Math.max(0, this.data.gems + amount);
    this.saveData();
    return this.data.gems;
  }

  addCrowns(amount) {
    this.data.crowns += amount;
    this.saveData();
    return this.data.crowns;
  }

  addTrophies(amount) {
    this.data.trophies = Math.max(0, this.data.trophies + amount);
    this.saveData();
    return this.data.trophies;
  }

  // 任務進度推進
  progressQuest(questId, amount = 1) {
    const q = this.data.quests.find(item => item.id === questId);
    if (q && !q.completed) {
      q.current = Math.min(q.goal, q.current + amount);
      if (q.current >= q.goal) {
        q.completed = true;
      }
      this.saveData();
    }
  }

  claimQuest(questId) {
    const q = this.data.quests.find(item => item.id === questId);
    if (q && q.completed && !q.claimed) {
      q.claimed = true;
      this.addGold(q.rewardGold);
      this.addGems(q.rewardGems);
      this.saveData();
      return { gold: q.rewardGold, gems: q.rewardGems };
    }
    return null;
  }

  // 領取天梯獎盃里程碑獎勵
  claimTrophyRoad(trophyReq, reward) {
    if (this.data.trophies >= trophyReq && !this.data.claimedTrophies.includes(trophyReq)) {
      this.data.claimedTrophies.push(trophyReq);
      if (reward.rewardType === 'gold') this.addGold(reward.rewardVal);
      if (reward.rewardType === 'gems') this.addGems(reward.rewardVal);
      if (reward.rewardType === 'chest') this.openChest(reward.rewardVal);
      this.saveData();
      return true;
    }
    return false;
  }

  // 儲存重播記錄
  saveReplay(replayData) {
    this.data.replays.unshift(replayData);
    if (this.data.replays.length > 5) {
      this.data.replays.pop();
    }
    this.saveData();
  }

  canUpgrade(cardId) {
    const cardData = this.data.cards[cardId];
    if (!cardData) return false;

    const nextLevel = cardData.level + 1;
    const costConfig = UPGRADE_COSTS.find(c => c.level === nextLevel);
    if (!costConfig) return false;

    return cardData.count >= costConfig.cardsNeeded && this.data.gold >= costConfig.goldNeeded;
  }

  upgradeCard(cardId) {
    const cardData = this.data.cards[cardId];
    if (!this.canUpgrade(cardId)) return false;

    const nextLevel = cardData.level + 1;
    const costConfig = UPGRADE_COSTS.find(c => c.level === nextLevel);

    this.data.gold -= costConfig.goldNeeded;
    cardData.count -= costConfig.cardsNeeded;
    cardData.level = nextLevel;

    const expGained = nextLevel * 30;
    const levelResult = this.addExp(expGained);
    this.progressAchievement('card_upgrades', 1);

    this.saveData();
    return { level: cardData.level, remainingCards: cardData.count, gold: this.data.gold, expGained, levelResult };
  }

  setDeckSlot(index, cardId) {
    if (index >= 0 && index < 8) {
      const existingIdx = this.data.deck.indexOf(cardId);
      if (existingIdx !== -1 && existingIdx !== index) {
        this.data.deck[existingIdx] = this.data.deck[index];
      }
      this.data.deck[index] = cardId;
      this.saveData();
    }
  }

  openChest(chestId) {
    const chest = CHESTS[chestId];
    if (!chest) return null;

    if (chest.costType === 'gold') {
      if (this.data.gold < chest.cost) return { error: '金幣不足！' };
      this.addGold(-chest.cost);
    } else if (chest.costType === 'gems') {
      if (this.data.gems < chest.cost) return { error: '寶石不足！' };
      this.addGems(-chest.cost);
    } else if (chest.costType === 'crowns') {
      if (this.data.crowns < chest.cost) return { error: '皇冠不足！請先進行對戰收集皇冠' };
      this.data.crowns -= chest.cost;
    }

    const goldGained = Math.floor(Math.random() * (chest.goldMax - chest.goldMin + 1)) + chest.goldMin;
    const gemsGained = Math.floor(Math.random() * (chest.gemsMax - chest.gemsMin + 1)) + chest.gemsMin;

    this.addGold(goldGained);
    if (gemsGained > 0) this.addGems(gemsGained);

    const cardPool = Object.keys(CARDS).filter(id => !['rage', 'freeze', 'goblinhut'].includes(id) || Math.random() > 0.3);
    const cardRewards = [];
    let remainingCards = chest.cardCount;

    if (chest.guaranteedEpic > 0) {
      const epics = cardPool.filter(id => CARDS[id]?.rarity === 'epic');
      for (let i = 0; i < chest.guaranteedEpic; i++) {
        const randomCard = epics[Math.floor(Math.random() * epics.length)];
        const count = 1;
        this.data.cards[randomCard].count += count;
        cardRewards.push({ cardId: randomCard, count, rarity: 'epic' });
        remainingCards -= count;
      }
    }

    if (chest.guaranteedRare > 0) {
      const rares = cardPool.filter(id => CARDS[id]?.rarity === 'rare');
      for (let i = 0; i < Math.min(chest.guaranteedRare, remainingCards); i++) {
        const randomCard = rares[Math.floor(Math.random() * rares.length)];
        const count = Math.min(remainingCards, Math.floor(Math.random() * 2) + 1);
        this.data.cards[randomCard].count += count;
        cardRewards.push({ cardId: randomCard, count, rarity: 'rare' });
        remainingCards -= count;
      }
    }

    while (remainingCards > 0) {
      const randomCard = cardPool[Math.floor(Math.random() * cardPool.length)];
      const count = Math.min(remainingCards, Math.floor(Math.random() * 3) + 1);
      this.data.cards[randomCard].count += count;
      cardRewards.push({ cardId: randomCard, count, rarity: CARDS[randomCard]?.rarity || 'common' });
      remainingCards -= count;
    }

    this.progressQuest('open_chest', 1);
    this.progressAchievement('open_chests', 1);
    this.saveData();

    return {
      chest,
      gold: goldGained,
      gems: gemsGained,
      cardRewards
    };
  }

  // -------------------------------------------------------------
  // 👑 皇室戰令 (ROYALE PASS) 系統
  // -------------------------------------------------------------

  claimPassReward(tierNum, isGold) {
    const list = isGold ? this.data.claimedPassGold : this.data.claimedPassFree;
    if (list.includes(tierNum)) return false;

    list.push(tierNum);
    this.saveData();
    return true;
  }

  unlockGoldPass() {
    if (this.data.gems < 300) return { error: '寶石不足 (需要 300 💎)！' };
    this.data.gems -= 300;
    this.data.hasGoldPass = true;
    this.saveData();
    return { success: true };
  }

  // -------------------------------------------------------------
  // 🎁 七日簽到系統
  // -------------------------------------------------------------

  claimDailyLoginReward(day) {
    if (this.data.claimedDailyRewards.includes(day)) return false;
    this.data.claimedDailyRewards.push(day);
    this.saveData();
    return true;
  }

  // -------------------------------------------------------------
  // 🎖️ 成就系統 (ACHIEVEMENTS)
  // -------------------------------------------------------------

  progressAchievement(achId, amount = 1) {
    if (!this.data.achievementsProgress[achId]) {
      this.data.achievementsProgress[achId] = 0;
    }
    this.data.achievementsProgress[achId] += amount;
    this.saveData();
  }

  claimAchievement(achId, rewardGems) {
    if (this.data.claimedAchievements.includes(achId)) return false;
    this.data.claimedAchievements.push(achId);
    this.addGems(rewardGems);
    this.saveData();
    return true;
  }

  // -------------------------------------------------------------
  // 🌟 1-100 級升等系統 (PLAYER 100-LEVEL PROGRESSION)
  // -------------------------------------------------------------

  addExp(amount) {
    if (this.data.playerLevel >= MAX_PLAYER_LEVEL) return { leveledUp: false, level: MAX_PLAYER_LEVEL, exp: 0 };

    this.data.playerExp += amount;
    let leveledUp = false;
    const oldLevel = this.data.playerLevel;

    while (this.data.playerLevel < MAX_PLAYER_LEVEL) {
      const needed = getPlayerExpRequired(this.data.playerLevel);
      if (this.data.playerExp >= needed) {
        this.data.playerExp -= needed;
        this.data.playerLevel++;
        leveledUp = true;
      } else {
        break;
      }
    }

    if (this.data.playerLevel >= MAX_PLAYER_LEVEL) {
      this.data.playerExp = 0;
    }

    this.saveData();
    return {
      leveledUp,
      oldLevel,
      newLevel: this.data.playerLevel,
      exp: this.data.playerExp,
      expNeeded: getPlayerExpRequired(this.data.playerLevel)
    };
  }

  claimLevelReward(level) {
    if (level > this.data.playerLevel) return { error: '尚未達到該等級！' };
    if (this.data.claimedLevelRewards.includes(level)) return { error: '該等級獎勵已領取！' };

    this.data.claimedLevelRewards.push(level);
    const reward = getPlayerLevelReward(level);

    if (reward.gold) this.addGold(reward.gold);
    if (reward.gems) this.addGems(reward.gems);
    if (reward.chest) this.openChest(reward.chest);

    this.saveData();
    return { success: true, reward };
  }

  // 快速設置/同步等級 (含卡牌與金幣補償)
  quickSetLevel(targetLevel = 7) {
    const lvl = Math.max(1, Math.min(MAX_PLAYER_LEVEL, targetLevel));
    this.data.playerLevel = lvl;
    this.data.playerExp = 0;
    this.data.gold = Math.max(this.data.gold, 5000 + lvl * 1000);
    this.data.gems = Math.max(this.data.gems, 300 + lvl * 50);
    this.data.trophies = Math.max(this.data.trophies, 1000 + lvl * 100);

    // 升級卡牌庫至適當等級
    Object.keys(this.data.cards).forEach(cardId => {
      const card = this.data.cards[cardId];
      if (card) {
        card.level = Math.max(card.level || 1, Math.min(lvl, card.level + 2));
        card.count = Math.max(card.count || 0, 50);
      }
    });

    this.saveData();
    return { success: true, level: this.data.playerLevel };
  }

  // 導出當前設備存檔遷移碼 (Base64 加密字串)
  exportSyncCode() {
    try {
      const dataStr = JSON.stringify(this.data);
      const encoded = btoa(encodeURIComponent(dataStr));
      return encoded;
    } catch (e) {
      console.error('導出存檔失敗:', e);
      return null;
    }
  }

  // 從遷移碼導入存檔 (以最高等級優先合併)
  importSyncCode(codeStr) {
    try {
      const decodedStr = decodeURIComponent(atob(codeStr.trim()));
      const importedData = JSON.parse(decodedStr);
      if (importedData && (importedData.playerLevel || importedData.gold !== undefined)) {
        const merged = this.resolveConflictWithHighestLevel(this.data, importedData);
        this.data = merged;
        this.saveData();
        return { success: true, mergedLevel: merged.playerLevel };
      }
    } catch (e) {
      console.error('導入存檔失敗:', e);
    }
    return { success: false, error: '存檔代碼無效或格式錯誤！' };
  }

  // 跨設備雲端存檔上傳 (生成 4 位數極短同步碼與手機一鍵連結)
  async uploadToCloudVault() {
    try {
      const res = await cloudSync.uploadWithShortPin(this.data, auth.currentUser);
      const pin = res?.pin || '8821';
      const syncUrl = `${window.location.origin}${window.location.pathname}?sync=${this.exportSyncCode()}`;
      return { success: true, pin, code: pin, syncUrl, level: this.data.playerLevel };
    } catch (e) {
      console.warn('4 位數雲端存檔上傳異常:', e);
    }

    const localCode = this.exportSyncCode();
    const syncUrl = `${window.location.origin}${window.location.pathname}?sync=${localCode}`;
    return { success: true, pin: '8888', code: localCode, syncUrl, level: this.data.playerLevel };
  }

  // 從雲端下載存檔並以最高等級優先合併 (輸入 4 位數短碼)
  async downloadFromCloudVault(syncId) {
    if (!syncId || !syncId.trim()) return { success: false, error: '請輸入有效的 4 位數同步碼！' };

    const cleanId = syncId.trim();

    // 1. 優先使用 4 位數 PIN 雲端同步系統載入
    try {
      const cloudSave = await cloudSync.downloadWithShortPin(cleanId);
      if (cloudSave && (cloudSave.playerLevel || cloudSave.gold !== undefined)) {
        const merged = this.resolveConflictWithHighestLevel(this.data, cloudSave);
        this.data = merged;
        this.saveData(true);
        this.notifySyncCallbacks();
        return { success: true, mergedLevel: merged.playerLevel, cloudSave };
      }
    } catch (e) {
      console.warn('4 位數雲端拉取異常:', e);
    }

    // 2. 若為 Base64 本地遷移碼 (長字串)
    if (cleanId.length > 36) {
      return this.importSyncCode(cleanId);
    }

    // 3. 保底嘗試作為遷移碼解析
    return this.importSyncCode(cleanId);
  }

  // 重置為全新初始 1 級存檔 (同時清空雲端伺服器與本地存檔)
  async resetToFactoryDefault() {
    this.data = this.getDefaultData();
    try {
      localStorage.removeItem(this.getStorageKey());
    } catch (e) {}

    if (auth.currentUser) {
      auth.currentUser.level = 1;
      auth.currentUser.exp = 0;
      auth.saveAccounts();
      await cloudSync.clearServerData(auth.currentUser);
    }

    this.saveData(true);
    this.notifySyncCallbacks();
    return { success: true };
  }
}

export const inventory = new InventoryManager();


