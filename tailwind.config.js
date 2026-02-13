const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans KR"', 'sans-serif'],
      },
      colors: {
        blue: {
            50:  '#EBF8FF',
            100: '#DBF1FF',
            200: '#BDE5FF',
            300: '#93D3FF',
            400: '#69C1FF',
            500: '#3D9BE9', // Your primary
            600: '#2686D1',
            700: '#1C6AA9',
            800: '#125082',
            900: '#0B365B',
        },
        accentBlue: '#3D9BE9',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
};
