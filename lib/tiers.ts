import type { Tier } from "./types";

export interface TierInfo {
  id: Tier;
  name: string;
  priceMyr: number;
  priceLabel: string;
  priceIdEnv: string;        // env var name holding the Stripe price ID
  perks: string[];
  badge?: string;
}

// Plan catalogue. Keep in sync with the Stripe products.
export const TIERS: Record<Exclude<Tier, "free">, TierInfo> = {
  basic: {
    id: "basic",
    name: "Basic",
    priceMyr: 9.99,
    priceLabel: "RM9.99",
    priceIdEnv: "NEXT_PUBLIC_STRIPE_PRICE_BASIC",
    perks: [
      "Unlimited lives",
      "All levels 1–10",
      "Quiz Blitz, True/False, Scenario, Spot the Violation, Decision",
    ],
  },
  extended: {
    id: "extended",
    name: "Extended",
    priceMyr: 19.9,
    priceLabel: "RM19.90",
    priceIdEnv: "NEXT_PUBLIC_STRIPE_PRICE_EXTENDED",
    perks: [
      "Everything in Basic",
      "Levels 11–20",
      "Boss Battle mode",
      "Weekly Ranked challenges",
    ],
    badge: "POPULAR",
  },
  full: {
    id: "full",
    name: "Full",
    priceMyr: 29.9,
    priceLabel: "RM29.90",
    priceIdEnv: "NEXT_PUBLIC_STRIPE_PRICE_FULL",
    perks: [
      "Everything in Extended",
      "All levels (no cap)",
      "HR Compliance Certificate",
      "Personal analytics dashboard",
    ],
    badge: "BEST VALUE",
  },
};

const RANK: Record<Tier, number> = { free: 0, basic: 1, extended: 2, full: 3 };

/** Highest level the tier can play. */
export function tierMaxLevel(tier: Tier): number {
  return { free: 4, basic: 10, extended: 20, full: 99 }[tier];
}

/** Boss Battle is gated to Extended and above. */
export function tierAllowsBoss(tier: Tier): boolean {
  return RANK[tier] >= RANK.extended;
}

/** Free users have refilling lives; paid tiers have unlimited play. */
export function tierUnlimitedLives(tier: Tier): boolean {
  return tier !== "free";
}

/** Returns true if `tier` is at least `min`. */
export function tierAtLeast(tier: Tier, min: Tier): boolean {
  return RANK[tier] >= RANK[min];
}

/** Resolve which Stripe price ID corresponds to a tier (read at runtime in browser). */
export function priceIdForTier(tier: Exclude<Tier, "free">): string | undefined {
  // We can't index process.env dynamically in a type-safe way at build time,
  // so we read the explicit NEXT_PUBLIC_ vars.
  switch (tier) {
    case "basic":
      return process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC;
    case "extended":
      return process.env.NEXT_PUBLIC_STRIPE_PRICE_EXTENDED;
    case "full":
      return process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL;
  }
}
