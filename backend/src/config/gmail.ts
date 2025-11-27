import dotenv from 'dotenv';
import { resolve } from 'path';

// .env 파일 로드
let envPath: string;
if (process.cwd().endsWith('backend')) {
  envPath = resolve(process.cwd(), '.env');
} else {
  envPath = resolve(process.cwd(), 'backend', '.env');
}
dotenv.config({ path: envPath });

// Gmail 환경 변수
const gmailClientEmail = process.env.GMAIL_CLIENT_EMAIL || '';
const gmailPrivateKey = process.env.GMAIL_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';
const gmailFromEmail = process.env.GMAIL_FROM_EMAIL || 'global_help@backpac.kr';
const gmailFromName = process.env.GMAIL_FROM_NAME || 'Global Business 셀 | Business Pathfinder';

export const gmailConfig = {
  clientEmail: gmailClientEmail,
  privateKey: gmailPrivateKey,
  fromEmail: gmailFromEmail,
  fromName: gmailFromName,
};

// Gmail 환경 변수 검증
export const isGmailConfigured = !!(gmailClientEmail && gmailPrivateKey);

if (!isGmailConfigured) {
  console.warn('⚠️  Gmail API 환경 변수가 설정되지 않았습니다.');
  console.warn('   Gmail 이메일 발송 기능은 사용할 수 없지만, 서버는 정상적으로 시작됩니다.');
  console.warn('   환경 변수 상태:');
  console.warn('     - GMAIL_CLIENT_EMAIL:', gmailClientEmail ? '있음' : '없음');
  console.warn('     - GMAIL_PRIVATE_KEY:', gmailPrivateKey ? '있음' : '없음');
  console.warn('     - GMAIL_FROM_EMAIL:', gmailFromEmail);
  console.warn('     - GMAIL_FROM_NAME:', gmailFromName);
  console.warn('   Gmail 기능을 사용하려면 환경 변수를 설정하세요.');
} else {
  console.log('✅ Gmail 환경 변수 로드 성공');
}

