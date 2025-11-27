import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 물류 처리 시간 분석 데이터 조회
 * GET /api/logistics-performance?dateRange=30d&countryFilter=all
 */
router.get('/', async (req, res) => {
  try {
    const dateRange = (req.query.dateRange as string) || '30d';
    const countryFilter = (req.query.countryFilter as string) || 'all';

    const now = new Date();
    const days = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }[dateRange] || 30;
    const endDate = new Date(now);
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // 데이터 로드
    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);

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

    let filteredData = filterByDate(logisticsData, startDate, endDate);

    // 국가 필터링
    if (countryFilter === 'jp') {
      filteredData = filteredData.filter((row: any) => row.country === 'JP');
    } else if (countryFilter === 'non_jp') {
      filteredData = filteredData.filter((row: any) => row.country !== 'JP');
    }

    // 처리 시간 계산 함수
    const calculateDays = (startDate: Date | null, endDate: Date | null): number | null => {
      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null;
      }
      const diffMs = endDate.getTime() - startDate.getTime();
      return Math.round(diffMs / (1000 * 60 * 60 * 24));
    };

    // 단계별 처리 시간 계산
    const processingTimes: Array<{
      orderCode: string;
      orderDate: Date;
      artistShipDate: Date | null;
      inspectionDate: Date | null;
      shipmentDate: Date | null;
      country: string;
      artistName: string;
      orderToShip: number | null;
      shipToInspection: number | null;
      inspectionToShipment: number | null;
      totalProcessingTime: number | null;
    }> = [];

    // 주문별로 그룹화 (order_code 기준)
    const orderGroups: Record<string, any[]> = {};
    filteredData.forEach((row: any) => {
      const orderCode = row.order_code;
      if (!orderGroups[orderCode]) {
        orderGroups[orderCode] = [];
      }
      orderGroups[orderCode].push(row);
    });

    Object.keys(orderGroups).forEach((orderCode) => {
      const rows = orderGroups[orderCode];
      const mainRow = rows[0]; // 첫 번째 행을 기준으로 사용

      const orderDate = new Date(mainRow.order_created);
      const artistShipDate = mainRow['작가 발송 updated']
        ? new Date(mainRow['작가 발송 updated'])
        : null;
      const inspectionDate = mainRow['artist bundle item updated']
        ? new Date(mainRow['artist bundle item updated'])
        : null;
      const shipmentDate = mainRow['shipment_item_updated']
        ? new Date(mainRow['shipment_item_updated'])
        : null;

      const orderToShip = calculateDays(orderDate, artistShipDate);
      const shipToInspection = calculateDays(artistShipDate, inspectionDate);
      const inspectionToShipment = calculateDays(inspectionDate, shipmentDate);

      // 전체 처리 시간 (주문 → 배송 시작)
      let totalProcessingTime: number | null = null;
      if (orderDate && shipmentDate) {
        totalProcessingTime = calculateDays(orderDate, shipmentDate);
      }

      processingTimes.push({
        orderCode,
        orderDate,
        artistShipDate,
        inspectionDate,
        shipmentDate,
        country: mainRow.country || 'N/A',
        artistName: mainRow['artist_name (kr)'] || 'N/A',
        orderToShip,
        shipToInspection,
        inspectionToShipment,
        totalProcessingTime,
      });
    });

    // 통계 계산
    const calculateStats = (values: (number | null)[]): {
      avg: number;
      median: number;
      min: number;
      max: number;
      count: number;
    } => {
      const validValues = values.filter((v): v is number => v !== null && v >= 0);
      if (validValues.length === 0) {
        return { avg: 0, median: 0, min: 0, max: 0, count: 0 };
      }

      validValues.sort((a, b) => a - b);
      const sum = validValues.reduce((a, b) => a + b, 0);
      const avg = sum / validValues.length;
      const median =
        validValues.length % 2 === 0
          ? (validValues[validValues.length / 2 - 1] + validValues[validValues.length / 2]) / 2
          : validValues[Math.floor(validValues.length / 2)];

      return {
        avg: Math.round(avg * 10) / 10,
        median,
        min: validValues[0],
        max: validValues[validValues.length - 1],
        count: validValues.length,
      };
    };

    const orderToShipStats = calculateStats(processingTimes.map((p) => p.orderToShip));
    const shipToInspectionStats = calculateStats(processingTimes.map((p) => p.shipToInspection));
    const inspectionToShipmentStats = calculateStats(
      processingTimes.map((p) => p.inspectionToShipment)
    );
    const totalStats = calculateStats(processingTimes.map((p) => p.totalProcessingTime));

    // 작가별 통계
    const artistStats: Record<
      string,
      {
        orderCount: number;
        avgOrderToShip: number;
        avgShipToInspection: number;
        avgInspectionToShipment: number;
        avgTotalTime: number;
      }
    > = {};

    processingTimes.forEach((pt) => {
      if (!artistStats[pt.artistName]) {
        artistStats[pt.artistName] = {
          orderCount: 0,
          avgOrderToShip: 0,
          avgShipToInspection: 0,
          avgInspectionToShipment: 0,
          avgTotalTime: 0,
        };
      }

      artistStats[pt.artistName].orderCount++;
      if (pt.orderToShip !== null) {
        artistStats[pt.artistName].avgOrderToShip += pt.orderToShip;
      }
      if (pt.shipToInspection !== null) {
        artistStats[pt.artistName].avgShipToInspection += pt.shipToInspection;
      }
      if (pt.inspectionToShipment !== null) {
        artistStats[pt.artistName].avgInspectionToShipment += pt.inspectionToShipment;
      }
      if (pt.totalProcessingTime !== null) {
        artistStats[pt.artistName].avgTotalTime += pt.totalProcessingTime;
      }
    });

    // 작가별 평균 계산
    Object.keys(artistStats).forEach((artistName) => {
      const stats = artistStats[artistName];
      const count = stats.orderCount;
      if (count > 0) {
        stats.avgOrderToShip = Math.round((stats.avgOrderToShip / count) * 10) / 10;
        stats.avgShipToInspection = Math.round((stats.avgShipToInspection / count) * 10) / 10;
        stats.avgInspectionToShipment = Math.round(
          (stats.avgInspectionToShipment / count) * 10
        ) / 10;
        stats.avgTotalTime = Math.round((stats.avgTotalTime / count) * 10) / 10;
      }
    });

    // 국가별 통계
    const countryStats: Record<
      string,
      {
        orderCount: number;
        avgTotalTime: number;
      }
    > = {};

    processingTimes.forEach((pt) => {
      const country = pt.country;
      if (!countryStats[country]) {
        countryStats[country] = {
          orderCount: 0,
          avgTotalTime: 0,
        };
      }

      countryStats[country].orderCount++;
      if (pt.totalProcessingTime !== null) {
        countryStats[country].avgTotalTime += pt.totalProcessingTime;
      }
    });

    Object.keys(countryStats).forEach((country) => {
      const stats = countryStats[country];
      if (stats.orderCount > 0) {
        stats.avgTotalTime = Math.round((stats.avgTotalTime / stats.orderCount) * 10) / 10;
      }
    });

    // 시간대별 분포 (일별 집계)
    const dailyDistribution: Record<string, number> = {};
    processingTimes.forEach((pt) => {
      if (pt.totalProcessingTime !== null) {
        const days = Math.floor(pt.totalProcessingTime);
        const key = `${days}일`;
        dailyDistribution[key] = (dailyDistribution[key] || 0) + 1;
      }
    });

    res.json({
      summary: {
        orderToShip: orderToShipStats,
        shipToInspection: shipToInspectionStats,
        inspectionToShipment: inspectionToShipmentStats,
        total: totalStats,
      },
      artistStats: Object.entries(artistStats)
        .map(([artistName, stats]) => ({
          artistName,
          ...stats,
        }))
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 20), // Top 20 작가
      countryStats: Object.entries(countryStats)
        .map(([country, stats]) => ({
          country,
          ...stats,
        }))
        .sort((a, b) => b.orderCount - a.orderCount),
      dailyDistribution,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        days,
      },
    });
  } catch (error: any) {
    console.error('[Logistics Performance] 오류:', error);
    res.status(500).json({
      error: '물류 처리 시간 분석 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

export default router;


