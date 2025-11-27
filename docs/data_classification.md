# 📊 데이터 분류 및 분석 체계

## 📋 목차
1. [데이터 소스 개요](#데이터-소스-개요)
2. [데이터 분류 체계](#데이터-분류-체계)
3. [분석 목적별 데이터 매핑](#분석-목적별-데이터-매핑)
4. [차트 타입별 데이터 요구사항](#차트-타입별-데이터-요구사항)

---

## 데이터 소스 개요

### 1. 주문 데이터 (Order Sheet)
**데이터 성격:** 거래/매출 데이터
**주요 식별자:** `order_code`, `user_id`
**시간 차원:** `order_created`

| 필드명 | 타입 | 설명 | 분석 용도 |
|--------|------|------|-----------|
| `order_code` | String | 주문 번호 (PK) | 주문 추적, 그룹핑 |
| `order_created` | Date | 주문 생성일시 | 시계열 분석, 트렌드 분석 |
| `user_id` | Number | 구매자 ID (FK) | 고객 분석, RFM 분석 |
| `Total GMV` | Number | 총 주문 금액 (USD) | 매출 분석, AOV 계산 |
| `platform` | String | 주문 플랫폼 | 채널 분석 |
| `PG사` | String | 결제 대행사 | 결제 수단 분석 |
| `method` | String | 결제 방식 | 결제 수단 분석 |

### 2. 물류 데이터 (Logistics Sheet)
**데이터 성격:** 운영/프로세스 데이터
**주요 식별자:** `order_code`, `product_id`, `artist_id`
**시간 차원:** 다중 (주문일, 발송일, 검수일, 배송일)

#### 2.1 기본 정보
| 필드명 | 타입 | 설명 | 분석 용도 |
|--------|------|------|-----------|
| `order_code` | String | 주문 번호 (FK) | 주문-물류 연결 |
| `shipment_id` | String | Shipment ID | 배송 추적 |
| `user_id` | Number | 구매자 ID | 고객별 물류 분석 |
| `country` | String | 배송 국가 | 지역별 분석 |
| `product_id` | String | 작품 ID | 상품 분석 |
| `product_name` | String | 작품명 | 상품 분석 |
| `artist_id` | String | 작가 ID | 작가 분석 |
| `artist_name (kr)` | String | 작가명 | 작가 분석 |
| `구매수량` | Number | 구매 수량 | 수량 분석 |

#### 2.2 물류 상태 정보
| 필드명 | 타입 | 설명 | 가능한 값 | 분석 용도 |
|--------|------|------|-----------|-----------|
| `logistics` | String | 종합 물류 상태 | 결제완료, 작가발송, 검수완료, 배송중, 배송완료 등 | 파이프라인 분석 |
| `처리상태` | String | 처리 상태 메모 | 사용자 입력 | 상태 추적 |
| `order item status` | String | 주문 아이템 상태 | ORDER_COMPLETED, PREPARING, IN_TRANSIT, DELIVERED 등 | 상세 상태 분석 |
| `작가 발송 상태` | String | 작가 발송 상태 | IN_DELIVERY, IMPORTED, INSPECTION_COMPLETE | 작가 성과 분석 |
| `artist bundle item status` | String | 작가 번들 상태 | CREATED, INSPECT_SUCCESS | 검수 프로세스 분석 |
| `shipment item status` | String | 배송 아이템 상태 | CREATED, ARTIST_SENT, INSPECTION_COMPLETE, DELIVERED | 배송 단계 분석 |
| `global bundle status` | String | 글로벌 번들 상태 | IN_DELIVERY, EXPORT_START, SHIPPED, DELIVERING | 국제 배송 분석 |

#### 2.3 시간 정보
| 필드명 | 타입 | 설명 | 분석 용도 |
|--------|------|------|-----------|
| `order_created` | Date | 주문 생성일시 | 주문 트렌드 |
| `작가 발송 updated` | Date | 작가 발송 업데이트일 | 작가 성과 분석 |
| `artist bundle item updated` | Date | 검수 완료일 | 검수 프로세스 분석 |
| `shipment_item_updated` | Date | 배송 아이템 업데이트일 | 배송 시간 분석 |

#### 2.4 배송 추적 정보
| 필드명 | 타입 | 설명 | 분석 용도 |
|--------|------|------|-----------|
| `작가 발송 송장번호` | String | 작가 발송 택배 송장번호 | 배송 추적 |
| `작가 발송 택배사` | String | 작가 발송 택배사 | 택배사 분석 |
| `국제송장번호` | String | 국제 배송 송장번호 | 국제 배송 추적 |

#### 2.5 매출 정보
| 필드명 | 타입 | 설명 | 분석 용도 |
|--------|------|------|-----------|
| `Total GMV` | Number | 총 주문 금액 (USD) | 매출 분석 |

### 3. 사용자 데이터 (Users Sheet)
**데이터 성격:** 고객 마스터 데이터
**주요 식별자:** `ID`
**시간 차원:** `CREATED_AT`

| 필드명 | 타입 | 설명 | 분석 용도 |
|--------|------|------|-----------|
| `ID` | Number | User ID (PK) | 고객 식별 |
| `NAME` | String | 고객명 | 고객 정보 표시 |
| `EMAIL` | String | 이메일 주소 | 고객 연락 |
| `COUNTRY` | String | 국가 코드 | 국가별 분석 |
| `CREATED_AT` | Date | 가입일시 | 생애주기 분석, 코호트 분석 |

### 4. 작가 데이터 (Artists Sheet)
**데이터 성격:** 작가 마스터 데이터
**주요 식별자:** `(KR)작가명`

| 필드명 | 타입 | 설명 | 분석 용도 |
|--------|------|------|-----------|
| `(KR)작가명` | String | 작가명 (PK) | 작가 식별 |
| `(KR)Live 작품수` | Number | 한국 라이브 작품 수 | 작가 성과 분석 |
| `(Global)Live 작품수` | Number | 글로벌 라이브 작품 수 | 작가 성과 분석 |

---

## 데이터 분류 체계

### 1. 데이터 성격별 분류

#### 1.1 거래/매출 데이터 (Transaction/Revenue Data)
**특징:** 금액, 수량 등 수치형 데이터
**데이터 소스:** Order, Logistics
**주요 필드:**
- `Total GMV` (USD)
- `구매수량`
- 계산 가능 지표: AOV, 총 매출, 평균 주문 금액

**분석 목적:**
- 매출 트렌드 분석
- 수익성 분석
- 가격 분석
- 수량 분석

#### 1.2 고객 데이터 (Customer Data)
**특징:** 고객 속성 및 행동 데이터
**데이터 소스:** Users, Order (user_id 기준 집계)
**주요 필드:**
- `ID`, `NAME`, `EMAIL`, `COUNTRY`, `CREATED_AT`
- 계산 가능 지표: RFM 점수, 생애주기, 구매 빈도, 총 구매 금액

**분석 목적:**
- 고객 세그멘테이션
- 생애주기 분석
- 코호트 분석
- 고객 가치 분석

#### 1.3 운영/프로세스 데이터 (Operational/Process Data)
**특징:** 프로세스 상태 및 시간 데이터
**데이터 소스:** Logistics
**주요 필드:**
- 물류 상태 필드들
- 시간 필드들 (주문일, 발송일, 검수일, 배송일)

**분석 목적:**
- 프로세스 효율성 분석
- 지연 분석
- 파이프라인 분석
- 처리 시간 분석

#### 1.4 상품/작가 데이터 (Product/Artist Data)
**특징:** 상품 및 작가 속성 데이터
**데이터 소스:** Logistics, Artists
**주요 필드:**
- `product_id`, `product_name`
- `artist_id`, `artist_name`
- `(KR)Live 작품수`, `(Global)Live 작품수`

**분석 목적:**
- 상품 성과 분석
- 작가 성과 분석
- 인기 상품/작가 분석
- 카테고리 분석

#### 1.5 채널/결제 데이터 (Channel/Payment Data)
**특징:** 주문 경로 및 결제 수단 데이터
**데이터 소스:** Order
**주요 필드:**
- `platform`
- `PG사`
- `method`

**분석 목적:**
- 채널 성과 분석
- 결제 수단 분석
- 채널별 전환율 분석

#### 1.6 지역 데이터 (Geographic Data)
**특징:** 지역/국가 정보
**데이터 소스:** Logistics (country), Users (COUNTRY)
**주요 필드:**
- `country` (배송 국가)
- `COUNTRY` (고객 국가)

**분석 목적:**
- 지역별 매출 분석
- 국가별 성과 분석
- 지역별 트렌드 분석

---

### 2. 시간 차원별 분류

#### 2.1 시계열 데이터 (Time Series Data)
**특징:** 시간에 따른 변화 추적 가능
**데이터 소스:** Order, Logistics, Users
**주요 필드:**
- `order_created` - 주문 시점
- `작가 발송 updated` - 발송 시점
- `artist bundle item updated` - 검수 시점
- `shipment_item_updated` - 배송 시점
- `CREATED_AT` - 가입 시점

**분석 목적:**
- 트렌드 분석
- 시계열 예측
- 계절성 분석
- 성장률 분석

#### 2.2 기간별 집계 데이터 (Period Aggregated Data)
**특징:** 특정 기간의 집계 값
**계산 가능 지표:**
- 일별/주별/월별 매출
- 기간별 주문 건수
- 기간별 신규 고객 수
- 기간별 작가별 매출

**분석 목적:**
- 기간 비교 분석
- 성장률 분석
- 목표 대비 달성률 분석

---

### 3. 집계 수준별 분류

#### 3.1 원시 데이터 (Raw Data)
**특징:** 개별 레코드 수준
**예시:**
- 개별 주문 레코드
- 개별 물류 레코드
- 개별 고객 레코드

#### 3.2 집계 데이터 (Aggregated Data)
**특징:** 그룹별 집계 값
**집계 기준:**
- 날짜별
- 국가별
- 작가별
- 상품별
- 고객별
- 채널별

**집계 함수:**
- SUM (총합)
- COUNT (건수)
- AVG (평균)
- MAX/MIN (최대/최소)
- DISTINCT COUNT (고유 개수)

---

## 분석 목적별 데이터 매핑

### 1. 매출 분석 (Revenue Analysis)

#### 필요한 데이터:
- **Order Sheet:** `Total GMV`, `order_created`, `order_code`
- **Logistics Sheet:** `Total GMV` (검증용)

#### 계산 가능 지표:
- 총 매출 (GMV)
- 평균 주문 금액 (AOV)
- 주문 건수
- 일별/주별/월별 매출
- 전년/전월 대비 성장률

#### 차트 타입:
- Line Chart (시계열 매출)
- Bar Chart (기간별 비교)
- Area Chart (누적 매출)
- Waterfall Chart (매출 구성 요소)

---

### 2. 고객 분석 (Customer Analysis)

#### 필요한 데이터:
- **Users Sheet:** `ID`, `COUNTRY`, `CREATED_AT`
- **Order Sheet:** `user_id`, `order_created`, `Total GMV`, `order_code`
- **Logistics Sheet:** `user_id` (검증용)

#### 계산 가능 지표:
- 신규 고객 수
- 활성 고객 수
- 고객 생애주기 (Prospect, New, Growing, Core, Dormant, Churned)
- RFM 점수 (Recency, Frequency, Monetary)
- 첫 구매 전환율 (CVR)
- 고객 생애 가치 (LTV)
- 코호트별 성과

#### 차트 타입:
- Pie/Doughnut Chart (생애주기 분포)
- Bar Chart (RFM 세그먼트)
- Line Chart (코호트 분석)
- Scatter Chart (RFM 분포)
- Funnel Chart (전환 퍼널)

---

### 3. 물류/운영 분석 (Logistics/Operations Analysis)

#### 필요한 데이터:
- **Logistics Sheet:** 모든 상태 필드, 시간 필드, `order_code`

#### 계산 가능 지표:
- 파이프라인 단계별 주문 수
- 평균 처리 시간 (주문 → 발송, 발송 → 검수, 검수 → 배송)
- 지연 주문 수
- 단계별 체류 시간
- 처리율 (Throughput Rate)
- 배송 완료율

#### 차트 타입:
- Funnel Chart (파이프라인)
- Gantt Chart (타임라인)
- Bar Chart (단계별 건수)
- Heatmap (시간대별 처리량)
- Sankey Diagram (플로우)

---

### 4. 상품/작가 분석 (Product/Artist Analysis)

#### 필요한 데이터:
- **Logistics Sheet:** `product_id`, `product_name`, `artist_id`, `artist_name`, `Total GMV`, `구매수량`
- **Artists Sheet:** `(KR)작가명`, `(KR)Live 작품수`, `(Global)Live 작품수`

#### 계산 가능 지표:
- 작가별 매출
- 작가별 주문 건수
- 상품별 매출
- 상품별 판매량
- 인기 작가/상품 랭킹
- 작가별 평균 주문 금액
- 작가별 작품 수

#### 차트 타입:
- Bar Chart (랭킹)
- Treemap (매출 비중)
- Scatter Chart (매출 vs 주문 건수)
- Bubble Chart (매출, 주문, 작품 수)

---

### 5. 채널 분석 (Channel Analysis)

#### 필요한 데이터:
- **Order Sheet:** `platform`, `PG사`, `method`, `Total GMV`, `order_code`

#### 계산 가능 지표:
- 플랫폼별 매출
- 플랫폼별 주문 건수
- PG사별 주문 건수
- 결제 수단별 주문 건수
- 채널별 AOV
- 채널별 전환율

#### 차트 타입:
- Pie/Doughnut Chart (비중)
- Bar Chart (비교)
- Stacked Bar Chart (시간별 비교)

---

### 6. 지역 분석 (Geographic Analysis)

#### 필요한 데이터:
- **Logistics Sheet:** `country`, `Total GMV`
- **Users Sheet:** `COUNTRY`
- **Order Sheet:** `user_id` (Users와 조인)

#### 계산 가능 지표:
- 국가별 매출
- 국가별 주문 건수
- 국가별 AOV
- 국가별 고객 수
- 국가별 성장률

#### 차트 타입:
- Bar Chart (국가별 비교)
- Map Chart (지역별 분포)
- Treemap (매출 비중)

---

### 7. 트렌드 분석 (Trend Analysis)

#### 필요한 데이터:
- **Order Sheet:** `order_created`, `Total GMV`
- **Logistics Sheet:** `order_created`, `country`, `artist_name`

#### 계산 가능 지표:
- 일별/주별/월별 매출 추이
- 일별/주별/월별 주문 건수 추이
- 국가별 트렌드
- 작가별 트렌드
- 계절성 패턴

#### 차트 타입:
- Line Chart (시계열)
- Area Chart (누적)
- Multi-line Chart (비교)
- Candlestick Chart (변동성)

---

### 8. 비교 분석 (Comparative Analysis)

#### 필요한 데이터:
- 모든 시트 (필터 조건에 따라)

#### 비교 기준:
- 기간 비교 (전월 대비, 전년 대비)
- 국가 비교 (JP vs Non-JP)
- 작가 비교 (Top 작가들)
- 채널 비교 (플랫폼별)
- 세그먼트 비교 (RFM 세그먼트)

#### 차트 타입:
- Grouped Bar Chart
- Stacked Bar Chart
- Radar Chart (다차원 비교)
- Parallel Coordinates

---

## 차트 타입별 데이터 요구사항

### 1. 시계열 차트 (Line/Area Chart)
**필수 데이터:**
- 시간 필드 (Date)
- 수치 필드 (Number)
- 선택적 그룹 필드 (String)

**예시:**
- 일별 매출: `order_created` (일별 집계) + `Total GMV` (SUM)
- 국가별 트렌드: `order_created` + `country` + `Total GMV`

---

### 2. 막대 차트 (Bar Chart)
**필수 데이터:**
- 카테고리 필드 (String)
- 수치 필드 (Number)
- 선택적 그룹 필드 (String)

**예시:**
- 국가별 매출: `country` + `Total GMV` (SUM)
- 작가별 주문 건수: `artist_name` + `order_code` (COUNT DISTINCT)

---

### 3. 원형 차트 (Pie/Doughnut Chart)
**필수 데이터:**
- 카테고리 필드 (String)
- 수치 필드 (Number)

**예시:**
- 생애주기 분포: `생애주기` (계산) + 고객 수 (COUNT)
- 채널별 비중: `platform` + `Total GMV` (SUM)

---

### 4. 산점도 (Scatter Chart)
**필수 데이터:**
- X축 수치 필드 (Number)
- Y축 수치 필드 (Number)
- 선택적 그룹 필드 (String)

**예시:**
- RFM 분석: R점수 vs F점수 vs M점수
- 작가 분석: 매출 vs 주문 건수

---

### 5. 히트맵 (Heatmap)
**필수 데이터:**
- X축 카테고리 (String)
- Y축 카테고리 (String)
- 수치 필드 (Number)

**예시:**
- 시간대별 요일별 주문량: `시간대` + `요일` + 주문 건수
- 국가별 월별 매출: `country` + `월` + `Total GMV`

---

### 6. 트리맵 (Treemap)
**필수 데이터:**
- 계층적 카테고리 (String)
- 수치 필드 (Number)

**예시:**
- 국가 > 작가별 매출: `country` + `artist_name` + `Total GMV`
- 작가 > 상품별 매출: `artist_name` + `product_name` + `Total GMV`

---

### 7. 퍼널 차트 (Funnel Chart)
**필수 데이터:**
- 단계 필드 (String)
- 수치 필드 (Number)

**예시:**
- 물류 파이프라인: `파이프라인 단계` + 주문 건수
- 전환 퍼널: `단계` + 고객 수

---

### 8. 간트 차트 (Gantt Chart)
**필수 데이터:**
- 항목 ID (String)
- 시작 시간 (Date)
- 종료 시간 (Date)
- 선택적 그룹 필드 (String)

**예시:**
- 주문별 처리 타임라인: `order_code` + 각 단계별 시간

---

### 9. 워터폴 차트 (Waterfall Chart)
**필수 데이터:**
- 카테고리 필드 (String)
- 수치 필드 (Number)

**예시:**
- 매출 구성 요소: `매출 항목` + 금액
- 전월 대비 변화: `변화 항목` + 변화량

---

### 10. 지도 차트 (Map Chart)
**필수 데이터:**
- 국가 코드 (String)
- 수치 필드 (Number)

**예시:**
- 국가별 매출: `country` + `Total GMV` (SUM)

---

## 데이터 조인 관계

### 1. 기본 조인
```
users (ID) 
  ↓ 1:N
order (user_id, order_code)
  ↓ 1:N
logistics (order_code, product_id, artist_name)
  ↓ N:1
artists ((KR)작가명)
```

### 2. 조인 키
- `users.ID` = `order.user_id`
- `order.order_code` = `logistics.order_code`
- `logistics.artist_name (kr)` = `artists.(KR)작가명`

### 3. 집계 시 주의사항
- Order 레벨 집계: `order_code` 기준 DISTINCT
- 고객 레벨 집계: `user_id` 기준 집계
- 작품 레벨 집계: `product_id` 기준 집계
- 작가 레벨 집계: `artist_name` 기준 집계

---

## 데이터 품질 고려사항

### 1. 결측치 처리
- `order_code`: 필수 (null 제외)
- `user_id`: Order에만 존재, Logistics에는 없을 수 있음
- `artist_name`: Logistics에 직접 저장, null 가능

### 2. 데이터 타입 변환
- 날짜: Google Sheets Date → JavaScript Date
- 숫자: 문자열 숫자 → Number (쉼표 제거)
- 환율: USD → KRW (1 USD = 1,350 KRW)

### 3. 중복 처리
- Order: `order_code` 기준 고유
- Logistics: `order_code` + `product_id` 조합 (Fill-down 적용)

---

## 다음 단계: 차트 고도화 방향

이 분류 체계를 바탕으로:
1. **기존 차트 강화**: 더 많은 필터, 드릴다운, 비교 기능
2. **신규 차트 추가**: 위에서 정의한 차트 타입들
3. **인터랙티브 기능**: 클릭, 호버, 줌, 필터 연동
4. **대시보드 커스터마이징**: 사용자가 원하는 차트 조합

