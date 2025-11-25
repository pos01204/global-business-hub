'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: string
  badge?: number
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: '메인 대시보드', icon: '📊' },
  { href: '/unreceived', label: '미입고 관리', icon: '🚨' },
  { href: '/logistics', label: '물류 추적', icon: '🚚' },
  { href: '/control-tower', label: '물류 관제 센터', icon: '📡' },
  { href: '/analytics', label: '성과 분석', icon: '📈' },
  { href: '/lookup', label: '통합 검색', icon: '🔍' },
  { href: '/marketer', label: '퍼포먼스 마케터', icon: '📝' },
  { href: '/chat', label: 'AI 어시스턴트', icon: '💬' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* 모바일 오버레이 */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50
          transition-all duration-300 ease-in-out
          ${isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
          ${isCollapsed ? 'w-0' : 'w-64'}
          lg:static lg:z-auto
          shadow-lg lg:shadow-none
        `}
      >
        <div className="flex flex-col h-full">
          {/* 로고 영역 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white text-xl font-bold">GB</span>
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-gray-900">글로벌 비즈니스</h1>
                  <p className="text-xs text-gray-500">통합 허브</p>
                </div>
              )}
            </Link>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 네비게이션 */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg
                        transition-all duration-200
                        ${
                          isActive
                            ? 'bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-semibold shadow-sm'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
                        }
                      `}
                    >
                      <span className="text-xl flex-shrink-0">{item.icon}</span>
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* 하단 정보 */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-200">
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">시스템 상태</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-900">정상 운영 중</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 모바일 메뉴 버튼 */}
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  )
}


