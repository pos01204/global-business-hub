'use client'

import Image from 'next/image'

// 브랜드 리소스 경로
const BRAND_PATH = '/brand/Rebranding Design Resources/Rebranding Design Resources'

// 라인 일러스트 목록
const LINE_ILLUSTS = [
  'line01.png', 'line02.png', 'line03.png', 'line04.png',
  'line05.png', 'line06.png', 'line07.png', 'line08.png',
  'line09.png', 'line10.png', 'line11.png', 'line12.png',
]

// 일러스트 타입별 매핑
const ILLUST_MAP: Record<string, string> = {
  search: 'line01.png',      // 검색
  empty: 'line02.png',       // 빈 상태
  loading: 'line03.png',     // 로딩
  success: 'line04.png',     // 성공
  error: 'line05.png',       // 에러
  analytics: 'line06.png',   // 분석
  shipping: 'line07.png',    // 배송
  package: 'line08.png',     // 패키지
  document: 'line09.png',    // 문서
  settings: 'line10.png',    // 설정
  notification: 'line11.png', // 알림
  complete: 'line12.png',    // 완료
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

// idus 브랜드 로딩 스피너
export function LoadingSpinner({ size = 'md', text = '로딩 중...' }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: { icon: 40, text: 'text-sm' },
    md: { icon: 64, text: 'text-base' },
    lg: { icon: 96, text: 'text-lg' },
  }

  const { icon, text: textSize } = sizeMap[size]

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative" style={{ width: icon, height: icon }}>
        {/* 회전하는 링 */}
        <div 
          className="absolute inset-0 rounded-full border-4 border-idus-100 border-t-idus-500 animate-spin"
          style={{ animationDuration: '1s' }}
        ></div>
        {/* 중앙 아이콘 */}
        <div className="absolute inset-2 rounded-full overflow-hidden">
          <Image
            src={`${BRAND_PATH}/02. Profile/appicon-1024.png`}
            alt="idus"
            fill
            className="object-cover"
          />
        </div>
      </div>
      {text && (
        <p className={`mt-4 text-gray-500 ${textSize} font-medium`}>{text}</p>
      )}
    </div>
  )
}

interface EmptyStateProps {
  type?: keyof typeof ILLUST_MAP
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

// idus 브랜드 빈 상태 컴포넌트
export function EmptyState({ 
  type = 'empty', 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  const illustFile = ILLUST_MAP[type] || ILLUST_MAP.empty

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* 라인 일러스트 */}
      <div className="relative w-48 h-48 mb-6 opacity-80">
        <Image
          src={`${BRAND_PATH}/06. Line illust/${illustFile}`}
          alt={title}
          fill
          className="object-contain"
        />
      </div>
      
      {/* 텍스트 */}
      <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">{title}</h3>
      {description && (
        <p className="text-gray-500 text-center max-w-md mb-6">{description}</p>
      )}
      
      {/* 액션 버튼 */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-gradient-to-r from-idus-500 to-idus-600 text-white font-semibold rounded-xl hover:shadow-orange transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

// idus 브랜드 에러 상태 컴포넌트
export function ErrorState({ 
  title = '오류가 발생했습니다', 
  message, 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative w-40 h-40 mb-6 opacity-70">
        <Image
          src={`${BRAND_PATH}/06. Line illust/line05.png`}
          alt="Error"
          fill
          className="object-contain"
        />
      </div>
      
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md text-center">
        <h3 className="text-lg font-bold text-red-800 mb-2">{title}</h3>
        <p className="text-red-600 text-sm mb-4">{message}</p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        )}
      </div>
    </div>
  )
}

interface SuccessStateProps {
  title: string
  description?: string
  onClose?: () => void
}

// idus 브랜드 성공 상태 컴포넌트
export function SuccessState({ title, description, onClose }: SuccessStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative w-32 h-32 mb-4">
        <Image
          src={`${BRAND_PATH}/06. Line illust/line04.png`}
          alt="Success"
          fill
          className="object-contain"
        />
      </div>
      
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 max-w-md text-center">
        <h3 className="text-lg font-bold text-emerald-800 mb-2">{title}</h3>
        {description && (
          <p className="text-emerald-600 text-sm mb-4">{description}</p>
        )}
        
        {onClose && (
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            확인
          </button>
        )}
      </div>
    </div>
  )
}

// idus 브랜드 카드 컴포넌트
export function BrandCard({ 
  children, 
  className = '',
  variant = 'default'
}: { 
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'highlight' | 'gradient'
}) {
  const variantStyles = {
    default: 'bg-white border border-gray-100',
    highlight: 'bg-gradient-to-br from-idus-50 to-white border border-idus-100',
    gradient: 'bg-gradient-to-r from-idus-500 to-idus-600 text-white border-none',
  }

  return (
    <div className={`rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  )
}

// idus 브랜드 배지 컴포넌트
export function BrandBadge({
  children,
  variant = 'primary'
}: {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const variantStyles = {
    primary: 'bg-idus-50 text-idus-600 border-idus-200',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    danger: 'bg-red-50 text-red-600 border-red-200',
    info: 'bg-blue-50 text-blue-600 border-blue-200',
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${variantStyles[variant]}`}>
      {children}
    </span>
  )
}

// 브랜드 패턴 배경
export function BrandPatternBg({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* 패턴 배경 */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("${BRAND_PATH}/07. Cover images/logo_pattern.jpg")`,
          backgroundSize: '200px',
          backgroundRepeat: 'repeat',
        }}
      ></div>
      {/* 콘텐츠 */}
      <div className="relative">
        {children}
      </div>
    </div>
  )
}

