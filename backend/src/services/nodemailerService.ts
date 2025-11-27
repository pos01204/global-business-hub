import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

interface EmailConfig {
  user: string;
  pass: string; // Gmail 앱 비밀번호
  fromEmail: string;
  fromName: string;
}

class NodemailerService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private fromName: string;
  private isConfigured: boolean;

  constructor(config: EmailConfig) {
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
    this.isConfigured = !!(config.user && config.pass);

    if (this.isConfigured) {
      try {
        // Gmail SMTP 설정
        const smtpOptions: SMTPTransport.Options = {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: config.user,
            pass: config.pass,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        };
        
        this.transporter = nodemailer.createTransport(smtpOptions);
        console.log('[Email] Nodemailer 서비스 초기화 완료 (Gmail SMTP)');
      } catch (error) {
        console.error('[Email] Nodemailer 서비스 초기화 실패:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('[Email] Gmail 환경 변수가 설정되지 않아 이메일 발송 기능이 비활성화됩니다.');
    }
  }

  /**
   * 이메일 발송 (타임아웃 적용)
   */
  async sendEmail(to: string, subject: string, htmlBody: string, textBody?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`[Email] sendEmail 시작: ${to}`);
    
    if (!this.isConfigured || !this.transporter) {
      console.log('[Email] 서비스 미설정');
      return {
        success: false,
        error: 'Email 서비스가 설정되지 않았습니다.',
      };
    }

    try {
      // 이메일 주소 유효성 검사
      if (!to || !to.includes('@')) {
        console.log('[Email] 유효하지 않은 이메일 주소');
        return {
          success: false,
          error: '유효하지 않은 이메일 주소입니다.',
        };
      }

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: to,
        subject: subject,
        text: textBody || '',
        html: htmlBody,
      };

      console.log(`[Email] sendMail 호출 중...`);
      
      // 타임아웃 Promise와 함께 실행
      const sendPromise = this.transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('이메일 발송 타임아웃 (20초)')), 20000);
      });

      const info = await Promise.race([sendPromise, timeoutPromise]) as { messageId: string };
      const messageId = info.messageId;

      console.log(`[Email] ✅ 이메일 발송 성공: ${to} (Message ID: ${messageId})`);

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      console.error(`[Email] ❌ 이메일 발송 실패: ${error.message}`);
      return {
        success: false,
        error: error.message || '이메일 발송 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 연결 상태 확인
   */
  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.isConfigured || !this.transporter) {
      return {
        connected: false,
        error: 'Email 서비스가 설정되지 않았습니다.',
      };
    }

    try {
      await this.transporter.verify();
      return { connected: true };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message || 'Email 연결 확인 실패',
      };
    }
  }
}

export default NodemailerService;
