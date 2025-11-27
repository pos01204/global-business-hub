import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

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
  status: 'pending' | 'approved' | 'needs_revision' | 'excluded';
  needsRevision: boolean;
  createdAt: Date;
  completedAt?: Date;
}

interface ArtistNotification {
  artistId: string;
  artistName: string;
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
} = {
  text: new Map(),
  image: new Map(),
  archive: new Map(),
  artists: new Map(),
};

/**
 * 작가 정보 로드 (Google Sheets에서)
 */
async function loadArtists() {
  try {
    const artistsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ARTISTS, false);
    artistsData.forEach((artist: any) => {
      // artist_id 또는 global_artist_id를 키로 사용
      if (artist.artist_id) {
        qcDataStore.artists.set(String(artist.artist_id), artist);
      }
      if (artist.global_artist_id) {
        qcDataStore.artists.set(String(artist.global_artist_id), artist);
      }
      // UUID도 매핑 (kr_product_uuid 등에서 추출 가능한 경우)
      if (artist.uuid) {
        qcDataStore.artists.set(artist.uuid, artist);
      }
    });
    console.log(`[QC] 작가 정보 로드 완료: ${qcDataStore.artists.size}명`);
  } catch (error) {
    console.error('[QC] 작가 정보 로드 실패:', error);
  }
}

/**
 * 텍스트 QC 데이터 로드 (Google Sheets에서)
 */
async function loadTextQCData() {
  try {
    const textData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.QC_TEXT_PROCESS, false);
    let imported = 0;
    let skipped = 0;

    for (const record of textData) {
      const id = generateId('text', record);
      
      // 이미 존재하는 경우 스킵
      if (qcDataStore.text.has(id) || qcDataStore.archive.has(id)) {
        skipped++;
        continue;
      }

      const qcItem: QCItem = {
        id,
        type: 'text',
        data: record,
        status: (record.status as 'pending' | 'approved' | 'needs_revision' | 'excluded') || 'pending',
        needsRevision: record.needsRevision === true || record.needs_revision === true,
        createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
        completedAt: record.completedAt ? new Date(record.completedAt) : undefined,
      };

      qcDataStore.text.set(id, qcItem);
      imported++;
    }

    console.log(`[QC] 텍스트 QC 데이터 로드 완료: ${imported}개 가져옴, ${skipped}개 스킵`);
  } catch (error) {
    console.error('[QC] 텍스트 QC 데이터 로드 실패:', error);
  }
}

/**
 * 이미지 QC 데이터 로드 (Google Sheets에서)
 */
async function loadImageQCData() {
  try {
    // 먼저 원본 데이터 시트에서 로드 시도
    let imageData: any[] = [];
    
    try {
      imageData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.QC_IMAGE_RAW, false);
    } catch (error) {
      console.warn('[QC] 이미지 QC 원본 시트를 찾을 수 없습니다. 처리 시트에서 로드 시도합니다.');
      // 원본 시트가 없으면 처리 시트에서 로드 시도
      try {
        const processData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.QC_IMAGE_PROCESS, false);
        // 이미지 QC 데이터만 필터링 (타입 구분이 필요한 경우)
        imageData = processData.filter((item: any) => 
          item.image_url || item.detected_text || item.page_name
        );
      } catch (processError) {
        console.error('[QC] 이미지 QC 처리 시트도 찾을 수 없습니다.');
        return;
      }
    }

    let imported = 0;
    let skipped = 0;

    for (const record of imageData) {
      const id = generateId('image', record);
      
      // 이미 존재하는 경우 스킵
      if (qcDataStore.image.has(id) || qcDataStore.archive.has(id)) {
        skipped++;
        continue;
      }

      const qcItem: QCItem = {
        id,
        type: 'image',
        data: record,
        status: (record.status as 'pending' | 'approved' | 'needs_revision' | 'excluded') || 'pending',
        needsRevision: record.needsRevision === true || record.needs_revision === true,
        createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
        completedAt: record.completedAt ? new Date(record.completedAt) : undefined,
      };

      qcDataStore.image.set(id, qcItem);
      imported++;
    }

    console.log(`[QC] 이미지 QC 데이터 로드 완료: ${imported}개 가져옴, ${skipped}개 스킵`);
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

    res.json({
      success: true,
      imported,
      skipped,
      duplicates: duplicates.length,
      total: records.length,
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

    store.set(id, item);

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
          artistMap.set(artistIdStr, {
            artistId: artistIdStr,
            artistName: getArtistName(artistId),
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
          artistMap.set(artistIdStr, {
            artistId: artistIdStr,
            artistName: getArtistName(artistId),
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

