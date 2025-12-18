'use client'

import { useState } from 'react'
import DashboardTab from './components/DashboardTab'
import SimulatorTab from './components/SimulatorTab'
import RatesTab from './components/RatesTab'
import CountryAnalysisTab from './components/CountryAnalysisTab'
import PolicySimulatorTab from './components/PolicySimulatorTab'
import { Icon } from '@/components/ui/Icon'
import { BarChart3, Calculator, FileText, Globe, Target, DollarSign } from 'lucide-react'

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
      {/* 페이지 헤더 - 재무 분석 (그린/에메랄드 계열, IA 개편안 9.1.2) */}
      <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-700 dark:to-emerald-900 rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden shadow-lg dark:shadow-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 dark:bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg dark:shadow-none">
              <Icon icon={DollarSign} size="xl" className="text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">비용 & 손익</h1>
              <p className="text-emerald-100 dark:text-emerald-200/80 text-xs lg:text-sm font-medium">
                물류 비용 분석 및 손익 시뮬레이션
              </p>
            </div>
          </div>
          
          {/* 빠른 요약 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 dark:border-white/10">
              <p className="text-emerald-100 dark:text-emerald-200/70 text-xs">핵심 시장</p>
              <p className="text-white font-bold text-lg">🇯🇵 🇭🇰 🇸🇬</p>
            </div>
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 dark:border-white/10">
              <p className="text-emerald-100 dark:text-emerald-200/70 text-xs">지원 국가</p>
              <p className="text-white font-bold text-lg">45개국</p>
            </div>
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 dark:border-white/10">
              <p className="text-emerald-100 dark:text-emerald-200/70 text-xs">주요 운송사</p>
              <p className="text-white font-bold text-lg">LGL 제휴</p>
            </div>
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 dark:border-white/10">
              <p className="text-emerald-100 dark:text-emerald-200/70 text-xs">데이터 기준</p>
              <p className="text-white font-bold text-lg">실시간</p>
            </div>
          </div>
        </div>
      </div>

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

