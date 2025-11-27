'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { qcApi } from '@/lib/api'

export default function QCArchiveTab() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'text' | 'image'>('all')
  const [page, setPage] = useState(1)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const limit = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['qc', 'archive', typeFilter, page, startDate, endDate],
    queryFn: () =>
      qcApi.getArchive({
        type: typeFilter,
        page,
        limit,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  })

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

  const items = data?.items || []

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-2">타입 필터</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as 'all' | 'text' | 'image')
                setPage(1)
              }}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">전체</option>
              <option value="text">텍스트 QC</option>
              <option value="image">이미지 QC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(1)
              }}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(1)
              }}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          {(startDate || endDate) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                  setPage(1)
                }}
                className="btn btn-sm bg-gray-500 hover:bg-gray-600 text-white"
              >
                필터 초기화
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 통계 */}
      {data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-blue-50">
            <div className="text-sm text-gray-600">전체 완료 항목</div>
            <div className="text-2xl font-bold text-blue-700">
              {data.stats.total || 0}
            </div>
          </div>
          <div className="card bg-green-50">
            <div className="text-sm text-gray-600">텍스트 QC 완료</div>
            <div className="text-2xl font-bold text-green-700">
              {data.stats.totalByType?.text || 0}
            </div>
          </div>
          <div className="card bg-purple-50">
            <div className="text-sm text-gray-600">이미지 QC 완료</div>
            <div className="text-2xl font-bold text-purple-700">
              {data.stats.totalByType?.image || 0}
            </div>
          </div>
        </div>
      )}

      {/* 아카이브 목록 */}
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item: any) => (
            <div
              key={item.id}
              className={`card border-l-4 ${
                item.type === 'text'
                  ? 'border-blue-500'
                  : 'border-purple-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {item.type === 'text' ? '📝' : '🖼️'}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {item.type === 'text' ? '텍스트 QC' : '이미지 QC'}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                      완료됨
                    </span>
                  </div>

                  {item.type === 'text' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-gray-700">일본어 원문</h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap line-clamp-3">
                            {item.data.name || item.data.product_name || '제품명 없음'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-gray-700">한글 번역</h4>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap line-clamp-3">
                            {item.data.product_name || '번역 없음'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {item.data.image_url && (
                        <div>
                          <img
                            src={item.data.image_url}
                            alt={item.data.product_name || '이미지'}
                            className="max-w-xs h-auto rounded-lg shadow-md"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3E이미지 없음%3C/text%3E%3C/svg%3E'
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold mb-2 text-gray-700">제품명</h4>
                        <p className="text-sm text-gray-900">{item.data.product_name || '제품명 없음'}</p>
                      </div>
                      {item.data.detected_text && (
                        <div>
                          <h4 className="font-semibold mb-2 text-gray-700">OCR 결과</h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm whitespace-pre-wrap line-clamp-3">
                              {item.data.detected_text}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
                    <span>제품 ID: {item.data.global_product_id || item.data.product_id || 'N/A'}</span>
                    {item.completedAt && (
                      <span>
                        완료일: {new Date(item.completedAt).toLocaleString('ko-KR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-gray-500 mb-4">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold mb-2">아카이브 항목이 없습니다</h3>
            <p className="text-sm">
              완료된 QC 항목이 여기에 표시됩니다.
            </p>
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
    </div>
  )
}

