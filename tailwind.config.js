/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        manor: {
          950: '#0a0708',
          900: '#110d0f',
          800: '#1c1418',
          700: '#2a1e23',
          600: '#3d2b32',
          500: '#5c3d47',
        },
        blood: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        candle: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        bone: {
          100: '#f5f0e8',
          200: '#ede4d0',
          300: '#d4c5a9',
          400: '#b8a48a',
        },
      },
      fontFamily: {
        gothic: ['Georgia', 'Cambria', 'serif'],
      },
      animation: {
        flicker: 'flicker 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
          '25%, 75%': { opacity: '0.93' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

