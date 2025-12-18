import dotenv from 'dotenv';
import { resolve } from 'path';

// .env 파일 로드 (backend 폴더 기준)
let envPath: string;
if (process.cwd().endsWith('backend')) {
  envPath = resolve(process.cwd(), '.env');
} else {
  envPath = resolve(process.cwd(), 'backend', '.env');
}
dotenv.config({ path: envPath });

// Notion API 환경 변수
const notionApiKey = process.env.NOTION_API_KEY || '';

// 디버깅 로그
console.log('[Notion Config] 환경 변수 로딩...');
console.log('[Notion Config] NOTION_API_KEY:', notionApiKey ? `설정됨 (${notionApiKey.substring(0, 8)}...)` : '없음');

export const notionConfig = {
  apiKey: notionApiKey,
};

// Notion 환경 변수 검증
export const isNotionConfigured = !!notionApiKey;

if (!isNotionConfigured) {
  console.warn('⚠️  Notion API 키가 설정되지 않았습니다.');
  console.warn('   Notion 연동 기능은 사용할 수 없지만, 서버는 정상적으로 시작됩니다.');
  console.warn('   Notion API 키를 설정하려면:');
  console.warn('   1. https://www.notion.so/my-integrations 접속');
  console.warn('   2. "새 통합" 생성');
  console.warn('   3. 통합 이름 입력 및 워크스페이스 선택');
  console.warn('   4. 생성된 "내부 통합 토큰" 복사');
  console.warn('   5. NOTION_API_KEY=secret_xxxxx 형식으로 .env 파일에 추가');
  console.warn('   6. 연동할 Notion 페이지/데이터베이스에 통합을 공유');
} else {
  console.log('✅ Notion API 환경 변수 로드 성공');
}






