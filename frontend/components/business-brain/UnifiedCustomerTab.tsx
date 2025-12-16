'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { 
  Users, AlertTriangle, TrendingUp, TrendingDown, 
  UserPlus, RefreshCw, ArrowRight, Download, Filter,
  ChevronDown, ChevronRight, Mail, Gift, Phone
} from 'lucide-react'
import { EChartsPieChart, EChartsBarChart } from './charts'

// 서브탭 타입
type CustomerSubTab = 'overview' | 'rfm' | 'churn' | 'acquisition' | 'retention'

// 포맷팅 함수
function formatNumber(value: number): string {
  return value.toLocaleString()
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

// 세그먼트 색상 매핑
const segmentColors: Record<string, string> = {
  'VIP': '#8B5CF6',
  'Loyal': '#3B82F6',
  'Regular': '#10B981',
  'New': '#F59E0B',
  'At Risk': '#EF4444',
  'Churned': '#6B7280'
}

// 서브탭 버튼 컴포넌트
function SubTabButton({ 
  active, 
  onClick, 
  icon, 
  label, 
  count 
}: { 
  active: boolean
  onClick: () => void
  icon: any
  label: string
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-200
        ${active 
          ? 'bg-idus-500 text-white shadow-md' 
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
        }
      `}
    >
      <Icon icon={icon} size="sm" />
      <span>{label}</span>
      {count !== undefined && (
        <Badge className={active ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'}>
          {count}
        </Badge>
      )}
    </button>
  )
}

// 세그먼트 카드 컴포넌트
function SegmentCard({
  name,
  count,
  percentage,
  avgValue,
  change,
  onClick,
  isExpanded,
  details
}: {
  name: string
  count: number
  percentage: number
  avgValue: number
  change?: number
  onClick: () => void
  isExpanded: boolean
  details?: {
    avgOrderValue: number
    purchaseFrequency: number
    lastPurchase: string
    churnRisk?: number
  }
}) {
  const color = segmentColors[name] || '#6B7280'
  
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div 
        onClick={onClick}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div 
            className="w-3 h-12 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-100">{name}</span>
              <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {percentage.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {formatNumber(count)}명 · 평균 {formatCurrency(avgValue)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              change >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              <Icon icon={change >= 0 ? TrendingUp : TrendingDown} size="xs" />
              {formatPercent(change)}
            </div>
          )}
          <Icon 
            icon={isExpanded ? ChevronDown : ChevronRight} 
            size="sm" 
            className="text-slate-400"
          />
        </div>
      </div>
      
      {isExpanded && details && (
        <div className="px-4 pb-4 pt-2 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">평균 주문 금액</p>
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {formatCurrency(details.avgOrderValue)}
              </p>
            </div>
            <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">구매 빈도</p>
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {details.purchaseFrequency.toFixed(1)}회/월
              </p>
            </div>
            <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">마지막 구매</p>
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {details.lastPurchase}
              </p>
            </div>
            {details.churnRisk !== undefined && (
              <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">이탈 위험</p>
                <p className={`font-semibold ${
                  details.churnRisk >= 70 ? 'text-red-600' :
                  details.churnRisk >= 40 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {details.churnRisk}%
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-idus-500 text-white rounded-lg hover:bg-idus-600 transition-colors text-sm font-medium">
              <Icon icon={Mail} size="xs" />
              이메일 캠페인
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium">
              <Icon icon={Gift} size="xs" />
              쿠폰 발송
            </button>
            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              <Icon icon={Download} size="sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 이탈 위험 고객 테이블
function ChurnRiskTable({ customers }: { customers: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">고객 ID</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">세그먼트</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">마지막 구매</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">RFM 점수</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">이탈 확률</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">권장 액션</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, idx) => (
            <tr 
              key={idx}
              className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-100">
                {customer.id}
              </td>
              <td className="py-3 px-4">
                <span 
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `${segmentColors[customer.segment]}20`,
                    color: segmentColors[customer.segment]
                  }}
                >
                  {customer.segment}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                {customer.lastPurchase}
              </td>
              <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                {customer.rfmScore}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        customer.churnProbability >= 70 ? 'bg-red-500' :
                        customer.churnProbability >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${customer.churnProbability}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${
                    customer.churnProbability >= 70 ? 'text-red-600' :
                    customer.churnProbability >= 40 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {customer.churnProbability}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <button className="px-3 py-1.5 text-xs font-medium text-idus-600 bg-idus-50 dark:bg-idus-900/30 rounded-lg hover:bg-idus-100 dark:hover:bg-idus-900/50 transition-colors">
                  {customer.recommendedAction}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// 메인 통합 고객 탭 컴포넌트
interface UnifiedCustomerTabProps {
  rfmData: any
  churnData: any
  newUserData: any
  repurchaseData: any
  isLoading: boolean
  period: string
}

export function UnifiedCustomerTab({
  rfmData,
  churnData,
  newUserData,
  repurchaseData,
  isLoading
}: UnifiedCustomerTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<CustomerSubTab>('overview')
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null)

  // RFM 세그먼트 데이터 처리
  const segments = useMemo(() => {
    if (!rfmData?.segments) return []
    return rfmData.segments.map((seg: any) => ({
      name: seg.name || seg.segment,
      count: seg.count || seg.customerCount || 0,
      percentage: seg.percentage || 0,
      avgValue: seg.avgValue || seg.averageOrderValue || 0,
      change: seg.change,
      details: {
        avgOrderValue: seg.avgOrderValue || seg.averageOrderValue || 0,
        purchaseFrequency: seg.purchaseFrequency || 0,
        lastPurchase: seg.lastPurchase || '정보 없음',
        churnRisk: seg.churnRisk
      }
    }))
  }, [rfmData])

  // 이탈 위험 고객 목록
  const churnRiskCustomers = useMemo(() => {
    if (!churnData?.atRiskCustomers) return []
    return churnData.atRiskCustomers.slice(0, 10).map((c: any) => ({
      id: c.customerId || c.id,
      segment: c.segment || 'Unknown',
      lastPurchase: c.lastPurchase || c.daysSinceLastPurchase + '일 전',
      rfmScore: c.rfmScore || '-',
      churnProbability: c.churnProbability || c.riskScore || 0,
      recommendedAction: c.recommendedAction || '쿠폰 발송'
    }))
  }, [churnData])

  // 파이 차트 데이터
  const pieChartData = useMemo(() => {
    return segments.map((seg: any) => ({
      name: seg.name,
      value: seg.count,
      color: segmentColors[seg.name]
    }))
  }, [segments])

  // 총 고객 수
  const totalCustomers = useMemo(() => {
    return segments.reduce((sum: number, seg: any) => sum + seg.count, 0)
  }, [segments])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 서브탭 네비게이션 */}
      <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <SubTabButton
            active={activeSubTab === 'overview'}
            onClick={() => setActiveSubTab('overview')}
            icon={Users}
            label="전체 현황"
          />
          <SubTabButton
            active={activeSubTab === 'rfm'}
            onClick={() => setActiveSubTab('rfm')}
            icon={Users}
            label="RFM 세그먼트"
            count={segments.length}
          />
          <SubTabButton
            active={activeSubTab === 'churn'}
            onClick={() => setActiveSubTab('churn')}
            icon={AlertTriangle}
            label="이탈 위험"
            count={churnRiskCustomers.length}
          />
          <SubTabButton
            active={activeSubTab === 'acquisition'}
            onClick={() => setActiveSubTab('acquisition')}
            icon={UserPlus}
            label="신규 유입"
          />
          <SubTabButton
            active={activeSubTab === 'retention'}
            onClick={() => setActiveSubTab('retention')}
            icon={RefreshCw}
            label="재구매 분석"
          />
        </div>
      </Card>

      {/* 전체 현황 */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 세그먼트 분포 */}
          <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">고객 세그먼트 분포</h3>
            <div className="h-64">
              <EChartsPieChart
                data={pieChartData}
                height={240}
                showLegend={true}
                centerText={`${formatNumber(totalCustomers)}\n총 고객`}
              />
            </div>
          </Card>

          {/* 주요 지표 */}
          <Card className="lg:col-span-2 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">고객 인사이트</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">VIP 고객</p>
                <p className="text-2xl font-bold text-purple-600">
                  {segments.find((s: any) => s.name === 'VIP')?.count || 0}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">이탈 위험</p>
                <p className="text-2xl font-bold text-red-600">
                  {churnData?.summary?.atRiskCount || 0}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">신규 고객</p>
                <p className="text-2xl font-bold text-amber-600">
                  {segments.find((s: any) => s.name === 'New')?.count || 0}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">재구매율</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {repurchaseData?.overallRate?.toFixed(1) || 0}%
                </p>
              </div>
            </div>

            {/* 빠른 인사이트 */}
            <div className="space-y-3">
              {churnData?.summary?.atRiskCount > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <Icon icon={AlertTriangle} size="sm" className="text-red-500" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>{churnData.summary.atRiskCount}명</strong>의 고객이 이탈 위험 상태입니다. 즉각적인 리텐션 조치가 필요합니다.
                  </p>
                  <button 
                    onClick={() => setActiveSubTab('churn')}
                    className="ml-auto text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    확인 <Icon icon={ArrowRight} size="xs" />
                  </button>
                </div>
              )}
              
              {newUserData?.summary?.conversionRate && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <Icon icon={TrendingUp} size="sm" className="text-emerald-500" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    신규 고객 전환율이 <strong>{newUserData.summary.conversionRate.toFixed(1)}%</strong>입니다.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* RFM 세그먼트 */}
      {activeSubTab === 'rfm' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">세그먼트별 고객</h3>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  <Icon icon={Download} size="xs" />
                  CSV 내보내기
                </button>
              </div>
              
              <div className="space-y-3">
                {segments.map((segment: any) => (
                  <SegmentCard
                    key={segment.name}
                    name={segment.name}
                    count={segment.count}
                    percentage={segment.percentage}
                    avgValue={segment.avgValue}
                    change={segment.change}
                    onClick={() => setExpandedSegment(
                      expandedSegment === segment.name ? null : segment.name
                    )}
                    isExpanded={expandedSegment === segment.name}
                    details={segment.details}
                  />
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">분포</h3>
              <div className="h-64">
                <EChartsPieChart
                  data={pieChartData}
                  height={240}
                  showLegend={true}
                  centerText={`${formatNumber(totalCustomers)}\n총 고객`}
                />
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">세그먼트 가이드</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: segmentColors.VIP }} />
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">VIP</p>
                    <p className="text-slate-500 dark:text-slate-400">최근 구매 + 높은 빈도 + 높은 금액</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: segmentColors.Loyal }} />
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">Loyal</p>
                    <p className="text-slate-500 dark:text-slate-400">꾸준한 구매 패턴</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: segmentColors['At Risk'] }} />
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">At Risk</p>
                    <p className="text-slate-500 dark:text-slate-400">구매 감소 추세, 이탈 위험</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 이탈 위험 */}
      {activeSubTab === 'churn' && (
        <div className="space-y-6">
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400 mb-1">고위험 고객</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {churnData?.summary?.highRiskCount || 0}
              </p>
            </Card>
            <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">중위험 고객</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {churnData?.summary?.mediumRiskCount || 0}
              </p>
            </Card>
            <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">저위험 고객</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {churnData?.summary?.lowRiskCount || 0}
              </p>
            </Card>
            <Card className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">예상 손실 매출</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {formatCurrency(churnData?.summary?.potentialLoss || 0)}
              </p>
            </Card>
          </div>

          {/* 이탈 위험 고객 테이블 */}
          <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">이탈 위험 고객 명단</h3>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  <Icon icon={Filter} size="xs" />
                  필터
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-idus-500 rounded-lg hover:bg-idus-600 transition-colors">
                  <Icon icon={Mail} size="xs" />
                  일괄 캠페인
                </button>
              </div>
            </div>
            
            {churnRiskCustomers.length > 0 ? (
              <ChurnRiskTable customers={churnRiskCustomers} />
            ) : (
              <div className="text-center py-12 text-slate-400">
                이탈 위험 고객이 없습니다.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 신규 유입 */}
      {activeSubTab === 'acquisition' && (
        <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">신규 고객 유입 분석</h3>
          {newUserData ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">신규 고객 수</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {newUserData.summary?.newCustomers || 0}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">전환율</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {newUserData.summary?.conversionRate?.toFixed(1) || 0}%
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">첫 구매 금액</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(newUserData.summary?.avgFirstOrderValue || 0)}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">CAC</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(newUserData.summary?.cac || 0)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              신규 고객 데이터를 불러오는 중...
            </div>
          )}
        </Card>
      )}

      {/* 재구매 분석 */}
      {activeSubTab === 'retention' && (
        <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">재구매율 분석</h3>
          {repurchaseData ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">전체 재구매율</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {repurchaseData.overallRate?.toFixed(1) || 0}%
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">30일 재구매율</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {repurchaseData.rate30d?.toFixed(1) || 0}%
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">평균 재구매 주기</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {repurchaseData.avgCycle || 0}일
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">재구매 고객 LTV</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(repurchaseData.repeatCustomerLTV || 0)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              재구매 데이터를 불러오는 중...
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default UnifiedCustomerTab

