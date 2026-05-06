// Career progression — maps player level to a human HR role title.

export interface CareerTier {
  minLevel: number;
  title: string;
  short: string;
}

export const CAREER_TIERS: CareerTier[] = [
  { minLevel: 1, title: "HR Intern", short: "Intern" },
  { minLevel: 3, title: "HR Assistant", short: "Assistant" },
  { minLevel: 5, title: "HR Associate", short: "Associate" },
  { minLevel: 8, title: "HR Officer", short: "Officer" },
  { minLevel: 11, title: "HR Manager", short: "Manager" },
  { minLevel: 15, title: "HR Senior Manager", short: "Senior Manager" },
  { minLevel: 18, title: "HR Director", short: "Director" },
  { minLevel: 22, title: "HR Director General", short: "DG" },
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

/** Returns the next career tier the player will reach, if any. */
export function nextCareerTier(level: number): CareerTier | null {
  for (const t of CAREER_TIERS) {
    if (t.minLevel > level) return t;
  }
  return null;
}

/** True if levelling from `before` to `after` crosses a career milestone. */
export function isPromotion(before: number, after: number): boolean {
  for (const t of CAREER_TIERS) {
    if (before < t.minLevel && after >= t.minLevel) return true;
  }
  return false;
}
