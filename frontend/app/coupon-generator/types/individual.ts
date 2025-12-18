// 개별 유저 발급 관련 타입 정의

// 개별 유저 발급 쿼리
export interface IndividualIssueQuery {
  couponId: number;
  fromDateTime: string;  // ISO8601 UTC
  toDateTime: string;    // ISO8601 UTC
  userIds: number[];
}

// RFM 세그먼트 타입
export interface RFMSegment {
  segment: string;
  label: string;
  color: string;
  description: string;
  count: number;
  customers: Array<{
    userId: string;
    country: string;
    recencyDays: number;
    frequency: number;
    monetary: number;
    rfmScore: string;
  }>;
  // 전체 유저 ID 목록 (쿠폰 발급용)
  allUserIds?: string[];
}

// 이탈 위험 고객 타입
export interface ChurnRiskCustomer {
  userId: string;
  country: string;
  recencyDays: number;
  frequency: number;
  totalAmount: number;
  riskScore: number;
  riskFactors: string[];
}

export interface ChurnRiskData {
  highRisk: ChurnRiskCustomer[];
  mediumRisk: ChurnRiskCustomer[];
  lowRisk: ChurnRiskCustomer[];
  // 전체 유저 ID 목록 (쿠폰 발급용)
  allUserIds?: {
    highRisk: string[];
    mediumRisk: string[];
    lowRisk: string[];
  };
}

// 세그먼트 선택 상태
export interface SegmentSelection {
  type: 'rfm' | 'churn' | 'manual';
  rfmSegment?: string;
  churnLevel?: 'high' | 'medium' | 'low';
  userIds: number[];
  userCount: number;
  description?: string;
}

// 배치 설정
export interface BatchConfig {
  enabled: boolean;
  batchSize: number;
}

// 개별 발급 설정
export interface IndividualIssueSettings {
  couponId: number | null;
  fromDate: string;
  toDate: string;
  segment: SegmentSelection | null;
  manualUserIds: string;
  batchConfig: BatchConfig;
}

// 기본값
export const defaultIndividualSettings: IndividualIssueSettings = {
  couponId: null,
  fromDate: new Date().toISOString().split('T')[0],
  toDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  segment: null,
  manualUserIds: '',
  batchConfig: {
    enabled: false,
    batchSize: 100,
  },
};
