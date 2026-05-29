import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type {
  GameState,
  Hero,
  Monster,
  Upgrade,
  Skill,
  Artifact,
  CombatEvent,
} from "../types/game";

// --- Constants ---

const INITIAL_HERO: Hero = {
  level: 1,
  exp: 0,
  nextLevelExp: 100,
  currentHp: 100,
  maxHp: 100,
  attack: 10,
  defense: 2,
  attackSpeed: 1.2,
  critChance: 0.1,
  critDamage: 1.5,
  regen: 1,
  weaponLvl: 1,
  armorLvl: 1,
  bootsLvl: 1,
};

const INITIAL_UPGRADES: Upgrade[] = [
  {
    id: "upg_att",
    name: "Physical Training",
    description: "Increases base attack by 2",
    cost: 15,
    costMultiplier: 1.15,
    currentLevel: 0,
    baseValue: 0,
    scaling: 2,
    type: "attack",
  },
  {
    id: "upg_hp",
    name: "Endurance Training",
    description: "Increases max health by 15",
    cost: 20,
    costMultiplier: 1.15,
    currentLevel: 0,
    baseValue: 0,
    scaling: 15,
    type: "hp",
  },
  {
    id: "upg_regen",
    name: "Rejuvenation",
    description: "Increases passive regeneration by 0.5 HP/s",
    cost: 30,
    costMultiplier: 1.2,
    currentLevel: 0,
    baseValue: 0,
    scaling: 0.5,
    type: "regen",
  },
  {
    id: "upg_crit",
    name: "Focus Training",
    description: "Increases critical strike chance by 1%",
    cost: 50,
    costMultiplier: 1.25,
    currentLevel: 0,
    baseValue: 0,
    scaling: 0.01,
    type: "crit",
  },
  {
    id: "upg_speed",
    name: "Agility Training",
    description: "Reduces attack interval by 3%",
    cost: 60,
    costMultiplier: 1.25,
    currentLevel: 0,
    baseValue: 0,
    scaling: 0.03,
    type: "speed",
  },
  {
    id: "upg_wpn",
    name: "Forge Weapon",
    description: "Greatly increases attack & upgrades 3D sword visual",
    cost: 100,
    costMultiplier: 1.4,
    currentLevel: 1,
    baseValue: 0,
    scaling: 5,
    type: "weapon",
  },
  {
    id: "upg_arm",
    name: "Reinforce Armor",
    description: "Increases defense & upgrades 3D shield visual",
    cost: 100,
    costMultiplier: 1.4,
    currentLevel: 1,
    baseValue: 0,
    scaling: 3,
    type: "armor",
  },
  {
    id: "upg_bts",
    name: "Heavy Boots",
    description: "Slightly reduces attack speed interval & increases speed",
    cost: 80,
    costMultiplier: 1.35,
    currentLevel: 1,
    baseValue: 0,
    scaling: 0.02,
    type: "boots",
  },
];

const INITIAL_SKILLS: Skill[] = [
  {
    id: "skl_slash",
    name: "Whirlwind Slash",
    description: "Unleashes a rapid series of attacks, dealing 4x weapon damage instantly.",
    cooldown: 12,
    currentCooldown: 0,
    duration: 0.5,
    activeDuration: 0,
    cost: 0,
    level: 1,
    costMultiplier: 1.5,
    effectType: "damage",
    effectValue: 4,
    unlockedAt: 1,
  },
  {
    id: "skl_heal",
    name: "Holy Restoration",
    description: "Heals the Hero for 50% of their Max HP instantly.",
    cooldown: 20,
    currentCooldown: 0,
    duration: 0.1,
    activeDuration: 0,
    cost: 0,
    level: 1,
    costMultiplier: 1.5,
    effectType: "heal",
    effectValue: 0.5,
    unlockedAt: 3,
  },
  {
    id: "skl_frenzy",
    name: "Blood Frenzy",
    description: "Enter a battle trance! Increases attack speed by 100% for 6 seconds.",
    cooldown: 30,
    currentCooldown: 0,
    duration: 6,
    activeDuration: 0,
    cost: 0,
    level: 1,
    costMultiplier: 1.5,
    effectType: "speed",
    effectValue: 2,
    unlockedAt: 5,
  },
  {
    id: "skl_greed",
    name: "Midas Touch",
    description: "Enchants weapon to yield 300% more Gold from defeated enemies for 8 seconds.",
    cooldown: 45,
    currentCooldown: 0,
    duration: 8,
    activeDuration: 0,
    cost: 0,
    level: 1,
    costMultiplier: 1.5,
    effectType: "goldMultiplier",
    effectValue: 3,
    unlockedAt: 8,
  },
];

const INITIAL_ARTIFACTS: Artifact[] = [
  {
    id: "art_sigil",
    name: "Sigil of Ruin",
    description: "Increases all damage dealt by 20% per level.",
    level: 0,
    cost: 10,
    costMultiplier: 1.8,
    effectType: "dmg_mult",
    effectValue: 0.2,
  },
  {
    id: "art_coin",
    name: "Greedy Goblet",
    description: "Increases all gold acquired by 25% per level.",
    level: 0,
    cost: 15,
    costMultiplier: 1.8,
    effectType: "gold_mult",
    effectValue: 0.25,
  },
  {
    id: "art_tome",
    name: "Chronicles of EXP",
    description: "Increases experience gained by 15% per level.",
    level: 0,
    cost: 10,
    costMultiplier: 1.8,
    effectType: "exp_mult",
    effectValue: 0.15,
  },
  {
    id: "art_slayer",
    name: "Titan Slayer",
    description: "Increases damage dealt to bosses by 30% per level.",
    level: 0,
    cost: 20,
    costMultiplier: 2.0,
    effectType: "boss_dmg",
    effectValue: 0.3,
  },
];

const MONSTER_NAMES = {
  goblin: ["Cave Imp", "Goblin Thief", "Gringo the Goblin", "Goblin Chieftain"],
  skeleton: ["Rattling Bones", "Skeleton Archer", "Decayed Guardian", "Lich Squire"],
  orc: ["Orc Grunt", "Fierce Berserker", "Orc Marauder", "Ironhide Orc"],
  demon: ["Hellspawn", "Fiery Imp", "Abyssal Terror", "Demon Overlord"],
  dragon: ["Baby Hatchling", "Wyvern Outcast", "Emerald Drake", "Ancient Red Dragon"],
};

// --- Helpers ---

const generateMonster = (floor: number, isBoss: boolean): Monster => {
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

// Non-reactive timers
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
            monster: null,
            gold: 0,
            essence: 0,
            shards: 0,
            prestigeCount: 0,
            currentFloor: 1,
            monstersDefeatedOnFloor: 0,
            isBossFloor: false,
            upgrades: INITIAL_UPGRADES.map((u) => ({ ...u })),
            skills: INITIAL_SKILLS.map((s) => ({ ...s })),
            artifacts: INITIAL_ARTIFACTS.map((a) => ({ ...a })),
            activeTab: "upgrades",
            combatEvents: [],
            dps: 0,
            autoFightBoss: true,
          });
          localStorage.removeItem('idle_dungeon_save_v1');
        },

        castSkill: (skillId) => {
          const { skills, hero } = get();
          const skillIndex = skills.findIndex((s) => s.id === skillId);
          if (skillIndex === -1) return;

          const skill = skills[skillIndex];
          if (skill.currentCooldown > 0 || hero.level < skill.unlockedAt) return;

          set((state) => {
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
              const dmgArt = state.artifacts.find((a) => a.id === "art_sigil");
              let mult = 1 + (dmgArt ? dmgArt.level * dmgArt.effectValue : 0);
              if (updatedMonster.isBoss) {
                const slayerArt = state.artifacts.find((a) => a.id === "art_slayer");
                mult += slayerArt ? slayerArt.level * slayerArt.effectValue : 0;
              }

              const damage = Math.round(updatedHero.attack * skill.effectValue * mult);
              updatedMonster.currentHp = Math.max(0, updatedMonster.currentHp - damage);
              timers.totalDamageDealtInSec += damage;
              setTimeout(() => get().addCombatEvent("hero_crit", `💥 Whirlwind: ${damage}`), 50);
            }

            return {
              skills: updatedSkills,
              hero: updatedHero,
              monster: updatedMonster,
            };
          });
        },

        buyUpgrade: (upgradeId) => {
          const { upgrades, gold } = get();
          const upgradeIndex = upgrades.findIndex((u) => u.id === upgradeId);
          if (upgradeIndex === -1) return;

          const upgrade = upgrades[upgradeIndex];
          if (gold < upgrade.cost) return;

          set((state) => {
            const newGold = state.gold - upgrade.cost;
            const updatedUpgrades = state.upgrades.map((u) => {
              if (u.id === upgradeId) {
                return {
                  ...u,
                  currentLevel: u.currentLevel + 1,
                  cost: Math.round(u.cost * u.costMultiplier),
                };
              }
              return u;
            });

            const updatedHero = { ...state.hero };
            const upgAtt = updatedUpgrades.find((u) => u.type === "attack")?.currentLevel || 0;
            const upgHp = updatedUpgrades.find((u) => u.type === "hp")?.currentLevel || 0;
            const upgRegen = updatedUpgrades.find((u) => u.type === "regen")?.currentLevel || 0;
            const upgCrit = updatedUpgrades.find((u) => u.type === "crit")?.currentLevel || 0;
            const upgSpeed = updatedUpgrades.find((u) => u.type === "speed")?.currentLevel || 0;
            const upgWpn = updatedUpgrades.find((u) => u.type === "weapon")?.currentLevel || 1;
            const upgArm = updatedUpgrades.find((u) => u.type === "armor")?.currentLevel || 1;
            const upgBts = updatedUpgrades.find((u) => u.type === "boots")?.currentLevel || 1;

            updatedHero.weaponLvl = upgWpn;
            updatedHero.armorLvl = upgArm;
            updatedHero.bootsLvl = upgBts;

            const oldMaxHp = updatedHero.maxHp;
            updatedHero.maxHp = INITIAL_HERO.maxHp + upgHp * 15 + (upgArm - 1) * 35;
            updatedHero.currentHp = Math.min(updatedHero.maxHp, updatedHero.currentHp + (updatedHero.maxHp - oldMaxHp));
            updatedHero.attack = INITIAL_HERO.attack + upgAtt * 2 + (upgWpn - 1) * 6;
            updatedHero.defense = INITIAL_HERO.defense + (upgArm - 1) * 2;

            const rawInterval = INITIAL_HERO.attackSpeed * Math.pow(0.97, upgSpeed) * Math.pow(0.98, upgBts - 1);
            updatedHero.attackSpeed = Math.max(0.25, rawInterval);
            updatedHero.critChance = Math.min(0.8, INITIAL_HERO.critChance + upgCrit * 0.01);
            updatedHero.regen = INITIAL_HERO.regen + upgRegen * 0.5 + (upgArm - 1) * 0.2;

            return {
              gold: newGold,
              upgrades: updatedUpgrades,
              hero: updatedHero,
            };
          });
        },

        buyArtifact: (artifactId) => {
          const { artifacts, essence } = get();
          const artIndex = artifacts.findIndex((a) => a.id === artifactId);
          if (artIndex === -1) return;

          const artifact = artifacts[artIndex];
          if (essence < artifact.cost) return;

          set((state) => ({
            essence: state.essence - artifact.cost,
            artifacts: state.artifacts.map((a) =>
              a.id === artifactId ? { ...a, level: a.level + 1, cost: Math.round(a.cost * a.costMultiplier) } : a
            ),
          }));
        },

        prestige: () => {
          const { currentFloor } = get();
          const shardsEarned = Math.max(0, Math.floor(Math.pow(currentFloor, 1.4) / 5));

          if (shardsEarned === 0 && currentFloor < 10) {
            alert("Вам нужно дойти хотя бы до 10 этажа, чтобы совершить перерождение!");
            return;
          }

          set((state) => {
            const newShards = state.shards + shardsEarned;
            const newPrestigeCount = state.prestigeCount + 1;
            const baseHero = { ...INITIAL_HERO };
            const prestigeMult = 1 + newShards * 0.05;

            baseHero.maxHp = Math.round(baseHero.maxHp * prestigeMult);
            baseHero.currentHp = baseHero.maxHp;
            baseHero.attack = Math.round(baseHero.attack * prestigeMult);

            return {
              hero: baseHero,
              monster: null,
              gold: 0,
              upgrades: INITIAL_UPGRADES.map((u) => ({ ...u })),
              skills: state.skills.map((s) => ({ ...s, currentCooldown: 0, activeDuration: 0 })),
              shards: newShards,
              prestigeCount: newPrestigeCount,
              currentFloor: 1,
              monstersDefeatedOnFloor: 0,
              isBossFloor: false,
              activeTab: "upgrades",
              combatEvents: [
                {
                  id: `evt_prg_${Date.now()}`,
                  type: "level_up",
                  value: `Перерождение! Получено ${shardsEarned} осколков. Сила +${Math.round(newShards * 5)}%`,
                  timestamp: Date.now(),
                },
              ],
            };
          });
        },

        tick: (dt) => {
          const state = get();
          const monster = state.monster;
          
          if (!monster) {
            set({ monster: generateMonster(state.currentFloor, false) });
            return;
          }

          let monsterDied = false;
          let heroDied = false;
          let goldGained = 0;
          let essenceGained = 0;
          let expGained = 0;
          let newLevel = state.hero.level;
          let hpHealed = 0;

          // 1. Tick Cooldowns & Spells Duration
          const updatedSkills = state.skills.map((s) => {
            let cd = s.currentCooldown;
            let dur = s.activeDuration;
            if (cd > 0) cd = Math.max(0, cd - dt);
            if (dur > 0) dur = Math.max(0, dur - dt);
            return { ...s, currentCooldown: cd, activeDuration: dur };
          });

          // 2. Regen Hero HP
          let currentHeroHp = state.hero.currentHp;
          timers.regen += dt;
          if (timers.regen >= 1.0) {
            timers.regen -= 1.0;
            if (currentHeroHp < state.hero.maxHp) {
              const heal = state.hero.regen;
              currentHeroHp = Math.min(state.hero.maxHp, currentHeroHp + heal);
              hpHealed = heal;
            }
          }

          // Helpers for multipliers
          const frenzy = updatedSkills.find((s) => s.id === "skl_frenzy");
          const speedMult = frenzy && frenzy.activeDuration > 0 ? frenzy.effectValue : 1;

          const midas = updatedSkills.find((s) => s.id === "skl_greed");
          const midasMult = midas && midas.activeDuration > 0 ? midas.effectValue : 1;
          const coinArt = state.artifacts.find((a) => a.id === "art_coin");
          const goldMult = midasMult * (1 + (coinArt ? coinArt.level * coinArt.effectValue : 0));

          const dmgArt = state.artifacts.find((a) => a.id === "art_sigil");
          let baseDmgMult = 1 + (dmgArt ? dmgArt.level * dmgArt.effectValue : 0);
          if (monster.isBoss) {
            const slayerArt = state.artifacts.find((a) => a.id === "art_slayer");
            baseDmgMult += slayerArt ? slayerArt.level * slayerArt.effectValue : 0;
          }

          const expArt = state.artifacts.find((a) => a.id === "art_tome");
          const expMult = 1 + (expArt ? expArt.level * expArt.effectValue : 0);

          // 3. Hero Attacks Monster
          timers.heroAttack += dt * speedMult;
          const attackDurationLimit = state.hero.attackSpeed;

          let monsterHp = monster.currentHp;
          let heroHitCreated = false;
          let heroDmg = 0;
          let isCrit = false;

          if (timers.heroAttack >= attackDurationLimit) {
            timers.heroAttack -= attackDurationLimit;
            const isCritical = Math.random() < state.hero.critChance;
            let damage = Math.round(state.hero.attack * baseDmgMult);
            if (isCritical) {
              damage = Math.round(damage * state.hero.critDamage);
              isCrit = true;
            }
            monsterHp = Math.max(0, monsterHp - damage);
            heroHitCreated = true;
            heroDmg = damage;
            timers.totalDamageDealtInSec += damage;
            if (monsterHp <= 0) monsterDied = true;
          }

          // 4. Monster Attacks Hero
          let monsterHitCreated = false;
          let monsterDmg = 0;
          if (!monsterDied) {
            timers.monsterAttack += dt;
            if (timers.monsterAttack >= 1.5) {
              timers.monsterAttack -= 1.5;
              monsterDmg = Math.max(1, monster.attack - state.hero.defense);
              currentHeroHp = Math.max(0, currentHeroHp - monsterDmg);
              monsterHitCreated = true;
              if (currentHeroHp <= 0) heroDied = true;
            }
          }

          // 5. Compute DPS
          timers.dps += dt;
          let currentDps = state.dps;
          if (timers.dps >= 1.0) {
            currentDps = Math.round(timers.totalDamageDealtInSec / timers.dps);
            timers.totalDamageDealtInSec = 0;
            timers.dps = 0;
          }

          // 6. Handle Monster Defeated
          let nextMonster: Monster | null = null;
          let nextFloor = state.currentFloor;
          let nextMonstersDefeated = state.monstersDefeatedOnFloor;
          let isBoss = state.isBossFloor;
          const newLogs: CombatEvent[] = [...state.combatEvents];

          if (monsterDied) {
            goldGained = Math.round(monster.goldReward * goldMult * (1 + state.shards * 0.02));
            essenceGained = monster.essenceReward;
            expGained = Math.round(monster.level * 10 * expMult);

            if (state.isBossFloor) {
              nextFloor = state.currentFloor + 1;
              nextMonstersDefeated = 0;
              isBoss = false;
              newLogs.unshift({
                id: `evt_lvl_${Date.now()}`,
                type: "level_up",
                value: `Этаж ${state.currentFloor} пройден! Спуск на этаж ${nextFloor}.`,
                timestamp: Date.now(),
              });
            } else {
              nextMonstersDefeated += 1;
              if (nextMonstersDefeated >= state.monstersRequiredForFloor) {
                if (state.autoFightBoss) {
                  isBoss = true;
                  newLogs.unshift({
                    id: `evt_boss_${Date.now()}`,
                    type: "boss_spawn",
                    value: `⚠️ Появился Босс: ${monster.name}!`,
                    timestamp: Date.now(),
                  });
                } else {
                  nextMonstersDefeated = 0;
                }
              }
            }
            timers.heroAttack = 0;
            timers.monsterAttack = 0;
            nextMonster = generateMonster(nextFloor, isBoss);
          }

          // 7. Handle Hero Death
          if (heroDied) {
            currentHeroHp = state.hero.maxHp;
            if (state.isBossFloor || state.currentFloor > 1) {
              nextFloor = Math.max(1, state.currentFloor - 1);
              isBoss = false;
              nextMonstersDefeated = 0;
              newLogs.unshift({
                id: `evt_die_${Date.now()}`,
                type: "monster_dead",
                value: `💀 Герой погиб! Отступление на этаж ${nextFloor}.`,
                timestamp: Date.now(),
              });
            } else {
              newLogs.unshift({
                id: `evt_die_${Date.now()}`,
                type: "monster_dead",
                value: `💀 Герой погиб! Восстановление сил.`,
                timestamp: Date.now(),
              });
            }
            timers.heroAttack = 0;
            timers.monsterAttack = 0;
            nextMonster = generateMonster(nextFloor, isBoss);
          }

          // 8. Handle Hero Experience & Level Up
          let nextExp = state.hero.exp;
          let nextNextExp = state.hero.nextLevelExp;
          let nextMaxHp = state.hero.maxHp;
          let nextAttack = state.hero.attack;
          let nextDefense = state.hero.defense;
          let nextRegen = state.hero.regen;

          if (monsterDied && expGained > 0) {
            nextExp += expGained;
            if (nextExp >= nextNextExp) {
              nextExp -= nextNextExp;
              newLevel += 1;
              nextNextExp = Math.round(100 * Math.pow(1.22, newLevel - 1));
              nextMaxHp = Math.round(nextMaxHp * 1.08) + 10;
              currentHeroHp = nextMaxHp;
              nextAttack = Math.round(nextAttack * 1.08) + 2;
              nextDefense += 1;
              nextRegen = Number((nextRegen + 0.2).toFixed(1));
              newLogs.unshift({
                id: `evt_levelup_${Date.now()}`,
                type: "level_up",
                value: `✨ Уровень повышен! Теперь вы на ${newLevel} уровне.`,
                timestamp: Date.now(),
              });
            }
          }

          // Combine combat events
          if (heroHitCreated && monster) {
            newLogs.unshift({
              id: `evt_h_${Date.now()}`,
              type: isCrit ? "hero_crit" : "hero_attack",
              value: heroDmg,
              timestamp: Date.now(),
            });
          }
          if (monsterHitCreated) {
            newLogs.unshift({
              id: `evt_m_${Date.now()}`,
              type: "monster_attack",
              value: monsterDmg,
              timestamp: Date.now(),
            });
          }
          if (hpHealed > 0 && currentHeroHp < nextMaxHp) {
            newLogs.unshift({
              id: `evt_reg_${Date.now()}`,
              type: "hero_heal",
              value: `+${hpHealed}`,
              timestamp: Date.now(),
            });
          }

          set({
            hero: {
              ...state.hero,
              level: newLevel,
              exp: nextExp,
              nextLevelExp: nextNextExp,
              currentHp: currentHeroHp,
              maxHp: nextMaxHp,
              attack: nextAttack,
              defense: nextDefense,
              regen: nextRegen,
            },
            monster: nextMonster || (monster ? { ...monster, currentHp: monsterHp } : null),
            gold: state.gold + goldGained,
            essence: state.essence + essenceGained,
            currentFloor: nextFloor,
            monstersDefeatedOnFloor: nextMonstersDefeated,
            isBossFloor: isBoss,
            skills: updatedSkills,
            dps: currentDps,
            combatEvents: newLogs.slice(0, 30),
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
