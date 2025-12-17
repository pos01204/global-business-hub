// backend/src/utils/safeUtils.ts
// 백엔드 안전 유틸리티 함수

/**
 * 안전한 숫자 변환
 */
export const safeNumber = (
  value: unknown,
  defaultValue: number = 0
): number => {
  if (value === null || value === undefined) return defaultValue
  
  const num = typeof value === 'string' 
    ? parseFloat(value.replace(/[,\s]/g, ''))
    : Number(value)
  
  return isNaN(num) || !isFinite(num) ? defaultValue : num
}

/**
 * 안전한 정수 변환
 */
export const safeInt = (
  value: unknown,
  defaultValue: number = 0
): number => {
  const num = safeNumber(value, defaultValue)
  return Math.floor(num)
}

/**
 * 안전한 문자열 변환
 */
export const safeString = (
  value: unknown,
  defaultValue: string = ''
): string => {
  if (value === null || value === undefined) return defaultValue
  return String(value)
}

/**
 * 안전한 나눗셈
 */
export const safeDivide = (
  numerator: number | null | undefined,
  denominator: number | null | undefined,
  defaultValue: number = 0
): number => {
  const num = safeNumber(numerator)
  const den = safeNumber(denominator)
  
  if (den === 0 || !isFinite(den)) return defaultValue
  
  const result = num / den
  return isNaN(result) || !isFinite(result) ? defaultValue : result
}

/**
 * 안전한 배열 변환
 */
export const safeArray = <T>(value: T[] | null | undefined): T[] => {
  return Array.isArray(value) ? value : []
}

/**
 * 안전한 배열 합계
 */
export const safeSum = (arr: (number | null | undefined)[]): number => {
  return safeArray(arr).reduce((acc: number, val) => acc + safeNumber(val), 0)
}

/**
 * 안전한 평균 계산
 */
export const safeAverage = (arr: (number | null | undefined)[]): number => {
  const validValues = safeArray(arr).filter(
    (v): v is number => v !== null && v !== undefined && !isNaN(Number(v))
  )
  
  if (validValues.length === 0) return 0
  return safeSum(validValues) / validValues.length
}

/**
 * 안전한 날짜 변환
 */
export const safeDate = (
  value: string | number | Date | null | undefined,
  defaultValue: Date | null = null
): Date | null => {
  if (!value) return defaultValue
  
  const date = value instanceof Date ? value : new Date(value)
  
  return isNaN(date.getTime()) ? defaultValue : date
}

/**
 * 값이 비어있는지 확인
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 범위 내 값으로 제한
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(safeNumber(value), min), max)
}

