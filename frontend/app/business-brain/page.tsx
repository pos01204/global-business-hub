'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { businessBrainApi } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'

export default function BusinessBrainPage() {
  const [activeTab, setActiveTab] = useState('overview')

  // 데이터 쿼리
  const { data: briefingData, isLoading: briefingLoading } = useQuery({
    queryKey: ['business-brain-briefing'],
    queryFn: businessBrainApi.getBriefing,
    staleTime: 5 * 60 * 1000,
  })

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['business-brain-health'],
    queryFn: businessBrainApi.getHealthScore,
    staleTime: 5 * 60 * 1000,
  })

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['business-brain-insights'],
    queryFn: () => businessBrainApi.getInsights({ limit: 50 }),
    staleTime: 5 * 60 * 1000,
  })

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['business-brain-trends'],
    queryFn: businessBrainApi.getTrends,
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'trends',
  })

  const { data: checksData, isLoading: checksLoading } = useQuery({
    queryKey: ['business-brain-checks'],
    queryFn: businessBrainApi.getHumanErrorChecks,
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'risks',
  })

  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['business-brain-recommendations'],
    queryFn: businessBrainApi.getRecommendations,
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'strategy',
  })

  const briefing = briefingData?.briefing
  const healthScore = healthData?.score
  const insights = insightsData?.insights || []
  const trends = trendsData?.trends || []
  const checks = checksData?.checks || []
  const recommendations = recommendationsData?.recommendations

  const isLoading = briefingLoading || healthLoading

  const tabItems = [
    { id: 'overview', label: '📊 현황 평가' },
    { id: 'trends', label: '📈 트렌드 분석' },
    { id: 'risks', label: '⚠️ 리스크 감지' },
    { id: 'insights', label: '💡 기회 발견' },
    { id: 'strategy', label: '🎯 전략 제안' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-2xl">🧠</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Business Brain
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              AI 기반 경영 인사이트 시스템
            </p>
          </div>
        </div>
        {healthScore && (
          <div className="text-right">
            <div className="text-sm text-slate-500 dark:text-slate-400">비즈니스 건강도</div>
            <div className={`text-3xl font-bold ${getScoreColor(healthScore.overall)}`}>
              {healthScore.overall}
              <span className="text-lg text-slate-400">/100</span>
            </div>
          </div>
        )}
      </div>

      {/* 탭 */}
      <Tabs items={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* 현황 평가 탭 */}
          {activeTab === 'overview' && (
            <OverviewTab briefing={briefing} healthScore={healthScore} />
          )}

          {/* 트렌드 분석 탭 */}
          {activeTab === 'trends' && (
            <TrendsTab trends={trends} isLoading={trendsLoading} />
          )}

          {/* 리스크 감지 탭 */}
          {activeTab === 'risks' && (
            <RisksTab checks={checks} isLoading={checksLoading} summary={checksData?.summary} />
          )}

          {/* 기회 발견 탭 */}
          {activeTab === 'insights' && (
            <InsightsTab insights={insights} isLoading={insightsLoading} />
          )}

          {/* 전략 제안 탭 */}
          {activeTab === 'strategy' && (
            <StrategyTab recommendations={recommendations} isLoading={recommendationsLoading} />
          )}
        </>
      )}
    </div>
  )
}

// 현황 평가 탭
function OverviewTab({ briefing, healthScore }: { briefing: any; healthScore: any }) {
  return (
    <div className="space-y-6">
      {/* AI 브리핑 */}
      {briefing && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            💬 AI 경영 브리핑
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {briefing.summary}
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {/* 즉시 조치 사항 */}
            {briefing.immediateActions?.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                  🚨 즉시 조치 필요
                </h3>
                <ul className="space-y-1">
                  {briefing.immediateActions.map((action: string, idx: number) => (
                    <li key={idx} className="text-sm text-red-600 dark:text-red-400">
                      • {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 기회 */}
            {briefing.opportunities?.length > 0 && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                  💡 성장 기회
                </h3>
                <ul className="space-y-1">
                  {briefing.opportunities.slice(0, 3).map((opp: string, idx: number) => (
                    <li key={idx} className="text-sm text-emerald-600 dark:text-emerald-400">
                      • {opp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 주간 집중 사항 */}
            {briefing.weeklyFocus?.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                  🎯 이번 주 집중 사항
                </h3>
                <ul className="space-y-1">
                  {briefing.weeklyFocus.map((focus: string, idx: number) => (
                    <li key={idx} className="text-sm text-blue-600 dark:text-blue-400">
                      • {focus}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 리스크 */}
            {briefing.risks?.length > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">
                  ⚠️ 주의 사항
                </h3>
                <ul className="space-y-1">
                  {briefing.risks.slice(0, 3).map((risk: string, idx: number) => (
                    <li key={idx} className="text-sm text-amber-600 dark:text-amber-400">
                      • {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 건강도 요약 */}
      {healthScore && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            📊 종합 현황 평가
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(healthScore.dimensions).map(([key, dim]: [string, any]) => (
              <div key={key} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                <div className="text-2xl mb-2">{getDimensionEmoji(key)}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  {getDimensionLabel(key)}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-2xl font-bold ${getScoreColor(dim.score)}`}>
                    {dim.score}
                  </span>
                  <span className={`text-sm ${getTrendColor(dim.trend)}`}>
                    {getTrendIcon(dim.trend)}
                    {dim.change !== undefined && Math.abs(dim.change) > 0.01 && (
                      <span className="ml-1">{(dim.change * 100).toFixed(0)}%</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// 트렌드 분석 탭
function TrendsTab({ trends, isLoading }: { trends: any[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          📈 장기 트렌드 분석 (90일)
        </h2>
        {trends.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">트렌드 데이터가 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {trends.map((trend, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-800 dark:text-slate-100">
                    {trend.metric}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={getSignificanceVariant(trend.significance)}>
                      {trend.significance === 'high' ? '높음' : trend.significance === 'medium' ? '중간' : '낮음'}
                    </Badge>
                    <span className={`text-lg font-bold ${getTrendColor(trend.direction)}`}>
                      {getTrendIcon(trend.direction)} {trend.magnitude.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {trend.implication}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// 리스크 감지 탭
function RisksTab({ checks, isLoading, summary }: { checks: any[]; isLoading: boolean; summary?: string }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const failChecks = checks.filter(c => c.status === 'fail')
  const warningChecks = checks.filter(c => c.status === 'warning')
  const passChecks = checks.filter(c => c.status === 'pass')

  return (
    <div className="space-y-6">
      {/* 요약 */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
          ⚠️ 휴먼 에러 체크 결과
        </h2>
        <p className="text-slate-600 dark:text-slate-400">{summary}</p>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">심각 {failChecks.length}개</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">주의 {warningChecks.length}개</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">정상 {passChecks.length}개</span>
          </div>
        </div>
      </Card>

      {/* 체크 목록 */}
      <div className="space-y-4">
        {checks.map((check, idx) => (
          <Card key={idx} className={`p-4 border-l-4 ${
            check.status === 'fail' ? 'border-l-red-500' :
            check.status === 'warning' ? 'border-l-amber-500' : 'border-l-emerald-500'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">
                    {check.status === 'fail' ? '🚨' : check.status === 'warning' ? '⚠️' : '✅'}
                  </span>
                  <h3 className="font-medium text-slate-800 dark:text-slate-100">
                    {check.name}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {check.message}
                </p>
              </div>
              {check.value !== undefined && (
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-700 dark:text-slate-300">
                    {check.value.toFixed(1)}%
                  </div>
                  {check.threshold !== undefined && (
                    <div className="text-xs text-slate-400">
                      임계값: {check.threshold}%
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// 인사이트 탭
function InsightsTab({ insights, isLoading }: { insights: any[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const opportunities = insights.filter(i => i.type === 'opportunity')
  const others = insights.filter(i => i.type !== 'opportunity')

  return (
    <div className="space-y-6">
      {/* 기회 */}
      {opportunities.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            💡 발견된 기회
          </h2>
          <div className="space-y-4">
            {opportunities.map((insight: any) => (
              <div key={insight.id} className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-emerald-800 dark:text-emerald-200">
                      {insight.title}
                    </h3>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                      {insight.description}
                    </p>
                    {insight.recommendation && (
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2 font-medium">
                        → {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 기타 인사이트 */}
      {others.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            📊 기타 인사이트
          </h2>
          <div className="space-y-4">
            {others.map((insight: any) => (
              <div key={insight.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{getInsightIcon(insight.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-800 dark:text-slate-100">
                        {insight.title}
                      </h3>
                      <Badge variant={getInsightVariant(insight.type)}>
                        {getInsightLabel(insight.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {insights.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            현재 발견된 인사이트가 없습니다.
          </p>
        </Card>
      )}
    </div>
  )
}

// 전략 제안 탭
function StrategyTab({ recommendations, isLoading }: { recommendations: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!recommendations) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          전략 제안을 불러오는 중입니다...
        </p>
      </Card>
    )
  }

  const sections = [
    { key: 'shortTerm', title: '🚀 단기 (1-2주)', items: recommendations.shortTerm || [] },
    { key: 'midTerm', title: '📅 중기 (1-3개월)', items: recommendations.midTerm || [] },
    { key: 'longTerm', title: '🎯 장기 (3개월+)', items: recommendations.longTerm || [] },
  ]

  return (
    <div className="space-y-6">
      {sections.map(section => (
        <Card key={section.key} className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            {section.title}
          </h2>
          {section.items.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">해당 기간의 제안이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {section.items.map((item: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                  item.priority === 'high' ? 'bg-red-50 dark:bg-red-900/20 border-l-red-500' :
                  item.priority === 'medium' ? 'bg-amber-50 dark:bg-amber-900/20 border-l-amber-500' :
                  'bg-slate-50 dark:bg-slate-800 border-l-slate-300'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-slate-800 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <Badge variant={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'default'}>
                      {item.priority === 'high' ? '높음' : item.priority === 'medium' ? '중간' : '낮음'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

// 헬퍼 함수들
function getDimensionLabel(key: string): string {
  const labels: Record<string, string> = {
    revenue: '매출',
    customer: '고객',
    artist: '작가',
    operations: '운영',
  }
  return labels[key] || key
}

function getDimensionEmoji(key: string): string {
  const emojis: Record<string, string> = {
    revenue: '💰',
    customer: '👥',
    artist: '🎨',
    operations: '⚙️',
  }
  return emojis[key] || '📊'
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function getTrendColor(trend: string): string {
  if (trend === 'up') return 'text-emerald-500'
  if (trend === 'down') return 'text-red-500'
  return 'text-slate-400'
}

function getTrendIcon(trend: string): string {
  if (trend === 'up') return '↗'
  if (trend === 'down') return '↘'
  return '→'
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

function getInsightVariant(type: string): 'danger' | 'warning' | 'success' | 'default' {
  const variants: Record<string, 'danger' | 'warning' | 'success' | 'default'> = {
    critical: 'danger',
    warning: 'warning',
    opportunity: 'success',
    info: 'default',
  }
  return variants[type] || 'default'
}

function getInsightLabel(type: string): string {
  const labels: Record<string, string> = {
    critical: '긴급',
    warning: '주의',
    opportunity: '기회',
    info: '정보',
  }
  return labels[type] || type
}

function getSignificanceVariant(significance: string): 'danger' | 'warning' | 'default' {
  if (significance === 'high') return 'danger'
  if (significance === 'medium') return 'warning'
  return 'default'
}
