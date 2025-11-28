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
  unreceived: { 
    icon: '📦', 
    link: '/unreceived', 
    color: 'amber',
    bgFrom: 'from-amber-500',
    bgTo: 'to-orange-500',
    statusFilter: '',
  },
  artistShipping: { 
    icon: '🚚', 
    link: '/logistics?status=작가 발송',
    color: 'blue',
    bgFrom: 'from-blue-500',
    bgTo: 'to-cyan-500',
    statusFilter: '작가 발송',
  },
  awaitingInspection: { 
    icon: '🔍', 
    link: '/logistics?status=검수 대기',
    color: 'purple',
    bgFrom: 'from-purple-500',
    bgTo: 'to-pink-500',
    statusFilter: '검수 대기',
  },
  inspectionComplete: { 
    icon: '✅', 
    link: '/logistics?status=검수 완료',
    color: 'green',
    bgFrom: 'from-green-500',
    bgTo: 'to-emerald-500',
    statusFilter: '검수 완료',
  },
  internationalShipping: { 
    icon: '✈️', 
    link: '/logistics?status=국제배송 시작',
    color: 'indigo',
    bgFrom: 'from-indigo-500',
    bgTo: 'to-violet-500',
    statusFilter: '국제배송 시작',
  },
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

  // 전체 통계 계산
  const totalOrders = stages.reduce((acc, [, stage]) => acc + stage.orderCount, 0)
  const totalItems = stages.reduce((acc, [, stage]) => acc + stage.itemCount, 0)
  const totalCriticals = stages.reduce((acc, [, stage]) => acc + stage.criticalCount, 0)
  const maxDelayDays = Math.max(...stages.map(([, stage]) => stage.maxDays))

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">실시간 물류 관제 센터</h1>
        <p className="text-gray-600 text-sm">5단계 물류 파이프라인의 실시간 현황을 모니터링합니다.</p>
      </div>

      {/* 전체 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">전체 주문</p>
          <p className="text-2xl font-bold text-gray-900">{totalOrders} <span className="text-sm font-normal text-gray-500">건</span></p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">전체 작품</p>
          <p className="text-2xl font-bold text-gray-900">{totalItems} <span className="text-sm font-normal text-gray-500">개</span></p>
        </div>
        <div className={`card ${totalCriticals > 0 ? 'bg-red-50 border-red-200' : ''}`}>
          <p className={`text-sm mb-1 ${totalCriticals > 0 ? 'text-red-600' : 'text-gray-500'}`}>위험 건수</p>
          <p className={`text-2xl font-bold ${totalCriticals > 0 ? 'text-red-700' : 'text-gray-900'}`}>{totalCriticals}</p>
        </div>
        <div className={`card ${maxDelayDays >= 14 ? 'bg-orange-50 border-orange-200' : ''}`}>
          <p className={`text-sm mb-1 ${maxDelayDays >= 7 ? 'text-orange-600' : 'text-gray-500'}`}>최장 지연</p>
          <p className={`text-2xl font-bold ${maxDelayDays >= 14 ? 'text-orange-700' : maxDelayDays >= 7 ? 'text-orange-600' : 'text-gray-900'}`}>{maxDelayDays}일</p>
        </div>
      </div>

      {/* 파이프라인 진행 표시 */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {stages.map(([stageKey, stage], index) => {
            const meta = STAGE_META[stageKey as keyof typeof STAGE_META]
            const hasIssue = stage.criticalCount > 0
            return (
              <div key={stageKey} className="flex items-center">
                <div className={`
                  py-1.5 px-3 text-xs font-medium rounded whitespace-nowrap
                  ${hasIssue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                `}>
                  {meta.icon} {stage.orderCount}건
                </div>
                {index < stages.length - 1 && (
                  <div className="w-4 text-gray-400 text-center">→</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 파이프라인 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stages.map(([stageKey, stage]) => {
          const meta = STAGE_META[stageKey as keyof typeof STAGE_META]
          const criticalPercentage =
            stage.orderCount > 0 ? (stage.criticalCount / stage.orderCount) * 100 : 0
          const isExpanded = expandedCriticals.has(stageKey)
          const showMoreButton = stage.criticals.length > 2

          return (
            <div
              key={stageKey}
              className={`card ${stage.criticalCount > 0 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'}`}
            >
              {/* 헤더 */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{stage.title}</h3>
                  <p className="text-xs text-gray-500">
                    {stage.criticalCount > 0 ? (
                      <span className="text-red-600">{stage.criticalCount}건 위험</span>
                    ) : (
                      <span className="text-green-600">정상</span>
                    )}
                  </p>
                </div>
              </div>

              {/* 메트릭 */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{stage.orderCount}</div>
                  <div className="text-xs text-gray-500">주문</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{stage.itemCount}</div>
                  <div className="text-xs text-gray-500">작품</div>
                </div>
              </div>

              {/* 위험도 바 */}
              <div className="mb-3">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      criticalPercentage > 50 ? 'bg-red-500' : criticalPercentage > 20 ? 'bg-orange-400' : 'bg-green-500'
                    }`}
                    style={{ width: `${criticalPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* 위험 주문 목록 */}
              {stage.criticals.length > 0 && (
                <div className="border-t pt-3">
                  <ul className={`space-y-1 ${isExpanded ? 'max-h-32 overflow-y-auto' : ''}`}>
                    {stage.criticals.slice(0, isExpanded ? undefined : 2).map((critical, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between text-xs"
                      >
                        <button
                          onClick={() => openOrderDetailModal(critical.orderCode)}
                          className="text-gray-600 hover:text-primary hover:underline truncate flex-1 text-left"
                          title={critical.orderCode}
                        >
                          {critical.orderCode.slice(0, 18)}...
                        </button>
                        <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded whitespace-nowrap">
                          {critical.days}일
                        </span>
                      </li>
                    ))}
                  </ul>
                  {showMoreButton && (
                    <button
                      onClick={() => toggleCriticalList(stageKey)}
                      className="w-full mt-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      {isExpanded ? '접기' : `+${stage.criticals.length - 2}개`}
                    </button>
                  )}
                </div>
              )}

              {/* 푸터 */}
              <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {stage.maxDays > 0 ? (
                    <>최장 <span className={stage.maxDays >= 7 ? 'text-red-600 font-medium' : 'text-gray-700'}>{stage.maxDays}일</span></>
                  ) : (
                    '지연 없음'
                  )}
                </span>
                <Link href={meta.link} className="text-primary hover:underline">
                  상세 →
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="mt-6 card bg-gray-50 border-gray-200">
        <p className="text-xs text-gray-500 mb-2 font-medium">단계 설명</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-600">
          <span>📦 미입고: 결제 후 미입고</span>
          <span>🚚 국내배송: 작가 발송</span>
          <span>🔍 검수대기: 입고 대기</span>
          <span>✅ 검수완료: 포장 대기</span>
          <span>✈️ 국제배송: 해외 배송중</span>
        </div>
      </div>

      {/* 주문 상세 모달 */}
      {isOrderDetailModalOpen && selectedOrderCode && (
        <OrderDetailModal orderCode={selectedOrderCode} onClose={closeOrderDetailModal} />
      )}
    </div>
  )
}
