'use client'

interface PageHeaderProps {
  title: string
  description: string
  icon: string
  /** 
   * 메뉴 카테고리별 색상 variant
   * - default: idus 오렌지 (대시보드)
   * - logistics: 그린/티얼 (물류 운영)
   * - support: 뉴트럴 블루/그레이 (업무 지원)
   * - analytics: 보라/인디고 (성과 분석 허브)
   * - customer: 블루/시안 (고객 인사이트 허브)
   * - artist: 보라/로즈 (작가 & 상품 분석)
   * - finance: 그린/에메랄드 (재무 분석)
   * - insight: 다크블루/네이비 (경영 인사이트)
   * - tools: 뉴트럴 화이트/그레이 + idus 포인트 (도구)
   */
  variant?: 'default' | 'logistics' | 'support' | 'analytics' | 'customer' | 'artist' | 'finance' | 'insight' | 'tools'
  children?: React.ReactNode
}

// 메뉴 카테고리별 색상 매핑
const variantStyles = {
  default: {
    gradient: 'from-idus-500 to-idus-600 dark:from-orange-700 dark:to-orange-800',
    descColor: 'text-orange-100 dark:text-orange-200/80',
  },
  logistics: {
    gradient: 'from-teal-500 to-emerald-600 dark:from-teal-700 dark:to-emerald-800',
    descColor: 'text-teal-100 dark:text-teal-200/80',
  },
  support: {
    gradient: 'from-slate-500 to-slate-600 dark:from-slate-700 dark:to-slate-800',
    descColor: 'text-slate-200 dark:text-slate-300/80',
  },
  analytics: {
    gradient: 'from-violet-500 to-indigo-600 dark:from-violet-700 dark:to-indigo-800',
    descColor: 'text-violet-100 dark:text-violet-200/80',
  },
  customer: {
    gradient: 'from-sky-500 to-cyan-600 dark:from-sky-700 dark:to-cyan-800',
    descColor: 'text-sky-100 dark:text-sky-200/80',
  },
  artist: {
    gradient: 'from-purple-500 to-rose-500 dark:from-purple-700 dark:to-rose-700',
    descColor: 'text-purple-100 dark:text-purple-200/80',
  },
  finance: {
    gradient: 'from-emerald-500 to-green-600 dark:from-emerald-700 dark:to-green-800',
    descColor: 'text-emerald-100 dark:text-emerald-200/80',
  },
  insight: {
    gradient: 'from-blue-700 to-slate-800 dark:from-blue-900 dark:to-slate-900',
    descColor: 'text-blue-200 dark:text-blue-300/80',
  },
  tools: {
    gradient: 'from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800',
    descColor: 'text-slate-200 dark:text-slate-300/80',
  },
}

// idus 스타일 장식 패턴 (일러스트 제거, 원 패턴만 유지)
function DecorationPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* 큰 원 장식 */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full"></div>
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 dark:bg-white/[0.02] rounded-full"></div>
      
      {/* 작은 원 패턴 */}
      <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-white/20 dark:bg-white/10 rounded-full"></div>
      <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white/15 dark:bg-white/[0.08] rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/2 w-4 h-4 bg-white/10 dark:bg-white/5 rounded-full"></div>
      
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
  variant = 'default',
  children
}: PageHeaderProps) {
  const styles = variantStyles[variant]
  
  return (
    <div className={`relative bg-gradient-to-r ${styles.gradient} rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden shadow-lg dark:shadow-none`}>
      <DecorationPattern />
      
      <div className="relative flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 dark:bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg dark:shadow-none">
            <span className="text-2xl lg:text-3xl">{icon}</span>
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">{title}</h1>
            <p className={`${styles.descColor} text-xs lg:text-sm font-medium`}>{description}</p>
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
