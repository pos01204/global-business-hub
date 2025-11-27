import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';
import ResendService from '../services/resendService';
import EmailTemplateService from '../services/emailTemplateService';
import { resendConfig, isEmailConfigured } from '../config/email';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

// 이메일 서비스 및 템플릿 서비스 초기화 (Resend 사용)
console.log('[Email] 이메일 서비스 초기화 시작 (Resend)...');
console.log('[Email] isEmailConfigured:', isEmailConfigured);

const emailService = isEmailConfigured ? new ResendService(resendConfig) : null;
const emailTemplateService = new EmailTemplateService();

if (emailService) {
  console.log('[Email] ✅ Resend 이메일 서비스 초기화 완료');
} else {
  console.log('[Email] ⚠️ 이메일 서비스 비활성화 (RESEND_API_KEY 미설정)');
}

// Multer 설정: 메모리 스토리지 사용
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('CSV 파일만 업로드 가능합니다.'));
    }
  },
});

// 임시 데이터 저장소 (실제로는 데이터베이스나 Google Sheets 사용 권장)
interface QCItem {
  id: string;
  type: 'text' | 'image';
  data: any;
  status: 'pending' | 'approved' | 'needs_revision' | 'excluded' | 'archived';
  needsRevision: boolean;
  createdAt: Date;
  completedAt?: Date;
}

interface ArtistNotification {
  artistId: string;
  artistName: string;
  artistEmail?: string; // 작가 메일 주소 추가
  textQCItems: number;
  imageQCItems: number;
  items: Array<{
    id: string;
    type: 'text' | 'image';
    productName: string;
  }>;
}

// 메모리 저장소 (개발용, 프로덕션에서는 DB 사용 권장)
const qcDataStore: {
  text: Map<string, QCItem>;
  image: Map<string, QCItem>;
  archive: Map<string, QCItem>;
  artists: Map<string, any>; // artistId -> artistName 매핑
  artistsLastLoaded: number; // 마지막 로드 시간
} = {
  text: new Map(),
  image: new Map(),
  archive: new Map(),
  artists: new Map(),
  artistsLastLoaded: 0,
};

// 작가 정보 캐시 유효 시간 (5분)
const ARTISTS_CACHE_TTL = 5 * 60 * 1000;

/**
 * 작가 정보 로드 (Google Sheets에서)
 * artists 시트와 artists_mail 시트 모두에서 데이터를 읽어 매핑
 * 캐시가 유효하면 스킵
 */
async function loadArtists(forceReload: boolean = false) {
  // 캐시가 유효하면 스킵
  const now = Date.now();
  if (!forceReload && qcDataStore.artists.size > 0 && (now - qcDataStore.artistsLastLoaded) < ARTISTS_CACHE_TTL) {
    console.log('[QC] 작가 정보 캐시 사용 (남은 시간:', Math.round((ARTISTS_CACHE_TTL - (now - qcDataStore.artistsLastLoaded)) / 1000), '초)');
    return;
  }

  try {
    // 1. artists 시트에서 데이터 로드
    const artistsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ARTISTS, false);
    
    // 첫 번째 로드 시에만 컬럼명 출력
    if (artistsData.length > 0 && qcDataStore.artistsLastLoaded === 0) {
      console.log('[QC] Artists 시트 컬럼명:', Object.keys(artistsData[0]).join(', '));
    }
    
    // 가능한 ID 컬럼명들
    const possibleIdColumns = [
      '작가 ID (Global)',
      '작가ID(Global)',
      '작가 ID(Global)',
      'artist_id',
      'global_artist_id',
      'artistId',
      'globalArtistId',
      'ID',
      'id',
      '작가 ID',
      '작가ID',
      '(Global)',
      'artist ID',
    ];
    
    // 가능한 KR ID 컬럼명들
    const possibleKrIdColumns = [
      '작가 ID (KR)',
      '작가ID(KR)',
      '작가 ID(KR)',
      '(KR)',
      'kr_artist_id',
    ];
    
    artistsData.forEach((artist: any) => {
      // Global ID 매핑
      for (const col of possibleIdColumns) {
        if (artist[col] !== undefined && artist[col] !== null && artist[col] !== '') {
          const artistId = String(artist[col]).trim();
          if (artistId && artistId !== '0') {
            qcDataStore.artists.set(artistId, artist);
          }
        }
      }
      
      // KR ID 매핑
      for (const col of possibleKrIdColumns) {
        if (artist[col] !== undefined && artist[col] !== null && artist[col] !== '') {
          const artistId = String(artist[col]).trim();
          if (artistId && artistId !== '0') {
            qcDataStore.artists.set(artistId, artist);
          }
        }
      }
      
      // UUID 매핑
      if (artist.uuid) {
        qcDataStore.artists.set(artist.uuid, artist);
      }
    });
    
    console.log(`[QC] artists 시트에서 로드: ${qcDataStore.artists.size}개 ID 매핑`);
    
    // 2. artists_mail 시트에서 데이터 로드 (VLOOKUP 원본 데이터)
    try {
      const artistsMailData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ARTISTS_MAIL, false);
      
      if (artistsMailData.length > 0) {
        // 첫 번째 로드 시에만 컬럼명 출력
        if (qcDataStore.artistsLastLoaded === 0) {
          console.log('[QC] Artists_mail 시트 컬럼명:', Object.keys(artistsMailData[0]).join(', '));
        }
        
        // artists_mail 시트 구조: A열=ID, E열=email (VLOOKUP 수식 기준)
        // 가능한 컬럼명으로 ID와 이메일 매핑
        const mailIdColumns = ['ID', 'id', 'artist_id', '작가 ID', '작가ID', ...possibleIdColumns];
        const mailEmailColumns = ['email', 'mail', 'Email', 'Mail', 'EMAIL', 'MAIL', 'e-mail', 'E-mail'];
        
        artistsMailData.forEach((mailData: any) => {
          let artistId: string | null = null;
          let artistEmail: string | null = null;
          
          // ID 찾기
          for (const col of mailIdColumns) {
            if (mailData[col] !== undefined && mailData[col] !== null && mailData[col] !== '') {
              artistId = String(mailData[col]).trim();
              if (artistId && artistId !== '0') break;
            }
          }
          
          // 이메일 찾기
          for (const col of mailEmailColumns) {
            if (mailData[col] !== undefined && mailData[col] !== null && mailData[col] !== '') {
              artistEmail = String(mailData[col]).trim();
              if (artistEmail && artistEmail.includes('@')) break;
            }
          }
          
          // ID와 이메일이 있으면 매핑
          if (artistId && artistEmail) {
            // 기존 데이터가 있으면 메일 정보 추가, 없으면 새로 생성
            const existingArtist = qcDataStore.artists.get(artistId);
            if (existingArtist) {
              existingArtist.mail = artistEmail;
              qcDataStore.artists.set(artistId, existingArtist);
            } else {
              qcDataStore.artists.set(artistId, { mail: artistEmail, ...mailData });
            }
          }
        });
        
        console.log(`[QC] artists_mail 시트에서 ${artistsMailData.length}개 레코드 로드`);
      }
    } catch (mailError) {
      console.warn('[QC] artists_mail 시트 로드 실패 (무시):', mailError);
    }
    
    // 캐시 시간 업데이트
    qcDataStore.artistsLastLoaded = Date.now();
    console.log(`[QC] 작가 정보 로드 완료: 총 ${qcDataStore.artists.size}개 ID 매핑`);
    
  } catch (error) {
    console.error('[QC] 작가 정보 로드 실패:', error);
  }
}

/**
 * 텍스트 QC 데이터 로드 (Google Sheets 원본 시트에서)
 */
async function loadTextQCData() {
  try {
    // 원본 시트에서 데이터 로드
    const textData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.QC_TEXT_RAW, false);
    let imported = 0;
    let skipped = 0;
    let archived = 0;

    for (const record of textData) {
      const id = generateId('text', record);
      
      // 상태 확인 (status 컬럼이 있으면 사용, 없으면 'pending')
      const status = (record.status as 'pending' | 'approved' | 'needs_revision' | 'excluded' | 'archived') || 'pending';
      
      // 아카이브된 항목은 아카이브 저장소에만 저장
      if (status === 'archived' || record.archived === true) {
        const qcItem: QCItem = {
          id,
          type: 'text',
          data: record,
          status: 'approved', // 아카이브는 완료된 것으로 간주
          needsRevision: false,
          createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
          completedAt: record.completedAt ? new Date(record.completedAt) : new Date(),
        };
        qcDataStore.archive.set(id, qcItem);
        archived++;
        continue;
      }
      
      // 이미 존재하는 경우 스킵
      if (qcDataStore.text.has(id)) {
        skipped++;
        continue;
      }

      const qcItem: QCItem = {
        id,
        type: 'text',
        data: record,
        status,
        needsRevision: record.needsRevision === true || record.needs_revision === true,
        createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
        completedAt: record.completedAt ? new Date(record.completedAt) : undefined,
      };

      qcDataStore.text.set(id, qcItem);
      imported++;
    }

    console.log(`[QC] 텍스트 QC 데이터 로드 완료: ${imported}개 가져옴, ${archived}개 아카이브, ${skipped}개 스킵`);
  } catch (error) {
    console.error('[QC] 텍스트 QC 데이터 로드 실패:', error);
  }
}

/**
 * 이미지 QC 데이터 로드 (Google Sheets 원본 시트에서)
 */
async function loadImageQCData() {
  try {
    // 원본 시트에서 데이터 로드
    const imageData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.QC_IMAGE_RAW, false);
    let imported = 0;
    let skipped = 0;
    let archived = 0;

    for (const record of imageData) {
      const id = generateId('image', record);
      
      // 상태 확인 (status 컬럼이 있으면 사용, 없으면 'pending')
      const status = (record.status as 'pending' | 'approved' | 'needs_revision' | 'excluded' | 'archived') || 'pending';
      
      // 아카이브된 항목은 아카이브 저장소에만 저장
      if (status === 'archived' || record.archived === true) {
        const qcItem: QCItem = {
          id,
          type: 'image',
          data: record,
          status: 'approved', // 아카이브는 완료된 것으로 간주
          needsRevision: false,
          createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
          completedAt: record.completedAt ? new Date(record.completedAt) : new Date(),
        };
        qcDataStore.archive.set(id, qcItem);
        archived++;
        continue;
      }
      
      // 이미 존재하는 경우 스킵
      if (qcDataStore.image.has(id)) {
        skipped++;
        continue;
      }

      const qcItem: QCItem = {
        id,
        type: 'image',
        data: record,
        status,
        needsRevision: record.needsRevision === true || record.needs_revision === true,
        createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
        completedAt: record.completedAt ? new Date(record.completedAt) : undefined,
      };

      qcDataStore.image.set(id, qcItem);
      imported++;
    }

    console.log(`[QC] 이미지 QC 데이터 로드 완료: ${imported}개 가져옴, ${archived}개 아카이브, ${skipped}개 스킵`);
  } catch (error) {
    console.error('[QC] 이미지 QC 데이터 로드 실패:', error);
  }
}

/**
 * 아카이브 데이터 로드 (Google Sheets에서)
 */
async function loadArchiveData() {
  try {
    const archiveData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.QC_ARCHIVE, false);
    let imported = 0;

    for (const record of archiveData) {
      const id = generateId(record.type || 'text', record);
      
      const qcItem: QCItem = {
        id,
        type: (record.type as 'text' | 'image') || 'text',
        data: record,
        status: 'approved',
        needsRevision: false,
        createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
        completedAt: record.completedAt ? new Date(record.completedAt) : new Date(),
      };

      qcDataStore.archive.set(id, qcItem);
      imported++;
    }

    console.log(`[QC] 아카이브 데이터 로드 완료: ${imported}개`);
  } catch (error) {
    console.error('[QC] 아카이브 데이터 로드 실패:', error);
  }
}

// 서버 시작 시 데이터 로드
async function initializeQCData() {
  console.log('[QC] QC 데이터 초기화 시작...');
  await loadArtists();
  await loadTextQCData();
  await loadImageQCData();
  await loadArchiveData();
  console.log('[QC] QC 데이터 초기화 완료');
}

/**
 * Google Sheets에서 QC 데이터 동기화 (수동 새로고침)
 * POST /api/qc/sync
 * GET /api/qc/sync (브라우저 호환성)
 * 
 * 주의: 이 라우트는 동적 라우트(/:type/:id)보다 앞에 정의되어야 합니다.
 */
router.post('/sync', async (req, res) => {
  try {
    console.log('[QC] Google Sheets 동기화 시작...');
    console.log('[QC] 동기화 요청 수신:', req.method, req.path);
    
    // 기존 데이터 백업 (통계용)
    const beforeTextCount = qcDataStore.text.size;
    const beforeImageCount = qcDataStore.image.size;
    const beforeArchiveCount = qcDataStore.archive.size;

    // 데이터 다시 로드
    await loadArtists();
    await loadTextQCData();
    await loadImageQCData();
    await loadArchiveData();

    const afterTextCount = qcDataStore.text.size;
    const afterImageCount = qcDataStore.image.size;
    const afterArchiveCount = qcDataStore.archive.size;

    res.json({
      success: true,
      message: 'Google Sheets 동기화 완료',
      stats: {
        text: {
          before: beforeTextCount,
          after: afterTextCount,
          added: afterTextCount - beforeTextCount,
        },
        image: {
          before: beforeImageCount,
          after: afterImageCount,
          added: afterImageCount - beforeImageCount,
        },
        archive: {
          before: beforeArchiveCount,
          after: afterArchiveCount,
          added: afterArchiveCount - beforeArchiveCount,
        },
      },
    });
  } catch (error: any) {
    console.error('[QC] 동기화 오류:', error);
    res.status(500).json({
      error: '동기화 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

// GET 요청도 지원 (브라우저 호환성)
router.get('/sync', async (req, res) => {
  try {
    console.log('[QC] Google Sheets 동기화 시작...');
    console.log('[QC] 동기화 요청 수신:', req.method, req.path);
    
    // 기존 데이터 백업 (통계용)
    const beforeTextCount = qcDataStore.text.size;
    const beforeImageCount = qcDataStore.image.size;
    const beforeArchiveCount = qcDataStore.archive.size;

    // 데이터 다시 로드
    await loadArtists();
    await loadTextQCData();
    await loadImageQCData();
    await loadArchiveData();

    const afterTextCount = qcDataStore.text.size;
    const afterImageCount = qcDataStore.image.size;
    const afterArchiveCount = qcDataStore.archive.size;

    res.json({
      success: true,
      message: 'Google Sheets 동기화 완료',
      stats: {
        text: {
          before: beforeTextCount,
          after: afterTextCount,
          added: afterTextCount - beforeTextCount,
        },
        image: {
          before: beforeImageCount,
          after: afterImageCount,
          added: afterImageCount - beforeImageCount,
        },
        archive: {
          before: beforeArchiveCount,
          after: afterArchiveCount,
          added: afterArchiveCount - beforeArchiveCount,
        },
      },
    });
  } catch (error: any) {
    console.error('[QC] 동기화 오류:', error);
    res.status(500).json({
      error: '동기화 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

initializeQCData();

/**
 * 작가명 조회 헬퍼 함수
 */
function getArtistName(artistId: string | number): string {
  const artist = qcDataStore.artists.get(String(artistId));
  if (artist) {
    // 다양한 컬럼명 시도
    return (
      artist['artist_name (kr)'] ||
      artist.artist_name_kr ||
      artist.name_kr ||
      artist.name ||
      `작가 ID: ${artistId}`
    );
  }
  return `작가 ID: ${artistId}`;
}

/**
 * 작가 메일 주소 조회 헬퍼 함수
 */
function getArtistEmail(artistId: string | number): string | undefined {
  const artist = qcDataStore.artists.get(String(artistId));
  if (artist) {
    // 다양한 컬럼명 시도 (mail, email, artist_email 등)
    return (
      artist.mail ||
      artist.email ||
      artist.artist_email ||
      artist['artist_email'] ||
      undefined
    );
  }
  return undefined;
}

/**
 * 작가 정보 전체 조회 헬퍼 함수
 */
function getArtistInfo(artistId: string | number): { name: string; email?: string } {
  const artistIdStr = String(artistId).trim();
  const artist = qcDataStore.artists.get(artistIdStr);
  
  if (artist) {
    // 작가명 조회 (다양한 컬럼명 시도)
    const nameColumns = [
      'artist_name (kr)',
      '작가명 (KR)',
      '(KR)작가명',
      'artist_name_kr',
      'name_kr',
      'name',
      '작가명',
    ];
    
    let artistName = `작가 ID: ${artistId}`;
    for (const col of nameColumns) {
      if (artist[col]) {
        artistName = artist[col];
        break;
      }
    }
    
    // 이메일 조회 (다양한 컬럼명 시도)
    const emailColumns = ['mail', 'email', 'artist_email', 'Mail', 'Email', 'EMAIL', 'MAIL'];
    let artistEmail: string | undefined = undefined;
    for (const col of emailColumns) {
      if (artist[col]) {
        artistEmail = String(artist[col]).trim();
        break;
      }
    }
    
    return {
      name: artistName,
      email: artistEmail,
    };
  }
  
  return {
    name: `작가 ID: ${artistId}`,
    email: undefined,
  };
}

/**
 * 고유 ID 생성
 */
function generateId(prefix: string, data: any): string {
  // 이미지 QC의 경우 다양한 컬럼 조합 시도
  if (prefix === 'image') {
    // 1. product_id + page_name + cmd_type 조합 (가장 고유함)
    if (data.product_id && data.page_name && data.cmd_type) {
      return `${prefix}_${data.product_id}_${data.page_name}_${data.cmd_type}`;
    }
    // 2. product_id + page_name 조합
    if (data.product_id && data.page_name) {
      return `${prefix}_${data.product_id}_${data.page_name}`;
    }
    // 3. product_id + cmd_type 조합
    if (data.product_id && data.cmd_type) {
      return `${prefix}_${data.product_id}_${data.cmd_type}`;
    }
    // 4. product_id + image_url (이미지 URL의 일부 사용)
    if (data.product_id && data.image_url) {
      // URL에서 파일명 추출하여 사용
      const urlParts = data.image_url.split('/');
      const filename = urlParts[urlParts.length - 1] || '';
      const fileId = filename.split('.')[0] || '';
      if (fileId) {
        return `${prefix}_${data.product_id}_${fileId}`;
      }
    }
    // 5. product_id만 있는 경우
    if (data.product_id) {
      return `${prefix}_${data.product_id}`;
    }
    // 6. image_url만 있는 경우 (URL 해시 사용)
    if (data.image_url) {
      const urlHash = data.image_url.split('/').pop()?.split('.')[0] || '';
      if (urlHash) {
        return `${prefix}_url_${urlHash}`;
      }
    }
  }
  
  // 텍스트 QC 또는 일반적인 경우
  if (data.global_product_id) {
    return `${prefix}_${data.global_product_id}`;
  }
  if (data.product_id && data.description_id) {
    return `${prefix}_${data.product_id}_${data.description_id}`;
  }
  if (data.product_id) {
    return `${prefix}_${data.product_id}`;
  }
  
  // 마지막 수단: 타임스탬프 + 랜덤
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * CSV 파일 업로드 - 텍스트 QC
 * POST /api/qc/upload/text
 */
router.post('/upload/text', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV 파일이 필요합니다.' });
    }

    // CSV 파싱
    const records = parse(req.file.buffer.toString('utf-8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let imported = 0;
    let skipped = 0;
    const duplicates: string[] = [];

    // 작가 정보 다시 로드 (최신 정보 반영)
    await loadArtists();

    for (const record of records) {
      const id = generateId('text', record);
      
      // 중복 검사 (아카이브 확인)
      if (qcDataStore.archive.has(id)) {
        duplicates.push(id);
        skipped++;
        continue;
      }

      // 이미 존재하는 경우 스킵
      if (qcDataStore.text.has(id)) {
        skipped++;
        continue;
      }

      const qcItem: QCItem = {
        id,
        type: 'text',
        data: record,
        status: 'pending',
        needsRevision: false,
        createdAt: new Date(),
      };

      qcDataStore.text.set(id, qcItem);
      imported++;
    }

    // 배치로 Google Sheets에 저장 (성능 개선)
    if (imported > 0) {
      try {
        const rowsToAdd: any[][] = [];
        for (const record of records) {
          const id = generateId('text', record);
          if (qcDataStore.text.has(id) && !qcDataStore.archive.has(id)) {
            const rowData = Object.values(record);
            rowsToAdd.push(rowData);
          }
        }
        
        if (rowsToAdd.length > 0) {
          await sheetsService.appendRows(SHEET_NAMES.QC_TEXT_RAW, rowsToAdd);
          console.log(`[QC] 텍스트 QC ${rowsToAdd.length}개 행을 Google Sheets 원본 시트에 배치 저장 완료`);
        }
      } catch (error) {
        console.error('[QC] Google Sheets 배치 저장 실패 (텍스트 QC):', error);
        // 저장 실패해도 메모리 저장은 유지
      }
    }

    res.json({
      success: true,
      imported,
      skipped,
      duplicates: duplicates.length,
      total: records.length,
      message: imported > 0 
        ? `${imported}개 항목이 메모리에 저장되었습니다. Google Sheets 동기화는 백그라운드에서 진행 중입니다.`
        : '모든 항목이 스킵되었습니다.',
    });
  } catch (error: any) {
    console.error('[QC] 텍스트 CSV 업로드 오류:', error);
    res.status(500).json({
      error: 'CSV 파일 업로드 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

/**
 * CSV 파일 업로드 - 이미지 QC
 * POST /api/qc/upload/image
 */
router.post('/upload/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV 파일이 필요합니다.' });
    }

    // CSV 파싱
    const records = parse(req.file.buffer.toString('utf-8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`[QC] 이미지 CSV 파싱 완료: ${records.length}개 레코드`);

    let imported = 0;
    let skipped = 0;
    let updated = 0;
    const duplicates: string[] = [];
    const skippedReasons: { [key: string]: number } = {
      archived: 0,
      alreadyExists: 0,
      invalidData: 0,
    };

    // 작가 정보 다시 로드
    await loadArtists();

    for (const record of records) {
      // 필수 필드 검증
      if (!record.product_id && !record.image_url) {
        console.warn('[QC] 이미지 QC 레코드에 필수 필드가 없습니다:', record);
        skippedReasons.invalidData++;
        skipped++;
        continue;
      }

      const id = generateId('image', record);
      
      // 아카이브에 있는 경우만 스킵 (이미 완료된 항목)
      if (qcDataStore.archive.has(id)) {
        duplicates.push(id);
        skippedReasons.archived++;
        skipped++;
        continue;
      }

      // 이미 존재하는 경우
      const existingItem = qcDataStore.image.get(id);
      if (existingItem) {
        // 이미지 QC는 모든 항목을 확인해야 하므로:
        // - 상태가 'pending'이면 데이터 업데이트
        // - 상태가 'approved' 또는 'needs_revision'이면 스킵 (이미 처리됨)
        // - 상태가 'excluded'이면 데이터 업데이트 (비대상 해제 가능)
        if (existingItem.status === 'pending' || existingItem.status === 'excluded') {
          // 데이터 업데이트 (최신 정보 반영)
          existingItem.data = record;
          existingItem.status = 'pending'; // 상태 초기화
          existingItem.needsRevision = false;
          existingItem.createdAt = new Date(); // 업로드 시간 갱신
          qcDataStore.image.set(id, existingItem);
          updated++;
          continue;
        } else {
          // 이미 처리된 항목은 스킵
          skippedReasons.alreadyExists++;
          skipped++;
          continue;
        }
      }

      // 새 항목 추가
      const qcItem: QCItem = {
        id,
        type: 'image',
        data: record,
        status: 'pending',
        needsRevision: false,
        createdAt: new Date(),
      };

      qcDataStore.image.set(id, qcItem);
      imported++;
    }

    // 배치로 Google Sheets에 저장 (성능 개선)
    if (imported > 0) {
      try {
        const rowsToAdd: any[][] = [];
        for (const record of records) {
          const id = generateId('image', record);
          const existingItem = qcDataStore.image.get(id);
          if (existingItem && !qcDataStore.archive.has(id) && existingItem.status === 'pending') {
            const rowData = Object.values(record);
            rowsToAdd.push(rowData);
          }
        }
        
        if (rowsToAdd.length > 0) {
          await sheetsService.appendRows(SHEET_NAMES.QC_IMAGE_RAW, rowsToAdd);
          console.log(`[QC] 이미지 QC ${rowsToAdd.length}개 행을 Google Sheets 원본 시트에 배치 저장 완료`);
        }
      } catch (error) {
        console.error('[QC] Google Sheets 배치 저장 실패 (이미지 QC):', error);
        // 저장 실패해도 메모리 저장은 유지
      }
    }

    console.log(`[QC] 이미지 CSV 업로드 완료: ${imported}개 가져옴, ${updated}개 업데이트, ${skipped}개 스킵`);
    console.log(`[QC] 스킵 이유: 아카이브=${skippedReasons.archived}, 이미존재=${skippedReasons.alreadyExists}, 유효하지않음=${skippedReasons.invalidData}`);

    res.json({
      success: true,
      imported,
      updated,
      skipped,
      duplicates: duplicates.length,
      total: records.length,
      skippedReasons,
      message: imported > 0 
        ? `${imported}개 항목이 메모리에 저장되었습니다. Google Sheets 동기화는 백그라운드에서 진행 중입니다.`
        : '모든 항목이 스킵되었습니다.',
    });
  } catch (error: any) {
    console.error('[QC] 이미지 CSV 업로드 오류:', error);
    res.status(500).json({
      error: 'CSV 파일 업로드 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

/**
 * 텍스트 QC 목록 조회
 * GET /api/qc/text/list?status=pending&page=1&limit=50&weeklyOnly=true
 */
router.get('/text/list', async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const weeklyOnly = req.query.weeklyOnly === 'true';

    let items = Array.from(qcDataStore.text.values());

    // 상태 필터링
    if (status) {
      items = items.filter((item) => item.status === status);
    }

    // 주간 신규만 필터링 (7일 이내)
    if (weeklyOnly) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      items = items.filter((item) => item.createdAt >= weekAgo);
    }

    // 페이지네이션
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedItems = items.slice(start, end);

    res.json({
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit),
      },
    });
  } catch (error: any) {
    console.error('[QC] 텍스트 목록 조회 오류:', error);
    res.status(500).json({
      error: '목록 조회 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

/**
 * 이미지 QC 목록 조회
 * GET /api/qc/image/list?status=pending&page=1&limit=50&weeklyOnly=true
 */
router.get('/image/list', async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const weeklyOnly = req.query.weeklyOnly === 'true';

    let items = Array.from(qcDataStore.image.values());

    // 상태 필터링
    if (status) {
      items = items.filter((item) => item.status === status);
    }

    // 주간 신규만 필터링
    if (weeklyOnly) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      items = items.filter((item) => item.createdAt >= weekAgo);
    }

    // 페이지네이션
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedItems = items.slice(start, end);

    res.json({
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit),
      },
    });
  } catch (error: any) {
    console.error('[QC] 이미지 목록 조회 오류:', error);
    res.status(500).json({
      error: '목록 조회 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

/**
 * QC 상태 업데이트
 * PUT /api/qc/:type/:id/status
 */
router.put('/:type/:id/status', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status, needsRevision } = req.body;

    if (type !== 'text' && type !== 'image') {
      return res.status(400).json({ error: '잘못된 타입입니다.' });
    }

    const store = type === 'text' ? qcDataStore.text : qcDataStore.image;
    const item = store.get(id);

    if (!item) {
      return res.status(404).json({ error: 'QC 항목을 찾을 수 없습니다.' });
    }

    item.status = status || item.status;
    item.needsRevision = needsRevision !== undefined ? needsRevision : item.needsRevision;

    // excluded 상태는 needsRevision을 false로 설정
    if (status === 'excluded') {
      item.needsRevision = false;
    }

    if (status === 'approved' || status === 'needs_revision' || status === 'excluded') {
      item.completedAt = new Date();
    }

    // 승인(approved) 시 아카이브로 이동
    if (status === 'approved') {
      console.log(`[QC] 승인 처리 - 아카이브로 이동: ${id}`);
      
      // 아카이브로 이동
      item.status = 'archived';
      qcDataStore.archive.set(id, item);
      store.delete(id);
      
      // Google Sheets 아카이브에 저장 (비동기)
      saveToArchiveSheet(item).catch((error) => {
        console.error('[QC] 아카이브 시트 저장 실패:', error);
      });
      
      res.json({ success: true, item, archived: true, message: 'QC 승인 및 아카이브 완료' });
      return;
    }

    store.set(id, item);

    // Google Sheets에 상태 저장 (비동기, 실패해도 메모리 업데이트는 유지)
    saveQCStatusToSheets(type as 'text' | 'image', item).catch((error) => {
      console.error('[QC] Google Sheets 상태 저장 실패:', error);
    });

    res.json({ success: true, item });
  } catch (error: any) {
    console.error('[QC] 상태 업데이트 오류:', error);
    res.status(500).json({
      error: '상태 업데이트 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

/**
 * QC 상태를 Google Sheets에 저장하는 헬퍼 함수
 */
async function saveQCStatusToSheets(type: 'text' | 'image', item: QCItem) {
  try {
    console.log(`[QC] Google Sheets 상태 저장 시작: ${type} QC, ID: ${item.id}, Status: ${item.status}`);
    const sheetName = type === 'text' ? SHEET_NAMES.QC_TEXT_RAW : SHEET_NAMES.QC_IMAGE_RAW;
    
    // ID 컬럼 찾기 (여러 가능한 컬럼명 시도)
    const possibleIdColumns = type === 'text' 
      ? ['global_product_id', 'product_id', 'kr_product_uuid']
      : ['product_id', 'image_url', 'page_name'];
    
    let rowIndex: number | null = null;
    let itemId: string | null = null;
    let foundIdColumn: string | null = null;
    
    for (const idColumn of possibleIdColumns) {
      const idValue = item.data[idColumn];
      if (idValue) {
        itemId = String(idValue);
        console.log(`[QC] ID 컬럼 시도: ${idColumn} = ${itemId}`);
        rowIndex = await sheetsService.findRowByColumn(sheetName, idColumn, itemId);
        if (rowIndex) {
          foundIdColumn = idColumn;
          console.log(`[QC] 행 찾기 성공: ${sheetName} 행 ${rowIndex} (${idColumn}=${itemId})`);
          break;
        }
      }
    }

    if (!rowIndex || !itemId) {
      console.error(`[QC] 시트에서 항목을 찾을 수 없습니다.`);
      console.error(`[QC] 시트: ${sheetName}`);
      console.error(`[QC] 시도한 ID 컬럼: ${possibleIdColumns.join(', ')}`);
      console.error(`[QC] 항목 데이터:`, JSON.stringify(item.data, null, 2));
      return;
    }

    // 상태 컬럼이 없으면 자동으로 추가
    await sheetsService.ensureColumnExists(sheetName, 'status');
    await sheetsService.ensureColumnExists(sheetName, 'needsRevision');
    await sheetsService.ensureColumnExists(sheetName, 'completedAt');

    // 상태 컬럼 동적으로 찾기
    const statusRange = await sheetsService.getCellRange(sheetName, 'status', rowIndex);
    const needsRevisionRange = await sheetsService.getCellRange(sheetName, 'needsRevision', rowIndex);
    const needsRevisionRange2 = await sheetsService.getCellRange(sheetName, 'needs_revision', rowIndex);
    const completedAtRange = await sheetsService.getCellRange(sheetName, 'completedAt', rowIndex);
    const completedAtRange2 = await sheetsService.getCellRange(sheetName, 'completed_at', rowIndex);

    console.log(`[QC] 컬럼 찾기 결과:`);
    console.log(`[QC]   status: ${statusRange || '없음'}`);
    console.log(`[QC]   needsRevision: ${needsRevisionRange || needsRevisionRange2 || '없음'}`);
    console.log(`[QC]   completedAt: ${completedAtRange || completedAtRange2 || '없음'}`);

    // 상태 업데이트 (컬럼이 없으면 추가했으므로 반드시 있어야 함)
    if (statusRange) {
      await sheetsService.updateCell(sheetName, statusRange, item.status);
      console.log(`[QC] ✅ 상태 업데이트 성공: ${statusRange} = ${item.status}`);
    } else {
      console.error(`[QC] ❌ 'status' 컬럼을 찾을 수 없습니다. (자동 추가 실패)`);
      console.error(`[QC] 시트: ${sheetName}, 행: ${rowIndex}`);
    }

    // needsRevision 업데이트
    const revisionRange = needsRevisionRange || needsRevisionRange2;
    if (revisionRange) {
      await sheetsService.updateCell(sheetName, revisionRange, item.needsRevision ? 'TRUE' : 'FALSE');
      console.log(`[QC] needsRevision 업데이트 성공: ${revisionRange} = ${item.needsRevision}`);
    }

    // completedAt 업데이트
    if (item.completedAt) {
      const completedRange = completedAtRange || completedAtRange2;
      if (completedRange) {
        await sheetsService.updateCell(sheetName, completedRange, item.completedAt.toISOString());
        console.log(`[QC] completedAt 업데이트 성공: ${completedRange} = ${item.completedAt.toISOString()}`);
      }
    }

    console.log(`[QC] ✅ 상태 업데이트 완료: ${sheetName} 행 ${rowIndex} (${foundIdColumn}=${itemId})`);
  } catch (error: any) {
    // Google Sheets 저장 실패해도 메모리 업데이트는 유지
    console.error('[QC] ❌ Google Sheets 상태 저장 실패:', error);
    console.error('[QC] 오류 상세:', error.message);
    console.error('[QC] 스택:', error.stack);
  }
}

/**
 * QC 완료 항목을 아카이브 시트에 저장하는 헬퍼 함수
 */
async function saveToArchiveSheet(item: QCItem) {
  try {
    const sheetName = item.type === 'text' ? SHEET_NAMES.QC_TEXT_RAW : SHEET_NAMES.QC_IMAGE_RAW;
    
    // 원본 시트에서 해당 행 찾기
    const possibleIdColumns = item.type === 'text' 
      ? ['global_product_id', 'product_id', 'kr_product_uuid']
      : ['product_id', 'image_url', 'page_name'];
    
    let rowIndex: number | null = null;
    
    for (const idColumn of possibleIdColumns) {
      const idValue = item.data[idColumn];
      if (idValue) {
        rowIndex = await sheetsService.findRowByColumn(sheetName, idColumn, String(idValue));
        if (rowIndex) break;
      }
    }

    // 원본 시트의 상태를 'archived'로 업데이트
    if (rowIndex) {
      const statusRange = await sheetsService.getCellRange(sheetName, 'status', rowIndex);
      if (statusRange) {
        await sheetsService.updateCell(sheetName, statusRange, 'archived');
      }
      
      const completedAtRange = await sheetsService.getCellRange(sheetName, 'completedAt', rowIndex) ||
                               await sheetsService.getCellRange(sheetName, 'completed_at', rowIndex);
      if (completedAtRange && item.completedAt) {
        await sheetsService.updateCell(sheetName, completedAtRange, item.completedAt.toISOString());
      }
    }

    // 아카이브 시트에 전체 데이터 저장
    const archiveData = {
      ...item.data,
      type: item.type,
      status: item.status,
      needsRevision: item.needsRevision,
      createdAt: item.createdAt.toISOString(),
      completedAt: item.completedAt?.toISOString() || new Date().toISOString(),
    };

    // 객체를 배열로 변환 (원본 데이터의 모든 필드 포함)
    const values = Object.values(archiveData);
    await sheetsService.appendRow(SHEET_NAMES.QC_ARCHIVE, values);
    
    console.log(`[QC] 아카이브 저장 완료: ${item.type} QC 항목 (${item.id})`);
  } catch (error) {
    console.error('[QC] 아카이브 시트 저장 실패:', error);
    throw error;
  }
}

/**
 * QC 완료 처리 및 아카이빙
 * POST /api/qc/:type/:id/complete
 */
router.post('/:type/:id/complete', async (req, res) => {
  try {
    const { type, id } = req.params;

    if (type !== 'text' && type !== 'image') {
      return res.status(400).json({ error: '잘못된 타입입니다.' });
    }

    const store = type === 'text' ? qcDataStore.text : qcDataStore.image;
    const item = store.get(id);

    if (!item) {
      return res.status(404).json({ error: 'QC 항목을 찾을 수 없습니다.' });
    }

    // 아카이브로 이동
    item.completedAt = new Date();
    qcDataStore.archive.set(id, item);
    store.delete(id);

    // Google Sheets 아카이브 시트에 저장 (비동기)
    saveToArchiveSheet(item).catch((error) => {
      console.error('[QC] 아카이브 시트 저장 실패:', error);
      // 저장 실패해도 메모리 아카이브는 유지
    });

    res.json({ success: true, item });
  } catch (error: any) {
    console.error('[QC] 완료 처리 오류:', error);
    res.status(500).json({
      error: '완료 처리 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

/**
 * 작가 알람 명단 조회
 * GET /api/qc/artists/notifications
 */
router.get('/artists/notifications', async (req, res) => {
  try {
    // 작가 정보 다시 로드
    await loadArtists();

    const artistMap = new Map<string, ArtistNotification>();

    // 텍스트 QC에서 수정 필요 항목 수집 (비대상 제외)
    for (const item of qcDataStore.text.values()) {
      if (item.status === 'excluded') continue; // 비대상 제외
      if (item.needsRevision || item.status === 'needs_revision') {
        const artistId = item.data.global_artist_id || item.data.artist_id;
        if (!artistId) continue;

        const artistIdStr = String(artistId);
        if (!artistMap.has(artistIdStr)) {
          const artistInfo = getArtistInfo(artistId);
          artistMap.set(artistIdStr, {
            artistId: artistIdStr,
            artistName: artistInfo.name,
            artistEmail: artistInfo.email,
            textQCItems: 0,
            imageQCItems: 0,
            items: [],
          });
        }

        const notification = artistMap.get(artistIdStr)!;
        notification.textQCItems++;
        notification.items.push({
          id: item.id,
          type: 'text',
          productName: item.data.product_name || item.data.name || '제품명 없음',
        });
      }
    }

    // 이미지 QC에서 수정 필요 항목 수집 (비대상 제외)
    for (const item of qcDataStore.image.values()) {
      if (item.status === 'excluded') continue; // 비대상 제외
      if (item.needsRevision || item.status === 'needs_revision') {
        const artistId = item.data.artist_id;
        if (!artistId) continue;

        const artistIdStr = String(artistId);
        if (!artistMap.has(artistIdStr)) {
          const artistInfo = getArtistInfo(artistId);
          artistMap.set(artistIdStr, {
            artistId: artistIdStr,
            artistName: artistInfo.name,
            artistEmail: artistInfo.email,
            textQCItems: 0,
            imageQCItems: 0,
            items: [],
          });
        }

        const notification = artistMap.get(artistIdStr)!;
        notification.imageQCItems++;
        notification.items.push({
          id: item.id,
          type: 'image',
          productName: item.data.product_name || '제품명 없음',
        });
      }
    }

    const notifications = Array.from(artistMap.values());

    res.json({
      artists: notifications,
      total: notifications.length,
      totalTextItems: notifications.reduce((sum, a) => sum + a.textQCItems, 0),
      totalImageItems: notifications.reduce((sum, a) => sum + a.imageQCItems, 0),
    });
  } catch (error: any) {
    console.error('[QC] 작가 알람 명단 조회 오류:', error);
    res.status(500).json({
      error: '작가 알람 명단 조회 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

/**
 * QC 아카이브 목록 조회
 * GET /api/qc/archive?type=text&page=1&limit=20&startDate=2025-01-01&endDate=2025-01-31
 */
router.get('/archive', async (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    // 메모리 아카이브 + 원본 시트에서 archived 상태인 항목도 함께 조회
    const archiveMap = new Map<string, QCItem>();
    
    // 먼저 메모리 아카이브 추가
    for (const item of qcDataStore.archive.values()) {
      archiveMap.set(item.id, item);
    }
    
    // 원본 시트에서 archived 상태인 항목도 추가
    try {
      console.log('[QC] 아카이브 조회: 원본 시트에서 archived 항목 검색 시작...');
      
      // 텍스트 QC 원본 시트에서 archived 항목 조회
      const textData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.QC_TEXT_RAW, false);
      let textArchivedCount = 0;
      for (const record of textData) {
        const status = String(record.status || '').toLowerCase().trim();
        if (status === 'archived' || record.archived === true) {
          const id = generateId('text', record);
          if (!archiveMap.has(id)) {
            const qcItem: QCItem = {
              id,
              type: 'text',
              data: record,
              status: 'approved',
              needsRevision: false,
              createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
              completedAt: record.completedAt ? new Date(record.completedAt) : new Date(),
            };
            archiveMap.set(id, qcItem);
            textArchivedCount++;
          }
        }
      }
      console.log(`[QC] 텍스트 QC 원본 시트에서 ${textArchivedCount}개 archived 항목 발견`);

      // 이미지 QC 원본 시트에서 archived 항목 조회
      const imageData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.QC_IMAGE_RAW, false);
      let imageArchivedCount = 0;
      for (const record of imageData) {
        const status = String(record.status || '').toLowerCase().trim();
        if (status === 'archived' || record.archived === true) {
          const id = generateId('image', record);
          if (!archiveMap.has(id)) {
            const qcItem: QCItem = {
              id,
              type: 'image',
              data: record,
              status: 'approved',
              needsRevision: false,
              createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
              completedAt: record.completedAt ? new Date(record.completedAt) : new Date(),
            };
            archiveMap.set(id, qcItem);
            imageArchivedCount++;
          }
        }
      }
      console.log(`[QC] 이미지 QC 원본 시트에서 ${imageArchivedCount}개 archived 항목 발견`);
      console.log(`[QC] 총 아카이브 항목: ${archiveMap.size}개 (메모리: ${qcDataStore.archive.size}개, 원본시트: ${textArchivedCount + imageArchivedCount}개)`);
    } catch (error: any) {
      console.warn('[QC] 원본 시트에서 아카이브 항목 조회 실패:', error);
      console.warn('[QC] 오류 상세:', error.message);
      // 실패해도 메모리 아카이브는 계속 사용
    }

    let items = Array.from(archiveMap.values());

    // 타입 필터링
    if (type && type !== 'all') {
      items = items.filter((item) => item.type === type);
    }

    // 날짜 필터링
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      items = items.filter((item) => {
        const completedAt = item.completedAt || item.createdAt;
        return completedAt >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      items = items.filter((item) => {
        const completedAt = item.completedAt || item.createdAt;
        return completedAt <= end;
      });
    }

    // 완료일 기준으로 최신순 정렬
    items.sort((a, b) => {
      const dateA = a.completedAt || a.createdAt;
      const dateB = b.completedAt || b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });

    // 페이지네이션
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedItems = items.slice(start, end);

    // 통계 계산
    const totalByType = {
      text: items.filter((item) => item.type === 'text').length,
      image: items.filter((item) => item.type === 'image').length,
    };

    res.json({
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit),
      },
      stats: {
        total: items.length,
        totalByType,
      },
    });
  } catch (error: any) {
    console.error('[QC] 아카이브 목록 조회 오류:', error);
    res.status(500).json({
      error: '아카이브 목록 조회 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

/**
 * 작가 알람 발송
 * POST /api/qc/artists/notify
 */
router.post('/artists/notify', async (req, res) => {
  try {
    const { artistId, items } = req.body;

    if (!artistId) {
      return res.status(400).json({ error: '작가 ID가 필요합니다.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '알람을 발송할 항목이 필요합니다.' });
    }

    // 작가 정보 확인 (캐시 사용)
    await loadArtists(); // 캐시가 유효하면 스킵됨
    const artistInfo = getArtistInfo(artistId);
    const artistName = artistInfo.name;
    const artistEmail = artistInfo.email;
    
    console.log(`[QC] 알람 발송 요청: 작가 ID ${artistId}, 이름: ${artistName}, 메일: ${artistEmail || '없음'}`);

    // 알람 발송할 항목 검증
    const validItems: Array<{ id: string; type: 'text' | 'image'; productName: string }> = [];
    const invalidItems: string[] = [];

    for (const itemId of items) {
      // 텍스트 QC에서 찾기
      let item = qcDataStore.text.get(itemId);
      if (item) {
        if (item.needsRevision || item.status === 'needs_revision') {
          validItems.push({
            id: item.id,
            type: 'text',
            productName: item.data.product_name || item.data.name || '제품명 없음',
          });
        } else {
          invalidItems.push(itemId);
        }
        continue;
      }

      // 이미지 QC에서 찾기
      item = qcDataStore.image.get(itemId);
      if (item) {
        if (item.needsRevision || item.status === 'needs_revision') {
          validItems.push({
            id: item.id,
            type: 'image',
            productName: item.data.product_name || '제품명 없음',
          });
        } else {
          invalidItems.push(itemId);
        }
        continue;
      }

      invalidItems.push(itemId);
    }

    if (validItems.length === 0) {
      return res.status(400).json({
        error: '유효한 수정 필요 항목이 없습니다.',
        invalidItems,
      });
    }

    // 알람 발송 이력 저장 (메모리 저장소, 실제로는 Google Sheets나 DB에 저장 권장)
    const notificationHistory = {
      artistId: String(artistId),
      artistName,
      items: validItems,
      sentAt: new Date(),
      status: 'sent' as const,
    };

    // 이메일 발송 (동기 처리 - Resend는 빠름)
    console.log(`[QC] 작가 알람 발송: ${artistName} (${artistId})에게 ${validItems.length}개 항목 알람`);
    console.log(`[QC] 이메일 발송 조건 확인: artistEmail=${artistEmail ? 'Y' : 'N'}, emailService=${emailService ? 'Y' : 'N'}`);

    let emailSent = false;
    let emailMessageId: string | undefined = undefined;
    let emailError: string | undefined = undefined;

    if (artistEmail && emailService) {
      console.log(`[QC] 이메일 발송 시작: ${artistName} -> ${artistEmail}`);
      
      try {
        // 이메일 템플릿 생성
        const emailTemplate = emailTemplateService.generateQCNotificationEmail({
          artistName,
          textQCItems: validItems.filter((item) => item.type === 'text').length,
          imageQCItems: validItems.filter((item) => item.type === 'image').length,
          items: validItems,
        });

        // 이메일 발송
        const emailResult = await emailService.sendEmail(
          artistEmail,
          emailTemplate.subject,
          emailTemplate.htmlBody,
          emailTemplate.textBody
        );

        if (emailResult.success) {
          emailSent = true;
          emailMessageId = emailResult.messageId;
          console.log(`[QC] ✅ 이메일 발송 성공: ${artistName} (${artistEmail}) - ID: ${emailMessageId}`);
        } else {
          emailError = emailResult.error;
          console.warn(`[QC] ❌ 이메일 발송 실패: ${artistName} (${artistEmail}) - ${emailError}`);
        }
      } catch (error: any) {
        emailError = error.message;
        console.error(`[QC] ❌ 이메일 발송 오류: ${artistName} (${artistEmail}) -`, error.message);
      }
    } else {
      emailError = !artistEmail ? '작가 메일 주소가 없습니다.' : '이메일 서비스가 설정되지 않았습니다.';
      console.log(`[QC] 이메일 발송 스킵: ${emailError}`);
    }

    // 응답 전송
    res.json({
      success: true,
      artistId: String(artistId),
      artistName,
      artistEmail,
      sentItems: validItems,
      invalidItems: invalidItems.length > 0 ? invalidItems : undefined,
      sentAt: notificationHistory.sentAt,
      emailSent,
      emailMessageId,
      emailError,
      message: `${artistName} 작가에게 ${validItems.length}개 항목에 대한 알람이 발송되었습니다.${
        emailSent
          ? ` (이메일 발송 완료: ${artistEmail})`
          : emailError
            ? ` (${emailError})`
            : ''
      }`,
    });
  } catch (error: any) {
    console.error('[QC] 작가 알람 발송 오류:', error);
    res.status(500).json({
      error: '알람 발송 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

/**
 * 중복 검사
 * GET /api/qc/check-duplicates
 */
router.get('/check-duplicates', async (req, res) => {
  try {
    const { type, ids } = req.query;

    if (!type || !ids) {
      return res.status(400).json({ error: 'type과 ids 파라미터가 필요합니다.' });
    }

    const idArray = Array.isArray(ids) ? ids : [ids];
    const duplicates: string[] = [];

    for (const id of idArray) {
      if (qcDataStore.archive.has(String(id))) {
        duplicates.push(String(id));
      }
    }

    res.json({ duplicates, count: duplicates.length });
  } catch (error: any) {
    console.error('[QC] 중복 검사 오류:', error);
    res.status(500).json({
      error: '중복 검사 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

export default router;

