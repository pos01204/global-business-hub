'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { orderPatternsApi } from '@/lib/api'
import { formatCurrency, formatNumber } from '@/lib/formatters'
import { EnhancedLoadingPage, EmptyState } from '@/components/ui'
import { Icon } from '@/components/ui/Icon'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  BarChart3, TrendingUp, TrendingDown, Calendar, Globe,
  ShoppingBag, DollarSign, Users, RefreshCcw, Lightbulb,
  ArrowUpRight, ArrowDownRight, Info, Target, Zap,
  AlertTriangle, CheckCircle, Activity, Scale
} from 'lucide-react'
import { addDays, format } from 'date-fns'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Line, Doughnut, Chart } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
)

// ============================================================
// 타입 정의
// ============================================================

interface DayData {
  day: number
  dayName: string
  dayNameEn: string
  orders: number
  gmv: number
  avgOrderValue: number
}

interface MonthData {
  month: string
  orders: number
  gmv: number
  items: number
  avgOrderValue: number
}

interface SummaryData {
  totalOrders: number
  totalGmv: number
  avgOrderValue: number
  uniqueCustomers: number
  repeatCustomers: number
  repeatRate: number
  peakDay: {
    day: number
    dayName: string
    orders: number
    percentage: number
  }
}

interface ComparisonData {
  previousPeriod: {
    startDate: string
    endDate: string
    totalOrders: number
    totalGmv: number
    avgOrderValue: number
    uniqueCustomers: number
  }
  changes: {
    orders: number
    gmv: number
    avgOrderValue: number
    customers: number
  }
}

interface InsightData {
  type: string
  priority: string
  category: string
  title: string
  description: string
  evidence: string[]
  action?: string
  impact?: { metric: string; expected: string }
}

interface CountryDetailData {
  label: string
  flag: string
  orders: number
  orderShare: number
  gmv: number
  gmvShare: number
  avgOrderValue: number
  uniqueCustomers: number
  dayPattern: Array<{ day: number; dayName: string; orders: number }>
  monthTrend: Array<{ month: string; orders: number }>
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export default function OrderPatternsPage() {
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -90),
    to: new Date(),
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'trend' | 'comparison' | 'insights'>('overview')

  const startDate = format(dateRange.from, 'yyyy-MM-dd')
  const endDate = format(dateRange.to, 'yyyy-MM-dd')

  // API 쿼리
  const { data: summaryData, isLoading: loadingSummary, error: errorSummary } = useQuery({
    queryKey: ['order-patterns-summary', startDate, endDate],
    queryFn: () => orderPatternsApi.getSummary(startDate, endDate, true),
  })

  const { data: byDayData, isLoading: loadingByDay } = useQuery({
    queryKey: ['order-patterns-by-day', startDate, endDate],
    queryFn: () => orderPatternsApi.getByDay(startDate, endDate),
  })

  const { data: byCountryData, isLoading: loadingByCountry } = useQuery({
    queryKey: ['order-patterns-by-country', startDate, endDate],
    queryFn: () => orderPatternsApi.getByCountry(startDate, endDate),
  })

  const { data: monthlyData, isLoading: loadingMonthly } = useQuery({
    queryKey: ['order-patterns-monthly', startDate, endDate],
    queryFn: () => orderPatternsApi.getMonthlyTrend(startDate, endDate),
  })

  const { data: heatmapData, isLoading: loadingHeatmap } = useQuery({
    queryKey: ['order-patterns-heatmap', startDate, endDate],
    queryFn: () => orderPatternsApi.getHeatmap(startDate, endDate, 'orders'),
    enabled: activeTab === 'overview' || activeTab === 'trend',
  })

  const { data: insightsData, isLoading: loadingInsights } = useQuery({
    queryKey: ['order-patterns-insights', startDate, endDate],
    queryFn: () => orderPatternsApi.getInsights(startDate, endDate),
    enabled: activeTab === 'insights' || activeTab === 'overview',
  })

  const { data: countryDetailData, isLoading: loadingCountryDetail } = useQuery({
    queryKey: ['order-patterns-country-detail', startDate, endDate],
    queryFn: () => orderPatternsApi.getCountryDetail(startDate, endDate),
    enabled: activeTab === 'comparison',
  })

  const isLoading = loadingSummary || loadingByDay || loadingByCountry || loadingMonthly
  const hasError = errorSummary

  if (isLoading) {
    return <EnhancedLoadingPage message="주문 패턴 데이터를 분석 중..." variant="default" size="lg" />
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <EmptyState
          title="데이터 로드 실패"
          description="주문 패턴 데이터를 불러오는 중 오류가 발생했습니다."
          icon="⚠️"
        />
      </div>
    )
  }

  const summary = summaryData?.data?.summary as SummaryData | undefined
  const comparison = summaryData?.data?.comparison as ComparisonData | undefined
  const byDay = byDayData?.data?.byDay as DayData[] | undefined
  const byCountry = byCountryData?.data?.byCountry
  const monthly = monthlyData?.data?.trend as MonthData[] | undefined
  const insights = insightsData?.data?.insights as InsightData[] | undefined
  const countryDetail = countryDetailData?.data?.countryDetail as { JP: CountryDetailData; EN: CountryDetailData } | undefined

  // 탭 정의
  const tabs = [
    { id: 'overview', label: '개요', icon: BarChart3 },
    { id: 'trend', label: '트렌드', icon: TrendingUp },
    { id: 'comparison', label: '비교 분석', icon: Globe },
    { id: 'insights', label: '인사이트', icon: Lightbulb },
  ]

  // 기간 선택 옵션
  const periodOptions = [
    { label: '7일', days: 7 },
    { label: '30일', days: 30 },
    { label: '90일', days: 90 },
    { label: '180일', days: 180 },
    { label: '1년', days: 365 },
  ]

  const selectedDays = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 - idus 브랜드 스타일 */}
      <div className="relative bg-idus-500 dark:bg-orange-900/70 rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden shadow-lg dark:shadow-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 dark:bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg dark:shadow-none">
            <Icon icon={BarChart3} size="xl" className="text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">주문 패턴 분석</h1>
            <p className="text-idus-100 dark:text-orange-200/80 text-xs lg:text-sm font-medium">요일별, 월별, 국가별 다차원 주문 패턴 분석</p>
          </div>
        </div>
      </div>

      {/* 날짜 필터 & 빠른 선택 */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">기간:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setDateRange({ ...dateRange, from: new Date(e.target.value) })}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          />
          <span className="text-slate-400">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setDateRange({ ...dateRange, to: new Date(e.target.value) })}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          />
        </div>
        <div className="flex gap-2">
          {periodOptions.map((option) => (
            <button
              key={option.days}
              onClick={() => setDateRange({ from: addDays(new Date(), -option.days), to: new Date() })}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedDays === option.days
                  ? 'bg-idus-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 핵심 요약 배너 */}
      {summary && (
        <div className="mb-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              분석 기간: <strong className="text-slate-800 dark:text-slate-200">{format(dateRange.from, 'yyyy.MM.dd')} ~ {format(dateRange.to, 'yyyy.MM.dd')}</strong> ({selectedDays}일)
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              총 주문: <strong className="text-idus-600 dark:text-idus-400">{summary.totalOrders.toLocaleString()}건</strong>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              총 GMV: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.totalGmv)}</strong>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              피크 요일: <strong className="text-amber-600 dark:text-amber-400">{summary.peakDay.dayName}요일</strong>
            </span>
            {comparison && (
              <span className={`flex items-center gap-1 ${comparison.changes.gmv >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                <Icon icon={comparison.changes.gmv >= 0 ? ArrowUpRight : ArrowDownRight} size="sm" />
                {comparison.changes.gmv >= 0 ? '+' : ''}{comparison.changes.gmv.toFixed(1)}% vs 전기간
              </span>
            )}
          </div>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="mb-6">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-idus-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon icon={tab.icon} size="sm" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 개요 탭 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
            {/* KPI 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <KPICard
                title="총 주문"
                value={formatNumber(summary?.totalOrders || 0)}
                suffix="건"
                icon={ShoppingBag}
                color="violet"
                change={comparison?.changes?.orders}
              />
              <KPICard
                title="총 GMV"
                value={formatCurrency(summary?.totalGmv || 0)}
                icon={DollarSign}
                color="emerald"
                change={comparison?.changes?.gmv}
              />
              <KPICard
                title="평균 주문액"
                value={formatCurrency(summary?.avgOrderValue || 0)}
                icon={TrendingUp}
                color="blue"
                change={comparison?.changes?.avgOrderValue}
                tooltip="AOV (Average Order Value)"
              />
              <KPICard
                title="고객 수"
                value={formatNumber(summary?.uniqueCustomers || 0)}
                suffix="명"
                icon={Users}
                color="indigo"
                change={comparison?.changes?.customers}
              />
              <KPICard
                title="재구매율"
                value={(summary?.repeatRate || 0).toFixed(1)}
                suffix="%"
                icon={RefreshCcw}
                color="amber"
                tooltip="2회 이상 구매 고객 비율"
              />
            </div>

            {/* 차트 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 요일별 패턴 */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon icon={Calendar} size="md" className="text-violet-500" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">요일별 주문 패턴</h3>
                  </div>
                  {summary?.peakDay && (
                    <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                      피크: {summary.peakDay.dayName}요일
                    </span>
                  )}
                </div>
                <div className="h-64">
                  {byDay && (
                    <Bar
                      data={{
                        labels: byDay.map(d => d.dayName),
                        datasets: [
                          {
                            label: '주문 수',
                            data: byDay.map(d => d.orders),
                            backgroundColor: byDay.map((d) => 
                              d.day === summary?.peakDay?.day 
                                ? '#8b5cf6' 
                                : 'rgba(139, 92, 246, 0.5)'
                            ),
                            borderRadius: 8,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                      }}
                    />
                  )}
                </div>
              </div>

              {/* 월별 트렌드 (복합 차트) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon={TrendingUp} size="md" className="text-emerald-500" />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">월별 GMV & 주문 트렌드</h3>
                </div>
                <div className="h-64">
                  {monthly && monthly.length > 0 && (
                    <Chart
                      type="bar"
                      data={{
                        labels: monthly.map(d => d.month),
                        datasets: [
                          {
                            type: 'bar' as const,
                            label: '주문 수',
                            data: monthly.map(d => d.orders),
                            backgroundColor: 'rgba(139, 92, 246, 0.6)',
                            borderRadius: 4,
                            yAxisID: 'y',
                          },
                          {
                            type: 'line' as const,
                            label: 'GMV (만원)',
                            data: monthly.map(d => Math.round(d.gmv / 10000)),
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.4,
                            yAxisID: 'y1',
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } },
                        scales: {
                          y: { 
                            type: 'linear',
                            position: 'left',
                            beginAtZero: true,
                            title: { display: true, text: '주문 수' }
                          },
                          y1: {
                            type: 'linear',
                            position: 'right',
                            beginAtZero: true,
                            title: { display: true, text: 'GMV (만원)' },
                            grid: { drawOnChartArea: false }
                          }
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 국가별 비교 & 히트맵 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 국가별 요일 비교 */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon={Globe} size="md" className="text-violet-500" />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">국가별 요일 패턴 비교</h3>
                </div>
                <div className="h-64">
                  {byCountry && (
                    <Bar
                      data={{
                        labels: ['일', '월', '화', '수', '목', '금', '토'],
                        datasets: [
                          {
                            label: '🇯🇵 일본 (JP)',
                            data: byCountry.JP?.map((d: any) => d.orders) || [],
                            backgroundColor: '#f43f5e',
                            borderRadius: 4,
                          },
                          {
                            label: '🌍 영어권 (EN)',
                            data: byCountry.EN?.map((d: any) => d.orders) || [],
                            backgroundColor: '#8b5cf6',
                            borderRadius: 4,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } },
                        scales: { y: { beginAtZero: true } }
                      }}
                    />
                  )}
                </div>
              </div>

              {/* 히트맵 (간소화) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon={Activity} size="md" className="text-purple-500" />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">월별 x 요일별 히트맵</h3>
                </div>
                {heatmapData?.data && (
                  <HeatmapChart 
                    rows={heatmapData.data.rows} 
                    cols={heatmapData.data.cols}
                    values={heatmapData.data.values}
                    max={heatmapData.data.max}
                  />
                )}
                {loadingHeatmap && (
                  <div className="h-48 flex items-center justify-center text-slate-400">
                    로딩 중...
                  </div>
                )}
              </div>
            </div>

            {/* 핵심 인사이트 미리보기 */}
            {insights && insights.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon icon={Lightbulb} size="md" className="text-amber-500" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">💡 핵심 인사이트</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('insights')}
                    className="text-sm text-idus-600 dark:text-idus-400 hover:underline"
                  >
                    전체 보기 →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {insights.slice(0, 3).map((insight, idx) => (
                    <InsightMiniCard key={idx} insight={insight} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      {/* 트렌드 탭 */}
      {activeTab === 'trend' && (
          <div className="space-y-6">
            {/* 월별 상세 트렌드 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">월별 상세 트렌드</h3>
              <div className="h-80">
                {monthly && monthly.length > 0 && (
                  <Line
                    data={{
                      labels: monthly.map(d => d.month),
                      datasets: [
                        {
                          label: 'GMV',
                          data: monthly.map(d => d.gmv),
                          borderColor: '#10b981',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          fill: true,
                          tension: 0.4,
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom' } },
                      scales: { 
                        y: { 
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => `₩${(Number(value) / 10000).toFixed(0)}만`
                          }
                        } 
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* 월별 테이블 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">월별 상세 데이터</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">월</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">주문 수</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">GMV</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">평균 주문액</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">전월 대비</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly?.map((m, idx) => {
                      const prevMonth = monthly[idx - 1]
                      const gmvChange = prevMonth 
                        ? ((m.gmv - prevMonth.gmv) / prevMonth.gmv) * 100 
                        : 0
                      
                      return (
                        <tr key={m.month} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <td className="py-3 px-4 text-sm font-medium text-slate-800 dark:text-slate-100">{m.month}</td>
                          <td className="py-3 px-4 text-sm text-right text-slate-600 dark:text-slate-400">{m.orders.toLocaleString()}건</td>
                          <td className="py-3 px-4 text-sm text-right font-medium text-slate-800 dark:text-slate-100">{formatCurrency(m.gmv)}</td>
                          <td className="py-3 px-4 text-sm text-right text-slate-600 dark:text-slate-400">{formatCurrency(m.avgOrderValue)}</td>
                          <td className="py-3 px-4 text-sm text-right">
                            {idx > 0 && (
                              <span className={`flex items-center justify-end gap-1 ${gmvChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                <Icon icon={gmvChange >= 0 ? ArrowUpRight : ArrowDownRight} size="xs" />
                                {gmvChange >= 0 ? '+' : ''}{gmvChange.toFixed(1)}%
                              </span>
                            )}
                            {idx === 0 && <span className="text-slate-400">-</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* 비교 분석 탭 */}
      {activeTab === 'comparison' && (
          <div className="space-y-6">
            {/* 전기간 대비 */}
            {comparison && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">전기간 대비 변화</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ComparisonCard
                    title="주문 수"
                    current={summary?.totalOrders || 0}
                    previous={comparison.previousPeriod.totalOrders}
                    change={comparison.changes.orders}
                    format="number"
                  />
                  <ComparisonCard
                    title="GMV"
                    current={summary?.totalGmv || 0}
                    previous={comparison.previousPeriod.totalGmv}
                    change={comparison.changes.gmv}
                    format="currency"
                  />
                  <ComparisonCard
                    title="평균 주문액"
                    current={summary?.avgOrderValue || 0}
                    previous={comparison.previousPeriod.avgOrderValue}
                    change={comparison.changes.avgOrderValue}
                    format="currency"
                  />
                  <ComparisonCard
                    title="고객 수"
                    current={summary?.uniqueCustomers || 0}
                    previous={comparison.previousPeriod.uniqueCustomers}
                    change={comparison.changes.customers}
                    format="number"
                  />
                </div>
              </div>
            )}

            {/* 국가별 상세 비교 */}
            {countryDetail && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CountryDetailCard country={countryDetail.JP} />
                <CountryDetailCard country={countryDetail.EN} />
              </div>
            )}
            {loadingCountryDetail && (
              <div className="text-center py-8 text-slate-400">국가별 상세 데이터 로딩 중...</div>
            )}
          </div>
        )}

      {/* 인사이트 탭 */}
      {activeTab === 'insights' && (
          <div className="space-y-4">
            {insights && insights.length > 0 ? (
              insights.map((insight, idx) => (
                <InsightCard key={idx} insight={insight} />
              ))
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Icon icon={Lightbulb} size="xl" className="mx-auto mb-4 opacity-50" />
                <p>분석할 데이터가 충분하지 않습니다.</p>
              </div>
            )}
            {loadingInsights && (
              <div className="text-center py-8 text-slate-400">인사이트 생성 중...</div>
            )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// 서브 컴포넌트
// ============================================================

function KPICard({
  title,
  value,
  suffix = '',
  icon: IconComponent,
  color,
  change,
  tooltip,
}: {
  title: string
  value: string | number
  suffix?: string
  icon: any
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue'
  change?: number
  tooltip?: string
}) {
  const colorClasses = {
    indigo: 'from-indigo-500 to-indigo-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
    violet: 'from-violet-500 to-violet-600',
    blue: 'from-blue-500 to-blue-600',
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <Icon icon={IconComponent} size="md" className="text-white" />
        </div>
        {tooltip && (
          <Tooltip content={tooltip}>
            <Icon icon={Info} size="sm" className="text-slate-400 cursor-help" />
          </Tooltip>
        )}
      </div>
      <p className="text-xs text-slate-500 mb-1">{title}</p>
      <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
        {value}
        {suffix && <span className="text-sm font-normal text-slate-500 ml-1">{suffix}</span>}
      </p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          <Icon icon={change >= 0 ? ArrowUpRight : ArrowDownRight} size="xs" />
          <span>{change >= 0 ? '+' : ''}{change.toFixed(1)}% vs 전기간</span>
        </div>
      )}
    </div>
  )
}

function HeatmapChart({ rows, cols, values, max }: { rows: string[]; cols: string[]; values: number[][]; max: number }) {
  if (!rows || !cols || !values || values.length === 0) {
    return <div className="h-48 flex items-center justify-center text-slate-400">데이터 없음</div>
  }

  const getColor = (value: number) => {
    if (value === 0) return 'bg-slate-100 dark:bg-slate-800'
    const intensity = Math.min(value / max, 1)
    if (intensity < 0.25) return 'bg-violet-100 dark:bg-violet-900/30'
    if (intensity < 0.5) return 'bg-violet-200 dark:bg-violet-800/50'
    if (intensity < 0.75) return 'bg-violet-400 dark:bg-violet-600'
    return 'bg-violet-600 dark:bg-violet-500'
  }

  // 최근 6개월만 표시
  const displayRows = rows.slice(-6)
  const displayValues = values.slice(-6)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="p-1 text-slate-500"></th>
            {cols.map(col => (
              <th key={col} className="p-1 text-center text-slate-500 font-normal">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, rowIdx) => (
            <tr key={row}>
              <td className="p-1 text-slate-500 font-normal whitespace-nowrap">{row}</td>
              {displayValues[rowIdx]?.map((value, colIdx) => (
                <td key={colIdx} className="p-1">
                  <div 
                    className={`w-8 h-6 rounded ${getColor(value)} flex items-center justify-center text-[10px] ${value > max * 0.5 ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}
                    title={`${row} ${cols[colIdx]}: ${value}건`}
                  >
                    {value > 0 ? value : ''}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-end gap-2 mt-2 text-[10px] text-slate-500">
        <span>낮음</span>
        <div className="flex gap-0.5">
          <div className="w-4 h-3 bg-violet-100 dark:bg-violet-900/30 rounded" />
          <div className="w-4 h-3 bg-violet-200 dark:bg-violet-800/50 rounded" />
          <div className="w-4 h-3 bg-violet-400 dark:bg-violet-600 rounded" />
          <div className="w-4 h-3 bg-violet-600 dark:bg-violet-500 rounded" />
        </div>
        <span>높음</span>
      </div>
    </div>
  )
}

function InsightMiniCard({ insight }: { insight: InsightData }) {
  const priorityColors: Record<string, string> = {
    critical: 'border-red-300 bg-red-50 dark:bg-red-900/20',
    high: 'border-orange-300 bg-orange-50 dark:bg-orange-900/20',
    medium: 'border-amber-300 bg-amber-50 dark:bg-amber-900/20',
    low: 'border-slate-300 bg-slate-50 dark:bg-slate-800/50',
  }

  const typeIcons: Record<string, any> = {
    peak_pattern: Target,
    warning: AlertTriangle,
    success: CheckCircle,
    comparison: Scale,
    trend_up: TrendingUp,
    trend_down: TrendingDown,
    info: Info,
  }

  return (
    <div className={`rounded-lg border p-3 ${priorityColors[insight.priority] || priorityColors.low}`}>
      <div className="flex items-start gap-2">
        <Icon icon={typeIcons[insight.type] || Lightbulb} size="sm" className="text-slate-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{insight.title}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{insight.description}</p>
        </div>
      </div>
    </div>
  )
}

function InsightCard({ insight }: { insight: InsightData }) {
  const priorityColors: Record<string, string> = {
    critical: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    high: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
    medium: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    low: 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700',
  }

  const typeIcons: Record<string, any> = {
    peak_pattern: Target,
    warning: AlertTriangle,
    success: CheckCircle,
    comparison: Scale,
    trend_up: TrendingUp,
    trend_down: TrendingDown,
    info: Info,
  }

  const priorityLabels: Record<string, string> = {
    critical: '긴급',
    high: '높음',
    medium: '보통',
    low: '낮음',
  }

  return (
    <div className={`rounded-xl border p-5 ${priorityColors[insight.priority] || priorityColors.low}`}>
      <div className="flex items-start gap-3">
        <Icon icon={typeIcons[insight.type] || Lightbulb} size="md" className="text-slate-600 dark:text-slate-400" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
              {insight.category}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              insight.priority === 'critical' ? 'bg-red-100 text-red-600' :
              insight.priority === 'high' ? 'bg-orange-100 text-orange-600' :
              insight.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
              'bg-slate-100 text-slate-600'
            }`}>
              {priorityLabels[insight.priority] || '보통'}
            </span>
          </div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">{insight.title}</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{insight.description}</p>
          
          {/* 근거 */}
          {insight.evidence && insight.evidence.length > 0 && (
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-slate-500 mb-1">📊 근거</p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                {insight.evidence.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* 권장 액션 */}
          {insight.action && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-3 py-2">
              <Icon icon={Zap} size="sm" />
              <span>{insight.action}</span>
            </div>
          )}
          
          {/* 예상 영향 */}
          {insight.impact && (
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              💡 {insight.impact.metric}: {insight.impact.expected}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ComparisonCard({ 
  title, 
  current, 
  previous, 
  change, 
  format: formatType 
}: { 
  title: string
  current: number
  previous: number
  change: number
  format: 'number' | 'currency'
}) {
  const formatValue = (val: number) => 
    formatType === 'currency' ? formatCurrency(val) : val.toLocaleString()

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-2">{title}</p>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatValue(current)}</span>
        <span className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          <Icon icon={change >= 0 ? ArrowUpRight : ArrowDownRight} size="xs" />
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>
      <p className="text-xs text-slate-400">
        전기간: {formatValue(previous)}
      </p>
    </div>
  )
}

function CountryDetailCard({ country }: { country: CountryDetailData }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{country.flag}</span>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{country.label}</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">주문 수</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{country.orders.toLocaleString()}건</p>
          <p className="text-xs text-slate-400">전체의 {country.orderShare.toFixed(1)}%</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">GMV</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(country.gmv)}</p>
          <p className="text-xs text-slate-400">전체의 {country.gmvShare.toFixed(1)}%</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">평균 주문액</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(country.avgOrderValue)}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">고객 수</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{country.uniqueCustomers.toLocaleString()}명</p>
        </div>
      </div>
      
      {/* 요일별 패턴 미니 차트 */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-2">요일별 패턴</p>
        <div className="flex gap-1">
          {country.dayPattern?.map((d) => {
            const maxOrders = Math.max(...country.dayPattern.map(x => x.orders))
            const height = maxOrders > 0 ? (d.orders / maxOrders) * 40 : 0
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-violet-400 dark:bg-violet-500 rounded-t"
                  style={{ height: `${Math.max(height, 4)}px` }}
                />
                <span className="text-[10px] text-slate-400 mt-1">{d.dayName}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
