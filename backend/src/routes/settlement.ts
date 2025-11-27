import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';
import { rateService, RateValidationResult } from '../services/rateService';

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

// 정산서 헤더 매핑 (롯데글로벌로지스 정산서 → 표준 칼럼명)
// 주의: 정산서의 "주문번호"는 내부 시스템의 "shipment_id"에 대응함
const HEADER_MAPPING: Record<string, string> = {
  'NO': 'no',
  '운송구분': 'carrier',
  '해외운송장번호': 'tracking_number',
  '주문번호': 'shipment_id', // 핵심: 정산서 주문번호 = 내부 shipment_id
  '출고번호': 'logistics_shipment_code', // 물류사 전용 (내부 매핑 없음)
  '부출고번호': 'logistics_sub_shipment_code', // 물류사 전용 (내부 매핑 없음)
  '내품 수': 'item_count',
  '발송일자(선적일자)': 'shipped_at',
  '보내는 사람': 'sender',
  '받는 사람': 'recipient',
  '도착국': 'country_code',
  '존': 'zone',
  '디멘션': 'dimensions',
  '실중량': 'actual_weight',
  '부피중량': 'volumetric_weight',
  '청구중량': 'charged_weight',
  '해외운송료': 'shipping_fee',
  '기타운임1': 'surcharge1',
  '기타운임1 항목': 'surcharge1_type',
  '기타운임2': 'surcharge2',
  '기타운임2항목': 'surcharge2_type',
  '기타운임3': 'surcharge3',
  '기타운임3항목': 'surcharge3_type',
  '운임 합계': 'total_cost',
  '비고': 'note',
};

// 표준 헤더 (Google Sheets에 생성될 칼럼)
const STANDARD_HEADERS = [
  'id',                        // 고유 ID
  'period',                    // 정산 기간 (YYYY-MM)
  'uploaded_at',               // 업로드 일시
  'no',                        // 정산서 순번
  'carrier',                   // 운송사 (LOTTEGLOBAL, KPACKET 등)
  'tracking_number',           // 해외운송장번호
  'shipment_id',               // 내부 shipment_id (정산서의 "주문번호")
  'logistics_shipment_code',   // 물류사 출고번호 (물류사 전용)
  'logistics_sub_shipment_code', // 물류사 부출고번호 (물류사 전용)
  'item_count',                // 내품 수
  'shipped_at',                // 발송일자
  'sender',                    // 보내는 사람
  'recipient',                 // 받는 사람
  'country_code',              // 도착국 코드 (JP, US 등)
  'zone',                      // 존 (일본, 미국 등)
  'dimensions',                // 디멘션 (LxWxH)
  'actual_weight',             // 실중량 (kg)
  'volumetric_weight',         // 부피중량 (kg)
  'charged_weight',            // 청구중량 (kg)
  'shipping_fee',              // 해외운송료 (원)
  'surcharge1',                // 기타운임1 (원)
  'surcharge1_type',           // 기타운임1 항목
  'surcharge2',                // 기타운임2 (원)
  'surcharge2_type',           // 기타운임2 항목
  'surcharge3',                // 기타운임3 (원)
  'surcharge3_type',           // 기타운임3 항목
  'total_cost',                // 운임 합계 (원)
  'note',                      // 비고
];

/**
 * 시트 헤더 확인 및 생성 (시트가 없으면 자동 생성)
 */
async function ensureSheetHeaders(sheetName: string, headers: string[]): Promise<boolean> {
  try {
    // 1. 시트가 없으면 자동 생성
    const sheetCreated = await sheetsService.createSheetIfNotExists(sheetName);
    if (!sheetCreated) {
      console.error(`[Settlement] 시트 생성 실패: ${sheetName}`);
      throw new Error(`시트를 생성할 수 없습니다: ${sheetName}`);
    }

    // 2. 기존 데이터 확인
    const existingData = await sheetsService.getSheetDataAsJson(sheetName, false);
    
    // 3. 헤더가 없으면 추가
    if (existingData.length === 0) {
      console.log(`[Settlement] 시트 헤더 생성: ${sheetName}`);
      await sheetsService.appendRow(sheetName, headers);
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error(`[Settlement] 시트 초기화 실패:`, error.message);
    throw error;
  }
}

/**
 * 숫자 파싱 (쉼표, 공백 제거)
 */
function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = String(value).replace(/[,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * 기간 추출 (발송일자에서 YYYY-MM 형식)
 */
function extractPeriod(shippedAt: string): string {
  if (!shippedAt) return '';
  const match = shippedAt.match(/(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : '';
}

/**
 * 고유 ID 생성
 */
function generateId(): string {
  return `SET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// API 엔드포인트
// ============================================

/**
 * POST /api/settlement/upload
 * 정산서 CSV 업로드 및 Google Sheets 저장
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '파일이 없습니다.' });
    }

    console.log('[Settlement] CSV 업로드 시작:', req.file.originalname);

    // CSV 파싱 (BOM 제거)
    let csvContent = req.file.buffer.toString('utf-8');
    // BOM 제거
    if (csvContent.charCodeAt(0) === 0xFEFF) {
      csvContent = csvContent.slice(1);
    }

    const records = parse(csvContent, {
      columns: false,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    });

    if (records.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: '유효한 데이터가 없습니다.' 
      });
    }

    // 헤더 행 찾기 (NO, 운송구분 등이 있는 행)
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, records.length); i++) {
      const row = records[i];
      if (row.some((cell: string) => cell === 'NO' || cell === '운송구분' || cell === '해외운송장번호')) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return res.status(400).json({
        success: false,
        error: '정산서 형식을 인식할 수 없습니다. 롯데글로벌로지스 정산서 형식인지 확인하세요.',
      });
    }

    const headers = records[headerRowIndex];
    const dataRows = records.slice(headerRowIndex + 1);

    console.log(`[Settlement] 헤더 발견 (행 ${headerRowIndex + 1}):`, headers.slice(0, 5).join(', '), '...');

    // 시트 헤더 확인/생성
    await ensureSheetHeaders(SHEET_NAMES.SETTLEMENT_RECORDS, STANDARD_HEADERS);

    // 데이터 변환 및 저장 준비
    const uploadedAt = new Date().toISOString();
    const processedRows: any[][] = [];
    const skippedRows: number[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      // 빈 행 또는 합계 행 스킵
      const firstCell = String(row[0] || '').trim();
      if (!firstCell || isNaN(parseInt(firstCell))) {
        skippedRows.push(i + headerRowIndex + 2);
        continue;
      }

      // 헤더 매핑으로 데이터 추출
      const rowData: Record<string, any> = {};
      headers.forEach((header: string, idx: number) => {
        const cleanHeader = header.trim();
        const standardKey = HEADER_MAPPING[cleanHeader];
        if (standardKey && row[idx] !== undefined) {
          rowData[standardKey] = row[idx];
        }
      });

      // shipment_id가 없으면 스킵 (필수 필드)
      if (!rowData.shipment_id) {
        skippedRows.push(i + headerRowIndex + 2);
        continue;
      }

      // 기간 추출
      const period = extractPeriod(rowData.shipped_at);
      
      // 표준 형식으로 변환
      const standardRow = [
        generateId(),                                    // id
        period,                                          // period
        uploadedAt,                                      // uploaded_at
        rowData.no || '',                                // no
        rowData.carrier || '',                           // carrier
        rowData.tracking_number || '',                   // tracking_number
        rowData.shipment_id || '',                       // shipment_id (정산서 주문번호)
        rowData.logistics_shipment_code || '',           // logistics_shipment_code (물류사 출고번호)
        rowData.logistics_sub_shipment_code || '',       // logistics_sub_shipment_code (물류사 부출고번호)
        parseNumber(rowData.item_count),                 // item_count
        rowData.shipped_at || '',                        // shipped_at
        rowData.sender || '',                            // sender
        rowData.recipient || '',                         // recipient
        rowData.country_code || '',                      // country_code
        rowData.zone || '',                              // zone
        rowData.dimensions || '',                        // dimensions
        parseNumber(rowData.actual_weight),              // actual_weight
        parseNumber(rowData.volumetric_weight),          // volumetric_weight
        parseNumber(rowData.charged_weight),             // charged_weight
        parseNumber(rowData.shipping_fee),               // shipping_fee
        parseNumber(rowData.surcharge1),                 // surcharge1
        rowData.surcharge1_type || '',                   // surcharge1_type
        parseNumber(rowData.surcharge2),                 // surcharge2
        rowData.surcharge2_type || '',                   // surcharge2_type
        parseNumber(rowData.surcharge3),                 // surcharge3
        rowData.surcharge3_type || '',                   // surcharge3_type
        parseNumber(rowData.total_cost),                 // total_cost
        rowData.note || '',                              // note
      ];

      processedRows.push(standardRow);
    }

    // Google Sheets에 배치 저장
    if (processedRows.length > 0) {
      await sheetsService.appendRows(SHEET_NAMES.SETTLEMENT_RECORDS, processedRows);
      console.log(`[Settlement] ${processedRows.length}건 저장 완료`);
    }

    // 기간 추출
    const periods = [...new Set(processedRows.map(row => row[1]).filter(Boolean))];

    // 요약 통계 계산
    const totalShippingFee = processedRows.reduce((sum, row) => sum + (row[19] || 0), 0);
    const totalCost = processedRows.reduce((sum, row) => sum + (row[27] || 0), 0);

    // ======== 요금 검증 (자동) ========
    const validationRecords = processedRows.map(row => ({
      id: row[0],
      carrier: row[4],
      country: row[13], // country_code
      charged_weight: row[18],
      total_cost: row[27],
    }));

    const validationResult = rateService.validateBatch(validationRecords);
    console.log(`[Settlement] 요금 검증 완료: 정상 ${validationResult.summary.normal}, 경고 ${validationResult.summary.warning}, 오류 ${validationResult.summary.error}`);

    // 검증 결과 중 경고/오류 건만 추출
    const validationIssues = validationResult.results
      .filter(r => r.status === 'warning' || r.status === 'error')
      .map(r => ({
        recordId: r.recordId,
        status: r.status,
        message: r.message,
        expectedRate: r.expectedRate,
        actualRate: r.actualRate,
        difference: r.difference,
        differencePercent: Math.round(r.differencePercent * 10) / 10,
        details: r.details,
      }));

    res.json({
      success: true,
      data: {
        fileName: req.file.originalname,
        totalRows: dataRows.length,
        processedRows: processedRows.length,
        skippedRows: skippedRows.length,
        periods,
        uploadedAt,
        summary: {
          totalShippingFee,
          totalCost,
          avgCostPerShipment: processedRows.length > 0 ? Math.round(totalCost / processedRows.length) : 0,
        },
        // 검증 결과 추가
        validation: {
          summary: validationResult.summary,
          issues: validationIssues.slice(0, 20), // 상위 20건만
          hasIssues: validationIssues.length > 0,
        },
        message: `${processedRows.length}건의 정산 데이터가 저장되었습니다.${
          validationIssues.length > 0 
            ? ` (검증 경고/오류 ${validationIssues.length}건 발견)` 
            : ''
        }`,
      },
    });

  } catch (error: any) {
    console.error('[Settlement] 업로드 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message || '파일 처리 중 오류가 발생했습니다.',
    });
  }
});

/**
 * GET /api/settlement/list
 * 정산 데이터 목록 조회
 */
router.get('/list', async (req, res) => {
  try {
    const { period, carrier, country, page = '1', limit = '50' } = req.query;

    const allData = await sheetsService.getSheetDataAsJson(
      SHEET_NAMES.SETTLEMENT_RECORDS, 
      false
    );

    // 필터링
    let filteredData = allData;

    if (period) {
      filteredData = filteredData.filter(row => row.period === period);
    }
    if (carrier) {
      filteredData = filteredData.filter(row => row.carrier === carrier);
    }
    if (country) {
      filteredData = filteredData.filter(row => row.country_code === country);
    }

    // 최신순 정렬
    filteredData.sort((a, b) => {
      const dateA = new Date(a.uploaded_at || 0).getTime();
      const dateB = new Date(b.uploaded_at || 0).getTime();
      return dateB - dateA;
    });

    // 페이지네이션
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedData = filteredData.slice(startIndex, startIndex + limitNum);

    // 요약 통계
    const summary = {
      totalRecords: filteredData.length,
      totalShippingFee: filteredData.reduce((sum, row) => 
        sum + parseFloat(row.shipping_fee || 0), 0),
      totalCost: filteredData.reduce((sum, row) => 
        sum + parseFloat(row.total_cost || 0), 0),
      avgCostPerShipment: filteredData.length > 0 
        ? Math.round(filteredData.reduce((sum, row) => 
            sum + parseFloat(row.total_cost || 0), 0) / filteredData.length)
        : 0,
      byCarrier: {} as Record<string, { count: number; totalCost: number }>,
      byCountry: {} as Record<string, { count: number; totalCost: number }>,
    };

    // 운송사별/국가별 집계
    filteredData.forEach(row => {
      const carrier = row.carrier || 'Unknown';
      const country = row.country_code || 'Unknown';
      const cost = parseFloat(row.total_cost || 0);

      if (!summary.byCarrier[carrier]) {
        summary.byCarrier[carrier] = { count: 0, totalCost: 0 };
      }
      summary.byCarrier[carrier].count++;
      summary.byCarrier[carrier].totalCost += cost;

      if (!summary.byCountry[country]) {
        summary.byCountry[country] = { count: 0, totalCost: 0 };
      }
      summary.byCountry[country].count++;
      summary.byCountry[country].totalCost += cost;
    });

    res.json({
      success: true,
      data: {
        records: paginatedData,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / limitNum),
        },
        summary,
      },
    });

  } catch (error: any) {
    console.error('[Settlement] 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message || '데이터 조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * GET /api/settlement/analysis/country
 * 국가별 분석
 */
router.get('/analysis/country', async (req, res) => {
  try {
    const { period } = req.query;

    const allData = await sheetsService.getSheetDataAsJson(
      SHEET_NAMES.SETTLEMENT_RECORDS, 
      false
    );

    let filteredData = allData;
    if (period) {
      filteredData = filteredData.filter(row => row.period === period);
    }

    // 국가별 집계
    const countryStats: Record<string, {
      count: number;
      totalCost: number;
      totalWeight: number;
      avgCost: number;
      avgWeight: number;
      zone: string;
    }> = {};

    filteredData.forEach(row => {
      const country = row.country_code || 'Unknown';
      const cost = parseFloat(row.total_cost || 0);
      const weight = parseFloat(row.charged_weight || 0);

      if (!countryStats[country]) {
        countryStats[country] = {
          count: 0,
          totalCost: 0,
          totalWeight: 0,
          avgCost: 0,
          avgWeight: 0,
          zone: row.zone || '',
        };
      }
      countryStats[country].count++;
      countryStats[country].totalCost += cost;
      countryStats[country].totalWeight += weight;
    });

    // 평균 계산
    Object.keys(countryStats).forEach(country => {
      const stats = countryStats[country];
      stats.avgCost = stats.count > 0 ? Math.round(stats.totalCost / stats.count) : 0;
      stats.avgWeight = stats.count > 0 ? Math.round(stats.totalWeight / stats.count * 100) / 100 : 0;
    });

    // 건수 기준 정렬
    const sortedStats = Object.entries(countryStats)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([country, stats]) => ({ country, ...stats }));

    res.json({
      success: true,
      data: sortedStats,
    });

  } catch (error: any) {
    console.error('[Settlement] 국가별 분석 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message || '분석 중 오류가 발생했습니다.',
    });
  }
});

/**
 * GET /api/settlement/analysis/carrier
 * 운송사별 분석
 */
router.get('/analysis/carrier', async (req, res) => {
  try {
    const { period } = req.query;

    const allData = await sheetsService.getSheetDataAsJson(
      SHEET_NAMES.SETTLEMENT_RECORDS, 
      false
    );

    let filteredData = allData;
    if (period) {
      filteredData = filteredData.filter(row => row.period === period);
    }

    // 운송사별 집계
    const carrierStats: Record<string, {
      count: number;
      totalCost: number;
      totalSurcharge: number;
      avgCost: number;
      surchargeRate: number;
    }> = {};

    filteredData.forEach(row => {
      const carrier = row.carrier || 'Unknown';
      const cost = parseFloat(row.total_cost || 0);
      const surcharge = 
        parseFloat(row.surcharge1 || 0) + 
        parseFloat(row.surcharge2 || 0) + 
        parseFloat(row.surcharge3 || 0);

      if (!carrierStats[carrier]) {
        carrierStats[carrier] = {
          count: 0,
          totalCost: 0,
          totalSurcharge: 0,
          avgCost: 0,
          surchargeRate: 0,
        };
      }
      carrierStats[carrier].count++;
      carrierStats[carrier].totalCost += cost;
      carrierStats[carrier].totalSurcharge += surcharge;
    });

    // 평균 및 비율 계산
    Object.keys(carrierStats).forEach(carrier => {
      const stats = carrierStats[carrier];
      stats.avgCost = stats.count > 0 ? Math.round(stats.totalCost / stats.count) : 0;
      stats.surchargeRate = stats.totalCost > 0 
        ? Math.round((stats.totalSurcharge / stats.totalCost) * 1000) / 10
        : 0;
    });

    res.json({
      success: true,
      data: Object.entries(carrierStats)
        .map(([carrier, stats]) => ({ carrier, ...stats })),
    });

  } catch (error: any) {
    console.error('[Settlement] 운송사별 분석 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message || '분석 중 오류가 발생했습니다.',
    });
  }
});

/**
 * GET /api/settlement/analysis/weight
 * 중량 최적화 분석
 */
router.get('/analysis/weight', async (req, res) => {
  try {
    const { period } = req.query;

    const allData = await sheetsService.getSheetDataAsJson(
      SHEET_NAMES.SETTLEMENT_RECORDS, 
      false
    );

    let filteredData = allData;
    if (period) {
      filteredData = filteredData.filter(row => row.period === period);
    }

    // 부피중량 > 실중량인 건 분석
    const weightIssues = filteredData
      .filter(row => {
        const actual = parseFloat(row.actual_weight || 0);
        const volumetric = parseFloat(row.volumetric_weight || 0);
        return volumetric > actual && actual > 0;
      })
      .map(row => {
        const actual = parseFloat(row.actual_weight || 0);
        const volumetric = parseFloat(row.volumetric_weight || 0);
        const charged = parseFloat(row.charged_weight || 0);
        const cost = parseFloat(row.total_cost || 0);
        
        // 실중량 기준 비용 추정 (간단 계산)
        const estimatedOptimalCost = actual > 0 ? Math.round(cost * (actual / charged)) : cost;
        const potentialSaving = cost - estimatedOptimalCost;

        return {
          shipment_id: row.shipment_id,
          tracking_number: row.tracking_number,
          country: row.country_code,
          dimensions: row.dimensions,
          actual_weight: actual,
          volumetric_weight: volumetric,
          charged_weight: charged,
          total_cost: cost,
          weight_ratio: Math.round((volumetric / actual) * 100) / 100,
          potential_saving: potentialSaving > 0 ? potentialSaving : 0,
        };
      })
      .sort((a, b) => b.potential_saving - a.potential_saving);

    // 요약 통계
    const summary = {
      totalRecords: filteredData.length,
      weightIssueCount: weightIssues.length,
      weightIssueRate: filteredData.length > 0 
        ? Math.round((weightIssues.length / filteredData.length) * 1000) / 10 
        : 0,
      totalPotentialSaving: weightIssues.reduce((sum, item) => sum + item.potential_saving, 0),
      avgWeightRatio: weightIssues.length > 0
        ? Math.round(weightIssues.reduce((sum, item) => sum + item.weight_ratio, 0) / weightIssues.length * 100) / 100
        : 0,
    };

    res.json({
      success: true,
      data: {
        issues: weightIssues.slice(0, 20), // 상위 20건만
        summary,
      },
    });

  } catch (error: any) {
    console.error('[Settlement] 중량 분석 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message || '분석 중 오류가 발생했습니다.',
    });
  }
});

/**
 * GET /api/settlement/periods
 * 업로드된 기간 목록
 */
router.get('/periods', async (req, res) => {
  try {
    const allData = await sheetsService.getSheetDataAsJson(
      SHEET_NAMES.SETTLEMENT_RECORDS, 
      false
    );

    const periods = [...new Set(allData.map(row => row.period).filter(Boolean))];
    periods.sort().reverse(); // 최신순

    // 기간별 건수 집계
    const periodStats = periods.map(period => {
      const periodData = allData.filter(row => row.period === period);
      return {
        period,
        count: periodData.length,
        totalCost: periodData.reduce((sum, row) => sum + parseFloat(row.total_cost || 0), 0),
      };
    });

    res.json({
      success: true,
      data: periodStats,
    });

  } catch (error: any) {
    console.error('[Settlement] 기간 목록 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message || '기간 조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * GET /api/settlement/shipment/:shipmentId
 * shipment_id로 정산 데이터 조회
 */
router.get('/shipment/:shipmentId', async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const allData = await sheetsService.getSheetDataAsJson(
      SHEET_NAMES.SETTLEMENT_RECORDS, 
      false
    );

    const records = allData.filter(row => 
      String(row.shipment_id) === String(shipmentId)
    );

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        error: `shipment_id ${shipmentId}에 해당하는 정산 데이터를 찾을 수 없습니다.`,
      });
    }

    res.json({
      success: true,
      data: records,
    });

  } catch (error: any) {
    console.error('[Settlement] 정산 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message || '조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * POST /api/settlement/validate
 * 저장된 정산 데이터 검증 (기간별)
 */
router.post('/validate', async (req, res) => {
  try {
    const { period } = req.body;

    const allData = await sheetsService.getSheetDataAsJson(
      SHEET_NAMES.SETTLEMENT_RECORDS, 
      false
    );

    let filteredData = allData;
    if (period) {
      filteredData = filteredData.filter(row => row.period === period);
    }

    if (filteredData.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: {
            total: 0, normal: 0, warning: 0, error: 0, unknown: 0,
            totalExpectedCost: 0, totalActualCost: 0, totalDifference: 0,
          },
          issues: [],
        },
      });
    }

    // 검증 데이터 준비
    const validationRecords = filteredData.map(row => ({
      id: row.id,
      carrier: row.carrier,
      country: row.country_code,
      charged_weight: parseFloat(row.charged_weight || 0),
      total_cost: parseFloat(row.total_cost || 0),
    }));

    const result = rateService.validateBatch(validationRecords);

    // 검증 결과 중 이슈 있는 건만 추출
    const issues = result.results
      .filter(r => r.status === 'warning' || r.status === 'error')
      .map(r => ({
        recordId: r.recordId,
        status: r.status,
        message: r.message,
        expectedRate: r.expectedRate,
        actualRate: r.actualRate,
        difference: r.difference,
        differencePercent: Math.round(r.differencePercent * 10) / 10,
        details: r.details,
      }))
      .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

    res.json({
      success: true,
      data: {
        period: period || '전체',
        summary: result.summary,
        issues,
      },
    });

  } catch (error: any) {
    console.error('[Settlement] 검증 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message || '검증 중 오류가 발생했습니다.',
    });
  }
});

/**
 * GET /api/settlement/rates/expected
 * 예상 요금 조회
 */
router.get('/rates/expected', async (req, res) => {
  try {
    const { carrier, country, weight } = req.query;

    if (!carrier || !country || !weight) {
      return res.status(400).json({
        success: false,
        error: '운송사(carrier), 국가(country), 중량(weight)은 필수입니다.',
      });
    }

    const weightNum = parseFloat(weight as string);
    const carrierStr = (carrier as string).toUpperCase();
    const countryStr = country as string;

    let expectedRate: number | null = null;
    let service: string | undefined;

    if (carrierStr === 'LOTTEGLOBAL' || carrierStr === 'LOTTE') {
      const lotteRate = rateService.getExpectedLotteRate(countryStr, weightNum);
      if (lotteRate) {
        expectedRate = lotteRate.rate;
        service = lotteRate.service;
      }
    } else if (carrierStr === 'KPACKET' || carrierStr === 'K-PACKET') {
      expectedRate = rateService.getExpectedKPacketRate(countryStr, weightNum);
      service = 'K-Packet';
    } else if (carrierStr === 'EMS') {
      expectedRate = rateService.getExpectedEmsRate(countryStr, weightNum);
      service = 'EMS';
    }

    res.json({
      success: true,
      data: {
        carrier: carrierStr,
        country: countryStr,
        weight: weightNum,
        expectedRate,
        service,
        found: expectedRate !== null,
      },
    });

  } catch (error: any) {
    console.error('[Settlement] 예상 요금 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message || '조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * GET /api/settlement/rates/countries
 * 지원 국가 목록 조회
 */
router.get('/rates/countries', async (req, res) => {
  try {
    const countries = rateService.getSupportedCountries();

    res.json({
      success: true,
      data: countries,
    });

  } catch (error: any) {
    console.error('[Settlement] 국가 목록 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message || '조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * GET /api/settlement/analysis/trend
 * 월별 물류비 트렌드 분석
 */
router.get('/analysis/trend', async (req, res) => {
  try {
    const allData = await sheetsService.getSheetDataAsJson(
      SHEET_NAMES.SETTLEMENT_RECORDS, 
      false
    );

    // 기간별 집계
    const periodStats: Record<string, {
      count: number;
      totalCost: number;
      totalShippingFee: number;
      totalSurcharge: number;
      avgCost: number;
      avgWeight: number;
      totalWeight: number;
      byCarrier: Record<string, { count: number; cost: number }>;
      byCountry: Record<string, { count: number; cost: number }>;
    }> = {};

    allData.forEach(row => {
      const period = row.period || 'Unknown';
      const cost = parseFloat(row.total_cost || 0);
      const shippingFee = parseFloat(row.shipping_fee || 0);
      const surcharge = 
        parseFloat(row.surcharge1 || 0) + 
        parseFloat(row.surcharge2 || 0) + 
        parseFloat(row.surcharge3 || 0);
      const weight = parseFloat(row.charged_weight || 0);
      const carrier = row.carrier || 'Unknown';
      const country = row.country_code || 'Unknown';

      if (!periodStats[period]) {
        periodStats[period] = {
          count: 0,
          totalCost: 0,
          totalShippingFee: 0,
          totalSurcharge: 0,
          avgCost: 0,
          avgWeight: 0,
          totalWeight: 0,
          byCarrier: {},
          byCountry: {},
        };
      }

      periodStats[period].count++;
      periodStats[period].totalCost += cost;
      periodStats[period].totalShippingFee += shippingFee;
      periodStats[period].totalSurcharge += surcharge;
      periodStats[period].totalWeight += weight;

      // 운송사별
      if (!periodStats[period].byCarrier[carrier]) {
        periodStats[period].byCarrier[carrier] = { count: 0, cost: 0 };
      }
      periodStats[period].byCarrier[carrier].count++;
      periodStats[period].byCarrier[carrier].cost += cost;

      // 국가별
      if (!periodStats[period].byCountry[country]) {
        periodStats[period].byCountry[country] = { count: 0, cost: 0 };
      }
      periodStats[period].byCountry[country].count++;
      periodStats[period].byCountry[country].cost += cost;
    });

    // 평균 계산 및 정렬
    const trendData = Object.entries(periodStats)
      .map(([period, stats]) => ({
        period,
        count: stats.count,
        totalCost: Math.round(stats.totalCost),
        totalShippingFee: Math.round(stats.totalShippingFee),
        totalSurcharge: Math.round(stats.totalSurcharge),
        avgCost: stats.count > 0 ? Math.round(stats.totalCost / stats.count) : 0,
        avgWeight: stats.count > 0 ? Math.round(stats.totalWeight / stats.count * 100) / 100 : 0,
        surchargeRate: stats.totalCost > 0 
          ? Math.round((stats.totalSurcharge / stats.totalCost) * 1000) / 10 
          : 0,
        byCarrier: Object.entries(stats.byCarrier)
          .map(([carrier, data]) => ({ carrier, ...data }))
          .sort((a, b) => b.cost - a.cost),
        byCountry: Object.entries(stats.byCountry)
          .map(([country, data]) => ({ country, ...data }))
          .sort((a, b) => b.cost - a.cost)
          .slice(0, 5), // 상위 5개국만
      }))
      .filter(item => item.period !== 'Unknown')
      .sort((a, b) => a.period.localeCompare(b.period));

    // 전체 요약
    const overallSummary = {
      totalPeriods: trendData.length,
      totalRecords: trendData.reduce((sum, p) => sum + p.count, 0),
      totalCost: trendData.reduce((sum, p) => sum + p.totalCost, 0),
      avgMonthlyCost: trendData.length > 0 
        ? Math.round(trendData.reduce((sum, p) => sum + p.totalCost, 0) / trendData.length)
        : 0,
      avgMonthlyCount: trendData.length > 0
        ? Math.round(trendData.reduce((sum, p) => sum + p.count, 0) / trendData.length)
        : 0,
    };

    res.json({
      success: true,
      data: {
        trend: trendData,
        summary: overallSummary,
      },
    });

  } catch (error: any) {
    console.error('[Settlement] 트렌드 분석 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message || '분석 중 오류가 발생했습니다.',
    });
  }
});

export default router;

