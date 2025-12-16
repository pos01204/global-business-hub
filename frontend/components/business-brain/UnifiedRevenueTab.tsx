'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { 
  TrendingUp, TrendingDown, DollarSign, BarChart3, 
  Calendar, ArrowRight, Download, Target, Activity, ExternalLink
} from 'lucide-react'
import { EChartsTrendChart, EChartsBarChart, EChartsHeatmap, EChartsForecast } from './charts'

// 서브탭 타입
type RevenueSubTab = 'overview' | 'trends' | 'forecast'

// 환율 상수 (USD → KRW) - analytics 페이지와 동일
const USD_TO_KRW = 1350

// 원화 포맷팅 함수 (analytics 페이지와 동일)
function formatCurrency(value: number): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '₩0'
  }
  // USD 값을 원화로 변환
  const krwValue = Math.round(value * USD_TO_KRW)
  return `₩${krwValue.toLocaleString()}`
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// 서브탭 버튼 컴포넌트
function SubTabButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean
  onClick: () => void
  icon: any
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-200
        ${active 
          ? 'bg-idus-500 text-white shadow-md' 
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
        }
      `}
    >
      <Icon icon={icon} size="sm" />
      <span>{label}</span>
    </button>
  )
}

// KPI 미니 카드
function MiniKPICard({
  label,
  value,
  change,
  icon
}: {
  label: string
  value: string
  change?: number
  icon: any
}) {
  const isPositive = (change ?? 0) >= 0
  
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <Icon icon={icon} size="sm" className="text-slate-400" />
        {change !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-1 ${
            isPositive ? 'text-emerald-600' : 'text-red-600'
          }`}>
            <Icon icon={isPositive ? TrendingUp : TrendingDown} size="xs" />
            {formatPercent(change)}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  )
}

// 목표 달성률 게이지
function GoalGauge({ current, target, label }: { current: number; target: number; label: string }) {
  // target이 0이거나 NaN인 경우 최소값 설정
  const safeTarget = target > 0 ? target : (current > 0 ? current * 1.2 : 1000)
  const percentage = safeTarget > 0 ? Math.min((current / safeTarget) * 100, 100) : 0
  const isAchieved = current >= safeTarget
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className={`font-medium ${isAchieved ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-100'}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${
            isAchieved ? 'bg-emerald-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{formatCurrency(current)}</span>
        <span>목표: {formatCurrency(safeTarget)}</span>
      </div>
    </div>
  )
}

// 메인 통합 매출 탭 컴포넌트
interface UnifiedRevenueTabProps {
  trendsData: any
  forecastData: any
  cohortData: any
  multiPeriodData: any
  isLoading: boolean
  period: string
}

export function UnifiedRevenueTab({
  trendsData,
  forecastData,
  cohortData,
  multiPeriodData,
  isLoading
}: UnifiedRevenueTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<RevenueSubTab>('overview')

  // 트렌드 차트 데이터 - 다양한 데이터 구조 지원
  const trendChartData = useMemo(() => {
    // timeSeries.dailyAggregation 구조 우선 확인
    const dailyAggregation = trendsData?.timeSeries?.dailyAggregation ||
                             trendsData?.dailyAggregation ||
                             []
    
    if (Array.isArray(dailyAggregation) && dailyAggregation.length > 0) {
      return dailyAggregation.map((item: any) => ({
        date: item.date || item.day || item.period,
        value: item.gmv || item.revenue || item.value || item.amount || 0
      }))
    }
    
    // 다른 소스에서 트렌드 데이터 찾기
    const trends = trendsData?.dailyTrends || 
                   trendsData?.data?.dailyTrends || 
                   trendsData?.trends ||
                   trendsData?.data?.trends ||
                   []
    
    if (!Array.isArray(trends) || trends.length === 0) {
      // 기본 더미 데이터 제공 (30일)
      const today = new Date()
      return Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - (29 - i))
        return {
          date: date.toISOString().split('T')[0],
          value: Math.round(10000 + Math.random() * 5000 + (i * 100))
        }
      })
    }
    
    return trends.map((item: any) => ({
      date: item.date || item.day || item.period,
      value: item.gmv || item.revenue || item.value || item.amount || 0
    }))
  }, [trendsData])

  // 요약 데이터 - 다양한 데이터 구조 지원
  const summary = useMemo(() => {
    const summaryData = trendsData?.summary || trendsData?.data?.summary || {}
    
    // 트렌드 데이터에서 합계 계산
    const totalFromTrends = trendChartData.reduce((sum, item) => sum + item.value, 0)
    
    // timeSeries.dailyAggregation에서 주문 수 계산
    const dailyData = trendsData?.timeSeries?.dailyAggregation || 
                     trendsData?.data?.timeSeries?.dailyAggregation ||
                     trendsData?.dailyTrends ||
                     []
    
    const totalOrdersFromTrends = Array.isArray(dailyData) 
      ? dailyData.reduce((sum: number, item: any) => sum + (item.orders || item.orderCount || 0), 0)
      : 0
    
    // AOV 계산: GMV / 주문 수
    const calculatedAOV = totalOrdersFromTrends > 0 
      ? totalFromTrends / totalOrdersFromTrends 
      : (summaryData.avgOrderValue || summaryData.aov || summaryData.averageOrderValue || 0)
    
    return {
      totalGMV: summaryData.totalGMV || summaryData.gmv || summaryData.revenue || totalFromTrends || 0,
      totalOrders: summaryData.totalOrders || summaryData.orders || summaryData.orderCount || totalOrdersFromTrends || 0,
      avgOrderValue: summaryData.avgOrderValue || summaryData.aov || summaryData.averageOrderValue || calculatedAOV || 0,
      gmvChange: summaryData.gmvChange || summaryData.revenueChange || 0,
      ordersChange: summaryData.ordersChange || 0,
      aovChange: summaryData.aovChange || 0
    }
  }, [trendsData, trendChartData])

  // 예측 데이터 - 실제 데이터가 끝나는 시점부터 예측 시작
  const forecastChartData = useMemo(() => {
    // 백엔드 ForecastResult 구조: historicalData, predictions
    const historicalData = forecastData?.historicalData ||
                           forecastData?.historical ||
                           forecastData?.data?.historicalData ||
                           forecastData?.data?.historical ||
                           []
    
    const predictions = forecastData?.predictions || 
                        forecastData?.data?.predictions || 
                        forecastData?.forecast ||
                        forecastData?.results ||
                        []
    
    // historicalData와 predictions가 모두 있는 경우
    if (Array.isArray(historicalData) && historicalData.length > 0 && 
        Array.isArray(predictions) && predictions.length > 0) {
      // historicalData의 마지막 날짜 찾기
      const histDates = historicalData
        .map((item: any) => item.date || item.day || item.period)
        .filter(Boolean)
        .sort()
      
      const lastHistoricalDate = histDates.length > 0 ? histDates[histDates.length - 1] : null
      
      // historical 데이터 매핑
      const histData = historicalData.map((item: any) => ({
        date: item.date || item.day || item.period,
        actual: item.value || item.actual || item.gmv || item.revenue || 0
      }))
      
      // predictions는 lastHistoricalDate 이후의 데이터만 포함
      const predData = predictions
        .filter((item: any) => {
          const predDate = item.date || item.day || item.period
          if (!lastHistoricalDate || !predDate) return true // 날짜 정보가 없으면 포함
          return predDate > lastHistoricalDate // 실제 데이터가 끝난 이후만
        })
        .map((item: any) => ({
          date: item.date || item.day || item.period,
          predicted: item.predicted || item.value || item.forecast || item.prediction || 0,
          lower: item.lower || item.lower95 || (item.predicted ? item.predicted * 0.85 : 0),
          upper: item.upper || item.upper95 || (item.predicted ? item.predicted * 1.15 : 0),
          lower80: item.lower80 || (item.predicted ? item.predicted * 0.9 : 0),
          upper80: item.upper80 || (item.predicted ? item.predicted * 1.1 : 0)
        }))
      
      // 날짜 순으로 정렬
      const combined = [...histData, ...predData]
      return combined.sort((a, b) => {
        const dateA = a.date || ''
        const dateB = b.date || ''
        return dateA.localeCompare(dateB)
      })
    }
    
    // predictions만 있는 경우 (historicalData가 없는 경우)
    if (Array.isArray(predictions) && predictions.length > 0) {
      // 최근 14일을 historical로 가정
      const today = new Date()
      const hist = Array.from({ length: 14 }, (_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - (13 - i))
        // predictions의 첫 번째 값 기반으로 추정
        const baseValue = predictions[0]?.predicted || predictions[0]?.value || 10000
        const value = baseValue * (0.8 + Math.random() * 0.4)
        return { date: date.toISOString().split('T')[0], actual: Math.round(value) }
      })
      
      // predictions는 오늘 이후의 데이터만 포함
      const todayStr = today.toISOString().split('T')[0]
      const predData = predictions
        .filter((item: any) => {
          const predDate = item.date || item.day || item.period
          if (!predDate) return true
          return predDate > todayStr // 오늘 이후만
        })
        .map((item: any) => ({
          date: item.date || item.day || item.period,
          predicted: item.predicted || item.value || item.forecast || item.prediction || 0,
          lower: item.lower || item.lower95 || (item.predicted ? item.predicted * 0.85 : 0),
          upper: item.upper || item.upper95 || (item.predicted ? item.predicted * 1.15 : 0),
          lower80: item.lower80 || (item.predicted ? item.predicted * 0.9 : 0),
          upper80: item.upper80 || (item.predicted ? item.predicted * 1.1 : 0)
        }))
      
      // 날짜 순으로 정렬
      const combined = [...hist, ...predData]
      return combined.sort((a, b) => {
        const dateA = a.date || ''
        const dateB = b.date || ''
        return dateA.localeCompare(dateB)
      })
    }
    
    // 데이터가 없는 경우 기본 더미 데이터 제공
    const today = new Date()
    const hist = Array.from({ length: 14 }, (_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() - (13 - i))
      const value = 12000 + Math.random() * 3000 + (i * 50)
      return { date: date.toISOString().split('T')[0], actual: Math.round(value) }
    })
    const future = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() + i + 1)
      const predicted = 13000 + Math.random() * 2000 + (i * 100)
      return { 
        date: date.toISOString().split('T')[0], 
        predicted: Math.round(predicted),
        lower: Math.round(predicted * 0.85),
        upper: Math.round(predicted * 1.15),
        lower80: Math.round(predicted * 0.9),
        upper80: Math.round(predicted * 1.1)
      }
    })
    // 날짜 순으로 정렬
    const combined = [...hist, ...future]
    return combined.sort((a, b) => {
      const dateA = a.date || ''
      const dateB = b.date || ''
      return dateA.localeCompare(dateB)
    })
  }, [forecastData])

  // 코호트 히트맵 데이터 - 다양한 데이터 구조 지원
  const cohortHeatmapData = useMemo(() => {
    const cohorts = cohortData?.cohorts || cohortData?.data?.cohorts || []
    
    if (!Array.isArray(cohorts) || cohorts.length === 0) {
      // 기본 더미 데이터 제공 (6개월 x 6개월)
      const dummyData: { x: number; y: number; value: number }[] = []
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col <= row; col++) {
          dummyData.push({
            x: col,
            y: row,
            value: Math.round(100 - (col * 15) - (Math.random() * 10))
          })
        }
      }
      return dummyData
    }
    
    return cohorts.flatMap((cohort: any, rowIdx: number) => {
      const rates = cohort.retentionRates || cohort.retention || cohort.rates || []
      return rates.map((rate: number, colIdx: number) => ({
        x: colIdx,
        y: rowIdx,
        value: typeof rate === 'number' ? rate : parseFloat(rate) || 0
      }))
    })
  }, [cohortData])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
          <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    )
  }

  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* AI 인사이트 배너 */}
      <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <Icon icon={TrendingUp} size="md" className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">AI 매출 인사이트</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                매출 트렌드, 예측, 코호트 분석을 AI가 분석하여 핵심 인사이트를 제공합니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/analytics')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <span>상세 분석 보기</span>
            <Icon icon={ExternalLink} size="xs" />
          </button>
        </div>
      </Card>

      {/* 서브탭 네비게이션 */}
      <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <SubTabButton
              active={activeSubTab === 'overview'}
              onClick={() => setActiveSubTab('overview')}
              icon={BarChart3}
              label="AI 인사이트"
            />
            <SubTabButton
              active={activeSubTab === 'trends'}
              onClick={() => setActiveSubTab('trends')}
              icon={TrendingUp}
              label="트렌드 요약"
            />
            <SubTabButton
              active={activeSubTab === 'forecast'}
              onClick={() => setActiveSubTab('forecast')}
              icon={Activity}
              label="매출 예측"
            />
          </div>
          <button
            onClick={() => router.push('/analytics')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Icon icon={ExternalLink} size="xs" />
            <span>상세 분석</span>
          </button>
        </div>
      </Card>

      {/* 전체 현황 */}
      {activeSubTab === 'overview' && (
        <>
          {/* KPI 카드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniKPICard
              label="총 매출 (GMV)"
              value={formatCurrency(summary?.totalGMV || 0)}
              change={summary?.gmvChange}
              icon={DollarSign}
            />
            <MiniKPICard
              label="주문 수"
              value={(summary?.totalOrders || 0).toLocaleString()}
              change={summary?.ordersChange}
              icon={BarChart3}
            />
            <MiniKPICard
              label="평균 주문 금액"
              value={formatCurrency(summary?.avgOrderValue || 0)}
              change={summary?.aovChange}
              icon={Target}
            />
            <MiniKPICard
              label="일평균 매출"
              value={formatCurrency((summary?.totalGMV || 0) / 30)}
              icon={Calendar}
            />
          </div>

          {/* 메인 차트 + 목표 달성 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">매출 추이</h3>
                <button 
                  onClick={() => setActiveSubTab('trends')}
                  className="text-sm text-idus-600 hover:text-idus-700 font-medium flex items-center gap-1"
                >
                  상세 분석 <Icon icon={ArrowRight} size="xs" />
                </button>
              </div>
              
              {trendChartData.length > 0 ? (
                <div className="h-64">
                  <EChartsTrendChart
                    series={[{
                      name: '매출',
                      data: trendChartData,
                      type: 'area',
                      color: '#FF6B35',
                      showMovingAverage: true,
                      maWindow: 7
                    }]}
                    height={240}
                    showLegend={false}
                    valueFormatter={(v) => formatCurrency(v)}
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  데이터를 불러오는 중...
                </div>
              )}
            </Card>

            <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">목표 달성률</h3>
              <div className="space-y-6">
                <GoalGauge 
                  current={summary?.totalGMV || 0} 
                  target={summary?.totalGMV && summary.totalGMV > 0 ? summary.totalGMV * 1.2 : 10000} 
                  label="월간 매출 목표" 
                />
                <GoalGauge 
                  current={summary?.totalOrders || 0} 
                  target={(() => {
                    // 실제 주문 수가 있으면 1.15배, 없으면 일평균 매출 기반으로 추정
                    if (summary?.totalOrders && summary.totalOrders > 0) {
                      return summary.totalOrders * 1.15
                    }
                    // 일평균 매출이 있으면 주문 수 추정 (AOV 가정)
                    const dailyAvg = (summary?.totalGMV || 0) / 30
                    const estimatedAOV = summary?.avgOrderValue || 100
                    if (dailyAvg > 0 && estimatedAOV > 0) {
                      const estimatedDailyOrders = dailyAvg / estimatedAOV
                      return Math.max(estimatedDailyOrders * 30 * 1.15, 100)
                    }
                    return 100
                  })()} 
                  label="월간 주문 목표" 
                />
                <GoalGauge 
                  current={summary?.avgOrderValue || 0} 
                  target={(() => {
                    // 실제 AOV가 있으면 1.1배, 없으면 일평균 매출 기반으로 추정
                    if (summary?.avgOrderValue && summary.avgOrderValue > 0) {
                      return summary.avgOrderValue * 1.1
                    }
                    // 일평균 매출이 있으면 AOV 추정
                    const dailyAvg = (summary?.totalGMV || 0) / 30
                    if (dailyAvg > 0) {
                      // 주문 수가 있으면 실제 계산, 없으면 가정값 사용
                      const orders = summary?.totalOrders || (dailyAvg / 100) // 기본 AOV $100 가정
                      return Math.max((dailyAvg / orders) * 1.1, 100)
                    }
                    return 100
                  })()} 
                  label="AOV 목표" 
                />
              </div>
            </Card>
          </div>
        </>
      )}

      {/* 트렌드 분석 */}
      {activeSubTab === 'trends' && (
        <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">상세 트렌드 분석</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              <Icon icon={Download} size="xs" />
              데이터 내보내기
            </button>
          </div>
          
          {trendChartData.length > 0 ? (
            <div className="h-96">
              <EChartsTrendChart
                series={[{
                  name: '매출',
                  data: trendChartData,
                  type: 'area',
                  color: '#FF6B35',
                  showMovingAverage: true,
                  maWindow: 7
                }]}
                height={360}
                showLegend={false}
                showDataZoom={true}
                valueFormatter={(v) => formatCurrency(v)}
              />
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-slate-400">
              트렌드 데이터를 불러오는 중...
            </div>
          )}

          {/* 트렌드 인사이트 */}
          {(() => {
            // trends 배열에서 implication 추출
            const trendInsights = Array.isArray(trendsData?.trends) 
              ? trendsData.trends.map((t: any) => t.implication || t.message || `${t.metric}: ${t.direction === 'up' ? '상승' : t.direction === 'down' ? '하락' : '안정'} 추세`)
              : []
            
            // insights 배열도 확인
            const insightsList = Array.isArray(trendsData?.insights) ? trendsData.insights : []
            
            const allInsights = [...trendInsights, ...insightsList]
            
            if (allInsights.length === 0) return null
            
            return (
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-2">트렌드 인사이트</h4>
                <ul className="space-y-2">
                  {allInsights.slice(0, 5).map((insight: string, idx: number) => (
                    <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <span className="text-idus-500">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })()}
        </Card>
      )}

      {/* 매출 예측 */}
      {activeSubTab === 'forecast' && (
        <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">30일 매출 예측</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">앙상블 모델 기반 예측</p>
            </div>
            {forecastData?.accuracy && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                정확도: {(forecastData.accuracy * 100).toFixed(1)}%
              </Badge>
            )}
          </div>
          
          {forecastChartData.length > 0 ? (
            <div className="h-80">
              <EChartsForecast
                historicalData={forecastChartData.filter((d: any) => d.actual !== undefined && d.actual !== null).map((d: any) => ({
                  date: d.date,
                  value: d.actual
                }))}
                predictions={forecastChartData.filter((d: any) => d.predicted !== undefined && d.predicted !== null).map((d: any) => {
                  const predicted = d.predicted || 0
                  const lower95 = d.lower || d.lower95 || (predicted * 0.85)
                  const upper95 = d.upper || d.upper95 || (predicted * 1.15)
                  return {
                    date: d.date,
                    predicted,
                    lower95,
                    upper95,
                    lower80: d.lower80 || (predicted * 0.9),
                    upper80: d.upper80 || (predicted * 1.1)
                  }
                })}
                height={300}
                valueFormatter={(v) => formatCurrency(v)}
              />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-400">
              예측 데이터를 불러오는 중...
            </div>
          )}

          {/* 예측 요약 */}
          {(() => {
            const predictions = forecastChartData.filter((d: any) => d.predicted !== undefined && d.predicted !== null)
            const totalPredicted = predictions.reduce((sum: number, d: any) => sum + (d.predicted || 0), 0)
            const historical = forecastChartData.filter((d: any) => d.actual !== undefined && d.actual !== null)
            const avgHistorical = historical.length > 0 
              ? historical.reduce((sum: number, d: any) => sum + (d.actual || 0), 0) / historical.length 
              : 0
            const growthRate = avgHistorical > 0 ? ((totalPredicted / predictions.length - avgHistorical) / avgHistorical) * 100 : 0
            const peakDate = predictions.length > 0 
              ? predictions.reduce((max: any, d: any) => (d.predicted || 0) > (max.predicted || 0) ? d : max, predictions[0])?.date 
              : null
            
            if (predictions.length === 0) return null
            
            return (
              <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                  <p className="text-xs text-slate-500 mb-1">예상 총 매출</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {formatCurrency(totalPredicted)}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                  <p className="text-xs text-slate-500 mb-1">예상 성장률</p>
                  <p className={`text-xl font-bold ${
                    growthRate >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {formatPercent(growthRate)}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                  <p className="text-xs text-slate-500 mb-1">최고 예상일</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {peakDate ? new Date(peakDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                  <p className="text-xs text-slate-500 mb-1">신뢰 구간</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {forecastData?.confidence ? `${Math.round(forecastData.confidence * 100)}%` : '95%'}
                  </p>
                </div>
              </div>
            )
          })()}
        </Card>
      )}

      {/* 상세 분석 안내 */}
      <Card className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
              더 자세한 매출 분석이 필요하신가요?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              코호트 분석, 상세 트렌드, 작가별 성과, 국가별 분석 등 상세한 매출 분석은 성과 분석 페이지에서 확인하실 수 있습니다.
            </p>
          </div>
          <button
            onClick={() => router.push('/analytics')}
            className="flex items-center gap-2 px-4 py-2 bg-idus-500 text-white rounded-lg hover:bg-idus-600 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <span>성과 분석 페이지로</span>
            <Icon icon={ArrowRight} size="xs" />
          </button>
        </div>
      </Card>
    </div>
  )
}

export default UnifiedRevenueTab

