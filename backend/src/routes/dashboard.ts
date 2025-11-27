import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 메인 대시보드 데이터 조회
 * GET /api/dashboard/main?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/main', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 날짜 유효성 검사
    let validStartDate = startDate as string;
    let validEndDate = endDate as string;

    if (!validStartDate || !validEndDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 29);
      
      validEndDate = today.toISOString().split('T')[0];
      validStartDate = thirtyDaysAgo.toISOString().split('T')[0];
    }

    // Google Sheets 연결 확인
    const connectionStatus = await sheetsService.checkConnection();
    if (!connectionStatus.connected) {
      console.error('[Dashboard] Google Sheets 연결 실패:', connectionStatus.error);
      return res.status(503).json({
        error: 'Google Sheets에 연결할 수 없습니다.',
        details: connectionStatus.error,
        troubleshooting: [
          '1. Railway Variables에서 다음 환경 변수를 확인하세요:',
          '   - GOOGLE_SHEETS_SPREADSHEET_ID',
          '   - GOOGLE_SHEETS_CLIENT_EMAIL',
          '   - GOOGLE_SHEETS_PRIVATE_KEY',
          '2. 서비스 계정이 스프레드시트에 접근 권한이 있는지 확인하세요.',
          '3. 스프레드시트 ID가 올바른지 확인하세요.',
        ],
      });
    }

    // logistics 데이터 로드
    let logisticsData: any[] = [];
    try {
      logisticsData = await sheetsService.getSheetDataAsJson(
        SHEET_NAMES.LOGISTICS,
        true // fill-down 활성화
      );
      console.log(`[Dashboard] Logistics 데이터 로드 완료: ${logisticsData.length}건`);
    } catch (error: any) {
      console.error('[Dashboard] Logistics 데이터 로드 실패:', error.message);
      return res.status(500).json({
        error: 'Logistics 데이터를 불러오는 중 오류가 발생했습니다.',
        details: error.message,
        troubleshooting: [
          `시트 이름 '${SHEET_NAMES.LOGISTICS}'이 스프레드시트에 존재하는지 확인하세요.`,
          '서비스 계정이 스프레드시트에 접근 권한이 있는지 확인하세요.',
        ],
      });
    }

    // 날짜 필터링
    const start = new Date(validStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(validEndDate);
    end.setHours(23, 59, 59, 999);

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

    const currentPeriodData = filterDataByDate(logisticsData, start, end);

    // 이전 기간 계산
    const periodDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const prevEnd = new Date(start.getTime() - 1);
    prevEnd.setHours(23, 59, 59, 999);
    const prevStart = new Date(prevEnd.getTime() - ((periodDays - 1) * 24 * 60 * 60 * 1000));
    prevStart.setHours(0, 0, 0, 0);

    const previousPeriodData = filterDataByDate(logisticsData, prevStart, prevEnd);

    // KPI 계산
    const USD_TO_KRW_RATE = 1350.0;
    const cleanAndParseFloat = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value.replace(/,/g, '')) || 0;
      return 0;
    };

    const getKrwValue = (gmv: any): number => {
      return cleanAndParseFloat(gmv) * USD_TO_KRW_RATE;
    };

    const calculateKpis = (data: any[]) => {
      let gmv = 0;
      let itemCount = 0;
      const orderCodes = new Set<string>();

      data.forEach((row) => {
        const rowGmv = getKrwValue(row['Total GMV']);
        gmv += rowGmv;
        itemCount += parseInt(row['구매수량'] || '0') || 0;
        if (row.order_code) orderCodes.add(row.order_code);
      });

      const orderCount = orderCodes.size;
      const aov = orderCount > 0 ? gmv / orderCount : 0;

      return { gmv, aov, orderCount, itemCount };
    };

    const kpisCurrent = calculateKpis(currentPeriodData);
    const kpisPrevious = calculateKpis(previousPeriodData);

    const getChange = (current: number, previous: number): number => {
      if (previous > 0) return (current - previous) / previous;
      if (current > 0) return Infinity;
      return 0;
    };

    // 미입고 현황 (현재 시점 기준)
    const UNRECEIVED_THRESHOLD_DAYS = 7;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - UNRECEIVED_THRESHOLD_DAYS);

    let totalUnreceived = 0;
    let delayedUnreceived = 0;

    logisticsData.forEach((row) => {
      if (
        (row.logistics || '').trim() === '결제 완료' &&
        (row['처리상태'] || '').trim() !== '처리완료'
      ) {
        totalUnreceived++;
        try {
          const orderDate = new Date(row.order_created);
          if (orderDate <= thresholdDate) {
            delayedUnreceived++;
          }
        } catch (e) {
          // 날짜 파싱 실패 시 무시
        }
      }
    });

    // 트렌드 차트 데이터 생성
    const trendStartDate = start;
    const trendData = filterDataByDate(logisticsData, trendStartDate, end);

    const dailyData: Record<string, { gmv: number; orderCodes: Set<string> }> = {};
    let currentDate = new Date(trendStartDate.getTime());
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyData[dateStr] = { gmv: 0, orderCodes: new Set<string>() };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    trendData.forEach((row) => {
      try {
        const dateStr = new Date(row.order_created).toISOString().split('T')[0];
        if (dailyData[dateStr]) {
          dailyData[dateStr].gmv += getKrwValue(row['Total GMV']);
          if (row.order_code) dailyData[dateStr].orderCodes.add(row.order_code);
        }
      } catch (e) {
        // 날짜 파싱 실패 시 무시
      }
    });

    const labels = Object.keys(dailyData).sort();
    const gmvValues = labels.map((label) => Math.round(dailyData[label].gmv));
    const orderValues = labels.map((label) => dailyData[label].orderCodes.size);

    // 7일 이동평균 계산
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

    const trendChartData = {
      labels,
      datasets: [
        {
          label: 'GMV (일별)',
          data: gmvValues,
          type: 'bar' as const,
          backgroundColor: 'rgba(74, 111, 165, 0.2)',
          borderColor: 'rgba(74, 111, 165, 0.2)',
          yAxisID: 'yGmv',
        },
        {
          label: '주문 건수 (일별)',
          data: orderValues,
          type: 'bar' as const,
          backgroundColor: 'rgba(247, 159, 121, 0.2)',
          borderColor: 'rgba(247, 159, 121, 0.2)',
          yAxisID: 'yOrders',
        },
        {
          label: 'GMV (7일 이동평균)',
          data: gmvMA7,
          type: 'line' as const,
          backgroundColor: '#4A6FA5',
          borderColor: '#4A6FA5',
          borderWidth: 2,
          pointRadius: 0,
          yAxisID: 'yGmv',
          tension: 0.3,
        },
        {
          label: '주문 건수 (7일 이동평균)',
          data: ordersMA7,
          type: 'line' as const,
          backgroundColor: '#F79F79',
          borderColor: '#F79F79',
          borderWidth: 2,
          pointRadius: 0,
          yAxisID: 'yOrders',
          tension: 0.3,
        },
      ],
    };

    // 스냅샷
    const activeCountries = new Set<string>();
    const activeArtists = new Set<string>();
    const activeItems = new Set<string>();

    currentPeriodData.forEach((row) => {
      if (row.country) activeCountries.add(row.country);
      if (row['artist_name (kr)']) activeArtists.add(row['artist_name (kr)']);
      if (row.product_id) activeItems.add(row.product_id);
    });

    res.json({
      kpis: {
        gmv: {
          value: kpisCurrent.gmv,
          change: getChange(kpisCurrent.gmv, kpisPrevious.gmv),
        },
        aov: {
          value: kpisCurrent.aov,
          change: getChange(kpisCurrent.aov, kpisPrevious.aov),
        },
        orderCount: {
          value: kpisCurrent.orderCount,
          change: getChange(kpisCurrent.orderCount, kpisPrevious.orderCount),
        },
        itemCount: {
          value: kpisCurrent.itemCount,
          change: getChange(kpisCurrent.itemCount, kpisPrevious.itemCount),
        },
      },
      trend: trendChartData,
      inventoryStatus: {
        total: totalUnreceived,
        delayed: delayedUnreceived,
        threshold: UNRECEIVED_THRESHOLD_DAYS,
      },
      snapshot: {
        activeCountries: activeCountries.size,
        activeArtists: activeArtists.size,
        activeItems: activeItems.size,
      },
    });
  } catch (error) {
    console.error('Error fetching main dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;

