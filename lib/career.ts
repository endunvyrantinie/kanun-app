// Career progression — 8 tiers × 10 levels each = 80 max.
// Free users cap at Level 20 (HR Associate). Pro unlocks the rest.

export interface CareerTier {
  minLevel: number;
  title: string;
  short: string;
  proOnly?: boolean;
}

export const FREE_LEVEL_CAP = 20;

export const CAREER_TIERS: CareerTier[] = [
  { minLevel: 1, title: "HR Intern", short: "Intern" },
  { minLevel: 11, title: "HR Associate", short: "Associate" },
  { minLevel: 21, title: "HR Officer", short: "Officer", proOnly: true },
  { minLevel: 31, title: "HR Senior", short: "Senior", proOnly: true },
  { minLevel: 41, title: "HR Manager", short: "Manager", proOnly: true },
  { minLevel: 51, title: "HR Senior Manager", short: "Senior Manager", proOnly: true },
  { minLevel: 61, title: "HR Director", short: "Director", proOnly: true },
  { minLevel: 71, title: "HR Director General", short: "DG", proOnly: true },
];

export function careerTitle(level: number): string {
  for (let i = CAREER_TIERS.length - 1; i >= 0; i--) {
    if (level >= CAREER_TIERS[i].minLevel) return CAREER_TIERS[i].title;
  }
  return CAREER_TIERS[0].title;
}

export function careerShort(level: number): string {
  for (let i = CAREER_TIERS.length - 1; i >= 0; i--) {
    if (level >= CAREER_TIERS[i].minLevel) return CAREER_TIERS[i].short;
  }
  return CAREER_TIERS[0].short;
}

export function nextCareerTier(level: number): CareerTier | null {
  for (const t of CAREER_TIERS) {
    if (t.minLevel > level) return t;
  }
  return null;
}

export function isPromotion(before: number, after: number): boolean {
  for (const t of CAREER_TIERS) {
    if (before < t.minLevel && after >= t.minLevel) return true;
  }
  return false;
}

/** What the user actually sees as their level — capped to 20 for free users. */
export function effectiveLevel(rawLevel: number, tier: string): number {
  if (tier === "free") return Math.min(FREE_LEVEL_CAP, rawLevel);
  return rawLevel;
}
