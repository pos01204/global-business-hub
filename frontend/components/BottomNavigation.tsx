'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const mainNavItems = [
  { href: '/dashboard', icon: '🏠', label: '홈' },
  { href: '/qc', icon: '✅', label: 'QC' },
  { href: '/unreceived', icon: '🚨', label: '미입고' },
  { href: '/lookup', icon: '🔍', label: '검색' },
]

// 카테고리별 그룹화된 더보기 메뉴
const moreNavGroups = [
  {
    title: '물류 운영',
    items: [
      { href: '/logistics', icon: '🚚', label: '물류 추적' },
      { href: '/control-tower', icon: '📡', label: '물류 관제' },
      { href: '/settlement', icon: '💵', label: '물류비 정산' },
    ],
  },
  {
    title: '업무 지원',
    items: [
      { href: '/sopo-receipt', icon: '📄', label: '소포수령증' },
    ],
  },
  {
    title: '분석',
    items: [
      { href: '/analytics', icon: '📈', label: '성과 분석' },
      { href: '/customer-analytics', icon: '👥', label: '고객 분석' },
      { href: '/artist-analytics', icon: '👨‍🎨', label: '작가 분석' },
      { href: '/cost-analysis', icon: '💰', label: '비용 & 손익' },
    ],
  },
  {
    title: '고객 인사이트',
    items: [
      { href: '/reviews', icon: '⭐', label: '고객 리뷰' },
    ],
  },
  {
    title: '도구',
    items: [
      { href: '/marketer', icon: '🎯', label: '마케터' },
      { href: '/coupon-generator', icon: '🎟️', label: '쿠폰 생성' },
      { href: '/chat', icon: '🤖', label: 'AI 어시스턴트' },
    ],
  },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      {/* 더보기 메뉴 오버레이 */}
      {showMore && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setShowMore(false)}
        >
          <div 
            className="absolute bottom-16 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-2xl p-4 animate-slideUp safe-area-pb max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4" />
            
            {moreNavGroups.map((group) => (
              <div key={group.title} className="mb-4 last:mb-0">
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
                  {group.title}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMore(false)}
                        className={`flex flex-col items-center p-3 rounded-xl min-h-[72px] transition-colors ${
                          isActive 
                            ? 'bg-orange-50 dark:bg-orange-900/20 text-[#F78C3A]' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-2xl mb-1">{item.icon}</span>
                        <span className={`text-xs text-center leading-tight ${
                          isActive ? 'text-[#F78C3A] font-medium' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {item.label}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 네비게이션 바 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 lg:hidden safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors ${
                  isActive 
                    ? 'text-[#F78C3A]' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <span className="text-xl mb-0.5">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors ${
              showMore ? 'text-[#F78C3A]' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span className="text-xl mb-0.5">⋯</span>
            <span className="text-[10px] font-medium">더보기</span>
          </button>
        </div>
      </nav>
    </>
  )
}

export default BottomNavigation
