'use client'

import { useQuery } from '@tanstack/react-query'
import { artistAnalyticsApi } from '@/lib/api'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

interface OverviewTabProps {
  dateRange: string
  countryFilter: string
}

export default function OverviewTab({ dateRange, countryFilter }: OverviewTabProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['artist-analytics-overview', dateRange, countryFilter],
    queryFn: () => artistAnalyticsApi.getOverview({ dateRange, countryFilter }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-500">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !data?.success) {
    return (
      <div className="card bg-red-50 border-red-200 p-6">
        <p className="text-red-600">데이터를 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-sm text-gray-500 mt-2">
          {error?.message || data?.error || '알 수 없는 오류'}
        </p>
      </div>
    )
  }

  const { summary, distribution } = data
  
  // 데이터가 없는 경우 기본값 설정
  if (!summary || !distribution) {
    return (
      <div className="card bg-yellow-50 border-yellow-200 p-6">
        <p className="text-yellow-600">데이터가 없습니다. 시트 연결 상태를 확인해주세요.</p>
      </div>
    )
  }

  // 매출 구간별 분포 차트 데이터
  const segmentChartData = {
    labels: ['VIP (₩5M+)', 'High (₩1M~5M)', 'Medium (₩500K~1M)', 'Low (₩100K~500K)', 'Starter (<₩100K)'],
    datasets: [
      {
        data: [
          distribution.byRevenue.vip.count,
          distribution.byRevenue.high.count,
          distribution.byRevenue.medium.count,
          distribution.byRevenue.low.count,
          distribution.byRevenue.starter.count,
        ],
        backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#6B7280'],
        borderWidth: 0,
      },
    ],
  }

  // 국가별 매출 차트 데이터
  const countryChartData = {
    labels: distribution.byCountry.map((c: any) => c.country),
    datasets: [
      {
        label: '매출 (백만원)',
        data: distribution.byCountry.map((c: any) => Math.round(c.gmv / 1000000)),
        backgroundColor: '#8B5CF6',
        borderRadius: 6,
      },
    ],
  }

  const formatCurrency = (value: number) => {
    if (value >= 100000000) return `₩${(value / 100000000).toFixed(1)}억`
    if (value >= 10000) return `₩${(value / 10000).toFixed(0)}만`
    return `₩${value.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      {/* KPI 카드 - 1행 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📊</span>
            <span className="text-sm text-gray-500">전체 작가</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalArtists.toLocaleString()}명</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">✅</span>
            <span className="text-sm text-gray-500">활성 작가</span>
          </div>
          <p className="text-2xl font-bold">{summary.activeArtists.toLocaleString()}명</p>
          <p className="text-xs text-gray-400 mt-1">{summary.activeRate}%</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📦</span>
            <span className="text-sm text-gray-500">등록 작품</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalProducts.toLocaleString()}개</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💰</span>
            <span className="text-sm text-gray-500">작가당 매출</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(summary.avgGmvPerArtist)}</p>
        </div>
      </div>

      {/* KPI 카드 - 2행 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🛒</span>
            <span className="text-sm text-gray-500">판매 작품</span>
          </div>
          <p className="text-2xl font-bold">{summary.soldProducts.toLocaleString()}개</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📈</span>
            <span className="text-sm text-gray-500">판매율</span>
          </div>
          <p className="text-2xl font-bold">{summary.productSellRate}%</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⭐</span>
            <span className="text-sm text-gray-500">평균 평점</span>
          </div>
          <p className="text-2xl font-bold">{summary.avgRating || 'N/A'}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📝</span>
            <span className="text-sm text-gray-500">리뷰 수</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalReviews.toLocaleString()}건</p>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 매출 구간별 분포 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">매출 구간별 작가 분포</h3>
          <div className="h-64">
            <Doughnut
              data={segmentChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } },
                },
              }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>VIP: {distribution.byRevenue.vip.count}명 ({distribution.byRevenue.vip.rate.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span>High: {distribution.byRevenue.high.count}명 ({distribution.byRevenue.high.rate.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-violet-500"></span>
              <span>Medium: {distribution.byRevenue.medium.count}명 ({distribution.byRevenue.medium.rate.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span>Low: {distribution.byRevenue.low.count}명 ({distribution.byRevenue.low.rate.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* 국가별 매출 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">국가별 매출 기여도</h3>
          <div className="h-64">
            <Bar
              data={countryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: {
                  x: { beginAtZero: true, title: { display: true, text: '매출 (백만원)' } },
                },
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {distribution.byCountry.slice(0, 5).map((c: any) => (
              <div key={c.country} className="flex items-center justify-between text-sm">
                <span>{c.country}</span>
                <span className="text-gray-500">
                  {formatCurrency(c.gmv)} ({c.share.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
