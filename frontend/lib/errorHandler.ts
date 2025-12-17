// frontend/lib/errorHandler.ts
// API 에러 핸들링 유틸리티

import axios, { AxiosError } from 'axios'

/**
 * API 에러 인터페이스
 */
export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: Record<string, unknown>
}

/**
 * API 에러 응답 타입
 */
interface ApiErrorResponse {
  message?: string
  error?: string
  code?: string
  details?: Record<string, unknown>
}

/**
 * Axios 에러를 ApiError로 변환
 * @param error - 에러 객체
 * @returns ApiError 객체
 */
export const handleApiError = (error: unknown): ApiError => {
  // Axios 에러인 경우
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>
    
    // 네트워크 에러
    if (!axiosError.response) {
      return {
        message: '네트워크 연결을 확인해주세요.',
        code: 'NETWORK_ERROR',
      }
    }
    
    // 서버 응답 에러
    const { status, data } = axiosError.response
    
    return {
      message: data?.message || data?.error || getDefaultErrorMessage(status),
      code: data?.code || `HTTP_${status}`,
      status,
      details: data?.details,
    }
  }
  
  // 일반 Error 객체
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    }
  }
  
  // 그 외
  return {
    message: '알 수 없는 오류가 발생했습니다.',
    code: 'UNKNOWN_ERROR',
  }
}

/**
 * HTTP 상태 코드에 따른 기본 에러 메시지
 */
const getDefaultErrorMessage = (status: number): string => {
  switch (status) {
    case 400:
      return '잘못된 요청입니다.'
    case 401:
      return '인증이 필요합니다.'
    case 403:
      return '접근 권한이 없습니다.'
    case 404:
      return '요청한 리소스를 찾을 수 없습니다.'
    case 408:
      return '요청 시간이 초과되었습니다.'
    case 429:
      return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    case 500:
      return '서버 내부 오류가 발생했습니다.'
    case 502:
      return '서버 연결에 실패했습니다.'
    case 503:
      return '서비스를 일시적으로 사용할 수 없습니다.'
    case 504:
      return '서버 응답 시간이 초과되었습니다.'
    default:
      return `오류가 발생했습니다. (${status})`
  }
}

/**
 * 에러 메시지 표시용 유틸리티
 */
export const getErrorMessage = (error: unknown): string => {
  const apiError = handleApiError(error)
  return apiError.message
}

/**
 * 에러가 특정 상태 코드인지 확인
 */
export const isHttpError = (error: unknown, status: number): boolean => {
  if (axios.isAxiosError(error)) {
    return error.response?.status === status
  }
  return false
}

/**
 * 네트워크 에러인지 확인
 */
export const isNetworkError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    return !error.response
  }
  return false
}

/**
 * 인증 에러인지 확인 (401, 403)
 */
export const isAuthError = (error: unknown): boolean => {
  return isHttpError(error, 401) || isHttpError(error, 403)
}

/**
 * 서버 에러인지 확인 (5xx)
 */
export const isServerError = (error: unknown): boolean => {
  if (axios.isAxiosError(error) && error.response) {
    return error.response.status >= 500
  }
  return false
}

/**
 * 에러 로깅 (개발 환경에서만)
 */
export const logError = (error: unknown, context?: string): void => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` - ${context}` : ''}]`, error)
  }
}

