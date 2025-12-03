/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // idus Brand - 포인트 컬러로만 사용
        idus: {
          DEFAULT: '#F78C3A',
          50: '#FFF8F3',
          100: '#FFEDD5',
          500: '#F78C3A',
          600: '#E67729',
        },
        // Primary - 중립적 다크 톤
        primary: {
          DEFAULT: '#1F2937',
          light: '#F9FAFB',
          dark: '#111827',
        },
        // Neutral Gray Scale
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        // Status Colors
        success: {
          DEFAULT: '#059669',
          light: '#ECFDF5',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEF2F2',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FFFBEB',
        },
        info: {
          DEFAULT: '#2563EB',
          light: '#EFF6FF',
        },
        // Chart Colors
        chart: {
          blue: '#3B82F6',
          green: '#10B981',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
          rose: '#F43F5E',
          amber: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Noto Sans KR', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'md': '0 2px 4px rgba(0, 0, 0, 0.06)',
        'lg': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'xl': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
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
