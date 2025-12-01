import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 개별 작품(item)의 상태 분류
 */
const classifyItemStatus = (row: any): string | null => {
  const globalStatus = (row['global bundle status'] || '').trim();
  const shipmentItemStatus = (row['shipment item status'] || '').trim();
  const orderItemStatus = (row['order item status'] || '').trim();
  const artistSendStatus = (row['작가 발송 상태'] || '').trim();
  const artistBundleStatus = (row['artist bundle item status'] || '').trim();
  const internationalTracking = row['국제송장번호'];

  // 1. 국제 배송중
  if (
    internationalTracking ||
    globalStatus === 'EXPORT_START' ||
    globalStatus === 'SHIPPED' ||
    globalStatus === 'DELIVERING' ||
    orderItemStatus === 'IN_TRANSIT'
  ) {
    return 'internationalShipping';
  }
  
  // 2. 검수 완료 (포장/출고 대기)
  if (
    shipmentItemStatus === 'INSPECTION_COMPLETE' ||
    artistSendStatus === 'INSPECTION_COMPLETE' ||
    artistBundleStatus === 'INSPECT_SUCCESS' ||
    orderItemStatus === 'COURIER_PICK_UP' ||
    orderItemStatus === 'PACKAGING'
  ) {
    return 'inspectionComplete';
  }
  
  // 3. 검수 대기 (입고 완료)
  if (artistSendStatus === 'IMPORTED') {
    return 'awaitingInspection';
  }
  
  // 4. 국내 배송중 (작가 발송 → 입고 대기)
  if (
    artistSendStatus === 'IN_DELIVERY' ||
    globalStatus === 'IN_DELIVERY' ||
    shipmentItemStatus === 'ARTIST_SENT'
  ) {
    return 'artistShipping';
  }
  
  // 5. 미입고 (결제 완료)
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

/**
 * 주문 단위로 최종 상태 결정
 * 기획 의도:
 * - "포장/출고 대기(검수 완료)": 합포장 포함 모든 작품이 검수 완료된 경우만
 * - 미입고 작품이 있으면 해당 주문은 "포장/출고 대기"에서 제외
 */
const determineOrderStatus = (itemStatuses: string[]): string => {
  // 국제배송 중인 작품이 있으면 해당 주문은 국제배송 상태
  if (itemStatuses.includes('internationalShipping')) {
    return 'internationalShipping';
  }
  
  // 미입고 작품이 하나라도 있으면
  const hasUnreceived = itemStatuses.includes('unreceived');
  // 국내 배송중 작품이 있으면
  const hasArtistShipping = itemStatuses.includes('artistShipping');
  // 검수 대기 작품이 있으면
  const hasAwaitingInspection = itemStatuses.includes('awaitingInspection');
  // 검수 완료 작품이 있으면
  const hasInspectionComplete = itemStatuses.includes('inspectionComplete');
  
  // 모든 작품이 검수 완료된 경우만 "포장/출고 대기"
  const allInspectionComplete = itemStatuses.every(s => s === 'inspectionComplete');
  if (allInspectionComplete && itemStatuses.length > 0) {
    return 'inspectionComplete';
  }
  
  // 미입고 작품이 있으면 (검수 완료된 작품이 있더라도) "미입고" 상태로 분류
  // 단, 일부 작품이 검수 완료된 경우 별도 표시를 위해 추가 정보 제공 가능
  if (hasUnreceived) {
    return 'unreceived';
  }
  
  // 국내 배송중 작품이 있으면 "국내 배송중"
  if (hasArtistShipping) {
    return 'artistShipping';
  }
  
  // 검수 대기 작품이 있으면 "검수 대기"
  if (hasAwaitingInspection) {
    return 'awaitingInspection';
  }
  
  // 검수 완료 작품이 있으면 (위에서 모든 작품 검수 완료는 처리됨)
  // 여기까지 왔다는 건 일부만 검수 완료 → 검수 대기 상태로 분류
  if (hasInspectionComplete) {
    return 'awaitingInspection';
  }
  
  return 'unreceived';
};

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

    // 주문별 작품 데이터 그룹핑
    const orderItems: Record<string, {
      items: any[];
      itemStatuses: string[];
      earliestDate: Date | null;
      latestUpdateDate: Date | null;
    }> = {};

    // 1차 패스: 주문별로 작품 그룹핑
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

      const itemStatus = classifyItemStatus(row);
      if (!itemStatus) return;

      if (!orderItems[orderCode]) {
        orderItems[orderCode] = {
          items: [],
          itemStatuses: [],
          earliestDate: null,
          latestUpdateDate: null,
        };
      }

      orderItems[orderCode].items.push(row);
      orderItems[orderCode].itemStatuses.push(itemStatus);

      // 날짜 추적
      const orderCreated = new Date(row.order_created);
      const artistUpdated = new Date(row['작가 발송 updated'] || row.order_created);
      const bundleUpdated = new Date(row['artist bundle item updated']);

      if (!isNaN(orderCreated.getTime())) {
        if (!orderItems[orderCode].earliestDate || orderCreated < orderItems[orderCode].earliestDate) {
          orderItems[orderCode].earliestDate = orderCreated;
        }
      }

      if (!isNaN(bundleUpdated.getTime())) {
        if (!orderItems[orderCode].latestUpdateDate || bundleUpdated > orderItems[orderCode].latestUpdateDate) {
          orderItems[orderCode].latestUpdateDate = bundleUpdated;
        }
      } else if (!isNaN(artistUpdated.getTime())) {
        if (!orderItems[orderCode].latestUpdateDate || artistUpdated > orderItems[orderCode].latestUpdateDate) {
          orderItems[orderCode].latestUpdateDate = artistUpdated;
        }
      }
    });

    // 파이프라인 초기화
    const pipeline: Record<string, { 
      orders: Set<string>; 
      items: number; 
      criticals: Array<{ orderCode: string; days: number; detail?: string }>;
    }> = {
      unreceived: { orders: new Set(), items: 0, criticals: [] },
      artistShipping: { orders: new Set(), items: 0, criticals: [] },
      awaitingInspection: { orders: new Set(), items: 0, criticals: [] },
      inspectionComplete: { orders: new Set(), items: 0, criticals: [] },
      internationalShipping: { orders: new Set(), items: 0, criticals: [] },
    };

    // 합포장에서 일부만 입고된 주문 추적
    const partiallyReceivedOrders: Array<{
      orderCode: string;
      totalItems: number;
      receivedItems: number;
      inspectedItems: number;
      unreceivedItems: number;
    }> = [];

    // 2차 패스: 주문 단위로 상태 결정 및 파이프라인 집계
    Object.entries(orderItems).forEach(([orderCode, orderData]) => {
      const orderStatus = determineOrderStatus(orderData.itemStatuses);
      const itemCount = orderData.items.length;
      
      pipeline[orderStatus].orders.add(orderCode);
      pipeline[orderStatus].items += itemCount;

      // 합포장 분석
      if (itemCount > 1) {
        const unreceivedCount = orderData.itemStatuses.filter(s => s === 'unreceived').length;
        const shippingCount = orderData.itemStatuses.filter(s => s === 'artistShipping').length;
        const awaitingCount = orderData.itemStatuses.filter(s => s === 'awaitingInspection').length;
        const inspectedCount = orderData.itemStatuses.filter(s => s === 'inspectionComplete').length;
        
        // 일부 작품만 입고된 합포장 주문 추적
        if (unreceivedCount > 0 && (awaitingCount > 0 || inspectedCount > 0)) {
          partiallyReceivedOrders.push({
            orderCode,
            totalItems: itemCount,
            receivedItems: awaitingCount + inspectedCount,
            inspectedItems: inspectedCount,
            unreceivedItems: unreceivedCount,
          });
        }
      }

      // 위험 주문 판정
      let startDate: Date | null = null;
      let days = 0;
      let detail = '';

      switch (orderStatus) {
        case 'unreceived':
          startDate = orderData.earliestDate;
          days = startDate && !isNaN(startDate.getTime()) 
            ? toDays(now.getTime() - startDate.getTime()) 
            : 0;
          
          // 합포장에서 일부만 입고된 경우 상세 정보 추가
          const partialInfo = partiallyReceivedOrders.find(p => p.orderCode === orderCode);
          if (partialInfo) {
            detail = `합포장 ${partialInfo.totalItems}개 중 ${partialInfo.unreceivedItems}개 미입고`;
          }
          
          if (days >= 7) {
            pipeline[orderStatus].criticals.push({ orderCode, days, detail });
          }
          break;

        case 'artistShipping':
          startDate = orderData.latestUpdateDate || orderData.earliestDate;
          days = startDate && !isNaN(startDate.getTime()) 
            ? toDays(now.getTime() - startDate.getTime()) 
            : 0;
          if (days >= 5) {
            pipeline[orderStatus].criticals.push({ orderCode, days });
          }
          break;

        case 'awaitingInspection':
          startDate = orderData.latestUpdateDate || orderData.earliestDate;
          days = startDate && !isNaN(startDate.getTime()) 
            ? toDays(now.getTime() - startDate.getTime()) 
            : 0;
          
          // 합포장에서 검수 대기 중인 경우 상세 정보
          const awaitingItemCount = orderData.itemStatuses.filter(s => s === 'awaitingInspection').length;
          const totalItemCount = orderData.items.length;
          if (totalItemCount > 1) {
            detail = `${totalItemCount}개 중 ${awaitingItemCount}개 검수 대기`;
          }
          
          if (days >= 2) {
            pipeline[orderStatus].criticals.push({ orderCode, days, detail });
          }
          break;

        case 'inspectionComplete':
          startDate = orderData.latestUpdateDate;
          days = startDate && !isNaN(startDate.getTime()) 
            ? toDays(now.getTime() - startDate.getTime()) 
            : 0;
          if (days >= 3) {
            pipeline[orderStatus].criticals.push({ orderCode, days });
          }
          break;

        case 'internationalShipping':
          // 국제배송은 별도 위험 기준
          startDate = orderData.latestUpdateDate;
          days = startDate && !isNaN(startDate.getTime()) 
            ? toDays(now.getTime() - startDate.getTime()) 
            : 0;
          if (days >= 14) {
            pipeline[orderStatus].criticals.push({ orderCode, days });
          }
          break;
      }
    });

    // 최종 데이터 구성
    const pipelineResult: Record<string, any> = {};
    const titles: Record<string, string> = {
      unreceived: '미입고 (결제 완료)',
      artistShipping: '국내 배송중 (입고 대기)',
      awaitingInspection: '검수 대기 (입고 완료)',
      inspectionComplete: '포장/출고 대기 (검수 완료)',
      internationalShipping: '국제 배송중',
    };

    for (const stageKey of Object.keys(pipeline)) {
      const stage = pipeline[stageKey];
      stage.criticals.sort((a, b) => b.days - a.days);
      
      pipelineResult[stageKey] = {
        title: titles[stageKey],
        orderCount: stage.orders.size,
        itemCount: stage.items,
        criticalCount: stage.criticals.length,
        maxDays: stage.criticals.length > 0 ? stage.criticals[0].days : 0,
        criticals: stage.criticals,
      };
    }

    // 합포장 분석 데이터 추가
    const bundleAnalysis = {
      partiallyReceivedCount: partiallyReceivedOrders.length,
      partiallyReceivedOrders: partiallyReceivedOrders
        .sort((a, b) => b.unreceivedItems - a.unreceivedItems)
        .slice(0, 10), // 상위 10개만
    };

    res.json({ 
      pipeline: pipelineResult,
      bundleAnalysis,
    });
  } catch (error) {
    console.error('Error fetching control tower data:', error);
    res.status(500).json({ error: 'Failed to fetch control tower data' });
  }
});

/**
 * 합포장 주문 상세 조회
 * GET /api/control-tower/bundle-orders
 */
router.get('/bundle-orders', async (req, res) => {
  try {
    const logisticsData = await sheetsService.getSheetDataAsJson(
      SHEET_NAMES.LOGISTICS,
      true
    );

    const now = new Date();
    const toDays = (ms: number) => Math.floor(ms / (1000 * 60 * 60 * 24));

    // 주문별 작품 그룹핑
    const orderItems: Record<string, any[]> = {};

    logisticsData.forEach((row: any) => {
      const logisticsStatus = (row.logistics || '').trim();
      if (logisticsStatus === '배송완료' || row['order item status'] === 'DELIVERED') {
        return;
      }

      const processingStatus = (row['처리상태'] || '').trim();
      if (processingStatus === '처리완료') {
        return;
      }

      const orderCode = row.order_code;
      if (!orderCode) return;

      if (!orderItems[orderCode]) {
        orderItems[orderCode] = [];
      }
      orderItems[orderCode].push(row);
    });

    // 합포장 주문만 필터링 (2개 이상 작품)
    const bundleOrders = Object.entries(orderItems)
      .filter(([, items]) => items.length >= 2)
      .map(([orderCode, items]) => {
        const itemDetails = items.map(item => ({
          productName: item['작품명'] || item.product_name,
          artistName: item['작가명'] || item.artist_name,
          status: classifyItemStatus(item),
          artistSendStatus: item['작가 발송 상태'],
          artistBundleStatus: item['artist bundle item status'],
        }));

        const statuses = itemDetails.map(i => i.status).filter(Boolean);
        const orderStatus = determineOrderStatus(statuses as string[]);

        const unreceivedCount = statuses.filter(s => s === 'unreceived').length;
        const shippingCount = statuses.filter(s => s === 'artistShipping').length;
        const awaitingCount = statuses.filter(s => s === 'awaitingInspection').length;
        const inspectedCount = statuses.filter(s => s === 'inspectionComplete').length;

        const orderCreated = new Date(items[0].order_created);
        const daysFromOrder = !isNaN(orderCreated.getTime()) 
          ? toDays(now.getTime() - orderCreated.getTime()) 
          : 0;

        return {
          orderCode,
          totalItems: items.length,
          orderStatus,
          statusBreakdown: {
            unreceived: unreceivedCount,
            artistShipping: shippingCount,
            awaitingInspection: awaitingCount,
            inspectionComplete: inspectedCount,
          },
          daysFromOrder,
          isPartiallyReceived: unreceivedCount > 0 && (awaitingCount > 0 || inspectedCount > 0),
          itemDetails,
        };
      })
      .sort((a, b) => {
        // 일부만 입고된 주문 우선
        if (a.isPartiallyReceived && !b.isPartiallyReceived) return -1;
        if (!a.isPartiallyReceived && b.isPartiallyReceived) return 1;
        // 그 다음 주문일 기준 오래된 순
        return b.daysFromOrder - a.daysFromOrder;
      });

    res.json({
      totalBundleOrders: bundleOrders.length,
      partiallyReceivedCount: bundleOrders.filter(o => o.isPartiallyReceived).length,
      orders: bundleOrders,
    });
  } catch (error) {
    console.error('Error fetching bundle orders:', error);
    res.status(500).json({ error: 'Failed to fetch bundle orders' });
  }
});

export default router;
