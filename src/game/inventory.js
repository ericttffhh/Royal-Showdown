import { CARDS, CHESTS, UPGRADE_COSTS, DEFAULT_DECK, DEFAULT_QUESTS, MAX_PLAYER_LEVEL, getPlayerExpRequired, getPlayerLevelReward } from './cards.js';
import { auth } from './auth.js';

/**
 * 玩家資源、背包、任務、1-100級升等、天梯與對戰重播記錄系統 (支援多帳號獨立儲存與隔離)
 */

export class InventoryManager {
  constructor() {
    this.data = this.loadData();
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

  loadData() {
    try {
      const key = this.getStorageKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
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

  saveData() {
    try {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(this.data));
    } catch (e) {
      console.error('儲存失敗:', e);
    }
  }

  switchUser() {
    this.data = this.loadData();
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
}

export const inventory = new InventoryManager();


