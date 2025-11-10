/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0C8B47',
          light: '#31C26A',
          dark: '#05642F'
        }
      },
      fontFamily: {
        display: ['"Inter var"', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      boxShadow: {
        glow: '0 10px 40px rgba(12, 139, 71, 0.2)'
      }
    }
  },
  plugins: []
};

