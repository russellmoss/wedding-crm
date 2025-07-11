/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'winery-beige': '#f5f1e3',
        'winery-brown': '#3e2f1c',
      },
      fontFamily: {
        'cochin': ['Cochin', 'serif'],
        'avenir': ['Avenir', 'sans-serif'],
      }
    },
  },
  plugins: [],
}