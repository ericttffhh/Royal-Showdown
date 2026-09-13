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

  updateSelectionUI() {
    const cardElements = this.cardsHandEl?.querySelectorAll('.card-item');
    cardElements?.forEach((el) => {
      const id = el.dataset.cardId;
      const card = CARDS[id];
      if (id === this.selectedCardId) {
        el.classList.add('selected');
        if (card && this.currentElixir < card.cost) {
          el.classList.add('low-elixir');
        } else {
          el.classList.remove('low-elixir');
        }
      } else {
        el.classList.remove('selected', 'low-elixir');
      }
    });
  }

  showFloatingElixirNotice(text, x, y) {
    // 移除舊的浮動提示
    const oldToasts = document.querySelectorAll('.elixir-floating-toast');
    oldToasts.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'elixir-floating-toast';
    toast.textContent = text;
    
    const posX = (x && x > 0) ? Math.max(90, Math.min(window.innerWidth - 90, x)) : window.innerWidth / 2;
    const posY = (y && y > 0) ? Math.max(100, Math.min(window.innerHeight - 140, y - 40)) : window.innerHeight / 2;
    
    toast.style.left = `${posX}px`;
    toast.style.top = `${posY}px`;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 900);
  }

  selectCard(cardId, index, clientX = 0, clientY = 0) {
    const card = CARDS[cardId];
    if (!card) return;

    // 💡 實作卡牌預選機制 (Pre-selection Queue)：即使聖水暫時不足，也立即選中並準備部署
    this.selectedCardId = cardId;
    this.selectedCardIndex = index;
    this.dragStartPos = { x: clientX, y: clientY };
    this.draggedCardId = cardId;
    this.isDragging = false;
    this.lastCardSelectTime = Date.now();

    const isAffordableNow = this.currentElixir >= card.cost;
    if (!isAffordableNow) {
      // 聖水累積中：提供柔和預選提示音與微震
      sounds.playTone(420, 45, 0.08, 'triangle');
    } else {
      sounds.playTone(680, 45, 0.1, 'sine');
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch (e) {}

    this.updateSelectionUI();
    this.updatePlacementPreview(clientX, clientY);
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
        if (this.currentElixir < card.cost) {
          cardDiv.classList.add('low-elixir');
        }
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

      // 觸控與點擊手牌處理 (pointerdown 支援滑鼠、觸控筆與手指，停止傳遞避免觸發戰場部署)
      cardDiv.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.selectCard(cardId, index, e.clientX, e.clientY);
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

        if (id === this.selectedCardId) {
          if (isAffordable) {
            el.classList.remove('low-elixir');
          } else {
            el.classList.add('low-elixir');
          }
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
    let activeCardId = this.selectedCardId || this.draggedCardId;

    // 若未手動點選手牌，自動選取手牌中第一張聖水足夠的卡牌進行出兵
    if (!activeCardId) {
      const affordableId = this.hand.find(id => CARDS[id] && this.currentElixir >= CARDS[id].cost);
      if (affordableId) {
        activeCardId = affordableId;
      } else {
        const firstCard = this.hand[0];
        if (firstCard && CARDS[firstCard]) {
          const cost = CARDS[firstCard].cost;
          this.showFloatingElixirNotice(`💧 聖水累積中 (${Math.floor(this.currentElixir)}/${cost})`, clientX, clientY);
          sounds.playTone(200, 60, 0.1, 'sawtooth');
        }
        return false;
      }
    }

    const card = CARDS[activeCardId];
    if (!card) return false;

    // 💧 聖水不足檢查：保留預選狀態，提供明確浮動通知與視覺反饋
    if (this.currentElixir < card.cost) {
      const diff = (card.cost - this.currentElixir).toFixed(1);
      this.showFloatingElixirNotice(`💧 聖水不足 (需 ${card.cost} 滴，尚缺 ${diff} 滴)`, clientX, clientY);
      sounds.playTone(200, 60, 0.12, 'sawtooth');
      
      const elixirBar = document.getElementById('elixir-bar-container') || this.elixirFillEl?.parentElement;
      if (elixirBar) {
        elixirBar.classList.add('wobble-shake');
        setTimeout(() => elixirBar.classList.remove('wobble-shake'), 400);
      }
      return false;
    }

    const intersection = this.arena.getArenaIntersection(clientX, clientY);
    if (intersection) {
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
    // 1. 移動追蹤 (Pointer Events 全面支援滑鼠與多點觸控)
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

    // 2. 點擊 / 按下部署 (Tap-to-Deploy 即點即放 - 0ms 極速無延遲反應)
    const onArenaPress = (clientX, clientY, target) => {
      // 僅在明確點擊於手牌本體、按鈕或彈窗上時阻擋出兵；戰場所有畫布點擊 100% 直達出兵邏輯
      if (target && (target.closest('.card-item') || target.closest('.tool-btn') || target.closest('.king-power-btn') || target.closest('.battle-side-actions') || target.closest('.battle-top-bar') || target.closest('.modal-backdrop:not(.hidden)') || target.closest('.chat-panel-container'))) {
        return;
      }
      this.tryDeployAtCoordinates(clientX, clientY);
    };

    window.addEventListener('pointerdown', (e) => {
      onArenaPress(e.clientX, e.clientY, e.target);
    }, { passive: true });

    // 3. 鬆手部署 (Drag-to-Deploy 拖曳放手即出兵)
    const onRelease = (clientX, clientY, target) => {
      if (this.isDragging && this.draggedCardId) {
        const isOverCardOrTool = target && (target.closest('.card-item') || target.closest('.tool-btn'));
        if (!isOverCardOrTool) {
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

