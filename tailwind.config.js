/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",   // ← 必須！これがないとクラスが検出されません
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};