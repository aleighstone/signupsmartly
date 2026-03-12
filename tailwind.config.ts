import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: "#FAF9F6",
        charcoal: "#27272A",
        muted: "#71717A",
        sage: "#4ADE80",
        "sage-hover": "#22C55E",
        coral: "#F87171",
        surface: "#FFFFFF",
      },
      fontFamily: {
        heading: ["var(--font-quicksand)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.06)",
        "soft-md": "0 4px 12px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
