import * as THREE from 'three';

/**
 * 3D 競技場、多視角相機切換器、看台動態觀眾與慢動作特寫鏡頭
 */

export class Arena3D {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundPlane = null;
    this.waterMesh = null;
    this.deploymentZone = null;
    this.clock = new THREE.Clock();

    // Spectator Meshes list
    this.spectators = [];

    // Camera Mode: 'classic' | 'king' | 'topdown'
    this.cameraMode = 'classic';
    this.targetCameraPos = new THREE.Vector3(0, 26, 22);
    this.targetCameraLook = new THREE.Vector3(0, 0, 1.5);
    this.currentLookAt = new THREE.Vector3(0, 0, 1.5);

    // Screen Shake Effect
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeElapsed = 0;

    // Mobile & Performance Profiler
    this.isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
    this.lastFpsCheck = 0;
    this.frameCount = 0;
    this.currentFps = 60;

    this.initScene();
    this.buildLighting();
    this.buildTerrain();
    this.buildBridges();
    this.buildEnvironment();
    this.buildSpectators();
    this.setupResizeListener();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1020);
    this.scene.fog = new THREE.FogExp2(0x0a1020, 0.012);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 120);
    this.camera.position.set(0, 26, 22);
    this.camera.lookAt(0, 0, 1.5);

    // Mobile-optimized high performance renderer
    const maxDpr = this.isMobile ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isMobile, // On mobile, disable MSAA for 60fps butter smooth gameplay
      alpha: false,
      powerPreference: "high-performance",
      precision: this.isMobile ? "mediump" : "highp"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(maxDpr);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.container.appendChild(this.renderer.domElement);
  }

  triggerScreenShake(intensity = 0.6, duration = 0.35) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeElapsed = 0;
  }

  buildLighting() {
    const ambient = new THREE.AmbientLight(0xdbe6ff, 0.75);
    this.scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xfff7e0, 1.5);
    sunLight.position.set(16, 32, 14);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 65;
    sunLight.shadow.camera.left = -16;
    sunLight.shadow.camera.right = 16;
    sunLight.shadow.camera.top = 24;
    sunLight.shadow.camera.bottom = -24;
    sunLight.shadow.bias = -0.0004;
    this.scene.add(sunLight);

    const blueRim = new THREE.PointLight(0x2a75ff, 1.4, 28);
    blueRim.position.set(0, 7, 15);
    this.scene.add(blueRim);

    const redRim = new THREE.PointLight(0xff3355, 1.4, 28);
    redRim.position.set(0, 7, -15);
    this.scene.add(redRim);
  }

  buildTerrain() {
    const grassGeo = new THREE.PlaneGeometry(18, 32, 36, 64);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x478c35,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });

    const field = new THREE.Mesh(grassGeo, grassMat);
    field.rotation.x = -Math.PI / 2;
    field.receiveShadow = true;
    this.scene.add(field);
    this.groundPlane = field;

    const redOverlayGeo = new THREE.PlaneGeometry(18, 14.5);
    const redOverlayMat = new THREE.MeshStandardMaterial({
      color: 0x497637,
      roughness: 0.85,
      flatShading: true
    });
    const redField = new THREE.Mesh(redOverlayGeo, redOverlayMat);
    redField.rotation.x = -Math.PI / 2;
    redField.position.set(0, 0.01, -8.6);
    redField.receiveShadow = true;
    this.scene.add(redField);

    // River
    const riverGeo = new THREE.PlaneGeometry(24, 2.8, 20, 4);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x1686cb,
      roughness: 0.1,
      metalness: 0.7,
      transparent: true,
      opacity: 0.88
    });
    this.waterMesh = new THREE.Mesh(riverGeo, riverMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(0, -0.05, 0);
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    // River banks
    const bankGeo = new THREE.BoxGeometry(24, 0.2, 0.3);
    const bankMat = new THREE.MeshStandardMaterial({ color: 0x6e7888, roughness: 0.9 });
    
    const bankNorth = new THREE.Mesh(bankGeo, bankMat);
    bankNorth.position.set(0, 0.05, -1.45);
    bankNorth.receiveShadow = true;
    this.scene.add(bankNorth);

    const bankSouth = new THREE.Mesh(bankGeo, bankMat);
    bankSouth.position.set(0, 0.05, 1.45);
    bankSouth.receiveShadow = true;
    this.scene.add(bankSouth);

    // Deployment Indicator Plane
    const deployGeo = new THREE.PlaneGeometry(18, 14);
    const deployMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    this.deploymentZone = new THREE.Mesh(deployGeo, deployMat);
    this.deploymentZone.rotation.x = -Math.PI / 2;
    this.deploymentZone.position.set(0, 0.03, 8.5);
    this.scene.add(this.deploymentZone);
  }

  buildBridges() {
    const bridgeWidth = 2.4;
    const bridgeLength = 3.6;
    const bridgeGeo = new THREE.BoxGeometry(bridgeWidth, 0.25, bridgeLength);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x937c62,
      roughness: 0.7,
      metalness: 0.1
    });

    const railGeo = new THREE.BoxGeometry(0.2, 0.45, bridgeLength);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x5a4330, roughness: 0.8 });

    [-4.5, 4.5].forEach(x => {
      const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridge.position.set(x, 0.05, 0);
      bridge.castShadow = true;
      bridge.receiveShadow = true;
      this.scene.add(bridge);

      const railL = new THREE.Mesh(railGeo, railMat);
      railL.position.set(x - bridgeWidth / 2 + 0.1, 0.35, 0);
      railL.castShadow = true;
      this.scene.add(railL);

      const railR = new THREE.Mesh(railGeo, railMat);
      railR.position.set(x + bridgeWidth / 2 - 0.1, 0.35, 0);
      railR.castShadow = true;
      this.scene.add(railR);
    });
  }

  buildEnvironment() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3b4759, roughness: 0.85 });
    
    // Left & Right boundary walls
    const sideWallGeo = new THREE.BoxGeometry(1.6, 2.2, 36);
    const wallL = new THREE.Mesh(sideWallGeo, wallMat);
    wallL.position.set(-10, 0.9, 0);
    wallL.receiveShadow = true;
    wallL.castShadow = true;
    this.scene.add(wallL);

    const wallR = new THREE.Mesh(sideWallGeo, wallMat);
    wallR.position.set(10, 0.9, 0);
    wallR.receiveShadow = true;
    wallR.castShadow = true;
    this.scene.add(wallR);

    // End walls
    const endWallGeo = new THREE.BoxGeometry(22, 2.5, 1.6);
    const wallN = new THREE.Mesh(endWallGeo, wallMat);
    wallN.position.set(0, 1.0, -17);
    this.scene.add(wallN);

    const wallS = new THREE.Mesh(endWallGeo, wallMat);
    wallS.position.set(0, 1.0, 17);
    this.scene.add(wallS);

    // Banners
    this.createBanner(-9.1, 16, 0x1e60ff);
    this.createBanner(9.1, 16, 0x1e60ff);
    this.createBanner(-9.1, -16, 0xff2a55);
    this.createBanner(9.1, -16, 0xff2a55);
  }

  createBanner(x, z, colorHex) {
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 4.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x, 2.25, z);
    pole.castShadow = true;
    this.scene.add(pole);

    const flagGeo = new THREE.BoxGeometry(0.05, 1.4, 1.8);
    const flagMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(x + (x > 0 ? -0.9 : 0.9), 3.4, z);
    this.scene.add(flag);
  }

  // -------------------------------------------------------------
  // 3D CHEERING SPECTATORS
  // -------------------------------------------------------------

  buildSpectators() {
    const specMatBlue = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    const specMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const specMatGoblin = new THREE.MeshStandardMaterial({ color: 0x54b53a });

    // Left Stand Spectators
    for (let z = -14; z <= 14; z += 2.5) {
      const isBlue = z > 0;
      const mat = Math.random() > 0.4 ? (isBlue ? specMatBlue : specMatRed) : specMatGoblin;
      const specGroup = new THREE.Group();

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.6, 6), mat);
      body.position.y = 0.3;
      specGroup.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), mat);
      head.position.y = 0.7;
      specGroup.add(head);

      // Mini Flag
      const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      flagPole.position.set(0.25, 0.6, 0.1);
      flagPole.rotation.z = -0.3;
      specGroup.add(flagPole);

      specGroup.position.set(-10.2, 1.8, z);
      this.scene.add(specGroup);

      this.spectators.push({
        group: specGroup,
        baseY: 1.8,
        phase: Math.random() * Math.PI * 2,
        speed: 3 + Math.random() * 4
      });
    }

    // Right Stand Spectators
    for (let z = -14; z <= 14; z += 2.5) {
      const isBlue = z > 0;
      const mat = Math.random() > 0.4 ? (isBlue ? specMatBlue : specMatRed) : specMatGoblin;
      const specGroup = new THREE.Group();

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.6, 6), mat);
      body.position.y = 0.3;
      specGroup.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), mat);
      head.position.y = 0.7;
      specGroup.add(head);

      specGroup.position.set(10.2, 1.8, z);
      this.scene.add(specGroup);

      this.spectators.push({
        group: specGroup,
        baseY: 1.8,
        phase: Math.random() * Math.PI * 2,
        speed: 3 + Math.random() * 4
      });
    }
  }

  // -------------------------------------------------------------
  // CAMERA MODES (Classic / King POV / Top-Down)
  // -------------------------------------------------------------

  cycleCameraMode() {
    if (this.cameraMode === 'classic') this.setCameraMode('king');
    else if (this.cameraMode === 'king') this.setCameraMode('topdown');
    else this.setCameraMode('classic');
    return this.cameraMode;
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    this.isCinematic = false;

    if (mode === 'classic') {
      this.targetCameraPos.set(0, 26, 22);
      this.targetCameraLook.set(0, 0, 1.5);
    } else if (mode === 'king') {
      this.targetCameraPos.set(0, 6.5, 14.0);
      this.targetCameraLook.set(0, 2.0, -4.0);
    } else if (mode === 'topdown') {
      this.targetCameraPos.set(0, 32, 0.5);
      this.targetCameraLook.set(0, 0, 0);
    }
  }

  startCinematicKillCam(targetPos) {
    this.isCinematic = true;
    this.cinematicTarget = targetPos.clone();
    this.cinematicTime = 0;
  }

  setDeploymentVisual(active, isValid = true) {
    if (!this.deploymentZone) return;
    if (!active) {
      this.deploymentZone.material.opacity = 0;
      return;
    }
    this.deploymentZone.material.opacity = 0.25;
    this.deploymentZone.material.color.setHex(isValid ? 0x00ff88 : 0xff2a55);
  }

  getArenaIntersection(clientX, clientY) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    if (!this.groundPlane) return null;

    const intersects = this.raycaster.intersectObject(this.groundPlane);
    if (intersects.length > 0) {
      return {
        x: Math.max(-8.5, Math.min(8.5, intersects[0].point.x)),
        z: Math.max(-15.5, Math.min(15.5, intersects[0].point.z))
      };
    }
    return null;
  }

  setupResizeListener() {
    window.addEventListener('resize', () => {
      if (!this.camera || !this.renderer) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  render(deltaTime) {
    const time = this.clock.getElapsedTime();

    // River wave
    if (this.waterMesh) {
      this.waterMesh.position.y = -0.05 + Math.sin(time * 2.5) * 0.02;
    }

    // Spectator Jumping Animation
    this.spectators.forEach(s => {
      s.group.position.y = s.baseY + Math.abs(Math.sin(time * s.speed + s.phase)) * 0.25;
    });

    // Camera Smooth Interpolation
    if (this.isCinematic && this.cinematicTarget) {
      this.cinematicTime += deltaTime;
      const camPos = this.cinematicTarget.clone().add(new THREE.Vector3(
        Math.sin(this.cinematicTime) * 6,
        4.0,
        Math.cos(this.cinematicTime) * 6
      ));
      this.camera.position.lerp(camPos, 0.08);
      this.currentLookAt.lerp(this.cinematicTarget, 0.08);
    } else {
      this.camera.position.lerp(this.targetCameraPos, 0.08);
      this.currentLookAt.lerp(this.targetCameraLook, 0.08);
    }

    // Screen Shake Offset Calculation
    if (this.shakeElapsed < this.shakeDuration) {
      this.shakeElapsed += deltaTime;
      const progress = 1 - (this.shakeElapsed / this.shakeDuration);
      const currentIntensity = this.shakeIntensity * progress;
      const shakeOffset = new THREE.Vector3(
        (Math.random() - 0.5) * 2 * currentIntensity,
        (Math.random() - 0.5) * 2 * currentIntensity,
        (Math.random() - 0.5) * 2 * currentIntensity
      );
      this.camera.position.add(shakeOffset);
    }

    this.camera.lookAt(this.currentLookAt);
    this.renderer.render(this.scene, this.camera);
  }
}
