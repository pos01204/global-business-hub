'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { unreceivedApi } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import OrderDetailModal from '@/components/OrderDetailModal'
import { useIsMobile } from '@/hooks/useMediaQuery'

// 경과일에 따른 위험도 배지 (한 줄로 표시)
function DelayBadge({ days }: { days: number }) {
  if (days >= 14) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 whitespace-nowrap">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        {days}일
      </span>
    )
  }
  if (days >= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 whitespace-nowrap">
        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
        {days}일
      </span>
    )
  }
  if (days >= 3) {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 whitespace-nowrap">
        {days}일
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 whitespace-nowrap">
      {days}일
    </span>
  )
}

export default function UnreceivedPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isMobile = useIsMobile()
  
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
  const [showFilters, setShowFilters] = useState(false)

  // URL 파라미터 변경 시 상태 동기화
  useEffect(() => {
    const delay = searchParams.get('delay')
    const search = searchParams.get('search')
    const bundle = searchParams.get('bundle')
    
    if (delay) setDelayFilter(delay)
    if (search) setSearchTerm(decodeURIComponent(search))
    if (bundle) setBundleFilter(bundle)
  }, [searchParams])

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-idus-500 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
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
    <div className="animate-fade-in">
      {/* 페이지 헤더 - idus 브랜드 스타일 */}
      <div className="relative bg-gradient-to-r from-idus-500 to-idus-600 dark:from-orange-900/70 dark:to-orange-800/70 rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden shadow-orange dark:shadow-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 dark:bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg dark:shadow-none">
            <span className="text-2xl lg:text-3xl">📦</span>
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">미입고 관리</h1>
            <p className="text-idus-100 dark:text-orange-200/80 text-xs lg:text-sm font-medium">'결제 완료' 상태의 주문 중 '처리완료'되지 않은 개별 작품 목록</p>
          </div>
        </div>
      </div>

      {/* 긴급 알림 배너 */}
      {criticalCount > 0 && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-sm">
                !
              </div>
              <div>
                <p className="text-red-800 dark:text-red-200 font-medium text-sm lg:text-base">
                  14일 이상 지연된 항목이 <span className="font-bold">{criticalCount}건</span> 있습니다.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDelayFilter('critical')}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors w-full sm:w-auto"
            >
              확인하기
            </button>
          </div>
        </div>
      )}

      {/* KPI 카드 */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3 lg:p-4 border border-slate-200 dark:border-slate-800">
            <p className="text-xs lg:text-sm text-gray-500 dark:text-slate-400 mb-1">총 미입고 작품</p>
            <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-slate-100">{data.kpis.total.toLocaleString()} <span className="text-xs lg:text-sm font-normal text-gray-500 dark:text-slate-400">개</span></p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3 lg:p-4 border border-slate-200 dark:border-slate-800">
            <p className="text-xs lg:text-sm text-gray-500 dark:text-slate-400 mb-1">관련 주문</p>
            <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-slate-100">{data.kpis.orders.toLocaleString()} <span className="text-xs lg:text-sm font-normal text-gray-500 dark:text-slate-400">건</span></p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3 lg:p-4 border border-slate-200 dark:border-slate-800">
            <p className="text-xs lg:text-sm text-gray-500 dark:text-slate-400 mb-1">관련 작가</p>
            <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-slate-100">{data.kpis.artists.toLocaleString()} <span className="text-xs lg:text-sm font-normal text-gray-500 dark:text-slate-400">명</span></p>
          </div>
          <div className={`rounded-xl p-3 lg:p-4 border ${delayedCount > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
            <p className={`text-xs lg:text-sm mb-1 ${delayedCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-slate-400'}`}>7일+ 지연</p>
            <p className={`text-lg lg:text-2xl font-bold ${delayedCount > 0 ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-slate-100'}`}>
              {delayedCount.toLocaleString()} <span className="text-xs lg:text-sm font-normal">개</span>
            </p>
          </div>
        </div>
      )}

      {/* 빠른 필터 칩 */}
      <div className="flex gap-2 mb-4 flex-wrap overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
        <button
          onClick={() => setDelayFilter('all')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all whitespace-nowrap ${
            delayFilter === 'all'
              ? 'bg-gray-900 dark:bg-slate-700 text-white'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
          }`}
        >
          전체 ({data?.kpis.total || 0})
        </button>
        <button
          onClick={() => setDelayFilter('critical')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all whitespace-nowrap ${
            delayFilter === 'critical'
              ? 'bg-red-600 text-white'
              : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
          }`}
        >
          14일+ ({criticalCount})
        </button>
        <button
          onClick={() => setDelayFilter('delayed')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all whitespace-nowrap ${
            delayFilter === 'delayed'
              ? 'bg-orange-600 text-white'
              : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50'
          }`}
        >
          7일+ ({delayedCount})
        </button>
        <button
          onClick={() => setDelayFilter('warning')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all whitespace-nowrap ${
            delayFilter === 'warning'
              ? 'bg-yellow-600 text-white'
              : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50'
          }`}
        >
          3-7일
        </button>
      </div>

      {/* 필터 토글 버튼 (모바일) */}
      {isMobile && (
        <div className="mb-4">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors min-h-[44px]"
          >
            <span className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>🔽</span>
            <span>상세 필터 {showFilters ? '접기' : '펼치기'}</span>
          </button>
        </div>
      )}

      {/* 필터 */}
      {(showFilters || !isMobile) && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">검색</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="주문번호, 작가명, 작품명..."
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">지연 상태</label>
              <select
                value={delayFilter}
                onChange={(e) => setDelayFilter(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">전체</option>
                <option value="critical">14일 이상</option>
                <option value="delayed">7일 이상</option>
                <option value="warning">3-7일</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">주문 유형</label>
              <select
                value={bundleFilter}
                onChange={(e) => setBundleFilter(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">전체</option>
                <option value="bundle">묶음 주문</option>
                <option value="single">단일 주문</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 모바일 카드뷰 */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-gray-400 dark:text-slate-500">
                <div className="text-4xl mb-2">📭</div>
                <p className="font-medium">표시할 데이터가 없습니다.</p>
              </div>
            </div>
          ) : (
            <>
              {filteredItems.map((item: any, index: number) => (
                <div
                  key={`${item.orderCode}-${index}`}
                  className={`rounded-xl p-4 border transition-colors ${
                    item.daysElapsed >= 14
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : item.daysElapsed >= 7
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                      : item.daysElapsed >= 3
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* 상단: 주문번호 + 경과일 */}
                  <div className="flex justify-between items-start mb-3">
                    <button
                      onClick={() => openOrderDetailModal(item.orderCode)}
                      className="text-primary hover:underline font-semibold text-sm min-h-[44px] flex items-center"
                    >
                      {item.orderCode}
                    </button>
                    <DelayBadge days={item.daysElapsed} />
                  </div>
                  
                  {/* 작품명 */}
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1 line-clamp-2">
                    {item.productName}
                  </p>
                  
                  {/* 작가명 + 주문일 */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {item.artistName} · {item.orderDate}
                  </p>
                  
                  {/* 묶음 주문 표시 */}
                  {item.isBundle && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full mb-3">
                      📦 묶음 ({item.allItems?.length || 0}개)
                    </span>
                  )}
                  
                  {/* 메모 표시 */}
                  {item.currentStatus && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 mb-3 line-clamp-2">
                      💬 {item.currentStatus}
                    </p>
                  )}
                  
                  {/* 하단: 수정 버튼 */}
                  <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => handleOpenModal(item.orderCode, item.currentStatus || '')}
                      className="px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors min-h-[44px]"
                    >
                      메모 수정
                    </button>
                  </div>
                </div>
              ))}
              
              {/* 카드뷰 푸터 */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  총 <span className="font-semibold text-gray-900 dark:text-slate-100">{filteredItems.length}</span>개
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-500">
                  {new Date().toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        /* 데스크톱 테이블 */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-slate-300">주문번호</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-slate-300">작가명</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-slate-300">작품명</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-slate-300">주문일</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700 dark:text-slate-300">경과일</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-slate-300">현재 메모</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700 dark:text-slate-300">액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="text-gray-400 dark:text-slate-500">
                        <div className="text-4xl mb-2">📭</div>
                        <p className="font-medium">표시할 데이터가 없습니다.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item: any, index: number) => (
                    <tr
                      key={`${item.orderCode}-${index}`}
                      className={`border-b dark:border-slate-800 transition-colors ${
                        item.daysElapsed >= 14
                          ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                          : item.daysElapsed >= 7
                          ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                          : item.daysElapsed >= 3
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800'
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
                        <span className="font-medium text-gray-900 dark:text-slate-100">{item.artistName}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="text-gray-900 dark:text-slate-100 line-clamp-1" title={item.productName}>
                            {item.productName}
                          </div>
                          {item.isBundle && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                              <span>📦</span> 묶음 ({item.allItems?.length || 0}개)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600 dark:text-slate-400 text-sm">{item.orderDate}</td>
                      <td className="py-4 px-4 text-center">
                        <DelayBadge days={item.daysElapsed} />
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-600 dark:text-slate-400 text-sm truncate block max-w-[150px]" title={item.currentStatus || '메모 없음'}>
                          {item.currentStatus || (
                            <span className="text-gray-400 dark:text-slate-500 italic">메모 없음</span>
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
            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                총 <span className="font-semibold text-gray-900 dark:text-slate-100">{filteredItems.length}</span>개 항목
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-500">
                마지막 업데이트: {new Date().toLocaleString('ko-KR')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 메모 수정 모달 */}
      {editingOrderCode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">메모 수정</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{editingOrderCode}</p>
              </div>
              <button
                onClick={() => {
                  setEditingOrderCode(null)
                  setMemoText('')
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">메모 내용</label>
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="처리 상태 메모 입력..."
                className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 h-32 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditingOrderCode(null)
                  setMemoText('')
                }}
                className="flex-1 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
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
