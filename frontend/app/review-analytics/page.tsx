'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { reviewAnalyticsApi } from '@/lib/api'
import { EnhancedLoadingPage } from '@/components/ui'
import { Icon } from '@/components/ui/Icon'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  Star, TrendingUp, TrendingDown, Users, MessageSquare,
  BarChart3, PieChart, AlertTriangle, Lightbulb, Award,
  ThumbsUp, ThumbsDown, Minus, ArrowUpRight, ArrowDownRight, Info,
  Globe, Palette
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
import { Bar, Doughnut } from 'react-chartjs-2'

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

interface NPSData {
  score: number
  interpretation: string
  breakdown: {
    promoters: { count: number; percentage: string }
    passives: { count: number; percentage: string }
    detractors: { count: number; percentage: string }
  }
  totalReviews: number
  avgRating: string
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

export default function ReviewAnalyticsPage() {
  // 기본 날짜 범위: 최근 30일
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0])
  const [activeTab, setActiveTab] = useState<'overview' | 'distribution' | 'comparison' | 'insights'>('overview')

  // API 쿼리
  const { data: npsData, isLoading: npsLoading } = useQuery({
    queryKey: ['review-nps', startDate, endDate],
    queryFn: () => reviewAnalyticsApi.getNPS(startDate, endDate, true),
  })

  const { data: distributionData, isLoading: distLoading } = useQuery({
    queryKey: ['review-distribution', startDate, endDate],
    queryFn: () => reviewAnalyticsApi.getRatingDistribution(startDate, endDate),
  })

  const { data: byCountryData, isLoading: countryLoading } = useQuery({
    queryKey: ['review-by-country', startDate, endDate],
    queryFn: () => reviewAnalyticsApi.getByCountry(startDate, endDate),
  })

  const { data: byArtistData, isLoading: artistLoading } = useQuery({
    queryKey: ['review-by-artist', startDate, endDate],
    queryFn: () => reviewAnalyticsApi.getByArtist(startDate, endDate, 10, 'nps'),
  })

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['review-insights', startDate, endDate],
    queryFn: () => reviewAnalyticsApi.getInsights(startDate, endDate),
  })

  const isLoading = npsLoading || distLoading || countryLoading || artistLoading || insightsLoading

  if (isLoading) {
    return <EnhancedLoadingPage message="리뷰 분석 데이터를 불러오는 중..." variant="default" size="lg" />
  }

  const nps = npsData?.data?.nps as NPSData | undefined
  const comparison = npsData?.data?.comparison
  const distribution = distributionData?.data?.distribution
  const byCountry = byCountryData?.data?.byCountry
  const byArtist = byArtistData?.data?.byArtist
  const insights = insightsData?.data?.insights as Insight[] | undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon icon={Star} size="xl" className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">리뷰 분석</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">NPS 및 고객 만족도 분석</p>
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
              { id: 'overview', label: 'NPS 개요', icon: BarChart3 },
              { id: 'distribution', label: '평점 분포', icon: PieChart },
              { id: 'comparison', label: '비교 분석', icon: Globe },
              { id: 'insights', label: '인사이트', icon: Lightbulb },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Icon icon={tab.icon} size="sm" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* NPS 개요 탭 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* NPS 스코어 카드 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 메인 NPS 게이지 */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">NPS 스코어</h3>
                <div className="flex items-center justify-center">
                  <NPSGauge score={nps?.score || 0} interpretation={nps?.interpretation || ''} />
                </div>
                {comparison && (
                  <div className="mt-4 text-center">
                    <span className={`inline-flex items-center gap-1 text-sm ${
                      comparison.change >= 0 ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      <Icon icon={comparison.change >= 0 ? ArrowUpRight : ArrowDownRight} size="sm" />
                      {comparison.change >= 0 ? '+' : ''}{comparison.change}점 vs 이전 기간
                    </span>
                  </div>
                )}
              </div>

              {/* 요약 통계 */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                      <Icon icon={Star} size="md" className="text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">평균 평점</p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{nps?.avgRating || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Icon icon={MessageSquare} size="md" className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">총 리뷰 수</p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{nps?.totalReviews || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* NPS 분류 (10점 만점 기준) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NPSBreakdownCard
                title="Promoters"
                subtitle="9~10점"
                count={nps?.breakdown?.promoters?.count || 0}
                percentage={nps?.breakdown?.promoters?.percentage || '0'}
                icon={ThumbsUp}
                color="emerald"
              />
              <NPSBreakdownCard
                title="Passives"
                subtitle="7~8점"
                count={nps?.breakdown?.passives?.count || 0}
                percentage={nps?.breakdown?.passives?.percentage || '0'}
                icon={Minus}
                color="slate"
              />
              <NPSBreakdownCard
                title="Detractors"
                subtitle="1~6점"
                count={nps?.breakdown?.detractors?.count || 0}
                percentage={nps?.breakdown?.detractors?.percentage || '0'}
                icon={ThumbsDown}
                color="red"
              />
            </div>

            {/* TOP 작가 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Icon icon={Palette} size="md" className="text-violet-500" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">TOP 작가 (NPS 기준)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">순위</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">작가명</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-slate-500">리뷰 수</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-slate-500">평균 평점</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-slate-500">NPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byArtist?.slice(0, 10).map((artist: any, idx: number) => (
                      <tr key={artist.artistName} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <td className="py-3 px-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-600' :
                            idx === 1 ? 'bg-slate-100 text-slate-600' :
                            idx === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-slate-50 text-slate-500'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-sm font-medium text-slate-800 dark:text-slate-100">{artist.artistName}</td>
                        <td className="py-3 px-2 text-sm text-right text-slate-600 dark:text-slate-400">{artist.reviewCount}</td>
                        <td className="py-3 px-2 text-sm text-right">
                          <span className="flex items-center justify-end gap-1">
                            <Icon icon={Star} size="xs" className="text-amber-400" />
                            {artist.avgRating}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-sm text-right">
                          <span className={`font-semibold ${
                            artist.npsScore >= 50 ? 'text-emerald-600' :
                            artist.npsScore >= 0 ? 'text-amber-600' :
                            'text-red-500'
                          }`}>
                            {artist.npsScore}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!byArtist || byArtist.length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-8">데이터가 없습니다</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 평점 분포 탭 */}
        {activeTab === 'distribution' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">평점 분포</h3>
              {distribution && (
                <div className="h-64">
                  <Bar
                    data={{
                      labels: ['1점', '2점', '3점', '4점', '5점'],
                      datasets: [{
                        label: '리뷰 수',
                        data: distribution.map((d: any) => d.count),
                        backgroundColor: [
                          '#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981'
                        ],
                        borderRadius: 8,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">비율</h3>
              {distribution && (
                <>
                  <div className="h-48">
                    <Doughnut
                      data={{
                        labels: ['1점', '2점', '3점', '4점', '5점'],
                        datasets: [{
                          data: distribution.map((d: any) => d.count),
                          backgroundColor: [
                            '#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981'
                          ],
                          borderWidth: 0,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'right' }
                        }
                      }}
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    {distribution.map((d: any) => (
                      <div key={d.rating} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          {[...Array(d.rating)].map((_, i) => (
                            <Icon key={i} icon={Star} size="xs" className="text-amber-400" />
                          ))}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">{d.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 비교 분석 탭 */}
        {activeTab === 'comparison' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 국가별 비교 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">국가별 비교</h3>
              {byCountry && (
                <div className="space-y-6">
                  {/* JP */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-blue-800 dark:text-blue-200">🇯🇵 일본 (JP)</span>
                      <span className={`text-lg font-bold ${
                        byCountry.JP?.npsScore >= 50 ? 'text-emerald-600' :
                        byCountry.JP?.npsScore >= 0 ? 'text-amber-600' :
                        'text-red-500'
                      }`}>
                        NPS {byCountry.JP?.npsScore || 0}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <p className="text-slate-500">리뷰 수</p>
                        <p className="font-semibold">{byCountry.JP?.totalReviews || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500">평균 평점</p>
                        <p className="font-semibold">{byCountry.JP?.avgRating || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500">상태</p>
                        <p className="font-semibold">{byCountry.JP?.interpretation || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* EN */}
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-emerald-800 dark:text-emerald-200">🌍 영어권 (EN)</span>
                      <span className={`text-lg font-bold ${
                        byCountry.EN?.npsScore >= 50 ? 'text-emerald-600' :
                        byCountry.EN?.npsScore >= 0 ? 'text-amber-600' :
                        'text-red-500'
                      }`}>
                        NPS {byCountry.EN?.npsScore || 0}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <p className="text-slate-500">리뷰 수</p>
                        <p className="font-semibold">{byCountry.EN?.totalReviews || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500">평균 평점</p>
                        <p className="font-semibold">{byCountry.EN?.avgRating || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500">상태</p>
                        <p className="font-semibold">{byCountry.EN?.interpretation || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NPS 비교 차트 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">NPS 구성 비교</h3>
              {byCountry && (
                <div className="h-64">
                  <Bar
                    data={{
                      labels: ['JP', 'EN'],
                      datasets: [
                        {
                          label: 'Promoters',
                          data: [
                            byCountry.JP?.breakdown?.promoters || 0,
                            byCountry.EN?.breakdown?.promoters || 0
                          ],
                          backgroundColor: '#10B981',
                        },
                        {
                          label: 'Passives',
                          data: [
                            byCountry.JP?.breakdown?.passives || 0,
                            byCountry.EN?.breakdown?.passives || 0
                          ],
                          backgroundColor: '#94A3B8',
                        },
                        {
                          label: 'Detractors',
                          data: [
                            byCountry.JP?.breakdown?.detractors || 0,
                            byCountry.EN?.breakdown?.detractors || 0
                          ],
                          backgroundColor: '#EF4444',
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
                        x: { stacked: true },
                        y: { stacked: true, beginAtZero: true }
                      }
                    }}
                  />
                </div>
              )}
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
      </div>
    </div>
  )
}

// ============================================================
// 서브 컴포넌트
// ============================================================

function NPSGauge({ score, interpretation }: { score: number; interpretation: string }) {
  // NPS 범위: -100 ~ +100
  const normalizedScore = Math.max(-100, Math.min(100, score))
  const percentage = ((normalizedScore + 100) / 200) * 100
  
  const getColor = (score: number) => {
    if (score >= 50) return 'text-emerald-500'
    if (score >= 0) return 'text-amber-500'
    return 'text-red-500'
  }

  const getBgColor = (score: number) => {
    if (score >= 50) return 'from-emerald-500 to-teal-500'
    if (score >= 0) return 'from-amber-500 to-orange-500'
    return 'from-red-500 to-rose-500'
  }

  return (
    <div className="relative w-64 h-32">
      {/* 배경 반원 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="w-64 h-64 rounded-full border-[16px] border-slate-200 dark:border-slate-700" 
             style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }} />
      </div>
      
      {/* 점수 반원 */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className={`w-64 h-64 rounded-full border-[16px] border-transparent bg-gradient-to-r ${getBgColor(score)}`}
          style={{ 
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
            transform: `rotate(${(percentage / 100) * 180 - 180}deg)`,
            transformOrigin: 'center center'
          }} 
        />
      </div>

      {/* 중앙 점수 */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
        <span className={`text-4xl font-bold ${getColor(score)}`}>{score}</span>
        <span className="text-sm text-slate-500">{interpretation}</span>
      </div>
    </div>
  )
}

function NPSBreakdownCard({
  title,
  subtitle,
  count,
  percentage,
  icon: IconComponent,
  color,
}: {
  title: string
  subtitle: string
  count: number
  percentage: string
  icon: any
  color: 'emerald' | 'slate' | 'red'
}) {
  const colorClasses = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    slate: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  }

  const iconColors = {
    emerald: 'text-emerald-500',
    slate: 'text-slate-500',
    red: 'text-red-500',
  }

  return (
    <div className={`rounded-2xl border p-5 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon icon={IconComponent} size="md" className={iconColors[color]} />
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{count}</span>
        <span className="text-lg font-semibold text-slate-600 dark:text-slate-400">{percentage}%</span>
      </div>
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
          insight.priority === 'critical' ? 'bg-red-100 text-red-600' :
          insight.priority === 'high' ? 'bg-orange-100 text-orange-600' :
          insight.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
          'bg-slate-100 text-slate-600'
        }`}>
          {insight.priority === 'critical' ? '긴급' : 
           insight.priority === 'high' ? '높음' : 
           insight.priority === 'medium' ? '보통' : '낮음'}
        </span>
      </div>
    </div>
  )
}

