'use client'

import { useQuery } from '@tanstack/react-query'
import { logisticsApi } from '@/lib/api'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import OrderDetailModal from '@/components/OrderDetailModal'

interface LogisticsItem {
  name: string
  quantity: string | number
  url: string
}

interface LogisticsOrder {
  orderCode: string
  country: string
  logisticsStatus: string
  lastUpdate: string
  artistTracking: {
    number: string
    url: string
  }
  internationalTracking: {
    number: string
    url: string
  }
  items: LogisticsItem[]
  timelineEvents: Array<{ status: string; date: string }>
}

export default function LogisticsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('모든 국가')
  const [selectedStatus, setSelectedStatus] = useState('모든 상태')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false)
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null)

  const openOrderDetailModal = (orderCode: string) => {
    setSelectedOrderCode(orderCode)
    setIsOrderDetailModalOpen(true)
  }

  const closeOrderDetailModal = () => {
    setIsOrderDetailModalOpen(false)
    setSelectedOrderCode(null)
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['logistics'],
    queryFn: () => logisticsApi.getList(),
  })

  // 필터 옵션 생성
  const { countries, statuses } = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return { countries: [], statuses: [] }
    }

    const countrySet = new Set<string>()
    const statusSet = new Set<string>()

    data.forEach((order: LogisticsOrder) => {
      if (order.country) countrySet.add(order.country)
      if (order.logisticsStatus) statusSet.add(order.logisticsStatus)
    })

    return {
      countries: ['모든 국가', ...Array.from(countrySet).sort()],
      statuses: ['모든 상태', ...Array.from(statusSet).sort()],
    }
  }, [data])

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return []

    return data.filter((order: LogisticsOrder) => {
      // 검색어 필터
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase()
        if (!order.orderCode.toLowerCase().includes(lowerSearch)) {
          return false
        }
      }

      // 국가 필터
      if (selectedCountry !== '모든 국가') {
        if (order.country !== selectedCountry) {
          return false
        }
      }

      // 상태 필터
      if (selectedStatus !== '모든 상태') {
        if (order.logisticsStatus !== selectedStatus) {
          return false
        }
      }

      return true
    })
  }, [data, searchTerm, selectedCountry, selectedStatus])

  const toggleItems = (orderCode: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(orderCode)) {
      newExpanded.delete(orderCode)
    } else {
      newExpanded.add(orderCode)
    }
    setExpandedItems(newExpanded)
  }

  const getStatusBadgeColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('결제 완료')) return 'bg-blue-500'
    if (statusLower.includes('작가 발송') || statusLower.includes('송장 입력')) return 'bg-orange-500'
    if (statusLower.includes('검수 대기')) return 'bg-yellow-500'
    if (statusLower.includes('검수 완료')) return 'bg-green-500'
    if (statusLower.includes('국제배송') || statusLower.includes('배송중')) return 'bg-purple-500'
    return 'bg-gray-500'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card bg-red-50 border-red-200">
          <h2 className="text-xl font-semibold text-red-800 mb-2">오류 발생</h2>
          <p className="text-red-600">데이터를 불러오는 중 문제가 발생했습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🚚 글로벌 물류 추적
        </h1>
        <p className="text-gray-600">진행 중인 모든 주문의 물류 현황을 추적합니다.</p>
      </div>

      {/* 필터 */}
      <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">주문번호</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="주문번호로 검색..."
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">국가</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">상태</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

      {/* 테이블 */}
      <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 min-w-[140px]">주문번호</th>
                <th className="text-left py-3 px-4 min-w-[250px]">작품 목록</th>
                <th className="text-center py-3 px-4 min-w-[60px]">국가</th>
                <th className="text-left py-3 px-4 min-w-[120px]">종합 상태</th>
                <th className="text-left py-3 px-4 min-w-[130px]">국내배송 (작가)</th>
                <th className="text-left py-3 px-4 min-w-[130px]">국제배송</th>
                <th className="text-right py-3 px-4 min-w-[90px]">최종 업데이트</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-color">
                    표시할 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredData
                  .sort((a: LogisticsOrder, b: LogisticsOrder) =>
                    b.orderCode.localeCompare(a.orderCode)
                  )
                  .map((order: LogisticsOrder) => {
                    const isExpanded = expandedItems.has(order.orderCode)
                    const firstItem = order.items[0]
                    const hasMultipleItems = order.items.length > 1

                    return (
                      <tr key={order.orderCode} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => openOrderDetailModal(order.orderCode)}
                            className="text-primary hover:underline font-medium"
                          >
                            {order.orderCode}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="item-list-cell">
                            <div className="flex items-start gap-2">
                              {firstItem && (
                                <Link
                                  href={firstItem.url}
                                  target="_blank"
                                  className="flex-1 truncate hover:underline font-medium"
                                  title={`${firstItem.name} (수량: ${firstItem.quantity})`}
                                >
                                  {firstItem.name} (수량: {firstItem.quantity})
                                </Link>
                              )}
                              {hasMultipleItems && (
                                <button
                                  onClick={() => toggleItems(order.orderCode)}
                                  className="text-primary hover:text-secondary text-sm px-1"
                                  title={isExpanded ? '숨기기' : '전체 목록 보기'}
                                >
                                  <i
                                    className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`}
                                  ></i>
                                </button>
                              )}
                            </div>
                            {hasMultipleItems && (
                              <ul
                                className={`item-list-full mt-2 ${
                                  isExpanded ? 'expanded' : ''
                                }`}
                              >
                                {order.items.slice(1).map((item, idx) => (
                                  <li
                                    key={idx}
                                    className="py-1 pl-3 border-l-2 border-gray-200 mb-1"
                                  >
                                    <Link
                                      href={item.url}
                                      target="_blank"
                                      className="text-sm text-muted-color hover:text-primary truncate block"
                                      title={`${item.name} (수량: ${item.quantity})`}
                                    >
                                      {item.name} (수량: {item.quantity})
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">{order.country}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusBadgeColor(
                              order.logisticsStatus
                            )}`}
                          >
                            {order.logisticsStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {order.artistTracking.number !== 'N/A' ? (
                            <Link
                              href={order.artistTracking.url}
                              target="_blank"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <i className="fa-solid fa-box text-xs"></i>
                              {order.artistTracking.number}
                            </Link>
                          ) : (
                            <span className="text-muted-color">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {order.internationalTracking.number !== 'N/A' ? (
                            <Link
                              href={order.internationalTracking.url}
                              target="_blank"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <i className="fa-solid fa-plane-departure text-xs"></i>
                              {order.internationalTracking.number}
                            </Link>
                          ) : (
                            <span className="text-muted-color">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">{order.lastUpdate}</td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>

      {/* 주문 상세 모달 */}
      {isOrderDetailModalOpen && selectedOrderCode && (
        <OrderDetailModal orderCode={selectedOrderCode} onClose={closeOrderDetailModal} />
      )}

      <style jsx>{`
        .item-list-full {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
          list-style: none;
          padding-left: 0;
        }
        .item-list-full.expanded {
          max-height: 200px;
          overflow-y: auto;
        }
        .item-list-full::-webkit-scrollbar {
          width: 5px;
        }
        .item-list-full::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 5px;
        }
        .item-list-full::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 5px;
        }
      `}</style>
    </div>
  )
}

