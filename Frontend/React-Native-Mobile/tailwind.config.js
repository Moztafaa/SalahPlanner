/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#13ec5b",
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        "background-light": "#f6f8f6",
        "background-dark": "#102216",
        "surface-dark": "#1c2e21",
        "border-dark": "#2a4030",
        background: {
          light: "#f6f8f6",
          dark: "#102216",
          gray: "#f9fafb",
        },
        surface: {
          light: "#ffffff",
          dark: "#1c2e21",
          highlight: "#1f3629",
        },
        text: {
          primary: "#111827",
          secondary: "#6b7280",
          tertiary: "#9ca3af",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
