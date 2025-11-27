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
  },
  artistShipping: { 
    icon: '🚚', 
    link: '/logistics?status=작가+송장+입력',
    color: 'blue',
    bgFrom: 'from-blue-500',
    bgTo: 'to-cyan-500',
  },
  awaitingInspection: { 
    icon: '🔍', 
    link: '/logistics?status=검수+대기',
    color: 'purple',
    bgFrom: 'from-purple-500',
    bgTo: 'to-pink-500',
  },
  inspectionComplete: { 
    icon: '✅', 
    link: '/logistics?status=검수+완료',
    color: 'green',
    bgFrom: 'from-green-500',
    bgTo: 'to-emerald-500',
  },
  internationalShipping: { 
    icon: '✈️', 
    link: '/logistics',
    color: 'indigo',
    bgFrom: 'from-indigo-500',
    bgTo: 'to-violet-500',
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
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl">📡</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">실시간 물류 관제 센터</h1>
            <p className="text-gray-600 text-sm mt-0.5">
              5단계 물류 파이프라인의 실시간 현황을 모니터링합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 전체 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <p className="text-sm text-slate-300">전체 주문</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">📦</span>
            </div>
            <div>
              <p className="text-sm text-blue-200">전체 작품</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
          </div>
        </div>
        
        <div className={`card ${totalCriticals > 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-600'} text-white`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">{totalCriticals > 0 ? '⚠️' : '✅'}</span>
            </div>
            <div>
              <p className="text-sm text-white/80">위험 건수</p>
              <p className="text-2xl font-bold">{totalCriticals}</p>
            </div>
          </div>
        </div>
        
        <div className={`card ${maxDelayDays >= 14 ? 'bg-gradient-to-br from-orange-500 to-red-500' : maxDelayDays >= 7 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gradient-to-br from-gray-500 to-gray-600'} text-white`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">⏰</span>
            </div>
            <div>
              <p className="text-sm text-white/80">최장 지연</p>
              <p className="text-2xl font-bold">{maxDelayDays}일</p>
            </div>
          </div>
        </div>
      </div>

      {/* 파이프라인 진행 표시 */}
      <div className="mb-6">
        <div className="flex items-center justify-between bg-gray-100 rounded-full p-1 overflow-hidden">
          {stages.map(([stageKey, stage], index) => {
            const meta = STAGE_META[stageKey as keyof typeof STAGE_META]
            const isActive = stage.orderCount > 0
            return (
              <div key={stageKey} className="flex-1 flex items-center">
                <div className={`
                  flex-1 py-2 px-3 text-center text-xs font-medium rounded-full transition-all
                  ${isActive ? `bg-gradient-to-r ${meta.bgFrom} ${meta.bgTo} text-white shadow-md` : 'text-gray-400'}
                `}>
                  <span className="mr-1">{meta.icon}</span>
                  <span className="hidden md:inline">{stage.orderCount}건</span>
                </div>
                {index < stages.length - 1 && (
                  <div className="w-4 h-0.5 bg-gray-300 mx-1"></div>
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
              className={`card relative overflow-hidden ${
                stage.criticalCount > 0 ? 'ring-2 ring-red-200' : ''
              }`}
            >
              {/* 상단 그라데이션 바 */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${meta.bgFrom} ${meta.bgTo}`}></div>
              
              {/* 헤더 */}
              <div className="flex items-center gap-3 mb-4 pt-2">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.bgFrom} ${meta.bgTo} flex items-center justify-center shadow-lg`}>
                  <span className="text-2xl text-white">{meta.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{stage.title}</h3>
                  <p className="text-xs text-gray-500">
                    {stage.criticalCount > 0 ? (
                      <span className="text-red-600 font-medium">⚠️ {stage.criticalCount}건 위험</span>
                    ) : (
                      <span className="text-green-600">✓ 정상</span>
                    )}
                  </p>
                </div>
              </div>

              {/* 메트릭 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{stage.orderCount}</div>
                  <div className="text-xs text-gray-500">주문</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{stage.itemCount}</div>
                  <div className="text-xs text-gray-500">작품</div>
                </div>
              </div>

              {/* 헬스 바 */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">위험도</span>
                  <span className={criticalPercentage > 50 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                    {criticalPercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      criticalPercentage > 50 ? 'bg-red-500' : criticalPercentage > 20 ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.max(criticalPercentage, 5)}%` }}
                  ></div>
                </div>
              </div>

              {/* 위험 주문 목록 */}
              {stage.criticals.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    시급한 주문
                  </p>
                  <ul className={`space-y-1.5 ${isExpanded ? 'max-h-40 overflow-y-auto' : ''}`}>
                    {stage.criticals.slice(0, isExpanded ? undefined : 2).map((critical, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between bg-red-50 rounded-lg px-2.5 py-1.5"
                      >
                        <button
                          onClick={() => openOrderDetailModal(critical.orderCode)}
                          className="text-xs font-medium text-gray-700 hover:text-primary hover:underline truncate flex-1 text-left"
                          title={critical.orderCode}
                        >
                          {critical.orderCode.slice(0, 20)}...
                        </button>
                        <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                          {critical.days}일
                        </span>
                      </li>
                    ))}
                  </ul>
                  {showMoreButton && (
                    <button
                      onClick={() => toggleCriticalList(stageKey)}
                      className="w-full mt-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {isExpanded ? '접기' : `+${stage.criticals.length - 2}개 더보기`}
                    </button>
                  )}
                </div>
              )}

              {/* 푸터 */}
              <div className="mt-4 pt-3 border-t flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {stage.maxDays > 0 ? (
                    <>최장 <span className={`font-bold ${stage.maxDays >= 14 ? 'text-red-600' : stage.maxDays >= 7 ? 'text-orange-600' : 'text-gray-700'}`}>{stage.maxDays}일</span></>
                  ) : (
                    <span className="text-green-600">지연 없음</span>
                  )}
                </div>
                <Link
                  href={meta.link}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  상세 <span>→</span>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="mt-8 card bg-gray-50">
        <h3 className="font-semibold text-gray-700 mb-3">📋 파이프라인 단계 설명</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
          {stages.map(([stageKey, stage]) => {
            const meta = STAGE_META[stageKey as keyof typeof STAGE_META]
            return (
              <div key={stageKey} className="flex items-start gap-2">
                <span className="text-xl">{meta.icon}</span>
                <div>
                  <p className="font-medium text-gray-800">{stage.title}</p>
                  <p className="text-xs text-gray-500">
                    {stageKey === 'unreceived' && '결제 완료 후 미입고 상태'}
                    {stageKey === 'artistShipping' && '작가가 작품을 발송 중'}
                    {stageKey === 'awaitingInspection' && '물류센터 입고 대기'}
                    {stageKey === 'inspectionComplete' && '검수 완료, 포장 대기'}
                    {stageKey === 'internationalShipping' && '해외 배송 진행 중'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 주문 상세 모달 */}
      {isOrderDetailModalOpen && selectedOrderCode && (
        <OrderDetailModal orderCode={selectedOrderCode} onClose={closeOrderDetailModal} />
      )}
    </div>
  )
}
