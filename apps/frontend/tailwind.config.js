/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "menu-in": {
          "0%": { opacity: "0", transform: "scale(0.92) translateY(-4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "scrim-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "dialog-in": {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "menu-in": "menu-in 180ms cubic-bezier(0.16, 1, 0.3, 1)",
        "scrim-in": "scrim-in 200ms ease-out",
        "dialog-in": "dialog-in 220ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
