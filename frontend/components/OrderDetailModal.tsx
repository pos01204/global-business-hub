'use client'

import { useQuery } from '@tanstack/react-query'
import { orderApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import CustomerDetailModal from './CustomerDetailModal'
import ArtistOrdersModal from './ArtistOrdersModal'

interface OrderDetailModalProps {
  orderCode: string | null
  onClose: () => void
}

export default function OrderDetailModal({ orderCode, onClose }: OrderDetailModalProps) {
  const router = useRouter()
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null)
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['order', orderCode],
    queryFn: () => orderApi.getDetail(orderCode!),
    enabled: !!orderCode,
  })

  if (!orderCode) return null

  const formatCurrency = (value: number) => {
    return `₩${Math.round(value).toLocaleString()}`
  }

  // 물류 추적 페이지로 이동 (주문번호로 검색)
  const handleGoToLogistics = () => {
    onClose()
    router.push(`/logistics?search=${encodeURIComponent(orderCode)}`)
  }

  // 고객 상세 모달 열기
  const handleOpenCustomerDetail = (userId: string) => {
    setSelectedCustomerId(userId)
  }

  // 작가 주문 내역 모달 열기
  const handleOpenArtistOrders = (artistName: string) => {
    setSelectedArtistName(artistName)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">주문 상세 정보: {orderCode}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">

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
            <div className="space-y-6">
              {/* 빠른 액션 버튼 */}
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-sm text-slate-500 self-center mr-2">빠른 이동:</span>
                <button
                  onClick={handleGoToLogistics}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  <span>🚚</span>
                  <span>물류 추적</span>
                </button>
                {data.customerInfo?.userId && (
                  <button
                    onClick={() => handleOpenCustomerDetail(String(data.customerInfo.userId))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                  >
                    <span>👤</span>
                    <span>고객 상세</span>
                  </button>
                )}
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-color">주문번호</p>
                  <p className="font-semibold">{data.orderCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-color">국가</p>
                  <p className="font-semibold">{data.country}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-color">고객명</p>
                  {data.customerInfo?.userId ? (
                    <button
                      onClick={() => handleOpenCustomerDetail(String(data.customerInfo.userId))}
                      className="font-semibold text-primary hover:underline"
                    >
                      {data.customerInfo.name}
                    </button>
                  ) : (
                    <p className="font-semibold">{data.customerInfo.name}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-color">고객 국가</p>
                  <p className="font-semibold">{data.customerInfo.country}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-color">물류 상태</p>
                  <p className="font-semibold">{data.logisticsStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-color">처리 상태</p>
                  <p className="font-semibold">{data.currentMemo}</p>
                </div>
              </div>

              {/* 타임라인 */}
              {data.timelineEvents && data.timelineEvents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">타임라인</h3>
                  <div className="space-y-2">
                    {data.timelineEvents.map((event: any, index: number) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-medium">{event.status}</span>
                        <span className="text-muted-color">{event.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 작품 목록 */}
              {data.items && data.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">작품 목록</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">작가명</th>
                          <th className="text-left py-2 px-4">작품명</th>
                          <th className="text-right py-2 px-4">수량</th>
                          <th className="text-left py-2 px-4">상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((item: any, index: number) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4">
                              <div>
                                <button
                                  onClick={() => handleOpenArtistOrders(item.artistName)}
                                  className="font-medium text-primary hover:underline text-left"
                                >
                                  {item.artistName}
                                </button>
                                {item.artistEmail && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    📧 {item.artistEmail}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-4">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {item.name}
                              </a>
                            </td>
                            <td className="py-2 px-4 text-right">{item.quantity}</td>
                            <td className="py-2 px-4">
                              <span
                                className={`px-2 py-1 rounded text-sm ${
                                  item.status === '입고완료'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 배송 추적 */}
              {(data.artistTracking?.number || data.internationalTracking?.number) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">배송 추적</h3>
                  <div className="space-y-2">
                    {data.artistTracking?.number && (
                      <div>
                        <p className="text-sm text-muted-color">작가 발송 송장번호</p>
                        <a
                          href={data.artistTracking.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {data.artistTracking.number}
                        </a>
                      </div>
                    )}
                    {data.internationalTracking?.number && (
                      <div>
                        <p className="text-sm text-muted-color">국제송장번호</p>
                        <a
                          href={data.internationalTracking.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {data.internationalTracking.number}
                        </a>
                      </div>
                    )}
                  </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* 고객 상세 모달 */}
      {selectedCustomerId && (
        <CustomerDetailModal 
          userId={selectedCustomerId} 
          onClose={() => setSelectedCustomerId(null)} 
        />
      )}

      {/* 작가 주문 내역 모달 */}
      {selectedArtistName && (
        <ArtistOrdersModal 
          artistName={selectedArtistName} 
          onClose={() => setSelectedArtistName(null)} 
        />
      )}
    </div>
  )
}

