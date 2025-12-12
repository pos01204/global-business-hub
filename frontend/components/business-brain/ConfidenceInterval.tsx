/**
 * ConfidenceInterval - 신뢰 구간 표시 컴포넌트
 * v4.2: 데이터 신뢰도 개선 계획
 */

interface ConfidenceIntervalProps {
  value: number
  interval: [number, number]
  confidenceLevel: number
  unit?: string
  format?: 'number' | 'currency' | 'percentage'
  className?: string
}

export function ConfidenceInterval({
  value,
  interval,
  confidenceLevel,
  unit = '',
  format = 'number',
  className = ''
}: ConfidenceIntervalProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `$${val.toFixed(0)}`
      case 'percentage':
        return `${(val * 100).toFixed(1)}%`
      default:
        return val.toLocaleString()
    }
  }
  
  return (
    <div className={`text-xs text-slate-600 dark:text-slate-400 ${className}`}>
      <span className="font-semibold">{formatValue(value)}</span>
      <span className="mx-1">({confidenceLevel * 100}% CI: </span>
      <span>{formatValue(interval[0])} - {formatValue(interval[1])}{unit})</span>
    </div>
  )
}

