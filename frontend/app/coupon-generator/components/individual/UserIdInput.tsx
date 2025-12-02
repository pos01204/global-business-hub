'use client'

import { IndividualIssueSettings } from '../../types/individual'
import { parseUserIds } from '../../utils/userIdParser'

interface UserIdInputProps {
  settings: IndividualIssueSettings
  onSettingsChange: (settings: IndividualIssueSettings) => void
}

export default function UserIdInput({ settings, onSettingsChange }: UserIdInputProps) {
  const parsedUserIds = parseUserIds(settings.manualUserIds)
  const hasSegment = settings.segment && settings.segment.userIds.length > 0

  const handleUserIdsChange = (value: string) => {
    onSettingsChange({
      ...settings,
      manualUserIds: value,
      segment: null,
    })
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📝</span>
        <h3 className="font-semibold">직접 유저 ID 입력</h3>
      </div>

      {hasSegment && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          💡 세그먼트가 선택되어 있습니다. 직접 입력하면 세그먼트 선택이 해제됩니다.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">유저 ID 목록</label>
          <textarea
            value={settings.manualUserIds}
            onChange={e => handleUserIdsChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            rows={5}
            placeholder={`유저 ID를 입력하세요.\n쉼표 구분: 12345, 67890\n줄바꿈 구분:\n12345\n67890`}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">쉼표, 줄바꿈, 공백으로 구분</p>
            {parsedUserIds.length > 0 && (
              <span className="text-sm font-medium text-primary">
                {parsedUserIds.length.toLocaleString()}명 인식됨
              </span>
            )}
          </div>
        </div>

        {parsedUserIds.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              인식된 유저 ID ({parsedUserIds.length}명)
            </label>
            <div className="p-3 bg-gray-50 rounded-lg max-h-24 overflow-y-auto">
              <div className="text-sm text-gray-600 font-mono">
                {parsedUserIds.slice(0, 20).join(', ')}
                {parsedUserIds.length > 20 && (
                  <span className="text-gray-400"> ... 외 {parsedUserIds.length - 20}명</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">빠른 테스트</label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleUserIdsChange('12345, 67890, 11111, 22222, 33333')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              샘플 (5명)
            </button>
            <button
              onClick={() => {
                const ids = Array.from({ length: 50 }, (_, i) => 10000 + i).join(', ')
                handleUserIdsChange(ids)
              }}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              샘플 (50명)
            </button>
            <button
              onClick={() => handleUserIdsChange('')}
              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
            >
              초기화
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
