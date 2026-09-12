import { CARDS } from '../game/cards.js';
import { inventory } from '../game/inventory.js';

/**
 * 出戰牌組與聖水槽 HUD 管理器 (支援玩家自訂 8 張卡組、拖曳出兵與秒速點擊雙模式)
 */

export class DeckBarUI {
  constructor(arena, onCardPlaced, canDeployCheck = null) {
    this.arena = arena;
    this.onCardPlaced = onCardPlaced;
    this.canDeployCheck = canDeployCheck;

    this.deckQueue = [];
    this.hand = [];
    this.nextCard = null;
    this.selectedCardId = null;
    this.isDragging = false;
    this.draggedCardId = null;

    // DOM Elements
    this.cardsHandEl = document.getElementById('cards-hand');
    this.nextCardEl = document.getElementById('next-card-display');
    this.elixirFillEl = document.getElementById('elixir-fill');
    this.elixirTextEl = document.getElementById('elixir-text');

    this.currentElixir = 5.0;

    this.initDeck();
    this.setupArenaInteractions();
  }

  initDeck(customDeck = null) {
    const playerDeck = customDeck ? [...customDeck] : [...inventory.data.deck];
    const shuffled = playerDeck.sort(() => Math.random() - 0.5);

    this.hand = shuffled.slice(0, 4);
    this.nextCard = shuffled[4];
    this.deckQueue = shuffled.slice(5);

    this.renderHand();
    this.renderNextCard();
  }

  setCustomDeck(deck) {
    this.selectedCardId = null;
    this.arena.setDeploymentVisual(false);
    this.initDeck(deck);
  }

  renderHand() {
    if (!this.cardsHandEl) return;
    this.cardsHandEl.innerHTML = '';

    this.hand.forEach((cardId, index) => {
      const card = CARDS[cardId];
      if (!card) return;

      const cardDiv = document.createElement('div');
      cardDiv.className = `card-item rarity-${card.rarity}`;
      cardDiv.dataset.cardId = cardId;
      cardDiv.dataset.index = index;

      if (this.selectedCardId === cardId || this.draggedCardId === cardId) {
        cardDiv.classList.add('selected');
      }

      const isAffordable = this.currentElixir >= card.cost;
      if (!isAffordable) {
        cardDiv.classList.add('disabled');
      }

      cardDiv.innerHTML = `
        <div class="card-elixir-cost">${card.cost}</div>
        <div class="card-avatar">${card.icon}</div>
        <div class="card-name">${card.name}</div>
      `;

      // 1. 點擊選取卡牌 (Tap-to-Select)
      cardDiv.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.selectCard(cardId);
        this.isDragging = true;
        this.draggedCardId = cardId;
      });

      cardDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectCard(cardId);
      });

      this.cardsHandEl.appendChild(cardDiv);
    });
  }

  renderNextCard() {
    const card = CARDS[this.nextCard];
    if (!card || !this.nextCardEl) return;

    this.nextCardEl.className = `card-item mini rarity-${card.rarity}`;
    this.nextCardEl.innerHTML = `
      <div class="card-elixir-cost">${card.cost}</div>
      <div class="card-avatar">${card.icon}</div>
      <div class="card-name">${card.name}</div>
    `;
  }

  selectCard(cardId) {
    if (this.selectedCardId === cardId && !this.isDragging) {
      this.selectedCardId = null;
      this.arena.setDeploymentVisual(false);
    } else {
      this.selectedCardId = cardId;
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(12);
        }
      } catch (e) {}
      this.arena.setDeploymentVisual(true, true);
    }
    this.renderHand();
  }

  updateElixir(elixir) {
    this.currentElixir = elixir;
    const rounded = Math.floor(elixir);
    const pct = Math.min(100, (elixir / 10) * 100);

    if (this.elixirFillEl) this.elixirFillEl.style.width = `${pct}%`;
    if (this.elixirTextEl) this.elixirTextEl.textContent = rounded;

    const cardElements = this.cardsHandEl?.querySelectorAll('.card-item');
    cardElements?.forEach(el => {
      const id = el.dataset.cardId;
      const card = CARDS[id];
      if (card) {
        if (elixir >= card.cost) {
          el.classList.remove('disabled');
        } else {
          el.classList.add('disabled');
        }
      }
    });
  }

  setupArenaInteractions() {
    const container = this.arena.container;
    if (!container) return;

    const handlePointerMove = (clientX, clientY) => {
      const activeCardId = this.selectedCardId || this.draggedCardId;
      if (!activeCardId) return;

      const intersection = this.arena.getArenaIntersection(clientX, clientY);
      if (intersection) {
        const card = CARDS[activeCardId];
        const isSpell = card?.type === 'spell';
        const isBlueSide = intersection.z >= -0.2;
        const isValid = this.canDeployCheck
          ? this.canDeployCheck(intersection.x, intersection.z, isSpell)
          : (isSpell || isBlueSide);
        this.arena.setDeploymentVisual(true, isValid, intersection, card?.radius || 1.0);
      }
    };

    const tryDeployAt = (clientX, clientY) => {
      const activeCardId = this.selectedCardId || this.draggedCardId;
      if (!activeCardId) return false;

      // 如果點擊是在手牌 HUD 區域內，不執行部署
      const hudEl = document.getElementById('hud');
      if (hudEl) {
        const hudRect = hudEl.getBoundingClientRect();
        if (clientY >= hudRect.top && clientY <= hudRect.bottom && clientX >= hudRect.left && clientX <= hudRect.right) {
          return false;
        }
      }

      const intersection = this.arena.getArenaIntersection(clientX, clientY);
      if (intersection) {
        const card = CARDS[activeCardId];
        const isSpell = card?.type === 'spell';
        const canDeploy = this.onCardPlaced(activeCardId, intersection, isSpell);

        if (canDeploy) {
          try {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(18);
            }
          } catch (err) {}
          this.cycleCard(activeCardId);
          this.selectedCardId = null;
          this.draggedCardId = null;
          this.isDragging = false;
          this.arena.setDeploymentVisual(false);
          this.renderHand();
          return true;
        }
      }
      return false;
    };

    // 1. 戰場點擊與按下監聽
    container.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#hud') || e.target.closest('#cards-hand')) return;
      if (this.selectedCardId) {
        tryDeployAt(e.clientX, e.clientY);
      }
    }, { passive: true });

    // 2. 戰場鬆開監聽 (支援拖曳放手即出兵與點擊放手)
    window.addEventListener('pointerup', (e) => {
      if (this.isDragging && this.draggedCardId) {
        const deployed = tryDeployAt(e.clientX, e.clientY);
        this.isDragging = false;
        this.draggedCardId = null;
        if (!deployed && !this.selectedCardId) {
          this.arena.setDeploymentVisual(false);
        }
      }
    }, { passive: true });

    // 3. 移動監聽
    window.addEventListener('pointermove', (e) => {
      if (this.selectedCardId || this.isDragging) {
        handlePointerMove(e.clientX, e.clientY);
      }
    }, { passive: true });

    // 4. 手機觸控事件優化
    window.addEventListener('touchmove', (e) => {
      if ((this.selectedCardId || this.isDragging) && e.touches && e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.isDragging && this.draggedCardId && e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const deployed = tryDeployAt(touch.clientX, touch.clientY);
        this.isDragging = false;
        this.draggedCardId = null;
        if (!deployed && !this.selectedCardId) {
          this.arena.setDeploymentVisual(false);
        }
      }
    }, { passive: true });
  }

  cycleCard(usedCardId) {
    const handIndex = this.hand.indexOf(usedCardId);
    if (handIndex === -1) return;

    this.deckQueue.push(usedCardId);
    this.hand[handIndex] = this.nextCard;
    this.nextCard = this.deckQueue.shift();

    this.renderHand();
    this.renderNextCard();
  }

  reset() {
    this.selectedCardId = null;
    this.draggedCardId = null;
    this.isDragging = false;
    this.arena.setDeploymentVisual(false);
    this.initDeck();
  }
}
