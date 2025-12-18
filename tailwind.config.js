const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  mode: "jit",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...fontFamily.sans],
      },
      borderRadius: {
        DEFAULT: "8px",
        secondary: "6px",
        container: "16px",
        xl: "20px",
      },
      boxShadow: {
        DEFAULT: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)",
        glow: "0 0 20px rgba(59, 130, 246, 0.15)",
        "glow-lg": "0 0 40px rgba(59, 130, 246, 0.2)",
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)",
      },
      colors: {
        // Ocean-inspired primary palette
        ocean: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        // Sophisticated slate for text and backgrounds
        slate: {
          25: "#fcfcfd",
          50: "#f8fafc",
          75: "#f5f7fa",
        },
        primary: {
          DEFAULT: "#0ea5e9",
          hover: "#0284c7",
          light: "#e0f2fe",
        },
        secondary: {
          DEFAULT: "#64748b",
          hover: "#475569",
        },
        accent: {
          DEFAULT: "#06b6d4",
          hover: "#0891b2",
        },
        success: {
          DEFAULT: "#10b981",
          light: "#d1fae5",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#fef3c7",
        },
        danger: {
          DEFAULT: "#ef4444",
          light: "#fee2e2",
        },
      },
      spacing: {
        "form-field": "14px",
        section: "28px",
        18: "4.5rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        shimmer: "shimmer 2s infinite",
        "wave-slow": "wave 25s linear infinite",
        "wave-medium": "wave 20s linear infinite reverse",
        "wave-fast": "wave 15s linear infinite",
        "wave-fastest": "wave 10s linear infinite reverse",
        "chillwave": "chillwave 1.5s linear infinite",
        "sail": "sail 20s linear infinite",
        "sail-once": "sail 40s linear forwards",
        "bob": "bob 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        wave: {
          "0%": { transform: "translateX(0) translateZ(0)" },
          "100%": { transform: "translateX(-50%) translateZ(0)" },
        },
        chillwave: {
          "0%": {
            transform: "translateX(0)",
            strokeDashoffset: "0"
          },
          "100%": {
            transform: "translateX(-64px)",
            strokeDashoffset: "64"
          },
        },
        sail: {
          "0%": { transform: "translateX(-100px)" },
          "100%": { transform: "translateX(calc(100vw + 100px))" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0) rotate(-3deg)" },
          "25%": { transform: "translateY(-6px) rotate(0deg)" },
          "50%": { transform: "translateY(0) rotate(3deg)" },
          "75%": { transform: "translateY(-6px) rotate(0deg)" },
        },
      },
    },
  },
  plugins: [],
};
