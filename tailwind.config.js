/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        festive: {
          red: '#dc2626',
          green: '#22c55e',
          gold: '#fbbf24',
          silver: '#94a3b8',
        },
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-from-bottom': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'zoom-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-from-top-2': 'slide-in-from-top 0.3s ease-out',
        'slide-in-from-bottom-2': 'slide-in-from-bottom 0.3s ease-out',
        'zoom-in': 'zoom-in 0.3s ease-out',
        'bounce-subtle': 'bounce-subtle 1s ease-in-out infinite',
        'festive-glow': 'festive-glow 2s ease-in-out infinite',
        'twinkle': 'twinkle 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}