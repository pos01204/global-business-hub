# Business Brain 고급 분석 엔진 설계

## 1. 설계 철학: 인간 한계를 넘어서는 분석

### 1.1 프로그래밍이 압도적으로 우위인 영역

| 영역 | 인간의 한계 | 프로그래밍 강점 |
|------|------------|----------------|
| **조합 분석** | 3-4개 변수 동시 고려 한계 | 수십 개 변수 교차 분석 |
| **패턴 인식** | 최근 데이터 편향, 기억 한계 | 전체 기간 패턴 일관 분석 |
| **이상 탐지** | 주관적 판단, 놓침 발생 | 모든 데이터 포인트 검사 |
| **시간 분석** | 시간대별 분석 비현실적 | 분/시간/일/주/월 동시 분석 |
| **상관관계** | 직관적 관계만 인식 | 숨겨진 상관관계 발견 |
| **예측** | 경험 기반 추정 | 통계적 모델 기반 예측 |
| **일관성** | 컨디션/편향 영향 | 동일 기준 일관 적용 |

### 1.2 목표 분석 수준

```
Level 1: 단순 집계 (인간도 가능) ← 현재 대부분의 대시보드
Level 2: 비교 분석 (인간 가능하나 시간 소요)
Level 3: 다차원 교차 분석 (인간 한계 시작) ← 목표 최소 수준
Level 4: 패턴 기반 예측 (인간 불가능)
Level 5: 복합 인과관계 추론 (인간 불가능) ← 목표 최대 수준
```

---

## 2. 복합 교차 분석 (Multi-Dimensional Cross Analysis)

### 2.1 N차원 큐브 분석

사람이 수동으로 불가능한 **모든 차원 조합**에 대한 분석을 자동 수행합니다.

#### 분석 차원 정의
```typescript
const ANALYSIS_DIMENSIONS = {
  time: ['hour', 'dayOfWeek', 'week', 'month', 'quarter', 'year'],
  geography: ['country', 'region', 'timezone'],
  customer: ['segment', 'cohort', 'lifecycle', 'rfmScore'],
  artist: ['tier', 'category', 'tenure', 'productCount'],
  product: ['priceRange', 'category', 'isNew'],
  channel: ['platform', 'paymentMethod', 'pgProvider'],
  logistics: ['stage', 'carrier', 'delayStatus'],
}
```

#### 자동 생성되는 분석 조합 예시
```
총 조합 수: 7개 차원 × 평균 5개 값 = 수천 개 조합

예시 조합들:
- [월요일] × [일본] × [VIP고객] × [Star작가] → GMV, 주문수, AOV
- [주말] × [미국] × [신규고객] × [신규작가] × [iOS] → 전환율, 재구매율
- [11월] × [대만] × [AtRisk고객] × [10만원이상상품] → 이탈률, 구매주기
- [오후6-9시] × [일본] × [Loyal고객] × [카드결제] → 결제성공률
```


#### 자동 특이점 발견 알고리즘
```typescript
interface CubeAnalysisResult {
  dimension: string[]           // 분석 차원 조합
  segmentValues: string[]       // 각 차원의 값
  metrics: {
    gmv: number
    orderCount: number
    aov: number
    conversionRate?: number
  }
  benchmark: {                  // 비교 기준
    overall: number             // 전체 평균
    parentSegment: number       // 상위 세그먼트 평균
    previousPeriod: number      // 이전 기간
  }
  deviation: {
    vsOverall: number           // 전체 대비 편차 (%)
    vsParent: number            // 상위 대비 편차 (%)
    vsPrevious: number          // 이전 대비 편차 (%)
  }
  significance: number          // 통계적 유의성 (0-1)
  sampleSize: number            // 표본 크기
  isAnomaly: boolean            // 이상치 여부
  anomalyType?: 'positive' | 'negative'
}

// 특이점 발견 로직
function discoverAnomalies(cubeResults: CubeAnalysisResult[]): Anomaly[] {
  return cubeResults
    .filter(r => r.sampleSize >= MIN_SAMPLE_SIZE)  // 통계적 유의성
    .filter(r => Math.abs(r.deviation.vsOverall) > DEVIATION_THRESHOLD)
    .filter(r => r.significance > SIGNIFICANCE_THRESHOLD)
    .sort((a, b) => Math.abs(b.deviation.vsOverall) - Math.abs(a.deviation.vsOverall))
}
```

### 2.2 시간 기반 복합 분석

#### 다중 시간 윈도우 동시 분석
```typescript
interface MultiWindowAnalysis {
  metric: string
  windows: {
    realtime: { value: number; trend: 'up' | 'down' | 'stable' }  // 최근 1시간
    today: { value: number; vsYesterday: number }                  // 오늘
    thisWeek: { value: number; vsLastWeek: number; vsSameWeekLastMonth: number }
    thisMonth: { value: number; vsLastMonth: number; vsSameMonthLastYear: number }
    rolling7d: { value: number; trend: number; volatility: number }
    rolling30d: { value: number; trend: number; volatility: number }
    rolling90d: { value: number; trend: number; volatility: number }
    ytd: { value: number; vsLastYtd: number; targetAchievement: number }
  }
  
  // 윈도우 간 불일치 감지 (중요!)
  windowDiscrepancy: {
    shortVsLong: number      // 단기 vs 장기 트렌드 차이
    recentVsHistorical: number  // 최근 vs 역사적 평균 차이
    alert?: string           // "단기 급등하나 장기 하락 추세" 등
  }
}
```

#### 시간대별 마이크로 패턴 분석
```typescript
// 사람이 절대 수동으로 할 수 없는 분석
interface HourlyPatternAnalysis {
  // 시간대별 × 요일별 × 국가별 매트릭스 (24 × 7 × 5 = 840개 셀)
  matrix: Map<string, {  // key: "hour_day_country"
    avgOrders: number
    avgGmv: number
    conversionRate: number
    vsOverallAvg: number
  }>
  
  // 자동 발견된 패턴
  discoveredPatterns: {
    peakHours: { country: string; hours: number[]; multiplier: number }[]
    deadZones: { country: string; hours: number[]; reason?: string }[]
    weekendEffect: { country: string; effect: number }[]
    payDayEffect: { detected: boolean; peakDays: number[] }
  }
  
  // 최적 타이밍 추천
  recommendations: {
    bestTimeForPromotion: { country: string; dayHour: string; reason: string }[]
    avoidTimes: { country: string; dayHour: string; reason: string }[]
  }
}
```

### 2.3 고객 행동 시퀀스 분석

#### 구매 여정 패턴 마이닝
```typescript
interface CustomerJourneyAnalysis {
  // 모든 고객의 구매 시퀀스 분석
  sequences: {
    // 첫 구매 → 두 번째 구매 패턴
    firstToSecond: {
      avgDays: number
      medianDays: number
      distribution: { bucket: string; percentage: number }[]
      conversionRate: number  // 첫 구매 후 재구매 비율
      dropOffPoints: { day: number; cumulativeDropOff: number }[]
    }
    
    // 구매 간격 변화 추적
    intervalTrend: {
      customerId: string
      intervals: number[]      // [첫→둘, 둘→셋, ...]
      trend: 'accelerating' | 'decelerating' | 'stable'
      churnRisk: number        // 간격 증가 시 이탈 위험
    }[]
    
    // 작가/카테고리 이동 패턴
    artistMigration: {
      pattern: string          // "A→B→A" 등
      frequency: number
      avgValueChange: number   // 이동 시 AOV 변화
    }[]
  }
  
  // 이탈 예측 시그널
  churnSignals: {
    intervalIncrease: { threshold: number; riskMultiplier: number }
    categoryNarrowing: { threshold: number; riskMultiplier: number }
    aovDecline: { threshold: number; riskMultiplier: number }
    engagementDrop: { threshold: number; riskMultiplier: number }
  }
}
```

#### 바스켓 분석 (장바구니 연관 분석)
```typescript
interface BasketAnalysis {
  // 함께 구매되는 작가 조합
  artistAssociations: {
    artistA: string
    artistB: string
    support: number        // 동시 구매 빈도
    confidence: number     // A 구매 시 B 구매 확률
    lift: number          // 기대 대비 실제 비율
  }[]
  
  // 가격대 조합 패턴
  priceRangeCombinations: {
    ranges: string[]       // ["5만원대", "10만원대"]
    frequency: number
    avgTotalValue: number
  }[]
  
  // 크로스셀 기회
  crossSellOpportunities: {
    ifBought: string       // 이 작가/상품 구매 시
    recommend: string      // 이 작가/상품 추천
    expectedLift: number   // 예상 매출 증가
    confidence: number
  }[]
}
```


---

## 3. 인과관계 추론 분석 (Causal Inference)

### 3.1 변화 원인 자동 분해

매출이 변했을 때, **왜 변했는지**를 자동으로 분해합니다.

```typescript
interface RevenueDecomposition {
  period: { start: Date; end: Date }
  totalChange: number           // 총 변화량
  totalChangePercent: number    // 총 변화율
  
  // 변화 원인 분해 (합계 = totalChange)
  decomposition: {
    // 1차 분해: 주문수 vs AOV
    orderCountEffect: number    // 주문수 변화로 인한 매출 변화
    aovEffect: number           // AOV 변화로 인한 매출 변화
    mixEffect: number           // 교차 효과
    
    // 2차 분해: 세그먼트별
    bySegment: {
      segment: string           // 국가, 고객세그먼트, 작가 등
      contribution: number      // 이 세그먼트의 기여분
      contributionPercent: number
      driver: 'volume' | 'value' | 'mix'  // 주요 원인
    }[]
    
    // 3차 분해: 신규 vs 기존
    newVsExisting: {
      newCustomerContribution: number
      existingCustomerContribution: number
      reactivatedContribution: number
    }
    
    // 4차 분해: 상위 기여자
    topContributors: {
      type: 'artist' | 'product' | 'customer' | 'country'
      name: string
      contribution: number
      isNew: boolean            // 신규 등장 여부
    }[]
    
    // 5차 분해: 이상치 영향
    outlierImpact: {
      hasOutliers: boolean
      outlierContribution: number
      withoutOutliers: number   // 이상치 제외 시 변화량
    }
  }
  
  // 자연어 설명 생성
  explanation: string
  // 예: "매출 15% 증가의 주요 원인: 일본 시장 신규 고객 유입(+8%), 
  //      작가 A의 신상품 출시(+5%), AOV 상승(+2%)"
}
```

### 3.2 What-If 시뮬레이션

```typescript
interface WhatIfSimulation {
  // 시나리오 정의
  scenario: {
    variable: string          // 변경할 변수
    currentValue: number
    newValue: number
    changePercent: number
  }
  
  // 영향 전파 분석
  impactPropagation: {
    directImpact: {
      metric: string
      currentValue: number
      projectedValue: number
      change: number
    }[]
    
    indirectImpact: {
      metric: string
      pathway: string[]       // 영향 경로
      estimatedChange: number
      confidence: number
    }[]
  }
  
  // 시나리오 예시들
  scenarios: {
    // "만약 일본 매출이 20% 감소하면?"
    japanDecline20: {
      totalGmvImpact: number
      affectedArtists: number
      requiredCompensation: { country: string; growth: number }[]
    }
    
    // "만약 Top 3 작가가 이탈하면?"
    top3ArtistChurn: {
      revenueAtRisk: number
      affectedCustomers: number
      recoveryTime: number    // 예상 회복 기간
    }
    
    // "만약 배송 시간이 2일 단축되면?"
    fasterDelivery: {
      expectedReviewImprovement: number
      expectedRepurchaseIncrease: number
      estimatedRevenueGain: number
    }
  }
}
```

### 3.3 선행 지표 자동 발견

```typescript
interface LeadingIndicatorDiscovery {
  // 모든 지표 쌍에 대해 시차 상관관계 분석
  correlationMatrix: {
    leadingMetric: string
    laggingMetric: string
    optimalLag: number        // 최적 시차 (일)
    correlation: number       // 상관계수
    pValue: number           // 통계적 유의성
    predictivePower: number  // 예측력 (R²)
  }[]
  
  // 발견된 선행 지표
  discoveredIndicators: {
    // 예: "신규 가입자 수는 7일 후 매출의 선행 지표"
    indicator: string
    predicts: string
    lagDays: number
    reliability: number
    
    // 현재 상태 기반 예측
    currentSignal: {
      indicatorValue: number
      indicatorTrend: 'up' | 'down' | 'stable'
      predictedOutcome: number
      predictionDate: Date
    }
  }[]
  
  // 복합 선행 지표 (여러 지표 조합)
  compositeIndicators: {
    name: string
    components: { metric: string; weight: number }[]
    predictivePower: number
    currentValue: number
    signal: 'bullish' | 'bearish' | 'neutral'
  }[]
}
```

---

## 4. 이상 탐지 고도화 (Advanced Anomaly Detection)

### 4.1 다층 이상 탐지 시스템

```typescript
interface MultiLayerAnomalyDetection {
  // Layer 1: 통계적 이상 (Z-Score, IQR)
  statisticalAnomalies: {
    metric: string
    value: number
    zScore: number
    iqrPosition: 'normal' | 'mild_outlier' | 'extreme_outlier'
    percentile: number
  }[]
  
  // Layer 2: 패턴 이상 (예상 패턴 대비)
  patternAnomalies: {
    metric: string
    expectedValue: number     // 패턴 기반 예상값
    actualValue: number
    deviation: number
    patternType: 'seasonal' | 'trend' | 'cyclical' | 'dayOfWeek'
  }[]
  
  // Layer 3: 맥락적 이상 (조건부 이상)
  contextualAnomalies: {
    metric: string
    value: number
    context: Record<string, string>  // { country: 'JP', dayOfWeek: 'Monday' }
    expectedInContext: number
    isAnomalousInContext: boolean
  }[]
  
  // Layer 4: 집단 이상 (개별은 정상이나 집단으로 이상)
  collectiveAnomalies: {
    description: string
    affectedMetrics: string[]
    pattern: string           // "동시 하락", "순차적 하락" 등
    startDate: Date
    severity: number
  }[]
  
  // Layer 5: 구조적 변화 감지 (Change Point Detection)
  structuralChanges: {
    metric: string
    changePoint: Date
    beforeMean: number
    afterMean: number
    changeSignificance: number
    possibleCauses: string[]
  }[]
}
```

### 4.2 예측 기반 이상 탐지

```typescript
interface PredictiveAnomalyDetection {
  // 각 지표에 대한 예측 모델
  predictions: {
    metric: string
    model: 'arima' | 'prophet' | 'exponentialSmoothing' | 'ensemble'
    
    // 예측값과 신뢰구간
    forecast: {
      date: Date
      predicted: number
      lowerBound: number      // 95% 신뢰구간 하한
      upperBound: number      // 95% 신뢰구간 상한
    }[]
    
    // 실제값이 신뢰구간 이탈 시 이상
    anomalies: {
      date: Date
      actual: number
      predicted: number
      deviationFromBound: number
      severity: 'warning' | 'critical'
    }[]
  }[]
  
  // 다변량 이상 탐지 (여러 지표 동시 고려)
  multivariateAnomalies: {
    timestamp: Date
    anomalyScore: number      // Isolation Forest, LOF 등
    contributingFactors: { metric: string; contribution: number }[]
  }[]
}
```


---

## 5. 네트워크 분석 (Network Analysis)

### 5.1 고객-작가 네트워크

```typescript
interface CustomerArtistNetwork {
  // 이분 그래프 (Bipartite Graph) 분석
  graph: {
    customers: { id: string; totalPurchases: number; uniqueArtists: number }[]
    artists: { id: string; totalSales: number; uniqueCustomers: number }[]
    edges: { customerId: string; artistId: string; weight: number }[]  // weight = 구매액
  }
  
  // 네트워크 지표
  metrics: {
    // 작가 중심성 (어떤 작가가 네트워크의 허브인가)
    artistCentrality: {
      artistId: string
      degreeCentrality: number      // 연결된 고객 수
      betweennessCentrality: number // 다리 역할 정도
      pageRank: number              // 중요도
    }[]
    
    // 고객 클러스터링 (비슷한 취향의 고객 그룹)
    customerClusters: {
      clusterId: number
      customers: string[]
      sharedArtists: string[]       // 공통 구매 작가
      avgClv: number
      characteristics: string[]     // "일본 도자기 선호", "고가 작품 선호" 등
    }[]
    
    // 작가 클러스터링 (비슷한 고객층을 가진 작가)
    artistClusters: {
      clusterId: number
      artists: string[]
      sharedCustomerProfile: string
      crossSellPotential: number
    }[]
  }
  
  // 네트워크 기반 추천
  recommendations: {
    // 협업 필터링 기반
    forCustomer: {
      customerId: string
      recommendedArtists: { artistId: string; score: number; reason: string }[]
    }[]
    
    // 작가 간 시너지
    artistSynergies: {
      artistA: string
      artistB: string
      synergyScore: number
      sharedCustomerPotential: number
    }[]
  }
  
  // 네트워크 건강도
  networkHealth: {
    density: number                 // 네트워크 밀도
    avgPathLength: number           // 평균 경로 길이
    clusteringCoefficient: number   // 군집 계수
    giantComponentSize: number      // 최대 연결 요소 크기
    
    // 위험 신호
    risks: {
      isolatedCustomers: number     // 고립된 고객 (1명 작가만 구매)
      overDependentArtists: number  // 소수 고객에 의존하는 작가
      bridgeArtists: string[]       // 이탈 시 네트워크 분리되는 작가
    }
  }
}
```

### 5.2 시간에 따른 네트워크 진화

```typescript
interface NetworkEvolution {
  // 월별 네트워크 스냅샷
  snapshots: {
    month: string
    nodeCount: { customers: number; artists: number }
    edgeCount: number
    avgDegree: number
    newNodes: { customers: number; artists: number }
    lostNodes: { customers: number; artists: number }
  }[]
  
  // 진화 패턴
  evolutionPatterns: {
    // 성장 패턴
    growthType: 'organic' | 'viral' | 'stagnant' | 'declining'
    
    // 새 연결 패턴
    newEdgePattern: {
      preferentialAttachment: number  // 인기 작가에 집중되는 정도
      randomness: number              // 무작위성
    }
    
    // 이탈 패턴
    churnPattern: {
      peripheralFirst: boolean        // 주변부부터 이탈하는지
      suddenDisconnection: boolean    // 갑작스러운 단절이 있는지
    }
  }
  
  // 예측
  predictions: {
    nextMonthNodes: { customers: number; artists: number }
    expectedChurn: { customers: number; artists: number }
    networkStability: number
  }
}
```

---

## 6. 생존 분석 (Survival Analysis)

### 6.1 고객 생존 분석

```typescript
interface CustomerSurvivalAnalysis {
  // Kaplan-Meier 생존 곡선
  survivalCurve: {
    daysSinceFirstPurchase: number
    survivalProbability: number     // 아직 활성 상태일 확률
    atRisk: number                  // 해당 시점 관찰 대상 수
    events: number                  // 해당 시점 이탈 수
  }[]
  
  // 중앙 생존 시간
  medianSurvivalTime: number        // 50%가 이탈하는 시점
  
  // 세그먼트별 생존 곡선 비교
  segmentComparison: {
    segment: string
    medianSurvival: number
    survivalAt90Days: number
    survivalAt180Days: number
    survivalAt365Days: number
    vsOverall: 'better' | 'worse' | 'similar'
  }[]
  
  // Cox 비례 위험 모델 (이탈 위험 요인)
  hazardFactors: {
    factor: string
    hazardRatio: number           // >1이면 이탈 위험 증가
    pValue: number
    interpretation: string
    // 예: { factor: 'firstOrderAOV < 50000', hazardRatio: 1.8, 
    //       interpretation: '첫 주문 5만원 미만 시 이탈 위험 80% 증가' }
  }[]
  
  // 개별 고객 이탈 확률
  individualRisk: {
    customerId: string
    currentSurvivalProb: number
    predictedChurnDate: Date
    riskFactors: string[]
    interventionUrgency: 'high' | 'medium' | 'low'
  }[]
}
```

### 6.2 작가 생존 분석

```typescript
interface ArtistSurvivalAnalysis {
  // 작가 활동 지속 분석
  survivalCurve: {
    monthsSinceRegistration: number
    survivalProbability: number
    stillActive: number
    churned: number
  }[]
  
  // 이탈 위험 요인
  churnFactors: {
    factor: string
    hazardRatio: number
    examples: string[]
    // 예: { factor: '첫 3개월 매출 0', hazardRatio: 5.2 }
    // 예: { factor: '월 매출 50% 이상 감소', hazardRatio: 2.3 }
  }[]
  
  // 작가 생애 가치 예측
  artistLifetimeValue: {
    artistId: string
    expectedActiveMonths: number
    expectedTotalRevenue: number
    currentStage: 'growth' | 'mature' | 'decline'
    interventionRecommendation?: string
  }[]
}
```

---

## 7. 시계열 고급 분석 (Advanced Time Series)

### 7.1 시계열 분해 및 예측

```typescript
interface TimeSeriesDecomposition {
  metric: string
  
  // STL 분해 (Seasonal-Trend-Loess)
  decomposition: {
    date: Date
    observed: number
    trend: number
    seasonal: number
    residual: number
  }[]
  
  // 다중 계절성 분해
  multipleSeasonality: {
    daily: number[]           // 시간대별 패턴 (24개)
    weekly: number[]          // 요일별 패턴 (7개)
    monthly: number[]         // 월내 패턴 (약 30개)
    yearly: number[]          // 월별 패턴 (12개)
  }
  
  // 추세 분석
  trendAnalysis: {
    direction: 'up' | 'down' | 'stable'
    slope: number             // 일당 변화량
    acceleration: number      // 추세 가속도
    changePoints: Date[]      // 추세 전환점
  }
  
  // 예측
  forecast: {
    model: string
    predictions: {
      date: Date
      point: number
      lower80: number
      upper80: number
      lower95: number
      upper95: number
    }[]
    accuracy: {
      mape: number            // Mean Absolute Percentage Error
      rmse: number            // Root Mean Square Error
      mase: number            // Mean Absolute Scaled Error
    }
  }
}
```

### 7.2 이벤트 영향 분석

```typescript
interface EventImpactAnalysis {
  // 이벤트 정의
  events: {
    id: string
    name: string
    type: 'promotion' | 'holiday' | 'external' | 'internal'
    startDate: Date
    endDate: Date
    affectedMetrics: string[]
  }[]
  
  // 이벤트별 영향 측정
  impacts: {
    eventId: string
    metric: string
    
    // Causal Impact 분석 (베이지안 구조적 시계열)
    causalImpact: {
      actualDuringEvent: number
      predictedWithoutEvent: number
      absoluteEffect: number
      relativeEffect: number      // %
      probability: number         // 효과가 실제일 확률
      
      // 신뢰구간
      effectLower: number
      effectUpper: number
    }
    
    // 사전/사후 비교
    prePostComparison: {
      prePeriodAvg: number
      duringPeriodAvg: number
      postPeriodAvg: number
      sustainedEffect: number     // 이벤트 후에도 지속되는 효과
    }
  }[]
  
  // 이벤트 효과 순위
  eventRanking: {
    eventId: string
    totalImpact: number
    roi?: number                  // 투자 대비 효과 (프로모션의 경우)
    recommendation: string
  }[]
}
```


---

## 8. 자동 인사이트 생성 엔진

### 8.1 인사이트 우선순위 스코어링

```typescript
interface InsightScoring {
  insight: Insight
  
  // 다차원 스코어링
  scores: {
    // 1. 통계적 유의성 (0-100)
    statisticalSignificance: number
    factors: {
      sampleSize: number
      pValue: number
      effectSize: number
    }
    
    // 2. 비즈니스 영향도 (0-100)
    businessImpact: number
    factors: {
      revenueImpact: number       // 예상 매출 영향
      customerImpact: number      // 영향받는 고객 수
      strategicRelevance: number  // 전략적 중요도
    }
    
    // 3. 실행 가능성 (0-100)
    actionability: number
    factors: {
      hasCleanAction: boolean     // 명확한 액션이 있는지
      resourceRequired: 'low' | 'medium' | 'high'
      timeToImpact: number        // 효과까지 예상 시간
    }
    
    // 4. 긴급성 (0-100)
    urgency: number
    factors: {
      trendDirection: 'worsening' | 'stable' | 'improving'
      timeToThreshold: number     // 임계점까지 예상 시간
      reversibility: boolean      // 되돌릴 수 있는지
    }
    
    // 5. 신뢰도 (0-100)
    confidence: number
    factors: {
      dataQuality: number
      modelAccuracy: number
      historicalAccuracy: number  // 과거 유사 인사이트 정확도
    }
  }
  
  // 종합 점수 (가중 평균)
  totalScore: number
  weights: {
    statisticalSignificance: 0.15
    businessImpact: 0.35
    actionability: 0.20
    urgency: 0.20
    confidence: 0.10
  }
  
  // 노출 결정
  shouldDisplay: boolean
  displayPriority: number
  displayLocation: 'alert' | 'dashboard' | 'report' | 'archive'
}
```

### 8.2 자연어 인사이트 생성

```typescript
interface NaturalLanguageInsight {
  // 구조화된 발견
  finding: {
    metric: string
    dimension: string[]
    observation: string
    magnitude: number
    direction: 'increase' | 'decrease' | 'change'
    comparison: string
  }
  
  // 자연어 템플릿
  templates: {
    headline: string
    // "일본 VIP 고객의 재구매율이 전월 대비 23% 하락했습니다"
    
    context: string
    // "이는 지난 6개월 중 가장 큰 하락폭이며, 전체 재구매율 하락의 45%를 차지합니다"
    
    cause: string
    // "주요 원인으로 배송 지연 증가(+3일)와 Top 3 작가의 신상품 부재가 분석됩니다"
    
    impact: string
    // "현 추세 지속 시 월 매출 약 1,200만원 감소가 예상됩니다"
    
    recommendation: string
    // "VIP 대상 특별 프로모션과 배송 프로세스 점검을 권장합니다"
    
    confidence: string
    // "이 분석은 95% 신뢰수준에서 유의미하며, 과거 유사 패턴의 예측 정확도는 82%입니다"
  }
  
  // 최종 생성 텍스트
  generatedText: {
    short: string       // 1줄 요약
    medium: string      // 3-4줄 요약
    detailed: string    // 전체 설명
  }
  
  // 시각화 추천
  recommendedVisualization: {
    chartType: 'line' | 'bar' | 'scatter' | 'heatmap' | 'funnel'
    config: Record<string, any>
  }
}
```

### 8.3 인사이트 연결 및 스토리텔링

```typescript
interface InsightStoryline {
  // 관련 인사이트 클러스터링
  relatedInsights: {
    primary: Insight
    related: {
      insight: Insight
      relationship: 'cause' | 'effect' | 'correlated' | 'contradicting'
      strength: number
    }[]
  }
  
  // 스토리라인 생성
  storyline: {
    title: string
    // "일본 시장 성장 둔화의 복합적 원인 분석"
    
    chapters: {
      order: number
      title: string
      insights: Insight[]
      narrative: string
      transition: string  // 다음 챕터로의 연결
    }[]
    
    conclusion: string
    keyTakeaways: string[]
    recommendedActions: {
      action: string
      priority: number
      expectedImpact: string
    }[]
  }
  
  // 경영진 브리핑 버전
  executiveSummary: {
    oneLineHeadline: string
    threePointSummary: string[]
    bottomLine: string
    decisionRequired: boolean
    deadline?: Date
  }
}
```

---

## 9. 실시간 모니터링 및 알림

### 9.1 적응형 임계값 시스템

```typescript
interface AdaptiveThresholds {
  metric: string
  
  // 정적 임계값 (기본)
  staticThresholds: {
    critical: number
    warning: number
    info: number
  }
  
  // 동적 임계값 (학습 기반)
  dynamicThresholds: {
    // 최근 데이터 기반 자동 조정
    currentCritical: number
    currentWarning: number
    
    // 조정 요인
    adjustmentFactors: {
      recentVolatility: number    // 최근 변동성
      seasonalFactor: number      // 계절 조정
      trendFactor: number         // 추세 조정
      dayOfWeekFactor: number     // 요일 조정
    }
    
    // 학습 이력
    thresholdHistory: {
      date: Date
      threshold: number
      reason: string
    }[]
  }
  
  // 컨텍스트별 임계값
  contextualThresholds: {
    context: Record<string, string>  // { country: 'JP', dayOfWeek: 'Monday' }
    thresholds: {
      critical: number
      warning: number
    }
  }[]
}
```

### 9.2 알림 피로 방지 시스템

```typescript
interface AlertFatiguePreventionSystem {
  // 알림 집계
  aggregation: {
    // 유사 알림 그룹핑
    groupSimilarAlerts: boolean
    similarityThreshold: number
    
    // 시간 기반 집계
    aggregationWindow: number     // 분 단위
    maxAlertsPerWindow: number
  }
  
  // 알림 억제
  suppression: {
    // 중복 억제
    duplicateSuppression: {
      enabled: boolean
      cooldownPeriod: number      // 동일 알림 재발송 금지 기간
    }
    
    // 하위 알림 억제
    hierarchicalSuppression: {
      enabled: boolean
      // Critical 발생 시 관련 Warning 억제
    }
    
    // 해결 중 억제
    inProgressSuppression: {
      enabled: boolean
      // 이미 대응 중인 이슈 관련 알림 억제
    }
  }
  
  // 알림 에스컬레이션
  escalation: {
    rules: {
      condition: string           // "3회 연속 무응답"
      action: string              // "상위 관리자에게 에스컬레이션"
      delay: number               // 에스컬레이션 전 대기 시간
    }[]
  }
  
  // 알림 효과 추적
  alertEffectiveness: {
    alertId: string
    sentAt: Date
    acknowledgedAt?: Date
    resolvedAt?: Date
    wasActionable: boolean
    feedback?: 'useful' | 'noise' | 'missed'
  }[]
  
  // 알림 품질 메트릭
  qualityMetrics: {
    precision: number             // 실제 문제인 알림 비율
    recall: number                // 감지된 문제 비율
    meanTimeToAcknowledge: number
    falsePositiveRate: number
  }
}
```


---

## 10. 구현 아키텍처

### 10.1 분석 파이프라인

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Data Ingestion Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Google      │  │ External    │  │ Real-time   │  │ Historical  │    │
│  │ Sheets      │  │ APIs        │  │ Events      │  │ Snapshots   │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         └────────────────┴────────────────┴────────────────┘           │
│                                    │                                    │
│                                    ▼                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                         Data Processing Layer                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Feature Engineering                           │   │
│  │  • 시계열 특성 추출 (lag, rolling, diff)                        │   │
│  │  • 고객/작가 특성 계산 (RFM, CLV, 세그먼트)                     │   │
│  │  • 네트워크 특성 계산 (중심성, 클러스터)                        │   │
│  │  • 교차 특성 생성 (차원 조합)                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                         Analysis Engine Layer                           │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐               │
│  │ Statistical   │  │ ML-based      │  │ Rule-based    │               │
│  │ Analysis      │  │ Analysis      │  │ Analysis      │               │
│  │               │  │               │  │               │               │
│  │ • 분포 분석   │  │ • 이상 탐지   │  │ • 임계값 체크 │               │
│  │ • 상관 분석   │  │ • 클러스터링  │  │ • 패턴 매칭   │               │
│  │ • 가설 검정   │  │ • 예측 모델   │  │ • 비즈니스    │               │
│  │ • 시계열 분해 │  │ • 생존 분석   │  │   규칙 적용   │               │
│  └───────────────┘  └───────────────┘  └───────────────┘               │
│                                    │                                    │
│                                    ▼                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                         Insight Generation Layer                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Insight Synthesizer                           │   │
│  │  • 분석 결과 통합                                               │   │
│  │  • 인사이트 스코어링                                            │   │
│  │  • 자연어 생성 (LLM)                                            │   │
│  │  • 스토리라인 구성                                              │   │
│  │  • 시각화 추천                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                         Delivery Layer                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐               │
│  │ Dashboard     │  │ Alert         │  │ Report        │               │
│  │ Widget        │  │ System        │  │ Generator     │               │
│  └───────────────┘  └───────────────┘  └───────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 분석 모듈 구조

```typescript
// 분석 모듈 인터페이스
interface AnalysisModule {
  id: string
  name: string
  category: AnalysisCategory
  
  // 실행 설정
  schedule: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly'
  dependencies: string[]          // 선행 모듈
  
  // 입력/출력
  requiredData: DataRequirement[]
  outputSchema: OutputSchema
  
  // 실행
  execute(input: AnalysisInput): Promise<AnalysisOutput>
  
  // 인사이트 생성
  generateInsights(output: AnalysisOutput): Insight[]
}

// 분석 카테고리
type AnalysisCategory = 
  | 'descriptive'      // 기술 통계
  | 'diagnostic'       // 원인 분석
  | 'predictive'       // 예측 분석
  | 'prescriptive'     // 처방 분석

// 분석 모듈 레지스트리
const ANALYSIS_MODULES: AnalysisModule[] = [
  // 기술 통계
  { id: 'cube_analysis', category: 'descriptive', schedule: 'daily', ... },
  { id: 'time_pattern', category: 'descriptive', schedule: 'daily', ... },
  { id: 'distribution', category: 'descriptive', schedule: 'daily', ... },
  
  // 원인 분석
  { id: 'revenue_decomposition', category: 'diagnostic', schedule: 'daily', ... },
  { id: 'correlation_discovery', category: 'diagnostic', schedule: 'weekly', ... },
  { id: 'anomaly_attribution', category: 'diagnostic', schedule: 'realtime', ... },
  
  // 예측 분석
  { id: 'forecast', category: 'predictive', schedule: 'daily', ... },
  { id: 'churn_prediction', category: 'predictive', schedule: 'weekly', ... },
  { id: 'survival_analysis', category: 'predictive', schedule: 'weekly', ... },
  
  // 처방 분석
  { id: 'recommendation', category: 'prescriptive', schedule: 'daily', ... },
  { id: 'optimization', category: 'prescriptive', schedule: 'weekly', ... },
  { id: 'simulation', category: 'prescriptive', schedule: 'ondemand', ... },
]
```

### 10.3 성능 최적화

```typescript
interface PerformanceOptimization {
  // 캐싱 전략
  caching: {
    // 계산 결과 캐싱
    computationCache: {
      ttl: number                 // Time to live
      invalidationRules: string[] // 무효화 조건
    }
    
    // 중간 결과 캐싱
    intermediateCache: {
      enabled: boolean
      maxSize: number
    }
    
    // 집계 결과 사전 계산
    precomputation: {
      dimensions: string[][]      // 사전 계산할 차원 조합
      schedule: string            // 계산 스케줄
    }
  }
  
  // 증분 처리
  incrementalProcessing: {
    enabled: boolean
    // 전체 재계산 대신 변경분만 처리
    changeDetection: 'timestamp' | 'hash' | 'diff'
  }
  
  // 병렬 처리
  parallelization: {
    maxWorkers: number
    chunkSize: number
    // 독립적인 분석은 병렬 실행
  }
  
  // 샘플링
  sampling: {
    enabled: boolean
    threshold: number             // 이 이상이면 샘플링
    sampleSize: number
    method: 'random' | 'stratified' | 'systematic'
  }
}
```

---

## 11. 구현 우선순위 (수정)

### Phase 1: 핵심 고급 분석 (Week 1-2)
| 우선순위 | 모듈 | 인간 대비 우위 |
|---------|------|---------------|
| P0 | N차원 큐브 분석 | 수천 개 조합 동시 분석 |
| P0 | 다층 이상 탐지 | 모든 데이터 포인트 검사 |
| P0 | 매출 변화 분해 | 자동 원인 분석 |
| P1 | 시간 패턴 분석 | 840개 시간×요일×국가 셀 |
| P1 | 선행 지표 발견 | 숨겨진 상관관계 발견 |

### Phase 2: 예측 및 네트워크 (Week 3-4)
| 우선순위 | 모듈 | 인간 대비 우위 |
|---------|------|---------------|
| P1 | 고객 생존 분석 | 개별 이탈 확률 계산 |
| P1 | 시계열 예측 | 통계적 예측 모델 |
| P2 | 고객-작가 네트워크 | 복잡한 관계 시각화 |
| P2 | 구매 시퀀스 분석 | 전체 고객 여정 패턴 |

### Phase 3: 인사이트 자동화 (Week 5-6)
| 우선순위 | 모듈 | 인간 대비 우위 |
|---------|------|---------------|
| P1 | 인사이트 스코어링 | 객관적 우선순위 |
| P1 | 자연어 생성 | 일관된 보고서 |
| P2 | 스토리라인 생성 | 인사이트 연결 |
| P2 | 적응형 임계값 | 자동 학습 |

---

## 12. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2024-12-04 | 고급 분석 엔진 설계 초안 |
