import * as THREE from 'three';

/**
 * 3D Visual Effects Engine (Expanded with Meteor, Rage Aura, Ice Freeze & Lasers)
 */

export class EffectsEngine {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.projectiles = [];
    this.particles = [];
    this.damageTexts = [];
    this.hpBars = new Map();
    this.laserBeams = new Map();
    this.areaAuras = [];

    this.initPools();
  }

  initPools() {
    this.arrowGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 4);
    this.arrowMat = new THREE.MeshStandardMaterial({ color: 0x5a3e1b });

    this.fireballGeo = new THREE.SphereGeometry(0.35, 8, 8);
    this.fireballMat = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff2200,
      emissiveIntensity: 1.5
    });

    this.meteorGeo = new THREE.DodecahedronGeometry(0.8, 1);
    this.meteorMat = new THREE.MeshStandardMaterial({
      color: 0x331100,
      emissive: 0xff5500,
      emissiveIntensity: 2.2,
      roughness: 0.9
    });
  }

  // -------------------------------------------------------------
  // PROJECTILES
  // -------------------------------------------------------------

  spawnArrow(startPos, targetPos, onHit) {
    const arrowMesh = new THREE.Mesh(this.arrowGeo, this.arrowMat);
    arrowMesh.position.copy(startPos);
    this.scene.add(arrowMesh);

    const distance = startPos.distanceTo(targetPos);
    const duration = Math.max(0.2, distance * 0.045);

    this.projectiles.push({
      mesh: arrowMesh,
      start: startPos.clone(),
      target: targetPos.clone(),
      elapsed: 0,
      duration,
      arcHeight: 1.8,
      onHit
    });
  }

  spawnFireball(startPos, targetPos, radius, onHit) {
    const mesh = new THREE.Mesh(this.fireballGeo, this.fireballMat);
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    const distance = startPos.distanceTo(targetPos);
    const duration = Math.max(0.4, distance * 0.06);

    this.projectiles.push({
      mesh,
      start: startPos.clone(),
      target: targetPos.clone(),
      elapsed: 0,
      duration,
      arcHeight: 4.5,
      isFireball: true,
      radius,
      onHit
    });
  }

  spawnMeteor(targetPos, onHit) {
    const mesh = new THREE.Mesh(this.meteorGeo, this.meteorMat);
    const startPos = new THREE.Vector3(targetPos.x - 6, 26, targetPos.z + 8);
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    const duration = 0.75;
    this.projectiles.push({
      mesh,
      start: startPos,
      target: targetPos.clone(),
      elapsed: 0,
      duration,
      arcHeight: 0,
      isMeteor: true,
      onHit
    });
  }

  spawnSpellArrows(targetPos, count, onHit) {
    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * 3.5;
      const offsetZ = (Math.random() - 0.5) * 3.5;
      const start = new THREE.Vector3(targetPos.x + offsetX - 3, 14 + Math.random() * 2, targetPos.z + offsetZ + (targetPos.z > 0 ? -6 : 6));
      const end = new THREE.Vector3(targetPos.x + offsetX, 0, targetPos.z + offsetZ);

      setTimeout(() => {
        this.spawnArrow(start, end, i === 0 ? onHit : null);
      }, i * 35);
    }
  }

  // -------------------------------------------------------------
  // AREA AURAS (Rage, Freeze)
  // -------------------------------------------------------------

  createRageAura(center, radius, duration = 6.0) {
    const geo = new THREE.RingGeometry(0.1, radius, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xc137ff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(center.x, 0.04, center.z);
    this.scene.add(mesh);

    this.areaAuras.push({
      mesh,
      mat,
      elapsed: 0,
      duration,
      pulse: true
    });
  }

  createFreezeAura(center, radius, duration = 3.5) {
    const geo = new THREE.RingGeometry(0.1, radius, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00d9ff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(center.x, 0.05, center.z);
    this.scene.add(mesh);

    this.areaAuras.push({
      mesh,
      mat,
      elapsed: 0,
      duration,
      pulse: false
    });
  }

  // -------------------------------------------------------------
  // LASER BEAM
  // -------------------------------------------------------------

  updateLaserBeam(id, startPos, targetPos, rampRatio = 0) {
    let laser = this.laserBeams.get(id);
    if (!laser) {
      const geo = new THREE.CylinderGeometry(0.08, 0.08, 1, 6);
      geo.translate(0, 0.5, 0);
      geo.rotateX(Math.PI / 2);

      const mat = new THREE.MeshBasicMaterial({
        color: 0xff7700,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(geo, mat);
      this.scene.add(mesh);

      laser = { mesh, mat };
      this.laserBeams.set(id, laser);
    }

    laser.mesh.visible = true;
    const dist = startPos.distanceTo(targetPos);
    laser.mesh.position.copy(startPos);
    laser.mesh.lookAt(targetPos);
    laser.mesh.scale.set(1 + rampRatio * 2.5, 1 + rampRatio * 2.5, dist);

    if (rampRatio > 0.6) {
      laser.mat.color.setHex(0xffffff);
    } else if (rampRatio > 0.3) {
      laser.mat.color.setHex(0xff2200);
    } else {
      laser.mat.color.setHex(0xffaa00);
    }
  }

  removeLaserBeam(id) {
    const laser = this.laserBeams.get(id);
    if (laser) {
      this.scene.remove(laser.mesh);
      this.laserBeams.delete(id);
    }
  }

  // -------------------------------------------------------------
  // PARTICLES & EXPLOSIONS
  // -------------------------------------------------------------

  createExplosion(pos, color = 0xff6600, count = 18, radius = 2.0) {
    for (let i = 0; i < count; i++) {
      const pGeo = new THREE.SphereGeometry(0.12 + Math.random() * 0.1, 4, 4);
      const pMat = new THREE.MeshBasicMaterial({ color, transparent: true });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.copy(pos);
      this.scene.add(pMesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        2 + Math.random() * 5,
        Math.sin(angle) * speed
      );

      this.particles.push({
        mesh: pMesh,
        velocity,
        lifetime: 0.6 + Math.random() * 0.35,
        age: 0
      });
    }
  }

  // 1. 賽博幻影忍者 - 霓虹等離子雙刀斬擊波
  spawnCyberSlash(pos) {
    this.createExplosion(pos, 0x00ffff, 16, 1.5);
    const ringGeo = new THREE.RingGeometry(0.2, 1.2, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 3;
    ring.position.set(pos.x, pos.y + 0.5, pos.z);
    this.scene.add(ring);
    this.areaAuras.push({ mesh: ring, mat: ringMat, elapsed: 0, duration: 0.25, pulse: false });
  }

  // 2. 雷霆女武神 - 360° 旋風雷暴光環
  spawnThunderCyclone(pos, radius = 2.2) {
    this.createExplosion(pos, 0xffee00, 20, radius);
    const ringGeo = new THREE.RingGeometry(0.3, radius, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffea00, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.08, pos.z);
    this.scene.add(ring);
    this.areaAuras.push({ mesh: ring, mat: ringMat, elapsed: 0, duration: 0.35, pulse: true });
  }

  // 3. 泰坦機甲魔像 - 地震衝擊波與金屬火花
  spawnShockwave(pos, radius = 2.0) {
    this.createExplosion(pos, 0xff7700, 24, radius);
    const ringGeo = new THREE.RingGeometry(0.2, radius, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff4400, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.06, pos.z);
    this.scene.add(ring);
    this.areaAuras.push({ mesh: ring, mat: ringMat, elapsed: 0, duration: 0.4, pulse: false });
  }

  // 4. 不死鳥炎術師 - 鳳凰神火投擲
  spawnPhoenixProjectile(startPos, targetPos, radius = 1.8, onHit) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff6600, emissiveIntensity: 2.5 })
    );
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    const distance = startPos.distanceTo(targetPos);
    const duration = Math.max(0.35, distance * 0.05);

    this.projectiles.push({
      mesh,
      start: startPos.clone(),
      target: targetPos.clone(),
      elapsed: 0,
      duration,
      arcHeight: 2.5,
      isFireball: true,
      radius,
      onHit: () => {
        this.createExplosion(targetPos, 0xff3300, 24, radius);
        onHit?.();
      }
    });
  }

  createSpawnSmoke(pos, color = 0x99bbff) {
    this.createExplosion(pos, color, 12, 1.2);
  }

  // -------------------------------------------------------------
  // 3D FLOATING HP BARS
  // -------------------------------------------------------------

  updateHpBar(entityId, position, currentHp, maxHp, isBlue, heightOffset = 1.8, isFrozen = false, isRaged = false) {
    let bar = this.hpBars.get(entityId);
    const hpRatio = Math.max(0, Math.min(1, currentHp / maxHp));

    if (!bar) {
      const group = new THREE.Group();

      const bgGeo = new THREE.PlaneGeometry(1.2, 0.16);
      const bgMat = new THREE.MeshBasicMaterial({ color: 0x111111, depthTest: false, depthWrite: false });
      const bgMesh = new THREE.Mesh(bgGeo, bgMat);
      bgMesh.renderOrder = 100;
      group.add(bgMesh);

      const fillGeo = new THREE.PlaneGeometry(1.14, 0.12);
      fillGeo.translate(0.57, 0, 0);
      const fillMat = new THREE.MeshBasicMaterial({
        color: isBlue ? 0x2288ff : 0xff3355,
        depthTest: false,
        depthWrite: false
      });
      const fillMesh = new THREE.Mesh(fillGeo, fillMat);
      fillMesh.position.set(-0.57, 0, 0.01);
      fillMesh.renderOrder = 101;
      group.add(fillMesh);

      this.scene.add(group);
      bar = { group, fillMesh, bgMesh, fillMat, heightOffset };
      this.hpBars.set(entityId, bar);
    }

    bar.group.position.set(position.x, position.y + heightOffset, position.z);
    bar.group.quaternion.copy(this.camera.quaternion);
    bar.fillMesh.scale.x = hpRatio;

    // Status color shifts
    if (isFrozen) {
      bar.fillMat.color.setHex(0x00d9ff);
    } else if (isRaged) {
      bar.fillMat.color.setHex(0xc137ff);
    } else {
      bar.fillMat.color.setHex(isBlue ? 0x2288ff : 0xff3355);
    }

    if (hpRatio <= 0) {
      this.removeHpBar(entityId);
    }
  }

  removeHpBar(entityId) {
    const bar = this.hpBars.get(entityId);
    if (bar) {
      this.scene.remove(bar.group);
      this.hpBars.delete(entityId);
    }
  }

  // -------------------------------------------------------------
  // 3D FLOATING DAMAGE TEXTS
  // -------------------------------------------------------------

  spawnDamageText(pos, damage, isCrit = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.font = `bold ${isCrit ? '38px' : '30px'} sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = isCrit ? '#ffcc00' : '#ff4444';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(`-${Math.round(damage)}`, 64, 32);
    ctx.fillText(`-${Math.round(damage)}`, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.4, 0.7, 1);
    sprite.position.set(pos.x + (Math.random() - 0.5) * 0.4, pos.y + 1.2, pos.z);
    sprite.renderOrder = 150;

    this.scene.add(sprite);

    this.damageTexts.push({
      sprite,
      mat,
      texture,
      elapsed: 0,
      duration: 0.85
    });
  }

  // -------------------------------------------------------------
  // UPDATE LOOP
  // -------------------------------------------------------------

  update(deltaTime) {
    // 1. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.elapsed += deltaTime;
      const t = Math.min(1, p.elapsed / p.duration);

      p.mesh.position.lerpVectors(p.start, p.target, t);
      p.mesh.position.y += Math.sin(t * Math.PI) * p.arcHeight;

      if (t < 0.98) {
        const nextT = t + 0.02;
        const nextPos = p.start.clone().lerp(p.target, nextT);
        nextPos.y += Math.sin(nextT * Math.PI) * p.arcHeight;
        p.mesh.lookAt(nextPos);
      }

      if (p.isFireball || p.isMeteor) {
        p.mesh.rotation.x += deltaTime * 8;
        p.mesh.rotation.y += deltaTime * 8;
      }

      if (t >= 1) {
        if (p.onHit) p.onHit(p.target);
        if (p.isMeteor) {
          this.createExplosion(p.target, 0xff2200, 48, 4.5);
        } else if (p.isFireball) {
          this.createExplosion(p.target, 0xff3300, 24, p.radius || 2.5);
        } else {
          this.createExplosion(p.target, 0xffaa00, 6, 0.5);
        }
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // 2. Update Area Auras
    for (let i = this.areaAuras.length - 1; i >= 0; i--) {
      const aura = this.areaAuras[i];
      aura.elapsed += deltaTime;
      if (aura.pulse) {
        aura.mat.opacity = 0.35 + Math.sin(aura.elapsed * 8) * 0.15;
      }
      if (aura.elapsed >= aura.duration) {
        this.scene.remove(aura.mesh);
        this.areaAuras.splice(i, 1);
      }
    }

    // 3. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.age += deltaTime;
      pt.velocity.y -= 9.8 * deltaTime;
      pt.mesh.position.addScaledVector(pt.velocity, deltaTime);

      const ratio = 1 - pt.age / pt.lifetime;
      pt.mesh.material.opacity = ratio;
      pt.mesh.scale.setScalar(ratio);

      if (pt.age >= pt.lifetime) {
        this.scene.remove(pt.mesh);
        this.particles.splice(i, 1);
      }
    }

    // 4. Update Damage Texts
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const dt = this.damageTexts[i];
      dt.elapsed += deltaTime;
      dt.sprite.position.y += deltaTime * 1.5;

      const progress = dt.elapsed / dt.duration;
      dt.mat.opacity = 1 - progress;

      if (dt.elapsed >= dt.duration) {
        this.scene.remove(dt.sprite);
        dt.texture.dispose();
        dt.mat.dispose();
        this.damageTexts.splice(i, 1);
      }
    }
  }

  clear() {
    this.projectiles.forEach(p => this.scene.remove(p.mesh));
    this.projectiles = [];
    this.areaAuras.forEach(a => this.scene.remove(a.mesh));
    this.areaAuras = [];
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];
    this.damageTexts.forEach(dt => {
      this.scene.remove(dt.sprite);
      dt.texture.dispose();
      dt.mat.dispose();
    });
    this.damageTexts = [];
    this.hpBars.forEach(bar => this.scene.remove(bar.group));
    this.hpBars.clear();
    this.laserBeams.forEach(l => this.scene.remove(l.mesh));
    this.laserBeams.clear();
  }
}
