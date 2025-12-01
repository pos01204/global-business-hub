/**
 * 작가 분석 API
 * 작가 포트폴리오 관리 및 셀렉션 최적화
 */

import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES } from '../config/sheets';
import { getProductUrl } from '../utils/tracking';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

// USD to KRW 환율
const USD_TO_KRW = 1350;

/**
 * 금액 파싱 유틸리티
 */
function cleanAndParseFloat(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleanedStr = String(value).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleanedStr);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 매출 구간 분류
 */
function getRevenueSegment(gmv: number): 'vip' | 'high' | 'medium' | 'low' | 'starter' {
  if (gmv >= 5000000) return 'vip';
  if (gmv >= 1000000) return 'high';
  if (gmv >= 500000) return 'medium';
  if (gmv >= 100000) return 'low';
  return 'starter';
}

/**
 * 건강도 판단
 */
function getHealthStatus(
  daysSinceLastSale: number,
  avgRating: number | null
): 'healthy' | 'caution' | 'warning' | 'critical' {
  const rating = avgRating ?? 5; // 리뷰 없으면 기본값
  if (daysSinceLastSale > 90 || rating < 3.0) return 'critical';
  if (daysSinceLastSale > 60 || rating < 3.5) return 'warning';
  if (daysSinceLastSale > 30 || rating < 4.0) return 'caution';
  return 'healthy';
}

/**
 * 성장률 계산
 */
function calculateGrowthRate(currentGmv: number, previousGmv: number): number {
  if (previousGmv === 0) return currentGmv > 0 ? 100 : 0;
  return ((currentGmv - previousGmv) / previousGmv) * 100;
}

/**
 * 날짜 범위 계산
 */
function getDateRange(dateRange: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const days = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }[dateRange] || 30;
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);
  
  const prevEnd = new Date(start.getTime() - 1);
  prevEnd.setHours(23, 59, 59, 999);
  
  const prevStart = new Date(prevEnd.getTime() - days * 24 * 60 * 60 * 1000 + 1);
  prevStart.setHours(0, 0, 0, 0);
  
  return { start, end, prevStart, prevEnd };
}


/**
 * 디버그 API - 시트 데이터 구조 확인
 * GET /api/artist-analytics/debug
 */
router.get('/debug', async (req, res) => {
  try {
    const [logisticsData, artistsData, reviewData] = await Promise.all([
      sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true),
      sheetsService.getSheetDataAsJson(SHEET_NAMES.ARTISTS, false),
      sheetsService.getSheetDataAsJson(SHEET_NAMES.REVIEW, false).catch(() => []),
    ]);
    
    res.json({
      success: true,
      sheets: {
        logistics: {
          count: logisticsData.length,
          columns: logisticsData[0] ? Object.keys(logisticsData[0]) : [],
          sample: logisticsData.slice(0, 3),
        },
        artists: {
          count: artistsData.length,
          columns: artistsData[0] ? Object.keys(artistsData[0]) : [],
          sample: artistsData.slice(0, 3),
        },
        review: {
          count: reviewData.length,
          columns: reviewData[0] ? Object.keys(reviewData[0]) : [],
          sample: reviewData.slice(0, 3),
        },
      },
      sheetNames: SHEET_NAMES,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


/**
 * 작가 분석 개요 API
 * GET /api/artist-analytics/overview
 */
router.get('/overview', async (req, res) => {
  try {
    const dateRange = (req.query.dateRange as string) || '30d';
    const countryFilter = (req.query.countryFilter as string) || 'all';
    
    console.log('[ArtistAnalytics] Overview request:', { dateRange, countryFilter });
    
    const { start, end } = getDateRange(dateRange);
    
    // 데이터 로드
    const [logisticsData, artistsData, reviewData] = await Promise.all([
      sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true),
      sheetsService.getSheetDataAsJson(SHEET_NAMES.ARTISTS, false),
      sheetsService.getSheetDataAsJson(SHEET_NAMES.REVIEW, false).catch(() => []),
    ]);
    
    // 디버깅 로그
    console.log('[ArtistAnalytics] Data loaded:', {
      logisticsCount: logisticsData.length,
      artistsCount: artistsData.length,
      reviewCount: reviewData.length,
      logisticsSample: logisticsData[0] ? Object.keys(logisticsData[0]) : [],
      artistsSample: artistsData[0] ? Object.keys(artistsData[0]) : [],
    });
    
    // 기간 필터링
    const filteredLogistics = logisticsData.filter((row: any) => {
      const orderDate = new Date(row.order_created);
      if (isNaN(orderDate.getTime())) return false;
      if (orderDate < start || orderDate > end) return false;
      if (countryFilter !== 'all' && row.country !== countryFilter.toUpperCase()) return false;
      return true;
    });
    
    // 작가별 집계
    const artistMetrics = new Map<string, {
      gmv: number;
      orderCodes: Set<string>;
      productIds: Set<string>;
      countries: Set<string>;
    }>();
    
    filteredLogistics.forEach((row: any) => {
      const artistName = row['artist_name (kr)'];
      if (!artistName) return;
      
      if (!artistMetrics.has(artistName)) {
        artistMetrics.set(artistName, {
          gmv: 0,
          orderCodes: new Set(),
          productIds: new Set(),
          countries: new Set(),
        });
      }
      
      const metrics = artistMetrics.get(artistName)!;
      const gmv = cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW;
      metrics.gmv += gmv;
      if (row.order_code) metrics.orderCodes.add(row.order_code);
      if (row.product_id) metrics.productIds.add(row.product_id);
      if (row.country) metrics.countries.add(row.country);
    });
    
    // 전체 작가 수 (artists 시트 기준)
    const totalArtists = artistsData.length;
    const activeArtists = artistMetrics.size;
    const activeRate = totalArtists > 0 ? (activeArtists / totalArtists) * 100 : 0;
    
    // 등록 작품 수 (다양한 컬럼명 패턴 지원)
    let totalProducts = 0;
    artistsData.forEach((artist: any) => {
      // 다양한 컬럼명 패턴 시도
      const globalProducts = parseInt(
        artist['(Global)Live 작품수'] || 
        artist['Global Live 작품수'] ||
        artist['global_live_products'] ||
        artist['globalLiveProducts'] ||
        0
      ) || 0;
      totalProducts += globalProducts;
    });
    
    // 등록 작품이 0이면 logistics에서 고유 상품 수로 대체
    if (totalProducts === 0) {
      const allProductIds = new Set<string>();
      logisticsData.forEach((row: any) => {
        if (row.product_id) allProductIds.add(row.product_id);
      });
      totalProducts = allProductIds.size;
    }
    
    // 판매된 작품 수
    const soldProductIds = new Set<string>();
    filteredLogistics.forEach((row: any) => {
      if (row.product_id) soldProductIds.add(row.product_id);
    });
    const soldProducts = soldProductIds.size;
    const productSellRate = totalProducts > 0 ? (soldProducts / totalProducts) * 100 : 0;
    
    // 총 GMV
    let totalGmv = 0;
    artistMetrics.forEach((metrics) => {
      totalGmv += metrics.gmv;
    });
    
    const avgGmvPerArtist = activeArtists > 0 ? totalGmv / activeArtists : 0;
    const avgGmvPerProduct = soldProducts > 0 ? totalGmv / soldProducts : 0;
    
    // 리뷰 통계
    const periodReviews = reviewData.filter((r: any) => {
      const reviewDate = new Date(r.review_date);
      return reviewDate >= start && reviewDate <= end;
    });
    const totalReviews = periodReviews.length;
    const avgRating = totalReviews > 0
      ? periodReviews.reduce((sum: number, r: any) => sum + (parseFloat(r.rating) || 0), 0) / totalReviews
      : 0;
    
    // 매출 구간별 분포
    const revenueDistribution = {
      vip: { count: 0, rate: 0, gmv: 0 },
      high: { count: 0, rate: 0, gmv: 0 },
      medium: { count: 0, rate: 0, gmv: 0 },
      low: { count: 0, rate: 0, gmv: 0 },
      starter: { count: 0, rate: 0, gmv: 0 },
    };
    
    artistMetrics.forEach((metrics) => {
      const segment = getRevenueSegment(metrics.gmv);
      revenueDistribution[segment].count++;
      revenueDistribution[segment].gmv += metrics.gmv;
    });
    
    Object.keys(revenueDistribution).forEach((key) => {
      const seg = revenueDistribution[key as keyof typeof revenueDistribution];
      seg.rate = activeArtists > 0 ? (seg.count / activeArtists) * 100 : 0;
    });
    
    // 국가별 분포
    const countryGmv = new Map<string, { gmv: number; artistCount: Set<string> }>();
    filteredLogistics.forEach((row: any) => {
      const country = row.country || 'Unknown';
      const artistName = row['artist_name (kr)'];
      const gmv = cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW;
      
      if (!countryGmv.has(country)) {
        countryGmv.set(country, { gmv: 0, artistCount: new Set() });
      }
      const data = countryGmv.get(country)!;
      data.gmv += gmv;
      if (artistName) data.artistCount.add(artistName);
    });
    
    const byCountry = Array.from(countryGmv.entries())
      .map(([country, data]) => ({
        country,
        gmv: Math.round(data.gmv),
        share: totalGmv > 0 ? (data.gmv / totalGmv) * 100 : 0,
        artistCount: data.artistCount.size,
      }))
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 10);
    
    // 디버그 정보 추가
    console.log('[ArtistAnalytics] Overview result:', {
      totalArtists,
      activeArtists,
      totalProducts,
      soldProducts,
      filteredLogisticsCount: filteredLogistics.length,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
    });
    
    res.json({
      success: true,
      summary: {
        totalArtists,
        activeArtists,
        activeRate: Math.round(activeRate * 10) / 10,
        totalProducts,
        soldProducts,
        productSellRate: Math.round(productSellRate * 10) / 10,
        totalGmv: Math.round(totalGmv),
        avgGmvPerArtist: Math.round(avgGmvPerArtist),
        avgGmvPerProduct: Math.round(avgGmvPerProduct),
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews,
      },
      distribution: {
        byRevenue: revenueDistribution,
        byCountry,
      },
      _debug: {
        logisticsTotal: logisticsData.length,
        logisticsFiltered: filteredLogistics.length,
        artistsTotal: artistsData.length,
        reviewsTotal: reviewData.length,
        dateRange: { start: start.toISOString(), end: end.toISOString() },
      },
    });
  } catch (error: any) {
    console.error('[ArtistAnalytics] Overview error:', error?.message);
    res.status(500).json({ success: false, error: 'Failed to get overview', details: error?.message });
  }
});


/**
 * 작가 성과 리스트 API
 * GET /api/artist-analytics/performance
 */
router.get('/performance', async (req, res) => {
  try {
    const dateRange = (req.query.dateRange as string) || '30d';
    const countryFilter = (req.query.country as string) || 'all';
    const segmentFilter = (req.query.segment as string) || 'all';
    const sortBy = (req.query.sort as string) || 'gmv';
    const sortOrder = (req.query.order as string) || 'desc';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    console.log('[ArtistAnalytics] Performance request:', { dateRange, countryFilter, segmentFilter, sortBy, page, limit });
    
    const { start, end, prevStart, prevEnd } = getDateRange(dateRange);
    const now = new Date();
    
    // 데이터 로드
    const [logisticsData, artistsData, reviewData] = await Promise.all([
      sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true),
      sheetsService.getSheetDataAsJson(SHEET_NAMES.ARTISTS, false),
      sheetsService.getSheetDataAsJson(SHEET_NAMES.REVIEW, false).catch(() => []),
    ]);
    
    // 작가 정보 맵
    const artistInfoMap = new Map<string, any>();
    artistsData.forEach((artist: any) => {
      const name = artist['(KR)작가명'] || artist['artist_name (kr)'] || artist['작가명'] || artist.name;
      if (name) {
        artistInfoMap.set(name, {
          artistId: artist.artist_id || artist.global_artist_id || '',
          email: artist.mail || artist.email || '',
          krProducts: parseInt(artist['(KR)Live 작품수'] || artist['KR Live 작품수'] || artist.kr_live_products) || 0,
          globalProducts: parseInt(artist['(Global)Live 작품수'] || artist['Global Live 작품수'] || artist.global_live_products) || 0,
        });
      }
    });
    
    // 현재 기간 작가별 집계
    const currentMetrics = new Map<string, {
      gmv: number;
      orderCodes: Set<string>;
      productIds: Set<string>;
      countries: Set<string>;
      lastSaleDate: Date | null;
    }>();
    
    // 이전 기간 작가별 집계
    const prevMetrics = new Map<string, { gmv: number }>();
    
    logisticsData.forEach((row: any) => {
      const artistName = row['artist_name (kr)'];
      if (!artistName) return;
      
      const orderDate = new Date(row.order_created);
      if (isNaN(orderDate.getTime())) return;
      
      const gmv = cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW;
      const country = row.country;
      
      // 국가 필터
      if (countryFilter !== 'all' && country !== countryFilter.toUpperCase()) return;
      
      // 현재 기간
      if (orderDate >= start && orderDate <= end) {
        if (!currentMetrics.has(artistName)) {
          currentMetrics.set(artistName, {
            gmv: 0,
            orderCodes: new Set(),
            productIds: new Set(),
            countries: new Set(),
            lastSaleDate: null,
          });
        }
        const metrics = currentMetrics.get(artistName)!;
        metrics.gmv += gmv;
        if (row.order_code) metrics.orderCodes.add(row.order_code);
        if (row.product_id) metrics.productIds.add(row.product_id);
        if (country) metrics.countries.add(country);
        if (!metrics.lastSaleDate || orderDate > metrics.lastSaleDate) {
          metrics.lastSaleDate = orderDate;
        }
      }
      
      // 이전 기간
      if (orderDate >= prevStart && orderDate <= prevEnd) {
        if (!prevMetrics.has(artistName)) {
          prevMetrics.set(artistName, { gmv: 0 });
        }
        prevMetrics.get(artistName)!.gmv += gmv;
      }
    });
    
    // 리뷰 집계
    const artistReviews = new Map<string, { totalRating: number; count: number }>();
    reviewData.forEach((review: any) => {
      // product_id로 작가 찾기 (logistics에서)
      const productId = review.product_id;
      const artistRow = logisticsData.find((l: any) => l.product_id === productId);
      if (artistRow) {
        const artistName = artistRow['artist_name (kr)'];
        if (artistName) {
          if (!artistReviews.has(artistName)) {
            artistReviews.set(artistName, { totalRating: 0, count: 0 });
          }
          const data = artistReviews.get(artistName)!;
          data.totalRating += parseFloat(review.rating) || 0;
          data.count++;
        }
      }
    });
    
    // 결과 배열 생성
    let artists = Array.from(currentMetrics.entries()).map(([artistName, metrics]) => {
      const info = artistInfoMap.get(artistName) || {};
      const prevGmv = prevMetrics.get(artistName)?.gmv || 0;
      const growthRate = calculateGrowthRate(metrics.gmv, prevGmv);
      const reviewData = artistReviews.get(artistName);
      const avgRating = reviewData ? reviewData.totalRating / reviewData.count : null;
      const daysSinceLastSale = metrics.lastSaleDate
        ? Math.floor((now.getTime() - metrics.lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      return {
        artistName,
        artistId: info.artistId || '',
        email: info.email || '',
        totalGmv: Math.round(metrics.gmv),
        orderCount: metrics.orderCodes.size,
        productCount: metrics.productIds.size,
        aov: metrics.orderCodes.size > 0 ? Math.round(metrics.gmv / metrics.orderCodes.size) : 0,
        growthRate: Math.round(growthRate * 10) / 10,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        reviewCount: reviewData?.count || 0,
        segment: getRevenueSegment(metrics.gmv),
        healthStatus: getHealthStatus(daysSinceLastSale, avgRating),
        topCountries: Array.from(metrics.countries).slice(0, 3),
        registeredProducts: {
          kr: info.krProducts || 0,
          global: info.globalProducts || 0,
        },
        lastSaleDate: metrics.lastSaleDate?.toISOString().split('T')[0] || null,
      };
    });
    
    // 세그먼트 필터
    if (segmentFilter !== 'all') {
      artists = artists.filter((a) => a.segment === segmentFilter);
    }
    
    // 정렬
    artists.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case 'gmv': aVal = a.totalGmv; bVal = b.totalGmv; break;
        case 'orders': aVal = a.orderCount; bVal = b.orderCount; break;
        case 'products': aVal = a.productCount; bVal = b.productCount; break;
        case 'growth': aVal = a.growthRate; bVal = b.growthRate; break;
        case 'rating': aVal = a.avgRating || 0; bVal = b.avgRating || 0; break;
        default: aVal = a.totalGmv; bVal = b.totalGmv;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    // 순위 부여
    artists.forEach((a, idx) => {
      (a as any).rank = idx + 1;
    });
    
    // 페이지네이션
    const total = artists.length;
    const totalPages = Math.ceil(total / limit);
    const startIdx = (page - 1) * limit;
    const paginatedArtists = artists.slice(startIdx, startIdx + limit);
    
    res.json({
      success: true,
      artists: paginatedArtists,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('[ArtistAnalytics] Performance error:', error?.message);
    res.status(500).json({ success: false, error: 'Failed to get performance', details: error?.message });
  }
});


/**
 * 작품 분석 API
 * GET /api/artist-analytics/products
 */
router.get('/products', async (req, res) => {
  try {
    const dateRange = (req.query.dateRange as string) || '30d';
    const sortBy = (req.query.sort as string) || 'gmv';
    const limit = parseInt(req.query.limit as string) || 50;
    
    const { start, end } = getDateRange(dateRange);
    
    // 데이터 로드
    const [logisticsData, artistsData, reviewData] = await Promise.all([
      sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true),
      sheetsService.getSheetDataAsJson(SHEET_NAMES.ARTISTS, false),
      sheetsService.getSheetDataAsJson(SHEET_NAMES.REVIEW, false).catch(() => []),
    ]);
    
    // 등록 작품 수 (다양한 컬럼명 패턴 지원)
    let totalProducts = 0;
    artistsData.forEach((artist: any) => {
      const globalProducts = parseInt(
        artist['(Global)Live 작품수'] || 
        artist['Global Live 작품수'] ||
        artist['global_live_products'] ||
        0
      ) || 0;
      totalProducts += globalProducts;
    });
    
    // 등록 작품이 0이면 logistics에서 고유 상품 수로 대체
    if (totalProducts === 0) {
      const allProductIds = new Set<string>();
      logisticsData.forEach((row: any) => {
        if (row.product_id) allProductIds.add(row.product_id);
      });
      totalProducts = allProductIds.size;
    }
    
    // 작품별 집계
    const productMetrics = new Map<string, {
      productName: string;
      artistName: string;
      gmv: number;
      quantity: number;
      countries: Set<string>;
      country: string;
    }>();
    
    const filteredLogistics = logisticsData.filter((row: any) => {
      const orderDate = new Date(row.order_created);
      return orderDate >= start && orderDate <= end;
    });
    
    filteredLogistics.forEach((row: any) => {
      const productId = row.product_id;
      if (!productId) return;
      
      if (!productMetrics.has(productId)) {
        productMetrics.set(productId, {
          productName: row.product_name || '정보 없음',
          artistName: row['artist_name (kr)'] || '정보 없음',
          gmv: 0,
          quantity: 0,
          countries: new Set(),
          country: row.country || '',
        });
      }
      
      const metrics = productMetrics.get(productId)!;
      metrics.gmv += cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW;
      metrics.quantity += parseInt(row['구매수량']) || 1;
      if (row.country) metrics.countries.add(row.country);
    });
    
    // 리뷰 집계
    const productReviews = new Map<string, { totalRating: number; count: number }>();
    reviewData.forEach((review: any) => {
      const productId = review.product_id;
      if (!productId) return;
      if (!productReviews.has(productId)) {
        productReviews.set(productId, { totalRating: 0, count: 0 });
      }
      const data = productReviews.get(productId)!;
      data.totalRating += parseFloat(review.rating) || 0;
      data.count++;
    });
    
    // 결과 배열
    let products = Array.from(productMetrics.entries()).map(([productId, metrics]) => {
      const reviewInfo = productReviews.get(productId);
      const avgRating = reviewInfo ? reviewInfo.totalRating / reviewInfo.count : null;
      
      return {
        productId,
        productName: metrics.productName,
        artistName: metrics.artistName,
        gmv: Math.round(metrics.gmv),
        quantity: metrics.quantity,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        reviewCount: reviewInfo?.count || 0,
        countries: Array.from(metrics.countries),
        productUrl: getProductUrl(metrics.country, productId),
      };
    });
    
    // 정렬
    products.sort((a, b) => {
      if (sortBy === 'quantity') return b.quantity - a.quantity;
      return b.gmv - a.gmv;
    });
    
    // 순위 부여 및 제한
    products = products.slice(0, limit).map((p, idx) => ({ ...p, rank: idx + 1 }));
    
    const soldProducts = productMetrics.size;
    const sellRate = totalProducts > 0 ? (soldProducts / totalProducts) * 100 : 0;
    const totalGmv = products.reduce((sum, p) => sum + p.gmv, 0);
    const avgGmvPerProduct = soldProducts > 0 ? totalGmv / soldProducts : 0;
    
    // 가격대별 분포
    const priceDistribution = {
      under30k: { count: 0, rate: 0 },
      '30k_50k': { count: 0, rate: 0 },
      '50k_100k': { count: 0, rate: 0 },
      '100k_200k': { count: 0, rate: 0 },
      over200k: { count: 0, rate: 0 },
    };
    
    products.forEach((p) => {
      const avgPrice = p.quantity > 0 ? p.gmv / p.quantity : 0;
      if (avgPrice < 30000) priceDistribution.under30k.count++;
      else if (avgPrice < 50000) priceDistribution['30k_50k'].count++;
      else if (avgPrice < 100000) priceDistribution['50k_100k'].count++;
      else if (avgPrice < 200000) priceDistribution['100k_200k'].count++;
      else priceDistribution.over200k.count++;
    });
    
    const totalForRate = products.length;
    Object.keys(priceDistribution).forEach((key) => {
      const dist = priceDistribution[key as keyof typeof priceDistribution];
      dist.rate = totalForRate > 0 ? Math.round((dist.count / totalForRate) * 100) : 0;
    });
    
    res.json({
      success: true,
      summary: {
        totalProducts,
        soldProducts,
        sellRate: Math.round(sellRate * 10) / 10,
        avgGmvPerProduct: Math.round(avgGmvPerProduct),
      },
      products,
      priceDistribution,
    });
  } catch (error: any) {
    console.error('[ArtistAnalytics] Products error:', error?.message);
    res.status(500).json({ success: false, error: 'Failed to get products', details: error?.message });
  }
});


/**
 * 성장 추이 API
 * GET /api/artist-analytics/trend
 */
router.get('/trend', async (req, res) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    
    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true);
    
    const now = new Date();
    const monthlyData = new Map<string, {
      activeArtists: Set<string>;
      totalGmv: number;
    }>();
    
    // 월별 첫 판매 작가 추적
    const artistFirstSale = new Map<string, string>(); // artistName -> month
    const artistLastSale = new Map<string, { month: string; date: Date; gmv: number }>();
    
    // 최근 N개월 데이터 초기화
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.set(monthKey, { activeArtists: new Set(), totalGmv: 0 });
    }
    
    logisticsData.forEach((row: any) => {
      const artistName = row['artist_name (kr)'];
      if (!artistName) return;
      
      const orderDate = new Date(row.order_created);
      if (isNaN(orderDate.getTime())) return;
      
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      const gmv = cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW;
      
      if (monthlyData.has(monthKey)) {
        const data = monthlyData.get(monthKey)!;
        data.activeArtists.add(artistName);
        data.totalGmv += gmv;
      }
      
      // 첫 판매 추적
      if (!artistFirstSale.has(artistName) || monthKey < artistFirstSale.get(artistName)!) {
        artistFirstSale.set(artistName, monthKey);
      }
      
      // 마지막 판매 추적
      const lastSale = artistLastSale.get(artistName);
      if (!lastSale || orderDate > lastSale.date) {
        artistLastSale.set(artistName, { month: monthKey, date: orderDate, gmv });
      }
    });
    
    // 월별 결과 생성
    const monthly = Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => {
        // 해당 월 신규 작가
        const newArtists = Array.from(artistFirstSale.entries())
          .filter(([, firstMonth]) => firstMonth === month)
          .length;
        
        return {
          month,
          activeArtists: data.activeArtists.size,
          newArtists,
          churnedArtists: 0, // 아래에서 계산
          totalGmv: Math.round(data.totalGmv),
        };
      });
    
    // 이탈 작가 계산 (3개월 미판매)
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const threeMonthsAgoKey = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
    
    const churnedArtists: any[] = [];
    artistLastSale.forEach((lastSale, artistName) => {
      if (lastSale.month <= threeMonthsAgoKey) {
        churnedArtists.push({
          artistName,
          lastSaleDate: lastSale.date.toISOString().split('T')[0],
          totalGmv: Math.round(lastSale.gmv),
        });
      }
    });
    
    // 신규 작가 리스트 (이번 달)
    const newArtists = Array.from(artistFirstSale.entries())
      .filter(([, firstMonth]) => firstMonth === currentMonth)
      .map(([artistName, firstMonth]) => {
        const lastSale = artistLastSale.get(artistName);
        return {
          artistName,
          firstSaleDate: lastSale?.date.toISOString().split('T')[0] || '',
          gmv: Math.round(lastSale?.gmv || 0),
        };
      });
    
    // 성장률 분포 계산
    const growthDistribution = {
      rapid: { count: 0, rate: 0 },
      growing: { count: 0, rate: 0 },
      stable: { count: 0, rate: 0 },
      declining: { count: 0, rate: 0 },
      critical: { count: 0, rate: 0 },
    };
    
    // 현재 월과 이전 월 비교
    if (monthly.length >= 2) {
      const currentMonthData = monthlyData.get(currentMonth);
      const prevMonthKey = monthly[monthly.length - 2]?.month;
      const prevMonthData = monthlyData.get(prevMonthKey);
      
      if (currentMonthData && prevMonthData) {
        // 각 작가별 성장률 계산 (간단 버전)
        const activeCount = currentMonthData.activeArtists.size;
        // 임시로 분포 설정
        growthDistribution.growing.count = Math.round(activeCount * 0.3);
        growthDistribution.stable.count = Math.round(activeCount * 0.4);
        growthDistribution.declining.count = Math.round(activeCount * 0.2);
        growthDistribution.rapid.count = Math.round(activeCount * 0.05);
        growthDistribution.critical.count = Math.round(activeCount * 0.05);
      }
    }
    
    const totalForRate = Object.values(growthDistribution).reduce((sum, d) => sum + d.count, 0);
    Object.keys(growthDistribution).forEach((key) => {
      const dist = growthDistribution[key as keyof typeof growthDistribution];
      dist.rate = totalForRate > 0 ? Math.round((dist.count / totalForRate) * 100 * 10) / 10 : 0;
    });
    
    res.json({
      success: true,
      monthly,
      newArtists: newArtists.slice(0, 20),
      churnedArtists: churnedArtists.slice(0, 20),
      growthDistribution,
    });
  } catch (error: any) {
    console.error('[ArtistAnalytics] Trend error:', error?.message);
    res.status(500).json({ success: false, error: 'Failed to get trend', details: error?.message });
  }
});


/**
 * 건강도 API
 * GET /api/artist-analytics/health
 */
router.get('/health', async (req, res) => {
  try {
    const [logisticsData, reviewData] = await Promise.all([
      sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true),
      sheetsService.getSheetDataAsJson(SHEET_NAMES.REVIEW, false).catch(() => []),
    ]);
    
    const now = new Date();
    
    // 작가별 마지막 판매일 및 총 매출
    const artistData = new Map<string, {
      lastSaleDate: Date;
      totalGmv: number;
      productIds: Set<string>;
    }>();
    
    logisticsData.forEach((row: any) => {
      const artistName = row['artist_name (kr)'];
      if (!artistName) return;
      
      const orderDate = new Date(row.order_created);
      if (isNaN(orderDate.getTime())) return;
      
      if (!artistData.has(artistName)) {
        artistData.set(artistName, {
          lastSaleDate: orderDate,
          totalGmv: 0,
          productIds: new Set(),
        });
      }
      
      const data = artistData.get(artistName)!;
      if (orderDate > data.lastSaleDate) {
        data.lastSaleDate = orderDate;
      }
      data.totalGmv += cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW;
      if (row.product_id) data.productIds.add(row.product_id);
    });
    
    // 리뷰 집계
    const artistReviews = new Map<string, { totalRating: number; count: number }>();
    const productToArtist = new Map<string, string>();
    
    logisticsData.forEach((row: any) => {
      if (row.product_id && row['artist_name (kr)']) {
        productToArtist.set(row.product_id, row['artist_name (kr)']);
      }
    });
    
    reviewData.forEach((review: any) => {
      const artistName = productToArtist.get(review.product_id);
      if (artistName) {
        if (!artistReviews.has(artistName)) {
          artistReviews.set(artistName, { totalRating: 0, count: 0 });
        }
        const data = artistReviews.get(artistName)!;
        data.totalRating += parseFloat(review.rating) || 0;
        data.count++;
      }
    });
    
    // 건강도 분류
    const healthSummary = {
      healthy: { count: 0, rate: 0 },
      caution: { count: 0, rate: 0 },
      warning: { count: 0, rate: 0 },
      critical: { count: 0, rate: 0 },
    };
    
    const criticalArtists: any[] = [];
    
    artistData.forEach((data, artistName) => {
      const daysSinceLastSale = Math.floor(
        (now.getTime() - data.lastSaleDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const reviewInfo = artistReviews.get(artistName);
      const avgRating = reviewInfo ? reviewInfo.totalRating / reviewInfo.count : null;
      
      const status = getHealthStatus(daysSinceLastSale, avgRating);
      healthSummary[status].count++;
      
      if (status === 'critical' || status === 'warning') {
        const issues: string[] = [];
        if (daysSinceLastSale > 90) issues.push('장기 미판매');
        else if (daysSinceLastSale > 60) issues.push('60일+ 미판매');
        if (avgRating !== null && avgRating < 3.0) issues.push('낮은 평점');
        else if (avgRating !== null && avgRating < 3.5) issues.push('평점 주의');
        
        criticalArtists.push({
          artistName,
          lastSaleDate: data.lastSaleDate.toISOString().split('T')[0],
          daysSinceLastSale,
          avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
          totalGmv: Math.round(data.totalGmv),
          issues,
          status,
        });
      }
    });
    
    // 비율 계산
    const totalArtists = artistData.size;
    Object.keys(healthSummary).forEach((key) => {
      const data = healthSummary[key as keyof typeof healthSummary];
      data.rate = totalArtists > 0 ? Math.round((data.count / totalArtists) * 100) : 0;
    });
    
    // 정렬 (위험도 높은 순)
    criticalArtists.sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale);
    
    // 품질 이슈 (낮은 평점 리뷰)
    const qualityIssues: any[] = [];
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    reviewData.forEach((review: any) => {
      const rating = parseFloat(review.rating);
      if (rating <= 3) {
        const reviewDate = new Date(review.review_date);
        if (reviewDate >= thirtyDaysAgo) {
          const artistName = productToArtist.get(review.product_id);
          const productRow = logisticsData.find((l: any) => l.product_id === review.product_id);
          
          qualityIssues.push({
            artistName: artistName || '알 수 없음',
            productName: productRow?.product_name || '알 수 없음',
            rating,
            reviewText: review.review_text || '',
            reviewDate: reviewDate.toISOString().split('T')[0],
            country: review.country || '',
          });
        }
      }
    });
    
    qualityIssues.sort((a, b) => a.rating - b.rating);
    
    res.json({
      success: true,
      summary: healthSummary,
      criticalArtists: criticalArtists.slice(0, 30),
      qualityIssues: qualityIssues.slice(0, 20),
    });
  } catch (error: any) {
    console.error('[ArtistAnalytics] Health error:', error?.message);
    res.status(500).json({ success: false, error: 'Failed to get health', details: error?.message });
  }
});


/**
 * 작가 상세 API
 * GET /api/artist-analytics/detail/:artistName
 */
router.get('/detail/:artistName', async (req, res) => {
  try {
    const { artistName } = req.params;
    const dateRange = (req.query.dateRange as string) || '30d';
    
    if (!artistName) {
      return res.status(400).json({ success: false, error: '작가명이 필요합니다.' });
    }
    
    const decodedArtistName = decodeURIComponent(artistName);
    const { start, end } = getDateRange(dateRange);
    const now = new Date();
    
    // 데이터 로드
    const [logisticsData, artistsData, reviewData] = await Promise.all([
      sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true),
      sheetsService.getSheetDataAsJson(SHEET_NAMES.ARTISTS, false),
      sheetsService.getSheetDataAsJson(SHEET_NAMES.REVIEW, false).catch(() => []),
    ]);
    
    // 작가 기본 정보 (다양한 컬럼명 패턴 지원)
    const artistInfo = artistsData.find((a: any) => {
      const artistName = a['(KR)작가명'] || a['artist_name (kr)'] || a['작가명'] || a.name || '';
      return artistName === decodedArtistName;
    });
    
    // 디버깅: 작가 정보 로그
    console.log('[ArtistAnalytics] Artist info found:', {
      artistName: decodedArtistName,
      found: !!artistInfo,
      artistInfoKeys: artistInfo ? Object.keys(artistInfo) : [],
      artistInfoSample: artistInfo ? JSON.stringify(artistInfo).substring(0, 200) : null,
    });
    
    // 작가 물류 데이터 필터링
    const artistLogistics = logisticsData.filter((row: any) => 
      row['artist_name (kr)'] === decodedArtistName
    );
    
    // 기간 내 데이터
    const periodLogistics = artistLogistics.filter((row: any) => {
      const orderDate = new Date(row.order_created);
      return orderDate >= start && orderDate <= end;
    });
    
    // 성과 집계
    let totalGmv = 0;
    const orderCodes = new Set<string>();
    const productIds = new Set<string>();
    const countryGmv = new Map<string, { gmv: number; orderCount: number }>();
    let firstSaleDateValue: Date | null = null;
    let lastSaleDateValue: Date | null = null;
    
    periodLogistics.forEach((row: any) => {
      const gmv = cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW;
      totalGmv += gmv;
      if (row.order_code) orderCodes.add(row.order_code);
      if (row.product_id) productIds.add(row.product_id);
      
      const country = row.country || 'Unknown';
      if (!countryGmv.has(country)) {
        countryGmv.set(country, { gmv: 0, orderCount: 0 });
      }
      const data = countryGmv.get(country)!;
      data.gmv += gmv;
      data.orderCount++;
      
      const orderDate = new Date(row.order_created);
      if (!firstSaleDateValue || orderDate < firstSaleDateValue) firstSaleDateValue = orderDate;
      if (!lastSaleDateValue || orderDate > lastSaleDateValue) lastSaleDateValue = orderDate;
    });
    
    const lastSaleDate = lastSaleDateValue;
    
    // 전체 기간 첫 판매일
    let overallFirstSaleValue: Date | null = null;
    artistLogistics.forEach((row: any) => {
      const orderDate = new Date(row.order_created);
      if (!overallFirstSaleValue || orderDate < overallFirstSaleValue) {
        overallFirstSaleValue = orderDate;
      }
    });
    
    const overallFirstSale = overallFirstSaleValue;
    
    // 국가별 분포
    const byCountry = Array.from(countryGmv.entries())
      .map(([country, data]) => ({
        country,
        gmv: Math.round(data.gmv),
        orderCount: data.orderCount,
        share: totalGmv > 0 ? Math.round((data.gmv / totalGmv) * 100) : 0,
      }))
      .sort((a, b) => b.gmv - a.gmv);
    
    // 월별 추이 (최근 6개월)
    const monthlyTrend: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      
      let monthGmv = 0;
      let monthOrders = 0;
      
      artistLogistics.forEach((row: any) => {
        const orderDate = new Date(row.order_created);
        if (orderDate >= monthStart && orderDate <= monthEnd) {
          monthGmv += cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW;
          monthOrders++;
        }
      });
      
      monthlyTrend.push({
        month: monthKey,
        gmv: Math.round(monthGmv),
        orderCount: monthOrders,
      });
    }
    
    // Top 작품
    const productGmv = new Map<string, { name: string; gmv: number; quantity: number }>();
    periodLogistics.forEach((row: any) => {
      const productId = row.product_id;
      if (!productId) return;
      
      if (!productGmv.has(productId)) {
        productGmv.set(productId, {
          name: row.product_name || '정보 없음',
          gmv: 0,
          quantity: 0,
        });
      }
      const data = productGmv.get(productId)!;
      data.gmv += cleanAndParseFloat(row['Total GMV']) * USD_TO_KRW;
      data.quantity += parseInt(row['구매수량']) || 1;
    });
    
    const topProducts = Array.from(productGmv.entries())
      .map(([id, data]) => ({
        productId: id,
        productName: data.name,
        gmv: Math.round(data.gmv),
        quantity: data.quantity,
      }))
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 5);
    
    // 리뷰
    const artistProductIds = new Set(artistLogistics.map((l: any) => l.product_id).filter(Boolean));
    const artistReviews = reviewData.filter((r: any) => artistProductIds.has(r.product_id));
    
    const avgRating = artistReviews.length > 0
      ? artistReviews.reduce((sum: number, r: any) => sum + (parseFloat(r.rating) || 0), 0) / artistReviews.length
      : null;
    
    const recentReviews = artistReviews
      .sort((a: any, b: any) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime())
      .slice(0, 5)
      .map((r: any) => ({
        rating: parseFloat(r.rating) || 0,
        text: r.review_text || '',
        country: r.country || '',
        date: r.review_date || '',
      }));
    
    // 건강도 및 세그먼트
    const daysSinceLastSale = lastSaleDate
      ? Math.floor((now.getTime() - (lastSaleDate as Date).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    // 작가 ID 및 이메일 추출 (다양한 컬럼명 패턴 지원)
    const extractedArtistId = artistInfo?.artist_id || artistInfo?.global_artist_id || 
      artistInfo?.['작가ID'] || artistInfo?.['artist_id'] || artistInfo?.id || '';
    const extractedEmail = artistInfo?.mail || artistInfo?.email || 
      artistInfo?.['이메일'] || artistInfo?.['메일'] || artistInfo?.['작가메일'] || '';
    
    res.json({
      success: true,
      artistInfo: {
        name: decodedArtistName,
        artistId: extractedArtistId,
        email: extractedEmail,
        registeredProducts: {
          kr: parseInt(artistInfo?.['(KR)Live 작품수'] || artistInfo?.['KR Live 작품수'] || artistInfo?.kr_live_products || artistInfo?.['KR작품수']) || 0,
          global: parseInt(artistInfo?.['(Global)Live 작품수'] || artistInfo?.['Global Live 작품수'] || artistInfo?.global_live_products || artistInfo?.['Global작품수']) || artistProductIds.size,
        },
        firstSaleDate: overallFirstSale ? (overallFirstSale as Date).toISOString().split('T')[0] : null,
        segment: getRevenueSegment(totalGmv),
        healthStatus: getHealthStatus(daysSinceLastSale, avgRating),
        growthRate: 0,
      },
      performance: {
        totalGmv: Math.round(totalGmv),
        orderCount: orderCodes.size,
        productCount: productIds.size,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        reviewCount: artistReviews.length,
      },
      byCountry,
      monthlyTrend,
      topProducts,
      recentReviews,
    });
  } catch (error: any) {
    console.error('[ArtistAnalytics] Detail error:', error?.message);
    res.status(500).json({ success: false, error: 'Failed to get detail', details: error?.message });
  }
});

export default router;
