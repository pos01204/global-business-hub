'use client'

interface PageHeaderProps {
  title: string
  description: string
  icon: string
  variant?: 'default' | 'logistics' | 'analytics' | 'qc' | 'cost'
  children?: React.ReactNode
}

// idus 스타일 장식 패턴
function DecorationPattern({ variant }: { variant: string }) {
  // idus 브랜드 스타일의 추상적 장식
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 큰 원 장식 */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full"></div>
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full"></div>
      
      {/* 작은 원 패턴 */}
      <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-white/20 rounded-full"></div>
      <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white/15 rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/2 w-4 h-4 bg-white/10 rounded-full"></div>
      
      {/* 라인 장식 - idus 스타일 */}
      <svg 
        className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20" 
        width="120" 
        height="120" 
        viewBox="0 0 120 120"
      >
        {/* d 모양 추상화 */}
        <circle cx="45" cy="70" r="30" stroke="white" strokeWidth="3" fill="none" />
        <path d="M45 20 L45 100" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M45 35 L65 55 L45 55" fill="white" opacity="0.5" />
      </svg>
      
      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10"></div>
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
  return (
    <div className="relative bg-gradient-to-r from-idus-500 to-idus-600 rounded-2xl p-6 mb-6 overflow-hidden shadow-orange">
      <DecorationPattern variant={variant} />
      
      <div className="relative flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">{icon}</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{title}</h1>
            <p className="text-idus-100 text-sm font-medium">{description}</p>
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
      className="px-4 py-2 bg-white/95 backdrop-blur rounded-xl text-sm font-semibold text-idus-600 hover:bg-white transition-colors shadow-lg"
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
    <div className="flex items-center gap-3 bg-white/95 backdrop-blur rounded-xl px-4 py-2.5 shadow-lg">
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

