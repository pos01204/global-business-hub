/**
 * ForecastPerformance - 예측 모델 성능 대시보드
 * 예측 정확도 추적 및 모델 성능 비교
 */

'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { 
  TrendingUp, TrendingDown, Minus, 
  BarChart3, Target, AlertTriangle, CheckCircle,
  ArrowUp, ArrowDown
} from 'lucide-react'
import { EChartsBarChart, EChartsTrendChart } from './charts'
import { forecastTracker, type TrackedForecast } from '@/lib/forecast/ForecastTracker'
import { forecastMetrics, type ForecastAccuracyMetrics } from '@/lib/forecast/ForecastMetrics'

interface ForecastPerformanceProps {
  className?: string
}

// 성능 등급 색상
const gradeColors: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  B: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  C: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  D: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  F: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

// 트렌드 아이콘
const TrendIcon = ({ trend }: { trend: 'improving' | 'stable' | 'declining' }) => {
  switch (trend) {
    case 'improving':
      return <Icon icon={TrendingUp} size="sm" className="text-emerald-500" />
    case 'declining':
      return <Icon icon={TrendingDown} size="sm" className="text-red-500" />
    default:
      return <Icon icon={Minus} size="sm" className="text-slate-400" />
  }
}

export function ForecastPerformance({ className = '' }: ForecastPerformanceProps) {
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null)
  
  // 평가된 기록 조회
  const evaluatedRecords = useMemo(() => {
    return forecastTracker.getEvaluatedRecords()
  }, [])

  // 모델 성능 요약
  const performanceSummary = useMemo(() => {
    return forecastTracker.getPerformanceSummary()
  }, [])

  // 선택된 기록의 상세 리포트
  const selectedReport = useMemo(() => {
    if (!selectedRecord) return null
    return forecastTracker.generateAccuracyReport(selectedRecord)
  }, [selectedRecord])

  // 전체 평균 지표 계산
  const overallMetrics = useMemo(() => {
    const allMetrics = evaluatedRecords
      .filter(r => r.metrics)
      .map(r => r.metrics!)
    
    if (allMetrics.length === 0) return null

    const avg = {
      mape: allMetrics.reduce((s, m) => s + m.mape, 0) / allMetrics.length,
      rmse: allMetrics.reduce((s, m) => s + m.rmse, 0) / allMetrics.length,
      r2: allMetrics.reduce((s, m) => s + m.r2, 0) / allMetrics.length,
    }

    return avg
  }, [evaluatedRecords])

  // 데이터가 없는 경우
  if (evaluatedRecords.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
          예측 성능 데이터가 없습니다
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          예측을 수행하고 실제 값이 확인되면 성능 지표가 표시됩니다.
        </p>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 전체 성능 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Icon icon={BarChart3} size="md" className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">평가된 예측</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {evaluatedRecords.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <Icon icon={Target} size="md" className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">평균 MAPE</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {overallMetrics?.mape.toFixed(1) || '-'}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Icon icon={CheckCircle} size="md" className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">평균 R²</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {overallMetrics?.r2.toFixed(2) || '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Icon icon={AlertTriangle} size="md" className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">평균 RMSE</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {overallMetrics?.rmse.toFixed(0) || '-'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 모델별 성능 비교 */}
      {performanceSummary.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            모델별 성능 비교
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4">모델</th>
                  <th className="text-center py-3 px-4">평가 횟수</th>
                  <th className="text-center py-3 px-4">평균 MAPE</th>
                  <th className="text-center py-3 px-4">평균 R²</th>
                  <th className="text-center py-3 px-4">트렌드</th>
                  <th className="text-center py-3 px-4">등급</th>
                </tr>
              </thead>
              <tbody>
                {performanceSummary.map((summary, idx) => {
                  const grade = forecastMetrics.evaluatePerformanceGrade({
                    mape: summary.avgMAPE,
                    r2: summary.avgR2,
                    rmse: 0, mae: 0, mse: 0, bias: 0, smape: 0, mase: 0
                  })
                  
                  return (
                    <tr 
                      key={summary.model}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {idx === 0 && <span className="text-amber-500">🥇</span>}
                          {idx === 1 && <span className="text-slate-400">🥈</span>}
                          {idx === 2 && <span className="text-amber-700">🥉</span>}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {summary.model}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 text-slate-600 dark:text-slate-400">
                        {summary.recordCount}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`font-semibold ${
                          summary.avgMAPE < 10 ? 'text-emerald-600 dark:text-emerald-400' :
                          summary.avgMAPE < 20 ? 'text-blue-600 dark:text-blue-400' :
                          summary.avgMAPE < 30 ? 'text-amber-600 dark:text-amber-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {summary.avgMAPE.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`font-semibold ${
                          summary.avgR2 > 0.8 ? 'text-emerald-600 dark:text-emerald-400' :
                          summary.avgR2 > 0.6 ? 'text-blue-600 dark:text-blue-400' :
                          summary.avgR2 > 0.4 ? 'text-amber-600 dark:text-amber-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {summary.avgR2.toFixed(2)}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <TrendIcon trend={summary.trend} />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {summary.trend === 'improving' ? '개선 중' :
                             summary.trend === 'declining' ? '하락 중' : '안정'}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${gradeColors[grade.grade]}`}>
                          {grade.grade}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 최근 예측 기록 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span>
          최근 예측 기록
        </h3>

        <div className="space-y-3">
          {evaluatedRecords.slice(0, 10).map((record) => {
            const grade = record.metrics 
              ? forecastMetrics.evaluatePerformanceGrade(record.metrics)
              : null
            
            return (
              <div
                key={record.id}
                onClick={() => setSelectedRecord(record.id === selectedRecord ? null : record.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedRecord === record.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      record.status === 'complete' ? 'bg-emerald-500' :
                      record.status === 'partial' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {record.metric} - {record.model}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(record.createdAt).toLocaleDateString('ko-KR')} • {record.period}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {record.metrics && (
                      <>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400">MAPE</p>
                          <p className="font-semibold text-slate-700 dark:text-slate-300">
                            {record.metrics.mape.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400">R²</p>
                          <p className="font-semibold text-slate-700 dark:text-slate-300">
                            {record.metrics.r2.toFixed(2)}
                          </p>
                        </div>
                      </>
                    )}
                    {grade && (
                      <span className={`px-2 py-1 rounded text-xs font-bold ${gradeColors[grade.grade]}`}>
                        {grade.grade}
                      </span>
                    )}
                  </div>
                </div>

                {/* 선택된 기록 상세 */}
                {selectedRecord === record.id && selectedReport && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400">MAE</p>
                        <p className="font-bold text-slate-700 dark:text-slate-300">
                          {selectedReport.record.metrics?.mae.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400">RMSE</p>
                        <p className="font-bold text-slate-700 dark:text-slate-300">
                          {selectedReport.record.metrics?.rmse.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Bias</p>
                        <p className={`font-bold ${
                          (selectedReport.record.metrics?.bias || 0) > 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {selectedReport.record.metrics?.bias.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400">MASE</p>
                        <p className={`font-bold ${
                          (selectedReport.record.metrics?.mase || 0) < 1 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {selectedReport.record.metrics?.mase.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* 권장사항 */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                        {selectedReport.grade.description}
                      </p>
                      <ul className="space-y-1">
                        {selectedReport.grade.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                            <span className="mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

export default ForecastPerformance

