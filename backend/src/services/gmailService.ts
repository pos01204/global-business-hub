import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

interface GmailConfig {
  clientEmail: string;
  privateKey: string;
  fromEmail: string;
  fromName: string;
}

interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

class GmailService {
  private auth: JWT | null = null;
  private gmail: any = null;
  private fromEmail: string;
  private fromName: string;
  private isConfigured: boolean;

  constructor(config: GmailConfig) {
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
    this.isConfigured = !!(config.clientEmail && config.privateKey && config.fromEmail);

    if (this.isConfigured) {
      try {
        this.auth = new JWT({
          email: config.clientEmail,
          key: config.privateKey.replace(/\\n/g, '\n'),
          scopes: [
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.compose',
          ],
        });

        this.gmail = google.gmail({ version: 'v1', auth: this.auth });
        console.log('[Gmail] Gmail 서비스 초기화 완료');
      } catch (error) {
        console.error('[Gmail] Gmail 서비스 초기화 실패:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('[Gmail] Gmail 환경 변수가 설정되지 않아 이메일 발송 기능이 비활성화됩니다.');
    }
  }

  /**
   * 이메일 발송
   */
  async sendEmail(to: string, subject: string, htmlBody: string, textBody?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured || !this.gmail) {
      return {
        success: false,
        error: 'Gmail 서비스가 설정되지 않았습니다.',
      };
    }

    try {
      // 이메일 주소 유효성 검사
      if (!to || !to.includes('@')) {
        return {
          success: false,
          error: '유효하지 않은 이메일 주소입니다.',
        };
      }

      // 이메일 본문 생성
      const emailBody = this.createEmailBody(to, subject, htmlBody, textBody);

      // Base64 인코딩
      const encodedMessage = Buffer.from(emailBody)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Gmail API로 이메일 발송
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      const messageId = response.data.id;

      console.log(`[Gmail] 이메일 발송 성공: ${to} (Message ID: ${messageId})`);

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      console.error('[Gmail] 이메일 발송 실패:', error);
      return {
        success: false,
        error: error.message || '이메일 발송 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 이메일 본문 생성 (RFC 2822 형식)
   */
  private createEmailBody(to: string, subject: string, htmlBody: string, textBody?: string): string {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let email = '';
    email += `To: ${to}\r\n`;
    email += `From: ${this.fromName} <${this.fromEmail}>\r\n`;
    email += `Subject: ${subject}\r\n`;
    email += `MIME-Version: 1.0\r\n`;
    email += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`;
    email += `\r\n`;

    // 텍스트 본문
    if (textBody) {
      email += `--${boundary}\r\n`;
      email += `Content-Type: text/plain; charset=UTF-8\r\n`;
      email += `Content-Transfer-Encoding: base64\r\n`;
      email += `\r\n`;
      email += Buffer.from(textBody, 'utf-8').toString('base64') + '\r\n';
    }

    // HTML 본문
    email += `--${boundary}\r\n`;
    email += `Content-Type: text/html; charset=UTF-8\r\n`;
    email += `Content-Transfer-Encoding: base64\r\n`;
    email += `\r\n`;
    email += Buffer.from(htmlBody, 'utf-8').toString('base64') + '\r\n';

    email += `--${boundary}--\r\n`;

    return email;
  }

  /**
   * 연결 상태 확인
   */
  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.isConfigured || !this.gmail) {
      return {
        connected: false,
        error: 'Gmail 서비스가 설정되지 않았습니다.',
      };
    }

    try {
      await this.gmail.users.getProfile({ userId: 'me' });
      return { connected: true };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message || 'Gmail 연결 확인 실패',
      };
    }
  }
}

export default GmailService;

