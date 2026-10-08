/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Segoe UI', 'sans-serif'],
        display: ['Outfit', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: { card: '0 18px 50px rgba(20,32,43,0.08)' },
    },
  },
  plugins: [],
};
