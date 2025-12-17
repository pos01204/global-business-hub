'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { analyticsApi, orderPatternsApi, couponAnalyticsApi } from '@/lib/api'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters'
import { EnhancedLoadingPage } from '@/components/ui'
import { Icon } from '@/components/ui/Icon'
import {
  BarChart3, TrendingUp, Ticket, ArrowRight, Calendar,
  ShoppingBag, DollarSign, Users, Award, Clock, Globe
} from 'lucide-react'
import { addDays, format } from 'date-fns'

export default function PerformanceHubPage() {
  const startDate = format(addDays(new Date(), -30), 'yyyy-MM-dd')
  const endDate = format(new Date(), 'yyyy-MM-dd')

  // 성과 분석 요약
  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics-summary', startDate, endDate],
    queryFn: () => analyticsApi.getSummary(startDate, endDate),
  })

  // 주문 패턴 요약
  const { data: patternsData, isLoading: loadingPatterns } = useQuery({
    queryKey: ['order-patterns-summary', startDate, endDate],
    queryFn: () => orderPatternsApi.getSummary(startDate, endDate),
  })

  // 쿠폰 분석 요약
  const { data: couponData, isLoading: loadingCoupon } = useQuery({
    queryKey: ['coupon-summary', startDate, endDate],
    queryFn: () => couponAnalyticsApi.getSummary(startDate, endDate),
  })

  const isLoading = loadingAnalytics || loadingPatterns || loadingCoupon

  if (isLoading) {
    return <EnhancedLoadingPage message="성과 분석 허브 데이터를 불러오는 중..." />
  }

  const analytics = analyticsData?.data || analyticsData
  const patterns = patternsData?.data?.summary
  const coupon = couponData

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Icon icon={BarChart3} size="xl" className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">성과 분석 허브</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                GMV, 주문, 쿠폰 성과를 한눈에 확인하세요
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
            <Icon icon={Calendar} size="sm" />
            <span>최근 30일 기준 ({startDate} ~ {endDate})</span>
          </div>
        </div>

        {/* 핵심 KPI 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="총 GMV"
            value={formatCurrency(analytics?.totalGmv || analytics?.gmv?.total || 0)}
            icon={DollarSign}
            color="emerald"
          />
          <KPICard
            title="총 주문"
            value={formatNumber(analytics?.totalOrders || analytics?.orders?.total || 0)}
            suffix="건"
            icon={ShoppingBag}
            color="blue"
          />
          <KPICard
            title="피크 요일"
            value={patterns?.peakDay?.dayName || '-'}
            icon={Calendar}
            color="amber"
          />
          <KPICard
            title="쿠폰 ROI"
            value={coupon?.roi ? `${coupon.roi.toFixed(1)}x` : '-'}
            icon={Ticket}
            color="violet"
          />
        </div>

        {/* 허브 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 성과 분석 */}
          <HubCard
            href="/analytics"
            icon={BarChart3}
            title="성과 분석"
            description="GMV, 주문, 고객 지표의 상세 분석"
            color="indigo"
            stats={[
              { label: '총 GMV', value: formatCurrency(analytics?.totalGmv || analytics?.gmv?.total || 0) },
              { label: '평균 AOV', value: formatCurrency(analytics?.avgAov || analytics?.aov?.value || 0) },
            ]}
          />

          {/* 주문 패턴 분석 */}
          <HubCard
            href="/order-patterns"
            icon={TrendingUp}
            title="주문 패턴 분석"
            description="요일별, 시간대별, 국가별 주문 패턴"
            color="emerald"
            badge="NEW"
            stats={[
              { label: '피크 요일', value: patterns?.peakDay?.dayName || '-' },
              { label: '피크 시간', value: patterns?.peakHour?.label || '-' },
            ]}
          />

          {/* 쿠폰 효과 분석 */}
          <HubCard
            href="/coupon-analytics"
            icon={Ticket}
            title="쿠폰 효과 분석"
            description="쿠폰 전환율, ROI, 성과 분석"
            color="violet"
            stats={[
              { label: '전환율', value: formatPercent(coupon?.overallConversionRate || 0, true) },
              { label: 'ROI', value: coupon?.roi ? `${coupon.roi.toFixed(1)}x` : '-' },
            ]}
          />
        </div>

        {/* 인사이트 요약 */}
        <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Icon icon={Award} size="md" className="text-amber-500" />
            핵심 인사이트
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InsightItem
              icon={Calendar}
              title="피크 요일"
              description={`${patterns?.peakDay?.dayName || '-'}요일에 주문이 가장 많습니다. 이 요일에 프로모션을 집중하세요.`}
            />
            <InsightItem
              icon={Clock}
              title="피크 시간대"
              description={`${patterns?.peakHour?.label || '-'}에 주문이 집중됩니다. 이 시간에 푸시 알림을 발송하세요.`}
            />
            <InsightItem
              icon={Ticket}
              title="쿠폰 성과"
              description={`쿠폰 전환율 ${formatPercent(coupon?.overallConversionRate || 0, true)}, ROI ${coupon?.roi?.toFixed(1) || '-'}x 달성`}
            />
            <InsightItem
              icon={Globe}
              title="국가별 분석"
              description="국가별 주문 패턴 차이를 분석하여 맞춤 전략을 수립하세요."
            />
          </div>
        </div>
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
}: {
  title: string
  value: string | number
  suffix?: string
  icon: any
  color: 'emerald' | 'blue' | 'amber' | 'violet'
}) {
  const colorClasses = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-500',
    violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-500',
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[color]}`}>
        <Icon icon={IconComponent} size="md" />
      </div>
      <p className="text-xs text-slate-500 mb-1">{title}</p>
      <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
        {value}{suffix && <span className="text-sm font-normal text-slate-500 ml-1">{suffix}</span>}
      </p>
    </div>
  )
}

function HubCard({
  href,
  icon: IconComponent,
  title,
  description,
  color,
  badge,
  stats,
}: {
  href: string
  icon: any
  title: string
  description: string
  color: 'indigo' | 'emerald' | 'violet'
  badge?: string
  stats: Array<{ label: string; value: string }>
}) {
  const colorClasses = {
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      hover: 'hover:from-indigo-600 hover:to-indigo-700',
      light: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      hover: 'hover:from-emerald-600 hover:to-emerald-700',
      light: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    violet: {
      bg: 'bg-gradient-to-br from-violet-500 to-violet-600',
      hover: 'hover:from-violet-600 hover:to-violet-700',
      light: 'bg-violet-50 dark:bg-violet-900/20',
    },
  }

  return (
    <Link href={href} className="block group">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full">
        {/* 헤더 */}
        <div className={`${colorClasses[color].bg} ${colorClasses[color].hover} p-6 transition-colors`}>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Icon icon={IconComponent} size="lg" className="text-white" />
            </div>
            {badge && (
              <span className="px-2 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">
                {badge}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-white mt-4">{title}</h3>
          <p className="text-white/80 text-sm mt-1">{description}</p>
        </div>

        {/* 통계 */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index}>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
            자세히 보기
            <Icon icon={ArrowRight} size="sm" className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function InsightItem({
  icon: IconComponent,
  title,
  description,
}: {
  icon: any
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon icon={IconComponent} size="sm" className="text-amber-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

