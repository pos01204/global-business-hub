'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { businessBrainApi } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Tooltip } from '@/components/ui/Tooltip'
import { Icon } from '@/components/ui/Icon'
import { EnhancedLoadingPage } from '@/components/ui'
import { iconMap } from '@/lib/icon-mapping'
import { 
  Brain, BarChart3, Users, Palette, TrendingUp, Calendar,
  Lightbulb, AlertTriangle, Target, FileText, Search,
  Zap, CheckCircle, XCircle, Info, Circle, MessageCircle,
  DollarSign, Activity, ArrowRight,
  type LucideIcon
} from 'lucide-react'
// ✅ 공통 유틸리티 import (Phase 1 표준화)
import { formatKRW, toKRW, formatCurrency } from '@/lib/formatters'
import { CURRENCY } from '@/config/constants'
// v4.2: 신뢰도 컴포넌트
import { ConfidenceBadge } from '@/components/business-brain/ConfidenceBadge'
import { ConfidenceInterval } from '@/components/business-brain/ConfidenceInterval'
import { DataQualityIndicator } from '@/components/business-brain/DataQualityIndicator'
import { AnalysisDetailDrawer } from '@/components/business-brain/AnalysisDetailDrawer'
// v4.3: 차트 컴포넌트
import { LineChart, BarChart, DoughnutChart, RadarChart, HeatmapChart } from '@/components/business-brain/charts'
// v5.0: ECharts 기반 고급 차트
import { 
  EChartsTrendChart, 
  EChartsPieChart, 
  EChartsBarChart, 
  EChartsRadar,
  EChartsHeatmap 
} from '@/components/business-brain/charts'
import { statisticsEngine } from '@/lib/statistics/StatisticsEngine'
// v4.3: What-if 시뮬레이션 탭
import { WhatIfSimulationTab } from './components/WhatIfSimulationTab'
// v4.3: 리포트 생성 컴포넌트
import { ReportGenerator } from './components/ReportGenerator'
// v5.0: AI 자연어 질의 채팅
import { AIQueryChat } from './components/AIQueryChat'
// v5.0: 새 UX 뷰 컴포넌트 (레거시)
import { CommandCenter, ActionHub, DeepDive } from '@/components/business-brain'
// v6.0: 통합 탭 컴포넌트
import { 
  UnifiedHome, 
  UnifiedCustomerTab, 
  UnifiedRevenueTab, 
  UnifiedInsightTab, 
  UnifiedActionTab,
  DataExplorer,
  UnifiedReportTab,
  KeyboardShortcutHelp
} from '@/components/business-brain'

// 기간 프리셋 타입
type PeriodPreset = '7d' | '30d' | '90d' | '180d' | '365d'

// ✅ 환율 상수 및 포맷팅 함수는 @/lib/formatters, @/config/constants에서 import (Phase 1 표준화)
// const USD_TO_KRW = 1350  // 삭제됨 - CURRENCY.USD_TO_KRW 사용
// function formatKRW(usdAmount: number) // 삭제됨 - @/lib/formatters 사용
// function toKRW(usdAmount: number) // 삭제됨 - @/lib/formatters 사용

// ==================== 애니메이션 훅 ====================

// 숫자 카운트업 애니메이션 훅
function useCountUp(end: number, duration: number = 1000, start: number = 0): number {
  const [count, setCount] = useState(start)
  const countRef = useRef(start)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (end === 0) {
      setCount(0)
      return
    }
    
    startTimeRef.current = null
    countRef.current = start
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)
      
      // easeOutExpo 이징
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const currentCount = start + (end - start) * easeProgress
      
      setCount(currentCount)
      countRef.current = currentCount
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [end, duration, start])

  return count
}

// 페이드인 애니메이션 컴포넌트
function FadeIn({ children, delay = 0, className = '' }: { 
  children: React.ReactNode
  delay?: number
  className?: string 
}) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div 
      className={`transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  )
}

// 스켈레톤 로딩 컴포넌트
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} />
  )
}

// 빈 상태 컴포넌트
function EmptyState({ 
  icon, 
  title, 
  description 
}: { 
  icon?: React.ReactNode | LucideIcon
  title: string
  description: string 
}) {
  // icon이 LucideIcon 컴포넌트인 경우 Icon으로 감싸기
  const renderIcon = () => {
    if (!icon) return null
    
    if (typeof icon === 'string') {
      return <div className="text-6xl">{icon}</div>
    }
    
    // LucideIcon인 경우 (함수 컴포넌트)
    if (typeof icon === 'function') {
      return <Icon icon={icon as LucideIcon} size="xl" className="text-slate-400" />
    }
    
    // 이미 ReactNode인 경우
    return icon as React.ReactNode
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {icon && (
        <div className="mb-4 animate-bounce">
          {renderIcon()}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">{description}</p>
    </div>
  )
}

// 애니메이션 숫자 표시 컴포넌트
function AnimatedNumber({ 
  value, 
  prefix = '', 
  suffix = '',
  decimals = 0,
  className = ''
}: { 
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string 
}) {
  const animatedValue = useCountUp(value, 800)
  
  return (
    <span className={className}>
      {prefix}{decimals > 0 ? animatedValue.toFixed(decimals) : Math.round(animatedValue).toLocaleString()}{suffix}
    </span>
  )
}

// ==================== 다운로드 버튼 컴포넌트 (v4.0) ====================

type ExportType = 
  | 'rfm-segments'
  | 'rfm-customers'
  | 'cohort-analysis'
  | 'pareto-artists'
  | 'anomaly-detection'
  | 'insights'
  | 'health-score'
  | 'trends'

const EXPORT_TYPE_LABELS: Record<ExportType, string> = {
  'rfm-segments': 'RFM 세그먼트',
  'rfm-customers': 'RFM 고객 목록',
  'cohort-analysis': '코호트 분석',
  'pareto-artists': '작가 파레토',
  'anomaly-detection': '이상 탐지',
  'insights': '인사이트',
  'health-score': '건강도 점수',
  'trends': '트렌드 분석'
}

function ExportButton({ 
  type, 
  period = '30d',
  segment,
  label,
  variant = 'default'
}: { 
  type: ExportType
  period?: string
  segment?: string
  label?: string
  variant?: 'default' | 'icon-only'
}) {
  const [isExporting, setIsExporting] = useState(false)
  
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const url = businessBrainApi.getExportUrl(type, period as any, segment)
      const link = document.createElement('a')
      link.href = url
      link.download = ''
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setTimeout(() => setIsExporting(false), 1000)
    }
  }
  
  if (variant === 'icon-only') {
    return (
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        title={`${label || EXPORT_TYPE_LABELS[type]} 다운로드`}
      >
        {isExporting ? (
          <svg className="w-5 h-5 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
      </button>
    )
  }
  
  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
    >
      {isExporting ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>다운로드 중...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>{label || '다운로드'}</span>
        </>
      )}
    </button>
  )
}

// 다운로드 드롭다운 메뉴 컴포넌트
function ExportDropdown({ 
  types, 
  period = '30d' 
}: { 
  types: { type: ExportType; label: string }[]
  period?: string 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleExport = (type: ExportType) => {
    const url = businessBrainApi.getExportUrl(type, period as any)
    const link = document.createElement('a')
    link.href = url
    link.download = ''
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setIsOpen(false)
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>다운로드</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
          {types.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => handleExport(type)}
              className="w-full px-4 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' },
  { value: '90d', label: '최근 90일' },
  { value: '180d', label: '최근 180일' },
  { value: '365d', label: '최근 1년' },
]

export default function BusinessBrainPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabFromUrl = searchParams.get('tab')
  
  // v6.0: 기본 탭을 'home'으로 변경
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'home')
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodPreset>('30d')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  
  // v6.0: 키보드 단축키 (간소화)
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false)
  const closeShortcutHelp = useCallback(() => setIsShortcutHelpOpen(false), [])

  // URL 쿼리 파라미터 변경 시 탭 업데이트
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  // 탭 변경 시 URL 업데이트
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab)
    router.push(`/business-brain?tab=${newTab}`, { scroll: false })
  }, [router])

  // v6.0: 탭 네비게이션 단축키 (간소화 - 숫자키로 탭 이동)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 비활성화
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
      
      const tabMap: Record<string, string> = {
        '1': 'home', '2': 'customer', '3': 'artist', '4': 'revenue',
        '5': 'insight', '6': 'action', '7': 'explorer', '8': 'report'
      }
      
      if (tabMap[e.key]) {
        handleTabChange(tabMap[e.key])
      }
      
      // Ctrl+/ 또는 ? 로 단축키 도움말 열기
      if ((e.key === '/' && (e.ctrlKey || e.metaKey)) || (e.key === '?' && e.shiftKey)) {
        e.preventDefault()
        setIsShortcutHelpOpen((prev: boolean) => !prev)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleTabChange])

  // 데이터 쿼리 (기간 기반)
  const { data: briefingData, isLoading: briefingLoading } = useQuery({
    queryKey: ['business-brain-briefing', selectedPeriod],
    queryFn: () => businessBrainApi.getBriefing(selectedPeriod),
    staleTime: 5 * 60 * 1000,
  })

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['business-brain-health', selectedPeriod],
    queryFn: () => businessBrainApi.getHealthScore(selectedPeriod),
    staleTime: 5 * 60 * 1000,
  })

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['business-brain-insights'],
    queryFn: () => businessBrainApi.getInsights({ limit: 50 }),
    staleTime: 5 * 60 * 1000,
  })

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['business-brain-trends', selectedPeriod],
    queryFn: () => businessBrainApi.getTrends(selectedPeriod),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: activeTab === 'trends' || activeTab === 'revenue' || activeTab === 'home',
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const { data: checksData, isLoading: checksLoading } = useQuery({
    queryKey: ['business-brain-checks'],
    queryFn: businessBrainApi.getHumanErrorChecks,
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'risks',
  })

  const { data: strategyAnalysisData, isLoading: strategyAnalysisLoading } = useQuery({
    queryKey: ['business-brain-strategy-analysis', selectedPeriod],
    queryFn: () => businessBrainApi.getStrategyAnalysis(selectedPeriod),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'strategy-analysis',
  })

  const { data: actionProposalsData, isLoading: actionProposalsLoading } = useQuery({
    queryKey: ['business-brain-action-proposals', selectedPeriod],
    queryFn: () => businessBrainApi.getActionProposals(selectedPeriod),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'action-proposals',
  })

  // What-if 시뮬레이션 템플릿
  const { data: whatIfTemplatesData } = useQuery({
    queryKey: ['business-brain-what-if-templates'],
    queryFn: () => businessBrainApi.getWhatIfTemplates(),
    staleTime: 30 * 60 * 1000, // 30분
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
    enabled: activeTab === 'rfm' || activeTab === 'customer',
  })

  const { data: paretoData, isLoading: paretoLoading } = useQuery({
    queryKey: ['business-brain-pareto', selectedPeriod],
    queryFn: () => businessBrainApi.getAnalysisByPeriod('pareto', selectedPeriod),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'pareto' || activeTab === 'artist',
  })

  const { data: cohortData, isLoading: cohortLoading } = useQuery({
    queryKey: ['business-brain-cohort', selectedPeriod],
    queryFn: () => businessBrainApi.getAnalysisByPeriod('cohort', selectedPeriod),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'cohort' || activeTab === 'revenue',
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
    enabled: activeTab === 'forecast' || activeTab === 'revenue',
  })

  // 종합 인사이트 (overview/home 탭에 통합)
  const { data: comprehensiveData, isLoading: comprehensiveLoading } = useQuery({
    queryKey: ['business-brain-comprehensive', selectedPeriod],
    queryFn: () => businessBrainApi.getComprehensiveAnalysis(selectedPeriod),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'overview' || activeTab === 'home',
  })

  // v4.1: 신규 유저 유치 분석
  const { data: newUserData, isLoading: newUserLoading } = useQuery({
    queryKey: ['business-brain-new-users', selectedPeriod],
    queryFn: async () => {
      try {
        const response = await businessBrainApi.getNewUserAcquisition(selectedPeriod === '7d' ? '90d' : selectedPeriod as any)
        return response?.success ? response : null
      } catch (error) {
        console.warn('[BusinessBrain] 신규 유저 유치 분석 API 오류:', error)
        return null
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'new-users' || activeTab === 'customer',
  })

  // v4.1: 재구매율 향상 분석
  const { data: repurchaseData, isLoading: repurchaseLoading } = useQuery({
    queryKey: ['business-brain-repurchase', selectedPeriod],
    queryFn: async () => {
      try {
        const response = await businessBrainApi.getRepurchaseAnalysis(selectedPeriod === '7d' ? '90d' : selectedPeriod as any)
        return response?.success ? response : null
      } catch (error) {
        console.warn('[BusinessBrain] 재구매율 향상 분석 API 오류:', error)
        return null
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'repurchase' || activeTab === 'customer',
  })

  // 다중 기간 트렌드
  const { data: multiPeriodData, isLoading: multiPeriodLoading } = useQuery({
    queryKey: ['business-brain-multi-period'],
    queryFn: () => businessBrainApi.getMultiPeriodAnalysis('monthly', 6),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'multiperiod',
  })

  // v4.0: 이탈 예측
  const { data: churnData, isLoading: churnLoading } = useQuery({
    queryKey: ['business-brain-churn', selectedPeriod],
    queryFn: () => businessBrainApi.getChurnPrediction(selectedPeriod === '7d' ? '90d' : selectedPeriod as any),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'churn' || activeTab === 'customer',
  })

  // v4.0: 작가 건강도
  const { data: artistHealthData, isLoading: artistHealthLoading } = useQuery({
    queryKey: ['business-brain-artist-health', selectedPeriod],
    queryFn: () => businessBrainApi.getArtistHealth(selectedPeriod === '7d' ? '90d' : selectedPeriod as any),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'artist-health' || activeTab === 'artist',
  })

  // Phase 4: 쿠폰 인사이트
  const { data: couponInsightsData, isLoading: couponInsightsLoading } = useQuery({
    queryKey: ['business-brain-coupon-insights', selectedPeriod],
    queryFn: () => businessBrainApi.getCouponInsights(selectedPeriod),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'coupon',
  })

  // Phase 4: 리뷰 인사이트
  const { data: reviewInsightsData, isLoading: reviewInsightsLoading } = useQuery({
    queryKey: ['business-brain-review-insights', selectedPeriod],
    queryFn: () => businessBrainApi.getReviewInsights(selectedPeriod),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'review',
  })

  const briefing = briefingData?.briefing
  const healthScore = healthData?.score
  const insights = insightsData?.insights || []
  const trends = trendsData?.trends || []
  const checks = checksData?.checks || []
  const recommendations = recommendationsData?.recommendations

  const isLoading = briefingLoading || healthLoading

  // v6.0: 통합 탭 구조 (Phase 4: 쿠폰/리뷰 탭 추가)
  const tabGroups = useMemo(() => [
    {
      name: '개요',
      description: '비즈니스 현황 한눈에 보기',
      tabs: [
        { id: 'home', label: '홈', icon: BarChart3, description: 'AI 브리핑 + KPI + 인사이트 + 권장 액션' },
      ]
    },
    {
      name: '분석',
      description: '핵심 비즈니스 분석',
      tabs: [
        { id: 'customer', label: '고객', icon: Users, description: 'RFM + 이탈 예측 + 신규 유입 + 재구매' },
        { id: 'artist', label: '작가', icon: Palette, description: '작가 건강도 + 파레토 분석' },
        { id: 'revenue', label: '매출', icon: TrendingUp, description: '트렌드 + 예측 + 코호트' },
        { id: 'coupon', label: '쿠폰', icon: Target, description: '쿠폰 성과 + ROI + 전환율 분석' },
        { id: 'review', label: '리뷰', icon: MessageCircle, description: 'NPS + 평점 + 작가별 리뷰 분석' },
      ]
    },
    {
      name: '인사이트 & 액션',
      description: 'AI 인사이트 및 실행',
      tabs: [
        { id: 'insight', label: '인사이트', icon: Lightbulb, description: '기회 + 리스크 + 전략 통합' },
        { id: 'action', label: '액션', icon: Zap, description: '권장 액션 + What-if 시뮬레이션' },
      ]
    },
    {
      name: '도구',
      description: '고급 분석 도구',
      tabs: [
        { id: 'explorer', label: '탐색기', icon: Search, description: '데이터 심층 탐색' },
        { id: 'report', label: '리포트', icon: FileText, description: '분석 결과 리포트 생성' },
      ]
    },
  ], [])

  // 평면화된 탭 목록 (Tabs 컴포넌트용) - useMemo로 최적화
  const tabItems = useMemo(() => 
    tabGroups.flatMap(g => g.tabs.map(t => ({ 
      id: t.id, 
      label: t.label,
      icon: t.icon
    }))),
    [tabGroups]
  )

  // 기간 선택이 필요한 탭들 (Phase 4: 쿠폰/리뷰 탭 추가)
  const periodEnabledTabs = ['home', 'customer', 'artist', 'revenue', 'coupon', 'review', 'insight', 'action', 'explorer', 'report']

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* 헤더 - idus 브랜드 스타일 */}
      <FadeIn>
        <div className="relative bg-idus-500 dark:bg-orange-900/70 rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden shadow-lg dark:shadow-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center justify-between flex-wrap gap-4 relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 dark:bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg dark:shadow-none">
                <Icon icon={Brain} size="xl" className="text-white" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">
                  Business Brain
                </h1>
                <p className="text-idus-100 dark:text-orange-200/80 text-xs lg:text-sm font-medium">
                  AI 기반 경영 인사이트 시스템
                </p>
              </div>
            </div>
            {healthScore ? (
              <Tooltip content="비즈니스 전반적인 건강 상태를 종합적으로 평가한 점수입니다. 매출, 고객, 작가, 운영 등 4가지 차원을 종합합니다.">
                <div className="text-right p-4 bg-white/20 dark:bg-white/10 backdrop-blur rounded-xl border border-white/30 dark:border-white/20 cursor-help">
                  <div className="text-xs font-medium text-white/90 dark:text-white/80 uppercase tracking-wide mb-1">비즈니스 건강도</div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold text-white transition-all duration-500`}>
                      <AnimatedNumber value={healthScore.overall} />
                    </span>
                    <span className="text-lg text-white/80">/100</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-white/30 dark:bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        healthScore.overall >= 70 ? 'bg-emerald-300' :
                        healthScore.overall >= 50 ? 'bg-amber-300' : 'bg-red-300'
                      }`}
                      style={{ width: `${healthScore.overall}%` }}
                    />
                  </div>
                </div>
              </Tooltip>
            ) : (
              <div className="p-4 bg-white/20 dark:bg-white/10 backdrop-blur rounded-xl border border-white/30 dark:border-white/20">
                <Skeleton className="h-4 w-24 mb-2 bg-white/30" />
                <Skeleton className="h-10 w-20 bg-white/30" />
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      {/* 기간 및 국가 필터 (해당 탭에서만 표시) */}
      {periodEnabledTabs.includes(activeTab) && (
        <FadeIn delay={100}>
          <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Icon icon={Calendar} size="sm" className="text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">분석 기간:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {PERIOD_OPTIONS.map(option => (
                <Tooltip key={option.value} content={`${option.label} 데이터를 분석합니다`}>
                  <button
                    onClick={() => setSelectedPeriod(option.value)}
                    className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                      selectedPeriod === option.value
                        ? 'bg-idus-500 text-white shadow-md scale-105'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 hover:scale-102 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {option.label}
                  </button>
                </Tooltip>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">국가:</span>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-idus-500 focus:border-idus-500"
              >
                <option value="all">전체</option>
                <option value="KR">한국</option>
                <option value="US">미국</option>
                <option value="JP">일본</option>
                <option value="GB">영국</option>
                <option value="CA">캐나다</option>
              </select>
            </div>
          </div>
        </FadeIn>
      )}

      {/* 탭 그룹 네비게이션 (v4.1 개선) */}
      <FadeIn delay={150}>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="space-y-6">
            {tabGroups.map((group, groupIdx) => (
              <div key={group.name}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {group.name}
                  </h3>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {group.description}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.tabs.map((tab) => (
                    <Tooltip key={tab.id} content={tab.description}>
                      <button
                        onClick={() => handleTabChange(tab.id)}
                        className={`group relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                          activeTab === tab.id
                            ? 'bg-idus-500 text-white shadow-md scale-105'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-102'
                        }`}
                      >
                        <Icon 
                          icon={tab.icon} 
                          size="sm" 
                          className={activeTab === tab.id ? 'text-white' : 'text-slate-600 dark:text-slate-400'} 
                        />
                        <span>{tab.label}</span>
                        {activeTab === tab.id && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"></span>
                        )}
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {isLoading ? (
        <FadeIn>
          <EnhancedLoadingPage 
            message="AI가 데이터를 분석하고 있습니다..." 
            variant="default" 
            size="lg" 
          />
        </FadeIn>
      ) : (
        <>
          {/* v6.0: 통합 홈 탭 */}
          {activeTab === 'home' && (
            <UnifiedHome
              briefing={briefing}
              healthScore={healthScore}
              comprehensiveData={comprehensiveData}
              trendsData={trendsData}
              insightsData={insightsData}
              isLoading={comprehensiveLoading || briefingLoading || trendsLoading || insightsLoading}
              period={selectedPeriod}
              onTabChange={handleTabChange}
              onRefresh={() => {
                // 데이터 새로고침 로직
              }}
            />
          )}

          {/* v6.0: 통합 고객 탭 */}
          {activeTab === 'customer' && (
            <UnifiedCustomerTab
              rfmData={rfmData}
              churnData={churnData}
              newUserData={newUserData}
              repurchaseData={repurchaseData}
              isLoading={rfmLoading || churnLoading}
              period={selectedPeriod}
            />
          )}

          {/* v6.0: 통합 작가 탭 */}
          {activeTab === 'artist' && (
            <div className="space-y-6">
              {/* AI 인사이트 배너 */}
              <FadeIn>
                <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                        <Icon icon={Palette} size="md" className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">AI 작가 인사이트</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          작가 건강도, 성과, 파레토 분석을 AI가 분석하여 핵심 인사이트를 제공합니다.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/artist-analytics')}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      <span>상세 분석 보기</span>
                      <Icon icon={ArrowRight} size="xs" />
                    </button>
                  </div>
                </Card>
              </FadeIn>
              <ArtistHealthTab data={artistHealthData} isLoading={artistHealthLoading} />
            </div>
          )}

          {/* v6.0: 통합 매출 탭 */}
          {activeTab === 'revenue' && (
            <UnifiedRevenueTab
              trendsData={trendsData}
              forecastData={forecastData}
              cohortData={cohortData}
              multiPeriodData={multiPeriodData}
              isLoading={trendsLoading || forecastLoading}
              period={selectedPeriod}
            />
          )}

          {/* v6.0: 통합 인사이트 탭 */}
          {activeTab === 'insight' && (
            <UnifiedInsightTab
              insightsData={insightsData}
              risksData={checksData}
              strategyData={strategyAnalysisData}
              isLoading={insightsLoading || checksLoading}
              period={selectedPeriod}
              onActionClick={(action) => {
                console.log('Action clicked:', action)
                handleTabChange('action')
              }}
            />
          )}

          {/* v6.0: 통합 액션 탭 */}
          {activeTab === 'action' && (
            <UnifiedActionTab
              actionsData={actionProposalsData}
              isLoading={actionProposalsLoading}
              period={selectedPeriod}
              onSimulationClick={() => handleTabChange('what-if')}
            />
          )}

          {/* Phase 4: 쿠폰 인사이트 탭 */}
          {activeTab === 'coupon' && (
            <CouponInsightsTab
              data={couponInsightsData}
              isLoading={couponInsightsLoading}
              period={selectedPeriod}
            />
          )}

          {/* Phase 4: 리뷰 인사이트 탭 */}
          {activeTab === 'review' && (
            <ReviewInsightsTab
              data={reviewInsightsData}
              isLoading={reviewInsightsLoading}
              period={selectedPeriod}
            />
          )}

          {/* v6.0: 데이터 탐색기 */}
          {activeTab === 'explorer' && (
            <DataExplorer
              customerCount={comprehensiveData?.summary?.customers || 892}
              artistCount={comprehensiveData?.summary?.artists || 245}
              productCount={1234}
              countryCount={15}
            />
          )}

          {/* 대시보드 탭 (현황 평가 + 종합 인사이트 통합) - 레거시 */}
          {activeTab === 'overview' && (
            <OverviewTab 
              briefing={briefing} 
              healthScore={healthScore} 
              comprehensiveData={comprehensiveData}
              comprehensiveLoading={comprehensiveLoading}
              period={selectedPeriod} 
            />
          )}

          {/* 트렌드 분석 탭 */}
          {activeTab === 'trends' && (
            <TrendsTab trends={trends} trendsData={trendsData} isLoading={trendsLoading} period={selectedPeriod} />
          )}

          {/* 리스크 감지 탭 */}
          {activeTab === 'risks' && (
            <RisksTab checks={checks} isLoading={checksLoading} summary={checksData?.summary} />
          )}

          {/* 기회 발견 탭 */}
          {activeTab === 'insights' && (
            <InsightsTab insights={insights} isLoading={insightsLoading} period={selectedPeriod} />
          )}

          {/* 전략 분석 탭 (v4.2 Phase 3) */}
          {activeTab === 'strategy-analysis' && (
            <StrategyAnalysisTab data={strategyAnalysisData} isLoading={strategyAnalysisLoading} period={selectedPeriod} />
          )}

          {/* 액션 제안 탭 (v4.2 Phase 3) */}
          {activeTab === 'action-proposals' && (
            <ActionProposalsTab data={actionProposalsData} isLoading={actionProposalsLoading} period={selectedPeriod} />
          )}

          {/* What-if 시뮬레이션 탭 (v4.3) */}
          {activeTab === 'what-if' && (
            <WhatIfSimulationTab 
              period={selectedPeriod}
              templates={whatIfTemplatesData?.templates || []}
            />
          )}

          {/* v6.0: 통합 리포트 탭 */}
          {activeTab === 'report' && (
            <UnifiedReportTab 
              period={selectedPeriod} 
              healthScore={healthScore}
              briefing={briefing}
              insights={insights}
            />
          )}

          {/* v5.0: 커맨드 센터 탭 */}
          {activeTab === 'command-center' && (
            <CommandCenter
              isLoading={isLoading}
              onKPIClick={(kpiId) => {
                console.log('KPI clicked:', kpiId)
                // 관련 탭으로 이동
                if (kpiId === 'gmv') handleTabChange('trends')
                else if (kpiId === 'customers') handleTabChange('rfm')
              }}
              onAlertClick={(alertId) => {
                console.log('Alert clicked:', alertId)
              }}
            />
          )}

          {/* v5.0: 액션 허브 탭 */}
          {activeTab === 'action-hub' && (
            <ActionHub
              isLoading={insightsLoading}
              onActionComplete={(actionId) => {
                console.log('Action completed:', actionId)
              }}
            />
          )}

          {/* v5.0: 딥 다이브 탭 */}
          {activeTab === 'deep-dive' && (
            <DeepDive
              isLoading={false}
            />
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

          {/* v4.1: 신규 유저 유치 탭 */}
          {activeTab === 'new-users' && (
            <NewUserAcquisitionTab data={newUserData} isLoading={newUserLoading} period={selectedPeriod} />
          )}

          {/* v4.1: 재구매율 향상 탭 */}
          {activeTab === 'repurchase' && (
            <RepurchaseAnalysisTab data={repurchaseData} isLoading={repurchaseLoading} period={selectedPeriod} />
          )}

          {/* 기간별 추이 탭 */}
          {activeTab === 'multiperiod' && (
            <MultiPeriodTab data={multiPeriodData} isLoading={multiPeriodLoading} />
          )}

          {/* 매출 예측 탭 */}
          {activeTab === 'forecast' && (
            <ForecastTab data={forecastData} isLoading={forecastLoading} />
          )}

          {/* v4.0: 이탈 예측 탭 */}
          {activeTab === 'churn' && (
            <ChurnPredictionTab data={churnData} isLoading={churnLoading} period={selectedPeriod} />
          )}

          {/* v4.0: 작가 건강도 탭 */}
          {activeTab === 'artist-health' && (
            <ArtistHealthTab data={artistHealthData} isLoading={artistHealthLoading} />
          )}
        </>
      )}

      {/* v5.0: AI 자연어 질의 채팅 (플로팅) */}
      <AIQueryChat 
        onInsightClick={(data) => {
          console.log('AI Insight Data:', data)
        }}
      />

      {/* v6.0: 키보드 단축키 도움말 모달 */}
      <KeyboardShortcutHelp 
        isOpen={isShortcutHelpOpen} 
        onClose={closeShortcutHelp} 
      />
    </div>
  )
}

// 기간 레이블 헬퍼
function getPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    '7d': '최근 7일',
    '30d': '최근 30일',
    '90d': '최근 90일',
    '180d': '최근 180일',
    '365d': '최근 1년',
  }
  return labels[period] || period
}

// Phase 4: 쿠폰 인사이트 탭
function CouponInsightsTab({ data, isLoading, period }: { data: any; isLoading: boolean; period: string }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const insights = data?.insights
  if (!insights) {
    return (
      <Card className="p-8 text-center">
        <Icon icon={Target} size="xl" className="text-slate-400 mx-auto mb-4" />
        <p className="text-slate-500">쿠폰 인사이트 데이터를 불러올 수 없습니다.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 요약 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">총 발행</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{insights.summary?.totalIssued?.toLocaleString() || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">총 사용</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{insights.summary?.totalUsed?.toLocaleString() || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">전환율</p>
          <p className="text-2xl font-bold text-emerald-600">{((insights.summary?.overallConversionRate || 0) * 100).toFixed(1)}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">ROI</p>
          <p className="text-2xl font-bold text-violet-600">{insights.summary?.roi?.toFixed(1) || 0}x</p>
        </Card>
      </div>

      {/* TOP 성과 쿠폰 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Icon icon={TrendingUp} size="md" className="text-emerald-500" />
          TOP 성과 쿠폰
        </h3>
        <div className="space-y-3">
          {insights.topPerformers?.map((coupon: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">{coupon.name}</p>
                <p className="text-xs text-slate-500">전환율 {(coupon.conversionRate * 100).toFixed(1)}%</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-emerald-600">ROI {coupon.roi?.toFixed(1)}x</p>
                <p className="text-xs text-slate-500">GMV ₩{(coupon.gmv / 10000).toFixed(0)}만</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 저성과 쿠폰 경고 */}
      {insights.worstPerformers?.length > 0 && (
        <Card className="p-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
            <Icon icon={AlertTriangle} size="md" />
            저성과 쿠폰 경고
          </h3>
          <div className="space-y-3">
            {insights.worstPerformers?.map((coupon: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{coupon.name}</p>
                  <p className="text-xs text-amber-600">{coupon.issue}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-amber-600">전환율 {(coupon.conversionRate * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI 권장 사항 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Icon icon={Lightbulb} size="md" className="text-amber-500" />
          AI 권장 사항
        </h3>
        <div className="space-y-4">
          {insights.recommendations?.map((rec: any, idx: number) => (
            <div key={idx} className={`p-4 rounded-lg border ${
              rec.type === 'optimization' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20' :
              rec.type === 'warning' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20' :
              'bg-blue-50 border-blue-200 dark:bg-blue-900/20'
            }`}>
              <div className="flex items-start gap-3">
                <Badge variant={rec.impact === 'high' ? 'success' : rec.impact === 'medium' ? 'warning' : 'default'}>
                  {rec.impact === 'high' ? '높음' : rec.impact === 'medium' ? '중간' : '낮음'}
                </Badge>
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{rec.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{rec.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// Phase 4: 리뷰 인사이트 탭
function ReviewInsightsTab({ data, isLoading, period }: { data: any; isLoading: boolean; period: string }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const insights = data?.insights
  if (!insights) {
    return (
      <Card className="p-8 text-center">
        <Icon icon={MessageCircle} size="xl" className="text-slate-400 mx-auto mb-4" />
        <p className="text-slate-500">리뷰 인사이트 데이터를 불러올 수 없습니다.</p>
      </Card>
    )
  }

  const nps = insights.nps
  const getNPSColor = (score: number) => {
    if (score >= 50) return 'text-emerald-500'
    if (score >= 0) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div className="space-y-6">
      {/* NPS 점수 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">NPS (Net Promoter Score)</h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="text-center">
            <div className={`text-6xl font-bold ${getNPSColor(nps?.score || 0)}`}>
              {nps?.score || 0}
            </div>
            <p className="text-sm text-slate-500 mt-2">NPS 점수</p>
            {nps?.change && (
              <p className={`text-xs ${nps.change.score >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {nps.change.score >= 0 ? '+' : ''}{nps.change.score} {nps.change.period}
              </p>
            )}
          </div>
          <div className="flex-1 grid grid-cols-3 gap-4 w-full">
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <p className="text-2xl font-bold text-emerald-600">{nps?.promoters?.count || 0}</p>
              <p className="text-xs text-slate-500">추천 ({nps?.promoters?.pct || 0}%)</p>
            </div>
            <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <p className="text-2xl font-bold text-amber-600">{nps?.passives?.count || 0}</p>
              <p className="text-xs text-slate-500">중립 ({nps?.passives?.pct || 0}%)</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <p className="text-2xl font-bold text-red-600">{nps?.detractors?.count || 0}</p>
              <p className="text-xs text-slate-500">비추천 ({nps?.detractors?.pct || 0}%)</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 평점 분포 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">평점 분포</h3>
        <div className="flex items-center gap-4 mb-4">
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {insights.ratingDistribution?.avgRating?.toFixed(2) || 0}
          </p>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={star}
                icon={Activity}
                size="sm"
                className={star <= Math.round(insights.ratingDistribution?.avgRating || 0) ? 'text-amber-400' : 'text-slate-300'}
              />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = insights.ratingDistribution?.[`rating${rating}`] || 0
            const total = Object.keys(insights.ratingDistribution || {})
              .filter(k => k.startsWith('rating'))
              .reduce((sum, k) => sum + (insights.ratingDistribution[k] || 0), 0)
            const pct = total > 0 ? (count / total) * 100 : 0
            return (
              <div key={rating} className="flex items-center gap-2">
                <span className="w-8 text-sm text-slate-600">{rating}점</span>
                <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${rating >= 4 ? 'bg-emerald-500' : rating === 3 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-sm text-slate-500 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* TOP 작가 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Icon icon={Users} size="md" className="text-blue-500" />
          TOP 평점 작가
        </h3>
        <div className="space-y-3">
          {insights.topArtists?.map((artist: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">{artist.name}</p>
                <p className="text-xs text-slate-500">리뷰 {artist.reviewCount}개</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-600">평점 {artist.avgRating?.toFixed(1)}</p>
                <p className="text-xs text-slate-500">NPS {artist.nps}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 주의 필요 작가 */}
      {insights.concerningArtists?.length > 0 && (
        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-900/20">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
            <Icon icon={AlertTriangle} size="md" />
            주의 필요 작가
          </h3>
          <div className="space-y-3">
            {insights.concerningArtists?.map((artist: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{artist.name}</p>
                  <p className="text-xs text-red-600">{artist.issue}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">평점 {artist.avgRating?.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">NPS {artist.nps}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI 권장 사항 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Icon icon={Lightbulb} size="md" className="text-amber-500" />
          AI 권장 사항
        </h3>
        <div className="space-y-4">
          {insights.recommendations?.map((rec: any, idx: number) => (
            <div key={idx} className={`p-4 rounded-lg border ${
              rec.type === 'positive' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20' :
              rec.type === 'warning' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20' :
              rec.type === 'opportunity' ? 'bg-violet-50 border-violet-200 dark:bg-violet-900/20' :
              'bg-blue-50 border-blue-200 dark:bg-blue-900/20'
            }`}>
              <div className="flex items-start gap-3">
                <Badge variant={rec.impact === 'high' ? 'success' : rec.impact === 'medium' ? 'warning' : 'default'}>
                  {rec.impact === 'high' ? '높음' : rec.impact === 'medium' ? '중간' : '낮음'}
                </Badge>
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{rec.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{rec.description}</p>
                  {rec.actionItems && (
                    <ul className="mt-2 text-sm text-slate-500 list-disc list-inside">
                      {rec.actionItems.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {rec.expectedValue && (
                    <p className="mt-2 text-sm text-violet-600 font-medium">{rec.expectedValue}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// 현황 평가 탭
function OverviewTab({ 
  briefing, 
  healthScore, 
  comprehensiveData, 
  comprehensiveLoading,
  period 
}: { 
  briefing: any
  healthScore: any
  comprehensiveData?: any
  comprehensiveLoading?: boolean
  period: string 
}) {
  const router = useRouter()
  if (!briefing && !healthScore) {
    return (
      <EmptyState 
        icon="📊" 
        title="데이터를 불러오는 중입니다" 
        description="잠시만 기다려주세요. AI가 비즈니스 현황을 분석하고 있습니다."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* AI 브리핑 */}
      {briefing && (
        <FadeIn>
          <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                <Icon icon={MessageCircle} size="md" className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  AI 경영 브리핑
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{getPeriodLabel(period)} 기준</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">
              {briefing.summary}
            </p>

            {/* v4.2: 브리핑 품질 검증 결과 표시 */}
            {briefing.quality && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">브리핑 품질</span>
                    <span className={`text-sm font-bold ${
                      briefing.quality.overall >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                      briefing.quality.overall >= 60 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {briefing.quality.overall}/100
                    </span>
                  </div>
                  {briefing.usedLLM && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">AI 생성</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">구체성</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            briefing.quality.specificity >= 70 ? 'bg-emerald-500' :
                            briefing.quality.specificity >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${briefing.quality.specificity}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-8 text-right">
                        {briefing.quality.specificity}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">실행 가능성</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            briefing.quality.actionability >= 70 ? 'bg-emerald-500' :
                            briefing.quality.actionability >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${briefing.quality.actionability}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-8 text-right">
                        {briefing.quality.actionability}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">데이터 근거</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            briefing.quality.dataBacking >= 70 ? 'bg-emerald-500' :
                            briefing.quality.dataBacking >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${briefing.quality.dataBacking}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-8 text-right">
                        {briefing.quality.dataBacking}
                      </span>
                    </div>
                  </div>
                </div>
                {briefing.quality.issues && briefing.quality.issues.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">개선 사항:</div>
                    <ul className="space-y-1">
                      {briefing.quality.issues.slice(0, 2).map((issue: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-500 dark:text-slate-500 flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {/* 즉시 조치 사항 */}
              {briefing.immediateActions?.length > 0 && (
                <FadeIn delay={100}>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                      <Icon icon={AlertTriangle} size="sm" className="text-red-500" />
                      즉시 조치 필요
                    </h3>
                    <ul className="space-y-2">
                      {briefing.immediateActions.map((action: string, idx: number) => (
                        <li key={idx} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              )}

              {/* 기회 */}
              {briefing.opportunities?.length > 0 && (
                <FadeIn delay={150}>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-2">
                      <Icon icon={Lightbulb} size="sm" className="text-emerald-500" />
                      성장 기회
                    </h3>
                    <ul className="space-y-2">
                      {briefing.opportunities.slice(0, 3).map((opp: string, idx: number) => (
                        <li key={idx} className="text-sm text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              )}

              {/* 주간 집중 사항 */}
              {briefing.weeklyFocus?.length > 0 && (
                <FadeIn delay={200}>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                      <Icon icon={Target} size="sm" className="text-blue-500" />
                      이번 주 집중 사항
                    </h3>
                    <ul className="space-y-2">
                      {briefing.weeklyFocus.map((focus: string, idx: number) => (
                        <li key={idx} className="text-sm text-blue-600 dark:text-blue-400 flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{focus}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              )}

              {/* 리스크 */}
              {briefing.risks?.length > 0 && (
                <FadeIn delay={250}>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
                      <Icon icon={AlertTriangle} size="sm" className="text-amber-500" />
                      주의 사항
                    </h3>
                    <ul className="space-y-2">
                      {briefing.risks.slice(0, 3).map((risk: string, idx: number) => (
                        <li key={idx} className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                          <span className="text-amber-400 mt-0.5">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              )}
            </div>
            
            {/* v4.2: 상세 성과 확인 버튼 */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => router.push('/analytics?tab=daily')}
                className="w-full px-4 py-3 bg-idus-500 text-white rounded-lg font-medium hover:bg-idus-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <Icon icon={BarChart3} size="sm" className="text-white" />
                <span>상세 성과 확인하기</span>
                <span>→</span>
              </button>
            </div>
          </Card>
        </FadeIn>
      )}

      {/* 건강도 요약 */}
      {healthScore && (
        <FadeIn delay={300}>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Icon icon={BarChart3} size="lg" className="text-slate-600 dark:text-slate-400" />
              종합 현황 평가
            </h2>
            
            {/* v5.0: ECharts 기반 레이더 차트 */}
            {healthScore.dimensions && (
              <div className="mb-6">
                <EChartsRadar
                  indicators={Object.keys(healthScore.dimensions).map(key => ({
                    name: getDimensionLabel(key),
                    max: 100,
                  }))}
                  series={[{
                    name: '현재 건강도',
                    values: Object.values(healthScore.dimensions).map((dim: any) => dim.score),
                    color: '#8B5CF6',
                  }]}
                  height={380}
                  shape="polygon"
                  fillOpacity={0.35}
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(healthScore.dimensions).map(([key, dim]: [string, any], idx) => (
                <FadeIn key={key} delay={350 + idx * 50}>
                  <Tooltip content={`${getDimensionLabel(key)} 차원의 건강도 점수입니다. ${dim.trend === 'up' ? '상승 추세' : dim.trend === 'down' ? '하락 추세' : '안정 추세'}입니다.`}>
                    <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center hover:shadow-lg hover:scale-102 transition-all duration-300 cursor-help">
                      <div className="mb-3 flex justify-center">
                        <Icon 
                          icon={key === 'revenue' ? DollarSign : key === 'customer' ? Users : key === 'artist' ? Palette : Activity} 
                          size="lg" 
                          className="text-slate-600 dark:text-slate-400" 
                        />
                      </div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                        {getDimensionLabel(key)}
                      </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className={`text-3xl font-bold ${getScoreColor(dim.score)} transition-all duration-500`}>
                        <AnimatedNumber value={dim.score} />
                      </span>
                      <span className={`text-sm font-medium ${getTrendColor(dim.trend)} flex items-center`}>
                        {getTrendIcon(dim.trend)}
                        {dim.change !== undefined && Math.abs(dim.change) > 0.01 && (
                          <span className="ml-1">{(dim.change * 100).toFixed(0)}%</span>
                        )}
                      </span>
                      </div>
                      <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          dim.score >= 70 ? 'bg-emerald-500' :
                          dim.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${dim.score}%` }}
                      />
                      </div>
                    </div>
                  </Tooltip>
                </FadeIn>
              ))}
            </div>
          </Card>
        </FadeIn>
      )}

      {/* 종합 인사이트 (통합) */}
      {comprehensiveData && !comprehensiveLoading && (
        <FadeIn delay={400}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                종합 인사이트
              </h2>
            </div>
            
            {/* 요약 - summary가 객체인 경우 표시하지 않음 (이미 위의 metricCards에서 표시됨) */}
            {comprehensiveData.summary && typeof comprehensiveData.summary === 'string' && (
              <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {comprehensiveData.summary}
                </p>
              </div>
            )}

            {/* 주요 인사이트 */}
            {comprehensiveData.topInsights && comprehensiveData.topInsights.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                {comprehensiveData.topInsights.slice(0, 4).map((insight: any, idx: number) => (
                  <FadeIn key={idx} delay={450 + idx * 50}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start gap-3">
                        <Icon icon={insight.icon ? (typeof insight.icon === 'string' ? Lightbulb : insight.icon) : Lightbulb} size="md" className="text-amber-500" />
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-1">
                            {insight.title}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            )}
          </Card>
        </FadeIn>
      )}
    </div>
  )
}

// 트렌드 분석 탭
function TrendsTab({ trends, trendsData, isLoading, period }: { trends: any[]; trendsData?: any; isLoading: boolean; period: string }) {
  if (isLoading) {
    return (
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-green-200 dark:border-green-800 rounded-full animate-spin border-t-green-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon icon={TrendingUp} size="lg" className="text-green-600" />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            트렌드를 분석하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  if (trends.length === 0) {
    return (
      <EmptyState 
        icon={TrendingUp} 
        title="트렌드 데이터가 없습니다" 
        description="선택한 기간에 충분한 데이터가 없어 트렌드 분석을 수행할 수 없습니다."
      />
    )
  }

  // v5.0: ECharts 기반 트렌드 데이터 변환
  const echartsSeriesData = useMemo(() => {
    const dailyData = (trendsData as any)?.timeSeries?.dailyAggregation
    if (!dailyData || dailyData.length === 0) return null
    
    return [
      {
        name: '매출 (GMV)',
        data: dailyData.map((d: any) => ({
          date: d.date,
          value: d.gmv || 0,
        })),
        color: '#10B981',
        type: 'area' as const,
        showMovingAverage: true,
        maWindow: 7,
      },
      {
        name: '주문 수',
        data: dailyData.map((d: any) => ({
          date: d.date,
          value: d.orders || 0,
        })),
        color: '#3B82F6',
        type: 'line' as const,
      },
    ]
  }, [trendsData])

  return (
    <div className="space-y-6">
      {/* v5.0: ECharts 기반 트렌드 차트 */}
      {echartsSeriesData && (
      <FadeIn>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon icon={TrendingUp} size="md" className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                장기 트렌드 분석
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{getPeriodLabel(period)} 기준 • 7일 이동평균 포함</p>
            </div>
          </div>
          <EChartsTrendChart
            series={echartsSeriesData}
            height={380}
            showDataZoom={true}
            showLegend={true}
            dateFormatter={(date) => {
              const d = new Date(date)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
            valueFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
              if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
              return value.toFixed(0)
            }}
            onDataPointClick={(params) => {
              console.log('차트 데이터 포인트 클릭:', params)
            }}
          />
        </Card>
      </FadeIn>
      )}
      
      {/* 트렌드 상세 */}
      {trends.length > 0 && (
        <FadeIn delay={100}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  트렌드 상세
                </h2>
                <p className="text-xs text-slate-500">{getPeriodLabel(period)} 기준</p>
              </div>
            </div>
            <div className="space-y-4">
              {trends.map((trend, idx) => (
                <FadeIn key={idx} delay={idx * 50}>
                  <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                        {trend.metric}
                      </h3>
                      <div className="flex items-center gap-3">
                        <Badge variant={getSignificanceVariant(trend.significance)}>
                          {trend.significance === 'high' ? '높음' : trend.significance === 'medium' ? '중간' : '낮음'}
                        </Badge>
                        <span className={`text-xl font-bold ${getTrendColor(trend.direction)} flex items-center gap-1`}>
                          <span className="text-2xl">{trend.direction === 'up' ? '📈' : trend.direction === 'down' ? '📉' : '➡️'}</span>
                          {trend.magnitude.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {trend.implication}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}

// 리스크 감지 탭
function RisksTab({ checks, isLoading, summary }: { checks: any[]; isLoading: boolean; summary?: string }) {
  if (isLoading) {
    return (
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-200 dark:border-red-800 rounded-full animate-spin border-t-red-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            리스크를 점검하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  const failChecks = checks.filter(c => c.status === 'fail')
  const warningChecks = checks.filter(c => c.status === 'warning')
  const passChecks = checks.filter(c => c.status === 'pass')

  if (checks.length === 0) {
    return (
      <EmptyState 
        icon="⚠️" 
        title="리스크 체크 데이터가 없습니다" 
        description="리스크 점검을 위한 데이터가 충분하지 않습니다."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 요약 */}
      <FadeIn>
        <Card className="p-6 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <Icon icon={AlertTriangle} size="md" className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              휴먼 에러 체크 결과
            </h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{summary}</p>
          <div className="flex gap-6 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">심각 {failChecks.length}개</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">주의 {warningChecks.length}개</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">정상 {passChecks.length}개</span>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* 체크 목록 */}
      <div className="space-y-4">
        {checks.map((check, idx) => (
          <FadeIn key={idx} delay={idx * 50}>
            <Card className={`p-5 border-l-4 hover:shadow-md transition-all duration-300 ${
              check.status === 'fail' ? 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10' :
              check.status === 'warning' ? 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10' : 
              'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {check.status === 'fail' ? '🚨' : check.status === 'warning' ? '⚠️' : '✅'}
                    </span>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                      {check.name}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {check.message}
                  </p>
                </div>
                {check.value !== undefined && (
                  <div className="text-right shrink-0">
                    <div className={`text-2xl font-bold ${
                      check.status === 'fail' ? 'text-red-600' :
                      check.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {typeof check.value === 'number' ? check.value.toFixed(1) : check.value}%
                    </div>
                    {check.threshold !== undefined && (
                      <div className="text-xs text-slate-400 mt-1">
                        임계값: {check.threshold}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </FadeIn>
        ))}
      </div>
    </div>
  )
}

// ==================== 액션 버튼 컴포넌트 (v4.0) ====================

interface InsightAction {
  id: string
  label: string
  icon: string
  type: 'navigate' | 'api_call' | 'download'
  href?: string
  params?: Record<string, any>
  dataKey?: string
  downloadType?: 'csv' | 'excel'
}

function InsightActionButton({ 
  action, 
  variant = 'default',
  period = '30d'
}: { 
  action: InsightAction
  variant?: 'default' | 'primary'
  period?: string
}) {
  const router = useRouter()
  
  const handleClick = () => {
    if (action.type === 'navigate' && action.href) {
      const params = action.params ? new URLSearchParams(
        Object.entries(action.params).map(([k, v]) => [k, String(v)])
      ).toString() : ''
      const url = params ? `${action.href}?${params}` : action.href
      router.push(url)
    } else if (action.type === 'download' && action.dataKey) {
      // 다운로드 기능
      const url = businessBrainApi.getExportUrl(action.dataKey, period as any)
      const link = document.createElement('a')
      link.href = url
      link.download = ''
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
  
  const baseStyles = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
  const variantStyles = variant === 'primary'
    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow"
    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
  
  return (
    <button
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles}`}
    >
      <span>{action.icon}</span>
      <span>{action.label}</span>
    </button>
  )
}

// 인사이트 카드 컴포넌트 (v4.0 - 액션 버튼 포함)
function InsightCard({ insight, colorScheme = 'slate', period = '30d' }: { 
  insight: any; 
  colorScheme?: 'emerald' | 'slate' | 'red' | 'amber'
  period?: string
}) {
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      title: 'text-emerald-800 dark:text-emerald-200',
      desc: 'text-emerald-600 dark:text-emerald-400',
      rec: 'text-emerald-700 dark:text-emerald-300',
      actionBg: 'bg-emerald-100/50 dark:bg-emerald-800/30'
    },
    slate: {
      bg: 'bg-slate-50 dark:bg-slate-800',
      title: 'text-slate-800 dark:text-slate-100',
      desc: 'text-slate-600 dark:text-slate-400',
      rec: 'text-slate-700 dark:text-slate-300',
      actionBg: 'bg-slate-100/50 dark:bg-slate-700/50'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      title: 'text-red-800 dark:text-red-200',
      desc: 'text-red-600 dark:text-red-400',
      rec: 'text-red-700 dark:text-red-300',
      actionBg: 'bg-red-100/50 dark:bg-red-800/30'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      title: 'text-amber-800 dark:text-amber-200',
      desc: 'text-amber-600 dark:text-amber-400',
      rec: 'text-amber-700 dark:text-amber-300',
      actionBg: 'bg-amber-100/50 dark:bg-amber-800/30'
    }
  }
  
  const colors = colorClasses[colorScheme]
  const hasActions = insight.actions && insight.actions.length > 0
  
  return (
    <div className={`p-4 ${colors.bg} rounded-lg`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{getInsightIcon(insight.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className={`font-medium ${colors.title}`}>
              {insight.title}
            </h3>
            <Badge variant={getInsightVariant(insight.type)}>
              {getInsightLabel(insight.type)}
            </Badge>
          </div>
          <p className={`text-sm ${colors.desc} mt-1`}>
            {insight.description}
          </p>

          {/* v4.2: 통계적 유의성 및 신뢰도 표시 */}
          {insight.scores && (
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              {insight.scores.statisticalSignificance !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">통계적 유의성:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          insight.scores.statisticalSignificance >= 70 ? 'bg-emerald-500' :
                          insight.scores.statisticalSignificance >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${insight.scores.statisticalSignificance}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      insight.scores.statisticalSignificance >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                      insight.scores.statisticalSignificance >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {insight.scores.statisticalSignificance}
                    </span>
                  </div>
                </div>
              )}
              {insight.scores.confidence !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">신뢰도:</span>
                  <span className={`text-xs font-medium ${
                    insight.scores.confidence >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                    insight.scores.confidence >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {insight.scores.confidence}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* v4.2: 인과관계 분석 결과 표시 */}
          {insight.causalAnalysis && (
            <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-indigo-600 dark:text-indigo-400">🔗</span>
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">인과관계 분석</span>
              </div>
              {insight.causalAnalysis.rootCause && (
                <div className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">
                  <strong>근본 원인:</strong> {insight.causalAnalysis.rootCause}
                </div>
              )}
              {insight.causalAnalysis.confidence && (
                <div className="text-xs text-indigo-600 dark:text-indigo-400">
                  <strong>신뢰도:</strong> {insight.causalAnalysis.confidence === 'high' ? '높음' : insight.causalAnalysis.confidence === 'medium' ? '중간' : '낮음'}
                </div>
              )}
            </div>
          )}

          {insight.recommendation && (
            <p className={`text-sm ${colors.rec} mt-2 font-medium`}>
              → {insight.recommendation}
            </p>
          )}
          
          {/* 액션 버튼 영역 (v4.0) */}
          {hasActions && (
            <div className={`mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-600/50`}>
              <div className="flex flex-wrap gap-2">
                {insight.actions.slice(0, 4).map((action: InsightAction, idx: number) => (
                  <InsightActionButton 
                    key={action.id} 
                    action={action} 
                    variant={idx === 0 ? 'primary' : 'default'}
                    period={period}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 인사이트 탭
function InsightsTab({ insights, isLoading, period = '30d' }: { insights: any[]; isLoading: boolean; period?: string }) {
  const [sortBy, setSortBy] = useState<'priority' | 'score' | 'confidence' | 'impact'>('score')
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'warning' | 'opportunity' | 'info'>('all')
  const [showScoringDetails, setShowScoringDetails] = useState<Record<string, boolean>>({})

  if (isLoading) {
    return (
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-yellow-200 dark:border-yellow-800 rounded-full animate-spin border-t-yellow-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">💡</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            인사이트를 발굴하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  // 필터링 및 정렬
  let filteredInsights = insights
  if (filterType !== 'all') {
    filteredInsights = filteredInsights.filter(i => i.type === filterType)
  }

  // 정렬
  filteredInsights = [...filteredInsights].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return (b.totalScore || 0) - (a.totalScore || 0)
      case 'priority':
        const priorityOrder = { critical: 0, warning: 1, opportunity: 2, info: 3 }
        return (priorityOrder[a.type as keyof typeof priorityOrder] || 99) - (priorityOrder[b.type as keyof typeof priorityOrder] || 99)
      case 'confidence':
        return (b.scores?.confidence || 0) - (a.scores?.confidence || 0)
      case 'impact':
        return (b.scores?.businessImpact || 0) - (a.scores?.businessImpact || 0)
      default:
        return 0
    }
  })

  const criticals = filteredInsights.filter(i => i.type === 'critical')
  const warnings = filteredInsights.filter(i => i.type === 'warning')
  const opportunities = filteredInsights.filter(i => i.type === 'opportunity')
  const infos = filteredInsights.filter(i => i.type === 'info')

  if (filteredInsights.length === 0) {
    return (
      <EmptyState 
        icon="💡" 
        title="발견된 인사이트가 없습니다" 
        description="현재 기간에 대한 인사이트가 없거나 필터 조건에 맞는 인사이트가 없습니다."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 필터 및 정렬 컨트롤 */}
      <FadeIn>
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">정렬:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="score">점수순</option>
                <option value="priority">우선순위순</option>
                <option value="confidence">신뢰도순</option>
                <option value="impact">영향도순</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">필터:</span>
              <div className="flex gap-2">
                {(['all', 'critical', 'warning', 'opportunity', 'info'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      filterType === type
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {type === 'all' ? '전체' : type === 'critical' ? '긴급' : type === 'warning' ? '경고' : type === 'opportunity' ? '기회' : '정보'}
                  </button>
                ))}
              </div>
            </div>
            <div className="ml-auto text-sm text-slate-500 dark:text-slate-400">
              총 {filteredInsights.length}개 인사이트
            </div>
          </div>
        </Card>
      </FadeIn>
      {/* 긴급 (Critical) */}
      {criticals.length > 0 && (
        <FadeIn>
          <Card className="p-6 border-l-4 border-l-red-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">🚨</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  즉시 조치 필요
                </h2>
                <p className="text-xs text-red-600 dark:text-red-400">{criticals.length}건의 긴급 사항</p>
              </div>
            </div>
            <div className="space-y-3">
              {criticals.map((insight: any) => (
                <InsightCard key={insight.id} insight={insight} colorScheme="red" period={period} />
              ))}
            </div>
          </Card>
        </FadeIn>
      )}

      {/* 주의 (Warning) */}
      {warnings.length > 0 && (
        <FadeIn delay={100}>
          <Card className="p-6 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  주의 관찰 필요
                </h2>
                <p className="text-xs text-amber-600 dark:text-amber-400">{warnings.length}건의 주의 사항</p>
              </div>
            </div>
            <div className="space-y-3">
              {warnings.map((insight: any) => (
                <InsightCard key={insight.id} insight={insight} colorScheme="amber" period={period} />
              ))}
            </div>
          </Card>
        </FadeIn>
      )}

      {/* 기회 (Opportunity) */}
      {opportunities.length > 0 && (
        <FadeIn delay={200}>
          <Card className="p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">💡</span>
              </div>
              <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  성장 기회
              </h2>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{opportunities.length}건의 기회 발견</p>
            </div>
            </div>
            <div className="space-y-3">
            {opportunities.map((insight: any) => (
                <InsightCard key={insight.id} insight={insight} colorScheme="emerald" period={period} />
              ))}
            </div>
          </Card>
        </FadeIn>
      )}

      {/* 정보 (Info) */}
      {infos.length > 0 && (
        <FadeIn delay={300}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">📊</span>
                  </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  참고 정보
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{infos.length}건의 정보</p>
                </div>
              </div>
            <div className="space-y-3">
              {infos.map((insight: any) => (
                <InsightCard key={insight.id} insight={insight} colorScheme="slate" period={period} />
            ))}
          </div>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}

// ==================== v4.0: 이탈 예측 탭 ====================

function ChurnPredictionTab({ data, isLoading, period }: { data: any; isLoading: boolean; period: string }) {
  const router = useRouter()
  
  if (isLoading) {
    return (
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-rose-200 dark:border-rose-800 rounded-full animate-spin border-t-rose-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🔮</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            고객 이탈 위험을 분석하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  const summary = data?.summary
  const predictions = data?.predictions || []

  if (!summary || predictions.length === 0) {
    return (
      <EmptyState 
        icon="🔮" 
        title="이탈 예측 데이터가 없습니다" 
        description="충분한 고객 구매 이력이 쌓이면 이탈 예측 분석을 제공합니다."
      />
    )
  }

  const riskLevelColors: Record<string, { bg: string; text: string; border: string }> = {
    critical: { 
      bg: 'bg-red-50 dark:bg-red-900/20', 
      text: 'text-red-700 dark:text-red-300',
      border: 'border-l-red-500'
    },
    high: { 
      bg: 'bg-orange-50 dark:bg-orange-900/20', 
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-l-orange-500'
    },
    medium: { 
      bg: 'bg-amber-50 dark:bg-amber-900/20', 
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-l-amber-500'
    },
    low: { 
      bg: 'bg-green-50 dark:bg-green-900/20', 
      text: 'text-green-700 dark:text-green-300',
      border: 'border-l-green-500'
    },
    churned: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-l-slate-400'
    }
  }

  const riskLevelLabels: Record<string, string> = {
    critical: '🚨 위험',
    high: '⚠️ 높음',
    medium: '📊 중간',
    low: '✅ 낮음',
    churned: '💀 이탈 완료'
  }

  // 이탈 위험 고객과 이탈 완료 고객 분리
  const atRiskPredictions = predictions.filter((p: any) => p.churnStatus === 'at_risk')
  const churnedPredictions = predictions.filter((p: any) => p.churnStatus === 'churned')

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <FadeIn>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">🔮</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  고객 이탈 예측
          </h2>
                <p className="text-xs text-slate-500">구매 패턴 기반 이탈 확률 분석</p>
              </div>
            </div>
            <ExportButton type="rfm-customers" label="위험 고객 목록" />
          </div>

          {/* 요약 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {summary.totalCustomers.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">전체 고객</div>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {summary.atRiskCustomers.toLocaleString()}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">이탈 위험 고객</div>
            </div>
            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-xl text-center">
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                {(summary.churnedCustomers || 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">이탈 완료 고객</div>
            </div>
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                ${summary.totalValueAtRisk.toLocaleString()}
              </div>
              <div className="text-xs text-rose-600 dark:text-rose-400 mt-1">위험 예상 가치</div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {summary.avgChurnProbability.toFixed(1)}%
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">평균 이탈 확률</div>
            </div>
          </div>

          {/* 리스크 레벨별 분포 */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">리스크 레벨 분포</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { level: 'critical', count: summary.criticalCount, color: 'bg-red-500' },
                { level: 'high', count: summary.highCount, color: 'bg-orange-500' },
                { level: 'medium', count: summary.mediumCount, color: 'bg-amber-500' },
                { level: 'low', count: summary.lowCount, color: 'bg-green-500' },
                ...(summary.churnedCount > 0 ? [{ level: 'churned', count: summary.churnedCount, color: 'bg-slate-500' }] : [])
              ].map(item => (
                <div key={item.level} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <div className={`w-3 h-3 ${item.color} rounded-full`} />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {riskLevelLabels[item.level]}: {item.count}명
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* 이탈 위험 고객 목록 */}
      {atRiskPredictions.length > 0 && (
        <FadeIn delay={100}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                🚨 이탈 위험 고객 (상위 {Math.min(atRiskPredictions.length, 20)}명)
                      </h3>
            </div>

            <div className="space-y-3">
              {atRiskPredictions.slice(0, 20).map((prediction: any, idx: number) => {
                const colors = riskLevelColors[prediction.riskLevel] || riskLevelColors.low
              
              return (
                <FadeIn key={prediction.customerId} delay={idx * 30}>
                  <div className={`p-4 rounded-xl border-l-4 ${colors.bg} ${colors.border}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-slate-800 dark:text-slate-100">
                            {prediction.customerName || `고객 #${prediction.customerId}`}
                          </span>
                          <Badge variant={
                            prediction.riskLevel === 'critical' ? 'danger' :
                            prediction.riskLevel === 'high' ? 'warning' : 'default'
                          }>
                            {riskLevelLabels[prediction.riskLevel]}
                      </Badge>
                          <span className="text-sm text-slate-500">
                            {prediction.currentSegment}
                          </span>
                    </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 mb-2">
                          <span>이탈 확률: <strong className={colors.text}>{prediction.churnProbability}%</strong></span>
                          <span>예상 이탈까지: <strong>{prediction.daysUntilChurn}일</strong></span>
                          <span>미구매 경과: <strong>{prediction.daysSinceLastOrder || 0}일</strong></span>
                          <span>마지막 주문: {prediction.lastOrderDate}</span>
                          <span>총 주문: {prediction.totalOrders}건</span>
                          <span>총 구매: ${prediction.lifetimeValue?.historical?.toFixed(0) || 0}</span>
                  </div>
                        
                        {/* 위험 요인 */}
                        {prediction.riskFactors && prediction.riskFactors.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {prediction.riskFactors.slice(0, 3).map((factor: any, fIdx: number) => (
                              <span 
                                key={fIdx}
                                className="text-xs px-2 py-1 bg-white/50 dark:bg-slate-700/50 rounded text-slate-600 dark:text-slate-400"
                              >
                                {factor.factor}: {factor.currentValue}
                              </span>
                            ))}
                </div>
                        )}
                        
                        {/* 권장 조치 */}
                        {prediction.recommendedActions && prediction.recommendedActions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {prediction.recommendedActions.slice(0, 2).map((action: any, aIdx: number) => (
                              <button
                                key={aIdx}
                                onClick={() => {
                                  if (action.action.includes('쿠폰')) {
                                    router.push('/coupon-generator')
                                  }
                                }}
                                className="text-xs px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/40 transition-colors"
                              >
                                {action.action}
                              </button>
                            ))}
              </div>
                        )}
                      </div>
                      
                      {/* 이탈 확률 게이지 */}
                      <div className="flex-shrink-0 w-16 text-center">
                        <div className="relative w-14 h-14 mx-auto">
                          <svg className="w-14 h-14 transform -rotate-90">
                            <circle
                              cx="28"
                              cy="28"
                              r="24"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-slate-200 dark:text-slate-700"
                            />
                            <circle
                              cx="28"
                              cy="28"
                              r="24"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${prediction.churnProbability * 1.51} 151`}
                              className={
                                prediction.churnProbability >= 70 ? 'text-red-500' :
                                prediction.churnProbability >= 50 ? 'text-orange-500' :
                                prediction.churnProbability >= 30 ? 'text-amber-500' : 'text-green-500'
                              }
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-sm font-bold ${colors.text}`}>
                              {prediction.churnProbability}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </Card>
      </FadeIn>
      )}

      {/* 이탈 완료 고객 목록 */}
      {churnedPredictions.length > 0 && (
        <FadeIn delay={200}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                💀 이탈 완료 고객 (6개월 이상 미구매, {Math.min(churnedPredictions.length, 20)}명)
              </h3>
              <span className="text-xs text-slate-500">
                총 {summary.churnedCount || 0}명 / 손실 가치: ${(summary.totalValueChurned || 0).toLocaleString()}
              </span>
            </div>

            <div className="space-y-3">
              {churnedPredictions.slice(0, 20).map((prediction: any, idx: number) => {
                const colors = riskLevelColors.churned
                
                return (
                  <FadeIn key={prediction.customerId} delay={idx * 30}>
                    <div className={`p-4 rounded-xl border-l-4 ${colors.bg} ${colors.border} opacity-75`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {prediction.customerName || `고객 #${prediction.customerId}`}
                            </span>
                            <Badge variant="default" className="bg-slate-500">
                              {riskLevelLabels.churned}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              {prediction.currentSegment}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 mb-2">
                            <span>미구매 경과: <strong>{prediction.daysSinceLastOrder || 0}일</strong></span>
                            <span>마지막 주문: {prediction.lastOrderDate}</span>
                            <span>총 주문: {prediction.totalOrders}건</span>
                            <span>총 구매: ${prediction.lifetimeValue?.historical?.toFixed(0) || 0}</span>
                          </div>
                          
                          {prediction.riskFactors && prediction.riskFactors.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {prediction.riskFactors.map((factor: any, fIdx: number) => (
                                <span 
                                  key={fIdx}
                                  className="text-xs px-2 py-1 bg-white/50 dark:bg-slate-700/50 rounded text-slate-600 dark:text-slate-400"
                                >
                                  {factor.factor}: {factor.currentValue}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                )
              })}
          </div>
        </Card>
        </FadeIn>
      )}
    </div>
  )
}

// ==================== v4.0: 작가 건강도 탭 ====================

function ArtistHealthTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-violet-200 dark:border-violet-800 rounded-full animate-spin border-t-violet-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🎨</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            작가 건강도를 분석하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  const summary = data?.summary
  const artists = data?.artists || []

  if (!summary || artists.length === 0) {
    return (
      <EmptyState 
        icon="🎨" 
        title="작가 건강도 데이터가 없습니다" 
        description="충분한 작가 활동 데이터가 쌓이면 건강도 분석을 제공합니다."
      />
    )
  }

  const tierColors: Record<string, { bg: string; text: string; border: string }> = {
    S: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-500' },
    A: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500' },
    B: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500' },
    C: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-500' },
    D: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-500' }
  }

  const tierLabels: Record<string, string> = {
    S: '🏆 S티어',
    A: '🥇 A티어',
    B: '🥈 B티어',
    C: '🥉 C티어',
    D: '⚠️ D티어'
  }

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <FadeIn>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">🎨</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  작가 건강도
                </h2>
                <p className="text-xs text-slate-500">4차원 종합 건강도 분석</p>
              </div>
            </div>
            <ExportButton type="pareto-artists" label="작가 데이터" />
          </div>

          {/* 요약 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {summary.totalArtists}
              </div>
              <div className="text-xs text-slate-500 mt-1">전체 작가</div>
            </div>
            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                {summary.avgOverallScore.toFixed(1)}
              </div>
              <div className="text-xs text-violet-600 dark:text-violet-400 mt-1">평균 건강도</div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {(summary.tierDistribution?.S || 0) + (summary.tierDistribution?.A || 0)}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">우수 작가 (S/A)</div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {(summary.tierDistribution?.C || 0) + (summary.tierDistribution?.D || 0)}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">관리 필요 (C/D)</div>
            </div>
          </div>

          {/* 티어 분포 */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">티어 분포</h3>
            <div className="flex gap-2 flex-wrap">
              {['S', 'A', 'B', 'C', 'D'].map(tier => {
                const count = summary.tierDistribution?.[tier] || 0
                const colors = tierColors[tier]
                return (
                  <div 
                    key={tier} 
                    className={`flex items-center gap-2 px-3 py-1.5 ${colors.bg} rounded-lg`}
                  >
                    <span className={`text-sm font-medium ${colors.text}`}>
                      {tierLabels[tier]}: {count}명
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* 관리 필요 작가 */}
      {summary.needsAttention && summary.needsAttention.length > 0 && (
        <FadeIn delay={100}>
          <Card className="p-6 border-l-4 border-l-amber-500">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              ⚠️ 관리 필요 작가
            </h3>
            <div className="space-y-2">
              {summary.needsAttention.map((artist: any, idx: number) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
                >
                  <div>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{artist.name}</span>
                    <span className="ml-2 text-sm text-amber-600 dark:text-amber-400">({artist.issue})</span>
                  </div>
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    점수: {artist.score}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>
      )}

      {/* 작가 목록 */}
      <FadeIn delay={200}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            📊 작가 건강도 현황
          </h3>

          <div className="space-y-3">
            {artists.slice(0, 20).map((artist: any, idx: number) => {
              const colors = tierColors[artist.tier] || tierColors.B
              
              return (
                <FadeIn key={artist.artistId} delay={idx * 30}>
                  <div className={`p-4 rounded-xl border-l-4 ${colors.bg} ${colors.border}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-slate-800 dark:text-slate-100">
                            {artist.artistName}
                          </span>
                          <Badge variant={
                            artist.tier === 'S' || artist.tier === 'A' ? 'success' :
                            artist.tier === 'D' ? 'danger' :
                            artist.tier === 'C' ? 'warning' : 'default'
                          }>
                            {tierLabels[artist.tier]}
                          </Badge>
                        </div>
                        
                        {/* 4차원 점수 */}
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          {[
                            { key: 'sales', label: '매출', icon: '💰' },
                            { key: 'operations', label: '운영', icon: '📦' },
                            { key: 'customer', label: '고객', icon: '😊' },
                            { key: 'engagement', label: '활동', icon: '⚡' }
                          ].map(dim => (
                            <div key={dim.key} className="text-center p-2 bg-white/50 dark:bg-slate-700/50 rounded">
                              <div className="text-xs text-slate-500">{dim.icon} {dim.label}</div>
                              <div className={`text-sm font-bold ${
                                artist.dimensions?.[dim.key]?.score >= 70 ? 'text-emerald-600' :
                                artist.dimensions?.[dim.key]?.score >= 50 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {artist.dimensions?.[dim.key]?.score || '-'}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* 인사이트 */}
                        {artist.dimensions?.sales?.insights && artist.dimensions.sales.insights.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {[
                              ...(artist.dimensions.sales?.insights || []),
                              ...(artist.dimensions.operations?.insights || []),
                              ...(artist.dimensions.customer?.insights || []),
                              ...(artist.dimensions.engagement?.insights || [])
                            ].slice(0, 3).map((insight: string, iIdx: number) => (
                              <span 
                                key={iIdx}
                                className="text-xs px-2 py-0.5 bg-white/70 dark:bg-slate-700/70 rounded text-slate-600 dark:text-slate-400"
                              >
                                {insight}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* 알림 */}
                        {artist.alerts && artist.alerts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {artist.alerts.slice(0, 2).map((alert: any, aIdx: number) => (
                              <span 
                                key={aIdx}
                                className={`text-xs px-2 py-0.5 rounded ${
                                  alert.type === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  alert.type === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}
                              >
                                {alert.type === 'critical' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'} {alert.message}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* 종합 점수 게이지 */}
                      <div className="flex-shrink-0 w-16 text-center">
                        <div className="relative w-14 h-14 mx-auto">
                          <svg className="w-14 h-14 transform -rotate-90">
                            <circle
                              cx="28"
                              cy="28"
                              r="24"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-slate-200 dark:text-slate-700"
                            />
                            <circle
                              cx="28"
                              cy="28"
                              r="24"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${artist.overallScore * 1.51} 151`}
                              className={
                                artist.overallScore >= 70 ? 'text-emerald-500' :
                                artist.overallScore >= 55 ? 'text-blue-500' :
                                artist.overallScore >= 40 ? 'text-amber-500' : 'text-red-500'
                              }
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-sm font-bold ${colors.text}`}>
                              {artist.overallScore}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </Card>
      </FadeIn>
    </div>
  )
}

// 전략 분석 탭 (v4.2 Phase 3)
function StrategyAnalysisTab({ 
  data, 
  isLoading, 
  period 
}: { 
  data: any; 
  isLoading: boolean; 
  period: string 
}) {
  if (isLoading) {
    return (
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 rounded-full animate-spin border-t-indigo-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            전략 분석을 수행하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  if (!data || !data.success) {
    return (
      <EmptyState 
        icon="🎯" 
        title="전략 분석 데이터를 불러올 수 없습니다" 
        description="데이터를 분석하여 전략적 인사이트를 제공합니다."
      />
    )
  }

  const { marketAnalysis, growthOpportunities, riskFactors } = data

  const formatCurrency = (value: number) => {
    if (value >= 10000) return `₩${(value / 10000).toFixed(0)}만`
    return `₩${value.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      {/* 시장 분석 */}
      <FadeIn>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🌍</span>
            <div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">시장 분석</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">주요 시장 및 성장 시장 분석</p>
            </div>
          </div>

          {/* 상위 시장 */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">상위 시장</h3>
            <div className="space-y-2">
              {marketAnalysis?.topMarkets?.slice(0, 5).map((market: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-slate-400">#{idx + 1}</span>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{market.country}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        시장 점유율: {market.share.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(market.gmv)}
                    </p>
                    <p
                      className={`text-xs ${
                        market.growth >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {market.growth >= 0 ? '+' : ''}
                      {market.growth.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 신흥 시장 */}
          {marketAnalysis?.emergingMarkets && marketAnalysis.emergingMarkets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">신흥 시장</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {marketAnalysis.emergingMarkets.map((market: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      market.potential === 'high'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                        : market.potential === 'medium'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{market.country}</p>
                      <Badge
                        variant={
                          market.potential === 'high'
                            ? 'success'
                            : market.potential === 'medium'
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {market.potential === 'high' ? '높음' : market.potential === 'medium' ? '중간' : '낮음'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      성장률: <span className="font-semibold text-green-600">+{market.growth.toFixed(1)}%</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      매출: {formatCurrency(market.gmv)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 시장 집중도 */}
          {marketAnalysis?.marketConcentration && (
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">시장 집중도</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Gini 계수: {marketAnalysis.marketConcentration.giniCoefficient.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">상위 3개 시장</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {marketAnalysis.marketConcentration.top3Share.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </FadeIn>

      {/* 성장 기회 */}
      {growthOpportunities && growthOpportunities.length > 0 && (
        <FadeIn delay={100}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">💡</span>
              <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">성장 기회</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">발굴된 성장 기회 및 추천 액션</p>
              </div>
            </div>

            <div className="space-y-4">
              {growthOpportunities.map((opportunity: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-5 rounded-lg border-l-4 ${
                    opportunity.potentialImpact === 'high'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
                      : opportunity.potentialImpact === 'medium'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                          {opportunity.title}
                        </h3>
                        <Badge
                          variant={
                            opportunity.potentialImpact === 'high'
                              ? 'success'
                              : opportunity.potentialImpact === 'medium'
                              ? 'info'
                              : 'warning'
                          }
                        >
                          {opportunity.potentialImpact === 'high'
                            ? '높은 영향'
                            : opportunity.potentialImpact === 'medium'
                            ? '중간 영향'
                            : '낮은 영향'}
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          신뢰도: {opportunity.confidence}%
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {opportunity.description}
                      </p>
                    </div>
                  </div>

                  {/* 메트릭 */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="p-2 bg-white/50 dark:bg-slate-700/50 rounded">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">현재</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(opportunity.metrics.current)}
                      </p>
                    </div>
                    <div className="p-2 bg-white/50 dark:bg-slate-700/50 rounded">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">잠재</p>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(opportunity.metrics.potential)}
                      </p>
                    </div>
                    <div className="p-2 bg-white/50 dark:bg-slate-700/50 rounded">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">성장</p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">
                        +{opportunity.metrics.growth.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* 추천 액션 */}
                  {opportunity.recommendedActions && opportunity.recommendedActions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                        추천 액션:
                      </p>
                      <ul className="space-y-1">
                        {opportunity.recommendedActions.map((action: string, aIdx: number) => (
                          <li key={aIdx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>
      )}

      {/* 위험 요소 */}
      {riskFactors && riskFactors.length > 0 && (
        <FadeIn delay={200}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">⚠️</span>
              <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">위험 요소</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">식별된 위험 요소 및 완화 방안</p>
              </div>
            </div>

            <div className="space-y-4">
              {riskFactors.map((risk: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-5 rounded-lg border-l-4 ${
                    risk.severity === 'critical'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                      : risk.severity === 'high'
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                      : risk.severity === 'medium'
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{risk.title}</h3>
                        <Badge
                          variant={
                            risk.severity === 'critical'
                              ? 'danger'
                              : risk.severity === 'high'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {risk.severity === 'critical'
                            ? '긴급'
                            : risk.severity === 'high'
                            ? '높음'
                            : risk.severity === 'medium'
                            ? '중간'
                            : '낮음'}
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          신뢰도: {risk.confidence}%
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{risk.description}</p>
                    </div>
                  </div>

                  {/* 메트릭 */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2 bg-white/50 dark:bg-slate-700/50 rounded">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">현재 값</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {typeof risk.metrics.current === 'number'
                          ? risk.metrics.current.toLocaleString()
                          : risk.metrics.current}
                      </p>
                    </div>
                    <div className="p-2 bg-white/50 dark:bg-slate-700/50 rounded">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">변화</p>
                      <p
                        className={`font-semibold ${
                          risk.metrics.trend === 'down'
                            ? 'text-red-600 dark:text-red-400'
                            : risk.metrics.trend === 'up'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {risk.metrics.trend === 'down' ? '↓' : risk.metrics.trend === 'up' ? '↑' : '→'}{' '}
                        {risk.metrics.change !== 0
                          ? `${risk.metrics.change >= 0 ? '+' : ''}${risk.metrics.change.toFixed(1)}%`
                          : '변화 없음'}
                      </p>
                    </div>
                  </div>

                  {/* 완화 액션 */}
                  {risk.mitigationActions && risk.mitigationActions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                        완화 방안:
                      </p>
                      <ul className="space-y-1">
                        {risk.mitigationActions.map((action: string, aIdx: number) => (
                          <li key={aIdx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}


// 액션 제안 탭 (v4.2 Phase 3)
function ActionProposalsTab({ 
  data, 
  isLoading, 
  period 
}: { 
  data: any; 
  isLoading: boolean; 
  period: string 
}) {
  if (isLoading) {
    return (
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 rounded-full animate-spin border-t-indigo-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            액션 제안을 생성하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  if (!data || (!data.actions && !data.prioritizedActions) || (data.actions?.length === 0 && data.prioritizedActions?.length === 0)) {
    return (
      <EmptyState 
        icon="📋" 
        title="액션 제안을 불러올 수 없습니다" 
        description="선택한 기간에 대한 액션 제안이 없거나 분석 중 오류가 발생했습니다."
      />
    )
  }

  // 백엔드에서 prioritizedActions로 반환하므로 이를 사용
  const actions = data.prioritizedActions || data.actions || []
  const prioritizedActions = actions.sort((a: any, b: any) => {
    const priorityOrder: Record<string, number> = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 }
    return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99)
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0': return 'from-red-500 to-orange-500'
      case 'P1': return 'from-amber-500 to-yellow-500'
      case 'P2': return 'from-blue-500 to-indigo-500'
      case 'P3': return 'from-slate-400 to-slate-500'
      default: return 'from-slate-400 to-slate-500'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'P0': return '긴급'
      case 'P1': return '높음'
      case 'P2': return '중간'
      case 'P3': return '낮음'
      default: return priority
    }
  }

  return (
    <div className="space-y-6">
      {/* 요약 */}
      {data.summary && (
        <FadeIn>
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
              📋 액션 제안 요약
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {data.summary}
            </p>
          </Card>
        </FadeIn>
      )}

      {/* 우선순위별 액션 */}
      <div className="space-y-4">
        {prioritizedActions.map((action: any, idx: number) => (
          <FadeIn key={idx} delay={idx * 50}>
            <Card className={`p-6 border-l-4 ${
              action.priority === 'P0' ? 'border-l-red-500' :
              action.priority === 'P1' ? 'border-l-amber-500' :
              action.priority === 'P2' ? 'border-l-blue-500' :
              'border-l-slate-400'
            }`}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${getPriorityColor(action.priority)}`}>
                      {action.priority} - {getPriorityLabel(action.priority)}
                    </span>
                    {action.category && (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs">
                        {action.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                    {action.title}
                  </h3>
                  {action.description && (
                    <p className="text-slate-600 dark:text-slate-400 mb-3">
                      {action.description}
                    </p>
                  )}
                </div>
              </div>

              {/* 예상 효과 */}
              {action.expectedImpact && (
                <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-emerald-600 dark:text-emerald-400">💡</span>
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">예상 효과</span>
                  </div>
                  {typeof action.expectedImpact === 'string' ? (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {action.expectedImpact}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        <strong>{action.expectedImpact.metric}:</strong> {action.expectedImpact.currentValue.toLocaleString()} → {action.expectedImpact.projectedValue.toLocaleString()} 
                        <span className="ml-2 font-semibold">(+{action.expectedImpact.improvement}%)</span>
                      </p>
                      <p className="text-xs text-emerald-500 dark:text-emerald-400">
                        신뢰도: {action.expectedImpact.confidence}%
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 실행 계획 (recommendedActions 또는 executionPlan 사용) */}
              {(action.recommendedActions || action.executionPlan) && (action.recommendedActions?.length > 0 || action.executionPlan?.length > 0) && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    실행 계획:
                  </h4>
                  <ul className="space-y-2">
                    {(action.executionPlan || action.recommendedActions || []).map((step: string, stepIdx: number) => (
                      <li key={stepIdx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5">{stepIdx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 담당자 및 기간 */}
              {(action.owner || action.timeline) && (
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-700">
                  {action.owner && (
                    <div className="flex items-center gap-1">
                      <span>👤</span>
                      <span>담당자: {action.owner}</span>
                    </div>
                  )}
                  {action.timeline && (
                    <div className="flex items-center gap-1">
                      <span>📅</span>
                      <span>기간: {action.timeline}</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </FadeIn>
        ))}
      </div>
    </div>
  )
}

// 전략 제안 탭
function StrategyTab({ recommendations, isLoading }: { recommendations: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            전략을 수립하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  if (!recommendations) {
    return (
      <EmptyState 
        icon="🎯" 
        title="전략 제안을 불러오는 중입니다" 
        description="AI가 비즈니스 데이터를 분석하여 맞춤형 전략을 제안합니다."
      />
    )
  }

  const sections = [
    { key: 'shortTerm', title: '🚀 단기 (1-2주)', items: recommendations.shortTerm || [], color: 'from-blue-500 to-cyan-500' },
    { key: 'midTerm', title: '📅 중기 (1-3개월)', items: recommendations.midTerm || [], color: 'from-purple-500 to-pink-500' },
    { key: 'longTerm', title: '🎯 장기 (3개월+)', items: recommendations.longTerm || [], color: 'from-amber-500 to-orange-500' },
  ]

  return (
    <div className="space-y-6">
      {sections.map((section, sectionIdx) => (
        <FadeIn key={section.key} delay={sectionIdx * 100}>
          <Card className="p-6 overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${section.color}`} />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 mt-2">
              {section.title}
            </h2>
          {section.items.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 py-4">해당 기간의 제안이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {section.items.map((item: any, idx: number) => (
                <FadeIn key={idx} delay={sectionIdx * 100 + idx * 50}>
                  <div className={`p-5 rounded-xl border-l-4 hover:shadow-md transition-all duration-300 ${
                    item.priority === 'high' ? 'bg-gradient-to-r from-red-50 to-transparent dark:from-red-900/20 border-l-red-500' :
                    item.priority === 'medium' ? 'bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20 border-l-amber-500' :
                    'bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800 border-l-slate-300'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                        {item.title}
                      </h3>
                      <Badge variant={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'default'}>
                        {item.priority === 'high' ? '🔥 높음' : item.priority === 'medium' ? '⚡ 중간' : '💭 낮음'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          )}
        </Card>
      </FadeIn>
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
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-spin border-t-purple-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            고객 세그먼트를 분석하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  const segments = data?.segments || []
  const atRiskVIPs = data?.atRiskVIPs || []

  if (segments.length === 0) {
    return (
      <EmptyState 
        icon="👥" 
        title="고객 데이터가 없습니다" 
        description="선택한 기간에 고객 구매 데이터가 충분하지 않아 RFM 분석을 수행할 수 없습니다."
      />
    )
  }

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          👥 RFM 고객 세분화
        </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          최근 90일 구매 데이터 기반 고객 세그먼트 분석
        </p>
          </div>
          {/* v4.0: 다운로드 버튼 */}
          <ExportDropdown 
            types={[
              { type: 'rfm-segments', label: 'RFM 세그먼트 통계' },
              { type: 'rfm-customers', label: '전체 고객 목록' }
            ]} 
          />
        </div>
        
        {/* v5.0: ECharts 기반 도넛 차트 */}
        {(() => {
          const colorMap: Record<string, string> = {
            VIP: '#8B5CF6',
            Loyal: '#3B82F6',
            Potential: '#10B981',
            New: '#06B6D4',
            AtRisk: '#F59E0B',
            Dormant: '#F97316',
            Lost: '#EF4444',
          }
          const pieData = segments.map((seg: any) => ({
            name: segmentLabels[seg.segment] || seg.segment,
            value: seg.count,
            color: colorMap[seg.segment] || '#6B7280',
          }))
          const totalCustomers = segments.reduce((sum: number, seg: any) => sum + seg.count, 0)
          
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* v5.0: ECharts 도넛 차트 */}
              {pieData.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    세그먼트 분포
                  </h3>
                  <EChartsPieChart
                    data={pieData}
                    type="doughnut"
                    height={320}
                    showLabels={true}
                    showPercentage={true}
                    centerText={totalCustomers.toLocaleString()}
                    centerSubtext="총 고객"
                    legendPosition="bottom"
                    onSliceClick={(item) => {
                      console.log('세그먼트 클릭:', item)
                    }}
                  />
                </div>
              )}
              
              {/* 세그먼트 카드 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
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
            </div>
          )
        })()}
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
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-pink-200 dark:border-pink-800 rounded-full animate-spin border-t-pink-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            집중도를 분석하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  const artistConcentration = data?.artistConcentration
  const countryConcentration = data?.countryConcentration
  const customerConcentration = data?.customerConcentration

  if (!artistConcentration && !countryConcentration && !customerConcentration) {
    return (
      <EmptyState 
        icon="📊" 
        title="파레토 데이터가 없습니다" 
        description="선택한 기간에 충분한 데이터가 없어 파레토 분석을 수행할 수 없습니다."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 작가 집중도 */}
      {artistConcentration && (
        <FadeIn>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">🎨</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                작가 매출 집중도
              </h2>
              </div>
              {/* v4.0: 다운로드 버튼 */}
              <ExportButton type="pareto-artists" label="작가 데이터" />
            </div>
          
          {/* v5.0: ECharts 파레토 차트 */}
          {artistConcentration.topArtists && artistConcentration.topArtists.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                상위 작가 매출 분포 (파레토 차트)
              </h3>
              <EChartsBarChart
                data={artistConcentration.topArtists.slice(0, 15).map((a: any) => ({
                  name: a.name || a.artist || '',
                  value: a.revenue || a.totalRevenue || 0,
                }))}
                height={350}
                showPareto={true}
                showLabels={false}
                valueFormatter={(value) => {
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
                  return `$${value.toFixed(0)}`
                }}
                onBarClick={(item) => {
                  console.log('작가 클릭:', item)
                }}
              />
            </div>
          )}
          
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
        </FadeIn>
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
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-cyan-200 dark:border-cyan-800 rounded-full animate-spin border-t-cyan-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            코호트 데이터를 분석하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  const cohorts = data?.cohorts || []
  const overallRetentionCurve = data?.overallRetentionCurve || []

  if (cohorts.length === 0) {
    return (
      <EmptyState 
        icon="📅" 
        title="코호트 데이터가 없습니다" 
        description="선택한 기간에 충분한 고객 구매 이력이 없어 코호트 분석을 수행할 수 없습니다."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 리텐션 곡선 */}
      <FadeIn>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">📅</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                코호트 리텐션 분석
              </h2>
              <p className="text-xs text-slate-500">첫 구매 월 기준 고객 리텐션 추이</p>
            </div>
            </div>
            {/* v4.0: 다운로드 버튼 */}
            <ExportButton type="cohort-analysis" label="코호트 데이터" />
          </div>

          {/* 전체 리텐션 곡선 */}
          {overallRetentionCurve.length > 0 && (
            <div className="mb-6">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">평균 리텐션 곡선</div>
              <div className="flex items-end gap-1 h-40 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                {overallRetentionCurve.slice(0, 12).map((retention: number, idx: number) => (
                  <FadeIn key={idx} delay={idx * 30}>
                    <div className="flex-1 flex flex-col items-center group">
                      <div className="relative w-full">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t transition-all duration-500 group-hover:from-blue-500 group-hover:to-cyan-300"
                          style={{ height: `${Math.max(retention * 100, 2)}%`, minHeight: '4px' }}
                        />
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {(retention * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mt-2 font-medium">M{idx}</div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          )}
        </Card>
      </FadeIn>

      {/* v5.0: ECharts 코호트 히트맵 */}
      {cohorts.length > 0 && (
        <FadeIn delay={200}>
          <Card className="p-6">
            <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-4">
              📊 코호트 리텐션 히트맵
            </h3>
            {(() => {
              const cohortLabels = cohorts.slice(0, 12).map((c: any) => c.cohortMonth)
              const monthLabels = Array.from({ length: 12 }, (_, i) => `M${i}`)
              const heatmapData: { x: number; y: number; value: number }[] = []
              
              cohorts.slice(0, 12).forEach((c: any, yIdx: number) => {
                c.retentionByMonth.slice(0, 12).forEach((r: number, xIdx: number) => {
                  heatmapData.push({
                    x: xIdx,
                    y: yIdx,
                    value: (r || 0) * 100, // 퍼센트로 변환
                  })
                })
              })
              
              return (
                <EChartsHeatmap
                  data={heatmapData}
                  xLabels={monthLabels}
                  yLabels={cohortLabels}
                  height={450}
                  colorRange={['#EFF6FF', '#3B82F6', '#1E3A8A']}
                  valueFormatter={(v) => `${v.toFixed(0)}%`}
                  showValues={true}
                  minValue={0}
                  maxValue={100}
                  onCellClick={(cell) => {
                    console.log('코호트 셀 클릭:', cell)
                  }}
                />
              )
            })()}
          </Card>
        </FadeIn>
      )}

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
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-amber-200 dark:border-amber-800 rounded-full animate-spin border-t-amber-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            이상 패턴을 탐지하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  const anomalies = data?.anomalies || []
  const patternBreaks = data?.patternBreaks || []
  const trendChanges = data?.trendChanges || []

  const severityColors: Record<string, string> = {
    critical: 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-800/20 border-l-red-500',
    warning: 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20 border-l-amber-500',
    info: 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 border-l-blue-500',
  }

  const severityIcons: Record<string, string> = {
    critical: '🚨',
    warning: '⚠️',
    info: 'ℹ️',
  }

  return (
    <div className="space-y-6">
      {/* 이상치 목록 */}
      <FadeIn>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                탐지된 이상치
              </h2>
              <p className="text-xs text-slate-500">통계적으로 유의미한 편차가 발견된 데이터 포인트</p>
            </div>
            </div>
            {/* v4.0: 다운로드 버튼 */}
            <ExportButton type="anomaly-detection" label="이상 탐지 데이터" />
          </div>

          {/* 이상 탐지 차트 */}
          {anomalies.length > 0 && (() => {
            // 이상치를 날짜별로 그룹화
            const anomalyByDate = new Map<string, number[]>()
            anomalies.forEach((a: any) => {
              const date = a.date || ''
              if (!anomalyByDate.has(date)) {
                anomalyByDate.set(date, [])
              }
              anomalyByDate.get(date)!.push(a.actualValue || 0)
            })
            
            const dates = Array.from(anomalyByDate.keys()).sort()
            const values = dates.map(d => {
              const vals = anomalyByDate.get(d) || []
              return vals.reduce((sum, v) => sum + v, 0) / vals.length
            })
            
            if (dates.length > 0) {
              // v5.0: ECharts 기반 이상치 시각화
              const anomalyIndices = anomalies.map((a: any) => dates.indexOf(a.date)).filter((i: number) => i >= 0)
              
              return (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    이상치 추이 (이상 마커 표시)
                  </h3>
                  <EChartsTrendChart
                    series={[{
                      name: '실제 값',
                      data: dates.map((date, idx) => ({
                        date,
                        value: values[idx],
                      })),
                      color: '#3B82F6',
                      type: 'area',
                    }]}
                    height={300}
                    showDataZoom={false}
                    showChangepoints={true}
                    dateFormatter={(date) => {
                      const d = new Date(date)
                      return `${d.getMonth() + 1}/${d.getDate()}`
                    }}
                    valueFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
                      return value.toFixed(0)
                    }}
                  />
                  {/* 이상치 포인트 범례 */}
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Critical
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Warning
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Info
                    </span>
                  </div>
                </div>
              )
            }
            return null
          })()}

          {anomalies.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-emerald-600 dark:text-emerald-400 mb-2">모든 지표가 정상입니다</h3>
              <p className="text-sm text-slate-500">선택한 기간 동안 특이한 패턴이 감지되지 않았습니다.</p>
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
      </FadeIn>

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
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 rounded-full animate-spin border-t-indigo-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            종합 인사이트를 분석하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  if (!data) {
    return (
      <EmptyState 
        icon="🎯" 
        title="데이터를 불러올 수 없습니다" 
        description="선택한 기간에 데이터가 없거나 분석 중 오류가 발생했습니다."
      />
    )
  }

  const { summary, comparison, forecast, topInsights, risks, opportunities, recommendations } = data

  const metricCards = [
    { key: 'gmv', label: '총 매출', value: toKRW(summary?.gmv || 0), prefix: '₩', icon: '💰', color: 'from-emerald-500 to-teal-500' },
    { key: 'orders', label: '주문 수', value: summary?.orders || 0, icon: '📦', color: 'from-blue-500 to-indigo-500' },
    { key: 'aov', label: '평균 객단가', value: toKRW(summary?.aov || 0), prefix: '₩', decimals: 0, icon: '💵', color: 'from-purple-500 to-pink-500' },
    { key: 'customers', label: '고객 수', value: summary?.customers || 0, icon: '👥', color: 'from-amber-500 to-orange-500' },
    { key: 'artists', label: '활동 작가', value: summary?.artists || 0, icon: '🎨', color: 'from-rose-500 to-red-500' },
  ]

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metricCards.map((metric, idx) => (
          <FadeIn key={metric.key} delay={idx * 50}>
            <Card className="p-5 text-center hover:shadow-lg hover:scale-102 transition-all duration-300 overflow-hidden relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-5`} />
              <div className="relative">
                <div className="text-2xl mb-2">{metric.icon}</div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  {metric.label}
                </div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  <AnimatedNumber 
                    value={metric.value} 
                    prefix={metric.prefix || ''} 
                    decimals={metric.decimals || 0}
                  />
                </div>
              </div>
            </Card>
          </FadeIn>
        ))}
      </div>

      {/* 기간 비교 */}
      {comparison && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              📊 이전 기간 대비 변화
            </h3>
            {comparison.period1 && (
              <span className="text-xs text-slate-400">
                비교: {comparison.period1.start} ~ {comparison.period1.end}
              </span>
            )}
          </div>
          {!comparison.metrics?.gmv?.comparable && comparison.metrics?.gmv?.period2 > 0 ? (
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🆕</span>
                <div>
                  <p className="font-medium text-blue-700 dark:text-blue-300">신규 데이터 기간입니다</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">이전 비교 기간에 데이터가 없어 변화율을 계산할 수 없습니다.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {Object.entries(comparison.metrics).map(([key, value]: [string, any]) => (
                  <div key={key} className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {key === 'gmv' ? '현재 매출' : key === 'orders' ? '현재 주문' : key === 'aov' ? '현재 객단가' : '현재 고객'}
                    </div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {key === 'gmv' || key === 'aov' ? formatKRW(value.period2 || 0) : (value.period2 || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : comparison.metrics?.gmv?.period1 === 0 && comparison.metrics?.gmv?.period2 === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <p>분석할 데이터가 없습니다.</p>
              <p className="text-xs mt-2">선택한 기간에 주문 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(comparison.metrics).map(([key, value]: [string, any]) => (
                <div key={key} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-shadow">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                    {key === 'gmv' ? '매출' : key === 'orders' ? '주문' : key === 'aov' ? '객단가' : '고객'}
                  </div>
                  <div className={`text-xl font-bold ${
                    value.changePercent === null ? 'text-blue-600' :
                    value.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {value.changePercent === null ? '신규' : 
                      `${value.changePercent >= 0 ? '+' : ''}${value.changePercent.toFixed(1)}%`}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    <span className="text-slate-500">{key === 'gmv' || key === 'aov' ? formatKRW(value.period1 || 0) : (value.period1 || 0).toLocaleString()}</span>
                    <span className="mx-1">→</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">{key === 'gmv' || key === 'aov' ? formatKRW(value.period2 || 0) : (value.period2 || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                <div className="text-sm font-medium">{formatKRW(pred.predicted || 0)}</div>
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
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-teal-200 dark:border-teal-800 rounded-full animate-spin border-t-teal-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            기간별 추이를 분석하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  if (!data || !data.periods?.length) {
    return (
      <EmptyState 
        icon="📅" 
        title="기간별 데이터가 없습니다" 
        description="충분한 과거 데이터가 없어 기간별 추이 분석을 수행할 수 없습니다."
      />
    )
  }

  const { periods, trends, bestPeriod, worstPeriod, insights, seasonalityDetected } = data
  
  // 모든 기간의 GMV가 0인지 확인
  const hasAnyData = periods.some((p: any) => p.gmv > 0)
  
  if (!hasAnyData) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
            선택한 기간에 데이터가 없습니다
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            분석된 기간({periods[0]?.label} ~ {periods[periods.length-1]?.label})에 주문 데이터가 없습니다.
          </p>
          <div className="inline-block p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-left text-sm text-slate-600 dark:text-slate-400">
            <p className="font-medium mb-2">확인 사항:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Google Sheets에 logistics 데이터가 있는지 확인하세요</li>
              <li>order_created 날짜 형식이 올바른지 확인하세요</li>
              <li>더 짧은 분석 기간을 선택해보세요</li>
            </ul>
          </div>
        </div>
      </Card>
    )
  }

  const trendCards = [
    { label: '매출 트렌드', trend: trends?.gmv, icon: '💰' },
    { label: '주문 트렌드', trend: trends?.orders, icon: '📦' },
    { label: '객단가 트렌드', trend: trends?.aov, icon: '💵' },
  ]

  return (
    <div className="space-y-6">
      {/* 트렌드 요약 */}
      <div className="grid md:grid-cols-3 gap-4">
        {trendCards.map((card, idx) => (
          <FadeIn key={card.label} delay={idx * 50}>
            <Card className="p-5 hover:shadow-lg hover:scale-102 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{card.icon}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</span>
              </div>
              <div className={`text-2xl font-bold ${
                card.trend?.direction === 'up' ? 'text-emerald-600' : 
                card.trend?.direction === 'down' ? 'text-red-600' : 'text-slate-600'
              }`}>
                {card.trend?.direction === 'up' ? '📈 상승' : 
                 card.trend?.direction === 'down' ? '📉 하락' : '➡️ 안정'}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                평균 성장률: <span className="font-medium">{card.trend?.avgGrowth?.toFixed(1) || 0}%</span>
              </div>
            </Card>
          </FadeIn>
        ))}
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
                <div className="w-32 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                  {formatKRW(period.gmv || 0)}
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
                  <td className="text-right py-3 px-4">{formatKRW(period.gmv || 0)}</td>
                  <td className="text-right py-3 px-4">{period.orders?.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">{formatKRW(period.aov || 0)}</td>
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
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-violet-200 dark:border-violet-800 rounded-full animate-spin border-t-violet-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🔮</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            AI가 매출을 예측하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  if (!data || !data.predictions?.length) {
    return (
      <EmptyState 
        icon="🔮" 
        title="예측 데이터를 생성할 수 없습니다" 
        description="충분한 과거 데이터가 필요합니다. 더 긴 기간을 선택하거나 데이터가 축적될 때까지 기다려주세요."
      />
    )
  }

  const { historicalData, predictions, trend, confidence, seasonality, accuracy } = data

  const forecastCards = [
    { 
      label: '예측 트렌드', 
      value: trend === 'up' ? '📈 상승' : trend === 'down' ? '📉 하락' : '➡️ 안정',
      color: trend === 'up' ? 'from-emerald-500 to-teal-500' : trend === 'down' ? 'from-red-500 to-rose-500' : 'from-slate-500 to-gray-500'
    },
    { 
      label: '예측 신뢰도', 
      value: `${confidence?.toFixed(0) || 0}%`,
      color: confidence >= 70 ? 'from-emerald-500 to-teal-500' : confidence >= 50 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-500'
    },
    { 
      label: 'MAPE', 
      value: `${accuracy?.mape?.toFixed(1) || 0}%`,
      subtitle: '낮을수록 정확',
      color: 'from-blue-500 to-indigo-500'
    },
    { 
      label: '시즌성', 
      value: seasonality?.weekly ? '주간 패턴' : seasonality?.monthly ? '월간 패턴' : '감지 안됨',
      color: 'from-purple-500 to-violet-500'
    },
  ]

  return (
    <div className="space-y-6">
      {/* 예측 요약 */}
      <div className="grid md:grid-cols-4 gap-4">
        {forecastCards.map((card, idx) => (
          <FadeIn key={card.label} delay={idx * 50}>
            <Card className="p-5 text-center hover:shadow-lg hover:scale-102 transition-all duration-300 overflow-hidden relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5`} />
              <div className="relative">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  {card.label}
                </div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {card.value}
                </div>
                {card.subtitle && (
                  <div className="text-xs text-slate-400 mt-1">{card.subtitle}</div>
                )}
              </div>
            </Card>
          </FadeIn>
        ))}
      </div>

      {/* v5.0: ECharts 기반 예측 차트 */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl">🔮</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              향후 30일 매출 예측
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              신뢰 구간 포함 • 과거 데이터 기반 앙상블 예측
            </p>
          </div>
        </div>
        
        {(() => {
          // 예측 데이터를 ECharts 형식으로 변환
          const formattedHistorical = (historicalData || []).slice(-30).map((d: any) => ({
            date: d.date,
            value: d.value,
          }))
          
          const formattedPredictions = (predictions || []).map((p: any) => ({
            date: p.date,
            predicted: p.predicted,
            lower95: p.lower || p.predicted * 0.8,
            upper95: p.upper || p.predicted * 1.2,
            lower80: p.lower80 || p.predicted * 0.9,
            upper80: p.upper80 || p.predicted * 1.1,
          }))
          
          if (formattedHistorical.length === 0 && formattedPredictions.length === 0) {
            return (
              <div className="text-center py-8 text-slate-500">
                예측 데이터가 없습니다.
              </div>
            )
          }
          
          // EChartsForecast 컴포넌트가 없으면 기본 차트 사용
          return (
            <EChartsTrendChart
              series={[
                {
                  name: '실제 매출',
                  data: formattedHistorical,
                  color: '#F97316',
                  type: 'area',
                },
                ...(formattedPredictions.length > 0 ? [{
                  name: '예측 매출',
                  data: formattedPredictions.map((p: any) => ({
                    date: p.date,
                    value: p.predicted,
                  })),
                  color: '#8B5CF6',
                  type: 'line' as const,
                }] : []),
              ]}
              height={400}
              showDataZoom={true}
              showLegend={true}
              dateFormatter={(date) => {
                const d = new Date(date)
                return `${d.getMonth() + 1}/${d.getDate()}`
              }}
              valueFormatter={(value) => {
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
                return `$${value.toFixed(0)}`
              }}
            />
          )
        })()}
        
        {/* 신뢰 구간 범례 */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span>실제 매출</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-violet-500" />
            <span>예측 매출</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-violet-200 dark:bg-violet-800" />
            <span>95% 신뢰구간</span>
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
                  <td className="text-right py-2 px-4 font-medium">{formatKRW(p.predicted || 0)}</td>
                  <td className="text-right py-2 px-4 text-slate-500">{formatKRW(p.lower || 0)}</td>
                  <td className="text-right py-2 px-4 text-slate-500">{formatKRW(p.upper || 0)}</td>
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

// ==================== v4.1: 신규 유저 유치 탭 ====================

function NewUserAcquisitionTab({ data, isLoading, period }: { data: any; isLoading: boolean; period: string }) {
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<any>(null)
  
  if (isLoading) {
    return (
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🆕</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            신규 유저 유치 데이터를 분석하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  if (!data || !data.success) {
    return (
      <EmptyState 
        icon="🆕" 
        title="신규 유저 유치 분석 데이터 없음" 
        description="선택한 기간에 신규 유저 데이터가 없거나 분석 중 오류가 발생했습니다."
      />
    )
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">🆕</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  신규 유저 유치 분석
                </h2>
                <p className="text-xs text-slate-500">채널별 성과 및 전환율 분석</p>
              </div>
            </div>
          </div>

          {/* 데이터 품질 표시 */}
          {data?.metadata?.overallDataQuality && (
            <div className="mb-6">
              <DataQualityIndicator quality={data.metadata.overallDataQuality} />
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center relative">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {data?.channels?.reduce((sum: number, c: any) => sum + (c.newUsers || 0), 0) || 0}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">신규 유저</div>
              {/* v4.2: 신뢰도 정보 */}
              {data?.channels?.[0]?.newUsersConfidence && (
                <div className="mt-2 flex justify-center">
                  <ConfidenceBadge 
                    reliability={data.channels[0].newUsersConfidence.reliability}
                    sampleSize={data.channels[0].newUsersConfidence.sampleSize}
                    dataSource={data.channels[0].newUsersConfidence.dataSource}
                  />
                </div>
              )}
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data?.conversionFunnel && data.conversionFunnel.length > 0 && data.conversionFunnel[data.conversionFunnel.length - 1]?.conversionRate 
                  ? Math.round(data.conversionFunnel[data.conversionFunnel.length - 1].conversionRate * 100) 
                  : 0}%
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">가입→첫 구매 전환율</div>
              {/* v4.2: 신뢰도 정보 */}
              {data?.conversionFunnel?.[data.conversionFunnel.length - 1]?.conversionRateConfidence && (
                <div className="mt-2">
                  <ConfidenceInterval
                    value={data.conversionFunnel[data.conversionFunnel.length - 1].conversionRate}
                    interval={data.conversionFunnel[data.conversionFunnel.length - 1].conversionRateConfidence.confidenceInterval}
                    confidenceLevel={0.95}
                    format="percentage"
                  />
                </div>
              )}
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                ${data?.newUserQuality?.avgFirstPurchaseValue?.toFixed(0) || 0}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">평균 첫 구매액</div>
              {/* v4.2: 신뢰도 정보 */}
              {data?.newUserQuality?.avgFirstPurchaseValueConfidence && (
                <div className="mt-2">
                  <ConfidenceInterval
                    value={data.newUserQuality.avgFirstPurchaseValue}
                    interval={data.newUserQuality.avgFirstPurchaseValueConfidence.confidenceInterval}
                    confidenceLevel={0.95}
                    format="currency"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 채널별 성과 */}
          {data?.channels && data.channels.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">채널별 성과</h3>
              <div className="space-y-2">
                {data.channels.slice(0, 5).map((channel: any, idx: number) => (
                  <FadeIn key={channel.channel} delay={idx * 50}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {channel.channel}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">
                            {channel.newUsers}명
                          </Badge>
                          {/* v4.2: 신뢰도 배지 */}
                          {channel.newUsersConfidence && (
                            <ConfidenceBadge 
                              reliability={channel.newUsersConfidence.reliability}
                              sampleSize={channel.newUsersConfidence.sampleSize}
                              dataSource={channel.newUsersConfidence.dataSource}
                            />
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">전환율</span>
                          <div className="font-semibold text-slate-700 dark:text-slate-300">
                            {Math.round(channel.firstPurchaseRate * 100)}%
                          </div>
                          {/* v4.2: 신뢰 구간 */}
                          {channel.firstPurchaseRateConfidence && (
                            <ConfidenceInterval
                              value={channel.firstPurchaseRate}
                              interval={channel.firstPurchaseRateConfidence.confidenceInterval}
                              confidenceLevel={0.95}
                              format="percentage"
                              className="mt-1"
                            />
                          )}
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">평균 LTV</span>
                          <div className="font-semibold text-slate-700 dark:text-slate-300">
                            ${channel.ltv.toFixed(0)}
                          </div>
                          {/* v4.2: 신뢰 구간 */}
                          {channel.ltvConfidence && (
                            <ConfidenceInterval
                              value={channel.ltv}
                              interval={channel.ltvConfidence.confidenceInterval}
                              confidenceLevel={0.95}
                              format="currency"
                              className="mt-1"
                            />
                          )}
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">ROI</span>
                          <div className="font-semibold text-slate-700 dark:text-slate-300">
                            {channel.roi === 999 ? 'N/A' : `${channel.roi.toFixed(1)}x`}
                          </div>
                          {/* v4.2: ROI 신뢰도 정보 */}
                          {channel.roiConfidence && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {channel.roiConfidence.reason || (channel.roiConfidence.dataAvailability ? '데이터 있음' : '데이터 없음')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          )}

          {/* 전환율 퍼널 */}
          {data?.conversionFunnel && data.conversionFunnel.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">전환율 퍼널</h3>
              <div className="space-y-3">
                {data.conversionFunnel.map((stage: any, idx: number) => (
                  <FadeIn key={stage.stage} delay={idx * 50}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {stage.stage}
                          {/* v4.2: 추정치 표시 */}
                          {stage.dataSource === 'estimated' && (
                            <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">⚠️ 추정치</span>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {stage.count.toLocaleString()}명
                          </span>
                          {/* v4.2: 신뢰도 배지 */}
                          {stage.countConfidence && (
                            <ConfidenceBadge 
                              reliability={stage.countConfidence.reliability}
                              sampleSize={stage.countConfidence.sampleSize}
                              dataSource={stage.dataSource}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${stage.conversionRate * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-16 text-right">
                          {Math.round(stage.conversionRate * 100)}%
                        </span>
                      </div>
                      {stage.dropoffRate > 0 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          이탈율: {Math.round(stage.dropoffRate * 100)}%
                        </div>
                      )}
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          )}

          {/* 신규 유저 품질 */}
          {data?.newUserQuality && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">신규 유저 품질 분석</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {data.newUserQuality.highPotential || 0}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">고품질 유저</div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {data.newUserQuality.mediumPotential || 0}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">중품질 유저</div>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-xl text-center">
                  <div className="text-xl font-bold text-slate-600 dark:text-slate-400">
                    {data.newUserQuality.lowPotential || 0}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">저품질 유저</div>
                </div>
              </div>
            </div>
          )}

          {/* 인사이트 */}
          {data?.insights && data.insights.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">인사이트 및 권장 조치</h3>
              <div className="space-y-3">
                {data.insights.map((insight: any, idx: number) => (
                  <FadeIn key={idx} delay={idx * 50}>
                    <div className={`p-4 rounded-xl border-l-4 ${
                      insight.priority === 'high' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                      insight.priority === 'medium' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500' :
                      'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                    }`}>
                      <div className="flex items-start gap-3">
                        <span className="text-xl">
                          {insight.priority === 'high' ? '🔴' : insight.priority === 'medium' ? '🟡' : '🔵'}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 dark:text-slate-100 mb-1">
                            {insight.insight}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            <strong>권장 조치:</strong> {insight.recommendedAction}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            <strong>예상 효과:</strong> {insight.expectedImpact}
                          </p>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          )}
        </Card>
      </FadeIn>
    </div>
  )
}

// ==================== v4.1: 재구매율 향상 탭 ====================

function RepurchaseAnalysisTab({ data, isLoading, period }: { data: any; isLoading: boolean; period: string }) {
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<any>(null)
  
  if (isLoading) {
    return (
      <FadeIn>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-green-200 dark:border-green-800 rounded-full animate-spin border-t-green-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🔄</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            재구매율 데이터를 분석하고 있습니다...
          </p>
        </div>
      </FadeIn>
    )
  }

  if (!data || !data.success) {
    return (
      <EmptyState 
        icon="🔄" 
        title="재구매율 향상 분석 데이터 없음" 
        description="선택한 기간에 1회 구매 고객 데이터가 없거나 분석 중 오류가 발생했습니다."
      />
    )
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">🔄</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  재구매율 향상 분석
                </h2>
                <p className="text-xs text-slate-500">1회 구매 고객 재구매 전환 분석</p>
              </div>
            </div>
          </div>

          {/* 데이터 품질 표시 */}
          {data?.metadata?.overallDataQuality && (
            <div className="mb-6">
              <DataQualityIndicator quality={data.metadata.overallDataQuality} />
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data?.oneTimeBuyers?.total || 0}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">1회 구매 고객</div>
              {/* v4.2: 신뢰도 정보 */}
              {data?.oneTimeBuyers?.totalConfidence && (
                <div className="mt-2 flex justify-center">
                  <ConfidenceBadge 
                    reliability={data.oneTimeBuyers.totalConfidence.reliability}
                    sampleSize={data.oneTimeBuyers.totalConfidence.sampleSize}
                    dataSource={data.oneTimeBuyers.totalConfidence.dataSource}
                  />
                </div>
              )}
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {data?.repurchaseConversion && data.repurchaseConversion.length > 0 
                  ? Math.round((data.repurchaseConversion[data.repurchaseConversion.length - 1]?.conversionRate || 0) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">90일 내 재구매율</div>
              {/* v4.2: 신뢰도 정보 */}
              {data?.repurchaseConversion?.[data.repurchaseConversion.length - 1]?.conversionRateConfidence && (
                <div className="mt-2">
                  <ConfidenceInterval
                    value={data.repurchaseConversion[data.repurchaseConversion.length - 1].conversionRate}
                    interval={data.repurchaseConversion[data.repurchaseConversion.length - 1].conversionRateConfidence.confidenceInterval}
                    confidenceLevel={0.95}
                    format="percentage"
                  />
                </div>
              )}
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {data?.repurchaseConversion && data.repurchaseConversion.length > 0
                  ? Math.round(data.repurchaseConversion[data.repurchaseConversion.length - 1]?.avgDaysToRepurchase || 0)
                  : 0}일
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">평균 재구매 일수</div>
              {/* v4.2: 신뢰도 정보 */}
              {data?.repurchaseConversion?.[data.repurchaseConversion.length - 1]?.avgDaysToRepurchaseConfidence && (
                <div className="mt-2">
                  <ConfidenceInterval
                    value={data.repurchaseConversion[data.repurchaseConversion.length - 1].avgDaysToRepurchase}
                    interval={data.repurchaseConversion[data.repurchaseConversion.length - 1].avgDaysToRepurchaseConfidence.confidenceInterval}
                    confidenceLevel={0.95}
                    format="number"
                    unit="일"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 1회 구매 고객 세분화 */}
          {data?.oneTimeBuyers && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">1회 구매 고객 세분화</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {data.oneTimeBuyers.highPotential || 0}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">재구매 가능성 높음</div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {data.oneTimeBuyers.atRisk || 0}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">재구매 가능성 낮음</div>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-xl text-center">
                  <div className="text-xl font-bold text-slate-600 dark:text-slate-400">
                    ${data.oneTimeBuyers.avgFirstPurchaseValue?.toFixed(0) || 0}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">평균 첫 구매액</div>
                </div>
              </div>
            </div>
          )}

          {/* 재구매 전환율 (기간별) */}
          {data?.repurchaseConversion && data.repurchaseConversion.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">기간별 재구매 전환율</h3>
              {/* 그룹 바 차트 */}
              <div className="mb-4">
                <BarChart
                  data={{
                    labels: data.repurchaseConversion.map((c: any) => `${c.period}일`),
                    datasets: [
                      {
                        label: '재구매 고객',
                        data: data.repurchaseConversion.map((c: any) => c.repurchased || 0),
                        color: '#10B981', // emerald-500
                      },
                      {
                        label: '미재구매 고객',
                        data: data.repurchaseConversion.map((c: any) => (c.total || 0) - (c.repurchased || 0)),
                        color: '#6B7280', // gray-500
                      },
                    ],
                  }}
                  height={250}
                  stacked={true}
                />
              </div>
              <div className="space-y-3">
                {data.repurchaseConversion.map((conv: any, idx: number) => (
                  <FadeIn key={conv.period} delay={idx * 50}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {conv.period} 내 재구매율
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
                            {Math.round(conv.conversionRate * 100)}%
                          </span>
                          {/* v4.2: 신뢰도 배지 */}
                          {conv.conversionRateConfidence && (
                            <ConfidenceBadge 
                              reliability={conv.conversionRateConfidence.reliability}
                              sampleSize={conv.conversionRateConfidence.sampleSize}
                              dataSource={conv.conversionRateConfidence.dataSource}
                            />
                          )}
                        </div>
                      </div>
                      {/* v4.2: 신뢰 구간 */}
                      {conv.conversionRateConfidence && (
                        <div className="mb-2">
                          <ConfidenceInterval
                            value={conv.conversionRate}
                            interval={conv.conversionRateConfidence.confidenceInterval}
                            confidenceLevel={0.95}
                            format="percentage"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${conv.conversionRate * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          평균 {conv.avgDaysToRepurchase.toFixed(0)}일
                        </span>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          )}

          {/* 재구매 예측 (상위 고객) */}
          {data?.repurchasePrediction && data.repurchasePrediction.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                재구매 예측 (상위 {Math.min(data.repurchasePrediction.length, 10)}명)
              </h3>
              <div className="space-y-2">
                {data.repurchasePrediction.slice(0, 10).map((pred: any, idx: number) => (
                  <FadeIn key={pred.customerId} delay={idx * 30}>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          고객 #{pred.customerId}
                        </span>
                        <Badge variant={pred.repurchaseProbability >= 70 ? 'danger' : pred.repurchaseProbability >= 50 ? 'warning' : 'default'}>
                          재구매 확률 {pred.repurchaseProbability}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                        <span>예상 재구매: {pred.predictedDaysToRepurchase}일 후</span>
                        {pred.recommendedActions && pred.recommendedActions.length > 0 && (
                          <span className="text-indigo-600 dark:text-indigo-400">
                            권장: {pred.recommendedActions[0].action}
                          </span>
                        )}
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          )}

          {/* 인사이트 */}
          {data?.insights && data.insights.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">인사이트 및 권장 조치</h3>
              <div className="space-y-3">
                {data.insights.map((insight: any, idx: number) => (
                  <FadeIn key={idx} delay={idx * 50}>
                    <div className={`p-4 rounded-xl border-l-4 ${
                      insight.priority === 'high' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                      insight.priority === 'medium' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500' :
                      'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                    }`}>
                      <div className="flex items-start gap-3">
                        <span className="text-xl">
                          {insight.priority === 'high' ? '🔴' : insight.priority === 'medium' ? '🟡' : '🔵'}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 dark:text-slate-100 mb-1">
                            {insight.insight}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">
                            <strong>타겟:</strong> {insight.targetSegment}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            <strong>권장 조치:</strong> {insight.recommendedAction}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            <strong>예상 효과:</strong> {insight.expectedImpact}
                          </p>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          )}
        </Card>
      </FadeIn>

    </div>
  )
}
