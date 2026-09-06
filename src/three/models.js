import * as THREE from 'three';

/**
 * 3D Model Factory for Clash Royale 3D (Ultra-Detailed AAA Stylized Edition)
 * Builds exquisitely detailed characters, mounts, weapons, accessories, towers, spawner buildings, and animated chests
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
        color: 0x6b778a,
        roughness: 0.8,
        metalness: 0.12,
        flatShading: true
      });
      break;
    case 'dark-stone':
      mat = new THREE.MeshStandardMaterial({
        color: 0x3d4452,
        roughness: 0.85,
        metalness: 0.15,
        flatShading: true
      });
      break;
    case 'gold':
      mat = new THREE.MeshStandardMaterial({
        color: 0xffc324,
        roughness: 0.22,
        metalness: 0.88,
        emissive: 0x332000,
        emissiveIntensity: 0.15
      });
      break;
    case 'bright-gold':
      mat = new THREE.MeshStandardMaterial({
        color: 0xffe259,
        roughness: 0.18,
        metalness: 0.92,
        emissive: 0x553500,
        emissiveIntensity: 0.25
      });
      break;
    case 'wood':
      mat = new THREE.MeshStandardMaterial({
        color: 0x5c381e,
        roughness: 0.75,
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
        roughness: 0.92,
        metalness: 0.02,
        flatShading: true
      });
      break;
    case 'metal':
      mat = new THREE.MeshStandardMaterial({
        color: 0xdde7f2,
        roughness: 0.22,
        metalness: 0.82
      });
      break;
    case 'dark-metal':
      mat = new THREE.MeshStandardMaterial({
        color: 0x272d3b,
        roughness: 0.3,
        metalness: 0.78
      });
      break;
    case 'black-iron':
      mat = new THREE.MeshStandardMaterial({
        color: 0x181c24,
        roughness: 0.35,
        metalness: 0.85
      });
      break;
    case 'skin':
      mat = new THREE.MeshStandardMaterial({
        color: 0xfbd6b0,
        roughness: 0.58,
        metalness: 0.02
      });
      break;
    case 'dark-skin':
      mat = new THREE.MeshStandardMaterial({
        color: 0x73482b,
        roughness: 0.6,
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
        roughness: 0.6,
        metalness: 0.08
      });
      break;
    case 'leather':
      mat = new THREE.MeshStandardMaterial({
        color: 0x824b22,
        roughness: 0.75,
        metalness: 0.05
      });
      break;
    case 'dark-leather':
      mat = new THREE.MeshStandardMaterial({
        color: 0x472712,
        roughness: 0.8,
        metalness: 0.05
      });
      break;
    case 'white-cloth':
      mat = new THREE.MeshStandardMaterial({
        color: 0xf5f7fa,
        roughness: 0.65
      });
      break;
    case 'eyes-black':
      mat = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.1
      });
      break;
    case 'eyes-white':
      mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.1
      });
      break;
    default:
      mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  }

  materialsCache.set(key, mat);
  return mat;
}

/**
 * Helper to build stylized cartoon eyes with pupil & specular shine
 */
function createCartoonEyePair(isBlue, width = 0.22, height = 0.18, separation = 0.18, zOffset = 0.2) {
  const eyeGroup = new THREE.Group();
  eyeGroup.position.set(0, 0, zOffset);

  const whiteMat = getTeamMaterial('eyes-white', isBlue);
  const pupilMat = getTeamMaterial('eyes-black', isBlue);
  const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  [-separation / 2, separation / 2].forEach(x => {
    // Sclera
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(width / 2, 10, 8), whiteMat);
    eyeWhite.scale.set(1, height / width, 0.4);
    eyeWhite.position.set(x, 0, 0);

    // Pupil
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(width / 3.5, 8, 6), pupilMat);
    pupil.scale.set(1, 1, 0.3);
    pupil.position.set(0, 0, 0.06);
    eyeWhite.add(pupil);

    // Specular Catchlight
    const shine = new THREE.Mesh(new THREE.SphereGeometry(width / 9, 6, 6), shineMat);
    shine.position.set(0.02, 0.02, 0.09);
    pupil.add(shine);

    eyeGroup.add(eyeWhite);
  });

  return eyeGroup;
}

export class ModelFactory {
  // -------------------------------------------------------------
  // TOWERS CREATION (Detailed Royal Bastions)
  // -------------------------------------------------------------

  static createPrincessTower(isBlue) {
    const group = new THREE.Group();
    group.name = 'PrincessTower';

    const stoneMat = getTeamMaterial('stone', isBlue);
    const darkStoneMat = getTeamMaterial('dark-stone', isBlue);
    const teamMat = getTeamMaterial('team', isBlue);
    const teamDark = getTeamMaterial('team-dark', isBlue);
    const goldMat = getTeamMaterial('gold', isBlue);
    const woodMat = getTeamMaterial('wood', isBlue);
    const metalMat = getTeamMaterial('metal', isBlue);

    // Stone Foundation with step bevels
    const stepBase = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 0.5, 14), darkStoneMat);
    stepBase.position.y = 0.25;
    stepBase.castShadow = true;
    stepBase.receiveShadow = true;
    group.add(stepBase);

    // Tower Shaft
    const baseGeo = new THREE.CylinderGeometry(1.35, 1.6, 3.2, 14);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 1.9;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Stone Bricks Relief Ring
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const brick = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.1), darkStoneMat);
      brick.position.set(Math.cos(angle) * 1.48, 1.2, Math.sin(angle) * 1.48);
      brick.rotation.y = -angle;
      group.add(brick);
    }

    // Heraldic Royal Banner Wall
    const bandGeo = new THREE.CylinderGeometry(1.42, 1.42, 0.8, 14);
    const band = new THREE.Mesh(bandGeo, teamMat);
    band.position.y = 2.6;
    group.add(band);

    // Golden Royal Trim Rings
    const goldRingTop = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.07, 8, 20), goldMat);
    goldRingTop.rotation.x = Math.PI / 2;
    goldRingTop.position.y = 3.0;
    group.add(goldRingTop);

    const goldRingBot = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.07, 8, 20), goldMat);
    goldRingBot.rotation.x = Math.PI / 2;
    goldRingBot.position.y = 2.2;
    group.add(goldRingBot);

    // Wall Hanging Crest Banner
    const banner = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.08), teamDark);
    banner.position.set(0, 2.2, 1.45);
    const crestIcon = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.1), goldMat);
    crestIcon.position.z = 0.02;
    banner.add(crestIcon);
    group.add(banner);

    // Flared Upper Platform
    const platformGeo = new THREE.CylinderGeometry(1.8, 1.45, 0.8, 14);
    const platform = new THREE.Mesh(platformGeo, stoneMat);
    platform.position.y = 3.6;
    platform.castShadow = true;
    group.add(platform);

    const woodenFloor = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.1, 14), woodMat);
    woodenFloor.position.y = 4.0;
    group.add(woodenFloor);

    // Crenellations / Battlements with gold capping
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const bGroup = new THREE.Group();
      bGroup.position.set(Math.cos(angle) * 1.65, 4.25, Math.sin(angle) * 1.65);
      bGroup.rotation.y = -angle;

      const battlement = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.7, 0.22), stoneMat);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.26), goldMat);
      cap.position.y = 0.38;
      bGroup.add(battlement);
      bGroup.add(cap);
      group.add(bGroup);
    }

    // ---------------- PRINCESS SHOOTER ON TOP ----------------
    const princessGroup = new THREE.Group();
    princessGroup.position.set(0, 4.05, 0);

    // Princess Royal Dress
    const dress = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.75, 12), teamMat);
    dress.position.y = 0.38;
    princessGroup.add(dress);

    const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.4, 10), teamDark);
    bodice.position.y = 0.75;
    princessGroup.add(bodice);

    // Head & Hair
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), getTeamMaterial('skin', isBlue));
    head.position.y = 1.1;
    princessGroup.add(head);

    // Cartoon Face
    head.add(createCartoonEyePair(isBlue, 0.08, 0.08, 0.1, 0.2));

    // Curly Brown Hair & Ponytail
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x5a3015, roughness: 0.65 });
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), hairMat);
    hairCap.position.set(0, 1.14, -0.04);
    princessGroup.add(hairCap);

    const ponytail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 6), hairMat);
    ponytail.position.set(0, 1.1, -0.25);
    ponytail.rotation.x = -0.5;
    princessGroup.add(ponytail);

    // Golden Royal Tiara
    const tiara = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 6, 12, Math.PI), goldMat);
    tiara.rotation.x = -Math.PI / 4;
    tiara.position.set(0, 1.25, 0.08);
    princessGroup.add(tiara);

    const rubyGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.04), new THREE.MeshStandardMaterial({
      color: 0xff0044,
      emissive: 0xaa0022,
      roughness: 0.1
    }));
    rubyGem.position.set(0, 1.3, 0.18);
    princessGroup.add(rubyGem);

    // Princess Longbow & Notched Arrow
    const bowGroup = new THREE.Group();
    bowGroup.position.set(0.25, 0.8, 0.3);
    bowGroup.rotation.x = Math.PI / 4;

    const bowCurve = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.035, 8, 16, Math.PI), woodMat);
    const bowGoldTips = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), goldMat);
    bowGoldTips.position.set(0, 0.35, 0);
    bowCurve.add(bowGoldTips);
    bowGroup.add(bowCurve);

    const bowString = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.7), metalMat);
    bowString.position.x = -0.02;
    bowGroup.add(bowString);

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
    const teamDark = getTeamMaterial('team-dark', isBlue);
    const goldMat = getTeamMaterial('gold', isBlue);
    const darkMetal = getTeamMaterial('dark-metal', isBlue);
    const woodMat = getTeamMaterial('wood', isBlue);

    // Heavy Fortified Base
    const subBase = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 3.0, 0.6, 16), darkStoneMat);
    subBase.position.y = 0.3;
    subBase.castShadow = true;
    subBase.receiveShadow = true;
    group.add(subBase);

    const baseGeo = new THREE.CylinderGeometry(2.2, 2.6, 3.8, 16);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 2.2;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Reinforced Steel Belt
    const band = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 1.0, 16), teamMat);
    band.position.y = 2.8;
    group.add(band);

    const goldTrim1 = new THREE.Mesh(new THREE.TorusGeometry(2.38, 0.08, 8, 24), goldMat);
    goldTrim1.rotation.x = Math.PI / 2;
    goldTrim1.position.y = 3.3;
    group.add(goldTrim1);

    const goldTrim2 = new THREE.Mesh(new THREE.TorusGeometry(2.38, 0.08, 8, 24), goldMat);
    goldTrim2.rotation.x = Math.PI / 2;
    goldTrim2.position.y = 2.3;
    group.add(goldTrim2);

    // Front Castle Gate Portcullis
    const gateFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.4), darkStoneMat);
    gateFrame.position.set(0, 1.2, 2.3);
    const gateDoor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 0.1), woodMat);
    gateDoor.position.set(0, 1.05, 2.45);
    group.add(gateFrame);
    group.add(gateDoor);

    // King's High Platform
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.3, 1.0, 16), stoneMat);
    platform.position.y = 4.3;
    platform.castShadow = true;
    group.add(platform);

    // Golden Imperial Crown Castle Parapet
    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.5, 12), goldMat);
    crownBase.position.y = 4.9;
    group.add(crownBase);

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.8, 5), goldMat);
      spike.position.set(Math.cos(angle) * 1.9, 5.4, Math.sin(angle) * 1.9);
      group.add(spike);

      const ruby = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x0088aa,
        roughness: 0.1
      }));
      ruby.position.set(Math.cos(angle) * 2.05, 5.0, Math.sin(angle) * 2.05);
      group.add(ruby);
    }

    // ---------------- THE KING ON TOP ----------------
    const kingGroup = new THREE.Group();
    kingGroup.position.set(0, 5.1, 0);

    // Royal Ermine Cape & Torso
    const kingRobe = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 1.1, 10), teamDark);
    kingRobe.position.y = 0.55;
    kingGroup.add(kingRobe);

    const ermineCollar = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.12, 8, 12), getTeamMaterial('white-cloth', isBlue));
    ermineCollar.rotation.x = Math.PI / 2;
    ermineCollar.position.y = 1.05;
    kingGroup.add(ermineCollar);

    // King Head & Face
    const kingHead = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), getTeamMaterial('skin', isBlue));
    kingHead.position.y = 1.45;
    kingGroup.add(kingHead);

    kingHead.add(createCartoonEyePair(isBlue, 0.12, 0.12, 0.18, 0.35));

    // King's Glorious Beard & Mustache
    const beardMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7 });
    const mustache = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.08, 6, 10, Math.PI), beardMat);
    mustache.position.set(0, 1.35, 0.38);
    kingGroup.add(mustache);

    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.6, 8), beardMat);
    beard.position.set(0, 1.05, 0.32);
    beard.rotation.x = 0.4;
    kingGroup.add(beard);

    // King's Royal Crown
    const headCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.35, 8), goldMat);
    headCrown.position.y = 1.85;
    kingGroup.add(headCrown);

    for (let c = 0; c < 4; c++) {
      const cAngle = (c * Math.PI * 2) / 4;
      const cTip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 4), goldMat);
      cTip.position.set(Math.cos(cAngle) * 0.3, 2.05, Math.sin(cAngle) * 0.3);
      kingGroup.add(cTip);
    }

    // Heavy Dragon-Mouthed King Cannon
    const cannonGroup = new THREE.Group();
    cannonGroup.position.set(0, 0.6, 0.65);
    cannonGroup.rotation.x = Math.PI / 3.2;

    const cannonBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 1.8, 12), darkMetal);
    const cannonMuzzle = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.08, 8, 16), goldMat);
    cannonMuzzle.rotation.x = Math.PI / 2;
    cannonMuzzle.position.y = 0.9;
    cannonBarrel.add(cannonMuzzle);

    cannonGroup.add(cannonBarrel);
    kingGroup.add(cannonGroup);

    group.add(kingGroup);
    group.userData.shooter = kingGroup;

    return group;
  }

  // -------------------------------------------------------------
  // REFINED 3D TROOP MESHES
  // -------------------------------------------------------------

  static createTroopMesh(cardId, isBlue) {
    const root = new THREE.Group();
    root.name = `Troop_${cardId}`;

    const teamMat = getTeamMaterial('team', isBlue);
    const teamDark = getTeamMaterial('team-dark', isBlue);
    const teamLight = getTeamMaterial('team-light', isBlue);
    const metalMat = getTeamMaterial('metal', isBlue);
    const darkMetal = getTeamMaterial('dark-metal', isBlue);
    const blackIron = getTeamMaterial('black-iron', isBlue);
    const skinMat = getTeamMaterial('skin', isBlue);
    const darkSkin = getTeamMaterial('dark-skin', isBlue);
    const woodMat = getTeamMaterial('wood', isBlue);
    const darkWood = getTeamMaterial('dark-wood', isBlue);
    const goldMat = getTeamMaterial('gold', isBlue);
    const brightGold = getTeamMaterial('bright-gold', isBlue);
    const leatherMat = getTeamMaterial('leather', isBlue);
    const darkLeather = getTeamMaterial('dark-leather', isBlue);
    const boneMat = getTeamMaterial('bone', isBlue);

    const parts = {
      root,
      leftArm: null,
      rightArm: null,
      leftLeg: null,
      rightLeg: null,
      weapon: null,
      wings: null,
      head: null,
      body: null,
      mount: null
    };

    switch (cardId) {
      case 'goblinhut': {
        // Goblin Hut Spawner Building - High Detail Tribal Cabin
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.25, 1.3, 10), woodMat);
        base.position.y = 0.65;
        root.add(base);

        // Wall Log Binding Ropes & Studs
        const ropeRing = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.06, 6, 12), darkLeather);
        ropeRing.rotation.x = Math.PI / 2;
        ropeRing.position.y = 0.7;
        root.add(ropeRing);

        // Entrance Door with Campfire Glow Inside
        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.3), darkWood);
        doorFrame.position.set(0, 0.45, 1.05);
        root.add(doorFrame);

        const interiorGlow = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, 0.1), new THREE.MeshStandardMaterial({
          color: 0xff6600,
          emissive: 0xff4400,
          emissiveIntensity: 1.8
        }));
        interiorGlow.position.set(0, 0.45, 1.15);
        root.add(interiorGlow);

        // Multi-Layered Straw Thatch Roof
        const roof1 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.9, 10), getTeamMaterial('thatch', isBlue));
        roof1.position.y = 1.6;
        root.add(roof1);

        const roof2 = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.8, 10), getTeamMaterial('thatch', isBlue));
        roof2.position.y = 2.1;
        root.add(roof2);

        // Tribal Totem Spear & Skull on Top
        const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.6), woodMat);
        spear.position.set(0, 2.7, 0);
        root.add(spear);

        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), boneMat);
        skull.position.set(0, 3.2, 0);
        root.add(skull);

        const spearBlade = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.35, 4), metalMat);
        spearBlade.position.set(0, 3.5, 0);
        root.add(spearBlade);

        // Tribal Team Banner
        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.7), teamMat);
        flag.position.set(0.35, 2.9, 0);
        root.add(flag);
        break;
      }

      case 'knight': {
        // 騎士 (Knight) - Paladin with Polished Plate Armor, Visored Greathelm, Cape & Lion Shield
        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 0.78;

        // Steel Torso with Gold Heraldic Trim
        const chestArmor = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.8, 12), metalMat);
        bodyGroup.add(chestArmor);

        const tabard = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.7, 12, 1, true, -Math.PI / 4, Math.PI / 2), teamMat);
        bodyGroup.add(tabard);

        const goldBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.12, 12), leatherMat);
        goldBelt.position.y = -0.3;
        const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.1), goldMat);
        beltBuckle.position.set(0, -0.3, 0.38);
        bodyGroup.add(goldBelt);
        bodyGroup.add(beltBuckle);

        // Royal Blue/Red Flowing Cape on Back
        const cape = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.06), teamDark);
        cape.position.set(0, -0.05, -0.4);
        cape.rotation.x = -0.15;
        bodyGroup.add(cape);

        root.add(bodyGroup);
        parts.body = bodyGroup;

        // Heavy Layered Pauldrons (Shoulder Plates)
        [-0.48, 0.48].forEach(x => {
          const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), metalMat);
          pauldron.scale.set(1.1, 0.9, 1.1);
          pauldron.position.set(x, 1.15, 0);
          const pRim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 12), goldMat);
          pRim.position.set(x, 1.1, 0);
          pRim.rotation.x = Math.PI / 2;
          root.add(pauldron);
          root.add(pRim);
        });

        // Knight Greathelm (Helmet) with Visor Slit
        const headGroup = new THREE.Group();
        headGroup.position.y = 1.38;

        const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.52, 12), metalMat);
        headGroup.add(helmet);

        const visorSlit = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.12), darkMetal);
        visorSlit.position.set(0, 0.05, 0.26);
        headGroup.add(visorSlit);

        const visorCross = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.13), goldMat);
        visorCross.position.set(0, 0.05, 0.26);
        headGroup.add(visorCross);

        // Knight Plume Feather
        const plume = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.5, 8), teamMat);
        plume.position.set(0, 0.45, -0.12);
        plume.rotation.x = -0.4;
        headGroup.add(plume);

        root.add(headGroup);
        parts.head = headGroup;

        // Right Arm & Royal Broadsword
        const armR = new THREE.Group();
        armR.position.set(0.52, 0.95, 0);
        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.48, 8), metalMat);
        armMeshR.position.y = -0.22;
        armR.add(armMeshR);

        const swordGroup = new THREE.Group();
        swordGroup.position.set(0, -0.42, 0.35);
        swordGroup.rotation.x = Math.PI / 3.2;

        // Blade with fuller & taper
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.1, 0.2), metalMat);
        const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.8, 0.06), darkMetal);
        fuller.position.z = 0.07;
        blade.add(fuller);

        const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.12), goldMat);
        crossguard.position.y = -0.45;
        const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3), darkLeather);
        grip.position.y = -0.6;
        const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), goldMat);
        pommel.position.y = -0.78;

        swordGroup.add(blade);
        swordGroup.add(crossguard);
        swordGroup.add(grip);
        swordGroup.add(pommel);
        armR.add(swordGroup);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = swordGroup;

        // Left Arm & Heavy Heater Shield
        const armL = new THREE.Group();
        armL.position.set(-0.52, 0.95, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.48, 8), metalMat);
        armMeshL.position.y = -0.22;
        armL.add(armMeshL);

        const shieldGroup = new THREE.Group();
        shieldGroup.position.set(0, -0.2, 0.25);
        shieldGroup.rotation.y = -Math.PI / 8;

        const shieldBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.1), teamMat);
        const shieldRim = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.06), metalMat);
        shieldRim.position.z = -0.02;
        const shieldLion = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), goldMat);
        shieldLion.position.z = 0.08;

        shieldGroup.add(shieldBody);
        shieldGroup.add(shieldRim);
        shieldGroup.add(shieldLion);
        armL.add(shieldGroup);

        root.add(armL);
        parts.leftArm = armL;

        // Plated Greaves & Sabatons (Legs & Boots)
        const legGeo = new THREE.CylinderGeometry(0.14, 0.11, 0.52, 8);
        const legL = new THREE.Mesh(legGeo, metalMat);
        legL.position.set(-0.22, 0.26, 0);
        const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.28), darkMetal);
        bootL.position.set(0, -0.24, 0.05);
        legL.add(bootL);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(legGeo, metalMat);
        legR.position.set(0.22, 0.26, 0);
        const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.28), darkMetal);
        bootR.position.set(0, -0.24, 0.05);
        legR.add(bootR);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'pekka': {
        // 皮卡超人 (P.E.K.K.A) - Heavy Cyber-Samurai Mech Titan
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.55, 1.3, 10), darkMetal);
        body.position.y = 1.25;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        // Heavy Armor Trim & Ribs
        const shoulderPlates = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.7), blackIron);
        shoulderPlates.position.set(0, 1.8, 0);
        root.add(shoulderPlates);

        // Pulsating Plasma Energy Core
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), new THREE.MeshStandardMaterial({
          color: 0xb800ff,
          emissive: 0xcc00ff,
          emissiveIntensity: 2.8,
          roughness: 0.1
        }));
        core.position.set(0, 1.25, 0.42);
        root.add(core);

        const coreRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 6, 16), brightGold);
        coreRing.position.set(0, 1.25, 0.44);
        root.add(coreRing);

        // Angular Samurai Mask Head
        const headGroup = new THREE.Group();
        headGroup.position.y = 2.05;

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.55, 0.55), darkMetal);
        headGroup.add(head);

        // Glowing Purple Horizontal Visor Slit
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.1), new THREE.MeshStandardMaterial({
          color: 0xdd00ff,
          emissive: 0xff00cc,
          emissiveIntensity: 3.0
        }));
        visor.position.set(0, 0.02, 0.28);
        headGroup.add(visor);

        // Iconic Curved P.E.K.K.A Horns
        const hornMat = new THREE.MeshStandardMaterial({
          color: 0xd900ff,
          emissive: 0xaa00ff,
          emissiveIntensity: 2.4,
          roughness: 0.2
        });

        [-0.42, 0.42].forEach(x => {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.8, 8), hornMat);
          horn.position.set(x, 0.4, 0);
          horn.rotation.z = x > 0 ? -0.55 : 0.55;
          horn.rotation.x = -0.2;
          headGroup.add(horn);
        });

        root.add(headGroup);
        parts.head = headGroup;

        // Right Arm with Heavy Laser Katana
        const armR = new THREE.Group();
        armR.position.set(0.85, 1.35, 0);
        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.65, 8), darkMetal);
        armMeshR.position.y = -0.3;
        armR.add(armMeshR);

        const katanaGroup = new THREE.Group();
        katanaGroup.position.set(0, -0.65, 0.55);
        katanaGroup.rotation.x = Math.PI / 3;

        const katanaBlade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.9, 0.32), new THREE.MeshStandardMaterial({
          color: 0xee00ff,
          emissive: 0xcc00ff,
          emissiveIntensity: 2.5,
          roughness: 0.1
        }));
        const katanaGuard = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 8), brightGold);
        katanaGuard.position.y = -0.9;
        const katanaGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5), blackIron);
        katanaGrip.position.y = -1.15;

        katanaGroup.add(katanaBlade);
        katanaGroup.add(katanaGuard);
        katanaGroup.add(katanaGrip);
        armR.add(katanaGroup);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = katanaGroup;

        // Left Arm
        const armL = new THREE.Group();
        armL.position.set(-0.85, 1.35, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.65, 8), darkMetal);
        armMeshL.position.y = -0.3;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

        // Heavy Legs
        const legGeoP = new THREE.CylinderGeometry(0.24, 0.2, 0.68, 8);
        const legL = new THREE.Mesh(legGeoP, darkMetal);
        legL.position.set(-0.35, 0.34, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(legGeoP, darkMetal);
        legR.position.set(0.35, 0.34, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'hogrider': {
        // 野豬騎士 (Hog Rider) - Muscular Warrior with Mohawk, Golden Hammer & Fierce Tusker Boar
        const mount = new THREE.Group();
        mount.position.set(0, 0.48, 0);

        // Boar Body & Fur
        const boarFurMat = new THREE.MeshStandardMaterial({ color: 0x7c4820, roughness: 0.8 });
        const hogBody = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), boarFurMat);
        hogBody.scale.set(0.95, 0.85, 1.4);
        mount.add(hogBody);

        // Boar Head & Snout
        const hogHead = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.6, 10), boarFurMat);
        hogHead.rotation.x = Math.PI / 2;
        hogHead.position.set(0, 0.12, 0.72);
        mount.add(hogHead);

        const snoutDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0xda8272 }));
        snoutDisc.rotation.x = Math.PI / 2;
        snoutDisc.position.set(0, 0.12, 1.02);
        mount.add(snoutDisc);

        // Curved Ivory Tusks with Gold Bands
        [-0.22, 0.22].forEach(x => {
          const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 6), boneMat);
          tusk.position.set(x, 0.08, 0.92);
          tusk.rotation.x = -0.6;
          tusk.rotation.z = x > 0 ? -0.2 : 0.2;
          const tuskRing = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 8), goldMat);
          tuskRing.position.set(x, 0.02, 0.88);
          mount.add(tusk);
          mount.add(tuskRing);
        });

        // Leather Saddle with Stirrups
        const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.6), darkLeather);
        saddle.position.set(0, 0.42, -0.05);
        mount.add(saddle);

        root.add(mount);
        parts.mount = mount;

        // Rider Muscular Torso & Belt
        const riderBody = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.6, 10), darkSkin);
        riderBody.position.set(0, 0.92, -0.1);
        root.add(riderBody);

        // Rider Head with Expressive Face & Mohawk
        const riderHeadGroup = new THREE.Group();
        riderHeadGroup.position.set(0, 1.32, -0.1);

        const riderHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), darkSkin);
        riderHeadGroup.add(riderHead);

        riderHead.add(createCartoonEyePair(isBlue, 0.08, 0.08, 0.12, 0.22));

        // Mohawk Hair & Beard
        const hairMatH = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        const mohawk = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.32, 0.42), hairMatH);
        mohawk.position.set(0, 0.22, -0.02);
        riderHeadGroup.add(mohawk);

        const beardH = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.22), hairMatH);
        beardH.position.set(0, -0.15, 0.15);
        riderHeadGroup.add(beardH);

        // Gold Hoop Earring
        const earring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 6, 8), goldMat);
        earring.position.set(0.24, -0.02, 0);
        earring.rotation.y = Math.PI / 2;
        riderHeadGroup.add(earring);

        root.add(riderHeadGroup);
        parts.head = riderHeadGroup;

        // Right Arm & Colossal Stone War Hammer
        const armR = new THREE.Group();
        armR.position.set(0.42, 1.02, -0.1);

        const hammerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.1), darkWood);
        hammerPole.rotation.x = Math.PI / 3;

        const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.5), getTeamMaterial('stone', isBlue));
        hammerHead.position.y = 0.42;
        const hammerGoldBand = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.52), goldMat);
        hammerGoldBand.position.y = 0.42;
        hammerPole.add(hammerHead);
        hammerPole.add(hammerGoldBand);

        armR.add(hammerPole);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = hammerPole;
        break;
      }

      case 'musketeer': {
        // 火槍手 (Musketeer) - Royal Sniper with Cavalier Plumed Hat & Heavy Flintlock Musket
        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 0.68;

        const tunic = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.7, 10), teamMat);
        bodyGroup.add(tunic);

        const laceCollar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 12), getTeamMaterial('white-cloth', isBlue));
        laceCollar.rotation.x = Math.PI / 2;
        laceCollar.position.y = 0.32;
        bodyGroup.add(laceCollar);

        root.add(bodyGroup);
        parts.body = bodyGroup;

        // Head & Cavalier Hat
        const headGroup = new THREE.Group();
        headGroup.position.y = 1.18;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10), skinMat);
        headGroup.add(head);

        head.add(createCartoonEyePair(isBlue, 0.08, 0.08, 0.1, 0.22));

        // Purple Curly Hair
        const hairMatM = new THREE.MeshStandardMaterial({ color: 0x8e24aa, roughness: 0.5 });
        const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), hairMatM);
        hairM.position.set(0, 0.05, -0.05);
        headGroup.add(hairM);

        // Cavalier Hat with Swooping Brim & Lush Magenta Feather
        const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.06, 12), teamDark);
        hatBrim.position.y = 0.18;
        hatBrim.rotation.z = -0.15;
        headGroup.add(hatBrim);

        const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 10), teamDark);
        hatCrown.position.set(-0.02, 0.28, 0);
        headGroup.add(hatCrown);

        const feather = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 6), new THREE.MeshStandardMaterial({
          color: 0xff00aa,
          roughness: 0.3
        }));
        feather.position.set(0.24, 0.42, -0.15);
        feather.rotation.z = -0.6;
        feather.rotation.y = 0.3;
        headGroup.add(feather);

        root.add(headGroup);
        parts.head = headGroup;

        // Right Arm & Heavy Blunderbuss Musket
        const armR = new THREE.Group();
        armR.position.set(0.36, 0.8, 0);

        const musketGroup = new THREE.Group();
        musketGroup.position.set(0, 0, 0.42);
        musketGroup.rotation.x = Math.PI / 2.2;

        const musketStock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.65, 0.12), woodMat);
        const musketBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), brightGold);
        musketBarrel.position.y = 0.55;
        const musketFlaredMuzzle = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 8), brightGold);
        musketFlaredMuzzle.position.y = 1.15;

        musketGroup.add(musketStock);
        musketGroup.add(musketBarrel);
        musketGroup.add(musketFlaredMuzzle);
        armR.add(musketGroup);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = musketGroup;

        // Boots & Legs
        const legGeoM = new THREE.CylinderGeometry(0.1, 0.09, 0.44, 8);
        const legL = new THREE.Mesh(legGeoM, leatherMat);
        legL.position.set(-0.15, 0.22, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(legGeoM, leatherMat);
        legR.position.set(0.15, 0.22, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'giant': {
        // 巨人 (Giant) - Colossal Siege Titan with Mammoth Fur Collar, Bushy Beard & Stitched Tunic
        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 1.45;

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.68, 1.55, 12), leatherMat);
        bodyGroup.add(body);

        // Stitched Leather Belt & Rope
        const ropeBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.18, 12), darkLeather);
        ropeBelt.position.y = -0.55;
        const beltPouch = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.2), darkWood);
        beltPouch.position.set(0.4, -0.55, 0.65);
        bodyGroup.add(ropeBelt);
        bodyGroup.add(beltPouch);

        // Heavy Fur Pelt Collar around Neck
        const furCollar = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.22, 8, 14), new THREE.MeshStandardMaterial({
          color: 0x5a381e,
          roughness: 0.95
        }));
        furCollar.rotation.x = Math.PI / 2;
        furCollar.position.y = 0.75;
        bodyGroup.add(furCollar);

        root.add(bodyGroup);
        parts.body = bodyGroup;

        // Head with Bushy Ginger Beard
        const headGroup = new THREE.Group();
        headGroup.position.y = 2.4;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 12), skinMat);
        headGroup.add(head);

        head.add(createCartoonEyePair(isBlue, 0.14, 0.14, 0.24, 0.45));

        // Bushy Ginger Beard & Brow
        const gingerMat = new THREE.MeshStandardMaterial({ color: 0xd85b12, roughness: 0.85 });
        const beardG = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.7, 8), gingerMat);
        beardG.position.set(0, -0.32, 0.35);
        beardG.rotation.x = 0.4;
        headGroup.add(beardG);

        const browG = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.2), gingerMat);
        browG.position.set(0, 0.18, 0.44);
        headGroup.add(browG);

        root.add(headGroup);
        parts.head = headGroup;

        // Massive Wrapped Arms
        const armGeoG = new THREE.CylinderGeometry(0.26, 0.22, 0.95, 8);
        const armL = new THREE.Group();
        armL.position.set(-1.0, 1.65, 0);
        const armMeshL = new THREE.Mesh(armGeoG, skinMat);
        armMeshL.position.y = -0.45;
        const bracerL = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.23, 0.4, 8), darkLeather);
        bracerL.position.y = -0.55;
        armMeshL.add(bracerL);
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(1.0, 1.65, 0);
        const armMeshR = new THREE.Mesh(armGeoG, skinMat);
        armMeshR.position.y = -0.45;
        const bracerR = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.23, 0.4, 8), darkLeather);
        bracerR.position.y = -0.55;
        armMeshR.add(bracerR);
        armR.add(armMeshR);
        root.add(armR);
        parts.rightArm = armR;

        // Heavy Legs & Feet
        const legGeoG = new THREE.CylinderGeometry(0.28, 0.24, 0.85, 8);
        const legL = new THREE.Mesh(legGeoG, darkLeather);
        legL.position.set(-0.38, 0.42, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(legGeoG, darkLeather);
        legR.position.set(0.38, 0.42, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'archers': {
        // 弓箭手 (Archers) - Agile Marksman with Pink Ponytail, Robin Hood Cap & Recurve Bow
        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 0.58;

        const tunic = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.6, 10), teamMat);
        bodyGroup.add(tunic);

        const leatherVest = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.35, 10, 1, true, -Math.PI / 3, (Math.PI * 2) / 3), darkLeather);
        bodyGroup.add(leatherVest);

        // Back Quiver with Arrows
        const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.6, 8), leatherMat);
        quiver.position.set(-0.15, 0.1, -0.22);
        quiver.rotation.z = -0.3;
        bodyGroup.add(quiver);

        for (let a = 0; a < 3; a++) {
          const arrowShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4), woodMat);
          arrowShaft.position.set(-0.15 + (a * 0.04), 0.4, -0.22);
          const fletch = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.02), teamLight);
          arrowShaft.add(fletch);
          bodyGroup.add(arrowShaft);
        }

        root.add(bodyGroup);
        parts.body = bodyGroup;

        // Head & Pink Ponytail
        const headGroup = new THREE.Group();
        headGroup.position.y = 1.05;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), skinMat);
        headGroup.add(head);

        head.add(createCartoonEyePair(isBlue, 0.08, 0.08, 0.11, 0.21));

        // Vibrant Pink Hair
        const pinkHairMat = new THREE.MeshStandardMaterial({ color: 0xff3388, roughness: 0.4 });
        const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), pinkHairMat);
        hairCap.position.set(0, 0.04, -0.04);
        headGroup.add(hairCap);

        const archerPonytail = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.4, 6), pinkHairMat);
        archerPonytail.position.set(0, 0.05, -0.25);
        archerPonytail.rotation.x = -0.5;
        headGroup.add(archerPonytail);

        // Archer Green Cap with Quill
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.32, 8), new THREE.MeshStandardMaterial({ color: 0x16a085 }));
        cap.position.set(0, 0.22, -0.05);
        cap.rotation.x = -0.35;
        headGroup.add(cap);

        root.add(headGroup);
        parts.head = headGroup;

        // Right Arm & Recurve Bow
        const armR = new THREE.Group();
        armR.position.set(0.32, 0.72, 0);

        const bowGroup = new THREE.Group();
        bowGroup.position.set(0, -0.1, 0.22);
        bowGroup.rotation.x = Math.PI / 2;

        const bowWood = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.032, 8, 14, Math.PI), woodMat);
        const bowString = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.56), metalMat);
        bowString.position.x = -0.02;
        bowGroup.add(bowWood);
        bowGroup.add(bowString);
        armR.add(bowGroup);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = bowGroup;

        // Legs
        const legGeoA = new THREE.CylinderGeometry(0.09, 0.08, 0.38, 8);
        const legL = new THREE.Mesh(legGeoA, teamMat);
        legL.position.set(-0.13, 0.19, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(legGeoA, teamMat);
        legR.position.set(0.13, 0.19, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'wizard': {
        // 魔法師 (Wizard) - Grand Pyromancer with Mystic Cowl, Arcane Staff & Orbiting Energy Orb
        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 0.6;

        const robe = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.95, 10), teamDark);
        bodyGroup.add(robe);

        const goldMantle = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.35, 10), goldMat);
        goldMantle.position.y = 0.28;
        bodyGroup.add(goldMantle);

        // Alchemy Potion Vials on Belt
        const redPotion = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({
          color: 0xff0033,
          emissive: 0xaa0022,
          roughness: 0.1
        }));
        redPotion.position.set(0.28, -0.15, 0.25);
        bodyGroup.add(redPotion);

        root.add(bodyGroup);
        parts.body = bodyGroup;

        // Head with Mystic Hood & Glowing Eyes
        const headGroup = new THREE.Group();
        headGroup.position.y = 1.15;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), skinMat);
        headGroup.add(head);

        // Glowing Cyan Arcane Eyes
        const glowEyeMat = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x00ffff,
          emissiveIntensity: 2.5
        });
        [-0.08, 0.08].forEach(x => {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), glowEyeMat);
          eye.position.set(x, 0.02, 0.23);
          headGroup.add(eye);
        });

        // Pointed Goatee & Mustache
        const goatee = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        goatee.position.set(0, -0.15, 0.22);
        goatee.rotation.x = 0.3;
        headGroup.add(goatee);

        // Deep Arcane Cowl/Hood with Gold Edge
        const hood = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.48, 10), teamMat);
        hood.position.set(0, 0.22, -0.06);
        hood.rotation.x = -0.2;
        headGroup.add(hood);

        root.add(headGroup);
        parts.head = headGroup;

        // Right Arm & Glowing Arcane Staff
        const armR = new THREE.Group();
        armR.position.set(0.44, 0.8, 0);

        const staffGroup = new THREE.Group();
        staffGroup.position.set(0, 0.1, 0.22);

        const staffWood = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.25, 8), darkWood);
        const staffGoldHead = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 12), brightGold);
        staffGoldHead.position.y = 0.6;

        // Floating Pulsating Plasma Orb
        const plasmaOrb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x00ddff,
          emissiveIntensity: 3.0,
          roughness: 0.1
        }));
        plasmaOrb.position.y = 0.6;

        staffGroup.add(staffWood);
        staffGroup.add(staffGoldHead);
        staffGroup.add(plasmaOrb);
        armR.add(staffGroup);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = staffGroup;
        break;
      }

      case 'dragon': {
        // 飛龍寶寶 (Baby Dragon) - Adorable Flying Dragon with Scales, Spines, Wings & Fiery Throat
        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 1.8;

        const dragonGreen = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.45 });
        const dragonUnderbelly = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.5 });

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 12), dragonGreen);
        body.scale.set(1.0, 0.88, 1.25);
        bodyGroup.add(body);

        // Cream/Yellow Underbelly Scales
        const underbelly = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), dragonUnderbelly);
        underbelly.scale.set(0.9, 0.8, 1.2);
        underbelly.position.set(0, -0.06, 0.08);
        bodyGroup.add(underbelly);

        // Tail with Spade Tip
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 8), dragonGreen);
        tail.position.set(0, -0.05, -0.7);
        tail.rotation.x = -Math.PI / 2.5;
        bodyGroup.add(tail);

        root.add(bodyGroup);
        parts.body = bodyGroup;

        // Cute Chubby Dragon Head
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 2.15, 0.45);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 12), dragonGreen);
        headGroup.add(head);

        head.add(createCartoonEyePair(isBlue, 0.14, 0.14, 0.22, 0.32));

        // Snout with Nostrils & Fiery Glow inside Mouth
        const snout = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.38, 8), dragonGreen);
        snout.rotation.x = Math.PI / 2;
        snout.position.set(0, -0.08, 0.35);
        headGroup.add(snout);

        const mouthGlow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshStandardMaterial({
          color: 0xff5500,
          emissive: 0xff3300,
          emissiveIntensity: 2.2
        }));
        mouthGlow.position.set(0, -0.1, 0.32);
        headGroup.add(mouthGlow);

        // Cute Tiny White Dragon Horns
        [-0.18, 0.18].forEach(x => {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 6), boneMat);
          horn.position.set(x, 0.32, -0.08);
          horn.rotation.x = -0.4;
          horn.rotation.z = x > 0 ? -0.3 : 0.3;
          headGroup.add(horn);
        });

        root.add(headGroup);
        parts.head = headGroup;

        // Double-Jointed Bat Wings with Wing Struts
        const wingsGroup = new THREE.Group();
        wingsGroup.position.set(0, 1.95, 0);

        [-1, 1].forEach(dir => {
          const wing = new THREE.Group();
          wing.position.set(dir * 0.45, 0, 0);

          const boneStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8), dragonGreen);
          boneStrut.rotation.z = dir * 0.8;
          boneStrut.position.set(dir * 0.35, 0.1, 0);

          const membrane = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.03, 0.45), teamMat);
          membrane.position.set(dir * 0.35, 0, 0);
          membrane.rotation.z = dir * -0.2;

          wing.add(boneStrut);
          wing.add(membrane);
          wingsGroup.add(wing);
        });

        root.add(wingsGroup);
        parts.wings = wingsGroup;
        break;
      }

      case 'goblins': {
        // 哥布林 (Goblins) - Mischievous Green Trickster with Long Ears, Fangs & Poison Dagger
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.45, 8), teamMat);
        body.position.y = 0.42;
        root.add(body);
        parts.body = body;

        // Head with Expressive Face, Big Ears & Hooked Nose
        const headGroup = new THREE.Group();
        headGroup.position.y = 0.74;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), getTeamMaterial('goblin-skin', isBlue));
        headGroup.add(head);

        head.add(createCartoonEyePair(isBlue, 0.09, 0.09, 0.13, 0.22));

        // Long Pointed Bat Ears with Gold Hoop Earring
        [-0.26, 0.26].forEach(x => {
          const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 6), getTeamMaterial('goblin-skin', isBlue));
          ear.position.set(x, 0.05, 0);
          ear.rotation.z = x > 0 ? -Math.PI / 2.8 : Math.PI / 2.8;
          headGroup.add(ear);
        });

        const earringG = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.015, 6, 8), goldMat);
        earringG.position.set(0.34, 0.02, 0);
        headGroup.add(earringG);

        // Hooked Goblin Nose
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 6), getTeamMaterial('goblin-skin-dark', isBlue));
        nose.rotation.x = Math.PI / 2.5;
        nose.position.set(0, -0.04, 0.26);
        headGroup.add(nose);

        root.add(headGroup);
        parts.head = headGroup;

        // Right Arm & Serrated Poison Dagger
        const armR = new THREE.Group();
        armR.position.set(0.28, 0.48, 0);

        const dagger = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.12), new THREE.MeshStandardMaterial({
          color: 0x33ff66,
          emissive: 0x11aa33,
          metalness: 0.7,
          roughness: 0.2
        }));
        dagger.position.set(0, 0, 0.24);
        dagger.rotation.x = Math.PI / 3;
        armR.add(dagger);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = dagger;

        // Legs
        const legGeoGob = new THREE.CylinderGeometry(0.07, 0.06, 0.28, 6);
        const legL = new THREE.Mesh(legGeoGob, getTeamMaterial('goblin-skin', isBlue));
        legL.position.set(-0.11, 0.14, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(legGeoGob, getTeamMaterial('goblin-skin', isBlue));
        legR.position.set(0.11, 0.14, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'skeletons': {
        // 骷髏 (Skeletons) - Cartoon Undead with Spectral Eye Glow, Pot Helmet & Scimitar
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.35, 6), boneMat);
        body.position.y = 0.38;
        root.add(body);
        parts.body = body;

        // Skull Head with Glowing Spectral Eye Dots
        const skullGroup = new THREE.Group();
        skullGroup.position.y = 0.65;

        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), boneMat);
        skullGroup.add(skull);

        // Spectral Eye Glow
        const spectralEyeMat = new THREE.MeshStandardMaterial({
          color: isBlue ? 0x00ffff : 0xff2255,
          emissive: isBlue ? 0x00ddff : 0xff0033,
          emissiveIntensity: 2.5
        });
        [-0.07, 0.07].forEach(x => {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), spectralEyeMat);
          eye.position.set(x, 0.02, 0.18);
          skullGroup.add(eye);
        });

        // Tiny Dented Pot-Helmet
        const potHelmet = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 8), darkMetal);
        potHelmet.position.y = 0.16;
        skullGroup.add(potHelmet);

        root.add(skullGroup);
        parts.head = skullGroup;

        // Right Arm & Scimitar
        const armR = new THREE.Group();
        armR.position.set(0.22, 0.42, 0);

        const scimitar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.09), metalMat);
        scimitar.rotation.x = Math.PI / 3;
        scimitar.position.set(0, 0, 0.18);
        armR.add(scimitar);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = scimitar;

        // Legs
        const legGeoS = new THREE.CylinderGeometry(0.045, 0.045, 0.24, 6);
        const legL = new THREE.Mesh(legGeoS, boneMat);
        legL.position.set(-0.09, 0.12, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(legGeoS, boneMat);
        legR.position.set(0.09, 0.12, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'inferno': {
        // 地獄塔 (Inferno Tower) - Obsidian Spire with Gyro Rings & Supercharged Inferno Crystal
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.15, 2.0, 10), getTeamMaterial('stone', isBlue));
        base.position.y = 1.0;
        root.add(base);

        // Molten Core Veins
        const moltenVein = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.3, 10), new THREE.MeshStandardMaterial({
          color: 0xff3300,
          emissive: 0xff2200,
          emissiveIntensity: 2.0
        }));
        moltenVein.position.y = 1.3;
        root.add(moltenVein);

        // Dual Concentric Gyro Rings
        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.12, 8, 16), teamMat);
        ring1.rotation.x = Math.PI / 2;
        ring1.position.y = 1.8;
        root.add(ring1);

        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.08, 8, 14), brightGold);
        ring2.rotation.y = Math.PI / 4;
        ring2.position.y = 2.1;
        root.add(ring2);

        // Floating Faceted Supercharged Inferno Crystal
        const crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), new THREE.MeshStandardMaterial({
          color: 0xff5500,
          emissive: 0xff3300,
          emissiveIntensity: 3.2,
          roughness: 0.1
        }));
        crystal.position.y = 2.4;
        root.add(crystal);
        parts.head = crystal;
        break;
      }

      // --- 原創角色 3D 精緻模型 (Original Characters) ---

      case 'cyber_ninja': {
        // 賽博幻影忍者 (Cyber Ninja) - Carbon Fiber Exo-suit, Oni Cyber-Visor, Billowing Scarf & Dual Plasma Blades
        const cyberSuit = new THREE.MeshStandardMaterial({ color: 0x141a29, roughness: 0.18, metalness: 0.85 });
        const neonCyan = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2.8 });

        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 0.65;

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.65, 8), cyberSuit);
        bodyGroup.add(body);

        const chestNeon = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.08), neonCyan);
        chestNeon.position.set(0, 0.05, 0.2);
        bodyGroup.add(chestNeon);

        // Billowing Hard-Light Scarf
        const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.65), neonCyan);
        scarf.position.set(0, 0.38, -0.28);
        scarf.rotation.x = 0.35;
        bodyGroup.add(scarf);

        root.add(bodyGroup);
        parts.body = bodyGroup;

        // Cyber Oni Mask Head
        const headGroup = new THREE.Group();
        headGroup.position.y = 1.15;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), cyberSuit);
        headGroup.add(head);

        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.14), neonCyan);
        visor.position.set(0, 0.02, 0.18);
        headGroup.add(visor);

        root.add(headGroup);
        parts.head = headGroup;

        // Dual Plasma Katanas
        const armR = new THREE.Group();
        armR.position.set(0.38, 0.8, 0);
        const katanaR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.95, 0.14), neonCyan);
        katanaR.position.set(0, 0.1, 0.28);
        katanaR.rotation.x = Math.PI / 3;
        armR.add(katanaR);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = katanaR;

        const armL = new THREE.Group();
        armL.position.set(-0.38, 0.8, 0);
        const katanaL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.95, 0.14), neonCyan);
        katanaL.position.set(0, 0.1, 0.28);
        katanaL.rotation.x = Math.PI / 3;
        armL.add(katanaL);
        root.add(armL);
        parts.leftArm = armL;

        const legGeoN = new THREE.CylinderGeometry(0.09, 0.08, 0.42, 8);
        const legL = new THREE.Mesh(legGeoN, cyberSuit);
        legL.position.set(-0.14, 0.21, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(legGeoN, cyberSuit);
        legR.position.set(0.14, 0.21, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'thunder_valkyrie': {
        // 雷霆女武神 (Thunder Valkyrie) - Winged Nordic Helm, Braided Hair & Double-Bitted Storm Cleaver Axe
        const armorMat = new THREE.MeshStandardMaterial({ color: 0x1f293d, metalness: 0.75, roughness: 0.25 });
        const thunderMat = new THREE.MeshStandardMaterial({ color: 0xffea00, emissive: 0xffcc00, emissiveIntensity: 2.6 });

        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 0.75;

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.75, 10), teamMat);
        bodyGroup.add(body);

        const cuirass = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.4, 0.45), goldMat);
        cuirass.position.set(0, 0.1, 0);
        bodyGroup.add(cuirass);

        root.add(bodyGroup);
        parts.body = bodyGroup;

        // Head with Winged Golden Helm & Braids
        const headGroup = new THREE.Group();
        headGroup.position.y = 1.28;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), skinMat);
        headGroup.add(head);

        head.add(createCartoonEyePair(isBlue, 0.08, 0.08, 0.11, 0.24));

        const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 10), brightGold);
        helmet.position.y = 0.12;
        headGroup.add(helmet);

        // Golden Wings on Helmet
        [-0.35, 0.35].forEach(x => {
          const wing = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.26), brightGold);
          wing.position.set(x, 0.22, -0.06);
          wing.rotation.z = x > 0 ? -0.45 : 0.45;
          headGroup.add(wing);
        });

        root.add(headGroup);
        parts.head = headGroup;

        // Colossal Double-Headed Storm Cleaver Axe
        const armR = new THREE.Group();
        armR.position.set(0.46, 0.9, 0);

        const axeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.3), darkWood);
        axeHandle.rotation.x = Math.PI / 4;
        axeHandle.position.set(0, 0, 0.4);

        const axeBlade1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.55, 0.42), thunderMat);
        axeBlade1.position.set(0, 0.5, 0.18);
        axeHandle.add(axeBlade1);

        const axeBlade2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.55, 0.42), thunderMat);
        axeBlade2.position.set(0, 0.5, -0.18);
        axeHandle.add(axeBlade2);

        armR.add(axeHandle);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = axeHandle;

        const legGeoV = new THREE.CylinderGeometry(0.11, 0.1, 0.45, 8);
        const legL = new THREE.Mesh(legGeoV, armorMat);
        legL.position.set(-0.18, 0.23, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(legGeoV, armorMat);
        legR.position.set(0.18, 0.23, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'mecha_golem': {
        // 泰坦機甲魔像 (Mecha Golem) - Colossal War Tank with Exhaust Stacks & Crusher Fists
        const heavySteel = new THREE.MeshStandardMaterial({ color: 0x2b3342, metalness: 0.88, roughness: 0.18 });
        const coreMat = new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff3300, emissiveIntensity: 3.0 });

        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 1.35;

        const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.3, 1.0), heavySteel);
        bodyGroup.add(body);

        // Glowing Furnace Core behind Heavy Security Grate
        const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.18, 10), coreMat);
        chestCore.rotation.x = Math.PI / 2;
        chestCore.position.set(0, 0.1, 0.52);
        bodyGroup.add(chestCore);

        // Dual Exhaust Smokestacks on Back
        [-0.45, 0.45].forEach(x => {
          const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.85, 8), blackIron);
          pipe.position.set(x, 0.75, -0.42);
          pipe.rotation.x = -0.3;
          bodyGroup.add(pipe);
        });

        root.add(bodyGroup);
        parts.body = bodyGroup;

        // Head with Optical Sensor Visor
        const headGroup = new THREE.Group();
        headGroup.position.y = 2.15;

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.55), heavySteel);
        headGroup.add(head);

        const eyeVisor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.12), coreMat);
        eyeVisor.position.set(0, 0.02, 0.28);
        headGroup.add(eyeVisor);

        root.add(headGroup);
        parts.head = headGroup;

        // Giant Crusher Fists
        const armL = new THREE.Group();
        armL.position.set(-0.95, 1.45, 0);
        const fistL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.5), heavySteel);
        fistL.position.y = -0.4;
        armL.add(fistL);
        root.add(armL);
        parts.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(0.95, 1.45, 0);
        const fistR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.5), heavySteel);
        fistR.position.y = -0.4;
        armR.add(fistR);
        root.add(armR);
        parts.rightArm = armR;

        // Heavy Hydraulic Legs
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

      case 'phoenix_mage': {
        // 不死鳥炎術師 (Phoenix Mage) - Radiant Hovering Archmage with 3-Tier Flaming Wings & Solar Scepter
        const robeMat = new THREE.MeshStandardMaterial({ color: 0x8a1505, roughness: 0.35 });
        const flameMat = new THREE.MeshStandardMaterial({ color: 0xff7700, emissive: 0xff3300, emissiveIntensity: 2.8 });

        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 1.75; // Hovering high in air

        const body = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.95, 10), robeMat);
        bodyGroup.add(body);

        const goldMantle = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.35, 10), brightGold);
        goldMantle.position.y = 0.3;
        bodyGroup.add(goldMantle);

        root.add(bodyGroup);
        parts.body = bodyGroup;

        // Head with Sun Crown
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 2.3, 0);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), skinMat);
        headGroup.add(head);

        const crown = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.4, 5), brightGold);
        crown.position.set(0, 0.22, 0);
        headGroup.add(crown);

        const crownGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), flameMat);
        crownGem.position.set(0, 0.12, 0.24);
        headGroup.add(crownGem);

        root.add(headGroup);
        parts.head = headGroup;

        // 3-Tier Radiant Phoenix Wings
        const wingsGroup = new THREE.Group();
        wingsGroup.position.set(0, 1.9, -0.15);

        [-1, 1].forEach(dir => {
          const wing = new THREE.Group();
          wing.position.set(dir * 0.35, 0, 0);

          const tier1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.42), flameMat);
          tier1.position.set(dir * 0.45, 0, 0);
          tier1.rotation.z = dir * -0.25;

          const tier2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.3), brightGold);
          tier2.position.set(dir * 0.35, 0.15, 0.05);
          tier2.rotation.z = dir * -0.35;

          wing.add(tier1);
          wing.add(tier2);
          wingsGroup.add(wing);
        });

        root.add(wingsGroup);
        parts.wings = wingsGroup;

        // Golden Solar Scepter
        const armR = new THREE.Group();
        armR.position.set(0.42, 1.85, 0);

        const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.3), brightGold);
        staff.position.set(0, 0.1, 0.22);
        armR.add(staff);

        const fireOrb = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), flameMat);
        fireOrb.position.set(0, 0.8, 0.22);
        armR.add(fireOrb);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = staff;
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

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffbe24, metalness: 0.88, roughness: 0.22, emissive: 0x332000, emissiveIntensity: 0.2 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x543217, roughness: 0.75 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xd0dbe6, metalness: 0.78, roughness: 0.25 });

    let accentMat = goldMat;
    let chestWood = woodMat;

    if (chestType === 'silver') accentMat = steelMat;
    if (chestType === 'magical') {
      accentMat = new THREE.MeshStandardMaterial({ color: 0xd938ff, emissive: 0x9900ee, metalness: 0.85, emissiveIntensity: 0.6 });
      chestWood = new THREE.MeshStandardMaterial({ color: 0x2d1747, roughness: 0.7 });
    }
    if (chestType === 'legendary') {
      accentMat = new THREE.MeshStandardMaterial({ color: 0x00ffd0, emissive: 0x00b392, metalness: 0.9, emissiveIntensity: 0.8 });
      chestWood = new THREE.MeshStandardMaterial({ color: 0x0a332c, roughness: 0.65 });
    }

    // Chest Body Box
    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.1, 1.45), chestWood);
    baseMesh.position.y = 0.55;
    group.add(baseMesh);

    // Reinforced Edge Straps
    const trimBase = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.22, 1.52), accentMat);
    trimBase.position.y = 1.05;
    group.add(trimBase);

    const corner1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.12, 1.48), accentMat);
    corner1.position.set(-0.98, 0.55, 0);
    const corner2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.12, 1.48), accentMat);
    corner2.position.set(0.98, 0.55, 0);
    group.add(corner1);
    group.add(corner2);

    // Ornate Keyhole / Lock
    const lockGroup = new THREE.Group();
    lockGroup.position.set(0, 0.95, 0.78);
    const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.12), accentMat);
    const keyhole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    keyhole.rotation.x = Math.PI / 2;
    keyhole.position.z = 0.02;
    lockGroup.add(lockPlate);
    lockGroup.add(keyhole);
    group.add(lockGroup);

    // Animated Lid Hinge
    const lidHinge = new THREE.Group();
    lidHinge.position.set(0, 1.1, -0.725);

    const lidMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.725, 0.725, 2.1, 16, 1, false, 0, Math.PI), chestWood);
    lidMesh.rotation.z = Math.PI / 2;
    lidMesh.rotation.y = Math.PI / 2;
    lidMesh.position.set(0, 0, 0.725);
    lidHinge.add(lidMesh);

    const lidTrim = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.16, 0.22), accentMat);
    lidTrim.position.set(0, 0.08, 0.725);
    lidHinge.add(lidTrim);

    // Gold Ribs over Lid Arch
    [-0.7, 0, 0.7].forEach(x => {
      const archRib = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.05, 6, 14, Math.PI), accentMat);
      archRib.rotation.y = Math.PI / 2;
      archRib.position.set(x, 0, 0.725);
      lidHinge.add(archRib);
    });

    group.add(lidHinge);
    group.userData.lidHinge = lidHinge;

    return group;
  }
}

