'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { unreceivedApi } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import OrderDetailModal from '@/components/OrderDetailModal'

// 경과일에 따른 위험도 배지 (한 줄로 표시)
function DelayBadge({ days }: { days: number }) {
  if (days >= 14) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 whitespace-nowrap">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        {days}일
      </span>
    )
  }
  if (days >= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700 whitespace-nowrap">
        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
        {days}일
      </span>
    )
  }
  if (days >= 3) {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 whitespace-nowrap">
        {days}일
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
      {days}일
    </span>
  )
}

export default function UnreceivedPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // URL 쿼리 파라미터에서 초기값 로드
  const initialDelay = searchParams.get('delay') || 'all'
  const initialSearch = searchParams.get('search') || ''
  const initialBundle = searchParams.get('bundle') || 'all'
  
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [delayFilter, setDelayFilter] = useState(initialDelay)
  const [bundleFilter, setBundleFilter] = useState(initialBundle)
  const [editingOrderCode, setEditingOrderCode] = useState<string | null>(null)
  const [memoText, setMemoText] = useState('')
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false)
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null)

  // URL 파라미터 변경 시 상태 동기화
  useEffect(() => {
    const delay = searchParams.get('delay')
    const search = searchParams.get('search')
    const bundle = searchParams.get('bundle')
    
    if (delay) setDelayFilter(delay)
    if (search) setSearchTerm(decodeURIComponent(search))
    if (bundle) setBundleFilter(bundle)
  }, [searchParams])

  // 필터 변경 시 URL 업데이트
  const updateUrlParams = (newDelay?: string, newSearch?: string, newBundle?: string) => {
    const params = new URLSearchParams()
    const delay = newDelay ?? delayFilter
    const search = newSearch ?? searchTerm
    const bundle = newBundle ?? bundleFilter
    
    if (delay && delay !== 'all') params.set('delay', delay)
    if (search) params.set('search', search)
    if (bundle && bundle !== 'all') params.set('bundle', bundle)
    
    const queryString = params.toString()
    router.replace(`/unreceived${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }

  const openOrderDetailModal = (orderCode: string) => {
    setSelectedOrderCode(orderCode)
    setIsOrderDetailModalOpen(true)
  }

  const closeOrderDetailModal = () => {
    setIsOrderDetailModalOpen(false)
    setSelectedOrderCode(null)
  }

  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['unreceived'],
    queryFn: () => unreceivedApi.getList(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ orderCode, status }: { orderCode: string; status: string }) =>
      unreceivedApi.updateStatus(orderCode, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreceived'] })
      setEditingOrderCode(null)
      setMemoText('')
    },
  })

  const handleOpenModal = (orderCode: string, currentStatus: string) => {
    setEditingOrderCode(orderCode)
    setMemoText(currentStatus)
  }

  const handleSaveMemo = () => {
    if (!editingOrderCode || !memoText.trim()) return
    updateMutation.mutate({
      orderCode: editingOrderCode,
      status: memoText.trim(),
    })
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

  // 필터링 로직
  let filteredItems = data?.items || []
  
  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase()
    filteredItems = filteredItems.filter(
      (item: any) =>
        item.orderCode.toLowerCase().includes(lowerSearch) ||
        item.artistName.toLowerCase().includes(lowerSearch) ||
        item.productName.toLowerCase().includes(lowerSearch)
    )
  }

  if (delayFilter === 'critical') {
    filteredItems = filteredItems.filter((item: any) => item.daysElapsed >= 14)
  } else if (delayFilter === 'delayed') {
    filteredItems = filteredItems.filter((item: any) => item.daysElapsed >= 7)
  } else if (delayFilter === 'warning') {
    filteredItems = filteredItems.filter((item: any) => item.daysElapsed >= 3 && item.daysElapsed < 7)
  }

  if (bundleFilter === 'bundle') {
    filteredItems = filteredItems.filter((item: any) => item.isBundle === true)
  } else if (bundleFilter === 'single') {
    filteredItems = filteredItems.filter((item: any) => item.isBundle === false)
  }

  // 통계 계산
  const criticalCount = (data?.items || []).filter((item: any) => item.daysElapsed >= 14).length
  const delayedCount = (data?.items || []).filter((item: any) => item.daysElapsed >= 7).length

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">미입고 관리</h1>
        <p className="text-gray-600 text-sm">'결제 완료' 상태의 주문 중 '처리완료'되지 않은 개별 작품 목록입니다.</p>
      </div>

      {/* 긴급 알림 배너 */}
      {criticalCount > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
                !
              </div>
              <div>
                <p className="text-red-800 font-medium">
                  14일 이상 지연된 항목이 <span className="font-bold">{criticalCount}건</span> 있습니다.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDelayFilter('critical')}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
            >
              확인하기
            </button>
          </div>
        </div>
      )}

      {/* KPI 카드 */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-500 mb-1">총 미입고 작품</p>
            <p className="text-2xl font-bold text-gray-900">{data.kpis.total.toLocaleString()} <span className="text-sm font-normal text-gray-500">개</span></p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500 mb-1">관련 주문</p>
            <p className="text-2xl font-bold text-gray-900">{data.kpis.orders.toLocaleString()} <span className="text-sm font-normal text-gray-500">건</span></p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500 mb-1">관련 작가</p>
            <p className="text-2xl font-bold text-gray-900">{data.kpis.artists.toLocaleString()} <span className="text-sm font-normal text-gray-500">명</span></p>
          </div>
          <div className={`card ${delayedCount > 0 ? 'bg-red-50 border-red-200' : ''}`}>
            <p className={`text-sm mb-1 ${delayedCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>7일+ 지연</p>
            <p className={`text-2xl font-bold ${delayedCount > 0 ? 'text-red-700' : 'text-gray-900'}`}>
              {delayedCount.toLocaleString()} <span className="text-sm font-normal">개</span>
            </p>
          </div>
        </div>
      )}

      {/* 빠른 필터 칩 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setDelayFilter('all')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            delayFilter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체 ({data?.kpis.total || 0})
        </button>
        <button
          onClick={() => setDelayFilter('critical')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            delayFilter === 'critical'
              ? 'bg-red-600 text-white'
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          }`}
        >
          14일+ ({criticalCount})
        </button>
        <button
          onClick={() => setDelayFilter('delayed')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            delayFilter === 'delayed'
              ? 'bg-orange-600 text-white'
              : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
          }`}
        >
          7일+ ({delayedCount})
        </button>
        <button
          onClick={() => setDelayFilter('warning')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            delayFilter === 'warning'
              ? 'bg-yellow-600 text-white'
              : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
          }`}
        >
          3-7일
        </button>
      </div>

      {/* 필터 */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">검색</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="주문번호, 작가명, 작품명..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">지연 상태</label>
            <select
              value={delayFilter}
              onChange={(e) => setDelayFilter(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">전체</option>
              <option value="critical">14일 이상</option>
              <option value="delayed">7일 이상</option>
              <option value="warning">3-7일</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">주문 유형</label>
            <select
              value={bundleFilter}
              onChange={(e) => setBundleFilter(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">전체</option>
              <option value="bundle">묶음 주문</option>
              <option value="single">단일 주문</option>
            </select>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">주문번호</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">작가명</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">작품명</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">주문일</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">경과일</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">현재 메모</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="text-gray-400">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="font-medium">표시할 데이터가 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any, index: number) => (
                  <tr
                    key={`${item.orderCode}-${index}`}
                    className={`border-b transition-colors ${
                      item.daysElapsed >= 14
                        ? 'bg-red-50 hover:bg-red-100'
                        : item.daysElapsed >= 7
                        ? 'bg-orange-50 hover:bg-orange-100'
                        : item.daysElapsed >= 3
                        ? 'bg-yellow-50 hover:bg-yellow-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-4 px-4">
                      <button
                        onClick={() => openOrderDetailModal(item.orderCode)}
                        className="text-primary hover:underline font-medium text-sm"
                      >
                        {item.orderCode}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">{item.artistName}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="text-gray-900 line-clamp-1" title={item.productName}>
                          {item.productName}
                        </div>
                        {item.isBundle && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            <span>📦</span> 묶음 ({item.allItems?.length || 0}개)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600 text-sm">{item.orderDate}</td>
                    <td className="py-4 px-4 text-center">
                      <DelayBadge days={item.daysElapsed} />
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-600 text-sm truncate block max-w-[150px]" title={item.currentStatus || '메모 없음'}>
                        {item.currentStatus || (
                          <span className="text-gray-400 italic">메모 없음</span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenModal(item.orderCode, item.currentStatus || '')}
                        className="px-3 py-1 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded transition-colors whitespace-nowrap"
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* 테이블 푸터 */}
        {filteredItems.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              총 <span className="font-semibold text-gray-900">{filteredItems.length}</span>개 항목
            </p>
            <p className="text-xs text-gray-500">
              마지막 업데이트: {new Date().toLocaleString('ko-KR')}
            </p>
          </div>
        )}
      </div>

      {/* 메모 수정 모달 */}
      {editingOrderCode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">메모 수정</h2>
                <p className="text-sm text-gray-500 mt-0.5">{editingOrderCode}</p>
              </div>
              <button
                onClick={() => {
                  setEditingOrderCode(null)
                  setMemoText('')
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">메모 내용</label>
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="처리 상태 메모 입력..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 h-32 focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditingOrderCode(null)
                  setMemoText('')
                }}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveMemo}
                disabled={updateMutation.isPending || !memoText.trim()}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 주문 상세 모달 */}
      {isOrderDetailModalOpen && selectedOrderCode && (
        <OrderDetailModal orderCode={selectedOrderCode} onClose={closeOrderDetailModal} />
      )}
    </div>
  )
}
