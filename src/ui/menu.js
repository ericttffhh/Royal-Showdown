import confetti from 'canvas-confetti';
import { CARDS, CHESTS, TROPHY_ROAD, ROYALE_PASS_TIERS, SEVEN_DAY_REWARDS, ACHIEVEMENTS, MAX_PLAYER_LEVEL, getPlayerExpRequired, getPlayerLevelTitle, getPlayerLevelReward } from '../game/cards.js';
import { inventory } from '../game/inventory.js';
import { auth, AVATAR_OPTIONS } from '../game/auth.js';
import { sounds } from '../audio/sound.js';
import { GachaManager } from './gacha.js';
import { DeckBuilderUI } from './deckBuilder.js';

/**
 * 繁體中文全功能主選單、用戶帳號與 Google 登入、1-100級升等系統、模式切換、天梯之路、每日任務與重播管理器
 */

export class MenuUI {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    // callbacks: { onStartAI, onStartBoss, onStart7X, onStartDraft, onStartPvE, onStartOnline, onStartLocal, onSendEmote, onRematch, onReturnToMenu, onTriggerKingPower, onToggleCamera }

    this.selectedDifficulty = 'medium';
    this.gachaManager = null;
    this.deckBuilder = null;
    this.selectedSignupAvatar = '👑';

    // Draft Picking State
    this.draftRound = 1;
    this.draftPlayerDeck = [];
    this.draftAiDeck = [];
    this.draftPool = [];

    this.initElements();
    this.initManagers();
    this.setupListeners();
    this.renderAvatarPicker();
    this.populateCardsWiki();
    this.updateCurrencyUI();
  }

  initElements() {
    this.menuOverlay = document.getElementById('menu-overlay');
    this.hudOverlay = document.getElementById('hud-overlay');
    this.deckModal = document.getElementById('deck-modal');
    this.shopModal = document.getElementById('shop-modal');
    this.aiModal = document.getElementById('ai-modal');
    this.roomModal = document.getElementById('room-modal');
    this.cardsWikiModal = document.getElementById('cards-wiki-modal');
    this.resultModal = document.getElementById('result-modal');
    this.trophyModal = document.getElementById('trophy-modal');
    this.questsModal = document.getElementById('quests-modal');
    this.replaysModal = document.getElementById('replays-modal');
    this.draftModal = document.getElementById('draft-modal');

    // Retention & Settings Modals
    this.passModal = document.getElementById('pass-modal');
    this.sevenDayModal = document.getElementById('seven-day-modal');
    this.achievementsModal = document.getElementById('achievements-modal');
    this.settingsModal = document.getElementById('settings-modal');

    // 🌟 1-100 級升等系統 Modals
    this.playerLevelModal = document.getElementById('player-level-modal');
    this.levelUpModal = document.getElementById('level-up-modal');

    // Auth & Profile Modals
    this.authModal = document.getElementById('auth-modal');
    this.profileModal = document.getElementById('profile-modal');

    this.announcementBanner = document.getElementById('announcement-banner');
    this.announcementText = document.getElementById('announcement-text');
    this.currencyBar = document.getElementById('global-currency-bar');
    this.mainNav = document.getElementById('main-nav-bar');

    this.emotePopover = document.getElementById('emote-popover');
    this.playerEmoteBubble = document.getElementById('player-emote-bubble');
    this.enemyEmoteBubble = document.getElementById('enemy-emote-bubble');

    // Matchmaking Modal Elements
    this.matchmakingModal = document.getElementById('matchmaking-modal');
    this.mmStatusTitle = document.getElementById('mm-status-title');
    this.mmStatusSub = document.getElementById('mm-status-sub');
    this.mmTimerText = document.getElementById('mm-timer-text');
    this.mmOpponentReveal = document.getElementById('mm-opponent-reveal');
    this.mmOpponentName = document.getElementById('mm-opponent-name');
    this.mmOpponentTag = document.getElementById('mm-opponent-tag');
  }

  initManagers() {
    this.gachaManager = new GachaManager(document.getElementById('canvas-container'), () => {
      this.updateCurrencyUI();
      this.deckBuilder?.renderAll();
    });

    this.deckBuilder = new DeckBuilderUI(() => {
      this.updateCurrencyUI();
      this.callbacks.onDeckChanged?.();
    });

    // 實時雲端同步推播即時刷新 UI
    inventory.onSync(() => {
      this.updateCurrencyUI();
      this.deckBuilder?.renderAll();
    });
  }

  updateCurrencyUI() {
    const d = inventory.data;
    const user = auth.currentUser || { username: '皇家領主', avatar: '👑', authType: 'guest' };

    // Update Header User Profile Bar
    const topAvatarEl = document.getElementById('user-top-avatar');
    const topNameEl = document.getElementById('user-top-name');
    const topTagEl = document.getElementById('user-top-tag');

    if (topAvatarEl) {
      if (user.avatarUrl) {
        topAvatarEl.innerHTML = `<img src="${user.avatarUrl}" class="user-avatar-img" alt="avatar" referrerpolicy="no-referrer" crossorigin="anonymous" />`;
      } else {
        topAvatarEl.textContent = user.avatar || '👑';
      }
    }
    if (topNameEl) topNameEl.textContent = user.username || '皇家領主';
    if (topTagEl) {
      if (user.authType === 'google') {
        topTagEl.textContent = 'Google';
        topTagEl.className = 'user-header-tag google';
      } else if (user.authType === 'local') {
        topTagEl.textContent = '正式帳號';
        topTagEl.className = 'user-header-tag local';
      } else {
        topTagEl.textContent = '訪客';
        topTagEl.className = 'user-header-tag guest';
      }
    }

    // 🌟 Update Player 1-100 Level Bar
    const curLevel = d.playerLevel || 1;
    const curExp = d.playerExp || 0;
    const expNeeded = getPlayerExpRequired(curLevel);
    const expPct = Math.min(100, Math.round((curExp / expNeeded) * 100));

    const topLvlBadge = document.getElementById('top-level-badge');
    const topLvlBar = document.getElementById('top-level-bar');
    const topLvlExp = document.getElementById('top-level-exp');

    if (topLvlBadge) topLvlBadge.textContent = `Lv.${curLevel}`;
    if (topLvlBar) topLvlBar.style.width = `${expPct}%`;
    if (topLvlExp) topLvlExp.textContent = curLevel >= MAX_PLAYER_LEVEL ? 'MAX' : `${curExp}/${expNeeded} EXP`;

    const gEl = document.getElementById('top-gold-val');
    const mEl = document.getElementById('top-gems-val');
    const cEl = document.getElementById('top-crowns-val');
    const tEl = document.getElementById('top-trophy-val');

    if (gEl) gEl.textContent = d.gold;
    if (mEl) mEl.textContent = d.gems;
    if (cEl) cEl.textContent = d.crowns;
    if (tEl) tEl.textContent = d.trophies;

    // Quests alert dot
    const hasUnclaimed = d.quests.some(q => q.completed && !q.claimed);
    const dot = document.getElementById('quest-alert-dot');
    if (dot) dot.style.display = hasUnclaimed ? 'block' : 'none';
  }

  renderAvatarPicker() {
    const grid = document.getElementById('avatar-picker-grid');
    if (!grid) return;
    grid.innerHTML = '';

    AVATAR_OPTIONS.forEach(opt => {
      const item = document.createElement('div');
      item.className = `avatar-picker-item ${this.selectedSignupAvatar === opt.icon ? 'active' : ''}`;
      item.innerHTML = `<span>${opt.icon}</span>`;
      item.title = opt.name;

      item.addEventListener('click', () => {
        this.selectedSignupAvatar = opt.icon;
        document.querySelectorAll('.avatar-picker-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });

      grid.appendChild(item);
    });
  }

  setupListeners() {
    // User Profile Top Bar Button
    document.getElementById('btn-open-profile')?.addEventListener('click', () => {
      this.openProfileModal();
    });

    document.getElementById('btn-close-profile-modal')?.addEventListener('click', () => {
      this.profileModal.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');
    });

    // Auth Modal Switch & Actions
    document.getElementById('btn-open-switch-account')?.addEventListener('click', () => {
      this.profileModal.classList.add('hidden');
      this.openAuthModal('login');
    });

    document.getElementById('btn-close-auth')?.addEventListener('click', () => {
      this.authModal.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');
    });

    const tabLogin = document.getElementById('tab-auth-login');
    const tabSignup = document.getElementById('tab-auth-signup');
    const panelLogin = document.getElementById('panel-auth-login');
    const panelSignup = document.getElementById('panel-auth-signup');

    tabLogin?.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabSignup.classList.remove('active');
      panelLogin.classList.remove('hidden');
      panelSignup.classList.add('hidden');
    });

    tabSignup?.addEventListener('click', () => {
      tabSignup.classList.add('active');
      tabLogin.classList.remove('active');
      panelSignup.classList.remove('hidden');
      panelLogin.classList.add('hidden');
    });

    // Google Sign-in Buttons
    document.getElementById('btn-google-signin')?.addEventListener('click', () => {
      this.handleGoogleAuth(false);
    });

    document.getElementById('btn-profile-link-google')?.addEventListener('click', () => {
      this.handleGoogleAuth(true);
    });

    // Google Client ID Config Toggle
    document.getElementById('btn-toggle-google-cfg')?.addEventListener('click', () => {
      const box = document.getElementById('google-cfg-box');
      const input = document.getElementById('input-google-client-id');
      if (box) {
        box.classList.toggle('hidden');
        if (!box.classList.contains('hidden') && input) {
          input.value = auth.getGoogleClientId();
        }
      }
    });

    document.getElementById('btn-save-google-client-id')?.addEventListener('click', () => {
      const input = document.getElementById('input-google-client-id');
      if (input && input.value.trim()) {
        auth.setGoogleClientId(input.value.trim());
        this.showAnnouncement('✅ Google OAuth Client ID 已更新！');
        document.getElementById('google-cfg-box')?.classList.add('hidden');
      }
    });

    // Login Submit
    document.getElementById('btn-submit-login')?.addEventListener('click', async () => {
      const usernameInput = document.getElementById('login-username-input').value;
      const passwordInput = document.getElementById('login-password-input').value;
      const errEl = document.getElementById('login-error-msg');
      const prevUserId = auth.currentUser ? auth.currentUser.id : null;

      errEl.textContent = '⏳ 正在驗證與同步雲端存檔...';
      const res = await auth.signIn(usernameInput, passwordInput);
      if (res.success) {
        errEl.textContent = '';
        sounds.playVictory();
        this.authModal.classList.add('hidden');
        this.menuOverlay.classList.remove('hidden');
        this.refreshUserData(prevUserId);
        this.showAnnouncement(`👑 歡迎領主：${res.user.username} (雲端存檔已同步)！`);
      } else {
        errEl.textContent = res.error;
      }
    });

    // Sign Up Submit
    document.getElementById('btn-submit-signup')?.addEventListener('click', () => {
      const usernameInput = document.getElementById('signup-username-input').value;
      const passwordInput = document.getElementById('signup-password-input').value;
      const errEl = document.getElementById('signup-error-msg');
      const prevUserId = auth.currentUser ? auth.currentUser.id : null;

      const res = auth.signUp(usernameInput, passwordInput, this.selectedSignupAvatar);
      if (res.success) {
        errEl.textContent = '';
        sounds.playVictory();
        this.authModal.classList.add('hidden');
        this.menuOverlay.classList.remove('hidden');
        this.refreshUserData(prevUserId);
        this.showAnnouncement(`🎉 恭喜建立專屬帳號：${res.user.username}！`);
      } else {
        errEl.textContent = res.error;
      }
    });

    // Logout
    document.getElementById('btn-logout-current')?.addEventListener('click', () => {
      auth.signOut();
      this.profileModal.classList.add('hidden');
      this.refreshUserData();
      this.openAuthModal('login');
      this.showAnnouncement('已切換為訪客狀態');
    });

    // Edit Username
    document.getElementById('btn-edit-username')?.addEventListener('click', () => {
      const newName = prompt('請輸入新的領主暱稱：', auth.currentUser.username);
      if (newName && newName.trim()) {
        auth.updateProfile(newName.trim(), auth.currentUser.avatar);
        this.refreshUserData();
        this.openProfileModal();
        this.showAnnouncement('領主暱稱已更新！');
      }
    });

    // ☁️ Cloud Sync & Quick Level 7 Handlers
    const uploadBtn = document.getElementById('btn-cloud-upload');
    uploadBtn?.addEventListener('click', async () => {
      uploadBtn.disabled = true;
      uploadBtn.textContent = '⏳ 上傳中...';
      try {
        const code = await inventory.uploadToCloudVault();
        const resBox = document.getElementById('cloud-sync-result-box');
        const codeText = document.getElementById('cloud-sync-code-text');
        if (resBox && codeText) {
          codeText.textContent = code;
          resBox.classList.remove('hidden');
        }
        this.showAnnouncement(`☁️ 上傳成功！同步碼：${code} (在手機輸入即可同步)`);
      } catch (e) {
        this.showAnnouncement('❌ 上傳失敗，請重試');
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = '📤 上傳當前存檔';
      }
    });

    const downloadBtn = document.getElementById('btn-cloud-download');
    downloadBtn?.addEventListener('click', async () => {
      const code = prompt('請輸入電腦端產生的雲端同步碼 (例如 ROYAL-8821 或 6位代碼)：');
      if (!code || !code.trim()) return;
      downloadBtn.disabled = true;
      downloadBtn.textContent = '⏳ 載入中...';
      try {
        const success = await inventory.downloadFromCloudVault(code.trim());
        if (success) {
          this.refreshUserData();
          this.openProfileModal();
          sounds.playVictory();
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          this.showAnnouncement('🎉 雲端存檔同步成功！已恢復最高等級進度！');
        } else {
          this.showAnnouncement('❌ 找不到該同步碼或同步碼已過期，請確認代碼無誤');
        }
      } catch (e) {
        this.showAnnouncement('❌ 載入失敗，請檢查網路連線');
      } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = '📥 輸入同步碼載入';
      }
    });

    document.getElementById('btn-quick-sync-lvl7')?.addEventListener('click', () => {
      inventory.quickSetLevel(7);
      this.refreshUserData();
      this.openProfileModal();
      sounds.playVictory();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      this.showAnnouncement('⚡ 已成功將進度設定為 7 級領主！所有卡牌與資源已同步！');
    });

    document.getElementById('btn-copy-cloud-code')?.addEventListener('click', () => {
      const code = document.getElementById('cloud-sync-code-text')?.textContent;
      if (code) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(() => {
            this.showAnnouncement('📋 同步碼已複製到剪貼簿！');
          }).catch(() => {
            prompt('請手動複製同步碼：', code);
          });
        } else {
          prompt('請手動複製同步碼：', code);
        }
      }
    });

    // Top Trophy Road Opener
    document.getElementById('btn-open-trophy-road')?.addEventListener('click', () => {
      this.openTrophyRoad();
    });

    document.getElementById('btn-close-trophy')?.addEventListener('click', () => {
      this.trophyModal.classList.add('hidden');
    });

    // Daily Quests Opener
    document.getElementById('btn-open-quests')?.addEventListener('click', () => {
      this.openQuestsModal();
    });

    document.getElementById('btn-close-quests')?.addEventListener('click', () => {
      this.questsModal.classList.add('hidden');
    });

    // Match Replays Opener
    document.getElementById('btn-open-replays')?.addEventListener('click', () => {
      this.openReplaysModal();
    });

    document.getElementById('btn-close-replays')?.addEventListener('click', () => {
      this.replaysModal.classList.add('hidden');
    });

    // Main Navigation Tabs
    const navBattle = document.getElementById('nav-btn-battle');
    const navDeck = document.getElementById('nav-btn-deck');
    const navShop = document.getElementById('nav-btn-shop');
    const navWiki = document.getElementById('nav-btn-wiki');

    const setNavActive = (activeBtn) => {
      [navBattle, navDeck, navShop, navWiki].forEach(btn => btn?.classList.remove('active'));
      activeBtn?.classList.add('active');
    };

    navBattle?.addEventListener('click', () => {
      setNavActive(navBattle);
      this.hideAllModals();
      this.menuOverlay.classList.remove('hidden');
    });

    navDeck?.addEventListener('click', () => {
      setNavActive(navDeck);
      this.hideAllModals();
      this.deckModal.classList.remove('hidden');
      this.deckBuilder.renderAll();
    });

    navShop?.addEventListener('click', () => {
      setNavActive(navShop);
      this.hideAllModals();
      this.openShopModal();
    });

    document.getElementById('btn-open-gold-shop')?.addEventListener('click', () => {
      setNavActive(navShop);
      this.hideAllModals();
      this.openShopModal();
    });

    document.getElementById('btn-open-gem-shop')?.addEventListener('click', () => {
      setNavActive(navShop);
      this.hideAllModals();
      this.openShopModal();
    });

    navWiki?.addEventListener('click', () => {
      setNavActive(navWiki);
      this.hideAllModals();
      this.cardsWikiModal.classList.remove('hidden');
    });

    document.getElementById('btn-close-deck')?.addEventListener('click', () => {
      this.deckModal.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');
      setNavActive(navBattle);
    });

    document.getElementById('btn-close-shop')?.addEventListener('click', () => {
      this.shopModal?.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');
      setNavActive(navBattle);
    });

    // Lobby Chest Gacha Buttons
    document.querySelectorAll('.lobby-chest-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const chestId = btn.dataset.chest;
        this.gachaManager.startOpening(chestId);
      });
    });

    // Quick Ranked Matchmaking Hero Button
    document.getElementById('btn-quick-match')?.addEventListener('click', () => {
      this.openMatchmakingModal();
      this.callbacks.onStartMatchmaking?.();
    });

    document.getElementById('btn-cancel-matchmaking')?.addEventListener('click', () => {
      this.closeMatchmakingModal();
      this.callbacks.onCancelMatchmaking?.();
    });

    // Royale Pass (皇室戰令)
    document.getElementById('btn-open-pass')?.addEventListener('click', () => {
      this.openPassModal();
    });
    document.getElementById('btn-close-pass')?.addEventListener('click', () => {
      this.passModal.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');
    });
    document.getElementById('btn-buy-gold-pass')?.addEventListener('click', () => {
      const res = inventory.unlockGoldPass();
      if (res.error) {
        this.showAnnouncement(`⚠️ ${res.error}`);
      } else {
        sounds.playVictory();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        this.showAnnouncement('👑 恭喜解鎖黃金通行證 (Gold Pass)！領取全部豪華專屬獎勵！');
        this.updateCurrencyUI();
        this.openPassModal();
      }
    });

    // 7-Day Daily Login (七日簽到)
    document.getElementById('btn-open-7day')?.addEventListener('click', () => {
      this.openSevenDayModal();
    });
    document.getElementById('btn-close-7day')?.addEventListener('click', () => {
      this.sevenDayModal.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');
    });

    // Achievements (榮譽成就)
    document.getElementById('btn-open-achievements')?.addEventListener('click', () => {
      this.openAchievementsModal();
    });
    document.getElementById('btn-close-achievements')?.addEventListener('click', () => {
      this.achievementsModal.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');
    });

    // 🌟 1-100 級升等系統 (Player Level Modal)
    document.getElementById('btn-open-player-level')?.addEventListener('click', () => {
      this.openPlayerLevelModal();
    });
    document.getElementById('btn-close-player-level')?.addEventListener('click', () => {
      this.playerLevelModal.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');
    });
    document.getElementById('btn-confirm-levelup')?.addEventListener('click', () => {
      this.levelUpModal.classList.add('hidden');
    });

    // Settings & Audio Volume (音量設定)
    document.getElementById('btn-open-settings')?.addEventListener('click', () => {
      this.openSettingsModal();
    });
    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      this.settingsModal.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');
    });

    document.getElementById('slider-master-volume')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      sounds.setMasterVolume(val / 100);
      const numEl = document.getElementById('master-vol-num');
      if (numEl) numEl.textContent = `${val}%`;
    });

    document.getElementById('slider-bgm-volume')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      sounds.setBgmVolume(val / 100);
      const numEl = document.getElementById('bgm-vol-num');
      if (numEl) numEl.textContent = `${val}%`;
    });

    document.getElementById('btn-toggle-perf-mode')?.addEventListener('click', (e) => {
      const btn = e.target;
      const isCurrentlyActive = btn.classList.contains('active');
      if (isCurrentlyActive) {
        btn.classList.remove('active');
        btn.textContent = '極致畫質 (MSAA+超清)';
        this.showAnnouncement('🎨 已切換為極致畫質渲染模式');
      } else {
        btn.classList.add('active');
        btn.textContent = '已啟用 (60 FPS 流暢)';
        this.showAnnouncement('⚡ 已切換為高影格率省電流暢模式');
      }
    });

    // Mode Buttons
    document.getElementById('btn-mode-ai')?.addEventListener('click', () => {
      this.menuOverlay.classList.add('hidden');
      this.aiModal.classList.remove('hidden');
    });

    document.getElementById('btn-mode-boss')?.addEventListener('click', () => {
      this.enterBattleView();
      this.callbacks.onStartBoss?.();
    });

    document.getElementById('btn-mode-7x')?.addEventListener('click', () => {
      this.enterBattleView();
      inventory.progressQuest('play_7x_elixir', 1);
      this.callbacks.onStart7X?.();
    });

    document.getElementById('btn-mode-draft')?.addEventListener('click', () => {
      this.startDraftProcess();
    });

    document.getElementById('btn-mode-pve')?.addEventListener('click', () => {
      this.enterBattleView();
      this.callbacks.onStartPvE?.();
    });

    document.getElementById('btn-mode-online')?.addEventListener('click', () => {
      this.menuOverlay.classList.add('hidden');
      this.roomModal.classList.remove('hidden');
      this.callbacks.onOpenOnlineModal?.();
    });

    document.getElementById('btn-mode-local')?.addEventListener('click', () => {
      this.enterBattleView();
      this.callbacks.onStartLocal?.();
    });

    document.getElementById('btn-close-wiki')?.addEventListener('click', () => {
      this.cardsWikiModal.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');
      setNavActive(navBattle);
    });

    // AI Modal
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedDifficulty = btn.dataset.diff;
      });
    });

    document.getElementById('btn-cancel-ai')?.addEventListener('click', () => {
      this.aiModal.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');
    });

    document.getElementById('btn-start-ai')?.addEventListener('click', () => {
      this.aiModal.classList.add('hidden');
      this.enterBattleView();
      this.callbacks.onStartAI?.(this.selectedDifficulty);
    });

    // King Power Action Buttons
    document.querySelectorAll('.king-power-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const powerId = btn.dataset.power;
        this.callbacks.onTriggerKingPower?.(powerId);
      });
    });

    // Camera Mode Toggle Button
    document.getElementById('btn-camera-toggle')?.addEventListener('click', () => {
      const mode = this.callbacks.onToggleCamera?.();
      const textEl = document.getElementById('camera-mode-text');
      if (textEl) {
        textEl.textContent = mode === 'classic' ? '經典' : (mode === 'king' ? '國王' : '鳥瞰');
      }
    });

    // Online Room Tabs
    const tabCreate = document.getElementById('tab-create-room');
    const tabJoin = document.getElementById('tab-join-room');
    const panelCreate = document.getElementById('panel-create-room');
    const panelJoin = document.getElementById('panel-join-room');

    tabCreate?.addEventListener('click', () => {
      tabCreate.classList.add('active');
      tabJoin.classList.remove('active');
      panelCreate.classList.remove('hidden');
      panelJoin.classList.add('hidden');
    });

    tabJoin?.addEventListener('click', () => {
      tabJoin.classList.add('active');
      tabCreate.classList.remove('active');
      panelJoin.classList.remove('hidden');
      panelCreate.classList.add('hidden');
    });

    document.getElementById('btn-close-room')?.addEventListener('click', () => {
      this.roomModal.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');
      this.callbacks.onCancelOnline?.();
    });

    document.getElementById('btn-copy-code')?.addEventListener('click', () => {
      const code = document.getElementById('my-room-code').textContent;
      navigator.clipboard?.writeText(code);
      const btn = document.getElementById('btn-copy-code');
      btn.textContent = '已複製!';
      setTimeout(() => { btn.textContent = '複製'; }, 2000);
    });

    document.getElementById('btn-confirm-join')?.addEventListener('click', () => {
      const input = document.getElementById('join-room-input').value.trim();
      if (input) {
        document.getElementById('join-status-message').textContent = '正在連線對手...';
        this.callbacks.onJoinRoom?.(input);
      }
    });

    // Emotes
    document.getElementById('btn-toggle-emote')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.emotePopover.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      this.emotePopover.classList.add('hidden');
    });

    document.querySelectorAll('.emote-btn-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const emote = btn.dataset.emote;
        this.emotePopover.classList.add('hidden');
        this.showEmote(emote, true);
        this.callbacks.onSendEmote?.(emote);
      });
    });

    // Sound
    document.getElementById('btn-sound-toggle')?.addEventListener('click', () => {
      const enabled = sounds.toggleSound();
      document.getElementById('sound-icon').textContent = enabled ? '🔊' : '🔇';
    });

    // Result
    document.getElementById('btn-rematch')?.addEventListener('click', () => {
      this.resultModal.classList.add('hidden');
      this.enterBattleView();
      this.callbacks.onRematch?.();
    });

    document.getElementById('btn-result-menu')?.addEventListener('click', () => {
      this.resultModal.classList.add('hidden');
      this.exitBattleView();
      this.menuOverlay.classList.remove('hidden');
      this.callbacks.onReturnToMenu?.();
      this.updateCurrencyUI();
    });
  }

  // -------------------------------------------------------------
  // DRAFT MODE 2-CHOOSE-1 PICKING SYSTEM
  // -------------------------------------------------------------

  startDraftProcess() {
    this.draftRound = 1;
    this.draftPlayerDeck = [];
    this.draftAiDeck = [];
    this.draftPool = Object.keys(CARDS).sort(() => Math.random() - 0.5);

    this.menuOverlay.classList.add('hidden');
    this.draftModal.classList.remove('hidden');

    this.renderDraftRound();
  }

  renderDraftRound() {
    document.getElementById('draft-round-num').textContent = this.draftRound;
    const choicesEl = document.getElementById('draft-choices');
    choicesEl.innerHTML = '';

    const card1Id = this.draftPool.pop() || 'knight';
    const card2Id = this.draftPool.pop() || 'archers';
    const c1 = CARDS[card1Id];
    const c2 = CARDS[card2Id];

    [c1, c2].forEach((card, idx) => {
      const otherCardId = idx === 0 ? card2Id : card1Id;
      const opt = document.createElement('div');
      opt.className = `draft-card-option rarity-${card.rarity}`;
      opt.innerHTML = `
        <div class="draft-cost">💧 ${card.cost} 聖水</div>
        <div class="draft-icon">${card.icon}</div>
        <div class="draft-name">${card.name}</div>
        <div class="draft-desc">${card.description}</div>
      `;

      opt.addEventListener('click', () => {
        // Player gets this card, opponent AI gets other card
        this.draftPlayerDeck.push(card.id);
        this.draftAiDeck.push(otherCardId);

        sounds.playTone(500, 800, 0.15, 'triangle', 0.25);

        if (this.draftRound < 4) {
          this.draftRound++;
          this.renderDraftRound();
        } else {
          // Fill remaining 4 slots with default cards
          const defaults = ['knight', 'archers', 'fireball', 'goblins', 'wizard', 'dragon', 'giant', 'skeletons'];
          while (this.draftPlayerDeck.length < 8) {
            const pick = defaults.find(d => !this.draftPlayerDeck.includes(d)) || 'knight';
            this.draftPlayerDeck.push(pick);
          }
          while (this.draftAiDeck.length < 8) {
            const pick = defaults.find(d => !this.draftAiDeck.includes(d)) || 'giant';
            this.draftAiDeck.push(pick);
          }

          this.draftModal.classList.add('hidden');
          this.enterBattleView();
          this.callbacks.onStartDraft?.(this.draftPlayerDeck, this.draftAiDeck);
        }
      });

      choicesEl.appendChild(opt);
    });
  }

  // -------------------------------------------------------------
  // TROPHY ROAD, QUESTS, REPLAYS MODALS
  // -------------------------------------------------------------

  openTrophyRoad() {
    const list = document.getElementById('trophy-road-list');
    list.innerHTML = '';
    const currentTrophies = inventory.data.trophies;

    TROPHY_ROAD.forEach(item => {
      const isReached = currentTrophies >= item.trophies;
      const isClaimed = inventory.data.claimedTrophies.includes(item.trophies);

      const step = document.createElement('div');
      step.className = `trophy-step-item ${isReached ? 'unlocked' : ''}`;
      step.innerHTML = `
        <div class="trophy-step-info">
          <div class="trophy-step-num">${item.trophies} 🏆</div>
          <div>
            <div class="trophy-step-name">${item.name}</div>
            <div class="trophy-step-reward">獎勵: ${item.rewardIcon}</div>
          </div>
        </div>
        <div>
          ${isReached
            ? (isClaimed
                ? '<button class="trophy-claim-btn claimed">已領取</button>'
                : `<button class="trophy-claim-btn" data-req="${item.trophies}">領取獎勵</button>`)
            : '<span style="font-size: 11px; color: #8fa0c0;">未達成</span>'}
        </div>
      `;

      step.querySelector('.trophy-claim-btn:not(.claimed)')?.addEventListener('click', () => {
        inventory.claimTrophyRoad(item.trophies, item);
        sounds.playVictory();
        this.updateCurrencyUI();
        this.openTrophyRoad();
      });

      list.appendChild(step);
    });

    this.trophyModal.classList.remove('hidden');
  }

  openQuestsModal() {
    const list = document.getElementById('quests-list');
    list.innerHTML = '';

    inventory.data.quests.forEach(q => {
      const pct = Math.min(100, (q.current / q.goal) * 100);
      const item = document.createElement('div');
      item.className = 'quest-item';
      item.innerHTML = `
        <div>
          <div class="quest-title">${q.title}</div>
          <div class="quest-desc">${q.desc} (${q.current}/${q.goal})</div>
          <div class="quest-bar-box">
            <div class="quest-bar-fill ${q.completed ? 'done' : ''}" style="width: ${pct}%"></div>
          </div>
        </div>
        <div>
          ${q.completed
            ? (q.claimed
                ? '<button class="trophy-claim-btn claimed">已領取</button>'
                : `<button class="trophy-claim-btn" data-quest="${q.id}">領取 ${q.rewardGold}🪙 ${q.rewardGems}💎</button>`)
            : `<span style="font-size: 11px; color: #8fa0c0;">${q.rewardGold}🪙 ${q.rewardGems}💎</span>`}
        </div>
      `;

      item.querySelector('.trophy-claim-btn:not(.claimed)')?.addEventListener('click', () => {
        inventory.claimQuest(q.id);
        sounds.playVictory();
        this.updateCurrencyUI();
        this.openQuestsModal();
      });

      list.appendChild(item);
    });

    this.questsModal.classList.remove('hidden');
  }

  openReplaysModal() {
    const list = document.getElementById('replays-list');
    list.innerHTML = '';

    if (inventory.data.replays.length === 0) {
      list.innerHTML = '<p style="color: #8fa0c0; padding: 20px;">暫無對戰記錄，去進行一場戰鬥吧！</p>';
    } else {
      inventory.data.replays.forEach(r => {
        const item = document.createElement('div');
        item.className = `replay-item ${r.result}`;
        item.innerHTML = `
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 13px;">${r.mode.toUpperCase()} · 對陣 ${r.enemyName}</div>
            <div style="font-size: 11px; color: #8fa0c0;">${r.date} · 時長 ${r.duration} 秒 · 皇冠 ${r.scores.playerCrowns}:${r.scores.enemyCrowns}</div>
          </div>
          <div>
            <span style="font-weight: 900; color: ${r.result === 'win' ? '#ffbe24' : '#ff2a55'}; font-size: 14px;">${r.result === 'win' ? '大捷' : '失利'}</span>
          </div>
        `;
        list.appendChild(item);
      });
    }

    this.replaysModal.classList.remove('hidden');
  }

  // -------------------------------------------------------------
  // 👑 ROYALE PASS (皇室戰令) UI
  // -------------------------------------------------------------

  openPassModal() {
    const list = document.getElementById('pass-tiers-list');
    const crownsNumEl = document.getElementById('pass-crowns-num');
    const unlockBanner = document.getElementById('pass-unlock-banner');
    if (!list) return;

    list.innerHTML = '';
    const currentCrowns = inventory.data.crowns;
    if (crownsNumEl) crownsNumEl.textContent = currentCrowns;

    if (unlockBanner) {
      if (inventory.data.hasGoldPass) {
        unlockBanner.innerHTML = `
          <div class="pass-banner-text">
            <span class="pass-gold-title" style="color:#00ffc4;">👑 已開通尊貴黃金特權通行證 (Gold Pass Active)</span>
            <span class="pass-gold-sub">享有全部 10 階雙軌豪華傳奇獎勵與專屬尊貴光環！</span>
          </div>
        `;
      }
    }

    ROYALE_PASS_TIERS.forEach(item => {
      const isReached = currentCrowns >= item.crownsReq;
      const freeClaimed = inventory.data.claimedPassFree.includes(item.tier);
      const goldClaimed = inventory.data.claimedPassGold.includes(item.tier);

      const row = document.createElement('div');
      row.className = `pass-tier-row ${isReached ? 'unlocked' : ''}`;
      row.innerHTML = `
        <div class="pass-tier-num">
          <span class="tier-badge">第 ${item.tier} 階</span>
          <span class="tier-crown-req">${item.crownsReq} 👑</span>
        </div>

        <div class="pass-reward-col free-col">
          <div class="reward-tag-label">免費獎勵</div>
          <div class="reward-icon-title">${item.freeReward.icon}</div>
          <div class="reward-action-area">
            ${isReached
              ? (freeClaimed
                  ? '<span class="reward-status-txt claimed">已領取</span>'
                  : `<button class="pass-claim-btn free" data-tier="${item.tier}">領取免費</button>`)
              : '<span class="reward-status-txt locked">未解鎖</span>'}
          </div>
        </div>

        <div class="pass-reward-col gold-col ${inventory.data.hasGoldPass ? 'active-gold' : ''}">
          <div class="reward-tag-label gold">✨ 黃金特權</div>
          <div class="reward-icon-title">${item.goldReward.icon}</div>
          <div class="reward-action-area">
            ${inventory.data.hasGoldPass
              ? (isReached
                  ? (goldClaimed
                      ? '<span class="reward-status-txt claimed">已領取</span>'
                      : `<button class="pass-claim-btn gold" data-tier="${item.tier}">領取黃金</button>`)
                  : '<span class="reward-status-txt locked">未解鎖</span>')
              : '<span class="reward-status-txt require-pass">需解鎖黃金戰令</span>'}
          </div>
        </div>
      `;

      row.querySelector('.pass-claim-btn.free')?.addEventListener('click', () => {
        inventory.claimPassReward(item.tier, false);
        this.grantReward(item.freeReward);
        sounds.playVictory();
        this.updateCurrencyUI();
        this.openPassModal();
      });

      row.querySelector('.pass-claim-btn.gold')?.addEventListener('click', () => {
        inventory.claimPassReward(item.tier, true);
        this.grantReward(item.goldReward);
        sounds.playVictory();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        this.updateCurrencyUI();
        this.openPassModal();
      });

      list.appendChild(row);
    });

    this.passModal.classList.remove('hidden');
  }

  grantReward(reward) {
    if (reward.type === 'gold') inventory.addGold(reward.val);
    if (reward.type === 'gems') inventory.addGems(reward.val);
    if (reward.type === 'chest') inventory.openChest(reward.val);
  }

  // -------------------------------------------------------------
  // 🎁 7-DAY DAILY LOGIN REWARDS UI
  // -------------------------------------------------------------

  openSevenDayModal() {
    const grid = document.getElementById('seven-day-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const claimed = inventory.data.claimedDailyRewards || [];

    SEVEN_DAY_REWARDS.forEach((item, index) => {
      const isClaimed = claimed.includes(item.day);
      const isAvailable = !isClaimed && (index === 0 || claimed.includes(item.day - 1));

      const card = document.createElement('div');
      card.className = `seven-day-item day-${item.day} ${isClaimed ? 'claimed' : (isAvailable ? 'available' : 'locked')}`;
      card.innerHTML = `
        <div class="seven-day-header">第 ${item.day} 天</div>
        <div class="seven-day-title">${item.title}</div>
        <div class="seven-day-reward-icon">${item.icon}</div>
        <div class="seven-day-action">
          ${isClaimed
            ? '<span class="seven-status-btn claimed">已簽到</span>'
            : (isAvailable
                ? `<button class="seven-claim-btn" data-day="${item.day}">立即簽到</button>`
                : '<span class="seven-status-btn locked">明日解鎖</span>')}
        </div>
      `;

      card.querySelector('.seven-claim-btn')?.addEventListener('click', () => {
        inventory.claimDailyLoginReward(item.day);
        if (item.rewardType === 'gold') inventory.addGold(item.val);
        if (item.rewardType === 'gems') inventory.addGems(item.val);
        if (item.rewardType === 'chest') inventory.openChest(item.val);

        sounds.playVictory();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        this.updateCurrencyUI();
        this.openSevenDayModal();
      });

      grid.appendChild(card);
    });

    this.sevenDayModal.classList.remove('hidden');
  }

  // -------------------------------------------------------------
  // 🎖️ ACHIEVEMENTS (榮譽成就) UI
  // -------------------------------------------------------------

  openAchievementsModal() {
    const list = document.getElementById('achievements-list');
    if (!list) return;
    list.innerHTML = '';

    ACHIEVEMENTS.forEach(ach => {
      const progress = inventory.data.achievementsProgress[ach.id] || 0;
      const isCompleted = progress >= ach.goal;
      const isClaimed = inventory.data.claimedAchievements.includes(ach.id);
      const pct = Math.min(100, (progress / ach.goal) * 100);

      const item = document.createElement('div');
      item.className = `achievement-item ${isCompleted ? 'completed' : ''}`;
      item.innerHTML = `
        <div class="ach-icon-box">${ach.icon}</div>
        <div class="ach-info-box">
          <div class="ach-title">${ach.name}</div>
          <div class="ach-desc">${ach.desc} (${Math.min(progress, ach.goal)}/${ach.goal})</div>
          <div class="quest-bar-box">
            <div class="quest-bar-fill ${isCompleted ? 'done' : ''}" style="width: ${pct}%"></div>
          </div>
        </div>
        <div class="ach-action-box">
          ${isCompleted
            ? (isClaimed
                ? '<button class="trophy-claim-btn claimed">已領取</button>'
                : `<button class="trophy-claim-btn featured" data-ach="${ach.id}">領取 ${ach.rewardGems} 💎</button>`)
            : `<span style="font-size: 11px; color: #8fa0c0;">${ach.rewardGems} 💎</span>`}
        </div>
      `;

      item.querySelector('.trophy-claim-btn:not(.claimed)')?.addEventListener('click', () => {
        inventory.claimAchievement(ach.id, ach.rewardGems);
        sounds.playVictory();
        this.updateCurrencyUI();
        this.openAchievementsModal();
      });

      list.appendChild(item);
    });

    this.achievementsModal.classList.remove('hidden');
  }

  // -------------------------------------------------------------
  // 🌟 1-100 級升等系統 (PLAYER 100-LEVEL PROGRESSION) UI
  // -------------------------------------------------------------

  openPlayerLevelModal() {
    const list = document.getElementById('level-rewards-list');
    const numEl = document.getElementById('level-modal-num');
    const titleTagEl = document.getElementById('level-modal-title-tag');
    const expDetailEl = document.getElementById('level-modal-exp-detail');
    const barFillEl = document.getElementById('level-modal-bar-fill');
    if (!list) return;

    list.innerHTML = '';
    const curLevel = inventory.data.playerLevel || 1;
    const curExp = inventory.data.playerExp || 0;
    const expReq = getPlayerExpRequired(curLevel);
    const title = getPlayerLevelTitle(curLevel);

    if (numEl) numEl.textContent = `Lv.${curLevel}`;
    if (titleTagEl) titleTagEl.textContent = title;
    if (expDetailEl) expDetailEl.textContent = curLevel >= MAX_PLAYER_LEVEL ? 'MAX LEVEL (最高榮譽)' : `${curExp} / ${expReq}`;
    if (barFillEl) barFillEl.style.width = curLevel >= MAX_PLAYER_LEVEL ? '100%' : `${Math.min(100, Math.round((curExp / expReq) * 100))}%`;

    const claimed = inventory.data.claimedLevelRewards || [];

    // Render 1 - 100 level milestone rewards
    for (let lvl = 2; lvl <= MAX_PLAYER_LEVEL; lvl++) {
      const isReached = curLevel >= lvl;
      const isClaimed = claimed.includes(lvl);
      const reward = getPlayerLevelReward(lvl);
      const lvlTitle = getPlayerLevelTitle(lvl);
      const isMajor = lvl % 10 === 0;

      const item = document.createElement('div');
      item.className = `level-tier-item ${isReached ? 'reached' : 'locked'} ${isMajor ? 'major-tier' : ''}`;
      item.innerHTML = `
        <div class="level-tier-badge-box">
          <span class="level-tier-icon">${reward.icon}</span>
          <span class="level-tier-lvl">Lv.${lvl}</span>
        </div>
        <div class="level-tier-info">
          <div class="level-tier-title">${lvl % 10 === 0 ? `👑 【${lvlTitle}】` : `第 ${lvl} 級升等豪禮`}</div>
          <div class="level-tier-reward">${reward.title}</div>
        </div>
        <div class="level-tier-action">
          ${isReached
            ? (isClaimed
                ? '<span class="level-status-txt claimed">已領取</span>'
                : `<button class="level-claim-btn ${isMajor ? 'gold' : ''}" data-lvl="${lvl}">領取獎勵</button>`)
            : `<span class="level-status-txt locked">Lv.${lvl} 解鎖</span>`}
        </div>
      `;

      item.querySelector('.level-claim-btn')?.addEventListener('click', () => {
        const res = inventory.claimLevelReward(lvl);
        if (res.success) {
          sounds.playVictory();
          if (isMajor) confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          this.updateCurrencyUI();
          this.openPlayerLevelModal();
        }
      });

      list.appendChild(item);
    }

    this.playerLevelModal.classList.remove('hidden');
  }

  showLevelUpCelebration(newLevel) {
    const badgeEl = document.getElementById('levelup-number-badge');
    const titleEl = document.getElementById('levelup-new-title');
    const rewardTextEl = document.getElementById('levelup-reward-text');

    const title = getPlayerLevelTitle(newLevel);
    const reward = getPlayerLevelReward(newLevel);

    if (badgeEl) badgeEl.textContent = `Lv.${newLevel}`;
    if (titleEl) titleEl.textContent = `【${title}】`;
    if (rewardTextEl) rewardTextEl.textContent = reward.title;

    sounds.playVictory();
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });

    if (this.levelUpModal) {
      this.levelUpModal.classList.remove('hidden');
    }
  }

  // -------------------------------------------------------------
  // ⚙️ SETTINGS MODAL UI
  // -------------------------------------------------------------

  openSettingsModal() {
    this.settingsModal.classList.remove('hidden');
  }

  hideAllModals() {
    this.menuOverlay.classList.add('hidden');
    this.deckModal.classList.add('hidden');
    this.shopModal?.classList.add('hidden');
    this.cardsWikiModal.classList.add('hidden');
    this.aiModal.classList.add('hidden');
    this.roomModal.classList.add('hidden');
    this.trophyModal.classList.add('hidden');
    this.questsModal.classList.add('hidden');
    this.replaysModal.classList.add('hidden');
    this.draftModal.classList.add('hidden');
    this.matchmakingModal?.classList.add('hidden');
    this.passModal?.classList.add('hidden');
    this.sevenDayModal?.classList.add('hidden');
    this.achievementsModal?.classList.add('hidden');
    this.settingsModal?.classList.add('hidden');
    this.playerLevelModal?.classList.add('hidden');
    this.levelUpModal?.classList.add('hidden');
    this.authModal?.classList.add('hidden');
    this.profileModal?.classList.add('hidden');
  }

  // -------------------------------------------------------------
  // 🎁 皇家寶箱商城與抽卡殿堂 UI
  // -------------------------------------------------------------

  openShopModal() {
    this.hideAllModals();
    if (!this.shopModal) return;

    // Render Daily Special Deals
    const dailyGrid = document.getElementById('shop-daily-cards-grid');
    if (dailyGrid) {
      dailyGrid.innerHTML = '';
      const dailyDeals = [
        { cardId: 'knight', count: 20, priceGold: 300 },
        { cardId: 'wizard', count: 10, priceGold: 600 },
        { cardId: 'thunder_valkyrie', count: 5, priceGold: 1500 },
        { cardId: 'cyber_ninja', count: 2, priceGold: 3000 }
      ];

      dailyDeals.forEach(deal => {
        const card = CARDS[deal.cardId];
        if (!card) return;

        const item = document.createElement('div');
        item.className = `shop-daily-card-item rarity-${card.rarity}`;
        item.innerHTML = `
          <div class="daily-card-icon">${card.icon}</div>
          <div class="daily-card-name">${card.name}</div>
          <div class="daily-card-count">x${deal.count} 張碎片</div>
          <button class="daily-card-buy-btn" data-card="${deal.cardId}">
            🪙 ${deal.priceGold} 金幣
          </button>
        `;

        item.querySelector('.daily-card-buy-btn')?.addEventListener('click', () => {
          if (inventory.data.gold < deal.priceGold) {
            this.showAnnouncement('⚠️ 金幣不足，無法購買碎片！');
            return;
          }
          inventory.addGold(-deal.priceGold);
          inventory.addCardCount(deal.cardId, deal.count);
          sounds.playVictory();
          confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
          this.showAnnouncement(`✨ 成功購買 ${card.name} 碎片 x${deal.count}！`);
          this.updateCurrencyUI();
          this.deckBuilder?.renderAll();
        });

        dailyGrid.appendChild(item);
      });
    }

    // Bind Shop Chest Buttons
    document.querySelectorAll('.shop-buy-chest-btn').forEach(btn => {
      btn.onclick = () => {
        const chestId = btn.dataset.chest;
        this.gachaManager.startOpening(chestId);
      };
    });

    // Daily Free Gems
    const freeGemsBtn = document.getElementById('btn-claim-free-daily-gems');
    if (freeGemsBtn) {
      freeGemsBtn.onclick = () => {
        const lastClaimKey = 'royal_last_free_gems_date';
        const today = new Date().toDateString();
        if (localStorage.getItem(lastClaimKey) === today) {
          this.showAnnouncement('⚠️ 今日免費寶石已領取，明日再來！');
          return;
        }
        localStorage.setItem(lastClaimKey, today);
        inventory.addGems(50);
        sounds.playVictory();
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        this.showAnnouncement('💎 恭喜領取每日免費 50 寶石！');
        this.updateCurrencyUI();
        freeGemsBtn.textContent = '今日已領取';
        freeGemsBtn.disabled = true;
      };
    }

    // Gold Exchange
    document.querySelectorAll('.supply-buy-btn.buy-gold').forEach(btn => {
      btn.onclick = () => {
        const gemsReq = parseInt(btn.dataset.gems, 10);
        const goldGain = parseInt(btn.dataset.gold, 10);

        if (inventory.data.gems < gemsReq) {
          this.showAnnouncement('⚠️ 璀璨寶石不足！');
          return;
        }

        inventory.addGems(-gemsReq);
        inventory.addGold(goldGain);
        sounds.playVictory();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        this.showAnnouncement(`🪙 成功兌換 +${goldGain} 金幣！`);
        this.updateCurrencyUI();
      };
    });

    this.shopModal.classList.remove('hidden');
  }

  // -------------------------------------------------------------
  // 實時天梯快速自動匹配 UI
  // -------------------------------------------------------------

  openMatchmakingModal() {
    this.hideAllModals();
    this.mmStatusTitle.textContent = '正在尋找天梯對手...';
    this.mmStatusSub.innerHTML = '已搜尋時間：<span id="mm-timer-text">00:00</span>';
    this.mmOpponentReveal.classList.add('hidden');
    this.matchmakingModal.classList.remove('hidden');
  }

  closeMatchmakingModal() {
    this.matchmakingModal.classList.add('hidden');
    this.menuOverlay.classList.remove('hidden');
  }

  updateMatchmakingTimer(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const timerEl = document.getElementById('mm-timer-text');
    if (timerEl) timerEl.textContent = formatted;
  }

  showOpponentMatched(opponent) {
    this.mmStatusTitle.textContent = '✨ 匹配成功！即將進入戰場...';
    this.mmStatusSub.textContent = '雙方數據已同步完成！';
    if (this.mmOpponentName) this.mmOpponentName.textContent = opponent.name;
    if (this.mmOpponentTag) this.mmOpponentTag.textContent = `${opponent.tag} · ${opponent.trophies} 🏆`;
    this.mmOpponentReveal.classList.remove('hidden');
  }

  enterBattleView() {
    this.hideAllModals();
    this.hudOverlay.classList.remove('hidden');
    this.currencyBar.classList.add('hidden');
    this.mainNav.classList.add('hidden');
  }

  exitBattleView() {
    this.hudOverlay.classList.add('hidden');
    this.currencyBar.classList.remove('hidden');
    this.mainNav.classList.remove('hidden');
  }

  showEmote(type, isPlayer = true) {
    const bubble = isPlayer ? this.playerEmoteBubble : this.enemyEmoteBubble;
    if (!bubble) return;

    sounds.playEmote(type);

    const emoteIcons = {
      laugh: '😂',
      cry: '😭',
      angry: '😡',
      thumbs: '👍',
      fire: '🔥',
      crown: '👑'
    };

    bubble.textContent = emoteIcons[type] || '👑';
    bubble.classList.remove('hidden');

    setTimeout(() => {
      bubble.classList.add('hidden');
    }, 3000);
  }

  // -------------------------------------------------------------
  // 用戶帳號與 GOOGLE 認證管理 UI
  // -------------------------------------------------------------

  openAuthModal(defaultTab = 'login') {
    this.hideAllModals();
    const tabLogin = document.getElementById('tab-auth-login');
    const tabSignup = document.getElementById('tab-auth-signup');
    const panelLogin = document.getElementById('panel-auth-login');
    const panelSignup = document.getElementById('panel-auth-signup');
    const loginErr = document.getElementById('login-error-msg');
    const signupErr = document.getElementById('signup-error-msg');
    if (loginErr) loginErr.textContent = '';
    if (signupErr) signupErr.textContent = '';

    if (defaultTab === 'signup') {
      tabSignup?.classList.add('active');
      tabLogin?.classList.remove('active');
      panelSignup?.classList.remove('hidden');
      panelLogin?.classList.add('hidden');
    } else {
      tabLogin?.classList.add('active');
      tabSignup?.classList.remove('active');
      panelLogin?.classList.remove('hidden');
      panelSignup?.classList.add('hidden');
    }
    this.authModal.classList.remove('hidden');
  }

  openProfileModal() {
    this.hideAllModals();
    const user = auth.currentUser;
    if (!user) return;

    const avatarEl = document.getElementById('profile-avatar-display');
    const nameEl = document.getElementById('profile-username-display');
    const uidEl = document.getElementById('profile-uid-display');
    const badgeEl = document.getElementById('profile-auth-type-badge');
    const googleEmailEl = document.getElementById('profile-google-email');
    const linkGoogleBtn = document.getElementById('btn-profile-link-google');

    if (avatarEl) {
      if (user.avatarUrl) {
        avatarEl.innerHTML = `<img src="${user.avatarUrl}" class="profile-avatar-img" alt="avatar" referrerpolicy="no-referrer" crossorigin="anonymous" />`;
      } else {
        avatarEl.textContent = user.avatar || '👑';
      }
    }
    if (nameEl) nameEl.textContent = user.username || '皇家領主';
    if (uidEl) uidEl.textContent = `ID: ${user.id}`;

    if (badgeEl) {
      if (user.authType === 'google') {
        badgeEl.textContent = '🌐 Google 授權帳號';
        badgeEl.className = 'profile-auth-status google';
      } else if (user.authType === 'local') {
        badgeEl.textContent = '👑 皇家正式帳號';
        badgeEl.className = 'profile-auth-status local';
      } else {
        badgeEl.textContent = '🛡️ 本地訪客帳號';
        badgeEl.className = 'profile-auth-status guest';
      }
    }

    if (googleEmailEl) {
      googleEmailEl.textContent = user.email ? `已綁定: ${user.email}` : '尚未綁定 Google 帳號';
    }

    if (linkGoogleBtn) {
      if (user.googleId || user.email) {
        linkGoogleBtn.textContent = '已連結 Google';
        linkGoogleBtn.disabled = true;
        linkGoogleBtn.classList.add('linked');
      } else {
        linkGoogleBtn.textContent = '立即綁定 Google';
        linkGoogleBtn.disabled = false;
        linkGoogleBtn.classList.remove('linked');
      }
    }

    const tEl = document.getElementById('profile-stat-trophies');
    const cEl = document.getElementById('profile-stat-crowns');
    const wEl = document.getElementById('profile-stat-wins');
    const kEl = document.getElementById('profile-stat-cards');

    if (tEl) tEl.textContent = `${inventory.data.trophies} 🏆`;
    if (cEl) cEl.textContent = `${inventory.data.crowns} 👑`;
    if (wEl) wEl.textContent = `${inventory.data.replays?.filter(r => r.result === 'win').length || 0} ⚔️`;
    if (kEl) kEl.textContent = `${Object.keys(inventory.data.cards).length} 🎴`;

    this.profileModal.classList.remove('hidden');
  }

  async handleGoogleAuth(isLinking = false) {
    const prevUserId = auth.currentUser ? auth.currentUser.id : null;
    const res = await auth.triggerRealGoogleAuth(isLinking);
    if (res && res.success) {
      sounds.playVictory();
      this.authModal.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');
      this.refreshUserData(prevUserId);
      if (isLinking) {
        this.openProfileModal();
        this.showAnnouncement(`✨ 已成功綁定真實 Google: ${res.user.email} (進度已同步)`);
      } else {
        if (res.isNew) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          this.showAnnouncement(`🎉 歡迎 Google 領主：${res.user.username} (進度已同步)！`);
        } else {
          this.showAnnouncement(`👑 歡迎 Google 領主回來：${res.user.username}！`);
        }
      }
    } else if (res && res.error && res.error !== '已取消 Google 登入') {
      this.showAnnouncement(`⚠️ ${res.error}`);
    }
  }

  refreshUserData(prevUserId = null) {
    inventory.switchUser(prevUserId);
    this.updateCurrencyUI();
    this.deckBuilder?.renderAll();
    const pNameEl = document.getElementById('player-name');
    if (pNameEl) {
      pNameEl.textContent = `${auth.currentUser?.username || '皇家領主'} (你)`;
    }

    // ☁️ 自動由伺服器雲端拉取該帳號所有存檔 (跨設備無損同步)
    inventory.syncWithServer((syncedData) => {
      this.updateCurrencyUI();
      this.deckBuilder?.renderAll();
      if (syncedData.playerLevel >= 7) {
        this.showAnnouncement(`☁️ 已自動由伺服器同步 Level ${syncedData.playerLevel} 帳號存檔！`);
      }
    });
  }

  showAnnouncement(text) {
    if (!this.announcementBanner || !this.announcementText) return;
    this.announcementText.textContent = text;
    this.announcementBanner.classList.remove('hidden');

    setTimeout(() => {
      this.announcementBanner.classList.add('hidden');
    }, 2600);
  }

  showGameOver(result, scores) {
    const titleEl = document.getElementById('result-title');
    const subEl = document.getElementById('result-subtitle');
    const pCrownsEl = document.getElementById('final-player-crowns');
    const eCrownsEl = document.getElementById('final-enemy-crowns');

    pCrownsEl.textContent = scores.playerCrowns;
    eCrownsEl.textContent = scores.enemyCrowns;

    titleEl.className = `result-title ${result}`;

    let expGained = 30;
    if (result === 'win') {
      titleEl.textContent = '皇室大捷！';
      subEl.textContent = '你已完全擊潰敵方皇家防線！';
      inventory.addGold(150);
      inventory.addTrophies(30);
      inventory.addCrowns(scores.playerCrowns);
      inventory.progressQuest('win_matches', 1);
      inventory.progressAchievement('first_win', 1);
      inventory.progressAchievement('master_wins', 1);
      inventory.progressAchievement('crown_collector', scores.playerCrowns);
      expGained = 120;

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } else if (result === 'loss') {
      titleEl.textContent = '戰鬥失利！';
      subEl.textContent = '國王塔被摧毀，總結經驗再接再厲！';
      inventory.addGold(40);
      inventory.addCrowns(scores.playerCrowns);
      expGained = 35;
    } else {
      titleEl.textContent = '平局對決！';
      subEl.textContent = '雙方勢均力敵，未分勝負！';
      inventory.addGold(70);
      inventory.addCrowns(scores.playerCrowns);
      expGained = 60;
    }

    const expRes = inventory.addExp(expGained);
    this.updateCurrencyUI();

    if (expRes.leveledUp) {
      setTimeout(() => {
        this.showLevelUpCelebration(expRes.newLevel);
      }, 1000);
    }

    const crownSpans = document.querySelectorAll('#result-crowns-banner .crown-icon');
    crownSpans.forEach((span, i) => {
      if (i < scores.playerCrowns) {
        span.classList.add('active');
      } else {
        span.classList.remove('active');
      }
    });

    this.resultModal.classList.remove('hidden');
  }

  populateCardsWiki() {
    const grid = document.getElementById('cards-wiki-grid');
    if (!grid) return;

    grid.innerHTML = '';
    Object.values(CARDS).forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = `wiki-card-item rarity-${card.rarity}`;

      let statsHtml = '';
      if (card.type === 'troop') {
        statsHtml = `
          <div>生命值: ${card.hp}</div>
          <div>傷害: ${card.damage}</div>
          <div>攻速: ${card.hitSpeed}s</div>
          <div>射程: ${card.range > 1 ? card.range + '格' : '近戰'}</div>
        `;
      } else if (card.type === 'spell') {
        statsHtml = `
          <div>作用範圍: ${card.radius}格</div>
          <div>效果: ${card.id === 'rage' ? '+35% 攻速移速' : (card.id === 'freeze' ? '完全凍結 3.5s' : `${card.damage} 傷害`)}</div>
          <div>持續時間: ${card.duration ? card.duration + 's' : '即時'}</div>
        `;
      } else if (card.type === 'building') {
        statsHtml = `
          <div>生命值: ${card.hp}</div>
          <div>作用: ${card.id === 'goblinhut' ? '每4s生產哥布林' : '高能聚能激光'}</div>
          <div>持續時間: ${card.lifetime}s</div>
        `;
      }

      cardEl.innerHTML = `
        <div class="wiki-card-header">
          <span class="wiki-card-icon">${card.icon}</span>
          <div>
            <div class="wiki-card-title">${card.name}</div>
            <div class="wiki-card-cost">💧 ${card.cost} 聖水 · ${card.rarity.toUpperCase()}</div>
          </div>
        </div>
        <div class="wiki-card-stats">
          ${statsHtml}
        </div>
        <div class="wiki-card-desc">${card.description}</div>
      `;

      grid.appendChild(cardEl);
    });
  }
}
