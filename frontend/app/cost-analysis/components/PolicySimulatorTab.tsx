'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { costAnalysisApi } from '@/lib/api'

interface PolicyScenario {
  id: string
  name: string
  description: string
  changes: {
    tier?: number
    newFreeShippingThreshold?: number
    newCustomerShippingFee?: number
    newFreeShippingItemCount?: number | null
  }
}

interface PolicySimulationResult {
  tier: number
  tierCountries: string[]
  tierCountriesCount: number
  period: {
    days: number
    startDate: string
    endDate: string
  }
  currentPolicy: {
    freeShippingThresholdUSD: number
    customerShippingFeeUSD: number
    freeShippingItemCount: number | null
  }
  newPolicy: {
    freeShippingThresholdUSD: number
    customerShippingFeeUSD: number
    freeShippingItemCount: number | null
  }
  currentStats: {
    totalOrders: number
    freeShippingOrders: number
    paidShippingOrders: number
    freeShippingRate: number
    totalGMV: number
    totalLogisticsCost: number
    customerShippingRevenue: number
    netLogisticsCost: number
  }
  newStats: {
    totalOrders: number
    freeShippingOrders: number
    paidShippingOrders: number
    freeShippingRate: number
    totalGMV: number
    totalLogisticsCost: number
    customerShippingRevenue: number
    netLogisticsCost: number
  }
  impact: {
    additionalFreeShippingOrders: number
    freeShippingRateChange: number
    customerShippingRevenueChange: number
    netLogisticsCostChange: number
    netProfitChange: number
  }
  riskLevel: 'low' | 'medium' | 'high'
  recommendation: string
}

interface SimulationResult {
  scenario: PolicyScenario
  apiResult?: PolicySimulationResult
  impact: {
    affectedOrders: number
    additionalFreeShippingOrders: number
    revenueChange: number
    logisticsCostChange: number
    netProfitChange: number
    freeShippingRate: {
      before: number
      after: number
    }
  }
  recommendation: string
  riskLevel: 'low' | 'medium' | 'high'
}

export default function PolicySimulatorTab() {
  const [selectedTier, setSelectedTier] = useState<number>(1)
  const [scenarios, setScenarios] = useState<PolicyScenario[]>([])
  const [customScenario, setCustomScenario] = useState({
    freeShippingThreshold: 50,
    customerShippingFee: 1.49,
    freeShippingItemCount: 2,
  })
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([])

  // 현재 정책 조회
  const { data: policiesData } = useQuery({
    queryKey: ['policies'],
    queryFn: costAnalysisApi.getPolicies,
  })

  // 국가 목록 조회
  const { data: countriesData } = useQuery({
    queryKey: ['countries'],
    queryFn: costAnalysisApi.getCountries,
  })

  // 대시보드 데이터 조회 (기준 데이터)
  const { data: dashboardData } = useQuery({
    queryKey: ['cost-analysis-dashboard'],
    queryFn: () => costAnalysisApi.getDashboard({}),
  })

  const currentPolicy = policiesData?.data?.find((p: any) => p.tier === selectedTier)
  
  // Tier별 국가 목록
  const tierCountries = useMemo(() => {
    return countriesData?.data?.filter((c: any) => c.tier === selectedTier) || []
  }, [countriesData, selectedTier])

  // 시나리오 프리셋
  const presetScenarios: PolicyScenario[] = [
    {
      id: 'lower-threshold-10',
      name: '무료배송 기준 $10 인하',
      description: '무료배송 기준을 현재보다 $10 낮춤',
      changes: {
        tier: selectedTier,
        newFreeShippingThreshold: (currentPolicy?.freeShippingThresholdUSD || 50) - 10,
      },
    },
    {
      id: 'lower-threshold-20',
      name: '무료배송 기준 $20 인하',
      description: '무료배송 기준을 현재보다 $20 낮춤',
      changes: {
        tier: selectedTier,
        newFreeShippingThreshold: (currentPolicy?.freeShippingThresholdUSD || 50) - 20,
      },
    },
    {
      id: 'raise-shipping-fee',
      name: '배송비 $2 인상',
      description: '고객 부담 배송비를 $2 인상',
      changes: {
        tier: selectedTier,
        newCustomerShippingFee: (currentPolicy?.customerShippingFeeUSD || 1.49) + 2,
      },
    },
    {
      id: 'remove-item-count',
      name: '수량 무배 조건 제거',
      description: '2개 이상 구매 시 무료배송 조건 제거',
      changes: {
        tier: selectedTier,
        newFreeShippingItemCount: null,
      },
    },
  ]

  // 정책 시뮬레이션 뮤테이션
  const policySimulationMutation = useMutation({
    mutationFn: async (input: {
      tier: number
      newFreeShippingThreshold?: number
      newCustomerShippingFee?: number
      newFreeShippingItemCount?: number | null
    }) => {
      const response = await costAnalysisApi.simulatePolicy(input)
      return response
    },
  })

  // 시뮬레이션 실행 (백엔드 API 호출)
  const runSimulation = async (scenario: PolicyScenario): Promise<SimulationResult | null> => {
    try {
      const response = await policySimulationMutation.mutateAsync({
        tier: selectedTier,
        newFreeShippingThreshold: scenario.changes.newFreeShippingThreshold,
        newCustomerShippingFee: scenario.changes.newCustomerShippingFee,
        newFreeShippingItemCount: scenario.changes.newFreeShippingItemCount,
      })

      if (!response.success) {
        console.error('시뮬레이션 실패:', response.error)
        return null
      }

      const apiResult: PolicySimulationResult = response.data
      
      return {
        scenario,
        apiResult,
        impact: {
          affectedOrders: apiResult.currentStats.totalOrders,
          additionalFreeShippingOrders: apiResult.impact.additionalFreeShippingOrders,
          revenueChange: 0, // GMV는 변하지 않음
          logisticsCostChange: apiResult.impact.netLogisticsCostChange,
          netProfitChange: apiResult.impact.netProfitChange,
          freeShippingRate: {
            before: apiResult.currentStats.freeShippingRate,
            after: apiResult.newStats.freeShippingRate,
          },
        },
        recommendation: apiResult.recommendation,
        riskLevel: apiResult.riskLevel,
      }
    } catch (error) {
      console.error('시뮬레이션 오류:', error)
      return null
    }
  }

  const [isLoading, setIsLoading] = useState(false)

  const handleRunScenario = async (scenario: PolicyScenario) => {
    setIsLoading(true)
    const result = await runSimulation(scenario)
    setIsLoading(false)
    
    if (result) {
      setSimulationResults(prev => {
        const existing = prev.findIndex(r => r.scenario.id === scenario.id)
        if (existing >= 0) {
          const newResults = [...prev]
          newResults[existing] = result
          return newResults
        }
        return [...prev, result]
      })
    }
  }

  const handleRunCustomScenario = async () => {
    const customPolicy: PolicyScenario = {
      id: 'custom-' + Date.now(),
      name: '사용자 정의 시나리오',
      description: `무배 $${customScenario.freeShippingThreshold}, 배송비 $${customScenario.customerShippingFee}`,
      changes: {
        tier: selectedTier,
        newFreeShippingThreshold: customScenario.freeShippingThreshold,
        newCustomerShippingFee: customScenario.customerShippingFee,
        newFreeShippingItemCount: customScenario.freeShippingItemCount || null,
      },
    }
    await handleRunScenario(customPolicy)
  }

  const formatCurrency = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    if (Math.abs(value) >= 1000000) {
      return `${sign}₩${(value / 1000000).toFixed(1)}M`
    }
    if (Math.abs(value) >= 1000) {
      return `${sign}₩${(value / 1000).toFixed(0)}K`
    }
    return `${sign}₩${value.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🎯</span>
            <div>
              <h2 className="text-2xl font-bold">정책 시뮬레이터</h2>
              <p className="text-violet-200 text-sm mt-1">
                배송비/무료배송 정책 변경 시 예상 영향을 분석합니다
              </p>
            </div>
          </div>
          
          {/* Tier 선택 */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4].map((tier) => (
              <button
                key={tier}
                onClick={() => {
                  setSelectedTier(tier)
                  setSimulationResults([])
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedTier === tier
                    ? 'bg-white text-violet-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Tier {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 왼쪽: 현재 정책 & 시나리오 선택 */}
        <div className="col-span-1 space-y-4">
          {/* 현재 정책 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span> 현재 Tier {selectedTier} 정책
            </h3>
            {currentPolicy && (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">고객 배송비</span>
                  <span className="font-bold text-lg">${currentPolicy.customerShippingFeeUSD}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">무료배송 기준</span>
                  <span className="font-bold text-lg">${currentPolicy.freeShippingThresholdUSD}+</span>
                </div>
                {currentPolicy.freeShippingItemCount && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">수량 무배</span>
                    <span className="font-bold">{currentPolicy.freeShippingItemCount}개 이상</span>
                  </div>
                )}
                <div className="pt-2">
                  <p className="text-xs text-gray-500">{currentPolicy.description}</p>
                </div>
              </div>
            )}
            
            {/* 해당 Tier 국가 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">적용 국가 ({tierCountries.length}개)</p>
              <div className="flex flex-wrap gap-1">
                {tierCountries.slice(0, 8).map((country: any) => (
                  <span key={country.code} className="text-lg" title={country.name}>
                    {getCountryFlag(country.code)}
                  </span>
                ))}
                {tierCountries.length > 8 && (
                  <span className="text-xs text-gray-400">+{tierCountries.length - 8}</span>
                )}
              </div>
            </div>
          </div>

          {/* 프리셋 시나리오 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚡</span> 빠른 시나리오
            </h3>
            <div className="space-y-2">
              {presetScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleRunScenario(scenario)}
                  disabled={isLoading}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-violet-400 hover:bg-violet-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <p className="font-medium text-gray-800 group-hover:text-violet-700">
                    {scenario.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{scenario.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 커스텀 시나리오 */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200 p-5">
            <h3 className="font-semibold text-violet-800 mb-4 flex items-center gap-2">
              <span>🔧</span> 사용자 정의
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">무료배송 기준 ($)</label>
                <input
                  type="number"
                  value={customScenario.freeShippingThreshold}
                  onChange={(e) => setCustomScenario(prev => ({
                    ...prev,
                    freeShippingThreshold: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">고객 배송비 ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={customScenario.customerShippingFee}
                  onChange={(e) => setCustomScenario(prev => ({
                    ...prev,
                    customerShippingFee: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">수량 무배 (개, 0=미적용)</label>
                <input
                  type="number"
                  value={customScenario.freeShippingItemCount}
                  onChange={(e) => setCustomScenario(prev => ({
                    ...prev,
                    freeShippingItemCount: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <button
                onClick={handleRunCustomScenario}
                disabled={isLoading}
                className="w-full py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    분석 중...
                  </>
                ) : (
                  <>🚀 시뮬레이션 실행</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 오른쪽: 시뮬레이션 결과 */}
        <div className="col-span-2 space-y-4">
          {isLoading && (
            <div className="bg-violet-50 rounded-xl border border-violet-200 p-8 text-center mb-4">
              <span className="text-4xl animate-bounce block mb-3">🎯</span>
              <h4 className="text-lg font-medium text-violet-700 mb-2">시뮬레이션 진행 중...</h4>
              <p className="text-sm text-violet-600">
                실제 데이터 기반으로 영향을 분석하고 있습니다
              </p>
            </div>
          )}
          
          {simulationResults.length === 0 && !isLoading ? (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
              <span className="text-6xl opacity-30 block mb-4">🎯</span>
              <h4 className="text-lg font-medium text-gray-400 mb-2">시뮬레이션 결과 대기 중</h4>
              <p className="text-sm text-gray-400">
                왼쪽에서 시나리오를 선택하거나<br />
                사용자 정의 값을 입력하고 실행하세요
              </p>
            </div>
          ) : simulationResults.length > 0 ? (
            simulationResults.map((result, idx) => (
              <div
                key={result.scenario.id}
                className={`bg-white rounded-xl border-2 p-6 ${
                  result.riskLevel === 'low' ? 'border-emerald-300' :
                  result.riskLevel === 'medium' ? 'border-amber-300' : 'border-red-300'
                }`}
              >
                {/* 시나리오 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">{result.scenario.name}</h4>
                    <p className="text-sm text-gray-500">{result.scenario.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.riskLevel === 'low' ? 'bg-emerald-100 text-emerald-700' :
                    result.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {result.riskLevel === 'low' ? '🟢 낮은 리스크' :
                     result.riskLevel === 'medium' ? '🟡 중간 리스크' : '🔴 높은 리스크'}
                  </span>
                </div>

                {/* 영향 지표 */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">영향 주문</p>
                    <p className="text-xl font-bold text-gray-800">
                      {result.impact.affectedOrders}건
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">추가 무배 주문</p>
                    <p className="text-xl font-bold text-emerald-600">
                      +{result.impact.additionalFreeShippingOrders}건
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">물류비 변화</p>
                    <p className={`text-xl font-bold ${
                      result.impact.logisticsCostChange <= 0 ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {formatCurrency(result.impact.logisticsCostChange)}
                    </p>
                  </div>
                  <div className={`rounded-lg p-4 text-center ${
                    result.impact.netProfitChange >= 0 ? 'bg-emerald-50' : 'bg-red-50'
                  }`}>
                    <p className="text-xs text-gray-500 mb-1">순이익 변화</p>
                    <p className={`text-xl font-bold ${
                      result.impact.netProfitChange >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(result.impact.netProfitChange)}
                    </p>
                  </div>
                </div>

                {/* 무료배송 비율 변화 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>무료배송 비율 변화</span>
                    <span>
                      {result.impact.freeShippingRate.before.toFixed(1)}% → {result.impact.freeShippingRate.after.toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-gray-400 transition-all"
                      style={{ width: `${result.impact.freeShippingRate.before}%` }}
                    />
                    <div
                      className="absolute left-0 top-0 h-full bg-emerald-500 transition-all"
                      style={{ width: `${result.impact.freeShippingRate.after}%` }}
                    />
                  </div>
                </div>

                {/* 권장사항 */}
                <div className={`p-4 rounded-lg ${
                  result.riskLevel === 'low' ? 'bg-emerald-50 border border-emerald-200' :
                  result.riskLevel === 'medium' ? 'bg-amber-50 border border-amber-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${
                    result.riskLevel === 'low' ? 'text-emerald-700' :
                    result.riskLevel === 'medium' ? 'text-amber-700' : 'text-red-700'
                  }`}>
                    {result.recommendation}
                  </p>
                </div>
              </div>
            ))
          ) : null}

          {/* 비교 요약 (2개 이상 시나리오 시) */}
          {simulationResults.length >= 2 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <span>📊</span> 시나리오 비교
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-600">
                    <tr className="border-b border-blue-200">
                      <th className="text-left py-2">시나리오</th>
                      <th className="text-right py-2">무배 주문↑</th>
                      <th className="text-right py-2">물류비 변화</th>
                      <th className="text-right py-2">순이익 변화</th>
                      <th className="text-center py-2">리스크</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationResults.map((result) => (
                      <tr key={result.scenario.id} className="border-b border-blue-100">
                        <td className="py-2 font-medium text-gray-800">{result.scenario.name}</td>
                        <td className="py-2 text-right text-emerald-600">+{result.impact.additionalFreeShippingOrders}</td>
                        <td className={`py-2 text-right ${result.impact.logisticsCostChange <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {formatCurrency(result.impact.logisticsCostChange)}
                        </td>
                        <td className={`py-2 text-right font-bold ${result.impact.netProfitChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(result.impact.netProfitChange)}
                        </td>
                        <td className="py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            result.riskLevel === 'low' ? 'bg-emerald-100 text-emerald-700' :
                            result.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {result.riskLevel === 'low' ? '낮음' : result.riskLevel === 'medium' ? '중간' : '높음'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 최적 시나리오 추천 */}
              {(() => {
                const bestScenario = [...simulationResults].sort((a, b) => 
                  b.impact.netProfitChange - a.impact.netProfitChange
                )[0]
                return (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>💡 추천:</strong> "{bestScenario.scenario.name}" 시나리오가 
                      순이익 {formatCurrency(bestScenario.impact.netProfitChange)}로 가장 유리합니다.
                    </p>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <h5 className="font-semibold text-gray-800 mb-2">시뮬레이션 안내</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 시뮬레이션은 과거 데이터 기반 추정치입니다. 실제 결과는 다를 수 있습니다.</li>
              <li>• 무료배송 기준 인하 시 전환율 상승 효과가 있으나, 단기 물류비는 증가합니다.</li>
              <li>• 정책 변경 전 A/B 테스트를 권장합니다.</li>
              <li>• Tier별로 시뮬레이션을 수행하여 최적의 정책 조합을 찾으세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    JP: '🇯🇵', HK: '🇭🇰', SG: '🇸🇬', ID: '🇮🇩', MY: '🇲🇾', TW: '🇹🇼', VN: '🇻🇳',
    AU: '🇦🇺', CA: '🇨🇦', NZ: '🇳🇿', US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
    IT: '🇮🇹', ES: '🇪🇸', NL: '🇳🇱', BE: '🇧🇪', CH: '🇨🇭', AT: '🇦🇹', SE: '🇸🇪',
    NO: '🇳🇴', DK: '🇩🇰', FI: '🇫🇮', PL: '🇵🇱', CZ: '🇨🇿', HU: '🇭🇺', IE: '🇮🇪',
    PT: '🇵🇹', BR: '🇧🇷', MX: '🇲🇽', TH: '🇹🇭', PH: '🇵🇭', IN: '🇮🇳', AE: '🇦🇪',
  }
  return flags[code] || '🌍'
}

