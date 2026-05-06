import type { Mode } from "./types";

// Big emoji-as-icon for that "app, not webpage" vibe.
// Keeps `iconPath` for back-compat — but ModesGrid renders `iconEmoji` first.

export const MODES: Mode[] = [
  {
    id: "blitz",
    name: "Quiz Blitz",
    tag: "5 questions · 15s each",
    desc: "Five questions, 15 seconds each. Fast brain wins. No second guesses.",
    minLevel: 1,
    iconPath: "",
    iconEmoji: "⚡",
  },
  {
    id: "tf",
    name: "True / False Rush",
    tag: "8 statements · 8s each",
    desc: "Eight rapid-fire statements. T or F? Trust your gut, beat the clock.",
    minLevel: 1,
    iconPath: "",
    iconEmoji: "✅",
  },
  {
    id: "scenario",
    name: "Scenario Mode",
    tag: "3 cases · no timer",
    desc: "Real workplace messes. Pick the response that won't get you sued.",
    minLevel: 2,
    iconPath: "",
    iconEmoji: "🤔",
  },
  {
    id: "violation",
    name: "Spot the Violation",
    tag: "3 cases · Pro only",
    desc: "Something's off in this workplace. Find which law just got broken.",
    minLevel: 1,
    premium: true,
    iconPath: "",
    iconEmoji: "🚨",
  },
  {
    id: "decision",
    name: "Choose Your Path",
    tag: "2 dilemmas · Pro only",
    desc: "Choose-your-own-HR-disaster. Every option scores differently.",
    minLevel: 1,
    premium: true,
    iconPath: "",
    iconEmoji: "🧭",
  },
  {
    id: "boss",
    name: "Survival Mode",
    tag: "3 brutal cases · 1 life · Pro",
    desc: "How far can you survive as HR? One wrong call and it's over.",
    minLevel: 1,
    premium: true,
    iconPath: "",
    iconEmoji: "⚔️",
  },
];
