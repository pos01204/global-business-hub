/**
 * 유저 ID 파싱 및 배치 분할 유틸리티
 */

import { formatDateToUTC } from '../types/coupon';
import { IndividualIssueQuery } from '../types/individual';

/**
 * 텍스트에서 유저 ID 배열 추출
 */
export function parseUserIds(text: string): number[] {
  if (!text.trim()) return [];
  
  const ids = text
    .split(/[\s,\n\t]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n) && n > 0);
  
  return [...new Set(ids)];
}

/**
 * 유저 ID 배열을 배치로 분할
 */
export function splitIntoBatches(userIds: number[], batchSize: number): number[][] {
  if (batchSize <= 0) return [userIds];
  
  const batches: number[][] = [];
  for (let i = 0; i < userIds.length; i += batchSize) {
    batches.push(userIds.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * 개별 발급 쿼리 생성
 */
export function generateIndividualQuery(
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

/**
 * 배치별 쿼리 생성
 */
export function generateBatchQueries(
  couponId: number,
  fromDate: string,
  toDate: string,
  userIds: number[],
  batchSize: number
): IndividualIssueQuery[] {
  const batches = splitIntoBatches(userIds, batchSize);
  return batches.map(batch => 
    generateIndividualQuery(couponId, fromDate, toDate, batch)
  );
}

/**
 * 유저 ID 유효성 검증
 */
export function validateUserIds(userIds: number[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (userIds.length === 0) {
    errors.push('발급 대상 유저를 선택해주세요.');
  }

  if (userIds.length > 10000) {
    warnings.push('10,000명 이상 대량 발급 시 배치 분할을 권장합니다.');
  }

  if (userIds.length > 1000 && userIds.length <= 10000) {
    warnings.push('1,000명 이상 발급 시 배치 분할을 고려해보세요.');
  }

  return { isValid: errors.length === 0, errors, warnings };
}
