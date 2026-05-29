import type { Monster } from "../types/game";
import { MONSTER_NAMES } from "../config/gameConfig";

export const generateMonster = (floor: number, isBoss: boolean): Monster => {
  let type: Monster["type"] = "goblin";
  if (floor >= 50) type = "dragon";
  else if (floor >= 30) type = "demon";
  else if (floor >= 15) type = "orc";
  else if (floor >= 6) type = "skeleton";

  const names = MONSTER_NAMES[type];
  const nameIndex = Math.min(
    isBoss ? names.length - 1 : Math.floor(Math.random() * (names.length - 1)),
    names.length - 1
  );
  const baseName = names[nameIndex];
  const name = isBoss ? `☠️ BOSS: ${baseName} ☠️` : baseName;

  const multiplier = isBoss ? 5 : 1;
  const maxHp = Math.round(25 * Math.pow(1.15, floor - 1) * multiplier);
  const attack = Math.round(4 * Math.pow(1.12, floor - 1) * (isBoss ? 1.5 : 1));
  const goldReward = Math.round(10 * Math.pow(1.18, floor - 1) * multiplier);
  const essenceReward = Math.round(2 * Math.pow(1.12, floor - 1) * (isBoss ? 4 : 1));

  return {
    id: `monster_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    level: floor,
    currentHp: maxHp,
    maxHp,
    attack,
    goldReward,
    essenceReward,
    isBoss,
    type,
  };
};
