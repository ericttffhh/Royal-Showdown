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
    this.buildPlacementGhost();
    this.buildHazards();
    this.buildBrawlColosseum();
    this.setupResizeListener();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1428);
    this.scene.fog = new THREE.FogExp2(0x0a1428, 0.009);

    this.classicGroup = new THREE.Group();
    this.brawlGroup = new THREE.Group();
    this.scene.add(this.classicGroup);
    this.scene.add(this.brawlGroup);
    this.brawlGroup.visible = false;

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
    sunLight.shadow.camera.far = 95;
    sunLight.shadow.camera.left = -26;
    sunLight.shadow.camera.right = 26;
    sunLight.shadow.camera.top = 28;
    sunLight.shadow.camera.bottom = -28;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.radius = 2.5;
    this.scene.add(sunLight);

    // 3. Team Zone Volumetric Accent Lighting (Classic Mode)
    const blueRim = new THREE.PointLight(0x3882ff, 1.8, 32, 1.2);
    blueRim.position.set(0, 8, 14);
    this.classicGroup.add(blueRim);

    const redRim = new THREE.PointLight(0xff3355, 1.8, 32, 1.2);
    redRim.position.set(0, 8, -14);
    this.classicGroup.add(redRim);

    // 4. Center River Water Glow (Classic Mode)
    const riverLight = new THREE.PointLight(0x00f0ff, 1.2, 18, 1.5);
    riverLight.position.set(0, 1.5, 0);
    this.classicGroup.add(riverLight);
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
    this.classicGroup.add(field);
    this.groundPlane = field;
    this.classicGroundPlane = field;

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
    this.classicGroup.add(baseRock);

    // River Bed Chasm
    const riverBedGeo = new THREE.BoxGeometry(20, 0.8, 3.4);
    const riverBedMat = new THREE.MeshStandardMaterial({
      color: 0x1a2634,
      roughness: 0.95
    });
    const riverBed = new THREE.Mesh(riverBedGeo, riverBedMat);
    riverBed.position.set(0, -0.4, 0);
    riverBed.receiveShadow = true;
    this.classicGroup.add(riverBed);

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
    this.classicGroup.add(this.waterMesh);

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
    this.classicGroup.add(bankNorth);

    const bankSouth = new THREE.Mesh(bankGeo, bankMat);
    bankSouth.position.set(0, 0.08, 1.6);
    bankSouth.receiveShadow = true;
    bankSouth.castShadow = true;
    this.classicGroup.add(bankSouth);

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
      this.classicGroup.add(stone);

      if (Math.random() > 0.4) {
        const moss = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.7, 0.04, 8), mossMat);
        moss.position.set(x, -0.02, z);
        this.classicGroup.add(moss);
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
    this.classicGroup.add(this.deploymentZone);
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

      this.classicGroup.add(bridgeGroup);
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

      this.classicGroup.add(wallGroup);
    });

    // 2. North & South Fortress Walls
    [-17.2, 17.2].forEach(z => {
      const endWall = new THREE.Mesh(new THREE.BoxGeometry(22.2, 3.2, 2.0), wallMat);
      endWall.position.set(0, 1.4, z);
      endWall.castShadow = true;
      endWall.receiveShadow = true;
      this.classicGroup.add(endWall);

      const endTrim = new THREE.Mesh(new THREE.BoxGeometry(22.6, 0.35, 2.3), stoneTrimMat);
      endTrim.position.set(0, 3.1, z);
      this.classicGroup.add(endTrim);
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

      this.classicGroup.add(tower);
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
    this.classicGroup.add(bannerGroup);
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

      this.classicGroup.add(tree);
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
        this.classicGroup.add(specGroup);

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

  buildPlacementGhost() {
    this.placementGhost = new THREE.Group();
    this.placementGhost.position.set(0, 0.05, 0);
    this.placementGhost.visible = false;

    // Outer rotating neon ring
    const ringGeo = new THREE.RingGeometry(1.0, 1.18, 32);
    this.ghostRingMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    this.ghostRingMesh = new THREE.Mesh(ringGeo, this.ghostRingMat);
    this.ghostRingMesh.rotation.x = -Math.PI / 2;
    this.placementGhost.add(this.ghostRingMesh);

    // Inner soft glow circle
    const innerGeo = new THREE.CircleGeometry(1.0, 32);
    this.ghostInnerMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide
    });
    this.ghostInnerMesh = new THREE.Mesh(innerGeo, this.ghostInnerMat);
    this.ghostInnerMesh.rotation.x = -Math.PI / 2;
    this.placementGhost.add(this.ghostInnerMesh);

    this.scene.add(this.placementGhost);
  }

  updatePlacementGhost(pos, isValid = true, radius = 1.0) {
    if (!this.placementGhost) return;
    this.placementGhost.visible = true;
    this.placementGhost.position.set(pos.x, 0.05, pos.z);

    const scale = Math.max(0.6, radius);
    this.placementGhost.scale.set(scale, 1, scale);

    const color = isValid ? 0x00ff88 : 0xff2a55;
    this.ghostRingMat.color.setHex(color);
    this.ghostInnerMat.color.setHex(color);
    this.ghostInnerMat.opacity = isValid ? 0.24 : 0.45;
  }

  hidePlacementGhost() {
    if (this.placementGhost) {
      this.placementGhost.visible = false;
    }
  }

  buildHazards() {
    // 1. Blizzard snow particles
    const snowCount = 400;
    const snowGeo = new THREE.BufferGeometry();
    const snowPositions = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount; i++) {
      snowPositions[i * 3] = (Math.random() - 0.5) * 26;
      snowPositions[i * 3 + 1] = Math.random() * 16;
      snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 36;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    this.snowMat = new THREE.PointsMaterial({
      color: 0xe0f7fa,
      size: 0.32,
      transparent: true,
      opacity: 0.0
    });
    this.blizzardParticles = new THREE.Points(snowGeo, this.snowMat);
    this.scene.add(this.blizzardParticles);
    this.blizzardActive = false;

    // 2. River Elixir Runes (Two floating glowing crystals in classic river)
    this.elixirRunes = [];
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0xd500f9,
      emissive: 0xaa00ff,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.8
    });

    [-4.5, 4.5].forEach((x) => {
      const runeGroup = new THREE.Group();
      runeGroup.position.set(x, 0.45, 0);

      const gemMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), runeMat);
      runeGroup.add(gemMesh);

      const auraGeo = new THREE.RingGeometry(0.45, 0.6, 16);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0xff00cc,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.rotation.x = -Math.PI / 2;
      runeGroup.add(aura);

      this.classicGroup.add(runeGroup);
      this.elixirRunes.push({ group: runeGroup, mesh: gemMesh, aura, active: true, respawnTimer: 0, x, z: 0, isBrawlOnly: false });
    });

    // Central Brawl Sanctum Altar Rune (36x36 Colosseum Center)
    const brawlRuneGroup = new THREE.Group();
    brawlRuneGroup.position.set(0, 0.55, 0);
    const brawlGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), runeMat);
    brawlRuneGroup.add(brawlGem);

    const brawlAuraGeo = new THREE.RingGeometry(0.6, 0.85, 24);
    const brawlAuraMat = new THREE.MeshBasicMaterial({
      color: 0xff00cc,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });
    const brawlAura = new THREE.Mesh(brawlAuraGeo, brawlAuraMat);
    brawlAura.rotation.x = -Math.PI / 2;
    brawlRuneGroup.add(brawlAura);

    this.brawlGroup.add(brawlRuneGroup);
    this.elixirRunes.push({ group: brawlRuneGroup, mesh: brawlGem, aura: brawlAura, active: false, respawnTimer: 0, x: 0, z: 0, isBrawlOnly: true });
  }

  createProceduralBrawlFieldTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // 1. Base Dark Slate Emerald Stadium Lawn
    ctx.fillStyle = '#223826';
    ctx.fillRect(0, 0, 2048, 2048);

    // 2. Four Quadrant Faction Turf Color Washes
    // South (Blue - Me/Player)
    const gradBlue = ctx.createRadialGradient(1024, 1680, 60, 1024, 1500, 700);
    gradBlue.addColorStop(0, 'rgba(18, 75, 160, 0.75)');
    gradBlue.addColorStop(0.6, 'rgba(32, 90, 80, 0.45)');
    gradBlue.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradBlue;
    ctx.fillRect(0, 1024, 2048, 1024);

    // North (Red - Flame)
    const gradRed = ctx.createRadialGradient(1024, 368, 60, 1024, 548, 700);
    gradRed.addColorStop(0, 'rgba(175, 25, 45, 0.75)');
    gradRed.addColorStop(0.6, 'rgba(85, 50, 40, 0.45)');
    gradRed.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradRed;
    ctx.fillRect(0, 0, 2048, 1024);

    // West (Green - Emerald)
    const gradGreen = ctx.createRadialGradient(368, 1024, 60, 548, 1024, 700);
    gradGreen.addColorStop(0, 'rgba(20, 135, 65, 0.75)');
    gradGreen.addColorStop(0.6, 'rgba(35, 95, 55, 0.45)');
    gradGreen.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradGreen;
    ctx.fillRect(0, 0, 1024, 2048);

    // East (Purple - Void)
    const gradPurple = ctx.createRadialGradient(1680, 1024, 60, 1500, 1024, 700);
    gradPurple.addColorStop(0, 'rgba(135, 30, 165, 0.75)');
    gradPurple.addColorStop(0.6, 'rgba(65, 40, 95, 0.45)');
    gradPurple.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradPurple;
    ctx.fillRect(1024, 0, 1024, 2048);

    // 3. Concentric Royal Arena Mow Rings
    for (let r = 160; r <= 1350; r += 75) {
      ctx.strokeStyle = (Math.floor(r / 75) % 2 === 0) ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 38;
      ctx.beginPath();
      ctx.arc(1024, 1024, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 4. Grand Radial Paved Avenues (South, North, West, East)
    const aveW = 210;
    const half = aveW / 2;

    const drawAvenuePath = (x, y, w, h, isVertical) => {
      ctx.fillStyle = 'rgba(145, 135, 122, 0.45)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, w, h);

      ctx.strokeStyle = 'rgba(70, 60, 50, 0.3)';
      ctx.lineWidth = 2;
      if (isVertical) {
        for (let py = y; py < y + h; py += 32) {
          ctx.beginPath();
          ctx.moveTo(x, py);
          ctx.lineTo(x + w, py);
          ctx.stroke();
        }
      } else {
        for (let px = x; px < x + w; px += 32) {
          ctx.beginPath();
          ctx.moveTo(px, y);
          ctx.lineTo(px, y + h);
          ctx.stroke();
        }
      }
    };

    drawAvenuePath(1024 - half, 1024, aveW, 1024, true);   // South
    drawAvenuePath(1024 - half, 0, aveW, 1024, true);      // North
    drawAvenuePath(0, 1024 - half, 1024, aveW, false);     // West
    drawAvenuePath(1024, 1024 - half, 1024, aveW, false);    // East

    // 5. Central Grand Sanctum Rings & Markings
    ctx.beginPath();
    ctx.arc(1024, 1024, 440, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(1024, 1024, 310, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(14, 22, 38, 0.88)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = '900 130px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👑', 1024, 1024);

    // 6. Four Faction Fortress Emblems on Turf
    const drawEmblemCircle = (cx, cy, fillColor, label) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy);
    };

    drawEmblemCircle(1024, 1600, 'rgba(0, 176, 255, 0.35)', '🛡️ 南方·蔚藍王國');
    drawEmblemCircle(1024, 448, 'rgba(255, 23, 68, 0.35)', '⚔️ 北方·烈焰帝國');
    drawEmblemCircle(448, 1024, 'rgba(0, 230, 118, 0.35)', '🏹 西方·翡翠同盟');
    drawEmblemCircle(1600, 1024, 'rgba(213, 0, 249, 0.35)', '🔮 東方·虛空議會');

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  buildBrawlColosseum() {
    const brawlTex = this.createProceduralBrawlFieldTexture();
    const brawlGeo = new THREE.PlaneGeometry(38, 38, 64, 64);
    const brawlMat = new THREE.MeshStandardMaterial({
      map: brawlTex,
      roughness: 0.70,
      metalness: 0.08
    });

    const brawlField = new THREE.Mesh(brawlGeo, brawlMat);
    brawlField.rotation.x = -Math.PI / 2;
    brawlField.receiveShadow = true;
    this.brawlGroup.add(brawlField);
    this.brawlGroundPlane = brawlField;

    // 1. Massive Colosseum Stone Base (Platform)
    const colosseumBaseGeo = new THREE.BoxGeometry(42, 6.5, 42);
    const colosseumBaseMat = new THREE.MeshStandardMaterial({
      color: 0x1f2735,
      roughness: 0.88,
      metalness: 0.15
    });
    const colosseumBase = new THREE.Mesh(colosseumBaseGeo, colosseumBaseMat);
    colosseumBase.position.y = -3.26;
    colosseumBase.receiveShadow = true;
    this.brawlGroup.add(colosseumBase);

    // 2. Colosseum Perimeter Stone Ramparts & Battlements
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
      color: 0xffcb36,
      roughness: 0.25,
      metalness: 0.85
    });

    const wallConfigs = [
      { x: 0, z: -19.2, w: 38, d: 1.8 },
      { x: 0, z: 19.2, w: 38, d: 1.8 },
      { x: -19.2, z: 0, w: 1.8, d: 38 },
      { x: 19.2, z: 0, w: 1.8, d: 38 }
    ];

    wallConfigs.forEach(cfg => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, 2.6, cfg.d), wallMat);
      wall.position.set(cfg.x, 1.15, cfg.z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.brawlGroup.add(wall);

      const isZ = cfg.w > cfg.d;
      const count = 18;
      const step = 36 / count;
      for (let i = -count / 2; i <= count / 2; i++) {
        if (Math.abs(i) === 0 || Math.abs(i) % 2 === 1) continue;
        const cren = new THREE.Mesh(new THREE.BoxGeometry(isZ ? 1.0 : 0.6, 0.45, isZ ? 0.6 : 1.0), stoneTrimMat);
        cren.position.set(
          isZ ? i * step : cfg.x,
          2.65,
          isZ ? cfg.z : i * step
        );
        cren.castShadow = true;
        this.brawlGroup.add(cren);
      }
    });

    // 3. Four Grand Corner Bastions (Citadels with Torches & Faction Banners)
    const cornerPositions = [
      { x: -19.2, z: 19.2, color: 0x00e676 },   // SW Green
      { x: 19.2, z: 19.2, color: 0x00b0ff },    // SE Blue
      { x: -19.2, z: -19.2, color: 0xff1744 },   // NW Red
      { x: 19.2, z: -19.2, color: 0xd500f9 }    // NE Purple
    ];

    cornerPositions.forEach(c => {
      const bastion = new THREE.Group();
      bastion.position.set(c.x, 0, c.z);

      const bTower = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.9, 6.8, 12), wallMat);
      bTower.position.y = 3.4;
      bTower.castShadow = true;
      bTower.receiveShadow = true;
      bastion.add(bTower);

      const bRoof = new THREE.Mesh(new THREE.ConeGeometry(3.0, 2.6, 12), new THREE.MeshStandardMaterial({
        color: c.color,
        roughness: 0.45
      }));
      bRoof.position.y = 7.8;
      bRoof.castShadow = true;
      bastion.add(bRoof);

      const bSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.6, 8), goldMat);
      bSpire.position.y = 9.4;
      bastion.add(bSpire);

      // Fire Cauldron with Point Light
      const cauldron = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 0.7, 8), stoneTrimMat);
      cauldron.position.set(c.x > 0 ? -1.8 : 1.8, 3.8, c.z > 0 ? -1.8 : 1.8);
      bastion.add(cauldron);

      const fireLight = new THREE.PointLight(0xffa726, 1.2, 14);
      fireLight.position.copy(cauldron.position);
      fireLight.position.y += 0.8;
      bastion.add(fireLight);

      // Flapping Faction Banner
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.0, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      pole.position.set(c.x > 0 ? -2.2 : 2.2, 2.5, c.z > 0 ? -2.2 : 2.2);
      bastion.add(pole);

      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 3.2, 12, 12),
        new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.35, side: THREE.DoubleSide })
      );
      flag.position.set(c.x > 0 ? -3.1 : 3.1, 3.8, c.z > 0 ? -2.2 : 2.2);
      flag.castShadow = true;
      bastion.add(flag);
      this.flags.push({ mesh: flag, phase: Math.random() * Math.PI * 2 });

      this.brawlGroup.add(bastion);
    });

    // 4. Central Circular Moat & Flowing Azure Water
    const moatInnerR = 5.2;
    const moatOuterR = 8.0;

    const moatBed = new THREE.Mesh(
      new THREE.CylinderGeometry(moatOuterR + 0.1, moatOuterR + 0.1, 0.6, 48),
      new THREE.MeshStandardMaterial({ color: 0x141f2e, roughness: 0.95 })
    );
    moatBed.position.set(0, -0.32, 0);
    moatBed.receiveShadow = true;
    this.brawlGroup.add(moatBed);

    const waterGeo = new THREE.RingGeometry(moatInnerR, moatOuterR, 48);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x00d2ff,
      emissive: 0x054878,
      emissiveIntensity: 0.3,
      roughness: 0.06,
      metalness: 0.1,
      transmission: 0.65,
      ior: 1.333,
      transparent: true,
      opacity: 0.92
    });
    this.brawlWaterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.brawlWaterMesh.rotation.x = -Math.PI / 2;
    this.brawlWaterMesh.position.set(0, -0.04, 0);
    this.brawlWaterMesh.receiveShadow = true;
    this.brawlGroup.add(this.brawlWaterMesh);

    const outerRimGeo = new THREE.RingGeometry(moatOuterR, moatOuterR + 0.5, 48);
    const stoneRimMat = new THREE.MeshStandardMaterial({ color: 0x616c7d, roughness: 0.8 });
    const outerRim = new THREE.Mesh(outerRimGeo, stoneRimMat);
    outerRim.rotation.x = -Math.PI / 2;
    outerRim.position.set(0, 0.04, 0);
    this.brawlGroup.add(outerRim);

    // 5. Central Sanctum Elevated Plateau
    const sanctumGeo = new THREE.CylinderGeometry(moatInnerR, moatInnerR + 0.2, 0.35, 48);
    const sanctumMat = new THREE.MeshStandardMaterial({ color: 0x2e3846, roughness: 0.82 });
    const sanctum = new THREE.Mesh(sanctumGeo, sanctumMat);
    sanctum.position.set(0, 0.12, 0);
    sanctum.receiveShadow = true;
    sanctum.castShadow = true;
    this.brawlGroup.add(sanctum);

    const sanctumCurb = new THREE.Mesh(
      new THREE.RingGeometry(moatInnerR - 0.4, moatInnerR + 0.05, 48),
      goldMat
    );
    sanctumCurb.rotation.x = -Math.PI / 2;
    sanctumCurb.position.set(0, 0.31, 0);
    this.brawlGroup.add(sanctumCurb);

    const altar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.24, 16), stoneTrimMat);
    altar.position.set(0, 0.38, 0);
    altar.castShadow = true;
    this.brawlGroup.add(altar);

    const altarGoldRing = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.2, 24), goldMat);
    altarGoldRing.rotation.x = -Math.PI / 2;
    altarGoldRing.position.set(0, 0.51, 0);
    this.brawlGroup.add(altarGoldRing);

    // 6. Four Grand Stone Bridges (Connecting South, North, West, East to Sanctum)
    const bridgeW = 3.6;
    const bridgeL = 3.4;
    const bridgeDist = (moatInnerR + moatOuterR) / 2;

    const bridgesData = [
      { x: 0, z: bridgeDist, rotY: 0 },          // South Bridge
      { x: 0, z: -bridgeDist, rotY: 0 },         // North Bridge
      { x: -bridgeDist, z: 0, rotY: Math.PI / 2 }, // West Bridge
      { x: bridgeDist, z: 0, rotY: Math.PI / 2 }  // East Bridge
    ];

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a7a69, roughness: 0.75 });
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x54493e, roughness: 0.85 });

    bridgesData.forEach(b => {
      const bridgeGroup = new THREE.Group();
      bridgeGroup.position.set(b.x, 0, b.z);
      bridgeGroup.rotation.y = b.rotY;

      const deck = new THREE.Mesh(new THREE.BoxGeometry(bridgeW, 0.32, bridgeL), stoneMat);
      deck.position.y = 0.2;
      deck.castShadow = true;
      deck.receiveShadow = true;
      bridgeGroup.add(deck);

      const planks = new THREE.Mesh(new THREE.BoxGeometry(bridgeW - 0.4, 0.04, bridgeL - 0.2), new THREE.MeshStandardMaterial({ color: 0x6e5138 }));
      planks.position.y = 0.38;
      planks.receiveShadow = true;
      bridgeGroup.add(planks);

      [-bridgeW / 2 + 0.15, bridgeW / 2 - 0.15].forEach(px => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.55, bridgeL), darkStoneMat);
        rail.position.set(px, 0.58, 0);
        rail.castShadow = true;
        bridgeGroup.add(rail);

        [-bridgeL / 2 + 0.2, bridgeL / 2 - 0.2].forEach(pz => {
          const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.85, 0.36), stoneMat);
          pillar.position.set(px, 0.65, pz);
          pillar.castShadow = true;
          bridgeGroup.add(pillar);

          const cap = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.22, 4), goldMat);
          cap.position.set(px, 1.15, pz);
          bridgeGroup.add(cap);

          const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({
            color: 0xffe680,
            emissive: 0xffaa00,
            emissiveIntensity: 2.0
          }));
          lantern.position.set(px, 0.85, pz);
          bridgeGroup.add(lantern);
        });
      });

      this.brawlGroup.add(bridgeGroup);
    });

    // 7. Four Castle Foundation Platforms (South, North, West, East at 14.5)
    const castlePlatforms = [
      { x: 0, z: 14.5, color: 0x0077c2 },    // South Blue
      { x: 0, z: -14.5, color: 0xc62828 },   // North Red
      { x: -14.5, z: 0, color: 0x2e7d32 },   // West Green
      { x: 14.5, z: 0, color: 0x6a1b9a }    // East Purple
    ];

    castlePlatforms.forEach(p => {
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.22, 8), stoneMat);
      plinth.position.set(p.x, 0.08, p.z);
      plinth.receiveShadow = true;
      this.brawlGroup.add(plinth);

      const carpet = new THREE.Mesh(
        new THREE.RingGeometry(1.2, 3.8, 8),
        new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.6 })
      );
      carpet.rotation.x = -Math.PI / 2;
      carpet.position.set(p.x, 0.20, p.z);
      this.brawlGroup.add(carpet);

      [-3.2, 3.2].forEach(offset => {
        const tx = p.z === 0 ? p.x : p.x + offset;
        const tz = p.x === 0 ? p.z : p.z + offset;
        const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.8, 8), darkStoneMat);
        torch.position.set(tx, 0.9, tz);
        torch.castShadow = true;
        this.brawlGroup.add(torch);

        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({
          color: 0xff7700,
          emissive: 0xff3300,
          emissiveIntensity: 2.2
        }));
        flame.position.set(tx, 1.85, tz);
        this.brawlGroup.add(flame);
      });
    });

    // 8. Surrounding Ancient Pine Trees outside the Colosseum walls
    const treePositions = [];
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 10) {
      const rad = 23 + Math.random() * 4;
      treePositions.push({ x: Math.cos(angle) * rad, z: Math.sin(angle) * rad });
    }
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3219, roughness: 0.85 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1e4620, roughness: 0.7 });

    treePositions.forEach(pos => {
      const tree = new THREE.Group();
      tree.position.set(pos.x, 0, pos.z);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.5, 6), trunkMat);
      trunk.position.y = 0.75;
      tree.add(trunk);

      for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6 - i * 0.35, 1.6, 7), leafMat);
        cone.position.y = 1.8 + i * 1.0;
        tree.add(cone);
      }
      this.brawlGroup.add(tree);
    });
  }

  setBlizzard(active) {
    this.blizzardActive = active;
    if (this.snowMat) {
      this.snowMat.opacity = active ? 0.85 : 0.0;
    }
  }

  setBrawlLayout(isBrawl, mySide = 'blue') {
    this.isBrawlMode = isBrawl;
    if (isBrawl) {
      this.classicGroup.visible = false;
      this.brawlGroup.visible = true;
      this.groundPlane = this.brawlGroundPlane;

      this.elixirRunes.forEach(r => {
        if (r.isBrawlOnly) {
          r.active = true;
          r.group.visible = true;
        } else {
          r.active = false;
          r.group.visible = false;
        }
      });

      // 4-Player elevated panoramic camera for 36x36 colosseum
      const isPortrait = window.innerWidth < window.innerHeight;
      if (isPortrait) {
        this.camera.fov = 52;
        this.targetCameraPos.set(0, 52, 42);
        this.targetCameraLook.set(0, -1, 0);
      } else {
        this.camera.fov = 45;
        this.targetCameraPos.set(0, 42, 34);
        this.targetCameraLook.set(0, -0.5, 0);
      }
      this.camera.updateProjectionMatrix();
    } else {
      this.classicGroup.visible = true;
      this.brawlGroup.visible = false;
      this.groundPlane = this.classicGroundPlane;

      this.elixirRunes.forEach(r => {
        if (!r.isBrawlOnly) {
          r.active = true;
          r.group.visible = true;
        } else {
          r.active = false;
          r.group.visible = false;
        }
      });

      if (this.cameraMode === 'classic') {
        this.camera.fov = 45;
        this.targetCameraPos.set(0, 26, 22);
        this.targetCameraLook.set(0, 0, 1.5);
        this.camera.updateProjectionMatrix();
      }
    }
  }

  setDeploymentVisual(active, isValid = true, targetPos = null, radius = 1.0) {
    if (this.deploymentZone) {
      if (!active || this.isBrawlMode) {
        this.deploymentZone.material.opacity = 0;
      } else {
        this.deploymentZone.material.opacity = 0.28;
        this.deploymentZone.material.color.setHex(isValid ? 0x00ff88 : 0xff2a55);
      }
    }

    if (!active || !targetPos) {
      this.hidePlacementGhost();
    } else {
      this.updatePlacementGhost(targetPos, isValid, radius);
    }
  }

  getArenaIntersection(clientX, clientY) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const activeGround = this.isBrawlMode ? (this.brawlGroundPlane || this.groundPlane) : (this.classicGroundPlane || this.groundPlane);
    if (!activeGround) return null;

    const intersects = this.raycaster.intersectObject(activeGround);
    if (intersects.length > 0) {
      const boundX = this.isBrawlMode ? 17.5 : 8.5;
      const boundZ = this.isBrawlMode ? 17.5 : 15.5;
      return {
        x: Math.max(-boundX, Math.min(boundX, intersects[0].point.x)),
        z: Math.max(-boundZ, Math.min(boundZ, intersects[0].point.z))
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

      if (this.isBrawlMode) {
        if (aspect < 1.0) {
          this.camera.fov = 52;
          this.targetCameraPos.set(0, 52, 42);
          this.targetCameraLook.set(0, -1, 0);
        } else {
          this.camera.fov = 45;
          this.targetCameraPos.set(0, 42, 34);
          this.targetCameraLook.set(0, -0.5, 0);
        }
      } else {
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

    // 1. River & Moat dynamic undulating wave & caustics
    if (this.waterMesh && !this.isBrawlMode) {
      this.waterMesh.position.y = -0.06 + Math.sin(time * 2.2) * 0.025;
    }
    if (this.brawlWaterMesh && this.isBrawlMode) {
      this.brawlWaterMesh.position.y = -0.04 + Math.sin(time * 2.2) * 0.025;
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

    // 4b. Placement Ghost Ring subtle spin
    if (this.placementGhost && this.placementGhost.visible && this.ghostRingMesh) {
      this.ghostRingMesh.rotation.z += deltaTime * 2.5;
    }

    // 4c. River Elixir Runes Hover & Spin
    if (this.elixirRunes) {
      this.elixirRunes.forEach(r => {
        if (!r.active) {
          r.group.visible = false;
          r.respawnTimer -= deltaTime;
          if (r.respawnTimer <= 0) {
            r.active = true;
            r.group.visible = true;
          }
        } else {
          r.group.visible = true;
          r.mesh.rotation.y += deltaTime * 2.2;
          r.mesh.rotation.x = Math.sin(time * 2.0) * 0.2;
          r.group.position.y = 0.45 + Math.sin(time * 3.0) * 0.12;
          r.aura.rotation.z -= deltaTime * 1.5;
        }
      });
    }

    // 4d. Blizzard Swirling Snow
    if (this.blizzardActive && this.blizzardParticles) {
      const bPos = this.blizzardParticles.geometry.attributes.position.array;
      for (let i = 0; i < bPos.length; i += 3) {
        bPos[i + 1] -= deltaTime * 8.0;
        bPos[i] += Math.sin(time * 4.0 + i) * 0.08 + deltaTime * 2.5;
        if (bPos[i + 1] < 0) {
          bPos[i + 1] = 14.0;
          bPos[i] = (Math.random() - 0.5) * 26;
        }
      }
      this.blizzardParticles.geometry.attributes.position.needsUpdate = true;
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
