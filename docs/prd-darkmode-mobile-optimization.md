# Global Business Hub 다크모드 & 모바일 최적화 PRD

## 1. 개요

### 1.1 배경
Global Business Hub는 현재 데스크톱 환경에 최적화되어 있으며, 라이트 모드만 지원합니다. 사용자 편의성 향상을 위해 다크모드와 모바일 반응형 디자인을 도입합니다.

### 1.2 목표
- **다크모드**: 눈의 피로도 감소, 야간/저조도 환경 사용성 개선
- **모바일 최적화**: 태블릿/모바일에서도 핵심 기능 사용 가능
- **PC 버전 무결성**: 기존 데스크톱 환경에 영향 없음

### 1.3 핵심 원칙: PC 버전 충돌 최소화

| 작업 유형 | 충돌 위험 | 적용 방식 |
|----------|----------|----------|
| CSS 변수 추가 | ❌ 없음 | 기존 유지 + 신규 추가 |
| dark: 클래스 추가 | ❌ 없음 | 기존 클래스에 추가만 |
| 신규 컴포넌트 | ❌ 없음 | 별도 파일 생성 |
| 브레이크포인트 분기 | ❌ 없음 | lg:hidden, md:flex 등 |
| 기존 컴포넌트 수정 | ⚠️ 주의 | 기본값 유지 + 옵션 추가 |

---

## 2. 현황 분석

### 2.1 프로젝트 구조

```
frontend/
├── app/
│   ├── globals.css              # CSS 변수 정의 (다크모드 변수 일부 존재)
│   ├── providers.tsx            # QueryClientProvider
│   ├── layout.tsx               # 루트 레이아웃
│   ├── dashboard/page.tsx       # 대시보드 (KPI 6열, 차트, 카드)
│   ├── qc/page.tsx              # QC 관리 (탭 UI)
│   ├── unreceived/page.tsx      # 미입고 관리 (테이블)
│   ├── chat/page.tsx            # AI 어시스턴트 (채팅 UI)
│   └── ... (15개 추가 페이지)
├── components/
│   ├── Layout.tsx               # Sidebar + Header + Content
│   ├── Sidebar.tsx              # 좌측 네비게이션 (260px)
│   ├── Header.tsx               # 상단 헤더 (검색, 알림, 사용자)
│   └── ui/                      # 20개 공통 컴포넌트
│       ├── Button.tsx           # 5가지 variant
│       ├── Card.tsx             # 5가지 variant
│       ├── Modal.tsx            # 5가지 size
│       ├── Badge.tsx            # 6가지 variant
│       ├── Tabs.tsx             # 3가지 variant
│       ├── DataTable.tsx        # 정렬, 선택, 페이지네이션
│       ├── KPICard.tsx          # 5가지 color
│       ├── Toast.tsx            # 알림 토스트
│       ├── Select.tsx           # 드롭다운
│       ├── Input.tsx            # 입력 필드
│       ├── Spinner.tsx          # 로딩 스피너
│       ├── EmptyState.tsx       # 빈 상태
│       ├── Pagination.tsx       # 페이지네이션
│       ├── Tooltip.tsx          # 툴팁
│       ├── Toggle.tsx           # 토글 스위치
│       ├── Progress.tsx         # 진행률 바
│       ├── Skeleton.tsx         # 스켈레톤 로딩
│       ├── Breadcrumb.tsx       # 브레드크럼
│       └── ConfirmDialog.tsx    # 확인 다이얼로그
└── contexts/                    # (신규 생성 예정)
```

### 2.2 현재 반응형 적용 현황

| 컴포넌트/페이지 | 현재 상태 | 비고 |
|----------------|----------|------|
| 대시보드 KPI | ✅ 반응형 | `grid-cols-2 md:grid-cols-3 lg:grid-cols-6` |
| 대시보드 헤더 | ✅ 반응형 | `flex-col lg:flex-row` |
| Sidebar | ⚠️ 부분 | 모바일 토글 있으나 UX 개선 필요 |
| Header | ❌ 미적용 | 검색바, 사용자 메뉴 축소 필요 |
| DataTable | ❌ 미적용 | 가로 스크롤만 |
| Modal | ❌ 미적용 | 전체화면 모드 필요 |
| 각 페이지 콘텐츠 | ❌ 미적용 | 레이아웃 재구성 필요 |

### 2.3 기존 다크모드 CSS 변수 (globals.css)

```css
/* 이미 정의되어 있으나 미사용 */
[data-theme="dark"] {
  --primary-color: #FFA45C;
  --background-color: #121212;
  --card-background-color: #1E1E1E;
  --text-color: #F3F4F6;
  --border-color: #374151;
}
```

---

## 3. 다크모드 상세 설계

### 3.1 ThemeContext 구현

```typescript
// contexts/ThemeContext.tsx (신규 생성)
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: ResolvedTheme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')

  // 초기 테마 로드
  useEffect(() => {
    const saved = localStorage.getItem('gb-hub-theme') as Theme | null
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setThemeState(saved)
    }
  }, [])

  // 테마 적용
  useEffect(() => {
    const root = document.documentElement
    let resolved: ResolvedTheme = 'light'

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      resolved = mediaQuery.matches ? 'dark' : 'light'
      
      // 시스템 테마 변경 감지
      const handler = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light')
        root.classList.toggle('dark', e.matches)
      }
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      resolved = theme
    }

    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
    setResolvedTheme(resolved)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('gb-hub-theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
```

### 3.2 다크모드 색상 팔레트

```css
/* globals.css에 추가 */

/* 다크모드 색상 확장 */
.dark {
  /* 배경 */
  --background-color: #0A0A0A;
  --background-alt-color: #141414;
  --card-background-color: #1C1C1C;
  
  /* 텍스트 */
  --text-color: #FAFAFA;
  --text-secondary: #A1A1AA;
  --text-muted-color: #71717A;
  
  /* 테두리 */
  --border-color: #27272A;
  --border-light: #3F3F46;
  
  /* 인터랙션 */
  --hover-color: #27272A;
  --active-color: #3F3F46;
  
  /* 브랜드 (밝기 조정) */
  --idus-orange: #FF9F4A;
  --idus-orange-dark: #FFB366;
  --idus-orange-light: #2D1F14;
  
  /* 상태 색상 */
  --success-color: #22C55E;
  --success-light: #14532D;
  --warning-color: #FBBF24;
  --warning-light: #422006;
  --danger-color: #EF4444;
  --danger-light: #450A0A;
  --info-color: #3B82F6;
  --info-light: #172554;
}
```

### 3.3 ThemeToggle 컴포넌트

```typescript
// components/ui/ThemeToggle.tsx (신규 생성)
'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, useRef, useEffect } from 'react'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const options = [
    { value: 'light', label: '라이트', icon: '☀️' },
    { value: 'dark', label: '다크', icon: '🌙' },
    { value: 'system', label: '시스템', icon: '💻' },
  ] as const

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="테마 변경"
      >
        <span className="text-lg">{resolvedTheme === 'light' ? '☀️' : '🌙'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setTheme(option.value)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                theme === option.value ? 'text-[#F78C3A]' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
              {theme === option.value && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```


### 3.4 UI 컴포넌트별 다크모드 적용 패턴

모든 컴포넌트는 기존 클래스를 유지하고 `dark:` 클래스만 추가합니다.

```tsx
// 적용 패턴 예시
// Before (기존 유지)
className="bg-white border-slate-200 text-slate-900"

// After (dark: 추가)
className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
```

#### 적용 대상 컴포넌트 (20개)

| 컴포넌트 | 주요 변경 요소 |
|----------|---------------|
| Button | 배경, 테두리, 텍스트, 호버 상태 |
| Card | 배경, 테두리, 그림자 |
| Badge | 배경, 텍스트 |
| Modal | 오버레이, 배경, 테두리 |
| Toast | 배경, 텍스트, 아이콘 |
| DataTable | 헤더, 행, 호버, 테두리 |
| KPICard | 배경, 텍스트, 상단 바 |
| Tabs | 배경, 활성 탭, 비활성 탭 |
| Select | 배경, 테두리, 드롭다운 |
| Input | 배경, 테두리, 포커스 |
| Spinner | 색상 |
| EmptyState | 배경, 텍스트 |
| Pagination | 버튼, 활성 페이지 |
| Tooltip | 배경, 텍스트 |
| Toggle | 트랙, 썸 |
| Progress | 트랙, 바 |
| Skeleton | 배경 애니메이션 |
| Breadcrumb | 텍스트, 구분자 |
| ConfirmDialog | Modal과 동일 |

---

## 4. 모바일 최적화 상세 설계

### 4.1 브레이크포인트 정의

| 브레이크포인트 | 크기 | 대상 디바이스 | Tailwind |
|----------------|------|---------------|----------|
| Mobile | < 640px | 스마트폰 | 기본 |
| Tablet | 640px - 1024px | 태블릿 | `sm:`, `md:` |
| Desktop | > 1024px | PC | `lg:`, `xl:` |

### 4.2 레이아웃 변경 전략

#### 데스크톱 (lg+) - 변경 없음
```
┌──────────┬─────────────────────────────────────────┐
│          │  Header (검색바 + 알림 + 사용자)         │
│ Sidebar  ├─────────────────────────────────────────┤
│  260px   │                                         │
│          │  Content                                │
│          │                                         │
└──────────┴─────────────────────────────────────────┘
```

#### 모바일 (< lg) - 신규
```
┌─────────────────────────────────────────┐
│ [☰]  idus Global        [🌙] [🔔] [👤] │
├─────────────────────────────────────────┤
│                                         │
│  Content (단일 컬럼, 풀 너비)            │
│  - 패딩 축소 (p-4)                      │
│  - 카드 스택                            │
│                                         │
├─────────────────────────────────────────┤
│ [🏠] [✅] [🚨] [🔍] [⋯]                 │
│  홈   QC  미입고 검색 더보기             │
└─────────────────────────────────────────┘
```

### 4.3 BottomNavigation 컴포넌트

```typescript
// components/BottomNavigation.tsx (신규 생성)
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const mainNavItems = [
  { href: '/dashboard', icon: '🏠', label: '홈' },
  { href: '/qc', icon: '✅', label: 'QC' },
  { href: '/unreceived', icon: '🚨', label: '미입고' },
  { href: '/lookup', icon: '🔍', label: '검색' },
]

const moreNavItems = [
  { href: '/logistics', icon: '🚚', label: '물류 추적' },
  { href: '/settlement', icon: '💵', label: '물류비 정산' },
  { href: '/analytics', icon: '📈', label: '성과 분석' },
  { href: '/artist-analytics', icon: '👨‍🎨', label: '작가 분석' },
  { href: '/chat', icon: '🤖', label: 'AI 어시스턴트' },
  { href: '/coupon-generator', icon: '🎟️', label: '쿠폰 생성' },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      {/* 더보기 메뉴 오버레이 */}
      {showMore && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowMore(false)}>
          <div 
            className="absolute bottom-16 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-2xl p-4 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-3">
              {moreNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className="flex flex-col items-center p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 바 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 lg:hidden safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive 
                    ? 'text-[#F78C3A]' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <span className="text-xl mb-0.5">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              showMore ? 'text-[#F78C3A]' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span className="text-xl mb-0.5">⋯</span>
            <span className="text-[10px] font-medium">더보기</span>
          </button>
        </div>
      </nav>
    </>
  )
}
```

### 4.4 Layout.tsx 수정

```typescript
// components/Layout.tsx 수정
'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'
import { BottomNavigation } from './BottomNavigation'
import { ToastProvider } from './ui/Toast'

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
        {/* 사이드바: 데스크톱에서만 표시 */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            <div className="p-4 lg:p-6">{children}</div>
          </main>
        </div>
        
        {/* 하단 네비: 모바일에서만 표시 */}
        <BottomNavigation />
      </div>
    </ToastProvider>
  )
}
```

### 4.5 Header 모바일 대응

```typescript
// Header.tsx 주요 변경 사항

// 1. 검색바: 모바일에서 아이콘만
<div className="hidden md:block flex-1 max-w-xl">
  {/* 기존 검색바 */}
</div>
<button className="md:hidden p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
  <span className="text-lg">🔍</span>
</button>

// 2. 사용자 정보: 모바일에서 아바타만
<div className="hidden md:block text-left">
  <p className="text-sm font-medium">{session?.user?.name}</p>
  <p className="text-xs text-slate-500">{session?.user?.email}</p>
</div>

// 3. 테마 토글 추가
<ThemeToggle />
```

### 4.6 useMediaQuery 훅

```typescript
// hooks/useMediaQuery.ts (신규 생성)
'use client'

import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// 편의 훅
export function useIsMobile() {
  return useMediaQuery('(max-width: 1023px)')
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)')
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)')
}
```

---

## 5. 페이지별 모바일 대응 상세

### 5.1 우선순위 분류

#### Tier 1: 필수 (완전 지원)

| 페이지 | 현재 상태 | 모바일 대응 방안 |
|--------|----------|-----------------|
| 대시보드 | KPI 반응형 ✅ | 차트 가로스크롤, 카드 1열 스택 |
| QC 관리 | 탭 UI | 탭 가로스크롤, 컨텐츠 조정 |
| 미입고 관리 | 테이블 | 카드뷰 옵션 제공 |
| 로그인 | 반응형 ✅ | 완료 |

#### Tier 2: 권장 (핵심 기능)

| 페이지 | 모바일 대응 방안 |
|--------|-----------------|
| 통합 검색 | 전체화면 검색 오버레이 |
| 물류 추적 | 타임라인 세로 배치 |
| AI 어시스턴트 | 채팅 UI 최적화 (이미 적합) |

#### Tier 3: 데스크톱 권장

| 페이지 | 대응 방식 |
|--------|----------|
| 성과 분석 | 가로 스크롤 + "데스크톱 권장" 배너 |
| 고객/작가 분석 | 가로 스크롤 + "데스크톱 권장" 배너 |
| 비용 & 손익 | 가로 스크롤 + "데스크톱 권장" 배너 |

### 5.2 대시보드 모바일 레이아웃

```
┌─────────────────────────────────────────┐
│ 대시보드                                │
│ Global Business 핵심 현황               │
├─────────────────────────────────────────┤
│ [📅 날짜 선택]              [AI 질문 →] │
├─────────────────────────────────────────┤
│ 🚨 긴급: 미입고 7일+ 5건     [확인 →]   │
├─────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐         │
│ │ 💰 ₩10.6M  │ │ 📦 88건    │         │
│ │ GMV  +50%  │ │ 주문  +27% │         │
│ └─────────────┘ └─────────────┘         │
│ ┌─────────────┐ ┌─────────────┐         │
│ │ 📊 ₩121K   │ │ 🎨 237개   │         │
│ │ AOV  +12%  │ │ 작품  +32% │         │
│ └─────────────┘ └─────────────┘         │
│ ┌─────────────┐ ┌─────────────┐         │
│ │ 👥 15명    │ │ 🚚 92.1%   │         │
│ │ 신규  +12% │ │ 배송  +1%  │         │
│ └─────────────┘ └─────────────┘         │
├─────────────────────────────────────────┤
│ 📈 GMV & 주문 추세                      │
│ ┌─────────────────────────────────────┐ │
│ │ [← 차트 (가로 스크롤 가능) →]       │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 📝 오늘 할 일                           │
│ ┌─────────────────────────────────────┐ │
│ │ 🔴 QC 검수 대기              4800건 │ │
│ │ 🔴 미입고 14일+ 긴급            3건 │ │
│ │ 🟡 소포수령증 리마인드          86건 │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 📡 물류 현황                            │
│ ┌─────────────────────────────────────┐ │
│ │ 📦 미입고  →  🚚 국내  →  🔍 검수  │ │
│ │    13          8          3        │ │
│ │                    →  ✈️ 국제      │ │
│ │                         27         │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 5.3 DataTable 카드뷰 모드

```typescript
// DataTable.tsx에 viewMode prop 추가

interface DataTableProps<T> {
  // 기존 props 유지
  viewMode?: 'table' | 'card'  // 기본값: 'table'
  cardRender?: (row: T, index: number) => React.ReactNode
}

// 사용 예시
const isMobile = useIsMobile()

<DataTable
  columns={columns}
  data={data}
  viewMode={isMobile ? 'card' : 'table'}
  cardRender={(row) => (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold">{row.orderNumber}</span>
        <Badge variant={row.status === '긴급' ? 'danger' : 'default'}>{row.status}</Badge>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">{row.productName}</p>
      <p className="text-xs text-slate-400 mt-1">{row.date}</p>
    </div>
  )}
/>
```

---

## 6. 구현 계획

### 6.1 Phase 1: 다크모드 기반 (2일)

| 작업 | 파일 | PC 영향 |
|------|------|---------|
| ThemeContext 생성 | `contexts/ThemeContext.tsx` | ❌ 없음 |
| ThemeProvider 적용 | `app/providers.tsx` | ❌ 없음 |
| CSS 변수 확장 | `app/globals.css` | ❌ 없음 |
| ThemeToggle 생성 | `components/ui/ThemeToggle.tsx` | ❌ 없음 |
| Header에 토글 추가 | `components/Header.tsx` | ❌ 없음 |

### 6.2 Phase 2: UI 컴포넌트 다크모드 (2일)

| 작업 | 대상 | PC 영향 |
|------|------|---------|
| 핵심 컴포넌트 | Button, Card, Badge, Modal | ❌ 없음 |
| 데이터 컴포넌트 | DataTable, KPICard, Tabs | ❌ 없음 |
| 입력 컴포넌트 | Select, Input, Toggle | ❌ 없음 |
| 피드백 컴포넌트 | Toast, Spinner, EmptyState | ❌ 없음 |
| 기타 컴포넌트 | Pagination, Tooltip, Progress 등 | ❌ 없음 |

### 6.3 Phase 3: 모바일 기반 (3일)

| 작업 | 파일 | PC 영향 |
|------|------|---------|
| BottomNavigation 생성 | `components/BottomNavigation.tsx` | ❌ 없음 |
| useMediaQuery 훅 | `hooks/useMediaQuery.ts` | ❌ 없음 |
| Layout 조건부 렌더링 | `components/Layout.tsx` | ❌ 없음 |
| Header 반응형 | `components/Header.tsx` | ❌ 없음 |
| Sidebar 다크모드 | `components/Sidebar.tsx` | ❌ 없음 |

### 6.4 Phase 4: Tier 1 페이지 (3일)

| 작업 | 파일 | PC 영향 |
|------|------|---------|
| 대시보드 반응형 | `app/dashboard/page.tsx` | ❌ 없음 |
| QC 관리 반응형 | `app/qc/page.tsx` | ❌ 없음 |
| 미입고 관리 카드뷰 | `app/unreceived/page.tsx` | ❌ 없음 |
| DataTable 카드뷰 모드 | `components/ui/DataTable.tsx` | ❌ 없음 |

### 6.5 Phase 5: 테스트 및 QA (2일)

| 작업 | 상세 |
|------|------|
| PC 회귀 테스트 | 모든 페이지 기존 기능 정상 동작 확인 |
| 다크모드 테스트 | 전체 페이지 색상, 가독성 확인 |
| 모바일 테스트 | iOS Safari, Android Chrome |
| 태블릿 테스트 | iPad, Android 태블릿 |

**총 예상 소요 시간: 12일 (약 2.5주)**

---

## 7. 파일 변경 요약

### 7.1 신규 생성 파일

| 파일 | 용도 |
|------|------|
| `contexts/ThemeContext.tsx` | 테마 상태 관리 |
| `hooks/useMediaQuery.ts` | 반응형 훅 |
| `components/BottomNavigation.tsx` | 모바일 하단 네비게이션 |
| `components/ui/ThemeToggle.tsx` | 테마 전환 버튼 |

### 7.2 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/globals.css` | 다크모드 CSS 변수 확장 |
| `app/providers.tsx` | ThemeProvider 추가 |
| `components/Layout.tsx` | 조건부 렌더링 (lg:hidden) |
| `components/Header.tsx` | 반응형 + 다크모드 + 테마토글 |
| `components/Sidebar.tsx` | 다크모드 클래스 추가 |
| `components/ui/*.tsx` | 20개 컴포넌트 dark: 클래스 추가 |

---

## 8. 충돌 방지 체크리스트

### 작업 전 확인
- [ ] 기존 클래스 삭제하지 않고 추가만 하는가?
- [ ] 기본값은 기존 동작을 유지하는가?
- [ ] 브레이크포인트 분기(lg:, md:)를 사용하는가?
- [ ] 신규 prop은 optional이고 기본값이 있는가?

### 작업 후 확인
- [ ] PC 1920x1080에서 기존 레이아웃 동일한가?
- [ ] PC에서 모든 기능 정상 동작하는가?
- [ ] 라이트모드에서 기존 색상과 동일한가?
- [ ] 콘솔에 에러/경고가 없는가?

---

## 9. 성공 지표

| 지표 | 목표 |
|------|------|
| 다크모드 적용률 | 100% 컴포넌트 |
| PC 회귀 버그 | 0건 |
| 모바일 Tier 1 사용성 | 100% 기능 사용 가능 |
| Lighthouse 모바일 점수 | 80점 이상 |

---

## 10. 모바일 UI 컴포넌트별 상세 구현 가이드

### 10.1 Modal → 바텀시트 변환

**현재 문제**: 모바일에서 중앙 팝업이 화면을 가리고 조작이 불편함

**해결 방안**: `mobileVariant` prop 추가 (기본값: 'center')

```typescript
// Modal.tsx 수정
interface ModalProps {
  // 기존 props 유지
  mobileVariant?: 'center' | 'bottom-sheet' | 'fullscreen'  // 신규
}

// 모바일 바텀시트 스타일
const mobileStyles = {
  'center': 'items-center justify-center',
  'bottom-sheet': 'items-end',
  'fullscreen': 'items-stretch',
}

// 모바일 컨텐츠 스타일
const mobileContentStyles = {
  'center': 'rounded-2xl max-h-[90vh]',
  'bottom-sheet': 'rounded-t-2xl rounded-b-none max-h-[85vh] w-full',
  'fullscreen': 'rounded-none h-full w-full',
}
```

**모바일 바텀시트 와이어프레임**:
```
┌─────────────────────────────────────────┐
│                                         │
│         (반투명 오버레이)                │
│                                         │
├─────────────────────────────────────────┤
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  ← 드래그 핸들
│ 모달 제목                          [X]  │
├─────────────────────────────────────────┤
│                                         │
│  모달 컨텐츠                            │
│  (스크롤 가능)                          │
│                                         │
├─────────────────────────────────────────┤
│ [취소]                        [확인]    │
└─────────────────────────────────────────┘
```

### 10.2 Tabs → 가로 스크롤

**현재 문제**: 탭이 많을 경우 모바일에서 줄바꿈되어 레이아웃 깨짐

**해결 방안**: 모바일에서 가로 스크롤 + 스크롤 인디케이터

```typescript
// Tabs.tsx 수정
<div className={`
  ${containerStyles[variant]} 
  ${fullWidth ? 'w-full' : 'inline-flex'}
  overflow-x-auto scrollbar-hide  // 가로 스크롤 추가
  -mx-4 px-4 lg:mx-0 lg:px-0      // 모바일 패딩 조정
  ${className}
`}>
  <div className="flex gap-1 min-w-max">  {/* min-w-max로 축소 방지 */}
    {items.map((item) => (...))}
  </div>
</div>
```

**CSS 추가 (globals.css)**:
```css
/* 스크롤바 숨기기 */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

### 10.3 Select → 네이티브 선택 또는 바텀시트

**현재 문제**: 커스텀 드롭다운이 모바일에서 조작 불편

**해결 방안**: 모바일에서 네이티브 select 또는 바텀시트 옵션

```typescript
// Select.tsx 수정
interface SelectProps {
  // 기존 props 유지
  mobileNative?: boolean  // 신규: 모바일에서 네이티브 select 사용
}

// 모바일 네이티브 렌더링
{isMobile && mobileNative ? (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-4 py-3 border rounded-lg text-base"  // 터치 최적화
  >
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
) : (
  // 기존 커스텀 드롭다운
)}
```

### 10.4 Toast → 위치 조정

**현재 문제**: 하단 네비게이션과 겹침

**해결 방안**: 모바일에서 위치 조정

```typescript
// Toast.tsx 수정
<div className={`
  fixed z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none
  bottom-20 right-4 lg:bottom-4  // 모바일: 하단 네비 위로
  left-4 right-4 lg:left-auto    // 모바일: 좌우 여백
`}>
```

### 10.5 DataTable → 카드뷰 + 가로 스크롤

**현재 문제**: 테이블이 모바일에서 읽기 어려움

**해결 방안**: 
1. 기본: 가로 스크롤 (현재)
2. 옵션: 카드뷰 모드

```typescript
// DataTable.tsx 수정
interface DataTableProps<T> {
  // 기존 props 유지
  viewMode?: 'table' | 'card'
  cardRender?: (row: T, index: number) => React.ReactNode
  mobileColumns?: string[]  // 모바일에서 표시할 컬럼 키
}

// 카드뷰 렌더링
{viewMode === 'card' ? (
  <div className="space-y-3">
    {sortedData.map((row, index) => (
      <div key={getRowKey(row, index)}>
        {cardRender ? cardRender(row, index) : (
          // 기본 카드 레이아웃
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border">
            {mobileColumns?.map((key) => (
              <div key={key} className="flex justify-between py-1">
                <span className="text-slate-500">{columns.find(c => c.key === key)?.header}</span>
                <span className="font-medium">{row[key]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
) : (
  // 기존 테이블 렌더링
)}
```

### 10.6 KPICard → 컴팩트 모드

**현재 문제**: 이미 반응형이지만 모바일에서 더 컴팩트하게

**해결 방안**: 모바일에서 패딩/폰트 축소

```typescript
// KPICard.tsx 수정
const sizes = {
  sm: {
    container: 'p-2 lg:p-3',
    value: 'text-lg lg:text-xl',
    title: 'text-[10px] lg:text-xs',
    icon: 'w-6 h-6 lg:w-8 lg:h-8 text-sm lg:text-lg',
  },
  md: {
    container: 'p-3 lg:p-4',
    value: 'text-xl lg:text-2xl',
    title: 'text-xs lg:text-sm',
    icon: 'w-8 h-8 lg:w-10 lg:h-10 text-base lg:text-xl',
  },
  // ...
}
```

### 10.7 Pagination → 간소화

**현재 문제**: 페이지 번호가 많으면 모바일에서 넘침

**해결 방안**: 모바일에서 이전/다음 + 현재 페이지만

```typescript
// Pagination.tsx 수정
// 모바일 간소화 버전
{isMobile ? (
  <div className="flex items-center justify-between w-full">
    <button onClick={onPrev} disabled={page === 1}>← 이전</button>
    <span className="text-sm">{page} / {totalPages}</span>
    <button onClick={onNext} disabled={page === totalPages}>다음 →</button>
  </div>
) : (
  // 기존 페이지네이션
)}
```

### 10.8 Chart → 가로 스크롤 컨테이너

**현재 문제**: 차트가 모바일에서 너무 압축됨

**해결 방안**: 최소 너비 설정 + 가로 스크롤

```typescript
// 차트 컨테이너
<div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
  <div className="min-w-[600px] lg:min-w-0">
    <Chart ... />
  </div>
</div>
```

---

## 11. 터치 최적화 가이드

### 11.1 터치 타겟 크기

```css
/* globals.css에 추가 */
@media (hover: none) and (pointer: coarse) {
  /* 터치 디바이스에서 최소 44px */
  .btn, button, a, input, select, textarea {
    min-height: 44px;
  }
  
  /* 터치 피드백 */
  .touchable:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}
```

### 11.2 스와이프 제스처 (선택적)

```typescript
// 카드 스와이프 삭제 예시 (react-swipeable 사용 시)
import { useSwipeable } from 'react-swipeable'

const handlers = useSwipeable({
  onSwipedLeft: () => onDelete(item.id),
  trackMouse: false,
})

<div {...handlers} className="relative">
  {/* 카드 내용 */}
</div>
```

### 11.3 Safe Area 대응 (노치/홈바)

```css
/* globals.css에 추가 */
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.safe-area-pt {
  padding-top: env(safe-area-inset-top, 0);
}
```

---

## 12. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2025-12-03 | 초안 작성 |
| 2.0 | 2025-12-03 | PC 충돌 최소화 전략 반영 |
| 2.1 | 2025-12-03 | 상세 구현 코드 및 체크리스트 추가 |
| 2.2 | 2025-12-03 | 모바일 UI 컴포넌트별 상세 구현 가이드 추가 |