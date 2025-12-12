/**
 * HeatmapChart - 히트맵 차트 컴포넌트
 * v4.3: Business Brain 시각화 개선
 */

'use client'

export interface HeatmapData {
  labels: string[]
  data: number[][]
  minValue?: number
  maxValue?: number
}

interface HeatmapChartProps {
  data: HeatmapData
  height?: number
  colorScale?: 'green' | 'blue' | 'red' | 'purple'
}

export function HeatmapChart({ 
  data, 
  height = 400,
  colorScale = 'green'
}: HeatmapChartProps) {
  const { labels, data: heatmapData, minValue, maxValue } = data
  
  // 값 범위 계산
  const allValues = heatmapData.flat()
  const min = minValue !== undefined ? minValue : Math.min(...allValues)
  const max = maxValue !== undefined ? maxValue : Math.max(...allValues)
  const range = max - min || 1

  // 색상 스케일
  const getColor = (value: number) => {
    const normalized = (value - min) / range
    
    if (colorScale === 'green') {
      // emerald scale
      if (normalized < 0.2) return 'bg-emerald-50 dark:bg-emerald-900/20'
      if (normalized < 0.4) return 'bg-emerald-100 dark:bg-emerald-900/30'
      if (normalized < 0.6) return 'bg-emerald-300 dark:bg-emerald-700'
      if (normalized < 0.8) return 'bg-emerald-500 dark:bg-emerald-600'
      return 'bg-emerald-600 dark:bg-emerald-500'
    } else if (colorScale === 'blue') {
      // blue scale
      if (normalized < 0.2) return 'bg-blue-50 dark:bg-blue-900/20'
      if (normalized < 0.4) return 'bg-blue-100 dark:bg-blue-900/30'
      if (normalized < 0.6) return 'bg-blue-300 dark:bg-blue-700'
      if (normalized < 0.8) return 'bg-blue-500 dark:bg-blue-600'
      return 'bg-blue-600 dark:bg-blue-500'
    } else if (colorScale === 'red') {
      // red scale
      if (normalized < 0.2) return 'bg-red-50 dark:bg-red-900/20'
      if (normalized < 0.4) return 'bg-red-100 dark:bg-red-900/30'
      if (normalized < 0.6) return 'bg-red-300 dark:bg-red-700'
      if (normalized < 0.8) return 'bg-red-500 dark:bg-red-600'
      return 'bg-red-600 dark:bg-red-500'
    } else {
      // purple scale
      if (normalized < 0.2) return 'bg-purple-50 dark:bg-purple-900/20'
      if (normalized < 0.4) return 'bg-purple-100 dark:bg-purple-900/30'
      if (normalized < 0.6) return 'bg-purple-300 dark:bg-purple-700'
      if (normalized < 0.8) return 'bg-purple-500 dark:bg-purple-600'
      return 'bg-purple-600 dark:bg-purple-500'
    }
  }

  return (
    <div style={{ height: `${height}px` }} className="overflow-auto">
      <div className="inline-block min-w-full">
        <div className="grid gap-1 p-4">
          {/* 헤더 */}
          <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: `repeat(${labels.length + 1}, minmax(60px, 1fr))` }}>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400"></div>
            {labels.map((label, idx) => (
              <div key={idx} className="text-xs font-medium text-slate-600 dark:text-slate-400 text-center">
                {label}
              </div>
            ))}
          </div>
          
          {/* 데이터 행 */}
          {heatmapData.map((row, rowIdx) => (
            <div 
              key={rowIdx} 
              className="grid gap-1" 
              style={{ gridTemplateColumns: `repeat(${labels.length + 1}, minmax(60px, 1fr))` }}
            >
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 text-right pr-2">
                {labels[rowIdx] || `Row ${rowIdx + 1}`}
              </div>
              {row.map((value, colIdx) => (
                <div
                  key={colIdx}
                  className={`${getColor(value)} rounded text-xs text-center py-2 px-1 flex items-center justify-center group relative`}
                  title={`${labels[rowIdx] || `Row ${rowIdx + 1}`} × ${labels[colIdx]}: ${(value * 100).toFixed(1)}%`}
                >
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    {(value * 100).toFixed(0)}%
                  </span>
                  {/* 호버 툴팁 */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {labels[rowIdx] || `Row ${rowIdx + 1}`} × {labels[colIdx]}: {(value * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

