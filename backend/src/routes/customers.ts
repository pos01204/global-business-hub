import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 활동 상태별 고객 목록 CSV 내보내기
 * GET /api/customers/export?status=Active&countryFilter=all
 */
router.get('/export', async (req, res) => {
  try {
    const status = (req.query.status as string) || 'Active';
    const countryFilter = (req.query.countryFilter as string) || 'all';

    if (!['Active', 'Inactive', 'Churn Risk', 'noPurchase'].includes(status)) {
      return res.status(400).json({ error: '잘못된 상태 값입니다.' });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let orderData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, false);
    const usersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.USERS, false);

    // 사용자 맵 생성
    const userMap = new Map<number, any>();
    usersData.forEach((row: any) => {
      const userId = parseInt(row.ID);
      if (!isNaN(userId)) {
        userMap.set(userId, row);
      }
    });

    // 국가 필터링 적용
    if (countryFilter === 'jp') {
      orderData = orderData.filter((row: any) => {
        const userId = parseInt(row.user_id);
        const userInfo = userMap.get(userId);
        return userInfo && userInfo.COUNTRY === 'JP';
      });
    } else if (countryFilter === 'non_jp') {
      orderData = orderData.filter((row: any) => {
        const userId = parseInt(row.user_id);
        const userInfo = userMap.get(userId);
        return !userInfo || userInfo.COUNTRY !== 'JP';
      });
    }

    // RFM DB 구축 (활동 상태 계산용)
    const customerDb: Record<
      number,
      {
        userId: number;
        orderCount: number;
        lastOrderDate: Date;
        activityStatus?: string;
      }
    > = {};

    orderData.forEach((row: any) => {
      try {
        const userId = parseInt(row.user_id);
        if (!userId || isNaN(userId)) return;

        if (!customerDb[userId]) {
          customerDb[userId] = {
            userId,
            orderCount: 0,
            lastOrderDate: new Date('1970-01-01'),
          };
        }

        const orderDate = new Date(row.order_created);
        if (!isNaN(orderDate.getTime())) {
          customerDb[userId].orderCount++;
          if (orderDate > customerDb[userId].lastOrderDate) {
            customerDb[userId].lastOrderDate = orderDate;
          }
        }
      } catch (e) {
        // 에러 무시
      }
    });

    // 활동 상태 계산
    const activityThresholds = { active: 90, inactive: 180 };
    Object.values(customerDb).forEach((customer) => {
      let calculatedStatus = 'noPurchase';
      if (
        customer.orderCount > 0 &&
        customer.lastOrderDate instanceof Date &&
        !isNaN(customer.lastOrderDate.getTime()) &&
        customer.lastOrderDate.getFullYear() !== 1970
      ) {
        const lastOrderDay = new Date(
          customer.lastOrderDate.getFullYear(),
          customer.lastOrderDate.getMonth(),
          customer.lastOrderDate.getDate()
        );
        const daysSinceLastOrder =
          (today.getTime() - lastOrderDay.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceLastOrder <= activityThresholds.active) {
          calculatedStatus = 'Active';
        } else if (daysSinceLastOrder <= activityThresholds.inactive) {
          calculatedStatus = 'Inactive';
        } else {
          calculatedStatus = 'Churn Risk';
        }
      }
      customer.activityStatus = calculatedStatus;
    });

    // 요청된 상태의 고객 필터링 및 CSV 생성
    const requestedStatus = status;
    let csvContent = 'user_id,name,email,country\n';
    let count = 0;

    Object.values(customerDb).forEach((customer) => {
      if (customer.activityStatus === requestedStatus) {
        const userInfo = userMap.get(customer.userId);
        if (userInfo) {
          const name = `"${String(userInfo.NAME || '').replace(/"/g, '""')}"`;
          const email = `"${String(userInfo.EMAIL || '').replace(/"/g, '""')}"`;
          const country = `"${String(userInfo.COUNTRY || '').replace(/"/g, '""')}"`;
          csvContent += `${customer.userId},${name},${email},${country}\n`;
          count++;
        }
      }
    });

    // noPurchase 상태인 경우 구매 이력 없는 사용자도 포함
    if (requestedStatus === 'noPurchase') {
      userMap.forEach((user, userId) => {
        if (!customerDb[userId]) {
          const name = `"${String(user.NAME || '').replace(/"/g, '""')}"`;
          const email = `"${String(user.EMAIL || '').replace(/"/g, '""')}"`;
          const country = `"${String(user.COUNTRY || '').replace(/"/g, '""')}"`;
          csvContent += `${userId},${name},${email},${country}\n`;
          count++;
        }
      });
    }

    // 국가 필터링 적용 (CSV 생성 후)
    if (countryFilter === 'jp') {
      const lines = csvContent.split('\n');
      const header = lines[0];
      const filteredLines = lines.slice(1).filter((line) => {
        if (!line) return false;
        const country = line.match(/"([^"]+)"/g)?.[2]?.replace(/"/g, '');
        return country === 'JP';
      });
      csvContent = header + '\n' + filteredLines.join('\n');
      count = filteredLines.length;
    } else if (countryFilter === 'non_jp') {
      const lines = csvContent.split('\n');
      const header = lines[0];
      const filteredLines = lines.slice(1).filter((line) => {
        if (!line) return false;
        const country = line.match(/"([^"]+)"/g)?.[2]?.replace(/"/g, '');
        return country !== 'JP';
      });
      csvContent = header + '\n' + filteredLines.join('\n');
      count = filteredLines.length;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="customers_${status}_${countryFilter}_${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send('\ufeff' + csvContent); // UTF-8 BOM 추가 (Excel 호환성)
  } catch (error) {
    console.error('Error exporting customer list:', error);
    res.status(500).json({ error: '고객 목록 내보내기 중 오류가 발생했습니다.' });
  }
});

export default router;


