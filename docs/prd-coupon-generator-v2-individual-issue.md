# 쿠폰 생성기 v2 개선안: 개별 유저 발급 기능

## 1. 개요

### 1.1 배경
현재 쿠폰 발급은 두 가지 방식으로 운영됩니다:

| 발급 방식 | 쿼리 구조 | 사용 케이스 |
|----------|----------|------------|
| **기획전 쿠폰** | `issueLimit` 기반 | 시즌 프로모션, 공개 쿠폰 |
| **개별 유저 발급** | `userIds` 배열 기반 | VIP, 휴면 복귀, CS 보상 |

**개별 유저 발급 쿼리 예시:**
```json
{
  "couponId": 967,
  "fromDateTime": "2025-12-01T15:00:00.000Z",
  "toDateTime": "2025-12-08T15:00:00.000Z",
  "userIds": [12345, 67890, 11111]
}
```

### 1.2 현재 문제점
- 특정 유저 세그먼트 대상 쿠폰 발급 시 **user_id 추출 작업**이 별도로 필요
- 세그먼트별 user_id 목록을 수동으로 쿼리에 붙여넣기 해야 함
- 대량 유저 발급 시 쿼리 생성이 번거로움
- 기획전 쿠폰과 개별 발급 쿠폰의 쿼리 구조가 달라 혼란 발생

### 1.3 개선 목표
- **세그먼트 기반 자동 user_id 추출** 기능 추가
- **개별 유저 발급 쿼리 자동 생성** 지원
- 기획전 쿠폰 / 개별 발급 쿠폰을 **탭 구조로 분리**하여 명확한 UX 제공
- 대량 유저 발급 시 **배치 분할** 지원

---

## 2. 쿠폰 발급 유형 정의

### 2.1 기획전 쿠폰 (기존)
사용자가 직접 쿠폰을 수령하는 방식

```json
{
  "adminId": 0,
  "issueUserId": 0,
  "couponName": "GW限定10%OFF",
  "description": "Golden Week COUPON",
  "fromDateTime": "2025-04-28T15:00:00+00:00",
  "toDateTime": "2025-05-06T15:00:00+00:00",
  "maxValidDateTime": "2025-05-06T15:00:00+00:00",
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

### 2.2 개별 유저 발급 쿠폰 (신규)
특정 유저에게 직접 쿠폰을 발급하는 방식

```json
{
  "couponId": 967,
  "fromDateTime": "2025-12-01T15:00:00.000Z",
  "toDateTime": "2025-12-08T15:00:00.000Z",
  "userIds": [12345, 67890, 11111, 22222, 33333]
}
```

### 2.3 두 방식의 차이점

| 구분 | 기획전 쿠폰 | 개별 유저 발급 |
|------|-----------|--------------|
| 발급 주체 | 유저가 직접 수령 | 시스템이 자동 발급 |
| 대상 지정 | 국가/쇼룸 단위 | 개별 user_id |
| 수량 제한 | issueLimit | userIds 배열 크기 |
| 쿼리 구조 | 전체 쿠폰 설정 | couponId + userIds |
| 사용 케이스 | 공개 프로모션 | VIP, 휴면, CS 보상 |

---

## 3. UI/UX 설계

### 3.1 탭 구조 개선

```
┌─────────────────────────────────────────────────────────────┐
│ 🎟️ 쿠폰 쿼리 생성기                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [📢 기획전 쿠폰] [👤 개별 유저 발급]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 기획전 쿠폰 탭 (기존 기능)

```
┌─────────────────────────────────────────────────────────────┐
│ 📢 기획전 쿠폰                                               │
│ 유저가 직접 수령하는 공개/비공개 쿠폰                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [🚀 스마트 모드] [⚙️ 직접 설정]                              │
│                                                             │
│ (기존 기능 유지)                                             │
│ - 컨셉 선택                                                 │
│ - 할인 최적화                                               │
│ - 국가/쇼룸 선택                                            │
│ - 쿼리 미리보기                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 개별 유저 발급 탭 (신규)

```
┌─────────────────────────────────────────────────────────────┐
│ 👤 개별 유저 발급                                            │
│ 특정 유저에게 직접 쿠폰을 발급합니다                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📋 쿠폰 정보                                             │ │
│ │ 쿠폰 ID: [967        ]  ← 기존 생성된 쿠폰 ID 입력       │ │
│ │                                                         │ │
│ │ 📅 발급 기간                                             │ │
│ │ 시작일: [2025-12-01]  종료일: [2025-12-08]              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👥 대상 유저 선택                                        │ │
│ │                                                         │ │
│ │ [세그먼트 선택] [직접 입력]                               │ │
│ │                                                         │ │
│ │ 📊 세그먼트 선택:                                        │ │
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │ │
│ │ │ 👑 VIP  │ │ 😴 휴면  │ │ 🆕 신규  │ │ 🎯 커스텀│        │ │
│ │ │ 1,234명 │ │ 5,678명 │ │ 890명   │ │ 조건설정 │        │ │
│ │ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │ │
│ │                                                         │ │
│ │ 또는                                                    │ │
│ │                                                         │ │
│ │ 📝 직접 입력:                                            │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 12345, 67890, 11111, 22222, 33333                   │ │ │
│ │ │ (쉼표 또는 줄바꿈으로 구분)                           │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ 선택된 유저: 5명                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚙️ 발급 옵션                                             │ │
│ │                                                         │ │
│ │ 배치 크기: [100] 명씩 분할  (대량 발급 시 권장)          │ │
│ │ [ ] 배치별 쿼리 분할 생성                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 📋 생성된 쿼리:                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ {                                                       │ │
│ │   "couponId": 967,                                      │ │
│ │   "fromDateTime": "2025-12-01T15:00:00.000Z",          │ │
│ │   "toDateTime": "2025-12-08T15:00:00.000Z",            │ │
│ │   "userIds": [12345, 67890, 11111, 22222, 33333]       │ │
│ │ }                                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                        [📋 쿼리 복사]       │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 고객 분석 연동 시스템

### 4.1 기존 고객 분석 기능 활용

현재 **고객 분석 탭**에서 제공하는 세그먼트 데이터를 쿠폰 발급에 직접 연동합니다.

#### 연동 가능한 고객 분석 기능

| 분석 탭 | API | 제공 데이터 | 쿠폰 활용 |
|--------|-----|-----------|----------|
| **RFM 세그먼트** | `/api/customer-analytics/rfm` | 세그먼트별 고객 목록 (userId 포함) | VIP, 충성고객, 잠재고객 타겟팅 |
| **이탈 위험** | `/api/customer-analytics/churn-risk` | 위험도별 고객 목록 (userId 포함) | 이탈 방지 쿠폰 발급 |
| **구매 전환** | `/api/customer-analytics/conversion` | 미전환 고객 목록 | 첫 구매 유도 쿠폰 |
| **LTV 분석** | `/api/customer-analytics/ltv` | LTV 등급별 고객 | 고가치 고객 리텐션 |
| **코호트** | `/api/customer-analytics/cohort` | 가입월별 고객 | 특정 코호트 타겟팅 |

### 4.2 RFM 세그먼트 연동

고객 분석의 RFM 세그먼트를 직접 활용합니다.

```typescript
// 기존 RFM API 응답 구조
interface RFMResponse {
  success: boolean;
  segments: Array<{
    segment: string;        // 'Champions', 'Loyal', 'Potential', etc.
    label: string;          // '챔피언', '충성 고객', etc.
    count: number;
    customers: Array<{
      userId: string;       // ⭐ 쿠폰 발급에 사용
      country: string;
      recencyDays: number;
      frequency: number;
      monetary: number;
      rfmScore: string;
    }>;
  }>;
}

// RFM 세그먼트 정의 (기존 시스템)
const RFM_SEGMENTS = {
  'Champions': { label: '챔피언', description: '최근 구매, 자주, 많이 구매하는 최우수 고객' },
  'Loyal': { label: '충성 고객', description: '꾸준히 구매하는 핵심 고객' },
  'Potential': { label: '잠재 고객', description: '최근 구매했으나 빈도가 낮은 고객' },
  'Promising': { label: '유망 고객', description: '최근 가입, 첫 구매 완료' },
  'NeedsAttention': { label: '관심 필요', description: '이전 우수 고객, 최근 활동 감소' },
  'AtRisk': { label: '위험', description: '이전 활발했으나 오래 미구매' },
  'Hibernating': { label: '휴면', description: '오랜 기간 미구매' },
  'Lost': { label: '이탈', description: '매우 오래 미구매, 이탈 가능성 높음' },
};
```

### 4.3 이탈 위험 고객 연동

```typescript
// 기존 이탈 위험 API 응답 구조
interface ChurnRiskResponse {
  success: boolean;
  summary: {
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    potentialRevenueLoss: number;
  };
  highRisk: Array<{
    userId: string;         // ⭐ 쿠폰 발급에 사용
    country: string;
    recencyDays: number;
    frequency: number;
    totalAmount: number;
    riskScore: number;
    riskFactors: string[];
  }>;
  mediumRisk: Array<...>;
  lowRisk: Array<...>;
}
```

### 4.4 세그먼트 선택 UI 연동

```
┌─────────────────────────────────────────────────────────────┐
│ 👥 대상 유저 선택                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 고객 분석 연동                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ RFM 세그먼트                                             │ │
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │ │
│ │ │ 👑 챔피언 │ │ 💙 충성  │ │ ⭐ 잠재  │ │ 🌱 유망  │        │ │
│ │ │   45명   │ │  123명  │ │  234명  │ │   89명  │        │ │
│ │ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │ │
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │ │
│ │ │ ⚠️ 관심  │ │ 🔴 위험  │ │ 😴 휴면  │ │ ❌ 이탈  │        │ │
│ │ │   67명   │ │   34명  │ │  156명  │ │   78명  │        │ │
│ │ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 이탈 위험 분석                                           │ │
│ │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │ │
│ │ │ 🔴 높은 위험    │ │ 🟡 중간 위험    │ │ 🟢 낮은 위험    │  │ │
│ │ │     23명      │ │     45명      │ │     89명      │  │ │
│ │ │ 예상손실 120만원│ │ 예상손실 80만원 │ │ 예상손실 30만원 │  │ │
│ │ └───────────────┘ └───────────────┘ └───────────────┘  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 💡 고객 분석 탭에서 더 자세한 분석을 확인하세요 [바로가기 →]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.5 세그먼트 API 통합

```typescript
// 쿠폰 발급용 세그먼트 API (신규 추가)
interface CouponSegmentApi {
  // RFM 세그먼트에서 userId 추출
  getRFMSegmentUserIds(segment: string): Promise<{
    userIds: number[];
    count: number;
    segmentInfo: { label: string; description: string };
  }>;
  
  // 이탈 위험 등급에서 userId 추출
  getChurnRiskUserIds(riskLevel: 'high' | 'medium' | 'low'): Promise<{
    userIds: number[];
    count: number;
    potentialLoss: number;
  }>;
  
  // 복합 조건 (RFM + 국가 필터)
  getFilteredUserIds(params: {
    rfmSegments?: string[];
    churnRiskLevels?: string[];
    countries?: string[];
  }): Promise<{
    userIds: number[];
    count: number;
  }>;
}
```

### 4.6 고객 분석 → 쿠폰 발급 워크플로우

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  고객 분석 탭     │     │  쿠폰 생성기      │     │  쿠폰 발급       │
│                  │     │                  │     │                  │
│ RFM 세그먼트 확인 │ ──→ │ 세그먼트 선택     │ ──→ │ 개별 발급 쿼리   │
│ 이탈 위험 분석   │     │ userId 자동 추출  │     │ 생성 및 복사     │
│ 코호트 분석      │     │ 배치 분할 설정    │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                        │
        │    [쿠폰 발급하기]      │
        └────────────────────────┘
              버튼으로 연동
```

### 4.7 고객 분석 탭에서 쿠폰 발급 버튼 추가

기존 고객 분석 탭의 세그먼트 상세 화면에 "쿠폰 발급" 버튼을 추가합니다.

```typescript
// RFM 탭 세그먼트 상세에서
{selectedData && (
  <div className="card">
    <div className="flex items-center justify-between mb-4">
      <h3>{selectedData.label} 고객 상세</h3>
      <button
        onClick={() => {
          // 선택된 세그먼트의 userId를 쿠폰 생성기로 전달
          const userIds = selectedData.customers.map(c => c.userId);
          router.push(`/coupon-generator?tab=individual&segment=${selectedData.segment}&userIds=${userIds.join(',')}`);
        }}
        className="px-4 py-2 bg-primary text-white rounded-lg"
      >
        🎟️ 이 세그먼트에 쿠폰 발급
      </button>
    </div>
    {/* 고객 목록 테이블 */}
  </div>
)}
```

---

## 5. 기능 요구사항

### 5.1 개별 유저 발급 탭 기능

#### F1: 쿠폰 ID 입력
- 기존 생성된 쿠폰의 ID 입력
- (선택) 쿠폰 ID로 쿠폰 정보 조회 및 표시

#### F2: 발급 기간 설정
- 시작일/종료일 선택 (KST 기준)
- UTC 자동 변환

#### F3: 세그먼트 기반 유저 선택
- 기본 세그먼트 버튼 클릭으로 빠른 선택
- 세그먼트별 유저 수 미리보기
- 커스텀 조건 설정 UI

#### F4: 직접 유저 ID 입력
- 텍스트 영역에 user_id 직접 입력
- 쉼표, 줄바꿈, 공백 구분 지원
- 중복 제거 자동 처리

#### F5: 배치 분할 옵션
- 대량 유저 발급 시 N명씩 분할
- 배치별 쿼리 개별 생성
- 배치별 복사 또는 전체 복사

#### F6: 쿼리 생성 및 복사
- 개별 발급 쿼리 형식으로 생성
- 클립보드 복사

### 5.2 세그먼트 관리 기능 (선택)

#### F7: 세그먼트 저장
- 자주 사용하는 커스텀 세그먼트 저장
- 저장된 세그먼트 빠른 선택

#### F8: 세그먼트 미리보기
- 선택한 세그먼트의 유저 수 표시
- 샘플 유저 ID 미리보기

---

## 6. 기술 설계

### 6.1 프론트엔드 구조 변경

```
frontend/app/coupon-generator/
├── page.tsx                      # 메인 페이지 (탭 구조)
├── components/
│   ├── tabs/
│   │   ├── PromotionCouponTab.tsx   # 기획전 쿠폰 탭 (기존 기능)
│   │   └── IndividualIssueTab.tsx   # 개별 유저 발급 탭 (신규)
│   ├── individual/
│   │   ├── CouponIdInput.tsx        # 쿠폰 ID 입력
│   │   ├── SegmentSelector.tsx      # 세그먼트 선택 (고객분석 연동)
│   │   ├── RFMSegmentPicker.tsx     # RFM 세그먼트 선택 (신규)
│   │   ├── ChurnRiskPicker.tsx      # 이탈 위험 선택 (신규)
│   │   ├── UserIdInput.tsx          # 직접 유저 ID 입력
│   │   ├── BatchOptions.tsx         # 배치 분할 옵션
│   │   └── IndividualQueryPreview.tsx # 개별 발급 쿼리 미리보기
│   ├── SmartModePanel.tsx           # (기존)
│   ├── ManualModePanel.tsx          # (기존)
│   ├── DiscountOptimizer.tsx        # (기존)
│   ├── CouponForm.tsx               # (기존)
│   └── QueryPreview.tsx             # (기존)
├── hooks/
│   ├── useCouponGenerator.ts        # (기존)
│   ├── useRFMSegments.ts            # RFM 세그먼트 조회 (신규)
│   ├── useChurnRisk.ts              # 이탈 위험 조회 (신규)
│   └── useBatchQuery.ts             # 배치 쿼리 생성 (신규)
├── types/
│   ├── coupon.ts                    # (기존)
│   ├── concept.ts                   # (기존)
│   └── individual.ts                # 개별 발급 타입 (신규)
└── utils/
    ├── dateUtils.ts                 # (기존)
    └── userIdParser.ts              # 유저 ID 파싱 (신규)

frontend/app/customer-analytics/
├── page.tsx                      # 고객 분석 페이지
│   └── (수정) 세그먼트 상세에 "쿠폰 발급" 버튼 추가
```

### 6.2 고객 분석 API 활용

```typescript
// 기존 API 활용 (수정 없음)
import { customerAnalyticsApi } from '@/lib/api';

// RFM 세그먼트 데이터 조회
const { data: rfmData } = useQuery({
  queryKey: ['rfm'],
  queryFn: customerAnalyticsApi.getRFM,
});

// 이탈 위험 데이터 조회
const { data: churnData } = useQuery({
  queryKey: ['churn-risk'],
  queryFn: customerAnalyticsApi.getChurnRisk,
});

// 세그먼트에서 userId 추출
function extractUserIds(segment: any): number[] {
  return segment.customers.map((c: any) => parseInt(c.userId, 10));
}
```

### 6.2 개별 발급 타입 정의

```typescript
// types/individual.ts

// 개별 유저 발급 쿼리
interface IndividualIssueQuery {
  couponId: number;
  fromDateTime: string;  // ISO8601 UTC
  toDateTime: string;    // ISO8601 UTC
  userIds: number[];
}

// 세그먼트 타입
type SegmentType = 'vip' | 'dormant' | 'new' | 'active' | 'churn_risk' | 'custom';

// 세그먼트 선택 상태
interface SegmentSelection {
  type: SegmentType;
  customConditions?: SegmentCondition;
  userIds: number[];
  userCount: number;
}

// 배치 설정
interface BatchConfig {
  enabled: boolean;
  batchSize: number;  // 기본 100
}

// 개별 발급 설정
interface IndividualIssueSettings {
  couponId: number | null;
  fromDate: string;
  toDate: string;
  segment: SegmentSelection | null;
  manualUserIds: string;  // 직접 입력 텍스트
  batchConfig: BatchConfig;
}
```

### 6.3 유저 ID 파싱 유틸

```typescript
// utils/userIdParser.ts

/**
 * 텍스트에서 유저 ID 배열 추출
 * 지원 형식: 쉼표, 줄바꿈, 공백, 탭 구분
 */
function parseUserIds(text: string): number[] {
  const ids = text
    .split(/[\s,\n\t]+/)           // 구분자로 분리
    .map(s => s.trim())             // 공백 제거
    .filter(s => s.length > 0)      // 빈 문자열 제거
    .map(s => parseInt(s, 10))      // 숫자 변환
    .filter(n => !isNaN(n) && n > 0); // 유효한 숫자만
  
  return [...new Set(ids)];         // 중복 제거
}

/**
 * 유저 ID 배열을 배치로 분할
 */
function splitIntoBatches(userIds: number[], batchSize: number): number[][] {
  const batches: number[][] = [];
  for (let i = 0; i < userIds.length; i += batchSize) {
    batches.push(userIds.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * 개별 발급 쿼리 생성
 */
function generateIndividualQuery(
  couponId: number,
  fromDate: string,
  toDate: string,
  userIds: number[]
): IndividualIssueQuery {
  return {
    couponId,
    fromDateTime: formatDateToUTC(fromDate).replace('+00:00', '.000Z'),
    toDateTime: formatDateToUTC(toDate).replace('+00:00', '.000Z'),
    userIds,
  };
}
```

---

## 7. 구현 계획

### Phase 1: 탭 구조 개편 (0.5일)
- [ ] 메인 페이지 탭 구조로 변경 (기획전 쿠폰 / 개별 유저 발급)
- [ ] 기획전 쿠폰 탭 (기존 기능 이동)
- [ ] 개별 유저 발급 탭 기본 레이아웃
- [ ] URL 파라미터로 탭/세그먼트 전달 지원

### Phase 2: 개별 발급 기본 기능 (0.5일)
- [ ] 쿠폰 ID 입력 컴포넌트
- [ ] 발급 기간 설정 (KST → UTC 변환)
- [ ] 직접 유저 ID 입력 (텍스트, 쉼표/줄바꿈 구분)
- [ ] 개별 발급 쿼리 생성 및 복사

### Phase 3: 고객 분석 연동 (1일) ⭐ 핵심
- [ ] RFM 세그먼트 선택 UI (기존 API 활용)
- [ ] 이탈 위험 등급 선택 UI (기존 API 활용)
- [ ] 세그먼트별 유저 수 실시간 표시
- [ ] 선택한 세그먼트에서 userId 자동 추출
- [ ] 복합 조건 선택 (RFM + 국가 필터)

### Phase 4: 고객 분석 탭 연동 (0.5일)
- [ ] RFM 탭 세그먼트 상세에 "쿠폰 발급" 버튼 추가
- [ ] 이탈 위험 탭에 "쿠폰 발급" 버튼 추가
- [ ] 버튼 클릭 시 쿠폰 생성기로 userId 전달

### Phase 5: 배치 분할 기능 (0.5일)
- [ ] 배치 크기 설정 UI (기본 100명)
- [ ] 배치별 쿼리 분할 생성
- [ ] 배치별/전체 복사 기능
- [ ] 대량 발급 시 경고 표시

### Phase 6: UX 개선 (0.5일)
- [ ] 입력값 검증 (쿠폰 ID, 날짜, userId)
- [ ] 로딩 상태 표시
- [ ] 에러 처리
- [ ] 복사 완료 피드백

---

## 8. 사용 시나리오

### 시나리오 1: 고객 분석에서 직접 쿠폰 발급 (추천 워크플로우)

1. **사용자**: 고객 분석 탭 → RFM 세그먼트 확인
2. **사용자**: "챔피언" 세그먼트 클릭하여 상세 보기
3. **사용자**: 45명의 챔피언 고객 목록 확인
4. **사용자**: "🎟️ 이 세그먼트에 쿠폰 발급" 버튼 클릭
5. **시스템**: 쿠폰 생성기로 이동, 45명의 userId 자동 입력
6. **사용자**: 쿠폰 ID와 기간만 입력
7. **시스템**: 개별 발급 쿼리 생성
8. **사용자**: 쿼리 복사 → 발급 시스템에 붙여넣기

**소요 시간**: 약 1분 (기존 10분+ → 90% 단축)

### 시나리오 2: 이탈 위험 고객 긴급 쿠폰 발급

1. **사용자**: 고객 분석 탭 → 이탈 위험 확인
2. **시스템**: "🚨 이탈 위험 고객 23명 감지, 예상 손실 120만원" 표시
3. **사용자**: "높은 위험" 고객 목록에서 "쿠폰 발급" 클릭
4. **시스템**: 쿠폰 생성기로 이동, 23명 userId 자동 입력
5. **사용자**: 휴면 복귀용 쿠폰 ID 입력, 기간 설정
6. **사용자**: 쿼리 복사 및 발급

### 시나리오 3: 쿠폰 생성기에서 세그먼트 선택

1. **사용자**: 쿠폰 생성기 → "개별 유저 발급" 탭 선택
2. **사용자**: 쿠폰 ID 입력 (967), 기간 설정 (12/1 ~ 12/8)
3. **사용자**: "RFM 세그먼트" 영역에서 "충성 고객" 클릭
4. **시스템**: 고객 분석 API 호출, 123명 조회 및 표시
5. **사용자**: "쿼리 복사" 클릭
6. **시스템**: 개별 발급 쿼리 생성 및 복사

### 시나리오 4: 대량 발급 (배치 분할)

1. **사용자**: "개별 유저 발급" 탭에서 "휴면" 세그먼트 선택
2. **시스템**: 156명 휴면 고객 조회
3. **사용자**: 배치 분할 활성화, 배치 크기 50명
4. **시스템**: 4개 배치로 분할 (50, 50, 50, 6명)
5. **사용자**: 배치별 쿼리 확인 및 순차 복사

### 시나리오 5: 직접 유저 ID 입력

1. **사용자**: "개별 유저 발급" 탭 → "직접 입력" 선택
2. **사용자**: 텍스트 영역에 user_id 붙여넣기
   ```
   12345, 67890
   11111
   22222, 33333
   ```
3. **시스템**: 5명 유저 ID 파싱 및 중복 제거
4. **사용자**: 쿠폰 ID, 기간 입력 후 쿼리 복사

---

## 9. 기존 기능 영향도

### 9.1 변경 없음
- 기획전 쿠폰 생성 기능 (기존 그대로 유지)
- 스마트 모드 / 직접 설정 모드
- 할인 최적화 기능
- 국가/쇼룸 선택 기능

### 9.2 변경 사항
- 메인 페이지 구조: 단일 → 탭 구조
- issueUserId 관련 UI 제거 (개별 발급 탭으로 분리)

### 9.3 신규 추가
- 개별 유저 발급 탭
- 세그먼트 선택 기능
- 배치 분할 기능

---

## 10. 연동 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           데이터 흐름                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Google Sheets]                                                        │
│       │                                                                 │
│       ▼                                                                 │
│  [Backend API]                                                          │
│       │                                                                 │
│       ├──→ /api/customer-analytics/rfm ──→ RFM 세그먼트 + userId       │
│       │                                                                 │
│       ├──→ /api/customer-analytics/churn-risk ──→ 이탈위험 + userId    │
│       │                                                                 │
│       └──→ /api/customer-analytics/ltv ──→ LTV 등급 + userId           │
│                                                                         │
│       ▼                                                                 │
│  [Frontend - 고객 분석]                                                  │
│       │                                                                 │
│       ├──→ RFM 탭: 세그먼트별 고객 목록 표시                             │
│       │         └──→ [쿠폰 발급] 버튼 ──→ 쿠폰 생성기로 userId 전달     │
│       │                                                                 │
│       └──→ 이탈 위험 탭: 위험 등급별 고객 목록 표시                       │
│                 └──→ [쿠폰 발급] 버튼 ──→ 쿠폰 생성기로 userId 전달     │
│                                                                         │
│       ▼                                                                 │
│  [Frontend - 쿠폰 생성기]                                                │
│       │                                                                 │
│       ├──→ 개별 유저 발급 탭                                             │
│       │         ├──→ 세그먼트 선택 (API 직접 호출)                       │
│       │         ├──→ URL 파라미터로 전달받은 userId 사용                 │
│       │         └──→ 직접 입력                                          │
│       │                                                                 │
│       └──→ 개별 발급 쿼리 생성                                           │
│                 │                                                       │
│                 ▼                                                       │
│            { couponId, fromDateTime, toDateTime, userIds: [...] }      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 11. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 2.0 | 2025-12-02 | - | 개별 유저 발급 기능 개선안 초안 |
| 2.1 | 2025-12-02 | - | 고객 분석 탭 연동 기능 추가, RFM/이탈위험 세그먼트 연동 설계 |
