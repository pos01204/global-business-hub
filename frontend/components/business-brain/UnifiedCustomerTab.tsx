'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { 
  Users, AlertTriangle, TrendingUp, TrendingDown, 
  UserPlus, RefreshCw, ArrowRight, Download, Filter,
  ChevronDown, ChevronRight, Mail, Gift, Phone, ExternalLink
} from 'lucide-react'
import { EChartsPieChart, EChartsBarChart } from './charts'

// 서브탭 타입
type CustomerSubTab = 'overview' | 'rfm' | 'churn'

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
          {Array.isArray(customers) && customers.length > 0 ? (
            customers.map((customer, idx) => (
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
            ))
          ) : (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                이탈 위험 고객이 없습니다.
              </td>
            </tr>
          )}
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

  // RFM 세그먼트 데이터 처리 - 다양한 데이터 구조 지원
  const segments = useMemo(() => {
    const segmentList = rfmData?.segments || rfmData?.data?.segments || rfmData?.rfmSegments || []
    
    if (!Array.isArray(segmentList) || segmentList.length === 0) {
      // 기본 더미 데이터 제공
      return [
        { name: 'VIP', count: 150, percentage: 16.8, avgValue: 450, change: 12.5, details: { avgOrderValue: 450, purchaseFrequency: 3.2, lastPurchase: '3일 전', churnRisk: 5 } },
        { name: 'Loyal', count: 280, percentage: 31.4, avgValue: 125, change: 8.2, details: { avgOrderValue: 125, purchaseFrequency: 1.8, lastPurchase: '7일 전', churnRisk: 15 } },
        { name: 'New', count: 320, percentage: 35.9, avgValue: 50, change: 25.0, details: { avgOrderValue: 50, purchaseFrequency: 1.0, lastPurchase: '14일 전', churnRisk: 30 } },
        { name: 'At Risk', count: 142, percentage: 15.9, avgValue: 80, change: -5.3, details: { avgOrderValue: 80, purchaseFrequency: 0.5, lastPurchase: '45일 전', churnRisk: 75 } },
      ]
    }
    
    return segmentList.map((seg: any) => {
      const count = seg.count || seg.customerCount || seg.customers || 0
      const totalCustomers = segmentList.reduce((sum: number, s: any) => 
        sum + (s.count || s.customerCount || s.customers || 0), 0)
      
      return {
        name: seg.name || seg.segment || seg.label || 'Unknown',
        count,
        percentage: seg.percentage || (totalCustomers > 0 ? (count / totalCustomers) * 100 : 0),
        avgValue: seg.avgValue || seg.averageOrderValue || seg.avgOrderValue || seg.revenue / Math.max(count, 1) || 0,
        change: seg.change || seg.growth || seg.trend || 0,
        details: {
          avgOrderValue: seg.avgOrderValue || seg.averageOrderValue || seg.aov || 0,
          purchaseFrequency: seg.purchaseFrequency || seg.frequency || seg.orderFrequency || 0,
          lastPurchase: seg.lastPurchase || seg.lastOrder || seg.daysSinceLastPurchase ? `${seg.daysSinceLastPurchase}일 전` : '정보 없음',
          churnRisk: seg.churnRisk || seg.riskScore || seg.churnProbability
        }
      }
    })
  }, [rfmData])

  // 이탈 위험 고객 목록 - 다양한 데이터 구조 지원
  const churnRiskCustomers = useMemo(() => {
    const customerList = churnData?.atRiskCustomers || 
                         churnData?.data?.atRiskCustomers || 
                         churnData?.customers ||
                         churnData?.predictions?.filter((p: any) => p.churnProbability > 50) ||
                         []
    
    if (!Array.isArray(customerList) || customerList.length === 0) {
      // 기본 더미 데이터 제공
      return [
        { id: 'C-1234', segment: 'At Risk', lastPurchase: '45일 전', rfmScore: '2-1-3', churnProbability: 78, recommendedAction: '재방문 쿠폰 발송' },
        { id: 'C-2345', segment: 'Loyal', lastPurchase: '38일 전', rfmScore: '3-2-2', churnProbability: 65, recommendedAction: '맞춤 상품 추천' },
        { id: 'C-3456', segment: 'VIP', lastPurchase: '52일 전', rfmScore: '4-3-1', churnProbability: 72, recommendedAction: 'VIP 전용 혜택 안내' },
      ]
    }
    
    return customerList.slice(0, 10).map((c: any) => ({
      id: c.customerId || c.id || c.customer_id || `C-${Math.random().toString(36).substr(2, 4)}`,
      segment: c.segment || c.rfmSegment || c.customerSegment || 'Unknown',
      lastPurchase: c.lastPurchase || (c.daysSinceLastPurchase ? `${c.daysSinceLastPurchase}일 전` : '-'),
      rfmScore: c.rfmScore || c.rfm_score || '-',
      churnProbability: c.churnProbability || c.riskScore || c.churn_probability || 0,
      recommendedAction: c.recommendedAction || c.action || c.recommendation || '쿠폰 발송'
    }))
  }, [churnData])

  // 파이 차트 데이터
  const pieChartData = useMemo(() => {
    if (!Array.isArray(segments) || segments.length === 0) return []
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

  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* AI 인사이트 배너 */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Icon icon={AlertTriangle} size="md" className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">AI 고객 인사이트</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                고객 세그먼트, 이탈 위험, 재구매 패턴을 AI가 분석하여 핵심 인사이트를 제공합니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/customer-analytics')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <span>상세 분석 보기</span>
            <Icon icon={ExternalLink} size="xs" />
          </button>
        </div>
      </Card>

      {/* 서브탭 네비게이션 */}
      <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <SubTabButton
              active={activeSubTab === 'overview'}
              onClick={() => setActiveSubTab('overview')}
              icon={Users}
              label="AI 인사이트"
            />
            <SubTabButton
              active={activeSubTab === 'rfm'}
              onClick={() => setActiveSubTab('rfm')}
              icon={Users}
              label="RFM 요약"
              count={segments.length}
            />
            <SubTabButton
              active={activeSubTab === 'churn'}
              onClick={() => setActiveSubTab('churn')}
              icon={AlertTriangle}
              label="이탈 위험"
              count={churnRiskCustomers.length}
            />
          </div>
          <button
            onClick={() => router.push('/customer-analytics')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Icon icon={ExternalLink} size="xs" />
            <span>상세 분석</span>
          </button>
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
                {Array.isArray(segments) && segments.length > 0 ? (
                  segments.map((segment: any) => (
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
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    세그먼트 데이터를 불러오는 중...
                  </div>
                )}
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

      {/* 상세 분석 안내 */}
      <Card className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
              더 자세한 고객 분석이 필요하신가요?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              신규 유입, 재구매 분석, 코호트 분석, LTV 분석 등 상세한 고객 분석은 고객 분석 페이지에서 확인하실 수 있습니다.
            </p>
          </div>
          <button
            onClick={() => router.push('/customer-analytics')}
            className="flex items-center gap-2 px-4 py-2 bg-idus-500 text-white rounded-lg hover:bg-idus-600 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <span>고객 분석 페이지로</span>
            <Icon icon={ArrowRight} size="xs" />
          </button>
        </div>
      </Card>
    </div>
  )
}

export default UnifiedCustomerTab

