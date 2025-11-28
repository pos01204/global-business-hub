/**
 * Slack 연동 라우터
 * CS팀 협업을 위한 Slash Commands 처리
 * 
 * 채널 제한: #g_cell_global-business
 */

import express, { Request, Response } from 'express';
import { slackService } from '../services/slackService';
import { SHEET_NAMES } from '../config/sheets';

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
      
      // 물류 데이터에서 주문 검색
      const logisticsData = await sheets.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
      const orderItems = logisticsData.filter((row: any) =>
        row.order_code === orderCode
      );

      if (orderItems.length > 0) {
        // 첫 번째 아이템에서 주문 정보 추출
        const firstItem = orderItems[0];
        const orderInfo = {
          order_code: firstItem.order_code,
          country: firstItem.country,
          user_id: firstItem.user_id,
          status: firstItem.logistics,
          order_date: firstItem.order_created,
          artist_name: firstItem['artist_name (kr)'] || firstItem.artist_name,
          product_name: firstItem.product_name,
          quantity: firstItem['구매수량'],
          tracking_number: firstItem['국제송장번호'],
          carrier: 'Lotte Global',
          shipped_at: firstItem['shipment_item_updated'],
        };
        await sendDelayedResponse(response_url, slackService.buildOrderMessage(orderInfo));
      } else {
        await sendDelayedResponse(response_url, slackService.buildErrorMessage('order', orderCode));
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
      
      const logisticsData = await sheets.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
      const shipment = logisticsData.find((row: any) =>
        row['국제송장번호'] === trackingNumber ||
        row['국제송장번호']?.includes(trackingNumber) ||
        row['작가 발송 송장번호'] === trackingNumber
      );

      if (shipment) {
        const trackingInfo = {
          tracking_number: shipment['국제송장번호'] || shipment['작가 발송 송장번호'],
          order_code: shipment.order_code,
          country: shipment.country,
          carrier: shipment['국제송장번호'] ? 'Lotte Global' : shipment['작가 발송 택배사'],
          status: shipment.logistics,
          shipped_at: shipment['shipment_item_updated'],
        };
        await sendDelayedResponse(response_url, slackService.buildTrackingMessage(trackingInfo));
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
      
      const logisticsData = await sheets.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
      const customerOrders = logisticsData.filter((row: any) =>
        String(row.user_id) === customerId ||
        String(row.user_id)?.includes(customerId)
      );

      if (customerOrders.length > 0) {
        // 주문코드별로 그룹화 (중복 제거)
        const uniqueOrders = new Map();
        customerOrders.forEach((row: any) => {
          if (!uniqueOrders.has(row.order_code)) {
            uniqueOrders.set(row.order_code, {
              order_code: row.order_code,
              order_date: row.order_created,
              status: row.logistics,
              product_name: row.product_name,
              artist_name: row['artist_name (kr)'] || row.artist_name,
              country: row.country,
              total_price: row['상품금액'],
              currency: row.currency,
            });
          }
        });

        const orders = Array.from(uniqueOrders.values());
        // 최신순 정렬
        orders.sort((a: any, b: any) => {
          const dateA = new Date(a.order_date || 0);
          const dateB = new Date(b.order_date || 0);
          return dateB.getTime() - dateA.getTime();
        });

        const customer = {
          user_id: customerId,
          country: orders[0]?.country,
        };

        await sendDelayedResponse(response_url, slackService.buildCustomerMessage(customer, orders));
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
      
      // 물류 데이터에서 작가 검색
      const logisticsData = await sheets.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
      const artistItems = logisticsData.filter((row: any) => {
        const artistKr = row['artist_name (kr)'] || '';
        const artistEn = row.artist_name || '';
        return artistKr === artistName || 
               artistEn === artistName ||
               artistKr?.includes(artistName) ||
               artistEn?.includes(artistName);
      });

      if (artistItems.length > 0) {
        // 주문코드별로 그룹화 (중복 제거)
        const uniqueOrders = new Map();
        artistItems.forEach((row: any) => {
          if (!uniqueOrders.has(row.order_code)) {
            const isDelayed = row.logistics === '미입고' || row.logistics?.includes('미입고');
            uniqueOrders.set(row.order_code, {
              order_code: row.order_code,
              order_date: row.order_created,
              status: row.logistics,
              country: row.country,
              product_name: row.product_name,
              is_delayed: isDelayed,
            });
          }
        });

        const orders = Array.from(uniqueOrders.values());
        // 최신순 정렬
        orders.sort((a: any, b: any) => {
          const dateA = new Date(a.order_date || 0);
          const dateB = new Date(b.order_date || 0);
          return dateB.getTime() - dateA.getTime();
        });

        const delayedCount = orders.filter((o: any) => o.is_delayed).length;

        const artist = { name: artistName };
        const summary = {
          total: orders.length,
          delayed: delayedCount,
        };

        await sendDelayedResponse(response_url, slackService.buildArtistMessage(artist, orders, summary));
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

/**
 * 미입고 7일 초과 자동 알림 (Webhook)
 * GET /api/slack/notify/unreceived-delayed
 * 
 * Railway Cron 또는 외부 스케줄러에서 호출
 * SLACK_WEBHOOK_URL 환경변수 필요
 */
router.get('/notify/unreceived-delayed', async (req: Request, res: Response) => {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      return res.status(400).json({ error: 'SLACK_WEBHOOK_URL not configured' });
    }

    // Google Sheets에서 미입고 데이터 조회
    const GoogleSheetsService = (await import('../services/googleSheets')).default;
    const { sheetsConfig } = await import('../config/sheets');
    const sheetsService = new GoogleSheetsService(sheetsConfig);
    
    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    const now = new Date();
    
    // 7일 이상 미입고 건 필터링
    const delayedItems = logisticsData.filter((row: any) => {
      const status = (row.logistics || '').toLowerCase();
      if (!status.includes('미입고')) return false;
      
      const orderDate = new Date(row.order_created);
      if (isNaN(orderDate.getTime())) return false;
      
      const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 7;
    });

    if (delayedItems.length === 0) {
      return res.json({ success: true, message: 'No delayed items', sent: false });
    }

    // 작가별 그룹핑
    const byArtist: Record<string, any[]> = {};
    delayedItems.forEach((item: any) => {
      const artistName = item['artist_name (kr)'] || item.artist_name || '알 수 없음';
      if (!byArtist[artistName]) byArtist[artistName] = [];
      byArtist[artistName].push(item);
    });

    // 상위 5개 작가만 표시
    const topArtists = Object.entries(byArtist)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);

    const artistSummary = topArtists
      .map(([name, items]) => `• ${name}: ${items.length}건`)
      .join('\n');

    // Slack 메시지 전송
    const axios = (await import('axios')).default;
    const hubBaseUrl = process.env.HUB_BASE_URL || 'https://global-business-hub-7p2x.vercel.app';

    await axios.post(webhookUrl, {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 미입고 7일 이상 지연 알림',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${now.toISOString().split('T')[0]} 기준*\n\n총 *${delayedItems.length}건*의 미입고 지연이 발생했습니다.`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📋 작가별 현황 (상위 5개)*\n${artistSummary}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📦 미입고 관리 바로가기',
                emoji: true,
              },
              url: `${hubBaseUrl}/unreceived?delay=delayed`,
              style: 'primary',
            },
          ],
        },
      ],
    });

    res.json({ 
      success: true, 
      sent: true, 
      totalDelayed: delayedItems.length,
      artistCount: Object.keys(byArtist).length,
    });
  } catch (error: any) {
    console.error('[Slack] Notify unreceived error:', error?.message);
    res.status(500).json({ error: 'Failed to send notification', details: error?.message });
  }
});

/**
 * 일일 요약 리포트 (Webhook)
 * GET /api/slack/notify/daily-summary
 */
router.get('/notify/daily-summary', async (req: Request, res: Response) => {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      return res.status(400).json({ error: 'SLACK_WEBHOOK_URL not configured' });
    }

    const GoogleSheetsService = (await import('../services/googleSheets')).default;
    const { sheetsConfig } = await import('../config/sheets');
    const sheetsService = new GoogleSheetsService(sheetsConfig);
    
    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // 오늘 주문
    const todayOrders = logisticsData.filter((row: any) => {
      const orderDate = row.order_created?.split('T')[0] || row.order_created?.split(' ')[0];
      return orderDate === today;
    });

    // 미입고 7일+
    const delayedCount = logisticsData.filter((row: any) => {
      const status = (row.logistics || '').toLowerCase();
      if (!status.includes('미입고')) return false;
      const orderDate = new Date(row.order_created);
      if (isNaN(orderDate.getTime())) return false;
      const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 7;
    }).length;

    // 배송 완료
    const completedToday = logisticsData.filter((row: any) => {
      const status = (row.logistics || '').toLowerCase();
      return status.includes('배송완료') || status.includes('완료');
    }).length;

    const hubBaseUrl = process.env.HUB_BASE_URL || 'https://global-business-hub-7p2x.vercel.app';
    const axios = (await import('axios')).default;

    await axios.post(webhookUrl, {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 Global Business 일일 리포트',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${today}*`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*📦 오늘 신규 주문*\n${todayOrders.length}건`,
            },
            {
              type: 'mrkdwn',
              text: `*✅ 배송 완료*\n${completedToday}건`,
            },
            {
              type: 'mrkdwn',
              text: `*⚠️ 미입고 7일+ 지연*\n${delayedCount}건`,
            },
            {
              type: 'mrkdwn',
              text: `*📋 전체 주문*\n${logisticsData.length}건`,
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
                text: '📈 대시보드 보기',
                emoji: true,
              },
              url: `${hubBaseUrl}/dashboard`,
            },
          ],
        },
      ],
    });

    res.json({ success: true, sent: true });
  } catch (error: any) {
    console.error('[Slack] Daily summary error:', error?.message);
    res.status(500).json({ error: 'Failed to send daily summary', details: error?.message });
  }
});

export default router;
