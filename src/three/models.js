import * as THREE from 'three';

/**
 * 3D Model Factory for Clash Royale 3D (Ultra-Detailed AAA Next-Gen Stylized Edition)
 * Builds smooth, charismatic, high-polygon characters, mounts, weapons, accessories, towers, and treasure chests
 */

const materialsCache = new Map();

function getTeamMaterial(type, isBlue, extra = {}) {
  const key = `${type}_${isBlue ? 'blue' : 'red'}_${JSON.stringify(extra)}`;
  if (materialsCache.has(key)) return materialsCache.get(key);

  const teamColor = isBlue ? 0x1e68ff : 0xff2453;
  const teamDark = isBlue ? 0x0c3a9e : 0x940c2a;
  const teamLight = isBlue ? 0x60a5fa : 0xfb7185;

  let mat;
  switch (type) {
    case 'team':
      mat = new THREE.MeshStandardMaterial({
        color: teamColor,
        roughness: 0.35,
        metalness: 0.25,
        ...extra
      });
      break;
    case 'team-dark':
      mat = new THREE.MeshStandardMaterial({
        color: teamDark,
        roughness: 0.45,
        metalness: 0.35,
        ...extra
      });
      break;
    case 'team-light':
      mat = new THREE.MeshStandardMaterial({
        color: teamLight,
        roughness: 0.3,
        metalness: 0.2,
        ...extra
      });
      break;
    case 'stone':
      mat = new THREE.MeshStandardMaterial({
        color: 0x6e7888,
        roughness: 0.72,
        metalness: 0.12
      });
      break;
    case 'dark-stone':
      mat = new THREE.MeshStandardMaterial({
        color: 0x3e4552,
        roughness: 0.8,
        metalness: 0.15
      });
      break;
    case 'gold':
      mat = new THREE.MeshStandardMaterial({
        color: 0xffc324,
        roughness: 0.2,
        metalness: 0.88,
        emissive: 0x332000,
        emissiveIntensity: 0.15
      });
      break;
    case 'bright-gold':
      mat = new THREE.MeshStandardMaterial({
        color: 0xffe259,
        roughness: 0.16,
        metalness: 0.92,
        emissive: 0x553500,
        emissiveIntensity: 0.25
      });
      break;
    case 'wood':
      mat = new THREE.MeshStandardMaterial({
        color: 0x5c381e,
        roughness: 0.72,
        metalness: 0.05
      });
      break;
    case 'dark-wood':
      mat = new THREE.MeshStandardMaterial({
        color: 0x3d2412,
        roughness: 0.8,
        metalness: 0.05
      });
      break;
    case 'thatch':
      mat = new THREE.MeshStandardMaterial({
        color: 0xa68244,
        roughness: 0.88,
        metalness: 0.02
      });
      break;
    case 'metal':
      mat = new THREE.MeshStandardMaterial({
        color: 0xdde7f2,
        roughness: 0.2,
        metalness: 0.85
      });
      break;
    case 'dark-metal':
      mat = new THREE.MeshStandardMaterial({
        color: 0x272d3b,
        roughness: 0.28,
        metalness: 0.82
      });
      break;
    case 'black-iron':
      mat = new THREE.MeshStandardMaterial({
        color: 0x181c24,
        roughness: 0.32,
        metalness: 0.88
      });
      break;
    case 'skin':
      mat = new THREE.MeshStandardMaterial({
        color: 0xfbd6b0,
        roughness: 0.55,
        metalness: 0.02
      });
      break;
    case 'dark-skin':
      mat = new THREE.MeshStandardMaterial({
        color: 0x73482b,
        roughness: 0.58,
        metalness: 0.02
      });
      break;
    case 'goblin-skin':
      mat = new THREE.MeshStandardMaterial({
        color: 0x58bf37,
        roughness: 0.52,
        metalness: 0.02
      });
      break;
    case 'goblin-skin-dark':
      mat = new THREE.MeshStandardMaterial({
        color: 0x3d8c24,
        roughness: 0.55
      });
      break;
    case 'bone':
      mat = new THREE.MeshStandardMaterial({
        color: 0xf0ede6,
        roughness: 0.55,
        metalness: 0.08
      });
      break;
    case 'leather':
      mat = new THREE.MeshStandardMaterial({
        color: 0x824b22,
        roughness: 0.72,
        metalness: 0.05
      });
      break;
    case 'dark-leather':
      mat = new THREE.MeshStandardMaterial({
        color: 0x472712,
        roughness: 0.78,
        metalness: 0.05
      });
      break;
    case 'white-cloth':
      mat = new THREE.MeshStandardMaterial({
        color: 0xf5f7fa,
        roughness: 0.62
      });
      break;
    default:
      mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  }

  materialsCache.set(key, mat);
  return mat;
}

/**
 * High-definition stylized cartoon eyes with specular highlights
 */
function addCleanStylizedEyes(parent, width = 0.07, separation = 0.12, y = 0.02, z = 0.22) {
  const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const browMat = new THREE.MeshStandardMaterial({ color: 0x2e1c0c, roughness: 0.8 });

  [-separation / 2, separation / 2].forEach(x => {
    // Sclera (White base)
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(width * 0.7, 16, 16), scleraMat);
    sclera.position.set(x, y, z - 0.01);
    sclera.scale.set(1, 1.2, 0.4);
    parent.add(sclera);

    // Pupil
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(width * 0.45, 16, 16), pupilMat);
    pupil.position.set(x, y, z + 0.015);
    pupil.scale.set(1, 1.1, 0.3);
    parent.add(pupil);

    // Specular Glint
    const glint = new THREE.Mesh(new THREE.SphereGeometry(width * 0.16, 8, 8), highlightMat);
    glint.position.set(x + width * 0.15, y + width * 0.18, z + 0.025);
    parent.add(glint);

    // Expressive Eyebrow
    const brow = new THREE.Mesh(new THREE.BoxGeometry(width * 1.35, 0.028, 0.04), browMat);
    brow.position.set(x, y + width + 0.03, z);
    parent.add(brow);
  });
}

export class ModelFactory {
  // -------------------------------------------------------------
  // TOWERS CREATION (Royal Fortresses)
  // -------------------------------------------------------------

  static createPrincessTower(isBlue) {
    const group = new THREE.Group();
    group.name = 'PrincessTower';

    const stoneMat = getTeamMaterial('stone', isBlue);
    const darkStoneMat = getTeamMaterial('dark-stone', isBlue);
    const teamMat = getTeamMaterial('team', isBlue);
    const goldMat = getTeamMaterial('gold', isBlue);
    const woodMat = getTeamMaterial('wood', isBlue);

    // Fluted Stone Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.75, 3.4, 24), stoneMat);
    base.position.y = 1.7;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Base Stone Plinth
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.95, 0.4, 24), darkStoneMat);
    plinth.position.y = 0.2;
    plinth.receiveShadow = true;
    group.add(plinth);

    // Royal Banner Belt with Golden Moldings
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.46, 1.46, 0.85, 24), teamMat);
    band.position.y = 2.55;
    group.add(band);

    const goldRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.06, 12, 32), goldMat);
    goldRing1.rotation.x = Math.PI / 2;
    goldRing1.position.y = 2.15;
    group.add(goldRing1);

    const goldRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.06, 12, 32), goldMat);
    goldRing2.rotation.x = Math.PI / 2;
    goldRing2.position.y = 2.95;
    group.add(goldRing2);

    // Flared Upper Platform with Machicolations
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.48, 0.85, 24), darkStoneMat);
    platform.position.y = 3.65;
    platform.castShadow = true;
    group.add(platform);

    const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.12, 24), woodMat);
    floor.position.y = 4.08;
    group.add(floor);

    // Ornate Battlements
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const bGroup = new THREE.Group();
      bGroup.position.set(Math.cos(angle) * 1.6, 4.35, Math.sin(angle) * 1.6);
      bGroup.rotation.y = -angle;

      const battlement = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.65, 0.2), stoneMat);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.24), goldMat);
      cap.position.y = 0.35;
      bGroup.add(battlement);
      bGroup.add(cap);
      group.add(bGroup);
    }

    // Princess Archer on Tower
    const princessGroup = new THREE.Group();
    princessGroup.position.set(0, 4.1, 0);

    const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 0.8, 20), teamMat);
    dress.position.y = 0.4;
    princessGroup.add(dress);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 18), getTeamMaterial('skin', isBlue));
    head.position.y = 1.0;
    princessGroup.add(head);

    addCleanStylizedEyes(head, 0.055, 0.12, 0.02, 0.22);

    const hairMat = new THREE.MeshStandardMaterial({ color: 0x5a3015, roughness: 0.65 });
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 14), hairMat);
    hair.position.set(0, 1.02, -0.05);
    princessGroup.add(hair);

    const tiara = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.2, 8), goldMat);
    tiara.position.y = 1.28;
    princessGroup.add(tiara);

    const bowGroup = new THREE.Group();
    bowGroup.position.set(0.3, 0.7, 0.25);
    bowGroup.rotation.x = Math.PI / 4;
    const bowCurve = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 10, 24, Math.PI), goldMat);
    bowGroup.add(bowCurve);
    princessGroup.add(bowGroup);

    group.add(princessGroup);
    group.userData.shooter = princessGroup;

    return group;
  }

  static createKingTower(isBlue) {
    const group = new THREE.Group();
    group.name = 'KingTower';

    const stoneMat = getTeamMaterial('stone', isBlue);
    const darkStoneMat = getTeamMaterial('dark-stone', isBlue);
    const teamMat = getTeamMaterial('team', isBlue);
    const goldMat = getTeamMaterial('gold', isBlue);
    const woodMat = getTeamMaterial('wood', isBlue);

    // Multi-tier Base Structure
    const baseBottom = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.6, 4.2), darkStoneMat);
    baseBottom.position.y = 0.3;
    baseBottom.receiveShadow = true;
    group.add(baseBottom);

    const mainBody = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 2.05, 3.8, 28), stoneMat);
    mainBody.position.y = 2.2;
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    group.add(mainBody);

    // Team Crest Emblem Band
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 1.1, 28), teamMat);
    band.position.y = 2.7;
    group.add(band);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.92, 0.08, 12, 32), goldMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 3.25;
    group.add(ring);

    // Grand Upper Balcony Platform
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 1.9, 0.9, 28), darkStoneMat);
    platform.position.y = 4.3;
    platform.castShadow = true;
    group.add(platform);

    const floor = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.12, 28), woodMat);
    floor.position.y = 4.76;
    group.add(floor);

    // 8 Grand Golden Crenellations
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const bGroup = new THREE.Group();
      bGroup.position.set(Math.cos(angle) * 2.05, 5.15, Math.sin(angle) * 2.05);
      bGroup.rotation.y = -angle;

      const battlement = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.75, 0.25), stoneMat);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.1, 0.3), goldMat);
      cap.position.y = 0.42;
      bGroup.add(battlement);
      bGroup.add(cap);
      group.add(bGroup);
    }

    // King Cannon Mount
    const cannonMount = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.6, 20), darkStoneMat);
    cannonMount.position.set(0, 5.0, 0);
    group.add(cannonMount);

    const cannonBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 1.4, 20), getTeamMaterial('dark-metal', isBlue));
    cannonBarrel.rotation.x = Math.PI / 3;
    cannonBarrel.position.set(0, 5.4, 0.4);
    cannonBarrel.castShadow = true;
    group.add(cannonBarrel);

    // King Character
    const kingGroup = new THREE.Group();
    kingGroup.position.set(0, 4.8, -0.6);

    const kingBody = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 0.9, 20), teamMat);
    kingBody.position.y = 0.45;
    kingGroup.add(kingBody);

    const kingHead = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 18), getTeamMaterial('skin', isBlue));
    kingHead.position.y = 1.1;
    kingGroup.add(kingHead);

    addCleanStylizedEyes(kingHead, 0.065, 0.14, 0.03, 0.26);

    // Majestic King Crown
    const crownGroup = new THREE.Group();
    crownGroup.position.y = 1.38;
    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.22, 20), goldMat);
    crownGroup.add(crownBase);

    for (let j = 0; j < 5; j++) {
      const cAngle = (j * Math.PI * 2) / 5;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 8), goldMat);
      spike.position.set(Math.cos(cAngle) * 0.28, 0.18, Math.sin(cAngle) * 0.28);
      crownGroup.add(spike);
    }
    kingGroup.add(crownGroup);

    // King Golden Scepter
    const scepter = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 10), goldMat);
    scepter.position.set(0.42, 0.65, 0.2);
    scepter.rotation.z = -0.3;
    kingGroup.add(scepter);

    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00a2ff, emissiveIntensity: 1.5 }));
    orb.position.set(0.58, 1.15, 0.2);
    kingGroup.add(orb);

    group.add(kingGroup);
    group.userData.king = kingGroup;

    return group;
  }

  // -------------------------------------------------------------
  // HIGH-POLY STYLIZED TROOP MODELS (AAA Tier)
  // -------------------------------------------------------------

  static createTroopMesh(cardId, isBlue) {
    const root = new THREE.Group();
    root.name = `Troop_${cardId}_${isBlue ? 'Blue' : 'Red'}`;

    const parts = {};

    const teamMat = getTeamMaterial('team', isBlue);
    const teamDark = getTeamMaterial('team-dark', isBlue);
    const metalMat = getTeamMaterial('metal', isBlue);
    const darkMetal = getTeamMaterial('dark-metal', isBlue);
    const blackIron = getTeamMaterial('black-iron', isBlue);
    const goldMat = getTeamMaterial('gold', isBlue);
    const brightGold = getTeamMaterial('bright-gold', isBlue);
    const skinMat = getTeamMaterial('skin', isBlue);
    const darkSkin = getTeamMaterial('dark-skin', isBlue);
    const goblinSkin = getTeamMaterial('goblin-skin', isBlue);
    const boneMat = getTeamMaterial('bone', isBlue);
    const woodMat = getTeamMaterial('wood', isBlue);
    const darkWood = getTeamMaterial('dark-wood', isBlue);
    const leatherMat = getTeamMaterial('leather', isBlue);
    const darkLeather = getTeamMaterial('dark-leather', isBlue);
    const whiteCloth = getTeamMaterial('white-cloth', isBlue);

    switch (cardId) {
      case 'knight': {
        // 皇家騎士 (Knight) - Fluted plate cuirass, flowing team cape, silver runic blade, heater shield
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.72, 24), metalMat);
        body.position.y = 0.72;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        // Chestplate Gold Trim & Royal Cross
        const trim = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.03, 10, 24), goldMat);
        trim.rotation.x = Math.PI / 2;
        trim.position.y = 0.85;
        root.add(trim);

        // Flowing Cape
        const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.75, 12, 12), teamMat);
        cape.position.set(0, 0.65, -0.32);
        cape.rotation.x = 0.15;
        cape.castShadow = true;
        root.add(cape);

        // Head & Visor Helmet
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 20), metalMat);
        head.position.y = 1.25;
        head.castShadow = true;

        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.12), darkMetal);
        visor.position.set(0, 0.02, 0.2);
        head.add(visor);

        const plume = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 12), teamMat);
        plume.position.set(0, 0.32, -0.06);
        plume.rotation.x = -0.4;
        head.add(plume);

        root.add(head);
        parts.head = head;

        // Right Arm & Runic Sword
        const armR = new THREE.Group();
        armR.position.set(0.42, 0.9, 0);

        const pauldronR = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), goldMat);
        armR.add(pauldronR);

        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.45, 16), metalMat);
        armMeshR.position.y = -0.22;
        armR.add(armMeshR);

        // Sword
        const sword = new THREE.Group();
        sword.position.set(0, -0.35, 0.15);
        sword.rotation.x = Math.PI / 4;

        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 12), darkLeather);
        sword.add(hilt);

        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.08), goldMat);
        guard.position.y = 0.14;
        sword.add(guard);

        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.95, 0.03), new THREE.MeshStandardMaterial({
          color: 0xeff6ff,
          metalness: 0.95,
          roughness: 0.15,
          emissive: 0x3b82f6,
          emissiveIntensity: 0.2
        }));
        blade.position.y = 0.62;
        sword.add(blade);

        armR.add(sword);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = sword;

        // Left Arm & Shield
        const armL = new THREE.Group();
        armL.position.set(-0.42, 0.9, 0);

        const pauldronL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), goldMat);
        armL.add(pauldronL);

        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.45, 16), metalMat);
        armMeshL.position.y = -0.22;
        armL.add(armMeshL);

        // Shield
        const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.65, 16), teamMat);
        shield.position.set(-0.1, -0.15, 0.2);
        shield.rotation.y = Math.PI / 2;

        const shieldRim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 20), goldMat);
        shield.add(shieldRim);
        armL.add(shield);

        root.add(armL);
        parts.leftArm = armL;

        // Legs
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.45, 16), metalMat);
        legL.position.set(-0.15, 0.22, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.45, 16), metalMat);
        legR.position.set(0.15, 0.22, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'archer': {
        // 弓箭手 (Archer) - High-poly feathered hood beret, quiver with fletched arrows, recurve bow
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.65, 20), teamMat);
        body.position.y = 0.65;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        // Belt & Buckle
        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 20), darkLeather);
        belt.position.y = 0.52;
        root.add(belt);

        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.04), goldMat);
        buckle.position.set(0, 0.52, 0.25);
        root.add(buckle);

        // Head & Hair
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 18), skinMat);
        head.position.y = 1.15;
        head.castShadow = true;
        addCleanStylizedEyes(head, 0.05, 0.11, 0.02, 0.21);

        const hairMat = new THREE.MeshStandardMaterial({ color: 0xdf5b25, roughness: 0.65 });
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 14), hairMat);
        hair.position.set(0, 0.03, -0.04);
        head.add(hair);

        // Archer Beret & Feather
        const beret = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.15, 16), teamDark);
        beret.position.set(0.04, 0.2, 0);
        beret.rotation.z = -0.2;
        head.add(beret);

        const feather = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.35, 8), whiteCloth);
        feather.position.set(0.2, 0.3, 0);
        feather.rotation.z = -0.6;
        head.add(feather);

        root.add(head);
        parts.head = head;

        // Quiver on Back
        const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.6, 12), darkLeather);
        quiver.position.set(0.12, 0.75, -0.24);
        quiver.rotation.z = -0.3;
        root.add(quiver);

        // Right Arm & Recurve Bow
        const armR = new THREE.Group();
        armR.position.set(0.32, 0.82, 0);

        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.4, 14), skinMat);
        armMeshR.position.y = -0.18;
        armR.add(armMeshR);

        const bowGroup = new THREE.Group();
        bowGroup.position.set(0, -0.25, 0.2);
        const bow = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 10, 24, Math.PI), woodMat);
        bowGroup.add(bow);

        const string = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.68, 6), whiteCloth);
        string.position.x = 0;
        bowGroup.add(string);

        armR.add(bowGroup);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = bowGroup;

        // Left Arm
        const armL = new THREE.Group();
        armL.position.set(-0.32, 0.82, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.4, 14), skinMat);
        armMeshL.position.y = -0.18;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

        // Legs
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 14), darkLeather);
        legL.position.set(-0.11, 0.21, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 14), darkLeather);
        legR.position.set(0.11, 0.21, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'pekka':
      case 'mini_pekka': {
        // P.E.K.K.A / Mini P.E.K.K.A - Heavy Samurai-Mecha obsidian armor, neon horns, serrated plasma katana
        const isBig = cardId === 'pekka';
        const s = isBig ? 1.45 : 0.95;

        const neonCyan = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x00e5ff,
          emissiveIntensity: 2.8
        });
        const neonPurple = new THREE.MeshStandardMaterial({
          color: 0xd946ef,
          emissive: 0xa855f7,
          emissiveIntensity: 2.5
        });

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.68 * s, 0.75 * s, 0.52 * s), blackIron);
        body.position.y = 0.85 * s;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        // Chest Armor Plates with Team Inlay
        const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.62 * s, 0.45 * s, 0.12 * s), teamMat);
        chestPlate.position.set(0, 0.95 * s, 0.24 * s);
        root.add(chestPlate);

        // Head & Visor
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.48 * s, 0.42 * s, 0.42 * s), blackIron);
        head.position.y = 1.38 * s;
        head.castShadow = true;

        // Glowing Eye Visor Slit
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.38 * s, 0.08 * s, 0.08 * s), neonCyan);
        visor.position.set(0, 0.02 * s, 0.21 * s);
        head.add(visor);

        // Curved Horns Left & Right
        [-1, 1].forEach(dir => {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09 * s, 0.55 * s, 16), neonPurple);
          horn.position.set(dir * 0.32 * s, 0.3 * s, 0);
          horn.rotation.z = dir * -0.65;
          horn.rotation.x = -0.2;
          head.add(horn);
        });

        root.add(head);
        parts.head = head;

        // Right Arm & Serrated Blade
        const armR = new THREE.Group();
        armR.position.set(0.52 * s, 1.05 * s, 0);

        const pauldronR = new THREE.Mesh(new THREE.BoxGeometry(0.32 * s, 0.32 * s, 0.32 * s), darkMetal);
        armR.add(pauldronR);

        const armMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.45 * s, 0.2 * s), blackIron);
        armMeshR.position.y = -0.26 * s;
        armR.add(armMeshR);

        // Cleaver Blade
        const cleaver = new THREE.Group();
        cleaver.position.set(0, -0.42 * s, 0.2 * s);
        cleaver.rotation.x = Math.PI / 4;

        const bladeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14 * s, 1.1 * s, 0.06 * s), darkMetal);
        bladeMesh.position.y = 0.55 * s;
        cleaver.add(bladeMesh);

        const edgeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04 * s, 1.05 * s, 0.08 * s), neonCyan);
        edgeMesh.position.set(0.08 * s, 0.55 * s, 0);
        cleaver.add(edgeMesh);

        armR.add(cleaver);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = cleaver;

        // Left Arm
        const armL = new THREE.Group();
        armL.position.set(-0.52 * s, 1.05 * s, 0);
        const pauldronL = new THREE.Mesh(new THREE.BoxGeometry(0.32 * s, 0.32 * s, 0.32 * s), darkMetal);
        armL.add(pauldronL);
        const armMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.45 * s, 0.2 * s), blackIron);
        armMeshL.position.y = -0.26 * s;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

        // Legs
        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.24 * s, 0.52 * s, 0.24 * s), blackIron);
        legL.position.set(-0.2 * s, 0.26 * s, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.24 * s, 0.52 * s, 0.24 * s), blackIron);
        legR.position.set(0.2 * s, 0.26 * s, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'wizard':
      case 'electro_wizard': {
        // 法師 / 電磁法師 (Wizard / Electro Wizard) - Arcane robes, glowing mana core, particle spark hands
        const isElectro = cardId === 'electro_wizard';
        const robeColor = isElectro ? 0x0f172a : 0x1e3a8a;
        const arcaneColor = isElectro ? 0x00f0ff : 0xff7700;

        const robeMat = new THREE.MeshStandardMaterial({ color: robeColor, roughness: 0.65 });
        const spellMat = new THREE.MeshStandardMaterial({
          color: arcaneColor,
          emissive: arcaneColor,
          emissiveIntensity: 3.0
        });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.4, 0.85, 20), robeMat);
        body.position.y = 0.75;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        // Arcane Belt with Rune Buckle
        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.1, 20), darkLeather);
        belt.position.y = 0.65;
        root.add(belt);

        const rune = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), spellMat);
        rune.position.set(0, 0.65, 0.28);
        root.add(rune);

        // Head & Hood / Spiky Hair
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 18), skinMat);
        head.position.y = 1.3;
        head.castShadow = true;
        addCleanStylizedEyes(head, 0.055, 0.12, 0.02, 0.22);

        if (isElectro) {
          // Electro Spiky Hair
          const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
          for (let i = 0; i < 7; i++) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35, 8), hairMat);
            spike.position.set((Math.random() - 0.5) * 0.3, 0.22 + Math.random() * 0.1, (Math.random() - 0.5) * 0.3);
            spike.rotation.set((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5);
            head.add(spike);
          }
        } else {
          // Classic Hood
          const hood = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 14), robeMat);
          hood.position.set(0, 0.04, -0.05);
          head.add(hood);
        }

        root.add(head);
        parts.head = head;

        // Right Arm with Magic Spark Orb
        const armR = new THREE.Group();
        armR.position.set(0.38, 0.95, 0);

        const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 16), robeMat);
        sleeveR.position.y = -0.2;
        armR.add(sleeveR);

        const orbR = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), spellMat);
        orbR.position.set(0, -0.45, 0.2);
        armR.add(orbR);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = orbR;

        // Left Arm with Magic Spark Orb
        const armL = new THREE.Group();
        armL.position.set(-0.38, 0.95, 0);

        const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 16), robeMat);
        sleeveL.position.y = -0.2;
        armL.add(sleeveL);

        const orbL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), spellMat);
        orbL.position.set(0, -0.45, 0.2);
        armL.add(orbL);

        root.add(armL);
        parts.leftArm = armL;

        // Legs
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.4, 14), darkLeather);
        legL.position.set(-0.13, 0.2, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.4, 14), darkLeather);
        legR.position.set(0.13, 0.2, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'giant': {
        // 巨人 (Giant) - Muscular sculpted frame, heavy leather vest with metal studs, stone rock fists
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.58, 1.25, 24), darkLeather);
        body.position.y = 1.35;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        // Fur Collar
        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.16, 12, 24), thatchMat || leatherMat);
        collar.rotation.x = Math.PI / 2;
        collar.position.y = 1.95;
        root.add(collar);

        // Head & Ginger Beard
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 20), skinMat);
        head.position.y = 2.25;
        head.castShadow = true;
        addCleanStylizedEyes(head, 0.08, 0.18, 0.05, 0.35);

        const beardMat = new THREE.MeshStandardMaterial({ color: 0xc25319, roughness: 0.8 });
        const beard = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.55, 16), beardMat);
        beard.position.set(0, -0.22, 0.2);
        beard.rotation.x = -0.4;
        head.add(beard);

        root.add(head);
        parts.head = head;

        // Arms & Massive Fists
        const armR = new THREE.Group();
        armR.position.set(0.85, 1.6, 0);

        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.75, 18), skinMat);
        armMeshR.position.y = -0.35;
        armR.add(armMeshR);

        const fistR = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), darkLeather);
        fistR.position.set(0, -0.75, 0.1);
        armR.add(fistR);

        root.add(armR);
        parts.rightArm = armR;

        const armL = new THREE.Group();
        armL.position.set(-0.85, 1.6, 0);

        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.75, 18), skinMat);
        armMeshL.position.y = -0.35;
        armL.add(armMeshL);

        const fistL = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), darkLeather);
        fistL.position.set(0, -0.75, 0.1);
        armL.add(fistL);

        root.add(armL);
        parts.leftArm = armL;

        // Legs
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.8, 18), darkLeather);
        legL.position.set(-0.35, 0.4, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.8, 18), darkLeather);
        legR.position.set(0.35, 0.4, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'baby_dragon':
      case 'inferno_dragon': {
        // 飛龍寶寶 / 地獄飛龍 (Baby Dragon / Inferno Dragon) - High-poly dragon scales, faceted wings, glowing furnace mouth
        const isInferno = cardId === 'inferno_dragon';
        const dragonSkin = new THREE.MeshStandardMaterial({
          color: isInferno ? 0x228855 : 0x44bd32,
          roughness: 0.45,
          metalness: 0.15
        });
        const underbelly = new THREE.MeshStandardMaterial({
          color: 0xf5cd79,
          roughness: 0.5
        });

        // Chubby Dragon Body
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 20), dragonSkin);
        body.position.y = 1.0;
        body.scale.set(1, 1.15, 1.25);
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        // Yellow Underbelly
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.44, 20, 16), underbelly);
        belly.position.set(0, 0.92, 0.18);
        belly.scale.set(0.85, 0.95, 0.9);
        root.add(belly);

        // Dragon Head with Horns
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 20), dragonSkin);
        head.position.set(0, 1.45, 0.35);
        head.castShadow = true;

        addCleanStylizedEyes(head, 0.08, 0.24, 0.06, 0.3);

        // Horns
        [-1, 1].forEach(dir => {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 12), brightGold);
          horn.position.set(dir * 0.22, 0.32, -0.1);
          horn.rotation.z = dir * -0.4;
          horn.rotation.x = -0.3;
          head.add(horn);
        });

        if (isInferno) {
          // Inferno Furnace Mask & Glowing Core
          const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.45), darkMetal);
          helmet.position.set(0, 0.05, 0.05);
          head.add(helmet);

          const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshStandardMaterial({
            color: 0xff3300,
            emissive: 0xff4400,
            emissiveIntensity: 3.5
          }));
          core.position.set(0, -0.05, 0.28);
          head.add(core);
        }

        root.add(head);
        parts.head = head;

        // Animated Dragon Wings
        const wingsGroup = new THREE.Group();
        wingsGroup.position.set(0, 1.15, -0.15);

        [-1, 1].forEach(dir => {
          const wing = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 0.45), dragonSkin);
          wing.position.set(dir * 0.45, 0.1, 0);
          wing.rotation.z = dir * -0.35;
          wingsGroup.add(wing);
        });

        root.add(wingsGroup);
        parts.wings = wingsGroup;

        // Little Tail
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.55, 16), dragonSkin);
        tail.position.set(0, 0.85, -0.65);
        tail.rotation.x = -Math.PI / 3;
        root.add(tail);
        break;
      }

      case 'musketeer': {
        // 火槍手 (Musketeer) - Cavalier feather hat, golden epaulets, polished brass blunderbuss cannon
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.7, 20), teamMat);
        body.position.y = 0.7;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        // Gold Buttons
        for (let i = 0; i < 3; i++) {
          const btn = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), brightGold);
          btn.position.set(0, 0.6 + i * 0.12, 0.26);
          root.add(btn);
        }

        // Head & Violet Hair
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 20, 18), skinMat);
        head.position.y = 1.2;
        head.castShadow = true;
        addCleanStylizedEyes(head, 0.055, 0.12, 0.02, 0.22);

        const hairMat = new THREE.MeshStandardMaterial({ color: 0x86198f, roughness: 0.65 });
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 14), hairMat);
        hair.position.set(0, 0.02, -0.04);
        head.add(hair);

        // Wide Cavalier Hat with Feather Plume
        const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.05, 24), teamDark);
        hatBrim.position.y = 0.2;
        hatBrim.rotation.z = -0.15;
        head.add(hatBrim);

        const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.2, 20), teamDark);
        hatCrown.position.y = 0.3;
        head.add(hatCrown);

        const plume = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 12), whiteCloth);
        plume.position.set(0.35, 0.35, 0);
        plume.rotation.z = -0.8;
        head.add(plume);

        root.add(head);
        parts.head = head;

        // Right Arm & Heavy Blunderbuss
        const armR = new THREE.Group();
        armR.position.set(0.35, 0.88, 0);

        const epauletR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), brightGold);
        armR.add(epauletR);

        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 14), teamMat);
        armMeshR.position.y = -0.2;
        armR.add(armMeshR);

        // Blunderbuss Rifle
        const gun = new THREE.Group();
        gun.position.set(0, -0.3, 0.25);
        gun.rotation.x = Math.PI / 4;

        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), darkWood);
        stock.position.y = 0.15;
        gun.add(stock);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.9, 16), brightGold);
        barrel.position.y = 0.75;
        gun.add(barrel);

        const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.18, 16), brightGold);
        muzzle.position.y = 1.25;
        gun.add(muzzle);

        armR.add(gun);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = gun;

        // Left Arm
        const armL = new THREE.Group();
        armL.position.set(-0.35, 0.88, 0);
        const epauletL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), brightGold);
        armL.add(epauletL);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 14), teamMat);
        armMeshL.position.y = -0.2;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

        // Legs
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.42, 14), darkLeather);
        legL.position.set(-0.12, 0.21, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.42, 14), darkLeather);
        legR.position.set(0.12, 0.21, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'valkyrie': {
        // 女武神 (Valkyrie) - Flowing fiery locks, double-bladed battle axe, fur-trimmed war harness
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.68, 20), darkLeather);
        body.position.y = 0.68;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        // Head & Flowing Hair
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 20, 18), skinMat);
        head.position.y = 1.18;
        head.castShadow = true;
        addCleanStylizedEyes(head, 0.055, 0.12, 0.02, 0.22);

        const hairMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.65 });
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 16), hairMat);
        hair.position.set(0, 0.04, -0.08);
        head.add(hair);

        root.add(head);
        parts.head = head;

        // Right Arm & Massive Double Axe
        const armR = new THREE.Group();
        armR.position.set(0.36, 0.85, 0);

        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 14), skinMat);
        armMeshR.position.y = -0.2;
        armR.add(armMeshR);

        const axe = new THREE.Group();
        axe.position.set(0, -0.3, 0.25);
        axe.rotation.x = Math.PI / 4;

        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 12), darkWood);
        axe.add(handle);

        [-1, 1].forEach(dir => {
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.04), metalMat);
          blade.position.set(dir * 0.24, 0.35, 0);
          axe.add(blade);
        });

        armR.add(axe);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = axe;

        // Left Arm
        const armL = new THREE.Group();
        armL.position.set(-0.36, 0.85, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 14), skinMat);
        armMeshL.position.y = -0.2;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

        // Legs
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.42, 14), darkLeather);
        legL.position.set(-0.12, 0.21, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.42, 14), darkLeather);
        legR.position.set(0.12, 0.21, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'hog_rider': {
        // 野豬騎士 (Hog Rider) - Animated war hog mount with ivory tusks, warhammer with iron bands
        const mount = new THREE.Group();
        mount.position.y = 0.45;

        const hogMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.75 });
        const hogBody = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 16), hogMat);
        hogBody.scale.set(0.85, 0.9, 1.3);
        hogBody.castShadow = true;
        mount.add(hogBody);

        // Hog Snout & Tusks
        const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.25, 12), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
        snout.rotation.x = Math.PI / 2;
        snout.position.set(0, 0.05, 0.65);
        mount.add(snout);

        [-0.18, 0.18].forEach(tx => {
          const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.3, 8), boneMat);
          tusk.position.set(tx, 0.12, 0.6);
          tusk.rotation.x = -0.4;
          tusk.rotation.z = tx > 0 ? 0.3 : -0.3;
          mount.add(tusk);
        });

        root.add(mount);
        parts.mount = mount;

        // Rider Body
        const riderBody = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.7, 20), darkSkin);
        riderBody.position.set(0, 1.1, -0.05);
        riderBody.castShadow = true;
        root.add(riderBody);
        parts.body = riderBody;

        // Rider Head & Mohawk
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 18), darkSkin);
        head.position.set(0, 1.6, -0.05);
        head.castShadow = true;
        addCleanStylizedEyes(head, 0.055, 0.12, 0.02, 0.23);

        const mohawkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
        const mohawk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.42), mohawkMat);
        mohawk.position.set(0, 0.22, 0);
        head.add(mohawk);

        root.add(head);
        parts.head = head;

        // Right Arm & Warhammer
        const armR = new THREE.Group();
        armR.position.set(0.42, 1.25, 0);

        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.45, 14), darkSkin);
        armMeshR.position.y = -0.22;
        armR.add(armMeshR);

        const hammer = new THREE.Group();
        hammer.position.set(0, -0.35, 0.2);
        hammer.rotation.x = Math.PI / 4;

        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.95, 12), darkWood);
        hammer.add(shaft);

        const headStone = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.48), darkMetal);
        headStone.position.y = 0.42;
        hammer.add(headStone);

        armR.add(hammer);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = hammer;

        // Left Arm
        const armL = new THREE.Group();
        armL.position.set(-0.42, 1.25, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.45, 14), darkSkin);
        armMeshL.position.y = -0.22;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;
        break;
      }

      default: {
        // Generic / Fallback High-Quality Warrior
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.65, 20), teamMat);
        body.position.y = 0.65;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 18), skinMat);
        head.position.y = 1.15;
        head.castShadow = true;
        addCleanStylizedEyes(head, 0.05, 0.11, 0.02, 0.21);
        root.add(head);
        parts.head = head;

        const armR = new THREE.Group();
        armR.position.set(0.35, 0.82, 0);
        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.4, 14), teamMat);
        armMeshR.position.y = -0.18;
        armR.add(armMeshR);

        const weaponMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.04), metalMat);
        weaponMesh.position.set(0, -0.2, 0.2);
        weaponMesh.rotation.x = Math.PI / 4;
        armR.add(weaponMesh);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = weaponMesh;

        const armL = new THREE.Group();
        armL.position.set(-0.35, 0.82, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.4, 14), teamMat);
        armMeshL.position.y = -0.18;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.4, 14), darkLeather);
        legL.position.set(-0.12, 0.2, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.4, 14), darkLeather);
        legR.position.set(0.12, 0.2, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }
    }

    return { root, parts };
  }

  // -------------------------------------------------------------
  // 3D CHEST MODEL (High-Fidelity Opening Chest)
  // -------------------------------------------------------------

  static createChestModel(chestType = 'gold') {
    const group = new THREE.Group();
    group.name = 'Chest3D';

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffbe24,
      metalness: 0.88,
      roughness: 0.18,
      emissive: 0x442a00,
      emissiveIntensity: 0.25
    });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x543217, roughness: 0.72 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xd0dbe6, metalness: 0.82, roughness: 0.2 });

    let accentMat = goldMat;
    let chestWood = woodMat;

    if (chestType === 'silver') accentMat = steelMat;
    if (chestType === 'magical' || chestType === 'magic') {
      accentMat = new THREE.MeshStandardMaterial({
        color: 0xd938ff,
        emissive: 0x9900ee,
        metalness: 0.88,
        emissiveIntensity: 0.65
      });
      chestWood = new THREE.MeshStandardMaterial({ color: 0x2d1747, roughness: 0.68 });
    }
    if (chestType === 'legendary') {
      accentMat = new THREE.MeshStandardMaterial({
        color: 0x00ffd0,
        emissive: 0x00b392,
        metalness: 0.92,
        emissiveIntensity: 0.85
      });
      chestWood = new THREE.MeshStandardMaterial({ color: 0x0a332c, roughness: 0.62 });
    }

    // Chest Body Box
    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.05, 1.45), chestWood);
    baseMesh.position.y = 0.52;
    baseMesh.castShadow = true;
    group.add(baseMesh);

    // Reinforced Edge Straps & Gold Trim
    const trimBase = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.18, 1.52), accentMat);
    trimBase.position.y = 0.98;
    group.add(trimBase);

    // Ornate Keyhole / Lock Plate
    const lockGroup = new THREE.Group();
    lockGroup.position.set(0, 0.92, 0.78);
    const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.1), accentMat);
    const keyhole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    keyhole.rotation.x = Math.PI / 2;
    keyhole.position.z = 0.02;
    lockGroup.add(lockPlate);
    lockGroup.add(keyhole);
    group.add(lockGroup);

    // Animated Lid Hinge at top rear
    const lidHinge = new THREE.Group();
    lidHinge.position.set(0, 1.05, -0.72);

    // Upper Half-Cylinder Lid
    const lidMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 2.1, 24, 1, false, 0, Math.PI), chestWood);
    lidMesh.rotation.z = Math.PI / 2;
    lidMesh.rotation.y = Math.PI / 2;
    lidMesh.position.set(0, 0, 0.72);
    lidMesh.castShadow = true;
    lidHinge.add(lidMesh);

    const lidTrim = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.12, 0.2), accentMat);
    lidTrim.position.set(0, 0.06, 0.72);
    lidHinge.add(lidTrim);

    group.add(lidHinge);
    group.userData.lidHinge = lidHinge;

    return group;
  }
}
