'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

interface HealthScore {
  overall: number
  dimensions: {
    revenue: { score: number; trend: 'up' | 'down' | 'stable' }
    customer: { score: number; trend: 'up' | 'down' | 'stable' }
    artist: { score: number; trend: 'up' | 'down' | 'stable' }
    operations: { score: number; trend: 'up' | 'down' | 'stable' }
  }
}

interface Briefing {
  summary: string
  insights: Array<{
    type: 'critical' | 'warning' | 'opportunity' | 'info'
    title: string
    description: string
  }>
}

// API 함수
const businessBrainApi = {
  getBriefing: async () => {
    const response = await api.get('/api/business-brain/briefing')
    return response.data
  },
  getHealthScore: async () => {
    const response = await api.get('/api/business-brain/health-score')
    return response.data
  },
}

export function BrainWidget() {
  const { data: briefingData, isLoading: briefingLoading } = useQuery({
    queryKey: ['business-brain-briefing'],
    queryFn: businessBrainApi.getBriefing,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 1,
  })

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['business-brain-health'],
    queryFn: businessBrainApi.getHealthScore,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const briefing: Briefing | undefined = briefingData?.briefing
  const healthScore: HealthScore | undefined = healthData?.score

  if (briefingLoading && healthLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-48">
          <Spinner size="lg" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">🧠</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Business Brain</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI 경영 인사이트</p>
          </div>
        </div>
        <Link 
          href="/business-brain"
          className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors"
        >
          상세 분석 →
        </Link>
      </div>

      {/* 건강도 점수 */}
      {healthScore && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">비즈니스 건강도</span>
            <span className={`text-sm font-bold ${
              healthScore.overall >= 70 ? 'text-emerald-600' :
              healthScore.overall >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {healthScore.overall}/100
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                healthScore.overall >= 70 ? 'bg-emerald-500' :
                healthScore.overall >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${healthScore.overall}%` }}
            />
          </div>
          
          {/* 차원별 미니 점수 */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {Object.entries(healthScore.dimensions).map(([key, dim]) => (
              <div key={key} className="text-center">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {getDimensionLabel(key)}
                </div>
                <div className={`text-sm font-semibold ${
                  dim.trend === 'up' ? 'text-emerald-600' :
                  dim.trend === 'down' ? 'text-red-600' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {dim.score}
                  <span className="text-xs ml-0.5">
                    {getTrendIcon(dim.trend)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 브리핑 */}
      {briefing && (
        <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <span>💬</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI 브리핑</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
            {briefing.summary}
          </p>
          
          {/* 주요 인사이트 */}
          {briefing.insights && briefing.insights.length > 0 && (
            <div className="space-y-2">
              {briefing.insights.slice(0, 3).map((insight, idx) => (
                <div 
                  key={idx}
                  className={`flex items-start gap-2 text-xs p-2 rounded-lg transition-colors ${
                    insight.type === 'critical' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                    insight.type === 'warning' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' :
                    insight.type === 'opportunity' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{getInsightIcon(insight.type)}</span>
                  <span className="flex-1">{insight.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2 mt-4">
        <Link
          href="/business-brain?tab=insights"
          className="flex-1 text-center py-2 text-xs font-medium text-purple-600 bg-purple-100/60 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300 rounded-lg transition-colors"
        >
          📊 인사이트
        </Link>
        <Link
          href="/business-brain?tab=forecast"
          className="flex-1 text-center py-2 text-xs font-medium text-indigo-600 bg-indigo-100/60 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 rounded-lg transition-colors"
        >
          🔮 예측
        </Link>
        <Link
          href="/chat?preset=business"
          className="flex-1 text-center py-2 text-xs font-medium text-slate-600 bg-slate-100/60 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg transition-colors"
        >
          💬 질문
        </Link>
      </div>

      {/* 오류 상태 */}
      {!briefingLoading && !healthLoading && !briefing && !healthScore && (
        <div className="text-center py-8">
          <div className="text-slate-400 mb-2">⚠️</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">데이터를 불러올 수 없습니다</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 mt-2"
          >
            다시 시도
          </button>
        </div>
      )}
    </Card>
  )
}

function getDimensionLabel(key: string): string {
  const labels: Record<string, string> = {
    revenue: '매출',
    customer: '고객',
    artist: '작가',
    operations: '운영',
  }
  return labels[key] || key
}

function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
  return trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'
}

function getInsightIcon(type: string): string {
  const icons: Record<string, string> = {
    critical: '🚨',
    warning: '⚠️',
    opportunity: '💡',
    info: '📊',
  }
  return icons[type] || '📌'
}
