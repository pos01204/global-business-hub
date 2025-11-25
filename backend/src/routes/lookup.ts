import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 통합 검색
 * GET /api/lookup?query=검색어&searchType=order_code
 */
router.get('/', async (req, res) => {
  try {
    const query = req.query.query as string;
    const searchType = req.query.searchType as string;

    if (!query || !searchType) {
      return res.status(400).json({ error: '검색어와 검색 기준이 모두 필요합니다.' });
    }

    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    const usersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.USERS, false);

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
        results = logisticsData.filter(
          (row: any) => String(row.shipment_id || '').toLowerCase() === lowerQuery
        );
        break;

      case 'order_code':
        results = logisticsData.filter(
          (row: any) => row.order_code && row.order_code.toLowerCase() === lowerQuery
        );
        break;

      case 'user_id':
        results = logisticsData.filter(
          (row: any) => String(row.user_id || '').toLowerCase() === lowerQuery
        );
        const userIdNum = parseInt(query);
        if (!isNaN(userIdNum) && userMap.has(userIdNum)) {
          profile = userMap.get(userIdNum);
        }
        break;

      case 'artist_name':
        results = logisticsData.filter((row: any) => {
          const artistName = row['artist_name (kr)'] || row['artist_name'] || '';
          return artistName.toLowerCase().includes(lowerQuery);
        });
        break;

      case 'product_name':
        results = logisticsData.filter((row: any) => {
          const productName = row.product_name || '';
          return productName.toLowerCase().includes(lowerQuery);
        });
        break;

      case 'artist_id':
        results = logisticsData.filter(
          (row: any) => String(row.artist_id || '').toLowerCase() === lowerQuery
        );
        break;

      case 'product_id':
        results = logisticsData.filter(
          (row: any) => String(row.product_id || '').toLowerCase() === lowerQuery
        );
        break;

      default:
        return res.status(400).json({ error: '지원하지 않는 검색 타입입니다.' });
    }

    // 결과 정리 (중복 제거 및 필요한 필드만 추출)
    const uniqueResults = new Map<string, any>();
    results.forEach((row: any) => {
      const key = `${row.order_code}_${row.product_id || ''}`;
      if (!uniqueResults.has(key)) {
        uniqueResults.set(key, {
          orderCode: row.order_code,
          productName: row.product_name || '정보 없음',
          artistName: row['artist_name (kr)'] || row['artist_name'] || '정보 없음',
          country: row.country || 'N/A',
          logisticsStatus: row.logistics || 'N/A',
          orderCreated: row.order_created || 'N/A',
          userId: row.user_id || 'N/A',
          productId: row.product_id || 'N/A',
          artistId: row.artist_id || 'N/A',
          shipmentId: row.shipment_id || 'N/A',
        });
      }
    });

    res.json({
      searchType,
      query,
      results: Array.from(uniqueResults.values()),
      profile: profile
        ? {
            id: profile.ID,
            name: profile.NAME || 'N/A',
            email: profile.EMAIL || 'N/A',
            country: profile.COUNTRY || 'N/A',
            createdAt: profile.CREATED_AT || 'N/A',
          }
        : null,
    });
  } catch (error) {
    console.error('Error performing lookup:', error);
    res.status(500).json({ error: 'Failed to perform lookup' });
  }
});

export default router;


