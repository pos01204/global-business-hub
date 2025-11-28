/**
 * Slack 연동 라우터 - 최소 버전
 */

import express, { Request, Response } from 'express';

const router = express.Router();

// 테스트 엔드포인트
router.get('/test', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Slack routes are working' });
});

/**
 * /gb 명령어 - 도움말
 */
router.post('/commands/gb', (req: Request, res: Response) => {
  console.log('[Slack] /gb command received');
  res.json({
    response_type: 'ephemeral',
    text: '🌏 *Global Business Hub - Slack 명령어*\n\n`/order P_주문번호` - 주문 상세 조회\n`/track 송장번호` - 배송 추적\n`/customer 고객ID` - 고객 이력\n`/artist 작가명` - 작가 현황\n`/gb` - 도움말',
  });
});

/**
 * /order 명령어
 */
router.post('/commands/order', (req: Request, res: Response) => {
  console.log('[Slack] /order command received');
  const { text } = req.body;
  const orderCode = text?.trim();

  if (!orderCode) {
    return res.json({
      response_type: 'ephemeral',
      text: '❌ 주문번호를 입력해주세요.\n사용법: `/order P_123456789`',
    });
  }

  res.json({
    response_type: 'ephemeral',
    text: `🔍 주문번호 \`${orderCode}\` 조회 기능 준비 중`,
  });
});

/**
 * /track 명령어
 */
router.post('/commands/track', (req: Request, res: Response) => {
  console.log('[Slack] /track command received');
  const { text } = req.body;
  const trackingNumber = text?.trim();

  if (!trackingNumber) {
    return res.json({
      response_type: 'ephemeral',
      text: '❌ 송장번호를 입력해주세요.\n사용법: `/track KJPEXP789012`',
    });
  }

  res.json({
    response_type: 'ephemeral',
    text: `🔍 송장번호 \`${trackingNumber}\` 조회 기능 준비 중`,
  });
});

/**
 * /customer 명령어
 */
router.post('/commands/customer', (req: Request, res: Response) => {
  console.log('[Slack] /customer command received');
  const { text } = req.body;
  const customerId = text?.trim();

  if (!customerId) {
    return res.json({
      response_type: 'ephemeral',
      text: '❌ 고객 ID를 입력해주세요.\n사용법: `/customer 12345`',
    });
  }

  res.json({
    response_type: 'ephemeral',
    text: `🔍 고객 \`${customerId}\` 조회 기능 준비 중`,
  });
});

/**
 * /artist 명령어
 */
router.post('/commands/artist', (req: Request, res: Response) => {
  console.log('[Slack] /artist command received');
  const { text } = req.body;
  const artistName = text?.trim();

  if (!artistName) {
    return res.json({
      response_type: 'ephemeral',
      text: '❌ 작가명을 입력해주세요.\n사용법: `/artist 작가명`',
    });
  }

  res.json({
    response_type: 'ephemeral',
    text: `🔍 작가 \`${artistName}\` 조회 기능 준비 중`,
  });
});

export default router;
