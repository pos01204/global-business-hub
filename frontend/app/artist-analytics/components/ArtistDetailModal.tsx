'use client'

import { useQuery } from '@tanstack/react-query'
import { artistAnalyticsApi } from '@/lib/api'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

interface ArtistDetailModalProps {
  artistName: string
  dateRange: string
  onClose: () => void
}

export default function ArtistDetailModal({ artistName, dateRange, onClose }: ArtistDetailModalProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['artist-detail', artistName, dateRange],
    queryFn: () => artistAnalyticsApi.getDetail(artistName, { dateRange }),
  })

  const formatCurrency = (value: number) => {
    if (value >= 100000000) return `₩${(value / 100000000).toFixed(1)}억`
    if (value >= 10000) return `₩${(value / 10000).toFixed(0)}만`
    return `₩${value.toLocaleString()}`
  }

  const getSegmentBadge = (seg: string) => {
    const styles: Record<string, string> = {
      vip: 'bg-emerald-100 text-emerald-700',
      high: 'bg-blue-100 text-blue-700',
      medium: 'bg-violet-100 text-violet-700',
      low: 'bg-amber-100 text-amber-700',
      starter: 'bg-gray-100 text-gray-700',
    }
    const labels: Record<string, string> = {
      vip: '🏆 VIP',
      high: '🔥 High',
      medium: '📊 Medium',
      low: '📉 Low',
      starter: '🌱 Starter',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[seg] || styles.starter}`}>
        {labels[seg] || seg}
      </span>
    )
  }

  const getHealthBadge = (status: string) => {
    const styles: Record<string, string> = {
      healthy: 'bg-green-100 text-green-700',
      caution: 'bg-yellow-100 text-yellow-700',
      warning: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      healthy: '🟢 건강',
      caution: '🟡 주의',
      warning: '🟠 경고',
      critical: '🔴 위험',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👨‍🎨</span>
            <h2 className="text-xl font-bold">{artistName} 상세 분석</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          </div>
        ) : error || !data?.success ? (
          <div className="p-6 text-center text-red-600">데이터를 불러오는 중 오류가 발생했습니다.</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* 기본 정보 & 상태 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700">기본 정보</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">작가 ID</span>
                    <span>{data.artistInfo.artistId || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">이메일</span>
                    <span>{data.artistInfo.email || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">등록 작품</span>
                    <span>
                      KR {data.artistInfo.registeredProducts.kr}개 / Global{' '}
                      {data.artistInfo.registeredProducts.global}개
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">첫 판매일</span>
                    <span>{data.artistInfo.firstSaleDate || '-'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700">상태</h3>
                <div className="flex flex-wrap gap-2">
                  {getSegmentBadge(data.artistInfo.segment)}
                  {getHealthBadge(data.artistInfo.healthStatus)}
                </div>
                {data.artistInfo.growthRate !== 0 && (
                  <p className="text-sm">
                    성장률:{' '}
                    <span className={data.artistInfo.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {data.artistInfo.growthRate >= 0 ? '+' : ''}
                      {data.artistInfo.growthRate}%
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* 성과 요약 KPI */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">성과 요약 (선택 기간)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-violet-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-violet-600">
                    {formatCurrency(data.performance.totalGmv)}
                  </p>
                  <p className="text-sm text-gray-600">총 매출</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{data.performance.orderCount}건</p>
                  <p className="text-sm text-gray-600">주문 건수</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{data.performance.productCount}개</p>
                  <p className="text-sm text-gray-600">판매 작품</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {data.performance.avgRating ? `⭐ ${data.performance.avgRating}/10` : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">평균 평점 ({data.performance.reviewCount}건)</p>
                </div>
              </div>
            </div>

            {/* 차트 영역 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 국가별 매출 분포 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-700 mb-3">국가별 매출 분포</h3>
                {data.byCountry.length > 0 ? (
                  <>
                    <div className="h-40">
                      <Doughnut
                        data={{
                          labels: data.byCountry.map((c: any) => c.country),
                          datasets: [
                            {
                              data: data.byCountry.map((c: any) => c.gmv),
                              backgroundColor: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
                              borderWidth: 0,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } },
                        }}
                      />
                    </div>
                    <div className="mt-3 space-y-1 text-sm">
                      {data.byCountry.slice(0, 3).map((c: any) => (
                        <div key={c.country} className="flex justify-between">
                          <span>{c.country}</span>
                          <span className="text-gray-500">
                            {formatCurrency(c.gmv)} ({c.share}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-8">데이터 없음</p>
                )}
              </div>

              {/* 월별 매출 추이 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-700 mb-3">월별 매출 추이</h3>
                {data.monthlyTrend.length > 0 ? (
                  <div className="h-48">
                    <Line
                      data={{
                        labels: data.monthlyTrend.map((m: any) => m.month),
                        datasets: [
                          {
                            label: '매출',
                            data: data.monthlyTrend.map((m: any) => m.gmv),
                            borderColor: '#8B5CF6',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            fill: true,
                            tension: 0.4,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } },
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">데이터 없음</p>
                )}
              </div>
            </div>

            {/* Top 판매 작품 */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Top 판매 작품</h3>
              {data.topProducts.length > 0 ? (
                <div className="space-y-2">
                  {data.topProducts.map((product: any, idx: number) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {idx + 1}
                        </span>
                        <span>{product.productName}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(product.gmv)}</p>
                        <p className="text-xs text-gray-500">{product.quantity}개 판매</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">판매 작품이 없습니다.</p>
              )}
            </div>

            {/* 최근 리뷰 */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">최근 리뷰</h3>
              {data.recentReviews.length > 0 ? (
                <div className="space-y-2">
                  {data.recentReviews.map((review: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-amber-500">{'⭐'.repeat(Math.round(review.rating))}</span>
                        <span className="text-xs text-gray-400">
                          {review.country} · {review.date}
                        </span>
                      </div>
                      {review.text && <p className="text-sm text-gray-600 italic">"{review.text}"</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">리뷰가 없습니다.</p>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-center gap-4 pt-4 border-t">
              {data.artistInfo.email && (
                <a
                  href={`mailto:${data.artistInfo.email}`}
                  className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                  📧 이메일 발송
                </a>
              )}
              <button onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
