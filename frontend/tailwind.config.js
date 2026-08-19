/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        memorae: {
          bg: "#060919",            // Deep Big Bang Cosmic Void Background
          surface: "#0A102F",       // Big Bang Surface Card
          card: "#0E163D",          // Elevated Big Bang Card
          border: "#172554",        // Big Bang Slate Border
          purple: "#7C3AED",        // Big Bang Cosmic Violet
          cyan: "#06B6D4",          // Big Bang Hyper Cyan
          amber: "#F59E0B",         // Big Bang Golden Ember
          "purple-hover": "#6D28D9",
          "purple-light": "#E0E7FF",
          green: "#10B981",
          red: "#F43F5E"
        }
      },
      fontFamily: {
        sans: ['Figtree', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
