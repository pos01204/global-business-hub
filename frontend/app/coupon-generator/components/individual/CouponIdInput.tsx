'use client'

import { IndividualIssueSettings } from '../../types/individual'

interface CouponIdInputProps {
  settings: IndividualIssueSettings
  onSettingsChange: (settings: IndividualIssueSettings) => void
}

export default function CouponIdInput({ settings, onSettingsChange }: CouponIdInputProps) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📋</span>
        <h3 className="font-semibold">쿠폰 정보</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            쿠폰 ID <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={settings.couponId || ''}
            onChange={e => onSettingsChange({
              ...settings,
              couponId: parseInt(e.target.value) || null
            })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="예: 967"
          />
          <p className="text-xs text-gray-500 mt-1">
            기존에 생성된 쿠폰의 ID를 입력하세요.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">발급 기간</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">시작일 (KST)</label>
              <input
                type="date"
                value={settings.fromDate}
                onChange={e => onSettingsChange({ ...settings, fromDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">종료일 (KST)</label>
              <input
                type="date"
                value={settings.toDate}
                onChange={e => onSettingsChange({ ...settings, toDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            한국 시간 기준으로 입력하면 UTC로 자동 변환됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
