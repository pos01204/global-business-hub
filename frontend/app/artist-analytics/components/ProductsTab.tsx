'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { artistAnalyticsApi } from '@/lib/api'
import { Doughnut } from 'react-chartjs-2'

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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (error || !data?.success) {
    return <div className="card bg-red-50 p-6 text-red-600">데이터 로드 실패</div>
  }

  const { summary, products, priceDistribution } = data

  // 가격대별 분포 차트
  const priceChartData = {
    labels: ['~₩3만', '₩3~5만', '₩5~10만', '₩10~20만', '₩20만+'],
    datasets: [
      {
        data: [
          priceDistribution.under30k.count,
          priceDistribution['30k_50k'].count,
          priceDistribution['50k_100k'].count,
          priceDistribution['100k_200k'].count,
          priceDistribution.over200k.count,
        ],
        backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'],
        borderWidth: 0,
      },
    ],
  }

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
        {/* 가격대별 분포 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">가격대별 판매 분포</h3>
          <div className="h-48">
            <Doughnut
              data={priceChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
              }}
            />
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>~₩3만</span>
              <span className="text-gray-500">{priceDistribution.under30k.rate}%</span>
            </div>
            <div className="flex justify-between">
              <span>₩3~5만</span>
              <span className="text-gray-500">{priceDistribution['30k_50k'].rate}%</span>
            </div>
            <div className="flex justify-between">
              <span>₩5~10만</span>
              <span className="text-gray-500">{priceDistribution['50k_100k'].rate}%</span>
            </div>
          </div>
        </div>

        {/* Top 판매 작품 테이블 */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">🏆 Top 판매 작품</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('gmv')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  sortBy === 'gmv' ? 'bg-violet-600 text-white' : 'bg-gray-100'
                }`}
              >
                매출순
              </button>
              <button
                onClick={() => setSortBy('quantity')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  sortBy === 'quantity' ? 'bg-violet-600 text-white' : 'bg-gray-100'
                }`}
              >
                수량순
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="text-left py-2 px-2">순위</th>
                  <th className="text-left py-2 px-2">작품명</th>
                  <th className="text-left py-2 px-2">작가</th>
                  <th className="text-right py-2 px-2">매출</th>
                  <th className="text-right py-2 px-2">판매량</th>
                  <th className="text-center py-2 px-2">평점</th>
                  <th className="text-center py-2 px-2">국가</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 20).map((product: any) => (
                  <tr key={product.productId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium">{product.rank}</td>
                    <td className="py-2 px-2">
                      {product.productUrl ? (
                        <a
                          href={product.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-600 hover:underline"
                        >
                          {product.productName.length > 20
                            ? product.productName.slice(0, 20) + '...'
                            : product.productName}
                        </a>
                      ) : (
                        <span>
                          {product.productName.length > 20
                            ? product.productName.slice(0, 20) + '...'
                            : product.productName}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-gray-600">{product.artistName}</td>
                    <td className="py-2 px-2 text-right font-semibold">{formatCurrency(product.gmv)}</td>
                    <td className="py-2 px-2 text-right">{product.quantity}개</td>
                    <td className="py-2 px-2 text-center">
                      {product.avgRating ? `⭐${product.avgRating}` : '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-xs text-gray-500">
                      {product.countries.slice(0, 2).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
