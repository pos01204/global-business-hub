'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PromotionCouponTab from './components/tabs/PromotionCouponTab'
import IndividualIssueTab from './components/tabs/IndividualIssueTab'

type TabType = 'promotion' | 'individual'

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
      <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 mb-6 overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">🎟️</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">쿠폰 쿼리 생성기</h1>
            <p className="text-white/80 text-sm font-medium">마케팅 캠페인용 쿠폰 발급 쿼리를 쉽게 생성하세요</p>
          </div>
        </div>
      </div>

      {/* 탭 선택 */}
      <div className="border-b mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚡</span>
          <h2 className="text-lg font-semibold">쿠폰 발급 유형</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('promotion')}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-3 ${
              activeTab === 'promotion'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-xl">📢</span>
            <div className="text-left">
              <div>기획전 쿠폰</div>
              <div className="text-xs opacity-80">유저가 직접 수령하는 공개/비공개 쿠폰</div>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-3 ${
              activeTab === 'individual'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-xl">👤</span>
            <div className="text-left">
              <div>개별 유저 발급</div>
              <div className="text-xs opacity-80">특정 유저에게 직접 쿠폰을 발급</div>
            </div>
          </button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'promotion' ? (
        <PromotionCouponTab />
      ) : (
        <IndividualIssueTab />
      )}

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
    <Suspense fallback={<div className="animate-pulse p-8 text-center">로딩 중...</div>}>
      <CouponGeneratorContent />
    </Suspense>
  )
}
