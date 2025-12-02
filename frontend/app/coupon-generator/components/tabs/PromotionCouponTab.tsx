'use client'

import { useState } from 'react'
import { CouponSettings, defaultCouponSettings, validateCouponSettings } from '../../types/coupon'
import SmartModePanel from '../SmartModePanel'
import ManualModePanel from '../ManualModePanel'
import QueryPreview from '../QueryPreview'

type GeneratorMode = 'smart' | 'manual'

export default function PromotionCouponTab() {
  const [mode, setMode] = useState<GeneratorMode>('smart')
  const [settings, setSettings] = useState<CouponSettings>(defaultCouponSettings)
  const [copied, setCopied] = useState(false)

  const handleCopyQuery = () => {
    const query = generateQuery(settings)
    navigator.clipboard.writeText(JSON.stringify(query, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateQuery = (s: CouponSettings) => {
    return {
      adminId: 0,
      issueUserId: s.issueUserId,
      couponName: s.couponName,
      description: s.description,
      fromDateTime: s.fromDateTime,
      toDateTime: s.toDateTime,
      maxValidDateTime: s.toDateTime,
      validPeriod: s.validPeriod,
      currencyCode: s.currencyCode,
      discountType: s.discountType,
      discount: s.discount,
      minOrderPrice: s.minOrderPrice,
      maxDiscountPrice: s.maxDiscountPrice,
      issueLimit: s.issueLimit,
      issueLimitPerUser: s.issueLimitPerUser,
      useLimitPerUser: s.useLimitPerUser,
      isPublic: s.isPublic,
      applicableTargets: s.applicableTargets,
    }
  }

  const validation = validateCouponSettings(settings)

  return (
    <div>
      {/* 모드 선택 */}
      <div className="border-b mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚡</span>
          <h2 className="text-lg font-semibold">생성 모드</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setMode('smart')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              mode === 'smart'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>🚀</span>
            <span>스마트 모드</span>
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              mode === 'manual'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>⚙️</span>
            <span>직접 설정</span>
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {mode === 'smart' ? (
            <SmartModePanel settings={settings} onSettingsChange={setSettings} />
          ) : (
            <ManualModePanel settings={settings} onSettingsChange={setSettings} />
          )}
        </div>
        <div>
          <QueryPreview 
            query={generateQuery(settings)} 
            onCopy={handleCopyQuery}
            copied={copied}
            validation={validation}
          />
        </div>
      </div>
    </div>
  )
}
