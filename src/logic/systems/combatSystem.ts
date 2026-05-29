import type { Hero, Monster } from "../../types/game";

export interface CombatResult {
  monsterHp: number;
  heroHp: number;
  heroHit: { damage: number; isCrit: boolean } | null;
  monsterHit: { damage: number } | null;
}

export const processCombat = (
  hero: Hero,
  monster: Monster,
  dt: number,
  multipliers: { speed: number; damage: number },
  timerRef: { heroAttack: number; monsterAttack: number; totalDamageDealtInSec: number }
): CombatResult => {
  let monsterHp = monster.currentHp;
  let heroHp = hero.currentHp;
  let heroHit = null;
  let monsterHit = null;

  // 1. Hero Attacks Monster
  timerRef.heroAttack += dt * multipliers.speed;
  const attackDurationLimit = hero.attackSpeed;

  if (timerRef.heroAttack >= attackDurationLimit) {
    timerRef.heroAttack -= attackDurationLimit;
    const isCrit = Math.random() < hero.critChance;
    let damage = Math.round(hero.attack * multipliers.damage);
    if (isCrit) {
      damage = Math.round(damage * hero.critDamage);
    }
    monsterHp = Math.max(0, monsterHp - damage);
    timerRef.totalDamageDealtInSec += damage;
    heroHit = { damage, isCrit };
  }

  // 2. Monster Attacks Hero
  if (monsterHp > 0) {
    timerRef.monsterAttack += dt;
    if (timerRef.monsterAttack >= 1.5) {
      timerRef.monsterAttack -= 1.5;
      const damage = Math.max(1, monster.attack - hero.defense);
      heroHp = Math.max(0, heroHp - damage);
      monsterHit = { damage };
    }
  }

  return { monsterHp, heroHp, heroHit, monsterHit };
};
