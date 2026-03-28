import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // 'class' mode — Tailwind NEVER auto-applies dark styles
  // so it won't override our #020203 background
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
