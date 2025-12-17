'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { customerAnalyticsApi, reviewAnalyticsApi, customer360Api } from '@/lib/api'
import { formatNumber, formatPercent } from '@/lib/formatters'
import { EnhancedLoadingPage } from '@/components/ui'
import { Icon } from '@/components/ui/Icon'
import {
  Users, Star, UserCircle, ArrowRight, Calendar,
  ThumbsUp, ThumbsDown, Meh, TrendingUp, Award, Heart
} from 'lucide-react'
import { addDays, format } from 'date-fns'

export default function CustomerHubPage() {
  const startDate = format(addDays(new Date(), -30), 'yyyy-MM-dd')
  const endDate = format(new Date(), 'yyyy-MM-dd')

  // 고객 분석 요약
  const { data: customerData, isLoading: loadingCustomer } = useQuery({
    queryKey: ['customer-summary', startDate, endDate],
    queryFn: () => customerAnalyticsApi.getSummary(startDate, endDate),
  })

  // 리뷰/NPS 요약
  const { data: npsData, isLoading: loadingNPS } = useQuery({
    queryKey: ['review-nps', startDate, endDate],
    queryFn: () => reviewAnalyticsApi.getNPS(startDate, endDate),
  })

  // 세그먼트 요약
  const { data: segmentsData, isLoading: loadingSegments } = useQuery({
    queryKey: ['customer-segments'],
    queryFn: () => customer360Api.getSegmentsSummary(),
  })

  const isLoading = loadingCustomer || loadingNPS || loadingSegments

  if (isLoading) {
    return <EnhancedLoadingPage message="고객 분석 허브 데이터를 불러오는 중..." />
  }

  const customer = customerData?.data || customerData
  const nps = npsData
  const segments = segmentsData?.data

  // NPS 색상 결정
  const getNPSColor = (score: number) => {
    if (score >= 50) return 'text-emerald-500'
    if (score >= 0) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Icon icon={Users} size="xl" className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">고객 분석 허브</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                고객 세그먼트, NPS, 리뷰를 한눈에 확인하세요
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
            <Icon icon={Calendar} size="sm" />
            <span>최근 30일 기준 ({startDate} ~ {endDate})</span>
          </div>
        </div>

        {/* NPS 대시보드 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">NPS (Net Promoter Score)</h2>
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* NPS 점수 */}
            <div className="text-center">
              <div className={`text-6xl font-bold ${getNPSColor(nps?.score || 0)}`}>
                {nps?.score || 0}
              </div>
              <p className="text-sm text-slate-500 mt-2">NPS 점수</p>
            </div>

            {/* 분포 */}
            <div className="flex-1 grid grid-cols-3 gap-4 w-full">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <Icon icon={ThumbsUp} size="lg" className="text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {nps?.promotersCount || 0}
                </p>
                <p className="text-xs text-slate-500">추천 고객</p>
                <p className="text-xs text-emerald-600">({formatPercent((nps?.promotersPct || 0) / 100, true)})</p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <Icon icon={Meh} size="lg" className="text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {nps?.passivesCount || 0}
                </p>
                <p className="text-xs text-slate-500">중립 고객</p>
                <p className="text-xs text-amber-600">({formatPercent((nps?.passivesPct || 0) / 100, true)})</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <Icon icon={ThumbsDown} size="lg" className="text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {nps?.detractorsCount || 0}
                </p>
                <p className="text-xs text-slate-500">비추천 고객</p>
                <p className="text-xs text-red-600">({formatPercent((nps?.detractorsPct || 0) / 100, true)})</p>
              </div>
            </div>
          </div>
        </div>

        {/* 허브 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 고객 분석 */}
          <HubCard
            href="/customer-analytics"
            icon={Users}
            title="고객 분석"
            description="고객 세그먼트, 코호트, 리텐션 분석"
            color="blue"
            stats={[
              { label: '총 고객', value: formatNumber(customer?.totalCustomers || 0) },
              { label: '활성 고객', value: formatNumber(customer?.activeCustomers || 0) },
            ]}
          />

          {/* 고객 360° 뷰 */}
          <HubCard
            href="/customer-360"
            icon={UserCircle}
            title="고객 360° 뷰"
            description="개별 고객의 통합 프로필 및 RFM 분석"
            color="cyan"
            badge="NEW"
            stats={[
              { label: '세그먼트', value: `${segments?.segments?.length || 0}개` },
              { label: 'Champions', value: formatNumber(segments?.segments?.find((s: any) => s.segment === 'Champions')?.count || 0) },
            ]}
          />

          {/* 리뷰 분석 */}
          <HubCard
            href="/review-analytics"
            icon={Star}
            title="리뷰 분석"
            description="NPS, 평점 분포, 작가별/국가별 분석"
            color="amber"
            badge="NEW"
            stats={[
              { label: 'NPS 점수', value: `${nps?.score || 0}점` },
              { label: '추천 고객', value: `${nps?.promotersCount || 0}명` },
            ]}
          />
        </div>

        {/* 세그먼트 요약 */}
        {segments?.segments && segments.segments.length > 0 && (
          <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Icon icon={Award} size="md" className="text-violet-500" />
              고객 세그먼트 분포
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {segments.segments.slice(0, 6).map((segment: any) => (
                <SegmentCard
                  key={segment.segment}
                  name={segment.segment}
                  count={segment.count}
                  percentage={parseFloat(segment.percentage)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 인사이트 요약 */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2">
            <Icon icon={Heart} size="md" />
            고객 인사이트
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InsightItem
              icon={TrendingUp}
              title="NPS 현황"
              description={`NPS ${nps?.score || 0}점으로 ${(nps?.score || 0) >= 50 ? '매우 우수' : (nps?.score || 0) >= 0 ? '양호' : '개선 필요'}합니다.`}
              type={(nps?.score || 0) >= 50 ? 'positive' : (nps?.score || 0) >= 0 ? 'neutral' : 'negative'}
            />
            <InsightItem
              icon={Users}
              title="추천 고객"
              description={`${nps?.promotersCount || 0}명의 추천 고객이 있습니다. 이들을 대상으로 리퍼럴 프로그램을 운영하세요.`}
              type="positive"
            />
            <InsightItem
              icon={ThumbsDown}
              title="비추천 고객"
              description={`${nps?.detractorsCount || 0}명의 비추천 고객에게 개선된 서비스를 제공하세요.`}
              type="negative"
            />
            <InsightItem
              icon={Star}
              title="리뷰 관리"
              description="고객 리뷰를 지속적으로 모니터링하고 피드백에 대응하세요."
              type="neutral"
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
  color: 'blue' | 'cyan' | 'amber'
  badge?: string
  stats: Array<{ label: string; value: string }>
}) {
  const colorClasses = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      hover: 'hover:from-blue-600 hover:to-blue-700',
    },
    cyan: {
      bg: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      hover: 'hover:from-cyan-600 hover:to-cyan-700',
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-500 to-amber-600',
      hover: 'hover:from-amber-600 hover:to-amber-700',
    },
  }

  return (
    <Link href={href} className="block group">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full">
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

function SegmentCard({
  name,
  count,
  percentage,
}: {
  name: string
  count: number
  percentage: number
}) {
  const getSegmentColor = (name: string) => {
    const colors: Record<string, string> = {
      'Champions': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      'Loyal Customers': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'Potential Loyalists': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      'New Customers': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
      'At Risk': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      'Hibernating': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    }
    return colors[name] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
  }

  return (
    <div className={`p-3 rounded-xl ${getSegmentColor(name)}`}>
      <p className="text-xs font-medium truncate">{name}</p>
      <p className="text-lg font-bold">{formatNumber(count)}</p>
      <p className="text-xs opacity-75">{percentage.toFixed(1)}%</p>
    </div>
  )
}

function InsightItem({
  icon: IconComponent,
  title,
  description,
  type,
}: {
  icon: any
  title: string
  description: string
  type: 'positive' | 'neutral' | 'negative'
}) {
  const typeClasses = {
    positive: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500',
    neutral: 'bg-amber-100 dark:bg-amber-900/30 text-amber-500',
    negative: 'bg-red-100 dark:bg-red-900/30 text-red-500',
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeClasses[type]}`}>
        <Icon icon={IconComponent} size="sm" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

