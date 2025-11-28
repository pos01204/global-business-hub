/**
 * 고객 리뷰 갤러리 라우트
 * - Google Sheets "review" 시트 연동
 * - 아름다운 리뷰 쇼케이스 제공
 */

import { Router, Request, Response } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES, isGoogleSheetsConfigured } from '../config/sheets';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

// 리뷰 데이터 인터페이스
interface Review {
  dt: string;
  review_id: number;
  rating: number;
  contents: string;
  contents_len: number;
  image_url: string;
  image_cnt: number;
  product_id: number;
  product_name: string;
  artist_id: number;
  artist_name: string;
  user_id: number;
  order_item_id: number;
  order_id: number;
  country: string;
}

// 리뷰 데이터 캐시
let reviewsCache: Review[] | null = null;
let lastLoadTime: number = 0;
const CACHE_TTL = 3 * 60 * 1000; // 3분

// Google Sheets에서 리뷰 로드
async function loadReviews(): Promise<Review[]> {
  const now = Date.now();
  
  if (reviewsCache && (now - lastLoadTime) < CACHE_TTL) {
    return reviewsCache;
  }

  if (!isGoogleSheetsConfigured) {
    console.warn('[Reviews] Google Sheets가 설정되지 않음');
    return reviewsCache || [];
  }

  try {
    const rows = await sheetsService.getSheetData(SHEET_NAMES.REVIEW);
    
    if (!rows || rows.length === 0) {
      console.warn('[Reviews] review 시트에 데이터 없음');
      return [];
    }

    reviewsCache = rows.map((row: any) => ({
      dt: row.dt || '',
      review_id: parseInt(row.review_id) || 0,
      rating: parseInt(row.rating) || 0,
      contents: row.contents || '',
      contents_len: parseInt(row.contents_len) || 0,
      image_url: row.image_url || '',
      image_cnt: parseInt(row.image_cnt) || 0,
      product_id: parseInt(row.product_id) || 0,
      product_name: row.product_name || '',
      artist_id: parseInt(row.artist_id) || 0,
      artist_name: row.artist_name || '',
      user_id: parseInt(row.user_id) || 0,
      order_item_id: parseInt(row.order_item_id) || 0,
      order_id: parseInt(row.order_id) || 0,
      country: row.country || '',
    }));

    lastLoadTime = now;
    console.log(`[Reviews] ${reviewsCache.length}개 리뷰 로드 완료`);
    return reviewsCache;
  } catch (error) {
    console.error('[Reviews] 데이터 로드 실패:', error);
    return reviewsCache || [];
  }
}

// 국가 코드 -> 국가 정보
const countryInfo: Record<string, { name: string; emoji: string }> = {
  'JP': { name: '일본', emoji: '🇯🇵' },
  'US': { name: '미국', emoji: '🇺🇸' },
  'SG': { name: '싱가포르', emoji: '🇸🇬' },
  'HK': { name: '홍콩', emoji: '🇭🇰' },
  'AU': { name: '호주', emoji: '🇦🇺' },
  'PL': { name: '폴란드', emoji: '🇵🇱' },
  'CA': { name: '캐나다', emoji: '🇨🇦' },
  'GB': { name: '영국', emoji: '🇬🇧' },
  'NL': { name: '네덜란드', emoji: '🇳🇱' },
  'FR': { name: '프랑스', emoji: '🇫🇷' },
  'CH': { name: '스위스', emoji: '🇨🇭' },
  'DE': { name: '독일', emoji: '🇩🇪' },
  'IT': { name: '이탈리아', emoji: '🇮🇹' },
  'ES': { name: '스페인', emoji: '🇪🇸' },
  'TH': { name: '태국', emoji: '🇹🇭' },
  'MY': { name: '말레이시아', emoji: '🇲🇾' },
  'ID': { name: '인도네시아', emoji: '🇮🇩' },
  'IE': { name: '아일랜드', emoji: '🇮🇪' },
};

// ============================================
// 리뷰 갤러리 메인 API
// ============================================
router.get('/gallery', async (req: Request, res: Response) => {
  try {
    const reviews = await loadReviews();
    const {
      country,
      hasImage,
      minRating = '8',
      page = '1',
      pageSize = '24',
      sort = 'latest',
    } = req.query;

    // 필터링
    let filtered = reviews.filter(r => {
      if (country && r.country !== country) return false;
      if (hasImage === 'true' && r.image_cnt === 0) return false;
      if (r.rating < parseInt(minRating as string)) return false;
      return true;
    });

    // 정렬
    switch (sort) {
      case 'latest':
        filtered.sort((a, b) => b.dt.localeCompare(a.dt));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating || b.dt.localeCompare(a.dt));
        break;
      case 'popular':
        filtered.sort((a, b) => b.contents_len - a.contents_len);
        break;
    }

    // 페이지네이션
    const total = filtered.length;
    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const start = (pageNum - 1) * size;
    const paginated = filtered.slice(start, start + size);

    // 국가별 카운트
    const countryCounts = new Map<string, number>();
    reviews.forEach(r => {
      countryCounts.set(r.country, (countryCounts.get(r.country) || 0) + 1);
    });
    const countries = Array.from(countryCounts.entries())
      .map(([code, count]) => ({
        code,
        ...countryInfo[code] || { name: code, emoji: '🏳️' },
        count,
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: {
        reviews: paginated.map(r => ({
          id: r.review_id,
          date: r.dt,
          rating: r.rating,
          contents: r.contents,
          imageUrl: r.image_url,
          imageCount: r.image_cnt,
          productName: r.product_name,
          artistName: r.artist_name,
          country: r.country,
          countryInfo: countryInfo[r.country] || { name: r.country, emoji: '🏳️' },
        })),
        pagination: {
          total,
          page: pageNum,
          pageSize: size,
          totalPages: Math.ceil(total / size),
        },
        filters: {
          countries,
        },
        stats: {
          totalReviews: reviews.length,
          avgRating: reviews.length > 0 
            ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 
            : 0,
          imageReviews: reviews.filter(r => r.image_cnt > 0).length,
          countryCount: countryCounts.size,
        },
      },
    });
  } catch (error) {
    console.error('[Reviews] Gallery error:', error);
    res.status(500).json({ success: false, error: '리뷰 갤러리 조회 실패' });
  }
});

// ============================================
// 하이라이트 리뷰 (메인 쇼케이스용)
// ============================================
router.get('/highlights', async (req: Request, res: Response) => {
  try {
    const reviews = await loadReviews();
    const { limit = '12' } = req.query;

    // 이미지 있고, 평점 9점 이상, 내용 50자 이상
    const highlights = reviews
      .filter(r => r.image_cnt > 0 && r.rating >= 9 && r.contents_len >= 50)
      .sort((a, b) => b.dt.localeCompare(a.dt))
      .slice(0, parseInt(limit as string))
      .map(r => ({
        id: r.review_id,
        date: r.dt,
        rating: r.rating,
        contents: r.contents,
        imageUrl: r.image_url,
        productName: r.product_name,
        artistName: r.artist_name,
        country: r.country,
        countryInfo: countryInfo[r.country] || { name: r.country, emoji: '🏳️' },
      }));

    res.json({
      success: true,
      data: highlights,
    });
  } catch (error) {
    console.error('[Reviews] Highlights error:', error);
    res.status(500).json({ success: false, error: '하이라이트 리뷰 조회 실패' });
  }
});

// ============================================
// 통계 요약
// ============================================
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const reviews = await loadReviews();

    if (reviews.length === 0) {
      return res.json({
        success: true,
        data: {
          totalReviews: 0,
          avgRating: 0,
          imageReviewRate: 0,
          countries: [],
        },
      });
    }

    const totalReviews = reviews.length;
    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / totalReviews;
    const imageReviews = reviews.filter(r => r.image_cnt > 0).length;

    // 국가별 통계
    const countryMap = new Map<string, number>();
    reviews.forEach(r => {
      countryMap.set(r.country, (countryMap.get(r.country) || 0) + 1);
    });
    const countries = Array.from(countryMap.entries())
      .map(([code, count]) => ({
        code,
        ...countryInfo[code] || { name: code, emoji: '🏳️' },
        count,
        percentage: Math.round((count / totalReviews) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: {
        totalReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        imageReviews,
        imageReviewRate: Math.round((imageReviews / totalReviews) * 1000) / 10,
        countries,
      },
    });
  } catch (error) {
    console.error('[Reviews] Stats error:', error);
    res.status(500).json({ success: false, error: '통계 조회 실패' });
  }
});

// ============================================
// 캐시 새로고침
// ============================================
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    reviewsCache = null;
    lastLoadTime = 0;
    const reviews = await loadReviews();
    
    res.json({
      success: true,
      message: `${reviews.length}개 리뷰 새로고침 완료`,
    });
  } catch (error) {
    console.error('[Reviews] Refresh error:', error);
    res.status(500).json({ success: false, error: '새로고침 실패' });
  }
});

export default router;
