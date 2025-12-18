'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { unreceivedApi } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import OrderDetailModal from '@/components/OrderDetailModal'
import { Icon } from '@/components/ui/Icon'
import { EnhancedLoadingPage } from '@/components/ui'
import { Package, MessageCircle, AlertTriangle, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      <EnhancedLoadingPage 
        message="미입고 관리 데이터를 불러오는 중..." 
        variant="default" 
        size="lg" 
      />
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
      {/* 페이지 헤더 - 물류 운영 (그린/티얼 계열, IA 개편안 9.1.2) */}
      <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden shadow-lg dark:shadow-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 dark:bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg dark:shadow-none">
            <Icon icon={Package} size="xl" className="text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">미입고 관리</h1>
            <p className="text-idus-100 dark:text-orange-200/80 text-xs lg:text-sm font-medium">'결제 완료' 상태의 주문 중 '처리완료'되지 않은 개별 작품 목록</p>
          </div>
        </div>
      </div>

      {/* 긴급 알림 배너 - 강화 */}
      {criticalCount > 0 && (
        <div className="mb-6 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                <Icon icon={AlertTriangle} size="lg" className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-lg mb-1">
                  긴급: 14일 이상 지연된 항목 {criticalCount}건
                </p>
                <p className="text-red-100 dark:text-red-200 text-sm">
                  즉시 확인 및 조치가 필요합니다
                </p>
              </div>
            </div>
            <button
              onClick={() => setDelayFilter('critical')}
              className="px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
            >
              긴급 항목 확인 →
            </button>
          </div>
        </div>
      )}

      {/* KPI 카드 + 빠른 필터 통합 */}
      {data && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6 mb-6 shadow-sm">
          {/* KPI 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">총 미입고 작품</p>
              <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {data.kpis.total.toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">개</span>
              </p>
          </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">관련 주문</p>
              <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {data.kpis.orders.toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">건</span>
              </p>
          </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">관련 작가</p>
              <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {data.kpis.artists.toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">명</span>
              </p>
          </div>
            <div className={cn(
              'rounded-xl p-4 border',
              delayedCount > 0 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            )}>
              <p className={cn(
                'text-xs lg:text-sm mb-1 font-medium',
                delayedCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
              )}>
                7일+ 지연
              </p>
              <p className={cn(
                'text-xl lg:text-2xl font-bold',
                delayedCount > 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-slate-100'
              )}>
                {delayedCount.toLocaleString()} <span className="text-sm font-normal">개</span>
            </p>
          </div>
        </div>

          {/* 빠른 필터 (인라인) */}
          <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700 flex-wrap">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 mr-2">빠른 필터:</span>
        <button
          onClick={() => setDelayFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
            delayFilter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
        >
              전체 ({data.kpis.total})
        </button>
        <button
          onClick={() => setDelayFilter('critical')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
            delayFilter === 'critical'
                  ? 'bg-red-600 text-white shadow-sm'
              : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
              )}
        >
          14일+ ({criticalCount})
        </button>
        <button
          onClick={() => setDelayFilter('delayed')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
            delayFilter === 'delayed'
                  ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50'
              )}
        >
          7일+ ({delayedCount})
        </button>
        <button
          onClick={() => setDelayFilter('warning')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
            delayFilter === 'warning'
                  ? 'bg-yellow-600 text-white shadow-sm'
              : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50'
              )}
        >
          3-7일
        </button>
      </div>
        </div>
      )}

      {/* 통합 필터 섹션 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon={Filter} size="sm" className="text-slate-500 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">필터</h3>
        </div>
        
        {/* 검색 및 드롭다운 (상단) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">검색</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="주문번호, 작가명, 작품명..."
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-idus-500 focus:border-idus-500 transition-all"
              />
            </div>
            <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">지연 상태</label>
              <select
                value={delayFilter}
                onChange={(e) => setDelayFilter(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-idus-500 focus:border-idus-500 transition-all"
              >
                <option value="all">전체</option>
                <option value="critical">14일 이상</option>
                <option value="delayed">7일 이상</option>
                <option value="warning">3-7일</option>
              </select>
            </div>
            <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">주문 유형</label>
              <select
                value={bundleFilter}
                onChange={(e) => setBundleFilter(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-idus-500 focus:border-idus-500 transition-all"
              >
                <option value="all">전체</option>
                <option value="bundle">묶음 주문</option>
                <option value="single">단일 주문</option>
              </select>
            </div>
          </div>
        </div>

      {/* 향상된 카드 스타일 테이블 (모바일 & 데스크톱 통합) */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon={Package} size="xl" className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              미입고 항목이 없습니다
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              모든 주문이 정상적으로 처리되었습니다.
            </p>
            <button
              onClick={() => {
                setDelayFilter('all')
                setSearchTerm('')
                setBundleFilter('all')
              }}
              className="px-4 py-2 text-sm font-medium text-idus-500 hover:text-idus-600 hover:bg-idus-50 dark:hover:bg-idus-900/20 rounded-lg transition-colors"
            >
              필터 초기화
            </button>
            </div>
          ) : (
            <>
              {filteredItems.map((item: any, index: number) => (
                <div
                  key={`${item.orderCode}-${index}`}
                className={cn(
                  'bg-white dark:bg-slate-900 rounded-xl border-2 p-5 transition-all',
                  'hover:shadow-lg hover:-translate-y-0.5',
                    item.daysElapsed >= 14
                    ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                      : item.daysElapsed >= 7
                    ? 'border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10'
                      : item.daysElapsed >= 3
                    ? 'border-yellow-300 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10'
                    : 'border-slate-200 dark:border-slate-800'
                )}
                >
                {/* 카드 헤더: 주문번호 + 경과일 + 액션 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <button
                      onClick={() => openOrderDetailModal(item.orderCode)}
                        className="text-lg font-bold text-idus-500 hover:text-idus-600 hover:underline transition-colors"
                    >
                      {item.orderCode}
                    </button>
                    <DelayBadge days={item.daysElapsed} />
                  {item.isBundle && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                          묶음 주문 ({item.allItems?.length || 0}개)
                    </span>
                  )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      주문일: {item.orderDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openOrderDetailModal(item.orderCode)}
                      className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-idus-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      상세보기
                    </button>
                    <button
                      onClick={() => handleOpenModal(item.orderCode, item.currentStatus || '')}
                      className="px-4 py-1.5 text-sm font-medium text-white bg-idus-500 hover:bg-idus-600 rounded-lg transition-colors shadow-sm"
                    >
                      메모 수정
                    </button>
                  </div>
                </div>
              
                {/* 작가명 + 작품명 */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {item.artistName}
                </p>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                    {item.productName}
                </p>
              </div>
                
                {/* 메모 */}
                {item.currentStatus && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-2">
                      <Icon icon={MessageCircle} size="sm" className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {item.currentStatus}
                      </p>
                          </div>
                        </div>
                )}
          </div>
            ))}
          
            {/* 카드뷰 푸터 */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                총 <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredItems.length}</span>개 항목
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                마지막 업데이트: {new Date().toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </>
          )}
        </div>

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
