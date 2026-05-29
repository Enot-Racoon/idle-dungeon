import type { Skill } from "../../types/game";
import type { HealthComponent } from "../../types/ecs";

export const updateSkillsCooldowns = (skills: Skill[], dt: number): Skill[] => {
  return skills.map((s) => {
    let cd = s.currentCooldown;
    let dur = s.activeDuration;
    if (cd > 0) cd = Math.max(0, cd - dt);
    if (dur > 0) dur = Math.max(0, dur - dt);
    return { ...s, currentCooldown: cd, activeDuration: dur };
  });
};

export const updateHeroRegen = (health: HealthComponent, dt: number, timerRef: { regen: number }): { currentHp: number, hpHealed: number } => {
  let currentHeroHp = health.currentHp;
  let hpHealed = 0;
  
  timerRef.regen += dt;
  if (timerRef.regen >= 1.0) {
    timerRef.regen -= 1.0;
    if (currentHeroHp < health.maxHp) {
      const heal = health.regen;
      currentHeroHp = Math.min(health.maxHp, currentHeroHp + heal);
      hpHealed = heal;
    }
  }
  
  return { currentHp: currentHeroHp, hpHealed };
};
