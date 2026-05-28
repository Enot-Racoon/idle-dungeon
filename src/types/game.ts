export interface Hero {
  level: number;
  exp: number;
  nextLevelExp: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  attackSpeed: number; // Attack interval in seconds (lower is faster)
  critChance: number;  // Chance from 0 to 1
  critDamage: number;  // Multiplier (e.g. 1.5)
  regen: number;       // HP restored per second
  weaponLvl: number;
  armorLvl: number;
  bootsLvl: number;
}

export interface Monster {
  id: string;
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  goldReward: number;
  essenceReward: number;
  isBoss: boolean;
  type: 'goblin' | 'skeleton' | 'orc' | 'demon' | 'dragon';
}

export type UpgradeType =
  | 'attack'
  | 'hp'
  | 'regen'
  | 'crit'
  | 'speed'
  | 'weapon'
  | 'armor'
  | 'boots';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  costMultiplier: number;
  currentLevel: number;
  baseValue: number;
  scaling: number;
  type: UpgradeType;
}

export type SkillEffectType = 'damage' | 'heal' | 'speed' | 'goldMultiplier';

export interface Skill {
  id: string;
  name: string;
  description: string;
  cooldown: number; // total cooldown in seconds
  currentCooldown: number; // remaining cooldown in seconds
  duration: number; // total duration of active state in seconds
  activeDuration: number; // remaining active duration in seconds
  cost: number; // essence or gold cost to activate
  level: number;
  costMultiplier: number;
  effectType: SkillEffectType;
  effectValue: number; // e.g. heal amount or speed multiplier
  unlockedAt: number; // Hero level required
}

export interface Artifact {
  id: string;
  name: string;
  description: string;
  level: number;
  cost: number;
  costMultiplier: number;
  effectType: 'dmg_mult' | 'gold_mult' | 'exp_mult' | 'boss_dmg';
  effectValue: number; // percent increase per level (e.g. 0.05 for 5%)
}

export interface CombatEvent {
  id: string;
  type: 'hero_attack' | 'hero_crit' | 'monster_attack' | 'hero_heal' | 'monster_dead' | 'level_up' | 'boss_spawn';
  value: string | number;
  timestamp: number;
}

export interface GameState {
  hero: Hero;
  monster: Monster | null;
  gold: number;
  essence: number;
  shards: number; // prestige currency
  prestigeCount: number;
  currentFloor: number;
  monstersDefeatedOnFloor: number;
  monstersRequiredForFloor: number;
  isBossFloor: boolean;
  upgrades: Upgrade[];
  skills: Skill[];
  artifacts: Artifact[];
  activeTab: string;
  combatEvents: CombatEvent[];
  dps: number;
  autoFightBoss: boolean;
}
