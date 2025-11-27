import dotenv from 'dotenv';
import { resolve } from 'path';

// .env 파일 로드 (로컬 개발용)
let envPath: string;
if (process.cwd().endsWith('backend')) {
  envPath = resolve(process.cwd(), '.env');
} else {
  envPath = resolve(process.cwd(), 'backend', '.env');
}
dotenv.config({ path: envPath });

// Resend 환경 변수
const resendApiKey = process.env.RESEND_API_KEY || '';
const emailFromAddress = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev'; // Resend 기본 발신 주소
const emailFromName = process.env.EMAIL_FROM_NAME || 'Global Business 셀';

// Resend 설정
export const resendConfig = {
  apiKey: resendApiKey,
  fromEmail: emailFromAddress,
  fromName: emailFromName,
};

// 이메일 서비스 사용 가능 여부
export const isEmailConfigured = !!resendApiKey;

// 디버깅 로그
console.log('[Email Config] Resend 환경 변수 로딩...');
console.log('[Email Config] RESEND_API_KEY:', resendApiKey ? `설정됨 (${resendApiKey.substring(0, 8)}...)` : '없음');
console.log('[Email Config] EMAIL_FROM_ADDRESS:', emailFromAddress);
console.log('[Email Config] EMAIL_FROM_NAME:', emailFromName);

if (!isEmailConfigured) {
  console.warn('⚠️  Resend API 키가 설정되지 않았습니다.');
  console.warn('   이메일 발송 기능은 사용할 수 없습니다.');
  console.warn('   설정 방법:');
  console.warn('   1. https://resend.com 가입');
  console.warn('   2. API Key 생성');
  console.warn('   3. RESEND_API_KEY 환경 변수 설정');
} else {
  console.log('✅ Resend API 키 로드 성공');
}

