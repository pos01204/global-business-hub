/**
 * QC 작가 알람 이메일 템플릿 서비스
 * 간소화된 버전 - 안정성 우선
 */

interface QCItem {
  id: string;
  type: 'text' | 'image';
  productName: string;
}

interface QCEmailData {
  artistName: string;
  textQCItems: number;
  imageQCItems: number;
  items: QCItem[];
}

class EmailTemplateService {
  /**
   * QC 수정 필요 알람 이메일 템플릿 생성 (간소화 버전)
   */
  generateQCNotificationEmail(data: QCEmailData): { subject: string; htmlBody: string; textBody: string } {
    console.log('[EmailTemplate] 템플릿 생성 시작:', JSON.stringify({
      artistName: data.artistName,
      textQCItems: data.textQCItems,
      imageQCItems: data.imageQCItems,
      itemCount: data.items?.length || 0
    }));

    try {
      const { artistName, textQCItems, imageQCItems, items } = data;
      const totalItems = textQCItems + imageQCItems;

      // 제목
      const subject = `[idus글로벌] QC 수정이 필요한 항목이 있습니다.`;

      // 간단한 텍스트 본문
      const textBody = this.generateSimpleTextBody(artistName, textQCItems, imageQCItems, items || []);

      // 간단한 HTML 본문
      const htmlBody = this.generateSimpleHtmlBody(artistName, textQCItems, imageQCItems, items || []);

      console.log('[EmailTemplate] 템플릿 생성 완료');
      return { subject, htmlBody, textBody };
    } catch (error: any) {
      console.error('[EmailTemplate] 템플릿 생성 오류:', error.message);
      // 오류 시 기본 템플릿 반환
      return {
        subject: '[idus글로벌] QC 수정이 필요한 항목이 있습니다.',
        textBody: `${data.artistName} 작가님, QC 수정이 필요한 항목이 있습니다. 허브에서 확인해주세요.`,
        htmlBody: `<p>${data.artistName} 작가님, QC 수정이 필요한 항목이 있습니다. 허브에서 확인해주세요.</p>`,
      };
    }
  }

  /**
   * 간단한 텍스트 본문 생성
   */
  private generateSimpleTextBody(artistName: string, textQCItems: number, imageQCItems: number, items: QCItem[]): string {
    const totalItems = textQCItems + imageQCItems;
    
    let body = `작가님 안녕하세요.\n\n`;
    body += `아이디어스 글로벌팀 입니다.\n\n`;
    body += `${artistName} 작가님의 작품 중 QC(품질 검수)에서 수정이 필요한 항목이 ${totalItems}개 발견되었습니다.\n\n`;
    body += `- 텍스트 QC: ${textQCItems}개\n`;
    body += `- 이미지 QC: ${imageQCItems}개\n\n`;

    if (items && items.length > 0) {
      body += `수정 필요 항목:\n`;
      const maxItems = Math.min(items.length, 10); // 최대 10개만 표시
      for (let i = 0; i < maxItems; i++) {
        const item = items[i];
        body += `${i + 1}. [${item.type === 'text' ? '텍스트' : '이미지'}] ${item.productName || '제품명 없음'}\n`;
      }
      if (items.length > 10) {
        body += `... 외 ${items.length - 10}개\n`;
      }
      body += `\n`;
    }

    body += `더 나은 고객 경험을 위해 위 항목들을 빠른 시일 내에 수정해주시기 바랍니다.\n\n`;
    body += `감사합니다.\n`;
    body += `아이디어스 글로벌팀 드림\n\n`;
    body += `---\n`;
    body += `Global Business 셀 | global_help@backpac.kr\n`;
    body += `(주) 백패커 | 서울시 서초구 서초대로 398 BNK디지털타워 20층\n`;

    return body;
  }

  /**
   * 간단한 HTML 본문 생성
   */
  private generateSimpleHtmlBody(artistName: string, textQCItems: number, imageQCItems: number, items: QCItem[]): string {
    const totalItems = textQCItems + imageQCItems;
    
    let itemsHtml = '';
    if (items && items.length > 0) {
      const maxItems = Math.min(items.length, 10);
      let itemsList = '';
      for (let i = 0; i < maxItems; i++) {
        const item = items[i];
        const typeLabel = item.type === 'text' ? '📝 텍스트' : '🖼️ 이미지';
        itemsList += `<li>${typeLabel} - ${item.productName || '제품명 없음'}</li>`;
      }
      if (items.length > 10) {
        itemsList += `<li>... 외 ${items.length - 10}개</li>`;
      }
      itemsHtml = `<h3>수정 필요 항목:</h3><ul>${itemsList}</ul>`;
    }

    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2>작가님 안녕하세요.</h2>
  <p>아이디어스 글로벌팀 입니다.</p>
  
  <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>${artistName}</strong> 작가님의 작품 중 QC(품질 검수)에서 수정이 필요한 항목이 <strong style="color: #d9534f;">${totalItems}개</strong> 발견되었습니다.</p>
  </div>
  
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr>
      <td style="padding: 10px; background-color: #e8f5e9; border: 1px solid #c8e6c9;">텍스트 QC</td>
      <td style="padding: 10px; background-color: #e8f5e9; border: 1px solid #c8e6c9; text-align: center;"><strong>${textQCItems}개</strong></td>
    </tr>
    <tr>
      <td style="padding: 10px; background-color: #e3f2fd; border: 1px solid #90caf9;">이미지 QC</td>
      <td style="padding: 10px; background-color: #e3f2fd; border: 1px solid #90caf9; text-align: center;"><strong>${imageQCItems}개</strong></td>
    </tr>
  </table>
  
  ${itemsHtml}
  
  <p>더 나은 고객 경험을 위해 위 항목들을 빠른 시일 내에 수정해주시기 바랍니다.</p>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
  
  <p style="margin: 0;">감사합니다.<br><strong>아이디어스 글로벌팀 드림</strong></p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
    <p>Global Business 셀 | global_help@backpac.kr<br>
    (주) 백패커 | 서울시 서초구 서초대로 398 BNK디지털타워 20층</p>
  </div>
</body>
</html>`.trim();
  }
}

export default EmailTemplateService;
