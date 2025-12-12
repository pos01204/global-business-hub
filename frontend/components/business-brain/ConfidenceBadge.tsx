/**
 * ConfidenceBadge - 신뢰도 배지 컴포넌트
 * v4.2: 데이터 신뢰도 개선 계획
 */

export type Reliability = 'high' | 'medium' | 'low'

interface ConfidenceBadgeProps {
  reliability: Reliability
  sampleSize?: number
  confidenceInterval?: [number, number]
  dataSource?: 'actual' | 'estimated'
  tooltip?: string
  className?: string
}

export function ConfidenceBadge({
  reliability,
  sampleSize,
  confidenceInterval,
  dataSource,
  tooltip,
  className = ''
}: ConfidenceBadgeProps) {
  const colors = {
    high: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    medium: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    low: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
  }
  
  const icons = {
    high: '✅',
    medium: '⚠️',
    low: '❌'
  }
  
  const labels = {
    high: '높음',
    medium: '중간',
    low: '낮음'
  }
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs ${colors[reliability]} ${className}`}>
      <span>{icons[reliability]}</span>
      <span>신뢰도: {labels[reliability]}</span>
      {sampleSize !== undefined && (
        <span className="text-xs opacity-75">(n={sampleSize})</span>
      )}
      {dataSource === 'estimated' && (
        <span className="text-xs opacity-75">⚠️ 추정치</span>
      )}
      {tooltip && (
        <div className="group relative">
          <span className="cursor-help">ℹ️</span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
            <div className="bg-slate-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
              {tooltip}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

