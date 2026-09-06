import { CARDS } from '../game/cards.js';
import { inventory } from '../game/inventory.js';

/**
 * 出戰牌組與聖水槽 HUD 管理器 (支援玩家自訂 8 張卡組)
 */

export class DeckBarUI {
  constructor(arena, onCardPlaced) {
    this.arena = arena;
    this.onCardPlaced = onCardPlaced;

    this.deckQueue = [];
    this.hand = [];
    this.nextCard = null;
    this.selectedCardId = null;

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
    // 獲取玩家自訂的 8 張出戰牌組 (或 Draft 模式挑選出的牌組)
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

      if (this.selectedCardId === cardId) {
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
    if (this.selectedCardId === cardId) {
      this.selectedCardId = null;
      this.arena.setDeploymentVisual(false);
    } else {
      this.selectedCardId = cardId;
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

    container.addEventListener('pointerdown', (e) => {
      if (!this.selectedCardId) return;

      const intersection = this.arena.getArenaIntersection(e.clientX, e.clientY);
      if (intersection) {
        const card = CARDS[this.selectedCardId];
        const isSpell = card?.type === 'spell';
        const canDeploy = this.onCardPlaced(this.selectedCardId, intersection, isSpell);

        if (canDeploy) {
          this.cycleCard(this.selectedCardId);
          this.selectedCardId = null;
          this.arena.setDeploymentVisual(false);
          this.renderHand();
        }
      }
    });

    container.addEventListener('pointermove', (e) => {
      if (!this.selectedCardId) return;

      const intersection = this.arena.getArenaIntersection(e.clientX, e.clientY);
      if (intersection) {
        const isBlueSide = intersection.z > 0;
        const card = CARDS[this.selectedCardId];
        const isValid = card?.type === 'spell' || isBlueSide;
        this.arena.setDeploymentVisual(true, isValid);
      }
    });
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
    this.arena.setDeploymentVisual(false);
    this.initDeck();
  }
}
