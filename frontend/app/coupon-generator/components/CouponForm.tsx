'use client'

import { useState } from 'react'
import { CouponSettings, formatDateToUTC, calculateValidPeriod, getTodayString } from '../types/coupon'

interface CouponFormProps {
  settings: CouponSettings
  onSettingsChange: (settings: CouponSettings) => void
  showAdvanced?: boolean
}

const COUNTRY_PRESETS = {
  jp: { name: '일본', countries: ['JP'] },
  english: { name: '영어권', countries: ['US', 'CA', 'AU', 'NZ', 'GB', 'SG', 'HK'] },
  asia: { name: '아시아', countries: ['TW', 'TH', 'PH', 'SG', 'HK'] },
  europe: { name: '유럽', countries: ['DE', 'CH', 'ES', 'IT', 'GB'] },
  middle_east: { name: '중동', countries: ['SA', 'AE'] },
}

const ALL_COUNTRIES = ['JP', 'US', 'CA', 'AU', 'NZ', 'GB', 'SG', 'HK', 'TW', 'TH', 'PH', 'SA', 'AE', 'DE', 'CH', 'ES', 'IT']

export default function CouponForm({ settings, onSettingsChange, showAdvanced = true }: CouponFormProps) {
  const [showCountrySelector, setShowCountrySelector] = useState(false)

  // 날짜 입력 시 UTC 변환
  const handleDateChange = (field: 'from' | 'to', dateStr: string) => {
    const utcDate = formatDateToUTC(dateStr)
    
    if (field === 'from') {
      const newValidPeriod = calculateValidPeriod(dateStr, getToDateFromUTC(settings.toDateTime))
      onSettingsChange({
        ...settings,
        fromDateTime: utcDate,
        validPeriod: newValidPeriod,
      })
    } else {
      const newValidPeriod = calculateValidPeriod(getToDateFromUTC(settings.fromDateTime), dateStr)
      onSettingsChange({
        ...settings,
        toDateTime: utcDate,
        validPeriod: newValidPeriod,
      })
    }
  }

  // UTC에서 로컬 날짜 추출
  const getToDateFromUTC = (utcStr: string): string => {
    // "2025-12-01T15:00:00+00:00" -> "2025-12-02" (KST)
    const match = utcStr.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
      date.setDate(date.getDate() + 1) // UTC 전날 15:00 -> KST 당일
      return date.toISOString().split('T')[0]
    }
    return getTodayString()
  }

  // 국가 토글
  const toggleCountry = (countryCode: string) => {
    const currentTargets = settings.applicableTargets.filter(t => t.targetType === 'COUNTRY')
    const hasCountry = currentTargets.some(t => t.targetId === countryCode)
    
    let newTargets = settings.applicableTargets.filter(t => t.targetType !== 'COUNTRY' || t.targetId !== countryCode)
    if (!hasCountry) {
      newTargets = [...newTargets, { targetType: 'COUNTRY' as const, targetId: countryCode }]
    }
    
    onSettingsChange({ ...settings, applicableTargets: newTargets })
  }

  // 프리셋 적용
  const applyCountryPreset = (presetKey: keyof typeof COUNTRY_PRESETS) => {
    const preset = COUNTRY_PRESETS[presetKey]
    const showroomTargets = settings.applicableTargets.filter(t => t.targetType === 'SHOWROOM')
    const countryTargets = preset.countries.map(c => ({ targetType: 'COUNTRY' as const, targetId: c }))
    
    onSettingsChange({
      ...settings,
      applicableTargets: [...showroomTargets, ...countryTargets],
    })
  }

  const selectedCountries = settings.applicableTargets
    .filter(t => t.targetType === 'COUNTRY')
    .map(t => t.targetId)

  const showroomId = settings.applicableTargets.find(t => t.targetType === 'SHOWROOM')?.targetId || ''

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📝</span>
        <h3 className="font-semibold">쿠폰 설정</h3>
      </div>

      <div className="space-y-4">
        {/* 쿠폰명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">쿠폰명</label>
          <input
            type="text"
            value={settings.couponName}
            onChange={e => onSettingsChange({ ...settings, couponName: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="예: GW限定10%OFF"
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">설명 (내부용)</label>
          <input
            type="text"
            value={settings.description}
            onChange={e => onSettingsChange({ ...settings, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="예: Golden Week COUPON(JP)"
          />
        </div>

        {/* 기간 설정 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일 (KST)</label>
            <input
              type="date"
              value={getToDateFromUTC(settings.fromDateTime)}
              onChange={e => handleDateChange('from', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일 (KST)</label>
            <input
              type="date"
              value={getToDateFromUTC(settings.toDateTime)}
              onChange={e => handleDateChange('to', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
        <div className="text-sm text-gray-500">
          유효기간: {settings.validPeriod}일
        </div>

        {showAdvanced && (
          <>
            {/* 할인 설정 */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">💰 할인 설정</h4>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">통화</label>
                  <select
                    value={settings.currencyCode}
                    onChange={e => onSettingsChange({ ...settings, currencyCode: e.target.value as 'JPY' | 'USD' })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="JPY">JPY (¥)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">할인 유형</label>
                  <select
                    value={settings.discountType}
                    onChange={e => onSettingsChange({ ...settings, discountType: e.target.value as 'FIXED' | 'RATE' })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="RATE">정률 (%)</option>
                    <option value="FIXED">정액</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    할인 {settings.discountType === 'RATE' ? '(%)' : `(${settings.currencyCode})`}
                  </label>
                  <input
                    type="number"
                    value={settings.discount}
                    onChange={e => onSettingsChange({ ...settings, discount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">최소 주문</label>
                  <input
                    type="number"
                    value={settings.minOrderPrice}
                    onChange={e => onSettingsChange({ ...settings, minOrderPrice: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">최대 할인</label>
                  <input
                    type="number"
                    value={settings.maxDiscountPrice}
                    onChange={e => onSettingsChange({ ...settings, maxDiscountPrice: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* 발급 설정 */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">🎯 발급 설정</h4>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">총 발급</label>
                  <input
                    type="number"
                    value={settings.issueLimit}
                    onChange={e => onSettingsChange({ ...settings, issueLimit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">1인당 발급</label>
                  <input
                    type="number"
                    value={settings.issueLimitPerUser}
                    onChange={e => onSettingsChange({ ...settings, issueLimitPerUser: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">1인당 사용</label>
                  <input
                    type="number"
                    value={settings.useLimitPerUser}
                    onChange={e => onSettingsChange({ ...settings, useLimitPerUser: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isPublic}
                  onChange={e => onSettingsChange({ ...settings, isPublic: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">공개 쿠폰</span>
              </label>
            </div>
          </>
        )}

        {/* 적용 대상 */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">🌍 적용 대상</h4>
          
          {/* 국가 프리셋 */}
          <div className="flex gap-2 flex-wrap mb-3">
            {Object.entries(COUNTRY_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyCountryPreset(key as keyof typeof COUNTRY_PRESETS)}
                className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* 국가 선택 */}
          <button
            onClick={() => setShowCountrySelector(!showCountrySelector)}
            className="text-sm text-primary hover:underline mb-2"
          >
            {showCountrySelector ? '국가 선택 숨기기' : '국가 직접 선택'}
          </button>
          
          {showCountrySelector && (
            <div className="flex gap-2 flex-wrap mb-3 p-3 bg-gray-50 rounded-lg">
              {ALL_COUNTRIES.map(country => (
                <label key={country} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCountries.includes(country)}
                    onChange={() => toggleCountry(country)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{country}</span>
                </label>
              ))}
            </div>
          )}

          {selectedCountries.length > 0 && (
            <div className="text-sm text-gray-600 mb-3">
              선택된 국가: {selectedCountries.join(', ')}
            </div>
          )}

          {/* 쇼룸 ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">쇼룸 ID</label>
            <input
              type="text"
              value={showroomId}
              onChange={e => {
                const otherTargets = settings.applicableTargets.filter(t => t.targetType !== 'SHOWROOM')
                const newTargets = e.target.value 
                  ? [...otherTargets, { targetType: 'SHOWROOM' as const, targetId: e.target.value }]
                  : otherTargets
                onSettingsChange({ ...settings, applicableTargets: newTargets })
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="예: 1109"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
