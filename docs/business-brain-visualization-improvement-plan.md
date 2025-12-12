# Business Brain 시각화 개선 계획

**작성일**: 2024-12-11  
**목적**: Business Brain 페이지의 시각화 완성도 향상 및 사용자 경험 개선

---

## 📊 현재 상태 분석

### 1. 현재 시각화 현황

#### 사용 중인 시각화
- ✅ **텍스트 기반 메트릭 카드**: 숫자, 아이콘, 배지
- ✅ **진행 바 (Progress Bar)**: 재구매율, 전환율 등
- ✅ **테이블**: 데이터 리스트 표시
- ✅ **배지 및 상태 표시기**: 신뢰도, 데이터 품질

#### 미사용 시각화
- ❌ **차트 라이브러리**: Chart.js는 설치되어 있으나 Business Brain에서 미사용
- ❌ **트렌드 라인 차트**: 시계열 데이터 시각화 부재
- ❌ **파이/도넛 차트**: 비율 데이터 시각화 부재
- ❌ **히트맵**: 코호트 분석 등에 활용 가능
- ❌ **인터랙티브 차트**: 호버, 클릭 등 상호작용 부재

### 2. 고객 분석 페이지와의 비교

#### 고객 분석 페이지 (참고 모델)
- ✅ Chart.js 활용 (Bar, Doughnut, Line)
- ✅ 인터랙티브 차트 (클릭, 호버)
- ✅ 반응형 차트 디자인
- ✅ 색상 코딩 및 범례

#### Business Brain (현재)
- ❌ 차트 미사용
- ❌ 텍스트/테이블 위주
- ❌ 시각적 인사이트 부족

---

## 🎯 개선 목표

### 1. 핵심 목표
1. **데이터 이해도 향상**: 시각적 표현으로 빠른 인사이트 파악
2. **전문성 강화**: 엔터프라이즈급 대시보드 수준의 시각화
3. **사용자 경험 개선**: 직관적이고 인터랙티브한 인터페이스
4. **일관성 확보**: 고객 분석 페이지와 동일한 시각화 스타일

### 2. 성공 지표
- 시각화 적용 영역: 8개 이상
- 차트 타입 다양성: 5가지 이상
- 인터랙티브 기능: 호버, 클릭, 필터링
- 반응형 디자인: 모바일/태블릿/데스크톱 지원

---

## 📈 시각화 개선 영역

### 1. 트렌드 분석 탭

#### 현재 상태
- 텍스트 기반 트렌드 설명
- 증감율 숫자 표시

#### 개선안
```typescript
// 시계열 라인 차트
- 매출(GMV) 트렌드: 다중 라인 (실제값, 예측값, 목표값)
- 주문 수 트렌드: 라인 차트
- 고객 수 트렌드: 라인 차트
- 작가 활동 트렌드: 라인 차트

// 특징
- 기간 선택 (7d, 30d, 90d, 180d, 365d)
- 호버 시 상세 정보 표시
- 예측 구간 표시 (신뢰 구간)
- 트렌드 방향 표시 (상승/하락 화살표)
```

**차트 타입**: Multi-line Chart (Chart.js Line)

**디자인 가이드**:
- 색상: 매출(emerald), 주문(blue), 고객(purple), 작가(orange)
- 그리드: 연한 회색 배경
- 애니메이션: 부드러운 페이드인
- 반응형: 모바일에서 세로 스크롤

---

### 2. RFM 분석 탭

#### 현재 상태
- 세그먼트별 숫자 표시
- 텍스트 기반 설명

#### 개선안
```typescript
// 도넛 차트
- 세그먼트 분포: 도넛 차트 (고객 분석 페이지와 동일)
- 클릭 시 해당 세그먼트 상세 정보 표시

// RFM 매트릭스 히트맵
- R(Recency) x F(Frequency) 매트릭스
- 색상 강도로 고객 수 표시
- 호버 시 상세 정보

// 세그먼트별 매출 기여도
- 바 차트 (가로형)
- 각 세그먼트의 매출 기여도 시각화
```

**차트 타입**: Doughnut Chart, Heatmap, Horizontal Bar Chart

**디자인 가이드**:
- 세그먼트 색상: VIP(금색), 충성(녹색), 잠재(파란색), 이탈(회색)
- 히트맵: 녹색 → 노란색 → 빨간색 그라데이션
- 인터랙티브: 클릭 시 필터링, 호버 시 툴팁

---

### 3. 파레토 분석 탭

#### 현재 상태
- 작가/국가별 순위 테이블
- 집중도 숫자 표시

#### 개선안
```typescript
// 파레토 차트 (80-20 법칙)
- 누적 매출 비율 라인 + 개별 바 차트
- 80% 기준선 표시
- 상위 N개 항목 강조

// 트리맵 (Treemap)
- 작가별 매출 비율을 면적으로 표시
- 큰 면적 = 높은 매출
- 클릭 시 해당 작가 상세 정보

// 국가별 매출 분포
- 막대 차트 (가로형)
- 색상 코딩 (지역별)
```

**차트 타입**: Pareto Chart (Bar + Line), Treemap, Horizontal Bar Chart

**디자인 가이드**:
- 파레토 라인: 빨간색 점선 (80% 기준선)
- 트리맵: 색상 그라데이션 (매출 높을수록 진한 색)
- 반응형: 모바일에서 세로 스크롤

---

### 4. 코호트 분석 탭

#### 현재 상태
- 코호트 테이블 (숫자 기반)
- 리텐션율 숫자 표시

#### 개선안
```typescript
// 코호트 히트맵
- 월별 코호트 x 기간별 리텐션
- 색상 강도로 리텐션율 표시
- 호버 시 상세 정보

// 리텐션 커브
- 라인 차트 (코호트별)
- 시간 경과에 따른 리텐션율 추이
- 코호트 비교 가능

// 코호트별 매출 기여도
- 스택 바 차트
- 각 코호트의 월별 매출 기여도
```

**차트 타입**: Heatmap, Multi-line Chart, Stacked Bar Chart

**디자인 가이드**:
- 히트맵: 녹색(높은 리텐션) → 노란색 → 빨간색(낮은 리텐션)
- 리텐션 커브: 코호트별 다른 색상 라인
- 범례: 코호트별 색상 매핑

---

### 5. 이상 탐지 탭

#### 현재 상태
- 이상 항목 리스트
- 텍스트 기반 설명

#### 개선안
```typescript
// 시계열 차트 + 이상 점 표시
- 정상 데이터: 라인 차트
- 이상 데이터: 빨간색 점/마커
- 이상 구간: 빨간색 배경 하이라이트

// 이상 분포 차트
- 바 차트 (이상 유형별)
- 각 유형의 발생 빈도

// 이상 심각도 매트릭스
- 산점도 (심각도 x 영향도)
- 크기로 빈도 표시
- 색상으로 우선순위 표시
```

**차트 타입**: Line Chart with Anomaly Markers, Bar Chart, Scatter Plot

**디자인 가이드**:
- 이상 마커: 빨간색 원형 (크기로 심각도)
- 이상 구간: 반투명 빨간색 배경
- 산점도: 크기(빈도), 색상(우선순위)

---

### 6. 신규 유저 유치 분석 탭

#### 현재 상태
- 전환율 퍼널 (진행 바)
- 채널별 성과 (텍스트/숫자)

#### 개선안
```typescript
// 전환 퍼널 차트
- 단계별 전환율 시각화
- 각 단계의 드롭오프 표시
- 인터랙티브: 클릭 시 상세 정보

// 채널별 성과 비교
- 그룹 바 차트
- 채널별 신규 유저, 전환율, LTV 비교
- 색상 코딩 (성과 등급)

// 전환율 트렌드
- 라인 차트 (월별)
- 채널별 전환율 추이 비교
```

**차트 타입**: Funnel Chart, Grouped Bar Chart, Multi-line Chart

**디자인 가이드**:
- 퍼널: 각 단계별 다른 색상 (파란색 그라데이션)
- 드롭오프: 빨간색 화살표
- 채널 색상: organic(녹색), paid(파란색), referral(보라색)

---

### 7. 재구매율 향상 분석 탭

#### 현재 상태
- 재구매율 진행 바
- 기간별 재구매율 (텍스트)

#### 개선안
```typescript
// 재구매율 비교 차트
- 그룹 바 차트 (30일/60일/90일)
- 기간별 재구매율 비교
- 신뢰 구간 표시

// 재구매 타이밍 분포
- 히스토그램
- 첫 구매 후 재구매까지 일수 분포
- 평균값 표시

// 재구매 예측 확률 분포
- 바 차트 (확률 구간별)
- 고객 수 분포
```

**차트 타입**: Grouped Bar Chart, Histogram, Bar Chart

**디자인 가이드**:
- 기간별 색상: 30일(파란색), 60일(녹색), 90일(보라색)
- 신뢰 구간: 반투명 배경
- 평균값: 수직선 표시

---

### 8. 건강도 점수 탭

#### 현재 상태
- 건강도 점수 숫자 표시
- 4차원 점수 (텍스트)

#### 개선안
```typescript
// 레이더 차트 (Spider Chart)
- 4차원 건강도 점수 시각화
- 각 차원의 점수 비교
- 목표 점수 표시

// 건강도 트렌드
- 라인 차트 (시간별)
- 4차원 점수 추이
- 전체 건강도 점수 오버레이

// 건강도 분포
- 도넛 차트
- 각 차원의 기여도
```

**차트 타입**: Radar Chart, Multi-line Chart, Doughnut Chart

**디자인 가이드**:
- 레이더: 각 차원별 다른 색상
- 목표 점수: 점선 표시
- 건강도 등급: 색상 코딩 (녹색/노란색/빨간색)

---

### 9. 매출 예측 탭

#### 현재 상태
- 예측값 숫자 표시
- 텍스트 기반 설명

#### 개선안
```typescript
// 시계열 예측 차트
- 과거 데이터: 라인 차트 (실선)
- 예측 데이터: 라인 차트 (점선)
- 신뢰 구간: 반투명 영역
- 목표값: 수평선

// 예측 정확도 표시
- 바 차트 (과거 예측 vs 실제)
- 정확도 퍼센트 표시

// 시나리오 비교
- 다중 라인 차트
- 낙관적/현실적/비관적 시나리오
```

**차트 타입**: Line Chart with Confidence Interval, Bar Chart, Multi-line Chart

**디자인 가이드**:
- 과거 데이터: 파란색 실선
- 예측 데이터: 주황색 점선
- 신뢰 구간: 연한 파란색 배경
- 목표값: 빨간색 수평선

---

## 🎨 디자인 시스템

### 1. 색상 팔레트

#### 메인 색상
```typescript
const colors = {
  // 매출 관련
  revenue: {
    primary: '#10B981', // emerald-500
    secondary: '#059669', // emerald-600
    light: '#D1FAE5', // emerald-100
  },
  
  // 주문 관련
  orders: {
    primary: '#3B82F6', // blue-500
    secondary: '#2563EB', // blue-600
    light: '#DBEAFE', // blue-100
  },
  
  // 고객 관련
  customers: {
    primary: '#8B5CF6', // purple-500
    secondary: '#7C3AED', // purple-600
    light: '#EDE9FE', // purple-100
  },
  
  // 작가 관련
  artists: {
    primary: '#F59E0B', // amber-500
    secondary: '#D97706', // amber-600
    light: '#FEF3C7', // amber-100
  },
  
  // 경고/위험
  warning: {
    primary: '#EF4444', // red-500
    secondary: '#DC2626', // red-600
    light: '#FEE2E2', // red-100
  },
  
  // 성공/긍정
  success: {
    primary: '#10B981', // emerald-500
    secondary: '#059669', // emerald-600
    light: '#D1FAE5', // emerald-100
  },
  
  // 중립
  neutral: {
    primary: '#6B7280', // gray-500
    secondary: '#4B5563', // gray-600
    light: '#F3F4F6', // gray-100
  },
}
```

#### 그라데이션
```typescript
const gradients = {
  revenue: 'from-emerald-500 to-teal-500',
  orders: 'from-blue-500 to-indigo-500',
  customers: 'from-purple-500 to-pink-500',
  artists: 'from-amber-500 to-orange-500',
  warning: 'from-red-500 to-rose-500',
  success: 'from-green-500 to-emerald-500',
}
```

### 2. 타이포그래피

#### 차트 제목
- 크기: `text-lg` (18px)
- 굵기: `font-semibold` (600)
- 색상: `text-slate-700 dark:text-slate-300`

#### 차트 레이블
- 크기: `text-sm` (14px)
- 굵기: `font-medium` (500)
- 색상: `text-slate-600 dark:text-slate-400`

#### 범례
- 크기: `text-xs` (12px)
- 굵기: `font-normal` (400)
- 색상: `text-slate-500 dark:text-slate-500`

### 3. 간격 및 레이아웃

#### 카드 간격
- 세로: `space-y-6` (24px)
- 가로: `gap-6` (24px)

#### 차트 높이
- 기본: `h-64` (256px)
- 큰 차트: `h-96` (384px)
- 작은 차트: `h-48` (192px)

#### 패딩
- 카드 내부: `p-6` (24px)
- 차트 컨테이너: `p-4` (16px)

---

## 🛠️ 기술 구현

### 1. 차트 라이브러리

#### Chart.js 설정
```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)
```

#### 공통 옵션
```typescript
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        boxWidth: 12,
        padding: 8,
        font: { size: 11 },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: { size: 14, weight: 'bold' },
      bodyFont: { size: 12 },
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
    },
  },
  animation: {
    duration: 1000,
    easing: 'easeOutQuart' as const,
  },
}
```

### 2. 재사용 가능한 차트 컴포넌트

#### LineChart 컴포넌트
```typescript
interface LineChartProps {
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      color: string
      fill?: boolean
    }[]
  }
  height?: number
  showLegend?: boolean
  showGrid?: boolean
}

export function LineChart({ data, height = 256, showLegend = true, showGrid = true }: LineChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map(d => ({
      label: d.label,
      data: d.data,
      borderColor: d.color,
      backgroundColor: d.fill ? `${d.color}20` : 'transparent',
      fill: d.fill,
      tension: 0.4,
    })),
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Line
        data={chartData}
        options={{
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            legend: { ...commonOptions.plugins.legend, display: showLegend },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { display: showGrid, color: 'rgba(0, 0, 0, 0.05)' },
            },
            x: {
              grid: { display: showGrid, color: 'rgba(0, 0, 0, 0.05)' },
            },
          },
        }}
      />
    </div>
  )
}
```

#### BarChart 컴포넌트
```typescript
interface BarChartProps {
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      color: string
    }[]
  }
  height?: number
  horizontal?: boolean
  stacked?: boolean
}

export function BarChart({ data, height = 256, horizontal = false, stacked = false }: BarChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map(d => ({
      label: d.label,
      data: d.data,
      backgroundColor: d.color,
      borderRadius: 6,
    })),
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Bar
        data={chartData}
        options={{
          ...commonOptions,
          indexAxis: horizontal ? 'y' : 'x',
          scales: {
            x: {
              stacked,
              beginAtZero: true,
            },
            y: {
              stacked,
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  )
}
```

#### DoughnutChart 컴포넌트
```typescript
interface DoughnutChartProps {
  data: {
    labels: string[]
    values: number[]
    colors: string[]
  }
  height?: number
  showCenterText?: boolean
  centerText?: string
}

export function DoughnutChart({ 
  data, 
  height = 256, 
  showCenterText = false,
  centerText 
}: DoughnutChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: [{
      data: data.values,
      backgroundColor: data.colors,
      borderWidth: 0,
    }],
  }

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Doughnut
        data={chartData}
        options={{
          ...commonOptions,
          cutout: '70%',
        }}
      />
      {showCenterText && centerText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
              {centerText}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 3. 히트맵 컴포넌트

```typescript
interface HeatmapProps {
  data: {
    rows: string[]
    columns: string[]
    values: number[][]
  }
  colorScale?: {
    min: string
    max: string
  }
}

export function Heatmap({ data, colorScale }: HeatmapProps) {
  const maxValue = Math.max(...data.values.flat())
  const minValue = Math.min(...data.values.flat())

  const getColor = (value: number) => {
    const ratio = (value - minValue) / (maxValue - minValue)
    // 녹색 → 노란색 → 빨간색 그라데이션
    if (ratio < 0.5) {
      return `rgba(34, 197, 94, ${0.3 + ratio * 0.7})` // green
    } else {
      return `rgba(239, 68, 68, ${0.3 + (ratio - 0.5) * 0.7})` // red
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400"></th>
            {data.columns.map(col => (
              <th key={col} className="p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={row}>
              <td className="p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                {row}
              </td>
              {data.columns.map((_, j) => (
                <td
                  key={j}
                  className="p-2 text-center"
                  style={{ backgroundColor: getColor(data.values[i][j]) }}
                >
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {data.values[i][j].toFixed(1)}%
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## 📱 반응형 디자인

### 1. 브레이크포인트

```typescript
const breakpoints = {
  mobile: '640px',   // sm
  tablet: '768px',   // md
  desktop: '1024px', // lg
  wide: '1280px',    // xl
}
```

### 2. 모바일 최적화

- 세로 스크롤: 모바일에서 차트를 세로로 배치
- 터치 최적화: 차트 터치 영역 확대
- 간소화된 범례: 모바일에서 범례 숨김 또는 축소

### 3. 태블릿 최적화

- 2열 그리드: 태블릿에서 2열 레이아웃
- 중간 크기 차트: 높이 조정

### 4. 데스크톱 최적화

- 3-4열 그리드: 넓은 화면 활용
- 큰 차트: 더 많은 데이터 표시
- 사이드바: 추가 정보 표시

---

## 🎯 구현 우선순위

### Phase 1: 핵심 시각화 (P0)
1. ✅ 트렌드 분석: 라인 차트
2. ✅ RFM 분석: 도넛 차트
3. ✅ 파레토 분석: 파레토 차트
4. ✅ 건강도 점수: 레이더 차트

**예상 기간**: 1주

### Phase 2: 고급 시각화 (P1)
5. ✅ 코호트 분석: 히트맵
6. ✅ 이상 탐지: 이상 마커가 있는 라인 차트
7. ✅ 신규 유저 유치: 퍼널 차트
8. ✅ 재구매율 향상: 그룹 바 차트

**예상 기간**: 1주

### Phase 3: 인터랙티브 기능 (P2)
9. ✅ 차트 클릭 이벤트
10. ✅ 필터링 기능
11. ✅ 데이터 내보내기
12. ✅ 비교 모드

**예상 기간**: 3일

---

## 📋 체크리스트

### 시각화 적용
- [ ] 트렌드 분석: 라인 차트
- [ ] RFM 분석: 도넛 차트 + 히트맵
- [ ] 파레토 분석: 파레토 차트 + 트리맵
- [ ] 코호트 분석: 히트맵 + 리텐션 커브
- [ ] 이상 탐지: 이상 마커 라인 차트
- [ ] 신규 유저 유치: 퍼널 차트 + 그룹 바 차트
- [ ] 재구매율 향상: 그룹 바 차트 + 히스토그램
- [ ] 건강도 점수: 레이더 차트
- [ ] 매출 예측: 예측 라인 차트

### 디자인 시스템
- [ ] 색상 팔레트 적용
- [ ] 타이포그래피 통일
- [ ] 간격 및 레이아웃 일관성
- [ ] 다크 모드 지원

### 반응형 디자인
- [ ] 모바일 최적화
- [ ] 태블릿 최적화
- [ ] 데스크톱 최적화

### 인터랙티브 기능
- [ ] 호버 툴팁
- [ ] 클릭 이벤트
- [ ] 필터링
- [ ] 데이터 내보내기

---

## 🚀 예상 효과

### 1. 사용자 경험
- **데이터 이해도**: 텍스트 대비 3배 향상
- **인사이트 발견 시간**: 50% 단축
- **사용자 만족도**: 40% 향상

### 2. 비즈니스 가치
- **의사결정 속도**: 30% 향상
- **인사이트 활용도**: 60% 향상
- **대시보드 사용 빈도**: 2배 증가

### 3. 기술적 가치
- **코드 재사용성**: 공통 컴포넌트로 70% 향상
- **유지보수성**: 표준화된 디자인 시스템
- **확장성**: 새로운 차트 타입 추가 용이

---

## 📚 참고 자료

### 차트 라이브러리
- [Chart.js 공식 문서](https://www.chartjs.org/)
- [react-chartjs-2 문서](https://react-chartjs-2.js.org/)

### 디자인 가이드
- [Material Design Charts](https://material.io/design/communication/data-visualization.html)
- [Tableau Design Guidelines](https://www.tableau.com/learn/articles/data-visualization)

### 모범 사례
- [Google Analytics 대시보드](https://analytics.google.com/)
- [Stripe Dashboard](https://stripe.com/docs/dashboard)
- [GitHub Insights](https://github.com/features/insights)

---

**작성 완료일**: 2024-12-11  
**검토 상태**: 초안 완료, 구현 대기

