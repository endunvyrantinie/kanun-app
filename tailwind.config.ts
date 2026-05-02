import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAF7",
        surface: "#FFFFFF",
        "surface-2": "#F4F2EC",
        ink: "#0F0F12",
        "ink-2": "#2A2A2F",
        muted: "#6B6B72",
        line: "#E8E6E1",
        "line-2": "#D7D4CC",
        accent: "#FF5A1F",
        "accent-soft": "#FFF1EA",
        good: "#0E9F6E",
        "good-soft": "#E6F6F0",
        bad: "#DC2626",
        "bad-soft": "#FDECEC",
        gold: "#C8961D",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
