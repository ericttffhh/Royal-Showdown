import { CARDS } from './cards.js';

/**
 * 智慧電腦 AI 對手決策引擎 (支援所有 12 種卡牌與高級戰術)
 */

export class AIController {
  constructor(battle, difficulty = 'medium') {
    this.battle = battle;
    this.difficulty = difficulty;

    // AI 卡組庫 (包含所有強力卡牌)
    this.deckPool = ['giant', 'pekka', 'hogrider', 'musketeer', 'wizard', 'knight', 'archers', 'dragon', 'skeletons', 'goblins', 'fireball'];
    this.hand = [];
    this.deckQueue = [];

    this.decisionTimer = 0;
    this.initDeck();
  }

  setDeck(deck) {
    if (Array.isArray(deck) && deck.length > 0) {
      this.deckPool = [...deck];
      this.initDeck();
    }
  }

  initDeck() {
    const shuffled = [...this.deckPool].sort(() => Math.random() - 0.5);
    this.hand = shuffled.slice(0, 4);
    this.deckQueue = shuffled.slice(4);
  }

  update(deltaTime) {
    if (this.battle.isOver || this.battle.isPaused) return;

    this.decisionTimer -= deltaTime;
    if (this.decisionTimer <= 0) {
      this.makeDecision();
      this.resetDecisionTimer();
    }
  }

  resetDecisionTimer() {
    switch (this.difficulty) {
      case 'easy':
        this.decisionTimer = 2.0 + Math.random() * 1.5;
        break;
      case 'medium':
        this.decisionTimer = 1.0 + Math.random() * 0.8;
        break;
      case 'hard':
        this.decisionTimer = 0.5 + Math.random() * 0.4;
        break;
      default:
        this.decisionTimer = 1.2;
    }
  }

  makeDecision() {
    const elixir = this.battle.enemyElixir;
    const playerTroops = this.battle.troops.filter(t => t.isBlue && t.hp > 0);

    // 1. 防守判斷：敵方兵團逼近紅方半場 (z < 2.5)
    const dangerousThreats = playerTroops.filter(t => t.position.z < 2.5);

    if (dangerousThreats.length > 0) {
      dangerousThreats.sort((a, b) => a.position.z - b.position.z);
      const threat = dangerousThreats[0];
      if (this.tryDefend(threat, elixir)) return;
    }

    // 2. 範圍法術清剿多個目標
    if (this.trySpellAttack(playerTroops, elixir)) return;

    // 3. 主動推進 / 組合進攻
    const minElixirToAttack = this.battle.isDoubleElixir ? 6.0 : (this.difficulty === 'hard' ? 8.0 : 7.5);
    if (elixir >= minElixirToAttack) {
      this.launchAttackPush();
    }
  }

  tryDefend(threat, elixir) {
    // 巨人或皮卡超人 (高威脅單體) -> 用骷髏海、哥布林或地獄塔/皮卡進行阻擊
    if (threat.cardId === 'giant' || threat.cardId === 'pekka') {
      const counterCard = this.findCardInHand(['skeletons', 'goblins', 'pekka', 'knight', 'dragon']);
      if (counterCard && CARDS[counterCard].cost <= elixir) {
        const deployPos = {
          x: threat.position.x + (Math.random() - 0.5) * 0.4,
          z: Math.max(-13, threat.position.z - 1.2)
        };
        this.playCard(counterCard, deployPos);
        return true;
      }
    }

    // 骷髏大軍或哥布林軍團 -> 用法師、飛龍寶寶或火球清場
    if (threat.cardId === 'skeletons' || threat.cardId === 'goblins') {
      const counterCard = this.findCardInHand(['wizard', 'dragon', 'fireball', 'archers']);
      if (counterCard && CARDS[counterCard].cost <= elixir) {
        const deployPos = {
          x: threat.position.x,
          z: Math.max(-13, threat.position.z - 1.5)
        };
        this.playCard(counterCard, deployPos);
        return true;
      }
    }

    // 遠程射手 (火槍手、魔法師、弓箭手) -> 派遣騎士或皮卡直接近身切後排
    if (threat.cardId === 'musketeer' || threat.cardId === 'wizard' || threat.cardId === 'archers') {
      const counterCard = this.findCardInHand(['knight', 'goblins', 'pekka']);
      if (counterCard && CARDS[counterCard].cost <= elixir) {
        const deployPos = {
          x: threat.position.x,
          z: Math.max(-13, threat.position.z - 0.3)
        };
        this.playCard(counterCard, deployPos);
        return true;
      }
    }

    // 野豬騎士快速突襲 -> 骷髏大軍或騎士阻擋
    if (threat.cardId === 'hogrider') {
      const counterCard = this.findCardInHand(['skeletons', 'goblins', 'knight', 'pekka']);
      if (counterCard && CARDS[counterCard].cost <= elixir) {
        this.playCard(counterCard, { x: threat.position.x, z: threat.position.z - 1.0 });
        return true;
      }
    }

    // 通用防守：出動手牌中費用最低的兵種
    const playable = this.hand.filter(c => CARDS[c].cost <= elixir && CARDS[c].type !== 'spell');
    if (playable.length > 0) {
      const card = playable[0];
      const deployPos = {
        x: threat.position.x,
        z: Math.max(-12, threat.position.z - 1.5)
      };
      this.playCard(card, deployPos);
      return true;
    }

    return false;
  }

  trySpellAttack(playerTroops, elixir) {
    if (elixir < 4) return false;
    const fireball = this.findCardInHand(['fireball', 'arrows']);
    if (!fireball) return false;

    for (let i = 0; i < playerTroops.length; i++) {
      const t1 = playerTroops[i];
      let clusterCount = 1;

      for (let j = i + 1; j < playerTroops.length; j++) {
        const t2 = playerTroops[j];
        if (t1.position.distanceTo(t2.position) <= 2.8) {
          clusterCount++;
        }
      }

      if (clusterCount >= 2 || t1.cardId === 'wizard' || t1.cardId === 'musketeer') {
        this.playCard(fireball, { x: t1.position.x, z: t1.position.z });
        return true;
      }
    }

    return false;
  }

  launchAttackPush() {
    const pLeftTower = this.battle.towers.find(t => t.id === 'princess_bl');
    const pRightTower = this.battle.towers.find(t => t.id === 'princess_br');

    let targetLaneX = -4.5;
    if (pLeftTower && pRightTower) {
      targetLaneX = (pRightTower.hp < pLeftTower.hp && pRightTower.hp > 0) ? 4.5 : -4.5;
    }

    // 1. 野豬騎士奇襲
    if (this.hand.includes('hogrider') && this.battle.enemyElixir >= 4) {
      this.playCard('hogrider', { x: targetLaneX, z: -4 });
      return;
    }

    // 2. 巨人沉底起手
    if (this.hand.includes('giant') && this.battle.enemyElixir >= 5) {
      const deployZ = this.difficulty === 'hard' ? -11 : -7;
      this.playCard('giant', { x: targetLaneX, z: deployZ });
      return;
    }

    // 3. 皮卡超人推進
    if (this.hand.includes('pekka') && this.battle.enemyElixir >= 7) {
      this.playCard('pekka', { x: targetLaneX, z: -8 });
      return;
    }

    // 4. 其他核心兵種推進
    const primaryTroop = this.findCardInHand(['dragon', 'wizard', 'musketeer', 'knight', 'archers']);
    if (primaryTroop && CARDS[primaryTroop].cost <= this.battle.enemyElixir) {
      this.playCard(primaryTroop, { x: targetLaneX, z: -5 });
    }
  }

  findCardInHand(preferredList) {
    for (const id of preferredList) {
      if (this.hand.includes(id)) return id;
    }
    return null;
  }

  playCard(cardId, pos) {
    const success = this.battle.deployCard(cardId, pos, false);
    if (success) {
      const idx = this.hand.indexOf(cardId);
      if (idx !== -1) {
        const nextCard = this.deckQueue.shift();
        this.hand[idx] = nextCard;
        this.deckQueue.push(cardId);
      }
    }
  }
}
