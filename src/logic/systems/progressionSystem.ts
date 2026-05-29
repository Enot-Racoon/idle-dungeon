import type { Hero, Monster, CombatEvent } from "../../types/game";
import { generateMonster } from "../monsterGenerator";

export interface ProgressionResult {
  nextMonster: Monster | null;
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
  hero: Hero,
  monster: Monster,
  multipliers: { gold: number; exp: number; prestige: number },
  state: { 
    currentFloor: number; 
    monstersDefeatedOnFloor: number; 
    monstersRequiredForFloor: number; 
    isBossFloor: boolean; 
    autoFightBoss: boolean;
  }
): ProgressionResult => {
  const result: ProgressionResult = {
    nextMonster: null,
    nextFloor: state.currentFloor,
    nextMonstersDefeated: state.monstersDefeatedOnFloor,
    isBoss: state.isBossFloor,
    goldGained: 0,
    essenceGained: 0,
    expGained: 0,
    logs: [],
    heroLevel: hero.level,
    heroExp: hero.exp,
    heroNextExp: hero.nextLevelExp,
    heroMaxHp: hero.maxHp,
    heroAttack: hero.attack,
    heroDefense: hero.defense,
    heroRegen: hero.regen,
  };

  // 1. Monster Defeated
  if (monster.currentHp <= 0) {
    result.goldGained = Math.round(monster.goldReward * multipliers.gold * multipliers.prestige);
    result.essenceGained = monster.essenceReward;
    result.expGained = Math.round(monster.level * 10 * multipliers.exp);

    if (state.isBossFloor) {
      result.nextFloor = state.currentFloor + 1;
      result.nextMonstersDefeated = 0;
      result.isBoss = false;
      result.logs.push({
        type: "level_up",
        value: `Этаж ${state.currentFloor} пройден! Спуск на этаж ${result.nextFloor}.`,
      });
    } else {
      result.nextMonstersDefeated += 1;
      if (result.nextMonstersDefeated >= state.monstersRequiredForFloor) {
        if (state.autoFightBoss) {
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
    result.nextMonster = generateMonster(result.nextFloor, result.isBoss);
  }

  // 2. Hero Death
  if (hero.currentHp <= 0 && monster.currentHp > 0) {
    if (state.isBossFloor || state.currentFloor > 1) {
      result.nextFloor = Math.max(1, state.currentFloor - 1);
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
    result.nextMonster = generateMonster(result.nextFloor, result.isBoss);
  }

  // 3. Level Up
  if (monster.currentHp <= 0 && result.expGained > 0) {
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
