/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: '#ff6b6b',
        dark: '#08081a',
        panel: '#0c0c1e',
      }
    },
  },
  plugins: [],
}
