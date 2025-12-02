'use client'

import { CouponSettings } from '../types/coupon'
import CouponForm from './CouponForm'

interface ManualModePanelProps {
  settings: CouponSettings
  onSettingsChange: (settings: CouponSettings) => void
}

const TEMPLATES = {
  newUser: {
    name: '🎁 신규 가입 쿠폰',
    description: '신규 가입자 대상 웰컴 쿠폰',
    defaults: {
      couponName: '今だけ！初回限定クーポン',
      description: '初回限定クーポン（全商品対象）',
      discountType: 'FIXED' as const,
      discount: 500,
      currencyCode: 'JPY' as const,
      minOrderPrice: 0,
      maxDiscountPrice: 500,
      isPublic: false,
      applicableTargets: [],
    },
  },
  jpPromotion: {
    name: '🇯🇵 일본 기획전',
    description: '일본 대상 시즌/이벤트 기획전',
    defaults: {
      couponName: '限定10%OFF',
      description: 'Promotion COUPON(JP)',
      discountType: 'RATE' as const,
      discount: 10,
      currencyCode: 'JPY' as const,
      minOrderPrice: 8000,
      maxDiscountPrice: 1000,
      isPublic: true,
      applicableTargets: [{ targetType: 'COUNTRY' as const, targetId: 'JP' }],
    },
  },
  globalPromotion: {
    name: '🌏 글로벌 기획전',
    description: '일본 외 글로벌 대상 기획전',
    defaults: {
      couponName: '限定10%OFF',
      description: 'Promotion COUPON(Global)',
      discountType: 'RATE' as const,
      discount: 10,
      currencyCode: 'USD' as const,
      minOrderPrice: 20,
      maxDiscountPrice: 3,
      isPublic: true,
      applicableTargets: [],
    },
  },
}

export default function ManualModePanel({ settings, onSettingsChange }: ManualModePanelProps) {
  const applyTemplate = (templateKey: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[templateKey]
    onSettingsChange({
      ...settings,
      ...template.defaults,
    })
  }

  return (
    <div className="space-y-6">
      {/* 템플릿 선택 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📋</span>
          <h3 className="font-semibold">빠른 템플릿</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => applyTemplate(key as keyof typeof TEMPLATES)}
              className="p-4 border rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="font-medium">{template.name}</div>
              <div className="text-sm text-gray-500">{template.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 상세 설정 폼 */}
      <CouponForm 
        settings={settings} 
        onSettingsChange={onSettingsChange}
        showAdvanced={true}
      />
    </div>
  )
}
