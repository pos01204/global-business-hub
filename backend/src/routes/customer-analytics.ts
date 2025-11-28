/**
 * 고객 분석 API
 * RFM 세그먼테이션, 이탈 예측, 코호트 분석, LTV
 */

import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

// USD to KRW 환율
const USD_TO_KRW = 1350;

/**
 * 금액 파싱 유틸리티 (문자열에서 숫자 추출)
 */
function cleanAndParseFloat(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleanedStr = String(value).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleanedStr);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * GMV 추출 (USD → KRW 변환)
 */
function getGmvKrw(row: any): number {
  // Total GMV가 USD 기준이므로 KRW로 변환
  const gmvUsd = cleanAndParseFloat(row['Total GMV']);
  if (gmvUsd > 0) return gmvUsd * USD_TO_KRW;
  
  // 대안 컬럼들 (이미 KRW인 경우)
  const alternatives = ['상품금액', 'payment_amount', '총금액', 'price'];
  for (const col of alternatives) {
    const val = cleanAndParseFloat(row[col]);
    if (val > 0) return val;
  }
  return 0;
}

// RFM 세그먼트 정의
const RFM_SEGMENTS = {
  'Champions': { label: '챔피언', color: '#10B981', description: '최근 구매, 자주, 많이 구매하는 최우수 고객' },
  'Loyal': { label: '충성 고객', color: '#3B82F6', description: '꾸준히 구매하는 핵심 고객' },
  'Potential': { label: '성장 가능', color: '#8B5CF6', description: '최근 구매한 신규/성장 가능 고객' },
  'Promising': { label: '유망 고객', color: '#06B6D4', description: '관심을 보이는 잠재 고객' },
  'NeedsAttention': { label: '관심 필요', color: '#F59E0B', description: '구매 빈도가 줄어드는 고객' },
  'AtRisk': { label: '이탈 위험', color: '#EF4444', description: '이탈 위험이 높은 고객' },
  'Hibernating': { label: '휴면', color: '#6B7280', description: '장기간 구매하지 않은 고객' },
  'Lost': { label: '이탈', color: '#374151', description: '180일 이상 미구매 고객' },
};

/**
 * RFM 점수 계산
 */
function calculateRFMScore(
  recencyDays: number,
  frequency: number,
  monetary: number,
  avgRecency: number,
  avgFrequency: number,
  avgMonetary: number
): { R: number; F: number; M: number } {
  // R: 최근성 (낮을수록 좋음)
  let R = 1;
  if (recencyDays <= 7) R = 5;
  else if (recencyDays <= 14) R = 4;
  else if (recencyDays <= 30) R = 3;
  else if (recencyDays <= 60) R = 2;
  else R = 1;

  // F: 빈도 (높을수록 좋음)
  let F = 1;
  if (frequency >= 10) F = 5;
  else if (frequency >= 5) F = 4;
  else if (frequency >= 3) F = 3;
  else if (frequency >= 2) F = 2;
  else F = 1;

  // M: 금액 (높을수록 좋음) - 상대적 평가
  let M = 1;
  const mRatio = monetary / (avgMonetary || 1);
  if (mRatio >= 2) M = 5;
  else if (mRatio >= 1.5) M = 4;
  else if (mRatio >= 1) M = 3;
  else if (mRatio >= 0.5) M = 2;
  else M = 1;

  return { R, F, M };
}

/**
 * RFM 점수로 세그먼트 결정
 */
function getSegment(R: number, F: number, M: number): string {
  const score = R * 100 + F * 10 + M;
  
  // Champions: RFM 모두 높음
  if (R >= 4 && F >= 4 && M >= 4) return 'Champions';
  
  // Loyal: 빈도와 금액이 높음
  if (F >= 4 && M >= 4) return 'Loyal';
  
  // Potential: 최근 구매했지만 빈도 낮음
  if (R >= 4 && F <= 2) return 'Potential';
  
  // Promising: 적당한 점수
  if (R >= 3 && F >= 2 && M >= 2) return 'Promising';
  
  // Needs Attention: 중간 정도
  if (R >= 2 && R <= 3 && F >= 2) return 'NeedsAttention';
  
  // At Risk: 이전에 자주 구매했지만 최근 없음
  if (R <= 2 && F >= 3) return 'AtRisk';
  
  // Hibernating: 오래 안 샀지만 빈도 낮음
  if (R <= 2 && F <= 2 && M <= 2) return 'Hibernating';
  
  // Lost: 180일 이상
  if (R === 1 && F === 1) return 'Lost';
  
  return 'NeedsAttention';
}

/**
 * RFM 세그먼테이션 분석
 * GET /api/customer-analytics/rfm
 */
router.get('/rfm', async (req, res) => {
  try {
    console.log('[CustomerAnalytics] RFM analysis started');
    
    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    
    // user_locale 시트에서 지역 정보 로드
    let userLocaleMap = new Map<string, { country: string; region: string; timezone: string }>();
    try {
      const userLocaleData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.USER_LOCALE, false);
      userLocaleData.forEach((row: any) => {
        const userId = String(row.user_id || '');
        if (userId) {
          userLocaleMap.set(userId, {
            country: row.country_code || '',
            region: row.region || '',
            timezone: row.timezone || '',
          });
        }
      });
      console.log(`[CustomerAnalytics] Loaded ${userLocaleMap.size} user locale entries`);
    } catch (e) {
      console.warn('[CustomerAnalytics] user_locale not available:', e);
    }
    
    // 고객별 집계
    const customerMap = new Map<string, {
      userId: string;
      orders: { date: Date; amount: number; orderCode: string }[];
      country: string;
      region: string;
      lastOrderDate: Date;
    }>();

    const now = new Date();

    logisticsData.forEach((row: any) => {
      const userId = String(row.user_id || '');
      if (!userId) return;

      const orderDate = new Date(row.order_created);
      if (isNaN(orderDate.getTime())) return;

      // Total GMV (USD) → KRW 변환
      const amount = getGmvKrw(row);

      // user_locale에서 지역 정보 가져오기 (없으면 logistics의 country 사용)
      const locale = userLocaleMap.get(userId);
      const country = locale?.country || row.country || 'Unknown';
      const region = locale?.region || '';

      if (!customerMap.has(userId)) {
        customerMap.set(userId, {
          userId,
          orders: [],
          country,
          region,
          lastOrderDate: orderDate,
        });
      }

      const customer = customerMap.get(userId)!;
      
      // 중복 주문 제거 (order_code 기준)
      const existingOrder = customer.orders.find(o => o.orderCode === row.order_code);
      if (!existingOrder) {
        customer.orders.push({
          date: orderDate,
          amount,
          orderCode: row.order_code,
        });
      }

      if (orderDate > customer.lastOrderDate) {
        customer.lastOrderDate = orderDate;
        // 지역 정보 업데이트 (user_locale 우선)
        if (!locale) {
          customer.country = row.country || customer.country;
        }
      }
    });

    // 평균 계산
    let totalRecency = 0;
    let totalFrequency = 0;
    let totalMonetary = 0;
    let customerCount = 0;

    customerMap.forEach((customer) => {
      const recencyDays = Math.floor((now.getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
      const frequency = customer.orders.length;
      const monetary = customer.orders.reduce((sum, o) => sum + o.amount, 0);

      totalRecency += recencyDays;
      totalFrequency += frequency;
      totalMonetary += monetary;
      customerCount++;
    });

    const avgRecency = totalRecency / customerCount || 30;
    const avgFrequency = totalFrequency / customerCount || 1;
    const avgMonetary = totalMonetary / customerCount || 50000;

    // 세그먼트별 집계
    const segments: Record<string, {
      count: number;
      totalRevenue: number;
      avgOrderValue: number;
      customers: Array<{
        userId: string;
        country: string;
        region: string;
        recencyDays: number;
        frequency: number;
        monetary: number;
        rfmScore: string;
        lastOrderDate: string;
      }>;
    }> = {};

    Object.keys(RFM_SEGMENTS).forEach(seg => {
      segments[seg] = { count: 0, totalRevenue: 0, avgOrderValue: 0, customers: [] };
    });

    customerMap.forEach((customer) => {
      const recencyDays = Math.floor((now.getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
      const frequency = customer.orders.length;
      const monetary = customer.orders.reduce((sum, o) => sum + o.amount, 0);

      const { R, F, M } = calculateRFMScore(recencyDays, frequency, monetary, avgRecency, avgFrequency, avgMonetary);
      const segment = getSegment(R, F, M);

      if (segments[segment]) {
        segments[segment].count++;
        segments[segment].totalRevenue += monetary;
        segments[segment].customers.push({
          userId: customer.userId,
          country: customer.country,
          region: customer.region,
          recencyDays,
          frequency,
          monetary,
          rfmScore: `${R}${F}${M}`,
          lastOrderDate: customer.lastOrderDate.toISOString().split('T')[0],
        });
      }
    });

    // 평균 주문 금액 계산
    Object.keys(segments).forEach(seg => {
      const s = segments[seg];
      s.avgOrderValue = s.count > 0 ? Math.round(s.totalRevenue / s.count) : 0;
      // 상위 20명만 반환
      s.customers = s.customers
        .sort((a, b) => b.monetary - a.monetary)
        .slice(0, 20);
    });

    // 세그먼트 정보와 합치기
    const result = Object.entries(segments).map(([key, data]) => ({
      segment: key,
      ...RFM_SEGMENTS[key as keyof typeof RFM_SEGMENTS],
      ...data,
    }));

    console.log(`[CustomerAnalytics] RFM analysis complete: ${customerCount} customers`);

    res.json({
      success: true,
      summary: {
        totalCustomers: customerCount,
        avgRecencyDays: Math.round(avgRecency),
        avgFrequency: avgFrequency.toFixed(1),
        avgMonetary: Math.round(avgMonetary),
      },
      segments: result,
    });
  } catch (error: any) {
    console.error('[CustomerAnalytics] RFM error:', error?.message);
    res.status(500).json({ error: 'Failed to perform RFM analysis', details: error?.message });
  }
});

/**
 * 이탈 위험 고객 분석
 * GET /api/customer-analytics/churn-risk
 */
router.get('/churn-risk', async (req, res) => {
  try {
    console.log('[CustomerAnalytics] Churn risk analysis started');
    
    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    
    // user_locale 시트에서 지역 정보 로드
    let userLocaleMap = new Map<string, { country: string; region: string }>();
    try {
      const userLocaleData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.USER_LOCALE, false);
      userLocaleData.forEach((row: any) => {
        const userId = String(row.user_id || '');
        if (userId) {
          userLocaleMap.set(userId, {
            country: row.country_code || '',
            region: row.region || '',
          });
        }
      });
    } catch (e) {
      console.warn('[CustomerAnalytics] Churn: user_locale not available');
    }
    
    // 고객별 집계
    const customerMap = new Map<string, {
      userId: string;
      orders: { date: Date; amount: number }[];
      country: string;
      region: string;
      lastOrderDate: Date;
      totalAmount: number;
    }>();

    const now = new Date();

    logisticsData.forEach((row: any) => {
      const userId = String(row.user_id || '');
      if (!userId) return;

      const orderDate = new Date(row.order_created);
      if (isNaN(orderDate.getTime())) return;

      // Total GMV (USD) → KRW 변환
      const amount = getGmvKrw(row);

      // user_locale에서 지역 정보 가져오기
      const locale = userLocaleMap.get(userId);
      const country = locale?.country || row.country || 'Unknown';
      const region = locale?.region || '';

      if (!customerMap.has(userId)) {
        customerMap.set(userId, {
          userId,
          orders: [],
          country,
          region,
          lastOrderDate: orderDate,
          totalAmount: 0,
        });
      }

      const customer = customerMap.get(userId)!;
      customer.orders.push({ date: orderDate, amount });
      customer.totalAmount += amount;

      if (orderDate > customer.lastOrderDate) {
        customer.lastOrderDate = orderDate;
      }
    });

    // 이탈 위험 분류
    const highRisk: any[] = [];
    const mediumRisk: any[] = [];
    const lowRisk: any[] = [];

    customerMap.forEach((customer) => {
      const recencyDays = Math.floor((now.getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
      const frequency = customer.orders.length;
      
      // 평균 구매 주기 계산
      let avgPurchaseCycle = 0;
      if (customer.orders.length >= 2) {
        const sortedOrders = customer.orders.sort((a, b) => a.date.getTime() - b.date.getTime());
        let totalDays = 0;
        for (let i = 1; i < sortedOrders.length; i++) {
          totalDays += Math.floor((sortedOrders[i].date.getTime() - sortedOrders[i-1].date.getTime()) / (1000 * 60 * 60 * 24));
        }
        avgPurchaseCycle = totalDays / (sortedOrders.length - 1);
      }

      const customerData = {
        userId: customer.userId,
        country: customer.country,
        region: customer.region,
        recencyDays,
        frequency,
        totalAmount: customer.totalAmount,
        avgPurchaseCycle: Math.round(avgPurchaseCycle),
        lastOrderDate: customer.lastOrderDate.toISOString().split('T')[0],
        riskScore: 0,
        riskFactors: [] as string[],
      };

      // 이탈 위험 점수 계산
      let riskScore = 0;
      
      // 1. 최근성 기반
      if (recencyDays > 90) {
        riskScore += 40;
        customerData.riskFactors.push('90일 이상 미구매');
      } else if (recencyDays > 60) {
        riskScore += 30;
        customerData.riskFactors.push('60일 이상 미구매');
      } else if (recencyDays > 30) {
        riskScore += 15;
        customerData.riskFactors.push('30일 이상 미구매');
      }

      // 2. 구매 주기 초과
      if (avgPurchaseCycle > 0 && recencyDays > avgPurchaseCycle * 1.5) {
        riskScore += 25;
        customerData.riskFactors.push('평균 구매주기 초과');
      }

      // 3. 고가치 고객이 미구매
      if (customer.totalAmount > 200000 && recencyDays > 30) {
        riskScore += 20;
        customerData.riskFactors.push('VIP 고객 미구매');
      }

      // 4. 단일 구매 후 미복귀
      if (frequency === 1 && recencyDays > 30) {
        riskScore += 15;
        customerData.riskFactors.push('재구매 미발생');
      }

      customerData.riskScore = Math.min(riskScore, 100);

      // 분류
      if (riskScore >= 50) {
        highRisk.push(customerData);
      } else if (riskScore >= 25) {
        mediumRisk.push(customerData);
      } else if (riskScore > 0) {
        lowRisk.push(customerData);
      }
    });

    // 정렬 및 제한
    highRisk.sort((a, b) => b.riskScore - a.riskScore);
    mediumRisk.sort((a, b) => b.riskScore - a.riskScore);

    res.json({
      success: true,
      summary: {
        totalAtRisk: highRisk.length + mediumRisk.length,
        highRiskCount: highRisk.length,
        mediumRiskCount: mediumRisk.length,
        lowRiskCount: lowRisk.length,
        potentialRevenueLoss: highRisk.reduce((sum, c) => sum + c.totalAmount, 0),
      },
      highRisk: highRisk.slice(0, 50),
      mediumRisk: mediumRisk.slice(0, 50),
      lowRisk: lowRisk.slice(0, 20),
    });
  } catch (error: any) {
    console.error('[CustomerAnalytics] Churn risk error:', error?.message);
    res.status(500).json({ error: 'Failed to analyze churn risk', details: error?.message });
  }
});

/**
 * 코호트 리텐션 분석
 * GET /api/customer-analytics/cohort
 */
router.get('/cohort', async (req, res) => {
  try {
    console.log('[CustomerAnalytics] Cohort analysis started');
    
    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    
    // 고객별 첫 구매월과 이후 구매월 추적
    const customerFirstPurchase = new Map<string, Date>();
    const customerPurchaseMonths = new Map<string, Set<string>>();

    logisticsData.forEach((row: any) => {
      const userId = String(row.user_id || '');
      if (!userId) return;

      const orderDate = new Date(row.order_created);
      if (isNaN(orderDate.getTime())) return;

      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;

      // 첫 구매일 기록
      if (!customerFirstPurchase.has(userId) || orderDate < customerFirstPurchase.get(userId)!) {
        customerFirstPurchase.set(userId, orderDate);
      }

      // 구매월 기록
      if (!customerPurchaseMonths.has(userId)) {
        customerPurchaseMonths.set(userId, new Set());
      }
      customerPurchaseMonths.get(userId)!.add(monthKey);
    });

    // 코호트별 집계 (최근 6개월)
    const now = new Date();
    const cohorts: Record<string, {
      cohortMonth: string;
      size: number;
      retention: Record<number, number>; // month offset -> retained count
    }> = {};

    for (let i = 5; i >= 0; i--) {
      const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const cohortKey = `${cohortDate.getFullYear()}-${String(cohortDate.getMonth() + 1).padStart(2, '0')}`;
      cohorts[cohortKey] = {
        cohortMonth: cohortKey,
        size: 0,
        retention: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      };
    }

    // 각 고객의 코호트 할당 및 리텐션 계산
    customerFirstPurchase.forEach((firstDate, userId) => {
      const cohortKey = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (cohorts[cohortKey]) {
        cohorts[cohortKey].size++;
        cohorts[cohortKey].retention[0]++;

        // 이후 월 리텐션 체크
        const purchaseMonths = customerPurchaseMonths.get(userId) || new Set();
        
        for (let offset = 1; offset <= 6; offset++) {
          const targetDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + offset, 1);
          const targetKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (purchaseMonths.has(targetKey)) {
            cohorts[cohortKey].retention[offset]++;
          }
        }
      }
    });

    // 리텐션율 계산
    const cohortData = Object.values(cohorts).map(cohort => {
      const retentionRates: Record<number, number> = {};
      for (let i = 0; i <= 6; i++) {
        retentionRates[i] = cohort.size > 0 
          ? Math.round((cohort.retention[i] / cohort.size) * 100) 
          : 0;
      }
      return {
        ...cohort,
        retentionRates,
      };
    });

    // 전체 평균 리텐션
    const avgRetention: Record<number, number> = {};
    for (let i = 0; i <= 6; i++) {
      const validCohorts = cohortData.filter(c => c.size > 0 && c.retentionRates[i] !== undefined);
      avgRetention[i] = validCohorts.length > 0
        ? Math.round(validCohorts.reduce((sum, c) => sum + c.retentionRates[i], 0) / validCohorts.length)
        : 0;
    }

    res.json({
      success: true,
      cohorts: cohortData,
      avgRetention,
      summary: {
        totalCohorts: cohortData.length,
        avgM1Retention: avgRetention[1] || 0,
        avgM3Retention: avgRetention[3] || 0,
        avgM6Retention: avgRetention[6] || 0,
      },
    });
  } catch (error: any) {
    console.error('[CustomerAnalytics] Cohort error:', error?.message);
    res.status(500).json({ error: 'Failed to perform cohort analysis', details: error?.message });
  }
});

/**
 * LTV (고객 생애 가치) 분석
 * GET /api/customer-analytics/ltv
 */
router.get('/ltv', async (req, res) => {
  try {
    console.log('[CustomerAnalytics] LTV analysis started');
    
    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    
    // user_locale 시트에서 지역 정보 로드
    let userLocaleMap = new Map<string, { country: string; region: string }>();
    try {
      const userLocaleData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.USER_LOCALE, false);
      userLocaleData.forEach((row: any) => {
        const userId = String(row.user_id || '');
        if (userId) {
          userLocaleMap.set(userId, {
            country: row.country_code || '',
            region: row.region || '',
          });
        }
      });
      console.log(`[CustomerAnalytics] LTV: Loaded ${userLocaleMap.size} user locale entries`);
    } catch (e) {
      console.warn('[CustomerAnalytics] LTV: user_locale not available:', e);
    }
    
    // 고객별 집계
    const customerMap = new Map<string, {
      userId: string;
      orders: { date: Date; amount: number }[];
      country: string;
      region: string;
      firstOrderDate: Date;
      lastOrderDate: Date;
      totalAmount: number;
    }>();

    logisticsData.forEach((row: any) => {
      const userId = String(row.user_id || '');
      if (!userId) return;

      const orderDate = new Date(row.order_created);
      if (isNaN(orderDate.getTime())) return;

      // Total GMV (USD) → KRW 변환
      const amount = getGmvKrw(row);

      // user_locale에서 지역 정보 가져오기
      const locale = userLocaleMap.get(userId);
      const country = locale?.country || row.country || 'Unknown';
      const region = locale?.region || '';

      if (!customerMap.has(userId)) {
        customerMap.set(userId, {
          userId,
          orders: [],
          country,
          region,
          firstOrderDate: orderDate,
          lastOrderDate: orderDate,
          totalAmount: 0,
        });
      }

      const customer = customerMap.get(userId)!;
      customer.orders.push({ date: orderDate, amount });
      customer.totalAmount += amount;

      if (orderDate < customer.firstOrderDate) {
        customer.firstOrderDate = orderDate;
      }
      if (orderDate > customer.lastOrderDate) {
        customer.lastOrderDate = orderDate;
      }
    });

    // LTV 계산 및 세그먼트별 분류
    const ltvByCountry: Record<string, { count: number; totalLTV: number; avgLTV: number }> = {};
    const ltvDistribution = { low: 0, medium: 0, high: 0, vip: 0 };
    const topCustomers: any[] = [];

    let totalLTV = 0;

    customerMap.forEach((customer) => {
      const ltv = customer.totalAmount;
      totalLTV += ltv;

      // 국가별 집계
      if (!ltvByCountry[customer.country]) {
        ltvByCountry[customer.country] = { count: 0, totalLTV: 0, avgLTV: 0 };
      }
      ltvByCountry[customer.country].count++;
      ltvByCountry[customer.country].totalLTV += ltv;

      // LTV 분포
      if (ltv >= 500000) ltvDistribution.vip++;
      else if (ltv >= 200000) ltvDistribution.high++;
      else if (ltv >= 50000) ltvDistribution.medium++;
      else ltvDistribution.low++;

      // 상위 고객
      topCustomers.push({
        userId: customer.userId,
        country: customer.country,
        region: customer.region,
        ltv,
        orderCount: customer.orders.length,
        avgOrderValue: Math.round(ltv / customer.orders.length),
        firstOrder: customer.firstOrderDate.toISOString().split('T')[0],
        lastOrder: customer.lastOrderDate.toISOString().split('T')[0],
        lifetimeDays: Math.floor((customer.lastOrderDate.getTime() - customer.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)),
      });
    });

    // 국가별 평균 계산
    Object.keys(ltvByCountry).forEach(country => {
      const data = ltvByCountry[country];
      data.avgLTV = Math.round(data.totalLTV / data.count);
    });

    // 정렬
    const sortedCountries = Object.entries(ltvByCountry)
      .sort((a, b) => b[1].avgLTV - a[1].avgLTV)
      .slice(0, 10)
      .map(([country, data]) => ({ country, ...data }));

    topCustomers.sort((a, b) => b.ltv - a.ltv);

    const avgLTV = customerMap.size > 0 ? Math.round(totalLTV / customerMap.size) : 0;

    res.json({
      success: true,
      summary: {
        totalCustomers: customerMap.size,
        totalLTV,
        avgLTV,
        medianLTV: topCustomers.length > 0 
          ? topCustomers[Math.floor(topCustomers.length / 2)].ltv 
          : 0,
      },
      distribution: ltvDistribution,
      byCountry: sortedCountries,
      topCustomers: topCustomers.slice(0, 20),
    });
  } catch (error: any) {
    console.error('[CustomerAnalytics] LTV error:', error?.message);
    res.status(500).json({ error: 'Failed to analyze LTV', details: error?.message });
  }
});

/**
 * 쿠폰 시뮬레이터
 * POST /api/customer-analytics/coupon-simulate
 */
router.post('/coupon-simulate', async (req, res) => {
  try {
    const {
      targetSegments = [],
      discountType = 'fixed', // 'fixed' or 'percentage'
      discountValue = 0,
      minOrderAmount = 0,
      targetCountries = [],
    } = req.body;

    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    
    // 고객 데이터 집계 (RFM과 동일한 로직)
    const customerMap = new Map<string, {
      userId: string;
      country: string;
      totalAmount: number;
      orderCount: number;
      lastOrderDate: Date;
    }>();

    const now = new Date();

    logisticsData.forEach((row: any) => {
      const userId = String(row.user_id || '');
      if (!userId) return;

      const orderDate = new Date(row.order_created);
      if (isNaN(orderDate.getTime())) return;

      // Total GMV (USD) → KRW 변환
      const amount = getGmvKrw(row);

      if (!customerMap.has(userId)) {
        customerMap.set(userId, {
          userId,
          country: row.country || 'Unknown',
          totalAmount: 0,
          orderCount: 0,
          lastOrderDate: orderDate,
        });
      }

      const customer = customerMap.get(userId)!;
      customer.totalAmount += amount;
      customer.orderCount++;

      if (orderDate > customer.lastOrderDate) {
        customer.lastOrderDate = orderDate;
        customer.country = row.country || customer.country;
      }
    });

    // 타겟 고객 필터링
    let targetCustomers = Array.from(customerMap.values());

    // 국가 필터
    if (targetCountries.length > 0) {
      targetCustomers = targetCustomers.filter(c => targetCountries.includes(c.country));
    }

    // 세그먼트 필터 (간단한 버전)
    if (targetSegments.length > 0) {
      targetCustomers = targetCustomers.filter(c => {
        const recencyDays = Math.floor((now.getTime() - c.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (targetSegments.includes('AtRisk') && recencyDays > 30 && recencyDays <= 90) return true;
        if (targetSegments.includes('Hibernating') && recencyDays > 90) return true;
        if (targetSegments.includes('Loyal') && c.orderCount >= 3) return true;
        if (targetSegments.includes('Champions') && c.orderCount >= 5 && c.totalAmount > 200000) return true;
        
        return false;
      });
    }

    // 시뮬레이션 계산
    const targetCount = targetCustomers.length;
    const avgOrderValue = targetCount > 0 
      ? targetCustomers.reduce((sum, c) => sum + c.totalAmount / c.orderCount, 0) / targetCount 
      : 50000;

    // 예상 사용률 (세그먼트에 따라 다름)
    let expectedUsageRate = 0.10; // 기본 10%
    if (targetSegments.includes('AtRisk')) expectedUsageRate = 0.15;
    if (targetSegments.includes('Hibernating')) expectedUsageRate = 0.08;
    if (targetSegments.includes('Champions')) expectedUsageRate = 0.25;

    const expectedUsers = Math.round(targetCount * expectedUsageRate);
    const expectedRevenue = expectedUsers * avgOrderValue;
    const couponCost = discountType === 'fixed' 
      ? expectedUsers * discountValue 
      : expectedUsers * avgOrderValue * (discountValue / 100);
    
    const netRevenue = expectedRevenue - couponCost;
    const roi = couponCost > 0 ? ((netRevenue / couponCost) * 100).toFixed(0) : 0;

    res.json({
      success: true,
      simulation: {
        targetCount,
        expectedUsageRate: (expectedUsageRate * 100).toFixed(0) + '%',
        expectedUsers,
        avgOrderValue: Math.round(avgOrderValue),
        expectedRevenue: Math.round(expectedRevenue),
        couponCost: Math.round(couponCost),
        netRevenue: Math.round(netRevenue),
        roi: roi + '%',
      },
      targetBreakdown: {
        byCountry: targetCustomers.reduce((acc, c) => {
          acc[c.country] = (acc[c.country] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error: any) {
    console.error('[CustomerAnalytics] Coupon simulate error:', error?.message);
    res.status(500).json({ error: 'Failed to simulate coupon', details: error?.message });
  }
});

export default router;

