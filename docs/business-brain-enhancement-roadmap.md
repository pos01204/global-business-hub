# Business Brain 내부 고도화 로드맵

## 📋 문서 정보
- **작성일**: 2024-12-11
- **버전**: 3.0
- **목적**: 외부 연동 없이 허브 내부 기능만으로 Business Brain 실무 활용도 향상

---

## 1. 현재 기능 상세 점검

### 1.1 구현된 탭 및 기능 현황 (12개 탭)

| 탭 | 기능 | 실무 활용도 | 개선 여지 |
|----|------|------------|----------|
| **현황 평가** | AI 브리핑, 건강도 점수 | ⭐⭐⭐⭐ | 중 |
| **종합 인사이트** | 기간별 요약, 비교, 예측 통합 | ⭐⭐⭐⭐ | 중 |
| **매출 예측** | Holt-Winters 기반 30일 예측 | ⭐⭐⭐ | 높음 |
| **트렌드** | 장기 트렌드 분석 | ⭐⭐⭐⭐ | 낮음 |
| **기간별 추이** | 주간/월간/분기별 트렌드 | ⭐⭐⭐ | 중 |
| **리스크** | 휴먼 에러 체크 9개 항목 | ⭐⭐⭐⭐⭐ | 낮음 |
| **기회 발견** | 인사이트 자동 발견 | ⭐⭐⭐ | 높음 |
| **RFM** | 고객 세분화 7개 세그먼트 | ⭐⭐⭐⭐ | 중 |
| **파레토** | 작가/국가/고객 집중도 | ⭐⭐⭐⭐ | 낮음 |
| **코호트** | 월별 코호트, 리텐션, LTV | ⭐⭐⭐ | 중 |
| **이상 탐지** | Z-score 기반 이상치 감지 | ⭐⭐⭐⭐ | 중 |
| **전략 제안** | 단기/중기/장기 전략 | ⭐⭐⭐ | 높음 |

### 1.2 백엔드 분석 엔진 현황

```
backend/src/services/analytics/
├── CubeAnalyzer.ts          # N차원 큐브 분석
├── DecompositionEngine.ts   # 매출 변화 분해 분석
├── InsightScorer.ts         # 인사이트 점수화
├── HealthScoreCalculator.ts # 건강도 점수 (4개 차원)
├── DataProcessor.ts         # 코호트/RFM/파레토/상관관계/이상탐지
├── AIBriefingGenerator.ts   # LLM 기반 브리핑 생성
├── BusinessBrainCache.ts    # 분석 결과 캐싱
└── types.ts                 # 타입 정의
```

### 1.3 현재 한계점

| 영역 | 현재 상태 | 한계점 |
|------|----------|--------|
| **인사이트 활용** | 확인만 가능 | 인사이트 → 조치 연결 부재 |
| **고객 분석** | RFM 정적 분류 | 이탈 예측, 행동 패턴 분석 부재 |
| **작가 분석** | 집중도 분석만 | 작가별 건강도 점수 부재 |
| **시뮬레이션** | 없음 | What-if 분석 불가 |
| **리포트** | 화면 조회만 | 다운로드/공유 기능 부재 |

---

## 2. 개선 방향 1: 인사이트 → 액션 연결 강화

### 2.1 현재 문제점
- 인사이트를 확인해도 실제 조치를 위해 다른 페이지로 수동 이동 필요
- 인사이트와 관련 데이터 간 연결이 끊어져 있음

### 2.2 개선 방안: 원클릭 액션 버튼

| 인사이트 유형 | 연결 액션 | 구현 방식 |
|--------------|----------|----------|
| VIP 이탈 위험 | 쿠폰 발급 페이지 이동 | 대상 고객 ID 파라미터 전달 |
| 작가 발송 지연 | QC 페이지 이동 | 해당 작가 필터 적용 |
| 국가별 성장 기회 | 고객 분석 페이지 이동 | 타겟 국가 필터 적용 |
| 재구매율 하락 | RFM 탭 이동 | At Risk 세그먼트 하이라이트 |
| 특정 작가 매출 급증 | 작가 분석 페이지 이동 | 해당 작가 상세 보기 |

```typescript
// 액션 버튼 컴포넌트 구현
interface InsightAction {
  label: string
  icon: string
  href: string                    // 내부 라우팅
  params?: Record<string, any>    // URL 파라미터
}

// 예시: VIP 이탈 위험 인사이트
const vipChurnInsight = {
  title: 'VIP 고객 3명 이탈 위험 감지',
  severity: 'warning',
  actions: [
    {
      label: '쿠폰 발급하기',
      icon: '🎁',
      href: '/coupon-generator',
      params: { targetUsers: '123,456,789', preset: 'retention' }
    },
    {
      label: '고객 상세 보기',
      icon: '👤',
      href: '/customer-analytics',
      params: { segment: 'at_risk_vip' }
    }
  ]
}
```

### 2.3 UI 개선안

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ VIP 고객 3명 이탈 위험 감지                              │
│                                                             │
│ 최근 60일간 구매 없는 VIP 고객이 발견되었습니다.           │
│ - 고객A: 마지막 구매 72일 전, 누적 구매 $2,340             │
│ - 고객B: 마지막 구매 65일 전, 누적 구매 $1,890             │
│ - 고객C: 마지막 구매 61일 전, 누적 구매 $1,560             │
│                                                             │
│ [🎁 쿠폰 발급하기]  [👤 고객 상세 보기]  [📊 RFM 분석]     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 개선 방향 2: 고객 이탈 예측 모델

### 3.1 현재 vs 목표

| 항목 | 현재 | 목표 |
|------|------|------|
| 분류 방식 | RFM 정적 세그먼트 | 동적 이탈 확률 예측 |
| 업데이트 | 수동 조회 시 | 실시간 계산 |
| 출력 | 세그먼트명 | 이탈 확률 %, 위험 요인, 권장 조치 |

### 3.2 이탈 예측 로직 (내부 데이터 기반)

```typescript
interface ChurnPrediction {
  userId: number
  userName: string
  churnProbability: number        // 0-100%
  riskLevel: 'high' | 'medium' | 'low'
  daysUntilChurn: number          // 예상 이탈까지 남은 일수
  riskFactors: {
    factor: string
    impact: number                // 기여도 (%)
    currentValue: string
    benchmark: string
  }[]
  recommendedActions: string[]
  segment: string                 // 현재 RFM 세그먼트
}

// 이탈 확률 계산 (규칙 기반 스코어링)
function calculateChurnScore(customer: CustomerData): number {
  let score = 0
  
  // 1. 구매 간격 분석 (최대 35점)
  const avgInterval = customer.avgOrderInterval
  const lastInterval = customer.daysSinceLastOrder
  const intervalRatio = lastInterval / avgInterval
  
  if (intervalRatio > 3) score += 35
  else if (intervalRatio > 2) score += 25
  else if (intervalRatio > 1.5) score += 15
  else if (intervalRatio > 1.2) score += 5
  
  // 2. 구매 빈도 추세 (최대 25점)
  const recentFreq = customer.ordersLast90Days
  const historicalFreq = customer.ordersPerQuarter
  const freqRatio = recentFreq / historicalFreq
  
  if (freqRatio < 0.3) score += 25
  else if (freqRatio < 0.5) score += 15
  else if (freqRatio < 0.7) score += 8
  
  // 3. AOV 변화 (최대 15점)
  const aovChange = (customer.recentAOV - customer.historicalAOV) / customer.historicalAOV
  if (aovChange < -0.3) score += 15
  else if (aovChange < -0.15) score += 8
  
  // 4. 선호 작가 활동 여부 (최대 15점)
  if (customer.favoriteArtistInactive) score += 15
  
  // 5. 최근 부정적 경험 (최대 10점)
  if (customer.hasRecentComplaint) score += 5
  if (customer.hasRecentReturn) score += 5
  
  return Math.min(score, 100)
}
```

### 3.3 이탈 예측 대시보드 UI

```
┌─────────────────────────────────────────────────────────────┐
│ 🔮 고객 이탈 예측                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 이탈 위험 분포                                           │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 높음 (70%+)  ████████ 12명                              ││
│ │ 중간 (40-70%) ████████████████ 28명                     ││
│ │ 낮음 (<40%)  ████████████████████████████████ 156명     ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ⚠️ 즉시 조치 필요 (이탈 확률 70% 이상)                      │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 고객명    │ 이탈확률 │ 주요 위험 요인      │ 권장 조치  ││
│ │──────────│─────────│───────────────────│────────────││
│ │ 고객A    │ 85%     │ 구매간격 3배 초과   │ 쿠폰 발급  ││
│ │ 고객B    │ 78%     │ 선호작가 이탈       │ 유사작가 추천││
│ │ 고객C    │ 72%     │ AOV 40% 감소       │ 맞춤 프로모션││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ [📥 목록 다운로드]  [🎁 일괄 쿠폰 발급]                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 개선 방향 3: 작가 건강도 점수

### 4.1 현재 vs 목표

| 항목 | 현재 | 목표 |
|------|------|------|
| 분석 범위 | 매출 집중도만 (파레토) | 4차원 종합 건강도 |
| 출력 | 매출 비중 % | 건강도 점수 0-100, 차원별 상세 |
| 활용 | 리스크 인지 | 작가 관리 우선순위, 육성 대상 선정 |

### 4.2 작가 건강도 4차원 모델

```typescript
interface ArtistHealthScore {
  artistId: string
  artistName: string
  overallScore: number            // 0-100
  tier: 'S' | 'A' | 'B' | 'C' | 'D'
  dimensions: {
    sales: {                      // 매출 건강도 (가중치 35%)
      score: number
      trend: 'up' | 'down' | 'stable'
      metrics: {
        revenueGrowthMoM: number
        orderCount: number
        aov: number
        revenueShare: number
      }
    }
    operations: {                 // 운영 건강도 (가중치 25%)
      score: number
      metrics: {
        avgShippingDays: number
        delayRate: number
        qcPassRate: number
      }
    }
    customer: {                   // 고객 만족도 (가중치 25%)
      score: number
      metrics: {
        avgRating: number
        repeatCustomerRate: number
        complaintRate: number
      }
    }
    engagement: {                 // 활동성 (가중치 15%)
      score: number
      metrics: {
        newProductsLast30Days: number
        activeProductCount: number
        lastActivityDays: number
      }
    }
  }
  alerts: string[]                // 주의 필요 항목
  recommendations: string[]       // 개선 제안
}
```

### 4.3 건강도 계산 로직

```typescript
function calculateArtistHealthScore(artist: ArtistData): ArtistHealthScore {
  // 1. 매출 건강도 (35%)
  let salesScore = 50
  if (artist.revenueGrowthMoM > 0.2) salesScore += 30
  else if (artist.revenueGrowthMoM > 0.1) salesScore += 20
  else if (artist.revenueGrowthMoM > 0) salesScore += 10
  else if (artist.revenueGrowthMoM > -0.1) salesScore -= 10
  else salesScore -= 25
  
  // 2. 운영 건강도 (25%)
  let opsScore = 50
  if (artist.avgShippingDays <= 3) opsScore += 25
  else if (artist.avgShippingDays <= 5) opsScore += 15
  else if (artist.avgShippingDays > 7) opsScore -= 20
  
  if (artist.delayRate < 0.05) opsScore += 15
  else if (artist.delayRate > 0.15) opsScore -= 20
  
  // 3. 고객 만족도 (25%)
  let customerScore = 50
  if (artist.avgRating >= 4.5) customerScore += 30
  else if (artist.avgRating >= 4.0) customerScore += 15
  else if (artist.avgRating < 3.5) customerScore -= 25
  
  if (artist.repeatCustomerRate > 0.3) customerScore += 10
  
  // 4. 활동성 (15%)
  let engagementScore = 50
  if (artist.newProductsLast30Days >= 3) engagementScore += 25
  else if (artist.newProductsLast30Days >= 1) engagementScore += 10
  else if (artist.lastActivityDays > 30) engagementScore -= 25
  
  // 종합 점수
  const overallScore = Math.round(
    salesScore * 0.35 +
    opsScore * 0.25 +
    customerScore * 0.25 +
    engagementScore * 0.15
  )
  
  // 티어 결정
  const tier = overallScore >= 85 ? 'S' :
               overallScore >= 70 ? 'A' :
               overallScore >= 55 ? 'B' :
               overallScore >= 40 ? 'C' : 'D'
  
  return { artistId: artist.id, artistName: artist.name, overallScore, tier, ... }
}
```

### 4.4 작가 건강도 대시보드 UI

```
┌─────────────────────────────────────────────────────────────┐
│ 🎨 작가 건강도 현황                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 티어별 분포                                              │
│ S티어: ██ 5명 (8%)    A티어: ████████ 18명 (28%)           │
│ B티어: ██████████ 25명 (39%)  C티어: ████ 12명 (19%)       │
│ D티어: ██ 4명 (6%)                                         │
│                                                             │
│ ⚠️ 관리 필요 작가 (C/D 티어 또는 급락)                      │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 작가명   │ 점수 │ 티어 │ 주요 이슈          │ 권장 조치 ││
│ │─────────│─────│─────│──────────────────│───────────││
│ │ 작가A   │ 38  │ D   │ 발송 지연 25%     │ 운영 점검 ││
│ │ 작가B   │ 42  │ C   │ 평점 3.2 (하락)   │ 품질 개선 ││
│ │ 작가C   │ 65→48│ B→C │ 매출 40% 급락    │ 원인 분석 ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ [📥 전체 목록 다운로드]  [📧 작가 연락하기]                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 개선 방향 4: What-if 시뮬레이션

### 5.1 개요
과거 내부 데이터를 기반으로 가상 시나리오의 예상 결과를 시뮬레이션

### 5.2 지원 시나리오

| 시나리오 | 입력 변수 | 예측 지표 |
|---------|----------|----------|
| 쿠폰 할인율 변경 | 할인율 (%) | 전환율, AOV, GMV, 마진 |
| 특정 작가 이탈 시 | 작가 선택 | GMV 영향, 고객 영향, 대체 작가 |
| 가격 조정 | 가격 변동률 (%) | 주문수, GMV, 마진 |
| VIP 리텐션 캠페인 | 대상 세그먼트, 인센티브 | 리텐션율, LTV 영향, 비용 |

### 5.3 시뮬레이션 로직

```typescript
interface WhatIfScenario {
  type: 'discount' | 'artist_churn' | 'price_change' | 'retention_campaign'
  inputs: Record<string, number | string>
  predictions: {
    metric: string
    currentValue: number
    predictedValue: number
    change: number
    confidence: number          // 예측 신뢰도 (과거 데이터 기반)
  }[]
  assumptions: string[]
  risks: string[]
}

// 예시: 쿠폰 할인율 변경 시뮬레이션
function simulateDiscountChange(
  currentDiscount: number,
  newDiscount: number,
  historicalData: CampaignData[]
): WhatIfScenario {
  // 과거 유사 캠페인 데이터에서 할인율-전환율 관계 분석
  const discountImpact = analyzeDiscountImpact(historicalData)
  
  const conversionChange = discountImpact.conversionPerPercent * (newDiscount - currentDiscount)
  const aovChange = discountImpact.aovPerPercent * (newDiscount - currentDiscount)
  
  return {
    type: 'discount',
    inputs: { currentDiscount, newDiscount },
    predictions: [
      {
        metric: '전환율',
        currentValue: 0.25,
        predictedValue: 0.25 * (1 + conversionChange),
        change: conversionChange * 100,
        confidence: 0.75
      },
      {
        metric: 'AOV',
        currentValue: 50,
        predictedValue: 50 * (1 + aovChange),
        change: aovChange * 100,
        confidence: 0.8
      },
      // ...
    ],
    assumptions: ['과거 6개월 캠페인 데이터 기반', '시장 상황 동일 가정'],
    risks: ['할인 의존도 증가', '마진 압박']
  }
}
```

### 5.4 시뮬레이션 UI

```
┌─────────────────────────────────────────────────────────────┐
│ 🔮 What-if 시뮬레이션                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 시나리오 선택: [쿠폰 할인율 변경 ▼]                         │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 현재 할인율: 10%                                        ││
│ │ 변경 할인율: [15%] ◀────●────▶                         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ 📊 예상 결과 (신뢰도: 75%)                                  │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 지표      │ 현재    │ 예상    │ 변화    │               ││
│ │──────────│────────│────────│────────│               ││
│ │ 전환율   │ 25%    │ 32%    │ +28% ↑ │ ████████      ││
│ │ AOV      │ $50    │ $48    │ -4% ↓  │ ██            ││
│ │ GMV      │ $50,000│ $54,000│ +8% ↑  │ ████          ││
│ │ 마진     │ $15,000│ $13,500│ -10% ↓ │ █████         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ⚠️ 주의사항: 마진 감소 예상, VIP 대상 제한 적용 권장        │
│                                                             │
│ [시뮬레이션 저장]  [다른 시나리오 비교]                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 개선 방향 5: 리포트 다운로드 기능

### 6.1 현재 vs 목표

| 항목 | 현재 | 목표 |
|------|------|------|
| 데이터 확인 | 화면 조회만 | CSV/Excel 다운로드 |
| 리포트 | 없음 | 분석 결과 PDF 다운로드 |
| 공유 | 불가 | 링크 공유 (URL 파라미터) |

### 6.2 다운로드 기능 구현

```typescript
// 다운로드 가능 데이터
const downloadableData = {
  // 고객 데이터
  'rfm-segments': 'RFM 세그먼트별 고객 목록',
  'churn-risk': '이탈 위험 고객 목록',
  'vip-customers': 'VIP 고객 목록',
  
  // 작가 데이터
  'artist-health': '작가 건강도 점수',
  'artist-performance': '작가별 성과 데이터',
  
  // 분석 데이터
  'cohort-analysis': '코호트 분석 결과',
  'pareto-analysis': '파레토 분석 결과',
  'anomaly-detection': '이상 탐지 결과',
  
  // 종합 리포트
  'executive-summary': '경영 브리핑 리포트',
  'weekly-report': '주간 분석 리포트',
  'monthly-report': '월간 분석 리포트'
}

// 다운로드 API
// GET /api/business-brain/export/:type?format=csv|xlsx|pdf
interface ExportOptions {
  type: string
  format: 'csv' | 'xlsx' | 'pdf'
  period?: { start: string; end: string }
  filters?: Record<string, any>
}
```

### 6.3 리포트 템플릿

```typescript
interface ReportTemplate {
  title: string
  period: { start: string; end: string }
  sections: {
    executiveSummary: {
      healthScore: number
      keyHighlights: string[]
      criticalIssues: string[]
    }
    keyMetrics: {
      gmv: MetricWithComparison
      orders: MetricWithComparison
      aov: MetricWithComparison
      newCustomers: MetricWithComparison
      repeatRate: MetricWithComparison
    }
    insights: {
      immediate: Insight[]
      opportunities: Insight[]
      risks: Insight[]
    }
    recommendations: string[]
  }
  generatedAt: string
}
```

### 6.4 UI 개선

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 RFM 고객 세분화                          [📥 다운로드 ▼] │
├─────────────────────────────────────────────────────────────┤
│                                             ┌─────────────┐ │
│ (기존 RFM 분석 화면)                        │ CSV 다운로드│ │
│                                             │ Excel 다운로드│
│                                             │ PDF 리포트  │ │
│                                             └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 개선 방향 6: 대시보드 커스터마이징

### 7.1 현재 vs 목표

| 항목 | 현재 | 목표 |
|------|------|------|
| 레이아웃 | 고정 | 사용자별 위젯 배치 |
| 지표 | 고정 | 관심 지표 선택 |
| 기본 뷰 | 동일 | 사용자별 기본 탭 설정 |

### 7.2 커스터마이징 기능

```typescript
interface UserDashboardConfig {
  userId: string
  defaultTab: string              // 기본 탭
  favoriteMetrics: string[]       // 관심 지표 (상단 고정)
  widgetLayout: {
    widgetId: string
    position: { x: number; y: number }
    size: { width: number; height: number }
    visible: boolean
  }[]
  alertThresholds: {              // 개인 알림 임계값
    metric: string
    threshold: number
    condition: 'above' | 'below'
  }[]
}

// 저장: localStorage 또는 사용자 설정 API
```

### 7.3 위젯 목록

| 위젯 | 설명 | 기본 표시 |
|------|------|----------|
| 건강도 점수 | 4차원 건강도 요약 | ✅ |
| AI 브리핑 | 오늘의 핵심 인사이트 | ✅ |
| 긴급 알림 | Critical/Warning 인사이트 | ✅ |
| 매출 추이 | 최근 30일 매출 차트 | ✅ |
| RFM 분포 | 세그먼트별 고객 분포 | ❌ |
| 이탈 위험 | 이탈 위험 고객 수 | ❌ |
| 작가 건강도 | 티어별 작가 분포 | ❌ |
| 예측 매출 | 30일 매출 예측 | ❌ |

---

## 8. 개선 방향 7: 자연어 질의 강화

### 8.1 현재 vs 목표

| 항목 | 현재 | 목표 |
|------|------|------|
| 질의 범위 | 기본 질문 | 복잡한 비즈니스 질문 |
| 응답 형식 | 텍스트만 | 텍스트 + 차트 + 테이블 |
| 후속 질문 | 제한적 | 컨텍스트 유지 대화 |

### 8.2 지원 질의 유형

```typescript
const supportedQueryTypes = {
  // 현황 파악
  status: [
    '이번 달 매출 현황은?',
    '일본 시장 성과는 어때?',
    '가장 잘 팔리는 작가는?',
    'VIP 고객 현황 알려줘'
  ],
  
  // 비교 분석
  comparison: [
    '지난 달 대비 어떤 점이 달라졌어?',
    '작년 같은 기간과 비교하면?',
    '일본과 미국 시장 비교해줘',
    '상위 5명 작가 성과 비교'
  ],
  
  // 원인 분석
  causation: [
    '매출이 떨어진 이유가 뭐야?',
    '왜 일본 주문이 줄었어?',
    'VIP 고객이 줄어든 원인은?',
    '이번 달 AOV가 낮은 이유는?'
  ],
  
  // 예측
  prediction: [
    '다음 달 매출 예상은?',
    '이 추세면 분기 목표 달성 가능해?',
    '이탈 위험 고객이 몇 명이야?'
  ],
  
  // 전략 제안
  strategy: [
    '매출을 올리려면 어떻게 해야 해?',
    'VIP 고객 유지 전략은?',
    '이탈 위험 고객에게 어떤 조치를 해야 해?'
  ]
}
```

### 8.3 응답 형식 개선

```typescript
interface EnhancedChatResponse {
  text: string                    // 텍스트 응답
  visualizations?: {
    type: 'chart' | 'table' | 'metric'
    data: any
    title: string
  }[]
  relatedInsights?: Insight[]     // 관련 인사이트
  suggestedQuestions?: string[]   // 후속 질문 제안
  actions?: InsightAction[]       // 관련 액션
}

// 예시 응답
const exampleResponse: EnhancedChatResponse = {
  text: '이번 달 매출은 $125,000으로 전월 대비 12% 증가했습니다. 특히 일본 시장이 25% 성장하며 전체 성장을 견인했습니다.',
  visualizations: [
    {
      type: 'chart',
      title: '월별 매출 추이',
      data: { /* 차트 데이터 */ }
    }
  ],
  suggestedQuestions: [
    '일본 시장 성장 원인은?',
    '다른 국가 성과는 어때?',
    '다음 달 예상 매출은?'
  ],
  actions: [
    { label: '상세 분석 보기', href: '/business-brain?tab=trends' }
  ]
}
```

---

## 9. 구현 로드맵

### Phase 1: 핵심 기능 강화 (2주)

| 주차 | 작업 | 우선순위 | 예상 공수 |
|------|------|---------|----------|
| 1주 | 인사이트 → 액션 버튼 연결 | P0 | 3일 |
| 1주 | 다운로드 기능 (CSV/Excel) | P0 | 2일 |
| 2주 | 고객 이탈 예측 모델 구현 | P1 | 3일 |
| 2주 | 이탈 위험 고객 대시보드 | P1 | 2일 |

**Phase 1 산출물**:
- 인사이트에서 관련 페이지로 원클릭 이동
- 분석 결과 CSV/Excel 다운로드
- 고객 이탈 확률 예측 및 위험 고객 목록

### Phase 2: 분석 깊이 강화 (2주)

| 주차 | 작업 | 우선순위 | 예상 공수 |
|------|------|---------|----------|
| 3주 | 작가 건강도 점수 계산 로직 | P1 | 3일 |
| 3주 | 작가 건강도 대시보드 | P1 | 2일 |
| 4주 | What-if 시뮬레이션 엔진 | P2 | 3일 |
| 4주 | 시뮬레이션 UI | P2 | 2일 |

**Phase 2 산출물**:
- 작가별 4차원 건강도 점수
- 가상 시나리오 시뮬레이션 기능

### Phase 3: UX 개선 (2주)

| 주차 | 작업 | 우선순위 | 예상 공수 |
|------|------|---------|----------|
| 5주 | 자연어 질의 강화 | P1 | 3일 |
| 5주 | 응답 시각화 (차트/테이블) | P1 | 2일 |
| 6주 | 대시보드 커스터마이징 | P2 | 3일 |
| 6주 | PDF 리포트 생성 | P2 | 2일 |

**Phase 3 산출물**:
- 복잡한 비즈니스 질문 처리
- 사용자별 대시보드 설정
- PDF 리포트 다운로드

---

## 10. 기술 요구사항

### 10.1 백엔드 변경사항

```typescript
// 신규 API 엔드포인트
const newEndpoints = {
  // 고객 이탈 예측
  'GET /api/business-brain/churn-prediction': '이탈 예측 목록',
  'GET /api/business-brain/churn-prediction/:userId': '개별 고객 이탈 상세',
  
  // 작가 건강도
  'GET /api/business-brain/artist-health': '작가 건강도 목록',
  'GET /api/business-brain/artist-health/:artistId': '개별 작가 건강도 상세',
  
  // What-if 시뮬레이션
  'POST /api/business-brain/simulate': '시뮬레이션 실행',
  
  // 다운로드
  'GET /api/business-brain/export/:type': '데이터 내보내기',
  
  // 사용자 설정
  'GET /api/business-brain/user-config': '사용자 설정 조회',
  'PUT /api/business-brain/user-config': '사용자 설정 저장'
}
```

### 10.2 프론트엔드 신규 컴포넌트

```
frontend/app/business-brain/
├── components/
│   ├── ChurnPredictionPanel.tsx    # 이탈 예측 패널
│   ├── ArtistHealthPanel.tsx       # 작가 건강도 패널
│   ├── WhatIfSimulator.tsx         # What-if 시뮬레이터
│   ├── ExportButton.tsx            # 다운로드 버튼
│   ├── ActionButton.tsx            # 인사이트 액션 버튼
│   ├── DashboardCustomizer.tsx     # 대시보드 설정
│   └── EnhancedChatResponse.tsx    # 강화된 채팅 응답
```

### 10.3 데이터 저장

```typescript
// 사용자 설정 저장 (localStorage)
interface LocalStorageKeys {
  'bb-user-config': UserDashboardConfig
  'bb-recent-queries': string[]
  'bb-saved-simulations': WhatIfScenario[]
}
```

---

## 11. 예상 효과

### 11.1 정량적 효과

| 지표 | 현재 | 목표 | 개선율 |
|------|------|------|--------|
| 인사이트 활용률 | 40% | 80% | +100% |
| 의사결정 시간 | 2시간 | 30분 | -75% |
| VIP 이탈 방지율 | - | 30% | 신규 |
| 작가 이탈 조기 감지 | - | 70% | 신규 |
| 리포트 작성 시간 | 4시간 | 30분 | -87% |

### 11.2 정성적 효과

- **실무 효율성**: 인사이트 확인 → 조치까지 원클릭
- **예측 기반 관리**: 이탈 위험 고객/작가 사전 대응
- **데이터 활용**: 분석 결과 다운로드로 추가 활용 가능
- **의사결정 지원**: What-if 시뮬레이션으로 전략 검증

---

## 12. 우선순위 요약

### 12.1 즉시 구현 권장 (P0)

| 기능 | 이유 | 예상 효과 |
|------|------|----------|
| 인사이트 → 액션 연결 | 낮은 난이도, 높은 활용도 | 인사이트 활용률 +100% |
| 다운로드 기능 | 실무 필수 기능 | 리포트 작성 시간 -87% |

### 12.2 단기 구현 권장 (P1)

| 기능 | 이유 | 예상 효과 |
|------|------|----------|
| 고객 이탈 예측 | VIP 고객 유지 | 이탈 방지율 30% |
| 작가 건강도 점수 | 작가 관리 효율화 | 작가 이탈 조기 감지 70% |
| 자연어 질의 강화 | 사용 편의성 향상 | 사용 빈도 증가 |

### 12.3 중기 구현 권장 (P2)

| 기능 | 이유 | 예상 효과 |
|------|------|----------|
| What-if 시뮬레이션 | 전략적 의사결정 지원 | 의사결정 품질 향상 |
| 대시보드 커스터마이징 | 개인화 경험 | 사용 만족도 향상 |
| PDF 리포트 | 공식 리포트 필요 시 | 리포트 품질 향상 |

---

## 13. 결론

Business Brain은 **외부 연동 없이 내부 데이터와 기능만으로** 다음 영역의 개선을 통해 실무 활용도를 크게 높일 수 있습니다:

### 핵심 개선 사항

1. **인사이트 → 액션 연결**: 인사이트 확인 후 관련 페이지로 원클릭 이동
2. **고객 이탈 예측**: 내부 구매 패턴 기반 이탈 확률 예측
3. **작가 건강도 점수**: 4차원 종합 건강도로 작가 관리 효율화
4. **What-if 시뮬레이션**: 과거 데이터 기반 가상 시나리오 분석
5. **다운로드 기능**: CSV/Excel/PDF로 분석 결과 내보내기
6. **대시보드 커스터마이징**: 사용자별 관심 지표 및 레이아웃 설정
7. **자연어 질의 강화**: 복잡한 비즈니스 질문 처리 및 시각화 응답

### 기대 효과

- 인사이트 활용률 40% → 80%
- 의사결정 시간 2시간 → 30분
- VIP 이탈 방지율 30% 달성
- 리포트 작성 시간 87% 단축

단계적 구현을 통해 Business Brain을 **"보는 도구"에서 "행동하는 도구"**로 발전시킬 수 있습니다.

---

*문서 작성 완료: 2024-12-11*
