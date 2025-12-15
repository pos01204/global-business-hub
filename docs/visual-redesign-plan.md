# 🎨 Global Business Hub 시각적 리뉴얼 계획서

**작성일**: 2024-12-19  
**목적**: 허브 전체의 시각적 디자인 시스템 고도화 및 현대화  
**범위**: 아이콘, 차트, 애니메이션, 디자인 시스템 전반

---

## 📋 현재 상태 분석

### 현재 사용 중인 기술 스택
- **스타일링**: Tailwind CSS
- **차트**: Chart.js (기본 라이브러리)
- **아이콘**: 이모지 (📊, 💰, 📦 등)
- **애니메이션**: 기본 CSS transitions
- **디자인 시스템**: 기본적인 컴포넌트 라이브러리

### 현재 한계점
1. **아이콘 시스템 부재**: 이모지 사용으로 일관성 및 확장성 부족
2. **차트 시각화 한계**: Chart.js 기본 스타일로 현대적 느낌 부족
3. **애니메이션 부족**: 기본 transition만 사용, 인터랙티브함 부족
4. **시각적 계층 구조**: 명확한 시각적 계층 구조 부재
5. **색상 시스템**: 기본적인 색상만 사용, 그라데이션 및 효과 부족
6. **타이포그래피**: 기본 폰트만 사용, 계층적 타이포그래피 부족
7. **공간감**: 레이아웃이 평면적, 깊이감 부족

---

## 🎯 리뉴얼 목표

### 1. 현대적이고 전문적인 디자인
- 업계 표준 디자인 시스템 도입
- 일관성 있는 시각적 언어 구축
- 전문적이면서도 접근하기 쉬운 UI
- **깔끔하고 미니멀한 디자인** (그라데이션 최소화)

### 2. 향상된 사용자 경험
- 직관적인 인터랙션
- 명확한 시각적 피드백
- 부드러운 애니메이션
- **툴팁 및 호버 효과 중심의 기능 개선**

### 3. 확장 가능한 디자인 시스템
- 재사용 가능한 컴포넌트
- 일관된 아이콘 시스템
- 체계적인 색상 및 타이포그래피
- **전체 페이지 통일성 확보**

### 4. 디자인 원칙
- **색상 단순화**: 제한된 색상 팔레트 사용 (주요 색상 3-4개)
- **그라데이션 최소화**: 단색 배경 우선, 필요한 경우에만 미묘한 그라데이션
- **일관성 우선**: 모든 페이지에서 동일한 디자인 패턴 적용
- **사용자 편의성**: 툴팁, 호버 효과, 인터랙티브 피드백 강화

---

## 🚀 리뉴얼 계획

## 1. 아이콘 시스템 구축

### 1.1 아이콘 라이브러리 선택

#### 옵션 1: Lucide React (추천) ⭐⭐⭐⭐⭐
**장점:**
- 1,000개 이상의 아이콘
- 일관된 디자인 스타일
- 가벼움 (Tree-shaking 지원)
- 커스터마이징 용이
- React 최적화

**설치:**
```bash
npm install lucide-react
```

**사용 예시:**
```tsx
import { TrendingUp, DollarSign, Package, Users } from 'lucide-react'

<TrendingUp className="w-5 h-5 text-orange-500" />
<DollarSign className="w-6 h-6 text-green-500" />
```

#### 옵션 2: Heroicons
- Tailwind CSS 공식 아이콘
- 2가지 스타일 (Outline, Solid)
- 가벼움

#### 옵션 3: React Icons
- 여러 아이콘 라이브러리 통합
- 매우 다양한 아이콘
- 용량이 큼

### 1.2 아이콘 컴포넌트 래퍼 생성

```tsx
// components/ui/Icon.tsx
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconProps {
  icon: LucideIcon
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
}

const variantMap = {
  default: 'text-slate-600 dark:text-slate-400',
  primary: 'text-orange-500 dark:text-orange-400',
  success: 'text-green-500 dark:text-green-400',
  warning: 'text-amber-500 dark:text-amber-400',
  danger: 'text-red-500 dark:text-red-400',
}

export function Icon({ 
  icon: IconComponent, 
  size = 'md', 
  className,
  variant = 'default'
}: IconProps) {
  return (
    <IconComponent 
      className={cn(sizeMap[size], variantMap[variant], className)}
      aria-hidden="true"
    />
  )
}
```

### 1.3 아이콘 매핑 시스템

```tsx
// lib/icon-mapping.ts
import { 
  TrendingUp, DollarSign, Package, Users, 
  BarChart3, PieChart, LineChart, Activity,
  AlertCircle, CheckCircle, XCircle, Info
} from 'lucide-react'

export const iconMap = {
  // 메트릭
  revenue: DollarSign,
  orders: Package,
  customers: Users,
  growth: TrendingUp,
  
  // 차트
  barChart: BarChart3,
  pieChart: PieChart,
  lineChart: LineChart,
  activity: Activity,
  
  // 상태
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
} as const
```

### 1.4 이모지 → 아이콘 마이그레이션 계획

| 현재 (이모지) | 새로운 아이콘 | 용도 |
|--------------|--------------|------|
| 📊 | BarChart3 | 차트, 분석 |
| 💰 | DollarSign | 매출, 금액 |
| 📦 | Package | 주문, 물류 |
| 👥 | Users | 고객, 사용자 |
| 📈 | TrendingUp | 성장, 증가 |
| 🚨 | AlertCircle | 알림, 경고 |
| ✅ | CheckCircle | 성공, 완료 |
| 🔍 | Search | 검색 |

---

## 2. 차트 시각화 고도화

### 2.1 차트 라이브러리 개선

#### 옵션 1: Recharts (추천) ⭐⭐⭐⭐⭐
**장점:**
- React 네이티브
- 커스터마이징 용이
- 애니메이션 내장
- 반응형 지원
- TypeScript 지원

**설치:**
```bash
npm install recharts
```

**사용 예시:**
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip 
      contentStyle={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: 'none',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
    />
    <Line 
      type="monotone" 
      dataKey="value" 
      stroke="#F78C3A" 
      strokeWidth={2}
      dot={{ fill: '#F78C3A', r: 4 }}
      activeDot={{ r: 6 }}
      animationDuration={1000}
    />
  </LineChart>
</ResponsiveContainer>
```

#### 옵션 2: Victory
- 강력한 커스터마이징
- 애니메이션 우수
- 학습 곡선 높음

#### 옵션 3: Nivo
- 아름다운 기본 스타일
- 다양한 차트 타입
- 인터랙티브 기능

### 2.2 커스텀 차트 테마

```tsx
// lib/chart-theme.ts
export const chartTheme = {
  colors: {
    primary: '#F78C3A',
    secondary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4',
  },
  grid: {
    stroke: '#E5E7EB',
    strokeWidth: 1,
    strokeDasharray: '3 3',
    opacity: 0.1,
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    padding: '12px',
  },
  animation: {
    duration: 1000,
    easing: 'ease-out',
  },
}
```

### 2.3 차트 컴포넌트 개선

```tsx
// components/charts/EnhancedLineChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { chartTheme } from '@/lib/chart-theme'

interface EnhancedLineChartProps {
  data: any[]
  dataKey: string
  name: string
  color?: string
  showArea?: boolean
  height?: number
}

export function EnhancedLineChart({
  data,
  dataKey,
  name,
  color = chartTheme.colors.primary,
  showArea = false,
  height = 300,
}: EnhancedLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      {showArea ? (
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...chartTheme.grid} />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip {...chartTheme.tooltip} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={`url(#gradient-${dataKey})`}
            strokeWidth={2}
            animationDuration={chartTheme.animation.duration}
          />
        </AreaChart>
      ) : (
        <LineChart data={data}>
          <CartesianGrid {...chartTheme.grid} />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip {...chartTheme.tooltip} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
            animationDuration={chartTheme.animation.duration}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  )
}
```

---

## 3. 애니메이션 및 인터랙션 강화

### 3.1 애니메이션 라이브러리 도입

#### Framer Motion (추천) ⭐⭐⭐⭐⭐
**장점:**
- React 최적화
- 선언적 API
- 성능 우수
- 다양한 애니메이션

**설치:**
```bash
npm install framer-motion
```

**사용 예시:**
```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>
```

### 3.2 공통 애니메이션 패턴

```tsx
// lib/animations.ts
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
}

export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.2 },
}

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}
```

### 3.3 인터랙티브 컴포넌트 개선

```tsx
// components/ui/InteractiveCard.tsx
import { motion } from 'framer-motion'
import { Card } from './Card'

interface InteractiveCardProps {
  children: React.ReactNode
  onClick?: () => void
  hover?: boolean
}

export function InteractiveCard({ children, onClick, hover = true }: InteractiveCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card>{children}</Card>
    </motion.div>
  )
}
```

---

## 4. 디자인 시스템 고도화

### 4.1 색상 시스템 - 단순화 및 통일성

#### 4.1.1 기본 색상 팔레트 (제한적 사용)
**원칙**: 화려함을 피하고 깔끔하고 전문적인 느낌 유지

```tsx
// tailwind.config.js 확장
colors: {
  // Primary: idus 브랜드 색상 (주요 액션, 강조)
  idus: {
    DEFAULT: '#F78C3A',
    50: '#FFF8F3',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F78C3A',  // 기본
    600: '#E67729',
    700: '#C65D1F',
  },
  
  // Neutral: 기본 텍스트 및 배경
  slate: {
    // Tailwind 기본 slate 사용
  },
  
  // Semantic: 상태 표시용 (제한적 사용)
  success: '#10B981',  // 성공, 정상
  warning: '#F59E0B',  // 경고, 주의
  danger: '#EF4444',   // 위험, 오류
  info: '#3B82F6',     // 정보 (최소 사용)
}
```

#### 4.1.2 색상 사용 가이드라인

**1. 주요 색상 (Primary)**
- **idus Orange (#F78C3A)**: 주요 액션 버튼, 링크, 강조 요소
- 사용 예: 버튼, 활성 탭, 중요한 메트릭

**2. 중립 색상 (Neutral)**
- **Slate 계열**: 텍스트, 배경, 경계선
- 사용 예: 본문 텍스트, 카드 배경, 구분선

**3. 시맨틱 색상 (Semantic)**
- **Success**: 성공 상태, 긍정적 변화
- **Warning**: 경고 상태, 주의 필요
- **Danger**: 위험 상태, 오류
- **Info**: 정보성 메시지 (최소 사용)

**4. 그라데이션 사용 규칙**
- **기본 원칙**: 그라데이션 사용 최소화
- **허용 예외**: 
  - 페이지 헤더 배경 (미묘한 단색 → 약간 어두운 단색)
  - 버튼 호버 효과 (단색 → 약간 어두운 단색)
- **금지**: 카드 배경, 텍스트 배경, 일반 UI 요소

#### 4.1.3 색상 적용 예시

```tsx
// ✅ 좋은 예: 단색 사용
<div className="bg-white border border-slate-200">
  <button className="bg-idus-500 hover:bg-idus-600 text-white">
    확인
  </button>
</div>

// ❌ 나쁜 예: 그라데이션 남용
<div className="bg-gradient-to-br from-blue-500 to-purple-600">
  <button className="bg-gradient-to-r from-orange-500 to-pink-500">
    확인
  </button>
</div>

// ✅ 허용되는 예: 미묘한 그라데이션 (헤더만)
<div className="bg-gradient-to-r from-idus-500 to-idus-600">
  {/* 페이지 헤더 */}
</div>
```

### 4.2 타이포그래피 시스템 - SUITE 폰트 적용

#### 4.2.1 SUITE 폰트 소개
**SUITE**는 UI에 특화된 한글 폰트로, 가독성과 일관성을 중시한 디자인입니다.

**특징:**
- 한글과 영문의 균형잡힌 조화
- 다양한 굵기 지원 (Light, Regular, Medium, SemiBold, Bold, ExtraBold, Heavy)
- Variable Font 지원 (가변 폰트)
- UI 요소에 최적화된 가독성

#### 4.2.2 폰트 파일 구조
```
font/
├── SUITE-Variable-woff2/     # Variable Font (추천)
│   ├── SUITE-Variable.woff2
│   └── SUITE-Variable.css
├── SUITE-otf/                 # 개별 폰트 파일
│   ├── SUITE-Light.otf
│   ├── SUITE-Regular.otf
│   ├── SUITE-Medium.otf
│   ├── SUITE-SemiBold.otf
│   ├── SUITE-Bold.otf
│   ├── SUITE-ExtraBold.otf
│   └── SUITE-Heavy.otf
└── SUITE-Variable-ttf/
    └── SUITE-Variable.ttf
```

#### 4.2.3 폰트 설치 및 적용

**1단계: 폰트 파일 복사**
```bash
# frontend/public/fonts 디렉토리 생성
mkdir -p frontend/public/fonts

# Variable Font 복사 (추천)
cp "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\font\SUITE-Variable-woff2\SUITE-Variable.woff2" frontend/public/fonts/

# 또는 개별 폰트 파일 복사
cp "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\font\SUITE-otf\*.otf" frontend/public/fonts/
```

**2단계: 폰트 CSS 정의**

**Option A: Variable Font 사용 (추천)**
```css
/* frontend/app/globals.css */
@font-face {
  font-family: 'SUITE';
  src: url('/fonts/SUITE-Variable.woff2') format('woff2');
  font-weight: 300 900;
  font-style: normal;
  font-display: swap;
}
```

**Option B: 개별 폰트 파일 사용**
```css
/* frontend/app/globals.css */
@font-face {
  font-family: 'SUITE';
  src: url('/fonts/SUITE-Light.otf') format('opentype');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'SUITE';
  src: url('/fonts/SUITE-Regular.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'SUITE';
  src: url('/fonts/SUITE-Medium.otf') format('opentype');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'SUITE';
  src: url('/fonts/SUITE-SemiBold.otf') format('opentype');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'SUITE';
  src: url('/fonts/SUITE-Bold.otf') format('opentype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'SUITE';
  src: url('/fonts/SUITE-ExtraBold.otf') format('opentype');
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'SUITE';
  src: url('/fonts/SUITE-Heavy.otf') format('opentype');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}
```

**3단계: Tailwind 설정 업데이트**
```tsx
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'SUITE',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
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
    },
  },
}
```

**4단계: 전역 스타일 적용**
```css
/* frontend/app/globals.css */
body {
  font-family: 'SUITE', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

#### 4.2.4 타이포그래피 사용 가이드

**계층 구조:**
```
Display (대형 제목)
  ├─ display-1: 56px / 800 / -0.02em
  └─ display-2: 44px / 800 / -0.01em

Heading (섹션 제목)
  ├─ heading-1: 32px / 700 / -0.01em
  ├─ heading-2: 26px / 700
  ├─ heading-3: 22px / 600
  └─ heading-4: 18px / 600

Body (본문)
  ├─ body-lg: 18px / 400 / 1.7
  ├─ body: 16px / 400 / 1.6
  └─ body-sm: 14px / 400 / 1.5

Caption (작은 텍스트)
  ├─ caption: 12px / 400 / 1.4
  └─ caption-sm: 11px / 400 / 1.3
```

**사용 예시:**
```tsx
// Display
<h1 className="text-display-1">대형 제목</h1>

// Heading
<h2 className="text-heading-1">섹션 제목</h2>
<h3 className="text-heading-2">하위 섹션</h3>

// Body
<p className="text-body-lg">큰 본문 텍스트</p>
<p className="text-body">일반 본문 텍스트</p>
<p className="text-body-sm">작은 본문 텍스트</p>

// Caption
<span className="text-caption">캡션 텍스트</span>
```

### 4.3 그림자 시스템 - 미묘하고 일관된 사용

```tsx
// tailwind.config.js
boxShadow: {
  // 기본 그림자 (일반 카드)
  'sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
  'md': '0 2px 4px rgba(0, 0, 0, 0.06)',
  'lg': '0 4px 12px rgba(0, 0, 0, 0.08)',
  'xl': '0 8px 24px rgba(0, 0, 0, 0.12)',
  
  // 호버 효과 (미묘한 그림자 증가)
  'hover': '0 4px 12px rgba(0, 0, 0, 0.1)',
  
  // 내부 그림자 (입력 필드 등)
  'inner': 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
  
  // Glow 효과 제거 (화려함 방지)
}
```

**그림자 사용 원칙:**
- 카드: `shadow-md` (기본), `shadow-lg` (호버)
- 버튼: `shadow-sm` (기본), `shadow-md` (호버)
- 모달/드로어: `shadow-xl`
- Glow 효과 사용 금지

---

## 5. 컴포넌트 개선

### 5.1 카드 컴포넌트 개선

```tsx
// components/ui/EnhancedCard.tsx
import { motion } from 'framer-motion'
import { Card } from './Card'

interface EnhancedCardProps {
  children: React.ReactNode
  variant?: 'default' | 'gradient' | 'bordered'
  hover?: boolean
  glow?: boolean
}

export function EnhancedCard({ 
  children, 
  variant = 'default',
  hover = false,
  glow = false
}: EnhancedCardProps) {
  const variants = {
    default: 'bg-white dark:bg-slate-800',
    gradient: 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800',
    bordered: 'bg-white dark:bg-slate-800 border-2 border-orange-200 dark:border-orange-800',
  }
  
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : {}}
      transition={{ duration: 0.2 }}
      className={`
        ${variants[variant]}
        ${glow ? 'shadow-glow' : 'shadow-lg'}
        rounded-xl p-6
        transition-all duration-200
      `}
    >
      {children}
    </motion.div>
  )
}
```

### 5.2 버튼 컴포넌트 개선 - 툴팁 및 호버 효과 강화

```tsx
// components/ui/EnhancedButton.tsx
import { motion } from 'framer-motion'
import { Button } from './Button'
import { Tooltip } from './Tooltip'

interface EnhancedButtonProps extends ButtonProps {
  tooltip?: string
  tooltipDelay?: number
}

export function EnhancedButton({ 
  tooltip,
  tooltipDelay = 300,
  ...props 
}: EnhancedButtonProps) {
  const button = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <Button {...props} />
    </motion.div>
  )
  
  if (tooltip) {
    return (
      <Tooltip content={tooltip} delay={tooltipDelay}>
        {button}
      </Tooltip>
    )
  }
  
  return button
}
```

**변경 사항:**
- `glow` 옵션 제거
- 툴팁 지원 추가
- 호버 효과 미묘하게 조정

### 5.3 KPI 카드 개선 - 툴팁 및 호버 정보 표시

```tsx
// components/ui/EnhancedKPICard.tsx
import { motion } from 'framer-motion'
import { Icon } from './Icon'
import { Tooltip } from './Tooltip'
import { TrendingUp, TrendingDown, Info } from 'lucide-react'
import { useState } from 'react'

interface EnhancedKPICardProps {
  title: string
  value: string | number
  change?: number
  icon?: LucideIcon
  tooltip?: string
  detailInfo?: string
}

export function EnhancedKPICard({
  title,
  value,
  change,
  icon,
  tooltip,
  detailInfo,
}: EnhancedKPICardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const isPositive = change && change > 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all group"
      onMouseEnter={() => setShowDetail(true)}
      onMouseLeave={() => setShowDetail(false)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </h3>
          {tooltip && (
            <Tooltip content={tooltip}>
              <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" />
            </Tooltip>
          )}
        </div>
        {icon && <Icon icon={icon} size="lg" variant="primary" />}
      </div>
      
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2"
      >
        {value}
      </motion.div>
      
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${
          isPositive ? 'text-success' : 'text-danger'
        }`}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{Math.abs(change)}%</span>
        </div>
      )}
      
      {/* 호버 시 상세 정보 표시 */}
      {showDetail && detailInfo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {detailInfo}
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
```

**개선 사항:**
- 그라데이션 배경 제거
- 단색 배경 + 테두리 사용
- 툴팁 지원 (정보 아이콘)
- 호버 시 상세 정보 표시
- 색상 단순화 (success/danger만 사용)

---

## 6. 레이아웃 및 그리드 시스템 고도화

### 6.1 그리드 시스템 설계 원칙

#### 6.1.1 기본 그리드 구조
- **컨테이너 최대 너비**: 1280px (xl), 1536px (2xl)
- **그리드 간격**: 24px (기본), 32px (큰 섹션)
- **컬럼 수**: 반응형 (모바일 1, 태블릿 2, 데스크톱 3-4)
- **여백**: 섹션 간 48px, 카드 간 24px

#### 6.1.2 반응형 브레이크포인트
```tsx
// tailwind.config.js
screens: {
  'sm': '640px',   // 모바일 가로
  'md': '768px',   // 태블릿
  'lg': '1024px',  // 데스크톱
  'xl': '1280px',  // 큰 데스크톱
  '2xl': '1536px', // 초대형 화면
}
```

### 6.2 그리드 컴포넌트 시스템

#### 6.2.1 기본 그리드 컴포넌트
```tsx
// components/layout/Grid.tsx
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GridProps {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const gapMap = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
}

export function Grid({ 
  children, 
  cols = { default: 1, md: 2, lg: 3 },
  gap = 'md',
  className 
}: GridProps) {
  const colClasses = [
    cols.default ? `grid-cols-${cols.default}` : 'grid-cols-1',
    cols.sm ? `sm:grid-cols-${cols.sm}` : '',
    cols.md ? `md:grid-cols-${cols.md}` : '',
    cols.lg ? `lg:grid-cols-${cols.lg}` : '',
    cols.xl ? `xl:grid-cols-${cols.xl}` : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={cn('grid', gapMap[gap], colClasses, className)}>
      {children}
    </div>
  )
}
```

#### 6.2.2 카드 그리드 컴포넌트
```tsx
// components/layout/CardGrid.tsx
import { Grid } from './Grid'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '@/lib/animations'

interface CardGridProps {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
  }
}

export function CardGrid({ children, cols = { default: 1, md: 2, lg: 3 } }: CardGridProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <Grid cols={cols} gap="lg">
        {React.Children.map(children, (child, index) => (
          <motion.div key={index} variants={fadeInUp}>
            {child}
          </motion.div>
        ))}
      </Grid>
    </motion.div>
  )
}
```

#### 6.2.3 비대칭 그리드 (Asymmetric Grid)
```tsx
// components/layout/AsymmetricGrid.tsx
interface AsymmetricGridProps {
  children: React.ReactNode
  layout?: 'feature' | 'sidebar' | 'split'
}

export function AsymmetricGrid({ 
  children, 
  layout = 'feature' 
}: AsymmetricGridProps) {
  const layouts = {
    feature: 'grid-cols-1 lg:grid-cols-3',
    sidebar: 'grid-cols-1 lg:grid-cols-4',
    split: 'grid-cols-1 lg:grid-cols-2',
  }

  return (
    <div className={cn('grid gap-6', layouts[layout])}>
      {children}
    </div>
  )
}
```

### 6.3 컨테이너 시스템

#### 6.3.1 페이지 컨테이너
```tsx
// components/layout/Container.tsx
import { cn } from '@/lib/utils'

interface ContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: boolean
  className?: string
}

const sizeMap = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[1280px]',
  full: 'max-w-full',
}

export function Container({ 
  children, 
  size = 'xl',
  padding = true,
  className 
}: ContainerProps) {
  return (
    <div className={cn(
      'mx-auto w-full',
      sizeMap[size],
      padding && 'px-4 sm:px-6 lg:px-8',
      className
    )}>
      {children}
    </div>
  )
}
```

#### 6.3.2 섹션 컴포넌트 개선
```tsx
// components/layout/Section.tsx
import { motion } from 'framer-motion'
import { Container } from './Container'
import { cn } from '@/lib/utils'

interface SectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  container?: boolean
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const spacingMap = {
  sm: 'mb-8',
  md: 'mb-12',
  lg: 'mb-16',
  xl: 'mb-24',
}

export function Section({ 
  title, 
  description, 
  children,
  container = true,
  containerSize = 'xl',
  spacing = 'md',
  className
}: SectionProps) {
  const content = (
    <>
      {(title || description) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          {title && (
            <h2 className="text-heading-1 text-slate-900 dark:text-slate-100 mb-3">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-body-lg text-slate-600 dark:text-slate-400 max-w-3xl">
              {description}
            </p>
          )}
        </motion.div>
      )}
      {children}
    </>
  )

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(spacingMap[spacing], className)}
    >
      {container ? (
        <Container size={containerSize}>
          {content}
        </Container>
      ) : (
        content
      )}
    </motion.section>
  )
}
```

### 6.4 레이아웃 패턴

#### 6.4.1 대시보드 레이아웃
```tsx
// components/layout/DashboardLayout.tsx
interface DashboardLayoutProps {
  header?: React.ReactNode
  sidebar?: React.ReactNode
  main: React.ReactNode
  footer?: React.ReactNode
}

export function DashboardLayout({ 
  header, 
  sidebar, 
  main, 
  footer 
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {header && (
        <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          {header}
        </header>
      )}
      
      <div className="flex-1 flex">
        {sidebar && (
          <aside className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            {sidebar}
          </aside>
        )}
        
        <main className="flex-1 p-6 lg:p-8">
          {main}
        </main>
      </div>
      
      {footer && (
        <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          {footer}
        </footer>
      )}
    </div>
  )
}
```

#### 6.4.2 카드 레이아웃 패턴
```tsx
// components/layout/CardLayout.tsx
interface CardLayoutProps {
  children: React.ReactNode
  variant?: 'default' | 'compact' | 'spacious'
}

const variantMap = {
  default: 'gap-6',
  compact: 'gap-4',
  spacious: 'gap-8',
}

export function CardLayout({ children, variant = 'default' }: CardLayoutProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3', variantMap[variant])}>
      {children}
    </div>
  )
}
```

### 6.5 공간 시스템 (Spacing System)

#### 6.5.1 일관된 간격 규칙
```tsx
// tailwind.config.js 확장
spacing: {
  // 기본 Tailwind spacing 유지
  // 추가 커스텀 간격
  'section': '48px',    // 섹션 간 간격
  'card': '24px',       // 카드 간 간격
  'element': '16px',    // 요소 간 간격
  'tight': '8px',       // 타이트한 간격
}
```

#### 6.5.2 간격 사용 가이드
```
섹션 간격: mb-section (48px)
카드 간격: gap-card (24px)
요소 간격: gap-element (16px)
타이트 간격: gap-tight (8px)
```

### 6.6 반응형 레이아웃 전략

#### 6.6.1 모바일 우선 접근
- 기본: 모바일 레이아웃 (1열)
- 태블릿 (md): 2열 그리드
- 데스크톱 (lg): 3-4열 그리드

#### 6.6.2 브레이크포인트별 최적화
```tsx
// 반응형 패턴 예시
<div className="
  grid 
  grid-cols-1          // 모바일: 1열
  sm:grid-cols-2      // 작은 태블릿: 2열
  md:grid-cols-3      // 태블릿: 3열
  lg:grid-cols-4      // 데스크톱: 4열
  xl:grid-cols-5      // 큰 데스크톱: 5열
  gap-4 sm:gap-6 lg:gap-8
">
```

### 6.7 그리드 사용 예시

#### 6.7.1 대시보드 KPI 카드
```tsx
<Section title="주요 지표" spacing="lg">
  <CardGrid cols={{ default: 1, sm: 2, lg: 4 }}>
    <KPICard title="매출" value="$125K" change={15} />
    <KPICard title="주문" value="1,234" change={8} />
    <KPICard title="고객" value="12,345" change={12} />
    <KPICard title="AOV" value="$102" change={-3} />
  </CardGrid>
</Section>
```

#### 6.7.2 차트 레이아웃
```tsx
<Section title="성과 분석" spacing="lg">
  <Grid cols={{ default: 1, lg: 2 }} gap="lg">
    <Card>
      <Chart title="매출 추이" />
    </Card>
    <Card>
      <Chart title="주문 추이" />
    </Card>
  </Grid>
</Section>
```

#### 6.7.3 비대칭 레이아웃
```tsx
<Section spacing="lg">
  <AsymmetricGrid layout="feature">
    <div className="lg:col-span-2">
      {/* 주요 콘텐츠 */}
    </div>
    <div>
      {/* 사이드바 */}
    </div>
  </AsymmetricGrid>
</Section>
```

---

## 7. 구현 로드맵

### Phase 1: 기반 구축 (1주)
1. **아이콘 시스템 도입**
   - [ ] Lucide React 설치
   - [ ] Icon 컴포넌트 생성
   - [ ] 아이콘 매핑 시스템 구축
   - [ ] 주요 페이지 이모지 → 아이콘 마이그레이션

2. **애니메이션 라이브러리 도입**
   - [ ] Framer Motion 설치
   - [ ] 공통 애니메이션 패턴 정의
   - [ ] 기본 컴포넌트에 애니메이션 적용

### Phase 2: 차트 개선 (1주)
3. **차트 라이브러리 교체**
   - [ ] Recharts 설치
   - [ ] 차트 테마 정의
   - [ ] 기존 Chart.js → Recharts 마이그레이션
   - [ ] 커스텀 차트 컴포넌트 생성

### Phase 3: 컴포넌트 개선 (1주)
4. **컴포넌트 고도화**
   - [ ] EnhancedCard 컴포넌트
   - [ ] EnhancedButton 컴포넌트
   - [ ] EnhancedKPICard 컴포넌트
   - [ ] 기존 컴포넌트 교체

### Phase 4: 디자인 시스템 확장 (1주)
5. **폰트 시스템 구축**
   - [ ] SUITE 폰트 파일 복사
   - [ ] @font-face 정의
   - [ ] Tailwind 폰트 설정 업데이트
   - [ ] 타이포그래피 시스템 구축
   - [ ] 전역 스타일 적용

6. **그리드 및 레이아웃 시스템 구축**
   - [ ] Grid 컴포넌트 생성
   - [ ] CardGrid 컴포넌트 생성
   - [ ] Container 컴포넌트 생성
   - [ ] Section 컴포넌트 개선
   - [ ] DashboardLayout 컴포넌트 생성
   - [ ] 반응형 레이아웃 테스트

7. **디자인 토큰 확장**
   - [ ] 색상 시스템 확장
   - [ ] 그림자 시스템 확장
   - [ ] 간격 시스템 정의
   - [ ] Tailwind 설정 업데이트

### Phase 5: 통합 및 최적화 (1주)
6. **전체 통합**
   - [ ] 모든 페이지에 새 디자인 적용
   - [ ] 성능 최적화
   - [ ] 접근성 검토
   - [ ] 반응형 디자인 검증

---

## 8. 예상 효과

### 시각적 개선
- ✅ **일관성**: 통일된 아이콘 시스템으로 일관된 시각적 언어
- ✅ **현대성**: 최신 디자인 트렌드 반영
- ✅ **전문성**: 전문적이고 신뢰감 있는 디자인

### 사용자 경험 개선
- ✅ **직관성**: 명확한 시각적 계층 구조
- ✅ **인터랙티브**: 부드러운 애니메이션과 피드백
- ✅ **가독성**: 개선된 타이포그래피와 색상

### 개발 효율성
- ✅ **재사용성**: 표준화된 컴포넌트
- ✅ **유지보수성**: 체계적인 디자인 시스템
- ✅ **확장성**: 쉽게 확장 가능한 구조

---

## 9. 기술 스택 요약

### 추가 설치 필요 패키지
```bash
# 아이콘
npm install lucide-react

# 차트
npm install recharts

# 애니메이션
npm install framer-motion

# 유틸리티
npm install clsx tailwind-merge
```

### 폰트 파일 준비
```bash
# SUITE 폰트 파일을 frontend/public/fonts/ 디렉토리에 복사
# Variable Font 사용 시:
# - SUITE-Variable.woff2

# 또는 개별 폰트 파일 사용 시:
# - SUITE-Light.otf
# - SUITE-Regular.otf
# - SUITE-Medium.otf
# - SUITE-SemiBold.otf
# - SUITE-Bold.otf
# - SUITE-ExtraBold.otf
# - SUITE-Heavy.otf
```

### 기존 패키지 유지
- Tailwind CSS
- React
- Next.js
- TypeScript

---

## 10. 참고 자료

### 디자인 시스템
- [Material Design](https://material.io/design)
- [Ant Design](https://ant.design/)
- [Chakra UI](https://chakra-ui.com/)

### 아이콘
- [Lucide Icons](https://lucide.dev/)
- [Heroicons](https://heroicons.com/)

### 차트
- [Recharts](https://recharts.org/)
- [Victory](https://formidable.com/open-source/victory/)

### 애니메이션
- [Framer Motion](https://www.framer.com/motion/)
- [React Spring](https://www.react-spring.dev/)

---

## 🎉 결론

이 리뉴얼 계획을 통해 Global Business Hub는:
1. **현대적이고 전문적인 디자인**을 갖추게 됩니다
2. **일관된 시각적 언어**로 사용자 경험이 향상됩니다
3. **확장 가능한 디자인 시스템**으로 유지보수가 쉬워집니다
4. **시각적으로 임팩트 있는** 인터페이스로 발표 효과가 극대화됩니다

**예상 소요 기간**: 5주  
**우선순위**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

---

## 11. SUITE 폰트 적용 상세 가이드

### 11.1 Variable Font vs 개별 폰트

#### Variable Font (추천) ⭐⭐⭐⭐⭐
**장점:**
- 단일 파일로 모든 굵기 지원
- 파일 크기 최적화
- 부드러운 굵기 조절 가능
- 최신 웹 표준

**단점:**
- 구형 브라우저 미지원 (하지만 대부분 지원)

#### 개별 폰트 파일
**장점:**
- 모든 브라우저 호환
- 필요한 굵기만 로드 가능

**단점:**
- 여러 파일 관리 필요
- 파일 크기 증가

### 11.2 폰트 최적화

#### 폰트 로딩 전략
```css
/* font-display: swap 사용 */
@font-face {
  font-display: swap; /* 폰트 로딩 중에도 텍스트 표시 */
}
```

#### 폰트 서브셋팅 (선택)
- 필요한 문자만 포함하여 파일 크기 감소
- 한글 + 영문 + 숫자 + 기본 특수문자 포함

### 11.3 폰트 성능 최적화

#### Preload
```html
<!-- next/head 또는 layout.tsx -->
<link
  rel="preload"
  href="/fonts/SUITE-Variable.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

#### 폰트 로딩 확인
```tsx
// lib/font-loader.ts
export function loadFont() {
  if ('fonts' in document) {
    const font = new FontFace('SUITE', 'url(/fonts/SUITE-Variable.woff2)')
    font.load().then(() => {
      document.fonts.add(font)
    })
  }
}
```

---

## 12. 그리드 시스템 사용 가이드

### 12.1 그리드 선택 가이드

| 용도 | 컴포넌트 | 컬럼 수 | 간격 |
|------|---------|--------|------|
| KPI 카드 | CardGrid | 1/2/4 | lg |
| 차트 | Grid | 1/2 | lg |
| 일반 카드 | CardGrid | 1/2/3 | md |
| 리스트 | Grid | 1 | md |
| 폼 | Grid | 1/2 | md |

### 12.2 반응형 전략

**모바일 우선:**
- 기본: 1열 (모든 콘텐츠 세로 배치)
- 태블릿: 2열 (중요한 콘텐츠 나란히)
- 데스크톱: 3-4열 (최대 활용)

**예외 케이스:**
- 테이블: 모바일에서 카드 형태로 변환
- 사이드바: 모바일에서 드로어로 변환
- 복잡한 대시보드: 모바일에서 탭으로 분리

### 12.3 레이아웃 패턴 예시

#### 패턴 1: 대시보드 메인
```
┌─────────────────────────────────────┐
│ Header (고정)                       │
├─────────────────────────────────────┤
│ Sidebar │ Main Content              │
│ (고정)  │ (스크롤)                   │
│         │                           │
│         │ ┌─────┬─────┬─────┐      │
│         │ │ KPI │ KPI │ KPI │      │
│         │ └─────┴─────┴─────┘      │
│         │                           │
│         │ ┌───────────┬───────────┐│
│         │ │  Chart 1  │  Chart 2  ││
│         │ └───────────┴───────────┘│
└─────────────────────────────────────┘
```

#### 패턴 2: 상세 페이지
```
┌─────────────────────────────────────┐
│ Header                               │
├─────────────────────────────────────┤
│ Breadcrumb                           │
├─────────────────────────────────────┤
│ Page Title                           │
│ Description                          │
├─────────────────────────────────────┤
│ ┌──────────────┬──────────────────┐ │
│ │ Main Content │ Sidebar          │ │
│ │              │                  │ │
│ │              │ - Info Card      │ │
│ │              │ - Actions        │ │
│ └──────────────┴──────────────────┘ │
└─────────────────────────────────────┘
```

#### 패턴 3: 리스트 페이지
```
┌─────────────────────────────────────┐
│ Header                               │
├─────────────────────────────────────┤
│ Filters (가로)                       │
├─────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │ Card │ │ Card │ │ Card │        │
│ └──────┘ └──────┘ └──────┘        │
│ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │ Card │ │ Card │ │ Card │        │
│ └──────┘ └──────┘ └──────┘        │
├─────────────────────────────────────┤
│ Pagination                           │
└─────────────────────────────────────┘
```

---

---

## 13. 페이지별 디자인 개선안

### 개선 원칙
- **페이지 특성에 맞는 최적화**: 각 페이지의 목적과 사용 패턴에 맞게 디자인 적용
- **일관된 디자인 시스템**: 공통 컴포넌트와 스타일 유지
- **점진적 개선**: 기존 기능 유지하면서 시각적 개선
- **사용자 워크플로우 고려**: 각 페이지의 주요 작업 흐름에 맞는 레이아웃

---

### 13.1 대시보드 페이지 (`/dashboard`)

#### 현재 상태
- KPI 카드 6개 (이모지 사용)
- Chart.js 기반 트렌드 차트
- 성과 분석 요약 + Business Brain 요약
- 오늘 할 일 + 물류 파이프라인
- 빠른 이동 링크

#### 개선 방향
**목적**: 한눈에 핵심 정보 파악, 빠른 의사결정 지원

**개선안:**

1. **KPI 카드 개선**
   ```tsx
   // 이모지 → Lucide 아이콘
   - 💰 → DollarSign
   - 📦 → Package
   - 👥 → Users
   - 📊 → BarChart3
   - 🎨 → Palette
   - 🚚 → Truck
   
   // 시각적 개선
   - 숫자 카운트업 애니메이션 (Framer Motion)
   - 변화율에 따른 색상 강조 (success/danger만)
   - 호버 시 상세 정보 표시 (툴팁 또는 확장 영역)
   - 단색 배경 (그라데이션 제거)
   - 툴팁 추가 (정보 아이콘)
   ```

2. **차트 개선**
   ```tsx
   // Chart.js → Recharts
   - 더 부드러운 애니메이션
   - 커스텀 툴팁 디자인
   - 인터랙티브 기능 강화
   - 반응형 개선
   ```

3. **레이아웃 개선**
   ```tsx
   // 그리드 시스템 적용
   - KPI 카드: CardGrid (1/2/3/6 열 반응형)
   - 요약 섹션: AsymmetricGrid (feature 레이아웃)
   - 섹션 간 간격: 일관된 spacing 시스템
   ```

4. **시각적 계층 구조**
   ```tsx
   // 중요도별 시각적 강조
   - 긴급 알림: 상단 배너 (펄스 효과)
   - 주요 KPI: 큰 카드, 강조 색상
   - 보조 정보: 작은 카드, 중립 색상
   ```

**구현 예시:**
```tsx
<Section title="주요 지표" spacing="lg">
  <CardGrid cols={{ default: 1, sm: 2, lg: 3, xl: 6 }} gap="md">
    <EnhancedKPICard
      title="GMV"
      value={formatCurrency(data.kpis.gmv.value)}
      change={data.kpis.gmv.change}
      icon={DollarSign}
      color="orange"
    />
    {/* ... */}
  </CardGrid>
</Section>
```

---

### 13.2 Business Brain 페이지 (`/business-brain`)

#### 현재 상태
- 탭 기반 구조 (12개 탭)
- AI 브리핑 카드
- 건강도 점수 표시
- 다양한 차트 (Line, Bar, Doughnut, Radar, Heatmap)
- What-if 시뮬레이션
- 리포트 생성

#### 개선 방향
**목적**: 경영 인사이트 제공, 전략적 의사결정 지원

**개선안:**

1. **탭 네비게이션 개선**
   ```tsx
   // 탭 디자인 개선
   - 아이콘 추가 (Lucide)
   - 활성 탭 강조 (밑줄 + 색상)
   - 탭 그룹화 (분석 / 전략 / 도구)
   - 스크롤 가능한 탭 (모바일)
   ```

2. **브리핑 카드 개선**
   ```tsx
   // EnhancedCard 적용
   - 단색 배경 (그라데이션 제거)
   - 브리핑 텍스트 가독성 향상
   - 품질 점수 시각화 개선 (단색 배경)
   - 액션 버튼 추가
   - 툴팁 추가 (품질 점수 설명)
   ```

3. **건강도 점수 시각화**
   ```tsx
   // Radar Chart 개선
   - Recharts RadarChart 사용
   - 4차원 점수 시각화
   - 애니메이션 효과
   - 상세 정보 드릴다운
   ```

4. **인사이트 카드**
   ```tsx
   // 인사이트 리스트 개선
   - 카드 형태로 표시
   - 중요도별 색상 구분
   - 액션 버튼 통합
   - 필터링 및 정렬 기능
   ```

5. **차트 통일성**
   ```tsx
   // 모든 차트를 Recharts로 통일
   - 일관된 테마 적용
   - 커스텀 툴팁
   - 드릴다운 기능
   - 반응형 개선
   ```

**구현 예시:**
```tsx
<Section title="AI 경영 브리핑" spacing="lg">
  <EnhancedCard variant="gradient" glow>
    <div className="flex items-center justify-between mb-4">
      <Icon icon={Brain} size="lg" variant="primary" />
      <Badge variant="success">품질 점수: 85</Badge>
    </div>
    <p className="text-body-lg">{briefing.summary}</p>
  </EnhancedCard>
</Section>
```

---

### 13.3 성과 분석 페이지 (`/analytics`)

#### 현재 상태
- 탭 기반 구조
- Chart.js 차트
- 테이블 형태 데이터
- 필터링 기능

#### 개선 방향
**목적**: 상세 성과 분석, 트렌드 파악

**개선안:**

1. **탭 구조 개선**
   ```tsx
   // 탭 그룹화
   - Overview (종합)
   - Performance (성과)
   - Trends (트렌드)
   - Comparison (비교)
   ```

2. **차트 개선**
   ```tsx
   // Recharts로 교체
   - Area Chart (트렌드)
   - Bar Chart (비교)
   - Line Chart (시계열)
   - 커스텀 테마 적용
   ```

3. **필터 UI 개선**
   ```tsx
   // 필터 섹션 개선
   - 드롭다운 → Select 컴포넌트
   - 날짜 선택기 개선
   - 필터 칩 표시
   - 필터 초기화 버튼
   ```

4. **테이블 개선**
   ```tsx
   // DataTable 컴포넌트 개선
   - 정렬 기능 시각화
   - 페이지네이션 개선
   - 행 선택 기능
   - 내보내기 버튼
   ```

**구현 예시:**
```tsx
<Section title="성과 분석" spacing="lg">
  <div className="mb-6">
    <FilterBar
      dateRange={dateRange}
      country={country}
      onFilterChange={handleFilter}
    />
  </div>
  
  <Grid cols={{ default: 1, lg: 2 }} gap="lg">
    <Card>
      <EnhancedLineChart
        data={trendData}
        dataKey="gmv"
        name="GMV 추이"
        showArea
      />
    </Card>
    <Card>
      <EnhancedBarChart
        data={comparisonData}
        dataKey="orders"
        name="주문 비교"
      />
    </Card>
  </Grid>
</Section>
```

---

### 13.4 미입고 관리 페이지 (`/unreceived`)

#### 현재 상태
- 리스트 형태
- 경과일 배지
- 필터링 기능
- 상태 업데이트 기능

#### 개선 방향
**목적**: 긴급 이슈 빠른 파악 및 처리

**개선안:**

1. **우선순위 시각화**
   ```tsx
   // 위험도별 색상 강조
   - 14일+ : 빨강 (긴급)
   - 7일+ : 주황 (주의)
   - 3일+ : 노랑 (관찰)
   - 그 외: 회색 (정상)
   
   // 카드 형태로 표시
   - 위험도 높은 항목 상단 배치
   - 배지 디자인 개선
   - 진행 상황 표시
   ```

2. **필터 UI 개선**
   ```tsx
   // 필터 바 개선
   - 토글 버튼 형태
   - 필터 칩 표시
   - 검색 기능 강화
   - 저장된 필터 프리셋
   ```

3. **액션 버튼 개선**
   ```tsx
   // 상태 업데이트 UI
   - 드롭다운 메뉴
   - 빠른 액션 버튼
   - 일괄 처리 기능
   - 진행 상황 표시
   ```

4. **리스트 아이템 개선**
   ```tsx
   // 카드 형태 리스트
   - 호버 효과
   - 클릭 시 상세 정보
   - 빠른 액션 버튼
   - 메모 기능 강화
   ```

**구현 예시:**
```tsx
<Section title="미입고 관리" spacing="lg">
  <FilterBar
    delay={delayFilter}
    search={searchTerm}
    bundle={bundleFilter}
    onFilterChange={handleFilter}
  />
  
  <CardGrid cols={{ default: 1, md: 2, lg: 3 }} gap="md">
    {filteredOrders.map(order => (
      <UnreceivedCard
        key={order.orderCode}
        order={order}
        priority={getPriority(order.days)}
        onStatusUpdate={handleUpdate}
      />
    ))}
  </CardGrid>
</Section>
```

---

### 13.5 물류 추적 페이지 (`/logistics`)

#### 현재 상태
- 주문 리스트
- 상태 배지
- 타임라인 표시
- 국가별 필터

#### 개선 방향
**목적**: 물류 상태 추적, 이슈 조기 발견

**개선안:**

1. **타임라인 시각화**
   ```tsx
   // 타임라인 컴포넌트
   - 수직 타임라인
   - 단계별 아이콘
   - 진행 상황 표시
   - 예상 완료일 표시
   ```

2. **상태 배지 개선**
   ```tsx
   // 상태별 색상 및 아이콘
   - 결제 완료: CheckCircle (파랑)
   - 작가 발송: Package (초록)
   - 검수 대기: Search (보라)
   - 국제배송: Plane (인디고)
   - 배송 완료: CheckCircle2 (초록)
   ```

3. **필터 개선**
   ```tsx
   // 다중 필터 지원
   - 국가 필터 (다중 선택)
   - 상태 필터 (다중 선택)
   - 날짜 범위 필터
   - 검색 기능
   ```

4. **리스트 아이템 개선**
   ```tsx
   // 확장 가능한 카드
   - 기본 정보만 표시
   - 클릭 시 상세 정보 확장
   - 타임라인 표시
   - 추적 링크 통합
   ```

**구현 예시:**
```tsx
<Section title="물류 추적" spacing="lg">
  <FilterBar
    countries={selectedCountries}
    statuses={selectedStatuses}
    dateRange={dateRange}
    onFilterChange={handleFilter}
  />
  
  <div className="space-y-4">
    {orders.map(order => (
      <LogisticsCard
        key={order.orderCode}
        order={order}
        expanded={expandedOrders.has(order.orderCode)}
        onToggle={handleToggle}
      >
        <Timeline events={order.timelineEvents} />
      </LogisticsCard>
    ))}
  </div>
</Section>
```

---

### 13.6 물류 관제 센터 페이지 (`/control-tower`)

#### 현재 상태
- 파이프라인 5단계 시각화
- 위험 주문 목록
- 단계별 통계

#### 개선 방향
**목적**: 전체 물류 파이프라인 한눈에 파악

**개선안:**

1. **파이프라인 시각화 개선**
   ```tsx
   // 인터랙티브 파이프라인
   - 단계별 카드 (호버 효과)
   - 진행 상황 애니메이션
   - 병목 구간 강조
   - 클릭 시 상세 정보
   ```

2. **단계별 카드 개선**
   ```tsx
   // EnhancedCard 적용
   - 그라데이션 배경
   - 숫자 카운트업
   - 위험도 표시
   - 빠른 액션 버튼
   ```

3. **위험 주문 강조**
   ```tsx
   // 위험 주문 섹션
   - 상단 고정 (스티키)
   - 펄스 효과
   - 빠른 처리 버튼
   - 일괄 액션
   ```

4. **통계 대시보드**
   ```tsx
   // 요약 통계 카드
   - 전체 처리 중 주문
   - 평균 처리 시간
   - 병목 구간
   - 트렌드 표시
   ```

**구현 예시:**
```tsx
<Section title="물류 관제 센터" spacing="xl">
  {/* 위험 주문 배너 */}
  {criticalOrders.length > 0 && (
    <AlertBanner
      variant="danger"
      title={`긴급: ${criticalOrders.length}건의 위험 주문`}
      actions={[
        { label: '전체 보기', href: '/unreceived?delay=critical' }
      ]}
    />
  )}
  
  {/* 파이프라인 시각화 */}
  <PipelineVisualization
    stages={pipelineData}
    onStageClick={handleStageClick}
  />
  
  {/* 단계별 상세 */}
  <Grid cols={{ default: 1, md: 2, lg: 5 }} gap="lg">
    {Object.entries(pipelineData).map(([key, stage]) => (
      <PipelineStageCard
        key={key}
        stage={stage}
        meta={STAGE_META[key]}
      />
    ))}
  </Grid>
</Section>
```

---

### 13.7 AI 어시스턴트 페이지 (`/chat`)

#### 현재 상태
- 채팅 인터페이스
- Agent 선택
- 빠른 질문 카테고리
- 차트 자동 생성

#### 개선 방향
**목적**: 자연스러운 대화, 직관적인 인터페이스

**개선안:**

1. **채팅 UI 개선**
   ```tsx
   // 메시지 버블 디자인
   - 사용자: 오른쪽, 파란색
   - AI: 왼쪽, 회색/보라색
   - 차트: 카드 형태로 표시
   - 액션 버튼: 인라인 배치
   ```

2. **Agent 선택 UI**
   ```tsx
   // Agent 카드 개선
   - 아이콘 + 설명
   - 호버 효과
   - 선택 상태 표시
   - 추천 Agent 하이라이트
   ```

3. **빠른 질문 개선**
   ```tsx
   // 카테고리별 그룹화
   - 아코디언 형태
   - 질문 카드 디자인
   - 클릭 시 자동 입력
   - 최근 질문 기록
   ```

4. **로딩 상태 개선**
   ```tsx
   // 로딩 애니메이션
   - 타이핑 효과
   - 진행 상황 표시
   - 단계별 피드백
   ```

5. **차트 표시 개선**
   ```tsx
   // 차트 카드
   - Recharts로 통일
   - 확대/축소 기능
   - 다운로드 버튼
   - 공유 기능
   ```

**구현 예시:**
```tsx
<Section title="AI 어시스턴트" container={false}>
  <div className="flex h-[calc(100vh-200px)]">
    {/* 사이드바 */}
    <aside className="w-64 border-r p-4">
      <AgentSelector
        agents={AGENT_META}
        selected={selectedAgent}
        onSelect={setSelectedAgent}
      />
      
      <QuickQuestions
        categories={QUICK_QUESTIONS}
        onSelect={handleQuickQuestion}
      />
    </aside>
    
    {/* 채팅 영역 */}
    <main className="flex-1 flex flex-col">
      <ChatMessages
        messages={messages}
        onAction={handleAction}
      />
      <ChatInput
        onSend={handleSend}
        loading={isLoading}
      />
    </main>
  </div>
</Section>
```

---

### 13.8 통합 검색 페이지 (`/lookup`)

#### 현재 상태
- 검색 입력
- 결과 리스트
- 다중 검색 기준

#### 개선 방향
**목적**: 빠른 검색, 정확한 결과 표시

**개선안:**

1. **검색 바 개선**
   ```tsx
   // 검색 UI 개선
   - 큰 검색 입력창
   - 자동완성 기능
   - 검색 히스토리
   - 필터 옵션 통합
   ```

2. **결과 표시 개선**
   ```tsx
   // 결과 카드
   - 타입별 아이콘
   - 하이라이트 표시
   - 빠른 액션 버튼
   - 관련 정보 표시
   ```

3. **필터 개선**
   ```tsx
   // 검색 타입 필터
   - 탭 형태
   - 다중 선택 가능
   - 결과 수 표시
   ```

**구현 예시:**
```tsx
<Section title="통합 검색" spacing="lg">
  <SearchBar
    placeholder="주문번호, 송장번호, 사용자 ID 검색..."
    onSearch={handleSearch}
    filters={searchTypes}
    autocomplete={true}
  />
  
  {results && (
    <SearchResults
      results={results}
      query={searchTerm}
      onItemClick={handleItemClick}
    />
  )}
</Section>
```

---

### 13.9 비용 분석 페이지 (`/cost-analysis`)

#### 현재 상태
- 탭 기반 구조
- 손익 대시보드
- 시뮬레이터
- 요금표

#### 개선 방향
**목적**: 비용 구조 파악, 최적화 방안 제시

**개선안:**

1. **대시보드 개선**
   ```tsx
   // KPI 카드
   - 총 비용
   - 평균 배송비
   - 비용 효율성
   - 트렌드 표시
   ```

2. **차트 개선**
   ```tsx
   // 비용 구조 시각화
   - 도넛 차트 (비용 구성)
   - 라인 차트 (트렌드)
   - 히트맵 (국가별)
   ```

3. **시뮬레이터 UI**
   ```tsx
   // 인터랙티브 입력
   - 슬라이더
   - 실시간 계산
   - 결과 비교
   - 시나리오 저장
   ```

**구현 예시:**
```tsx
<Section title="비용 분석" spacing="lg">
  <Tabs items={tabs} activeTab={activeTab} onChange={setActiveTab} />
  
  {activeTab === 'dashboard' && (
    <Grid cols={{ default: 1, lg: 2 }} gap="lg">
      <Card>
        <DoughnutChart data={costBreakdown} />
      </Card>
      <Card>
        <LineChart data={costTrend} />
      </Card>
    </Grid>
  )}
</Section>
```

---

### 13.10 고객 분석 페이지 (`/customer-analytics`)

#### 현재 상태
- 탭 기반 구조
- RFM 분석
- 코호트 분석
- LTV 분석

#### 개선 방향
**목적**: 고객 세그먼트 파악, 타겟팅 전략 수립

**개선안:**

1. **RFM 분석 시각화**
   ```tsx
   // RFM 매트릭스
   - 히트맵 형태
   - 세그먼트별 색상
   - 클릭 시 상세 정보
   - 필터링 기능
   ```

2. **코호트 차트 개선**
   ```tsx
   // 코호트 테이블
   - 단색 배경 (그라데이션 제거)
   - 호버 시 상세 정보 (툴팁)
   - 필터링 기능
   - 내보내기 기능
   ```

3. **LTV 시각화**
   ```tsx
   // LTV 분포 차트
   - 히스토그램
   - 평균/중앙값 표시
   - 세그먼트별 비교
   ```

**구현 예시:**
```tsx
<Section title="고객 분석" spacing="lg">
  <Tabs items={tabs} activeTab={activeTab} onChange={setActiveTab} />
  
  {activeTab === 'rfm' && (
    <Card>
      <HeatmapChart
        data={rfmMatrix}
        xLabel="Frequency"
        yLabel="Recency"
        colorScale="viridis"
      />
    </Card>
  )}
</Section>
```

---

### 13.11 작가 분석 페이지 (`/artist-analytics`)

#### 현재 상태
- 작가 리스트
- 상세 분석 탭
- 건강도 점수
- 성과 차트

#### 개선 방향
**목적**: 작가 성과 파악, 지원 전략 수립

**개선안:**

1. **작가 카드 개선**
   ```tsx
   // 작가 카드 디자인
   - 프로필 이미지
   - 건강도 점수 시각화
   - 주요 메트릭 표시
   - 빠른 액션 버튼
   ```

2. **랭킹 시각화**
   ```tsx
   // 랭킹 차트
   - Bar Chart (수평)
   - 순위 변화 표시
   - 필터링 기능
   ```

3. **상세 분석 탭**
   ```tsx
   // 탭 구조 개선
   - Overview (개요)
   - Performance (성과)
   - Products (상품)
   - Trends (트렌드)
   - Health (건강도)
   ```

**구현 예시:**
```tsx
<Section title="작가 분석" spacing="lg">
  <ArtistGrid
    artists={artists}
    onArtistClick={handleArtistClick}
    sortBy={sortBy}
  />
  
  {selectedArtist && (
    <ArtistDetailModal
      artist={selectedArtist}
      onClose={handleClose}
    />
  )}
</Section>
```

---

### 13.12 QC 관리 페이지 (`/qc`)

#### 현재 상태
- 탭 기반 구조
- 텍스트 QC
- 이미지 QC
- CSV 업로드

#### 개선 방향
**목적**: QC 작업 효율화, 품질 관리

**개선안:**

1. **QC 카드 디자인**
   ```tsx
   // QC 항목 카드
   - 상태 배지
   - 진행률 표시
   - 빠른 승인/거부 버튼
   - 상세 정보 모달
   ```

2. **이미지 뷰어 개선**
   ```tsx
   // 이미지 갤러리
   - 그리드 레이아웃
   - 라이트박스
   - 줌 기능
   - 배치 처리
   ```

3. **통계 대시보드**
   ```tsx
   // QC 통계
   - 승인율
   - 거부율
   - 평균 처리 시간
   - 트렌드 차트
   ```

---

### 13.13 마케터 페이지 (`/marketer`)

#### 현재 상태
- 마케팅 전략
- 콘텐츠 생성
- 캘린더

#### 개선 방향
**목적**: 마케팅 전략 수립, 콘텐츠 관리

**개선안:**

1. **전략 카드**
   ```tsx
   // 전략 시각화
   - 타임라인 형태
   - 진행 상황 표시
   - 성과 메트릭
   ```

2. **콘텐츠 생성 UI**
   ```tsx
   // 생성 인터페이스
   - 입력 폼 개선
   - 미리보기 기능
   - 변형 옵션
   - 저장/공유 기능
   ```

---

### 13.14 쿠폰 생성 페이지 (`/coupon-generator`)

#### 현재 상태
- 쿠폰 생성 폼
- 세그먼트 선택
- 일괄 발급

#### 개선 방향
**목적**: 쿠폰 생성 및 관리 효율화

**개선안:**

1. **생성 폼 개선**
   ```tsx
   // 단계별 폼
   - 스텝 인디케이터
   - 입력 검증
   - 미리보기
   - 저장 기능
   ```

2. **세그먼트 선택 UI**
   ```tsx
   // 세그먼트 카드
   - 시각적 표시
   - 통계 정보
   - 필터링 기능
   ```

---

### 13.15 정산 페이지 (`/settlement`)

#### 현재 상태
- 정산 리스트
- 필터링
- 내보내기

#### 개선 방향
**목적**: 정산 관리, 투명성 확보

**개선안:**

1. **정산 카드**
   ```tsx
   // 정산 항목 카드
   - 상태 표시
   - 금액 강조
   - 상세 정보
   - 액션 버튼
   ```

2. **통계 대시보드**
   ```tsx
   // 정산 통계
   - 총액
   - 미정산 금액
   - 완료율
   - 트렌드
   ```

---

## 14. 공통 컴포넌트 개선

### 14.1 페이지 헤더 컴포넌트

```tsx
// components/layout/PageHeader.tsx
interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  breadcrumb?: Array<{ label: string; href?: string }>
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  breadcrumb,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="w-12 h-12 bg-idus-500 rounded-xl flex items-center justify-center">
              <Icon icon={icon} size="lg" variant="default" className="text-white" />
            </div>
          )}
          <div>
            <h1 className="text-heading-1 text-slate-900 dark:text-slate-100">
              {title}
            </h1>
            {description && (
              <p className="text-body-sm text-slate-600 dark:text-slate-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </motion.div>
  )
}
```

### 14.2 필터 바 컴포넌트

```tsx
// components/ui/FilterBar.tsx
interface FilterBarProps {
  filters: FilterConfig[]
  values: Record<string, any>
  onChange: (key: string, value: any) => void
  onReset?: () => void
}

export function FilterBar({
  filters,
  values,
  onChange,
  onReset,
}: FilterBarProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {filters.map(filter => (
          <FilterItem
            key={filter.key}
            config={filter}
            value={values[filter.key]}
            onChange={(value) => onChange(filter.key, value)}
          />
        ))}
        {onReset && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            초기화
          </Button>
        )}
      </div>
    </div>
  )
}
```

### 14.3 데이터 테이블 컴포넌트

```tsx
// components/ui/DataTable.tsx
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  pagination?: boolean
  sorting?: boolean
  filtering?: boolean
  onRowClick?: (row: T) => void
}

export function DataTable<T>({
  data,
  columns,
  pagination = true,
  sorting = true,
  filtering = false,
  onRowClick,
}: DataTableProps<T>) {
  // 구현...
}
```

---

## 15. 페이지별 적용 우선순위

### Phase 1: 핵심 페이지 (2주)
1. **대시보드** - 가장 자주 사용
2. **Business Brain** - 발표용 핵심 페이지
3. **AI 어시스턴트** - 차별화 포인트

### Phase 2: 운영 페이지 (2주)
4. **미입고 관리** - 긴급성 높음
5. **물류 추적** - 일일 사용
6. **물류 관제 센터** - 시각화 중요

### Phase 3: 분석 페이지 (2주)
7. **성과 분석** - 데이터 시각화
8. **고객 분석** - 복잡한 차트
9. **작가 분석** - 상세 정보

### Phase 4: 지원 페이지 (1주)
10. **통합 검색**
11. **비용 분석**
12. **QC 관리**
13. **마케터**
14. **쿠폰 생성**
15. **정산**

---

## 17. 구체적인 작업 명세

### 17.1 Phase 1: 디자인 시스템 구축 (1주)

#### 작업 1-1: 아이콘 시스템 구축
**목표**: 이모지를 Lucide 아이콘으로 교체

**작업 내용:**
1. `lucide-react` 패키지 설치
2. `components/ui/Icon.tsx` 생성
   - size: xs, sm, md, lg, xl
   - variant: default, primary, success, warning, danger
3. `lib/icon-mapping.ts` 생성
   - 주요 이모지 → 아이콘 매핑 테이블
4. 테스트: 대시보드 페이지에 적용

**완료 기준:**
- [ ] Icon 컴포넌트 생성 완료
- [ ] 아이콘 매핑 테이블 작성 완료
- [ ] 대시보드 KPI 카드 아이콘 교체 완료

#### 작업 1-2: 툴팁 컴포넌트 구현
**목표**: 사용자 편의를 위한 툴팁 시스템 구축

**작업 내용:**
1. `components/ui/Tooltip.tsx` 생성
   - position: top, bottom, left, right
   - delay 옵션
   - 애니메이션 효과
2. 테스트: KPI 카드에 툴팁 추가

**완료 기준:**
- [ ] Tooltip 컴포넌트 생성 완료
- [ ] 4방향 위치 지원
- [ ] 애니메이션 동작 확인
- [ ] 대시보드 KPI 카드에 적용 완료

#### 작업 1-3: 색상 시스템 정리
**목표**: 색상 팔레트 단순화 및 통일

**작업 내용:**
1. `tailwind.config.js` 수정
   - 그라데이션 색상 제거
   - 기본 색상만 유지 (idus, slate, semantic)
2. 색상 사용 가이드 문서화

**완료 기준:**
- [ ] tailwind.config.js 수정 완료
- [ ] 그라데이션 색상 제거 확인
- [ ] 색상 가이드 문서 작성 완료

#### 작업 1-4: SUITE 폰트 적용
**목표**: SUITE 폰트 시스템 구축

**작업 내용:**
1. 폰트 파일 복사 (`frontend/public/fonts/`)
2. `globals.css`에 @font-face 정의
3. `tailwind.config.js`에 폰트 설정 추가
4. 타이포그래피 시스템 정의

**완료 기준:**
- [ ] 폰트 파일 복사 완료
- [ ] @font-face 정의 완료
- [ ] Tailwind 설정 완료
- [ ] 전역 스타일 적용 확인

### 17.2 Phase 2: 공통 컴포넌트 개선 (1주)

#### 작업 2-1: 카드 컴포넌트 개선
**목표**: 통일된 카드 디자인 시스템 구축

**작업 내용:**
1. `components/ui/EnhancedCard.tsx` 생성
   - variant: default, bordered, elevated
   - hover 효과
   - 툴팁 지원
2. 기존 Card 컴포넌트와 호환성 유지

**완료 기준:**
- [ ] EnhancedCard 컴포넌트 생성 완료
- [ ] 3가지 variant 구현 완료
- [ ] 호버 효과 동작 확인
- [ ] 툴팁 통합 확인

#### 작업 2-2: 버튼 컴포넌트 개선
**목표**: 툴팁 지원 및 호버 효과 강화

**작업 내용:**
1. `components/ui/EnhancedButton.tsx` 생성
   - 툴팁 지원 추가
   - 호버 효과 개선
2. 기존 Button 컴포넌트와 호환성 유지

**완료 기준:**
- [ ] EnhancedButton 컴포넌트 생성 완료
- [ ] 툴팁 지원 확인
- [ ] 호버 효과 동작 확인

#### 작업 2-3: KPI 카드 컴포넌트 개선
**목표**: 통일된 KPI 카드 디자인 및 툴팁 지원

**작업 내용:**
1. `components/ui/EnhancedKPICard.tsx` 생성
   - 단색 배경 (그라데이션 제거)
   - 툴팁 지원
   - 호버 시 상세 정보 표시
   - 숫자 카운트업 애니메이션

**완료 기준:**
- [ ] EnhancedKPICard 컴포넌트 생성 완료
- [ ] 그라데이션 제거 확인
- [ ] 툴팁 동작 확인
- [ ] 호버 효과 동작 확인
- [ ] 애니메이션 동작 확인

#### 작업 2-4: 그리드 시스템 구축
**목표**: 일관된 레이아웃 시스템 구축

**작업 내용:**
1. `components/layout/Grid.tsx` 생성
2. `components/layout/CardGrid.tsx` 생성
3. `components/layout/Container.tsx` 생성
4. `components/layout/Section.tsx` 개선

**완료 기준:**
- [ ] Grid 컴포넌트 생성 완료
- [ ] CardGrid 컴포넌트 생성 완료
- [ ] Container 컴포넌트 생성 완료
- [ ] Section 컴포넌트 개선 완료

### 17.3 Phase 3: 차트 시스템 개선 (1주)

#### 작업 3-1: Recharts 설치 및 설정
**목표**: Chart.js를 Recharts로 교체 준비

**작업 내용:**
1. `recharts` 패키지 설치
2. `lib/chart-theme.ts` 생성
   - 통일된 색상 테마
   - 그리드 스타일
   - 툴팁 스타일
3. 기본 차트 컴포넌트 생성

**완료 기준:**
- [ ] recharts 설치 완료
- [ ] chart-theme.ts 생성 완료
- [ ] 기본 차트 컴포넌트 생성 완료

#### 작업 3-2: 차트 컴포넌트 생성
**목표**: 재사용 가능한 차트 컴포넌트 구축

**작업 내용:**
1. `components/charts/EnhancedLineChart.tsx`
2. `components/charts/EnhancedBarChart.tsx`
3. `components/charts/EnhancedAreaChart.tsx`
4. `components/charts/EnhancedDoughnutChart.tsx`
5. 모든 차트에 툴팁 및 호버 효과 추가

**완료 기준:**
- [ ] 4가지 차트 컴포넌트 생성 완료
- [ ] 통일된 테마 적용 확인
- [ ] 툴팁 동작 확인
- [ ] 반응형 동작 확인

### 17.4 Phase 4: 페이지별 적용 (4주)

#### 작업 4-1: 대시보드 페이지 개선
**목표**: 대시보드 디자인 통일성 확보

**작업 내용:**
1. 이모지 → Lucide 아이콘 교체
2. KPI 카드 → EnhancedKPICard 교체
3. Chart.js → Recharts 교체
4. 그라데이션 배경 제거
5. 툴팁 추가 (모든 KPI 카드, 필터 옵션)

**완료 기준:**
- [ ] 모든 이모지 교체 완료
- [ ] KPI 카드 교체 완료
- [ ] 차트 교체 완료
- [ ] 그라데이션 제거 확인
- [ ] 툴팁 추가 완료

#### 작업 4-2: Business Brain 페이지 개선
**목표**: Business Brain 디자인 통일성 확보

**작업 내용:**
1. 탭 네비게이션 개선 (아이콘 추가)
2. 브리핑 카드 개선 (그라데이션 제거)
3. 차트 통일 (Recharts)
4. 툴팁 추가 (건강도 점수, 인사이트 카드)

**완료 기준:**
- [ ] 탭 네비게이션 개선 완료
- [ ] 브리핑 카드 개선 완료
- [ ] 차트 통일 완료
- [ ] 툴팁 추가 완료

#### 작업 4-3: 나머지 페이지 개선
**목표**: 모든 페이지 디자인 통일성 확보

**작업 내용:**
각 페이지별로:
1. 이모지 → 아이콘 교체
2. 그라데이션 제거
3. 색상 단순화
4. 툴팁 추가
5. 호버 효과 개선

**완료 기준:**
- [ ] 모든 페이지 이모지 교체 완료
- [ ] 모든 페이지 그라데이션 제거 확인
- [ ] 색상 통일 확인
- [ ] 툴팁 추가 완료
- [ ] 호버 효과 개선 완료

### 17.5 Phase 5: 최종 검증 및 최적화 (1주)

#### 작업 5-1: 전체 검증
**목표**: 모든 페이지 디자인 통일성 및 기능 검증

**작업 내용:**
1. 모든 페이지 디자인 검토
2. 색상 사용 일관성 확인
3. 툴팁 동작 확인
4. 호버 효과 확인
5. 반응형 디자인 확인

**완료 기준:**
- [ ] 모든 페이지 검토 완료
- [ ] 색상 일관성 확인 완료
- [ ] 툴팁 동작 확인 완료
- [ ] 호버 효과 확인 완료
- [ ] 반응형 확인 완료

#### 작업 5-2: 성능 최적화
**목표**: 애니메이션 및 렌더링 성능 최적화

**작업 내용:**
1. 애니메이션 성능 최적화
2. 불필요한 리렌더링 방지
3. 이미지 최적화
4. 폰트 로딩 최적화

**완료 기준:**
- [ ] 애니메이션 성능 확인 완료
- [ ] 리렌더링 최적화 완료
- [ ] 이미지 최적화 완료
- [ ] 폰트 로딩 최적화 완료

---

## 18. 디자인 적용 가이드라인

### 18.1 페이지별 디자인 원칙

| 페이지 유형 | 디자인 방향 | 주요 컴포넌트 | 색상 사용 |
|------------|------------|-------------|---------|
| **대시보드** | 정보 밀도 높음, 빠른 스캔 | KPI 카드, 차트, 요약 카드 | idus Orange (강조), Slate (기본) |
| **분석 페이지** | 데이터 중심, 시각화 강조 | 차트, 테이블, 필터 | idus Orange (액션), Slate (기본) |
| **관리 페이지** | 액션 중심, 효율성 | 리스트, 카드, 액션 버튼 | idus Orange (액션), Semantic (상태) |
| **도구 페이지** | 기능 중심, 직관성 | 폼, 입력, 결과 표시 | idus Orange (액션), Slate (기본) |

### 18.2 컴포넌트 선택 가이드

**카드 vs 리스트:**
- 카드: 중요 정보, 액션 필요, 시각적 구분 필요
- 리스트: 많은 항목, 빠른 스캔, 컴팩트한 표시

**차트 선택:**
- 트렌드: Line Chart / Area Chart
- 비교: Bar Chart
- 구성: Doughnut Chart / Pie Chart
- 관계: Scatter Chart
- 분포: Histogram

### 18.3 색상 사용 가이드 (단순화)

**Primary (idus Orange):**
- 주요 액션 버튼
- 활성 탭
- 중요한 링크
- 브랜드 강조

**Semantic (제한적 사용):**
- Success: 성공 상태, 긍정적 변화만
- Warning: 경고 상태만
- Danger: 위험/오류 상태만
- Info: 최소 사용

**Neutral (Slate):**
- 기본 텍스트
- 배경
- 경계선
- 카드 배경

---

---

## 19. 작업 체크리스트

### Phase 1: 디자인 시스템 구축
- [ ] 아이콘 시스템 구축
  - [ ] lucide-react 설치
  - [ ] Icon 컴포넌트 생성
  - [ ] 아이콘 매핑 테이블 작성
- [ ] 툴팁 컴포넌트 구현
  - [ ] Tooltip 컴포넌트 생성
  - [ ] 4방향 위치 지원
  - [ ] 애니메이션 구현
- [ ] 색상 시스템 정리
  - [ ] tailwind.config.js 수정
  - [ ] 그라데이션 색상 제거
- [ ] SUITE 폰트 적용
  - [ ] 폰트 파일 복사
  - [ ] @font-face 정의
  - [ ] Tailwind 설정

### Phase 2: 공통 컴포넌트 개선
- [ ] 카드 컴포넌트 개선
- [ ] 버튼 컴포넌트 개선
- [ ] KPI 카드 컴포넌트 개선
- [ ] 그리드 시스템 구축

### Phase 3: 차트 시스템 개선
- [ ] Recharts 설치 및 설정
- [ ] 차트 컴포넌트 생성
- [ ] 차트 테마 정의

### Phase 4: 페이지별 적용
- [ ] 대시보드 페이지 개선
- [ ] Business Brain 페이지 개선
- [ ] 나머지 페이지 개선

### Phase 5: 최종 검증 및 최적화
- [ ] 전체 검증
- [ ] 성능 최적화

---

---

## 20. 구현 작업 순서 (단계별 가이드)

> **중요**: 아래 순서대로 작업을 진행하세요. 각 단계를 완료한 후 다음 단계로 진행합니다.

### 20.0 사전 준비 (모든 Phase 전에 완료)

#### Step 0-1: 프로젝트 환경 확인
```bash
# 현재 디렉토리 확인
pwd

# frontend 디렉토리로 이동
cd frontend

# Node.js 버전 확인 (18.x 이상 권장)
node -v

# 패키지 매니저 확인
npm -v  # 또는 yarn -v, pnpm -v
```

#### Step 0-2: 필수 패키지 설치
```bash
# 필수 패키지 일괄 설치
npm install lucide-react recharts framer-motion clsx tailwind-merge

# 설치 확인
npm list lucide-react recharts framer-motion clsx tailwind-merge
```

#### Step 0-3: 유틸리티 함수 생성
**파일**: `frontend/lib/utils.ts` 생성
- 내용: Section 20.1 참조

#### Step 0-4: 폰트 파일 준비
```bash
# fonts 디렉토리 생성
mkdir -p public/fonts

# 폰트 파일 복사 (Windows)
copy "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\font\SUITE-Variable-woff2\SUITE-Variable.woff2" public/fonts\

# 또는 (PowerShell)
Copy-Item "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\font\SUITE-Variable-woff2\SUITE-Variable.woff2" -Destination "public/fonts\"
```

#### Step 0-5: Tailwind 설정 확인
**파일**: `frontend/tailwind.config.js` 수정
- 내용: Section 20.3 참조

#### Step 0-6: globals.css 수정
**파일**: `frontend/app/globals.css` 수정
- 내용: Section 20.4 참조

**완료 확인:**
- [ ] 모든 패키지 설치 완료
- [ ] lib/utils.ts 생성 완료
- [ ] 폰트 파일 복사 완료
- [ ] tailwind.config.js 수정 완료
- [ ] globals.css 수정 완료
- [ ] 개발 서버 실행 확인 (`npm run dev`)

---

## 21. 구현 전 필수 준비사항

### 20.1 필수 유틸리티 함수 생성

#### cn 유틸리티 함수 (clsx + tailwind-merge)
**파일**: `frontend/lib/utils.ts`

```tsx
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 클래스 이름을 병합하는 유틸리티 함수
 * clsx로 조건부 클래스를 처리하고, tailwind-merge로 충돌하는 Tailwind 클래스를 병합
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**완료 기준:**
- [ ] `lib/utils.ts` 파일 생성
- [ ] `cn` 함수 구현 완료
- [ ] 모든 컴포넌트에서 `cn` 사용 가능 확인

### 20.2 이모지 → 아이콘 매핑 확장

**파일**: `lib/icon-mapping.ts` (확장 필요)

현재 문서에 명시된 매핑 외 추가 필요한 이모지:

```tsx
// lib/icon-mapping.ts (확장)
import { 
  // 기존
  TrendingUp, DollarSign, Package, Users, 
  BarChart3, PieChart, LineChart, Activity,
  AlertCircle, CheckCircle, XCircle, Info,
  // 추가
  Truck, Plane, Search, Brain, 
  Calendar, FileText, Settings, Download,
  Upload, Filter, RefreshCw, MoreVertical,
  Edit, Trash2, Eye, EyeOff, Lock, Unlock,
  Plus, Minus, X, ChevronRight, ChevronLeft,
  ArrowUp, ArrowDown, TrendingDown,
  Clock, Bell, Mail, Phone, MapPin,
  Globe, Flag, CreditCard, ShoppingCart,
  Star, Heart, Share2, Copy, Check,
  AlertTriangle, HelpCircle, Zap,
  Target, Award, Gift, Tag, Percent
} from 'lucide-react'

export const iconMap = {
  // 기존 매핑
  revenue: DollarSign,
  orders: Package,
  customers: Users,
  growth: TrendingUp,
  barChart: BarChart3,
  pieChart: PieChart,
  lineChart: LineChart,
  activity: Activity,
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  
  // 추가 매핑
  logistics: Truck,
  shipping: Plane,
  search: Search,
  brain: Brain,
  calendar: Calendar,
  document: FileText,
  settings: Settings,
  download: Download,
  upload: Upload,
  filter: Filter,
  refresh: RefreshCw,
  more: MoreVertical,
  edit: Edit,
  delete: Trash2,
  view: Eye,
  hide: EyeOff,
  lock: Lock,
  unlock: Unlock,
  add: Plus,
  remove: Minus,
  close: X,
  next: ChevronRight,
  prev: ChevronLeft,
  up: ArrowUp,
  down: ArrowDown,
  decline: TrendingDown,
  time: Clock,
  notification: Bell,
  email: Mail,
  phone: Phone,
  location: MapPin,
  global: Globe,
  country: Flag,
  payment: CreditCard,
  cart: ShoppingCart,
  star: Star,
  favorite: Heart,
  share: Share2,
  copy: Copy,
  check: Check,
  alert: AlertTriangle,
  help: HelpCircle,
  lightning: Zap,
  target: Target,
  award: Award,
  gift: Gift,
  tag: Tag,
  discount: Percent,
} as const

// 이모지 → 아이콘 매핑 테이블 (완전판)
export const emojiToIconMap: Record<string, keyof typeof iconMap> = {
  '📊': 'barChart',
  '💰': 'revenue',
  '📦': 'orders',
  '👥': 'customers',
  '📈': 'growth',
  '🚨': 'alert',
  '✅': 'success',
  '🔍': 'search',
  '🚚': 'logistics',
  '✈️': 'shipping',
  '🧠': 'brain',
  '📅': 'calendar',
  '📄': 'document',
  '⚙️': 'settings',
  '⬇️': 'download',
  '⬆️': 'upload',
  '🔽': 'filter',
  '🔄': 'refresh',
  '⋮': 'more',
  '✏️': 'edit',
  '🗑️': 'delete',
  '👁️': 'view',
  '🔒': 'lock',
  '🔓': 'unlock',
  '➕': 'add',
  '➖': 'remove',
  '❌': 'close',
  '▶️': 'next',
  '◀️': 'prev',
  '⬆️': 'up',
  '⬇️': 'down',
  '📉': 'decline',
  '⏰': 'time',
  '🔔': 'notification',
  '📧': 'email',
  '📞': 'phone',
  '📍': 'location',
  '🌐': 'global',
  '🏳️': 'country',
  '💳': 'payment',
  '🛒': 'cart',
  '⭐': 'star',
  '❤️': 'favorite',
  '🔗': 'share',
  '📋': 'copy',
  '✓': 'check',
  '⚠️': 'warning',
  '❓': 'help',
  '⚡': 'lightning',
  '🎯': 'target',
  '🏆': 'award',
  '🎁': 'gift',
  '🏷️': 'tag',
  '💯': 'discount',
}
```

**완료 기준:**
- [ ] 모든 페이지의 이모지 조사 완료
- [ ] icon-mapping.ts에 모든 매핑 추가 완료
- [ ] emojiToIconMap 테이블 작성 완료

### 20.3 Tailwind 설정 완전 구조

**파일**: `frontend/tailwind.config.js` (전체 구조)

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 폰트 설정
      fontFamily: {
        sans: [
          'SUITE',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      
      // 타이포그래피 시스템
      fontSize: {
        'display-1': ['3.5rem', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.02em' }],
        'display-2': ['2.75rem', { lineHeight: '1.2', fontWeight: '800', letterSpacing: '-0.01em' }],
        'heading-1': ['2rem', { lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.01em' }],
        'heading-2': ['1.625rem', { lineHeight: '1.4', fontWeight: '700' }],
        'heading-3': ['1.375rem', { lineHeight: '1.5', fontWeight: '600' }],
        'heading-4': ['1.125rem', { lineHeight: '1.5', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.7', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
        'caption-sm': ['0.6875rem', { lineHeight: '1.3', fontWeight: '400' }],
      },
      
      // 색상 시스템
      colors: {
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
      },
      
      // 그림자 시스템
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'md': '0 2px 4px rgba(0, 0, 0, 0.06)',
        'lg': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'xl': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'hover': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'inner': 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      
      // 간격 시스템
      spacing: {
        'section': '48px',
        'card': '24px',
        'element': '16px',
        'tight': '8px',
      },
    },
  },
  plugins: [],
}
```

**완료 기준:**
- [ ] tailwind.config.js 전체 구조 확인
- [ ] 모든 커스텀 설정 적용 확인

### 20.4 globals.css 구조

**파일**: `frontend/app/globals.css` (추가 내용)

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* SUITE 폰트 정의 */
@font-face {
  font-family: 'SUITE';
  src: url('/fonts/SUITE-Variable.woff2') format('woff2');
  font-weight: 300 900;
  font-style: normal;
  font-display: swap;
}

/* 기본 스타일 */
@layer base {
  body {
    font-family: 'SUITE', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* 커스텀 유틸리티 */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

**완료 기준:**
- [ ] @font-face 정의 확인
- [ ] 기본 body 스타일 적용 확인

### 20.5 타입 정의 파일

**파일**: `frontend/types/components.ts` (생성 필요)

```tsx
// types/components.ts
import { LucideIcon } from 'lucide-react'

export interface IconProps {
  icon: LucideIcon
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

export interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  maxWidth?: string
}

export interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'bordered' | 'elevated'
  hover?: boolean
  tooltip?: string
  onClick?: () => void
  className?: string
}

export interface KPICardProps {
  title: string
  value: string | number
  change?: number
  icon?: LucideIcon
  tooltip?: string
  detailInfo?: string
  className?: string
}
```

**완료 기준:**
- [ ] types/components.ts 파일 생성
- [ ] 주요 컴포넌트 타입 정의 완료

### 20.6 패키지 설치 명령어 (통합)

**작업 순서:**
```bash
# 1. 필수 패키지 설치
cd frontend
npm install lucide-react recharts framer-motion clsx tailwind-merge

# 2. 개발 의존성 확인 (필요시)
npm install -D @types/node
```

**완료 기준:**
- [ ] 모든 패키지 설치 완료
- [ ] 패키지 버전 확인 (package.json)
- [ ] 빌드 오류 없음 확인

### 20.7 파일 구조 확인

**생성해야 할 파일 목록:**

```
frontend/
├── lib/
│   ├── utils.ts                    # cn 유틸리티 함수
│   ├── icon-mapping.ts             # 아이콘 매핑
│   ├── chart-theme.ts              # 차트 테마
│   └── animations.ts               # 애니메이션 패턴
├── components/
│   ├── ui/
│   │   ├── Icon.tsx                # 아이콘 컴포넌트
│   │   ├── Tooltip.tsx             # 툴팁 컴포넌트
│   │   ├── EnhancedCard.tsx        # 개선된 카드
│   │   ├── EnhancedButton.tsx      # 개선된 버튼
│   │   └── EnhancedKPICard.tsx     # KPI 카드
│   ├── layout/
│   │   ├── Grid.tsx                # 그리드 컴포넌트
│   │   ├── CardGrid.tsx            # 카드 그리드
│   │   ├── Container.tsx           # 컨테이너
│   │   ├── Section.tsx             # 섹션
│   │   └── PageHeader.tsx          # 페이지 헤더
│   └── charts/
│       ├── EnhancedLineChart.tsx   # 라인 차트
│       ├── EnhancedBarChart.tsx    # 바 차트
│       ├── EnhancedAreaChart.tsx   # 영역 차트
│       └── EnhancedDoughnutChart.tsx # 도넛 차트
├── public/
│   └── fonts/
│       └── SUITE-Variable.woff2    # 폰트 파일
├── types/
│   └── components.ts               # 타입 정의
├── app/
│   └── globals.css                 # 전역 스타일
└── tailwind.config.js              # Tailwind 설정
```

**완료 기준:**
- [ ] 모든 디렉토리 구조 확인
- [ ] 필수 파일 생성 확인

### 20.8 구현 체크리스트 (최종)

#### Phase 1 전 필수 작업
- [ ] `lib/utils.ts` 생성 및 `cn` 함수 구현
- [ ] `lib/icon-mapping.ts` 생성 및 모든 이모지 매핑
- [ ] `tailwind.config.js` 전체 구조 확인
- [ ] `globals.css`에 폰트 정의 추가
- [ ] 모든 패키지 설치 완료
- [ ] 폰트 파일 복사 완료

#### 각 Phase별 필수 확인
- [ ] 컴포넌트 생성 후 import 경로 확인
- [ ] 타입 에러 없음 확인
- [ ] 빌드 오류 없음 확인
- [ ] 브라우저 콘솔 에러 없음 확인

#### 최종 검증
- [ ] 모든 페이지에서 이모지 제거 확인
- [ ] 모든 페이지에서 그라데이션 제거 확인
- [ ] 색상 통일성 확인
- [ ] 툴팁 동작 확인
- [ ] 호버 효과 동작 확인
- [ ] 반응형 디자인 확인

---

**작성자**: AI Assistant  
**최종 업데이트**: 2024-12-19  
**버전**: 2.1 (구현 전 필수 준비사항 추가)

