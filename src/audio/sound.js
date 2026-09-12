/**
 * Web Audio API Sound Synthesizer & Royal Background Music Engine
 * Zero-dependency, instantaneous, rich orchestral chords and dynamic battle march
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;

    this.currentBgm = null; // 'lobby' | 'battle' | null
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.bgmTempo = 120; // BPM
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.68, this.ctx.currentTime); // Louder default volume
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.48, this.ctx.currentTime); // Richer, louder BGM
      this.bgmGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.ensureContext();
    if (this.masterGain && this.ctx) {
      const v = Math.max(0, Math.min(1, val));
      this.masterGain.gain.setValueAtTime(v, this.ctx.currentTime);
    }
  }

  setBgmVolume(val) {
    this.ensureContext();
    if (this.bgmGain && this.ctx) {
      const v = Math.max(0, Math.min(1, val));
      this.bgmGain.gain.setValueAtTime(v, this.ctx.currentTime);
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.enabled ? 0.68 : 0, this.ctx.currentTime);
    }
    return this.enabled;
  }

  // -------------------------------------------------------------
  // DYNAMIC ROYAL BACKGROUND MUSIC (BGM)
  // -------------------------------------------------------------

  // -------------------------------------------------------------
  // DYNAMIC ROYAL BACKGROUND MUSIC (BGM)
  // -------------------------------------------------------------

  startLobbyBGM() {
    this.ensureContext();
    if (this.currentBgm === 'lobby') return;
    this.stopBGM();
    this.currentBgm = 'lobby';
    this.bgmTempo = 112;
    this.bgmStep = 0;
    this.scheduleNextBgmBeat();
  }

  startBattleBGM(isDoubleElixir = false) {
    this.ensureContext();
    this.stopBGM();
    this.currentBgm = 'battle';
    this.bgmTempo = isDoubleElixir ? 148 : 128;
    this.bgmStep = 0;
    this.scheduleNextBgmBeat();
  }

  setDoubleElixirTempo() {
    if (this.currentBgm === 'battle') {
      this.bgmTempo = 152;
    }
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.currentBgm = null;
  }

  scheduleNextBgmBeat() {
    if (!this.currentBgm || !this.enabled || !this.ctx) return;

    const beatInterval = (60 / this.bgmTempo) * 1000 / 2; // 8th notes
    this.playBgmStep(this.currentBgm, this.bgmStep);

    this.bgmStep = (this.bgmStep + 1) % 32;

    this.bgmTimer = setTimeout(() => {
      this.scheduleNextBgmBeat();
    }, beatInterval);
  }

  playBgmStep(type, step) {
    if (!this.enabled || !this.ctx) return;

    if (type === 'lobby') {
      // Majestic Royal Theme with Chordal Harmonies (Key of C Major / A Minor)
      const bassNotes = [130.81, 0, 130.81, 0, 164.81, 0, 196.00, 0, 174.61, 0, 174.61, 0, 196.00, 0, 130.81, 0];
      const melodyNotes = [
        523.25, 0, 659.25, 0, 783.99, 880.0, 783.99, 0,
        659.25, 0, 587.33, 0, 523.25, 587.33, 659.25, 0,
        698.46, 0, 783.99, 0, 880.0, 0, 1046.5, 0,
        987.77, 0, 880.0, 0, 783.99, 659.25, 523.25, 0
      ];
      const harmonyNotes = [
        261.63, 0, 329.63, 0, 392.00, 0, 392.00, 0,
        329.63, 0, 293.66, 0, 261.63, 293.66, 329.63, 0,
        349.23, 0, 392.00, 0, 440.00, 0, 523.25, 0,
        493.88, 0, 440.00, 0, 392.00, 329.63, 261.63, 0
      ];

      const bassFreq = bassNotes[step % 16];
      if (bassFreq > 0) {
        this.playSynthesizedNote(bassFreq, 0.28, 'sawtooth', 0.09, this.bgmGain);
      }

      const melFreq = melodyNotes[step % 32];
      if (melFreq > 0) {
        this.playSynthesizedNote(melFreq, 0.22, 'triangle', 0.14, this.bgmGain);
      }

      const harmFreq = harmonyNotes[step % 32];
      if (harmFreq > 0 && step % 2 === 0) {
        this.playSynthesizedNote(harmFreq, 0.35, 'sine', 0.08, this.bgmGain);
      }

      // Soft Snare/Drum tap on beats 4, 12, 20, 28
      if (step % 8 === 4) {
        this.playDrumBeat('snare', 0.06);
      } else if (step % 8 === 0) {
        this.playDrumBeat('kick', 0.09);
      }
    } else if (type === 'battle') {
      // Intense Clash Royale Battle March (D Minor / F Major)
      const bassLine = [
        146.83, 146.83, 146.83, 0, 174.61, 174.61, 196.00, 0,
        146.83, 146.83, 146.83, 0, 220.00, 196.00, 174.61, 0
      ];

      const melodyLine = [
        587.33, 0, 587.33, 659.25, 698.46, 0, 587.33, 0,
        880.00, 0, 783.99, 0, 698.46, 659.25, 587.33, 0,
        698.46, 0, 783.99, 0, 880.00, 0, 1046.5, 0,
        1174.66, 0, 1046.5, 880.0, 783.99, 698.46, 587.33, 0
      ];

      const brassHarmonies = [
        293.66, 0, 293.66, 0, 349.23, 0, 293.66, 0,
        440.00, 0, 392.00, 0, 349.23, 0, 293.66, 0
      ];

      const bass = bassLine[step % 16];
      if (bass > 0) {
        this.playSynthesizedNote(bass, 0.2, 'sawtooth', 0.13, this.bgmGain);
      }

      const mel = melodyLine[step % 32];
      if (mel > 0) {
        this.playSynthesizedNote(mel, 0.2, 'triangle', 0.18, this.bgmGain);
      }

      const brass = brassHarmonies[step % 16];
      if (brass > 0 && step % 2 === 0) {
        this.playSynthesizedNote(brass, 0.3, 'sawtooth', 0.08, this.bgmGain);
      }

      // Marching rhythm: Kick on 0, 4, 8, 12; Snare on 2, 6, 10, 14; Hihat every 8th
      if (step % 4 === 0) {
        this.playDrumBeat('kick', 0.14);
      } else if (step % 4 === 2) {
        this.playDrumBeat('snare', 0.09);
      }
      this.playDrumBeat('hihat', 0.04);
    }
  }

  playSynthesizedNote(freq, duration, type = 'triangle', gainAmount = 0.1, targetGain = null) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    g.gain.setValueAtTime(gainAmount, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(g);
    g.connect(targetGain || this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  playDrumBeat(drumType, volume = 0.1) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (drumType === 'kick') {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.18);
      g.gain.setValueAtTime(volume, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(g);
      g.connect(this.bgmGain);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (drumType === 'snare' || drumType === 'hihat') {
      const bufferSize = this.ctx.sampleRate * (drumType === 'snare' ? 0.12 : 0.04);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = drumType === 'snare' ? 'bandpass' : 'highpass';
      filter.frequency.setValueAtTime(drumType === 'snare' ? 1200 : 8000, now);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(volume, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + (drumType === 'snare' ? 0.12 : 0.04));
      noise.connect(filter);
      filter.connect(g);
      g.connect(this.bgmGain);
      noise.start(now);
    }
  }

  // -------------------------------------------------------------
  // SFX EFFECTS & ORIGINAL CHARACTER SOUNDS
  // -------------------------------------------------------------

  playTone(freqStart, freqEnd, duration, type = 'sine', gain = 0.2) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);

    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(g);
    g.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  playDeploy() {
    if (!this.enabled) return;
    this.ensureContext();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, freq * 1.06, 0.14, 'triangle', 0.28);
      }, idx * 40);
    });
  }

  playHit() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1300, now);
    filter.Q.setValueAtTime(3, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    this.playTone(200, 60, 0.09, 'sawtooth', 0.18);
  }

  playArrowShoot() {
    this.playTone(1300, 280, 0.11, 'sine', 0.2);
  }

  playExplosion() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.65;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    this.playTone(130, 25, 0.45, 'sawtooth', 0.4);
  }

  playDragonAttack() {
    this.playTone(450, 160, 0.28, 'sawtooth', 0.22);
    setTimeout(() => this.playTone(280, 80, 0.22, 'triangle', 0.22), 50);
  }

  playMagicCast() {
    this.playTone(850, 1750, 0.2, 'sine', 0.22);
    setTimeout(() => this.playTone(1500, 750, 0.18, 'sawtooth', 0.18), 45);
  }

  playLaserBeam() {
    this.playTone(650, 1550, 0.16, 'sawtooth', 0.14);
  }

  // --- 原創角色專屬豪華音效 ---

  // 1. 賽博幻影忍者 (Cyber Ninja) - 高頻等離子雙刃雷射斬擊
  playNinjaSlash() {
    this.playTone(2200, 450, 0.12, 'sawtooth', 0.26);
    setTimeout(() => this.playTone(1800, 300, 0.08, 'sine', 0.2), 30);
    setTimeout(() => this.playTone(800, 1400, 0.1, 'triangle', 0.15), 60);
  }

  // 2. 雷霆女武神 (Thunder Valkyrie) - 360度旋風雷暴斬
  playThunderSpin() {
    this.playTone(300, 900, 0.22, 'sawtooth', 0.3);
    setTimeout(() => this.playTone(1600, 200, 0.25, 'sawtooth', 0.28), 40);
    setTimeout(() => this.playTone(90, 40, 0.35, 'triangle', 0.35), 80);
  }

  // 3. 泰坦機甲魔像 (Mecha Golem) - 重裝液壓轟鳴與撼地衝擊波
  playMechaImpact() {
    this.playTone(80, 30, 0.55, 'sawtooth', 0.5);
    this.playTone(240, 50, 0.35, 'triangle', 0.4);
    setTimeout(() => this.playHit(), 30);
  }

  // 4. 不死鳥炎術師 (Phoenix Mage) - 鳳凰啼鳴與焚天烈焰
  playPhoenixFlame() {
    this.playTone(1200, 2400, 0.22, 'sine', 0.25);
    setTimeout(() => this.playTone(1800, 800, 0.3, 'sawtooth', 0.28), 60);
    setTimeout(() => this.playDragonAttack(), 80);
  }

  // UI 互動精緻音效
  playCardSelect() {
    this.playTone(650, 950, 0.08, 'sine', 0.18);
  }

  playUpgradeSound() {
    if (!this.enabled) return;
    const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    arpeggio.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, freq * 1.02, 0.2, 'triangle', 0.3);
      }, idx * 60);
    });
  }

  playMatchFound() {
    if (!this.enabled) return;
    const fanfare = [392.00, 523.25, 659.25, 783.99, 1046.50];
    fanfare.forEach((f, i) => {
      setTimeout(() => {
        this.playTone(f, f * 1.05, 0.22, 'sawtooth', 0.35);
      }, i * 75);
    });
  }

  playTowerDestroyed(isEnemy = true) {
    if (!this.enabled) return;
    this.playExplosion();
    const chords = isEnemy ? [523.25, 659.25, 783.99, 1046.5] : [400, 350, 300, 200];
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, freq, 0.32, isEnemy ? 'triangle' : 'sawtooth', 0.32);
      }, idx * 100);
    });
  }

  playDoubleElixir() {
    if (!this.enabled) return;
    this.setDoubleElixirTempo();
    const fanfare = [392, 523.25, 659.25, 783.99, 1046.5];
    fanfare.forEach((f, i) => {
      setTimeout(() => this.playTone(f, f * 1.02, 0.25, 'triangle', 0.35), i * 100);
    });
  }

  playEmote(type) {
    if (!this.enabled) return;
    switch (type) {
      case 'laugh':
        [600, 750, 600, 800, 650].forEach((f, i) => {
          setTimeout(() => this.playTone(f, f * 0.9, 0.1, 'triangle', 0.25), i * 90);
        });
        break;
      case 'cry':
        [600, 500, 420, 350].forEach((f, i) => {
          setTimeout(() => this.playTone(f, f * 0.85, 0.2, 'sine', 0.25), i * 120);
        });
        break;
      case 'angry':
        this.playTone(180, 120, 0.35, 'sawtooth', 0.35);
        break;
      case 'thumbs':
      case 'crown':
      case 'fire':
        this.playTone(523, 783, 0.2, 'triangle', 0.3);
        break;
    }
  }

  playVictory() {
    if (!this.enabled) return;
    const notes = [
      { f: 523.25, d: 150 },
      { f: 659.25, d: 150 },
      { f: 783.99, d: 200 },
      { f: 1046.5, d: 400 },
      { f: 880.0, d: 180 },
      { f: 1046.5, d: 600 }
    ];
    let time = 0;
    notes.forEach(n => {
      setTimeout(() => this.playTone(n.f, n.f, n.d / 1000, 'triangle', 0.42), time);
      time += n.d + 30;
    });
  }

  // --- 🎙️ 角色專屬語音咆哮與口頭禪 (Original Vocal & Voice Synthesizer) ---
  playVoice(cardId) {
    if (!this.enabled || !this.ctx) return;
    this.ensureContext();

    switch (cardId) {
      case 'hogrider':
        // 經典高昂野豬騎士戰吼: "Hooog Riiideeeer!"
        [
          { f: 420, t: 0.18, type: 'sawtooth', gain: 0.35 },
          { f: 650, t: 0.22, type: 'sawtooth', gain: 0.4 },
          { f: 880, t: 0.35, type: 'triangle', gain: 0.45 },
          { f: 720, t: 0.28, type: 'sine', gain: 0.3 }
        ].forEach((v, idx) => {
          setTimeout(() => this.playTone(v.f, v.f * 1.05, v.t, v.type, v.gain), idx * 140);
        });
        break;

      case 'wizard':
        // 魔法師詠唱語音: "Magic / Fireball!"
        [
          { f: 700, t: 0.15, type: 'sine', gain: 0.3 },
          { f: 950, t: 0.18, type: 'triangle', gain: 0.35 },
          { f: 1200, t: 0.25, type: 'sawtooth', gain: 0.3 }
        ].forEach((v, idx) => {
          setTimeout(() => this.playTone(v.f, v.f * 0.9, v.t, v.type, v.gain), idx * 110);
        });
        break;

      case 'pekka':
        // 皮卡超人機械重低音重吼: "P.E.K.K.A / Butterflies"
        [
          { f: 120, t: 0.25, type: 'sawtooth', gain: 0.5 },
          { f: 95, t: 0.3, type: 'square', gain: 0.45 },
          { f: 75, t: 0.4, type: 'sawtooth', gain: 0.5 }
        ].forEach((v, idx) => {
          setTimeout(() => this.playTone(v.f, v.f * 0.9, v.t, v.type, v.gain), idx * 180);
        });
        break;

      case 'golden_knight':
        // 金甲狂劍士英雄豪邁斬吼: "Golden Power!"
        [
          { f: 520, t: 0.14, type: 'triangle', gain: 0.38 },
          { f: 780, t: 0.18, type: 'sawtooth', gain: 0.42 },
          { f: 1040, t: 0.3, type: 'sawtooth', gain: 0.4 }
        ].forEach((v, idx) => {
          setTimeout(() => this.playTone(v.f, v.f * 1.08, v.t, v.type, v.gain), idx * 120);
        });
        break;

      case 'skeleton_king':
        // 骷髏死靈王者冥界長嘯: "Rise, my army!"
        [
          { f: 180, t: 0.22, type: 'sawtooth', gain: 0.4 },
          { f: 140, t: 0.25, type: 'triangle', gain: 0.42 },
          { f: 220, t: 0.35, type: 'sine', gain: 0.38 }
        ].forEach((v, idx) => {
          setTimeout(() => this.playTone(v.f, v.f * 0.85, v.t, v.type, v.gain), idx * 150);
        });
        break;

      case 'archer_queen':
        // 隱匿弓皇輕語神射: "Bullseye!"
        [
          { f: 880, t: 0.12, type: 'sine', gain: 0.3 },
          { f: 1320, t: 0.15, type: 'triangle', gain: 0.35 },
          { f: 1760, t: 0.22, type: 'sine', gain: 0.28 }
        ].forEach((v, idx) => {
          setTimeout(() => this.playTone(v.f, v.f * 1.02, v.t, v.type, v.gain), idx * 90);
        });
        break;

      default:
        // 通用士兵出戰號角呼喝
        this.playTone(380, 520, 0.12, 'triangle', 0.22);
        break;
    }
  }

  // 英雄主動技能震撼音效
  playChampionAbility(abilityId) {
    if (!this.enabled || !this.ctx) return;
    this.ensureContext();

    if (abilityId === 'dash_strike') {
      // 金光疾風連斬 (極速電光突刺 6 連音)
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          this.playTone(900 + i * 180, 400 + i * 100, 0.08, 'sawtooth', 0.3);
          this.playSwordHit();
        }, i * 65);
      }
    } else if (abilityId === 'soul_summon') {
      // 亡靈召喚 (冥界暗黑能量爆發 + 骷髏海破土)
      this.playTone(150, 60, 0.6, 'sawtooth', 0.45);
      setTimeout(() => this.playMagicCast(), 100);
      for (let i = 0; i < 5; i++) {
        setTimeout(() => this.playSpawn('skeletons'), 120 + i * 70);
      }
    } else if (abilityId === 'cloak_shot') {
      // 隱匿神速連弩 (迷霧消隱 + 高頻連弩連發)
      this.playTone(1800, 200, 0.3, 'sine', 0.35);
      for (let i = 0; i < 8; i++) {
        setTimeout(() => this.playBowShot(), 80 + i * 85);
      }
    }
  }

  // 卡牌覺醒進化啟動音效 (Hypercharge Surge)
  playEvoTrigger() {
    if (!this.enabled || !this.ctx) return;
    const chords = [392, 523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, freq * 1.1, 0.25, 'sawtooth', 0.32);
      }, idx * 50);
    });
  }

  // 肉鴿地牢獲得神聖聖物音效
  playRelicAcquire() {
    if (!this.enabled || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, f, 0.3, 'sine', 0.35), i * 80);
    });
  }
}

export const sounds = new SoundEngine();
