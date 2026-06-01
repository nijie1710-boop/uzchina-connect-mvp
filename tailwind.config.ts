import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#061F43",
          700: "#082A57",
          600: "#0B3A72"
        },
        gold: "#D6A84F",
        teal: "#0F766E",
        page: "#F6F8FB",
        line: "#E5E7EB"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)",
        strong: "0 24px 60px rgba(15, 23, 42, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
