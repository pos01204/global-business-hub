# 쿠폰 쿼리 생성기 PRD

## 1. 개요

### 1.1 배경
글로벌 비즈니스 운영 시 다양한 마케팅 캠페인에 맞춰 쿠폰을 발급해야 합니다. 현재는 쿠폰 발급 쿼리를 수동으로 작성하고 있어 다음과 같은 문제가 있습니다:
- 쿼리 구조를 매번 기억해야 함
- 날짜/시간 변환 (일본 시간 → UTC) 오류 발생 가능
- 국가 코드, 쇼룸 ID 등 참조값 확인 필요
- 반복적인 작업으로 인한 비효율
- 시즌/이벤트별 최적 설정값 파악 어려움

### 1.2 목표
- **작업 효율화**: 쿠폰 쿼리 생성 시간 90% 단축
- **오류 방지**: 날짜 변환, 필수값 누락 등 실수 방지
- **표준화**: 일관된 쿠폰 설정 패턴 적용
- **편의성**: 자주 사용하는 템플릿 기반 빠른 생성
- **스마트 자동화**: 컨셉/주제 기반 설정값 자동 추천

### 1.3 대상 사용자
- 글로벌 비즈니스 마케팅 담당자
- 프로모션 기획 담당자
- 운영 담당자

### 1.4 핵심 컨셉
본 도구는 **2단계 접근 방식**을 채택합니다:

1. **기본 모드 (수동 설정)**: 사용자가 모든 설정값을 직접 입력하여 쿠폰 쿼리 생성
2. **스마트 모드 (자동 추천)**: 캠페인 컨셉/주제를 선택하면 최적의 설정값이 자동으로 세팅되고, 필요시 미세 조정 가능

이를 통해 초보자는 스마트 모드로 빠르게 시작하고, 숙련자는 기본 모드로 세밀한 제어가 가능합니다.

---

## 2. 쿠폰 적용 범위 및 제약사항

### 2.1 쿠폰 적용 대상 유형

쿠폰은 다음 **두 가지 대상 유형**으로만 생성 가능합니다:

| 대상 유형 | targetType | 설명 | 활용 예시 |
|----------|-----------|------|----------|
| **기획전 (쇼룸)** | SHOWROOM | 특정 쇼룸(기획전)에서만 사용 가능 | 시즌 기획전, 아티스트 프로모션 |
| **국가** | COUNTRY | 특정 국가 사용자만 사용 가능 | 일본 전용, 글로벌 캠페인 |

### 2.2 적용 대상 조합 패턴

| 패턴 | applicableTargets | 사용 케이스 |
|------|------------------|------------|
| 전체 공개 | `[]` (빈 배열) | 신규 가입 쿠폰, 전체 대상 프로모션 |
| 국가 한정 | `[{COUNTRY: "JP"}]` | 일본 전용 캠페인 |
| 쇼룸 한정 | `[{SHOWROOM: "1109"}]` | 특정 기획전 전용 |
| 국가 + 쇼룸 | `[{COUNTRY: "JP"}, {SHOWROOM: "1109"}]` | 일본 대상 기획전 쿠폰 |
| 다중 국가 + 쇼룸 | `[{COUNTRY: "US"}, {COUNTRY: "CA"}, {SHOWROOM: "1286"}]` | 글로벌 기획전 쿠폰 |

### 2.3 유저 대상 발급 (issueUserId)

| issueUserId 값 | 설명 | 활용 |
|---------------|------|------|
| `0` | 전체 사용자 대상 | 공개 쿠폰, 기획전 쿠폰 |
| `특정 ID` | 개별 사용자 지정 | VIP 전용, 휴면 고객 복귀, CS 보상 |

### 2.4 제약사항 및 주의점

⚠️ **중요 제약사항:**
- 쿠폰은 **기획전(쇼룸) 단위** 또는 **국가 단위**로만 적용 범위 설정 가능
- 개별 상품, 카테고리, 아티스트 단위 적용은 **불가능**
- 아티스트 프로모션 시 해당 아티스트의 **쇼룸 ID**를 사용해야 함
- 복수 쇼룸 적용 시 각각 별도의 쿠폰 생성 필요

---

## 3. 쿠폰 쿼리 구조

### 3.1 전체 필드 정의

```typescript
interface CouponQuery {
  // 기본 정보 (고정값)
  adminId: number;              // 관리자 ID (기본: 0)
  issueUserId: number;          // 발급 대상 사용자 ID (0 = 전체)
  
  // 쿠폰 명칭
  couponName: string;           // 사용자에게 표시되는 쿠폰명
  description: string;          // 내부 관리용 설명
  
  // 기간 설정
  fromDateTime: string;         // 발급 시작일시 (ISO8601 UTC)
  toDateTime: string;           // 발급 종료일시 (ISO8601 UTC)
  maxValidDateTime: string;     // 사용 만료일시 (ISO8601 UTC)
  validPeriod: number;          // 유효 기간 (일)
  
  // 할인 설정
  currencyCode: 'JPY' | 'USD';  // 통화 코드
  discountType: 'FIXED' | 'RATE'; // 할인 유형
  discount: number;             // 할인 값 (FIXED: 금액, RATE: %)
  minOrderPrice: number;        // 최소 주문 금액
  maxDiscountPrice: number;     // 최대 할인 금액
  
  // 발급 제한
  issueLimit: number;           // 총 발급 수량
  issueLimitPerUser: number;    // 사용자당 발급 제한
  useLimitPerUser: number;      // 사용자당 사용 제한
  
  // 공개 설정
  isPublic: boolean;            // 공개 여부
  
  // 적용 대상
  applicableTargets: Array<{
    targetType: 'COUNTRY' | 'SHOWROOM';
    targetId: string;
  }>;
}
```

### 3.2 필드별 상세 설명

#### 기본 정보
| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `adminId` | number | 0 | 관리자 ID (자동 설정) |
| `issueUserId` | number | 0 | 발급 대상 (0 = 전체 사용자) |

#### 쿠폰 명칭
| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `couponName` | string | ✓ | 사용자 표시용 쿠폰명 | "今だけ！初回限定クーポン" |
| `description` | string | ✓ | 내부 관리용 설명 | "初回限定クーポン（全商品対象）" |

#### 기간 설정
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `fromDateTime` | ISO8601 | ✓ | 발급 시작일시 (UTC) |
| `toDateTime` | ISO8601 | ✓ | 발급 종료일시 (UTC) |
| `maxValidDateTime` | ISO8601 | ✓ | 사용 만료일시 (보통 toDateTime과 동일) |
| `validPeriod` | number | ✓ | 유효 기간 (일) - 자동 계산 |

**시간 변환 규칙 (KST 기준):**
- 한국 시간(KST) 00:00 = UTC 15:00 (전날)
- 기본 공식: `fromDateTime = TEXT(선택일-1, "yyyy-mm-dd") + "T15:00:00+00:00"`
- 예: 한국 2025-12-02 00:00 → UTC 2025-12-01T15:00:00+00:00
- 예: 한국 2025-12-08 00:00 → UTC 2025-12-07T15:00:00+00:00

**시간대 참고:**
| 시간대 | UTC 오프셋 | 변환 예시 (현지 00:00) |
|--------|-----------|----------------------|
| KST (한국) | UTC+9 | 전날 15:00 UTC |
| JST (일본) | UTC+9 | 전날 15:00 UTC |
| PST (미국 서부) | UTC-8 | 당일 08:00 UTC |

#### 할인 설정
| 필드 | 타입 | 옵션 | 설명 |
|------|------|------|------|
| `currencyCode` | enum | JPY, USD | 통화 코드 |
| `discountType` | enum | FIXED, RATE | 정액/정률 |
| `discount` | number | - | 할인 값 |
| `minOrderPrice` | number | - | 최소 주문 금액 (0 = 제한 없음) |
| `maxDiscountPrice` | number | - | 최대 할인 금액 |

**통화별 권장값:**
| 통화 | 정액 할인 | 최소 주문 | 최대 할인 (정률) |
|------|----------|----------|-----------------|
| JPY | 500 | 8,000 | 1,000 |
| USD | 3~5 | 20 | 3~5 |

#### 발급 제한
| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `issueLimit` | number | 100 | 총 발급 수량 |
| `issueLimitPerUser` | number | 1 | 사용자당 발급 제한 |
| `useLimitPerUser` | number | 1 | 사용자당 사용 제한 |

#### 적용 대상
| targetType | targetId 예시 | 설명 |
|------------|--------------|------|
| COUNTRY | JP, US, TW | 국가 코드 |
| SHOWROOM | 1109, 1286 | 쇼룸 ID |

---

## 4. 스마트 컨셉 시스템

### 4.1 컨셉 기반 자동 설정
사용자가 캠페인의 **컨셉/주제**를 선택하면, 해당 컨셉에 최적화된 설정값이 자동으로 적용됩니다.

#### 컨셉 카테고리 구조
```
📁 캠페인 컨셉
├── 🎁 신규/웰컴
│   ├── 신규 가입 쿠폰
│   └── 첫 구매 쿠폰
├── 📅 시즌 이벤트
│   ├── 골든위크 (GW)
│   ├── 실버위크 (SW)
│   ├── 블랙프라이데이
│   ├── 크리스마스/연말
│   ├── 신년/설날
│   └── 발렌타인/화이트데이
├── 🎨 아티스트 프로모션
│   ├── 신규 아티스트 입점
│   ├── 아티스트 기획전
│   └── 콜라보레이션
├── 🛍️ 상품 프로모션
│   ├── 신상품 출시
│   ├── 재입고 알림
│   └── 한정판 출시
└── 🎯 타겟 마케팅
    ├── 휴면 고객 재활성화
    ├── VIP 고객 전용
    └── 특정 국가 타겟
```

### 4.2 컨셉별 자동 설정 매핑

#### 🎁 신규/웰컴 컨셉
| 컨셉 | 할인유형 | 할인값 | 최소주문 | 공개 | 기간 | 특징 |
|------|---------|--------|---------|------|------|------|
| 신규 가입 | FIXED | ¥500 | 0 | ❌ | 7일 | 전체 대상, 비공개 |
| 첫 구매 | RATE | 15% | ¥5,000 | ❌ | 14일 | 높은 할인율로 전환 유도 |

#### 📅 시즌 이벤트 컨셉
| 컨셉 | 할인유형 | 할인값(JP) | 할인값(글로벌) | 최소주문 | 공개 | 권장기간 |
|------|---------|-----------|--------------|---------|------|---------|
| 골든위크 | RATE | 10% | 10% | ¥8,000/$20 | ✅ | 4/29~5/6 |
| 실버위크 | RATE | 10% | 10% | ¥8,000/$20 | ✅ | 9/15~9/23 |
| 블랙프라이데이 | RATE | 15% | 15% | ¥10,000/$25 | ✅ | 11/24~11/27 |
| 크리스마스 | RATE | 10% | 10% | ¥8,000/$20 | ✅ | 12/20~12/25 |
| 신년 | FIXED | ¥1,000 | $5 | ¥10,000/$25 | ✅ | 1/1~1/7 |

#### 🎨 아티스트 프로모션 컨셉
| 컨셉 | 할인유형 | 할인값 | 최소주문 | 공개 | 기간 | 특징 |
|------|---------|--------|---------|------|------|------|
| 신규 입점 | RATE | 10% | ¥5,000 | ✅ | 14일 | 해당 쇼룸만 적용 |
| 아티스트 기획전 | RATE | 10% | ¥8,000 | ✅ | 7~10일 | 쇼룸 + 국가 지정 |
| 콜라보레이션 | RATE | 15% | ¥10,000 | ✅ | 7일 | 한정 수량 강조 |

#### 🎯 타겟 마케팅 컨셉
| 컨셉 | 할인유형 | 할인값 | 최소주문 | 공개 | 기간 | 특징 |
|------|---------|--------|---------|------|------|------|
| 휴면 재활성화 | FIXED | ¥1,000 | 0 | ❌ | 30일 | 개인 발급, 긴 유효기간 |
| VIP 전용 | RATE | 20% | ¥15,000 | ❌ | 14일 | 높은 할인율, 높은 최소주문 |
| 국가 타겟 | RATE | 10% | 현지화 | ✅ | 7일 | 국가별 통화/금액 자동 설정 |

### 4.3 마케팅 캘린더 연동

퍼포먼스 마케터의 **글로벌 마케팅 캘린더**와 연동하여 35개국 기념일/시즌 정보를 활용합니다.

#### 연동 API
```typescript
// 마케팅 캘린더 API 활용
import { calendarApi } from '@/lib/api';

// 다가오는 기념일 조회
const upcomingHolidays = await calendarApi.getUpcoming(30); // 30일 이내

// 특정 국가의 기념일 조회
const jpHolidays = await calendarApi.getByCountry('JP');

// 기념일 상세 정보 (추천 카테고리, 타겟 등)
const holidayDetail = await calendarApi.getHolidayDetail(holidayId);
```

#### 연동 기능
| 기능 | 설명 | 활용 |
|------|------|------|
| 다가오는 이벤트 추천 | 30일 이내 기념일 자동 표시 | 스마트 모드 추천 영역 |
| 기념일 기간 자동 설정 | 기념일 시작/종료일 자동 입력 | 기간 설정 자동화 |
| 추천 카테고리 연동 | 기념일별 추천 상품 카테고리 | 쿠폰 설명 자동 생성 |
| 국가별 필터링 | 일본/글로벌 기념일 구분 | 대상 국가 자동 선택 |

#### 캘린더 데이터 구조
```typescript
interface MarketingHoliday {
  id: string;
  name: string;
  nameJP: string;
  country: string;
  startDate: string;
  endDate: string;
  type: 'national' | 'commercial' | 'cultural';
  recommendedCategories: string[];
  discountExpected: boolean;
  giftGiving: boolean;
}
```

### 4.4 할인율 최적화 시스템

비즈니스 수익성을 고려한 할인율 추천 시스템입니다.

#### 할인율 결정 요소
| 요소 | 설명 | 영향 |
|------|------|------|
| 평균 마진율 | 상품 카테고리별 평균 마진 | 할인 상한선 결정 |
| 캠페인 목적 | 신규 획득 vs 재구매 유도 | 할인 강도 결정 |
| 시즌 경쟁도 | 경쟁사 할인 수준 | 시장 대응 할인율 |
| 고객 세그먼트 | 신규/휴면/VIP | 타겟별 최적 할인 |
| 최소 주문 금액 | 객단가 목표 | 수익 보전 장치 |

#### 수익성 기반 할인율 가이드라인

**카테고리별 권장 할인율 (마진율 기준)**
| 카테고리 | 평균 마진율 | 권장 최대 할인 | 손익분기 할인 | 비고 |
|---------|-----------|--------------|-------------|------|
| 액세서리 | 60~70% | 20% | 35% | 고마진, 공격적 할인 가능 |
| 의류 | 50~60% | 15% | 25% | 중마진, 적정 할인 |
| 가방/잡화 | 45~55% | 12% | 20% | 중마진 |
| 인테리어 | 40~50% | 10% | 18% | 저마진, 보수적 할인 |
| 푸드 | 30~40% | 8% | 12% | 저마진, 최소 할인 |

**캠페인 목적별 권장 할인율**
| 목적 | 권장 할인율 | 최소 주문 | ROI 기대치 | 설명 |
|------|-----------|----------|-----------|------|
| 신규 고객 획득 | 15~20% | 낮음 | 장기 LTV | 첫 구매 전환 우선 |
| 첫 구매 유도 | 10~15% | 중간 | 중기 | 가입 후 구매 전환 |
| 재구매 촉진 | 8~10% | 중간 | 단기 | 기존 고객 활성화 |
| 휴면 고객 복귀 | 15~20% | 낮음 | 중기 | 재활성화 비용 |
| VIP 리텐션 | 10~15% | 높음 | 장기 | 충성도 유지 |
| 시즌 프로모션 | 10~15% | 중간 | 단기 | 매출 극대화 |

#### 할인율 시뮬레이션

```typescript
interface DiscountSimulation {
  discountRate: number;        // 할인율 (%)
  minOrderPrice: number;       // 최소 주문 금액
  maxDiscountPrice: number;    // 최대 할인 금액
  estimatedMargin: number;     // 예상 마진율 (%)
  breakEvenOrders: number;     // 손익분기 주문 수
  profitImpact: 'positive' | 'neutral' | 'negative';
}

function simulateDiscount(params: {
  categoryMargin: number;      // 카테고리 평균 마진율
  discountRate: number;        // 적용할 할인율
  avgOrderValue: number;       // 평균 주문 금액
  expectedConversionLift: number; // 예상 전환율 상승
}): DiscountSimulation {
  const { categoryMargin, discountRate, avgOrderValue, expectedConversionLift } = params;
  
  // 할인 후 예상 마진율
  const estimatedMargin = categoryMargin - discountRate;
  
  // 손익분기점 계산 (할인으로 인한 마진 감소를 전환율 상승으로 보전)
  const marginLossPerOrder = avgOrderValue * (discountRate / 100);
  const marginPerOrder = avgOrderValue * (estimatedMargin / 100);
  const breakEvenOrders = Math.ceil(marginLossPerOrder / (marginPerOrder * (expectedConversionLift / 100)));
  
  return {
    discountRate,
    minOrderPrice: Math.round(avgOrderValue * 0.8), // 평균의 80%
    maxDiscountPrice: Math.round(avgOrderValue * discountRate / 100 * 1.2), // 약간의 버퍼
    estimatedMargin,
    breakEvenOrders,
    profitImpact: estimatedMargin > 20 ? 'positive' : estimatedMargin > 10 ? 'neutral' : 'negative',
  };
}
```

#### 할인율 추천 로직

```typescript
interface DiscountRecommendation {
  recommended: number;         // 추천 할인율
  min: number;                 // 최소 권장
  max: number;                 // 최대 권장
  reason: string;              // 추천 이유
  warning?: string;            // 주의사항
}

function recommendDiscount(params: {
  campaignType: 'new_user' | 'retention' | 'reactivation' | 'season' | 'vip';
  targetRegion: 'JP' | 'GLOBAL';
  category?: string;
  competitorDiscount?: number; // 경쟁사 할인율 (있는 경우)
}): DiscountRecommendation {
  const { campaignType, targetRegion, category, competitorDiscount } = params;
  
  // 기본 추천값
  const baseRecommendations = {
    new_user: { recommended: 15, min: 10, max: 20 },
    retention: { recommended: 10, min: 8, max: 12 },
    reactivation: { recommended: 15, min: 12, max: 20 },
    season: { recommended: 10, min: 8, max: 15 },
    vip: { recommended: 12, min: 10, max: 15 },
  };
  
  let result = { ...baseRecommendations[campaignType] };
  
  // 지역별 조정 (글로벌은 약간 낮은 할인)
  if (targetRegion === 'GLOBAL') {
    result.recommended = Math.max(result.recommended - 2, result.min);
  }
  
  // 경쟁사 대응 (경쟁사보다 약간 높게)
  if (competitorDiscount && competitorDiscount > result.recommended) {
    result.recommended = Math.min(competitorDiscount + 2, result.max);
    result.warning = `경쟁사 할인(${competitorDiscount}%)에 대응하여 상향 조정됨`;
  }
  
  return {
    ...result,
    reason: getRecommendationReason(campaignType, result.recommended),
  };
}
```

#### UI: 할인율 추천 패널

```
┌─────────────────────────────────────────────────────────────┐
│ 💰 할인율 최적화                                             │
├─────────────────────────────────────────────────────────────┤
│ 📊 추천 할인율: 10%                                          │
│ ├─ 권장 범위: 8% ~ 15%                                      │
│ └─ 이유: 시즌 프로모션 평균 할인율 기준                       │
│                                                             │
│ 📈 수익성 시뮬레이션                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 할인율    예상 마진    손익분기    수익 영향              │ │
│ │ ────────────────────────────────────────────────────── │ │
│ │  8%       42%         15건        🟢 긍정적             │ │
│ │ 10%       40%         20건        🟢 긍정적             │ │
│ │ 12%       38%         28건        🟡 중립               │ │
│ │ 15%       35%         40건        🟡 중립               │ │
│ │ 20%       30%         65건        🔴 주의               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⚠️ 주의: 20% 이상 할인 시 마진율 30% 이하로 하락             │
│                                                             │
│ 💡 팁: 최소 주문 금액을 ¥8,000으로 설정하면 객단가 유지 가능  │
└─────────────────────────────────────────────────────────────┘
```

#### 최소 주문 금액 & 최대 할인 금액 최적화

| 할인율 | 권장 최소 주문 (JPY) | 권장 최대 할인 (JPY) | 실질 할인율 | 비고 |
|--------|---------------------|---------------------|------------|------|
| 5% | ¥5,000 | ¥500 | 5~10% | 소액 구매 유도 |
| 10% | ¥8,000 | ¥1,000 | 10~12.5% | 표준 설정 |
| 15% | ¥10,000 | ¥1,500 | 15% | 시즌 프로모션 |
| 20% | ¥15,000 | ¥2,000 | 13~20% | VIP/특별 이벤트 |

**최대 할인 금액 설정 전략:**
- 최대 할인 = 최소 주문 × 할인율 × 1.0~1.2 (버퍼)
- 예: 10% 할인, 최소 주문 ¥8,000 → 최대 할인 ¥800~1,000

### 4.5 스마트 추천 로직

#### 날짜 기반 자동 추천
시스템이 현재 날짜를 기준으로 다가오는 시즌 이벤트를 자동 추천합니다 (마케팅 캘린더 연동):

```typescript
interface SeasonEvent {
  id: string;
  name: string;
  nameJP: string;
  startDate: { month: number; day: number };
  endDate: { month: number; day: number };
  recommendedDiscount: number;
  targetRegions: ('JP' | 'GLOBAL' | 'ALL')[];
}

const SEASON_EVENTS: SeasonEvent[] = [
  { id: 'new_year', name: '신년', nameJP: '新年', startDate: {month:1, day:1}, endDate: {month:1, day:7}, recommendedDiscount: 10, targetRegions: ['ALL'] },
  { id: 'valentines', name: '발렌타인', nameJP: 'バレンタイン', startDate: {month:2, day:10}, endDate: {month:2, day:14}, recommendedDiscount: 10, targetRegions: ['JP'] },
  { id: 'white_day', name: '화이트데이', nameJP: 'ホワイトデー', startDate: {month:3, day:10}, endDate: {month:3, day:14}, recommendedDiscount: 10, targetRegions: ['JP'] },
  { id: 'golden_week', name: '골든위크', nameJP: 'GW', startDate: {month:4, day:29}, endDate: {month:5, day:6}, recommendedDiscount: 10, targetRegions: ['JP'] },
  { id: 'silver_week', name: '실버위크', nameJP: 'SW', startDate: {month:9, day:15}, endDate: {month:9, day:23}, recommendedDiscount: 10, targetRegions: ['JP'] },
  { id: 'black_friday', name: '블랙프라이데이', nameJP: 'ブラックフライデー', startDate: {month:11, day:24}, endDate: {month:11, day:27}, recommendedDiscount: 15, targetRegions: ['GLOBAL'] },
  { id: 'christmas', name: '크리스마스', nameJP: 'クリスマス', startDate: {month:12, day:20}, endDate: {month:12, day:25}, recommendedDiscount: 10, targetRegions: ['ALL'] },
];
```

#### 쿠폰명 자동 생성
컨셉 선택 시 쿠폰명도 자동 생성됩니다:

```typescript
function generateCouponName(concept: string, discount: number, discountType: string): string {
  const discountText = discountType === 'RATE' ? `${discount}%OFF` : `¥${discount}OFF`;
  
  const templates = {
    golden_week: `GW限定${discountText}`,
    silver_week: `SW限定${discountText}`,
    black_friday: `BF限定${discountText}`,
    christmas: `Xmas限定${discountText}`,
    new_user: `今だけ！初回限定クーポン`,
    artist_promo: `【アーティスト名】限定${discountText}`,
  };
  
  return templates[concept] || `限定${discountText}クーポン`;
}
```

---

## 5. 기본 템플릿 유형

### 5.1 신규 가입 쿠폰
**용도:** 신규 가입자 대상 웰컴 쿠폰

| 설정 | 값 |
|------|-----|
| discountType | FIXED (정액) |
| discount | 500 (JPY) |
| minOrderPrice | 0 |
| isPublic | false |
| applicableTargets | [] (전체) |
| issueLimitPerUser | 1 |

**예시 쿼리:**
```json
{
  "adminId": 0,
  "issueUserId": 0,
  "couponName": "今だけ！初回限定クーポン",
  "description": "初回限定クーポン（全商品対象）",
  "fromDateTime": "2025-12-01T15:00:00+00:00",
  "toDateTime": "2025-12-08T15:00:00+00:00",
  "maxValidDateTime": "2025-12-08T15:00:00+00:00",
  "validPeriod": 7,
  "currencyCode": "JPY",
  "discountType": "FIXED",
  "discount": 500,
  "minOrderPrice": 0,
  "maxDiscountPrice": 500,
  "issueLimit": 36,
  "issueLimitPerUser": 1,
  "useLimitPerUser": 1,
  "isPublic": false,
  "applicableTargets": []
}
```

### 5.2 기획전 쿠폰 (일본)
**용도:** 일본 대상 시즌/이벤트 기획전

| 설정 | 값 |
|------|-----|
| currencyCode | JPY |
| discountType | RATE (정률) |
| discount | 10 (%) |
| minOrderPrice | 8000 |
| maxDiscountPrice | 1000 |
| isPublic | true |
| applicableTargets | JP + 쇼룸ID |

**예시 쿼리:**
```json
{
  "adminId": 0,
  "issueUserId": 0,
  "couponName": "SW限定10%OFF",
  "description": "SilverWeek COUPON(JP)",
  "fromDateTime": "2025-09-14T15:00:00+00:00",
  "toDateTime": "2025-09-23T15:00:00+00:00",
  "maxValidDateTime": "2025-09-23T15:00:00+00:00",
  "validPeriod": 8,
  "currencyCode": "JPY",
  "discountType": "RATE",
  "discount": 10,
  "minOrderPrice": 8000,
  "maxDiscountPrice": 1000,
  "issueLimit": 100,
  "issueLimitPerUser": 1,
  "useLimitPerUser": 1,
  "isPublic": true,
  "applicableTargets": [
    {"targetType": "COUNTRY", "targetId": "JP"},
    {"targetType": "SHOWROOM", "targetId": "1109"}
  ]
}
```

### 5.3 기획전 쿠폰 (글로벌/영어권)
**용도:** 일본 외 글로벌 대상 기획전

| 설정 | 값 |
|------|-----|
| currencyCode | USD |
| discountType | RATE (정률) |
| discount | 10 (%) |
| minOrderPrice | 20 |
| maxDiscountPrice | 3 |
| isPublic | true |
| applicableTargets | 다중 국가 + 쇼룸ID |

**대상 국가 프리셋:**
- 영어권: US, CA, AU, NZ, GB, SG, HK
- 아시아: TW, TH, PH
- 중동: SA, AE
- 유럽: DE, CH, ES, IT

---

## 6. UI/UX 설계

### 6.1 페이지 구조 (스마트 모드 통합)

```
┌─────────────────────────────────────────────────────────────┐
│ 🎟️ 쿠폰 쿼리 생성기                                          │
│ 마케팅 캠페인용 쿠폰 발급 쿼리를 쉽게 생성하세요              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [🚀 스마트 모드] [⚙️ 직접 설정]                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 🚀 스마트 모드 - 컨셉 선택                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💡 추천: 다가오는 이벤트                                  │ │
│ │ ┌───────────┐ ┌───────────┐                             │ │
│ │ │ 🎄 크리스마스│ │ 🎊 신년    │  ← 현재 날짜 기반 추천     │ │
│ │ │  12/20~25  │ │  1/1~7    │                             │ │
│ │ └───────────┘ └───────────┘                             │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 📁 컨셉 카테고리                                         │ │
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │ │
│ │ │🎁 신규   │ │📅 시즌  │ │🎨 아티스트│ │🎯 타겟  │        │ │
│ │ │  웰컴   │ │ 이벤트  │ │ 프로모션 │ │ 마케팅  │        │ │
│ │ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │ │
│ │                                                         │ │
│ │ [📅 시즌 이벤트] 선택됨:                                  │ │
│ │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │ │
│ │ │ GW  │ │ SW  │ │ BF  │ │Xmas │ │신년 │ │발렌틴│       │ │
│ │ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ⚡ 자동 설정된 값 (수정 가능)                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📝 쿠폰 정보                                             │ │
│ │ 쿠폰명: [Xmas限定10%OFF          ] ← 자동 생성됨         │ │
│ │ 설명:   [Christmas COUPON(JP)   ]                       │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 📅 기간 설정                                             │ │
│ │ 시작일: [2025-12-20] 종료일: [2025-12-25] ← 자동 설정    │ │
│ │ 유효기간: 5일 (자동 계산)                                │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ � 된할인 설정                                             │ │
│ │ 통화: (●) JPY  ( ) USD                                  │ │
│ │ 유형: ( ) 정액  (●) 정률  ← 컨셉에 따라 자동 선택        │ │
│ │ 할인: [10]%  최소주문: [8000]  최대할인: [1000]          │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🎯 발급 설정                                             │ │
│ │ 총 발급: [100]  1인당: [1]  공개: [✓]                   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🌍 적용 대상                                             │ │
│ │ 지역: (●) 일본  ( ) 글로벌  ( ) 전체                     │ │
│ │ [✓] JP  [ ] US  [ ] TW  [ ] HK  ...                    │ │
│ │ 쇼룸 ID: [1109]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 📋 생성된 쿼리:                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ {                                                       │ │
│ │   "adminId": 0,                                         │ │
│ │   "couponName": "Xmas限定10%OFF",                       │ │
│ │   "description": "Christmas COUPON(JP)",                │ │
│ │   ...                                                   │ │
│ │ }                                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                        [📋 쿼리 복사]       │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 스마트 모드 UX 플로우

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 1. 컨셉 선택  │ → │ 2. 자동 설정  │ → │ 3. 미세 조정  │ → │ 4. 쿼리 복사  │
│              │    │              │    │   (선택)     │    │              │
│ - 카테고리   │    │ - 쿠폰명     │    │ - 할인율     │    │ - JSON 생성  │
│ - 세부 컨셉  │    │ - 기간       │    │ - 기간 조정  │    │ - 클립보드   │
│ - 대상 지역  │    │ - 할인 설정  │    │ - 수량 변경  │    │   복사       │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### 6.3 직접 설정 모드 (기존)

#### 템플릿 1: 신규 가입 쿠폰
```
입력 필요 항목:
- 쿠폰명 (기본값 제공)
- 기간 (시작일, 종료일)
- 발급 수량

자동 설정:
- discountType: FIXED
- discount: 500
- currencyCode: JPY
- minOrderPrice: 0
- isPublic: false
- applicableTargets: []
```

#### 템플릿 2: 일본 기획전 쿠폰
```
입력 필요 항목:
- 쿠폰명
- 기간
- 할인율 (기본 10%)
- 쇼룸 ID

자동 설정:
- discountType: RATE
- currencyCode: JPY
- minOrderPrice: 8000
- maxDiscountPrice: 1000
- isPublic: true
- applicableTargets: [{COUNTRY: JP}, {SHOWROOM: 입력값}]
```

#### 템플릿 3: 글로벌 기획전 쿠폰
```
입력 필요 항목:
- 쿠폰명
- 기간
- 할인율 (기본 10%)
- 대상 국가 선택
- 쇼룸 ID

자동 설정:
- discountType: RATE
- currencyCode: USD
- minOrderPrice: 20
- maxDiscountPrice: 3
- isPublic: true
```

### 6.4 국가 선택 프리셋

| 프리셋명 | 포함 국가 |
|---------|----------|
| 일본 | JP |
| 영어권 전체 | US, CA, AU, NZ, GB, SG, HK |
| 아시아 (일본 제외) | TW, TH, PH, SG, HK |
| 유럽 | DE, CH, ES, IT, GB |
| 중동 | SA, AE |
| 글로벌 전체 (일본 제외) | 위 모든 국가 |

---

## 7. 기능 요구사항

### 7.1 핵심 기능

#### F1: 스마트 컨셉 기반 자동 설정 ⭐ NEW
- 컨셉/주제 선택 시 최적 설정값 자동 적용
- 날짜 기반 다가오는 이벤트 자동 추천
- 쿠폰명 자동 생성 (컨셉 + 할인율 조합)
- 지역별 통화/금액 자동 설정

#### F2: 템플릿 기반 빠른 생성
- 쿠폰 유형 선택 시 기본값 자동 설정
- 최소 입력으로 쿼리 생성 가능

#### F3: 직접 설정 모드
- 모든 필드 수동 설정 가능
- 고급 사용자를 위한 세부 제어

#### F4: 날짜/시간 자동 변환
- 로컬 시간 입력 → UTC 자동 변환
- validPeriod 자동 계산

#### F5: 국가 선택 UI
- 체크박스 기반 다중 선택
- 프리셋 버튼으로 빠른 선택

#### F6: 쿼리 복사
- 생성된 JSON 클립보드 복사
- 복사 완료 피드백

### 7.2 스마트 기능

#### F7: 시즌 이벤트 자동 감지 (마케팅 캘린더 연동)
- 현재 날짜 기준 30일 이내 이벤트 자동 추천
- 마케팅 캘린더 API 연동으로 35개국 기념일 정보 활용
- 이벤트별 권장 기간 자동 설정
- 지역별 이벤트 필터링 (일본 전용 vs 글로벌)
- 기념일별 추천 카테고리 정보 제공

#### F8: 컨셉별 쿠폰명 템플릿
- 일본어/영어 쿠폰명 자동 생성
- 할인율/금액 자동 포함
- 커스터마이징 가능

#### F9: 지역별 최적화
- 일본 선택 시: JPY, 일본 기준 금액
- 글로벌 선택 시: USD, 글로벌 기준 금액
- 통화별 권장 할인 금액 자동 적용

#### F10: 할인율 최적화 추천 ⭐ NEW
- 캠페인 목적별 최적 할인율 추천
- 카테고리 마진율 기반 할인 상한선 제시
- 수익성 시뮬레이션 (예상 마진, 손익분기점)
- 최소 주문 금액 & 최대 할인 금액 자동 계산
- 경쟁사 할인율 대응 추천 (선택)

### 7.3 부가 기능

#### F11: 입력값 검증
- 필수 필드 누락 경고
- 날짜 유효성 검사 (시작일 < 종료일)
- 숫자 범위 검증

#### F12: 실시간 미리보기
- 설정 변경 시 쿼리 실시간 업데이트

#### F13: 최근 생성 이력 (선택)
- 로컬 스토리지에 최근 생성 쿼리 저장
- 빠른 재사용

#### F14: 설정 프리셋 저장 (선택)
- 자주 사용하는 설정 조합 저장
- 커스텀 템플릿 생성

#### F15: 수익성 분석 리포트 (선택)
- 쿠폰 사용 후 실제 수익 영향 분석
- 할인율별 전환율/매출 비교
- 최적 할인율 학습 및 추천 개선

---

## 8. 기술 설계

### 8.1 프론트엔드 구조

```
frontend/app/coupon-generator/
├── page.tsx                    # 메인 페이지
├── components/
│   ├── SmartModePanel.tsx      # 스마트 모드 UI ⭐ NEW
│   ├── ConceptSelector.tsx     # 컨셉 선택 UI ⭐ NEW
│   ├── EventRecommender.tsx    # 이벤트 추천 UI ⭐ NEW
│   ├── DiscountOptimizer.tsx   # 할인율 최적화 UI ⭐ NEW
│   ├── ProfitSimulator.tsx     # 수익성 시뮬레이션 ⭐ NEW
│   ├── TemplateSelector.tsx    # 템플릿 선택 UI
│   ├── CouponForm.tsx          # 설정 폼
│   ├── DateTimePicker.tsx      # 날짜/시간 선택
│   ├── CountrySelector.tsx     # 국가 선택
│   ├── QueryPreview.tsx        # 쿼리 미리보기
│   └── CopyButton.tsx          # 복사 버튼
├── hooks/
│   ├── useCouponGenerator.ts   # 쿠폰 생성 로직
│   ├── useSmartRecommend.ts    # 스마트 추천 로직 ⭐ NEW
│   ├── useDiscountOptimizer.ts # 할인율 최적화 로직 ⭐ NEW
│   └── useSeasonEvents.ts      # 시즌 이벤트 감지 ⭐ NEW
├── utils/
│   ├── dateUtils.ts            # 날짜 변환 유틸
│   ├── templates.ts            # 템플릿 정의
│   ├── concepts.ts             # 컨셉 정의 ⭐ NEW
│   ├── discountCalculator.ts   # 할인율 계산 유틸 ⭐ NEW
│   └── couponNameGenerator.ts  # 쿠폰명 생성 ⭐ NEW
└── types/
    ├── coupon.ts               # 쿠폰 타입 정의
    ├── concept.ts              # 컨셉 타입 정의 ⭐ NEW
    └── discount.ts             # 할인 관련 타입 ⭐ NEW
```

### 8.2 핵심 유틸리티

#### 날짜 변환 함수 (KST 기준)
```typescript
/**
 * 한국 시간(KST) → UTC 변환
 * KST는 UTC+9, 한국 00:00 = UTC 전날 15:00
 * 
 * 기본 공식: fromDateTime = TEXT(선택일-1, "yyyy-mm-dd") + "T15:00:00+00:00"
 */
function toUTCFromKST(date: Date): string {
  // KST는 UTC+9, 한국 00:00 = UTC 전날 15:00
  const utc = new Date(date.getTime() - 9 * 60 * 60 * 1000);
  return utc.toISOString().replace('.000Z', '+00:00');
}

/**
 * 날짜 문자열에서 UTC 변환 (KST 기준)
 * @param dateStr - "2025-12-02" 형식의 날짜 문자열
 * @returns "2025-12-01T15:00:00+00:00" 형식의 UTC 문자열
 */
function formatDateToUTC(dateStr: string): string {
  const date = new Date(dateStr);
  // 전날 15:00 UTC로 변환
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T15:00:00+00:00`;
}

// 유효 기간 계산
function calculateValidPeriod(from: Date, to: Date): number {
  const diffTime = to.getTime() - from.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
```

#### 컨셉 정의 (NEW)
```typescript
interface ConceptCategory {
  id: string;
  name: string;
  icon: string;
  concepts: Concept[];
}

interface Concept {
  id: string;
  name: string;
  nameJP: string;
  description: string;
  defaults: Partial<CouponSettings>;
  couponNameTemplate: {
    jp: string;
    en: string;
  };
}

const CONCEPT_CATEGORIES: ConceptCategory[] = [
  {
    id: 'welcome',
    name: '신규/웰컴',
    icon: '🎁',
    concepts: [
      {
        id: 'new_user',
        name: '신규 가입',
        nameJP: '新規登録',
        description: '신규 가입자 대상 웰컴 쿠폰',
        defaults: {
          discountType: 'FIXED',
          discount: 500,
          currencyCode: 'JPY',
          minOrderPrice: 0,
          isPublic: false,
          issueLimitPerUser: 1,
        },
        couponNameTemplate: {
          jp: '今だけ！初回限定クーポン',
          en: 'Welcome Coupon',
        }
      },
      {
        id: 'first_purchase',
        name: '첫 구매',
        nameJP: '初回購入',
        description: '첫 구매 유도 쿠폰',
        defaults: {
          discountType: 'RATE',
          discount: 15,
          currencyCode: 'JPY',
          minOrderPrice: 5000,
          isPublic: false,
        },
        couponNameTemplate: {
          jp: '初回購入限定{discount}%OFF',
          en: 'First Purchase {discount}% OFF',
        }
      }
    ]
  },
  {
    id: 'season',
    name: '시즌 이벤트',
    icon: '📅',
    concepts: [
      {
        id: 'golden_week',
        name: '골든위크',
        nameJP: 'GW',
        description: '일본 골든위크 기획전',
        defaults: {
          discountType: 'RATE',
          discount: 10,
          currencyCode: 'JPY',
          minOrderPrice: 8000,
          maxDiscountPrice: 1000,
          isPublic: true,
        },
        couponNameTemplate: {
          jp: 'GW限定{discount}%OFF',
          en: 'Golden Week {discount}% OFF',
        }
      },
      // ... 기타 시즌 이벤트
    ]
  },
  // ... 기타 카테고리
];
```

#### 스마트 추천 훅 (마케팅 캘린더 연동)
```typescript
import { calendarApi } from '@/lib/api';

function useSmartRecommend() {
  const [upcomingEvents, setUpcomingEvents] = useState<MarketingHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 마케팅 캘린더 API에서 다가오는 이벤트 조회
    const fetchUpcomingEvents = async () => {
      try {
        const holidays = await calendarApi.getUpcoming(30);
        setUpcomingEvents(holidays);
      } catch (error) {
        // 폴백: 로컬 시즌 이벤트 데이터 사용
        const today = new Date();
        const upcoming = SEASON_EVENTS.filter(event => {
          const eventStart = new Date(today.getFullYear(), event.startDate.month - 1, event.startDate.day);
          const daysUntil = (eventStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
          return daysUntil >= 0 && daysUntil <= 30;
        });
        setUpcomingEvents(upcoming);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUpcomingEvents();
  }, []);
  
  const applyConceptDefaults = (conceptId: string, region: 'JP' | 'GLOBAL') => {
    const concept = findConceptById(conceptId);
    if (!concept) return null;
    
    let settings = { ...concept.defaults };
    
    // 지역별 통화/금액 조정
    if (region === 'GLOBAL' && settings.currencyCode === 'JPY') {
      settings = {
        ...settings,
        currencyCode: 'USD',
        minOrderPrice: Math.round(settings.minOrderPrice / 150), // JPY → USD 환산
        maxDiscountPrice: Math.round(settings.maxDiscountPrice / 150),
      };
    }
    
    return settings;
  };
  
  // 마케팅 캘린더 기념일에서 쿠폰 설정 생성
  const applyHolidayDefaults = (holiday: MarketingHoliday) => {
    return {
      couponName: `${holiday.nameJP}限定10%OFF`,
      description: `${holiday.name} COUPON`,
      fromDateTime: formatDateToUTC(holiday.startDate),
      toDateTime: formatDateToUTC(holiday.endDate),
      discountType: 'RATE' as const,
      discount: holiday.discountExpected ? 15 : 10,
      applicableTargets: [{ targetType: 'COUNTRY', targetId: holiday.country }],
    };
  };
  
  return { upcomingEvents, loading, applyConceptDefaults, applyHolidayDefaults };
}
```

#### 쿠폰명 자동 생성 (NEW)
```typescript
function generateCouponName(
  concept: Concept,
  settings: CouponSettings,
  language: 'jp' | 'en' = 'jp'
): string {
  const template = concept.couponNameTemplate[language];
  
  return template
    .replace('{discount}', settings.discount.toString())
    .replace('{amount}', settings.discount.toString())
    .replace('{currency}', settings.currencyCode);
}
```

#### 템플릿 정의 (기존)
```typescript
const TEMPLATES = {
  newUser: {
    name: '신규 가입 쿠폰',
    defaults: {
      discountType: 'FIXED',
      discount: 500,
      currencyCode: 'JPY',
      minOrderPrice: 0,
      isPublic: false,
      applicableTargets: [],
    }
  },
  jpPromotion: {
    name: '일본 기획전',
    defaults: {
      discountType: 'RATE',
      discount: 10,
      currencyCode: 'JPY',
      minOrderPrice: 8000,
      maxDiscountPrice: 1000,
      isPublic: true,
    }
  },
  globalPromotion: {
    name: '글로벌 기획전',
    defaults: {
      discountType: 'RATE',
      discount: 10,
      currencyCode: 'USD',
      minOrderPrice: 20,
      maxDiscountPrice: 3,
      isPublic: true,
    }
  }
};
```

---

## 9. 구현 계획

### Phase 1: 기본 기능 (1일)
- [ ] 페이지 레이아웃 구성
- [ ] 쿠폰 폼 컴포넌트 구현
- [ ] 날짜 변환 유틸리티
- [ ] JSON 생성 및 복사 기능

### Phase 2: 템플릿 시스템 (0.5일)
- [ ] 템플릿 선택 UI
- [ ] 템플릿별 기본값 적용
- [ ] 국가 선택 프리셋

### Phase 3: 스마트 컨셉 시스템 ⭐ NEW (1일)
- [ ] 컨셉 카테고리 UI 구현
- [ ] 컨셉별 자동 설정 로직
- [ ] 시즌 이벤트 자동 감지
- [ ] 쿠폰명 자동 생성
- [ ] 지역별 통화/금액 자동 조정
- [ ] 마케팅 캘린더 API 연동 (calendarApi.getUpcoming)

### Phase 3.5: 할인율 최적화 시스템 ⭐ NEW (0.5일)
- [ ] 할인율 추천 로직 구현
- [ ] 수익성 시뮬레이션 UI
- [ ] 캠페인 목적별 추천값 매핑
- [ ] 최소 주문/최대 할인 자동 계산

### Phase 4: UX 개선 (0.5일)
- [ ] 입력값 검증
- [ ] 실시간 미리보기
- [ ] 복사 완료 피드백
- [ ] 자동 설정값 하이라이트 표시

### Phase 5: 선택적 기능 (추후)
- [ ] 최근 생성 이력
- [ ] 쿼리 저장/불러오기
- [ ] 커스텀 컨셉 저장

---

## 10. 사용 시나리오

### 시나리오 1: 스마트 모드로 크리스마스 쿠폰 생성

1. **사용자**: 쿠폰 생성기 페이지 접속
2. **시스템**: 현재 날짜(12월 초) 기준으로 "🎄 크리스마스" 이벤트 자동 추천 표시
3. **사용자**: 추천된 "크리스마스" 컨셉 클릭
4. **시스템**: 자동 설정 적용
   - 쿠폰명: "Xmas限定10%OFF"
   - 기간: 12/20 ~ 12/25
   - 할인: 10% (정률)
   - 최소주문: ¥8,000
   - 대상: 일본
5. **사용자**: 쇼룸 ID만 입력 (1109)
6. **시스템**: JSON 쿼리 생성
7. **사용자**: "쿼리 복사" 클릭 → 완료

**소요 시간**: 약 30초 (기존 5분 → 90% 단축)

### 시나리오 2: 글로벌 블랙프라이데이 쿠폰 생성

1. **사용자**: "📅 시즌 이벤트" → "블랙프라이데이" 선택
2. **시스템**: 자동 설정 적용
   - 쿠폰명: "BF限定15%OFF"
   - 기간: 11/24 ~ 11/27
   - 할인: 15% (정률)
3. **사용자**: 지역을 "글로벌"로 변경
4. **시스템**: 자동 조정
   - 통화: USD
   - 최소주문: $25
   - 최대할인: $5
   - 대상 국가: 영어권 프리셋 자동 선택
5. **사용자**: 쇼룸 ID 입력 → 쿼리 복사

### 시나리오 3: 직접 설정 모드로 커스텀 쿠폰 생성

1. **사용자**: "⚙️ 직접 설정" 탭 선택
2. **사용자**: 모든 필드 수동 입력
   - 쿠폰명, 기간, 할인 설정 등
3. **시스템**: 실시간 쿼리 미리보기 업데이트
4. **사용자**: 쿼리 복사

---

## 11. 참고 자료

### 11.1 국가 코드 목록
| 코드 | 국가 | 통화 |
|------|------|------|
| JP | 일본 | JPY |
| US | 미국 | USD |
| CA | 캐나다 | USD |
| AU | 호주 | USD |
| NZ | 뉴질랜드 | USD |
| GB | 영국 | USD |
| SG | 싱가포르 | USD |
| HK | 홍콩 | USD |
| TW | 대만 | USD |
| TH | 태국 | USD |
| PH | 필리핀 | USD |
| SA | 사우디아라비아 | USD |
| AE | 아랍에미리트 | USD |
| DE | 독일 | USD |
| CH | 스위스 | USD |
| ES | 스페인 | USD |
| IT | 이탈리아 | USD |

### 11.2 쇼룸 ID 참고
| ID | 설명 |
|----|------|
| 1109 | 일본 기획전 |
| 1286 | 글로벌 기획전 |

---

## 12. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-12-02 | - | 초안 작성 |
| 1.1 | 2025-12-02 | - | 스마트 컨셉 시스템 추가, 자동 설정 기능 강화 |
| 1.2 | 2025-12-02 | - | KST 기준 날짜 변환 규칙 명시, 마케팅 캘린더 연동 추가 |
| 1.3 | 2025-12-02 | - | 할인율 최적화 시스템 추가 (수익성 분석, 시뮬레이션) |
