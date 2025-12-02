'use client'

import { useState, useEffect } from 'react'
import { IndividualIssueSettings, RFMSegment, ChurnRiskData } from '../../types/individual'
import { customerAnalyticsApi } from '@/lib/api'

interface SegmentSelectorProps {
  settings: IndividualIssueSettings
  onSettingsChange: (settings: IndividualIssueSettings) => void
}

export default function SegmentSelector({ settings, onSettingsChange }: SegmentSelectorProps) {
  const [rfmData, setRfmData] = useState<RFMSegment[]>([])
  const [churnData, setChurnData] = useState<ChurnRiskData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRFMData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await customerAnalyticsApi.getRFM()
      if (response.success) {
        setRfmData(response.segments)
      }
    } catch (err) {
      setError('RFM 데이터 로드 실패')
      console.error('RFM load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadChurnData = async () => {
    try {
      const response = await customerAnalyticsApi.getChurnRisk()
      if (response.success) {
        setChurnData({
          highRisk: response.highRisk,
          mediumRisk: response.mediumRisk,
          lowRisk: response.lowRisk,
        })
      }
    } catch (err) {
      console.error('Churn risk load error:', err)
    }
  }

  useEffect(() => {
    loadRFMData()
    loadChurnData()
  }, [])

  const selectRFMSegment = (segment: RFMSegment) => {
    const userIds = segment.customers.map(c => parseInt(c.userId, 10))
    onSettingsChange({
      ...settings,
      segment: {
        type: 'rfm',
        rfmSegment: segment.segment,
        userIds,
        userCount: userIds.length,
        description: `${segment.label} (${segment.description})`,
      },
      manualUserIds: '',
    })
  }

  const selectChurnLevel = (level: 'high' | 'medium' | 'low') => {
    if (!churnData) return
    
    const customers = churnData[`${level}Risk` as keyof ChurnRiskData]
    const userIds = customers.map(c => parseInt(c.userId, 10))
    
    const levelLabels = { high: '높은 위험', medium: '중간 위험', low: '낮은 위험' }
    
    onSettingsChange({
      ...settings,
      segment: {
        type: 'churn',
        churnLevel: level,
        userIds,
        userCount: userIds.length,
        description: `이탈 위험 ${levelLabels[level]} 고객`,
      },
      manualUserIds: '',
    })
  }

  const clearSegment = () => {
    onSettingsChange({ ...settings, segment: null })
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">👥</span>
          <h3 className="font-semibold">대상 유저 선택</h3>
        </div>
        <a href="/customer-analytics" target="_blank" className="text-sm text-primary hover:underline">
          고객 분석 탭에서 자세히 보기 →
        </a>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {settings.segment && (
        <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-primary">선택된 세그먼트</div>
              <div className="text-sm text-gray-600">{settings.segment.description}</div>
              <div className="text-sm font-medium">대상 유저: {settings.segment.userCount.toLocaleString()}명</div>
            </div>
            <button
              onClick={clearSegment}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              선택 해제
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          고객 분석 데이터를 불러오는 중...
        </div>
      ) : (
        <div className="space-y-6">
          {/* RFM 세그먼트 */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <span>📊</span> RFM 세그먼트
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {rfmData.map(segment => (
                <button
                  key={segment.segment}
                  onClick={() => selectRFMSegment(segment)}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    settings.segment?.rfmSegment === segment.segment
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-sm" style={{ color: segment.color }}>
                    {segment.label}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">{segment.count}명</div>
                  <div className="text-xs text-gray-400 line-clamp-2">{segment.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 이탈 위험 */}
          {churnData && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span>⚠️</span> 이탈 위험 분석
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => selectChurnLevel('high')}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    settings.segment?.churnLevel === 'high'
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <div className="font-medium text-sm text-red-600">🔴 높은 위험</div>
                  <div className="text-xs text-gray-500">{churnData.highRisk.length}명</div>
                </button>
                <button
                  onClick={() => selectChurnLevel('medium')}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    settings.segment?.churnLevel === 'medium'
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                  }`}
                >
                  <div className="font-medium text-sm text-yellow-600">🟡 중간 위험</div>
                  <div className="text-xs text-gray-500">{churnData.mediumRisk.length}명</div>
                </button>
                <button
                  onClick={() => selectChurnLevel('low')}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    settings.segment?.churnLevel === 'low'
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="font-medium text-sm text-green-600">🟢 낮은 위험</div>
                  <div className="text-xs text-gray-500">{churnData.lowRisk.length}명</div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
