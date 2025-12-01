'use client'

import { useState, useMemo } from 'react'

// 국가 정보 (shippingRates 기반)
const COUNTRIES: Record<string, { name: string; tier: number; flag: string; region: string }> = {
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
}

// 기념일 카테고리 타입
type HolidayCategory = 'national' | 'religious' | 'cultural' | 'shopping' | 'seasonal' | 'family' | 'romantic'

// 기념일 데이터 타입
interface GlobalHoliday {
  id: string
  name: {
    local: string
    english: string
    korean: string
  }
  countries: string[]
  date: {
    month: number
    day: number
    year?: number // 음력이나 변동일의 경우 특정 연도
  }
  category: HolidayCategory
  importance: 'major' | 'medium' | 'minor'
  marketing: {
    leadTimeDays: number
    giftGiving: boolean
    discountExpected: boolean
    recommendedCategories: string[]
    keyTrends: string[]
  }
  context: {
    description: string
    colors?: string[]
  }
}

// 글로벌 기념일 데이터 (주요 기념일)
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
  {
    id: 'coming-of-age-jp',
    name: { local: '成人の日', english: 'Coming of Age Day', korean: '성인의 날' },
    countries: ['JP'],
    date: { month: 1, day: 8 }, // 1월 두번째 월요일
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['액세서리', '쥬얼리', '기모노 소품', '메이크업'],
      keyTrends: ['성인', '기념', '전통', '미래'],
    },
    context: {
      description: '20세가 된 청년들의 성인식을 축하하는 날',
      colors: ['red', 'white', 'pink'],
    },
  },
  {
    id: 'australia-day',
    name: { local: 'Australia Day', english: 'Australia Day', korean: '호주의 날' },
    countries: ['AU'],
    date: { month: 1, day: 26 },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['아웃도어', '파티용품', '홈데코'],
      keyTrends: ['여름', '바비큐', '가족', '축제'],
    },
    context: {
      description: '호주 건국 기념일, 여름 축제 분위기',
      colors: ['blue', 'yellow', 'green'],
    },
  },
  // 2월
  {
    id: 'chinese-new-year',
    name: { local: '春节', english: 'Chinese New Year', korean: '춘절/설날' },
    countries: ['CN', 'TW', 'HK', 'SG', 'MY', 'TH', 'VN', 'ID', 'PH'],
    date: { month: 2, day: 10, year: 2024 }, // 음력 변동
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
  {
    id: 'hinamatsuri',
    name: { local: 'ひな祭り', english: 'Hinamatsuri', korean: '히나마츠리(여아의 날)' },
    countries: ['JP'],
    date: { month: 3, day: 3 },
    category: 'cultural',
    importance: 'medium',
    marketing: {
      leadTimeDays: 30,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['인형', '전통공예', '화과자', '인테리어'],
      keyTrends: ['여아', '전통', '성장', '핑크'],
    },
    context: {
      description: '여자 아이의 건강한 성장을 기원하는 날',
      colors: ['pink', 'green', 'white'],
    },
  },
  {
    id: 'international-womens-day',
    name: { local: "International Women's Day", english: "International Women's Day", korean: '세계 여성의 날' },
    countries: ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'AU', 'CA', 'RU', 'CN', 'IN', 'BR'],
    date: { month: 3, day: 8 },
    category: 'cultural',
    importance: 'medium',
    marketing: {
      leadTimeDays: 14,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['뷰티', '액세서리', '패션', '셀프케어'],
      keyTrends: ['여성', '자기사랑', '임파워먼트', '선물'],
    },
    context: {
      description: '여성의 권리와 성취를 기념하는 날',
      colors: ['purple', 'pink'],
    },
  },
  // 4월
  {
    id: 'easter',
    name: { local: 'Easter', english: 'Easter', korean: '부활절' },
    countries: ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'AU', 'CA', 'NZ', 'NL', 'BE', 'CH', 'AT', 'IE', 'PL', 'BR', 'MX'],
    date: { month: 4, day: 20, year: 2025 }, // 변동
    category: 'religious',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['초콜릿', '인테리어', '키즈', '베이킹'],
      keyTrends: ['봄', '토끼', '달걀', '가족'],
    },
    context: {
      description: '기독교 부활절, 봄의 시작을 알리는 축제',
      colors: ['pastel', 'yellow', 'pink', 'green'],
    },
  },
  // 5월
  {
    id: 'mothers-day',
    name: { local: "Mother's Day", english: "Mother's Day", korean: '어머니의 날' },
    countries: ['US', 'AU', 'CA', 'DE', 'IT', 'JP', 'TW', 'HK', 'SG', 'NZ', 'BE', 'NL', 'CH', 'AT', 'BR', 'IN', 'TH', 'PH', 'MY'],
    date: { month: 5, day: 11, year: 2025 }, // 5월 두번째 일요일
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
  {
    id: 'golden-week-jp',
    name: { local: 'ゴールデンウィーク', english: 'Golden Week', korean: '골든위크' },
    countries: ['JP'],
    date: { month: 5, day: 3 },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['아웃도어', '여행용품', '레저', '홈웨어'],
      keyTrends: ['여행', '휴식', '가족', '레저'],
    },
    context: {
      description: '일본 최대 연휴 기간 (4/29~5/5)',
      colors: ['green', 'blue'],
    },
  },
  {
    id: 'cinco-de-mayo',
    name: { local: 'Cinco de Mayo', english: 'Cinco de Mayo', korean: '싱코 데 마요' },
    countries: ['MX', 'US'],
    date: { month: 5, day: 5 },
    category: 'national',
    importance: 'medium',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['파티용품', '인테리어', '푸드'],
      keyTrends: ['멕시코', '축제', '컬러풀', '파티'],
    },
    context: {
      description: '멕시코 전통 축제일',
      colors: ['green', 'red', 'white'],
    },
  },
  // 6월
  {
    id: 'fathers-day',
    name: { local: "Father's Day", english: "Father's Day", korean: '아버지의 날' },
    countries: ['US', 'CA', 'GB', 'JP', 'AU', 'NZ', 'FR', 'HK', 'SG', 'TW', 'IN', 'PH', 'MY'],
    date: { month: 6, day: 15, year: 2025 }, // 6월 세번째 일요일
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
  // 7월
  {
    id: 'independence-day-us',
    name: { local: 'Independence Day', english: 'Independence Day', korean: '미국 독립기념일' },
    countries: ['US'],
    date: { month: 7, day: 4 },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['아웃도어', '파티용품', '홈데코', '패션'],
      keyTrends: ['여름', '바비큐', '불꽃놀이', '애국'],
    },
    context: {
      description: '미국 독립 기념일, 대규모 세일 시즌',
      colors: ['red', 'white', 'blue'],
    },
  },
  {
    id: 'tanabata',
    name: { local: '七夕', english: 'Tanabata', korean: '칠석' },
    countries: ['JP'],
    date: { month: 7, day: 7 },
    category: 'cultural',
    importance: 'medium',
    marketing: {
      leadTimeDays: 14,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['인테리어', '캔들', '전통공예', '수공예'],
      keyTrends: ['소원', '별', '은하수', '로맨스'],
    },
    context: {
      description: '일본 칠석 축제, 소원을 비는 날',
      colors: ['purple', 'blue', 'silver'],
    },
  },
  // 8월
  {
    id: 'obon',
    name: { local: 'お盆', english: 'Obon', korean: '오봉(백중)' },
    countries: ['JP'],
    date: { month: 8, day: 15 },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['전통공예', '인테리어', '선물세트', '푸드'],
      keyTrends: ['조상', '귀향', '가족', '전통'],
    },
    context: {
      description: '일본 조상 기리는 명절, 연휴 기간',
      colors: ['white', 'black', 'green'],
    },
  },
  {
    id: 'national-day-sg',
    name: { local: 'National Day', english: 'National Day', korean: '싱가포르 국경일' },
    countries: ['SG'],
    date: { month: 8, day: 9 },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['홈데코', '패션', '액세서리'],
      keyTrends: ['애국', '축제', '세일'],
    },
    context: {
      description: '싱가포르 독립 기념일',
      colors: ['red', 'white'],
    },
  },
  // 9월
  {
    id: 'mid-autumn',
    name: { local: '中秋节', english: 'Mid-Autumn Festival', korean: '중추절(추석)' },
    countries: ['CN', 'TW', 'HK', 'SG', 'MY', 'VN'],
    date: { month: 9, day: 17, year: 2024 }, // 음력 변동
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['선물세트', '전통공예', '티세트', '인테리어'],
      keyTrends: ['달', '가족', '월병', '감사'],
    },
    context: {
      description: '중화권 추수 감사절, 월병 교환 문화',
      colors: ['gold', 'red', 'yellow'],
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
  {
    id: 'diwali',
    name: { local: 'Diwali', english: 'Diwali', korean: '디왈리' },
    countries: ['IN', 'SG', 'MY'],
    date: { month: 10, day: 24, year: 2024 }, // 음력 변동
    category: 'religious',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['쥬얼리', '인테리어', '캔들', '의류'],
      keyTrends: ['빛', '번영', '가족', '새시작'],
    },
    context: {
      description: '힌두교 빛의 축제, 인도 최대 명절',
      colors: ['gold', 'red', 'purple', 'orange'],
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
    id: 'thanksgiving',
    name: { local: 'Thanksgiving', english: 'Thanksgiving', korean: '추수감사절' },
    countries: ['US', 'CA'],
    date: { month: 11, day: 27, year: 2025 }, // 11월 네번째 목요일
    category: 'family',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['인테리어', '키친웨어', '캔들', '테이블웨어'],
      keyTrends: ['가족', '홈파티', '따뜻함', '감사'],
    },
    context: {
      description: '미국 최대 가족 명절, 블랙프라이데이로 이어짐',
      colors: ['orange', 'brown', 'gold'],
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
  {
    id: 'cyber-monday',
    name: { local: 'Cyber Monday', english: 'Cyber Monday', korean: '사이버먼데이' },
    countries: ['US', 'CA', 'GB', 'DE', 'AU'],
    date: { month: 12, day: 1, year: 2025 },
    category: 'shopping',
    importance: 'major',
    marketing: {
      leadTimeDays: 7,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['전체'],
      keyTrends: ['온라인쇼핑', '할인', '연말선물'],
    },
    context: {
      description: '블랙프라이데이 이후 온라인 쇼핑 이벤트',
      colors: ['blue', 'black'],
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
  {
    id: 'boxing-day',
    name: { local: 'Boxing Day', english: 'Boxing Day', korean: '박싱데이' },
    countries: ['GB', 'AU', 'CA', 'NZ', 'HK', 'IE'],
    date: { month: 12, day: 26 },
    category: 'shopping',
    importance: 'major',
    marketing: {
      leadTimeDays: 7,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['전체'],
      keyTrends: ['세일', '연말정리', '셀프선물'],
    },
    context: {
      description: '크리스마스 다음 날 대규모 세일',
      colors: ['red', 'green'],
    },
  },
  {
    id: 'new-years-eve',
    name: { local: 'New Year\'s Eve', english: 'New Year\'s Eve', korean: '새해 전야' },
    countries: ['JP', 'US', 'GB', 'DE', 'FR', 'AU', 'CA', 'SG', 'HK', 'TW', 'IT', 'ES', 'BR'],
    date: { month: 12, day: 31 },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['파티용품', '캔들', '인테리어', '패션'],
      keyTrends: ['카운트다운', '파티', '새출발', '축제'],
    },
    context: {
      description: '한 해의 마지막 날, 카운트다운 파티',
      colors: ['gold', 'silver', 'black'],
    },
  },
]

// 카테고리 색상
const CATEGORY_COLORS: Record<HolidayCategory, { bg: string; text: string; border: string }> = {
  national: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  religious: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  cultural: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  shopping: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  seasonal: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  family: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  romantic: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
}

const CATEGORY_LABELS: Record<HolidayCategory, string> = {
  national: '국경일',
  religious: '종교',
  cultural: '문화',
  shopping: '쇼핑',
  seasonal: '시즌',
  family: '가족',
  romantic: '연인',
}

const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월'
]

interface HolidayDetailModalProps {
  holiday: GlobalHoliday
  onClose: () => void
  onGenerateStrategy: (holiday: GlobalHoliday) => void
}

function HolidayDetailModal({ holiday, onClose, onGenerateStrategy }: HolidayDetailModalProps) {
  const categoryStyle = CATEGORY_COLORS[holiday.category]
  const daysUntil = useMemo(() => {
    const today = new Date()
    const holidayDate = new Date(
      holiday.date.year || today.getFullYear(),
      holiday.date.month - 1,
      holiday.date.day
    )
    if (holidayDate < today) {
      holidayDate.setFullYear(holidayDate.getFullYear() + 1)
    }
    return Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }, [holiday])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="text-2xl">{holiday.marketing.giftGiving ? '🎁' : '🗓️'}</span>
            <span>{holiday.name.korean}</span>
            <span className="text-gray-400 font-normal text-base">({holiday.name.english})</span>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body space-y-6">
          {/* 기본 정보 */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">📅</span>
              <span className="font-medium">{holiday.date.month}월 {holiday.date.day}일</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${categoryStyle.bg} ${categoryStyle.text}`}>
              {CATEGORY_LABELS[holiday.category]}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              daysUntil <= 30 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}>
              D-{daysUntil}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              holiday.importance === 'major' ? 'bg-yellow-100 text-yellow-700' :
              holiday.importance === 'medium' ? 'bg-gray-100 text-gray-600' :
              'bg-gray-50 text-gray-500'
            }`}>
              {holiday.importance === 'major' ? '⭐ 최고 중요' : 
               holiday.importance === 'medium' ? '중요' : '일반'}
            </div>
          </div>

          {/* 해당 국가 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">🌍 해당 국가</h3>
            <div className="flex flex-wrap gap-2">
              {holiday.countries.map(code => (
                <span key={code} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                  <span>{COUNTRIES[code]?.flag}</span>
                  <span>{COUNTRIES[code]?.name || code}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 설명 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">📝 설명</h3>
            <p className="text-gray-700">{holiday.context.description}</p>
          </div>

          {/* 마케팅 인사이트 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-700 mb-3">🎯 마케팅 인사이트</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">리드타임:</span>
                  <span className="font-medium">{holiday.marketing.leadTimeDays}일 전 준비 권장</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">선물 문화:</span>
                  <span className={`font-medium ${holiday.marketing.giftGiving ? 'text-green-600' : 'text-gray-400'}`}>
                    {holiday.marketing.giftGiving ? '✅ 있음' : '❌ 없음'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">할인 기대:</span>
                  <span className={`font-medium ${holiday.marketing.discountExpected ? 'text-red-600' : 'text-gray-400'}`}>
                    {holiday.marketing.discountExpected ? '🔥 높음' : '보통'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-700 mb-3">🏷️ 추천 카테고리</h3>
              <div className="flex flex-wrap gap-2">
                {holiday.marketing.recommendedCategories.map((cat, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white rounded border border-green-200 text-sm">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 키 트렌드 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">🔥 키 트렌드</h3>
            <div className="flex flex-wrap gap-2">
              {holiday.marketing.keyTrends.map((trend, idx) => (
                <span key={idx} className="px-3 py-1 bg-gradient-to-r from-idus-500/10 to-pink-500/10 rounded-full text-sm font-medium text-gray-700">
                  #{trend}
                </span>
              ))}
            </div>
          </div>

          {/* 상징 색상 */}
          {holiday.context.colors && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">🎨 상징 색상</h3>
              <div className="flex gap-2">
                {holiday.context.colors.map((color, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: color === 'pastel' ? '#FFE4E1' : color }}
                    />
                    <span className="text-sm capitalize">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-4 border-t">
            <button 
              onClick={() => onGenerateStrategy(holiday)}
              className="btn btn-primary flex-1"
            >
              🤖 AI 마케팅 전략 생성
            </button>
            <button className="btn btn-secondary">
              📋 캠페인 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarketingCalendarTab() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<HolidayCategory | null>(null)
  const [selectedHoliday, setSelectedHoliday] = useState<GlobalHoliday | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  // 필터링된 기념일
  const filteredHolidays = useMemo(() => {
    return GLOBAL_HOLIDAYS.filter(holiday => {
      // 월 필터
      if (holiday.date.month !== selectedMonth) return false
      
      // 국가 필터
      if (selectedCountries.length > 0) {
        if (!holiday.countries.some(c => selectedCountries.includes(c))) return false
      }
      
      // Tier 필터
      if (selectedTier !== null) {
        if (!holiday.countries.some(c => COUNTRIES[c]?.tier === selectedTier)) return false
      }
      
      // 카테고리 필터
      if (selectedCategory !== null) {
        if (holiday.category !== selectedCategory) return false
      }
      
      return true
    }).sort((a, b) => a.date.day - b.date.day)
  }, [selectedMonth, selectedCountries, selectedTier, selectedCategory])

  // 다가오는 기념일 (30일 이내)
  const upcomingHolidays = useMemo(() => {
    const today = new Date()
    return GLOBAL_HOLIDAYS.filter(holiday => {
      const holidayDate = new Date(
        holiday.date.year || today.getFullYear(),
        holiday.date.month - 1,
        holiday.date.day
      )
      if (holidayDate < today) {
        holidayDate.setFullYear(holidayDate.getFullYear() + 1)
      }
      const daysUntil = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 30 && daysUntil >= 0
    }).sort((a, b) => {
      const today = new Date()
      const dateA = new Date(a.date.year || today.getFullYear(), a.date.month - 1, a.date.day)
      const dateB = new Date(b.date.year || today.getFullYear(), b.date.month - 1, b.date.day)
      return dateA.getTime() - dateB.getTime()
    })
  }, [])

  const handleGenerateStrategy = (holiday: GlobalHoliday) => {
    alert(`${holiday.name.korean}에 대한 AI 마케팅 전략 생성 기능은 추후 구현 예정입니다.`)
  }

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    )
  }

  // 캘린더 그리드 생성
  const calendarDays = useMemo(() => {
    const year = new Date().getFullYear()
    const firstDay = new Date(year, selectedMonth - 1, 1).getDay()
    const daysInMonth = new Date(year, selectedMonth, 0).getDate()
    
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    
    return days
  }, [selectedMonth])

  // 날짜별 기념일 매핑
  const holidaysByDay = useMemo(() => {
    const map: Record<number, GlobalHoliday[]> = {}
    filteredHolidays.forEach(h => {
      if (!map[h.date.day]) map[h.date.day] = []
      map[h.date.day].push(h)
    })
    return map
  }, [filteredHolidays])

  return (
    <div className="space-y-6">
      {/* 다가오는 기념일 알림 */}
      {upcomingHolidays.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⏰</span>
            <h3 className="font-semibold text-amber-800">다가오는 주요 기념일</h3>
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
              30일 이내 {upcomingHolidays.length}개
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {upcomingHolidays.slice(0, 5).map(holiday => {
              const today = new Date()
              const holidayDate = new Date(
                holiday.date.year || today.getFullYear(),
                holiday.date.month - 1,
                holiday.date.day
              )
              const daysUntil = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              
              return (
                <button
                  key={holiday.id}
                  onClick={() => setSelectedHoliday(holiday)}
                  className="flex-shrink-0 bg-white rounded-lg p-3 border border-amber-200 hover:border-amber-400 transition-colors min-w-[180px]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{holiday.name.korean}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      daysUntil <= 7 ? 'bg-red-100 text-red-700' : 
                      daysUntil <= 14 ? 'bg-orange-100 text-orange-700' : 
                      'bg-gray-100 text-gray-600'
                    }`}>
                      D-{daysUntil}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {holiday.date.month}/{holiday.date.day} • {holiday.countries.slice(0, 3).map(c => COUNTRIES[c]?.flag).join('')}
                    {holiday.countries.length > 3 && ` +${holiday.countries.length - 3}`}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 필터 영역 */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* 월 선택 */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSelectedMonth(m => m > 1 ? m - 1 : 12)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ◀
            </button>
            <span className="text-lg font-bold min-w-[80px] text-center">
              {MONTH_NAMES[selectedMonth - 1]}
            </span>
            <button 
              onClick={() => setSelectedMonth(m => m < 12 ? m + 1 : 1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ▶
            </button>
          </div>

          {/* Tier 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Tier:</span>
            {[1, 2, 3, 4].map(tier => (
              <button
                key={tier}
                onClick={() => setSelectedTier(selectedTier === tier ? null : tier)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedTier === tier
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tier {tier}
              </button>
            ))}
          </div>

          {/* 카테고리 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">유형:</span>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value as HolidayCategory || null)}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="">전체</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* 뷰 모드 */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              📅 캘린더
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              📋 리스트
            </button>
          </div>
        </div>

        {/* 국가 빠른 필터 */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-500">국가 필터:</span>
            {selectedCountries.length > 0 && (
              <button
                onClick={() => setSelectedCountries([])}
                className="text-xs text-red-500 hover:underline"
              >
                초기화
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(COUNTRIES)
              .sort((a, b) => a[1].tier - b[1].tier)
              .map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => toggleCountry(code)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    selectedCountries.includes(code)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {info.flag} {info.name}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* 캘린더 / 리스트 뷰 */}
      {viewMode === 'calendar' ? (
        <div className="card">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
              <div key={day} className={`text-center text-sm font-medium py-2 ${
                idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-600'
              }`}>
                {day}
              </div>
            ))}
          </div>
          
          {/* 캘린더 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => (
              <div
                key={idx}
                className={`min-h-[100px] border rounded-lg p-1 ${
                  day ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      idx % 7 === 0 ? 'text-red-500' : idx % 7 === 6 ? 'text-blue-500' : 'text-gray-700'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {holidaysByDay[day]?.slice(0, 3).map(holiday => (
                        <button
                          key={holiday.id}
                          onClick={() => setSelectedHoliday(holiday)}
                          className={`w-full text-left text-xs p-1 rounded truncate ${
                            CATEGORY_COLORS[holiday.category].bg
                          } ${CATEGORY_COLORS[holiday.category].text} hover:opacity-80 transition-opacity`}
                        >
                          {holiday.marketing.giftGiving && '🎁'} {holiday.name.korean}
                        </button>
                      ))}
                      {holidaysByDay[day]?.length > 3 && (
                        <div className="text-xs text-gray-400 text-center">
                          +{holidaysByDay[day].length - 3}개 더
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHolidays.length === 0 ? (
            <div className="card text-center py-12">
              <span className="text-4xl mb-4 block">📭</span>
              <p className="text-gray-500">해당 조건에 맞는 기념일이 없습니다.</p>
            </div>
          ) : (
            filteredHolidays.map(holiday => {
              const categoryStyle = CATEGORY_COLORS[holiday.category]
              return (
                <button
                  key={holiday.id}
                  onClick={() => setSelectedHoliday(holiday)}
                  className="card w-full text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-2xl font-bold text-gray-900">{holiday.date.day}</div>
                      <div className="text-xs text-gray-500">{MONTH_NAMES[holiday.date.month - 1]}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{holiday.name.korean}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${categoryStyle.bg} ${categoryStyle.text}`}>
                          {CATEGORY_LABELS[holiday.category]}
                        </span>
                        {holiday.importance === 'major' && (
                          <span className="text-xs text-yellow-600">⭐</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {holiday.countries.slice(0, 5).map(c => COUNTRIES[c]?.flag).join(' ')}
                        {holiday.countries.length > 5 && ` +${holiday.countries.length - 5}개국`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {holiday.marketing.recommendedCategories.slice(0, 3).map((cat, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {cat}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {holiday.marketing.giftGiving && '🎁 선물'} 
                        {holiday.marketing.discountExpected && ' 🔥 할인'}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}

      {/* 기념일 상세 모달 */}
      {selectedHoliday && (
        <HolidayDetailModal
          holiday={selectedHoliday}
          onClose={() => setSelectedHoliday(null)}
          onGenerateStrategy={handleGenerateStrategy}
        />
      )}
    </div>
  )
}

