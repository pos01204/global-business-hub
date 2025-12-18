'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PromotionCouponTab from './components/tabs/PromotionCouponTab'
import IndividualIssueTab from './components/tabs/IndividualIssueTab'
import { Tabs, TabPanel } from '@/components/ui'
import { EnhancedLoadingPage } from '@/components/ui'
import { Icon } from '@/components/ui/Icon'
import { Megaphone, User, Ticket, Zap, AlertTriangle } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

type TabType = 'promotion' | 'individual'

const tabItems = [
  {
    id: 'promotion',
    label: '기획전 쿠폰',
    icon: <Icon icon={Megaphone} size="sm" />,
  },
  {
    id: 'individual',
    label: '개별 유저 발급',
    icon: <Icon icon={User} size="sm" />,
  },
]

function CouponGeneratorContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>('promotion')

  // URL 파라미터로 탭 정보 받기
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType
    if (tab === 'individual' || tab === 'promotion') {
      setActiveTab(tab)
    }
  }, [searchParams])

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 - 브랜드 일러스트 포함 */}
      <PageHeader
        title="쿠폰 생성/발급"
        description="마케팅 캠페인용 쿠폰 쿼리를 쉽게 생성하고 발급하세요"
        icon="🎟️"
        variant="tools"
      />

      {/* 탭 선택 - 공통 컴포넌트 사용 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon={Zap} size="md" className="text-slate-600 dark:text-slate-400" />
          <h2 className="text-lg font-semibold">쿠폰 발급 유형</h2>
        </div>
        <Tabs
          items={tabItems}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as TabType)}
          variant="pills"
          size="lg"
          mobileVariant="scroll"
        />
        <p className="mt-2 text-sm text-slate-500">
          {activeTab === 'promotion' 
            ? '유저가 직접 수령하는 공개/비공개 쿠폰을 생성합니다'
            : '특정 유저에게 직접 쿠폰을 발급합니다'
          }
        </p>
      </div>

      {/* 탭 컨텐츠 */}
      <TabPanel id="promotion" activeTab={activeTab}>
        <PromotionCouponTab />
      </TabPanel>
      <TabPanel id="individual" activeTab={activeTab}>
        <IndividualIssueTab />
      </TabPanel>

      {/* 제약사항 안내 */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-3">
          <Icon icon={AlertTriangle} size="lg" className="text-amber-600" />
          <div>
            <h4 className="font-medium text-amber-800 mb-2">쿠폰 적용 범위 안내</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• 기획전 쿠폰은 <strong>기획전(쇼룸)</strong> 또는 <strong>국가</strong> 단위로만 적용 가능합니다.</li>
              <li>• 개별 상품, 카테고리, 아티스트 단위 적용은 불가능합니다.</li>
              <li>• 개별 유저 발급은 기존 생성된 쿠폰 ID를 사용하여 특정 유저에게 발급합니다.</li>
              <li>• 아티스트 프로모션 시 해당 아티스트의 쇼룸 ID를 사용하세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CouponGeneratorPage() {
  return (
    <Suspense fallback={<EnhancedLoadingPage message="쿠폰 생성기 로딩 중..." variant="default" size="lg" />}>
      <CouponGeneratorContent />
    </Suspense>
  )
}
