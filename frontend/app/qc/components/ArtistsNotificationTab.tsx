'use client'

import { useQuery } from '@tanstack/react-query'
import { qcApi } from '@/lib/api'

export default function ArtistsNotificationTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['qc', 'artists', 'notifications'],
    queryFn: () => qcApi.getArtistNotifications(),
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

  const artists = data?.artists || []

  return (
    <div className="space-y-6">
      {/* 통계 */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-blue-50">
            <div className="text-sm text-gray-600">알람 대상 작가 수</div>
            <div className="text-2xl font-bold text-blue-700">{data.total || 0}명</div>
          </div>
          <div className="card bg-green-50">
            <div className="text-sm text-gray-600">텍스트 QC 항목</div>
            <div className="text-2xl font-bold text-green-700">{data.totalTextItems || 0}개</div>
          </div>
          <div className="card bg-purple-50">
            <div className="text-sm text-gray-600">이미지 QC 항목</div>
            <div className="text-2xl font-bold text-purple-700">{data.totalImageItems || 0}개</div>
          </div>
          <div className="card bg-orange-50">
            <div className="text-sm text-gray-600">총 수정 필요 항목</div>
            <div className="text-2xl font-bold text-orange-700">
              {(data.totalTextItems || 0) + (data.totalImageItems || 0)}개
            </div>
          </div>
        </div>
      )}

      {/* 안내 */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">작가 알람 명단 안내</h3>
            <p className="text-sm text-blue-700">
              아래 목록은 텍스트 QC 또는 이미지 QC에서 "수정 필요"로 표시된 항목의 작가들입니다.
              각 작가별로 수정이 필요한 항목 수를 확인하고 알람을 발송할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 작가 목록 */}
      {artists.length > 0 ? (
        <div className="space-y-4">
          {artists.map((artist: any) => (
            <div key={artist.artistId} className="card border-l-4 border-primary">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {artist.artistName}
                  </h3>
                  <p className="text-sm text-gray-500">작가 ID: {artist.artistId}</p>
                </div>
                <div className="flex gap-3">
                  {artist.textQCItems > 0 && (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      텍스트 QC: {artist.textQCItems}개
                    </div>
                  )}
                  {artist.imageQCItems > 0 && (
                    <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      이미지 QC: {artist.imageQCItems}개
                    </div>
                  )}
                </div>
              </div>

              {/* 수정 필요 항목 목록 */}
              {artist.items && artist.items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    수정 필요 항목 ({artist.items.length}개)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {artist.items.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              item.type === 'text'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {item.type === 'text' ? '📝 텍스트' : '🖼️ 이미지'}
                          </span>
                          <span className="text-xs text-gray-500">ID: {item.id}</span>
                        </div>
                        <p className="text-sm text-gray-900 font-medium line-clamp-1">
                          {item.productName || '제품명 없음'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 알람 발송 버튼 (향후 구현) */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  className="btn btn-primary w-full"
                  onClick={() => {
                    alert(
                      `작가 "${artist.artistName}"에게 알람 발송 기능은 향후 구현될 예정입니다.\n\n수정 필요 항목:\n- 텍스트 QC: ${artist.textQCItems}개\n- 이미지 QC: ${artist.imageQCItems}개`
                    )
                  }}
                >
                  알람 발송 (향후 구현)
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          수정이 필요한 항목이 없습니다. 모든 QC가 완료되었습니다.
        </div>
      )}
    </div>
  )
}

