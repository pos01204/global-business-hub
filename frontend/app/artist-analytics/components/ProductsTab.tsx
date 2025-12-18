'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { artistAnalyticsApi } from '@/lib/api'
import { EnhancedLoadingPage, DataTable, AnimatedEmptyState } from '@/components/ui'
// ✅ Phase 2: 고도화 컴포넌트
import { hoverEffects } from '@/lib/hover-effects'

interface ProductsTabProps {
  dateRange: string
}

export default function ProductsTab({ dateRange }: ProductsTabProps) {
  const [sortBy, setSortBy] = useState('gmv')

  const { data, isLoading, error } = useQuery({
    queryKey: ['artist-analytics-products', dateRange, sortBy],
    queryFn: () => artistAnalyticsApi.getProducts({ dateRange, sort: sortBy, limit: 50 }),
  })

  const formatCurrency = (value: number) => {
    if (value >= 10000) return `₩${(value / 10000).toFixed(0)}만`
    return `₩${value.toLocaleString()}`
  }

  if (isLoading) {
    return <EnhancedLoadingPage message="작품 데이터를 불러오는 중..." variant="default" size="md" />
  }

  if (error || !data?.success) {
    return <div className="card bg-red-50 p-6 text-red-600">데이터 로드 실패</div>
  }

  const { summary, products, priceDistribution } = data

  // DataTable 제네릭 타입: API에서 내려오는 개별 상품 타입
  type TopProduct = (typeof products)[number]

  // 가격대별 분포 데이터
  const priceRanges = [
    { key: 'under30k', label: '~₩3만', data: priceDistribution.under30k, color: 'bg-emerald-500', bgLight: 'bg-emerald-50' },
    { key: '30k_50k', label: '₩3~5만', data: priceDistribution['30k_50k'], color: 'bg-blue-500', bgLight: 'bg-blue-50' },
    { key: '50k_100k', label: '₩5~10만', data: priceDistribution['50k_100k'], color: 'bg-violet-500', bgLight: 'bg-violet-50' },
    { key: '100k_200k', label: '₩10~20만', data: priceDistribution['100k_200k'], color: 'bg-amber-500', bgLight: 'bg-amber-50' },
    { key: 'over200k', label: '₩20만+', data: priceDistribution.over200k, color: 'bg-rose-500', bgLight: 'bg-rose-50' },
  ]
  
  const maxCount = Math.max(...priceRanges.map(r => r.data.count), 1)

  return (
    <div className="space-y-6">
      {/* 요약 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📦</span>
            <span className="text-sm text-gray-500">등록 작품</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalProducts.toLocaleString()}개</p>
        </div>
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
          <p className="text-2xl font-bold">{summary.sellRate}%</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💰</span>
            <span className="text-sm text-gray-500">작품당 매출</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(summary.avgGmvPerProduct)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 가격대별 분포 - 수평 바 차트 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">💵 가격대별 판매 분포</h3>
          <div className="space-y-3">
            {priceRanges.map((range) => (
              <div key={range.key} className={`p-3 rounded-lg ${range.bgLight}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{range.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{range.data.count}개</span>
                    <span className="text-xs text-gray-500 w-10 text-right">{range.data.rate}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${range.color} rounded-full transition-all duration-500`}
                    style={{ width: `${(range.data.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">총 판매 작품</span>
              <span className="font-semibold">{summary.soldProducts}개</span>
            </div>
          </div>
        </div>

        {/* Top 판매 작품 테이블 - Phase 2: DataTable 적용 */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">🏆 Top 판매 작품</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('gmv')}
                className={`px-3 py-1 rounded-lg text-sm ${hoverEffects.button} ${
                  sortBy === 'gmv' ? 'bg-violet-600 text-white' : 'bg-gray-100'
                }`}
              >
                매출순
              </button>
              <button
                onClick={() => setSortBy('quantity')}
                className={`px-3 py-1 rounded-lg text-sm ${hoverEffects.button} ${
                  sortBy === 'quantity' ? 'bg-violet-600 text-white' : 'bg-gray-100'
                }`}
              >
                수량순
              </button>
            </div>
          </div>
          {products && products.length > 0 ? (
            <DataTable<TopProduct>
              data={products.slice(0, 20)}
              columns={[
                {
                  accessorKey: 'rank',
                  header: '순위',
                  cell: ({ row }) => <span className="font-medium">{row.original.rank}</span>,
                },
                {
                  accessorKey: 'productName',
                  header: '작품명',
                  cell: ({ row }) => {
                    const product = row.original
                    const name = product.productName
                    const truncated =
                      typeof name === 'string' && name.length > 20
                        ? name.slice(0, 20) + '...'
                        : name

                    return product.productUrl ? (
                      <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-600 hover:underline"
                      >
                        {truncated}
                      </a>
                    ) : (
                      <span>{truncated}</span>
                    )
                  },
                },
                {
                  accessorKey: 'artistName',
                  header: '작가',
                  cell: ({ row }) => <span className="text-gray-600">{row.original.artistName}</span>,
                },
                {
                  accessorKey: 'gmv',
                  header: '매출',
                  cell: ({ row }) => <span className="font-semibold">{formatCurrency(row.original.gmv)}</span>,
                },
                {
                  accessorKey: 'quantity',
                  header: '판매량',
                  cell: ({ row }) => <span>{row.original.quantity}개</span>,
                },
                {
                  accessorKey: 'avgRating',
                  header: '평점',
                  cell: ({ row }) => (
                    <span>{row.original.avgRating ? `⭐ ${row.original.avgRating}` : '-'}</span>
                  ),
                },
                {
                  accessorKey: 'countries',
                  header: '국가',
                  cell: ({ row }) => (
                    <span className="text-xs text-gray-500">
                      {row.original.countries.slice(0, 2).join(', ')}
                    </span>
                  ),
                },
              ]}
              searchPlaceholder="작품 검색..."
              pageSize={10}
            />
          ) : (
            <AnimatedEmptyState
              type="product"
              title="판매 작품이 없습니다"
              description="선택한 기간에 판매된 작품이 없습니다."
            />
          )}
        </div>
      </div>
    </div>
  )
}
