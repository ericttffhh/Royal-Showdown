import * as THREE from 'three';

/**
 * 3D Model Factory for Clash Royale 3D (Ultra-Detailed AAA Next-Gen Stylized Edition)
 * Distinct form-based 3D models for all Troops, Buildings (Goblin Hut, Inferno Tower, Cannon, etc.), Towers, and Gacha Chests
 */

const materialsCache = new Map();

function getTeamMaterial(type, isBlueOrTeam, extra = {}) {
  const team = typeof isBlueOrTeam === 'string' ? isBlueOrTeam : (isBlueOrTeam ? 'blue' : 'red');
  const key = `${type}_${team}_${JSON.stringify(extra)}`;
  if (materialsCache.has(key)) return materialsCache.get(key);

  let teamColor = 0x1e68ff;
  let teamDark = 0x0c3a9e;
  let teamLight = 0x60a5fa;

  if (team === 'red') {
    teamColor = 0xff2453;
    teamDark = 0x940c2a;
    teamLight = 0xfb7185;
  } else if (team === 'green') {
    teamColor = 0x00e676;
    teamDark = 0x007034;
    teamLight = 0x69f0ae;
  } else if (team === 'purple') {
    teamColor = 0xd500f9;
    teamDark = 0x6a0080;
    teamLight = 0xea80fc;
  }

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
        color: 0x613d20,
        roughness: 0.75,
        metalness: 0.05
      });
      break;
    case 'dark-wood':
      mat = new THREE.MeshStandardMaterial({
        color: 0x382212,
        roughness: 0.8,
        metalness: 0.05
      });
      break;
    case 'thatch':
      mat = new THREE.MeshStandardMaterial({
        color: 0xb5924d,
        roughness: 0.9,
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
        color: 0x54bf36,
        roughness: 0.52,
        metalness: 0.02
      });
      break;
    case 'goblin-skin-dark':
      mat = new THREE.MeshStandardMaterial({
        color: 0x388a22,
        roughness: 0.55
      });
      break;
    case 'bone':
      mat = new THREE.MeshStandardMaterial({
        color: 0xf2eee9,
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

  static createPrincessTower(isBlue, skinId = 'classic') {
    const group = new THREE.Group();
    group.name = 'PrincessTower';

    let stoneMat = getTeamMaterial('stone', isBlue);
    let darkStoneMat = getTeamMaterial('dark-stone', isBlue);
    let teamMat = getTeamMaterial('team', isBlue);
    let goldMat = getTeamMaterial('gold', isBlue);
    let woodMat = getTeamMaterial('wood', isBlue);

    // Apply Tower Skin Themes
    if (skinId === 'inferno') {
      stoneMat = new THREE.MeshStandardMaterial({ color: 0x221111, roughness: 0.6, metalness: 0.4 });
      darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x110808, roughness: 0.7 });
      goldMat = new THREE.MeshStandardMaterial({ color: 0xff3700, emissive: 0xff2200, emissiveIntensity: 1.2, roughness: 0.2 });
      teamMat = new THREE.MeshStandardMaterial({ color: isBlue ? 0xcc3300 : 0x880000, roughness: 0.4 });
    } else if (skinId === 'frost') {
      stoneMat = new THREE.MeshStandardMaterial({ color: 0x5588aa, roughness: 0.3, metalness: 0.3 });
      darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x1b365d, roughness: 0.4 });
      goldMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x00c8ff, emissiveIntensity: 1.4, roughness: 0.1 });
      teamMat = new THREE.MeshStandardMaterial({ color: isBlue ? 0x00bbff : 0x0055aa, roughness: 0.3 });
    } else if (skinId === 'cyber') {
      stoneMat = new THREE.MeshStandardMaterial({ color: 0x1a233a, roughness: 0.2, metalness: 0.8 });
      darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x0b101d, roughness: 0.3, metalness: 0.9 });
      goldMat = new THREE.MeshStandardMaterial({ color: 0xff00bb, emissive: 0xff00bb, emissiveIntensity: 2.0, roughness: 0.1 });
      teamMat = new THREE.MeshStandardMaterial({ color: isBlue ? 0x00f0ff : 0xff0055, emissive: isBlue ? 0x0088cc : 0xaa0033, emissiveIntensity: 0.6 });
    }

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

  static createKingTower(isBlue, skinId = 'classic') {
    const group = new THREE.Group();
    group.name = 'KingTower';

    let stoneMat = getTeamMaterial('stone', isBlue);
    let darkStoneMat = getTeamMaterial('dark-stone', isBlue);
    let teamMat = getTeamMaterial('team', isBlue);
    let goldMat = getTeamMaterial('gold', isBlue);
    let woodMat = getTeamMaterial('wood', isBlue);

    // Apply Tower Skin Themes
    if (skinId === 'inferno') {
      stoneMat = new THREE.MeshStandardMaterial({ color: 0x221111, roughness: 0.6, metalness: 0.4 });
      darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x110808, roughness: 0.7 });
      goldMat = new THREE.MeshStandardMaterial({ color: 0xff3700, emissive: 0xff2200, emissiveIntensity: 1.2, roughness: 0.2 });
      teamMat = new THREE.MeshStandardMaterial({ color: isBlue ? 0xcc3300 : 0x880000, roughness: 0.4 });
    } else if (skinId === 'frost') {
      stoneMat = new THREE.MeshStandardMaterial({ color: 0x5588aa, roughness: 0.3, metalness: 0.3 });
      darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x1b365d, roughness: 0.4 });
      goldMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x00c8ff, emissiveIntensity: 1.4, roughness: 0.1 });
      teamMat = new THREE.MeshStandardMaterial({ color: isBlue ? 0x00bbff : 0x0055aa, roughness: 0.3 });
    } else if (skinId === 'cyber') {
      stoneMat = new THREE.MeshStandardMaterial({ color: 0x1a233a, roughness: 0.2, metalness: 0.8 });
      darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x0b101d, roughness: 0.3, metalness: 0.9 });
      goldMat = new THREE.MeshStandardMaterial({ color: 0xff00bb, emissive: 0xff00bb, emissiveIntensity: 2.0, roughness: 0.1 });
      teamMat = new THREE.MeshStandardMaterial({ color: isBlue ? 0x00f0ff : 0xff0055, emissive: isBlue ? 0x0088cc : 0xaa0033, emissiveIntensity: 0.6 });
    }

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
  // HIGH-POLY STYLIZED MODELS: TROOPS & BUILDINGS (AAA Tier)
  // -------------------------------------------------------------

  static createTroopMesh(cardId, isBlue) {
    const root = new THREE.Group();
    root.name = `Entity_${cardId}_${isBlue ? 'Blue' : 'Red'}`;

    const parts = {};

    const teamMat = getTeamMaterial('team', isBlue);
    const teamDark = getTeamMaterial('team-dark', isBlue);
    const teamLight = getTeamMaterial('team-light', isBlue);
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
    const thatchMat = getTeamMaterial('thatch', isBlue);
    const stoneMat = getTeamMaterial('stone', isBlue);
    const darkStone = getTeamMaterial('dark-stone', isBlue);
    const leatherMat = getTeamMaterial('leather', isBlue);
    const darkLeather = getTeamMaterial('dark-leather', isBlue);
    const whiteCloth = getTeamMaterial('white-cloth', isBlue);

    // Normalizing ID
    const normalizedId = cardId.toLowerCase().replace(/[-_]/g, '');

    switch (normalizedId) {
      // =========================================================
      // 🛖 BUILDINGS (真實 3D 建築結構，絕非人形)
      // =========================================================

      case 'goblinhut': {
        // 🛖 哥布林小屋 (Goblin Hut) - 圓柱泥土木質基座、錐形雙層厚草茅草屋頂、木柱門廊、骨頭圖騰與飄揚隊伍戰旗
        const hutGroup = new THREE.Group();

        // 泥土石塊地基
        const foundation = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.35, 0.35, 24), darkStone);
        foundation.position.y = 0.17;
        foundation.receiveShadow = true;
        foundation.castShadow = true;
        hutGroup.add(foundation);

        // 主屋身 (泥土木造圓形小屋)
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a5b35, roughness: 0.9 });
        const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 1.25, 24), wallMat);
        wall.position.y = 0.95;
        wall.castShadow = true;
        wall.receiveShadow = true;
        hutGroup.add(wall);

        // 支撐木樁柱子 (4 根環繞木柱)
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI * 2) / 4 + Math.PI / 4;
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.45, 12), woodMat);
          post.position.set(Math.cos(angle) * 1.12, 0.95, Math.sin(angle) * 1.12);
          post.castShadow = true;
          hutGroup.add(post);
        }

        // 門廊入口 (暗黑門洞)
        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.25), darkWood);
        doorFrame.position.set(0, 0.7, 1.05);
        hutGroup.add(doorFrame);

        const doorHole = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.75, 0.2), new THREE.MeshBasicMaterial({ color: 0x1a0f08 }));
        doorHole.position.set(0, 0.65, 1.1);
        hutGroup.add(doorHole);

        // 門口小燈籠 (黃光)
        const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), new THREE.MeshStandardMaterial({
          color: 0xffdd44,
          emissive: 0xffaa00,
          emissiveIntensity: 2.0
        }));
        lantern.position.set(0.32, 1.15, 1.15);
        hutGroup.add(lantern);

        // 雙層巨大錐形茅草屋頂
        const roof1 = new THREE.Mesh(new THREE.ConeGeometry(1.65, 0.95, 24), thatchMat);
        roof1.position.y = 1.95;
        roof1.castShadow = true;
        hutGroup.add(roof1);

        const roof2 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.95, 24), thatchMat);
        roof2.position.y = 2.55;
        roof2.castShadow = true;
        hutGroup.add(roof2);

        // 屋頂交叉木樑與獸骨圖騰柱
        const totemPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 8), darkWood);
        totemPole.position.y = 3.2;
        totemPole.castShadow = true;
        hutGroup.add(totemPole);

        const skullTotem = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), boneMat);
        skullTotem.position.set(0, 3.7, 0);
        hutGroup.add(skullTotem);

        // 隊伍小布旗
        const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.35), teamMat);
        flag.position.set(0.25, 3.4, 0);
        flag.rotation.y = Math.PI / 2;
        hutGroup.add(flag);

        // 側邊小柵欄
        const fenceL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.08), woodMat);
        fenceL.position.set(-1.15, 0.4, 0.5);
        fenceL.rotation.y = 0.5;
        hutGroup.add(fenceL);

        root.add(hutGroup);
        parts.building = hutGroup;
        break;
      }

      case 'inferno':
      case 'infernotower': {
        // 🗼 地獄防禦塔 (Inferno Tower) - 黑曜石基座、熔岩裂紋、四爪環繞、懸浮高熱聚焦熔岩水晶球
        const towerGroup = new THREE.Group();

        // 黑曜石八角底座
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.45, 0.6, 8), blackIron);
        base.position.y = 0.3;
        base.castShadow = true;
        base.receiveShadow = true;
        towerGroup.add(base);

        // 熔岩裂紋裝飾底環
        const lavaRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.08, 8, 24), new THREE.MeshStandardMaterial({
          color: 0xff4400,
          emissive: 0xff3300,
          emissiveIntensity: 2.5
        }));
        lavaRing.rotation.x = Math.PI / 2;
        lavaRing.position.y = 0.55;
        towerGroup.add(lavaRing);

        // 四根環繞的抓握石柱爪
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI * 2) / 4;
          const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.2, 0.35), darkStone);
          pylon.position.set(Math.cos(angle) * 0.82, 1.4, Math.sin(angle) * 0.82);
          pylon.rotation.y = -angle;
          pylon.rotation.x = 0.12;
          pylon.castShadow = true;
          towerGroup.add(pylon);

          const goldCap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 4), goldMat);
          goldCap.position.set(Math.cos(angle) * 0.78, 2.55, Math.sin(angle) * 0.78);
          goldCap.rotation.y = -angle;
          towerGroup.add(goldCap);
        }

        // 中央高溫懸浮核心 (Inferno Core)
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 24), new THREE.MeshStandardMaterial({
          color: 0xff6600,
          emissive: 0xff2200,
          emissiveIntensity: 3.5,
          roughness: 0.1,
          metalness: 0.2
        }));
        core.position.y = 1.6;
        towerGroup.add(core);

        // 頂部聚能光環
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.05, 12, 24), goldMat);
        halo.rotation.x = Math.PI / 2;
        halo.position.y = 2.45;
        towerGroup.add(halo);

        root.add(towerGroup);
        parts.building = towerGroup;
        break;
      }

      case 'cannon': {
        // 💣 加農砲 (Cannon) - 橡木輪軸底座、金屬輪轂、高仰角鑄鐵砲管
        const cannonGroup = new THREE.Group();

        // 輪軸木架
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), darkWood);
        frame.position.y = 0.35;
        frame.castShadow = true;
        cannonGroup.add(frame);

        // 4 個木質鐵箍車輪
        [[-0.65, -0.45], [-0.65, 0.45], [0.65, -0.45], [0.65, 0.45]].forEach(([wx, wz]) => {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 16), darkMetal);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.3, wz);
          wheel.castShadow = true;
          cannonGroup.add(wheel);
        });

        // 砲身
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 1.5, 24), darkMetal);
        barrel.rotation.x = Math.PI / 3.5;
        barrel.position.set(0, 0.75, 0.2);
        barrel.castShadow = true;
        cannonGroup.add(barrel);

        const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.05, 8, 20), goldMat);
        muzzleRing.position.set(0, 1.35, 0.75);
        muzzleRing.rotation.x = Math.PI / 3.5;
        cannonGroup.add(muzzleRing);

        root.add(cannonGroup);
        parts.building = cannonGroup;
        break;
      }

      case 'tesla': {
        // ⚡ 特斯拉電磁塔 (Tesla) - 石質升降井、多層銅製線圈、高壓放電球
        const teslaGroup = new THREE.Group();

        const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.4), darkStone);
        base.position.y = 0.25;
        teslaGroup.add(base);

        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 1.6, 20), metalMat);
        shaft.position.y = 1.1;
        teslaGroup.add(shaft);

        for (let k = 0; k < 4; k++) {
          const coil = new THREE.Mesh(new THREE.TorusGeometry(0.36 - k * 0.03, 0.05, 10, 24), brightGold);
          coil.rotation.x = Math.PI / 2;
          coil.position.y = 0.7 + k * 0.3;
          teslaGroup.add(coil);
        }

        const sparkBall = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 20), new THREE.MeshStandardMaterial({
          color: 0x00f0ff,
          emissive: 0x00bfff,
          emissiveIntensity: 3.0
        }));
        sparkBall.position.y = 2.05;
        teslaGroup.add(sparkBall);

        root.add(teslaGroup);
        parts.building = teslaGroup;
        break;
      }

      case 'tombstone': {
        // 🪦 骷髏墓碑 (Tombstone) - 哥德式花崗岩墓碑、新翻泥土、破土而出的白骨手臂
        const tombGroup = new THREE.Group();

        const mound = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 12), darkWood);
        mound.scale.set(1.2, 0.3, 1.4);
        mound.position.y = 0.15;
        tombGroup.add(mound);

        const headstone = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.2), stoneMat);
        headstone.position.set(0, 0.7, -0.35);
        headstone.rotation.x = -0.1;
        headstone.castShadow = true;
        tombGroup.add(headstone);

        const cross = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.22), darkStone);
        cross.position.set(0, 0.85, -0.34);
        tombGroup.add(cross);

        // 伸出地面的白骨手
        const boneArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 8), boneMat);
        boneArm.position.set(0.18, 0.45, 0.2);
        boneArm.rotation.x = 0.3;
        tombGroup.add(boneArm);

        root.add(tombGroup);
        parts.building = tombGroup;
        break;
      }

      // =========================================================
      // 🗡️ TROOPS (極致精細角色建模，嚴格匹配原創形態)
      // =========================================================

      case 'goblins':
      case 'goblin':
      case 'speargoblins':
      case 'speargoblin': {
        // 🗡️ 哥布林刺客 (Goblin) - 翡翠綠皮膚、精靈大尖耳、金耳環、長鉤鼻、狡黠笑眼、皮革短褲、精鋼彎刀
        const isSpear = normalizedId.includes('spear');

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.45, 18), goblinSkin);
        body.position.y = 0.45;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        // 皮革腰帶與金扣
        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.08, 18), darkLeather);
        belt.position.y = 0.32;
        root.add(belt);

        // 哥布林大頭 (尖長特徵)
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 18), goblinSkin);
        head.position.y = 0.8;
        head.scale.set(1.05, 1.0, 0.95);
        head.castShadow = true;

        // 眼睛
        addCleanStylizedEyes(head, 0.045, 0.11, 0.02, 0.19);

        // 哥布林長鉤鼻
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 8), goblinSkin);
        nose.rotation.x = Math.PI / 2 + 0.2;
        nose.position.set(0, -0.01, 0.22);
        head.add(nose);

        // 左右大尖耳朵
        [-1, 1].forEach(dir => {
          const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 8), goblinSkin);
          ear.position.set(dir * 0.24, 0.04, -0.02);
          ear.rotation.z = dir * -1.2;
          ear.rotation.x = -0.2;
          head.add(ear);

          // 金耳環
          const earring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 6, 12), brightGold);
          earring.position.set(dir * 0.3, -0.04, -0.02);
          head.add(earring);
        });

        root.add(head);
        parts.head = head;

        // 右手臂與武器 (短彎刀 或 投擲長矛)
        const armR = new THREE.Group();
        armR.position.set(0.26, 0.55, 0);

        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.3, 12), goblinSkin);
        armMeshR.position.y = -0.12;
        armR.add(armMeshR);

        if (isSpear) {
          const spear = new THREE.Group();
          spear.position.set(0, -0.2, 0.15);
          spear.rotation.x = Math.PI / 4;
          const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 8), darkWood);
          spear.add(shaft);
          const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 8), metalMat);
          tip.position.y = 0.6;
          spear.add(tip);
          armR.add(spear);
          parts.weapon = spear;
        } else {
          const dagger = new THREE.Group();
          dagger.position.set(0, -0.18, 0.15);
          dagger.rotation.x = Math.PI / 4;
          const dBlade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.02), metalMat);
          dBlade.position.y = 0.22;
          dagger.add(dBlade);
          armR.add(dagger);
          parts.weapon = dagger;
        }

        root.add(armR);
        parts.rightArm = armR;

        // 左手臂
        const armL = new THREE.Group();
        armL.position.set(-0.26, 0.55, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.3, 12), goblinSkin);
        armMeshL.position.y = -0.12;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

        // 雙腿
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.28, 12), darkLeather);
        legL.position.set(-0.09, 0.14, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.28, 12), darkLeather);
        legR.position.set(0.09, 0.14, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'skeletons':
      case 'skeleton': {
        // 💀 骷髏兵 (Skeleton) - 純白骨骼頭骨、眼窩深凹、肋骨、脊椎骨、古舊骨劍、圓形小盾
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.35, 12), boneMat);
        body.position.y = 0.42;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        // 肋骨 (3 圈立體白骨環)
        for (let r = 0; r < 3; r++) {
          const rib = new THREE.Mesh(new THREE.TorusGeometry(0.13 - r * 0.015, 0.02, 6, 16), boneMat);
          rib.rotation.x = Math.PI / 2;
          rib.position.y = 0.35 + r * 0.08;
          root.add(rib);
        }

        // 骷髏大頭
        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 16), boneMat);
        skull.position.y = 0.72;
        skull.castShadow = true;

        // 深凹的黑眼窩
        [-0.06, 0.06].forEach(ex => {
          const eyeHole = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({ color: 0x0a0a0a }));
          eyeHole.position.set(ex, 0.02, 0.16);
          skull.add(eyeHole);
        });

        // 骷髏牙齒下顎
        const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.08), boneMat);
        jaw.position.set(0, -0.11, 0.12);
        skull.add(jaw);

        root.add(skull);
        parts.head = skull;

        // 右手臂與白骨短劍
        const armR = new THREE.Group();
        armR.position.set(0.2, 0.5, 0);

        const boneArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 8), boneMat);
        boneArmR.position.y = -0.12;
        armR.add(boneArmR);

        const sword = new THREE.Group();
        sword.position.set(0, -0.2, 0.12);
        sword.rotation.x = Math.PI / 4;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.02), metalMat);
        blade.position.y = 0.2;
        sword.add(blade);
        armR.add(sword);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = sword;

        // 左手臂與白骨盾
        const armL = new THREE.Group();
        armL.position.set(-0.2, 0.5, 0);
        const boneArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 8), boneMat);
        boneArmL.position.y = -0.12;
        armL.add(boneArmL);

        const buckler = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16), darkWood);
        buckler.rotation.x = Math.PI / 2;
        buckler.position.set(-0.06, -0.1, 0.12);
        armL.add(buckler);

        root.add(armL);
        parts.leftArm = armL;

        // 雙腿
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.28, 8), boneMat);
        legL.position.set(-0.07, 0.14, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.28, 8), boneMat);
        legR.position.set(0.07, 0.14, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'archers':
      case 'archer': {
        // 🏹 弓箭手 (Archers) - 雙辮子洋紅長髮、羽毛射手帽、精靈綠/藍隊服、背部箭筒、精準反曲復合弓
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.65, 20), teamMat);
        body.position.y = 0.65;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 20), darkLeather);
        belt.position.y = 0.52;
        root.add(belt);

        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.04), goldMat);
        buckle.position.set(0, 0.52, 0.25);
        root.add(buckle);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 18), skinMat);
        head.position.y = 1.15;
        head.castShadow = true;
        addCleanStylizedEyes(head, 0.05, 0.11, 0.02, 0.21);

        const hairMat = new THREE.MeshStandardMaterial({ color: 0xdf5b25, roughness: 0.65 });
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 14), hairMat);
        hair.position.set(0, 0.03, -0.04);
        head.add(hair);

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

        const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.6, 12), darkLeather);
        quiver.position.set(0.12, 0.75, -0.24);
        quiver.rotation.z = -0.3;
        root.add(quiver);

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

        const armL = new THREE.Group();
        armL.position.set(-0.32, 0.82, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.4, 14), skinMat);
        armMeshL.position.y = -0.18;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

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

      case 'knight': {
        // ⚔️ 皇家騎士 (Knight) - 精鋼鍛造鎧甲、金色滾邊、隊伍飄逸披風、發光符文銀刃長劍、獅心盾牌
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.72, 24), metalMat);
        body.position.y = 0.72;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        const trim = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.03, 10, 24), goldMat);
        trim.rotation.x = Math.PI / 2;
        trim.position.y = 0.85;
        root.add(trim);

        const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.75, 12, 12), teamMat);
        cape.position.set(0, 0.65, -0.32);
        cape.rotation.x = 0.15;
        cape.castShadow = true;
        root.add(cape);

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

        const armR = new THREE.Group();
        armR.position.set(0.42, 0.9, 0);

        const pauldronR = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), goldMat);
        armR.add(pauldronR);

        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.45, 16), metalMat);
        armMeshR.position.y = -0.22;
        armR.add(armMeshR);

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

        const armL = new THREE.Group();
        armL.position.set(-0.42, 0.9, 0);

        const pauldronL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), goldMat);
        armL.add(pauldronL);

        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.45, 16), metalMat);
        armMeshL.position.y = -0.22;
        armL.add(armMeshL);

        const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.65, 16), teamMat);
        shield.position.set(-0.1, -0.15, 0.2);
        shield.rotation.y = Math.PI / 2;

        const shieldRim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 20), goldMat);
        shield.add(shieldRim);
        armL.add(shield);

        root.add(armL);
        parts.leftArm = armL;

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

      case 'giant': {
        // 🗿 巨人 (Giant) - 壯碩肌理身軀、毛皮滾邊厚皮甲、粗獷濃密橘紅鬍鬚、碎石重拳
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.58, 1.25, 24), darkLeather);
        body.position.y = 1.35;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.16, 12, 24), thatchMat);
        collar.rotation.x = Math.PI / 2;
        collar.position.y = 1.95;
        root.add(collar);

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

      case 'pekka':
      case 'minipekka': {
        // 🤖 皮卡超人 / 小皮卡 - 重型日本武士機甲、發光霓虹雙角、紫色電目光帶、鋸齒等離子巨劍
        const isBig = normalizedId === 'pekka';
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

        const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.62 * s, 0.45 * s, 0.12 * s), teamMat);
        chestPlate.position.set(0, 0.95 * s, 0.24 * s);
        root.add(chestPlate);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.48 * s, 0.42 * s, 0.42 * s), blackIron);
        head.position.y = 1.38 * s;
        head.castShadow = true;

        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.38 * s, 0.08 * s, 0.08 * s), neonCyan);
        visor.position.set(0, 0.02 * s, 0.21 * s);
        head.add(visor);

        [-1, 1].forEach(dir => {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09 * s, 0.55 * s, 16), neonPurple);
          horn.position.set(dir * 0.32 * s, 0.3 * s, 0);
          horn.rotation.z = dir * -0.65;
          horn.rotation.x = -0.2;
          head.add(horn);
        });

        root.add(head);
        parts.head = head;

        const armR = new THREE.Group();
        armR.position.set(0.52 * s, 1.05 * s, 0);

        const pauldronR = new THREE.Mesh(new THREE.BoxGeometry(0.32 * s, 0.32 * s, 0.32 * s), darkMetal);
        armR.add(pauldronR);

        const armMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.45 * s, 0.2 * s), blackIron);
        armMeshR.position.y = -0.26 * s;
        armR.add(armMeshR);

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

        const armL = new THREE.Group();
        armL.position.set(-0.52 * s, 1.05 * s, 0);
        const pauldronL = new THREE.Mesh(new THREE.BoxGeometry(0.32 * s, 0.32 * s, 0.32 * s), darkMetal);
        armL.add(pauldronL);
        const armMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.45 * s, 0.2 * s), blackIron);
        armMeshL.position.y = -0.26 * s;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

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

      case 'dragon':
      case 'babydragon':
      case 'infernodragon': {
        // 🐲 飛龍寶寶 / 地獄飛龍 - 圓潤龍身、明黃肚皮、立體龍角、飛舞肉翼、長尾
        const isInferno = normalizedId.includes('inferno');
        const dragonSkin = new THREE.MeshStandardMaterial({
          color: isInferno ? 0x228855 : 0x44bd32,
          roughness: 0.45,
          metalness: 0.15
        });
        const underbelly = new THREE.MeshStandardMaterial({
          color: 0xf5cd79,
          roughness: 0.5
        });

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 20), dragonSkin);
        body.position.y = 1.0;
        body.scale.set(1, 1.15, 1.25);
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.44, 20, 16), underbelly);
        belly.position.set(0, 0.92, 0.18);
        belly.scale.set(0.85, 0.95, 0.9);
        root.add(belly);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 20), dragonSkin);
        head.position.set(0, 1.45, 0.35);
        head.castShadow = true;

        addCleanStylizedEyes(head, 0.08, 0.24, 0.06, 0.3);

        [-1, 1].forEach(dir => {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 12), brightGold);
          horn.position.set(dir * 0.22, 0.32, -0.1);
          horn.rotation.z = dir * -0.4;
          horn.rotation.x = -0.3;
          head.add(horn);
        });

        if (isInferno) {
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

        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.55, 16), dragonSkin);
        tail.position.set(0, 0.85, -0.65);
        tail.rotation.x = -Math.PI / 3;
        root.add(tail);
        break;
      }

      case 'wizard':
      case 'electrowizard': {
        // 🧙‍♂️ 魔法師 / 電磁法師 - 奧術法袍、魔力符文腰帶、閃爍火球/雷電法球、特色法師兜帽/刺蝟頭
        const isElectro = normalizedId.includes('electro');
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

        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.1, 20), darkLeather);
        belt.position.y = 0.65;
        root.add(belt);

        const rune = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), spellMat);
        rune.position.set(0, 0.65, 0.28);
        root.add(rune);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 18), skinMat);
        head.position.y = 1.3;
        head.castShadow = true;
        addCleanStylizedEyes(head, 0.055, 0.12, 0.02, 0.22);

        if (isElectro) {
          const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
          for (let i = 0; i < 7; i++) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35, 8), hairMat);
            spike.position.set((Math.random() - 0.5) * 0.3, 0.22 + Math.random() * 0.1, (Math.random() - 0.5) * 0.3);
            spike.rotation.set((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5);
            head.add(spike);
          }
        } else {
          const hood = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 14), robeMat);
          hood.position.set(0, 0.04, -0.05);
          head.add(hood);
        }

        root.add(head);
        parts.head = head;

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

      case 'hogrider':
      case 'hog_rider': {
        // 🐗 野豬騎士 (Hog Rider) - 獠牙戰豬坐騎、莫霍克髮型、長柄重戰錘
        const mount = new THREE.Group();
        mount.position.y = 0.45;

        const hogMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.75 });
        const hogBody = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 16), hogMat);
        hogBody.scale.set(0.85, 0.9, 1.3);
        hogBody.castShadow = true;
        mount.add(hogBody);

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

        const riderBody = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.7, 20), darkSkin);
        riderBody.position.set(0, 1.1, -0.05);
        riderBody.castShadow = true;
        root.add(riderBody);
        parts.body = riderBody;

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

        const armL = new THREE.Group();
        armL.position.set(-0.42, 1.25, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.45, 14), darkSkin);
        armMeshL.position.y = -0.22;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;
        break;
      }

      case 'musketeer': {
        // 👒 火槍手 (Musketeer) - 寬簷羽毛騎士帽、紫色秀髮、金色排扣皇家制服、大口徑拋光黃銅火銃砲
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.7, 20), teamMat);
        body.position.y = 0.7;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        for (let i = 0; i < 3; i++) {
          const btn = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), brightGold);
          btn.position.set(0, 0.6 + i * 0.12, 0.26);
          root.add(btn);
        }

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 20, 18), skinMat);
        head.position.y = 1.2;
        head.castShadow = true;
        addCleanStylizedEyes(head, 0.055, 0.12, 0.02, 0.22);

        const hairMat = new THREE.MeshStandardMaterial({ color: 0x86198f, roughness: 0.65 });
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 14), hairMat);
        hair.position.set(0, 0.02, -0.04);
        head.add(hair);

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

        const armR = new THREE.Group();
        armR.position.set(0.35, 0.88, 0);

        const epauletR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), brightGold);
        armR.add(epauletR);

        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 14), teamMat);
        armMeshR.position.y = -0.2;
        armR.add(armMeshR);

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

        const armL = new THREE.Group();
        armL.position.set(-0.35, 0.88, 0);
        const epauletL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), brightGold);
        armL.add(epauletL);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 14), teamMat);
        armMeshL.position.y = -0.2;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

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
        // 🪓 女武神 (Valkyrie) - 飄逸橙髮、旋風雙刃斧、戰鬥束胸與毛皮短裙
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.68, 20), darkLeather);
        body.position.y = 0.68;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

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

        const armL = new THREE.Group();
        armL.position.set(-0.36, 0.85, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 14), skinMat);
        armMeshL.position.y = -0.2;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

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

      // =========================================================
      // 🌟 HERO CHARACTERS (特色原創英雄)
      // =========================================================

      case 'cyberninja': {
        // 🥷 賽博幻影忍者 (Cyber Ninja) - 碳纖維奈米裝甲、青色光學面罩、背負雙光刃
        const cyberArmor = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.85, roughness: 0.25 });
        const cyanLaser = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00e5ff, emissiveIntensity: 3.0 });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.65, 18), cyberArmor);
        body.position.y = 0.68;
        root.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 16), cyberArmor);
        head.position.y = 1.18;

        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.08), cyanLaser);
        visor.position.set(0, 0.02, 0.19);
        head.add(visor);
        root.add(head);
        parts.head = head;

        const armR = new THREE.Group();
        armR.position.set(0.35, 0.82, 0);
        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.4, 12), cyberArmor);
        armMeshR.position.y = -0.18;
        armR.add(armMeshR);

        const katana = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 0.02), cyanLaser);
        katana.position.set(0, -0.3, 0.25);
        katana.rotation.x = Math.PI / 4;
        armR.add(katana);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = katana;

        const armL = new THREE.Group();
        armL.position.set(-0.35, 0.82, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.4, 12), cyberArmor);
        armMeshL.position.y = -0.18;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.4, 12), cyberArmor);
        legL.position.set(-0.13, 0.2, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.4, 12), cyberArmor);
        legR.position.set(0.13, 0.2, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'thundervalkyrie': {
        // ⚡ 雷霆女武神 (Thunder Valkyrie) - 展翼金盔、雷霆發光雙手巨斧
        const armorMat = new THREE.MeshStandardMaterial({ color: 0x1f293d, metalness: 0.75, roughness: 0.25 });
        const thunderMat = new THREE.MeshStandardMaterial({ color: 0xffea00, emissive: 0xffcc00, emissiveIntensity: 2.8 });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.72, 18), teamMat);
        body.position.y = 0.72;
        root.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 18), skinMat);
        head.position.y = 1.22;
        addCleanStylizedEyes(head, 0.05, 0.11, 0.02, 0.22);

        const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.2, 16), brightGold);
        helmet.position.y = 0.12;
        head.add(helmet);

        [-0.34, 0.34].forEach(x => {
          const wing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.38, 0.24), brightGold);
          wing.position.set(x, 0.2, -0.05);
          wing.rotation.z = x > 0 ? -0.45 : 0.45;
          head.add(wing);
        });

        root.add(head);
        parts.head = head;

        const armR = new THREE.Group();
        armR.position.set(0.42, 0.88, 0);
        const axeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.25, 12), darkWood);
        axeHandle.rotation.x = Math.PI / 4;
        axeHandle.position.set(0, 0, 0.38);

        const axeBlade1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.38), thunderMat);
        axeBlade1.position.set(0, 0.45, 0.16);
        axeHandle.add(axeBlade1);

        const axeBlade2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.38), thunderMat);
        axeBlade2.position.set(0, 0.45, -0.16);
        axeHandle.add(axeBlade2);

        armR.add(axeHandle);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = axeHandle;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.44, 12), armorMat);
        legL.position.set(-0.16, 0.22, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.44, 12), armorMat);
        legR.position.set(0.16, 0.22, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'mechagolem': {
        // 🦾 泰坦機甲魔像 (Mecha Golem) - 重合金裝甲塊、胸口旋轉熔岩反應爐、液壓巨拳
        const heavySteel = new THREE.MeshStandardMaterial({ color: 0x2b3342, metalness: 0.88, roughness: 0.18 });
        const coreMat = new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff3300, emissiveIntensity: 3.2 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.3, 0.98), heavySteel);
        body.position.y = 1.35;
        root.add(body);
        parts.body = body;

        const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.16, 16), coreMat);
        chestCore.rotation.x = Math.PI / 2;
        chestCore.position.set(0, 1.4, 0.52);
        root.add(chestCore);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.55), heavySteel);
        head.position.y = 2.15;
        const eyeVisor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.12), coreMat);
        eyeVisor.position.set(0, 0.02, 0.28);
        head.add(eyeVisor);
        root.add(head);
        parts.head = head;

        const armL = new THREE.Group();
        armL.position.set(-0.95, 1.45, 0);
        const fistL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.98, 0.5), heavySteel);
        fistL.position.y = -0.4;
        armL.add(fistL);
        root.add(armL);
        parts.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(0.95, 1.45, 0);
        const fistR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.98, 0.5), heavySteel);
        fistR.position.y = -0.4;
        armR.add(fistR);
        root.add(armR);
        parts.rightArm = armR;

        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.8, 0.5), heavySteel);
        legL.position.set(-0.38, 0.4, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.8, 0.5), heavySteel);
        legR.position.set(0.38, 0.4, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'phoenixmage': {
        // 🦅 不死鳥炎術師 (Phoenix Mage) - 涅槃神火長袍、金色太陽神冠、不死鳥天火烈翼、永恆天火法杖
        const robeMat = new THREE.MeshStandardMaterial({ color: 0x8a1505, roughness: 0.35 });
        const flameMat = new THREE.MeshStandardMaterial({ color: 0xff7700, emissive: 0xff3300, emissiveIntensity: 3.0 });

        const body = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.95, 16), robeMat);
        body.position.y = 1.75;
        root.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 18), skinMat);
        head.position.set(0, 2.3, 0);
        addCleanStylizedEyes(head, 0.05, 0.11, 0.02, 0.22);

        const crown = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.38, 4), brightGold);
        crown.position.set(0, 0.22, 0);
        head.add(crown);
        root.add(head);
        parts.head = head;

        const wingsGroup = new THREE.Group();
        wingsGroup.position.set(0, 1.9, -0.15);

        [-1, 1].forEach(dir => {
          const wing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.45), flameMat);
          wing.position.set(dir * 0.6, 0, 0);
          wing.rotation.z = dir * -0.25;
          wingsGroup.add(wing);
        });

        root.add(wingsGroup);
        parts.wings = wingsGroup;

        const armR = new THREE.Group();
        armR.position.set(0.42, 1.85, 0);
        const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 12), brightGold);
        staff.position.set(0, 0.1, 0.2);
        armR.add(staff);

        const fireOrb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), flameMat);
        fireOrb.position.set(0, 0.8, 0.2);
        armR.add(fireOrb);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = staff;
        break;
      }

      // =========================================================
      // 👑 皇室英雄冠軍角色 (Champions)
      // =========================================================

      case 'goldenknight': {
        // 🤴 金甲狂劍士 (Golden Knight) - 全身純金鎧甲、飄逸金色長髮、雙肩雄獅金肩甲、流光金聖劍
        const hairMat = new THREE.MeshStandardMaterial({ color: 0xffdf6d, roughness: 0.3 });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.76, 20), brightGold);
        body.position.y = 0.76;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        // 胸甲皇家徽記寶石
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00a2ff, emissiveIntensity: 1.5 }));
        gem.position.set(0, 0.88, 0.3);
        root.add(gem);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 18), skinMat);
        head.position.y = 1.28;
        head.castShadow = true;
        addCleanStylizedEyes(head, 0.05, 0.12, 0.02, 0.22);

        // 飄逸金髮
        const hair = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 12), hairMat);
        hair.position.set(0, 0.05, -0.15);
        hair.rotation.x = -0.5;
        head.add(hair);

        // 英雄金冠額帶
        const headband = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 8, 24), brightGold);
        headband.rotation.x = Math.PI / 2;
        headband.position.y = 0.08;
        head.add(headband);

        root.add(head);
        parts.head = head;

        // 雙肩黃金獅子肩甲
        [-0.4, 0.4].forEach(x => {
          const pad = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), brightGold);
          pad.position.set(x, 0.95, 0);
          pad.scale.set(1.2, 0.8, 1);
          root.add(pad);
        });

        // 右手神聖金光聖劍
        const armR = new THREE.Group();
        armR.position.set(0.42, 0.9, 0);
        const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.04), brightGold);
        swordBlade.position.set(0, -0.1, 0.3);
        swordBlade.rotation.x = Math.PI / 4;
        armR.add(swordBlade);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = swordBlade;

        const armL = new THREE.Group();
        armL.position.set(-0.42, 0.9, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.42, 14), brightGold);
        armMeshL.position.y = -0.18;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.46, 14), brightGold);
        legL.position.set(-0.15, 0.23, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.46, 14), brightGold);
        legR.position.set(0.15, 0.23, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'skeletonking': {
        // 👑💀 骷髏死靈王者 (Skeleton King) - 巨型骷髏帝皇、紫魂胸爐、王者金冠、死靈骨錘、霸氣猩紅披風
        const soulMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 2.5 });
        const capeMat = new THREE.MeshStandardMaterial({ color: 0x7e0825, roughness: 0.6 });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.85, 18), boneMat);
        body.position.y = 0.85;
        root.add(body);
        parts.body = body;

        // 胸前靈魂核心水晶 (聚集亡魂)
        const soulCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), soulMat);
        soulCore.position.set(0, 0.95, 0.32);
        root.add(soulCore);

        // 骷髏頭骨
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.46, 0.42), boneMat);
        head.position.y = 1.5;
        // 幽冥紫光雙眼
        [-0.12, 0.12].forEach(x => {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), soulMat);
          eye.position.set(x, 0.04, 0.22);
          head.add(eye);
        });

        // 王者骨皇金冠
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.22, 6), brightGold);
        crown.position.y = 0.32;
        head.add(crown);
        root.add(head);
        parts.head = head;

        // 霸氣紅披風
        const cape = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.06), capeMat);
        cape.position.set(0, 0.9, -0.25);
        cape.rotation.x = 0.12;
        root.add(cape);

        // 右手死靈戰槌
        const armR = new THREE.Group();
        armR.position.set(0.52, 1.05, 0);
        const maceShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.35, 12), blackIron);
        maceShaft.position.set(0, 0.1, 0.35);
        maceShaft.rotation.x = Math.PI / 4;
        const maceHead = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25), soulMat);
        maceHead.position.set(0, 0.65, 0);
        maceShaft.add(maceHead);
        armR.add(maceShaft);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = maceShaft;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.5, 12), boneMat);
        legL.position.set(-0.18, 0.25, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.5, 12), boneMat);
        legR.position.set(0.18, 0.25, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'archerqueen': {
        // 👸🏹 幻影隱匿弓皇 (Archer Queen) - 翡翠長裙、精靈金冠、重裝神射連弩、隱匿幻影披肩
        const dressMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 });
        const capeMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.5 });
        const xbowMat = new THREE.MeshStandardMaterial({ color: 0x3b2111, metalness: 0.6, roughness: 0.3 });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.74, 18), dressMat);
        body.position.y = 0.72;
        root.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 18), skinMat);
        head.position.y = 1.22;
        addCleanStylizedEyes(head, 0.05, 0.11, 0.02, 0.21);

        // 精靈皇冠
        const tiara = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.25, 5), brightGold);
        tiara.position.y = 0.22;
        head.add(tiara);
        root.add(head);
        parts.head = head;

        // 幻影披肩
        const cloak = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.05), capeMat);
        cloak.position.set(0, 0.75, -0.18);
        root.add(cloak);

        // 重型改良連弩
        const armR = new THREE.Group();
        armR.position.set(0.38, 0.85, 0);
        const xbow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.55), xbowMat);
        xbow.position.set(0, 0, 0.3);
        const xbowBow = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 8, 20, Math.PI), brightGold);
        xbowBow.rotation.x = Math.PI / 2;
        xbowBow.position.set(0, 0, 0.26);
        xbow.add(xbowBow);
        armR.add(xbow);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = xbow;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 12), dressMat);
        legL.position.set(-0.12, 0.21, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 12), dressMat);
        legR.position.set(0.12, 0.21, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      // =========================================================
      // ⚡ 卡牌覺醒進化形態 (Evolutions)
      // =========================================================

      case 'wizard_evo':
      case 'wizardevo': {
        const evoMesh = ModelFactory.createTroopMesh('wizard', isBlue);
        // Add mystical cosmic rings around the wizard
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 12, 32), new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xc084fc, emissiveIntensity: 3.0 }));
        halo.rotation.x = Math.PI / 2;
        halo.position.y = 1.35;
        evoMesh.root.add(halo);
        return evoMesh;
      }

      case 'knight_evo':
      case 'knightevo': {
        const evoMesh = ModelFactory.createTroopMesh('knight', isBlue);
        // Add giant glowing holy shield
        const energyShield = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.8, 0.05), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.0, transparent: true, opacity: 0.85 }));
        energyShield.position.set(-0.35, 0.85, 0.35);
        evoMesh.root.add(energyShield);
        return evoMesh;
      }

      case 'archers_evo':
      case 'archersevo': {
        const evoMesh = ModelFactory.createTroopMesh('archers', isBlue);
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 8, 24), new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.5 }));
        halo.position.y = 1.35;
        evoMesh.root.add(halo);
        return evoMesh;
      }

      case 'barbarians_evo':
      case 'barbariansevo': {
        const evoMesh = ModelFactory.createTroopMesh('goblins', isBlue);
        const rageRing = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 2.5, side: THREE.DoubleSide }));
        rageRing.rotation.x = -Math.PI / 2;
        rageRing.position.y = 0.05;
        evoMesh.root.add(rageRing);
        return evoMesh;
      }

      default: {
        // 通用兜底高品質戰士 (預防未知卡牌)
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
