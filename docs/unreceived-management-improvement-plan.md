# 미입고 관리 페이지 개선 계획서

## 1. 개요

### 1.1 목적
미입고 관리 페이지는 긴급한 업무를 처리하는 핵심 페이지입니다. 현재 헤더는 깔끔하지만 데이터 테이블 영역이 산만하고 가독성이 떨어져 사용자 경험이 개선이 필요합니다. 다른 페이지들과의 일관성을 확보하고, 업무 효율성을 높이는 디자인 및 UX/UI 개선을 진행합니다.

### 1.2 현재 상태 분석

#### 강점
- ✅ 헤더 디자인: idus 브랜드 스타일 적용, 깔끔한 레이아웃
- ✅ 긴급 알림 배너: 14일 이상 지연 항목 강조
- ✅ KPI 카드: 핵심 지표 요약 제공
- ✅ 반응형 디자인: 모바일/데스크톱 대응

#### 개선 필요 사항
- ❌ **테이블 디자인**: 기본 HTML 테이블로 시각적 완성도 부족
- ❌ **필터 구성**: 빠른 필터 칩과 상세 필터가 분리되어 혼란
- ❌ **데이터 가독성**: 행 구분이 불명확, 중요 정보 강조 부족
- ❌ **액션 버튼**: 일관성 없는 버튼 스타일
- ❌ **빈 공간 활용**: 여백이 많아 정보 밀도가 낮음
- ❌ **시각적 계층**: 중요도에 따른 시각적 구분 부족

### 1.3 개선 목표
- **시각적 완성도**: 프리미엄 대시보드 수준의 세련된 테이블 디자인
- **정보 밀도**: 효율적인 공간 활용으로 한눈에 파악 가능
- **사용성**: 직관적인 필터링 및 액션 제공
- **일관성**: 다른 페이지들과 통일된 디자인 시스템
- **업무 효율성**: 긴급 항목 우선 처리, 빠른 액션 가능

---

## 2. 디자인 개선안

### 2.1 전체 레이아웃 재구성

#### 2.1.1 현재 구조
```
┌─────────────────────────────────┐
│ 헤더 (깔끔함)                    │
├─────────────────────────────────┤
│ 긴급 알림 배너                   │
├─────────────────────────────────┤
│ KPI 카드 (4개)                   │
├─────────────────────────────────┤
│ 빠른 필터 칩 (4개)               │
├─────────────────────────────────┤
│ 상세 필터 (카드)                 │
├─────────────────────────────────┤
│ 테이블 (산만함)                  │
└─────────────────────────────────┘
```

#### 2.1.2 개선된 구조
```
┌─────────────────────────────────┐
│ 헤더 (유지)                      │
├─────────────────────────────────┤
│ 긴급 알림 배너 (강화)            │
├─────────────────────────────────┤
│ KPI 카드 + 빠른 필터 (통합)      │
├─────────────────────────────────┤
│ 통합 필터 섹션 (개선)            │
├─────────────────────────────────┤
│ 향상된 테이블 (프리미엄 디자인)  │
└─────────────────────────────────┘
```

### 2.2 테이블 디자인 개선

#### 2.2.1 현재 문제점
- 기본 HTML 테이블 스타일
- 행 구분이 불명확
- 중요 정보 강조 부족
- 액션 버튼 일관성 부족
- 호버 효과 미흡

#### 2.2.2 개선 방안

**A. 카드 스타일 테이블 (추천)**
- 각 행을 카드 형태로 표시
- 경과일에 따른 색상 구분 강화
- 중요 정보 시각적 강조
- 액션 버튼 그룹화

**B. 향상된 테이블 스타일**
- 더 명확한 행 구분선
- 스트라이프 패턴 (짝수/홀수 행)
- 중요 컬럼 강조
- 고정 헤더 (스크롤 시)

### 2.3 필터 구성 개선

#### 2.3.1 통합 필터 섹션
- 빠른 필터 칩과 상세 필터를 하나의 섹션으로 통합
- 검색, 드롭다운, 빠른 필터를 논리적으로 그룹화
- 필터 상태 시각적 표시

#### 2.3.2 필터 레이아웃
```
┌─────────────────────────────────────────┐
│ [검색 입력] [지연 상태 ▼] [주문 유형 ▼] │
│ [전체] [14일+] [7일+] [3-7일]          │
└─────────────────────────────────────────┘
```

---

## 3. 상세 개선안

### 3.1 헤더 영역 (유지 및 미세 조정)

#### 3.1.1 현재 상태
- ✅ idus 브랜드 스타일 적용
- ✅ 아이콘 + 제목 + 설명 구조
- ✅ 배경 패턴 적용

#### 3.1.2 개선 사항
- 헤더는 현재 상태 유지
- 필요 시 빠른 액션 버튼 추가 (일괄 처리 등)

### 3.2 긴급 알림 배너 강화

#### 3.2.1 현재 상태
- 기본적인 알림 배너
- 확인 버튼만 제공

#### 3.2.2 개선 방안
```tsx
<div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 mb-6 shadow-lg">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-white font-bold text-lg">
          긴급: 14일 이상 지연된 항목 {criticalCount}건
        </p>
        <p className="text-red-100 text-sm">
          즉시 확인 및 조치가 필요합니다
        </p>
      </div>
    </div>
    <button className="px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors">
      긴급 항목 확인 →
    </button>
  </div>
</div>
```

### 3.3 KPI 카드 + 빠른 필터 통합

#### 3.3.1 현재 상태
- KPI 카드와 빠른 필터가 분리됨
- 공간 활용 비효율적

#### 3.3.2 개선 방안
```tsx
<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
  {/* KPI 카드 */}
  <div className="grid grid-cols-4 gap-4 mb-6">
    {/* KPI 카드들 */}
  </div>
  
  {/* 빠른 필터 (인라인) */}
  <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">빠른 필터:</span>
    {/* 필터 칩들 */}
  </div>
</div>
```

### 3.4 통합 필터 섹션 개선

#### 3.4.1 현재 상태
- 빠른 필터 칩과 상세 필터가 분리
- 모바일에서 토글 방식

#### 3.4.2 개선 방안
```tsx
<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 mb-6">
  <div className="flex items-center gap-2 mb-4">
    <Filter className="w-5 h-5 text-slate-500" />
    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">필터</h3>
  </div>
  
  {/* 검색 및 드롭다운 (상단) */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    {/* 검색, 지연 상태, 주문 유형 */}
  </div>
  
  {/* 빠른 필터 칩 (하단) */}
  <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-slate-200 dark:border-slate-700">
    <span className="text-xs text-slate-500 dark:text-slate-400">빠른 선택:</span>
    {/* 필터 칩들 */}
  </div>
</div>
```

### 3.5 테이블 디자인 개선

#### 3.5.1 카드 스타일 테이블 (추천)

**장점:**
- 시각적 완성도 높음
- 중요 정보 강조 용이
- 모바일과 데스크톱 통일
- 확장성 좋음

**구현:**
```tsx
<div className="space-y-3">
  {filteredItems.map((item) => (
    <div
      key={item.orderCode}
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl border-2 p-5 transition-all',
        'hover:shadow-lg hover:-translate-y-0.5',
        item.daysElapsed >= 14
          ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
          : item.daysElapsed >= 7
          ? 'border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10'
          : item.daysElapsed >= 3
          ? 'border-yellow-300 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10'
          : 'border-slate-200 dark:border-slate-800'
      )}
    >
      {/* 카드 헤더: 주문번호 + 경과일 + 액션 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => openOrderDetailModal(item.orderCode)}
              className="text-lg font-bold text-idus-500 hover:text-idus-600 hover:underline"
            >
              {item.orderCode}
            </button>
            <DelayBadge days={item.daysElapsed} />
            {item.isBundle && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                묶음 주문
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            주문일: {item.orderDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(item.orderCode, item.currentStatus || '')}
            className="px-4 py-2 bg-idus-500 text-white rounded-lg hover:bg-idus-600 transition-colors text-sm font-medium"
          >
            메모 수정
          </button>
        </div>
      </div>
      
      {/* 작가명 + 작품명 */}
      <div className="mb-3">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
          {item.artistName}
        </p>
        <p className="text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
          {item.productName}
        </p>
      </div>
      
      {/* 메모 */}
      {item.currentStatus && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-2">
            <MessageCircle className="w-4 h-4 text-slate-400 mt-0.5" />
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {item.currentStatus}
            </p>
          </div>
        </div>
      )}
    </div>
  ))}
</div>
```

#### 3.5.2 향상된 테이블 스타일 (대안)

**장점:**
- 전통적인 테이블 형태
- 많은 데이터 표시에 적합
- 정렬 기능 용이

**구현:**
```tsx
<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            주문번호
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            작가명
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            작품명
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            주문일
          </th>
          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            경과일
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            메모
          </th>
          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            액션
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
        {filteredItems.map((item, index) => (
          <tr
            key={item.orderCode}
            className={cn(
              'transition-colors',
              item.daysElapsed >= 14
                ? 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20'
                : item.daysElapsed >= 7
                ? 'bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-100/50 dark:hover:bg-orange-900/20'
                : item.daysElapsed >= 3
                ? 'bg-yellow-50/50 dark:bg-yellow-900/10 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20'
                : index % 2 === 0
                ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                : 'bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            {/* 테이블 셀들 */}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### 3.6 액션 버튼 개선

#### 3.6.1 현재 상태
- 단순 "수정" 버튼
- 일관성 부족

#### 3.6.2 개선 방안
```tsx
<div className="flex items-center gap-2">
  <button
    onClick={() => openOrderDetailModal(item.orderCode)}
    className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-idus-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
  >
    상세보기
  </button>
  <button
    onClick={() => handleOpenModal(item.orderCode, item.currentStatus || '')}
    className="px-4 py-1.5 text-sm font-medium text-white bg-idus-500 hover:bg-idus-600 rounded-lg transition-colors shadow-sm"
  >
    메모 수정
  </button>
</div>
```

### 3.7 빈 상태 개선

#### 3.7.1 현재 상태
- 기본적인 빈 상태 메시지

#### 3.7.2 개선 방안
```tsx
<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
    <Package className="w-10 h-10 text-slate-400" />
  </div>
  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
    미입고 항목이 없습니다
  </h3>
  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
    모든 주문이 정상적으로 처리되었습니다.
  </p>
  <button
    onClick={() => {
      setDelayFilter('all')
      setSearchTerm('')
    }}
    className="px-4 py-2 text-sm font-medium text-idus-500 hover:text-idus-600 hover:bg-idus-50 dark:hover:bg-idus-900/20 rounded-lg transition-colors"
  >
    필터 초기화
  </button>
</div>
```

---

## 4. 기능 개선안

### 4.1 정렬 기능

#### 4.1.1 추가 기능
- 경과일 기준 정렬 (기본: 내림차순)
- 주문일 기준 정렬
- 작가명 기준 정렬
- 정렬 방향 표시 (↑↓)

### 4.2 일괄 처리 기능

#### 4.2.1 체크박스 선택
- 여러 항목 선택 가능
- 선택된 항목 일괄 메모 수정
- 선택된 항목 일괄 처리 완료 표시

### 4.3 내보내기 기능

#### 4.3.1 데이터 내보내기
- CSV 내보내기
- Excel 내보내기
- 현재 필터 적용된 데이터만 내보내기

### 4.4 고급 필터

#### 4.4.1 추가 필터 옵션
- 작가별 필터
- 주문일 범위 필터
- 메모 유무 필터
- 묶음/단일 주문 필터 강화

### 4.5 빠른 액션

#### 4.5.1 컨텍스트 메뉴
- 행 우클릭 메뉴
- 빠른 메모 추가
- 주문 상세 보기
- 작가 페이지로 이동

---

## 5. UX/UI 개선안

### 5.1 시각적 계층 구조

#### 5.1.1 중요도별 색상 구분
```
14일 이상 (긴급): 빨간색 강조
  - 배경: bg-red-50/50
  - 테두리: border-red-300
  - 텍스트: text-red-700

7일 이상 (주의): 주황색 강조
  - 배경: bg-orange-50/50
  - 테두리: border-orange-300
  - 텍스트: text-orange-700

3-7일 (경고): 노란색 강조
  - 배경: bg-yellow-50/50
  - 테두리: border-yellow-300
  - 텍스트: text-yellow-700

3일 미만 (정상): 기본 스타일
  - 배경: bg-white
  - 테두리: border-slate-200
  - 텍스트: text-slate-900
```

### 5.2 인터랙션 개선

#### 5.2.1 호버 효과
- 행 호버 시 그림자 및 위치 이동
- 버튼 호버 시 색상 변화
- 클릭 가능 요소 시각적 표시

#### 5.2.2 로딩 상태
- 스켈레톤 UI 적용
- 부분 로딩 표시
- 진행 상태 인디케이터

#### 5.2.3 피드백
- 액션 성공/실패 토스트
- 변경 사항 저장 확인
- 필터 적용 시 결과 수 표시

### 5.3 정보 밀도 최적화

#### 5.3.1 컴팩트 모드
- 더 많은 정보를 한 화면에 표시
- 옵션으로 제공 (기본/컴팩트)

#### 5.3.2 확장 가능한 행
- 클릭 시 상세 정보 표시
- 관련 주문 정보 표시
- 처리 이력 표시

### 5.4 접근성 개선

#### 5.4.1 키보드 네비게이션
- Tab 키로 필터 이동
- Enter 키로 검색 실행
- 화살표 키로 행 이동

#### 5.4.2 스크린 리더 지원
- ARIA 레이블 추가
- 테이블 구조 명확화
- 상태 변경 알림

---

## 6. 기술적 구현

### 6.1 컴포넌트 구조

```
components/
├── unreceived/
│   ├── UnreceivedTable.tsx        (신규, 향상된 테이블)
│   ├── UnreceivedCard.tsx          (신규, 카드 뷰)
│   ├── UnreceivedFilters.tsx     (신규, 통합 필터)
│   ├── UnreceivedKPICards.tsx     (신규, KPI 카드)
│   └── UnreceivedActions.tsx       (신규, 액션 버튼 그룹)
└── ui/
    └── DataTable.tsx               (기존, 개선)
```

### 6.2 상태 관리

```typescript
interface UnreceivedPageState {
  // 필터 상태
  searchTerm: string
  delayFilter: 'all' | 'critical' | 'delayed' | 'warning'
  bundleFilter: 'all' | 'bundle' | 'single'
  
  // 정렬 상태
  sortBy: 'daysElapsed' | 'orderDate' | 'artistName'
  sortOrder: 'asc' | 'desc'
  
  // 선택 상태
  selectedItems: string[]
  
  // 뷰 모드
  viewMode: 'table' | 'card'
  compactMode: boolean
}
```

### 6.3 데이터 구조

```typescript
interface UnreceivedItem {
  orderCode: string
  artistName: string
  productName: string
  orderDate: string
  daysElapsed: number
  currentStatus?: string
  isBundle: boolean
  allItems?: Array<{
    productName: string
    artistName: string
    status: string
  }>
  priority: 'critical' | 'delayed' | 'warning' | 'normal'
}
```

---

## 7. 구현 우선순위

### Phase 1: 핵심 개선 (1주)
1. ✅ 테이블 디자인 개선 (카드 스타일 또는 향상된 테이블)
2. ✅ 필터 섹션 통합 및 개선
3. ✅ KPI 카드 + 빠른 필터 통합
4. ✅ 긴급 알림 배너 강화

### Phase 2: 기능 추가 (1주)
5. 정렬 기능 구현
6. 일괄 처리 기능 (체크박스)
7. 내보내기 기능
8. 고급 필터 추가

### Phase 3: UX 개선 (0.5주)
9. 인터랙션 개선 (호버, 애니메이션)
10. 빈 상태 개선
11. 로딩 상태 개선
12. 피드백 메커니즘

### Phase 4: 고급 기능 (0.5주)
13. 컨텍스트 메뉴
14. 키보드 단축키
15. 접근성 개선
16. 성능 최적화

---

## 8. 디자인 가이드라인

### 8.1 색상 시스템

```typescript
const priorityColors = {
  critical: {
    bg: 'bg-red-50/50 dark:bg-red-900/10',
    border: 'border-red-300 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  },
  delayed: {
    bg: 'bg-orange-50/50 dark:bg-orange-900/10',
    border: 'border-orange-300 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  },
  warning: {
    bg: 'bg-yellow-50/50 dark:bg-yellow-900/10',
    border: 'border-yellow-300 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-300',
    badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  normal: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-slate-900 dark:text-slate-100',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  },
}
```

### 8.2 타이포그래피

```typescript
const typography = {
  orderCode: 'text-lg font-bold text-idus-500',
  productName: 'text-base font-semibold text-slate-900 dark:text-slate-100',
  artistName: 'text-sm font-medium text-slate-600 dark:text-slate-400',
  orderDate: 'text-sm text-slate-500 dark:text-slate-500',
  memo: 'text-sm text-slate-600 dark:text-slate-400',
}
```

### 8.3 간격 및 패딩

```typescript
const spacing = {
  cardPadding: 'p-5',
  cardGap: 'gap-3',
  sectionGap: 'mb-6',
  filterPadding: 'p-5',
}
```

---

## 9. 반응형 디자인

### 9.1 모바일 (< 640px)
- 카드 뷰 기본 사용
- 필터 접기/펼치기
- 스와이프 제스처 지원
- 터치 친화적 버튼 크기

### 9.2 태블릿 (640px - 1024px)
- 카드 뷰 또는 테이블 뷰 선택
- 필터 항상 표시
- 적절한 정보 밀도

### 9.3 데스크톱 (> 1024px)
- 테이블 뷰 기본 사용
- 모든 필터 항상 표시
- 최대 정보 밀도
- 고정 헤더 지원

---

## 10. 성능 최적화

### 10.1 가상화
- 대량 데이터 시 가상 스크롤 적용
- react-window 또는 react-virtualized 사용

### 10.2 메모이제이션
- 필터링 결과 메모이제이션
- 정렬 결과 메모이제이션
- 컴포넌트 메모이제이션

### 10.3 지연 로딩
- 초기 로딩 시 필수 데이터만
- 상세 정보는 필요 시 로드
- 이미지/아이콘 지연 로딩

---

## 11. 접근성

### 11.1 ARIA 속성
```tsx
<table
  role="table"
  aria-label="미입고 관리 목록"
  aria-rowcount={filteredItems.length}
>
  <thead>
    <tr role="row">
      <th role="columnheader" aria-sort={sortConfig?.key === 'orderCode' ? sortConfig.direction : 'none'}>
        주문번호
      </th>
      {/* ... */}
    </tr>
  </thead>
</table>
```

### 11.2 키보드 네비게이션
- Tab: 필터 간 이동
- Enter: 검색 실행, 행 선택
- 화살표 키: 행 간 이동
- Escape: 모달 닫기

### 11.3 포커스 관리
- 명확한 포커스 표시
- 논리적 포커스 순서
- 스킵 링크 제공

---

## 12. 예상 효과

### 12.1 사용자 경험
- **가독성 향상**: 명확한 시각적 구분으로 정보 파악 용이
- **업무 효율성**: 빠른 필터링 및 액션으로 처리 시간 단축
- **오류 감소**: 중요 항목 강조로 놓치는 항목 감소

### 12.2 비즈니스 가치
- **처리 시간 단축**: 직관적인 UI로 업무 효율 향상
- **고객 만족도**: 빠른 처리로 고객 대기 시간 감소
- **데이터 정확성**: 체계적인 관리로 오류 감소

---

## 13. 참고 자료

### 13.1 디자인 참고
- Material Design Data Tables
- Ant Design Table Component
- Tailwind UI Table Examples
- Shadcn/ui Table Component

### 13.2 기술 스택
- **UI 라이브러리**: Tailwind CSS
- **상태 관리**: React Query
- **가상화**: react-window
- **아이콘**: Lucide React

---

## 14. 결론

이 개선 계획을 통해 미입고 관리 페이지를 다른 페이지들과 일관된 디자인으로 개선하고, 업무 효율성을 크게 향상시킬 수 있습니다. 특히 테이블 디자인 개선과 필터 통합을 통해 사용자가 한눈에 정보를 파악하고 빠르게 액션을 취할 수 있도록 합니다.

**핵심 개선 사항:**
- 테이블 디자인 프리미엄화 (카드 스타일 또는 향상된 테이블)
- 필터 섹션 통합 및 개선
- 시각적 계층 구조 명확화
- 인터랙션 및 피드백 강화
- 반응형 디자인 최적화

단계적 구현을 통해 점진적으로 개선하면서 사용자 피드백을 반영하여 최종적으로 완성도 높은 페이지를 완성할 수 있습니다.

