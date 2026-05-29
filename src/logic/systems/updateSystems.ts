import type { Skill, Hero } from "../../types/game";

export const updateSkillsCooldowns = (skills: Skill[], dt: number): Skill[] => {
  return skills.map((s) => {
    let cd = s.currentCooldown;
    let dur = s.activeDuration;
    if (cd > 0) cd = Math.max(0, cd - dt);
    if (dur > 0) dur = Math.max(0, dur - dt);
    return { ...s, currentCooldown: cd, activeDuration: dur };
  });
};

export const updateHeroRegen = (hero: Hero, dt: number, timerRef: { regen: number }): { currentHp: number, hpHealed: number } => {
  let currentHeroHp = hero.currentHp;
  let hpHealed = 0;
  
  timerRef.regen += dt;
  if (timerRef.regen >= 1.0) {
    timerRef.regen -= 1.0;
    if (currentHeroHp < hero.maxHp) {
      const heal = hero.regen;
      currentHeroHp = Math.min(hero.maxHp, currentHeroHp + heal);
      hpHealed = heal;
    }
  }
  
  return { currentHp: currentHeroHp, hpHealed };
};
