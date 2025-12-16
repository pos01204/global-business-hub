/**
 * CommandCenter - 비즈니스 브레인 커맨드 센터
 * 핵심 지표와 알림을 한눈에 볼 수 있는 대시보드 뷰
 */

'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { FadeIn, AnimatedNumber } from '@/components/ui/animations'
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  DollarSign, Users, ShoppingCart, Package,
  ArrowRight, Bell, Zap, Target, Activity
} from 'lucide-react'
import { EChartsTrendChart, EChartsPieChart } from './charts'

interface CommandCenterProps {
  data?: {
    kpis: Array<{
      id: string
      label: string
      value: number
      previousValue: number
      format: 'currency' | 'number' | 'percent'
      icon: string
      trend: 'up' | 'down' | 'stable'
    }>
    alerts: Array<{
      id: string
      type: 'critical' | 'warning' | 'info' | 'success'
      title: string
      description: string
      timestamp: string
      actionLabel?: string
      actionUrl?: string
    }>
    quickStats: {
      healthScore: number
      activeCustomers: number
      pendingOrders: number
      criticalIssues: number
    }
    miniTrend: Array<{ date: string; value: number }>
    segmentBreakdown: Array<{ name: string; value: number; color: string }>
  }
  isLoading?: boolean
  onAlertClick?: (alertId: string) => void
  onKPIClick?: (kpiId: string) => void
  className?: string
}

// 아이콘 매핑
const iconMap: Record<string, typeof DollarSign> = {
  dollar: DollarSign,
  users: Users,
  cart: ShoppingCart,
  package: Package,
  target: Target,
  activity: Activity,
}

// 알림 타입 스타일
const alertStyles = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500',
    badge: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-500',
    badge: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500',
    badge: 'bg-blue-500',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-500',
    badge: 'bg-emerald-500',
  },
}

// 통화 포맷
const formatValue = (value: number, format: string): string => {
  switch (format) {
    case 'currency':
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
      if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
      return `$${value.toFixed(0)}`
    case 'percent':
      return `${value.toFixed(1)}%`
    default:
      return value.toLocaleString()
  }
}

// 변화율 계산
const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export function CommandCenter({
  data,
  isLoading,
  onAlertClick,
  onKPIClick,
  className = '',
}: CommandCenterProps) {
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null)

  // 샘플 데이터
  const centerData = useMemo(() => {
    if (data) return data

    return {
      kpis: [
        { id: 'gmv', label: '총 매출 (GMV)', value: 125400, previousValue: 112300, format: 'currency' as const, icon: 'dollar', trend: 'up' as const },
        { id: 'orders', label: '주문 수', value: 1234, previousValue: 1156, format: 'number' as const, icon: 'cart', trend: 'up' as const },
        { id: 'customers', label: '활성 고객', value: 892, previousValue: 845, format: 'number' as const, icon: 'users', trend: 'up' as const },
        { id: 'conversion', label: '전환율', value: 3.2, previousValue: 2.9, format: 'percent' as const, icon: 'target', trend: 'up' as const },
      ],
      alerts: [
        { id: '1', type: 'critical' as const, title: '이탈 위험 고객 급증', description: '28명의 고객이 이탈 위험 상태입니다. 즉각적인 리텐션 조치가 필요합니다.', timestamp: '5분 전', actionLabel: '상세 보기' },
        { id: '2', type: 'warning' as const, title: '재고 부족 예상', description: '인기 상품 3개의 재고가 7일 내 소진될 예정입니다.', timestamp: '1시간 전', actionLabel: '재고 확인' },
        { id: '3', type: 'success' as const, title: '매출 목표 달성', description: '이번 달 매출 목표의 95%를 달성했습니다.', timestamp: '3시간 전' },
        { id: '4', type: 'info' as const, title: '신규 트렌드 감지', description: '핸드메이드 주얼리 카테고리 검색량이 25% 증가했습니다.', timestamp: '오늘' },
      ],
      quickStats: {
        healthScore: 78,
        activeCustomers: 892,
        pendingOrders: 45,
        criticalIssues: 3,
      },
      miniTrend: Array.from({ length: 14 }, (_, i) => ({
        date: `1/${i + 1}`,
        value: 8000 + Math.random() * 3000 + i * 100,
      })),
      segmentBreakdown: [
        { name: 'VIP', value: 150, color: '#8B5CF6' },
        { name: 'Loyal', value: 320, color: '#3B82F6' },
        { name: 'Regular', value: 280, color: '#10B981' },
        { name: 'New', value: 142, color: '#06B6D4' },
      ],
    }
  }, [data])

  if (isLoading) {
    return (
      <div className={`grid gap-6 ${className}`}>
        {/* 스켈레톤 로딩 */}
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 영역 - 건강도 점수 */}
      <FadeIn>
        <Card className="p-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">비즈니스 건강도</h2>
              <p className="text-white/80 text-sm">
                전체적인 비즈니스 상태를 종합적으로 평가합니다
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              {/* 건강도 게이지 */}
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="white"
                    strokeWidth="12"
                    strokeDasharray={`${centerData.quickStats.healthScore * 3.52} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">
                    <AnimatedNumber value={centerData.quickStats.healthScore} />
                  </span>
                  <span className="text-xs text-white/70">/ 100</span>
                </div>
              </div>

              {/* 빠른 통계 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{centerData.quickStats.activeCustomers}</p>
                  <p className="text-xs text-white/70">활성 고객</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{centerData.quickStats.pendingOrders}</p>
                  <p className="text-xs text-white/70">대기 주문</p>
                </div>
                <div className="text-center col-span-2">
                  <p className={`text-2xl font-bold ${centerData.quickStats.criticalIssues > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {centerData.quickStats.criticalIssues}
                  </p>
                  <p className="text-xs text-white/70">주의 필요 항목</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* KPI 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {centerData.kpis.map((kpi, idx) => {
          const change = calculateChange(kpi.value, kpi.previousValue)
          const IconComponent = iconMap[kpi.icon] || Activity
          const isSelected = selectedKPI === kpi.id

          return (
            <FadeIn key={kpi.id} delay={idx * 50}>
              <Card
                className={`p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
                  isSelected ? 'ring-2 ring-indigo-500' : ''
                }`}
                onClick={() => {
                  setSelectedKPI(isSelected ? null : kpi.id)
                  onKPIClick?.(kpi.id)
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    kpi.trend === 'up' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                    kpi.trend === 'down' ? 'bg-red-100 dark:bg-red-900/30' :
                    'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <Icon 
                      icon={IconComponent} 
                      size="md" 
                      className={
                        kpi.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
                        kpi.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                        'text-slate-600 dark:text-slate-400'
                      } 
                    />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    <Icon icon={change >= 0 ? TrendingUp : TrendingDown} size="sm" />
                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                  </div>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  {kpi.label}
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  <AnimatedNumber 
                    value={kpi.value} 
                    formatter={(v) => formatValue(v, kpi.format)}
                  />
                </p>
              </Card>
            </FadeIn>
          )
        })}
      </div>

      {/* 중간 섹션: 트렌드 + 세그먼트 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 미니 트렌드 차트 */}
        <FadeIn delay={100}>
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                📈 최근 14일 매출 추이
              </h3>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                상세 보기 <Icon icon={ArrowRight} size="sm" />
              </button>
            </div>
            <EChartsTrendChart
              series={[{
                name: '매출',
                data: centerData.miniTrend.map(t => ({ date: t.date, value: t.value })),
                color: '#6366F1',
                type: 'area',
              }]}
              height={200}
              showDataZoom={false}
              showLegend={false}
              valueFormatter={(v) => `$${(v / 1000).toFixed(1)}K`}
            />
          </Card>
        </FadeIn>

        {/* 세그먼트 분포 */}
        <FadeIn delay={150}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              👥 고객 세그먼트
            </h3>
            <EChartsPieChart
              data={centerData.segmentBreakdown.map(s => ({
                name: s.name,
                value: s.value,
                color: s.color,
              }))}
              type="doughnut"
              height={200}
              centerText={`${centerData.segmentBreakdown.reduce((s, d) => s + d.value, 0)}`}
              centerSubtext="총 고객"
            />
          </Card>
        </FadeIn>
      </div>

      {/* 알림 섹션 */}
      <FadeIn delay={200}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon icon={Bell} size="md" className="text-slate-600 dark:text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                알림 및 인사이트
              </h3>
              {centerData.alerts.filter(a => a.type === 'critical').length > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {centerData.alerts.filter(a => a.type === 'critical').length}
                </span>
              )}
            </div>
            <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              모두 보기
            </button>
          </div>

          <div className="space-y-3">
            {centerData.alerts.map((alert, idx) => {
              const styles = alertStyles[alert.type]
              
              return (
                <FadeIn key={alert.id} delay={250 + idx * 50}>
                  <div
                    className={`p-4 rounded-lg border ${styles.bg} ${styles.border} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => onAlertClick?.(alert.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${styles.icon}`}>
                        {alert.type === 'critical' && <Icon icon={AlertTriangle} size="md" />}
                        {alert.type === 'warning' && <Icon icon={AlertTriangle} size="md" />}
                        {alert.type === 'success' && <Icon icon={CheckCircle} size="md" />}
                        {alert.type === 'info' && <Icon icon={Zap} size="md" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-slate-800 dark:text-slate-100">
                            {alert.title}
                          </h4>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {alert.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {alert.description}
                        </p>
                        {alert.actionLabel && (
                          <button className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                            {alert.actionLabel} <Icon icon={ArrowRight} size="sm" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </Card>
      </FadeIn>
    </div>
  )
}

export default CommandCenter

