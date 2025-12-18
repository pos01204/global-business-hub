'use client'

import { useQuery } from '@tanstack/react-query'
import { controlTowerApi } from '@/lib/api'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import OrderDetailModal from '@/components/OrderDetailModal'
import { Icon } from '@/components/ui/Icon'
import { EnhancedLoadingPage } from '@/components/ui'
import { cn } from '@/lib/utils'
import { 
  Package, 
  Truck, 
  Search, 
  CheckCircle, 
  Activity, 
  AlertTriangle, 
  Clock, 
  X, 
  Lightbulb, 
  BarChart3,
  ChevronRight,
  Zap,
  FileText,
  GitBranch
} from 'lucide-react'
// ✅ 공통 비즈니스 규칙 import (Phase 1 표준화)
import { LOGISTICS_CRITICAL_DAYS } from '@/config/businessRules'
// ✅ Phase 2: 고도화 컴포넌트
import { hoverEffects } from '@/lib/hover-effects'
import PageHeader from '@/components/PageHeader'

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

// ✅ criticalDays는 @/config/businessRules에서 가져옴 (Phase 1 표준화)
const STAGE_META = {
  unreceived: { 
    icon: Package, 
    link: '/unreceived', 
    color: 'amber',
    criticalDays: LOGISTICS_CRITICAL_DAYS.unreceived,
    action: '작가 연락 필요',
  },
  artistShipping: { 
    icon: Truck, 
    link: '/logistics?status=작가 발송',
    color: 'blue',
    criticalDays: LOGISTICS_CRITICAL_DAYS.artistShipping,
    action: '택배사 확인',
  },
  awaitingInspection: { 
    icon: Search, 
    link: '/logistics?status=검수 대기',
    color: 'purple',
    criticalDays: LOGISTICS_CRITICAL_DAYS.awaitingInspection,
    action: '물류사 확인',
  },
  inspectionComplete: { 
    icon: CheckCircle, 
    link: '/logistics?status=검수 완료',
    color: 'green',
    criticalDays: LOGISTICS_CRITICAL_DAYS.inspectionComplete,
    action: '출고 확인',
  },
  internationalShipping: { 
    icon: Activity, 
    link: '/logistics?status=국제배송 시작',
    color: 'indigo',
    criticalDays: LOGISTICS_CRITICAL_DAYS.internationalShipping,
    action: '배송 추적',
  },
}

// 색상 매핑 함수
const getStageColorClasses = (color: string, variant: 'bg' | 'icon' | 'text') => {
  const colorMap: Record<string, Record<string, string>> = {
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      icon: 'text-amber-600 dark:text-amber-400',
      text: 'text-amber-600 dark:text-amber-400',
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      icon: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-600 dark:text-blue-400',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      icon: 'text-purple-600 dark:text-purple-400',
      text: 'text-purple-600 dark:text-purple-400',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      icon: 'text-green-600 dark:text-green-400',
      text: 'text-green-600 dark:text-green-400',
    },
    indigo: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      icon: 'text-indigo-600 dark:text-indigo-400',
      text: 'text-indigo-600 dark:text-indigo-400',
    },
  }
  return colorMap[color]?.[variant] || ''
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
    return <EnhancedLoadingPage message="물류 관제센터 데이터를 불러오는 중..." variant="default" size="lg" />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">오류 발생</h2>
          <p className="text-red-600 dark:text-red-400">데이터를 불러오는 중 문제가 발생했습니다.</p>
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
      {/* 페이지 헤더 - 브랜드 일러스트 포함 */}
      <PageHeader
        title="물류 관제 센터"
        description="주문 단위로 5단계 물류 파이프라인 현황을 모니터링합니다"
        icon="🚚"
        variant="logistics"
      />

      {/* 핵심 지표 요약 - 통합 카드 섹션 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 처리중 주문 */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <Icon icon={FileText} size="sm" className="text-slate-600 dark:text-slate-400" />
              </div>
              <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium">처리중 주문</p>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalOrders} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">건</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">총 {totalItems}개 작품</p>
          </div>
          
          {/* 위험 주문 - 강조 색상 */}
          <div className={cn(
            'rounded-xl p-4 border transition-all',
            totalCriticals > 0 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          )}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                totalCriticals > 0 
                  ? 'bg-red-200 dark:bg-red-900/50' 
                  : 'bg-slate-200 dark:bg-slate-700'
              )}>
                <Icon icon={AlertTriangle} size="sm" className={totalCriticals > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'} />
              </div>
              <p className={cn(
                'text-xs lg:text-sm font-medium',
                totalCriticals > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
              )}>위험 주문</p>
            </div>
            <p className={cn(
              'text-xl lg:text-2xl font-bold',
              totalCriticals > 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-slate-100'
            )}>
              {totalCriticals} <span className="text-sm font-normal">건</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">기준일 초과</p>
          </div>

          {/* 최장 지연 */}
          <div className={cn(
            'rounded-xl p-4 border transition-all',
            maxDelayDays >= 14 
              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' 
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          )}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                maxDelayDays >= 14 
                  ? 'bg-orange-200 dark:bg-orange-900/50' 
                  : 'bg-slate-200 dark:bg-slate-700'
              )}>
                <Icon icon={Clock} size="sm" className={maxDelayDays >= 7 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'} />
              </div>
              <p className={cn(
                'text-xs lg:text-sm font-medium',
                maxDelayDays >= 7 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'
              )}>최장 지연</p>
            </div>
            <p className={cn(
              'text-xl lg:text-2xl font-bold',
              maxDelayDays >= 14 ? 'text-orange-700 dark:text-orange-300' : maxDelayDays >= 7 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-slate-100'
            )}>
              {maxDelayDays}<span className="text-sm font-normal">일</span>
            </p>
          </div>

          {/* 합포장 이슈 */}
          {bundleAnalysis && (
            <div 
              className={cn(
                'rounded-xl p-4 border cursor-pointer transition-all hover:shadow-md',
                bundleAnalysis.partiallyReceivedCount > 0 
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700' 
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              )}
              onClick={() => bundleAnalysis.partiallyReceivedCount > 0 && setShowBundleAnalysis(!showBundleAnalysis)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  bundleAnalysis.partiallyReceivedCount > 0 
                    ? 'bg-amber-200 dark:bg-amber-900/50' 
                    : 'bg-slate-200 dark:bg-slate-700'
                )}>
                  <Icon icon={Package} size="sm" className={bundleAnalysis.partiallyReceivedCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'} />
                </div>
                <p className={cn(
                  'text-xs lg:text-sm font-medium',
                  bundleAnalysis.partiallyReceivedCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
                )}>
                  합포장 이슈
                </p>
              </div>
              <p className={cn(
                'text-xl lg:text-2xl font-bold',
                bundleAnalysis.partiallyReceivedCount > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-900 dark:text-slate-100'
              )}>
                {bundleAnalysis.partiallyReceivedCount} <span className="text-sm font-normal">건</span>
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {bundleAnalysis.partiallyReceivedCount > 0 ? '일부 작품 미입고' : '이슈 없음'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 합포장 일부입고 상세 패널 - 스타일 개선 */}
      {showBundleAnalysis && bundleAnalysis && bundleAnalysis.partiallyReceivedOrders.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-200 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
                <Icon icon={Package} size="md" className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-amber-800 dark:text-amber-200">합포장 일부입고 주문</h3>
                <p className="text-xs text-amber-600 dark:text-amber-400">미입고 작품으로 인해 전체 주문 출고가 지연되고 있습니다</p>
              </div>
            </div>
            <button 
              onClick={() => setShowBundleAnalysis(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
            >
              <Icon icon={X} size="sm" className="text-amber-600 dark:text-amber-400" />
            </button>
          </div>
          
          <div className="space-y-2">
            {bundleAnalysis.partiallyReceivedOrders.map((order, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-4 border border-amber-200 dark:border-amber-800/50 hover:border-amber-300 dark:hover:border-amber-700 transition-all hover:shadow-md"
              >
                <div className="flex-1">
                  <button
                    onClick={() => openOrderDetailModal(order.orderCode)}
                    className="text-sm font-bold text-amber-800 dark:text-amber-200 hover:underline"
                  >
                    {order.orderCode}
                  </button>
                  <div className="flex gap-3 mt-2 text-xs flex-wrap">
                    <span className="text-slate-600 dark:text-slate-400">총 {order.totalItems}개 작품</span>
                    <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                      <Icon icon={Package} size="xs" />
                      미입고 {order.unreceivedItems}개
                    </span>
                    {order.inspectedItems > 0 && (
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                        <Icon icon={CheckCircle} size="xs" />
                        검수완료 {order.inspectedItems}개
                      </span>
                    )}
                    {(order.receivedItems - order.inspectedItems) > 0 && (
                      <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                        <Icon icon={Search} size="xs" />
                        검수대기 {order.receivedItems - order.inspectedItems}개
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-lg font-semibold">
                    작가 연락 필요
                  </span>
                  <button
                    onClick={() => openOrderDetailModal(order.orderCode)}
                    className="text-xs text-idus-500 hover:text-idus-600 dark:text-idus-400 font-semibold flex items-center gap-1"
                  >
                    상세보기 <Icon icon={ChevronRight} size="xs" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 파이프라인 흐름도 - 시각적 개선 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon={GitBranch} size="sm" className="text-slate-500 dark:text-slate-400" />
          <h2 className="font-semibold text-slate-700 dark:text-slate-300">물류 파이프라인 상세</h2>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {stages.map(([stageKey, stage], index) => {
            const meta = STAGE_META[stageKey as keyof typeof STAGE_META]
            const hasIssue = stage.criticalCount > 0
            
            return (
              <div key={stageKey} className="flex items-center">
                {/* 단계 카드 */}
                <div className={cn(
                  'py-3 px-4 rounded-xl whitespace-nowrap flex items-center gap-3 transition-all',
                  'hover:shadow-md hover:-translate-y-0.5 cursor-default',
                  hasIssue 
                    ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800' 
                    : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                )}>
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    hasIssue 
                      ? 'bg-red-100 dark:bg-red-900/50' 
                      : getStageColorClasses(meta.color, 'bg')
                  )}>
                    <Icon 
                      icon={meta.icon} 
                      size="md" 
                      className={hasIssue ? 'text-red-600 dark:text-red-400' : getStageColorClasses(meta.color, 'icon')} 
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-lg font-bold',
                        hasIssue ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-slate-100'
                      )}>
                        {stage.orderCount}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">주문</span>
                      {hasIssue && (
                        <span className="text-xs bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-medium">
                          <Icon icon={AlertTriangle} size="xs" />
                          {stage.criticalCount}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{stage.itemCount}개 작품</span>
                  </div>
                </div>
                
                {/* 화살표 - SVG 아이콘으로 개선 */}
                {index < stages.length - 1 && (
                  <div className="w-8 flex items-center justify-center">
                    <Icon icon={ChevronRight} size="md" className="text-slate-400 dark:text-slate-500" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 파이프라인 상세 카드 - 호버 효과 및 다크 모드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stages.map(([stageKey, stage]) => {
          const meta = STAGE_META[stageKey as keyof typeof STAGE_META]
          const criticalPercentage = stage.orderCount > 0 ? (stage.criticalCount / stage.orderCount) * 100 : 0
          const isExpanded = expandedCriticals.has(stageKey)
          const showMoreButton = stage.criticals.length > 3

          return (
            <div
              key={stageKey}
              className={cn(
                'bg-white dark:bg-slate-900 rounded-xl border-2 p-5 transition-all',
                'hover:shadow-lg hover:-translate-y-1',
                stage.criticalCount > 0 
                  ? 'border-l-4 border-l-red-500 border-red-200 dark:border-red-800/50' 
                  : 'border-l-4 border-l-green-500 border-slate-200 dark:border-slate-800'
              )}
            >
              {/* 헤더 - 아이콘 강조 */}
              <div className="flex items-start gap-3 mb-4">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  stage.criticalCount > 0 
                    ? 'bg-red-100 dark:bg-red-900/30' 
                    : getStageColorClasses(meta.color, 'bg')
                )}>
                  <Icon icon={meta.icon} size="lg" className={cn(
                    stage.criticalCount > 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : getStageColorClasses(meta.color, 'icon')
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{stage.title}</h3>
                  <p className="text-xs mt-0.5">
                    {stage.criticalCount > 0 ? (
                      <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                        <Icon icon={AlertTriangle} size="xs" />
                        {stage.criticalCount}건 {meta.criticalDays}일+ 지연
                      </span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Icon icon={CheckCircle} size="xs" />
                        정상 운영
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* 핵심 메트릭 - 숫자 강조 */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{stage.orderCount}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">주문</div>
                </div>
                <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-1">
                  (작품 {stage.itemCount}개)
                </div>
              </div>

              {/* 위험도 게이지 - 개선 */}
              {stage.orderCount > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-600 dark:text-slate-400">위험도</span>
                    <span className={cn(
                      'font-bold',
                      criticalPercentage > 50 ? 'text-red-600 dark:text-red-400' 
                        : criticalPercentage > 20 ? 'text-orange-600 dark:text-orange-400' 
                        : 'text-green-600 dark:text-green-400'
                    )}>
                      {Math.round(criticalPercentage)}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-700 ease-out rounded-full',
                        criticalPercentage > 50 ? 'bg-gradient-to-r from-red-400 to-red-600' 
                          : criticalPercentage > 20 ? 'bg-gradient-to-r from-orange-300 to-orange-500' 
                          : 'bg-gradient-to-r from-green-400 to-green-600'
                      )}
                      style={{ width: `${Math.max(criticalPercentage, 3)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 위험 주문 목록 - 개선 */}
              {stage.criticals.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                    <Icon icon={AlertTriangle} size="xs" className="text-red-500" />
                    위험 주문 목록
                  </div>
                  <ul className={cn('space-y-2', isExpanded ? 'max-h-48 overflow-y-auto' : '')}>
                    {stage.criticals.slice(0, isExpanded ? undefined : 3).map((critical, idx) => (
                      <li key={idx} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5 border border-red-200 dark:border-red-800/50">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => openOrderDetailModal(critical.orderCode)}
                            className="text-xs text-slate-700 dark:text-slate-300 hover:text-idus-500 dark:hover:text-idus-400 hover:underline truncate flex-1 text-left font-medium"
                            title={critical.orderCode}
                          >
                            {critical.orderCode.length > 18 
                              ? critical.orderCode.slice(0, 18) + '...'
                              : critical.orderCode}
                          </button>
                          <span className="ml-2 px-2 py-0.5 bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-bold rounded-full">
                            {critical.days}일
                          </span>
                        </div>
                        {critical.detail && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                            <Icon icon={AlertTriangle} size="xs" />
                            {critical.detail}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                  {showMoreButton && (
                    <button
                      onClick={() => toggleCriticalList(stageKey)}
                      className="w-full mt-2 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
                    >
                      {isExpanded ? '접기 ▲' : `+${stage.criticals.length - 3}건 더보기 ▼`}
                    </button>
                  )}
                </div>
              )}

              {/* 푸터 - 액션 버튼 개선 */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                {stage.criticalCount > 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <Icon icon={Zap} size="xs" />
                    {meta.action}
                  </span>
                )}
                <Link 
                  href={meta.link} 
                  className="text-xs text-idus-500 hover:text-idus-600 dark:text-idus-400 dark:hover:text-idus-300 font-semibold flex items-center gap-1 ml-auto"
                >
                  상세보기
                  <Icon icon={ChevronRight} size="xs" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* 범례 및 기획 설명 - 스타일 개선 */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
            <Icon icon={Lightbulb} size="sm" className="text-amber-500" />
          </div>
          <h3 className="font-bold text-slate-700 dark:text-slate-300">물류 관제 센터 안내</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* 상태별 위험 기준 */}
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
              <Icon icon={BarChart3} size="sm" className="text-slate-500" />
              상태별 위험 기준
            </p>
            <div className="space-y-2">
              {[
                { icon: Package, label: '미입고', days: 7, color: 'amber' },
                { icon: Truck, label: '국내배송', days: 5, color: 'blue' },
                { icon: Search, label: '검수대기', days: 2, color: 'purple' },
                { icon: CheckCircle, label: '포장대기', days: 3, color: 'green' },
                { icon: Activity, label: '국제배송', days: 14, color: 'indigo' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', getStageColorClasses(item.color, 'bg'))}>
                    <Icon icon={item.icon} size="xs" className={getStageColorClasses(item.color, 'icon')} />
                  </div>
                  <span className="text-slate-600 dark:text-slate-400">
                    {item.label}: 결제 후 <strong className="text-slate-800 dark:text-slate-200">{item.days}일+</strong> 경과 시 위험
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* 처리 로직 */}
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
              <Icon icon={FileText} size="sm" className="text-slate-500" />
              처리 로직
            </p>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded text-center leading-5 text-slate-700 dark:text-slate-300 font-bold flex-shrink-0">1</span>
                <span><strong className="text-slate-800 dark:text-slate-200">주문 단위 분류:</strong> 각 카드의 숫자는 주문 수를 의미하며, 상세 모달에서 개별 작품 상태를 확인할 수 있습니다.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded text-center leading-5 text-slate-700 dark:text-slate-300 font-bold flex-shrink-0">2</span>
                <span><strong className="text-slate-800 dark:text-slate-200">포장/출고 대기:</strong> 합포장 포함 모든 작품이 검수 완료된 주문만 해당 상태로 분류됩니다.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded text-center leading-5 text-slate-700 dark:text-slate-300 font-bold flex-shrink-0">3</span>
                <span><strong className="text-slate-800 dark:text-slate-200">합포장 이슈:</strong> 일부 작품만 입고된 합포장 주문은 별도 알림으로 표시됩니다.</span>
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
