// frontend/lib/formatters.ts
// 공통 포맷팅 유틸리티 함수

import { CURRENCY } from '@/config/constants'

/**
 * 원화 포맷팅
 * @param value - 금액 (number | string | null | undefined)
 * @param defaultValue - 기본값 (default: '₩0')
 * @returns 포맷팅된 문자열 (예: '₩1,234,567')
 * 
 * @example
 * formatCurrency(1234567)     // '₩1,234,567'
 * formatCurrency(null)        // '₩0'
 * formatCurrency('1,234')     // '₩1,234'
 */
export const formatCurrency = (
  value: number | string | null | undefined,
  defaultValue: string = '₩0'
): string => {
  if (value === null || value === undefined) return defaultValue
  
  const numValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[,\s₩$]/g, '')) 
    : value
  
  if (isNaN(numValue) || !isFinite(numValue)) return defaultValue
  
  return `${CURRENCY.SYMBOL_KRW}${Math.round(numValue).toLocaleString('ko-KR')}`
}

/**
 * 변화율 포맷팅
 * @param value - 변화율 (number | null | undefined)
 * @param options - 옵션 { showSign: boolean, decimals: number, isRatio: boolean }
 * @returns 포맷팅된 문자열 (예: '+15.0%', '-3.2%')
 * 
 * @example
 * formatChange(15.5)                    // '+15.5%' (퍼센트 값)
 * formatChange(0.155, { isRatio: true }) // '+15.5%' (비율 값)
 * formatChange(-3.2)                    // '-3.2%'
 * formatChange(0)                       // '0.0%'
 */
export const formatChange = (
  value: number | null | undefined,
  options: { showSign?: boolean; decimals?: number; isRatio?: boolean } = {}
): string => {
  const { showSign = true, decimals = 1, isRatio = false } = options
  
  if (value === null || value === undefined || isNaN(value)) return '0.0%'
  
  if (!isFinite(value)) return 'New'
  
  // isRatio가 true면 비율(0.15)을 퍼센트(15)로 변환
  const percentValue = isRatio ? value * 100 : value
  
  const sign = showSign && percentValue > 0 ? '+' : ''
  return `${sign}${percentValue.toFixed(decimals)}%`
}

/**
 * 변화율 계산
 * @param current - 현재 값
 * @param previous - 이전 값
 * @returns 변화율 (퍼센트)
 * 
 * @example
 * calculateChangeRate(120, 100)  // 20 (20% 증가)
 * calculateChangeRate(80, 100)   // -20 (-20% 감소)
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
 * USD → KRW 변환
 * @param usdAmount - USD 금액
 * @returns KRW 금액 (정수)
 * 
 * @example
 * toKRW(100)    // 135000
 * toKRW(97.29)  // 131342
 */
export const toKRW = (usdAmount: number | null | undefined): number => {
  if (usdAmount === null || usdAmount === undefined || isNaN(usdAmount)) return 0
  return Math.round(usdAmount * CURRENCY.USD_TO_KRW)
}

/**
 * KRW → USD 변환
 * @param krwAmount - KRW 금액
 * @returns USD 금액 (소수점 2자리)
 */
export const toUSD = (krwAmount: number | null | undefined): number => {
  if (krwAmount === null || krwAmount === undefined || isNaN(krwAmount)) return 0
  return Math.round((krwAmount / CURRENCY.USD_TO_KRW) * 100) / 100
}

/**
 * USD → KRW 변환 후 포맷팅
 * @param usdAmount - USD 금액
 * @returns 포맷팅된 KRW 문자열
 * 
 * @example
 * formatKRW(100)    // '₩135,000'
 * formatKRW(97.29)  // '₩131,342'
 */
export const formatKRW = (usdAmount: number | null | undefined): string => {
  return formatCurrency(toKRW(usdAmount))
}

/**
 * USD 포맷팅
 * @param value - USD 금액
 * @returns 포맷팅된 문자열 (예: '$1,234.56')
 * 
 * @example
 * formatUSD(1234.56)  // '$1,234.56'
 * formatUSD(100)      // '$100.00'
 */
export const formatUSD = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '$0.00'
  return `${CURRENCY.SYMBOL_USD}${value.toLocaleString('en-US', { 
    minimumFractionDigits: CURRENCY.DECIMAL_PLACES_USD, 
    maximumFractionDigits: CURRENCY.DECIMAL_PLACES_USD 
  })}`
}

/**
 * 퍼센트 포맷팅
 * @param value - 비율 (0~1 또는 0~100)
 * @param isRatio - true면 0~1 범위, false면 0~100 범위
 * @returns 포맷팅된 문자열 (예: '15.0%')
 * 
 * @example
 * formatPercent(0.15, true)   // '15.0%'
 * formatPercent(15.5, false)  // '15.5%'
 */
export const formatPercent = (
  value: number | null | undefined,
  isRatio: boolean = false
): string => {
  if (value === null || value === undefined || isNaN(value)) return '0.0%'
  const percent = isRatio ? value * 100 : value
  return `${percent.toFixed(1)}%`
}

/**
 * 숫자 축약 포맷팅 (K, M, B)
 * @param value - 숫자
 * @param decimals - 소수점 자릿수
 * @returns 축약된 문자열 (예: '1.2K', '3.5M')
 * 
 * @example
 * formatCompact(1234)       // '1.2K'
 * formatCompact(1234567)    // '1.2M'
 * formatCompact(1234567890) // '1.2B'
 */
export const formatCompact = (
  value: number | null | undefined,
  decimals: number = 1
): string => {
  if (value === null || value === undefined || isNaN(value)) return '0'
  
  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  
  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(decimals)}B`
  }
  if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(decimals)}M`
  }
  if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(decimals)}K`
  }
  return `${sign}${absValue.toFixed(decimals)}`
}

/**
 * 숫자 포맷팅 (천단위 쉼표)
 * @param value - 숫자
 * @param decimals - 소수점 자릿수 (기본: 0)
 * @returns 포맷팅된 문자열
 * 
 * @example
 * formatNumber(1234567)    // '1,234,567'
 * formatNumber(1234.5, 2)  // '1,234.50'
 */
export const formatNumber = (
  value: number | null | undefined,
  decimals: number = 0
): string => {
  if (value === null || value === undefined || isNaN(value)) return '0'
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * 날짜 포맷팅 (한국어)
 * @param date - 날짜 (Date | string | null | undefined)
 * @param format - 포맷 ('full' | 'short' | 'month')
 * @returns 포맷팅된 날짜 문자열
 * 
 * @example
 * formatDate(new Date(), 'full')   // '2024년 12월 17일'
 * formatDate('2024-12-17', 'short') // '12/17'
 */
export const formatDate = (
  date: Date | string | null | undefined,
  format: 'full' | 'short' | 'month' = 'full'
): string => {
  if (!date) return '-'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return '-'
  
  switch (format) {
    case 'full':
      return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
    case 'short':
      return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
    case 'month':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    default:
      return d.toLocaleDateString('ko-KR')
  }
}

/**
 * 날짜를 API 형식으로 변환
 * @param date - 날짜
 * @returns YYYY-MM-DD 형식 문자열
 */
export const toApiDateFormat = (date: Date | string | null | undefined): string => {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

