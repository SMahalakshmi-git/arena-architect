/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        arena: {
          bg: "#0d0f1a",
          surface: "#141728",
          card: "#1a1f35",
          border: "#252b45",
          accent: "#e63946",
          gold: "#f4a261",
          green: "#2ec4b6",
          blue: "#4361ee",
          text: "#e2e8f0",
          muted: "#8892a4",
        },
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
