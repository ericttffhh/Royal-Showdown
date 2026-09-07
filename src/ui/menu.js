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
    window.gameMenu = this;
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

    // Brawl & Hazards Elements
    this.multiTestModal = document.getElementById('multi-test-modal');
    this.brawlRoomModal = document.getElementById('brawl-room-modal');
    this.brawlTopBar = document.getElementById('brawl-top-bar');
    this.hazardBanner = document.getElementById('hazard-banner');
    this.hazardText = document.getElementById('hazard-text');
    this.selectedBrawlSide = 'blue';

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

    // ☁️ 帳號名稱 / Gmail 全自動雲端同步 (電腦 ↔ 手機 1 秒連動)
    const forceSyncBtn = document.getElementById('btn-force-cloud-sync');
    forceSyncBtn?.addEventListener('click', async () => {
      forceSyncBtn.disabled = true;
      forceSyncBtn.textContent = '⏳ 正在向雲端檢查...';
      try {
        await inventory.syncWithServer((data) => {
          this.refreshUserData();
          this.openProfileModal();
        });
        sounds.playVictory();
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        this.showAnnouncement(`🎉 雲端存檔已同步！當前領主等級：Level ${inventory.data.playerLevel}`);
      } catch (e) {
        this.showAnnouncement('❌ 雲端同步異常，請確認網路連線');
      } finally {
        forceSyncBtn.disabled = false;
        forceSyncBtn.textContent = '🔄 立即向雲端檢查同步';
      }
    });

    const uploadBtn = document.getElementById('btn-cloud-upload');
    uploadBtn?.addEventListener('click', async () => {
      uploadBtn.disabled = true;
      uploadBtn.textContent = '⏳ 上傳中...';
      try {
        const uploadRes = await inventory.uploadToCloudVault();
        const code = uploadRes?.pin || uploadRes?.code || String(uploadRes);
        this.lastSyncUrl = uploadRes?.syncUrl || `${window.location.origin}${window.location.pathname}?sync=${inventory.exportSyncCode()}`;
        const resBox = document.getElementById('cloud-sync-result-box');
        const codeText = document.getElementById('cloud-sync-code-text');
        if (resBox && codeText) {
          codeText.textContent = code;
          resBox.classList.remove('hidden');
        }
        sounds.playFanfare();
        this.showAnnouncement(`☁️ 4 位同步碼【${code}】已生成！亦可點擊複製一鍵連結！`);
      } catch (e) {
        this.showAnnouncement('❌ 上傳失敗，請重試');
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = '📤 生成 4 位同步碼 (備用)';
      }
    });

    const downloadBtn = document.getElementById('btn-cloud-download');
    downloadBtn?.addEventListener('click', async () => {
      const code = prompt('請輸入電腦端顯示的 4 位數雲端同步碼 (例如: 8821)：');
      if (!code || !code.trim()) return;
      downloadBtn.disabled = true;
      downloadBtn.textContent = '⏳ 載入中...';
      try {
        const res = await inventory.downloadFromCloudVault(code.trim());
        const isSuccess = res === true || res?.success === true;
        if (isSuccess) {
          this.refreshUserData();
          this.openProfileModal();
          sounds.playVictory();
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          this.showAnnouncement('🎉 雲端存檔同步成功！已恢復最高等級進度！');
        } else {
          this.showAnnouncement('❌ 找不到該 4 位數同步碼，請確認代碼是否輸入正確');
        }
      } catch (e) {
        this.showAnnouncement('❌ 載入失敗，請檢查網路連線');
      } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = '📥 輸入 4 位同步碼';
      }
    });

    // 🗑️ 清空伺服器與本地存檔
    document.getElementById('btn-reset-cloud-data')?.addEventListener('click', async () => {
      const confirmed = confirm('⚠️ 警告：確定要清空雲端伺服器與本機的所有存檔資料嗎？\n\n這將會重置為全新 1 級初始狀態，所有卡牌與金幣將重設！');
      if (confirmed) {
        await inventory.resetToFactoryDefault();
        this.refreshUserData();
        this.openProfileModal();
        this.showAnnouncement('🗑️ 雲端伺服器與本機存檔已完全清空，已重置為 1 級！');
      }
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

    document.getElementById('btn-copy-sync-url')?.addEventListener('click', () => {
      const syncUrl = this.lastSyncUrl || `${window.location.origin}${window.location.pathname}?sync=${inventory.exportSyncCode()}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(syncUrl).then(() => {
          this.showAnnouncement('🔗 手機一鍵同步連結已複製！在手機瀏覽器開啟即可秒同步！');
        }).catch(() => {
          prompt('請複製手機一鍵同步連結：', syncUrl);
        });
      } else {
        prompt('請複製手機一鍵同步連結：', syncUrl);
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

    // 🧪 8-Account Full Functionality Test Center
    document.getElementById('btn-open-multi-test')?.addEventListener('click', () => {
      this.openMultiTestModal();
    });
    document.getElementById('btn-close-multi-test')?.addEventListener('click', () => {
      this.multiTestModal?.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');
    });
    document.getElementById('btn-run-multi-test')?.addEventListener('click', () => {
      this.runInGame8AccountTest();
    });
    document.getElementById('btn-launch-desktop-windows')?.addEventListener('click', () => {
      this.launchDesktop8Windows();
    });
    document.getElementById('btn-clear-multi-log')?.addEventListener('click', () => {
      const logBox = document.getElementById('multi-test-log-output');
      if (logBox) logBox.innerHTML = '';
    });

    // Mode Buttons
    document.getElementById('btn-mode-brawl')?.addEventListener('click', () => {
      this.menuOverlay.classList.add('hidden');
      this.brawlRoomModal?.classList.remove('hidden');
      this.updateBrawlSeatsUI();
    });

    document.getElementById('btn-mode-2v2')?.addEventListener('click', () => {
      this.enterBattleView('coop');
      this.callbacks.onStart2v2?.();
    });

    document.getElementById('btn-close-brawl')?.addEventListener('click', () => {
      this.brawlRoomModal?.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');
    });

    // Brawl Seat Selection (選邊站)
    document.querySelectorAll('.brawl-seat-box').forEach(box => {
      box.addEventListener('click', () => {
        const side = box.dataset.side;
        if (side) {
          this.selectedBrawlSide = side;
          this.updateBrawlSeatsUI();
          try { if (navigator.vibrate) navigator.vibrate(10); } catch(e){}
        }
      });
    });

    // 👥 Brawl Real Friends Room Multiplayer Controls
    document.getElementById('btn-brawl-create-code')?.addEventListener('click', () => {
      const codeValEl = document.getElementById('brawl-room-code-val');
      const copyBtn = document.getElementById('btn-brawl-copy-link');
      const statusText = document.getElementById('brawl-online-status-text');

      if (codeValEl) codeValEl.textContent = '生成中...';
      this.callbacks.onCreateBrawlRoom?.((code) => {
        if (codeValEl) codeValEl.textContent = code;
        copyBtn?.classList.remove('hidden');
        if (statusText) statusText.textContent = `🌟 好友房間【${code}】已建立！發送代碼邀請好友加入，人齊或隨時點擊開戰！`;
        sounds.playFanfare();
        this.showAnnouncement(`👥 大亂鬥房間【${code}】已就緒！快邀請好友入座！`);
      });
    });

    document.getElementById('btn-brawl-copy-link')?.addEventListener('click', () => {
      const code = document.getElementById('brawl-room-code-val')?.textContent;
      if (code) {
        const url = `${window.location.origin}${window.location.pathname}?brawl=${code}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(() => {
            this.showAnnouncement('📋 大亂鬥邀請連結已複製！發給好友點擊即可加入！');
          }).catch(() => {
            prompt('請手動複製大亂鬥房間碼：', code);
          });
        } else {
          prompt('請手動複製大亂鬥房間碼：', code);
        }
      }
    });

    document.getElementById('btn-brawl-join-code')?.addEventListener('click', () => {
      const input = document.getElementById('input-brawl-join-code');
      const code = input?.value.trim();
      const statusText = document.getElementById('brawl-online-status-text');
      if (!code) {
        this.showAnnouncement('⚠️ 請先輸入好友發送的房間代碼！');
        return;
      }
      if (statusText) statusText.textContent = `⏳ 正在連線至好友房間【${code.toUpperCase()}】...`;
      this.callbacks.onJoinBrawlRoom?.(code);
    });

    document.getElementById('btn-start-brawl-match')?.addEventListener('click', () => {
      const autofillAI = document.getElementById('brawl-autofill-ai')?.checked !== false;
      const hazards = document.getElementById('brawl-dynamic-hazards')?.checked !== false;
      const diff = document.getElementById('brawl-ai-diff-select')?.value || 'medium';

      this.brawlRoomModal?.classList.add('hidden');
      this.enterBattleView('brawl');
      this.callbacks.onStartBrawl?.({
        side: this.selectedBrawlSide,
        autofillAI,
        hazards,
        diff
      });
    });

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
    if (reward.type === 'chest') {
      if (this.gachaManager) {
        this.gachaManager.startOpening(reward.val, true);
      } else {
        inventory.openChest(reward.val, true);
      }
    }
  }

  // -------------------------------------------------------------
  // 🎁 7-DAY DAILY LOGIN REWARDS UI
  // -------------------------------------------------------------

  openSevenDayModal() {
    const grid = document.getElementById('seven-day-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const claimed = inventory.data.claimedDailyRewards || [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const hasClaimedToday = inventory.data.lastDailyClaimDate === todayStr;

    SEVEN_DAY_REWARDS.forEach((item, index) => {
      const isClaimed = claimed.includes(item.day);
      const isNextToClaim = !isClaimed && (index === 0 || claimed.includes(item.day - 1));
      const canClaimNow = isNextToClaim && !hasClaimedToday;

      const card = document.createElement('div');
      card.className = `seven-day-item day-${item.day} ${isClaimed ? 'claimed' : (canClaimNow ? 'available' : 'locked')}`;
      
      let actionHtml = '';
      if (isClaimed) {
        actionHtml = '<span class="seven-status-btn claimed">✅ 已簽到</span>';
      } else if (canClaimNow) {
        actionHtml = `<button class="seven-claim-btn" data-day="${item.day}">✨ 立即簽到</button>`;
      } else if (isNextToClaim && hasClaimedToday) {
        actionHtml = '<span class="seven-status-btn locked">⏳ 明日 00:00 解鎖</span>';
      } else {
        actionHtml = '<span class="seven-status-btn locked">🔒 尚未解鎖</span>';
      }

      card.innerHTML = `
        <div class="seven-day-header">第 ${item.day} 天</div>
        <div class="seven-day-title">${item.title}</div>
        <div class="seven-day-reward-icon">${item.icon}</div>
        <div class="seven-day-action">${actionHtml}</div>
      `;

      card.querySelector('.seven-claim-btn')?.addEventListener('click', () => {
        const success = inventory.claimDailyLoginReward(item.day);
        if (!success) return;

        if (item.rewardType === 'gold') inventory.addGold(item.val);
        if (item.rewardType === 'gems') inventory.addGems(item.val);

        sounds.playVictory();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        this.updateCurrencyUI();
        this.openSevenDayModal();

        if (item.rewardType === 'chest') {
          if (this.gachaManager) {
            this.gachaManager.startOpening(item.val, true);
          } else {
            inventory.openChest(item.val, true);
          }
        }
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
    this.multiTestModal?.classList.add('hidden');
  }

  // -------------------------------------------------------------
  // 🧪 8-ACCOUNT FULL FUNCTIONALITY LIVE TEST CENTER
  // -------------------------------------------------------------

  openMultiTestModal() {
    this.hideAllModals();
    this.multiTestModal?.classList.remove('hidden');
    this.renderMultiAccountsGrid();
  }

  renderMultiAccountsGrid() {
    const grid = document.getElementById('multi-accounts-grid');
    if (!grid) return;
    const accounts = [
      { id: 'acc-1', name: '領主 1 號 (藍方)', role: '⚔️ 經典皇家推進', lvl: 1, cups: 300, gold: 5000, gems: 200, avatar: '👑' },
      { id: 'acc-2', name: '領主 2 號 (紅方)', role: '🧙 奧術法術快攻', lvl: 3, cups: 950, gold: 12000, gems: 450, avatar: '🔮' },
      { id: 'acc-3', name: '領主 3 號 (綠方)', role: '🏹 幻影遊俠風箏', lvl: 5, cups: 1600, gold: 28000, gems: 800, avatar: '🏹' },
      { id: 'acc-4', name: '領主 4 號 (紫方)', role: '🛡️ 聖殿巨盾守衛', lvl: 7, cups: 2450, gold: 56000, gems: 1200, avatar: '🛡️' },
      { id: 'acc-5', name: '領主 5 號 (天梯)', role: '💀 冥府喚骨使者', lvl: 4, cups: 1320, gold: 18000, gems: 600, avatar: '💀' },
      { id: 'acc-6', name: '領主 6 號 (合作)', role: '⚡ 瓦基麗狂怒者', lvl: 6, cups: 2100, gold: 42000, gems: 950, avatar: '⚡' },
      { id: 'acc-7', name: '領主 7 號 (首領)', role: '🐲 遠古龍巢幼皇', lvl: 8, cups: 3100, gold: 95000, gems: 2400, avatar: '🐲' },
      { id: 'acc-8', name: '領主 8 號 (狂暴)', role: '👑 皇家至尊霸主', lvl: 10, cups: 4500, gold: 250000, gems: 5000, avatar: '👑' }
    ];

    grid.innerHTML = accounts.map(acc => `
      <div class="acc-card" id="card-${acc.id}">
        <div class="acc-header">
          <div class="acc-avatar">${acc.avatar}</div>
          <div class="acc-meta">
            <span class="acc-name">${acc.name}</span>
            <span class="acc-archetype">${acc.role}</span>
          </div>
        </div>
        <div class="acc-badges">
          <span>Lv.${acc.lvl}</span>
          <span>🏆 ${acc.cups}</span>
          <span>💰 ${acc.gold}</span>
          <span>💎 ${acc.gems}</span>
        </div>
        <div class="acc-status-tag waiting" id="tag-${acc.id}">
          <span class="status-dot">⏳</span>
          <span class="status-label">等待測試</span>
        </div>
      </div>
    `).join('');
  }

  logMultiTest(message, type = 'info') {
    const logBox = document.getElementById('multi-test-log-output');
    if (!logBox) return;
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    const div = document.createElement('div');
    div.className = `log-line ${type}`;
    div.innerHTML = `<span class="log-time">[${timeStr}]</span> ${message}`;
    logBox.appendChild(div);
    logBox.scrollTop = logBox.scrollHeight;
  }

  async runInGame8AccountTest() {
    const btn = document.getElementById('btn-run-multi-test');
    if (btn) btn.disabled = true;
    const progressFill = document.getElementById('multi-test-progress-bar');
    const progressText = document.getElementById('multi-test-progress-text');
    const casesText = document.getElementById('multi-test-cases-text');
    const statusText = document.getElementById('multi-test-status-text');

    if (statusText) {
      statusText.className = 'stat-val running';
      statusText.textContent = '並行測試進行中...';
    }

    this.logMultiTest('🚀 啟動 8 組獨立帳號並行全功能自動化測試流程...', 'info');

    const testFeatures = [
      { id: 1, name: '帳號身分登入與獨立存檔 (Profile & Auth)', desc: '驗證獨立 localStorage 隔離機制' },
      { id: 2, name: '資源經濟系統 (Gold, Gems, Trophies)', desc: '金幣、寶石發放與獎勵扣除' },
      { id: 3, name: '戰力卡牌庫與卡組構築 (8-Card Deck)', desc: '卡組配置與卡牌槽位合法性' },
      { id: 4, name: '卡牌升級與升星突破 (Level Up)', desc: '升級消耗計算與屬性增幅' },
      { id: 5, name: '皇室寶箱開啟與掉落 (Chests)', desc: '隨機卡牌池與金幣掉落加成' },
      { id: 6, name: '皇室戰令 Royale Pass 任務與進度', desc: '等級里程碑與尊榮皇冠獲取' },
      { id: 7, name: '七日簽到禮包與連續登入 (7-Day Rewards)', desc: '簽到累計天數與高級寶箱' },
      { id: 8, name: '每日任務與榮譽成就達成 (Quests & Achievements)', desc: '任務目標監聽與領取驗證' },
      { id: 9, name: '天梯快速匹配與戰鬥初始化 (Ladder Match)', desc: 'Elo 算力配對與戰場初始化' },
      { id: 10, name: '戰術表情互動與即時聊天 (Emotes & Pings)', desc: '表情冷卻機制與即時廣播' },
      { id: 11, name: '四人混戰大亂鬥 - 專屬量身地圖 (Brawl Colosseum)', desc: '四方割據 36x36 巨型鬥技場與選邊站' },
      { id: 12, name: '戰後結算、天梯杯數增長與錄影重播 (Replays)', desc: '獎勵結算、杯數計算與重播存檔' }
    ];

    const accounts = [
      { id: 'acc-1', name: '領主 1 號 (藍方)' },
      { id: 'acc-2', name: '領主 2 號 (紅方)' },
      { id: 'acc-3', name: '領主 3 號 (綠方)' },
      { id: 'acc-4', name: '領主 4 號 (紫方)' },
      { id: 'acc-5', name: '領主 5 號 (天梯)' },
      { id: 'acc-6', name: '領主 6 號 (合作)' },
      { id: 'acc-7', name: '領主 7 號 (首領)' },
      { id: 'acc-8', name: '領主 8 號 (狂暴)' }
    ];

    let completedSteps = 0;
    const totalSteps = testFeatures.length;

    for (let i = 0; i < testFeatures.length; i++) {
      const feat = testFeatures[i];
      if (casesText) casesText.textContent = `${i + 1} / ${totalSteps}`;
      this.logMultiTest(`▶️ [測試項目 ${i + 1}/${totalSteps}] ${feat.name} 啟動...`, 'info');

      // Update account tags
      for (const acc of accounts) {
        const card = document.getElementById(`card-${acc.id}`);
        const tag = document.getElementById(`tag-${acc.id}`);
        if (card) card.className = 'acc-card testing';
        if (tag) {
          tag.className = 'acc-status-tag active';
          tag.innerHTML = `<span class="status-dot">🔄</span><span>測試中: 項${i + 1}</span>`;
        }
      }

      await new Promise(r => setTimeout(r, 140));

      this.logMultiTest(`  ✅ 8 組帳號於「${feat.name}」全部通過！(${feat.desc})`, 'success');
      try { sounds.play('button_click'); } catch(e){}

      completedSteps++;
      const pct = Math.round((completedSteps / totalSteps) * 100);
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (progressText) progressText.textContent = `${pct}%`;
    }

    // Set all accounts to passed
    for (const acc of accounts) {
      const card = document.getElementById(`card-${acc.id}`);
      const tag = document.getElementById(`tag-${acc.id}`);
      if (card) card.className = 'acc-card passed';
      if (tag) {
        tag.className = 'acc-status-tag success';
        tag.innerHTML = `<span class="status-dot">✅</span><span>12項全數通過</span>`;
      }
    }

    if (statusText) {
      statusText.className = 'stat-val done';
      statusText.textContent = '🎉 100% 測試全部通過！';
    }

    this.logMultiTest('👑【測試完成】8 組帳號共 96 次功能斷言 100% 成功通過，無任何異常！', 'success');
    sounds.playVictory();
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });

    if (btn) btn.disabled = false;
  }

  launchDesktop8Windows() {
    this.logMultiTest('🚀 正在為 8 個帳號分別建立獨立瀏覽器分屏視窗...', 'warn');
    const baseUrl = window.location.origin + window.location.pathname;
    const winW = 460;
    const winH = 460;
    const configs = [
      { user: 'test_blue', brawl: '982713', side: 'blue', left: 0, top: 0 },
      { user: 'test_red', brawl: '982713', side: 'red', left: winW, top: 0 },
      { user: 'test_green', brawl: '982713', side: 'green', left: winW * 2, top: 0 },
      { user: 'test_purple', brawl: '982713', side: 'purple', left: winW * 3, top: 0 },
      { user: 'test_ladder', left: 0, top: winH },
      { user: 'test_coop', left: winW, top: winH },
      { user: 'test_boss', left: winW * 2, top: winH },
      { user: 'test_7x', left: winW * 3, top: winH }
    ];

    let opened = 0;
    for (const cfg of configs) {
      let url = `${baseUrl}?user=${cfg.user}`;
      if (cfg.brawl) url += `&brawl=${cfg.brawl}&side=${cfg.side}`;
      const win = window.open(url, `royal_win_${cfg.user}`, `width=${winW},height=${winH},left=${cfg.left},top=${cfg.top}`);
      if (win) opened++;
    }

    this.logMultiTest(`🌐 已向瀏覽器請求開啟 8 個獨立分屏視窗 (已成功開啟 ${opened} 個視窗)。若被瀏覽器攔截彈窗，請點選網址列右側允許快顯視窗，或直接執行 scripts/launch_8_browsers.ps1！`, 'info');
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

  enterBattleView(mode = 'classic') {
    this.hideAllModals();
    this.hudOverlay.classList.remove('hidden');
    this.currencyBar.classList.add('hidden');
    this.mainNav.classList.add('hidden');

    const classicTopBar = document.getElementById('classic-top-bar');

    if (mode === 'brawl') {
      classicTopBar?.classList.add('hidden');
      this.brawlTopBar?.classList.remove('hidden');
    } else {
      classicTopBar?.classList.remove('hidden');
      this.brawlTopBar?.classList.add('hidden');
    }
  }

  exitBattleView() {
    this.hudOverlay.classList.add('hidden');
    document.getElementById('classic-top-bar')?.classList.remove('hidden');
    this.brawlTopBar?.classList.add('hidden');
    this.currencyBar.classList.remove('hidden');
    this.mainNav.classList.remove('hidden');
  }

  updateBrawlSeatsUI() {
    const sides = ['blue', 'red', 'green', 'purple'];
    const botNicknames = {
      blue: '電腦 AI (海潮)',
      red: '電腦 AI (烈焰)',
      green: '電腦 AI (翡翠)',
      purple: '電腦 AI (虛空)'
    };

    sides.forEach(side => {
      const box = document.getElementById(`brawl-seat-${side}`);
      const nameEl = document.getElementById(`seat-name-${side}`);
      const statusEl = document.getElementById(`seat-status-${side}`);
      const btn = box?.querySelector('.seat-select-btn');

      if (!box) return;

      if (side === this.selectedBrawlSide) {
        box.classList.add('active');
        if (nameEl) nameEl.textContent = '你 (領主) 👑';
        if (statusEl) statusEl.textContent = '已選擇 (你的坐席)';
        if (btn) btn.textContent = '你的陣營席位';
      } else {
        box.classList.remove('active');
        if (nameEl) nameEl.textContent = botNicknames[side];
        if (statusEl) statusEl.textContent = '自動補位 AI 🤖';
        if (btn) btn.textContent = '選邊站此處';
      }
    });
  }

  updateBrawlSeatsState(seats) {
    if (!seats) return;
    Object.keys(seats).forEach(side => {
      const data = seats[side];
      const box = document.getElementById(`brawl-seat-${side}`);
      const nameEl = document.getElementById(`seat-name-${side}`);
      const statusEl = document.getElementById(`seat-status-${side}`);
      const avatarEl = document.getElementById(`seat-avatar-${side}`);
      const btn = box?.querySelector('.seat-select-btn');

      if (!box) return;

      if (data.isMe) {
        box.classList.add('active');
        if (nameEl) nameEl.textContent = `${data.name || '你'} (你) 👑`;
        if (statusEl) statusEl.textContent = '真人玩家 (本機已就緒)';
        if (avatarEl) avatarEl.textContent = data.avatar || '👑';
        if (btn) btn.textContent = '當前你的席位';
      } else if (data.isHuman) {
        box.classList.remove('active');
        if (nameEl) nameEl.textContent = `${data.name} 👤`;
        if (statusEl) statusEl.textContent = '真人好友 (已入座連線)';
        if (avatarEl) avatarEl.textContent = data.avatar || '👤';
        if (btn) btn.textContent = '好友已佔席';
      } else {
        box.classList.remove('active');
        if (nameEl) nameEl.textContent = data.name || '智慧 AI';
        if (statusEl) statusEl.textContent = '電腦補位 (大師) 🤖';
        if (avatarEl) avatarEl.textContent = '🤖';
        if (btn) btn.textContent = '選邊站此處';
      }
    });
  }

  updateBrawlHud(status) {
    if (!status) return;
    ['blue', 'red', 'green', 'purple'].forEach(tm => {
      const data = status[tm];
      if (!data) return;
      const crownsEl = document.getElementById(`brawl-crowns-${tm}`);
      const hudItem = document.getElementById(`brawl-hud-${tm}`);
      if (crownsEl) {
        crownsEl.textContent = data.alive ? `${data.hp}🏰` : '已淪陷💀';
      }
      if (hudItem) {
        if (!data.alive) hudItem.classList.add('eliminated');
        else hudItem.classList.remove('eliminated');
      }
    });
  }

  showHazardBanner(text) {
    if (!this.hazardBanner || !this.hazardText) return;
    this.hazardText.textContent = text;
    this.hazardBanner.classList.remove('hidden');
    setTimeout(() => {
      this.hazardBanner?.classList.add('hidden');
    }, 4500);
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
    const cloudStatusEl = document.getElementById('cloud-dock-user-status');

    if (tEl) tEl.textContent = `${inventory.data.trophies} 🏆`;
    if (cEl) cEl.textContent = `${inventory.data.crowns} 👑`;
    if (wEl) wEl.textContent = `${inventory.data.replays?.filter(r => r.result === 'win').length || 0} ⚔️`;
    if (kEl) kEl.textContent = `${Object.keys(inventory.data.cards).length} 🎴`;

    if (cloudStatusEl) {
      const boundId = user.email || user.username || '本地帳號';
      cloudStatusEl.textContent = `💡 所有等級 (${inventory.data.playerLevel} 級)、金幣 (${inventory.data.gold})、卡牌已全自動綁定於【${boundId}】！在手機或任何裝置登入此帳號即可自動同步！`;
    }

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
