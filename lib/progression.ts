import type { SkillKey, Topic } from "./types";

// XP curve: level L requires (80 + (L - 1) * 40) XP
export function xpForLevel(level: number): number {
  return Math.round(80 + (level - 1) * 40);
}

export function totalXpToReach(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  let acc = 0;
  while (acc + xpForLevel(level) <= xp) {
    acc += xpForLevel(level);
    level++;
  }
  return level;
}

export function topicToSkill(topic: Topic): SkillKey {
  const map: Record<Topic, SkillKey> = {
    wages: "wages",
    hours: "wages",
    leave: "leave",
    termination: "termination",
    recruitment: "recruitment",
    compliance: "compliance",
  };
  return map[topic];
}

export function lawLabel(law: string): string {
  if (law === "EA1955") return "Employment Act 1955";
  if (law === "Sabah") return "Sabah Labour Ordinance";
  if (law === "Sarawak") return "Sarawak Labour Ordinance";
  return law;
}
