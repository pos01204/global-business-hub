import { Resend } from 'resend';

interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

interface Attachment {
  filename: string;
  content: string; // UTF-8 string content
  contentType?: string;
}

class ResendService {
  private resend: Resend | null = null;
  private fromEmail: string;
  private fromName: string;
  private isConfigured: boolean;

  constructor(config: EmailConfig) {
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
    this.isConfigured = !!config.apiKey;

    if (this.isConfigured) {
      try {
        this.resend = new Resend(config.apiKey);
        console.log('[Resend] 이메일 서비스 초기화 완료');
      } catch (error) {
        console.error('[Resend] 이메일 서비스 초기화 실패:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('[Resend] API 키가 설정되지 않아 이메일 발송 기능이 비활성화됩니다.');
    }
  }

  /**
   * 이메일 발송 (첨부파일 지원)
   */
  async sendEmail(
    to: string, 
    subject: string, 
    htmlBody: string, 
    textBody?: string,
    attachments?: Attachment[]
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`[Resend] sendEmail 시작: ${to}`);
    
    if (!this.isConfigured || !this.resend) {
      console.log('[Resend] 서비스 미설정');
      return {
        success: false,
        error: 'Resend 서비스가 설정되지 않았습니다.',
      };
    }

    try {
      // 이메일 주소 유효성 검사
      if (!to || !to.includes('@')) {
        console.log('[Resend] 유효하지 않은 이메일 주소');
        return {
          success: false,
          error: '유효하지 않은 이메일 주소입니다.',
        };
      }

      console.log(`[Resend] 이메일 발송 중...${attachments?.length ? ` (첨부파일 ${attachments.length}개)` : ''}`);
      
      // Resend 첨부파일 형식으로 변환
      const resendAttachments = attachments?.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'utf-8'),
      }));

      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject: subject,
        html: htmlBody,
        text: textBody || '',
        attachments: resendAttachments,
      });

      if (error) {
        console.error(`[Resend] ❌ 이메일 발송 실패:`, error);
        return {
          success: false,
          error: error.message || '이메일 발송 실패',
        };
      }

      const messageId = data?.id || '';
      console.log(`[Resend] ✅ 이메일 발송 성공: ${to} (ID: ${messageId})`);

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      console.error(`[Resend] ❌ 이메일 발송 오류: ${error.message}`);
      return {
        success: false,
        error: error.message || '이메일 발송 중 오류가 발생했습니다.',
      };
    }
  }
}

export default ResendService;
