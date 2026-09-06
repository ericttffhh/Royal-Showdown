import * as THREE from 'three';

/**
 * 3D Model Factory for Clash Royale 3D (Refined & High-Detail Edition)
 * Builds stylized characters, mounts, weapons, towers, goblin hut, and opening chest animations
 */

const materialsCache = new Map();

function getTeamMaterial(type, isBlue, extra = {}) {
  const key = `${type}_${isBlue ? 'blue' : 'red'}_${JSON.stringify(extra)}`;
  if (materialsCache.has(key)) return materialsCache.get(key);

  const teamColor = isBlue ? 0x1e60ff : 0xff2a55;
  const teamDark = isBlue ? 0x0c369e : 0x8a0c28;

  let mat;
  switch (type) {
    case 'team':
      mat = new THREE.MeshStandardMaterial({
        color: teamColor,
        roughness: 0.35,
        metalness: 0.3,
        ...extra
      });
      break;
    case 'team-dark':
      mat = new THREE.MeshStandardMaterial({
        color: teamDark,
        roughness: 0.45,
        metalness: 0.4,
        ...extra
      });
      break;
    case 'stone':
      mat = new THREE.MeshStandardMaterial({
        color: 0x768294,
        roughness: 0.75,
        metalness: 0.15,
        flatShading: true
      });
      break;
    case 'gold':
      mat = new THREE.MeshStandardMaterial({
        color: 0xffbe24,
        roughness: 0.25,
        metalness: 0.85,
        emissive: 0x332000,
        emissiveIntensity: 0.2
      });
      break;
    case 'wood':
      mat = new THREE.MeshStandardMaterial({
        color: 0x614023,
        roughness: 0.75,
        metalness: 0.05
      });
      break;
    case 'thatch':
      mat = new THREE.MeshStandardMaterial({
        color: 0x96733b,
        roughness: 0.9,
        metalness: 0.0
      });
      break;
    case 'metal':
      mat = new THREE.MeshStandardMaterial({
        color: 0xd6e0eb,
        roughness: 0.2,
        metalness: 0.8
      });
      break;
    case 'dark-metal':
      mat = new THREE.MeshStandardMaterial({
        color: 0x2c3340,
        roughness: 0.3,
        metalness: 0.75
      });
      break;
    case 'skin':
      mat = new THREE.MeshStandardMaterial({
        color: 0xfbd2a8,
        roughness: 0.55
      });
      break;
    case 'dark-skin':
      mat = new THREE.MeshStandardMaterial({
        color: 0x70472b,
        roughness: 0.6
      });
      break;
    case 'goblin-skin':
      mat = new THREE.MeshStandardMaterial({
        color: 0x54b53a,
        roughness: 0.55
      });
      break;
    case 'bone':
      mat = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        roughness: 0.65
      });
      break;
    case 'leather':
      mat = new THREE.MeshStandardMaterial({
        color: 0x8a5229,
        roughness: 0.8
      });
      break;
    default:
      mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  }

  materialsCache.set(key, mat);
  return mat;
}

export class ModelFactory {
  // -------------------------------------------------------------
  // TOWERS CREATION
  // -------------------------------------------------------------

  static createPrincessTower(isBlue) {
    const group = new THREE.Group();
    group.name = 'PrincessTower';

    const stoneMat = getTeamMaterial('stone', isBlue);
    const teamMat = getTeamMaterial('team', isBlue);
    const goldMat = getTeamMaterial('gold', isBlue);

    const baseGeo = new THREE.CylinderGeometry(1.3, 1.6, 3.4, 10);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 1.7;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const bandGeo = new THREE.CylinderGeometry(1.38, 1.38, 0.6, 10);
    const band = new THREE.Mesh(bandGeo, teamMat);
    band.position.y = 2.5;
    group.add(band);

    const goldRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.06, 6, 16), goldMat);
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = 2.8;
    group.add(goldRing);

    const platformGeo = new THREE.CylinderGeometry(1.7, 1.4, 0.7, 10);
    const platform = new THREE.Mesh(platformGeo, stoneMat);
    platform.position.y = 3.5;
    platform.castShadow = true;
    group.add(platform);

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const battlement = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, 0.25), stoneMat);
      battlement.position.set(Math.cos(angle) * 1.5, 4.1, Math.sin(angle) * 1.5);
      battlement.rotation.y = -angle;
      group.add(battlement);
    }

    const princessGroup = new THREE.Group();
    princessGroup.position.set(0, 3.8, 0);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 0.75, 8), teamMat);
    princessGroup.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), getTeamMaterial('skin', isBlue));
    head.position.y = 0.55;
    princessGroup.add(head);

    const tiara = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.18, 6), goldMat);
    tiara.position.y = 0.75;
    princessGroup.add(tiara);

    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 6, 14, Math.PI), goldMat);
    bow.position.set(0.3, 0.35, 0.2);
    bow.rotation.x = Math.PI / 2;
    princessGroup.add(bow);

    group.add(princessGroup);
    group.userData.shooter = princessGroup;

    return group;
  }

  static createKingTower(isBlue) {
    const group = new THREE.Group();
    group.name = 'KingTower';

    const stoneMat = getTeamMaterial('stone', isBlue);
    const teamMat = getTeamMaterial('team', isBlue);
    const goldMat = getTeamMaterial('gold', isBlue);
    const metalMat = getTeamMaterial('dark-metal', isBlue);

    const baseGeo = new THREE.CylinderGeometry(2.1, 2.5, 4.0, 12);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 2.0;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const band = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 0.9, 12), teamMat);
    band.position.y = 2.8;
    group.add(band);

    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.2, 0.9, 12), stoneMat);
    platform.position.y = 4.2;
    platform.castShadow = true;
    group.add(platform);

    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.45, 8), goldMat);
    crownBase.position.y = 4.8;
    group.add(crownBase);

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 4), goldMat);
      spike.position.set(Math.cos(angle) * 1.6, 5.3, Math.sin(angle) * 1.6);
      group.add(spike);
    }

    const kingGroup = new THREE.Group();
    kingGroup.position.set(0, 5.0, 0);

    const kingBody = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.0, 8), teamMat);
    kingGroup.add(kingBody);

    const kingHead = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), getTeamMaterial('skin', isBlue));
    kingHead.position.y = 0.8;
    kingGroup.add(kingHead);

    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.45, 6), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    beard.position.set(0, 0.6, 0.3);
    beard.rotation.x = 0.5;
    kingGroup.add(beard);

    const headCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.25, 6), goldMat);
    headCrown.position.y = 1.15;
    kingGroup.add(headCrown);

    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 1.6, 8), metalMat);
    cannon.rotation.x = Math.PI / 3;
    cannon.position.set(0, 0.5, 0.7);
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
    const metalMat = getTeamMaterial('metal', isBlue);
    const darkMetal = getTeamMaterial('dark-metal', isBlue);
    const skinMat = getTeamMaterial('skin', isBlue);
    const darkSkin = getTeamMaterial('dark-skin', isBlue);
    const woodMat = getTeamMaterial('wood', isBlue);
    const goldMat = getTeamMaterial('gold', isBlue);
    const leatherMat = getTeamMaterial('leather', isBlue);

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
        // Goblin Hut Spawner Building
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 1.2, 8), woodMat);
        base.position.y = 0.6;
        root.add(base);

        // Straw Thatch Roof
        const roof = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.2, 8), getTeamMaterial('thatch', isBlue));
        roof.position.y = 1.8;
        root.add(roof);

        // Tribal Spear Flag on top
        const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4), metalMat);
        spear.position.set(0, 2.5, 0);
        root.add(spear);

        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.6), teamMat);
        flag.position.set(0.3, 2.8, 0);
        root.add(flag);
        break;
      }

      case 'knight': {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.75, 8), teamMat);
        body.position.y = 0.75;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        [-0.45, 0.45].forEach(x => {
          const pad = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), metalMat);
          pad.position.set(x, 1.05, 0);
          root.add(pad);
        });

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), metalMat);
        head.position.y = 1.3;
        head.castShadow = true;
        root.add(head);
        parts.head = head;

        const plume = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 6), teamMat);
        plume.position.set(0, 1.62, -0.08);
        plume.rotation.x = -0.3;
        root.add(plume);

        const armR = new THREE.Group();
        armR.position.set(0.48, 0.9, 0);
        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.45), metalMat);
        armMeshR.position.y = -0.22;
        armR.add(armMeshR);

        const swordGroup = new THREE.Group();
        swordGroup.position.set(0, -0.4, 0.35);
        swordGroup.rotation.x = Math.PI / 3;

        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.16), metalMat);
        const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.08), goldMat);
        hilt.position.y = -0.35;
        swordGroup.add(blade);
        swordGroup.add(hilt);
        armR.add(swordGroup);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = swordGroup;

        const armL = new THREE.Group();
        armL.position.set(-0.48, 0.9, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.45), metalMat);
        armMeshL.position.y = -0.22;
        armL.add(armMeshL);

        const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 6), teamMat);
        shield.rotation.x = Math.PI / 2;
        shield.position.set(0, -0.2, 0.22);
        const shieldEmblem = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.1), goldMat);
        shield.add(shieldEmblem);
        armL.add(shield);

        root.add(armL);
        parts.leftArm = armL;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.48, 6), metalMat);
        legL.position.set(-0.2, 0.24, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.48, 6), metalMat);
        legR.position.set(0.2, 0.24, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'pekka': {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.5, 1.2, 8), darkMetal);
        body.position.y = 1.2;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        const core = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshStandardMaterial({
          color: 0x9900ff,
          emissive: 0xbb33ff,
          emissiveIntensity: 2.0
        }));
        core.position.set(0, 1.2, 0.38);
        root.add(core);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5), darkMetal);
        head.position.y = 1.9;
        root.add(head);
        parts.head = head;

        const hornMat = new THREE.MeshStandardMaterial({
          color: 0xcc00ff,
          emissive: 0xaa00ff,
          emissiveIntensity: 2.5
        });
        [-0.35, 0.35].forEach(x => {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 6), hornMat);
          horn.position.set(x, 2.2, 0);
          horn.rotation.z = x > 0 ? -0.5 : 0.5;
          root.add(horn);
        });

        const armR = new THREE.Group();
        armR.position.set(0.75, 1.3, 0);
        const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.6), darkMetal);
        armMeshR.position.y = -0.3;
        armR.add(armMeshR);

        const katana = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.25), new THREE.MeshStandardMaterial({
          color: 0xdd00ff,
          emissive: 0xcc00ff,
          emissiveIntensity: 1.8,
          roughness: 0.1
        }));
        katana.position.set(0, -0.6, 0.5);
        katana.rotation.x = Math.PI / 3;
        armR.add(katana);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = katana;

        const armL = new THREE.Group();
        armL.position.set(-0.75, 1.3, 0);
        const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.6), darkMetal);
        armMeshL.position.y = -0.3;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.6, 6), darkMetal);
        legL.position.set(-0.3, 0.3, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.6, 6), darkMetal);
        legR.position.set(0.3, 0.3, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'hogrider': {
        const mount = new THREE.Group();
        mount.position.set(0, 0.45, 0);

        const hogBody = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), new THREE.MeshStandardMaterial({ color: 0x8b5a2b }));
        hogBody.scale.set(0.9, 0.8, 1.3);
        mount.add(hogBody);

        const hogHead = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0x6e411b }));
        hogHead.rotation.x = Math.PI / 2;
        hogHead.position.set(0, 0.1, 0.65);
        mount.add(hogHead);

        [-0.2, 0.2].forEach(x => {
          const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 4), getTeamMaterial('bone', isBlue));
          tusk.position.set(x, 0.05, 0.85);
          tusk.rotation.x = -0.5;
          mount.add(tusk);
        });

        root.add(mount);
        parts.mount = mount;

        const riderBody = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.55), darkSkin);
        riderBody.position.set(0, 0.85, -0.1);
        root.add(riderBody);

        const riderHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), darkSkin);
        riderHead.position.set(0, 1.25, -0.1);
        root.add(riderHead);
        parts.head = riderHead;

        const mohawk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.3), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        mohawk.position.set(0, 1.42, -0.1);
        root.add(mohawk);

        const armR = new THREE.Group();
        armR.position.set(0.38, 0.95, -0.1);
        const hammerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9), woodMat);
        const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.4), getTeamMaterial('stone', isBlue));
        hammerHead.position.y = 0.35;
        hammerPole.add(hammerHead);
        hammerPole.rotation.x = Math.PI / 3;
        armR.add(hammerPole);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = hammerPole;
        break;
      }

      case 'musketeer': {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.65, 8), teamMat);
        body.position.y = 0.65;
        root.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), skinMat);
        head.position.y = 1.1;
        root.add(head);
        parts.head = head;

        const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 8), teamMat);
        hat.position.y = 1.25;
        root.add(hat);

        const feather = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), new THREE.MeshStandardMaterial({ color: 0xff33cc }));
        feather.position.set(0.18, 1.4, -0.1);
        feather.rotation.z = -0.5;
        root.add(feather);

        const armR = new THREE.Group();
        armR.position.set(0.32, 0.75, 0);
        const musket = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6), metalMat);
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
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.62, 1.45, 8), leatherMat);
        body.position.y = 1.35;
        body.castShadow = true;
        root.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 8, 8), skinMat);
        head.position.y = 2.25;
        head.castShadow = true;
        root.add(head);
        parts.head = head;

        const beard = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.55, 6), new THREE.MeshStandardMaterial({ color: 0xd35400 }));
        beard.position.set(0, 2.0, 0.32);
        beard.rotation.x = 0.4;
        root.add(beard);

        const armGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.85, 6);
        const armL = new THREE.Group();
        armL.position.set(-0.9, 1.55, 0);
        const armMeshL = new THREE.Mesh(armGeo, skinMat);
        armMeshL.position.y = -0.42;
        armL.add(armMeshL);
        root.add(armL);
        parts.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(0.9, 1.55, 0);
        const armMeshR = new THREE.Mesh(armGeo, skinMat);
        armMeshR.position.y = -0.42;
        armR.add(armMeshR);
        root.add(armR);
        parts.rightArm = armR;

        const legGeo = new THREE.CylinderGeometry(0.26, 0.22, 0.75, 6);
        const legL = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: 0x4a3728 }));
        legL.position.set(-0.36, 0.38, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: 0x4a3728 }));
        legR.position.set(0.36, 0.38, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'archers': {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.55, 8), teamMat);
        body.position.y = 0.55;
        body.castShadow = true;
        root.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), skinMat);
        head.position.y = 0.95;
        root.add(head);
        parts.head = head;

        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0x16a085 }));
        cap.position.set(0, 1.15, -0.05);
        cap.rotation.x = -0.3;
        root.add(cap);

        const armR = new THREE.Group();
        armR.position.set(0.3, 0.65, 0);
        const bow = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 6, 12, Math.PI), woodMat);
        bow.rotation.x = Math.PI / 2;
        bow.position.set(0, -0.1, 0.2);
        armR.add(bow);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = bow;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.35, 6), teamMat);
        legL.position.set(-0.12, 0.18, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.35, 6), teamMat);
        legR.position.set(0.12, 0.18, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'wizard': {
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 8), teamMat);
        body.position.y = 0.55;
        root.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), skinMat);
        head.position.y = 1.1;
        root.add(head);
        parts.head = head;

        const hood = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.4, 6), teamMat);
        hood.position.set(0, 1.3, -0.05);
        root.add(hood);

        const armR = new THREE.Group();
        armR.position.set(0.4, 0.75, 0);
        const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6), woodMat);
        staff.position.set(0, 0.1, 0.2);
        armR.add(staff);

        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x00ffff,
          emissiveIntensity: 1.8
        }));
        orb.position.set(0, 0.65, 0.2);
        armR.add(orb);

        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = staff;
        break;
      }

      case 'dragon': {
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), new THREE.MeshStandardMaterial({ color: 0x27ae60 }));
        body.position.y = 1.8;
        body.scale.set(1, 0.8, 1.2);
        root.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshStandardMaterial({ color: 0x2ecc71 }));
        head.position.set(0, 2.1, 0.4);
        root.add(head);
        parts.head = head;

        const snout = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0x27ae60 }));
        snout.rotation.x = Math.PI / 2;
        snout.position.set(0, 2.05, 0.7);
        root.add(snout);

        const wingsGroup = new THREE.Group();
        wingsGroup.position.set(0, 1.9, 0);

        const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.4), teamMat);
        wingL.position.set(-0.6, 0, 0);
        wingL.rotation.z = -0.2;
        wingsGroup.add(wingL);

        const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.4), teamMat);
        wingR.position.set(0.6, 0, 0);
        wingR.rotation.z = 0.2;
        wingsGroup.add(wingR);

        root.add(wingsGroup);
        parts.wings = wingsGroup;
        break;
      }

      case 'goblins': {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.4, 6), teamMat);
        body.position.y = 0.4;
        root.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), getTeamMaterial('goblin-skin', isBlue));
        head.position.y = 0.7;
        root.add(head);
        parts.head = head;

        [-0.25, 0.25].forEach(x => {
          const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), getTeamMaterial('goblin-skin', isBlue));
          ear.position.set(x, 0.75, 0);
          ear.rotation.z = x > 0 ? -Math.PI / 3 : Math.PI / 3;
          root.add(ear);
        });

        const armR = new THREE.Group();
        armR.position.set(0.25, 0.45, 0);
        const dagger = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.08), metalMat);
        dagger.position.set(0, 0, 0.2);
        dagger.rotation.x = Math.PI / 3;
        armR.add(dagger);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = dagger;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.25, 6), getTeamMaterial('goblin-skin', isBlue));
        legL.position.set(-0.1, 0.12, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.25, 6), getTeamMaterial('goblin-skin', isBlue));
        legR.position.set(0.1, 0.12, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'skeletons': {
        const boneMat = getTeamMaterial('bone', isBlue);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.3, 6), boneMat);
        body.position.y = 0.35;
        root.add(body);

        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), boneMat);
        skull.position.y = 0.6;
        root.add(skull);
        parts.head = skull;

        const armR = new THREE.Group();
        armR.position.set(0.2, 0.38, 0);
        const sword = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.06), metalMat);
        sword.rotation.x = Math.PI / 3;
        sword.position.set(0, 0, 0.15);
        armR.add(sword);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = sword;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2), boneMat);
        legL.position.set(-0.08, 0.1, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2), boneMat);
        legR.position.set(0.08, 0.1, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'inferno': {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 1.8, 8), getTeamMaterial('stone', isBlue));
        base.position.y = 0.9;
        root.add(base);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.15, 6, 12), teamMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 1.6;
        root.add(ring);

        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), new THREE.MeshStandardMaterial({
          color: 0xff4400,
          emissive: 0xff3300,
          emissiveIntensity: 2.0
        }));
        crystal.position.y = 2.2;
        root.add(crystal);
        parts.head = crystal;
        break;
      }

      // --- 原創角色 3D 精緻模型 ---

      case 'cyber_ninja': {
        // 賽博幻影忍者 - 霓虹等離子雙刀疾風武者
        const cyberMat = new THREE.MeshStandardMaterial({ color: 0x1a2238, roughness: 0.2, metalness: 0.8 });
        const neonCyanMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2.2 });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.6, 6), cyberMat);
        body.position.y = 0.6;
        root.add(body);
        parts.body = body;

        const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.45), neonCyanMat);
        scarf.position.set(0, 0.92, -0.2);
        scarf.rotation.x = 0.3;
        root.add(scarf);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), cyberMat);
        head.position.y = 1.05;
        root.add(head);
        parts.head = head;

        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.12), neonCyanMat);
        visor.position.set(0, 1.06, 0.16);
        root.add(visor);

        // 雙持等離子光刃 (Dual Cyber Katanas)
        const armR = new THREE.Group();
        armR.position.set(0.35, 0.75, 0);
        const katanaR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.85, 0.12), neonCyanMat);
        katanaR.position.set(0, 0.1, 0.25);
        katanaR.rotation.x = Math.PI / 3;
        armR.add(katanaR);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = katanaR;

        const armL = new THREE.Group();
        armL.position.set(-0.35, 0.75, 0);
        const katanaL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.85, 0.12), neonCyanMat);
        katanaL.position.set(0, 0.1, 0.25);
        katanaL.rotation.x = Math.PI / 3;
        armL.add(katanaL);
        root.add(armL);
        parts.leftArm = armL;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.38, 6), cyberMat);
        legL.position.set(-0.12, 0.19, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.38, 6), cyberMat);
        legR.position.set(0.12, 0.19, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'thunder_valkyrie': {
        // 雷霆女武神 - 帶翼金盔與 360° 雷霆巨斧
        const armorMat = new THREE.MeshStandardMaterial({ color: 0x223355, metalness: 0.7, roughness: 0.3 });
        const thunderMat = new THREE.MeshStandardMaterial({ color: 0xffea00, emissive: 0xffcc00, emissiveIntensity: 2.0 });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.7, 8), teamMat);
        body.position.y = 0.7;
        root.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), skinMat);
        head.position.y = 1.2;
        root.add(head);
        parts.head = head;

        const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.18, 8), goldMat);
        helmet.position.y = 1.32;
        root.add(helmet);

        // 雙側金翼 (Golden Helmet Wings)
        [-0.32, 0.32].forEach(x => {
          const wing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.22), goldMat);
          wing.position.set(x, 1.42, -0.05);
          wing.rotation.z = x > 0 ? -0.4 : 0.4;
          root.add(wing);
        });

        // 雙手雷霆巨斧
        const armR = new THREE.Group();
        armR.position.set(0.42, 0.85, 0);
        const axeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2), woodMat);
        axeHandle.rotation.x = Math.PI / 4;
        axeHandle.position.set(0, 0, 0.35);

        const axeBlade1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.35), thunderMat);
        axeBlade1.position.set(0, 0.45, 0.15);
        axeHandle.add(axeBlade1);

        const axeBlade2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.35), thunderMat);
        axeBlade2.position.set(0, 0.45, -0.15);
        axeHandle.add(axeBlade2);

        armR.add(axeHandle);
        root.add(armR);
        parts.rightArm = armR;
        parts.weapon = axeHandle;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.42), armorMat);
        legL.position.set(-0.16, 0.21, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.42), armorMat);
        legR.position.set(0.16, 0.21, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'mecha_golem': {
        // 泰坦機甲魔像 - 鋼鐵重型坦克與熔火核心
        const heavySteel = new THREE.MeshStandardMaterial({ color: 0x333b47, metalness: 0.85, roughness: 0.2 });
        const coreMat = new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff3300, emissiveIntensity: 2.5 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.9), heavySteel);
        body.position.y = 1.3;
        root.add(body);
        parts.body = body;

        const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.15, 8), coreMat);
        chestCore.rotation.x = Math.PI / 2;
        chestCore.position.set(0, 1.4, 0.46);
        root.add(chestCore);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.5), heavySteel);
        head.position.y = 2.05;
        root.add(head);
        parts.head = head;

        const eyeVisor = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.1), coreMat);
        eyeVisor.position.set(0, 2.05, 0.26);
        root.add(eyeVisor);

        // 重型液壓排氣管
        [-0.4, 0.4].forEach(x => {
          const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7), heavySteel);
          pipe.position.set(x, 2.1, -0.35);
          pipe.rotation.x = -0.3;
          root.add(pipe);
        });

        // 巨型鐵拳臂膀
        const armL = new THREE.Group();
        armL.position.set(-0.85, 1.4, 0);
        const fistL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.9, 0.45), heavySteel);
        fistL.position.y = -0.35;
        armL.add(fistL);
        root.add(armL);
        parts.leftArm = armL;

        const armR = new THREE.Group();
        armR.position.set(0.85, 1.4, 0);
        const fistR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.9, 0.45), heavySteel);
        fistR.position.y = -0.35;
        armR.add(fistR);
        root.add(armR);
        parts.rightArm = armR;

        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.75, 0.45), heavySteel);
        legL.position.set(-0.35, 0.38, 0);
        root.add(legL);
        parts.leftLeg = legL;

        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.75, 0.45), heavySteel);
        legR.position.set(0.35, 0.38, 0);
        root.add(legR);
        parts.rightLeg = legR;
        break;
      }

      case 'phoenix_mage': {
        // 不死鳥炎術師 - 懸浮法皇與烈焰羽翼
        const robeMat = new THREE.MeshStandardMaterial({ color: 0x8a1505, roughness: 0.4 });
        const flameMat = new THREE.MeshStandardMaterial({ color: 0xff7700, emissive: 0xff3300, emissiveIntensity: 2.2 });

        const body = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 8), robeMat);
        body.position.y = 1.7; // Hovering high in air
        root.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), skinMat);
        head.position.set(0, 2.25, 0);
        root.add(head);
        parts.head = head;

        const crown = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.35, 4), goldMat);
        crown.position.set(0, 2.45, 0);
        root.add(crown);

        // 烈焰金羽翅膀 (Hovering Flaming Wings)
        const wingsGroup = new THREE.Group();
        wingsGroup.position.set(0, 1.85, -0.15);

        const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.4), flameMat);
        wingL.position.set(-0.65, 0, 0);
        wingL.rotation.z = -0.25;
        wingsGroup.add(wingL);

        const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.4), flameMat);
        wingR.position.set(0.65, 0, 0);
        wingR.rotation.z = 0.25;
        wingsGroup.add(wingR);

        root.add(wingsGroup);
        parts.wings = wingsGroup;

        // 鳳凰烈火權杖 (Phoenix Fire Staff)
        const armR = new THREE.Group();
        armR.position.set(0.4, 1.8, 0);
        const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), goldMat);
        staff.position.set(0, 0.1, 0.2);
        armR.add(staff);

        const fireOrb = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18), flameMat);
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
  // 3D CHEST MODEL
  // -------------------------------------------------------------

  static createChestModel(chestType = 'gold') {
    const group = new THREE.Group();
    group.name = 'Chest3D';

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffbe24, metalness: 0.85, roughness: 0.25 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a381e, roughness: 0.8 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xccd6e0, metalness: 0.7, roughness: 0.3 });

    let accentMat = goldMat;
    if (chestType === 'silver') accentMat = steelMat;
    if (chestType === 'magical') accentMat = new THREE.MeshStandardMaterial({ color: 0xc42eff, emissive: 0x8800cc, metalness: 0.8 });
    if (chestType === 'legendary') accentMat = new THREE.MeshStandardMaterial({ color: 0x00ffc4, emissive: 0x00aa88, metalness: 0.9 });

    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 1.4), woodMat);
    baseMesh.position.y = 0.5;
    group.add(baseMesh);

    const trimBase = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.2, 1.45), accentMat);
    trimBase.position.y = 0.95;
    group.add(trimBase);

    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.15), goldMat);
    lock.position.set(0, 0.9, 0.75);
    group.add(lock);

    const lidHinge = new THREE.Group();
    lidHinge.position.set(0, 1.0, -0.7);

    const lidMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.0, 12, 1, false, 0, Math.PI), woodMat);
    lidMesh.rotation.z = Math.PI / 2;
    lidMesh.rotation.y = Math.PI / 2;
    lidMesh.position.set(0, 0, 0.7);
    lidHinge.add(lidMesh);

    const lidTrim = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.15, 0.2), accentMat);
    lidTrim.position.set(0, 0.1, 0.7);
    lidHinge.add(lidTrim);

    group.add(lidHinge);
    group.userData.lidHinge = lidHinge;

    return group;
  }
}
