/**
 * 토스트 알림 유틸리티
 * sonner 라이브러리 기반 통합 알림 시스템
 * 브랜드 이모션 아이콘 지원 추가
 */

import { toast } from 'sonner'
import { BRAND_ASSETS, getEmotionByStatus } from '@/lib/brand-assets'

// 브랜드 이모션 아이콘 요소 생성 (JSX가 아닌 순수 함수)
const createBrandIconElement = (status: 'success' | 'error' | 'warning' | 'info') => {
  const iconSrc = getEmotionByStatus(status)
  const img = document.createElement('img')
  img.src = iconSrc
  img.width = 20
  img.height = 20
  img.style.objectFit = 'contain'
  return img
}

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, { description })
  },

  error: (message: string, description?: string) => {
    toast.error(message, { description })
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, { description })
  },

  info: (message: string, description?: string) => {
    toast.info(message, { description })
  },

  loading: (message: string) => {
    return toast.loading(message)
  },

  promise: <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) => {
    return toast.promise(promise, messages)
  },

  action: (message: string, action: { label: string; onClick: () => void }) => {
    toast(message, {
      action: {
        label: action.label,
        onClick: action.onClick,
      },
    })
  },

  dismiss: (id?: string | number) => {
    toast.dismiss(id)
  },

  // 커스텀 토스트 (JSX 지원)
  custom: (message: string, options?: {
    description?: string
    duration?: number
    icon?: React.ReactNode
  }) => {
    toast(message, options)
  },
}

// 브랜드 이모션 아이콘 경로 export (React 컴포넌트에서 사용)
export const TOAST_BRAND_ICONS = {
  success: BRAND_ASSETS.emotions.happy,
  error: BRAND_ASSETS.emotions.sad,
  warning: BRAND_ASSETS.emotions.cheer,
  info: BRAND_ASSETS.emotions.like,
} as const
