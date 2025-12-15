'use client'

import { useQuery } from '@tanstack/react-query'
import { artistAnalyticsApi } from '@/lib/api'
import { EnhancedLoadingPage } from '@/components/ui'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, ArcElement, Title, Tooltip, Legend)

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
    return <EnhancedLoadingPage message="작가 분석 데이터를 불러오는 중..." variant="default" size="md" />
  }

  if (error || !data?.success) {
    return (
      <div className="card bg-red-50 border-red-200 p-6">
        <p className="text-red-600">데이터를 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-sm text-gray-500 mt-2">{error?.message || data?.error || '알 수 없는 오류'}</p>
      </div>
    )
  }

  const { summary, distribution, concentration } = data

  if (!summary || !distribution) {
    return (
      <div className="card bg-yellow-50 border-yellow-200 p-6">
        <p className="text-yellow-600">데이터가 없습니다. 시트 연결 상태를 확인해주세요.</p>
      </div>
    )
  }

  // 매출 구간별 분포 차트 데이터
  const segmentChartData = {
    labels: ['VIP', 'High', 'Medium', 'Low', 'Starter'],
    datasets: [
      {
        data: [
          distribution.byRevenue.vip.count,
          distribution.byRevenue.high.count,
          distribution.byRevenue.medium.count,
          distribution.byRevenue.low.count,
          distribution.byRevenue.starter.count,
        ],
        backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#9CA3AF'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }

  const formatCurrency = (value: number) => {
    if (value >= 100000000) return `₩${(value / 100000000).toFixed(1)}억`
    if (value >= 10000) return `₩${(value / 10000).toFixed(0)}만`
    return `₩${value.toLocaleString()}`
  }

  const segmentData = [
    { key: 'vip', label: 'VIP', range: '₩5M+', color: 'emerald', data: distribution.byRevenue.vip },
    { key: 'high', label: 'High', range: '₩1M~5M', color: 'blue', data: distribution.byRevenue.high },
    { key: 'medium', label: 'Medium', range: '₩500K~1M', color: 'violet', data: distribution.byRevenue.medium },
    { key: 'low', label: 'Low', range: '₩100K~500K', color: 'amber', data: distribution.byRevenue.low },
    { key: 'starter', label: 'Starter', range: '<₩100K', color: 'gray', data: distribution.byRevenue.starter },
  ]

  const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  }

  return (
    <div className="space-y-6">
      {/* 핵심 KPI 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">활성 작가</p>
              <p className="text-3xl font-bold text-emerald-600">{summary.activeArtists.toLocaleString()}<span className="text-lg font-normal text-gray-500">명</span></p>
              <p className="text-xs text-gray-400 mt-1">전체 {summary.totalArtists}명 중 {summary.activeRate}%</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👨‍🎨</span>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">작가당 평균 매출</p>
              <p className="text-3xl font-bold text-violet-600">{formatCurrency(summary.avgGmvPerArtist)}</p>
              <p className="text-xs text-gray-400 mt-1">활성 작가 기준</p>
            </div>
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">작품 판매율</p>
              <p className="text-3xl font-bold text-blue-600">{summary.productSellRate}<span className="text-lg font-normal text-gray-500">%</span></p>
              <p className="text-xs text-gray-400 mt-1">{summary.soldProducts.toLocaleString()} / {summary.totalProducts.toLocaleString()}개</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">평균 평점</p>
              <p className="text-3xl font-bold text-amber-500">
                {summary.avgRating ? (
                  <>{summary.avgRating}<span className="text-lg font-normal text-gray-500">/10</span></>
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">{summary.totalReviews.toLocaleString()}건 리뷰</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </div>
      </div>

      {/* 매출 집중도 분석 */}
      {concentration && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🎯 매출 집중도 분석</h3>
          <p className="text-sm text-gray-500 mb-4">상위 작가들이 전체 매출에서 차지하는 비중을 분석합니다.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-violet-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">Top 1 작가</p>
              <p className="text-2xl font-bold text-violet-600">{concentration.top1.share}%</p>
              <p className="text-xs text-gray-400">{formatCurrency(concentration.top1.gmv)}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">Top 5 작가</p>
              <p className="text-2xl font-bold text-blue-600">{concentration.top5.share}%</p>
              <p className="text-xs text-gray-400">{formatCurrency(concentration.top5.gmv)}</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">Top 10 작가</p>
              <p className="text-2xl font-bold text-emerald-600">{concentration.top10.share}%</p>
              <p className="text-xs text-gray-400">{formatCurrency(concentration.top10.gmv)}</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">Top 20 작가</p>
              <p className="text-2xl font-bold text-amber-600">{concentration.top20.share}%</p>
              <p className="text-xs text-gray-400">{formatCurrency(concentration.top20.gmv)}</p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">지니 계수 (매출 불평등 지표)</span>
              <span className="text-lg font-bold text-gray-700">{concentration.giniCoefficient}</span>
            </div>
            <p className="text-xs text-gray-500">
              {concentration.giniCoefficient >= 0.6 
                ? '⚠️ 매출이 소수 작가에 집중됨 - 상위 작가 이탈 시 리스크 주의' 
                : concentration.giniCoefficient >= 0.4 
                  ? '📊 적정 수준의 매출 집중도 - 핸드메이드 플랫폼 평균 수준' 
                  : '✅ 매출이 고르게 분산됨 - 안정적인 매출 구조'}
            </p>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  concentration.giniCoefficient >= 0.6 ? 'bg-red-500' : 
                  concentration.giniCoefficient >= 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${concentration.giniCoefficient * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 매출 구간별 분포 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-6">📊 매출 구간별 작가 분포</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 차트 */}
          <div className="flex items-center justify-center">
            <div className="w-64 h-64">
              <Doughnut
                data={segmentChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  cutout: '60%',
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.label || ''
                          const value = context.raw as number
                          const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0)
                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
                          return `${label}: ${value}명 (${percentage}%)`
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* 범례 */}
          <div className="space-y-3">
            {segmentData.map((seg) => {
              const colors = colorMap[seg.color]
              return (
                <div key={seg.key} className={`flex items-center justify-between p-4 ${colors.bg} rounded-xl`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-4 h-4 rounded-full ${colors.dot}`}></span>
                    <div>
                      <span className="font-semibold">{seg.label}</span>
                      <span className="text-gray-500 text-sm ml-2">({seg.range})</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${colors.text}`}>{seg.data.count}명</span>
                    <span className="text-gray-500 text-sm ml-2">({seg.data.rate.toFixed(1)}%)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
