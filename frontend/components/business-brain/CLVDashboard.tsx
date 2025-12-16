/**
 * CLVDashboard - 고객 생애 가치 대시보드
 * CLV 분석 및 세그먼트별 가치 시각화
 */

'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { 
  DollarSign, Users, TrendingUp, Award,
  ArrowUp, ArrowDown, Target
} from 'lucide-react'
import { EChartsBarChart, EChartsPieChart, EChartsTrendChart } from './charts'

interface CLVData {
  averageCLV: number
  totalCLV: number
  clvGrowth: number
  segmentCLV: Array<{
    segment: string
    avgCLV: number
    customerCount: number
    totalValue: number
    trend: 'up' | 'down' | 'stable'
  }>
  clvDistribution: Array<{
    range: string
    count: number
    percentage: number
  }>
  topCustomers: Array<{
    id: string
    name?: string
    clv: number
    orders: number
    lastOrderDate: string
  }>
  clvTrend: Array<{
    date: string
    avgCLV: number
    newCustomerCLV: number
  }>
}

interface CLVDashboardProps {
  data?: CLVData
  isLoading?: boolean
  className?: string
}

// 세그먼트 색상
const segmentColors: Record<string, string> = {
  VIP: '#8B5CF6',
  Loyal: '#3B82F6',
  Potential: '#10B981',
  New: '#06B6D4',
  AtRisk: '#F59E0B',
  Dormant: '#F97316',
  Lost: '#EF4444',
}

// 통화 포맷
const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

export function CLVDashboard({ data, isLoading, className = '' }: CLVDashboardProps) {
  // 샘플 데이터 (실제 데이터가 없을 경우)
  const clvData = useMemo<CLVData>(() => {
    if (data) return data
    
    return {
      averageCLV: 285.50,
      totalCLV: 1250000,
      clvGrowth: 12.5,
      segmentCLV: [
        { segment: 'VIP', avgCLV: 1250, customerCount: 150, totalValue: 187500, trend: 'up' },
        { segment: 'Loyal', avgCLV: 580, customerCount: 450, totalValue: 261000, trend: 'up' },
        { segment: 'Potential', avgCLV: 320, customerCount: 800, totalValue: 256000, trend: 'stable' },
        { segment: 'New', avgCLV: 120, customerCount: 1200, totalValue: 144000, trend: 'up' },
        { segment: 'AtRisk', avgCLV: 280, customerCount: 350, totalValue: 98000, trend: 'down' },
        { segment: 'Dormant', avgCLV: 150, customerCount: 600, totalValue: 90000, trend: 'down' },
      ],
      clvDistribution: [
        { range: '$0-50', count: 1500, percentage: 35 },
        { range: '$50-100', count: 900, percentage: 21 },
        { range: '$100-200', count: 750, percentage: 18 },
        { range: '$200-500', count: 650, percentage: 15 },
        { range: '$500+', count: 450, percentage: 11 },
      ],
      topCustomers: [
        { id: 'C001', name: '김**', clv: 3250, orders: 45, lastOrderDate: '2024-01-15' },
        { id: 'C002', name: '이**', clv: 2890, orders: 38, lastOrderDate: '2024-01-14' },
        { id: 'C003', name: '박**', clv: 2650, orders: 32, lastOrderDate: '2024-01-13' },
        { id: 'C004', name: '최**', clv: 2420, orders: 28, lastOrderDate: '2024-01-12' },
        { id: 'C005', name: '정**', clv: 2180, orders: 25, lastOrderDate: '2024-01-10' },
      ],
      clvTrend: Array.from({ length: 12 }, (_, i) => ({
        date: `2024-${String(i + 1).padStart(2, '0')}`,
        avgCLV: 250 + Math.random() * 50 + i * 3,
        newCustomerCLV: 80 + Math.random() * 30 + i * 2,
      })),
    }
  }, [data])

  if (isLoading) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-spin border-t-purple-600" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            CLV 데이터를 분석하고 있습니다...
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <Icon icon={DollarSign} size="lg" className="text-white" />
            </div>
            <div>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">평균 CLV</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(clvData.averageCLV)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Icon icon={Users} size="lg" className="text-white" />
            </div>
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">총 고객 가치</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(clvData.totalCLV)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <Icon icon={TrendingUp} size="lg" className="text-white" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">CLV 성장률</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                {clvData.clvGrowth > 0 ? '+' : ''}{clvData.clvGrowth.toFixed(1)}%
                {clvData.clvGrowth > 0 ? (
                  <Icon icon={ArrowUp} size="sm" className="text-emerald-500" />
                ) : (
                  <Icon icon={ArrowDown} size="sm" className="text-red-500" />
                )}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <Icon icon={Award} size="lg" className="text-white" />
            </div>
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">VIP 고객 수</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {clvData.segmentCLV.find(s => s.segment === 'VIP')?.customerCount || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 세그먼트별 CLV */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-xl">📊</span>
            세그먼트별 평균 CLV
          </h3>
          <EChartsBarChart
            data={clvData.segmentCLV.map(s => ({
              name: s.segment,
              value: s.avgCLV,
              color: segmentColors[s.segment],
            }))}
            height={300}
            valueFormatter={formatCurrency}
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-xl">🥧</span>
            CLV 분포
          </h3>
          <EChartsPieChart
            data={clvData.clvDistribution.map((d, idx) => ({
              name: d.range,
              value: d.count,
            }))}
            type="doughnut"
            height={300}
            centerText={`${clvData.clvDistribution.reduce((s, d) => s + d.count, 0).toLocaleString()}`}
            centerSubtext="총 고객"
          />
        </Card>
      </div>

      {/* CLV 트렌드 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <span className="text-xl">📈</span>
          CLV 추이
        </h3>
        <EChartsTrendChart
          series={[
            {
              name: '평균 CLV',
              data: clvData.clvTrend.map(t => ({ date: t.date, value: t.avgCLV })),
              color: '#8B5CF6',
              type: 'area',
            },
            {
              name: '신규 고객 CLV',
              data: clvData.clvTrend.map(t => ({ date: t.date, value: t.newCustomerCLV })),
              color: '#06B6D4',
              type: 'line',
            },
          ]}
          height={350}
          showDataZoom={false}
          valueFormatter={formatCurrency}
        />
      </Card>

      {/* 상위 고객 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <span className="text-xl">👑</span>
          Top 5 고가치 고객
        </h3>
        <div className="space-y-3">
          {clvData.topCustomers.map((customer, idx) => (
            <div
              key={customer.id}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                  idx === 0 ? 'bg-amber-500' :
                  idx === 1 ? 'bg-slate-400' :
                  idx === 2 ? 'bg-amber-700' : 'bg-slate-300'
                }`}>
                  {idx + 1}
                </div>
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {customer.name || customer.id}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {customer.orders}회 주문 • 최근 {customer.lastOrderDate}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(customer.clv)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">예상 CLV</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default CLVDashboard

