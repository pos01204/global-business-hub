'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qcApi } from '@/lib/api'

interface ImageModalProps {
  item: any
  isOpen: boolean
  onClose: () => void
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  onApprove?: () => void
  onNeedsRevision?: () => void
  onComplete?: () => void
  isUpdating?: boolean
}

function ImageModal({
  item,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  onApprove,
  onNeedsRevision,
  onComplete,
  isUpdating,
}: ImageModalProps) {
  if (!isOpen || !item) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 이전/다음 버튼 */}
        {hasPrevious && onPrevious && (
          <button
            onClick={onPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {hasNext && onNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <div className="p-6">
          {/* 이미지 */}
          <div className="mb-4">
            <img
              src={item.data.image_url}
              alt={item.data.product_name || '이미지'}
              className="w-full h-auto rounded-lg shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3E이미지를 불러올 수 없습니다%3C/text%3E%3C/svg%3E'
              }}
            />
          </div>

          {/* 정보 */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">제품명</h3>
              <p className="text-sm text-gray-900">{item.data.product_name || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">OCR 결과</h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{item.data.detected_text || 'OCR 결과 없음'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">페이지 유형:</span>{' '}
                <span className="font-medium">{item.data.page_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">명령 유형:</span>{' '}
                <span className="font-medium">{item.data.cmd_type || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">작가 ID:</span>{' '}
                <span className="font-medium">{item.data.artist_id || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">제품 ID:</span>{' '}
                <span className="font-medium">{item.data.product_id || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex gap-2">
            {item.status !== 'approved' && onApprove && (
              <button
                onClick={onApprove}
                disabled={isUpdating}
                className="btn flex-1 bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
              >
                승인
              </button>
            )}
            {item.status !== 'needs_revision' && onNeedsRevision && (
              <button
                onClick={onNeedsRevision}
                disabled={isUpdating}
                className="btn flex-1 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
              >
                수정 필요
              </button>
            )}
            {(item.status === 'approved' || item.status === 'needs_revision') && onComplete && (
              <button
                onClick={onComplete}
                disabled={isUpdating}
                className="btn flex-1 bg-primary text-white disabled:opacity-50"
              >
                완료 처리
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ImageQCTab() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [weeklyOnly, setWeeklyOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedImage, setSelectedImage] = useState<any | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const limit = 20
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['qc', 'image', statusFilter, weeklyOnly, page],
    queryFn: () =>
      qcApi.getImageList({
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
    }) => qcApi.updateStatus('image', id, status, needsRevision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc', 'image'] })
      queryClient.invalidateQueries({ queryKey: ['qc', 'artists'] })
    },
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => qcApi.complete('image', id),
    onSuccess: (data, id: string) => {
      queryClient.invalidateQueries({ queryKey: ['qc', 'image'] })
      if (selectedImage?.id === id) {
        setSelectedImage(null)
      }
    },
  })

  const handleImageClick = (item: any, index: number) => {
    setSelectedImage(item)
    setSelectedIndex(index)
  }

  const handlePrevious = useCallback(() => {
    if (!data?.items || selectedIndex <= 0) return
    const prevItem = data.items[selectedIndex - 1]
    setSelectedImage(prevItem)
    setSelectedIndex(selectedIndex - 1)
  }, [data?.items, selectedIndex])

  const handleNext = useCallback(() => {
    if (!data?.items || selectedIndex >= data.items.length - 1) return
    const nextItem = data.items[selectedIndex + 1]
    setSelectedImage(nextItem)
    setSelectedIndex(selectedIndex + 1)
  }, [data?.items, selectedIndex])

  // 키보드 네비게이션
  useEffect(() => {
    if (!selectedImage || !data?.items) return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedImage) return
      if (e.key === 'ArrowLeft' && selectedIndex > 0) {
        handlePrevious()
      } else if (e.key === 'ArrowRight' && selectedIndex < data.items.length - 1) {
        handleNext()
      } else if (e.key === 'Escape') {
        setSelectedImage(null)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedImage, selectedIndex, data?.items, handlePrevious, handleNext])

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
        <p className="text-red-600 mb-4">
          {error instanceof Error ? error.message : '데이터를 불러오는 중 문제가 발생했습니다.'}
        </p>
        <div className="text-sm text-red-700">
          <p className="mb-2">가능한 원인:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>백엔드 서버가 실행 중인지 확인하세요</li>
            <li>Google Sheets 접근 권한을 확인하세요</li>
            <li>CSV 파일을 업로드했는지 확인하세요</li>
          </ul>
        </div>
      </div>
    )
  }

  const items = data?.items || []

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
              id="weeklyOnlyImage"
              checked={weeklyOnly}
              onChange={(e) => {
                setWeeklyOnly(e.target.checked)
                setPage(1)
              }}
              className="w-4 h-4"
            />
            <label htmlFor="weeklyOnlyImage" className="text-sm font-medium">
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
              {items.filter((item: any) => item.status === 'pending').length}
            </div>
          </div>
          <div className="card bg-red-50">
            <div className="text-sm text-gray-600">수정 필요</div>
            <div className="text-2xl font-bold text-red-700">
              {items.filter((item: any) => item.needsRevision || item.status === 'needs_revision').length}
            </div>
          </div>
        </div>
      )}

      {/* 이미지 그리드 */}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item: any, index: number) => (
            <div
              key={item.id}
              className={`card cursor-pointer hover:shadow-lg transition-all border-l-4 ${
                item.status === 'approved'
                  ? 'border-green-500'
                  : item.needsRevision || item.status === 'needs_revision'
                    ? 'border-red-500'
                    : 'border-gray-300'
              }`}
              onClick={() => handleImageClick(item, index)}
            >
              {/* 이미지 썸네일 */}
              <div className="relative aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={item.data.image_url}
                  alt={item.data.product_name || '이미지'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3E이미지 없음%3C/text%3E%3C/svg%3E'
                  }}
                />
                {/* 상태 배지 */}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'approved'
                        ? 'bg-green-500 text-white'
                        : item.needsRevision || item.status === 'needs_revision'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-500 text-white'
                    }`}
                  >
                    {item.status === 'approved'
                      ? '✓'
                      : item.needsRevision || item.status === 'needs_revision'
                        ? '✗'
                        : '○'}
                  </span>
                </div>
              </div>

              {/* OCR 결과 미리보기 */}
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">OCR 결과:</p>
                <p className="text-sm line-clamp-2 text-gray-700">
                  {item.data.detected_text || 'OCR 결과 없음'}
                </p>
              </div>

              {/* 제품명 */}
              <p className="text-xs font-medium text-gray-900 line-clamp-1">
                {item.data.product_name || '제품명 없음'}
              </p>

              {/* 페이지 유형 */}
              <p className="text-xs text-gray-500 mt-1">
                {item.data.page_name || 'N/A'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-gray-500 mb-4">
            <div className="text-4xl mb-4">📷</div>
            <h3 className="text-lg font-semibold mb-2">이미지 QC 항목이 없습니다</h3>
            <p className="text-sm mb-6">
              이미지 QC 데이터를 표시하려면 CSV 파일을 업로드해주세요.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
              <p className="text-sm text-blue-800 font-medium mb-2">📋 사용 방법:</p>
              <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                <li>CSV 업로드 탭으로 이동</li>
                <li>이미지 QC CSV 파일 선택</li>
                <li>파일 업로드 후 이 페이지로 돌아오기</li>
              </ol>
            </div>
          </div>
        </div>
      )}

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

      {/* 이미지 모달 */}
      <ImageModal
        item={selectedImage}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={selectedIndex > 0}
        hasNext={selectedIndex < items.length - 1}
        onApprove={
          selectedImage
            ? () => {
                if (confirm('이 항목을 승인하시겠습니까?')) {
                  updateStatusMutation.mutate({
                    id: selectedImage.id,
                    status: 'approved',
                    needsRevision: false,
                  })
                }
              }
            : undefined
        }
        onNeedsRevision={
          selectedImage
            ? () => {
                if (confirm('이 항목을 수정 필요로 표시하시겠습니까?')) {
                  updateStatusMutation.mutate({
                    id: selectedImage.id,
                    status: 'needs_revision',
                    needsRevision: true,
                  })
                }
              }
            : undefined
        }
        onComplete={
          selectedImage
            ? () => {
                if (confirm('QC를 완료하고 아카이브로 이동하시겠습니까?')) {
                  completeMutation.mutate(selectedImage.id)
                }
              }
            : undefined
        }
        isUpdating={updateStatusMutation.isPending || completeMutation.isPending}
      />
    </div>
  )
}

