import { sounds } from '../audio/sound.js';
import { inventory } from './inventory.js';

/**
 * 實時天梯快速自動匹配系統 (Real-time Ranked Matchmaking Engine)
 */

export const VIRTUAL_OPPONENTS = [
  { name: '【皇家戰神】亞瑟王 👑', trophies: 1350, tag: '傳奇大師', deck: ['giant', 'wizard', 'musketeer', 'knight', 'archers', 'fireball', 'dragon', 'goblins'] },
  { name: '【狂暴之刃】佐藤健 ⚡', trophies: 1220, tag: '皇家騎士', deck: ['hogrider', 'pekka', 'rage', 'skeletons', 'goblins', 'wizard', 'arrows', 'knight'] },
  { name: '【寒冰法皇】艾蜜莉 ❄️', trophies: 1480, tag: '天梯霸主', deck: ['dragon', 'freeze', 'wizard', 'inferno', 'giant', 'musketeer', 'fireball', 'archers'] },
  { name: '【重裝巨甲】泰坦 🤖', trophies: 1190, tag: '鐵壁守護', deck: ['pekka', 'goblinhut', 'musketeer', 'knight', 'fireball', 'goblins', 'archers', 'giant'] },
  { name: '【幻影神箭】羅賓漢 🏹', trophies: 1260, tag: '神射名宿', deck: ['archers', 'musketeer', 'hogrider', 'dragon', 'wizard', 'skeletons', 'fireball', 'knight'] },
  { name: '【烈火咆哮】炎龍領主 🔥', trophies: 1410, tag: '炎龍軍團', deck: ['dragon', 'wizard', 'fireball', 'giant', 'goblinhut', 'knight', 'skeletons', 'goblins'] }
];

export class MatchmakingEngine {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    // { onSearchingTick, onOpponentFound, onMatchStart, onMatchCancelled }

    this.isSearching = false;
    this.searchTimer = 0;
    this.searchInterval = null;
    this.matchFoundTimeout = null;
    this.startCountdownTimeout = null;
  }

  startSearching() {
    this.isSearching = true;
    this.searchTimer = 0;

    sounds.playTone(440, 660, 0.15, 'sine', 0.2);

    if (this.searchInterval) clearInterval(this.searchInterval);
    if (this.matchFoundTimeout) clearTimeout(this.matchFoundTimeout);
    if (this.startCountdownTimeout) clearTimeout(this.startCountdownTimeout);

    this.searchInterval = setInterval(() => {
      this.searchTimer++;
      this.callbacks.onSearchingTick?.(this.searchTimer);
    }, 1000);

    // 2.5 ~ 4.5 秒內自動鎖定最匹配的天梯選手
    const matchDelay = 2500 + Math.random() * 2000;
    this.matchFoundTimeout = setTimeout(() => {
      this.onFoundOpponent();
    }, matchDelay);
  }

  cancelSearching() {
    this.isSearching = false;
    if (this.searchInterval) clearInterval(this.searchInterval);
    if (this.matchFoundTimeout) clearTimeout(this.matchFoundTimeout);
    if (this.startCountdownTimeout) clearTimeout(this.startCountdownTimeout);

    this.callbacks.onMatchCancelled?.();
  }

  onFoundOpponent() {
    if (!this.isSearching) return;
    if (this.searchInterval) clearInterval(this.searchInterval);

    // 隨機選取一位匹配的天梯選手
    const opponent = VIRTUAL_OPPONENTS[Math.floor(Math.random() * VIRTUAL_OPPONENTS.length)];

    sounds.playVictory();
    this.callbacks.onOpponentFound?.(opponent);

    // 倒數 1.8 秒後正式切換進入戰場
    this.startCountdownTimeout = setTimeout(() => {
      this.isSearching = false;
      this.callbacks.onMatchStart?.(opponent);
    }, 1800);
  }
}
