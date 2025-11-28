/**
 * Slack 연동 서비스
 * CS팀 협업을 위한 주문/배송 조회 명령어 지원
 */

import axios from 'axios';

// Slack Block Kit 타입
interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
  elements?: any[];
  accessory?: any;
}

interface SlackMessage {
  response_type?: 'in_channel' | 'ephemeral';
  text?: string;
  blocks?: SlackBlock[];
}

// 국가 이모지 매핑
const countryEmoji: Record<string, string> = {
  JP: '🇯🇵', US: '🇺🇸', SG: '🇸🇬', HK: '🇭🇰', AU: '🇦🇺',
  CA: '🇨🇦', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', IT: '🇮🇹',
  NZ: '🇳🇿', TW: '🇹🇼', MY: '🇲🇾', TH: '🇹🇭', PH: '🇵🇭',
  VN: '🇻🇳', ID: '🇮🇩', NL: '🇳🇱', ES: '🇪🇸', PL: '🇵🇱',
  NO: '🇳🇴', SE: '🇸🇪', DK: '🇩🇰', FI: '🇫🇮', CH: '🇨🇭',
};

const countryName: Record<string, string> = {
  JP: '일본', US: '미국', SG: '싱가포르', HK: '홍콩', AU: '호주',
  CA: '캐나다', GB: '영국', DE: '독일', FR: '프랑스', IT: '이탈리아',
  NZ: '뉴질랜드', TW: '대만', MY: '말레이시아', TH: '태국', PH: '필리핀',
  VN: '베트남', ID: '인도네시아', NL: '네덜란드', ES: '스페인', PL: '폴란드',
  NO: '노르웨이', SE: '스웨덴', DK: '덴마크', FI: '핀란드', CH: '스위스',
};

// 배송 상태 이모지
const statusEmoji: Record<string, string> = {
  'pending': '⏳',
  'processing': '📦',
  'shipped': '🚚',
  'in_transit': '✈️',
  'customs': '🔄',
  'out_for_delivery': '🛵',
  'delivered': '✅',
  'delayed': '⚠️',
  'returned': '↩️',
  'cancelled': '❌',
};

class SlackService {
  private webhookUrl: string;
  private hubBaseUrl: string;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
    this.hubBaseUrl = process.env.HUB_BASE_URL || 'http://localhost:3000';
  }

  /**
   * 도움말 메시지 생성
   */
  buildHelpMessage(): SlackMessage {
    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🌏 Global Business Hub - Slack 명령어',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*📖 사용 가능한 명령어*',
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '`/order [주문번호]`\n주문 상세 정보 조회\n예: `/order P_123456789`',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '`/track [송장번호]`\n배송 추적 현황 조회\n예: `/track KJPEXP789012`',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '`/customer [고객ID]`\n고객 주문 이력 조회\n예: `/customer 12345`',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '`/artist [작가명]`\n작가별 주문 현황\n예: `/artist 달빛공방`',
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '허브 바로가기',
                emoji: true,
              },
              url: this.hubBaseUrl,
              action_id: 'open_hub',
            },
          ],
        },
      ],
    };
  }

  /**
   * 주문 상세 정보 메시지 생성
   */
  buildOrderMessage(order: any): SlackMessage {
    const country = order.country || order.country_code || 'Unknown';
    const emoji = countryEmoji[country] || '🏳️';
    const name = countryName[country] || country;
    const status = this.getStatusText(order.status);
    const statusIcon = statusEmoji[order.status] || '📦';

    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📦 주문 상세 정보',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*주문번호*\n#${order.order_code || order.id}`,
            },
            {
              type: 'mrkdwn',
              text: `*주문일시*\n${this.formatDate(order.order_date || order.created_at)}`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*👤 고객 정보*',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*국가*\n${emoji} ${name}`,
            },
            {
              type: 'mrkdwn',
              text: `*고객 ID*\n${order.user_id || order.customer_id || '-'}`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*🎨 상품 정보*',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*작가*\n${order.artist_name || order.artist || '-'}`,
            },
            {
              type: 'mrkdwn',
              text: `*상품*\n${order.product_name || order.item_name || '-'}`,
            },
            {
              type: 'mrkdwn',
              text: `*수량*\n${order.quantity || 1}개`,
            },
            {
              type: 'mrkdwn',
              text: `*결제금액*\n${this.formatCurrency(order.total_price || order.amount, order.currency)}`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*🚚 배송 현황*',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*상태*\n${statusIcon} ${status}`,
            },
            {
              type: 'mrkdwn',
              text: `*운송사*\n${order.carrier || '-'}`,
            },
            {
              type: 'mrkdwn',
              text: `*송장번호*\n${order.tracking_number || '-'}`,
            },
            {
              type: 'mrkdwn',
              text: `*발송일*\n${order.shipped_at ? this.formatDate(order.shipped_at) : '-'}`,
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '허브에서 상세보기',
                emoji: true,
              },
              url: `${this.hubBaseUrl}/lookup?query=${encodeURIComponent(order.order_code || order.id)}&searchType=order_code`,
              action_id: 'view_in_hub',
            },
            ...(order.tracking_number ? [{
              type: 'button',
              text: {
                type: 'plain_text',
                text: '배송 추적',
                emoji: true,
              },
              url: `${this.hubBaseUrl}/logistics?searchTerm=${order.tracking_number}`,
              action_id: 'track_shipment',
            }] : []),
          ],
        },
      ],
    };
  }

  /**
   * 배송 추적 메시지 생성
   */
  buildTrackingMessage(shipment: any): SlackMessage {
    const country = shipment.country || shipment.country_code || 'Unknown';
    const emoji = countryEmoji[country] || '🏳️';
    const name = countryName[country] || country;
    
    // 배송 단계 표시
    const stages = this.buildTrackingStages(shipment);

    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚚 배송 추적',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*송장번호*\n${shipment.tracking_number}`,
            },
            {
              type: 'mrkdwn',
              text: `*운송사*\n${shipment.carrier || '-'}`,
            },
            {
              type: 'mrkdwn',
              text: `*목적지*\n${emoji} ${name}`,
            },
            {
              type: 'mrkdwn',
              text: `*주문번호*\n#${shipment.order_code || shipment.order_id || '-'}`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*📍 배송 진행 상황*',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: stages,
          },
        },
        ...(shipment.estimated_delivery ? [{
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `📅 예상 배송일: *${this.formatDate(shipment.estimated_delivery)}*`,
            },
          ],
        }] : []),
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '상세 추적',
                emoji: true,
              },
              url: `${this.hubBaseUrl}/logistics?searchTerm=${shipment.tracking_number}`,
              action_id: 'view_tracking',
            },
          ],
        },
      ],
    };
  }

  /**
   * 고객 주문 이력 메시지 생성
   */
  buildCustomerMessage(customer: any, orders: any[]): SlackMessage {
    const country = customer.country || orders[0]?.country || 'Unknown';
    const emoji = countryEmoji[country] || '🏳️';
    const name = countryName[country] || country;
    
    const totalAmount = orders.reduce((sum, o) => sum + (o.total_price || o.amount || 0), 0);
    const currency = orders[0]?.currency || 'KRW';

    // 최근 주문 5건
    const recentOrders = orders.slice(0, 5).map((o, i) => {
      const status = this.getStatusText(o.status);
      const statusIcon = statusEmoji[o.status] || '📦';
      return `${i + 1}. \`#${o.order_code || o.id}\` | ${this.formatDate(o.order_date, true)} | ${statusIcon} ${status}\n    → ${o.product_name || o.item_name || '-'} (${o.artist_name || o.artist || '-'})`;
    }).join('\n\n');

    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '👤 고객 주문 이력',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*고객 ID*\n${customer.user_id || customer.id}`,
            },
            {
              type: 'mrkdwn',
              text: `*국가*\n${emoji} ${name}`,
            },
            {
              type: 'mrkdwn',
              text: `*총 주문*\n${orders.length}건`,
            },
            {
              type: 'mrkdwn',
              text: `*총 구매액*\n${this.formatCurrency(totalAmount, currency)}`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📋 최근 주문 (${Math.min(5, orders.length)}건)*`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: recentOrders || '주문 내역이 없습니다.',
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '전체 이력 보기',
                emoji: true,
              },
              url: `${this.hubBaseUrl}/lookup?query=${encodeURIComponent(customer.user_id || customer.id)}&searchType=user_id`,
              action_id: 'view_customer',
            },
          ],
        },
      ],
    };
  }

  /**
   * 작가 주문 현황 메시지 생성
   */
  buildArtistMessage(artist: any, orders: any[], summary: any): SlackMessage {
    // 상태별 집계
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const inTransit = orders.filter(o => ['shipped', 'in_transit', 'customs'].includes(o.status)).length;
    const pending = orders.filter(o => ['pending', 'processing'].includes(o.status)).length;
    const delayed = orders.filter(o => o.is_delayed || o.status === 'delayed');

    // 최근 주문 5건
    const recentOrders = orders.slice(0, 5).map((o, i) => {
      const country = o.country || o.country_code || '';
      const emoji = countryEmoji[country] || '🏳️';
      const status = this.getStatusText(o.status);
      const statusIcon = o.is_delayed ? '⚠️' : (statusEmoji[o.status] || '📦');
      const delayNote = o.is_delayed ? ` (${o.delay_days || '?'}일 지연)` : '';
      return `${i + 1}. \`#${o.order_code || o.id}\` | ${emoji} | ${statusIcon} ${status}${delayNote}`;
    }).join('\n');

    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎨 작가 주문 현황',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*작가명*\n${artist.name || artist.artist_name}`,
          },
          {
            type: 'mrkdwn',
            text: `*최근 30일 주문*\n${orders.length}건`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*📊 현황 요약*',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*배송완료*\n✅ ${delivered}건`,
          },
          {
            type: 'mrkdwn',
            text: `*배송중*\n🚚 ${inTransit}건`,
          },
          {
            type: 'mrkdwn',
            text: `*준비중*\n⏳ ${pending}건`,
          },
          {
            type: 'mrkdwn',
            text: `*지연*\n⚠️ ${delayed.length}건`,
          },
        ],
      },
    ];

    // 지연 건 경고
    if (delayed.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*⚠️ 주의 필요*\n미입고 지연: ${delayed.length}건`,
        },
      });
    }

    blocks.push(
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📋 최근 주문 ${Math.min(5, orders.length)}건*`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: recentOrders || '주문 내역이 없습니다.',
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '작가 상세',
              emoji: true,
            },
            url: `${this.hubBaseUrl}/lookup?query=${encodeURIComponent(artist.name || artist.artist_name)}&searchType=artist_name`,
            action_id: 'view_artist',
          },
          ...(delayed.length > 0 ? [{
            type: 'button',
            text: {
              type: 'plain_text',
              text: '지연 건 확인',
              emoji: true,
            },
            url: `${this.hubBaseUrl}/unreceived?searchTerm=${encodeURIComponent(artist.name || artist.artist_name)}`,
            action_id: 'view_delayed',
            style: 'danger',
          }] : []),
        ],
      }
    );

    return {
      response_type: 'ephemeral',
      blocks,
    };
  }

  /**
   * 에러 메시지 생성
   */
  buildErrorMessage(type: string, query: string, suggestion?: string): SlackMessage {
    const typeNames: Record<string, string> = {
      order: '주문',
      tracking: '배송',
      customer: '고객',
      artist: '작가',
    };

    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `❌ *${typeNames[type] || '데이터'}을(를) 찾을 수 없습니다*`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `입력하신 값: \`${query}\``,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: suggestion || '• 입력값이 정확한지 확인해주세요\n• 최근 90일 이내 데이터만 조회 가능합니다',
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '허브에서 직접 검색',
                emoji: true,
              },
              url: `${this.hubBaseUrl}/lookup?query=${encodeURIComponent(query)}&searchType=order_code`,
              action_id: 'search_in_hub',
            },
          ],
        },
      ],
    };
  }

  /**
   * 배송 단계 텍스트 생성
   */
  private buildTrackingStages(shipment: any): string {
    const stages = [
      { key: 'received', label: '접수완료', date: shipment.received_at },
      { key: 'shipped', label: '발송', date: shipment.shipped_at },
      { key: 'departed', label: '출국', date: shipment.departed_at },
      { key: 'arrived', label: '도착국입항', date: shipment.arrived_at },
      { key: 'customs', label: '통관중', date: shipment.customs_at },
      { key: 'out_for_delivery', label: '배송중', date: shipment.out_for_delivery_at },
      { key: 'delivered', label: '배달완료', date: shipment.delivered_at },
    ];

    const currentStatus = shipment.status || 'pending';
    const statusOrder = ['pending', 'received', 'shipped', 'departed', 'arrived', 'customs', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return stages.map((stage, i) => {
      const stageIndex = statusOrder.indexOf(stage.key);
      let icon = '⬜';
      let suffix = '';
      
      if (stageIndex < currentIndex || stage.date) {
        icon = '✅';
        if (stage.date) {
          suffix = ` ${this.formatDate(stage.date, true)}`;
        }
      } else if (stageIndex === currentIndex) {
        icon = '🔄';
        suffix = ' ← 현재';
      }

      return `${icon} ${stage.label}${suffix}`;
    }).join('\n');
  }

  /**
   * 상태 텍스트 변환
   */
  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: '대기중',
      processing: '처리중',
      shipped: '발송완료',
      in_transit: '배송중',
      customs: '통관중',
      out_for_delivery: '배달중',
      delivered: '배송완료',
      delayed: '지연',
      returned: '반송',
      cancelled: '취소',
    };
    return statusMap[status] || status || '-';
  }

  /**
   * 날짜 포맷
   */
  private formatDate(dateStr: string, short: boolean = false): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (short) {
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  }

  /**
   * 통화 포맷
   */
  private formatCurrency(amount: number, currency: string = 'KRW'): string {
    if (!amount) return '-';
    const symbols: Record<string, string> = {
      KRW: '₩', USD: '$', JPY: '¥', EUR: '€', GBP: '£',
      SGD: 'S$', HKD: 'HK$', AUD: 'A$', CAD: 'C$',
    };
    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toLocaleString()}`;
  }

  /**
   * Webhook으로 메시지 전송
   */
  async sendWebhook(message: SlackMessage, webhookUrl?: string): Promise<boolean> {
    const url = webhookUrl || this.webhookUrl;
    if (!url) {
      console.error('[Slack] Webhook URL not configured');
      return false;
    }

    try {
      await axios.post(url, message);
      return true;
    } catch (error) {
      console.error('[Slack] Webhook send error:', error);
      return false;
    }
  }
}

export const slackService = new SlackService();
export default slackService;

