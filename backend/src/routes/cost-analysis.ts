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
    
    // ============================================
    // 메인 대시보드와 동일한 GMV 계산 로직 적용
    // - GMV: 모든 row 합산 (같은 주문에 여러 상품 가능)
    // - 주문 건수: order_code 기준 중복 제거
    // - 물류비: 주문당 한 번만 계산 (배송은 주문 단위)
    // ============================================
    
    let totalGMV = 0;
    let totalLogisticsCost = 0;
    let totalCustomerShipping = 0;
    let totalItemCount = 0;
    const processedOrderCodes = new Set<string>();
    
    // 주문별 GMV 집계 (물류비/배송비 계산용)
    const orderGMVMap: Record<string, number> = {};
    
    // 1단계: 주문별 GMV 합산 (메인 대시보드와 동일)
    for (const row of filteredData) {
      const orderCode = row.order_code;
      if (!orderCode) continue;
      
      const gmvUSD = cleanAndParseFloat(row['Total GMV']);
      if (!orderGMVMap[orderCode]) {
        orderGMVMap[orderCode] = 0;
      }
      orderGMVMap[orderCode] += gmvUSD;
    }
    
    // 2단계: 전체 집계 (메인 대시보드 로직과 일치)
    for (const row of filteredData) {
      const orderCode = row.order_code;
      const country = row.country || 'JP';
      
      // GMV는 모든 row 합산 (메인 대시보드와 동일)
      const gmvUSD = cleanAndParseFloat(row['Total GMV']);
      const gmvKRW = gmvUSD * USD_TO_KRW;
      totalGMV += gmvKRW;
      
      // 수량도 모든 row 합산
      totalItemCount += parseInt(row['구매수량'] || '1') || 1;
      
      // 중복 주문 건 처리 (order_code 기준) - 물류비/배송비 계산용
      const isNewOrder = orderCode && !processedOrderCodes.has(orderCode);
      if (isNewOrder) {
        processedOrderCodes.add(orderCode);
        
        // 물류비 계산 (주문당 한 번만 - settlement 데이터가 있으면 사용)
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
        
        // 고객 배송비 수입 계산 (주문 전체 GMV 기준으로 무료배송 판단)
        const countryInfo = COUNTRY_TIERS[country];
        const tier = countryInfo?.tier || 4;
        const policy = SHIPPING_POLICIES[tier as 1 | 2 | 3 | 4];
        const orderTotalGMV_USD = orderGMVMap[orderCode] || 0;
        const isFreeShipping = orderTotalGMV_USD >= policy.freeShippingThresholdUSD;
        const customerShipping = isFreeShipping ? 0 : policy.customerShippingFeeUSD * USD_TO_KRW;
        
        totalLogisticsCost += logisticsCost;
        totalCustomerShipping += customerShipping;
      }
      
      // 국가별 집계
      if (!countryStats[country]) {
        countryStats[country] = {
          orderCount: 0,
          orderCodes: new Set(),
          totalGMV: 0,
          totalLogisticsCost: 0,
          customerShippingRevenue: 0,
        };
      }
      
      // 국가별 GMV는 모든 row 합산
      countryStats[country].totalGMV += gmvKRW;
      
      // 국가별 주문 건수, 물류비는 order_code 기준
      if (orderCode && !countryStats[country].orderCodes.has(orderCode)) {
        countryStats[country].orderCodes.add(orderCode);
        countryStats[country].orderCount++;
        
        // 물류비 계산 (주문당 한 번)
        let logisticsCost = 0;
        const shipmentId = row.shipment_id;
        const settlementRecord = shipmentId ? settlementByShipmentId[shipmentId] : null;
        
        if (settlementRecord && settlementRecord.total_cost) {
          logisticsCost = cleanAndParseFloat(settlementRecord.total_cost);
        } else {
          const countryInfo = COUNTRY_TIERS[country];
          const tier = countryInfo?.tier || 4;
          logisticsCost = tier === 1 ? 8000 : tier === 2 ? 15000 : tier === 3 ? 35000 : 45000;
        }
        
        countryStats[country].totalLogisticsCost += logisticsCost;
        
        // 배송비 수입 (주문 전체 GMV 기준)
        const countryInfo = COUNTRY_TIERS[country];
        const tier = countryInfo?.tier || 4;
        const policy = SHIPPING_POLICIES[tier as 1 | 2 | 3 | 4];
        const orderTotalGMV_USD = orderGMVMap[orderCode] || 0;
        const isFreeShipping = orderTotalGMV_USD >= policy.freeShippingThresholdUSD;
        const customerShipping = isFreeShipping ? 0 : policy.customerShippingFeeUSD * USD_TO_KRW;
        countryStats[country].customerShippingRevenue += customerShipping;
      }
      
      // 일별 집계
      try {
        const orderDate = new Date(row.order_created);
        const dateKey = orderDate.toISOString().split('T')[0];
        if (dailyStats[dateKey]) {
          // GMV는 모든 row 합산
          dailyStats[dateKey].gmv += gmvKRW;
          
          // 주문 건수, 물류비는 order_code 기준
          if (orderCode && !dailyStats[dateKey].orderCodes.has(orderCode)) {
            dailyStats[dateKey].orderCodes.add(orderCode);
            
            let logisticsCost = 0;
            const shipmentId = row.shipment_id;
            const settlementRecord = shipmentId ? settlementByShipmentId[shipmentId] : null;
            
            if (settlementRecord && settlementRecord.total_cost) {
              logisticsCost = cleanAndParseFloat(settlementRecord.total_cost);
            } else {
              const countryInfo = COUNTRY_TIERS[country];
              const tier = countryInfo?.tier || 4;
              logisticsCost = tier === 1 ? 8000 : tier === 2 ? 15000 : tier === 3 ? 35000 : 45000;
            }
            dailyStats[dateKey].logisticsCost += logisticsCost;
          }
        }
      } catch (e) {}
    }
    
    const orderCount = processedOrderCodes.size;
    const netLogisticsCost = totalLogisticsCost - totalCustomerShipping;
    const grossProfit = totalGMV - netLogisticsCost;
    
    // Tier별 집계 (Hidden Fee 분석 포함)
    const tierStats: Record<number, { 
      orderCount: number; 
      gmv: number; 
      logisticsCost: number;
      customerShippingRevenue: number;
      hiddenFeeRevenue: number;
      freeShippingOrders: number;
    }> = {
      1: { orderCount: 0, gmv: 0, logisticsCost: 0, customerShippingRevenue: 0, hiddenFeeRevenue: 0, freeShippingOrders: 0 },
      2: { orderCount: 0, gmv: 0, logisticsCost: 0, customerShippingRevenue: 0, hiddenFeeRevenue: 0, freeShippingOrders: 0 },
      3: { orderCount: 0, gmv: 0, logisticsCost: 0, customerShippingRevenue: 0, hiddenFeeRevenue: 0, freeShippingOrders: 0 },
      4: { orderCount: 0, gmv: 0, logisticsCost: 0, customerShippingRevenue: 0, hiddenFeeRevenue: 0, freeShippingOrders: 0 },
    };
    
    // 국가별 분석 결과 생성 (Hidden Fee 분석 포함)
    const byCountry = Object.entries(countryStats).map(([country, stats]) => {
      const countryInfo = COUNTRY_TIERS[country] || { tier: 4, name: country, code: country };
      const tier = countryInfo.tier;
      const policy = SHIPPING_POLICIES[tier as 1 | 2 | 3 | 4];
      
      // Hidden Fee 수입 계산 (주문당 Hidden Fee × 주문 건수)
      const hiddenFeePerOrder = policy.hiddenFeeUSD * USD_TO_KRW;
      const hiddenFeeRevenue = hiddenFeePerOrder * stats.orderCount;
      
      // 무료배송 주문 추정 (고객 배송비 수입 기반)
      const paidShippingOrders = Math.round(stats.customerShippingRevenue / (policy.customerShippingFeeUSD * USD_TO_KRW));
      const freeShippingOrders = stats.orderCount - paidShippingOrders;
      
      tierStats[tier].orderCount += stats.orderCount;
      tierStats[tier].gmv += stats.totalGMV;
      tierStats[tier].logisticsCost += stats.totalLogisticsCost;
      tierStats[tier].customerShippingRevenue += stats.customerShippingRevenue;
      tierStats[tier].hiddenFeeRevenue += hiddenFeeRevenue;
      tierStats[tier].freeShippingOrders += freeShippingOrders;
      
      // 물류비 보전 총액: Hidden Fee + 고객 배송비
      const totalCoverage = hiddenFeeRevenue + stats.customerShippingRevenue;
      // 물류비 갭: 실제 물류비 - 보전 총액 (양수면 손실, 음수면 이익)
      const logisticsGap = stats.totalLogisticsCost - totalCoverage;
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
        hiddenFeeRevenue: Math.round(hiddenFeeRevenue),
        totalCoverage: Math.round(totalCoverage),
        logisticsGap: Math.round(logisticsGap),
        profitMargin: Math.round(profitMargin * 10) / 10,
        avgOrderValue: stats.orderCount > 0 ? Math.round(stats.totalGMV / stats.orderCount) : 0,
        freeShippingOrders,
        freeShippingRate: stats.orderCount > 0 
          ? Math.round((freeShippingOrders / stats.orderCount) * 1000) / 10
          : 0,
      };
    }).sort((a, b) => b.totalGMV - a.totalGMV);
    
    // Tier별 결과 (Hidden Fee 분석 포함)
    const byTier = Object.entries(tierStats).map(([tierNum, stats]) => {
      const policy = SHIPPING_POLICIES[parseInt(tierNum) as 1 | 2 | 3 | 4];
      const totalCoverage = stats.hiddenFeeRevenue + stats.customerShippingRevenue;
      const logisticsGap = stats.logisticsCost - totalCoverage;
      const avgLogisticsCostPerOrder = stats.orderCount > 0 ? stats.logisticsCost / stats.orderCount : 0;
      const avgCoveragePerOrder = stats.orderCount > 0 ? totalCoverage / stats.orderCount : 0;
      
      return {
        tier: parseInt(tierNum),
        orderCount: stats.orderCount,
        gmv: Math.round(stats.gmv),
        logisticsCost: Math.round(stats.logisticsCost),
        // Hidden Fee 분석
        hiddenFeeUSD: policy.hiddenFeeUSD,
        customerShippingFeeUSD: policy.customerShippingFeeUSD,
        hiddenFeeRevenue: Math.round(stats.hiddenFeeRevenue),
        customerShippingRevenue: Math.round(stats.customerShippingRevenue),
        totalCoverage: Math.round(totalCoverage),
        logisticsGap: Math.round(logisticsGap),
        // 건당 분석
        avgLogisticsCostPerOrder: Math.round(avgLogisticsCostPerOrder),
        avgCoveragePerOrder: Math.round(avgCoveragePerOrder),
        // 무료배송 분석
        freeShippingOrders: stats.freeShippingOrders,
        freeShippingRate: stats.orderCount > 0 
          ? Math.round((stats.freeShippingOrders / stats.orderCount) * 1000) / 10
          : 0,
        // 적정성 판단
        isCoverageAdequate: logisticsGap <= 0,
        coverageRatio: stats.logisticsCost > 0 
          ? Math.round((totalCoverage / stats.logisticsCost) * 1000) / 10
          : 100,
        profitMargin: stats.gmv > 0 
          ? Math.round(((stats.gmv - stats.logisticsCost) / stats.gmv) * 1000) / 10
          : 0,
      };
    });
    
    // 일별 트렌드
    const trends = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        gmv: Math.round(stats.gmv),
        logisticsCost: Math.round(stats.logisticsCost),
        orderCount: stats.orderCodes.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Hidden Fee 분석 계산
    const totalHiddenFeeRevenue = byTier.reduce((sum, t) => sum + t.hiddenFeeRevenue, 0);
    const totalCoverage = totalHiddenFeeRevenue + totalCustomerShipping;
    const totalLogisticsGap = totalLogisticsCost - totalCoverage;
    const avgHiddenFeePerOrder = orderCount > 0 ? totalHiddenFeeRevenue / orderCount : 0;
    const avgCoveragePerOrder = orderCount > 0 ? totalCoverage / orderCount : 0;
    const avgLogisticsCostPerOrder = orderCount > 0 ? totalLogisticsCost / orderCount : 0;
    
    // Hidden Fee 필요 비율 계산 (GMV 대비)
    const currentHiddenFeeRatio = totalGMV > 0 ? (totalHiddenFeeRevenue / totalGMV) * 100 : 0;
    const requiredHiddenFeeRatio = totalGMV > 0 ? (totalLogisticsGap > 0 
      ? ((totalHiddenFeeRevenue + totalLogisticsGap) / totalGMV) * 100 
      : currentHiddenFeeRatio) : 0;
    
    console.log(`[Cost Analysis] 대시보드 응답: GMV=${totalGMV}, Orders=${orderCount}, HiddenFee=${totalHiddenFeeRevenue}`);
    
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
        // Hidden Fee 적정성 분석
        hiddenFeeAnalysis: {
          // 현재 정책
          policy: {
            tier1: { hiddenFeeUSD: SHIPPING_POLICIES[1].hiddenFeeUSD, customerShippingFeeUSD: SHIPPING_POLICIES[1].customerShippingFeeUSD },
            tier2: { hiddenFeeUSD: SHIPPING_POLICIES[2].hiddenFeeUSD, customerShippingFeeUSD: SHIPPING_POLICIES[2].customerShippingFeeUSD },
            tier3: { hiddenFeeUSD: SHIPPING_POLICIES[3].hiddenFeeUSD, customerShippingFeeUSD: SHIPPING_POLICIES[3].customerShippingFeeUSD },
            tier4: { hiddenFeeUSD: SHIPPING_POLICIES[4].hiddenFeeUSD, customerShippingFeeUSD: SHIPPING_POLICIES[4].customerShippingFeeUSD },
          },
          // 총액 분석
          totalHiddenFeeRevenue: Math.round(totalHiddenFeeRevenue),
          totalCustomerShippingRevenue: Math.round(totalCustomerShipping),
          totalCoverage: Math.round(totalCoverage),
          totalLogisticsCost: Math.round(totalLogisticsCost),
          totalGap: Math.round(totalLogisticsGap),
          // 비율 분석
          coverageRatio: totalLogisticsCost > 0 
            ? Math.round((totalCoverage / totalLogisticsCost) * 1000) / 10
            : 100,
          currentHiddenFeeRatioOfGMV: Math.round(currentHiddenFeeRatio * 100) / 100,
          requiredHiddenFeeRatioOfGMV: Math.round(requiredHiddenFeeRatio * 100) / 100,
          // 건당 분석
          avgHiddenFeePerOrder: Math.round(avgHiddenFeePerOrder),
          avgCustomerShippingPerOrder: Math.round(totalCustomerShipping / orderCount),
          avgCoveragePerOrder: Math.round(avgCoveragePerOrder),
          avgLogisticsCostPerOrder: Math.round(avgLogisticsCostPerOrder),
          avgGapPerOrder: Math.round(totalLogisticsGap / orderCount),
          // 적정성 판단
          isAdequate: totalLogisticsGap <= 0,
          adequacyStatus: totalLogisticsGap <= 0 
            ? (totalLogisticsGap < -500000 ? 'surplus' : 'adequate')
            : (totalLogisticsGap > 500000 ? 'critical' : 'deficit'),
          // 권장 사항
          recommendation: totalLogisticsGap <= 0 
            ? (totalLogisticsGap < -1000000 
              ? `Hidden Fee 여유분 ${Math.round(Math.abs(totalLogisticsGap) / 10000)}만원. 정책 유지 또는 프로모션 활용 가능.`
              : 'Hidden Fee 정책이 적정합니다.')
            : `월 ${Math.round(totalLogisticsGap / 10000)}만원 부족. Hidden Fee 인상 또는 무료배송 기준 상향 검토 필요.`,
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
    
    const USD_TO_KRW = 1350;
    
    const cleanAndParseFloat = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value.replace(/,/g, '')) || 0;
      return 0;
    };
    
    // ============================================
    // 메인 대시보드와 동일한 GMV 계산 로직 적용
    // - GMV: 모든 row 합산 (같은 주문에 여러 상품 가능)
    // - 주문 건수: order_code 기준 중복 제거
    // ============================================
    
    // 1단계: 주문별 GMV/수량 합산
    const orderDataMap: Record<string, { gmvUSD: number; quantity: number; shipmentId?: string; firstRow: any }> = {};
    
    for (const row of tierOrders) {
      const orderCode = row.order_code;
      if (!orderCode) continue;
      
      const gmvUSD = cleanAndParseFloat(row['Total GMV']);
      const quantity = parseInt(row['구매수량'] || '1') || 1;
      
      if (!orderDataMap[orderCode]) {
        orderDataMap[orderCode] = {
          gmvUSD: 0,
          quantity: 0,
          shipmentId: row.shipment_id,
          firstRow: row,
        };
      }
      orderDataMap[orderCode].gmvUSD += gmvUSD;
      orderDataMap[orderCode].quantity += quantity;
    }
    
    const uniqueOrderCodes = Object.keys(orderDataMap);
    
    // 현재 정책 기준 분석
    let currentStats = {
      totalOrders: uniqueOrderCodes.length,
      freeShippingOrders: 0,
      paidShippingOrders: 0,
      totalGMV: 0,
      totalLogisticsCost: 0,
      customerShippingRevenue: 0,
    };
    
    // 새 정책 기준 분석
    let newStats = {
      totalOrders: uniqueOrderCodes.length,
      freeShippingOrders: 0,
      paidShippingOrders: 0,
      totalGMV: 0,
      totalLogisticsCost: 0,
      customerShippingRevenue: 0,
    };
    
    // 2단계: 주문별로 정책 시뮬레이션
    for (const orderCode of uniqueOrderCodes) {
      const orderData = orderDataMap[orderCode];
      const gmvUSD = orderData.gmvUSD; // 주문 전체 GMV
      const gmvKRW = gmvUSD * USD_TO_KRW;
      const quantity = orderData.quantity; // 주문 전체 수량
      
      // 물류비 (주문당 한 번)
      let logisticsCost = 0;
      const shipmentId = orderData.shipmentId;
      const settlementRecord = shipmentId ? settlementByShipmentId[shipmentId] : null;
      
      if (settlementRecord && settlementRecord.total_cost) {
        logisticsCost = cleanAndParseFloat(settlementRecord.total_cost);
      } else {
        logisticsCost = tier === 1 ? 8000 : tier === 2 ? 15000 : tier === 3 ? 35000 : 45000;
      }
      
      // 현재 정책 기준 무료배송 여부 (주문 전체 GMV/수량 기준)
      const currentIsFree = gmvUSD >= currentPolicy.freeShippingThresholdUSD ||
        (currentPolicy.freeShippingItemCount && quantity >= currentPolicy.freeShippingItemCount);
      
      // 새 정책 기준 무료배송 여부 (주문 전체 GMV/수량 기준)
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
    
    const USD_TO_KRW = 1350;
    
    const cleanAndParseFloat = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value.replace(/,/g, '')) || 0;
      return 0;
    };
    
    // ============================================
    // 메인 대시보드와 동일한 GMV 계산 로직 적용
    // - GMV: 모든 row 합산 (같은 주문에 여러 상품 가능)
    // - 주문 건수: order_code 기준 중복 제거
    // ============================================
    
    let totalGMV = 0;
    const processedOrderCodes = new Set<string>();
    const countryBreakdown: Record<string, { orders: number; gmv: number; orderCodes: Set<string> }> = {};
    const tierBreakdown: Record<number, { orders: number; gmv: number; orderCodes: Set<string> }> = {
      1: { orders: 0, gmv: 0, orderCodes: new Set() },
      2: { orders: 0, gmv: 0, orderCodes: new Set() },
      3: { orders: 0, gmv: 0, orderCodes: new Set() },
      4: { orders: 0, gmv: 0, orderCodes: new Set() },
    };
    
    // 모든 row를 순회하며 GMV 합산, 주문 건수는 order_code 기준 중복 제거
    for (const row of filteredData) {
      const orderCode = row.order_code;
      const gmvUSD = cleanAndParseFloat(row['Total GMV']);
      const gmvKRW = gmvUSD * USD_TO_KRW;
      const orderCountry = row.country || 'JP';
      const countryInfo = COUNTRY_TIERS[orderCountry];
      const orderTier = countryInfo?.tier || 4;
      
      // GMV는 모든 row 합산 (메인 대시보드와 동일)
      totalGMV += gmvKRW;
      
      // 국가별 집계
      if (!countryBreakdown[orderCountry]) {
        countryBreakdown[orderCountry] = { orders: 0, gmv: 0, orderCodes: new Set() };
      }
      countryBreakdown[orderCountry].gmv += gmvKRW;
      
      // Tier별 집계 - GMV는 모든 row 합산
      tierBreakdown[orderTier].gmv += gmvKRW;
      
      // 주문 건수는 order_code 기준 중복 제거
      if (orderCode) {
        if (!processedOrderCodes.has(orderCode)) {
          processedOrderCodes.add(orderCode);
        }
        
        if (!countryBreakdown[orderCountry].orderCodes.has(orderCode)) {
          countryBreakdown[orderCountry].orderCodes.add(orderCode);
          countryBreakdown[orderCountry].orders++;
        }
        
        if (!tierBreakdown[orderTier].orderCodes.has(orderCode)) {
          tierBreakdown[orderTier].orderCodes.add(orderCode);
          tierBreakdown[orderTier].orders++;
        }
      }
    }
    
    const totalOrders = processedOrderCodes.size;
    
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
            orders: data.orders,
            gmv: Math.round(data.gmv),
          }))
          .sort((a, b) => b.gmv - a.gmv),
        byTier: Object.entries(tierBreakdown).map(([tier, data]) => ({
          tier: parseInt(tier),
          orders: data.orders,
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

