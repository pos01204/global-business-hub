import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 시계열 분석 고도화 데이터 조회
 * GET /api/trend-analysis?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&countryFilter=all
 */
router.get('/', async (req, res) => {
  try {
    const startDate = (req.query.startDate as string) || '';
    const endDate = (req.query.endDate as string) || '';
    const countryFilter = (req.query.countryFilter as string) || 'all';

    if (!startDate || !endDate) {
      return res.status(400).json({ error: '시작일과 종료일이 필요합니다.' });
    }

    const USD_TO_KRW_RATE = 1350.0;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 데이터 로드
    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    const usersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.USERS, false);

    // 사용자 맵 생성
    const userMap = new Map<number, any>();
    usersData.forEach((row: any) => {
      const userId = parseInt(row.ID);
      if (!isNaN(userId)) {
        userMap.set(userId, row);
      }
    });

    // 날짜 필터링
    const filterByDate = (data: any[], start: Date, end: Date) => {
      return data.filter((row: any) => {
        try {
          if (!row || !row.order_created) return false;
          const orderDate = new Date(row.order_created);
          return !isNaN(orderDate.getTime()) && orderDate >= start && orderDate <= end;
        } catch (e) {
          return false;
        }
      });
    };

    let filteredData = filterByDate(logisticsData, start, end);

    // 국가 필터링
    if (countryFilter === 'jp') {
      filteredData = filteredData.filter((row: any) => row.country === 'JP');
    } else if (countryFilter === 'non_jp') {
      filteredData = filteredData.filter((row: any) => row.country !== 'JP');
    }

    const cleanAndParseFloat = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value.replace(/,/g, '')) || 0;
      return 0;
    };

    // 일별 데이터 집계
    const dailyData: Record<string, { gmv: number; orderCodes: Set<string> }> = {};
    let currentDate = new Date(start.getTime());
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyData[dateStr] = { gmv: 0, orderCodes: new Set<string>() };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    filteredData.forEach((row: any) => {
      try {
        const dateStr = new Date(row.order_created).toISOString().split('T')[0];
        if (dailyData[dateStr]) {
          const gmv = cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW_RATE;
          dailyData[dateStr].gmv += gmv;
          if (row.order_code) dailyData[dateStr].orderCodes.add(row.order_code);
        }
      } catch (e) {
        // 날짜 파싱 실패 시 무시
      }
    });

    const labels = Object.keys(dailyData).sort();
    const gmvValues = labels.map((label) => Math.round(dailyData[label].gmv));
    const orderValues = labels.map((label) => dailyData[label].orderCodes.size);

    // 이동평균 계산
    const calculateMA = (data: number[], period: number): (number | null)[] => {
      const ma: (number | null)[] = [];
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          ma.push(null);
        } else {
          const slice = data.slice(i - period + 1, i + 1);
          const avg = slice.reduce((a, b) => a + b, 0) / period;
          ma.push(Math.round(avg));
        }
      }
      return ma;
    };

    const gmvMA7 = calculateMA(gmvValues, 7);
    const ordersMA7 = calculateMA(orderValues, 7);

    // 통계 계산
    const calculateStats = (values: number[]) => {
      if (values.length === 0) {
        return { avg: 0, median: 0, stdDev: 0, min: 0, max: 0, cv: 0 };
      }

      const sorted = [...values].sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

      const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const cv = avg > 0 ? (stdDev / avg) * 100 : 0; // 변동계수 (%)

      return {
        avg: Math.round(avg),
        median: Math.round(median),
        stdDev: Math.round(stdDev),
        min: sorted[0],
        max: sorted[sorted.length - 1],
        cv: Math.round(cv * 10) / 10,
      };
    };

    const gmvStats = calculateStats(gmvValues);
    const orderStats = calculateStats(orderValues);

    // 트렌드 라인 계산 (선형 회귀)
    const calculateTrend = (values: number[]): { slope: number; intercept: number; trend: 'up' | 'down' | 'flat' } => {
      const n = values.length;
      if (n < 2) {
        return { slope: 0, intercept: 0, trend: 'flat' };
      }

      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumX2 = 0;

      values.forEach((y, i) => {
        const x = i;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      });

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      let trend: 'up' | 'down' | 'flat' = 'flat';
      if (Math.abs(slope) < 0.01) {
        trend = 'flat';
      } else if (slope > 0) {
        trend = 'up';
      } else {
        trend = 'down';
      }

      return { slope, intercept, trend };
    };

    const gmvTrend = calculateTrend(gmvValues);
    const orderTrend = calculateTrend(orderValues);

    // 트렌드 라인 데이터 생성
    const gmvTrendLine = labels.map((_, i) => {
      return gmvTrend.intercept + gmvTrend.slope * i;
    });
    const orderTrendLine = labels.map((_, i) => {
      return orderTrend.intercept + orderTrend.slope * i;
    });

    // 계절성 분석 (요일별)
    const weekdayData: Record<number, { gmv: number; orders: number; count: number }> = {};
    labels.forEach((label, index) => {
      const date = new Date(label);
      const weekday = date.getDay(); // 0 = 일요일, 6 = 토요일
      if (!weekdayData[weekday]) {
        weekdayData[weekday] = { gmv: 0, orders: 0, count: 0 };
      }
      weekdayData[weekday].gmv += gmvValues[index];
      weekdayData[weekday].orders += orderValues[index];
      weekdayData[weekday].count++;
    });

    const weekdayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const weekdayStats = Object.entries(weekdayData).map(([day, data]) => ({
      weekday: weekdayNames[parseInt(day)],
      weekdayNum: parseInt(day),
      avgGmv: Math.round(data.gmv / data.count),
      avgOrders: Math.round((data.orders / data.count) * 10) / 10,
      count: data.count,
    })).sort((a, b) => a.weekdayNum - b.weekdayNum);

    // 계절성 분석 (월별)
    const monthlyData: Record<string, { gmv: number; orders: number; count: number }> = {};
    labels.forEach((label, index) => {
      const date = new Date(label);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[month]) {
        monthlyData[month] = { gmv: 0, orders: 0, count: 0 };
      }
      monthlyData[month].gmv += gmvValues[index];
      monthlyData[month].orders += orderValues[index];
      monthlyData[month].count++;
    });

    const monthlyStats = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      avgGmv: Math.round(data.gmv / data.count),
      avgOrders: Math.round((data.orders / data.count) * 10) / 10,
      count: data.count,
    })).sort((a, b) => a.month.localeCompare(b.month));

    // 예측 (간단한 선형 추세 기반)
    const forecastDays = 7;
    const forecastLabels: string[] = [];
    const forecastGmv: number[] = [];
    const forecastOrders: number[] = [];

    const lastIndex = labels.length - 1;
    for (let i = 1; i <= forecastDays; i++) {
      const futureDate = new Date(end);
      futureDate.setDate(futureDate.getDate() + i);
      forecastLabels.push(futureDate.toISOString().split('T')[0]);
      forecastGmv.push(Math.max(0, Math.round(gmvTrend.intercept + gmvTrend.slope * (lastIndex + i))));
      forecastOrders.push(Math.max(0, Math.round(orderTrend.intercept + orderTrend.slope * (lastIndex + i))));
    }

    res.json({
      daily: {
        labels,
        gmv: gmvValues,
        orders: orderValues,
        gmvMA7,
        ordersMA7,
        gmvTrendLine,
        orderTrendLine,
      },
      stats: {
        gmv: gmvStats,
        orders: orderStats,
      },
      trends: {
        gmv: gmvTrend,
        orders: orderTrend,
      },
      seasonality: {
        weekday: weekdayStats,
        monthly: monthlyStats,
      },
      forecast: {
        labels: forecastLabels,
        gmv: forecastGmv,
        orders: forecastOrders,
      },
      dateRange: {
        start: startDate,
        end: endDate,
        days: Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      },
    });
  } catch (error: any) {
    console.error('[Trend Analysis] 오류:', error);
    res.status(500).json({
      error: '시계열 분석 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

export default router;






