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

// Gmail SMTP 환경 변수 (Nodemailer용)
const gmailUser = process.env.GMAIL_USER || '';
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || '';
const gmailFromEmail = process.env.GMAIL_FROM_EMAIL || process.env.GMAIL_USER || '';
const gmailFromName = process.env.GMAIL_FROM_NAME || 'Global Business 셀 | Business Pathfinder';

// Nodemailer용 설정
export const emailConfig = {
  user: gmailUser,
  pass: gmailAppPassword,
  fromEmail: gmailFromEmail,
  fromName: gmailFromName,
};

// 이메일 환경 변수 검증
export const isEmailConfigured = !!(gmailUser && gmailAppPassword);

// 레거시 호환 (기존 코드와의 호환성 유지)
export const gmailConfig = emailConfig;
export const isGmailConfigured = isEmailConfigured;

if (!isEmailConfigured) {
  console.warn('⚠️  Gmail SMTP 환경 변수가 설정되지 않았습니다.');
  console.warn('   이메일 발송 기능은 사용할 수 없지만, 서버는 정상적으로 시작됩니다.');
  console.warn('   환경 변수 상태:');
  console.warn('     - GMAIL_USER:', gmailUser ? '있음' : '없음');
  console.warn('     - GMAIL_APP_PASSWORD:', gmailAppPassword ? '있음' : '없음');
  console.warn('     - GMAIL_FROM_EMAIL:', gmailFromEmail || '(GMAIL_USER 사용)');
  console.warn('     - GMAIL_FROM_NAME:', gmailFromName);
  console.warn('   Gmail 앱 비밀번호를 설정하려면:');
  console.warn('   1. Google 계정 → 보안 → 2단계 인증 활성화');
  console.warn('   2. 앱 비밀번호 생성 → 16자리 비밀번호 복사');
  console.warn('   3. GMAIL_USER=your-email@gmail.com');
  console.warn('   4. GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx');
} else {
  console.log('✅ Gmail SMTP 환경 변수 로드 성공');
}

