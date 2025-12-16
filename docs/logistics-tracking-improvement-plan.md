# 글로벌 물류 추적 페이지 개선 계획서

## 1. 개요

### 1.1 목적
글로벌 물류 추적 페이지는 진행 중인 모든 주문의 물류 현황을 추적하는 핵심 페이지입니다. 현재 헤더는 깔끔하지만 데이터 테이블 영역이 산만하고 가독성이 떨어져 사용자 경험이 개선이 필요합니다. 미입고 관리 페이지와 동일한 수준의 완성도를 확보하고, 물류 추적 특성에 맞는 기능을 강화하는 디자인 및 UX/UI 개선을 진행합니다.

### 1.2 현재 상태 분석

#### 강점
- ✅ 헤더 디자인: idus 브랜드 스타일 적용, 깔끔한 레이아웃
- ✅ 통계 카드: 핵심 지표 요약 제공
- ✅ 필터 기능: 주문번호, 국가, 상태별 필터링
- ✅ 작품 목록 확장/축소: 여러 작품이 있는 주문 처리
- ✅ 추적 링크: 국내배송 및 국제배송 추적 링크 제공

#### 개선 필요 사항
- ❌ **테이블 디자인**: 기본 HTML 테이블로 시각적 완성도 부족
- ❌ **필터 구성**: 필터가 별도 카드로 분리되어 통합성 부족
- ❌ **데이터 가독성**: 행 구분이 불명확, 중요 정보 강조 부족
- ❌ **상태 시각화**: 상태별 색상 구분은 있으나 시각적 계층 부족
- ❌ **빈 공간 활용**: 여백이 많아 정보 밀도가 낮음
- ❌ **추적 정보 표시**: 추적 번호와 링크가 명확하지 않음
- ❌ **타임라인 미표시**: 주문 진행 상황을 시각적으로 파악하기 어려움

### 1.3 개선 목표
- **시각적 완성도**: 프리미엄 대시보드 수준의 세련된 테이블 디자인
- **정보 밀도**: 효율적인 공간 활용으로 한눈에 파악 가능
- **사용성**: 직관적인 필터링 및 액션 제공
- **일관성**: 미입고 관리 페이지와 통일된 디자인 시스템
- **물류 추적 특화**: 추적 정보, 타임라인, 상태 변화 강조

---

## 2. 디자인 개선안

### 2.1 전체 레이아웃 재구성

#### 2.1.1 현재 구조
```
┌─────────────────────────────────┐
│ 헤더 (깔끔함)                    │
├─────────────────────────────────┤
│ 통계 카드 (4개)                  │
├─────────────────────────────────┤
│ 필터 (카드)                      │
├─────────────────────────────────┤
│ 테이블 (산만함)                  │
└─────────────────────────────────┘
```

#### 2.1.2 개선된 구조
```
┌─────────────────────────────────┐
│ 헤더 (유지)                      │
├─────────────────────────────────┤
│ 통계 카드 + 빠른 필터 (통합)     │
├─────────────────────────────────┤
│ 통합 필터 섹션 (개선)            │
├─────────────────────────────────┤
│ 향상된 카드 스타일 테이블        │
│ (상태별 타임라인 포함)           │
└─────────────────────────────────┘
```

### 2.2 테이블 디자인 개선

#### 2.2.1 현재 문제점
- 기본 HTML 테이블 스타일
- 행 구분이 불명확
- 상태별 색상 구분은 있으나 시각적 강조 부족
- 추적 정보가 텍스트로만 표시
- 타임라인 정보 미표시
- 작품 목록 확장/축소 UI가 단순함

#### 2.2.2 개선 방안

**A. 카드 스타일 테이블 (추천)**
- 각 주문을 카드 형태로 표시
- 상태별 색상 구분 강화 (테두리 + 배경)
- 추적 정보를 아이콘과 함께 명확히 표시
- 타임라인 진행 상황 시각화
- 작품 목록을 더 명확하게 표시

**B. 향상된 테이블 스타일 (대안)**
- 더 명확한 행 구분선
- 상태별 배경색 강화
- 추적 정보 강조
- 고정 헤더 (스크롤 시)

### 2.3 필터 구성 개선

#### 2.3.1 통합 필터 섹션
- 통계 카드와 빠른 필터를 하나의 섹션으로 통합
- 검색, 드롭다운, 빠른 필터를 논리적으로 그룹화
- 필터 상태 시각적 표시
- 국가별, 상태별 빠른 필터 칩 추가

#### 2.3.2 필터 레이아웃
```
┌─────────────────────────────────────────┐
│ [검색 입력] [국가 ▼] [상태 ▼]          │
│ [전체] [JP] [US] [결제완료] [송장입력]  │
└─────────────────────────────────────────┘
```

### 2.4 물류 추적 특화 기능

#### 2.4.1 타임라인 시각화
- 주문 진행 단계를 타임라인으로 표시
- 현재 단계 강조
- 완료된 단계와 대기 중인 단계 구분

#### 2.4.2 추적 정보 강화
- 국내배송 추적 번호를 더 명확하게 표시
- 국제배송 추적 번호를 더 명확하게 표시
- 추적 링크를 버튼 형태로 제공
- 추적 상태 표시 (배송 중, 도착 등)

---

## 3. 상세 개선안

### 3.1 헤더 영역 (유지 및 미세 조정)

#### 3.1.1 현재 상태
- ✅ idus 브랜드 스타일 적용
- ✅ 아이콘 + 제목 + 설명 구조
- ✅ 배경 패턴 적용

#### 3.1.2 개선 사항
- 헤더는 현재 상태 유지
- 필요 시 빠른 액션 버튼 추가 (새로고침, 내보내기 등)

### 3.2 통계 카드 + 빠른 필터 통합

#### 3.2.1 현재 상태
- 통계 카드가 단순한 스타일
- 빠른 필터 없음

#### 3.2.2 개선 방안
```tsx
<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6 mb-6 shadow-sm">
  {/* 통계 카드 */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">전체 주문</p>
      <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
        {stats.total} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">건</span>
      </p>
    </div>
    {/* 다른 통계 카드들 */}
  </div>
  
  {/* 빠른 필터 (인라인) */}
  <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700 flex-wrap">
    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 mr-2">빠른 필터:</span>
    {/* 상태별 필터 칩 */}
    <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-idus-500 text-white">
      결제 완료 ({stats.byStatus['결제 완료'] || 0})
    </button>
    {/* 국가별 필터 칩 */}
    <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600">
      🇯🇵 일본 ({stats.byCountry['JP'] || 0})
    </button>
    {/* ... */}
  </div>
</div>
```

### 3.3 통합 필터 섹션 개선

#### 3.3.1 현재 상태
- 필터가 별도 카드로 분리
- 기본적인 스타일

#### 3.3.2 개선 방안
```tsx
<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
  <div className="flex items-center gap-2 mb-4">
    <Filter className="w-5 h-5 text-slate-500" />
    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">필터</h3>
  </div>
  
  {/* 검색 및 드롭다운 (상단) */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">주문번호</label>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="주문번호로 검색..."
        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-idus-500 focus:border-idus-500 transition-all"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">국가</label>
      <select
        value={selectedCountry}
        onChange={(e) => setSelectedCountry(e.target.value)}
        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-idus-500 focus:border-idus-500 transition-all"
      >
        {/* 옵션들 */}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">상태</label>
      <select
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-idus-500 focus:border-idus-500 transition-all"
      >
        {/* 옵션들 */}
      </select>
    </div>
  </div>
</div>
```

### 3.4 테이블 디자인 개선

#### 3.4.1 카드 스타일 테이블 (추천)

**장점:**
- 시각적 완성도 높음
- 상태별 정보 강조 용이
- 타임라인 표시 가능
- 모바일과 데스크톱 통일
- 추적 정보 명확히 표시

**구현:**
```tsx
<div className="space-y-3">
  {filteredData.map((order) => (
    <div
      key={order.orderCode}
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl border-2 p-5 transition-all',
        'hover:shadow-lg hover:-translate-y-0.5',
        getStatusColor(order.logisticsStatus)
      )}
    >
      {/* 카드 헤더: 주문번호 + 상태 + 국가 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <button
              onClick={() => openOrderDetailModal(order.orderCode)}
              className="text-lg font-bold text-idus-500 hover:text-idus-600 hover:underline transition-colors"
            >
              {order.orderCode}
            </button>
            <StatusBadge status={order.logisticsStatus} />
            <CountryBadge code={order.country} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            최종 업데이트: {order.lastUpdate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openOrderDetailModal(order.orderCode)}
            className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-idus-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            상세보기
          </button>
        </div>
      </div>
      
      {/* 작품 목록 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">작품 목록</span>
          {order.items.length > 1 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({order.items.length}개)
            </span>
          )}
        </div>
        <div className="space-y-2">
          {order.items.slice(0, isExpanded ? order.items.length : 2).map((item, idx) => (
            <Link
              key={idx}
              href={item.url}
              target="_blank"
              className="block text-sm text-slate-900 dark:text-slate-100 hover:text-idus-500 hover:underline"
            >
              {item.name} <span className="text-slate-500 dark:text-slate-400">(수량: {item.quantity})</span>
            </Link>
          ))}
          {order.items.length > 2 && (
            <button
              onClick={() => toggleItems(order.orderCode)}
              className="text-sm text-idus-500 hover:text-idus-600 font-medium"
            >
              {isExpanded ? '접기' : `+${order.items.length - 2}개 더 보기`}
            </button>
          )}
        </div>
      </div>
      
      {/* 추적 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">국내배송</span>
          </div>
          {order.artistTracking.number !== 'N/A' ? (
            <Link
              href={order.artistTracking.url}
              target="_blank"
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <span className="font-medium">{order.artistTracking.number}</span>
              <span className="text-xs">→</span>
            </Link>
          ) : (
            <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">국제배송</span>
          </div>
          {order.internationalTracking.number !== 'N/A' ? (
            <Link
              href={order.internationalTracking.url}
              target="_blank"
              className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <span className="font-medium">{order.internationalTracking.number}</span>
              <span className="text-xs">→</span>
            </Link>
          ) : (
            <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
          )}
        </div>
      </div>
      
      {/* 타임라인 (선택적) */}
      {order.timelineEvents && order.timelineEvents.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">진행 상황</span>
          </div>
          <div className="space-y-1">
            {order.timelineEvents.slice(-3).map((event, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="w-1.5 h-1.5 bg-idus-500 rounded-full"></div>
                <span>{event.status}</span>
                <span className="text-slate-400 dark:text-slate-500">·</span>
                <span>{event.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  ))}
</div>
```

#### 3.4.2 상태별 색상 구분

```typescript
function getStatusColor(status: string) {
  const statusLower = status.toLowerCase()
  
  if (statusLower.includes('결제 완료')) {
    return 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
  } else if (statusLower.includes('작가') && statusLower.includes('송장')) {
    return 'border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10'
  } else if (statusLower.includes('작가') && statusLower.includes('발송')) {
    return 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
  } else if (statusLower.includes('검수 대기') || statusLower.includes('입고')) {
    return 'border-yellow-300 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10'
  } else if (statusLower.includes('검수완료') || statusLower.includes('검수 완료')) {
    return 'border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
  } else if (statusLower.includes('국제배송') || statusLower.includes('배송중') || statusLower.includes('배송 중')) {
    return 'border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10'
  } else if (statusLower.includes('완료') || statusLower.includes('도착')) {
    return 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
  }
  
  return 'border-slate-200 dark:border-slate-800'
}
```

### 3.5 빈 상태 개선

#### 3.5.1 현재 상태
- 기본적인 빈 상태 메시지

#### 3.5.2 개선 방안
```tsx
<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
    <Truck className="w-10 h-10 text-slate-400" />
  </div>
  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
    추적할 주문이 없습니다
  </h3>
  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
    필터 조건을 변경하여 다른 주문을 확인해보세요.
  </p>
  <button
    onClick={() => {
      setSelectedStatus('모든 상태')
      setSelectedCountry('모든 국가')
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
- 주문번호 기준 정렬 (기본: 내림차순)
- 최종 업데이트 기준 정렬
- 상태 기준 정렬
- 국가 기준 정렬
- 정렬 방향 표시 (↑↓)

### 4.2 타임라인 시각화

#### 4.2.1 진행 단계 표시
- 주문 진행 단계를 타임라인으로 표시
- 현재 단계 강조
- 완료된 단계와 대기 중인 단계 구분
- 각 단계별 날짜 표시

#### 4.2.2 타임라인 컴포넌트
```tsx
function Timeline({ events }: { events: Array<{ status: string; date: string }> }) {
  return (
    <div className="relative">
      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
      <div className="space-y-3">
        {events.map((event, idx) => (
          <div key={idx} className="relative pl-8">
            <div className="absolute left-0 top-1 w-4 h-4 bg-idus-500 rounded-full border-2 border-white dark:border-slate-900"></div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{event.status}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{event.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 4.3 추적 정보 강화

#### 4.3.1 추적 상태 표시
- 국내배송 상태 표시 (입고 대기, 배송 중, 도착 등)
- 국제배송 상태 표시 (출고 대기, 배송 중, 도착 등)
- 추적 번호 클릭 시 새 탭에서 추적 페이지 열기

#### 4.3.2 추적 링크 개선
- 추적 번호를 버튼 형태로 표시
- 아이콘 추가 (국내배송: Package, 국제배송: Truck)
- 호버 효과 추가

### 4.4 일괄 처리 기능

#### 4.4.1 체크박스 선택
- 여러 주문 선택 가능
- 선택된 주문 일괄 내보내기
- 선택된 주문 일괄 알림 설정

### 4.5 내보내기 기능

#### 4.5.1 데이터 내보내기
- CSV 내보내기
- Excel 내보내기
- 현재 필터 적용된 데이터만 내보내기
- 추적 정보 포함 여부 선택

### 4.6 고급 필터

#### 4.6.1 추가 필터 옵션
- 날짜 범위 필터 (주문일, 업데이트일)
- 추적 번호 유무 필터
- 국가별 빠른 필터 칩
- 상태별 빠른 필터 칩

---

## 5. UX/UI 개선안

### 5.1 시각적 계층 구조

#### 5.1.1 중요도별 색상 구분
```
결제 완료: 파란색 강조
  - 배경: bg-blue-50/50
  - 테두리: border-blue-300
  - 텍스트: text-blue-700

작가 송장 입력: 주황색 강조
  - 배경: bg-orange-50/50
  - 테두리: border-orange-300
  - 텍스트: text-orange-700

검수 대기: 노란색 강조
  - 배경: bg-yellow-50/50
  - 테두리: border-yellow-300
  - 텍스트: text-yellow-700

국제배송중: 보라색 강조
  - 배경: bg-purple-50/50
  - 테두리: border-purple-300
  - 텍스트: text-purple-700

배송 완료: 초록색 강조
  - 배경: bg-emerald-50/50
  - 테두리: border-emerald-300
  - 텍스트: text-emerald-700
```

### 5.2 인터랙션 개선

#### 5.2.1 호버 효과
- 카드 호버 시 그림자 및 위치 이동
- 버튼 호버 시 색상 변화
- 추적 링크 호버 시 배경색 변화
- 클릭 가능 요소 시각적 표시

#### 5.2.2 로딩 상태
- 스켈레톤 UI 적용
- 부분 로딩 표시
- 진행 상태 인디케이터

#### 5.2.3 피드백
- 필터 적용 시 결과 수 표시
- 정렬 변경 시 시각적 피드백
- 내보내기 완료 토스트

### 5.3 정보 밀도 최적화

#### 5.3.1 컴팩트 모드
- 더 많은 정보를 한 화면에 표시
- 옵션으로 제공 (기본/컴팩트)

#### 5.3.2 확장 가능한 카드
- 클릭 시 상세 정보 표시
- 타임라인 전체 보기
- 모든 작품 목록 보기

### 5.4 접근성 개선

#### 5.4.1 키보드 네비게이션
- Tab 키로 필터 이동
- Enter 키로 검색 실행
- 화살표 키로 카드 간 이동

#### 5.4.2 스크린 리더 지원
- ARIA 레이블 추가
- 상태 변경 알림
- 추적 정보 명확한 설명

---

## 6. 기술적 구현

### 6.1 컴포넌트 구조

```
components/
├── logistics/
│   ├── LogisticsCard.tsx        (신규, 카드 뷰)
│   ├── LogisticsFilters.tsx     (신규, 통합 필터)
│   ├── LogisticsKPICards.tsx   (신규, KPI 카드)
│   ├── LogisticsTimeline.tsx   (신규, 타임라인)
│   └── TrackingInfo.tsx         (신규, 추적 정보)
└── ui/
    └── DataTable.tsx            (기존, 개선)
```

### 6.2 상태 관리

```typescript
interface LogisticsPageState {
  // 필터 상태
  searchTerm: string
  selectedCountry: string
  selectedStatus: string
  
  // 정렬 상태
  sortBy: 'orderCode' | 'lastUpdate' | 'status' | 'country'
  sortOrder: 'asc' | 'desc'
  
  // 선택 상태
  selectedOrders: string[]
  
  // 확장 상태
  expandedItems: Set<string>
  
  // 뷰 모드
  viewMode: 'card' | 'table'
  compactMode: boolean
}
```

### 6.3 데이터 구조

```typescript
interface LogisticsOrder {
  orderCode: string
  country: string
  logisticsStatus: string
  lastUpdate: string
  artistTracking: {
    number: string
    url: string
    status?: 'pending' | 'shipping' | 'delivered'
  }
  internationalTracking: {
    number: string
    url: string
    status?: 'pending' | 'shipping' | 'delivered'
  }
  items: Array<{
    name: string
    quantity: string | number
    url: string
  }>
  timelineEvents: Array<{
    status: string
    date: string
    completed: boolean
  }>
  priority: 'urgent' | 'normal' | 'low'
}
```

---

## 7. 구현 우선순위

### Phase 1: 핵심 개선 (1주)
1. ✅ 통계 카드 + 빠른 필터 통합
2. ✅ 통합 필터 섹션 개선
3. ✅ 테이블 디자인 개선 (카드 스타일)
4. ✅ 빈 상태 개선
5. ✅ 상태별 색상 구분 강화

### Phase 2: 기능 추가 (1주)
6. 정렬 기능 구현
7. 타임라인 시각화
8. 추적 정보 강화
9. 일괄 처리 기능 (체크박스)
10. 내보내기 기능

### Phase 3: UX 개선 (0.5주)
11. 인터랙션 개선 (호버, 애니메이션)
12. 로딩 상태 개선
13. 피드백 메커니즘
14. 고급 필터 추가

### Phase 4: 고급 기능 (0.5주)
15. 키보드 단축키
16. 접근성 개선
17. 성능 최적화
18. 실시간 업데이트 (선택적)

---

## 8. 디자인 가이드라인

### 8.1 색상 시스템

```typescript
const statusColors = {
  '결제 완료': {
    bg: 'bg-blue-50/50 dark:bg-blue-900/10',
    border: 'border-blue-300 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  },
  '작가 송장 입력': {
    bg: 'bg-orange-50/50 dark:bg-orange-900/10',
    border: 'border-orange-300 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  },
  '검수 대기': {
    bg: 'bg-yellow-50/50 dark:bg-yellow-900/10',
    border: 'border-yellow-300 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-300',
    badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  '국제배송중': {
    bg: 'bg-purple-50/50 dark:bg-purple-900/10',
    border: 'border-purple-300 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  },
  '배송 완료': {
    bg: 'bg-emerald-50/50 dark:bg-emerald-900/10',
    border: 'border-emerald-300 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  },
}
```

### 8.2 타이포그래피

```typescript
const typography = {
  orderCode: 'text-lg font-bold text-idus-500',
  productName: 'text-base font-semibold text-slate-900 dark:text-slate-100',
  status: 'text-sm font-medium',
  trackingNumber: 'text-sm font-medium',
  date: 'text-sm text-slate-500 dark:text-slate-500',
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
- 필터 항상 표시
- 추적 정보 세로 배치
- 타임라인 간소화

### 9.2 태블릿 (640px - 1024px)
- 카드 뷰 기본 사용
- 필터 항상 표시
- 추적 정보 가로 배치
- 타임라인 표시

### 9.3 데스크톱 (> 1024px)
- 카드 뷰 기본 사용
- 모든 필터 항상 표시
- 최대 정보 밀도
- 타임라인 상세 표시

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
- 타임라인 정보는 필요 시 로드
- 이미지/아이콘 지연 로딩

---

## 11. 접근성

### 11.1 ARIA 속성
```tsx
<div
  role="region"
  aria-label="물류 추적 주문 목록"
  aria-live="polite"
>
  {/* 카드 목록 */}
</div>
```

### 11.2 키보드 네비게이션
- Tab: 필터 간 이동
- Enter: 검색 실행, 카드 선택
- 화살표 키: 카드 간 이동
- Escape: 모달 닫기

### 11.3 포커스 관리
- 명확한 포커스 표시
- 논리적 포커스 순서
- 스킵 링크 제공

---

## 12. 예상 효과

### 12.1 사용자 경험
- **가독성 향상**: 카드 스타일로 정보 구조 명확화
- **업무 효율성**: 빠른 필터링 및 추적 정보 확인으로 처리 시간 단축
- **시각적 피드백**: 타임라인으로 진행 상황 파악 용이
- **일관성**: 미입고 관리 페이지와 통일된 디자인

### 12.2 비즈니스 가치
- **처리 시간 단축**: 직관적인 UI로 업무 효율 향상
- **고객 만족도**: 빠른 추적 정보 확인으로 고객 대기 시간 감소
- **데이터 정확성**: 체계적인 관리로 오류 감소
- **운영 투명성**: 타임라인으로 진행 상황 명확히 파악

---

## 13. 참고 자료

### 13.1 디자인 참고
- Material Design Data Tables
- Ant Design Table Component
- Tailwind UI Table Examples
- Shadcn/ui Table Component
- 물류 추적 시스템 UI 패턴

### 13.2 기술 스택
- **UI 라이브러리**: Tailwind CSS
- **상태 관리**: React Query
- **가상화**: react-window
- **아이콘**: Lucide React
- **타임라인**: 커스텀 컴포넌트

---

## 14. 결론

이 개선 계획을 통해 글로벌 물류 추적 페이지를 미입고 관리 페이지와 동일한 수준의 완성도로 개선하고, 물류 추적 특성에 맞는 기능을 강화할 수 있습니다. 특히 카드 스타일 테이블과 타임라인 시각화를 통해 사용자가 주문 진행 상황을 한눈에 파악하고 빠르게 액션을 취할 수 있도록 합니다.

**핵심 개선 사항:**
- 카드 스타일 테이블로 시각적 완성도 향상
- 통계 카드 + 빠른 필터 통합
- 통합 필터 섹션 개선
- 타임라인 시각화로 진행 상황 명확화
- 추적 정보 강화 및 명확한 표시
- 상태별 색상 구분 강화
- 반응형 디자인 최적화

단계적 구현을 통해 점진적으로 개선하면서 사용자 피드백을 반영하여 최종적으로 완성도 높은 페이지를 완성할 수 있습니다.


