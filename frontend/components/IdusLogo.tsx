'use client'

interface IdusLogoProps {
  className?: string
  variant?: 'default' | 'white' | 'icon-only'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// idus 브랜드 로고 컴포넌트
export default function IdusLogo({ 
  className = '', 
  variant = 'default',
  size = 'md' 
}: IdusLogoProps) {
  // 사이즈에 따른 높이 설정
  const sizeMap = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48
  }
  
  const height = sizeMap[size]
  const width = variant === 'icon-only' ? height : height * 2.5

  // 색상 설정
  const primaryColor = variant === 'white' ? '#FFFFFF' : '#F78C3A' // idus orange
  const secondaryColor = variant === 'white' ? '#FFFFFF' : '#1A1A1A' // dark

  if (variant === 'icon-only') {
    // 'd' 아이콘만 표시 (앱 아이콘 스타일)
    return (
      <svg
        viewBox="0 0 100 100"
        width={width}
        height={height}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 'd' 글자 - idus의 상징적인 부분 */}
        <path
          d="M55 15 L55 45 L55 15"
          stroke={primaryColor}
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
        />
        <circle
          cx="42"
          cy="60"
          r="28"
          stroke={primaryColor}
          strokeWidth="14"
          fill="none"
        />
        {/* 화살표 부분 */}
        <path
          d="M55 30 L70 45 L55 45"
          fill={primaryColor}
        />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 200 80"
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* i - 점 */}
      <circle cx="12" cy="12" r="8" fill={secondaryColor} />
      {/* i - 세로획 */}
      <rect x="4" y="28" width="16" height="44" rx="2" fill={secondaryColor} />
      
      {/* d - 세로획 + 원 */}
      <g transform="translate(35, 0)">
        {/* d의 세로획 */}
        <path
          d="M45 8 L45 72"
          stroke={primaryColor}
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
        />
        {/* d의 원 부분 */}
        <circle
          cx="32"
          cy="48"
          r="24"
          stroke={primaryColor}
          strokeWidth="14"
          fill="none"
        />
        {/* 화살표 */}
        <polygon
          points="45,22 62,38 45,38"
          fill={primaryColor}
        />
      </g>
      
      {/* u */}
      <g transform="translate(105, 28)">
        <path
          d="M8 0 L8 32 Q8 44 20 44 L20 44 Q32 44 32 32 L32 0"
          stroke={secondaryColor}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      
      {/* s */}
      <g transform="translate(150, 28)">
        <path
          d="M32 8 Q32 0 20 0 L20 0 Q8 0 8 10 Q8 20 20 22 Q32 24 32 34 Q32 44 20 44 L20 44 Q8 44 8 36"
          stroke={secondaryColor}
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  )
}

// 간단한 텍스트 기반 로고 (폴백용)
export function IdusLogoText({ 
  className = '',
  variant = 'default' 
}: { className?: string; variant?: 'default' | 'white' }) {
  const textColor = variant === 'white' ? 'text-white' : 'text-gray-900'
  const accentColor = variant === 'white' ? 'text-white' : 'text-idus-500'
  
  return (
    <span className={`font-black tracking-tight ${className}`}>
      <span className={textColor}>i</span>
      <span className={accentColor}>d</span>
      <span className={textColor}>us</span>
    </span>
  )
}

// 아이콘 + 텍스트 조합 로고
export function IdusLogoBrand({ 
  className = '',
  size = 'md',
  showSubtitle = false,
  subtitle = 'Global Business Hub'
}: { 
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showSubtitle?: boolean
  subtitle?: string
}) {
  const iconSize = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }
  
  const textSize = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  }
  
  const subtitleSize = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs'
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 아이콘 */}
      <div className={`${iconSize[size]} bg-gradient-to-br from-idus-500 to-idus-600 rounded-xl flex items-center justify-center shadow-orange`}>
        <span className="text-white font-black text-sm">
          id
        </span>
      </div>
      
      {/* 텍스트 */}
      <div>
        <h1 className={`${textSize[size]} font-extrabold text-gray-900 tracking-tight`}>
          <span>i</span>
          <span className="text-idus-500">d</span>
          <span>us</span>
          {' '}
          <span className="font-semibold text-gray-600">Global</span>
        </h1>
        {showSubtitle && (
          <p className={`${subtitleSize[size]} text-idus-500 font-semibold tracking-wide uppercase`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

