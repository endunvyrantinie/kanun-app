import type { Tier } from "./types";

// Single-tier model. "free" = limited; "pro" = unlocks everything.

export interface TierInfo {
  id: "pro";
  name: string;
  priceMyr: number;
  priceLabel: string;
  perks: string[];
  badge?: string;
}

export const PRO: TierInfo = {
  id: "pro",
  name: "Kanun Pro",
  priceMyr: 10.9,
  priceLabel: "RM10.90",
  perks: [
    "Unlimited lives — never wait to play",
    "All 6 modes including Boss Battle",
    "All levels (1 to 22+)",
    "All jurisdictions (EA1955, Sabah, Sarawak)",
    "Streak protection",
    "One-time payment, yours forever",
  ],
};

// Treat anything that isn't explicitly "free" as a paid tier.
// This protects users who already paid under the old basic/extended/full model.
export function isPaid(tier: Tier | string): boolean {
  return tier !== "free";
}

export function tierAllowsBoss(tier: Tier | string): boolean {
  return tier !== "free";
}

export function tierUnlimitedLives(tier: Tier | string): boolean {
  return tier !== "free";
}

/** Resolve the Pro price ID from env. */
export function proPriceId(): string | undefined {
  return process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
}
