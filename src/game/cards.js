/**
 * 皇室對決 3D - 終極卡牌、法術、建築、英雄技能與天梯/任務庫 (繁體中文)
 */

export const RARITY = {
  COMMON: { id: 'common', name: '普通', color: '#9bb0c8', bg: '#2b3952' },
  RARE: { id: 'rare', name: '稀有', color: '#ff9924', bg: '#4a2c00' },
  EPIC: { id: 'epic', name: '史詩', color: '#c42eff', bg: '#3e085c' },
  LEGENDARY: { id: 'legendary', name: '傳奇', color: '#00ffc4', bg: '#004a3e' }
};

export const CARDS = {
  knight: {
    id: 'knight',
    name: '騎士',
    cost: 3,
    type: 'troop',
    rarity: 'common',
    icon: '⚔️',
    description: '身披精鋼鎧甲的英勇劍士，具備優異的生命值與單體近戰傷害，是性價比極高的地面核心。',
    count: 1,
    hp: 1450,
    damage: 165,
    hitSpeed: 1.1,
    speed: 1.2,
    range: 0.8,
    targets: 'ground',
    flying: false,
    radius: 0.5,
    mass: 1.2
  },

  archers: {
    id: 'archers',
    name: '弓箭手',
    cost: 3,
    type: 'troop',
    rarity: 'common',
    icon: '🏹',
    description: '一對敏捷的遠程雙人射手，能同時打擊地面與空中目標，是靈活的防守反擊利器。',
    count: 2,
    hp: 260,
    damage: 95,
    hitSpeed: 1.0,
    speed: 1.3,
    range: 5.0,
    targets: 'all',
    flying: false,
    radius: 0.35,
    mass: 0.6
  },

  giant: {
    id: 'giant',
    name: '巨人',
    cost: 5,
    type: 'troop',
    rarity: 'rare',
    icon: '🗿',
    description: '行動沉穩但體魄極其龐大的攻城泰坦，無視普通小兵，直奔敵方防禦塔與皇家建築！',
    count: 1,
    hp: 3500,
    damage: 220,
    hitSpeed: 1.5,
    speed: 0.8,
    range: 0.9,
    targets: 'buildings',
    flying: false,
    radius: 0.85,
    mass: 3.5
  },

  goblins: {
    id: 'goblins',
    name: '哥布林軍團',
    cost: 2,
    type: 'troop',
    rarity: 'common',
    icon: '🗡️',
    description: '三隻移動極快的小刺客，擅長快速突襲與圍攻高血量單體目標。',
    count: 3,
    hp: 170,
    damage: 100,
    hitSpeed: 0.9,
    speed: 2.1,
    range: 0.6,
    targets: 'ground',
    flying: false,
    radius: 0.3,
    mass: 0.4
  },

  wizard: {
    id: 'wizard',
    name: '魔法師',
    cost: 5,
    type: 'troop',
    rarity: 'rare',
    icon: '🧙‍♂️',
    description: '釋放毀滅性範圍爆炸火球的法師，是成群敵軍與人海兵團的夢魘。',
    count: 1,
    hp: 620,
    damage: 240,
    hitSpeed: 1.4,
    speed: 1.2,
    range: 5.5,
    splashRadius: 1.5,
    targets: 'all',
    flying: false,
    radius: 0.45,
    mass: 0.8
  },

  dragon: {
    id: 'dragon',
    name: '飛龍寶寶',
    cost: 4,
    type: 'troop',
    rarity: 'epic',
    icon: '🐲',
    description: '可愛的空中飛行單位，能直接橫越河流噴吐範圍龍息，兼具對地與對空打擊。',
    count: 1,
    hp: 1050,
    damage: 140,
    hitSpeed: 1.4,
    speed: 1.4,
    range: 3.5,
    splashRadius: 1.2,
    targets: 'all',
    flying: true,
    radius: 0.6,
    mass: 1.5
  },

  skeletons: {
    id: 'skeletons',
    name: '骷髏大軍',
    cost: 3,
    type: 'troop',
    rarity: 'common',
    icon: '💀',
    description: '一次性召喚 8 隻骷髏小兵，能在眨眼間淹沒敵方單體巨人或騎士！',
    count: 8,
    hp: 85,
    damage: 70,
    hitSpeed: 0.9,
    speed: 1.8,
    range: 0.5,
    targets: 'ground',
    flying: false,
    radius: 0.25,
    mass: 0.2
  },

  pekka: {
    id: 'pekka',
    name: '皮卡超人',
    cost: 7,
    type: 'troop',
    rarity: 'epic',
    icon: '🤖',
    description: '身穿重型機械鋼甲的毀滅戰神，揮舞超能激光巨劍，每一擊皆具備滅頂之災！',
    count: 1,
    hp: 3100,
    damage: 680,
    hitSpeed: 1.8,
    speed: 0.9,
    range: 0.9,
    targets: 'ground',
    flying: false,
    radius: 0.75,
    mass: 3.0
  },

  hogrider: {
    id: 'hogrider',
    name: '野豬騎士',
    cost: 4,
    type: 'troop',
    rarity: 'rare',
    icon: '🐗',
    description: '騎乘野豬的高速拆塔先鋒，能直接跨過河流直奔敵方防禦塔狂暴敲擊！',
    count: 1,
    hp: 1400,
    damage: 260,
    hitSpeed: 1.3,
    speed: 2.2,
    range: 0.8,
    targets: 'buildings',
    flying: false,
    radius: 0.5,
    mass: 1.5
  },

  musketeer: {
    id: 'musketeer',
    name: '火槍手',
    cost: 4,
    type: 'troop',
    rarity: 'rare',
    icon: '👒',
    description: '手持重型火槍的精準射手，擁有超遠射程與穩定高額單體輸出。',
    count: 1,
    hp: 600,
    damage: 185,
    hitSpeed: 1.0,
    speed: 1.2,
    range: 6.0,
    targets: 'all',
    flying: false,
    radius: 0.4,
    mass: 0.8
  },

  goblinhut: {
    id: 'goblinhut',
    name: '哥布林小屋',
    cost: 5,
    type: 'building',
    rarity: 'rare',
    icon: '🛖',
    description: '生產哥布林的部落茅屋，每隔 4 秒持續召喚一隻哥布林奔赴前線施壓！',
    hp: 1200,
    lifetime: 32,
    spawnInterval: 4.0,
    spawnCardId: 'goblins',
    targets: 'ground',
    flying: false,
    radius: 0.75
  },

  rage: {
    id: 'rage',
    name: '狂暴法術',
    cost: 2,
    type: 'spell',
    rarity: 'epic',
    icon: '🔥',
    description: '在指定範圍生成狂暴能量紫霧，大幅提升所有友方單位 +35% 移動與攻擊速度！',
    duration: 6.0,
    speedBoost: 1.35,
    radius: 4.5,
    targets: 'friendly'
  },

  freeze: {
    id: 'freeze',
    name: '冰凍法術',
    cost: 4,
    type: 'spell',
    rarity: 'epic',
    icon: '❄️',
    description: '降下極寒冰風暴，將目標區域內所有敵軍兵團與防禦塔完全凍結 3.5 秒！',
    duration: 3.5,
    damage: 95,
    crownTowerDamage: 35,
    radius: 3.5,
    targets: 'all'
  },

  fireball: {
    id: 'fireball',
    name: '火球術',
    cost: 4,
    type: 'spell',
    rarity: 'rare',
    icon: '☄️',
    description: '從天而降的狂暴爆炸法術，對中心區域造成巨額傷害並擊退中小型單位。',
    damage: 580,
    crownTowerDamage: 210,
    radius: 2.5,
    targets: 'all'
  },

  arrows: {
    id: 'arrows',
    name: '萬箭齊發',
    cost: 3,
    type: 'spell',
    rarity: 'common',
    icon: '🎯',
    description: '覆蓋超大範圍的箭雨壓制，能徹底清除敵方骷髏海與哥布林軍團。',
    damage: 250,
    crownTowerDamage: 90,
    radius: 4.0,
    targets: 'all'
  },

  inferno: {
    id: 'inferno',
    name: '地獄塔',
    cost: 5,
    type: 'building',
    rarity: 'rare',
    icon: '🗼',
    description: '發射高能聚焦激光的防禦建築，鎖定同一目標時間越久傷害成倍暴增，專克巨人與皮卡！',
    hp: 1500,
    lifetime: 30,
    damageInitial: 40,
    damageMax: 450,
    rampTime: 4.0,
    hitSpeed: 0.4,
    range: 6.0,
    targets: 'all',
    flying: false,
    radius: 0.8
  },

  // === 原創特色英雄角色 (Original Characters) ===

  cyber_ninja: {
    id: 'cyber_ninja',
    name: '賽博幻影忍者',
    cost: 4,
    type: 'troop',
    rarity: 'epic',
    icon: '🥷',
    description: '裝備高頻等離子雙刃的賽博幻影忍者！具備超高速移動與疾風連斬，每次攻擊釋放青色雷射刀光！',
    count: 1,
    hp: 980,
    damage: 220,
    hitSpeed: 0.75,
    speed: 2.3,
    range: 0.8,
    targets: 'ground',
    flying: false,
    radius: 0.45,
    mass: 1.0
  },

  thunder_valkyrie: {
    id: 'thunder_valkyrie',
    name: '雷霆女武神',
    cost: 4,
    type: 'troop',
    rarity: 'epic',
    icon: '⚡',
    description: '手持雷霆戰斧的女武神，揮舞戰斧進行 360° 全方位雷電旋風斬，對周圍所有地面敵軍造成群體重創！',
    count: 1,
    hp: 1650,
    damage: 230,
    hitSpeed: 1.2,
    speed: 1.4,
    range: 1.0,
    splashRadius: 2.2,
    targets: 'ground',
    flying: false,
    radius: 0.6,
    mass: 1.6
  },

  mecha_golem: {
    id: 'mecha_golem',
    name: '泰坦機甲魔像',
    cost: 6,
    type: 'troop',
    rarity: 'legendary',
    icon: '🦾',
    description: '重裝合金鑄造的泰坦巨型機甲，專門鎖定建築推進，每記鐵拳重擊引發地面強烈地震衝擊波！',
    count: 1,
    hp: 4200,
    damage: 340,
    hitSpeed: 1.6,
    speed: 0.85,
    range: 1.1,
    splashRadius: 2.0,
    targets: 'buildings',
    flying: false,
    radius: 0.9,
    mass: 4.0
  },

  phoenix_mage: {
    id: 'phoenix_mage',
    name: '不死鳥炎術師',
    cost: 5,
    type: 'troop',
    rarity: 'legendary',
    icon: '🦅',
    description: '沐浴在涅槃神火中的飛行傳奇炎術師，高空懸停並向地面或空中投擲具有追蹤軌跡的範圍連鎖鳳凰天火！',
    count: 1,
    hp: 1100,
    damage: 260,
    hitSpeed: 1.3,
    speed: 1.3,
    range: 5.0,
    splashRadius: 1.8,
    targets: 'all',
    flying: true,
    radius: 0.65,
    mass: 1.4
  }
};

// 國王主動英雄技能
export const KING_POWERS = {
  shield: {
    id: 'shield',
    name: '皇家聖盾',
    icon: '🛡️',
    cost: 2,
    cooldown: 40,
    duration: 3.0,
    description: '為全體友方防禦塔降下神聖庇護金鐘罩，持續時間內完全免疫一切傷害！'
  },
  blizzard: {
    id: 'blizzard',
    name: '絕對零度',
    icon: '❄️',
    cost: 3,
    cooldown: 45,
    duration: 2.5,
    description: '引發全圖絕對零度暴風雪，強行凍結戰場上所有敵方單位與建築 2.5 秒！'
  },
  meteor: {
    id: 'meteor',
    name: '天基流星',
    icon: '☄️',
    cost: 4,
    cooldown: 50,
    damage: 750,
    radius: 3.2,
    description: '召喚天基巨型毀滅隕石轟擊全場任意指定座標，造成毀滅性範圍物理衝擊！'
  }
};

// 防禦塔基礎數值
export const TOWER_STATS = {
  princess: {
    hp: 2550,
    damage: 105,
    hitSpeed: 0.8,
    range: 7.5,
    targets: 'all'
  },
  king: {
    hp: 4000,
    damage: 120,
    hitSpeed: 1.0,
    range: 7.0,
    targets: 'all',
    active: false
  }
};

// 升級數值曲線
export function getCardScaledStats(cardId, level = 1) {
  const base = CARDS[cardId];
  if (!base) return null;

  const multiplier = Math.pow(1.10, level - 1);
  return {
    ...base,
    level,
    hp: base.hp ? Math.round(base.hp * multiplier) : undefined,
    damage: base.damage ? Math.round(base.damage * multiplier) : undefined,
    crownTowerDamage: base.crownTowerDamage ? Math.round(base.crownTowerDamage * multiplier) : undefined,
    damageInitial: base.damageInitial ? Math.round(base.damageInitial * multiplier) : undefined,
    damageMax: base.damageMax ? Math.round(base.damageMax * multiplier) : undefined
  };
}

// 升級消耗 (Balanced Royale Progression Economy)
export const UPGRADE_COSTS = [
  { level: 1, cardsNeeded: 0, goldNeeded: 0 },
  { level: 2, cardsNeeded: 2, goldNeeded: 100 },
  { level: 3, cardsNeeded: 4, goldNeeded: 250 },
  { level: 4, cardsNeeded: 10, goldNeeded: 600 },
  { level: 5, cardsNeeded: 20, goldNeeded: 1500 },
  { level: 6, cardsNeeded: 50, goldNeeded: 4000 },
  { level: 7, cardsNeeded: 100, goldNeeded: 10000 },
  { level: 8, cardsNeeded: 200, goldNeeded: 25000 },
  { level: 9, cardsNeeded: 400, goldNeeded: 50000 },
  { level: 10, cardsNeeded: 800, goldNeeded: 100000 }
];

// 寶箱配置
export const CHESTS = {
  silver: {
    id: 'silver',
    name: '白銀寶箱',
    costType: 'gold',
    cost: 400,
    icon: '📦',
    color: '#8ba2b8',
    cardCount: 6,
    goldMin: 250,
    goldMax: 500,
    gemsMin: 2,
    gemsMax: 6,
    guaranteedRare: 1,
    guaranteedEpic: 0,
    description: '輕巧的白銀寶箱，包含基礎金幣與多張戰鬥卡牌。'
  },
  crown: {
    id: 'crown',
    name: '皇冠尊爵寶箱',
    costType: 'gold',
    cost: 1500,
    icon: '👑',
    color: '#ffc107',
    cardCount: 16,
    goldMin: 1000,
    goldMax: 2200,
    gemsMin: 8,
    gemsMax: 18,
    guaranteedRare: 4,
    guaranteedEpic: 1,
    description: '皇家榮譽尊爵寶箱，保證獲得大量金幣與多張稀有與史詩卡牌！'
  },
  magical: {
    id: 'magical',
    name: '神奇魔力寶箱',
    costType: 'gems',
    cost: 280,
    icon: '✨',
    color: '#c42eff',
    cardCount: 28,
    goldMin: 2200,
    goldMax: 4500,
    gemsMin: 15,
    gemsMax: 30,
    guaranteedRare: 8,
    guaranteedEpic: 3,
    description: '蘊含強大奧術魔力的寶箱，必出多張稀有與極品史詩卡牌！'
  },
  legendary: {
    id: 'legendary',
    name: '傳奇超級神箱',
    costType: 'gems',
    cost: 750,
    icon: '💎',
    color: '#00ffc4',
    cardCount: 45,
    goldMin: 6000,
    goldMax: 15000,
    gemsMin: 50,
    gemsMax: 100,
    guaranteedRare: 14,
    guaranteedEpic: 7,
    guaranteedLegendary: 1,
    description: '皇家最高規格的尊貴神箱，海量碎片並 100% 必出傳奇卡牌！'
  }
};

// 兼容 magic / magical 別名
CHESTS.magic = CHESTS.magical;


// 天梯獎盃之路里程碑 (Trophy Road)
export const TROPHY_ROAD = [
  { trophies: 1000, name: '哥布林叢林', rewardType: 'gold', rewardVal: 500, rewardIcon: '🪙 500 金幣' },
  { trophies: 1500, name: '野骨礦坑', rewardType: 'chest', rewardVal: 'silver', rewardIcon: '📦 白銀寶箱' },
  { trophies: 2000, name: '皇家騎士競技場', rewardType: 'gems', rewardVal: 50, rewardIcon: '💎 50 寶石' },
  { trophies: 2500, name: '奧術法術工坊', rewardType: 'chest', rewardVal: 'magical', rewardIcon: '✨ 神奇寶箱' },
  { trophies: 3000, name: '冰封雪嶺山巔', rewardType: 'gold', rewardVal: 2000, rewardIcon: '🪙 2000 金幣' },
  { trophies: 3500, name: '幽魂亡靈古堡', rewardType: 'gems', rewardVal: 100, rewardIcon: '💎 100 寶石' },
  { trophies: 4000, name: '傳奇宗師聖殿', rewardType: 'chest', rewardVal: 'legendary', rewardIcon: '💎 傳奇超級寶箱' }
];

// 每日任務定義 (Daily Quests)
export const DEFAULT_QUESTS = [
  { id: 'deploy_troops', title: '出戰點兵', desc: '在任意模式下部署 15 次兵團單位', goal: 15, current: 0, rewardGold: 200, rewardGems: 10 },
  { id: 'win_matches', title: '皇室連勝', desc: '在人機或對戰中取得 2 場勝利', goal: 2, current: 0, rewardGold: 300, rewardGems: 15 },
  { id: 'play_7x_elixir', title: '狂暴風暴', desc: '體驗 1 場 7X 無限聖水狂歡模式', goal: 1, current: 0, rewardGold: 250, rewardGems: 12 },
  { id: 'open_chest', title: '寶箱探秘', desc: '在抽卡大廳中開啟任意 1 個皇家寶箱', goal: 1, current: 0, rewardGold: 150, rewardGems: 8 }
];

// 預設 8 張出戰卡組
export const DEFAULT_DECK = [
  'knight',
  'archers',
  'giant',
  'goblins',
  'wizard',
  'dragon',
  'skeletons',
  'fireball'
];

// 👑 皇室戰令 / 賽季通行證 (Royale Pass - 10 Tiers)
export const ROYALE_PASS_TIERS = [
  { tier: 1, crownsReq: 5, freeReward: { type: 'gold', val: 300, icon: '🪙 300 金幣' }, goldReward: { type: 'gems', val: 50, icon: '💎 50 寶石' } },
  { tier: 2, crownsReq: 10, freeReward: { type: 'chest', val: 'silver', icon: '📦 白銀寶箱' }, goldReward: { type: 'gold', val: 1000, icon: '🪙 1000 金幣' } },
  { tier: 3, crownsReq: 15, freeReward: { type: 'gems', val: 30, icon: '💎 30 寶石' }, goldReward: { type: 'chest', val: 'magical', icon: '✨ 神奇寶箱' } },
  { tier: 4, crownsReq: 20, freeReward: { type: 'gold', val: 600, icon: '🪙 600 金幣' }, goldReward: { type: 'gems', val: 100, icon: '💎 100 寶石' } },
  { tier: 5, crownsReq: 25, freeReward: { type: 'chest', val: 'silver', icon: '📦 白銀寶箱' }, goldReward: { type: 'gold', val: 2000, icon: '🪙 2000 金幣' } },
  { tier: 6, crownsReq: 30, freeReward: { type: 'gems', val: 50, icon: '💎 50 寶石' }, goldReward: { type: 'chest', val: 'magical', icon: '✨ 神奇寶箱' } },
  { tier: 7, crownsReq: 35, freeReward: { type: 'gold', val: 1000, icon: '🪙 1000 金幣' }, goldReward: { type: 'gems', val: 150, icon: '💎 150 寶石' } },
  { tier: 8, crownsReq: 40, freeReward: { type: 'chest', val: 'magical', icon: '✨ 神奇寶箱' }, goldReward: { type: 'gold', val: 4000, icon: '🪙 4000 金幣' } },
  { tier: 9, crownsReq: 45, freeReward: { type: 'gems', val: 80, icon: '💎 80 寶石' }, goldReward: { type: 'gems', val: 200, icon: '💎 200 寶石' } },
  { tier: 10, crownsReq: 50, freeReward: { type: 'chest', val: 'legendary', icon: '💎 傳奇超級寶箱' }, goldReward: { type: 'chest', val: 'legendary', icon: '👑 黃金傳奇特權寶箱 + 專屬戰令金頭像' } }
];

// 🎁 七日簽到豪禮 (7-Day Login Rewards)
export const SEVEN_DAY_REWARDS = [
  { day: 1, rewardType: 'gold', val: 500, icon: '🪙 500 金幣', title: '初入王國' },
  { day: 2, rewardType: 'gems', val: 50, icon: '💎 50 寶石', title: '璀璨起步' },
  { day: 3, rewardType: 'chest', val: 'silver', icon: '📦 白銀寶箱', title: '探秘寶藏' },
  { day: 4, rewardType: 'gold', val: 1200, icon: '🪙 1200 金幣', title: '軍費充足' },
  { day: 5, rewardType: 'chest', val: 'magical', icon: '✨ 神奇寶箱', title: '奧術洗禮' },
  { day: 6, rewardType: 'gems', val: 150, icon: '💎 150 寶石', title: '寶石狂歡' },
  { day: 7, rewardType: 'chest', val: 'legendary', icon: '👑 傳奇超級寶箱', title: '登峰造極' }
];

// 🎖️ 榮譽成就系統 (Achievements System)
export const ACHIEVEMENTS = [
  { id: 'first_win', name: '首戰告捷', desc: '在人機或對戰中取得 1 場勝利', goal: 1, rewardGems: 20, icon: '🏅' },
  { id: 'master_wins', name: '百戰百勝', desc: '累計取得 10 場戰鬥大捷', goal: 10, rewardGems: 100, icon: '🏆' },
  { id: 'deploy_swarm', name: '千軍萬馬', desc: '在戰場上部署超過 50 次部隊', goal: 50, rewardGems: 50, icon: '⚔️' },
  { id: 'card_upgrades', name: '精兵悍將', desc: '累計升級任意卡牌 5 次', goal: 5, rewardGems: 60, icon: '⭐' },
  { id: 'open_chests', name: '尋寶達人', desc: '在抽卡大廳中累計開啟 8 個寶箱', goal: 8, rewardGems: 80, icon: '🎁' },
  { id: 'crown_collector', name: '王冠之主', desc: '累計收穫超過 20 顆皇冠', goal: 20, rewardGems: 120, icon: '👑' }
];

// 🌟 玩家 1-100 級升等體系與獎勵系統 (Player 100-Level System)
export const MAX_PLAYER_LEVEL = 100;

export function getPlayerExpRequired(level) {
  if (level >= MAX_PLAYER_LEVEL) return Infinity;
  // 1-10 級：100-300 EXP；10-50 級平滑遞增；50-100 級高階挑戰
  return Math.floor(80 + Math.pow(level, 1.35) * 25);
}

export function getPlayerLevelTitle(level) {
  if (level >= 100) return '👑 神聖皇權至尊宗師';
  if (level >= 90) return '⚡ 萬王之王 · 傳奇霸主';
  if (level >= 80) return '🦾 泰坦機神 · 滅世君王';
  if (level >= 70) return '🐉 龍血禁衛 · 破曉領主';
  if (level >= 60) return '🔥 熾焰法皇 · 奧術主宰';
  if (level >= 50) return '⚔️ 帝國大元帥 · 戰神';
  if (level >= 40) return '🛡️ 聖殿守護 · 皇家騎士長';
  if (level >= 30) return '✨ 奧術大師 · 元素使者';
  if (level >= 20) return '🏹 皇家先鋒 · 銳箭統帥';
  if (level >= 10) return '🗡️ 精銳戰士 · 榮譽騎士';
  return '🌱 新生領主';
}

export function getPlayerLevelReward(level) {
  // 每 10 級：超巨量金幣 + 大量寶石 + 傳奇超級寶箱
  if (level % 10 === 0) {
    return {
      type: 'major',
      gold: level * 100,
      gems: level * 4,
      chest: level >= 50 ? 'legendary' : 'magical',
      icon: level >= 50 ? '👑' : '✨',
      title: `【${getPlayerLevelTitle(level)}】稱號 + ${level * 100}🪙 + ${level * 4}💎 + 寶箱`
    };
  }
  // 每 5 級：神奇寶箱 / 白銀寶箱
  if (level % 5 === 0) {
    return {
      type: 'chest',
      gold: level * 60,
      gems: level * 2,
      chest: level >= 40 ? 'magical' : 'silver',
      icon: '📦',
      title: `${level * 60}🪙 + ${level * 2}💎 + 皇家寶箱`
    };
  }
  // 普通等級：金幣 + 寶石
  return {
    type: 'normal',
    gold: level * 40 + 100,
    gems: Math.floor(level / 2) + 5,
    chest: null,
    icon: '🪙',
    title: `${level * 40 + 100}🪙 金幣 + ${Math.floor(level / 2) + 5}💎 寶石`
  };
}


