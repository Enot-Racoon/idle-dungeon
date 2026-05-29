import type { HealthComponent, CombatComponent, MonsterEntity } from "../../types/ecs";

export interface CombatResult {
  monsterHp: number;
  heroHp: number;
  heroHit: { damage: number; isCrit: boolean } | null;
  monsterHit: { damage: number } | null;
}

export const processCombat = (
  hero: { health: HealthComponent; combat: CombatComponent },
  monster: MonsterEntity,
  dt: number,
  multipliers: { speed: number; damage: number },
  timerRef: { heroAttack: number; monsterAttack: number; totalDamageDealtInSec: number }
): CombatResult => {
  let monsterHp = monster.health.currentHp;
  let heroHp = hero.health.currentHp;
  let heroHit = null;
  let monsterHit = null;

  // 1. Hero Attacks Monster
  timerRef.heroAttack += dt * multipliers.speed;
  const heroAttackInterval = hero.combat.attackSpeed;

  if (timerRef.heroAttack >= heroAttackInterval) {
    timerRef.heroAttack -= heroAttackInterval;
    const isCrit = Math.random() < hero.combat.critChance;
    let damage = Math.round(hero.combat.attack * multipliers.damage);
    if (isCrit) {
      damage = Math.round(damage * hero.combat.critDamage);
    }
    monsterHp = Math.max(0, monsterHp - damage);
    timerRef.totalDamageDealtInSec += damage;
    heroHit = { damage, isCrit };
  }

  // 2. Monster Attacks Hero
  if (monsterHp > 0) {
    timerRef.monsterAttack += dt;
    const monsterAttackInterval = monster.combat.attackSpeed;
    if (timerRef.monsterAttack >= monsterAttackInterval) {
      timerRef.monsterAttack -= monsterAttackInterval;
      const damage = Math.max(1, monster.combat.attack - hero.combat.defense);
      heroHp = Math.max(0, heroHp - damage);
      monsterHit = { damage };
    }
  }

  return { monsterHp, heroHp, heroHit, monsterHit };
};
