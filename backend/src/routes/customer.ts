import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 고객 상세 정보 조회
 * GET /api/customer/:userId
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: '조회할 User ID가 필요합니다.' });
    }

    const USD_TO_KRW_RATE = 1350.0;
    const cleanAndParseFloat = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value.replace(/,/g, '')) || 0;
      return 0;
    };

    const getKrwValue = (gmv: any): number => {
      return cleanAndParseFloat(gmv) * USD_TO_KRW_RATE;
    };

    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    const orderData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, false);
    const usersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.USERS, false);

    // 사용자 맵 생성
    const userMap = new Map<number, any>();
    usersData.forEach((row: any) => {
      const userIdNum = parseInt(row.ID);
      if (!isNaN(userIdNum)) {
        userMap.set(userIdNum, row);
      }
    });

    const customerDb: Record<
      string,
      {
        userId: string;
        orders: Array<{ date: Date; amount: number; orderCode: string }>;
        totalAmount: number;
        orderCount: number;
        lastOrderDate: Date;
        artistSet: Set<string>;
        productCountPerOrder: Record<string, number>;
        firstOrderDate: Date;
      }
    > = {};
    const orderCodeToUserId: Record<string, string> = {};

    orderData.forEach((row: any) => {
      const currentUserId = String(row.user_id);
      if (!currentUserId) return;

      const orderCode = row.order_code;
      if (orderCode) {
        orderCodeToUserId[orderCode] = currentUserId;
      }

      if (!customerDb[currentUserId]) {
        customerDb[currentUserId] = {
          userId: currentUserId,
          orders: [],
          totalAmount: 0,
          orderCount: 0,
          lastOrderDate: new Date('1970-01-01'),
          artistSet: new Set(),
          productCountPerOrder: {},
          firstOrderDate: new Date('9999-12-31'),
        };
      }

      let orderDate: Date;
      try {
        orderDate = new Date(row.order_created);
        if (isNaN(orderDate.getTime())) throw new Error('Invalid Date');
      } catch (e) {
        return;
      }

      const amount = getKrwValue(row['Total GMV']);
      if (!isNaN(amount) && amount >= 0) {
        customerDb[currentUserId].orders.push({
          date: orderDate,
          amount: amount,
          orderCode: orderCode,
        });
        customerDb[currentUserId].totalAmount += amount;
        customerDb[currentUserId].orderCount++;
        if (orderDate > customerDb[currentUserId].lastOrderDate) {
          customerDb[currentUserId].lastOrderDate = orderDate;
        }
        if (orderDate < customerDb[currentUserId].firstOrderDate) {
          customerDb[currentUserId].firstOrderDate = orderDate;
        }
      }
    });

    logisticsData.forEach((row: any) => {
      const currentUserId = orderCodeToUserId[row.order_code];
      if (!currentUserId || !customerDb[currentUserId]) return;

      const artistName = row['artist_name (kr)'];
      if (artistName) {
        customerDb[currentUserId].artistSet.add(artistName);
      }

      const orderCode = row.order_code;
      let quantity = 1;
      if (row['구매수량']) {
        const parsedQty = parseInt(String(row['구매수량']).replace(/,/g, ''));
        if (!isNaN(parsedQty) && parsedQty > 0) {
          quantity = parsedQty;
        }
      }
      customerDb[currentUserId].productCountPerOrder[orderCode] =
        (customerDb[currentUserId].productCountPerOrder[orderCode] || 0) + quantity;
    });

    const targetUserIdString = String(userId);
    const targetUserIdNumber = parseInt(userId);
    const customerData = customerDb[targetUserIdString];

    if (!customerData) {
      const userInfoFallback = userMap.get(targetUserIdNumber);
      const profileFallback = userInfoFallback
        ? {
            name: userInfoFallback.NAME || 'N/A',
            email: userInfoFallback.EMAIL || 'N/A',
            country: userInfoFallback.COUNTRY || 'N/A',
            createdAt: userInfoFallback.CREATED_AT
              ? new Date(userInfoFallback.CREATED_AT).toLocaleDateString('ko-KR')
              : 'N/A',
          }
        : { name: 'N/A', email: 'N/A', country: 'N/A', createdAt: 'N/A' };

      return res.json({
        userId: targetUserIdString,
        profile: profileFallback,
        stats: { R: 'N/A', F: 0, M: 0, ArtistDiversity: 0 },
        orders: [],
        artistList: [],
      });
    }

    // 주문 객체에 상품 수량 및 포맷된 날짜 추가
    customerData.orders.forEach((order) => {
      (order as any).productCount =
        customerDb[targetUserIdString].productCountPerOrder[order.orderCode] || 0;
      (order as any).dateFormatted =
        order.date instanceof Date && !isNaN(order.date.getTime())
          ? order.date.toLocaleDateString('ko-KR')
          : 'N/A';
    });

    const sortedOrders = customerData.orders.sort((a, b) => b.date.getTime() - a.date.getTime());
    const serializableOrders = sortedOrders.map((order) => {
      return {
        orderCode: order.orderCode,
        amount: order.amount,
        productCount: (order as any).productCount,
        dateFormatted: (order as any).dateFormatted,
      };
    });

    const artistList = Array.from(customerData.artistSet).sort();
    const now = new Date();
    const R_days =
      customerData.lastOrderDate instanceof Date &&
      !isNaN(customerData.lastOrderDate.getTime()) &&
      customerData.lastOrderDate.getFullYear() !== 1970
        ? Math.floor(
            (now.getTime() - customerData.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        : Infinity;

    const userInfo = userMap.get(targetUserIdNumber);
    const profile = userInfo
      ? {
          name: userInfo.NAME || 'N/A',
          email: userInfo.EMAIL || 'N/A',
          country: userInfo.COUNTRY || 'N/A',
          createdAt: userInfo.CREATED_AT
            ? new Date(userInfo.CREATED_AT).toLocaleDateString('ko-KR')
            : 'N/A',
        }
      : { name: 'N/A', email: 'N/A', country: 'N/A', createdAt: 'N/A' };

    res.json({
      userId: customerData.userId,
      profile: profile,
      stats: {
        R: R_days === Infinity ? 'N/A' : R_days,
        F: customerData.orderCount,
        M: customerData.totalAmount,
        ArtistDiversity: artistList.length,
      },
      orders: serializableOrders,
      artistList: artistList,
    });
  } catch (error) {
    console.error('Error fetching customer detail:', error);
    res.status(500).json({ error: '고객 상세 정보를 불러오는 중 오류가 발생했습니다.' });
  }
});

export default router;


