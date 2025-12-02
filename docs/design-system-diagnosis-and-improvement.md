# Global Business Hub 디자인 시스템 진단 및 개선안

## 1. 개요

### 1.1 목적
Global Business Hub의 심미적 완성도와 구현도를 높이기 위한 상세 진단 및 개선안입니다.

### 1.2 브랜드 리소스 참고
- **로고**: `/brand/Rebranding Design Resources/.../01. BI/`
- **아이콘**: `/brand/Rebranding Design Resources/.../02. Profile/appicon-1024.png`
- **일러스트**: `/brand/Rebranding Design Resources/.../06. Line illust/`
- **패턴**: `/brand/Rebranding Design Resources/.../04. idus_icon_set/`

### 1.3 브랜드 컬러 (idus Rebranding 기준)
- **Primary Orange**: #F78C3A (idus 시그니처)
- **Dark Orange**: #E67729
- **Light Orange**: #FFF8F3
- **Neutral Dark**: #1F2937 (텍스트/UI)
- **Neutral Light**: #F9FAFB (배경)

---

## 2. 카테고리별 진단 및 개선안


### A. 디자인 토큰 (Design Tokens)

#### A1. 컬러 시스템

**현재 상태 진단:**
- ✅ CSS Variables로 체계적 정의됨
- ✅ idus 브랜드 컬러 (#F78C3A) 적용
- ⚠️ 다크모드 변수 정의되었으나 미완성
- ⚠️ 시맨틱 컬러 명명 불일치 (primary vs idus)
- ❌ 컬러 사용 가이드라인 부재

**개선안:**
```css
/* 제안: 시맨틱 컬러 체계 통일 */
:root {
  /* Brand */
  --color-brand-primary: #F78C3A;
  --color-brand-secondary: #E67729;
  --color-brand-tertiary: #FFF8F3;
  
  /* Surface */
  --color-surface-primary: #FFFFFF;
  --color-surface-secondary: #FAFBFC;
  --color-surface-tertiary: #F3F4F6;
  
  /* Text */
  --color-text-primary: #111827;
  --color-text-secondary: #4B5563;
  --color-text-tertiary: #9CA3AF;
  --color-text-inverse: #FFFFFF;
  
  /* Border */
  --color-border-default: #E5E7EB;
  --color-border-strong: #D1D5DB;
  --color-border-focus: #F78C3A;
}
```

**우선순위:** 🔴 높음

---

#### A2. 타이포그래피

**현재 상태 진단:**
- ✅ Pretendard 폰트 적용
- ⚠️ 폰트 스케일 체계 미정의 (Tailwind 기본값 사용)
- ⚠️ 행간(line-height) 일관성 부족
- ❌ 제목/본문 스타일 가이드 부재

**개선안:**
```css
/* 제안: 타이포그래피 스케일 */
:root {
  /* Font Sizes */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.8125rem;  /* 13px */
  --font-size-base: 0.875rem; /* 14px */
  --font-size-md: 1rem;       /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  
  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

**우선순위:** 🟡 중간

---

#### A3. 스페이싱

**현재 상태 진단:**
- ✅ Tailwind 기본 스페이싱 사용
- ⚠️ 컴포넌트 간 간격 불일치 (gap-4, gap-6 혼용)
- ⚠️ 카드 패딩 불일치 (p-4, p-5, p-6 혼용)

**개선안:**
```css
/* 제안: 일관된 스페이싱 스케일 */
:root {
  --spacing-xs: 0.25rem;  /* 4px */
  --spacing-sm: 0.5rem;   /* 8px */
  --spacing-md: 1rem;     /* 16px */
  --spacing-lg: 1.5rem;   /* 24px */
  --spacing-xl: 2rem;     /* 32px */
  --spacing-2xl: 3rem;    /* 48px */
  
  /* Component Specific */
  --card-padding: 1.5rem;
  --section-gap: 1.5rem;
  --page-padding: 1.5rem;
}
```

**우선순위:** 🟡 중간

---

#### A4. 그림자 & 깊이

**현재 상태 진단:**
- ✅ 4단계 그림자 정의됨
- ⚠️ 호버 시 그림자 변화 불일치
- ⚠️ 카드 기본 그림자 너무 약함

**개선안:**
```css
/* 제안: 그림자 체계 강화 */
:root {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.10);
  --shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.12);
  
  /* Colored Shadows */
  --shadow-brand: 0 4px 12px rgba(247, 140, 58, 0.25);
  --shadow-success: 0 4px 12px rgba(5, 150, 105, 0.20);
  --shadow-danger: 0 4px 12px rgba(220, 38, 38, 0.20);
}
```

**우선순위:** 🟢 낮음

---


### B. 레이아웃 (Layout)

#### B1. 사이드바

**현재 상태 진단:**
- ✅ 그룹화된 네비게이션 구조
- ✅ 모바일 반응형 지원
- ✅ idus 로고 및 브랜드 아이콘 적용
- ⚠️ 활성 메뉴 표시가 미약함 (bg-slate-100만 적용)
- ⚠️ 아이콘이 이모지로 통일성 부족
- ❌ 접기/펼치기 기능 미완성 (모바일만 동작)

**개선안:**
1. 활성 메뉴에 좌측 인디케이터 바 추가
2. 이모지 → SVG 아이콘 또는 idus 아이콘셋 활용
3. 데스크톱에서도 접기/펼치기 지원
4. 호버 시 브랜드 컬러 힌트 추가

```tsx
// 활성 메뉴 스타일 개선
className={`
  relative flex items-center gap-3 px-3 py-2.5 rounded-lg
  transition-all duration-200
  ${isActive
    ? 'bg-orange-50 text-orange-600 font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-orange-500 before:rounded-r-full'
    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }
`}
```

**우선순위:** 🔴 높음

---

#### B2. 헤더

**현재 상태 진단:**
- ✅ 검색바, 알림, 사용자 메뉴 구현
- ⚠️ 검색 기능 미연결 (UI만 존재)
- ⚠️ 알림 기능 미구현 (뱃지만 표시)
- ⚠️ 그라데이션 아바타가 브랜드 컬러와 불일치

**개선안:**
1. 검색바를 통합 검색(/lookup)과 연결
2. 알림 드롭다운 구현
3. 아바타 색상을 브랜드 컬러로 변경
4. 브레드크럼 추가 고려

```tsx
// 아바타 브랜드 컬러 적용
<div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
```

**우선순위:** 🟡 중간

---

#### B3. 페이지 헤더

**현재 상태 진단:**
- ✅ 그라데이션 배경 적용
- ⚠️ 페이지마다 스타일 불일치
- ⚠️ 일부 페이지는 그라데이션, 일부는 단색

**개선안:**
1. 공통 PageHeader 컴포넌트 생성
2. 3가지 변형 제공: gradient, solid, minimal
3. idus 브랜드 일러스트 배경 활용 가능

```tsx
// PageHeader 변형
type PageHeaderVariant = 'gradient' | 'solid' | 'minimal'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: string
  variant?: PageHeaderVariant
  actions?: React.ReactNode
}
```

**우선순위:** 🟡 중간

---

#### B4. 반응형 레이아웃

**현재 상태 진단:**
- ✅ 기본 반응형 그리드 적용
- ⚠️ 태블릿 브레이크포인트 최적화 부족
- ⚠️ 모바일에서 일부 테이블 가로 스크롤 필요
- ❌ 모바일 전용 네비게이션 UX 미흡

**개선안:**
1. 브레이크포인트 체계화: sm(640), md(768), lg(1024), xl(1280)
2. 모바일 우선 접근법 적용
3. 테이블 → 카드 뷰 전환 (모바일)

**우선순위:** 🟡 중간

---


### C. 공통 컴포넌트 (Common Components)

#### C1. 버튼

**현재 상태 진단:**
- ✅ 4종 버튼 스타일 정의 (primary, secondary, outline, ghost)
- ✅ 크기 변형 (sm, default, lg)
- ⚠️ 로딩 상태 미구현
- ⚠️ 아이콘 버튼 스타일 미정의
- ⚠️ 비활성화 상태 스타일 불일치

**개선안:**
```tsx
// Button 컴포넌트 Props
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

// 로딩 상태
{loading && (
  <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
)}
```

**우선순위:** 🔴 높음

---

#### C2. 카드

**현재 상태 진단:**
- ✅ 기본 .card 클래스 정의
- ⚠️ 변형 부족 (elevated, outlined만 존재)
- ⚠️ 호버 효과 미약
- ⚠️ 클릭 가능한 카드 스타일 미정의

**개선안:**
```tsx
// Card 변형
type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'interactive'

// Interactive 카드 (클릭 가능)
.card-interactive {
  cursor: pointer;
  transition: all 0.2s ease;
}
.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-brand-primary);
}
```

**우선순위:** 🟡 중간

---

#### C3. 입력 필드

**현재 상태 진단:**
- ✅ 기본 포커스 스타일 정의
- ⚠️ 에러 상태 스타일 미정의
- ⚠️ 도움말 텍스트 스타일 미정의
- ❌ 접두사/접미사 지원 없음

**개선안:**
```tsx
// Input 컴포넌트
interface InputProps {
  label?: string
  error?: string
  hint?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

// 에러 상태
.input-error {
  border-color: var(--color-danger);
  background-color: var(--color-danger-light);
}
.input-error:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
}
```

**우선순위:** 🟡 중간

---

#### C4. 모달

**현재 상태 진단:**
- ✅ 기본 모달 스타일 정의
- ✅ 애니메이션 적용
- ⚠️ 크기 변형 제한적 (large만)
- ⚠️ 닫기 버튼 위치/스타일 불일치

**개선안:**
```tsx
// Modal 크기 변형
type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const modalSizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw]',
}
```

**우선순위:** 🟢 낮음

---

#### C5. 탭

**현재 상태 진단:**
- ⚠️ 페이지마다 개별 구현
- ⚠️ 스타일 불일치 (일부는 버튼형, 일부는 언더라인형)
- ❌ 공통 컴포넌트 없음

**개선안:**
```tsx
// Tabs 컴포넌트
interface TabsProps {
  variant: 'underline' | 'pills' | 'enclosed'
  size: 'sm' | 'md' | 'lg'
  items: TabItem[]
  activeTab: string
  onChange: (tab: string) => void
}

// 변형 스타일
.tabs-underline .tab-active {
  border-bottom: 2px solid var(--color-brand-primary);
  color: var(--color-brand-primary);
}

.tabs-pills .tab-active {
  background: var(--color-brand-primary);
  color: white;
}
```

**우선순위:** 🔴 높음

---

#### C6. 테이블

**현재 상태 진단:**
- ✅ 기본 테이블 스타일 정의
- ⚠️ 정렬 기능 UI 미통일
- ⚠️ 선택 가능한 행 스타일 미정의
- ❌ 페이지네이션 공통 컴포넌트 없음

**개선안:**
```tsx
// DataTable 컴포넌트
interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  sortable?: boolean
  selectable?: boolean
  pagination?: PaginationConfig
  emptyState?: React.ReactNode
  loading?: boolean
}
```

**우선순위:** 🟡 중간

---

#### C7. 토스트/알림

**현재 상태 진단:**
- ❌ 토스트 시스템 미구현
- ❌ 성공/에러 피드백이 개별 구현

**개선안:**
```tsx
// Toast 시스템
interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
  action?: { label: string; onClick: () => void }
}

// 사용 예시
toast.success('저장되었습니다')
toast.error('오류가 발생했습니다', { description: '다시 시도해주세요' })
```

**우선순위:** 🔴 높음

---


### D. 데이터 시각화 (Data Visualization)

#### D1. KPI 카드

**현재 상태 진단:**
- ✅ 기본 KPI 카드 구현
- ✅ 변화율 표시 (증가/감소)
- ⚠️ 스파크라인/미니 차트 없음
- ⚠️ 목표 대비 진행률 표시 없음

**개선안:**
```tsx
// KPICard 컴포넌트
interface KPICardProps {
  title: string
  value: string | number
  change?: { value: number; period: string }
  trend?: number[] // 스파크라인 데이터
  target?: { value: number; label: string }
  icon?: string
  color?: 'default' | 'success' | 'warning' | 'danger'
}
```

**우선순위:** 🟡 중간

---

#### D2. 차트 스타일

**현재 상태 진단:**
- ✅ Chart.js 사용
- ✅ 브랜드 컬러 일부 적용
- ⚠️ 차트 스타일 가이드 부재
- ⚠️ 툴팁 스타일 불일치

**개선안:**
```javascript
// 공통 차트 옵션
const chartDefaults = {
  colors: {
    primary: '#F78C3A',
    secondary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
  tooltip: {
    backgroundColor: 'white',
    titleColor: '#1f2937',
    bodyColor: '#4b5563',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    padding: 12,
    cornerRadius: 8,
  },
  legend: {
    position: 'bottom',
    labels: {
      usePointStyle: true,
      padding: 20,
    },
  },
}
```

**우선순위:** 🟢 낮음

---

### E. 네비게이션 (Navigation)

#### E1. 브레드크럼

**현재 상태 진단:**
- ❌ 브레드크럼 미구현
- ❌ 현재 위치 표시 부재

**개선안:**
```tsx
// Breadcrumb 컴포넌트
interface BreadcrumbItem {
  label: string
  href?: string
  icon?: string
}

// 사용 예시
<Breadcrumb items={[
  { label: '홈', href: '/', icon: '🏠' },
  { label: '분석', href: '/analytics' },
  { label: '고객 분석' },
]} />
```

**우선순위:** 🟢 낮음

---

#### E2. 페이지네이션

**현재 상태 진단:**
- ⚠️ 일부 페이지에서 개별 구현
- ⚠️ 스타일 불일치
- ❌ 공통 컴포넌트 없음

**개선안:**
```tsx
// Pagination 컴포넌트
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  siblingCount?: number
}
```

**우선순위:** 🟡 중간

---

### F. 폼 & 입력 (Forms & Inputs)

#### F1. 폼 레이아웃

**현재 상태 진단:**
- ⚠️ 폼 레이아웃 불일치
- ⚠️ 라벨 위치/스타일 불일치
- ❌ 폼 그룹 컴포넌트 없음

**개선안:**
```tsx
// FormField 컴포넌트
interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}

<FormField label="쿠폰명" required error={errors.name}>
  <Input {...register('name')} />
</FormField>
```

**우선순위:** 🟡 중간

---

#### F2. 셀렉트/드롭다운

**현재 상태 진단:**
- ✅ 기본 select 스타일 적용
- ⚠️ 커스텀 드롭다운 없음
- ❌ 멀티셀렉트 없음
- ❌ 검색 가능한 셀렉트 없음

**개선안:**
```tsx
// Select 컴포넌트
interface SelectProps {
  options: SelectOption[]
  value: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  searchable?: boolean
  placeholder?: string
}
```

**우선순위:** 🟡 중간

---

### G. 피드백 & 상태 (Feedback & States)

#### G1. 로딩 상태

**현재 상태 진단:**
- ✅ 스피너 애니메이션 존재
- ⚠️ 스피너 스타일 불일치
- ⚠️ 스켈레톤 CSS만 정의, 컴포넌트 없음
- ❌ 페이지 로딩 인디케이터 없음

**개선안:**
```tsx
// Spinner 컴포넌트
interface SpinnerProps {
  size: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white' | 'gray'
}

// Skeleton 컴포넌트
interface SkeletonProps {
  variant: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave'
}
```

**우선순위:** 🔴 높음

---

#### G2. 빈 상태

**현재 상태 진단:**
- ⚠️ 개별 페이지에서 다르게 구현
- ⚠️ 일러스트/아이콘 불일치

**개선안:**
```tsx
// EmptyState 컴포넌트
interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

// idus 라인 일러스트 활용
<EmptyState
  icon="/brand/.../06. Line illust/line01.png"
  title="데이터가 없습니다"
  description="조건을 변경하여 다시 검색해보세요"
/>
```

**우선순위:** 🟡 중간

---

#### G3. 확인 다이얼로그

**현재 상태 진단:**
- ❌ 확인 다이얼로그 미구현
- ❌ 삭제/위험 작업 확인 UI 없음

**개선안:**
```tsx
// ConfirmDialog 컴포넌트
interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}
```

**우선순위:** 🟡 중간

---


### H. 접근성 (Accessibility)

#### H1. 키보드 네비게이션

**현재 상태 진단:**
- ⚠️ 기본 탭 순서만 지원
- ❌ 모달 포커스 트랩 없음
- ❌ 드롭다운 키보드 조작 미지원

**개선안:**
1. 모든 인터랙티브 요소에 tabIndex 적용
2. 모달 열릴 때 포커스 트랩 구현
3. Escape 키로 모달/드롭다운 닫기

**우선순위:** 🟡 중간

---

#### H2. 포커스 표시

**현재 상태 진단:**
- ✅ 기본 포커스 링 존재
- ⚠️ 포커스 링 색상이 브랜드와 불일치
- ⚠️ 일부 요소에서 포커스 표시 안됨

**개선안:**
```css
/* 브랜드 컬러 포커스 링 */
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px white, 0 0 0 4px var(--color-brand-primary);
}

/* 다크 배경에서 */
.dark :focus-visible {
  box-shadow: 0 0 0 2px var(--color-surface-primary), 0 0 0 4px var(--color-brand-primary);
}
```

**우선순위:** 🟡 중간

---

#### H3. 색상 대비

**현재 상태 진단:**
- ⚠️ WCAG 기준 미검토
- ⚠️ 일부 회색 텍스트 대비 부족 가능성

**개선안:**
1. 모든 텍스트 색상 WCAG AA 기준 검토
2. 최소 대비율 4.5:1 확보
3. 중요 정보는 색상 외 다른 표시 추가

**우선순위:** 🟢 낮음

---

## 3. 페이지별 개선 포인트

### 3.1 대시보드

| 항목 | 현재 | 개선안 |
|------|------|--------|
| KPI 카드 | 기본 스타일 | 스파크라인 추가, 호버 효과 강화 |
| 차트 | Chart.js 기본 | 브랜드 컬러 통일, 툴팁 개선 |
| 할 일 목록 | 우선순위별 분류 | 체크박스 추가, 완료 애니메이션 |
| 물류 현황 | 파이프라인 시각화 | 애니메이션 추가, 클릭 인터랙션 |

### 3.2 쿠폰 생성/발급

| 항목 | 현재 | 개선안 |
|------|------|--------|
| 탭 | 버튼형 | 공통 Tabs 컴포넌트 적용 |
| 폼 | 개별 스타일 | FormField 컴포넌트 적용 |
| 쿼리 미리보기 | 코드 블록 | 구문 강조, 복사 피드백 개선 |

### 3.3 고객 분석

| 항목 | 현재 | 개선안 |
|------|------|--------|
| 세그먼트 카드 | 클릭 가능 | 호버 효과 강화, 선택 상태 명확화 |
| 차트 | 기본 스타일 | 인터랙션 강화, 드릴다운 지원 |
| 테이블 | 기본 스타일 | 정렬/필터 UI 개선 |

### 3.4 AI 어시스턴트

| 항목 | 현재 | 개선안 |
|------|------|--------|
| 채팅 버블 | 기본 스타일 | 타이핑 인디케이터, 시간 표시 |
| 입력 영역 | 기본 textarea | 자동 높이 조절, 전송 버튼 개선 |
| 응답 포맷 | 마크다운 | 코드 블록 스타일링, 테이블 지원 |

---

## 4. 구현 우선순위 요약

### 🔴 높음 (Phase 1)
1. **컬러 시스템 통일** (A1)
2. **버튼 컴포넌트** (C1)
3. **탭 컴포넌트** (C5)
4. **토스트 시스템** (C7)
5. **로딩 상태 통일** (G1)
6. **사이드바 활성 메뉴 개선** (B1)

### 🟡 중간 (Phase 2)
1. 타이포그래피 스케일 (A2)
2. 스페이싱 체계화 (A3)
3. 카드 컴포넌트 (C2)
4. 입력 필드 컴포넌트 (C3)
5. 테이블 컴포넌트 (C6)
6. 페이지네이션 (E2)
7. 폼 레이아웃 (F1)
8. 빈 상태 컴포넌트 (G2)
9. 확인 다이얼로그 (G3)

### 🟢 낮음 (Phase 3)
1. 그림자 체계 (A4)
2. 모달 개선 (C4)
3. KPI 카드 고도화 (D1)
4. 차트 스타일 가이드 (D2)
5. 브레드크럼 (E1)
6. 접근성 전면 검토 (H)

---

## 5. 브랜드 리소스 활용 계획

### 5.1 로고
- 사이드바: `appicon-1024.png` (현재 적용됨)
- 로딩 화면: `logo_without_BG.png` 활용 가능

### 5.2 일러스트
- 빈 상태: `06. Line illust/` 폴더의 라인 일러스트 활용
- 온보딩: `04. idus_icon_set/` 아이콘 활용

### 5.3 패턴
- 페이지 헤더 배경: `07. Cover images/logo_pattern.jpg` 활용 가능
- 카드 배경: `2.4.4_pattern A_*.png` 패턴 활용

### 5.4 컬러
- Primary: #F78C3A (idus Orange) - 현재 적용됨
- 그라데이션: Orange → Coral 계열 유지

---

## 6. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-12-02 | - | 초안 작성 - 전체 진단 및 개선안 |
| 1.1 | 2025-12-02 | - | Phase 1 높은 우선순위 항목 구현: Button(C1), Tabs(C5), Toast(C7), Loading(G1), Sidebar(B1) |
| 1.2 | 2025-12-02 | - | Phase 2 중간 우선순위 항목 구현: Card(C2), Input(C3), Modal(C4), Select(F2), Badge, Tooltip, ConfirmDialog(G3) |
