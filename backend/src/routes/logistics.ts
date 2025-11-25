import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';
import { getTrackingUrl, getProductUrl } from '../utils/tracking';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 물류 추적 데이터 조회
 * GET /api/logistics
 */
router.get('/', async (req, res) => {
  try {
    const logisticsData = await sheetsService.getSheetDataAsJson(
      SHEET_NAMES.LOGISTICS,
      true // fill-down 활성화
    );

    // 배송완료 제외 (진행 중인 주문만)
    const inTransitData = logisticsData.filter(
      (row: any) => (row.logistics || '').trim() !== '배송완료'
    );

    // 주문별로 그룹화
    const groupedOrders: Record<string, any> = {};

    inTransitData.forEach((row: any) => {
      const orderCode = row.order_code;
      
      if (!groupedOrders[orderCode]) {
        const shipmentUpdatedDate = new Date(row['shipment_item_updated'] || '');
        const internationalTrackingNumber = row['국제송장번호'];

        // 타임라인 이벤트 생성
        const timelineEvents: Array<{ status: string; date: string }> = [];
        
        if (row.order_created && !isNaN(new Date(row.order_created).getTime())) {
          timelineEvents.push({
            status: '결제 완료',
            date: new Date(row.order_created).toLocaleDateString('ko-KR'),
          });
        }
        
        if (row['작가 발송 updated'] && !isNaN(new Date(row['작가 발송 updated']).getTime())) {
          timelineEvents.push({
            status: '작가 발송',
            date: new Date(row['작가 발송 updated']).toLocaleDateString('ko-KR'),
          });
        }
        
        if (row['artist bundle item updated'] && !isNaN(new Date(row['artist bundle item updated']).getTime())) {
          timelineEvents.push({
            status: '검수 완료',
            date: new Date(row['artist bundle item updated']).toLocaleDateString('ko-KR'),
          });
        }
        
        if (internationalTrackingNumber && !isNaN(shipmentUpdatedDate.getTime())) {
          timelineEvents.push({
            status: '국제배송 시작',
            date: shipmentUpdatedDate.toLocaleDateString('ko-KR'),
          });
        }

        groupedOrders[orderCode] = {
          orderCode: orderCode,
          country: row.country || 'N/A',
          logisticsStatus: row.logistics || 'N/A',
          lastUpdate: !isNaN(shipmentUpdatedDate.getTime())
            ? shipmentUpdatedDate.toLocaleDateString('ko-KR')
            : '날짜 없음',
          artistTracking: {
            number: row['작가 발송 송장번호'] || 'N/A',
            url: getTrackingUrl(row['작가 발송 택배사'], row['작가 발송 송장번호']),
          },
          internationalTracking: {
            number: internationalTrackingNumber || 'N/A',
            url: internationalTrackingNumber
              ? `https://lglet.lottegl.com/view/tracking/export/any/EN/Tracking/${internationalTrackingNumber}`
              : '#',
          },
          items: [],
          timelineEvents: timelineEvents,
        };
      }

      // 작품 정보 추가
      groupedOrders[orderCode].items.push({
        name: row['product_name'] || '작품 정보 없음',
        quantity: row['구매수량'] || 'N/A',
        url: getProductUrl(row.country, row.product_id),
      });
    });

    res.json(Object.values(groupedOrders));
  } catch (error) {
    console.error('Error fetching logistics tracking data:', error);
    res.status(500).json({ error: 'Failed to fetch logistics tracking data' });
  }
});

export default router;


