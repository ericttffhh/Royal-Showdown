import * as THREE from 'three';
import { Arena3D } from './three/arena.js';
import { EffectsEngine } from './three/effects.js';
import { BattleEngine } from './game/battle.js';
import { AIController } from './game/ai.js';
import { PvEManager } from './game/pve.js';
import { MatchmakingEngine } from './game/matchmaking.js';
import { NetworkEngine } from './game/network.js';
import { DeckBarUI } from './ui/deckBar.js';
import { MenuUI } from './ui/menu.js';
import { sounds } from './audio/sound.js';
import { inventory } from './game/inventory.js';

class ClashRoyaleApp {
  constructor() {
    this.mode = 'ai'; // 'ai' | '7x' | 'draft' | 'pve' | 'matchmaking' | 'online' | 'local'
    this.isOnlineGuest = false;

    // 1. 初始化 3D 競技場與特效
    const canvasContainer = document.getElementById('canvas-container');
    this.arena = new Arena3D(canvasContainer);
    this.effects = new EffectsEngine(this.arena.scene, this.arena.camera);

    // 2. 初始化戰鬥核心引擎
    this.battle = new BattleEngine(this.arena, this.effects, {
      onCrownChange: (pCrowns, eCrowns) => this.updateCrownsUI(pCrowns, eCrowns),
      onElixirChange: (elixir) => this.deckBarUI?.updateElixir(elixir),
      onTimeChange: (timeStr, rawTime) => this.updateTimerUI(timeStr, rawTime),
      onAnnouncement: (msg) => this.menuUI?.showAnnouncement(msg),
      onGameOver: (result, scores) => {
        sounds.stopBGM();
        this.inBattle = false;
        this.pveManager.stopPvE();
        this.menuUI?.showGameOver(result, scores);
      }
    });

    // 3. 初始化 AI 機器人、PvE 怪獸引擎與實時天梯匹配引擎
    this.aiController = new AIController(this.battle, 'medium');
    this.pveManager = new PvEManager(this.battle, {
      onWaveStart: (wave, maxWaves) => {
        this.menuUI?.showAnnouncement(`⚔️ 第 ${wave} / ${maxWaves} 波怪獸大軍來襲！`);
        document.getElementById('battle-mode-badge').textContent = `無盡防守 (第 ${wave}/${maxWaves} 波)`;
      },
      onWaveCleared: (wave) => {
        sounds.playVictory();
        inventory.addGold(40);
        this.menuUI?.showAnnouncement(`✨ 第 ${wave} 波已被成功防守清剿！`);
      },
      onPvEComplete: () => {
        inventory.addGold(500);
        inventory.addGems(30);
        inventory.addTrophies(100);
        this.menuUI?.showAnnouncement('👑 恭喜！你成功抵禦了無盡怪獸泰坦軍團！');
      }
    });

    this.matchmaker = new MatchmakingEngine({
      onSearchingTick: (seconds) => {
        this.menuUI?.updateMatchmakingTimer(seconds);
      },
      onOpponentFound: (opponent) => {
        this.menuUI?.showOpponentMatched(opponent);
      },
      onMatchStart: (opponent) => {
        this.startRankedMatch(opponent);
      },
      onMatchCancelled: () => {
        // 取消匹配回調
      }
    });

    // 4. 初始化 WebRTC P2P 網路
    this.network = new NetworkEngine({
      onConnected: (isHost) => this.handleNetworkConnected(isHost),
      onData: (data) => this.handleNetworkData(data),
      onError: (msg) => this.handleNetworkError(msg),
      onDisconnected: () => this.handleNetworkDisconnected()
    });

    // 5. 初始化出戰手牌 HUD
    this.deckBarUI = new DeckBarUI(this.arena, (cardId, pos, isSpell) => {
      return this.handlePlayerCardDeploy(cardId, pos, isSpell);
    });

    // 6. 初始化繁體主選單、抽卡寶箱與牌組系統
    this.menuUI = new MenuUI({
      onStartAI: (difficulty) => this.startAIMode(difficulty),
      onStartBoss: () => this.startBossMode(),
      onStart7X: () => this.start7XMode(),
      onStartDraft: (playerDeck, aiDeck) => this.startDraftMode(playerDeck, aiDeck),
      onStartPvE: () => this.startPvEMode(),
      onStartMatchmaking: () => this.matchmaker.startSearching(),
      onCancelMatchmaking: () => this.matchmaker.cancelSearching(),
      onOpenOnlineModal: () => this.initOnlineHost(),
      onJoinRoom: (code) => this.joinOnlineRoom(code),
      onCancelOnline: () => this.network.disconnect(),
      onStartLocal: () => this.startLocalMode(),
      onSendEmote: (emote) => this.handleSendEmote(emote),
      onRematch: () => this.restartMatch(),
      onReturnToMenu: () => this.returnToMenu(),
      onDeckChanged: () => this.deckBarUI.reset(),
      onTriggerKingPower: (powerId) => this.battle.triggerKingPower(powerId),
      onToggleCamera: () => this.arena.cycleCameraMode()
    });

    // 啟動主選單大廳 BGM (在使用者首次點擊時自動解鎖 AudioContext)
    const unlockAudio = () => {
      sounds.ensureContext();
      if (!this.inBattle) {
        sounds.startLobbyBGM();
      }
      document.removeEventListener('pointerdown', unlockAudio);
    };
    document.addEventListener('pointerdown', unlockAudio);

    this.inBattle = false;

    // 啟動主渲染與模擬循環
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  // -------------------------------------------------------------
  // 模式管理
  // -------------------------------------------------------------

  startAIMode(difficulty) {
    this.mode = 'ai';
    this.inBattle = true;
    this.pveManager.stopPvE();
    this.aiController.difficulty = difficulty;
    document.getElementById('battle-mode-badge').textContent = `人機 (${difficulty === 'hard' ? '傳奇大師' : (difficulty === 'medium' ? '皇家騎士' : '新手法師')})`;
    document.getElementById('enemy-name').textContent = '電腦對手 (AI)';
    this.resetMatch();
    this.battle.startBattle();
    sounds.startBattleBGM();
  }

  startBossMode() {
    this.mode = 'boss';
    this.inBattle = true;
    this.pveManager.stopPvE();
    this.aiController.difficulty = 'hard';
    this.aiController.setDeck(['mecha_golem', 'cyber_ninja', 'thunder_valkyrie', 'phoenix_mage', 'fireball', 'wizard', 'giant', 'inferno']);
    document.getElementById('battle-mode-badge').textContent = '🦾 泰坦首領討伐 (Boss Rush)';
    document.getElementById('enemy-name').textContent = '【狂暴滅世】泰坦機甲魔像 🦾';
    this.resetMatch();
    this.battle.startBattle();
    sounds.startBattleBGM(true);
    this.arena.triggerScreenShake(0.8, 0.6);
    sounds.playMechaImpact();
    this.menuUI.showAnnouncement('⚠️ 警告！滅世級泰坦機甲首領現身戰場！全力阻截！');

    // 延遲 3 秒在敵方召喚巨大 Boss
    setTimeout(() => {
      if (this.inBattle && this.mode === 'boss') {
        const bossStats = { ...CARDS.mecha_golem, hp: 5500, damage: 450, radius: 1.2, speed: 0.9 };
        this.battle.spawnTroops(bossStats, { x: 0, z: -10 }, false);
        this.arena.triggerScreenShake(1.0, 0.5);
        sounds.playMechaImpact();
      }
    }, 2500);
  }

  startRankedMatch(opponent) {
    this.mode = 'matchmaking';
    this.inBattle = true;
    this.pveManager.stopPvE();
    this.aiController.difficulty = 'hard';
    if (opponent.deck) {
      this.aiController.setDeck(opponent.deck);
    }
    this.menuUI.enterBattleView();
    document.getElementById('battle-mode-badge').textContent = '⚡ 天梯實時排位賽';
    document.getElementById('enemy-name').textContent = opponent.name;
    document.getElementById('enemy-tag').textContent = opponent.tag;
    this.resetMatch();
    this.battle.startBattle();
    sounds.startBattleBGM();
    this.menuUI.showAnnouncement(`⚔️ 天梯對決開始！對手：${opponent.name}`);
  }

  start7XMode() {
    this.mode = '7x';
    this.inBattle = true;
    this.pveManager.stopPvE();
    this.aiController.difficulty = 'hard';
    document.getElementById('battle-mode-badge').textContent = '⚡ 7X 無限聖水狂歡';
    document.getElementById('enemy-name').textContent = '瘋狂聖水 AI';
    this.resetMatch();
    this.battle.is7XElixir = true;
    this.battle.startBattle();
    sounds.startBattleBGM(true);
    this.menuUI.showAnnouncement('⚡ 7X 無限聖水爆發！瘋狂下兵吧！');
  }

  startDraftMode(playerDeck, aiDeck) {
    this.mode = 'draft';
    this.inBattle = true;
    this.pveManager.stopPvE();
    this.aiController.difficulty = 'medium';
    this.aiController.setDeck(aiDeck);
    this.deckBarUI.setCustomDeck(playerDeck);
    document.getElementById('battle-mode-badge').textContent = '🎲 輪選選卡大挑戰';
    document.getElementById('enemy-name').textContent = '輪選 AI 挑戰者';
    this.battle.reset();
    this.updateCrownsUI(0, 0);
    this.battle.startBattle();
    sounds.startBattleBGM();
    this.menuUI.showAnnouncement('🎲 雙方卡牌已分配完畢，戰鬥開始！');
  }

  startPvEMode() {
    this.mode = 'pve';
    this.inBattle = true;
    document.getElementById('battle-mode-badge').textContent = '🛡️ PVE 無盡怪獸防守 (共20波)';
    document.getElementById('enemy-name').textContent = '無盡怪獸首領軍團';
    this.resetMatch();
    this.pveManager.startPvE();
    this.battle.startBattle();
    sounds.startBattleBGM();
    this.menuUI.showAnnouncement('🛡️ 守護國王塔！怪物大軍即將入侵！');
  }

  startLocalMode() {
    this.mode = 'local';
    this.inBattle = true;
    document.getElementById('battle-mode-badge').textContent = '本地 1v1 演練 (雙方皆可下牌)';
    document.getElementById('enemy-name').textContent = '紅方選手 (本地)';
    this.resetMatch();
    this.battle.startBattle();
    sounds.startBattleBGM();
  }

  initOnlineHost() {
    document.getElementById('my-room-code').textContent = '生成中...';
    document.getElementById('waiting-status-text').textContent = '正在等待對手加入...';

    this.network.createRoom((code) => {
      document.getElementById('my-room-code').textContent = code;
    });
  }

  joinOnlineRoom(code) {
    this.network.joinRoom(code);
  }

  handleNetworkConnected(isHost) {
    this.mode = 'online';
    this.inBattle = true;
    this.isOnlineGuest = !isHost;

    document.getElementById('room-modal').classList.add('hidden');
    this.menuUI.enterBattleView();
    document.getElementById('battle-mode-badge').textContent = '雙人線上即時對決';
    document.getElementById('enemy-name').textContent = isHost ? '線上挑戰者 (P2)' : '房主領主 (P1)';

    this.resetMatch();
    this.battle.startBattle();
    sounds.startBattleBGM();
  }

  handleNetworkData(data) {
    if (!data) return;

    if (data.type === 'deploy') {
      const invX = -data.x;
      const invZ = -data.z;
      this.battle.deployCard(data.cardId, { x: invX, z: invZ }, false);
    } else if (data.type === 'emote') {
      this.menuUI.showEmote(data.emote, false);
    } else if (data.type === 'rematch') {
      this.resetMatch();
      this.battle.startBattle();
      sounds.startBattleBGM();
    }
  }

  handleNetworkError(msg) {
    const el = document.getElementById('join-status-message');
    if (el) el.textContent = msg;
  }

  handleNetworkDisconnected() {
    this.menuUI.showAnnouncement('⚠️ 對手已斷開連線');
  }

  handleSendEmote(emote) {
    if (this.mode === 'online') {
      this.network.send({ type: 'emote', emote });
    }
  }

  // -------------------------------------------------------------
  // 卡牌部署處理 (支援本地 1v1 雙向部署)
  // -------------------------------------------------------------

  handlePlayerCardDeploy(cardId, pos, isSpell) {
    // 本地 1v1 模式下，若點擊在紅方半場 (z < 0)，則視為紅方出兵！
    const isBlue = this.mode === 'local' ? (pos.z > 0 || isSpell) : true;

    const canDeploy = this.battle.canDeployAt(pos.x, pos.z, isBlue, isSpell);
    if (!canDeploy) return false;

    const success = this.battle.deployCard(cardId, pos, isBlue);
    if (success && this.mode === 'online') {
      this.network.send({
        type: 'deploy',
        cardId,
        x: pos.x,
        z: pos.z
      });
    }

    return success;
  }

  // -------------------------------------------------------------
  // 重置與同步
  // -------------------------------------------------------------

  resetMatch() {
    this.battle.reset();
    this.deckBarUI.reset();
    this.aiController.initDeck();
    this.updateCrownsUI(0, 0);
  }

  restartMatch() {
    this.resetMatch();
    this.battle.startBattle();
    sounds.startBattleBGM();
    if (this.mode === 'online') {
      this.network.send({ type: 'rematch' });
    }
  }

  returnToMenu() {
    this.inBattle = false;
    this.pveManager.stopPvE();
    this.matchmaker.cancelSearching();
    this.battle.reset();
    this.network.disconnect();
    sounds.startLobbyBGM();
  }

  updateCrownsUI(pCrowns, eCrowns) {
    const pEl = document.getElementById('player-crowns');
    const eEl = document.getElementById('enemy-crowns');
    if (pEl) pEl.textContent = pCrowns;
    if (eEl) eEl.textContent = eCrowns;
  }

  updateTimerUI(timeStr, rawTime) {
    const timerEl = document.getElementById('battle-timer');
    if (!timerEl) return;
    timerEl.textContent = timeStr;

    if (rawTime <= 30) {
      timerEl.classList.add('hurry');
    } else {
      timerEl.classList.remove('hurry');
    }
  }

  // -------------------------------------------------------------
  // 主動畫循環
  // -------------------------------------------------------------

  loop(currentTime) {
    requestAnimationFrame(this.loop);

    const deltaTime = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    // 只有在戰鬥中才更新戰鬥模擬與AI/PvE，徹底避免後台偷跑導致意外失敗
    if (this.inBattle) {
      if (this.mode === 'ai' || this.mode === '7x' || this.mode === 'draft' || this.mode === 'matchmaking') {
        this.aiController.update(deltaTime);
      } else if (this.mode === 'pve') {
        this.pveManager.update(deltaTime);
      }

      this.battle.update(deltaTime);
    }

    this.arena.render(deltaTime);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new ClashRoyaleApp();
});
