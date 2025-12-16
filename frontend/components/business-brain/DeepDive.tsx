/**
 * DeepDive - 심층 분석 뷰
 * 상세 분석 및 드릴다운 기능 제공
 */

'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { FadeIn } from '@/components/ui/animations'
import { 
  Search, Filter, ChevronRight, ChevronDown,
  TrendingUp, TrendingDown, BarChart3, PieChart,
  Users, DollarSign, Calendar, Layers, ArrowRight
} from 'lucide-react'
import { EChartsTrendChart, EChartsBarChart, EChartsPieChart } from './charts'

interface DrillDownLevel {
  id: string
  label: string
  value: string
  children?: DrillDownLevel[]
  metrics?: {
    gmv: number
    orders: number
    growth: number
  }
}

interface DeepDiveProps {
  data?: {
    dimensions: Array<{
      id: string
      name: string
      icon: string
      levels: DrillDownLevel[]
    }>
    timeSeries?: Array<{ date: string; value: number }>
    breakdown?: Array<{ name: string; value: number; percentage: number }>
  }
  isLoading?: boolean
  onDrillDown?: (path: string[]) => void
  className?: string
}

// 통화 포맷
const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

// 차원 아이콘 매핑
const dimensionIcons: Record<string, typeof Users> = {
  customer: Users,
  product: Layers,
  time: Calendar,
  revenue: DollarSign,
  category: PieChart,
}

export function DeepDive({
  data,
  isLoading,
  onDrillDown,
  className = '',
}: DeepDiveProps) {
  const [selectedDimension, setSelectedDimension] = useState<string>('customer')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [drillPath, setDrillPath] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // 샘플 데이터
  const deepDiveData = useMemo(() => {
    if (data) return data

    return {
      dimensions: [
        {
          id: 'customer',
          name: '고객 분석',
          icon: 'customer',
          levels: [
            {
              id: 'segment',
              label: '세그먼트',
              value: 'VIP',
              metrics: { gmv: 45000, orders: 150, growth: 12.5 },
              children: [
                { id: 'vip-korea', label: '국가', value: '한국', metrics: { gmv: 25000, orders: 85, growth: 15.2 } },
                { id: 'vip-japan', label: '국가', value: '일본', metrics: { gmv: 12000, orders: 42, growth: 8.3 } },
                { id: 'vip-usa', label: '국가', value: '미국', metrics: { gmv: 8000, orders: 23, growth: 18.7 } },
              ],
            },
            {
              id: 'loyal',
              label: '세그먼트',
              value: 'Loyal',
              metrics: { gmv: 35000, orders: 280, growth: 8.2 },
              children: [
                { id: 'loyal-korea', label: '국가', value: '한국', metrics: { gmv: 20000, orders: 160, growth: 10.1 } },
                { id: 'loyal-japan', label: '국가', value: '일본', metrics: { gmv: 10000, orders: 80, growth: 5.5 } },
                { id: 'loyal-usa', label: '국가', value: '미국', metrics: { gmv: 5000, orders: 40, growth: 12.3 } },
              ],
            },
            {
              id: 'new',
              label: '세그먼트',
              value: 'New',
              metrics: { gmv: 15000, orders: 320, growth: 25.0 },
              children: [
                { id: 'new-korea', label: '국가', value: '한국', metrics: { gmv: 8000, orders: 180, growth: 28.5 } },
                { id: 'new-japan', label: '국가', value: '일본', metrics: { gmv: 4000, orders: 90, growth: 20.2 } },
                { id: 'new-usa', label: '국가', value: '미국', metrics: { gmv: 3000, orders: 50, growth: 22.8 } },
              ],
            },
          ],
        },
        {
          id: 'product',
          name: '상품 분석',
          icon: 'product',
          levels: [
            {
              id: 'jewelry',
              label: '카테고리',
              value: '주얼리',
              metrics: { gmv: 42000, orders: 350, growth: 18.5 },
              children: [
                { id: 'jewelry-necklace', label: '서브카테고리', value: '목걸이', metrics: { gmv: 18000, orders: 150, growth: 22.3 } },
                { id: 'jewelry-ring', label: '서브카테고리', value: '반지', metrics: { gmv: 15000, orders: 130, growth: 15.8 } },
                { id: 'jewelry-earring', label: '서브카테고리', value: '귀걸이', metrics: { gmv: 9000, orders: 70, growth: 12.1 } },
              ],
            },
            {
              id: 'home',
              label: '카테고리',
              value: '홈데코',
              metrics: { gmv: 28000, orders: 180, growth: 10.2 },
            },
            {
              id: 'fashion',
              label: '카테고리',
              value: '패션',
              metrics: { gmv: 25000, orders: 220, growth: 8.5 },
            },
          ],
        },
        {
          id: 'time',
          name: '시간 분석',
          icon: 'time',
          levels: [
            {
              id: 'q4-2024',
              label: '분기',
              value: 'Q4 2024',
              metrics: { gmv: 95000, orders: 750, growth: 15.2 },
              children: [
                { id: 'oct-2024', label: '월', value: '10월', metrics: { gmv: 28000, orders: 220, growth: 12.5 } },
                { id: 'nov-2024', label: '월', value: '11월', metrics: { gmv: 32000, orders: 260, growth: 18.3 } },
                { id: 'dec-2024', label: '월', value: '12월', metrics: { gmv: 35000, orders: 270, growth: 14.8 } },
              ],
            },
          ],
        },
      ],
      timeSeries: Array.from({ length: 30 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        value: 3000 + Math.random() * 2000 + i * 50,
      })),
      breakdown: [
        { name: 'VIP', value: 45000, percentage: 35 },
        { name: 'Loyal', value: 35000, percentage: 27 },
        { name: 'Regular', value: 30000, percentage: 23 },
        { name: 'New', value: 15000, percentage: 15 },
      ],
    }
  }, [data])

  // 선택된 차원 데이터
  const selectedDimensionData = deepDiveData.dimensions.find(d => d.id === selectedDimension)

  // 노드 확장 토글
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  // 드릴다운 경로 추가
  const addToDrillPath = (value: string) => {
    const newPath = [...drillPath, value]
    setDrillPath(newPath)
    onDrillDown?.(newPath)
  }

  // 경로에서 특정 위치로 이동
  const navigateToPath = (index: number) => {
    const newPath = drillPath.slice(0, index + 1)
    setDrillPath(newPath)
    onDrillDown?.(newPath)
  }

  // 재귀적 트리 렌더링
  const renderTree = (nodes: DrillDownLevel[], depth = 0) => {
    return nodes.map(node => {
      const isExpanded = expandedNodes.has(node.id)
      const hasChildren = node.children && node.children.length > 0

      return (
        <div key={node.id} style={{ marginLeft: depth * 16 }}>
          <div
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
              isExpanded 
                ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                : 'hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            onClick={() => {
              if (hasChildren) {
                toggleNode(node.id)
              }
              addToDrillPath(node.value)
            }}
          >
            <div className="flex items-center gap-3">
              {hasChildren && (
                <Icon
                  icon={isExpanded ? ChevronDown : ChevronRight}
                  size="sm"
                  className="text-slate-400"
                />
              )}
              {!hasChildren && <div className="w-4" />}
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{node.label}</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">{node.value}</p>
              </div>
            </div>

            {node.metrics && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(node.metrics.gmv)}
                  </p>
                  <p className="text-xs text-slate-500">{node.metrics.orders} 주문</p>
                </div>
                <Badge variant={node.metrics.growth >= 10 ? 'success' : node.metrics.growth >= 0 ? 'warning' : 'danger'}>
                  {node.metrics.growth >= 0 ? '+' : ''}{node.metrics.growth.toFixed(1)}%
                </Badge>
              </div>
            )}
          </div>

          {hasChildren && isExpanded && (
            <div className="mt-1">
              {renderTree(node.children!, depth + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  if (isLoading) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            데이터를 분석하고 있습니다...
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Icon icon={Search} size="md" className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                심층 분석
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                데이터를 다양한 차원에서 탐색하세요
              </p>
            </div>
          </div>

          {/* 검색 */}
          <div className="relative w-64">
            <Icon icon={Search} size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
            />
          </div>
        </div>

        {/* 브레드크럼 */}
        {drillPath.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setDrillPath([])}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              전체
            </button>
            {drillPath.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Icon icon={ChevronRight} size="sm" className="text-slate-400" />
                <button
                  onClick={() => navigateToPath(idx)}
                  className={`text-sm ${
                    idx === drillPath.length - 1 
                      ? 'font-medium text-slate-800 dark:text-slate-200' 
                      : 'text-indigo-600 dark:text-indigo-400 hover:underline'
                  }`}
                >
                  {item}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 차원 선택 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {deepDiveData.dimensions.map(dim => {
          const DimIcon = dimensionIcons[dim.icon] || BarChart3
          const isSelected = selectedDimension === dim.id

          return (
            <button
              key={dim.id}
              onClick={() => setSelectedDimension(dim.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Icon icon={DimIcon} size="sm" />
              {dim.name}
            </button>
          )
        })}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 트리 뷰 */}
        <Card className="p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            {selectedDimensionData?.name} 계층 구조
          </h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {selectedDimensionData && renderTree(selectedDimensionData.levels)}
          </div>
        </Card>

        {/* 사이드바: 요약 차트 */}
        <div className="space-y-4">
          {/* 분포 차트 */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              📊 분포
            </h3>
            {deepDiveData.breakdown && (
              <EChartsPieChart
                data={deepDiveData.breakdown.map(b => ({
                  name: b.name,
                  value: b.value,
                }))}
                type="doughnut"
                height={200}
                centerText={formatCurrency(deepDiveData.breakdown.reduce((s, b) => s + b.value, 0))}
                centerSubtext="총 매출"
              />
            )}
          </Card>

          {/* 트렌드 차트 */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              📈 트렌드
            </h3>
            {deepDiveData.timeSeries && (
              <EChartsTrendChart
                series={[{
                  name: '매출',
                  data: deepDiveData.timeSeries.map(t => ({
                    date: t.date,
                    value: t.value,
                  })),
                  color: '#3B82F6',
                  type: 'area',
                }]}
                height={180}
                showDataZoom={false}
                showLegend={false}
                valueFormatter={formatCurrency}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DeepDive

