'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardApi, controlTowerApi, artistAnalyticsApi, businessBrainApi, analyticsApi } from '@/lib/api'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { EnhancedKPICard, Tooltip, EnhancedLoadingPage, UnifiedDateFilter, AggregationSelector, KPITooltip } from '@/components/ui'
import type { PeriodPreset, AggregationType } from '@/components/ui'
import { Icon } from '@/components/ui/Icon'
import { iconMap, emojiToIconMap } from '@/lib/icon-mapping'
import { EnhancedLineChart, EnhancedBarChart, GMVTrendChart, StatSummaryCards } from '@/components/charts'
import type { GMVTrendData, StatCardData } from '@/components/charts'
import { 
  DollarSign, Package, BarChart3, Palette, Users, Truck,
  MessageCircle, AlertTriangle, CheckCircle, Zap, Link2,
  FileText, Activity, Calendar, TrendingUp, Lightbulb,
  Circle, AlertCircle
} from 'lucide-react'
// ✅ 공통 유틸리티 import (Phase 1 표준화)
import { formatCurrency, formatChange } from '@/lib/formatters'
// ✅ Phase 2: 고도화 컴포넌트
import { hoverEffects } from '@/lib/hover-effects'
import { showToast } from '@/lib/toast'
// ✅ 브랜드 컴포넌트
import PageHeader from '@/components/PageHeader'
import { BrandFeedback } from '@/components/brand'

export default function DashboardPage() {
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('30d')
  const [aggregation, setAggregation] = useState<AggregationType>('daily')

  useEffect(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 29)
    
    setEndDate(format(today, 'yyyy-MM-dd'))
    setStartDate(format(thirtyDaysAgo, 'yyyy-MM-dd'))
  }, [])

  const handlePeriodChange = (preset: PeriodPreset, start?: string, end?: string) => {
    setPeriodPreset(preset)
    if (start && end) {
      setStartDate(start)
      setEndDate(end)
      // React Query가 자동으로 재실행됨 (queryKey에 startDate, endDate 포함)
    }
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'main', startDate, endDate],
    queryFn: () => dashboardApi.getMain(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })



  // 오늘 할 일
  const { data: tasksData } = useQuery({
    queryKey: ['dashboard-tasks'],
    queryFn: dashboardApi.getTasks,
    staleTime: 2 * 60 * 1000,
  })

  // 물류 파이프라인 데이터
  const { data: pipelineData } = useQuery({
    queryKey: ['control-tower-summary'],
    queryFn: controlTowerApi.getData,
    staleTime: 3 * 60 * 1000,
  })

  // 작가 현황 데이터
  const { data: artistData } = useQuery({
    queryKey: ['artist-overview-summary'],
    queryFn: () => artistAnalyticsApi.getOverview(),
    staleTime: 5 * 60 * 1000,
  })

  // Business Brain 데이터
  const { data: brainHealthData } = useQuery({
    queryKey: ['business-brain-health-dashboard'],
    queryFn: () => businessBrainApi.getHealthScore('30d'),
    staleTime: 5 * 60 * 1000,
  })

  const { data: brainBriefingData } = useQuery({
    queryKey: ['business-brain-briefing-dashboard'],
    queryFn: () => businessBrainApi.getBriefing('30d'),
    staleTime: 5 * 60 * 1000,
  })

  // 통합 대시보드 뷰: 성과 분석 요약 (전일 기준 - Raw Data는 전일까지 갱신)
  const { data: analyticsSummaryData } = useQuery({
    queryKey: ['analytics-summary-dashboard'],
    queryFn: () => analyticsApi.getData('yesterday', 'all'),
    staleTime: 2 * 60 * 1000,
  })

  // 통합 대시보드 뷰: Business Brain 인사이트 및 액션
  const { data: brainInsightsData } = useQuery({
    queryKey: ['business-brain-insights-dashboard'],
    queryFn: () => businessBrainApi.getInsights({ limit: 5 }),
    staleTime: 5 * 60 * 1000,
  })

  const { data: brainActionsData } = useQuery({
    queryKey: ['business-brain-actions-dashboard'],
    queryFn: () => businessBrainApi.getActionProposals('30d'),
    staleTime: 5 * 60 * 1000,
  })

  const handleApply = () => {
    // 쿼리 자동 재실행됨
  }

  // ✅ formatCurrency, formatChange는 @/lib/formatters에서 import (Phase 1 표준화)

  if (isLoading) {
    return <EnhancedLoadingPage message="대시보드 데이터를 불러오는 중..." variant="default" size="lg" />
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    const isNetworkError = errorMessage.includes('Network Error') || errorMessage.includes('ECONNREFUSED')
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800 shadow-lg max-w-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <Icon icon={AlertTriangle} size="lg" className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-800 dark:text-red-200">오류 발생</h2>
              <p className="text-sm text-red-600 dark:text-red-400">데이터를 불러오는 중 문제가 발생했습니다.</p>
            </div>
          </div>
          
          {isNetworkError && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-4">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                <Icon icon={AlertCircle} size="sm" className="text-amber-600 dark:text-amber-400" />
                네트워크 오류 감지
              </p>
              <ul className="text-xs text-amber-700 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  백엔드 서버가 실행 중인지 확인하세요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  포트 3001에서 서버가 실행 중인지 확인하세요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  터미널에서 <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-800">cd backend && npm run dev</code> 실행
                </li>
              </ul>
            </div>
          )}
          
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-xs font-semibold text-gray-600 mb-1">상세 오류 정보:</p>
            <p className="text-xs text-gray-500 font-mono break-all">{errorMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 - 브랜드 일러스트 포함 */}
      <PageHeader
        title="대시보드"
        description="Global Business 핵심 현황"
        icon="📊"
        pageId="dashboard"
        variant="analytics"
      >
        {/* AI 빠른 질문 */}
        <Link 
          href="/chat"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 dark:bg-white/10 backdrop-blur text-white rounded-lg hover:bg-white/30 dark:hover:bg-white/20 transition-all shadow-sm hover:shadow-md border border-white/30"
        >
          <Icon icon={MessageCircle} size="sm" className="text-white" />
          <span className="text-sm font-medium">AI에게 질문</span>
        </Link>
      </PageHeader>

      {/* 통합 날짜 필터 */}
      <UnifiedDateFilter
        startDate={startDate}
        endDate={endDate}
        periodPreset={periodPreset}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onPeriodChange={handlePeriodChange}
        showApplyButton={false}
        className="mb-6"
      />

      {/* 통합 대시보드 뷰 (v4.2 Phase 3) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 성과 분석 요약 (왼쪽) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Icon icon={BarChart3} size="lg" className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">성과 분석 요약</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">전일 운영 현황</p>
              </div>
            </div>
            <Link 
              href="/analytics"
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              상세 보기 →
            </Link>
          </div>

              {/* 전일 핵심 지표 (Raw Data는 매일 11:00 KST에 전일까지 갱신됨) */}
              {analyticsSummaryData && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Tooltip content="전일 발생한 총 상품 거래액 (Raw Data 기준)">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">전일 GMV</div>
                        <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(analyticsSummaryData.summary?.gmv || 0)}
                        </div>
                      </div>
                    </Tooltip>
                    <Tooltip content="전일 발생한 총 주문 건수 (Raw Data 기준)">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">전일 주문</div>
                        <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                          {analyticsSummaryData.summary?.orders || 0}건
                        </div>
                      </div>
                    </Tooltip>
                  </div>

              {/* 긴급 이슈 */}
              {tasksData && tasksData.urgent && tasksData.urgent.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon={AlertTriangle} size="sm" className="text-red-600 dark:text-red-400" />
                    <span className="text-sm font-semibold text-red-800 dark:text-red-200">긴급 이슈</span>
                  </div>
                  <div className="space-y-1">
                    {tasksData.urgent.slice(0, 2).map((task: any, idx: number) => (
                      <div key={idx} className="text-xs text-red-700 dark:text-red-300">
                        • {task.title || task.description || '긴급 작업'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 주요 성과 변화 */}
              {data && (
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 backdrop-blur-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">주요 성과 변화</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">GMV</span>
                      <span className={`font-semibold ${
                        (data.kpis.gmv.change || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatChange(data.kpis.gmv.change || 0, { isRatio: true })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">주문 수</span>
                      <span className={`font-semibold ${
                        (data.kpis.orderCount.change || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatChange(data.kpis.orderCount.change || 0, { isRatio: true })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Business Brain 요약 (오른쪽) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                <Icon icon={iconMap.brain} size="lg" className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Business Brain 요약</h3>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 왼쪽: 건강도 점수 */}
            {brainHealthData?.score && (
              <Tooltip content="비즈니스 전반적인 건강 상태를 종합적으로 평가한 점수입니다. 매출, 고객, 작가, 운영 등 4가지 차원을 종합합니다.">
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 backdrop-blur-sm border border-slate-200 dark:border-slate-700 cursor-help">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">비즈니스 건강도</span>
                    <span className={`text-2xl font-bold ${
                      brainHealthData.score.overall >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                      brainHealthData.score.overall >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {brainHealthData.score.overall}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-4">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        brainHealthData.score.overall >= 70 ? 'bg-emerald-500' :
                        brainHealthData.score.overall >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${brainHealthData.score.overall}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {Object.entries(brainHealthData.score.dimensions).map(([key, dim]: [string, any]) => {
                      const label = key === 'revenue' ? '매출' : key === 'customer' ? '고객' : key === 'artist' ? '작가' : '운영'
                      const tooltipText = key === 'revenue' ? '매출 관련 건강도 지표' : 
                                         key === 'customer' ? '고객 관련 건강도 지표' : 
                                         key === 'artist' ? '작가 관련 건강도 지표' : 
                                         '운영 관련 건강도 지표'
                      return (
                        <Tooltip key={key} content={tooltipText}>
                          <div className="text-center cursor-help p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              {label}
                            </div>
                            <div className={`text-base font-bold ${
                              dim.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
                              dim.trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
                            }`}>
                              {dim.score}
                            </div>
                            <div className="text-xs mt-0.5">
                              {dim.trend === 'up' ? '↗' : dim.trend === 'down' ? '↘' : '→'}
                            </div>
                          </div>
                        </Tooltip>
                      )
                    })}
                  </div>
                </div>
              </Tooltip>
            )}

            {/* 오른쪽: 인사이트 & 액션 */}
            <div className="space-y-4">
              {/* 주요 인사이트 */}
              {brainInsightsData?.insights && brainInsightsData.insights.length > 0 && (
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon={Lightbulb} size="sm" className="text-amber-500" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">주요 인사이트</span>
                  </div>
                  <div className="space-y-2.5">
                    {brainInsightsData.insights.slice(0, 3).map((insight: any, idx: number) => (
                      <div key={idx} className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 pl-1">
                        • {insight.title || insight.description || '인사이트'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 권장 액션 */}
              {brainActionsData?.prioritizedActions && brainActionsData.prioritizedActions.length > 0 && (
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon={Zap} size="sm" className="text-amber-500" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">권장 액션</span>
                  </div>
                  <div className="space-y-2.5">
                    {brainActionsData.prioritizedActions
                      .filter((a: any) => a.priority === 'P0')
                      .slice(0, 3)
                      .map((action: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Icon icon={Circle} size="xs" className="text-red-500 mt-0.5 fill-red-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                              {action.title}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {action.timeline}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 연계 정보 (v4.2 Phase 3) */}
      {(analyticsSummaryData || brainInsightsData || brainActionsData) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon icon={Link2} size="lg" className="text-slate-600 dark:text-slate-400" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">연계 정보</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">성과 분석 ↔ Business Brain 연결</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* 성과 변화 → 인사이트 연결 */}
            <Link
              href="/business-brain?tab=insights"
              className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon icon={BarChart3} size="sm" className="text-blue-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">성과 변화 분석</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                성과 변화를 인사이트로 연결하여 원인 분석
              </p>
            </Link>

            {/* 인사이트 → 액션 연결 */}
            <Link
              href="/business-brain?tab=action-proposals"
              className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon icon={Lightbulb} size="sm" className="text-purple-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">인사이트 → 액션</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                발견된 인사이트를 실행 가능한 액션으로 전환
              </p>
            </Link>

            {/* 액션 → 성과 추적 연결 */}
            <Link
              href="/analytics?tab=daily"
              className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon icon={Zap} size="sm" className="text-emerald-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">액션 추적</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                실행한 액션의 성과를 일일 운영 대시보드에서 추적
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* 긴급 알림 배너 */}
      {data && data.inventoryStatus.delayed > 0 && (
        <Link 
          href="/unreceived?delay=critical"
          className="flex items-center justify-between p-4 bg-red-500 rounded-xl text-white hover:bg-red-600 transition-all shadow-lg"
        >
          <div className="flex items-center gap-3">
            <Icon icon={AlertTriangle} size="xl" className="text-white animate-pulse" />
            <div>
              <p className="font-bold">긴급: {data.inventoryStatus.threshold}일+ 미입고 {data.inventoryStatus.delayed}건 발생</p>
              <p className="text-sm text-red-100">즉시 확인이 필요합니다</p>
            </div>
          </div>
          <span className="px-4 py-2 bg-white/20 rounded-lg font-semibold hover:bg-white/30 transition-colors">
            즉시 확인 →
          </span>
        </Link>
      )}

      {/* KPI 카드 - 6개 (시선 정지점: GMV를 Primary로 강조, 브랜드 이모션 피드백 적용) */}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
            {/* GMV - Primary KPI (시선 정지점) */}
            <EnhancedKPICard
              title="GMV"
              value={data.kpis.gmv.value}
              prefix="₩"
              change={(data.kpis.gmv.change || 0) * 100}
              icon={DollarSign}
              tooltip="Gross Merchandise Value: 총 상품 거래액"
              detailInfo={`전기간 대비 ${formatChange(data.kpis.gmv.change, { isRatio: true })} 변화`}
              isPrimary={true}
              accentColor="orange"
              showBrandFeedback={true}
            />

            {/* 주문 건수 */}
            <EnhancedKPICard
              title="주문 건수"
              value={data.kpis.orderCount.value.toLocaleString()}
              suffix="건"
              change={(data.kpis.orderCount.change || 0) * 100}
              icon={Package}
              tooltip="선택한 기간 동안 발생한 총 주문 건수"
              detailInfo={`전기간 대비 ${formatChange(data.kpis.orderCount.change, { isRatio: true })} 변화`}
              accentColor="blue"
              showBrandFeedback={true}
            />

            {/* AOV */}
            <EnhancedKPICard
              title="AOV"
              value={data.kpis.aov.value}
              prefix="₩"
              change={(data.kpis.aov.change || 0) * 100}
              icon={BarChart3}
              tooltip="Average Order Value: 평균 주문 금액"
              detailInfo={`전기간 대비 ${formatChange(data.kpis.aov.change, { isRatio: true })} 변화`}
              accentColor="purple"
              showBrandFeedback={true}
            />

            {/* 판매 작품 수 */}
            <EnhancedKPICard
              title="판매 작품"
              value={data.kpis.itemCount.value.toLocaleString()}
              suffix="개"
              change={(data.kpis.itemCount.change || 0) * 100}
              icon={Palette}
              tooltip="선택한 기간 동안 판매된 작품 수"
              detailInfo={`전기간 대비 ${formatChange(data.kpis.itemCount.change, { isRatio: true })} 변화`}
              accentColor="purple"
              showBrandFeedback={true}
            />

            {/* 신규 고객 */}
            <EnhancedKPICard
              title="신규 고객"
              value={data.kpis.newCustomers?.value ?? 0}
              suffix="명"
              change={(data.kpis.newCustomers?.change ?? 0) * 100}
              icon={Users}
              tooltip="선택한 기간 동안 신규로 가입한 고객 수"
              detailInfo={`전기간 대비 ${formatChange(data.kpis.newCustomers?.change, { isRatio: true })} 변화`}
              accentColor="green"
              showBrandFeedback={true}
            />

            {/* 배송 완료율 - 낮으면 긴급 표시 */}
            <EnhancedKPICard
              title="배송 완료율"
              value={(data.kpis.deliveryRate?.value ?? 0).toFixed(1)}
              suffix="%"
              change={data.kpis.deliveryRate?.change ?? 0}
              icon={Truck}
              tooltip="배송이 완료된 주문의 비율"
              detailInfo={`전기간 대비 ${(data.kpis.deliveryRate?.change ?? 0) >= 0 ? '+' : ''}${(data.kpis.deliveryRate?.change ?? 0).toFixed(1)}%p 변화`}
              accentColor={(data.kpis.deliveryRate?.value ?? 0) < 80 ? 'red' : 'green'}
              isUrgent={(data.kpis.deliveryRate?.value ?? 0) < 70}
              showBrandFeedback={true}
            />
          </div>

          {/* 트렌드 차트 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 lg:p-6 mb-6 shadow-sm">
            <div className="flex flex-col gap-4 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-idus-500 rounded-xl flex items-center justify-center shadow-sm">
                    <Icon icon={TrendingUp} size="lg" className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">GMV & 주문 추세</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">7일 이동평균 포함</p>
                  </div>
                </div>
              </div>
              
              {/* 집계 단위 선택 (날짜 필터는 상단에서 통합 관리) */}
              <div className="flex items-center justify-end">
                <AggregationSelector
                  value={aggregation}
                  onChange={setAggregation}
                />
              </div>
            </div>
            {data.trend && (() => {
              // Chart.js 데이터를 GMVTrendChart 형식으로 변환
              const chartData: GMVTrendData[] = data.trend.labels.map((label: string, index: number) => {
                const item: GMVTrendData = { 
                  date: label,
                  gmv: 0,
                  orders: 0,
                }
                
                // 각 데이터셋에서 해당 인덱스의 값을 추출
                data.trend.datasets.forEach((dataset: any) => {
                  if (dataset.data && dataset.data[index] !== undefined && dataset.data[index] !== null) {
                    const value = dataset.data[index]
                    
                    // 정확한 라벨 매칭으로 데이터 추출
                    if (dataset.label === 'GMV (일별)') {
                      item.gmv = value
                    } else if (dataset.label === '주문 건수 (일별)') {
                      item.orders = value
                    } else if (dataset.label === 'GMV (7일 이동평균)') {
                      item.gmvMA7 = value
                    } else if (dataset.label === '주문 건수 (7일 이동평균)') {
                      item.ordersMA7 = value
                    }
                  }
                })
                
                return item
              })
              
              // 통계 계산
              const gmvValues = chartData
                .map((d: GMVTrendData) => d.gmv)
                .filter((v) => v > 0)
              const ordersValues = chartData
                .map((d: GMVTrendData) => d.orders)
                .filter((v) => v > 0)
              
              const avgGmv = gmvValues.length > 0 
                ? gmvValues.reduce((a, b) => a + b, 0) / gmvValues.length 
                : 0
              const avgOrders = ordersValues.length > 0 
                ? ordersValues.reduce((a, b) => a + b, 0) / ordersValues.length 
                : 0
              
              const maxGmv = Math.max(...gmvValues, 0)
              const maxGmvIndex = gmvValues.indexOf(maxGmv)
              const maxGmvDate = maxGmvIndex >= 0 ? chartData[maxGmvIndex]?.date : undefined
              
              const maxOrders = Math.max(...ordersValues, 0)
              const maxOrdersIndex = ordersValues.indexOf(maxOrders)
              const maxOrdersDate = maxOrdersIndex >= 0 ? chartData[maxOrdersIndex]?.date : undefined
              
              // 변화율 계산 (첫날 대비 마지막날)
              const firstGmv = gmvValues[0] || 0
              const lastGmv = gmvValues[gmvValues.length - 1] || 0
              const gmvChange = firstGmv > 0 ? ((lastGmv - firstGmv) / firstGmv) * 100 : 0
              
              const firstOrders = ordersValues[0] || 0
              const lastOrders = ordersValues[ordersValues.length - 1] || 0
              const ordersChange = firstOrders > 0 ? ((lastOrders - firstOrders) / firstOrders) * 100 : 0
              
              const stats: StatCardData[] = [
                {
                  label: '평균 일일 GMV',
                  value: avgGmv,
                  change: gmvChange,
                  trend: gmvChange > 0 ? 'up' : gmvChange < 0 ? 'down' : 'stable',
                  format: 'currency',
                },
                {
                  label: '평균 일일 주문',
                  value: avgOrders,
                  change: ordersChange,
                  trend: ordersChange > 0 ? 'up' : ordersChange < 0 ? 'down' : 'stable',
                  format: 'number',
                },
                {
                  label: '최고 GMV',
                  value: maxGmv,
                  date: maxGmvDate ? format(new Date(maxGmvDate), 'MM/dd') : undefined,
                  format: 'currency',
                },
                {
                  label: '최고 주문',
                  value: maxOrders,
                  date: maxOrdersDate ? format(new Date(maxOrdersDate), 'MM/dd') : undefined,
                  format: 'number',
                },
              ]
              
              return (
                <>
                  <StatSummaryCards stats={stats} />
                  <GMVTrendChart
                    data={chartData}
                    height={400}
                    showMovingAverage={true}
                  />
                </>
              )
            })()}
          </div>

          {/* 오늘 할 일 + 물류 파이프라인 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 오늘 할 일 - 우선순위별 분류 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center shadow-sm">
                    <Icon icon={FileText} size="lg" className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-slate-100">오늘 할 일</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{tasksData?.totalTasks || 0}개 항목</p>
                  </div>
                </div>
              </div>
              
              {tasksData?.tasks && tasksData.tasks.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {/* 긴급 */}
                  {tasksData.tasks.filter((t: any) => t.priority === 'high').length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                        <Icon icon={Circle} size="xs" className="fill-red-600 text-red-600" />
                        긴급 ({tasksData.tasks.filter((t: any) => t.priority === 'high').length})
                      </p>
                      <div className="space-y-2">
                        {tasksData.tasks.filter((t: any) => t.priority === 'high').slice(0, 3).map((task: any) => (
                          <Link key={task.id} href={task.link} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors group">
                            <div className="flex items-center gap-2">
                              <span>{task.icon}</span>
                              <span className="text-sm font-medium text-gray-800">{task.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">{task.count}</span>
                              <span className="text-xs text-red-500 group-hover:text-red-700">→</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 중요 */}
                  {tasksData.tasks.filter((t: any) => t.priority === 'medium').length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1">
                        <Icon icon={Circle} size="xs" className="fill-amber-600 text-amber-600" />
                        중요 ({tasksData.tasks.filter((t: any) => t.priority === 'medium').length})
                      </p>
                      <div className="space-y-2">
                        {tasksData.tasks.filter((t: any) => t.priority === 'medium').slice(0, 4).map((task: any) => (
                          <Link key={task.id} href={task.link} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors group">
                            <div className="flex items-center gap-2">
                              <span>{task.icon}</span>
                              <span className="text-sm font-medium text-gray-800">{task.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-bold">{task.count}</span>
                              <span className="text-xs text-amber-500 group-hover:text-amber-700">→</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 참고 */}
                  {tasksData.tasks.filter((t: any) => t.priority === 'low').length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                        <Icon icon={Circle} size="xs" className="fill-slate-600 text-slate-600" />
                        참고 ({tasksData.tasks.filter((t: any) => t.priority === 'low').length})
                      </p>
                      <div className="space-y-2">
                        {tasksData.tasks.filter((t: any) => t.priority === 'low').slice(0, 2).map((task: any) => (
                          <Link key={task.id} href={task.link} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors group">
                            <div className="flex items-center gap-2">
                              <span>{task.icon}</span>
                              <span className="text-sm font-medium text-gray-800">{task.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-slate-400 text-white text-xs rounded-full font-bold">{task.count}</span>
                              <span className="text-xs text-slate-400 group-hover:text-slate-600">→</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Icon icon={CheckCircle} size="xl" className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm">모든 작업이 완료되었습니다!</p>
                </div>
              )}
            </div>

            {/* 물류 파이프라인 미니뷰 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                    <Icon icon={Activity} size="lg" className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-slate-100">물류 현황</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">실시간 파이프라인</p>
                  </div>
                </div>
                <Link href="/control-tower" className="text-xs text-blue-500 hover:text-blue-400 font-medium">
                  상세보기 →
                </Link>
              </div>
              
              {pipelineData?.pipeline ? (
                <>
                  {/* 파이프라인 시각화 */}
                  <div className="flex items-center justify-between mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="text-center flex-1">
                      <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-1">
                        <Icon icon={Package} size="md" className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{pipelineData.pipeline.unreceived?.orderCount || 0}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">미입고</p>
                      {(pipelineData.pipeline.unreceived?.criticalCount || 0) > 0 && (
                        <Tooltip content={`긴급 미입고 ${pipelineData.pipeline.unreceived?.criticalCount}건`}>
                          <span className="text-xs text-red-500 font-medium flex items-center justify-center gap-1">
                            <Icon icon={AlertTriangle} size="xs" />
                            {pipelineData.pipeline.unreceived?.criticalCount}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                    <span className="text-slate-300 dark:text-slate-600">→</span>
                    <div className="text-center flex-1">
                      <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-1">
                        <Icon icon={Truck} size="md" className="text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{pipelineData.pipeline.artistShipping?.orderCount || 0}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">국내배송</p>
                      {(pipelineData.pipeline.artistShipping?.criticalCount || 0) > 0 && (
                        <Tooltip content={`긴급 국내배송 ${pipelineData.pipeline.artistShipping?.criticalCount}건`}>
                          <span className="text-xs text-red-500 font-medium flex items-center justify-center gap-1">
                            <Icon icon={AlertTriangle} size="xs" />
                            {pipelineData.pipeline.artistShipping?.criticalCount}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                    <span className="text-slate-300 dark:text-slate-600">→</span>
                    <div className="text-center flex-1">
                      <div className="w-12 h-12 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-1">
                        <Icon icon={iconMap.search} size="md" className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{pipelineData.pipeline.awaitingInspection?.orderCount || 0}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">검수대기</p>
                      {(pipelineData.pipeline.awaitingInspection?.criticalCount || 0) > 0 && (
                        <Tooltip content={`긴급 검수대기 ${pipelineData.pipeline.awaitingInspection?.criticalCount}건`}>
                          <span className="text-xs text-red-500 font-medium flex items-center justify-center gap-1">
                            <Icon icon={AlertTriangle} size="xs" />
                            {pipelineData.pipeline.awaitingInspection?.criticalCount}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                    <span className="text-slate-300 dark:text-slate-600">→</span>
                    <div className="text-center flex-1">
                      <div className="w-12 h-12 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-1">
                        <Icon icon={iconMap.shipping} size="md" className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{pipelineData.pipeline.internationalShipping?.orderCount || 0}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">국제배송</p>
                      {(pipelineData.pipeline.internationalShipping?.criticalCount || 0) > 0 && (
                        <Tooltip content={`긴급 국제배송 ${pipelineData.pipeline.internationalShipping?.criticalCount}건`}>
                          <span className="text-xs text-red-500 font-medium flex items-center justify-center gap-1">
                            <Icon icon={AlertTriangle} size="xs" />
                            {pipelineData.pipeline.internationalShipping?.criticalCount}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  
                  {/* 요약 통계 */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <p className="text-lg font-bold text-slate-800">
                        {(pipelineData.pipeline.unreceived?.orderCount || 0) + (pipelineData.pipeline.artistShipping?.orderCount || 0) + (pipelineData.pipeline.awaitingInspection?.orderCount || 0) + (pipelineData.pipeline.internationalShipping?.orderCount || 0)}
                      </p>
                      <p className="text-xs text-gray-500">처리중</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-xl">
                      <p className="text-lg font-bold text-red-600">
                        {(pipelineData.pipeline.unreceived?.criticalCount || 0) + (pipelineData.pipeline.artistShipping?.criticalCount || 0) + (pipelineData.pipeline.awaitingInspection?.criticalCount || 0) + (pipelineData.pipeline.internationalShipping?.criticalCount || 0)}
                      </p>
                      <p className="text-xs text-gray-500">위험</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                      <p className="text-lg font-bold text-blue-600">{pipelineData.pipeline.unreceived?.maxDays || 0}</p>
                      <p className="text-xs text-gray-500">최대(일)</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Icon icon={Activity} size="xl" className="mx-auto mb-2 text-slate-400" />
                  <p className="text-sm">물류 데이터를 불러오는 중...</p>
                </div>
              )}
            </div>
          </div>

          {/* 작가 현황 + 빠른 이동 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 작가 현황 요약 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center shadow-sm">
                    <Icon icon={Palette} size="lg" className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">작가 현황</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">활동 작가 요약</p>
                  </div>
                </div>
                <Link href="/artist-analytics" className="text-xs text-pink-500 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 font-medium">
                  상세보기 →
                </Link>
              </div>
              
              {artistData?.summary ? (
                <>
                  {/* 작가 통계 */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-100 dark:border-pink-800">
                      <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{artistData.summary.activeArtists || data.snapshot.activeArtists || 0}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">활성 작가</p>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{artistData.summary.totalArtists || 0}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">전체 작가</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{artistData.summary.activeRate?.toFixed(1) || 0}%</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">활성률</p>
                    </div>
                  </div>
                  
                  {/* 매출 집중도 */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon icon={BarChart3} size="sm" className="text-slate-600 dark:text-slate-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">매출 집중도</span>
                      </div>
                      <Tooltip content="상위 20% 작가가 전체 매출의 비율">
                        <span className="text-sm font-bold text-pink-600 dark:text-pink-400 cursor-help">
                          상위 20% → 매출 {artistData.concentration?.top20Percent?.toFixed(1) || 68}%
                        </span>
                      </Tooltip>
                    </div>
                    <div className="mt-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-pink-500 dark:bg-pink-600 rounded-full"
                        style={{ width: `${artistData.concentration?.top20Percent || 68}%` }}
                      ></div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Icon icon={Palette} size="xl" className="mx-auto mb-2 text-slate-400" />
                  <p className="text-sm">작가 데이터를 불러오는 중...</p>
                </div>
              )}
            </div>

            {/* 빠른 이동 - 8개 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-idus-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Icon icon={Zap} size="lg" className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">빠른 이동</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">자주 사용하는 기능</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Tooltip content="미입고 주문 관리 및 처리">
                  <Link href="/unreceived" className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 group ${hoverEffects.card}`}>
                    <Icon icon={Package} size="md" className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">미입고 관리</span>
                  </Link>
                </Tooltip>
                
                <Tooltip content="비용 분석 및 정책 시뮬레이션">
                  <Link href="/cost-analysis" className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 group ${hoverEffects.card}`}>
                    <Icon icon={DollarSign} size="md" className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">비용 분석</span>
                  </Link>
                </Tooltip>
                
                <Tooltip content="일일/주간/월간 성과 분석">
                  <Link href="/analytics" className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 group ${hoverEffects.card}`}>
                    <Icon icon={TrendingUp} size="md" className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">성과 분석</span>
                  </Link>
                </Tooltip>
                
                <Tooltip content="통합 검색 및 조회">
                  <Link href="/lookup" className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 group ${hoverEffects.card}`}>
                    <Icon icon={iconMap.search} size="md" className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">통합 검색</span>
                  </Link>
                </Tooltip>
                
                <Tooltip content="물류 파이프라인 관제">
                  <Link href="/control-tower" className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 group ${hoverEffects.card}`}>
                    <Icon icon={Activity} size="md" className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">물류 관제</span>
                  </Link>
                </Tooltip>
                
                <Tooltip content="작가 분석 및 현황">
                  <Link href="/artist-analytics" className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 group ${hoverEffects.card}`}>
                    <Icon icon={Palette} size="md" className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">작가 분석</span>
                  </Link>
                </Tooltip>
                
                <Tooltip content="AI 어시스턴트 채팅">
                  <Link href="/chat" className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 group ${hoverEffects.card}`}>
                    <Icon icon={MessageCircle} size="md" className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">AI 채팅</span>
                  </Link>
                </Tooltip>
                
                <Tooltip content="정산 관리 및 내역">
                  <Link href="/settlement" className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 group ${hoverEffects.card}`}>
                    <Icon icon={FileText} size="md" className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">정산 관리</span>
                  </Link>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* AI 인사이트 */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Icon icon={MessageCircle} size="lg" className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">AI 인사이트</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">데이터 기반 분석 요약</p>
                </div>
              </div>
              <Link href="/chat" className="text-xs text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-medium">
                더 질문하기 →
              </Link>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <Icon icon={BarChart3} size="sm" className="inline mr-1 text-slate-600 dark:text-slate-400" />
                "이번 기간 GMV가 전기간 대비 <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{((data.kpis.gmv.change || 0) * 100).toFixed(1)}%</span> 변동했습니다. 
                총 <span className="font-semibold text-violet-600 dark:text-violet-400">{data.kpis.orderCount.value.toLocaleString()}건</span>의 주문이 발생했으며, 
                평균 객단가는 <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(data.kpis.aov.value)}</span>입니다."
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Link href="/chat?q=최근 매출 현황 분석해줘" className="px-3 py-1.5 bg-white border border-violet-200 rounded-full text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors">
                최근 매출 현황
              </Link>
              <Link href="/chat?q=작가 랭킹 보여줘" className="px-3 py-1.5 bg-white border border-violet-200 rounded-full text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors">
                작가 랭킹
              </Link>
              <Link href="/chat?q=국가별 매출 비교해줘" className="px-3 py-1.5 bg-white border border-violet-200 rounded-full text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors">
                국가별 비교
              </Link>
              <Link href="/chat?q=미입고 현황 알려줘" className="px-3 py-1.5 bg-white border border-violet-200 rounded-full text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors">
                미입고 현황
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
