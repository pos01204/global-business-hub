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

    // 파일명에서 기간 자동 추출 (예: "BACKPA_11월_선적내역_추출_20251201" → "2025-11")
    // 파일명에서 추출한 기간이 우선 적용됨 (프론트엔드에서 전달한 period보다 우선)
    const rawFilename = req.file.originalname;
    // URL 인코딩된 파일명 디코딩
    const filename = decodeURIComponent(rawFilename);
    
    console.log(`[Sopo] 파일명 분석: raw="${rawFilename}", decoded="${filename}"`);
    
    let period = new Date().toISOString().slice(0, 7); // 기본값: 현재 월
    let periodSource = 'default';
    
    // 파일명에서 월 추출 시도 (예: "11월", "12월", "_11_", "-11-")
    // 다양한 패턴 지원: "11월", "_11월", "11월_"
    const monthPatterns = [
      /(\d{1,2})월/,           // "11월"
      /_(\d{1,2})_/,           // "_11_"
      /[-_](\d{1,2})[-_]/,     // "-11-" 또는 "_11_"
    ];
    
    let extractedMonth: number | null = null;
    for (const pattern of monthPatterns) {
      const match = filename.match(pattern);
      if (match) {
        const monthNum = parseInt(match[1]);
        // 월은 1-12 사이여야 함
        if (monthNum >= 1 && monthNum <= 12) {
          extractedMonth = monthNum;
          console.log(`[Sopo] 월 추출 성공: 패턴=${pattern}, 결과=${monthNum}`);
          break;
        }
      }
    }
    
    if (extractedMonth !== null) {
      // 파일명에서 연도 추출 시도 (예: "20251201" → 2025, "2025" → 2025)
      // _YYYYMMDD 패턴 또는 YYYY 패턴
      const yearPatterns = [
        /[_-]?(20\d{2})\d{4}/,  // "20251201" → "2025"
        /[_-]?(20\d{2})[_-]/,   // "_2025_" → "2025"
        /(20\d{2})/,            // 단순 "2025"
      ];
      
      let extractedYear = new Date().getFullYear();
      for (const pattern of yearPatterns) {
        const match = filename.match(pattern);
        if (match) {
          extractedYear = parseInt(match[1]);
          console.log(`[Sopo] 연도 추출 성공: 패턴=${pattern}, 결과=${extractedYear}`);
          break;
        }
      }
      
      period = `${extractedYear}-${String(extractedMonth).padStart(2, '0')}`;
      periodSource = 'filename';
      console.log(`[Sopo] ✅ 파일명에서 기간 추출 완료: "${filename}" → ${period}`);
    } else if (req.body.period) {
      // 파일명에서 추출 실패 시에만 프론트엔드 전달 값 사용
      period = req.body.period;
      periodSource = 'request';
      console.log(`[Sopo] ⚠️ 파일명에서 기간 추출 실패, 프론트엔드 전달 기간 사용: ${period}`);
    } else {
      console.log(`[Sopo] ⚠️ 기간 추출 실패, 기본값 사용: ${period}`);
    }
    
    console.log(`[Sopo] 선적 CSV 업로드: ${filename}, 기간: ${period} (source: ${periodSource})`);

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
      shipmentItemId: string; // G열 - 고유 식별자 (동일 주문 내 옵션별 구분)
      productName: string;
      option: string;
      quantity: number;
      amount: number; // 작품 판매 금액(KRW) - 작가 정산 기준
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
      totalAmount: number; // 작품 판매 금액(KRW) 합계
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
            totalAmount: 0, // 작품 판매 금액(KRW) 합계
            orderCount: 0,
          });
        }

        const artistSummary = artistMap.get(artistName)!;
        
        // 이메일 없으면 업데이트 시도
        if (!artistSummary.artistEmail && artistInfo.email) {
          artistSummary.artistEmail = artistInfo.email;
        }
        
        // shipment_item_id로 중복 체크 (동일 주문 내 옵션별 별도 인식)
        // G열 - 고유 식별자로 동일 작품의 다른 옵션도 별도로 처리
        const shipmentItemId = row.shipment_item_id || row['shipment_item_id'] || '';
        const existingOrder = artistSummary.orders.find(
          o => o.shipmentItemId === shipmentItemId && shipmentItemId !== ''
        );

        if (!existingOrder) {
          // 작품 판매 금액(KRW) - 작가 정산 기준 (AQ열)
          // 주문내역서 발급 시 이 금액을 기준으로 함
          const productPriceKRW = cleanAndParseFloat(row['작품 판매 금액(KRW)']);
          const quantity = parseInt(row['구매수량'] || row.quantity || '1') || 1;

          artistSummary.orders.push({
            orderCode,
            shipmentId: shipment.shipmentId,
            shipmentItemId, // G열 고유 식별자
            productName: row.product_name || row['작품명'] || '',
            option: row.option || row['옵션'] || '',
            quantity,
            // 작품 금액 (KRW) - 작가 정산 기준
            amount: productPriceKRW,
            orderStatus: '배송완료',
            shippedAt: shipment.shippedAt,
            carrier: shipment.carrier,
            trackingNumber: shipment.trackingNumber,
            countryCode: shipment.countryCode || row.country || '',
            recipient: shipment.recipient,
          });

          // totalAmount: 작품 판매 금액(KRW) 합계
          artistSummary.totalAmount += productPriceKRW;
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

    // 트래킹 시트에 저장 (중복 체크 포함) - 필수 단계
    let trackingResult: { added: number; updated: number; skipped: number; error: string | null } = { 
      added: 0, updated: 0, skipped: 0, error: null 
    };
    try {
      console.log(`[Sopo] 트래킹 데이터 저장 시작: ${artistSummaries.length}건`);
      const result = await saveTrackingData(period, artistSummaries);
      trackingResult = { ...result, error: null };
      console.log(`[Sopo] 트래킹 데이터 저장 완료:`, trackingResult);
    } catch (e: any) {
      console.error('[Sopo] ❌ 트래킹 데이터 저장 실패:', e.message);
      trackingResult.error = e.message;
      
      // 저장 실패 시에도 응답은 반환하되, 경고 포함
    }

    // 저장 실패 시 경고 메시지 포함
    const warnings: string[] = [];
    if (trackingResult.error) {
      warnings.push(`트래킹 시트 저장 실패: ${trackingResult.error}. Sopo_tracking 시트가 존재하는지 확인해주세요.`);
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
        // 트래킹 저장 결과
        trackingStats: {
          newlyAdded: trackingResult.added,
          updated: trackingResult.updated,
          skipped: trackingResult.skipped,
          saveError: trackingResult.error,
        },
        // 경고 메시지
        warnings: warnings.length > 0 ? warnings : undefined,
        artists: artistSummaries,
      },
    });
  } catch (error: any) {
    console.error('[Sopo] 업로드 처리 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 트래킹 데이터 저장 (중복 시 업데이트)
 * - 같은 period + artist_name이 있으면 order_count, total_amount, artist_email, updated_at 업데이트
 * - 새로운 작가는 추가
 */
async function saveTrackingData(period: string, artists: any[]): Promise<{ added: number; updated: number; skipped: number }> {
  // 시트 컬럼 순서 (shipment_ids 추가 - 이메일 발송 시 해당 기간 주문 필터링용)
  const headers = [
    'period', 'artist_name', 'artist_email', 'order_count', 
    'total_amount', 'notification_sent_at', 'application_status', 
    'application_submitted_at', 'jotform_submission_id', 'reminder_sent_at', 
    'receipt_issued_at', 'updated_at', 'shipment_ids'
  ];

  console.log(`[Sopo] ========================================`);
  console.log(`[Sopo] saveTrackingData 시작`);
  console.log(`[Sopo] - period: "${period}"`);
  console.log(`[Sopo] - artists: ${artists.length}명`);
  console.log(`[Sopo] - 시트명: ${SHEET_NAMES.SOPO_TRACKING}`);
  console.log(`[Sopo] ========================================`);

  if (!period) {
    throw new Error('period 값이 없습니다. 기간을 선택해주세요.');
  }

  if (artists.length === 0) {
    console.log('[Sopo] 저장할 작가 데이터가 없습니다.');
    return { added: 0, updated: 0, skipped: 0 };
  }

  let existingData: any[] = [];
  
  // 시트에서 기존 데이터 조회 (헤더 행은 getSheetDataAsJson에서 자동 처리)
  // 시트가 존재하고 헤더가 있으면 데이터만 반환됨
  try {
    console.log('[Sopo] 1. 기존 트래킹 데이터 조회 시도...');
    existingData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SOPO_TRACKING, false);
    console.log(`[Sopo]    → 조회 성공: ${existingData.length}건`);
  } catch (e: any) {
    console.log(`[Sopo]    → 조회 실패: ${e.message}`);
    existingData = [];
  }
  
  // 참고: 시트에 헤더가 없는 경우 수동으로 추가 필요
  // Google Sheets에서 Sopo_tracking 시트의 1행에 다음 헤더가 있어야 함:
  // period, artist_name, artist_email, order_count, total_amount, notification_sent_at, 
  // application_status, application_submitted_at, jotform_submission_id, reminder_sent_at, 
  // receipt_issued_at, updated_at, shipment_ids

  // 기존 데이터에서 period + artist_name으로 인덱싱 (행 번호 포함)
  const existingMap = new Map<string, { rowIndex: number; data: any }>();
  existingData.forEach((row: any, index: number) => {
    const key = `${row.period}|${row.artist_name}`;
    existingMap.set(key, { rowIndex: index + 2, data: row }); // +2: 헤더 행 + 0-indexed
  });

  // 기존 기간들 확인
  const existingPeriods = [...new Set(existingData.map((r: any) => r.period))];
  console.log(`[Sopo] 3. 기존 데이터 분석`);
  console.log(`[Sopo]    → 총 ${existingData.length}건, 기간: ${existingPeriods.join(', ') || '없음'}`);
  console.log(`[Sopo]    → 현재 저장할 기간: "${period}"`);

  const now = new Date().toISOString();
  const newRows: any[][] = [];
  const updateBatch: { range: string; value: any }[] = [];
  let updatedCount = 0;
  let skippedCount = 0;

  for (const artist of artists) {
    const key = `${period}|${artist.artistName}`;
    const existing = existingMap.get(key);
    
    if (existing) {
      // 기존 데이터가 있으면 배치 업데이트 준비
      const rowNum = existing.rowIndex;
      
      // C열: artist_email (있으면 업데이트)
      if (artist.artistEmail && !existing.data.artist_email) {
        updateBatch.push({ range: `C${rowNum}`, value: artist.artistEmail });
      }
      
      // D열: order_count (항상 업데이트)
      updateBatch.push({ range: `D${rowNum}`, value: artist.orderCount });
      
      // E열: total_amount (항상 업데이트)
      updateBatch.push({ range: `E${rowNum}`, value: artist.totalAmount || 0 });
      
      // L열: updated_at (항상 업데이트)
      updateBatch.push({ range: `L${rowNum}`, value: now });
      
      // M열: shipment_ids (항상 업데이트 - 해당 기간 선적 ID 목록)
      const shipmentIds = [...new Set(artist.orders?.map((o: any) => o.shipmentId) || [])].join(',');
      updateBatch.push({ range: `M${rowNum}`, value: shipmentIds });
      
      updatedCount++;
    } else {
      // 새로운 데이터 추가 (시트 컬럼 순서에 맞춤)
      // shipment_ids: 해당 기간 선적 ID 목록 (이메일 발송 시 주문 필터링용)
      const shipmentIds = [...new Set(artist.orders?.map((o: any) => o.shipmentId) || [])].join(',');
      
      newRows.push([
        period,                      // A: period
        artist.artistName,           // B: artist_name
        artist.artistEmail || '',    // C: artist_email
        artist.orderCount,           // D: order_count
        artist.totalAmount || 0,     // E: total_amount
        '',                          // F: notification_sent_at
        'pending',                   // G: application_status
        '',                          // H: application_submitted_at
        '',                          // I: jotform_submission_id
        '',                          // J: reminder_sent_at
        '',                          // K: receipt_issued_at
        now,                         // L: updated_at
        shipmentIds,                 // M: shipment_ids
      ]);
    }
  }

  console.log(`[Sopo] 4. 저장 작업 시작`);
  console.log(`[Sopo]    → 신규 추가 대상: ${newRows.length}건`);
  console.log(`[Sopo]    → 업데이트 대상: ${updatedCount}건 (${updateBatch.length}개 셀)`);

  // 배치 업데이트 실행
  if (updateBatch.length > 0) {
    try {
      console.log(`[Sopo]    → 배치 업데이트 실행 중...`);
      await sheetsService.updateCells(SHEET_NAMES.SOPO_TRACKING, updateBatch);
      console.log(`[Sopo]    → ✅ 배치 업데이트 완료`);
    } catch (updateErr: any) {
      console.error(`[Sopo]    → ❌ 배치 업데이트 실패: ${updateErr.message}`);
      // 업데이트 실패해도 신규 추가는 시도
      skippedCount = updatedCount;
      updatedCount = 0;
    }
  }

  // 신규 데이터 추가
  if (newRows.length > 0) {
    try {
      console.log(`[Sopo]    → 신규 데이터 ${newRows.length}건 추가 중...`);
      console.log(`[Sopo]    → 첫 번째 작가: ${newRows[0][1]}`);
      await sheetsService.appendRows(SHEET_NAMES.SOPO_TRACKING, newRows);
      console.log(`[Sopo]    → ✅ 신규 데이터 추가 완료`);
    } catch (appendError: any) {
      console.error(`[Sopo]    → ❌ 신규 데이터 추가 실패: ${appendError.message}`);
      throw new Error(`데이터 저장 실패: ${appendError.message}`);
    }
  }
  
  console.log(`[Sopo] ========================================`);
  console.log(`[Sopo] ✅ 트래킹 저장 완료`);
  console.log(`[Sopo]    - 신규: ${newRows.length}건`);
  console.log(`[Sopo]    - 업데이트: ${updatedCount}건`);
  console.log(`[Sopo]    - 건너뜀: ${skippedCount}건`);
  console.log(`[Sopo] ========================================`);

  return {
    added: newRows.length,
    updated: updatedCount,
    skipped: skippedCount,
  };
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
        totalAmount: parseFloat(row.total_amount) || 0, // 작품 판매 금액(KRW) 합계
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

    // 디버깅: logistics 시트 전체 컬럼명 출력 (최초 1회)
    if (logisticsData.length > 0) {
      const allColumns = Object.keys(logisticsData[0]);
      console.log('[Sopo] Logistics 전체 컬럼명:', allColumns.join(' | '));
      // AQ열 근처 컬럼들 (약 43번째 컬럼)
      console.log('[Sopo] 금액 관련 컬럼:', allColumns.filter(c => 
        c.includes('금액') || c.includes('price') || c.includes('KRW') || c.includes('판매')
      ).join(' | '));
    }

    // 해당 작가의 주문 필터링
    const decodedArtistName = decodeURIComponent(artistName);
    console.log(`[Sopo] 주문내역서 조회 - 작가명: "${decodedArtistName}"`);
    
    let artistOrders = logisticsData.filter((row: any) => {
      const rowArtist = row['artist_name (kr)'] || row['artist_name(kr)'] || 
                        row.artist_name_kr || row.artist_name || row.artist || '';
      return rowArtist === artistName || rowArtist === decodedArtistName;
    });
    
    console.log(`[Sopo] 필터링 결과: ${artistOrders.length}건 (전체 ${logisticsData.length}건 중)`);
    
    // 작가명 매칭 안될 시 유사 검색 (디버깅용)
    if (artistOrders.length === 0) {
      const sample = logisticsData.slice(0, 5).map((r: any) => r['artist_name (kr)'] || r.artist_name);
      console.log('[Sopo] 시트의 작가명 샘플:', sample);
    }

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
    
    // 디버깅: 첫 번째 주문의 금액 관련 컬럼 확인
    if (artistOrders.length > 0) {
      const sample = artistOrders[0];
      console.log('[Sopo] 주문내역서 금액 컬럼 확인:', {
        '작품 판매 금액(KRW)': sample['작품 판매 금액(KRW)'],
        '작품 가격': sample['작품 가격'],
        '옵션 가격': sample['옵션 가격'],
        'Product GMV': sample['Product GMV'],
        'Total GMV': sample['Total GMV'],
      });
    }
    
    // shipment_item_id 기준으로 각 행을 개별 인식
    // 동일 작품의 다른 옵션도 별도 행으로 처리
    const orderSheet = artistOrders.map((row: any) => {
      // 작품 판매 금액(KRW) - 작가 정산 기준 금액 (AQ열)
      const productPriceKRW = cleanAndParseFloat(row['작품 판매 금액(KRW)']);
      
      return {
        orderCode: row.order_code || '',
        shipmentItemId: row.shipment_item_id || '', // G열 - 고유 식별자
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

    console.log('[Sopo] /notify 요청 - period:', period, ', artistNames:', artistNames?.length || 0);

    // 필수 파라미터 검증
    if (!period) {
      console.log('[Sopo] /notify 오류: 기간 미지정');
      return res.status(400).json({ 
        success: false, 
        error: '기간을 지정해주세요.',
        details: { receivedPeriod: period }
      });
    }

    // 이메일 서비스 확인
    if (!emailService) {
      console.log('[Sopo] /notify 오류: 이메일 서비스 미설정 (RESEND_API_KEY 환경변수 확인 필요)');
      return res.status(400).json({ 
        success: false, 
        error: '이메일 서비스가 설정되지 않았습니다. RESEND_API_KEY 환경변수를 확인해주세요.',
        details: { isEmailConfigured: isEmailConfigured }
      });
    }

    // 작가 정보 로드
    await loadArtists();

    // 대상 작가 조회
    const trackingData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SOPO_TRACKING, false);
    console.log(`[Sopo] 트래킹 데이터 로드: ${trackingData.length}건`);
    
    let targetArtists = trackingData.filter((row: any) => row.period === period);
    console.log(`[Sopo] 기간(${period}) 필터링 결과: ${targetArtists.length}건`);

    if (targetArtists.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: `해당 기간(${period})의 대상 작가가 없습니다. 먼저 CSV 파일을 업로드해주세요.`,
        details: { period, availablePeriods: [...new Set(trackingData.map((r: any) => r.period))].filter(Boolean) }
      });
    }

    if (artistNames && artistNames.length > 0) {
      targetArtists = targetArtists.filter((row: any) => artistNames.includes(row.artist_name));
      console.log(`[Sopo] 작가명 필터링 결과: ${targetArtists.length}건`);
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

    console.log(`[Sopo] 이메일 보유 작가: ${artistsWithEmail.length}명`);

    if (artistsWithEmail.length === 0) {
      const withoutEmail = targetArtists.filter((row: any) => !row.artist_email).map((r: any) => r.artist_name);
      return res.status(400).json({ 
        success: false, 
        error: '이메일이 있는 대상 작가가 없습니다.',
        details: { 
          totalTargets: targetArtists.length,
          withoutEmailCount: withoutEmail.length,
          sampleWithoutEmail: withoutEmail.slice(0, 5)
        }
      });
    }

    const sent: string[] = [];
    const failed: { artistName: string; error: string }[] = [];
    const now = new Date().toISOString();

    // 기본 JotForm 링크
    const formLink = jotformLink || 'https://form.jotform.com/230940786344057';

    // logistics 데이터 로드 (주문내역서 생성용)
    let logisticsData: any[] = [];
    try {
      logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, false);
    } catch (e) {
      console.warn('[Sopo] Logistics 데이터 로드 실패, 첨부파일 없이 발송');
    }

    for (const artist of artistsWithEmail) {
      try {
        // 이메일 발송
        const periodDisplay = formatPeriodDisplay(period);
        const orderCount = parseInt(artist.order_count) || 0;
        
        // 해당 기간의 선적 ID 목록 (트래킹 시트에서 가져온 shipment_ids)
        const shipmentIdList = (artist.shipment_ids || '').split(',').filter((id: string) => id.trim());
        
        // 해당 작가 + 해당 기간 선적 ID에 해당하는 주문만 필터링
        const artistOrders = logisticsData.filter((row: any) => {
          const rowArtist = row['artist_name (kr)'] || row['artist_name(kr)'] || 
                            row.artist_name_kr || row.artist_name || row.artist || '';
          const rowShipmentId = String(row.shipment_id || '').trim();
          
          // 작가명 일치 + (shipment_ids가 있으면 해당 선적만, 없으면 전체)
          const isArtistMatch = rowArtist === artist.artist_name;
          const isShipmentMatch = shipmentIdList.length === 0 || shipmentIdList.includes(rowShipmentId);
          
          return isArtistMatch && isShipmentMatch;
        });

        console.log(`[Sopo] ${artist.artist_name}: ${artistOrders.length}건 주문 (shipment_ids: ${shipmentIdList.length}개)`);

        // 주문내역서 형식으로 변환
        const orderSheet = artistOrders.map((row: any) => {
          const productPriceKRW = cleanAndParseFloat(row['작품 판매 금액(KRW)']);
          return {
            orderCode: row.order_code || '',
            orderStatus: '배송완료',
            productName: row.product_name || row['작품명'] || '',
            option: row.option || row['옵션'] || '',
            quantity: parseInt(row['구매수량'] || row.quantity || '1') || 1,
            amount: productPriceKRW,
          };
        });

        // 금액 합계 계산 (이메일 표시용)
        const totalAmountKRW = orderSheet.reduce((sum, o) => sum + o.amount, 0);
        
        const subject = `[아이디어스 글로벌] ${periodDisplay} 소포수령증 발급 신청 안내`;
        
        const htmlContent = generateNotificationEmailHTML({
          artistName: artist.artist_name,
          period: periodDisplay,
          orderCount,
          totalAmount: totalAmountKRW,
          jotformLink: formLink,
          deadline: getDeadlineDate(),
        });

        // 주문내역서 CSV 생성 (첨부파일용)
        const csvContent = generateOrderSheetCSV(artist.artist_name, orderSheet);
        const periodShort = period.replace('-', '').slice(2); // 2025-12 -> 2512
        const csvFilename = `${periodShort} 소포수령증 발급신청용 주문내역서_${artist.artist_name}.csv`;

        // BOM 추가하여 한글 깨짐 방지
        const csvWithBOM = '\uFEFF' + csvContent;

        const result = await emailService.sendEmail(
          artist.artist_email,
          subject,
          htmlContent,
          `${artist.artist_name} 작가님 소포수령증 신청 안내`,
          orderSheet.length > 0 ? [{ filename: csvFilename, content: csvWithBOM }] : undefined
        );

        if (result.success) {
          sent.push(artist.artist_name);
          
          // 발송 성공 시 트래킹 시트 업데이트 (notification_sent_at)
          try {
            await updateTrackingNotificationSent(period, artist.artist_name, now);
          } catch (updateErr) {
            console.warn(`[Sopo] 트래킹 업데이트 실패: ${artist.artist_name}`);
          }
        } else {
          failed.push({ artistName: artist.artist_name, error: result.error || '발송 실패' });
        }
      } catch (e: any) {
        failed.push({ artistName: artist.artist_name, error: e.message });
      }
    }

    console.log(`[Sopo] 이메일 발송 완료 - 성공: ${sent.length}, 실패: ${failed.length}`);

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
 * 트래킹 시트에서 notification_sent_at 업데이트
 */
async function updateTrackingNotificationSent(period: string, artistName: string, sentAt: string): Promise<void> {
  try {
    const trackingData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SOPO_TRACKING, false);
    const rowIndex = trackingData.findIndex((row: any) => 
      row.period === period && row.artist_name === artistName
    );
    
    if (rowIndex >= 0) {
      // notification_sent_at 컬럼 업데이트 (F열, 6번째 컬럼)
      // 헤더 행 포함하므로 rowIndex + 2
      await sheetsService.updateCell(
        SHEET_NAMES.SOPO_TRACKING, 
        `F${rowIndex + 2}`, 
        sentAt
      );
    }
  } catch (e: any) {
    console.warn('[Sopo] notification_sent_at 업데이트 실패:', e.message);
  }
}

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
        <p style="margin: 10px 0; font-size: 15px;">주문 건수 <strong>${orderCount}건</strong></p>
        <p style="margin: 10px 0; font-size: 15px;">총 금액 <strong>₩${amountFormatted}</strong></p>
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
      
      <p style="font-size: 12px; color: #666; text-align: center; margin-top: 15px;">
        버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br/>
        <span style="color: #FF6B35; word-break: break-all;">${jotformLink}</span>
      </p>
      
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
    console.log('[Sopo] JotForm 동기화 시작');
    
    // JotForm 연동 시트에서 데이터 로드
    let jotformData: any[] = [];
    try {
      jotformData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SOPO_JOTFORM, false);
      console.log(`[Sopo] JotForm 데이터 로드: ${jotformData.length}건`);
    } catch (e) {
      console.warn('[Sopo] JotForm 시트 로드 실패');
      return res.json({ success: true, data: { synced: 0, message: 'JotForm 시트가 없거나 비어있습니다.' } });
    }

    // 트래킹 데이터 로드
    const trackingData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.SOPO_TRACKING, false);
    console.log(`[Sopo] 트래킹 데이터 로드: ${trackingData.length}건`);

    let updatedCount = 0;
    const newSubmissions: any[] = [];
    const updateBatch: { range: string; value: any }[] = [];

    // 작가명 정규화 함수 (공백 제거, 소문자 변환)
    const normalizeArtistName = (name: string) => {
      return (name || '').trim().toLowerCase().replace(/\s+/g, '');
    };

    // Submission Date에서 월(period) 추출 함수
    // 형식: "2025-10-13 11:40:27" 또는 "2025. 12. 1 오후 4:53:22" 등
    const extractPeriodFromDate = (dateStr: string): string | null => {
      if (!dateStr) return null;
      
      // YYYY-MM-DD 형식
      const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-/);
      if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}`;
      }
      
      // YYYY. M. D 형식 (한국어)
      const korMatch = dateStr.match(/^(\d{4})\.\s*(\d{1,2})\.\s*\d/);
      if (korMatch) {
        return `${korMatch[1]}-${korMatch[2].padStart(2, '0')}`;
      }
      
      // 기타 Date 파싱 시도
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
      } catch (e) {}
      
      return null;
    };

    // JotForm 데이터와 트래킹 데이터 매칭
    for (const submission of jotformData) {
      const artistName = submission['아이디어스 작가명 (국문 또는 영문)'] || submission.artist_name || '';
      const submissionId = submission['Submission ID'] || submission.submission_id || '';
      const submissionDate = submission['Submission Date'] || submission.submitted_at || '';

      if (!artistName) continue;

      const normalizedSubmissionName = normalizeArtistName(artistName);
      
      // Submission Date에서 월(period) 추출
      const submissionPeriod = extractPeriodFromDate(submissionDate);
      
      if (!submissionPeriod) {
        console.log(`[Sopo] ⚠️ 날짜 파싱 실패: ${artistName}, date=${submissionDate}`);
        continue;
      }

      // 신청월의 전월 계산 (N월 선적 → (N+1)월 신청)
      // 예: 12월에 신청 → 11월 선적 내역과 매칭
      const [year, month] = submissionPeriod.split('-').map(Number);
      let targetYear = year;
      let targetMonth = month - 1;
      if (targetMonth === 0) {
        targetMonth = 12;
        targetYear = year - 1;
      }
      const targetPeriod = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
      
      console.log(`[Sopo] 신청일 ${submissionDate} → 신청월 ${submissionPeriod} → 대상월 ${targetPeriod}`);

      // 트래킹에서 해당 작가 + 전월(대상월) 찾기
      const trackingIndex = trackingData.findIndex((t: any) => {
        const normalizedTrackingName = normalizeArtistName(t.artist_name);
        return normalizedTrackingName === normalizedSubmissionName && 
               t.period === targetPeriod &&  // 전월(선적월)과 매칭
               t.application_status !== 'submitted' &&
               t.application_status !== 'completed';
      });

      if (trackingIndex >= 0) {
        const trackingRecord = trackingData[trackingIndex];
        const rowNum = trackingIndex + 2; // 헤더 행 + 0-indexed
        
        console.log(`[Sopo] 매칭 발견: ${artistName} (행 ${rowNum})`);
        
        // G열: application_status → 'submitted'
        updateBatch.push({ range: `G${rowNum}`, value: 'submitted' });
        // H열: application_submitted_at → submissionDate
        updateBatch.push({ range: `H${rowNum}`, value: submissionDate });
        // I열: jotform_submission_id → submissionId
        updateBatch.push({ range: `I${rowNum}`, value: submissionId });
        
        newSubmissions.push({
          artistName,
          submissionId,
          submissionDate,
          period: trackingRecord.period,
        });
        updatedCount++;
        
        // trackingData에서도 업데이트 (중복 방지)
        trackingData[trackingIndex].application_status = 'submitted';
      }
    }

    // 배치 업데이트 실행
    if (updateBatch.length > 0) {
      try {
        console.log(`[Sopo] 트래킹 시트 업데이트: ${updateBatch.length}개 셀`);
        await sheetsService.updateCells(SHEET_NAMES.SOPO_TRACKING, updateBatch);
        console.log('[Sopo] ✅ 트래킹 시트 업데이트 완료');
      } catch (updateErr: any) {
        console.error(`[Sopo] ❌ 트래킹 시트 업데이트 실패: ${updateErr.message}`);
      }
    }

    console.log(`[Sopo] JotForm 동기화 완료: ${updatedCount}건 업데이트`);

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
            totalAmount: parseFloat(row.total_amount) || 0, // 작품 판매 금액(KRW) 합계
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
        
        const jotformUrl = 'https://form.jotform.com/230940786344057';
        const htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>⏰ 소포수령증 신청 리마인더</h2>
            <p><strong>${artist.artist_name}</strong> 작가님, 안녕하세요.</p>
            <p>${periodDisplay} 소포수령증 발급 신청이 아직 완료되지 않았습니다.</p>
            <p>마감일이 임박했으니, 빠른 시일 내 신청 부탁드립니다.</p>
            <p style="margin-top: 30px; text-align: center;">
              <a href="${jotformUrl}" 
                 style="background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                지금 신청하기
              </a>
            </p>
            <p style="font-size: 12px; color: #666; text-align: center; margin-top: 15px;">
              버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br/>
              <span style="color: #FF6B35; word-break: break-all;">${jotformUrl}</span>
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
