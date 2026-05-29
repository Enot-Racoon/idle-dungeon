import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type { CombatEvent, ECSState, HeroEntity, MonsterEntity } from "../types/ecs";
import { 
  INITIAL_HERO, 
  INITIAL_UPGRADES, 
  INITIAL_SKILLS, 
  INITIAL_ARTIFACTS 
} from "../config/gameConfig";
import { generateMonsterEntity } from "../logic/monsterGenerator";
import { 
  getSpeedMultiplier, 
  getGoldMultiplier, 
  getDamageMultiplier, 
  getExpMultiplier, 
  getPrestigeMultiplier 
} from "../logic/calculators";
import { updateSkillsCooldowns, updateHeroRegen } from "../logic/systems/updateSystems";
import { processCombat } from "../logic/systems/combatSystem";
import { handleProgression } from "../logic/systems/progressionSystem";


// --- Mappers for ECS <-> Legacy Bridge ---

const mapInitialHero = (): HeroEntity => ({
  id: "hero",
  health: { currentHp: INITIAL_HERO.currentHp, maxHp: INITIAL_HERO.maxHp, regen: INITIAL_HERO.regen },
  combat: { 
    attack: INITIAL_HERO.attack, 
    defense: INITIAL_HERO.defense, 
    attackSpeed: INITIAL_HERO.attackSpeed,
    critChance: INITIAL_HERO.critChance,
    critDamage: INITIAL_HERO.critDamage
  },
  skills: { skills: INITIAL_SKILLS.map(s => ({ ...s })) },
  progression: { level: INITIAL_HERO.level, exp: INITIAL_HERO.exp, nextLevelExp: INITIAL_HERO.nextLevelExp },
  equipment: { weaponLvl: INITIAL_HERO.weaponLvl, armorLvl: INITIAL_HERO.armorLvl, bootsLvl: INITIAL_HERO.bootsLvl }
});

// Non-reactive timers for engine performance
const timers = {
  heroAttack: 0,
  monsterAttack: 0,
  regen: 0,
  totalDamageDealtInSec: 0,
  dps: 0,
};

interface GameActions {
  tick: (dt: number) => void;
  castSkill: (skillId: string) => void;
  buyUpgrade: (upgradeId: string) => void;
  buyArtifact: (artifactId: string) => void;
  setActiveTab: (tab: string) => void;
  setAutoFightBoss: (val: boolean) => void;
  prestige: () => void;
  addCombatEvent: (type: CombatEvent["type"], value: string | number) => void;
  resetSave: () => void;
}

export type GameStore = ECSState & GameActions;

export const useGameStore = create<GameStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // --- ECS State ---
        hero: mapInitialHero(),
        monster: null,
        gold: 0,
        essence: 0,
        shards: 0,
        prestigeCount: 0,
        currentFloor: 1,
        monstersDefeatedOnFloor: 0,
        monstersRequiredForFloor: 5,
        isBossFloor: false,
        autoFightBoss: true,
        activeTab: "upgrades",
        combatEvents: [],
        upgrades: INITIAL_UPGRADES.map((u) => ({ ...u })),
        artifacts: INITIAL_ARTIFACTS.map((a) => ({ ...a })),
        dps: 0,

        // --- Actions ---

        addCombatEvent: (type, value) => {
          const newEvent: CombatEvent = {
            id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type,
            value,
            timestamp: Date.now(),
          };
          set((state) => ({
            combatEvents: [newEvent, ...state.combatEvents].slice(0, 30),
          }));
        },

        setActiveTab: (activeTab) => set({ activeTab }),

        setAutoFightBoss: (autoFightBoss) => set({ autoFightBoss }),

        resetSave: () => {
          set({
            hero: mapInitialHero(),
            monster: null, gold: 0, essence: 0, shards: 0, prestigeCount: 0,
            currentFloor: 1, monstersDefeatedOnFloor: 0, isBossFloor: false,
            upgrades: INITIAL_UPGRADES.map((u) => ({ ...u })),
            artifacts: INITIAL_ARTIFACTS.map((a) => ({ ...a })),
            activeTab: "upgrades", combatEvents: [], dps: 0, autoFightBoss: true,
          });
          localStorage.removeItem('idle_dungeon_save_v2');
        },

        castSkill: (skillId) => {
          const { hero } = get();
          const skill = hero.skills.skills.find(s => s.id === skillId);
          if (!skill || hero.progression.level < skill.unlockedAt || skill.currentCooldown > 0) return;

          set((state) => {
            const updatedSkills = state.hero.skills.skills.map((s) =>
              s.id === skillId ? { ...s, currentCooldown: s.cooldown, activeDuration: s.duration } : s
            );

            const updatedHero = { ...state.hero, skills: { skills: updatedSkills } };
            const updatedMonster = state.monster ? { ...state.monster } : null;

            if (skill.effectType === "heal") {
              const healAmt = Math.round(updatedHero.health.maxHp * skill.effectValue);
              updatedHero.health.currentHp = Math.min(updatedHero.health.maxHp, updatedHero.health.currentHp + healAmt);
              setTimeout(() => get().addCombatEvent("hero_heal", `+${healAmt} HP`), 50);
            } else if (skill.effectType === "damage" && updatedMonster) {
              const mult = getDamageMultiplier(state.artifacts, updatedMonster);
              const damage = Math.round(updatedHero.combat.attack * skill.effectValue * mult);
              updatedMonster.health.currentHp = Math.max(0, updatedMonster.health.currentHp - damage);
              timers.totalDamageDealtInSec += damage;
              setTimeout(() => get().addCombatEvent("hero_crit", `💥 Whirlwind: ${damage}`), 50);
            }

            return { hero: updatedHero, monster: updatedMonster };
          });
        },

        buyUpgrade: (upgradeId) => {
          const { gold, upgrades } = get();
          const upgrade = upgrades.find(u => u.id === upgradeId);
          if (!upgrade || gold < upgrade.cost) return;

          set((state) => {
            const updatedUpgrades = state.upgrades.map((u) => 
              u.id === upgradeId ? { ...u, currentLevel: u.currentLevel + 1, cost: Math.round(u.cost * u.costMultiplier) } : u
            );

            const levels = {
              att: updatedUpgrades.find(u => u.type === 'attack')?.currentLevel || 0,
              hp: updatedUpgrades.find(u => u.type === 'hp')?.currentLevel || 0,
              regen: updatedUpgrades.find(u => u.type === 'regen')?.currentLevel || 0,
              crit: updatedUpgrades.find(u => u.type === 'crit')?.currentLevel || 0,
              speed: updatedUpgrades.find(u => u.type === 'speed')?.currentLevel || 0,
              wpn: updatedUpgrades.find(u => u.type === 'weapon')?.currentLevel || 1,
              arm: updatedUpgrades.find(u => u.type === 'armor')?.currentLevel || 1,
              bts: updatedUpgrades.find(u => u.type === 'boots')?.currentLevel || 1,
            };

            const updatedHero = { ...state.hero };
            updatedHero.equipment = { weaponLvl: levels.wpn, armorLvl: levels.arm, bootsLvl: levels.bts };

            const oldMaxHp = updatedHero.health.maxHp;
            updatedHero.health.maxHp = INITIAL_HERO.maxHp + levels.hp * 15 + (levels.arm - 1) * 35;
            updatedHero.health.currentHp = Math.min(updatedHero.health.maxHp, updatedHero.health.currentHp + (updatedHero.health.maxHp - oldMaxHp));
            updatedHero.combat.attack = INITIAL_HERO.attack + levels.att * 2 + (levels.wpn - 1) * 6;
            updatedHero.combat.defense = INITIAL_HERO.defense + (levels.arm - 1) * 2;

            const rawInterval = INITIAL_HERO.attackSpeed * Math.pow(0.97, levels.speed) * Math.pow(0.98, levels.bts - 1);
            updatedHero.combat.attackSpeed = Math.max(0.25, rawInterval);
            updatedHero.combat.critChance = Math.min(0.8, INITIAL_HERO.critChance + levels.crit * 0.01);
            updatedHero.health.regen = INITIAL_HERO.regen + levels.regen * 0.5 + (levels.arm - 1) * 0.2;

            return { gold: state.gold - upgrade.cost, upgrades: updatedUpgrades, hero: updatedHero };
          });
        },

        buyArtifact: (artifactId) => {
          const { essence, artifacts } = get();
          const artifact = artifacts.find(a => a.id === artifactId);
          if (!artifact || essence < artifact.cost) return;

          set((state) => ({
            essence: state.essence - artifact.cost,
            artifacts: state.artifacts.map((a) =>
              a.id === artifactId ? { ...a, level: a.level + 1, cost: Math.round(a.cost * a.costMultiplier) } : a
            ),
          }));
        },

        prestige: () => {
          const { currentFloor, prestigeCount } = get();
          const shardsEarned = Math.max(0, Math.floor(Math.pow(currentFloor, 1.4) / 5));

          if (shardsEarned === 0 && currentFloor < 10) {
            alert("Вам нужно дойти хотя бы до 10 этажа, чтобы совершить перерождение!");
            return;
          }

          set((state) => {
            const newShards = state.shards + shardsEarned;
            const prestigeMult = getPrestigeMultiplier(newShards);
            const baseHero = mapInitialHero();
            baseHero.health.maxHp = Math.round(baseHero.health.maxHp * prestigeMult);
            baseHero.health.currentHp = baseHero.health.maxHp;
            baseHero.combat.attack = Math.round(baseHero.combat.attack * prestigeMult);

            return {
              hero: baseHero, monster: null, gold: 0,
              upgrades: INITIAL_UPGRADES.map((u) => ({ ...u })),
              shards: newShards, prestigeCount: prestigeCount + 1,
              currentFloor: 1, monstersDefeatedOnFloor: 0, isBossFloor: false, activeTab: "upgrades",
              combatEvents: [{ id: `evt_prg_${Date.now()}`, type: "level_up", value: `Перерождение! Получено ${shardsEarned} осколков. Сила +${Math.round(newShards * 5)}%`, timestamp: Date.now() }],
            };
          });
        },

        tick: (dt) => {
          const state = get();
          if (!state.monster) {
            set({ monster: generateMonsterEntity(state.currentFloor, false) });
            return;
          }

          // 1. Systems Update
          const updatedSkills = updateSkillsCooldowns(state.hero.skills.skills, dt);
          const { currentHp: regHeroHp, hpHealed } = updateHeroRegen(state.hero.health, dt, timers);
          
          const multipliers = {
            speed: getSpeedMultiplier(updatedSkills),
            damage: getDamageMultiplier(state.artifacts, state.monster),
            gold: getGoldMultiplier(updatedSkills, state.artifacts, state.shards),
            exp: getExpMultiplier(state.artifacts),
            prestige: 1,
          };

          // 2. Combat
          const combatHero = { health: { ...state.hero.health, currentHp: regHeroHp }, combat: state.hero.combat };
          const { monsterHp, heroHp, heroHit, monsterHit } = processCombat(combatHero, state.monster, dt, multipliers, timers);

          // 3. DPS
          timers.dps += dt;
          let currentDps = state.dps;
          if (timers.dps >= 1.0) {
            currentDps = Math.round(timers.totalDamageDealtInSec / timers.dps);
            timers.totalDamageDealtInSec = 0;
            timers.dps = 0;
          }

          // 4. Progression
          const progHero: HeroEntity = { 
            ...state.hero, 
            health: { ...state.hero.health, currentHp: heroHp },
            skills: { skills: updatedSkills }
          };
          const progMonster: MonsterEntity = { ...state.monster, health: { ...state.monster.health, currentHp: monsterHp } };
          const progResult = handleProgression(progHero, progMonster, multipliers, {
            currentFloor: state.currentFloor,
            monstersDefeatedOnFloor: state.monstersDefeatedOnFloor,
            monstersRequiredForFloor: state.monstersRequiredForFloor,
            isBossFloor: state.isBossFloor,
            autoFightBoss: state.autoFightBoss,
          });

          // 5. Events & State Commit
          const newEvents: CombatEvent[] = [...state.combatEvents];
          const timestamp = Date.now();
          
          if (heroHit) newEvents.unshift({ id: `h_${timestamp}_${Math.random()}`, type: heroHit.isCrit ? "hero_crit" : "hero_attack", value: heroHit.damage, timestamp });
          if (monsterHit) newEvents.unshift({ id: `m_${timestamp}_${Math.random()}`, type: "monster_attack", value: monsterHit.damage, timestamp });
          if (hpHealed > 0 && heroHp < progResult.heroMaxHp) newEvents.unshift({ id: `r_${timestamp}`, type: "hero_heal", value: `+${hpHealed}`, timestamp });
          
          progResult.logs.forEach(log => {
            newEvents.unshift({ 
              id: `prog_${timestamp}_${Math.random()}`, 
              type: log.type as CombatEvent["type"], 
              value: log.value, 
              timestamp 
            });
          });

          set({
            hero: {
              ...state.hero,
              health: {
                currentHp: progResult.nextMonster ? progResult.heroMaxHp : heroHp,
                maxHp: progResult.heroMaxHp,
                regen: progResult.heroRegen,
              },
              combat: {
                ...state.hero.combat,
                attack: progResult.heroAttack,
                defense: progResult.heroDefense,
              },
              progression: {
                level: progResult.heroLevel,
                exp: progResult.heroExp,
                nextLevelExp: progResult.heroNextExp,
              },
              skills: { skills: updatedSkills },
            },
            monster: progResult.nextMonster || (state.monster ? { ...state.monster, health: { ...state.monster.health, currentHp: monsterHp } } : null),
            gold: state.gold + progResult.goldGained,
            essence: state.essence + progResult.essenceGained,
            currentFloor: progResult.nextFloor,
            monstersDefeatedOnFloor: progResult.nextMonstersDefeated,
            isBossFloor: progResult.isBoss,
            dps: currentDps,
            combatEvents: newEvents.slice(0, 30),
          });
        },
      }),
      {
        name: 'idle_dungeon_save_v2',
        partialize: (state) => {
          const { 
            hero, monster, gold, essence, shards, 
            prestigeCount, currentFloor, monstersDefeatedOnFloor, 
            monstersRequiredForFloor, isBossFloor, upgrades, 
            artifacts, activeTab, combatEvents, 
            dps, autoFightBoss 
          } = state;
          return { 
            hero, monster, gold, essence, shards, 
            prestigeCount, currentFloor, monstersDefeatedOnFloor, 
            monstersRequiredForFloor, isBossFloor, upgrades, 
            artifacts, activeTab, combatEvents, 
            dps, autoFightBoss 
          };
        },
      }
    )
  )
);
