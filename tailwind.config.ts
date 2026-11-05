import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        merz: {
          navy: "#1B365D",
          teal: "#007A78",
          cyan: "#0EA5E9",
          gold: "#C5A059",
          light: "#F0FDFA",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
