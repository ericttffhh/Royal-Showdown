import * as THREE from 'three';

/**
 * 3D Model Factory for Clash Royale 3D (Refined AAA Stylized Edition)
 * Builds clean, charismatic, perfectly-proportioned characters, mounts, weapons, accessories, towers, and opening chests
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
        roughness: 0.75,
        metalness: 0.1
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
        roughness: 0.9,
        metalness: 0.02
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
        roughness: 0.6,
        metalness: 0.02
      });
      break;
    case 'dark-skin':
      mat = new THREE.MeshStandardMaterial({
        color: 0x73482b,
        roughness: 0.62,
        metalness: 0.02
      });
      break;
    case 'goblin-skin':
      mat = new THREE.MeshStandardMaterial({
        color: 0x58bf37,
        roughness: 0.55,
        metalness: 0.02
      });
      break;
    case 'goblin-skin-dark':
      mat = new THREE.MeshStandardMaterial({
        color: 0x3d8c24,
        roughness: 0.58
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
    default:
      mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  }

  materialsCache.set(key, mat);
  return mat;
}

/**
 * Clean stylized eyes for open-faced cartoon characters
 */
function addCleanStylizedEyes(parent, width = 0.07, separation = 0.12, y = 0.02, z = 0.22) {
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2 });
  const browMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.8 });

  [-separation / 2, separation / 2].forEach(x => {
    // Stylized eye dot
    const eye = new THREE.Mesh(new THREE.CylinderGeometry(width / 2, width / 2, 0.04, 8), pupilMat);
    eye.rotation.x = Math.PI / 2;
    eye.position.set(x, y, z);
    parent.add(eye);

    // Eyebrow
    const brow = new THREE.Mesh(new THREE.BoxGeometry(width * 1.3, 0.025, 0.04), browMat);
    brow.position.set(x, y + width + 0.02, z);
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

    // Stone Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, 3.4, 12), stoneMat);
    base.position.y = 1.7;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Royal Banner Belt
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.46, 1.46, 0.75, 12), teamMat);
    band.position.y = 2.55;
    group.add(band);

    const goldRing = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.06, 6, 16), goldMat);
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = 2.95;
    group.add(goldRing);

    // Flared Upper Platform
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.45, 0.8, 12), darkStoneMat);
    platform.position.y = 3.6;
    platform.castShadow = true;
    group.add(platform);

    const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.1, 12), woodMat);
    floor.position.y = 4.0;
    group.add(floor);

    // Battlements
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const bGroup = new THREE.Group();
      bGroup.position.set(Math.cos(angle) * 1.55, 4.25, Math.sin(angle) * 1.55);
      bGroup.rotation.y = -angle;

      const battlement = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.22), stoneMat);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.08, 0.26), goldMat);
      cap.position.y = 0.35;
      bGroup.add(battlement);
      bGroup.add(cap);
      group.add(bGroup);
    }

    // Princess Shooter
    const princessGroup = new THREE.Group();
    princessGroup.position.set(0, 4.05, 0);

    const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 0.75, 10), teamMat);
    dress.position.y = 0.38;
    princessGroup.add(dress);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), getTeamMaterial('skin', isBlue));
    head.position.y = 0.95;
    princessGroup.add(head);

    addCleanStylizedEyes(head, 0.05, 0.12, 0.02, 0.22);

    const hairMat = new THREE.MeshStandardMaterial({ color: 0x5a3015, roughness: 0.7 });
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), hairMat);
    hair.position.set(0, 0.98, -0.04);
    princessGroup.add(hair);

    const tiara = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.18, 6), goldMat);
    tiara.position.y = 1.22;
    princessGroup.add(tiara);

    const bowGroup = new THREE.Group();
    bowGroup.position.set(0.28, 0.65, 0.25);
    bowGroup.rotation.x = Math.PI / 4;
    const bowCurve = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 6, 12, Math.PI), goldMat);
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
    const teamDark = getTeamMaterial('team-dark', isBlue);
    const goldMat = getTeamMaterial('gold', isBlue);
    const darkMetal = getTeamMaterial('dark-metal', isBlue);

    // Castle Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 4.0, 14), stoneMat);
    base.position.y = 2.0;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const band = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 0.95, 14), teamMat);
    band.position.y = 2.8;
    group.add(band);

    const goldTrim = new THREE.Mesh(new THREE.TorusGeometry(2.38, 0.08, 6, 20), goldMat);
    goldTrim.rotation.x = Math.PI / 2;
    goldTrim.position.y = 3.3;
    group.add(goldTrim);

    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.3, 0.95, 14), darkStoneMat);
    platform.position.y = 4.25;
    platform.castShadow = true;
    group.add(platform);

    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.45, 10), goldMat);
    crownBase.position.y = 4.85;
    group.add(crownBase);

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.75, 4), goldMat);
      spike.position.set(Math.cos(angle) * 1.85, 5.35, Math.sin(angle) * 1.85);
      group.add(spike);
    }

    // King On Top
    const kingGroup = new THREE.Group();
    kingGroup.position.set(0, 5.05, 0);

    const kingBody = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.6, 1.0, 8), teamDark);
    kingBody.position.y = 0.5;
    kingGroup.add(kingBody);

    const kingHead = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), getTeamMaterial('skin', isBlue));
    kingHead.position.y = 1.25;
    kingGroup.add(kingHead);

    addCleanStylizedEyes(kingHead, 0.07, 0.18, 0.05, 0.35);

    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.55, 6), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    beard.position.set(0, 0.95, 0.28);
    beard.rotation.x = 0.4;
    kingGroup.add(beard);

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.3, 8), goldMat);
    crown.position.y = 1.62;
    kingGroup.add(crown);

    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 1.7, 10), darkMetal);
    cannon.rotation.x = Math.PI / 3.2;
    cannon.position.set(0, 0.55, 0.7);
    kingGroup.add(cannon);

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
    const metalMat = getTeamMaterial('metal', isBlue);
    const darkMetal = getTeamMaterial('dark-metal', isBlue);
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
        // Goblin Hut
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.2, 1.2, 8), woodMat);
        base.position.y = 0.6;
        root.add(base);

        const roof1 = new THREE.Mesh(new THREE.ConeGeometry(1.45, 0.85, 8), getTeamMaterial('thatch', isBlue));
        roof1.position.y = 1.5;
        root.add(roof1);

        const roof2 = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.75, 8), getTeamMaterial('thatch', isBlue));
        roof2.position.y = 2.0;
        root.add(roof2);

        const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5), woodMat);
        spear.position.set(0, 2.6, 0);
        root.add(spear);

        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.65), teamMat);
        flag.position.set(0.32, 2.85, 0);
        root.add(flag);
        break;
      }

      case 'knight': {
        // 騎士 (Knight) - Paladin with Helm, Plume, Cape, Sword & Shield
        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 0.75;

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.34, 0.75, 10), metalMat);
        bodyGroup.add(body);

        const tabard = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.65, 10, 1, true, -Math.PI / 4, Math.PI / 2), teamMat);
        bodyGroup.add(tabard);

        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 10), darkLeather);
        belt.position.y = -0.28;
        bodyGroup.add(belt);

        const cape = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.85, 0.05), teamDark);
        cape.position.set(0, -0.05, -0.38);
        cape.rotation.x = -0.15;
        bodyGroup.add(cape);

        root.add(bodyGroup);
        parts.body = bodyGroup;

        // Pauldrons
        [-0.45, 0.45].forEach(x => {
          const pad = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), metalMat);
          pad.position.set(x, 1.1, 0);
          root.add(pad);
        });

        // Helmet
        const headGroup = new THREE.Group();
        headGroup.position.y = 1.35;

        const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.5, 10), metalMat);
        headGroup.add(helmet);

        const visorSlit = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.1), darkMetal);
        visorSlit.position.set(0, 0.05, 0.24);
        headGroup.add(visorSlit);

        const plume = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.45, 6), teamMat);
        plume.position.set(0, 0.42, -0.1);
        plume.rotation.x = -0.35;
        headGroup.add(plume);

        root.add(headGroup);
        parts.head = headGroup;

        // Right Arm & Sword
        const armR = new THREE.Group();
        armR.position.set(0.5, 0.92, 0);
        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.45), metalMat);
        armMeshR.position.y = -0.22;
        armR.add(armMeshR);

        const swordGroup = new THREE.Group();
        swordGroup.position.set(0, -0.4, 0.35);
        swordGroup.rotation.x = Math.PI / 3.2;

        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.18), metalMat);
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.1), goldMat);
        guard.position.y = -0.42;
        const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), goldMat);
        pommel.position.y = -0.68;

        swordGroup.add(blade);
        swordGroup.add(guard);
        swordGroup.add(pommel);
        armR.add(swordGroup);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = swordGroup;

        // Left Arm & Shield
        const armL = new THREE.Group();
        armL.position.set(-0.5, 0.92, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.45), metalMat);
        armMeshL.position.y = -0.22;
        armL.add(armMeshL);

        const shield = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.08), teamMat);
        shield.position.set(0, -0.18, 0.22);
        const shieldLion = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), goldMat);
        shieldLion.position.z = 0.06;
        shield.add(shieldLion);
        armL.add(shield);

        root.add(armL);
        parts.leftArm = armL;

        // Legs
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.48), metalMat);
        legL.position.set(-0.2, 0.24, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.48), metalMat);
        legR.position.set(0.2, 0.24, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'pekka': {
        // P.E.K.K.A - Heavy Titanium Robot Mech
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.52, 1.25, 8), darkMetal);
        body.position.y = 1.2;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        const core = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), new THREE.MeshStandardMaterial({
          color: 0xaa00ff,
          emissive: 0xcc00ff,
          emissiveIntensity: 2.5
        }));
        core.position.set(0, 1.2, 0.4);
        root.add(core);

        const headGroup = new THREE.Group();
        headGroup.position.y = 1.95;

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.52), darkMetal);
        headGroup.add(head);

        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.1), new THREE.MeshStandardMaterial({
          color: 0xee00ff,
          emissive: 0xff00cc,
          emissiveIntensity: 3.0
        }));
        visor.position.set(0, 0.02, 0.26);
        headGroup.add(visor);

        const hornMat = new THREE.MeshStandardMaterial({
          color: 0xdd00ff,
          emissive: 0xaa00ff,
          emissiveIntensity: 2.2
        });
        [-0.38, 0.38].forEach(x => {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.7, 6), hornMat);
          horn.position.set(x, 0.35, 0);
          horn.rotation.z = x > 0 ? -0.5 : 0.5;
          headGroup.add(horn);
        });

        root.add(headGroup);
        parts.head = headGroup;

        const armR = new THREE.Group();
        armR.position.set(0.8, 1.3, 0);
        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.6), darkMetal);
        armMeshR.position.y = -0.3;
        armR.add(armMeshR);

        const katana = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 0.28), new THREE.MeshStandardMaterial({
          color: 0xee00ff,
          emissive: 0xcc00ff,
          emissiveIntensity: 2.2,
          roughness: 0.1
        }));
        katana.position.set(0, -0.6, 0.5);
        katana.rotation.x = Math.PI / 3;
        armR.add(katana);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = katana;

        const armL = new THREE.Group();
        armL.position.set(-0.8, 1.3, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.6), darkMetal);
        armMeshL.position.y = -0.3;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.65), darkMetal);
        legL.position.set(-0.32, 0.32, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.65), darkMetal);
        legR.position.set(0.32, 0.32, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'hogrider': {
        // 野豬騎士 (Hog Rider)
        const mount = new THREE.Group();
        mount.position.set(0, 0.45, 0);

        const hogBody = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 8), new THREE.MeshStandardMaterial({ color: 0x7c4820, roughness: 0.8 }));
        hogBody.scale.set(0.95, 0.85, 1.35);
        mount.add(hogBody);

        const hogHead = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.55, 8), new THREE.MeshStandardMaterial({ color: 0x6e3d16 }));
        hogHead.rotation.x = Math.PI / 2;
        hogHead.position.set(0, 0.1, 0.68);
        mount.add(hogHead);

        [-0.2, 0.2].forEach(x => {
          const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.32, 6), boneMat);
          tusk.position.set(x, 0.06, 0.88);
          tusk.rotation.x = -0.5;
          mount.add(tusk);
        });

        root.add(mount);
        parts.mount = mount;

        const riderBody = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.58), darkSkin);
        riderBody.position.set(0, 0.9, -0.1);
        root.add(riderBody);

        const riderHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), darkSkin);
        riderHead.position.set(0, 1.3, -0.1);
        addCleanStylizedEyes(riderHead, 0.05, 0.12, 0.02, 0.22);

        const mohawk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.35), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        mohawk.position.set(0, 0.18, -0.02);
        riderHead.add(mohawk);

        const beardH = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.2), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        beardH.position.set(0, -0.12, 0.14);
        riderHead.add(beardH);

        root.add(riderHead);
        parts.head = riderHead;

        const armR = new THREE.Group();
        armR.position.set(0.4, 1.0, -0.1);
        const hammerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.0), darkWood);
        const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.45), getTeamMaterial('stone', isBlue));
        hammerHead.position.y = 0.4;
        hammerPole.add(hammerHead);
        hammerPole.rotation.x = Math.PI / 3;
        armR.add(hammerPole);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = hammerPole;
        break;
      }

      case 'musketeer': {
        // 火槍手 (Musketeer)
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.65, 8), teamMat);
        body.position.y = 0.65;
        root.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 8), skinMat);
        head.position.y = 1.15;
        addCleanStylizedEyes(head, 0.05, 0.11, 0.02, 0.21);

        const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshStandardMaterial({ color: 0x8e24aa }));
        hairM.position.set(0, 0.02, -0.04);
        head.add(hairM);

        const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 10), teamDark);
        hatBrim.position.y = 0.16;
        hatBrim.rotation.z = -0.15;
        head.add(hatBrim);

        const feather = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.45, 6), new THREE.MeshStandardMaterial({ color: 0xff00aa }));
        feather.position.set(0.22, 0.35, -0.1);
        feather.rotation.z = -0.6;
        head.add(feather);

        root.add(head);
        parts.head = head;

        const armR = new THREE.Group();
        armR.position.set(0.35, 0.78, 0);
        const musket = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.25, 8), brightGold);
        musket.rotation.x = Math.PI / 2.2;
        musket.position.set(0, 0, 0.4);
        armR.add(musket);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = musket;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.4), leatherMat);
        legL.position.set(-0.14, 0.2, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.4), leatherMat);
        legR.position.set(0.14, 0.2, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'giant': {
        // 巨人 (Giant)
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.65, 1.5, 10), leatherMat);
        body.position.y = 1.35;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        const furCollar = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.18, 6, 12), new THREE.MeshStandardMaterial({ color: 0x5a381e }));
        furCollar.rotation.x = Math.PI / 2;
        furCollar.position.y = 2.05;
        root.add(furCollar);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 10), skinMat);
        head.position.y = 2.3;
        addCleanStylizedEyes(head, 0.09, 0.22, 0.06, 0.44);

        const gingerMat = new THREE.MeshStandardMaterial({ color: 0xd85b12 });
        const beard = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.65, 8), gingerMat);
        beard.position.set(0, -0.28, 0.32);
        beard.rotation.x = 0.4;
        head.add(beard);

        root.add(head);
        parts.head = head;

        const armGeoG = new THREE.CylinderGeometry(0.25, 0.21, 0.9, 8);
        const armL = new THREE.Group();
        armL.position.set(-0.95, 1.6, 0);
        const armMeshL = new THREE.Mesh(armGeoG, skinMat);
        armMeshL.position.y = -0.42;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(0.95, 1.6, 0);
        const armMeshR = new THREE.Mesh(armGeoG, skinMat);
        armMeshR.position.y = -0.42;
        armR.add(armMeshR);
        root.add(armR);
        parts.rightArm = armR;

        const legGeoG = new THREE.CylinderGeometry(0.27, 0.23, 0.8, 8);
        const legL = new THREE.Mesh(legGeoG, darkLeather);
        legL.position.set(-0.36, 0.4, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(legGeoG, darkLeather);
        legR.position.set(0.36, 0.4, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'archers': {
        // 弓箭手 (Archers)
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.58, 8), teamMat);
        body.position.y = 0.55;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), skinMat);
        head.position.y = 1.0;
        addCleanStylizedEyes(head, 0.05, 0.11, 0.02, 0.2);

        const pinkHairMat = new THREE.MeshStandardMaterial({ color: 0xff3388 });
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), pinkHairMat);
        hair.position.set(0, 0.04, -0.04);
        head.add(hair);

        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x16a085 }));
        cap.position.set(0, 0.2, -0.05);
        cap.rotation.x = -0.3;
        head.add(cap);

        root.add(head);
        parts.head = head;

        const armR = new THREE.Group();
        armR.position.set(0.3, 0.68, 0);
        const bow = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.03, 6, 12, Math.PI), woodMat);
        bow.rotation.x = Math.PI / 2;
        bow.position.set(0, -0.1, 0.2);
        armR.add(bow);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = bow;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.36, 6), teamMat);
        legL.position.set(-0.12, 0.18, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.36, 6), teamMat);
        legR.position.set(0.12, 0.18, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'wizard': {
        // 魔法師 (Wizard)
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.95, 8), teamDark);
        body.position.y = 0.58;
        root.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), skinMat);
        head.position.y = 1.15;

        // Glowing Cyan Eyes
        const glowEyeMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2.5 });
        [-0.07, 0.07].forEach(x => {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), glowEyeMat);
          eye.position.set(x, 0.02, 0.22);
          head.add(eye);
        });

        const goatee = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        goatee.position.set(0, -0.15, 0.2);
        goatee.rotation.x = 0.3;
        head.add(goatee);

        const hood = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.45, 8), teamMat);
        hood.position.set(0, 0.18, -0.05);
        head.add(hood);

        root.add(head);
        parts.head = head;

        const armR = new THREE.Group();
        armR.position.set(0.42, 0.8, 0);

        const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.2), darkWood);
        staff.position.set(0, 0.1, 0.2);
        armR.add(staff);

        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x00ddff,
          emissiveIntensity: 2.5
        }));
        orb.position.set(0, 0.72, 0.2);
        armR.add(orb);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = staff;
        break;
      }

      case 'dragon': {
        // 飛龍寶寶 (Baby Dragon)
        const dragonGreen = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.45 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.46, 10, 8), dragonGreen);
        body.position.y = 1.8;
        body.scale.set(1.0, 0.85, 1.25);
        root.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), dragonGreen);
        head.position.set(0, 2.15, 0.42);

        addCleanStylizedEyes(head, 0.07, 0.18, 0.05, 0.32);

        const snout = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.35, 6), dragonGreen);
        snout.rotation.x = Math.PI / 2;
        snout.position.set(0, -0.06, 0.32);
        head.add(snout);

        const mouthGlow = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshStandardMaterial({
          color: 0xff5500,
          emissive: 0xff3300,
          emissiveIntensity: 2.0
        }));
        mouthGlow.position.set(0, -0.08, 0.28);
        head.add(mouthGlow);

        [-0.16, 0.16].forEach(x => {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 4), boneMat);
          horn.position.set(x, 0.3, -0.06);
          horn.rotation.x = -0.4;
          head.add(horn);
        });

        root.add(head);
        parts.head = head;

        const wingsGroup = new THREE.Group();
        wingsGroup.position.set(0, 1.95, 0);

        [-1, 1].forEach(dir => {
          const wing = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.03, 0.42), teamMat);
          wing.position.set(dir * 0.55, 0, 0);
          wing.rotation.z = dir * -0.2;
          wingsGroup.add(wing);
        });

        root.add(wingsGroup);
        parts.wings = wingsGroup;
        break;
      }

      case 'goblins': {
        // 哥布林 (Goblins)
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.15, 0.42, 6), teamMat);
        body.position.y = 0.42;
        root.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 8), getTeamMaterial('goblin-skin', isBlue));
        head.position.y = 0.72;
        addCleanStylizedEyes(head, 0.05, 0.11, 0.02, 0.21);

        [-0.24, 0.24].forEach(x => {
          const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 4), getTeamMaterial('goblin-skin', isBlue));
          ear.position.set(x, 0.04, 0);
          ear.rotation.z = x > 0 ? -Math.PI / 3 : Math.PI / 3;
          head.add(ear);
        });

        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 4), getTeamMaterial('goblin-skin-dark', isBlue));
        nose.rotation.x = Math.PI / 2.5;
        nose.position.set(0, -0.04, 0.24);
        head.add(nose);

        root.add(head);
        parts.head = head;

        const armR = new THREE.Group();
        armR.position.set(0.26, 0.48, 0);
        const dagger = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.1), new THREE.MeshStandardMaterial({
          color: 0x33ff66,
          emissive: 0x11aa33,
          metalness: 0.7,
          roughness: 0.2
        }));
        dagger.position.set(0, 0, 0.22);
        dagger.rotation.x = Math.PI / 3;
        armR.add(dagger);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = dagger;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.26, 6), getTeamMaterial('goblin-skin', isBlue));
        legL.position.set(-0.1, 0.13, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.26, 6), getTeamMaterial('goblin-skin', isBlue));
        legR.position.set(0.1, 0.13, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'skeletons': {
        // 骷髏大軍 (Skeletons)
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.32, 6), boneMat);
        body.position.y = 0.36;
        root.add(body);
        parts.body = body;

        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), boneMat);
        skull.position.y = 0.64;

        const spectralMat = new THREE.MeshStandardMaterial({
          color: isBlue ? 0x00ffff : 0xff2255,
          emissive: isBlue ? 0x00ddff : 0xff0033,
          emissiveIntensity: 2.2
        });
        [-0.06, 0.06].forEach(x => {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), spectralMat);
          eye.position.set(x, 0.02, 0.17);
          skull.add(eye);
        });

        const potHelmet = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.14, 6), darkMetal);
        potHelmet.position.y = 0.15;
        skull.add(potHelmet);

        root.add(skull);
        parts.head = skull;

        const armR = new THREE.Group();
        armR.position.set(0.2, 0.4, 0);
        const sword = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.08), metalMat);
        sword.rotation.x = Math.PI / 3;
        sword.position.set(0, 0, 0.16);
        armR.add(sword);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = sword;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22), boneMat);
        legL.position.set(-0.08, 0.11, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22), boneMat);
        legR.position.set(0.08, 0.11, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'inferno': {
        // 地獄塔 (Inferno Tower)
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.1, 1.9, 8), getTeamMaterial('stone', isBlue));
        base.position.y = 0.95;
        root.add(base);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.12, 6, 12), teamMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 1.7;
        root.add(ring);

        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), new THREE.MeshStandardMaterial({
          color: 0xff5500,
          emissive: 0xff3300,
          emissiveIntensity: 2.6
        }));
        crystal.position.y = 2.3;
        root.add(crystal);
        parts.head = crystal;
        break;
      }

      case 'cyber_ninja': {
        // 賽博幻影忍者 (Cyber Ninja)
        const cyberMat = new THREE.MeshStandardMaterial({ color: 0x141a29, roughness: 0.2, metalness: 0.85 });
        const neonCyan = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2.8 });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.21, 0.62, 6), cyberMat);
        body.position.y = 0.62;
        root.add(body);
        parts.body = body;

        const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.55), neonCyan);
        scarf.position.set(0, 0.92, -0.22);
        scarf.rotation.x = 0.35;
        root.add(scarf);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 8, 8), cyberMat);
        head.position.y = 1.1;
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.12), neonCyan);
        visor.position.set(0, 0.02, 0.17);
        head.add(visor);
        root.add(head);
        parts.head = head;

        const armR = new THREE.Group();
        armR.position.set(0.36, 0.78, 0);
        const katanaR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.9, 0.12), neonCyan);
        katanaR.position.set(0, 0.1, 0.26);
        katanaR.rotation.x = Math.PI / 3;
        armR.add(katanaR);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = katanaR;

        const armL = new THREE.Group();
        armL.position.set(-0.36, 0.78, 0);
        const katanaL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.9, 0.12), neonCyan);
        katanaL.position.set(0, 0.1, 0.26);
        katanaL.rotation.x = Math.PI / 3;
        armL.add(katanaL);
        root.add(armL);
        parts.leftArm = armL;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.4, 6), cyberMat);
        legL.position.set(-0.13, 0.2, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.4, 6), cyberMat);
        legR.position.set(0.13, 0.2, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'thunder_valkyrie': {
        // 雷霆女武神 (Thunder Valkyrie)
        const armorMat = new THREE.MeshStandardMaterial({ color: 0x1f293d, metalness: 0.75, roughness: 0.25 });
        const thunderMat = new THREE.MeshStandardMaterial({ color: 0xffea00, emissive: 0xffcc00, emissiveIntensity: 2.6 });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.27, 0.72, 8), teamMat);
        body.position.y = 0.72;
        root.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), skinMat);
        head.position.y = 1.22;
        addCleanStylizedEyes(head, 0.05, 0.11, 0.02, 0.22);

        const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.2, 8), brightGold);
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
        armR.position.set(0.44, 0.88, 0);
        const axeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.25), darkWood);
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

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.44), armorMat);
        legL.position.set(-0.16, 0.22, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.44), armorMat);
        legR.position.set(0.16, 0.22, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'mecha_golem': {
        // 泰坦機甲魔像 (Mecha Golem)
        const heavySteel = new THREE.MeshStandardMaterial({ color: 0x2b3342, metalness: 0.88, roughness: 0.18 });
        const coreMat = new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff3300, emissiveIntensity: 3.0 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.25, 0.95), heavySteel);
        body.position.y = 1.32;
        root.add(body);
        parts.body = body;

        const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.16, 8), coreMat);
        chestCore.rotation.x = Math.PI / 2;
        chestCore.position.set(0, 1.35, 0.5);
        root.add(chestCore);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.48, 0.52), heavySteel);
        head.position.y = 2.1;
        const eyeVisor = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.11, 0.11), coreMat);
        eyeVisor.position.set(0, 0.02, 0.26);
        head.add(eyeVisor);
        root.add(head);
        parts.head = head;

        const armL = new THREE.Group();
        armL.position.set(-0.9, 1.42, 0);
        const fistL = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.95, 0.48), heavySteel);
        fistL.position.y = -0.38;
        armL.add(fistL);
        root.add(armL);
        parts.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(0.9, 1.42, 0);
        const fistR = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.95, 0.48), heavySteel);
        fistR.position.y = -0.38;
        armR.add(fistR);
        root.add(armR);
        parts.rightArm = armR;

        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.78, 0.48), heavySteel);
        legL.position.set(-0.36, 0.39, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.78, 0.48), heavySteel);
        legR.position.set(0.36, 0.39, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'phoenix_mage': {
        // 不死鳥炎術師 (Phoenix Mage)
        const robeMat = new THREE.MeshStandardMaterial({ color: 0x8a1505, roughness: 0.35 });
        const flameMat = new THREE.MeshStandardMaterial({ color: 0xff7700, emissive: 0xff3300, emissiveIntensity: 2.8 });

        const body = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.92, 8), robeMat);
        body.position.y = 1.72; // Hovering
        root.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 8), skinMat);
        head.position.set(0, 2.26, 0);
        addCleanStylizedEyes(head, 0.05, 0.11, 0.02, 0.21);

        const crown = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.36, 4), brightGold);
        crown.position.set(0, 0.2, 0);
        head.add(crown);
        root.add(head);
        parts.head = head;

        const wingsGroup = new THREE.Group();
        wingsGroup.position.set(0, 1.88, -0.15);

        [-1, 1].forEach(dir => {
          const wing = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.4), flameMat);
          wing.position.set(dir * 0.55, 0, 0);
          wing.rotation.z = dir * -0.25;
          wingsGroup.add(wing);
        });

        root.add(wingsGroup);
        parts.wings = wingsGroup;

        const armR = new THREE.Group();
        armR.position.set(0.4, 1.82, 0);
        const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.25), brightGold);
        staff.position.set(0, 0.1, 0.2);
        armR.add(staff);

        const fireOrb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), flameMat);
        fireOrb.position.set(0, 0.75, 0.2);
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
    if (chestType === 'magical' || chestType === 'magic') {
      accentMat = new THREE.MeshStandardMaterial({ color: 0xd938ff, emissive: 0x9900ee, metalness: 0.85, emissiveIntensity: 0.6 });
      chestWood = new THREE.MeshStandardMaterial({ color: 0x2d1747, roughness: 0.7 });
    }
    if (chestType === 'legendary') {
      accentMat = new THREE.MeshStandardMaterial({ color: 0x00ffd0, emissive: 0x00b392, metalness: 0.9, emissiveIntensity: 0.8 });
      chestWood = new THREE.MeshStandardMaterial({ color: 0x0a332c, roughness: 0.65 });
    }

    // Chest Body Box
    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 1.4), chestWood);
    baseMesh.position.y = 0.5;
    group.add(baseMesh);

    // Reinforced Edge Straps
    const trimBase = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.18, 1.46), accentMat);
    trimBase.position.y = 0.95;
    group.add(trimBase);

    // Ornate Keyhole / Lock Plate
    const lockGroup = new THREE.Group();
    lockGroup.position.set(0, 0.88, 0.74);
    const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.1), accentMat);
    const keyhole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    keyhole.rotation.x = Math.PI / 2;
    keyhole.position.z = 0.02;
    lockGroup.add(lockPlate);
    lockGroup.add(keyhole);
    group.add(lockGroup);

    // Animated Lid Hinge at top rear
    const lidHinge = new THREE.Group();
    lidHinge.position.set(0, 1.0, -0.7);

    // Upper Half-Cylinder Lid
    const lidMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.0, 14, 1, false, 0, Math.PI), chestWood);
    lidMesh.rotation.z = Math.PI / 2;
    lidMesh.rotation.y = Math.PI / 2;
    lidMesh.position.set(0, 0, 0.7);
    lidHinge.add(lidMesh);

    const lidTrim = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.12, 0.18), accentMat);
    lidTrim.position.set(0, 0.06, 0.7);
    lidHinge.add(lidTrim);

    group.add(lidHinge);
    group.userData.lidHinge = lidHinge;

    return group;
  }
}
