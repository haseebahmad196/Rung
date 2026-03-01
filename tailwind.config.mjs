/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg))",
        card: "rgb(var(--card))",
        text: "rgb(var(--text))",
        muted: "rgb(var(--muted))",
        accent: "rgb(var(--accent))",
        border: "rgb(var(--border) / 0.10)",
      },
      borderRadius: {
        xl: "var(--radius)",
      },
    },
  },
  plugins: [],
};

export default config;