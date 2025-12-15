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
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F78C3A',
          600: '#E67729',
          700: '#C65D1F',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
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
        sans: [
          'Pretendard Variable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'Apple SD Gothic Neo',
          'system-ui',
          'Roboto',
          'Helvetica Neue',
          'Segoe UI',
          'Noto Sans KR',
          'Malgun Gothic',
          'sans-serif',
        ],
      },
      fontSize: {
        // Display - 대형 제목
        'display-1': ['3.5rem', { 
          lineHeight: '1.1', 
          fontWeight: '800',
          letterSpacing: '-0.02em',
        }],
        'display-2': ['2.75rem', { 
          lineHeight: '1.2', 
          fontWeight: '800',
          letterSpacing: '-0.01em',
        }],
        
        // Heading - 섹션 제목
        'heading-1': ['2rem', { 
          lineHeight: '1.3', 
          fontWeight: '700',
          letterSpacing: '-0.01em',
        }],
        'heading-2': ['1.625rem', { 
          lineHeight: '1.4', 
          fontWeight: '700',
        }],
        'heading-3': ['1.375rem', { 
          lineHeight: '1.5', 
          fontWeight: '600',
        }],
        'heading-4': ['1.125rem', { 
          lineHeight: '1.5', 
          fontWeight: '600',
        }],
        
        // Body - 본문
        'body-lg': ['1.125rem', { 
          lineHeight: '1.7',
          fontWeight: '400',
        }],
        'body': ['1rem', { 
          lineHeight: '1.6',
          fontWeight: '400',
        }],
        'body-sm': ['0.875rem', { 
          lineHeight: '1.5',
          fontWeight: '400',
        }],
        
        // Caption - 작은 텍스트
        'caption': ['0.75rem', { 
          lineHeight: '1.4',
          fontWeight: '400',
        }],
        'caption-sm': ['0.6875rem', { 
          lineHeight: '1.3',
          fontWeight: '400',
        }],
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'md': '0 2px 4px rgba(0, 0, 0, 0.06)',
        'lg': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'xl': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'hover': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'inner': 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
      },
      spacing: {
        'section': '48px',
        'card': '24px',
        'element': '16px',
        'tight': '8px',
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
      // 그라데이션은 최소화 - 페이지 헤더에만 허용
      backgroundImage: {
        'gradient-orange': 'linear-gradient(135deg, #F78C3A 0%, #E67729 100%)',
      },
    },
  },
  plugins: [],
}
