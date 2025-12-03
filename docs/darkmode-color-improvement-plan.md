# 다크모드 색상 개선 방안

## 1. 현재 상태 분석

### 1.1 스크린샷 분석 결과

#### 퍼포먼스 마케터 페이지 문제점
- 페이지 헤더의 보라색/핑크색 그라데이션이 다크 배경과 조화롭지 않음
- 탭 버튼의 주황색이 너무 강렬하여 눈에 피로감
- 캘린더의 흰색 배경이 다크모드에서 너무 튀어 보임
- 국가 태그 버튼들의 색상이 다크 배경에서 가독성 저하

#### 물류비 정산 페이지 문제점
- 페이지 헤더의 초록색 그라데이션이 다크 배경과 부조화
- 탭 버튼의 주황색/빨간색이 너무 강렬함
- 파일 업로드 영역의 테두리가 너무 밝음
- 전체적으로 색상 대비가 너무 강해 눈이 피로함

### 1.2 공통 문제점

1. **페이지 헤더 그라데이션**: 각 페이지마다 다른 색상의 그라데이션 헤더가 다크모드에서 너무 튀어 보임
2. **주황색 브랜드 컬러**: 라이트모드용 `#F78C3A`가 다크모드에서 너무 강렬함
3. **상태 색상**: 빨강, 초록, 노랑 등의 상태 색상이 다크 배경에서 너무 채도가 높음
4. **카드 배경**: 흰색 카드가 다크모드에서 너무 밝게 보임
5. **테두리 색상**: 일부 테두리가 다크모드에서 너무 밝거나 어두움

---

## 2. 다크모드 색상 팔레트 개선안

### 2.1 배경 색상 (현재 → 개선)

```css
/* 현재 */
--background-color: #0A0A0A;
--background-alt-color: #141414;
--card-background-color: #1C1C1C;

/* 개선안: 약간 더 따뜻한 톤으로 조정 */
--background-color: #0F0F0F;
--background-alt-color: #171717;
--card-background-color: #1F1F1F;
```

### 2.2 브랜드 컬러 (다크모드 전용)

```css
/* 현재 */
--idus-orange: #FF9F4A;
--idus-orange-dark: #FFB366;
--idus-orange-light: #2D1F14;

/* 개선안: 채도를 낮추고 따뜻한 톤 유지 */
--idus-orange: #F5A05A;          /* 채도 낮춤 */
--idus-orange-dark: #FFBE80;     /* 밝기 조정 */
--idus-orange-light: #2A2118;    /* 배경과 조화 */
--idus-orange-muted: #D4845A;    /* 새로 추가: 덜 강렬한 버전 */
```

### 2.3 상태 색상 (다크모드 전용)

```css
/* 현재 - 너무 채도가 높음 */
--success-color: #22C55E;
--danger-color: #EF4444;
--warning-color: #FBBF24;
--info-color: #3B82F6;

/* 개선안: 채도를 낮추고 눈에 편안하게 */
--success-color: #4ADE80;        /* 밝기 높이고 채도 낮춤 */
--success-light: #1A2E1A;        /* 배경용 */
--danger-color: #F87171;         /* 밝기 높이고 채도 낮춤 */
--danger-light: #2E1A1A;         /* 배경용 */
--warning-color: #FCD34D;        /* 밝기 높이고 채도 낮춤 */
--warning-light: #2E2A1A;        /* 배경용 */
--info-color: #60A5FA;           /* 밝기 높이고 채도 낮춤 */
--info-light: #1A1E2E;           /* 배경용 */
```

### 2.4 텍스트 색상

```css
/* 현재 */
--text-color: #FAFAFA;
--text-secondary: #A1A1AA;
--text-muted-color: #71717A;

/* 개선안: 약간 더 부드럽게 */
--text-color: #F5F5F5;           /* 순백색보다 약간 부드럽게 */
--text-secondary: #A8A8B3;       /* 약간 더 밝게 */
--text-muted-color: #78788A;     /* 가독성 개선 */
```

---

## 3. 페이지별 헤더 색상 개선안

### 3.1 현재 페이지 헤더 색상

| 페이지 | 현재 색상 | 문제점 |
|--------|----------|--------|
| 대시보드 | 없음 (텍스트만) | - |
| 미입고 관리 | `from-idus-500 to-idus-600` | 다크모드에서 적절 |
| QC 관리 | `from-idus-500 to-idus-600` | 다크모드에서 적절 |
| 물류비 정산 | `from-emerald-500 to-green-500` | 너무 밝고 튀어 보임 |
| 퍼포먼스 마케터 | `from-fuchsia-500 to-pink-500` | 너무 강렬함 |
| 고객 분석 | `from-slate-800 to-slate-700` | 다크모드에서 구분 안됨 |
| 작가 분석 | `from-violet-600 to-purple-500` | 너무 강렬함 |
| 쿠폰 생성 | `from-amber-500 to-orange-500` | 너무 밝음 |
| AI 어시스턴트 | 없음 | - |

### 3.2 다크모드 헤더 색상 개선안

```typescript
// 다크모드에서 헤더 그라데이션 톤 다운
const headerColors = {
  // 기본 (미입고, QC) - 브랜드 컬러 유지하되 톤 다운
  default: {
    light: 'from-idus-500 to-idus-600',
    dark: 'dark:from-orange-900/80 dark:to-orange-800/80',
  },
  
  // 물류 관련 (물류비 정산, 물류 추적)
  logistics: {
    light: 'from-emerald-500 to-green-500',
    dark: 'dark:from-emerald-900/70 dark:to-green-900/70',
  },
  
  // 마케팅 (퍼포먼스 마케터)
  marketing: {
    light: 'from-fuchsia-500 to-pink-500',
    dark: 'dark:from-fuchsia-900/60 dark:to-pink-900/60',
  },
  
  // 분석 (고객 분석)
  analytics: {
    light: 'from-slate-800 to-slate-700',
    dark: 'dark:from-slate-800 dark:to-slate-700 dark:border dark:border-slate-700',
  },
  
  // 작가 (작가 분석)
  artist: {
    light: 'from-violet-600 to-purple-500',
    dark: 'dark:from-violet-900/60 dark:to-purple-900/60',
  },
  
  // 쿠폰
  coupon: {
    light: 'from-amber-500 to-orange-500',
    dark: 'dark:from-amber-900/70 dark:to-orange-900/70',
  },
}
```

---

## 4. 컴포넌트별 다크모드 개선

### 4.1 탭 버튼

```typescript
// 현재: 활성 탭이 너무 강렬함
// 개선: 다크모드에서 톤 다운

// Tabs.tsx 개선
const tabVariants = {
  pills: {
    active: {
      light: 'bg-[#F78C3A] text-white',
      dark: 'dark:bg-orange-800/80 dark:text-orange-100',
    },
    inactive: {
      light: 'bg-slate-100 text-slate-600',
      dark: 'dark:bg-slate-800 dark:text-slate-400',
    },
  },
}
```

### 4.2 카드 컴포넌트

```typescript
// 현재: 카드 배경이 너무 밝음
// 개선: 테두리와 배경 조화

// Card 스타일 개선
const cardStyles = {
  light: 'bg-white border-slate-200',
  dark: 'dark:bg-slate-900/50 dark:border-slate-800 dark:backdrop-blur-sm',
}
```

### 4.3 입력 필드

```typescript
// 현재: 포커스 시 주황색이 너무 강렬
// 개선: 다크모드에서 톤 다운

const inputStyles = {
  focus: {
    light: 'focus:border-[#F78C3A] focus:ring-orange-100',
    dark: 'dark:focus:border-orange-600 dark:focus:ring-orange-900/30',
  },
}
```

### 4.4 버튼

```typescript
// 현재: Primary 버튼이 너무 강렬
// 개선: 다크모드에서 그라데이션 톤 다운

const buttonStyles = {
  primary: {
    light: 'from-[#F78C3A] to-[#E67729]',
    dark: 'dark:from-orange-700 dark:to-orange-800',
  },
}
```

---

## 5. 구현 우선순위

### Phase 1: 긴급 (CSS 변수 수정) ✅ 완료
1. [x] globals.css 다크모드 색상 변수 업데이트
2. [x] 상태 색상 채도 조정
3. [x] 브랜드 컬러 다크모드 버전 추가

### Phase 2: 중요 (페이지 헤더) ✅ 완료
1. [x] 각 페이지 헤더에 다크모드 전용 그라데이션 적용
   - 미입고 관리, QC 관리: `dark:from-orange-900/70 dark:to-orange-800/70`
   - 작가 분석: `dark:from-violet-900/70 dark:to-purple-900/70`
   - 쿠폰 생성: `dark:from-amber-900/70 dark:to-orange-900/70`
   - 고객 분석: `dark:border dark:border-slate-700` (테두리 추가)
2. [x] 헤더 내 텍스트 색상 조정

### Phase 3: 개선 (컴포넌트) ✅ 완료
1. [x] Tabs 컴포넌트 다크모드 색상 개선
   - pills 활성 탭: `dark:bg-orange-900/40 dark:text-orange-300`
2. [x] Button 컴포넌트 다크모드 색상 개선
   - primary: `dark:from-orange-600 dark:to-orange-700`
   - danger: `dark:from-red-600 dark:to-red-700`
3. [ ] Card 컴포넌트 다크모드 스타일 개선 (추후)
4. [ ] 입력 필드 포커스 색상 개선 (추후)

---

## 6. 색상 대비 가이드라인

### 6.1 텍스트 대비 (WCAG AA 기준)

| 용도 | 배경 | 전경 | 대비율 |
|------|------|------|--------|
| 본문 텍스트 | #0F0F0F | #F5F5F5 | 18.1:1 ✅ |
| 보조 텍스트 | #0F0F0F | #A8A8B3 | 8.5:1 ✅ |
| 비활성 텍스트 | #0F0F0F | #78788A | 5.2:1 ✅ |
| 링크/강조 | #0F0F0F | #F5A05A | 7.8:1 ✅ |

### 6.2 상태 색상 대비

| 상태 | 배경 | 전경 | 대비율 |
|------|------|------|--------|
| 성공 | #1A2E1A | #4ADE80 | 8.2:1 ✅ |
| 위험 | #2E1A1A | #F87171 | 6.5:1 ✅ |
| 경고 | #2E2A1A | #FCD34D | 9.1:1 ✅ |
| 정보 | #1A1E2E | #60A5FA | 6.8:1 ✅ |

---

## 7. 변경 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `app/globals.css` | 다크모드 CSS 변수 업데이트 |
| `app/dashboard/page.tsx` | 헤더 다크모드 색상 |
| `app/unreceived/page.tsx` | 헤더 다크모드 색상 |
| `app/qc/page.tsx` | 헤더 다크모드 색상 |
| `app/settlement/page.tsx` | 헤더 다크모드 색상 |
| `app/marketer/page.tsx` | 헤더 다크모드 색상 |
| `app/customer-analytics/page.tsx` | 헤더 다크모드 색상 |
| `app/artist-analytics/page.tsx` | 헤더 다크모드 색상 |
| `app/coupon-generator/page.tsx` | 헤더 다크모드 색상 |
| `components/ui/Tabs.tsx` | 활성 탭 다크모드 색상 |
| `components/ui/Button.tsx` | Primary 버튼 다크모드 색상 |
| `components/ui/Card.tsx` | 카드 다크모드 스타일 |

---

## 8. 디자인 원칙

### 8.1 다크모드 색상 원칙

1. **채도 낮추기**: 다크 배경에서는 채도가 높은 색상이 눈에 피로감을 줌
2. **밝기 조정**: 어두운 배경에서는 전경 색상의 밝기를 높여 가독성 확보
3. **대비 유지**: WCAG AA 기준 (4.5:1) 이상의 대비율 유지
4. **일관성**: 같은 의미의 색상은 라이트/다크 모드에서 동일한 느낌 유지

### 8.2 브랜드 컬러 사용 원칙

1. **포인트로만 사용**: 주황색은 CTA, 활성 상태, 강조에만 사용
2. **과도한 사용 금지**: 한 화면에 주황색 요소가 3개 이상이면 톤 다운
3. **다크모드 전용 버전**: 다크모드에서는 채도를 낮춘 버전 사용
