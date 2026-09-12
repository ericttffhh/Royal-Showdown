/**
 * 皇室對決 3D - 終極卡牌、法術、建築、英雄技能與天梯/任務庫 (繁體中文)
 */

export const RARITY = {
  COMMON: { id: 'common', name: '普通', color: '#9bb0c8', bg: '#2b3952' },
  RARE: { id: 'rare', name: '稀有', color: '#ff9924', bg: '#4a2c00' },
  EPIC: { id: 'epic', name: '史詩', color: '#c42eff', bg: '#3e085c' },
  LEGENDARY: { id: 'legendary', name: '傳奇', color: '#00ffc4', bg: '#004a3e' },
  CHAMPION: { id: 'champion', name: '英雄', color: '#ffd700', bg: '#593800' }
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
  },

  // === 👑 皇室英雄冠軍卡牌 (Champions with Active Abilities) ===

  golden_knight: {
    id: 'golden_knight',
    name: '金甲狂劍士',
    cost: 4,
    type: 'troop',
    rarity: 'champion',
    icon: '🤴',
    isChampion: true,
    description: '身穿純金戰甲的尊貴英雄！能發動【金光疾風連斬】，連續突進瞬殺周遭多個敵軍單位！',
    count: 1,
    hp: 1800,
    damage: 210,
    hitSpeed: 0.9,
    speed: 1.4,
    range: 0.8,
    targets: 'ground',
    flying: false,
    radius: 0.55,
    mass: 1.6,
    ability: {
      id: 'dash_strike',
      name: '金光疾風連斬',
      icon: '⚡',
      cost: 1,
      cooldown: 12,
      dashes: 6,
      damage: 320,
      description: '消耗 1 聖水，化作金色電光向最多 6 個敵方目標發動高速連環突刺！'
    }
  },

  skeleton_king: {
    id: 'skeleton_king',
    name: '骷髏死靈王者',
    cost: 4,
    type: 'troop',
    rarity: 'champion',
    icon: '👑💀',
    isChampion: true,
    description: '冥界骷髏霸主！在戰場上收集逝去亡魂，並能施展【靈魂亡靈召喚】呼喚亡者骷髏大軍！',
    count: 1,
    hp: 2300,
    damage: 205,
    hitSpeed: 1.6,
    speed: 1.1,
    range: 1.0,
    splashRadius: 1.5,
    targets: 'ground',
    flying: false,
    radius: 0.7,
    mass: 2.5,
    ability: {
      id: 'soul_summon',
      name: '亡靈亡者召喚',
      icon: '💀✨',
      cost: 2,
      cooldown: 15,
      description: '消耗 2 聖水，在周圍瞬間召喚 8 隻受靈魂庇護的狂暴骷髏親衛隊！'
    }
  },

  archer_queen: {
    id: 'archer_queen',
    name: '幻影隱匿弓皇',
    cost: 5,
    type: 'troop',
    rarity: 'champion',
    icon: '👸🏹',
    isChampion: true,
    description: '手持改良連弩的精靈女皇！發動【隱形神速連弩】可進入完全隱形狀態並以 300% 射速狂射！',
    count: 1,
    hp: 1000,
    damage: 230,
    hitSpeed: 1.2,
    speed: 1.2,
    range: 5.5,
    targets: 'all',
    flying: false,
    radius: 0.45,
    mass: 0.9,
    ability: {
      id: 'cloak_shot',
      name: '隱匿神速連弩',
      icon: '👁️‍🗨️',
      cost: 1,
      cooldown: 14,
      duration: 3.5,
      speedMultiplier: 3.0,
      description: '消耗 1 聖水，進入 3.5 秒隱形狀態免疫鎖定，並獲得 +200% 攻擊射速！'
    }
  }
};

// === ⚡ 卡牌覺醒進化系統 (Card Evolutions / Hypercharge) ===
export const CARD_EVOLUTIONS = {
  barbarians: {
    baseCardId: 'goblins', // 適用於近戰兵團或替代
    evoId: 'barbarians_evo',
    name: '狂化連斬野蠻人',
    icon: '⚡🗡️',
    cycleNeeded: 1,
    statBonus: { hpMult: 1.3, dmgMult: 1.25, speedMult: 1.2 },
    description: '每使用 1 次啟動覺醒！生命值低於 50% 時進入狂暴狀態，攻速暴增 +60%！'
  },
  wizard: {
    baseCardId: 'wizard',
    evoId: 'wizard_evo',
    name: '混沌天火大法師',
    icon: '⚡🧙‍♂️',
    cycleNeeded: 1,
    statBonus: { hpMult: 1.2, dmgMult: 1.3, splashMult: 1.5 },
    description: '每使用 1 次啟動覺醒！每次火球爆炸引發環形衝擊波，擊退敵軍並附帶持續燃燒！'
  },
  archers: {
    baseCardId: 'archers',
    evoId: 'archers_evo',
    name: '致命精準獵殺弓手',
    icon: '⚡🏹',
    cycleNeeded: 2,
    statBonus: { hpMult: 1.2, dmgMult: 1.4, rangeMult: 1.25 },
    description: '每使用 2 次啟動覺醒！射程提升至 6.5 格，且每一箭皆具備貫穿直線所有敵人的穿透神箭！'
  },
  knight: {
    baseCardId: 'knight',
    evoId: 'knight_evo',
    name: '不屈聖盾重裝騎士',
    icon: '⚡🛡️',
    cycleNeeded: 2,
    statBonus: { hpMult: 1.35, dmgMult: 1.15 },
    description: '每使用 2 次啟動覺醒！前方展開不屈力場聖盾，承受所有遠程與正面傷害降低 50%！'
  }
};

// === 🏰 防禦塔 3D 造型系統 (Tower Skins) ===
export const TOWER_SKINS = {
  classic: {
    id: 'classic',
    name: '經典皇家金冠塔',
    icon: '🏰',
    colorTheme: { base: 0x2255aa, crown: 0xffd700, stone: 0x8899aa, roof: 0xcc2222 },
    costGems: 0,
    reqTrophies: 0,
    description: '承襲百年皇家正統工藝的經典石砌金頂城堡。'
  },
  inferno: {
    id: 'inferno',
    name: '熔岩地獄黑曜塔',
    icon: '🌋',
    colorTheme: { base: 0x221111, crown: 0xff4500, stone: 0x3a1a1a, roof: 0xff2200 },
    costGems: 500,
    reqTrophies: 1500,
    description: '由地底黑曜石與永恆熔火鍛造，散發熾熱的毀滅氣息！'
  },
  frost: {
    id: 'frost',
    name: '極寒冰霜水晶塔',
    icon: '🧊',
    colorTheme: { base: 0x113355, crown: 0x00ffff, stone: 0x5588bb, roof: 0x00ccff },
    costGems: 800,
    reqTrophies: 2500,
    description: '終年被萬年極冰籠罩，周圍環繞璀璨冰晶與寒霧！'
  },
  cyber: {
    id: 'cyber',
    name: '霓虹賽博未來塔',
    icon: '🏙️',
    colorTheme: { base: 0x0a0f1d, crown: 0xff00ff, stone: 0x1a2536, roof: 0x00f3ff },
    costGems: 1200,
    reqTrophies: 3500,
    description: '來自 2077 年的賽博全息矩陣要塞，閃耀動態霓虹光環！'
  }
};

// === 🏟️ 3D 主題戰鬥競技場 (Themed 3D Arenas) ===
export const ARENA_THEMES = {
  royal_valley: {
    id: 'royal_valley',
    name: '皇家河谷',
    icon: '🌱',
    groundColor: 0x3d7e35,
    riverColor: 0x1a73e8,
    bridgeColor: 0x8d6e63,
    fogColor: 0x64b5f6,
    ambientLight: 0xffffff,
    dirLight: 0xfffaed,
    description: '綠意盎然的皇家正統對決河谷，流水潺潺。'
  },
  inferno_abyss: {
    id: 'inferno_abyss',
    name: '熔岩深淵',
    icon: '🌋',
    groundColor: 0x241715,
    riverColor: 0xff4500,
    bridgeColor: 0x4a2820,
    fogColor: 0xff3300,
    ambientLight: 0xff8866,
    dirLight: 0xff4411,
    particles: 'magma',
    description: '地獄裂谷熔岩四溢，火山灰與熾熱火星在空氣中燃燒！'
  },
  frozen_peak: {
    id: 'frozen_peak',
    name: '極地冰嶺',
    icon: '❄️',
    groundColor: 0xd8e8f5,
    riverColor: 0x00d2ff,
    bridgeColor: 0x90a4ae,
    fogColor: 0xb0e0e6,
    ambientLight: 0xccf0ff,
    dirLight: 0xddf4ff,
    particles: 'snow',
    description: '暴風雪肆虐的高海拔極峰，冰川晶瑩剔透！'
  }
};

// === 🧗 肉鴿地下城試煉塔 (Roguelike Dungeon Gauntlet) ===
export const DUNGEON_RELICS = {
  elixir_spring: {
    id: 'elixir_spring',
    name: '永恆聖水靈泉',
    icon: '💧',
    desc: '戰鬥中聖水恢復速度永久提升 +25%',
    type: 'elixir_speed',
    value: 1.25
  },
  vampiric_edge: {
    id: 'vampiric_edge',
    name: '嗜血吸魂魔刃',
    icon: '🩸',
    desc: '所有友軍部隊造成傷害時吸取 15% 生命值',
    type: 'lifesteal',
    value: 0.15
  },
  iron_skin: {
    id: 'iron_skin',
    name: '泰坦不滅鋼甲',
    icon: '🛡️',
    desc: '所有部隊最大生命值提升 +30%',
    type: 'hp_boost',
    value: 1.30
  },
  thunder_strike: {
    id: 'thunder_strike',
    name: '雷霆降世天譴',
    icon: '⚡',
    desc: '每次下兵時，天降一道閃電劈擊最近的敵軍 (200 傷害)',
    type: 'spawn_bolt',
    value: 200
  },
  siege_mastery: {
    id: 'siege_mastery',
    name: '攻城毀滅巨力',
    icon: '💥',
    desc: '部隊對防禦塔與皇家建築的傷害提升 +40%',
    type: 'crown_dmg',
    value: 1.40
  },
  chrono_haste: {
    id: 'chrono_haste',
    name: '時空疾速印記',
    icon: '🌀',
    desc: '所有友軍移動與攻擊速度額外提升 +25%',
    type: 'haste',
    value: 1.25
  }
};

export const DUNGEON_FLOORS = [
  { floor: 1, name: '初探地牢迷宮', enemyDeck: ['knight', 'archers', 'goblins'], enemyElixirRate: 1.0, towerHpMult: 0.8, bossName: null, rewardGold: 300, rewardGems: 15 },
  { floor: 2, name: '哥布林強盜窩', enemyDeck: ['goblins', 'goblinhut', 'archers', 'fireball'], enemyElixirRate: 1.1, towerHpMult: 0.9, bossName: null, rewardGold: 450, rewardGems: 20 },
  { floor: 3, name: '骷髏墓穴守衛', enemyDeck: ['skeletons', 'knight', 'wizard', 'arrows'], enemyElixirRate: 1.15, towerHpMult: 1.0, bossName: '💀 墓穴大領主', rewardGold: 600, rewardGems: 25 },
  { floor: 4, name: '極寒冰封迴廊', enemyDeck: ['wizard', 'dragon', 'freeze', 'knight'], enemyElixirRate: 1.2, towerHpMult: 1.05, bossName: null, rewardGold: 800, rewardGems: 30 },
  { floor: 5, name: '狂暴野蠻人要塞', enemyDeck: ['hogrider', 'rage', 'pekka', 'musketeer'], enemyElixirRate: 1.25, towerHpMult: 1.1, bossName: '🐗 狂怒野豬之王', rewardGold: 1000, rewardGems: 40 },
  { floor: 6, name: '熔岩地獄煉獄', enemyDeck: ['inferno', 'dragon', 'fireball', 'giant'], enemyElixirRate: 1.3, towerHpMult: 1.15, bossName: null, rewardGold: 1250, rewardGems: 50 },
  { floor: 7, name: '雷霆電磁工坊', enemyDeck: ['thunder_valkyrie', 'musketeer', 'pekka', 'rage'], enemyElixirRate: 1.35, towerHpMult: 1.2, bossName: '⚡ 雷霆統帥', rewardGold: 1500, rewardGems: 60 },
  { floor: 8, name: '暗夜忍者密林', enemyDeck: ['cyber_ninja', 'golden_knight', 'archers', 'fireball'], enemyElixirRate: 1.4, towerHpMult: 1.25, bossName: null, rewardGold: 1800, rewardGems: 70 },
  { floor: 9, name: '不死鳥炎王神殿', enemyDeck: ['phoenix_mage', 'skeleton_king', 'mecha_golem', 'freeze'], enemyElixirRate: 1.45, towerHpMult: 1.3, bossName: '🦅 涅槃炎帝', rewardGold: 2200, rewardGems: 90 },
  { floor: 10, name: '深淵終焉 · 萬惡魔神殿', enemyDeck: ['mecha_golem', 'pekka', 'phoenix_mage', 'thunder_valkyrie', 'inferno', 'fireball'], enemyElixirRate: 1.6, towerHpMult: 1.5, bossName: '👹 萬惡魔神泰坦 (終極BOSS)', rewardGold: 5000, rewardGems: 300, rewardChest: 'legendary' }
];

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


