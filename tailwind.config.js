/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette brand SAM (estratta dal Visual System)
        sam: {
          green: "#1F4D3D",      // Primario
          "green-dark": "#4a6358",
          brown: "#5A2A20",      // Secondario
          cream: "#F4E9D7",      // Sfondo caldo
          paper: "#FBF8F2",      // Sfondo base
          orange: "#E0734F",     // Accento
          terracotta: "#B14B36",
          coral: "#C75D4A",
          yellow: "#F2B441",     // Accento vivace
          muted: "#9aa39d",
          // Sub-brand "SAM for Work" (coworking): bordeaux professionale.
          // NB: il rosso-allarme resta `coral`, riservato agli errori.
          work: "#7A2E3A",
          "work-dark": "#5C2230",
          "work-tint": "#F3E4E7",
        },
      },
      fontFamily: {
        display: ["var(--font-poppins)", "system-ui", "sans-serif"],
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 4px 20px -4px rgba(31, 77, 61, 0.12)",
        "card-hover": "0 12px 32px -8px rgba(31, 77, 61, 0.22)",
      },
    },
  },
  plugins: [],
};
