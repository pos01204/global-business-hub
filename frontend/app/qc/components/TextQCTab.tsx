'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qcApi } from '@/lib/api'
import { EnhancedLoadingPage, AnimatedEmptyState } from '@/components/ui'
// ✅ Phase 2: 고도화 컴포넌트
import { showToast } from '@/lib/toast'
import { hoverEffects } from '@/lib/hover-effects'

export default function TextQCTab() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [weeklyOnly, setWeeklyOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const limit = 20
  const queryClient = useQueryClient()
  const itemsRef = useRef<any[]>([])

  const { data, isLoading, error } = useQuery({
    queryKey: ['qc', 'text', statusFilter, weeklyOnly, page],
    queryFn: () =>
      qcApi.getTextList({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit,
        weeklyOnly,
      }),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      needsRevision,
    }: {
      id: string
      status: string
      needsRevision: boolean
    }) => qcApi.updateStatus('text', id, status, needsRevision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc', 'text'] })
      queryClient.invalidateQueries({ queryKey: ['qc', 'artists'] })
    },
  })

  const handleApprove = useCallback(async (id: string) => {
    const toastId = showToast.loading('승인 처리 중...')
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: 'approved',
        needsRevision: false,
      })
      showToast.dismiss(toastId)
      showToast.success('항목이 승인되었습니다')
    } catch (error: any) {
      showToast.dismiss(toastId)
      const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || '승인 처리 중 오류가 발생했습니다'
      showToast.error(msg)
    }
  }, [updateStatusMutation])

  const handleNeedsRevision = useCallback(async (id: string) => {
    const toastId = showToast.loading('수정 필요 표시 중...')
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: 'needs_revision',
        needsRevision: true,
      })
      showToast.dismiss(toastId)
      showToast.success('수정 필요로 표시되었습니다')
    } catch (error: any) {
      showToast.dismiss(toastId)
      const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || '처리 중 오류가 발생했습니다'
      showToast.error(msg)
    }
  }, [updateStatusMutation])

  const handleExclude = useCallback(async (id: string) => {
    const toastId = showToast.loading('QC 비대상 표시 중...')
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: 'excluded',
        needsRevision: false,
      })
      showToast.dismiss(toastId)
      showToast.success('QC 비대상으로 표시되었습니다')
    } catch (error: any) {
      showToast.dismiss(toastId)
      const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || '처리 중 오류가 발생했습니다'
      showToast.error(msg)
    }
  }, [updateStatusMutation])

  // 일괄 처리 함수들
  const toggleSelectItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const selectAllVisible = useCallback(() => {
    if (!itemsRef.current) return
    const pendingItems = itemsRef.current.filter((item: any) => item.status === 'pending')
    setSelectedItems(new Set(pendingItems.map((item: any) => item.id)))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set())
  }, [])

  const handleBulkApprove = useCallback(async () => {
    if (selectedItems.size === 0) return
    
    const count = selectedItems.size
    const loadingToast = showToast.loading(`${count}개 항목 일괄 승인 중...`)
    
    try {
      for (const id of selectedItems) {
        await updateStatusMutation.mutateAsync({ id, status: 'approved', needsRevision: false })
      }
      showToast.dismiss(loadingToast)
      showToast.success(`${count}개 항목이 일괄 승인되었습니다`)
      setSelectedItems(new Set())
    } catch (error) {
      showToast.dismiss(loadingToast)
      showToast.error('일괄 승인 중 오류가 발생했습니다')
    }
  }, [selectedItems, updateStatusMutation])

  const handleBulkNeedsRevision = useCallback(async () => {
    if (selectedItems.size === 0) return
    
    const count = selectedItems.size
    const loadingToast = showToast.loading(`${count}개 항목 일괄 수정 필요 표시 중...`)
    
    try {
      for (const id of selectedItems) {
        await updateStatusMutation.mutateAsync({ id, status: 'needs_revision', needsRevision: true })
      }
      showToast.dismiss(loadingToast)
      showToast.success(`${count}개 항목이 수정 필요로 표시되었습니다`)
      setSelectedItems(new Set())
    } catch (error) {
      showToast.dismiss(loadingToast)
      showToast.error('일괄 처리 중 오류가 발생했습니다')
    }
  }, [selectedItems, updateStatusMutation])

  const handleBulkExclude = useCallback(async () => {
    if (selectedItems.size === 0) return
    
    const count = selectedItems.size
    const loadingToast = showToast.loading(`${count}개 항목 일괄 비대상 표시 중...`)
    
    try {
      for (const id of selectedItems) {
        await updateStatusMutation.mutateAsync({ id, status: 'excluded', needsRevision: false })
      }
      showToast.dismiss(loadingToast)
      showToast.success(`${count}개 항목이 비대상으로 표시되었습니다`)
      setSelectedItems(new Set())
    } catch (error) {
      showToast.dismiss(loadingToast)
      showToast.error('일괄 처리 중 오류가 발생했습니다')
    }
  }, [selectedItems, updateStatusMutation])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있으면 무시
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      const items = itemsRef.current
      if (items.length === 0) return

      // 현재 선택된 항목이 없으면 첫 번째 항목 선택
      if (selectedIndex === -1 && items.length > 0) {
        setSelectedIndex(0)
        return
      }

      const currentItem = items[selectedIndex]
      if (!currentItem) return

      switch (e.key.toLowerCase()) {
        case 'a': // 승인 (Approve)
          if (currentItem.status !== 'approved') {
            e.preventDefault()
            handleApprove(currentItem.id)
          }
          break
        case 'r': // 수정 필요 (Revision)
          if (currentItem.status !== 'needs_revision') {
            e.preventDefault()
            handleNeedsRevision(currentItem.id)
          }
          break
        case 'n': // 다음 (Next)
          e.preventDefault()
          if (selectedIndex < items.length - 1) {
            setSelectedIndex(selectedIndex + 1)
            setTimeout(() => {
              const element = document.getElementById(`qc-item-${items[selectedIndex + 1].id}`)
              element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)
          }
          break
        case 'p': // 이전 (Previous)
          e.preventDefault()
          if (selectedIndex > 0) {
            setSelectedIndex(selectedIndex - 1)
            setTimeout(() => {
              const element = document.getElementById(`qc-item-${items[selectedIndex - 1].id}`)
              element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedIndex, handleApprove, handleNeedsRevision])

  // 데이터 변경 시 selectedIndex 및 selectedItems 초기화
  useEffect(() => {
    setSelectedIndex(-1)
    setSelectedItems(new Set())
  }, [statusFilter, weeklyOnly, page])

  if (isLoading) {
    return <EnhancedLoadingPage message="텍스트 QC 데이터를 불러오는 중..." variant="default" size="md" />
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <h3 className="text-lg font-semibold text-red-800 mb-2">오류 발생</h3>
        <p className="text-red-600">
          {error instanceof Error ? error.message : '데이터를 불러오는 중 문제가 발생했습니다.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-2">상태 필터</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">전체</option>
              <option value="pending">미검수</option>
              <option value="needs_revision">수정 필요</option>
              <option value="excluded">비대상</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-8">
            <input
              type="checkbox"
              id="weeklyOnly"
              checked={weeklyOnly}
              onChange={(e) => {
                setWeeklyOnly(e.target.checked)
                setPage(1)
              }}
              className="w-4 h-4"
            />
            <label htmlFor="weeklyOnly" className="text-sm font-medium">
              주간 신규만 보기
            </label>
          </div>
        </div>
      </div>

      {/* 통계 */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-blue-50">
            <div className="text-sm text-gray-600">전체 항목</div>
            <div className="text-2xl font-bold text-blue-700">
              {data.stats?.total || data.pagination?.total || 0}
            </div>
          </div>
          <div className="card bg-yellow-50">
            <div className="text-sm text-gray-600">미검수</div>
            <div className="text-2xl font-bold text-yellow-700">
              {data.stats?.pending || 0}
            </div>
          </div>
          <div className="card bg-red-50">
            <div className="text-sm text-gray-600">수정 필요</div>
            <div className="text-2xl font-bold text-red-700">
              {data.stats?.needsRevision || 0}
            </div>
          </div>
          <div className="card bg-gray-50">
            <div className="text-sm text-gray-600">비대상</div>
            <div className="text-2xl font-bold text-gray-600">
              {data.stats?.excluded || 0}
            </div>
          </div>
        </div>
      )}

      {/* 키보드 단축키 안내 */}
      <div className="card bg-gray-50 border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">⌨️</span>
          <h3 className="text-sm font-semibold">키보드 단축키</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-gray-600">
          <div><kbd className="px-2 py-1 bg-white rounded border">A</kbd> 승인 (아카이브)</div>
          <div><kbd className="px-2 py-1 bg-white rounded border">R</kbd> 수정 필요</div>
          <div><kbd className="px-2 py-1 bg-white rounded border">N</kbd> 다음 항목</div>
          <div><kbd className="px-2 py-1 bg-white rounded border">P</kbd> 이전 항목</div>
        </div>
      </div>

      {/* 일괄 선택/처리 바 */}
      <div className="card bg-slate-800 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={selectAllVisible}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              미검수 전체 선택
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              선택 해제
            </button>
            <span className="text-sm text-slate-300">
              {selectedItems.size > 0 ? `${selectedItems.size}개 선택됨` : '항목을 선택하세요'}
            </span>
          </div>
          
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkApprove}
                disabled={updateStatusMutation.isPending}
                className="px-4 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 rounded-lg text-sm font-semibold transition-colors"
              >
                ✓ 일괄 승인
              </button>
              <button
                onClick={handleBulkNeedsRevision}
                disabled={updateStatusMutation.isPending}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 rounded-lg text-sm font-semibold transition-colors"
              >
                ✎ 일괄 수정필요
              </button>
              <button
                onClick={handleBulkExclude}
                disabled={updateStatusMutation.isPending}
                className="px-4 py-1.5 bg-slate-500 hover:bg-slate-600 disabled:bg-slate-500/50 rounded-lg text-sm font-semibold transition-colors"
              >
                ✕ 일괄 비대상
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QC 목록 */}
      <div className="space-y-4">
        {data?.items && data.items.length > 0 ? (
          (() => {
            itemsRef.current = data.items
            return data.items.map((item: any, index: number) => (
              <div
                key={item.id}
                id={`qc-item-${item.id}`}
                className={`card border-l-4 transition-all ${
                  selectedIndex === index
                    ? 'ring-2 ring-primary shadow-lg'
                    : ''
                } ${
                  item.status === 'excluded'
                    ? 'border-gray-400 bg-gray-50 opacity-60'
                    : item.status === 'approved'
                      ? 'border-green-500'
                      : item.needsRevision || item.status === 'needs_revision'
                        ? 'border-red-500'
                        : 'border-gray-300'
                }`}
              >
              {/* 체크박스 + 콘텐츠 컨테이너 */}
              <div className="flex gap-4">
                {/* 체크박스 */}
                <div className="flex-shrink-0 pt-1">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                    className="w-5 h-5 rounded border-slate-300 text-slate-800 focus:ring-slate-500 cursor-pointer"
                  />
                </div>
                
                {/* 콘텐츠 */}
                <div className="flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 일본어 원문 */}
                <div>
                  <h4 className="font-semibold mb-2 text-gray-700">일본어 원문</h4>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">
                      {item.data.name || '제품명 없음'}
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">상세 설명:</p>
                      <p className="text-sm whitespace-pre-wrap">
                        {item.data.pdp_descr || '설명 없음'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 한글 번역 */}
                <div>
                  <h4 className="font-semibold mb-2 text-gray-700">한글 번역</h4>
                  <div className="bg-blue-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">
                      {item.data.product_name || '번역 없음'}
                    </p>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">
                        위치: {item.data.korean_place || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === 'excluded'
                        ? 'bg-gray-200 text-gray-600'
                        : item.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : item.needsRevision || item.status === 'needs_revision'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.status === 'excluded'
                      ? '비대상'
                      : item.status === 'approved'
                        ? '승인 완료'
                        : item.needsRevision || item.status === 'needs_revision'
                          ? '수정 필요'
                          : '미검수'}
                  </span>
                  <span className="text-xs text-gray-500">
                    제품 ID: {item.data.global_product_id || 'N/A'}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {item.status !== 'approved' && item.status !== 'excluded' && (
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={updateStatusMutation.isPending}
                      className="btn btn-sm bg-green-500 hover:bg-green-600 text-white"
                      title="승인 후 아카이브로 이동됩니다"
                    >
                      ✓ 승인
                    </button>
                  )}
                  {item.status !== 'needs_revision' && item.status !== 'excluded' && (
                    <button
                      onClick={() => handleNeedsRevision(item.id)}
                      disabled={updateStatusMutation.isPending}
                      className="btn btn-sm bg-red-500 hover:bg-red-600 text-white"
                    >
                      수정 필요
                    </button>
                  )}
                  {item.status !== 'excluded' && (
                    <button
                      onClick={() => handleExclude(item.id)}
                      disabled={updateStatusMutation.isPending}
                      className="btn btn-sm bg-gray-500 hover:bg-gray-600 text-white"
                    >
                      비대상
                    </button>
                  )}
                </div>
              </div>
              </div>
              </div>
            </div>
          ))
          })()
        ) : (
          <div className="card text-center py-12">
            <div className="text-gray-500 mb-4">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold mb-2">텍스트 QC 항목이 없습니다</h3>
              <p className="text-sm mb-6">
                텍스트 QC 데이터를 표시하려면 CSV 파일을 업로드해주세요.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="text-sm text-blue-800 font-medium mb-2">📋 사용 방법:</p>
                <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                  <li>CSV 업로드 탭으로 이동</li>
                  <li>텍스트 QC CSV 파일 선택</li>
                  <li>파일 업로드 후 이 페이지로 돌아오기</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-sm disabled:opacity-50"
          >
            이전
          </button>
          <span className="text-sm text-gray-600">
            {page} / {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page === data.pagination.totalPages}
            className="btn btn-sm disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}

