import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FAF8FF",
        surface: "#FFFFFF",
        "surface-2": "#F3F0FA",
        ink: "#1A1530",
        "ink-2": "#3D3559",
        muted: "#7A7095",
        line: "#EAE4F5",
        "line-2": "#D8CFEC",
        accent: "#7C3AED",
        "accent-soft": "#EDE9FE",
        "accent-deep": "#5B21B6",
        good: "#0E9F6E",
        "good-soft": "#E6F6F0",
        bad: "#DC2626",
        "bad-soft": "#FDECEC",
        gold: "#C8961D",
        sun: "#FBBF24",
        sky: "#0EA5E9",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
