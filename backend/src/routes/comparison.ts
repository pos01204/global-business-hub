import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 비교 분석 데이터 조회
 * GET /api/comparison?type=period&periods=3&dateRange=30d&countryFilter=all
 * GET /api/comparison?type=artist&artists=작가1,작가2&dateRange=30d
 * GET /api/comparison?type=country&countries=JP,US&dateRange=30d
 */
router.get('/', async (req, res) => {
  try {
    const comparisonType = (req.query.type as string) || 'period'; // period, artist, country
    const dateRange = (req.query.dateRange as string) || '30d';
    const countryFilter = (req.query.countryFilter as string) || 'all';
    const periods = parseInt((req.query.periods as string) || '3'); // 비교할 기간 수
    const artists = (req.query.artists as string) || ''; // 작가명 목록 (쉼표 구분)
    const countries = (req.query.countries as string) || ''; // 국가 코드 목록 (쉼표 구분)

    const USD_TO_KRW_RATE = 1350.0;
    const now = new Date();
    const days = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }[dateRange] || 30;

    const cleanAndParseFloat = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value.replace(/,/g, '')) || 0;
      return 0;
    };

    // 데이터 로드
    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    const orderData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, false);
    const usersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.USERS, false);

    // 사용자 맵 생성
    const userMap = new Map<number, any>();
    usersData.forEach((row: any) => {
      const userId = parseInt(row.ID);
      if (!isNaN(userId)) {
        userMap.set(userId, row);
      }
    });

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

    if (comparisonType === 'period') {
      // 다중 기간 비교
      const periodsData: Array<{
        period: string;
        startDate: string;
        endDate: string;
        kpis: {
          gmv: number;
          aov: number;
          orderCount: number;
          itemCount: number;
        };
      }> = [];

      for (let i = 0; i < periods; i++) {
        const periodEnd = new Date(now.getTime() - i * days * 24 * 60 * 60 * 1000);
        periodEnd.setHours(23, 59, 59, 999);
        const periodStart = new Date(periodEnd.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
        periodStart.setHours(0, 0, 0, 0);

        let periodData = filterByDate(logisticsData, periodStart, periodEnd);

        // 국가 필터링
        if (countryFilter === 'jp') {
          periodData = periodData.filter((row: any) => row.country === 'JP');
        } else if (countryFilter === 'non_jp') {
          periodData = periodData.filter((row: any) => row.country !== 'JP');
        }

        // KPI 계산
        let totalGmv = 0;
        let itemCount = 0;
        const orderCodes = new Set<string>();

        periodData.forEach((row: any) => {
          const gmv = cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW_RATE;
          totalGmv += gmv;
          itemCount += parseInt(row['구매수량'] || '0') || 0;
          if (row.order_code) orderCodes.add(row.order_code);
        });

        const orderCount = orderCodes.size;
        const aov = orderCount > 0 ? totalGmv / orderCount : 0;

        const periodLabel =
          i === 0
            ? '현재 기간'
            : i === 1
              ? '이전 기간'
              : `${i + 1}기간 전`;

        periodsData.push({
          period: periodLabel,
          startDate: periodStart.toISOString().split('T')[0],
          endDate: periodEnd.toISOString().split('T')[0],
          kpis: {
            gmv: Math.round(totalGmv),
            aov: Math.round(aov),
            orderCount,
            itemCount,
          },
        });
      }

      // 변화율 계산
      const changes: Array<{
        metric: string;
        changes: Array<{ period: string; change: number }>;
      }> = [];

      if (periodsData.length > 1) {
        const metrics = ['gmv', 'aov', 'orderCount', 'itemCount'] as const;
        metrics.forEach((metric) => {
          const metricChanges: Array<{ period: string; change: number }> = [];
          for (let i = 1; i < periodsData.length; i++) {
            const current = periodsData[i - 1].kpis[metric];
            const previous = periodsData[i].kpis[metric];
            const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
            metricChanges.push({
              period: `${periodsData[i].period} 대비`,
              change: Math.round(change * 10) / 10,
            });
          }
          changes.push({
            metric,
            changes: metricChanges,
          });
        });
      }

      res.json({
        type: 'period',
        periods: periodsData.reverse(), // 오래된 순서로 정렬
        changes,
        dateRange: {
          days,
          countryFilter,
        },
      });
    } else if (comparisonType === 'artist') {
      // 작가 비교
      const artistList = artists
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      if (artistList.length === 0) {
        return res.status(400).json({ error: '비교할 작가명을 입력해주세요.' });
      }

      const endDate = new Date(now);
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      let filteredData = filterByDate(logisticsData, startDate, endDate);

      // 국가 필터링
      if (countryFilter === 'jp') {
        filteredData = filteredData.filter((row: any) => row.country === 'JP');
      } else if (countryFilter === 'non_jp') {
        filteredData = filteredData.filter((row: any) => row.country !== 'JP');
      }

      const artistStats: Array<{
        artistName: string;
        gmv: number;
        aov: number;
        orderCount: number;
        itemCount: number;
        productCount: number;
      }> = [];

      artistList.forEach((artistName) => {
        const artistData = filteredData.filter(
          (row: any) => (row['artist_name (kr)'] || '').trim() === artistName
        );

        let totalGmv = 0;
        let itemCount = 0;
        const orderCodes = new Set<string>();
        const products = new Set<string>();

        artistData.forEach((row: any) => {
          const gmv = cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW_RATE;
          totalGmv += gmv;
          itemCount += parseInt(row['구매수량'] || '0') || 0;
          if (row.order_code) orderCodes.add(row.order_code);
          if (row.product_id) products.add(row.product_id);
        });

        const orderCount = orderCodes.size;
        const aov = orderCount > 0 ? totalGmv / orderCount : 0;

        artistStats.push({
          artistName,
          gmv: Math.round(totalGmv),
          aov: Math.round(aov),
          orderCount,
          itemCount,
          productCount: products.size,
        });
      });

      res.json({
        type: 'artist',
        artists: artistStats,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          days,
          countryFilter,
        },
      });
    } else if (comparisonType === 'country') {
      // 국가 비교
      const countryList = countries
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length > 0);

      if (countryList.length === 0) {
        return res.status(400).json({ error: '비교할 국가 코드를 입력해주세요.' });
      }

      const endDate = new Date(now);
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const filteredData = filterByDate(logisticsData, startDate, endDate);

      const countryStats: Array<{
        country: string;
        gmv: number;
        aov: number;
        orderCount: number;
        itemCount: number;
        customerCount: number;
      }> = [];

      countryList.forEach((countryCode) => {
        const countryData = filteredData.filter((row: any) => row.country === countryCode);

        let totalGmv = 0;
        let itemCount = 0;
        const orderCodes = new Set<string>();
        const customers = new Set<string>();

        countryData.forEach((row: any) => {
          const gmv = cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW_RATE;
          totalGmv += gmv;
          itemCount += parseInt(row['구매수량'] || '0') || 0;
          if (row.order_code) orderCodes.add(row.order_code);
          if (row.user_id) customers.add(String(row.user_id));
        });

        const orderCount = orderCodes.size;
        const aov = orderCount > 0 ? totalGmv / orderCount : 0;

        countryStats.push({
          country: countryCode,
          gmv: Math.round(totalGmv),
          aov: Math.round(aov),
          orderCount,
          itemCount,
          customerCount: customers.size,
        });
      });

      res.json({
        type: 'country',
        countries: countryStats,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          days,
        },
      });
    } else {
      return res.status(400).json({ error: '지원하지 않는 비교 유형입니다. (period, artist, country)' });
    }
  } catch (error: any) {
    console.error('[Comparison] 오류:', error);
    res.status(500).json({
      error: '비교 분석 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

export default router;







