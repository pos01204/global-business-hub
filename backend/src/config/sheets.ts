import dotenv from 'dotenv';
import { resolve } from 'path';

// .env 파일 로드 (backend 폴더 기준)
// tsx로 실행 시 process.cwd()는 backend 폴더를 가리킴
// 하지만 루트에서 실행하면 루트를 가리키므로, 두 경우 모두 처리
let envPath: string;
if (process.cwd().endsWith('backend')) {
  // backend 폴더에서 직접 실행된 경우
  envPath = resolve(process.cwd(), '.env');
} else {
  // 루트에서 실행된 경우
  envPath = resolve(process.cwd(), 'backend', '.env');
}
dotenv.config({ path: envPath });

// 환경 변수 로드 확인 (디버깅용)
const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || '';
const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';

export const sheetsConfig = {
  spreadsheetId,
  clientEmail,
  privateKey,
};

// Google Sheets 환경 변수 검증 (선택사항)
export const isGoogleSheetsConfigured = !!(spreadsheetId && clientEmail && privateKey);

if (!isGoogleSheetsConfigured) {
  console.warn('⚠️  Google Sheets API 환경 변수가 설정되지 않았습니다.');
  console.warn('   Google Sheets 기능은 사용할 수 없지만, 서버는 정상적으로 시작됩니다.');
  console.warn('   환경 변수 상태:');
  console.warn('     - GOOGLE_SHEETS_SPREADSHEET_ID:', spreadsheetId ? '있음' : '없음');
  console.warn('     - GOOGLE_SHEETS_CLIENT_EMAIL:', clientEmail ? '있음' : '없음');
  console.warn('     - GOOGLE_SHEETS_PRIVATE_KEY:', privateKey ? '있음' : '없음');
  console.warn('   Google Sheets 기능을 사용하려면 환경 변수를 설정하세요.');
} else {
  console.log('✅ Google Sheets 환경 변수 로드 성공');
}

// 시트 이름 상수
export const SHEET_NAMES = {
  ORDER: 'order',
  LOGISTICS: 'logistics',
  USERS: 'users',
  ARTISTS: 'artists',
  ARTISTS_MAIL: 'artists_mail', // 작가 메일 정보 (VLOOKUP 원본)
  MARKETER_CONTENT: 'marketer_content', // 퍼포먼스 마케터 콘텐츠 저장
  // QC 관련 시트
  QC_TEXT_RAW: '[QC] 한글_raw', // 텍스트 QC 원본 데이터
  QC_IMAGE_RAW: '[QC] OCR_결과_raw', // 이미지 QC 원본 데이터
  QC_TEXT_PROCESS: '[QC] 한글_raw', // 텍스트 QC 처리 시트 (원본 시트에 상태 컬럼 추가)
  QC_IMAGE_PROCESS: '[QC] OCR_결과_raw', // 이미지 QC 처리 시트 (원본 시트에 상태 컬럼 추가)
  QC_ARCHIVE: '[QC] archiving', // 완료된 QC 아카이브
  // 물류비 정산 관련 시트
  SETTLEMENT_RECORDS: 'Settlement_records', // 정산서 건별 상세 데이터
  SETTLEMENT_MONTHLY: 'Settlement_monthly', // 월별 요약 데이터
  // 표준 요금표 시트
  RATE_LOTTE: 'Rate_LotteGlobal', // 롯데글로벌 요금표
  RATE_EMS: 'Rate_EMS', // EMS 요금표
  RATE_KPACKET: 'Rate_KPacket', // K-Packet 요금표
  // 소포수령증 관련 시트
  SOPO_TRACKING: 'Sopo_tracking', // 소포수령증 발급 트래킹
  SOPO_JOTFORM: 'Sopo_jotform', // JotForm 신청 데이터 연동
  // 리뷰 시트
  REVIEW: 'review', // 글로벌 구매 후기
} as const;

