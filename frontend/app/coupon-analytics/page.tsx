'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { couponAnalyticsApi } from '@/lib/api'
import { formatCurrency, formatPercent } from '@/lib/formatters'
import { EnhancedLoadingPage } from '@/components/ui'
import { Icon } from '@/components/ui/Icon'
import { Tooltip } from '@/components/ui/Tooltip'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import {
  Ticket, TrendingUp, TrendingDown, DollarSign, Users,
  BarChart3, PieChart, AlertTriangle, Lightbulb, Award,
  Target, Percent, ArrowUpRight, ArrowDownRight, Info
} from 'lucide-react'
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
import { Bar, Doughnut, Line } from 'react-chartjs-2'

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

interface CouponSummary {
  totalCoupons: number
  totalIssued: number
  totalUsed: number
  conversionRate: string
  totalDiscountKrw: number
  totalGmvKrw: number
  roi: string
}

interface CouponByType {
  RATE: { count: number; issued: number; used: number; conversionRate: number; gmv: number; roi: number }
  FIXED: { count: number; issued: number; used: number; conversionRate: number; gmv: number; roi: number }
}

interface TopCoupon {
  couponId: string
  couponName: string
  discountType: string
  conversionRate: number
  gmv: number
  roi: number
}

interface Insight {
  type: 'success' | 'warning' | 'info' | 'error'
  category: string
  message: string
  action: string
  priority: string
}

// ============================================================
// 컴포넌트
// ============================================================

export default function CouponAnalyticsPage() {
  // 기본 날짜 범위: 최근 30일
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0])
  const [activeTab, setActiveTab] = useState<'overview' | 'trend' | 'comparison' | 'insights'>('overview')

  // API 쿼리
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['coupon-summary', startDate, endDate],
    queryFn: () => couponAnalyticsApi.getSummary(startDate, endDate, true),
  })

  const { data: byTypeData, isLoading: typeLoading } = useQuery({
    queryKey: ['coupon-by-type', startDate, endDate],
    queryFn: () => couponAnalyticsApi.getByType(startDate, endDate),
  })

  const { data: byCountryData, isLoading: countryLoading } = useQuery({
    queryKey: ['coupon-by-country', startDate, endDate],
    queryFn: () => couponAnalyticsApi.getByCountry(startDate, endDate),
  })

  const { data: topPerformersData, isLoading: topLoading } = useQuery({
    queryKey: ['coupon-top-performers', startDate, endDate],
    queryFn: () => couponAnalyticsApi.getTopPerformers(startDate, endDate, 10),
  })

  const { data: failuresData, isLoading: failuresLoading } = useQuery({
    queryKey: ['coupon-failures', startDate, endDate],
    queryFn: () => couponAnalyticsApi.getFailures(startDate, endDate),
  })

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['coupon-insights', startDate, endDate],
    queryFn: () => couponAnalyticsApi.getInsights(startDate, endDate),
  })

  const isLoading = summaryLoading || typeLoading || countryLoading || topLoading || failuresLoading || insightsLoading

  if (isLoading) {
    return <EnhancedLoadingPage message="쿠폰 분석 데이터를 불러오는 중..." variant="default" size="lg" />
  }

  const summary = summaryData?.data?.summary as CouponSummary | undefined
  const comparison = summaryData?.data?.comparison
  const byType = byTypeData?.data?.byType as CouponByType | undefined
  const byCountry = byCountryData?.data?.byCountry
  const topPerformers = topPerformersData?.data?.topPerformers
  const failures = failuresData?.data?.failures
  const insights = insightsData?.data?.insights as Insight[] | undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon icon={Ticket} size="xl" className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">쿠폰 효과 분석</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">쿠폰 성과 및 ROI 분석</p>
            </div>
          </div>
        </div>

        {/* 날짜 필터 */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">기간:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800"
            />
            <span className="text-slate-400">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800"
            />
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
          <nav className="flex gap-4">
            {[
              { id: 'overview', label: '개요', icon: BarChart3 },
              { id: 'trend', label: '트렌드', icon: TrendingUp },
              { id: 'comparison', label: '비교 분석', icon: PieChart },
              { id: 'insights', label: '인사이트', icon: Lightbulb },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Icon icon={tab.icon} size="sm" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 개요 탭 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="총 쿠폰 수"
                value={summary?.totalCoupons || 0}
                suffix="개"
                icon={Ticket}
                color="violet"
              />
              <KPICard
                title="전환율"
                value={summary?.conversionRate || '0'}
                suffix="%"
                icon={Target}
                color="emerald"
                change={comparison?.changes?.conversionRate}
              />
              <KPICard
                title="쿠폰 GMV"
                value={formatCurrency(summary?.totalGmvKrw || 0)}
                icon={DollarSign}
                color="blue"
                change={comparison?.changes?.gmv}
              />
              <KPICard
                title="ROI"
                value={summary?.roi || '0'}
                suffix="x"
                icon={TrendingUp}
                color="amber"
                change={comparison?.changes?.roi}
                tooltip="GMV / 할인 금액"
              />
            </div>

            {/* 발급/사용 현황 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">발급/사용 현황</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">총 발급</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {(summary?.totalIssued || 0).toLocaleString()}건
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">총 사용</span>
                    <span className="font-semibold text-emerald-600">
                      {(summary?.totalUsed || 0).toLocaleString()}건
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-violet-500 to-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(parseFloat(summary?.conversionRate || '0'), 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">총 할인 금액</span>
                    <span className="font-semibold text-red-500">
                      -{formatCurrency(summary?.totalDiscountKrw || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* TOP 성과 쿠폰 */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon={Award} size="md" className="text-amber-500" />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">TOP 성과 쿠폰</h3>
                </div>
                <div className="space-y-3">
                  {topPerformers?.byConversion?.slice(0, 5).map((coupon: TopCoupon, idx: number) => (
                    <div key={coupon.couponId} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-600' :
                          idx === 1 ? 'bg-slate-100 text-slate-600' :
                          idx === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-slate-50 text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate max-w-[150px]">
                            {coupon.couponName}
                          </p>
                          <p className="text-xs text-slate-500">{coupon.discountType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-600">{coupon.conversionRate.toFixed(1)}%</p>
                        <p className="text-xs text-slate-500">ROI {coupon.roi.toFixed(1)}x</p>
                      </div>
                    </div>
                  ))}
                  {(!topPerformers?.byConversion || topPerformers.byConversion.length === 0) && (
                    <p className="text-sm text-slate-500 text-center py-4">데이터가 없습니다</p>
                  )}
                </div>
              </div>
            </div>

            {/* 실패 쿠폰 경고 */}
            {failures && (failures.zeroUsage?.length > 0 || failures.lowConversion?.length > 0) && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon={AlertTriangle} size="md" className="text-amber-500" />
                  <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">주의가 필요한 쿠폰</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {failures.zeroUsage?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">
                        미사용 쿠폰 ({failures.zeroUsage.length}개)
                      </p>
                      <ul className="space-y-1">
                        {failures.zeroUsage.slice(0, 3).map((c: any) => (
                          <li key={c.couponId} className="text-sm text-amber-600 dark:text-amber-400">
                            • {c.couponName} (발급 {c.issued}건)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {failures.lowConversion?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">
                        낮은 전환율 ({failures.lowConversion.length}개)
                      </p>
                      <ul className="space-y-1">
                        {failures.lowConversion.slice(0, 3).map((c: any) => (
                          <li key={c.couponId} className="text-sm text-amber-600 dark:text-amber-400">
                            • {c.couponName} ({c.conversionRate}%)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 비교 분석 탭 */}
        {activeTab === 'comparison' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 유형별 비교 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">할인 유형별 비교</h3>
              {byType && (
                <div className="h-64">
                  <Doughnut
                    data={{
                      labels: ['정률 할인 (RATE)', '정액 할인 (FIXED)'],
                      datasets: [{
                        data: [byType.RATE?.gmv || 0, byType.FIXED?.gmv || 0],
                        backgroundColor: ['#8B5CF6', '#EC4899'],
                        borderWidth: 0,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' }
                      }
                    }}
                  />
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">RATE 전환율</p>
                  <p className="text-lg font-bold text-violet-600">{byType?.RATE?.conversionRate?.toFixed(1) || 0}%</p>
                </div>
                <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">FIXED 전환율</p>
                  <p className="text-lg font-bold text-pink-600">{byType?.FIXED?.conversionRate?.toFixed(1) || 0}%</p>
                </div>
              </div>
            </div>

            {/* 국가별 비교 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">국가별 비교</h3>
              {byCountry && (
                <div className="h-64">
                  <Bar
                    data={{
                      labels: ['발급', '사용', 'GMV (만원)'],
                      datasets: [
                        {
                          label: 'JP',
                          data: [
                            byCountry.JP?.issued || 0,
                            byCountry.JP?.used || 0,
                            (byCountry.JP?.gmv || 0) / 10000
                          ],
                          backgroundColor: '#3B82F6',
                        },
                        {
                          label: 'EN',
                          data: [
                            byCountry.EN?.issued || 0,
                            byCountry.EN?.used || 0,
                            (byCountry.EN?.gmv || 0) / 10000
                          ],
                          backgroundColor: '#10B981',
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' }
                      },
                      scales: {
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">JP 전환율</p>
                  <p className="text-lg font-bold text-blue-600">{byCountry?.JP?.conversionRate?.toFixed(1) || 0}%</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">EN 전환율</p>
                  <p className="text-lg font-bold text-emerald-600">{byCountry?.EN?.conversionRate?.toFixed(1) || 0}%</p>
                </div>
              </div>
            </div>
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
          </div>
        )}

        {/* 트렌드 탭 (간단히) */}
        {activeTab === 'trend' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">월별 트렌드</h3>
            <p className="text-sm text-slate-500">트렌드 데이터는 일별 집계 데이터(Phase 2)가 축적된 후 표시됩니다.</p>
          </div>
        )}
      </div>
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
  color: 'violet' | 'emerald' | 'blue' | 'amber' | 'red'
  change?: number
  tooltip?: string
}) {
  const colorClasses = {
    violet: 'from-violet-500 to-purple-600',
    emerald: 'from-emerald-500 to-teal-600',
    blue: 'from-blue-500 to-indigo-600',
    amber: 'from-amber-500 to-orange-600',
    red: 'from-red-500 to-rose-600',
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
          <Icon icon={IconComponent} size="md" className="text-white" />
        </div>
        {tooltip && (
          <Tooltip content={tooltip}>
            <Icon icon={Info} size="sm" className="text-slate-400 cursor-help" />
          </Tooltip>
        )}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</span>
        {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          <Icon icon={change >= 0 ? ArrowUpRight : ArrowDownRight} size="sm" />
          <span>{change >= 0 ? '+' : ''}{typeof change === 'number' ? change.toFixed(1) : change}%</span>
          <span className="text-slate-400 text-xs">vs 이전 기간</span>
        </div>
      )}
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const typeStyles = {
    success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  }

  const iconColors = {
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
    error: 'text-red-500',
  }

  const icons = {
    success: TrendingUp,
    warning: AlertTriangle,
    info: Info,
    error: AlertTriangle,
  }

  return (
    <div className={`rounded-xl border p-5 ${typeStyles[insight.type]}`}>
      <div className="flex items-start gap-3">
        <Icon icon={icons[insight.type]} size="md" className={iconColors[insight.type]} />
        <div className="flex-1">
          <p className="font-medium text-slate-800 dark:text-slate-100 mb-1">{insight.message}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{insight.action}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          insight.priority === 'high' ? 'bg-red-100 text-red-600' :
          insight.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
          'bg-slate-100 text-slate-600'
        }`}>
          {insight.priority === 'high' ? '높음' : insight.priority === 'medium' ? '보통' : '낮음'}
        </span>
      </div>
    </div>
  )
}

