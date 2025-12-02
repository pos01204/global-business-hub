'use client'

import { useState, useMemo } from 'react'
import { CouponSettings } from '../types/coupon'

interface DiscountOptimizerProps {
  settings: CouponSettings
  onSettingsChange: (settings: CouponSettings) => void
  targetRegion: 'JP' | 'GLOBAL'
}

interface DiscountSimulation {
  value: number
  estimatedMargin: number
  breakEvenOrders: number
  profitImpact: 'positive' | 'neutral' | 'negative'
}

// 정률 할인 추천
const RATE_RECOMMENDATIONS = {
  new_user: { recommended: 15, min: 10, max: 20, reason: '신규 고객 획득을 위한 공격적 할인' },
  retention: { recommended: 10, min: 8, max: 12, reason: '기존 고객 재구매 유도' },
  reactivation: { recommended: 15, min: 12, max: 20, reason: '휴면 고객 복귀 유도' },
  season: { recommended: 10, min: 8, max: 15, reason: '시즌 프로모션 평균 할인율' },
  vip: { recommended: 12, min: 10, max: 15, reason: 'VIP 고객 충성도 유지' },
}

// 정액 할인 추천 (JPY 기준)
const FIXED_RECOMMENDATIONS_JPY = {
  new_user: { recommended: 500, min: 300, max: 1000, reason: '신규 가입 웰컴 쿠폰 표준' },
  retention: { recommended: 300, min: 200, max: 500, reason: '재구매 유도 적정 금액' },
  reactivation: { recommended: 1000, min: 500, max: 2000, reason: '휴면 고객 복귀 인센티브' },
  season: { recommended: 500, min: 300, max: 1000, reason: '시즌 프로모션 표준 금액' },
  vip: { recommended: 1000, min: 500, max: 2000, reason: 'VIP 특별 혜택' },
}

// 정액 할인 추천 (USD 기준)
const FIXED_RECOMMENDATIONS_USD = {
  new_user: { recommended: 3, min: 2, max: 5, reason: '신규 가입 웰컴 쿠폰 표준' },
  retention: { recommended: 2, min: 1, max: 3, reason: '재구매 유도 적정 금액' },
  reactivation: { recommended: 5, min: 3, max: 10, reason: '휴면 고객 복귀 인센티브' },
  season: { recommended: 3, min: 2, max: 5, reason: '시즌 프로모션 표준 금액' },
  vip: { recommended: 5, min: 3, max: 10, reason: 'VIP 특별 혜택' },
}

type CampaignType = keyof typeof RATE_RECOMMENDATIONS

export default function DiscountOptimizer({ settings, onSettingsChange, targetRegion }: DiscountOptimizerProps) {
  const [campaignType, setCampaignType] = useState<CampaignType>('season')
  const [showSimulation, setShowSimulation] = useState(false)

  const isRate = settings.discountType === 'RATE'
  const isJPY = settings.currencyCode === 'JPY'
  const currencySymbol = isJPY ? '¥' : '$'

  // 현재 할인 유형에 맞는 추천값
  const recommendation = useMemo(() => {
    if (isRate) {
      return RATE_RECOMMENDATIONS[campaignType]
    }
    return isJPY ? FIXED_RECOMMENDATIONS_JPY[campaignType] : FIXED_RECOMMENDATIONS_USD[campaignType]
  }, [isRate, isJPY, campaignType])

  // 할인 시뮬레이션
  const simulations: DiscountSimulation[] = useMemo(() => {
    const baseMargin = 50
    
    if (isRate) {
      const rates = [8, 10, 12, 15, 20]
      return rates.map(rate => ({
        value: rate,
        estimatedMargin: baseMargin - rate,
        breakEvenOrders: Math.ceil(rate / ((baseMargin - rate) / 100) * 2),
        profitImpact: (baseMargin - rate) > 35 ? 'positive' : (baseMargin - rate) > 25 ? 'neutral' : 'negative',
      }))
    } else {
      // 정액 할인 시뮬레이션
      const avgOrderValue = isJPY ? 10000 : 50
      const amounts = isJPY ? [300, 500, 800, 1000, 1500] : [2, 3, 5, 7, 10]
      return amounts.map(amount => {
        const effectiveRate = (amount / avgOrderValue) * 100
        const estimatedMargin = baseMargin - effectiveRate
        return {
          value: amount,
          estimatedMargin: Math.round(estimatedMargin),
          breakEvenOrders: Math.ceil(effectiveRate / (estimatedMargin / 100) * 2),
          profitImpact: estimatedMargin > 35 ? 'positive' : estimatedMargin > 25 ? 'neutral' : 'negative',
        }
      })
    }
  }, [isRate, isJPY])

  // 추천값 적용
  const applyRecommendation = () => {
    const discount = recommendation.recommended
    
    if (isRate) {
      // 정률 할인: 최소 주문/최대 할인 자동 계산
      const minOrderPrice = isJPY 
        ? discount <= 10 ? 8000 : discount <= 15 ? 10000 : 15000
        : discount <= 10 ? 20 : discount <= 15 ? 25 : 30
      
      const maxDiscountPrice = Math.round(minOrderPrice * discount / 100 * 1.2)

      onSettingsChange({
        ...settings,
        discount,
        minOrderPrice,
        maxDiscountPrice,
      })
    } else {
      // 정액 할인: 최소 주문 0, 최대 할인 = 할인 금액
      onSettingsChange({
        ...settings,
        discount,
        minOrderPrice: 0,
        maxDiscountPrice: discount,
      })
    }
  }

  // 할인 유형 변경
  const handleDiscountTypeChange = (type: 'RATE' | 'FIXED') => {
    const newSettings = { ...settings, discountType: type }
    
    if (type === 'RATE') {
      // 정률로 변경 시 기본값
      newSettings.discount = 10
      newSettings.minOrderPrice = isJPY ? 8000 : 20
      newSettings.maxDiscountPrice = isJPY ? 1000 : 3
    } else {
      // 정액으로 변경 시 기본값
      newSettings.discount = isJPY ? 500 : 3
      newSettings.minOrderPrice = 0
      newSettings.maxDiscountPrice = newSettings.discount
    }
    
    onSettingsChange(newSettings)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <h3 className="font-semibold">할인 최적화</h3>
        </div>
        <button
          onClick={() => setShowSimulation(!showSimulation)}
          className="text-sm text-primary hover:underline"
        >
          {showSimulation ? '시뮬레이션 숨기기' : '수익성 시뮬레이션'}
        </button>
      </div>

      {/* 할인 유형 선택 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">할인 유형</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleDiscountTypeChange('RATE')}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all border-2 ${
              isRate
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-lg mb-1">📊</div>
            <div>정률 할인</div>
            <div className="text-xs text-gray-500">예: 10% OFF</div>
          </button>
          <button
            onClick={() => handleDiscountTypeChange('FIXED')}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all border-2 ${
              !isRate
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-lg mb-1">💵</div>
            <div>정액 할인</div>
            <div className="text-xs text-gray-500">예: {currencySymbol}500 OFF</div>
          </button>
        </div>
      </div>

      {/* 캠페인 목적 선택 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">캠페인 목적</label>
        <div className="flex gap-2 flex-wrap">
          {Object.keys(RATE_RECOMMENDATIONS).map((key) => (
            <button
              key={key}
              onClick={() => setCampaignType(key as CampaignType)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                campaignType === key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {key === 'new_user' && '신규 획득'}
              {key === 'retention' && '재구매'}
              {key === 'reactivation' && '휴면 복귀'}
              {key === 'season' && '시즌'}
              {key === 'vip' && 'VIP'}
            </button>
          ))}
        </div>
      </div>

      {/* 추천값 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            추천 {isRate ? '할인율' : '할인 금액'}
          </span>
          <span className="text-2xl font-bold text-green-600">
            {isRate ? `${recommendation.recommended}%` : `${currencySymbol}${recommendation.recommended.toLocaleString()}`}
          </span>
        </div>
        <div className="text-sm text-gray-500 mb-3">
          권장 범위: {isRate 
            ? `${recommendation.min}% ~ ${recommendation.max}%`
            : `${currencySymbol}${recommendation.min.toLocaleString()} ~ ${currencySymbol}${recommendation.max.toLocaleString()}`
          }
        </div>
        <div className="text-sm text-green-700 mb-3">
          💡 {recommendation.reason}
        </div>
        <button
          onClick={applyRecommendation}
          className="w-full py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
        >
          추천값 적용하기
        </button>
      </div>

      {/* 현재 설정 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-sm text-gray-500">{isRate ? '할인율' : '할인 금액'}</div>
          <div className="text-lg font-bold">
            {isRate ? `${settings.discount}%` : `${currencySymbol}${settings.discount.toLocaleString()}`}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-sm text-gray-500">최소 주문</div>
          <div className="text-lg font-bold">
            {settings.minOrderPrice === 0 ? '없음' : `${currencySymbol}${settings.minOrderPrice.toLocaleString()}`}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-sm text-gray-500">최대 할인</div>
          <div className="text-lg font-bold">
            {currencySymbol}{settings.maxDiscountPrice.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 정액 할인 시 안내 */}
      {!isRate && (
        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 mb-4">
          💡 정액 할인은 주로 신규 가입, 휴면 복귀 등 특별 혜택에 사용됩니다.
          최소 주문 금액 없이 고정 금액을 할인합니다.
        </div>
      )}

      {/* 수익성 시뮬레이션 */}
      {showSimulation && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">📈 수익성 시뮬레이션</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">{isRate ? '할인율' : '할인 금액'}</th>
                  <th className="pb-2">예상 마진</th>
                  <th className="pb-2">손익분기</th>
                  <th className="pb-2">수익 영향</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map(sim => (
                  <tr 
                    key={sim.value} 
                    className={`border-b last:border-0 ${settings.discount === sim.value ? 'bg-primary/5' : ''}`}
                  >
                    <td className="py-2 font-medium">
                      {isRate ? `${sim.value}%` : `${currencySymbol}${sim.value.toLocaleString()}`}
                    </td>
                    <td className="py-2">{sim.estimatedMargin}%</td>
                    <td className="py-2">{sim.breakEvenOrders}건</td>
                    <td className="py-2">
                      {sim.profitImpact === 'positive' && <span className="text-green-500">🟢 긍정적</span>}
                      {sim.profitImpact === 'neutral' && <span className="text-yellow-500">🟡 중립</span>}
                      {sim.profitImpact === 'negative' && <span className="text-red-500">🔴 주의</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {isRate && settings.discount >= 20 && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700">
              ⚠️ 20% 이상 할인 시 마진율이 30% 이하로 하락할 수 있습니다.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
