/**
 * 비용 분석 & 손익 시뮬레이션 API 라우트
 */

import { Router, Request, Response } from 'express';
import costAnalysisService, {
  SimulationInput,
  getAllAvailableRates,
  getCountryList,
  getShippingPolicies,
  getCarrierList,
} from '../services/costAnalysisService';
import {
  COUNTRY_TIERS,
  SHIPPING_POLICIES,
  EXCHANGE_RATES,
  CarrierType,
} from '../config/shippingRates';
import GoogleSheetsService from '../services/googleSheets';

const router = Router();

// Google Sheets 서비스 초기화
const sheetsService = new GoogleSheetsService({
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
  clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL || '',
  privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY || '',
});

/**
 * 손익 대시보드 데이터 조회
 * GET /api/cost-analysis/dashboard
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 기본 기간: 최근 30일
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate 
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Google Sheets에서 주문 데이터 조회
    const ordersData = await sheetsService.getSheetDataAsJson('orders', false);
    const logisticsData = await sheetsService.getSheetDataAsJson('logistics', true);
    
    // 기간 필터링
    const filteredOrders = ordersData.filter((order: any) => {
      const orderDate = new Date(order.order_date || order.created_at);
      return orderDate >= start && orderDate <= end;
    });
    
    // 국가별 집계
    const countryStats: Record<string, {
      orderCount: number;
      totalGMV: number;
      totalLogisticsCost: number;
      customerShippingRevenue: number;
    }> = {};
    
    // 일별 집계
    const dailyStats: Record<string, {
      gmv: number;
      logisticsCost: number;
      orderCount: number;
    }> = {};
    
    let totalGMV = 0;
    let totalLogisticsCost = 0;
    let totalCustomerShipping = 0;
    
    for (const order of filteredOrders) {
      const country = order.country || order.shipping_country || 'JP';
      const gmv = parseFloat(order.total_price || order.gmv || 0);
      const orderDate = new Date(order.order_date || order.created_at);
      const dateKey = orderDate.toISOString().split('T')[0];
      
      // 물류비 추정 (실제 데이터가 있으면 사용, 없으면 추정)
      const logistics = logisticsData.find((l: any) => l.order_code === order.order_code);
      let logisticsCost = 0;
      
      if (logistics && logistics.shipping_cost) {
        logisticsCost = parseFloat(logistics.shipping_cost);
      } else {
        // 추정: 국가별 평균 운임 적용
        const countryInfo = COUNTRY_TIERS[country];
        const tier = countryInfo?.tier || 4;
        logisticsCost = tier === 1 ? 8000 : tier === 2 ? 15000 : tier === 3 ? 35000 : 45000;
      }
      
      // 고객 배송비 수입
      const countryInfo = COUNTRY_TIERS[country];
      const tier = countryInfo?.tier || 4;
      const policy = SHIPPING_POLICIES[tier as 1 | 2 | 3 | 4];
      const priceUSD = gmv / EXCHANGE_RATES['USD'];
      const isFreeShipping = priceUSD >= policy.freeShippingThresholdUSD;
      const customerShipping = isFreeShipping ? 0 : policy.customerShippingFeeUSD * EXCHANGE_RATES['USD'];
      
      // 집계
      totalGMV += gmv;
      totalLogisticsCost += logisticsCost;
      totalCustomerShipping += customerShipping;
      
      // 국가별
      if (!countryStats[country]) {
        countryStats[country] = {
          orderCount: 0,
          totalGMV: 0,
          totalLogisticsCost: 0,
          customerShippingRevenue: 0,
        };
      }
      countryStats[country].orderCount++;
      countryStats[country].totalGMV += gmv;
      countryStats[country].totalLogisticsCost += logisticsCost;
      countryStats[country].customerShippingRevenue += customerShipping;
      
      // 일별
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { gmv: 0, logisticsCost: 0, orderCount: 0 };
      }
      dailyStats[dateKey].gmv += gmv;
      dailyStats[dateKey].logisticsCost += logisticsCost;
      dailyStats[dateKey].orderCount++;
    }
    
    const orderCount = filteredOrders.length;
    const netLogisticsCost = totalLogisticsCost - totalCustomerShipping;
    const grossProfit = totalGMV - netLogisticsCost;
    
    // Tier별 집계
    const tierStats: Record<number, { orderCount: number; gmv: number; logisticsCost: number }> = {
      1: { orderCount: 0, gmv: 0, logisticsCost: 0 },
      2: { orderCount: 0, gmv: 0, logisticsCost: 0 },
      3: { orderCount: 0, gmv: 0, logisticsCost: 0 },
      4: { orderCount: 0, gmv: 0, logisticsCost: 0 },
    };
    
    // 국가별 분석 결과 생성
    const byCountry = Object.entries(countryStats).map(([country, stats]) => {
      const countryInfo = COUNTRY_TIERS[country] || { tier: 4, name: country, code: country };
      const tier = countryInfo.tier;
      
      tierStats[tier].orderCount += stats.orderCount;
      tierStats[tier].gmv += stats.totalGMV;
      tierStats[tier].logisticsCost += stats.totalLogisticsCost;
      
      const logisticsGap = stats.totalLogisticsCost - stats.customerShippingRevenue;
      const profitMargin = stats.totalGMV > 0 
        ? ((stats.totalGMV - logisticsGap) / stats.totalGMV) * 100
        : 0;
      
      return {
        country,
        countryName: countryInfo.name,
        tier,
        orderCount: stats.orderCount,
        totalGMV: Math.round(stats.totalGMV),
        totalLogisticsCost: Math.round(stats.totalLogisticsCost),
        avgLogisticsCost: Math.round(stats.totalLogisticsCost / stats.orderCount),
        customerShippingRevenue: Math.round(stats.customerShippingRevenue),
        logisticsGap: Math.round(logisticsGap),
        profitMargin: Math.round(profitMargin * 10) / 10,
        avgOrderValue: Math.round(stats.totalGMV / stats.orderCount),
      };
    }).sort((a, b) => b.totalGMV - a.totalGMV);
    
    // Tier별 결과
    const byTier = Object.entries(tierStats).map(([tier, stats]) => ({
      tier: parseInt(tier),
      orderCount: stats.orderCount,
      gmv: Math.round(stats.gmv),
      logisticsCost: Math.round(stats.logisticsCost),
      profitMargin: stats.gmv > 0 
        ? Math.round(((stats.gmv - stats.logisticsCost) / stats.gmv) * 1000) / 10
        : 0,
    }));
    
    // 일별 트렌드
    const trends = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        gmv: Math.round(stats.gmv),
        logisticsCost: Math.round(stats.logisticsCost),
        orderCount: stats.orderCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    res.json({
      success: true,
      data: {
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        },
        kpis: {
          totalGMV: Math.round(totalGMV),
          totalLogisticsCost: Math.round(totalLogisticsCost),
          logisticsCostRatio: totalGMV > 0 
            ? Math.round((totalLogisticsCost / totalGMV) * 1000) / 10
            : 0,
          customerShippingRevenue: Math.round(totalCustomerShipping),
          netLogisticsCost: Math.round(netLogisticsCost),
          grossProfit: Math.round(grossProfit),
          grossMarginPercent: totalGMV > 0 
            ? Math.round((grossProfit / totalGMV) * 1000) / 10
            : 0,
          avgOrderValue: orderCount > 0 ? Math.round(totalGMV / orderCount) : 0,
          avgLogisticsCost: orderCount > 0 ? Math.round(totalLogisticsCost / orderCount) : 0,
          orderCount,
        },
        byTier,
        byCountry,
        topCountries: byCountry.slice(0, 10),
        trends,
      },
    });
  } catch (error: any) {
    console.error('[Cost Analysis Dashboard Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || '대시보드 데이터 조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 단일 주문 손익 시뮬레이션
 * POST /api/cost-analysis/simulate
 */
router.post('/simulate', async (req: Request, res: Response) => {
  try {
    const input: SimulationInput = req.body;
    
    // 필수 입력 검증
    if (!input.country) {
      return res.status(400).json({ success: false, error: '국가를 선택해주세요.' });
    }
    if (!input.productPriceKRW || input.productPriceKRW <= 0) {
      return res.status(400).json({ success: false, error: '상품 가격을 입력해주세요.' });
    }
    if (!input.weightKg || input.weightKg <= 0) {
      return res.status(400).json({ success: false, error: '중량을 입력해주세요.' });
    }
    
    const result = costAnalysisService.simulateOrder(input);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Simulation Error]', error);
    res.status(400).json({
      success: false,
      error: error.message || '시뮬레이션 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 운송사별 요금 조회
 * GET /api/cost-analysis/rates
 */
router.get('/rates', async (req: Request, res: Response) => {
  try {
    const { country, weight, height } = req.query;
    
    if (!country || !weight) {
      return res.status(400).json({
        success: false,
        error: '국가와 중량을 입력해주세요.',
      });
    }
    
    const weightKg = parseFloat(weight as string);
    const heightCm = height ? parseFloat(height as string) : undefined;
    
    const rates = getAllAvailableRates(country as string, weightKg, heightCm);
    
    res.json({
      success: true,
      data: {
        country,
        weight: weightKg,
        rates,
        cheapest: rates[0] || null,
        recommended: rates.find(r => r.isRecommended) || rates[0] || null,
      },
    });
  } catch (error: any) {
    console.error('[Rates Query Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || '요금 조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 국가 목록 조회
 * GET /api/cost-analysis/countries
 */
router.get('/countries', async (req: Request, res: Response) => {
  try {
    const countries = getCountryList();
    res.json({
      success: true,
      data: countries,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 배송 정책 조회
 * GET /api/cost-analysis/policies
 */
router.get('/policies', async (req: Request, res: Response) => {
  try {
    const policies = getShippingPolicies();
    res.json({
      success: true,
      data: policies,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 운송사 목록 조회
 * GET /api/cost-analysis/carriers
 */
router.get('/carriers', async (req: Request, res: Response) => {
  try {
    const carriers = getCarrierList();
    res.json({
      success: true,
      data: carriers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 환율 정보 조회
 * GET /api/cost-analysis/exchange-rates
 */
router.get('/exchange-rates', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: EXCHANGE_RATES,
      lastUpdated: new Date().toISOString(),
      note: '실시간 환율이 아닌 기준 환율입니다.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 국가별 분석 상세
 * GET /api/cost-analysis/country/:countryCode
 */
router.get('/country/:countryCode', async (req: Request, res: Response) => {
  try {
    const { countryCode } = req.params;
    const { startDate, endDate } = req.query;
    
    const countryInfo = COUNTRY_TIERS[countryCode];
    if (!countryInfo) {
      return res.status(404).json({
        success: false,
        error: `지원하지 않는 국가입니다: ${countryCode}`,
      });
    }
    
    const tier = countryInfo.tier;
    const policy = SHIPPING_POLICIES[tier as 1 | 2 | 3 | 4];
    
    // 해당 국가의 운송사 요금 조회 (샘플 중량별)
    const sampleWeights = [0.5, 1.0, 2.0, 3.0, 5.0, 10.0];
    const ratesByWeight = sampleWeights.map(weight => ({
      weight,
      rates: getAllAvailableRates(countryCode, weight),
    }));
    
    res.json({
      success: true,
      data: {
        country: {
          code: countryCode,
          name: countryInfo.name,
          tier,
        },
        policy: {
          customerShippingFeeUSD: policy.customerShippingFeeUSD,
          freeShippingThresholdUSD: policy.freeShippingThresholdUSD,
          freeShippingItemCount: policy.freeShippingItemCount,
        },
        ratesByWeight,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

