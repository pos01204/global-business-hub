/**
 * Slack 연동 라우터
 * CS팀 협업을 위한 Slash Commands 처리
 * 
 * 채널 제한: #g_cell_global-business
 */

import express, { Request, Response } from 'express';
import { slackService } from '../services/slackService';

const router = express.Router();

// 허용된 채널 (# 제외)
const ALLOWED_CHANNEL = 'g_cell_global-business';

/**
 * 채널 제한 확인
 */
function checkChannel(channelName: string): boolean {
  // 채널명이 허용된 채널과 일치하는지 확인
  return channelName === ALLOWED_CHANNEL;
}

/**
 * 채널 제한 메시지
 */
function channelRestrictedResponse() {
  return {
    response_type: 'ephemeral' as const,
    text: `⚠️ 이 명령어는 \`#${ALLOWED_CHANNEL}\` 채널에서만 사용할 수 있습니다.`,
  };
}

// 테스트 엔드포인트
router.get('/test', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Slack routes are working' });
});

/**
 * /gb 명령어 - 도움말
 */
router.post('/commands/gb', (req: Request, res: Response) => {
  try {
    const { channel_name } = req.body;
    console.log('[Slack] /gb - channel:', channel_name);
    
    // 채널 제한
    if (!checkChannel(channel_name)) {
      return res.json(channelRestrictedResponse());
    }
    
    return res.json(slackService.buildHelpMessage());
  } catch (error: any) {
    console.error('[Slack] /gb error:', error?.message);
    return res.json({
      response_type: 'ephemeral',
      text: '❌ 오류가 발생했습니다.',
    });
  }
});

/**
 * /order 명령어 - 주문 상세 조회
 */
router.post('/commands/order', async (req: Request, res: Response) => {
  try {
    const { text, channel_name, response_url } = req.body;
    console.log('[Slack] /order - channel:', channel_name, 'text:', text);
    
    // 채널 제한
    if (!checkChannel(channel_name)) {
      return res.json(channelRestrictedResponse());
    }
    
    const orderCode = text?.trim();

    if (!orderCode) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ 주문번호를 입력해주세요.\n사용법: `/order P_123456789`',
      });
    }

    // 즉시 응답
    res.json({
      response_type: 'ephemeral',
      text: `🔍 주문번호 \`${orderCode}\` 조회 중...`,
    });

    // 비동기로 데이터 조회
    try {
      const GoogleSheetsService = (await import('../services/googleSheets')).default;
      const { sheetsConfig } = await import('../config/sheets');
      const sheets = new GoogleSheetsService(sheetsConfig);
      
      // 주문 데이터 조회
      const ordersData = await sheets.getSheetDataAsJson('주문내역');
      const order = ordersData.find((row: any) => 
        row.order_code === orderCode || 
        String(row.order_code) === orderCode
      );

      if (order) {
        await sendDelayedResponse(response_url, slackService.buildOrderMessage(order));
      } else {
        // 물류 데이터에서 검색
        const logisticsData = await sheets.getSheetDataAsJson('물류관리');
        const shipment = logisticsData.find((row: any) =>
          row.order_code === orderCode
        );

        if (shipment) {
          await sendDelayedResponse(response_url, slackService.buildOrderMessage(shipment));
        } else {
          await sendDelayedResponse(response_url, slackService.buildErrorMessage('order', orderCode));
        }
      }
    } catch (dbError: any) {
      console.error('[Slack] Order DB error:', dbError?.message);
      await sendDelayedResponse(response_url, {
        response_type: 'ephemeral',
        text: `❌ 데이터 조회 중 오류: ${dbError?.message || '알 수 없는 오류'}`,
      });
    }
  } catch (error: any) {
    console.error('[Slack] /order error:', error?.message);
    return res.json({
      response_type: 'ephemeral',
      text: '❌ 오류가 발생했습니다.',
    });
  }
});

/**
 * /track 명령어 - 배송 추적
 */
router.post('/commands/track', async (req: Request, res: Response) => {
  try {
    const { text, channel_name, response_url } = req.body;
    console.log('[Slack] /track - channel:', channel_name);
    
    // 채널 제한
    if (!checkChannel(channel_name)) {
      return res.json(channelRestrictedResponse());
    }
    
    const trackingNumber = text?.trim();

    if (!trackingNumber) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ 송장번호를 입력해주세요.\n사용법: `/track KJPEXP789012`',
      });
    }

    // 즉시 응답
    res.json({
      response_type: 'ephemeral',
      text: `🔍 송장번호 \`${trackingNumber}\` 조회 중...`,
    });

    try {
      const GoogleSheetsService = (await import('../services/googleSheets')).default;
      const { sheetsConfig } = await import('../config/sheets');
      const sheets = new GoogleSheetsService(sheetsConfig);
      
      const logisticsData = await sheets.getSheetDataAsJson('물류관리');
      const shipment = logisticsData.find((row: any) =>
        row.tracking_number === trackingNumber ||
        row.tracking_number?.includes(trackingNumber)
      );

      if (shipment) {
        await sendDelayedResponse(response_url, slackService.buildTrackingMessage(shipment));
      } else {
        await sendDelayedResponse(response_url, slackService.buildErrorMessage('tracking', trackingNumber));
      }
    } catch (dbError: any) {
      console.error('[Slack] Track DB error:', dbError?.message);
      await sendDelayedResponse(response_url, {
        response_type: 'ephemeral',
        text: `❌ 데이터 조회 중 오류: ${dbError?.message || '알 수 없는 오류'}`,
      });
    }
  } catch (error: any) {
    console.error('[Slack] /track error:', error?.message);
    return res.json({
      response_type: 'ephemeral',
      text: '❌ 오류가 발생했습니다.',
    });
  }
});

/**
 * /customer 명령어 - 고객 주문 이력
 */
router.post('/commands/customer', async (req: Request, res: Response) => {
  try {
    const { text, channel_name, response_url } = req.body;
    console.log('[Slack] /customer - channel:', channel_name);
    
    // 채널 제한
    if (!checkChannel(channel_name)) {
      return res.json(channelRestrictedResponse());
    }
    
    const customerId = text?.trim();

    if (!customerId) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ 고객 ID를 입력해주세요.\n사용법: `/customer 12345`',
      });
    }

    // 즉시 응답
    res.json({
      response_type: 'ephemeral',
      text: `🔍 고객 \`${customerId}\` 조회 중...`,
    });

    try {
      const GoogleSheetsService = (await import('../services/googleSheets')).default;
      const { sheetsConfig } = await import('../config/sheets');
      const sheets = new GoogleSheetsService(sheetsConfig);
      
      const ordersData = await sheets.getSheetDataAsJson('주문내역');
      const customerOrders = ordersData.filter((row: any) =>
        row.user_id === customerId ||
        row.customer_id === customerId ||
        row.user_id?.includes(customerId)
      );

      if (customerOrders.length > 0) {
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

        await sendDelayedResponse(response_url, slackService.buildCustomerMessage(customer, customerOrders));
      } else {
        await sendDelayedResponse(response_url, slackService.buildErrorMessage('customer', customerId));
      }
    } catch (dbError: any) {
      console.error('[Slack] Customer DB error:', dbError?.message);
      await sendDelayedResponse(response_url, {
        response_type: 'ephemeral',
        text: `❌ 데이터 조회 중 오류: ${dbError?.message || '알 수 없는 오류'}`,
      });
    }
  } catch (error: any) {
    console.error('[Slack] /customer error:', error?.message);
    return res.json({
      response_type: 'ephemeral',
      text: '❌ 오류가 발생했습니다.',
    });
  }
});

/**
 * /artist 명령어 - 작가 주문 현황
 */
router.post('/commands/artist', async (req: Request, res: Response) => {
  try {
    const { text, channel_name, response_url } = req.body;
    console.log('[Slack] /artist - channel:', channel_name);
    
    // 채널 제한
    if (!checkChannel(channel_name)) {
      return res.json(channelRestrictedResponse());
    }
    
    const artistName = text?.trim();

    if (!artistName) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ 작가명을 입력해주세요.\n사용법: `/artist 작가명`',
      });
    }

    // 즉시 응답
    res.json({
      response_type: 'ephemeral',
      text: `🔍 작가 \`${artistName}\` 조회 중...`,
    });

    try {
      const GoogleSheetsService = (await import('../services/googleSheets')).default;
      const { sheetsConfig } = await import('../config/sheets');
      const sheets = new GoogleSheetsService(sheetsConfig);
      
      // 주문 데이터에서 작가 검색
      const ordersData = await sheets.getSheetDataAsJson('주문내역');
      const artistOrders = ordersData.filter((row: any) =>
        row.artist_name === artistName ||
        row.artist === artistName ||
        row.artist_name?.includes(artistName)
      );

      // 미입고 데이터에서 지연 건 확인
      const unreceivedData = await sheets.getSheetDataAsJson('미입고현황');
      const delayedOrders = unreceivedData.filter((row: any) =>
        row.artist_name === artistName ||
        row.artist?.includes(artistName)
      );

      if (artistOrders.length > 0 || delayedOrders.length > 0) {
        // 지연 정보 병합
        const enrichedOrders = artistOrders.map((order: any) => {
          const delayed = delayedOrders.find((d: any) =>
            d.order_code === order.order_code
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

        const artist = { name: artistName };
        const summary = {
          total: artistOrders.length,
          delayed: delayedOrders.length,
        };

        await sendDelayedResponse(response_url, slackService.buildArtistMessage(artist, enrichedOrders, summary));
      } else {
        await sendDelayedResponse(response_url, slackService.buildErrorMessage('artist', artistName));
      }
    } catch (dbError: any) {
      console.error('[Slack] Artist DB error:', dbError?.message);
      await sendDelayedResponse(response_url, {
        response_type: 'ephemeral',
        text: `❌ 데이터 조회 중 오류: ${dbError?.message || '알 수 없는 오류'}`,
      });
    }
  } catch (error: any) {
    console.error('[Slack] /artist error:', error?.message);
    return res.json({
      response_type: 'ephemeral',
      text: '❌ 오류가 발생했습니다.',
    });
  }
});

/**
 * 지연 응답 전송
 */
async function sendDelayedResponse(responseUrl: string, message: any): Promise<void> {
  if (!responseUrl) {
    console.warn('[Slack] No response URL');
    return;
  }

  try {
    const axios = (await import('axios')).default;
    await axios.post(responseUrl, {
      ...message,
      replace_original: true,
    });
  } catch (error: any) {
    console.error('[Slack] Delayed response error:', error?.message);
  }
}

export default router;
