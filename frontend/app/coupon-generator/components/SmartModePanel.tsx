'use client'

import { useState, useEffect, useMemo } from 'react'
import { CouponSettings, formatDateToUTC, calculateValidPeriod, getTodayString, getDateAfterDays } from '../types/coupon'
import { CONCEPT_CATEGORIES, SEASON_EVENTS, Concept, generateCouponName, SeasonEvent } from '../types/concept'
import DiscountOptimizer from './DiscountOptimizer'
import CouponForm from './CouponForm'

interface SmartModePanelProps {
  settings: CouponSettings
  onSettingsChange: (settings: CouponSettings) => void
}

export default function SmartModePanel({ settings, onSettingsChange }: SmartModePanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)
  const [targetRegion, setTargetRegion] = useState<'JP' | 'GLOBAL'>('JP')

  // 다가오는 이벤트 계산
  const upcomingEvents = useMemo(() => {
    const today = new Date()
    const currentYear = today.getFullYear()
    
    return SEASON_EVENTS.filter(event => {
      const eventStart = new Date(currentYear, event.startDate.month - 1, event.startDate.day)
      // 이미 지난 이벤트는 내년으로
      if (eventStart < today) {
        eventStart.setFullYear(currentYear + 1)
      }
      const daysUntil = (eventStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      return daysUntil >= 0 && daysUntil <= 45
    }).slice(0, 3)
  }, [])

  // 컨셉 선택 시 설정 적용
  const applyConcept = (concept: Concept) => {
    setSelectedConcept(concept)
    
    const discount = concept.defaults.discount || 10
    const couponName = generateCouponName(concept, discount)
    
    // 지역에 따른 통화/금액 조정
    let currencyCode = concept.defaults.currencyCode || 'JPY'
    let minOrderPrice = concept.defaults.minOrderPrice || 8000
    let maxDiscountPrice = concept.defaults.maxDiscountPrice || 1000
    
    if (targetRegion === 'GLOBAL' && currencyCode === 'JPY') {
      currencyCode = 'USD'
      minOrderPrice = Math.round(minOrderPrice / 150)
      maxDiscountPrice = Math.round(maxDiscountPrice / 150)
    }

    const fromDate = getTodayString()
    const toDate = getDateAfterDays(concept.defaults.validPeriod || 7)
    
    onSettingsChange({
      ...settings,
      couponName,
      description: `${concept.name} COUPON`,
      fromDateTime: formatDateToUTC(fromDate),
      toDateTime: formatDateToUTC(toDate),
      validPeriod: calculateValidPeriod(fromDate, toDate),
      currencyCode,
      discountType: concept.defaults.discountType || 'RATE',
      discount,
      minOrderPrice,
      maxDiscountPrice,
      isPublic: concept.defaults.isPublic ?? true,
      issueUserId: 0, // 전체 사용자
      applicableTargets: targetRegion === 'JP' 
        ? [{ targetType: 'COUNTRY', targetId: 'JP' }]
        : [],
    })
  }

  // 시즌 이벤트 선택
  const applySeasonEvent = (event: SeasonEvent) => {
    const currentYear = new Date().getFullYear()
    let startDate = new Date(currentYear, event.startDate.month - 1, event.startDate.day)
    let endDate = new Date(currentYear, event.endDate.month - 1, event.endDate.day)
    
    // 이미 지난 이벤트는 내년으로
    if (startDate < new Date()) {
      startDate.setFullYear(currentYear + 1)
      endDate.setFullYear(currentYear + 1)
    }

    const fromDateStr = startDate.toISOString().split('T')[0]
    const toDateStr = endDate.toISOString().split('T')[0]
    
    const discount = event.recommendedDiscount
    const couponName = `${event.nameJP}限定${discount}%OFF`

    const isGlobal = event.targetRegions.includes('GLOBAL')
    const currencyCode = isGlobal ? 'USD' : 'JPY'
    const minOrderPrice = isGlobal ? 20 : 8000
    const maxDiscountPrice = isGlobal ? 3 : 1000

    onSettingsChange({
      ...settings,
      couponName,
      description: `${event.name} COUPON`,
      fromDateTime: formatDateToUTC(fromDateStr),
      toDateTime: formatDateToUTC(toDateStr),
      validPeriod: calculateValidPeriod(fromDateStr, toDateStr),
      currencyCode,
      discountType: 'RATE',
      discount,
      minOrderPrice,
      maxDiscountPrice,
      isPublic: true,
      issueUserId: 0, // 전체 사용자
      applicableTargets: isGlobal ? [] : [{ targetType: 'COUNTRY', targetId: 'JP' }],
    })
  }

  return (
    <div className="space-y-6">
      {/* 다가오는 이벤트 추천 */}
      {upcomingEvents.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💡</span>
            <h3 className="font-semibold">추천: 다가오는 이벤트</h3>
          </div>
          <div className="flex gap-3 flex-wrap">
            {upcomingEvents.map(event => (
              <button
                key={event.id}
                onClick={() => applySeasonEvent(event)}
                className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl hover:shadow-md transition-all text-left"
              >
                <div className="font-medium text-amber-800">{event.nameJP}</div>
                <div className="text-sm text-amber-600">
                  {event.startDate.month}/{event.startDate.day} ~ {event.endDate.month}/{event.endDate.day}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 지역 선택 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🌍</span>
          <h3 className="font-semibold">대상 지역</h3>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setTargetRegion('JP')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              targetRegion === 'JP'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🇯🇵 일본
          </button>
          <button
            onClick={() => setTargetRegion('GLOBAL')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              targetRegion === 'GLOBAL'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🌏 글로벌
          </button>
        </div>
      </div>

      {/* 컨셉 카테고리 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📁</span>
          <h3 className="font-semibold">캠페인 컨셉</h3>
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          {CONCEPT_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedCategory === category.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* 선택된 카테고리의 컨셉들 */}
        {selectedCategory && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
            {CONCEPT_CATEGORIES.find(c => c.id === selectedCategory)?.concepts.map(concept => (
              <button
                key={concept.id}
                onClick={() => applyConcept(concept)}
                className={`p-3 rounded-lg text-left transition-all border ${
                  selectedConcept?.id === concept.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{concept.name}</div>
                <div className="text-sm text-gray-500">{concept.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 할인율 최적화 */}
      <DiscountOptimizer 
        settings={settings} 
        onSettingsChange={onSettingsChange}
        targetRegion={targetRegion}
      />

      {/* 상세 설정 폼 */}
      <CouponForm 
        settings={settings} 
        onSettingsChange={onSettingsChange}
        showAdvanced={false}
      />
    </div>
  )
}
