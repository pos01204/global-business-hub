'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const featureCards = [
  {
    href: '/dashboard',
    icon: '📊',
    title: '메인 대시보드',
    description: '핵심 성과 지표 및 트렌드 분석',
    gradient: 'from-blue-500 to-cyan-500',
    color: 'blue',
  },
  {
    href: '/unreceived',
    icon: '🚨',
    title: '미입고 관리',
    description: '미입고 작품 현황 및 관리',
    gradient: 'from-red-500 to-pink-500',
    color: 'red',
  },
  {
    href: '/logistics',
    icon: '🚚',
    title: '물류 추적',
    description: '글로벌 물류 추적 및 현황',
    gradient: 'from-orange-500 to-amber-500',
    color: 'orange',
  },
  {
    href: '/analytics',
    icon: '📈',
    title: '성과 분석',
    description: '상세 성과 분석 및 리포트',
    gradient: 'from-purple-500 to-indigo-500',
    color: 'purple',
  },
  {
    href: '/control-tower',
    icon: '📡',
    title: '물류 관제 센터',
    description: '실시간 물류 파이프라인 현황',
    gradient: 'from-green-500 to-emerald-500',
    color: 'green',
  },
  {
    href: '/lookup',
    icon: '🔍',
    title: '통합 검색',
    description: '주문번호, 송장번호, 사용자 ID 등 통합 검색',
    gradient: 'from-teal-500 to-cyan-500',
    color: 'teal',
  },
  {
    href: '/chat',
    icon: '💬',
    title: 'AI 어시스턴트',
    description: '자연어 기반 데이터 분석',
    gradient: 'from-violet-500 to-purple-500',
    color: 'violet',
  },
]

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // 메인 대시보드로 리다이렉트
    router.replace('/dashboard')
  }, [router])

  // 리다이렉트 중 로딩 표시
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>대시보드로 이동 중...</p>
      </div>
    </div>
  )
}

