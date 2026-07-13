import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201b",
        accent: "#0f766e"
      }
    }
  },
  plugins: []
} satisfies Config;
