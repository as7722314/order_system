import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff8df",
          100: "#ffefb0",
          500: "#d49a1f",
          600: "#b87913",
          700: "#8d560d"
        },
        scallion: {
          50: "#eef8dc",
          100: "#d6ebb0",
          600: "#4d7d20",
          700: "#365c18"
        },
        griddle: {
          50: "#fffaf0",
          100: "#f4e2bc",
          800: "#3a2814"
        }
      }
    }
  },
  plugins: []
} satisfies Config;
