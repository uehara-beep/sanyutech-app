/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app': {
          'bg': '#1c1c1e',
          'bg-light': '#2c2c2e',
          'card': '#3c3c3e',
          'card-hover': '#4c4c4e',
          'border': '#4c4c4e',
          'primary': '#F97316',
          'primary-dark': '#EA580C',
          'success': '#10b981',
          'warning': '#f59e0b',
          'danger': '#ef4444',
        }
      },
      fontFamily: {
        'sans': ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
