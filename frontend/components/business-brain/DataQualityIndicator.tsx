/**
 * DataQualityIndicator - 데이터 품질 표시 컴포넌트
 * v4.2: 데이터 신뢰도 개선 계획
 */

interface DataQualityMetrics {
  completeness: number  // 0-1
  accuracy: number      // 0-1
  freshness: number     // hours ago
  missingData: number   // count
}

interface DataQualityIndicatorProps {
  quality: DataQualityMetrics
  className?: string
  showDetails?: boolean
}

export function DataQualityIndicator({ 
  quality, 
  className = '',
  showDetails = true 
}: DataQualityIndicatorProps) {
  const getQualityGrade = (completeness: number, accuracy: number) => {
    const score = (completeness + accuracy) / 2
    if (score >= 0.9) return { grade: 'A', color: 'text-green-600 dark:text-green-400' }
    if (score >= 0.7) return { grade: 'B', color: 'text-amber-600 dark:text-amber-400' }
    if (score >= 0.5) return { grade: 'C', color: 'text-orange-600 dark:text-orange-400' }
    return { grade: 'D', color: 'text-red-600 dark:text-red-400' }
  }
  
  const { grade, color } = getQualityGrade(quality.completeness, quality.accuracy)
  
  return (
    <div className={`p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">데이터 품질</span>
        <span className={`text-lg font-bold ${color}`}>{grade}</span>
      </div>
      {showDetails && (
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">완전성:</span>
            <span className="font-medium">{(quality.completeness * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">정확성:</span>
            <span className="font-medium">{(quality.accuracy * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">최신성:</span>
            <span className="font-medium">{quality.freshness}시간 전</span>
          </div>
          {quality.missingData > 0 && (
            <div className="flex justify-between text-red-600 dark:text-red-400">
              <span>누락 데이터:</span>
              <span className="font-medium">{quality.missingData}건</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

