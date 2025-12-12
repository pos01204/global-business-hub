'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { businessBrainApi } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FadeIn } from '@/components/ui/FadeIn'
import { EmptyState } from '@/components/ui/EmptyState'

interface SimulationScenario {
  id: string
  name: string
  description: string
  variables: Array<{
    metric: string
    currentValue: number
    changeType: 'absolute' | 'percentage' | 'multiplier'
    changeValue: number
    description: string
  }>
  assumptions: string[]
  timeline: string
}

interface SimulationResult {
  scenario: SimulationScenario
  projectedMetrics: {
    gmv: number
    orders: number
    customers: number
    aov: number
    growth: number
  }
  confidence: number
  assumptions: string[]
  risks: string[]
  recommendations: string[]
  comparison: {
    baseline: {
      gmv: number
      orders: number
      customers: number
    }
    projected: {
      gmv: number
      orders: number
      customers: number
    }
    change: {
      gmv: number
      orders: number
      customers: number
    }
  }
}

export function WhatIfSimulationTab({
  period,
  templates,
}: {
  period: string
  templates: SimulationScenario[]
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<SimulationScenario | null>(null)
  const [customScenario, setCustomScenario] = useState<SimulationScenario | null>(null)
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([])
  const [isComparing, setIsComparing] = useState(false)
  const queryClient = useQueryClient()

  // 시뮬레이션 실행
  const simulateMutation = useMutation({
    mutationFn: (scenario: SimulationScenario) =>
      businessBrainApi.simulateWhatIf(scenario, period as any),
    onSuccess: (data) => {
      if (data.result) {
        setSimulationResults([data.result])
        setIsComparing(false)
      }
    },
  })

  // 시나리오 비교
  const compareMutation = useMutation({
    mutationFn: (scenarios: SimulationScenario[]) =>
      businessBrainApi.compareWhatIfScenarios(scenarios, period as any),
    onSuccess: (data) => {
      if (data.results) {
        setSimulationResults(data.results)
        setIsComparing(true)
      }
    },
  })

  const handleTemplateSelect = (template: SimulationScenario) => {
    setSelectedTemplate(template)
    setCustomScenario(null)
  }

  const handleSimulate = () => {
    const scenario = customScenario || selectedTemplate
    if (scenario) {
      simulateMutation.mutate(scenario)
    }
  }

  const handleCompare = () => {
    const scenarios = [selectedTemplate, customScenario].filter(Boolean) as SimulationScenario[]
    if (scenarios.length >= 2) {
      compareMutation.mutate(scenarios)
    }
  }

  const formatCurrency = (value: number) => {
    return `₩${Math.round(value).toLocaleString()}`
  }

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* 시나리오 선택 */}
      <FadeIn>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            🔮 What-if 시뮬레이션
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            다양한 시나리오를 시뮬레이션하여 예상 결과를 비교하고 최적의 전략을 선택하세요.
          </p>

          {/* 템플릿 선택 */}
          {templates.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                시나리오 템플릿
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedTemplate?.id === template.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                      {template.name}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {template.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulate}
              disabled={!selectedTemplate && !customScenario || simulateMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {simulateMutation.isPending ? '시뮬레이션 중...' : '시뮬레이션 실행'}
            </button>
            {selectedTemplate && customScenario && (
              <button
                onClick={handleCompare}
                disabled={compareMutation.isPending}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {compareMutation.isPending ? '비교 중...' : '시나리오 비교'}
              </button>
            )}
          </div>
        </Card>
      </FadeIn>

      {/* 시뮬레이션 결과 */}
      {simulationResults.length > 0 && (
        <div className="space-y-4">
          {simulationResults.map((result, idx) => (
            <FadeIn key={idx} delay={idx * 100}>
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
                      {result.scenario.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {result.scenario.description}
                    </p>
                  </div>
                  <Badge variant={result.confidence >= 80 ? 'success' : result.confidence >= 60 ? 'warning' : 'danger'}>
                    신뢰도 {result.confidence}%
                  </Badge>
                </div>

                {/* 예상 메트릭 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">예상 GMV</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(result.projectedMetrics.gmv)}
                    </div>
                    <div className={`text-xs mt-1 ${result.comparison.change.gmv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(result.comparison.change.gmv)}
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">예상 주문</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {result.projectedMetrics.orders.toLocaleString()}건
                    </div>
                    <div className={`text-xs mt-1 ${result.comparison.change.orders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(result.comparison.change.orders)}
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">예상 고객</div>
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {result.projectedMetrics.customers.toLocaleString()}명
                    </div>
                    <div className={`text-xs mt-1 ${result.comparison.change.customers >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(result.comparison.change.customers)}
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">예상 성장률</div>
                    <div className={`text-lg font-bold ${result.projectedMetrics.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(result.projectedMetrics.growth)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {result.scenario.timeline}
                    </div>
                  </div>
                </div>

                {/* 리스크 및 권장사항 */}
                {result.risks.length > 0 && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2">
                      ⚠️ 리스크
                    </h4>
                    <ul className="space-y-1">
                      {result.risks.map((risk, rIdx) => (
                        <li key={rIdx} className="text-sm text-red-700 dark:text-red-300">
                          • {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.recommendations.length > 0 && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 mb-2">
                      💡 권장사항
                    </h4>
                    <ul className="space-y-1">
                      {result.recommendations.map((rec, rIdx) => (
                        <li key={rIdx} className="text-sm text-emerald-700 dark:text-emerald-300">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </FadeIn>
          ))}
        </div>
      )}

      {/* 에러 상태 */}
      {(simulateMutation.isError || compareMutation.isError) && (
        <FadeIn>
          <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <p className="text-red-800 dark:text-red-400">
              시뮬레이션 실행 중 오류가 발생했습니다. 다시 시도해주세요.
            </p>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}

