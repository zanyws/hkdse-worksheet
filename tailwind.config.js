/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif TC"', '"SimSun"', 'serif'],
        sans: ['"Noto Sans TC"', '"Microsoft JhengHei"', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f8f6f0',
          100: '#ede8d8',
          200: '#d9d0b8',
          300: '#c4b898',
          400: '#a99872',
          500: '#8a7a52',
          600: '#6e6040',
          700: '#524830',
          800: '#3a3222',
          900: '#221e14',
          950: '#110f0a',
        },
        vermillion: {
          50: '#fff1f0',
          100: '#ffe0de',
          200: '#ffc5c2',
          300: '#ff9e9a',
          400: '#ff6b65',
          500: '#f83b33',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      }
    },
  },
  plugins: [],
}
