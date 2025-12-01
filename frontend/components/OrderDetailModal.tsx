'use client'

import { useQuery } from '@tanstack/react-query'
import { orderApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import CustomerDetailModal from './CustomerDetailModal'
import ArtistOrdersModal from './ArtistOrdersModal'

interface OrderDetailModalProps {
  orderCode: string | null
  onClose: () => void
}

// 상태별 스타일 및 아이콘 매핑
const STAGE_CONFIG: Record<string, { icon: string; bgColor: string; textColor: string; label: string }> = {
  unreceived: { icon: '📦', bgColor: 'bg-amber-100', textColor: 'text-amber-700', label: '미입고' },
  artistShipping: { icon: '🚚', bgColor: 'bg-blue-100', textColor: 'text-blue-700', label: '국내 배송중' },
  awaitingInspection: { icon: '🔍', bgColor: 'bg-purple-100', textColor: 'text-purple-700', label: '검수 대기' },
  inspectionComplete: { icon: '✅', bgColor: 'bg-green-100', textColor: 'text-green-700', label: '검수 완료' },
  internationalShipping: { icon: '✈️', bgColor: 'bg-indigo-100', textColor: 'text-indigo-700', label: '국제 배송중' },
}

export default function OrderDetailModal({ orderCode, onClose }: OrderDetailModalProps) {
  const router = useRouter()
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null)
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['order', orderCode],
    queryFn: () => orderApi.getDetail(orderCode!),
    enabled: !!orderCode,
  })

  if (!orderCode) return null

  // 물류 추적 페이지로 이동 (주문번호로 검색)
  const handleGoToLogistics = () => {
    onClose()
    router.push(`/logistics?search=${encodeURIComponent(orderCode)}`)
  }

  // 고객 상세 모달 열기
  const handleOpenCustomerDetail = (userId: string) => {
    setSelectedCustomerId(userId)
  }

  // 작가 주문 내역 모달 열기
  const handleOpenArtistOrders = (artistName: string) => {
    setSelectedArtistName(artistName)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">주문 상세 정보: {orderCode}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>데이터를 불러오는 중...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-600">데이터를 불러오는 중 오류가 발생했습니다.</p>
            </div>
          )}

          {data && !data.error && (
            <div className="space-y-6">
              {/* 빠른 액션 버튼 */}
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-sm text-slate-500 self-center mr-2">빠른 이동:</span>
                <button
                  onClick={handleGoToLogistics}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  <span>🚚</span>
                  <span>물류 추적</span>
                </button>
                {data.customerInfo?.userId && (
                  <button
                    onClick={() => handleOpenCustomerDetail(String(data.customerInfo.userId))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                  >
                    <span>👤</span>
                    <span>고객 상세</span>
                  </button>
                )}
              </div>

              {/* 주문 전체 상태 (신규) */}
              {data.orderOverallStatus && (
                <div className={`p-4 rounded-lg border-l-4 ${
                  data.orderOverallStatus.stage === 'inspectionComplete' 
                    ? 'bg-green-50 border-l-green-500' 
                    : data.orderOverallStatus.stage === 'unreceived'
                    ? 'bg-amber-50 border-l-amber-500'
                    : 'bg-blue-50 border-l-blue-500'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {STAGE_CONFIG[data.orderOverallStatus.stage]?.icon || '📋'}
                    </span>
                    <div>
                      <p className="font-semibold text-lg">
                        주문 상태: {data.orderOverallStatus.statusLabel}
                      </p>
                      <p className="text-sm text-gray-600">{data.orderOverallStatus.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 합포장 분석 (신규) */}
              {data.bundleAnalysis && (
                <div className={`p-4 rounded-lg ${
                  data.bundleAnalysis.isPartiallyReceived 
                    ? 'bg-amber-50 border border-amber-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">📦</span>
                    <h3 className="font-semibold">
                      합포장 주문 ({data.bundleAnalysis.totalItems}개 작품)
                    </h3>
                    {data.bundleAnalysis.isPartiallyReceived && (
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-medium rounded-full">
                        ⚠️ 일부 미입고
                      </span>
                    )}
                  </div>
                  
                  {/* 상태별 집계 */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(data.bundleAnalysis.statusBreakdown).map(([stage, count]) => {
                      if (count === 0) return null;
                      const config = STAGE_CONFIG[stage];
                      return (
                        <span 
                          key={stage} 
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${config?.bgColor} ${config?.textColor}`}
                        >
                          {config?.icon} {config?.label}: {count}개
                        </span>
                      );
                    })}
                  </div>

                  {/* 지연 작품 알림 */}
                  {data.bundleAnalysis.delayedItems && data.bundleAnalysis.delayedItems.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                      <p className="text-sm font-medium text-red-700 mb-2">
                        ⚠️ 지연 작품 ({data.bundleAnalysis.delayedItems.length}개)
                      </p>
                      <ul className="space-y-1">
                        {data.bundleAnalysis.delayedItems.map((item: any, idx: number) => (
                          <li key={idx} className="text-sm text-red-600 flex items-center justify-between">
                            <span className="truncate flex-1">
                              {item.artistName} - {item.name}
                            </span>
                            <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                              {item.statusLabel} {item.daysInStage}일
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-color">주문번호</p>
                  <p className="font-semibold">{data.orderCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-color">국가</p>
                  <p className="font-semibold">{data.country}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-color">고객명</p>
                  {data.customerInfo?.userId ? (
                    <button
                      onClick={() => handleOpenCustomerDetail(String(data.customerInfo.userId))}
                      className="font-semibold text-primary hover:underline"
                    >
                      {data.customerInfo.name}
                    </button>
                  ) : (
                    <p className="font-semibold">{data.customerInfo.name}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-color">고객 국가</p>
                  <p className="font-semibold">{data.customerInfo.country}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-color">물류 상태</p>
                  <p className="font-semibold">{data.logisticsStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-color">처리 상태</p>
                  <p className="font-semibold">{data.currentMemo}</p>
                </div>
              </div>

              {/* 타임라인 */}
              {data.timelineEvents && data.timelineEvents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">타임라인</h3>
                  <div className="space-y-2">
                    {data.timelineEvents.map((event: any, index: number) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-medium">{event.status}</span>
                        <span className="text-muted-color">{event.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 작품 목록 (개선) */}
              {data.items && data.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">작품 목록</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-2 px-4 text-sm font-semibold">작가명</th>
                          <th className="text-left py-2 px-4 text-sm font-semibold">작품명</th>
                          <th className="text-right py-2 px-4 text-sm font-semibold">수량</th>
                          <th className="text-left py-2 px-4 text-sm font-semibold">상태</th>
                          <th className="text-right py-2 px-4 text-sm font-semibold">소요일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((item: any, index: number) => {
                          const stageConfig = STAGE_CONFIG[item.stage] || STAGE_CONFIG.unreceived;
                          return (
                            <tr key={index} className={`border-b hover:bg-gray-50 ${item.isCritical ? 'bg-red-50' : ''}`}>
                              <td className="py-2 px-4">
                                <div>
                                  <button
                                    onClick={() => handleOpenArtistOrders(item.artistName)}
                                    className="font-medium text-primary hover:underline text-left"
                                  >
                                    {item.artistName}
                                  </button>
                                  {item.artistEmail && (
                                    <div className="text-xs text-blue-600 mt-1">
                                      📧 {item.artistEmail}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-4">
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {item.name}
                                </a>
                              </td>
                              <td className="py-2 px-4 text-right">{item.quantity}</td>
                              <td className="py-2 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${stageConfig.bgColor} ${stageConfig.textColor}`}
                                >
                                  {stageConfig.icon} {item.statusLabel}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-right">
                                <span className={`text-sm font-medium ${item.isCritical ? 'text-red-600' : 'text-gray-600'}`}>
                                  {item.daysInStage}일
                                  {item.isCritical && <span className="ml-1">⚠️</span>}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* 위험 기준 안내 */}
                  <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-500">
                    <strong>⚠️ 위험 기준:</strong> 미입고 7일+, 국내배송 5일+, 검수대기 2일+, 검수완료 3일+
                  </div>
                </div>
              )}

              {/* 배송 추적 */}
              {(data.artistTracking?.number || data.internationalTracking?.number) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">배송 추적</h3>
                  <div className="space-y-2">
                    {data.artistTracking?.number && (
                      <div>
                        <p className="text-sm text-muted-color">작가 발송 송장번호</p>
                        <a
                          href={data.artistTracking.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {data.artistTracking.number}
                        </a>
                      </div>
                    )}
                    {data.internationalTracking?.number && (
                      <div>
                        <p className="text-sm text-muted-color">국제송장번호</p>
                        <a
                          href={data.internationalTracking.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {data.internationalTracking.number}
                        </a>
                      </div>
                    )}
                  </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* 고객 상세 모달 */}
      {selectedCustomerId && (
        <CustomerDetailModal 
          userId={selectedCustomerId} 
          onClose={() => setSelectedCustomerId(null)} 
        />
      )}

      {/* 작가 주문 내역 모달 */}
      {selectedArtistName && (
        <ArtistOrdersModal 
          artistName={selectedArtistName} 
          onClose={() => setSelectedArtistName(null)} 
        />
      )}
    </div>
  )
}
