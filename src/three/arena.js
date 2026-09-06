import * as THREE from 'three';

/**
 * 3D 競技場 (AAA 次世代殿堂級戰場)、多視角相機切換器、動態水流與慢動作特寫鏡頭
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

    // Environment & Particle elements
    this.spectators = [];
    this.ambientParticles = null;
    this.riverFoamMeshes = [];
    this.torches = [];
    this.flags = [];

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

    this.initScene();
    this.buildLighting();
    this.buildTerrain();
    this.buildBridges();
    this.buildEnvironment();
    this.buildSpectators();
    this.buildAtmosphericParticles();
    this.setupResizeListener();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1428);
    this.scene.fog = new THREE.FogExp2(0x0a1428, 0.009);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.5, 200);
    this.camera.position.set(0, 26, 22);
    this.camera.lookAt(0, 0, 1.5);

    const maxDpr = this.isMobile ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      precision: "highp"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(maxDpr);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    this.container.appendChild(this.renderer.domElement);
  }

  triggerScreenShake(intensity = 0.6, duration = 0.35) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeElapsed = 0;
  }

  buildLighting() {
    // 1. Ambient Lighting (Rich Sky / Ground gradient simulation)
    const ambient = new THREE.AmbientLight(0xdde8ff, 0.85);
    this.scene.add(ambient);

    const hemiLight = new THREE.HemisphereLight(0x7fb2ff, 0x3d4b30, 0.45);
    this.scene.add(hemiLight);

    // 2. High Quality Directional Sun Light with crisp soft shadows
    const sunLight = new THREE.DirectionalLight(0xfff5dd, 1.75);
    sunLight.position.set(18, 36, 16);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 75;
    sunLight.shadow.camera.left = -18;
    sunLight.shadow.camera.right = 18;
    sunLight.shadow.camera.top = 26;
    sunLight.shadow.camera.bottom = -26;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.radius = 2.5;
    this.scene.add(sunLight);

    // 3. Team Zone Volumetric Accent Lighting
    const blueRim = new THREE.PointLight(0x3882ff, 1.8, 32, 1.2);
    blueRim.position.set(0, 8, 14);
    this.scene.add(blueRim);

    const redRim = new THREE.PointLight(0xff3355, 1.8, 32, 1.2);
    redRim.position.set(0, 8, -14);
    this.scene.add(redRim);

    // 4. Center River Water Glow
    const riverLight = new THREE.PointLight(0x00f0ff, 1.2, 18, 1.5);
    riverLight.position.set(0, 1.5, 0);
    this.scene.add(riverLight);
  }

  createProceduralFieldTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // Base Grass Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 2048);
    grad.addColorStop(0, '#3a6828');    // Red territory darker verdant
    grad.addColorStop(0.48, '#447d30'); // River border north
    grad.addColorStop(0.52, '#458231'); // River border south
    grad.addColorStop(1, '#4c8a37');    // Blue territory lush emerald
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 2048);

    // Checkerboard Lawn Stripes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    const stripeCount = 28;
    const stripeHeight = 2048 / stripeCount;
    for (let i = 0; i < stripeCount; i += 2) {
      ctx.fillRect(0, i * stripeHeight, 1024, stripeHeight);
    }

    // Cobblestone Stone Paths to Bridges
    ctx.fillStyle = 'rgba(150, 135, 115, 0.35)';
    ctx.strokeStyle = 'rgba(80, 70, 60, 0.3)';
    ctx.lineWidth = 4;

    // Left Lane Path
    ctx.beginPath();
    ctx.moveTo(256, 120);
    ctx.lineTo(256, 1928);
    ctx.stroke();

    // Right Lane Path
    ctx.beginPath();
    ctx.moveTo(768, 120);
    ctx.lineTo(768, 1928);
    ctx.stroke();

    // Center Cross Circle
    ctx.beginPath();
    ctx.arc(512, 1024, 180, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Royal Crest Inlays
    ctx.fillStyle = 'rgba(30, 96, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(512, 1600, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 42, 85, 0.12)';
    ctx.beginPath();
    ctx.arc(512, 448, 120, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  buildTerrain() {
    const fieldTex = this.createProceduralFieldTexture();
    const grassGeo = new THREE.PlaneGeometry(18.4, 32.8, 48, 80);
    const grassMat = new THREE.MeshStandardMaterial({
      map: fieldTex,
      roughness: 0.72,
      metalness: 0.08
    });

    const field = new THREE.Mesh(grassGeo, grassMat);
    field.rotation.x = -Math.PI / 2;
    field.receiveShadow = true;
    this.scene.add(field);
    this.groundPlane = field;

    // Outer Cliff Rim Base (Depth beneath arena)
    const baseRockGeo = new THREE.BoxGeometry(22, 6, 36);
    const baseRockMat = new THREE.MeshStandardMaterial({
      color: 0x222a36,
      roughness: 0.9,
      metalness: 0.2
    });
    const baseRock = new THREE.Mesh(baseRockGeo, baseRockMat);
    baseRock.position.y = -3.02;
    baseRock.receiveShadow = true;
    this.scene.add(baseRock);

    // River Bed Chasm
    const riverBedGeo = new THREE.BoxGeometry(20, 0.8, 3.4);
    const riverBedMat = new THREE.MeshStandardMaterial({
      color: 0x1a2634,
      roughness: 0.95
    });
    const riverBed = new THREE.Mesh(riverBedGeo, riverBedMat);
    riverBed.position.set(0, -0.4, 0);
    riverBed.receiveShadow = true;
    this.scene.add(riverBed);

    // River Water Mesh
    const riverGeo = new THREE.PlaneGeometry(24, 3.2, 36, 12);
    const riverMat = new THREE.MeshPhysicalMaterial({
      color: 0x1292e8,
      emissive: 0x073b66,
      emissiveIntensity: 0.25,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.6,
      ior: 1.333,
      transparent: true,
      opacity: 0.92
    });
    this.waterMesh = new THREE.Mesh(riverGeo, riverMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(0, -0.06, 0);
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    // River Banks & Masonry Edges
    const bankGeo = new THREE.BoxGeometry(20, 0.28, 0.45);
    const bankMat = new THREE.MeshStandardMaterial({
      color: 0x616c7d,
      roughness: 0.82,
      metalness: 0.15
    });

    const bankNorth = new THREE.Mesh(bankGeo, bankMat);
    bankNorth.position.set(0, 0.08, -1.6);
    bankNorth.receiveShadow = true;
    bankNorth.castShadow = true;
    this.scene.add(bankNorth);

    const bankSouth = new THREE.Mesh(bankGeo, bankMat);
    bankSouth.position.set(0, 0.08, 1.6);
    bankSouth.receiveShadow = true;
    bankSouth.castShadow = true;
    this.scene.add(bankSouth);

    // River Stones & Lilies
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.8 });
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x386b30, roughness: 0.9 });

    [
      [-7.5, 0.4, 0.5], [-2, -0.6, 0.35], [2.2, 0.7, 0.4], [7.2, -0.5, 0.55],
      [-1.2, 0.8, 0.25], [1.5, -0.7, 0.3]
    ].forEach(([x, z, r]) => {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), stoneMat);
      stone.position.set(x, -0.08, z);
      stone.rotation.set(Math.random(), Math.random(), Math.random());
      stone.receiveShadow = true;
      this.scene.add(stone);

      if (Math.random() > 0.4) {
        const moss = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.7, 0.04, 8), mossMat);
        moss.position.set(x, -0.02, z);
        this.scene.add(moss);
      }
    });

    // Deployment Indicator Plane
    const deployGeo = new THREE.PlaneGeometry(18, 14.5);
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
    const bridgeWidth = 2.6;
    const bridgeLength = 3.8;

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x8a7a69,
      roughness: 0.75,
      metalness: 0.12
    });
    const darkStoneMat = new THREE.MeshStandardMaterial({
      color: 0x54493e,
      roughness: 0.85
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffcb36,
      roughness: 0.25,
      metalness: 0.85
    });

    [-4.5, 4.5].forEach(x => {
      const bridgeGroup = new THREE.Group();
      bridgeGroup.position.set(x, 0, 0);

      // Arch Base
      const archGeo = new THREE.CylinderGeometry(bridgeLength / 2, bridgeLength / 2, bridgeWidth, 24, 1, false, 0, Math.PI);
      const arch = new THREE.Mesh(archGeo, darkStoneMat);
      arch.rotation.z = Math.PI / 2;
      arch.rotation.y = Math.PI / 2;
      arch.position.y = -0.3;
      bridgeGroup.add(arch);

      // Main Deck Roadway
      const deckGeo = new THREE.BoxGeometry(bridgeWidth, 0.32, bridgeLength);
      const deck = new THREE.Mesh(deckGeo, stoneMat);
      deck.position.y = 0.12;
      deck.castShadow = true;
      deck.receiveShadow = true;
      bridgeGroup.add(deck);

      // Wooden Plank Texture overlay
      const plankGeo = new THREE.BoxGeometry(bridgeWidth - 0.3, 0.04, bridgeLength - 0.2);
      const plankMat = new THREE.MeshStandardMaterial({ color: 0x6e5138, roughness: 0.8 });
      const planks = new THREE.Mesh(plankGeo, plankMat);
      planks.position.y = 0.3;
      planks.receiveShadow = true;
      bridgeGroup.add(planks);

      // Side Balustrades & Pillars
      [-bridgeWidth / 2 + 0.12, bridgeWidth / 2 - 0.12].forEach(px => {
        const railGeo = new THREE.BoxGeometry(0.24, 0.52, bridgeLength);
        const rail = new THREE.Mesh(railGeo, darkStoneMat);
        rail.position.set(px, 0.48, 0);
        rail.castShadow = true;
        bridgeGroup.add(rail);

        // Stone Pillars at bridge corners
        [-bridgeLength / 2 + 0.15, bridgeLength / 2 - 0.15].forEach(pz => {
          const pillarGeo = new THREE.BoxGeometry(0.36, 0.85, 0.36);
          const pillar = new THREE.Mesh(pillarGeo, stoneMat);
          pillar.position.set(px, 0.55, pz);
          pillar.castShadow = true;
          bridgeGroup.add(pillar);

          const capGeo = new THREE.ConeGeometry(0.25, 0.22, 4);
          const cap = new THREE.Mesh(capGeo, goldMat);
          cap.position.set(px, 1.05, pz);
          cap.rotation.y = Math.PI / 4;
          bridgeGroup.add(cap);

          // Glowing Lanterns
          const lantern = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 12, 12),
            new THREE.MeshStandardMaterial({
              color: 0xffe680,
              emissive: 0xffaa00,
              emissiveIntensity: 2.0
            })
          );
          lantern.position.set(px, 0.75, pz);
          bridgeGroup.add(lantern);
        });
      });

      this.scene.add(bridgeGroup);
    });
  }

  buildEnvironment() {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x3d4756,
      roughness: 0.8,
      metalness: 0.2
    });
    const stoneTrimMat = new THREE.MeshStandardMaterial({
      color: 0x586478,
      roughness: 0.7
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffc73b,
      roughness: 0.25,
      metalness: 0.85
    });

    // 1. Stately Castle Walls Left & Right
    [-10.2, 10.2].forEach(x => {
      const wallGroup = new THREE.Group();
      wallGroup.position.set(x, 0, 0);

      const mainWall = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.8, 36), wallMat);
      mainWall.position.y = 1.2;
      mainWall.castShadow = true;
      mainWall.receiveShadow = true;
      wallGroup.add(mainWall);

      const topCoping = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.3, 36.2), stoneTrimMat);
      topCoping.position.y = 2.65;
      wallGroup.add(topCoping);

      // Crenellations / Battlements
      for (let z = -17; z <= 17; z += 1.8) {
        const crenel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.9), stoneTrimMat);
        crenel.position.set(0, 3.0, z);
        crenel.castShadow = true;
        wallGroup.add(crenel);
      }

      this.scene.add(wallGroup);
    });

    // 2. North & South Fortress Walls
    [-17.2, 17.2].forEach(z => {
      const endWall = new THREE.Mesh(new THREE.BoxGeometry(22.2, 3.2, 2.0), wallMat);
      endWall.position.set(0, 1.4, z);
      endWall.castShadow = true;
      endWall.receiveShadow = true;
      this.scene.add(endWall);

      const endTrim = new THREE.Mesh(new THREE.BoxGeometry(22.6, 0.35, 2.3), stoneTrimMat);
      endTrim.position.set(0, 3.1, z);
      this.scene.add(endTrim);
    });

    // 3. Four Grand Corner Watchtowers
    [
      [-10.2, -17.2], [10.2, -17.2],
      [-10.2, 17.2], [10.2, 17.2]
    ].forEach(([tx, tz]) => {
      const tower = new THREE.Group();
      tower.position.set(tx, 0, tz);

      const tBody = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 5.5, 16), wallMat);
      tBody.position.y = 2.75;
      tBody.castShadow = true;
      tBody.receiveShadow = true;
      tower.add(tBody);

      const tRoof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 2.2, 16), new THREE.MeshStandardMaterial({
        color: tz > 0 ? 0x1e50b8 : 0xab1832,
        roughness: 0.5
      }));
      tRoof.position.y = 6.4;
      tRoof.castShadow = true;
      tower.add(tRoof);

      const tSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 8), goldMat);
      tSpire.position.y = 7.8;
      tower.add(tSpire);

      this.scene.add(tower);
    });

    // 4. Grand Team Banners
    this.createBanner(-9.2, 15, 0x1e68ff, true);
    this.createBanner(9.2, 15, 0x1e68ff, false);
    this.createBanner(-9.2, -15, 0xff2850, true);
    this.createBanner(9.2, -15, 0xff2850, false);

    // 5. Surrounding Fantasy Foliage & Pine Trees
    this.buildSurroundingForest();
  }

  createBanner(x, z, colorHex, isLeft) {
    const bannerGroup = new THREE.Group();
    bannerGroup.position.set(x, 0, z);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 5.8, 12),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 })
    );
    pole.position.y = 2.9;
    pole.castShadow = true;
    bannerGroup.add(pole);

    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffd23d, metalness: 0.9 }));
    finial.position.y = 5.8;
    bannerGroup.add(finial);

    // Silk Banner Cloth with wave
    const flagGeo = new THREE.PlaneGeometry(1.6, 2.8, 16, 16);
    const flagMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(isLeft ? 0.85 : -0.85, 4.2, 0);
    flag.castShadow = true;
    bannerGroup.add(flag);

    this.flags.push({ mesh: flag, phase: Math.random() * Math.PI * 2 });
    this.scene.add(bannerGroup);
  }

  buildSurroundingForest() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3219, roughness: 0.85 });
    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x235221, roughness: 0.7 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x2d6829, roughness: 0.65 });

    const treePositions = [
      [-13.5, -12], [-14.2, -6], [-15, 0], [-13.8, 7], [-14.5, 13],
      [13.5, -12], [14.2, -6], [15, 0], [13.8, 7], [14.5, 13],
      [-6, -20.5], [0, -21], [6, -20.5],
      [-6, 20.5], [0, 21], [6, 20.5]
    ];

    treePositions.forEach(([x, z]) => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      const scale = 0.8 + Math.random() * 0.45;
      tree.scale.set(scale, scale, scale);

      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 2.0, 10), trunkMat);
      trunk.position.y = 1.0;
      trunk.castShadow = true;
      tree.add(trunk);

      // Foliage Cones
      [
        { r: 2.0, h: 2.2, y: 2.4, mat: leafMat1 },
        { r: 1.6, h: 2.0, y: 3.6, mat: leafMat2 },
        { r: 1.1, h: 1.6, y: 4.7, mat: leafMat1 }
      ].forEach(tier => {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(tier.r, tier.h, 10), tier.mat);
        cone.position.y = tier.y;
        cone.castShadow = true;
        cone.receiveShadow = true;
        tree.add(cone);
      });

      this.scene.add(tree);
    });
  }

  buildSpectators() {
    const specMatBlue = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.5 });
    const specMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
    const specMatGoblin = new THREE.MeshStandardMaterial({ color: 0x54b53a, roughness: 0.5 });
    const specMatGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6 });

    [-10.4, 10.4].forEach(standX => {
      for (let z = -14; z <= 14; z += 2.2) {
        const isBlue = z > 0;
        const mat = Math.random() > 0.4 ? (isBlue ? specMatBlue : specMatRed) : (Math.random() > 0.5 ? specMatGoblin : specMatGold);
        const specGroup = new THREE.Group();

        // Stylized Cute Spectator
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.7, 12), mat);
        body.position.y = 0.35;
        specGroup.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.5 }));
        head.position.y = 0.85;
        specGroup.add(head);

        // Mini Helmet / Cap
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.22, 10), mat);
        cap.position.y = 1.05;
        specGroup.add(cap);

        // Cheering Flag / Horn
        const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        flagPole.position.set(0.28, 0.7, 0.1);
        flagPole.rotation.z = -0.35;
        specGroup.add(flagPole);

        const flagCloth = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.25), mat);
        flagCloth.position.set(0.42, 1.05, 0.1);
        specGroup.add(flagCloth);

        specGroup.position.set(standX, 2.8, z);
        this.scene.add(specGroup);

        this.spectators.push({
          group: specGroup,
          baseY: 2.8,
          phase: Math.random() * Math.PI * 2,
          speed: 3.5 + Math.random() * 4.5
        });
      }
    });
  }

  buildAtmosphericParticles() {
    const particleCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = 0.5 + Math.random() * 8.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 36;

      // Golden magical dust
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.85 + Math.random() * 0.15;
      colors[i * 3 + 2] = 0.3 + Math.random() * 0.4;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.ambientParticles = new THREE.Points(geometry, material);
    this.scene.add(this.ambientParticles);
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
    this.cinematicTarget = null;
    this.cinematicTime = 0;

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

  resetCamera(immediate = false) {
    this.isCinematic = false;
    this.cinematicTarget = null;
    this.cinematicTime = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeElapsed = 0;

    this.setCameraMode(this.cameraMode || 'classic');

    if (immediate && this.camera) {
      this.camera.position.copy(this.targetCameraPos);
      this.currentLookAt.copy(this.targetCameraLook);
      this.camera.lookAt(this.currentLookAt);
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
    this.deploymentZone.material.opacity = 0.28;
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
    const updateCam = () => {
      if (!this.camera || !this.renderer) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / height;
      this.camera.aspect = aspect;

      if (aspect < 1.0) {
        this.camera.fov = Math.max(48, Math.min(64, 48 / (aspect * 1.15)));
        if (this.cameraMode === 'classic') {
          this.targetCameraPos.set(0, 30, 25);
          this.targetCameraLook.set(0, 0, 0);
        }
      } else {
        this.camera.fov = 45;
        if (this.cameraMode === 'classic') {
          this.targetCameraPos.set(0, 26, 22);
          this.targetCameraLook.set(0, 0, 1.5);
        }
      }
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };

    window.addEventListener('resize', updateCam);
    window.addEventListener('orientationchange', updateCam);
    updateCam();
  }

  render(deltaTime) {
    const time = this.clock.getElapsedTime();

    // 1. River dynamic undulating wave & caustics
    if (this.waterMesh) {
      this.waterMesh.position.y = -0.06 + Math.sin(time * 2.2) * 0.025;
    }

    // 2. Cloth Banner wind simulation
    this.flags.forEach(f => {
      f.mesh.rotation.y = Math.sin(time * 3.0 + f.phase) * 0.25;
    });

    // 3. Cheering Spectators Dynamic Bounce
    this.spectators.forEach(s => {
      s.group.position.y = s.baseY + Math.abs(Math.sin(time * s.speed + s.phase)) * 0.35;
    });

    // 4. Magical Ambient Dust Movement
    if (this.ambientParticles) {
      const pos = this.ambientParticles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] += 0.015;
        if (pos[i + 1] > 8.0) pos[i + 1] = 0.5;
        pos[i] += Math.sin(time + i) * 0.005;
      }
      this.ambientParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 5. Camera Smooth Lerping
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

    // 6. Screen Shake Offset
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
