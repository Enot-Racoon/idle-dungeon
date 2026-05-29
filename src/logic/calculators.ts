import type { Artifact, Skill, MonsterEntity } from "../types/ecs";

export const getSpeedMultiplier = (skills: Skill[]): number => {
  const frenzy = skills.find((s) => s.id === "skl_frenzy");
  return frenzy && frenzy.activeDuration > 0 ? frenzy.effectValue : 1;
};

export const getGoldMultiplier = (skills: Skill[], artifacts: Artifact[], shards: number): number => {
  const midas = skills.find((s) => s.id === "skl_greed");
  const midasMult = midas && midas.activeDuration > 0 ? midas.effectValue : 1;
  const coinArt = artifacts.find((a) => a.id === "art_coin");
  const artMult = 1 + (coinArt ? coinArt.level * coinArt.effectValue : 0);
  const shardsMult = 1 + shards * 0.02;
  return midasMult * artMult * shardsMult;
};

export const getDamageMultiplier = (artifacts: Artifact[], monster: MonsterEntity | null): number => {
  const dmgArt = artifacts.find((a) => a.id === "art_sigil");
  let mult = 1 + (dmgArt ? dmgArt.level * dmgArt.effectValue : 0);
  if (monster?.isBoss) {
    const slayerArt = artifacts.find((a) => a.id === "art_slayer");
    mult += slayerArt ? slayerArt.level * slayerArt.effectValue : 0;
  }
  return mult;
};

export const getExpMultiplier = (artifacts: Artifact[]): number => {
  const expArt = artifacts.find((a) => a.id === "art_tome");
  return 1 + (expArt ? expArt.level * expArt.effectValue : 0);
};

export const getPrestigeMultiplier = (shards: number): number => {
  return 1 + shards * 0.05;
};
