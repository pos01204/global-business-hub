# 모바일 최적화 개선 방안

## 1. 현재 상태 진단

### 1.1 스크린샷 분석 결과

#### QC 페이지 문제점
- 탭 UI가 가로로 나열되어 있으나 텍스트가 세로로 표시됨 (가독성 저하)
- 탭 아이콘과 텍스트 배치가 어색함
- 카드 내 버튼 터치 영역이 작음

#### 미입고 페이지 문제점
- 테이블 컬럼이 잘려서 표시됨 (작품명, 경과일 등)
- 필터 영역이 너무 많은 공간 차지
- 행 데이터가 읽기 어려움

#### 하단 네비게이션 문제점
- 누락된 메뉴: 물류 관제 센터, 소포수령증, 고객 분석, 비용 & 손익, 고객 리뷰, 퍼포먼스 마케터
- 더보기 메뉴에 6개만 포함 (전체 17개 중)
- 터치 영역이 작음 (44px 미만)

### 1.2 누락된 메뉴 목록

| 메뉴 | Sidebar | BottomNav 메인 | BottomNav 더보기 | 상태 |
|------|---------|----------------|------------------|------|
| 대시보드 | ✅ | ✅ (홈) | - | ✅ |
| 미입고 관리 | ✅ | ✅ | - | ✅ |
| 물류 추적 | ✅ | - | ✅ | ✅ |
| 물류 관제 센터 | ✅ | - | ❌ | ⚠️ 누락 |
| 물류비 정산 | ✅ | - | ✅ | ✅ |
| QC 관리 | ✅ | ✅ | - | ✅ |
| 소포수령증 | ✅ | - | ❌ | ⚠️ 누락 |
| 통합 검색 | ✅ | ✅ | - | ✅ |
| 성과 분석 | ✅ | - | ✅ | ✅ |
| 고객 분석 | ✅ | - | ❌ | ⚠️ 누락 |
| 작가 분석 | ✅ | - | ✅ | ✅ |
| 비용 & 손익 | ✅ | - | ❌ | ⚠️ 누락 |
| 고객 리뷰 | ✅ | - | ❌ | ⚠️ 누락 |
| 퍼포먼스 마케터 | ✅ | - | ❌ | ⚠️ 누락 |
| 쿠폰 생성/발급 | ✅ | - | ✅ | ✅ |
| AI 어시스턴트 | ✅ | - | ✅ | ✅ |

**누락된 메뉴: 6개**

---

## 2. 개선 방안

### 2.1 BottomNavigation 개선

#### 현재 구조
```
메인: 홈, QC, 미입고, 검색, 더보기
더보기: 물류 추적, 물류비 정산, 성과 분석, 작가 분석, AI 어시스턴트, 쿠폰 생성 (6개)
```

#### 개선 구조
```
메인: 홈, QC, 미입고, 검색, 더보기
더보기: 카테고리별 그룹화 (전체 메뉴 포함)
  - 물류 운영: 물류 추적, 물류 관제 센터, 물류비 정산
  - 업무 지원: 소포수령증
  - 분석: 성과 분석, 고객 분석, 작가 분석, 비용 & 손익
  - 고객: 고객 리뷰
  - 도구: 퍼포먼스 마케터, 쿠폰 생성, AI 어시스턴트
```

#### 구현 코드 변경

```typescript
// BottomNavigation.tsx 개선
const moreNavGroups = [
  {
    title: '물류 운영',
    items: [
      { href: '/logistics', icon: '🚚', label: '물류 추적' },
      { href: '/control-tower', icon: '📡', label: '물류 관제' },
      { href: '/settlement', icon: '💵', label: '물류비 정산' },
    ],
  },
  {
    title: '업무 지원',
    items: [
      { href: '/sopo-receipt', icon: '📄', label: '소포수령증' },
    ],
  },
  {
    title: '분석',
    items: [
      { href: '/analytics', icon: '📈', label: '성과 분석' },
      { href: '/customer-analytics', icon: '👥', label: '고객 분석' },
      { href: '/artist-analytics', icon: '👨‍🎨', label: '작가 분석' },
      { href: '/cost-analysis', icon: '💰', label: '비용 & 손익' },
    ],
  },
  {
    title: '고객 인사이트',
    items: [
      { href: '/reviews', icon: '⭐', label: '고객 리뷰' },
    ],
  },
  {
    title: '도구',
    items: [
      { href: '/marketer', icon: '🎯', label: '마케터' },
      { href: '/coupon-generator', icon: '🎟️', label: '쿠폰 생성' },
      { href: '/chat', icon: '🤖', label: 'AI 어시스턴트' },
    ],
  },
]
```

### 2.2 터치 영역 개선

#### 문제점
- 현재 버튼/링크 터치 영역이 44px 미만인 경우 존재
- 탭 버튼 간격이 좁음

#### 개선 방안
```css
/* globals.css 추가 */
@media (hover: none) and (pointer: coarse) {
  /* 모든 인터랙티브 요소 최소 44px */
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* 탭 버튼 패딩 증가 */
  .mobile-tab {
    padding: 12px 16px;
  }
}
```

---

## 3. 페이지별 개선 방안

### 3.1 QC 관리 페이지

#### 현재 문제
1. 탭 텍스트가 세로로 표시됨
2. 탭 아이콘과 텍스트 배치 어색
3. 카드 내 버튼 터치 영역 작음

#### 개선 방안

```typescript
// QC 페이지 탭 개선
// 모바일에서 아이콘만 표시, 텍스트는 선택된 탭만 표시
const mobileTabItems = tabItems.map(item => ({
  ...item,
  label: isMobile ? '' : item.label, // 모바일에서 라벨 숨김
}))

// 또는 스크롤 가능한 탭으로 변경
<div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
  <div className="flex gap-2 min-w-max">
    {tabItems.map(item => (
      <button className="flex items-center gap-2 px-4 py-3 whitespace-nowrap">
        <span>{item.icon}</span>
        <span className="text-sm">{item.label}</span>
      </button>
    ))}
  </div>
</div>
```

#### 카드 버튼 개선
```typescript
// 동기화 버튼 터치 영역 확대
<button className="min-h-[44px] px-4 py-2 ...">
  동기화
</button>
```

### 3.2 미입고 관리 페이지

#### 현재 문제
1. 테이블 컬럼이 잘림
2. 필터 영역이 너무 큼
3. 행 데이터 가독성 저하

#### 개선 방안

**옵션 A: 카드뷰 모드 (권장)**
```typescript
// 모바일에서 카드뷰로 전환
const isMobile = useIsMobile()

{isMobile ? (
  <div className="space-y-3">
    {filteredItems.map((item) => (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-start mb-2">
          <button className="text-[#F78C3A] font-medium text-sm">
            {item.orderCode}
          </button>
          <DelayBadge days={item.daysElapsed} />
        </div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
          {item.productName}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          {item.artistName} · {item.orderDate}
        </p>
        {item.isBundle && (
          <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            📦 묶음 ({item.allItems?.length || 0}개)
          </span>
        )}
        <div className="flex justify-end mt-3">
          <button className="px-4 py-2 text-sm font-medium text-white bg-[#F78C3A] rounded-lg min-h-[44px]">
            수정
          </button>
        </div>
      </div>
    ))}
  </div>
) : (
  // 기존 테이블
)}
```

**옵션 B: 필터 접기/펼치기**
```typescript
const [showFilters, setShowFilters] = useState(false)

// 모바일에서 필터 토글
<div className="lg:hidden mb-4">
  <button 
    onClick={() => setShowFilters(!showFilters)}
    className="flex items-center gap-2 text-sm text-slate-600"
  >
    <span>🔽</span>
    <span>필터 {showFilters ? '접기' : '펼치기'}</span>
  </button>
</div>

{(showFilters || !isMobile) && (
  <div className="card mb-6">
    {/* 필터 내용 */}
  </div>
)}
```

### 3.3 대시보드 페이지

#### 현재 문제
1. 날짜 선택기가 모바일에서 조작 어려움
2. 차트가 너무 작게 표시됨
3. 카드 간격이 좁음

#### 개선 방안

```typescript
// 날짜 선택기 개선
<div className="flex flex-col sm:flex-row gap-2">
  <input
    type="date"
    className="w-full sm:w-auto px-4 py-3 border rounded-lg text-base"
  />
  <input
    type="date"
    className="w-full sm:w-auto px-4 py-3 border rounded-lg text-base"
  />
  <button className="w-full sm:w-auto px-4 py-3 bg-slate-900 text-white rounded-lg min-h-[44px]">
    조회
  </button>
</div>

// 차트 컨테이너 개선
<div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
  <div className="min-w-[500px] lg:min-w-0">
    <Chart ... />
  </div>
</div>

// KPI 카드 간격 개선
<div className="grid grid-cols-2 gap-3 lg:grid-cols-6 lg:gap-4">
```

### 3.4 AI 어시스턴트 (채팅) 페이지

#### 개선 방안
```typescript
// 입력창 하단 고정 + safe area 대응
<div className="fixed bottom-20 lg:bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t safe-area-pb">
  <div className="flex gap-2 max-w-4xl mx-auto">
    <input className="flex-1 px-4 py-3 border rounded-xl text-base" />
    <button className="px-4 py-3 bg-[#F78C3A] text-white rounded-xl min-w-[44px]">
      전송
    </button>
  </div>
</div>
```

---

## 4. 공통 컴포넌트 개선

### 4.1 Tabs 컴포넌트

```typescript
// 모바일 최적화 옵션 추가
interface TabsProps {
  // 기존 props
  mobileVariant?: 'scroll' | 'icon-only' | 'dropdown'
}

// scroll: 가로 스크롤 (기본값)
// icon-only: 아이콘만 표시
// dropdown: 드롭다운으로 변환
```

### 4.2 Modal 컴포넌트

```typescript
// 모바일에서 바텀시트로 변환
interface ModalProps {
  mobileVariant?: 'center' | 'bottom-sheet' | 'fullscreen'
}

// 모바일 바텀시트 스타일
const mobileStyles = {
  'bottom-sheet': `
    fixed bottom-0 left-0 right-0 
    rounded-t-2xl rounded-b-none 
    max-h-[85vh] w-full
    animate-slideUp
  `
}
```

### 4.3 Select 컴포넌트

```typescript
// 모바일에서 네이티브 select 사용 옵션
interface SelectProps {
  mobileNative?: boolean
}

{isMobile && mobileNative ? (
  <select className="w-full px-4 py-3 border rounded-lg text-base">
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
) : (
  // 기존 커스텀 드롭다운
)}
```

---

## 5. 구현 우선순위

### Phase 1: 긴급 (1일) ✅ 완료
1. ✅ BottomNavigation 누락 메뉴 추가
2. ✅ 터치 영역 최소 44px 보장
3. ✅ QC 탭 가로 스크롤 개선

### Phase 2: 중요 (2일) ✅ 완료
1. ✅ 미입고 페이지 카드뷰 모드 구현
2. ✅ 필터 접기/펼치기 기능
3. ✅ 대시보드 날짜 선택기 개선

### Phase 3: 개선 (2일) ✅ 완료
1. ✅ Modal 바텀시트 변환 (mobileVariant 옵션 추가)
2. ✅ Select 네이티브 모드 (mobileNative 옵션 추가)
3. ✅ 채팅 페이지 입력창 최적화 (하단 고정 + safe area 대응)
4. ✅ Tabs 컴포넌트 모바일 옵션 추가 (scroll, icon-only, dropdown)

---

## 6. 테스트 체크리스트

### 기능 테스트
- [x] 모든 메뉴 접근 가능 (BottomNavigation 그룹화 완료)
- [x] 터치 영역 44px 이상 (Button, 입력 필드 min-height 적용)
- [x] 스크롤 정상 동작 (Tabs 가로 스크롤, 테이블 overflow-x-auto)
- [x] 입력 필드 포커스 시 키보드 대응 (font-size 16px 적용)

### 디바이스 테스트
- [ ] iPhone SE (375px)
- [ ] iPhone 14 Pro (393px)
- [ ] iPad Mini (768px)
- [ ] Android 일반 (360px)

### 브라우저 테스트
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Samsung Internet

---

## 7. 변경 파일 목록

| 파일 | 변경 내용 | 상태 |
|------|----------|------|
| `components/BottomNavigation.tsx` | 누락 메뉴 추가, 그룹화 | ✅ |
| `app/globals.css` | 터치 영역 CSS, 바텀시트 애니메이션, safe area 추가 | ✅ |
| `app/qc/page.tsx` | 탭 스크롤 개선, 미사용 import 제거 | ✅ |
| `app/unreceived/page.tsx` | 카드뷰 모드 추가, 필터 토글 기능 | ✅ |
| `app/dashboard/page.tsx` | 날짜 선택기 모바일 최적화 | ✅ |
| `app/chat/page.tsx` | 입력창 하단 고정, safe area 대응 | ✅ |
| `components/ui/Tabs.tsx` | mobileVariant 옵션 (scroll/icon-only/dropdown) | ✅ |
| `components/ui/Modal.tsx` | mobileVariant 옵션 (center/bottom-sheet/fullscreen) | ✅ |
| `components/ui/Select.tsx` | mobileNative 옵션 | ✅ |
| `components/ui/Pagination.tsx` | mobileSimple 옵션 (간소화된 페이지네이션) | ✅ |
| `components/ui/Button.tsx` | min-height 추가 (터치 영역 보장) | ✅ |
| `components/ui/DataTable.tsx` | viewMode 카드뷰 모드 지원 | ✅ |
| `app/customer-analytics/page.tsx` | 헤더 모바일 최적화, Tabs mobileVariant 적용 | ✅ |
| `app/artist-analytics/page.tsx` | 헤더 모바일 최적화, Tabs mobileVariant 적용 | ✅ |
| `app/coupon-generator/page.tsx` | 헤더 모바일 최적화, Tabs mobileVariant 적용 | ✅ |
