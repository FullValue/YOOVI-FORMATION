import type { Config } from "tailwindcss";

/* Tokens repris de yoovi.fr (public/yoovi-brand.css et src/styles/tokens.css du site) :
   violet #5046E5, encre #171717, gris #55515B, lavande #F2EBFF, jaune #FFD95A,
   et les deux teintes du logo (rose #FF64F5, bleu #0125C5). */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        violet: {
          50: "#F7F4FF",
          100: "#F2EBFF",
          200: "#E9E1FB",
          300: "#C9C2F7",
          400: "#8B83EE",
          500: "#5046E5",
          600: "#4238C9",
          700: "#3329A6",
          800: "#251E7A",
          900: "#18134F",
        },
        ink: { DEFAULT: "#171717", soft: "#2B2735", muted: "#55515B", faint: "#8A8594" },
        rose: { 100: "#FFE5FD", 300: "#FFA6F9", 500: "#FF64F5", 600: "#E43FD9" },
        bleu: { 100: "#E1E7FF", 500: "#0125C5", 600: "#001C99" },
        jaune: { 100: "#FFF6D6", 300: "#FFE58F", 500: "#FFD95A", 700: "#9A7400" },
        menthe: { 100: "#DDF7EC", 500: "#1FAE77", 700: "#11704C" },
        corail: { 100: "#FFE4DE", 500: "#F0603F", 700: "#B23A1F" },
        ligne: "#E9E1FB",
      },
      fontFamily: {
        display: ["var(--font-display)", "Plus Jakarta Sans", "Arial", "sans-serif"],
        sans: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        reading: ["var(--font-reading)", "Inter Display", "Inter", "sans-serif"],
      },
      borderRadius: { "4xl": "2rem", "5xl": "2.5rem" },
      boxShadow: {
        // ombre douce violette de la pastille .yv-pill du site
        pill: "0 0.8px 0.8px -0.5px #b1abde42, 0 1.9px 1.9px -0.9px #b1abde42, 0 3.4px 3.4px -1.4px #b1abde40, 0 5.7px 5.7px -1.9px #b1abde3d, 0 9.2px 9.2px -2.3px #b1abde3b, 0 15px 15px -2.8px #b1abde36, 0 25.8px 25.8px -3.3px #b1abde2b",
        card: "0 1px 0 #ffffff inset, 0 0 0 1px #ece6fb, 0 10px 30px -12px #38204c26",
        lift: "0 1px 0 #ffffff inset, 0 0 0 1px #e2d9fa, 0 24px 48px -20px #38204c40",
        // bouton principal du site (ombre intérieure en relief)
        button: "0 1.3px 0.5px -0.6px #0000000d, 0 3.2px 1.3px -1.25px #0000000d, 0 5.8px 2.3px -1.9px #0000000d, 0 9.7px 3.9px -2.5px #0000000a, 0 15.6px 6.2px -3.1px #0000000a, inset 0 -8px 14px #1c0f0f55",
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "none" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": { from: { opacity: "0", transform: "scale(.96)" }, to: { opacity: "1", transform: "none" } },
        float: { "0%,100%": { transform: "translateY(0) rotate(0)" }, "50%": { transform: "translateY(-14px) rotate(3deg)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "pop": { "0%": { transform: "scale(.6)", opacity: "0" }, "60%": { transform: "scale(1.12)", opacity: "1" }, "100%": { transform: "scale(1)" } },
      },
      animation: {
        "fade-up": "fade-up .5s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in .4s ease both",
        "scale-in": "scale-in .25s cubic-bezier(.2,.7,.2,1) both",
        float: "float 7s ease-in-out infinite",
        pop: "pop .5s cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
