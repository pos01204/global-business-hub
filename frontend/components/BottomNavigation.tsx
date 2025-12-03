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

const moreNavItems = [
  { href: '/logistics', icon: '🚚', label: '물류 추적' },
  { href: '/settlement', icon: '💵', label: '물류비 정산' },
  { href: '/analytics', icon: '📈', label: '성과 분석' },
  { href: '/artist-analytics', icon: '👨‍🎨', label: '작가 분석' },
  { href: '/chat', icon: '🤖', label: 'AI 어시스턴트' },
  { href: '/coupon-generator', icon: '🎟️', label: '쿠폰 생성' },
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
            className="absolute bottom-16 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-2xl p-4 animate-slideUp safe-area-pb"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4" />
            <div className="grid grid-cols-3 gap-3">
              {moreNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className="flex flex-col items-center p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{item.label}</span>
                </Link>
              ))}
            </div>
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
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
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
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
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
