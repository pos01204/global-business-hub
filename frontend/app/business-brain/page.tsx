'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { businessBrainApi } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'

// 기간 프리셋 타입
type PeriodPreset = '7d' | '30d' | '90d' | '180d' | '365d'

const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' },
  { value: '90d', label: '최근 90일' },
  { value: '180d', label: '최근 180일' },
  { value: '365d', label: '최근 1년' },
]

export default function BusinessBrainPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodPreset>('30d')

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

  // 새로운 고급 분석 쿼리 (기간 기반)
  const { data: rfmData, isLoading: rfmLoading } = useQuery({
    queryKey: ['business-brain-rfm', selectedPeriod],
    queryFn: () => businessBrainApi.getAnalysisByPeriod('rfm', selectedPeriod),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'rfm',
  })

  const { data: paretoData, isLoading: paretoLoading } = useQuery({
    queryKey: ['business-brain-pareto', selectedPeriod],
    queryFn: () => businessBrainApi.getAnalysisByPeriod('pareto', selectedPeriod),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'pareto',
  })

  const { data: cohortData, isLoading: cohortLoading } = useQuery({
    queryKey: ['business-brain-cohort', selectedPeriod],
    queryFn: () => businessBrainApi.getAnalysisByPeriod('cohort', selectedPeriod),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'cohort',
  })

  const { data: anomalyData, isLoading: anomalyLoading } = useQuery({
    queryKey: ['business-brain-anomaly', selectedPeriod],
    queryFn: () => businessBrainApi.getAnalysisByPeriod('anomaly', selectedPeriod),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'anomaly',
  })

  // 예측 데이터
  const { data: forecastData, isLoading: forecastLoading } = useQuery({
    queryKey: ['business-brain-forecast', selectedPeriod],
    queryFn: () => businessBrainApi.getForecast(selectedPeriod === '7d' ? '30d' : selectedPeriod, 30),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'forecast',
  })

  // 종합 인사이트
  const { data: comprehensiveData, isLoading: comprehensiveLoading } = useQuery({
    queryKey: ['business-brain-comprehensive', selectedPeriod],
    queryFn: () => businessBrainApi.getComprehensiveAnalysis(selectedPeriod),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'comprehensive',
  })

  // 다중 기간 트렌드
  const { data: multiPeriodData, isLoading: multiPeriodLoading } = useQuery({
    queryKey: ['business-brain-multi-period'],
    queryFn: () => businessBrainApi.getMultiPeriodAnalysis('monthly', 6),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'multiperiod',
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
    { id: 'comprehensive', label: '🎯 종합 인사이트' },
    { id: 'trends', label: '📈 트렌드 분석' },
    { id: 'multiperiod', label: '📅 기간별 추이' },
    { id: 'forecast', label: '🔮 매출 예측' },
    { id: 'risks', label: '⚠️ 리스크 감지' },
    { id: 'insights', label: '💡 기회 발견' },
    { id: 'strategy', label: '🎯 전략 제안' },
    { id: 'rfm', label: '👥 RFM 분석' },
    { id: 'pareto', label: '📊 파레토 분석' },
    { id: 'cohort', label: '📅 코호트 분석' },
    { id: 'anomaly', label: '🔍 이상 탐지' },
  ]

  // 기간 선택이 필요한 탭들
  const periodEnabledTabs = ['comprehensive', 'rfm', 'pareto', 'cohort', 'anomaly', 'forecast']

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

      {/* 기간 선택 (해당 탭에서만 표시) */}
      {periodEnabledTabs.includes(activeTab) && (
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">분석 기간:</span>
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => setSelectedPeriod(option.value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedPeriod === option.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

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

          {/* RFM 분석 탭 */}
          {activeTab === 'rfm' && (
            <RFMTab data={rfmData} isLoading={rfmLoading} />
          )}

          {/* 파레토 분석 탭 */}
          {activeTab === 'pareto' && (
            <ParetoTab data={paretoData} isLoading={paretoLoading} />
          )}

          {/* 코호트 분석 탭 */}
          {activeTab === 'cohort' && (
            <CohortTab data={cohortData} isLoading={cohortLoading} />
          )}

          {/* 이상 탐지 탭 */}
          {activeTab === 'anomaly' && (
            <AnomalyTab data={anomalyData} isLoading={anomalyLoading} />
          )}

          {/* 종합 인사이트 탭 */}
          {activeTab === 'comprehensive' && (
            <ComprehensiveTab data={comprehensiveData} isLoading={comprehensiveLoading} period={selectedPeriod} />
          )}

          {/* 기간별 추이 탭 */}
          {activeTab === 'multiperiod' && (
            <MultiPeriodTab data={multiPeriodData} isLoading={multiPeriodLoading} />
          )}

          {/* 매출 예측 탭 */}
          {activeTab === 'forecast' && (
            <ForecastTab data={forecastData} isLoading={forecastLoading} />
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

// ==================== 새로운 고급 분석 탭 컴포넌트 ====================

// RFM 분석 탭
function RFMTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const segments = data?.segments || []
  const atRiskVIPs = data?.atRiskVIPs || []

  const segmentColors: Record<string, string> = {
    VIP: 'bg-purple-500',
    Loyal: 'bg-blue-500',
    Potential: 'bg-emerald-500',
    New: 'bg-cyan-500',
    AtRisk: 'bg-amber-500',
    Dormant: 'bg-orange-500',
    Lost: 'bg-red-500',
  }

  const segmentLabels: Record<string, string> = {
    VIP: 'VIP 고객',
    Loyal: '충성 고객',
    Potential: '잠재 고객',
    New: '신규 고객',
    AtRisk: '이탈 위험',
    Dormant: '휴면 고객',
    Lost: '이탈 고객',
  }

  return (
    <div className="space-y-6">
      {/* 세그먼트 분포 */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          👥 RFM 고객 세분화
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          최근 90일 구매 데이터 기반 고객 세그먼트 분석
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {segments.map((seg: any) => (
            <div key={seg.segment} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
              <div className={`w-4 h-4 ${segmentColors[seg.segment] || 'bg-gray-500'} rounded-full mx-auto mb-2`} />
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {segmentLabels[seg.segment] || seg.segment}
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {seg.count.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">
                {(seg.percentage * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 세그먼트 상세 */}
      <Card className="p-6">
        <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-4">
          📊 세그먼트별 상세 지표
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4">세그먼트</th>
                <th className="text-right py-3 px-4">고객 수</th>
                <th className="text-right py-3 px-4">평균 Recency (일)</th>
                <th className="text-right py-3 px-4">평균 Frequency</th>
                <th className="text-right py-3 px-4">평균 Monetary ($)</th>
                <th className="text-right py-3 px-4">총 매출 ($)</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg: any) => (
                <tr key={seg.segment} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 ${segmentColors[seg.segment] || 'bg-gray-500'} rounded-full`} />
                      <span className="font-medium">{segmentLabels[seg.segment] || seg.segment}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4">{seg.count.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">{seg.avgRecency.toFixed(0)}</td>
                  <td className="text-right py-3 px-4">{seg.avgFrequency.toFixed(1)}</td>
                  <td className="text-right py-3 px-4">${seg.avgMonetary.toFixed(0)}</td>
                  <td className="text-right py-3 px-4">${seg.totalRevenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 이탈 위험 VIP */}
      {atRiskVIPs.length > 0 && (
        <Card className="p-6 border-l-4 border-l-amber-500">
          <h3 className="text-md font-semibold text-amber-700 dark:text-amber-300 mb-4">
            ⚠️ 이탈 위험 VIP 고객 ({atRiskVIPs.length}명)
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            높은 구매력을 보였으나 최근 활동이 없는 고객입니다. 리텐션 캠페인을 권장합니다.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {atRiskVIPs.slice(0, 8).map((customer: any, idx: number) => (
              <div key={idx} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  마지막 구매: {customer.recency}일 전
                </div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  총 {customer.frequency}회 구매
                </div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  ${customer.monetary.toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// 파레토 분석 탭
function ParetoTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const artistConcentration = data?.artistConcentration
  const countryConcentration = data?.countryConcentration
  const customerConcentration = data?.customerConcentration

  return (
    <div className="space-y-6">
      {/* 작가 집중도 */}
      {artistConcentration && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            🎨 작가 매출 집중도
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
              <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">상위 10% 작가</div>
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                {(artistConcentration.top10Percent.revenueShare * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500">{artistConcentration.top10Percent.count}명</div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">상위 20% 작가</div>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {(artistConcentration.top20Percent.revenueShare * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500">{artistConcentration.top20Percent.count}명</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">하위 50% 작가</div>
              <div className="text-3xl font-bold text-slate-700 dark:text-slate-300">
                {(artistConcentration.bottom50Percent.revenueShare * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500">{artistConcentration.bottom50Percent.count}명</div>
            </div>
          </div>

          {/* 지니 계수 */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">지니 계수</div>
                <div className="text-xs text-slate-500">0에 가까울수록 균등, 1에 가까울수록 집중</div>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {artistConcentration.giniCoefficient.toFixed(3)}
              </div>
            </div>
            <div className="mt-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
                style={{ width: `${artistConcentration.giniCoefficient * 100}%` }}
              />
            </div>
          </div>

          {/* 상위 작가 목록 */}
          {artistConcentration.top10Percent.names?.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">상위 10% 작가</div>
              <div className="flex flex-wrap gap-2">
                {artistConcentration.top10Percent.names.slice(0, 10).map((name: string, idx: number) => (
                  <Badge key={idx} variant="default">{name}</Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 국가 집중도 */}
      {countryConcentration && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            🌍 국가별 매출 집중도
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">주력 시장</div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {countryConcentration.primary.country}
              </div>
              <div className="text-lg text-slate-600 dark:text-slate-400">
                {(countryConcentration.primary.share * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">2차 시장</div>
              <div className="text-lg font-medium text-blue-700 dark:text-blue-300">
                {countryConcentration.secondary.countries.join(', ')}
              </div>
              <div className="text-lg text-slate-600 dark:text-slate-400">
                {(countryConcentration.secondary.share * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">허핀달 지수 (HHI)</div>
                <div className="text-xs text-slate-500">시장 집중도 지표 (0.25 이상: 고집중)</div>
              </div>
              <div className={`text-2xl font-bold ${
                countryConcentration.herfindahlIndex > 0.25 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {countryConcentration.herfindahlIndex.toFixed(3)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 고객 집중도 */}
      {customerConcentration && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            👤 고객 매출 집중도
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-center">
              <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">상위 10% 고객</div>
              <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                {(customerConcentration.top10Percent.revenueShare * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500">{customerConcentration.top10Percent.count}명</div>
            </div>
            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg text-center">
              <div className="text-sm text-violet-600 dark:text-violet-400 mb-1">상위 20% 고객</div>
              <div className="text-3xl font-bold text-violet-700 dark:text-violet-300">
                {(customerConcentration.top20Percent.revenueShare * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500">{customerConcentration.top20Percent.count}명</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// 코호트 분석 탭
function CohortTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const cohorts = data?.cohorts || []
  const overallRetentionCurve = data?.overallRetentionCurve || []

  return (
    <div className="space-y-6">
      {/* 리텐션 곡선 */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          📅 코호트 리텐션 분석
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          첫 구매 월 기준 고객 리텐션 추이
        </p>

        {/* 전체 리텐션 곡선 */}
        {overallRetentionCurve.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">평균 리텐션 곡선</div>
            <div className="flex items-end gap-1 h-32">
              {overallRetentionCurve.slice(0, 12).map((retention: number, idx: number) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${retention * 100}%` }}
                  />
                  <div className="text-xs text-slate-500 mt-1">M{idx}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 코호트별 상세 */}
      <Card className="p-6">
        <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-4">
          📊 코호트별 상세 지표
        </h3>
        
        {cohorts.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">코호트 데이터가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4">코호트</th>
                  <th className="text-right py-3 px-4">고객 수</th>
                  <th className="text-right py-3 px-4">평균 주문 수</th>
                  <th className="text-right py-3 px-4">LTV ($)</th>
                  <th className="text-center py-3 px-4">M1 리텐션</th>
                  <th className="text-center py-3 px-4">M3 리텐션</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.slice(0, 12).map((cohort: any) => (
                  <tr key={cohort.cohortMonth} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-4 font-medium">{cohort.cohortMonth}</td>
                    <td className="text-right py-3 px-4">{cohort.totalUsers.toLocaleString()}</td>
                    <td className="text-right py-3 px-4">{cohort.avgOrdersPerUser.toFixed(1)}</td>
                    <td className="text-right py-3 px-4">${cohort.ltv.toFixed(0)}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        (cohort.retentionByMonth[1] || 0) > 0.3 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}>
                        {((cohort.retentionByMonth[1] || 0) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        (cohort.retentionByMonth[3] || 0) > 0.2 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}>
                        {((cohort.retentionByMonth[3] || 0) * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 최고/최저 코호트 */}
      {data?.bestPerformingCohort && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 border-l-4 border-l-emerald-500">
            <div className="text-sm text-emerald-600 dark:text-emerald-400">최고 성과 코호트</div>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {data.bestPerformingCohort}
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-red-500">
            <div className="text-sm text-red-600 dark:text-red-400">최저 성과 코호트</div>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {data.worstPerformingCohort}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// 이상 탐지 탭
function AnomalyTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const anomalies = data?.anomalies || []
  const patternBreaks = data?.patternBreaks || []
  const trendChanges = data?.trendChanges || []

  const severityColors: Record<string, string> = {
    critical: 'bg-red-50 dark:bg-red-900/20 border-l-red-500',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-l-amber-500',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500',
  }

  const severityIcons: Record<string, string> = {
    critical: '🚨',
    warning: '⚠️',
    info: 'ℹ️',
  }

  return (
    <div className="space-y-6">
      {/* 이상치 목록 */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          🔍 탐지된 이상치
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          통계적으로 유의미한 편차가 발견된 데이터 포인트
        </p>

        {anomalies.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            ✅ 탐지된 이상치가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {anomalies.slice(0, 10).map((anomaly: any, idx: number) => (
              <div 
                key={idx} 
                className={`p-4 rounded-lg border-l-4 ${severityColors[anomaly.severity] || severityColors.info}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{severityIcons[anomaly.severity] || '📊'}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {anomaly.date} - {anomaly.metric}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      실제: {anomaly.actualValue.toLocaleString()} | 
                      예상: {anomaly.expectedValue.toLocaleString()} | 
                      Z-Score: {anomaly.zScore.toFixed(2)}
                    </div>
                    {anomaly.possibleCauses?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-slate-500 mb-1">가능한 원인:</div>
                        <div className="flex flex-wrap gap-1">
                          {anomaly.possibleCauses.map((cause: string, i: number) => (
                            <span key={i} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                              {cause}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={`text-lg font-bold ${
                    anomaly.deviation > 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {anomaly.deviation > 0 ? '+' : ''}{((anomaly.deviation / anomaly.expectedValue) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 패턴 이탈 */}
      {patternBreaks.length > 0 && (
        <Card className="p-6">
          <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-4">
            📈 패턴 이탈 감지
          </h3>
          <div className="space-y-4">
            {patternBreaks.map((pb: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-800 dark:text-slate-100">{pb.metric}</span>
                  <span className="text-sm text-slate-500">{pb.breakDate}</span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {pb.beforePattern} → {pb.afterPattern}
                </div>
                <div className="text-xs text-slate-500 mt-1">{pb.description}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 트렌드 변화 */}
      {trendChanges.length > 0 && (
        <Card className="p-6">
          <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-4">
            🔄 트렌드 변화 감지
          </h3>
          <div className="space-y-4">
            {trendChanges.map((tc: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{tc.metric}</span>
                    <span className="text-sm text-slate-500 ml-2">({tc.changeDate})</span>
                  </div>
                  <Badge variant={tc.significance === 'high' ? 'danger' : 'warning'}>
                    {tc.significance === 'high' ? '중요' : '참고'}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    이전: {tc.beforeTrend > 0 ? '↗' : tc.beforeTrend < 0 ? '↘' : '→'} {(tc.beforeTrend * 100).toFixed(1)}%
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className={tc.afterTrend > 0 ? 'text-emerald-600' : 'text-red-600'}>
                    이후: {tc.afterTrend > 0 ? '↗' : tc.afterTrend < 0 ? '↘' : '→'} {(tc.afterTrend * 100).toFixed(1)}%
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

// ==================== 새로운 탭 컴포넌트 (v2.1) ====================

// 종합 인사이트 탭
function ComprehensiveTab({ data, isLoading, period }: { data: any; isLoading: boolean; period: string }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">데이터를 불러올 수 없습니다.</div>
    )
  }

  const { summary, comparison, forecast, topInsights, risks, opportunities, recommendations } = data

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-500 dark:text-slate-400">총 매출</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            ${summary?.gmv?.toLocaleString() || 0}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-500 dark:text-slate-400">주문 수</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {summary?.orders?.toLocaleString() || 0}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-500 dark:text-slate-400">평균 객단가</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            ${summary?.aov?.toFixed(0) || 0}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-500 dark:text-slate-400">고객 수</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {summary?.customers?.toLocaleString() || 0}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-500 dark:text-slate-400">활동 작가</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {summary?.artists?.toLocaleString() || 0}
          </div>
        </Card>
      </div>

      {/* 기간 비교 */}
      {comparison && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            📊 이전 기간 대비 변화
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(comparison.metrics).map(([key, value]: [string, any]) => (
              <div key={key} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  {key === 'gmv' ? '매출' : key === 'orders' ? '주문' : key === 'aov' ? '객단가' : '고객'}
                </div>
                <div className={`text-xl font-bold ${value.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {value.changePercent >= 0 ? '+' : ''}{value.changePercent.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400">
                  {key === 'gmv' || key === 'aov' ? '$' : ''}{value.period2.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 인사이트 그리드 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 핵심 인사이트 */}
        {topInsights?.length > 0 && (
          <Card className="p-6">
            <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-4">
              💡 핵심 인사이트
            </h3>
            <ul className="space-y-2">
              {topInsights.map((insight: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-blue-500 mt-0.5">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* 리스크 */}
        {risks?.length > 0 && (
          <Card className="p-6 border-l-4 border-l-red-500">
            <h3 className="text-md font-semibold text-red-700 dark:text-red-400 mb-4">
              ⚠️ 리스크
            </h3>
            <ul className="space-y-2">
              {risks.map((risk: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-red-500 mt-0.5">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* 기회 */}
        {opportunities?.length > 0 && (
          <Card className="p-6 border-l-4 border-l-emerald-500">
            <h3 className="text-md font-semibold text-emerald-700 dark:text-emerald-400 mb-4">
              🌟 기회
            </h3>
            <ul className="space-y-2">
              {opportunities.map((opp: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  {opp}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* 추천 */}
        {recommendations?.length > 0 && (
          <Card className="p-6 border-l-4 border-l-indigo-500">
            <h3 className="text-md font-semibold text-indigo-700 dark:text-indigo-400 mb-4">
              🎯 추천 액션
            </h3>
            <ul className="space-y-2">
              {recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-indigo-500 mt-0.5">{idx + 1}.</span>
                  {rec}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* 예측 요약 */}
      {forecast && forecast.predictions?.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            🔮 매출 예측 (향후 14일)
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <Badge variant={forecast.trend === 'up' ? 'success' : forecast.trend === 'down' ? 'danger' : 'default'}>
              {forecast.trend === 'up' ? '📈 상승 예상' : forecast.trend === 'down' ? '📉 하락 예상' : '➡️ 안정'}
            </Badge>
            <span className="text-sm text-slate-500">
              신뢰도: {forecast.confidence?.toFixed(0) || 0}%
            </span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {forecast.predictions.slice(0, 7).map((pred: any, idx: number) => (
              <div key={idx} className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                <div className="text-xs text-slate-500">{pred.date?.slice(5)}</div>
                <div className="text-sm font-medium">${pred.predicted?.toFixed(0)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// 다중 기간 추이 탭
function MultiPeriodTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">데이터를 불러올 수 없습니다.</div>
    )
  }

  const { periods, trends, bestPeriod, worstPeriod, insights, seasonalityDetected } = data

  return (
    <div className="space-y-6">
      {/* 트렌드 요약 */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">매출 트렌드</div>
          <div className={`text-xl font-bold ${
            trends?.gmv?.direction === 'up' ? 'text-emerald-600' : 
            trends?.gmv?.direction === 'down' ? 'text-red-600' : 'text-slate-600'
          }`}>
            {trends?.gmv?.direction === 'up' ? '📈 상승' : 
             trends?.gmv?.direction === 'down' ? '📉 하락' : '➡️ 안정'}
          </div>
          <div className="text-sm text-slate-500">
            평균 성장률: {trends?.gmv?.avgGrowth?.toFixed(1) || 0}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">주문 트렌드</div>
          <div className={`text-xl font-bold ${
            trends?.orders?.direction === 'up' ? 'text-emerald-600' : 
            trends?.orders?.direction === 'down' ? 'text-red-600' : 'text-slate-600'
          }`}>
            {trends?.orders?.direction === 'up' ? '📈 상승' : 
             trends?.orders?.direction === 'down' ? '📉 하락' : '➡️ 안정'}
          </div>
          <div className="text-sm text-slate-500">
            평균 성장률: {trends?.orders?.avgGrowth?.toFixed(1) || 0}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">객단가 트렌드</div>
          <div className={`text-xl font-bold ${
            trends?.aov?.direction === 'up' ? 'text-emerald-600' : 
            trends?.aov?.direction === 'down' ? 'text-red-600' : 'text-slate-600'
          }`}>
            {trends?.aov?.direction === 'up' ? '📈 상승' : 
             trends?.aov?.direction === 'down' ? '📉 하락' : '➡️ 안정'}
          </div>
          <div className="text-sm text-slate-500">
            평균 변화율: {trends?.aov?.avgGrowth?.toFixed(1) || 0}%
          </div>
        </Card>
      </div>

      {/* 기간별 차트 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          📅 기간별 매출 추이
        </h3>
        <div className="space-y-4">
          {periods?.map((period: any, idx: number) => {
            const maxGmv = Math.max(...(periods?.map((p: any) => p.gmv) || [1]))
            const widthPercent = (period.gmv / maxGmv) * 100
            
            return (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-20 text-sm text-slate-600 dark:text-slate-400">
                  {period.label}
                </div>
                <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      period.label === bestPeriod ? 'bg-emerald-500' :
                      period.label === worstPeriod ? 'bg-red-400' :
                      'bg-indigo-500'
                    }`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
                <div className="w-28 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                  ${period.gmv?.toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 기간별 상세 테이블 */}
      <Card className="p-6">
        <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-4">
          📊 기간별 상세 지표
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4">기간</th>
                <th className="text-right py-3 px-4">매출</th>
                <th className="text-right py-3 px-4">주문 수</th>
                <th className="text-right py-3 px-4">객단가</th>
                <th className="text-right py-3 px-4">고객 수</th>
              </tr>
            </thead>
            <tbody>
              {periods?.map((period: any, idx: number) => (
                <tr key={idx} className={`border-b border-slate-100 dark:border-slate-800 ${
                  period.label === bestPeriod ? 'bg-emerald-50 dark:bg-emerald-900/10' :
                  period.label === worstPeriod ? 'bg-red-50 dark:bg-red-900/10' : ''
                }`}>
                  <td className="py-3 px-4 font-medium">{period.label}</td>
                  <td className="text-right py-3 px-4">${period.gmv?.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">{period.orders?.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">${period.aov?.toFixed(0)}</td>
                  <td className="text-right py-3 px-4">{period.customers?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 인사이트 */}
      {insights?.length > 0 && (
        <Card className="p-6">
          <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-4">
            💡 분석 인사이트
          </h3>
          <ul className="space-y-2">
            {insights.map((insight: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="text-indigo-500 mt-0.5">•</span>
                {insight}
              </li>
            ))}
          </ul>
          {seasonalityDetected && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-300">
              📅 시즌성이 감지되었습니다. 특정 기간에 매출 변동이 큰 패턴이 있습니다.
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

// 매출 예측 탭
function ForecastTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!data || !data.predictions?.length) {
    return (
      <div className="p-8 text-center text-slate-500">
        예측 데이터를 생성할 수 없습니다. 더 많은 과거 데이터가 필요합니다.
      </div>
    )
  }

  const { historicalData, predictions, trend, confidence, seasonality, accuracy } = data

  return (
    <div className="space-y-6">
      {/* 예측 요약 */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">예측 트렌드</div>
          <div className={`text-2xl font-bold ${
            trend === 'up' ? 'text-emerald-600' : 
            trend === 'down' ? 'text-red-600' : 'text-slate-600'
          }`}>
            {trend === 'up' ? '📈 상승' : trend === 'down' ? '📉 하락' : '➡️ 안정'}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">예측 신뢰도</div>
          <div className={`text-2xl font-bold ${
            confidence >= 70 ? 'text-emerald-600' : 
            confidence >= 50 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {confidence?.toFixed(0) || 0}%
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">MAPE</div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
            {accuracy?.mape?.toFixed(1) || 0}%
          </div>
          <div className="text-xs text-slate-400">낮을수록 정확</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">시즌성</div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
            {seasonality?.weekly ? '주간' : seasonality?.monthly ? '월간' : '없음'}
          </div>
        </Card>
      </div>

      {/* 예측 차트 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          🔮 향후 30일 매출 예측
        </h3>
        
        {/* 과거 데이터 (최근 14일) */}
        <div className="mb-4">
          <div className="text-sm text-slate-500 mb-2">과거 데이터 (최근 14일)</div>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {historicalData?.slice(-14).map((d: any, idx: number) => {
              const maxVal = Math.max(...(historicalData?.slice(-14).map((h: any) => h.value) || [1]))
              const heightPercent = (d.value / maxVal) * 100
              return (
                <div key={idx} className="flex flex-col items-center min-w-[40px]">
                  <div className="h-20 w-6 bg-slate-100 dark:bg-slate-800 rounded relative">
                    <div 
                      className="absolute bottom-0 w-full bg-slate-400 dark:bg-slate-500 rounded"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{d.date?.slice(5)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 예측 데이터 */}
        <div>
          <div className="text-sm text-slate-500 mb-2">예측 (향후 30일)</div>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {predictions?.map((p: any, idx: number) => {
              const maxVal = Math.max(...(predictions?.map((pred: any) => pred.upper) || [1]))
              const predictedPercent = (p.predicted / maxVal) * 100
              const lowerPercent = (p.lower / maxVal) * 100
              const upperPercent = (p.upper / maxVal) * 100
              
              return (
                <div key={idx} className="flex flex-col items-center min-w-[40px]">
                  <div className="h-20 w-6 bg-slate-100 dark:bg-slate-800 rounded relative">
                    {/* 신뢰 구간 */}
                    <div 
                      className="absolute w-full bg-indigo-100 dark:bg-indigo-900/30 rounded"
                      style={{ 
                        bottom: `${lowerPercent}%`, 
                        height: `${upperPercent - lowerPercent}%` 
                      }}
                    />
                    {/* 예측값 */}
                    <div 
                      className="absolute bottom-0 w-full bg-indigo-500 rounded"
                      style={{ height: `${predictedPercent}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{p.date?.slice(5)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* 예측 상세 테이블 */}
      <Card className="p-6">
        <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-4">
          📊 일별 예측 상세
        </h3>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-slate-900">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4">날짜</th>
                <th className="text-right py-3 px-4">예측 매출</th>
                <th className="text-right py-3 px-4">하한</th>
                <th className="text-right py-3 px-4">상한</th>
              </tr>
            </thead>
            <tbody>
              {predictions?.map((p: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2 px-4">{p.date}</td>
                  <td className="text-right py-2 px-4 font-medium">${p.predicted?.toFixed(0)}</td>
                  <td className="text-right py-2 px-4 text-slate-500">${p.lower?.toFixed(0)}</td>
                  <td className="text-right py-2 px-4 text-slate-500">${p.upper?.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 시즌성 정보 */}
      {(seasonality?.weekly || seasonality?.monthly) && (
        <Card className="p-6 bg-indigo-50 dark:bg-indigo-900/20">
          <h3 className="text-md font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
            📅 시즌성 패턴 감지
          </h3>
          <p className="text-sm text-indigo-600 dark:text-indigo-400">
            {seasonality?.pattern || (seasonality?.weekly ? '주간 패턴이 감지되었습니다. 특정 요일에 매출 변동이 있습니다.' : '월간 패턴이 감지되었습니다.')}
          </p>
        </Card>
      )}
    </div>
  )
}
