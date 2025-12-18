'use client'

import Image from 'next/image'
import { getHeaderIllust, BRAND_ASSETS } from '@/lib/brand-assets'

interface PageHeaderProps {
  title: string
  description: string
  icon: string
  /** 페이지 식별자 (일러스트 매핑용) */
  pageId?: string
  variant?: 'default' | 'logistics' | 'analytics' | 'qc' | 'cost'
  children?: React.ReactNode
}

// idus 스타일 장식 패턴 + 브랜드 일러스트
function DecorationPattern({ variant, pageId }: { variant: string; pageId?: string }) {
  // 페이지별 일러스트 가져오기
  const illustSrc = pageId ? getHeaderIllust(pageId) : BRAND_ASSETS.lines.byType.analytics

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* 큰 원 장식 */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full"></div>
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 dark:bg-white/[0.02] rounded-full"></div>
      
      {/* 작은 원 패턴 */}
      <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-white/20 dark:bg-white/10 rounded-full"></div>
      <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white/15 dark:bg-white/[0.08] rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/2 w-4 h-4 bg-white/10 dark:bg-white/5 rounded-full"></div>
      
      {/* 브랜드 일러스트 */}
      <div className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-24 h-24 lg:w-32 lg:h-32 opacity-20 dark:opacity-15">
        <Image
          src={illustSrc}
          alt=""
          fill
          className="object-contain dark:brightness-110"
        />
      </div>
      
      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10 dark:to-black/20"></div>
    </div>
  )
}

// 통합 페이지 헤더 컴포넌트
export default function PageHeader({
  title,
  description,
  icon,
  pageId,
  variant = 'default',
  children
}: PageHeaderProps) {
  return (
    <div className="relative bg-gradient-to-r from-idus-500 to-idus-600 dark:from-orange-700 dark:to-orange-800 rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden shadow-lg dark:shadow-none">
      <DecorationPattern variant={variant} pageId={pageId} />
      
      <div className="relative flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 dark:bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg dark:shadow-none">
            <span className="text-2xl lg:text-3xl">{icon}</span>
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">{title}</h1>
            <p className="text-idus-100 dark:text-orange-200/80 text-xs lg:text-sm font-medium">{description}</p>
          </div>
        </div>
        
        {children && (
          <div className="flex items-center gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

// 액션 버튼 컴포넌트 (헤더 내 사용)
export function HeaderAction({ 
  children, 
  onClick 
}: { 
  children: React.ReactNode
  onClick?: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-white/95 dark:bg-white/90 backdrop-blur rounded-xl text-sm font-semibold text-idus-600 hover:bg-white transition-colors shadow-lg"
    >
      {children}
    </button>
  )
}

// 날짜 필터 컴포넌트 (헤더 내 사용)
export function HeaderDateFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onApply
}: {
  startDate: string
  endDate: string
  onStartChange: (date: string) => void
  onEndChange: (date: string) => void
  onApply: () => void
}) {
  return (
    <div className="flex items-center gap-3 bg-white/95 dark:bg-white/90 backdrop-blur rounded-xl px-4 py-2.5 shadow-lg">
      <span className="text-idus-500 text-sm">📅</span>
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        className="border-0 bg-transparent text-sm font-medium text-gray-700 focus:outline-none w-32"
      />
      <span className="text-gray-300">~</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        className="border-0 bg-transparent text-sm font-medium text-gray-700 focus:outline-none w-32"
      />
      <button
        onClick={onApply}
        className="ml-2 px-4 py-1.5 bg-idus-500 text-white text-sm font-semibold rounded-lg hover:bg-idus-600 transition-colors shadow-sm"
      >
        조회
      </button>
    </div>
  )
}
