import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { CARDS, CHESTS } from '../game/cards.js';
import { inventory } from '../game/inventory.js';
import { ModelFactory } from '../three/models.js';
import { sounds } from '../audio/sound.js';

/**
 * 3D 皇家寶箱開箱抽卡系統 (Chest Gacha UI - Enhanced)
 */

export class GachaManager {
  constructor(container, onFinished) {
    this.container = container;
    this.onFinished = onFinished;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.chestModel = null;
    this.lidHinge = null;
    this.animId = null;

    this.rewards = null;
    this.currentRewardIndex = 0;
    this.isOpened = false;

    this.init3DStage();
    this.initDOM();
  }

  init3DStage() {
    this.stageEl = document.getElementById('gacha-3d-stage');
    if (!this.stageEl) return;

    const width = this.stageEl.clientWidth || window.innerWidth;
    const height = this.stageEl.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 2.5, 6.5);
    this.camera.lookAt(0, 0.8, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.stageEl.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambient);

    const goldSpot = new THREE.SpotLight(0xffe082, 4.0, 25, Math.PI / 4, 0.5);
    goldSpot.position.set(0, 8, 4);
    this.scene.add(goldSpot);

    const rimLight = new THREE.PointLight(0x00ffff, 2.5, 15);
    rimLight.position.set(0, -2, -3);
    this.scene.add(rimLight);
  }

  resizeStage() {
    if (!this.stageEl || !this.renderer || !this.camera) return;
    const width = this.stageEl.clientWidth || window.innerWidth;
    const height = this.stageEl.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  initDOM() {
    this.modal = document.getElementById('gacha-modal');
    this.cardRevealContainer = document.getElementById('gacha-card-reveal');
    this.tapHint = document.getElementById('gacha-tap-hint');

    this.stageEl?.addEventListener('click', () => {
      if (!this.isOpened) {
        this.openChest();
      } else {
        this.nextReward();
      }
    });

    this.cardRevealContainer?.addEventListener('click', () => {
      this.nextReward();
    });
  }

  startOpening(chestId, isFree = false) {
    const result = inventory.openChest(chestId, isFree);
    if (!result || result.error) {
      const msg = result?.error || '寶箱開啟失敗！';
      if (window.gameMenu?.showAnnouncement) {
        window.gameMenu.showAnnouncement(`⚠️ ${msg}`);
      } else {
        alert(msg);
      }
      sounds.playTone(220, 150, 0.2, 'sawtooth');
      return;
    }

    this.rewards = [
      { type: 'gold', count: result.gold, name: '皇家金幣', icon: '🪙' },
      ...(result.gems > 0 ? [{ type: 'gems', count: result.gems, name: '璀璨寶石', icon: '💎' }] : []),
      ...result.cardRewards.map(cr => ({
        type: 'card',
        cardId: cr.cardId,
        count: cr.count,
        rarity: cr.rarity,
        card: CARDS[cr.cardId] || { name: '神秘碎片', rarity: 'common', cost: 3, icon: '⚔️', description: '' }
      }))
    ];

    this.currentRewardIndex = -1;
    this.isOpened = false;

    // Show Modal
    this.modal.classList.remove('hidden');
    this.cardRevealContainer.classList.add('hidden');
    this.tapHint.textContent = '點擊寶箱開啟！';
    this.tapHint.classList.remove('hidden');

    this.resizeStage();

    // Build 3D Chest
    if (this.chestModel) this.scene.remove(this.chestModel);
    this.chestModel = ModelFactory.createChestModel(chestId);
    this.lidHinge = this.chestModel.userData.lidHinge;
    this.scene.add(this.chestModel);

    sounds.playTone(400, 800, 0.3, 'sine', 0.2);

    this.animate();
  }

  openChest() {
    this.isOpened = true;
    this.tapHint.textContent = '點擊抽取下一張卡牌！';

    sounds.playExplosion();
    sounds.playVictory();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 }
    });

    let lidRot = 0;
    const openAnim = () => {
      lidRot += 0.08;
      if (this.lidHinge) {
        this.lidHinge.rotation.x = -Math.min(Math.PI * 0.7, lidRot);
      }
      if (lidRot < Math.PI * 0.7) {
        requestAnimationFrame(openAnim);
      } else {
        this.nextReward();
      }
    };
    openAnim();
  }

  nextReward() {
    this.currentRewardIndex++;
    if (this.currentRewardIndex >= this.rewards.length) {
      this.closeModal();
      return;
    }

    const item = this.rewards[this.currentRewardIndex];
    this.showRewardCard(item);
  }

  showRewardCard(item) {
    this.cardRevealContainer.classList.remove('hidden');
    sounds.playDeploy();

    if (item.type === 'gold' || item.type === 'gems') {
      this.cardRevealContainer.innerHTML = `
        <div class="reveal-card resource-card animate-pop">
          <div class="reveal-badge">資源收穫</div>
          <div class="reveal-icon">${item.icon}</div>
          <div class="reveal-name">${item.name}</div>
          <div class="reveal-count">+${item.count}</div>
        </div>
      `;
    } else if (item.type === 'card') {
      const card = item.card;
      const isLegendary = item.rarity === 'legendary' || item.rarity === 'epic';

      if (isLegendary) {
        sounds.playDoubleElixir();
        confetti({
          particleCount: 60,
          spread: 60,
          colors: ['#00ffc4', '#c42eff', '#ffbe24']
        });
      }

      this.cardRevealContainer.innerHTML = `
        <div class="reveal-card rarity-${card.rarity} animate-pop">
          <div class="reveal-badge">${card.rarity === 'epic' ? '🌟 史詩卡牌' : (card.rarity === 'legendary' ? '💎 傳奇卡牌' : '⚔️ 兵團碎片')}</div>
          <div class="reveal-elixir">💧 ${card.cost}</div>
          <div class="reveal-icon">${card.icon}</div>
          <div class="reveal-name">${card.name}</div>
          <div class="reveal-count">+${item.count} 張碎片</div>
          <div class="reveal-desc">${card.description}</div>
        </div>
      `;
    }
  }

  closeModal() {
    this.modal.classList.add('hidden');
    if (this.animId) cancelAnimationFrame(this.animId);
    this.onFinished?.();
  }

  animate() {
    if (this.modal.classList.contains('hidden')) return;
    this.animId = requestAnimationFrame(() => this.animate());

    if (this.chestModel && !this.isOpened) {
      const t = Date.now() * 0.003;
      this.chestModel.rotation.y = Math.sin(t) * 0.2;
      this.chestModel.position.y = Math.sin(t * 2) * 0.1;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
