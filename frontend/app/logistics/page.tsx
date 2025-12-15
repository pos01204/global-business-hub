'use client'

import { useQuery } from '@tanstack/react-query'
import { logisticsApi } from '@/lib/api'
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import OrderDetailModal from '@/components/OrderDetailModal'
import { Icon } from '@/components/ui/Icon'
import { Truck, Package } from 'lucide-react'

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
    <span className="inline-flex items-center gap-1 text-sm text-gray-700 whitespace-nowrap">
      <span>{country.flag}</span>
      <span className="font-medium">{code}</span>
    </span>
  )
}

// 상태별 스타일
function StatusBadge({ status }: { status: string }) {
  const statusLower = status.toLowerCase()
  
  let style = 'bg-gray-100 text-gray-700'
  
  if (statusLower.includes('결제 완료')) {
    style = 'bg-blue-100 text-blue-700'
  } else if (statusLower.includes('작가') && statusLower.includes('송장')) {
    style = 'bg-orange-100 text-orange-700'
  } else if (statusLower.includes('작가') && statusLower.includes('발송')) {
    style = 'bg-amber-100 text-amber-700'
  } else if (statusLower.includes('검수 대기') || statusLower.includes('입고')) {
    style = 'bg-yellow-100 text-yellow-700'
  } else if (statusLower.includes('검수완료') || statusLower.includes('검수 완료')) {
    style = 'bg-green-100 text-green-700'
  } else if (statusLower.includes('국제배송') || statusLower.includes('배송중') || statusLower.includes('배송 중')) {
    style = 'bg-purple-100 text-purple-700'
  } else if (statusLower.includes('완료') || statusLower.includes('도착')) {
    style = 'bg-emerald-100 text-emerald-700'
  }
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${style}`}>
      {status}
    </span>
  )
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
    return <EnhancedLoadingPage message="물류 정보를 불러오는 중..." variant="fullscreen" size="lg" />
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

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">전체 주문</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">송장 입력 대기</p>
          <p className="text-2xl font-bold text-orange-600">
            {Object.entries(stats.byStatus).filter(([k]) => k.includes('송장')).reduce((a, [, v]) => a + v, 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">국제 배송중</p>
          <p className="text-2xl font-bold text-purple-600">
            {Object.entries(stats.byStatus).filter(([k]) => k.includes('배송')).reduce((a, [, v]) => a + v, 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">배송 국가</p>
          <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.byCountry).length}</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">주문번호</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="주문번호로 검색..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">국가</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">상태</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
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

      {/* 테이블 */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-4 font-semibold text-gray-700 min-w-[150px]">주문번호</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700 min-w-[300px]">작품 목록</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700 min-w-[80px]">국가</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700 min-w-[140px]">종합 상태</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700 min-w-[140px]">국내배송</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700 min-w-[140px]">국제배송</th>
                <th className="text-right py-4 px-4 font-semibold text-gray-700 min-w-[100px]">최종 업데이트</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="text-gray-400">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="font-medium">표시할 데이터가 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData
                  .sort((a: LogisticsOrder, b: LogisticsOrder) =>
                    b.orderCode.localeCompare(a.orderCode)
                  )
                  .map((order: LogisticsOrder) => {
                    const isExpanded = expandedItems.has(order.orderCode)
                    const firstItem = order.items[0]
                    const hasMultipleItems = order.items.length > 1

                    return (
                      <tr key={order.orderCode} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <button
                            onClick={() => openOrderDetailModal(order.orderCode)}
                            className="text-primary hover:underline font-medium text-sm"
                          >
                            {order.orderCode}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <div className="item-list-cell">
                            <div className="flex items-start gap-2">
                              {firstItem && (
                                <Link
                                  href={firstItem.url}
                                  target="_blank"
                                  className="flex-1 text-gray-900 hover:text-primary hover:underline font-medium text-sm line-clamp-1"
                                  title={`${firstItem.name} (수량: ${firstItem.quantity})`}
                                >
                                  {firstItem.name} <span className="text-gray-500">(수량: {firstItem.quantity})</span>
                                </Link>
                              )}
                              {hasMultipleItems && (
                                <button
                                  onClick={() => toggleItems(order.orderCode)}
                                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs transition-colors"
                                  title={isExpanded ? '숨기기' : '전체 목록 보기'}
                                >
                                  {isExpanded ? '▲' : `+${order.items.length - 1}`}
                                </button>
                              )}
                            </div>
                            {hasMultipleItems && isExpanded && (
                              <ul className="mt-2 space-y-1 pl-3 border-l-2 border-gray-200">
                                {order.items.slice(1).map((item, idx) => (
                                  <li key={idx}>
                                    <Link
                                      href={item.url}
                                      target="_blank"
                                      className="text-sm text-gray-600 hover:text-primary hover:underline line-clamp-1"
                                      title={`${item.name} (수량: ${item.quantity})`}
                                    >
                                      {item.name} <span className="text-gray-400">(수량: {item.quantity})</span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <CountryBadge code={order.country} />
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={order.logisticsStatus} />
                        </td>
                        <td className="py-4 px-4">
                          {order.artistTracking.number !== 'N/A' ? (
                            <Link
                              href={order.artistTracking.url}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                            >
                              <Icon icon={Package} size="xs" className="text-slate-600 dark:text-slate-400" />
                              <span className="font-medium">{order.artistTracking.number}</span>
                            </Link>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {order.internationalTracking.number !== 'N/A' ? (
                            <Link
                              href={order.internationalTracking.url}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                            >
                              <span className="text-xs">✈️</span>
                              <span className="font-medium">{order.internationalTracking.number}</span>
                            </Link>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right text-sm text-gray-600">
                          {order.lastUpdate}
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
        
        {/* 테이블 푸터 */}
        {filteredData.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              총 <span className="font-semibold text-gray-900">{filteredData.length}</span>개 주문
            </p>
            <p className="text-xs text-gray-500">
              마지막 업데이트: {new Date().toLocaleString('ko-KR')}
            </p>
          </div>
        )}
      </div>

      {/* 주문 상세 모달 */}
      {isOrderDetailModalOpen && selectedOrderCode && (
        <OrderDetailModal orderCode={selectedOrderCode} onClose={closeOrderDetailModal} />
      )}
    </div>
  )
}
