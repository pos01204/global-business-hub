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
-- Phase 5: 예측 및 자동화 테이블 (L3+)
-- ============================================================
-- 용도: ML 예측 결과, 추천, 자동화 규칙 저장
-- 주의: 실제 ML 모델 구현은 향후 Phase에서 진행
-- ============================================================

-- 5.1 예측 결과 테이블 (predictions)
-- 용도: 이탈 예측, GMV 예측, LTV 예측 등 ML 모델 결과 저장
CREATE TABLE IF NOT EXISTS predictions (
  id SERIAL PRIMARY KEY,
  prediction_type VARCHAR(50) NOT NULL,     -- 'churn', 'gmv', 'ltv', 'demand'
  entity_type VARCHAR(50) NOT NULL,         -- 'customer', 'artist', 'product', 'overall'
  entity_id VARCHAR(100),                   -- 개별 엔티티 ID (nullable for overall)
  
  -- 예측 값
  predicted_value DECIMAL(15,4),            -- 예측된 값
  confidence DECIMAL(5,4),                  -- 예측 신뢰도 (0~1)
  
  -- 예측 상세
  prediction_date DATE NOT NULL,            -- 예측 생성일
  target_date DATE,                         -- 예측 대상 날짜 (GMV 예측 등)
  horizon_days INT,                         -- 예측 기간 (일 단위)
  
  -- 모델 정보
  model_version VARCHAR(50),                -- 모델 버전
  model_type VARCHAR(50),                   -- 'ensemble', 'xgboost', 'arima', 'prophet'
  features_used JSONB,                      -- 사용된 피처 목록
  
  -- 예측 분류 (이탈 예측용)
  risk_level VARCHAR(20),                   -- 'high', 'medium', 'low'
  risk_score DECIMAL(5,4),                  -- 위험 점수 (0~1)
  
  -- 예측 근거
  top_factors JSONB,                        -- 주요 영향 요인 [{ factor, importance, value }]
  explanation TEXT,                         -- 자연어 설명
  
  -- 메타데이터
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_predictions_type ON predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictions_entity ON predictions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_predictions_risk ON predictions(risk_level);

-- 5.2 추천 테이블 (recommendations)
-- 용도: 고객별 상품 추천, 쿠폰 추천, 액션 추천 등
CREATE TABLE IF NOT EXISTS recommendations (
  id SERIAL PRIMARY KEY,
  recommendation_type VARCHAR(50) NOT NULL, -- 'product', 'coupon', 'action', 'artist'
  target_type VARCHAR(50) NOT NULL,         -- 'customer', 'segment', 'all'
  target_id VARCHAR(100),                   -- 대상 ID (고객 ID, 세그먼트 명 등)
  
  -- 추천 내용
  recommended_items JSONB NOT NULL,         -- [{ item_id, score, reason }]
  strategy VARCHAR(100),                    -- 추천 전략 (collaborative, content-based, hybrid)
  
  -- 추천 상세
  recommendation_date DATE NOT NULL,        -- 추천 생성일
  valid_until DATE,                         -- 유효 기간
  priority INT DEFAULT 0,                   -- 우선순위
  
  -- 성과 추적
  impressions INT DEFAULT 0,                -- 노출 수
  clicks INT DEFAULT 0,                     -- 클릭 수
  conversions INT DEFAULT 0,                -- 전환 수
  revenue_attributed DECIMAL(15,2) DEFAULT 0, -- 기여 매출
  
  -- 모델 정보
  model_version VARCHAR(50),
  confidence DECIMAL(5,4),
  
  -- 메타데이터
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_target ON recommendations(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_date ON recommendations(recommendation_date);
CREATE INDEX IF NOT EXISTS idx_recommendations_active ON recommendations(is_active);

-- 5.3 자동화 규칙 테이블 (automation_rules)
-- 용도: 자동 쿠폰 발송, 알림, 액션 트리거 등
CREATE TABLE IF NOT EXISTS automation_rules (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(200) NOT NULL,          -- 규칙 이름
  rule_type VARCHAR(50) NOT NULL,           -- 'coupon_trigger', 'alert', 'notification', 'action'
  
  -- 트리거 조건
  trigger_conditions JSONB NOT NULL,        -- { metric, operator, threshold, segment }
  trigger_schedule VARCHAR(50),             -- cron 표현식 (예: '0 9 * * *')
  
  -- 실행 액션
  action_type VARCHAR(50) NOT NULL,         -- 'send_coupon', 'send_email', 'create_task', 'api_call'
  action_params JSONB NOT NULL,             -- 액션 파라미터
  
  -- 대상
  target_segment VARCHAR(100),              -- 대상 세그먼트
  target_query TEXT,                        -- 대상 쿼리 (고급)
  
  -- 제한
  max_executions_per_day INT DEFAULT 1,     -- 일일 최대 실행 횟수
  cooldown_hours INT DEFAULT 24,            -- 재실행 대기 시간
  budget_limit DECIMAL(15,2),               -- 예산 제한 (쿠폰 발송 등)
  
  -- 상태
  is_enabled BOOLEAN DEFAULT FALSE,         -- 활성화 여부
  last_executed_at TIMESTAMP,               -- 마지막 실행 시간
  execution_count INT DEFAULT 0,            -- 총 실행 횟수
  
  -- 성과 추적
  total_affected_users INT DEFAULT 0,       -- 영향 받은 사용자 수
  total_revenue_impact DECIMAL(15,2) DEFAULT 0, -- 매출 영향
  
  -- 메타데이터
  created_by VARCHAR(100),                  -- 생성자
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_automation_rules_type ON automation_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(is_enabled);
CREATE INDEX IF NOT EXISTS idx_automation_rules_schedule ON automation_rules(trigger_schedule);

-- 5.4 자동화 실행 로그 테이블 (automation_logs)
-- 용도: 자동화 규칙 실행 이력 추적
CREATE TABLE IF NOT EXISTS automation_logs (
  id SERIAL PRIMARY KEY,
  rule_id INT REFERENCES automation_rules(id),
  
  -- 실행 정보
  executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  execution_status VARCHAR(20) NOT NULL,    -- 'success', 'failed', 'partial'
  
  -- 결과
  affected_count INT DEFAULT 0,             -- 영향 받은 대상 수
  result_summary JSONB,                     -- 실행 결과 요약
  error_message TEXT,                       -- 오류 메시지 (실패 시)
  
  -- 성과 (추후 업데이트)
  tracked_conversions INT DEFAULT 0,
  tracked_revenue DECIMAL(15,2) DEFAULT 0
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule ON automation_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_date ON automation_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_logs(execution_status);

-- 트리거 (Phase 5 테이블)
DROP TRIGGER IF EXISTS update_predictions_updated_at ON predictions;
CREATE TRIGGER update_predictions_updated_at
    BEFORE UPDATE ON predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recommendations_updated_at ON recommendations;
CREATE TRIGGER update_recommendations_updated_at
    BEFORE UPDATE ON recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_automation_rules_updated_at ON automation_rules;
CREATE TRIGGER update_automation_rules_updated_at
    BEFORE UPDATE ON automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 초기 데이터 (선택사항)
-- ============================================================

-- 테스트용 더미 데이터 (필요 시 주석 해제)
-- INSERT INTO daily_metrics (date, order_count, total_gmv_krw) 
-- VALUES ('2024-12-16', 100, 15000000);

-- 예시 자동화 규칙 (이탈 위험 고객 쿠폰 발송)
-- INSERT INTO automation_rules (
--   rule_name, rule_type, 
--   trigger_conditions, trigger_schedule,
--   action_type, action_params,
--   target_segment, is_enabled
-- ) VALUES (
--   '이탈 위험 고객 쿠폰 발송',
--   'coupon_trigger',
--   '{"metric": "churn_risk", "operator": ">=", "threshold": 0.7}',
--   '0 9 * * *',
--   'send_coupon',
--   '{"coupon_type": "retention", "discount_rate": 15, "valid_days": 7}',
--   'high_risk_churn',
--   false
-- );

