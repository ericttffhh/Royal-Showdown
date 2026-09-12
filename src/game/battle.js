import * as THREE from 'three';
import { CARDS, TOWER_STATS, KING_POWERS, getCardScaledStats } from './cards.js';
import { inventory } from './inventory.js';
import { ModelFactory } from '../three/models.js';
import { sounds } from '../audio/sound.js';
import { replayRecorder } from './replay.js';

/**
 * 3D 皇室即時對戰物理、狀態效果與國王英雄技能核心 (7X聖水 / 冰凍 / 狂暴 / 慢動作特寫)
 */

let nextEntityId = 1;

export class BattleEngine {
  constructor(arena, effects, callbacks = {}) {
    this.arena = arena;
    this.effects = effects;
    this.callbacks = callbacks; // { onCrownChange, onElixirChange, onTimeChange, onGameOver, onAnnouncement, onBrawlUpdate }

    this.isPaused = true;
    this.isOver = false;
    this.isSuddenDeath = false;
    this.matchTime = 180;
    this.isDoubleElixir = false;
    this.is7XElixir = false;
    this.timeScale = 1.0;

    // Mode & Team Setup
    this.battleMode = 'classic'; // 'classic' | 'brawl' | 'coop' | 'boss' | '7x' | 'pve'
    this.playerTeam = 'blue'; // 'blue' | 'red' | 'green' | 'purple'
    this.playerElixir = 5.0;
    this.enemyElixir = 5.0;
    this.teamElixir = { blue: 5.0, red: 5.0, green: 5.0, purple: 5.0 };

    this.playerCrowns = 0;
    this.enemyCrowns = 0;

    // 4-Player Brawl State
    this.brawlEliminatedTeams = new Set();
    this.brawlBotTimers = { red: 3.0, green: 4.5, purple: 6.0, blue: 3.0 };
    this.isMultiplayerGuest = false; // 🌐 多人連線客端模式 (客端由房主權威同步)

    // 2v2 Coop State
    this.is2v2 = false;
    this.allyElixir = 5.0;
    this.allyDeployTimer = 4.0;

    // Dynamic Battlefield Hazards (暴風雪 / 聖水神符搶奪)
    this.hazardTimer = 25.0;
    this.hazardsEnabled = true;
    this.blizzardDuration = 0;

    this.towers = [];
    this.troops = [];
    this.buildings = [];

    // 國王技能冷卻
    this.kingPowerCooldowns = { shield: 0, blizzard: 0, meteor: 0 };
    this.towerShieldTimer = { blue: 0, red: 0 };

    // 👑 英雄冠軍系統與主動技能 (Champions & Active Abilities)
    this.championUnit = null;
    this.championCooldown = 0;

    // 🧗 肉鴿地牢試煉塔與聖物系統 (Dungeon & Relics)
    this.dungeonFloor = null;
    this.dungeonRelics = [];
    this.playerTowerSkin = 'classic';
    this.enemyTowerSkin = 'classic';

    this.bridges = [
      { x: -4.5, z: 0, width: 2.2 },
      { x: 4.5, z: 0, width: 2.2 }
    ];

    this.initTowers();
  }

  hasRelic(relicId) {
    return this.dungeonRelics && this.dungeonRelics.includes(relicId);
  }

  triggerVibrate(pattern) {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) { }
  }

  setBattleMode(mode, options = {}) {
    this.battleMode = mode;
    this.playerTeam = options.playerTeam || 'blue';
    this.humanTeams = new Set(options.humanTeams || [this.playerTeam]);
    this.is2v2 = mode === 'coop';
    this.hazardsEnabled = options.hazards !== false;
    this.brawlEliminatedTeams.clear();

    this.dungeonFloor = options.dungeonFloor || null;
    this.dungeonRelics = options.dungeonRelics || [];
    this.playerTowerSkin = options.playerTowerSkin || (inventory.data?.selectedTowerSkin || 'classic');
    this.enemyTowerSkin = options.enemyTowerSkin || (mode === 'boss' ? 'inferno' : (options.dungeonFloor ? (options.dungeonFloor.floor > 5 ? 'inferno' : 'classic') : 'classic'));

    if (mode === 'brawl') {
      this.arena.setBrawlLayout(true, this.playerTeam);
    } else {
      this.arena.setBrawlLayout(false);
    }

    this.initTowers();
  }

  initTowers() {
    this.towers.forEach(t => {
      if (t.mesh) this.arena.scene.remove(t.mesh);
    });
    this.towers = [];

    if (this.battleMode === 'brawl') {
      // 💥 四人混戰大亂鬥 - 36x36 巨型四方皇家鬥技場 (四方要塞等距 14.5 格對稱分佈)
      const brawlStats = { hp: 4800, damage: 190, hitSpeed: 1.0, range: 8.0 };

      // South (Blue - 玩家/南方)
      this.towers.push(this.createTower('king_blue', 'blue', 0, 14.5, brawlStats, 'king', this.playerTowerSkin));

      // North (Red - 北方烈焰)
      this.towers.push(this.createTower('king_red', 'red', 0, -14.5, brawlStats, 'king', 'inferno'));

      // West (Green - 西方翡翠)
      this.towers.push(this.createTower('king_green', 'green', -14.5, 0, brawlStats, 'king', 'classic'));

      // East (Purple - 東方虛空)
      this.towers.push(this.createTower('king_purple', 'purple', 14.5, 0, brawlStats, 'king', 'cyber'));
      return;
    }

    let enemyHpMult = 1.0;
    if (this.dungeonFloor && this.dungeonFloor.towerHpMult) {
      enemyHpMult = this.dungeonFloor.towerHpMult;
    }

    const pPrincessStats = { ...TOWER_STATS.princess };
    const pKingStats = { ...TOWER_STATS.king };
    const ePrincessStats = { ...TOWER_STATS.princess, hp: Math.round(TOWER_STATS.princess.hp * enemyHpMult) };
    const eKingStats = { ...TOWER_STATS.king, hp: Math.round(TOWER_STATS.king.hp * enemyHpMult) };

    const pLeft = this.createTower('princess_bl', true, -4.5, 9.5, pPrincessStats, 'princess', this.playerTowerSkin);
    const pRight = this.createTower('princess_br', true, 4.5, 9.5, pPrincessStats, 'princess', this.playerTowerSkin);
    const pKing = this.createTower('king_b', true, 0, 13.0, pKingStats, 'king', this.playerTowerSkin);

    const eLeft = this.createTower('princess_el', false, -4.5, -9.5, ePrincessStats, 'princess', this.enemyTowerSkin);
    const eRight = this.createTower('princess_er', false, 4.5, -9.5, ePrincessStats, 'princess', this.enemyTowerSkin);
    const eKing = this.createTower('king_e', false, 0, -13.0, eKingStats, 'king', this.enemyTowerSkin);

    this.towers = [pLeft, pRight, pKing, eLeft, eRight, eKing];
  }

  createTower(id, isBlueOrTeam, x, z, stats, type, skinId = 'classic') {
    const team = typeof isBlueOrTeam === 'string' ? isBlueOrTeam : (isBlueOrTeam ? 'blue' : 'red');
    const isBlue = team === 'blue';
    const mesh = type === 'king'
      ? ModelFactory.createKingTower(team, skinId)
      : ModelFactory.createPrincessTower(team, skinId);

    mesh.position.set(x, 0, z);
    this.arena.scene.add(mesh);

    return {
      id,
      isBlue,
      team,
      type,
      skinId,
      x,
      z,
      position: new THREE.Vector3(x, 0, z),
      hp: stats.hp,
      maxHp: stats.hp,
      damage: stats.damage,
      hitSpeed: stats.hitSpeed,
      range: stats.range,
      attackCooldown: 0,
      frozenTimer: 0,
      active: type === 'princess',
      mesh,
      shooter: mesh.userData.shooter,
      isTower: true
    };
  }

  canDeployAt(x, z, isBlueOrTeam, isSpell = false) {
    if (isSpell) return true;
    const team = typeof isBlueOrTeam === 'string' ? isBlueOrTeam : (isBlueOrTeam ? 'blue' : 'red');

    if (this.battleMode === 'brawl') {
      if (Math.abs(x) > 17.5 || Math.abs(z) > 17.5) return false;

      // 檢查陣營存亡，若敵方被擊破，其領地開放作為前進出兵區
      const isRedDead = this.brawlEliminatedTeams.has('red');
      const isGreenDead = this.brawlEliminatedTeams.has('green');
      const isPurpleDead = this.brawlEliminatedTeams.has('purple');
      const isBlueDead = this.brawlEliminatedTeams.has('blue');

      if (team === 'blue') {
        if (z >= 0.0 && z <= 17.5 && Math.abs(x) <= 17.0) return true;
        if (isRedDead && z < 0.0) return true;
        if (isGreenDead && x < 0.0) return true;
        if (isPurpleDead && x > 0.0) return true;
        return false;
      }
      if (team === 'red') {
        if (z <= 0.0 && z >= -17.5 && Math.abs(x) <= 17.0) return true;
        if (isBlueDead && z > 0.0) return true;
        if (isGreenDead && x < 0.0) return true;
        if (isPurpleDead && x > 0.0) return true;
        return false;
      }
      if (team === 'green') {
        if (x <= 0.0 && x >= -17.5 && Math.abs(z) <= 17.0) return true;
        if (isPurpleDead && x > 0.0) return true;
        if (isBlueDead && z > 0.0) return true;
        if (isRedDead && z < 0.0) return true;
        return false;
      }
      if (team === 'purple') {
        if (x >= 0.0 && x <= 17.5 && Math.abs(z) <= 17.0) return true;
        if (isGreenDead && x < 0.0) return true;
        if (isBlueDead && z > 0.0) return true;
        if (isRedDead && z < 0.0) return true;
        return false;
      }
      return true;
    }

    if (team === 'blue') {
      if (z >= -0.5 && z <= 17.5 && Math.abs(x) <= 9.5) return true;
      const enemyLeftAlive = this.towers.find(t => t.id === 'princess_el')?.hp > 0;
      const enemyRightAlive = this.towers.find(t => t.id === 'princess_er')?.hp > 0;

      if (!enemyLeftAlive && x < 0 && z >= -7.5) return true;
      if (!enemyRightAlive && x > 0 && z >= -7.5) return true;
    } else {
      if (z <= 0.5 && z >= -17.5 && Math.abs(x) <= 9.5) return true;
      const playerLeftAlive = this.towers.find(t => t.id === 'princess_bl')?.hp > 0;
      const playerRightAlive = this.towers.find(t => t.id === 'princess_br')?.hp > 0;

      if (!playerLeftAlive && x < 0 && z <= 7.5) return true;
      if (!playerRightAlive && x > 0 && z <= 7.5) return true;
    }

    return false;
  }

  getLegalDeployPosition(pos, isBlueOrTeam, isSpell = false) {
    if (isSpell) return { x: pos.x, z: pos.z };
    const team = typeof isBlueOrTeam === 'string' ? isBlueOrTeam : (isBlueOrTeam ? 'blue' : 'red');

    if (this.canDeployAt(pos.x, pos.z, team, isSpell)) {
      return { x: pos.x, z: pos.z };
    }

    // 智能貼齊最接近的合法部署點 (Smart Nearest Clamping)
    const clampedX = Math.max(-8.5, Math.min(8.5, pos.x));
    if (team === 'blue') {
      const enemyLeftAlive = this.towers.find(t => t.id === 'princess_el')?.hp > 0;
      const enemyRightAlive = this.towers.find(t => t.id === 'princess_er')?.hp > 0;
      let minZ = 0.0;
      if (!enemyLeftAlive && clampedX < 0) minZ = -6.5;
      else if (!enemyRightAlive && clampedX > 0) minZ = -6.5;

      const legalZ = Math.max(minZ, Math.min(16.5, pos.z));
      return { x: clampedX, z: legalZ };
    } else {
      const legalZ = Math.max(-16.5, Math.min(0.0, pos.z));
      return { x: clampedX, z: legalZ };
    }
  }

  deployCard(cardId, targetPos, isBlueOrTeam, isRemote = false) {
    const team = typeof isBlueOrTeam === 'string' ? isBlueOrTeam : (isBlueOrTeam ? 'blue' : 'red');
    const isPlayer = team === this.playerTeam;
    const cardLevel = isPlayer ? (inventory.data.cards[cardId]?.level || 1) : 3;
    const card = getCardScaledStats(cardId, cardLevel) || CARDS[cardId];
    if (!card) return false;

    const currentElixir = this.teamElixir[team] ?? (isPlayer ? this.playerElixir : this.enemyElixir);
    // 🌐 若為遠端連線同步過來的出兵請求，絕不可因微小聖水計時偏差而拒絕丟棄！
    if (!isRemote && currentElixir < card.cost) return false;

    if (this.teamElixir[team] !== undefined) {
      this.teamElixir[team] = Math.max(0, this.teamElixir[team] - card.cost);
    }

    if (isPlayer && !isRemote) {
      this.playerElixir = Math.max(0, this.playerElixir - card.cost);
      this.callbacks.onElixirChange?.(this.playerElixir);
      inventory.progressQuest('deploy_troops', 1);
      this.triggerVibrate(15);
    } else if (team === 'red' && this.battleMode !== 'brawl' && !isRemote) {
      this.enemyElixir = Math.max(0, this.enemyElixir - card.cost);
    }

    sounds.playDeploy();
    sounds.playVoice(card.id);

    // 記錄重播事件
    replayRecorder.recordEvent(180 - this.matchTime, 'deploy', { cardId, pos: targetPos, isBlue: isPlayer, team });

    // ⚡ 肉鴿聖物：天譴雷霆 (Thunder Strike Relic)
    if (isPlayer && this.hasRelic('thunder_strike')) {
      this.triggerRelicLightning(targetPos);
    }

    if (card.type === 'spell') {
      this.castSpell(card, targetPos, team);
      return true;
    }

    if (card.type === 'building') {
      this.spawnBuilding(card, targetPos, team);
      return true;
    }

    if (card.isChampion && isPlayer) {
      this.championCard = card;
    }

    this.spawnTroops(card, targetPos, team);
    return true;
  }

  // ⚡ 肉鴿聖物：落雷天譴
  triggerRelicLightning(pos) {
    const enemies = [...this.troops, ...this.towers, ...this.buildings].filter(e => !e.isBlue && e.hp > 0);
    if (enemies.length === 0) return;

    let closest = null;
    let minDist = 12.0;
    enemies.forEach(e => {
      const d = pos.distanceTo ? pos.distanceTo(e.position) : new THREE.Vector3(pos.x, 0, pos.z).distanceTo(e.position);
      if (d < minDist) {
        minDist = d;
        closest = e;
      }
    });

    if (closest) {
      this.effects.createExplosion(closest.position, 0x00f0ff, 18, 1.8);
      sounds.playTone(1200, 300, 0.15, 'sawtooth', 0.3);
      this.damageEntity(closest, 200, true);
    }
  }

  // 👑 英雄主動技能觸發 (Champion Active Ability Trigger)
  activateChampionAbility() {
    if (!this.championUnit || this.championUnit.hp <= 0 || !this.championCard) {
      this.callbacks.onAnnouncement?.('⚠️ 戰場上沒有存活的己方英雄！');
      return false;
    }

    const ability = this.championCard.ability;
    if (!ability) return false;

    if (this.championCooldown > 0) {
      this.callbacks.onAnnouncement?.(`⏳ 英雄技能冷卻中 (${Math.ceil(this.championCooldown)}s)`);
      return false;
    }

    if (this.playerElixir < ability.cost) {
      this.callbacks.onAnnouncement?.(`💧 聖水不足！需要 ${ability.cost} 聖水`);
      return false;
    }

    this.playerElixir -= ability.cost;
    this.callbacks.onElixirChange?.(this.playerElixir);
    this.championCooldown = ability.cooldown;

    sounds.playChampionAbility(ability.id);
    this.triggerVibrate([50, 40, 70]);

    if (ability.id === 'dash_strike') {
      // 🤴 金甲狂劍士：金光疾風連斬 (衝刺連斬最多 6 個目標)
      this.callbacks.onAnnouncement?.('⚡ 金甲狂劍士發動【金光疾風連斬】！');
      const enemies = this.troops.filter(t => !t.isBlue && t.hp > 0);
      enemies.sort((a, b) => a.position.distanceTo(this.championUnit.position) - b.position.distanceTo(this.championUnit.position));
      const targets = enemies.slice(0, ability.dashes || 6);

      targets.forEach((target, idx) => {
        setTimeout(() => {
          if (this.championUnit && this.championUnit.hp > 0 && target.hp > 0) {
            this.championUnit.position.copy(target.position);
            if (this.championUnit.mesh) this.championUnit.mesh.position.copy(target.position);
            this.effects.createExplosion(target.position, 0xffd700, 24, 2.0);
            this.damageEntity(target, ability.damage || 320, true);
          }
        }, idx * 75);
      });
    } else if (ability.id === 'soul_summon') {
      // 💀 骷髏死靈王者：亡靈召喚 (環繞召喚 5 隻骷髏親衛隊)
      this.callbacks.onAnnouncement?.('👑 骷髏死靈王者發動【亡靈召喚】！');
      this.effects.createExplosion(this.championUnit.position, 0xa855f7, 24, 2.0);
      const center = this.championUnit.position;
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const offsetPos = new THREE.Vector3(center.x + Math.cos(angle) * 1.5, 0, center.z + Math.sin(angle) * 1.5);
        this.spawnTroops(CARDS.skeletons, offsetPos, 'blue');
      }
    } else if (ability.id === 'cloak_shot') {
      // 👸 幻影隱匿弓皇：隱匿神速連弩 (隱身 3.5s + 300% 狂暴射速)
      this.callbacks.onAnnouncement?.('🏹 幻影隱匿弓皇發動【隱匿神速連弩】！');
      this.championUnit.invisibleTimer = ability.duration || 3.5;
      this.championUnit.hitSpeed = this.championUnit.hitSpeed / (ability.speedMultiplier || 3.0);
      this.effects.createExplosion(this.championUnit.position, 0x10b981, 20, 2.0);

      // 敵軍失去仇恨
      this.troops.filter(t => !t.isBlue && t.currentTarget === this.championUnit).forEach(t => t.currentTarget = null);
      this.towers.filter(t => !t.isBlue && t.target === this.championUnit).forEach(t => t.target = null);

      setTimeout(() => {
        if (this.championUnit && this.championUnit.hp > 0) {
          const originalCard = CARDS.archer_queen;
          if (originalCard) this.championUnit.hitSpeed = originalCard.hitSpeed;
        }
      }, (ability.duration || 3.5) * 1000);
    }

    return true;
  }

  // -------------------------------------------------------------
  // 國王主動英雄技能 (King Tower Powers)
  // -------------------------------------------------------------

triggerKingPower(powerId, targetPos = null) {
  const power = KING_POWERS[powerId];
  if (!power || this.kingPowerCooldowns[powerId] > 0 || this.playerElixir < power.cost) return false;

  this.playerElixir -= power.cost;
  this.callbacks.onElixirChange?.(this.playerElixir);
  this.kingPowerCooldowns[powerId] = power.cooldown;

  sounds.playVictory();

  if (powerId === 'shield') {
    this.towerShieldTimer.blue = power.duration;
    this.callbacks.onAnnouncement?.('🛡️ 皇家聖盾降臨！全防禦塔無敵 3 秒！');
  } else if (powerId === 'blizzard') {
    this.effects.createFreezeAura(new THREE.Vector3(0, 0, -7), 16, power.duration);
    this.troops.filter(t => !t.isBlue).forEach(t => t.frozenTimer = power.duration);
    this.towers.filter(t => !t.isBlue).forEach(t => t.frozenTimer = power.duration);
    this.buildings.filter(b => !b.isBlue).forEach(b => b.frozenTimer = power.duration);
    this.callbacks.onAnnouncement?.('❄️ 絕對零度爆發！全場敵軍凍結！');
  } else if (powerId === 'meteor') {
    const hitPos = targetPos || new THREE.Vector3(0, 0, -9.5);
    this.effects.spawnMeteor(hitPos, () => {
      sounds.playExplosion();
      this.applyAreaDamage(hitPos, power.radius, power.damage, power.damage * 0.4, true, true);
    });
    this.callbacks.onAnnouncement?.('☄️ 天基軌道流星轟擊！');
  }

  return true;
}

castSpell(card, targetPos, isBlue) {
  const startY = 16;
  const startZ = isBlue ? 16 : -16;
  const startPos = new THREE.Vector3(targetPos.x, startY, startZ);
  const endPos = new THREE.Vector3(targetPos.x, 0, targetPos.z);

  if (card.id === 'rage') {
    sounds.playMagicCast();
    this.effects.createRageAura(endPos, card.radius, card.duration);
    // Buff friendly troops in area
    const targets = this.troops.filter(t => t.isBlue === isBlue && t.hp > 0);
    targets.forEach(t => {
      if (endPos.distanceTo(t.position) <= card.radius) {
        t.ragedTimer = card.duration;
      }
    });
  } else if (card.id === 'freeze') {
    sounds.playMagicCast();
    this.effects.createFreezeAura(endPos, card.radius, card.duration);
    const enemies = [...this.troops, ...this.buildings, ...this.towers].filter(t => t.isBlue !== isBlue && t.hp > 0);
    enemies.forEach(e => {
      if (endPos.distanceTo(e.position) <= card.radius) {
        e.frozenTimer = card.duration;
        this.damageEntity(e, e.isTower ? card.crownTowerDamage : card.damage, isBlue);
      }
    });
  } else if (card.id === 'fireball') {
    this.effects.spawnFireball(startPos, endPos, card.radius, () => {
      sounds.playExplosion();
      this.applyAreaDamage(endPos, card.radius, card.damage, card.crownTowerDamage, isBlue, true);
    });
  } else if (card.id === 'arrows') {
    sounds.playArrowShoot();
    this.effects.spawnSpellArrows(endPos, 16, () => {
      sounds.playHit();
      this.applyAreaDamage(endPos, card.radius, card.damage, card.crownTowerDamage, isBlue, false);
    });
  }
}

applyAreaDamage(center, radius, damage, crownTowerDmg, isAttackerBlueOrTeam, knockback = false) {
  const attackerTeam = typeof isAttackerBlueOrTeam === 'string' ? isAttackerBlueOrTeam : (isAttackerBlueOrTeam ? 'blue' : 'red');
  const targets = [...this.troops, ...this.buildings, ...this.towers];
  targets.forEach(t => {
    const targetTeam = t.team || (t.isBlue ? 'blue' : 'red');
    if (targetTeam !== attackerTeam && t.hp > 0) {
      const dist = center.distanceTo(t.position);
      if (dist <= radius) {
        const dmg = t.isTower ? crownTowerDmg : damage;
        this.damageEntity(t, dmg, attackerTeam);

        if (knockback && !t.isTower && !t.flying && t.cardId !== 'giant' && t.cardId !== 'pekka') {
          const dir = new THREE.Vector3().subVectors(t.position, center).normalize();
          t.position.addScaledVector(dir, 0.8);
          t.mesh.position.copy(t.position);
        }
      }
    }
  });
}

spawnBuilding(card, pos, isBlueOrTeam) {
  const team = typeof isBlueOrTeam === 'string' ? isBlueOrTeam : (isBlueOrTeam ? 'blue' : 'red');
  const isBlue = team === 'blue';
  const id = `building_${nextEntityId++}`;
  const { root, parts } = ModelFactory.createTroopMesh(card.id, team);
  root.position.set(pos.x, 0, pos.z);
  this.arena.scene.add(root);

  const teamSmokeColors = { blue: 0x2288ff, red: 0xff3355, green: 0x00e676, purple: 0xd500f9 };
  this.effects.createSpawnSmoke(pos, teamSmokeColors[team] || 0xffd700);

  this.buildings.push({
    id,
    cardId: card.id,
    isBlue,
    team,
    hp: card.hp,
    maxHp: card.hp,
    range: card.range || 0,
    hitSpeed: card.hitSpeed || 1.0,
    damageInitial: card.damageInitial || 0,
    damageMax: card.damageMax || 0,
    rampTime: card.rampTime || 0,
    lifetime: card.lifetime,
    spawnInterval: card.spawnInterval || 0,
    spawnCooldown: card.spawnInterval || 0,
    age: 0,
    attackCooldown: 0,
    frozenTimer: 0,
    lockedTarget: null,
    lockDuration: 0,
    position: new THREE.Vector3(pos.x, 0, pos.z),
    mesh: root,
    parts,
    isBuilding: true
  });
}

spawnTroops(card, targetPos, isBlueOrTeam) {
  const team = typeof isBlueOrTeam === 'string' ? isBlueOrTeam : (isBlueOrTeam ? 'blue' : 'red');
  const isBlue = team === 'blue';
  const isPlayer = team === this.playerTeam;
  const count = card.count || 1;
  const offsets = this.calculateSpawnOffsets(count);

  const teamSmokeColors = { blue: 0x2288ff, red: 0xff3355, green: 0x00e676, purple: 0xd500f9 };

  let troopHp = card.hp;
  let troopSpeed = card.speed;
  let troopHitSpeed = card.hitSpeed;

  // ⚡ 肉鴿聖物：泰坦不滅鋼甲 (+30% HP)
  if (isPlayer && this.hasRelic('iron_skin')) {
    troopHp = Math.round(troopHp * 1.30);
  }

  // ⚡ 肉鴿聖物：時空疾速印記 (+25% Move/Atk Speed)
  if (isPlayer && this.hasRelic('chrono_haste')) {
    troopSpeed *= 1.25;
    troopHitSpeed *= 0.8;
  }

  offsets.forEach((offset) => {
    const id = `troop_${nextEntityId++}`;
    const spawnX = targetPos.x + offset.x;
    const spawnZ = targetPos.z + offset.z;
    const pos = new THREE.Vector3(spawnX, card.flying ? 1.5 : 0, spawnZ);

    const { root, parts } = ModelFactory.createTroopMesh(card.id, team);
    root.position.copy(pos);
    root.rotation.y = team === 'blue' ? Math.PI : (team === 'green' ? -Math.PI / 2 : (team === 'purple' ? Math.PI / 2 : 0));
    this.arena.scene.add(root);

    this.effects.createSpawnSmoke(pos, teamSmokeColors[team] || 0x2288ff);

    const unit = {
      id,
      cardId: card.id,
      isBlue,
      team,
      hp: troopHp,
      maxHp: troopHp,
      damage: card.damage,
      hitSpeed: troopHitSpeed,
      speed: troopSpeed,
      range: card.range,
      targets: card.targets,
      flying: card.flying,
      splashRadius: card.splashRadius || 0,
      radius: card.radius || 0.4,
      mass: card.mass || 1.0,
      position: pos,
      mesh: root,
      parts,
      attackCooldown: 0.3,
      frozenTimer: 0,
      ragedTimer: 0,
      state: 'move',
      currentTarget: null,
      animTime: Math.random() * 5,
      spawnAge: 0
    };

    if (card.isChampion && isPlayer) {
      this.championUnit = unit;
      this.championCard = card;
    }

    this.troops.push(unit);
  });
}

calculateSpawnOffsets(count) {
  if (count === 1) return [{ x: 0, z: 0 }];
  if (count === 2) return [{ x: -0.6, z: 0 }, { x: 0.6, z: 0 }];
  if (count === 3) return [{ x: -0.7, z: -0.3 }, { x: 0.7, z: -0.3 }, { x: 0, z: 0.4 }];
  if (count === 8) {
    const offsets = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      offsets.push({ x: Math.cos(angle) * 0.9, z: Math.sin(angle) * 0.9 });
    }
    return offsets;
  }
  return [{ x: 0, z: 0 }];
}

// -------------------------------------------------------------
// SIMULATION UPDATE
// -------------------------------------------------------------

update(rawDelta) {
  if (this.isPaused || this.isOver) return;
  const deltaTime = rawDelta * this.timeScale;

  // 更新技能冷卻與護盾
  Object.keys(this.kingPowerCooldowns).forEach(k => {
    this.kingPowerCooldowns[k] = Math.max(0, this.kingPowerCooldowns[k] - deltaTime);
  });
  this.towerShieldTimer.blue = Math.max(0, this.towerShieldTimer.blue - deltaTime);
  this.towerShieldTimer.red = Math.max(0, this.towerShieldTimer.red - deltaTime);

  // 👑 更新英雄技能冷卻與在場狀態
  if (this.championCooldown > 0) {
    this.championCooldown = Math.max(0, this.championCooldown - deltaTime);
  }

  const isChampAlive = !!(this.championUnit && this.championUnit.hp > 0);
  this.callbacks.onChampionStatus?.({
    active: isChampAlive,
    champion: this.championCard,
    cooldown: this.championCooldown
  });

  this.updateMatchTime(deltaTime);
  this.updateElixir(deltaTime);
  this.updateHazards(deltaTime);
  this.updateBrawlBots(deltaTime);
  this.updateAllyAI(deltaTime);
  this.updateTroops(deltaTime);
  this.updateBuildings(deltaTime);
  this.updateTowers(deltaTime);
  this.effects.update(deltaTime);
  this.syncHpBars();
}

updateMatchTime(deltaTime) {
  this.matchTime -= deltaTime;
  const remaining = Math.max(0, Math.ceil(this.matchTime));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  this.callbacks.onTimeChange?.(formatted, this.matchTime);

  if (this.matchTime <= 60 && !this.isDoubleElixir && !this.is7XElixir) {
    this.isDoubleElixir = true;
    sounds.playDoubleElixir();
    this.callbacks.onAnnouncement?.('⚡ 2X 雙倍聖水極速狂暴！');
  }

  if (this.matchTime <= 0) {
    if (this.battleMode === 'brawl') {
      const allTeams = ['blue', 'red', 'green', 'purple'];
      const activeTeams = allTeams.filter(tm => !this.brawlEliminatedTeams.has(tm));
      this.endMatch(activeTeams.includes(this.playerTeam) ? 'win' : 'loss');
      return;
    }

    if (this.playerCrowns !== this.enemyCrowns) {
      this.endMatch(this.playerCrowns > this.enemyCrowns ? 'win' : 'loss');
    } else if (!this.isSuddenDeath) {
      this.isSuddenDeath = true;
      this.matchTime = 60;
      sounds.playDoubleElixir();
      this.callbacks.onAnnouncement?.('⚔️ 突發加時賽！一塔決勝負！');
    } else {
      this.resolveTieBreak();
    }
  }
}

updateElixir(deltaTime) {
  let regenRate = this.isDoubleElixir ? (1 / 1.4) : (1 / 2.8);
  if (this.is7XElixir) {
    regenRate = 2.5;
  }

  // ⚡ 肉鴿聖物：永恆聖水靈泉 (+25% Elixir Speed)
  let playerRegen = regenRate;
  if (this.hasRelic('elixir_spring')) {
    playerRegen *= 1.25;
  }

  let enemyRegen = regenRate;
  if (this.dungeonFloor && this.dungeonFloor.enemyElixirRate) {
    enemyRegen *= this.dungeonFloor.enemyElixirRate;
  }

  this.playerElixir = Math.min(10, this.playerElixir + playerRegen * deltaTime);
  this.enemyElixir = Math.min(10, this.enemyElixir + enemyRegen * deltaTime);

  ['blue', 'red', 'green', 'purple'].forEach(tm => {
    const rate = (tm === this.playerTeam) ? playerRegen : enemyRegen;
    this.teamElixir[tm] = Math.min(10, (this.teamElixir[tm] || 5.0) + rate * deltaTime);
  });

  this.callbacks.onElixirChange?.(this.playerElixir);
}

updateHazards(deltaTime) {
  if (!this.hazardsEnabled) return;

  this.hazardTimer -= deltaTime;
  if (this.hazardTimer <= 0) {
    this.hazardTimer = 35 + Math.random() * 15;
    const hazards = ['blizzard', 'runes'];
    const chosen = hazards[Math.floor(Math.random() * hazards.length)];

    if (chosen === 'blizzard') {
      this.blizzardDuration = 8.0;
      this.arena.setBlizzard(true);
      this.callbacks.onAnnouncement?.('❄️ 極地暴風雪呼嘯！全軍移速減緩 25%！');
      sounds.playDoubleElixir();
    } else if (chosen === 'runes') {
      if (this.arena.elixirRunes) {
        this.arena.elixirRunes.forEach(r => {
          if (this.battleMode === 'brawl') {
            if (r.isBrawlOnly) {
              r.active = true;
              r.respawnTimer = 0;
            }
          } else {
            if (!r.isBrawlOnly) {
              r.active = true;
              r.respawnTimer = 0;
            }
          }
        });
      }
      this.callbacks.onAnnouncement?.(this.battleMode === 'brawl'
        ? '⚡ 鬥技場中央聖壇刷新巨型聖水神符！搶奪可獲 +3 聖水！'
        : '⚡ 戰場河道刷新聖水神符！搶奪可獲 +3 聖水！'
      );
      sounds.playMagicCast();
    }
  }

  if (this.blizzardDuration > 0) {
    this.blizzardDuration -= deltaTime;
    if (this.blizzardDuration <= 0) {
      this.arena.setBlizzard(false);
    }
  }

  // 檢查神符搶奪
  if (this.arena.elixirRunes) {
    this.arena.elixirRunes.forEach(r => {
      if (!r.active) return;
      const runePos = new THREE.Vector3(r.x, 0, r.z);
      for (const t of this.troops) {
        if (t.hp > 0 && t.position.distanceTo(runePos) < 1.4) {
          r.active = false;
          r.respawnTimer = 30.0;
          const tTeam = t.team || (t.isBlue ? 'blue' : 'red');
          this.effects.createExplosion(runePos, 0xff00cc, 22, 2.0);
          sounds.playVictory();

          if (tTeam === this.playerTeam) {
            this.playerElixir = Math.min(10, this.playerElixir + 3);
            this.callbacks.onElixirChange?.(this.playerElixir);
            this.callbacks.onAnnouncement?.('⚡ 你的軍團搶奪到了聖水神符！聖水立即 +3！');
          } else if (this.battleMode === 'brawl') {
            this.teamElixir[tTeam] = Math.min(10, (this.teamElixir[tTeam] || 5) + 3);
            this.callbacks.onAnnouncement?.(`⚡ ${this.getTeamDisplayName(tTeam)} 搶得聖水神符！`);
          } else {
            this.enemyElixir = Math.min(10, this.enemyElixir + 3);
            this.callbacks.onAnnouncement?.('⚡ 敵方奪取了聖水神符！');
          }
          break;
        }
      }
    });
  }
}

updateBrawlBots(deltaTime) {
  if (this.battleMode !== 'brawl') return;
  // 🌐 連線客端嚴禁自行運算 AI，全由房主統一決策並廣播，杜絕資料不一致！
  if (this.isMultiplayerGuest) return;

  const allTeams = ['blue', 'red', 'green', 'purple'];
  const botCardPool = ['knight', 'archers', 'wizard', 'giant', 'goblins', 'cyber_ninja', 'thunder_valkyrie'];

  allTeams.forEach(team => {
    if (team === this.playerTeam) return;
    if (this.humanTeams && this.humanTeams.has(team)) return;
    if (this.brawlEliminatedTeams.has(team)) return;

    this.brawlBotTimers[team] = (this.brawlBotTimers[team] || 0) - deltaTime;
    if (this.brawlBotTimers[team] <= 0 && (this.teamElixir[team] || 0) >= 3.8) {
      this.brawlBotTimers[team] = 4.2 + Math.random() * 3.5;
      const randomCardId = botCardPool[Math.floor(Math.random() * botCardPool.length)];

      let spawnPos;
      if (team === 'red') spawnPos = new THREE.Vector3((Math.random() - 0.5) * 10, 0, -11.5 - Math.random() * 3.5);
      else if (team === 'blue') spawnPos = new THREE.Vector3((Math.random() - 0.5) * 10, 0, 11.5 + Math.random() * 3.5);
      else if (team === 'green') spawnPos = new THREE.Vector3(-11.5 - Math.random() * 3.5, 0, (Math.random() - 0.5) * 10);
      else if (team === 'purple') spawnPos = new THREE.Vector3(11.5 + Math.random() * 3.5, 0, (Math.random() - 0.5) * 10);

      const success = this.deployCard(randomCardId, spawnPos, team);
      if (success) {
        this.callbacks.onBrawlBotDeploy?.(randomCardId, spawnPos, team);
      }
    }
  });
}

updateAllyAI(deltaTime) {
  if (!this.is2v2) return;
  this.allyElixir = Math.min(10, (this.allyElixir || 5.0) + (1 / 2.8) * deltaTime);
  this.allyDeployTimer = (this.allyDeployTimer || 0) - deltaTime;

  if (this.allyDeployTimer <= 0 && this.allyElixir >= 3.5) {
    this.allyDeployTimer = 4.5 + Math.random() * 3.0;
    const allyDeck = ['knight', 'archers', 'wizard', 'thunder_valkyrie', 'goblins'];
    const cardId = allyDeck[Math.floor(Math.random() * allyDeck.length)];
    const spawnPos = new THREE.Vector3((Math.random() - 0.5) * 7.5, 0, 8.0 + Math.random() * 4.0);

    this.allyElixir -= (CARDS[cardId]?.cost || 3);
    this.spawnTroops(CARDS[cardId], spawnPos, 'blue');
    this.callbacks.onAnnouncement?.(`🛡️ 盟友出陣：【${CARDS[cardId].name}】協助推進！`);
  }
}

applyMassWeightedSeparation() {
  const len = this.troops.length;
  for (let i = 0; i < len; i++) {
    const t1 = this.troops[i];
    if (t1.hp <= 0) continue;

    for (let j = i + 1; j < len; j++) {
      const t2 = this.troops[j];
      if (t2.hp <= 0) continue;
      if (t1.flying !== t2.flying) continue;

      const minDist = (t1.radius || 0.4) + (t2.radius || 0.4);
      const dx = t1.position.x - t2.position.x;
      const dz = t1.position.z - t2.position.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < minDist * minDist) {
        let dist = Math.sqrt(distSq);
        let nx, nz;
        if (dist < 0.0001) {
          const angle = Math.random() * Math.PI * 2;
          nx = Math.cos(angle);
          nz = Math.sin(angle);
          dist = 0.0001;
        } else {
          nx = dx / dist;
          nz = dz / dist;
        }

        const overlap = minDist - dist;
        const m1 = t1.mass || 1.0;
        const m2 = t2.mass || 1.0;
        const totalMass = m1 + m2;
        const ratio1 = m2 / totalMass;
        const ratio2 = m1 / totalMass;

        const pushAmount = Math.min(overlap, 0.35) * 0.58;
        t1.position.x += nx * pushAmount * ratio1;
        t1.position.z += nz * pushAmount * ratio1;
        t2.position.x -= nx * pushAmount * ratio2;
        t2.position.z -= nz * pushAmount * ratio2;

        const maxBoundX = this.battleMode === 'brawl' ? 17.5 : 8.5;
        const maxBoundZ = this.battleMode === 'brawl' ? 17.5 : 15.5;

        t1.position.x = Math.max(-maxBoundX, Math.min(maxBoundX, t1.position.x));
        t1.position.z = Math.max(-maxBoundZ, Math.min(maxBoundZ, t1.position.z));
        t2.position.x = Math.max(-maxBoundX, Math.min(maxBoundX, t2.position.x));
        t2.position.z = Math.max(-maxBoundZ, Math.min(maxBoundZ, t2.position.z));

        t1.mesh.position.copy(t1.position);
        t2.mesh.position.copy(t2.position);
      }
    }
  }
}

updateTroops(deltaTime) {
  this.applyMassWeightedSeparation();

  for (let i = this.troops.length - 1; i >= 0; i--) {
    const troop = this.troops[i];
    troop.spawnAge = (troop.spawnAge || 0) + deltaTime;
    if (troop.hp <= 0) {
      this.destroyTroop(i);
      continue;
    }

    // 冰凍狀態
    if (troop.frozenTimer > 0) {
      troop.frozenTimer -= deltaTime;
      continue;
    }

    // 狂暴加速狀態 & 暴風雪減速
    const isRaged = troop.ragedTimer > 0;
    if (isRaged) troop.ragedTimer -= deltaTime;
    let speedMultiplier = isRaged ? 1.35 : 1.0;
    if (this.blizzardDuration > 0) {
      speedMultiplier *= 0.75;
    }

    troop.animTime += deltaTime * 8 * speedMultiplier;
    troop.attackCooldown = Math.max(0, troop.attackCooldown - deltaTime * speedMultiplier);

    const target = this.findBestTarget(troop);
    troop.currentTarget = target;

    if (!target) {
      this.moveTroopForward(troop, deltaTime * speedMultiplier);
      continue;
    }

    const dist = troop.position.distanceTo(target.position);
    const inRange = dist <= (troop.range + (target.radius || 0.8));

    if (inRange) {
      troop.state = 'attack';
      this.lookAtTarget(troop, target.position);
      this.animateTroopAttack(troop);

      if (troop.attackCooldown <= 0) {
        this.performTroopAttack(troop, target);
        troop.attackCooldown = troop.hitSpeed;
      }
    } else {
      troop.state = 'move';
      this.moveTroopTowards(troop, target.position, deltaTime * speedMultiplier);
      this.animateTroopWalk(troop);
    }
  }
}

findBestTarget(troop) {
  let bestTarget = null;
  let minDistance = Infinity;
  const troopTeam = troop.team || (troop.isBlue ? 'blue' : 'red');

  if (troop.targets === 'buildings') {
    const validTargets = [...this.towers, ...this.buildings].filter(t => {
      const tTeam = t.team || (t.isBlue ? 'blue' : 'red');
      return tTeam !== troopTeam && t.hp > 0;
    });
    validTargets.forEach(t => {
      const d = troop.position.distanceTo(t.position);
      if (d < minDistance) {
        minDistance = d;
        bestTarget = t;
      }
    });
    return bestTarget;
  }

  const allEnemies = [
    ...this.troops.filter(t => {
      const tTeam = t.team || (t.isBlue ? 'blue' : 'red');
      return tTeam !== troopTeam && t.hp > 0 && (!t.flying || troop.targets === 'all');
    }),
    ...this.buildings.filter(b => {
      const bTeam = b.team || (b.isBlue ? 'blue' : 'red');
      return bTeam !== troopTeam && b.hp > 0;
    }),
    ...this.towers.filter(tw => {
      const twTeam = tw.team || (tw.isBlue ? 'blue' : 'red');
      return twTeam !== troopTeam && tw.hp > 0;
    })
  ];

  allEnemies.forEach(e => {
    const d = troop.position.distanceTo(e.position);
    const weight = e.isTower ? d + 2.5 : d;
    if (weight < minDistance) {
      minDistance = weight;
      bestTarget = e;
    }
  });

  return bestTarget;
}

moveTroopTowards(troop, targetPos, deltaTime) {
  let waypoint = targetPos;

  // 經典模式下的雙人河道跨橋檢查 (大亂鬥模式下各部隊全向自由尋路推進)
  if (this.battleMode !== 'brawl') {
    const onPlayerSide = troop.position.z > 0;
    const targetOnOtherSide = (troop.isBlue && targetPos.z < 0) || (!troop.isBlue && targetPos.z > 0);
    const canCrossRiverDirectly = troop.flying || troop.cardId === 'hogrider';

    if (!canCrossRiverDirectly && onPlayerSide === troop.isBlue && targetOnOtherSide && Math.abs(troop.position.z) > 1.2) {
      const bridge = Math.abs(troop.position.x - this.bridges[0].x) < Math.abs(troop.position.x - this.bridges[1].x)
        ? this.bridges[0]
        : this.bridges[1];

      const bridgeEntryZ = troop.isBlue ? 1.5 : -1.5;
      if ((troop.isBlue && troop.position.z > bridgeEntryZ) || (!troop.isBlue && troop.position.z < bridgeEntryZ)) {
        waypoint = new THREE.Vector3(bridge.x, 0, bridgeEntryZ);
      } else {
        waypoint = new THREE.Vector3(bridge.x, 0, -bridgeEntryZ);
      }
    }
  }

  const dir = new THREE.Vector3().subVectors(waypoint, troop.position);
  dir.y = 0;
  dir.normalize();

  const separation = this.calculateSeparation(troop);
  dir.addScaledVector(separation, 0.4);
  dir.normalize();

  troop.position.addScaledVector(dir, troop.speed * deltaTime);
  troop.mesh.position.copy(troop.position);

  this.lookAtTarget(troop, waypoint);
}

moveTroopForward(troop, deltaTime) {
  let dir;
  if (this.battleMode === 'brawl') {
    const tm = troop.team || (troop.isBlue ? 'blue' : 'red');
    if (tm === 'blue') dir = new THREE.Vector3(0, 0, -1);
    else if (tm === 'red') dir = new THREE.Vector3(0, 0, 1);
    else if (tm === 'green') dir = new THREE.Vector3(1, 0, 0);
    else if (tm === 'purple') dir = new THREE.Vector3(-1, 0, 0);
    else dir = new THREE.Vector3(0, 0, -1);
  } else {
    dir = new THREE.Vector3(0, 0, troop.isBlue ? -1 : 1);
  }
  troop.position.addScaledVector(dir, troop.speed * deltaTime);
  troop.mesh.position.copy(troop.position);
  this.animateTroopWalk(troop);
}

calculateSeparation(troop) {
  const v = new THREE.Vector3();
  let count = 0;

  this.troops.forEach(other => {
    if (other !== troop) {
      const d = troop.position.distanceTo(other.position);
      if (d < (troop.radius + other.radius + 0.2)) {
        const diff = new THREE.Vector3().subVectors(troop.position, other.position);
        diff.y = 0;
        diff.normalize();
        v.add(diff);
        count++;
      }
    }
  });

  if (count > 0) v.divideScalar(count);
  return v;
}

lookAtTarget(troop, targetPos) {
  const lookTarget = new THREE.Vector3(targetPos.x, troop.position.y, targetPos.z);
  troop.mesh.lookAt(lookTarget);
}

performTroopAttack(troop, target) {
  if (troop.cardId === 'archers' || troop.cardId === 'musketeer') {
    sounds.playArrowShoot();
    const start = troop.position.clone().add(new THREE.Vector3(0, 0.8, 0));
    this.effects.spawnArrow(start, target.position, () => {
      sounds.playHit();
      this.damageEntity(target, troop.damage, troop.isBlue);
    });
  } else if (troop.cardId === 'wizard') {
    sounds.playMagicCast();
    const start = troop.position.clone().add(new THREE.Vector3(0, 1.0, 0));
    this.effects.spawnFireball(start, target.position, troop.splashRadius, () => {
      sounds.playExplosion();
      this.applyAreaDamage(target.position, troop.splashRadius, troop.damage, troop.damage, troop.isBlue);
    });
  } else if (troop.cardId === 'dragon') {
    sounds.playDragonAttack();
    this.effects.createExplosion(target.position, 0x27ae60, 8, troop.splashRadius);
    this.applyAreaDamage(target.position, troop.splashRadius, troop.damage, troop.damage, troop.isBlue);
  } else if (troop.cardId === 'cyber_ninja') {
    // 賽博幻影忍者 - 疾風等離子雷射雙刀
    sounds.playNinjaSlash();
    this.effects.spawnCyberSlash(target.position);
    const isCrit = Math.random() < 0.25; // 25% 暴擊
    const dmg = isCrit ? Math.round(troop.damage * 1.5) : troop.damage;
    this.damageEntity(target, dmg, troop.isBlue);
  } else if (troop.cardId === 'thunder_valkyrie') {
    // 雷霆女武神 - 360° 旋風雷暴範圍斬
    sounds.playThunderSpin();
    this.effects.spawnThunderCyclone(troop.position, troop.splashRadius || 2.2);
    this.applyAreaDamage(troop.position, troop.splashRadius || 2.2, troop.damage, troop.damage, troop.isBlue);
  } else if (troop.cardId === 'mecha_golem') {
    // 泰坦機甲魔像 - 重裝撼地衝擊波
    sounds.playMechaImpact();
    this.effects.spawnShockwave(target.position, troop.splashRadius || 2.0);
    this.applyAreaDamage(target.position, troop.splashRadius || 2.0, troop.damage, troop.damage, troop.isBlue);
  } else if (troop.cardId === 'phoenix_mage') {
    // 不死鳥炎術師 - 高空鳳凰神火投擲
    sounds.playPhoenixFlame();
    const start = troop.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    this.effects.spawnPhoenixProjectile(start, target.position, troop.splashRadius || 1.8, () => {
      sounds.playExplosion();
      this.applyAreaDamage(target.position, troop.splashRadius || 1.8, troop.damage, troop.damage, troop.isBlue);
    });
  } else {
    sounds.playHit();
    this.effects.createExplosion(target.position, 0xffcc00, 6, 0.5);
    this.damageEntity(target, troop.damage, troop.isBlue);
  }
}

updateBuildings(deltaTime) {
  for (let i = this.buildings.length - 1; i >= 0; i--) {
    const b = this.buildings[i];
    b.age += deltaTime;
    b.hp -= (b.maxHp / b.lifetime) * deltaTime;

    if (b.hp <= 0) {
      this.destroyBuilding(i);
      continue;
    }

    if (b.frozenTimer > 0) {
      b.frozenTimer -= deltaTime;
      continue;
    }

    // 哥布林小屋持續生成哥布林
    if (b.cardId === 'goblinhut') {
      b.spawnCooldown -= deltaTime;
      if (b.spawnCooldown <= 0) {
        b.spawnCooldown = b.spawnInterval;
        const spawnOffset = new THREE.Vector3(b.position.x, 0, b.position.z + (b.isBlue ? -1.0 : 1.0));
        this.spawnTroops(CARDS.goblins, spawnOffset, b.isBlue);
      }
    }

    // 地獄塔激光
    if (b.cardId === 'inferno') {
      const target = this.findBestTargetForTower(b);
      if (target) {
        if (b.lockedTarget === target) {
          b.lockDuration += deltaTime;
        } else {
          b.lockedTarget = target;
          b.lockDuration = 0;
        }

        const ramp = Math.min(1.0, b.lockDuration / b.rampTime);
        const currentDmg = b.damageInitial + (b.damageMax - b.damageInitial) * (ramp * ramp);

        const laserStart = b.position.clone().add(new THREE.Vector3(0, 2.2, 0));
        const laserEnd = target.position.clone().add(new THREE.Vector3(0, 0.8, 0));
        this.effects.updateLaserBeam(b.id, laserStart, laserEnd, ramp);

        b.attackCooldown -= deltaTime;
        if (b.attackCooldown <= 0) {
          sounds.playLaserBeam();
          this.damageEntity(target, currentDmg * b.hitSpeed, b.isBlue);
          b.attackCooldown = b.hitSpeed;
        }
      } else {
        b.lockedTarget = null;
        b.lockDuration = 0;
        this.effects.removeLaserBeam(b.id);
      }
    }
  }
}

updateTowers(deltaTime) {
  this.towers.forEach(tower => {
    if (tower.hp <= 0) return;

    if (!tower.active && tower.type === 'king') {
      const anyPrincessDead = this.towers.some(t => t.isBlue === tower.isBlue && t.type === 'princess' && t.hp <= 0);
      if (anyPrincessDead || tower.hp < tower.maxHp) {
        tower.active = true;
      }
    }

    if (!tower.active) return;
    if (tower.frozenTimer > 0) {
      tower.frozenTimer -= deltaTime;
      return;
    }

    tower.attackCooldown = Math.max(0, tower.attackCooldown - deltaTime);

    const target = this.findBestTargetForTower(tower);
    if (target) {
      if (tower.shooter) {
        tower.shooter.lookAt(target.position.x, tower.shooter.position.y, target.position.z);
      }

      if (tower.attackCooldown <= 0) {
        const start = tower.position.clone().add(new THREE.Vector3(0, tower.type === 'king' ? 5.2 : 4.0, 0));
        sounds.playArrowShoot();

        this.effects.spawnArrow(start, target.position, () => {
          sounds.playHit();
          this.damageEntity(target, tower.damage, tower.isBlue);
        });
        tower.attackCooldown = tower.hitSpeed;
      }
    }
  });
}

findBestTargetForTower(tower) {
  let closest = null;
  let minDist = tower.range;
  const towerTeam = tower.team || (tower.isBlue ? 'blue' : 'red');

  this.troops.forEach(troop => {
    const troopTeam = troop.team || (troop.isBlue ? 'blue' : 'red');
    if (troopTeam !== towerTeam && troop.hp > 0) {
      const d = tower.position.distanceTo(troop.position);
      if (d <= minDist) {
        minDist = d;
        closest = troop;
      }
    }
  });

  return closest;
}

damageEntity(entity, amount, isAttackerBlueOrTeam) {
  if (entity.hp <= 0) return;
  const attackerTeam = typeof isAttackerBlueOrTeam === 'string' ? isAttackerBlueOrTeam : (isAttackerBlueOrTeam ? 'blue' : 'red');
  const isAttackerBlue = attackerTeam === this.playerTeam;

  // 檢查塔樓聖盾無敵狀態
  if (entity.isTower) {
    if (entity.isBlue && this.towerShieldTimer.blue > 0) return;
    if (!entity.isBlue && this.towerShieldTimer.red > 0) return;

    // ⚡ 肉鴿聖物：攻城毀滅巨力 (+40% 攻塔傷害)
    if (isAttackerBlue && this.hasRelic('siege_mastery')) {
      amount = Math.round(amount * 1.40);
    }
  }

  // ⚡ 覺醒進化：不屈聖盾騎士 (正面承受傷害減半 50%)
  if (entity.cardId === 'knight_evo' || entity.cardId === 'knightevo') {
    amount = Math.round(amount * 0.50);
  }

  // ⚡ 覺醒進化：狂化連斬野蠻人 (血量低於 50% 觸發狂暴)
  if ((entity.cardId === 'barbarians_evo' || entity.cardId === 'barbariansevo') && entity.hp - amount < entity.maxHp * 0.5) {
    entity.ragedTimer = 99.0;
  }

  entity.hp -= amount;
  this.effects.spawnDamageText(entity.position, amount, amount > 250);

  if (entity.hp <= 0) {
    entity.hp = 0;
    if (entity.isTower) {
      this.destroyTower(entity, attackerTeam);
    }
  }
}

destroyTower(tower, isAttackerBlueOrTeam) {
  this.triggerVibrate([40, 30, 60]);
  const attackerTeam = typeof isAttackerBlueOrTeam === 'string' ? isAttackerBlueOrTeam : (isAttackerBlueOrTeam ? 'blue' : 'red');
  const towerTeam = tower.team || (tower.isBlue ? 'blue' : 'red');
  const isAttackerBlue = attackerTeam === this.playerTeam;
  sounds.playTowerDestroyed(isAttackerBlue);

  const teamColors = { blue: 0x2288ff, red: 0xff3355, green: 0x00e676, purple: 0xd500f9 };
  this.effects.createExplosion(tower.position, teamColors[attackerTeam] || 0xffd700, 36, 3.5);
  tower.mesh.position.y = -2;

  if (this.battleMode === 'brawl') {
    if (tower.type === 'king') {
      this.brawlEliminatedTeams.add(towerTeam);
      this.callbacks.onAnnouncement?.(`💥 ${this.getTeamDisplayName(towerTeam)} 國王塔被毀！已被淘汰！`);
      this.callbacks.onBrawlUpdate?.(this.getBrawlStatus());

      const allTeams = ['blue', 'red', 'green', 'purple'];
      const activeTeams = allTeams.filter(tm => !this.brawlEliminatedTeams.has(tm));
      if (activeTeams.length <= 1) {
        const winner = activeTeams[0] || 'blue';
        const isWinnerPlayer = winner === this.playerTeam;
        this.timeScale = 0.25;
        this.arena.startCinematicKillCam(tower.position);
        setTimeout(() => {
          this.timeScale = 1.0;
          this.endMatch(isWinnerPlayer ? 'win' : 'loss');
        }, 1600);
        return;
      }
    } else {
      this.callbacks.onBrawlUpdate?.(this.getBrawlStatus());
    }
    return;
  }

  if (isAttackerBlue) {
    this.playerCrowns = Math.min(3, this.playerCrowns + (tower.type === 'king' ? 3 : 1));
    this.callbacks.onCrownChange?.(this.playerCrowns, this.enemyCrowns);
  } else {
    this.enemyCrowns = Math.min(3, this.enemyCrowns + (tower.type === 'king' ? 3 : 1));
    this.callbacks.onCrownChange?.(this.playerCrowns, this.enemyCrowns);
  }

  if (tower.type === 'king' || this.playerCrowns >= 3 || this.enemyCrowns >= 3 || this.isSuddenDeath) {
    this.timeScale = 0.25;
    this.arena.startCinematicKillCam(tower.position);
    setTimeout(() => {
      this.timeScale = 1.0;
      this.endMatch(isAttackerBlue ? 'win' : 'loss');
    }, 1600);
  }
}

getTeamDisplayName(team) {
  const names = {
    blue: '🟦 藍方 (南方)',
    red: '🟥 紅方 (北方)',
    green: '🟩 綠方 (西方)',
    purple: '🟪 紫方 (東方)'
  };
  return names[team] || team;
}

getBrawlStatus() {
  const status = {};
  ['blue', 'red', 'green', 'purple'].forEach(tm => {
    const king = this.towers.find(t => (t.team || (t.isBlue ? 'blue' : 'red')) === tm && t.type === 'king');
    const kingAlive = king && king.hp > 0;
    status[tm] = {
      alive: !!kingAlive,
      hp: king ? Math.max(0, Math.round(king.hp)) : 0,
      maxHp: king ? king.maxHp : 4800,
      towers: kingAlive ? 1 : 0
    };
  });
  return status;
}

destroyTroop(index) {
  const troop = this.troops[index];
  this.effects.createExplosion(troop.position, 0x8899aa, 6, 0.8);
  this.effects.removeHpBar(troop.id);
  this.arena.scene.remove(troop.mesh);
  this.troops.splice(index, 1);
}

destroyBuilding(index) {
  const b = this.buildings[index];
  this.effects.createExplosion(b.position, 0x555555, 12, 1.5);
  this.effects.removeHpBar(b.id);
  this.effects.removeLaserBeam(b.id);
  this.arena.scene.remove(b.mesh);
  this.buildings.splice(index, 1);
}

syncHpBars() {
  this.troops.forEach(t => {
    this.effects.updateHpBar(t.id, t.position, t.hp, t.maxHp, t.isBlue, t.flying ? 2.6 : 1.6, t.frozenTimer > 0, t.ragedTimer > 0);
  });

  this.buildings.forEach(b => {
    this.effects.updateHpBar(b.id, b.position, b.hp, b.maxHp, b.isBlue, 2.5, b.frozenTimer > 0);
  });

  this.towers.forEach(tw => {
    if (tw.hp > 0 && (tw.hp < tw.maxHp || tw.active)) {
      this.effects.updateHpBar(tw.id, tw.position, tw.hp, tw.maxHp, tw.isBlue, tw.type === 'king' ? 5.8 : 4.4, tw.frozenTimer > 0);
    } else {
      this.effects.removeHpBar(tw.id);
    }
  });
}

animateTroopWalk(troop) {
  const p = troop.parts;
  const swing = Math.sin(troop.animTime);

  if (p.leftLeg && p.rightLeg) {
    p.leftLeg.rotation.x = swing * 0.6;
    p.rightLeg.rotation.x = -swing * 0.6;
  }

  if (p.leftArm && p.rightArm) {
    p.leftArm.rotation.x = -swing * 0.5;
    p.rightArm.rotation.x = swing * 0.5;
  }

  if (p.wings) {
    p.wings.rotation.z = Math.sin(troop.animTime * 1.5) * 0.3;
  }

  if (p.mount) {
    p.mount.position.y = 0.45 + Math.abs(Math.sin(troop.animTime * 1.5)) * 0.15;
  }
}

animateTroopAttack(troop) {
  const p = troop.parts;
  const progress = 1 - (troop.attackCooldown / troop.hitSpeed);
  const attackSwing = Math.sin(progress * Math.PI);

  if (p.rightArm) {
    p.rightArm.rotation.x = attackSwing * 1.3;
  }
}

resolveTieBreak() {
  let minPlayerHp = Infinity;
  let minEnemyHp = Infinity;

  this.towers.forEach(t => {
    if (t.hp > 0) {
      if (t.isBlue) minPlayerHp = Math.min(minPlayerHp, t.hp);
      else minEnemyHp = Math.min(minEnemyHp, t.hp);
    }
  });

  if (minPlayerHp > minEnemyHp) this.endMatch('win');
  else if (minEnemyHp > minPlayerHp) this.endMatch('loss');
  else this.endMatch('draw');
}

endMatch(result) {
  if (this.isOver) return;
  this.isOver = true;

  if (result === 'win') sounds.playVictory();
  else if (result === 'loss') sounds.playDefeat();

  // 儲存重播
  const replay = replayRecorder.stopRecording(result, {
    playerCrowns: this.playerCrowns,
    enemyCrowns: this.enemyCrowns
  }, 180 - this.matchTime);

  if (replay) {
    inventory.saveReplay(replay);
  }

  this.callbacks.onGameOver?.(result, {
    playerCrowns: this.playerCrowns,
    enemyCrowns: this.enemyCrowns
  });
}

// 權威強制終結對局 (用於 P2P 連線同步)
forceEndMatch(result, scores = null) {
  if (this.isOver) return;
  this.isOver = true;

  if (scores) {
    this.playerCrowns = scores.playerCrowns ?? this.playerCrowns;
    this.enemyCrowns = scores.enemyCrowns ?? this.enemyCrowns;
    this.callbacks.onCrownChange?.(this.playerCrowns, this.enemyCrowns);
  }

  if (result === 'win') sounds.playVictory();
  else if (result === 'loss') sounds.playDefeat();

  this.callbacks.onGameOver?.(result, {
    playerCrowns: this.playerCrowns,
    enemyCrowns: this.enemyCrowns
  });
}

// 導出當前防禦塔狀態
getTowersState() {
  return this.towers.map(t => ({
    id: t.id,
    hp: t.hp,
    maxHp: t.maxHp,
    isBlue: t.isBlue,
    type: t.type
  }));
}

// 導出當前士兵狀態
getTroopsState(invertCoords = false) {
  return this.troops.map(t => ({
    id: t.id,
    cardId: t.cardId,
    team: t.team,
    isBlue: invertCoords ? !t.isBlue : t.isBlue,
    x: Number((invertCoords ? -t.position.x : t.position.x).toFixed(2)),
    z: Number((invertCoords ? -t.position.z : t.position.z).toFixed(2)),
    hp: Math.round(t.hp),
    maxHp: Math.round(t.maxHp)
  }));
}

// 接收房主權威狀態並校正士兵 (消滅幽靈單位與位置漂移)
applyTroopsState(remoteTroops, isGuest1v1 = false) {
  if (!Array.isArray(remoteTroops)) return;

  const remoteIds = new Set();

  remoteTroops.forEach(remote => {
    remoteIds.add(remote.id);
    let local = this.troops.find(t => t.id === remote.id);

    if (!local) {
      local = this.troops.find(t =>
        t.cardId === remote.cardId &&
        (isGuest1v1 ? t.isBlue === remote.isBlue : t.team === remote.team) &&
        Math.hypot(t.position.x - remote.x, t.position.z - remote.z) < 4.0
      );
      if (local) local.id = remote.id;
    }

    if (local) {
      // 1. 權威血量同步 (防止傷害分歧)
      if (remote.hp < local.hp) {
        local.hp = remote.hp;
      }

      // 2. 平滑插值校正座標
      const dx = remote.x - local.position.x;
      const dz = remote.z - local.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 3.2) {
        local.position.x = remote.x;
        local.position.z = remote.z;
      } else if (dist > 0.25) {
        local.position.x += dx * 0.35;
        local.position.z += dz * 0.35;
      }

      if (local.mesh) {
        local.mesh.position.x = local.position.x;
        local.mesh.position.z = local.position.z;
      }
    }
  });

  // 3. 清理房主端已確認陣亡的幽靈部隊
  for (let i = this.troops.length - 1; i >= 0; i--) {
    const t = this.troops[i];
    if (t.spawnAge && t.spawnAge > 1.2 && !remoteIds.has(t.id)) {
      this.destroyTroop(i);
    }
  }
}

getBrawlRanking() {
  const teams = ['blue', 'red', 'green', 'purple'];
  return teams.map(tm => {
    const king = this.towers.find(t => (t.team || (t.isBlue ? 'blue' : 'red')) === tm && t.type === 'king');
    return {
      team: tm,
      hp: king ? Math.max(0, Math.round(king.hp)) : 0,
      alive: king && king.hp > 0 && !this.brawlEliminatedTeams.has(tm)
    };
  }).sort((a, b) => b.hp - a.hp);
}

// 套用權威防禦塔狀態並校正
applyTowersState(towersState, isGuest = false) {
  if (!Array.isArray(towersState)) return;

  towersState.forEach(item => {
    const targetId = isGuest ? BattleEngine.mapHostTowerIdToGuest(item.id) : item.id;
    const tower = this.towers.find(t => t.id === targetId);
    if (tower) {
      // 若權威端該塔已爆毀，本地尚未爆毀，立即觸發爆塔特效
      if (item.hp <= 0 && tower.hp > 0) {
        tower.hp = 0;
        this.destroyTower(tower, !tower.isBlue);
      } else {
        tower.hp = Math.max(0, item.hp);
      }
    }
  });
}

  static mapHostTowerIdToGuest(hostId) {
  const map = {
    'princess_bl': 'princess_er',
    'princess_br': 'princess_el',
    'king_b': 'king_e',
    'princess_el': 'princess_br',
    'princess_er': 'princess_bl',
    'king_e': 'king_b'
  };
  return map[hostId] || hostId;
}

startBattle() {
  this.isPaused = false;
  this.isOver = false;
  this.timeScale = 1.0;
  this.arena.resetCamera(true);
}

  static disposeObject(obj) {
  if (!obj) return;
  if (obj.geometry) {
    try { obj.geometry.dispose(); } catch (e) { }
  }
  if (obj.material) {
    try {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m && m.dispose());
      } else {
        obj.material.dispose();
      }
    } catch (e) { }
  }
  while (obj.children && obj.children.length > 0) {
    BattleEngine.disposeObject(obj.children[0]);
    obj.remove(obj.children[0]);
  }
}

reset() {
  this.isOver = false;
  this.isPaused = true;
  this.isSuddenDeath = false;
  this.isDoubleElixir = false;
  this.is7XElixir = false;
  this.timeScale = 1.0;
  this.matchTime = 180;
  this.playerElixir = 5.0;
  this.enemyElixir = 5.0;
  this.teamElixir = { blue: 5.0, red: 5.0, green: 5.0, purple: 5.0 };
  this.playerCrowns = 0;
  this.enemyCrowns = 0;
  this.brawlEliminatedTeams.clear();

  this.arena.resetCamera(true);

  Object.keys(this.kingPowerCooldowns).forEach(k => this.kingPowerCooldowns[k] = 0);
  this.towerShieldTimer = { blue: 0, red: 0 };

  this.troops.forEach(t => {
    this.arena.scene.remove(t.mesh);
    BattleEngine.disposeObject(t.mesh);
  });
  this.troops = [];

  this.buildings.forEach(b => {
    this.arena.scene.remove(b.mesh);
    BattleEngine.disposeObject(b.mesh);
  });
  this.buildings = [];

  this.towers.forEach(t => {
    this.arena.scene.remove(t.mesh);
    BattleEngine.disposeObject(t.mesh);
  });
  this.towers = [];

  this.initTowers();
  this.effects.clear();
}
}
