'use client'

import { useQuery } from '@tanstack/react-query'
import { logisticsApi } from '@/lib/api'
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import OrderDetailModal from '@/components/OrderDetailModal'
import { Icon } from '@/components/ui/Icon'
import { EnhancedLoadingPage } from '@/components/ui'
import { Truck, Package, Filter, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogisticsItem {
  name: string
  quantity: string | number
  url: string
}

interface LogisticsOrder {
  orderCode: string
  country: string
  logisticsStatus: string
  lastUpdate: string
  artistTracking: {
    number: string
    url: string
  }
  internationalTracking: {
    number: string
    url: string
  }
  items: LogisticsItem[]
  timelineEvents: Array<{ status: string; date: string }>
}

// 국가 코드 → 국기 이모지 + 이름 매핑
const countryMap: Record<string, { flag: string; name: string }> = {
  US: { flag: '🇺🇸', name: '미국' },
  JP: { flag: '🇯🇵', name: '일본' },
  CN: { flag: '🇨🇳', name: '중국' },
  KR: { flag: '🇰🇷', name: '한국' },
  DE: { flag: '🇩🇪', name: '독일' },
  GB: { flag: '🇬🇧', name: '영국' },
  FR: { flag: '🇫🇷', name: '프랑스' },
  CA: { flag: '🇨🇦', name: '캐나다' },
  AU: { flag: '🇦🇺', name: '호주' },
  SG: { flag: '🇸🇬', name: '싱가포르' },
  TW: { flag: '🇹🇼', name: '대만' },
  HK: { flag: '🇭🇰', name: '홍콩' },
  TH: { flag: '🇹🇭', name: '태국' },
  VN: { flag: '🇻🇳', name: '베트남' },
  MY: { flag: '🇲🇾', name: '말레이시아' },
  ID: { flag: '🇮🇩', name: '인도네시아' },
  PH: { flag: '🇵🇭', name: '필리핀' },
  NL: { flag: '🇳🇱', name: '네덜란드' },
  ES: { flag: '🇪🇸', name: '스페인' },
  IT: { flag: '🇮🇹', name: '이탈리아' },
  SE: { flag: '🇸🇪', name: '스웨덴' },
  CH: { flag: '🇨🇭', name: '스위스' },
  AT: { flag: '🇦🇹', name: '오스트리아' },
  BE: { flag: '🇧🇪', name: '벨기에' },
  DK: { flag: '🇩🇰', name: '덴마크' },
  FI: { flag: '🇫🇮', name: '핀란드' },
  NO: { flag: '🇳🇴', name: '노르웨이' },
  NZ: { flag: '🇳🇿', name: '뉴질랜드' },
  IE: { flag: '🇮🇪', name: '아일랜드' },
  PT: { flag: '🇵🇹', name: '포르투갈' },
  PL: { flag: '🇵🇱', name: '폴란드' },
  CZ: { flag: '🇨🇿', name: '체코' },
  HU: { flag: '🇭🇺', name: '헝가리' },
  RO: { flag: '🇷🇴', name: '루마니아' },
  GR: { flag: '🇬🇷', name: '그리스' },
  IL: { flag: '🇮🇱', name: '이스라엘' },
  AE: { flag: '🇦🇪', name: 'UAE' },
  SA: { flag: '🇸🇦', name: '사우디' },
  IN: { flag: '🇮🇳', name: '인도' },
  BR: { flag: '🇧🇷', name: '브라질' },
  MX: { flag: '🇲🇽', name: '멕시코' },
  AR: { flag: '🇦🇷', name: '아르헨티나' },
  CL: { flag: '🇨🇱', name: '칠레' },
  CO: { flag: '🇨🇴', name: '콜롬비아' },
  ZA: { flag: '🇿🇦', name: '남아공' },
}

function CountryBadge({ code }: { code: string }) {
  const country = countryMap[code] || { flag: '🌐', name: code }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm whitespace-nowrap">
      <span>{country.flag}</span>
      <span className="font-medium text-slate-700 dark:text-slate-300">{code}</span>
    </span>
  )
}

// 상태별 스타일
function StatusBadge({ status }: { status: string }) {
  const statusLower = status.toLowerCase()
  
  let style = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
  
  if (statusLower.includes('결제 완료')) {
    style = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
  } else if (statusLower.includes('작가') && statusLower.includes('송장')) {
    style = 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
  } else if (statusLower.includes('작가') && statusLower.includes('발송')) {
    style = 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
  } else if (statusLower.includes('검수 대기') || statusLower.includes('입고')) {
    style = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
  } else if (statusLower.includes('검수완료') || statusLower.includes('검수 완료')) {
    style = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  } else if (statusLower.includes('국제배송') || statusLower.includes('배송중') || statusLower.includes('배송 중')) {
    style = 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
  } else if (statusLower.includes('완료') || statusLower.includes('도착')) {
    style = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
  }
  
  return (
    <span className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap', style)}>
      {status}
    </span>
  )
}

// 상태별 카드 테두리/배경 색상
function getStatusColor(status: string) {
  const statusLower = status.toLowerCase()
  
  if (statusLower.includes('결제 완료')) {
    return 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
  } else if (statusLower.includes('송장')) {
    return 'border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10'
  } else if (statusLower.includes('검수 대기') || statusLower.includes('입고')) {
    return 'border-yellow-300 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10'
  } else if (statusLower.includes('배송') || statusLower.includes('배송중') || statusLower.includes('국제배송')) {
    return 'border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10'
  } else if (statusLower.includes('완료') || statusLower.includes('도착')) {
    return 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
  }
  
  return 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
}

export default function LogisticsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // URL 쿼리 파라미터에서 초기값 로드
  const initialStatus = searchParams.get('status') || '모든 상태'
  const initialCountry = searchParams.get('country') || '모든 국가'
  const initialSearch = searchParams.get('search') || ''
  
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedCountry, setSelectedCountry] = useState(initialCountry)
  const [selectedStatus, setSelectedStatus] = useState(initialStatus)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false)
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null)

  // URL 파라미터 변경 시 상태 동기화
  useEffect(() => {
    const status = searchParams.get('status')
    const country = searchParams.get('country')
    const search = searchParams.get('search')
    
    if (status) setSelectedStatus(decodeURIComponent(status))
    if (country) setSelectedCountry(decodeURIComponent(country))
    if (search) setSearchTerm(decodeURIComponent(search))
  }, [searchParams])

  // 필터 변경 시 URL 업데이트 (선택적 - 브라우저 히스토리 유지)
  const updateUrlParams = (newStatus?: string, newCountry?: string, newSearch?: string) => {
    const params = new URLSearchParams()
    const status = newStatus ?? selectedStatus
    const country = newCountry ?? selectedCountry
    const search = newSearch ?? searchTerm
    
    if (status && status !== '모든 상태') params.set('status', status)
    if (country && country !== '모든 국가') params.set('country', country)
    if (search) params.set('search', search)
    
    const queryString = params.toString()
    router.replace(`/logistics${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }

  const openOrderDetailModal = (orderCode: string) => {
    setSelectedOrderCode(orderCode)
    setIsOrderDetailModalOpen(true)
  }

  const closeOrderDetailModal = () => {
    setIsOrderDetailModalOpen(false)
    setSelectedOrderCode(null)
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['logistics'],
    queryFn: () => logisticsApi.getList(),
  })

  // 필터 옵션 생성
  const { countries, statuses, stats } = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return { countries: [], statuses: [], stats: { total: 0, byStatus: {} as Record<string, number>, byCountry: {} as Record<string, number> } }
    }

    const countrySet = new Set<string>()
    const statusSet = new Set<string>()
    const byStatus: Record<string, number> = {}
    const byCountry: Record<string, number> = {}

    data.forEach((order: LogisticsOrder) => {
      if (order.country) {
        countrySet.add(order.country)
        byCountry[order.country] = (byCountry[order.country] || 0) + 1
      }
      if (order.logisticsStatus) {
        statusSet.add(order.logisticsStatus)
        byStatus[order.logisticsStatus] = (byStatus[order.logisticsStatus] || 0) + 1
      }
    })

    return {
      countries: ['모든 국가', ...Array.from(countrySet).sort()],
      statuses: ['모든 상태', ...Array.from(statusSet).sort()],
      stats: { total: data.length, byStatus, byCountry },
    }
  }, [data])

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return []

    return data.filter((order: LogisticsOrder) => {
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase()
        if (!order.orderCode.toLowerCase().includes(lowerSearch)) {
          return false
        }
      }

      if (selectedCountry !== '모든 국가') {
        if (order.country !== selectedCountry) {
          return false
        }
      }

      if (selectedStatus !== '모든 상태') {
        if (order.logisticsStatus !== selectedStatus) {
          return false
        }
      }

      return true
    })
  }, [data, searchTerm, selectedCountry, selectedStatus])

  const toggleItems = (orderCode: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(orderCode)) {
      newExpanded.delete(orderCode)
    } else {
      newExpanded.add(orderCode)
    }
    setExpandedItems(newExpanded)
  }

  if (isLoading) {
    return <EnhancedLoadingPage message="물류 정보를 불러오는 중..." variant="default" size="lg" />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card bg-red-50 border-red-200">
          <h2 className="text-xl font-semibold text-red-800 mb-2">오류 발생</h2>
          <p className="text-red-600">데이터를 불러오는 중 문제가 발생했습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 - idus 브랜드 스타일 */}
      <div className="relative bg-idus-500 rounded-2xl p-6 mb-6 overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
            <Icon icon={Truck} size="xl" className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">글로벌 물류 추적</h1>
            <p className="text-idus-100 text-sm font-medium">진행 중인 모든 주문의 물류 현황을 추적합니다</p>
          </div>
        </div>
      </div>

      {/* 통계 카드 + 빠른 필터 통합 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6 mb-6 shadow-sm">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">전체 주문</p>
            <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.total} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">건</span>
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
            <p className="text-xs lg:text-sm text-orange-600 dark:text-orange-400 mb-1 font-medium">송장 입력 대기</p>
            <p className="text-xl lg:text-2xl font-bold text-orange-700 dark:text-orange-300">
              {Object.entries(stats.byStatus).filter(([k]) => k.includes('송장')).reduce((a, [, v]) => a + v, 0)} <span className="text-sm font-normal">건</span>
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <p className="text-xs lg:text-sm text-purple-600 dark:text-purple-400 mb-1 font-medium">국제 배송중</p>
            <p className="text-xl lg:text-2xl font-bold text-purple-700 dark:text-purple-300">
              {Object.entries(stats.byStatus).filter(([k]) => k.includes('배송')).reduce((a, [, v]) => a + v, 0)} <span className="text-sm font-normal">건</span>
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">배송 국가</p>
            <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {Object.keys(stats.byCountry).length} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">개국</span>
            </p>
          </div>
        </div>
        
        {/* 빠른 필터 (인라인) */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700 flex-wrap">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 mr-2">빠른 필터:</span>
          <button
            onClick={() => {
              setSelectedStatus('모든 상태')
              setSelectedCountry('모든 국가')
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              selectedStatus === '모든 상태' && selectedCountry === '모든 국가'
                ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
          >
            전체 ({stats.total})
          </button>
          {/* 주요 국가 빠른 필터 */}
          {['JP', 'US', 'SG', 'HK'].filter(c => stats.byCountry[c]).map(countryCode => (
            <button
              key={countryCode}
              onClick={() => setSelectedCountry(countryCode)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                selectedCountry === countryCode
                  ? 'bg-idus-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {countryMap[countryCode]?.flag} {countryCode} ({stats.byCountry[countryCode] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* 통합 필터 섹션 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon={Filter} size="sm" className="text-slate-500 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">필터</h3>
        </div>
        
        {/* 검색 및 드롭다운 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">주문번호</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="주문번호로 검색..."
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-idus-500 focus:border-idus-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">국가</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-idus-500 focus:border-idus-500 transition-all"
            >
              {countries.map((country) => {
                const countryInfo = countryMap[country]
                return (
                  <option key={country} value={country}>
                    {countryInfo ? `${countryInfo.flag} ${country}` : country}
                  </option>
                )
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">상태</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-idus-500 focus:border-idus-500 transition-all"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 향상된 카드 스타일 테이블 */}
      <div className="space-y-3">
        {filteredData.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon={Truck} size="xl" className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              추적할 주문이 없습니다
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              필터 조건을 변경하여 다른 주문을 확인해보세요.
            </p>
            <button
              onClick={() => {
                setSelectedStatus('모든 상태')
                setSelectedCountry('모든 국가')
                setSearchTerm('')
              }}
              className="px-4 py-2 text-sm font-medium text-idus-500 hover:text-idus-600 hover:bg-idus-50 dark:hover:bg-idus-900/20 rounded-lg transition-colors"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <>
            {filteredData
              .sort((a: LogisticsOrder, b: LogisticsOrder) =>
                b.orderCode.localeCompare(a.orderCode)
              )
              .map((order: LogisticsOrder) => {
                const isExpanded = expandedItems.has(order.orderCode)
                const hasMultipleItems = order.items.length > 1

                return (
                  <div
                    key={order.orderCode}
                    className={cn(
                      'bg-white dark:bg-slate-900 rounded-xl border-2 p-5 transition-all',
                      'hover:shadow-lg hover:-translate-y-0.5',
                      getStatusColor(order.logisticsStatus)
                    )}
                  >
                    {/* 카드 헤더: 주문번호 + 상태 + 국가 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <button
                            onClick={() => openOrderDetailModal(order.orderCode)}
                            className="text-lg font-bold text-idus-500 hover:text-idus-600 hover:underline transition-colors"
                          >
                            {order.orderCode}
                          </button>
                          <StatusBadge status={order.logisticsStatus} />
                          <CountryBadge code={order.country} />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          최종 업데이트: {order.lastUpdate}
                        </p>
                      </div>
                      <button
                        onClick={() => openOrderDetailModal(order.orderCode)}
                        className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-idus-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        상세보기
                      </button>
                    </div>
                    
                    {/* 작품 목록 */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon icon={Package} size="sm" className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">작품 목록</span>
                        {hasMultipleItems && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            {order.items.length}개
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {order.items.slice(0, isExpanded ? order.items.length : 2).map((item, idx) => (
                          <Link
                            key={idx}
                            href={item.url}
                            target="_blank"
                            className="block text-sm text-slate-900 dark:text-slate-100 hover:text-idus-500 hover:underline line-clamp-1"
                          >
                            {item.name} <span className="text-slate-500 dark:text-slate-400">(수량: {item.quantity})</span>
                          </Link>
                        ))}
                        {order.items.length > 2 && (
                          <button
                            onClick={() => toggleItems(order.orderCode)}
                            className="text-sm text-idus-500 hover:text-idus-600 font-medium"
                          >
                            {isExpanded ? '접기' : `+${order.items.length - 2}개 더 보기`}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* 추적 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon icon={Package} size="sm" className="text-slate-400" />
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">국내배송</span>
                        </div>
                        {order.artistTracking.number !== 'N/A' ? (
                          <Link
                            href={order.artistTracking.url}
                            target="_blank"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
                          >
                            {order.artistTracking.number}
                            <Icon icon={ExternalLink} size="xs" />
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon icon={Truck} size="sm" className="text-slate-400" />
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">국제배송</span>
                        </div>
                        {order.internationalTracking.number !== 'N/A' ? (
                          <Link
                            href={order.internationalTracking.url}
                            target="_blank"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium"
                          >
                            {order.internationalTracking.number}
                            <Icon icon={ExternalLink} size="xs" />
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            
            {/* 카드뷰 푸터 */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                총 <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredData.length}</span>개 주문
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                마지막 업데이트: {new Date().toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </>
        )}
      </div>

      {/* 주문 상세 모달 */}
      {isOrderDetailModalOpen && selectedOrderCode && (
        <OrderDetailModal orderCode={selectedOrderCode} onClose={closeOrderDetailModal} />
      )}
    </div>
  )
}
