'use client'

import { IndividualIssueSettings } from '../../types/individual'

interface BatchOptionsProps {
  settings: IndividualIssueSettings
  onSettingsChange: (settings: IndividualIssueSettings) => void
  userCount: number
}

export default function BatchOptions({ settings, onSettingsChange, userCount }: BatchOptionsProps) {
  const batchCount = settings.batchConfig.enabled 
    ? Math.ceil(userCount / settings.batchConfig.batchSize)
    : 1

  const handleBatchToggle = (enabled: boolean) => {
    onSettingsChange({
      ...settings,
      batchConfig: { ...settings.batchConfig, enabled },
    })
  }

  const handleBatchSizeChange = (batchSize: number) => {
    onSettingsChange({
      ...settings,
      batchConfig: { ...settings.batchConfig, batchSize: Math.max(1, batchSize) },
    })
  }

  const getBatchSizeRecommendation = () => {
    if (userCount <= 100) return null
    if (userCount <= 1000) return 100
    if (userCount <= 5000) return 200
    return 500
  }

  const recommendation = getBatchSizeRecommendation()

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⚙️</span>
        <h3 className="font-semibold">발급 옵션</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.batchConfig.enabled}
              onChange={e => handleBatchToggle(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div>
              <span className="font-medium">배치 분할 사용</span>
              <p className="text-sm text-gray-500">대량 발급 시 여러 개의 작은 쿼리로 분할합니다.</p>
            </div>
          </label>
        </div>

        {settings.batchConfig.enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">배치 크기 (명)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="1000"
                value={settings.batchConfig.batchSize}
                onChange={e => handleBatchSizeChange(parseInt(e.target.value) || 100)}
                className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="text-sm text-gray-500">명씩 분할</span>
              {recommendation && (
                <button
                  onClick={() => handleBatchSizeChange(recommendation)}
                  className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  권장: {recommendation}명
                </button>
              )}
            </div>
          </div>
        )}

        {userCount > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">총 대상 유저:</span>
                <span className="font-medium">{userCount.toLocaleString()}명</span>
              </div>
              {settings.batchConfig.enabled ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">배치 수:</span>
                    <span className="font-medium">{batchCount}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">배치당 크기:</span>
                    <span className="font-medium">
                      최대 {settings.batchConfig.batchSize}명
                      {userCount % settings.batchConfig.batchSize !== 0 && 
                        ` (마지막: ${userCount % settings.batchConfig.batchSize}명)`
                      }
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-600">생성될 쿼리:</span>
                  <span className="font-medium">1개 (전체)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {userCount > 1000 && !settings.batchConfig.enabled && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">⚠️</span>
              <div className="text-sm text-yellow-700">
                <div className="font-medium mb-1">배치 분할 권장</div>
                <div>1,000명 이상 대량 발급 시 배치 분할을 사용하면 안정적으로 처리할 수 있습니다.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
