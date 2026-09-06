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
    this.callbacks = callbacks; // { onCrownChange, onElixirChange, onTimeChange, onGameOver, onAnnouncement }

    this.isPaused = true; // 預設處於暫停狀態，進入戰場後才正式啟動模擬計時
    this.isOver = false;
    this.isSuddenDeath = false;
    this.matchTime = 180;
    this.isDoubleElixir = false;
    this.is7XElixir = false;
    this.timeScale = 1.0;

    this.playerElixir = 5.0;
    this.enemyElixir = 5.0;

    this.playerCrowns = 0;
    this.enemyCrowns = 0;

    this.towers = [];
    this.troops = [];
    this.buildings = [];

    // 國王技能冷卻
    this.kingPowerCooldowns = { shield: 0, blizzard: 0, meteor: 0 };
    this.towerShieldTimer = { blue: 0, red: 0 };

    this.bridges = [
      { x: -4.5, z: 0, width: 2.2 },
      { x: 4.5, z: 0, width: 2.2 }
    ];

    this.initTowers();
  }

  initTowers() {
    const pLeft = this.createTower('princess_bl', true, -4.5, 9.5, TOWER_STATS.princess, 'princess');
    const pRight = this.createTower('princess_br', true, 4.5, 9.5, TOWER_STATS.princess, 'princess');
    const pKing = this.createTower('king_b', true, 0, 13.0, TOWER_STATS.king, 'king');

    const eLeft = this.createTower('princess_el', false, -4.5, -9.5, TOWER_STATS.princess, 'princess');
    const eRight = this.createTower('princess_er', false, 4.5, -9.5, TOWER_STATS.princess, 'princess');
    const eKing = this.createTower('king_e', false, 0, -13.0, TOWER_STATS.king, 'king');

    this.towers = [pLeft, pRight, pKing, eLeft, eRight, eKing];
  }

  createTower(id, isBlue, x, z, stats, type) {
    const mesh = type === 'king'
      ? ModelFactory.createKingTower(isBlue)
      : ModelFactory.createPrincessTower(isBlue);

    mesh.position.set(x, 0, z);
    this.arena.scene.add(mesh);

    return {
      id,
      isBlue,
      type,
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

  canDeployAt(x, z, isBlue, isSpell = false) {
    if (isSpell) return true;

    if (isBlue) {
      if (z >= 0.5 && z <= 15.5) return true;
      const enemyLeftAlive = this.towers.find(t => t.id === 'princess_el')?.hp > 0;
      const enemyRightAlive = this.towers.find(t => t.id === 'princess_er')?.hp > 0;

      if (!enemyLeftAlive && x < 0 && z >= -4.5) return true;
      if (!enemyRightAlive && x > 0 && z >= -4.5) return true;
    } else {
      if (z <= -0.5 && z >= -15.5) return true;
      const playerLeftAlive = this.towers.find(t => t.id === 'princess_bl')?.hp > 0;
      const playerRightAlive = this.towers.find(t => t.id === 'princess_br')?.hp > 0;

      if (!playerLeftAlive && x < 0 && z <= 4.5) return true;
      if (!playerRightAlive && x > 0 && z <= 4.5) return true;
    }

    return false;
  }

  deployCard(cardId, targetPos, isBlue) {
    const cardLevel = isBlue ? (inventory.data.cards[cardId]?.level || 1) : 3;
    const card = getCardScaledStats(cardId, cardLevel) || CARDS[cardId];
    if (!card) return false;

    const currentElixir = isBlue ? this.playerElixir : this.enemyElixir;
    if (currentElixir < card.cost) return false;

    if (isBlue) {
      this.playerElixir -= card.cost;
      this.callbacks.onElixirChange?.(this.playerElixir);
      inventory.progressQuest('deploy_troops', 1);
    } else {
      this.enemyElixir -= card.cost;
    }

    sounds.playDeploy();

    // 記錄重播事件
    replayRecorder.recordEvent(180 - this.matchTime, 'deploy', { cardId, pos: targetPos, isBlue });

    if (card.type === 'spell') {
      this.castSpell(card, targetPos, isBlue);
      return true;
    }

    if (card.type === 'building') {
      this.spawnBuilding(card, targetPos, isBlue);
      return true;
    }

    this.spawnTroops(card, targetPos, isBlue);
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

  applyAreaDamage(center, radius, damage, crownTowerDmg, isAttackerBlue, knockback = false) {
    const targets = [...this.troops, ...this.buildings, ...this.towers];
    targets.forEach(t => {
      if (t.isBlue !== isAttackerBlue && t.hp > 0) {
        const dist = center.distanceTo(t.position);
        if (dist <= radius) {
          const dmg = t.isTower ? crownTowerDmg : damage;
          this.damageEntity(t, dmg, isAttackerBlue);

          if (knockback && !t.isTower && !t.flying && t.cardId !== 'giant' && t.cardId !== 'pekka') {
            const dir = new THREE.Vector3().subVectors(t.position, center).normalize();
            t.position.addScaledVector(dir, 0.8);
            t.mesh.position.copy(t.position);
          }
        }
      }
    });
  }

  spawnBuilding(card, pos, isBlue) {
    const id = `building_${nextEntityId++}`;
    const { root, parts } = ModelFactory.createTroopMesh(card.id, isBlue);
    root.position.set(pos.x, 0, pos.z);
    this.arena.scene.add(root);
    this.effects.createSpawnSmoke(pos, isBlue ? 0x2288ff : 0xff3355);

    this.buildings.push({
      id,
      cardId: card.id,
      isBlue,
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

  spawnTroops(card, targetPos, isBlue) {
    const count = card.count || 1;
    const offsets = this.calculateSpawnOffsets(count);

    offsets.forEach((offset) => {
      const id = `troop_${nextEntityId++}`;
      const spawnX = targetPos.x + offset.x;
      const spawnZ = targetPos.z + offset.z;
      const pos = new THREE.Vector3(spawnX, card.flying ? 1.5 : 0, spawnZ);

      const { root, parts } = ModelFactory.createTroopMesh(card.id, isBlue);
      root.position.copy(pos);
      root.rotation.y = isBlue ? Math.PI : 0;
      this.arena.scene.add(root);

      this.effects.createSpawnSmoke(pos, isBlue ? 0x2288ff : 0xff3355);

      this.troops.push({
        id,
        cardId: card.id,
        isBlue,
        hp: card.hp,
        maxHp: card.hp,
        damage: card.damage,
        hitSpeed: card.hitSpeed,
        speed: card.speed,
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
        animTime: Math.random() * 5
      });
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

    this.updateMatchTime(deltaTime);
    this.updateElixir(deltaTime);
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
      regenRate = 2.5; // 7X Infinite Elixir!
    }

    this.playerElixir = Math.min(10, this.playerElixir + regenRate * deltaTime);
    this.enemyElixir = Math.min(10, this.enemyElixir + regenRate * deltaTime);
    this.callbacks.onElixirChange?.(this.playerElixir);
  }

  updateTroops(deltaTime) {
    for (let i = this.troops.length - 1; i >= 0; i--) {
      const troop = this.troops[i];
      if (troop.hp <= 0) {
        this.destroyTroop(i);
        continue;
      }

      // 冰凍狀態
      if (troop.frozenTimer > 0) {
        troop.frozenTimer -= deltaTime;
        continue;
      }

      // 狂暴加速狀態
      const isRaged = troop.ragedTimer > 0;
      if (isRaged) troop.ragedTimer -= deltaTime;
      const speedMultiplier = isRaged ? 1.35 : 1.0;

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

    if (troop.targets === 'buildings') {
      const validTargets = [...this.towers, ...this.buildings].filter(t => t.isBlue !== troop.isBlue && t.hp > 0);
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
      ...this.troops.filter(t => t.isBlue !== troop.isBlue && t.hp > 0 && (!t.flying || troop.targets === 'all')),
      ...this.buildings.filter(b => b.isBlue !== troop.isBlue && b.hp > 0),
      ...this.towers.filter(tw => tw.isBlue !== troop.isBlue && tw.hp > 0)
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
    const onPlayerSide = troop.position.z > 0;
    const targetOnOtherSide = (troop.isBlue && targetPos.z < 0) || (!troop.isBlue && targetPos.z > 0);

    let waypoint = targetPos;
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
    const dir = new THREE.Vector3(0, 0, troop.isBlue ? -1 : 1);
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

    this.troops.forEach(troop => {
      if (troop.isBlue !== tower.isBlue && troop.hp > 0) {
        const d = tower.position.distanceTo(troop.position);
        if (d <= minDist) {
          minDist = d;
          closest = troop;
        }
      }
    });

    return closest;
  }

  damageEntity(entity, amount, isAttackerBlue) {
    if (entity.hp <= 0) return;

    // 檢查塔樓聖盾無敵狀態
    if (entity.isTower) {
      if (entity.isBlue && this.towerShieldTimer.blue > 0) return;
      if (!entity.isBlue && this.towerShieldTimer.red > 0) return;
    }

    entity.hp -= amount;
    this.effects.spawnDamageText(entity.position, amount, amount > 250);

    if (entity.hp <= 0) {
      entity.hp = 0;
      if (entity.isTower) {
        this.destroyTower(entity, isAttackerBlue);
      }
    }
  }

  destroyTower(tower, isAttackerBlue) {
    sounds.playTowerDestroyed(isAttackerBlue);
    this.effects.createExplosion(tower.position, isAttackerBlue ? 0x2288ff : 0xff2a55, 36, 3.5);
    tower.mesh.position.y = -2;

    if (isAttackerBlue) {
      this.playerCrowns = Math.min(3, this.playerCrowns + (tower.type === 'king' ? 3 : 1));
      this.callbacks.onCrownChange?.(this.playerCrowns, this.enemyCrowns);
    } else {
      this.enemyCrowns = Math.min(3, this.enemyCrowns + (tower.type === 'king' ? 3 : 1));
      this.callbacks.onCrownChange?.(this.playerCrowns, this.enemyCrowns);
    }

    if (tower.type === 'king' || this.playerCrowns >= 3 || this.enemyCrowns >= 3 || this.isSuddenDeath) {
      // 觸發慢動作終結鏡頭
      this.timeScale = 0.25;
      this.arena.startCinematicKillCam(tower.position);

      setTimeout(() => {
        this.timeScale = 1.0;
        this.endMatch(isAttackerBlue ? 'win' : 'loss');
      }, 1600);
    }
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
    this.playerCrowns = 0;
    this.enemyCrowns = 0;

    Object.keys(this.kingPowerCooldowns).forEach(k => this.kingPowerCooldowns[k] = 0);
    this.towerShieldTimer = { blue: 0, red: 0 };

    this.troops.forEach(t => this.arena.scene.remove(t.mesh));
    this.troops = [];
    this.buildings.forEach(b => this.arena.scene.remove(b.mesh));
    this.buildings = [];

    this.towers.forEach(t => this.arena.scene.remove(t.mesh));
    this.towers = [];
    this.initTowers();

    this.effects.clear();
  }
}
