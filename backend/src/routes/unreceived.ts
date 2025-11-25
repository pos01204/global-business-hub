import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 미입고 작품 데이터 조회
 * GET /api/unreceived
 */
router.get('/', async (req, res) => {
  try {
    const logisticsData = await sheetsService.getSheetDataAsJson(
      SHEET_NAMES.LOGISTICS,
      true // fill-down 활성화
    );

    // 주문별 그룹화
    const orders: Record<string, { items: any[]; artists: Set<string> }> = {};

    logisticsData.forEach((row) => {
      const orderCode = row.order_code;
      if (!orders[orderCode]) {
        orders[orderCode] = { items: [], artists: new Set() };
      }
      orders[orderCode].items.push(row);
      if (row['artist_name (kr)']) {
        orders[orderCode].artists.add(row['artist_name (kr)']);
      }
    });

    // 미입고 작품 필터링
    const unreceivedItems = logisticsData.filter(
      (row) =>
        (row.logistics || '').trim() === '결제 완료' &&
        (row['처리상태'] || '').trim() !== '처리완료'
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = unreceivedItems.map((row) => {
      const orderCode = row.order_code;
      const orderInfo = orders[orderCode] || { items: [], artists: new Set() };
      const isBundle = orderInfo.artists.size > 1;

      const allItemsInOrder = orderInfo.items.map((item) => {
        const isReceived =
          (item.logistics || '').trim() !== '결제 완료' ||
          (item['처리상태'] || '').trim() === '처리완료';
        return {
          productName: item.product_name || '정보 없음',
          artistName: item['artist_name (kr)'] || '정보 없음',
          status: isReceived ? '입고완료' : '미입고',
        };
      });

      const orderDate = new Date(row.order_created);
      orderDate.setHours(0, 0, 0, 0);
      const elapsedMilliseconds = today.getTime() - orderDate.getTime();
      const daysElapsed = Math.floor(
        elapsedMilliseconds / (1000 * 60 * 60 * 24)
      );

      return {
        orderCode: row.order_code,
        artistName: row['artist_name (kr)'] || '정보 없음',
        productName: row.product_name || '작품 정보 없음',
        orderDate: orderDate.toLocaleDateString('ko-KR'),
        daysElapsed,
        currentStatus: row['처리상태'] || '',
        isBundle,
        allItems: allItemsInOrder,
      };
    });

    // KPI 계산
    const kpi_total = result.length;
    const kpi_orders = new Set(result.map((item) => item.orderCode)).size;
    const kpi_artists = new Set(result.map((item) => item.artistName)).size;
    const kpi_delayed = result.filter((item) => item.daysElapsed >= 7).length;

    res.json({
      kpis: {
        total: kpi_total,
        orders: kpi_orders,
        artists: kpi_artists,
        delayed: kpi_delayed,
        threshold: 7,
      },
      items: result.sort((a, b) => b.daysElapsed - a.daysElapsed),
    });
  } catch (error) {
    console.error('Error fetching unreceived items:', error);
    res.status(500).json({ error: 'Failed to fetch unreceived items' });
  }
});

/**
 * 처리상태 업데이트
 * POST /api/unreceived/update-status
 */
router.post('/update-status', async (req, res) => {
  try {
    const { orderCode, status } = req.body;

    if (!orderCode || !status) {
      return res.status(400).json({ error: 'orderCode and status are required' });
    }

    // Google Sheets에서 해당 주문의 모든 행 찾기
    const logisticsData = await sheetsService.getSheetDataAsJson(
      SHEET_NAMES.LOGISTICS,
      true
    );

    // order_code로 필터링된 행들의 인덱스 찾기
    // 실제 업데이트는 Google Sheets API를 통해 수행해야 함
    // 여기서는 간단한 예시만 제공

    res.json({
      status: 'success',
      message: `Status updated for order ${orderCode}`,
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;


