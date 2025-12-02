'use client'

import { useState } from 'react'
import SmartModePanel from './components/SmartModePanel'
import ManualModePanel from './components/ManualModePanel'
import QueryPreview from './components/QueryPreview'
import { CouponSettings, defaultCouponSettings } from './types/coupon'

type GeneratorMode = 'smart' | 'manual'

export default function CouponGeneratorPage() {
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
      issueUserId: 0,
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

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 */}
      <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 mb-6 overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">🎟️</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">쿠폰 쿼리 생성기</h1>
            <p className="text-white/80 text-sm font-medium">마케팅 캠페인용 쿠폰 발급 쿼리를 쉽게 생성하세요</p>
          </div>
        </div>
      </div>

      {/* 모드 선택 탭 */}
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
        {/* 설정 패널 */}
        <div>
          {mode === 'smart' ? (
            <SmartModePanel settings={settings} onSettingsChange={setSettings} />
          ) : (
            <ManualModePanel settings={settings} onSettingsChange={setSettings} />
          )}
        </div>

        {/* 쿼리 미리보기 */}
        <div>
          <QueryPreview 
            query={generateQuery(settings)} 
            onCopy={handleCopyQuery}
            copied={copied}
          />
        </div>
      </div>
    </div>
  )
}
