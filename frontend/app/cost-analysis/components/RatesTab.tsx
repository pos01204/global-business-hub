'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { costAnalysisApi } from '@/lib/api'

export default function RatesTab() {
  const [selectedCountry, setSelectedCountry] = useState('JP')
  const [weight, setWeight] = useState(0.5)

  // 국가 목록 조회
  const { data: countriesData } = useQuery({
    queryKey: ['countries'],
    queryFn: costAnalysisApi.getCountries,
  })

  // 운임 조회
  const { data: ratesData, isLoading } = useQuery({
    queryKey: ['rates', selectedCountry, weight],
    queryFn: () => costAnalysisApi.getRates({ country: selectedCountry, weight }),
    enabled: !!selectedCountry && weight > 0,
  })

  // 배송 정책 조회
  const { data: policiesData } = useQuery({
    queryKey: ['policies'],
    queryFn: costAnalysisApi.getPolicies,
  })

  const formatCurrency = (value: number) => `₩${value.toLocaleString()}`

  const weightOptions = [0.3, 0.5, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0]

  const countryInfo = countriesData?.data?.find((c: any) => c.code === selectedCountry)
  const policy = policiesData?.data?.find((p: any) => p.tier === countryInfo?.tier)

  return (
    <div className="space-y-6">
      {/* 조회 조건 */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">📋</span>
          <h3 className="font-semibold text-gray-800">운임 요금 조회</h3>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* 국가 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">도착 국가</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {countriesData?.data?.map((country: any) => (
                <option key={country.code} value={country.code}>
                  {getCountryFlag(country.code)} {country.name} (Tier {country.tier})
                </option>
              ))}
            </select>
          </div>

          {/* 중량 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">중량 (kg)</label>
            <div className="flex flex-wrap gap-2">
              {weightOptions.map((w) => (
                <button
                  key={w}
                  onClick={() => setWeight(w)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    weight === w
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  {w}kg
                </button>
              ))}
            </div>
          </div>

          {/* 직접 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">직접 입력</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0.1)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                min="0.1"
                step="0.1"
              />
              <span className="text-gray-500">kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* 선택된 국가 정보 */}
      {countryInfo && policy && (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{getCountryFlag(selectedCountry)}</span>
              <div>
                <h3 className="text-2xl font-bold">{countryInfo.name}</h3>
                <p className="text-emerald-100 mt-1">
                  Tier {countryInfo.tier} - {policy.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-emerald-100 text-sm">고객 배송비</p>
              <p className="text-3xl font-bold">${policy.customerShippingFeeUSD}</p>
              <p className="text-emerald-100 text-xs mt-1">
                무료배송: ${policy.freeShippingThresholdUSD} 이상
                {policy.freeShippingItemCount && ` 또는 ${policy.freeShippingItemCount}개 이상`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 운임 결과 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ratesData?.data?.rates?.length > 0 ? (
        <div className="grid grid-cols-2 gap-6">
          {/* 최저가 & 추천 */}
          <div className="space-y-4">
            {/* 최저가 */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-300">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏆</span>
                <span className="font-bold text-amber-800">최저가 운송사</span>
              </div>
              {ratesData.data.cheapest && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-lg text-gray-800">{ratesData.data.cheapest.carrierName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      기본 {formatCurrency(ratesData.data.cheapest.rate)}
                      {ratesData.data.cheapest.surcharge > 0 && (
                        <span className="text-amber-600"> + 수수료 {formatCurrency(ratesData.data.cheapest.surcharge)}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-amber-600">
                      {formatCurrency(ratesData.data.cheapest.totalRate)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 추천 */}
            {ratesData.data.recommended && ratesData.data.recommended.carrier !== ratesData.data.cheapest?.carrier && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border-2 border-emerald-300">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">⭐</span>
                  <span className="font-bold text-emerald-800">추천 운송사</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-lg text-gray-800">{ratesData.data.recommended.carrierName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      기본 {formatCurrency(ratesData.data.recommended.rate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600">
                      {formatCurrency(ratesData.data.recommended.totalRate)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 전체 운송사 목록 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <h4 className="font-semibold text-gray-700">
                📦 이용 가능한 운송사 ({ratesData.data.rates.length}개)
              </h4>
            </div>
            <div className="divide-y divide-gray-100">
              {ratesData.data.rates.map((rate: any, idx: number) => (
                <div
                  key={rate.carrier}
                  className={`px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    idx === 0 ? 'bg-amber-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 w-6">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">{rate.carrierName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {rate.isRecommended && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">추천</span>
                        )}
                        {rate.notes && (
                          <span className="text-xs text-gray-400">{rate.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${idx === 0 ? 'text-amber-600' : 'text-gray-800'}`}>
                      {formatCurrency(rate.totalRate)}
                    </p>
                    {rate.surcharge > 0 && (
                      <p className="text-xs text-gray-500">
                        기본 {formatCurrency(rate.rate)} + 수수료 {formatCurrency(rate.surcharge)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <span className="text-5xl opacity-30">📭</span>
          <p className="text-gray-400 mt-4">해당 조건에 맞는 운송사가 없습니다.</p>
        </div>
      )}

      {/* 배송 정책 안내 */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📌</span>
          <h4 className="font-semibold text-gray-800">Tier별 배송 정책 안내</h4>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {policiesData?.data?.map((policy: any) => (
            <div
              key={policy.tier}
              className={`p-4 rounded-lg border-2 ${
                policy.tier === countryInfo?.tier
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold ${
                  policy.tier === 1 ? 'text-emerald-600' :
                  policy.tier === 2 ? 'text-blue-600' :
                  policy.tier === 3 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  Tier {policy.tier}
                </span>
                {policy.tier === countryInfo?.tier && (
                  <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">현재</span>
                )}
              </div>
              <p className="text-xl font-bold text-gray-800">${policy.customerShippingFeeUSD}</p>
              <p className="text-xs text-gray-500 mt-2">
                무배: ${policy.freeShippingThresholdUSD}+
                {policy.freeShippingItemCount && <span> 또는 {policy.freeShippingItemCount}개+</span>}
              </p>
              <p className="text-xs text-gray-400 mt-1">{policy.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 주의사항 */}
      <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <h5 className="font-semibold text-blue-800 mb-2">운임 조회 안내</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 표시된 운임은 LGL(롯데글로벌로지스) 계약 운임 기준입니다.</li>
              <li>• 실제 청구 운임은 실중량과 부피중량 중 큰 값으로 적용됩니다.</li>
              <li>• 특별운송수수료는 국가별로 상이하며, 별도 부과될 수 있습니다.</li>
              <li>• NEKOPOS는 일본향 1kg 이하, 높이 2.5cm 이하 상품만 이용 가능합니다.</li>
              <li>• 유류할증료는 별도 적용될 수 있습니다.</li>
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
    IL: '🇮🇱', ZA: '🇿🇦', TR: '🇹🇷', RU: '🇷🇺', CN: '🇨🇳',
  }
  return flags[code] || '🌍'
}



