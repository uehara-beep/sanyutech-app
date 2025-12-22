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
          'bg': '#F3F4F6',
          'bg-light': '#FFFFFF',
          'card': '#FFFFFF',
          'card-hover': '#F9FAFB',
          'border': '#E5E7EB',
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
