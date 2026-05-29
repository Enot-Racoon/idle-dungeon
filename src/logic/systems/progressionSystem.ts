import type { HeroEntity, MonsterEntity, CombatEvent } from "../../types/ecs";
import { generateMonsterEntity } from "../monsterGenerator";

export interface ProgressionResult {
  nextMonster: MonsterEntity | null;
  nextFloor: number;
  nextMonstersDefeated: number;
  isBoss: boolean;
  goldGained: number;
  essenceGained: number;
  expGained: number;
  logs: Omit<CombatEvent, "id" | "timestamp">[];
  heroLevel: number;
  heroExp: number;
  heroNextExp: number;
  heroMaxHp: number;
  heroAttack: number;
  heroDefense: number;
  heroRegen: number;
}

export const handleProgression = (
  hero: HeroEntity,
  monster: MonsterEntity,
  multipliers: { gold: number; exp: number; prestige: number },
  world: { 
    currentFloor: number; 
    monstersDefeatedOnFloor: number; 
    monstersRequiredForFloor: number; 
    isBossFloor: boolean; 
    autoFightBoss: boolean;
  }
): ProgressionResult => {
  const result: ProgressionResult = {
    nextMonster: null,
    nextFloor: world.currentFloor,
    nextMonstersDefeated: world.monstersDefeatedOnFloor,
    isBoss: world.isBossFloor,
    goldGained: 0,
    essenceGained: 0,
    expGained: 0,
    logs: [],
    heroLevel: hero.progression.level,
    heroExp: hero.progression.exp,
    heroNextExp: hero.progression.nextLevelExp,
    heroMaxHp: hero.health.maxHp,
    heroAttack: hero.combat.attack,
    heroDefense: hero.combat.defense,
    heroRegen: hero.health.regen,
  };

  // 1. Monster Defeated
  if (monster.health.currentHp <= 0) {
    result.goldGained = Math.round(monster.reward.goldReward * multipliers.gold * multipliers.prestige);
    result.essenceGained = monster.reward.essenceReward;
    result.expGained = Math.round(monster.level * 10 * multipliers.exp);

    if (world.isBossFloor) {
      result.nextFloor = world.currentFloor + 1;
      result.nextMonstersDefeated = 0;
      result.isBoss = false;
      result.logs.push({
        type: "level_up",
        value: `Этаж ${world.currentFloor} пройден! Спуск на этаж ${result.nextFloor}.`,
      });
    } else {
      result.nextMonstersDefeated += 1;
      if (result.nextMonstersDefeated >= world.monstersRequiredForFloor) {
        if (world.autoFightBoss) {
          result.isBoss = true;
          result.logs.push({
            type: "boss_spawn",
            value: `⚠️ Появился Босс: ${monster.name}!`,
          });
        } else {
          result.nextMonstersDefeated = 0;
        }
      }
    }
    result.nextMonster = generateMonsterEntity(result.nextFloor, result.isBoss);
  }

  // 2. Hero Death
  if (hero.health.currentHp <= 0 && monster.health.currentHp > 0) {
    if (world.isBossFloor || world.currentFloor > 1) {
      result.nextFloor = Math.max(1, world.currentFloor - 1);
      result.isBoss = false;
      result.nextMonstersDefeated = 0;
      result.logs.push({
        type: "monster_dead",
        value: `💀 Герой погиб! Отступление на этаж ${result.nextFloor}.`,
      });
    } else {
      result.logs.push({
        type: "monster_dead",
        value: `💀 Герой погиб! Восстановление сил.`,
      });
    }
    result.nextMonster = generateMonsterEntity(result.nextFloor, result.isBoss);
  }

  // 3. Level Up
  if (monster.health.currentHp <= 0 && result.expGained > 0) {
    result.heroExp += result.expGained;
    if (result.heroExp >= result.heroNextExp) {
      result.heroExp -= result.heroNextExp;
      result.heroLevel += 1;
      result.heroNextExp = Math.round(100 * Math.pow(1.22, result.heroLevel - 1));
      result.heroMaxHp = Math.round(result.heroMaxHp * 1.08) + 10;
      result.heroAttack = Math.round(result.heroAttack * 1.08) + 2;
      result.heroDefense += 1;
      result.heroRegen = Number((result.heroRegen + 0.2).toFixed(1));
      result.logs.push({
        type: "level_up",
        value: `✨ Уровень повышен! Теперь вы на ${result.heroLevel} уровне.`,
      });
    }
  }

  return result;
};
