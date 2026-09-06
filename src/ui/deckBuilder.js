import { CARDS, UPGRADE_COSTS, getCardScaledStats } from '../game/cards.js';
import { inventory } from '../game/inventory.js';
import { sounds } from '../audio/sound.js';
import confetti from 'canvas-confetti';

/**
 * 卡牌收藏、升級與 8 張自訂牌組構築系統 (Deck Builder)
 */

export class DeckBuilderUI {
  constructor(onDeckUpdated) {
    this.onDeckUpdated = onDeckUpdated;
    this.selectedActiveSlot = null;

    this.initDOM();
    this.renderAll();
  }

  initDOM() {
    this.deckSlotsContainer = document.getElementById('active-deck-slots');
    this.allCardsGrid = document.getElementById('all-cards-grid');
    this.cardDetailModal = document.getElementById('card-detail-modal');
    this.detailContent = document.getElementById('card-detail-content');

    document.getElementById('btn-close-detail')?.addEventListener('click', () => {
      this.cardDetailModal.classList.add('hidden');
    });
  }

  renderAll() {
    this.renderActiveDeck();
    this.renderAllCards();
  }

  renderActiveDeck() {
    if (!this.deckSlotsContainer) return;
    this.deckSlotsContainer.innerHTML = '';

    const currentDeck = inventory.data.deck;

    currentDeck.forEach((cardId, slotIndex) => {
      const card = CARDS[cardId];
      const cardData = inventory.data.cards[cardId] || { level: 1, count: 0 };
      if (!card) return;

      const slotEl = document.createElement('div');
      slotEl.className = `deck-slot-card rarity-${card.rarity}`;
      if (this.selectedActiveSlot === slotIndex) {
        slotEl.classList.add('selected');
      }

      slotEl.innerHTML = `
        <div class="slot-elixir">💧 ${card.cost}</div>
        <div class="slot-icon">${card.icon}</div>
        <div class="slot-name">${card.name}</div>
        <div class="slot-level">Lv.${cardData.level}</div>
      `;

      slotEl.addEventListener('click', () => {
        if (this.selectedActiveSlot === slotIndex) {
          this.selectedActiveSlot = null;
        } else {
          this.selectedActiveSlot = slotIndex;
        }
        this.renderActiveDeck();
      });

      this.deckSlotsContainer.appendChild(slotEl);
    });
  }

  renderAllCards() {
    if (!this.allCardsGrid) return;
    this.allCardsGrid.innerHTML = '';

    const allCardIds = Object.keys(CARDS);

    allCardIds.forEach(cardId => {
      const card = CARDS[cardId];
      const cardData = inventory.data.cards[cardId] || { level: 1, count: 0 };
      const nextLevel = cardData.level + 1;
      const upgradeReq = UPGRADE_COSTS.find(c => c.level === nextLevel);
      const inDeck = inventory.data.deck.includes(cardId);

      const canUpgrade = inventory.canUpgrade(cardId);

      const cardEl = document.createElement('div');
      const rawCount = (typeof cardData.count === 'number' && Number.isFinite(cardData.count)) ? Math.floor(cardData.count) : 0;
      const cleanCount = Math.min(9999, Math.max(0, rawCount));
      const progressPct = upgradeReq ? Math.min(100, (cleanCount / upgradeReq.cardsNeeded) * 100) : 100;

      cardEl.innerHTML = `
        <div class="coll-elixir">💧 ${card.cost}</div>
        ${inDeck ? '<div class="coll-tag">出戰中</div>' : ''}
        <div class="coll-icon">${card.icon}</div>
        <div class="coll-name">${card.name}</div>
        <div class="coll-level">Lv.${cardData.level}</div>

        <!-- Shard Progress Bar -->
        <div class="coll-progress-box">
          <div class="coll-progress-fill ${canUpgrade ? 'ready' : ''}" style="width: ${progressPct}%"></div>
          <span class="coll-progress-text">${upgradeReq ? `${cleanCount}/${upgradeReq.cardsNeeded}` : 'MAX'}</span>
        </div>

        <!-- Upgrade Button if ready -->
        ${canUpgrade ? `<button class="coll-upgrade-btn" data-card="${cardId}">⚡ 升級 (${upgradeReq.goldNeeded}🪙)</button>` : ''}
      `;

      // Click card to inspect or equip into selected active slot
      cardEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('coll-upgrade-btn')) {
          this.handleUpgrade(cardId);
          return;
        }

        if (this.selectedActiveSlot !== null) {
          // Equip card into selected active deck slot!
          inventory.setDeckSlot(this.selectedActiveSlot, cardId);
          this.selectedActiveSlot = null;
          sounds.playTone(600, 900, 0.15, 'triangle', 0.3);
          this.renderAll();
          this.onDeckUpdated?.();
        } else {
          this.showCardDetail(cardId);
        }
      });

      this.allCardsGrid.appendChild(cardEl);
    });
  }

  handleUpgrade(cardId) {
    const result = inventory.upgradeCard(cardId);
    if (result) {
      sounds.playVictory();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      this.renderAll();
      this.onDeckUpdated?.();
    }
  }

  showCardDetail(cardId) {
    const card = CARDS[cardId];
    const cardData = inventory.data.cards[cardId] || { level: 1, count: 0 };
    const scaled = getCardScaledStats(cardId, cardData.level);

    let statsHtml = '';
    if (card.type === 'troop') {
      statsHtml = `
        <div class="stat-row"><span>生命值:</span> <b>${scaled.hp}</b></div>
        <div class="stat-row"><span>每秒傷害:</span> <b>${Math.round(scaled.damage / card.hitSpeed)}</b></div>
        <div class="stat-row"><span>單次傷害:</span> <b>${scaled.damage}</b></div>
        <div class="stat-row"><span>攻擊速度:</span> <b>${card.hitSpeed} 秒</b></div>
        <div class="stat-row"><span>攻擊目標:</span> <b>${card.targets === 'buildings' ? '只攻建築' : (card.targets === 'all' ? '空中與地面' : '地面')}</b></div>
        <div class="stat-row"><span>攻擊射程:</span> <b>${card.range > 1 ? card.range + ' 格' : '近戰'}</b></div>
      `;
    } else if (card.type === 'spell') {
      statsHtml = `
        <div class="stat-row"><span>全額傷害:</span> <b>${scaled.damage}</b></div>
        <div class="stat-row"><span>皇家塔傷害:</span> <b>${scaled.crownTowerDamage}</b></div>
        <div class="stat-row"><span>作用範圍:</span> <b>${card.radius} 格半徑</b></div>
      `;
    } else if (card.type === 'building') {
      statsHtml = `
        <div class="stat-row"><span>生命值:</span> <b>${scaled.hp}</b></div>
        <div class="stat-row"><span>初始秒傷:</span> <b>${scaled.damageInitial}</b></div>
        <div class="stat-row"><span>最高極限秒傷:</span> <b>${scaled.damageMax}</b></div>
        <div class="stat-row"><span>持續時間:</span> <b>${card.lifetime} 秒</b></div>
      `;
    }

    this.detailContent.innerHTML = `
      <div class="detail-header rarity-${card.rarity}">
        <div class="detail-icon">${card.icon}</div>
        <div class="detail-info">
          <div class="detail-name">${card.name} <span class="badge-level">Lv.${cardData.level}</span></div>
          <div class="detail-type">💧 ${card.cost} 聖水 · ${card.rarity.toUpperCase()}</div>
        </div>
      </div>
      <div class="detail-stats-grid">
        ${statsHtml}
      </div>
      <div class="detail-desc">${card.description}</div>
    `;

    this.cardDetailModal.classList.remove('hidden');
  }
}
