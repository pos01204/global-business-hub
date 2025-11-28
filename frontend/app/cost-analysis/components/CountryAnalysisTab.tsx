'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { costAnalysisApi } from '@/lib/api'

export default function CountryAnalysisTab() {
  const [selectedCountry, setSelectedCountry] = useState('JP')

  // 국가 목록 조회
  const { data: countriesData } = useQuery({
    queryKey: ['countries'],
    queryFn: costAnalysisApi.getCountries,
  })

  // 국가별 상세 분석
  const { data: countryData, isLoading } = useQuery({
    queryKey: ['country-detail', selectedCountry],
    queryFn: () => costAnalysisApi.getCountryDetail(selectedCountry),
    enabled: !!selectedCountry,
  })

  // 배송 정책 조회
  const { data: policiesData } = useQuery({
    queryKey: ['policies'],
    queryFn: costAnalysisApi.getPolicies,
  })

  const formatCurrency = (value: number) => `₩${value.toLocaleString()}`

  // Tier별로 국가 그룹핑
  const countriesByTier = countriesData?.data?.reduce((acc: any, country: any) => {
    if (!acc[country.tier]) acc[country.tier] = []
    acc[country.tier].push(country)
    return acc
  }, {}) || {}

  const detail = countryData?.data

  return (
    <div className="space-y-6">
      {/* 국가 선택 */}
      <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">🌍</span>
          <h3 className="font-semibold text-gray-800">국가 선택</h3>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4].map((tier) => (
            <div key={tier}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  tier === 1 ? 'bg-emerald-100 text-emerald-700' :
                  tier === 2 ? 'bg-blue-100 text-blue-700' :
                  tier === 3 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  Tier {tier}
                </span>
                <span className="text-xs text-gray-500">
                  {tier === 1 && '핵심 시장 - $1.49 배송비'}
                  {tier === 2 && '동남아 시장 - $9.99 배송비'}
                  {tier === 3 && '영미권 시장 - $19.99 배송비'}
                  {tier === 4 && '유럽/기타 - $29.99 배송비'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {countriesByTier[tier]?.map((country: any) => (
                  <button
                    key={country.code}
                    onClick={() => setSelectedCountry(country.code)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                      selectedCountry === country.code
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-400'
                    }`}
                  >
                    <span>{getCountryFlag(country.code)}</span>
                    <span>{country.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 로딩 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">국가별 데이터를 분석하고 있습니다...</p>
          </div>
        </div>
      ) : detail ? (
        <>
          {/* 국가 헤더 */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white relative overflow-hidden">
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="text-7xl">{getCountryFlag(detail.country.code)}</span>
                <div>
                  <h2 className="text-4xl font-bold">{detail.country.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      detail.country.tier === 1 ? 'bg-emerald-400/30' :
                      detail.country.tier === 2 ? 'bg-blue-400/30' :
                      detail.country.tier === 3 ? 'bg-amber-400/30' : 'bg-red-400/30'
                    }`}>
                      Tier {detail.country.tier}
                    </span>
                    <span className="text-indigo-200">{detail.country.code}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-indigo-200 text-sm mb-1">고객 배송비</p>
                <p className="text-5xl font-bold">${detail.policy.customerShippingFeeUSD}</p>
                <p className="text-indigo-200 text-sm mt-2">
                  무료배송: ${detail.policy.freeShippingThresholdUSD}+
                  {detail.policy.freeShippingItemCount && ` 또는 ${detail.policy.freeShippingItemCount}개+`}
                </p>
              </div>
            </div>
          </div>

          {/* 정책 상세 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🏷️</span>
                <span className="font-medium text-gray-700">고객 배송비</span>
              </div>
              <p className="text-3xl font-bold text-gray-800">
                ${detail.policy.customerShippingFeeUSD}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ≈ {formatCurrency(Math.round(detail.policy.customerShippingFeeUSD * 1350))}
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🎁</span>
                <span className="font-medium text-gray-700">무료배송 기준</span>
              </div>
              <p className="text-3xl font-bold text-emerald-600">
                ${detail.policy.freeShippingThresholdUSD}+
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {detail.policy.freeShippingItemCount 
                  ? `또는 ${detail.policy.freeShippingItemCount}개 이상 구매` 
                  : '금액 기준만 적용'}
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📊</span>
                <span className="font-medium text-gray-700">시장 우선순위</span>
              </div>
              <p className="text-3xl font-bold text-indigo-600">
                {detail.country.tier === 1 ? '최우선' :
                 detail.country.tier === 2 ? '중요' :
                 detail.country.tier === 3 ? '성장' : '일반'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Tier {detail.country.tier} 시장
              </p>
            </div>
          </div>

          {/* 중량별 운임표 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📦</span>
                  <h3 className="font-semibold text-gray-800">중량별 운송사 요금 비교</h3>
                </div>
                <span className="text-sm text-gray-500">단위: KRW</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left sticky left-0 bg-gray-50">중량</th>
                    {detail.ratesByWeight?.[0]?.rates?.map((rate: any, idx: number) => (
                      <th key={idx} className="px-4 py-3 text-center whitespace-nowrap">
                        {rate.carrierName}
                        {rate.isRecommended && <span className="ml-1 text-emerald-500">⭐</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detail.ratesByWeight?.map((weightData: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 sticky left-0 bg-white">
                        {weightData.weight} kg
                      </td>
                      {weightData.rates.map((rate: any, rIdx: number) => {
                        const isLowest = rate.totalRate === Math.min(...weightData.rates.map((r: any) => r.totalRate))
                        return (
                          <td
                            key={rIdx}
                            className={`px-4 py-3 text-center ${
                              isLowest ? 'bg-amber-50 font-bold text-amber-700' : ''
                            }`}
                          >
                            {formatCurrency(rate.totalRate)}
                            {rate.surcharge > 0 && (
                              <span className="text-xs text-gray-400 block">
                                +{formatCurrency(rate.surcharge)}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 인사이트 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💡</span>
                <h4 className="font-semibold text-emerald-800">최적 운송사</h4>
              </div>
              <p className="text-sm text-emerald-700">
                {detail.country.code === 'JP' && (
                  <>
                    <strong>YAMATO(야마토)</strong>가 일본향 최저가 운송사입니다. 
                    1kg 이하, 2.5cm 이하 상품은 <strong>NEKOPOS</strong>로 더 저렴하게 발송 가능합니다.
                  </>
                )}
                {detail.country.code === 'US' && (
                  <>
                    <strong>USPS</strong>가 미국향 경제적인 운송사입니다. 
                    5kg 이상 대형 상품은 <strong>FEDEX Ground</strong>가 유리할 수 있습니다.
                  </>
                )}
                {detail.country.code === 'HK' && (
                  <>
                    <strong>CXC Express</strong>가 홍콩향 최저가 운송사입니다. 
                    K-Packet도 경쟁력 있는 요금을 제공합니다.
                  </>
                )}
                {!['JP', 'US', 'HK'].includes(detail.country.code) && (
                  <>
                    <strong>K-Packet</strong>이 해당 국가의 기본 운송사입니다. 
                    중량별 요금표를 참고하여 최적의 운송사를 선택하세요.
                  </>
                )}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⚠️</span>
                <h4 className="font-semibold text-amber-800">주의사항</h4>
              </div>
              <p className="text-sm text-amber-700">
                {detail.country.tier === 1 && (
                  <>
                    Tier 1 국가는 관부가세 발생 시 <strong>백패커(회사)가 부담</strong>합니다. 
                    {detail.country.code === 'SG' && '싱가포르는 GST 9%가 무조건 부과됩니다.'}
                    {detail.country.code === 'JP' && '일본은 16,666엔 초과 시 소비세 10%가 부과됩니다.'}
                  </>
                )}
                {detail.country.tier >= 2 && (
                  <>
                    해당 국가는 <strong>특별운송수수료</strong>가 추가로 부과될 수 있습니다. 
                    실제 청구 금액은 정산서를 확인하세요.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Hidden Fee 계산 가이드 */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <h4 className="font-semibold text-blue-800 mb-3">Hidden Fee 계산 예시</h4>
                <div className="bg-white rounded-lg p-4 text-sm">
                  <p className="text-gray-700 mb-2">
                    <strong>{detail.country.name}</strong>향 0.5kg 상품 발송 시:
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-gray-500 text-xs">예상 물류비</p>
                      <p className="font-bold text-amber-600">
                        {formatCurrency(detail.ratesByWeight?.[1]?.rates?.[0]?.totalRate || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">고객 배송비</p>
                      <p className="font-bold text-emerald-600">
                        {formatCurrency(Math.round(detail.policy.customerShippingFeeUSD * 1350))}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Hidden Fee 필요</p>
                      <p className="font-bold text-red-600">
                        {formatCurrency(Math.max(0, 
                          (detail.ratesByWeight?.[1]?.rates?.[0]?.totalRate || 0) - 
                          Math.round(detail.policy.customerShippingFeeUSD * 1350)
                        ))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
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

