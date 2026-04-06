/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050915",
        ink: "#dce8f8",
        steel: "#95a7c3",
        ember: "#ff8a3d",
        gold: "#f4c15d",
        panel: "#11192a",
        line: "#23334d",
      },
      fontFamily: {
        body: ["Manrope", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(6, 10, 20, 0.45)",
        ember: "0 20px 50px rgba(255, 138, 61, 0.18)",
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
