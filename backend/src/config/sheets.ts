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

// 환경 변수 검증 및 디버깅 정보
if (!spreadsheetId || !clientEmail || !privateKey) {
  console.error('❌ 환경 변수 오류: backend/.env 파일을 확인하세요.');
  console.error('파일 경로:', envPath);
  console.error('환경 변수 상태:');
  console.error('  - GOOGLE_SHEETS_SPREADSHEET_ID:', spreadsheetId ? `있음 (${spreadsheetId.substring(0, 10)}...)` : '없음');
  console.error('  - GOOGLE_SHEETS_CLIENT_EMAIL:', clientEmail ? `있음 (${clientEmail.substring(0, 20)}...)` : '없음');
  console.error('  - GOOGLE_SHEETS_PRIVATE_KEY:', privateKey ? `있음 (${privateKey.length}자)` : '없음');
  console.error('\n자세한 설정 방법은 QUICK_START.md 파일을 참고하세요.');
} else {
  console.log('✅ 환경 변수 로드 성공');
}

// 시트 이름 상수
export const SHEET_NAMES = {
  ORDER: 'order',
  LOGISTICS: 'logistics',
  USERS: 'users',
  ARTISTS: 'artists',
  MARKETER_CONTENT: 'marketer_content', // 퍼포먼스 마케터 콘텐츠 저장
} as const;

