'use client'

import { useQuery } from '@tanstack/react-query'
import { controlTowerApi } from '@/lib/api'
import { useState } from 'react'
import Link from 'next/link'
import OrderDetailModal from '@/components/OrderDetailModal'
import { Icon } from '@/components/ui/Icon'
import { Package, Truck, Search, CheckCircle, Activity, AlertTriangle, Clock, X, Lightbulb } from 'lucide-react'

interface CriticalOrder {
  orderCode: string
  days: number
  detail?: string
}

interface PipelineStage {
  title: string
  orderCount: number
  itemCount: number
  criticalCount: number
  maxDays: number
  criticals: CriticalOrder[]
}

interface PartiallyReceivedOrder {
  orderCode: string
  totalItems: number
  receivedItems: number
  inspectedItems: number
  unreceivedItems: number
}

interface BundleAnalysis {
  partiallyReceivedCount: number
  partiallyReceivedOrders: PartiallyReceivedOrder[]
}

interface PipelineData {
  unreceived: PipelineStage
  artistShipping: PipelineStage
  awaitingInspection: PipelineStage
  inspectionComplete: PipelineStage
  internationalShipping: PipelineStage
}

interface ControlTowerData {
  pipeline: PipelineData
  bundleAnalysis?: BundleAnalysis
}

const STAGE_META = {
  unreceived: { 
    icon: Package, 
    link: '/unreceived', 
    color: 'amber',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-500',
    criticalDays: 7,
    action: '작가 연락 필요',
  },
  artistShipping: { 
    icon: Truck, 
    link: '/logistics?status=작가 발송',
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    criticalDays: 5,
    action: '택배사 확인',
  },
  awaitingInspection: { 
    icon: Search, 
    link: '/logistics?status=검수 대기',
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500',
    criticalDays: 2,
    action: '물류사 확인',
  },
  inspectionComplete: { 
    icon: CheckCircle, 
    link: '/logistics?status=검수 완료',
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    criticalDays: 3,
    action: '출고 확인',
  },
  internationalShipping: { 
    icon: Activity, 
    link: '/logistics?status=국제배송 시작',
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-500',
    criticalDays: 14,
    action: '배송 추적',
  },
}

export default function ControlTowerPage() {
  const [expandedCriticals, setExpandedCriticals] = useState<Set<string>>(new Set())
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false)
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null)
  const [showBundleAnalysis, setShowBundleAnalysis] = useState(false)

  const openOrderDetailModal = (orderCode: string) => {
    setSelectedOrderCode(orderCode)
    setIsOrderDetailModalOpen(true)
  }

  const closeOrderDetailModal = () => {
    setIsOrderDetailModalOpen(false)
    setSelectedOrderCode(null)
  }

  const { data, isLoading, error } = useQuery<ControlTowerData>({
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
  const bundleAnalysis = data?.bundleAnalysis as BundleAnalysis | undefined
  
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
  const maxDelayDays = Math.max(...stages.map(([, stage]) => stage.maxDays), 0)

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 */}
      <div className="relative bg-gradient-to-r from-idus-500 to-idus-600 rounded-2xl p-6 mb-6 overflow-hidden shadow-orange">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">📡</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">실시간 물류 관제 센터</h1>
            <p className="text-idus-100 text-sm font-medium">주문 단위로 5단계 물류 파이프라인 현황을 모니터링합니다</p>
          </div>
        </div>
      </div>

      {/* 핵심 지표 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📋</span>
            <p className="text-sm text-gray-500">처리중 주문</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalOrders} <span className="text-sm font-normal text-gray-500">건</span></p>
          <p className="text-xs text-gray-400 mt-1">총 {totalItems}개 작품</p>
        </div>
        
        <div className={`card ${totalCriticals > 0 ? 'bg-red-50 border-red-200' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <Icon icon={AlertTriangle} size="sm" className="text-red-500" />
            <p className={`text-sm ${totalCriticals > 0 ? 'text-red-600' : 'text-gray-500'}`}>위험 주문</p>
          </div>
          <p className={`text-2xl font-bold ${totalCriticals > 0 ? 'text-red-700' : 'text-gray-900'}`}>{totalCriticals} <span className="text-sm font-normal">건</span></p>
          <p className="text-xs text-gray-400 mt-1">기준일 초과</p>
        </div>

        <div className={`card ${maxDelayDays >= 14 ? 'bg-orange-50 border-orange-200' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <Icon icon={Clock} size="sm" className="text-orange-500" />
            <p className={`text-sm ${maxDelayDays >= 7 ? 'text-orange-600' : 'text-gray-500'}`}>최장 지연</p>
          </div>
          <p className={`text-2xl font-bold ${maxDelayDays >= 14 ? 'text-orange-700' : maxDelayDays >= 7 ? 'text-orange-600' : 'text-gray-900'}`}>{maxDelayDays}<span className="text-sm font-normal">일</span></p>
        </div>

        {bundleAnalysis && (
          <div 
            className={`card cursor-pointer transition-all hover:shadow-md ${
              bundleAnalysis.partiallyReceivedCount > 0 
                ? 'bg-amber-50 border-amber-300 hover:border-amber-400' 
                : 'hover:border-gray-300'
            }`}
            onClick={() => bundleAnalysis.partiallyReceivedCount > 0 && setShowBundleAnalysis(!showBundleAnalysis)}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon icon={Package} size="sm" className="text-amber-500" />
              <p className={`text-sm ${bundleAnalysis.partiallyReceivedCount > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                합포장 이슈
              </p>
            </div>
            <p className={`text-2xl font-bold ${bundleAnalysis.partiallyReceivedCount > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
              {bundleAnalysis.partiallyReceivedCount} <span className="text-sm font-normal">건</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {bundleAnalysis.partiallyReceivedCount > 0 ? '일부 작품 미입고' : '이슈 없음'}
            </p>
          </div>
        )}
      </div>

      {/* 합포장 일부입고 상세 패널 */}
      {showBundleAnalysis && bundleAnalysis && bundleAnalysis.partiallyReceivedOrders.length > 0 && (
        <div className="card mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon icon={Package} size="md" className="text-amber-500" />
              <div>
                <h3 className="font-semibold text-amber-800">합포장 일부입고 주문</h3>
                <p className="text-xs text-amber-600">미입고 작품으로 인해 전체 주문 출고가 지연되고 있습니다</p>
              </div>
            </div>
            <button 
              onClick={() => setShowBundleAnalysis(false)}
              className="text-amber-600 hover:text-amber-800 text-xl"
            >
              <Icon icon={X} size="sm" className="text-amber-600" />
            </button>
          </div>
          
          <div className="space-y-2">
            {bundleAnalysis.partiallyReceivedOrders.map((order, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200 hover:border-amber-300 transition-colors">
                <div className="flex-1">
                  <button
                    onClick={() => openOrderDetailModal(order.orderCode)}
                    className="text-sm font-medium text-amber-800 hover:underline"
                  >
                    {order.orderCode}
                  </button>
                  <div className="flex gap-3 mt-1 text-xs">
                    <span className="text-gray-600">총 {order.totalItems}개 작품</span>
                    <span className="text-red-600 font-medium flex items-center gap-1">
                      <Icon icon={Package} size="xs" />
                      미입고 {order.unreceivedItems}개
                    </span>
                    {order.inspectedItems > 0 && (
                      <span className="text-green-600 flex items-center gap-1">
                        <Icon icon={CheckCircle} size="xs" />
                        검수완료 {order.inspectedItems}개
                      </span>
                    )}
                    {(order.receivedItems - order.inspectedItems) > 0 && (
                      <span className="text-purple-600 flex items-center gap-1">
                        <Icon icon={Search} size="xs" />
                        검수대기 {order.receivedItems - order.inspectedItems}개
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                    작가 연락 필요
                  </span>
                  <button
                    onClick={() => openOrderDetailModal(order.orderCode)}
                    className="text-xs text-primary hover:underline"
                  >
                    상세보기 →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 파이프라인 흐름도 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📊</span>
          <h2 className="font-semibold text-gray-700">물류 파이프라인 흐름</h2>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {stages.map(([stageKey, stage], index) => {
            const meta = STAGE_META[stageKey as keyof typeof STAGE_META]
            const hasIssue = stage.criticalCount > 0
            return (
              <div key={stageKey} className="flex items-center">
                <div className={`
                  py-2 px-4 text-sm font-medium rounded-lg whitespace-nowrap flex items-center gap-2
                  ${hasIssue ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700'}
                `}>
                  <Icon icon={meta.icon} size="md" className="text-slate-600 dark:text-slate-400" />
                  <span className="font-bold">{stage.orderCount}</span>
                  <span className="text-xs opacity-75">주문</span>
                  {hasIssue && (
                    <span className="text-xs bg-red-200 px-1 rounded flex items-center gap-0.5">
                      <Icon icon={AlertTriangle} size="xs" className="text-red-600" />
                      {stage.criticalCount}
                    </span>
                  )}
                </div>
                {index < stages.length - 1 && (
                  <div className="w-6 text-gray-400 text-center text-lg">→</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 파이프라인 상세 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stages.map(([stageKey, stage]) => {
          const meta = STAGE_META[stageKey as keyof typeof STAGE_META]
          const criticalPercentage = stage.orderCount > 0 ? (stage.criticalCount / stage.orderCount) * 100 : 0
          const isExpanded = expandedCriticals.has(stageKey)
          const showMoreButton = stage.criticals.length > 3

          return (
            <div
              key={stageKey}
              className={`card ${stage.criticalCount > 0 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'}`}
            >
              {/* 헤더 */}
              <div className="flex items-start gap-2 mb-3">
                <Icon icon={meta.icon} size="lg" className="text-slate-600 dark:text-slate-400" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">{stage.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {stage.criticalCount > 0 ? (
                      <span className="text-red-600 font-medium flex items-center gap-1">
                        <Icon icon={AlertTriangle} size="xs" />
                        {stage.criticalCount}건 {meta.criticalDays}일+ 지연
                      </span>
                    ) : (
                      <span className="text-green-600">✓ 정상 운영</span>
                    )}
                  </p>
                </div>
              </div>

              {/* 핵심 메트릭 - 주문 수 강조 */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{stage.orderCount}</div>
                  <div className="text-xs text-gray-500 font-medium">주문</div>
                </div>
                <div className="text-center text-xs text-gray-400 mt-1">
                  (작품 {stage.itemCount}개)
                </div>
              </div>

              {/* 위험도 게이지 */}
              {stage.orderCount > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>위험도</span>
                    <span>{Math.round(criticalPercentage)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        criticalPercentage > 50 ? 'bg-red-500' : criticalPercentage > 20 ? 'bg-orange-400' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.max(criticalPercentage, 3)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* 위험 주문 목록 */}
              {stage.criticals.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-xs font-medium text-gray-600 mb-2">위험 주문 목록</div>
                  <ul className={`space-y-1.5 ${isExpanded ? 'max-h-48 overflow-y-auto' : ''}`}>
                    {stage.criticals.slice(0, isExpanded ? undefined : 3).map((critical, idx) => (
                      <li key={idx} className="bg-red-50 rounded p-2">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => openOrderDetailModal(critical.orderCode)}
                            className="text-xs text-gray-700 hover:text-primary hover:underline truncate flex-1 text-left font-medium"
                            title={critical.orderCode}
                          >
                            {critical.orderCode.length > 20 
                              ? critical.orderCode.slice(0, 20) + '...'
                              : critical.orderCode}
                          </button>
                          <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
                            {critical.days}일
                          </span>
                        </div>
                        {critical.detail && (
                          <p className="text-xs text-amber-600 mt-1">
                            <span className="flex items-center gap-1">
                              <Icon icon={AlertTriangle} size="xs" className="text-amber-600" />
                              {critical.detail}
                            </span>
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                  {showMoreButton && (
                    <button
                      onClick={() => toggleCriticalList(stageKey)}
                      className="w-full mt-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                    >
                      {isExpanded ? '접기 ▲' : `+${stage.criticals.length - 3}건 더보기 ▼`}
                    </button>
                  )}
                </div>
              )}

              {/* 푸터 */}
              <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {stage.criticalCount > 0 && (
                    <span className="text-amber-600 font-medium">{meta.action}</span>
                  )}
                </span>
                <Link href={meta.link} className="text-primary hover:underline font-medium">
                  상세보기 →
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* 범례 및 기획 설명 */}
      <div className="mt-6 card bg-slate-50 border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Icon icon={Lightbulb} size="md" className="text-amber-500" />
          <h3 className="font-semibold text-slate-700">물류 관제 센터 안내</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
              <Icon icon={BarChart3} size="sm" className="text-slate-600" />
              상태별 위험 기준
            </p>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Icon icon={Package} size="sm" className="text-slate-600 dark:text-slate-400" />
                <span>미입고: 결제 후 <strong>7일+</strong> 경과 시 위험</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon={Truck} size="sm" className="text-slate-600 dark:text-slate-400" />
                <span>국내배송: 발송 후 <strong>5일+</strong> 경과 시 위험</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon={Search} size="sm" className="text-slate-600 dark:text-slate-400" />
                <span>검수대기: 입고 후 <strong>2일+</strong> 경과 시 위험</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon={CheckCircle} size="sm" className="text-slate-600 dark:text-slate-400" />
                <span>포장대기: 검수 후 <strong>3일+</strong> 경과 시 위험</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon={Activity} size="sm" className="text-slate-600 dark:text-slate-400" />
                <span>국제배송: 출고 후 <strong>14일+</strong> 경과 시 위험</span>
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">📋 처리 로직</p>
            <div className="space-y-2 text-xs text-slate-600">
              <p>
                <strong>• 주문 단위 분류:</strong> 각 카드의 숫자는 <u>주문 수</u>를 의미하며, 
                상세 모달에서 개별 작품 상태를 확인할 수 있습니다.
              </p>
              <p>
                <strong>• 포장/출고 대기:</strong> 합포장 포함 <u>모든 작품이 검수 완료</u>된 
                주문만 해당 상태로 분류됩니다.
              </p>
              <p>
                <strong>• 합포장 이슈:</strong> 일부 작품만 입고된 합포장 주문은 별도 알림으로 
                표시되어 빠른 대응이 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 주문 상세 모달 */}
      {isOrderDetailModalOpen && selectedOrderCode && (
        <OrderDetailModal orderCode={selectedOrderCode} onClose={closeOrderDetailModal} />
      )}
    </div>
  )
}
