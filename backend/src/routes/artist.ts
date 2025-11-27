import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';
import { getProductUrl } from '../utils/tracking';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 작가 정보 조회 헬퍼 함수
 */
function getArtistInfo(artistName: string, artistsData: any[]): { name: string; email?: string; artistId?: string } | null {
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
 * 작가별 주문 내역 조회
 * GET /api/artist/:artistName/orders?dateRange=30d
 */
router.get('/:artistName/orders', async (req, res) => {
  try {
    const { artistName } = req.params;
    const dateRange = (req.query.dateRange as string) || '30d';

    if (!artistName) {
      return res.status(400).json({ error: '작가 이름이 필요합니다.' });
    }

    const days = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }[dateRange];
    if (!days) {
      return res.status(400).json({ error: '잘못된 기간 값입니다.' });
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    const orderData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, false);
    const artistsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ARTISTS, false);
    
    // 작가 정보 조회
    const artistInfo = getArtistInfo(artistName, artistsData);

    // 기간 및 작가 이름으로 필터링
    const filteredLogistics = logisticsData.filter((row: any) => {
      if (row['artist_name (kr)'] !== artistName) return false;
      try {
        const orderDate = new Date(row.order_created);
        return orderDate >= startDate && orderDate <= endDate;
      } catch (e) {
        return false;
      }
    });

    if (filteredLogistics.length === 0) {
      return res.json({ orders: [] });
    }

    // 주문별로 아이템 그룹화 및 정보 집계
    const ordersByCode: Record<
      string,
      {
        orderCode: string;
        date: string;
        items: Array<{
          productName: string;
          quantity: string | number;
          amount: number;
          productUrl: string;
        }>;
        artistTotalAmount: number;
      }
    > = {};
    const USD_TO_KRW_RATE = 1350.0;
    const cleanAndParseFloat = (value: any): number => {
      if (typeof value === 'string') return parseFloat(value.replace(/,/g, '')) || 0;
      return value || 0;
    };

    filteredLogistics.forEach((row: any) => {
      const orderCode = row.order_code;
      if (!ordersByCode[orderCode]) {
        let orderDateStr = 'N/A';
        try {
          if (row.order_created) {
            orderDateStr = new Date(row.order_created).toLocaleDateString('ko-KR');
          } else {
            const orderInfo = orderData.find((o: any) => o.order_code === orderCode);
            if (orderInfo && orderInfo.order_created) {
              orderDateStr = new Date(orderInfo.order_created).toLocaleDateString('ko-KR');
            }
          }
        } catch (e) {
          // 무시
        }

        ordersByCode[orderCode] = {
          orderCode: orderCode,
          date: orderDateStr,
          items: [],
          artistTotalAmount: 0,
        };
      }

      const gmv = row['Total GMV'];
      const amountKrw = cleanAndParseFloat(gmv) * USD_TO_KRW_RATE;
      if (!isNaN(amountKrw)) {
        ordersByCode[orderCode].items.push({
          productName: row.product_name || '정보 없음',
          quantity: row['구매수량'] || 'N/A',
          amount: amountKrw,
          productUrl: getProductUrl(row.country, row.product_id),
        });
        ordersByCode[orderCode].artistTotalAmount += amountKrw;
      }
    });

    const ordersArray = Object.values(ordersByCode).sort((a, b) => {
      try {
        const dateA = new Date(a.date.replace(/\.\s*/g, '-').replace(/-$/, ''));
        const dateB = new Date(b.date.replace(/\.\s*/g, '-').replace(/-$/, ''));
        return dateB.getTime() - dateA.getTime(); // 내림차순 (최신순)
      } catch (e) {
        return 0;
      }
    });

    res.json({ 
      orders: ordersArray,
      artistInfo: artistInfo || {
        name: artistName,
        email: undefined,
        artistId: undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching artist orders:', error);
    res.status(500).json({ error: '작가 주문 내역 조회 중 오류 발생' });
  }
});

export default router;


