/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#1c1c1e",
          secondary: "#2c2c2e",
          elevated: "#3a3a3c",
        },
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.06)",
          hover: "rgba(255, 255, 255, 0.1)",
          border: "rgba(255, 255, 255, 0.08)",
          "border-visible": "rgba(255, 255, 255, 0.14)",
        },
        text: {
          primary: "#f5f5f7",
          secondary: "#8e8e93",
          tertiary: "#48484a",
        },
        accent: {
          DEFAULT: "#0a84ff",
          dim: "rgba(10, 132, 255, 0.15)",
          blue: "#0a84ff",
          green: "#30d158",
          red: "#ff453a",
          yellow: "#ffd60a",
          purple: "#bf5af2",
          orange: "#ff9f0a",
        },
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
