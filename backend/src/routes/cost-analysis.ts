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
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';

const router = Router();

// Google Sheets 서비스 초기화
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 손익 대시보드 데이터 조회
 * GET /api/cost-analysis/dashboard
 * logistics 시트와 settlement 시트 데이터를 연동
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 기본 기간: 최근 30일
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate 
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    console.log('[Cost Analysis] 대시보드 데이터 조회:', { startDate: start, endDate: end });
    
    // Google Sheets에서 데이터 조회
    let logisticsData: any[] = [];
    let settlementData: any[] = [];
    
    try {
      // logistics 시트 로드 (fill-down 활성화)
      logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
      console.log(`[Cost Analysis] Logistics 데이터 로드: ${logisticsData.length}건`);
    } catch (e: any) {
      console.warn('[Cost Analysis] Logistics 시트 로드 실패:', e.message);
    }
    
    try {
      // settlement 시트 로드
      settlementData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SETTLEMENT_RECORDS, false);
      console.log(`[Cost Analysis] Settlement 데이터 로드: ${settlementData.length}건`);
    } catch (e: any) {
      console.warn('[Cost Analysis] Settlement 시트 로드 실패:', e.message);
    }
    
    // settlement 데이터를 shipment_id로 인덱싱
    const settlementByShipmentId: Record<string, any> = {};
    settlementData.forEach((record: any) => {
      if (record.shipment_id) {
        settlementByShipmentId[record.shipment_id] = record;
      }
    });
    
    // 날짜 필터링 함수
    const filterDataByDate = (data: any[], startDate: Date, endDate: Date) => {
      return data.filter((row) => {
        try {
          if (!row || !row.order_created) return false;
          const orderDate = new Date(row.order_created);
          return orderDate >= startDate && orderDate <= endDate;
        } catch (e) {
          return false;
        }
      });
    };
    
    // 기간 필터링
    const filteredData = filterDataByDate(logisticsData, start, end);
    console.log(`[Cost Analysis] 기간 필터 후: ${filteredData.length}건`);
    
    // 환율 및 KRW 변환
    const USD_TO_KRW = 1350;
    const cleanAndParseFloat = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value.replace(/,/g, '')) || 0;
      return 0;
    };
    
    // 국가별 집계
    const countryStats: Record<string, {
      orderCount: number;
      orderCodes: Set<string>;
      totalGMV: number;
      totalLogisticsCost: number;
      customerShippingRevenue: number;
    }> = {};
    
    // 일별 집계
    const dailyStats: Record<string, {
      gmv: number;
      logisticsCost: number;
      orderCodes: Set<string>;
    }> = {};
    
    // 초기화
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyStats[dateKey] = { gmv: 0, logisticsCost: 0, orderCodes: new Set() };
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    let totalGMV = 0;
    let totalLogisticsCost = 0;
    let totalCustomerShipping = 0;
    const processedOrderCodes = new Set<string>();
    
    for (const row of filteredData) {
      const orderCode = row.order_code;
      const country = row.country || 'JP';
      
      // 중복 주문 건 처리 (order_code 기준)
      const isNewOrder = !processedOrderCodes.has(orderCode);
      if (isNewOrder && orderCode) {
        processedOrderCodes.add(orderCode);
      }
      
      // GMV 계산 (Total GMV는 USD 단위)
      const gmvUSD = cleanAndParseFloat(row['Total GMV']);
      const gmvKRW = gmvUSD * USD_TO_KRW;
      
      // 물류비 계산 (settlement 데이터가 있으면 사용)
      let logisticsCost = 0;
      const shipmentId = row.shipment_id;
      const settlementRecord = shipmentId ? settlementByShipmentId[shipmentId] : null;
      
      if (settlementRecord && settlementRecord.total_cost) {
        logisticsCost = cleanAndParseFloat(settlementRecord.total_cost);
      } else {
        // settlement 데이터 없으면 Tier 기반 추정
        const countryInfo = COUNTRY_TIERS[country];
        const tier = countryInfo?.tier || 4;
        logisticsCost = tier === 1 ? 8000 : tier === 2 ? 15000 : tier === 3 ? 35000 : 45000;
      }
      
      // 고객 배송비 수입 계산
      const countryInfo = COUNTRY_TIERS[country];
      const tier = countryInfo?.tier || 4;
      const policy = SHIPPING_POLICIES[tier as 1 | 2 | 3 | 4];
      const isFreeShipping = gmvUSD >= policy.freeShippingThresholdUSD;
      const customerShipping = isNewOrder 
        ? (isFreeShipping ? 0 : policy.customerShippingFeeUSD * USD_TO_KRW)
        : 0;
      
      // 집계
      if (isNewOrder) {
        totalGMV += gmvKRW;
        totalLogisticsCost += logisticsCost;
        totalCustomerShipping += customerShipping;
      }
      
      // 국가별
      if (!countryStats[country]) {
        countryStats[country] = {
          orderCount: 0,
          orderCodes: new Set(),
          totalGMV: 0,
          totalLogisticsCost: 0,
          customerShippingRevenue: 0,
        };
      }
      if (orderCode && !countryStats[country].orderCodes.has(orderCode)) {
        countryStats[country].orderCodes.add(orderCode);
        countryStats[country].orderCount++;
        countryStats[country].totalGMV += gmvKRW;
        countryStats[country].totalLogisticsCost += logisticsCost;
        countryStats[country].customerShippingRevenue += customerShipping;
      }
      
      // 일별
      try {
        const orderDate = new Date(row.order_created);
        const dateKey = orderDate.toISOString().split('T')[0];
        if (dailyStats[dateKey] && orderCode) {
          if (!dailyStats[dateKey].orderCodes.has(orderCode)) {
            dailyStats[dateKey].orderCodes.add(orderCode);
            dailyStats[dateKey].gmv += gmvKRW;
            dailyStats[dateKey].logisticsCost += logisticsCost;
          }
        }
      } catch (e) {}
    }
    
    const orderCount = processedOrderCodes.size;
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
        avgLogisticsCost: stats.orderCount > 0 ? Math.round(stats.totalLogisticsCost / stats.orderCount) : 0,
        customerShippingRevenue: Math.round(stats.customerShippingRevenue),
        logisticsGap: Math.round(logisticsGap),
        profitMargin: Math.round(profitMargin * 10) / 10,
        avgOrderValue: stats.orderCount > 0 ? Math.round(stats.totalGMV / stats.orderCount) : 0,
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
        orderCount: stats.orderCodes.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    console.log(`[Cost Analysis] 대시보드 응답: GMV=${totalGMV}, Orders=${orderCount}`);
    
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

/**
 * 정책 시뮬레이션
 * POST /api/cost-analysis/policy-simulation
 * 
 * 무료배송 기준, 고객 배송비 등 정책 변경 시 영향 분석
 */
router.post('/policy-simulation', async (req: Request, res: Response) => {
  try {
    const {
      tier,
      newFreeShippingThreshold,
      newCustomerShippingFee,
      newFreeShippingItemCount,
    } = req.body;
    
    if (!tier || tier < 1 || tier > 4) {
      return res.status(400).json({
        success: false,
        error: '유효한 Tier를 지정해주세요. (1-4)',
      });
    }
    
    // 현재 정책
    const currentPolicy = SHIPPING_POLICIES[tier as 1 | 2 | 3 | 4];
    
    // 변경될 정책
    const newPolicy = {
      freeShippingThresholdUSD: newFreeShippingThreshold ?? currentPolicy.freeShippingThresholdUSD,
      customerShippingFeeUSD: newCustomerShippingFee ?? currentPolicy.customerShippingFeeUSD,
      freeShippingItemCount: newFreeShippingItemCount ?? currentPolicy.freeShippingItemCount,
    };
    
    console.log(`[Policy Simulation] Tier ${tier}: 현재 정책 ->`, currentPolicy);
    console.log(`[Policy Simulation] Tier ${tier}: 새 정책 ->`, newPolicy);
    
    // 실제 데이터 기반 시뮬레이션
    let logisticsData: any[] = [];
    let settlementData: any[] = [];
    
    try {
      logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    } catch (e: any) {
      console.warn('[Policy Simulation] Logistics 데이터 로드 실패:', e.message);
    }
    
    try {
      settlementData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SETTLEMENT_RECORDS, false);
    } catch (e: any) {
      console.warn('[Policy Simulation] Settlement 데이터 로드 실패:', e.message);
    }
    
    // 해당 Tier 국가 목록
    const tierCountries = Object.entries(COUNTRY_TIERS)
      .filter(([_, info]) => info.tier === tier)
      .map(([code, _]) => code);
    
    // 최근 30일 데이터만 분석
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // settlement 데이터 인덱싱
    const settlementByShipmentId: Record<string, any> = {};
    settlementData.forEach((record: any) => {
      if (record.shipment_id) {
        settlementByShipmentId[record.shipment_id] = record;
      }
    });
    
    // 해당 Tier 주문 필터링
    const tierOrders = logisticsData.filter((row: any) => {
      const country = row.country || 'JP';
      const orderDate = new Date(row.order_created);
      return tierCountries.includes(country) && orderDate >= thirtyDaysAgo;
    });
    
    // 중복 제거 (order_code 기준)
    const uniqueOrders: Record<string, any> = {};
    tierOrders.forEach((row: any) => {
      if (row.order_code && !uniqueOrders[row.order_code]) {
        uniqueOrders[row.order_code] = row;
      }
    });
    
    const orders = Object.values(uniqueOrders);
    const USD_TO_KRW = 1350;
    
    // 현재 정책 기준 분석
    let currentStats = {
      totalOrders: orders.length,
      freeShippingOrders: 0,
      paidShippingOrders: 0,
      totalGMV: 0,
      totalLogisticsCost: 0,
      customerShippingRevenue: 0,
    };
    
    // 새 정책 기준 분석
    let newStats = {
      totalOrders: orders.length,
      freeShippingOrders: 0,
      paidShippingOrders: 0,
      totalGMV: 0,
      totalLogisticsCost: 0,
      customerShippingRevenue: 0,
    };
    
    const cleanAndParseFloat = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value.replace(/,/g, '')) || 0;
      return 0;
    };
    
    for (const row of orders) {
      const gmvUSD = cleanAndParseFloat(row['Total GMV']);
      const gmvKRW = gmvUSD * USD_TO_KRW;
      const quantity = parseInt(row['구매수량'] || '1') || 1;
      
      // 물류비
      let logisticsCost = 0;
      const shipmentId = row.shipment_id;
      const settlementRecord = shipmentId ? settlementByShipmentId[shipmentId] : null;
      
      if (settlementRecord && settlementRecord.total_cost) {
        logisticsCost = cleanAndParseFloat(settlementRecord.total_cost);
      } else {
        logisticsCost = tier === 1 ? 8000 : tier === 2 ? 15000 : tier === 3 ? 35000 : 45000;
      }
      
      // 현재 정책 기준 무료배송 여부
      const currentIsFree = gmvUSD >= currentPolicy.freeShippingThresholdUSD ||
        (currentPolicy.freeShippingItemCount && quantity >= currentPolicy.freeShippingItemCount);
      
      // 새 정책 기준 무료배송 여부
      const newIsFree = gmvUSD >= newPolicy.freeShippingThresholdUSD ||
        (newPolicy.freeShippingItemCount && quantity >= newPolicy.freeShippingItemCount);
      
      // 현재 정책 집계
      currentStats.totalGMV += gmvKRW;
      currentStats.totalLogisticsCost += logisticsCost;
      if (currentIsFree) {
        currentStats.freeShippingOrders++;
      } else {
        currentStats.paidShippingOrders++;
        currentStats.customerShippingRevenue += currentPolicy.customerShippingFeeUSD * USD_TO_KRW;
      }
      
      // 새 정책 집계
      newStats.totalGMV += gmvKRW;
      newStats.totalLogisticsCost += logisticsCost;
      if (newIsFree) {
        newStats.freeShippingOrders++;
      } else {
        newStats.paidShippingOrders++;
        newStats.customerShippingRevenue += newPolicy.customerShippingFeeUSD * USD_TO_KRW;
      }
    }
    
    // 변화량 계산
    const changes = {
      freeShippingOrders: newStats.freeShippingOrders - currentStats.freeShippingOrders,
      freeShippingRate: {
        before: currentStats.totalOrders > 0 
          ? (currentStats.freeShippingOrders / currentStats.totalOrders) * 100 
          : 0,
        after: newStats.totalOrders > 0 
          ? (newStats.freeShippingOrders / newStats.totalOrders) * 100 
          : 0,
      },
      customerShippingRevenue: newStats.customerShippingRevenue - currentStats.customerShippingRevenue,
      netLogisticsCost: {
        before: currentStats.totalLogisticsCost - currentStats.customerShippingRevenue,
        after: newStats.totalLogisticsCost - newStats.customerShippingRevenue,
      },
    };
    
    const netChange = changes.netLogisticsCost.before - changes.netLogisticsCost.after;
    
    // 리스크 평가
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (netChange < -1000000) riskLevel = 'high';
    else if (netChange < 0) riskLevel = 'medium';
    
    // 권장사항
    let recommendation = '';
    if (netChange > 0) {
      recommendation = '✅ 순이익이 증가하는 정책입니다. 적용을 권장합니다.';
    } else if (riskLevel === 'medium') {
      recommendation = '⚠️ 단기 비용 증가가 예상됩니다. 전환율 상승 효과를 고려해 A/B 테스트를 권장합니다.';
    } else {
      recommendation = '❌ 높은 비용 증가가 예상됩니다. 신중한 검토가 필요합니다.';
    }
    
    res.json({
      success: true,
      data: {
        tier,
        tierCountries: tierCountries.slice(0, 10), // 상위 10개국만
        tierCountriesCount: tierCountries.length,
        period: {
          days: 30,
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        },
        currentPolicy: {
          freeShippingThresholdUSD: currentPolicy.freeShippingThresholdUSD,
          customerShippingFeeUSD: currentPolicy.customerShippingFeeUSD,
          freeShippingItemCount: currentPolicy.freeShippingItemCount,
        },
        newPolicy,
        currentStats: {
          totalOrders: currentStats.totalOrders,
          freeShippingOrders: currentStats.freeShippingOrders,
          paidShippingOrders: currentStats.paidShippingOrders,
          freeShippingRate: changes.freeShippingRate.before,
          totalGMV: Math.round(currentStats.totalGMV),
          totalLogisticsCost: Math.round(currentStats.totalLogisticsCost),
          customerShippingRevenue: Math.round(currentStats.customerShippingRevenue),
          netLogisticsCost: Math.round(changes.netLogisticsCost.before),
        },
        newStats: {
          totalOrders: newStats.totalOrders,
          freeShippingOrders: newStats.freeShippingOrders,
          paidShippingOrders: newStats.paidShippingOrders,
          freeShippingRate: changes.freeShippingRate.after,
          totalGMV: Math.round(newStats.totalGMV),
          totalLogisticsCost: Math.round(newStats.totalLogisticsCost),
          customerShippingRevenue: Math.round(newStats.customerShippingRevenue),
          netLogisticsCost: Math.round(changes.netLogisticsCost.after),
        },
        impact: {
          additionalFreeShippingOrders: changes.freeShippingOrders,
          freeShippingRateChange: changes.freeShippingRate.after - changes.freeShippingRate.before,
          customerShippingRevenueChange: Math.round(changes.customerShippingRevenue),
          netLogisticsCostChange: Math.round(changes.netLogisticsCost.after - changes.netLogisticsCost.before),
          netProfitChange: Math.round(netChange),
        },
        riskLevel,
        recommendation,
      },
    });
  } catch (error: any) {
    console.error('[Policy Simulation Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || '정책 시뮬레이션 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 매출 데이터 요약
 * GET /api/cost-analysis/sales-summary
 * 
 * 다른 기능에서 활용할 수 있는 매출 데이터 요약
 */
router.get('/sales-summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, country, tier } = req.query;
    
    // 기본 기간: 최근 30일
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate 
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let logisticsData: any[] = [];
    
    try {
      logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    } catch (e: any) {
      console.warn('[Sales Summary] Logistics 데이터 로드 실패:', e.message);
    }
    
    // 날짜 및 조건 필터링
    const filteredData = logisticsData.filter((row: any) => {
      const orderDate = new Date(row.order_created);
      if (orderDate < start || orderDate > end) return false;
      
      if (country && row.country !== country) return false;
      
      if (tier) {
        const countryInfo = COUNTRY_TIERS[row.country];
        if (!countryInfo || countryInfo.tier !== parseInt(tier as string)) return false;
      }
      
      return true;
    });
    
    // 중복 제거
    const uniqueOrders: Record<string, any> = {};
    filteredData.forEach((row: any) => {
      if (row.order_code && !uniqueOrders[row.order_code]) {
        uniqueOrders[row.order_code] = row;
      }
    });
    
    const orders = Object.values(uniqueOrders);
    const USD_TO_KRW = 1350;
    
    const cleanAndParseFloat = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value.replace(/,/g, '')) || 0;
      return 0;
    };
    
    let totalGMV = 0;
    let totalOrders = orders.length;
    const countryBreakdown: Record<string, { orders: number; gmv: number }> = {};
    const tierBreakdown: Record<number, { orders: number; gmv: number }> = {
      1: { orders: 0, gmv: 0 },
      2: { orders: 0, gmv: 0 },
      3: { orders: 0, gmv: 0 },
      4: { orders: 0, gmv: 0 },
    };
    
    for (const row of orders) {
      const gmvUSD = cleanAndParseFloat(row['Total GMV']);
      const gmvKRW = gmvUSD * USD_TO_KRW;
      const orderCountry = row.country || 'JP';
      const countryInfo = COUNTRY_TIERS[orderCountry];
      const orderTier = countryInfo?.tier || 4;
      
      totalGMV += gmvKRW;
      
      if (!countryBreakdown[orderCountry]) {
        countryBreakdown[orderCountry] = { orders: 0, gmv: 0 };
      }
      countryBreakdown[orderCountry].orders++;
      countryBreakdown[orderCountry].gmv += gmvKRW;
      
      tierBreakdown[orderTier].orders++;
      tierBreakdown[orderTier].gmv += gmvKRW;
    }
    
    res.json({
      success: true,
      data: {
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        },
        filters: { country, tier },
        summary: {
          totalOrders,
          totalGMV: Math.round(totalGMV),
          avgOrderValue: totalOrders > 0 ? Math.round(totalGMV / totalOrders) : 0,
        },
        byCountry: Object.entries(countryBreakdown)
          .map(([code, data]) => ({
            country: code,
            countryName: COUNTRY_TIERS[code]?.name || code,
            ...data,
            gmv: Math.round(data.gmv),
          }))
          .sort((a, b) => b.gmv - a.gmv),
        byTier: Object.entries(tierBreakdown).map(([tier, data]) => ({
          tier: parseInt(tier),
          ...data,
          gmv: Math.round(data.gmv),
        })),
      },
    });
  } catch (error: any) {
    console.error('[Sales Summary Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || '매출 요약 조회 중 오류가 발생했습니다.',
    });
  }
});

export default router;

