/**
 * 글로벌 마케팅 캘린더 API 라우트
 */

import { Router, Request, Response } from 'express';
import calendarService, { HolidayCategory } from '../services/calendarService';

const router = Router();

/**
 * GET /api/calendar/holidays
 * 기념일 목록 조회
 */
router.get('/holidays', (req: Request, res: Response) => {
  try {
    const { year, month, countries, tier, category, importance } = req.query;

    const holidays = calendarService.getHolidays({
      year: year ? parseInt(year as string) : undefined,
      month: month ? parseInt(month as string) : undefined,
      countries: countries ? (countries as string).split(',') : undefined,
      tier: tier ? parseInt(tier as string) : undefined,
      category: category as HolidayCategory | undefined,
      importance: importance as string | undefined,
    });

    res.json({
      success: true,
      data: holidays,
      count: holidays.length,
    });
  } catch (error) {
    console.error('기념일 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '기념일 조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * GET /api/calendar/holidays/:id
 * 특정 기념일 상세 조회
 */
router.get('/holidays/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const holiday = calendarService.getHolidayById(id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        error: '기념일을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: holiday,
    });
  } catch (error) {
    console.error('기념일 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '기념일 조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * GET /api/calendar/upcoming
 * 다가오는 기념일 조회
 */
router.get('/upcoming', (req: Request, res: Response) => {
  try {
    const { days, countries } = req.query;

    const holidays = calendarService.getUpcomingHolidays(
      days ? parseInt(days as string) : 30,
      countries ? (countries as string).split(',') : undefined
    );

    res.json({
      success: true,
      data: holidays,
      count: holidays.length,
    });
  } catch (error) {
    console.error('다가오는 기념일 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '기념일 조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * GET /api/calendar/countries
 * 국가 목록 조회
 */
router.get('/countries', (req: Request, res: Response) => {
  try {
    const { tier } = req.query;

    const countries = calendarService.getCountries(
      tier ? parseInt(tier as string) : undefined
    );

    res.json({
      success: true,
      data: countries,
      count: Object.keys(countries).length,
    });
  } catch (error) {
    console.error('국가 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '국가 목록 조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * POST /api/calendar/recommend-categories
 * 카테고리 추천 생성
 */
router.post('/recommend-categories', (req: Request, res: Response) => {
  try {
    const { holidayId, country } = req.body;

    if (!holidayId || !country) {
      return res.status(400).json({
        success: false,
        error: 'holidayId와 country는 필수입니다.',
      });
    }

    const recommendations = calendarService.generateCategoryRecommendations(
      holidayId,
      country
    );

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('카테고리 추천 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '카테고리 추천 생성 중 오류가 발생했습니다.',
    });
  }
});

/**
 * POST /api/calendar/generate-strategy
 * AI 마케팅 전략 생성 (추후 구현)
 */
router.post('/generate-strategy', async (req: Request, res: Response) => {
  try {
    const { holidayId, country, budget, channels } = req.body;

    if (!holidayId || !country) {
      return res.status(400).json({
        success: false,
        error: 'holidayId와 country는 필수입니다.',
      });
    }

    const holiday = calendarService.getHolidayById(holidayId);
    if (!holiday) {
      return res.status(404).json({
        success: false,
        error: '기념일을 찾을 수 없습니다.',
      });
    }

    // 기본 전략 템플릿 생성 (추후 AI 연동)
    const strategy = {
      holidayId,
      country,
      categoryRecommendations: calendarService.generateCategoryRecommendations(holidayId, country)
        .map((rec, idx) => ({ rank: idx + 1, ...rec })),
      promotionStrategy: {
        timeline: [
          {
            phase: 'awareness',
            startDate: `D-${holiday.marketing.leadTimeDays}`,
            endDate: `D-${Math.floor(holiday.marketing.leadTimeDays / 2)}`,
            actions: ['SNS 티저 콘텐츠', '인플루언서 협업 시작'],
          },
          {
            phase: 'consideration',
            startDate: `D-${Math.floor(holiday.marketing.leadTimeDays / 2)}`,
            endDate: 'D-7',
            actions: ['상품 카탈로그 노출', '리뷰 캠페인'],
          },
          {
            phase: 'conversion',
            startDate: 'D-7',
            endDate: 'D-Day',
            actions: holiday.marketing.discountExpected
              ? ['할인 프로모션', '긴급성 메시지']
              : ['프리미엄 패키징 강조', '한정판 메시지'],
          },
        ],
        discountSuggestion: holiday.marketing.discountExpected
          ? {
              type: 'percentage',
              value: 10,
              rationale: `${holiday.name.korean}에 고객들이 할인을 기대합니다.`,
            }
          : undefined,
      },
      contentStrategy: {
        themes: holiday.marketing.keyTrends,
        keyMessages: {
          korean: `${holiday.name.korean}을(를) 특별하게, idus에서`,
          english: `Make your ${holiday.name.english} special with idus`,
          local: holiday.name.local,
        },
        visualGuidelines: holiday.context.colors || [],
        hashtags: holiday.marketing.keyTrends.map(t => `#${t}`),
      },
      projectedImpact: {
        trafficIncrease: holiday.importance === 'major' ? '+30~50%' : '+10~20%',
        conversionLift: holiday.marketing.giftGiving ? '+2~3%p' : '+1~2%p',
        revenueOpportunity: holiday.importance === 'major' ? '상' : '중',
      },
      generatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: strategy,
    });
  } catch (error) {
    console.error('마케팅 전략 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '마케팅 전략 생성 중 오류가 발생했습니다.',
    });
  }
});

export default router;

