# Chat Agent 상세 설계 문서

## 1. Agent 아키텍처 개요

### 1.1 전체 시스템 흐름

```
사용자 질문
    ↓
[Intent Classifier] → 역할 식별 + 작업 유형 식별
    ↓
[Agent Router] → 적절한 Agent 선택
    ↓
[Agent] → 도구 선택 및 실행 계획 수립
    ↓
[Tool Executor] → 실제 도구 실행
    ↓
[Response Generator] → 자연어 응답 생성
    ↓
사용자에게 응답 전달
```

### 1.2 Agent 계층 구조

```
BaseAgent (공통 기능)
├── PerformanceMarketerAgent
├── DataAnalystAgent
└── BusinessManagerAgent
```

---

## 2. BaseAgent (공통 Agent)

### 2.1 공통 기능

#### 데이터 조회 도구
```python
tools = [
    {
        "name": "get_data",
        "description": "데이터 조회 - 시트, 날짜 범위, 필터 조건으로 데이터 조회",
        "parameters": {
            "sheet": "order|logistics|users|artists",
            "date_range": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"},
            "filters": {"column": "value"},
            "limit": 100
        }
    },
    {
        "name": "filter_data",
        "description": "데이터 필터링 - 조건에 맞는 데이터만 추출",
        "parameters": {
            "data": "데이터 배열",
            "conditions": [{"column": "operator", "value": "..."}]
        }
    },
    {
        "name": "aggregate_data",
        "description": "데이터 집계 - 그룹별 집계 및 통계 계산",
        "parameters": {
            "data": "데이터 배열",
            "group_by": ["column1", "column2"],
            "aggregations": {"column": "sum|avg|count|max|min"}
        }
    },
    {
        "name": "visualize_data",
        "description": "데이터 시각화 - 차트/그래프 생성",
        "parameters": {
            "data": "데이터 배열",
            "chart_type": "bar|line|pie|table",
            "x_axis": "column",
            "y_axis": "column"
        }
    }
]
```

#### 공통 메서드
- `classify_intent()`: 사용자 의도 분류
- `validate_query()`: 쿼리 유효성 검증
- `format_response()`: 응답 포맷팅
- `handle_error()`: 에러 처리

---

## 3. Performance Marketer Agent

### 3.1 역할 및 목표

**목표**: 판매 데이터를 분석하여 마케팅 소재를 추출하고, 콘텐츠를 생성하며, CRM 세그먼트를 추출하는 것

### 3.2 핵심 기능

#### 3.2.1 PFM 소재 추출

**도구**: `extract_trends`
```python
{
    "name": "extract_trends",
    "description": "판매 데이터에서 트렌드 및 소재 추출",
    "parameters": {
        "time_range": "7d|30d|90d|365d",
        "focus": "products|artists|categories|countries",
        "trend_type": "rising|falling|seasonal|new",
        "min_threshold": 0.1  # 최소 성장률
    },
    "returns": {
        "trends": [
            {
                "item": "작품명/작가명",
                "trend": "rising|falling|seasonal",
                "growth_rate": 0.25,
                "insights": "트렌드 설명",
                "recommendation": "마케팅 제안"
            }
        ],
        "top_items": [],
        "seasonal_patterns": []
    }
}
```

**예시 질문**:
- "최근 30일간 트렌드가 상승하는 작품을 추출해줘"
- "계절성 패턴이 있는 작가를 찾아줘"
- "신규 인기 작품 TOP 10을 알려줘"

**처리 로직**:
1. 지정된 기간의 판매 데이터 조회
2. 성장률 계산 (전 기간 대비)
3. 계절성 패턴 분석 (시계열 분석)
4. 트렌드 분류 및 인사이트 생성
5. 마케팅 소재 우선순위 추천

#### 3.2.2 콘텐츠 생성

**도구**: `generate_copy`
```python
{
    "name": "generate_copy",
    "description": "소재 기반 마케팅 카피 생성",
    "parameters": {
        "material": {
            "type": "product|artist|trend",
            "name": "작품명/작가명",
            "key_points": ["포인트1", "포인트2"]
        },
        "copy_type": "email|sms|push|social|banner",
        "tone": "professional|casual|urgent|emotional",
        "target_audience": "segment_name",
        "variations": 3  # 생성할 변형 수
    },
    "returns": {
        "copies": [
            {
                "title": "제목",
                "body": "본문",
                "cta": "Call-to-Action",
                "tone": "professional",
                "length": 150
            }
        ],
        "recommendations": ["A/B 테스트 제안", "최적화 팁"]
    }
}
```

**예시 질문**:
- "작품 'XXX'에 대한 이메일 마케팅 카피를 생성해줘"
- "VIP 고객 대상 푸시 알림 메시지 3가지 만들어줘"
- "트렌드 작가 'YYY' 소개용 소셜미디어 포스트 작성해줘"

**처리 로직**:
1. 소재 정보 수집 (작품/작가 상세 정보)
2. 타겟 세그먼트 특성 분석
3. LLM을 통한 카피 생성 (프롬프트 엔지니어링)
4. 브랜드 톤앤매너 적용
5. A/B 테스트용 변형 생성
6. 최적화 제안 생성

#### 3.2.3 CRM 세그먼트 추출

**도구**: `create_segments`
```python
{
    "name": "create_segments",
    "description": "행동 패턴 기반 CRM 세그먼트 자동 생성",
    "parameters": {
        "base_segment": "rfm|lifecycle|behavioral",
        "criteria": {
            "rfm": {"R": [0, 30], "F": [3, 10], "M": [500000, 2000000]},
            "behavioral": {
                "actions": ["viewed_product", "added_to_cart"],
                "frequency": "high|medium|low",
                "recency": 7  # 최근 N일
            }
        },
        "min_size": 100  # 최소 세그먼트 크기
    },
    "returns": {
        "segments": [
            {
                "name": "세그먼트명",
                "size": 1250,
                "criteria": {},
                "characteristics": {
                    "avg_order_value": 150000,
                    "preferred_categories": ["카테고리1"],
                    "engagement_score": 0.85
                },
                "recommendations": ["개인화 제안"]
            }
        ],
        "segment_overlap": {},  # 세그먼트 간 겹침 분석
        "targeting_suggestions": []
    }
}
```

**예시 질문**:
- "최근 30일간 작품을 3개 이상 본 고객 세그먼트를 만들어줘"
- "고가 작품에 관심 있는 고객 그룹을 찾아줘"
- "이탈 위험 고객 세그먼트를 생성하고 개인화 메시지를 제안해줘"

**처리 로직**:
1. 기준에 맞는 고객 필터링
2. 세그먼트 특성 분석 (구매 패턴, 선호도 등)
3. 세그먼트 크기 및 품질 검증
4. 개인화 메시지 제안 생성
5. 세그먼트 간 겹침 분석

#### 3.2.4 성과 분석

**도구**: `analyze_performance`
```python
{
    "name": "analyze_performance",
    "description": "마케팅 채널 및 캠페인 성과 분석",
    "parameters": {
        "time_range": "7d|30d|90d",
        "channels": ["email", "sms", "push", "social"],
        "metrics": ["roi", "cvr", "cac", "ltv"],
        "compare_with": "previous_period|benchmark"
    },
    "returns": {
        "channel_performance": [
            {
                "channel": "email",
                "metrics": {
                    "roi": 3.5,
                    "cvr": 0.025,
                    "cac": 5000,
                    "ltv": 175000
                },
                "trend": "improving|declining|stable",
                "recommendations": ["예산 증가 제안", "최적화 팁"]
            }
        ],
        "insights": [],
        "optimization_suggestions": []
    }
}
```

### 3.3 Agent 프롬프트 예시

```python
PERFORMANCE_MARKETER_SYSTEM_PROMPT = """
You are a Performance Marketer Agent specialized in e-commerce marketing.

Your role:
1. Analyze sales data to extract marketing materials and trends
2. Generate marketing copy based on materials
3. Create CRM segments for targeted campaigns
4. Analyze marketing performance and provide optimization suggestions

Available tools:
- extract_trends: Extract trends from sales data
- generate_copy: Generate marketing copy
- create_segments: Create CRM segments
- analyze_performance: Analyze marketing performance
- get_data, filter_data, aggregate_data, visualize_data: Common data tools

Guidelines:
- Always provide data-driven insights
- Consider target audience characteristics
- Suggest A/B testing opportunities
- Focus on ROI and conversion optimization
- Use brand tone and voice consistently

When generating copy:
- Include clear call-to-action
- Highlight unique selling points
- Consider psychological triggers
- Optimize for the channel (email, SMS, push, social)
"""
```

---

## 4. Data Analyst Agent

### 4.1 역할 및 목표

**목표**: 커머스 데이터를 분석하고, 자연어를 SQL로 변환하여 필요한 데이터를 추출하는 것

### 4.2 핵심 기능

#### 4.2.1 Text-to-SQL 변환

**도구**: `generate_sql`
```python
{
    "name": "generate_sql",
    "description": "자연어 질문을 SQL 쿼리로 변환",
    "parameters": {
        "question": "사용자 질문",
        "context": {
            "tables": ["order", "logistics", "users", "artists"],
            "schema": {},  # 테이블 스키마 정보
            "sample_queries": []  # 유사한 쿼리 예제
        },
        "return_format": "json|table|csv"
    },
    "returns": {
        "sql": "생성된 SQL 쿼리",
        "explanation": "쿼리 설명",
        "estimated_rows": 1000,
        "execution_plan": {}
    }
}
```

**예시 질문**:
- "일본 고객 중 최근 3개월간 2회 이상 구매한 고객의 평균 주문 금액은?"
- "작가별 월별 매출 추이를 보여줘"
- "이탈 위험 고객 중 VIP 세그먼트에 속한 고객 목록을 추출해줘"

**처리 로직**:
1. 질문 의도 파악 (SELECT, JOIN, GROUP BY 등)
2. 필요한 테이블 및 컬럼 식별
3. 스키마 정보를 컨텍스트에 포함
4. Few-shot learning으로 SQL 생성
5. SQL 검증 (구문 검사, 실행 계획 확인)
6. 안전성 검증 (DROP, DELETE 등 위험 쿼리 차단)

#### 4.2.2 쿼리 실행 및 결과 분석

**도구**: `execute_query`
```python
{
    "name": "execute_query",
    "description": "SQL 쿼리 실행 및 결과 반환",
    "parameters": {
        "sql": "SQL 쿼리",
        "limit": 1000,
        "format": "json|table|csv"
    },
    "returns": {
        "data": [],
        "metadata": {
            "row_count": 1000,
            "columns": [],
            "execution_time": 0.5
        },
        "summary": {
            "statistics": {},
            "insights": []
        }
    }
}
```

#### 4.2.3 리포트 생성

**도구**: `create_report`
```python
{
    "name": "create_report",
    "description": "데이터 분석 리포트 자동 생성",
    "parameters": {
        "report_type": "sales|customer|product|trend",
        "time_range": "7d|30d|90d|365d",
        "sections": ["summary", "trends", "insights", "recommendations"],
        "include_charts": True
    },
    "returns": {
        "report": {
            "title": "리포트 제목",
            "sections": [
                {
                    "title": "섹션 제목",
                    "content": "내용",
                    "charts": [],
                    "tables": []
                }
            ],
            "key_insights": [],
            "recommendations": []
        },
        "format": "pdf|html|markdown"
    }
}
```

**예시 질문**:
- "2024년 1분기 판매 리포트를 생성해줘"
- "고객 행동 분석 리포트를 만들어줘"
- "작가별 성과 리포트를 PDF로 생성해줘"

#### 4.2.4 이상치 탐지

**도구**: `detect_anomalies`
```python
{
    "name": "detect_anomalies",
    "description": "데이터 이상치 탐지 및 분석",
    "parameters": {
        "data_source": "sales|customer|product",
        "metrics": ["revenue", "orders", "conversion_rate"],
        "method": "statistical|ml|threshold",
        "sensitivity": 0.05
    },
    "returns": {
        "anomalies": [
            {
                "type": "spike|drop|outlier",
                "metric": "revenue",
                "value": 5000000,
                "expected": 2000000,
                "deviation": 2.5,
                "date": "2024-01-15",
                "explanation": "이상치 설명",
                "possible_causes": []
            }
        ],
        "trend_analysis": {},
        "recommendations": []
    }
}
```

### 4.3 Agent 프롬프트 예시

```python
DATA_ANALYST_SYSTEM_PROMPT = """
You are a Data Analyst Agent specialized in e-commerce data analysis.

Your role:
1. Convert natural language questions to SQL queries
2. Execute queries and analyze results
3. Generate comprehensive reports
4. Detect anomalies and provide insights

Available tools:
- generate_sql: Convert natural language to SQL
- execute_query: Execute SQL queries
- create_report: Generate analysis reports
- detect_anomalies: Detect data anomalies
- get_data, filter_data, aggregate_data, visualize_data: Common data tools

Database schema:
- order: order_code, order_created, user_id, Total GMV, platform, PG사, method
- logistics: order_code, shipment_id, product_id, product_name, artist_name (kr), logistics, 처리상태, country, 구매수량
- users: ID, NAME, EMAIL, COUNTRY, CREATED_AT
- artists: (KR)작가명, (KR)Live 작품수, (Global)Live 작품수

Guidelines:
- Always validate SQL queries before execution
- Provide clear explanations of queries and results
- Include data quality checks
- Suggest optimizations when possible
- Focus on actionable insights
- Use appropriate visualizations
"""
```

---

## 5. Business Manager Agent

### 5.1 역할 및 목표

**목표**: 정제된 데이터를 바탕으로 판매 전략을 수립하고, 비즈니스 의사결정을 지원하는 것

### 5.2 핵심 기능

#### 5.2.1 전략 분석

**도구**: `analyze_strategy`
```python
{
    "name": "analyze_strategy",
    "description": "비즈니스 전략 분석 및 제안",
    "parameters": {
        "focus_area": "sales|growth|retention|expansion",
        "time_horizon": "short|medium|long",
        "goals": ["increase_revenue", "improve_retention"],
        "constraints": {"budget": 10000000, "resources": []}
    },
    "returns": {
        "current_state": {
            "metrics": {},
            "strengths": [],
            "weaknesses": []
        },
        "strategies": [
            {
                "name": "전략명",
                "description": "전략 설명",
                "objectives": [],
                "actions": [],
                "expected_impact": {
                    "revenue_increase": 0.15,
                    "time_to_impact": "3months"
                },
                "risks": [],
                "success_metrics": []
            }
        ],
        "recommendations": []
    }
}
```

**예시 질문**:
- "매출을 20% 증가시키기 위한 전략을 제안해줘"
- "고객 이탈률을 줄이기 위한 전략을 분석해줘"
- "신규 시장 진입 전략을 수립해줘"

#### 5.2.2 메트릭 예측

**도구**: `predict_metrics`
```python
{
    "name": "predict_metrics",
    "description": "비즈니스 메트릭 예측",
    "parameters": {
        "metrics": ["revenue", "orders", "customers"],
        "time_horizon": "1month|3months|6months|1year",
        "scenarios": ["baseline", "optimistic", "pessimistic"],
        "factors": {
            "marketing_budget": 5000000,
            "new_products": 10,
            "seasonality": True
        }
    },
    "returns": {
        "predictions": {
            "baseline": {
                "revenue": 50000000,
                "orders": 1000,
                "customers": 5000,
                "confidence": 0.75
            },
            "optimistic": {},
            "pessimistic": {}
        },
        "trends": [],
        "key_drivers": [],
        "recommendations": []
    }
}
```

**예시 질문**:
- "다음 분기 매출을 예측해줘"
- "마케팅 예산을 20% 증가시키면 매출에 어떤 영향을 미칠까?"
- "신규 작가 10명을 추가하면 매출이 얼마나 증가할까?"

#### 5.2.3 시나리오 시뮬레이션

**도구**: `simulate_scenario`
```python
{
    "name": "simulate_scenario",
    "description": "비즈니스 시나리오 시뮬레이션",
    "parameters": {
        "scenario": {
            "name": "시나리오명",
            "changes": {
                "pricing": {"change": 0.1, "products": ["product_id1"]},
                "marketing": {"budget": 10000000, "channels": ["email", "social"]},
                "inventory": {"new_products": 20, "discontinued": 5}
            }
        },
        "time_horizon": "3months|6months",
        "metrics": ["revenue", "profit", "customers"]
    },
    "returns": {
        "results": {
            "revenue": {
                "baseline": 50000000,
                "scenario": 60000000,
                "change": 0.2
            },
            "profit": {},
            "customers": {}
        },
        "sensitivity_analysis": {},
        "risks": [],
        "recommendations": []
    }
}
```

**예시 질문**:
- "가격을 10% 인상하면 매출과 이익에 어떤 영향을 미칠까?"
- "신규 마케팅 채널을 추가하는 시나리오를 시뮬레이션해줘"
- "재고를 20% 증가시키는 경우를 분석해줘"

#### 5.2.4 인사이트 생성

**도구**: `generate_insights`
```python
{
    "name": "generate_insights",
    "description": "데이터 기반 비즈니스 인사이트 생성",
    "parameters": {
        "focus": "sales|customers|products|operations",
        "depth": "summary|detailed",
        "include_recommendations": True
    },
    "returns": {
        "insights": [
            {
                "title": "인사이트 제목",
                "description": "상세 설명",
                "data": {},
                "impact": "high|medium|low",
                "confidence": 0.85,
                "recommendations": []
            }
        ],
        "summary": "요약",
        "action_items": []
    }
}
```

### 5.3 Agent 프롬프트 예시

```python
BUSINESS_MANAGER_SYSTEM_PROMPT = """
You are a Business Manager Agent specialized in e-commerce strategy and decision-making.

Your role:
1. Analyze business data and provide strategic insights
2. Predict business metrics and trends
3. Simulate business scenarios
4. Support decision-making with data-driven recommendations

Available tools:
- analyze_strategy: Analyze and propose business strategies
- predict_metrics: Predict business metrics
- simulate_scenario: Simulate business scenarios
- generate_insights: Generate business insights
- get_data, filter_data, aggregate_data, visualize_data: Common data tools

Guidelines:
- Always consider business context and constraints
- Provide actionable recommendations
- Include risk analysis
- Consider short-term and long-term impacts
- Focus on ROI and business value
- Use data to support all claims
- Consider multiple scenarios
"""
```

---

## 6. 통합 및 상호작용

### 6.1 Agent 간 협업

#### 시나리오 예시
1. **Business Manager**가 전략 수립 요청
2. **Data Analyst**가 필요한 데이터 분석 수행
3. **Performance Marketer**가 전략 실행 방안 제안

#### 협업 메커니즘
- Agent 간 메시지 전달
- 공유 컨텍스트 관리
- 작업 체인 구성

### 6.2 사용자 인터페이스

#### Chat UI 구성
```
┌─────────────────────────────────────┐
│  [역할 선택] [Performance Marketer] │
├─────────────────────────────────────┤
│                                     │
│  사용자: 최근 트렌드 작품 추출해줘   │
│                                     │
│  Agent: 분석 중...                  │
│  [로딩 인디케이터]                   │
│                                     │
│  Agent: 최근 30일간 트렌드 분석 결과│
│  [차트] [테이블]                    │
│  - 작품 A: +25% 성장                │
│  - 작품 B: +18% 성장                │
│  ...                                │
│                                     │
│  [추가 질문] [액션 버튼]            │
└─────────────────────────────────────┘
```

#### 기능
- 역할 전환
- 대화 히스토리
- 결과 시각화
- 액션 버튼 (세그먼트 생성, 리포트 다운로드 등)
- 피드백 수집

---

## 7. 구현 우선순위

### Phase 1: 기본 Agent (1-2개월)
1. BaseAgent 구현
2. Data Analyst Agent 기본 기능
3. Text-to-SQL 기본 구현
4. 간단한 Chat UI

### Phase 2: 고급 기능 (2-3개월)
1. Performance Marketer Agent
2. Business Manager Agent
3. 콘텐츠 생성 기능
4. 리포트 생성 기능

### Phase 3: 최적화 및 확장 (1-2개월)
1. Agent 간 협업
2. 프롬프트 최적화
3. 성능 튜닝
4. 사용자 피드백 반영

---

## 8. 기술적 고려사항

### 8.1 LLM 선택

#### Text-to-SQL
- **GPT-4**: 높은 정확도, 함수 호출 지원
- **Claude 3**: 긴 컨텍스트, 분석 능력
- **Code Llama**: SQL 특화, 오픈소스

#### 콘텐츠 생성
- **GPT-4 Turbo**: 빠른 응답, 창의성
- **Claude 3**: 브랜드 톤 유지, 안전성

### 8.2 RAG (Retrieval-Augmented Generation)

#### 필요성
- 도메인 특화 지식 제공
- 최신 데이터 반영
- 컨텍스트 확장

#### 구현
- 벡터 데이터베이스에 문서 임베딩
- 유사도 검색으로 관련 문서 추출
- LLM 컨텍스트에 포함

### 8.3 프롬프트 엔지니어링

#### 전략
- Few-shot learning
- Chain-of-thought
- 역할 기반 프롬프트
- 동적 프롬프트 구성

### 8.4 에러 처리

#### 검증 단계
1. SQL 구문 검사
2. 실행 계획 확인
3. 결과 크기 제한
4. 위험 쿼리 차단

#### 복구 전략
- 자동 재시도
- 대안 제안
- 사용자 확인 요청


