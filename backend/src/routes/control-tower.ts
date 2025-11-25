import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 물류 관제 센터 데이터 조회
 * GET /api/control-tower
 */
router.get('/', async (req, res) => {
  try {
    const logisticsData = await sheetsService.getSheetDataAsJson(
      SHEET_NAMES.LOGISTICS,
      true // fill-down 활성화
    );

    const now = new Date();
    const toDays = (ms: number) => Math.floor(ms / (1000 * 60 * 60 * 24));

    const initialPipeline = {
      unreceived: {
        title: '미입고 (결제 완료)',
        orderCount: 0,
        itemCount: 0,
        criticalCount: 0,
        maxDays: 0,
        criticals: [],
      },
      artistShipping: {
        title: '국내 배송중 (입고 대기)',
        orderCount: 0,
        itemCount: 0,
        criticalCount: 0,
        maxDays: 0,
        criticals: [],
      },
      awaitingInspection: {
        title: '검수 대기 (입고 완료)',
        orderCount: 0,
        itemCount: 0,
        criticalCount: 0,
        maxDays: 0,
        criticals: [],
      },
      inspectionComplete: {
        title: '포장/출고 대기 (검수 완료)',
        orderCount: 0,
        itemCount: 0,
        criticalCount: 0,
        maxDays: 0,
        criticals: [],
      },
      internationalShipping: {
        title: '국제 배송중',
        orderCount: 0,
        itemCount: 0,
        criticalCount: 0,
        maxDays: 0,
        criticals: [],
      },
    };

    const pipeline: Record<string, { orders: Set<string>; items: number; criticals: Array<{ orderCode: string; days: number }> }> = {
      unreceived: { orders: new Set(), items: 0, criticals: [] },
      artistShipping: { orders: new Set(), items: 0, criticals: [] },
      awaitingInspection: { orders: new Set(), items: 0, criticals: [] },
      inspectionComplete: { orders: new Set(), items: 0, criticals: [] },
      internationalShipping: { orders: new Set(), items: 0, criticals: [] },
    };

    // 주문 상태 분류 함수
    const classifyOrderStatus = (row: any): string | null => {
      const globalStatus = (row['global bundle status'] || '').trim();
      const shipmentItemStatus = (row['shipment item status'] || '').trim();
      const orderItemStatus = (row['order item status'] || '').trim();
      const artistSendStatus = (row['작가 발송 상태'] || '').trim();
      const artistBundleStatus = (row['artist bundle item status'] || '').trim();
      const internationalTracking = row['국제송장번호'];

      if (
        internationalTracking ||
        globalStatus === 'EXPORT_START' ||
        globalStatus === 'SHIPPED' ||
        globalStatus === 'DELIVERING' ||
        orderItemStatus === 'IN_TRANSIT'
      ) {
        return 'internationalShipping';
      }
      if (
        shipmentItemStatus === 'INSPECTION_COMPLETE' ||
        artistSendStatus === 'INSPECTION_COMPLETE' ||
        artistBundleStatus === 'INSPECT_SUCCESS' ||
        orderItemStatus === 'COURIER_PICK_UP' ||
        orderItemStatus === 'PACKAGING'
      ) {
        return 'inspectionComplete';
      }
      if (artistSendStatus === 'IMPORTED') {
        return 'awaitingInspection';
      }
      if (
        artistSendStatus === 'IN_DELIVERY' ||
        globalStatus === 'IN_DELIVERY' ||
        shipmentItemStatus === 'ARTIST_SENT'
      ) {
        return 'artistShipping';
      }
      if (
        orderItemStatus === 'ORDER_COMPLETED' ||
        orderItemStatus === 'PREPARING' ||
        shipmentItemStatus === 'CREATED' ||
        artistBundleStatus === 'CREATED'
      ) {
        return 'unreceived';
      }
      return null;
    };

    // 데이터 처리
    logisticsData.forEach((row: any) => {
      const logisticsStatus = (row.logistics || '').trim();
      if (
        logisticsStatus === '배송완료' ||
        row['order item status'] === 'DELIVERED' ||
        row['shipment item status'] === 'DELIVERED'
      ) {
        return; // 배송완료 제외
      }

      const processingStatus = (row['처리상태'] || '').trim();
      if (processingStatus === '처리완료') {
        return; // 처리완료 제외
      }

      const orderCode = row.order_code;
      if (!orderCode) return;

      const stage = classifyOrderStatus(row);

      if (stage) {
        pipeline[stage].orders.add(orderCode);
        pipeline[stage].items++;

        let startDate: Date | null = null;
        let days = 0;

        if (stage === 'unreceived') {
          startDate = new Date(row.order_created);
          days = !isNaN(startDate.getTime()) ? toDays(now.getTime() - startDate.getTime()) : 0;
          if (days >= 7) {
            pipeline[stage].criticals.push({ orderCode, days });
          }
        } else if (stage === 'artistShipping') {
          startDate = new Date(row['작가 발송 updated'] || row.order_created);
          days = !isNaN(startDate.getTime()) ? toDays(now.getTime() - startDate.getTime()) : 0;
          if (days >= 5) {
            pipeline[stage].criticals.push({ orderCode, days });
          }
        } else if (stage === 'awaitingInspection') {
          startDate = new Date(row['작가 발송 updated'] || row.order_created);
          days = !isNaN(startDate.getTime()) ? toDays(now.getTime() - startDate.getTime()) : 0;
          if (days >= 2) {
            pipeline[stage].criticals.push({ orderCode, days });
          }
        } else if (stage === 'inspectionComplete') {
          startDate = new Date(row['artist bundle item updated']);
          days = !isNaN(startDate.getTime()) ? toDays(now.getTime() - startDate.getTime()) : 0;
          if (days >= 3) {
            pipeline[stage].criticals.push({ orderCode, days });
          }
        }
      }
    });

    // 최종 데이터 구성
    const pipelineData: Record<string, any> = {};
    for (const stageKey in pipeline) {
      const stage = pipeline[stageKey];
      stage.criticals.sort((a, b) => b.days - a.days);
      pipelineData[stageKey] = {
        title: initialPipeline[stageKey as keyof typeof initialPipeline].title,
        orderCount: stage.orders.size,
        itemCount: stage.items,
        criticalCount: stage.criticals.length,
        maxDays: stage.criticals.length > 0 ? stage.criticals[0].days : 0,
        criticals: stage.criticals,
      };
    }

    res.json({ pipeline: pipelineData });
  } catch (error) {
    console.error('Error fetching control tower data:', error);
    res.status(500).json({ error: 'Failed to fetch control tower data' });
  }
});

export default router;


