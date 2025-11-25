'use client'

import { useQuery } from '@tanstack/react-query'
import { artistApi } from '@/lib/api'
import { useState } from 'react'

interface ArtistOrdersModalProps {
  artistName: string | null
  onClose: () => void
}

export default function ArtistOrdersModal({ artistName, onClose }: ArtistOrdersModalProps) {
  const [dateRange, setDateRange] = useState('30d')

  const { data, isLoading, error } = useQuery({
    queryKey: ['artist', artistName, 'orders', dateRange],
    queryFn: () => artistApi.getOrders(artistName!, dateRange),
    enabled: !!artistName,
  })

  if (!artistName) return null

  const formatCurrency = (value: number) => {
    return `₩${Math.round(value).toLocaleString()}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{artistName} 주문 내역</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* 날짜 범위 선택 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">기간 선택</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
              <option value="90d">최근 90일</option>
              <option value="365d">최근 365일</option>
            </select>
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>데이터를 불러오는 중...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-600">데이터를 불러오는 중 오류가 발생했습니다.</p>
            </div>
          )}

          {data && !data.error && (
            <div>
              {data.orders && data.orders.length > 0 ? (
                <div className="space-y-4">
                  {data.orders.map((order: any, index: number) => (
                    <div key={index} className="card">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">주문번호: {order.orderCode}</p>
                          <p className="text-sm text-muted-color">주문일: {order.date}</p>
                        </div>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(order.artistTotalAmount)}
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-4">작품명</th>
                              <th className="text-right py-2 px-4">수량</th>
                              <th className="text-right py-2 px-4">금액</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item: any, itemIndex: number) => (
                              <tr key={itemIndex} className="border-b">
                                <td className="py-2 px-4">
                                  <a
                                    href={item.productUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {item.productName}
                                  </a>
                                </td>
                                <td className="py-2 px-4 text-right">{item.quantity}</td>
                                <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-color">
                  선택한 기간 내 주문 내역이 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


