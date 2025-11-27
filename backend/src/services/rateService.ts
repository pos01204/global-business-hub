/**
 * 물류 요금표 서비스
 * - 표준 요금표 데이터 관리
 * - 정산서 금액 검증
 * - 예상 요금 계산
 */

// ============================================================
// 롯데글로벌 요금표 (서비스 운임료.csv 기준)
// ============================================================
interface LotteRateTable {
  [country: string]: {
    service: string;
    rates: { [weight: string]: number };
    maxWeight: number;
    notes?: string;
  };
}

const LOTTE_RATES: LotteRateTable = {
  JP: {
    service: 'YAMATO',
    maxWeight: 30,
    rates: {
      '0.1': 5680, '0.2': 6140, '0.3': 6310, '0.4': 6310, '0.5': 6310,
      '0.6': 6710, '0.7': 6710, '0.8': 7140, '0.9': 7140, '1.0': 7140,
      '1.1': 7920, '1.2': 7920, '1.3': 7920, '1.4': 7920, '1.5': 7920,
      '1.6': 9050, '1.7': 9050, '1.8': 9050, '1.9': 9050, '2.0': 9050,
      '2.5': 10610, '3.0': 11450, '3.5': 12270, '4.0': 13210, '4.5': 14040,
      '5.0': 14870, '5.5': 16640, '6.0': 17470, '6.5': 18410, '7.0': 19240,
      '7.5': 20070, '8.0': 20910, '8.5': 21840, '9.0': 22670, '9.5': 23500,
      '10.0': 24330, '10.5': 31020, '11.0': 31710, '11.5': 32400, '12.0': 33100,
      '12.5': 33790, '13.0': 34480, '13.5': 35180, '14.0': 35870, '14.5': 36560,
      '15.0': 37250, '15.5': 39930, '16.0': 40620, '16.5': 41320, '17.0': 42010,
      '17.5': 42710, '18.0': 43400, '18.5': 44100, '19.0': 44780, '19.5': 45490,
      '20.0': 46170, '21.0': 49540, '22.0': 50930, '23.0': 52310, '24.0': 53700,
      '25.0': 55080, '26.0': 59450, '27.0': 60840, '28.0': 62220, '29.0': 63610,
      '30.0': 65000,
    },
    notes: '오키나와 지역 JPY 1,000 추가',
  },
  JP_NEKOPOS: {
    service: 'Nekopos',
    maxWeight: 1.0,
    rates: {
      '0.1': 4000, '0.2': 4000, '0.3': 4000, '0.4': 4000, '0.5': 4000,
      '0.6': 4000, '0.7': 4000, '0.8': 4000, '0.9': 4000, '1.0': 4000,
    },
    notes: '높이 2.5cm 이하만 가능',
  },
  US: {
    service: 'USPS',
    maxWeight: 20,
    rates: {
      '0.1': 6280, '0.2': 7380, '0.3': 9890, '0.4': 11380, '0.5': 14870,
      '0.6': 15750, '0.7': 16630, '0.8': 17510, '0.9': 18390, '1.0': 21990,
      '1.1': 22870, '1.2': 23750, '1.3': 24630, '1.4': 26970, '1.5': 27850,
      '1.6': 28730, '1.7': 29610, '1.8': 30490, '1.9': 31720, '2.0': 32600,
      '2.5': 39910, '3.0': 44970, '3.5': 50950, '4.0': 56660, '4.5': 62760,
      '5.0': 71620, '5.5': 77830, '6.0': 85350, '6.5': 91310, '7.0': 97690,
      '7.5': 103840, '8.0': 109900, '8.5': 115400, '9.0': 120620, '9.5': 126640,
      '10.0': 131910, '10.5': 138780, '11.0': 144650, '11.5': 151680, '12.0': 160160,
      '12.5': 165930, '13.0': 171080, '13.5': 176270, '14.0': 181430, '14.5': 186520,
      '15.0': 191710, '15.5': 198650, '16.0': 205000, '16.5': 210550, '17.0': 216260,
      '17.5': 222030, '18.0': 227840, '18.5': 232950, '19.0': 238550, '19.5': 244160,
      '20.0': 249750,
    },
  },
  HK: {
    service: 'CXC',
    maxWeight: 30,
    rates: {
      '0.1': 8240, '0.2': 8450, '0.3': 8660, '0.4': 8970, '0.5': 9170,
      '0.6': 9480, '0.7': 9690, '0.8': 9790, '0.9': 10200, '1.0': 10410,
      '1.1': 10720, '1.2': 11030, '1.3': 11230, '1.4': 11440, '1.5': 11750,
      '1.6': 11950, '1.7': 12160, '1.8': 12470, '1.9': 12780, '2.0': 13090,
      '2.5': 15360, '3.0': 17330, '3.5': 19310, '4.0': 21270, '4.5': 24230,
      '5.0': 26210, '5.5': 28180, '6.0': 30140, '6.5': 32120, '7.0': 34090,
      '7.5': 38030, '8.0': 40000, '8.5': 41980, '9.0': 43940, '9.5': 45920,
      '10.0': 47890,
    },
  },
  SG: {
    service: 'CJ Logistics',
    maxWeight: 30,
    rates: {
      '0.1': 4430, '0.2': 5000, '0.3': 5570, '0.4': 6140, '0.5': 6710,
      '0.6': 7290, '0.7': 7970, '0.8': 8540, '0.9': 9110, '1.0': 9680,
      '1.1': 10480, '1.2': 11050, '1.3': 11620, '1.4': 12190, '1.5': 12760,
      '1.6': 13340, '1.7': 13910, '1.8': 14480, '1.9': 15050, '2.0': 16060,
      '2.5': 18810, '3.0': 21670, '3.5': 24420, '4.0': 27830, '4.5': 31020,
      '5.0': 33880, '5.5': 38060, '6.0': 40920, '6.5': 44990, '7.0': 47850,
      '7.5': 52140, '8.0': 55000, '8.5': 58630, '9.0': 61490, '9.5': 65670,
      '10.0': 68420,
    },
  },
  MY_EAST: {
    service: 'Skynet (East)',
    maxWeight: 30,
    rates: {
      '0.1': 6160, '0.2': 6810, '0.3': 7450, '0.4': 7990, '0.5': 8640,
      '0.6': 9180, '0.7': 9820, '0.8': 10470, '0.9': 11010, '1.0': 11650,
      '1.1': 16670, '1.2': 17210, '1.3': 17850, '1.4': 18390, '1.5': 19040,
      '1.6': 19680, '1.7': 20220, '1.8': 20870, '1.9': 21510, '2.0': 22050,
      '2.5': 27250, '3.0': 32450, '3.5': 37760, '4.0': 42960, '4.5': 48160,
      '5.0': 53360,
    },
  },
  MY_WEST: {
    service: 'Skynet (West)',
    maxWeight: 30,
    rates: {
      '0.1': 3110, '0.2': 3620, '0.3': 4240, '0.4': 4750, '0.5': 5360,
      '0.6': 5870, '0.7': 6480, '0.8': 6990, '0.9': 7610, '1.0': 8120,
      '1.1': 9150, '1.2': 9660, '1.3': 10270, '1.4': 10780, '1.5': 11290,
      '1.6': 11900, '1.7': 12410, '1.8': 13030, '1.9': 13540, '2.0': 14150,
      '2.5': 17320, '3.0': 20080, '3.5': 23350, '4.0': 26110, '4.5': 29280,
      '5.0': 32040,
    },
  },
  TW: {
    service: 'HCT',
    maxWeight: 30,
    rates: {
      '0.1': 5670, '0.2': 6510, '0.3': 7350, '0.4': 8090, '0.5': 8930,
      '0.6': 9770, '0.7': 10500, '0.8': 11340, '0.9': 12180, '1.0': 12920,
      '1.1': 13760, '1.2': 14600, '1.3': 15330, '1.4': 16170, '1.5': 17010,
      '1.6': 17750, '1.7': 18590, '1.8': 19430, '1.9': 20160, '2.0': 21000,
      '2.5': 24990, '3.0': 29090, '3.5': 33080, '4.0': 37070, '4.5': 41160,
      '5.0': 45150,
    },
  },
  AU: {
    service: 'AusPost',
    maxWeight: 10,
    rates: {
      '0.1': 7000, '0.2': 7400, '0.3': 8500, '0.4': 9600, '0.5': 10700,
      '0.6': 12100, '0.7': 13200, '0.8': 14300, '0.9': 15600, '1.0': 16700,
      '1.1': 18100, '1.2': 19200, '1.3': 20300, '1.4': 21400, '1.5': 22500,
      '1.6': 23700, '1.7': 24800, '1.8': 25900, '1.9': 27100, '2.0': 28200,
      '2.5': 34800, '3.0': 40500, '3.5': 46000, '4.0': 51700, '4.5': 57400,
      '5.0': 63100, '5.5': 72200, '6.0': 77900, '6.5': 83400, '7.0': 89100,
      '7.5': 95700, '8.0': 101400, '8.5': 107000, '9.0': 112700, '9.5': 118300,
      '10.0': 123900,
    },
  },
  CA: {
    service: 'CanadaPost',
    maxWeight: 10,
    rates: {
      '0.1': 8800, '0.2': 10800, '0.3': 13500, '0.4': 15800, '0.5': 18000,
      '0.6': 20800, '0.7': 22800, '0.8': 24800, '0.9': 26800, '1.0': 28800,
      '1.1': 31700, '1.2': 33700, '1.3': 35700, '1.4': 37700, '1.5': 39700,
      '1.6': 43800, '1.7': 45800, '1.8': 47800, '1.9': 49800, '2.0': 51700,
      '2.5': 61700, '3.0': 72200, '3.5': 82700, '4.0': 93100, '4.5': 103900,
      '5.0': 113900,
    },
  },
};

// ============================================================
// EMS 요금표 (ems 비용.csv 기준)
// ============================================================
interface EmsRateTable {
  [country: string]: { [weight: string]: number };
}

const EMS_RATES: EmsRateTable = {
  JP: {
    '0.5': 19740, '0.75': 20580, '1.0': 21420, '1.25': 23100, '1.5': 23940,
    '1.75': 26040, '2.0': 27720, '2.5': 28980, '3.0': 30660, '3.5': 31920,
    '4.0': 33600, '4.5': 34860, '5.0': 36120, '5.5': 37800, '6.0': 39060,
    '6.5': 40740, '7.0': 42000, '7.5': 43260, '8.0': 44940, '8.5': 46200,
    '9.0': 47880, '9.5': 49140, '10.0': 50400,
  },
  US: {
    '0.5': 22260, '0.75': 25200, '1.0': 28140, '1.25': 31080, '1.5': 34020,
    '1.75': 36960, '2.0': 39900, '2.5': 45780, '3.0': 51240, '3.5': 57120,
    '4.0': 62580, '4.5': 68460, '5.0': 73920, '5.5': 79800, '6.0': 85680,
    '6.5': 91140, '7.0': 97020, '7.5': 102480, '8.0': 108360, '8.5': 113820,
    '9.0': 119700, '9.5': 125580, '10.0': 131040,
  },
  AU: {
    '0.5': 19320, '0.75': 21840, '1.0': 24360, '1.25': 26880, '1.5': 29400,
    '1.75': 32340, '2.0': 34860, '2.5': 39060, '3.0': 42840, '3.5': 47040,
    '4.0': 50820, '4.5': 55020, '5.0': 58800, '5.5': 63000, '6.0': 67200,
    '6.5': 70980, '7.0': 75180, '7.5': 78960, '8.0': 83160, '8.5': 87360,
    '9.0': 91140, '9.5': 95340, '10.0': 99120,
  },
  CA: {
    '0.5': 24360, '0.75': 26040, '1.0': 27720, '1.25': 29400, '1.5': 31080,
    '1.75': 33180, '2.0': 34860, '2.5': 38220, '3.0': 41160, '3.5': 44520,
    '4.0': 47880, '4.5': 50820, '5.0': 54180, '5.5': 57540, '6.0': 60480,
    '6.5': 64260, '7.0': 67620, '7.5': 70980, '8.0': 74760, '8.5': 78120,
    '9.0': 81900, '9.5': 85260, '10.0': 88620,
  },
  NZ: {
    '0.5': 19740, '0.75': 21840, '1.0': 23520, '1.25': 25620, '1.5': 27300,
    '1.75': 29400, '2.0': 31500, '2.5': 34860, '3.0': 38220, '3.5': 42000,
    '4.0': 45360, '4.5': 49140, '5.0': 52500, '5.5': 56280, '6.0': 59640,
    '6.5': 63420, '7.0': 67200, '7.5': 70560, '8.0': 74340, '8.5': 78120,
    '9.0': 81900, '9.5': 85260, '10.0': 89040,
  },
  NO: {
    '0.5': 27720, '0.75': 30240, '1.0': 32760, '1.25': 35280, '1.5': 37800,
    '1.75': 40320, '2.0': 42840, '2.5': 47460, '3.0': 52080, '3.5': 58380,
    '4.0': 64680, '4.5': 71400, '5.0': 77700,
  },
};

// ============================================================
// K-Packet 요금표 (k packet 비용.csv 기준)
// ============================================================
interface KPacketRateTable {
  [country: string]: { [weight: string]: number };
}

const KPACKET_RATES: KPacketRateTable = {
  AU: {
    '0.1': 4520, '0.2': 5890, '0.3': 7260, '0.4': 8640, '0.5': 10030,
    '0.6': 11090, '0.7': 12160, '0.8': 13220, '0.9': 14300, '1.0': 15380,
    '1.1': 16370, '1.2': 17360, '1.3': 18350, '1.4': 19330, '1.5': 20320,
    '1.6': 21310, '1.7': 22300, '1.8': 23280, '1.9': 24270, '2.0': 25260,
  },
  CA: {
    '0.1': 5370, '0.2': 7010, '0.3': 8640, '0.4': 10270, '0.5': 11910,
    '0.6': 13190, '0.7': 14450, '0.8': 15720, '0.9': 17000, '1.0': 18280,
    '1.1': 20120, '1.2': 21950, '1.3': 23770, '1.4': 25610, '1.5': 27430,
    '1.6': 28490, '1.7': 29550, '1.8': 30610, '1.9': 31660, '2.0': 32710,
  },
  JP: {
    '0.1': 4400, '0.2': 5540, '0.3': 6710, '0.4': 7870, '0.5': 9040,
    '0.6': 9970, '0.7': 10880, '0.8': 11800, '0.9': 12710, '1.0': 13640,
    '1.1': 14450, '1.2': 15270, '1.3': 16080, '1.4': 16900, '1.5': 17740,
    '1.6': 18240, '1.7': 18720, '1.8': 19210, '1.9': 19700, '2.0': 20210,
  },
  US: {
    '0.1': 7830, '0.2': 8690, '0.3': 10700, '0.4': 12750, '0.5': 14800,
    '0.6': 16370, '0.7': 17940, '0.8': 19510, '0.9': 21090, '1.0': 22680,
    '1.1': 24960, '1.2': 27230, '1.3': 29500, '1.4': 31760, '1.5': 34030,
    '1.6': 36080, '1.7': 38090, '1.8': 40120, '1.9': 42140, '2.0': 44230,
  },
  NZ: {
    '0.1': 4410, '0.2': 5760, '0.3': 7100, '0.4': 8440, '0.5': 9800,
    '0.6': 10850, '0.7': 11880, '0.8': 12930, '0.9': 13970, '1.0': 15030,
    '1.1': 16530, '1.2': 18030, '1.3': 19550, '1.4': 21050, '1.5': 22550,
    '1.6': 23890, '1.7': 25230, '1.8': 26580, '1.9': 27920, '2.0': 29290,
  },
  VN: {
    '0.1': 4930, '0.2': 5680, '0.3': 6410, '0.4': 7140, '0.5': 7880,
    '0.6': 8620, '0.7': 9360, '0.8': 10100, '0.9': 10840, '1.0': 11570,
    '1.1': 12310, '1.2': 13050, '1.3': 13780, '1.4': 14270, '1.5': 14750,
    '1.6': 15240, '1.7': 15720, '1.8': 16200, '1.9': 16690, '2.0': 17170,
  },
};

// ============================================================
// 국가 코드 매핑
// ============================================================
const COUNTRY_CODE_MAP: Record<string, string> = {
  // 일본
  '일본': 'JP', 'JP': 'JP', 'JAPAN': 'JP', 'Japan': 'JP',
  // 미국
  '미국': 'US', 'US': 'US', 'USA': 'US', 'United States': 'US',
  // 호주
  '호주': 'AU', 'AU': 'AU', 'Australia': 'AU', 'AUSTRALIA': 'AU',
  // 캐나다
  '캐나다': 'CA', 'CA': 'CA', 'Canada': 'CA', 'CANADA': 'CA',
  // 뉴질랜드
  '뉴질랜드': 'NZ', 'NZ': 'NZ', 'New Zealand': 'NZ',
  // 홍콩
  '홍콩': 'HK', 'HK': 'HK', 'Hong Kong': 'HK',
  // 싱가포르
  '싱가포르': 'SG', 'SG': 'SG', 'Singapore': 'SG',
  // 말레이시아
  '말레이시아': 'MY', 'MY': 'MY', 'Malaysia': 'MY',
  // 대만
  '대만': 'TW', 'TW': 'TW', 'Taiwan': 'TW',
  // 베트남
  '베트남': 'VN', 'VN': 'VN', 'Vietnam': 'VN',
  // 노르웨이
  '노르웨이': 'NO', 'NO': 'NO', 'Norway': 'NO',
  // 기타 3지역
  '3지역': 'ZONE3',
};

// ============================================================
// 운송사 코드 매핑
// ============================================================
const CARRIER_MAP: Record<string, string> = {
  'LOTTEGLOBAL': 'LOTTE',
  'LOTTE GLOBAL': 'LOTTE',
  'KPACKET': 'KPACKET',
  'K-PACKET': 'KPACKET',
  'EMS': 'EMS',
};

// ============================================================
// 요금 검증 결과 타입
// ============================================================
export interface RateValidationResult {
  isValid: boolean;
  expectedRate: number | null;
  actualRate: number;
  difference: number;
  differencePercent: number;
  status: 'normal' | 'warning' | 'error' | 'unknown';
  message: string;
  details: {
    carrier: string;
    country: string;
    countryCode: string;
    weight: number;
    service?: string;
    rateSource?: string;
  };
}

// ============================================================
// 요금 계산 서비스
// ============================================================
export class RateService {
  /**
   * 국가명을 코드로 변환
   */
  private normalizeCountry(country: string): string {
    const normalized = country?.trim().toUpperCase();
    return COUNTRY_CODE_MAP[country] || COUNTRY_CODE_MAP[normalized] || country;
  }

  /**
   * 운송사 코드 정규화
   */
  private normalizeCarrier(carrier: string): string {
    const normalized = carrier?.trim().toUpperCase();
    return CARRIER_MAP[normalized] || normalized;
  }

  /**
   * 중량에 해당하는 요금표 키 찾기
   */
  private findWeightKey(weight: number, rates: { [key: string]: number }): string | null {
    const weightKeys = Object.keys(rates)
      .map(k => parseFloat(k))
      .sort((a, b) => a - b);

    // 해당 중량 이상의 첫 번째 키 찾기
    for (const key of weightKeys) {
      if (weight <= key) {
        return key.toString();
      }
    }

    // 최대 중량 초과 시 null
    return null;
  }

  /**
   * 롯데글로벌 예상 요금 조회
   */
  getExpectedLotteRate(country: string, weight: number): { rate: number; service: string } | null {
    const countryCode = this.normalizeCountry(country);
    
    // 국가별 요금표 조회
    const rateTable = LOTTE_RATES[countryCode];
    if (!rateTable) {
      return null;
    }

    // 중량 초과 확인
    if (weight > rateTable.maxWeight) {
      return null;
    }

    // 중량에 해당하는 요금 찾기
    const weightKey = this.findWeightKey(weight, rateTable.rates);
    if (!weightKey) {
      return null;
    }

    return {
      rate: rateTable.rates[weightKey],
      service: rateTable.service,
    };
  }

  /**
   * K-Packet 예상 요금 조회
   */
  getExpectedKPacketRate(country: string, weight: number): number | null {
    const countryCode = this.normalizeCountry(country);
    const rateTable = KPACKET_RATES[countryCode];
    
    if (!rateTable || weight > 2.0) {
      return null;
    }

    const weightKey = this.findWeightKey(weight, rateTable);
    if (!weightKey) {
      return null;
    }

    return rateTable[weightKey];
  }

  /**
   * EMS 예상 요금 조회
   */
  getExpectedEmsRate(country: string, weight: number): number | null {
    const countryCode = this.normalizeCountry(country);
    const rateTable = EMS_RATES[countryCode];
    
    if (!rateTable) {
      return null;
    }

    const weightKey = this.findWeightKey(weight, rateTable);
    if (!weightKey) {
      return null;
    }

    return rateTable[weightKey];
  }

  /**
   * 정산서 건별 요금 검증
   */
  validateRate(
    carrier: string,
    country: string,
    weight: number,
    actualRate: number
  ): RateValidationResult {
    const normalizedCarrier = this.normalizeCarrier(carrier);
    const countryCode = this.normalizeCountry(country);

    let expectedRate: number | null = null;
    let service: string | undefined;
    let rateSource: string | undefined;

    // 운송사별 예상 요금 조회
    if (normalizedCarrier === 'LOTTE') {
      const lotteRate = this.getExpectedLotteRate(countryCode, weight);
      if (lotteRate) {
        expectedRate = lotteRate.rate;
        service = lotteRate.service;
        rateSource = '롯데글로벌 이코노미';
      }
    } else if (normalizedCarrier === 'KPACKET') {
      expectedRate = this.getExpectedKPacketRate(countryCode, weight);
      service = 'K-Packet';
      rateSource = 'K-Packet';
    } else if (normalizedCarrier === 'EMS') {
      expectedRate = this.getExpectedEmsRate(countryCode, weight);
      service = 'EMS';
      rateSource = 'EMS';
    }

    // 예상 요금 없으면 검증 불가
    if (expectedRate === null) {
      return {
        isValid: true,
        expectedRate: null,
        actualRate,
        difference: 0,
        differencePercent: 0,
        status: 'unknown',
        message: `요금표에 없는 조합 (${normalizedCarrier}, ${countryCode}, ${weight}kg)`,
        details: {
          carrier: normalizedCarrier,
          country,
          countryCode,
          weight,
          service,
          rateSource,
        },
      };
    }

    // 차이 계산
    const difference = actualRate - expectedRate;
    const differencePercent = (difference / expectedRate) * 100;

    // 상태 판정
    let status: 'normal' | 'warning' | 'error' = 'normal';
    let message = '';

    const absDiffPercent = Math.abs(differencePercent);
    
    if (absDiffPercent <= 5) {
      status = 'normal';
      message = '정상 범위';
    } else if (absDiffPercent <= 15) {
      status = 'warning';
      message = `예상 요금 대비 ${differencePercent > 0 ? '초과' : '미달'} (${differencePercent.toFixed(1)}%)`;
    } else {
      status = 'error';
      message = `큰 차이 발생! 예상: ₩${expectedRate.toLocaleString()}, 실제: ₩${actualRate.toLocaleString()} (${differencePercent.toFixed(1)}%)`;
    }

    return {
      isValid: status !== 'error',
      expectedRate,
      actualRate,
      difference,
      differencePercent,
      status,
      message,
      details: {
        carrier: normalizedCarrier,
        country,
        countryCode,
        weight,
        service,
        rateSource,
      },
    };
  }

  /**
   * 정산서 전체 검증
   */
  validateBatch(
    records: Array<{
      carrier: string;
      country: string;
      charged_weight: number;
      total_cost: number;
      id?: string;
    }>
  ): {
    results: Array<RateValidationResult & { recordId?: string }>;
    summary: {
      total: number;
      normal: number;
      warning: number;
      error: number;
      unknown: number;
      totalExpectedCost: number;
      totalActualCost: number;
      totalDifference: number;
    };
  } {
    const results: Array<RateValidationResult & { recordId?: string }> = [];
    let normal = 0;
    let warning = 0;
    let error = 0;
    let unknown = 0;
    let totalExpectedCost = 0;
    let totalActualCost = 0;

    for (const record of records) {
      const result = this.validateRate(
        record.carrier,
        record.country,
        record.charged_weight,
        record.total_cost
      );

      results.push({
        ...result,
        recordId: record.id,
      });

      totalActualCost += record.total_cost;

      switch (result.status) {
        case 'normal':
          normal++;
          if (result.expectedRate) totalExpectedCost += result.expectedRate;
          break;
        case 'warning':
          warning++;
          if (result.expectedRate) totalExpectedCost += result.expectedRate;
          break;
        case 'error':
          error++;
          if (result.expectedRate) totalExpectedCost += result.expectedRate;
          break;
        case 'unknown':
          unknown++;
          break;
      }
    }

    return {
      results,
      summary: {
        total: records.length,
        normal,
        warning,
        error,
        unknown,
        totalExpectedCost,
        totalActualCost,
        totalDifference: totalActualCost - totalExpectedCost,
      },
    };
  }

  /**
   * 지원 국가 목록 조회
   */
  getSupportedCountries(): { code: string; name: string; carriers: string[] }[] {
    const countries: { code: string; name: string; carriers: string[] }[] = [];
    
    const countryNames: Record<string, string> = {
      JP: '일본', US: '미국', AU: '호주', CA: '캐나다', NZ: '뉴질랜드',
      HK: '홍콩', SG: '싱가포르', MY: '말레이시아', TW: '대만', VN: '베트남',
      NO: '노르웨이',
    };

    const allCountries = new Set<string>();
    
    // 롯데글로벌 국가
    Object.keys(LOTTE_RATES).forEach(code => {
      const baseCode = code.replace('_NEKOPOS', '').replace('_EAST', '').replace('_WEST', '');
      allCountries.add(baseCode);
    });
    
    // EMS 국가
    Object.keys(EMS_RATES).forEach(code => allCountries.add(code));
    
    // K-Packet 국가
    Object.keys(KPACKET_RATES).forEach(code => allCountries.add(code));

    allCountries.forEach(code => {
      const carriers: string[] = [];
      
      if (LOTTE_RATES[code] || LOTTE_RATES[`${code}_NEKOPOS`] || 
          LOTTE_RATES[`${code}_EAST`] || LOTTE_RATES[`${code}_WEST`]) {
        carriers.push('LOTTEGLOBAL');
      }
      if (EMS_RATES[code]) carriers.push('EMS');
      if (KPACKET_RATES[code]) carriers.push('KPACKET');

      countries.push({
        code,
        name: countryNames[code] || code,
        carriers,
      });
    });

    return countries.sort((a, b) => a.name.localeCompare(b.name));
  }
}

// 싱글톤 인스턴스 내보내기
export const rateService = new RateService();

