'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { Tooltip } from '@/components/ui/Tooltip'
import { 
  Brain, TrendingUp, TrendingDown, Users, ShoppingCart, 
  DollarSign, AlertTriangle, Lightbulb, CheckCircle, 
  ArrowRight, RefreshCw, Zap, Target, BarChart3,
  MessageCircle, Activity, Clock
} from 'lucide-react'
import { EChartsTrendChart } from './charts'

// 환율 상수
const USD_TO_KRW = 1350

// 포맷팅 함수들
function formatCurrency(value: number, currency: 'USD' | 'KRW' = 'USD'): string {
  if (currency === 'KRW') {
    return `₩${Math.round(value * USD_TO_KRW).toLocaleString()}`
  }
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatNumber(value: number): string {
  return value.toLocaleString()
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// 숫자 카운트업 훅
function useCountUp(end: number, duration: number = 1200): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (end === 0) {
      setCount(0)
      return
    }

    let startTime: number | null = null
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 4) // easeOutQuart
      setCount(end * easeProgress)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return count
}

// 애니메이션 컴포넌트
function FadeInUp({ children, delay = 0, className = '' }: { 
  children: React.ReactNode
  delay?: number
  className?: string 
}) {
  const [visible, setVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={`transition-all duration-500 ease-out ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
    } ${className}`}>
      {children}
    </div>
  )
}

// 스파크라인 컴포넌트 (간단한 SVG)
function Sparkline({ data, color = '#10B981', height = 32 }: { 
  data: number[]
  color?: string
  height?: number 
}) {
  if (!data || data.length < 2) return null
  
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = height - ((value - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="100%" height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// KPI 카드 컴포넌트
function KPICard({ 
  icon, 
  label, 
  value, 
  change, 
  sparklineData,
  onClick,
  delay = 0
}: {
  icon: any
  label: string
  value: string | number
  change?: number
  sparklineData?: number[]
  onClick?: () => void
  delay?: number
}) {
  const isPositive = (change ?? 0) >= 0
  const animatedValue = useCountUp(typeof value === 'number' ? value : 0, 1200)
  const displayValue = typeof value === 'number' ? Math.round(animatedValue).toLocaleString() : value

  return (
    <FadeInUp delay={delay}>
      <div 
        onClick={onClick}
        className={`
          group relative bg-white dark:bg-slate-800 rounded-2xl p-5 
          border border-slate-200 dark:border-slate-700
          transition-all duration-300 ease-out
          hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50
          hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-600
          ${onClick ? 'cursor-pointer' : ''}
        `}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`
            w-11 h-11 rounded-xl flex items-center justify-center
            bg-gradient-to-br from-slate-100 to-slate-200 
            dark:from-slate-700 dark:to-slate-800
            group-hover:scale-110 transition-transform duration-300
          `}>
            <Icon icon={icon} size="md" className="text-slate-600 dark:text-slate-300" />
          </div>
          {change !== undefined && (
            <div className={`
              flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
              ${isPositive 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
            `}>
              <Icon icon={isPositive ? TrendingUp : TrendingDown} size="xs" />
              {formatPercent(change)}
            </div>
          )}
        </div>
        
        <div className="mb-2">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {displayValue}
          </p>
        </div>

        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <Sparkline 
              data={sparklineData} 
              color={isPositive ? '#10B981' : '#EF4444'} 
              height={28}
            />
          </div>
        )}

        {onClick && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Icon icon={ArrowRight} size="sm" className="text-slate-400" />
          </div>
        )}
      </div>
    </FadeInUp>
  )
}

// 프로그레스 링 컴포넌트
function ProgressRing({ 
  value, 
  max = 100, 
  size = 120, 
  strokeWidth = 10,
  color = '#FF6B35'
}: {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const animatedValue = useCountUp(value, 1500)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = (animatedValue / max) * circumference
  const offset = circumference - progress

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        {/* 프로그레스 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          {Math.round(animatedValue)}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">/ {max}</span>
      </div>
    </div>
  )
}

// 인사이트 카드 컴포넌트
function InsightCard({
  type,
  title,
  description,
  onClick,
  delay = 0
}: {
  type: 'danger' | 'warning' | 'success' | 'info'
  title: string
  description: string
  onClick?: () => void
  delay?: number
}) {
  const styles = {
    danger: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      dot: 'bg-red-500'
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      dot: 'bg-amber-500'
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
      dot: 'bg-emerald-500'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: Lightbulb,
      iconColor: 'text-blue-500',
      dot: 'bg-blue-500'
    }
  }

  const style = styles[type]

  return (
    <FadeInUp delay={delay}>
      <div 
        onClick={onClick}
        className={`
          group p-4 rounded-xl border transition-all duration-200
          ${style.bg} ${style.border}
          ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        `}
      >
        <div className="flex items-start gap-3">
          <div className={`w-2 h-2 rounded-full mt-2 ${style.dot}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Icon icon={style.icon} size="sm" className={style.iconColor} />
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                {title}
              </h4>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {description}
            </p>
          </div>
          {onClick && (
            <Icon 
              icon={ArrowRight} 
              size="sm" 
              className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" 
            />
          )}
        </div>
      </div>
    </FadeInUp>
  )
}

// 액션 아이템 컴포넌트
function ActionItem({
  title,
  impact,
  effort,
  onClick,
  delay = 0
}: {
  title: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  onClick?: () => void
  delay?: number
}) {
  const effortLabels = { low: '쉬움', medium: '보통', high: '어려움' }
  const effortColors = { 
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  return (
    <FadeInUp delay={delay}>
      <div 
        onClick={onClick}
        className={`
          group flex items-center gap-4 p-4 rounded-xl
          bg-slate-50 dark:bg-slate-800/50 
          border border-slate-200 dark:border-slate-700
          transition-all duration-200
          ${onClick ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800' : ''}
        `}
      >
        <div className="w-10 h-10 rounded-xl bg-idus-100 dark:bg-idus-900/30 flex items-center justify-center">
          <Icon icon={Zap} size="md" className="text-idus-600 dark:text-idus-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-800 dark:text-slate-100 text-sm mb-1">
            {title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            예상 효과: {impact}
          </p>
        </div>
        <Badge className={effortColors[effort]}>
          {effortLabels[effort]}
        </Badge>
        {onClick && (
          <Icon 
            icon={ArrowRight} 
            size="sm" 
            className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" 
          />
        )}
      </div>
    </FadeInUp>
  )
}

// 메인 통합 홈 컴포넌트
interface UnifiedHomeProps {
  briefing: any
  healthScore: any
  comprehensiveData: any
  trendsData?: any
  insightsData?: any
  isLoading: boolean
  period: string
  onTabChange: (tabId: string) => void
  onRefresh?: () => void
}

export function UnifiedHome({
  briefing,
  healthScore,
  comprehensiveData,
  trendsData,
  insightsData,
  isLoading,
  period,
  onTabChange,
  onRefresh
}: UnifiedHomeProps) {
  const router = useRouter()

  // KPI 데이터 추출 - 다양한 데이터 구조 지원
  const kpiData = useMemo(() => {
    // comprehensiveData 또는 briefing에서 데이터 추출
    const summary = comprehensiveData?.summary || comprehensiveData?.data?.summary || briefing?.summary || {}
    const comparison = comprehensiveData?.comparison || comprehensiveData?.data?.comparison || briefing?.comparison || {}
    
    // 다양한 키 이름 지원
    const gmv = summary.gmv || summary.totalGMV || summary.revenue || summary.totalRevenue || 0
    const orders = summary.orders || summary.totalOrders || summary.orderCount || 0
    const customers = summary.customers || summary.activeCustomers || summary.customerCount || 0
    const aov = summary.aov || summary.avgOrderValue || summary.averageOrderValue || (orders > 0 ? gmv / orders : 0)
    
    return {
      gmv,
      gmvChange: comparison?.gmv?.change || comparison?.revenue?.change || summary.gmvChange || 0,
      orders,
      ordersChange: comparison?.orders?.change || summary.ordersChange || 0,
      customers,
      customersChange: comparison?.customers?.change || summary.customersChange || 0,
      aov,
      aovChange: comparison?.aov?.change || summary.aovChange || 0
    }
  }, [comprehensiveData, briefing])

  // 날짜 파싱 및 정렬 함수 (다양한 날짜 형식 지원)
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null
    
    // ISO 형식: "2025-12-16"
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return new Date(dateStr)
    }
    
    // MM/DD 형식: "11/17", "12/2"
    if (/^\d{1,2}\/\d{1,2}/.test(dateStr)) {
      const [month, day] = dateStr.split('/').map(Number)
      const currentYear = new Date().getFullYear()
      return new Date(currentYear, month - 1, day)
    }
    
    // YYYY/MM/DD 형식: "2025/12/16"
    if (/^\d{4}\/\d{2}\/\d{2}/.test(dateStr)) {
      return new Date(dateStr.replace(/\//g, '-'))
    }
    
    // 기본 Date 생성자 시도
    const parsed = new Date(dateStr)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  // 트렌드 데이터 추출 - 다양한 데이터 구조 지원 + 날짜 정렬 + 원화 변환
  const trendData = useMemo(() => {
    // timeSeries.dailyAggregation 구조 우선 확인
    const dailyAggregation = trendsData?.timeSeries?.dailyAggregation ||
                             trendsData?.dailyAggregation ||
                             comprehensiveData?.timeSeries?.dailyAggregation ||
                             []
    
    let data: Array<{ date: string; value: number }> = []
    
    if (Array.isArray(dailyAggregation) && dailyAggregation.length > 0) {
      data = dailyAggregation.slice(-14).map((item: any) => ({
        date: item.date || item.day || item.period || item.dateStr,
        // USD 값을 원화로 변환
        value: (item.gmv || item.revenue || item.value || item.amount || item.total || 0) * USD_TO_KRW
      }))
    } else {
      // 다른 소스에서 트렌드 데이터 찾기
      const trends = trendsData?.dailyTrends ||
                     trendsData?.data?.dailyTrends ||
                     trendsData?.trends ||
                     comprehensiveData?.trends || 
                     comprehensiveData?.data?.trends || 
                     comprehensiveData?.dailyTrends ||
                     briefing?.trends ||
                     []
      
      if (Array.isArray(trends) && trends.length > 0) {
        data = trends.slice(-14).map((item: any) => ({
          date: item.date || item.day || item.period || item.dateStr,
          // USD 값을 원화로 변환
          value: (item.gmv || item.revenue || item.value || item.amount || item.total || 0) * USD_TO_KRW
        }))
      }
    }
    
    // 날짜 순으로 정렬
    return data.sort((a, b) => {
      const dateA = parseDate(a.date || '')
      const dateB = parseDate(b.date || '')
      
      if (!dateA && !dateB) return 0
      if (!dateA) return 1
      if (!dateB) return -1
      
      return dateA.getTime() - dateB.getTime()
    })
  }, [comprehensiveData, briefing, trendsData])

  // 인사이트 데이터 추출 - 다양한 데이터 구조 지원
  const insights = useMemo(() => {
    // comprehensiveData에서 topInsights, risks, opportunities 추출
    const topInsights = comprehensiveData?.topInsights || []
    const risks = comprehensiveData?.risks || []
    const opportunities = comprehensiveData?.opportunities || []
    
    // 각각을 인사이트 객체로 변환
    const insightsFromComprehensive = [
      ...topInsights.map((msg: string) => ({ 
        message: msg, 
        type: 'info', 
        priority: 'medium' 
      })),
      ...risks.map((msg: string) => ({ 
        message: msg, 
        type: 'danger', 
        priority: 'high' 
      })),
      ...opportunities.map((msg: string) => ({ 
        message: msg, 
        type: 'success', 
        priority: 'medium' 
      }))
    ]
    
    // 다른 소스에서 인사이트 찾기
    let insightsList = insightsData?.insights ||
                       insightsData?.data?.insights ||
                       comprehensiveData?.insights || 
                       comprehensiveData?.data?.insights ||
                       briefing?.insights ||
                       []
    
    // highlights가 배열인 경우 변환
    if (briefing?.highlights && Array.isArray(briefing.highlights)) {
      const highlightsAsInsights = briefing.highlights.map((h: string) => ({ 
        message: h, 
        type: 'info', 
        priority: 'medium' 
      }))
      insightsList = [...insightsList, ...highlightsAsInsights]
    }
    
    // comprehensiveData 인사이트와 병합
    const allInsights = [...insightsFromComprehensive, ...insightsList]
    
    if (!Array.isArray(allInsights) || allInsights.length === 0) return []
    
    return allInsights.slice(0, 4).map((insight: any) => ({
      type: insight.type || 
            (insight.severity === 'critical' || insight.priority === 'high' ? 'danger' : 
            insight.severity === 'warning' || insight.priority === 'medium' ? 'warning' : 
            insight.type === 'opportunity' || insight.type === 'positive' ? 'success' : 'info'),
      title: insight.title || insight.message?.slice(0, 30) || insight.name || '인사이트',
      description: insight.description || insight.message || insight.detail || '',
      action: insight.action || insight.recommendation
    }))
  }, [comprehensiveData, briefing, insightsData])

  // 권장 액션 추출 - 다양한 데이터 구조 지원
  const actions = useMemo(() => {
    // comprehensiveData에서 recommendations 추출 (문자열 배열)
    const recommendations = comprehensiveData?.recommendations || []
    
    // 문자열 배열을 액션 객체로 변환
    const actionsFromRecommendations = recommendations.map((rec: string) => ({
      title: rec || '액션',
      impact: '효과 분석 중',
      effort: 'medium' as const
    }))
    
    // 다른 소스에서 액션 찾기
    const actionsList = comprehensiveData?.data?.recommendations ||
                        comprehensiveData?.actions ||
                        briefing?.recommendations ||
                        briefing?.actions ||
                        []
    
    // 객체 배열인 경우 그대로 사용
    const actionsFromList = Array.isArray(actionsList) ? actionsList.map((rec: any) => {
      if (typeof rec === 'string') {
        return {
          title: rec,
          impact: '효과 분석 중',
          effort: 'medium' as const
        }
      }
      return {
        title: rec.title || rec.action || rec.name || rec.recommendation || '액션',
        impact: rec.expectedImpact || rec.impact || rec.effect || '효과 분석 중',
        effort: rec.effort || rec.difficulty || 'medium'
      }
    }) : []
    
    // 병합
    const allActions = [...actionsFromRecommendations, ...actionsFromList]
    
    if (!Array.isArray(allActions) || allActions.length === 0) return []
    
    return allActions.slice(0, 3)
  }, [comprehensiveData, briefing])

  // 스파크라인 데이터
  const sparklineData = useMemo(() => {
    if (!trendData || trendData.length === 0) return []
    return trendData.map((d: any) => d.value)
  }, [trendData])

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* 스켈레톤 로딩 */}
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-36 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI 브리핑 섹션 */}
      <FadeInUp delay={0}>
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 dark:from-purple-900 dark:via-purple-800 dark:to-indigo-900 p-6 border-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <Icon icon={Brain} size="lg" className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">AI 경영 브리핑</h2>
                  <p className="text-purple-200 text-xs">최근 {period === '7d' ? '7일' : period === '30d' ? '30일' : period} 기준</p>
                </div>
              </div>
              {onRefresh && (
                <button 
                  onClick={onRefresh}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Icon icon={RefreshCw} size="sm" className="text-white" />
                </button>
              )}
            </div>

            <p className="text-white/90 text-base leading-relaxed mb-4">
              {briefing?.summary || '비즈니스 현황을 분석 중입니다...'}
            </p>

            {briefing?.quality && (
              <div className="flex items-center gap-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-200">브리핑 품질</span>
                  <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-1000"
                      style={{ width: `${briefing.quality.overall}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-white">{briefing.quality.overall}/100</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </FadeInUp>

      {/* KPI 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={DollarSign}
          label="총 매출 (GMV)"
          value={kpiData ? formatCurrency(kpiData.gmv, 'KRW') : '₩0'}
          change={kpiData?.gmvChange}
          sparklineData={sparklineData}
          onClick={() => onTabChange('revenue')}
          delay={100}
        />
        <KPICard
          icon={ShoppingCart}
          label="주문 수"
          value={kpiData?.orders || 0}
          change={kpiData?.ordersChange}
          onClick={() => onTabChange('revenue')}
          delay={150}
        />
        <KPICard
          icon={Users}
          label="활성 고객"
          value={kpiData?.customers || 0}
          change={kpiData?.customersChange}
          onClick={() => onTabChange('customer')}
          delay={200}
        />
        <KPICard
          icon={Activity}
          label="비즈니스 건강도"
          value={`${healthScore?.overall || 0}/100`}
          onClick={() => onTabChange('overview')}
          delay={250}
        />
      </div>

      {/* 메인 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 14일 매출 추이 */}
        <FadeInUp delay={300} className="lg:col-span-2">
          <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon icon={BarChart3} size="md" className="text-slate-500" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">최근 14일 매출 추이</h3>
              </div>
              <button 
                onClick={() => onTabChange('revenue')}
                className="text-sm text-idus-600 hover:text-idus-700 font-medium flex items-center gap-1"
              >
                상세 보기 <Icon icon={ArrowRight} size="xs" />
              </button>
            </div>
            
            {trendData.length > 0 ? (
              <div className="h-48">
                <EChartsTrendChart
                  series={[{
                    name: '매출',
                    data: trendData.map((d: any) => ({
                      date: d.date,
                      value: d.value
                    })),
                    type: 'area',
                    color: '#FF6B35'
                  }]}
                  height={180}
                  showLegend={false}
                  valueFormatter={(v) => formatCurrency(v, 'KRW')}
                />
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400">
                데이터를 불러오는 중...
              </div>
            )}
          </Card>
        </FadeInUp>

        {/* 비즈니스 건강도 */}
        <FadeInUp delay={350}>
          <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon={Target} size="md" className="text-slate-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">종합 현황 평가</h3>
            </div>
            
            <div className="flex flex-col items-center">
              <ProgressRing 
                value={healthScore?.overall || 0} 
                max={100}
                size={140}
                strokeWidth={12}
                color={
                  (healthScore?.overall || 0) >= 70 ? '#10B981' :
                  (healthScore?.overall || 0) >= 50 ? '#F59E0B' : '#EF4444'
                }
              />
              
              <div className="grid grid-cols-2 gap-3 mt-6 w-full">
                {Array.isArray(healthScore?.dimensions) && healthScore.dimensions.length > 0 ? (
                  healthScore.dimensions.map((dim: any, idx: number) => (
                    <div key={idx} className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{dim.name}</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{dim.score}</p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">매출</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">-</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">고객</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">-</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">작가</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">-</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">운영</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">-</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        </FadeInUp>
      </div>

      {/* 인사이트 & 권장 액션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 주요 인사이트 */}
        <FadeInUp delay={400}>
          <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon icon={Lightbulb} size="md" className="text-amber-500" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">주요 인사이트</h3>
              </div>
              <button 
                onClick={() => onTabChange('insight')}
                className="text-sm text-idus-600 hover:text-idus-700 font-medium flex items-center gap-1"
              >
                전체 보기 <Icon icon={ArrowRight} size="xs" />
              </button>
            </div>
            
            <div className="space-y-3">
              {insights.length > 0 ? insights.map((insight: any, idx: number) => (
                <InsightCard
                  key={idx}
                  type={insight.type}
                  title={insight.title}
                  description={insight.description}
                  onClick={() => onTabChange('insight')}
                  delay={450 + idx * 50}
                />
              )) : (
                <div className="text-center py-8 text-slate-400">
                  인사이트를 분석 중입니다...
                </div>
              )}
            </div>
          </Card>
        </FadeInUp>

        {/* 권장 액션 */}
        <FadeInUp delay={450}>
          <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon icon={Zap} size="md" className="text-idus-500" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">즉시 실행 권장 액션</h3>
              </div>
              <button 
                onClick={() => onTabChange('action')}
                className="text-sm text-idus-600 hover:text-idus-700 font-medium flex items-center gap-1"
              >
                전체 보기 <Icon icon={ArrowRight} size="xs" />
              </button>
            </div>
            
            <div className="space-y-3">
              {actions.length > 0 ? actions.map((action: any, idx: number) => (
                <ActionItem
                  key={idx}
                  title={action.title}
                  impact={action.impact}
                  effort={action.effort}
                  onClick={() => onTabChange('action')}
                  delay={500 + idx * 50}
                />
              )) : (
                <div className="text-center py-8 text-slate-400">
                  권장 액션을 분석 중입니다...
                </div>
              )}
            </div>
          </Card>
        </FadeInUp>
      </div>

      {/* 빠른 네비게이션 - IA 개편안 Phase 3: 전문 페이지로 이동 링크 */}
      <FadeInUp delay={600}>
        <Card className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <Icon icon={Clock} size="xs" className="inline mr-1" />
                마지막 업데이트: {new Date().toLocaleString('ko-KR')}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onTabChange('customer')}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  고객 요약
                </button>
                <button
                  onClick={() => onTabChange('revenue')}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  매출 요약
                </button>
                <button
                  onClick={() => onTabChange('explorer')}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  데이터 탐색기
                </button>
              </div>
            </div>
            {/* 전문 페이지 바로가기 */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">상세 분석:</span>
              <button
                onClick={() => router.push('/analytics')}
                className="px-3 py-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
              >
                성과 분석 허브
              </button>
              <button
                onClick={() => router.push('/customer-analytics')}
                className="px-3 py-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
              >
                고객 분석
              </button>
              <button
                onClick={() => router.push('/review-analytics')}
                className="px-3 py-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
              >
                리뷰 분석
              </button>
              <button
                onClick={() => router.push('/artist-analytics')}
                className="px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
              >
                작가 분석
              </button>
            </div>
          </div>
        </Card>
      </FadeInUp>
    </div>
  )
}

export default UnifiedHome

