import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type {
  GameState,
  CombatEvent,
} from "../types/game";
import { 
  INITIAL_HERO, 
  INITIAL_UPGRADES, 
  INITIAL_SKILLS, 
  INITIAL_ARTIFACTS 
} from "../config/gameConfig";
import { generateMonster } from "../logic/monsterGenerator";
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

export type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // --- State ---
        hero: { ...INITIAL_HERO },
        monster: null,
        gold: 0,
        essence: 0,
        shards: 0,
        prestigeCount: 0,
        currentFloor: 1,
        monstersDefeatedOnFloor: 0,
        monstersRequiredForFloor: 5,
        isBossFloor: false,
        upgrades: INITIAL_UPGRADES.map((u) => ({ ...u })),
        skills: INITIAL_SKILLS.map((s) => ({ ...s })),
        artifacts: INITIAL_ARTIFACTS.map((a) => ({ ...a })),
        activeTab: "upgrades",
        combatEvents: [],
        dps: 0,
        autoFightBoss: true,

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
            hero: { ...INITIAL_HERO },
            monster: null, gold: 0, essence: 0, shards: 0, prestigeCount: 0,
            currentFloor: 1, monstersDefeatedOnFloor: 0, isBossFloor: false,
            upgrades: INITIAL_UPGRADES.map((u) => ({ ...u })),
            skills: INITIAL_SKILLS.map((s) => ({ ...s })),
            artifacts: INITIAL_ARTIFACTS.map((a) => ({ ...a })),
            activeTab: "upgrades", combatEvents: [], dps: 0, autoFightBoss: true,
          });
          localStorage.removeItem('idle_dungeon_save_v1');
        },

        castSkill: (skillId) => {
          const { hero } = get();
          if (hero.level < (get().skills.find(s => s.id === skillId)?.unlockedAt || 0)) return;

          set((state) => {
            const skillIndex = state.skills.findIndex((s) => s.id === skillId);
            if (skillIndex === -1 || state.skills[skillIndex].currentCooldown > 0) return {};

            const skill = state.skills[skillIndex];
            const updatedSkills = state.skills.map((s) =>
              s.id === skillId ? { ...s, currentCooldown: s.cooldown, activeDuration: s.duration } : s
            );

            const updatedHero = { ...state.hero };
            const updatedMonster = state.monster ? { ...state.monster } : null;

            if (skill.effectType === "heal") {
              const healAmt = Math.round(updatedHero.maxHp * skill.effectValue);
              updatedHero.currentHp = Math.min(updatedHero.maxHp, updatedHero.currentHp + healAmt);
              setTimeout(() => get().addCombatEvent("hero_heal", `+${healAmt} HP`), 50);
            } else if (skill.effectType === "damage" && updatedMonster) {
              const mult = getDamageMultiplier(state.artifacts, updatedMonster);
              const damage = Math.round(updatedHero.attack * skill.effectValue * mult);
              updatedMonster.currentHp = Math.max(0, updatedMonster.currentHp - damage);
              timers.totalDamageDealtInSec += damage;
              setTimeout(() => get().addCombatEvent("hero_crit", `💥 Whirlwind: ${damage}`), 50);
            }

            return { skills: updatedSkills, hero: updatedHero, monster: updatedMonster };
          });
        },

        buyUpgrade: (upgradeId) => {
          if (get().gold < (get().upgrades.find(u => u.id === upgradeId)?.cost || 0)) return;

          set((state) => {
            const upgradeIndex = state.upgrades.findIndex((u) => u.id === upgradeId);
            if (upgradeIndex === -1) return {};
            
            const upgrade = state.upgrades[upgradeIndex];
            const updatedUpgrades = state.upgrades.map((u) => 
              u.id === upgradeId ? { ...u, currentLevel: u.currentLevel + 1, cost: Math.round(u.cost * u.costMultiplier) } : u
            );

            const updatedHero = { ...state.hero };
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

            updatedHero.weaponLvl = levels.wpn;
            updatedHero.armorLvl = levels.arm;
            updatedHero.bootsLvl = levels.bts;

            const oldMaxHp = updatedHero.maxHp;
            updatedHero.maxHp = INITIAL_HERO.maxHp + levels.hp * 15 + (levels.arm - 1) * 35;
            updatedHero.currentHp = Math.min(updatedHero.maxHp, updatedHero.currentHp + (updatedHero.maxHp - oldMaxHp));
            updatedHero.attack = INITIAL_HERO.attack + levels.att * 2 + (levels.wpn - 1) * 6;
            updatedHero.defense = INITIAL_HERO.defense + (levels.arm - 1) * 2;

            const rawInterval = INITIAL_HERO.attackSpeed * Math.pow(0.97, levels.speed) * Math.pow(0.98, levels.bts - 1);
            updatedHero.attackSpeed = Math.max(0.25, rawInterval);
            updatedHero.critChance = Math.min(0.8, INITIAL_HERO.critChance + levels.crit * 0.01);
            updatedHero.regen = INITIAL_HERO.regen + levels.regen * 0.5 + (levels.arm - 1) * 0.2;

            return { gold: state.gold - upgrade.cost, upgrades: updatedUpgrades, hero: updatedHero };
          });
        },

        buyArtifact: (artifactId) => {
          if (get().essence < (get().artifacts.find(a => a.id === artifactId)?.cost || 0)) return;

          set((state) => {
            const artIndex = state.artifacts.findIndex((a) => a.id === artifactId);
            if (artIndex === -1) return {};
            return {
              essence: state.essence - state.artifacts[artIndex].cost,
              artifacts: state.artifacts.map((a) =>
                a.id === artifactId ? { ...a, level: a.level + 1, cost: Math.round(a.cost * a.costMultiplier) } : a
              ),
            };
          });
        },

        prestige: () => {
          const shardsEarned = Math.max(0, Math.floor(Math.pow(get().currentFloor, 1.4) / 5));

          if (shardsEarned === 0 && get().currentFloor < 10) {
            alert("Вам нужно дойти хотя бы до 10 этажа, чтобы совершить перерождение!");
            return;
          }

          set((state) => {
            const newShards = state.shards + shardsEarned;
            const prestigeMult = getPrestigeMultiplier(newShards);
            const baseHero = { ...INITIAL_HERO, maxHp: Math.round(INITIAL_HERO.maxHp * prestigeMult), attack: Math.round(INITIAL_HERO.attack * prestigeMult) };
            baseHero.currentHp = baseHero.maxHp;

            return {
              hero: baseHero, monster: null, gold: 0,
              upgrades: INITIAL_UPGRADES.map((u) => ({ ...u })),
              skills: state.skills.map((s) => ({ ...s, currentCooldown: 0, activeDuration: 0 })),
              shards: newShards, prestigeCount: state.prestigeCount + 1,
              currentFloor: 1, monstersDefeatedOnFloor: 0, isBossFloor: false, activeTab: "upgrades",
              combatEvents: [{ id: `evt_prg_${Date.now()}`, type: "level_up", value: `Перерождение! Получено ${shardsEarned} осколков. Сила +${Math.round(newShards * 5)}%`, timestamp: Date.now() }],
            };
          });
        },

        tick: (dt) => {
          const state = get();
          if (!state.monster) {
            set({ monster: generateMonster(state.currentFloor, false) });
            return;
          }

          // 1. Systems Update
          const updatedSkills = updateSkillsCooldowns(state.skills, dt);
          const { currentHp: regHeroHp, hpHealed } = updateHeroRegen(state.hero, dt, timers);
          
          const multipliers = {
            speed: getSpeedMultiplier(updatedSkills),
            damage: getDamageMultiplier(state.artifacts, state.monster),
            gold: getGoldMultiplier(updatedSkills, state.artifacts, state.shards),
            exp: getExpMultiplier(state.artifacts),
            prestige: 1,
          };

          // 2. Combat
          const combatHero = { ...state.hero, currentHp: regHeroHp };
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
          const progHero = { ...combatHero, currentHp: heroHp };
          const progMonster = { ...state.monster, currentHp: monsterHp };
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
          progResult.logs.forEach(log => newEvents.unshift({ ...log, id: `prog_${timestamp}_${Math.random()}`, timestamp }));

          set({
            hero: {
              ...state.hero,
              level: progResult.heroLevel,
              exp: progResult.heroExp,
              nextLevelExp: progResult.heroNextExp,
              currentHp: progResult.nextMonster ? progResult.heroMaxHp : heroHp,
              maxHp: progResult.heroMaxHp,
              attack: progResult.heroAttack,
              defense: progResult.heroDefense,
              regen: progResult.heroRegen,
            },
            monster: progResult.nextMonster || (state.monster ? { ...state.monster, currentHp: monsterHp } : null),
            gold: state.gold + progResult.goldGained,
            essence: state.essence + progResult.essenceGained,
            currentFloor: progResult.nextFloor,
            monstersDefeatedOnFloor: progResult.nextMonstersDefeated,
            isBossFloor: progResult.isBoss,
            skills: updatedSkills,
            dps: currentDps,
            combatEvents: newEvents.slice(0, 30),
          });
        },
      }),
      {
        name: 'idle_dungeon_save_v1',
        partialize: (state) => {
          const { 
            hero, monster, gold, essence, shards, 
            prestigeCount, currentFloor, monstersDefeatedOnFloor, 
            monstersRequiredForFloor, isBossFloor, upgrades, 
            skills, artifacts, activeTab, combatEvents, 
            dps, autoFightBoss 
          } = state;
          return { 
            hero, monster, gold, essence, shards, 
            prestigeCount, currentFloor, monstersDefeatedOnFloor, 
            monstersRequiredForFloor, isBossFloor, upgrades, 
            skills, artifacts, activeTab, combatEvents, 
            dps, autoFightBoss 
          };
        },
      }
    )
  )
);
