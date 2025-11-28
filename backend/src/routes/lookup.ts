import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 통합 검색
 * GET /api/lookup?query=검색어&searchType=order_code
 * 
 * 검색 기준:
 * - order_code: 주문번호 (P_xxx 형식)
 * - shipment_id: 송장번호 (국제송장번호 또는 작가발송 송장번호)
 * - user_id: 사용자 ID
 * - artist_name: 작가명
 * - product_name: 상품명
 * - artist_id: 작가 ID
 * - product_id: 상품 ID
 */
router.get('/', async (req, res) => {
  try {
    const query = req.query.query as string;
    const searchType = req.query.searchType as string;

    console.log(`[Lookup] Search request - query: ${query}, type: ${searchType}`);

    if (!query || !searchType) {
      return res.status(400).json({ error: '검색어와 검색 기준이 모두 필요합니다.' });
    }

    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    console.log(`[Lookup] Logistics data loaded: ${logisticsData.length} rows`);
    
    // users 시트는 선택적으로 로드 (에러 발생해도 계속 진행)
    let usersData: any[] = [];
    try {
      usersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.USERS, false);
      console.log(`[Lookup] Users data loaded: ${usersData.length} rows`);
    } catch (userError) {
      console.warn('[Lookup] Users data not available:', userError);
    }

    // 사용자 맵 생성
    const userMap = new Map<number, any>();
    usersData.forEach((row: any) => {
      const userId = parseInt(row.ID);
      if (!isNaN(userId)) {
        userMap.set(userId, row);
      }
    });

    let results: any[] = [];
    let profile: any = null;
    const lowerQuery = query.toLowerCase();

    switch (searchType) {
      case 'shipment_id':
        // 송장번호 검색: 국제송장번호 또는 작가발송 송장번호
        results = logisticsData.filter((row: any) => {
          const internationalTracking = String(row['국제송장번호'] || '').toLowerCase();
          const artistTracking = String(row['작가 발송 송장번호'] || '').toLowerCase();
          return internationalTracking.includes(lowerQuery) || artistTracking.includes(lowerQuery);
        });
        break;

      case 'order_code':
        // 주문번호 검색 (대소문자 구분 없이)
        results = logisticsData.filter((row: any) => {
          const orderCode = String(row.order_code || '').toLowerCase();
          return orderCode === lowerQuery || orderCode.includes(lowerQuery);
        });
        break;

      case 'user_id':
        // 사용자 ID 검색
        results = logisticsData.filter((row: any) => {
          const userId = String(row.user_id || '');
          return userId === query || userId.includes(query);
        });
        const userIdNum = parseInt(query);
        if (!isNaN(userIdNum) && userMap.has(userIdNum)) {
          profile = userMap.get(userIdNum);
        }
        break;

      case 'artist_name':
        // 작가명 검색 (한글/영문 모두)
        results = logisticsData.filter((row: any) => {
          const artistNameKr = String(row['artist_name (kr)'] || '').toLowerCase();
          const artistNameEn = String(row['artist_name'] || '').toLowerCase();
          return artistNameKr.includes(lowerQuery) || artistNameEn.includes(lowerQuery);
        });
        break;

      case 'product_name':
        // 상품명 검색
        results = logisticsData.filter((row: any) => {
          const productName = String(row.product_name || '').toLowerCase();
          return productName.includes(lowerQuery);
        });
        break;

      case 'artist_id':
        // 작가 ID 검색
        results = logisticsData.filter((row: any) => {
          const artistId = String(row.artist_id || '');
          return artistId === query || artistId.includes(query);
        });
        break;

      case 'product_id':
        // 상품 ID 검색
        results = logisticsData.filter((row: any) => {
          const productId = String(row.product_id || '');
          return productId === query || productId.includes(query);
        });
        break;

      default:
        return res.status(400).json({ error: '지원하지 않는 검색 타입입니다.' });
    }

    console.log(`[Lookup] Found ${results.length} results`);

    // 결과 정리 (중복 제거 및 필요한 필드만 추출)
    const uniqueResults = new Map<string, any>();
    results.forEach((row: any) => {
      const key = `${row.order_code}_${row.product_id || ''}`;
      if (!uniqueResults.has(key)) {
        uniqueResults.set(key, {
          orderCode: row.order_code || 'N/A',
          productName: row.product_name || '정보 없음',
          artistName: row['artist_name (kr)'] || row['artist_name'] || '정보 없음',
          country: row.country || 'N/A',
          logisticsStatus: row.logistics || 'N/A',
          orderCreated: row.order_created || 'N/A',
          userId: row.user_id || 'N/A',
          productId: row.product_id || 'N/A',
          artistId: row.artist_id || 'N/A',
          // 송장번호 (국제 또는 작가발송)
          shipmentId: row['국제송장번호'] || row['작가 발송 송장번호'] || 'N/A',
          // 추가 정보
          quantity: row['구매수량'] || 'N/A',
          price: row['상품금액'] || 'N/A',
        });
      }
    });

    res.json({
      searchType,
      query,
      results: Array.from(uniqueResults.values()),
      totalCount: uniqueResults.size,
      profile: profile
        ? {
            id: profile.ID,
            userId: profile.ID,
            name: profile.NAME || 'N/A',
            email: profile.EMAIL || 'N/A',
            country: profile.COUNTRY || 'N/A',
            createdAt: profile.CREATED_AT || 'N/A',
          }
        : null,
    });
  } catch (error: any) {
    console.error('[Lookup] Error performing lookup:', error?.message || error);
    res.status(500).json({ 
      error: 'Failed to perform lookup',
      details: error?.message || 'Unknown error'
    });
  }
});

export default router;
