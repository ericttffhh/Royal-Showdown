import { CARDS, CARD_EVOLUTIONS } from '../game/cards.js';
import { inventory } from '../game/inventory.js';
import { sounds } from '../audio/sound.js';

/**
 * 出戰牌組與聖水槽 HUD 管理器 (支援 100% 零漏點 Tap-to-Deploy 與 Drag-to-Deploy 雙模式、卡牌覺醒進化)
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
    this.selectedCardIndex = null;
    this.isDragging = false;
    this.draggedCardId = null;
    this.lastCardSelectTime = 0;

    // ⚡ 卡牌覺醒輪次計數 (Evolution Cycles)
    this.evolutionCycles = {};

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
    this.selectedCardIndex = null;
    this.arena.setDeploymentVisual(false);
    this.initDeck(deck);
  }

  getEvoInfo(cardId) {
    const evoEntry = CARD_EVOLUTIONS[cardId];
    if (!evoEntry) return null;
    const currentCycle = this.evolutionCycles[cardId] || 0;
    const isEvolved = currentCycle >= evoEntry.cycleNeeded;
    return {
      evo: evoEntry,
      currentCycle,
      isEvolved,
      cycleNeeded: evoEntry.cycleNeeded
    };
  }

  renderHand() {
    if (!this.cardsHandEl) return;
    this.cardsHandEl.innerHTML = '';

    this.hand.forEach((cardId, index) => {
      const card = CARDS[cardId];
      if (!card) return;

      const evoInfo = this.getEvoInfo(cardId);
      const isEvoReady = evoInfo && evoInfo.isEvolved;

      const cardDiv = document.createElement('div');
      cardDiv.className = `card-item rarity-${card.rarity} ${isEvoReady ? 'card-evolved' : ''}`;
      cardDiv.dataset.cardId = cardId;
      cardDiv.dataset.index = index;

      if (this.selectedCardId === cardId || this.draggedCardId === cardId) {
        cardDiv.classList.add('selected');
      }

      const isAffordable = this.currentElixir >= card.cost;
      if (!isAffordable) {
        cardDiv.classList.add('disabled');
      }

      let evoBadgeHtml = '';
      if (evoInfo) {
        evoBadgeHtml = `<div class="evo-shard-badge ${isEvoReady ? 'ready' : ''}">⚡ ${evoInfo.currentCycle}/${evoInfo.cycleNeeded}</div>`;
      }

      cardDiv.innerHTML = `
        <div class="card-elixir-cost">${card.cost}</div>
        ${evoBadgeHtml}
        <div class="card-avatar">${isEvoReady ? evoInfo.evo.icon : card.icon}</div>
        <div class="card-name">${isEvoReady ? evoInfo.evo.name : card.name}</div>
      `;

      // 觸控與點擊手牌處理
      const onCardStart = (clientX, clientY) => {
        const now = Date.now();
        if (this.selectedCardId === cardId && now - this.lastCardSelectTime > 350) {
          // 再次點擊已選中的卡牌：取消選中
          this.selectedCardId = null;
          this.selectedCardIndex = null;
          this.arena.setDeploymentVisual(false);
          this.renderHand();
          return;
        }

        const isAffordableNow = this.currentElixir >= card.cost;
        if (!isAffordableNow) {
          // 聖水不足：Q 彈搖晃與警示音
          sounds.playTone(200, 60, 0.12, 'sawtooth');
          cardDiv.classList.add('wobble-shake');
          setTimeout(() => cardDiv.classList.remove('wobble-shake'), 400);
          return;
        }

        // 選中該卡牌
        this.selectedCardId = cardId;
        this.selectedCardIndex = index;
        this.dragStartPos = { x: clientX, y: clientY };
        this.draggedCardId = cardId;
        this.isDragging = false;
        this.lastCardSelectTime = now;

        sounds.playTone(680, 45, 0.1, 'sine');
        try {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(12);
          }
        } catch (e) {}

        this.renderHand();
        this.updatePlacementPreview(clientX, clientY);
      };

      cardDiv.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        onCardStart(e.clientX, e.clientY);
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
        const isAffordable = this.currentElixir >= card.cost;
        if (isAffordable) {
          el.classList.remove('disabled');
        } else {
          el.classList.add('disabled');
        }
      }
    });
  }

  updatePlacementPreview(clientX, clientY) {
    const activeCardId = this.selectedCardId || this.draggedCardId;
    if (!activeCardId) {
      this.arena.setDeploymentVisual(false);
      return;
    }

    const intersection = this.arena.getArenaIntersection(clientX, clientY);
    if (intersection) {
      const card = CARDS[activeCardId];
      if (card) {
        const isSpell = card?.type === 'spell';
        const isBlueSide = intersection.z >= -0.5;
        const isValid = this.canDeployCheck
          ? this.canDeployCheck(intersection.x, intersection.z, isSpell)
          : (isSpell || isBlueSide);
        this.arena.setDeploymentVisual(true, isValid, intersection, card?.radius || 1.0);
        return;
      }
    }
    this.arena.setDeploymentVisual(true, true);
  }

  tryDeployAtCoordinates(clientX, clientY) {
    const activeCardId = this.selectedCardId || this.draggedCardId;
    if (!activeCardId) return false;

    // 檢查點擊是否落在手牌 HUD 或頂部導航上
    const dockEl = document.querySelector('.battle-dock');
    if (dockEl) {
      const dockRect = dockEl.getBoundingClientRect();
      if (clientY >= dockRect.top && clientY <= dockRect.bottom && clientX >= dockRect.left && clientX <= dockRect.right) {
        return false;
      }
    }

    const topBarEl = document.querySelector('.battle-top-bar');
    if (topBarEl && !topBarEl.classList.contains('hidden')) {
      const topRect = topBarEl.getBoundingClientRect();
      if (clientY >= topRect.top && clientY <= topRect.bottom && clientX >= topRect.left && clientX <= topRect.right) {
        return false;
      }
    }

    const intersection = this.arena.getArenaIntersection(clientX, clientY);
    if (intersection) {
      const card = CARDS[activeCardId];
      const isSpell = card?.type === 'spell';

      const success = this.onCardPlaced(activeCardId, intersection, isSpell);
      if (success) {
        try {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(18);
          }
        } catch (err) {}

        this.cycleCard(activeCardId);
        this.selectedCardId = null;
        this.selectedCardIndex = null;
        this.draggedCardId = null;
        this.isDragging = false;
        this.dragStartPos = null;
        this.arena.setDeploymentVisual(false);
        this.renderHand();
        return true;
      }
    }
    return false;
  }

  setupArenaInteractions() {
    const container = this.arena.container || document.getElementById('canvas-container');

    // 1. 移動追蹤 (Pointer & Touch)
    const onMove = (clientX, clientY) => {
      if (this.draggedCardId && this.dragStartPos) {
        const dist = Math.hypot(clientX - this.dragStartPos.x, clientY - this.dragStartPos.y);
        if (dist > 12) {
          this.isDragging = true;
        }
      }
      if (this.selectedCardId || this.isDragging) {
        this.updatePlacementPreview(clientX, clientY);
      }
    };

    window.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY), { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    // 2. 點擊 / 按下部署 (Tap-to-Deploy 即點即放)
    let lastDeployTapTime = 0;
    const onArenaPress = (clientX, clientY, target) => {
      if (!this.selectedCardId) return;
      const now = Date.now();
      if (now - lastDeployTapTime < 60) return; // Debounce rapid multi-touch

      if (target && (target.closest('.battle-dock') || target.closest('.battle-side-actions') || target.closest('.battle-top-bar') || target.closest('.modal-backdrop:not(.hidden)'))) {
        return;
      }
      lastDeployTapTime = now;
      this.tryDeployAtCoordinates(clientX, clientY);
    };

    window.addEventListener('pointerdown', (e) => {
      if (this.selectedCardId) {
        onArenaPress(e.clientX, e.clientY, e.target);
      }
    }, { passive: true });

    window.addEventListener('touchstart', (e) => {
      if (this.selectedCardId && e.touches && e.touches.length > 0) {
        const t = e.touches[0];
        onArenaPress(t.clientX, t.clientY, t.target || e.target);
      }
    }, { passive: true });

    // 3. 鬆手部署 (Drag-to-Deploy 拖曳放手即出兵)
    const onRelease = (clientX, clientY, target) => {
      if (this.isDragging && this.draggedCardId) {
        const isOverDock = target && target.closest('.battle-dock');
        if (!isOverDock) {
          this.tryDeployAtCoordinates(clientX, clientY);
        }
      }
      this.isDragging = false;
      this.draggedCardId = null;
      this.dragStartPos = null;
      if (!this.selectedCardId) {
        this.arena.setDeploymentVisual(false);
      }
    };

    window.addEventListener('pointerup', (e) => onRelease(e.clientX, e.clientY, e.target), { passive: true });
    window.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        const t = e.changedTouches[0];
        onRelease(t.clientX, t.clientY, document.elementFromPoint(t.clientX, t.clientY));
      }
    }, { passive: true });
  }

  cycleCard(usedCardId) {
    const handIndex = this.hand.indexOf(usedCardId);
    if (handIndex === -1) return;

    // ⚡ 覺醒進化輪次流轉
    const evoEntry = CARD_EVOLUTIONS[usedCardId];
    if (evoEntry) {
      const currentCycle = this.evolutionCycles[usedCardId] || 0;
      if (currentCycle >= evoEntry.cycleNeeded) {
        // 已釋放覺醒形態，重置回 0
        this.evolutionCycles[usedCardId] = 0;
      } else {
        // 累積 1 輪
        this.evolutionCycles[usedCardId] = currentCycle + 1;
        if (this.evolutionCycles[usedCardId] >= evoEntry.cycleNeeded) {
          sounds.playEvoTrigger();
        }
      }
    }

    this.deckQueue.push(usedCardId);
    this.hand[handIndex] = this.nextCard;
    this.nextCard = this.deckQueue.shift();

    this.renderHand();
    this.renderNextCard();
  }

  reset() {
    this.selectedCardId = null;
    this.selectedCardIndex = null;
    this.draggedCardId = null;
    this.isDragging = false;
    this.evolutionCycles = {};
    this.arena.setDeploymentVisual(false);
    this.initDeck();
  }
}

