import { useState, useEffect, useRef } from "react";
import type {
  GameState,
  Hero,
  Monster,
  Upgrade,
  Skill,
  Artifact,
  CombatEvent,
} from "../types/game";

const INITIAL_HERO: Hero = {
  level: 1,
  exp: 0,
  nextLevelExp: 100,
  currentHp: 100,
  maxHp: 100,
  attack: 10,
  defense: 2,
  attackSpeed: 1.2, // seconds per attack
  critChance: 0.1, // 10%
  critDamage: 1.5,
  regen: 1, // HP/sec
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
    description:
      "Unleashes a rapid series of attacks, dealing 4x weapon damage instantly.",
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
    description:
      "Enter a battle trance! Increases attack speed by 100% for 6 seconds.",
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
    description:
      "Enchants weapon to yield 300% more Gold from defeated enemies for 8 seconds.",
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
  skeleton: [
    "Rattling Bones",
    "Skeleton Archer",
    "Decayed Guardian",
    "Lich Squire",
  ],
  orc: ["Orc Grunt", "Fierce Berserker", "Orc Marauder", "Ironhide Orc"],
  demon: ["Hellspawn", "Fiery Imp", "Abyssal Terror", "Demon Overlord"],
  dragon: [
    "Baby Hatchling",
    "Wyvern Outcast",
    "Emerald Drake",
    "Ancient Red Dragon",
  ],
};

export const useGameState = () => {
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem("idle_dungeon_save_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure standard structure matches and hydrate dates/counters if necessary
        return parsed;
      }
    } catch (e) {
      console.error("Failed to load saved state:", e);
    }

    return {
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
    };
  });

  // Timers and combat intervals
  const lastTick = useRef<number>(Date.now());
  const heroAttackTimer = useRef<number>(0);
  const monsterAttackTimer = useRef<number>(0);
  const regenTimer = useRef<number>(0);
  const totalDamageDealtInSec = useRef<number>(0);
  const dpsTimer = useRef<number>(0);

  // Auto-save interval
  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem("idle_dungeon_save_v1", JSON.stringify(state));
    }, 10000);
    return () => clearInterval(saveInterval);
  }, [state]);

  // Generate monster based on current floor
  const generateMonster = (floor: number, isBoss: boolean): Monster => {
    let type: Monster["type"] = "goblin";
    if (floor >= 50) type = "dragon";
    else if (floor >= 30) type = "demon";
    else if (floor >= 15) type = "orc";
    else if (floor >= 6) type = "skeleton";

    const names = MONSTER_NAMES[type];
    const nameIndex = Math.min(
      isBoss
        ? names.length - 1
        : Math.floor(Math.random() * (names.length - 1)),
      names.length - 1,
    );
    const baseName = names[nameIndex];
    const name = isBoss ? `☠️ BOSS: ${baseName} ☠️` : baseName;

    // Scaling formulas
    const multiplier = isBoss ? 5 : 1;
    const maxHp = Math.round(25 * Math.pow(1.15, floor - 1) * multiplier);
    const attack = Math.round(
      4 * Math.pow(1.12, floor - 1) * (isBoss ? 1.5 : 1),
    );
    const goldReward = Math.round(10 * Math.pow(1.18, floor - 1) * multiplier);
    const essenceReward = Math.round(
      2 * Math.pow(1.12, floor - 1) * (isBoss ? 4 : 1),
    );

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

  // Add a combat log event
  const addCombatEvent = (
    type: CombatEvent["type"],
    value: string | number,
  ) => {
    const newEvent: CombatEvent = {
      id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      value,
      timestamp: Date.now(),
    };
    setState((prev) => {
      const logs = [newEvent, ...prev.combatEvents];
      return {
        ...prev,
        combatEvents: logs.slice(0, 30), // limit log size
      };
    });
  };

  // Active skills modifiers
  const getSpeedMultiplier = () => {
    const frenzy = state.skills.find((s) => s.id === "skl_frenzy");
    if (frenzy && frenzy.activeDuration > 0) {
      return frenzy.effectValue; // 2x speed (attack speed cooldown speedup)
    }
    return 1;
  };

  const getGoldMultiplier = () => {
    const Midas = state.skills.find((s) => s.id === "skl_greed");
    const midasMult = Midas && Midas.activeDuration > 0 ? Midas.effectValue : 1;

    // Artifact bonus
    const coinArt = state.artifacts.find((a) => a.id === "art_coin");
    const artBonus = 1 + (coinArt ? coinArt.level * coinArt.effectValue : 0);

    return midasMult * artBonus;
  };

  const getDamageMultiplier = (isBoss: boolean) => {
    // Artifact bonus
    const dmgArt = state.artifacts.find((a) => a.id === "art_sigil");
    let mult = 1 + (dmgArt ? dmgArt.level * dmgArt.effectValue : 0);

    if (isBoss) {
      const slayerArt = state.artifacts.find((a) => a.id === "art_slayer");
      mult += slayerArt ? slayerArt.level * slayerArt.effectValue : 0;
    }
    return mult;
  };

  const getExpMultiplier = () => {
    const expArt = state.artifacts.find((a) => a.id === "art_tome");
    return 1 + (expArt ? expArt.level * expArt.effectValue : 0);
  };

  // Trigger skills manually
  const castSkill = (skillId: string) => {
    const skillIndex = state.skills.findIndex((s) => s.id === skillId);
    if (skillIndex === -1) return;

    const skill = state.skills[skillIndex];
    if (skill.currentCooldown > 0 || state.hero.level < skill.unlockedAt)
      return;

    setState((prev) => {
      const updatedSkills = prev.skills.map((s) => {
        if (s.id === skillId) {
          return {
            ...s,
            currentCooldown: s.cooldown,
            activeDuration: s.duration,
          };
        }
        return s;
      });

      const updatedHero = { ...prev.hero };
      const updatedMonster = prev.monster ? { ...prev.monster } : null;

      // Handle instant triggers
      if (skill.effectType === "heal") {
        const healAmt = Math.round(updatedHero.maxHp * skill.effectValue);
        updatedHero.currentHp = Math.min(
          updatedHero.maxHp,
          updatedHero.currentHp + healAmt,
        );
        setTimeout(() => addCombatEvent("hero_heal", `+${healAmt} HP`), 50);
      } else if (skill.effectType === "damage" && updatedMonster) {
        // Whirlwind instant damage
        const dmgMult = getDamageMultiplier(updatedMonster.isBoss);
        const damage = Math.round(
          updatedHero.attack * skill.effectValue * dmgMult,
        );
        updatedMonster.currentHp = Math.max(
          0,
          updatedMonster.currentHp - damage,
        );

        totalDamageDealtInSec.current += damage;
        setTimeout(
          () => addCombatEvent("hero_crit", `💥 Whirlwind: ${damage}`),
          50,
        );
      }

      return {
        ...prev,
        skills: updatedSkills,
        hero: updatedHero,
        monster: updatedMonster,
      };
    });
  };

  // Buy upgrade
  const buyUpgrade = (upgradeId: string) => {
    const upgradeIndex = state.upgrades.findIndex((u) => u.id === upgradeId);
    if (upgradeIndex === -1) return;

    const upgrade = state.upgrades[upgradeIndex];
    if (state.gold < upgrade.cost) return;

    setState((prev) => {
      const newGold = prev.gold - upgrade.cost;
      const updatedUpgrades = prev.upgrades.map((u) => {
        if (u.id === upgradeId) {
          const nextLevel = u.currentLevel + 1;
          const nextCost = Math.round(u.cost * u.costMultiplier);
          return {
            ...u,
            currentLevel: nextLevel,
            cost: nextCost,
          };
        }
        return u;
      });

      // Recalculate hero stats based on upgrades
      const updatedHero = { ...prev.hero };

      // Base levels
      const upgAtt =
        updatedUpgrades.find((u) => u.type === "attack")?.currentLevel || 0;
      const upgHp =
        updatedUpgrades.find((u) => u.type === "hp")?.currentLevel || 0;
      const upgRegen =
        updatedUpgrades.find((u) => u.type === "regen")?.currentLevel || 0;
      const upgCrit =
        updatedUpgrades.find((u) => u.type === "crit")?.currentLevel || 0;
      const upgSpeed =
        updatedUpgrades.find((u) => u.type === "speed")?.currentLevel || 0;
      const upgWpn =
        updatedUpgrades.find((u) => u.type === "weapon")?.currentLevel || 1;
      const upgArm =
        updatedUpgrades.find((u) => u.type === "armor")?.currentLevel || 1;
      const upgBts =
        updatedUpgrades.find((u) => u.type === "boots")?.currentLevel || 1;

      // Equipments impact
      updatedHero.weaponLvl = upgWpn;
      updatedHero.armorLvl = upgArm;
      updatedHero.bootsLvl = upgBts;

      // Stats formulas
      const oldMaxHp = updatedHero.maxHp;
      updatedHero.maxHp = INITIAL_HERO.maxHp + upgHp * 15 + (upgArm - 1) * 35;
      // heal by HP difference so upgrading doesn't leave them at low HP pct
      updatedHero.currentHp = Math.min(
        updatedHero.maxHp,
        updatedHero.currentHp + (updatedHero.maxHp - oldMaxHp),
      );

      updatedHero.attack = INITIAL_HERO.attack + upgAtt * 2 + (upgWpn - 1) * 6;
      updatedHero.defense = INITIAL_HERO.defense + (upgArm - 1) * 2;

      // Speed reduction scaling nicely
      const rawInterval =
        INITIAL_HERO.attackSpeed *
        Math.pow(0.97, upgSpeed) *
        Math.pow(0.98, upgBts - 1);
      updatedHero.attackSpeed = Math.max(0.25, rawInterval); // cap at 4 attacks/sec base

      updatedHero.critChance = Math.min(
        0.8,
        INITIAL_HERO.critChance + upgCrit * 0.01,
      ); // cap crit at 80%
      updatedHero.regen =
        INITIAL_HERO.regen + upgRegen * 0.5 + (upgArm - 1) * 0.2;

      return {
        ...prev,
        gold: newGold,
        upgrades: updatedUpgrades,
        hero: updatedHero,
      };
    });
  };

  // Buy/upgrade artifacts using shards/essence
  const buyArtifact = (artifactId: string) => {
    const artIndex = state.artifacts.findIndex((a) => a.id === artifactId);
    if (artIndex === -1) return;

    const artifact = state.artifacts[artIndex];
    if (state.essence < artifact.cost) return;

    setState((prev) => {
      const newEssence = prev.essence - artifact.cost;
      const updatedArtifacts = prev.artifacts.map((a) => {
        if (a.id === artifactId) {
          const nextLevel = a.level + 1;
          const nextCost = Math.round(a.cost * a.costMultiplier);
          return {
            ...a,
            level: nextLevel,
            cost: nextCost,
          };
        }
        return a;
      });

      return {
        ...prev,
        essence: newEssence,
        artifacts: updatedArtifacts,
      };
    });
  };

  // Set active tabs
  const setActiveTab = (tab: string) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  };

  // Toggle autofight boss
  const setAutoFightBoss = (val: boolean) => {
    setState((prev) => ({ ...prev, autoFightBoss: val }));
  };

  // Prestige Reset (Rebirth)
  const prestige = () => {
    // Shards calculation: Based on floor and level
    const shardsEarned = Math.max(
      0,
      Math.floor(Math.pow(state.currentFloor, 1.4) / 5),
    );
    if (shardsEarned === 0 && state.currentFloor < 10) {
      alert(
        "Вам нужно дойти хотя бы до 10 этажа, чтобы совершить перерождение!",
      );
      return;
    }

    setState((prev) => {
      // Shards boost
      const newShards = prev.shards + shardsEarned;
      const newPrestigeCount = prev.prestigeCount + 1;

      // Global multipliers applied to stats
      const baseHero = { ...INITIAL_HERO };

      // Permanently adjust hero starting hp/atk based on prestige shards (e.g. +2% per shard)
      const prestigeMult = 1 + newShards * 0.05; // +5% stats per shard
      baseHero.maxHp = Math.round(baseHero.maxHp * prestigeMult);
      baseHero.currentHp = baseHero.maxHp;
      baseHero.attack = Math.round(baseHero.attack * prestigeMult);

      return {
        ...prev,
        hero: baseHero,
        monster: null, // trigger re-generation
        gold: 0,
        upgrades: INITIAL_UPGRADES.map((u) => ({ ...u })),
        skills: prev.skills.map((s) => ({
          ...s,
          currentCooldown: 0,
          activeDuration: 0,
        })),
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
  };

  // Main game tick loop
  useEffect(() => {
    // Generate initial monster if empty
    if (!state.monster) {
      const monster = generateMonster(state.currentFloor, false);
      setState((prev) => ({ ...prev, monster }));
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(1.0, (now - lastTick.current) / 1000); // delta time in seconds, max out at 1 sec
      lastTick.current = now;

      if (!state.monster) return;

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
      regenTimer.current += dt;
      if (regenTimer.current >= 1.0) {
        regenTimer.current -= 1.0;
        if (currentHeroHp < state.hero.maxHp) {
          const heal = state.hero.regen;
          currentHeroHp = Math.min(state.hero.maxHp, currentHeroHp + heal);
          hpHealed = heal;
        }
      }

      // 3. Hero Attacks Monster
      const activeSpeedMult = getSpeedMultiplier();
      heroAttackTimer.current += dt * activeSpeedMult;
      const attackDurationLimit = state.hero.attackSpeed;

      let monsterHp = state.monster.currentHp;
      let heroHitCreated = false;
      let heroDmg = 0;
      let isCrit = false;

      if (heroAttackTimer.current >= attackDurationLimit) {
        heroAttackTimer.current -= attackDurationLimit;

        // Compute damage
        const isCritical = Math.random() < state.hero.critChance;
        const baseDmg = state.hero.attack;
        const dmgMult = getDamageMultiplier(state.monster.isBoss);

        let damage = Math.round(baseDmg * dmgMult);
        if (isCritical) {
          damage = Math.round(damage * state.hero.critDamage);
          isCrit = true;
        }

        monsterHp = Math.max(0, monsterHp - damage);
        heroHitCreated = true;
        heroDmg = damage;
        totalDamageDealtInSec.current += damage;

        if (monsterHp <= 0) {
          monsterDied = true;
        }
      }

      // 4. Monster Attacks Hero (if still alive)
      let monsterHitCreated = false;
      let monsterDmg = 0;

      if (!monsterDied) {
        monsterAttackTimer.current += dt;
        if (monsterAttackTimer.current >= 1.5) {
          // Monster attack rate is fixed at 1.5s
          monsterAttackTimer.current -= 1.5;

          const rawDmg = state.monster.attack - state.hero.defense;
          monsterDmg = Math.max(1, rawDmg); // minimum 1 damage

          currentHeroHp = Math.max(0, currentHeroHp - monsterDmg);
          monsterHitCreated = true;

          if (currentHeroHp <= 0) {
            heroDied = true;
          }
        }
      }

      // 5. Compute DPS every second
      dpsTimer.current += dt;
      let currentDps = state.dps;
      if (dpsTimer.current >= 1.0) {
        currentDps = Math.round(
          totalDamageDealtInSec.current / dpsTimer.current,
        );
        totalDamageDealtInSec.current = 0;
        dpsTimer.current = 0;
      }

      // 6. Handle Monster Defeated
      let nextMonster: Monster | null = null;
      let nextFloor = state.currentFloor;
      let nextMonstersDefeated = state.monstersDefeatedOnFloor;
      let isBoss = state.isBossFloor;

      if (monsterDied) {
        // Collect rewards
        const goldMult = getGoldMultiplier();
        goldGained = Math.round(
          state.monster.goldReward * goldMult * (1 + state.shards * 0.02),
        ); // +2% gold per shard
        essenceGained = state.monster.essenceReward;

        const expMult = getExpMultiplier();
        expGained = Math.round(state.monster.level * 10 * expMult);

        // Progress
        if (state.isBossFloor) {
          // Boss cleared! Go to next floor
          nextFloor = state.currentFloor + 1;
          nextMonstersDefeated = 0;
          isBoss = false;
          addCombatEvent(
            "level_up",
            `Этаж ${state.currentFloor} пройден! Спуск на этаж ${nextFloor}.`,
          );
        } else {
          nextMonstersDefeated += 1;
          if (nextMonstersDefeated >= state.monstersRequiredForFloor) {
            if (state.autoFightBoss) {
              isBoss = true; // Spawn boss
              addCombatEvent(
                "boss_spawn",
                `⚠️ Появился Босс: ${state.monster.name}!`,
              );
            } else {
              // Stay on floor but reset defeat counter to loop
              nextMonstersDefeated = 0;
            }
          }
        }

        // Reset timers for next monster
        heroAttackTimer.current = 0;
        monsterAttackTimer.current = 0;

        // Generate next monster
        nextMonster = generateMonster(nextFloor, isBoss);
      }

      // 7. Handle Hero Death
      if (heroDied) {
        currentHeroHp = state.hero.maxHp;

        // If hero dies on boss or high floor, retreat 1 floor for safety
        if (state.isBossFloor || state.currentFloor > 1) {
          nextFloor = Math.max(1, state.currentFloor - 1);
          isBoss = false;
          nextMonstersDefeated = 0;
          addCombatEvent(
            "monster_dead",
            `💀 Герой погиб! Отступление на этаж ${nextFloor}.`,
          );
        } else {
          addCombatEvent("monster_dead", `💀 Герой погиб! Восстановление сил.`);
        }

        heroAttackTimer.current = 0;
        monsterAttackTimer.current = 0;
        nextMonster = generateMonster(nextFloor, isBoss);
      }

      // 8. Handle Hero Experience & Level Up
      let nextExp = state.hero.exp;
      let nextNextExp = state.hero.nextLevelExp;
      const nextHeroStats = { ...state.hero };

      if (monsterDied && expGained > 0) {
        nextExp += expGained;
        if (nextExp >= nextNextExp) {
          nextExp -= nextNextExp;
          newLevel += 1;
          nextNextExp = Math.round(100 * Math.pow(1.22, newLevel - 1));

          // Level up stats boost (+10% stats base)
          nextHeroStats.level = newLevel;
          nextHeroStats.maxHp = Math.round(nextHeroStats.maxHp * 1.08) + 10;
          currentHeroHp = nextHeroStats.maxHp; // fully heal
          nextHeroStats.attack = Math.round(nextHeroStats.attack * 1.08) + 2;
          nextHeroStats.defense += 1;
          nextHeroStats.regen = Number((nextHeroStats.regen + 0.2).toFixed(1));

          setTimeout(
            () =>
              addCombatEvent(
                "level_up",
                `✨ Уровень повышен! Теперь вы на ${newLevel} уровне.`,
              ),
            30,
          );
        }
      }

      // Update state in one batch
      setState((prev) => {
        // Hydrate hero state changes
        const updatedHero: Hero = {
          ...prev.hero,
          level: newLevel,
          exp: nextExp,
          nextLevelExp: nextNextExp,
          currentHp: currentHeroHp,
          maxHp: nextHeroStats.maxHp,
          attack: nextHeroStats.attack,
          defense: nextHeroStats.defense,
          attackSpeed: nextHeroStats.attackSpeed,
          critChance: nextHeroStats.critChance,
          regen: nextHeroStats.regen,
        };

        // Combine logs
        const newLogs = [...prev.combatEvents];

        if (heroHitCreated && prev.monster) {
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

        if (hpHealed > 0 && currentHeroHp < prev.hero.maxHp) {
          newLogs.unshift({
            id: `evt_reg_${Date.now()}`,
            type: "hero_heal",
            value: `+${hpHealed}`,
            timestamp: Date.now(),
          });
        }

        return {
          ...prev,
          hero: updatedHero,
          monster:
            nextMonster ||
            (prev.monster ? { ...prev.monster, currentHp: monsterHp } : null),
          gold: prev.gold + goldGained,
          essence: prev.essence + essenceGained,
          currentFloor: nextFloor,
          monstersDefeatedOnFloor: nextMonstersDefeated,
          isBossFloor: isBoss,
          skills: updatedSkills,
          dps: currentDps,
          combatEvents: newLogs.slice(0, 30),
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [
    state.monster,
    state.hero,
    state.skills,
    state.artifacts,
    state.currentFloor,
    state.isBossFloor,
    state.autoFightBoss,
    state.dps,
    state.monstersDefeatedOnFloor,
    state.shards,
    state.monstersRequiredForFloor,
    getSpeedMultiplier,
    getDamageMultiplier,
    getGoldMultiplier,
    getExpMultiplier,
  ]);

  return {
    state,
    castSkill,
    buyUpgrade,
    buyArtifact,
    setActiveTab,
    setAutoFightBoss,
    prestige,
  };
};
