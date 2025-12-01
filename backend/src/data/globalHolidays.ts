/**
 * 글로벌 기념일 마스터 데이터
 * 35개국 주요 기념일, 시즌 이벤트, 쇼핑 시즌 포함
 */

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
    year?: number; // 변동일의 경우 특정 연도
    rule?: string; // 변동 규칙 설명
  };
  category: HolidayCategory;
  importance: 'major' | 'medium' | 'minor';
  marketing: {
    leadTimeDays: number;
    giftGiving: boolean;
    discountExpected: boolean;
    recommendedCategories: string[];
    keyTrends: string[];
    targetAudience?: string[];
  };
  context: {
    description: string;
    culturalNotes?: string;
    doNots?: string[];
    colors?: string[];
    symbols?: string[];
  };
}

// ========================================
// 글로벌 기념일 데이터 (100+ 기념일)
// ========================================

export const GLOBAL_HOLIDAYS: GlobalHoliday[] = [
  // ========================================
  // 1월 기념일
  // ========================================
  {
    id: 'new-year',
    name: { local: 'New Year', english: "New Year's Day", korean: '새해' },
    countries: ['JP', 'US', 'GB', 'DE', 'FR', 'AU', 'CA', 'SG', 'HK', 'TW', 'MY', 'TH', 'VN', 'ID', 'PH', 'IN', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'IE', 'PT', 'BR', 'MX', 'NZ', 'ZA', 'AE', 'IL', 'TR', 'RU', 'CN'],
    date: { month: 1, day: 1 },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['인테리어', '캘린더', '다이어리', '홈데코', '플래너', '문구'],
      keyTrends: ['새출발', '목표', '다짐', '희망', '신년'],
      targetAudience: ['전 연령대', '직장인', '학생'],
    },
    context: {
      description: '새로운 한 해를 맞이하는 글로벌 기념일',
      culturalNotes: '대부분의 국가에서 가장 중요한 공휴일 중 하나',
      colors: ['gold', 'silver', 'white', 'red'],
      symbols: ['불꽃놀이', '샴페인', '카운트다운'],
    },
  },
  {
    id: 'shogatsu',
    name: { local: '正月', english: 'Shogatsu', korean: '일본 설날' },
    countries: ['JP'],
    date: { month: 1, day: 1 },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['전통공예', '화과자', '인테리어', '식기', '의류'],
      keyTrends: ['오세치', '카도마츠', '후쿠부쿠로', '오토시다마'],
      targetAudience: ['가족', '전 연령대'],
    },
    context: {
      description: '일본 최대 명절, 가족과 함께 보내는 시간',
      culturalNotes: '1/1~1/3 연휴, 오세치 요리와 오토시다마(세뱃돈) 문화',
      colors: ['red', 'white', 'gold'],
      symbols: ['가도마츠', '시메카자리', '학'],
    },
  },
  {
    id: 'coming-of-age-jp',
    name: { local: '成人の日', english: 'Coming of Age Day', korean: '성인의 날' },
    countries: ['JP'],
    date: { month: 1, day: 8, rule: '1월 두번째 월요일' },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 45,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['액세서리', '쥬얼리', '기모노 소품', '메이크업', '헤어 액세서리'],
      keyTrends: ['성인', '기념', '전통', '미래', '축하'],
      targetAudience: ['20대 초반', '부모님'],
    },
    context: {
      description: '20세가 된 청년들의 성인식을 축하하는 날',
      culturalNotes: '여성은 후리소데(기모노), 남성은 하카마나 정장 착용',
      colors: ['red', 'white', 'pink', 'gold'],
      symbols: ['후리소데', '하카마'],
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
      recommendedCategories: ['아웃도어', '파티용품', '홈데코', '비치용품'],
      keyTrends: ['여름', '바비큐', '가족', '축제', '해변'],
      targetAudience: ['가족', '야외 활동 애호가'],
    },
    context: {
      description: '호주 건국 기념일, 여름 축제 분위기',
      culturalNotes: '남반구 여름 시즌, 야외 파티 문화',
      colors: ['blue', 'yellow', 'green'],
      symbols: ['캥거루', '코알라', '국기'],
    },
  },
  {
    id: 'republic-day-india',
    name: { local: 'गणतंत्र दिवस', english: 'Republic Day', korean: '공화국의 날' },
    countries: ['IN'],
    date: { month: 1, day: 26 },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['패션', '홈데코', '전자기기'],
      keyTrends: ['애국', '세일', '축제'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '인도 헌법 제정 기념일',
      colors: ['orange', 'white', 'green'],
    },
  },
  
  // ========================================
  // 2월 기념일
  // ========================================
  {
    id: 'setsubun',
    name: { local: '節分', english: 'Setsubun', korean: '세츠분' },
    countries: ['JP'],
    date: { month: 2, day: 3 },
    category: 'cultural',
    importance: 'medium',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: ['식품', '전통공예', '인테리어'],
      keyTrends: ['콩뿌리기', '에호마키', '봄맞이', '액막이'],
      targetAudience: ['가족', '어린이'],
    },
    context: {
      description: '봄을 맞이하는 절기 행사',
      culturalNotes: '콩을 뿌려 귀신을 쫓고 복을 부름',
      colors: ['red', 'gold'],
      symbols: ['콩', '오니(귀신) 가면', '에호마키'],
    },
  },
  {
    id: 'chinese-new-year',
    name: { local: '春节', english: 'Chinese New Year', korean: '춘절/설날' },
    countries: ['CN', 'TW', 'HK', 'SG', 'MY', 'TH', 'VN', 'ID', 'PH'],
    date: { month: 2, day: 10, year: 2024, rule: '음력 1월 1일' },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 45,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['액세서리', '인테리어', '의류', '뷰티', '식품', '쥬얼리'],
      keyTrends: ['행운', '번영', '가족', '빨간색', '금색', '용'],
      targetAudience: ['전 연령대', '선물 구매자'],
    },
    context: {
      description: '중화권 최대 명절, 홍바오(세뱃돈) 문화',
      culturalNotes: '빨간색은 행운, 금색은 번영을 상징. 2~3주간 연휴',
      doNots: ['흰색/검정색 포장', '숫자 4 사용', '칼/가위 선물', '시계 선물'],
      colors: ['red', 'gold'],
      symbols: ['용', '불꽃놀이', '홍바오', '복 글자', '등롱'],
    },
  },
  {
    id: 'tet',
    name: { local: 'Tết', english: 'Tet', korean: '뗏(베트남 설날)' },
    countries: ['VN'],
    date: { month: 2, day: 10, year: 2024, rule: '음력 1월 1일' },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 45,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['인테리어', '의류', '식품', '꽃'],
      keyTrends: ['행운', '가족', '노란색', '매화'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '베트남 최대 명절',
      culturalNotes: '매화꽃과 노란색이 행운의 상징',
      colors: ['yellow', 'red', 'pink'],
      symbols: ['매화', '금귤나무'],
    },
  },
  {
    id: 'valentines-day',
    name: { local: "Valentine's Day", english: "Valentine's Day", korean: '발렌타인데이' },
    countries: ['JP', 'US', 'GB', 'DE', 'FR', 'AU', 'CA', 'IT', 'ES', 'TW', 'HK', 'SG', 'TH', 'PH', 'BR', 'MX', 'NL', 'BE', 'CH', 'AT', 'SE', 'NZ', 'IN'],
    date: { month: 2, day: 14 },
    category: 'romantic',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['액세서리', '쥬얼리', '초콜릿', '꽃', '향수', '캔들', '뷰티'],
      keyTrends: ['사랑', '로맨스', '연인', '고백', '초콜릿'],
      targetAudience: ['20-40대', '연인', '싱글'],
    },
    context: {
      description: '연인의 날, 사랑을 표현하는 날',
      culturalNotes: '일본에서는 여성이 남성에게 초콜릿 선물, 의리초코 문화',
      colors: ['red', 'pink', 'white'],
      symbols: ['하트', '큐피드', '장미', '초콜릿'],
    },
  },
  {
    id: 'mardi-gras',
    name: { local: 'Mardi Gras', english: 'Mardi Gras', korean: '마르디 그라' },
    countries: ['US', 'BR', 'FR'],
    date: { month: 2, day: 13, year: 2024, rule: '부활절 47일 전' },
    category: 'cultural',
    importance: 'medium',
    marketing: {
      leadTimeDays: 21,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: ['파티용품', '코스튬', '액세서리', '마스크'],
      keyTrends: ['축제', '카니발', '파티', '가면'],
      targetAudience: ['20-40대', '파티 애호가'],
    },
    context: {
      description: '사순절 전 축제, 뉴올리언스/리우 카니발',
      colors: ['purple', 'gold', 'green'],
      symbols: ['마스크', '비즈 목걸이'],
    },
  },

  // ========================================
  // 3월 기념일
  // ========================================
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
      recommendedCategories: ['인형', '전통공예', '화과자', '인테리어', '액세서리'],
      keyTrends: ['여아', '전통', '성장', '핑크', '복숭아'],
      targetAudience: ['부모님', '조부모'],
    },
    context: {
      description: '여자 아이의 건강한 성장을 기원하는 날',
      culturalNotes: '히나 인형을 장식하고 치라시즈시, 히나아라레 준비',
      colors: ['pink', 'green', 'white', 'red'],
      symbols: ['히나 인형', '복숭아꽃', '히시모치'],
    },
  },
  {
    id: 'international-womens-day',
    name: { local: "International Women's Day", english: "International Women's Day", korean: '세계 여성의 날' },
    countries: ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'AU', 'CA', 'RU', 'CN', 'IN', 'BR', 'VN', 'PH'],
    date: { month: 3, day: 8 },
    category: 'cultural',
    importance: 'medium',
    marketing: {
      leadTimeDays: 14,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['뷰티', '액세서리', '패션', '셀프케어', '꽃', '쥬얼리'],
      keyTrends: ['여성', '자기사랑', '임파워먼트', '선물', '감사'],
      targetAudience: ['여성', '선물 구매자'],
    },
    context: {
      description: '여성의 권리와 성취를 기념하는 날',
      culturalNotes: '러시아/동유럽에서는 가장 중요한 기념일 중 하나',
      colors: ['purple', 'pink', 'white'],
      symbols: ['튤립', '미모사꽃'],
    },
  },
  {
    id: 'white-day',
    name: { local: 'ホワイトデー', english: 'White Day', korean: '화이트데이' },
    countries: ['JP', 'TW', 'CN', 'KR'],
    date: { month: 3, day: 14 },
    category: 'romantic',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['액세서리', '쥬얼리', '스위츠', '향수', '플라워', '캔들'],
      keyTrends: ['답례', '프리미엄', '특별함', '화이트', '사탕'],
      targetAudience: ['20-40대 남성', '직장인'],
    },
    context: {
      description: '발렌타인 답례일',
      culturalNotes: '3배 법칙 - 받은 것의 3배 가치로 답례하는 문화',
      colors: ['white', 'pink', 'pastel'],
      symbols: ['마시멜로', '캔디', '쿠키', '화이트 초콜릿'],
    },
  },
  {
    id: 'st-patricks-day',
    name: { local: "St. Patrick's Day", english: "St. Patrick's Day", korean: '성 패트릭의 날' },
    countries: ['IE', 'US', 'GB', 'AU', 'CA'],
    date: { month: 3, day: 17 },
    category: 'cultural',
    importance: 'medium',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: ['파티용품', '의류', '액세서리', '홈데코'],
      keyTrends: ['녹색', '아일랜드', '행운', '클로버'],
      targetAudience: ['20-40대', '파티 애호가'],
    },
    context: {
      description: '아일랜드 수호성인의 날',
      colors: ['green', 'gold'],
      symbols: ['샴록(클로버)', '레프리콘', '무지개'],
    },
  },
  {
    id: 'holi',
    name: { local: 'होली', english: 'Holi', korean: '홀리' },
    countries: ['IN', 'SG', 'MY'],
    date: { month: 3, day: 25, year: 2024, rule: '힌두력 기준' },
    category: 'religious',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['의류', '스킨케어', '식품', '액세서리'],
      keyTrends: ['색채', '봄', '축제', '가족'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '색채의 축제, 봄의 시작을 알리는 힌두교 축제',
      culturalNotes: '색분말과 물을 뿌리며 축하',
      colors: ['multicolor', 'pink', 'purple', 'yellow', 'green'],
      symbols: ['색분말', '물총'],
    },
  },

  // ========================================
  // 4월 기념일
  // ========================================
  {
    id: 'april-fools',
    name: { local: "April Fools' Day", english: "April Fools' Day", korean: '만우절' },
    countries: ['US', 'GB', 'AU', 'CA', 'FR', 'DE', 'JP', 'BR'],
    date: { month: 4, day: 1 },
    category: 'cultural',
    importance: 'minor',
    marketing: {
      leadTimeDays: 7,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: ['장난감', '노벨티', '파티용품'],
      keyTrends: ['유머', '장난', '재미'],
      targetAudience: ['젊은 층'],
    },
    context: {
      description: '장난과 유머의 날',
    },
  },
  {
    id: 'songkran',
    name: { local: 'สงกรานต์', english: 'Songkran', korean: '송끄란(태국 설날)' },
    countries: ['TH'],
    date: { month: 4, day: 13 },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['아웃도어', '워터스포츠', '의류', '뷰티', '여행용품'],
      keyTrends: ['물축제', '새해', '가족', '청소', '정화'],
      targetAudience: ['전 연령대', '관광객'],
    },
    context: {
      description: '태국 전통 새해, 물 축제',
      culturalNotes: '4/13~15 3일간 진행, 물총 놀이로 유명',
      colors: ['blue', 'white', 'gold'],
      symbols: ['물', '자스민 꽃'],
    },
  },
  {
    id: 'easter',
    name: { local: 'Easter', english: 'Easter', korean: '부활절' },
    countries: ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'AU', 'CA', 'NZ', 'NL', 'BE', 'CH', 'AT', 'IE', 'PL', 'BR', 'MX', 'PH'],
    date: { month: 4, day: 20, year: 2025, rule: '춘분 후 첫 보름달 다음 일요일' },
    category: 'religious',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['초콜릿', '인테리어', '키즈', '베이킹', '홈데코'],
      keyTrends: ['봄', '토끼', '달걀', '가족', '부활'],
      targetAudience: ['가족', '어린이'],
    },
    context: {
      description: '기독교 부활절, 봄의 시작을 알리는 축제',
      culturalNotes: '부활절 달걀 찾기, 이스터 버니 문화',
      colors: ['pastel', 'yellow', 'pink', 'green', 'lavender'],
      symbols: ['토끼', '달걀', '십자가', '백합'],
    },
  },
  {
    id: 'earth-day',
    name: { local: 'Earth Day', english: 'Earth Day', korean: '지구의 날' },
    countries: ['US', 'GB', 'DE', 'AU', 'CA', 'JP', 'FR'],
    date: { month: 4, day: 22 },
    category: 'cultural',
    importance: 'medium',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: ['에코제품', '리유저블', '플랜테리어', '천연소재'],
      keyTrends: ['환경', '지속가능', '친환경', '제로웨이스트'],
      targetAudience: ['환경의식 소비자', '젊은 층'],
    },
    context: {
      description: '환경 보호의 중요성을 알리는 날',
      colors: ['green', 'blue', 'brown'],
      symbols: ['지구', '나뭇잎', '리사이클'],
    },
  },
  {
    id: 'anzac-day',
    name: { local: 'ANZAC Day', english: 'ANZAC Day', korean: '안작데이' },
    countries: ['AU', 'NZ'],
    date: { month: 4, day: 25 },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: ['전통공예', '홈데코'],
      keyTrends: ['추모', '국가', '역사'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '호주-뉴질랜드 참전용사 추모일',
      colors: ['red', 'green'],
      symbols: ['양귀비꽃', '로즈마리'],
    },
  },
  {
    id: 'golden-week-jp',
    name: { local: 'ゴールデンウィーク', english: 'Golden Week', korean: '골든위크' },
    countries: ['JP'],
    date: { month: 5, day: 3, rule: '4/29~5/5' },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['아웃도어', '여행용품', '레저', '홈웨어', '피크닉'],
      keyTrends: ['여행', '휴식', '가족', '레저', '연휴'],
      targetAudience: ['가족', '직장인'],
    },
    context: {
      description: '일본 최대 연휴 기간 (4/29~5/5)',
      culturalNotes: '쇼와의 날, 헌법기념일, 어린이날 등 연속 공휴일',
      colors: ['green', 'blue', 'pink'],
      symbols: ['잉어깃발', '철쭉'],
    },
  },

  // ========================================
  // 5월 기념일
  // ========================================
  {
    id: 'labor-day-intl',
    name: { local: 'Labour Day', english: 'Labour Day', korean: '노동절' },
    countries: ['FR', 'DE', 'IT', 'ES', 'CN', 'TW', 'HK', 'SG', 'TH', 'VN', 'ID', 'MY', 'BR', 'MX', 'AU', 'RU'],
    date: { month: 5, day: 1 },
    category: 'national',
    importance: 'medium',
    marketing: {
      leadTimeDays: 7,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['전체'],
      keyTrends: ['근로자', '세일', '연휴'],
      targetAudience: ['직장인'],
    },
    context: {
      description: '국제 노동절, 많은 국가에서 공휴일',
    },
  },
  {
    id: 'kodomo-no-hi',
    name: { local: 'こどもの日', english: "Children's Day", korean: '어린이의 날(일본)' },
    countries: ['JP'],
    date: { month: 5, day: 5 },
    category: 'family',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['장난감', '키즈의류', '전통공예', '교육용품'],
      keyTrends: ['남아', '성장', '건강', '잉어깃발'],
      targetAudience: ['부모님', '조부모'],
    },
    context: {
      description: '어린이(특히 남아)의 건강과 성장을 기원하는 날',
      culturalNotes: '코이노보리(잉어깃발)를 걸고 카시와모치 준비',
      colors: ['blue', 'red', 'gold'],
      symbols: ['코이노보리', '무사인형', '카부토'],
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
      recommendedCategories: ['파티용품', '인테리어', '푸드', '의류'],
      keyTrends: ['멕시코', '축제', '컬러풀', '파티', '피에스타'],
      targetAudience: ['20-40대', '파티 애호가'],
    },
    context: {
      description: '멕시코 푸에블라 전투 승리 기념일',
      culturalNotes: '미국에서 특히 큰 축제로 발전',
      colors: ['green', 'red', 'white'],
      symbols: ['솜브레로', '마라카스', '피냐타'],
    },
  },
  {
    id: 'vesak',
    name: { local: 'Vesak', english: 'Vesak Day', korean: '석가탄신일' },
    countries: ['SG', 'MY', 'TH', 'VN', 'ID', 'IN'],
    date: { month: 5, day: 23, year: 2024, rule: '음력 4월 보름' },
    category: 'religious',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: ['인테리어', '캔들', '명상용품'],
      keyTrends: ['평화', '명상', '불교', '연등'],
      targetAudience: ['불교신자'],
    },
    context: {
      description: '부처님 오신 날',
      colors: ['gold', 'white', 'red'],
      symbols: ['연꽃', '연등'],
    },
  },
  {
    id: 'mothers-day-us',
    name: { local: "Mother's Day", english: "Mother's Day", korean: '어머니의 날' },
    countries: ['US', 'AU', 'CA', 'DE', 'IT', 'JP', 'TW', 'HK', 'SG', 'NZ', 'BE', 'NL', 'CH', 'AT', 'BR', 'IN', 'TH', 'PH', 'MY'],
    date: { month: 5, day: 11, year: 2025, rule: '5월 두번째 일요일' },
    category: 'family',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['쥬얼리', '플라워', '뷰티', '홈데코', '캔들', '향수', '스파용품'],
      keyTrends: ['감사', '어머니', '가족', '사랑', '카네이션'],
      targetAudience: ['20-50대', '자녀'],
    },
    context: {
      description: '어머니에 대한 감사와 사랑을 표현하는 날',
      colors: ['pink', 'red', 'white'],
      symbols: ['카네이션', '하트', '꽃다발'],
    },
  },
  {
    id: 'memorial-day-us',
    name: { local: 'Memorial Day', english: 'Memorial Day', korean: '현충일(미국)' },
    countries: ['US'],
    date: { month: 5, day: 26, year: 2025, rule: '5월 마지막 월요일' },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['아웃도어', '바비큐', '파티용품', '패션'],
      keyTrends: ['여름시작', '바비큐', '세일', '연휴'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '전몰장병 추모일, 여름 시즌 시작',
      culturalNotes: '비공식적인 여름 시작, 대규모 세일 시즌',
      colors: ['red', 'white', 'blue'],
    },
  },

  // ========================================
  // 6월 기념일
  // ========================================
  {
    id: 'dragon-boat',
    name: { local: '端午节', english: 'Dragon Boat Festival', korean: '단오절' },
    countries: ['CN', 'TW', 'HK', 'SG', 'MY'],
    date: { month: 6, day: 10, year: 2024, rule: '음력 5월 5일' },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['식품', '전통공예', '홈데코'],
      keyTrends: ['쫑쯔', '용선경주', '액막이', '건강'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '중화권 전통 명절, 쫑쯔를 먹고 용선 경주',
      colors: ['red', 'gold', 'green'],
      symbols: ['용선', '쫑쯔', '쑥'],
    },
  },
  {
    id: 'fathers-day',
    name: { local: "Father's Day", english: "Father's Day", korean: '아버지의 날' },
    countries: ['US', 'CA', 'GB', 'JP', 'AU', 'NZ', 'FR', 'HK', 'SG', 'TW', 'IN', 'PH', 'MY', 'NL', 'BE'],
    date: { month: 6, day: 15, year: 2025, rule: '6월 세번째 일요일' },
    category: 'family',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['가죽소품', '시계', '향수', '술잔', '도구', '넥타이', '골프용품'],
      keyTrends: ['아버지', '감사', '남성', '클래식', '품격'],
      targetAudience: ['20-50대', '자녀'],
    },
    context: {
      description: '아버지에 대한 감사와 사랑을 표현하는 날',
      colors: ['blue', 'navy', 'brown', 'green'],
      symbols: ['넥타이', '골프', '시계'],
    },
  },
  {
    id: 'mid-year-sale',
    name: { local: 'Mid-Year Sale', english: 'Mid-Year Sale', korean: '연중 세일' },
    countries: ['SG', 'MY', 'TH', 'AU'],
    date: { month: 6, day: 1, rule: '6월 전체' },
    category: 'shopping',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['전체'],
      keyTrends: ['할인', '쇼핑', '반기결산'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '동남아/호주 연중 대규모 세일 시즌',
    },
  },
  {
    id: 'pride-month',
    name: { local: 'Pride Month', english: 'Pride Month', korean: '프라이드 먼스' },
    countries: ['US', 'CA', 'GB', 'DE', 'AU', 'NL'],
    date: { month: 6, day: 1, rule: '6월 전체' },
    category: 'cultural',
    importance: 'medium',
    marketing: {
      leadTimeDays: 21,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: ['패션', '액세서리', '홈데코'],
      keyTrends: ['다양성', '무지개', '포용', '자긍심'],
      targetAudience: ['LGBTQ+', '지지자'],
    },
    context: {
      description: 'LGBTQ+ 자긍심의 달',
      colors: ['rainbow'],
      symbols: ['무지개 깃발'],
    },
  },

  // ========================================
  // 7월 기념일
  // ========================================
  {
    id: 'canada-day',
    name: { local: 'Canada Day', english: 'Canada Day', korean: '캐나다 데이' },
    countries: ['CA'],
    date: { month: 7, day: 1 },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['아웃도어', '파티용품', '패션', '홈데코'],
      keyTrends: ['애국', '여름', '축제', '바비큐'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '캐나다 건국 기념일',
      colors: ['red', 'white'],
      symbols: ['메이플리프'],
    },
  },
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
      recommendedCategories: ['아웃도어', '파티용품', '홈데코', '패션', '바비큐용품'],
      keyTrends: ['여름', '바비큐', '불꽃놀이', '애국', '레드화이트블루'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '미국 독립 기념일, 대규모 세일 시즌',
      culturalNotes: '불꽃놀이, 바비큐 파티, 퍼레이드',
      colors: ['red', 'white', 'blue'],
      symbols: ['불꽃놀이', '국기', '자유의 여신상'],
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
      recommendedCategories: ['인테리어', '캔들', '전통공예', '수공예', '문구'],
      keyTrends: ['소원', '별', '은하수', '로맨스', '칠석'],
      targetAudience: ['연인', '가족'],
    },
    context: {
      description: '일본 칠석 축제, 소원을 비는 날',
      culturalNotes: '대나무에 소원을 적은 종이를 매달음',
      colors: ['purple', 'blue', 'silver', 'pink'],
      symbols: ['별', '대나무', '탄자쿠(소원종이)'],
    },
  },
  {
    id: 'bastille-day',
    name: { local: 'Fête nationale', english: 'Bastille Day', korean: '프랑스 혁명기념일' },
    countries: ['FR'],
    date: { month: 7, day: 14 },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['패션', '홈데코', '파티용품'],
      keyTrends: ['프랑스', '혁명', '자유', '여름'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '프랑스 대혁명 기념일',
      colors: ['blue', 'white', 'red'],
      symbols: ['에펠탑', '삼색기'],
    },
  },
  {
    id: 'hari-raya-haji',
    name: { local: 'Hari Raya Haji', english: 'Eid al-Adha', korean: '이드 알 아드하' },
    countries: ['MY', 'SG', 'ID', 'AE', 'TR'],
    date: { month: 6, day: 17, year: 2024, rule: '이슬람력 기준' },
    category: 'religious',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['의류', '홈데코', '식품', '향수'],
      keyTrends: ['희생', '가족', '나눔', '축복'],
      targetAudience: ['무슬림'],
    },
    context: {
      description: '이슬람 희생절',
      colors: ['green', 'gold'],
    },
  },

  // ========================================
  // 8월 기념일
  // ========================================
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
      recommendedCategories: ['홈데코', '패션', '액세서리', '파티용품'],
      keyTrends: ['애국', '축제', '세일', '빨간색'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '싱가포르 독립 기념일',
      culturalNotes: '대규모 퍼레이드와 불꽃놀이',
      colors: ['red', 'white'],
      symbols: ['머라이언', '국기'],
    },
  },
  {
    id: 'obon',
    name: { local: 'お盆', english: 'Obon', korean: '오봉(백중)' },
    countries: ['JP'],
    date: { month: 8, day: 15, rule: '8/13~16' },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['전통공예', '인테리어', '선물세트', '푸드', '여행용품'],
      keyTrends: ['조상', '귀향', '가족', '전통', '오추겐'],
      targetAudience: ['가족', '직장인'],
    },
    context: {
      description: '일본 조상 기리는 명절, 연휴 기간',
      culturalNotes: '오추겐(선물) 시즌, 본 오도리 축제',
      colors: ['white', 'purple', 'green'],
      symbols: ['등롱', '분재', '나스비말'],
    },
  },
  {
    id: 'independence-day-india',
    name: { local: 'स्वतंत्रता दिवस', english: 'Independence Day', korean: '인도 독립기념일' },
    countries: ['IN'],
    date: { month: 8, day: 15 },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['패션', '전자기기', '홈데코'],
      keyTrends: ['애국', '자유', '세일'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '인도 독립 기념일',
      colors: ['orange', 'white', 'green'],
    },
  },
  {
    id: 'national-day-id',
    name: { local: 'Hari Kemerdekaan', english: 'Independence Day', korean: '인도네시아 독립기념일' },
    countries: ['ID'],
    date: { month: 8, day: 17 },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['패션', '홈데코'],
      keyTrends: ['애국', '독립', '축제'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '인도네시아 독립 기념일',
      colors: ['red', 'white'],
    },
  },
  {
    id: 'back-to-school',
    name: { local: 'Back to School', english: 'Back to School', korean: '백투스쿨' },
    countries: ['US', 'CA', 'GB', 'AU', 'FR', 'DE'],
    date: { month: 8, day: 15, rule: '8월 중순~9월 초' },
    category: 'seasonal',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['문구', '가방', '의류', '전자기기', '인테리어'],
      keyTrends: ['개학', '학용품', '새출발', '학생'],
      targetAudience: ['학생', '부모'],
    },
    context: {
      description: '개학 시즌 쇼핑 기간',
      culturalNotes: '미국 2번째로 큰 쇼핑 시즌',
    },
  },

  // ========================================
  // 9월 기념일
  // ========================================
  {
    id: 'labor-day-us',
    name: { local: 'Labor Day', english: 'Labor Day', korean: '노동절(미국)' },
    countries: ['US', 'CA'],
    date: { month: 9, day: 1, year: 2025, rule: '9월 첫째 월요일' },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['가을패션', '홈데코', '아웃도어', '전자기기'],
      keyTrends: ['여름끝', '가을시작', '세일', '연휴'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '미국/캐나다 노동절, 여름 끝 세일',
      culturalNotes: '비공식적인 여름 종료, 대규모 세일',
    },
  },
  {
    id: 'mid-autumn',
    name: { local: '中秋节', english: 'Mid-Autumn Festival', korean: '중추절(추석)' },
    countries: ['CN', 'TW', 'HK', 'SG', 'MY', 'VN'],
    date: { month: 9, day: 17, year: 2024, rule: '음력 8월 15일' },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['선물세트', '전통공예', '티세트', '인테리어', '월병'],
      keyTrends: ['달', '가족', '월병', '감사', '단원'],
      targetAudience: ['전 연령대', '선물 구매자'],
    },
    context: {
      description: '중화권 추수 감사절, 월병 교환 문화',
      culturalNotes: '보름달 아래 가족이 모여 월병을 나눔',
      colors: ['gold', 'red', 'yellow'],
      symbols: ['달', '월병', '등롱', '토끼'],
    },
  },
  {
    id: 'respect-for-aged-day',
    name: { local: '敬老の日', english: 'Respect for the Aged Day', korean: '경로의 날' },
    countries: ['JP'],
    date: { month: 9, day: 15, year: 2025, rule: '9월 세번째 월요일' },
    category: 'family',
    importance: 'medium',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['건강식품', '마사지용품', '꽃', '전통공예', '티세트'],
      keyTrends: ['효도', '건강', '감사', '장수'],
      targetAudience: ['30-50대', '손자녀'],
    },
    context: {
      description: '어르신들께 감사와 존경을 표하는 날',
      colors: ['purple', 'gold', 'white'],
    },
  },
  {
    id: 'oktoberfest',
    name: { local: 'Oktoberfest', english: 'Oktoberfest', korean: '옥토버페스트' },
    countries: ['DE', 'US', 'AU', 'CA', 'BR'],
    date: { month: 9, day: 21, year: 2024, rule: '9월 셋째 토요일~10월 첫째 일요일' },
    category: 'cultural',
    importance: 'medium',
    marketing: {
      leadTimeDays: 21,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: ['맥주잔', '전통의상', '파티용품', '홈데코'],
      keyTrends: ['맥주', '독일', '축제', '가을', '바이에른'],
      targetAudience: ['20-40대', '맥주 애호가'],
    },
    context: {
      description: '독일 뮌헨 맥주 축제',
      colors: ['blue', 'white', 'gold'],
      symbols: ['맥주잔', '프레첼', '디른들'],
    },
  },

  // ========================================
  // 10월 기념일
  // ========================================
  {
    id: 'national-day-cn',
    name: { local: '国庆节', english: 'National Day', korean: '중국 국경절' },
    countries: ['CN'],
    date: { month: 10, day: 1, rule: '10/1~7 황금연휴' },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['여행용품', '전자기기', '패션', '홈데코'],
      keyTrends: ['황금연휴', '여행', '애국', '세일'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '중국 건국 기념일, 7일간 황금연휴',
      colors: ['red', 'gold'],
    },
  },
  {
    id: 'thanksgiving-ca',
    name: { local: 'Thanksgiving', english: 'Thanksgiving', korean: '추수감사절(캐나다)' },
    countries: ['CA'],
    date: { month: 10, day: 13, year: 2025, rule: '10월 두번째 월요일' },
    category: 'family',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: ['인테리어', '키친웨어', '캔들', '테이블웨어'],
      keyTrends: ['가족', '수확', '감사', '가을'],
      targetAudience: ['가족'],
    },
    context: {
      description: '캐나다 추수감사절',
      colors: ['orange', 'brown', 'gold', 'red'],
    },
  },
  {
    id: 'diwali',
    name: { local: 'दीवाली', english: 'Diwali', korean: '디왈리' },
    countries: ['IN', 'SG', 'MY', 'AE', 'GB'],
    date: { month: 10, day: 24, year: 2024, rule: '힌두력 기준' },
    category: 'religious',
    importance: 'major',
    marketing: {
      leadTimeDays: 45,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['쥬얼리', '인테리어', '캔들', '의류', '전자기기', '홈데코'],
      keyTrends: ['빛', '번영', '가족', '새시작', '금'],
      targetAudience: ['전 연령대', '선물 구매자'],
    },
    context: {
      description: '힌두교 빛의 축제, 인도 최대 명절',
      culturalNotes: '금 쥬얼리 구매 최대 시즌, 집안 청소와 장식',
      colors: ['gold', 'red', 'purple', 'orange'],
      symbols: ['디야(램프)', '랑골리', '불꽃놀이'],
    },
  },
  {
    id: 'halloween',
    name: { local: 'Halloween', english: 'Halloween', korean: '할로윈' },
    countries: ['US', 'CA', 'GB', 'IE', 'AU', 'NZ', 'JP', 'DE', 'FR', 'SG', 'HK'],
    date: { month: 10, day: 31 },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: ['코스튬', '인테리어', '캔들', '파티용품', '메이크업'],
      keyTrends: ['호러', '코스프레', '호박', '파티', '귀신'],
      targetAudience: ['젊은 층', '가족', '어린이'],
    },
    context: {
      description: '할로윈 축제, 코스튬 파티 문화',
      culturalNotes: '트릭 오어 트릿, 호박 조각',
      colors: ['orange', 'black', 'purple', 'green'],
      symbols: ['호박', '유령', '마녀', '박쥐', '거미'],
    },
  },

  // ========================================
  // 11월 기념일
  // ========================================
  {
    id: 'singles-day',
    name: { local: '双十一', english: "Singles' Day", korean: '광군절(싱글스데이)' },
    countries: ['CN', 'SG', 'MY', 'TW', 'HK', 'TH', 'VN', 'ID'],
    date: { month: 11, day: 11 },
    category: 'shopping',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['전체', '뷰티', '패션', '전자기기', '홈리빙'],
      keyTrends: ['쇼핑', '할인', '셀프선물', '대량구매', '11.11'],
      targetAudience: ['전 연령대', '온라인 쇼핑객'],
    },
    context: {
      description: '세계 최대 온라인 쇼핑 페스티벌',
      culturalNotes: '알리바바가 시작, 24시간 동안 조 단위 매출',
      colors: ['red', 'gold', 'orange'],
      symbols: ['11.11', '쇼핑카트'],
    },
  },
  {
    id: 'remembrance-day',
    name: { local: 'Remembrance Day', english: 'Remembrance Day', korean: '현충일(영연방)' },
    countries: ['GB', 'CA', 'AU', 'NZ'],
    date: { month: 11, day: 11 },
    category: 'national',
    importance: 'medium',
    marketing: {
      leadTimeDays: 7,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: [],
      keyTrends: ['추모', '평화'],
    },
    context: {
      description: '전몰장병 추모일',
      colors: ['red'],
      symbols: ['양귀비꽃'],
    },
  },
  {
    id: 'thanksgiving-us',
    name: { local: 'Thanksgiving', english: 'Thanksgiving', korean: '추수감사절(미국)' },
    countries: ['US'],
    date: { month: 11, day: 27, year: 2025, rule: '11월 네번째 목요일' },
    category: 'family',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['인테리어', '키친웨어', '캔들', '테이블웨어', '홈데코'],
      keyTrends: ['가족', '홈파티', '따뜻함', '감사', '칠면조'],
      targetAudience: ['가족'],
    },
    context: {
      description: '미국 최대 가족 명절, 블랙프라이데이로 이어짐',
      culturalNotes: '가족이 모여 칠면조 요리와 함께 감사를 나눔',
      colors: ['orange', 'brown', 'gold', 'red'],
      symbols: ['칠면조', '옥수수', '호박', '단풍잎'],
    },
  },
  {
    id: 'black-friday',
    name: { local: 'Black Friday', english: 'Black Friday', korean: '블랙프라이데이' },
    countries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'IT', 'ES', 'NL', 'BE', 'BR', 'MX', 'JP', 'SG', 'HK', 'IN', 'AE'],
    date: { month: 11, day: 28, year: 2025, rule: '추수감사절 다음 날' },
    category: 'shopping',
    importance: 'major',
    marketing: {
      leadTimeDays: 30,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['전체'],
      keyTrends: ['할인', '쇼핑', '선물준비', '연말', '대박세일'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '글로벌 대규모 할인 쇼핑 이벤트',
      culturalNotes: '연말 쇼핑 시즌의 공식적 시작',
      colors: ['black', 'red', 'white'],
    },
  },
  {
    id: 'cyber-monday',
    name: { local: 'Cyber Monday', english: 'Cyber Monday', korean: '사이버먼데이' },
    countries: ['US', 'CA', 'GB', 'DE', 'AU', 'FR', 'JP'],
    date: { month: 12, day: 1, year: 2025, rule: '블랙프라이데이 다음 월요일' },
    category: 'shopping',
    importance: 'major',
    marketing: {
      leadTimeDays: 7,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['전체', '전자기기'],
      keyTrends: ['온라인쇼핑', '할인', '연말선물'],
      targetAudience: ['온라인 쇼핑객'],
    },
    context: {
      description: '블랙프라이데이 이후 온라인 쇼핑 이벤트',
    },
  },

  // ========================================
  // 12월 기념일
  // ========================================
  {
    id: 'national-day-ae',
    name: { local: 'اليوم الوطني', english: 'National Day', korean: 'UAE 국경일' },
    countries: ['AE'],
    date: { month: 12, day: 2 },
    category: 'national',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['패션', '홈데코', '쥬얼리'],
      keyTrends: ['애국', '축제', '세일'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: 'UAE 건국 기념일',
      colors: ['green', 'white', 'black', 'red'],
    },
  },
  {
    id: 'st-nicholas',
    name: { local: 'Sinterklaas', english: "St. Nicholas' Day", korean: '성 니콜라스의 날' },
    countries: ['NL', 'BE', 'DE'],
    date: { month: 12, day: 6 },
    category: 'cultural',
    importance: 'medium',
    marketing: {
      leadTimeDays: 14,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['초콜릿', '장난감', '선물'],
      keyTrends: ['선물', '어린이', '전통'],
      targetAudience: ['가족', '어린이'],
    },
    context: {
      description: '네덜란드/벨기에에서 크리스마스보다 중요한 선물 교환일',
      colors: ['red', 'white', 'gold'],
    },
  },
  {
    id: 'hanukkah',
    name: { local: 'חֲנֻכָּה', english: 'Hanukkah', korean: '하누카' },
    countries: ['IL', 'US'],
    date: { month: 12, day: 25, year: 2024, rule: '유대력 기준, 8일간' },
    category: 'religious',
    importance: 'major',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: false,
      recommendedCategories: ['캔들', '홈데코', '쥬얼리', '초콜릿'],
      keyTrends: ['빛', '가족', '전통', '기적'],
      targetAudience: ['유대인'],
    },
    context: {
      description: '유대교 빛의 축제, 8일간 매일 선물',
      colors: ['blue', 'silver', 'white'],
      symbols: ['메노라', '드레이들'],
    },
  },
  {
    id: 'christmas',
    name: { local: 'Christmas', english: 'Christmas', korean: '크리스마스' },
    countries: ['JP', 'US', 'GB', 'DE', 'FR', 'AU', 'CA', 'NZ', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'IE', 'PT', 'BR', 'MX', 'PH', 'SG', 'HK', 'TW', 'IN', 'ZA', 'AE'],
    date: { month: 12, day: 25 },
    category: 'religious',
    importance: 'major',
    marketing: {
      leadTimeDays: 45,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['액세서리', '인테리어', '캔들', '니트/패션', '쥬얼리', '향수', '홈데코', '장난감'],
      keyTrends: ['선물', '따뜻함', '가족', '연인', '홈파티', '산타'],
      targetAudience: ['전 연령대', '선물 구매자'],
    },
    context: {
      description: '서양권 최대 명절, 일본에서는 연인의 날',
      culturalNotes: '일본에서는 KFC와 케이크가 전통, 연인과 보내는 날',
      colors: ['red', 'green', 'gold', 'white', 'silver'],
      symbols: ['트리', '산타', '눈', '별', '순록', '선물상자'],
    },
  },
  {
    id: 'boxing-day',
    name: { local: 'Boxing Day', english: 'Boxing Day', korean: '박싱데이' },
    countries: ['GB', 'AU', 'CA', 'NZ', 'HK', 'IE', 'ZA'],
    date: { month: 12, day: 26 },
    category: 'shopping',
    importance: 'major',
    marketing: {
      leadTimeDays: 7,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['전체'],
      keyTrends: ['세일', '연말정리', '셀프선물', '재고정리'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '크리스마스 다음 날 대규모 세일',
      culturalNotes: '영연방 국가들의 전통 세일 시즌',
      colors: ['red', 'green'],
    },
  },
  {
    id: 'omisoka',
    name: { local: '大晦日', english: 'Omisoka', korean: '오미소카(일본 송년)' },
    countries: ['JP'],
    date: { month: 12, day: 31 },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: ['식품', '전통공예', '청소용품', '홈데코'],
      keyTrends: ['대청소', '송년', '연월소바', '제야의 종'],
      targetAudience: ['가족'],
    },
    context: {
      description: '일본 섣달 그믐날',
      culturalNotes: '대청소(오오소지), 연월소바 먹기, 제야의 종',
      colors: ['red', 'white'],
    },
  },
  {
    id: 'new-years-eve',
    name: { local: "New Year's Eve", english: "New Year's Eve", korean: '새해 전야' },
    countries: ['JP', 'US', 'GB', 'DE', 'FR', 'AU', 'CA', 'SG', 'HK', 'TW', 'IT', 'ES', 'BR', 'MX', 'NZ'],
    date: { month: 12, day: 31 },
    category: 'cultural',
    importance: 'major',
    marketing: {
      leadTimeDays: 14,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['파티용품', '캔들', '인테리어', '패션', '뷰티'],
      keyTrends: ['카운트다운', '파티', '새출발', '축제', '불꽃놀이'],
      targetAudience: ['20-40대', '파티 애호가'],
    },
    context: {
      description: '한 해의 마지막 날, 카운트다운 파티',
      culturalNotes: '타임스퀘어 볼 드롭, 불꽃놀이',
      colors: ['gold', 'silver', 'black', 'white'],
      symbols: ['샴페인', '불꽃놀이', '시계'],
    },
  },
  
  // ========================================
  // 연중 시즌 이벤트
  // ========================================
  {
    id: 'spring-season',
    name: { local: 'Spring Season', english: 'Spring Season', korean: '봄 시즌' },
    countries: ['JP', 'US', 'GB', 'DE', 'FR', 'CA', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'IE', 'PT'],
    date: { month: 3, day: 1, rule: '3월~5월 (북반구)' },
    category: 'seasonal',
    importance: 'medium',
    marketing: {
      leadTimeDays: 21,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: ['패션', '가드닝', '인테리어', '아웃도어', '플라워'],
      keyTrends: ['새출발', '꽃', '파스텔', '피크닉', '벚꽃'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '봄 시즌, 새로운 시작의 계절',
      colors: ['pink', 'yellow', 'green', 'pastel'],
      symbols: ['꽃', '나비', '새싹'],
    },
  },
  {
    id: 'summer-season',
    name: { local: 'Summer Season', english: 'Summer Season', korean: '여름 시즌' },
    countries: ['JP', 'US', 'GB', 'DE', 'FR', 'CA', 'IT', 'ES', 'AU', 'NZ'],
    date: { month: 6, day: 1, rule: '6월~8월 (북반구)' },
    category: 'seasonal',
    importance: 'medium',
    marketing: {
      leadTimeDays: 21,
      giftGiving: false,
      discountExpected: true,
      recommendedCategories: ['비치용품', '아웃도어', '여행용품', '패션', '뷰티'],
      keyTrends: ['휴가', '해변', '캠핑', '축제', '선크림'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '여름 휴가 시즌',
      colors: ['blue', 'yellow', 'white', 'coral'],
      symbols: ['태양', '야자수', '파도'],
    },
  },
  {
    id: 'autumn-season',
    name: { local: 'Autumn Season', english: 'Autumn Season', korean: '가을 시즌' },
    countries: ['JP', 'US', 'GB', 'DE', 'FR', 'CA', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT'],
    date: { month: 9, day: 1, rule: '9월~11월 (북반구)' },
    category: 'seasonal',
    importance: 'medium',
    marketing: {
      leadTimeDays: 21,
      giftGiving: false,
      discountExpected: false,
      recommendedCategories: ['니트', '아우터', '인테리어', '캔들', '베이킹'],
      keyTrends: ['단풍', '수확', '따뜻함', '호박', '코지'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '가을 시즌, 수확의 계절',
      colors: ['orange', 'brown', 'burgundy', 'gold'],
      symbols: ['단풍잎', '호박', '도토리'],
    },
  },
  {
    id: 'winter-season',
    name: { local: 'Winter Season', english: 'Winter Season', korean: '겨울 시즌' },
    countries: ['JP', 'US', 'GB', 'DE', 'FR', 'CA', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI'],
    date: { month: 12, day: 1, rule: '12월~2월 (북반구)' },
    category: 'seasonal',
    importance: 'medium',
    marketing: {
      leadTimeDays: 21,
      giftGiving: true,
      discountExpected: true,
      recommendedCategories: ['니트', '패딩', '핫초코', '홈웨어', '캔들', '스킨케어'],
      keyTrends: ['따뜻함', '눈', '크리스마스', '겨울왕국', '아늑함'],
      targetAudience: ['전 연령대'],
    },
    context: {
      description: '겨울 시즌, 연말연시',
      colors: ['white', 'red', 'green', 'silver', 'navy'],
      symbols: ['눈송이', '눈사람', '벽난로'],
    },
  },
];

export default GLOBAL_HOLIDAYS;

