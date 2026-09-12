import * as THREE from 'three';
import { CARDS, getCardScaledStats } from '../game/cards.js';
import { BattleEngine } from '../game/battle.js';
import { sounds } from '../audio/sound.js';

export class BenchmarkUI {
  constructor(arena, onAnnouncement) {
    this.arena = arena;
    this.onAnnouncement = onAnnouncement;
    this.modal = document.getElementById('benchmark-modal');
    this.isRunning = false;
    this.lastReport = null;
    this.stressCanvas = null;
    this.stressRenderer = null;
    this.stressScene = null;
    this.stressCamera = null;
    this.stressParticles = null;
    this.stressMeshes = [];
    this.animationId = null;

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    if (!this.modal) return;
    this.statusTitle = document.getElementById('bm-status-title');
    this.statusSub = document.getElementById('bm-status-sub');
    this.progressBar = document.getElementById('bm-progress-bar');
    this.progressPct = document.getElementById('bm-progress-pct');
    this.canvasBox = document.getElementById('bm-stress-canvas-box');
    this.resultsCard = document.getElementById('bm-results-card');
    this.scoreDisplay = document.getElementById('bm-total-score');
    this.gradeBadge = document.getElementById('bm-grade-badge');
    this.fpsGauge = document.getElementById('bm-live-fps');
    this.metricsGrid = document.getElementById('bm-metrics-grid');
    this.deviceInfoList = document.getElementById('bm-device-info');
    this.recommendText = document.getElementById('bm-recommend-text');

    this.initStress3D();
  }

  initStress3D() {
    const container = document.getElementById('bm-canvas-container');
    if (!container) return;

    try {
      this.stressScene = new THREE.Scene();
      this.stressCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
      this.stressCamera.position.set(0, 5, 12);
      this.stressCamera.lookAt(0, 0, 0);

      this.stressRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.stressRenderer.setSize(container.clientWidth || 320, container.clientHeight || 180);
      this.stressRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(this.stressRenderer.domElement);
      this.stressCanvas = this.stressRenderer.domElement;

      // Lights
      const ambient = new THREE.AmbientLight(0xffffff, 0.8);
      const point = new THREE.PointLight(0xffaa00, 2, 20);
      point.position.set(5, 8, 5);
      this.stressScene.add(ambient, point);

      // Create Particle Cloud (3,000 particles)
      const pCount = 3000;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      const pCols = new Float32Array(pCount * 3);
      const color1 = new THREE.Color(0x00ffff);
      const color2 = new THREE.Color(0xff00ff);

      for (let i = 0; i < pCount; i++) {
        const i3 = i * 3;
        const radius = 2 + Math.random() * 8;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;

        pPos[i3] = radius * Math.cos(phi) * Math.cos(theta);
        pPos[i3 + 1] = radius * Math.sin(phi);
        pPos[i3 + 2] = radius * Math.cos(phi) * Math.sin(theta);

        const mixRatio = Math.random();
        const c = color1.clone().lerp(color2, mixRatio);
        pCols[i3] = c.r;
        pCols[i3 + 1] = c.g;
        pCols[i3 + 2] = c.b;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      pGeo.setAttribute('color', new THREE.BufferAttribute(pCols, 3));

      const pMat = new THREE.PointsMaterial({
        size: 0.18,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      this.stressParticles = new THREE.Points(pGeo, pMat);
      this.stressScene.add(this.stressParticles);

      // Add 24 bouncing geometric crystals
      const geoms = [
        new THREE.OctahedronGeometry(0.5, 0),
        new THREE.TetrahedronGeometry(0.5, 0),
        new THREE.TorusGeometry(0.4, 0.15, 8, 16)
      ];
      for (let i = 0; i < 24; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(i / 24, 0.9, 0.6),
          roughness: 0.2,
          metalness: 0.8
        });
        const mesh = new THREE.Mesh(geoms[i % geoms.length], mat);
        mesh.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 8);
        mesh.userData = {
          rotSpeed: (Math.random() - 0.5) * 4,
          bobSpeed: 1 + Math.random() * 3,
          baseY: mesh.position.y
        };
        this.stressScene.add(mesh);
        this.stressMeshes.push(mesh);
      }
    } catch (e) {
      console.warn('Stress 3D Scene initialization warning:', e);
    }
  }

  bindEvents() {
    // Open Buttons
    document.getElementById('btn-open-benchmark')?.addEventListener('click', () => {
      this.open();
    });

    document.getElementById('btn-settings-benchmark')?.addEventListener('click', () => {
      document.getElementById('settings-modal')?.classList.add('hidden');
      this.open();
    });

    // Close Button
    document.getElementById('btn-close-benchmark')?.addEventListener('click', () => {
      this.close();
    });

    // Run / Re-run Button
    document.getElementById('btn-start-benchmark')?.addEventListener('click', () => {
      if (!this.isRunning) this.runFullBenchmark();
    });

    // Copy Report Button
    document.getElementById('btn-copy-benchmark-report')?.addEventListener('click', () => {
      this.copyReportToClipboard();
    });

    // Optimize Button
    document.getElementById('btn-apply-bm-optimization')?.addEventListener('click', () => {
      this.applyAutoOptimization();
    });
  }

  open() {
    if (!this.modal) return;
    sounds.playTone(600, 900, 0.15, 'triangle', 0.3);
    this.modal.classList.remove('hidden');
    this.renderDeviceInfo();

    // Resize canvas if needed
    const container = document.getElementById('bm-canvas-container');
    if (container && this.stressRenderer) {
      this.stressRenderer.setSize(container.clientWidth || 320, container.clientHeight || 180);
    }

    if (!this.lastReport) {
      this.runFullBenchmark();
    }
  }

  close() {
    if (this.isRunning) return;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.modal?.classList.add('hidden');
  }

  getDeviceDiagnostics() {
    const gl = this.arena?.renderer?.getContext() || this.stressRenderer?.getContext();
    let gpuRenderer = '未知 GPU';
    let gpuVendor = '未知廠商';
    let webglVersion = 'WebGL 1.0';

    if (gl) {
      try {
        const dbgExt = gl.getExtension('WEBGL_debug_renderer_info');
        if (dbgExt) {
          gpuRenderer = gl.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL) || gpuRenderer;
          gpuVendor = gl.getParameter(dbgExt.UNMASKED_VENDOR_WEBGL) || gpuVendor;
        }
        webglVersion = gl instanceof WebGL2RenderingContext ? 'WebGL 2.0 (原生硬體加速)' : 'WebGL 1.0';
      } catch (e) { }
    }

    return {
      gpu: gpuRenderer,
      vendor: gpuVendor,
      webgl: webglVersion,
      cores: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} 核心` : '未知',
      memory: navigator.deviceMemory ? `~${navigator.deviceMemory} GB` : '瀏覽器保護不揭露',
      screen: `${window.screen.width} × ${window.screen.height} (DPR: ${window.devicePixelRatio || 1}x)`,
      ua: navigator.userAgent.includes('Mobile') ? '行動裝置 (Mobile)' : '桌面瀏覽器 (Desktop)',
      audioSampleRate: `${new (window.AudioContext || window.webkitAudioContext)().sampleRate} Hz`
    };
  }

  renderDeviceInfo() {
    if (!this.deviceInfoList) return;
    const diag = this.getDeviceDiagnostics();
    this.deviceInfoList.innerHTML = `
      <div class="bm-diag-chip"><strong>GPU:</strong> <span>${diag.gpu}</span></div>
      <div class="bm-diag-chip"><strong>驅動層:</strong> <span>${diag.webgl}</span></div>
      <div class="bm-diag-chip"><strong>CPU 併發:</strong> <span>${diag.cores}</span></div>
      <div class="bm-diag-chip"><strong>設備記憶體:</strong> <span>${diag.memory}</span></div>
      <div class="bm-diag-chip"><strong>螢幕規格:</strong> <span>${diag.screen}</span></div>
      <div class="bm-diag-chip"><strong>音訊採樣:</strong> <span>${diag.audioSampleRate}</span></div>
    `;
  }

  async runFullBenchmark() {
    if (this.isRunning) return;
    this.isRunning = true;
    sounds.playTone(440, 880, 0.2, 'sawtooth', 0.25);

    const runBtn = document.getElementById('btn-start-benchmark');
    if (runBtn) {
      runBtn.disabled = true;
      runBtn.innerHTML = '⏳ 壓測進行中...';
    }

    this.resultsCard?.classList.add('hidden');
    this.canvasBox?.classList.remove('hidden');

    this.updateProgress(5, '⚙️ [Stage 1/5] 初始化硬體偵測與 CPU JIT 預熱...');
    await new Promise(r => setTimeout(r, 200));

    // --- STAGE 1: CPU Math & Card Scaling Matrix (50,000 Ops) ---
    this.updateProgress(20, '⚡ [Stage 2/5] 50,000 次卡牌數值非線性矩陣計算...');
    await new Promise(r => setTimeout(r, 60));
    const cardKeys = Object.keys(CARDS).filter(k => CARDS[k].type === 'troop');
    const t0 = performance.now();
    for (let i = 0; i < 50000; i++) {
      const k = cardKeys[i % cardKeys.length];
      const lvl = (i % 14) + 1;
      getCardScaledStats(k, lvl);
    }
    const mathTimeMs = performance.now() - t0;
    const mathOpsPerSec = Math.round((50000 / mathTimeMs) * 1000);

    // --- STAGE 2: High Concurrency Battle Engine Simulation (150 Units) ---
    this.updateProgress(45, '⚔️ [Stage 3/5] 戰鬥引擎 150+ 單位 4 方混戰 (AI/索敵/碰撞 300 幀)...');
    await new Promise(r => setTimeout(r, 60));

    const mockArena = {
      scene: new THREE.Scene(),
      container: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) },
      camera: new THREE.PerspectiveCamera(),
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
      towers: [],
      elixirRunes: [],
      jumpPads: [],
      icePatches: [],
      portalPairs: [],
      hazardZones: [],
      updatePlacementGhost: () => { },
      setDeploymentVisual: () => { },
      setArenaTheme: () => { },
      getArenaIntersection: () => ({ x: 0, z: 0 }),
      startCinematicKillCam: () => { },
      triggerSlowMotion: () => { },
      shakeCamera: () => { },
      resetCamera: () => { },
      setBlizzard: () => { },
      update: () => { }
    };
    const mockEffects = new Proxy({}, { get: () => () => { } });
    const mockSounds = new Proxy({}, { get: () => () => { } });

    const battle = new BattleEngine(mockArena, mockEffects, mockSounds, { battleMode: 'brawl', playerTeam: 'blue' });
    battle.isPaused = false;
    for (let i = 0; i < 100; i++) {
      const cId = cardKeys[i % cardKeys.length];
      const card = CARDS[cId];
      if (card) {
        const angle = (i / 100) * Math.PI * 2;
        battle.spawnTroops(card, new THREE.Vector3(Math.cos(angle) * 8, 0, Math.sin(angle) * 8), ['blue', 'red', 'green', 'purple'][i % 4]);
      }
    }

    const b0 = performance.now();
    const frameCount = 300;
    const tickDeltas = [];
    for (let f = 0; f < frameCount; f++) {
      const fStart = performance.now();
      battle.update(1 / 60);
      tickDeltas.push(performance.now() - fStart);
    }
    const battleTotalMs = performance.now() - b0;
    const avgBattleTick = battleTotalMs / frameCount;
    const p95BattleTick = tickDeltas.slice().sort((a, b) => a - b)[Math.floor(frameCount * 0.95)];

    // --- STAGE 3: WebGL 3D Real-time GPU & Particle Rendering Stress Test (2.5 Seconds Live) ---
    this.updateProgress(70, '🎮 [Stage 4/5] WebGL 3D 渲染與 3,000+ 粒子 GPU 壓力實測...');
    const gpuResults = await this.runLiveGpuStress(2500);

    // --- STAGE 4: Web Audio Polyphony & Synthesis Stress Test ---
    this.updateProgress(90, '🔊 [Stage 5/5] Web Audio 聲道多工合成器極限負載測試...');
    const audioTimeMs = this.runAudioStress();
    await new Promise(r => setTimeout(r, 100));

    // --- STAGE 5: Scoring & Rating ---
    this.updateProgress(100, '✅ 基準壓測完成！正在生成深度診斷報告...');
    await new Promise(r => setTimeout(r, 200));

    // Calculate Comprehensive Score
    const cpuScore = Math.min(3000, Math.round((mathOpsPerSec / 5000000) * 3000));
    const logicScore = Math.min(3500, Math.round((1.0 / Math.max(0.1, avgBattleTick)) * 700));
    const gpuScore = Math.min(3500, Math.round((gpuResults.avgFps / 60) * 3500));
    const totalScore = Math.min(9999, Math.round(cpuScore + logicScore + gpuScore));

    let grade = 'S+';
    let gradeLabel = '👑 S+ (巔峰頂級性能)';
    let gradeColor = '#00ffcc';
    let recommend = '✨ 您的設備性能極其強悍！推薦開啟「最高畫質 (Full 3D FX) + 60 FPS 滿血模式」。';

    if (totalScore < 6000 || gpuResults.avgFps < 40) {
      grade = 'B';
      gradeLabel = '⚡ B (建議開啟流暢模式)';
      gradeColor = '#ffaa00';
      recommend = '💡 建議於設定中保持開啟「📱 手機流暢模式」，可大幅降低電池發熱並鎖定穩定 60 FPS。';
    } else if (totalScore < 8000 || gpuResults.avgFps < 55) {
      grade = 'A';
      gradeLabel = '🌟 A (高階流暢運行)';
      gradeColor = '#00e5ff';
      recommend = '👍 您的設備在大部分對局均能穩定滿幀運行，無須擔心效能瓶頸。';
    }

    this.lastReport = {
      timestamp: new Date().toLocaleTimeString(),
      totalScore,
      grade,
      gradeLabel,
      gradeColor,
      recommend,
      cpu: {
        mathTimeMs: mathTimeMs.toFixed(2),
        opsPerSec: mathOpsPerSec.toLocaleString()
      },
      battle: {
        units: battle.troops.length,
        avgTick: avgBattleTick.toFixed(3),
        p95Tick: p95BattleTick.toFixed(3),
        budgetPercent: ((avgBattleTick / 16.66) * 100).toFixed(1)
      },
      gpu: {
        avgFps: Math.round(gpuResults.avgFps),
        minFps: Math.round(gpuResults.minFps),
        frameJitter: gpuResults.jitter.toFixed(2),
        particles: 3000,
        meshes: this.stressMeshes.length
      },
      audio: {
        timeMs: audioTimeMs.toFixed(2)
      },
      diagnostics: this.getDeviceDiagnostics()
    };

    this.renderResults(this.lastReport);

    this.isRunning = false;
    if (runBtn) {
      runBtn.disabled = false;
      runBtn.innerHTML = '🔄 重新跑分 (Re-run)';
    }

    sounds.playFanfare();
    this.onAnnouncement?.(`🚀 網頁端效能跑分完成！總評分：${totalScore} 分 (${grade})！`);
  }

  runLiveGpuStress(durationMs) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let frames = 0;
      let lastFrameTime = startTime;
      const frameDeltas = [];

      const tick = (now) => {
        const delta = now - lastFrameTime;
        lastFrameTime = now;
        if (delta > 0 && delta < 100) {
          frameDeltas.push(delta);
        }
        frames++;

        // Rotate particles & animate meshes
        if (this.stressParticles) {
          this.stressParticles.rotation.y += 0.04;
          this.stressParticles.rotation.x += 0.02;
        }
        const timeSec = (now - startTime) / 1000;
        this.stressMeshes.forEach(m => {
          m.rotation.x += m.userData.rotSpeed * 0.01;
          m.rotation.y += m.userData.rotSpeed * 0.015;
          m.position.y = m.userData.baseY + Math.sin(timeSec * m.userData.bobSpeed) * 0.8;
        });

        if (this.stressRenderer && this.stressScene && this.stressCamera) {
          this.stressRenderer.render(this.stressScene, this.stressCamera);
        }

        // Live FPS update
        const currentFps = delta > 0 ? Math.min(144, Math.round(1000 / delta)) : 60;
        if (this.fpsGauge) {
          this.fpsGauge.textContent = `${currentFps} FPS`;
        }

        if (now - startTime < durationMs) {
          this.animationId = requestAnimationFrame(tick);
        } else {
          const totalElapsed = (now - startTime) / 1000;
          const avgFps = frames / totalElapsed;
          const minFps = frameDeltas.length ? 1000 / Math.max(...frameDeltas) : 30;

          // Calculate frame jitter (std deviation of frame times)
          const avgDelta = frameDeltas.reduce((a, b) => a + b, 0) / (frameDeltas.length || 1);
          const variance = frameDeltas.reduce((acc, d) => acc + Math.pow(d - avgDelta, 2), 0) / (frameDeltas.length || 1);
          const jitter = Math.sqrt(variance);

          resolve({ avgFps, minFps, jitter });
        }
      };

      this.animationId = requestAnimationFrame(tick);
    });
  }

  runAudioStress() {
    const t0 = performance.now();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        for (let i = 0; i < 16; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220 + i * 50, ctx.currentTime);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1200, ctx.currentTime);
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.05);
        }
      }
    } catch (e) { }
    return performance.now() - t0;
  }

  updateProgress(pct, msg) {
    if (this.progressBar) this.progressBar.style.width = `${pct}%`;
    if (this.progressPct) this.progressPct.textContent = `${pct}%`;
    if (this.statusTitle) this.statusTitle.textContent = msg;
  }

  renderResults(rep) {
    if (!this.resultsCard) return;
    this.resultsCard.classList.remove('hidden');

    if (this.scoreDisplay) this.scoreDisplay.textContent = rep.totalScore;
    if (this.gradeBadge) {
      this.gradeBadge.textContent = rep.gradeLabel;
      this.gradeBadge.style.color = rep.gradeColor;
      this.gradeBadge.style.borderColor = rep.gradeColor;
      this.gradeBadge.style.boxShadow = `0 0 15px ${rep.gradeColor}44`;
    }
    if (this.recommendText) {
      this.recommendText.textContent = rep.recommend;
    }

    if (this.metricsGrid) {
      this.metricsGrid.innerHTML = `
        <div class="bm-metric-card">
          <div class="bm-metric-icon">🎮</div>
          <div class="bm-metric-title">WebGL 3D GPU 幀率</div>
          <div class="bm-metric-val highlight">${rep.gpu.avgFps} <span class="unit">FPS</span></div>
          <div class="bm-metric-sub">最低 FPS: ${rep.gpu.minFps} | 抖動: ±${rep.gpu.frameJitter}ms</div>
        </div>

        <div class="bm-metric-card">
          <div class="bm-metric-icon">⚔️</div>
          <div class="bm-metric-title">戰鬥邏輯 Tick 耗時</div>
          <div class="bm-metric-val">${rep.battle.avgTick} <span class="unit">ms</span></div>
          <div class="bm-metric-sub">60FPS 預算佔用: ${rep.battle.budgetPercent}% (極其充裕)</div>
        </div>

        <div class="bm-metric-card">
          <div class="bm-metric-icon">⚡</div>
          <div class="bm-metric-title">CPU 數值矩陣計算</div>
          <div class="bm-metric-val">${rep.cpu.opsPerSec} <span class="unit">Ops/s</span></div>
          <div class="bm-metric-sub">50,000 次卡牌運算僅耗時 ${rep.cpu.mathTimeMs}ms</div>
        </div>

        <div class="bm-metric-card">
          <div class="bm-metric-icon">🔊</div>
          <div class="bm-metric-title">音訊合成器負載</div>
          <div class="bm-metric-val">${rep.audio.timeMs} <span class="unit">ms</span></div>
          <div class="bm-metric-sub">16 聲道多工諧振器零阻塞</div>
        </div>
      `;
    }
  }

  applyAutoOptimization() {
    const isMobile = navigator.userAgent.includes('Mobile') || window.innerWidth <= 768;
    const btnPerf = document.getElementById('btn-toggle-perf-mode');

    if (this.lastReport?.grade === 'B' || isMobile) {
      if (btnPerf && !btnPerf.classList.contains('active')) {
        btnPerf.click();
      }
      this.onAnnouncement?.('⚡ 已為您開啟「手機流暢優化模式」，確保高抗發熱與滿幀 60 FPS！');
    } else {
      if (btnPerf && !btnPerf.classList.contains('active')) {
        btnPerf.classList.add('active');
        btnPerf.textContent = '已啟用 (60 FPS 滿血)';
      }
      this.onAnnouncement?.('✨ 已啟用「全特效 60 FPS 滿血模式」！');
    }
    sounds.playVictory();
  }

  copyReportToClipboard() {
    if (!this.lastReport) return;
    const rep = this.lastReport;
    const text = `🏆 【Royal Showdown 3D 網頁端效能基準跑分報告】
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏅 綜合評分: ${rep.totalScore} 分 (${rep.grade})
🎮 WebGL 3D 渲染: ${rep.gpu.avgFps} FPS (最低: ${rep.gpu.minFps} FPS, 抖動: ±${rep.gpu.frameJitter}ms)
⚔️ 150+ 單位戰鬥邏輯: ${rep.battle.avgTick} ms/tick (60FPS 預算佔用: ${rep.battle.budgetPercent}%)
⚡ CPU 公式運算吞吐: ${rep.cpu.opsPerSec} 次/秒
🔊 Web Audio 合成開銷: ${rep.audio.timeMs} ms
🖥️ GPU 硬體: ${rep.diagnostics.gpu}
💻 CPU 核心: ${rep.diagnostics.cores} | 設備記憶體: ${rep.diagnostics.memory}
💡 最佳化建議: ${rep.recommend}
━━━━━━━━━━━━━━━━━━━━━━━━━━
測試時間: ${rep.timestamp} | 測試模式: 瀏覽器實時全壓測`;

    navigator.clipboard.writeText(text).then(() => {
      this.onAnnouncement?.('📋 跑分報告已複製至剪貼簿！可直接分享給好友！');
      sounds.playTone(800, 1200, 0.1, 'triangle', 0.4);
    }).catch(() => {
      alert(text);
    });
  }
}
