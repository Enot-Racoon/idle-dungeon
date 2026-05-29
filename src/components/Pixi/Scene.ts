import * as PIXI from "pixi.js";
import {
  Mesh3D,
  Container3D,
  StandardMaterial,
  Color,
  Light,
  LightType,
  LightingEnvironment,
} from "pixi3d/pixi7";

export interface SceneObjects {
  heroContainer: Container3D;
  heroBody: Mesh3D;
  heroSword: Mesh3D;
  heroShield: Mesh3D;
  monsterContainer: Container3D;
  monsterBody: Mesh3D;
  floor: Mesh3D;
  directionalLight: Light;
  torchL: Light;
  torchR: Light;
}

export const initScene = (app: PIXI.Application): SceneObjects => {
  LightingEnvironment.main.lights = [];

  // 1. Lights
  const directionalLight = new Light();
  directionalLight.type = LightType.directional;
  directionalLight.color = Color.fromHex("#2b3d63");
  directionalLight.intensity = 1.8;
  directionalLight.position.set(-3, 6, 3);

  const torchL = new Light();
  torchL.type = LightType.point;
  torchL.color = Color.fromHex("#ff6a00");
  torchL.intensity = 3.5;
  torchL.range = 7;
  torchL.position.set(-3.2, 1.8, -2.5);

  const torchR = new Light();
  torchR.type = LightType.point;
  torchR.color = Color.fromHex("#ff6a00");
  torchR.intensity = 3.5;
  torchR.range = 7;
  torchR.position.set(3.2, 1.8, -2.5);

  LightingEnvironment.main.lights.push(directionalLight, torchL, torchR);

  // 2. Environment
  const floor = Mesh3D.createCube();
  app.stage.addChild(floor);
  floor.scale.set(12, 0.2, 12);
  floor.position.set(0, -0.6, 0);
  const floorMat = floor.material as StandardMaterial;
  if (floorMat) {
    floorMat.baseColor = Color.fromHex("#13131d");
    floorMat.roughness = 0.8;
    floorMat.metallic = 0.2;
  }

  const backWall = Mesh3D.createCube();
  app.stage.addChild(backWall);
  backWall.scale.set(12, 4, 0.5);
  backWall.position.set(0, 1.5, -4);
  const wallMat = backWall.material as StandardMaterial;
  if (wallMat) {
    wallMat.baseColor = Color.fromHex("#0c0c14");
    wallMat.roughness = 0.95;
  }

  const pillarL = Mesh3D.createCube();
  app.stage.addChild(pillarL);
  pillarL.scale.set(0.6, 4, 0.6);
  pillarL.position.set(-3.5, 1.4, -3);
  const pillarLMat = pillarL.material as StandardMaterial;
  if (pillarLMat) {
    pillarLMat.baseColor = Color.fromHex("#181827");
    pillarLMat.roughness = 0.7;
  }

  const pillarR = Mesh3D.createCube();
  app.stage.addChild(pillarR);
  pillarR.scale.set(0.6, 4, 0.6);
  pillarR.position.set(3.5, 1.4, -3);
  const pillarRMat = pillarR.material as StandardMaterial;
  if (pillarRMat) {
    pillarRMat.baseColor = Color.fromHex("#181827");
    pillarRMat.roughness = 0.7;
  }

  // 3. Hero
  const heroContainer = new Container3D();
  app.stage.addChild(heroContainer);
  heroContainer.position.set(-2, 0, 0);

  const heroBody = Mesh3D.createSphere();
  heroContainer.addChild(heroBody);
  heroBody.scale.set(0.65, 0.65, 0.65);
  const bodyMat = heroBody.material as StandardMaterial;
  if (bodyMat) {
    bodyMat.baseColor = Color.fromHex("#3b82f6");
    bodyMat.roughness = 0.3;
    bodyMat.metallic = 0.7;
  }

  const heroShield = Mesh3D.createCube();
  heroContainer.addChild(heroShield);
  heroShield.scale.set(0.12, 0.8, 0.45);
  heroShield.position.set(-0.7, 0, 0);
  const shieldMat = heroShield.material as StandardMaterial;
  if (shieldMat) {
    shieldMat.baseColor = Color.fromHex("#4b5563");
    shieldMat.roughness = 0.4;
    shieldMat.metallic = 0.85;
  }

  const swordSwingContainer = new Container3D();
  heroContainer.addChild(swordSwingContainer);
  swordSwingContainer.position.set(0.7, 0, 0);

  const heroSword = Mesh3D.createCube();
  swordSwingContainer.addChild(heroSword);
  heroSword.scale.set(0.08, 0.95, 0.08);
  heroSword.position.set(0, 0.45, 0);
  const swordMat = heroSword.material as StandardMaterial;
  if (swordMat) {
    swordMat.baseColor = Color.fromHex("#fbbf24");
    swordMat.roughness = 0.1;
    swordMat.metallic = 0.9;
  }

  // 4. Monster
  const monsterContainer = new Container3D();
  app.stage.addChild(monsterContainer);
  monsterContainer.position.set(2, 0, 0);

  const monsterBody = Mesh3D.createCube();
  monsterContainer.addChild(monsterBody);
  monsterBody.scale.set(0.6, 0.6, 0.6);
  const mbMat = monsterBody.material as StandardMaterial;
  if (mbMat) {
    mbMat.baseColor = Color.fromHex("#10b981");
  }

  return {
    heroContainer,
    heroBody,
    heroSword,
    heroShield,
    monsterContainer,
    monsterBody,
    floor,
    directionalLight,
    torchL,
    torchR,
  };
};
