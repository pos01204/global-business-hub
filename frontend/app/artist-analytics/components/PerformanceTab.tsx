'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { artistAnalyticsApi } from '@/lib/api'
import ArtistDetailModal from './ArtistDetailModal'

interface PerformanceTabProps {
  dateRange: string
  countryFilter: string
}

export default function PerformanceTab({ dateRange, countryFilter }: PerformanceTabProps) {
  const [segment, setSegment] = useState('all')
  const [sortBy, setSortBy] = useState('gmv')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['artist-analytics-performance', dateRange, countryFilter, segment, sortBy, sortOrder, page],
    queryFn: () =>
      artistAnalyticsApi.getPerformance({
        dateRange,
        country: countryFilter,
        segment,
        sort: sortBy,
        order: sortOrder,
        page,
        limit: 20,
      }),
  })

  const formatCurrency = (value: number) => {
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
      vip: 'VIP',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      starter: 'Starter',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[seg] || styles.starter}`}>
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
    const icons: Record<string, string> = {
      healthy: '🟢',
      caution: '🟡',
      warning: '🟠',
      critical: '🔴',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs ${styles[status] || ''}`}>
        {icons[status] || '⚪'}
      </span>
    )
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const handleExportCSV = () => {
    if (!data?.artists) return
    
    const headers = ['순위', '작가명', '매출', '주문수', '판매작품', 'AOV', '성장률', '평점', '세그먼트']
    const rows = data.artists.map((a: any) => [
      a.rank,
      a.artistName,
      a.totalGmv,
      a.orderCount,
      a.productCount,
      a.aov,
      a.growthRate,
      a.avgRating || 'N/A',
      a.segment,
    ])
    
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `artist_performance_${dateRange}.csv`
    link.click()
  }

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

  return (
    <div className="space-y-4">
      {/* 필터 및 액션 */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">세그먼트:</span>
              <select
                value={segment}
                onChange={(e) => { setSegment(e.target.value); setPage(1); }}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="all">전체</option>
                <option value="vip">VIP</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="starter">Starter</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
          >
            📥 CSV 내보내기
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">순위</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">작가명</th>
              <th
                className="text-right py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-violet-600"
                onClick={() => handleSort('gmv')}
              >
                매출 {sortBy === 'gmv' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th
                className="text-right py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-violet-600"
                onClick={() => handleSort('orders')}
              >
                주문수 {sortBy === 'orders' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">판매작품</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">AOV</th>
              <th
                className="text-right py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-violet-600"
                onClick={() => handleSort('growth')}
              >
                성장률 {sortBy === 'growth' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">세그먼트</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">건강도</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">상세</th>
            </tr>
          </thead>
          <tbody>
            {data.artists.map((artist: any) => (
              <tr key={artist.artistName} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{artist.rank}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => setSelectedArtist(artist.artistName)}
                    className="text-violet-600 hover:underline font-medium"
                  >
                    {artist.artistName}
                  </button>
                </td>
                <td className="py-3 px-4 text-right font-semibold">{formatCurrency(artist.totalGmv)}</td>
                <td className="py-3 px-4 text-right">{artist.orderCount}건</td>
                <td className="py-3 px-4 text-right">{artist.productCount}개</td>
                <td className="py-3 px-4 text-right">{formatCurrency(artist.aov)}</td>
                <td className="py-3 px-4 text-right">
                  <span className={artist.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {artist.growthRate >= 0 ? '+' : ''}{artist.growthRate}%
                  </span>
                </td>
                <td className="py-3 px-4 text-center">{getSegmentBadge(artist.segment)}</td>
                <td className="py-3 px-4 text-center">{getHealthBadge(artist.healthStatus)}</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setSelectedArtist(artist.artistName)}
                    className="text-gray-400 hover:text-violet-600"
                  >
                    👁️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {data.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            총 {data.pagination.total}명 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, data.pagination.total)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50"
            >
              이전
            </button>
            <span className="px-3 py-1 text-sm">
              {page} / {data.pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
              disabled={page === data.pagination.totalPages}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* 작가 상세 모달 */}
      {selectedArtist && (
        <ArtistDetailModal
          artistName={selectedArtist}
          dateRange={dateRange}
          onClose={() => setSelectedArtist(null)}
        />
      )}
    </div>
  )
}
