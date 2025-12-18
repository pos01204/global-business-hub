'use client'

import { useState } from 'react'
import DashboardTab from './components/DashboardTab'
import SimulatorTab from './components/SimulatorTab'
import RatesTab from './components/RatesTab'
import CountryAnalysisTab from './components/CountryAnalysisTab'
import PolicySimulatorTab from './components/PolicySimulatorTab'
import { Icon } from '@/components/ui/Icon'
import { BarChart3, Calculator, FileText, Globe, Target, DollarSign } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

type CostAnalysisTab = 'dashboard' | 'simulator' | 'rates' | 'country' | 'policy'

export default function CostAnalysisPage() {
  const [activeTab, setActiveTab] = useState<CostAnalysisTab>('dashboard')

  const tabs = [
    { id: 'dashboard' as const, label: '손익 대시보드', icon: BarChart3, description: '전체 손익 현황' },
    { id: 'simulator' as const, label: '손익 시뮬레이터', icon: Calculator, description: '주문별 시뮬레이션' },
    { id: 'rates' as const, label: '운임 요금표', icon: FileText, description: '운송사별 요금 조회' },
    { id: 'country' as const, label: '국가별 분석', icon: Globe, description: '국가별 상세 분석' },
    { id: 'policy' as const, label: '정책 시뮬레이터', icon: Target, description: '배송 정책 영향 분석' },
  ]

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 - 브랜드 일러스트 포함 */}
      <PageHeader
        title="비용 & 손익"
        description="물류 비용 분석 및 손익 시뮬레이션"
        icon="💰"
        pageId="cost-analysis"
        variant="cost"
      >
        {/* 빠른 요약 카드 */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 dark:border-white/10">
            <p className="text-white/70 text-xs">핵심 시장</p>
            <p className="text-white font-bold">🇯🇵 🇭🇰 🇸🇬</p>
          </div>
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 dark:border-white/10">
            <p className="text-white/70 text-xs">지원 국가</p>
            <p className="text-white font-bold">45개국</p>
          </div>
        </div>
      </PageHeader>

      {/* 탭 네비게이션 - 모던 카드 스타일 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon={FileText} size="md" className="text-slate-600 dark:text-slate-400" />
          <h2 className="text-lg font-semibold text-gray-800">분석 도구</h2>
        </div>
        
        <div className="grid grid-cols-5 gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative p-4 rounded-xl text-left transition-all duration-300
                ${activeTab === tab.id
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 scale-[1.02]'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-emerald-300 hover:shadow-md'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Icon 
                  icon={tab.icon} 
                  size="lg" 
                  className={activeTab === tab.id ? 'text-white' : 'text-slate-600 dark:text-slate-400'} 
                />
                <div>
                  <p className={`font-semibold ${activeTab === tab.id ? 'text-white' : 'text-gray-800'}`}>
                    {tab.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${activeTab === tab.id ? 'text-emerald-100' : 'text-gray-500'}`}>
                    {tab.description}
                  </p>
                </div>
              </div>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/50 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'simulator' && <SimulatorTab />}
        {activeTab === 'rates' && <RatesTab />}
        {activeTab === 'country' && <CountryAnalysisTab />}
        {activeTab === 'policy' && <PolicySimulatorTab />}
      </div>
    </div>
  )
}

