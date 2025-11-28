'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { lookupApi } from '@/lib/api'
import { useSearchParams, useRouter } from 'next/navigation'
import OrderDetailModal from '@/components/OrderDetailModal'
import CustomerDetailModal from '@/components/CustomerDetailModal'

export default function LookupPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // URL 파라미터에서 초기값 로드 (query 또는 search 파라미터 지원)
  const initialQuery = searchParams.get('query') || searchParams.get('search') || ''
  const initialType = searchParams.get('searchType') || searchParams.get('type') || 'order_code'
  
  const [query, setQuery] = useState(initialQuery)
  const [searchType, setSearchType] = useState(initialType)
  
  // URL 파라미터 변경 시 상태 동기화
  useEffect(() => {
    const urlQuery = searchParams.get('query') || searchParams.get('search')
    const urlType = searchParams.get('searchType') || searchParams.get('type')
    
    if (urlQuery) setQuery(urlQuery)
    if (urlType) setSearchType(urlType)
  }, [searchParams])
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false)
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null)
  const [isCustomerDetailModalOpen, setIsCustomerDetailModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const openOrderDetailModal = (orderCode: string) => {
    setSelectedOrderCode(orderCode)
    setIsOrderDetailModalOpen(true)
  }

  const closeOrderDetailModal = () => {
    setIsOrderDetailModalOpen(false)
    setSelectedOrderCode(null)
  }

  const openCustomerDetailModal = (userId: string) => {
    setSelectedUserId(userId)
    setIsCustomerDetailModalOpen(true)
  }

  const closeCustomerDetailModal = () => {
    setIsCustomerDetailModalOpen(false)
    setSelectedUserId(null)
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['lookup', query, searchType],
    queryFn: () => lookupApi.search(query, searchType),
    enabled: !!query && !!searchType,
  })

  const handleSearch = () => {
    // 쿼리 자동 재실행됨
  }

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 - idus 브랜드 스타일 */}
      <div className="relative bg-gradient-to-r from-idus-500 to-idus-600 rounded-2xl p-6 mb-6 overflow-hidden shadow-orange">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">🔍</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">통합 검색</h1>
            <p className="text-idus-100 text-sm font-medium">주문번호, 송장번호, 사용자 ID 등으로 통합 검색합니다</p>
          </div>
        </div>
      </div>

        {/* 검색 폼 */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">검색어</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="검색어를 입력하세요..."
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">검색 기준</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="order_code">주문번호</option>
                <option value="shipment_id">송장번호</option>
                <option value="user_id">사용자 ID</option>
                <option value="artist_name">작가명</option>
                <option value="product_name">상품명</option>
                <option value="artist_id">작가 ID</option>
                <option value="product_id">상품 ID</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={!query || isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? '검색 중...' : '검색'}
              </button>
            </div>
          </div>
        </div>

        {/* 사용자 프로필 (user_id 검색 시) */}
        {data?.profile && (
          <div className="card mb-6 bg-blue-50 border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">👤 사용자 프로필</h2>
              {data.profile.userId && (
                <button
                  onClick={() => openCustomerDetailModal(String(data.profile.userId))}
                  className="btn btn-primary text-sm"
                >
                  상세 정보 보기
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        )}

        {/* 검색 결과 */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>검색 중...</p>
          </div>
        )}

        {error && (
          <div className="card bg-red-50 border-red-200">
            <h2 className="text-xl font-semibold text-red-800 mb-2">오류 발생</h2>
            <p className="text-red-600">검색 중 문제가 발생했습니다.</p>
          </div>
        )}

        {data && !isLoading && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                검색 결과 ({data.results?.length || 0}건)
              </h2>
              {data.query && (
                <p className="text-sm text-muted-color">
                  "{data.query}" ({data.searchType})
                </p>
              )}
            </div>

            {data.results && data.results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">주문번호</th>
                      <th className="text-left py-2 px-4">작가명</th>
                      <th className="text-left py-2 px-4">상품명</th>
                      <th className="text-left py-2 px-4">국가</th>
                      <th className="text-left py-2 px-4">물류 상태</th>
                      <th className="text-left py-2 px-4">주문일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((result: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">
                          <button
                            onClick={() => openOrderDetailModal(result.orderCode)}
                            className="text-primary hover:underline font-medium"
                          >
                            {result.orderCode}
                          </button>
                        </td>
                        <td className="py-2 px-4">{result.artistName}</td>
                        <td className="py-2 px-4">{result.productName}</td>
                        <td className="py-2 px-4">{result.country}</td>
                        <td className="py-2 px-4">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs ${
                              result.logisticsStatus === '배송완료'
                                ? 'bg-green-100 text-green-800'
                                : result.logisticsStatus === '결제 완료'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {result.logisticsStatus}
                          </span>
                        </td>
                        <td className="py-2 px-4">{result.orderCreated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-color">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        )}

        {!query && !isLoading && (
          <div className="card">
            <p className="text-center text-muted-color py-8">
              검색어를 입력하고 검색 버튼을 클릭하세요.
            </p>
          </div>
        )}

        {/* 모달 */}
        {isOrderDetailModalOpen && selectedOrderCode && (
          <OrderDetailModal orderCode={selectedOrderCode} onClose={closeOrderDetailModal} />
        )}
      {isCustomerDetailModalOpen && selectedUserId && (
        <CustomerDetailModal userId={selectedUserId} onClose={closeCustomerDetailModal} />
      )}
    </div>
  )
}

