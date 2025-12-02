'use client'

import { useState } from 'react'
import { IndividualIssueSettings } from '../../types/individual'
import { generateIndividualQuery, generateBatchQueries } from '../../utils/userIdParser'

interface IndividualQueryPreviewProps {
  settings: IndividualIssueSettings
  userIds: number[]
  validation: { isValid: boolean; errors: string[]; warnings: string[] }
  onCopy: () => void
  copied: boolean
}

export default function IndividualQueryPreview({ 
  settings, userIds, validation, onCopy, copied 
}: IndividualQueryPreviewProps) {
  const [selectedBatch, setSelectedBatch] = useState(0)

  const generateQueries = () => {
    if (!settings.couponId || userIds.length === 0) return []

    if (settings.batchConfig.enabled) {
      return generateBatchQueries(
        settings.couponId,
        settings.fromDate,
        settings.toDate,
        userIds,
        settings.batchConfig.batchSize
      )
    } else {
      return [generateIndividualQuery(
        settings.couponId,
        settings.fromDate,
        settings.toDate,
        userIds
      )]
    }
  }

  const queries = generateQueries()
  const hasErrors = !validation.isValid || !settings.couponId
  const hasWarnings = validation.warnings.length > 0

  const handleCopyQuery = (queryIndex?: number) => {
    if (hasErrors) return

    let textToCopy: string
    
    if (typeof queryIndex === 'number') {
      textToCopy = JSON.stringify(queries[queryIndex], null, 2)
    } else {
      if (queries.length === 1) {
        textToCopy = JSON.stringify(queries[0], null, 2)
      } else {
        textToCopy = queries.map((query, i) => 
          `// 배치 ${i + 1}\n${JSON.stringify(query, null, 2)}`
        ).join('\n\n')
      }
    }

    navigator.clipboard.writeText(textToCopy)
    onCopy()
  }

  return (
    <div className="card sticky top-4">
      {(hasErrors || hasWarnings) && (
        <div className="mb-4 space-y-2">
          {hasErrors && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                <span>❌</span><span>입력 오류</span>
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {!settings.couponId && <li>• 쿠폰 ID를 입력해주세요.</li>}
                {validation.errors.map((error, i) => <li key={i}>• {error}</li>)}
              </ul>
            </div>
          )}
          {hasWarnings && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 font-medium mb-1">
                <span>⚠️</span><span>주의사항</span>
              </div>
              <ul className="text-sm text-yellow-600 space-y-1">
                {validation.warnings.map((warning, i) => <li key={i}>• {warning}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <h3 className="font-semibold">생성된 쿼리</h3>
        </div>
        <button
          onClick={() => handleCopyQuery()}
          disabled={hasErrors}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            hasErrors
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : copied
                ? 'bg-green-500 text-white'
                : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {copied ? (<><span>✓</span><span>복사됨!</span></>) : (<><span>📋</span><span>{queries.length > 1 ? '전체 복사' : '쿼리 복사'}</span></>)}
        </button>
      </div>

      {queries.length > 1 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">배치 선택:</span>
            <select
              value={selectedBatch}
              onChange={e => setSelectedBatch(parseInt(e.target.value))}
              className="px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {queries.map((_, i) => (
                <option key={i} value={i}>배치 {i + 1} ({queries[i].userIds.length}명)</option>
              ))}
            </select>
            <button
              onClick={() => handleCopyQuery(selectedBatch)}
              disabled={hasErrors}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
            >
              이 배치만 복사
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-[400px] mb-4">
        <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
          {queries.length > 0 ? (
            queries.length === 1 
              ? JSON.stringify(queries[0], null, 2)
              : JSON.stringify(queries[selectedBatch], null, 2)
          ) : (
            '// 쿠폰 ID와 대상 유저를 설정하면 쿼리가 생성됩니다.'
          )}
        </pre>
      </div>

      {queries.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">📊 요약</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">쿠폰 ID:</span>
              <span className="font-medium">{settings.couponId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">대상 유저:</span>
              <span className="font-medium">{userIds.length.toLocaleString()}명</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">발급 기간:</span>
              <span className="font-medium">
                {new Date(settings.fromDate).toLocaleDateString()} ~ {new Date(settings.toDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">쿼리 수:</span>
              <span className="font-medium">{queries.length}개{queries.length > 1 && ' (배치 분할)'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
        💡 복사한 쿼리를 개별 발급 시스템에 붙여넣기 하세요.
        {queries.length > 1 && <div className="mt-1">배치가 여러 개인 경우 순차적으로 발급하는 것을 권장합니다.</div>}
      </div>
    </div>
  )
}
