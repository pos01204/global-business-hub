'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

// 브랜드 리소스 경로
const BRAND_PATH = '/brand/Rebranding Design Resources/Rebranding Design Resources'

interface NavItem {
  href: string
  label: string
  icon: string
  badge?: number
  external?: boolean
}

interface NavGroup {
  title: string
  items: NavItem[]
}

// 심플한 네비게이션 구조
const navGroups: NavGroup[] = [
  {
    title: '홈',
    items: [
      { href: '/dashboard', label: '대시보드', icon: '📊' },
    ],
  },
  {
    title: '물류 운영',
    items: [
      { href: '/unreceived', label: '미입고 관리', icon: '🚨' },
      { href: '/logistics', label: '물류 추적', icon: '🚚' },
      { href: '/control-tower', label: '물류 관제 센터', icon: '📡' },
      { href: '/settlement', label: '물류비 정산', icon: '💵' },
    ],
  },
  {
    title: '업무 지원',
    items: [
      { href: '/qc', label: 'QC 관리', icon: '✅' },
      { href: '/sopo-receipt', label: '소포수령증', icon: '📄' },
      { href: '/lookup', label: '통합 검색', icon: '🔍' },
    ],
  },
  {
    title: '분석',
    items: [
      { href: '/analytics', label: '성과 분석', icon: '📈' },
      { href: '/customer-analytics', label: '고객 분석', icon: '👥' },
      { href: '/artist-analytics', label: '작가 분석', icon: '👨‍🎨' },
      { href: '/cost-analysis', label: '비용 & 손익', icon: '💰' },
    ],
  },
  {
    title: '고객 인사이트',
    items: [
      { href: '/reviews', label: '고객 리뷰', icon: '⭐' },
    ],
  },
  {
    title: '도구',
    items: [
      { href: '/marketer', label: '퍼포먼스 마케터', icon: '🎯' },
      { href: '/chat', label: 'AI 어시스턴트', icon: '🤖' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* 모바일 오버레이 */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          transition-all duration-300 ease-out
          ${isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
          ${isCollapsed ? 'w-0' : 'w-[260px]'}
          lg:static lg:z-auto
        `}
      >
        <div className="flex flex-col h-full bg-white border-r border-slate-200">
          {/* 로고 영역 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-lg overflow-hidden">
                <Image
                  src={`${BRAND_PATH}/02. Profile/appicon-1024.png`}
                  alt="idus"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {!isCollapsed && (
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[17px] font-bold tracking-tight text-slate-900">
                      i<span className="text-idus-500">d</span>us
                    </span>
                    <span className="text-[15px] font-medium text-slate-500">Global</span>
                  </div>
                </div>
              )}
            </Link>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 네비게이션 */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {navGroups.map((group, groupIndex) => (
              <div key={group.title} className={groupIndex > 0 ? 'mt-6' : ''}>
                {!isCollapsed && (
                  <h2 className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {group.title}
                  </h2>
                )}
                
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg
                            transition-colors duration-150
                            ${isActive
                              ? 'bg-slate-100 text-slate-900'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }
                          `}
                        >
                          <span className="text-base flex-shrink-0">{item.icon}</span>
                          {!isCollapsed && (
                            <>
                              <span className={`flex-1 text-sm ${isActive ? 'font-medium' : ''}`}>
                                {item.label}
                              </span>
                              {item.external && (
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              )}
                              {item.badge && (
                                <span className="bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
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
              </div>
            ))}
          </nav>

          {/* 하단 */}
          {!isCollapsed && (
            <div className="p-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs text-slate-500">시스템 정상</span>
                </div>
                <span className="text-xs text-slate-400">v2.0</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 모바일 메뉴 버튼 */}
      <button
        onClick={() => setIsCollapsed(false)}
        className={`
          fixed top-4 left-4 z-30 lg:hidden p-2.5
          bg-white border border-slate-200 rounded-lg shadow-sm
          text-slate-600 hover:bg-slate-50
          ${!isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          transition-opacity duration-200
        `}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  )
}
