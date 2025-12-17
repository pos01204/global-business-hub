import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';
import { CURRENCY } from '../config/constants';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * 메인 대시보드 데이터 조회
 * GET /api/dashboard/main?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/main', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 날짜 유효성 검사
    let validStartDate = startDate as string;
    let validEndDate = endDate as string;

    if (!validStartDate || !validEndDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 29);
      
      validEndDate = today.toISOString().split('T')[0];
      validStartDate = thirtyDaysAgo.toISOString().split('T')[0];
    }

    // Google Sheets 연결 확인
    const connectionStatus = await sheetsService.checkConnection();
    if (!connectionStatus.connected) {
      console.error('[Dashboard] Google Sheets 연결 실패');
      console.error('  오류:', connectionStatus.error);
      console.error('  상세 정보:', JSON.stringify(connectionStatus.details, null, 2));
      
      return res.status(503).json({
        error: 'Google Sheets에 연결할 수 없습니다.',
        message: connectionStatus.error,
        details: connectionStatus.details,
        troubleshooting: connectionStatus.details?.troubleshooting || [
          '1. Railway Variables에서 다음 환경 변수를 확인하세요:',
          '   - GOOGLE_SHEETS_SPREADSHEET_ID',
          '   - GOOGLE_SHEETS_CLIENT_EMAIL',
          '   - GOOGLE_SHEETS_PRIVATE_KEY',
          '2. 서비스 계정이 스프레드시트에 접근 권한이 있는지 확인하세요.',
          '3. 스프레드시트 ID가 올바른지 확인하세요.',
          '4. Railway 로그에서 더 자세한 오류 정보를 확인하세요.',
        ],
      });
    }

    // logistics 데이터 로드
    let logisticsData: any[] = [];
    try {
      logisticsData = await sheetsService.getSheetDataAsJson(
        SHEET_NAMES.LOGISTICS,
        true // fill-down 활성화
      );
      console.log(`[Dashboard] Logistics 데이터 로드 완료: ${logisticsData.length}건`);
    } catch (error: any) {
      console.error('[Dashboard] Logistics 데이터 로드 실패:', error.message);
      return res.status(500).json({
        error: 'Logistics 데이터를 불러오는 중 오류가 발생했습니다.',
        details: error.message,
        troubleshooting: [
          `시트 이름 '${SHEET_NAMES.LOGISTICS}'이 스프레드시트에 존재하는지 확인하세요.`,
          '서비스 계정이 스프레드시트에 접근 권한이 있는지 확인하세요.',
        ],
      });
    }

    // users 데이터 로드 (신규 고객 수 계산용 - Phase 1 Task 1.5)
    let usersData: any[] = [];
    try {
      usersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.USERS, false);
      console.log(`[Dashboard] Users 데이터 로드 완료: ${usersData.length}건`);
    } catch (error: any) {
      console.warn('[Dashboard] Users 데이터 로드 실패 (신규 고객 수 계산 불가):', error.message);
      // users 데이터 없어도 계속 진행
    }

    // 날짜 필터링
    const start = new Date(validStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(validEndDate);
    end.setHours(23, 59, 59, 999);

    const filterDataByDate = (data: any[], startDate: Date, endDate: Date) => {
      return data.filter((row) => {
        try {
          if (!row || !row.order_created) return false;
          const orderDate = new Date(row.order_created);
          return orderDate >= startDate && orderDate <= endDate;
        } catch (e) {
          return false;
        }
      });
    };

    const currentPeriodData = filterDataByDate(logisticsData, start, end);

    // 이전 기간 계산
    const periodDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const prevEnd = new Date(start.getTime() - 1);
    prevEnd.setHours(23, 59, 59, 999);
    const prevStart = new Date(prevEnd.getTime() - ((periodDays - 1) * 24 * 60 * 60 * 1000));
    prevStart.setHours(0, 0, 0, 0);

    const previousPeriodData = filterDataByDate(logisticsData, prevStart, prevEnd);

    // KPI 계산 - 환율 상수 사용 (Phase 1 표준화)
    const USD_TO_KRW_RATE = CURRENCY.USD_TO_KRW;
    const cleanAndParseFloat = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value.replace(/,/g, '')) || 0;
      return 0;
    };

    const getKrwValue = (gmv: any): number => {
      return cleanAndParseFloat(gmv) * USD_TO_KRW_RATE;
    };

    const calculateKpis = (data: any[]) => {
      let gmv = 0;
      let itemCount = 0;
      const orderCodes = new Set<string>();

      data.forEach((row) => {
        const rowGmv = getKrwValue(row['Total GMV']);
        gmv += rowGmv;
        itemCount += parseInt(row['구매수량'] || '0') || 0;
        if (row.order_code) orderCodes.add(row.order_code);
      });

      const orderCount = orderCodes.size;
      const aov = orderCount > 0 ? gmv / orderCount : 0;

      return { gmv, aov, orderCount, itemCount };
    };

    const kpisCurrent = calculateKpis(currentPeriodData);
    const kpisPrevious = calculateKpis(previousPeriodData);

    const getChange = (current: number, previous: number): number => {
      if (previous > 0) return (current - previous) / previous;
      if (current > 0) return Infinity;
      return 0;
    };

    // ==================== 신규 고객 수 계산 (Phase 1 Task 1.5) ====================
    const filterUsersByDate = (data: any[], startDate: Date, endDate: Date) => {
      return data.filter((row) => {
        try {
          if (!row || !row.CREATED_AT) return false;
          const createdAt = new Date(row.CREATED_AT);
          return createdAt >= startDate && createdAt <= endDate;
        } catch (e) {
          return false;
        }
      });
    };

    const newCustomersCurrent = usersData.length > 0 
      ? filterUsersByDate(usersData, start, end).length 
      : 0;
    const newCustomersPrevious = usersData.length > 0 
      ? filterUsersByDate(usersData, prevStart, prevEnd).length 
      : 0;

    // ==================== 배송 완료율 계산 (Phase 1 Task 1.5) ====================
    // 현재 기간 배송 완료율 계산
    const calculateDeliveryRate = (data: any[]) => {
      const orderCodes = new Set<string>();
      const completedOrderCodes = new Set<string>();

      data.forEach((row) => {
        if (row.order_code) {
          orderCodes.add(row.order_code);
          // '배송 완료' 상태인 경우 완료로 카운트
          const status = (row.logistics || '').trim();
          if (status === '배송 완료' || status === '배달 완료') {
            completedOrderCodes.add(row.order_code);
          }
        }
      });

      const totalOrders = orderCodes.size;
      const completedOrders = completedOrderCodes.size;
      return totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    };

    const deliveryRateCurrent = calculateDeliveryRate(currentPeriodData);
    const deliveryRatePrevious = calculateDeliveryRate(previousPeriodData);

    // 미입고 현황 (현재 시점 기준)
    const UNRECEIVED_THRESHOLD_DAYS = 7;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - UNRECEIVED_THRESHOLD_DAYS);

    let totalUnreceived = 0;
    let delayedUnreceived = 0;

    logisticsData.forEach((row) => {
      if (
        (row.logistics || '').trim() === '결제 완료' &&
        (row['처리상태'] || '').trim() !== '처리완료'
      ) {
        totalUnreceived++;
        try {
          const orderDate = new Date(row.order_created);
          if (orderDate <= thresholdDate) {
            delayedUnreceived++;
          }
        } catch (e) {
          // 날짜 파싱 실패 시 무시
        }
      }
    });

    // 트렌드 차트 데이터 생성
    const trendStartDate = start;
    const trendData = filterDataByDate(logisticsData, trendStartDate, end);

    const dailyData: Record<string, { gmv: number; orderCodes: Set<string> }> = {};
    let currentDate = new Date(trendStartDate.getTime());
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyData[dateStr] = { gmv: 0, orderCodes: new Set<string>() };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    trendData.forEach((row) => {
      try {
        const dateStr = new Date(row.order_created).toISOString().split('T')[0];
        if (dailyData[dateStr]) {
          dailyData[dateStr].gmv += getKrwValue(row['Total GMV']);
          if (row.order_code) dailyData[dateStr].orderCodes.add(row.order_code);
        }
      } catch (e) {
        // 날짜 파싱 실패 시 무시
      }
    });

    const labels = Object.keys(dailyData).sort();
    const gmvValues = labels.map((label) => Math.round(dailyData[label].gmv));
    const orderValues = labels.map((label) => dailyData[label].orderCodes.size);

    // 7일 이동평균 계산
    const calculateMA = (data: number[], period: number): (number | null)[] => {
      const ma: (number | null)[] = [];
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          ma.push(null);
        } else {
          const slice = data.slice(i - period + 1, i + 1);
          const avg = slice.reduce((a, b) => a + b, 0) / period;
          ma.push(Math.round(avg));
        }
      }
      return ma;
    };

    const gmvMA7 = calculateMA(gmvValues, 7);
    const ordersMA7 = calculateMA(orderValues, 7);

    const trendChartData = {
      labels,
      datasets: [
        {
          label: 'GMV (일별)',
          data: gmvValues,
          type: 'bar' as const,
          backgroundColor: 'rgba(74, 111, 165, 0.2)',
          borderColor: 'rgba(74, 111, 165, 0.2)',
          yAxisID: 'yGmv',
        },
        {
          label: '주문 건수 (일별)',
          data: orderValues,
          type: 'bar' as const,
          backgroundColor: 'rgba(247, 159, 121, 0.2)',
          borderColor: 'rgba(247, 159, 121, 0.2)',
          yAxisID: 'yOrders',
        },
        {
          label: 'GMV (7일 이동평균)',
          data: gmvMA7,
          type: 'line' as const,
          backgroundColor: '#4A6FA5',
          borderColor: '#4A6FA5',
          borderWidth: 2,
          pointRadius: 0,
          yAxisID: 'yGmv',
          tension: 0.3,
        },
        {
          label: '주문 건수 (7일 이동평균)',
          data: ordersMA7,
          type: 'line' as const,
          backgroundColor: '#F79F79',
          borderColor: '#F79F79',
          borderWidth: 2,
          pointRadius: 0,
          yAxisID: 'yOrders',
          tension: 0.3,
        },
      ],
    };

    // 스냅샷
    const activeCountries = new Set<string>();
    const activeArtists = new Set<string>();
    const activeItems = new Set<string>();

    currentPeriodData.forEach((row) => {
      if (row.country) activeCountries.add(row.country);
      if (row['artist_name (kr)']) activeArtists.add(row['artist_name (kr)']);
      if (row.product_id) activeItems.add(row.product_id);
    });

    res.json({
      kpis: {
        gmv: {
          value: kpisCurrent.gmv,
          change: getChange(kpisCurrent.gmv, kpisPrevious.gmv),
        },
        aov: {
          value: kpisCurrent.aov,
          change: getChange(kpisCurrent.aov, kpisPrevious.aov),
        },
        orderCount: {
          value: kpisCurrent.orderCount,
          change: getChange(kpisCurrent.orderCount, kpisPrevious.orderCount),
        },
        itemCount: {
          value: kpisCurrent.itemCount,
          change: getChange(kpisCurrent.itemCount, kpisPrevious.itemCount),
        },
        // Phase 1 Task 1.5: 신규 고객 수 (실제 데이터)
        newCustomers: {
          value: newCustomersCurrent,
          change: getChange(newCustomersCurrent, newCustomersPrevious),
        },
        // Phase 1 Task 1.5: 배송 완료율 (실제 데이터)
        deliveryRate: {
          value: deliveryRateCurrent,
          change: deliveryRateCurrent - deliveryRatePrevious, // 포인트 변화
        },
      },
      trend: trendChartData,
      inventoryStatus: {
        total: totalUnreceived,
        delayed: delayedUnreceived,
        threshold: UNRECEIVED_THRESHOLD_DAYS,
      },
      snapshot: {
        activeCountries: activeCountries.size,
        activeArtists: activeArtists.size,
        activeItems: activeItems.size,
      },
    });
  } catch (error) {
    console.error('Error fetching main dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

/**
 * 오늘 할 일 (Today's Tasks) 데이터 조회
 * GET /api/dashboard/tasks
 */
router.get('/tasks', async (req, res) => {
  try {
    const now = new Date();
    const tasks: Array<{
      id: string;
      title: string;
      count: number;
      priority: 'high' | 'medium' | 'low';
      icon: string;
      link: string;
      description: string;
    }> = [];

    // 1. 미입고 7일 이상 확인
    try {
      const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
      const unreceivedDelayed = logisticsData.filter((row: any) => {
        const status = (row.logistics || '').toLowerCase();
        if (!status.includes('미입고')) return false;
        
        const orderDate = new Date(row.order_created);
        if (isNaN(orderDate.getTime())) return false;
        
        const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 7;
      });

      if (unreceivedDelayed.length > 0) {
        tasks.push({
          id: 'unreceived',
          title: '미입고 지연 처리',
          count: unreceivedDelayed.length,
          priority: 'high',
          icon: '📦',
          link: '/unreceived?delay=delayed',
          description: '7일 이상 미입고 건 확인 필요',
        });
      }
    } catch (e) {
      console.error('[Tasks] Error checking unreceived:', e);
    }

    // 2. QC 대기 건수 확인
    try {
      const qcTextData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.QC_TEXT_RAW, false);
      const qcImageData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.QC_IMAGE_RAW, false);
      
      const qcTextPending = qcTextData.filter((row: any) => {
        const status = (row['처리 상태'] || row.status || '').toLowerCase();
        // completedAt이 있으면 이미 완료된 건 - 제외
        const completedAt = row.completedAt || row.completed_at || row.CompletedAt;
        const hasCompletedAt = completedAt && String(completedAt).trim() !== '';
        if (hasCompletedAt) return false;
        return !status.includes('완료') && !status.includes('skip') && !status.includes('archived');
      }).length;
      
      const qcImagePending = qcImageData.filter((row: any) => {
        const status = (row['처리 상태'] || row.status || '').toLowerCase();
        // completedAt이 있으면 이미 완료된 건 - 제외
        const completedAt = row.completedAt || row.completed_at || row.CompletedAt;
        const hasCompletedAt = completedAt && String(completedAt).trim() !== '';
        if (hasCompletedAt) return false;
        return !status.includes('완료') && !status.includes('skip') && !status.includes('archived');
      }).length;
      
      const totalQcPending = qcTextPending + qcImagePending;
      
      if (totalQcPending > 0) {
        tasks.push({
          id: 'qc',
          title: 'QC 검수 대기',
          count: totalQcPending,
          priority: totalQcPending > 10 ? 'high' : 'medium',
          icon: '✅',
          link: '/qc',
          description: `텍스트 ${qcTextPending}건, 이미지 ${qcImagePending}건`,
        });
      }
    } catch (e) {
      console.error('[Tasks] Error checking QC:', e);
    }

    // 3. 소포수령증 미신청자 확인
    try {
      const sopoTrackingData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SOPO_TRACKING, false);
      const sopoNotApplied = sopoTrackingData.filter((row: any) => {
        const status = (row['신청 상태'] || row.status || '').toLowerCase();
        return status.includes('미신청') || status === '';
      }).length;
      
      if (sopoNotApplied > 0) {
        tasks.push({
          id: 'sopo',
          title: '소포수령증 리마인드',
          count: sopoNotApplied,
          priority: 'medium',
          icon: '📋',
          link: '/sopo-receipt',
          description: '미신청 작가 리마인드 필요',
        });
      }
    } catch (e) {
      console.error('[Tasks] Error checking SOPO:', e);
    }

    // 4. 이탈 위험 고객 (간략 버전)
    try {
      const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
      const customerLastOrder = new Map<string, Date>();
      
      logisticsData.forEach((row: any) => {
        const userId = String(row.user_id || '');
        if (!userId) return;
        const orderDate = new Date(row.order_created);
        if (isNaN(orderDate.getTime())) return;
        
        const existing = customerLastOrder.get(userId);
        if (!existing || orderDate > existing) {
          customerLastOrder.set(userId, orderDate);
        }
      });
      
      let churnRiskCount = 0;
      customerLastOrder.forEach((lastOrder) => {
        const daysSinceOrder = Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceOrder > 60 && daysSinceOrder <= 90) {
          churnRiskCount++;
        }
      });
      
      if (churnRiskCount > 0) {
        tasks.push({
          id: 'churn',
          title: '이탈 위험 고객',
          count: churnRiskCount,
          priority: 'low',
          icon: '⚠️',
          link: '/customer-analytics?tab=churn',
          description: '60-90일 미구매 고객 리텐션 필요',
        });
      }
    } catch (e) {
      console.error('[Tasks] Error checking churn:', e);
    }

    // 5. 검수 대기 2일+ (긴급)
    try {
      const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
      const awaitingInspection = logisticsData.filter((row: any) => {
        const status = (row.logistics || '').trim();
        if (status !== '입고 완료') return false;
        
        const updateDate = new Date(row.logistics_updated || row.order_created);
        if (isNaN(updateDate.getTime())) return false;
        
        const daysDiff = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 2;
      });

      if (awaitingInspection.length > 0) {
        tasks.push({
          id: 'inspection-delayed',
          title: '검수 대기 2일+',
          count: awaitingInspection.length,
          priority: 'high',
          icon: '🔍',
          link: '/control-tower',
          description: '검수 지연 건 즉시 처리 필요',
        });
      }
    } catch (e) {
      console.error('[Tasks] Error checking inspection:', e);
    }

    // 6. 국제배송 14일+ 지연
    try {
      const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
      const intlShippingDelayed = logisticsData.filter((row: any) => {
        const status = (row.logistics || '').trim();
        if (!status.includes('국제배송') && !status.includes('해외배송')) return false;
        
        const updateDate = new Date(row.logistics_updated || row.order_created);
        if (isNaN(updateDate.getTime())) return false;
        
        const daysDiff = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 14;
      });

      if (intlShippingDelayed.length > 0) {
        tasks.push({
          id: 'intl-shipping-delayed',
          title: '국제배송 14일+ 지연',
          count: intlShippingDelayed.length,
          priority: 'medium',
          icon: '✈️',
          link: '/logistics?status=국제배송',
          description: '배송 지연 건 확인 필요',
        });
      }
    } catch (e) {
      console.error('[Tasks] Error checking intl shipping:', e);
    }

    // 7. 미입고 14일+ (긴급 - 기존 7일과 별도)
    try {
      const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
      const unreceived14Days = logisticsData.filter((row: any) => {
        const status = (row.logistics || '').trim();
        if (status !== '결제 완료') return false;
        
        const orderDate = new Date(row.order_created);
        if (isNaN(orderDate.getTime())) return false;
        
        const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 14;
      });

      if (unreceived14Days.length > 0) {
        tasks.push({
          id: 'unreceived-critical',
          title: '미입고 14일+ 긴급',
          count: unreceived14Days.length,
          priority: 'high',
          icon: '🚨',
          link: '/unreceived?delay=critical',
          description: '즉시 작가 연락 필요',
        });
      }
    } catch (e) {
      console.error('[Tasks] Error checking critical unreceived:', e);
    }

    // 우선순위 정렬
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    res.json({
      success: true,
      date: now.toISOString().split('T')[0],
      totalTasks: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error('[Tasks] Error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

export default router;

