'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { unreceivedApi } from '@/lib/api'
import { useState } from 'react'
import OrderDetailModal from '@/components/OrderDetailModal'

export default function UnreceivedPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [delayFilter, setDelayFilter] = useState('all')
  const [bundleFilter, setBundleFilter] = useState('all')
  const [editingOrderCode, setEditingOrderCode] = useState<string | null>(null)
  const [memoText, setMemoText] = useState('')
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

  if (delayFilter === 'delayed') {
    filteredItems = filteredItems.filter((item: any) => item.daysElapsed >= 7)
  }

  if (bundleFilter === 'bundle') {
    filteredItems = filteredItems.filter((item: any) => item.isBundle === true)
  } else if (bundleFilter === 'single') {
    filteredItems = filteredItems.filter((item: any) => item.isBundle === false)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🚨 미입고 관리</h1>
        <p className="text-gray-600">
          '결제 완료' 상태의 주문 중 '처리완료'되지 않은 개별 작품 목록입니다.
        </p>
      </div>

        {/* KPI 카드 */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <h3 className="text-sm font-medium text-muted-color mb-2">총 미입고 작품</h3>
              <p className="text-2xl font-bold">{data.kpis.total.toLocaleString()} 개</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-muted-color mb-2">관련 주문</h3>
              <p className="text-2xl font-bold">{data.kpis.orders.toLocaleString()} 건</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-muted-color mb-2">관련 작가</h3>
              <p className="text-2xl font-bold">{data.kpis.artists.toLocaleString()} 명</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-muted-color mb-2">
                🚨 {data.kpis.threshold}일 이상 지연
              </h3>
              <p className={`text-2xl font-bold ${data.kpis.delayed > 0 ? 'text-red-600' : ''}`}>
                {data.kpis.delayed.toLocaleString()} 개
              </p>
            </div>
          </div>
        )}

        {/* 필터 */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">검색</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="주문번호, 작가명, 작품명으로 검색..."
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">지연 상태</label>
              <select
                value={delayFilter}
                onChange={(e) => setDelayFilter(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="all">모든 지연 상태</option>
                <option value="delayed">7일 이상 지연</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">주문 유형</label>
              <select
                value={bundleFilter}
                onChange={(e) => setBundleFilter(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="all">모든 주문 유형</option>
                <option value="bundle">묶음 주문 (2명 이상 작가)</option>
                <option value="single">단일 주문 (작가 1명)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 테이블 */}
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">주문번호</th>
                <th className="text-left py-3 px-4">작가명</th>
                <th className="text-left py-3 px-4">작품명</th>
                <th className="text-left py-3 px-4">주문일</th>
                <th className="text-right py-3 px-4">경과일</th>
                <th className="text-left py-3 px-4">현재 메모</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-color">
                    표시할 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any, index: number) => (
                  <tr
                    key={`${item.orderCode}-${index}`}
                    className={`border-b hover:bg-gray-50 ${
                      item.daysElapsed >= 10
                        ? 'bg-red-50'
                        : item.daysElapsed >= 7
                        ? 'bg-yellow-50'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openOrderDetailModal(item.orderCode)}
                        className="text-primary hover:underline font-medium"
                      >
                        {item.orderCode}
                      </button>
                    </td>
                    <td className="py-3 px-4">{item.artistName}</td>
                    <td className="py-3 px-4">
                      <div>
                        <div>{item.productName}</div>
                        {item.isBundle && (
                          <span className="text-xs text-blue-600">
                            묶음 ({item.allItems?.length || 0}개)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">{item.orderDate}</td>
                    <td className="py-3 px-4 text-right">{item.daysElapsed} 일</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="flex-1 truncate" title={item.currentStatus || '메모 없음'}>
                          {item.currentStatus || '메모 없음'}
                        </span>
                        <button
                          onClick={() => handleOpenModal(item.orderCode, item.currentStatus || '')}
                          className="btn btn-primary text-sm px-3 py-1"
                        >
                          수정
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 메모 수정 모달 */}
        {editingOrderCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{editingOrderCode} 메모 수정</h2>
                <button
                  onClick={() => {
                    setEditingOrderCode(null)
                    setMemoText('')
                  }}
                  className="text-2xl hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">메모 내용</label>
                <textarea
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  placeholder="처리 상태 메모 입력..."
                  className="w-full border border-gray-300 rounded px-3 py-2 h-24"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setEditingOrderCode(null)
                    setMemoText('')
                  }}
                  className="btn border border-gray-300"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveMemo}
                  disabled={updateMutation.isPending || !memoText.trim()}
                  className="btn btn-primary"
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

