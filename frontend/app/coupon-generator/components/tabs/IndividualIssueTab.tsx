'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { IndividualIssueSettings, defaultIndividualSettings } from '../../types/individual'
import CouponIdInput from '../individual/CouponIdInput'
import SegmentSelector from '../individual/SegmentSelector'
import UserIdInput from '../individual/UserIdInput'
import BatchOptions from '../individual/BatchOptions'
import IndividualQueryPreview from '../individual/IndividualQueryPreview'
import { parseUserIds, validateUserIds } from '../../utils/userIdParser'

export default function IndividualIssueTab() {
  const searchParams = useSearchParams()
  const [settings, setSettings] = useState<IndividualIssueSettings>(defaultIndividualSettings)
  const [copied, setCopied] = useState(false)

  // URL 파라미터에서 세그먼트 정보 받기
  useEffect(() => {
    const segment = searchParams.get('segment')
    const userIds = searchParams.get('userIds')
    
    if (segment && userIds) {
      const parsedUserIds = parseUserIds(userIds)
      setSettings(prev => ({
        ...prev,
        segment: {
          type: 'rfm',
          rfmSegment: segment,
          userIds: parsedUserIds,
          userCount: parsedUserIds.length,
          description: `${segment} 세그먼트에서 전달받음`,
        },
      }))
    }
  }, [searchParams])

  // 전체 유저 ID 계산
  const getAllUserIds = (): number[] => {
    const segmentUserIds = settings.segment?.userIds || []
    const manualUserIds = parseUserIds(settings.manualUserIds)
    
    if (settings.segment && segmentUserIds.length > 0) {
      return segmentUserIds
    }
    return manualUserIds
  }

  const allUserIds = getAllUserIds()
  const validation = validateUserIds(allUserIds)

  const handleCopyQuery = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 설정 패널 */}
        <div className="space-y-6">
          <CouponIdInput settings={settings} onSettingsChange={setSettings} />
          <SegmentSelector settings={settings} onSettingsChange={setSettings} />
          <UserIdInput settings={settings} onSettingsChange={setSettings} />
          <BatchOptions settings={settings} onSettingsChange={setSettings} userCount={allUserIds.length} />
        </div>

        {/* 쿼리 미리보기 */}
        <div>
          <IndividualQueryPreview 
            settings={settings}
            userIds={allUserIds}
            validation={validation}
            onCopy={handleCopyQuery}
            copied={copied}
          />
        </div>
      </div>
    </div>
  )
}
