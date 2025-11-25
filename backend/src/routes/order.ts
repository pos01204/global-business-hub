import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';
import { getProductUrl, getTrackingUrl } from '../utils/tracking';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 주문 상세 정보 조회
 * GET /api/order/:orderCode
 */
router.get('/:orderCode', async (req, res) => {
  try {
    const { orderCode } = req.params;
    if (!orderCode) {
      return res.status(400).json({ error: '주문 번호가 필요합니다.' });
    }

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

    const orderRows = logisticsData.filter((row: any) => row.order_code === orderCode);
    if (orderRows.length === 0) {
      return res.status(404).json({ error: '해당 주문 정보를 찾을 수 없습니다.' });
    }

    const orderSheetRow = orderData.find((r: any) => r.order_code === orderCode);
    const userId = orderSheetRow ? parseInt(orderSheetRow.user_id) : null;
    const userInfo = userId ? userMap.get(userId) : null;
    const customerInfo = {
      name: userInfo ? userInfo.NAME : 'N/A',
      country: userInfo ? userInfo.COUNTRY : 'N/A',
    };

    // 타임라인 생성
    const mainRow = orderRows[0];
    const shipmentUpdatedDate = new Date(mainRow['shipment_item_updated']);
    const inspectionDate = new Date(mainRow['artist bundle item updated']);
    const artistShipDate = new Date(mainRow['작가 발송 updated']);
    const orderCreatedDate = new Date(mainRow.order_created);
    const intlTracking = mainRow['국제송장번호'];
    const globalStatus = (mainRow['global bundle status'] || '').trim();
    const orderItemStatusMain = (mainRow['order item status'] || '').trim();

    const timelineEvents: Array<{ status: string; date: string }> = [];
    if (!isNaN(orderCreatedDate.getTime())) {
      timelineEvents.push({ status: '결제 완료', date: orderCreatedDate.toLocaleDateString('ko-KR') });
    }

    const hasArtistSent = orderRows.some((row: any) => {
      const sIS = (row['shipment item status'] || '').trim();
      const aSS = (row['작가 발송 상태'] || '').trim();
      const gS = (row['global bundle status'] || '').trim();
      const aBS = (row['artist bundle item status'] || '').trim();
      const iT = row['국제송장번호'];
      return (
        !isNaN(new Date(row['작가 발송 updated']).getTime()) &&
        (sIS === 'ARTIST_SENT' ||
          aSS === 'IN_DELIVERY' ||
          gS === 'IN_DELIVERY' ||
          aSS === 'IMPORTED' ||
          aSS === 'INSPECTION_COMPLETE' ||
          sIS === 'INSPECTION_COMPLETE' ||
          aBS === 'INSPECT_SUCCESS' ||
          gS === 'EXPORT_START' ||
          iT)
      );
    });
    if (hasArtistSent && !isNaN(artistShipDate.getTime())) {
      timelineEvents.push({ status: '작가 발송', date: artistShipDate.toLocaleDateString('ko-KR') });
    }

    const hasArrived = orderRows.some((row: any) => (row['작가 발송 상태'] || '').trim() === 'IMPORTED');
    if (hasArrived && !isNaN(inspectionDate.getTime())) {
      timelineEvents.push({ status: '입고 완료', date: inspectionDate.toLocaleDateString('ko-KR') });
    }

    const hasInspected = orderRows.some((row: any) => {
      const sIS = (row['shipment item status'] || '').trim();
      const aSS = (row['작가 발송 상태'] || '').trim();
      const aBS = (row['artist bundle item status'] || '').trim();
      const gS = (row['global bundle status'] || '').trim();
      const iT = row['국제송장번호'];
      return (
        !isNaN(new Date(row['artist bundle item updated']).getTime()) &&
        (sIS === 'INSPECTION_COMPLETE' ||
          aSS === 'INSPECTION_COMPLETE' ||
          aBS === 'INSPECT_SUCCESS' ||
          gS === 'EXPORT_START' ||
          iT)
      );
    });
    if (hasInspected && !isNaN(inspectionDate.getTime())) {
      timelineEvents.push({ status: '검수 완료', date: inspectionDate.toLocaleDateString('ko-KR') });
    }

    if (
      intlTracking &&
      !isNaN(shipmentUpdatedDate.getTime()) &&
      (globalStatus === 'EXPORT_START' ||
        globalStatus === 'SHIPPED' ||
        globalStatus === 'DELIVERING' ||
        orderItemStatusMain === 'IN_TRANSIT')
    ) {
      timelineEvents.push({
        status: '국제배송 시작',
        date: shipmentUpdatedDate.toLocaleDateString('ko-KR'),
      });
    }

    // 아이템 목록 생성
    const items = orderRows.map((row: any) => {
      const artistName = row['artist_name (kr)'] || '정보 없음';
      const itemLogisticsStatus = (row.logistics || '').trim();
      const isReceived = itemLogisticsStatus !== '결제 완료' && itemLogisticsStatus !== '작가 송장 입력';
      const itemStatus = isReceived ? '입고완료' : '미입고';

      return {
        name: row['product_name'] || '작품 정보 없음',
        artistName: artistName,
        quantity: row['구매수량'] || 'N/A',
        url: getProductUrl(row.country, row.product_id),
        status: itemStatus,
      };
    });

    const orderDetail = {
      orderCode: mainRow.order_code,
      country: mainRow.country,
      logisticsStatus: mainRow.logistics,
      customerInfo: customerInfo,
      currentMemo: mainRow['처리상태'] || '메모 없음',
      artistTracking: {
        number: mainRow['작가 발송 송장번호'],
        url: getTrackingUrl(mainRow['작가 발송 택배사'], mainRow['작가 발송 송장번호']),
      },
      internationalTracking: {
        number: intlTracking,
        url: intlTracking
          ? `https://lglet.lottegl.com/view/tracking/export/any/EN/Tracking/${intlTracking}`
          : '#',
      },
      items: items,
      timelineEvents: timelineEvents,
    };

    res.json(orderDetail);
  } catch (error) {
    console.error('Error fetching order detail:', error);
    res.status(500).json({ error: '주문 상세 정보를 불러오는 중 오류가 발생했습니다.' });
  }
});

export default router;


