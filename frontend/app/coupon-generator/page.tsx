'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PromotionCouponTab from './components/tabs/PromotionCouponTab'
import IndividualIssueTab from './components/tabs/IndividualIssueTab'
import { Tabs, TabPanel } from '@/components/ui'
import { LoadingOverlay } from '@/components/ui/Spinner'

type TabType = 'promotion' | 'individual'

const tabItems = [
  {
    id: 'promotion',
    label: '기획전 쿠폰',
    icon: <span className="text-lg">📢</span>,
  },
  {
    id: 'individual',
    label: '개별 유저 발급',
    icon: <span className="text-lg">👤</span>,
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
      {/* 페이지 헤더 */}
      <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl lg:text-3xl">🎟️</span>
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">쿠폰 생성/발급 도우미</h1>
            <p className="text-white/80 text-xs lg:text-sm font-medium">마케팅 캠페인용 쿠폰 쿼리를 쉽게 생성하고 발급하세요</p>
          </div>
        </div>
      </div>

      {/* 탭 선택 - 공통 컴포넌트 사용 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚡</span>
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
          <span className="text-xl">⚠️</span>
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
    <Suspense fallback={<LoadingOverlay message="쿠폰 생성기 로딩 중..." />}>
      <CouponGeneratorContent />
    </Suspense>
  )
}
