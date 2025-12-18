'use client'

import { useState } from 'react'
import MarketingCalendarTab from './components/MarketingCalendarTab'
import ContentGeneratorTab from './components/ContentGeneratorTab'
import { Icon } from '@/components/ui/Icon'
import { Target } from 'lucide-react'

// 탭 타입 정의
type MarketerTab = 'calendar' | 'content'

export default function MarketerPage() {
  const [activeTab, setActiveTab] = useState<MarketerTab>('calendar')

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 - 도구 (뉴트럴 화이트/그레이 + idus 포인트, IA 개편안 9.1.2) */}
      <div className="relative bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden shadow-lg dark:shadow-none border border-slate-200 dark:border-slate-700">
        <div className="absolute top-0 right-0 w-64 h-64 bg-idus-500/10 dark:bg-idus-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-200/50 dark:bg-slate-700/30 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-idus-500 rounded-xl flex items-center justify-center shadow-lg dark:shadow-none">
            <Icon icon={Target} size="xl" className="text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">퍼포먼스 마케터</h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs lg:text-sm font-medium">글로벌 마케팅 캘린더 & AI 콘텐츠 생성 도구</p>
          </div>
        </div>
      </div>

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
