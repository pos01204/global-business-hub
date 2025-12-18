'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { artistAnalyticsApi } from '@/lib/api'
import { EnhancedLoadingPage, DataTable, AnimatedEmptyState } from '@/components/ui'
import ArtistDetailModal from './ArtistDetailModal'
// ✅ Phase 2: 고도화 컴포넌트
import { showToast } from '@/lib/toast'
import { hoverEffects } from '@/lib/hover-effects'

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
  const [searchQuery, setSearchQuery] = useState('')

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
    return <EnhancedLoadingPage message="작가 성과 데이터를 불러오는 중..." variant="default" size="md" />
  }

  if (error || !data?.success) {
    return <div className="card bg-red-50 p-6 text-red-600">데이터 로드 실패</div>
  }

  return (
    <div className="space-y-4">
      {/* 필터 및 액션 */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* 작가 검색 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">🔍</span>
              <input
                type="text"
                placeholder="작가명 검색..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="px-3 py-1.5 border rounded-lg text-sm w-48 focus:ring-2 focus:ring-violet-500 focus:outline-none"
              />
            </div>
            {/* 세그먼트 필터 */}
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

      {/* Phase 2: DataTable 적용 */}
      <div className="card">
        {data.artists && data.artists.length > 0 ? (
          <DataTable
            data={data.artists.filter((artist: any) => 
              !searchQuery || artist.artistName.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            columns={[
              {
                accessorKey: 'rank',
                header: '순위',
                cell: ({ row }) => <span className="font-medium">{row.original.rank}</span>,
              },
              {
                accessorKey: 'artistName',
                header: '작가명',
                cell: ({ row }) => (
                  <button
                    onClick={() => setSelectedArtist(row.original.artistName)}
                    className="text-violet-600 hover:underline font-medium"
                  >
                    {row.original.artistName}
                  </button>
                ),
              },
              {
                accessorKey: 'totalGmv',
                header: '매출',
                cell: ({ row }) => (
                  <span className="font-semibold">{formatCurrency(row.original.totalGmv)}</span>
                ),
              },
              {
                accessorKey: 'orderCount',
                header: '주문수',
                cell: ({ row }) => <span>{row.original.orderCount}건</span>,
              },
              {
                accessorKey: 'productCount',
                header: '판매작품',
                cell: ({ row }) => <span>{row.original.productCount}개</span>,
              },
              {
                accessorKey: 'aov',
                header: 'AOV',
                cell: ({ row }) => <span>{formatCurrency(row.original.aov)}</span>,
              },
              {
                accessorKey: 'growthRate',
                header: '성장률',
                cell: ({ row }) => (
                  <span className={row.original.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {row.original.growthRate >= 0 ? '+' : ''}{row.original.growthRate}%
                  </span>
                ),
              },
              {
                accessorKey: 'segment',
                header: '세그먼트',
                cell: ({ row }) => getSegmentBadge(row.original.segment),
              },
              {
                accessorKey: 'healthStatus',
                header: '건강도',
                cell: ({ row }) => getHealthBadge(row.original.healthStatus),
              },
              {
                id: 'actions',
                header: '상세',
                cell: ({ row }) => (
                  <button
                    onClick={() => setSelectedArtist(row.original.artistName)}
                    className="text-gray-400 hover:text-violet-600 transition-colors"
                  >
                    👁️
                  </button>
                ),
              },
            ]}
            searchPlaceholder="작가 검색..."
            pageSize={20}
          />
        ) : (
          <AnimatedEmptyState
            type="data"
            title="작가 데이터가 없습니다"
            description="선택한 기간 및 필터 조건에 해당하는 작가 데이터가 없습니다."
          />
        )}
      </div>

      {/* 페이지네이션 (DataTable에 내장되어 있으므로 기존 페이지네이션 제거) */}
      {data.pagination && data.artists.length > 0 && (
        <div className="flex items-center justify-end">
          <p className="text-sm text-gray-500">
            총 {data.pagination.total}명
          </p>
        </div>
      )}

      {/* 기존 페이지네이션 (서버 사이드용으로 유지) */}
      {data.pagination && data.pagination.totalPages > 1 && (
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
