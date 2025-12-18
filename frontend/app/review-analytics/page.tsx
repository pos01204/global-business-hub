'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { reviewAnalyticsApi, reviewsApi } from '@/lib/api'
import { EnhancedLoadingPage } from '@/components/ui'
import { Icon } from '@/components/ui/Icon'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  Star, TrendingUp, TrendingDown, Users, MessageSquare,
  BarChart3, PieChart, AlertTriangle, Lightbulb, Award,
  ThumbsUp, ThumbsDown, Minus, ArrowUpRight, ArrowDownRight, Info,
  Globe, Palette, Calendar
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
import { Bar, Doughnut, Chart, Line } from 'react-chartjs-2'

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
  
  const [dateRange, setDateRange] = useState({
    from: thirtyDaysAgo,
    to: today,
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'distribution' | 'comparison' | 'insights' | 'trend' | 'list'>('overview')
  
  // 리뷰 목록 탭 상태 (기존 reviews 페이지 기능 통합)
  const [listCountry, setListCountry] = useState<string>('')
  const [listPage, setListPage] = useState(1)
  const [listSearch, setListSearch] = useState('')
  const [listSort, setListSort] = useState<'latest' | 'rating' | 'popular'>('latest')
  const [showImageOnly, setShowImageOnly] = useState(false)

  const startDate = format(dateRange.from, 'yyyy-MM-dd')
  const endDate = format(dateRange.to, 'yyyy-MM-dd')
  
  // 기간 선택 옵션
  const periodOptions = [
    { label: '7일', days: 7 },
    { label: '30일', days: 30 },
    { label: '90일', days: 90 },
    { label: '180일', days: 180 },
    { label: '1년', days: 365 },
  ]
  
  const selectedDays = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))

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

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['review-trend', startDate, endDate],
    queryFn: () => reviewAnalyticsApi.getTrend(startDate, endDate, 'monthly'),
    enabled: activeTab === 'trend' || activeTab === 'overview',
  })

  const { data: byProductData, isLoading: productLoading } = useQuery({
    queryKey: ['review-by-product', startDate, endDate],
    queryFn: () => reviewAnalyticsApi.getByProduct(startDate, endDate, 10),
    enabled: activeTab === 'overview' || activeTab === 'comparison',
  })

  const { data: contentAnalysisData, isLoading: contentLoading } = useQuery({
    queryKey: ['review-content-analysis', startDate, endDate],
    queryFn: () => reviewAnalyticsApi.getContentAnalysis(startDate, endDate),
    enabled: activeTab === 'overview' || activeTab === 'comparison',
  })

  // 리뷰 목록 쿼리 (기존 reviews 페이지 기능 통합)
  const { data: galleryData, isLoading: galleryLoading } = useQuery({
    queryKey: ['reviews-gallery', listCountry, showImageOnly, listPage, listSearch, listSort],
    queryFn: () => reviewsApi.getGallery({
      country: listCountry || undefined,
      hasImage: showImageOnly || undefined,
      page: listPage,
      pageSize: 20,
      minRating: 1,
      search: listSearch || undefined,
      sort: listSort,
    }),
    enabled: activeTab === 'list',
  })

  const isLoading = npsLoading || distLoading || countryLoading || artistLoading || insightsLoading || trendLoading || productLoading || contentLoading

  if (isLoading) {
    return <EnhancedLoadingPage message="리뷰 분석 데이터를 불러오는 중..." variant="default" size="lg" />
  }

  const nps = npsData?.data?.nps as NPSData | undefined
  const comparison = npsData?.data?.comparison
  const distribution = distributionData?.data?.distribution
  const byCountry = byCountryData?.data?.byCountry
  const byArtist = byArtistData?.data?.byArtist
  const byProduct = byProductData?.data?.byProduct
  const contentAnalysis = contentAnalysisData?.data
  const insights = insightsData?.data?.insights as Insight[] | undefined

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 - 고객 인사이트 허브 (블루/시안 계열) */}
      <div className="relative bg-gradient-to-r from-sky-500 to-cyan-500 dark:from-sky-600 dark:to-cyan-600 rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden shadow-lg dark:shadow-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 dark:bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg dark:shadow-none">
            <Icon icon={Star} size="xl" className="text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">리뷰 분석</h1>
            <p className="text-sky-100 dark:text-sky-200/80 text-xs lg:text-sm font-medium">NPS 및 고객 만족도 분석</p>
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
                  ? 'bg-sky-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 핵심 요약 배너 */}
      {nps && (
        <div className="mb-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              분석 기간: <strong className="text-slate-800 dark:text-slate-200">{format(dateRange.from, 'yyyy.MM.dd')} ~ {format(dateRange.to, 'yyyy.MM.dd')}</strong> ({selectedDays}일)
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              총 리뷰: <strong className="text-idus-600 dark:text-idus-400">{nps.totalReviews}건</strong>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              평균 평점: <strong className="text-amber-600 dark:text-amber-400">{nps.avgRating}점</strong>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              NPS: <strong className="text-emerald-600 dark:text-emerald-400">{nps.score}점</strong>
            </span>
            {comparison && (
              <span className={`flex items-center gap-1 ${comparison.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                <Icon icon={comparison.change >= 0 ? ArrowUpRight : ArrowDownRight} size="sm" />
                {comparison.change >= 0 ? '+' : ''}{comparison.change}점 vs 전기간
              </span>
            )}
          </div>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'overview', label: 'NPS 개요', icon: BarChart3 },
            { id: 'distribution', label: '평점 분포', icon: PieChart },
            { id: 'trend', label: '트렌드', icon: TrendingUp },
            { id: 'comparison', label: '비교 분석', icon: Globe },
            { id: 'insights', label: '인사이트', icon: Lightbulb },
            { id: 'list', label: '리뷰 목록', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon icon={tab.icon} size="sm" />
              {tab.label}
            </button>
          ))}
        </div>
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

            {/* 리뷰 내용 및 이미지 분석 */}
            {contentAnalysis && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon icon={MessageSquare} size="md" className="text-blue-500" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">리뷰 내용 분석</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">평균 리뷰 길이</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {contentAnalysis.contentAnalysis?.avgReviewLength || 0}자
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">상세 리뷰 (100자 이상)</span>
                      <span className="font-semibold text-emerald-600">
                        {contentAnalysis.contentAnalysis?.detailedReviews || 0}건 ({contentAnalysis.contentAnalysis?.detailedReviewRate || 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(parseFloat(contentAnalysis.contentAnalysis?.detailedReviewRate || '0'), 100)}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm pt-2">
                      <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-slate-500">짧음 (&lt;50자)</p>
                        <p className="font-semibold">{contentAnalysis.contentAnalysis?.lengthDistribution?.short || 0}건</p>
                      </div>
                      <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-slate-500">보통 (50-99자)</p>
                        <p className="font-semibold">{contentAnalysis.contentAnalysis?.lengthDistribution?.medium || 0}건</p>
                      </div>
                      <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-slate-500">상세 (100자+)</p>
                        <p className="font-semibold">{contentAnalysis.contentAnalysis?.lengthDistribution?.long || 0}건</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon icon={Award} size="md" className="text-violet-500" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">이미지 포함 리뷰 분석</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">이미지 포함 리뷰</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {contentAnalysis.imageAnalysis?.totalWithImages || 0}건 ({contentAnalysis.imageAnalysis?.imageRate || 0}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">총 이미지 수</span>
                      <span className="font-semibold text-violet-600">
                        {contentAnalysis.imageAnalysis?.totalImages || 0}개
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">평균 이미지 수</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {contentAnalysis.imageAnalysis?.avgImageCount || 0}개/리뷰
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-violet-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(parseFloat(contentAnalysis.imageAnalysis?.imageRate || '0'), 100)}%` }}
                      />
                    </div>
                    {contentAnalysis.imageAnalysis?.distribution && contentAnalysis.imageAnalysis.distribution.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs text-slate-500 mb-2">이미지 개수별 분포</p>
                        <div className="space-y-1">
                          {contentAnalysis.imageAnalysis.distribution.slice(0, 5).map((dist: any) => (
                            <div key={dist.imageCount} className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">{dist.imageCount}개</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-100">{dist.reviewCount}건</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

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
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon={BarChart3} size="md" className="text-idus-500" />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">평점 분포 (10점 만점)</h3>
                </div>
                {distribution && (
                  <div className="h-80">
                    <Bar
                      data={{
                        labels: ['1점', '2점', '3점', '4점', '5점', '6점', '7점', '8점', '9점', '10점'],
                        datasets: [{
                          label: '리뷰 수',
                          data: distribution.map((d: any) => d.count),
                          backgroundColor: distribution.map((d: any) => {
                            const rating = d.rating
                            if (rating >= 9) return '#10B981' // Promoters: 초록
                            if (rating >= 7) return '#94A3B8' // Passives: 회색
                            return '#EF4444' // Detractors: 빨강
                          }),
                          borderRadius: 8,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context: any) => {
                                const rating = context.label.replace('점', '')
                                const count = context.parsed.y
                                const total = distribution.reduce((sum: number, d: any) => sum + d.count, 0)
                                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
                                return `${rating}점: ${count}건 (${pct}%)`
                              }
                            }
                          }
                        },
                        scales: {
                          y: { beginAtZero: true, title: { display: true, text: '리뷰 수' } },
                          x: { title: { display: true, text: '평점' } }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon={PieChart} size="md" className="text-violet-500" />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">비율 분포</h3>
                </div>
                {distribution && (
                  <>
                    <div className="h-64 mb-4">
                      <Doughnut
                        data={{
                          labels: distribution.map((d: any) => `${d.rating}점`),
                          datasets: [{
                            data: distribution.map((d: any) => d.count),
                            backgroundColor: distribution.map((d: any) => {
                              const rating = d.rating
                              if (rating >= 9) return '#10B981'
                              if (rating >= 7) return '#94A3B8'
                              return '#EF4444'
                            }),
                            borderWidth: 0,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } }
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {distribution.map((d: any) => {
                        const rating = d.rating
                        const bgColor = rating >= 9 ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                                       rating >= 7 ? 'bg-slate-50 dark:bg-slate-800/50' :
                                       'bg-red-50 dark:bg-red-900/20'
                        return (
                          <div key={d.rating} className={`flex items-center justify-between text-sm p-2 rounded-lg ${bgColor}`}>
                            <span className="flex items-center gap-2">
                              <span className="font-medium text-slate-800 dark:text-slate-100">{d.rating}점</span>
                              {rating >= 9 && <span className="text-xs text-emerald-600">(Promoter)</span>}
                              {rating >= 7 && rating < 9 && <span className="text-xs text-slate-500">(Passive)</span>}
                              {rating < 7 && <span className="text-xs text-red-600">(Detractor)</span>}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-600 dark:text-slate-400">{d.count}건</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-100">{d.percentage}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* NPS 분류 요약 */}
            {nps && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">NPS 분류 요약</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon={ThumbsUp} size="md" className="text-emerald-500" />
                      <span className="font-semibold text-emerald-800 dark:text-emerald-200">Promoters (9-10점)</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{nps.breakdown.promoters.count}건</p>
                    <p className="text-sm text-emerald-600">{nps.breakdown.promoters.percentage}%</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon={Minus} size="md" className="text-slate-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Passives (7-8점)</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-600">{nps.breakdown.passives.count}건</p>
                    <p className="text-sm text-slate-600">{nps.breakdown.passives.percentage}%</p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon={ThumbsDown} size="md" className="text-red-500" />
                      <span className="font-semibold text-red-800 dark:text-red-200">Detractors (1-6점)</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{nps.breakdown.detractors.count}건</p>
                    <p className="text-sm text-red-600">{nps.breakdown.detractors.percentage}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 트렌드 탭 */}
        {activeTab === 'trend' && (
          <div className="space-y-6">
            {trendData?.data?.trend && trendData.data.trend.length > 0 ? (
              <>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon icon={TrendingUp} size="md" className="text-emerald-500" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">월별 리뷰 수 & 평균 평점 트렌드</h3>
                  </div>
                  <div className="h-80">
                    <Chart
                      type="bar"
                      data={{
                        labels: trendData.data.trend.map((d: any) => d.period),
                        datasets: [
                          {
                            type: 'bar' as const,
                            label: '리뷰 수',
                            data: trendData.data.trend.map((d: any) => d.totalReviews),
                            backgroundColor: 'rgba(247, 140, 58, 0.6)',
                            borderRadius: 4,
                            yAxisID: 'y',
                          },
                          {
                            type: 'line' as const,
                            label: '평균 평점',
                            data: trendData.data.trend.map((d: any) => parseFloat(d.avgRating) || 0),
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
                            title: { display: true, text: '리뷰 수' }
                          },
                          y1: {
                            type: 'linear',
                            position: 'right',
                            beginAtZero: true,
                            max: 10,
                            title: { display: true, text: '평균 평점 (10점 만점)' },
                            grid: { drawOnChartArea: false }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon icon={BarChart3} size="md" className="text-idus-500" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">월별 NPS 트렌드</h3>
                  </div>
                  <div className="h-80">
                    <Bar
                      data={{
                        labels: trendData.data.trend.map((d: any) => d.period),
                        datasets: [{
                          label: 'NPS',
                          data: trendData.data.trend.map((d: any) => d.npsScore),
                          backgroundColor: trendData.data.trend.map((d: any) => {
                            const score = d.npsScore
                            if (score >= 50) return '#10B981'
                            if (score >= 0) return '#F59E0B'
                            return '#EF4444'
                          }),
                          borderRadius: 8,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            min: -100,
                            title: { display: true, text: 'NPS 점수' }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* 월별 상세 데이터 테이블 */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">월별 상세 데이터</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">월</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">리뷰 수</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">평균 평점</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">NPS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trendData.data.trend.map((month: any, idx: number) => (
                          <tr key={month.period} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                            <td className="py-3 px-4 text-sm font-medium text-slate-800 dark:text-slate-100">{month.period}</td>
                            <td className="py-3 px-4 text-sm text-right text-slate-600 dark:text-slate-400">{month.totalReviews.toLocaleString()}건</td>
                            <td className="py-3 px-4 text-sm text-right">
                              <span className="flex items-center justify-end gap-1">
                                <Icon icon={Star} size="xs" className="text-amber-400" />
                                {parseFloat(month.avgRating).toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-right">
                              <span className={`font-semibold ${
                                month.npsScore >= 50 ? 'text-emerald-600' :
                                month.npsScore >= 0 ? 'text-amber-600' :
                                'text-red-500'
                              }`}>
                                {month.npsScore}점
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="text-center py-12">
                  <Icon icon={TrendingUp} size="xl" className="mx-auto mb-4 opacity-50 text-slate-400" />
                  <p className="text-sm text-slate-500">트렌드 데이터가 없습니다.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 비교 분석 탭 */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
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

            {/* 상품별 분석 */}
            {byProductData?.data?.byProduct && byProductData.data.byProduct.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon={Award} size="md" className="text-violet-500" />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">TOP 상품 (리뷰 기준)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">순위</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">상품명</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">리뷰 수</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">평균 평점</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">NPS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byProductData.data.byProduct.slice(0, 10).map((product: any, idx: number) => (
                        <tr key={product.productId} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <td className="py-3 px-4">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              idx === 0 ? 'bg-amber-100 text-amber-600' :
                              idx === 1 ? 'bg-slate-100 text-slate-600' :
                              idx === 2 ? 'bg-orange-100 text-orange-600' :
                              'bg-slate-50 text-slate-500'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-800 dark:text-slate-100 truncate max-w-xs">
                            {product.productName || `상품 ${product.productId}`}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-slate-600 dark:text-slate-400">{product.reviewCount}건</td>
                          <td className="py-3 px-4 text-sm text-right">
                            <span className="flex items-center justify-end gap-1">
                              <Icon icon={Star} size="xs" className="text-amber-400" />
                              {product.avgRating}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-right">
                            <span className={`font-semibold ${
                              product.npsScore >= 50 ? 'text-emerald-600' :
                              product.npsScore >= 0 ? 'text-amber-600' :
                              'text-red-500'
                            }`}>
                              {product.npsScore}점
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
          </div>
        )}

        {/* 리뷰 목록 탭 (기존 reviews 페이지 기능 통합) */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            {/* 필터 영역 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-4">
                {/* 검색 */}
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="리뷰 내용, 작가명, 상품명 검색..."
                    value={listSearch}
                    onChange={(e) => { setListSearch(e.target.value); setListPage(1); }}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                
                {/* 국가 필터 */}
                <select
                  value={listCountry}
                  onChange={(e) => { setListCountry(e.target.value); setListPage(1); }}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800"
                >
                  <option value="">전체 국가</option>
                  <option value="JP">🇯🇵 일본</option>
                  <option value="US">🇺🇸 미국</option>
                  <option value="SG">🇸🇬 싱가포르</option>
                  <option value="HK">🇭🇰 홍콩</option>
                  <option value="AU">🇦🇺 호주</option>
                  <option value="GB">🇬🇧 영국</option>
                  <option value="CA">🇨🇦 캐나다</option>
                  <option value="FR">🇫🇷 프랑스</option>
                </select>

                {/* 정렬 */}
                <select
                  value={listSort}
                  onChange={(e) => { setListSort(e.target.value as any); setListPage(1); }}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800"
                >
                  <option value="latest">최신순</option>
                  <option value="rating">평점순</option>
                  <option value="popular">인기순</option>
                </select>

                {/* 이미지 필터 */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showImageOnly}
                    onChange={(e) => { setShowImageOnly(e.target.checked); setListPage(1); }}
                    className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">이미지 리뷰만</span>
                </label>
              </div>
            </div>

            {/* 리뷰 목록 */}
            {galleryLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500">리뷰를 불러오는 중...</p>
              </div>
            ) : galleryData?.data?.reviews?.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {galleryData.data.reviews.map((review: any) => (
                    <ReviewListCard key={review.id} review={review} />
                  ))}
                </div>

                {/* 페이지네이션 */}
                {galleryData.data.pagination && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setListPage(p => Math.max(1, p - 1))}
                      disabled={listPage === 1}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      이전
                    </button>
                    <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">
                      {listPage} / {galleryData.data.pagination.totalPages || 1}
                    </span>
                    <button
                      onClick={() => setListPage(p => Math.min(galleryData.data.pagination.totalPages || 1, p + 1))}
                      disabled={listPage >= (galleryData.data.pagination.totalPages || 1)}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Icon icon={MessageSquare} size="xl" className="mx-auto mb-4 opacity-50" />
                <p>조건에 맞는 리뷰가 없습니다.</p>
              </div>
            )}
          </div>
        )}
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

// 리뷰 목록 카드 컴포넌트 (기존 reviews 페이지 기능 통합)
function ReviewListCard({ review }: { review: any }) {
  const countryEmoji: Record<string, string> = {
    JP: '🇯🇵', US: '🇺🇸', SG: '🇸🇬', HK: '🇭🇰', AU: '🇦🇺',
    GB: '🇬🇧', CA: '🇨🇦', FR: '🇫🇷', NL: '🇳🇱', PL: '🇵🇱',
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (rating >= 7) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* 이미지 (있는 경우) */}
      {review.imageUrl && (
        <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img 
            src={review.imageUrl} 
            alt="" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* 컨텐츠 */}
      <div className="p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{countryEmoji[review.country] || '🌐'}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getRatingColor(review.rating)}`}>
              ★ {review.rating}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {review.reviewDate ? format(new Date(review.reviewDate), 'yyyy.MM.dd') : ''}
          </span>
        </div>

        {/* 리뷰 내용 */}
        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 mb-3">
          {review.contents || '리뷰 내용 없음'}
        </p>

        {/* 상품/작가 정보 */}
        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
          {review.productName && (
            <p className="truncate">📦 {review.productName}</p>
          )}
          {review.artistName && (
            <p className="truncate">🎨 {review.artistName}</p>
          )}
        </div>
      </div>
    </div>
  )
}

