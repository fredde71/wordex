/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wordex: {
          bg: "#fbfaf7",
          paper: "#ffffff",
          ink: "#141414",
          muted: "#5b5b5b",
          line: "rgba(20,20,20,0.10)",
          accent: "#10b981",     // emerald
          accent2: "#0ea5e9"     // sky
        }
      },
      boxShadow: {
        soft: "0 12px 30px rgba(20,20,20,.10)",
        lift: "0 18px 45px rgba(20,20,20,.14)"
      }
    }
  },
  plugins: []
};
