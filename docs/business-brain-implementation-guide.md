# Business Brain 구현 가이드

## 1. 현재 시스템 분석

### 1.1 기술 스택 호환성

| 구성요소 | 현재 시스템 | Business Brain 요구사항 | 호환성 |
|---------|------------|----------------------|--------|
| Backend | Express.js + TypeScript | 동일 | ✅ 완전 호환 |
| Data Source | Google Sheets API | 동일 | ✅ 완전 호환 |
| AI/LLM | OpenAI API | 동일 | ✅ 완전 호환 |
| Caching | DataCacheService (메모리) | 동일 + 확장 | ✅ 호환 |
| Frontend | Next.js + React | 동일 | ✅ 완전 호환 |

### 1.2 재사용 가능한 기존 코드

#### BaseAgent 클래스 (100% 재사용)
```typescript
// 이미 구현된 기능
- getData(): 시트 데이터 조회 + 캐싱
- filterData(): 다중 조건 필터링
- aggregateData(): 그룹별 집계 (sum, avg, count, max, min)
- visualizeData(): 차트 데이터 생성
- applyFilters(): 고급 필터 연산자 (between, starts_with 등)
```

#### CorrelationAnalyzer (80% 재사용)
```typescript
// 이미 구현된 기능
- pearsonCorrelation(): 피어슨 상관계수
- detectAnomalies(): Z-Score 기반 이상치 탐지
- analyzeTrends(): 선형 회귀 기반 트렌드
- linearRegression(): 회귀 분석
- calculateVolatility(): 변동성 계산
- generateInsights(): 인사이트 자동 생성
```

#### 기존 API 패턴 (100% 재사용)
```typescript
// dashboard.ts 패턴
- 날짜 범위 필터링
- 이전 기간 비교 (WoW, MoM)
- KPI 계산 로직
- 이동평균 계산
- 트렌드 차트 데이터 생성
```

### 1.3 신규 구현 필요 항목

| 기능 | 복잡도 | 예상 공수 | 의존성 |
|------|--------|----------|--------|
| N차원 큐브 분석 | 중 | 2일 | BaseAgent |
| 매출 변화 분해 | 중 | 2일 | aggregateData |
| 고객 생존 분석 | 상 | 3일 | 신규 |
| 네트워크 분석 | 상 | 3일 | 신규 |
| 인사이트 스코어링 | 중 | 2일 | CorrelationAnalyzer |
| 적응형 임계값 | 중 | 2일 | 신규 |
| 자연어 생성 | 하 | 1일 | OpenAI API |


---

## 2. 구현 아키텍처

### 2.1 파일 구조

```
backend/src/
├── services/
│   ├── agents/
│   │   ├── BaseAgent.ts              # 기존 (재사용)
│   │   ├── BusinessBrainAgent.ts     # 🆕 메인 에이전트
│   │   ├── CorrelationAnalyzer.ts    # 기존 (확장)
│   │   └── ...
│   │
│   └── analytics/                     # 🆕 분석 엔진
│       ├── CubeAnalyzer.ts           # N차원 큐브 분석
│       ├── DecompositionEngine.ts    # 변화 원인 분해
│       ├── SurvivalAnalyzer.ts       # 생존 분석
│       ├── NetworkAnalyzer.ts        # 네트워크 분석
│       ├── ForecastEngine.ts         # 예측 엔진
│       ├── InsightScorer.ts          # 인사이트 스코어링
│       ├── ThresholdManager.ts       # 적응형 임계값
│       └── NarrativeGenerator.ts     # 자연어 생성
│
├── routes/
│   └── business-brain.ts             # 🆕 API 라우트
│
└── config/
    └── businessBrainConfig.ts        # 🆕 설정

frontend/
├── app/
│   └── business-brain/               # 🆕 상세 페이지
│       └── page.tsx
│
└── components/
    └── business-brain/               # 🆕 컴포넌트
        ├── BrainWidget.tsx           # 대시보드 위젯
        ├── HealthScoreCard.tsx       # 건강도 점수
        ├── InsightCard.tsx           # 인사이트 카드
        └── ExecutiveBriefing.tsx     # 경영 브리핑
```

### 2.2 클래스 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                      BusinessBrainAgent                         │
│  extends BaseAgent                                              │
├─────────────────────────────────────────────────────────────────┤
│  - cubeAnalyzer: CubeAnalyzer                                   │
│  - decompositionEngine: DecompositionEngine                     │
│  - survivalAnalyzer: SurvivalAnalyzer                          │
│  - forecastEngine: ForecastEngine                              │
│  - insightScorer: InsightScorer                                │
│  - narrativeGenerator: NarrativeGenerator                      │
├─────────────────────────────────────────────────────────────────┤
│  + generateExecutiveBriefing(): ExecutiveBriefing              │
│  + calculateHealthScore(): BusinessHealthScore                  │
│  + discoverInsights(): BusinessInsight[]                       │
│  + runAnalysisPipeline(): AnalysisResult                       │
│  + process(query): AgentResponse                               │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  CubeAnalyzer   │ │ Decomposition   │ │ SurvivalAnalyzer│
│                 │ │ Engine          │ │                 │
│ + analyze()     │ │ + decompose()   │ │ + analyze()     │
│ + findAnomalies │ │ + attribute()   │ │ + predict()     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 3. 핵심 모듈 구현 명세

### 3.1 CubeAnalyzer (N차원 큐브 분석)

```typescript
// backend/src/services/analytics/CubeAnalyzer.ts

interface CubeConfig {
  dimensions: {
    name: string
    column: string
    values?: string[]  // 지정하지 않으면 자동 추출
  }[]
  metrics: {
    name: string
    column: string
    aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min'
  }[]
  minSampleSize: number  // 최소 표본 크기 (기본: 5)
  deviationThreshold: number  // 이상 판정 임계값 (기본: 0.3 = 30%)
}

export class CubeAnalyzer {
  constructor(private config: CubeConfig) {}

  /**
   * 모든 차원 조합에 대해 분석 실행
   * 시간 복잡도: O(D^V * N) where D=차원수, V=평균값수, N=데이터수
   */
  async analyze(data: any[]): Promise<CubeAnalysisResult> {
    // 1. 차원별 고유값 추출
    const dimensionValues = this.extractDimensionValues(data)
    
    // 2. 모든 조합 생성 (Cartesian Product)
    const combinations = this.generateCombinations(dimensionValues)
    
    // 3. 각 조합별 메트릭 계산
    const cellResults = await this.calculateCells(data, combinations)
    
    // 4. 벤치마크 대비 편차 계산
    const withDeviations = this.calculateDeviations(cellResults)
    
    // 5. 이상치 필터링 및 정렬
    const anomalies = this.filterAnomalies(withDeviations)
    
    return {
      totalCombinations: combinations.length,
      analyzedCells: cellResults.length,
      anomalies,
      topPositive: anomalies.filter(a => a.deviation > 0).slice(0, 10),
      topNegative: anomalies.filter(a => a.deviation < 0).slice(0, 10),
    }
  }

  /**
   * 특정 차원 조합의 드릴다운 분석
   */
  async drillDown(
    data: any[],
    fixedDimensions: Record<string, string>,
    drillDimension: string
  ): Promise<DrillDownResult> {
    // 고정 차원으로 필터링 후 드릴 차원별 분석
  }
}
```

### 3.2 DecompositionEngine (변화 원인 분해)

```typescript
// backend/src/services/analytics/DecompositionEngine.ts

interface DecompositionConfig {
  primaryMetric: string  // 분해할 메트릭 (예: 'Total GMV')
  volumeMetric: string   // 볼륨 메트릭 (예: 'order_count')
  segments: {
    name: string
    column: string
  }[]
}

export class DecompositionEngine {
  /**
   * 매출 변화를 다단계로 분해
   * 
   * Level 1: 볼륨 효과 vs 가치 효과
   * Level 2: 세그먼트별 기여도
   * Level 3: 신규 vs 기존
   * Level 4: 상위 기여자
   * Level 5: 이상치 영향
   */
  async decompose(
    currentData: any[],
    previousData: any[],
    config: DecompositionConfig
  ): Promise<DecompositionResult> {
    const currentTotal = this.sumMetric(currentData, config.primaryMetric)
    const previousTotal = this.sumMetric(previousData, config.primaryMetric)
    const totalChange = currentTotal - previousTotal

    // Level 1: 볼륨 vs 가치 분해
    const level1 = this.decomposeVolumeValue(currentData, previousData, config)

    // Level 2: 세그먼트별 분해
    const level2 = await Promise.all(
      config.segments.map(seg => 
        this.decomposeBySegment(currentData, previousData, seg, config)
      )
    )

    // Level 3: 신규 vs 기존 (고객 기준)
    const level3 = this.decomposeNewVsExisting(currentData, previousData)

    // Level 4: 상위 기여자 식별
    const level4 = this.identifyTopContributors(currentData, previousData, config)

    // Level 5: 이상치 영향 분리
    const level5 = this.isolateOutlierImpact(currentData, previousData, config)

    // 자연어 설명 생성
    const explanation = await this.generateExplanation({
      totalChange,
      level1,
      level2,
      level3,
      level4,
      level5,
    })

    return {
      totalChange,
      totalChangePercent: previousTotal > 0 ? totalChange / previousTotal : 0,
      decomposition: { level1, level2, level3, level4, level5 },
      explanation,
    }
  }

  /**
   * 볼륨 vs 가치 분해 (Laspeyres-Paasche 분해)
   */
  private decomposeVolumeValue(
    current: any[],
    previous: any[],
    config: DecompositionConfig
  ): VolumeValueDecomposition {
    const currVolume = current.length
    const prevVolume = previous.length
    const currValue = this.sumMetric(current, config.primaryMetric) / currVolume
    const prevValue = this.sumMetric(previous, config.primaryMetric) / prevVolume

    // 볼륨 효과: (Q1 - Q0) * P0
    const volumeEffect = (currVolume - prevVolume) * prevValue

    // 가치 효과: (P1 - P0) * Q0
    const valueEffect = (currValue - prevValue) * prevVolume

    // 혼합 효과: (Q1 - Q0) * (P1 - P0)
    const mixEffect = (currVolume - prevVolume) * (currValue - prevValue)

    return { volumeEffect, valueEffect, mixEffect }
  }
}
```

### 3.3 SurvivalAnalyzer (생존 분석)

```typescript
// backend/src/services/analytics/SurvivalAnalyzer.ts

export class SurvivalAnalyzer {
  /**
   * Kaplan-Meier 생존 곡선 계산
   */
  calculateSurvivalCurve(
    subjects: Array<{
      id: string
      startDate: Date
      eventDate?: Date  // 이탈일 (없으면 현재까지 생존)
      censored: boolean // 관찰 중단 여부
    }>
  ): SurvivalCurve {
    // 시간순 정렬
    const events = this.prepareEvents(subjects)
    
    // Kaplan-Meier 추정
    let survivalProb = 1.0
    const curve: SurvivalPoint[] = []
    
    for (const event of events) {
      const atRisk = event.atRisk
      const died = event.events
      
      // S(t) = S(t-1) * (1 - d/n)
      survivalProb *= (atRisk - died) / atRisk
      
      curve.push({
        time: event.time,
        survivalProbability: survivalProb,
        atRisk,
        events: died,
        standardError: this.calculateGreenwood(survivalProb, events, event.time),
      })
    }
    
    return {
      curve,
      medianSurvivalTime: this.findMedianSurvival(curve),
      confidenceIntervals: this.calculateCI(curve),
    }
  }

  /**
   * Cox 비례 위험 모델 (간소화 버전)
   * 실제 구현 시 ml-regression 등 라이브러리 활용 권장
   */
  fitCoxModel(
    subjects: CoxSubject[],
    covariates: string[]
  ): CoxModelResult {
    // 위험 요인별 Hazard Ratio 계산
    const hazardRatios: HazardRatio[] = []
    
    for (const covariate of covariates) {
      // 단변량 분석으로 간소화
      const withFactor = subjects.filter(s => s[covariate])
      const withoutFactor = subjects.filter(s => !s[covariate])
      
      const hrWithFactor = this.calculateHazardRate(withFactor)
      const hrWithoutFactor = this.calculateHazardRate(withoutFactor)
      
      hazardRatios.push({
        factor: covariate,
        hazardRatio: hrWithFactor / hrWithoutFactor,
        pValue: this.logRankTest(withFactor, withoutFactor),
        interpretation: this.interpretHR(covariate, hrWithFactor / hrWithoutFactor),
      })
    }
    
    return { hazardRatios }
  }

  /**
   * 개별 이탈 확률 예측
   */
  predictIndividualRisk(
    subject: any,
    survivalCurve: SurvivalCurve,
    hazardRatios: HazardRatio[]
  ): IndividualRiskPrediction {
    // 기본 생존 확률
    const daysSinceStart = this.daysSince(subject.startDate)
    const baseSurvival = this.interpolateSurvival(survivalCurve, daysSinceStart)
    
    // 위험 요인 조정
    let riskMultiplier = 1.0
    const riskFactors: string[] = []
    
    for (const hr of hazardRatios) {
      if (subject[hr.factor] && hr.hazardRatio > 1.2) {
        riskMultiplier *= hr.hazardRatio
        riskFactors.push(hr.interpretation)
      }
    }
    
    // 조정된 생존 확률
    const adjustedSurvival = Math.pow(baseSurvival, riskMultiplier)
    
    return {
      currentSurvivalProb: adjustedSurvival,
      churnProbability: 1 - adjustedSurvival,
      riskFactors,
      predictedChurnDate: this.predictChurnDate(survivalCurve, riskMultiplier),
      interventionUrgency: this.classifyUrgency(adjustedSurvival),
    }
  }
}
```


### 3.4 InsightScorer (인사이트 스코어링)

```typescript
// backend/src/services/analytics/InsightScorer.ts

interface ScoringWeights {
  statisticalSignificance: number  // 0.15
  businessImpact: number           // 0.35
  actionability: number            // 0.20
  urgency: number                  // 0.20
  confidence: number               // 0.10
}

export class InsightScorer {
  private weights: ScoringWeights = {
    statisticalSignificance: 0.15,
    businessImpact: 0.35,
    actionability: 0.20,
    urgency: 0.20,
    confidence: 0.10,
  }

  /**
   * 인사이트 종합 점수 계산
   */
  score(insight: RawInsight, context: BusinessContext): ScoredInsight {
    const scores = {
      statisticalSignificance: this.scoreStatisticalSignificance(insight),
      businessImpact: this.scoreBusinessImpact(insight, context),
      actionability: this.scoreActionability(insight),
      urgency: this.scoreUrgency(insight),
      confidence: this.scoreConfidence(insight),
    }

    const totalScore = Object.entries(scores).reduce(
      (sum, [key, value]) => sum + value * this.weights[key as keyof ScoringWeights],
      0
    )

    return {
      ...insight,
      scores,
      totalScore,
      shouldDisplay: totalScore >= 50,
      displayPriority: this.calculatePriority(totalScore, scores),
      displayLocation: this.determineLocation(totalScore, scores),
    }
  }

  /**
   * 통계적 유의성 점수 (0-100)
   */
  private scoreStatisticalSignificance(insight: RawInsight): number {
    let score = 0

    // 표본 크기
    if (insight.sampleSize >= 100) score += 30
    else if (insight.sampleSize >= 30) score += 20
    else if (insight.sampleSize >= 10) score += 10

    // p-value (있는 경우)
    if (insight.pValue !== undefined) {
      if (insight.pValue < 0.01) score += 40
      else if (insight.pValue < 0.05) score += 30
      else if (insight.pValue < 0.1) score += 15
    } else {
      // Z-Score 기반
      if (Math.abs(insight.zScore || 0) > 3) score += 40
      else if (Math.abs(insight.zScore || 0) > 2) score += 30
      else if (Math.abs(insight.zScore || 0) > 1.5) score += 15
    }

    // 효과 크기
    if (Math.abs(insight.effectSize || 0) > 0.5) score += 30
    else if (Math.abs(insight.effectSize || 0) > 0.3) score += 20
    else if (Math.abs(insight.effectSize || 0) > 0.1) score += 10

    return Math.min(100, score)
  }

  /**
   * 비즈니스 영향도 점수 (0-100)
   */
  private scoreBusinessImpact(insight: RawInsight, context: BusinessContext): number {
    let score = 0

    // 매출 영향 (예상 또는 실제)
    const revenueImpact = insight.estimatedRevenueImpact || 0
    const revenueRatio = revenueImpact / context.totalRevenue

    if (revenueRatio > 0.1) score += 40      // 10% 이상
    else if (revenueRatio > 0.05) score += 30 // 5% 이상
    else if (revenueRatio > 0.01) score += 20 // 1% 이상
    else if (revenueRatio > 0.001) score += 10

    // 영향받는 고객/작가 수
    const affectedRatio = (insight.affectedCount || 0) / context.totalCustomers

    if (affectedRatio > 0.2) score += 30
    else if (affectedRatio > 0.1) score += 20
    else if (affectedRatio > 0.05) score += 10

    // 전략적 중요도 (카테고리 기반)
    const strategicCategories = ['vip_customer', 'top_artist', 'key_market']
    if (strategicCategories.includes(insight.category)) score += 30

    return Math.min(100, score)
  }

  /**
   * 실행 가능성 점수 (0-100)
   */
  private scoreActionability(insight: RawInsight): number {
    let score = 0

    // 명확한 액션 존재
    if (insight.recommendedAction) score += 40

    // 액션 링크 존재
    if (insight.actionLink) score += 20

    // 리소스 요구 수준
    if (insight.resourceRequired === 'low') score += 30
    else if (insight.resourceRequired === 'medium') score += 20
    else if (insight.resourceRequired === 'high') score += 10

    // 효과까지 예상 시간
    if (insight.timeToImpact && insight.timeToImpact <= 7) score += 10
    else if (insight.timeToImpact && insight.timeToImpact <= 30) score += 5

    return Math.min(100, score)
  }

  /**
   * 긴급성 점수 (0-100)
   */
  private scoreUrgency(insight: RawInsight): number {
    let score = 0

    // 트렌드 방향
    if (insight.trendDirection === 'worsening') score += 40
    else if (insight.trendDirection === 'stable') score += 10

    // 임계점까지 시간
    if (insight.daysToThreshold !== undefined) {
      if (insight.daysToThreshold <= 3) score += 40
      else if (insight.daysToThreshold <= 7) score += 30
      else if (insight.daysToThreshold <= 14) score += 20
      else if (insight.daysToThreshold <= 30) score += 10
    }

    // 되돌릴 수 있는지
    if (insight.reversible === false) score += 20

    return Math.min(100, score)
  }

  /**
   * 신뢰도 점수 (0-100)
   */
  private scoreConfidence(insight: RawInsight): number {
    let score = 50  // 기본 점수

    // 데이터 품질
    if (insight.dataQuality === 'high') score += 20
    else if (insight.dataQuality === 'medium') score += 10
    else if (insight.dataQuality === 'low') score -= 20

    // 모델 정확도 (예측의 경우)
    if (insight.modelAccuracy !== undefined) {
      score += insight.modelAccuracy * 30
    }

    // 과거 유사 인사이트 정확도
    if (insight.historicalAccuracy !== undefined) {
      score += insight.historicalAccuracy * 20
    }

    return Math.max(0, Math.min(100, score))
  }
}
```

### 3.5 NarrativeGenerator (자연어 생성)

```typescript
// backend/src/services/analytics/NarrativeGenerator.ts

export class NarrativeGenerator {
  constructor(private openaiService: OpenAIService) {}

  /**
   * 인사이트를 자연어로 변환
   */
  async generateNarrative(
    insight: ScoredInsight,
    context: BusinessContext
  ): Promise<NarrativeInsight> {
    // 템플릿 기반 기본 생성
    const templateNarrative = this.generateFromTemplate(insight)

    // LLM으로 자연스럽게 다듬기
    const prompt = this.buildPrompt(insight, context, templateNarrative)
    
    const llmResponse = await this.openaiService.generate(prompt, {
      temperature: 0.6,
      maxTokens: 500,
    })

    return {
      ...insight,
      narrative: {
        headline: this.extractHeadline(llmResponse),
        context: this.extractContext(llmResponse),
        impact: this.extractImpact(llmResponse),
        recommendation: this.extractRecommendation(llmResponse),
      },
      generatedText: {
        short: this.generateShort(llmResponse),
        medium: this.generateMedium(llmResponse),
        detailed: llmResponse,
      },
    }
  }

  /**
   * 경영진 브리핑 생성
   */
  async generateExecutiveBriefing(
    healthScore: BusinessHealthScore,
    insights: ScoredInsight[],
    context: BusinessContext
  ): Promise<string> {
    const prompt = `당신은 글로벌 이커머스 비즈니스의 경영 고문입니다.
다음 데이터를 바탕으로 경영진에게 보고할 수 있는 수준의 브리핑을 작성하세요.

## 비즈니스 건강도
- 종합: ${healthScore.overall}/100
- 매출: ${healthScore.dimensions.revenue.score}/100 (${healthScore.dimensions.revenue.trend})
- 고객: ${healthScore.dimensions.customer.score}/100 (${healthScore.dimensions.customer.trend})
- 작가: ${healthScore.dimensions.artist.score}/100 (${healthScore.dimensions.artist.trend})
- 운영: ${healthScore.dimensions.operations.score}/100 (${healthScore.dimensions.operations.trend})

## 주요 인사이트 (상위 5개)
${insights.slice(0, 5).map((i, idx) => `${idx + 1}. [${i.type}] ${i.title}: ${i.description}`).join('\n')}

## 작성 지침
1. 첫 문장에서 전체 비즈니스 상태를 한 줄로 요약
2. 가장 중요한 이슈 2-3개를 우선순위 순으로 언급
3. 즉시 조치가 필요한 항목은 🚨로 표시
4. 기회 요인은 💡로 표시
5. 주의 관찰 항목은 ⚠️로 표시
6. 구체적인 숫자와 비교 기준을 포함
7. 마지막에 이번 주 집중해야 할 3가지 제안

응답은 한국어로, 300자 이내로 작성하세요.`

    return await this.openaiService.generate(prompt, {
      temperature: 0.7,
      maxTokens: 800,
    })
  }

  /**
   * 템플릿 기반 기본 생성
   */
  private generateFromTemplate(insight: ScoredInsight): string {
    const templates: Record<string, string> = {
      anomaly_positive: `${insight.metric}이(가) 평소 대비 ${insight.deviation}% 높습니다.`,
      anomaly_negative: `${insight.metric}이(가) 평소 대비 ${Math.abs(insight.deviation)}% 낮습니다.`,
      trend_up: `${insight.metric}이(가) 상승 추세입니다 (${insight.changeRate}% 증가).`,
      trend_down: `${insight.metric}이(가) 하락 추세입니다 (${Math.abs(insight.changeRate)}% 감소).`,
      concentration: `${insight.segment}에 대한 의존도가 ${insight.concentration}%로 높습니다.`,
      churn_risk: `${insight.count}명의 고객이 이탈 위험 상태입니다.`,
    }

    return templates[insight.templateType] || insight.description
  }
}
```

---

## 4. API 엔드포인트 구현

```typescript
// backend/src/routes/business-brain.ts

import { Router } from 'express'
import { BusinessBrainAgent } from '../services/agents/BusinessBrainAgent'

const router = Router()

/**
 * GET /api/business-brain/briefing
 * 경영 브리핑 조회
 */
router.get('/briefing', async (req, res) => {
  try {
    const agent = new BusinessBrainAgent()
    const briefing = await agent.generateExecutiveBriefing()
    
    res.json({
      success: true,
      briefing,
      generatedAt: new Date().toISOString(),
      cacheExpiry: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
  } catch (error: any) {
    console.error('[BusinessBrain] Briefing error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/business-brain/health-score
 * 비즈니스 건강도 점수
 */
router.get('/health-score', async (req, res) => {
  try {
    const agent = new BusinessBrainAgent()
    const score = await agent.calculateHealthScore()
    
    res.json({
      success: true,
      score,
      calculatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[BusinessBrain] Health score error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/business-brain/insights
 * 인사이트 목록
 */
router.get('/insights', async (req, res) => {
  try {
    const { type, severity, limit = 20 } = req.query
    
    const agent = new BusinessBrainAgent()
    let insights = await agent.discoverInsights()
    
    // 필터링
    if (type) {
      insights = insights.filter(i => i.type === type)
    }
    if (severity) {
      insights = insights.filter(i => i.severity === severity)
    }
    
    // 정렬 및 제한
    insights = insights
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, Number(limit))
    
    res.json({
      success: true,
      insights,
      total: insights.length,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] Insights error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/business-brain/decomposition
 * 매출 변화 분해 분석
 */
router.get('/decomposition', async (req, res) => {
  try {
    const { startDate, endDate, compareWith = 'previous' } = req.query
    
    const agent = new BusinessBrainAgent()
    const decomposition = await agent.decomposeRevenueChange(
      startDate as string,
      endDate as string,
      compareWith as string
    )
    
    res.json({
      success: true,
      decomposition,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] Decomposition error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/business-brain/cube
 * N차원 큐브 분석 결과
 */
router.get('/cube', async (req, res) => {
  try {
    const { dimensions, metrics, startDate, endDate } = req.query
    
    const agent = new BusinessBrainAgent()
    const cubeResult = await agent.runCubeAnalysis({
      dimensions: (dimensions as string)?.split(',') || ['country', 'platform'],
      metrics: (metrics as string)?.split(',') || ['gmv', 'orderCount'],
      dateRange: startDate && endDate ? { start: startDate as string, end: endDate as string } : undefined,
    })
    
    res.json({
      success: true,
      result: cubeResult,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] Cube analysis error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/business-brain/survival/:type
 * 생존 분석 (customer 또는 artist)
 */
router.get('/survival/:type', async (req, res) => {
  try {
    const { type } = req.params
    
    if (!['customer', 'artist'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Use "customer" or "artist".' })
    }
    
    const agent = new BusinessBrainAgent()
    const survivalAnalysis = await agent.runSurvivalAnalysis(type as 'customer' | 'artist')
    
    res.json({
      success: true,
      analysis: survivalAnalysis,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] Survival analysis error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
```


---

## 5. 프론트엔드 구현

### 5.1 대시보드 위젯

```tsx
// frontend/components/business-brain/BrainWidget.tsx

'use client'

import { useQuery } from '@tanstack/react-query'
import { businessBrainApi } from '@/lib/api'
import Link from 'next/link'

export function BrainWidget() {
  const { data: briefing, isLoading } = useQuery({
    queryKey: ['business-brain-briefing'],
    queryFn: businessBrainApi.getBriefing,
    staleTime: 5 * 60 * 1000,  // 5분 캐시
    refetchInterval: 10 * 60 * 1000,  // 10분마다 갱신
  })

  const { data: healthScore } = useQuery({
    queryKey: ['business-brain-health'],
    queryFn: businessBrainApi.getHealthScore,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return <BrainWidgetSkeleton />
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">🧠</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Business Brain</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI 경영 인사이트</p>
          </div>
        </div>
        <Link 
          href="/business-brain"
          className="text-xs text-purple-500 hover:text-purple-600 font-medium"
        >
          상세 분석 →
        </Link>
      </div>

      {/* 건강도 점수 */}
      {healthScore && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">비즈니스 건강도</span>
            <span className={`text-sm font-bold ${
              healthScore.overall >= 70 ? 'text-emerald-600' :
              healthScore.overall >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {healthScore.overall}/100
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                healthScore.overall >= 70 ? 'bg-emerald-500' :
                healthScore.overall >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${healthScore.overall}%` }}
            />
          </div>
          
          {/* 차원별 미니 점수 */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {Object.entries(healthScore.dimensions).map(([key, dim]) => (
              <div key={key} className="text-center">
                <div className="text-xs text-slate-500">{getDimensionLabel(key)}</div>
                <div className={`text-sm font-semibold ${
                  dim.trend === 'up' ? 'text-emerald-600' :
                  dim.trend === 'down' ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {dim.score}
                  <span className="text-xs ml-0.5">
                    {dim.trend === 'up' ? '↑' : dim.trend === 'down' ? '↓' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 브리핑 */}
      {briefing && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span>💬</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI 브리핑</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {briefing.summary}
          </p>
          
          {/* 주요 인사이트 */}
          {briefing.topInsights && briefing.topInsights.length > 0 && (
            <div className="mt-3 space-y-2">
              {briefing.topInsights.slice(0, 3).map((insight, idx) => (
                <div 
                  key={idx}
                  className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                    insight.type === 'critical' ? 'bg-red-50 text-red-700' :
                    insight.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                    insight.type === 'opportunity' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span>{getInsightIcon(insight.type)}</span>
                  <span>{insight.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2 mt-4">
        <Link
          href="/business-brain?tab=insights"
          className="flex-1 text-center py-2 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
        >
          📊 인사이트
        </Link>
        <Link
          href="/business-brain?tab=forecast"
          className="flex-1 text-center py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          🔮 예측
        </Link>
        <Link
          href="/chat?preset=business"
          className="flex-1 text-center py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          💬 질문
        </Link>
      </div>
    </div>
  )
}

function getDimensionLabel(key: string): string {
  const labels: Record<string, string> = {
    revenue: '매출',
    customer: '고객',
    artist: '작가',
    operations: '운영',
  }
  return labels[key] || key
}

function getInsightIcon(type: string): string {
  const icons: Record<string, string> = {
    critical: '🚨',
    warning: '⚠️',
    opportunity: '💡',
    info: '📊',
  }
  return icons[type] || '📌'
}
```

### 5.2 API 클라이언트 확장

```typescript
// frontend/lib/api.ts (추가)

export const businessBrainApi = {
  getBriefing: async () => {
    const response = await api.get('/business-brain/briefing')
    return response.data.briefing
  },

  getHealthScore: async () => {
    const response = await api.get('/business-brain/health-score')
    return response.data.score
  },

  getInsights: async (params?: { type?: string; severity?: string; limit?: number }) => {
    const response = await api.get('/business-brain/insights', { params })
    return response.data.insights
  },

  getDecomposition: async (startDate: string, endDate: string, compareWith?: string) => {
    const response = await api.get('/business-brain/decomposition', {
      params: { startDate, endDate, compareWith },
    })
    return response.data.decomposition
  },

  getCubeAnalysis: async (params: {
    dimensions: string[]
    metrics: string[]
    startDate?: string
    endDate?: string
  }) => {
    const response = await api.get('/business-brain/cube', {
      params: {
        dimensions: params.dimensions.join(','),
        metrics: params.metrics.join(','),
        startDate: params.startDate,
        endDate: params.endDate,
      },
    })
    return response.data.result
  },

  getSurvivalAnalysis: async (type: 'customer' | 'artist') => {
    const response = await api.get(`/business-brain/survival/${type}`)
    return response.data.analysis
  },
}
```

---

## 6. 성능 최적화 전략

### 6.1 캐싱 전략

```typescript
// backend/src/services/cache/BusinessBrainCache.ts

interface CacheConfig {
  briefing: { ttl: 10 * 60 * 1000 }        // 10분
  healthScore: { ttl: 5 * 60 * 1000 }      // 5분
  insights: { ttl: 10 * 60 * 1000 }        // 10분
  cubeAnalysis: { ttl: 30 * 60 * 1000 }    // 30분 (계산 비용 높음)
  survivalAnalysis: { ttl: 60 * 60 * 1000 } // 1시간 (계산 비용 매우 높음)
  decomposition: { ttl: 15 * 60 * 1000 }   // 15분
}

export class BusinessBrainCache {
  private cache = new Map<string, { data: any; expiry: number }>()

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }
    return entry.data as T
  }

  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    })
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}
```

### 6.2 증분 계산

```typescript
// 전체 재계산 대신 변경분만 처리
interface IncrementalUpdate {
  lastProcessedDate: Date
  lastRowCount: number
  checksum: string
}

async function shouldRecalculate(
  sheetName: string,
  lastUpdate: IncrementalUpdate
): Promise<boolean> {
  const currentData = await sheetsService.getSheetDataAsJson(sheetName)
  
  // 행 수 변화 확인
  if (currentData.length !== lastUpdate.lastRowCount) {
    return true
  }
  
  // 최근 데이터 체크섬 비교
  const recentData = currentData.slice(-100)
  const currentChecksum = calculateChecksum(recentData)
  
  return currentChecksum !== lastUpdate.checksum
}
```

### 6.3 백그라운드 처리

```typescript
// 무거운 분석은 백그라운드에서 사전 계산
import cron from 'node-cron'

// 매일 새벽 2시에 전체 분석 실행
cron.schedule('0 2 * * *', async () => {
  console.log('[BusinessBrain] Starting daily analysis...')
  
  const agent = new BusinessBrainAgent()
  
  // 1. 건강도 점수 계산 및 캐싱
  const healthScore = await agent.calculateHealthScore()
  cache.set('health-score', healthScore, 24 * 60 * 60 * 1000)
  
  // 2. 인사이트 발견 및 캐싱
  const insights = await agent.discoverInsights()
  cache.set('insights', insights, 24 * 60 * 60 * 1000)
  
  // 3. 생존 분석 (주 1회)
  if (new Date().getDay() === 1) {  // 월요일
    const customerSurvival = await agent.runSurvivalAnalysis('customer')
    cache.set('survival-customer', customerSurvival, 7 * 24 * 60 * 60 * 1000)
  }
  
  console.log('[BusinessBrain] Daily analysis completed')
})

// 10분마다 실시간 이상 탐지
cron.schedule('*/10 * * * *', async () => {
  const agent = new BusinessBrainAgent()
  const anomalies = await agent.detectRealtimeAnomalies()
  
  // Critical 이상 발견 시 알림
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical')
  if (criticalAnomalies.length > 0) {
    await sendAlerts(criticalAnomalies)
  }
})
```

---

## 7. 테스트 전략

### 7.1 단위 테스트

```typescript
// backend/src/services/analytics/__tests__/CubeAnalyzer.test.ts

describe('CubeAnalyzer', () => {
  const sampleData = [
    { country: 'JP', platform: 'iOS', gmv: 100, orders: 2 },
    { country: 'JP', platform: 'Android', gmv: 80, orders: 1 },
    { country: 'US', platform: 'iOS', gmv: 150, orders: 3 },
    { country: 'US', platform: 'Android', gmv: 120, orders: 2 },
  ]

  it('should calculate metrics for all dimension combinations', async () => {
    const analyzer = new CubeAnalyzer({
      dimensions: [
        { name: 'country', column: 'country' },
        { name: 'platform', column: 'platform' },
      ],
      metrics: [
        { name: 'gmv', column: 'gmv', aggregation: 'sum' },
        { name: 'orders', column: 'orders', aggregation: 'sum' },
      ],
      minSampleSize: 1,
      deviationThreshold: 0.2,
    })

    const result = await analyzer.analyze(sampleData)

    expect(result.totalCombinations).toBe(4)  // 2 countries × 2 platforms
    expect(result.analyzedCells).toBe(4)
  })

  it('should detect anomalies correctly', async () => {
    // 이상치가 있는 데이터
    const dataWithAnomaly = [
      ...sampleData,
      { country: 'JP', platform: 'Web', gmv: 1000, orders: 1 },  // 이상치
    ]

    const analyzer = new CubeAnalyzer({
      dimensions: [{ name: 'country', column: 'country' }],
      metrics: [{ name: 'gmv', column: 'gmv', aggregation: 'sum' }],
      minSampleSize: 1,
      deviationThreshold: 0.5,
    })

    const result = await analyzer.analyze(dataWithAnomaly)

    expect(result.anomalies.length).toBeGreaterThan(0)
  })
})
```

### 7.2 통합 테스트

```typescript
// backend/src/routes/__tests__/business-brain.test.ts

describe('Business Brain API', () => {
  it('GET /api/business-brain/briefing should return valid briefing', async () => {
    const response = await request(app).get('/api/business-brain/briefing')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.briefing).toHaveProperty('summary')
    expect(response.body.briefing).toHaveProperty('healthScore')
  })

  it('GET /api/business-brain/health-score should return valid scores', async () => {
    const response = await request(app).get('/api/business-brain/health-score')

    expect(response.status).toBe(200)
    expect(response.body.score.overall).toBeGreaterThanOrEqual(0)
    expect(response.body.score.overall).toBeLessThanOrEqual(100)
    expect(response.body.score.dimensions).toHaveProperty('revenue')
    expect(response.body.score.dimensions).toHaveProperty('customer')
  })
})
```

---

## 8. 구현 일정 (상세)

### Week 1: 핵심 인프라
| 일 | 작업 | 산출물 |
|----|------|--------|
| 1 | CubeAnalyzer 구현 | CubeAnalyzer.ts |
| 2 | CubeAnalyzer 테스트 및 최적화 | 테스트 코드 |
| 3 | DecompositionEngine 구현 | DecompositionEngine.ts |
| 4 | InsightScorer 구현 | InsightScorer.ts |
| 5 | BusinessBrainAgent 기본 구조 | BusinessBrainAgent.ts |

### Week 2: 고급 분석
| 일 | 작업 | 산출물 |
|----|------|--------|
| 1-2 | SurvivalAnalyzer 구현 | SurvivalAnalyzer.ts |
| 3 | ForecastEngine 구현 | ForecastEngine.ts |
| 4 | NarrativeGenerator 구현 | NarrativeGenerator.ts |
| 5 | 통합 테스트 | 테스트 코드 |

### Week 3: API 및 프론트엔드
| 일 | 작업 | 산출물 |
|----|------|--------|
| 1 | API 라우트 구현 | business-brain.ts |
| 2 | BrainWidget 구현 | BrainWidget.tsx |
| 3 | 대시보드 통합 | dashboard/page.tsx 수정 |
| 4 | 상세 페이지 구현 | business-brain/page.tsx |
| 5 | E2E 테스트 | Cypress 테스트 |

### Week 4: 최적화 및 배포
| 일 | 작업 | 산출물 |
|----|------|--------|
| 1 | 캐싱 최적화 | BusinessBrainCache.ts |
| 2 | 백그라운드 작업 설정 | cron jobs |
| 3 | 성능 테스트 및 튜닝 | 성능 리포트 |
| 4 | 문서화 | API 문서 |
| 5 | 배포 및 모니터링 | 배포 완료 |

---

## 9. 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Google Sheets API 속도 제한 | 중 | 상 | 캐싱 강화, 배치 처리 |
| LLM 응답 품질 불안정 | 중 | 중 | 템플릿 폴백, 검증 로직 |
| 계산 시간 초과 | 중 | 중 | 타임아웃 설정, 샘플링 |
| 메모리 부족 | 하 | 상 | 스트리밍 처리, 청크 분할 |

---

## 10. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2024-12-04 | 구현 가이드 초안 작성 |
