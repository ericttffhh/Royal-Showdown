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
import { auth } from './game/auth.js';

class ClashRoyaleApp {
  constructor() {
    this.mode = 'ai'; // 'ai' | '7x' | 'draft' | 'pve' | 'matchmaking' | 'online' | 'local'
    this.isOnlineGuest = false;
    this.handledDeployIds = new Set();
    this.deploySeq = 0;

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
      onBrawlUpdate: (status) => this.menuUI?.updateBrawlHud(status),
      onChampionStatus: (status) => this.menuUI?.updateChampionHUD(status),
      onBrawlBotDeploy: (cardId, pos, team) => {
        // 🌐 房主產出電腦 AI 出兵時，即時廣播給所有房間好友，杜絕資料不一致
        if (this.mode === 'brawl' && this.network.isHost && this.network.getConnectedCount() > 0) {
          const deployId = `bot_${team}_${Date.now()}_${++this.deploySeq}`;
          this.handledDeployIds.add(deployId);
          this.network.send({
            type: 'brawl_deploy',
            deployId,
            cardId,
            x: pos.x,
            z: pos.z,
            team,
            senderId: 'host_bot'
          });
        }
      },
      onGameOver: (result, scores) => {
        sounds.stopBGM();
        this.inBattle = false;
        this.pveManager.stopPvE();

        // 🧗 肉鴿地牢結算
        if (this.mode === 'dungeon') {
          if (result === 'win') {
            this.menuUI?.onDungeonFloorVictory();
          } else {
            this.menuUI?.showAnnouncement('💀 地牢試煉失敗！請強化卡牌或調整戰術重試！');
            this.menuUI?.showGameOver(result, scores);
          }
          return;
        }

        // 🌐 若為線上對決房主，權威廣播遊戲終結與比分至客端
        if (this.mode === 'online' && this.network.isHost) {
          this.network.send({
            type: 'game_over',
            winner: result === 'win' ? 'host' : (result === 'loss' ? 'guest' : 'draw'),
            hostCrowns: scores.playerCrowns,
            guestCrowns: scores.enemyCrowns
          });
        } else if (this.mode === 'brawl' && this.network.isHost && this.network.getConnectedCount() > 0) {
          this.network.send({
            type: 'brawl_game_over',
            result,
            scores,
            ranking: this.battle.getBrawlRanking()
          });
        }

        // 📊 記錄對局統計與場次歷史
        inventory.recordMatch(
          this.mode || 'ai',
          result,
          scores?.playerCrowns || 0,
          scores?.enemyCrowns || 0,
          180 - (this.battle.matchTime || 0),
          this.currentOpponentName || '皇家對手'
        );

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

    // 4. 初始化 WebRTC P2P 網路 (支援 1v1 與四人大亂鬥多人房間)
    this.brawlRoom = {
      isHost: false,
      code: '',
      mySide: 'blue',
      seats: {
        blue: { name: inventory.data.username || '皇家領主', isHuman: true, isMe: true },
        red: { name: '狂暴烈焰 AI', isHuman: false, isMe: false },
        green: { name: '翡翠森林 AI', isHuman: false, isMe: false },
        purple: { name: '虛空暗影 AI', isHuman: false, isMe: false }
      }
    };

    this.network = new NetworkEngine({
      onConnected: (isHost) => this.handleNetworkConnected(isHost),
      onData: (data, senderId) => this.handleNetworkData(data, senderId),
      onError: (msg) => this.handleNetworkError(msg),
      onDisconnected: () => this.handleNetworkDisconnected(),
      onPeerJoined: (peerId, count) => this.handlePeerJoined(peerId, count),
      onPeerLeft: (peerId, count) => this.handlePeerLeft(peerId, count)
    });

    // 5. 初始化出戰手牌 HUD
    this.deckBarUI = new DeckBarUI(
      this.arena,
      (cardId, pos, isSpell) => {
        return this.handlePlayerCardDeploy(cardId, pos, isSpell);
      },
      (x, z, isSpell) => {
        let deploySide = this.battle.playerTeam || 'blue';
        if (this.mode === 'local') {
          deploySide = (z > 0 || isSpell) ? 'blue' : 'red';
        }
        return this.battle.canDeployAt(x, z, deploySide, isSpell);
      }
    );

    // 6. 初始化繁體主選單、抽卡寶箱與牌組系統
    this.menuUI = new MenuUI({
      onStartAI: (difficulty) => this.startAIMode(difficulty),
      onStartBoss: () => this.startBossMode(),
      onStart7X: () => this.start7XMode(),
      onStartDraft: (playerDeck, aiDeck) => this.startDraftMode(playerDeck, aiDeck),
      onStartPvE: () => this.startPvEMode(),
      onStartBrawl: (options) => this.startBrawlMode(options),
      onStart2v2: () => this.start2v2Mode(),
      onStartDungeon: (floorData, relics) => this.startDungeonMode(floorData, relics),
      onStartMatchmaking: () => this.matchmaker.startSearching(),
      onCancelMatchmaking: () => this.matchmaker.cancelSearching(),
      onOpenOnlineModal: () => this.initOnlineHost(),
      onJoinRoom: (code) => this.joinOnlineRoom(code),
      onCancelOnline: () => this.network.disconnect(),
      onCreateBrawlRoom: (onCode) => this.initBrawlHost(onCode),
      onJoinBrawlRoom: (code) => this.joinBrawlRoom(code),
      onStartLocal: () => this.startLocalMode(),
      onSendEmote: (emote) => this.handleSendEmote(emote),
      onRematch: () => this.restartMatch(),
      onReturnToMenu: () => this.returnToMenu(),
      onDeckChanged: () => this.deckBarUI.reset(),
      onTriggerKingPower: (powerId) => this.battle.triggerKingPower(powerId),
      onTriggerChampionAbility: () => this.battle.activateChampionAbility(),
      onThemeChanged: (themeId) => this.arena.setArenaTheme(themeId),
      onToggleCamera: () => this.arena.cycleCameraMode(),
      arena: this.arena
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
    document.getElementById('player-name').textContent = `${inventory.data.username || '皇家領主'} (你)`;
    this.battle.setBattleMode('classic');
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
    document.getElementById('player-name').textContent = `${inventory.data.username || '皇家領主'} (你)`;
    this.battle.setBattleMode('classic');
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
    document.getElementById('player-name').textContent = `${inventory.data.username || '皇家領主'} (你)`;
    this.battle.setBattleMode('classic');
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
    document.getElementById('player-name').textContent = `${inventory.data.username || '皇家領主'} (你)`;
    this.battle.setBattleMode('classic');
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
    document.getElementById('player-name').textContent = `${inventory.data.username || '皇家領主'} (你)`;
    this.battle.setBattleMode('classic');
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
    document.getElementById('player-name').textContent = `${inventory.data.username || '皇家領主'} (你)`;
    this.battle.setBattleMode('classic');
    this.resetMatch();
    this.pveManager.startPvE();
    this.battle.startBattle();
    sounds.startBattleBGM();
    this.menuUI.showAnnouncement('🛡️ 守護國王塔！怪物大軍即將入侵！');
  }

  startDungeonMode(floorData, relics = []) {
    this.mode = 'dungeon';
    this.inBattle = true;
    this.pveManager.stopPvE();

    this.aiController.difficulty = floorData.floor >= 7 ? 'hard' : (floorData.floor >= 4 ? 'medium' : 'easy');
    if (floorData.enemyDeck) {
      this.aiController.setDeck(floorData.enemyDeck);
    }

    this.menuUI.enterBattleView();
    document.getElementById('battle-mode-badge').textContent = `🧗 地牢第 ${floorData.floor} 層 (${floorData.name})`;
    document.getElementById('enemy-name').textContent = floorData.bossName || `第 ${floorData.floor} 層守衛`;
    document.getElementById('player-name').textContent = `${inventory.data.username || '皇家領主'} (你)`;

    // 依據地下城層數動態更換戰鬥競技場主題
    const theme = floorData.floor >= 8 ? 'inferno_abyss' : (floorData.floor >= 4 ? 'frozen_peak' : 'royal_valley');
    this.arena.setArenaTheme(theme);

    this.battle.setBattleMode('classic', {
      dungeonFloor: floorData,
      dungeonRelics: relics,
      playerTowerSkin: inventory.data?.selectedTowerSkin || 'classic'
    });

    this.resetMatch();
    this.battle.startBattle();
    sounds.startBattleBGM(floorData.floor >= 8);
    this.menuUI.showAnnouncement(`🧗 進入肉鴿地下城第 ${floorData.floor} 層：${floorData.name}！`);
  }

  startBrawlMode(options = {}) {
    this.mode = 'brawl';
    this.inBattle = true;
    this.pveManager.stopPvE();

    const mySide = options.side || 'blue';
    const sideNames = {
      blue: '🟦 藍方 (南方)',
      red: '🟥 紅方 (北方)',
      green: '🟩 綠方 (西方)',
      purple: '🟪 紫方 (東方)'
    };

    document.getElementById('battle-mode-badge').textContent = '💥 四人混戰大亂鬥';
    document.getElementById('enemy-name').textContent = '3方混戰群雄';
    document.getElementById('player-name').textContent = `${inventory.data.username || '皇家領主'} (${sideNames[mySide]})`;

    const humanTeams = [];
    if (this.brawlRoom && this.brawlRoom.seats) {
      Object.keys(this.brawlRoom.seats).forEach(s => {
        if (this.brawlRoom.seats[s].isHuman) humanTeams.push(s);
      });
    }
    const isMultiGuest = !this.network.isHost && this.network.getConnectedCount() > 0;
    this.battle.isMultiplayerGuest = isMultiGuest;

    this.menuUI.enterBattleView('brawl');
    this.battle.setBattleMode('brawl', {
      playerTeam: mySide,
      humanTeams,
      hazards: options.hazards !== false
    });

    if (this.network.isHost && this.network.getConnectedCount() > 0) {
      this.network.send({
        type: 'brawl_start',
        hazards: options.hazards !== false
      });
    }

    this.resetMatch();
    this.battle.startBattle();
    sounds.startBattleBGM(true);
    this.menuUI.showAnnouncement(`💥 四人大亂鬥開啟！你鎮守【${sideNames[mySide]}】！`);
    this.menuUI.updateBrawlHud(this.battle.getBrawlStatus());
  }

  start2v2Mode() {
    this.mode = 'coop';
    this.inBattle = true;
    this.pveManager.stopPvE();
    this.aiController.difficulty = 'hard';

    this.menuUI.enterBattleView('coop');
    document.getElementById('battle-mode-badge').textContent = '🛡️ 雙人合作防守 (2v2)';
    document.getElementById('enemy-name').textContent = '雙路進攻敵軍';
    document.getElementById('player-name').textContent = `${inventory.data.username || '皇家領主'} + AI 盟友`;

    this.battle.setBattleMode('coop', {
      playerTeam: 'blue',
      hazards: true
    });
    this.resetMatch();
    this.battle.startBattle();
    sounds.startBattleBGM();
    this.menuUI.showAnnouncement('🛡️ 2v2 雙人合作防守！皇家守護盟友與你並肩作戰！');
  }

  startLocalMode() {
    this.mode = 'local';
    this.inBattle = true;
    document.getElementById('battle-mode-badge').textContent = '本地 1v1 演練 (雙方皆可下牌)';
    document.getElementById('enemy-name').textContent = '紅方選手 (本地)';
    document.getElementById('player-name').textContent = '藍方選手 (本地)';
    this.battle.setBattleMode('classic');
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
    this.battle.isMultiplayerGuest = !isHost;

    document.getElementById('room-modal').classList.add('hidden');
    this.menuUI.enterBattleView();
    document.getElementById('battle-mode-badge').textContent = '雙人線上即時對決';
    document.getElementById('enemy-name').textContent = isHost ? '線上挑戰者 (P2)' : '房主領主 (P1)';

    this.resetMatch();
    this.battle.startBattle();
    sounds.startBattleBGM();
  }

  initBrawlHost(onCodeReady) {
    this.brawlRoom.isHost = true;
    this.brawlRoom.mySide = 'blue';
    this.brawlRoom.seats = {
      blue: { name: inventory.data.username || '皇家領主', isHuman: true, isMe: true },
      red: { name: '狂暴烈焰 AI', isHuman: false, isMe: false },
      green: { name: '翡翠森林 AI', isHuman: false, isMe: false },
      purple: { name: '虛空暗影 AI', isHuman: false, isMe: false }
    };
    this.network.createRoom((code) => {
      this.brawlRoom.code = code;
      onCodeReady?.(code);
    }, 'brawl');
  }

  joinBrawlRoom(code) {
    this.brawlRoom.isHost = false;
    this.brawlRoom.code = code.trim().toUpperCase();
    this.network.joinRoom(code, 'brawl');
  }

  handlePeerJoined(peerId, count) {
    if (this.brawlRoom.isHost) {
      // 房主給新加入的真人好友分配席位
      const available = ['red', 'green', 'purple', 'blue'].filter(s => !this.brawlRoom.seats[s].isHuman);
      const assign = available[0];
      if (assign) {
        this.brawlRoom.seats[assign] = {
          name: `真人好友 #${peerId.slice(-4)}`,
          peerId,
          isHuman: true,
          isMe: false
        };
        this.menuUI.updateBrawlSeatsState(this.brawlRoom.seats);
        this.network.send({
          type: 'brawl_room_sync',
          seats: this.brawlRoom.seats
        });
        this.menuUI.showAnnouncement('🎉 有真人好友加入大亂鬥房間！已成功入座！');
        sounds.playFanfare();
      }
    }
  }

  handlePeerLeft(peerId, count) {
    if (this.brawlRoom.isHost) {
      Object.keys(this.brawlRoom.seats).forEach(side => {
        if (this.brawlRoom.seats[side].peerId === peerId) {
          const botDefaults = {
            red: '狂暴烈焰 AI',
            green: '翡翠森林 AI',
            purple: '虛空暗影 AI',
            blue: '海潮領主 AI'
          };
          this.brawlRoom.seats[side] = {
            name: botDefaults[side],
            isHuman: false,
            isMe: false
          };
        }
      });
      this.menuUI.updateBrawlSeatsState(this.brawlRoom.seats);
      this.network.send({
        type: 'brawl_room_sync',
        seats: this.brawlRoom.seats
      });
      this.menuUI.showAnnouncement('⚠️ 有好友離開了房間，該席位已由 AI 替補');
    }
  }

  handleNetworkData(data, senderId) {
    if (!data) return;

    if (data.type === 'brawl_room_sync') {
      const myId = this.network.peer?.id;
      const mySeats = JSON.parse(JSON.stringify(data.seats));
      Object.keys(mySeats).forEach(s => {
        if (mySeats[s].peerId === myId) {
          mySeats[s].isMe = true;
          this.brawlRoom.mySide = s;
        }
      });
      this.brawlRoom.seats = mySeats;
      this.menuUI.updateBrawlSeatsState(mySeats);
      const statusText = document.getElementById('brawl-online-status-text');
      if (statusText) statusText.textContent = `✅ 連線成功！你已被分配在【${this.brawlRoom.mySide.toUpperCase()}】席位，等待房主開戰...`;
      this.menuUI.showAnnouncement('✅ 已成功進入好友的大亂鬥房間！');
      sounds.playVictory();
    } else if (data.type === 'brawl_start') {
      document.getElementById('brawl-room-modal')?.classList.add('hidden');
      this.startBrawlMode({
        side: this.brawlRoom.mySide,
        hazards: data.hazards
      });
    } else if (data.type === 'brawl_deploy') {
      // 1. 忽略自己已部署的封包
      if (data.senderId && data.senderId === this.network.peer?.id) return;
      // 2. 避免重複出兵
      if (data.deployId && this.handledDeployIds.has(data.deployId)) return;
      if (data.deployId) this.handledDeployIds.add(data.deployId);

      this.battle.deployCard(data.cardId, { x: data.x, z: data.z }, data.team, true);

      if (this.network.isHost) {
        // 房主轉發給其他客端
        this.network.send(data);
      }
    } else if (data.type === 'deploy') {
      if (data.deployId && this.handledDeployIds.has(data.deployId)) return;
      if (data.deployId) this.handledDeployIds.add(data.deployId);

      const invX = -data.x;
      const invZ = -data.z;
      this.battle.deployCard(data.cardId, { x: invX, z: invZ }, false, true);
    } else if (data.type === 'sync_state') {
      // 🌐 1v1 線上對戰客端接收房主權威狀態校正訊框 (10Hz Master Authority Sync)
      if (!this.network.isHost && this.inBattle) {
        this.battle.applyTowersState(data.towers, true);
        this.battle.playerCrowns = data.guestCrowns;
        this.battle.enemyCrowns = data.hostCrowns;
        this.updateCrownsUI(this.battle.playerCrowns, this.battle.enemyCrowns);
        this.battle.matchTime = data.time;
        if (Array.isArray(data.troops)) {
          this.battle.applyTroopsState(data.troops, true);
        }
      }
    } else if (data.type === 'brawl_sync_state') {
      // 🌐 四人混戰客端接收房主權威狀態校正訊框 (10Hz Master Authority Sync)
      if (!this.network.isHost && this.inBattle) {
        this.battle.matchTime = data.time;
        if (Array.isArray(data.towers)) {
          this.battle.applyTowersState(data.towers, false);
        }
        if (Array.isArray(data.eliminatedTeams)) {
          this.battle.brawlEliminatedTeams = new Set(data.eliminatedTeams);
        }
        if (Array.isArray(data.troops)) {
          this.battle.applyTroopsState(data.troops, false);
        }
        this.menuUI.updateBrawlHud(this.battle.getBrawlStatus());
      }
    } else if (data.type === 'brawl_game_over') {
      if (!this.network.isHost && this.inBattle) {
        sounds.stopBGM();
        this.inBattle = false;
        this.battle.forceEndMatch(data.result, data.scores);
      }
    } else if (data.type === 'game_over') {
      // 🌐 客端接收權威對局終結通知 (同秒同分結束遊戲)
      if (!this.network.isHost && this.inBattle) {
        const guestResult = data.winner === 'guest' ? 'win' : (data.winner === 'host' ? 'loss' : 'draw');
        const scores = {
          playerCrowns: data.guestCrowns,
          enemyCrowns: data.hostCrowns
        };
        sounds.stopBGM();
        this.inBattle = false;
        this.battle.forceEndMatch(guestResult, scores);
      }
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
    const brawlStatus = document.getElementById('brawl-online-status-text');
    if (brawlStatus) brawlStatus.textContent = `❌ ${msg}`;
  }

  handleNetworkDisconnected() {
    this.menuUI.showAnnouncement('⚠️ 對手已斷開連線');
  }

  handleSendEmote(emote) {
    if (this.mode === 'online' || (this.mode === 'brawl' && this.network.getConnectedCount() > 0)) {
      this.network.send({ type: 'emote', emote });
    }
  }

  // -------------------------------------------------------------
  // 卡牌部署處理 (支援本地 1v1 雙向部署與大亂鬥多方)
  // -------------------------------------------------------------

  handlePlayerCardDeploy(cardId, pos, isSpell) {
    let deploySide = this.battle.playerTeam || 'blue';
    if (this.mode === 'local') {
      deploySide = (pos.z > 0 || isSpell) ? 'blue' : 'red';
    }

    const finalPos = this.battle.getLegalDeployPosition(pos, deploySide, isSpell);
    const success = this.battle.deployCard(cardId, finalPos, deploySide, false);
    if (success) {
      const deployId = `${this.network.peer?.id || 'local'}_${Date.now()}_${++this.deploySeq}`;
      this.handledDeployIds.add(deployId);

      if (this.mode === 'online') {
        this.network.send({
          type: 'deploy',
          deployId,
          cardId,
          x: finalPos.x,
          z: finalPos.z,
          senderId: this.network.peer?.id
        });
      } else if (this.mode === 'brawl' && this.network.getConnectedCount() > 0) {
        this.network.send({
          type: 'brawl_deploy',
          deployId,
          cardId,
          x: finalPos.x,
          z: finalPos.z,
          team: deploySide,
          senderId: this.network.peer?.id
        });
      }
    }

    return success;
  }

  // -------------------------------------------------------------
  // 重置與同步
  // -------------------------------------------------------------

  resetMatch() {
    this.arena.resetCamera(true);
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
    this.arena.resetCamera(true);
    this.arena.setBrawlLayout(false);
    this.battle.setBattleMode('classic');
    this.battle.reset();
    this.network.disconnect();
    this.menuUI.exitBattleView();
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
    const brawlTimerEl = document.getElementById('brawl-battle-timer');
    if (timerEl) timerEl.textContent = timeStr;
    if (brawlTimerEl) brawlTimerEl.textContent = timeStr;

    if (rawTime <= 30) {
      timerEl?.classList.add('hurry');
      brawlTimerEl?.classList.add('hurry');
    } else {
      timerEl?.classList.remove('hurry');
      brawlTimerEl?.classList.remove('hurry');
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

      if (this.mode === 'brawl') {
        this.menuUI.updateBrawlHud(this.battle.getBrawlStatus());
      }

      // 🌐 線上對戰房主每 100ms 廣播高頻狀態同步校正封包 (10Hz Master Authority Sync)
      if (this.network.isHost) {
        this.lastHostSync = this.lastHostSync || 0;
        if (currentTime - this.lastHostSync > 100) {
          this.lastHostSync = currentTime;

          if (this.mode === 'online') {
            this.network.send({
              type: 'sync_state',
              time: this.battle.matchTime,
              towers: this.battle.getTowersState(),
              hostCrowns: this.battle.playerCrowns,
              guestCrowns: this.battle.enemyCrowns,
              isOver: this.battle.isOver,
              isSuddenDeath: this.battle.isSuddenDeath,
              troops: this.battle.getTroopsState(true)
            });
          } else if (this.mode === 'brawl' && this.network.getConnectedCount() > 0) {
            this.network.send({
              type: 'brawl_sync_state',
              time: this.battle.matchTime,
              towers: this.battle.getTowersState(),
              eliminatedTeams: Array.from(this.battle.brawlEliminatedTeams),
              troops: this.battle.getTroopsState(false)
            });
          }
        }
      }
    }

    this.arena.render(deltaTime);
  }

  joinBrawlFromUrl(roomCode) {
    document.getElementById('nav-btn-battle')?.click();
    this.menuOverlay?.classList.add('hidden');
    document.getElementById('brawl-room-modal')?.classList.remove('hidden');
    const input = document.getElementById('input-brawl-join-code');
    if (input) input.value = roomCode;
    const statusText = document.getElementById('brawl-online-status-text');
    if (statusText) statusText.textContent = `⏳ 正在透過邀請連結連線至好友房間【${roomCode.toUpperCase()}】...`;
    this.joinBrawlRoom(roomCode);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // 📱 檢查 URL 一鍵存檔同步參數 (?sync=...)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const syncPayload = urlParams.get('sync');
    if (syncPayload) {
      const importRes = inventory.importSyncCode(syncPayload);
      if (importRes?.success) {
        console.log('🎉 透過同步連結自動載入存檔成功！等級：', importRes.mergedLevel);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  } catch (e) {}

  const app = new ClashRoyaleApp();

  // 👥 檢查大亂鬥好友邀請參數 (?brawl=CODE) 與 8 帳號測試設定 (?user=xxx&side=xxx)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const brawlCode = urlParams.get('brawl');
    const userParam = urlParams.get('user');
    const sideParam = urlParams.get('side');

    if (userParam && !localStorage.getItem('royal_acc_named')) {
      const names = {
        'test_blue': '領主1號·藍龍',
        'test_red': '領主2號·烈焰',
        'test_green': '領主3號·翡翠',
        'test_purple': '領主4號·虛空',
        'test_ladder': '領主5號·天梯神',
        'test_coop': '領主6號·守護者',
        'test_boss': '領主7號·泰坦獵人',
        'test_7x': '領主8號·聖水狂人'
      };
      if (auth.currentUser) {
        auth.currentUser.username = names[userParam] || userParam;
        auth.saveAccounts();
        localStorage.setItem('royal_acc_named', 'true');
        app.menu?.updateProfileBar?.();
      }
    }

    if (sideParam && app.menu) {
      app.menu.selectedBrawlSide = sideParam;
      app.menu.updateBrawlSeatsUI?.();
    }

    if (brawlCode) {
      setTimeout(() => {
        app.joinBrawlFromUrl(brawlCode);
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 600);
    }
  } catch (e) {}
});
