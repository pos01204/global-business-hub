'use client'

import { useState } from 'react'
import OverviewTab from './components/OverviewTab'
import PerformanceTab from './components/PerformanceTab'
import ProductsTab from './components/ProductsTab'
import TrendTab from './components/TrendTab'
import HealthTab from './components/HealthTab'
import SelectionTab from './components/SelectionTab'
import { Tabs, TabPanel, Select } from '@/components/ui'

type TabType = 'overview' | 'performance' | 'products' | 'trend' | 'health' | 'selection'

const tabItems = [
  { id: 'overview', label: '개요', icon: <span>📊</span> },
  { id: 'performance', label: '작가 성과', icon: <span>🏆</span> },
  { id: 'products', label: '작품 분석', icon: <span>📦</span> },
  { id: 'trend', label: '성장 추이', icon: <span>📈</span> },
  { id: 'selection', label: '셀렉션 관리', icon: <span>👥</span> },
  { id: 'health', label: '건강도', icon: <span>⚠️</span> },
]

const dateRangeOptions = [
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
  { value: '90d', label: '90일' },
  { value: '365d', label: '365일' },
]

const countryOptions = [
  { value: 'all', label: '전체' },
  { value: 'JP', label: '🇯🇵 일본' },
  { value: 'US', label: '🇺🇸 미국' },
  { value: 'TW', label: '🇹🇼 대만' },
  { value: 'HK', label: '🇭🇰 홍콩' },
]

export default function ArtistAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [dateRange, setDateRange] = useState('30d')
  const [countryFilter, setCountryFilter] = useState('all')

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 */}
      <div className="relative bg-gradient-to-r from-violet-600 to-purple-500 dark:from-violet-900/70 dark:to-purple-900/70 rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 dark:bg-white/[0.02] rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 dark:bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
            <span className="text-2xl lg:text-3xl">👨‍🎨</span>
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">작가 분석</h1>
            <p className="text-white/80 dark:text-white/70 text-xs lg:text-sm">작가 포트폴리오 관리 및 셀렉션 최적화</p>
          </div>
        </div>
      </div>

      {/* 필터 바 - 공통 Select 컴포넌트 사용 */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="w-32">
          <Select
            options={dateRangeOptions}
            value={dateRange}
            onChange={setDateRange}
            size="sm"
            fullWidth={false}
          />
        </div>
        <div className="w-36">
          <Select
            options={countryOptions}
            value={countryFilter}
            onChange={setCountryFilter}
            size="sm"
            fullWidth={false}
          />
        </div>
      </div>

      {/* 탭 네비게이션 - 공통 Tabs 컴포넌트 사용 */}
      <div className="mb-6">
        <Tabs
          items={tabItems}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as TabType)}
          variant="pills"
          size="md"
          mobileVariant="scroll"
        />
      </div>

      {/* 탭 컨텐츠 */}
      <TabPanel id="overview" activeTab={activeTab}>
        <OverviewTab dateRange={dateRange} countryFilter={countryFilter} />
      </TabPanel>
      <TabPanel id="performance" activeTab={activeTab}>
        <PerformanceTab dateRange={dateRange} countryFilter={countryFilter} />
      </TabPanel>
      <TabPanel id="products" activeTab={activeTab}>
        <ProductsTab dateRange={dateRange} />
      </TabPanel>
      <TabPanel id="trend" activeTab={activeTab}>
        <TrendTab />
      </TabPanel>
      <TabPanel id="selection" activeTab={activeTab}>
        <SelectionTab />
      </TabPanel>
      <TabPanel id="health" activeTab={activeTab}>
        <HealthTab />
      </TabPanel>
    </div>
  )
}
