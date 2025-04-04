/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", // Checks the root index.html
    "./src/**/*.{js,ts,jsx,tsx}", // Checks all JS/TS/JSX/TSX files in src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}