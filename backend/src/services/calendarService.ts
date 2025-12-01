/**
 * 글로벌 마케팅 캘린더 서비스
 * 35개국 기념일/시즌 관리 및 AI 마케팅 전략 생성
 */

import GLOBAL_HOLIDAYS, { GlobalHoliday, HolidayCategory } from '../data/globalHolidays';

// 국가 정보
export const COUNTRIES: Record<string, { name: string; tier: number; flag: string; region: string }> = {
  // Tier 1 - 핵심 시장
  'JP': { name: '일본', tier: 1, flag: '🇯🇵', region: 'asia' },
  'HK': { name: '홍콩', tier: 1, flag: '🇭🇰', region: 'asia' },
  'SG': { name: '싱가포르', tier: 1, flag: '🇸🇬', region: 'asia' },
  // Tier 2 - 동남아
  'ID': { name: '인도네시아', tier: 2, flag: '🇮🇩', region: 'asia' },
  'MY': { name: '말레이시아', tier: 2, flag: '🇲🇾', region: 'asia' },
  'TW': { name: '대만', tier: 2, flag: '🇹🇼', region: 'asia' },
  'VN': { name: '베트남', tier: 2, flag: '🇻🇳', region: 'asia' },
  // Tier 3 - 영미권
  'AU': { name: '호주', tier: 3, flag: '🇦🇺', region: 'oceania' },
  'CA': { name: '캐나다', tier: 3, flag: '🇨🇦', region: 'america' },
  'NZ': { name: '뉴질랜드', tier: 3, flag: '🇳🇿', region: 'oceania' },
  'US': { name: '미국', tier: 3, flag: '🇺🇸', region: 'america' },
  // Tier 4 - 유럽/기타
  'AT': { name: '오스트리아', tier: 4, flag: '🇦🇹', region: 'europe' },
  'BE': { name: '벨기에', tier: 4, flag: '🇧🇪', region: 'europe' },
  'BR': { name: '브라질', tier: 4, flag: '🇧🇷', region: 'america' },
  'CH': { name: '스위스', tier: 4, flag: '🇨🇭', region: 'europe' },
  'CZ': { name: '체코', tier: 4, flag: '🇨🇿', region: 'europe' },
  'DE': { name: '독일', tier: 4, flag: '🇩🇪', region: 'europe' },
  'DK': { name: '덴마크', tier: 4, flag: '🇩🇰', region: 'europe' },
  'ES': { name: '스페인', tier: 4, flag: '🇪🇸', region: 'europe' },
  'FI': { name: '핀란드', tier: 4, flag: '🇫🇮', region: 'europe' },
  'FR': { name: '프랑스', tier: 4, flag: '🇫🇷', region: 'europe' },
  'GB': { name: '영국', tier: 4, flag: '🇬🇧', region: 'europe' },
  'HU': { name: '헝가리', tier: 4, flag: '🇭🇺', region: 'europe' },
  'IE': { name: '아일랜드', tier: 4, flag: '🇮🇪', region: 'europe' },
  'IL': { name: '이스라엘', tier: 4, flag: '🇮🇱', region: 'middleeast' },
  'IN': { name: '인도', tier: 4, flag: '🇮🇳', region: 'asia' },
  'IT': { name: '이탈리아', tier: 4, flag: '🇮🇹', region: 'europe' },
  'MX': { name: '멕시코', tier: 4, flag: '🇲🇽', region: 'america' },
  'NL': { name: '네덜란드', tier: 4, flag: '🇳🇱', region: 'europe' },
  'NO': { name: '노르웨이', tier: 4, flag: '🇳🇴', region: 'europe' },
  'PH': { name: '필리핀', tier: 4, flag: '🇵🇭', region: 'asia' },
  'PL': { name: '폴란드', tier: 4, flag: '🇵🇱', region: 'europe' },
  'PT': { name: '포르투갈', tier: 4, flag: '🇵🇹', region: 'europe' },
  'SE': { name: '스웨덴', tier: 4, flag: '🇸🇪', region: 'europe' },
  'TH': { name: '태국', tier: 4, flag: '🇹🇭', region: 'asia' },
  'TR': { name: '터키', tier: 4, flag: '🇹🇷', region: 'europe' },
  'AE': { name: 'UAE', tier: 4, flag: '🇦🇪', region: 'middleeast' },
  'ZA': { name: '남아공', tier: 4, flag: '🇿🇦', region: 'africa' },
  'CN': { name: '중국', tier: 4, flag: '🇨🇳', region: 'asia' },
  'RU': { name: '러시아', tier: 4, flag: '🇷🇺', region: 'europe' },
};

// idus 카테고리 매핑
const IDUS_CATEGORIES = [
  { id: 'accessory', name: '액세서리', keywords: ['액세서리', '쥬얼리', '반지', '목걸이', '귀걸이', '팔찌'] },
  { id: 'interior', name: '인테리어', keywords: ['인테리어', '홈데코', '데코', '장식'] },
  { id: 'candle', name: '캔들/디퓨저', keywords: ['캔들', '향초', '디퓨저', '향수', '향기'] },
  { id: 'fashion', name: '패션', keywords: ['패션', '의류', '니트', '옷', '의상'] },
  { id: 'beauty', name: '뷰티', keywords: ['뷰티', '화장품', '스킨케어', '메이크업'] },
  { id: 'bag', name: '가방/파우치', keywords: ['가방', '파우치', '지갑', '가죽소품'] },
  { id: 'stationery', name: '문구', keywords: ['문구', '다이어리', '캘린더', '플래너', '노트'] },
  { id: 'craft', name: '공예', keywords: ['공예', '전통공예', '수공예', '핸드메이드'] },
  { id: 'food', name: '푸드', keywords: ['푸드', '식품', '과자', '초콜릿', '화과자'] },
  { id: 'flower', name: '플라워', keywords: ['플라워', '꽃', '드라이플라워', '화분'] },
  { id: 'kids', name: '키즈', keywords: ['키즈', '어린이', '아이', '장난감', '완구'] },
  { id: 'pet', name: '반려동물', keywords: ['반려동물', '펫', '강아지', '고양이'] },
  { id: 'kitchenware', name: '키친웨어', keywords: ['키친', '주방', '식기', '테이블웨어', '그릇'] },
  { id: 'outdoor', name: '아웃도어', keywords: ['아웃도어', '캠핑', '피크닉', '야외'] },
];

// 마케팅 전략 인터페이스
export interface MarketingStrategy {
  holidayId: string;
  holidayName: string;
  country: string;
  countryName: string;
  daysUntil: number;
  
  categoryRecommendations: {
    rank: number;
    categoryId: string;
    categoryName: string;
    reason: string;
    expectedDemandScore: number;
    suggestedProducts: string[];
  }[];
  
  promotionStrategy: {
    timeline: {
      phase: 'awareness' | 'consideration' | 'conversion' | 'retention';
      phaseName: string;
      startDate: string;
      endDate: string;
      actions: string[];
      channels: string[];
    }[];
    discountSuggestion?: {
      type: 'percentage' | 'fixed' | 'freeShipping' | 'bundle';
      value: number;
      rationale: string;
    };
    bundleSuggestion?: {
      theme: string;
      products: string[];
    };
  };
  
  contentStrategy: {
    themes: string[];
    keyMessages: {
      korean: string;
      english: string;
      local?: string;
    };
    visualGuidelines: string[];
    hashtags: string[];
    platforms: string[];
    contentIdeas: string[];
  };
  
  targetAudience: {
    primary: string;
    secondary?: string;
    behaviors: string[];
  };
  
  projectedImpact: {
    trafficIncrease: string;
    conversionLift: string;
    revenueOpportunity: string;
    confidence: 'high' | 'medium' | 'low';
  };
  
  alerts: {
    type: 'warning' | 'tip' | 'info';
    message: string;
  }[];
  
  generatedAt: string;
}

/**
 * 기념일 목록 조회
 */
export function getHolidays(params: {
  year?: number;
  month?: number;
  countries?: string[];
  tier?: number;
  category?: HolidayCategory;
  importance?: string;
}): GlobalHoliday[] {
  let holidays = [...GLOBAL_HOLIDAYS];

  // 월 필터
  if (params.month) {
    holidays = holidays.filter(h => h.date.month === params.month);
  }

  // 국가 필터
  if (params.countries && params.countries.length > 0) {
    holidays = holidays.filter(h => 
      h.countries.some(c => params.countries!.includes(c))
    );
  }

  // Tier 필터
  if (params.tier) {
    holidays = holidays.filter(h =>
      h.countries.some(c => COUNTRIES[c]?.tier === params.tier)
    );
  }

  // 카테고리 필터
  if (params.category) {
    holidays = holidays.filter(h => h.category === params.category);
  }

  // 중요도 필터
  if (params.importance) {
    holidays = holidays.filter(h => h.importance === params.importance);
  }

  return holidays.sort((a, b) => {
    if (a.date.month !== b.date.month) return a.date.month - b.date.month;
    return a.date.day - b.date.day;
  });
}

/**
 * 특정 기념일 조회
 */
export function getHolidayById(id: string): GlobalHoliday | null {
  return GLOBAL_HOLIDAYS.find(h => h.id === id) || null;
}

/**
 * 다가오는 기념일 조회
 */
export function getUpcomingHolidays(days: number = 30, countries?: string[]): (GlobalHoliday & { daysUntil: number })[] {
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  const upcoming = GLOBAL_HOLIDAYS.filter(holiday => {
    // 시즌 이벤트 제외 (월 전체인 경우)
    if (holiday.date.rule?.includes('전체')) return false;
    
    // 국가 필터
    if (countries && countries.length > 0) {
      if (!holiday.countries.some(c => countries.includes(c))) return false;
    }

    const holidayDate = new Date(
      holiday.date.year || today.getFullYear(),
      holiday.date.month - 1,
      holiday.date.day
    );

    // 올해 이미 지났으면 내년으로
    if (holidayDate < today) {
      holidayDate.setFullYear(holidayDate.getFullYear() + 1);
    }

    return holidayDate >= today && holidayDate <= futureDate;
  }).map(holiday => {
    const holidayDate = new Date(
      holiday.date.year || today.getFullYear(),
      holiday.date.month - 1,
      holiday.date.day
    );
    if (holidayDate < today) {
      holidayDate.setFullYear(holidayDate.getFullYear() + 1);
    }
    const daysUntil = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return { ...holiday, daysUntil };
  });

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * 국가 목록 조회
 */
export function getCountries(tier?: number): typeof COUNTRIES {
  if (!tier) return COUNTRIES;
  
  return Object.fromEntries(
    Object.entries(COUNTRIES).filter(([, info]) => info.tier === tier)
  );
}

/**
 * 카테고리 추천 생성
 */
function generateCategoryRecommendations(
  holiday: GlobalHoliday,
  country: string
): MarketingStrategy['categoryRecommendations'] {
  const recommendations: MarketingStrategy['categoryRecommendations'] = [];
  const holidayKeywords = [
    ...holiday.marketing.recommendedCategories,
    ...holiday.marketing.keyTrends,
  ].map(k => k.toLowerCase());

  // idus 카테고리와 매칭
  IDUS_CATEGORIES.forEach(cat => {
    let score = 0;
    let matchedKeywords: string[] = [];
    
    // 직접 매칭
    if (holiday.marketing.recommendedCategories.some(rc => 
      cat.keywords.some(k => rc.toLowerCase().includes(k) || k.includes(rc.toLowerCase()))
    )) {
      score += 50;
      matchedKeywords.push(...cat.keywords.filter(k => 
        holiday.marketing.recommendedCategories.some(rc => rc.toLowerCase().includes(k))
      ));
    }
    
    // 트렌드 키워드 매칭
    holiday.marketing.keyTrends.forEach(trend => {
      if (cat.keywords.some(k => trend.toLowerCase().includes(k) || k.includes(trend.toLowerCase()))) {
        score += 20;
        matchedKeywords.push(trend);
      }
    });

    // 기념일 특성에 따른 가중치
    if (holiday.marketing.giftGiving && ['accessory', 'candle', 'beauty', 'fashion'].includes(cat.id)) {
      score += 15;
    }
    if (holiday.category === 'romantic' && ['accessory', 'flower', 'candle'].includes(cat.id)) {
      score += 20;
    }
    if (holiday.category === 'family' && ['interior', 'kitchenware', 'flower'].includes(cat.id)) {
      score += 15;
    }

    if (score > 0) {
      recommendations.push({
        rank: 0, // 나중에 정렬 후 설정
        categoryId: cat.id,
        categoryName: cat.name,
        reason: `${holiday.name.korean}의 ${matchedKeywords.slice(0, 3).join(', ')} 트렌드와 높은 연관성`,
        expectedDemandScore: Math.min(95, score + 30),
        suggestedProducts: generateProductSuggestions(cat.id, holiday),
      });
    }
  });

  // 점수 기준 정렬 및 순위 설정
  recommendations.sort((a, b) => b.expectedDemandScore - a.expectedDemandScore);
  recommendations.forEach((rec, idx) => { rec.rank = idx + 1; });

  return recommendations.slice(0, 5);
}

/**
 * 상품 제안 생성
 */
function generateProductSuggestions(categoryId: string, holiday: GlobalHoliday): string[] {
  const suggestions: Record<string, string[]> = {
    accessory: ['핸드메이드 귀걸이', '원석 목걸이', '실버 반지', '팔찌 세트'],
    interior: ['아로마 캔들 홀더', '드라이플라워 장식', '리넨 쿠션커버', '핸드메이드 화병'],
    candle: ['소이 캔들', '우드윅 캔들', '디퓨저 세트', '아로마 오일'],
    fashion: ['니트 머플러', '핸드메이드 모자', '리넨 에코백', '실크 스카프'],
    beauty: ['천연 비누', '립밤 세트', '핸드크림', '바디오일'],
    bag: ['가죽 카드지갑', '미니 파우치', '에코백', '크로스백'],
    stationery: ['가죽 다이어리', '캘리그라피 카드', '스티커 세트', '북마크'],
    craft: ['도자기 소품', '목공예품', '자수 키트', '라탄 바구니'],
    food: ['수제 쿠키', '초콜릿 세트', '잼 세트', '차 선물세트'],
    flower: ['드라이플라워 부케', '미니 화분', '프리저브드 플라워', '꽃다발'],
    kids: ['목각 장난감', '인형', '그림책', '미술 키트'],
    pet: ['펫 반다나', '수제 간식', '펫 침대', '장난감'],
    kitchenware: ['수제 그릇', '컵 세트', '커틀러리', '앞치마'],
    outdoor: ['피크닉 바구니', '캠핑 소품', '아웃도어 매트', '보온병'],
  };

  // 기념일 특성에 맞는 상품 추가
  const base = suggestions[categoryId] || [];
  
  if (holiday.context.colors?.includes('red')) {
    base.push('레드 컬러 아이템');
  }
  if (holiday.marketing.giftGiving) {
    base.push('선물 포장 세트');
  }
  
  return base.slice(0, 4);
}

/**
 * 마케팅 전략 생성
 */
export function generateMarketingStrategy(
  holidayId: string,
  country: string,
  options?: {
    budget?: 'low' | 'medium' | 'high';
    channels?: string[];
  }
): MarketingStrategy | null {
  const holiday = getHolidayById(holidayId);
  if (!holiday) return null;

  const countryInfo = COUNTRIES[country];
  if (!countryInfo) return null;

  const today = new Date();
  const holidayDate = new Date(
    holiday.date.year || today.getFullYear(),
    holiday.date.month - 1,
    holiday.date.day
  );
  if (holidayDate < today) {
    holidayDate.setFullYear(holidayDate.getFullYear() + 1);
  }
  const daysUntil = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // 카테고리 추천
  const categoryRecommendations = generateCategoryRecommendations(holiday, country);

  // 타임라인 생성
  const leadTime = holiday.marketing.leadTimeDays;
  const timeline: MarketingStrategy['promotionStrategy']['timeline'] = [
    {
      phase: 'awareness',
      phaseName: '인지도 확보',
      startDate: `D-${leadTime}`,
      endDate: `D-${Math.floor(leadTime * 0.6)}`,
      actions: [
        'SNS 티저 콘텐츠 게시',
        `${holiday.name.korean} 테마 무드보드 공유`,
        '관련 해시태그 캠페인 시작',
      ],
      channels: ['Instagram', 'Facebook', 'Blog'],
    },
    {
      phase: 'consideration',
      phaseName: '고려 단계',
      startDate: `D-${Math.floor(leadTime * 0.6)}`,
      endDate: 'D-7',
      actions: [
        '추천 상품 카탈로그 노출',
        '리뷰 하이라이트 캠페인',
        '선물 가이드 콘텐츠',
      ],
      channels: ['Email', 'Push', 'Instagram'],
    },
    {
      phase: 'conversion',
      phaseName: '전환 유도',
      startDate: 'D-7',
      endDate: 'D-Day',
      actions: holiday.marketing.discountExpected
        ? ['한정 할인 프로모션', '긴급성 메시지 (품절 임박)', '장바구니 리마인더']
        : ['프리미엄 패키징 강조', '한정판 메시지', '빠른 배송 보장'],
      channels: ['Push', 'Email', 'SMS'],
    },
    {
      phase: 'retention',
      phaseName: '재구매 유도',
      startDate: 'D+1',
      endDate: 'D+7',
      actions: [
        '구매 감사 메시지',
        '리뷰 요청 캠페인',
        '다음 시즌 미리보기',
      ],
      channels: ['Email', 'Push'],
    },
  ];

  // 할인 제안
  let discountSuggestion: MarketingStrategy['promotionStrategy']['discountSuggestion'] | undefined;
  if (holiday.marketing.discountExpected) {
    discountSuggestion = holiday.category === 'shopping'
      ? { type: 'percentage', value: 20, rationale: `${holiday.name.korean}은 대규모 할인이 기대되는 쇼핑 이벤트입니다.` }
      : { type: 'percentage', value: 10, rationale: `${holiday.name.korean} 시즌 고객 유입을 위한 적정 할인율입니다.` };
  } else if (holiday.marketing.giftGiving) {
    discountSuggestion = {
      type: 'freeShipping',
      value: 0,
      rationale: '선물 구매 시즌에는 할인보다 무료배송이 더 효과적입니다.',
    };
  }

  // 콘텐츠 전략
  const contentStrategy: MarketingStrategy['contentStrategy'] = {
    themes: holiday.marketing.keyTrends,
    keyMessages: {
      korean: `${holiday.name.korean}을(를) 특별하게, idus의 핸드메이드와 함께`,
      english: `Make your ${holiday.name.english} special with idus handmade`,
      local: holiday.name.local !== holiday.name.english ? holiday.name.local : undefined,
    },
    visualGuidelines: [
      ...(holiday.context.colors || []).map(c => `${c} 컬러 활용`),
      ...(holiday.context.symbols || []).slice(0, 2).map(s => `${s} 모티프 적용`),
    ],
    hashtags: [
      `#${holiday.name.korean.replace(/\s/g, '')}`,
      ...holiday.marketing.keyTrends.slice(0, 4).map(t => `#${t}`),
      '#idus',
      '#핸드메이드',
    ],
    platforms: ['Instagram', 'Facebook', 'Blog'],
    contentIdeas: [
      `${holiday.name.korean} 선물 가이드: TOP 10 추천 아이템`,
      `핸드메이드로 전하는 ${holiday.marketing.keyTrends[0]} 감성`,
      `${countryInfo.name} ${holiday.name.korean} 트렌드 분석`,
      `작가님들의 ${holiday.name.korean} 특별 컬렉션`,
    ],
  };

  // 타겟 오디언스
  const targetAudience: MarketingStrategy['targetAudience'] = {
    primary: holiday.marketing.targetAudience?.[0] || '20-40대',
    secondary: holiday.marketing.targetAudience?.[1],
    behaviors: holiday.marketing.giftGiving 
      ? ['선물 구매자', '감성 소비 선호', '프리미엄 제품 관심']
      : ['셀프 리워드', '시즌 트렌드 민감', '가치 소비'],
  };

  // 예상 효과
  const projectedImpact: MarketingStrategy['projectedImpact'] = {
    trafficIncrease: holiday.importance === 'major' ? '+30~50%' : holiday.importance === 'medium' ? '+15~25%' : '+5~15%',
    conversionLift: holiday.marketing.giftGiving ? '+2~3%p' : '+1~2%p',
    revenueOpportunity: holiday.importance === 'major' ? '상' : holiday.importance === 'medium' ? '중' : '하',
    confidence: daysUntil >= leadTime ? 'high' : daysUntil >= 7 ? 'medium' : 'low',
  };

  // 알림
  const alerts: MarketingStrategy['alerts'] = [];
  
  if (daysUntil < leadTime) {
    alerts.push({
      type: 'warning',
      message: `권장 준비 기간(${leadTime}일)보다 적은 시간이 남았습니다. 긴급 캠페인 진행을 권장합니다.`,
    });
  }
  
  if (holiday.context.doNots && holiday.context.doNots.length > 0) {
    alerts.push({
      type: 'warning',
      message: `주의사항: ${holiday.context.doNots.join(', ')}`,
    });
  }
  
  if (holiday.marketing.giftGiving) {
    alerts.push({
      type: 'tip',
      message: '선물 포장 서비스와 메시지 카드 옵션을 강조하세요.',
    });
  }

  if (countryInfo.tier === 1) {
    alerts.push({
      type: 'info',
      message: `${countryInfo.name}은 Tier 1 핵심 시장입니다. 집중 리소스 투입을 권장합니다.`,
    });
  }

  return {
    holidayId,
    holidayName: holiday.name.korean,
    country,
    countryName: countryInfo.name,
    daysUntil,
    categoryRecommendations,
    promotionStrategy: {
      timeline,
      discountSuggestion,
      bundleSuggestion: holiday.marketing.giftGiving ? {
        theme: `${holiday.name.korean} 스페셜 기프트 세트`,
        products: categoryRecommendations.slice(0, 2).flatMap(c => c.suggestedProducts.slice(0, 2)),
      } : undefined,
    },
    contentStrategy,
    targetAudience,
    projectedImpact,
    alerts,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 리마인더 대상 기념일 조회
 */
export function getHolidaysNeedingReminder(): { holiday: GlobalHoliday; daysUntil: number; reminderType: string }[] {
  const upcoming = getUpcomingHolidays(45);
  const reminders: { holiday: GlobalHoliday; daysUntil: number; reminderType: string }[] = [];

  upcoming.forEach(h => {
    if (h.daysUntil === 30) {
      reminders.push({ holiday: h, daysUntil: h.daysUntil, reminderType: 'D-30: 캠페인 기획 시작' });
    }
    if (h.daysUntil === 14) {
      reminders.push({ holiday: h, daysUntil: h.daysUntil, reminderType: 'D-14: 콘텐츠 준비 완료' });
    }
    if (h.daysUntil === 7) {
      reminders.push({ holiday: h, daysUntil: h.daysUntil, reminderType: 'D-7: 프로모션 시작' });
    }
  });

  return reminders;
}

// Export types
export type { GlobalHoliday, HolidayCategory };

export default {
  getHolidays,
  getHolidayById,
  getUpcomingHolidays,
  getCountries,
  generateMarketingStrategy,
  getHolidaysNeedingReminder,
  COUNTRIES,
  GLOBAL_HOLIDAYS,
};
