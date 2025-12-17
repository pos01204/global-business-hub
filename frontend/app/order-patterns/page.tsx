'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { orderPatternsApi } from '@/lib/api'
import { formatCurrency, formatNumber } from '@/lib/formatters'
import { EnhancedLoadingPage, EnhancedErrorPage } from '@/components/ui'
import { Icon } from '@/components/ui/Icon'
import { EnhancedBarChart, EnhancedLineChart } from '@/components/charts'
import {
  BarChart3, TrendingUp, Calendar, Clock, Globe,
  ShoppingBag, DollarSign, ArrowUp, ArrowDown
} from 'lucide-react'
import { addDays, format } from 'date-fns'

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

interface HourData {
  hour: number
  label: string
  orders: number
  gmv: number
}

interface MonthData {
  month: string
  orders: number
  gmv: number
  items: number
  avgOrderValue: number
}

// ============================================================
// 컴포넌트
// ============================================================

export default function OrderPatternsPage() {
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -90),
    to: new Date(),
  })

  const startDate = format(dateRange.from, 'yyyy-MM-dd')
  const endDate = format(dateRange.to, 'yyyy-MM-dd')

  // API 쿼리
  const { data: summaryData, isLoading: loadingSummary, error: errorSummary } = useQuery({
    queryKey: ['order-patterns-summary', startDate, endDate],
    queryFn: () => orderPatternsApi.getSummary(startDate, endDate),
  })

  const { data: byDayData, isLoading: loadingByDay, error: errorByDay } = useQuery({
    queryKey: ['order-patterns-by-day', startDate, endDate],
    queryFn: () => orderPatternsApi.getByDay(startDate, endDate),
  })

  const { data: byHourData, isLoading: loadingByHour, error: errorByHour } = useQuery({
    queryKey: ['order-patterns-by-hour', startDate, endDate],
    queryFn: () => orderPatternsApi.getByHour(startDate, endDate),
  })

  const { data: byCountryData, isLoading: loadingByCountry, error: errorByCountry } = useQuery({
    queryKey: ['order-patterns-by-country', startDate, endDate],
    queryFn: () => orderPatternsApi.getByCountry(startDate, endDate),
  })

  const { data: monthlyData, isLoading: loadingMonthly, error: errorMonthly } = useQuery({
    queryKey: ['order-patterns-monthly', startDate, endDate],
    queryFn: () => orderPatternsApi.getMonthlyTrend(startDate, endDate),
  })

  const isLoading = loadingSummary || loadingByDay || loadingByHour || loadingByCountry || loadingMonthly
  const hasError = errorSummary || errorByDay || errorByHour || errorByCountry || errorMonthly

  if (isLoading) {
    return <EnhancedLoadingPage message="주문 패턴 데이터를 분석 중..." variant="default" size="lg" />
  }

  if (hasError) {
    return <EnhancedErrorPage message="주문 패턴 데이터를 불러오는 중 오류가 발생했습니다." />
  }

  const summary = summaryData?.data?.summary
  const byDay = byDayData?.data?.byDay as DayData[] | undefined
  const byHour = byHourData?.data?.byHour as HourData[] | undefined
  const byCountry = byCountryData?.data?.byCountry
  const monthly = monthlyData?.data?.trend as MonthData[] | undefined

  // 차트 데이터 준비
  const dayChartData = {
    labels: byDay?.map(d => d.dayName) || [],
    datasets: [
      {
        label: '주문 수',
        data: byDay?.map(d => d.orders) || [],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const hourChartData = {
    labels: byHour?.map(d => d.label) || [],
    datasets: [
      {
        label: '주문 수',
        data: byHour?.map(d => d.orders) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const countryChartData = {
    labels: ['일', '월', '화', '수', '목', '금', '토'],
    datasets: [
      {
        label: '일본 (JP)',
        data: byCountry?.JP?.map((d: any) => d.orders) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: '영어권 (EN)',
        data: byCountry?.EN?.map((d: any) => d.orders) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const monthlyChartData = {
    labels: monthly?.map(d => d.month) || [],
    datasets: [
      {
        label: 'GMV',
        data: monthly?.map(d => d.gmv) || [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: '주문 수',
        data: monthly?.map(d => d.orders) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon icon={BarChart3} size="xl" className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">주문 패턴 분석</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">요일별, 시간대별, 국가별 주문 패턴</p>
            </div>
          </div>
        </div>

        {/* 기간 선택 */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <Icon icon={Calendar} size="sm" className="text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {format(dateRange.from, 'yyyy.MM.dd')} - {format(dateRange.to, 'yyyy.MM.dd')}
            </span>
          </div>
          <div className="flex gap-2">
            {[
              { label: '30일', days: 30 },
              { label: '90일', days: 90 },
              { label: '180일', days: 180 },
              { label: '1년', days: 365 },
            ].map((option) => (
              <button
                key={option.days}
                onClick={() => setDateRange({ from: addDays(new Date(), -option.days), to: new Date() })}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) === option.days
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            title="총 주문"
            value={formatNumber(summary?.totalOrders || 0)}
            suffix="건"
            icon={ShoppingBag}
            color="indigo"
          />
          <SummaryCard
            title="총 GMV"
            value={formatCurrency(summary?.totalGmv || 0)}
            icon={DollarSign}
            color="emerald"
          />
          <SummaryCard
            title="피크 요일"
            value={summary?.peakDay?.dayName || '-'}
            suffix={`(${summary?.peakDay?.orders || 0}건)`}
            icon={Calendar}
            color="amber"
          />
          <SummaryCard
            title="피크 시간"
            value={summary?.peakHour?.label || '-'}
            suffix={`(${summary?.peakHour?.orders || 0}건)`}
            icon={Clock}
            color="rose"
          />
        </div>

        {/* 차트 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 요일별 패턴 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon={Calendar} size="md" className="text-indigo-500" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">요일별 주문 패턴</h3>
            </div>
            <div className="h-64">
              <EnhancedBarChart data={dayChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                  },
                  x: {
                    grid: { display: false },
                  },
                },
              }} />
            </div>
          </div>

          {/* 시간대별 패턴 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon={Clock} size="md" className="text-emerald-500" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">시간대별 주문 패턴</h3>
            </div>
            <div className="h-64">
              <EnhancedBarChart data={hourChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                  },
                  x: {
                    grid: { display: false },
                    ticks: {
                      callback: function(value: any, index: number) {
                        return index % 3 === 0 ? `${index}시` : ''
                      }
                    }
                  },
                },
              }} />
            </div>
          </div>
        </div>

        {/* 국가별 비교 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon={Globe} size="md" className="text-blue-500" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">국가별 요일 패턴 비교</h3>
          </div>
          <div className="h-72">
            <EnhancedBarChart data={countryChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(0,0,0,0.05)' },
                },
                x: {
                  grid: { display: false },
                },
              },
            }} />
          </div>
        </div>

        {/* 월별 트렌드 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon={TrendingUp} size="md" className="text-violet-500" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">월별 GMV 및 주문 트렌드</h3>
          </div>
          <div className="h-72">
            <EnhancedLineChart data={monthlyChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index' as const,
                intersect: false,
              },
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
              scales: {
                y: {
                  type: 'linear' as const,
                  display: true,
                  position: 'left' as const,
                  title: {
                    display: true,
                    text: 'GMV (₩)',
                  },
                  grid: { color: 'rgba(0,0,0,0.05)' },
                },
                y1: {
                  type: 'linear' as const,
                  display: true,
                  position: 'right' as const,
                  title: {
                    display: true,
                    text: '주문 수',
                  },
                  grid: {
                    drawOnChartArea: false,
                  },
                },
                x: {
                  grid: { display: false },
                },
              },
            }} />
          </div>
        </div>

        {/* 인사이트 */}
        {summary && (
          <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800">
            <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-200 mb-3">💡 자동 인사이트</h3>
            <ul className="space-y-2 text-sm text-indigo-700 dark:text-indigo-300">
              <li>• <strong>{summary.peakDay?.dayName}요일</strong>이 가장 주문이 많습니다. 이 요일에 프로모션을 집중하면 효과적입니다.</li>
              <li>• <strong>{summary.peakHour?.label}</strong>가 피크 시간대입니다. 이 시간에 푸시 알림이나 광고를 집중 배치하세요.</li>
              <li>• 평균 주문액은 <strong>{formatCurrency(summary.avgOrderValue)}</strong>입니다.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// 서브 컴포넌트
// ============================================================

function SummaryCard({
  title,
  value,
  suffix = '',
  icon: IconComponent,
  color,
}: {
  title: string
  value: string | number
  suffix?: string
  icon: any
  color: 'indigo' | 'emerald' | 'amber' | 'rose'
}) {
  const colorClasses = {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-500',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-500',
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[color]}`}>
        <Icon icon={IconComponent} size="md" />
      </div>
      <p className="text-xs text-slate-500 mb-1">{title}</p>
      <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
        {value}
        {suffix && <span className="text-sm font-normal text-slate-500 ml-1">{suffix}</span>}
      </p>
    </div>
  )
}

