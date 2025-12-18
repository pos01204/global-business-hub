/**
 * 토스트 알림 유틸리티
 * sonner 라이브러리 기반 통합 알림 시스템
 */

import { toast } from 'sonner'

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

