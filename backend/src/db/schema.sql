-- ============================================================
-- Global Business Hub - 데이터베이스 스키마
-- Phase 2: 1차 가공 데이터 (L1) 테이블 정의
-- ============================================================
-- 생성일: 2024-12-17
-- 버전: 1.0
-- ============================================================

-- 데이터베이스 생성 (수동 실행 필요)
-- CREATE DATABASE global_business_hub;

-- ============================================================
-- 1. 일별 기본 지표 테이블 (daily_metrics)
-- ============================================================
-- 용도: 주문, 매출, 고객 관련 일별 집계 데이터
-- 갱신 주기: 매일 12:00 KST (전일 데이터 집계)

CREATE TABLE IF NOT EXISTS daily_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  
  -- 주문 지표
  order_count INT DEFAULT 0,
  total_gmv_krw DECIMAL(15,2) DEFAULT 0,
  total_gmv_usd DECIMAL(15,2) DEFAULT 0,
  avg_aov DECIMAL(15,2) DEFAULT 0,
  item_count INT DEFAULT 0,
  
  -- 고객 지표
  unique_customers INT DEFAULT 0,
  new_customers INT DEFAULT 0,
  returning_customers INT DEFAULT 0,
  
  -- 상품/작가 지표
  unique_artists INT DEFAULT 0,
  unique_products INT DEFAULT 0,
  
  -- 국가별 분리 (JP)
  jp_order_count INT DEFAULT 0,
  jp_gmv_krw DECIMAL(15,2) DEFAULT 0,
  jp_gmv_usd DECIMAL(15,2) DEFAULT 0,
  jp_unique_customers INT DEFAULT 0,
  
  -- 국가별 분리 (EN - 영어권)
  en_order_count INT DEFAULT 0,
  en_gmv_krw DECIMAL(15,2) DEFAULT 0,
  en_gmv_usd DECIMAL(15,2) DEFAULT 0,
  en_unique_customers INT DEFAULT 0,
  
  -- 배송 지표
  delivery_completed_count INT DEFAULT 0,
  delivery_rate DECIMAL(5,2) DEFAULT 0,
  
  -- 메타데이터
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date_desc ON daily_metrics(date DESC);

-- ============================================================
-- 2. 일별 리뷰 지표 테이블 (daily_review_metrics)
-- ============================================================
-- 용도: 리뷰 관련 일별 집계 데이터
-- 갱신 주기: 매일 12:00 KST (전일 데이터 집계)

CREATE TABLE IF NOT EXISTS daily_review_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  
  -- 기본 지표
  review_count INT DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  
  -- 평점별 분포
  rating_1 INT DEFAULT 0,
  rating_2 INT DEFAULT 0,
  rating_3 INT DEFAULT 0,
  rating_4 INT DEFAULT 0,
  rating_5 INT DEFAULT 0,
  
  -- NPS 관련
  promoters INT DEFAULT 0,      -- 5점
  passives INT DEFAULT 0,       -- 4점
  detractors INT DEFAULT 0,     -- 1~3점
  nps_score DECIMAL(5,2) DEFAULT 0,
  
  -- 국가별 (JP)
  jp_review_count INT DEFAULT 0,
  jp_avg_rating DECIMAL(3,2) DEFAULT 0,
  
  -- 국가별 (EN)
  en_review_count INT DEFAULT 0,
  en_avg_rating DECIMAL(3,2) DEFAULT 0,
  
  -- 메타데이터
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_review_metrics_date ON daily_review_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_review_metrics_date_desc ON daily_review_metrics(date DESC);

-- ============================================================
-- 3. 일별 쿠폰 지표 테이블 (daily_coupon_metrics)
-- ============================================================
-- 용도: 쿠폰 관련 일별 집계 데이터
-- 갱신 주기: 매일 12:00 KST (전일 데이터 집계)

CREATE TABLE IF NOT EXISTS daily_coupon_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  
  -- 기본 지표
  active_coupons INT DEFAULT 0,
  issued_count INT DEFAULT 0,
  used_count INT DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  
  -- 금액 지표
  total_discount_usd DECIMAL(15,2) DEFAULT 0,
  total_discount_krw DECIMAL(15,2) DEFAULT 0,
  total_gmv_usd DECIMAL(15,2) DEFAULT 0,
  total_gmv_krw DECIMAL(15,2) DEFAULT 0,
  roi DECIMAL(10,2) DEFAULT 0,
  
  -- 유형별 (RATE - 정률 할인)
  rate_issued INT DEFAULT 0,
  rate_used INT DEFAULT 0,
  rate_discount_usd DECIMAL(15,2) DEFAULT 0,
  
  -- 유형별 (FIXED - 정액 할인)
  fixed_issued INT DEFAULT 0,
  fixed_used INT DEFAULT 0,
  fixed_discount_usd DECIMAL(15,2) DEFAULT 0,
  
  -- 국가별 (JP)
  jp_issued INT DEFAULT 0,
  jp_used INT DEFAULT 0,
  jp_gmv_usd DECIMAL(15,2) DEFAULT 0,
  
  -- 국가별 (EN)
  en_issued INT DEFAULT 0,
  en_used INT DEFAULT 0,
  en_gmv_usd DECIMAL(15,2) DEFAULT 0,
  
  -- 메타데이터
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_coupon_metrics_date ON daily_coupon_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_coupon_metrics_date_desc ON daily_coupon_metrics(date DESC);

-- ============================================================
-- 4. 배치 Job 로그 테이블 (batch_job_logs)
-- ============================================================
-- 용도: 배치 Job 실행 이력 및 상태 추적
-- 갱신 주기: 배치 Job 실행 시

CREATE TABLE IF NOT EXISTS batch_job_logs (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  target_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'RUNNING', -- RUNNING, SUCCESS, FAILED
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INT,
  records_processed INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_batch_job_logs_job_name ON batch_job_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_batch_job_logs_target_date ON batch_job_logs(target_date);
CREATE INDEX IF NOT EXISTS idx_batch_job_logs_status ON batch_job_logs(status);

-- ============================================================
-- 5. 집계 상태 테이블 (aggregation_status)
-- ============================================================
-- 용도: 날짜별 집계 완료 상태 추적
-- 갱신 주기: 배치 Job 완료 시

CREATE TABLE IF NOT EXISTS aggregation_status (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  aggregation_type VARCHAR(50) NOT NULL, -- 'metrics', 'review', 'coupon'
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(date, aggregation_type)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_aggregation_status_date ON aggregation_status(date);
CREATE INDEX IF NOT EXISTS idx_aggregation_status_type ON aggregation_status(aggregation_type);

-- ============================================================
-- 트리거: updated_at 자동 갱신
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- daily_metrics
DROP TRIGGER IF EXISTS update_daily_metrics_updated_at ON daily_metrics;
CREATE TRIGGER update_daily_metrics_updated_at
    BEFORE UPDATE ON daily_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- daily_review_metrics
DROP TRIGGER IF EXISTS update_daily_review_metrics_updated_at ON daily_review_metrics;
CREATE TRIGGER update_daily_review_metrics_updated_at
    BEFORE UPDATE ON daily_review_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- daily_coupon_metrics
DROP TRIGGER IF EXISTS update_daily_coupon_metrics_updated_at ON daily_coupon_metrics;
CREATE TRIGGER update_daily_coupon_metrics_updated_at
    BEFORE UPDATE ON daily_coupon_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- aggregation_status
DROP TRIGGER IF EXISTS update_aggregation_status_updated_at ON aggregation_status;
CREATE TRIGGER update_aggregation_status_updated_at
    BEFORE UPDATE ON aggregation_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Phase 3: 2차 가공 데이터 테이블 (L2)
-- ============================================================

-- 6. 쿠폰 분석 테이블 (analytics_coupon)
-- ============================================================
-- 용도: 기간별 쿠폰 성과 분석 데이터
-- 갱신 주기: 주간/월간 또는 온디맨드

CREATE TABLE IF NOT EXISTS analytics_coupon (
  id SERIAL PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- 전체 지표
  total_coupons INT DEFAULT 0,
  total_issued INT DEFAULT 0,
  total_used INT DEFAULT 0,
  overall_conversion_rate DECIMAL(5,4) DEFAULT 0,
  total_discount_usd DECIMAL(15,2) DEFAULT 0,
  total_discount_krw DECIMAL(15,2) DEFAULT 0,
  total_gmv_usd DECIMAL(15,2) DEFAULT 0,
  total_gmv_krw DECIMAL(15,2) DEFAULT 0,
  overall_roi DECIMAL(10,2) DEFAULT 0,
  
  -- 유형별 분석 (JSONB)
  by_discount_type JSONB,      -- { "RATE": {...}, "FIXED": {...} }
  by_coupon_type JSONB,        -- { "idus": {...}, "CRM": {...}, "Sodam": {...} }
  by_country JSONB,            -- { "JP": {...}, "EN": {...} }
  
  -- 랭킹 (JSONB)
  top_by_conversion JSONB,     -- [{ couponId, name, rate, gmv }, ...]
  top_by_roi JSONB,
  top_by_gmv JSONB,
  failed_coupons JSONB,        -- 전환율 0% 쿠폰
  
  -- 자동 인사이트 (JSONB)
  insights JSONB,              -- [{ type, message, action }, ...]
  
  -- 메타데이터
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(period_start, period_end)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_analytics_coupon_period ON analytics_coupon(period_start, period_end);

-- 7. 고객 분석 테이블 (analytics_customer)
-- ============================================================
-- 용도: 기간별 고객 세그먼트 및 NPS 분석
-- 갱신 주기: 주간/월간 또는 온디맨드

CREATE TABLE IF NOT EXISTS analytics_customer (
  id SERIAL PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- NPS 지표
  nps_score INT DEFAULT 0,
  promoters_count INT DEFAULT 0,
  promoters_pct DECIMAL(5,2) DEFAULT 0,
  passives_count INT DEFAULT 0,
  passives_pct DECIMAL(5,2) DEFAULT 0,
  detractors_count INT DEFAULT 0,
  detractors_pct DECIMAL(5,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  
  -- RFM 요약 (JSONB)
  rfm_summary JSONB,           -- { "champions": {...}, "loyalCustomers": {...}, ... }
  
  -- 코호트 리텐션 (JSONB)
  cohort_retention JSONB,      -- { "2024-01": [100, 45, 32, ...], ... }
  
  -- 세그먼트 이동
  segment_upgrades INT DEFAULT 0,
  segment_downgrades INT DEFAULT 0,
  
  -- 국가별 분석 (JSONB)
  by_country JSONB,            -- { "JP": {...}, "EN": {...} }
  
  -- 자동 인사이트 (JSONB)
  insights JSONB,              -- [{ type, message, action }, ...]
  
  -- 메타데이터
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(period_start, period_end)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_analytics_customer_period ON analytics_customer(period_start, period_end);

-- 8. 주문 패턴 분석 테이블 (analytics_order_patterns)
-- ============================================================
-- 용도: 기간별 주문 패턴 및 트렌드 분석
-- 갱신 주기: 주간/월간 또는 온디맨드

CREATE TABLE IF NOT EXISTS analytics_order_patterns (
  id SERIAL PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- 요일별 패턴 (JSONB)
  day_of_week_pattern JSONB,   -- { "monday": {...}, "tuesday": {...}, ... }
  peak_day VARCHAR(20),
  
  -- 시간대별 패턴 (JSONB)
  hour_pattern JSONB,          -- { "0": {...}, "1": {...}, ... "23": {...} }
  peak_hour INT,
  
  -- 분기별 패턴 (JSONB)
  quarterly_pattern JSONB,     -- { "Q1": {...}, "Q2": {...}, ... }
  peak_quarter VARCHAR(10),
  
  -- 트렌드 (JSONB)
  gmv_trend_7d JSONB,          -- [{ date, value }, ...]
  gmv_trend_30d JSONB,
  order_trend_7d JSONB,
  order_trend_30d JSONB,
  
  -- 국가별 패턴 차이 (JSONB)
  country_pattern_diff JSONB,
  
  -- 이동평균 (JSONB)
  moving_average_7d JSONB,
  moving_average_30d JSONB,
  
  -- 자동 인사이트 (JSONB)
  insights JSONB,
  
  -- 메타데이터
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(period_start, period_end)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_analytics_order_patterns_period ON analytics_order_patterns(period_start, period_end);

-- 트리거 (Phase 3 테이블)
DROP TRIGGER IF EXISTS update_analytics_coupon_updated_at ON analytics_coupon;
CREATE TRIGGER update_analytics_coupon_updated_at
    BEFORE UPDATE ON analytics_coupon
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_analytics_customer_updated_at ON analytics_customer;
CREATE TRIGGER update_analytics_customer_updated_at
    BEFORE UPDATE ON analytics_customer
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_analytics_order_patterns_updated_at ON analytics_order_patterns;
CREATE TRIGGER update_analytics_order_patterns_updated_at
    BEFORE UPDATE ON analytics_order_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 초기 데이터 (선택사항)
-- ============================================================

-- 테스트용 더미 데이터 (필요 시 주석 해제)
-- INSERT INTO daily_metrics (date, order_count, total_gmv_krw) 
-- VALUES ('2024-12-16', 100, 15000000);

