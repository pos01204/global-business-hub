'use client'

import { useState } from 'react'
import MarketingCalendarTab from './components/MarketingCalendarTab'
import ContentGeneratorTab from './components/ContentGeneratorTab'
import { Icon } from '@/components/ui/Icon'
import { Target } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

// 탭 타입 정의
type MarketerTab = 'calendar' | 'content'

export default function MarketerPage() {
  const [activeTab, setActiveTab] = useState<MarketerTab>('calendar')

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 - 브랜드 일러스트 포함 */}
      <PageHeader
        title="퍼포먼스 마케터"
        description="글로벌 마케팅 캘린더 & AI 콘텐츠 생성 도구"
        icon="🎯"
        variant="tools"
      />

      {/* 탭 네비게이션 */}
      <div className="border-b mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📑</span>
          <h2 className="text-lg font-semibold">마케팅 도구</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'calendar'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>🗓️</span>
            <span>마케팅 캘린더</span>
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'content'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>✍️</span>
            <span>콘텐츠 생성</span>
          </button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div>
        {activeTab === 'calendar' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">🗓️ 글로벌 마케팅 캘린더</h2>
              <p className="text-gray-600">
                35개국 주요 기념일과 시즌을 확인하고, AI 기반 마케팅 전략을 수립하세요.
              </p>
            </div>
            <MarketingCalendarTab />
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">✍️ AI 콘텐츠 생성</h2>
              <p className="text-gray-600">
                AI를 활용하여 마케팅 콘텐츠를 자동으로 생성하세요.
              </p>
            </div>
            <ContentGeneratorTab />
          </div>
        )}
      </div>
    </div>
  )
}
