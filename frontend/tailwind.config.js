/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          100: "#0b0f15",
          200: "#0f131a",
          300: "#1e2430",
          400: "#2a3340",
          500: "#3c4a5a",
        },
      },
    },
  },
  plugins: [],
};
