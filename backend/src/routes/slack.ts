/**
 * Slack 연동 라우터
 * CS팀 협업을 위한 Slash Commands 처리
 * 
 * 명령어:
 * - /order [주문번호] : 주문 상세 조회
 * - /track [송장번호] : 배송 추적
 * - /customer [고객ID] : 고객 주문 이력
 * - /artist [작가명] : 작가 주문 현황
 * - /gb : 도움말
 */

import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { slackService } from '../services/slackService';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig } from '../config/sheets';

// Request 타입 확장 (rawBody 지원)
interface SlackRequest extends Request {
  rawBody?: string;
}

// Google Sheets 서비스 초기화
const sheetsService = new GoogleSheetsService(sheetsConfig);

const router = express.Router();

// 시트 이름 상수
const SHEET_NAMES = {
  ORDERS: '주문내역',
  LOGISTICS: '물류관리',
  UNRECEIVED: '미입고현황',
};

// 허용된 채널 목록 (채널명 또는 채널 ID)
const ALLOWED_CHANNELS = [
  '_cell_global-business',  // 채널명 (# 제외)
  // 채널 ID도 추가 가능 (예: 'C0123456789')
];

/**
 * 채널 접근 권한 확인
 */
function isAllowedChannel(channelName: string, channelId: string): boolean {
  // 환경변수로 제한 비활성화 가능
  if (process.env.SLACK_ALLOW_ALL_CHANNELS === 'true') {
    return true;
  }
  
  // 채널명 또는 ID가 허용 목록에 있는지 확인
  return ALLOWED_CHANNELS.some(allowed => 
    allowed === channelName || 
    allowed === channelId ||
    channelName?.includes(allowed)
  );
}

/**
 * 채널 제한 에러 메시지
 */
function buildChannelRestrictedMessage(): any {
  return {
    response_type: 'ephemeral',
    text: '⚠️ 이 명령어는 `#_cell_global-business` 채널에서만 사용할 수 있습니다.',
  };
}

/**
 * Slack 요청 서명 검증
 */
function verifySlackSignature(req: SlackRequest): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    console.warn('[Slack] Signing secret not configured, skipping verification');
    return true; // 개발 환경에서는 스킵
  }

  const timestamp = req.headers['x-slack-request-timestamp'] as string;
  const signature = req.headers['x-slack-signature'] as string;

  if (!timestamp || !signature) {
    return false;
  }

  // 5분 이상 된 요청 거부
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    return false;
  }

  const sigBaseString = `v0:${timestamp}:${req.rawBody || JSON.stringify(req.body)}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBaseString)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  );
}

/**
 * /gb 명령어 - 도움말
 */
router.post('/commands/gb', async (req: Request, res: Response) => {
  try {
    // 서명 검증
    if (!verifySlackSignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { text, channel_name, channel_id } = req.body;
    
    // 채널 제한 확인
    if (!isAllowedChannel(channel_name, channel_id)) {
      return res.json(buildChannelRestrictedMessage());
    }
    const args = text?.trim().split(/\s+/) || [];
    const subCommand = args[0]?.toLowerCase();

    // 서브 커맨드 처리
    if (subCommand === 'help' || !subCommand) {
      return res.json(slackService.buildHelpMessage());
    }

    // 빠른 현황 (추후 구현)
    if (subCommand === 'status') {
      // TODO: 오늘 현황 요약
      return res.json(slackService.buildHelpMessage());
    }

    return res.json(slackService.buildHelpMessage());
  } catch (error) {
    console.error('[Slack] /gb command error:', error);
    return res.json({
      response_type: 'ephemeral',
      text: '❌ 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    });
  }
});

/**
 * /order 명령어 - 주문 상세 조회
 */
router.post('/commands/order', async (req: Request, res: Response) => {
  try {
    if (!verifySlackSignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { text, channel_name, channel_id } = req.body;
    
    // 채널 제한 확인
    if (!isAllowedChannel(channel_name, channel_id)) {
      return res.json(buildChannelRestrictedMessage());
    }
    
    const orderCode = text?.trim();

    if (!orderCode) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ 주문번호를 입력해주세요.\n사용법: `/order 123456`',
      });
    }

    // 즉시 응답 (Slack 3초 타임아웃 대응)
    res.json({
      response_type: 'ephemeral',
      text: `🔍 주문번호 \`${orderCode}\` 조회 중...`,
    });

    // 비동기로 데이터 조회 후 응답 URL로 전송
    const responseUrl = req.body.response_url;
    
    try {
      // 주문 데이터 조회
      const ordersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDERS);
      const order = ordersData.find((row: any) => 
        row.order_code === orderCode || 
        row.id === orderCode ||
        String(row.order_code) === orderCode
      );

      if (!order) {
        // 물류 데이터에서도 검색
        const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS);
        const shipment = logisticsData.find((row: any) =>
          row.order_code === orderCode ||
          row.order_id === orderCode
        );

        if (shipment) {
          // 물류 데이터로 주문 정보 구성
          await sendDelayedResponse(responseUrl, slackService.buildOrderMessage({
            ...shipment,
            order_code: shipment.order_code || shipment.order_id,
          }));
        } else {
          await sendDelayedResponse(responseUrl, 
            slackService.buildErrorMessage('order', orderCode)
          );
        }
        return;
      }

      // 주문 정보에 배송 정보 추가
      const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS);
      const shipment = logisticsData.find((row: any) =>
        row.order_code === order.order_code ||
        row.order_id === order.order_code
      );

      const enrichedOrder = {
        ...order,
        ...shipment,
        order_code: order.order_code || order.id,
      };

      await sendDelayedResponse(responseUrl, slackService.buildOrderMessage(enrichedOrder));
    } catch (error) {
      console.error('[Slack] Order lookup error:', error);
      await sendDelayedResponse(responseUrl, {
        response_type: 'ephemeral',
        text: '❌ 주문 조회 중 오류가 발생했습니다.',
      });
    }
  } catch (error) {
    console.error('[Slack] /order command error:', error);
    return res.json({
      response_type: 'ephemeral',
      text: '❌ 처리 중 오류가 발생했습니다.',
    });
  }
});

/**
 * /track 명령어 - 배송 추적
 */
router.post('/commands/track', async (req: Request, res: Response) => {
  try {
    if (!verifySlackSignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { text, channel_name, channel_id } = req.body;
    
    // 채널 제한 확인
    if (!isAllowedChannel(channel_name, channel_id)) {
      return res.json(buildChannelRestrictedMessage());
    }
    
    const trackingNumber = text?.trim();

    if (!trackingNumber) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ 송장번호를 입력해주세요.\n사용법: `/track KJPEXP789012`',
      });
    }

    res.json({
      response_type: 'ephemeral',
      text: `🔍 송장번호 \`${trackingNumber}\` 추적 중...`,
    });

    const responseUrl = req.body.response_url;

    try {
      const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS);
      const shipment = logisticsData.find((row: any) =>
        row.tracking_number === trackingNumber ||
        row.tracking_number?.includes(trackingNumber)
      );

      if (!shipment) {
        await sendDelayedResponse(responseUrl,
          slackService.buildErrorMessage('tracking', trackingNumber,
            '• 송장번호가 정확한지 확인해주세요\n• 아직 송장이 등록되지 않았을 수 있습니다')
        );
        return;
      }

      await sendDelayedResponse(responseUrl, slackService.buildTrackingMessage(shipment));
    } catch (error) {
      console.error('[Slack] Track lookup error:', error);
      await sendDelayedResponse(responseUrl, {
        response_type: 'ephemeral',
        text: '❌ 배송 추적 중 오류가 발생했습니다.',
      });
    }
  } catch (error) {
    console.error('[Slack] /track command error:', error);
    return res.json({
      response_type: 'ephemeral',
      text: '❌ 처리 중 오류가 발생했습니다.',
    });
  }
});

/**
 * /customer 명령어 - 고객 주문 이력
 */
router.post('/commands/customer', async (req: Request, res: Response) => {
  try {
    if (!verifySlackSignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { text, channel_name, channel_id } = req.body;
    
    // 채널 제한 확인
    if (!isAllowedChannel(channel_name, channel_id)) {
      return res.json(buildChannelRestrictedMessage());
    }
    
    const customerId = text?.trim();

    if (!customerId) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ 고객 ID를 입력해주세요.\n사용법: `/customer user_12345`',
      });
    }

    res.json({
      response_type: 'ephemeral',
      text: `🔍 고객 \`${customerId}\` 조회 중...`,
    });

    const responseUrl = req.body.response_url;

    try {
      const ordersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDERS);
      const customerOrders = ordersData.filter((row: any) =>
        row.user_id === customerId ||
        row.customer_id === customerId ||
        row.user_id?.includes(customerId)
      );

      if (customerOrders.length === 0) {
        await sendDelayedResponse(responseUrl,
          slackService.buildErrorMessage('customer', customerId,
            '• 고객 ID가 정확한지 확인해주세요\n• user_ 접두어를 포함해서 입력해주세요')
        );
        return;
      }

      // 최신순 정렬
      customerOrders.sort((a: any, b: any) => {
        const dateA = new Date(a.order_date || a.created_at || 0);
        const dateB = new Date(b.order_date || b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      });

      const customer = {
        user_id: customerId,
        country: customerOrders[0]?.country || customerOrders[0]?.country_code,
      };

      await sendDelayedResponse(responseUrl, 
        slackService.buildCustomerMessage(customer, customerOrders)
      );
    } catch (error) {
      console.error('[Slack] Customer lookup error:', error);
      await sendDelayedResponse(responseUrl, {
        response_type: 'ephemeral',
        text: '❌ 고객 조회 중 오류가 발생했습니다.',
      });
    }
  } catch (error) {
    console.error('[Slack] /customer command error:', error);
    return res.json({
      response_type: 'ephemeral',
      text: '❌ 처리 중 오류가 발생했습니다.',
    });
  }
});

/**
 * /artist 명령어 - 작가 주문 현황
 */
router.post('/commands/artist', async (req: Request, res: Response) => {
  try {
    if (!verifySlackSignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { text, channel_name, channel_id } = req.body;
    
    // 채널 제한 확인
    if (!isAllowedChannel(channel_name, channel_id)) {
      return res.json(buildChannelRestrictedMessage());
    }
    
    const artistName = text?.trim();

    if (!artistName) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ 작가명을 입력해주세요.\n사용법: `/artist 달빛공방`',
      });
    }

    res.json({
      response_type: 'ephemeral',
      text: `🔍 작가 \`${artistName}\` 조회 중...`,
    });

    const responseUrl = req.body.response_url;

    try {
      // 주문 데이터에서 작가 검색
      const ordersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDERS);
      const artistOrders = ordersData.filter((row: any) =>
        row.artist_name === artistName ||
        row.artist === artistName ||
        row.artist_name?.includes(artistName) ||
        row.artist?.includes(artistName)
      );

      // 미입고 데이터에서 지연 건 확인
      const unreceivedData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.UNRECEIVED);
      const delayedOrders = unreceivedData.filter((row: any) =>
        row.artist_name === artistName ||
        row.artist === artistName ||
        row.artist_name?.includes(artistName)
      );

      if (artistOrders.length === 0 && delayedOrders.length === 0) {
        await sendDelayedResponse(responseUrl,
          slackService.buildErrorMessage('artist', artistName,
            '• 작가명이 정확한지 확인해주세요\n• 최근 주문이 없는 작가일 수 있습니다')
        );
        return;
      }

      // 지연 정보 병합
      const enrichedOrders = artistOrders.map((order: any) => {
        const delayed = delayedOrders.find((d: any) =>
          d.order_code === order.order_code ||
          d.order_id === order.order_code
        );
        return {
          ...order,
          is_delayed: !!delayed,
          delay_days: delayed?.delay_days,
        };
      });

      // 최신순 정렬
      enrichedOrders.sort((a: any, b: any) => {
        const dateA = new Date(a.order_date || a.created_at || 0);
        const dateB = new Date(b.order_date || b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      });

      const artist = {
        name: artistName,
      };

      const summary = {
        total: artistOrders.length,
        delayed: delayedOrders.length,
      };

      await sendDelayedResponse(responseUrl,
        slackService.buildArtistMessage(artist, enrichedOrders, summary)
      );
    } catch (error) {
      console.error('[Slack] Artist lookup error:', error);
      await sendDelayedResponse(responseUrl, {
        response_type: 'ephemeral',
        text: '❌ 작가 조회 중 오류가 발생했습니다.',
      });
    }
  } catch (error) {
    console.error('[Slack] /artist command error:', error);
    return res.json({
      response_type: 'ephemeral',
      text: '❌ 처리 중 오류가 발생했습니다.',
    });
  }
});

/**
 * Interactive 버튼 핸들러
 */
router.post('/interactions', async (req: Request, res: Response) => {
  try {
    if (!verifySlackSignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = JSON.parse(req.body.payload || '{}');
    const { type, actions } = payload;

    if (type === 'block_actions' && actions?.length > 0) {
      const action = actions[0];
      
      // 버튼 액션 처리 (현재는 URL 버튼만 사용하므로 별도 처리 불필요)
      console.log('[Slack] Button action:', action.action_id);
    }

    // 200 OK 응답 (버튼 클릭 확인)
    return res.status(200).send();
  } catch (error) {
    console.error('[Slack] Interaction error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 지연 응답 전송 (response_url 사용)
 */
async function sendDelayedResponse(responseUrl: string, message: any): Promise<void> {
  if (!responseUrl) {
    console.warn('[Slack] No response URL provided');
    return;
  }

  try {
    const axios = require('axios');
    await axios.post(responseUrl, {
      ...message,
      replace_original: true,
    });
  } catch (error) {
    console.error('[Slack] Delayed response error:', error);
  }
}

export default router;

