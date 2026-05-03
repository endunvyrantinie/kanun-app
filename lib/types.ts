// Shared types for the Kanun app

export type Law = "EA1955" | "Sabah" | "Sarawak";
export type Topic =
  | "wages"
  | "hours"
  | "leave"
  | "termination"
  | "recruitment"
  | "compliance";
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type QType = "mcq" | "tf" | "scenario" | "violation" | "decision";
export type SkillKey =
  | "recruitment"
  | "termination"
  | "compliance"
  | "leave"
  | "wages";
export type ModeId =
  | "blitz"
  | "tf"
  | "scenario"
  | "violation"
  | "decision"
  | "boss";

export interface DecisionOption {
  label: string;
  score: number;
  why: string;
}

export interface Question {
  id: string;
  type: QType;
  law: Law;
  topic: Topic;
  diff: Difficulty;
  text?: string;
  setup?: string;
  who?: string;
  options: string[] | DecisionOption[];
  answer?: number;
  why?: string;
}

export type Tier = "free" | "basic" | "extended" | "full";

export interface GameState {
  xp: number;
  level: number;
  lives: number;
  streak: number;
  lastPlayed: string | null;
  premium: boolean;          // Convenience: true if tier !== "free"
  tier: Tier;                // Detailed plan
  purchasedAt?: string;      // ISO timestamp of last upgrade
  skill: Record<SkillKey, number>;
  badges: string[];
  bestQuiz: number;
}

export interface Mode {
  id: ModeId;
  name: string;
  tag: string;
  desc: string;
  minLevel: number;
  premium?: boolean;
  iconPath: string;
}
