'use client'

import { useQuery } from '@tanstack/react-query'
import { controlTowerApi } from '@/lib/api'
import { useState } from 'react'
import Link from 'next/link'
import OrderDetailModal from '@/components/OrderDetailModal'

interface CriticalOrder {
  orderCode: string
  days: number
}

interface PipelineStage {
  title: string
  orderCount: number
  itemCount: number
  criticalCount: number
  maxDays: number
  criticals: CriticalOrder[]
}

interface PipelineData {
  unreceived: PipelineStage
  artistShipping: PipelineStage
  awaitingInspection: PipelineStage
  inspectionComplete: PipelineStage
  internationalShipping: PipelineStage
}

const STAGE_META = {
  unreceived: { icon: '📦', link: '/unreceived' },
  artistShipping: { icon: '🚚', link: '/logistics?status=작가+송장+입력' },
  awaitingInspection: { icon: '🔍', link: '/logistics?status=작가+송장+입력' },
  inspectionComplete: { icon: '✅', link: '/logistics?status=검수+완료' },
  internationalShipping: { icon: '✈️', link: '/logistics' },
}

export default function ControlTowerPage() {
  const [expandedCriticals, setExpandedCriticals] = useState<Set<string>>(new Set())
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['control-tower'],
    queryFn: () => controlTowerApi.getData(),
  })

  const toggleCriticalList = (stageKey: string) => {
    const newExpanded = new Set(expandedCriticals)
    if (newExpanded.has(stageKey)) {
      newExpanded.delete(stageKey)
    } else {
      newExpanded.add(stageKey)
    }
    setExpandedCriticals(newExpanded)
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

  const pipeline = data?.pipeline as PipelineData | undefined
  const stages: Array<[string, PipelineStage]> = pipeline
    ? [
        ['unreceived', pipeline.unreceived],
        ['artistShipping', pipeline.artistShipping],
        ['awaitingInspection', pipeline.awaitingInspection],
        ['inspectionComplete', pipeline.inspectionComplete],
        ['internationalShipping', pipeline.internationalShipping],
      ]
    : []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📡 실시간 물류 관제 센터
        </h1>
        <p className="text-gray-600">5단계 물류 파이프라인의 실시간 현황을 모니터링합니다.</p>
      </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(([stageKey, stage], index) => {
            const meta = STAGE_META[stageKey as keyof typeof STAGE_META]
            const criticalPercentage =
              stage.orderCount > 0 ? (stage.criticalCount / stage.orderCount) * 100 : 0
            const isExpanded = expandedCriticals.has(stageKey)
            const showMoreButton = stage.criticals.length > 3

            return (
              <div key={stageKey} className="flex items-stretch">
                <div
                  className={`card min-w-[300px] flex flex-col ${
                    stage.criticalCount > 0 ? 'border-t-4 border-red-500' : 'border-t-4 border-green-500'
                  }`}
                >
                  {/* 헤더 */}
                  <div className="text-center mb-4">
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                        stage.criticalCount > 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      <span className="text-2xl">{meta.icon}</span>
                    </div>
                    <h3 className="text-base font-semibold">{stage.title}</h3>
                  </div>

                  {/* 메트릭 */}
                  <div className="flex justify-around py-4 border-t border-b mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stage.orderCount}
                        <small className="text-sm font-normal text-muted-color ml-1">건</small>
                      </div>
                      <div className="text-xs text-muted-color mt-1">총 주문</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stage.itemCount}
                        <small className="text-sm font-normal text-muted-color ml-1">개</small>
                      </div>
                      <div className="text-xs text-muted-color mt-1">총 작품</div>
                    </div>
                  </div>

                  {/* 헬스 바 */}
                  <div className="relative h-4 bg-gray-200 rounded-full mb-4 overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-500"
                      style={{ width: `${criticalPercentage}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-white drop-shadow">
                        {stage.criticalCount > 0 ? `${stage.criticalCount}건 위험` : '정상'}
                      </span>
                    </div>
                  </div>

                  {/* 위험 주문 목록 */}
                  {stage.criticals.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="text-xs font-semibold text-secondary-color block mb-2">
                        가장 시급한 주문 ({stage.criticalCount}건)
                      </span>
                      <ul
                        className={`list-none p-0 m-0 transition-all duration-300 ${
                          isExpanded ? 'max-h-[150px] overflow-y-auto' : 'max-h-[82px] overflow-hidden'
                        }`}
                      >
                        {stage.criticals.map((critical, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between items-center py-2 px-1 text-sm border-b last:border-b-0"
                          >
                            <button
                              onClick={() => openOrderDetailModal(critical.orderCode)}
                              className="flex-1 truncate text-primary font-semibold hover:underline text-left"
                              title={`${critical.orderCode} 상세 정보 보기`}
                            >
                              {critical.orderCode}
                            </button>
                            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0">
                              {critical.days}일 지연
                            </span>
                          </li>
                        ))}
                      </ul>
                      {showMoreButton && (
                        <button
                          onClick={() => toggleCriticalList(stageKey)}
                          className="w-full mt-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          {isExpanded ? '숨기기' : '더보기'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* 푸터 */}
                  <div className="mt-auto pt-4 border-t flex justify-between items-center">
                    <div className="text-xs font-medium text-secondary-color">
                      {stage.maxDays > 0 ? (
                        <>
                          최장 <strong className="text-red-600 font-bold">{stage.maxDays}</strong>일 지연
                        </>
                      ) : (
                        '지연 없음'
                      )}
                    </div>
                    <Link
                      href={meta.link}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      전체 보기 <span>→</span>
                    </Link>
                  </div>
                </div>

                {/* 커넥터 */}
                {index < stages.length - 1 && (
                  <div className="flex items-center justify-center w-12 flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M14.43 5.92993L20.5 11.9999L14.43 18.0699"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3.5 12H20.33"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 주문 상세 모달 */}
      {isOrderDetailModalOpen && selectedOrderCode && (
        <OrderDetailModal orderCode={selectedOrderCode} onClose={closeOrderDetailModal} />
      )}
    </div>
  )
}

