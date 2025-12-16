/**
 * SimulationResults - 시뮬레이션 결과 시각화
 * What-if 시나리오 및 몬테카를로 시뮬레이션 결과 표시
 */

'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { FadeIn, AnimatedNumber } from '@/components/ui/animations'
import { 
  TrendingUp, TrendingDown, Minus, Play, RefreshCw,
  ArrowRight, ChevronDown, ChevronUp, Target, Zap
} from 'lucide-react'
import { EChartsTrendChart, EChartsBarChart } from './charts'

interface SimulationScenario {
  id: string
  name: string
  description: string
  parameters: Record<string, number>
  results: {
    baseline: number
    simulated: number
    change: number
    changePercent: number
    confidence: number
  }
  distribution?: number[]
  percentiles?: {
    p5: number
    p25: number
    p50: number
    p75: number
    p95: number
  }
}

interface SimulationResultsProps {
  scenarios?: SimulationScenario[]
  isLoading?: boolean
  onRunSimulation?: (scenarioId: string) => void
  onCompare?: (scenarioIds: string[]) => void
  className?: string
}

// 통화 포맷
const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

// 퍼센트 포맷
const formatPercent = (value: number): string => {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function SimulationResults({
  scenarios,
  isLoading,
  onRunSimulation,
  onCompare,
  className = '',
}: SimulationResultsProps) {
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])

  // 샘플 데이터
  const simulationData = useMemo<SimulationScenario[]>(() => {
    if (scenarios) return scenarios

    return [
      {
        id: '1',
        name: '가격 인상 시나리오',
        description: '전체 상품 가격을 10% 인상했을 때의 예상 매출 변화',
        parameters: { priceChange: 10, demandElasticity: -1.2 },
        results: {
          baseline: 125000,
          simulated: 118750,
          change: -6250,
          changePercent: -5.0,
          confidence: 78,
        },
        distribution: Array.from({ length: 50 }, (_, i) => 
          100000 + Math.random() * 40000 + (i < 25 ? i * 500 : (50 - i) * 500)
        ),
        percentiles: {
          p5: 105000,
          p25: 112000,
          p50: 118750,
          p75: 125000,
          p95: 135000,
        },
      },
      {
        id: '2',
        name: '마케팅 투자 증가',
        description: '마케팅 예산을 20% 증가시켰을 때의 예상 고객 유입 효과',
        parameters: { marketingBudgetIncrease: 20, conversionRate: 3.2 },
        results: {
          baseline: 125000,
          simulated: 143750,
          change: 18750,
          changePercent: 15.0,
          confidence: 72,
        },
        distribution: Array.from({ length: 50 }, (_, i) => 
          130000 + Math.random() * 30000 + (i < 25 ? i * 400 : (50 - i) * 400)
        ),
        percentiles: {
          p5: 132000,
          p25: 138000,
          p50: 143750,
          p75: 150000,
          p95: 160000,
        },
      },
      {
        id: '3',
        name: '신규 카테고리 확장',
        description: '핸드메이드 주얼리 카테고리를 확장했을 때의 매출 기여도',
        parameters: { newCategoryShare: 15, avgOrderValue: 85 },
        results: {
          baseline: 125000,
          simulated: 156250,
          change: 31250,
          changePercent: 25.0,
          confidence: 65,
        },
        distribution: Array.from({ length: 50 }, (_, i) => 
          140000 + Math.random() * 40000 + (i < 25 ? i * 600 : (50 - i) * 600)
        ),
        percentiles: {
          p5: 142000,
          p25: 150000,
          p50: 156250,
          p75: 165000,
          p95: 180000,
        },
      },
      {
        id: '4',
        name: '이탈 방지 캠페인',
        description: '이탈 위험 고객 대상 리텐션 캠페인 실행 시 효과',
        parameters: { retentionRate: 25, avgCustomerValue: 280 },
        results: {
          baseline: 125000,
          simulated: 131250,
          change: 6250,
          changePercent: 5.0,
          confidence: 82,
        },
        distribution: Array.from({ length: 50 }, (_, i) => 
          125000 + Math.random() * 15000 + (i < 25 ? i * 200 : (50 - i) * 200)
        ),
        percentiles: {
          p5: 127000,
          p25: 129000,
          p50: 131250,
          p75: 134000,
          p95: 138000,
        },
      },
    ]
  }, [scenarios])

  // 비교 토글
  const toggleCompare = (id: string) => {
    setSelectedForCompare(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  // 비교 실행
  const handleCompare = () => {
    if (selectedForCompare.length >= 2) {
      onCompare?.(selectedForCompare)
    }
  }

  if (isLoading) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 rounded-full animate-spin border-t-indigo-600" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            시뮬레이션을 실행하고 있습니다...
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <Card className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Icon icon={Zap} size="lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold">시뮬레이션 결과</h2>
              <p className="text-white/80 text-sm">
                {simulationData.length}개의 시나리오 분석 완료
              </p>
            </div>
          </div>
          
          {selectedForCompare.length >= 2 && (
            <button
              onClick={handleCompare}
              className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-white/90 transition-colors font-medium"
            >
              <Icon icon={Target} size="sm" />
              {selectedForCompare.length}개 비교
            </button>
          )}
        </div>
      </Card>

      {/* 시나리오 요약 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {simulationData.map((scenario, idx) => {
          const isPositive = scenario.results.changePercent >= 0
          
          return (
            <FadeIn key={scenario.id} delay={idx * 50}>
              <Card
                className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                  selectedForCompare.includes(scenario.id) 
                    ? 'ring-2 ring-indigo-500' 
                    : ''
                }`}
                onClick={() => toggleCompare(scenario.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isPositive 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <Icon 
                      icon={isPositive ? TrendingUp : TrendingDown} 
                      size="sm" 
                      className={isPositive ? 'text-emerald-600' : 'text-red-600'} 
                    />
                  </div>
                  <Badge variant={
                    scenario.results.confidence >= 80 ? 'success' :
                    scenario.results.confidence >= 60 ? 'warning' : 'default'
                  }>
                    {scenario.results.confidence}% 신뢰도
                  </Badge>
                </div>

                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1 text-sm">
                  {scenario.name}
                </h3>
                
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${
                    isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatPercent(scenario.results.changePercent)}
                  </span>
                  <span className="text-sm text-slate-500">
                    ({formatCurrency(scenario.results.change)})
                  </span>
                </div>
              </Card>
            </FadeIn>
          )
        })}
      </div>

      {/* 상세 시나리오 목록 */}
      <div className="space-y-4">
        {simulationData.map((scenario, idx) => {
          const isExpanded = expandedScenario === scenario.id
          const isPositive = scenario.results.changePercent >= 0

          return (
            <FadeIn key={scenario.id} delay={idx * 50}>
              <Card className="overflow-hidden">
                {/* 헤더 */}
                <div
                  className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  onClick={() => setExpandedScenario(isExpanded ? null : scenario.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isPositive 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        <Icon 
                          icon={isPositive ? TrendingUp : TrendingDown} 
                          size="lg" 
                          className={isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} 
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                          {scenario.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {scenario.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* 결과 요약 */}
                      <div className="text-right hidden md:block">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">기준:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {formatCurrency(scenario.results.baseline)}
                          </span>
                          <Icon icon={ArrowRight} size="sm" className="text-slate-400" />
                          <span className="text-sm text-slate-500">예상:</span>
                          <span className={`font-bold ${
                            isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {formatCurrency(scenario.results.simulated)}
                          </span>
                        </div>
                        <p className={`text-sm font-medium ${
                          isPositive ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {formatPercent(scenario.results.changePercent)}
                        </p>
                      </div>

                      <Badge variant={
                        scenario.results.confidence >= 80 ? 'success' :
                        scenario.results.confidence >= 60 ? 'warning' : 'default'
                      }>
                        {scenario.results.confidence}%
                      </Badge>

                      <Icon
                        icon={isExpanded ? ChevronUp : ChevronDown}
                        size="md"
                        className="text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 상세 내용 */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                      {/* 분포 차트 */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                          📊 결과 분포 (몬테카를로)
                        </h4>
                        {scenario.distribution && (
                          <EChartsBarChart
                            data={scenario.distribution.map((v, i) => ({
                              name: `${i + 1}`,
                              value: v,
                            }))}
                            height={200}
                            showLegend={false}
                            valueFormatter={formatCurrency}
                          />
                        )}
                      </div>

                      {/* 백분위수 */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                          📈 백분위수 분포
                        </h4>
                        {scenario.percentiles && (
                          <div className="space-y-3">
                            {Object.entries(scenario.percentiles).map(([key, value]) => {
                              const label = key.replace('p', '') + '%'
                              const width = ((value - 100000) / 80000) * 100
                              
                              return (
                                <div key={key}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-500 dark:text-slate-400">{label}</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                      {formatCurrency(value)}
                                    </span>
                                  </div>
                                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        key === 'p50' 
                                          ? 'bg-indigo-500' 
                                          : 'bg-slate-300 dark:bg-slate-600'
                                      }`}
                                      style={{ width: `${Math.min(width, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 파라미터 */}
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        ⚙️ 시뮬레이션 파라미터
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(scenario.parameters).map(([key, value]) => (
                          <span
                            key={key}
                            className="px-2 py-1 bg-white dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-400"
                          >
                            {key}: <span className="font-medium">{value}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => onRunSimulation?.(scenario.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                      >
                        <Icon icon={RefreshCw} size="sm" />
                        재실행
                      </button>
                      <button
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                      >
                        <Icon icon={Play} size="sm" />
                        파라미터 수정
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </FadeIn>
          )
        })}
      </div>
    </div>
  )
}

export default SimulationResults

