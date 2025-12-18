'use client'

import { useState } from 'react'
import OverviewTab from './components/OverviewTab'
import PerformanceTab from './components/PerformanceTab'
import ProductsTab from './components/ProductsTab'
import TrendTab from './components/TrendTab'
import HealthTab from './components/HealthTab'
import SelectionTab from './components/SelectionTab'
import { Tabs, TabPanel, Select } from '@/components/ui'
import { Icon } from '@/components/ui/Icon'
import { BarChart3, Award, Package, TrendingUp, Users, AlertTriangle, Palette } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

type TabType = 'overview' | 'performance' | 'products' | 'trend' | 'health' | 'selection'

const tabItems = [
  { id: 'overview', label: '개요', icon: <Icon icon={BarChart3} size="sm" /> },
  { id: 'performance', label: '작가 성과', icon: <Icon icon={Award} size="sm" /> },
  { id: 'products', label: '작품 분석', icon: <Icon icon={Package} size="sm" /> },
  { id: 'trend', label: '성장 추이', icon: <Icon icon={TrendingUp} size="sm" /> },
  { id: 'selection', label: '셀렉션 관리', icon: <Icon icon={Users} size="sm" /> },
  { id: 'health', label: '건강도', icon: <Icon icon={AlertTriangle} size="sm" /> },
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
      {/* 페이지 헤더 - 브랜드 일러스트 포함 */}
      <PageHeader
        title="작가 분석"
        description="작가 포트폴리오 관리 및 셀렉션 최적화"
        icon="🎨"
        variant="artist"
      />

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
