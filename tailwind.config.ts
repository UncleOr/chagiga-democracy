import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-heebo)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd3ff",
          300: "#8eb6ff",
          400: "#598dff",
          500: "#3563ff",
          600: "#1e40f5",
          700: "#172fe1",
          800: "#1929b6",
          900: "#1b298f",
        },
        gold: {
          400: "#f5c518",
          500: "#e0ac00",
          600: "#b98a00",
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
