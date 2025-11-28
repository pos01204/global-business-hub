'use client'

import { useQuery } from '@tanstack/react-query'
import { customerApi } from '@/lib/api'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import OrderDetailModal from './OrderDetailModal'
import ArtistOrdersModal from './ArtistOrdersModal'

interface CustomerDetailModalProps {
  userId: string | null
  onClose: () => void
}

export default function CustomerDetailModal({ userId, onClose }: CustomerDetailModalProps) {
  const router = useRouter()
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null)
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null)
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', userId],
    queryFn: () => customerApi.getDetail(userId!),
    enabled: !!userId,
  })

  if (!userId) return null

  const formatCurrency = (value: number) => {
    return `₩${Math.round(value).toLocaleString()}`
  }

  // 주문 상세 모달 열기
  const handleOpenOrderDetail = (orderCode: string) => {
    setSelectedOrderCode(orderCode)
  }

  // 작가 주문 내역 모달 열기
  const handleOpenArtistOrders = (artistName: string) => {
    setSelectedArtistName(artistName)
  }

  // 통합 검색 페이지로 이동
  const handleGoToLookup = () => {
    onClose()
    router.push(`/lookup?type=user_id&query=${encodeURIComponent(userId)}`)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">고객 상세 정보</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
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
            <div className="space-y-6">
              {/* 빠른 액션 버튼 */}
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-sm text-slate-500 self-center mr-2">빠른 이동:</span>
                <button
                  onClick={handleGoToLookup}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  <span>🔍</span>
                  <span>통합 검색</span>
                </button>
              </div>

              {/* 프로필 정보 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">프로필</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-color">사용자 ID</p>
                    <p className="font-semibold">{data.userId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-color">이름</p>
                    <p className="font-semibold">{data.profile.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-color">이메일</p>
                    <p className="font-semibold">{data.profile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-color">국가</p>
                    <p className="font-semibold">{data.profile.country}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-color">가입일</p>
                    <p className="font-semibold">{data.profile.createdAt}</p>
                  </div>
                </div>
              </div>

              {/* RFM 통계 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">RFM 통계</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="card">
                    <p className="text-sm text-muted-color">R (최근성)</p>
                    <p className="text-xl font-bold">
                      {data.stats.R === 'N/A' ? 'N/A' : `${data.stats.R}일`}
                    </p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-muted-color">F (빈도)</p>
                    <p className="text-xl font-bold">{data.stats.F}회</p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-muted-color">M (금액)</p>
                    <p className="text-xl font-bold">{formatCurrency(data.stats.M)}</p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-muted-color">작가 다양성</p>
                    <p className="text-xl font-bold">{data.stats.ArtistDiversity}명</p>
                  </div>
                </div>
              </div>

              {/* 주문 내역 */}
              {data.orders && data.orders.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">주문 내역 ({data.orders.length}건)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-2 px-4">주문번호</th>
                          <th className="text-left py-2 px-4">주문일</th>
                          <th className="text-right py-2 px-4">상품 수</th>
                          <th className="text-right py-2 px-4">주문 금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.orders.map((order: any, index: number) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4">
                              <button
                                onClick={() => handleOpenOrderDetail(order.orderCode)}
                                className="text-primary hover:underline font-medium"
                              >
                                {order.orderCode}
                              </button>
                            </td>
                            <td className="py-2 px-4">{order.dateFormatted}</td>
                            <td className="py-2 px-4 text-right">{order.productCount}</td>
                            <td className="py-2 px-4 text-right">{formatCurrency(order.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 작가 목록 */}
              {data.artistList && data.artistList.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">구매한 작가 목록 ({data.artistList.length}명)</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.artistList.map((artist: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleOpenArtistOrders(artist)}
                        className="px-3 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-full text-sm transition-colors"
                      >
                        {artist}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 주문 상세 모달 */}
      {selectedOrderCode && (
        <OrderDetailModal 
          orderCode={selectedOrderCode} 
          onClose={() => setSelectedOrderCode(null)} 
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


