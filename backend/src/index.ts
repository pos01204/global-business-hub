import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { resolve } from 'path';
import dashboardRoutes from './routes/dashboard';
import unreceivedRoutes from './routes/unreceived';
import logisticsRoutes from './routes/logistics';
import controlTowerRoutes from './routes/control-tower';
import analyticsRoutes from './routes/analytics';
import lookupRoutes from './routes/lookup';
import orderRoutes from './routes/order';
import customerRoutes from './routes/customer';
import artistRoutes from './routes/artist';
import customersRoutes from './routes/customers';
import marketerRoutes from './routes/marketer';
import marketerContentRoutes from './routes/marketer-content';
import marketerCampaignRoutes from './routes/marketer-campaign';
import marketerPerformanceRoutes from './routes/marketer-performance';
import marketerTestRoutes from './routes/marketer-test';
import marketerMaterialsRoutes from './routes/marketer-materials';
import chatRoutes from './routes/chat';
import logisticsPerformanceRoutes from './routes/logistics-performance';
import comparisonRoutes from './routes/comparison';
import trendAnalysisRoutes from './routes/trend-analysis';
import qcRoutes from './routes/qc';
import settlementRoutes from './routes/settlement';
import costAnalysisRoutes from './routes/cost-analysis';
import sopoReceiptRoutes from './routes/sopo-receipt';
import reviewsRoutes from './routes/reviews';
import slackRoutes from './routes/slack';
import customerAnalyticsRoutes from './routes/customer-analytics';
import calendarRoutes from './routes/calendarRoutes';
import artistAnalyticsRoutes from './routes/artist-analytics';
import businessBrainRoutes from './routes/business-brain';
import notionRoutes from './routes/notion';
import adminRoutes from './routes/admin';
import metricsRoutes from './routes/metrics';
import couponAnalyticsRoutes from './routes/couponAnalytics';
import reviewAnalyticsRoutes from './routes/reviewAnalytics';
import { startScheduler } from './jobs/dailyAggregation';

// .env 파일 로드 (backend 폴더 기준)
let envPath: string;
if (process.cwd().endsWith('backend')) {
  envPath = resolve(process.cwd(), '.env');
} else {
  envPath = resolve(process.cwd(), 'backend', '.env');
}
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// CORS 설정: 프로덕션에서는 특정 도메인만 허용, 개발 환경에서는 모든 도메인 허용
const corsOptions = {
  origin: process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : process.env.NODE_ENV === 'production' 
      ? false // 프로덕션에서는 FRONTEND_URL 필수
      : '*', // 개발 환경에서는 모든 도메인 허용
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Slack 서명 검증을 위한 raw body 저장
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Slack 명령어는 URL-encoded form data로 전송됨
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Global Business Hub API is running' });
});

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/unreceived', unreceivedRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/control-tower', controlTowerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/artist', artistRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/marketer', marketerRoutes);
app.use('/api/marketer/content', marketerContentRoutes);
app.use('/api/marketer/campaigns', marketerCampaignRoutes);
app.use('/api/marketer/performance', marketerPerformanceRoutes);
app.use('/api/marketer', marketerTestRoutes); // 테스트 라우트
app.use('/api/marketer/materials', marketerMaterialsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/logistics-performance', logisticsPerformanceRoutes);
app.use('/api/comparison', comparisonRoutes);
app.use('/api/trend-analysis', trendAnalysisRoutes);
app.use('/api/qc', qcRoutes);
console.log('[Server] QC 라우터 등록 완료: /api/qc');
app.use('/api/settlement', settlementRoutes);
console.log('[Server] Settlement 라우터 등록 완료: /api/settlement');
app.use('/api/cost-analysis', costAnalysisRoutes);
console.log('[Server] Cost Analysis 라우터 등록 완료: /api/cost-analysis');
app.use('/api/sopo-receipt', sopoReceiptRoutes);
console.log('[Server] Sopo Receipt 라우터 등록 완료: /api/sopo-receipt');
app.use('/api/reviews', reviewsRoutes);
console.log('[Server] Reviews 라우터 등록 완료: /api/reviews');
app.use('/api/slack', slackRoutes);
console.log('[Server] Slack 라우터 등록 완료: /api/slack');
app.use('/api/customer-analytics', customerAnalyticsRoutes);
console.log('[Server] Customer Analytics 라우터 등록 완료: /api/customer-analytics');
app.use('/api/calendar', calendarRoutes);
console.log('[Server] Calendar 라우터 등록 완료: /api/calendar');
app.use('/api/artist-analytics', artistAnalyticsRoutes);
console.log('[Server] Artist Analytics 라우터 등록 완료: /api/artist-analytics');
app.use('/api/business-brain', businessBrainRoutes);
console.log('[Server] Business Brain 라우터 등록 완료: /api/business-brain');
app.use('/api/notion', notionRoutes);
console.log('[Server] Notion 라우터 등록 완료: /api/notion');

// Phase 2: 관리자 API (수동 집계 트리거, 배치 Job 관리)
app.use('/api/admin', adminRoutes);
console.log('[Server] Admin 라우터 등록 완료: /api/admin');

// Phase 2: 집계 데이터 조회 API (1차 가공 데이터)
app.use('/api/metrics', metricsRoutes);
console.log('[Server] Metrics 라우터 등록 완료: /api/metrics');

// Phase 3: 2차 가공 분석 API
app.use('/api/coupon-analytics', couponAnalyticsRoutes);
console.log('[Server] Coupon Analytics 라우터 등록 완료: /api/coupon-analytics');

app.use('/api/review-analytics', reviewAnalyticsRoutes);
console.log('[Server] Review Analytics 라우터 등록 완료: /api/review-analytics');

app.get('/api', (req, res) => {
  res.json({ message: 'Global Business Hub API' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  
  // Phase 2: 배치 Job 스케줄러 시작 (DB 연결 시에만)
  if (process.env.DB_HOST) {
    startScheduler();
    console.log('[Server] 배치 Job 스케줄러 시작됨 (12:00 KST)');
  } else {
    console.log('[Server] DB 환경 변수 미설정 - 배치 Job 스케줄러 비활성화');
  }
});

