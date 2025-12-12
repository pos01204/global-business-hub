'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FadeIn } from '@/components/ui/FadeIn'

interface ChartDrillDownModalProps {
  isOpen: boolean
  onClose: () => void
  data: {
    label: string
    value: number
    dataset: string
    index: number
    details?: Array<{
      label: string
      value: number
      percentage?: number
    }>
  } | null
  onFilter?: (filter: { label: string; value: number }) => void
}

export function ChartDrillDownModal({
  isOpen,
  onClose,
  data,
  onFilter,
}: ChartDrillDownModalProps) {
  if (!isOpen || !data) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <FadeIn>
        <Card className="p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              📊 상세 데이터
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">선택된 항목</div>
              <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {data.label}
              </div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                데이터셋: {data.dataset}
              </div>
            </div>

            {data.details && data.details.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  세부 내역
                </h3>
                <div className="space-y-2">
                  {data.details.map((detail, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {detail.label}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {typeof detail.value === 'number' ? detail.value.toLocaleString() : detail.value}
                        </span>
                        {detail.percentage !== undefined && (
                          <Badge variant="info">
                            {detail.percentage.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {onFilter && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    onFilter({ label: data.label, value: data.value })
                    onClose()
                  }}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  이 항목으로 필터링
                </button>
              </div>
            )}
          </div>
        </Card>
      </FadeIn>
    </div>
  )
}

