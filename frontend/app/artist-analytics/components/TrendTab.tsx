'use client'

import { useQuery } from '@tanstack/react-query'
import { artistAnalyticsApi } from '@/lib/api'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

export default function TrendTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['artist-analytics-trend'],
    queryFn: () => artistAnalyticsApi.getTrend({ months: 6 }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (error || !data?.success) {
    return <div className="card bg-red-50 p-6 text-red-600">데이터 로드 실패</div>
  }

  const { monthly, newArtists, churnedArtists, growthDistribution } = data

  // 월별 활성 작가 추이 차트
  const trendChartData = {
    labels: monthly.map((m: any) => m.month),
    datasets: [
      {
        label: '활성 작가',
        data: monthly.map((m: any) => m.activeArtists),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  // 신규/이탈 작가 차트
  const newChurnChartData = {
    labels: monthly.map((m: any) => m.month),
    datasets: [
      {
        label: '신규 작가',
        data: monthly.map((m: any) => m.newArtists),
        backgroundColor: '#10B981',
      },
      {
        label: '이탈 작가',
        data: monthly.map((m: any) => m.churnedArtists),
        backgroundColor: '#EF4444',
      },
    ],
  }

  const formatCurrency = (value: number) => {
    if (value >= 10000) return `₩${(value / 10000).toFixed(0)}만`
    return `₩${value.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      {/* 월별 추이 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">📈 월별 활성 작가 추이</h3>
          <div className="h-64">
            <Line
              data={trendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, title: { display: true, text: '작가 수' } },
                },
              }}
            />
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🔄 신규/이탈 작가 현황</h3>
          <div className="h-64">
            <Bar
              data={newChurnChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>
      </div>

      {/* 신규/이탈 작가 리스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 신규 작가 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🆕 신규 진입 작가 (이번 달)</h3>
          {newArtists.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {newArtists.map((artist: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <div>
                    <span className="font-medium">{artist.artistName}</span>
                    <span className="text-xs text-gray-500 ml-2">첫 판매: {artist.firstSaleDate}</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">{formatCurrency(artist.gmv)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">이번 달 신규 작가가 없습니다.</p>
          )}
          <p className="text-sm text-gray-500 mt-3">총 {newArtists.length}명 신규 진입</p>
        </div>

        {/* 이탈 위험 작가 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">⚠️ 이탈 작가 (3개월 미판매)</h3>
          {churnedArtists.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {churnedArtists.map((artist: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <div>
                    <span className="font-medium">{artist.artistName}</span>
                    <span className="text-xs text-gray-500 ml-2">마지막: {artist.lastSaleDate}</span>
                  </div>
                  <span className="text-sm text-gray-600">{formatCurrency(artist.totalGmv)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">이탈 위험 작가가 없습니다.</p>
          )}
          <p className="text-sm text-gray-500 mt-3">총 {churnedArtists.length}명 이탈 위험</p>
        </div>
      </div>

      {/* 성장률 분포 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">📊 작가별 성장률 분포 (전월 대비)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <p className="text-2xl font-bold text-emerald-600">{growthDistribution.rapid.count}명</p>
            <p className="text-sm text-gray-600">🚀 급성장 (+50%↑)</p>
            <p className="text-xs text-gray-400">{growthDistribution.rapid.rate}%</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-2xl font-bold text-blue-600">{growthDistribution.growing.count}명</p>
            <p className="text-sm text-gray-600">📈 성장 (+10~50%)</p>
            <p className="text-xs text-gray-400">{growthDistribution.growing.rate}%</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-600">{growthDistribution.stable.count}명</p>
            <p className="text-sm text-gray-600">➡️ 유지 (±10%)</p>
            <p className="text-xs text-gray-400">{growthDistribution.stable.rate}%</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <p className="text-2xl font-bold text-amber-600">{growthDistribution.declining.count}명</p>
            <p className="text-sm text-gray-600">📉 하락 (-10~50%)</p>
            <p className="text-xs text-gray-400">{growthDistribution.declining.rate}%</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-xl">
            <p className="text-2xl font-bold text-red-600">{growthDistribution.critical.count}명</p>
            <p className="text-sm text-gray-600">🔻 급하락 (-50%↓)</p>
            <p className="text-xs text-gray-400">{growthDistribution.critical.rate}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
