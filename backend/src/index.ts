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
app.use(express.json());

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

app.get('/api', (req, res) => {
  res.json({ message: 'Global Business Hub API' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

