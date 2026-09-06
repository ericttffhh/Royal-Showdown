/**
 * PVE 無盡怪獸防守波次塔防模式 (Endless PvE Siege Mode)
 */

export class PvEManager {
  constructor(battle, callbacks = {}) {
    this.battle = battle;
    this.callbacks = callbacks; // { onWaveStart, onWaveCleared, onPvEComplete }

    this.active = false;
    this.currentWave = 0;
    this.maxWaves = 20;
    this.waveTimer = 0;
    this.waveInProgress = false;
    this.monstersToSpawn = [];
    this.spawnInterval = 1.0;
    this.spawnCooldown = 0;
  }

  startPvE() {
    this.active = true;
    this.currentWave = 0;
    this.waveTimer = 3.0; // 3s before wave 1
    this.waveInProgress = false;
    this.monstersToSpawn = [];
  }

  stopPvE() {
    this.active = false;
    this.waveInProgress = false;
    this.monstersToSpawn = [];
  }

  update(deltaTime) {
    if (!this.active || this.battle.isOver || this.battle.isPaused) return;

    if (!this.waveInProgress) {
      this.waveTimer -= deltaTime;
      if (this.waveTimer <= 0) {
        this.startNextWave();
      }
    } else {
      // Spawn pending monsters in wave
      if (this.monstersToSpawn.length > 0) {
        this.spawnCooldown -= deltaTime;
        if (this.spawnCooldown <= 0) {
          const monster = this.monstersToSpawn.shift();
          const spawnX = (Math.random() - 0.5) * 8;
          const spawnZ = -14.5;
          this.battle.deployCard(monster, { x: spawnX, z: spawnZ }, false);
          this.spawnCooldown = this.spawnInterval;
        }
      } else {
        // Check if all enemy monsters are cleared
        const enemyTroops = this.battle.troops.filter(t => !t.isBlue && t.hp > 0);
        if (enemyTroops.length === 0) {
          this.waveInProgress = false;
          this.callbacks.onWaveCleared?.(this.currentWave);

          if (this.currentWave >= this.maxWaves) {
            this.callbacks.onPvEComplete?.();
            this.battle.endMatch('win');
          } else {
            this.waveTimer = 4.0; // 4s rest before next wave
          }
        }
      }
    }
  }

  startNextWave() {
    this.currentWave++;
    this.waveInProgress = true;
    this.callbacks.onWaveStart?.(this.currentWave, this.maxWaves);

    this.monstersToSpawn = this.generateWaveMonsters(this.currentWave);
    this.spawnInterval = Math.max(0.4, 1.2 - this.currentWave * 0.04);
    this.spawnCooldown = 0.5;
  }

  generateWaveMonsters(wave) {
    const list = [];
    if (wave === 1) {
      list.push('goblins', 'goblins');
    } else if (wave === 2) {
      list.push('archers', 'goblins', 'archers');
    } else if (wave === 3) {
      list.push('knight', 'archers', 'goblins');
    } else if (wave === 4) {
      list.push('skeletons', 'skeletons', 'wizard');
    } else if (wave === 5) {
      list.push('giant', 'archers', 'archers');
    } else if (wave === 6) {
      list.push('dragon', 'goblins', 'goblins');
    } else if (wave === 7) {
      list.push('hogrider', 'hogrider', 'skeletons');
    } else if (wave === 8) {
      list.push('musketeer', 'knight', 'musketeer', 'goblins');
    } else if (wave === 9) {
      list.push('giant', 'wizard', 'dragon');
    } else if (wave === 10) {
      list.push('pekka', 'wizard', 'archers');
    } else if (wave === 12) {
      list.push('hogrider', 'hogrider', 'dragon', 'wizard');
    } else if (wave === 15) {
      list.push('pekka', 'pekka', 'musketeer', 'wizard');
    } else if (wave === 18) {
      list.push('giant', 'giant', 'pekka', 'dragon', 'wizard');
    } else if (wave === 20) {
      // Final Boss Titan Horde!
      list.push('pekka', 'giant', 'pekka', 'dragon', 'wizard', 'musketeer', 'hogrider', 'skeletons');
    } else {
      list.push('giant', 'knight', 'archers', 'wizard');
    }
    return list;
  }
}
