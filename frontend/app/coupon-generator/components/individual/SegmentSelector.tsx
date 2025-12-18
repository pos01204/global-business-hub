'use client'

import { useState, useEffect } from 'react'
import { IndividualIssueSettings, RFMSegment, ChurnRiskData } from '../../types/individual'
import { customerAnalyticsApi } from '@/lib/api'

// 확장된 RFM 세그먼트 타입 (전체 유저 ID 포함)
interface ExtendedRFMSegment extends RFMSegment {
  allUserIds?: string[]
}

// 확장된 이탈 위험 데이터 타입 (전체 유저 ID 포함)
interface ExtendedChurnRiskData extends ChurnRiskData {
  allUserIds?: {
    highRisk: string[]
    mediumRisk: string[]
    lowRisk: string[]
  }
}

interface SegmentSelectorProps {
  settings: IndividualIssueSettings
  onSettingsChange: (settings: IndividualIssueSettings) => void
}

export default function SegmentSelector({ settings, onSettingsChange }: SegmentSelectorProps) {
  const [rfmData, setRfmData] = useState<ExtendedRFMSegment[]>([])
  const [churnData, setChurnData] = useState<ExtendedChurnRiskData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingSegment, setLoadingSegment] = useState<string | null>(null)
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
          allUserIds: response.allUserIds,
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

  // RFM 세그먼트 선택 시 전체 유저 ID 로드
  const selectRFMSegment = async (segment: ExtendedRFMSegment) => {
    try {
      setLoadingSegment(segment.segment)
      
      // 전체 유저 ID가 이미 있으면 사용, 없으면 API 호출
      let allUserIds: string[] = segment.allUserIds || []
      
      if (allUserIds.length === 0 || allUserIds.length < segment.count) {
        // 전체 유저 ID 로드 (경량 API)
        const response = await customerAnalyticsApi.getSegmentUsers(segment.segment, 'rfm')
        if (response.success) {
          allUserIds = response.userIds
        }
      }
      
      const userIds = allUserIds.map((id: string) => parseInt(id, 10)).filter((id: number) => !isNaN(id))
      
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
    } catch (err) {
      console.error('Failed to load segment users:', err)
      setError('세그먼트 유저 로드 실패')
    } finally {
      setLoadingSegment(null)
    }
  }

  // 이탈 위험 레벨 선택 시 전체 유저 ID 로드
  const selectChurnLevel = async (level: 'high' | 'medium' | 'low') => {
    if (!churnData) return
    
    try {
      const levelKey = `${level}Risk` as 'highRisk' | 'mediumRisk' | 'lowRisk'
      setLoadingSegment(levelKey)
      
      // 전체 유저 ID가 이미 있으면 사용
      let allUserIds: string[] = churnData.allUserIds?.[levelKey] || []
      
      if (allUserIds.length === 0) {
        // 전체 유저 ID 로드 (경량 API)
        const response = await customerAnalyticsApi.getSegmentUsers(levelKey, 'churn')
        if (response.success) {
          allUserIds = response.userIds
        }
      }
      
      const userIds = allUserIds.map((id: string) => parseInt(id, 10)).filter((id: number) => !isNaN(id))
      
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
    } catch (err) {
      console.error('Failed to load churn users:', err)
      setError('이탈 위험 유저 로드 실패')
    } finally {
      setLoadingSegment(null)
    }
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
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => { loadRFMData(); loadChurnData(); }}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700 transition-colors"
          >
            다시 시도
          </button>
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
            {rfmData.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
                RFM 세그먼트 데이터가 없습니다. 고객 분석 탭에서 데이터를 확인해주세요.
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-2">
              {rfmData.map(segment => (
                <button
                  key={segment.segment}
                  onClick={() => selectRFMSegment(segment)}
                  disabled={loadingSegment === segment.segment}
                  className={`p-3 rounded-lg text-left transition-all border relative ${
                    settings.segment?.rfmSegment === segment.segment
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                  } ${loadingSegment === segment.segment ? 'opacity-70' : ''}`}
                >
                  {loadingSegment === segment.segment && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                      <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  <div className="font-medium text-sm" style={{ color: segment.color }}>
                    {segment.label}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    <span className="font-semibold">{segment.count.toLocaleString()}</span>명
                    {segment.count > 50 && (
                      <span className="ml-1 text-primary">(전체 로드)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 line-clamp-2">{segment.description}</div>
                </button>
              ))}
            </div>
            )}
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
                  disabled={loadingSegment === 'highRisk'}
                  className={`p-3 rounded-lg text-left transition-all border relative ${
                    settings.segment?.churnLevel === 'high'
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                  } ${loadingSegment === 'highRisk' ? 'opacity-70' : ''}`}
                >
                  {loadingSegment === 'highRisk' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                      <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  <div className="font-medium text-sm text-red-600">🔴 높은 위험</div>
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold">{(churnData.allUserIds?.highRisk?.length || churnData.highRisk.length).toLocaleString()}</span>명
                  </div>
                </button>
                <button
                  onClick={() => selectChurnLevel('medium')}
                  disabled={loadingSegment === 'mediumRisk'}
                  className={`p-3 rounded-lg text-left transition-all border relative ${
                    settings.segment?.churnLevel === 'medium'
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                  } ${loadingSegment === 'mediumRisk' ? 'opacity-70' : ''}`}
                >
                  {loadingSegment === 'mediumRisk' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                      <div className="animate-spin w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  <div className="font-medium text-sm text-yellow-600">🟡 중간 위험</div>
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold">{(churnData.allUserIds?.mediumRisk?.length || churnData.mediumRisk.length).toLocaleString()}</span>명
                  </div>
                </button>
                <button
                  onClick={() => selectChurnLevel('low')}
                  disabled={loadingSegment === 'lowRisk'}
                  className={`p-3 rounded-lg text-left transition-all border relative ${
                    settings.segment?.churnLevel === 'low'
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  } ${loadingSegment === 'lowRisk' ? 'opacity-70' : ''}`}
                >
                  {loadingSegment === 'lowRisk' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                      <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  <div className="font-medium text-sm text-green-600">🟢 낮은 위험</div>
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold">{(churnData.allUserIds?.lowRisk?.length || churnData.lowRisk.length).toLocaleString()}</span>명
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
