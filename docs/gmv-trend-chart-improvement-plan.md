# GMV & 주문 추세 차트 개선 계획서

## 1. 개요

### 1.1 목적
대시보드의 "GMV & 주문 추세" 차트는 전체 허브에서 가장 중요한 핵심 지표를 시각화하는 차트입니다. 현재 기본적인 바 차트로만 구성되어 있어, 시각적 완성도와 기능적 완성도를 대폭 향상시켜 사용자가 한눈에 트렌드를 파악하고 인사이트를 도출할 수 있도록 개선합니다.

### 1.2 현재 상태
- **차트 타입**: 기본 바 차트 (Bar Chart)
- **표시 데이터**: GMV 일별, 주문 건수 일별
- **이중 Y축**: 없음 (GMV와 주문 건수가 같은 스케일로 표시되어 가독성 저하)
- **이동평균**: 백엔드에서 계산되지만 프론트엔드에 표시되지 않음
- **인터랙션**: 기본 툴팁만 제공
- **비교 기능**: 없음
- **예측/트렌드 라인**: 없음
- **시각적 강조**: 없음

### 1.3 개선 목표
- **시각적 완성도**: 프리미엄 대시보드 수준의 세련된 디자인
- **기능적 완성도**: 다양한 분석 기능과 인터랙션 제공
- **인사이트 도출**: 트렌드, 이상 징후, 패턴을 쉽게 파악
- **사용성**: 직관적이고 강력한 필터링 및 비교 기능

---

## 2. 시각적 개선안

### 2.1 차트 타입 개선

#### 2.1.1 Combo Chart (Bar + Line) 구현
**현재**: 단순 바 차트만 표시
**개선**: 바 차트 + 라인 차트 조합

```
┌─────────────────────────────────────┐
│  GMV (Bar) + 주문 건수 (Bar)         │
│  + GMV 7일 이동평균 (Line)          │
│  + 주문 건수 7일 이동평균 (Line)     │
│  + 트렌드 라인 (Dashed Line)          │
└─────────────────────────────────────┘
```

**구현 방법**:
- Recharts의 `ComposedChart` 사용
- GMV: 바 차트 (주황색, #F78C3A)
- 주문 건수: 바 차트 (파란색, #3B82F6)
- GMV 이동평균: 라인 차트 (주황색, 더 진한 색상, 2px 두께)
- 주문 건수 이동평균: 라인 차트 (파란색, 더 진한 색상, 2px 두께)

#### 2.1.2 이중 Y축 구현
**문제**: GMV(수백만원)와 주문 건수(수십 건)의 스케일 차이로 인한 가독성 저하
**해결**: 좌측 Y축(GMV), 우측 Y축(주문 건수) 분리

```typescript
<YAxis yAxisId="left" orientation="left" />
<YAxis yAxisId="right" orientation="right" />
```

#### 2.1.3 그라데이션 및 시각적 강조
- **바 차트 그라데이션**: 상단에서 하단으로 어두워지는 그라데이션 적용
- **최고/최저값 강조**: 최고값은 더 진한 색상, 최저값은 더 연한 색상
- **주말/공휴일 표시**: 배경색으로 구분 (연한 회색)
- **목표선 표시**: 목표 GMV/주문 건수 라인 추가 (점선, 회색)

### 2.2 색상 및 스타일 개선

#### 2.2.1 색상 팔레트
```typescript
const chartColors = {
  gmv: {
    primary: '#F78C3A',      // idus Orange
    gradient: ['#F78C3A', '#FFB366'],  // 그라데이션
    ma: '#D97706',           // 이동평균 (더 진한 주황)
  },
  orders: {
    primary: '#3B82F6',       // Blue
    gradient: ['#3B82F6', '#60A5FA'],  // 그라데이션
    ma: '#1E40AF',           // 이동평균 (더 진한 파랑)
  },
  trend: '#10B981',          // 트렌드 라인 (초록)
  target: '#94A3B8',         // 목표선 (회색)
  weekend: '#F1F5F9',        // 주말 배경
}
```

#### 2.2.2 애니메이션
- **로딩 애니메이션**: 데이터 로드 시 부드러운 페이드인
- **호버 효과**: 마우스 오버 시 해당 바 강조 (크기 확대, 그림자)
- **인터랙션 피드백**: 클릭/선택 시 시각적 피드백

### 2.3 레이아웃 개선

#### 2.3.1 차트 헤더 강화
```tsx
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-3">
    <Icon icon={TrendingUp} />
    <div>
      <h2 className="text-xl font-bold">GMV & 주문 추세</h2>
      <p className="text-sm text-slate-500">7일 이동평균, 트렌드 분석 포함</p>
    </div>
  </div>
  <div className="flex items-center gap-2">
    {/* 필터 버튼들 */}
  </div>
</div>
```

#### 2.3.2 범례 개선
- **인터랙티브 범례**: 클릭 시 해당 데이터 시리즈 표시/숨김
- **상태 표시**: 활성/비활성 상태 시각적 구분
- **통계 요약**: 각 시리즈의 최근 변화율 표시

---

## 3. 기능적 개선안

### 3.1 필터링 및 기간 선택

#### 3.1.1 고급 기간 선택
**현재**: 기본 날짜 범위 선택
**개선**: 프리셋 + 커스텀 기간

```tsx
<PeriodSelector
  presets={[
    { label: '최근 7일', value: '7d' },
    { label: '최근 30일', value: '30d' },
    { label: '최근 90일', value: '90d' },
    { label: '이번 달', value: 'thisMonth' },
    { label: '지난 달', value: 'lastMonth' },
    { label: '올해', value: 'thisYear' },
    { label: '작년', value: 'lastYear' },
  ]}
  customRange={true}
  compareMode={true}  // 비교 모드
/>
```

#### 3.1.2 비교 모드
- **전년 동기 비교**: 작년 같은 기간과 비교
- **이전 기간 비교**: 선택한 기간과 이전 기간 비교
- **목표 대비**: 목표치와 실제 성과 비교

### 3.2 데이터 집계 옵션

#### 3.2.1 집계 단위 선택
```tsx
<AggregationSelector
  options={[
    { label: '일별', value: 'daily' },
    { label: '주별', value: 'weekly' },
    { label: '월별', value: 'monthly' },
  ]}
/>
```

#### 3.2.2 이동평균 기간 선택
```tsx
<MovingAverageSelector
  options={[
    { label: '3일 이동평균', value: 3 },
    { label: '7일 이동평균', value: 7 },
    { label: '14일 이동평균', value: 14 },
    { label: '30일 이동평균', value: 30 },
  ]}
  default={7}
/>
```

### 3.3 인터랙션 기능

#### 3.3.1 고급 툴팁
**현재**: 기본 툴팁 (값만 표시)
**개선**: 상세 정보 툴팁

```tsx
<Tooltip
  content={({ active, payload, label }) => {
    if (!active || !payload) return null
    
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-4 border border-slate-200">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}</span>
            </div>
            <span className="font-bold">
              {entry.name === 'GMV' 
                ? formatCurrency(entry.value)
                : `${entry.value}건`
              }
            </span>
          </div>
        ))}
        {/* 추가 정보 */}
        <div className="mt-2 pt-2 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            전일 대비: {calculateChange(payload)}
          </p>
        </div>
      </div>
    )
  }}
/>
```

#### 3.3.2 브러시 기능 (Zoom)
- **영역 선택**: 마우스로 드래그하여 특정 기간 확대
- **더블클릭**: 전체 기간으로 복원
- **스크롤**: 좌우 스크롤로 기간 이동

#### 3.3.3 데이터 포인트 클릭
- **상세 정보 모달**: 해당 날짜의 상세 정보 표시
- **관련 데이터 링크**: 해당 날짜의 주문 목록, 작가별 분석 등으로 이동

### 3.4 분석 기능

#### 3.4.1 트렌드 분석
- **트렌드 라인**: 선형 회귀를 통한 트렌드 라인 표시
- **트렌드 지표**: 
  - 상승/하락/유지 판단
  - 변화율 (%)
  - 예상 다음 기간 값

#### 3.4.2 이상 징후 감지
- **이상값 표시**: 평균 대비 크게 벗어난 값 강조
- **알림**: 급격한 변화 시 알림 표시
- **원인 분석**: 이상값 클릭 시 가능한 원인 제시

#### 3.4.3 패턴 인식
- **주간 패턴**: 요일별 패턴 표시
- **월간 패턴**: 월별 패턴 표시
- **계절성**: 계절별 패턴 분석

### 3.5 통계 요약

#### 3.5.1 요약 카드
차트 상단에 핵심 지표 요약 카드 추가:

```tsx
<div className="grid grid-cols-4 gap-4 mb-6">
  <StatCard
    label="평균 일일 GMV"
    value={formatCurrency(avgGmv)}
    change={gmvChange}
    trend={gmvTrend}
  />
  <StatCard
    label="평균 일일 주문"
    value={`${avgOrders}건`}
    change={ordersChange}
    trend={ordersTrend}
  />
  <StatCard
    label="최고 GMV"
    value={formatCurrency(maxGmv)}
    date={maxGmvDate}
  />
  <StatCard
    label="최고 주문"
    value={`${maxOrders}건`}
    date={maxOrdersDate}
  />
</div>
```

#### 3.5.2 성장률 표시
- **전일 대비**: 전일 대비 변화율
- **전주 대비**: 전주 같은 요일 대비
- **전월 대비**: 전월 같은 날짜 대비
- **전년 동기 대비**: 전년 같은 날짜 대비

---

## 4. 기술적 구현

### 4.1 컴포넌트 구조

```
components/
├── charts/
│   ├── GMVTrendChart.tsx          (신규, 메인 컴포넌트)
│   ├── ChartHeader.tsx            (신규, 헤더 + 필터)
│   ├── ChartTooltip.tsx           (신규, 커스텀 툴팁)
│   ├── StatSummaryCards.tsx      (신규, 통계 요약)
│   └── ChartControls.tsx          (신규, 컨트롤 패널)
└── ui/
    ├── PeriodSelector.tsx          (신규, 기간 선택)
    ├── AggregationSelector.tsx    (신규, 집계 단위)
    └── MovingAverageSelector.tsx  (신규, 이동평균)
```

### 4.2 데이터 구조

```typescript
interface GMVTrendData {
  date: string
  gmv: number
  orders: number
  gmvMA7?: number      // 7일 이동평균
  ordersMA7?: number   // 7일 이동평균
  gmvTrend?: number    // 트렌드 라인 값
  ordersTrend?: number // 트렌드 라인 값
  isWeekend?: boolean
  isHoliday?: boolean
  isAnomaly?: boolean  // 이상값 여부
}

interface ChartConfig {
  period: '7d' | '30d' | '90d' | 'custom'
  startDate?: string
  endDate?: string
  aggregation: 'daily' | 'weekly' | 'monthly'
  movingAverage: number
  showTrendLine: boolean
  showTargetLine: boolean
  targetGmv?: number
  targetOrders?: number
  compareMode: boolean
  comparePeriod?: 'previous' | 'lastYear' | 'target'
}
```

### 4.3 API 개선

#### 4.3.1 백엔드 API 확장
```typescript
// GET /api/dashboard/main
// 기존 응답에 추가:
{
  trend: {
    labels: string[]
    datasets: [
      { label: 'GMV', data: number[], type: 'bar' },
      { label: '주문 건수', data: number[], type: 'bar' },
      { label: 'GMV (7일 이동평균)', data: number[], type: 'line' },
      { label: '주문 건수 (7일 이동평균)', data: number[], type: 'line' },
    ],
    // 추가 데이터
    stats: {
      avgGmv: number
      avgOrders: number
      maxGmv: { value: number, date: string }
      maxOrders: { value: number, date: string }
      trends: {
        gmv: { direction: 'up' | 'down' | 'stable', rate: number }
        orders: { direction: 'up' | 'down' | 'stable', rate: number }
      }
    },
    anomalies: Array<{ date: string, type: 'gmv' | 'orders', reason?: string }>
  }
}
```

### 4.4 차트 라이브러리 활용

#### 4.4.1 Recharts ComposedChart
```tsx
<ComposedChart data={chartData}>
  {/* 배경: 주말 표시 */}
  <ReferenceArea 
    x1="2025-12-07" 
    x2="2025-12-08" 
    fill="#F1F5F9" 
    opacity={0.3}
  />
  
  {/* 그리드 */}
  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
  
  {/* X축 */}
  <XAxis 
    dataKey="date" 
    tick={{ fill: '#64748B', fontSize: 12 }}
    tickFormatter={(value) => formatDate(value)}
  />
  
  {/* Y축 (좌측: GMV) */}
  <YAxis 
    yAxisId="left" 
    orientation="left"
    tick={{ fill: '#64748B', fontSize: 12 }}
    tickFormatter={(value) => formatCurrency(value)}
  />
  
  {/* Y축 (우측: 주문 건수) */}
  <YAxis 
    yAxisId="right" 
    orientation="right"
    tick={{ fill: '#64748B', fontSize: 12 }}
  />
  
  {/* 목표선 */}
  <ReferenceLine 
    yAxisId="left" 
    y={targetGmv} 
    stroke="#94A3B8" 
    strokeDasharray="5 5"
    label={{ value: '목표 GMV', position: 'right' }}
  />
  
  {/* GMV 바 차트 */}
  <Bar 
    yAxisId="left"
    dataKey="gmv"
    fill="url(#gmvGradient)"
    radius={[4, 4, 0, 0]}
  >
    {chartData.map((entry, index) => (
      <Cell 
        key={`cell-${index}`} 
        fill={entry.isAnomaly ? '#EF4444' : undefined}
      />
    ))}
  </Bar>
  
  {/* 주문 건수 바 차트 */}
  <Bar 
    yAxisId="right"
    dataKey="orders"
    fill="url(#ordersGradient)"
    radius={[4, 4, 0, 0]}
  />
  
  {/* GMV 이동평균 라인 */}
  <Line 
    yAxisId="left"
    type="monotone"
    dataKey="gmvMA7"
    stroke="#D97706"
    strokeWidth={2}
    dot={false}
    activeDot={{ r: 4 }}
  />
  
  {/* 주문 건수 이동평균 라인 */}
  <Line 
    yAxisId="right"
    type="monotone"
    dataKey="ordersMA7"
    stroke="#1E40AF"
    strokeWidth={2}
    dot={false}
    activeDot={{ r: 4 }}
  />
  
  {/* 트렌드 라인 */}
  <Line 
    yAxisId="left"
    type="linear"
    dataKey="gmvTrend"
    stroke="#10B981"
    strokeWidth={2}
    strokeDasharray="5 5"
    dot={false}
  />
  
  {/* 툴팁 */}
  <Tooltip content={<CustomTooltip />} />
  
  {/* 범례 */}
  <Legend 
    wrapperStyle={{ paddingTop: '20px' }}
    iconType="rect"
    onClick={handleLegendClick}
  />
  
  {/* 브러시 (Zoom) */}
  <Brush 
    dataKey="date"
    height={30}
    tickFormatter={(value) => formatDate(value)}
  />
  
  {/* 그라데이션 정의 */}
  <defs>
    <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#F78C3A" stopOpacity={0.8} />
      <stop offset="100%" stopColor="#F78C3A" stopOpacity={0.3} />
    </linearGradient>
    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.3} />
    </linearGradient>
  </defs>
</ComposedChart>
```

---

## 5. 사용자 경험 개선

### 5.1 로딩 상태
- **스켈레톤 UI**: 데이터 로딩 중 스켈레톤 차트 표시
- **점진적 로딩**: 기본 데이터 먼저 표시, 이동평균 등은 나중에 로드

### 5.2 에러 처리
- **데이터 없음**: "데이터가 없습니다" 메시지와 함께 빈 상태 표시
- **에러 발생**: 에러 메시지와 재시도 버튼 제공

### 5.3 반응형 디자인
- **모바일**: 터치 제스처 지원, 세로 방향 최적화
- **태블릿**: 적절한 크기 조정
- **데스크톱**: 전체 기능 제공

### 5.4 접근성
- **키보드 네비게이션**: 모든 기능 키보드로 접근 가능
- **스크린 리더**: ARIA 레이블 및 설명 제공
- **색상 대비**: WCAG AA 기준 준수

---

## 6. 성능 최적화

### 6.1 데이터 최적화
- **가상화**: 대량 데이터 시 가상 스크롤 적용
- **데이터 샘플링**: 긴 기간 선택 시 자동 샘플링
- **캐싱**: 자주 사용하는 기간 데이터 캐싱

### 6.2 렌더링 최적화
- **React.memo**: 불필요한 리렌더링 방지
- **useMemo/useCallback**: 계산 결과 메모이제이션
- **지연 로딩**: 필요 시에만 고급 기능 로드

---

## 7. 구현 우선순위

### Phase 1: 핵심 기능 (1주)
1. Combo Chart 구현 (Bar + Line)
2. 이중 Y축 구현
3. 이동평균 라인 표시
4. 고급 툴팁

### Phase 2: 필터링 및 비교 (1주)
5. 기간 선택 개선
6. 집계 단위 선택
7. 비교 모드 구현

### Phase 3: 분석 기능 (1주)
8. 트렌드 라인
9. 통계 요약 카드
10. 이상 징후 감지

### Phase 4: 고급 기능 (1주)
11. 브러시 (Zoom)
12. 패턴 인식
13. 성능 최적화

---

## 8. 예상 효과

### 8.1 사용자 경험
- **인사이트 도출 시간 단축**: 한눈에 트렌드 파악 가능
- **의사결정 지원**: 데이터 기반 의사결정 용이
- **전문성 향상**: 프리미엄 대시보드 수준의 완성도

### 8.2 비즈니스 가치
- **문제 조기 발견**: 이상 징후 조기 감지
- **트렌드 예측**: 미래 성과 예측 가능
- **성과 개선**: 목표 대비 성과 모니터링

---

## 9. 참고 자료

### 9.1 디자인 참고
- Google Analytics 대시보드
- Tableau 차트 디자인
- D3.js 예제
- Recharts 공식 문서

### 9.2 기술 스택
- **차트 라이브러리**: Recharts
- **날짜 처리**: date-fns
- **상태 관리**: React Query
- **스타일링**: Tailwind CSS

---

## 10. 결론

이 개선 계획을 통해 GMV & 주문 추세 차트를 전체 허브에서 가장 시각적으로, 기능적으로 완성도 높은 차트로 발전시킬 수 있습니다. 단계적 구현을 통해 점진적으로 개선하면서 사용자 피드백을 반영하여 최종적으로 프리미엄 대시보드 수준의 차트를 완성할 수 있습니다.

