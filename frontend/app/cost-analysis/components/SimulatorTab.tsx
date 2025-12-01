'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { costAnalysisApi } from '@/lib/api'

interface SimulationResult {
  input: any
  country: { code: string; name: string; tier: number }
  shippingPolicy: {
    customerShippingFeeKRW: number
    isFreeShipping: boolean
    freeShippingReason?: string
  }
  logistics: {
    selectedCarrier: string
    carrierName: string
    actualShippingCost: number
    surcharge: number
    totalLogisticsCost: number
    volumeWeight?: number
    chargeableWeight: number
  }
  tax: {
    applicable: boolean
    estimatedTax: number
    paidBy: string
    notes?: string
  }
  profitAnalysis: {
    revenue: number
    customerShippingFee: number
    totalRevenue: number
    logisticsCost: number
    taxCost: number
    totalCost: number
    grossProfit: number
    grossMarginPercent: number
    hiddenFeeNeeded: number
    recommendedPrice?: number
  }
  alternatives: Array<{
    carrier: string
    carrierName: string
    rate: number
    surcharge: number
    totalRate: number
    isRecommended: boolean
    notes?: string
  }>
}

export default function SimulatorTab() {
  const [formData, setFormData] = useState({
    country: 'JP',
    productPriceKRW: 35000,
    weightKg: 0.5,
    lengthCm: 20,
    widthCm: 15,
    heightCm: 5,
    itemCount: 1,
    useDimensions: false,
    carrier: '',
  })

  const [result, setResult] = useState<SimulationResult | null>(null)

  // 국가 목록 조회
  const { data: countriesData } = useQuery({
    queryKey: ['countries'],
    queryFn: costAnalysisApi.getCountries,
  })

  // 운송사 목록 조회
  const { data: carriersData } = useQuery({
    queryKey: ['carriers'],
    queryFn: costAnalysisApi.getCarriers,
  })

  // 시뮬레이션 실행
  const simulateMutation = useMutation({
    mutationFn: costAnalysisApi.simulate,
    onSuccess: (data) => {
      setResult(data.data)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const input: any = {
      country: formData.country,
      productPriceKRW: formData.productPriceKRW,
      weightKg: formData.weightKg,
      itemCount: formData.itemCount,
    }

    if (formData.useDimensions) {
      input.dimensions = {
        lengthCm: formData.lengthCm,
        widthCm: formData.widthCm,
        heightCm: formData.heightCm,
      }
    }

    if (formData.carrier) {
      input.carrier = formData.carrier
    }

    simulateMutation.mutate(input)
  }

  const formatCurrency = (value: number) => `₩${value.toLocaleString()}`

  // 국가별 사용 가능한 운송사 필터링
  const availableCarriers = carriersData?.data?.filter((c: any) => 
    c.countries.includes(formData.country)
  ) || []

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* 입력 폼 */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">🧮</span>
          <h3 className="text-xl font-bold text-gray-800">주문 손익 시뮬레이터</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 국가 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                🌍 도착 국가
              </span>
            </label>
            <select
              value={formData.country}
              onChange={(e) => {
                setFormData({ ...formData, country: e.target.value, carrier: '' })
                setResult(null)
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              {countriesData?.data?.map((country: any) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.code}) - Tier {country.tier}
                </option>
              ))}
            </select>
          </div>

          {/* 상품 가격 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                💰 상품 가격 (KRW)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
              <input
                type="number"
                value={formData.productPriceKRW}
                onChange={(e) => {
                  setFormData({ ...formData, productPriceKRW: parseInt(e.target.value) || 0 })
                  setResult(null)
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                min="0"
                step="1000"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ≈ ${(formData.productPriceKRW / 1350).toFixed(2)} USD
            </p>
          </div>

          {/* 중량 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                ⚖️ 실중량 (kg)
              </span>
            </label>
            <input
              type="number"
              value={formData.weightKg}
              onChange={(e) => {
                setFormData({ ...formData, weightKg: parseFloat(e.target.value) || 0 })
                setResult(null)
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              min="0.1"
              step="0.1"
            />
          </div>

          {/* 부피 입력 토글 */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="useDimensions"
              checked={formData.useDimensions}
              onChange={(e) => setFormData({ ...formData, useDimensions: e.target.checked })}
              className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="useDimensions" className="text-sm text-gray-700">
              📐 부피중량 계산 (가로 × 세로 × 높이 / 5000)
            </label>
          </div>

          {/* 부피 입력 */}
          {formData.useDimensions && (
            <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-xs text-gray-600 mb-1">가로 (cm)</label>
                <input
                  type="number"
                  value={formData.lengthCm}
                  onChange={(e) => setFormData({ ...formData, lengthCm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">세로 (cm)</label>
                <input
                  type="number"
                  value={formData.widthCm}
                  onChange={(e) => setFormData({ ...formData, widthCm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">높이 (cm)</label>
                <input
                  type="number"
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="1"
                />
              </div>
              <div className="col-span-3 text-xs text-gray-500 mt-1">
                부피중량: {((formData.lengthCm * formData.widthCm * formData.heightCm) / 5000).toFixed(2)} kg
              </div>
            </div>
          )}

          {/* 수량 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                📦 구매 수량
              </span>
            </label>
            <input
              type="number"
              value={formData.itemCount}
              onChange={(e) => {
                setFormData({ ...formData, itemCount: parseInt(e.target.value) || 1 })
                setResult(null)
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              min="1"
            />
          </div>

          {/* 운송사 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                🚚 운송사 선택
              </span>
            </label>
            <select
              value={formData.carrier}
              onChange={(e) => {
                setFormData({ ...formData, carrier: e.target.value })
                setResult(null)
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="">🔄 자동 최적화 (최저가)</option>
              {availableCarriers.map((carrier: any) => (
                <option key={carrier.carrier} value={carrier.carrier}>
                  {carrier.name}
                </option>
              ))}
            </select>
          </div>

          {/* 시뮬레이션 버튼 */}
          <button
            type="submit"
            disabled={simulateMutation.isPending}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl
                     hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {simulateMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <span>🎯</span>
                손익 시뮬레이션 실행
              </>
            )}
          </button>
        </form>

        {simulateMutation.isError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">
              {(simulateMutation.error as any)?.response?.data?.error || '시뮬레이션 중 오류가 발생했습니다.'}
            </p>
          </div>
        )}
      </div>

      {/* 결과 표시 */}
      <div>
        {result ? (
          <div className="space-y-5">
            {/* 국가 & 배송 정책 */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getCountryFlag(result.country.code)}</span>
                  <div>
                    <h4 className="font-bold text-gray-800">{result.country.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      result.country.tier === 1 ? 'bg-emerald-100 text-emerald-700' :
                      result.country.tier === 2 ? 'bg-blue-100 text-blue-700' :
                      result.country.tier === 3 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Tier {result.country.tier}
                    </span>
                  </div>
                </div>
                {result.shippingPolicy.isFreeShipping ? (
                  <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    🎉 무료배송
                  </div>
                ) : (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">고객 배송비</p>
                    <p className="font-bold text-gray-800">{formatCurrency(result.shippingPolicy.customerShippingFeeKRW)}</p>
                  </div>
                )}
              </div>
              {result.shippingPolicy.isFreeShipping && (
                <p className="text-sm text-emerald-700">
                  ✓ {result.shippingPolicy.freeShippingReason}
                </p>
              )}
            </div>

            {/* 물류비 정보 */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🚚</span> 물류비 상세
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">선택 운송사</span>
                  <span className="font-medium text-emerald-600">{result.logistics.carrierName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">청구 중량</span>
                  <span className="font-medium">
                    {result.logistics.chargeableWeight} kg
                    {result.logistics.volumeWeight && (
                      <span className="text-xs text-gray-400 ml-2">
                        (부피중량: {result.logistics.volumeWeight} kg)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">기본 운임</span>
                  <span className="font-medium">{formatCurrency(result.logistics.actualShippingCost)}</span>
                </div>
                {result.logistics.surcharge > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">특별운송수수료</span>
                    <span className="font-medium text-amber-600">+{formatCurrency(result.logistics.surcharge)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 bg-amber-50 -mx-5 px-5 rounded-b-xl">
                  <span className="font-semibold text-gray-800">총 물류비</span>
                  <span className="font-bold text-lg text-amber-600">{formatCurrency(result.logistics.totalLogisticsCost)}</span>
                </div>
              </div>
            </div>

            {/* 관부가세 */}
            {result.tax.applicable && (
              <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <span>⚠️</span> 관부가세 발생
                </h4>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-red-700">{result.tax.notes}</p>
                    <p className="text-xs text-red-500 mt-1">
                      부담 주체: {result.tax.paidBy === 'backpacker' ? '백패커(회사)' : '고객'}
                    </p>
                  </div>
                  <span className="font-bold text-red-700 text-lg">
                    {formatCurrency(result.tax.estimatedTax)}
                  </span>
                </div>
              </div>
            )}

            {/* 손익 분석 */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-5 border border-violet-200">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>📊</span> 손익 분석
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">상품 매출</span>
                  <span className="font-medium">{formatCurrency(result.profitAnalysis.revenue)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">배송비 수입</span>
                  <span className="font-medium text-emerald-600">+{formatCurrency(result.profitAnalysis.customerShippingFee)}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-violet-200 pt-2">
                  <span className="font-medium text-gray-700">총 매출</span>
                  <span className="font-bold">{formatCurrency(result.profitAnalysis.totalRevenue)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">물류비</span>
                  <span className="font-medium text-red-600">-{formatCurrency(result.profitAnalysis.logisticsCost)}</span>
                </div>
                {result.profitAnalysis.taxCost > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">관부가세</span>
                    <span className="font-medium text-red-600">-{formatCurrency(result.profitAnalysis.taxCost)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 bg-violet-100 -mx-5 px-5 mt-2 rounded-b-xl">
                  <span className="font-bold text-gray-800">순이익</span>
                  <div className="text-right">
                    <span className={`font-bold text-xl ${
                      result.profitAnalysis.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(result.profitAnalysis.grossProfit)}
                    </span>
                    <span className={`ml-2 text-sm ${
                      result.profitAnalysis.grossMarginPercent >= 60 ? 'text-emerald-600' :
                      result.profitAnalysis.grossMarginPercent >= 40 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      ({result.profitAnalysis.grossMarginPercent}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden Fee 정보 */}
            {result.profitAnalysis.hiddenFeeNeeded > 0 && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-amber-800">Hidden Fee 필요</h5>
                    <p className="text-xs text-amber-600 mt-1">
                      물류비와 고객 배송비 차이를 상품가에 포함 필요
                    </p>
                  </div>
                  <span className="text-xl font-bold text-amber-700">
                    {formatCurrency(result.profitAnalysis.hiddenFeeNeeded)}
                  </span>
                </div>
              </div>
            )}

            {/* 권장 판매가 */}
            {result.profitAnalysis.recommendedPrice && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-blue-800">💡 권장 판매가</h5>
                    <p className="text-xs text-blue-600 mt-1">
                      마진 70% 확보 기준
                    </p>
                  </div>
                  <span className="text-xl font-bold text-blue-700">
                    {formatCurrency(result.profitAnalysis.recommendedPrice)}
                  </span>
                </div>
              </div>
            )}

            {/* 대안 운송사 */}
            {result.alternatives.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>🔄</span> 다른 운송 옵션
                </h4>
                <div className="space-y-2">
                  {result.alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">{alt.carrierName}</span>
                        {alt.isRecommended && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">추천</span>
                        )}
                        {alt.notes && (
                          <span className="text-xs text-gray-400">{alt.notes}</span>
                        )}
                      </div>
                      <span className="font-bold text-gray-800">{formatCurrency(alt.totalRate)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center py-20">
              <div className="text-6xl mb-4 opacity-30">🧮</div>
              <h4 className="text-lg font-medium text-gray-400 mb-2">시뮬레이션 결과 대기 중</h4>
              <p className="text-sm text-gray-400">
                왼쪽 양식에 정보를 입력하고<br />
                시뮬레이션을 실행해주세요
              </p>
            </div>
          </div>
        )}
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
    IL: '🇮🇱', ZA: '🇿🇦', TR: '🇹🇷', RU: '🇷🇺', CN: '🇨🇳',
  }
  return flags[code] || '🌍'
}



