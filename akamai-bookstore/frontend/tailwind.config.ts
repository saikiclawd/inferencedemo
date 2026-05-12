import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef9ec',
          100: '#fdf0ca',
          200: '#fbdf90',
          300: '#f9ca54',
          400: '#f7b52b',
          500: '#f19412',
          600: '#d56f0c',
          700: '#b14e0e',
          800: '#903d12',
          900: '#773312',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
