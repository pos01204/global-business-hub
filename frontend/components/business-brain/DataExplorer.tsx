'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { 
  Search, Users, Palette, Package, Globe, 
  ChevronRight, ChevronDown, ArrowLeft, Filter,
  Download, X, TrendingUp, TrendingDown, BarChart3, RefreshCw
} from 'lucide-react'
import { EChartsPieChart, EChartsTrendChart, EChartsBarChart } from './charts'
import { businessBrainApi, analyticsApi } from '@/lib/api'

// 탐색 차원 타입
type ExploreDimension = 'customer' | 'artist' | 'product' | 'country'

// 필터 타입
interface ExploreFilter {
  dimension: string
  value: string
  label: string
}

// 탐색 결과 타입
interface ExploreResult {
  count: number
  totalRevenue: number
  avgOrderValue: number
  characteristics: { label: string; value: string }[]
  distribution: { name: string; value: number; color?: string }[]
  trend: { date: string; value: number }[]
}

// 세그먼트 옵션 타입
interface SegmentOption {
  value: string
  label: string
  count: number
}

// 차원 설정
const dimensionConfig = {
  customer: { 
    icon: Users, 
    label: '고객', 
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30'
  },
  artist: { 
    icon: Palette, 
    label: '작가', 
    color: 'text-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-900/30'
  },
  product: { 
    icon: Package, 
    label: '상품', 
    color: 'text-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30'
  },
  country: { 
    icon: Globe, 
    label: '국가', 
    color: 'text-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/30'
  }
}

// 기본 세그먼트 옵션 (API 데이터가 없을 때 사용)
const defaultSegmentOptions: Record<ExploreDimension, SegmentOption[]> = {
  customer: [
    { value: 'vip', label: 'VIP', count: 0 },
    { value: 'loyal', label: 'Loyal', count: 0 },
    { value: 'regular', label: 'Regular', count: 0 },
    { value: 'new', label: 'New', count: 0 },
    { value: 'at-risk', label: 'At Risk', count: 0 }
  ],
  artist: [
    { value: 'top', label: '상위 작가', count: 0 },
    { value: 'active', label: '활동 작가', count: 0 },
    { value: 'new', label: '신규 작가', count: 0 },
    { value: 'inactive', label: '비활동 작가', count: 0 }
  ],
  product: [],
  country: []
}

// 포맷팅 함수
function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${value.toLocaleString()}`
}

// 차원 선택 카드
function DimensionCard({
  dimension,
  count,
  onClick,
  isSelected
}: {
  dimension: ExploreDimension
  count: number
  onClick: () => void
  isSelected: boolean
}) {
  const config = dimensionConfig[dimension]
  
  return (
    <div
      onClick={onClick}
      className={`
        p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-idus-500 bg-idus-50 dark:bg-idus-900/20 shadow-lg' 
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
        }
      `}
    >
      <div className={`w-14 h-14 rounded-xl ${config.bg} flex items-center justify-center mb-4`}>
        <Icon icon={config.icon} size="xl" className={config.color} />
      </div>
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
        {config.label}
      </h3>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        {count.toLocaleString()}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        탐색 가능
      </p>
    </div>
  )
}

// 필터 칩
function FilterChip({
  filter,
  onRemove
}: {
  filter: ExploreFilter
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-idus-100 dark:bg-idus-900/30 text-idus-700 dark:text-idus-300 rounded-full text-sm">
      <span>{filter.label}</span>
      <button 
        onClick={onRemove}
        className="hover:bg-idus-200 dark:hover:bg-idus-800 rounded-full p-0.5"
      >
        <Icon icon={X} size="xs" />
      </button>
    </div>
  )
}

// 세그먼트 선택 리스트
function SegmentList({
  dimension,
  onSelect,
  selectedValue,
  options,
  isLoading
}: {
  dimension: ExploreDimension
  onSelect: (value: string, label: string) => void
  selectedValue?: string
  options: SegmentOption[]
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" />
      </div>
    )
  }

  if (options.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        <Icon icon={BarChart3} size="xl" className="mx-auto mb-3 opacity-50" />
        <p>해당 차원의 데이터가 없습니다.</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <div
          key={option.value}
          onClick={() => onSelect(option.value, option.label)}
          className={`
            flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all
            ${selectedValue === option.value
              ? 'bg-idus-100 dark:bg-idus-900/30 border-2 border-idus-500'
              : 'bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <Icon 
              icon={selectedValue === option.value ? ChevronDown : ChevronRight} 
              size="sm" 
              className="text-slate-400" 
            />
            <span className="font-medium text-slate-800 dark:text-slate-100">
              {option.label}
            </span>
          </div>
          <Badge className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {option.count.toLocaleString()}
          </Badge>
        </div>
      ))}
    </div>
  )
}

// 결과 패널
function ResultPanel({
  result,
  filters
}: {
  result: ExploreResult
  filters: ExploreFilter[]
}) {
  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
          <p className="text-xs text-slate-500 mb-1">선택된 항목</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {result.count.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
          <p className="text-xs text-slate-500 mb-1">총 매출</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {formatCurrency(result.totalRevenue)}
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
          <p className="text-xs text-slate-500 mb-1">평균 주문</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {formatCurrency(result.avgOrderValue)}
          </p>
        </div>
      </div>

      {/* 특성 */}
      <Card className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
          이 그룹의 특성
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {result.characteristics.map((char, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-600 dark:text-slate-400">{char.label}</span>
              <span className="font-medium text-slate-800 dark:text-slate-100">{char.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 분포 차트 */}
      {result.distribution.length > 0 && (
        <Card className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
            분포
          </h4>
          <div className="h-48">
            <EChartsPieChart
              data={result.distribution}
              height={180}
              showLegend={true}
            />
          </div>
        </Card>
      )}

      {/* 트렌드 차트 */}
      {result.trend.length > 0 && (
        <Card className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
            시간대별 추이
          </h4>
          <div className="h-48">
            <EChartsTrendChart
              series={[{
                name: '매출',
                data: result.trend,
                type: 'area',
                color: '#FF6B35'
              }]}
              height={180}
              showLegend={false}
              valueFormatter={(v) => formatCurrency(v)}
            />
          </div>
        </Card>
      )}

      {/* 액션 버튼 */}
      <div className="flex items-center gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-idus-500 text-white rounded-xl hover:bg-idus-600 transition-colors font-medium">
          이 그룹에 캠페인 실행
        </button>
        <button className="px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
          <Icon icon={Download} size="md" />
        </button>
      </div>
    </div>
  )
}

// 메인 데이터 탐색기 컴포넌트
interface DataExplorerProps {
  customerCount?: number
  artistCount?: number
  productCount?: number
  countryCount?: number
  onExplore?: (dimension: ExploreDimension, filters: ExploreFilter[]) => Promise<ExploreResult>
  period?: string
}

export function DataExplorer({
  customerCount,
  artistCount,
  productCount,
  countryCount,
  onExplore,
  period = '30d'
}: DataExplorerProps) {
  const [selectedDimension, setSelectedDimension] = useState<ExploreDimension | null>(null)
  const [filters, setFilters] = useState<ExploreFilter[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isExploring, setIsExploring] = useState(false)
  const [result, setResult] = useState<ExploreResult | null>(null)

  // API에서 고객 세그먼트 데이터 조회
  const { data: rfmData, isLoading: rfmLoading } = useQuery({
    queryKey: ['business-brain', 'rfm', period],
    queryFn: () => businessBrainApi.getRFMAnalysis(period),
    staleTime: 10 * 60 * 1000,
    enabled: selectedDimension === 'customer'
  })

  // API에서 작가 데이터 조회
  const { data: paretoData, isLoading: paretoLoading } = useQuery({
    queryKey: ['business-brain', 'pareto', period],
    queryFn: () => businessBrainApi.getParetoAnalysis(period),
    staleTime: 10 * 60 * 1000,
    enabled: selectedDimension === 'artist'
  })

  // API에서 국가별 데이터 조회
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', 'regional', period],
    queryFn: () => analyticsApi.getData(period, 'all'),
    staleTime: 10 * 60 * 1000,
    enabled: selectedDimension === 'country'
  })

  // 세그먼트 옵션 생성 - API 데이터 기반
  const segmentOptions = useMemo<Record<ExploreDimension, SegmentOption[]>>(() => {
    const options: Record<ExploreDimension, SegmentOption[]> = {
      customer: [],
      artist: [],
      product: [],
      country: []
    }

    // 고객 세그먼트 (RFM 기반)
    if (rfmData?.data?.segments) {
      const segments = rfmData.data.segments
      options.customer = [
        { value: 'champions', label: 'Champions (VIP)', count: segments.champions?.length || 0 },
        { value: 'loyal', label: 'Loyal Customers', count: segments.loyal?.length || 0 },
        { value: 'potential', label: 'Potential Loyalists', count: segments.potential?.length || 0 },
        { value: 'recent', label: 'Recent Customers', count: segments.recent?.length || 0 },
        { value: 'at_risk', label: 'At Risk', count: segments.at_risk?.length || 0 },
        { value: 'hibernating', label: 'Hibernating', count: segments.hibernating?.length || 0 },
        { value: 'lost', label: 'Lost', count: segments.lost?.length || 0 },
      ].filter(s => s.count > 0)
    }

    // 작가 세그먼트 (Pareto 기반)
    if (paretoData?.data?.artistConcentration?.topArtists) {
      const topArtists = paretoData.data.artistConcentration.topArtists
      options.artist = [
        { value: 'top10', label: '상위 10% 작가', count: Math.ceil(topArtists.length * 0.1) },
        { value: 'top20', label: '상위 20% 작가', count: Math.ceil(topArtists.length * 0.2) },
        { value: 'mid', label: '중위권 작가', count: Math.ceil(topArtists.length * 0.5) },
        { value: 'all', label: '전체 작가', count: topArtists.length },
      ]
    }

    // 국가별 세그먼트
    if (analyticsData?.regionalPerformance) {
      options.country = analyticsData.regionalPerformance.map((region: any) => ({
        value: region.country?.toLowerCase() || region.region?.toLowerCase() || 'unknown',
        label: region.country || region.region || '알 수 없음',
        count: region.orders || region.orderCount || 0
      }))
    }

    return options
  }, [rfmData, paretoData, analyticsData])

  // 카운트 계산
  const counts = useMemo(() => ({
    customer: customerCount ?? (rfmData?.data?.totalCustomers || segmentOptions.customer.reduce((sum, s) => sum + s.count, 0)),
    artist: artistCount ?? (paretoData?.data?.artistConcentration?.topArtists?.length || segmentOptions.artist.reduce((sum, s) => sum + s.count, 0)),
    product: productCount ?? 0,
    country: countryCount ?? segmentOptions.country.length
  }), [customerCount, artistCount, productCount, countryCount, rfmData, paretoData, segmentOptions])

  // 현재 차원의 로딩 상태
  const isLoadingSegments = useMemo(() => {
    if (selectedDimension === 'customer') return rfmLoading
    if (selectedDimension === 'artist') return paretoLoading
    if (selectedDimension === 'country') return analyticsLoading
    return false
  }, [selectedDimension, rfmLoading, paretoLoading, analyticsLoading])

  // 차원 선택 핸들러
  const handleDimensionSelect = useCallback((dimension: ExploreDimension) => {
    setSelectedDimension(dimension)
    setFilters([])
    setResult(null)
  }, [])

  // 필터 추가 핸들러
  const handleAddFilter = useCallback(async (value: string, label: string) => {
    if (!selectedDimension) return
    
    const newFilter: ExploreFilter = {
      dimension: selectedDimension,
      value,
      label
    }
    
    const newFilters = [...filters, newFilter]
    setFilters(newFilters)
    
    // 탐색 실행
    setIsExploring(true)
    
    // 실제 API 호출 또는 더미 데이터
    if (onExplore) {
      const result = await onExplore(selectedDimension, newFilters)
      setResult(result)
    } else {
      // 더미 데이터
      setTimeout(() => {
        setResult({
          count: Math.floor(Math.random() * 500) + 50,
          totalRevenue: Math.floor(Math.random() * 100000) + 10000,
          avgOrderValue: Math.floor(Math.random() * 200) + 50,
          characteristics: [
            { label: '평균 구매 빈도', value: '3.2회/월' },
            { label: '주요 카테고리', value: '주얼리 (45%)' },
            { label: '평균 체류 시간', value: '8.5분' },
            { label: '재구매율', value: '68%' }
          ],
          distribution: [
            { name: '주얼리', value: 45, color: '#8B5CF6' },
            { name: '홈데코', value: 25, color: '#3B82F6' },
            { name: '패션', value: 20, color: '#10B981' },
            { name: '기타', value: 10, color: '#F59E0B' }
          ],
          trend: Array.from({ length: 14 }, (_, i) => ({
            date: `1/${i + 1}`,
            value: Math.floor(Math.random() * 5000) + 1000
          }))
        })
        setIsExploring(false)
      }, 500)
    }
  }, [selectedDimension, filters, onExplore])

  // 필터 제거 핸들러
  const handleRemoveFilter = useCallback((index: number) => {
    const newFilters = filters.filter((_, i) => i !== index)
    setFilters(newFilters)
    if (newFilters.length === 0) {
      setResult(null)
    }
  }, [filters])

  // 뒤로가기 핸들러
  const handleBack = useCallback(() => {
    setSelectedDimension(null)
    setFilters([])
    setResult(null)
  }, [])

  // 브레드크럼 생성
  const breadcrumb = useMemo(() => {
    const items = ['전체']
    if (selectedDimension) {
      items.push(dimensionConfig[selectedDimension].label)
    }
    filters.forEach(f => items.push(f.label))
    return items
  }, [selectedDimension, filters])

  return (
    <div className="space-y-6">
      {/* 검색 바 */}
      <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-idus-100 dark:bg-idus-900/30 flex items-center justify-center">
            <Icon icon={Search} size="md" className="text-idus-600 dark:text-idus-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">데이터 탐색기</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">데이터를 다양한 차원에서 탐색하세요</p>
          </div>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="무엇이 궁금하신가요? (예: VIP 고객의 주요 구매 카테고리)"
            className="w-full px-4 py-3 pl-12 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-idus-500"
          />
          <Icon icon={Search} size="sm" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        
        {searchQuery && (
          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              💡 아래 차원을 선택하여 탐색을 시작하거나, 자연어 질문을 입력하세요.
            </p>
          </div>
        )}
      </Card>

      {/* 브레드크럼 */}
      {selectedDimension && (
        <div className="flex items-center gap-2 text-sm">
          <button 
            onClick={handleBack}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <Icon icon={ArrowLeft} size="xs" />
            뒤로
          </button>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          {breadcrumb.map((item, idx) => (
            <span key={idx} className="flex items-center gap-2">
              {idx > 0 && <Icon icon={ChevronRight} size="xs" className="text-slate-400" />}
              <span className={idx === breadcrumb.length - 1 ? 'font-medium text-slate-800 dark:text-slate-100' : 'text-slate-500'}>
                {item}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* 활성 필터 */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-500">필터:</span>
          {filters.map((filter, idx) => (
            <FilterChip 
              key={idx} 
              filter={filter} 
              onRemove={() => handleRemoveFilter(idx)} 
            />
          ))}
          <button 
            onClick={() => { setFilters([]); setResult(null); }}
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            모두 지우기
          </button>
        </div>
      )}

      {/* 차원 선택 (초기 화면) */}
      {!selectedDimension && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DimensionCard
            dimension="customer"
            count={counts.customer}
            onClick={() => handleDimensionSelect('customer')}
            isSelected={false}
          />
          <DimensionCard
            dimension="artist"
            count={counts.artist}
            onClick={() => handleDimensionSelect('artist')}
            isSelected={false}
          />
          <DimensionCard
            dimension="product"
            count={counts.product}
            onClick={() => handleDimensionSelect('product')}
            isSelected={false}
          />
          <DimensionCard
            dimension="country"
            count={counts.country}
            onClick={() => handleDimensionSelect('country')}
            isSelected={false}
          />
        </div>
      )}

      {/* 탐색 결과 */}
      {selectedDimension && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 세그먼트 선택 */}
          <Card className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              {dimensionConfig[selectedDimension].label} 세그먼트
              {isLoadingSegments && <Spinner size="sm" />}
            </h3>
            <SegmentList
              dimension={selectedDimension}
              onSelect={handleAddFilter}
              selectedValue={filters[filters.length - 1]?.value}
              options={segmentOptions[selectedDimension]}
              isLoading={isLoadingSegments}
            />
          </Card>

          {/* 결과 패널 */}
          <div className="lg:col-span-2">
            {isExploring ? (
              <Card className="p-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-idus-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">데이터를 분석하고 있습니다...</p>
                </div>
              </Card>
            ) : result ? (
              <ResultPanel result={result} filters={filters} />
            ) : (
              <Card className="p-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <Icon icon={BarChart3} size="xl" className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    왼쪽에서 세그먼트를 선택하여 탐색을 시작하세요
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DataExplorer

