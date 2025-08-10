/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f7f9ff',
          100: '#eef2ff',
          500: '#4f46e5',
          600: '#4338ca',
        },
      },
    },
  },
  plugins: [],
}