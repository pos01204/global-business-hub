/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // idus Brand Colors
        idus: {
          DEFAULT: '#F78C3A',
          50: '#FFF4EC',
          100: '#FFE8D6',
          200: '#FFD1AD',
          300: '#FFB87A',
          400: '#FFA45C',
          500: '#F78C3A',
          600: '#E67729',
          700: '#D56820',
          800: '#B85518',
          900: '#994512',
        },
        primary: {
          DEFAULT: '#F78C3A',
          light: '#FFF4EC',
          dark: '#E67729',
          darker: '#D56820',
        },
        secondary: {
          DEFAULT: '#2D3436',
          light: '#636E72',
        },
        accent: {
          DEFAULT: '#FF6B35',
          warm: '#F79F79',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#DBEAFE',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Noto Sans KR', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'orange': '0 4px 14px rgba(247, 140, 58, 0.25)',
        'orange-lg': '0 8px 25px rgba(247, 140, 58, 0.35)',
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '20px',
        '3xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-orange': 'linear-gradient(135deg, #F78C3A 0%, #FF6B35 100%)',
        'gradient-orange-soft': 'linear-gradient(135deg, #FFF4EC 0%, #FFFFFF 100%)',
        'gradient-orange-radial': 'radial-gradient(circle at top right, #FFF4EC 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
}
