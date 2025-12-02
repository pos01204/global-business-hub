'use client'

import { ValidationResult } from '../types/coupon'

interface QueryPreviewProps {
  query: object
  onCopy: () => void
  copied: boolean
  validation?: ValidationResult
}

export default function QueryPreview({ query, onCopy, copied, validation }: QueryPreviewProps) {
  const jsonString = JSON.stringify(query, null, 2)
  const hasErrors = validation && !validation.isValid
  const hasWarnings = validation && validation.warnings.length > 0

  return (
    <div className="card sticky top-4">
      {/* 검증 결과 */}
      {validation && (hasErrors || hasWarnings) && (
        <div className="mb-4 space-y-2">
          {hasErrors && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                <span>❌</span>
                <span>입력 오류</span>
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {validation.errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          {hasWarnings && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 font-medium mb-1">
                <span>⚠️</span>
                <span>주의사항</span>
              </div>
              <ul className="text-sm text-yellow-600 space-y-1">
                {validation.warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
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
          onClick={onCopy}
          disabled={hasErrors}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            hasErrors
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : copied
                ? 'bg-green-500 text-white'
                : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {copied ? (
            <>
              <span>✓</span>
              <span>복사됨!</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>쿼리 복사</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-[600px]">
        <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
          {jsonString}
        </pre>
      </div>

      {/* 요약 정보 */}
      <div className="mt-4 pt-4 border-t">
        <h4 className="font-medium mb-2">📊 요약</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">쿠폰명:</span>
            <span className="font-medium truncate ml-2">{(query as any).couponName || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">할인:</span>
            <span className="font-medium">
              {(query as any).discountType === 'RATE' 
                ? `${(query as any).discount}%` 
                : `${(query as any).currencyCode === 'JPY' ? '¥' : '$'}${(query as any).discount}`
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">유효기간:</span>
            <span className="font-medium">{(query as any).validPeriod}일</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">발급수량:</span>
            <span className="font-medium">{(query as any).issueLimit}개</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">공개:</span>
            <span className="font-medium">{(query as any).isPublic ? '✓' : '✗'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">대상:</span>
            <span className="font-medium">
              {(query as any).applicableTargets?.length > 0 
                ? (query as any).applicableTargets.map((t: any) => t.targetId).join(', ')
                : '전체'
              }
            </span>
          </div>
        </div>
      </div>

      {/* 사용 안내 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
        💡 복사한 쿼리를 쿠폰 발급 시스템에 붙여넣기 하세요.
      </div>
    </div>
  )
}
