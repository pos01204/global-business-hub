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
  icon: string
  items: NavItem[]
}

// 그룹화된 네비게이션 구조
const navGroups: NavGroup[] = [
  {
    title: '홈',
    icon: '🏠',
    items: [
      { href: '/dashboard', label: '대시보드', icon: '📊' },
    ],
  },
  {
    title: '물류 운영',
    icon: '📦',
    items: [
      { href: '/unreceived', label: '미입고 관리', icon: '🚨' },
      { href: '/logistics', label: '물류 추적', icon: '🚚' },
      { href: '/control-tower', label: '물류 관제 센터', icon: '📡' },
      { href: '/settlement', label: '물류비 정산', icon: '💵' },
    ],
  },
  {
    title: '업무 지원',
    icon: '🔧',
    items: [
      { href: '/qc', label: 'QC 관리', icon: '✅' },
      { href: '/sopo-receipt', label: '소포수령증', icon: '📄' },
      { href: '/lookup', label: '통합 검색', icon: '🔍' },
    ],
  },
  {
    title: '분석 & 전략',
    icon: '📈',
    items: [
      { href: '/analytics', label: '성과 분석', icon: '📈' },
      { href: '/cost-analysis', label: '비용 & 손익', icon: '💰' },
      { href: '/reviews', label: '고객 리뷰', icon: '⭐' },
    ],
  },
  {
    title: '외부 도구',
    icon: '🔗',
    items: [
      { href: '/marketer', label: '퍼포먼스 마케터', icon: '🎯', external: true },
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          transition-all duration-300 ease-in-out
          ${isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
          ${isCollapsed ? 'w-0' : 'w-[280px]'}
          lg:static lg:z-auto
        `}
      >
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-idus-50/30 border-r border-gray-100 shadow-xl lg:shadow-none">
          {/* 로고 영역 */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-3 group">
              {/* idus 앱 아이콘 */}
              <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-orange group-hover:shadow-orange-lg transition-all duration-300">
                <Image
                  src={`${BRAND_PATH}/02. Profile/appicon-1024.png`}
                  alt="idus"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {!isCollapsed && (
                <div className="animate-fade-in">
                  {/* idus 로고 텍스트 */}
                  <div className="flex items-baseline">
                    <span className="text-[19px] font-black tracking-tight">
                      <span className="text-gray-900">i</span>
                      <span className="text-idus-500">d</span>
                      <span className="text-gray-900">us</span>
                    </span>
                    <span className="text-[17px] font-semibold text-gray-500 ml-1.5">Global</span>
                  </div>
                  <p className="text-[10px] text-idus-500 font-semibold tracking-[0.2em] uppercase">
                    Operations Hub
                  </p>
                </div>
              )}
            </Link>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="lg:hidden p-2 hover:bg-idus-50 rounded-lg transition-colors text-gray-500 hover:text-idus-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 네비게이션 */}
          <nav className="flex-1 overflow-y-auto py-5 px-3">
            {navGroups.map((group, groupIndex) => (
              <div key={group.title} className={groupIndex > 0 ? 'mt-6' : ''}>
                {/* 그룹 헤더 */}
                {!isCollapsed && (
                  <div className="px-3 mb-2">
                    <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="text-sm">{group.icon}</span>
                      <span>{group.title}</span>
                    </h2>
                  </div>
                )}
                
                {/* 그룹 아이템 */}
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`
                            relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                            transition-all duration-200 group
                            ${
                              isActive
                                ? 'bg-gradient-to-r from-idus-500 to-idus-600 text-white shadow-orange'
                                : 'text-gray-600 hover:bg-idus-50 hover:text-idus-600'
                            }
                          `}
                        >
                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-sm"></div>
                          )}
                          
                          <span className={`text-lg flex-shrink-0 transition-transform duration-200 ${!isActive && 'group-hover:scale-110'}`}>
                            {item.icon}
                          </span>
                          {!isCollapsed && (
                            <>
                              <span className={`flex-1 text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                                {item.label}
                              </span>
                              {item.external && (
                                <svg className={`w-3.5 h-3.5 ${isActive ? 'text-white/70' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              )}
                              {item.badge && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
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

          {/* 하단 정보 */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-100">
              {/* 시스템 상태 카드 */}
              <div className="bg-gradient-to-br from-idus-50 to-white rounded-xl p-4 border border-idus-100/50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">시스템 상태</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50"></div>
                    <span className="text-xs font-bold text-emerald-600">정상</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden shadow-sm">
                    <Image
                      src={`${BRAND_PATH}/02. Profile/thm_idus_512.png`}
                      alt="idus"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Global Ops</p>
                    <p className="text-[11px] text-gray-500">v2.0 · idus Design</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 모바일 메뉴 버튼 */}
      <button
        onClick={() => setIsCollapsed(false)}
        className={`
          fixed top-4 left-4 z-30 lg:hidden p-3 
          bg-gradient-to-br from-idus-500 to-idus-600 
          rounded-xl shadow-orange text-white
          hover:shadow-orange-lg transition-all duration-200
          ${!isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  )
}
