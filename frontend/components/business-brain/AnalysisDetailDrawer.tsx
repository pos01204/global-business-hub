/**
 * AnalysisDetailDrawer - 분석 상세 정보 드로어 컴포넌트
 * v4.2: 데이터 신뢰도 개선 계획
 */

'use client'

import { ConfidenceBadge, Reliability } from './ConfidenceBadge'
import { ConfidenceInterval } from './ConfidenceInterval'
import { DataQualityIndicator } from './DataQualityIndicator'

interface ConfidenceInfo {
  value: number
  confidenceInterval: [number, number]
  confidenceLevel: number
  sampleSize: number
  reliability: Reliability
  dataSource: 'actual' | 'estimated'
  dataQuality?: {
    completeness: number
    accuracy: number
    freshness: number
    missingData: number
  }
  statisticalTest?: {
    type: 'proportion' | 'mean'
    pValue?: number | null
    effectSize?: number | null
    stdDev?: number
  }
}

interface AnalysisDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  analysis: {
    metric: string
    value: number
    confidence: ConfidenceInfo
    dataSource: string
    calculationMethod: string
    statisticalTest?: ConfidenceInfo['statisticalTest']
  }
}

export function AnalysisDetailDrawer({ isOpen, onClose, analysis }: AnalysisDetailDrawerProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            분석 상세 정보
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="text-slate-600 dark:text-slate-400 text-xl">×</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 기본 정보 */}
          <section>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">기본 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">지표:</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{analysis.metric}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">값:</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{analysis.value.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">데이터 출처:</span>
                <span className="text-slate-800 dark:text-slate-100">{analysis.dataSource}</span>
              </div>
            </div>
          </section>
          
          {/* 신뢰도 정보 */}
          <section>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">신뢰도 정보</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">신뢰도:</span>
                <ConfidenceBadge 
                  reliability={analysis.confidence.reliability}
                  sampleSize={analysis.confidence.sampleSize}
                  dataSource={analysis.confidence.dataSource}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">표본 크기:</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{analysis.confidence.sampleSize}명</span>
              </div>
              {analysis.confidence.confidenceInterval && (
                <div>
                  <span className="text-sm text-slate-600 dark:text-slate-400 block mb-1">95% 신뢰 구간:</span>
                  <ConfidenceInterval
                    value={analysis.value}
                    interval={analysis.confidence.confidenceInterval}
                    confidenceLevel={0.95}
                  />
                </div>
              )}
            </div>
          </section>
          
          {/* 계산 방법 */}
          <section>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">계산 방법</h3>
            <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {analysis.calculationMethod}
            </div>
          </section>
          
          {/* 통계적 검증 */}
          {analysis.statisticalTest && (
            <section>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">통계적 검증</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">검증 방법:</span>
                  <span className="text-slate-800 dark:text-slate-100">{analysis.statisticalTest.type}</span>
                </div>
                {analysis.statisticalTest.pValue !== null && analysis.statisticalTest.pValue !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">p-value:</span>
                    <span className="text-slate-800 dark:text-slate-100">{analysis.statisticalTest.pValue.toFixed(4)}</span>
                  </div>
                )}
                {analysis.statisticalTest.effectSize !== null && analysis.statisticalTest.effectSize !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">효과 크기:</span>
                    <span className="text-slate-800 dark:text-slate-100">{analysis.statisticalTest.effectSize.toFixed(2)}</span>
                  </div>
                )}
                {analysis.statisticalTest.stdDev !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">표준편차:</span>
                    <span className="text-slate-800 dark:text-slate-100">{analysis.statisticalTest.stdDev.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </section>
          )}
          
          {/* 데이터 품질 */}
          {analysis.confidence.dataQuality && (
            <section>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">데이터 품질</h3>
              <DataQualityIndicator quality={analysis.confidence.dataQuality} />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

