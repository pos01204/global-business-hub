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
  badge?: number | string
  external?: boolean
}

// 네비게이션 구조 (Phase 4: 허브 구조 지원)
interface NavSubGroup {
  title: string
  isHub?: boolean
  items: NavItem[]
}

interface ExtendedNavGroup {
  title: string
  items?: NavItem[]
  subGroups?: NavSubGroup[]
}

// ============================================================
// IA 개편안 Phase 2: 허브 단위 메뉴 구조
// ============================================================
const navGroups: ExtendedNavGroup[] = [
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
    title: '📊 성과 분석 허브',
    items: [
      { href: '/analytics', label: '성과 분석 허브', icon: '📈' },
      // 주문 패턴, 쿠폰 효과는 성과 분석 허브 내 탭으로 통합됨 (IA 개편안 Phase 1)
    ],
  },
  {
    title: '👥 고객 인사이트 허브',
    items: [
      { href: '/customer-analytics', label: '고객 분석', icon: '👥' },
      { href: '/customer-360', label: '고객 360° 뷰', icon: '🔄' },
      { href: '/review-analytics', label: '리뷰 분석', icon: '⭐' },
      // 리뷰 목록 기능은 리뷰 분석 내 탭으로 통합 예정 (IA 개편안 Phase 4)
    ],
  },
  {
    title: '🎨 작가 & 상품 분석',
    items: [
      { href: '/artist-analytics', label: '작가 분석', icon: '👨‍🎨' },
      // 향후: 상품 분석 페이지 추가 예정
    ],
  },
  {
    title: '💰 재무 분석',
    items: [
      { href: '/cost-analysis', label: '비용 & 손익', icon: '💰' },
    ],
  },
  {
    title: '🧠 경영 인사이트',
    items: [
      { href: '/business-brain', label: 'Business Brain', icon: '🧠' },
    ],
  },
  {
    title: '🛠️ 도구',
    items: [
      { href: '/marketer', label: '퍼포먼스 마케터', icon: '🎯' },
      { href: '/coupon-generator', label: '쿠폰 생성/발급', icon: '🎟️' },
      { href: '/chat', label: 'AI 어시스턴트', icon: '🤖' },
    ],
  },
]

// 네비게이션 아이템 컴포넌트
function NavItemComponent({ 
  item, 
  pathname, 
  isCollapsed 
}: { 
  item: NavItem
  pathname: string | null
  isCollapsed: boolean 
}) {
  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
  
  return (
    <li>
      <Link
        href={item.href}
        className={`
          relative flex items-center gap-3 px-3 py-2.5 rounded-lg
          transition-all duration-200
          ${isActive
            ? 'bg-orange-50 dark:bg-orange-900/20 text-[#F78C3A] font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-[#F78C3A] before:rounded-r-full'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
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
              <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            )}
            {item.badge && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                item.badge === 'NEW' 
                  ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
                  : 'bg-red-500 text-white'
              }`}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    </li>
  )
}

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
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          {/* 로고 영역 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
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
                    <span className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      i<span className="text-idus-500">d</span>us
                    </span>
                    <span className="text-[15px] font-medium text-slate-500 dark:text-slate-400">Global</span>
                  </div>
                </div>
              )}
            </Link>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500"
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
                  <h2 className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {group.title}
                  </h2>
                )}
                
                {/* 일반 아이템 렌더링 */}
                {group.items && (
                  <ul className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavItemComponent key={item.href} item={item} pathname={pathname} isCollapsed={isCollapsed} />
                    ))}
                  </ul>
                )}
                
                {/* 서브그룹(허브) 렌더링 */}
                {group.subGroups && group.subGroups.map((subGroup, subIndex) => (
                  <div key={subGroup.title} className={subIndex > 0 ? 'mt-3' : ''}>
                    {!isCollapsed && (
                      <h3 className={`px-3 mb-1.5 text-[10px] font-medium tracking-wide ${
                        subGroup.isHub 
                          ? 'text-violet-500 dark:text-violet-400' 
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {subGroup.title}
                      </h3>
                    )}
                    <ul className="space-y-0.5">
                      {subGroup.items.map((item) => (
                        <NavItemComponent key={item.href} item={item} pathname={pathname} isCollapsed={isCollapsed} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </nav>

          {/* 하단 */}
          {!isCollapsed && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">시스템 정상</span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">v2.0</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 모바일 메뉴 버튼 - 이제 BottomNavigation으로 대체되어 숨김 */}
      <button
        onClick={() => setIsCollapsed(false)}
        className={`
          fixed top-4 left-4 z-30 hidden p-2.5
          bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm
          text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800
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
