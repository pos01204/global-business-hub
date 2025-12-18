'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 리다이렉트 전용 페이지 (IA 개편안 Phase 1)
// 기존 /coupon-analytics → /analytics?tab=coupon 로 이동
export default function CouponAnalyticsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/analytics?tab=coupon')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-idus-500 mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">성과 분석 허브로 이동 중...</p>
      </div>
    </div>
  )
}


