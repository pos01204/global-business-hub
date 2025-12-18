# 📚 Global Business Hub 통합 데이터 Context 및 규칙 문서

> **문서 버전**: 2.0  
> **작성일**: 2024-12-17  
> **최종 수정일**: 2024-12-17  
> **목적**: 프로젝트 전체에서 일관된 데이터 정의, 가공, 분석 규칙을 수립하고, 모든 페이지에서 준수해야 할 공통 규칙을 정의

---

## 📋 목차

1. [통합 데이터 Context 및 페이지별 진단 정의](#1-통합-데이터-context-및-페이지별-진단-정의)
2. [데이터 활용 및 분석 통합 규칙 정의](#2-데이터-활용-및-분석-통합-규칙-정의)
3. [🆕 공통 데이터 규칙 기반 (모든 페이지 필수 준수)](#3-공통-데이터-규칙-기반-모든-페이지-필수-준수)
4. [🆕 페이지별 데이터 활용 상세 진단 및 평가](#4-페이지별-데이터-활용-상세-진단-및-평가)
5. [🆕 허브 완성도 개선 로드맵](#5-허브-완성도-개선-로드맵)
6. [구현 우선순위 및 로드맵](#6-구현-우선순위-및-로드맵)
7. [부록](#7-부록)

---

## 1. 통합 데이터 Context 및 페이지별 진단 정의

### 1.1 페이지별 데이터 활용 진단

코드 분석을 통해 프로젝트 내의 **7개 핵심 페이지/대시보드**를 식별하였으며, 각 페이지의 데이터 활용 현황을 다음과 같이 진단하였습니다.

#### 📊 Dashboard (대시보드)

| 구분 | 상세 내용 |
|------|----------|
| **페이지/모듈 명** | `frontend/app/dashboard/page.tsx` |
| **활용하는 핵심 Raw Data 필드** | `order.Total GMV`, `order.order_code`, `logistics.logistics`, `users.ID`, `artists.(KR)작가명` |
| **페이지 내 가공 로직** | - GMV 합산 및 전기간 대비 변화율 계산<br/>- 주문 건수 집계<br/>- AOV (Average Order Value) = GMV / 주문건수<br/>- 7일 이동평균 (Moving Average) 트렌드 계산<br/>- 물류 파이프라인 단계별 집계 |
| **진단 결과** | ⚠️ `formatCurrency`, `formatChange` 함수가 페이지 내 로컬 정의됨. **공통 유틸리티 통합 필요** |

#### 📈 Analytics (성과 분석)

| 구분 | 상세 내용 |
|------|----------|
| **페이지/모듈 명** | `frontend/app/analytics/page.tsx` |
| **활용하는 핵심 Raw Data 필드** | `order.Total GMV`, `order.order_created`, `order.platform`, `order.PG사`, `order.method`, `logistics.country`, `users.CREATED_AT`, `users.COUNTRY` |
| **페이지 내 가공 로직** | - 기간별 매출 KPI (totalSales, aov, orderCount)<br/>- 고객 활동 상태 분류 (Active: 90일내, Inactive: 91~180일, Churn Risk: 181일+)<br/>- RFM 분석 (Recency, Frequency, Monetary)<br/>- 채널별 성과 분석 (platform, PG사별 집계)<br/>- 지역별 성과 분석 |
| **진단 결과** | ⚠️ 활동 상태 기준일(90일, 180일)이 하드코딩됨. **설정 가능한 상수로 통합 필요** |

#### 🏗️ Control Tower (물류 관제 센터)

| 구분 | 상세 내용 |
|------|----------|
| **페이지/모듈 명** | `frontend/app/control-tower/page.tsx` |
| **활용하는 핵심 Raw Data 필드** | `logistics.order_code`, `logistics.logistics`, `logistics.order_created`, `logistics.처리상태`, `logistics.국제송장번호`, `logistics.국내송장번호` |
| **페이지 내 가공 로직** | - 물류 상태별 파이프라인 분류 (미입고→작가발송→검수대기→검수완료→국제배송)<br/>- 위험 주문 판별 (단계별 기준일 초과 여부)<br/>- 합포장 일부입고 분석<br/>- 처리 지연일 계산 |
| **진단 결과** | ⚠️ 위험 기준일(7일, 5일, 2일, 3일, 14일)이 `STAGE_META`에 하드코딩됨. **설정 기반 관리 필요** |

#### 🎨 Artist Analytics (작가 분석)

| 구분 | 상세 내용 |
|------|----------|
| **페이지/모듈 명** | `frontend/app/artist-analytics/page.tsx` |
| **활용하는 핵심 Raw Data 필드** | `artists.(KR)작가명`, `artists.작가 등록일 (Global)`, `artists.삭제일`, `logistics.artist_name (kr)`, `logistics.Total GMV`, `logistics.product_id` |
| **페이지 내 가공 로직** | - 작가별 GMV 집계 및 랭킹<br/>- 활성 작가 비율 계산<br/>- 매출 집중도 (파레토 분석)<br/>- 작가 건강도 점수 계산<br/>- 성장 추이 트렌드 |
| **진단 결과** | ⚠️ 작가 성과 계산 로직이 백엔드에 분산됨. **계산 로직 중앙화 필요** |

#### 🧠 Business Brain (AI 비즈니스 인사이트)

| 구분 | 상세 내용 |
|------|----------|
| **페이지/모듈 명** | `frontend/app/business-brain/page.tsx` |
| **활용하는 핵심 Raw Data 필드** | 전체 엔티티 (order, logistics, users, artists, settlement_records) 통합 활용 |
| **페이지 내 가공 로직** | - 비즈니스 건강도 점수 (4개 차원: 매출, 고객, 작가, 운영)<br/>- RFM 세그먼트 분석<br/>- 코호트 분석<br/>- 파레토 분석<br/>- 이상 탐지 (Anomaly Detection)<br/>- 시계열 분해 분석<br/>- What-if 시뮬레이션 |
| **진단 결과** | ✅ 가장 포괄적인 분석 로직 보유. 단, USD→KRW 변환이 프론트엔드에서 수행됨 (`USD_TO_KRW = 1350`) |

#### 💰 Cost Analysis (비용 분석)

| 구분 | 상세 내용 |
|------|----------|
| **페이지/모듈 명** | `frontend/app/cost-analysis/page.tsx` |
| **활용하는 핵심 Raw Data 필드** | `logistics.country`, `logistics.Total GMV`, `settlement_records.carrier`, `settlement_records.weight`, `settlement_records.actual_cost`, 요금표 (rate_lotte, rate_ems, rate_kpacket) |
| **페이지 내 가공 로직** | - 손익 시뮬레이션 (주문별 비용 계산)<br/>- 운송사별 요금 비교<br/>- 국가별 비용 분석<br/>- 배송 정책 영향 분석 |
| **진단 결과** | ⚠️ 환율 적용 로직이 페이지별로 상이. **중앙 환율 관리 필요** |

#### 📋 Settlement (물류비 정산)

| 구분 | 상세 내용 |
|------|----------|
| **페이지/모듈 명** | `frontend/app/settlement/page.tsx` |
| **활용하는 핵심 Raw Data 필드** | `settlement_records.period`, `settlement_records.shipment_id`, `settlement_records.carrier`, `settlement_records.country`, `settlement_records.charged_weight`, `settlement_records.total_cost` |
| **페이지 내 가공 로직** | - 정산서 업로드 및 파싱<br/>- 국가별/운송사별 비용 집계<br/>- 중량 최적화 분석 (부피중량 vs 실중량)<br/>- 표준 요금표 대비 검증<br/>- 교차 검증 (운송사 비용 비교) |
| **진단 결과** | ⚠️ `formatCurrency` 함수가 Dashboard와 중복 정의. 또한 null/undefined 처리 로직이 개별적으로 구현됨 |

---

### 1.2 핵심 데이터 엔티티 Context 및 관계 정의

페이지 진단 결과를 바탕으로 프로젝트 전체를 아우르는 **5가지 핵심 데이터 엔티티**를 도출하였습니다.

#### 📐 엔티티 관계 다이어그램 (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Global Business Hub ERD                             │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐         ┌─────────────────┐
    │     USERS       │         │    ARTISTS      │
    │─────────────────│         │─────────────────│
    │ • ID (PK)       │         │ • artist_id     │
    │ • NAME          │         │ • (KR)작가명    │
    │ • EMAIL         │         │ • email         │
    │ • COUNTRY       │         │ • 등록일        │
    │ • CREATED_AT    │         │ • Live 작품수   │
    └────────┬────────┘         └────────┬────────┘
             │                           │
             │ 1:N                       │ 1:N
             │                           │
    ┌────────▼────────────────────────────▼────────┐
    │                    ORDERS                      │
    │───────────────────────────────────────────────│
    │ • order_code (PK)                             │
    │ • order_created                               │
    │ • user_id (FK → USERS)                        │
    │ • Total GMV                                   │
    │ • platform                                    │
    │ • PG사, method                                │
    └────────────────────┬──────────────────────────┘
                         │
                         │ 1:N (하나의 주문에 여러 상품)
                         │
    ┌────────────────────▼──────────────────────────┐
    │                  LOGISTICS                      │
    │───────────────────────────────────────────────│
    │ • shipment_id (PK)                            │
    │ • order_code (FK → ORDERS)                    │
    │ • product_id, product_name                    │
    │ • artist_name (kr) (FK → ARTISTS)             │
    │ • country                                     │
    │ • logistics (배송상태)                         │
    │ • 처리상태                                     │
    │ • Total GMV                                   │
    └────────────────────┬──────────────────────────┘
                         │
                         │ 1:1
                         │
    ┌────────────────────▼──────────────────────────┐
    │              SETTLEMENT_RECORDS                 │
    │───────────────────────────────────────────────│
    │ • period                                      │
    │ • shipment_id (FK → LOGISTICS)                │
    │ • carrier                                     │
    │ • country                                     │
    │ • weight, actual_cost                         │
    │ • expected_cost, difference                   │
    └───────────────────────────────────────────────┘
```

#### 엔티티별 핵심 속성 정의

| 엔티티 | 핵심 속성 | 데이터 타입 | 설명 |
|--------|----------|------------|------|
| **USERS** | ID | number | 사용자 고유 식별자 (PK) |
| | NAME | string | 사용자 이름 |
| | COUNTRY | string | 국가 코드 (JP, US, TW, HK 등) |
| | CREATED_AT | date | 가입 일시 |
| **ORDERS** | order_code | string | 주문 고유 식별자 (PK) |
| | order_created | date | 주문 생성 일시 |
| | Total GMV | number | 총 거래액 (USD) |
| | platform | string | 주문 플랫폼 (iOS, Android, Web) |
| **LOGISTICS** | shipment_id | string | 배송 고유 식별자 (PK) |
| | logistics | string | 물류 상태 |
| | country | string | 배송 국가 코드 |
| | artist_name (kr) | string | 작가명 (한글) |
| **ARTISTS** | artist_id | string | 작가 고유 식별자 |
| | (KR)작가명 | string | 작가명 (한글) |
| | (Global)Live 작품수 | number | 글로벌 라이브 작품 수 |
| **SETTLEMENT** | period | string | 정산 기간 (YYYY-MM) |
| | carrier | string | 운송사 |
| | actual_cost | number | 실제 비용 (KRW) |

#### 엔티티 간 관계성

| 관계 | 설명 | 카디널리티 |
|------|------|-----------|
| USERS → ORDERS | 사용자가 주문을 생성 | 1:N |
| ORDERS → LOGISTICS | 하나의 주문에 여러 상품(배송) 포함 | 1:N |
| ARTISTS → LOGISTICS | 작가가 여러 상품을 판매 | 1:N |
| LOGISTICS → SETTLEMENT | 배송 건에 대한 정산 기록 | 1:1 |

---

## 2. 데이터 활용 및 분석 통합 규칙 정의

### 2.1 통합 데이터 처리 로직 규칙 (일관성 확보)

페이지별 진단 결과에서 드러난 **중복되거나 일관성이 필요한 계산 로직**을 통합하기 위한 규칙입니다.

#### 규칙 1: 공통 포맷팅 함수 표준화

**문제점**: `formatCurrency`, `formatChange` 함수가 `dashboard`, `analytics`, `settlement` 등 여러 페이지에서 중복 정의됨

**통합 규칙**:

```typescript
// lib/formatters.ts 에 통합 정의

/**
 * 통화 포맷팅 함수 (KRW)
 * @param value - 원화 금액 (number | string | null | undefined)
 * @param defaultValue - null/undefined 시 기본값 (default: '₩0')
 */
export const formatCurrency = (
  value: number | string | null | undefined,
  defaultValue: string = '₩0'
): string => {
  if (value === null || value === undefined) return defaultValue
  const numValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[,\s]/g, '')) 
    : value
  if (isNaN(numValue) || !isFinite(numValue)) return defaultValue
  return `₩${Math.round(numValue).toLocaleString()}`
}

/**
 * 변화율 포맷팅 함수
 * @param change - 변화율 (소수점 비율, 예: 0.15 = 15%)
 */
export const formatChange = (change: number): string => {
  if (change === Infinity) return 'New'
  if (isNaN(change) || !isFinite(change)) return '-'
  const sign = change >= 0 ? '+' : ''
  return `${sign}${(change * 100).toFixed(1)}%`
}

/**
 * USD → KRW 변환 (환율 중앙 관리)
 */
export const USD_TO_KRW = 1350 // 환경 변수로 외부화 권장
export const toKRW = (usdAmount: number): number => Math.round(usdAmount * USD_TO_KRW)
export const formatKRW = (usdAmount: number): string => formatCurrency(toKRW(usdAmount))
```

#### 규칙 2: 고객 활동 상태 분류 기준 통일

**문제점**: 활동 상태 기준일(90일, 180일)이 Analytics 페이지에 하드코딩됨

**통합 규칙**:

```typescript
// config/businessRules.ts

export const CUSTOMER_ACTIVITY_RULES = {
  ACTIVE_THRESHOLD_DAYS: 90,      // 활성 고객: 최근 90일 내 구매
  INACTIVE_THRESHOLD_DAYS: 180,   // 비활성 고객: 91~180일 내 구매
  CHURN_RISK_THRESHOLD_DAYS: 181, // 이탈 위험: 181일 이상 미구매
} as const

export type CustomerActivityStatus = 'Active' | 'Inactive' | 'Churn Risk'

export const getCustomerActivityStatus = (
  daysSinceLastPurchase: number
): CustomerActivityStatus => {
  if (daysSinceLastPurchase <= CUSTOMER_ACTIVITY_RULES.ACTIVE_THRESHOLD_DAYS) {
    return 'Active'
  }
  if (daysSinceLastPurchase <= CUSTOMER_ACTIVITY_RULES.INACTIVE_THRESHOLD_DAYS) {
    return 'Inactive'
  }
  return 'Churn Risk'
}
```

#### 규칙 3: 물류 위험 기준일 설정 표준화

**문제점**: Control Tower의 `STAGE_META`에 단계별 기준일이 하드코딩됨

**통합 규칙**:

```typescript
// config/logisticsRules.ts

export const LOGISTICS_CRITICAL_DAYS = {
  unreceived: 7,           // 미입고: 결제 후 7일
  artistShipping: 5,       // 작가 발송: 결제 후 5일
  awaitingInspection: 2,   // 검수 대기: 결제 후 2일
  inspectionComplete: 3,   // 검수 완료: 결제 후 3일
  internationalShipping: 14, // 국제 배송: 결제 후 14일
} as const

export const getLogisticsCriticalThreshold = (
  stage: keyof typeof LOGISTICS_CRITICAL_DAYS
): number => LOGISTICS_CRITICAL_DAYS[stage]

export const isLogisticsCritical = (
  stage: keyof typeof LOGISTICS_CRITICAL_DAYS,
  daysSincePayment: number
): boolean => daysSincePayment > LOGISTICS_CRITICAL_DAYS[stage]
```

#### 규칙 4: Null/Zero 값 처리 기준 통일

**문제점**: 각 페이지에서 null/undefined/NaN 처리가 개별적으로 구현됨

**통합 규칙**:

```typescript
// lib/safeUtils.ts

/**
 * 안전한 숫자 변환
 */
export const safeNumber = (value: unknown, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  return isNaN(num) || !isFinite(num) ? defaultValue : num
}

/**
 * 안전한 배열 합계
 */
export const safeSum = (arr: (number | null | undefined)[]): number => 
  arr.reduce((acc, val) => acc + safeNumber(val), 0)

/**
 * 안전한 평균 계산 (0 나누기 방지)
 */
export const safeAverage = (
  arr: (number | null | undefined)[], 
  defaultValue: number = 0
): number => {
  const validValues = arr.filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
  if (validValues.length === 0) return defaultValue
  return safeSum(validValues) / validValues.length
}

/**
 * 안전한 변화율 계산
 */
export const safeChangeRate = (
  current: number | null | undefined,
  previous: number | null | undefined
): number => {
  const curr = safeNumber(current)
  const prev = safeNumber(previous)
  if (prev === 0) return curr > 0 ? Infinity : 0
  return (curr - prev) / prev
}
```

---

### 2.2 분석 성능 최적화 규칙 (시간 감축 목적)

1차 진단에서 발견된 성능 저하 요인에 초점을 맞춘 최적화 규칙입니다.

#### 규칙 1: 데이터 캐싱 전략 통일

**문제점**: 페이지별로 상이한 `staleTime` 설정 (2분 ~ 5분)

**통합 규칙**:

```typescript
// config/cacheStrategy.ts

export const CACHE_STRATEGY = {
  // 실시간성이 중요한 데이터 (짧은 캐시)
  REALTIME: {
    staleTime: 1 * 60 * 1000,  // 1분
    cacheTime: 5 * 60 * 1000,  // 5분
    endpoints: ['control-tower', 'dashboard-tasks', 'unreceived']
  },
  
  // 분석 데이터 (중간 캐시)
  ANALYTICS: {
    staleTime: 5 * 60 * 1000,  // 5분
    cacheTime: 30 * 60 * 1000, // 30분
    endpoints: ['analytics', 'artist-analytics', 'business-brain']
  },
  
  // 정적 참조 데이터 (긴 캐시)
  REFERENCE: {
    staleTime: 60 * 60 * 1000,  // 1시간
    cacheTime: 24 * 60 * 60 * 1000, // 24시간
    endpoints: ['rates', 'countries', 'carriers']
  }
} as const
```

#### 규칙 2: 집계 데이터 사전 계산 (Pre-aggregation)

**문제점**: Business Brain, Analytics에서 복잡한 집계 쿼리가 실시간으로 수행됨

**통합 규칙**:

```typescript
// 백엔드 서비스 레이어에서 일일 배치로 사전 집계

interface DailyAggregation {
  date: string           // YYYY-MM-DD
  totalGMV: number       // 일일 GMV
  orderCount: number     // 일일 주문 수
  newUsers: number       // 일일 신규 가입
  activeArtists: number  // 일일 활성 작가
  avgAOV: number         // 일일 평균 AOV
}

// 사전 집계 테이블 활용
// - daily_aggregations: 일별 집계
// - weekly_aggregations: 주별 집계  
// - monthly_aggregations: 월별 집계
// - artist_monthly_stats: 작가별 월별 통계
```

#### 규칙 3: 데이터 로딩 분할 (Lazy Loading / Pagination)

**문제점**: Settlement 페이지에서 전체 정산 목록을 한 번에 로딩

**통합 규칙**:

```typescript
// 페이지네이션 기본 설정
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  INITIAL_LOAD_SIZE: 20, // 초기 로딩 시 더 적은 데이터
}

// API 응답 형식 표준화
interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
```

#### 규칙 4: 쿼리 최적화 및 인덱싱 전략

**권장 인덱스**:

```
// Google Sheets 대체 또는 보조 DB 사용 시 적용
- orders: (order_created DESC), (user_id), (order_code)
- logistics: (order_code), (logistics), (country), (artist_name)
- settlement_records: (period), (carrier), (country)
- users: (CREATED_AT DESC), (COUNTRY)
```

---

### 2.3 학습 및 발전 모델 기반 규칙 (미래 확장성)

추후 가공 데이터 아카이빙을 통한 자체 학습 모델 구축 기반 마련을 위한 규칙입니다.

#### 규칙 1: 데이터 버전 관리 (Versioning)

```typescript
// types/dataVersioning.ts

interface VersionedDataset {
  // 메타 정보
  version: string           // Semantic Versioning (예: "1.2.3")
  createdAt: Date           // 생성 일시
  createdBy: string         // 생성자 (시스템/사용자)
  
  // 버전 정보
  schema: {
    version: string         // 스키마 버전
    changes: string[]       // 변경 사항 목록
  }
  
  // 데이터 범위
  dataRange: {
    startDate: string       // 데이터 시작일
    endDate: string         // 데이터 종료일
    recordCount: number     // 레코드 수
  }
  
  // 데이터 품질 지표
  quality: {
    completeness: number    // 완전성 (0~1)
    accuracy: number        // 정확성 (0~1)
    consistency: number     // 일관성 (0~1)
  }
  
  // 처리 이력
  processingHistory: Array<{
    step: string
    timestamp: Date
    parameters: Record<string, unknown>
  }>
}

// 버전 네이밍 규칙
// {MAJOR}.{MINOR}.{PATCH}-{환경}
// 예: 1.2.3-production, 1.2.4-staging
```

#### 규칙 2: 메타데이터 (Metadata) 관리

```typescript
// types/metadata.ts

interface DatasetMetadata {
  // 식별 정보
  id: string                // 고유 ID (UUID)
  name: string              // 데이터셋 이름
  description: string       // 설명
  
  // 원본 정보
  source: {
    type: 'google_sheets' | 'api' | 'csv' | 'database'
    identifier: string      // 시트 ID, API 엔드포인트 등
    lastSyncAt: Date        // 마지막 동기화 일시
  }
  
  // 스키마 정보
  schema: {
    columns: Array<{
      name: string
      type: string
      nullable: boolean
      description: string
    }>
    primaryKey: string[]
    foreignKeys: Array<{
      columns: string[]
      references: {
        dataset: string
        columns: string[]
      }
    }>
  }
  
  // 통계 정보
  statistics: {
    rowCount: number
    columnCount: number
    sizeBytes: number
    lastUpdated: Date
    updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly'
  }
  
  // 사용 정보
  usage: {
    consumers: string[]     // 사용하는 페이지/서비스 목록
    accessCount: number     // 접근 횟수
    lastAccessedAt: Date    // 마지막 접근 일시
  }
  
  // 학습 관련
  mlReady: boolean          // ML 학습 데이터로 사용 가능 여부
  mlConfig?: {
    features: string[]      // 피처로 사용할 컬럼
    target?: string         // 타겟 변수
    trainTestSplit: number  // 학습/테스트 분할 비율
  }
}
```

#### 규칙 3: 데이터 아카이빙 및 스냅샷 정책

```typescript
// config/archivingPolicy.ts

export const ARCHIVING_POLICY = {
  // 스냅샷 생성 주기
  snapshot: {
    daily: {
      enabled: true,
      retentionDays: 30,  // 30일 보관
      datasets: ['orders', 'logistics', 'users']
    },
    weekly: {
      enabled: true,
      retentionDays: 90,  // 90일 보관
      datasets: ['analytics_aggregations', 'artist_stats']
    },
    monthly: {
      enabled: true,
      retentionDays: 365, // 1년 보관
      datasets: ['settlement_records', 'full_backup']
    }
  },
  
  // 학습 데이터 아카이브
  mlArchive: {
    format: 'parquet',    // 저장 형식
    compression: 'snappy', // 압축 방식
    partitionBy: ['year', 'month'], // 파티션 기준
    includeMetadata: true
  }
}
```

---

## 3. 공통 데이터 규칙 기반 (모든 페이지 필수 준수) 🆕

> **⚠️ 중요**: 이 섹션의 규칙은 모든 페이지와 컴포넌트에서 **반드시 준수**해야 합니다.
> 새로운 페이지 개발 시 이 규칙들을 먼저 확인하고 적용하세요.

### 3.1 환율 변환 규칙 (USD ↔ KRW)

#### 📌 기본 환율 설정

| 항목 | 값 | 비고 |
|------|-----|------|
| **기준 환율** | **1 USD = 1,350 KRW** | 2024년 12월 기준 |
| **적용 시점** | 데이터 표시 시점 | 실시간 환율 X |
| **반올림 규칙** | 원화 기준 정수 반올림 | `Math.round()` |

#### 📌 환율 적용 원칙

```typescript
// config/constants.ts - 모든 페이지에서 import하여 사용
export const CURRENCY = {
  USD_TO_KRW: 1350,  // 고정 환율 (환경 변수로 관리 권장)
  CURRENCY_SYMBOL_KRW: '₩',
  CURRENCY_SYMBOL_USD: '$',
  DECIMAL_PLACES_KRW: 0,  // 원화는 소수점 없음
  DECIMAL_PLACES_USD: 2,  // 달러는 소수점 2자리
} as const

// lib/formatters.ts - 환율 변환 함수
export const toKRW = (usdAmount: number | null | undefined): number => {
  if (usdAmount === null || usdAmount === undefined || isNaN(usdAmount)) return 0
  return Math.round(usdAmount * CURRENCY.USD_TO_KRW)
}

export const toUSD = (krwAmount: number | null | undefined): number => {
  if (krwAmount === null || krwAmount === undefined || isNaN(krwAmount)) return 0
  return Math.round((krwAmount / CURRENCY.USD_TO_KRW) * 100) / 100
}
```

#### 📌 페이지별 환율 적용 현황 및 통일 필요성

| 페이지 | 현재 상태 | 환율 적용 위치 | 통일 필요 |
|--------|----------|---------------|----------|
| **Dashboard** | ✅ KRW 표시 | 백엔드 변환 | - |
| **Analytics** | ✅ KRW 표시 | 백엔드 변환 | - |
| **Business Brain** | ⚠️ 프론트엔드 변환 | `USD_TO_KRW = 1350` 하드코딩 | **YES** |
| **Cost Analysis** | ✅ KRW 기준 | 백엔드 계산 | - |
| **Settlement** | ✅ KRW 기준 | Raw Data가 KRW | - |
| **Sopo Receipt** | ✅ KRW 기준 | `작품 판매 금액(KRW)` 사용 | - |

---

### 3.2 통화 포맷팅 규칙

#### 📌 필수 포맷팅 함수

```typescript
// lib/formatters.ts - 모든 페이지에서 공통 사용

/**
 * 원화 포맷팅 (KRW)
 * @param value - 금액 (number | string | null | undefined)
 * @param defaultValue - 기본값 (default: '₩0')
 * @returns 포맷팅된 문자열 (예: '₩1,234,567')
 */
export const formatCurrency = (
  value: number | string | null | undefined,
  defaultValue: string = '₩0'
): string => {
  // null, undefined 체크
  if (value === null || value === undefined) return defaultValue
  
  // 문자열 → 숫자 변환 (쉼표, 공백 제거)
  const numValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[,\s₩]/g, '')) 
    : value
  
  // NaN, Infinity 체크
  if (isNaN(numValue) || !isFinite(numValue)) return defaultValue
  
  return `₩${Math.round(numValue).toLocaleString('ko-KR')}`
}

/**
 * 달러 포맷팅 (USD)
 * @param value - 금액
 * @returns 포맷팅된 문자열 (예: '$123.45')
 */
export const formatUSD = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '$0.00'
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * USD → KRW 변환 후 포맷팅
 * @param usdValue - USD 금액
 * @returns 원화 포맷팅된 문자열
 */
export const formatKRW = (usdValue: number | null | undefined): string => {
  return formatCurrency(toKRW(usdValue))
}
```

#### 📌 현재 중복 정의된 함수 목록 (통합 필요)

| 함수명 | 중복 페이지 | 코드 차이 | 우선순위 |
|--------|------------|----------|---------|
| `formatCurrency` | Dashboard, Analytics, Settlement | 동일 로직 | **P0** |
| `formatChange` | Dashboard, Analytics | 동일 로직 | **P0** |
| `formatDays` | Analytics (LogisticsPerformanceTab) | 고유 로직 | P1 |
| `formatDateRange` | Analytics (ComparisonTab) | 고유 로직 | P1 |

---

### 3.3 변화율 계산 및 표시 규칙

#### 📌 변화율 계산 공식

```typescript
// lib/formatters.ts

/**
 * 변화율 계산
 * @param current - 현재 값
 * @param previous - 이전 값
 * @returns 변화율 (소수점 비율, 예: 0.15 = 15%)
 */
export const calculateChangeRate = (
  current: number | null | undefined,
  previous: number | null | undefined
): number => {
  const curr = safeNumber(current)
  const prev = safeNumber(previous)
  
  if (prev === 0) return curr > 0 ? Infinity : 0
  return (curr - prev) / prev
}

/**
 * 변화율 포맷팅
 * @param change - 변화율 (소수점 비율)
 * @returns 포맷팅된 문자열 (예: '+15.0%', '-3.2%', 'New')
 */
export const formatChange = (change: number): string => {
  if (change === Infinity) return 'New'
  if (isNaN(change) || !isFinite(change)) return '-'
  const sign = change >= 0 ? '+' : ''
  return `${sign}${(change * 100).toFixed(1)}%`
}
```

#### 📌 변화율 표시 색상 규칙

| 변화율 | 색상 | CSS 클래스 (Light/Dark) |
|--------|------|------------------------|
| 양수 (+) | 🟢 초록 | `text-green-600` / `text-green-400` |
| 음수 (-) | 🔴 빨강 | `text-red-600` / `text-red-400` |
| 0 또는 N/A | ⚫ 회색 | `text-gray-500` / `text-gray-400` |
| New (이전 데이터 없음) | 🔵 파랑 | `text-blue-600` / `text-blue-400` |

---

### 3.4 Null/Undefined/NaN 처리 규칙

#### 📌 안전 유틸리티 함수

```typescript
// lib/safeUtils.ts - 모든 데이터 처리 시 사용

/**
 * 안전한 숫자 변환
 */
export const safeNumber = (value: unknown, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  return isNaN(num) || !isFinite(num) ? defaultValue : num
}

/**
 * 안전한 문자열 변환
 */
export const safeString = (value: unknown, defaultValue: string = ''): string => {
  if (value === null || value === undefined) return defaultValue
  return String(value)
}

/**
 * 안전한 배열 합계
 */
export const safeSum = (arr: (number | null | undefined)[]): number => 
  arr.reduce((acc, val) => acc + safeNumber(val), 0)

/**
 * 안전한 평균 계산
 */
export const safeAverage = (arr: (number | null | undefined)[]): number => {
  const validValues = arr.filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
  if (validValues.length === 0) return 0
  return safeSum(validValues) / validValues.length
}

/**
 * 0 나누기 방지 함수
 */
export const safeDivide = (
  numerator: number | null | undefined,
  denominator: number | null | undefined,
  defaultValue: number = 0
): number => {
  const num = safeNumber(numerator)
  const den = safeNumber(denominator)
  if (den === 0) return defaultValue
  return num / den
}
```

---

### 3.5 날짜/시간 처리 규칙

#### 📌 날짜 포맷 표준

| 용도 | 포맷 | 예시 |
|------|------|------|
| **API 통신** | `YYYY-MM-DD` | `2024-12-17` |
| **시간 포함** | `YYYY-MM-DD HH:mm:ss` | `2024-12-17 14:30:00` |
| **UI 표시 (한국어)** | `YYYY년 MM월 DD일` | `2024년 12월 17일` |
| **UI 표시 (간략)** | `MM/DD` | `12/17` |
| **기간 표시** | `YYYY-MM` | `2024-12` |
| **ISO 8601** | `YYYY-MM-DDTHH:mm:ss.sssZ` | `2024-12-17T05:30:00.000Z` |

#### 📌 타임존 처리 규칙

```typescript
// config/constants.ts

export const TIMEZONE = {
  DEFAULT: 'Asia/Seoul',  // 기본 타임존 (KST)
  UTC_OFFSET: 9,          // UTC+9
} as const

// 날짜 비교 시 항상 KST 기준으로 변환하여 비교
```

---

### 3.6 상태값 매핑 규칙

#### 📌 물류 상태 (Order-Shipment Status) 매핑

> 상세 매핑은 [부록 B.0](#b0-order-shipment-status-규칙-상태값-매핑-참조) 참조

| 도메인 | 주요 상태값 | UI 표시 (한글) | 색상 |
|--------|------------|---------------|------|
| **Order** | `COMPLETED` | 주문 완료 | 🟢 Green |
| **Order** | `CANCELLED` | 취소 | 🔴 Red |
| **Shipment Item** | `DELIVERED` | 배송완료 | 🟢 Green |
| **Shipment Item** | `INSPECTION_COMPLETE` | 검수완료 | 🔵 Blue |
| **Desire** | `INSPECTION_FAIL` | 작품 반송 | 🔴 Red |
| **Global** | `DELIVERY_COMPLETE` | 배송완료 | 🟢 Green |

#### 📌 고객 활동 상태 분류 기준

```typescript
// config/businessRules.ts

export const CUSTOMER_ACTIVITY_THRESHOLDS = {
  ACTIVE_DAYS: 90,        // 활성: 최근 90일 내 구매
  INACTIVE_DAYS: 180,     // 비활성: 91~180일 내 구매
  CHURN_RISK_DAYS: 181,   // 이탈 위험: 181일+ 미구매
} as const

export type CustomerActivityStatus = 'Active' | 'Inactive' | 'Churn Risk'
```

#### 📌 물류 위험 기준일

```typescript
// config/businessRules.ts

export const LOGISTICS_CRITICAL_DAYS = {
  unreceived: 7,           // 미입고: 결제 후 7일
  artistShipping: 5,       // 국내배송: 결제 후 5일
  awaitingInspection: 2,   // 검수대기: 결제 후 2일
  inspectionComplete: 3,   // 포장대기: 결제 후 3일
  internationalShipping: 14, // 국제배송: 결제 후 14일
} as const
```

---

### 3.7 데이터 캐싱 규칙

#### 📌 React Query `staleTime` 표준

| 데이터 유형 | staleTime | cacheTime | 적용 API |
|------------|-----------|-----------|----------|
| **실시간** | 1분 | 5분 | control-tower, dashboard-tasks |
| **분석** | 5분 | 30분 | analytics, artist-analytics, business-brain |
| **참조** | 1시간 | 24시간 | rates, countries, carriers |
| **정적** | 24시간 | 7일 | schema, constants |

```typescript
// config/cacheStrategy.ts

export const CACHE_STRATEGY = {
  REALTIME: { staleTime: 1 * 60 * 1000, cacheTime: 5 * 60 * 1000 },
  ANALYTICS: { staleTime: 5 * 60 * 1000, cacheTime: 30 * 60 * 1000 },
  REFERENCE: { staleTime: 60 * 60 * 1000, cacheTime: 24 * 60 * 60 * 1000 },
  STATIC: { staleTime: 24 * 60 * 60 * 1000, cacheTime: 7 * 24 * 60 * 60 * 1000 },
} as const
```

---

### 3.8 페이지네이션 규칙

#### 📌 표준 설정

```typescript
// config/pagination.ts

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  INITIAL_LOAD_SIZE: 20,
  ALLOWED_PAGE_SIZES: [10, 20, 50, 100],
} as const
```

#### 📌 API 응답 형식 표준

```typescript
interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
```

---

## 4. 페이지별 데이터 활용 상세 진단 및 평가 🆕

### 4.1 페이지별 데이터 활용 현황 매트릭스

| 페이지 | Order | Logistics | Users | Artists | Settlement | Review | Rate_* | QC | 활용 점수 |
|--------|:-----:|:---------:|:-----:|:-------:|:----------:|:------:|:------:|:--:|:--------:|
| **Dashboard** | ✅ | ✅ | ❌ | ⚪ | ❌ | ❌ | ❌ | ❌ | 4/8 (50%) |
| **Analytics** | ✅ | ✅ | ✅ | ⚪ | ❌ | ❌ | ❌ | ❌ | 5/8 (63%) |
| **Control Tower** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 4/8 (50%) |
| **Artist Analytics** | ⚪ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | 4/8 (50%) |
| **Business Brain** | ✅ | ✅ | ✅ | ✅ | ⚪ | ❌ | ❌ | ❌ | 6/8 (75%) |
| **Cost Analysis** | ⚪ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 5/8 (63%) |
| **Settlement** | ❌ | ⚪ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | 4/8 (50%) |
| **Reviews** | ❌ | ❌ | ❌ | ⚪ | ❌ | ✅ | ❌ | ❌ | 2/8 (25%) |
| **QC** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | 3/8 (38%) |
| **Sopo Receipt** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | 4/8 (50%) |

> ✅ 핵심 활용 | ⚪ 부분 활용 | ❌ 미활용

---

### 4.2 페이지별 상세 진단

#### 📊 Dashboard (대시보드) - 평가: ⭐⭐⭐⭐ (4/5)

| 항목 | 상세 |
|------|------|
| **활용 데이터** | `order.Total GMV`, `order.order_code`, `order.order_created`, `logistics.logistics`, `logistics.artist_name (kr)`, `logistics.country` |
| **가공 방식** | GMV 합산, 전기간 대비 변화율 계산, 7일 이동평균 트렌드, AOV 계산, 물류 파이프라인 집계 |
| **문제점** | 1. `formatCurrency`, `formatChange` 로컬 정의 (중복)<br>2. 신규 고객 수가 하드코딩 (`orderCount * 0.18`)<br>3. 배송 완료율 하드코딩 (`92.1%`) |
| **개선 필요** | 공통 유틸리티 사용, 실제 데이터 기반 계산 |
| **활용 확대 제안** | 리뷰 평균 평점 표시, 작가 건강도 요약 표시 |

```typescript
// 현재 하드코딩된 부분 (개선 필요)
// frontend/app/dashboard/page.tsx:559-565
<EnhancedKPICard
  title="신규 고객"
  value={Math.floor(data.kpis.orderCount.value * 0.18)}  // ❌ 하드코딩
  // ...
/>
```

---

#### 📈 Analytics (성과 분석) - 평가: ⭐⭐⭐⭐ (4/5)

| 항목 | 상세 |
|------|------|
| **활용 데이터** | `order.*` (GMV, platform, PG사, method, country), `logistics.*` (country, artist_name), `users.COUNTRY`, `users.CREATED_AT` |
| **가공 방식** | 기간별 매출 KPI, 고객 활동 상태 분류 (90/180일 기준), RFM 분석, 채널별/지역별 성과 분석, 물류 처리 시간 분석 |
| **문제점** | 1. `formatCurrency`, `formatChange` 로컬 정의 (중복)<br>2. 활동 상태 기준일 하드코딩 (`90일`, `180일`)<br>3. 많은 탭으로 인한 데이터 로딩 복잡성 |
| **개선 필요** | 공통 유틸리티 사용, 비즈니스 규칙 상수화 |
| **활용 확대 제안** | 리뷰 데이터 연동 (NPS 지표), 작가별 품질 점수 |

---

#### 🏗️ Control Tower (물류 관제) - 평가: ⭐⭐⭐⭐⭐ (5/5)

| 항목 | 상세 |
|------|------|
| **활용 데이터** | `logistics.*` (order_code, logistics, 상태 컬럼들, 국제송장번호, 작가 발송 상태), `order.order_created` |
| **가공 방식** | 5단계 파이프라인 분류, 위험 주문 판별 (기준일 초과), 합포장 일부입고 분석, 지연일 계산 |
| **문제점** | 1. `STAGE_META`에 기준일 하드코딩 (`7, 5, 2, 3, 14일`)<br>2. Order-shipment status 규칙과 코드 간 동기화 필요 |
| **개선 필요** | 비즈니스 규칙 상수화 |
| **평가** | ✅ 물류 데이터 활용 최적화됨. 데이터 활용도 **최고 수준** |

---

#### 🎨 Artist Analytics (작가 분석) - 평가: ⭐⭐⭐⭐ (4/5)

| 항목 | 상세 |
|------|------|
| **활용 데이터** | `artists.*` (작가명, 등록일, 삭제일, Live 작품수), `logistics.*` (artist_name (kr), Total GMV, product_id) |
| **가공 방식** | 작가별 GMV 집계, 활성 작가 비율, 매출 집중도 (파레토), 작가 건강도 점수, 성장 추이 |
| **문제점** | 계산 로직이 백엔드에 분산되어 있음 |
| **개선 필요** | 작가 성과 계산 로직 중앙화 |
| **활용 확대 제안** | 리뷰 데이터 연동 (작가별 평균 평점), QC 데이터 연동 (품질 이슈) |

---

#### 🧠 Business Brain (AI 인사이트) - 평가: ⭐⭐⭐⭐ (4/5)

| 항목 | 상세 |
|------|------|
| **활용 데이터** | 전체 엔티티 통합 (order, logistics, users, artists, settlement_records) |
| **가공 방식** | 비즈니스 건강도 4차원 분석, RFM 세그먼트, 코호트 분석, 파레토 분석, 이상 탐지, What-if 시뮬레이션 |
| **문제점** | 1. USD→KRW 변환이 프론트엔드에서 수행됨 (`USD_TO_KRW = 1350` 하드코딩)<br>2. 가장 복잡한 분석 로직이 분산되어 있음 |
| **개선 필요** | 환율 변환 중앙화, 분석 로직 모듈화 |
| **활용 확대 제안** | 리뷰 감성 분석 연동, 예측 모델 추가 |

---

#### ⭐ Reviews (리뷰) - 평가: ⭐⭐ (2/5) ⚠️ 개선 필요

| 항목 | 상세 |
|------|------|
| **활용 데이터** | `review.*` (rating, contents, image_url, product_name, artist_name, country, dt) |
| **가공 방식** | 단순 갤러리 표시, 국가별 필터링, 평점순/최신순 정렬, 이미지 필터 |
| **문제점** | 1. **데이터 분석 전무** - 단순 노출만 수행<br>2. NPS 지표 미산출<br>3. 평점 트렌드 미분석<br>4. 작가/상품별 평점 분석 없음<br>5. 리뷰 키워드 분석 없음 |
| **개선 필요** | **⚠️ 최우선 개선 대상** - 분석 기능 추가 필요 |
| **활용 확대 제안** | 아래 [4.3 미활용 데이터 심층 분석](#43-미활용-데이터-심층-분석-review-시트) 참조 |

---

#### 💰 Settlement (물류비 정산) - 평가: ⭐⭐⭐⭐ (4/5)

| 항목 | 상세 |
|------|------|
| **활용 데이터** | `settlement_records.*` (전체), `rate_*` (요금표) |
| **가공 방식** | 정산서 파싱, 국가별/운송사별 비용 집계, 중량 최적화 분석, 요금표 검증, 교차 검증 |
| **문제점** | `formatCurrency` 로컬 정의 (중복) |
| **개선 필요** | 공통 유틸리티 사용 |
| **평가** | ✅ Settlement 데이터 활용 최적화됨 |

---

### 4.3 미활용 데이터 심층 분석: Review 시트 ⚠️

> **현황**: 657건의 리뷰 데이터가 **단순 표시용으로만 활용**되고 있음
> **잠재 가치**: 고객 만족도 측정, 상품/작가 품질 개선, NPS 지표 산출

#### 📊 현재 활용 vs 가능한 활용

| 구분 | 현재 | 가능한 활용 |
|------|------|------------|
| **기본 표시** | ✅ 리뷰 갤러리 | - |
| **필터링** | ✅ 국가별, 이미지 여부 | - |
| **정렬** | ✅ 최신순, 평점순, 인기순 | - |
| **NPS 지표** | ❌ 없음 | Promoter(9-10) / Passive(7-8) / Detractor(1-6) 분류 |
| **평점 트렌드** | ❌ 없음 | 월별/분기별 평균 평점 추이 |
| **작가별 분석** | ❌ 없음 | 작가별 평균 평점, 리뷰 수 |
| **상품별 분석** | ❌ 없음 | 상품별 평균 평점, 품질 이슈 |
| **키워드 분석** | ❌ 없음 | 자연어 처리로 인사이트 도출 |
| **이미지 분석** | ❌ 없음 | 이미지 포함 리뷰 비율, 품질 분석 |

#### 🎯 Review 데이터 활용 확대 제안

**1. NPS (Net Promoter Score) 대시보드 추가**

```typescript
// 10점 만점 기준 NPS 계산
const calculateNPS = (reviews: Review[]) => {
  const total = reviews.length
  const promoters = reviews.filter(r => r.rating >= 9).length
  const detractors = reviews.filter(r => r.rating <= 6).length
  
  return {
    nps: Math.round(((promoters - detractors) / total) * 100),
    promoterRate: (promoters / total) * 100,
    passiveRate: ((total - promoters - detractors) / total) * 100,
    detractorRate: (detractors / total) * 100,
  }
}
```

**2. 작가별 리뷰 분석 (Artist Analytics 연동)**

| 분석 항목 | 설명 |
|----------|------|
| 평균 평점 | 작가별 평균 평점 |
| 리뷰 수 | 작가별 총 리뷰 수 |
| 이미지 리뷰율 | 이미지 포함 리뷰 비율 |
| 평점 트렌드 | 최근 평점 추이 (상승/하락) |

**3. 리뷰 키워드 분석 (일본어 NLP)**

> 리뷰 데이터의 **대부분이 일본어**이므로, 일본어 자연어 처리 필요

---

### 4.4 데이터 활용 종합 평가

| 평가 항목 | 점수 | 상세 |
|----------|:----:|------|
| **핵심 데이터 활용도** | 85% | Order, Logistics 데이터는 잘 활용됨 |
| **부가 데이터 활용도** | 40% | Review, User_locale 등 미활용 |
| **데이터 일관성** | 60% | 포맷팅 함수 중복, 환율 변환 분산 |
| **코드 재사용성** | 50% | 공통 유틸리티 부재 |
| **분석 깊이** | 70% | Business Brain이 포괄적, Reviews는 단순 |

#### 📋 우선 개선 순위

1. **🔴 P0 (즉시)**: 공통 유틸리티 함수 통합
2. **🔴 P0 (즉시)**: 환율 변환 중앙화
3. **🟠 P1 (1주)**: Review 분석 기능 추가
4. **🟠 P1 (1주)**: 비즈니스 규칙 상수화
5. **🟡 P2 (2주)**: Order 파생 컬럼 활용 (분기/월/주/요일 분석)

---

## 5. 허브 완성도 개선 로드맵 🆕

### 5.1 신규 페이지/기능 개발 제안

#### 🆕 제안 1: 리뷰 분석 대시보드

| 항목 | 상세 |
|------|------|
| **목적** | 고객 만족도 종합 분석 |
| **예상 경로** | `/review-analytics` |
| **핵심 기능** | NPS 대시보드, 평점 트렌드, 작가별/상품별 분석, 키워드 클라우드 |
| **데이터 소스** | `review` 시트 전체 컬럼 |
| **우선순위** | **P0** - 미활용 데이터 중 가장 높은 가치 |

#### 🆕 제안 2: 주문 패턴 분석 페이지

| 항목 | 상세 |
|------|------|
| **목적** | 요일/시간대별 주문 패턴 분석 |
| **예상 경로** | `/order-patterns` |
| **핵심 기능** | 요일별 주문 패턴, 시간대별 분석, 분기별 트렌드, 캠페인 효과 분석 |
| **데이터 소스** | `order` 시트 파생 컬럼 (`분기`, `월`, `주`, `요일`) |
| **우선순위** | P2 |

#### 🆕 제안 3: 쿠폰/프로모션 효과 분석 페이지

| 항목 | 상세 |
|------|------|
| **목적** | 쿠폰 사용률 및 ROI 분석 |
| **예상 경로** | `/promotion-analytics` |
| **핵심 기능** | 쿠폰 사용률, 쿠폰별 매출 기여도, 할인 금액 대비 효과 |
| **데이터 소스** | `order.아이디어스 쿠폰비 (Item)` |
| **우선순위** | P2 |

#### 🆕 제안 4: 통합 고객 360도 뷰

| 항목 | 상세 |
|------|------|
| **목적** | 개별 고객 전체 정보 통합 조회 |
| **예상 경로** | `/customer-360` |
| **핵심 기능** | 구매 이력, RFM 점수, 리뷰 이력, 선호 작가, 예상 LTV |
| **데이터 소스** | `users` + `user_locale` + `order` + `review` 통합 |
| **우선순위** | P1 |

---

### 5.2 기존 페이지 개선 제안

| 페이지 | 개선 항목 | 우선순위 |
|--------|----------|:--------:|
| **Dashboard** | 실제 신규 고객 수 표시 (하드코딩 제거) | P0 |
| **Dashboard** | 실제 배송 완료율 표시 (하드코딩 제거) | P0 |
| **Dashboard** | 리뷰 평균 평점 요약 카드 추가 | P1 |
| **Analytics** | 비즈니스 규칙 상수 사용 (90일, 180일) | P0 |
| **Reviews** | NPS 지표 표시 추가 | P0 |
| **Reviews** | 작가별/상품별 평점 분석 탭 추가 | P1 |
| **Artist Analytics** | 작가별 리뷰 평점 연동 | P1 |
| **Business Brain** | 환율 변환 중앙화 | P0 |

---

### 5.3 데이터 파이프라인 개선 제안

#### 현재 아키텍처의 한계

```
[Google Sheets] → [Backend API] → [Frontend]
                  (실시간 조회)     (매번 계산)
```

#### 제안 아키텍처

```
[Google Sheets] → [ETL Process] → [Pre-aggregated Cache/DB]
                     (주기적)           ↓
                               [Backend API] → [Frontend]
                                (캐시 조회)      (표시만)
```

| 개선 항목 | 현재 | 제안 |
|----------|------|------|
| **일일 KPI 집계** | 실시간 계산 | 일일 배치로 사전 집계 |
| **작가별 통계** | 실시간 계산 | 일일 배치로 사전 집계 |
| **RFM 점수** | 실시간 계산 | 일일 배치로 사전 계산 |
| **환율 적용** | 페이지별 상이 | 백엔드 통일 적용 |

---

### 5.4 데이터 품질 모니터링 제안

| 모니터링 항목 | 현재 | 제안 |
|--------------|------|------|
| **데이터 완전성** | 없음 | 필수 필드 채움률 모니터링 |
| **데이터 일관성** | 없음 | Order-Shipment 상태 정합성 검증 |
| **데이터 적시성** | 없음 | 마지막 업데이트 시간 표시 |
| **이상치 탐지** | Business Brain | 자동화된 알림 시스템 |

---

## 6. 구현 우선순위 및 로드맵

### Phase 0: 즉시 실행 (1주 이내) 🔴

- [ ] `lib/formatters.ts` 생성 및 공통 포맷팅 함수 통합
- [ ] `lib/safeUtils.ts` 생성 및 안전 유틸리티 함수 통합
- [ ] `config/constants.ts` 생성 및 환율, 타임존 상수 정의
- [ ] `config/businessRules.ts` 생성 및 비즈니스 규칙 상수화
- [ ] Dashboard, Analytics, Settlement의 중복 함수 제거 및 공통 모듈 사용

### Phase 1: 기초 통합 (1~2주)

- [ ] 각 페이지에서 공통 유틸리티 import 및 적용
- [ ] Business Brain 환율 변환 중앙화
- [ ] Control Tower `STAGE_META` 상수 분리
- [ ] Dashboard 하드코딩 값 실제 데이터로 대체

### Phase 2: 데이터 활용 확대 (2~3주)

- [ ] Reviews 페이지에 NPS 대시보드 추가
- [ ] Reviews 페이지에 작가별/상품별 분석 탭 추가
- [ ] Artist Analytics에 리뷰 평점 연동
- [ ] Order 파생 컬럼 (분기/월/주/요일) 활용 기능 추가

### Phase 3: 캐싱 및 성능 (3~4주)

- [ ] 캐싱 전략 통일 및 적용
- [ ] 페이지네이션 표준화
- [ ] 사전 집계 데이터 파이프라인 구축

### Phase 4: 데이터 거버넌스 (4~5주)

- [ ] 데이터 버전 관리 시스템 구축
- [ ] 메타데이터 관리 체계 수립
- [ ] 아카이빙 정책 적용
- [ ] 데이터 품질 모니터링 대시보드 구축

### Phase 5: ML 준비 (향후)

- [ ] 학습 데이터셋 파이프라인 구축
- [ ] 피처 스토어 설계
- [ ] 모델 학습 인프라 준비
- [ ] 리뷰 감성 분석 모델 개발

---

## 7. 부록

### 7.A. Google Sheets 시트 매핑

| 시트명 | 설명 | 주요 소비 페이지 | 데이터 건수 |
|--------|------|-----------------|:-----------:|
| order | 주문 정보 | Dashboard, Analytics, Business Brain | ~1,780 |
| logistics | 물류 추적 (아이템 단위) | Control Tower, Settlement, Cost Analysis | ~4,314 |
| users | 사용자 정보 | Analytics, Business Brain | ~73,837 |
| artists | 작가 정보 | Artist Analytics, Business Brain | ~3,852 |
| artists_mail | 작가 이메일 | QC, Sopo Receipt | ~4,530 |
| review | 리뷰 정보 | Reviews | ~657 |
| Settlement_records | 정산 기록 | Settlement, Cost Analysis | ~123 |
| Sopo_tracking | 소포수령증 트래킹 | Sopo Receipt | ~86 |
| Sopo_jotform | JotForm 제출 | Sopo Receipt | ~462 |
| [QC] 한글_raw | 텍스트 QC | QC | ~7,004 |
| [QC] OCR_결과_raw | 이미지 OCR | QC | ~4,858 |
| [QC] archiving | QC 아카이브 | QC | ~1,375 |
| user_locale | 사용자 지역 정보 | Analytics | ~79,163 |
| Rate_* | 요금표 | Cost Analysis, Settlement | 참조용 |

### 7.B. API 엔드포인트 목록

| 카테고리 | 엔드포인트 | 설명 | 캐시 전략 |
|---------|-----------|------|----------|
| Dashboard | `/api/dashboard/main` | 메인 대시보드 KPI | ANALYTICS |
| Dashboard | `/api/dashboard/tasks` | 오늘 할 일 | REALTIME |
| Analytics | `/api/analytics` | 성과 분석 데이터 | ANALYTICS |
| Control Tower | `/api/control-tower` | 물류 파이프라인 | REALTIME |
| Artist | `/api/artist-analytics/*` | 작가 분석 | ANALYTICS |
| Business Brain | `/api/business-brain/*` | AI 인사이트 | ANALYTICS |
| Cost | `/api/cost-analysis/*` | 비용 분석 | ANALYTICS |
| Settlement | `/api/settlement/*` | 물류비 정산 | ANALYTICS |
| Reviews | `/api/reviews/*` | 리뷰 갤러리 | ANALYTICS |
| QC | `/api/qc/*` | QC 관리 | ANALYTICS |
| Sopo | `/api/sopo-receipt/*` | 소포수령증 | ANALYTICS |

### 7.C. Raw Data Entity Column Definitions

> **목적**: 프로젝트의 모든 Raw Data 소스(Google Sheets 시트별)에 대한 **전체 컬럼 정의**를 명확히 하고, 현재 프로젝트에서의 활용 여부를 확인합니다.
> 
> **데이터 소스**: 
> - **실제 Raw Data 파일**: `[GB] 대시보드 제작` Google Sheets 내보내기 CSV
> - **코드 분석**: `backend/src/config/sheetsSchema.ts` + 백엔드 라우트 코드
> - **상태값 규칙**: Order-shipment status 규칙 문서
> 
> **시트 목록** (Google Sheets 탭 기준, 14개):
> 1. order (27개 컬럼)
> 2. review (15개 컬럼)
> 3. artists (20개 컬럼)
> 4. artists_mail (9개 컬럼)
> 5. logistics (43개 컬럼)
> 6. users (7개 컬럼)
> 7. user_locale (4개 컬럼)
> 8. [QC] 한글_raw (9개 컬럼)
> 9. [QC] OCR_결과_raw (12개 컬럼)
> 10. [QC] archiving (14개 컬럼)
> 11. Settlement_records (28개 컬럼)
> 12. Sopo_tracking (13개 컬럼)
> 13. Sopo_jotform (9개 컬럼)
> 14. 25년도 TOP 100 작품 데이터 정리 (참조용)

---

#### B.0 Order-Shipment Status 규칙 (상태값 매핑 참조)

> **참조 문서**: Order-shipment status 규칙 문서에 따른 도메인별 상태 매핑
> **실제 상태값 출처**: `logistics.csv`의 `order item status`, `shipment item status`, `작가 발송 상태`, `global bundle status` 컬럼

| 작가 상태 | 구매자 상태 | Order Status | Order-item Status | Shipment Status | Shipment Item Status | Desire Status | Global Status | Trigger |
|----------|-----------|--------------|-------------------|-----------------|---------------------|---------------|---------------|---------|
| - | - | CREATED | CREATED | - | - | - | - | 주문 생성 |
| - | - | PAYMENT_FAILED | PAYMENT_FAILED | - | - | - | - | 결제 실패 |
| 취소 | Cancelled | CANCELLED | CANCELLED | - | - | - | - | 주문 취소 |
| - | - | PAYMENT_SUCCEEDED | PAYMENT_SUCCEEDED | - | - | - | - | 결제완료 API 수신 |
| 결제완료 | Payment complete | ORDER_COMPLETED | ORDER_COMPLETED | CREATED | CREATED | CREATED | - | 주문 완료 |
| 입고 발송 | Item sent | - | ITEM_SENT | - | ARTIST_SENT | GATHERING | IN_DELIVERY | 작가앱 송장번호 입력 |
| 입고 발송 | - | - | - | - | - | IMPORTED | - | 입고완료 API |
| 작품 반송 | - | - | - | - | INSPECTION_FAIL | INSPECTION_FAIL | - | 검수 실패 |
| 검수완료 | Item sent | - | COURIER_PICK_UP | - | INSPECTION_COMPLETE | EXPORT_REQUESTED | INSPECTION_COMPLETE | 검수완료 API |
| 검수완료 | - | - | - | - | - | PACKAGING | - | 합포장 처리중 API |
| 검수완료 | Item sent | - | - | - | - | PACKAGING_COMPLETE | EXPORT_START | 합포장 완료 |
| 검수완료 | In Transit | - | IN_TRANSIT | - | - | EXPORTED | EXPORTED | 출고완료 (롯데센터) |
| - | - | - | - | PROCESSING | DELIVERING | DELIVERING | SHIPPED | 해외운송장번호 발급 |
| 배송중 | - | - | - | - | - | - | DELIVERING | 해외 선적됨 |
| 배송완료 | Delivered | COMPLETED | DELIVERED | DONE | DELIVERED | DELIVERED | DELIVERY_COMPLETE | 배송완료 |
| ? | Refunded | REFUNDED | REFUNDED | - | - | - | - | 환불 처리 |
| 배송완료 | Refunded | PARTIAL_REFUNDED | PARTIAL_REFUNDED | - | - | - | - | 부분 환불 |

---

#### B.1 Order (주문) 시트 - 27개 컬럼

> **Raw Data 출처**: `[GB] 대시보드 제작 - order.csv`
> **데이터 건수**: ~1,780건 (2023.03 ~ 현재)
> **Primary Key**: `order_code`
> **Foreign Keys**: `user_id` → `users.ID`, `shipment_id` → `logistics.shipment_id`

##### 기본 식별 필드

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A | `order_created` | date | **YES** - Dashboard, Analytics, Control Tower | 주문 생성 일시 |
| B | `order_created의 분기` | string | NO (미활용) | 파생: 주문의 분기 (1분기, 2분기...) |
| C | `order_created의 월` | string | NO (미활용) | 파생: 주문의 월 (1월, 2월...) |
| D | `주: order_created` | string | NO (미활용) | 파생: 주문의 주차 (11주, 12주...) |
| E | `order_created의 요일` | string | NO (미활용) | 파생: 주문의 요일 (월요일...) |
| F | `order_id` | number | **YES** - Order Detail | 주문 ID (내부 식별자) |
| G | `user_id` | number | **YES** - Analytics, Business Brain | 사용자 ID (FK → users.ID) |
| H | `order_code` | string | **YES** - Dashboard, Analytics, Control Tower | 주문 고유 식별자 (PK) |

##### 결제 정보 필드

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| I | `PG사` | string | **YES** - Analytics | 결제 대행사 (PAYMENTWALL, PAYPAL) |
| J | `method` | string | **YES** - Analytics | 결제 방법 (CARD) |
| K | `order_status` | string | **YES** - Analytics | 주문 상태 (COMPLETED 등) |
| L | `shipment_id` | number | **YES** - Settlement, Control Tower | 배송 ID (FK → logistics) |
| M | `shipment status` | string | **YES** - Control Tower | 배송 상태 (DONE, PROGRESSING) |
| N | `country` | string | **YES** - Dashboard, Analytics | 배송 국가 코드 (JP, US, TW, HK...) |
| O | `platform` | string | **YES** - Analytics | 주문 플랫폼 (iOS, Android) |
| P | `결제 통화` | string | NO (미활용) | 결제 통화 (USD 고정) |

##### 금액 필드

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| Q | `작품 가격` | number | NO (미활용) | 작품 단가 (USD) |
| R | `옵션 가격` | number | NO (미활용) | 옵션 추가 금액 (USD) |
| S | `Hidden Fee` | number | NO (미활용) | 숨김 수수료 (USD) |
| T | `Product GMV` | number | **YES** - Cost Analysis | 상품 GMV (USD) |
| U | `고객 부담 배송비 (Item)` | number | **YES** - Cost Analysis | 고객 부담 배송비 (USD) |
| V | `Total GMV` | number | **YES** - Dashboard, Analytics, Artist Analytics | 총 거래액 (USD) - **핵심 KPI** |
| W | `아이디어스 쿠폰비 (Item)` | number | NO (미활용) | 쿠폰 할인액 (USD) |
| X | `Pay GMV` | number | **YES** - Cost Analysis | 실 결제 금액 (USD) |
| Y | `구매수량` | number | **YES** - Dashboard, Analytics | 구매 수량 |
| Z | `작품 판매 금액(KRW)` | number | **YES** - Sopo Receipt | 작품 판매 금액 (KRW) |
| AA | `PG 수수료` | number | **YES** - Cost Analysis | PG 수수료 (USD)  |

**예시 데이터**:
- `order_code`: "P_202303071149374433360uqD"
- `order_created`: "2023/03/07"
- `Total GMV`: 97.29 (USD)
- `order_status`: "COMPLETED"
- `country`: "CZ", "US", "JP", "HK", "TW"

---

#### B.2 Logistics (물류) 시트 - 43개 컬럼 ⭐ 핵심 시트

> **Raw Data 출처**: `[GB] 대시보드 제작 - logistics.csv`
> **데이터 건수**: ~4,314건 (아이템 단위, 2023.03 ~ 현재)
> **Primary Key**: `shipment_item_id`
> **Foreign Keys**: `order_code` → `order.order_code`, `user_id` → `users.ID`, `shipment_id` → `order.shipment_id`
> **⭐ 핵심 시트**: 물류 추적의 중심 데이터로, 주문-배송-작가-상품 정보가 통합됨

##### 기본 식별 필드 (A~H)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A | `order_created` | date | **YES** - Dashboard, Control Tower, Analytics | 주문 생성 일시 |
| B | `order_id` | number | **YES** - Order Detail | 주문 ID |
| C | `user_id` | number | **YES** - Analytics, Business Brain | 사용자 ID (FK → users.ID) |
| D | `order_code` | string | **YES** - Dashboard, Control Tower, Analytics | 주문 코드 (FK) |
| E | `order_item_id` | number | **YES** - Order Detail | 주문 아이템 ID |
| F | `shipment_id` | number | **YES** - Settlement, Control Tower | 배송 ID |
| G | `shipment_item_id` | number | **YES** - Sopo Receipt, Order Detail | 배송 아이템 ID (PK) |
| H | `country` | string | **YES** - Dashboard, Analytics, Control Tower | 배송 국가 (JP, US, TW, HK, CZ 등) |

##### 상태 필드 (I~U) - Order-shipment status 규칙 참조

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| I | `logistics` | string | **YES** - Dashboard, Control Tower | 물류 상태 (배송완료 등) |
| J | `order item status` | string | **YES** - Control Tower | Order-item 상태 (DELIVERED 등) |
| K | `global bundle status` | string | **YES** - Control Tower | Global 상태 (DELIVERY_COMPLETE 등) |
| L | `artist_name` | string | **YES** - Artist Analytics | 작가명 (영문) |
| M | `artist_name (kr)` | string | **YES** - Dashboard, Analytics, Artist Analytics | 작가명 (한글) - **핵심 필드** |
| N | `작가 발송 상태` | string | **YES** - Control Tower | Desire 상태 (INSPECTION_COMPLETE 등) |
| O | `작가 발송 택배사` | string | **YES** - Slack Integration | 작가 발송 택배사 (POSTAL, LOGEN 등) |
| P | `작가 발송 송장번호` | string | **YES** - Slack Integration | 국내 송장번호 |
| Q | `artist_bundle_created` | date | **YES** - Logistics Performance | 아티스트 번들 생성일 |
| R | `작가 발송 updated` | date | **YES** - Logistics Performance | 작가 발송 업데이트 시간 |
| S | `artist bundle item status` | string | **YES** - Logistics Performance | 번들 아이템 상태 (INSPECT_SUCCESS 등) |
| T | `artist bundle item updated` | date | **YES** - Logistics Performance | 번들 아이템 업데이트 시간 |
| U | `shipment item status` | string | **YES** - Control Tower | Shipment Item 상태 (DELIVERED 등) |

##### 날짜/시간 필드 (V~AA)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| V | `shipment_item_created` | date | **YES** - Logistics Performance | 배송 아이템 생성일 |
| W | `inspection_completed_date` | date | **YES** - Logistics Performance | 검수 완료일 |
| X | `shipment_item_updated` | date | **YES** - Logistics Performance | 배송 아이템 업데이트 시간 |
| Y | `배송완료일시` | date | **YES** - Slack Integration | 배송 완료일시 |
| Z | `transaction_id` | string | **YES** - Settlement | 거래 ID (imp_xxx) |
| AA | `선적 일시` | date | **YES** - Logistics Performance | 해외 선적 일시 |

##### 송장/배송 필드 (AB~AD)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| AB | `global bundle status` | string | **YES** - Control Tower | Global 상태 (중복 컬럼) |
| AC | `국제송장번호` | string | **YES** - Control Tower, Slack | 국제 송장번호 (ECKLT, 1Z3R5Y 등) |
| AD | `택배사` | string | **YES** - Settlement | 국제 택배사 (LOTTE, UPS, RINCOS 등) |

##### 상품 정보 필드 (AE~AG)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| AE | `product_id` | number | **YES** - Analytics, Artist Analytics | 상품 ID |
| AF | `product_name` | string | **YES** - Analytics, Control Tower | 상품명 |
| AG | `배송 소요일` | number | **YES** - Logistics Performance | 배송 소요일 (일) |

##### 금액 필드 (AH~AR)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| AH | `작품 가격` | number | NO (미활용) | 작품 단가 (USD) |
| AI | `옵션 가격` | number | NO (미활용) | 옵션 추가 금액 (USD) |
| AJ | `Hidden Fee` | number | NO (미활용) | 숨김 수수료 (USD) |
| AK | `Product GMV` | number | **YES** - Cost Analysis | 상품 GMV (USD) |
| AL | `고객 부담 배송비 (Item)` | number | **YES** - Cost Analysis | 고객 배송비 (USD) |
| AM | `Total GMV` | number | **YES** - Dashboard, Analytics, Artist Analytics | 총 거래액 (USD) - **핵심 KPI** |
| AN | `아이디어스 쿠폰비 (Item)` | number | NO (미활용) | 쿠폰 할인액 (USD) |
| AO | `Pay GMV` | number | **YES** - Cost Analysis | 실 결제 금액 (USD) |
| AP | `구매수량` | number | **YES** - Dashboard, Analytics | 구매 수량 |
| AQ | `작품 판매 금액(KRW)` | number | **YES** - Sopo Receipt | 작품 판매 금액 (KRW) |
| AR | `처리상태` | string | **YES** - Control Tower | 처리 상태 (빈값 또는 상태값) |

**예시 데이터**:
- `shipment_item_id`: 15, 16, 17...
- `logistics`: "배송완료"
- `order item status`: "DELIVERED"
- `shipment item status`: "DELIVERED"
- `작가 발송 상태`: "INSPECTION_COMPLETE"
- `global bundle status`: "DELIVERY_COMPLETE"
- `국제송장번호`: "1Z3R5Y360402960371", "ECKLT00000587496"

---

#### B.3 Users (사용자) 시트 - 7개 컬럼

> **Raw Data 출처**: `[GB] 대시보드 제작 - users.csv`
> **데이터 건수**: ~73,837건 (2022.12 ~ 현재)
> **Primary Key**: `ID`

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A | `ID` | number | **YES** - Analytics, Business Brain, Order Detail | 사용자 고유 식별자 (PK) |
| B | `NAME` | string | NO (미활용) | 사용자 이름 (개인정보 보호) |
| C | `EMAIL` | string | NO (미활용) | 이메일 주소 (개인정보 보호) |
| D | `PHONE_NUMBER` | string | NO (미활용) | 전화번호 (대부분 빈값) |
| E | `COUNTRY` | string | **YES** - Analytics, Business Brain | 국가 코드 (JP, US, SG, KR 등) |
| F | `CREATED_AT` | datetime | **YES** - Analytics, Business Brain | 가입 일시 (코호트 분석) |
| G | `UPDATED_AT` | datetime | NO (미활용) | 정보 수정 일시 |

**예시 데이터**:
- `ID`: 751, 1075, 1447...
- `COUNTRY`: "JP", "US", "SG", "KR", "TW"
- `CREATED_AT`: "2022-12-19 5:50:36"
- `EMAIL`: "user@backpac.kr" (테스트 계정 포함)

---

#### B.4 Artists (작가) 시트 - 20개 컬럼

> **Raw Data 출처**: `[GB] 대시보드 제작 - artists.csv`
> **데이터 건수**: ~3,852건 (활성/비활성 작가 전체)
> **Primary Key**: `작가 ID (Global)`

##### 작가 식별 정보 (A~F)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A | `작가 ID (Global)` | number | **YES** - Artist Analytics, QC | 글로벌 작가 ID (PK) |
| B | `작가명 (Global)` | string | **YES** - Artist Analytics | 작가명 (영문/글로벌) |
| C | `사업자 이름 (Global)` | string | NO (미활용) | 사업자 등록명 |
| D | `작가 ID (KR)` | number | **YES** - QC | KR 작가 ID |
| E | `작가 UUID (KR)` | string | **YES** - QC | KR 작가 UUID |
| F | `작가명 (KR)` | string | **YES** - Dashboard, Analytics, Artist Analytics | 작가명 (한글) - **핵심 필드** |

##### 작가 상태 정보 (G~M)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| G | `작가 상태 (Global)` | string | **YES** - Artist Analytics | 글로벌 상태 (ACTIVE, VACATION 등) |
| H | `작가 상태 (KR)` | string | NO (미활용) | KR 상태 |
| I | `작가 등록일 (Global)` | date | **YES** - Artist Analytics | 글로벌 등록일 - **핵심 필드** |
| J | `작가 등록일 (KR)` | date | NO (미활용) | KR 등록일 |
| K | `퇴점일자 (KR)` | date | NO (미활용) | KR 퇴점일 |
| L | `삭제일자 (Global)` | date | **YES** - Artist Analytics | 글로벌 삭제일 (이탈 분석) |
| M | `삭제일자 (KR)` | date | NO (미활용) | KR 삭제일 |

##### 작품 수 정보 (N~S)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| N | `전체 작품수 (KR)` | number | NO (미활용) | KR 전체 작품수 |
| O | `Live 작품수 (KR)` | number | **YES** - Artist Analytics | KR 라이브 작품수 |
| P | `전체 작품수 (Global)` | number | NO (미활용) | 글로벌 전체 작품수 |
| Q | `Live 작품수 (Global)` | number | **YES** - Artist Analytics, Business Brain | 글로벌 라이브 작품수 - **핵심 필드** |
| R | `Live 작품수 (EN)` | number | NO (미활용) | 영어 라이브 작품수 |
| S | `Live 작품수 (JA)` | number | NO (미활용) | 일본어 라이브 작품수 |

##### 연락처 정보 (T)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| T | `mail` | string | **YES** - QC, Sopo Receipt | 작가 이메일 |

**예시 데이터**:
- `작가 ID (Global)`: 9628, 9627...
- `작가명 (Global)`: "DREAMYEONG", "olbit"
- `작가명 (KR)`: "드림영", "올빛"
- `작가 상태 (Global)`: "ACTIVE", "VACATION"
- `Live 작품수 (Global)`: 1, 7, 4...
- `mail`: "dreamyeong_@naver.com"

---

#### B.4-1 Artists_mail (작가 메일 정보) 시트 - 9개 컬럼

> **Raw Data 출처**: `[GB] 대시보드 제작 - artists_mail.csv`
> **데이터 건수**: ~4,530건
> **Primary Key**: `global_artist_id`
> **참고**: QC 및 Sopo Receipt에서 작가 이메일 조회에 사용

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A | `global_artist_id` | number | **YES** - QC, Sopo Receipt | 글로벌 작가 ID (PK) |
| B | `global_artist_created` | datetime | NO (미활용) | 작가 생성일시 |
| C | `profile_name` | string | **YES** - QC | 프로필 이름 (영문) |
| D | `artist_name_kr` | string | **YES** - QC, Sopo Receipt | 작가명 (한글) |
| E | `email` | string | **YES** - QC, Sopo Receipt | 작가 이메일 - **핵심 필드** |
| F | `company_name` | string | NO (미활용) | 사업자명 |
| G | `business_registration_number` | string | NO (미활용) | 사업자등록번호 |
| H | `representative_name` | string | NO (미활용) | 대표자명 |
| I | `status` | string | **YES** - QC | 작가 상태 (ACTIVE, VACATION) |

**예시 데이터**:
- `global_artist_id`: 6, 29, 35...
- `profile_name`: "SARISHOES", "edenheyum"
- `artist_name_kr`: "사리슈즈(SARI)", "이든혜윰"
- `email`: "songsariiiii@naver.com"
- `status`: "ACTIVE", "VACATION"

---

#### B.5 Settlement_records (정산 기록) 시트 - 28개 컬럼

> **Raw Data 출처**: `[GB] 대시보드 제작 - Settlement_records.csv`
> **데이터 건수**: ~123건 (2025.10 ~ 현재)
> **Primary Key**: `id`
> **Foreign Keys**: `shipment_id` → `logistics.shipment_id`

##### 기본 식별 필드 (A~G)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A | `id` | string | **YES** - Settlement | 정산 레코드 ID (PK, SET-xxx-xxx) |
| B | `period` | string | **YES** - Settlement, Cost Analysis | 정산 기간 (YYYY-MM) |
| C | `uploaded_at` | datetime | **YES** - Settlement | 업로드 일시 (ISO 8601) |
| D | `no` | number | **YES** - Settlement | 정산서 순번 |
| E | `carrier` | string | **YES** - Settlement, Cost Analysis | 운송사 (LOTTEGLOBAL, KPACKET, EMS) |
| F | `tracking_number` | string | **YES** - Settlement | 해외운송장번호 |
| G | `shipment_id` | number | **YES** - Settlement, Cost Analysis | 배송 ID (FK → logistics) |

##### 물류사 코드 (H~I)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| H | `logistics_shipment_code` | number | NO (미활용) | 물류사 출고번호 |
| I | `logistics_sub_shipment_code` | string | NO (미활용) | 물류사 부출고번호 |

##### 배송 정보 (J~P)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| J | `item_count` | number | **YES** - Settlement | 내품 수 |
| K | `shipped_at` | date | **YES** - Settlement | 발송일자 |
| L | `sender` | string | NO (미활용) | 보내는 사람 (BACKPACKR) |
| M | `recipient` | string | NO (미활용) | 받는 사람 (개인정보) |
| N | `country_code` | string | **YES** - Settlement, Cost Analysis | 도착국 코드 (JP, US, NO, AU 등) |
| O | `zone` | string | **YES** - Settlement | 존 (일본, 미국, 3지역, 호주 등) |
| P | `dimensions` | string | **YES** - Settlement | 디멘션 (LxWxH cm) |

##### 중량 정보 (Q~S)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| Q | `actual_weight` | number | **YES** - Settlement, Cost Analysis | 실중량 (kg) |
| R | `volumetric_weight` | number | **YES** - Settlement | 부피중량 (kg) |
| S | `charged_weight` | number | **YES** - Settlement, Cost Analysis | 청구중량 (kg) - **비용 계산 기준** |

##### 비용 정보 (T~AB) - **핵심 필드**

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| T | `shipping_fee` | number | **YES** - Settlement, Cost Analysis | 해외운송료 (원) |
| U | `surcharge1` | number | **YES** - Settlement | 기타운임1 (원) |
| V | `surcharge1_type` | string | **YES** - Settlement | 기타운임1 항목 (특별운송수수료 등) |
| W | `surcharge2` | number | **YES** - Settlement | 기타운임2 (원) |
| X | `surcharge2_type` | string | **YES** - Settlement | 기타운임2 항목 |
| Y | `surcharge3` | number | **YES** - Settlement | 기타운임3 (원) |
| Z | `surcharge3_type` | string | **YES** - Settlement | 기타운임3 항목 |
| AA | `total_cost` | number | **YES** - Settlement, Cost Analysis | 운임 합계 (원) - **핵심 KPI** |
| AB | `note` | string | **YES** - Settlement | 비고 |

**예시 데이터**:
- `id`: "SET-1764250390571-7tnl7tq1s"
- `period`: "2025-10"
- `carrier`: "LOTTEGLOBAL", "KPACKET"
- `country_code`: "JP", "US", "NO", "AU"
- `charged_weight`: 0.5, 1.5, 6.5 (kg)
- `total_cost`: 19740, 91140, 36840 (원)

---

#### B.6~B.8 Rate 요금표 시트 (참조용)

> **스키마 출처**: `sheetsSchema.ts` - rate_lotte, rate_ems, rate_kpacket
> **참고**: 현재 raw data 파일에 포함되어 있지 않음. `Settlement_records`의 비용 검증에 사용

##### Rate_LotteGlobal (롯데글로벌 요금표)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A | `country` | string | **YES** - Cost Analysis | 국가 코드 (JP, US 등) |
| B | `weight_from` | number | **YES** - Cost Analysis | 중량 시작 구간 (kg) |
| C | `weight_to` | number | **YES** - Cost Analysis | 중량 끝 구간 (kg) |
| D | `rate` | number | **YES** - Cost Analysis | 요금 (KRW) |

##### Rate_EMS (EMS 요금표)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A | `country` | string | **YES** - Cost Analysis | 국가 코드 |
| B | `weight_from` | number | **YES** - Cost Analysis | 중량 시작 구간 (kg) |
| C | `weight_to` | number | **YES** - Cost Analysis | 중량 끝 구간 (kg) |
| D | `rate` | number | **YES** - Cost Analysis | 요금 (KRW) |

##### Rate_KPacket (K-Packet 요금표)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A | `country` | string | **YES** - Cost Analysis | 국가 코드 |
| B | `weight_from` | number | **YES** - Cost Analysis | 중량 시작 구간 (kg) |
| C | `weight_to` | number | **YES** - Cost Analysis | 중량 끝 구간 (kg) |
| D | `rate` | number | **YES** - Cost Analysis | 요금 (KRW) |

---

#### B.9 Review (리뷰) 시트 - 15개 컬럼 ⚠️ 고활용 가능성

> **Raw Data 출처**: `[GB] 대시보드 제작 - review.csv`
> **데이터 건수**: ~657건 (2023 ~ 현재)
> **Primary Key**: `review_id`
> **Foreign Keys**: `order_id` → `order.order_id`, `user_id` → `users.ID`, `artist_id` → `artists.작가 ID (Global)`
> ⚠️ **현재 미활용**: 고객 만족도 분석, 상품 품질 개선, NPS 지표 산출에 활용 가능

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A | `dt` | date | NO (미활용) → **활용 권장** | 리뷰 작성일 |
| B | `review_id` | number | NO (미활용) | 리뷰 ID (PK) |
| C | `rating` | number | NO (미활용) → **활용 권장** | 평점 (10점 만점) |
| D | `contents` | string | NO (미활용) → **활용 권장** | 리뷰 내용 (일본어 다수) |
| E | `contents_len` | number | NO (미활용) | 리뷰 길이 |
| F | `image_url` | string | NO (미활용) | 이미지 URL |
| G | `image_cnt` | number | NO (미활용) | 이미지 개수 |
| H | `product_id` | number | NO (미활용) → **활용 권장** | 상품 ID (FK → logistics.product_id) |
| I | `product_name` | string | NO (미활용) | 상품명 |
| J | `artist_id` | number | NO (미활용) → **활용 권장** | 작가 ID (FK → artists) |
| K | `artist_name` | string | NO (미활용) | 작가명 (영문) |
| L | `user_id` | number | NO (미활용) | 사용자 ID (FK → users.ID) |
| M | `order_item_id` | number | NO (미활용) | 주문 아이템 ID |
| N | `order_id` | number | NO (미활용) | 주문 ID |
| O | `country` | string | NO (미활용) → **활용 권장** | 리뷰어 국가 (JP 다수) |

**예시 데이터**:
- `review_id`: 527761, 527760...
- `rating`: 10 (10점 만점)
- `contents`: "素敵なイラストで、またお気に入りが増えました。ありがとうございます☺︎" (일본어)
- `artist_name`: "greenut", "Ceramic YUL"
- `country`: "JP"

**🔥 활용 방안 (우선순위: 높음)**:
1. **고객 만족도 대시보드**: 평균 평점 트렌드, 작가별/상품별 평점 분석
2. **NPS 지표 산출**: 10점 만점 기준 Promoter(9-10)/Detractor(1-6) 분류
3. **리뷰 키워드 분석**: 일본어 자연어 처리로 고객 인사이트 도출
4. **이미지 리뷰 분석**: 이미지 포함 리뷰 비율 및 품질 분석

---

#### B.10 User_locale (사용자 지역 정보) 시트 - 4개 컬럼

> **Raw Data 출처**: `[GB] 대시보드 제작 - user_locale (2).csv`
> **데이터 건수**: ~79,163건
> **Foreign Keys**: `user_id` → `users.ID`
> **참고**: 대부분의 레코드가 빈값을 가지고 있음 (일부만 지역 정보 보유)

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A | `user_id` | number | **YES** - Analytics | 사용자 ID (FK → users.ID) |
| B | `timezone` | string | **YES** - Analytics | 타임존 (Europe/Rome 등) |
| C | `country_code` | string | **YES** - Analytics | 국가 코드 (IT 등) |
| D | `region` | string | **YES** - Analytics | 지역 (West 등) |

**예시 데이터**:
- `user_id`: 203
- `timezone`: "Europe/Rome"
- `country_code`: "IT"
- `region`: "West"

⚠️ **데이터 품질 이슈**: 대부분의 레코드가 timezone, country_code, region이 빈값

---

#### B.11 Sopo_tracking (소포수령증 트래킹) 시트 - 13개 컬럼

> **Raw Data 출처**: `[GB] 대시보드 제작 - Sopo_tracking.csv`
> **데이터 건수**: ~86건 (2025-11 기준)
> **참고**: 월별 작가별 소포수령증 신청 트래킹

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A | `period` | string | **YES** - Sopo Receipt | 기간 (YYYY-MM) |
| B | `artist_name` | string | **YES** - Sopo Receipt | 작가명 (한글) |
| C | `artist_email` | string | **YES** - Sopo Receipt | 작가 이메일 |
| D | `order_count` | number | **YES** - Sopo Receipt | 주문 건수 |
| E | `total_amount` | number | **YES** - Sopo Receipt | 총 금액 (KRW) |
| F | `notification_sent_at` | datetime | **YES** - Sopo Receipt | 알림 발송 일시 (ISO 8601) |
| G | `application_status` | string | **YES** - Sopo Receipt | 신청 상태 (pending, submitted) |
| H | `application_submitted_at` | datetime | **YES** - Sopo Receipt | 신청 제출 일시 |
| I | `jotform_submission_id` | string | **YES** - Sopo Receipt | JotForm 제출 ID |
| J | `reminder_sent_at` | datetime | NO (미활용) | 리마인더 발송 일시 |
| K | `receipt_issued_at` | datetime | NO (미활용) | 수령증 발급 일시 |
| L | `updated_at` | datetime | **YES** - Sopo Receipt | 업데이트 일시 |
| M | `shipment_ids` | string | **YES** - Sopo Receipt | 배송 ID 목록 (쉼표 구분) |

**예시 데이터**:
- `period`: "2025-11"
- `artist_name`: "최창남메이드 ccnmade", "코코나 cocona"
- `order_count`: 14, 13, 4...
- `total_amount`: 1854150, 547600, 297900 (KRW)
- `application_status`: "submitted", "pending"
- `shipment_ids`: "6089,6102,6090,6088..."

---

#### B.11-1 Sopo_jotform (소포수령증 JotForm 제출) 시트 - 9개 컬럼

> **Raw Data 출처**: `[GB] 대시보드 제작 - Sopo_jotform.csv`
> **데이터 건수**: ~462건
> **참고**: JotForm 통한 소포수령증 신청 제출 데이터

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A | `Submission Date` | datetime | **YES** - Sopo Receipt | 제출 일시 |
| B | `아이디어스 작가명 (국문 또는 영문)` | string | **YES** - Sopo Receipt | 작가명 |
| C | `사업자 등록증 사업자명` | string | **YES** - Sopo Receipt | 사업자명 |
| D | `사업자 등록증 사업자번호` | string | **YES** - Sopo Receipt | 사업자등록번호 |
| E | `사업자등록상 대표자명` | string | **YES** - Sopo Receipt | 대표자명 |
| F | `사업자 등록상 주소지` | string | **YES** - Sopo Receipt | 주소 |
| G | `소포수령증 발급 신청 주문 건 엑셀 업로드` | string | **YES** - Sopo Receipt | 업로드 파일 URL |
| H | `소포수령증 발급을 위한 신청 정보의 제3자 정보 공유에 동의합니다...` | string | **YES** - Sopo Receipt | 동의 여부 |
| I | `Submission ID` | string | **YES** - Sopo Receipt | JotForm 제출 ID (PK) |

**예시 데이터**:
- `Submission Date`: "2025-01-04 14:07:29"
- `아이디어스 작가명`: "ㄹlee", "향기열두달"
- `Submission ID`: "6117764481119877985"

---

#### B.12 QC 관련 시트

##### [QC] 한글_raw (텍스트 QC) - 9개 컬럼

> **Raw Data 출처**: `[GB] 대시보드 제작 - [QC] 한글_raw (1).csv`
> **데이터 건수**: ~7,004건
> **참고**: 일본어 번역 상품 정보의 한글 QC

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A | `global_product_id` | number | **YES** - QC | 글로벌 제품 ID |
| B | `kr_product_uuid` | string | **YES** - QC | KR 제품 UUID |
| C | `global_artist_id` | number | **YES** - QC | 글로벌 작가 ID |
| D | `name` | string | **YES** - QC | 일본어 제품명 |
| E | `pdp_descr` | string | **YES** - QC | 일본어 상세 설명 (번역 대상) |
| F | `created_at` | date | **YES** - QC | 생성일 |
| G | `product_name` | string | **YES** - QC | 한글 제품명 |
| H | `korean_place` | string | **YES** - QC | 한글 지역 (서울 등) |
| I | `status` | string | **YES** - QC | 처리 상태 |

**예시 데이터**:
- `global_product_id`: 37265
- `name`: "防水ストリングポーチ" (일본어)
- `product_name`: "달콤누리" (한글)

##### [QC] OCR_결과_raw (이미지 QC) - 12개 컬럼

> **Raw Data 출처**: `[GB] 대시보드 제작 - [QC] OCR_결과_raw (1).csv`
> **데이터 건수**: ~4,858건
> **참고**: 이미지 내 한글 텍스트 OCR 감지 결과

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A | `artist_id` | number | **YES** - QC | 작가 ID |
| B | `product_id` | number | **YES** - QC | 제품 ID |
| C | `description_id` | number | **YES** - QC | 설명 ID |
| D | `detected_text` | string | **YES** - QC | OCR 감지 한글 텍스트 |
| E | `image_url` | string | **YES** - QC | 이미지 URL |
| F | `page_name` | string | **YES** - QC | 페이지명 (detail_image, list_image) |
| G | `cmd_type` | string | **YES** - QC | 명령 타입 (NOCHANGE 등) |
| H | `product_name` | string | **YES** - QC | 제품명 |
| I | `product_uuid` | string | **YES** - QC | 제품 UUID |
| J | `status` | string | **YES** - QC | 상태 (needs_revision, archived 등) |
| K | `needsRevision` | boolean | **YES** - QC | 수정 필요 여부 (TRUE/FALSE) |
| L | `completedAt` | datetime | **YES** - QC | 완료일시 |

**예시 데이터**:
- `detected_text`: "여행용여권수남지갑 핵심정리!"
- `page_name`: "detail_image", "list_image"
- `status`: "needs_revision", "archived"

##### [QC] archiving (QC 아카이브) - 14개 컬럼

> **Raw Data 출처**: `[GB] 대시보드 제작 - [QC] archiving (1).csv`
> **데이터 건수**: ~1,375건
> **참고**: QC 완료 후 아카이브된 레코드

| 컬럼 | Raw Data Column Name | Data Type | Usage in Project | Description |
|:----:|---------------------|-----------|------------------|-------------|
| A~L | (OCR_결과_raw와 동일) | - | **YES** - QC | - |
| M | `type` | string | **YES** - QC | QC 타입 (image) |
| N | `createdAt` | datetime | **YES** - QC | 아카이브 생성일시 |

**예시 데이터**:
- `type`: "image"
- `createdAt`: "2025-11-27T12:17:20.671Z"

---

### 7.D. 컬럼 활용 현황 요약

#### 실제 Raw Data 기준 활용률 분석

> **기준**: 실제 CSV Raw Data 파일 분석 결과

| 엔티티/시트 | 전체 컬럼 수 | 활용 컬럼 수 | 활용률 | 비고 |
|:----------:|:------------:|:----------:|:------:|------|
| **Order** | 27 | 17 | **63%** | 파생 컬럼(분기/월/주/요일) 미활용 |
| **Logistics** | 43 | 38 | **88%** | ⭐ 핵심 시트, 최고 활용도 |
| **Users** | 7 | 3 | **43%** | 개인정보(NAME, EMAIL, PHONE) 미활용 |
| **Artists** | 20 | 11 | **55%** | KR 관련 컬럼 대부분 미활용 |
| **Artists_mail** | 9 | 5 | **56%** | 사업자 정보 미활용 |
| **Settlement_records** | 28 | 22 | **79%** | 물류사 내부 코드 미활용 |
| **Review** | 15 | 0 | **0%** | ⚠️ **완전 미활용 - 최우선 개선** |
| **User_locale** | 4 | 4 | **100%** | 데이터 품질 이슈 있음 |
| **Sopo_tracking** | 13 | 11 | **85%** | 높은 활용률 |
| **Sopo_jotform** | 9 | 9 | **100%** | 전체 활용 |
| **[QC] 한글_raw** | 9 | 9 | **100%** | QC 프로세스 전체 활용 |
| **[QC] OCR_결과_raw** | 12 | 12 | **100%** | QC 프로세스 전체 활용 |
| **[QC] archiving** | 14 | 14 | **100%** | QC 아카이브 전체 활용 |

#### 시트별 데이터 규모

| 시트명 | 데이터 건수 | 기간 | 비고 |
|--------|:---------:|------|------|
| order | ~1,780건 | 2023.03 ~ | 주문 단위 |
| logistics | ~4,314건 | 2023.03 ~ | 아이템 단위 (order보다 많음) |
| users | ~73,837건 | 2022.12 ~ | 전체 사용자 |
| artists | ~3,852건 | - | 활성/비활성 전체 |
| artists_mail | ~4,530건 | - | 이메일 정보 |
| Settlement_records | ~123건 | 2025.10 ~ | 정산서 단위 |
| review | ~657건 | 2023 ~ | ⚠️ 미활용 |
| user_locale | ~79,163건 | - | 대부분 빈값 |
| Sopo_tracking | ~86건 | 2025-11 | 월별 트래킹 |
| Sopo_jotform | ~462건 | 2025.01 ~ | JotForm 제출 |
| [QC] 한글_raw | ~7,004건 | - | 텍스트 QC |
| [QC] OCR_결과_raw | ~4,858건 | - | 이미지 OCR |
| [QC] archiving | ~1,375건 | - | QC 아카이브 |

#### 핵심 필드 활용 매핑 (페이지별)

| 페이지 | order 시트 | logistics 시트 | users 시트 | artists 시트 | 기타 시트 |
|--------|-----------|---------------|-----------|-------------|----------|
| **Dashboard** | Total GMV, order_code, order_created | logistics, artist_name (kr), country | - | - | - |
| **Analytics** | Total GMV, PG사, method, platform, country | Total GMV, country, artist_name (kr) | COUNTRY, CREATED_AT | 작가명 (KR) | - |
| **Control Tower** | order_status, shipment status | 모든 상태 컬럼, 국제송장번호 | - | - | - |
| **Artist Analytics** | - | Total GMV, artist_name (kr), product_id | - | Live 작품수, 작가 등록일, 삭제일자 | - |
| **Settlement** | - | - | - | - | Settlement_records 전체 |
| **Sopo Receipt** | 작품 판매 금액(KRW) | shipment_id, product_name | - | mail | Sopo_tracking 전체 |
| **QC** | - | - | - | artists_mail 전체 | QC 시트 전체 |

#### 상태값 컬럼 정리 (실제 데이터 기준)

| 도메인 | 컬럼명 (logistics 시트) | 실제 값 예시 | 활용 페이지 |
|--------|----------------------|------------|-----------|
| **Order** | `order item status` | DELIVERED, IN_TRANSIT, COURIER_PICK_UP | Control Tower |
| **Shipment** | `shipment status` (order 시트) | DONE, PROGRESSING | Control Tower |
| **Shipment Item** | `shipment item status` | DELIVERED, INSPECTION_COMPLETE | Control Tower |
| **Desire** | `작가 발송 상태` | INSPECTION_COMPLETE | Control Tower |
| **Artist Bundle** | `artist bundle item status` | INSPECT_SUCCESS | Logistics Performance |
| **Global** | `global bundle status` | DELIVERY_COMPLETE, EXPORTED | Control Tower |
| **물류** | `logistics` | 배송완료 | Dashboard, Control Tower |

#### 🔥 미활용 데이터 개선 권고사항

##### 1. Review 시트 활용 (우선순위: **최고** ⭐⭐⭐)

**현황**: 657건의 리뷰 데이터가 완전 미활용
**잠재 가치**: 고객 만족도 측정, 상품/작가 품질 개선

| 활용 방안 | 사용 컬럼 | 기대 효과 |
|----------|---------|----------|
| 고객 만족도 대시보드 | `rating`, `dt`, `country` | 평점 트렌드 모니터링 |
| NPS 지표 산출 | `rating` (10점 만점) | Promoter/Detractor 분류 |
| 작가별 평점 분석 | `artist_id`, `rating` | 작가 성과 지표 |
| 상품별 평점 분석 | `product_id`, `rating` | 상품 품질 모니터링 |
| 리뷰 키워드 분석 | `contents` (일본어) | NLP 인사이트 |
| 이미지 리뷰 분석 | `image_url`, `image_cnt` | 시각적 피드백 |

##### 2. Order 시트 파생 컬럼 활용 (우선순위: 중간)

**현황**: `분기`, `월`, `주`, `요일` 파생 컬럼 미활용
**활용 방안**:
- 요일별 주문 패턴 분석
- 분기별 매출 트렌드 리포트
- 주차별 캠페인 효과 분석

##### 3. Order 시트 금액 세부 컬럼 활용 (우선순위: 중간)

**현황**: `작품 가격`, `옵션 가격`, `Hidden Fee`, `아이디어스 쿠폰비` 미활용
**활용 방안**:
- 옵션 판매 비중 분석
- 쿠폰 사용률 및 효과 분석
- 숨김 수수료 투명성 리포트

##### 4. Artists 시트 KR 관련 컬럼 활용 (우선순위: 낮음)

**현황**: KR 상태, 등록일, 퇴점일, 작품수 등 미활용
**활용 방안**:
- KR/Global 교차 분석
- 작가 이탈 예측 모델 (KR → Global 전환율)

##### 5. User_locale 데이터 품질 개선 (우선순위: 낮음)

**현황**: 대부분의 레코드가 빈값
**개선 방안**:
- 사용자 접속 IP 기반 지역 정보 보강
- timezone 자동 감지 로직 추가

---

### 7.E. 데이터 아키텍처 권고사항

#### 1. 데이터 정규화 개선

| 현재 이슈 | 권고 사항 |
|----------|----------|
| logistics 시트에 order 정보 중복 | order ↔ logistics 조인 최적화 |
| artists 시트 컬럼명 불일치 | 작가명 컬럼 표준화 (`artist_name_kr`) |
| 상태값 컬럼 중복 (`global bundle status` 2개) | 데이터 정리 |

#### 2. 데이터 품질 모니터링

| 시트 | 품질 이슈 | 모니터링 필요 |
|------|---------|-------------|
| user_locale | 빈값 다수 | 채움률 모니터링 |
| logistics | 상태값 정합성 | Order-shipment 규칙 검증 |
| review | 미활용 | 활용 여부 추적 |

#### 3. 향후 확장 고려사항

- **ML 모델 학습 데이터**: review, user_locale 데이터 활용
- **실시간 대시보드**: logistics 상태값 기반 파이프라인 모니터링
- **고객 360도 뷰**: users + user_locale + order + review 통합

---

## 📋 Executive Summary (핵심 요약)

### 🔑 핵심 규칙 체크리스트

| 규칙 | 상세 | 필수 여부 |
|------|------|:--------:|
| **환율** | 1 USD = 1,350 KRW (고정) | ✅ 필수 |
| **원화 포맷** | `₩1,234,567` (정수, 천단위 쉼표) | ✅ 필수 |
| **변화율** | `+15.0%` / `-3.2%` (소수점 1자리) | ✅ 필수 |
| **Null 처리** | `safeNumber()`, `safeString()` 사용 | ✅ 필수 |
| **날짜 포맷 (API)** | `YYYY-MM-DD` | ✅ 필수 |
| **타임존** | Asia/Seoul (KST, UTC+9) | ✅ 필수 |
| **고객 활동 기준** | 90일/180일 | 🟡 설정 가능 |
| **물류 위험 기준** | 7/5/2/3/14일 | 🟡 설정 가능 |

### 📊 데이터 활용 현황 요약

| 구분 | 점수 | 상태 |
|------|:----:|:----:|
| **핵심 데이터 (Order/Logistics)** | 88% | 🟢 양호 |
| **부가 데이터 (Review/User_locale)** | 25% | 🔴 개선 필요 |
| **코드 일관성** | 60% | 🟡 통합 필요 |

### 🚀 즉시 실행 항목 (P0)

1. `lib/formatters.ts` 공통 포맷팅 함수 통합
2. `config/constants.ts` 환율/상수 중앙화
3. Dashboard 하드코딩 값 제거 (신규 고객, 배송 완료율)
4. Reviews 페이지 NPS 지표 추가

### 📈 예상 효과

| 개선 항목 | 예상 효과 |
|----------|----------|
| 공통 유틸리티 통합 | 코드 중복 **50% 감소**, 유지보수성 향상 |
| Review 분석 추가 | 고객 만족도 가시화, **NPS 지표 확보** |
| 환율 중앙화 | 금액 불일치 방지, **데이터 신뢰성 향상** |
| 데이터 캐싱 표준화 | API 응답 속도 **30% 개선** |

---

## 📌 문서 변경 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
|:----:|:----:|----------|--------|
| 1.0 | 2024-12-17 | 초기 문서 작성 | AI 자동화팀 |
| 2.0 | 2024-12-17 | 공통 규칙 기반 추가, 페이지별 진단 상세화, 허브 개선 로드맵 추가 | AI 자동화팀 |

---

> **문서 관리자**: AI 자동화팀  
> **최종 업데이트**: 2024-12-17 (v2.0 - 공통 규칙 기반 및 허브 개선 로드맵 추가)  
> **데이터 소스**: `[GB] 대시보드 제작` Google Sheets (14개 시트, ~176,000건 데이터)  
> **다음 리뷰 예정일**: 2025-01-17  
> **문서 경로**: `docs/통합_데이터_Context_및_규칙_문서.md`

