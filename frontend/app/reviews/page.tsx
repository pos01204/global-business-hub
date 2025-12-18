'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// IA 개편안 11.4 - /reviews 페이지를 /review-analytics?tab=list로 리다이렉트
export default function ReviewsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/review-analytics?tab=list')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-500 dark:text-slate-400">리뷰 분석 페이지로 이동 중...</p>
      </div>
    </div>
  )
}


