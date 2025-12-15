'use client'

import { useQuery } from '@tanstack/react-query'
import { artistAnalyticsApi } from '@/lib/api'
import { EnhancedLoadingPage } from '@/components/ui'

export default function HealthTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['artist-analytics-health'],
    queryFn: () => artistAnalyticsApi.getHealth(),
  })

  if (isLoading) {
    return <EnhancedLoadingPage message="작가 건강도 데이터를 불러오는 중..." variant="default" size="md" />
  }

  if (error || !data?.success) {
    return <div className="card bg-red-50 p-6 text-red-600">데이터 로드 실패</div>
  }

  const { summary, criticalArtists, qualityIssues } = data

  const formatCurrency = (value: number) => {
    if (value >= 10000) return `₩${(value / 10000).toFixed(0)}만`
    return `₩${value.toLocaleString()}`
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      healthy: 'bg-green-100 text-green-700',
      caution: 'bg-yellow-100 text-yellow-700',
      warning: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      healthy: '건강',
      caution: '주의',
      warning: '경고',
      critical: '위험',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* 건강도 요약 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">⚠️ 작가 건강도 진단</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-6 bg-green-50 rounded-xl border-2 border-green-200">
            <div className="text-4xl mb-2">🟢</div>
            <p className="text-3xl font-bold text-green-600">{summary.healthy.count}명</p>
            <p className="text-sm text-gray-600">건강</p>
            <p className="text-xs text-gray-400">{summary.healthy.rate}%</p>
          </div>
          <div className="text-center p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200">
            <div className="text-4xl mb-2">🟡</div>
            <p className="text-3xl font-bold text-yellow-600">{summary.caution.count}명</p>
            <p className="text-sm text-gray-600">주의</p>
            <p className="text-xs text-gray-400">{summary.caution.rate}%</p>
          </div>
          <div className="text-center p-6 bg-orange-50 rounded-xl border-2 border-orange-200">
            <div className="text-4xl mb-2">🟠</div>
            <p className="text-3xl font-bold text-orange-600">{summary.warning.count}명</p>
            <p className="text-sm text-gray-600">경고</p>
            <p className="text-xs text-gray-400">{summary.warning.rate}%</p>
          </div>
          <div className="text-center p-6 bg-red-50 rounded-xl border-2 border-red-200">
            <div className="text-4xl mb-2">🔴</div>
            <p className="text-3xl font-bold text-red-600">{summary.critical.count}명</p>
            <p className="text-sm text-gray-600">위험</p>
            <p className="text-xs text-gray-400">{summary.critical.rate}%</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p><strong>건강도 기준:</strong></p>
          <ul className="mt-1 space-y-1 text-xs">
            <li>🟢 건강: 30일 내 판매 + 평점 4.0 이상</li>
            <li>🟡 주의: 30~60일 미판매 또는 평점 3.5~4.0</li>
            <li>🟠 경고: 60~90일 미판매 또는 평점 3.0~3.5</li>
            <li>🔴 위험: 90일+ 미판매 또는 평점 3.0 미만</li>
          </ul>
        </div>
      </div>

      {/* 이슈 작가 리스트 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">🔴 즉시 조치 필요 작가</h3>
        {criticalArtists.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">작가명</th>
                  <th className="text-center py-2 px-3">상태</th>
                  <th className="text-right py-2 px-3">마지막 판매</th>
                  <th className="text-right py-2 px-3">미판매 일수</th>
                  <th className="text-center py-2 px-3">평균 평점</th>
                  <th className="text-right py-2 px-3">누적 매출</th>
                  <th className="text-left py-2 px-3">이슈</th>
                </tr>
              </thead>
              <tbody>
                {criticalArtists.map((artist: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{artist.artistName}</td>
                    <td className="py-2 px-3 text-center">{getStatusBadge(artist.status)}</td>
                    <td className="py-2 px-3 text-right text-gray-600">{artist.lastSaleDate}</td>
                    <td className="py-2 px-3 text-right">
                      <span className={artist.daysSinceLastSale > 90 ? 'text-red-600 font-medium' : ''}>
                        {artist.daysSinceLastSale}일
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {artist.avgRating ? (
                        <span className={artist.avgRating < 3.5 ? 'text-red-600' : ''}>
                          ⭐{artist.avgRating}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">{formatCurrency(artist.totalGmv)}</td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {artist.issues.map((issue: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                            {issue}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">즉시 조치가 필요한 작가가 없습니다. 👍</p>
        )}
      </div>

      {/* 품질 이슈 모니터링 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">📝 품질 이슈 모니터링 (최근 30일 낮은 평점 리뷰)</h3>
        {qualityIssues.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {qualityIssues.map((issue: any, idx: number) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg border-l-4 border-amber-400">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{issue.artistName}</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-600 text-sm">{issue.productName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600">{'⭐'.repeat(issue.rating)}</span>
                    <span className="text-xs text-gray-400">{issue.reviewDate}</span>
                    {issue.country && (
                      <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">{issue.country}</span>
                    )}
                  </div>
                </div>
                {issue.reviewText && (
                  <p className="text-sm text-gray-600 italic">"{issue.reviewText}"</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">최근 30일 내 낮은 평점 리뷰가 없습니다. 👍</p>
        )}
      </div>
    </div>
  )
}
