# AI Agent 구조 및 기능 상세 진단

**작성일**: 2024-12-19  
**버전**: v4.3  
**대상**: idus Global Business Hub AI Agent 시스템

---

## 📋 목차

1. [전체 아키텍처 개요](#1-전체-아키텍처-개요)
2. [Agent 계층 구조](#2-agent-계층-구조)
3. [개별 Agent 상세 분석](#3-개별-agent-상세-분석)
4. [Agent 라우팅 및 오케스트레이션](#4-agent-라우팅-및-오케스트레이션)
5. [공통 기능 및 도구](#5-공통-기능-및-도구)
6. [대화 관리 및 컨텍스트](#6-대화-관리-및-컨텍스트)
7. [성능 및 최적화](#7-성능-및-최적화)
8. [문제점 및 개선 사항](#8-문제점-및-개선-사항)

---

## 1. 전체 아키텍처 개요

### 1.1 시스템 흐름도

```
사용자 질문
    ↓
[Chat API] (/api/chat/message)
    ↓
[AgentRouter] → 의도 분류 (Intent Classification)
    ├─ 키워드 기반 분류 (classifyIntent)
    └─ LLM 기반 분류 (IntentClassifier)
    ↓
[Agent 선택]
    ├─ DataAnalystAgent
    ├─ PerformanceMarketerAgent
    ├─ BusinessManagerAgent
    └─ BusinessBrainAgent
    ↓
[Agent.process()] → 도구 실행
    ├─ getData() - 데이터 조회
    ├─ filterData() - 데이터 필터링
    ├─ aggregateData() - 데이터 집계
    └─ visualizeData() - 시각화 정보 생성
    ↓
[LLM 응답 생성] (OpenAI Service)
    ↓
[결과 반환]
    ├─ response: string
    ├─ data: any
    ├─ charts: any[]
    └─ actions: Array<{label, action, data}>
```

### 1.2 Agent 타입

| Agent 타입 | 역할 | 주요 기능 |
|-----------|------|----------|
| **DataAnalystAgent** | 데이터 분석 전문 | 통계 분석, 트렌드 분석, 데이터 조회 |
| **PerformanceMarketerAgent** | 마케팅 전략 전문 | 트렌드 추출, 콘텐츠 생성, 세그먼트 생성 |
| **BusinessManagerAgent** | 비즈니스 전략 전문 | 전략 분석, 메트릭 예측, 시나리오 시뮬레이션 |
| **BusinessBrainAgent** | 경영 인사이트 전문 | 건강도 점수, 브리핑, 인사이트 발견 |

### 1.3 오케스트레이션 시스템

| 시스템 | 역할 | 특징 |
|--------|------|------|
| **AgentRouter** | 단일 Agent 선택 및 라우팅 | 키워드 기반 의도 분류 |
| **AgentOrchestrator** | 다중 Agent 협업 (레거시) | 키워드 기반 복합 질문 분석 |
| **EnhancedAgentOrchestrator** | 고급 다중 Agent 협업 (v4.2) | LLM 기반 작업 분해, Agent 간 통신 |

---

## 2. Agent 계층 구조

### 2.1 상속 구조

```
BaseAgent (추상 클래스)
├── 공통 기능
│   ├── getData() - 데이터 조회 (캐싱 지원)
│   ├── filterData() - 데이터 필터링
│   ├── aggregateData() - 데이터 집계
│   └── visualizeData() - 시각화 정보 생성
│
├── DataAnalystAgent
│   └── process() - 데이터 분석 처리
│
├── PerformanceMarketerAgent
│   └── process() - 마케팅 전략 처리
│
├── BusinessManagerAgent
│   └── process() - 비즈니스 전략 처리
│
└── BusinessBrainAgent
    └── process() - 경영 인사이트 처리
```

### 2.2 BaseAgent 공통 기능

#### 2.2.1 데이터 조회 (`getData`)

```typescript
async getData(params: {
  sheet: ExtendedSheetType
  dateRange?: { start: string; end: string }
  filters?: Record<string, any> | Array<{ column, operator, value }>
  limit?: number
  skipCache?: boolean
}): Promise<ToolResult>
```

**특징:**
- ✅ 캐싱 지원 (`dataCacheService`)
- ✅ 날짜 범위 필터링 자동 적용
- ✅ 다중 필터 조건 지원
- ✅ 시트 스키마 자동 매핑

**지원 시트:**
- `order`, `logistics`, `users`, `artists`
- `review`, `user_locale`, `settlement_records`
- `sopo_tracking`, `qc_text`, `qc_image`
- `rate_lotte`, `rate_ems`, `rate_kpacket`

#### 2.2.2 데이터 필터링 (`filterData`)

**지원 연산자:**
- `equals`, `not_equals`
- `contains`, `not_contains`
- `greater_than`, `less_than`
- `greater_than_or_equal`, `less_than_or_equal`
- `in`, `not_in`
- `between`
- `starts_with`, `ends_with`

#### 2.2.3 데이터 집계 (`aggregateData`)

**지원 집계 함수:**
- `sum`, `avg`, `count`, `max`, `min`

**그룹화 지원:**
- 다중 컬럼 그룹화
- 그룹별 집계 결과 반환

---

## 3. 개별 Agent 상세 분석

### 3.1 DataAnalystAgent

**파일**: `backend/src/services/agents/DataAnalystAgent.ts`  
**라인 수**: ~1,036줄

#### 3.1.1 주요 기능

1. **의도 분류 및 엔티티 추출**
   - LLM 기반 의도 분류 (`IntentClassifier`)
   - 폴백: 키워드 기반 분석 (`analyzeIntent`)
   - 엔티티 추출: 시트, 날짜 범위, 필터, 집계 함수

2. **쿼리 최적화**
   - `QueryOptimizer`를 통한 쿼리 최적화
   - 쿼리 검증 및 제안

3. **데이터 분석 실행**
   - 최적화된 쿼리 실행
   - 결과 데이터 검증

4. **자연어 응답 생성**
   - LLM을 통한 분석 결과 해석
   - 구조화된 응답 형식

#### 3.1.2 처리 흐름

```
process(query)
    ↓
[의도 분류] IntentClassifier.classify()
    ├─ 성공 → ExtractedIntent
    └─ 실패 → 폴백 analyzeIntent()
    ↓
[쿼리 최적화] QueryOptimizer.optimize()
    ↓
[쿼리 검증] QueryOptimizer.validate()
    ↓
[쿼리 실행] executeOptimizedQuery()
    ↓
[응답 생성] generateResponse()
    ↓
[결과 반환]
```

#### 3.1.3 의도 유형

- `general_query` - 일반 질의
- `trend_analysis` - 트렌드 분석
- `comparison` - 비교 분석
- `aggregation` - 집계 분석
- `ranking` - 순위 분석
- `filter` - 필터링
- `join` - 조인 분석

#### 3.1.4 지원 기능

- ✅ 통계 분석
- ✅ 트렌드 분석
- ✅ 비교 분석
- ✅ 상관관계 분석 (`CorrelationAnalyzer`)
- ✅ 스마트 제안 (`SmartSuggestionEngine`)
- ✅ 재시도 로직 (`RetryHandler`)
- ✅ 응답 검증 (`ResponseValidator`)

### 3.2 PerformanceMarketerAgent

**파일**: `backend/src/services/agents/PerformanceMarketerAgent.ts`  
**라인 수**: ~723줄

#### 3.2.1 주요 기능

1. **트렌드 추출** (`extractTrends`)
   - 인기 작품/작가 발굴
   - 시즌별 트렌드 파악
   - 트렌드 인사이트 생성

2. **콘텐츠 생성** (`generateCopy`)
   - SNS, 이메일, 블로그용 마케팅 카피
   - 3가지 변형 생성
   - 톤앤매너 조정

3. **세그먼트 생성** (`createSegments`)
   - RFM 기반 고객 세분화
   - 타겟팅 전략 제안

4. **성과 분석** (`analyzePerformance`)
   - 채널별 ROI 분석
   - 전환율 분석

#### 3.2.2 의도 유형

- `extract_trends` - 트렌드 추출
- `generate_copy` - 콘텐츠 생성
- `create_segments` - 세그먼트 생성
- `analyze_performance` - 성과 분석

### 3.3 BusinessManagerAgent

**파일**: `backend/src/services/agents/BusinessManagerAgent.ts`  
**라인 수**: ~672줄

#### 3.3.1 주요 기능

1. **전략 분석** (`analyzeStrategy`)
   - 현재 상태 분석
   - 전략 제안 생성
   - 실행 계획 수립

2. **메트릭 예측** (`predictMetrics`)
   - 과거 데이터 기반 예측
   - 예측 설명 생성

3. **시나리오 시뮬레이션** (`simulateScenario`)
   - 비즈니스 시나리오 시뮬레이션
   - 예상 결과 분석

4. **인사이트 생성** (`generateInsights`)
   - 데이터 기반 비즈니스 인사이트
   - 실행 가능한 액션 제안

#### 3.3.2 의도 유형

- `analyze_strategy` - 전략 분석
- `predict_metrics` - 메트릭 예측
- `simulate_scenario` - 시나리오 시뮬레이션
- `generate_insights` - 인사이트 생성

### 3.4 BusinessBrainAgent

**파일**: `backend/src/services/agents/BusinessBrainAgent.ts`  
**라인 수**: ~2,608줄

#### 3.4.1 주요 기능

1. **경영 브리핑 생성** (`generateExecutiveBriefing`)
   - AI 기반 브리핑 생성
   - EnhancedBriefingInput 지원
   - 브리핑 품질 검증

2. **건강도 점수 계산** (`calculateHealthScore`)
   - 4차원 건강도 점수
   - 매출, 고객, 작가, 운영

3. **인사이트 발견** (`discoverInsights`)
   - 자동 인사이트 발견
   - 인사이트 스코어링

4. **고급 분석**
   - 다차원 교차 분석 (Cube Analysis)
   - 시계열 분해 분석 (STL Decomposition)
   - 통계적 유의성 검증
   - 인과관계 추론

#### 3.4.2 분석 엔진

- `CubeAnalyzer` - 다차원 교차 분석
- `DecompositionEngine` - 매출 분해 분석
- `InsightScorer` - 인사이트 스코어링
- `HealthScoreCalculator` - 건강도 점수 계산
- `DataProcessor` - 고급 데이터 분석
- `TimeSeriesDecomposer` - 시계열 분해

#### 3.4.3 지원 분석

- RFM 분석
- 코호트 분석
- 파레토 분석
- 이상 탐지
- 장기 트렌드 분석
- 매출 예측
- 다기간 비교 분석
- 신규 유저 유치 분석
- 재구매율 향상 분석
- 고객 이탈 예측
- 작가 건강도 점수
- 전략 분석
- 액션 제안

---

## 4. Agent 라우팅 및 오케스트레이션

### 4.1 AgentRouter

**파일**: `backend/src/services/agents/AgentRouter.ts`  
**역할**: 단일 Agent 선택 및 라우팅

#### 4.1.1 의도 분류 (`classifyIntent`)

**키워드 기반 점수 계산:**

```typescript
// Business Brain 키워드
const brainKeywords = ['건강도', '브리핑', '요약', '종합', '전체 현황', ...]

// Performance Marketer 키워드
const marketerKeywords = ['트렌드', '소재', '마케팅', '카피', '콘텐츠', ...]

// Business Manager 키워드
const managerKeywords = ['전략', '예측', '시뮬레이션', '시나리오', ...]

// Data Analyst 키워드 (기본값)
const analystKeywords = ['분석', '데이터', '조회', '통계', ...]
```

**선택 우선순위:**
1. Business Brain (점수 > 0이고 최고점)
2. Performance Marketer (점수 > Manager, Analyst)
3. Business Manager (점수 > Marketer, Analyst)
4. Data Analyst (기본값)

#### 4.1.2 대화 컨텍스트 처리

- `ConversationManager`를 통한 슬롯 기반 컨텍스트 유지
- 이전 대화 참조 처리
- 쿼리 강화 (`enhanceQueryWithContext`)

### 4.2 AgentOrchestrator (레거시)

**파일**: `backend/src/services/agents/AgentOrchestrator.ts`  
**역할**: 키워드 기반 다중 Agent 협업

#### 4.2.1 복합 질문 분석

```typescript
analyzeQuery(query: string): QueryAnalysis {
  // 키워드 기반 Agent 필요성 판단
  // 데이터 분석 필요 여부
  // 마케팅 분석 필요 여부
  // 비즈니스 전략 필요 여부
  // 상관관계 분석 필요 여부
}
```

#### 4.2.2 오케스트레이션 실행

- 단순 질문: 단일 Agent 처리
- 복합 질문: 다중 Agent 병렬 실행
- 결과 통합 및 상관관계 분석

### 4.3 EnhancedAgentOrchestrator (v4.2)

**파일**: `backend/src/services/agents/EnhancedAgentOrchestrator.ts`  
**역할**: LLM 기반 고급 다중 Agent 협업

#### 4.3.1 LLM 기반 작업 분해

```typescript
async decomposeTask(query: string, context: AgentContext): Promise<TaskDecomposition>
```

**특징:**
- GPT-4o 모델 사용
- JSON 형식 응답
- 작업 간 의존성 명시
- 우선순위 설정
- 예상 출력 명시

**폴백:**
- OpenAI API 실패 시 키워드 기반 분해

#### 4.3.2 Agent 간 통신

```typescript
async sendMessage(
  from: AgentRole,
  to: AgentRole | 'all',
  message: AgentMessage
): Promise<void>
```

**메시지 타입:**
- `request` - 요청
- `response` - 응답
- `notification` - 알림

#### 4.3.3 중간 결과 공유

```typescript
async shareIntermediateResult(
  taskId: string,
  resultKey: string,
  result: any
): Promise<void>
```

**특징:**
- `SharedContext`를 통한 컨텍스트 공유
- 관련 Agent에게 자동 알림

#### 4.3.4 복잡 쿼리 오케스트레이션

```typescript
async orchestrateComplexQuery(
  query: string,
  context: AgentContext
): Promise<OrchestratedResult>
```

**처리 흐름:**
1. 작업 분해 (`decomposeTask`)
2. 작업 실행 (순차/병렬/하이브리드)
3. 중간 결과 공유
4. 결과 통합
5. 최종 응답 생성

**Agent 역할:**
- `data-analyst` - 데이터 분석 전문
- `logistics-manager` - 물류 관리 전문
- `marketing-strategist` - 마케팅 전략 전문
- `customer-specialist` - 고객 관리 전문
- `business-brain` - Business Brain 에이전트
- `orchestrator` - 작업 조율

---

## 5. 공통 기능 및 도구

### 5.1 IntentClassifier

**파일**: `backend/src/services/agents/IntentClassifier.ts`  
**역할**: LLM 기반 의도 분류 및 엔티티 추출

#### 5.1.1 Function Calling

**함수 정의:**
```typescript
INTENT_CLASSIFICATION_FUNCTION = {
  name: 'classify_query_intent',
  description: '사용자의 자연어 질문을 분석하여 데이터 분석에 필요한 구조화된 의도와 엔티티를 추출합니다.',
  parameters: {
    intent: { enum: ['general_query', 'trend_analysis', ...] },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    sheets: { type: 'array', items: { enum: [...AI_ACCESSIBLE_SHEETS] } },
    dateRange: { ... },
    filters: { ... },
    aggregations: { ... },
    groupBy: { ... },
    orderBy: { ... },
    limit: { type: 'number' }
  }
}
```

#### 5.1.2 추출 엔티티

- **의도** (`intent`): 질문의 의도 유형
- **신뢰도** (`confidence`): 분류 신뢰도 (0.0 ~ 1.0)
- **시트** (`sheets`): 필요한 데이터 시트 목록
- **날짜 범위** (`dateRange`): 시작/종료 날짜, 타입
- **필터** (`filters`): 필터 조건 목록
- **집계** (`aggregations`): 집계 함수 목록
- **그룹화** (`groupBy`): 그룹화할 컬럼 목록
- **정렬** (`orderBy`): 정렬 컬럼 및 방향
- **제한** (`limit`): 결과 제한 수

### 5.2 ConversationManager

**파일**: `backend/src/services/agents/ConversationManager.ts`  
**역할**: 멀티턴 대화 컨텍스트 관리

#### 5.2.1 슬롯 기반 컨텍스트

```typescript
interface ConversationSlot {
  dateRange?: { start: string; end: string }
  sheets?: string[]
  filters?: Array<{ column, operator, value }>
  country?: string
  platform?: string
  artist?: string
  limit?: number
  intent?: string
}
```

#### 5.2.2 참조 패턴 인식

- `data_reference` - 데이터 참조 ("그", "그것", "그 데이터")
- `previous_result` - 이전 결과 참조 ("이전", "아까", "방금")
- `drill_down` - 상세 분석 요청 ("더", "자세히", "구체적으로")
- `repeat` - 반복 요청 ("다시", "한번 더")
- `same_condition` - 동일 조건 ("같은 기간", "동일 기간")
- `change_filter` - 필터 변경 ("다른 국가", "다른 플랫폼")
- `compare_request` - 비교 요청 ("비교", "대비")

#### 5.2.3 슬롯 추출

- 국가: 일본(JP), 미국(US), 한국(KR), 중국(CN), 대만(TW), 홍콩(HK)
- 플랫폼: iOS, Android, Web
- 제한: "상위 N개", "N개", "top N"

### 5.3 QueryOptimizer

**파일**: `backend/src/services/agents/QueryOptimizer.ts`  
**역할**: 쿼리 최적화 및 검증

#### 5.3.1 최적화 기능

- 불필요한 시트 제거
- 날짜 범위 최적화
- 필터 조건 최적화
- 집계 함수 최적화

#### 5.3.2 검증 기능

- 쿼리 유효성 검증
- 오류 감지 및 제안
- 성능 최적화 제안

### 5.4 기타 지원 컴포넌트

- **CorrelationAnalyzer**: 상관관계 분석
- **SmartSuggestionEngine**: 스마트 제안 생성
- **RetryHandler**: 재시도 로직
- **ResponseValidator**: 응답 검증
- **MetricsCollector**: 성능 메트릭 수집

---

## 6. 대화 관리 및 컨텍스트

### 6.1 세션 관리

**Chat API** (`backend/src/routes/chat.ts`):

```typescript
const sessionContexts = new Map<string, {
  lastQuery?: string
  lastIntent?: string
  lastData?: any
  conversationCount: number
  createdAt: Date
}>()
```

**특징:**
- 세션별 컨텍스트 저장
- 1시간 이상 미사용 세션 자동 정리
- 이전 대화 참조 감지

### 6.2 대화 히스토리

- 최근 10개 메시지 유지
- 이전 대화 참조 키워드 감지
- 컨텍스트 강화

### 6.3 응답 형식

```typescript
interface AgentResponse {
  response: string              // 자연어 응답
  data?: any                   // 구조화된 데이터
  charts?: any[]               // 차트 데이터
  actions?: Array<{            // 액션 제안
    label: string
    action: string
    data?: any
  }>
}
```

---

## 7. 성능 및 최적화

### 7.1 캐싱

- **데이터 캐싱**: `dataCacheService`를 통한 시트 데이터 캐싱
- **응답 캐싱**: `responseCache`를 통한 응답 캐싱
- **캐시 키**: 시트, 날짜 범위, 필터 조건 기반

### 7.2 Rate Limiting

- **Rate Limiter**: API 호출 빈도 제한
- **재시도 로직**: 실패 시 자동 재시도

### 7.3 메트릭 수집

- **MetricsCollector**: Agent 성능 메트릭 수집
- **기록 항목**: Agent 타입, 작업, 소요 시간, 성공/실패

---

## 8. 문제점 및 개선 사항

### 8.1 현재 문제점

#### 8.1.1 Agent 선택 정확도

**문제:**
- 키워드 기반 의도 분류의 한계
- 모호한 질문에 대한 부정확한 Agent 선택

**영향:**
- 잘못된 Agent 선택으로 인한 부정확한 응답
- 사용자 경험 저하

#### 8.1.2 Agent 간 협업 부족

**문제:**
- `AgentOrchestrator`는 키워드 기반으로만 동작
- `EnhancedAgentOrchestrator`는 구현되었으나 실제 사용 빈도 낮음

**영향:**
- 복잡한 질문에 대한 불완전한 응답
- Agent 간 정보 공유 부족

#### 8.1.3 컨텍스트 관리 한계

**문제:**
- 세션 컨텍스트가 메모리 기반 (서버 재시작 시 손실)
- 장기 대화 컨텍스트 유지 어려움

**영향:**
- 대화 연속성 저하
- 이전 대화 참조 정확도 저하

#### 8.1.4 에러 핸들링

**문제:**
- LLM API 실패 시 폴백 로직은 있으나 개선 여지
- 사용자 친화적 에러 메시지 부족

**영향:**
- 사용자 혼란
- 디버깅 어려움

#### 8.1.5 날짜 파싱 문제 ⚠️ **중요**

**문제:**
- "금일", "오늘", "오늘 기준" 같은 상대적 날짜 표현 처리 부족
- LLM이 잘못된 날짜를 추출하는 경우 발생
- 예: "금일 매출" 요청 시 2025-12-12 기준이 아닌 2025-11-12~2025-11-16 데이터 출력

**원인 분석:**
1. `extractDateRange` 메서드가 "금일", "오늘" 같은 표현을 명시적으로 처리하지 않음
2. `IntentClassifier`의 `normalizeDateRange`가 상대적 날짜를 제대로 인식하지 못함
3. LLM Function Calling에서 날짜 추출 시 현재 날짜 기준이 명확하지 않음

**영향:**
- 날짜 기반 쿼리의 부정확한 결과
- 사용자 신뢰도 저하

#### 8.1.6 카테고리별 Flow 분리 부족

**문제:**
- 질문 카테고리에 따른 체계적인 Flow 분리 없음
- 복합 질문 처리 시 일관성 부족

**영향:**
- 복잡한 질문에 대한 불완전한 응답
- Agent 간 협업 효율성 저하

#### 8.1.7 페이지 연동 기능 부족

**문제:**
- 자연어로 다른 페이지로 이동하는 기능 미구현
- 액션 제안이 있으나 실제 네비게이션 연동 부족

**영향:**
- 사용자 워크플로우 단절
- AI 어시스턴트의 활용도 저하

### 8.2 개선 제안

#### 8.2.1 Agent 선택 정확도 향상

**제안:**
1. LLM 기반 의도 분류 강화
2. 사용자 피드백 기반 학습
3. Agent 선택 신뢰도 표시

#### 8.2.2 Agent 간 협업 강화

**제안:**
1. `EnhancedAgentOrchestrator` 활성화
2. Agent 간 메시지 큐 구현
3. 작업 의존성 그래프 시각화

#### 8.2.3 컨텍스트 관리 개선

**제안:**
1. Redis 기반 세션 관리
2. 장기 메모리 저장소 (Vector DB)
3. 컨텍스트 압축 및 요약

#### 8.2.4 에러 핸들링 강화

**제안:**
1. 상세한 에러 로깅
2. 사용자 친화적 에러 메시지
3. 자동 복구 메커니즘

#### 8.2.5 날짜 파싱 개선 ⚠️ **우선순위 높음**

**제안:**
1. **상대적 날짜 표현 강화**
   - "금일", "오늘", "오늘 기준" → 현재 날짜로 명확히 매핑
   - "어제", "내일", "지난주", "다음주" 등 다양한 표현 지원
   - "최근 N일" 표현 개선

2. **현재 날짜 기준 명확화**
   - 시스템 프롬프트에 현재 날짜 명시
   - Function Calling 파라미터에 현재 날짜 포함
   - 날짜 파싱 시 항상 현재 날짜 기준으로 검증

3. **날짜 파싱 검증 로직 추가**
   - 파싱된 날짜가 현재 날짜보다 미래인 경우 경고
   - 상대적 날짜 표현이 감지되면 명시적으로 현재 날짜 기준으로 변환
   - 날짜 범위가 비정상적으로 넓은 경우 사용자 확인

4. **LLM Function Calling 개선**
   - 날짜 추출 시 현재 날짜 정보 제공
   - 상대적 날짜 표현을 절대 날짜로 변환하는 로직 추가

#### 8.2.6 카테고리별 Flow 분리 및 복합 응답 강화

**제안:**
1. **질문 카테고리 분류 체계 구축**
   - 데이터 조회 (Data Query)
   - 분석 요청 (Analysis Request)
   - 전략 제안 (Strategy Suggestion)
   - 인사이트 요청 (Insight Request)
   - 액션 실행 (Action Execution)

2. **카테고리별 Flow 정의**
   - 각 카테고리별로 최적의 Agent 조합 및 실행 순서 정의
   - Flow 템플릿을 통한 일관된 처리

3. **복합 질문 처리 강화**
   - 여러 카테고리를 포함하는 질문을 자동으로 분해
   - 각 카테고리별 결과를 통합하여 일관된 응답 생성

#### 8.2.7 페이지 연동 기능 구현

**제안:**
1. **자연어 기반 페이지 네비게이션**
   - "대시보드로 이동", "성과 분석 페이지 보여줘" 같은 표현 인식
   - 액션 제안에 페이지 이동 기능 추가

2. **컨텍스트 기반 페이지 제안**
   - 질문 내용에 따라 관련 페이지 자동 제안
   - 페이지 이동 시 필요한 파라미터 자동 전달

3. **크로스 페이지 연동**
   - 한 페이지에서 다른 페이지의 데이터 참조
   - 페이지 간 컨텍스트 공유

### 8.3 우선순위

| 우선순위 | 개선 사항 | 예상 효과 | 구현 난이도 |
|---------|---------|----------|-----------|
| **P0** | 날짜 파싱 개선 | 데이터 정확도 향상 | 중 |
| **P0** | 카테고리별 Flow 분리 | 복합 응답 품질 향상 | 높음 |
| **P0** | EnhancedAgentOrchestrator 활성화 | 복잡한 질문 처리 개선 | 중 |
| **P1** | 페이지 연동 기능 | 사용자 워크플로우 개선 | 중 |
| **P1** | Redis 기반 세션 관리 | 컨텍스트 유지 개선 | 낮음 |
| **P1** | 에러 핸들링 강화 | 안정성 향상 | 낮음 |
| **P2** | Agent 간 메시지 큐 | 협업 효율성 향상 | 높음 |

### 8.4 구현 계획 및 로드맵

#### 8.4.1 Phase 1: 날짜 파싱 개선 (1주)

**목표:** "금일", "오늘" 등 상대적 날짜 표현 정확도 100% 달성

**작업 내용:**
1. **Day 1-2: EnhancedDateParser 구현**
   - `EnhancedDateParser` 클래스 생성
   - 상대적 날짜 표현 처리 로직 구현
   - 날짜 범위 검증 로직 추가

2. **Day 3-4: IntentClassifier 통합**
   - `IntentClassifier`에 `EnhancedDateParser` 통합
   - 시스템 프롬프트에 현재 날짜 명시
   - Function Calling 파라미터 개선

3. **Day 5: 테스트 및 검증**
   - 다양한 날짜 표현 테스트 케이스 작성
   - 실제 쿼리로 검증
   - 에지 케이스 처리

**성공 지표:**
- "금일 매출" 쿼리 정확도: 100%
- 상대적 날짜 표현 인식률: 95% 이상
- 날짜 파싱 오류율: 5% 이하

#### 8.4.2 Phase 2: 카테고리별 Flow 분리 (2주)

**목표:** 질문 카테고리별 최적화된 Flow 구축 및 복합 응답 품질 향상

**작업 내용:**
1. **Week 1: 카테고리 분류 시스템 구축**
   - `QuestionCategory` enum 정의
   - `CategoryBasedRouter` 클래스 구현
   - 카테고리별 Flow 템플릿 정의
   - LLM 기반 카테고리 분류 구현

2. **Week 2: Flow 실행 시스템 구현**
   - Flow 실행 엔진 구현
   - 의존성 기반 단계 실행
   - 결과 통합 로직 구현
   - 기존 Agent와 통합

**성공 지표:**
- 카테고리 분류 정확도: 90% 이상
- 복합 질문 처리 성공률: 85% 이상
- 응답 품질 점수: 80점 이상

#### 8.4.3 Phase 3: 페이지 연동 기능 (1주)

**목표:** 자연어 기반 페이지 네비게이션 및 크로스 페이지 연동

**작업 내용:**
1. **Day 1-2: PageNavigationAgent 구현**
   - 페이지 라우트 정의
   - 자연어에서 네비게이션 의도 추출
   - 페이지 이동 액션 생성

2. **Day 3-4: 통합 및 프론트엔드 연동**
   - `CategoryBasedRouter`에 페이지 네비게이션 통합
   - 프론트엔드에서 액션 처리
   - 페이지 이동 시 파라미터 전달

3. **Day 5: 테스트 및 최적화**
   - 다양한 네비게이션 쿼리 테스트
   - 사용자 경험 개선
   - 에러 처리 강화

**성공 지표:**
- 페이지 네비게이션 인식률: 90% 이상
- 페이지 이동 성공률: 100%
- 사용자 만족도: 85% 이상

#### 8.4.4 Phase 4: 통합 및 최적화 (1주)

**목표:** 모든 개선 사항 통합 및 성능 최적화

**작업 내용:**
1. **Day 1-2: 전체 시스템 통합**
   - 모든 개선 사항 통합
   - 기존 시스템과의 호환성 확인
   - 통합 테스트

2. **Day 3-4: 성능 최적화**
   - 캐싱 전략 개선
   - 병렬 처리 최적화
   - 응답 시간 개선

3. **Day 5: 문서화 및 배포**
   - API 문서 업데이트
   - 사용자 가이드 작성
   - 배포 및 모니터링

**성공 지표:**
- 전체 시스템 안정성: 99% 이상
- 평균 응답 시간: 3초 이하
- 에러율: 1% 이하

#### 8.4.5 전체 구현 로드맵

```
Week 1: 날짜 파싱 개선
  ├─ EnhancedDateParser 구현
  ├─ IntentClassifier 통합
  └─ 테스트 및 검증

Week 2-3: 카테고리별 Flow 분리
  ├─ 카테고리 분류 시스템 구축
  ├─ Flow 실행 시스템 구현
  └─ 기존 Agent와 통합

Week 4: 페이지 연동 기능
  ├─ PageNavigationAgent 구현
  ├─ 프론트엔드 연동
  └─ 테스트 및 최적화

Week 5: 통합 및 최적화
  ├─ 전체 시스템 통합
  ├─ 성능 최적화
  └─ 문서화 및 배포
```

**총 예상 기간: 5주**

---

## 9. 고도화 개선안 상세

### 9.1 카테고리별 Flow 분리 및 복합 응답 시스템

#### 9.1.1 질문 카테고리 분류 체계

```typescript
// backend/src/services/agents/QuestionCategory.ts

export enum QuestionCategory {
  // 데이터 조회
  DATA_QUERY = 'data_query',
  // 분석 요청
  ANALYSIS_REQUEST = 'analysis_request',
  // 전략 제안
  STRATEGY_SUGGESTION = 'strategy_suggestion',
  // 인사이트 요청
  INSIGHT_REQUEST = 'insight_request',
  // 액션 실행
  ACTION_EXECUTION = 'action_execution',
  // 페이지 네비게이션
  PAGE_NAVIGATION = 'page_navigation',
  // 복합 질문 (여러 카테고리 포함)
  COMPLEX_QUERY = 'complex_query'
}

interface CategoryFlow {
  category: QuestionCategory
  requiredAgents: AgentRole[]
  executionOrder: 'sequential' | 'parallel' | 'hybrid'
  flowSteps: FlowStep[]
}

interface FlowStep {
  stepId: string
  agent: AgentRole
  description: string
  dependencies: string[]
  expectedOutput: string
}
```

#### 9.1.2 카테고리별 Flow 정의

**1. 데이터 조회 (DATA_QUERY)**
```typescript
const dataQueryFlow: CategoryFlow = {
  category: QuestionCategory.DATA_QUERY,
  requiredAgents: ['data-analyst'],
  executionOrder: 'sequential',
  flowSteps: [
    {
      stepId: 'query-parse',
      agent: 'data-analyst',
      description: '질문에서 데이터 요구사항 추출',
      dependencies: [],
      expectedOutput: 'ExtractedIntent with sheets, dateRange, filters'
    },
    {
      stepId: 'data-fetch',
      agent: 'data-analyst',
      description: '데이터 조회 및 필터링',
      dependencies: ['query-parse'],
      expectedOutput: 'Filtered and aggregated data'
    },
    {
      stepId: 'response-generate',
      agent: 'data-analyst',
      description: '자연어 응답 생성',
      dependencies: ['data-fetch'],
      expectedOutput: 'Natural language response with data'
    }
  ]
}
```

**2. 분석 요청 (ANALYSIS_REQUEST)**
```typescript
const analysisRequestFlow: CategoryFlow = {
  category: QuestionCategory.ANALYSIS_REQUEST,
  requiredAgents: ['data-analyst', 'business-brain'],
  executionOrder: 'hybrid',
  flowSteps: [
    {
      stepId: 'data-analysis',
      agent: 'data-analyst',
      description: '데이터 분석 및 통계 계산',
      dependencies: [],
      expectedOutput: 'Statistical analysis results'
    },
    {
      stepId: 'insight-generation',
      agent: 'business-brain',
      description: '인사이트 생성 및 해석',
      dependencies: ['data-analysis'],
      expectedOutput: 'Business insights and recommendations'
    },
    {
      stepId: 'response-integration',
      agent: 'orchestrator',
      description: '결과 통합 및 응답 생성',
      dependencies: ['data-analysis', 'insight-generation'],
      expectedOutput: 'Integrated response with insights'
    }
  ]
}
```

**3. 전략 제안 (STRATEGY_SUGGESTION)**
```typescript
const strategySuggestionFlow: CategoryFlow = {
  category: QuestionCategory.STRATEGY_SUGGESTION,
  requiredAgents: ['business-manager', 'business-brain'],
  executionOrder: 'sequential',
  flowSteps: [
    {
      stepId: 'current-state-analysis',
      agent: 'business-brain',
      description: '현재 비즈니스 상태 분석',
      dependencies: [],
      expectedOutput: 'Current business state metrics'
    },
    {
      stepId: 'strategy-generation',
      agent: 'business-manager',
      description: '전략 제안 생성',
      dependencies: ['current-state-analysis'],
      expectedOutput: 'Strategic recommendations'
    },
    {
      stepId: 'action-planning',
      agent: 'business-manager',
      description: '실행 계획 수립',
      dependencies: ['strategy-generation'],
      expectedOutput: 'Action plan with priorities'
    }
  ]
}
```

**4. 복합 질문 (COMPLEX_QUERY)**
```typescript
const complexQueryFlow: CategoryFlow = {
  category: QuestionCategory.COMPLEX_QUERY,
  requiredAgents: ['data-analyst', 'business-brain', 'business-manager'],
  executionOrder: 'hybrid',
  flowSteps: [
    {
      stepId: 'query-decomposition',
      agent: 'orchestrator',
      description: '질문을 하위 작업으로 분해',
      dependencies: [],
      expectedOutput: 'TaskDecomposition with sub-tasks'
    },
    {
      stepId: 'parallel-data-tasks',
      agent: 'data-analyst',
      description: '병렬 데이터 조회 작업',
      dependencies: ['query-decomposition'],
      expectedOutput: 'Multiple data results'
    },
    {
      stepId: 'insight-analysis',
      agent: 'business-brain',
      description: '인사이트 분석',
      dependencies: ['parallel-data-tasks'],
      expectedOutput: 'Business insights'
    },
    {
      stepId: 'strategy-synthesis',
      agent: 'business-manager',
      description: '전략 통합',
      dependencies: ['insight-analysis'],
      expectedOutput: 'Integrated strategy'
    },
    {
      stepId: 'final-integration',
      agent: 'orchestrator',
      description: '최종 결과 통합',
      dependencies: ['parallel-data-tasks', 'insight-analysis', 'strategy-synthesis'],
      expectedOutput: 'Comprehensive response'
    }
  ]
}
```

#### 9.1.3 카테고리 기반 라우터 구현

```typescript
// backend/src/services/agents/CategoryBasedRouter.ts

export class CategoryBasedRouter {
  private categoryFlows: Map<QuestionCategory, CategoryFlow>
  private intentClassifier: IntentClassifier
  private enhancedOrchestrator: EnhancedAgentOrchestrator

  constructor() {
    this.categoryFlows = new Map()
    this.initializeFlows()
  }

  /**
   * 질문 카테고리 분류 및 Flow 선택
   */
  async routeByCategory(
    query: string,
    context: AgentContext
  ): Promise<{
    category: QuestionCategory
    flow: CategoryFlow
    response: AgentResponse
  }> {
    // 1. 카테고리 분류
    const category = await this.classifyCategory(query, context)
    
    // 2. Flow 선택
    const flow = this.categoryFlows.get(category)
    if (!flow) {
      throw new Error(`Flow not found for category: ${category}`)
    }

    // 3. Flow 실행
    const response = await this.executeFlow(flow, query, context)

    return {
      category,
      flow,
      response
    }
  }

  /**
   * 카테고리 분류 (LLM 기반)
   */
  private async classifyCategory(
    query: string,
    context: AgentContext
  ): Promise<QuestionCategory> {
    const client = getOpenAIClient()
    
    if (!client) {
      return this.fallbackCategoryClassification(query)
    }

    const prompt = `
사용자 질문: "${query}"

다음 카테고리 중 가장 적합한 것을 선택하세요:

1. DATA_QUERY: 단순 데이터 조회 요청 (예: "금일 매출", "일본 시장 주문 건수")
2. ANALYSIS_REQUEST: 데이터 분석 요청 (예: "매출 트렌드 분석", "작가 성과 비교")
3. STRATEGY_SUGGESTION: 전략 제안 요청 (예: "매출 증대 방안", "고객 이탈 방지 전략")
4. INSIGHT_REQUEST: 인사이트 요청 (예: "주요 인사이트", "건강도 점수")
5. ACTION_EXECUTION: 액션 실행 요청 (예: "쿠폰 생성", "리포트 다운로드")
6. PAGE_NAVIGATION: 페이지 이동 요청 (예: "대시보드로 이동", "성과 분석 페이지 보여줘")
7. COMPLEX_QUERY: 복합 질문 (여러 카테고리 포함)

응답 형식 (JSON):
{
  "category": "data_query",
  "confidence": 0.95,
  "reasoning": "단순 데이터 조회 요청이므로 DATA_QUERY"
}
`

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '당신은 사용자 질문을 정확히 분류하는 전문가입니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })

      const result = JSON.parse(
        response.choices[0]?.message?.content || '{}'
      )

      return result.category as QuestionCategory || QuestionCategory.DATA_QUERY
    } catch (error) {
      return this.fallbackCategoryClassification(query)
    }
  }

  /**
   * Flow 실행
   */
  private async executeFlow(
    flow: CategoryFlow,
    query: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const stepResults: Map<string, any> = new Map()
    const executedSteps = new Set<string>()

    // 의존성 기반 실행
    while (executedSteps.size < flow.flowSteps.length) {
      const readySteps = flow.flowSteps.filter(
        step =>
          !executedSteps.has(step.stepId) &&
          step.dependencies.every(dep => executedSteps.has(dep))
      )

      if (readySteps.length === 0) {
        throw new Error('순환 의존성 또는 실행 불가능한 단계 감지')
      }

      // 병렬 실행 가능한 단계는 동시 실행
      const promises = readySteps.map(async step => {
        const agent = this.getAgent(step.agent)
        const stepContext: AgentContext = {
          ...context,
          previousStepResults: Array.from(stepResults.entries()).map(([k, v]) => ({
            stepId: k,
            result: v
          }))
        }

        const result = await agent.process(step.description, stepContext)
        stepResults.set(step.stepId, result)
        executedSteps.add(step.stepId)

        return { stepId: step.stepId, result }
      })

      await Promise.all(promises)
    }

    // 최종 단계 결과 반환
    const finalStep = flow.flowSteps[flow.flowSteps.length - 1]
    return stepResults.get(finalStep.stepId) as AgentResponse
  }
}
```

### 9.2 날짜 파싱 개선 방안

#### 9.2.1 상대적 날짜 표현 강화

```typescript
// backend/src/services/agents/DateParser.ts

export class EnhancedDateParser {
  private currentDate: Date

  constructor(currentDate?: Date) {
    this.currentDate = currentDate || new Date()
  }

  /**
   * 향상된 날짜 범위 파싱
   */
  parseDateRange(
    query: string,
    currentDate: Date = this.currentDate
  ): { start: string; end: string; type: 'absolute' | 'relative' } | undefined {
    const lowerQuery = query.toLowerCase()
    const today = new Date(currentDate)
    today.setHours(0, 0, 0, 0)
    const endDate = new Date(today)
    endDate.setHours(23, 59, 59, 999)

    // 1. "금일", "오늘", "오늘 기준" 처리
    if (
      lowerQuery.includes('금일') ||
      lowerQuery.includes('오늘') ||
      lowerQuery.includes('오늘 기준') ||
      lowerQuery.includes('today') ||
      lowerQuery.includes('오늘의')
    ) {
      return {
        start: today.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        type: 'relative'
      }
    }

    // 2. "어제" 처리
    if (lowerQuery.includes('어제') || lowerQuery.includes('yesterday')) {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayEnd = new Date(yesterday)
      yesterdayEnd.setHours(23, 59, 59, 999)

      return {
        start: yesterday.toISOString().split('T')[0],
        end: yesterdayEnd.toISOString().split('T')[0],
        type: 'relative'
      }
    }

    // 3. "이번 주", "이번주" 처리
    if (lowerQuery.includes('이번 주') || lowerQuery.includes('이번주') || lowerQuery.includes('this week')) {
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      return {
        start: startOfWeek.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        type: 'relative'
      }
    }

    // 4. "지난 주", "지난주" 처리
    if (lowerQuery.includes('지난 주') || lowerQuery.includes('지난주') || lowerQuery.includes('last week')) {
      const lastWeekStart = new Date(today)
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7)
      lastWeekStart.setHours(0, 0, 0, 0)
      const lastWeekEnd = new Date(lastWeekStart)
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6)
      lastWeekEnd.setHours(23, 59, 59, 999)

      return {
        start: lastWeekStart.toISOString().split('T')[0],
        end: lastWeekEnd.toISOString().split('T')[0],
        type: 'relative'
      }
    }

    // 5. "이번 달", "이번달" 처리
    if (lowerQuery.includes('이번 달') || lowerQuery.includes('이번달') || lowerQuery.includes('this month')) {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      startOfMonth.setHours(0, 0, 0, 0)

      return {
        start: startOfMonth.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        type: 'relative'
      }
    }

    // 6. "지난 달", "지난달" 처리
    if (lowerQuery.includes('지난 달') || lowerQuery.includes('지난달') || lowerQuery.includes('last month')) {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      lastMonth.setHours(0, 0, 0, 0)
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
      lastMonthEnd.setHours(23, 59, 59, 999)

      return {
        start: lastMonth.toISOString().split('T')[0],
        end: lastMonthEnd.toISOString().split('T')[0],
        type: 'relative'
      }
    }

    // 7. "최근 N일" 처리 (개선)
    const recentMatch = query.match(/(최근|recent)\s*(\d+)\s*(일|days?)/i)
    if (recentMatch) {
      const days = parseInt(recentMatch[2])
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - days + 1) // 오늘 포함
      startDate.setHours(0, 0, 0, 0)

      return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        type: 'relative'
      }
    }

    // 8. 기존 절대 날짜 파싱 (연도-월, 연도-월-일 등)
    // ... (기존 로직 유지)

    return undefined
  }

  /**
   * 날짜 범위 검증
   */
  validateDateRange(
    dateRange: { start: string; end: string },
    currentDate: Date = this.currentDate
  ): { valid: boolean; warnings: string[] } {
    const warnings: string[] = []
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    const today = new Date(currentDate)
    today.setHours(0, 0, 0, 0)

    // 미래 날짜 경고
    if (start > today) {
      warnings.push(`시작 날짜가 현재 날짜(${today.toISOString().split('T')[0]})보다 미래입니다.`)
    }

    if (end > today) {
      warnings.push(`종료 날짜가 현재 날짜(${today.toISOString().split('T')[0]})보다 미래입니다.`)
    }

    // 날짜 범위가 비정상적으로 넓은 경우
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 365) {
      warnings.push(`날짜 범위가 1년을 초과합니다 (${daysDiff}일). 의도한 범위인지 확인해주세요.`)
    }

    // 시작일이 종료일보다 늦은 경우
    if (start > end) {
      return {
        valid: false,
        warnings: ['시작 날짜가 종료 날짜보다 늦습니다.']
      }
    }

    return {
      valid: true,
      warnings
    }
  }
}
```

#### 9.2.2 IntentClassifier 개선

```typescript
// backend/src/services/agents/IntentClassifier.ts 수정

export class IntentClassifier {
  private dateParser: EnhancedDateParser

  constructor() {
    this.dateParser = new EnhancedDateParser()
  }

  private getSystemPrompt(): string {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    return `
당신은 사용자의 자연어 질문을 분석하여 데이터 분석에 필요한 구조화된 의도와 엔티티를 추출하는 전문가입니다.

**중요: 현재 날짜는 ${todayStr} (${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일)입니다.**

날짜 파싱 시 다음 규칙을 엄격히 준수하세요:
1. "금일", "오늘", "오늘 기준" → ${todayStr}
2. "어제" → ${new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
3. "이번 주" → 이번 주 월요일부터 ${todayStr}까지
4. "지난 주" → 지난 주 월요일부터 일요일까지
5. "이번 달" → 이번 달 1일부터 ${todayStr}까지
6. "지난 달" → 지난 달 1일부터 마지막 날까지
7. "최근 N일" → ${todayStr} 기준 N일 전부터 ${todayStr}까지

절대 과거의 날짜를 현재 날짜로 잘못 인식하지 마세요.
`
  }

  private normalizeDateRange(
    dateRange: any,
    query: string
  ): { start: string; end: string; type: 'absolute' | 'relative' | 'month' | 'year' | 'quarter' } {
    // EnhancedDateParser 사용
    const parsed = this.dateParser.parseDateRange(query)
    if (parsed) {
      // 검증
      const validation = this.dateParser.validateDateRange(parsed)
      if (!validation.valid) {
        console.warn('[IntentClassifier] 날짜 범위 검증 실패:', validation.warnings)
      }
      if (validation.warnings.length > 0) {
        console.warn('[IntentClassifier] 날짜 범위 경고:', validation.warnings)
      }

      return {
        start: parsed.start,
        end: parsed.end,
        type: parsed.type === 'absolute' ? 'absolute' : 'relative'
      }
    }

    // 기존 로직 (폴백)
    // ...
  }
}
```

### 9.3 페이지 연동 기능 구현

#### 9.3.1 페이지 네비게이션 액션

```typescript
// backend/src/services/agents/PageNavigationAgent.ts

export class PageNavigationAgent {
  private pageRoutes: Map<string, PageRoute>

  constructor() {
    this.pageRoutes = new Map()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.pageRoutes.set('대시보드', {
      path: '/dashboard',
      description: '메인 대시보드 페이지',
      params: []
    })

    this.pageRoutes.set('성과 분석', {
      path: '/analytics',
      description: '성과 분석 페이지',
      params: ['tab', 'metric', 'period']
    })

    this.pageRoutes.set('비즈니스 브레인', {
      path: '/business-brain',
      description: 'Business Brain 페이지',
      params: ['tab', 'focus', 'period']
    })

    this.pageRoutes.set('작가 분석', {
      path: '/artist-analytics',
      description: '작가 분석 페이지',
      params: ['artist', 'period']
    })

    // ... 더 많은 라우트
  }

  /**
   * 자연어에서 페이지 이동 의도 추출
   */
  async extractNavigationIntent(
    query: string
  ): Promise<NavigationIntent | null> {
    const client = getOpenAIClient()
    
    if (!client) {
      return this.fallbackNavigationExtraction(query)
    }

    const prompt = `
사용자 질문: "${query}"

이 질문이 페이지 이동 요청인지 판단하고, 이동할 페이지와 필요한 파라미터를 추출하세요.

사용 가능한 페이지:
${Array.from(this.pageRoutes.entries()).map(([name, route]) => 
  `- ${name}: ${route.path} (${route.description})`
).join('\n')}

응답 형식 (JSON):
{
  "isNavigation": true,
  "targetPage": "성과 분석",
  "path": "/analytics",
  "params": {
    "tab": "overview",
    "metric": "gmv"
  },
  "confidence": 0.95
}
`

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '당신은 사용자의 페이지 이동 의도를 정확히 파악하는 전문가입니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })

      const result = JSON.parse(
        response.choices[0]?.message?.content || '{}'
      )

      if (result.isNavigation) {
        return {
          targetPage: result.targetPage,
          path: result.path,
          params: result.params || {},
          confidence: result.confidence || 0.8
        }
      }

      return null
    } catch (error) {
      return this.fallbackNavigationExtraction(query)
    }
  }

  /**
   * 액션 응답에 페이지 이동 추가
   */
  enhanceResponseWithNavigation(
    response: AgentResponse,
    navigationIntent: NavigationIntent
  ): AgentResponse {
    return {
      ...response,
      actions: [
        ...(response.actions || []),
        {
          label: `${navigationIntent.targetPage}로 이동`,
          action: 'navigate',
          data: {
            path: navigationIntent.path,
            params: navigationIntent.params
          }
        }
      ]
    }
  }
}

interface NavigationIntent {
  targetPage: string
  path: string
  params: Record<string, any>
  confidence: number
}

interface PageRoute {
  path: string
  description: string
  params: string[]
}
```

#### 9.3.2 통합 라우터에 페이지 네비게이션 통합

```typescript
// backend/src/services/agents/CategoryBasedRouter.ts 수정

export class CategoryBasedRouter {
  private pageNavigationAgent: PageNavigationAgent

  async routeByCategory(
    query: string,
    context: AgentContext
  ): Promise<{
    category: QuestionCategory
    flow: CategoryFlow
    response: AgentResponse
  }> {
    // 1. 페이지 네비게이션 의도 확인
    const navIntent = await this.pageNavigationAgent.extractNavigationIntent(query)
    if (navIntent && navIntent.confidence > 0.8) {
      return {
        category: QuestionCategory.PAGE_NAVIGATION,
        flow: this.getNavigationFlow(),
        response: {
          response: `${navIntent.targetPage}로 이동합니다.`,
          actions: [{
            label: `${navIntent.targetPage}로 이동`,
            action: 'navigate',
            data: {
              path: navIntent.path,
              params: navIntent.params
            }
          }]
        }
      }
    }

    // 2. 일반 카테고리 분류 및 Flow 실행
    const category = await this.classifyCategory(query, context)
    const flow = this.categoryFlows.get(category)
    const response = await this.executeFlow(flow, query, context)

    // 3. 응답에 관련 페이지 제안 추가
    const enhancedResponse = await this.addPageSuggestions(response, category, query)

    return {
      category,
      flow,
      response: enhancedResponse
    }
  }

  /**
   * 응답에 관련 페이지 제안 추가
   */
  private async addPageSuggestions(
    response: AgentResponse,
    category: QuestionCategory,
    query: string
  ): Promise<AgentResponse> {
    const suggestions: Array<{ label: string; action: string; data: any }> = []

    // 카테고리별 관련 페이지 제안
    switch (category) {
      case QuestionCategory.DATA_QUERY:
        suggestions.push({
          label: '성과 분석 페이지에서 상세 확인',
          action: 'navigate',
          data: {
            path: '/analytics',
            params: { tab: 'overview' }
          }
        })
        break

      case QuestionCategory.ANALYSIS_REQUEST:
        suggestions.push({
          label: 'Business Brain에서 인사이트 확인',
          action: 'navigate',
          data: {
            path: '/business-brain',
            params: { tab: 'insights' }
          }
        })
        break

      case QuestionCategory.STRATEGY_SUGGESTION:
        suggestions.push({
          label: 'Business Brain에서 전략 분석 확인',
          action: 'navigate',
          data: {
            path: '/business-brain',
            params: { tab: 'strategy' }
          }
        })
        break
    }

    return {
      ...response,
      actions: [
        ...(response.actions || []),
        ...suggestions
      ]
    }
  }
}
```

---

## 9. 결론

### 9.1 현재 상태

**강점:**
- ✅ 명확한 Agent 역할 분리
- ✅ 공통 기능 재사용 (BaseAgent)
- ✅ LLM 기반 의도 분류 지원
- ✅ 대화 컨텍스트 관리
- ✅ 캐싱 및 성능 최적화

**약점:**
- ⚠️ Agent 선택 정확도 개선 필요
- ⚠️ Agent 간 협업 활성화 필요
- ⚠️ 장기 컨텍스트 관리 개선 필요
- ⚠️ 에러 핸들링 강화 필요
- ⚠️ **날짜 파싱 정확도 개선 필요 (중요)**
- ⚠️ **카테고리별 Flow 분리 부족**
- ⚠️ **페이지 연동 기능 부족**

### 9.2 고도화 개선안 요약

**핵심 개선 사항:**

1. **날짜 파싱 개선 (P0)**
   - "금일", "오늘" 등 상대적 날짜 표현 정확도 100% 달성
   - `EnhancedDateParser` 구현
   - 날짜 범위 검증 로직 추가

2. **카테고리별 Flow 분리 (P0)**
   - 질문 카테고리별 최적화된 Flow 구축
   - 복합 질문 처리 강화
   - `CategoryBasedRouter` 구현

3. **페이지 연동 기능 (P1)**
   - 자연어 기반 페이지 네비게이션
   - 크로스 페이지 연동
   - `PageNavigationAgent` 구현

**예상 효과:**
- 날짜 파싱 정확도: 95% 이상
- 복합 질문 처리 성공률: 85% 이상
- 사용자 만족도: 85% 이상
- 페이지 네비게이션 인식률: 90% 이상

### 9.3 전체 평가

**구조 설계**: A (90/100)
- 명확한 계층 구조
- 확장 가능한 아키텍처
- 고도화 개선안으로 A+ 달성 가능

**기능 완성도**: B+ (85/100)
- 핵심 기능 구현 완료
- 개선 여지 존재
- 고도화 개선안 적용 시 A 달성 가능

**성능**: A- (88/100)
- 캐싱 및 최적화 적용
- 추가 최적화 가능

**사용자 경험**: B (80/100)
- 기본 기능 동작
- 정확도 및 안정성 개선 필요
- 고도화 개선안 적용 시 A- 달성 가능

**전체 평가**: B+ (86/100)
**고도화 후 예상 평가**: A- (92/100)

---

## 10. 다음 단계

### 10.1 즉시 시작 가능한 작업

1. **날짜 파싱 개선 (P0)**
   - `EnhancedDateParser` 클래스 구현
   - `IntentClassifier` 통합
   - 테스트 케이스 작성

2. **카테고리별 Flow 분리 (P0)**
   - `QuestionCategory` enum 정의
   - `CategoryBasedRouter` 클래스 구현
   - 카테고리별 Flow 템플릿 정의

3. **페이지 연동 기능 (P1)**
   - `PageNavigationAgent` 클래스 구현
   - 프론트엔드 액션 처리 로직 추가

### 10.2 예상 일정

- **Week 1**: 날짜 파싱 개선 완료
- **Week 2-3**: 카테고리별 Flow 분리 완료
- **Week 4**: 페이지 연동 기능 완료
- **Week 5**: 통합 및 최적화 완료

### 10.3 성공 지표

- 날짜 파싱 정확도: 95% 이상
- 카테고리 분류 정확도: 90% 이상
- 복합 질문 처리 성공률: 85% 이상
- 페이지 네비게이션 인식률: 90% 이상
- 사용자 만족도: 85% 이상

---

**작성자**: AI Assistant  
**검토일**: 2024-12-19  
**최종 업데이트**: 2024-12-19 (고도화 개선안 추가)  
**다음 검토 예정일**: 개선 사항 구현 후

