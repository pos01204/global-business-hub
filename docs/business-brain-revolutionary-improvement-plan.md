# Business Brain 혁신적 개선 계획서
## "Minority Report for Business" - AI 기반 예측적 경영 인텔리전스 시스템

---

> **📌 데이터 업데이트 주기**: 매일 오전 11시 매뉴얼 업데이트
> **📌 핵심 방향**: 실시간 기능 제외, 배치 분석 최적화 및 인사이트 품질 강화

---

## 1. 현재 상태 종합 분석

### 1.1 구현 현황 개요

Business Brain은 현재 **5,200줄 이상**의 프론트엔드 코드와 **2,600줄 이상**의 백엔드 에이전트 코드로 구성된 종합 경영 인텔리전스 시스템입니다.

#### 구현된 기능 매트릭스

| 카테고리 | 기능 | 구현 상태 | 완성도 |
|---------|------|----------|--------|
| **개요** | 대시보드 (건강도 + 종합 인사이트) | ✅ 완료 | 85% |
| **고객 분석** | RFM 세분화 | ✅ 완료 | 80% |
| | 이탈 예측 | ✅ 완료 | 75% |
| | 신규 유저 유치 분석 | ✅ 완료 | 70% |
| | 재구매율 향상 분석 | ✅ 완료 | 70% |
| **작가 분석** | 작가 건강도 | ✅ 완료 | 75% |
| | 파레토 분석 | ✅ 완료 | 80% |
| **매출 분석** | 트렌드 분석 | ✅ 완료 | 75% |
| | 매출 예측 | ✅ 완료 | 70% |
| | 코호트 분석 | ✅ 완료 | 75% |
| **인사이트** | 기회 발견 | ✅ 완료 | 70% |
| | 리스크 감지 | ✅ 완료 | 75% |
| | 전략 분석 | ✅ 완료 | 70% |
| | 전략 제안 | ✅ 완료 | 65% |
| **고급 분석** | 이상 탐지 | ✅ 완료 | 80% |
| | 기간별 추이 | ✅ 완료 | 75% |
| **액션** | 액션 제안 | ✅ 완료 | 65% |
| | What-if 시뮬레이션 | ✅ 완료 | 60% |
| | 리포트 생성 | ✅ 완료 | 55% |

### 1.2 강점 분석

#### A. 기술적 강점
```
✅ 견고한 아키텍처: BaseAgent 상속 구조로 확장성 확보
✅ 캐싱 시스템: BusinessBrainCache로 성능 최적화
✅ 다양한 분석 엔진: CubeAnalyzer, DecompositionEngine, InsightScorer 등
✅ AI 통합: OpenAI API 기반 자연어 브리핑 생성
✅ 기간별 분석: 유연한 PeriodPreset 시스템
✅ React Query: 효율적인 데이터 페칭 및 캐싱
```

#### B. 기능적 강점
```
✅ 4차원 건강도 점수 (매출/고객/작가/운영)
✅ 휴먼 에러 체크 (9가지 자동 검증 항목)
✅ 다중 기간 트렌드 분석
✅ RFM 고객 세분화 (7개 세그먼트)
✅ 파레토 집중도 분석
✅ 시계열 분해 (STL: 계절성 + 추세 + 잔차)
```

### 1.3 개선 필요 영역 (심층 분석)

#### A. 예측 정확도 및 신뢰도 문제

```
문제점:
❌ 예측 모델의 통계적 검증 부족
❌ 신뢰 구간 표시 미흡
❌ 예측 vs 실제 성과 추적 부재
❌ 모델 자동 재학습 메커니즘 없음

현재 코드:
- ForecastEngine: 단순 이동평균 + 선형회귀 기반
- 예측 결과에 confidence만 표시, 신뢰 구간 미제공
```

#### B. 인사이트의 실행 가능성 부족

```
문제점:
❌ 인사이트 → 실제 액션 연결 약함
❌ 액션 실행 후 결과 추적 불가
❌ 인사이트 우선순위 근거 불투명
❌ 비즈니스 컨텍스트 부족

현재 코드:
- InsightScorer: 점수 기반 정렬만 제공
- 액션 제안은 템플릿 기반, 동적 생성 부족
```

#### C. 의사결정 지원 시스템 부재

```
문제점:
❌ 의사결정 시나리오 비교 도구 부족
❌ 리스크-리워드 매트릭스 없음
❌ 의사결정 이력 추적 불가
❌ 팀 협업 기능 없음
```

#### D. 일일 배치 분석 최적화 필요

```
현재 상황:
📌 데이터 업데이트: 매일 오전 11시 매뉴얼 업데이트

개선 필요:
❌ 데이터 업데이트 후 자동 분석 트리거 없음
❌ 전일 대비 변화 감지 및 하이라이트 부족
❌ 목표 대비 진행 상황 추적 없음
❌ 일일 핵심 변화 요약 리포트 없음
```

#### E. 시각화 및 UX 개선 필요

```
문제점:
⚠️ 탭이 너무 많아 정보 접근성 저하 (18개 탭)
⚠️ 핵심 지표가 한눈에 들어오지 않음
⚠️ 데이터 스토리텔링 부족
⚠️ 개인화 옵션 부족
```

---

## 2. 외부 플러그인 및 고급 도구 활용 전략

### 2.1 시각화 라이브러리 스택

#### 2.1.1 Apache ECharts (핵심 권장)
```
패키지: echarts, echarts-for-react
용도: 복잡한 인터랙티브 차트, 대규모 데이터 렌더링
장점:
  ✅ 100만+ 데이터 포인트 최적화 렌더링 (Canvas/WebGL)
  ✅ 70+ 내장 차트 타입 (Sankey, Sunburst, Treemap, Heatmap 등)
  ✅ 드릴다운, 브러싱, 줌/팬 등 고급 인터랙션 내장
  ✅ 다크모드, 테마 시스템 완벽 지원
  ✅ SSR 지원
적용 영역:
  - 매출 트렌드 예측 (신뢰 구간 포함)
  - 고객 흐름 Sankey 다이어그램
  - 카테고리별 Treemap
  - 코호트 히트맵
  - 작가-제품-고객 관계 네트워크
```

```typescript
// 예시: ECharts 기반 고급 예측 차트
import ReactECharts from 'echarts-for-react';

const AdvancedForecastChart = ({ data, confidence }: Props) => {
  const option = {
    dataset: [{ source: data }],
    tooltip: {
      trigger: 'axis',
      formatter: (params) => /* 상세 툴팁 포맷 */
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider' }
    ],
    visualMap: {
      show: false,
      dimension: 2,
      pieces: [
        { gt: 0.8, color: '#22c55e' },
        { gt: 0.5, lte: 0.8, color: '#f59e0b' },
        { lte: 0.5, color: '#ef4444' }
      ]
    },
    series: [
      {
        type: 'line',
        name: '실제',
        encode: { x: 'date', y: 'actual' },
        smooth: true,
      },
      {
        type: 'line',
        name: '예측',
        encode: { x: 'date', y: 'predicted' },
        lineStyle: { type: 'dashed' },
        areaStyle: { opacity: 0.1 },
      },
      {
        type: 'custom',
        name: '95% CI',
        renderItem: renderConfidenceInterval,
      }
    ]
  };
  
  return <ReactECharts option={option} style={{ height: 500 }} notMerge />;
};
```

#### 2.1.2 D3.js + Visx (고급 커스텀 시각화)
```
패키지: d3, @visx/* (Airbnb)
용도: 완전 커스텀 시각화, 애니메이션
장점:
  ✅ 무한한 커스터마이징 가능
  ✅ Visx: D3의 파워 + React 컴포넌트 방식
  ✅ 복잡한 전환 애니메이션
적용 영역:
  - 의사결정 트리 시각화
  - 파레토 누적 곡선
  - 토네이도 차트 (민감도 분석)
  - 워터폴 차트 (매출 분해)
```

#### 2.1.3 Plotly.js (과학/통계 시각화)
```
패키지: plotly.js, react-plotly.js
용도: 통계적 분석 시각화
장점:
  ✅ 박스플롯, 바이올린 플롯, 히스토그램
  ✅ 3D 산점도, 서피스 플롯
  ✅ 내장 통계 기능 (회귀선, 분포)
  ✅ 인터랙티브 내보내기
적용 영역:
  - 이상 탐지 시각화
  - 분포 분석 (고객 구매액, 작가 매출)
  - 클러스터링 결과 3D 시각화
  - 상관관계 매트릭스
```

#### 2.1.4 네트워크 시각화 도구
```
패키지: vis-network, cytoscape, sigma.js
용도: 관계 네트워크 분석
장점:
  ✅ vis-network: 간편한 설정, 물리 엔진 내장
  ✅ cytoscape: 복잡한 그래프 알고리즘
  ✅ sigma.js: 대규모 그래프 (10만+ 노드)
적용 영역:
  - 작가-제품 네트워크
  - 고객 구매 패턴 그래프
  - 영향력 전파 시각화
  - 추천 시스템 시각화
```

```typescript
// 예시: Cytoscape 기반 고객-작가 관계 네트워크
import CytoscapeComponent from 'react-cytoscapejs';

const CustomerArtistNetwork = ({ relationships }) => {
  const elements = relationships.map(rel => ({
    data: {
      id: rel.id,
      source: `customer_${rel.customerId}`,
      target: `artist_${rel.artistId}`,
      weight: rel.purchaseCount,
    }
  }));
  
  const layout = {
    name: 'cose', // Force-directed
    animate: true,
    nodeDimensionsIncludeLabels: true,
  };
  
  return (
    <CytoscapeComponent
      elements={elements}
      layout={layout}
      style={{ width: '100%', height: '600px' }}
      stylesheet={[
        {
          selector: 'node[type="customer"]',
          style: { 'background-color': '#3b82f6' }
        },
        {
          selector: 'node[type="artist"]',
          style: { 'background-color': '#f59e0b' }
        },
        {
          selector: 'edge',
          style: { 'width': 'mapData(weight, 1, 100, 1, 10)' }
        }
      ]}
    />
  );
};
```

### 2.2 AI/ML 라이브러리 스택

#### 2.2.1 TensorFlow.js (클라이언트 사이드 ML)
```
패키지: @tensorflow/tfjs, @tensorflow-models/*
용도: 브라우저 내 실시간 예측
장점:
  ✅ GPU 가속 (WebGL)
  ✅ 전이 학습 지원
  ✅ 모델 변환 (Python → JS)
  ✅ 개인정보 보호 (서버 전송 불필요)
적용 영역:
  - 실시간 이탈 예측 스코어링
  - 이상 탐지 오토인코더
  - 시계열 예측 LSTM
  - 고객 클러스터링
```

```typescript
// 예시: TensorFlow.js 기반 실시간 이탈 예측
import * as tf from '@tensorflow/tfjs';

class ClientSideChurnPredictor {
  private model: tf.LayersModel | null = null;
  
  async loadModel() {
    this.model = await tf.loadLayersModel('/models/churn/model.json');
    // 모델 워밍업
    const warmup = tf.zeros([1, 15]); // 15개 피처
    this.model.predict(warmup);
    warmup.dispose();
  }
  
  async predictChurnRisk(customerFeatures: number[][]): Promise<number[]> {
    if (!this.model) await this.loadModel();
    
    const tensor = tf.tensor2d(customerFeatures);
    const predictions = this.model!.predict(tensor) as tf.Tensor;
    const risks = await predictions.data();
    
    tensor.dispose();
    predictions.dispose();
    
    return Array.from(risks);
  }
  
  // 실시간 스트리밍 예측
  async *streamPredictions(customerBatches: AsyncIterable<number[][]>) {
    for await (const batch of customerBatches) {
      yield await this.predictChurnRisk(batch);
    }
  }
}
```

#### 2.2.2 Prophet (시계열 예측 - 백엔드)
```
패키지: prophet (Python), node-prophet (Node.js 래퍼)
용도: 비즈니스 시계열 예측
장점:
  ✅ 계절성 자동 감지 (일별, 주별, 연별)
  ✅ 휴일 효과 모델링
  ✅ 결측치 자동 처리
  ✅ 불확실성 구간 내장
  ✅ 변화점 탐지
적용 영역:
  - 매출 예측 (30/60/90일)
  - 주문량 예측
  - 트래픽 예측
  - 재고 수요 예측
```

```python
# backend/src/services/analytics/prophet_forecaster.py
from prophet import Prophet
import pandas as pd

class BusinessProphetForecaster:
    def __init__(self):
        self.model = None
        self.holidays = self._load_korean_holidays()
    
    def forecast_gmv(self, history: pd.DataFrame, periods: int = 30) -> dict:
        # 모델 구성
        self.model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            holidays=self.holidays,
            interval_width=0.95,  # 95% 신뢰구간
            changepoint_prior_scale=0.05,  # 변화점 민감도
        )
        
        # 추가 회귀 변수
        self.model.add_regressor('promo_intensity')
        self.model.add_regressor('market_campaign')
        
        # 학습
        self.model.fit(history)
        
        # 미래 데이터프레임 생성
        future = self.model.make_future_dataframe(periods=periods)
        future['promo_intensity'] = self._predict_promo(future['ds'])
        future['market_campaign'] = self._predict_campaigns(future['ds'])
        
        # 예측
        forecast = self.model.predict(future)
        
        return {
            'predictions': forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods).to_dict('records'),
            'components': {
                'trend': forecast['trend'].tolist(),
                'weekly': forecast['weekly'].tolist(),
                'yearly': forecast['yearly'].tolist(),
            },
            'changepoints': self.model.changepoints.tolist(),
            'accuracy_metrics': self._calculate_metrics(history, forecast),
        }
```

#### 2.2.3 Simple-statistics + Jstat (통계 분석)
```
패키지: simple-statistics, jstat
용도: 통계 계산
장점:
  ✅ 순수 JS, 의존성 없음
  ✅ 분포, 검정, 회귀 분석
  ✅ 경량 (번들 크기 최소화)
적용 영역:
  - A/B 테스트 유의성 검정
  - 이상치 탐지 (Z-score, IQR)
  - 상관관계 분석
  - 회귀 분석
```

```typescript
// 예시: 고급 통계 분석 유틸리티
import * as ss from 'simple-statistics';
import * as jstat from 'jstat';

class AdvancedStatisticsEngine {
  // 이상치 탐지 (여러 방법 앙상블)
  detectAnomalies(data: number[]): AnomalyResult[] {
    const zScores = this.calculateZScores(data);
    const iqrOutliers = this.detectIQROutliers(data);
    const mahalanobis = this.mahalanobisDistance(data);
    
    return data.map((value, idx) => ({
      index: idx,
      value,
      isAnomaly: 
        Math.abs(zScores[idx]) > 3 ||
        iqrOutliers.includes(idx) ||
        mahalanobis[idx] > this.chiSquareThreshold(0.001, 1),
      score: (Math.abs(zScores[idx]) / 3 + mahalanobis[idx] / 10) / 2,
      method: this.getAnomalyMethod(zScores[idx], iqrOutliers.includes(idx)),
    }));
  }
  
  // A/B 테스트 유의성 검정
  abTestSignificance(control: number[], treatment: number[]): ABTestResult {
    const meanControl = ss.mean(control);
    const meanTreatment = ss.mean(treatment);
    const pooledVar = ss.pooledVariance([control, treatment], [0, 1]);
    
    // t-검정
    const tStat = (meanTreatment - meanControl) / 
                  Math.sqrt(pooledVar * (1/control.length + 1/treatment.length));
    const df = control.length + treatment.length - 2;
    const pValue = 2 * (1 - jstat.studentt.cdf(Math.abs(tStat), df));
    
    // 효과 크기 (Cohen's d)
    const cohenD = (meanTreatment - meanControl) / Math.sqrt(pooledVar);
    
    // 신뢰구간
    const se = Math.sqrt(pooledVar * (1/control.length + 1/treatment.length));
    const ci95 = [
      (meanTreatment - meanControl) - 1.96 * se,
      (meanTreatment - meanControl) + 1.96 * se,
    ];
    
    return {
      controlMean: meanControl,
      treatmentMean: meanTreatment,
      lift: ((meanTreatment - meanControl) / meanControl) * 100,
      tStatistic: tStat,
      pValue,
      isSignificant: pValue < 0.05,
      effectSize: cohenD,
      effectSizeInterpretation: this.interpretCohenD(cohenD),
      confidenceInterval: ci95,
      sampleSizeRecommendation: this.calculateRequiredSampleSize(cohenD, 0.8, 0.05),
    };
  }
  
  // 시계열 분해 (STL)
  decomposeTimeSeries(data: number[], period: number): DecompositionResult {
    // LOESS 기반 STL 분해
    const trend = this.loessSmooth(data, Math.max(period * 1.5, 7));
    const detrended = data.map((v, i) => v - trend[i]);
    const seasonal = this.extractSeasonality(detrended, period);
    const residual = data.map((v, i) => v - trend[i] - seasonal[i % period]);
    
    return {
      trend,
      seasonal: Array(data.length).fill(0).map((_, i) => seasonal[i % period]),
      residual,
      strength: {
        trend: 1 - ss.variance(residual) / ss.variance(data.map((v, i) => v - seasonal[i % period])),
        seasonal: 1 - ss.variance(residual) / ss.variance(detrended),
      },
      seasonalIndices: seasonal,
    };
  }
}
```

### 2.3 데이터 처리 최적화 스택

#### 2.3.1 Arquero (고속 데이터 처리)
```
패키지: arquero
용도: 브라우저 내 대규모 데이터 처리
장점:
  ✅ Apache Arrow 기반 고성능
  ✅ Pandas/dplyr 스타일 API
  ✅ 컬럼나 데이터 포맷 (캐시 효율)
  ✅ 지연 평가 (Lazy evaluation)
적용 영역:
  - 대규모 고객 데이터 집계
  - 실시간 필터링/정렬
  - 복잡한 조인/그룹화
  - 피벗 테이블
```

```typescript
// 예시: Arquero 기반 고속 데이터 분석
import * as aq from 'arquero';

class HighPerformanceDataProcessor {
  // 고객 RFM 세분화 (100만+ 레코드 처리)
  async calculateRFMSegments(orders: any[]): Promise<RFMResult> {
    const dt = aq.from(orders);
    
    const rfm = dt
      .derive({
        daysSinceOrder: aq.op.days_between(aq.op.now(), d => d.orderDate)
      })
      .groupby('customerId')
      .rollup({
        recency: d => aq.op.min(d.daysSinceOrder),
        frequency: d => aq.op.count(),
        monetary: d => aq.op.sum(d.amount),
        lastPurchase: d => aq.op.max(d.orderDate),
        avgOrderValue: d => aq.op.mean(d.amount),
      })
      .derive({
        recencyScore: aq.escape(d => this.scoreQuantile(d.recency, 'desc')),
        frequencyScore: aq.escape(d => this.scoreQuantile(d.frequency, 'asc')),
        monetaryScore: aq.escape(d => this.scoreQuantile(d.monetary, 'asc')),
      })
      .derive({
        rfmSegment: d => `${d.recencyScore}${d.frequencyScore}${d.monetaryScore}`,
        customerTier: aq.escape(d => this.assignTier(d.rfmSegment)),
      });
    
    // 세그먼트별 통계
    const segmentStats = rfm
      .groupby('customerTier')
      .rollup({
        count: d => aq.op.count(),
        avgRecency: d => aq.op.mean(d.recency),
        avgFrequency: d => aq.op.mean(d.frequency),
        avgMonetary: d => aq.op.mean(d.monetary),
        totalRevenue: d => aq.op.sum(d.monetary),
      })
      .orderby(aq.desc('totalRevenue'));
    
    return {
      customers: rfm.objects(),
      segments: segmentStats.objects(),
      distribution: this.calculateDistribution(rfm),
    };
  }
  
  // 코호트 분석 (피벗 + 집계)
  async calculateCohortRetention(orders: any[]): Promise<CohortResult> {
    const dt = aq.from(orders);
    
    const cohorts = dt
      .derive({
        orderMonth: d => aq.op.month(d.orderDate),
        orderYear: d => aq.op.year(d.orderDate),
      })
      .groupby('customerId')
      .derive({
        cohortMonth: d => aq.op.min(d.orderMonth),
        cohortYear: d => aq.op.min(d.orderYear),
      })
      .derive({
        monthsAfterJoin: d => 
          (d.orderYear - d.cohortYear) * 12 + (d.orderMonth - d.cohortMonth)
      })
      .groupby(['cohortYear', 'cohortMonth', 'monthsAfterJoin'])
      .rollup({
        uniqueCustomers: d => aq.op.distinct(d.customerId),
        revenue: d => aq.op.sum(d.amount),
      });
    
    // 피벗 테이블 생성
    const pivoted = cohorts.pivot('monthsAfterJoin', 'uniqueCustomers');
    
    return {
      cohortTable: pivoted.objects(),
      retentionRates: this.calculateRetentionRates(pivoted),
      ltv: this.calculateCohortLTV(cohorts),
    };
  }
}
```

#### 2.3.2 Web Workers (병렬 처리)
```
패키지: comlink, workerize-loader
용도: 메인 스레드 블로킹 방지
장점:
  ✅ UI 반응성 유지
  ✅ 멀티코어 활용
  ✅ 백그라운드 계산
적용 영역:
  - 대규모 데이터 집계
  - 복잡한 예측 모델 실행
  - 시각화 데이터 전처리
```

```typescript
// 예시: Comlink 기반 Web Worker 분석
// analytics.worker.ts
import * as Comlink from 'comlink';
import * as aq from 'arquero';

const analyticsWorker = {
  async heavyAnalysis(data: any[], config: AnalysisConfig): Promise<AnalysisResult> {
    // 메인 스레드 블로킹 없이 무거운 계산 수행
    const dt = aq.from(data);
    
    const results = await Promise.all([
      this.calculateRFM(dt),
      this.detectAnomalies(dt),
      this.runClustering(dt),
      this.calculateForecasts(dt),
    ]);
    
    return {
      rfm: results[0],
      anomalies: results[1],
      clusters: results[2],
      forecasts: results[3],
    };
  },
};

Comlink.expose(analyticsWorker);

// 메인 스레드에서 사용
const worker = new Worker(new URL('./analytics.worker.ts', import.meta.url));
const analytics = Comlink.wrap<typeof analyticsWorker>(worker);

// 비동기로 무거운 분석 실행 (UI 블로킹 없음)
const results = await analytics.heavyAnalysis(bigData, config);
```

#### 2.3.3 IndexedDB + Dexie (클라이언트 캐싱)
```
패키지: dexie, idb
용도: 브라우저 내 대용량 데이터 저장
장점:
  ✅ GB 단위 저장 가능
  ✅ 인덱싱, 쿼리 지원
  ✅ 오프라인 지원
적용 영역:
  - 분석 결과 캐싱
  - 오프라인 대시보드
  - 대용량 데이터 로컬 저장
```

```typescript
// 예시: Dexie 기반 분석 캐시
import Dexie from 'dexie';

class AnalyticsCache extends Dexie {
  forecasts!: Dexie.Table<ForecastCache, string>;
  insights!: Dexie.Table<InsightCache, string>;
  rfmSegments!: Dexie.Table<RFMCache, string>;
  
  constructor() {
    super('BusinessBrainCache');
    this.version(1).stores({
      forecasts: 'id, metric, createdAt, expiresAt',
      insights: 'id, type, createdAt, priority',
      rfmSegments: 'customerId, segment, score, updatedAt',
    });
  }
  
  async getCachedForecast(metric: string, maxAge: number = 3600000): Promise<ForecastCache | null> {
    const cached = await this.forecasts
      .where('metric')
      .equals(metric)
      .and(item => Date.now() - item.createdAt < maxAge)
      .first();
    return cached || null;
  }
  
  async cacheForecasts(forecasts: ForecastCache[]): Promise<void> {
    await this.transaction('rw', this.forecasts, async () => {
      await this.forecasts.bulkPut(forecasts);
      // 만료된 캐시 정리
      await this.forecasts
        .where('expiresAt')
        .below(Date.now())
        .delete();
    });
  }
}
```

### 2.4 AI 에이전트 오케스트레이션

#### 2.4.1 LangChain.js (AI 에이전트)
```
패키지: langchain, @langchain/openai
용도: 복잡한 AI 워크플로우 오케스트레이션
장점:
  ✅ 멀티스텝 추론 (Chain of Thought)
  ✅ 도구 사용 에이전트
  ✅ 메모리 관리
  ✅ 구조화된 출력
적용 영역:
  - 자연어 쿼리 → 분석 실행
  - 자동 인사이트 생성
  - 전략 추천
  - 보고서 작성
```

```typescript
// 예시: LangChain 기반 경영 인사이트 에이전트
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

class BusinessInsightAgent {
  private agent: AgentExecutor;
  
  constructor() {
    const llm = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview",
      temperature: 0.3,
    });
    
    const tools = [
      new DynamicStructuredTool({
        name: "analyze_revenue",
        description: "매출 데이터를 분석하고 트렌드를 파악합니다",
        schema: z.object({
          startDate: z.string().describe("시작일 (YYYY-MM-DD)"),
          endDate: z.string().describe("종료일 (YYYY-MM-DD)"),
          granularity: z.enum(["daily", "weekly", "monthly"]),
        }),
        func: async ({ startDate, endDate, granularity }) => {
          const result = await this.revenueAnalyzer.analyze(startDate, endDate, granularity);
          return JSON.stringify(result);
        },
      }),
      new DynamicStructuredTool({
        name: "predict_churn",
        description: "이탈 위험 고객을 예측합니다",
        schema: z.object({
          threshold: z.number().describe("위험도 임계값 (0-1)"),
          limit: z.number().optional().describe("반환할 최대 고객 수"),
        }),
        func: async ({ threshold, limit }) => {
          const result = await this.churnPredictor.predict(threshold, limit);
          return JSON.stringify(result);
        },
      }),
      new DynamicStructuredTool({
        name: "compare_segments",
        description: "고객 세그먼트를 비교 분석합니다",
        schema: z.object({
          segments: z.array(z.string()).describe("비교할 세그먼트 목록"),
          metrics: z.array(z.string()).describe("비교할 지표 목록"),
        }),
        func: async ({ segments, metrics }) => {
          const result = await this.segmentAnalyzer.compare(segments, metrics);
          return JSON.stringify(result);
        },
      }),
      // ... 더 많은 도구
    ];
    
    this.agent = await createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt: this.getSystemPrompt(),
    });
  }
  
  async processQuery(query: string, context: BusinessContext): Promise<InsightResponse> {
    const result = await this.agent.invoke({
      input: query,
      context: JSON.stringify(context),
    });
    
    return {
      answer: result.output,
      toolsUsed: result.intermediateSteps.map(s => s.action.tool),
      data: this.extractData(result),
      followUpQuestions: this.generateFollowUps(query, result),
    };
  }
  
  private getSystemPrompt() {
    return `당신은 비즈니스 인텔리전스 전문가입니다. 
    사용자의 질문에 답하기 위해 제공된 도구를 활용하여 데이터를 분석하고,
    실행 가능한 인사이트를 제공합니다.
    
    답변 시 주의사항:
    1. 항상 데이터 기반의 근거를 제시하세요
    2. 불확실성이 있다면 신뢰 수준을 명시하세요
    3. 가능하면 구체적인 액션을 제안하세요
    4. 중요한 수치는 강조하세요`;
  }
}
```

#### 2.4.2 벡터 검색 (Semantic Search)
```
패키지: @pinecone-database/pinecone, hnswlib-node
용도: 유사 인사이트/케이스 검색
장점:
  ✅ 시맨틱 검색 (의미 기반)
  ✅ 과거 유사 사례 검색
  ✅ 추천 시스템
적용 영역:
  - 과거 유사 상황 검색
  - 관련 인사이트 추천
  - 벤치마크 케이스 찾기
```

```typescript
// 예시: 벡터 검색 기반 유사 인사이트 검색
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from "@langchain/openai";

class InsightVectorSearch {
  private pinecone: Pinecone;
  private embeddings: OpenAIEmbeddings;
  
  async findSimilarInsights(query: string, k: number = 5): Promise<SimilarInsight[]> {
    // 쿼리 임베딩 생성
    const queryEmbedding = await this.embeddings.embedQuery(query);
    
    // 벡터 검색
    const results = await this.pinecone.index('business-insights').query({
      vector: queryEmbedding,
      topK: k,
      includeMetadata: true,
    });
    
    return results.matches.map(match => ({
      id: match.id,
      similarity: match.score,
      insight: match.metadata.content,
      date: match.metadata.date,
      outcome: match.metadata.outcome,
      relatedActions: match.metadata.actions,
    }));
  }
  
  async findSimilarSituations(currentMetrics: BusinessMetrics): Promise<HistoricalCase[]> {
    // 현재 비즈니스 상황을 설명하는 텍스트 생성
    const situationDescription = this.describeSituation(currentMetrics);
    
    // 유사한 역사적 상황 검색
    const similarCases = await this.findSimilarInsights(situationDescription, 10);
    
    return similarCases.map(case_ => ({
      ...case_,
      successfulActions: this.extractSuccessfulActions(case_),
      lessonLearned: case_.insight.lessonLearned,
    }));
  }
}
```

### 2.5 실시간 데이터 스트리밍

#### 2.5.1 Socket.io (양방향 실시간 통신)
```
패키지: socket.io, socket.io-client
용도: 실시간 대시보드 업데이트
장점:
  ✅ 양방향 통신
  ✅ 자동 재연결
  ✅ 룸/네임스페이스 지원
  ✅ 폴백 (Long polling)
적용 영역:
  - 실시간 KPI 업데이트
  - 실시간 경보
  - 라이브 분석 결과
```

```typescript
// 예시: Socket.io 기반 실시간 대시보드
// backend: real-time-service.ts
import { Server } from 'socket.io';

class RealTimeBusinessService {
  private io: Server;
  private metricsCache: Map<string, any> = new Map();
  
  constructor(server: any) {
    this.io = new Server(server, {
      cors: { origin: '*' },
    });
    
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // 구독 설정
      socket.on('subscribe:metrics', (metrics: string[]) => {
        metrics.forEach(m => socket.join(`metric:${m}`));
        // 현재 캐시된 데이터 전송
        this.sendCachedMetrics(socket, metrics);
      });
      
      socket.on('subscribe:alerts', () => {
        socket.join('alerts');
      });
    });
    
    // 주기적 메트릭 업데이트 (5초마다)
    setInterval(() => this.broadcastMetricUpdates(), 5000);
    
    // 경보 체크 (30초마다)
    setInterval(() => this.checkAndBroadcastAlerts(), 30000);
  }
  
  private async broadcastMetricUpdates() {
    const metrics = await this.fetchLatestMetrics();
    
    for (const [key, value] of Object.entries(metrics)) {
      this.io.to(`metric:${key}`).emit('metric:update', {
        metric: key,
        value,
        timestamp: Date.now(),
        trend: this.calculateTrend(key, value),
      });
    }
  }
  
  private async checkAndBroadcastAlerts() {
    const alerts = await this.alertEngine.check();
    if (alerts.length > 0) {
      this.io.to('alerts').emit('alerts:new', alerts);
    }
  }
}

// frontend: useRealTimeMetrics.ts
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function useRealTimeMetrics(metrics: string[]) {
  const [data, setData] = useState<Record<string, MetricValue>>({});
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL);
    
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('subscribe:metrics', metrics);
    });
    
    socket.on('metric:update', (update: MetricUpdate) => {
      setData(prev => ({
        ...prev,
        [update.metric]: {
          value: update.value,
          timestamp: update.timestamp,
          trend: update.trend,
        },
      }));
    });
    
    socket.on('disconnect', () => setConnected(false));
    
    return () => { socket.disconnect(); };
  }, [metrics]);
  
  return { data, connected };
}
```

### 2.6 보고서 생성 도구

#### 2.6.1 PDF 생성 (jsPDF + html2canvas)
```
패키지: jspdf, html2canvas
용도: 분석 결과 PDF 내보내기
장점:
  ✅ 클라이언트 사이드 생성
  ✅ 차트 이미지 포함
  ✅ 커스텀 레이아웃
```

```typescript
// 예시: 고급 보고서 생성기
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class AdvancedReportGenerator {
  async generateExecutiveReport(
    data: ReportData,
    options: ReportOptions
  ): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // 표지
    await this.addCoverPage(pdf, data.title, data.date);
    
    // 목차
    pdf.addPage();
    this.addTableOfContents(pdf, data.sections);
    
    // 경영진 요약
    pdf.addPage();
    await this.addExecutiveSummary(pdf, data.summary);
    
    // 핵심 지표 대시보드 (캡처)
    pdf.addPage();
    const dashboardElement = document.getElementById('kpi-dashboard');
    const dashboardCanvas = await html2canvas(dashboardElement!, { scale: 2 });
    pdf.addImage(dashboardCanvas.toDataURL('image/png'), 'PNG', 10, 30, 190, 100);
    
    // 상세 분석 섹션들
    for (const section of data.sections) {
      pdf.addPage();
      await this.addAnalysisSection(pdf, section);
    }
    
    // 액션 아이템
    pdf.addPage();
    await this.addActionItems(pdf, data.actions);
    
    // 부록 (데이터 테이블)
    if (options.includeAppendix) {
      pdf.addPage();
      await this.addDataAppendix(pdf, data.tables);
    }
    
    return pdf.output('blob');
  }
  
  private async addExecutiveSummary(pdf: jsPDF, summary: ExecutiveSummary) {
    pdf.setFontSize(18);
    pdf.text('경영진 요약', 20, 20);
    
    pdf.setFontSize(11);
    let y = 35;
    
    // 핵심 발견
    pdf.setFontSize(14);
    pdf.text('핵심 발견', 20, y);
    y += 10;
    
    for (const finding of summary.keyFindings) {
      const icon = finding.sentiment === 'positive' ? '✅' : 
                   finding.sentiment === 'negative' ? '⚠️' : '📊';
      pdf.setFontSize(10);
      pdf.text(`${icon} ${finding.text}`, 25, y);
      y += 8;
    }
    
    // 권장 액션
    y += 10;
    pdf.setFontSize(14);
    pdf.text('권장 액션', 20, y);
    y += 10;
    
    for (const action of summary.recommendedActions) {
      const priority = action.priority === 'high' ? '🔴' : 
                       action.priority === 'medium' ? '🟡' : '🟢';
      pdf.setFontSize(10);
      pdf.text(`${priority} ${action.description}`, 25, y);
      pdf.text(`예상 효과: ${action.expectedImpact}`, 30, y + 5);
      y += 15;
    }
  }
}
```

#### 2.6.2 Excel 내보내기 (ExcelJS)
```
패키지: exceljs
용도: 상세 데이터 Excel 내보내기
장점:
  ✅ 서식, 차트 지원
  ✅ 여러 시트
  ✅ 수식 지원
```

```typescript
// 예시: Excel 분석 보고서 생성
import ExcelJS from 'exceljs';

class ExcelReportGenerator {
  async generateAnalysisWorkbook(data: AnalysisData): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();
    workbook.creator = 'Business Brain';
    
    // 대시보드 시트
    const dashboard = workbook.addWorksheet('대시보드', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });
    this.addDashboardSheet(dashboard, data.kpis);
    
    // 매출 분석 시트
    const revenue = workbook.addWorksheet('매출 분석');
    this.addRevenueSheet(revenue, data.revenue);
    this.addSparklineChart(revenue, data.revenue.trend);
    
    // 고객 분석 시트
    const customers = workbook.addWorksheet('고객 분석');
    this.addCustomerSheet(customers, data.customers);
    
    // 예측 시트
    const forecast = workbook.addWorksheet('예측');
    this.addForecastSheet(forecast, data.forecasts);
    
    // 피벗 테이블 데이터 시트
    const rawData = workbook.addWorksheet('원본 데이터');
    this.addRawDataSheet(rawData, data.raw);
    
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }
  
  private addDashboardSheet(sheet: ExcelJS.Worksheet, kpis: KPIData[]) {
    // 헤더 스타일
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      alignment: { horizontal: 'center' },
    };
    
    // KPI 카드 형식으로 배치
    let col = 1;
    for (const kpi of kpis) {
      sheet.getCell(1, col).value = kpi.name;
      sheet.getCell(1, col).style = headerStyle;
      sheet.getCell(2, col).value = kpi.value;
      sheet.getCell(2, col).numFmt = kpi.format;
      sheet.getCell(3, col).value = kpi.change;
      sheet.getCell(3, col).font = { 
        color: { argb: kpi.change >= 0 ? 'FF00B050' : 'FFFF0000' } 
      };
      col += 2;
    }
    
    // 조건부 서식
    sheet.addConditionalFormatting({
      ref: 'A3:J3',
      rules: [
        {
          type: 'cellIs',
          operator: 'lessThan',
          formulae: [0],
          style: { font: { color: { argb: 'FFFF0000' } } },
        },
      ],
    });
  }
}
```

---

## 3. 혁신 비전: "Minority Report for Business"

### 2.1 비전 선언

> **"비즈니스 문제가 발생하기 전에 예측하고, 기회가 사라지기 전에 포착하며, 
> 의사결정의 결과를 미리 시뮬레이션하여 최적의 경영 전략을 제시하는 
> 예측적 경영 인텔리전스 시스템"**

### 2.2 핵심 패러다임 전환

```
현재 (Descriptive + Diagnostic)
"무엇이 일어났고, 왜 일어났는가?"
     ↓
목표 (Predictive + Prescriptive)
"무엇이 일어날 것이며, 어떻게 대응해야 하는가?"
```

### 2.3 차별화 포인트

| 영역 | 현재 | 목표 |
|------|------|------|
| **예측** | 단순 트렌드 추정 | 확률적 시나리오 예측 |
| **인사이트** | 발견 후 알림 | 발생 전 예측 경보 |
| **액션** | 제안 목록 | 자동화된 실행 + 결과 추적 |
| **의사결정** | 데이터 제공 | 시뮬레이션 기반 권고 |
| **UX** | 분석 도구 | 경영 비서 인터페이스 |

---

## 3. 핵심 개선 모듈 설계

### 3.1 Module 1: 예측 정확도 혁신 시스템

#### 3.1.1 다중 모델 앙상블 예측

```typescript
// backend/src/services/analytics/AdvancedForecastEngine.ts

interface ForecastModel {
  name: string
  weight: number
  predict: (data: TimeSeries) => Prediction
  evaluate: (actual: number[], predicted: number[]) => ModelMetrics
}

class AdvancedForecastEngine {
  private models: ForecastModel[] = [
    new ARIMAModel(),           // 시계열 자기회귀
    new ProphetModel(),         // 계절성 + 트렌드 + 휴일
    new LSTMModel(),            // 딥러닝 기반
    new XGBoostModel(),         // 그래디언트 부스팅
  ]
  
  async forecast(data: any[], days: number): Promise<EnhancedForecast> {
    // 1. 각 모델별 예측
    const predictions = await Promise.all(
      this.models.map(m => m.predict(data))
    )
    
    // 2. 모델 성능 기반 가중치 조정
    const weights = this.calculateDynamicWeights()
    
    // 3. 앙상블 결합
    const ensemble = this.combineEnsemble(predictions, weights)
    
    // 4. 신뢰 구간 계산 (Bootstrap)
    const confidenceIntervals = this.bootstrapCI(ensemble)
    
    // 5. 예측 근거 설명 생성
    const explanation = this.generateExplanation(ensemble)
    
    return {
      predictions: ensemble.values,
      confidenceIntervals: {
        lower95: confidenceIntervals.lower,
        upper95: confidenceIntervals.upper,
        lower80: confidenceIntervals.lower80,
        upper80: confidenceIntervals.upper80,
      },
      modelContributions: this.getModelContributions(),
      accuracy: {
        mape: ensemble.metrics.mape,
        rmse: ensemble.metrics.rmse,
        r2: ensemble.metrics.r2,
      },
      explanation,
    }
  }
}
```

#### 3.1.2 예측 성과 추적 시스템

```typescript
// backend/src/services/analytics/ForecastTracker.ts

interface ForecastRecord {
  id: string
  createdAt: Date
  metric: string
  period: { start: Date, end: Date }
  predicted: number
  confidence: number
  confidenceInterval: { lower: number, upper: number }
}

interface ForecastEvaluation {
  record: ForecastRecord
  actual: number
  error: number
  absoluteError: number
  withinCI: boolean
}

class ForecastTracker {
  // 예측 기록 저장
  async saveForecast(forecast: ForecastRecord): Promise<void>
  
  // 예측 vs 실제 비교
  async evaluateForecasts(period: DateRange): Promise<ForecastEvaluation[]>
  
  // 모델 정확도 대시보드
  async getAccuracyDashboard(): Promise<{
    overallMAPE: number
    byMetric: Record<string, { mape: number, bias: number }>
    trend: { date: string, accuracy: number }[]
    recommendations: string[]
  }>
}
```

### 3.2 Module 2: 예측적 경보 시스템 (Predictive Alerts)

#### 3.2.1 이상 징후 조기 감지

```typescript
// backend/src/services/analytics/PredictiveAlertEngine.ts

interface AlertConfig {
  metric: string
  thresholds: {
    warning: number
    critical: number
  }
  predictionHorizon: number // 며칠 앞을 예측할지
  confidenceThreshold: number
}

interface PredictiveAlert {
  id: string
  type: 'warning' | 'critical'
  category: 'revenue' | 'customer' | 'artist' | 'operations'
  title: string
  description: string
  probability: number
  expectedDate: Date
  currentValue: number
  predictedValue: number
  impactAssessment: {
    metric: string
    potentialLoss: number
    affectedCustomers: number
  }
  recommendedActions: Array<{
    action: string
    priority: 'immediate' | 'high' | 'medium'
    expectedEffect: string
    effort: 'low' | 'medium' | 'high'
  }>
  relatedInsights: string[]
}

class PredictiveAlertEngine {
  private alertConfigs: AlertConfig[] = [
    {
      metric: 'gmv',
      thresholds: { warning: -15, critical: -30 },
      predictionHorizon: 7,
      confidenceThreshold: 0.7,
    },
    {
      metric: 'churn_rate',
      thresholds: { warning: 20, critical: 35 },
      predictionHorizon: 14,
      confidenceThreshold: 0.75,
    },
    {
      metric: 'vip_engagement',
      thresholds: { warning: -20, critical: -40 },
      predictionHorizon: 7,
      confidenceThreshold: 0.7,
    },
    // ... 더 많은 설정
  ]
  
  async generatePredictiveAlerts(): Promise<PredictiveAlert[]> {
    const alerts: PredictiveAlert[] = []
    
    for (const config of this.alertConfigs) {
      // 1. 미래 예측
      const forecast = await this.forecastEngine.predict(config.metric, config.predictionHorizon)
      
      // 2. 임계값 초과 예측 시 경보 생성
      if (forecast.confidence >= config.confidenceThreshold) {
        const exceedsWarning = this.checkThresholdExceedance(forecast, config.thresholds.warning)
        const exceedsCritical = this.checkThresholdExceedance(forecast, config.thresholds.critical)
        
        if (exceedsWarning || exceedsCritical) {
          // 3. 원인 분석
          const rootCause = await this.analyzeRootCause(config.metric, forecast)
          
          // 4. 영향 평가
          const impact = await this.assessImpact(config.metric, forecast)
          
          // 5. 액션 제안
          const actions = await this.generateActions(rootCause, impact)
          
          alerts.push({
            type: exceedsCritical ? 'critical' : 'warning',
            // ... 나머지 필드
          })
        }
      }
    }
    
    return this.prioritizeAlerts(alerts)
  }
}
```

#### 3.2.2 실시간 알림 시스템

```typescript
// backend/src/services/notifications/AlertNotificationService.ts

interface NotificationChannel {
  type: 'email' | 'slack' | 'push' | 'sms'
  config: Record<string, any>
  send: (alert: PredictiveAlert) => Promise<void>
}

interface NotificationRule {
  alertType: 'warning' | 'critical'
  category: string[]
  channels: NotificationChannel[]
  recipients: string[]
  cooldown: number // 같은 경보 재발송 방지 (분)
}

class AlertNotificationService {
  private rules: NotificationRule[]
  private sentAlerts: Map<string, Date> = new Map()
  
  async processAlert(alert: PredictiveAlert): Promise<void> {
    // 1. 해당하는 규칙 찾기
    const applicableRules = this.findApplicableRules(alert)
    
    // 2. 쿨다운 체크
    if (this.isInCooldown(alert.id)) return
    
    // 3. 알림 발송
    for (const rule of applicableRules) {
      for (const channel of rule.channels) {
        await channel.send(alert)
      }
    }
    
    // 4. 발송 기록
    this.sentAlerts.set(alert.id, new Date())
  }
  
  // Slack 웹훅 연동
  private async sendSlackAlert(alert: PredictiveAlert): Promise<void> {
    const blocks = this.formatSlackBlocks(alert)
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({ blocks }),
    })
  }
}
```

### 3.3 Module 3: 지능형 의사결정 지원 시스템

#### 3.3.1 시나리오 시뮬레이션 엔진 강화

```typescript
// backend/src/services/analytics/AdvancedSimulator.ts

interface SimulationScenario {
  id: string
  name: string
  type: 'what_if' | 'stress_test' | 'optimization'
  variables: Array<{
    name: string
    baseValue: number
    distribution: 'normal' | 'uniform' | 'triangular'
    params: Record<string, number>
  }>
  constraints: Array<{
    variable: string
    type: 'min' | 'max' | 'range'
    value: number | [number, number]
  }>
  objectives: Array<{
    metric: string
    direction: 'maximize' | 'minimize'
    weight: number
  }>
}

interface SimulationResult {
  scenario: SimulationScenario
  iterations: number
  results: {
    mean: Record<string, number>
    median: Record<string, number>
    percentiles: Record<string, { p5: number, p25: number, p75: number, p95: number }>
    distribution: Record<string, number[]>
  }
  sensitivity: Array<{
    variable: string
    impact: number
    elasticity: number
    ranking: number
  }>
  riskMetrics: {
    valueAtRisk: number // 95% VaR
    conditionalVaR: number // CVaR
    probabilityOfLoss: number
  }
  recommendations: Array<{
    type: 'optimization' | 'risk_mitigation' | 'opportunity'
    description: string
    expectedImpact: number
    confidence: number
  }>
}

class AdvancedSimulator {
  // 몬테카를로 시뮬레이션
  async runMonteCarloSimulation(
    scenario: SimulationScenario,
    iterations: number = 10000
  ): Promise<SimulationResult> {
    const results: number[][] = []
    
    for (let i = 0; i < iterations; i++) {
      // 변수별 샘플링
      const sample = this.sampleVariables(scenario.variables)
      
      // 제약 조건 적용
      const constrained = this.applyConstraints(sample, scenario.constraints)
      
      // 결과 계산
      const outcome = await this.calculateOutcome(constrained)
      results.push(outcome)
    }
    
    return this.analyzeSimulationResults(results, scenario)
  }
  
  // 민감도 분석
  async runSensitivityAnalysis(
    scenario: SimulationScenario
  ): Promise<SensitivityAnalysis> {
    const baseCase = await this.calculateOutcome(scenario.variables.map(v => v.baseValue))
    const sensitivities = []
    
    for (const variable of scenario.variables) {
      // ±10% 변화 시 영향 측정
      const lowCase = await this.calculateOutcome(
        this.adjustVariable(scenario.variables, variable.name, -0.1)
      )
      const highCase = await this.calculateOutcome(
        this.adjustVariable(scenario.variables, variable.name, 0.1)
      )
      
      sensitivities.push({
        variable: variable.name,
        impact: (highCase[0] - lowCase[0]) / (2 * 0.1 * variable.baseValue),
        elasticity: ((highCase[0] - baseCase[0]) / baseCase[0]) / 0.1,
      })
    }
    
    return { sensitivities, tornado: this.generateTornadoChart(sensitivities) }
  }
  
  // 최적화
  async findOptimalStrategy(
    scenario: SimulationScenario
  ): Promise<OptimizationResult> {
    // 유전 알고리즘 기반 최적화
    const population = this.initializePopulation(scenario)
    
    for (let gen = 0; gen < 100; gen++) {
      const fitness = await Promise.all(
        population.map(ind => this.evaluateFitness(ind, scenario))
      )
      
      const selected = this.selection(population, fitness)
      const offspring = this.crossoverAndMutate(selected)
      population.splice(0, population.length, ...offspring)
    }
    
    return this.extractBestSolution(population, scenario)
  }
}
```

#### 3.3.2 의사결정 매트릭스

```typescript
// backend/src/services/analytics/DecisionMatrix.ts

interface DecisionOption {
  id: string
  name: string
  description: string
  category: 'growth' | 'efficiency' | 'risk_mitigation' | 'innovation'
  implementation: {
    effort: 'low' | 'medium' | 'high'
    timeline: string
    cost: number
    resources: string[]
  }
  expectedOutcomes: Array<{
    metric: string
    impact: number // % change
    probability: number
    timeToRealize: string
  }>
  risks: Array<{
    description: string
    probability: number
    impact: number
    mitigation: string
  }>
}

interface DecisionAnalysis {
  options: DecisionOption[]
  comparison: {
    matrix: Array<{
      option: string
      roi: number
      riskAdjustedReturn: number
      timeToBreakeven: number
      strategicAlignment: number
      overallScore: number
    }>
    recommendation: {
      primary: string
      rationale: string
      alternatives: string[]
      warnings: string[]
    }
  }
  tradeoffs: Array<{
    option1: string
    option2: string
    tradeoffDescription: string
    breakEvenPoint: Record<string, number>
  }>
}

class DecisionMatrixEngine {
  async analyzeDecisionOptions(
    options: DecisionOption[],
    businessContext: BusinessContext
  ): Promise<DecisionAnalysis> {
    // 1. 각 옵션별 기대 수익 계산
    const expectedReturns = await Promise.all(
      options.map(opt => this.calculateExpectedReturn(opt))
    )
    
    // 2. 리스크 조정 수익률 계산
    const riskAdjusted = options.map((opt, idx) => 
      this.calculateRiskAdjustedReturn(opt, expectedReturns[idx])
    )
    
    // 3. 전략적 정합성 평가
    const strategicAlignment = options.map(opt =>
      this.evaluateStrategicAlignment(opt, businessContext)
    )
    
    // 4. 종합 점수 산출
    const scores = this.calculateOverallScores(
      expectedReturns, riskAdjusted, strategicAlignment
    )
    
    // 5. 추천 생성
    const recommendation = this.generateRecommendation(options, scores)
    
    return {
      options,
      comparison: {
        matrix: this.buildComparisonMatrix(options, scores),
        recommendation,
      },
      tradeoffs: this.analyzeTradeoffs(options),
    }
  }
}
```

### 3.4 Module 4: 목표 기반 경영 대시보드

#### 3.4.1 OKR/KPI 추적 시스템

```typescript
// backend/src/services/analytics/GoalTracker.ts

interface BusinessGoal {
  id: string
  name: string
  type: 'okr' | 'kpi' | 'milestone'
  category: 'revenue' | 'growth' | 'efficiency' | 'quality'
  target: {
    value: number
    unit: string
    deadline: Date
  }
  baseline: {
    value: number
    date: Date
  }
  milestones: Array<{
    date: Date
    expectedValue: number
  }>
  owner: string
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved'
}

interface GoalProgress {
  goal: BusinessGoal
  current: {
    value: number
    date: Date
  }
  progress: number // 0-100%
  trend: 'accelerating' | 'on_pace' | 'slowing' | 'declining'
  forecast: {
    predictedFinalValue: number
    achievementProbability: number
    predictedDate: Date | null
  }
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral'
    message: string
    suggestedAction?: string
  }>
}

class GoalTracker {
  async trackGoalProgress(goals: BusinessGoal[]): Promise<GoalProgress[]> {
    return Promise.all(goals.map(async goal => {
      // 1. 현재 값 조회
      const currentValue = await this.getCurrentValue(goal)
      
      // 2. 진행률 계산
      const progress = this.calculateProgress(goal, currentValue)
      
      // 3. 트렌드 분석
      const trend = await this.analyzeTrend(goal)
      
      // 4. 예측
      const forecast = await this.forecastGoalAchievement(goal, currentValue, trend)
      
      // 5. 인사이트 생성
      const insights = this.generateGoalInsights(goal, progress, trend, forecast)
      
      return {
        goal,
        current: { value: currentValue, date: new Date() },
        progress,
        trend,
        forecast,
        insights,
      }
    }))
  }
  
  // 목표 달성을 위한 액션 추천
  async recommendActionsForGoal(goal: BusinessGoal): Promise<ActionRecommendation[]> {
    const progress = await this.trackGoalProgress([goal])
    const gap = goal.target.value - progress[0].current.value
    
    // 갭을 메우기 위한 액션 분석
    const possibleActions = await this.identifyPossibleActions(goal.category)
    const scoredActions = possibleActions.map(action => ({
      ...action,
      impactOnGoal: this.estimateImpactOnGoal(action, goal),
      feasibility: this.assessFeasibility(action),
      priority: this.calculatePriority(action, gap),
    }))
    
    return scoredActions.sort((a, b) => b.priority - a.priority)
  }
}
```

#### 3.4.2 실시간 경영 대시보드

```typescript
// frontend/components/business-brain/CommandCenterDashboard.tsx

interface CommandCenterProps {
  userId: string
  refreshInterval: number // 초
}

const CommandCenterDashboard: React.FC<CommandCenterProps> = ({
  userId,
  refreshInterval,
}) => {
  // 실시간 데이터 구독
  const { data: liveMetrics } = useQuery({
    queryKey: ['live-metrics'],
    queryFn: () => businessBrainApi.getLiveMetrics(),
    refetchInterval: refreshInterval * 1000,
  })
  
  const { data: alerts } = useQuery({
    queryKey: ['predictive-alerts'],
    queryFn: () => businessBrainApi.getPredictiveAlerts(),
    refetchInterval: 60000, // 1분
  })
  
  const { data: goalProgress } = useQuery({
    queryKey: ['goal-progress'],
    queryFn: () => businessBrainApi.getGoalProgress(),
    refetchInterval: 300000, // 5분
  })
  
  return (
    <div className="grid grid-cols-12 gap-4 p-6">
      {/* 핵심 지표 - 대형 카드 */}
      <div className="col-span-12 lg:col-span-8">
        <LiveMetricsPanel metrics={liveMetrics} />
      </div>
      
      {/* 경보 패널 */}
      <div className="col-span-12 lg:col-span-4">
        <AlertsPanel alerts={alerts} />
      </div>
      
      {/* 목표 진행 상황 */}
      <div className="col-span-12">
        <GoalProgressStrip goals={goalProgress} />
      </div>
      
      {/* 예측 차트 */}
      <div className="col-span-12 lg:col-span-6">
        <PredictionChart />
      </div>
      
      {/* AI 어시스턴트 */}
      <div className="col-span-12 lg:col-span-6">
        <AIAssistantPanel />
      </div>
    </div>
  )
}
```

### 3.5 Module 5: 자연어 경영 비서 인터페이스

#### 3.5.1 대화형 분석 인터페이스

```typescript
// backend/src/services/agents/ConversationalBrainAgent.ts

interface ConversationContext {
  sessionId: string
  userId: string
  history: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    data?: any
  }>
  currentFocus?: {
    entity: string // 'revenue', 'customer', 'artist', 'product'
    entityId?: string
    timeRange?: DateRange
  }
  preferences: {
    detailLevel: 'summary' | 'detailed' | 'comprehensive'
    visualPreference: 'charts' | 'tables' | 'both'
    language: 'ko' | 'en'
  }
}

class ConversationalBrainAgent extends BusinessBrainAgent {
  private conversationContext: Map<string, ConversationContext> = new Map()
  
  async processNaturalLanguageQuery(
    sessionId: string,
    query: string
  ): Promise<ConversationResponse> {
    const context = this.getOrCreateContext(sessionId)
    
    // 1. 의도 파악
    const intent = await this.classifyIntent(query)
    
    // 2. 엔티티 추출
    const entities = await this.extractEntities(query)
    
    // 3. 컨텍스트 업데이트
    this.updateContext(context, intent, entities)
    
    // 4. 적절한 분석 실행
    const analysisResult = await this.executeAnalysis(intent, entities, context)
    
    // 5. 자연어 응답 생성
    const response = await this.generateNaturalResponse(
      query, analysisResult, context
    )
    
    // 6. 후속 질문 제안
    const followUpQuestions = this.suggestFollowUpQuestions(
      intent, entities, analysisResult
    )
    
    return {
      message: response,
      data: analysisResult,
      visualizations: this.generateVisualizations(analysisResult),
      followUpQuestions,
      confidence: analysisResult.confidence,
    }
  }
  
  // 예시 대화:
  // User: "지난 달 일본 시장 매출이 왜 떨어졌어?"
  // → Intent: 'revenue_analysis', Entities: {market: 'JP', period: 'last_month', direction: 'decrease'}
  // → 분석: 일본 시장 매출 분해, 원인 분석
  // → 응답: "일본 시장 매출이 15% 감소한 주요 원인은..."
}
```

#### 3.5.2 음성 인터페이스 (선택적)

```typescript
// frontend/hooks/useVoiceInterface.ts

interface VoiceInterfaceConfig {
  language: 'ko-KR' | 'en-US' | 'ja-JP'
  continuous: boolean
  interimResults: boolean
}

function useVoiceInterface(config: VoiceInterfaceConfig) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  
  const recognition = useMemo(() => {
    if (typeof window === 'undefined') return null
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    return new SpeechRecognition()
  }, [])
  
  const startListening = useCallback(() => {
    if (recognition) {
      recognition.lang = config.language
      recognition.continuous = config.continuous
      recognition.interimResults = config.interimResults
      recognition.start()
      setIsListening(true)
    }
  }, [recognition, config])
  
  // TTS로 응답 읽어주기
  const speakResponse = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = config.language
    speechSynthesis.speak(utterance)
  }, [config.language])
  
  return { isListening, transcript, startListening, speakResponse }
}
```

---

## 4. UI/UX 혁신 설계

### 4.1 정보 아키텍처 재설계

#### 현재 구조 (18개 탭 - 복잡함)
```
Business Brain
├── 개요
│   └── 대시보드
├── 고객 분석
│   ├── RFM 세분화
│   ├── 이탈 예측
│   ├── 신규 유저 유치
│   └── 재구매율 향상
├── 작가 분석
│   ├── 작가 건강도
│   └── 파레토 분석
├── 매출 분석
│   ├── 트렌드
│   ├── 매출 예측
│   └── 코호트 분석
├── 인사이트
│   ├── 기회 발견
│   ├── 리스크
│   ├── 전략 분석
│   └── 전략 제안
├── 고급 분석
│   ├── 이상 탐지
│   └── 기간별 추이
└── 액션
    ├── 액션 제안
    ├── What-if 시뮬레이션
    └── 리포트 생성
```

#### 제안 구조 (3개 메인 뷰 - 단순화)
```
Business Brain 2.0
│
├── 🎯 Command Center (메인 대시보드)
│   ├── 실시간 핵심 지표
│   ├── 예측 경보
│   ├── 목표 진행 상황
│   └── AI 어시스턴트
│
├── 📊 Deep Dive (심층 분석)
│   ├── 고객 인텔리전스
│   │   └── RFM, 이탈, 코호트, 재구매
│   ├── 작가 인텔리전스
│   │   └── 건강도, 파레토, 성과
│   ├── 매출 인텔리전스
│   │   └── 트렌드, 예측, 분해
│   └── 이상 탐지
│
├── 🚀 Action Hub (실행 센터)
│   ├── 우선순위별 액션
│   ├── 시뮬레이션
│   ├── 의사결정 매트릭스
│   └── 결과 추적
│
└── 💬 AI Assistant (대화형)
    └── 자연어 질의응답
```

### 4.2 Command Center 디자인

```tsx
// frontend/components/business-brain/CommandCenter.tsx

const CommandCenter = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 상단 경보 배너 */}
      <AlertBanner />
      
      {/* 핵심 지표 허브 */}
      <div className="grid grid-cols-4 gap-4 p-6">
        <MetricHubCard
          title="매출"
          current={liveMetrics.gmv}
          target={goals.gmv}
          trend={trends.gmv}
          prediction={predictions.gmv}
          alerts={alerts.filter(a => a.category === 'revenue')}
        />
        <MetricHubCard
          title="고객"
          current={liveMetrics.customers}
          target={goals.customers}
          trend={trends.customers}
          prediction={predictions.customers}
          alerts={alerts.filter(a => a.category === 'customer')}
        />
        <MetricHubCard
          title="작가"
          current={liveMetrics.activeArtists}
          target={goals.artists}
          trend={trends.artists}
          prediction={predictions.artists}
          alerts={alerts.filter(a => a.category === 'artist')}
        />
        <MetricHubCard
          title="운영"
          current={liveMetrics.efficiency}
          target={goals.operations}
          trend={trends.operations}
          prediction={predictions.operations}
          alerts={alerts.filter(a => a.category === 'operations')}
        />
      </div>
      
      {/* 예측 타임라인 */}
      <PredictionTimeline
        forecasts={forecasts}
        alerts={alerts}
        goals={goals}
      />
      
      {/* AI 인사이트 스트림 */}
      <InsightStream insights={insights} />
      
      {/* 빠른 액션 패널 */}
      <QuickActionPanel
        priorityActions={actions.slice(0, 5)}
        pendingDecisions={decisions.filter(d => d.status === 'pending')}
      />
    </div>
  )
}
```

### 4.3 시각화 개선

#### 4.3.1 예측 시각화
```tsx
// 신뢰 구간이 포함된 예측 차트
const PredictionChart = ({ forecast }: { forecast: EnhancedForecast }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={forecast.data}>
        {/* 95% 신뢰 구간 - 연한 색 영역 */}
        <Area
          dataKey="ci95"
          fill="rgba(59, 130, 246, 0.1)"
          stroke="none"
        />
        
        {/* 80% 신뢰 구간 - 중간 색 영역 */}
        <Area
          dataKey="ci80"
          fill="rgba(59, 130, 246, 0.2)"
          stroke="none"
        />
        
        {/* 실제 값 */}
        <Line
          dataKey="actual"
          stroke="#1e40af"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        
        {/* 예측 값 */}
        <Line
          dataKey="predicted"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ r: 3 }}
        />
        
        {/* 목표선 */}
        <ReferenceLine
          y={goal}
          stroke="#10b981"
          strokeDasharray="3 3"
          label="목표"
        />
        
        {/* 경보 임계선 */}
        <ReferenceLine
          y={warningThreshold}
          stroke="#f59e0b"
          strokeDasharray="3 3"
          label="주의"
        />
        
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
```

#### 4.3.2 의사결정 시각화
```tsx
// 토네이도 차트 (민감도 분석)
const TornadoChart = ({ sensitivities }: { sensitivities: Sensitivity[] }) => {
  const sorted = [...sensitivities].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
  
  return (
    <div className="space-y-2">
      {sorted.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="w-32 text-sm truncate">{item.variable}</span>
          <div className="flex-1 h-6 bg-slate-100 rounded relative">
            <div
              className={`absolute h-full rounded ${
                item.impact > 0 ? 'bg-emerald-500 left-1/2' : 'bg-red-500 right-1/2'
              }`}
              style={{ width: `${Math.abs(item.impact) * 50}%` }}
            />
            <div className="absolute inset-y-0 left-1/2 w-px bg-slate-300" />
          </div>
          <span className="w-16 text-sm text-right">
            {item.impact > 0 ? '+' : ''}{(item.impact * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}
```

---

## 5. 고급 분석 알고리즘 및 새로운 분석 모듈

### 5.1 고급 예측 알고리즘

#### 5.1.1 앙상블 시계열 예측 (Ensemble Time Series)

```typescript
// backend/src/services/analytics/EnsembleForecast.ts

interface EnsembleModel {
  name: string;
  weight: number;
  predict: (history: number[], periods: number) => Promise<PredictionResult>;
}

class EnsembleForecastEngine {
  private models: Map<string, EnsembleModel> = new Map([
    ['prophet', { name: 'Prophet', weight: 0.35, predict: this.prophetPredict }],
    ['arima', { name: 'ARIMA', weight: 0.25, predict: this.arimaPredict }],
    ['ets', { name: 'ETS', weight: 0.20, predict: this.etsPredict }],
    ['lstm', { name: 'LSTM', weight: 0.15, predict: this.lstmPredict }],
    ['naive', { name: 'Naive Seasonal', weight: 0.05, predict: this.naivePredict }],
  ]);
  
  // 동적 가중치 조정 (과거 성능 기반)
  private async adjustWeightsByPerformance(): Promise<void> {
    const backtest = await this.runBacktest(30); // 30일 백테스트
    
    const totalInverseError = Object.values(backtest.errors)
      .reduce((sum, err) => sum + 1 / err, 0);
    
    for (const [key, model] of this.models) {
      // 에러가 낮을수록 높은 가중치
      model.weight = (1 / backtest.errors[key]) / totalInverseError;
    }
  }
  
  async forecast(
    history: TimeSeriesData,
    periods: number,
    confidenceLevels: number[] = [0.80, 0.95]
  ): Promise<EnsembleForecastResult> {
    await this.adjustWeightsByPerformance();
    
    // 모든 모델 병렬 실행
    const predictions = await Promise.all(
      Array.from(this.models.entries()).map(async ([key, model]) => ({
        model: key,
        result: await model.predict(history.values, periods),
        weight: model.weight,
      }))
    );
    
    // 가중 평균 앙상블
    const ensembleMean = this.weightedAverage(predictions);
    
    // 부트스트랩 신뢰 구간
    const confidenceIntervals = await this.bootstrapConfidenceIntervals(
      history,
      periods,
      confidenceLevels,
      1000 // 1000번 부트스트랩
    );
    
    // 모델별 기여도 분석
    const contributions = predictions.map(p => ({
      model: p.model,
      weight: p.weight,
      deviation: this.calculateDeviation(p.result.values, ensembleMean),
    }));
    
    return {
      dates: this.generateFutureDates(history.endDate, periods),
      predictions: ensembleMean,
      confidenceIntervals,
      modelContributions: contributions,
      qualityMetrics: {
        backtestMAPE: await this.calculateBacktestMAPE(history),
        ensembleAgreement: this.calculateModelAgreement(predictions),
        trendStrength: this.analyzeTrendStrength(history),
      },
      explanation: await this.generateForecastExplanation(
        history,
        ensembleMean,
        contributions
      ),
    };
  }
  
  // 부트스트랩 신뢰 구간 계산
  private async bootstrapConfidenceIntervals(
    history: TimeSeriesData,
    periods: number,
    levels: number[],
    iterations: number
  ): Promise<ConfidenceIntervals> {
    const allPredictions: number[][] = [];
    
    for (let i = 0; i < iterations; i++) {
      // 리샘플링
      const resampledHistory = this.resampleWithReplacement(history);
      // 빠른 모델로 예측
      const quickForecast = await this.quickForecast(resampledHistory, periods);
      allPredictions.push(quickForecast);
    }
    
    // 각 기간별 분위수 계산
    const intervals: ConfidenceIntervals = {};
    for (const level of levels) {
      const lower = (1 - level) / 2;
      const upper = 1 - lower;
      
      intervals[level] = {
        lower: this.getPercentiles(allPredictions, lower),
        upper: this.getPercentiles(allPredictions, upper),
      };
    }
    
    return intervals;
  }
}
```

#### 5.1.2 변화점 탐지 (Changepoint Detection)

```typescript
// backend/src/services/analytics/ChangepointDetector.ts

interface Changepoint {
  date: Date;
  index: number;
  type: 'level_shift' | 'trend_change' | 'variance_change';
  magnitude: number;
  confidence: number;
  possibleCauses: string[];
}

class ChangepointDetector {
  // PELT 알고리즘 기반 변화점 탐지
  async detectChangepoints(
    data: number[],
    dates: Date[]
  ): Promise<Changepoint[]> {
    const changepoints: Changepoint[] = [];
    
    // 1. PELT (Pruned Exact Linear Time) 알고리즘
    const peltResults = this.peltAlgorithm(data, 'normal', 'MBIC');
    
    // 2. 각 변화점 분류
    for (const idx of peltResults) {
      const type = this.classifyChangepoint(data, idx);
      const magnitude = this.calculateMagnitude(data, idx, type);
      const confidence = this.calculateConfidence(data, idx);
      
      // 3. 원인 추론 (외부 이벤트 매칭)
      const possibleCauses = await this.inferCauses(dates[idx]);
      
      changepoints.push({
        date: dates[idx],
        index: idx,
        type,
        magnitude,
        confidence,
        possibleCauses,
      });
    }
    
    return changepoints;
  }
  
  private peltAlgorithm(
    data: number[],
    distribution: 'normal' | 'poisson',
    penalty: 'AIC' | 'BIC' | 'MBIC'
  ): number[] {
    const n = data.length;
    const K = this.calculatePenalty(n, penalty);
    
    // F[t] = 최소 비용 (0부터 t까지)
    const F: number[] = new Array(n + 1).fill(Infinity);
    F[0] = -K;
    
    // R[t] = t까지의 변화점 후보 집합
    const R: Set<number>[] = [new Set([0])];
    
    // cp[t] = t 시점에서의 마지막 변화점
    const cp: number[] = new Array(n + 1).fill(0);
    
    for (let t = 1; t <= n; t++) {
      const candidates: Array<{ tau: number; cost: number }> = [];
      
      for (const tau of R[t - 1]) {
        const segmentCost = this.segmentCost(data.slice(tau, t), distribution);
        const totalCost = F[tau] + segmentCost + K;
        candidates.push({ tau, cost: totalCost });
      }
      
      // 최소 비용 선택
      const best = candidates.reduce((a, b) => a.cost < b.cost ? a : b);
      F[t] = best.cost;
      cp[t] = best.tau;
      
      // Pruning: 비효율적인 후보 제거
      R.push(new Set(
        candidates
          .filter(c => c.cost <= F[t] + K)
          .map(c => c.tau)
      ));
      R[t].add(t);
    }
    
    // 변화점 역추적
    return this.backtrackChangepoints(cp, n);
  }
  
  // 비즈니스 이벤트와 변화점 연결
  private async inferCauses(date: Date): Promise<string[]> {
    const causes: string[] = [];
    
    // 1. 마케팅 캠페인 확인
    const campaigns = await this.checkCampaigns(date);
    if (campaigns.length > 0) {
      causes.push(...campaigns.map(c => `마케팅: ${c.name}`));
    }
    
    // 2. 가격 변경 확인
    const priceChanges = await this.checkPriceChanges(date);
    if (priceChanges.length > 0) {
      causes.push(...priceChanges.map(p => `가격변경: ${p.product} ${p.change}%`));
    }
    
    // 3. 외부 이벤트 확인
    const externalEvents = await this.checkExternalEvents(date);
    causes.push(...externalEvents);
    
    // 4. 계절성 이벤트
    const seasonalEvents = this.checkSeasonalEvents(date);
    causes.push(...seasonalEvents);
    
    return causes;
  }
}
```

#### 5.1.3 인과관계 분석 (Causal Analysis)

```typescript
// backend/src/services/analytics/CausalAnalyzer.ts

interface CausalRelation {
  cause: string;
  effect: string;
  strength: number; // -1 to 1
  lagDays: number;
  confidence: number;
  mechanism: string;
}

class CausalAnalyzer {
  // Granger 인과성 검정
  async grangerCausality(
    x: number[], // 원인 후보
    y: number[], // 결과
    maxLag: number = 7
  ): Promise<GrangerResult> {
    const results: GrangerLagResult[] = [];
    
    for (let lag = 1; lag <= maxLag; lag++) {
      // 제한 모델: y_t = a + sum(b_i * y_{t-i})
      const restricted = this.fitARModel(y, lag);
      
      // 비제한 모델: y_t = a + sum(b_i * y_{t-i}) + sum(c_i * x_{t-i})
      const unrestricted = this.fitVARModel(y, x, lag);
      
      // F-검정
      const fStat = this.calculateFStatistic(restricted, unrestricted, lag);
      const pValue = this.fTestPValue(fStat, lag, y.length - 2 * lag - 1);
      
      results.push({ lag, fStatistic: fStat, pValue });
    }
    
    // 최적 lag 선택 (AIC 기준)
    const bestLag = this.selectOptimalLag(results);
    
    return {
      causalityDetected: results[bestLag - 1].pValue < 0.05,
      optimalLag: bestLag,
      results,
      interpretation: this.interpretGrangerResult(results[bestLag - 1]),
    };
  }
  
  // 다변량 인과관계 발견
  async discoverCausalGraph(
    variables: Record<string, number[]>,
    names: string[]
  ): Promise<CausalGraph> {
    const n = names.length;
    const edges: CausalEdge[] = [];
    
    // PC 알고리즘 기반 구조 학습
    // 1. 완전 그래프에서 시작
    const adjacency = this.initializeFullGraph(n);
    
    // 2. 조건부 독립성 테스트로 엣지 제거
    for (let condSetSize = 0; condSetSize <= n - 2; condSetSize++) {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (!adjacency[i][j]) continue;
          
          const condSets = this.getConditioningSets(i, j, adjacency, condSetSize);
          
          for (const condSet of condSets) {
            const independent = await this.conditionalIndependenceTest(
              variables[names[i]],
              variables[names[j]],
              condSet.map(k => variables[names[k]])
            );
            
            if (independent) {
              adjacency[i][j] = false;
              adjacency[j][i] = false;
              break;
            }
          }
        }
      }
    }
    
    // 3. 엣지 방향 결정 (v-구조 및 Meek 규칙)
    const directedEdges = this.orientEdges(adjacency, variables);
    
    return {
      nodes: names,
      edges: directedEdges,
      visualization: this.generateGraphVisualization(names, directedEdges),
    };
  }
  
  // 인과 효과 추정 (DoWhy 스타일)
  async estimateCausalEffect(
    treatment: string,
    outcome: string,
    data: Record<string, number[]>,
    confounders: string[]
  ): Promise<CausalEffectEstimate> {
    // 1. 성향 점수 매칭
    const propensityScores = await this.estimatePropensityScores(
      data[treatment],
      confounders.map(c => data[c])
    );
    
    // 2. IPW (Inverse Probability Weighting)
    const ipwEffect = this.ipwEstimator(
      data[treatment],
      data[outcome],
      propensityScores
    );
    
    // 3. Doubly Robust 추정
    const drEffect = this.doublyRobustEstimator(
      data[treatment],
      data[outcome],
      propensityScores,
      confounders.map(c => data[c])
    );
    
    // 4. 부트스트랩 신뢰구간
    const bootstrapCI = await this.bootstrapCausalEffect(
      data,
      treatment,
      outcome,
      confounders,
      1000
    );
    
    return {
      treatment,
      outcome,
      ate: drEffect.ate, // 평균 처치 효과
      ci95: bootstrapCI,
      methods: {
        ipw: ipwEffect,
        doublyRobust: drEffect,
      },
      sensitivity: await this.sensitivityAnalysis(drEffect),
      interpretation: this.interpretCausalEffect(drEffect, treatment, outcome),
    };
  }
}
```

### 5.2 고급 고객 분석

#### 5.2.1 고객 생애 가치 예측 (CLV Prediction)

```typescript
// backend/src/services/analytics/CLVPredictor.ts

interface CLVPrediction {
  customerId: string;
  currentCLV: number;
  predictedCLV: number;
  probability: number;
  components: {
    expectedPurchases: number;
    expectedAOV: number;
    retentionProbability: number;
  };
  segment: string;
  recommendations: string[];
}

class CLVPredictor {
  // BG/NBD 모델 기반 CLV 예측
  async predictCLV(
    transactions: Transaction[],
    horizon: number = 365 // 예측 기간 (일)
  ): Promise<CLVPrediction[]> {
    // 1. RFM 피처 추출
    const rfmData = this.extractRFMFeatures(transactions);
    
    // 2. BG/NBD 파라미터 추정 (Maximum Likelihood)
    const bgNbdParams = await this.fitBGNBDModel(rfmData);
    
    // 3. Gamma-Gamma 모델로 금전적 가치 추정
    const gammaParams = await this.fitGammaGammaModel(rfmData);
    
    // 4. 각 고객별 CLV 계산
    const predictions: CLVPrediction[] = [];
    
    for (const customer of rfmData) {
      // 기대 거래 횟수
      const expectedPurchases = this.expectedTransactions(
        bgNbdParams,
        customer.frequency,
        customer.recency,
        customer.T,
        horizon
      );
      
      // 고객 생존 확률
      const alive = this.probabilityAlive(
        bgNbdParams,
        customer.frequency,
        customer.recency,
        customer.T
      );
      
      // 기대 평균 주문 금액
      const expectedAOV = this.expectedAverageValue(
        gammaParams,
        customer.monetary,
        customer.frequency
      );
      
      // CLV 계산
      const predictedCLV = expectedPurchases * expectedAOV * alive;
      
      // 세그먼트 분류
      const segment = this.classifyCLVSegment(
        predictedCLV,
        alive,
        customer.frequency
      );
      
      predictions.push({
        customerId: customer.customerId,
        currentCLV: customer.totalSpent,
        predictedCLV,
        probability: alive,
        components: {
          expectedPurchases,
          expectedAOV,
          retentionProbability: alive,
        },
        segment,
        recommendations: this.generateCLVRecommendations(
          segment,
          alive,
          expectedPurchases
        ),
      });
    }
    
    return predictions;
  }
  
  // BG/NBD 기대 거래 횟수
  private expectedTransactions(
    params: { r: number; alpha: number; a: number; b: number },
    x: number,
    tx: number,
    T: number,
    horizon: number
  ): number {
    const { r, alpha, a, b } = params;
    
    const term1 = (a + b + x - 1) / (a - 1);
    const term2 = 1 - Math.pow((alpha + T) / (alpha + T + horizon), r + x) *
      this.hypergeometric(r + x, b + x, a + b + x - 1, horizon / (alpha + T + horizon));
    
    return term1 * term2;
  }
  
  // 고객 생존 확률 (P(alive))
  private probabilityAlive(
    params: { r: number; alpha: number; a: number; b: number },
    x: number,
    tx: number,
    T: number
  ): number {
    const { r, alpha, a, b } = params;
    
    const A = this.gamma(a + b) * this.gamma(a + x) / 
              (this.gamma(a) * this.gamma(a + b + x));
    const B = Math.pow(alpha / (alpha + T), r) * Math.pow(alpha / (alpha + tx), x);
    
    return A * B / (A * B + (a / (a + b + x - 1)));
  }
}
```

#### 5.2.2 이탈 예측 강화 (Advanced Churn Prediction)

```typescript
// backend/src/services/analytics/AdvancedChurnPredictor.ts

interface ChurnPrediction {
  customerId: string;
  churnRisk: number;
  churnProbability: number;
  riskFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  predictedChurnDate: Date | null;
  interventions: Array<{
    action: string;
    expectedImpact: number;
    cost: number;
    roi: number;
  }>;
  shapValues: Record<string, number>;
}

class AdvancedChurnPredictor {
  private model: any; // XGBoost 또는 LightGBM
  
  // 다중 신호 기반 이탈 예측
  async predictChurn(
    customerId: string,
    features: CustomerFeatures
  ): Promise<ChurnPrediction> {
    // 1. 행동 특성 추출
    const behavioralFeatures = await this.extractBehavioralFeatures(customerId);
    
    // 2. 트랜잭션 특성 추출
    const transactionFeatures = await this.extractTransactionFeatures(customerId);
    
    // 3. 참여도 특성 추출
    const engagementFeatures = await this.extractEngagementFeatures(customerId);
    
    // 4. 피처 통합
    const allFeatures = {
      ...features,
      ...behavioralFeatures,
      ...transactionFeatures,
      ...engagementFeatures,
    };
    
    // 5. 모델 예측
    const prediction = await this.model.predict(allFeatures);
    const probability = prediction.probability;
    
    // 6. SHAP 설명
    const shapValues = await this.explainPrediction(allFeatures);
    
    // 7. 주요 리스크 요인 추출
    const riskFactors = this.extractRiskFactors(shapValues);
    
    // 8. 이탈 시점 예측 (생존 분석)
    const predictedChurnDate = await this.predictChurnTiming(
      customerId,
      probability
    );
    
    // 9. 개입 전략 생성
    const interventions = await this.generateInterventions(
      customerId,
      riskFactors,
      probability
    );
    
    return {
      customerId,
      churnRisk: this.categorizeRisk(probability),
      churnProbability: probability,
      riskFactors,
      predictedChurnDate,
      interventions,
      shapValues,
    };
  }
  
  // SHAP 기반 설명 생성
  private async explainPrediction(
    features: Record<string, number>
  ): Promise<Record<string, number>> {
    // TreeSHAP 알고리즘 (효율적인 SHAP 계산)
    const shapValues = await this.model.shapValues(features);
    
    // 피처 이름과 매핑
    const result: Record<string, number> = {};
    const featureNames = Object.keys(features);
    
    for (let i = 0; i < featureNames.length; i++) {
      result[featureNames[i]] = shapValues[i];
    }
    
    return result;
  }
  
  // 카플란-마이어 기반 이탈 시점 예측
  private async predictChurnTiming(
    customerId: string,
    baseChurnProb: number
  ): Promise<Date | null> {
    if (baseChurnProb < 0.5) return null;
    
    // 생존 함수 추정
    const survivalCurve = await this.estimateSurvivalCurve(customerId);
    
    // 중앙 생존 시간 찾기 (생존 확률 50% 시점)
    const medianSurvivalDays = this.findMedianSurvival(survivalCurve);
    
    if (medianSurvivalDays === null) return null;
    
    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + medianSurvivalDays);
    
    return predictedDate;
  }
  
  // 개입 전략 생성 (ROI 최적화)
  private async generateInterventions(
    customerId: string,
    riskFactors: RiskFactor[],
    churnProb: number
  ): Promise<Intervention[]> {
    const interventions: Intervention[] = [];
    const customerCLV = await this.getCLV(customerId);
    
    // 각 리스크 요인에 대한 개입 전략
    for (const factor of riskFactors) {
      const possibleActions = this.getActionsForRiskFactor(factor);
      
      for (const action of possibleActions) {
        // 개입 효과 시뮬레이션
        const expectedReduction = await this.simulateIntervention(
          customerId,
          action,
          factor
        );
        
        const savedValue = customerCLV * churnProb * expectedReduction;
        const roi = (savedValue - action.cost) / action.cost;
        
        if (roi > 0) {
          interventions.push({
            action: action.name,
            expectedImpact: expectedReduction,
            cost: action.cost,
            roi,
            targetFactor: factor.factor,
          });
        }
      }
    }
    
    // ROI 기준 정렬
    return interventions.sort((a, b) => b.roi - a.roi).slice(0, 5);
  }
}
```

### 5.3 고급 시각화 컴포넌트

#### 5.3.1 예측 대시보드 시각화

```typescript
// frontend/components/business-brain/visualizations/ForecastDashboard.tsx

import ReactECharts from 'echarts-for-react';
import { useCallback, useMemo } from 'react';

interface ForecastDashboardProps {
  historicalData: TimeSeriesPoint[];
  forecast: ForecastResult;
  goals: BusinessGoal[];
  alerts: PredictiveAlert[];
}

const ForecastDashboard: React.FC<ForecastDashboardProps> = ({
  historicalData,
  forecast,
  goals,
  alerts,
}) => {
  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#1e293b' },
      formatter: (params: any) => {
        // 상세 툴팁 (실제값, 예측값, 신뢰구간)
        const date = params[0].axisValue;
        let html = `<div class="font-semibold mb-2">${date}</div>`;
        
        params.forEach((p: any) => {
          if (p.seriesName === '95% 신뢰구간') return;
          html += `<div class="flex justify-between gap-4">
            <span class="text-slate-600">${p.marker}${p.seriesName}</span>
            <span class="font-medium">${formatCurrency(p.value)}</span>
          </div>`;
        });
        
        // 경고 표시
        const dateAlerts = alerts.filter(a => 
          formatDate(a.expectedDate) === date
        );
        if (dateAlerts.length > 0) {
          html += `<div class="mt-2 pt-2 border-t border-slate-200">`;
          dateAlerts.forEach(alert => {
            const color = alert.type === 'critical' ? '#ef4444' : '#f59e0b';
            html += `<div style="color: ${color}" class="text-sm">
              ⚠️ ${alert.title}
            </div>`;
          });
          html += `</div>`;
        }
        
        return html;
      },
    },
    legend: {
      data: ['실제', '예측', '95% CI', '목표'],
      top: 10,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    dataZoom: [
      {
        type: 'inside',
        start: 70,
        end: 100,
      },
      {
        type: 'slider',
        start: 70,
        end: 100,
        height: 20,
        bottom: 10,
      },
    ],
    xAxis: {
      type: 'category',
      data: [...historicalData, ...forecast.predictions].map(d => d.date),
      axisLine: { lineStyle: { color: '#94a3b8' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => formatCompact(value),
      },
      splitLine: {
        lineStyle: { color: '#e2e8f0', type: 'dashed' },
      },
    },
    series: [
      // 95% 신뢰구간 (영역)
      {
        name: '95% CI',
        type: 'custom',
        renderItem: renderConfidenceInterval,
        encode: { x: 0, y: [1, 2] },
        data: forecast.predictions.map((p, i) => [
          p.date,
          forecast.confidenceIntervals['0.95'].lower[i],
          forecast.confidenceIntervals['0.95'].upper[i],
        ]),
        z: -1,
      },
      // 실제 데이터
      {
        name: '실제',
        type: 'line',
        data: historicalData.map(d => [d.date, d.value]),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' },
            ],
          },
        },
      },
      // 예측 데이터
      {
        name: '예측',
        type: 'line',
        data: forecast.predictions.map(p => [p.date, p.value]),
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          width: 2,
          color: '#8b5cf6',
          type: 'dashed',
        },
        itemStyle: { color: '#8b5cf6' },
      },
      // 목표선
      {
        name: '목표',
        type: 'line',
        markLine: {
          data: goals.map(g => ({
            yAxis: g.target.value,
            label: { formatter: g.name },
            lineStyle: { color: '#10b981', type: 'dotted' },
          })),
        },
      },
      // 경고 마커
      {
        name: '경고',
        type: 'scatter',
        data: alerts.map(a => [
          formatDate(a.expectedDate),
          a.predictedValue,
          a.type,
        ]),
        symbol: 'triangle',
        symbolSize: 16,
        itemStyle: {
          color: (params: any) => 
            params.data[2] === 'critical' ? '#ef4444' : '#f59e0b',
        },
        z: 10,
      },
    ],
  }), [historicalData, forecast, goals, alerts]);
  
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            예측 대시보드
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            앙상블 모델 기반 {forecast.qualityMetrics.backtestMAPE.toFixed(1)}% MAPE
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ModelContributionBadges contributions={forecast.modelContributions} />
        </div>
      </div>
      
      <ReactECharts 
        option={option} 
        style={{ height: 450 }}
        opts={{ renderer: 'canvas' }}
      />
      
      {/* 예측 설명 */}
      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
          AI 분석
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {forecast.explanation}
        </p>
      </div>
    </div>
  );
};
```

#### 5.3.2 인과관계 그래프 시각화

```typescript
// frontend/components/business-brain/visualizations/CausalGraph.tsx

import CytoscapeComponent from 'react-cytoscapejs';
import { useMemo } from 'react';

interface CausalGraphProps {
  causalGraph: {
    nodes: string[];
    edges: CausalEdge[];
  };
  highlightPath?: string[];
}

const CausalGraphVisualization: React.FC<CausalGraphProps> = ({
  causalGraph,
  highlightPath,
}) => {
  const elements = useMemo(() => {
    const nodes = causalGraph.nodes.map(name => ({
      data: {
        id: name,
        label: name,
        highlighted: highlightPath?.includes(name),
      },
    }));
    
    const edges = causalGraph.edges.map(edge => ({
      data: {
        id: `${edge.source}->${edge.target}`,
        source: edge.source,
        target: edge.target,
        strength: edge.strength,
        label: `${(edge.strength * 100).toFixed(0)}%`,
        highlighted: highlightPath?.includes(edge.source) && 
                     highlightPath?.includes(edge.target),
      },
    }));
    
    return [...nodes, ...edges];
  }, [causalGraph, highlightPath]);
  
  const stylesheet = useMemo(() => [
    {
      selector: 'node',
      style: {
        'background-color': '#3b82f6',
        'label': 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': '12px',
        'color': '#fff',
        'text-outline-color': '#3b82f6',
        'text-outline-width': 2,
        'width': 60,
        'height': 60,
      },
    },
    {
      selector: 'node[highlighted]',
      style: {
        'background-color': '#f59e0b',
        'text-outline-color': '#f59e0b',
        'border-width': 3,
        'border-color': '#d97706',
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 'mapData(strength, 0, 1, 1, 8)',
        'line-color': '#94a3b8',
        'target-arrow-color': '#94a3b8',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '10px',
        'text-rotation': 'autorotate',
        'text-margin-y': -10,
      },
    },
    {
      selector: 'edge[highlighted]',
      style: {
        'line-color': '#f59e0b',
        'target-arrow-color': '#f59e0b',
        'width': 4,
      },
    },
  ], []);
  
  const layout = {
    name: 'dagre',
    rankDir: 'LR',
    nodeSep: 80,
    rankSep: 120,
    animate: true,
    animationDuration: 500,
  };
  
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        인과관계 그래프
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        변수 간 인과관계를 보여줍니다. 화살표 방향은 원인 → 결과를 의미합니다.
      </p>
      <CytoscapeComponent
        elements={elements}
        stylesheet={stylesheet}
        layout={layout}
        style={{ width: '100%', height: '500px' }}
        cy={(cy) => {
          cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            // 노드 클릭 시 관련 경로 하이라이트
            handleNodeClick(node.id());
          });
        }}
      />
      <div className="mt-4 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>일반 변수</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>선택된 경로</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-slate-400"></div>
          <span>약한 인과</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-slate-600"></div>
          <span>강한 인과</span>
        </div>
      </div>
    </div>
  );
};
```

### 5.4 AI 대화형 분석 인터페이스

#### 5.4.1 자연어 쿼리 처리기

```typescript
// backend/src/services/agents/NaturalLanguageAnalyzer.ts

interface QueryIntent {
  type: 'trend' | 'comparison' | 'prediction' | 'explanation' | 'recommendation';
  entities: {
    metrics: string[];
    timeRange?: { start: Date; end: Date };
    segments?: string[];
    conditions?: Record<string, any>;
  };
  confidence: number;
}

interface AnalysisResponse {
  answer: string;
  data: any;
  visualizations: VisualizationSpec[];
  followUpQuestions: string[];
  sources: string[];
}

class NaturalLanguageAnalyzer {
  private openai: OpenAI;
  private toolRegistry: Map<string, AnalysisTool>;
  
  async processQuery(
    query: string,
    context: ConversationContext
  ): Promise<AnalysisResponse> {
    // 1. 의도 파악
    const intent = await this.parseIntent(query);
    
    // 2. 필요한 데이터 수집
    const data = await this.gatherData(intent);
    
    // 3. 분석 실행
    const analysis = await this.executeAnalysis(intent, data);
    
    // 4. 자연어 응답 생성
    const answer = await this.generateNaturalResponse(query, analysis);
    
    // 5. 시각화 제안
    const visualizations = this.suggestVisualizations(intent, analysis);
    
    // 6. 후속 질문 생성
    const followUpQuestions = await this.generateFollowUps(intent, analysis);
    
    return {
      answer,
      data: analysis.data,
      visualizations,
      followUpQuestions,
      sources: analysis.sources,
    };
  }
  
  private async parseIntent(query: string): Promise<QueryIntent> {
    const systemPrompt = `당신은 비즈니스 쿼리 파서입니다.
    사용자의 질문을 분석하여 다음을 추출하세요:
    - 분석 유형 (trend/comparison/prediction/explanation/recommendation)
    - 관련 메트릭 (gmv, orders, customers, artists, etc.)
    - 시간 범위
    - 세그먼트 조건
    
    JSON 형식으로 응답하세요.`;
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      response_format: { type: 'json_object' },
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
  
  private async generateNaturalResponse(
    query: string,
    analysis: AnalysisResult
  ): Promise<string> {
    const systemPrompt = `당신은 비즈니스 분석 전문가입니다.
    분석 결과를 바탕으로 자연스럽고 통찰력 있는 답변을 생성하세요.
    
    주의사항:
    1. 핵심 수치는 반드시 포함
    2. 비교 가능한 맥락 제공 (전월 대비, 목표 대비 등)
    3. 의미 있는 인사이트 도출
    4. 실행 가능한 제안 포함
    5. 불확실성이 있다면 명시`;
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `질문: ${query}\n\n분석 결과: ${JSON.stringify(analysis)}` 
        },
      ],
    });
    
    return response.choices[0].message.content;
  }
  
  // 예시 쿼리 처리:
  // "지난 달 일본 시장 매출이 왜 감소했어?"
  // → Intent: { type: 'explanation', entities: { metrics: ['gmv'], segments: ['JP'], timeRange: lastMonth } }
  // → 분석: 매출 분해, 원인 분석, 외부 요인 체크
  // → 응답: "지난 달 일본 시장 매출은 전월 대비 12% 감소했습니다. 주요 원인은..."
}
```

---

## 6. 상세 구현 로드맵 (배치 분석 최적화)

> **📌 데이터 환경**: 매일 오전 11시 매뉴얼 업데이트 (실시간 기능 제외)

---

### Phase 1: 시각화 엔진 교체 및 기반 구축 (1주차)

#### 1.1 ECharts 마이그레이션

| 단계 | 작업 내용 | 파일 | 예상 시간 |
|------|----------|------|----------|
| 1.1.1 | 패키지 설치 및 설정 | `package.json`, `next.config.js` | 1시간 |
| 1.1.2 | ECharts 래퍼 컴포넌트 생성 | `components/charts/EChartsWrapper.tsx` | 2시간 |
| 1.1.3 | 테마 설정 (다크모드 포함) | `lib/echarts-theme.ts` | 2시간 |
| 1.1.4 | 기존 차트 마이그레이션 - 트렌드 차트 | `OverviewTab.tsx` | 3시간 |
| 1.1.5 | 기존 차트 마이그레이션 - 코호트 히트맵 | `CohortAnalysisTab.tsx` | 3시간 |
| 1.1.6 | 기존 차트 마이그레이션 - RFM 차트 | `RFMTab.tsx` | 2시간 |
| 1.1.7 | 기존 차트 마이그레이션 - 파레토 차트 | `ParetoTab.tsx` | 2시간 |

```typescript
// 구현 예시: components/charts/EChartsWrapper.tsx
'use client'

import ReactECharts from 'echarts-for-react'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { getEChartsTheme } from '@/lib/echarts-theme'

interface EChartsWrapperProps {
  option: any
  height?: number | string
  loading?: boolean
  onEvents?: Record<string, (params: any) => void>
}

export function EChartsWrapper({ 
  option, 
  height = 400, 
  loading,
  onEvents 
}: EChartsWrapperProps) {
  const { theme } = useTheme()
  
  const mergedOption = useMemo(() => ({
    ...getEChartsTheme(theme === 'dark'),
    ...option,
  }), [option, theme])
  
  return (
    <ReactECharts
      option={mergedOption}
      style={{ height }}
      opts={{ renderer: 'canvas' }}
      showLoading={loading}
      onEvents={onEvents}
      notMerge
    />
  )
}
```

#### 1.2 통계 엔진 통합

| 단계 | 작업 내용 | 파일 | 예상 시간 |
|------|----------|------|----------|
| 1.2.1 | simple-statistics, jstat 설치 | `package.json` | 30분 |
| 1.2.2 | 통계 유틸리티 클래스 생성 | `lib/statistics/StatisticsEngine.ts` | 4시간 |
| 1.2.3 | 이상치 탐지 알고리즘 구현 | `lib/statistics/AnomalyDetector.ts` | 3시간 |
| 1.2.4 | A/B 테스트 분석 유틸 | `lib/statistics/ABTestAnalyzer.ts` | 2시간 |

```typescript
// 구현 예시: lib/statistics/StatisticsEngine.ts
import * as ss from 'simple-statistics'
import jstat from 'jstat'

export class StatisticsEngine {
  // Z-score 기반 이상치 탐지
  detectZScoreAnomalies(data: number[], threshold = 3): AnomalyResult[] {
    const mean = ss.mean(data)
    const std = ss.standardDeviation(data)
    
    return data.map((value, index) => {
      const zScore = (value - mean) / std
      return {
        index,
        value,
        zScore,
        isAnomaly: Math.abs(zScore) > threshold,
        severity: Math.abs(zScore) > threshold * 1.5 ? 'critical' : 
                  Math.abs(zScore) > threshold ? 'warning' : 'normal'
      }
    })
  }
  
  // IQR 기반 이상치 탐지
  detectIQRAnomalies(data: number[], multiplier = 1.5): AnomalyResult[] {
    const q1 = ss.quantile(data, 0.25)
    const q3 = ss.quantile(data, 0.75)
    const iqr = q3 - q1
    const lowerBound = q1 - multiplier * iqr
    const upperBound = q3 + multiplier * iqr
    
    return data.map((value, index) => ({
      index,
      value,
      isAnomaly: value < lowerBound || value > upperBound,
      bounds: { lower: lowerBound, upper: upperBound }
    }))
  }
  
  // 회귀 분석
  linearRegression(x: number[], y: number[]): RegressionResult {
    const regression = ss.linearRegression(x.map((xi, i) => [xi, y[i]]))
    const line = ss.linearRegressionLine(regression)
    const predictions = x.map(line)
    const r2 = ss.rSquared(y, predictions)
    
    return {
      slope: regression.m,
      intercept: regression.b,
      r2,
      predictions,
      equation: `y = ${regression.m.toFixed(4)}x + ${regression.b.toFixed(4)}`
    }
  }
}
```

---

### Phase 2: 예측 시스템 고도화 (2주차)

#### 2.1 앙상블 예측 엔진 구현

| 단계 | 작업 내용 | 파일 | 예상 시간 |
|------|----------|------|----------|
| 2.1.1 | ForecastEngine 인터페이스 정의 | `types/forecast.ts` | 1시간 |
| 2.1.2 | 이동평균 예측 모델 개선 | `services/analytics/MovingAverageModel.ts` | 2시간 |
| 2.1.3 | 지수 평활법 (ETS) 구현 | `services/analytics/ETSModel.ts` | 4시간 |
| 2.1.4 | 선형 회귀 예측 모델 | `services/analytics/LinearRegressionModel.ts` | 2시간 |
| 2.1.5 | 앙상블 결합기 구현 | `services/analytics/EnsembleCombiner.ts` | 3시간 |
| 2.1.6 | 신뢰 구간 계산 (Bootstrap) | `services/analytics/ConfidenceInterval.ts` | 3시간 |
| 2.1.7 | 백엔드 API 엔드포인트 추가 | `routes/business-brain.ts` | 2시간 |

```typescript
// 구현 예시: services/analytics/EnsembleForecast.ts
interface ForecastModel {
  name: string
  weight: number
  predict(data: number[], periods: number): Promise<number[]>
}

export class EnsembleForecastEngine {
  private models: ForecastModel[] = []
  
  constructor() {
    this.models = [
      { name: 'SMA', weight: 0.2, predict: this.simpleMovingAverage },
      { name: 'EMA', weight: 0.25, predict: this.exponentialMovingAverage },
      { name: 'ETS', weight: 0.3, predict: this.exponentialSmoothing },
      { name: 'Linear', weight: 0.15, predict: this.linearRegression },
      { name: 'Seasonal', weight: 0.1, predict: this.seasonalNaive },
    ]
  }
  
  async forecast(
    data: number[],
    periods: number = 30
  ): Promise<EnsembleForecastResult> {
    // 1. 각 모델 예측 실행
    const predictions = await Promise.all(
      this.models.map(async model => ({
        name: model.name,
        values: await model.predict(data, periods),
        weight: model.weight
      }))
    )
    
    // 2. 가중 평균 앙상블
    const ensemble = this.weightedAverage(predictions)
    
    // 3. 부트스트랩 신뢰 구간 계산
    const ci = this.bootstrapConfidenceInterval(data, periods, 1000)
    
    return {
      predictions: ensemble,
      confidenceInterval: {
        lower95: ci.lower,
        upper95: ci.upper
      },
      modelContributions: predictions.map(p => ({
        name: p.name,
        weight: p.weight
      })),
      metrics: {
        ensembleAgreement: this.calculateAgreement(predictions)
      }
    }
  }
  
  private weightedAverage(
    predictions: Array<{ values: number[], weight: number }>
  ): number[] {
    const totalWeight = predictions.reduce((sum, p) => sum + p.weight, 0)
    const periods = predictions[0].values.length
    
    return Array.from({ length: periods }, (_, i) =>
      predictions.reduce((sum, p) => sum + p.values[i] * p.weight, 0) / totalWeight
    )
  }
}
```

#### 2.2 변화점 탐지 시스템

| 단계 | 작업 내용 | 파일 | 예상 시간 |
|------|----------|------|----------|
| 2.2.1 | CUSUM 알고리즘 구현 | `services/analytics/CUSUMDetector.ts` | 3시간 |
| 2.2.2 | 변화점 분류기 | `services/analytics/ChangepointClassifier.ts` | 2시간 |
| 2.2.3 | 변화점 시각화 컴포넌트 | `components/charts/ChangepointChart.tsx` | 3시간 |
| 2.2.4 | 변화점 원인 추론 로직 | `services/analytics/ChangepointAnalyzer.ts` | 4시간 |

#### 2.3 예측 추적 및 성능 대시보드

| 단계 | 작업 내용 | 파일 | 예상 시간 |
|------|----------|------|----------|
| 2.3.1 | 예측 기록 저장 스키마 | `types/forecast-tracking.ts` | 1시간 |
| 2.3.2 | 예측 vs 실제 비교 로직 | `services/analytics/ForecastTracker.ts` | 3시간 |
| 2.3.3 | MAPE, RMSE 계산 유틸 | `lib/statistics/ForecastMetrics.ts` | 2시간 |
| 2.3.4 | 모델 성능 대시보드 UI | `components/business-brain/ForecastPerformance.tsx` | 4시간 |

---

### Phase 3: AI 에이전트 및 인사이트 강화 (3주차)

#### 3.1 LangChain 에이전트 통합

| 단계 | 작업 내용 | 파일 | 예상 시간 |
|------|----------|------|----------|
| 3.1.1 | LangChain 패키지 설치 | `backend/package.json` | 30분 |
| 3.1.2 | 분석 도구 정의 | `services/agents/AnalysisTools.ts` | 4시간 |
| 3.1.3 | 쿼리 파서 구현 | `services/agents/QueryParser.ts` | 3시간 |
| 3.1.4 | 자연어 응답 생성기 | `services/agents/ResponseGenerator.ts` | 3시간 |
| 3.1.5 | 대화 컨텍스트 관리 | `services/agents/ConversationManager.ts` | 2시간 |
| 3.1.6 | API 엔드포인트 구현 | `routes/business-brain.ts` (chat 확장) | 2시간 |
| 3.1.7 | 프론트엔드 채팅 UI 개선 | `components/business-brain/ChatInterface.tsx` | 4시간 |

```typescript
// 구현 예시: services/agents/BusinessAnalysisAgent.ts
import { ChatOpenAI } from '@langchain/openai'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

export class BusinessAnalysisAgent {
  private llm: ChatOpenAI
  private tools: DynamicStructuredTool[]
  
  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.3
    })
    
    this.tools = [
      new DynamicStructuredTool({
        name: 'analyze_revenue_trend',
        description: '매출 트렌드를 분석합니다',
        schema: z.object({
          startDate: z.string(),
          endDate: z.string(),
          segment: z.string().optional()
        }),
        func: async (params) => {
          const result = await this.revenueAnalyzer.analyze(params)
          return JSON.stringify(result)
        }
      }),
      new DynamicStructuredTool({
        name: 'find_anomalies',
        description: '이상치를 탐지합니다',
        schema: z.object({
          metric: z.string(),
          period: z.number()
        }),
        func: async (params) => {
          const result = await this.anomalyDetector.detect(params)
          return JSON.stringify(result)
        }
      }),
      // 추가 도구들...
    ]
  }
  
  async processQuery(query: string): Promise<AnalysisResponse> {
    // 1. 의도 파악
    const intent = await this.parseIntent(query)
    
    // 2. 적절한 도구 선택 및 실행
    const toolResults = await this.executeTool(intent)
    
    // 3. 자연어 응답 생성
    const response = await this.generateResponse(query, toolResults)
    
    return response
  }
}
```

#### 3.2 인과관계 분석 시스템

| 단계 | 작업 내용 | 파일 | 예상 시간 |
|------|----------|------|----------|
| 3.2.1 | Granger 인과성 검정 구현 | `services/analytics/GrangerCausality.ts` | 4시간 |
| 3.2.2 | 상관관계 매트릭스 계산 | `services/analytics/CorrelationMatrix.ts` | 2시간 |
| 3.2.3 | Cytoscape 통합 | `components/charts/CausalGraph.tsx` | 4시간 |
| 3.2.4 | 인과관계 시각화 UI | `components/business-brain/CausalAnalysis.tsx` | 4시간 |
| 3.2.5 | 인과관계 해석 생성 | `services/analytics/CausalInterpreter.ts` | 3시간 |

---

### Phase 4: 고급 분석 기능 (4주차)

#### 4.1 고객 분석 강화

| 단계 | 작업 내용 | 파일 | 예상 시간 |
|------|----------|------|----------|
| 4.1.1 | CLV 예측 모델 (BG/NBD) | `services/analytics/CLVPredictor.ts` | 6시간 |
| 4.1.2 | 이탈 예측 강화 | `services/analytics/ChurnPredictor.ts` | 4시간 |
| 4.1.3 | 고객 세그먼트 인사이트 | `services/analytics/SegmentInsights.ts` | 3시간 |
| 4.1.4 | CLV 대시보드 컴포넌트 | `components/business-brain/CLVDashboard.tsx` | 4시간 |
| 4.1.5 | 이탈 위험 고객 목록 UI | `components/business-brain/ChurnRiskList.tsx` | 3시간 |

#### 4.2 시뮬레이션 강화

| 단계 | 작업 내용 | 파일 | 예상 시간 |
|------|----------|------|----------|
| 4.2.1 | 몬테카를로 시뮬레이션 엔진 | `services/analytics/MonteCarloSimulator.ts` | 5시간 |
| 4.2.2 | 민감도 분석 (Tornado Chart) | `services/analytics/SensitivityAnalyzer.ts` | 3시간 |
| 4.2.3 | What-if 시나리오 확장 | `services/analytics/WhatIfEngine.ts` | 4시간 |
| 4.2.4 | 시뮬레이션 결과 시각화 | `components/business-brain/SimulationResults.tsx` | 4시간 |

#### 4.3 네트워크 분석

| 단계 | 작업 내용 | 파일 | 예상 시간 |
|------|----------|------|----------|
| 4.3.1 | 고객-작가-제품 그래프 생성 | `services/analytics/NetworkBuilder.ts` | 4시간 |
| 4.3.2 | 네트워크 중심성 분석 | `services/analytics/NetworkCentrality.ts` | 3시간 |
| 4.3.3 | 네트워크 시각화 컴포넌트 | `components/charts/NetworkGraph.tsx` | 5시간 |

---

### Phase 5: 보고서 및 내보내기 (5주차)

#### 5.1 PDF 리포트 생성

| 단계 | 작업 내용 | 파일 | 예상 시간 |
|------|----------|------|----------|
| 5.1.1 | jsPDF, html2canvas 설치 | `package.json` | 30분 |
| 5.1.2 | 리포트 템플릿 설계 | `lib/reports/ReportTemplate.ts` | 3시간 |
| 5.1.3 | 경영진 요약 페이지 | `lib/reports/ExecutiveSummary.ts` | 4시간 |
| 5.1.4 | 차트 이미지 캡처 | `lib/reports/ChartCapture.ts` | 2시간 |
| 5.1.5 | PDF 생성 유틸리티 | `lib/reports/PDFGenerator.ts` | 4시간 |
| 5.1.6 | 리포트 생성 UI | `components/business-brain/ReportGenerator.tsx` | 3시간 |

```typescript
// 구현 예시: lib/reports/PDFGenerator.ts
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export class PDFReportGenerator {
  private pdf: jsPDF
  
  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
  }
  
  async generateExecutiveReport(data: ReportData): Promise<Blob> {
    // 1. 표지
    await this.addCoverPage(data.title, data.date)
    
    // 2. 경영진 요약
    this.pdf.addPage()
    await this.addExecutiveSummary(data.summary)
    
    // 3. 핵심 지표
    this.pdf.addPage()
    await this.addKPISection(data.kpis)
    
    // 4. 트렌드 차트
    this.pdf.addPage()
    await this.addChartSection('trend-chart', '매출 트렌드')
    
    // 5. 인사이트
    this.pdf.addPage()
    await this.addInsightsSection(data.insights)
    
    // 6. 액션 아이템
    this.pdf.addPage()
    await this.addActionItems(data.actions)
    
    return this.pdf.output('blob')
  }
  
  private async addChartSection(elementId: string, title: string) {
    const element = document.getElementById(elementId)
    if (!element) return
    
    const canvas = await html2canvas(element, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    
    this.pdf.setFontSize(16)
    this.pdf.text(title, 20, 20)
    this.pdf.addImage(imgData, 'PNG', 10, 30, 190, 100)
  }
}
```

#### 5.2 Excel 내보내기

| 단계 | 작업 내용 | 파일 | 예상 시간 |
|------|----------|------|----------|
| 5.2.1 | ExcelJS 설치 | `package.json` | 30분 |
| 5.2.2 | Excel 템플릿 설계 | `lib/reports/ExcelTemplate.ts` | 2시간 |
| 5.2.3 | 데이터 시트 생성 | `lib/reports/ExcelDataSheet.ts` | 3시간 |
| 5.2.4 | 조건부 서식 적용 | `lib/reports/ExcelFormatting.ts` | 2시간 |
| 5.2.5 | 내보내기 버튼 통합 | 각 탭 컴포넌트 | 2시간 |

---

### Phase 6: UX 혁신 및 UI 개선 (6주차)

#### 6.1 정보 아키텍처 재설계

| 단계 | 작업 내용 | 파일 | 예상 시간 |
|------|----------|------|----------|
| 6.1.1 | 3-뷰 구조 설계 | 문서 작업 | 2시간 |
| 6.1.2 | Command Center 뷰 구현 | `components/business-brain/CommandCenter.tsx` | 6시간 |
| 6.1.3 | Deep Dive 뷰 통합 | `components/business-brain/DeepDive.tsx` | 4시간 |
| 6.1.4 | Action Hub 뷰 구현 | `components/business-brain/ActionHub.tsx` | 4시간 |
| 6.1.5 | 네비게이션 재설계 | `components/business-brain/Navigation.tsx` | 3시간 |

#### 6.2 UI 개선

| 단계 | 작업 내용 | 파일 | 예상 시간 |
|------|----------|------|----------|
| 6.2.1 | 애니메이션 통합 (framer-motion) | 각 컴포넌트 | 4시간 |
| 6.2.2 | 로딩 상태 개선 | `components/ui/AnalysisLoading.tsx` | 2시간 |
| 6.2.3 | 빈 상태 디자인 | `components/ui/EmptyState.tsx` | 2시간 |
| 6.2.4 | 툴팁 및 도움말 | 각 컴포넌트 | 3시간 |
| 6.2.5 | 반응형 개선 | 각 컴포넌트 | 4시간 |

#### 6.3 성능 최적화

| 단계 | 작업 내용 | 파일 | 예상 시간 |
|------|----------|------|----------|
| 6.3.1 | 코드 분할 적용 | `next.config.js`, 각 페이지 | 2시간 |
| 6.3.2 | React Query 캐싱 최적화 | `lib/react-query.ts` | 2시간 |
| 6.3.3 | 가상화 적용 (긴 목록) | 테이블 컴포넌트 | 3시간 |
| 6.3.4 | 이미지 최적화 | 차트 내보내기 | 1시간 |

---

### 📊 구현 일정 요약

| Phase | 기간 | 주요 작업 | 산출물 |
|-------|------|----------|--------|
| **Phase 1** | 1주차 | ECharts 마이그레이션, 통계 엔진 | 새 차트 시스템 |
| **Phase 2** | 2주차 | 앙상블 예측, 변화점 탐지 | 개선된 예측 시스템 |
| **Phase 3** | 3주차 | LangChain 에이전트, 인과분석 | AI 분석 인터페이스 |
| **Phase 4** | 4주차 | CLV, 이탈예측, 시뮬레이션 | 고급 분석 기능 |
| **Phase 5** | 5주차 | PDF/Excel 리포트 | 보고서 시스템 |
| **Phase 6** | 6주차 | UX 혁신, 성능 최적화 | 완성된 UI/UX |

### ✅ 각 Phase 완료 체크리스트

#### Phase 1 완료 조건
- [ ] ECharts로 모든 기존 차트 마이그레이션 완료
- [ ] 다크모드 테마 적용 확인
- [ ] 통계 유틸리티 함수 테스트 통과
- [ ] 기존 기능 회귀 테스트 통과

#### Phase 2 완료 조건
- [ ] 앙상블 예측 MAPE < 15% 달성
- [ ] 신뢰 구간 시각화 적용
- [ ] 변화점 탐지 정확도 검증
- [ ] 예측 추적 대시보드 동작 확인

#### Phase 3 완료 조건
- [ ] 자연어 쿼리 5가지 이상 유형 지원
- [ ] 인과관계 그래프 시각화 완료
- [ ] AI 응답 품질 검증 (human review)

#### Phase 4 완료 조건
- [ ] CLV 예측 정확도 검증
- [ ] 이탈 예측 AUC > 0.8 달성
- [ ] 시뮬레이션 결과 신뢰성 검증

#### Phase 5 완료 조건
- [ ] PDF 리포트 생성 테스트
- [ ] Excel 내보내기 데이터 정확성 확인
- [ ] 차트 이미지 품질 확인

#### Phase 6 완료 조건
- [ ] 3-뷰 구조 네비게이션 테스트
- [ ] 페이지 로드 시간 < 2초
- [ ] 모바일 반응형 테스트 통과

---

## 7. 기술 스택 요약

### 7.1 프론트엔드 신규 의존성

```json
{
  "dependencies": {
    // 시각화 (핵심)
    "echarts": "^5.5.0",
    "echarts-for-react": "^3.0.2",
    "cytoscape": "^3.28.0",
    "react-cytoscapejs": "^2.0.0",
    "cytoscape-dagre": "^2.5.0",
    
    // 통계/분석
    "simple-statistics": "^7.8.3",
    "jstat": "^1.9.6",
    
    // 보고서 생성
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1",
    "exceljs": "^4.4.0",
    
    // UI 개선
    "framer-motion": "^11.0.0",
    "@tanstack/react-virtual": "^3.1.0"
  }
}
```

### 7.2 백엔드 신규 의존성

```json
{
  "dependencies": {
    // AI 에이전트 (핵심)
    "langchain": "^0.1.0",
    "@langchain/openai": "^0.0.28"
  }
}
```

### 7.3 Python 서비스 (분석 엔진)

```txt
# requirements.txt
prophet==1.1.5
xgboost==2.0.0
shap==0.44.0
lifetimes==0.11.3  # BG/NBD, Gamma-Gamma
scikit-learn==1.4.0
pandas==2.2.0
numpy==1.26.0
fastapi==0.109.0
uvicorn==0.27.0
```

### 7.4 아키텍처 다이어그램 (배치 분석 최적화)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  ECharts    │  │  Cytoscape  │  │  simple-    │              │
│  │  시각화     │  │  네트워크   │  │  statistics │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   jsPDF     │  │  ExcelJS    │  │  React      │              │
│  │  리포트     │  │  내보내기   │  │   Query     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌─────────────────────────────────────────────────┐            │
│  │              분석 결과 캐싱 레이어               │            │
│  │  (React Query + LocalStorage 기반 캐싱)         │            │
│  └─────────────────────────────────────────────────┘            │
│                         │                                        │
│                      REST API                                    │
│                         │                                        │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Express.js)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  LangChain  │  │   Cache     │  │  Statistics │              │
│  │   에이전트  │  │   Manager   │  │   Engine    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌─────────────────────────────────────────────────┐            │
│  │            Business Brain Agent                  │            │
│  │   (오케스트레이션, 인사이트 생성, 배치 분석)    │            │
│  └─────────────────────────────────────────────────┘            │
│                         │                                        │
│                    HTTP/REST                                     │
│                         │                                        │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Sources                                │
├─────────────────────────────────────────────────────────────────┤
│     PostgreSQL     │     Redis Cache     │    External APIs     │
│   (매일 11시 업데이트)   (분석 결과 캐시)     (OpenAI 등)       │
└─────────────────────────────────────────────────────────────────┘

📌 데이터 업데이트 주기: 매일 오전 11시 (배치 처리)
📌 캐싱 전략: 데이터 업데이트 후 분석 결과 캐싱 (24시간 유효)
```

### 7.5 데이터 흐름

```
사용자 쿼리
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│ 1. 의도 파악 (LangChain + GPT-4)                             │
│    "지난 달 일본 매출 왜 떨어졌어?"                          │
│    → { type: 'explanation', metric: 'gmv', segment: 'JP' }   │
└──────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. 데이터 수집 (병렬 실행)                                   │
│    - 일본 시장 GMV 시계열                                    │
│    - 외부 이벤트 (환율, 휴일)                                │
│    - 마케팅 캠페인 이력                                      │
│    - 경쟁사 동향 (가능시)                                    │
└──────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. 분석 실행                                                  │
│    - 시계열 분해 (Prophet)                                   │
│    - 변화점 탐지 (PELT)                                      │
│    - 인과관계 분석 (Granger)                                 │
│    - 유사 과거 사례 검색 (Pinecone)                          │
└──────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. 인사이트 생성 (GPT-4)                                     │
│    "일본 시장 매출이 12% 감소한 주요 원인은:                 │
│     1. 엔화 약세 (환율 5% 상승)                              │
│     2. 주요 작가 3명 이탈                                    │
│     3. 경쟁사 프로모션 영향"                                 │
└──────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. 시각화 생성 (ECharts + Cytoscape)                         │
│    - 매출 트렌드 + 변화점 마킹                               │
│    - 원인별 기여도 워터폴 차트                               │
│    - 관련 요인 인과 그래프                                   │
└──────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. 액션 제안                                                  │
│    - "환율 헤지 상품 검토 권장"                              │
│    - "이탈 작가 복귀 캠페인 제안"                            │
│    - "경쟁 대응 프로모션 기획 필요"                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. 성공 지표 (KPIs) - 확장판

### 8.1 분석 정확도 지표

| 지표 | 현재 | 목표 | 외부 도구 효과 | 측정 방법 |
|------|------|------|---------------|----------|
| 예측 MAPE (7일) | ~25% | <10% | Prophet 앙상블 | 백테스트 |
| 예측 MAPE (30일) | ~35% | <15% | Prophet + LSTM | 백테스트 |
| 이탈 예측 정확도 | ~65% | >85% | XGBoost + SHAP | Precision/Recall |
| CLV 예측 정확도 | N/A | >80% | BG/NBD | R² |
| 경보 정확도 | N/A | >90% | 변화점 탐지 | 경보 → 이벤트 |
| 인과관계 발견율 | N/A | >75% | Granger 인과성 | 전문가 검증 |

### 8.2 성능 지표

| 지표 | 현재 | 목표 | 최적화 방법 | 측정 방법 |
|------|------|------|------------|----------|
| 초기 로드 | ~4초 | <1.5초 | 코드 분할, 지연 로딩 | Lighthouse |
| 차트 렌더링 (10만점) | ~3초 | <0.5초 | ECharts Canvas | 성능 프로파일 |
| 분석 API 응답 | ~3초 | <1초 | 캐싱, 쿼리 최적화 | 벤치마크 |
| AI 인사이트 생성 | ~5초 | <3초 | 프롬프트 최적화 | API 로그 |
| 캐시 히트율 | ~40% | >85% | React Query + Redis | 캐시 통계 |
| 보고서 생성 | ~10초 | <5초 | 최적화된 렌더링 | 성능 측정 |

### 8.3 비즈니스 가치 지표

| 지표 | 현재 | 목표 | 기대 효과 | 측정 방법 |
|------|------|------|----------|----------|
| 예측 활용률 | ~20% | >80% | 의사결정 품질 향상 | 사용 로그 |
| 경보 대응률 | N/A | >90% | 문제 조기 대응 | 액션 추적 |
| 인사이트 실행률 | ~30% | >70% | 분석 ROI 향상 | 액션 완료율 |
| 의사결정 시간 | ~2일 | <4시간 | 시뮬레이션 활용 | 프로세스 추적 |
| 매출 영향 | 측정 필요 | +5% | 최적화된 의사결정 | A/B 테스트 |
| 이탈 방지 | 측정 필요 | +15% | 사전 개입 | 코호트 비교 |

### 8.4 사용자 경험 지표

| 지표 | 현재 | 목표 | 개선 방법 | 측정 방법 |
|------|------|------|----------|----------|
| 탭 내비게이션 | 18개 탭 | 3개 메인 뷰 | UI 재설계 | 네비게이션 분석 |
| 정보 도달 시간 | ~5분 | <1분 | Command Center | 세션 분석 |
| 자연어 쿼리 성공률 | N/A | >85% | LangChain 에이전트 | 쿼리 로그 |
| 차트 인터랙션 | 제한적 | 완전 인터랙티브 | ECharts | 이벤트 추적 |
| 경영진 만족도 | 측정 필요 | >9/10 | 종합 개선 | NPS |
| 기능 사용 균등도 | 불균등 | 균등 (±20%) | 접근성 개선 | 기능별 추적 |

### 8.5 시스템 안정성 지표

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| API 가용성 | ~99% | >99.9% | 업타임 모니터링 |
| 에러율 | ~2% | <0.1% | 에러 로그 |
| 메모리 누수 | 있음 | 없음 | 힙 프로파일링 |
| 캐시 일관성 | 측정 필요 | 100% | 데이터 검증 |

---

## 9. 리스크 관리 및 대응 전략

### 9.1 기술적 리스크

| 리스크 | 영향 | 확률 | 대응 전략 |
|--------|------|------|----------|
| Python 서비스 장애 | 고급 분석 불가 | 중 | 폴백: JS 기반 단순 분석으로 대체 |
| TensorFlow.js WebGL 호환성 | 브라우저 ML 불가 | 저 | 폴백: 서버 사이드 추론 |
| Pinecone 벡터 DB 장애 | 유사 검색 불가 | 저 | 로컬 캐시 기반 검색으로 대체 |
| OpenAI API 제한 | AI 기능 제한 | 중 | Rate limiting, 큐잉, 로컬 모델 대안 |
| 대용량 데이터 브라우저 메모리 | 크래시 | 중 | 가상화, 스트리밍, 서버사이드 집계 |

### 9.2 비즈니스 리스크

| 리스크 | 영향 | 확률 | 대응 전략 |
|--------|------|------|----------|
| 잘못된 예측 기반 의사결정 | 비즈니스 손실 | 중 | 신뢰 구간 강조, 휴먼 검토 체크포인트 |
| 경보 피로 (과도한 알림) | 중요 알림 무시 | 고 | 스마트 필터링, 점진적 에스컬레이션 |
| 과도한 자동화 의존 | 인간 판단력 저하 | 중 | "왜?" 설명 강화, 대안 제시 |
| 데이터 프라이버시 | 법적 리스크 | 저 | 로컬 처리 우선, 익명화 |

### 9.3 마이그레이션 리스크

| 리스크 | 영향 | 확률 | 대응 전략 |
|--------|------|------|----------|
| ECharts 마이그레이션 실패 | 시각화 장애 | 중 | 점진적 마이그레이션, A/B 테스트 |
| 레거시 코드 호환성 | 기능 손실 | 중 | 래퍼 레이어, 병렬 운영 기간 |
| 성능 저하 | UX 악화 | 중 | 성능 벤치마크, 롤백 계획 |

---

## 10. 결론

### 10.1 혁신 요약

Business Brain 2.0은 **외부 도구 생태계**를 적극 활용하여 단순 분석 대시보드에서 **예측적 경영 인텔리전스 시스템**으로 진화합니다.

> 📌 **데이터 환경**: 매일 오전 11시 배치 업데이트 기반 최적화

```
현재 상태                          목표 상태
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
단순 차트 (Recharts)         →    고급 인터랙티브 (ECharts)
단일 모델 예측               →    앙상블 예측 (다중 통계 모델)
기본 통계                    →    고급 통계 분석 (simple-statistics)
단순 인사이트                →    AI 기반 인사이트 (LangChain)
기본 검색                    →    자연어 쿼리 인터페이스
결과 확인                    →    인과관계 분석 + 변화점 탐지
수동 보고서                  →    자동 PDF/Excel 리포트 생성
18개 탭 네비게이션           →    3개 메인 뷰 (Command/Deep/Action)
```

### 10.2 핵심 성공 요인

| 요인 | 설명 | 주요 도구 |
|------|------|----------|
| **정확성** | 앙상블 예측, 신뢰 구간, 백테스트 | Prophet, TensorFlow.js |
| **설명력** | SHAP, 인과 그래프, 자연어 설명 | SHAP, Cytoscape, GPT-4 |
| **실시간성** | 실시간 KPI, 예측 경보 | Socket.io, Web Workers |
| **인터랙티브** | 고급 시각화, 드릴다운, 시뮬레이션 | ECharts, Plotly |
| **확장성** | 마이크로서비스, 캐싱 | Python API, Dexie |
| **접근성** | 자연어 쿼리, 단순화된 UI | LangChain, 3-View 설계 |

### 10.3 기대 효과

```
┌────────────────────────────────────────────────────────────────┐
│                    Business Brain 2.0 기대 효과                 │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📈 분석 정확도          ████████████████████░░░░  80% → 95%   │
│  ⚡ 응답 속도            ████████████████████████░  3초 → 0.5초 │
│  🎯 예측 정확도 (MAPE)   ████████████████████░░░░  25% → 10%   │
│  🔔 경보 정확도          ████████████████████████░  N/A → 90%  │
│  💬 자연어 처리 성공률   ████████████████████░░░░  N/A → 85%   │
│  👥 사용자 만족도        ████████████████████████░  7/10 → 9/10│
│  📊 인사이트 실행률      ████████████████████░░░░  30% → 70%   │
│  ⏱️ 의사결정 시간        ████████████████████████░  2일 → 4시간│
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 10.4 다음 단계

1. **Phase 1 시작**: ECharts 마이그레이션 및 Arquero 데이터 파이프라인 구축
2. **Python 서비스 설정**: FastAPI 기반 분석 엔진 서버 구축
3. **인프라 준비**: Pinecone 계정, Socket.io 서버, 캐싱 레이어
4. **점진적 배포**: 기존 기능 유지하며 새 기능 A/B 테스트

### 10.5 최종 비전

> **"Business Brain 2.0은 데이터의 바다에서 인사이트의 진주를 찾아내는 것을 넘어,
> 미래를 예측하고 최적의 의사결정을 제안하는 진정한 경영 파트너가 될 것입니다.
> 마치 Minority Report가 범죄를 예방하듯이, Business Brain은 비즈니스 위기를 
> 예방하고 기회를 선점하여 경쟁 우위를 확보하도록 지원합니다."**

---

*문서 버전: 2.1 (최종 구현 계획)*
*작성일: 2024년 12월*
*작성: AI 자동화 팀*
*데이터 환경: 매일 오전 11시 배치 업데이트*
*상태: 구현 준비 완료*

---

## 부록 A: 외부 도구 라이선스 정보

| 도구 | 라이선스 | 비용 | 비고 |
|------|----------|------|------|
| ECharts | Apache 2.0 | 무료 | 상업용 가능 |
| Arquero | BSD-3-Clause | 무료 | 상업용 가능 |
| TensorFlow.js | Apache 2.0 | 무료 | 상업용 가능 |
| LangChain | MIT | 무료 | 상업용 가능 |
| Prophet | MIT | 무료 | 상업용 가능 |
| Cytoscape | MIT | 무료 | 상업용 가능 |
| Pinecone | Commercial | 유료 | 무료 티어 있음 |
| OpenAI API | Commercial | 유료 | 사용량 기반 |
| Socket.io | MIT | 무료 | 상업용 가능 |

## 부록 B: 참고 자료

- [ECharts 공식 문서](https://echarts.apache.org/)
- [Arquero API 레퍼런스](https://uwdata.github.io/arquero/)
- [Prophet 논문](https://peerj.com/preprints/3190/)
- [LangChain 가이드](https://js.langchain.com/)
- [SHAP 논문](https://arxiv.org/abs/1705.07874)
- [Granger Causality](https://en.wikipedia.org/wiki/Granger_causality)
- [BG/NBD 모델](https://www.sciencedirect.com/science/article/abs/pii/S0167811605000418)

