import type { Mode } from "./types";

// SVG path data for icons (rendered inside <svg> with stroke="currentColor")
const PATHS = {
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  check: "M5 12 9 16 19 6",
  chat: "M21 15a4 4 0 0 1-4 4H8l-5 4V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z",
  search: "M21 21l-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z",
  lines: "M3 6h18M3 12h18M3 18h12",
  shield: "M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6z",
};

export const MODES: Mode[] = [
  {
    id: "blitz",
    name: "Quiz Blitz",
    tag: "5 questions · 15s each",
    desc: "Five timed multiple-choice questions. Speed earns bonus XP. Hesitation costs lives.",
    minLevel: 1,
    iconPath: PATHS.bolt,
  },
  {
    id: "tf",
    name: "True / False Rush",
    tag: "8 statements · 8s each",
    desc: "Fast statements about real Malaysian labour rules. Tap T or F before time runs out.",
    minLevel: 1,
    iconPath: PATHS.check,
  },
  {
    id: "scenario",
    name: "Scenario Challenge",
    tag: "3 cases · no timer",
    desc: "Read a workplace scenario, pick the best HR response. Tests judgment, not recall.",
    minLevel: 2,
    iconPath: PATHS.chat,
  },
  {
    id: "violation",
    name: "Spot the Violation",
    tag: "3 cases · Pro only",
    desc: "Read a scenario and identify which provision was breached.",
    minLevel: 1,
    premium: true,
    iconPath: PATHS.search,
  },
  {
    id: "decision",
    name: "Decision Simulator",
    tag: "2 dilemmas · Pro only",
    desc: "Branching HR dilemmas. Each option scores differently — see the rationale after.",
    minLevel: 1,
    premium: true,
    iconPath: PATHS.lines,
  },
  {
    id: "boss",
    name: "Boss Battle",
    tag: "3 brutal cases · Pro only",
    desc: "Hardest legal scenarios. One wrong answer ends the run.",
    minLevel: 1,
    premium: true,
    iconPath: PATHS.shield,
  },
];
