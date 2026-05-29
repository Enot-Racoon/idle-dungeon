import type { Container3D, Mesh3D } from "pixi3d/pixi7";

export interface AnimationState {
  heroAttackTime: number;
  heroHitTime: number;
  monsterAttackTime: number;
  monsterHitTime: number;
  monsterDeathTime: number;
  monsterSpawnTime: number;
}

export const updateAnimations = (
  dt: number,
  animState: AnimationState,
  scene: {
    heroContainer: Container3D;
    heroBody: Mesh3D;
    heroSword: Mesh3D;
    monsterContainer: Container3D;
    monsterBody: Mesh3D;
  },
  timeAccumulator: number
) => {
  const { heroContainer: hc, heroSword: hs, heroBody: hb, monsterContainer: mc, monsterBody: mb } = scene;

  // 1. Hero Attack
  if (animState.heroAttackTime > 0) {
    animState.heroAttackTime -= dt;
    const progress = 1 - animState.heroAttackTime / 0.4;
    const xOffset = Math.sin(progress * Math.PI) * 1.5;
    const swordRotation = progress * Math.PI * 1.6;
    hc.position.x = -2 + xOffset;
    if (hs.parent) {
      (hs.parent as Container3D).rotationQuaternion.setEulerAngles(-swordRotation * 25, 0, 0);
    }
    hb.rotationQuaternion.setEulerAngles(0, 0, Math.sin(progress * Math.PI) * 10);
  } else {
    hc.position.x = -2;
    if (hs.parent) {
      (hs.parent as Container3D).rotationQuaternion.setEulerAngles(0, 0, 0);
    }
    hb.rotationQuaternion.setEulerAngles(0, 0, 0);
  }

  // 2. Hero Hit
  if (animState.heroHitTime > 0) {
    animState.heroHitTime -= dt;
    const progress = 1 - animState.heroHitTime / 0.3;
    const shiftX = Math.sin(progress * Math.PI) * -0.5;
    hc.position.x = -2 + shiftX;
    hb.rotationQuaternion.setEulerAngles(0, 0, Math.sin(progress * Math.PI) * 15);
  }

  // 3. Monster Attack
  if (animState.monsterAttackTime > 0) {
    animState.monsterAttackTime -= dt;
    const progress = 1 - animState.monsterAttackTime / 0.4;
    const xOffset = Math.sin(progress * Math.PI) * -1.5;
    const yOffset = Math.sin(progress * Math.PI) * 0.6;
    mc.position.x = 2 + xOffset;
    mc.position.y = yOffset;
    mb.rotationQuaternion.setEulerAngles(0, 0, -Math.sin(progress * Math.PI) * 20);
  } else {
    if (animState.monsterDeathTime <= 0 && animState.monsterSpawnTime <= 0) {
      mc.position.x = 2;
      mc.position.y = 0;
      mb.rotationQuaternion.setEulerAngles(0, 0, 0);
    }
  }

  // 4. Monster Spawn
  if (animState.monsterSpawnTime > 0) {
    animState.monsterSpawnTime -= dt;
    const progress = 1 - animState.monsterSpawnTime / 0.6;
    mc.position.y = -3 + progress * 3;
    mc.position.x = 2;
    mb.rotationQuaternion.setEulerAngles(0, (1 - progress) * 360, 0);
  }

  // 5. Idle Floating
  if (animState.heroAttackTime <= 0 && animState.heroHitTime <= 0) {
    hc.position.y = Math.sin(timeAccumulator * 3.5) * 0.05;
  }
  if (animState.monsterAttackTime <= 0 && animState.monsterSpawnTime <= 0) {
    mc.position.y = Math.cos(timeAccumulator * 3) * 0.05;
  }
};
