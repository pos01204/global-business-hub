'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { orderPatternsApi } from '@/lib/api'
import { formatCurrency, formatNumber } from '@/lib/formatters'
import { EnhancedLoadingPage, Card, EmptyState } from '@/components/ui'
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

  const summary = summaryData?.data?.summary
  const byDay = byDayData?.data?.byDay as DayData[] | undefined
  const byHour = byHourData?.data?.byHour as HourData[] | undefined
  const byCountry = byCountryData?.data?.byCountry
  const monthly = monthlyData?.data?.trend as MonthData[] | undefined

  // Recharts 형식 차트 데이터 준비
  const dayChartData = byDay?.map(d => ({
    name: d.dayName,
    orders: d.orders,
    gmv: d.gmv,
  })) || []

  const hourChartData = byHour?.map(d => ({
    name: d.label,
    orders: d.orders,
    gmv: d.gmv,
  })) || []

  const countryChartData = ['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => ({
    name: day,
    JP: byCountry?.JP?.[idx]?.orders || 0,
    EN: byCountry?.EN?.[idx]?.orders || 0,
  }))

  const monthlyChartData = monthly?.map(d => ({
    name: d.month,
    gmv: d.gmv,
    orders: d.orders,
  })) || []

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
              <EnhancedBarChart 
                data={dayChartData} 
                dataKeys="orders"
                xAxisKey="name"
                names="주문 수"
                colors="#6366f1"
                height={256}
              />
            </div>
          </div>

          {/* 시간대별 패턴 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon={Clock} size="md" className="text-emerald-500" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">시간대별 주문 패턴</h3>
            </div>
            <div className="h-64">
              <EnhancedBarChart 
                data={hourChartData} 
                dataKeys="orders"
                xAxisKey="name"
                names="주문 수"
                colors="#10b981"
                height={256}
              />
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
            <EnhancedBarChart 
              data={countryChartData} 
              dataKeys={['JP', 'EN']}
              xAxisKey="name"
              names={['일본 (JP)', '영어권 (EN)']}
              colors={['#ef4444', '#3b82f6']}
              height={288}
            />
          </div>
        </div>

        {/* 월별 트렌드 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon={TrendingUp} size="md" className="text-violet-500" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">월별 GMV 트렌드</h3>
          </div>
          <div className="h-72">
            <EnhancedLineChart 
              data={monthlyChartData} 
              dataKey="gmv"
              xAxisKey="name"
              name="GMV"
              color="#6366f1"
              showArea={true}
              height={288}
            />
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

