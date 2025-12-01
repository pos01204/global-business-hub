/**
 * 글로벌 마케팅 캘린더 서비스
 * 45개국 기념일/시즌 관리 및 마케팅 전략 추천
 */

// 국가 정보 (shippingRates와 동기화)
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

// 타입 정의
export type HolidayCategory = 'national' | 'religious' | 'cultural' | 'shopping' | 'seasonal' | 'family' | 'romantic';

export interface GlobalHoliday {
  id: string;
  name: {
    local: string;
    english: string;
    korean: string;
  };
  countries: string[];
  date: {
    month: number;
    day: number;
    year?: number;
  };
  category: HolidayCategory;
  importance: 'major' | 'medium' | 'minor';
  marketing: {
    leadTimeDays: number;
    giftGiving: boolean;
    discountExpected: boolean;
    recommendedCategories: string[];
    keyTrends: string[];
  };
  context: {
    description: string;
    colors?: string[];
  };
}

export interface MarketingStrategy {
  holidayId: string;
  country: string;
  categoryRecommendations: {
    rank: number;
    categoryName: string;
    reason: string;
    expectedDemandScore: number;
  }[];
  promotionStrategy: {
    timeline: {
      phase: string;
      startDate: string;
      endDate: string;
      actions: string[];
    }[];
    discountSuggestion?: {
      type: string;
      value: number;
      rationale: string;
    };
  };
  contentStrategy: {
    themes: string[];
    keyMessages: {
      korean: string;
      english: string;
      local: string;
    };
    visualGuidelines: string[];
    hashtags: string[];
  };
  projectedImpact: {
    trafficIncrease: string;
    conversionLift: string;
    revenueOpportunity: string;
  };
  generatedAt: string;
}

// 글로벌 기념일 데이터
const GLOBAL_HOLIDAYS: GlobalHoliday[] = [
  // 1월
  {
    id: 'new-year',
    name: { local: 'New Year', english: 'New Year', korean: '새해' },
    countries: ['JP', 'US', 'GB', 'DE', 'FR', 'AU', 'CA', 'SG', 'HK', 'TW', 'MY', 'TH', 'VN', 'ID', 'PH', 'IN', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'IE', 'PT', 'BR', 'MX', 'NZ', 'ZA', 'AE', 'IL', 'TR', 'RU', 'CN'],
    date: { month: 1, day: 1 },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['인테리어', '캘린더', '다이어리', '홈데코'],
      keyTrends: ['새출발', '목표', '다짐', '희망'],
    },
    context: {
      description: '새로운 한 해를 맞이하는 글로벌 기념일',
      colors: ['gold', 'silver', 'white'],
    },
  },
  // 2월
  {
    id: 'chinese-new-year',
    name: { local: '春节', english: 'Chinese New Year', korean: '춘절/설날' },
    countries: ['CN', 'TW', 'HK', 'SG', 'MY', 'TH', 'VN', 'ID', 'PH'],
    date: { month: 2, day: 10, year: 2024 },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 45,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['액세서리', '인테리어', '의류', '뷰티', '식품'],
      keyTrends: ['행운', '번영', '가족', '빨간색', '금색'],
    },
    context: {
      description: '중화권 최대 명절, 홍바오(세뱃돈) 문화',
      colors: ['red', 'gold'],
    },
  },
  {
    id: 'valentines-day',
    name: { local: "Valentine's Day", english: "Valentine's Day", korean: '발렌타인데이' },
    countries: ['JP', 'US', 'GB', 'DE', 'FR', 'AU', 'CA', 'IT', 'ES', 'TW', 'HK', 'SG', 'TH', 'PH', 'BR', 'MX'],
    date: { month: 2, day: 14 },
    category: 'romantic',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['액세서리', '쥬얼리', '초콜릿', '꽃', '향수', '캔들'],
      keyTrends: ['사랑', '로맨스', '연인', '고백'],
    },
    context: {
      description: '연인의 날, 일본에서는 여성이 남성에게 초콜릿 선물',
      colors: ['red', 'pink', 'white'],
    },
  },
  // 3월
  {
    id: 'white-day',
    name: { local: 'ホワイトデー', english: 'White Day', korean: '화이트데이' },
    countries: ['JP', 'TW', 'CN'],
    date: { month: 3, day: 14 },
    category: 'romantic',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['액세서리', '쥬얼리', '스위츠', '향수', '플라워'],
      keyTrends: ['답례', '프리미엄', '특별함', '화이트'],
    },
    context: {
      description: '발렌타인 답례일, 3배 법칙(받은 것의 3배 가치로 답례)',
      colors: ['white', 'pink', 'pastel'],
    },
  },
  // 5월
  {
    id: 'mothers-day',
    name: { local: "Mother's Day", english: "Mother's Day", korean: '어머니의 날' },
    countries: ['US', 'AU', 'CA', 'DE', 'IT', 'JP', 'TW', 'HK', 'SG', 'NZ', 'BE', 'NL', 'CH', 'AT', 'BR', 'IN', 'TH', 'PH', 'MY'],
    date: { month: 5, day: 11, year: 2025 },
    category: 'family',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['쥬얼리', '플라워', '뷰티', '홈데코', '캔들', '향수'],
      keyTrends: ['감사', '어머니', '가족', '사랑'],
    },
    context: {
      description: '어머니에 대한 감사와 사랑을 표현하는 날',
      colors: ['pink', 'red', 'white'],
    },
  },
  // 6월
  {
    id: 'fathers-day',
    name: { local: "Father's Day", english: "Father's Day", korean: '아버지의 날' },
    countries: ['US', 'CA', 'GB', 'JP', 'AU', 'NZ', 'FR', 'HK', 'SG', 'TW', 'IN', 'PH', 'MY'],
    date: { month: 6, day: 15, year: 2025 },
    category: 'family',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['가죽소품', '시계', '향수', '술잔', '도구'],
      keyTrends: ['아버지', '감사', '남성', '클래식'],
    },
    context: {
      description: '아버지에 대한 감사와 사랑을 표현하는 날',
      colors: ['blue', 'navy', 'brown'],
    },
  },
  // 10월
  {
    id: 'halloween',
    name: { local: 'Halloween', english: 'Halloween', korean: '할로윈' },
    countries: ['US', 'CA', 'GB', 'IE', 'AU', 'NZ', 'JP', 'DE', 'FR'],
    date: { month: 10, day: 31 },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: ['코스튬', '인테리어', '캔들', '파티용품'],
      keyTrends: ['호러', '코스프레', '호박', '파티'],
    },
    context: {
      description: '할로윈 축제, 코스튬 파티 문화',
      colors: ['orange', 'black', 'purple'],
    },
  },
  // 11월
  {
    id: 'singles-day',
    name: { local: '双十一', english: 'Singles Day', korean: '광군절(싱글스데이)' },
    countries: ['CN', 'SG', 'MY', 'TW', 'HK'],
    date: { month: 11, day: 11 },
    category: 'shopping',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['전체', '뷰티', '패션', '전자기기'],
      keyTrends: ['쇼핑', '할인', '셀프선물', '대량구매'],
    },
    context: {
      description: '세계 최대 온라인 쇼핑 페스티벌',
      colors: ['red', 'gold'],
    },
  },
  {
    id: 'black-friday',
    name: { local: 'Black Friday', english: 'Black Friday', korean: '블랙프라이데이' },
    countries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'IT', 'ES', 'NL', 'BE', 'BR', 'MX', 'JP', 'SG', 'HK'],
    date: { month: 11, day: 28, year: 2025 },
    category: 'shopping',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['전체'],
      keyTrends: ['할인', '쇼핑', '선물준비', '연말'],
    },
    context: {
      description: '글로벌 대규모 할인 쇼핑 이벤트',
      colors: ['black', 'red', 'white'],
    },
  },
  // 12월
  {
    id: 'christmas',
    name: { local: 'Christmas', english: 'Christmas', korean: '크리스마스' },
    countries: ['JP', 'US', 'GB', 'DE', 'FR', 'AU', 'CA', 'NZ', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'IE', 'PT', 'BR', 'MX', 'PH', 'SG', 'HK', 'TW'],
    date: { month: 12, day: 25 },
    category: 'religious',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['액세서리', '인테리어', '캔들', '니트/패션', '쥬얼리', '향수'],
      keyTrends: ['선물', '따뜻함', '가족', '연인', '홈파티'],
    },
    context: {
      description: '서양권 최대 명절, 일본에서는 연인의 날',
      colors: ['red', 'green', 'gold', 'white'],
    },
  },
];

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
export function getUpcomingHolidays(days: number = 30, countries?: string[]): GlobalHoliday[] {
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  return GLOBAL_HOLIDAYS.filter(holiday => {
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
  }).sort((a, b) => {
    const dateA = new Date(a.date.year || today.getFullYear(), a.date.month - 1, a.date.day);
    const dateB = new Date(b.date.year || today.getFullYear(), b.date.month - 1, b.date.day);
    return dateA.getTime() - dateB.getTime();
  });
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
 * 카테고리 추천 생성 (정적 버전)
 */
export function generateCategoryRecommendations(
  holidayId: string,
  country: string
): { categoryName: string; reason: string; expectedDemandScore: number }[] {
  const holiday = getHolidayById(holidayId);
  if (!holiday) return [];

  return holiday.marketing.recommendedCategories.map((cat, idx) => ({
    categoryName: cat,
    reason: `${holiday.name.korean}에 적합한 ${cat} 카테고리입니다.`,
    expectedDemandScore: Math.max(95 - idx * 8, 50),
  }));
}

export default {
  getHolidays,
  getHolidayById,
  getUpcomingHolidays,
  getCountries,
  generateCategoryRecommendations,
  COUNTRIES,
  GLOBAL_HOLIDAYS,
};

