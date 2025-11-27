/**
 * QC 작가 알람 이메일 템플릿 서비스
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
   * QC 수정 필요 알람 이메일 템플릿 생성
   */
  generateQCNotificationEmail(data: QCEmailData): { subject: string; htmlBody: string; textBody: string } {
    const { artistName, textQCItems, imageQCItems, items } = data;
    const totalItems = textQCItems + imageQCItems;

    // 제목
    const subject = `[idus글로벌] QC 수정이 필요한 항목이 있습니다.`;

    // 텍스트 본문
    const textBody = this.generateTextBody(artistName, textQCItems, imageQCItems, items);

    // HTML 본문
    const htmlBody = this.generateHtmlBody(artistName, textQCItems, imageQCItems, items);

    return { subject, htmlBody, textBody };
  }

  /**
   * 텍스트 본문 생성
   */
  private generateTextBody(artistName: string, textQCItems: number, imageQCItems: number, items: QCItem[]): string {
    let body = `작가님 안녕하세요.\n\n`;
    body += `아이디어스 글로벌팀 입니다.\n\n`;
    body += `${artistName} 작가님의 작품 중 QC(품질 검수)에서 수정이 필요한 항목이 ${totalItems}개 발견되었습니다.\n\n`;

    if (textQCItems > 0) {
      body += `- 텍스트 QC 수정 필요: ${textQCItems}개\n`;
    }
    if (imageQCItems > 0) {
      body += `- 이미지 QC 수정 필요: ${imageQCItems}개\n`;
    }

    body += `\n수정 필요 항목:\n`;
    items.forEach((item, index) => {
      body += `${index + 1}. [${item.type === 'text' ? '텍스트' : '이미지'}] ${item.productName}\n`;
    });

    body += `\n더 나은 고객 경험을 위해 위 항목들을 빠른 시일 내에 수정해주시기 바랍니다.\n`;
    body += `수정 완료 후 허브에서 다시 확인 부탁드립니다.\n\n`;

    body += `*본 이메일은 QC 수정 필요 항목에 대한 알림의 목적으로, 수정이 필요한 작가님께 발송되는 자동 이메일입니다.\n`;
    body += `수정이 완료되면 자동으로 알림이 중단됩니다.\n\n`;

    body += `감사합니다.\n아이디어스 드림\n\n`;
    body += `---\n`;
    body += `Global Business 셀 | Business Pathfinder\n`;
    body += `global_help@backpac.kr\n`;
    body += `(주) 백패커\n`;
    body += `서울시 서초구 서초대로 398 BNK디지털타워 20층\n`;

    return body;
  }

  /**
   * HTML 본문 생성
   */
  private generateHtmlBody(artistName: string, textQCItems: number, imageQCItems: number, items: QCItem[]): string {
    const totalItems = textQCItems + imageQCItems;

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QC 수정 필요 알림</title>
</head>
<body style="font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #2c3e50; margin-top: 0;">작가님 안녕하세요.</h2>
    <p>아이디어스 글로벌팀 입니다.</p>
  </div>

  <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
    <p style="margin: 0; font-weight: bold; color: #856404;">
      ${artistName} 작가님의 작품 중 QC(품질 검수)에서 수정이 필요한 항목이 <strong style="color: #d9534f;">${totalItems}개</strong> 발견되었습니다.
    </p>
  </div>

  <div style="margin-bottom: 20px;">
    <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">수정 필요 항목 요약</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="padding: 10px; background-color: #e8f5e9; border: 1px solid #c8e6c9; width: 50%;">
          <strong>텍스트 QC</strong>
        </td>
        <td style="padding: 10px; background-color: #e8f5e9; border: 1px solid #c8e6c9; text-align: center;">
          <strong style="color: #d9534f; font-size: 18px;">${textQCItems}개</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px; background-color: #e3f2fd; border: 1px solid #90caf9; width: 50%;">
          <strong>이미지 QC</strong>
        </td>
        <td style="padding: 10px; background-color: #e3f2fd; border: 1px solid #90caf9; text-align: center;">
          <strong style="color: #d9534f; font-size: 18px;">${imageQCItems}개</strong>
        </td>
      </tr>
    </table>
  </div>

  <div style="margin-bottom: 20px;">
    <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">수정 필요 항목 상세</h3>
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px;">
      ${items.map((item, index) => `
        <div style="padding: 10px; margin-bottom: 10px; background-color: white; border-left: 3px solid ${item.type === 'text' ? '#4caf50' : '#2196f3'}; border-radius: 4px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="background-color: ${item.type === 'text' ? '#4caf50' : '#2196f3'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${item.type === 'text' ? '📝 텍스트' : '🖼️ 이미지'}
            </span>
            <span style="font-weight: bold; color: #2c3e50;">${index + 1}. ${item.productName}</span>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <div style="background-color: #e7f3ff; border-left: 4px solid #2196f3; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
    <p style="margin: 0; color: #1565c0;">
      <strong>💡 안내사항</strong><br>
      더 나은 고객 경험을 위해 위 항목들을 빠른 시일 내에 수정해주시기 바랍니다.<br>
      수정 완료 후 허브에서 다시 확인 부탁드립니다.
    </p>
  </div>

  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin-bottom: 20px; font-size: 12px; color: #666;">
    <p style="margin: 0;">
      *본 이메일은 QC 수정 필요 항목에 대한 알림의 목적으로, 수정이 필요한 작가님께 발송되는 자동 이메일입니다.<br>
      수정이 완료되면 자동으로 알림이 중단됩니다.
    </p>
  </div>

  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
    <p style="margin: 0; color: #666;">감사합니다.</p>
    <p style="margin: 5px 0; font-weight: bold; color: #2c3e50;">아이디어스 드림</p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 11px; color: #999; text-align: center;">
    <p style="margin: 5px 0;"><strong>Global Business 셀 | Business Pathfinder</strong></p>
    <p style="margin: 5px 0;">global_help@backpac.kr</p>
    <p style="margin: 5px 0;">(주) 백패커</p>
    <p style="margin: 5px 0;">서울시 서초구 서초대로 398 BNK디지털타워 20층</p>
    <p style="margin: 20px 0 10px 0;">
      <a href="#" style="color: #999; text-decoration: none;">이메일 수신 거부</a>
    </p>
    <p style="margin: 0; font-size: 10px; line-height: 1.4;">
      본 이메일 및 첨부파일은 (주) 백패커의 기밀 정보이며, 법적으로 보호받는 정보입니다.<br>
      무단 공개, 복사, 배포, 사용 또는 기타 행위를 엄격히 금지합니다.<br>
      수신자가 아닌 경우 즉시 삭제하고 발신자에게 전화 또는 이메일로 알려주시기 바랍니다.
    </p>
  </div>
</body>
</html>
    `.trim();
  }
}

export default EmailTemplateService;

