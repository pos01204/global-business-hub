'use client'

import { useState, useMemo } from 'react'
import { CouponSettings } from '../types/coupon'

interface DiscountOptimizerProps {
  settings: CouponSettings
  onSettingsChange: (settings: CouponSettings) => void
  targetRegion: 'JP' | 'GLOBAL'
}

interface DiscountSimulation {
  discountRate: number
  estimatedMargin: number
  breakEvenOrders: number
  profitImpact: 'positive' | 'neutral' | 'negative'
}

const CAMPAIGN_RECOMMENDATIONS = {
  new_user: { recommended: 15, min: 10, max: 20, reason: '신규 고객 획득을 위한 공격적 할인' },
  retention: { recommended: 10, min: 8, max: 12, reason: '기존 고객 재구매 유도' },
  reactivation: { recommended: 15, min: 12, max: 20, reason: '휴면 고객 복귀 유도' },
  season: { recommended: 10, min: 8, max: 15, reason: '시즌 프로모션 평균 할인율' },
  vip: { recommended: 12, min: 10, max: 15, reason: 'VIP 고객 충성도 유지' },
}

const CATEGORY_MARGINS = {
  accessory: { name: '액세서리', margin: 65, maxDiscount: 20 },
  clothing: { name: '의류', margin: 55, maxDiscount: 15 },
  bag: { name: '가방/잡화', margin: 50, maxDiscount: 12 },
  interior: { name: '인테리어', margin: 45, maxDiscount: 10 },
  food: { name: '푸드', margin: 35, maxDiscount: 8 },
}

export default function DiscountOptimizer({ settings, onSettingsChange, targetRegion }: DiscountOptimizerProps) {
  const [campaignType, setCampaignType] = useState<keyof typeof CAMPAIGN_RECOMMENDATIONS>('season')
  const [showSimulation, setShowSimulation] = useState(false)

  const recommendation = CAMPAIGN_RECOMMENDATIONS[campaignType]

  // 할인율 시뮬레이션
  const simulations: DiscountSimulation[] = useMemo(() => {
    const baseMargin = 50 // 평균 마진율 가정
    const rates = [8, 10, 12, 15, 20]
    
    return rates.map(rate => {
      const estimatedMargin = baseMargin - rate
      const breakEvenOrders = Math.ceil(rate / (estimatedMargin / 100) * 2)
      
      return {
        discountRate: rate,
        estimatedMargin,
        breakEvenOrders,
        profitImpact: estimatedMargin > 35 ? 'positive' : estimatedMargin > 25 ? 'neutral' : 'negative',
      }
    })
  }, [])

  const applyRecommendation = () => {
    const discount = recommendation.recommended
    const isJPY = targetRegion === 'JP'
    
    // 할인율에 따른 최소 주문/최대 할인 자동 계산
    const minOrderPrice = isJPY 
      ? discount <= 10 ? 8000 : discount <= 15 ? 10000 : 15000
      : discount <= 10 ? 20 : discount <= 15 ? 25 : 30
    
    const maxDiscountPrice = isJPY
      ? Math.round(minOrderPrice * discount / 100 * 1.2)
      : Math.round(minOrderPrice * discount / 100 * 1.2)

    onSettingsChange({
      ...settings,
      discount,
      minOrderPrice,
      maxDiscountPrice,
    })
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <h3 className="font-semibold">할인율 최적화</h3>
        </div>
        <button
          onClick={() => setShowSimulation(!showSimulation)}
          className="text-sm text-primary hover:underline"
        >
          {showSimulation ? '시뮬레이션 숨기기' : '수익성 시뮬레이션'}
        </button>
      </div>

      {/* 캠페인 목적 선택 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">캠페인 목적</label>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(CAMPAIGN_RECOMMENDATIONS).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setCampaignType(key as keyof typeof CAMPAIGN_RECOMMENDATIONS)}
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

      {/* 추천 할인율 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">추천 할인율</span>
          <span className="text-2xl font-bold text-green-600">{recommendation.recommended}%</span>
        </div>
        <div className="text-sm text-gray-500 mb-3">
          권장 범위: {recommendation.min}% ~ {recommendation.max}%
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
          <div className="text-sm text-gray-500">할인율</div>
          <div className="text-lg font-bold">{settings.discount}%</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-sm text-gray-500">최소 주문</div>
          <div className="text-lg font-bold">
            {settings.currencyCode === 'JPY' ? '¥' : '$'}{settings.minOrderPrice.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-sm text-gray-500">최대 할인</div>
          <div className="text-lg font-bold">
            {settings.currencyCode === 'JPY' ? '¥' : '$'}{settings.maxDiscountPrice.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 수익성 시뮬레이션 */}
      {showSimulation && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">📈 수익성 시뮬레이션</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">할인율</th>
                  <th className="pb-2">예상 마진</th>
                  <th className="pb-2">손익분기</th>
                  <th className="pb-2">수익 영향</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map(sim => (
                  <tr 
                    key={sim.discountRate} 
                    className={`border-b last:border-0 ${settings.discount === sim.discountRate ? 'bg-primary/5' : ''}`}
                  >
                    <td className="py-2 font-medium">{sim.discountRate}%</td>
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
          
          {settings.discount >= 20 && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700">
              ⚠️ 20% 이상 할인 시 마진율이 30% 이하로 하락할 수 있습니다.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
