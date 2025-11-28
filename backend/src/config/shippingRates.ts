/**
 * 물류 운임 마스터 데이터
 * LGL(롯데글로벌로지스) 계약 운임 기준
 */

// 운송사 타입
export type CarrierType = 'YAMATO' | 'NEKOPOS' | 'KPACKET' | 'EMS' | 'SF' | 'UPS' | 'USPS' | 'FEDEX' | 'CXC';

// 국가별 Tier 분류
export const COUNTRY_TIERS: Record<string, { tier: number; name: string; code: string }> = {
  // Tier 1 - 핵심 시장 (배송비 $1.49, 무배 $50 or 2개 이상)
  'JP': { tier: 1, name: '일본', code: 'JP' },
  'HK': { tier: 1, name: '홍콩', code: 'HK' },
  'SG': { tier: 1, name: '싱가포르', code: 'SG' },
  
  // Tier 2 - 동남아 (배송비 $9.99, 무배 $100)
  'ID': { tier: 2, name: '인도네시아', code: 'ID' },
  'MY': { tier: 2, name: '말레이시아', code: 'MY' },
  'TW': { tier: 2, name: '대만', code: 'TW' },
  'VN': { tier: 2, name: '베트남', code: 'VN' },
  
  // Tier 3 - 영미권 (배송비 $19.99, 무배 $150)
  'AU': { tier: 3, name: '호주', code: 'AU' },
  'CA': { tier: 3, name: '캐나다', code: 'CA' },
  'NZ': { tier: 3, name: '뉴질랜드', code: 'NZ' },
  'US': { tier: 3, name: '미국', code: 'US' },
  
  // Tier 4 - 유럽/기타 (배송비 $29.99, 무배 $100)
  'AT': { tier: 4, name: '오스트리아', code: 'AT' },
  'BE': { tier: 4, name: '벨기에', code: 'BE' },
  'BR': { tier: 4, name: '브라질', code: 'BR' },
  'CH': { tier: 4, name: '스위스', code: 'CH' },
  'CZ': { tier: 4, name: '체코', code: 'CZ' },
  'DE': { tier: 4, name: '독일', code: 'DE' },
  'DK': { tier: 4, name: '덴마크', code: 'DK' },
  'ES': { tier: 4, name: '스페인', code: 'ES' },
  'FI': { tier: 4, name: '핀란드', code: 'FI' },
  'FR': { tier: 4, name: '프랑스', code: 'FR' },
  'GB': { tier: 4, name: '영국', code: 'GB' },
  'HU': { tier: 4, name: '헝가리', code: 'HU' },
  'IE': { tier: 4, name: '아일랜드', code: 'IE' },
  'IL': { tier: 4, name: '이스라엘', code: 'IL' },
  'IN': { tier: 4, name: '인도', code: 'IN' },
  'IT': { tier: 4, name: '이탈리아', code: 'IT' },
  'MX': { tier: 4, name: '멕시코', code: 'MX' },
  'NL': { tier: 4, name: '네덜란드', code: 'NL' },
  'NO': { tier: 4, name: '노르웨이', code: 'NO' },
  'PH': { tier: 4, name: '필리핀', code: 'PH' },
  'PL': { tier: 4, name: '폴란드', code: 'PL' },
  'PT': { tier: 4, name: '포르투갈', code: 'PT' },
  'SE': { tier: 4, name: '스웨덴', code: 'SE' },
  'TH': { tier: 4, name: '태국', code: 'TH' },
  'TR': { tier: 4, name: '터키', code: 'TR' },
  'AE': { tier: 4, name: 'UAE', code: 'AE' },
  'ZA': { tier: 4, name: '남아공', code: 'ZA' },
  'CN': { tier: 4, name: '중국', code: 'CN' },
  'RU': { tier: 4, name: '러시아', code: 'RU' },
};

// 배송비 정책 (Tier별)
export const SHIPPING_POLICIES = {
  1: {
    tier: 1,
    customerShippingFeeUSD: 1.49,
    freeShippingThresholdUSD: 50,
    freeShippingItemCount: 2,
    description: '핵심 시장 - 최우선 집중',
  },
  2: {
    tier: 2,
    customerShippingFeeUSD: 9.99,
    freeShippingThresholdUSD: 100,
    freeShippingItemCount: null,
    description: '동남아 시장',
  },
  3: {
    tier: 3,
    customerShippingFeeUSD: 19.99,
    freeShippingThresholdUSD: 150,
    freeShippingItemCount: null,
    description: '영미권 시장',
  },
  4: {
    tier: 4,
    customerShippingFeeUSD: 29.99,
    freeShippingThresholdUSD: 100,
    freeShippingItemCount: null,
    description: '유럽/기타 시장',
  },
};

// 관부가세 정책
export const TAX_POLICIES: Record<string, {
  country: string;
  dutyFreeThresholdLocal: number;
  dutyFreeThresholdCurrency: string;
  vatRate: number;
  paidBy: 'customer' | 'backpacker';
  notes?: string;
}> = {
  'JP': {
    country: 'JP',
    dutyFreeThresholdLocal: 16666,
    dutyFreeThresholdCurrency: 'JPY',
    vatRate: 0.10,
    paidBy: 'backpacker',
    notes: '16,666엔 초과 시 소비세 10% 부과',
  },
  'SG': {
    country: 'SG',
    dutyFreeThresholdLocal: 0,
    dutyFreeThresholdCurrency: 'SGD',
    vatRate: 0.09,
    paidBy: 'backpacker',
    notes: 'GST 9% 무조건 부과 (2024년~)',
  },
  'TW': {
    country: 'TW',
    dutyFreeThresholdLocal: 2000,
    dutyFreeThresholdCurrency: 'TWD',
    vatRate: 0.05,
    paidBy: 'backpacker',
    notes: '2,000 TWD 초과 시 영업세 5%',
  },
  'AU': {
    country: 'AU',
    dutyFreeThresholdLocal: 1000,
    dutyFreeThresholdCurrency: 'AUD',
    vatRate: 0.10,
    paidBy: 'customer',
    notes: '1,000 AUD 초과 시 GST 10%',
  },
  'CA': {
    country: 'CA',
    dutyFreeThresholdLocal: 20,
    dutyFreeThresholdCurrency: 'CAD',
    vatRate: 0.05,
    paidBy: 'customer',
    notes: '20 CAD 초과 시 부과 (선물 60 CAD)',
  },
  'US': {
    country: 'US',
    dutyFreeThresholdLocal: 800,
    dutyFreeThresholdCurrency: 'USD',
    vatRate: 0,
    paidBy: 'customer',
    notes: '800 USD 초과 시 관세 부과',
  },
};

// YAMATO 운임표 (일본향 - 가장 많이 사용)
export const YAMATO_RATES: { maxWeight: number; rate: number }[] = [
  { maxWeight: 0.5, rate: 6310 },
  { maxWeight: 1.0, rate: 7140 },
  { maxWeight: 1.5, rate: 7920 },
  { maxWeight: 2.0, rate: 9050 },
  { maxWeight: 2.5, rate: 10610 },
  { maxWeight: 3.0, rate: 11450 },
  { maxWeight: 3.5, rate: 12270 },
  { maxWeight: 4.0, rate: 13210 },
  { maxWeight: 4.5, rate: 14040 },
  { maxWeight: 5.0, rate: 14870 },
  { maxWeight: 5.5, rate: 16640 },
  { maxWeight: 6.0, rate: 17470 },
  { maxWeight: 6.5, rate: 18410 },
  { maxWeight: 7.0, rate: 19240 },
  { maxWeight: 7.5, rate: 20070 },
  { maxWeight: 8.0, rate: 20910 },
  { maxWeight: 8.5, rate: 21840 },
  { maxWeight: 9.0, rate: 22670 },
  { maxWeight: 9.5, rate: 23500 },
  { maxWeight: 10.0, rate: 24330 },
  { maxWeight: 10.5, rate: 31020 },
  { maxWeight: 20.0, rate: 46170 },
  { maxWeight: 30.0, rate: 65000 },
];

// NEKOPOS 운임 (일본향 - 1kg 이하, 2.5cm 이하)
export const NEKOPOS_RATE = 4000;
export const NEKOPOS_MAX_WEIGHT = 1.0;
export const NEKOPOS_MAX_HEIGHT = 2.5;

// K-Packet 운임표 (주요 국가)
export const KPACKET_RATES: Record<string, { maxWeight: number; rate: number }[]> = {
  'AU': [
    { maxWeight: 0.1, rate: 4520 }, { maxWeight: 0.2, rate: 5890 }, { maxWeight: 0.3, rate: 7260 },
    { maxWeight: 0.4, rate: 8640 }, { maxWeight: 0.5, rate: 10030 }, { maxWeight: 0.6, rate: 11090 },
    { maxWeight: 0.7, rate: 12160 }, { maxWeight: 0.8, rate: 13220 }, { maxWeight: 0.9, rate: 14300 },
    { maxWeight: 1.0, rate: 15380 }, { maxWeight: 1.5, rate: 20320 }, { maxWeight: 2.0, rate: 25260 },
  ],
  'CA': [
    { maxWeight: 0.1, rate: 5370 }, { maxWeight: 0.2, rate: 7010 }, { maxWeight: 0.3, rate: 8640 },
    { maxWeight: 0.4, rate: 10270 }, { maxWeight: 0.5, rate: 11910 }, { maxWeight: 0.6, rate: 13190 },
    { maxWeight: 0.7, rate: 14450 }, { maxWeight: 0.8, rate: 15720 }, { maxWeight: 0.9, rate: 17000 },
    { maxWeight: 1.0, rate: 18280 }, { maxWeight: 1.5, rate: 27430 }, { maxWeight: 2.0, rate: 32710 },
  ],
  'US': [
    { maxWeight: 0.1, rate: 7830 }, { maxWeight: 0.2, rate: 8690 }, { maxWeight: 0.3, rate: 10700 },
    { maxWeight: 0.4, rate: 12750 }, { maxWeight: 0.5, rate: 14800 }, { maxWeight: 0.6, rate: 16370 },
    { maxWeight: 0.7, rate: 17940 }, { maxWeight: 0.8, rate: 19510 }, { maxWeight: 0.9, rate: 21090 },
    { maxWeight: 1.0, rate: 22680 }, { maxWeight: 1.5, rate: 34030 }, { maxWeight: 2.0, rate: 44230 },
  ],
  'JP': [
    { maxWeight: 0.1, rate: 4400 }, { maxWeight: 0.2, rate: 5540 }, { maxWeight: 0.3, rate: 6710 },
    { maxWeight: 0.4, rate: 7870 }, { maxWeight: 0.5, rate: 9040 }, { maxWeight: 0.6, rate: 9970 },
    { maxWeight: 0.7, rate: 10880 }, { maxWeight: 0.8, rate: 11800 }, { maxWeight: 0.9, rate: 12710 },
    { maxWeight: 1.0, rate: 13640 }, { maxWeight: 1.5, rate: 17740 }, { maxWeight: 2.0, rate: 20210 },
  ],
  'HK': [
    { maxWeight: 0.1, rate: 4030 }, { maxWeight: 0.2, rate: 5080 }, { maxWeight: 0.3, rate: 6140 },
    { maxWeight: 0.4, rate: 7180 }, { maxWeight: 0.5, rate: 8270 }, { maxWeight: 0.6, rate: 9110 },
    { maxWeight: 0.7, rate: 9960 }, { maxWeight: 0.8, rate: 10780 }, { maxWeight: 0.9, rate: 11630 },
    { maxWeight: 1.0, rate: 12470 }, { maxWeight: 1.5, rate: 16240 }, { maxWeight: 2.0, rate: 18490 },
  ],
  'SG': [
    { maxWeight: 0.1, rate: 4550 }, { maxWeight: 0.2, rate: 5640 }, { maxWeight: 0.3, rate: 6730 },
    { maxWeight: 0.4, rate: 7830 }, { maxWeight: 0.5, rate: 8910 }, { maxWeight: 0.6, rate: 9960 },
    { maxWeight: 0.7, rate: 10980 }, { maxWeight: 0.8, rate: 12010 }, { maxWeight: 0.9, rate: 13050 },
    { maxWeight: 1.0, rate: 14080 }, { maxWeight: 1.5, rate: 17910 }, { maxWeight: 2.0, rate: 22260 },
  ],
  'NZ': [
    { maxWeight: 0.1, rate: 4410 }, { maxWeight: 0.2, rate: 5760 }, { maxWeight: 0.3, rate: 7100 },
    { maxWeight: 0.4, rate: 8440 }, { maxWeight: 0.5, rate: 9800 }, { maxWeight: 0.6, rate: 10850 },
    { maxWeight: 0.7, rate: 11880 }, { maxWeight: 0.8, rate: 12930 }, { maxWeight: 0.9, rate: 13970 },
    { maxWeight: 1.0, rate: 15030 }, { maxWeight: 1.5, rate: 22550 }, { maxWeight: 2.0, rate: 29290 },
  ],
};

// K-Packet 특별운송수수료 (국가별)
export const KPACKET_SURCHARGES: Record<string, number> = {
  'AU': 950,  // 기본료 + 중량당 추가
  'NZ': 2700,
  'CA': 24000,
  'NO': 4500,
  'BR': 5000,
  'default': 0,
};

// EMS 운임표 (주요 국가, 0.5kg 단위)
export const EMS_RATES: Record<string, { maxWeight: number; rate: number }[]> = {
  'JP': [
    { maxWeight: 0.5, rate: 19740 }, { maxWeight: 0.75, rate: 20580 }, { maxWeight: 1.0, rate: 21420 },
    { maxWeight: 1.5, rate: 23940 }, { maxWeight: 2.0, rate: 27720 }, { maxWeight: 3.0, rate: 30660 },
    { maxWeight: 5.0, rate: 36120 }, { maxWeight: 10.0, rate: 50400 }, { maxWeight: 20.0, rate: 76860 },
  ],
  'US': [
    { maxWeight: 0.5, rate: 22260 }, { maxWeight: 0.75, rate: 25200 }, { maxWeight: 1.0, rate: 28140 },
    { maxWeight: 1.5, rate: 34020 }, { maxWeight: 2.0, rate: 39900 }, { maxWeight: 3.0, rate: 51240 },
    { maxWeight: 5.0, rate: 73920 }, { maxWeight: 10.0, rate: 131040 }, { maxWeight: 20.0, rate: 245280 },
  ],
  'AU': [
    { maxWeight: 0.5, rate: 19320 }, { maxWeight: 0.75, rate: 21840 }, { maxWeight: 1.0, rate: 24360 },
    { maxWeight: 1.5, rate: 29400 }, { maxWeight: 2.0, rate: 34860 }, { maxWeight: 3.0, rate: 42840 },
    { maxWeight: 5.0, rate: 58800 }, { maxWeight: 10.0, rate: 99120 }, { maxWeight: 20.0, rate: 179760 },
  ],
  'HK': [
    { maxWeight: 0.5, rate: 18900 }, { maxWeight: 0.75, rate: 19740 }, { maxWeight: 1.0, rate: 20580 },
    { maxWeight: 1.5, rate: 22260 }, { maxWeight: 2.0, rate: 23940 }, { maxWeight: 3.0, rate: 26460 },
    { maxWeight: 5.0, rate: 31080 }, { maxWeight: 10.0, rate: 45360 }, { maxWeight: 20.0, rate: 78540 },
  ],
  'SG': [
    { maxWeight: 0.5, rate: 12600 }, { maxWeight: 0.75, rate: 13860 }, { maxWeight: 1.0, rate: 15120 },
    { maxWeight: 1.5, rate: 17640 }, { maxWeight: 2.0, rate: 20160 }, { maxWeight: 3.0, rate: 23940 },
    { maxWeight: 5.0, rate: 31500 }, { maxWeight: 10.0, rate: 51240 }, { maxWeight: 20.0, rate: 90300 },
  ],
};

// USPS 운임표 (미국향)
export const USPS_RATES: { maxWeight: number; rate: number }[] = [
  { maxWeight: 0.1, rate: 6280 }, { maxWeight: 0.2, rate: 7380 }, { maxWeight: 0.3, rate: 9890 },
  { maxWeight: 0.4, rate: 11380 }, { maxWeight: 0.5, rate: 14870 }, { maxWeight: 0.6, rate: 15750 },
  { maxWeight: 0.7, rate: 16630 }, { maxWeight: 0.8, rate: 17510 }, { maxWeight: 0.9, rate: 18390 },
  { maxWeight: 1.0, rate: 21990 }, { maxWeight: 1.5, rate: 27850 }, { maxWeight: 2.0, rate: 32600 },
  { maxWeight: 3.0, rate: 44970 }, { maxWeight: 5.0, rate: 71620 }, { maxWeight: 10.0, rate: 131910 },
];

// SF Express 운임표 (주요 국가)
export const SF_RATES: Record<string, { maxWeight: number; rate: number }[]> = {
  'JP': [
    { maxWeight: 0.5, rate: 30600 }, { maxWeight: 1.0, rate: 32740 }, { maxWeight: 1.5, rate: 34880 },
    { maxWeight: 2.0, rate: 37020 }, { maxWeight: 3.0, rate: 41090 }, { maxWeight: 5.0, rate: 48790 },
  ],
  'HK': [
    { maxWeight: 0.5, rate: 14890 }, { maxWeight: 1.0, rate: 15700 }, { maxWeight: 1.5, rate: 16510 },
    { maxWeight: 2.0, rate: 17310 }, { maxWeight: 3.0, rate: 19110 }, { maxWeight: 5.0, rate: 23090 },
  ],
  'SG': [
    { maxWeight: 0.5, rate: 19060 }, { maxWeight: 1.0, rate: 20970 }, { maxWeight: 1.5, rate: 22900 },
    { maxWeight: 2.0, rate: 24820 }, { maxWeight: 3.0, rate: 28680 }, { maxWeight: 5.0, rate: 36120 },
  ],
  'US': [
    { maxWeight: 0.5, rate: 58740 }, { maxWeight: 1.0, rate: 65810 }, { maxWeight: 1.5, rate: 72870 },
    { maxWeight: 2.0, rate: 79930 }, { maxWeight: 3.0, rate: 93840 }, { maxWeight: 5.0, rate: 121230 },
  ],
};

// 환율 (실시간 연동 전 기본값)
export const EXCHANGE_RATES: Record<string, number> = {
  'USD': 1350,  // 1 USD = 1,350 KRW
  'JPY': 9,     // 1 JPY = 9 KRW
  'EUR': 1450,  // 1 EUR = 1,450 KRW
  'AUD': 880,   // 1 AUD = 880 KRW
  'CAD': 980,   // 1 CAD = 980 KRW
  'SGD': 1000,  // 1 SGD = 1,000 KRW
  'HKD': 175,   // 1 HKD = 175 KRW
  'TWD': 42,    // 1 TWD = 42 KRW
  'MYR': 290,   // 1 MYR = 290 KRW
  'VND': 0.055, // 1 VND = 0.055 KRW
  'GBP': 1700,  // 1 GBP = 1,700 KRW
  'NZD': 800,   // 1 NZD = 800 KRW
};

// 운송사별 지원 국가
export const CARRIER_AVAILABILITY: Record<CarrierType, string[]> = {
  'YAMATO': ['JP'],
  'NEKOPOS': ['JP'],
  'KPACKET': ['AU', 'BR', 'CA', 'CN', 'FR', 'DE', 'HK', 'ID', 'JP', 'MY', 'NZ', 'PH', 'RU', 'SG', 'ES', 'TW', 'TH', 'GB', 'US', 'VN'],
  'EMS': ['AU', 'BR', 'CA', 'CN', 'FR', 'DE', 'HK', 'ID', 'JP', 'MY', 'NZ', 'PH', 'RU', 'SG', 'ES', 'TW', 'TH', 'GB', 'US', 'VN'],
  'SF': ['JP', 'HK', 'SG', 'MY', 'TW', 'US', 'CN', 'PH', 'NZ', 'AE', 'GB', 'FR', 'DE'],
  'UPS': ['JP', 'US', 'HK', 'SG', 'AU', 'CA', 'GB', 'DE', 'FR'],
  'USPS': ['US'],
  'FEDEX': ['US', 'CA', 'AU', 'GB', 'DE', 'FR'],
  'CXC': ['HK'],
};

// 추천 운송사 우선순위 (국가별)
export const RECOMMENDED_CARRIERS: Record<string, CarrierType[]> = {
  'JP': ['YAMATO', 'NEKOPOS', 'KPACKET', 'EMS'],
  'US': ['USPS', 'KPACKET', 'EMS', 'SF'],
  'HK': ['CXC', 'KPACKET', 'SF', 'EMS'],
  'SG': ['KPACKET', 'SF', 'EMS'],
  'AU': ['KPACKET', 'EMS'],
  'CA': ['KPACKET', 'EMS'],
  'TW': ['KPACKET', 'SF', 'EMS'],
  'default': ['KPACKET', 'EMS'],
};

