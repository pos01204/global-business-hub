# Raw Data 구조 분석 문서

이 문서는 `raw_data` 폴더의 엑셀 파일들과 Google Sheets 시트의 데이터 구조를 분석한 결과입니다.

## 시트 구조 개요

시스템은 총 4개의 시트를 사용합니다:
1. **order** - 주문 정보
2. **logistics** - 물류 추적 정보
3. **users** - 사용자(고객) 마스터 데이터
4. **artists** - 작가 마스터 데이터

---

## 1. order 시트 (주문 정보)

### 주요 컬럼

| 컬럼명 | 타입 | 설명 | 사용 예시 |
|--------|------|------|-----------|
| `order_code` | String | 주문 번호 (고유 식별자) | 주문 조회, 그룹핑 |
| `order_created` | Date | 주문 생성일시 | 날짜 필터링, 트렌드 분석 |
| `user_id` | Number | 구매자 User ID | 고객 분석, RFM 분석 |
| `Total GMV` | Number | 총 주문 금액 (USD) | 매출 분석, AOV 계산 |
| `platform` | String | 주문 플랫폼 | 채널 분석 |
| `PG사` | String | 결제 대행사 | 결제 수단 분석 |
| `method` | String | 결제 방식 | 결제 수단 분석 |

### 주요 기능
- 주문별 매출 집계
- 플랫폼/결제 수단 분석
- 고객별 주문 이력 추적 (RFM 분석)
- 날짜 범위별 필터링

### 데이터 특성
- `order_code`는 logistics 시트와 조인 키로 사용
- `user_id`는 users 시트와 조인 키로 사용
- `Total GMV`는 USD 단위이며, KRW 변환 시 1350 환율 적용

---

## 2. logistics 시트 (물류 추적 정보)

### 주요 컬럼

#### 기본 정보
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `order_code` | String | 주문 번호 (order 시트와 조인) |
| `shipment_id` | String | Shipment ID (LGL) |
| `user_id` | Number | 구매자 User ID |
| `country` | String | 배송 국가 (예: JP, US 등) |
| `product_id` | String | 작품 ID |
| `product_name` | String | 작품명 |
| `artist_id` | String | 작가 ID |
| `artist_name (kr)` | String | 작가명 (한국어) |
| `구매수량` | Number | 구매 수량 |

#### 물류 상태 정보
| 컬럼명 | 타입 | 설명 | 가능한 값 |
|--------|------|------|-----------|
| `logistics` | String | 종합 물류 상태 | '결제 완료', '작가 발송', '작가 송장 입력', '검수 대기', '검수 완료', '국제배송 시작', '배송중', '배송완료' |
| `처리상태` | String | 처리 상태 메모 | 사용자 입력 메모 |

#### 상태별 상세 정보
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `order item status` | String | 주문 아이템 상태 | 'ORDER_COMPLETED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'COURIER_PICK_UP', 'PACKAGING' |
| `작가 발송 상태` | String | 작가 발송 상태 | 'IN_DELIVERY', 'IMPORTED', 'INSPECTION_COMPLETE' |
| `artist bundle item status` | String | 작가 번들 아이템 상태 | 'CREATED', 'INSPECT_SUCCESS' |
| `shipment item status` | String | 배송 아이템 상태 | 'CREATED', 'ARTIST_SENT', 'INSPECTION_COMPLETE', 'DELIVERED' |
| `global bundle status` | String | 글로벌 번들 상태 | 'IN_DELIVERY', 'EXPORT_START', 'SHIPPED', 'DELIVERING' |

#### 날짜 정보
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `order_created` | Date | 주문 생성일시 |
| `작가 발송 updated` | Date | 작가 발송 업데이트일 |
| `artist bundle item updated` | Date | 작가 번들 아이템 업데이트일 (검수 완료일) |
| `shipment_item_updated` | Date | 배송 아이템 업데이트일 |

#### 배송 추적 정보
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `작가 발송 송장번호` | String | 작가 발송 택배 송장번호 |
| `작가 발송 택배사` | String | 작가 발송 택배사 (CJ, Lotte 등) |
| `국제송장번호` | String | 국제 배송 송장번호 |

#### 매출 정보
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `Total GMV` | Number | 총 주문 금액 (USD) |

### 데이터 특성
- **Fill-down 로직**: `order_code`를 기준으로 빈 셀을 위에서 채움 (enableFillDown=true)
- 한 주문에 여러 작품이 포함될 수 있음 (1:N 관계)
- 물류 파이프라인 5단계 분류:
  1. 미입고 (결제 완료)
  2. 국내 배송중 (입고 대기)
  3. 검수 대기 (입고 완료)
  4. 포장/출고 대기 (검수 완료)
  5. 국제 배송중

### 상태 분류 로직
```javascript
// 물류 파이프라인 분류 예시
if (국제송장번호 존재 || globalStatus === 'EXPORT_START' || 'SHIPPED' || 'DELIVERING' || orderItemStatus === 'IN_TRANSIT')
  → 'internationalShipping'
else if (shipmentItemStatus === 'INSPECTION_COMPLETE' || ...)
  → 'inspectionComplete'
else if (artistSendStatus === 'IMPORTED')
  → 'awaitingInspection'
else if (artistSendStatus === 'IN_DELIVERY' || ...)
  → 'artistShipping'
else if (orderItemStatus === 'ORDER_COMPLETED' || 'PREPARING' || ...)
  → 'unreceived'
```

---

## 3. users 시트 (사용자 마스터 데이터)

### 주요 컬럼

| 컬럼명 | 타입 | 설명 | 사용 예시 |
|--------|------|------|-----------|
| `ID` | Number | User ID (고유 식별자) | order/logistics 시트와 조인 |
| `NAME` | String | 고객명 | 고객 상세 정보 표시 |
| `EMAIL` | String | 이메일 주소 | 고객 상세 정보 표시 |
| `COUNTRY` | String | 국가 코드 | 국가별 필터링 (JP, US 등) |
| `CREATED_AT` | Date | 가입일시 | 생애주기 분석, 첫 구매 전환율 계산 |

### 데이터 특성
- `ID`는 order 시트의 `user_id`와 조인 키로 사용
- `COUNTRY`는 국가별 필터링 및 분석에 사용
- `CREATED_AT`는 고객 생애주기 분석에 사용:
  - Prospect: 가입만 하고 구매 없음
  - New: 가입 90일 이내 & 최근 90일 내 구매
  - Growing: 가입 1년 이내 & Active
  - Core: 가입 1년 초과 & Active
  - Dormant: 91~180일 미구매
  - Churned: 181일 이상 미구매

---

## 4. artists 시트 (작가 마스터 데이터)

### 주요 컬럼

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `(KR)작가명` | String | 작가명 (한국어) - Map 키로 사용 |
| `(KR)Live 작품수` | Number | 한국 라이브 작품 수 |
| `(Global)Live 작품수` | Number | 글로벌 라이브 작품 수 |

### 데이터 특성
- `(KR)작가명`은 logistics 시트의 `artist_name (kr)`과 매칭
- 작가별 매출/주문 분석에 사용
- 현재 코드에서는 직접 사용 빈도가 낮음 (주로 logistics 시트의 작가명 사용)

---

## 데이터 관계도

```
users (ID)
  ↓ (1:N)
order (user_id, order_code, Total GMV, platform, PG사, method, order_created)
  ↓ (1:N)
logistics (order_code, product_id, artist_name, logistics, 처리상태, ...)
  ↓ (N:1)
artists ((KR)작가명)
```

### 조인 관계
1. **users ↔ order**: `users.ID` = `order.user_id`
2. **order ↔ logistics**: `order.order_code` = `logistics.order_code`
3. **logistics ↔ artists**: `logistics.artist_name (kr)` = `artists.(KR)작가명`

---

## 주요 비즈니스 로직

### 1. RFM 분석
- **R (Recency)**: 마지막 구매일로부터 경과일
- **F (Frequency)**: 총 주문 횟수
- **M (Monetary)**: 총 구매 금액 (KRW)
- **세그먼트**:
  - VIP: F≥5, M≥1,000,000원, R≤90일
  - 잠재 고객: F≥2, M≥300,000원, R≤180일
  - 신규 고객: F=1

### 2. 고객 활동 상태
- **Active**: 최근 90일 내 구매
- **Inactive**: 91~180일 내 구매
- **Churn Risk**: 181일 이상 미구매
- **No Purchase**: 구매 이력 없음

### 3. 물류 파이프라인 지연 감지
- **미입고**: 7일 이상 지연 시 위험
- **국내 배송중**: 5일 이상 지연 시 위험
- **검수 대기**: 2일 이상 지연 시 위험
- **포장/출고 대기**: 3일 이상 지연 시 위험

### 4. 환율 변환
- USD → KRW: 1 USD = 1,350 KRW (고정)
- `Total GMV` (USD) × 1350 = KRW 매출

---

## 데이터 처리 특성

### Fill-down 로직
- **logistics 시트**: `order_code`를 기준으로 빈 셀을 위에서 채움
- **order/users/artists 시트**: Fill-down 불필요 (각 행이 독립적)

### 캐싱 전략
- 메인 대시보드: 10분 캐시 (날짜 범위별 키)
- 분석 데이터: 10분 캐시 (기간/국가 필터별 키)
- 미입고 데이터: 10분 캐시

### 데이터 필터링
- 날짜 범위 필터: `order_created` 기준
- 국가 필터: `country` 또는 `users.COUNTRY` 기준
- 상태 필터: `logistics` 또는 각종 상태 컬럼 기준

---

## 참고사항

1. **컬럼명 일관성**: 
   - 한국어 컬럼명: `처리상태`, `작가 발송 상태`, `구매수량` 등
   - 영문 컬럼명: `order_code`, `user_id`, `product_id` 등
   - 혼용 사용

2. **날짜 형식**: 
   - Google Sheets Date 객체로 저장
   - JavaScript Date 객체로 변환하여 처리

3. **데이터 무결성**:
   - `order_code`는 필수 (null 체크 필요)
   - `user_id`는 order 시트에만 존재, logistics 시트에는 없을 수 있음
   - `artist_name (kr)`은 logistics 시트에 직접 저장됨

4. **성능 최적화**:
   - Map 자료구조 사용 (users, artists)
   - Set 자료구조 사용 (중복 제거)
   - 캐싱으로 반복 계산 방지


