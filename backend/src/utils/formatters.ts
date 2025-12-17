// backend/src/utils/formatters.ts
// 백엔드 공통 포맷팅 유틸리티

import { CURRENCY } from '../config/constants'

/**
 * USD → KRW 변환
 */
export const toKRW = (usdAmount: number | null | undefined): number => {
  if (usdAmount === null || usdAmount === undefined || isNaN(usdAmount)) return 0
  return Math.round(usdAmount * CURRENCY.USD_TO_KRW)
}

/**
 * KRW → USD 변환
 */
export const toUSD = (krwAmount: number | null | undefined): number => {
  if (krwAmount === null || krwAmount === undefined || isNaN(krwAmount)) return 0
  return Math.round((krwAmount / CURRENCY.USD_TO_KRW) * 100) / 100
}

/**
 * 원화 포맷팅
 */
export const formatCurrency = (
  value: number | null | undefined,
  defaultValue: string = '₩0'
): string => {
  if (value === null || value === undefined || isNaN(value)) return defaultValue
  return `${CURRENCY.SYMBOL_KRW}${Math.round(value).toLocaleString('ko-KR')}`
}

/**
 * USD → KRW 변환 후 포맷팅
 */
export const formatKRW = (usdAmount: number | null | undefined): string => {
  return formatCurrency(toKRW(usdAmount))
}

/**
 * 퍼센트 포맷팅
 */
export const formatPercent = (
  value: number | null | undefined,
  decimals: number = 1
): string => {
  if (value === null || value === undefined || isNaN(value)) return '0.0%'
  return `${value.toFixed(decimals)}%`
}

/**
 * 변화율 계산
 */
export const calculateChangeRate = (
  current: number | null | undefined,
  previous: number | null | undefined
): number => {
  const curr = current ?? 0
  const prev = previous ?? 0
  
  if (prev === 0) return curr > 0 ? Infinity : 0
  return ((curr - prev) / prev) * 100
}

/**
 * 날짜를 API 형식으로 변환
 */
export const toApiDateFormat = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 어제 날짜 반환
 */
export const getYesterday = (): Date => {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date
}

/**
 * N일 전 날짜 반환
 */
export const getDaysAgo = (days: number): Date => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

