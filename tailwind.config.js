/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: "#ffd700",
        "gold-muted": "#b8962e",
        plum: "#2a0a3d",
        "plum-mid": "#4b1257",
        "plum-dark": "#1c0630",
        rose: "#b02a5b",
        cream: "#fdf6ec",
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        body: ["Jost", "DM Sans", "sans-serif"],
      },
      letterSpacing: {
        widest: "0.35em",
      },
    },
  },
  plugins: [],
};
