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
 * GET /api/calendar/reminders
 * 리마인더 대상 기념일 조회
 */
router.get('/reminders', (req: Request, res: Response) => {
  try {
    const reminders = calendarService.getHolidaysNeedingReminder();

    res.json({
      success: true,
      data: reminders,
      count: reminders.length,
    });
  } catch (error) {
    console.error('리마인더 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '리마인더 조회 중 오류가 발생했습니다.',
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
 * POST /api/calendar/generate-strategy
 * 마케팅 전략 생성
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

    const strategy = calendarService.generateMarketingStrategy(
      holidayId,
      country,
      { budget, channels }
    );

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: '기념일 또는 국가를 찾을 수 없습니다.',
      });
    }

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

/**
 * GET /api/calendar/stats
 * 캘린더 통계
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const allHolidays = calendarService.getHolidays({});
    const upcoming30 = calendarService.getUpcomingHolidays(30);
    const upcoming7 = calendarService.getUpcomingHolidays(7);
    const reminders = calendarService.getHolidaysNeedingReminder();

    // 카테고리별 통계
    const byCategory: Record<string, number> = {};
    allHolidays.forEach(h => {
      byCategory[h.category] = (byCategory[h.category] || 0) + 1;
    });

    // 월별 통계
    const byMonth: Record<number, number> = {};
    allHolidays.forEach(h => {
      byMonth[h.date.month] = (byMonth[h.date.month] || 0) + 1;
    });

    // 중요도별 통계
    const byImportance: Record<string, number> = {};
    allHolidays.forEach(h => {
      byImportance[h.importance] = (byImportance[h.importance] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        totalHolidays: allHolidays.length,
        upcoming30Days: upcoming30.length,
        upcoming7Days: upcoming7.length,
        pendingReminders: reminders.length,
        byCategory,
        byMonth,
        byImportance,
        totalCountries: Object.keys(calendarService.COUNTRIES).length,
      },
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '통계 조회 중 오류가 발생했습니다.',
    });
  }
});

export default router;
