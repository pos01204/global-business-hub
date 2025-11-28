/**
 * Slack 연동 라우터
 * CS팀 협업을 위한 Slash Commands 처리
 */

import express, { Request, Response } from 'express';
import { slackService } from '../services/slackService';

const router = express.Router();

// 테스트 엔드포인트
router.get('/test', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Slack routes are working' });
});

/**
 * /gb 명령어 - 도움말
 */
router.post('/commands/gb', async (req: Request, res: Response) => {
  try {
    console.log('[Slack] /gb command received');
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
    console.log('[Slack] /order command received');
    const { text } = req.body;
    const orderCode = text?.trim();

    if (!orderCode) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ 주문번호를 입력해주세요.\n사용법: `/order P_123456789`',
      });
    }

    // 간단한 응답 반환
    return res.json({
      response_type: 'ephemeral',
      text: `🔍 주문번호 \`${orderCode}\` 조회 기능은 준비 중입니다.\n\n허브에서 직접 확인해주세요.`,
    });
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
    console.log('[Slack] /track command received');
    const { text } = req.body;
    const trackingNumber = text?.trim();

    if (!trackingNumber) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ 송장번호를 입력해주세요.\n사용법: `/track KJPEXP789012`',
      });
    }

    return res.json({
      response_type: 'ephemeral',
      text: `🔍 송장번호 \`${trackingNumber}\` 조회 기능은 준비 중입니다.\n\n허브에서 직접 확인해주세요.`,
    });
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
    console.log('[Slack] /customer command received');
    const { text } = req.body;
    const customerId = text?.trim();

    if (!customerId) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ 고객 ID를 입력해주세요.\n사용법: `/customer 12345`',
      });
    }

    return res.json({
      response_type: 'ephemeral',
      text: `🔍 고객 \`${customerId}\` 조회 기능은 준비 중입니다.\n\n허브에서 직접 확인해주세요.`,
    });
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
    console.log('[Slack] /artist command received');
    const { text } = req.body;
    const artistName = text?.trim();

    if (!artistName) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ 작가명을 입력해주세요.\n사용법: `/artist 작가명`',
      });
    }

    return res.json({
      response_type: 'ephemeral',
      text: `🔍 작가 \`${artistName}\` 조회 기능은 준비 중입니다.\n\n허브에서 직접 확인해주세요.`,
    });
  } catch (error: any) {
    console.error('[Slack] /artist error:', error?.message);
    return res.json({
      response_type: 'ephemeral',
      text: '❌ 오류가 발생했습니다.',
    });
  }
});

export default router;
