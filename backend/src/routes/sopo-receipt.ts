/**
 * 소포수령증 발급 관리 라우트
 * - 롯데 선적 CSV 업로드 & 검증
 * - 대상 작가 추출 & 주문내역서 생성
 * - 안내 이메일 발송
 * - JotForm 신청 트래킹
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';
import ResendService from '../services/resendService';
import { resendConfig, isEmailConfigured } from '../config/email';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

// 환율 (다른 라우트와 동일하게 통일)
const USD_TO_KRW = 1400;

// 이메일 서비스 초기화
let emailService: ResendService | null = null;
if (isEmailConfigured) {
  emailService = new ResendService(resendConfig);
}

// Multer 설정
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('CSV 파일만 업로드 가능합니다.'));
    }
  },
});

// ============================================
// 작가 정보 캐시 (QC와 동일한 방식으로 개선)
// ============================================
interface ArtistInfo {
  name: string;
  email?: string;
  artistId?: string;
  krId?: string;
}

// 캐시 저장소
const artistCache = {
  byId: new Map<string, ArtistInfo>(),      // artist_id로 매핑
  byName: new Map<string, ArtistInfo>(),    // 작가명으로 매핑
  lastLoaded: 0,
};
const CACHE_TTL = 5 * 60 * 1000; // 5분

/**
 * 숫자 파싱 유틸리티
 */
function cleanAndParseFloat(value: any): number {
  if (value === undefined || value === null || value === '') return 0;
  const cleaned = String(value).replace(/[$,￦₩\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 작가 정보 로드 (캐시 활용) - QC 라우트와 동일한 방식
 */
async function loadArtists(forceReload = false): Promise<void> {
  const now = Date.now();
  if (!forceReload && artistCache.lastLoaded > 0 && now - artistCache.lastLoaded < CACHE_TTL) {
    return;
  }

  try {
    artistCache.byId.clear();
    artistCache.byName.clear();

    // 1. artists 시트 로드
    const artistsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ARTISTS, false);
    
    // 가능한 ID 컬럼명들 (QC와 동일)
    const possibleIdColumns = [
      '작가 ID (Global)', '작가ID(Global)', '작가 ID(Global)',
      'artist_id', 'global_artist_id', 'artistId', 'globalArtistId',
      'ID', 'id', '작가 ID', '작가ID', '(Global)', 'artist ID',
    ];
    
    // 가능한 KR ID 컬럼명들
    const possibleKrIdColumns = [
      '작가 ID (KR)', '작가ID(KR)', '작가 ID(KR)', '(KR)', 'kr_artist_id',
    ];
    
    // 가능한 이름 컬럼명들
    const possibleNameColumns = [
      'artist_name (kr)', 'artist_name(kr)', '(KR)작가명', '작가명 (KR)',
      'artist_name_kr', 'name_kr', 'name', 'artistName',
    ];
    
    // 가능한 이메일 컬럼명들
    const possibleEmailColumns = [
      'mail', 'email', 'Email', 'Mail', 'EMAIL', 'MAIL', 
      'artist_email', 'e-mail', 'E-mail',
    ];

    if (artistsData.length > 0 && artistCache.lastLoaded === 0) {
      console.log('[Sopo] Artists 시트 컬럼명:', Object.keys(artistsData[0]).slice(0, 15).join(', '));
    }

    artistsData.forEach((artist: any) => {
      // ID 추출
      let artistId: string | null = null;
      for (const col of possibleIdColumns) {
        if (artist[col] !== undefined && artist[col] !== null && artist[col] !== '') {
          artistId = String(artist[col]).trim();
          if (artistId && artistId !== '0') break;
        }
      }
      
      // KR ID 추출
      let krId: string | null = null;
      for (const col of possibleKrIdColumns) {
        if (artist[col] !== undefined && artist[col] !== null && artist[col] !== '') {
          krId = String(artist[col]).trim();
          if (krId && krId !== '0') break;
        }
      }
      
      // 이름 추출
      let artistName: string | null = null;
      for (const col of possibleNameColumns) {
        if (artist[col] !== undefined && artist[col] !== null && artist[col] !== '') {
          artistName = String(artist[col]).trim();
          if (artistName) break;
        }
      }
      
      // 이메일 추출
      let artistEmail: string | null = null;
      for (const col of possibleEmailColumns) {
        if (artist[col] !== undefined && artist[col] !== null && artist[col] !== '') {
          artistEmail = String(artist[col]).trim();
          if (artistEmail && artistEmail.includes('@')) break;
        }
      }

      const info: ArtistInfo = {
        name: artistName || '',
        email: artistEmail || undefined,
        artistId: artistId || undefined,
        krId: krId || undefined,
      };

      // ID로 매핑
      if (artistId) {
        artistCache.byId.set(artistId, info);
      }
      if (krId) {
        artistCache.byId.set(krId, info);
      }
      
      // 이름으로 매핑
      if (artistName) {
        artistCache.byName.set(artistName, info);
        // 소문자로도 매핑 (대소문자 무시)
        artistCache.byName.set(artistName.toLowerCase(), info);
      }
    });

    console.log(`[Sopo] artists 시트에서 로드: ID ${artistCache.byId.size}개, 이름 ${artistCache.byName.size}개`);

    // 2. artists_mail 시트에서 이메일 보강
    try {
      const mailData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ARTISTS_MAIL, false);
      
      if (mailData.length > 0) {
        if (artistCache.lastLoaded === 0) {
          console.log('[Sopo] Artists_mail 시트 컬럼명:', Object.keys(mailData[0]).slice(0, 10).join(', '));
        }
        
        const mailIdColumns = ['ID', 'id', 'artist_id', '작가 ID', '작가ID', ...possibleIdColumns];
        const mailEmailColumns = ['email', 'mail', 'Email', 'Mail', 'EMAIL', 'MAIL', 'e-mail', 'E-mail'];
        
        let emailsAdded = 0;
        
        mailData.forEach((row: any) => {
          let artistId: string | null = null;
          let artistEmail: string | null = null;
          
          // ID 찾기
          for (const col of mailIdColumns) {
            if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
              artistId = String(row[col]).trim();
              if (artistId && artistId !== '0') break;
            }
          }
          
          // 이메일 찾기
          for (const col of mailEmailColumns) {
            if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
              artistEmail = String(row[col]).trim();
              if (artistEmail && artistEmail.includes('@')) break;
            }
          }
          
          // ID와 이메일이 있으면 매핑 업데이트
          if (artistId && artistEmail) {
            const existing = artistCache.byId.get(artistId);
            if (existing) {
              if (!existing.email) {
                existing.email = artistEmail;
                emailsAdded++;
              }
            } else {
              // 새로운 ID-이메일 매핑 추가
              artistCache.byId.set(artistId, {
                name: '',
                email: artistEmail,
                artistId: artistId,
              });
              emailsAdded++;
            }
          }
        });
        
        console.log(`[Sopo] artists_mail에서 ${emailsAdded}개 이메일 보강`);
      }
    } catch (e) {
      console.warn('[Sopo] artists_mail 로드 실패 (무시)');
    }

    artistCache.lastLoaded = now;
    console.log(`[Sopo] 작가 정보 로드 완료`);
  } catch (error: any) {
    console.error('[Sopo] 작가 정보 로드 실패:', error.message);
  }
}

/**
 * 작가 정보 조회 (ID 또는 이름으로)
 */
function getArtistInfo(artistIdOrName: string): ArtistInfo | undefined {
  const key = String(artistIdOrName).trim();
  
  // ID로 먼저 검색
  let info = artistCache.byId.get(key);
  if (info) return info;
  
  // 이름으로 검색
  info = artistCache.byName.get(key);
  if (info) return info;
  
  // 소문자로 검색
  info = artistCache.byName.get(key.toLowerCase());
  if (info) return info;
  
  return undefined;
}

/**
 * logistics 행에서 작가 정보 추출
 */
function extractArtistFromLogistics(row: any): { name: string; id?: string; email?: string } {
  // 작가명 추출
  const artistName = row['artist_name (kr)'] || row['artist_name(kr)'] || 
                     row.artist_name_kr || row.artist_name || row.artist || '알 수 없음';
  
  // 작가 ID 추출
  const artistId = row.artist_id || row.global_artist_id || row.artistId || undefined;
  
  // 캐시에서 이메일 조회
  let email: string | undefined = undefined;
  
  // ID로 먼저 검색
  if (artistId) {
    const infoById = artistCache.byId.get(String(artistId));
    if (infoById?.email) {
      email = infoById.email;
    }
  }
  
  // ID로 못 찾으면 이름으로 검색
  if (!email) {
    const infoByName = getArtistInfo(artistName);
    if (infoByName?.email) {
      email = infoByName.email;
    }
  }
  
  return {
    name: artistName,
    id: artistId ? String(artistId) : undefined,
    email,
  };
}

// ============================================
// API 엔드포인트
// ============================================

/**
 * POST /api/sopo-receipt/upload
 * 롯데 선적 CSV 업로드 & logistics 데이터와 교차 검증
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '파일이 없습니다.' });
    }

    const period = req.body.period || new Date().toISOString().slice(0, 7);
    console.log(`[Sopo] 선적 CSV 업로드: ${req.file.originalname}, 기간: ${period}`);

    // CSV 파싱
    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: false,
      skip_empty_lines: true,
      relax_column_count: true,
    });

    // 헤더 찾기 (첫 번째 유효 행)
    let headerRowIndex = 0;
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      if (row[0] && (row[0].includes('No') || row[0].includes('운송구분'))) {
        headerRowIndex = i;
        break;
      }
    }

    // 데이터 행 추출 (빈 행 제외)
    const dataRows = records.slice(headerRowIndex + 1).filter((row: any[]) => {
      return row[3] && String(row[3]).trim() !== ''; // 주문번호가 있는 행만
    });

    // 선적 데이터 파싱
    interface ShipmentRecord {
      no: number;
      carrier: string;
      trackingNumber: string;
      shipmentId: string;
      shippedAt: string;
      sender: string;
      recipient: string;
      countryCode: string;
    }

    const shipments: ShipmentRecord[] = dataRows.map((row: any[], idx: number) => ({
      no: parseInt(row[0]) || idx + 1,
      carrier: (row[1] || '').trim(),
      trackingNumber: (row[2] || '').trim(),
      shipmentId: String(row[3] || '').trim(),
      shippedAt: (row[4] || '').trim(),
      sender: (row[5] || '').trim(),
      recipient: (row[6] || '').trim(),
      countryCode: (row[7] || '').trim(),
    }));

    console.log(`[Sopo] 파싱된 선적 건수: ${shipments.length}`);

    // logistics 데이터 로드
    let logisticsData: any[] = [];
    try {
      logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
      console.log(`[Sopo] Logistics 데이터 로드: ${logisticsData.length}건`);
      
      // 디버깅: 컬럼명 확인
      if (logisticsData.length > 0) {
        console.log('[Sopo] Logistics 컬럼 샘플:', Object.keys(logisticsData[0]).slice(0, 20).join(', '));
      }
    } catch (e: any) {
      console.error('[Sopo] Logistics 로드 실패:', e.message);
      return res.status(500).json({ success: false, error: 'Logistics 데이터 로드 실패' });
    }

    // 작가 정보 로드
    await loadArtists();

    // shipment_id로 logistics 인덱싱
    const logisticsByShipmentId: Record<string, any[]> = {};
    logisticsData.forEach((row: any) => {
      const sid = row.shipment_id;
      if (sid) {
        const key = String(sid).trim();
        if (!logisticsByShipmentId[key]) {
          logisticsByShipmentId[key] = [];
        }
        logisticsByShipmentId[key].push(row);
      }
    });

    console.log(`[Sopo] shipment_id 인덱싱: ${Object.keys(logisticsByShipmentId).length}개 고유 ID`);

    // 교차 검증 및 작가별 그룹핑
    interface OrderDetail {
      orderCode: string;
      shipmentId: string;
      productName: string;
      option: string;
      quantity: number;
      amountUSD: number;
      amountKRW: number;
      orderStatus: string;
      shippedAt: string;
      carrier: string;
      trackingNumber: string;
      countryCode: string;
      recipient: string;
    }

    interface ArtistSummary {
      artistName: string;
      artistId?: string;
      artistEmail?: string;
      orders: OrderDetail[];
      totalAmountUSD: number;
      totalAmountKRW: number;
      orderCount: number;
    }

    const artistMap: Map<string, ArtistSummary> = new Map();
    const matchedShipments: string[] = [];
    const unmatchedShipments: string[] = [];

    for (const shipment of shipments) {
      const logisticsRows = logisticsByShipmentId[shipment.shipmentId];
      
      if (!logisticsRows || logisticsRows.length === 0) {
        unmatchedShipments.push(shipment.shipmentId);
        continue;
      }

      matchedShipments.push(shipment.shipmentId);

      // 해당 shipment의 모든 상품 처리
      for (const row of logisticsRows) {
        const artistInfo = extractArtistFromLogistics(row);
        const artistName = artistInfo.name;
        const orderCode = row.order_code || '';
        
        // 작가별 그룹핑
        if (!artistMap.has(artistName)) {
          artistMap.set(artistName, {
            artistName,
            artistId: artistInfo.id,
            artistEmail: artistInfo.email,
            orders: [],
            totalAmountUSD: 0,
            totalAmountKRW: 0,
            orderCount: 0,
          });
        }

        const artistSummary = artistMap.get(artistName)!;
        
        // 이메일 없으면 업데이트 시도
        if (!artistSummary.artistEmail && artistInfo.email) {
          artistSummary.artistEmail = artistInfo.email;
        }
        
        // 같은 주문이 이미 있는지 확인 (중복 방지)
        const existingOrder = artistSummary.orders.find(
          o => o.orderCode === orderCode && o.productName === (row.product_name || '')
        );

        if (!existingOrder) {
          // Total GMV (USD)로 금액 계산 - 다른 기능들과 동일
          const amountUSD = cleanAndParseFloat(row['Total GMV']);
          const amountKRW = amountUSD * USD_TO_KRW;
          const quantity = parseInt(row['구매수량'] || row.quantity || '1') || 1;

          artistSummary.orders.push({
            orderCode,
            shipmentId: shipment.shipmentId,
            productName: row.product_name || row['작품명'] || '',
            option: row.option || row['옵션'] || '',
            quantity,
            amountUSD,
            amountKRW,
            orderStatus: '배송완료',
            shippedAt: shipment.shippedAt,
            carrier: shipment.carrier,
            trackingNumber: shipment.trackingNumber,
            countryCode: shipment.countryCode || row.country || '',
            recipient: shipment.recipient,
          });

          artistSummary.totalAmountUSD += amountUSD;
          artistSummary.totalAmountKRW += amountKRW;
        }
      }
    }

    // 작가별 주문 건수 계산 (unique order_code 기준)
    artistMap.forEach((summary) => {
      const uniqueOrderCodes = new Set(summary.orders.map(o => o.orderCode));
      summary.orderCount = uniqueOrderCodes.size;
    });

    // 결과 정리
    const artistSummaries = Array.from(artistMap.values()).sort((a, b) => b.orderCount - a.orderCount);

    // 이메일 보유 통계
    const withEmail = artistSummaries.filter(a => a.artistEmail).length;
    const withoutEmail = artistSummaries.length - withEmail;
    console.log(`[Sopo] 작가 ${artistSummaries.length}명 중 이메일 보유 ${withEmail}명, 미보유 ${withoutEmail}명`);

    // 트래킹 시트에 저장
    try {
      await saveTrackingData(period, artistSummaries);
    } catch (e: any) {
      console.warn('[Sopo] 트래킹 데이터 저장 실패:', e.message);
    }

    res.json({
      success: true,
      data: {
        period,
        totalShipments: shipments.length,
        matchedCount: matchedShipments.length,
        unmatchedCount: unmatchedShipments.length,
        unmatchedShipments: unmatchedShipments.slice(0, 20), // 최대 20개만 반환
        artistCount: artistSummaries.length,
        emailStats: {
          withEmail,
          withoutEmail,
        },
        artists: artistSummaries.map(a => ({
          ...a,
          // KRW 금액을 메인으로 반환
          totalAmount: a.totalAmountKRW,
        })),
      },
    });
  } catch (error: any) {
    console.error('[Sopo] 업로드 처리 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 트래킹 데이터 저장
 */
async function saveTrackingData(period: string, artists: any[]): Promise<void> {
  const headers = [
    'period', 'artist_name', 'artist_id', 'artist_email', 'order_count', 
    'total_amount_usd', 'total_amount_krw',
    'notification_sent_at', 'application_status', 'application_submitted_at',
    'jotform_submission_id', 'reminder_sent_at', 'receipt_issued_at', 'updated_at'
  ];

  // 시트 존재 확인 및 헤더 생성
  try {
    const existingData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SOPO_TRACKING, false);
    if (existingData.length === 0) {
      await sheetsService.appendRows(SHEET_NAMES.SOPO_TRACKING, [headers]);
    }
  } catch (e) {
    console.log('[Sopo] 트래킹 시트 생성 시도');
  }

  const now = new Date().toISOString();
  const rows = artists.map(artist => [
    period,
    artist.artistName,
    artist.artistId || '',
    artist.artistEmail || '',
    artist.orderCount,
    artist.totalAmountUSD || 0,
    artist.totalAmountKRW || artist.totalAmount || 0,
    '', // notification_sent_at
    'pending', // application_status
    '', // application_submitted_at
    '', // jotform_submission_id
    '', // reminder_sent_at
    '', // receipt_issued_at
    now, // updated_at
  ]);

  if (rows.length > 0) {
    await sheetsService.appendRows(SHEET_NAMES.SOPO_TRACKING, rows);
    console.log(`[Sopo] 트래킹 데이터 ${rows.length}건 저장`);
  }
}

/**
 * GET /api/sopo-receipt/artists
 * 대상 작가 목록 조회
 */
router.get('/artists', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string;
    
    // 작가 정보 로드 (이메일 보강용)
    await loadArtists();
    
    const trackingData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SOPO_TRACKING, false);
    
    let filteredData = trackingData;
    if (period) {
      filteredData = trackingData.filter((row: any) => row.period === period);
    }

    // 최신 기간 기준 그룹핑
    const artistMap: Map<string, any> = new Map();
    filteredData.forEach((row: any) => {
      const key = `${row.period}_${row.artist_name}`;
      if (!artistMap.has(key) || new Date(row.updated_at) > new Date(artistMap.get(key).updated_at)) {
        artistMap.set(key, row);
      }
    });

    const artists = Array.from(artistMap.values()).map(row => {
      // 이메일이 없으면 캐시에서 다시 조회
      let email = row.artist_email;
      if (!email) {
        if (row.artist_id) {
          const info = artistCache.byId.get(String(row.artist_id));
          if (info?.email) email = info.email;
        }
        if (!email) {
          const info = getArtistInfo(row.artist_name);
          if (info?.email) email = info.email;
        }
      }
      
      return {
        period: row.period,
        artistName: row.artist_name,
        artistId: row.artist_id || null,
        artistEmail: email || null,
        orderCount: parseInt(row.order_count) || 0,
        totalAmountUSD: parseFloat(row.total_amount_usd) || 0,
        totalAmountKRW: parseFloat(row.total_amount_krw) || parseFloat(row.total_amount) || 0,
        totalAmount: parseFloat(row.total_amount_krw) || parseFloat(row.total_amount) || 0,
        notificationSentAt: row.notification_sent_at || null,
        applicationStatus: row.application_status || 'pending',
        applicationSubmittedAt: row.application_submitted_at || null,
        jotformSubmissionId: row.jotform_submission_id || null,
        reminderSentAt: row.reminder_sent_at || null,
        receiptIssuedAt: row.receipt_issued_at || null,
      };
    });

    // 기간 목록 추출
    const periods = [...new Set(trackingData.map((r: any) => r.period))].filter(Boolean).sort().reverse();

    res.json({
      success: true,
      data: {
        artists,
        periods,
        summary: {
          total: artists.length,
          withEmail: artists.filter(a => a.artistEmail).length,
          withoutEmail: artists.filter(a => !a.artistEmail).length,
          pending: artists.filter(a => a.applicationStatus === 'pending').length,
          submitted: artists.filter(a => a.applicationStatus === 'submitted').length,
          completed: artists.filter(a => a.applicationStatus === 'completed').length,
        },
      },
    });
  } catch (error: any) {
    console.error('[Sopo] 작가 목록 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sopo-receipt/order-sheet/:artistName
 * 작가별 주문내역서 데이터 조회
 */
router.get('/order-sheet/:artistName', async (req: Request, res: Response) => {
  try {
    const { artistName } = req.params;
    const period = req.query.period as string;
    const shipmentIds = req.query.shipmentIds as string; // 쉼표로 구분된 shipment_id 목록

    // logistics 데이터 로드
    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);

    // 해당 작가의 주문 필터링
    let artistOrders = logisticsData.filter((row: any) => {
      const rowArtist = row['artist_name (kr)'] || row['artist_name(kr)'] || 
                        row.artist_name_kr || row.artist_name || row.artist;
      return rowArtist === artistName || rowArtist === decodeURIComponent(artistName);
    });

    // shipment_id로 추가 필터링 (있는 경우)
    if (shipmentIds) {
      const ids = shipmentIds.split(',').map(s => s.trim());
      artistOrders = artistOrders.filter((row: any) => {
        const sid = String(row.shipment_id || '').trim();
        return ids.includes(sid);
      });
    }

    // 주문내역서 형식으로 변환
    // 주문내역서는 작가 정산용이므로 "작품 판매 금액(KRW)" 사용
    // (hidden fee, 배송비 등 idus 적용 부분 제외, 실제 작가 판매 금액 기준)
    const orderSheet = artistOrders.map((row: any) => {
      // 작품 판매 금액(KRW) - 작가 정산 기준 금액
      const productPriceKRW = cleanAndParseFloat(
        row['작품 판매 금액(KRW)'] || 
        row['작품판매금액(KRW)'] || 
        row['작품 금액'] || 
        row.product_price_krw ||
        row.price_krw ||
        0
      );
      
      return {
        orderCode: row.order_code || '',
        orderStatus: '배송완료',
        productName: row.product_name || row['작품명'] || '',
        option: row.option || row['옵션'] || '',
        quantity: parseInt(row['구매수량'] || row.quantity || '1') || 1,
        // 작품 금액 (KRW) - 작가 정산 기준
        amount: productPriceKRW,
      };
    });

    // 합계 계산
    const totalAmount = orderSheet.reduce((sum, o) => sum + o.amount, 0);

    res.json({
      success: true,
      data: {
        artistName,
        period,
        orders: orderSheet,
        summary: {
          orderCount: orderSheet.length,
          totalAmount,
        },
        // CSV 형식 데이터 (다운로드용)
        csvData: generateOrderSheetCSV(artistName, orderSheet),
      },
    });
  } catch (error: any) {
    console.error('[Sopo] 주문내역서 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 주문내역서 CSV 생성
 * 기존 양식: 주문번호,주문상태,작품명,옵션,수량,작품 금액
 * 금액: 작품 판매 금액(KRW) - 작가 정산 기준
 */
function generateOrderSheetCSV(artistName: string, orders: any[]): string {
  const header = '*상기 주문 내역서의 항목은 변경 될 수 있습니다.';
  const columns = '주문번호,주문상태,작품명,옵션,수량,작품 금액';
  
  const rows = orders.map(order => {
    // 작품 금액 (KRW) - 천 단위 구분자 포함
    const amount = order.amount ? order.amount.toLocaleString('ko-KR') : '0';
    return `${order.orderCode},${order.orderStatus},"${order.productName}","${order.option}",${order.quantity},"${amount}"`;
  });

  return [header, columns, ...rows].join('\n');
}

/**
 * POST /api/sopo-receipt/notify
 * 안내 이메일 발송
 */
router.post('/notify', async (req: Request, res: Response) => {
  try {
    const { period, artistNames, jotformLink } = req.body;

    if (!period) {
      return res.status(400).json({ success: false, error: '기간을 지정해주세요.' });
    }

    // 작가 정보 로드
    await loadArtists();

    // 대상 작가 조회
    const trackingData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SOPO_TRACKING, false);
    let targetArtists = trackingData.filter((row: any) => row.period === period);

    if (artistNames && artistNames.length > 0) {
      targetArtists = targetArtists.filter((row: any) => artistNames.includes(row.artist_name));
    }

    // 이메일 보강 및 필터
    const artistsWithEmail = targetArtists.map((row: any) => {
      let email = row.artist_email;
      if (!email) {
        if (row.artist_id) {
          const info = artistCache.byId.get(String(row.artist_id));
          if (info?.email) email = info.email;
        }
        if (!email) {
          const info = getArtistInfo(row.artist_name);
          if (info?.email) email = info.email;
        }
      }
      return { ...row, artist_email: email };
    }).filter((row: any) => row.artist_email);

    if (artistsWithEmail.length === 0) {
      return res.status(400).json({ success: false, error: '이메일이 있는 대상 작가가 없습니다.' });
    }

    const sent: string[] = [];
    const failed: { artistName: string; error: string }[] = [];
    const now = new Date().toISOString();

    // 기본 JotForm 링크
    const formLink = jotformLink || 'https://form.jotform.com/idusglobal/230940786344057';

    for (const artist of artistsWithEmail) {
      try {
        if (!emailService) {
          failed.push({ artistName: artist.artist_name, error: '이메일 서비스 미설정' });
          continue;
        }

        // 이메일 발송
        const periodDisplay = formatPeriodDisplay(period);
        const totalAmount = parseFloat(artist.total_amount_krw) || parseFloat(artist.total_amount) || 0;
        const subject = `[아이디어스 글로벌] ${periodDisplay} 소포수령증 발급 신청 안내`;
        
        const htmlContent = generateNotificationEmailHTML({
          artistName: artist.artist_name,
          period: periodDisplay,
          orderCount: parseInt(artist.order_count) || 0,
          totalAmount,
          jotformLink: formLink,
          deadline: getDeadlineDate(),
        });

        const result = await emailService.sendEmail(
          artist.artist_email,
          subject,
          htmlContent,
          `${artist.artist_name} 작가님 소포수령증 신청 안내`
        );

        if (result.success) {
          sent.push(artist.artist_name);
        } else {
          failed.push({ artistName: artist.artist_name, error: result.error || '발송 실패' });
        }
      } catch (e: any) {
        failed.push({ artistName: artist.artist_name, error: e.message });
      }
    }

    res.json({
      success: true,
      data: {
        totalTargets: artistsWithEmail.length,
        sentCount: sent.length,
        failedCount: failed.length,
        sent,
        failed,
      },
    });
  } catch (error: any) {
    console.error('[Sopo] 안내 발송 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 기간 표시 포맷
 */
function formatPeriodDisplay(period: string): string {
  const [year, month] = period.split('-');
  return `${year}년 ${parseInt(month)}월`;
}

/**
 * 마감일 계산 (발송일로부터 7일 후)
 */
function getDeadlineDate(): string {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);
  return `${deadline.getFullYear()}년 ${deadline.getMonth() + 1}월 ${deadline.getDate()}일`;
}

/**
 * 안내 이메일 HTML 생성
 */
function generateNotificationEmailHTML(params: {
  artistName: string;
  period: string;
  orderCount: number;
  totalAmount: number;
  jotformLink: string;
  deadline: string;
}): string {
  const { artistName, period, orderCount, totalAmount, jotformLink, deadline } = params;
  const amountFormatted = totalAmount.toLocaleString('ko-KR');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .info-item:last-child { border-bottom: none; }
    .btn { display: inline-block; background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
    .warning { color: #dc3545; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📦 소포수령증 발급 신청 안내</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${period} 해외 배송 주문 건</p>
    </div>
    
    <div class="content">
      <p><strong>${artistName}</strong> 작가님, 안녕하세요.</p>
      <p>아이디어스 글로벌 운영팀입니다.</p>
      
      <p>${period} 해외 배송 완료 건에 대한 <strong>소포수령증 발급 신청</strong> 안내드립니다.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">📋 발급 대상 주문 요약</h3>
        <div class="info-item">
          <span>주문 건수</span>
          <strong>${orderCount}건</strong>
        </div>
        <div class="info-item">
          <span>총 금액</span>
          <strong>₩${amountFormatted}</strong>
        </div>
      </div>
      
      <h3>🔗 신청 방법</h3>
      <ol>
        <li>아래 버튼을 클릭하여 신청 페이지로 이동합니다.</li>
        <li>사업자 정보를 입력합니다.</li>
        <li>첨부된 주문내역서 파일을 확인 후 업로드합니다.</li>
        <li>제출 버튼을 클릭합니다.</li>
      </ol>
      
      <center>
        <a href="${jotformLink}" class="btn">📝 소포수령증 신청하기</a>
      </center>
      
      <p class="warning">⏰ 신청 마감: ${deadline}까지</p>
      
      <p>문의사항이 있으시면 아이디어스 글로벌 운영팀으로 연락 부탁드립니다.</p>
      
      <p>감사합니다.</p>
    </div>
    
    <div class="footer">
      <p>본 메일은 아이디어스 글로벌 작가님께 발송되는 안내 메일입니다.</p>
      <p>© 2025 idus Global. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * POST /api/sopo-receipt/sync-jotform
 * JotForm 신청 데이터 동기화
 */
router.post('/sync-jotform', async (req: Request, res: Response) => {
  try {
    // JotForm 연동 시트에서 데이터 로드
    let jotformData: any[] = [];
    try {
      jotformData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SOPO_JOTFORM, false);
    } catch (e) {
      console.warn('[Sopo] JotForm 시트 로드 실패');
      return res.json({ success: true, data: { synced: 0, message: 'JotForm 시트가 없거나 비어있습니다.' } });
    }

    // 트래킹 데이터 로드
    const trackingData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SOPO_TRACKING, false);

    let updatedCount = 0;
    const newSubmissions: any[] = [];

    // JotForm 데이터와 트래킹 데이터 매칭
    for (const submission of jotformData) {
      const artistName = submission['아이디어스 작가명 (국문 또는 영문)'] || submission.artist_name;
      const submissionId = submission['Submission ID'] || submission.submission_id;
      const submissionDate = submission['Submission Date'] || submission.submitted_at;

      if (!artistName) continue;

      // 트래킹에서 해당 작가 찾기
      const trackingRecord = trackingData.find((t: any) => 
        t.artist_name === artistName && t.application_status !== 'submitted'
      );

      if (trackingRecord) {
        newSubmissions.push({
          artistName,
          submissionId,
          submissionDate,
        });
        updatedCount++;
      }
    }

    res.json({
      success: true,
      data: {
        totalJotformRecords: jotformData.length,
        synced: updatedCount,
        newSubmissions,
      },
    });
  } catch (error: any) {
    console.error('[Sopo] JotForm 동기화 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sopo-receipt/tracking
 * 신청 현황 트래킹 조회
 */
router.get('/tracking', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string;
    const status = req.query.status as string;

    // 작가 정보 로드
    await loadArtists();

    let trackingData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SOPO_TRACKING, false);

    if (period) {
      trackingData = trackingData.filter((row: any) => row.period === period);
    }

    if (status) {
      trackingData = trackingData.filter((row: any) => row.application_status === status);
    }

    // 통계 계산
    const allData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SOPO_TRACKING, false);
    const periodData = period ? allData.filter((r: any) => r.period === period) : allData;

    res.json({
      success: true,
      data: {
        records: trackingData.map((row: any) => {
          // 이메일 보강
          let email = row.artist_email;
          if (!email) {
            if (row.artist_id) {
              const info = artistCache.byId.get(String(row.artist_id));
              if (info?.email) email = info.email;
            }
            if (!email) {
              const info = getArtistInfo(row.artist_name);
              if (info?.email) email = info.email;
            }
          }
          
          return {
            period: row.period,
            artistName: row.artist_name,
            artistId: row.artist_id || null,
            artistEmail: email || null,
            orderCount: parseInt(row.order_count) || 0,
            totalAmountUSD: parseFloat(row.total_amount_usd) || 0,
            totalAmountKRW: parseFloat(row.total_amount_krw) || parseFloat(row.total_amount) || 0,
            totalAmount: parseFloat(row.total_amount_krw) || parseFloat(row.total_amount) || 0,
            notificationSentAt: row.notification_sent_at || null,
            applicationStatus: row.application_status || 'pending',
            applicationSubmittedAt: row.application_submitted_at || null,
            jotformSubmissionId: row.jotform_submission_id || null,
            reminderSentAt: row.reminder_sent_at || null,
            receiptIssuedAt: row.receipt_issued_at || null,
          };
        }),
        summary: {
          total: periodData.length,
          pending: periodData.filter((r: any) => r.application_status === 'pending').length,
          notified: periodData.filter((r: any) => r.notification_sent_at).length,
          submitted: periodData.filter((r: any) => r.application_status === 'submitted').length,
          completed: periodData.filter((r: any) => r.application_status === 'completed').length,
        },
      },
    });
  } catch (error: any) {
    console.error('[Sopo] 트래킹 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sopo-receipt/reminder
 * 미신청 작가 리마인더 발송
 */
router.post('/reminder', async (req: Request, res: Response) => {
  try {
    const { period, artistNames } = req.body;

    if (!period || !artistNames || artistNames.length === 0) {
      return res.status(400).json({ success: false, error: '기간과 작가 목록을 지정해주세요.' });
    }

    // 작가 정보 로드
    await loadArtists();

    // 트래킹 데이터에서 미신청 작가 필터
    const trackingData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SOPO_TRACKING, false);
    const targets = trackingData
      .filter((row: any) => 
        row.period === period && 
        artistNames.includes(row.artist_name) &&
        row.application_status === 'pending'
      )
      .map((row: any) => {
        // 이메일 보강
        let email = row.artist_email;
        if (!email) {
          if (row.artist_id) {
            const info = artistCache.byId.get(String(row.artist_id));
            if (info?.email) email = info.email;
          }
          if (!email) {
            const info = getArtistInfo(row.artist_name);
            if (info?.email) email = info.email;
          }
        }
        return { ...row, artist_email: email };
      })
      .filter((row: any) => row.artist_email);

    if (targets.length === 0) {
      return res.status(400).json({ success: false, error: '리마인더 발송 대상이 없습니다.' });
    }

    const sent: string[] = [];
    const failed: string[] = [];

    for (const artist of targets) {
      try {
        if (!emailService) {
          failed.push(artist.artist_name);
          continue;
        }

        const periodDisplay = formatPeriodDisplay(period);
        const subject = `[리마인더] ${periodDisplay} 소포수령증 발급 신청을 잊지 마세요!`;
        
        const htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>⏰ 소포수령증 신청 리마인더</h2>
            <p><strong>${artist.artist_name}</strong> 작가님, 안녕하세요.</p>
            <p>${periodDisplay} 소포수령증 발급 신청이 아직 완료되지 않았습니다.</p>
            <p>마감일이 임박했으니, 빠른 시일 내 신청 부탁드립니다.</p>
            <p style="margin-top: 30px;">
              <a href="https://form.jotform.com/idusglobal/230940786344057" 
                 style="background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                지금 신청하기
              </a>
            </p>
          </div>
        `;

        const result = await emailService.sendEmail(
          artist.artist_email,
          subject,
          htmlContent,
          `${artist.artist_name} 작가님 소포수령증 리마인더`
        );

        if (result.success) {
          sent.push(artist.artist_name);
        } else {
          failed.push(artist.artist_name);
        }
      } catch (e) {
        failed.push(artist.artist_name);
      }
    }

    res.json({
      success: true,
      data: {
        sentCount: sent.length,
        failedCount: failed.length,
        sent,
        failed,
      },
    });
  } catch (error: any) {
    console.error('[Sopo] 리마인더 발송 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sopo-receipt/periods
 * 기간 목록 조회
 */
router.get('/periods', async (req: Request, res: Response) => {
  try {
    const trackingData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SOPO_TRACKING, false);
    const periods = [...new Set(trackingData.map((r: any) => r.period))].filter(Boolean).sort().reverse();

    res.json({
      success: true,
      data: { periods },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sopo-receipt/refresh-artists
 * 작가 캐시 강제 새로고침
 */
router.post('/refresh-artists', async (req: Request, res: Response) => {
  try {
    await loadArtists(true);
    
    res.json({
      success: true,
      data: {
        byIdCount: artistCache.byId.size,
        byNameCount: artistCache.byName.size,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
