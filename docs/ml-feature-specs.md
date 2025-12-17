# 📊 ML 피처 정의서

> **문서 버전**: 1.0  
> **작성일**: 2024-12-17  
> **목적**: Phase 5 예측 모델을 위한 피처 정의  
> **참조**: `Phase5_고도화_IA설계_및_데이터전략.md`

---

## 1. 개요

### 1.1 목적

이 문서는 Global Business Hub의 예측 모델(이탈 예측, GMV 예측, LTV 예측)에 사용될 피처(Feature)를 정의합니다.

### 1.2 피처 분류

| 분류 | 설명 | 예시 |
|------|------|------|
| **원천 피처** | Raw Data에서 직접 추출 | `total_orders`, `avg_rating` |
| **파생 피처** | 원천 피처를 가공하여 생성 | `days_since_last_order`, `order_growth_rate` |
| **집계 피처** | 기간별 집계 | `monthly_gmv`, `quarterly_order_count` |
| **비율 피처** | 두 값의 비율 | `return_rate`, `coupon_usage_rate` |

---

## 2. 고객 이탈 예측 (Churn Prediction)

### 2.1 모델 개요

| 항목 | 내용 |
|------|------|
| **목적** | 고객의 이탈 확률 예측 |
| **타겟 변수** | `is_churned` (90일 이상 미구매 시 1) |
| **예측 주기** | 주 1회 |
| **모델 후보** | XGBoost, LightGBM, Random Forest |

### 2.2 피처 목록

#### RFM 기반 피처

| 피처명 | 타입 | 설명 | 계산 방법 |
|--------|------|------|----------|
| `recency_days` | INT | 마지막 구매 이후 경과일 | `today - last_order_date` |
| `frequency_total` | INT | 총 주문 횟수 | `COUNT(order_id)` |
| `frequency_30d` | INT | 최근 30일 주문 횟수 | `COUNT(order_id) WHERE order_date >= today-30` |
| `frequency_90d` | INT | 최근 90일 주문 횟수 | `COUNT(order_id) WHERE order_date >= today-90` |
| `monetary_total` | DECIMAL | 총 구매 금액 (KRW) | `SUM(total_gmv * 1350)` |
| `monetary_avg` | DECIMAL | 평균 주문 금액 | `AVG(total_gmv * 1350)` |
| `monetary_30d` | DECIMAL | 최근 30일 구매 금액 | `SUM(total_gmv * 1350) WHERE order_date >= today-30` |

#### 행동 피처

| 피처명 | 타입 | 설명 | 계산 방법 |
|--------|------|------|----------|
| `avg_order_interval` | FLOAT | 평균 주문 간격 (일) | `AVG(order_date - prev_order_date)` |
| `order_interval_std` | FLOAT | 주문 간격 표준편차 | `STDDEV(order_date - prev_order_date)` |
| `days_as_customer` | INT | 고객 유지 기간 | `today - first_order_date` |
| `order_trend_30d` | FLOAT | 30일 주문 트렌드 (증감률) | `(freq_30d - freq_prev_30d) / freq_prev_30d` |
| `order_trend_90d` | FLOAT | 90일 주문 트렌드 | `(freq_90d - freq_prev_90d) / freq_prev_90d` |

#### 만족도 피처

| 피처명 | 타입 | 설명 | 계산 방법 |
|--------|------|------|----------|
| `avg_review_rating` | FLOAT | 평균 리뷰 평점 | `AVG(rating)` |
| `review_count` | INT | 작성 리뷰 수 | `COUNT(review_id)` |
| `last_review_rating` | INT | 마지막 리뷰 평점 | `rating ORDER BY review_date DESC LIMIT 1` |
| `low_rating_count` | INT | 저평점(1-3점) 리뷰 수 | `COUNT(review_id) WHERE rating <= 3` |
| `is_promoter` | BOOL | NPS 추천 고객 여부 | `avg_rating >= 5` |

#### 쿠폰 관련 피처

| 피처명 | 타입 | 설명 | 계산 방법 |
|--------|------|------|----------|
| `coupon_received_count` | INT | 받은 쿠폰 수 | `COUNT(coupon_id) WHERE user_id = ?` |
| `coupon_used_count` | INT | 사용한 쿠폰 수 | `COUNT(coupon_id) WHERE used = TRUE` |
| `coupon_usage_rate` | FLOAT | 쿠폰 사용률 | `coupon_used_count / coupon_received_count` |
| `days_since_last_coupon` | INT | 마지막 쿠폰 사용 이후 일수 | `today - last_coupon_used_date` |

#### 세그먼트 피처

| 피처명 | 타입 | 설명 | 계산 방법 |
|--------|------|------|----------|
| `rfm_segment` | CATEGORY | RFM 세그먼트 | 규칙 기반 분류 |
| `country` | CATEGORY | 국가 | `users.country` |
| `is_new_customer` | BOOL | 신규 고객 여부 | `frequency_total <= 1` |
| `is_vip` | BOOL | VIP 여부 | `monetary_total >= 500000` |

### 2.3 피처 중요도 예상

```
recency_days          ████████████████████ 0.25
order_trend_90d       ███████████████     0.18
frequency_90d         ████████████        0.15
avg_review_rating     ██████████          0.12
coupon_usage_rate     ████████            0.10
monetary_30d          ██████              0.08
avg_order_interval    █████               0.06
low_rating_count      ████                0.04
days_as_customer      ███                 0.02
```

---

## 3. GMV 예측 (GMV Forecast)

### 3.1 모델 개요

| 항목 | 내용 |
|------|------|
| **목적** | 일별/월별 GMV 예측 |
| **타겟 변수** | `daily_gmv_krw` |
| **예측 주기** | 매일 |
| **모델 후보** | Prophet, ARIMA, LSTM |

### 3.2 피처 목록

#### 시계열 피처

| 피처명 | 타입 | 설명 | 계산 방법 |
|--------|------|------|----------|
| `gmv_lag_1d` | DECIMAL | 전일 GMV | `gmv[t-1]` |
| `gmv_lag_7d` | DECIMAL | 7일 전 GMV | `gmv[t-7]` |
| `gmv_lag_30d` | DECIMAL | 30일 전 GMV | `gmv[t-30]` |
| `gmv_ma_7d` | DECIMAL | 7일 이동평균 | `AVG(gmv[t-7:t])` |
| `gmv_ma_30d` | DECIMAL | 30일 이동평균 | `AVG(gmv[t-30:t])` |
| `gmv_std_7d` | DECIMAL | 7일 표준편차 | `STDDEV(gmv[t-7:t])` |

#### 시즌성 피처

| 피처명 | 타입 | 설명 | 계산 방법 |
|--------|------|------|----------|
| `day_of_week` | INT | 요일 (0-6) | `EXTRACT(DOW FROM date)` |
| `is_weekend` | BOOL | 주말 여부 | `day_of_week IN (0, 6)` |
| `day_of_month` | INT | 일 (1-31) | `EXTRACT(DAY FROM date)` |
| `month` | INT | 월 (1-12) | `EXTRACT(MONTH FROM date)` |
| `quarter` | INT | 분기 (1-4) | `EXTRACT(QUARTER FROM date)` |
| `is_month_end` | BOOL | 월말 여부 | `day_of_month >= 25` |
| `is_holiday` | BOOL | 공휴일 여부 | 공휴일 캘린더 참조 |

#### 마케팅 피처

| 피처명 | 타입 | 설명 | 계산 방법 |
|--------|------|------|----------|
| `active_coupons` | INT | 활성 쿠폰 수 | `COUNT(coupon_id) WHERE is_active = TRUE` |
| `coupon_discount_total` | DECIMAL | 총 쿠폰 할인액 | `SUM(discount_amount)` |
| `new_coupon_issued` | INT | 신규 발행 쿠폰 수 | `COUNT(coupon_id) WHERE issue_date = today` |

#### 고객 피처

| 피처명 | 타입 | 설명 | 계산 방법 |
|--------|------|------|----------|
| `active_customers_7d` | INT | 7일 활성 고객 수 | `COUNT(DISTINCT user_id) WHERE order_date >= today-7` |
| `new_customers_7d` | INT | 7일 신규 고객 수 | `COUNT(user_id) WHERE first_order_date >= today-7` |
| `returning_customers_7d` | INT | 7일 재구매 고객 수 | `active_customers_7d - new_customers_7d` |

### 3.3 Prophet 특수 피처

```python
# Prophet 모델용 추가 피처
model.add_seasonality(
    name='weekly',
    period=7,
    fourier_order=3
)
model.add_seasonality(
    name='monthly',
    period=30.5,
    fourier_order=5
)
model.add_country_holidays(country_name='JP')
model.add_country_holidays(country_name='US')
```

---

## 4. LTV 예측 (Lifetime Value)

### 4.1 모델 개요

| 항목 | 내용 |
|------|------|
| **목적** | 고객 생애 가치 예측 |
| **타겟 변수** | `predicted_ltv_12m` (향후 12개월 예상 구매액) |
| **예측 주기** | 월 1회 |
| **모델 후보** | BG/NBD + Gamma-Gamma, XGBoost |

### 4.2 피처 목록

#### 구매 이력 피처

| 피처명 | 타입 | 설명 | 계산 방법 |
|--------|------|------|----------|
| `historical_ltv` | DECIMAL | 과거 총 구매액 | `SUM(total_gmv * 1350)` |
| `avg_order_value` | DECIMAL | 평균 주문 금액 | `AVG(total_gmv * 1350)` |
| `max_order_value` | DECIMAL | 최대 주문 금액 | `MAX(total_gmv * 1350)` |
| `order_value_std` | DECIMAL | 주문 금액 표준편차 | `STDDEV(total_gmv * 1350)` |
| `unique_artists_purchased` | INT | 구매한 작가 수 | `COUNT(DISTINCT artist_id)` |
| `unique_categories_purchased` | INT | 구매한 카테고리 수 | `COUNT(DISTINCT category)` |

#### BG/NBD 모델 피처

| 피처명 | 타입 | 설명 | 계산 방법 |
|--------|------|------|----------|
| `frequency` | INT | 반복 구매 횟수 | `COUNT(order_id) - 1` |
| `recency` | FLOAT | 첫 구매~마지막 구매 기간 (주) | `(last_order_date - first_order_date) / 7` |
| `T` | FLOAT | 고객 관측 기간 (주) | `(today - first_order_date) / 7` |
| `monetary_value` | DECIMAL | 평균 구매 금액 | `AVG(total_gmv * 1350)` |

### 4.3 LTV 계산 공식

```python
# BG/NBD + Gamma-Gamma 모델
from lifetimes import BetaGeoFitter, GammaGammaFitter

# 1. 구매 빈도 예측
bgf = BetaGeoFitter()
bgf.fit(
    frequency=data['frequency'],
    recency=data['recency'],
    T=data['T']
)

# 2. 예상 구매 횟수 (12개월)
predicted_purchases = bgf.predict(
    t=52,  # 52주 = 12개월
    frequency=data['frequency'],
    recency=data['recency'],
    T=data['T']
)

# 3. 평균 구매 금액 예측
ggf = GammaGammaFitter()
ggf.fit(
    frequency=data['frequency'],
    monetary_value=data['monetary_value']
)

# 4. LTV 계산
predicted_ltv = ggf.customer_lifetime_value(
    bgf,
    frequency=data['frequency'],
    recency=data['recency'],
    T=data['T'],
    monetary_value=data['monetary_value'],
    time=12,  # 12개월
    discount_rate=0.01  # 월 1% 할인율
)
```

---

## 5. 피처 엔지니어링 파이프라인

### 5.1 데이터 추출 쿼리

```sql
-- 고객별 피처 추출 쿼리
WITH customer_orders AS (
  SELECT 
    user_id,
    COUNT(*) as total_orders,
    SUM(total_gmv * 1350) as total_gmv_krw,
    AVG(total_gmv * 1350) as avg_order_value,
    MIN(order_date) as first_order_date,
    MAX(order_date) as last_order_date,
    CURRENT_DATE - MAX(order_date) as recency_days
  FROM orders
  GROUP BY user_id
),
customer_reviews AS (
  SELECT
    user_id,
    COUNT(*) as review_count,
    AVG(rating) as avg_rating,
    COUNT(CASE WHEN rating <= 3 THEN 1 END) as low_rating_count
  FROM reviews
  GROUP BY user_id
),
customer_coupons AS (
  SELECT
    user_id,
    COUNT(*) as coupon_received,
    COUNT(CASE WHEN used = TRUE THEN 1 END) as coupon_used
  FROM coupon_usage
  GROUP BY user_id
)
SELECT 
  o.*,
  COALESCE(r.review_count, 0) as review_count,
  COALESCE(r.avg_rating, 0) as avg_rating,
  COALESCE(r.low_rating_count, 0) as low_rating_count,
  COALESCE(c.coupon_received, 0) as coupon_received,
  COALESCE(c.coupon_used, 0) as coupon_used,
  COALESCE(c.coupon_used::float / NULLIF(c.coupon_received, 0), 0) as coupon_usage_rate
FROM customer_orders o
LEFT JOIN customer_reviews r ON o.user_id = r.user_id
LEFT JOIN customer_coupons c ON o.user_id = c.user_id;
```

### 5.2 피처 저장 스키마

```sql
-- ML 피처 저장 테이블
CREATE TABLE ml_customer_features (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  feature_date DATE NOT NULL,
  
  -- RFM 피처
  recency_days INT,
  frequency_total INT,
  frequency_30d INT,
  frequency_90d INT,
  monetary_total DECIMAL(15,2),
  monetary_avg DECIMAL(15,2),
  monetary_30d DECIMAL(15,2),
  
  -- 행동 피처
  avg_order_interval FLOAT,
  order_interval_std FLOAT,
  days_as_customer INT,
  order_trend_30d FLOAT,
  order_trend_90d FLOAT,
  
  -- 만족도 피처
  avg_review_rating FLOAT,
  review_count INT,
  last_review_rating INT,
  low_rating_count INT,
  
  -- 쿠폰 피처
  coupon_received_count INT,
  coupon_used_count INT,
  coupon_usage_rate FLOAT,
  
  -- 세그먼트 피처
  rfm_segment VARCHAR(50),
  country VARCHAR(10),
  is_new_customer BOOLEAN,
  is_vip BOOLEAN,
  
  -- 예측 결과 (모델 실행 후 업데이트)
  churn_probability FLOAT,
  predicted_ltv_12m DECIMAL(15,2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, feature_date)
);

CREATE INDEX idx_ml_features_user ON ml_customer_features(user_id);
CREATE INDEX idx_ml_features_date ON ml_customer_features(feature_date);
CREATE INDEX idx_ml_features_churn ON ml_customer_features(churn_probability);
```

---

## 6. 모델 평가 지표

### 6.1 이탈 예측 평가

| 지표 | 목표값 | 설명 |
|------|:------:|------|
| **AUC-ROC** | > 0.80 | 분류 성능 |
| **Precision** | > 0.70 | 이탈 예측 정확도 |
| **Recall** | > 0.75 | 실제 이탈 고객 탐지율 |
| **F1-Score** | > 0.72 | 정밀도-재현율 조화평균 |

### 6.2 GMV 예측 평가

| 지표 | 목표값 | 설명 |
|------|:------:|------|
| **MAPE** | < 15% | 평균 절대 백분율 오차 |
| **RMSE** | - | 평균 제곱근 오차 |
| **R²** | > 0.85 | 결정 계수 |

### 6.3 LTV 예측 평가

| 지표 | 목표값 | 설명 |
|------|:------:|------|
| **MAPE** | < 20% | 평균 절대 백분율 오차 |
| **Correlation** | > 0.80 | 실제 LTV와의 상관계수 |

---

## 7. 향후 확장

### 7.1 추가 예정 모델

| 모델 | 목적 | 예상 시점 |
|------|------|----------|
| **상품 추천** | 개인화 추천 | Phase 6 |
| **쿠폰 최적화** | 최적 쿠폰 매칭 | Phase 6 |
| **수요 예측** | 재고 최적화 | Phase 7 |
| **이상 탐지** | 사기 거래 탐지 | Phase 7 |

### 7.2 피처 스토어 고도화

```
향후 피처 스토어 아키텍처:

┌─────────────────────────────────────────────────────┐
│                   Feature Store                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Batch     │  │   Stream    │  │   On-demand │ │
│  │   Features  │  │   Features  │  │   Features  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│        │               │                 │         │
│        └───────────────┴─────────────────┘         │
│                        │                           │
│                        ▼                           │
│              ┌─────────────────┐                   │
│              │  Feature API    │                   │
│              └─────────────────┘                   │
│                        │                           │
│        ┌───────────────┼───────────────┐          │
│        ▼               ▼               ▼          │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐      │
│   │ Churn   │    │  GMV    │    │  LTV    │      │
│   │ Model   │    │ Forecast│    │ Model   │      │
│   └─────────┘    └─────────┘    └─────────┘      │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## 부록: 피처 요약 테이블

| 모델 | 피처 수 | 주요 피처 |
|------|:------:|----------|
| **이탈 예측** | 20+ | recency, frequency, rating, coupon_usage |
| **GMV 예측** | 15+ | lag, ma, seasonality, active_customers |
| **LTV 예측** | 12+ | frequency, recency, T, monetary_value |

