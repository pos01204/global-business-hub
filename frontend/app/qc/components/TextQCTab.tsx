'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qcApi } from '@/lib/api'

export default function TextQCTab() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [weeklyOnly, setWeeklyOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
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

  const completeMutation = useMutation({
    mutationFn: (id: string) => qcApi.complete('text', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc', 'text'] })
    },
  })

  const handleApprove = (id: string) => {
    if (confirm('이 항목을 승인하시겠습니까?')) {
      updateStatusMutation.mutate({
        id,
        status: 'approved',
        needsRevision: false,
      })
    }
  }

  const handleNeedsRevision = (id: string) => {
    if (confirm('이 항목을 수정 필요로 표시하시겠습니까?')) {
      updateStatusMutation.mutate({
        id,
        status: 'needs_revision',
        needsRevision: true,
      })
    }
  }

  const handleComplete = (id: string) => {
    if (confirm('QC를 완료하고 아카이브로 이동하시겠습니까?')) {
      completeMutation.mutate(id)
    }
  }

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
        case 'c': // 완료 (Complete)
          if (
            currentItem.status === 'approved' ||
            currentItem.status === 'needs_revision'
          ) {
            e.preventDefault()
            handleComplete(currentItem.id)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex])

  // 데이터 변경 시 selectedIndex 초기화
  useEffect(() => {
    setSelectedIndex(-1)
  }, [statusFilter, weeklyOnly, page])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
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
              <option value="approved">승인 완료</option>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-blue-50">
            <div className="text-sm text-gray-600">전체 항목</div>
            <div className="text-2xl font-bold text-blue-700">
              {data.pagination?.total || 0}
            </div>
          </div>
          <div className="card bg-yellow-50">
            <div className="text-sm text-gray-600">미검수</div>
            <div className="text-2xl font-bold text-yellow-700">
              {data.items?.filter((item: any) => item.status === 'pending').length || 0}
            </div>
          </div>
          <div className="card bg-red-50">
            <div className="text-sm text-gray-600">수정 필요</div>
            <div className="text-2xl font-bold text-red-700">
              {data.items?.filter((item: any) => item.needsRevision || item.status === 'needs_revision').length || 0}
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
          <div><kbd className="px-2 py-1 bg-white rounded border">A</kbd> 승인</div>
          <div><kbd className="px-2 py-1 bg-white rounded border">R</kbd> 수정 필요</div>
          <div><kbd className="px-2 py-1 bg-white rounded border">C</kbd> 완료 처리</div>
          <div><kbd className="px-2 py-1 bg-white rounded border">N</kbd> 다음 항목</div>
          <div><kbd className="px-2 py-1 bg-white rounded border">P</kbd> 이전 항목</div>
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
                  item.status === 'approved'
                    ? 'border-green-500'
                    : item.needsRevision || item.status === 'needs_revision'
                      ? 'border-red-500'
                      : 'border-gray-300'
                }`}
              >
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
                      item.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : item.needsRevision || item.status === 'needs_revision'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.status === 'approved'
                      ? '승인 완료'
                      : item.needsRevision || item.status === 'needs_revision'
                        ? '수정 필요'
                        : '미검수'}
                  </span>
                  <span className="text-xs text-gray-500">
                    제품 ID: {item.data.global_product_id || 'N/A'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {item.status !== 'approved' && (
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={updateStatusMutation.isPending}
                      className="btn btn-sm bg-green-500 hover:bg-green-600 text-white"
                    >
                      승인
                    </button>
                  )}
                  {item.status !== 'needs_revision' && (
                    <button
                      onClick={() => handleNeedsRevision(item.id)}
                      disabled={updateStatusMutation.isPending}
                      className="btn btn-sm bg-red-500 hover:bg-red-600 text-white"
                    >
                      수정 필요
                    </button>
                  )}
                  {(item.status === 'approved' || item.status === 'needs_revision') && (
                    <button
                      onClick={() => handleComplete(item.id)}
                      disabled={completeMutation.isPending}
                      className="btn btn-sm bg-primary text-white"
                    >
                      완료 처리
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12 text-gray-500">
            QC 항목이 없습니다.
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

