import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';
import { getProductUrl, getTrackingUrl } from '../utils/tracking';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 작가 정보 조회 헬퍼 함수 (메일 주소 포함)
 */
function getArtistInfoWithEmail(artistName: string, artistsData: any[]): { name: string; email?: string; artistId?: string } | null {
  const artist = artistsData.find((a: any) => 
    a['artist_name (kr)'] === artistName ||
    a.artist_name_kr === artistName ||
    a.name_kr === artistName ||
    a.name === artistName
  );
  
  if (!artist) return null;
  
  return {
    name: artist['artist_name (kr)'] || artist.artist_name_kr || artist.name_kr || artist.name || artistName,
    email: artist.mail || artist.email || artist.artist_email || artist['artist_email'] || undefined,
    artistId: artist.artist_id || artist.global_artist_id || undefined,
  };
}

/**
 * 개별 작품의 상세 상태 분류
 * 물류 관제 센터의 분류 기준과 동일
 */
function classifyItemDetailedStatus(row: any): { 
  stage: string; 
  stageCode: string; 
  statusLabel: string;
  daysInStage: number;
} {
  const now = new Date();
  const toDays = (ms: number) => Math.floor(ms / (1000 * 60 * 60 * 24));

  const globalStatus = (row['global bundle status'] || '').trim();
  const shipmentItemStatus = (row['shipment item status'] || '').trim();
  const orderItemStatus = (row['order item status'] || '').trim();
  const artistSendStatus = (row['작가 발송 상태'] || '').trim();
  const artistBundleStatus = (row['artist bundle item status'] || '').trim();
  const internationalTracking = row['국제송장번호'];

  const orderCreated = new Date(row.order_created);
  const artistUpdated = new Date(row['작가 발송 updated']);
  const bundleUpdated = new Date(row['artist bundle item updated']);

  // 1. 국제 배송중
  if (
    internationalTracking ||
    globalStatus === 'EXPORT_START' ||
    globalStatus === 'SHIPPED' ||
    globalStatus === 'DELIVERING' ||
    orderItemStatus === 'IN_TRANSIT'
  ) {
    const startDate = bundleUpdated;
    const days = !isNaN(startDate.getTime()) ? toDays(now.getTime() - startDate.getTime()) : 0;
    return {
      stage: 'internationalShipping',
      stageCode: '5',
      statusLabel: '국제 배송중',
      daysInStage: days,
    };
  }

  // 2. 검수 완료 (포장/출고 대기)
  if (
    shipmentItemStatus === 'INSPECTION_COMPLETE' ||
    artistSendStatus === 'INSPECTION_COMPLETE' ||
    artistBundleStatus === 'INSPECT_SUCCESS' ||
    orderItemStatus === 'COURIER_PICK_UP' ||
    orderItemStatus === 'PACKAGING'
  ) {
    const startDate = bundleUpdated;
    const days = !isNaN(startDate.getTime()) ? toDays(now.getTime() - startDate.getTime()) : 0;
    return {
      stage: 'inspectionComplete',
      stageCode: '4',
      statusLabel: '검수 완료',
      daysInStage: days,
    };
  }

  // 3. 검수 대기 (입고 완료)
  if (artistSendStatus === 'IMPORTED') {
    const startDate = artistUpdated;
    const days = !isNaN(startDate.getTime()) ? toDays(now.getTime() - startDate.getTime()) : 0;
    return {
      stage: 'awaitingInspection',
      stageCode: '3',
      statusLabel: '검수 대기 (입고완료)',
      daysInStage: days,
    };
  }

  // 4. 국내 배송중 (작가 발송)
  if (
    artistSendStatus === 'IN_DELIVERY' ||
    globalStatus === 'IN_DELIVERY' ||
    shipmentItemStatus === 'ARTIST_SENT'
  ) {
    const startDate = artistUpdated;
    const days = !isNaN(startDate.getTime()) ? toDays(now.getTime() - startDate.getTime()) : 0;
    return {
      stage: 'artistShipping',
      stageCode: '2',
      statusLabel: '국내 배송중',
      daysInStage: days,
    };
  }

  // 5. 미입고 (결제 완료)
  const startDate = orderCreated;
  const days = !isNaN(startDate.getTime()) ? toDays(now.getTime() - startDate.getTime()) : 0;
  return {
    stage: 'unreceived',
    stageCode: '1',
    statusLabel: '미입고',
    daysInStage: days,
  };
}

/**
 * 주문 전체 상태 결정 (물류 관제 센터 기준과 동일)
 */
function determineOrderOverallStatus(itemStages: string[]): {
  stage: string;
  statusLabel: string;
  description: string;
} {
  // 국제배송 중인 작품이 있으면 해당 주문은 국제배송 상태
  if (itemStages.includes('internationalShipping')) {
    return {
      stage: 'internationalShipping',
      statusLabel: '국제 배송중',
      description: '해외 배송 진행 중',
    };
  }
  
  const hasUnreceived = itemStages.includes('unreceived');
  const hasArtistShipping = itemStages.includes('artistShipping');
  const hasAwaitingInspection = itemStages.includes('awaitingInspection');
  
  // 모든 작품이 검수 완료된 경우만 "포장/출고 대기"
  const allInspectionComplete = itemStages.every(s => s === 'inspectionComplete');
  if (allInspectionComplete && itemStages.length > 0) {
    return {
      stage: 'inspectionComplete',
      statusLabel: '포장/출고 대기',
      description: '모든 작품 검수 완료, 출고 가능',
    };
  }
  
  if (hasUnreceived) {
    return {
      stage: 'unreceived',
      statusLabel: '미입고',
      description: '일부 작품 미입고로 출고 불가',
    };
  }
  
  if (hasArtistShipping) {
    return {
      stage: 'artistShipping',
      statusLabel: '국내 배송중',
      description: '일부 작품 배송 중',
    };
  }
  
  if (hasAwaitingInspection) {
    return {
      stage: 'awaitingInspection',
      statusLabel: '검수 대기',
      description: '입고 완료, 검수 진행 중',
    };
  }
  
  return {
    stage: 'unknown',
    statusLabel: '알 수 없음',
    description: '상태 확인 필요',
  };
}

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
    const artistsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ARTISTS, false);

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
      userId: userId,
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

    // 아이템 목록 생성 (작가 메일 주소 및 상세 상태 포함)
    const itemStages: string[] = [];
    const items = orderRows.map((row: any) => {
      const artistName = row['artist_name (kr)'] || '정보 없음';
      const artistInfo = getArtistInfoWithEmail(artistName, artistsData);
      
      // 상세 상태 분류
      const detailedStatus = classifyItemDetailedStatus(row);
      itemStages.push(detailedStatus.stage);

      return {
        name: row['product_name'] || '작품 정보 없음',
        artistName: artistName,
        artistEmail: artistInfo?.email,
        artistId: artistInfo?.artistId,
        quantity: row['구매수량'] || 'N/A',
        url: getProductUrl(row.country, row.product_id),
        // 상세 상태 정보
        stage: detailedStatus.stage,
        stageCode: detailedStatus.stageCode,
        statusLabel: detailedStatus.statusLabel,
        daysInStage: detailedStatus.daysInStage,
        // 위험 여부 (단계별 기준 적용)
        isCritical: (
          (detailedStatus.stage === 'unreceived' && detailedStatus.daysInStage >= 7) ||
          (detailedStatus.stage === 'artistShipping' && detailedStatus.daysInStage >= 5) ||
          (detailedStatus.stage === 'awaitingInspection' && detailedStatus.daysInStage >= 2) ||
          (detailedStatus.stage === 'inspectionComplete' && detailedStatus.daysInStage >= 3)
        ),
        // 레거시 호환용
        status: detailedStatus.stage === 'unreceived' || detailedStatus.stage === 'artistShipping' 
          ? '미입고' : '입고완료',
      };
    });

    // 주문 전체 상태 결정
    const orderOverallStatus = determineOrderOverallStatus(itemStages);

    // 합포장 분석
    const isBundleOrder = items.length > 1;
    const bundleAnalysis = isBundleOrder ? {
      totalItems: items.length,
      statusBreakdown: {
        unreceived: items.filter(i => i.stage === 'unreceived').length,
        artistShipping: items.filter(i => i.stage === 'artistShipping').length,
        awaitingInspection: items.filter(i => i.stage === 'awaitingInspection').length,
        inspectionComplete: items.filter(i => i.stage === 'inspectionComplete').length,
        internationalShipping: items.filter(i => i.stage === 'internationalShipping').length,
      },
      isPartiallyReceived: items.some(i => i.stage === 'unreceived') && 
                          items.some(i => i.stage !== 'unreceived'),
      delayedItems: items.filter(i => i.isCritical).map(i => ({
        name: i.name,
        artistName: i.artistName,
        artistEmail: i.artistEmail,
        stage: i.stage,
        statusLabel: i.statusLabel,
        daysInStage: i.daysInStage,
      })),
    } : null;

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
      // 신규 추가: 주문 전체 상태
      orderOverallStatus: orderOverallStatus,
      // 신규 추가: 합포장 분석
      bundleAnalysis: bundleAnalysis,
    };

    res.json(orderDetail);
  } catch (error) {
    console.error('Error fetching order detail:', error);
    res.status(500).json({ error: '주문 상세 정보를 불러오는 중 오류가 발생했습니다.' });
  }
});

export default router;
