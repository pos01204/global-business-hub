import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';
import { getProductUrl } from '../utils/tracking';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 성과 분석 데이터 조회
 * GET /api/analytics?dateRange=30d&countryFilter=all
 */
router.get('/', async (req, res) => {
  try {
    const dateRange = (req.query.dateRange as string) || '30d';
    const countryFilter = (req.query.countryFilter as string) || 'all';

    const USD_TO_KRW_RATE = 1350.0;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const cleanAndParseFloat = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value.replace(/,/g, '')) || 0;
      return 0;
    };

    // 데이터 로드
    let logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    let orderData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, false);
    const usersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.USERS, false);

    // 사용자 맵 생성
    const userMap = new Map<number, any>();
    usersData.forEach((row: any) => {
      const userId = parseInt(row.ID);
      if (!isNaN(userId)) {
        userMap.set(userId, row);
      }
    });

    // 국가 필터링
    if (countryFilter === 'jp') {
      logisticsData = logisticsData.filter((row: any) => row.country === 'JP');
      orderData = orderData.filter((row: any) => {
        const userId = parseInt(row.user_id);
        const userInfo = userMap.get(userId);
        return userInfo && userInfo.COUNTRY === 'JP';
      });
    } else if (countryFilter === 'non_jp') {
      logisticsData = logisticsData.filter((row: any) => row.country !== 'JP');
      orderData = orderData.filter((row: any) => {
        const userId = parseInt(row.user_id);
        const userInfo = userMap.get(userId);
        return !userInfo || userInfo.COUNTRY !== 'JP';
      });
    }

    // 기간 필터링
    const days = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }[dateRange] || 30;
    const endDate = new Date(now);
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const prevEndDate = new Date(startDate.getTime() - 1);
    prevEndDate.setHours(23, 59, 59, 999);
    const prevStartDate = new Date(prevEndDate.getTime() - days * 24 * 60 * 60 * 1000 + 1);
    prevStartDate.setHours(0, 0, 0, 0);

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

    const currentPeriodLogisticsData = filterByDate(logisticsData, startDate, endDate);
    const previousPeriodLogisticsData = filterByDate(
      await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true),
      prevStartDate,
      prevEndDate
    );

    // 매출 KPI 계산
    const calculateSalesKpis = (logisticsSubset: any[]) => {
      let totalSalesInKrw = 0;
      const orderCodes = new Set<string>();
      logisticsSubset.forEach((row: any) => {
        const sales = cleanAndParseFloat(row['Total GMV']);
        totalSalesInKrw += sales * USD_TO_KRW_RATE;
        if (row.order_code) orderCodes.add(row.order_code);
      });
      const orderCount = orderCodes.size;
      const aov = orderCount > 0 ? totalSalesInKrw / orderCount : 0;
      return { totalSales: totalSalesInKrw, orderCount, aov };
    };

    const currentKpis = calculateSalesKpis(currentPeriodLogisticsData);
    const previousKpis = calculateSalesKpis(previousPeriodLogisticsData);

    const getChange = (current: number, previous: number): number => {
      if (previous === 0 && current > 0) return Infinity;
      if (previous === 0 && current === 0) return 0;
      return (current - previous) / previous;
    };

    // 주문 코드 -> 사용자 ID 매핑
    const orderCodeToUserId: Record<string, number> = {};
    orderData.forEach((row: any) => {
      const userId = parseInt(row.user_id);
      if (!isNaN(userId) && row.order_code) {
        orderCodeToUserId[row.order_code] = userId;
      }
    });

    // Top 상품/작가 계산
    const productSales: Record<string, { sales: number; quantity: number; id: string; country: string }> = {};
    const artistMetrics: Record<string, { sales: number; orderCodes: Set<string> }> = {};

    currentPeriodLogisticsData.forEach((row: any) => {
      const salesInKrw = cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW_RATE;
      if (isNaN(salesInKrw) || salesInKrw <= 0) return;

      const artistName = row['artist_name (kr)'];
      const productName = row.product_name || '정보 없음';
      const productId = row.product_id;
      const country = row.country;
      const orderCode = row.order_code;

      let quantity = 1;
      if (row['구매수량']) {
        const parsedQty = parseInt(String(row['구매수량']).replace(/,/g, ''));
        if (!isNaN(parsedQty) && parsedQty > 0) quantity = parsedQty;
      }

      if (productName !== '정보 없음' && productId) {
        if (!productSales[productName]) {
          productSales[productName] = { sales: 0, quantity: 0, id: productId, country };
        }
        productSales[productName].sales += salesInKrw;
        productSales[productName].quantity += quantity;
      }

      if (artistName && orderCode) {
        if (!artistMetrics[artistName]) {
          artistMetrics[artistName] = { sales: 0, orderCodes: new Set() };
        }
        artistMetrics[artistName].sales += salesInKrw;
        artistMetrics[artistName].orderCodes.add(orderCode);
      }
    });

    const topProductsBySales = Object.entries(productSales)
      .sort(([, a], [, b]) => b.sales - a.sales)
      .slice(0, 10)
      .map(([name, data]) => [name, Math.round(data.sales), getProductUrl(data.country, data.id)]);

    const topProductsByQuantity = Object.entries(productSales)
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(([name, data]) => [name, data.quantity, getProductUrl(data.country, data.id)]);

    const topArtistsBySales = Object.entries(artistMetrics)
      .map(([name, data]) => [name, Math.round(data.sales)])
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10);

    const topArtistsByOrders = Object.entries(artistMetrics)
      .map(([name, data]) => [name, data.orderCodes.size])
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10);

    // 채널 분석
    const currentPeriodOrderData = filterByDate(orderData, startDate, endDate);
    const previousPeriodOrderData = filterByDate(orderData, prevStartDate, prevEndDate);
    
    const platformRevenue: Record<string, number> = {};
    const platformOrderCount: Record<string, Set<string>> = {};
    const platformCustomers: Record<string, Set<number>> = {};
    const platformAov: Record<string, number[]> = {};
    const pgCounts: Record<string, number> = {};
    const methodCounts: Record<string, number> = {};
    
    // 이전 기간 데이터
    const prevPlatformRevenue: Record<string, number> = {};
    const prevPlatformOrderCount: Record<string, Set<string>> = {};

    currentPeriodOrderData.forEach((row: any) => {
      const krwValue = cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW_RATE;
      const platform = row.platform || 'N/A';
      const pg = row.PG사 || 'N/A';
      const method = row.method || 'N/A';
      const userId = parseInt(row.user_id) || 0;
      const orderCode = row.order_code;

      if (!isNaN(krwValue)) {
        platformRevenue[platform] = (platformRevenue[platform] || 0) + krwValue;
        if (!platformAov[platform]) platformAov[platform] = [];
        platformAov[platform].push(krwValue);
      }
      if (!platformOrderCount[platform]) platformOrderCount[platform] = new Set();
      if (orderCode) platformOrderCount[platform].add(orderCode);
      if (!platformCustomers[platform]) platformCustomers[platform] = new Set();
      if (userId > 0) platformCustomers[platform].add(userId);
      
      pgCounts[pg] = (pgCounts[pg] || 0) + 1;
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    previousPeriodOrderData.forEach((row: any) => {
      const krwValue = cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW_RATE;
      const platform = row.platform || 'N/A';
      const orderCode = row.order_code;

      if (!isNaN(krwValue)) {
        prevPlatformRevenue[platform] = (prevPlatformRevenue[platform] || 0) + krwValue;
      }
      if (!prevPlatformOrderCount[platform]) prevPlatformOrderCount[platform] = new Set();
      if (orderCode) prevPlatformOrderCount[platform].add(orderCode);
    });

    // 채널별 상세 통계 계산
    const channelStats = Object.keys(platformRevenue).map((platform) => {
      const revenue = platformRevenue[platform];
      const orderCount = platformOrderCount[platform]?.size || 0;
      const customerCount = platformCustomers[platform]?.size || 0;
      const aovValues = platformAov[platform] || [];
      const avgAov = aovValues.length > 0 
        ? aovValues.reduce((sum, val) => sum + val, 0) / aovValues.length 
        : 0;
      
      const prevRevenue = prevPlatformRevenue[platform] || 0;
      const prevOrderCount = prevPlatformOrderCount[platform]?.size || 0;
      
      const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
      const orderChange = prevOrderCount > 0 ? ((orderCount - prevOrderCount) / prevOrderCount) * 100 : 0;
      
      return {
        platform,
        revenue: Math.round(revenue),
        orderCount,
        customerCount,
        aov: Math.round(avgAov),
        revenueChange: Math.round(revenueChange * 10) / 10,
        orderChange: Math.round(orderChange * 10) / 10,
        share: currentKpis.totalSales > 0 ? (revenue / currentKpis.totalSales) * 100 : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Chart.js 형식으로 변환
    const formatChartData = (data: Array<[string, number]>, labelName = 'Data') => {
      const labels = data.map(([label]) => label);
      const values = data.map(([, value]) => value);
      return {
        labels,
        datasets: [
          {
            label: labelName,
            data: values,
          },
        ],
      };
    };

    const platformChart = formatChartData(
      Object.entries(platformRevenue)
        .sort(([, a], [, b]) => b - a)
        .map(([label, value]) => [label, Math.round(value)])
    );

    const pgChart = formatChartData(
      Object.entries(pgCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([label, value]) => [label, value])
    );

    const methodChart = formatChartData(
      Object.entries(methodCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([label, value]) => [label, value])
    );

    // 지역 성과 (전체 국가일 때만)
    let regionalPerformance: any[] = [];
    if (countryFilter === 'all') {
      const countryPerformanceData: Record<string, { totalOriginalSales: number; orderCodes: Set<string> }> = {};
      currentPeriodLogisticsData.forEach((row: any) => {
        const country = row.country || 'N/A';
        if (country === 'N/A') return;
        if (!countryPerformanceData[country]) {
          countryPerformanceData[country] = { totalOriginalSales: 0, orderCodes: new Set() };
        }
        countryPerformanceData[country].totalOriginalSales += cleanAndParseFloat(row['Total GMV']);
        if (row.order_code) countryPerformanceData[country].orderCodes.add(row.order_code);
      });

      const totalSalesAllCountries = currentKpis.totalSales;
      regionalPerformance = Object.entries(countryPerformanceData)
        .map(([country, data]) => {
          const orderCount = data.orderCodes.size;
          const totalSalesInKrw = data.totalOriginalSales * USD_TO_KRW_RATE;
          const aovInKrw = orderCount > 0 ? totalSalesInKrw / orderCount : 0;
          return {
            country,
            totalOriginalSales: data.totalOriginalSales,
            currency: 'USD',
            totalSalesInKrw,
            salesShare: totalSalesAllCountries > 0 ? totalSalesInKrw / totalSalesAllCountries : 0,
            orderCount,
            aovInKrw,
          };
        })
        .sort((a, b) => b.totalSalesInKrw - a.totalSalesInKrw);
    }

    // 고객 DB 구축 (활동 상태 계산용)
    const customerDb: Record<
      number,
      {
        userId: number
        orders: Array<{ date: Date; amount: number; orderCode: string }>
        totalAmount: number
        orderCount: number
        lastOrderDate: Date
        firstOrderDate: Date
        artistSet: Set<string>
        productCountPerOrder: Record<string, number>
      }
    > = {}

    orderData.forEach((row: any) => {
      try {
        const userId = parseInt(row.user_id)
        if (!userId || isNaN(userId)) return
        const orderCode = row.order_code
        if (orderCode) orderCodeToUserId[orderCode] = userId

        if (!customerDb[userId]) {
          customerDb[userId] = {
            userId,
            orders: [],
            totalAmount: 0,
            orderCount: 0,
            lastOrderDate: new Date('1970-01-01'),
            firstOrderDate: new Date('9999-12-31'),
            artistSet: new Set(),
            productCountPerOrder: {},
          }
        }

        let orderDate: Date
        try {
          orderDate = new Date(row.order_created)
          if (isNaN(orderDate.getTime())) throw new Error('Invalid Date')
        } catch (e) {
          return
        }

        const amount = cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW_RATE
        if (!isNaN(amount) && amount >= 0) {
          customerDb[userId].orders.push({ date: orderDate, amount, orderCode })
          customerDb[userId].totalAmount += amount
          customerDb[userId].orderCount++
          if (orderDate > customerDb[userId].lastOrderDate) {
            customerDb[userId].lastOrderDate = orderDate
          }
          if (orderDate < customerDb[userId].firstOrderDate) {
            customerDb[userId].firstOrderDate = orderDate
          }
        }
      } catch (e) {
        // 에러 무시
      }
    })

    logisticsData.forEach((row: any) => {
      try {
        const userId = orderCodeToUserId[row.order_code]
        if (!userId || !customerDb[userId]) return
        const artistName = row['artist_name (kr)']
        if (artistName) customerDb[userId].artistSet.add(artistName)
        const orderCode = row.order_code
        let quantity = 1
        if (row['구매수량']) {
          const parsedQty = parseInt(String(row['구매수량']).replace(/,/g, ''))
          if (!isNaN(parsedQty) && parsedQty > 0) quantity = parsedQty
        }
        customerDb[userId].productCountPerOrder[orderCode] =
          (customerDb[userId].productCountPerOrder[orderCode] || 0) + quantity
      } catch (e) {
        // 에러 무시
      }
    })

    // 활동 상태 계산
    const activitySummary = { active: 0, inactive: 0, churnRisk: 0, noPurchase: 0 }
    const activityThresholds = { active: 90, inactive: 180 }

    Object.values(customerDb).forEach((customer) => {
      let status = 'noPurchase'
      if (
        customer.orderCount > 0 &&
        customer.lastOrderDate instanceof Date &&
        !isNaN(customer.lastOrderDate.getTime()) &&
        customer.lastOrderDate.getFullYear() !== 1970
      ) {
        const lastOrderDay = new Date(
          customer.lastOrderDate.getFullYear(),
          customer.lastOrderDate.getMonth(),
          customer.lastOrderDate.getDate()
        )
        const daysSinceLastOrder = (today.getTime() - lastOrderDay.getTime()) / (1000 * 60 * 60 * 24)

        if (daysSinceLastOrder <= activityThresholds.active) {
          status = 'active'
        } else if (daysSinceLastOrder <= activityThresholds.inactive) {
          status = 'inactive'
        } else {
          status = 'churnRisk'
        }
      }
      if (status !== 'noPurchase' && activitySummary[status as keyof typeof activitySummary] !== undefined) {
        activitySummary[status as keyof typeof activitySummary]++
      }
    })

    // 구매 이력 없는 유저 계산
    const userDataValues = Array.from(userMap.values())
    const filteredUserDataValues =
      countryFilter === 'jp'
        ? userDataValues.filter((user: any) => user.COUNTRY === 'JP')
        : countryFilter === 'non_jp'
          ? userDataValues.filter((user: any) => user.COUNTRY !== 'JP')
          : userDataValues
    activitySummary.noPurchase = filteredUserDataValues.length - Object.keys(customerDb).length

    // RFM 세그먼트 분석 (기간 내 활동 고객 대상)
    const activeUserIdsInPeriod = new Set<number>()
    currentPeriodLogisticsData.forEach((row: any) => {
      const userId = orderCodeToUserId[row.order_code]
      if (userId) activeUserIdsInPeriod.add(userId)
    })

    const rfmSegments: {
      vip: Array<{
        userId: number
        name: string
        country: string
        R: number
        F: number
        M: number
        artistCount: number
        firstOrderAmount: number
        firstOrderDate: string
        lastOrderDate: string
      }>
      potential: Array<{
        userId: number
        name: string
        country: string
        R: number
        F: number
        M: number
        artistCount: number
        firstOrderAmount: number
        firstOrderDate: string
        lastOrderDate: string
      }>
      new: Array<{
        userId: number
        name: string
        country: string
        R: number
        F: number
        M: number
        artistCount: number
        firstOrderAmount: number
        firstOrderDate: string
        lastOrderDate: string
      }>
    } = { vip: [], potential: [], new: [] }

    activeUserIdsInPeriod.forEach((userId) => {
      const data = customerDb[userId]
      if (!data || !data.orders || data.orders.length === 0) return

      const userInfo = userMap.get(userId)
      const R =
        data.lastOrderDate instanceof Date &&
        !isNaN(data.lastOrderDate.getTime()) &&
        data.lastOrderDate.getFullYear() !== 1970
          ? Math.floor(
              (today.getTime() -
                new Date(
                  data.lastOrderDate.getFullYear(),
                  data.lastOrderDate.getMonth(),
                  data.lastOrderDate.getDate()
                ).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : Infinity
      const F = data.orderCount
      const M = data.totalAmount
      const A = data.artistSet.size

      let firstOrder: { date: Date; amount: number; orderCode: string } | null = null
      if (
        data.firstOrderDate instanceof Date &&
        data.firstOrderDate.getFullYear() !== 9999
      ) {
        firstOrder = data.orders.find(
          (o) => o.date.getTime() === data.firstOrderDate.getTime()
        ) || null
      }

      const firstOrderProdCnt =
        firstOrder && firstOrder.orderCode
          ? data.productCountPerOrder[firstOrder.orderCode] || 0
          : 0
      const firstOrderAmount = firstOrder ? firstOrder.amount || 0 : 0
      const firstOrderDateStr =
        data.firstOrderDate instanceof Date &&
        data.firstOrderDate.getFullYear() !== 9999
          ? data.firstOrderDate.toLocaleDateString('ko-KR')
          : 'N/A'
      const lastOrderDateStr =
        data.lastOrderDate instanceof Date &&
        data.lastOrderDate.getFullYear() !== 1970
          ? data.lastOrderDate.toLocaleDateString('ko-KR')
          : 'N/A'

      const stats = {
        userId,
        name: userInfo ? userInfo.NAME : 'N/A',
        country: userInfo ? userInfo.COUNTRY : 'N/A',
        R: R === Infinity ? Infinity : R,
        F,
        M,
        artistCount: A,
        firstOrderAmount,
        firstOrderProductCount: firstOrderProdCnt,
        firstOrderDate: firstOrderDateStr,
        lastOrderDate: lastOrderDateStr,
      }

      let seg = 'other'
      if (F === 1) {
        seg = 'new'
      } else if (F >= 5 && M >= 1000000 && R <= activityThresholds.active) {
        seg = 'vip'
      } else if (F >= 2 && M >= 300000 && R <= activityThresholds.inactive) {
        seg = 'potential'
      }

      if (seg === 'vip' && rfmSegments.vip) {
        rfmSegments.vip.push(stats)
      } else if (seg === 'potential' && rfmSegments.potential) {
        rfmSegments.potential.push(stats)
      } else if (seg === 'new' && rfmSegments.new) {
        rfmSegments.new.push(stats)
      }
    })

    const topVips = rfmSegments.vip.sort((a, b) => b.M - a.M).slice(0, 10)
    const topPotentials = rfmSegments.potential.sort((a, b) => b.artistCount - a.artistCount).slice(0, 10)
    const topNewCustomers = rfmSegments.new.sort((a, b) => b.firstOrderAmount - a.firstOrderAmount).slice(0, 10)

    // 생애주기 상태 계산 및 요약
    const lifecycleSummary: Record<string, number> = {
      New: 0,
      Growing: 0,
      Core: 0,
      Dormant: 0,
      Churned: 0,
      Prospect: 0,
    }
    const lifecycleThresholds = { newDays: 90, coreDays: 365, dormantDays: 180 }
    const lifecycleRevenue: Record<string, number> = {
      New: 0,
      Growing: 0,
      Core: 0,
      Dormant: 0,
      Churned: 0,
      Prospect: 0,
    }

    filteredUserDataValues.forEach((user: any) => {
      const userId = parseInt(user.ID)
      if (isNaN(userId)) return
      const customerData = customerDb[userId]
      let lifecycleStatus = 'Prospect'
      let createdAt: Date | null = null
      try {
        createdAt = new Date(user.CREATED_AT)
        if (isNaN(createdAt.getTime())) createdAt = null
      } catch (e) {
        // 무시
      }

      if (createdAt) {
        const daysSinceSignup =
          (today.getTime() -
            new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate()).getTime()) /
          (1000 * 60 * 60 * 24)

        if (
          customerData &&
          customerData.orderCount > 0 &&
          customerData.lastOrderDate instanceof Date &&
          !isNaN(customerData.lastOrderDate.getTime()) &&
          customerData.lastOrderDate.getFullYear() !== 1970
        ) {
          const lastOrderDay = new Date(
            customerData.lastOrderDate.getFullYear(),
            customerData.lastOrderDate.getMonth(),
            customerData.lastOrderDate.getDate()
          )
          const daysSinceLastOrder =
            (today.getTime() - lastOrderDay.getTime()) / (1000 * 60 * 60 * 24)

          if (
            daysSinceSignup <= lifecycleThresholds.newDays &&
            daysSinceLastOrder <= activityThresholds.active
          ) {
            lifecycleStatus = 'New'
          } else if (daysSinceLastOrder <= activityThresholds.active) {
            if (daysSinceSignup <= lifecycleThresholds.coreDays) {
              lifecycleStatus = 'Growing'
            } else {
              lifecycleStatus = 'Core'
            }
          } else if (daysSinceLastOrder <= lifecycleThresholds.dormantDays) {
            lifecycleStatus = 'Dormant'
          } else {
            lifecycleStatus = 'Churned'
          }
        }
      }

      if (lifecycleSummary[lifecycleStatus] !== undefined) {
        lifecycleSummary[lifecycleStatus]++
      }
    })

    // 생애주기별 매출 기여도 계산
    currentPeriodLogisticsData.forEach((row: any) => {
      const userId = orderCodeToUserId[row.order_code]
      if (!userId) return
      const userInfo = userMap.get(userId)
      if (!userInfo) return

      const customerData = customerDb[userId]
      if (!customerData || customerData.orderCount === 0) return

      let lifecycleStatus = 'Prospect'
      let createdAt: Date | null = null
      try {
        createdAt = new Date(userInfo.CREATED_AT)
        if (isNaN(createdAt.getTime())) createdAt = null
      } catch (e) {
        // 무시
      }

      if (createdAt) {
        const daysSinceSignup =
          (today.getTime() -
            new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate()).getTime()) /
          (1000 * 60 * 60 * 24)

        if (
          customerData.lastOrderDate instanceof Date &&
          !isNaN(customerData.lastOrderDate.getTime()) &&
          customerData.lastOrderDate.getFullYear() !== 1970
        ) {
          const lastOrderDay = new Date(
            customerData.lastOrderDate.getFullYear(),
            customerData.lastOrderDate.getMonth(),
            customerData.lastOrderDate.getDate()
          )
          const daysSinceLastOrder =
            (today.getTime() - lastOrderDay.getTime()) / (1000 * 60 * 60 * 24)

          if (
            daysSinceSignup <= lifecycleThresholds.newDays &&
            daysSinceLastOrder <= activityThresholds.active
          ) {
            lifecycleStatus = 'New'
          } else if (daysSinceLastOrder <= activityThresholds.active) {
            if (daysSinceSignup <= lifecycleThresholds.coreDays) {
              lifecycleStatus = 'Growing'
            } else {
              lifecycleStatus = 'Core'
            }
          } else if (daysSinceLastOrder <= lifecycleThresholds.dormantDays) {
            lifecycleStatus = 'Dormant'
          } else {
            lifecycleStatus = 'Churned'
          }
        }
      }

      const salesInKrw = cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW_RATE
      if (lifecycleRevenue[lifecycleStatus] !== undefined && !isNaN(salesInKrw)) {
        lifecycleRevenue[lifecycleStatus] += salesInKrw
      }
    })

    // Chart.js 형식으로 변환
    const lifecycleDistributionChart = formatChartData(
      Object.entries(lifecycleSummary).map(([k, v]) => [k, v])
    )
    const lifecycleRevenueChart = formatChartData(
      Object.entries(lifecycleRevenue).map(([k, v]) => [k, Math.round(v)])
    )

    // 사용자 확보 분석
    const monthlySignups: Record<string, number> = {}
    const monthlyFtps: Record<string, number> = {}
    const newUserCountriesData: Record<string, number> = {}
    const acquisitionKpis = { totalNewUsers: 0, totalFtps: 0, cvr: 0.0 }

    filteredUserDataValues.forEach((u: any) => {
      try {
        if (!u || !u.CREATED_AT) return
        let cD: Date | null = null
        try {
          cD = new Date(u.CREATED_AT)
          if (isNaN(cD.getTime())) return
        } catch (e) {
          return
        }

        const userId = parseInt(u.ID)
        if (isNaN(userId)) return
        const customerData = customerDb[userId]
        const isFtp =
          customerData &&
          customerData.firstOrderDate instanceof Date &&
          customerData.firstOrderDate.getFullYear() !== 9999

        if (cD >= startDate && cD <= endDate) {
          acquisitionKpis.totalNewUsers++
          if (isFtp) {
            acquisitionKpis.totalFtps++
          }
          const c = u.COUNTRY || 'N/A'
          newUserCountriesData[c] = (newUserCountriesData[c] || 0) + 1
        }

        const yM = `${cD.getFullYear()}-${String(cD.getMonth() + 1).padStart(2, '0')}`
        monthlySignups[yM] = (monthlySignups[yM] || 0) + 1
        if (isFtp) {
          monthlyFtps[yM] = (monthlyFtps[yM] || 0) + 1
        }
      } catch (e) {
        // 에러 무시
      }
    })

    if (acquisitionKpis.totalNewUsers > 0) {
      acquisitionKpis.cvr = acquisitionKpis.totalFtps / acquisitionKpis.totalNewUsers
    }

    // 트렌드 차트 데이터 생성
    const acquisitionTrendData: Array<[string, number, number]> = [['월', 0, 0]]
    const sortedMonths = Object.keys(monthlySignups).sort()
    sortedMonths.forEach((m) => {
      const signups = monthlySignups[m] || 0
      const ftps = monthlyFtps[m] || 0
      const cvr = signups > 0 ? ftps / signups : 0
      acquisitionTrendData.push([m, signups, cvr])
    })

    // Chart.js 형식으로 변환 (Bar + Line 혼합)
    const acquisitionTrendChart = {
      labels: acquisitionTrendData.slice(1).map((row) => row[0]),
      datasets: [
        {
          label: '신규 가입자 수',
          data: acquisitionTrendData.slice(1).map((row) => row[1]),
          type: 'bar' as const,
          backgroundColor: 'rgba(74, 111, 165, 0.6)',
          yAxisID: 'ySignups',
        },
        {
          label: '첫 구매 전환율',
          data: acquisitionTrendData.slice(1).map((row) => row[2]),
          type: 'line' as const,
          borderColor: '#F79F79',
          backgroundColor: '#F79F79',
          borderWidth: 2,
          yAxisID: 'yCvr',
        },
      ],
    }

    const newUserCountriesChart = formatChartData(
      Object.entries(newUserCountriesData)
        .sort(([, a], [, b]) => b - a)
        .map(([c, n]) => [c, n])
    )

    res.json({
      kpis: {
        totalSales: {
          value: currentKpis.totalSales,
          change: getChange(currentKpis.totalSales, previousKpis.totalSales),
        },
        aov: {
          value: currentKpis.aov,
          change: getChange(currentKpis.aov, previousKpis.aov),
        },
        orderCount: {
          value: currentKpis.orderCount,
          change: getChange(currentKpis.orderCount, previousKpis.orderCount),
        },
      },
      rankings: {
        topProductsBySales,
        topProductsByQuantity,
        topArtistsBySales,
        topArtistsByOrders,
      },
      charts: {
        platformChart,
        pgChart,
        methodChart,
      },
      channelAnalysis: {
        stats: channelStats,
        totalChannels: channelStats.length,
      },
      regionalPerformance,
      activitySummary,
      rfm: {
        topVips,
        topPotentials,
        topNewCustomers,
      },
      lifecycle: {
        distribution: lifecycleDistributionChart,
        revenue: lifecycleRevenueChart,
      },
      acquisition: {
        kpis: acquisitionKpis,
        trend: acquisitionTrendChart,
        countries: newUserCountriesChart,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

export default router;

