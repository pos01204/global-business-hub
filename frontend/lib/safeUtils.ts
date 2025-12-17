// frontend/lib/safeUtils.ts
// 안전한 데이터 처리 유틸리티 함수

/**
 * 안전한 숫자 변환
 * @param value - 변환할 값
 * @param defaultValue - 기본값 (default: 0)
 * @returns 숫자 값
 * 
 * @example
 * safeNumber(null)        // 0
 * safeNumber('1,234')     // 1234
 * safeNumber(undefined, -1) // -1
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
 * @param value - 변환할 값
 * @param defaultValue - 기본값 (default: 0)
 * @returns 정수 값
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
 * @param value - 변환할 값
 * @param defaultValue - 기본값 (default: '')
 * @returns 문자열 값
 * 
 * @example
 * safeString(null)        // ''
 * safeString(123)         // '123'
 * safeString(undefined, 'N/A') // 'N/A'
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
 * @param numerator - 분자
 * @param denominator - 분모
 * @param defaultValue - 분모가 0일 때 기본값 (default: 0)
 * @returns 나눗셈 결과
 * 
 * @example
 * safeDivide(10, 2)    // 5
 * safeDivide(10, 0)    // 0
 * safeDivide(10, 0, -1) // -1
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
 * @param value - 변환할 값
 * @returns 배열 (null/undefined면 빈 배열)
 * 
 * @example
 * safeArray(null)       // []
 * safeArray([1, 2, 3])  // [1, 2, 3]
 */
export const safeArray = <T>(value: T[] | null | undefined): T[] => {
  return Array.isArray(value) ? value : []
}

/**
 * 안전한 객체 속성 접근
 * @param obj - 객체
 * @param path - 속성 경로 (예: 'a.b.c')
 * @param defaultValue - 기본값
 * @returns 속성 값 또는 기본값
 * 
 * @example
 * safeGet({ a: { b: 1 } }, 'a.b')      // 1
 * safeGet({ a: { b: 1 } }, 'a.c', 0)   // 0
 */
export const safeGet = <T>(
  obj: Record<string, unknown> | null | undefined,
  path: string,
  defaultValue?: T
): T | undefined => {
  if (!obj) return defaultValue
  
  const keys = path.split('.')
  let result: unknown = obj
  
  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue
    result = (result as Record<string, unknown>)[key]
  }
  
  return (result ?? defaultValue) as T
}

/**
 * 안전한 배열 합계
 * @param arr - 숫자 배열
 * @returns 합계
 * 
 * @example
 * safeSum([1, 2, null, 3])  // 6
 * safeSum([])               // 0
 */
export const safeSum = (arr: (number | null | undefined)[]): number => {
  return safeArray(arr).reduce((acc: number, val) => acc + safeNumber(val), 0)
}

/**
 * 안전한 평균 계산
 * @param arr - 숫자 배열
 * @returns 평균 (유효한 값만 계산)
 * 
 * @example
 * safeAverage([1, 2, null, 3])  // 2 (6/3)
 * safeAverage([])               // 0
 */
export const safeAverage = (arr: (number | null | undefined)[]): number => {
  const validValues = safeArray(arr).filter(
    (v): v is number => v !== null && v !== undefined && !isNaN(Number(v))
  )
  
  if (validValues.length === 0) return 0
  return safeSum(validValues) / validValues.length
}

/**
 * 안전한 최대값
 * @param arr - 숫자 배열
 * @param defaultValue - 기본값
 * @returns 최대값
 */
export const safeMax = (
  arr: (number | null | undefined)[],
  defaultValue: number = 0
): number => {
  const validValues = safeArray(arr).filter(
    (v): v is number => v !== null && v !== undefined && !isNaN(Number(v))
  )
  
  if (validValues.length === 0) return defaultValue
  return Math.max(...validValues)
}

/**
 * 안전한 최소값
 * @param arr - 숫자 배열
 * @param defaultValue - 기본값
 * @returns 최소값
 */
export const safeMin = (
  arr: (number | null | undefined)[],
  defaultValue: number = 0
): number => {
  const validValues = safeArray(arr).filter(
    (v): v is number => v !== null && v !== undefined && !isNaN(Number(v))
  )
  
  if (validValues.length === 0) return defaultValue
  return Math.min(...validValues)
}

/**
 * 안전한 JSON 파싱
 * @param jsonString - JSON 문자열
 * @param defaultValue - 파싱 실패 시 기본값
 * @returns 파싱된 객체 또는 기본값
 */
export const safeJsonParse = <T>(
  jsonString: string | null | undefined,
  defaultValue: T
): T => {
  if (!jsonString) return defaultValue
  
  try {
    return JSON.parse(jsonString) as T
  } catch {
    return defaultValue
  }
}

/**
 * 안전한 날짜 변환
 * @param value - 날짜 값
 * @param defaultValue - 기본값 (null)
 * @returns Date 객체 또는 null
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
 * @param value - 확인할 값
 * @returns 비어있으면 true
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 값이 비어있지 않은지 확인
 * @param value - 확인할 값
 * @returns 비어있지 않으면 true
 */
export const isNotEmpty = (value: unknown): boolean => {
  return !isEmpty(value)
}

/**
 * 범위 내 값으로 제한
 * @param value - 값
 * @param min - 최소값
 * @param max - 최대값
 * @returns 범위 내 값
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(safeNumber(value), min), max)
}

