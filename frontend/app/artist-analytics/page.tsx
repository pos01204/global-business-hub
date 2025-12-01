'use client'

import { useState } from 'react'
import OverviewTab from './components/OverviewTab'
import PerformanceTab from './components/PerformanceTab'
import ProductsTab from './components/ProductsTab'
import TrendTab from './components/TrendTab'
import HealthTab from './components/HealthTab'
import SelectionTab from './components/SelectionTab'

type TabType = 'overview' | 'performance' | 'products' | 'trend' | 'health' | 'selection'

export default function ArtistAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [dateRange, setDateRange] = useState('30d')
  const [countryFilter, setCountryFilter] = useState('all')

  const tabs = [
    { id: 'overview' as const, label: '개요', icon: '📊' },
    { id: 'performance' as const, label: '작가 성과', icon: '🏆' },
    { id: 'products' as const, label: '작품 분석', icon: '📦' },
    { id: 'trend' as const, label: '성장 추이', icon: '📈' },
    { id: 'selection' as const, label: '셀렉션 관리', icon: '👥' },
    { id: 'health' as const, label: '건강도', icon: '⚠️' },
  ]

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 */}
      <div className="relative bg-gradient-to-r from-violet-600 to-purple-500 rounded-2xl p-6 mb-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <span className="text-3xl">👨‍🎨</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">작가 분석</h1>
            <p className="text-white/80 text-sm">작가 포트폴리오 관리 및 셀렉션 최적화</p>
          </div>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">기간:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
          >
            <option value="7d">7일</option>
            <option value="30d">30일</option>
            <option value="90d">90일</option>
            <option value="365d">365일</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">국가:</span>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
          >
            <option value="all">전체</option>
            <option value="JP">일본</option>
            <option value="US">미국</option>
            <option value="TW">대만</option>
            <option value="HK">홍콩</option>
          </select>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'overview' && <OverviewTab dateRange={dateRange} countryFilter={countryFilter} />}
      {activeTab === 'performance' && <PerformanceTab dateRange={dateRange} countryFilter={countryFilter} />}
      {activeTab === 'products' && <ProductsTab dateRange={dateRange} />}
      {activeTab === 'trend' && <TrendTab />}
      {activeTab === 'selection' && <SelectionTab />}
      {activeTab === 'health' && <HealthTab />}
    </div>
  )
}
