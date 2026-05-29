import type { Skill, Upgrade, Artifact, CombatEvent, Monster } from "./game";

// Re-export common types for convenience
export type { Skill, Upgrade, Artifact, CombatEvent, Monster };

// --- Base Component Types ---

export interface HealthComponent {
  currentHp: number;
  maxHp: number;
  regen: number;
}

export interface CombatComponent {
  attack: number;
  defense: number;
  attackSpeed: number;
  critChance: number;
  critDamage: number;
}

export interface SkillsComponent {
  skills: Skill[];
}

export interface ProgressionComponent {
  level: number;
  exp: number;
  nextLevelExp: number;
}

export interface EquipmentComponent {
  weaponLvl: number;
  armorLvl: number;
  bootsLvl: number;
}

export interface RewardComponent {
  goldReward: number;
  essenceReward: number;
}

// --- Entity Definitions (Compositions of components) ---

export interface HeroEntity {
  id: "hero";
  health: HealthComponent;
  combat: CombatComponent;
  skills: SkillsComponent;
  progression: ProgressionComponent;
  equipment: EquipmentComponent;
}

export interface MonsterEntity {
  id: string;
  type: Monster["type"];
  name: string;
  isBoss: boolean;
  level: number;
  health: HealthComponent;
  combat: CombatComponent;
  reward: RewardComponent;
}

// --- ECS State ---

export interface ECSState {
  hero: HeroEntity;
  monster: MonsterEntity | null;
  // Global resources
  gold: number;
  essence: number;
  shards: number;
  prestigeCount: number;
  // World state
  currentFloor: number;
  monstersDefeatedOnFloor: number;
  monstersRequiredForFloor: number;
  isBossFloor: boolean;
  autoFightBoss: boolean;
  // UI & Events
  activeTab: string;
  combatEvents: CombatEvent[];
  upgrades: Upgrade[];
  artifacts: Artifact[];
  dps: number;
}
