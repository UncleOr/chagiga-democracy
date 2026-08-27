import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-heebo)", "system-ui", "sans-serif"],
      },
      colors: {
        // Stately navy-blue
        brand: {
          50: "#eff3f8",
          100: "#dae5f0",
          200: "#b6cade",
          300: "#88a6c5",
          400: "#5a80a6",
          500: "#3a6087",
          600: "#294a6a",
          700: "#1f3852",
          800: "#182c40",
          900: "#122032",
        },
        // Turquoise accent
        teal: {
          50: "#edf7f5",
          100: "#d3ece8",
          300: "#7fccc2",
          400: "#4bb2a6",
          500: "#2f9788",
          600: "#237a6e",
        },
        // Warm beige / brass accent
        sand: {
          100: "#f5f0e6",
          200: "#e9ddc7",
          300: "#d8c39c",
          400: "#c3a878",
          500: "#a98d5e",
          600: "#8a7248",
        },
        // Kept for existing usages — muted brass, not electric yellow
        gold: {
          400: "#c3a878",
          500: "#a98d5e",
          600: "#8a7248",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(16,24,40,.06), 0 1px 2px rgba(16,24,40,.10)",
        soft: "0 4px 24px rgba(16,24,40,.08)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
