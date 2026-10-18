import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    extend: {
      colors: {
        ink: "#392c23",
        accent: "#b65324",
        stone: {
          50: "#faf6ef", 100: "#f3ece2", 200: "#e9ddce", 300: "#d8c8b5",
          400: "#a18b77", 500: "#7d6b5c", 600: "#695447", 700: "#574233",
          800: "#3c2e25", 900: "#2e2018"
        }
      },
      borderRadius: { md: "0.75rem", lg: "1.25rem", xl: "1.5rem" },
      boxShadow: {
        sm: "0 3px 12px -5px rgb(88 55 27 / 0.12)",
        xl: "0 20px 60px -18px rgb(74 43 22 / 0.25)"
      }
    }
  },
  plugins: []
} satisfies Config;
