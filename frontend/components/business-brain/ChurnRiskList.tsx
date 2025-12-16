/**
 * ChurnRiskList - 이탈 위험 고객 목록
 * 이탈 위험 고객 식별 및 관리
 */

'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { 
  AlertTriangle, Users, TrendingDown, Clock,
  ChevronDown, ChevronUp, Mail, Phone, FileText,
  Filter, Search
} from 'lucide-react'
import { EChartsPieChart, EChartsBarChart } from './charts'

interface ChurnRiskCustomer {
  id: string
  name?: string
  email?: string
  riskScore: number // 0-100
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  daysSinceLastOrder: number
  totalOrders: number
  totalSpent: number
  lastOrderDate: string
  riskFactors: string[]
  recommendedActions: string[]
}

interface ChurnRiskData {
  summary: {
    totalAtRisk: number
    criticalCount: number
    highCount: number
    mediumCount: number
    potentialLostRevenue: number
  }
  riskDistribution: Array<{
    level: string
    count: number
    percentage: number
  }>
  customers: ChurnRiskCustomer[]
  riskTrend: Array<{
    date: string
    criticalCount: number
    highCount: number
  }>
}

interface ChurnRiskListProps {
  data?: ChurnRiskData
  isLoading?: boolean
  className?: string
  onCustomerSelect?: (customer: ChurnRiskCustomer) => void
  onSendRetention?: (customerId: string) => void
}

// 위험 수준 색상
const riskColors: Record<string, { bg: string; text: string; border: string }> = {
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
  },
  high: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-700',
  },
  medium: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
  },
  low: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
  },
}

// 통화 포맷
const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

export function ChurnRiskList({ 
  data, 
  isLoading, 
  className = '',
  onCustomerSelect,
  onSendRetention 
}: ChurnRiskListProps) {
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 샘플 데이터
  const churnData = useMemo<ChurnRiskData>(() => {
    if (data) return data

    return {
      summary: {
        totalAtRisk: 245,
        criticalCount: 28,
        highCount: 67,
        mediumCount: 150,
        potentialLostRevenue: 125000,
      },
      riskDistribution: [
        { level: 'Critical', count: 28, percentage: 11 },
        { level: 'High', count: 67, percentage: 27 },
        { level: 'Medium', count: 150, percentage: 62 },
      ],
      customers: [
        {
          id: 'C001',
          name: '김**',
          email: 'kim***@email.com',
          riskScore: 92,
          riskLevel: 'critical',
          daysSinceLastOrder: 45,
          totalOrders: 12,
          totalSpent: 580,
          lastOrderDate: '2023-12-01',
          riskFactors: ['45일 이상 미구매', '구매 빈도 급감', '장바구니 이탈 증가'],
          recommendedActions: ['개인화 할인 쿠폰 발송', '신제품 추천 이메일', '재구매 리마인더'],
        },
        {
          id: 'C002',
          name: '이**',
          email: 'lee***@email.com',
          riskScore: 85,
          riskLevel: 'critical',
          daysSinceLastOrder: 38,
          totalOrders: 8,
          totalSpent: 420,
          lastOrderDate: '2023-12-08',
          riskFactors: ['30일 이상 미구매', '평균 주문 금액 감소'],
          recommendedActions: ['VIP 전용 혜택 안내', '피드백 요청 이메일'],
        },
        {
          id: 'C003',
          name: '박**',
          email: 'park***@email.com',
          riskScore: 78,
          riskLevel: 'high',
          daysSinceLastOrder: 28,
          totalOrders: 15,
          totalSpent: 890,
          lastOrderDate: '2023-12-18',
          riskFactors: ['구매 주기 이탈', '최근 부정적 리뷰'],
          recommendedActions: ['고객 만족도 조사', '특별 사은품 제공'],
        },
        {
          id: 'C004',
          name: '최**',
          email: 'choi***@email.com',
          riskScore: 65,
          riskLevel: 'high',
          daysSinceLastOrder: 21,
          totalOrders: 6,
          totalSpent: 320,
          lastOrderDate: '2023-12-25',
          riskFactors: ['구매 빈도 감소 추세'],
          recommendedActions: ['관심 카테고리 신상품 알림'],
        },
        {
          id: 'C005',
          name: '정**',
          email: 'jung***@email.com',
          riskScore: 52,
          riskLevel: 'medium',
          daysSinceLastOrder: 14,
          totalOrders: 4,
          totalSpent: 180,
          lastOrderDate: '2024-01-02',
          riskFactors: ['신규 고객 이탈 패턴'],
          recommendedActions: ['웰컴 시리즈 이메일', '첫 구매 후속 할인'],
        },
      ],
      riskTrend: Array.from({ length: 7 }, (_, i) => ({
        date: `1/${i + 10}`,
        criticalCount: 25 + Math.floor(Math.random() * 10),
        highCount: 60 + Math.floor(Math.random() * 15),
      })),
    }
  }, [data])

  // 필터링된 고객 목록
  const filteredCustomers = useMemo(() => {
    return churnData.customers.filter(customer => {
      const matchesLevel = filterLevel === 'all' || customer.riskLevel === filterLevel
      const matchesSearch = !searchQuery || 
        customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.id.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesLevel && matchesSearch
    })
  }, [churnData.customers, filterLevel, searchQuery])

  if (isLoading) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-red-200 dark:border-red-800 rounded-full animate-spin border-t-red-600" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            이탈 위험 고객을 분석하고 있습니다...
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <Icon icon={AlertTriangle} size="lg" className="text-white" />
            </div>
            <div>
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">위험 고객</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {churnData.summary.totalAtRisk}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">🚨</span>
            </div>
            <div>
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Critical</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {churnData.summary.criticalCount}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">High Risk</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {churnData.summary.highCount}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-500 rounded-xl flex items-center justify-center shadow-lg">
              <Icon icon={TrendingDown} size="lg" className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">예상 손실</p>
              <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                {formatCurrency(churnData.summary.potentialLostRevenue)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 위험 분포 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            🎯 위험 수준 분포
          </h3>
          <EChartsPieChart
            data={churnData.riskDistribution.map(d => ({
              name: d.level,
              value: d.count,
              color: d.level === 'Critical' ? '#EF4444' : 
                     d.level === 'High' ? '#F97316' : '#F59E0B',
            }))}
            type="doughnut"
            height={280}
            centerText={`${churnData.summary.totalAtRisk}`}
            centerSubtext="총 위험 고객"
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            📈 일별 위험 고객 추이
          </h3>
          <EChartsBarChart
            series={[
              { 
                name: 'Critical', 
                data: churnData.riskTrend.map(t => t.criticalCount),
                color: '#EF4444',
              },
              { 
                name: 'High', 
                data: churnData.riskTrend.map(t => t.highCount),
                color: '#F97316',
              },
            ]}
            categories={churnData.riskTrend.map(t => t.date)}
            height={280}
            stacked={true}
          />
        </Card>
      </div>

      {/* 고객 목록 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            👥 이탈 위험 고객 목록
          </h3>
          
          {/* 필터 */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Icon icon={Search} size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="고객 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">전체</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredCustomers.map((customer) => {
            const isExpanded = expandedCustomer === customer.id
            const colors = riskColors[customer.riskLevel]

            return (
              <div
                key={customer.id}
                className={`border rounded-lg overflow-hidden transition-all ${colors.border}`}
              >
                {/* 헤더 */}
                <div
                  className={`p-4 cursor-pointer ${colors.bg}`}
                  onClick={() => setExpandedCustomer(isExpanded ? null : customer.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* 위험 점수 게이지 */}
                      <div className="relative w-14 h-14">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-slate-200 dark:text-slate-700"
                          />
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeDasharray={`${customer.riskScore * 1.5} 150`}
                            className={
                              customer.riskLevel === 'critical' ? 'text-red-500' :
                              customer.riskLevel === 'high' ? 'text-orange-500' : 'text-amber-500'
                            }
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-sm font-bold ${colors.text}`}>
                            {customer.riskScore}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {customer.name || customer.id}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {customer.daysSinceLastOrder}일 전 마지막 주문 • 총 {customer.totalOrders}회
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(customer.totalSpent)}
                        </p>
                        <p className="text-xs text-slate-500">총 구매액</p>
                      </div>
                      <Badge variant={
                        customer.riskLevel === 'critical' ? 'danger' :
                        customer.riskLevel === 'high' ? 'warning' : 'default'
                      }>
                        {customer.riskLevel.toUpperCase()}
                      </Badge>
                      <Icon 
                        icon={isExpanded ? ChevronUp : ChevronDown} 
                        size="sm" 
                        className="text-slate-400" 
                      />
                    </div>
                  </div>
                </div>

                {/* 상세 정보 */}
                {isExpanded && (
                  <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* 위험 요인 */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          🔍 위험 요인
                        </h4>
                        <ul className="space-y-1">
                          {customer.riskFactors.map((factor, idx) => (
                            <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 권장 조치 */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          💡 권장 조치
                        </h4>
                        <ul className="space-y-1">
                          {customer.recommendedActions.map((action, idx) => (
                            <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                              <span className="text-emerald-500 mt-1">•</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => onSendRetention?.(customer.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                      >
                        <Icon icon={Mail} size="sm" />
                        리텐션 이메일 발송
                      </button>
                      <button
                        onClick={() => onCustomerSelect?.(customer)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                      >
                        <Icon icon={FileText} size="sm" />
                        상세 보기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl">✅</span>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              해당 조건의 이탈 위험 고객이 없습니다.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default ChurnRiskList

