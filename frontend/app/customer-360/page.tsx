'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { customer360Api } from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'
import { EnhancedLoadingPage } from '@/components/ui'
import { Icon } from '@/components/ui/Icon'
import OrderDetailModal from '@/components/OrderDetailModal'
import ArtistOrdersModal from '@/components/ArtistOrdersModal'
import {
  Search, User, Mail, Globe, Calendar, ShoppingBag, Star,
  Ticket, TrendingUp, Award, Clock, Package, DollarSign,
  ChevronRight, RefreshCw, AlertCircle, Users, BarChart3,
  Palette, Lightbulb, ExternalLink, Gift, Heart, Activity
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// ============================================================
// 타입 정의 (확장)
// ============================================================

interface CustomerProfile {
  userId: string
  email: string
  name: string
  country: string
  createdAt: string
  lastOrderDate: string | null
  activityStatus: string
  segment: string
}

interface RFMData {
  recency: number
  frequency: number
  monetary: number
  scores: { r: number; f: number; m: number }
  score: string
  segment: string
  segmentDescription?: string
}

interface CustomerStats {
  totalOrders: number
  totalSpent: number
  avgOrderValue: number
  totalReviews: number
  avgRating: number | null
  couponsUsed: number
  couponSavings?: number
  artistDiversity?: number
  purchaseFrequencyPerMonth?: number
}

interface Order {
  orderId: string
  orderDate: string
  totalAmount: number
  couponDiscount?: number
  itemCount: number
  status: string
  artistName: string
  productName: string
  country?: string
  dayOfWeek?: string
  timeOfDay?: string
}

interface Review {
  reviewId: string
  productName: string
  artistName: string
  rating: number
  content: string
  date: string
}

interface LTV {
  value: number
  confidence: number
  basis: string
}

interface TopArtist {
  name: string
  gmv: number
  orderCount: number
  lastOrder: string
}

interface CouponStats {
  totalSavings: number
  usageCount: number
  usageRate: number
}

interface PurchasePatterns {
  preferredDayOfWeek: string
  preferredTimeOfDay: string
  avgPurchaseCycle: number
  purchaseFrequencyPerMonth: number
  dayOfWeekDistribution: Record<string, number>
  timeOfDayDistribution: Record<string, number>
}

interface Insight {
  type: 'info' | 'warning' | 'success'
  message: string
}

interface RecommendedAction {
  label: string
  action: string
  params?: any
}

type TabType = 'overview' | 'orders' | 'artists' | 'reviews' | 'coupons'

// ============================================================
// 메인 컴포넌트
// ============================================================

export default function Customer360Page() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  
  // 모달 상태
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null)
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null)

  // 검색 쿼리 (user_id 기준)
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['customer-search', searchQuery],
    queryFn: () => customer360Api.search(searchQuery, 'userId', 10),
    enabled: searchQuery.length >= 1,
  })

  // 고객 상세 쿼리
  const { data: customerData, isLoading: customerLoading, refetch } = useQuery({
    queryKey: ['customer-360', selectedUserId],
    queryFn: () => customer360Api.getCustomer(selectedUserId!),
    enabled: !!selectedUserId,
  })

  const customer = customerData?.data
  const profile = customer?.profile as CustomerProfile | undefined
  const rfm = customer?.rfm as RFMData | undefined
  const stats = customer?.stats as CustomerStats | undefined
  const orders = customer?.orders as Order[] | undefined
  const reviews = customer?.reviews as Review[] | undefined
  const ltv: LTV | undefined = customer?.ltv
  const topArtists = customer?.topArtists as TopArtist[] | undefined
  const artistList = customer?.artistList as string[] | undefined
  const couponStats = customer?.couponStats as CouponStats | undefined
  const purchasePatterns = customer?.purchasePatterns as PurchasePatterns | undefined
  const insights = customer?.insights as Insight[] | undefined
  const recommendedActions = customer?.recommendedActions as RecommendedAction[] | undefined

  // 통합 검색으로 이동
  const handleGoToLookup = () => {
    if (selectedUserId) {
      router.push(`/lookup?type=user_id&query=${encodeURIComponent(selectedUserId)}`)
    }
  }

  // 쿠폰 발급 페이지로 이동
  const handleIssueCoupon = () => {
    if (selectedUserId) {
      router.push(`/coupon-generator?tab=individual&userIds=${selectedUserId}`)
    }
  }

  // 탭 정의
  const tabs = [
    { id: 'overview', label: '개요', icon: BarChart3 },
    { id: 'orders', label: '주문 이력', icon: Package },
    { id: 'artists', label: '작가 분석', icon: Palette },
    { id: 'reviews', label: '리뷰', icon: Star },
    { id: 'coupons', label: '쿠폰', icon: Ticket },
  ]

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 - 고객 인사이트 허브 (블루/시안 계열) */}
      <div className="relative bg-gradient-to-r from-sky-500 to-cyan-500 dark:from-sky-600 dark:to-cyan-600 rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden shadow-lg dark:shadow-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 dark:bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg dark:shadow-none">
            <Icon icon={User} size="xl" className="text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">고객 360° 뷰</h1>
            <p className="text-sky-100 dark:text-sky-200/80 text-xs lg:text-sm font-medium">개별 고객 심층 분석 및 CRM</p>
          </div>
        </div>
      </div>

      {/* 검색 영역 */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Icon icon={Search} size="md" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="고객 ID (user_id)로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Icon icon={RefreshCw} size="sm" className="animate-spin text-slate-400" />
            </div>
          )}
        </div>

        {/* 검색 결과 */}
        {searchResults?.data?.results && searchResults.data.results.length > 0 && (
          <div className="mt-2 max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
            {searchResults.data.results.map((result: any) => (
              <button
                key={result.userId}
                onClick={() => {
                  setSelectedUserId(result.userId)
                  setSearchQuery('')
                  setActiveTab('overview')
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center">
                  <Icon icon={User} size="sm" className="text-sky-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    ID: {result.userId}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {result.email || 'N/A'} · {result.country || 'N/A'}
                  </p>
                </div>
                <Icon icon={ChevronRight} size="sm" className="text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 고객 상세 */}
      {selectedUserId && (
        <>
          {customerLoading ? (
            <EnhancedLoadingPage message="고객 정보를 불러오는 중..." variant="default" size="md" />
          ) : customer ? (
            <div className="space-y-6">
              {/* 프로필 카드 (리뉴얼) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* 아바타 + 기본 정보 */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white text-2xl lg:text-3xl font-bold shadow-lg">
                      {(profile?.email || profile?.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                          {profile?.name || profile?.email?.split('@')[0] || `User ${profile?.userId}`}
                        </h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          profile?.activityStatus === 'active' 
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : profile?.activityStatus === 'inactive'
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {profile?.activityStatus === 'active' ? '● 활성' : 
                           profile?.activityStatus === 'inactive' ? '● 비활성' : '● 이탈'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Icon icon={Mail} size="xs" />
                          {profile?.email || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon icon={Globe} size="xs" />
                          {profile?.country || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon icon={Calendar} size="xs" />
                          가입: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ko-KR') : 'N/A'}
                        </span>
                      </div>
                      {/* 빠른 액션 버튼 */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          onClick={handleGoToLookup}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-lg text-xs font-medium hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors"
                        >
                          <Icon icon={Search} size="xs" />
                          통합 검색
                        </button>
                        <button
                          onClick={handleIssueCoupon}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                        >
                          <Icon icon={Ticket} size="xs" />
                          쿠폰 발급
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* RFM 세그먼트 카드 */}
                  <div className="lg:w-64 p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-100 dark:border-violet-800/30">
                    <p className="text-xs text-violet-600 dark:text-violet-400 mb-1 font-medium">RFM 세그먼트</p>
                    <p className="text-lg font-bold text-violet-700 dark:text-violet-300">{rfm?.segment}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">점수: {rfm?.score}</p>
                    {rfm?.segmentDescription && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                        {rfm.segmentDescription}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* KPI 카드 (8개로 확장) */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <KPICard
                  title="총 주문"
                  value={stats?.totalOrders || 0}
                  suffix="건"
                  icon={ShoppingBag}
                  color="blue"
                />
                <KPICard
                  title="총 구매액"
                  value={formatCurrency(stats?.totalSpent || 0)}
                  icon={DollarSign}
                  color="emerald"
                />
                <KPICard
                  title="평균 AOV"
                  value={formatCurrency(stats?.avgOrderValue || 0)}
                  icon={TrendingUp}
                  color="violet"
                />
                <KPICard
                  title="마지막 구매"
                  value={rfm?.recency || 0}
                  suffix="일 전"
                  icon={Clock}
                  color="amber"
                />
                <KPICard
                  title="월평균 구매"
                  value={stats?.purchaseFrequencyPerMonth?.toFixed(1) || '0'}
                  suffix="회"
                  icon={Activity}
                  color="cyan"
                />
                <KPICard
                  title="리뷰/평점"
                  value={`${stats?.totalReviews || 0}/${stats?.avgRating?.toFixed(1) || '-'}`}
                  icon={Star}
                  color="pink"
                />
                <KPICard
                  title="쿠폰 절약"
                  value={formatCurrency(stats?.couponSavings || couponStats?.totalSavings || 0)}
                  icon={Gift}
                  color="orange"
                />
                <KPICard
                  title="예상 LTV"
                  value={formatCurrency(ltv?.value || 0)}
                  icon={Heart}
                  color="rose"
                />
              </div>

              {/* 탭 네비게이션 */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 dark:border-slate-700">
                  <nav className="flex overflow-x-auto">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center gap-2 px-4 lg:px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        <Icon icon={tab.icon} size="sm" />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-4 lg:p-6">
                  {/* 개요 탭 */}
                  {activeTab === 'overview' && (
                    <OverviewTab
                      rfm={rfm}
                      ltv={ltv}
                      topArtists={topArtists}
                      purchasePatterns={purchasePatterns}
                      insights={insights}
                      recommendedActions={recommendedActions}
                      onArtistClick={setSelectedArtistName}
                      onIssueCoupon={handleIssueCoupon}
                      onGoToLookup={handleGoToLookup}
                    />
                  )}

                  {/* 주문 이력 탭 */}
                  {activeTab === 'orders' && (
                    <OrdersTab
                      orders={orders}
                      onOrderClick={setSelectedOrderCode}
                    />
                  )}

                  {/* 작가 분석 탭 */}
                  {activeTab === 'artists' && (
                    <ArtistsTab
                      topArtists={topArtists}
                      artistList={artistList}
                      onArtistClick={setSelectedArtistName}
                    />
                  )}

                  {/* 리뷰 탭 */}
                  {activeTab === 'reviews' && (
                    <ReviewsTab reviews={reviews} />
                  )}

                  {/* 쿠폰 탭 */}
                  {activeTab === 'coupons' && (
                    <CouponsTab
                      couponStats={couponStats}
                      orders={orders}
                      onIssueCoupon={handleIssueCoupon}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon icon={AlertCircle} size="xl" className="mx-auto mb-4 text-red-400" />
              <p className="text-slate-500">고객 정보를 불러올 수 없습니다.</p>
            </div>
          )}
        </>
      )}

      {/* 초기 상태 */}
      {!selectedUserId && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon icon={Search} size="xl" className="text-sky-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
            고객을 검색하세요
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            고객 ID로 검색하여 해당 고객의 360° 뷰를 확인할 수 있습니다.
            구매 이력, RFM 분석, 선호 작가, 쿠폰 사용 현황 등 상세 정보를 제공합니다.
          </p>
        </div>
      )}

      {/* 모달들 */}
      {selectedOrderCode && (
        <OrderDetailModal
          orderCode={selectedOrderCode}
          onClose={() => setSelectedOrderCode(null)}
        />
      )}
      {selectedArtistName && (
        <ArtistOrdersModal
          artistName={selectedArtistName}
          onClose={() => setSelectedArtistName(null)}
        />
      )}
    </div>
  )
}

// ============================================================
// 탭 컴포넌트들
// ============================================================

function OverviewTab({
  rfm,
  ltv,
  topArtists,
  purchasePatterns,
  insights,
  recommendedActions,
  onArtistClick,
  onIssueCoupon,
  onGoToLookup,
}: {
  rfm?: RFMData
  ltv?: LTV
  topArtists?: TopArtist[]
  purchasePatterns?: PurchasePatterns
  insights?: Insight[]
  recommendedActions?: RecommendedAction[]
  onArtistClick: (name: string) => void
  onIssueCoupon: () => void
  onGoToLookup: () => void
}) {
  return (
    <div className="space-y-6">
      {/* 인사이트 섹션 */}
      {insights && insights.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Icon icon={Lightbulb} size="sm" className="text-amber-500" />
            AI 인사이트
          </h4>
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 text-sm p-2 rounded-lg ${
                  insight.type === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                    : insight.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300'
                }`}
              >
                <span className="text-base">
                  {insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✅' : 'ℹ️'}
                </span>
                <span>{insight.message}</span>
              </div>
            ))}
          </div>
          {/* 권장 액션 */}
          {recommendedActions && recommendedActions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
              {recommendedActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (action.action === 'issue_coupon') onIssueCoupon()
                    else if (action.action === 'navigate') onGoToLookup()
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RFM 상세 분석 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">RFM 상세 분석</h4>
          <div className="space-y-4">
            <RFMScoreBar label="Recency (최근성)" score={rfm?.scores.r || 0} description={`${rfm?.recency || 0}일 전`} />
            <RFMScoreBar label="Frequency (빈도)" score={rfm?.scores.f || 0} description={`${rfm?.frequency || 0}회`} />
            <RFMScoreBar label="Monetary (금액)" score={rfm?.scores.m || 0} description={formatCurrency(rfm?.monetary || 0)} />
          </div>
        </div>

        {/* LTV 예측 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">예상 LTV</h4>
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(ltv?.value || 0)}
            </p>
            <p className="text-sm text-slate-500 mt-2">신뢰도: {((ltv?.confidence || 0) * 100).toFixed(0)}%</p>
            <p className="text-xs text-slate-400 mt-2 px-4">{ltv?.basis}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 선호 작가 Top 5 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">선호 작가 Top 5</h4>
          {topArtists && topArtists.length > 0 ? (
            <div className="space-y-2">
              {topArtists.slice(0, 5).map((artist, idx) => (
                <button
                  key={artist.name}
                  onClick={() => onArtistClick(artist.name)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-amber-100 text-amber-600' :
                    idx === 1 ? 'bg-slate-200 text-slate-600' :
                    idx === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{artist.name}</p>
                    <p className="text-xs text-slate-500">{artist.orderCount}건</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(artist.gmv)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState message="구매한 작가가 없습니다." />
          )}
        </div>

        {/* 구매 패턴 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">구매 패턴</h4>
          {purchasePatterns ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm text-slate-600 dark:text-slate-400">선호 요일</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{purchasePatterns.preferredDayOfWeek}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm text-slate-600 dark:text-slate-400">선호 시간대</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{purchasePatterns.preferredTimeOfDay}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm text-slate-600 dark:text-slate-400">평균 구매 주기</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {purchasePatterns.avgPurchaseCycle > 0 ? `${purchasePatterns.avgPurchaseCycle}일` : '-'}
                </span>
              </div>
              {/* 요일별 분포 차트 */}
              {purchasePatterns.dayOfWeekDistribution && Object.keys(purchasePatterns.dayOfWeekDistribution).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-2">요일별 구매 분포</p>
                  <div className="h-32">
                    <Bar
                      data={{
                        labels: Object.keys(purchasePatterns.dayOfWeekDistribution),
                        datasets: [{
                          data: Object.values(purchasePatterns.dayOfWeekDistribution),
                          backgroundColor: '#0ea5e9',
                          borderRadius: 4,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: { beginAtZero: true, display: false },
                          x: { grid: { display: false } }
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState message="구매 패턴 데이터가 없습니다." />
          )}
        </div>
      </div>
    </div>
  )
}

function OrdersTab({
  orders,
  onOrderClick,
}: {
  orders?: Order[]
  onOrderClick: (orderId: string) => void
}) {
  if (!orders || orders.length === 0) {
    return <EmptyState message="주문 이력이 없습니다." />
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 mb-4">총 {orders.length}건의 주문</p>
      {orders.map((order) => (
        <button
          key={order.orderId}
          onClick={() => onOrderClick(order.orderId)}
          className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left"
        >
          <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
            <Icon icon={Package} size="md" className="text-sky-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sky-600 dark:text-sky-400 truncate">
              {order.orderId}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {order.artistName || order.productName || '상품 정보 없음'} · {new Date(order.orderDate).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {formatCurrency(order.totalAmount)}
            </p>
            <p className="text-xs text-slate-500">{order.status}</p>
          </div>
          <Icon icon={ChevronRight} size="sm" className="text-slate-400" />
        </button>
      ))}
    </div>
  )
}

function ArtistsTab({
  topArtists,
  artistList,
  onArtistClick,
}: {
  topArtists?: TopArtist[]
  artistList?: string[]
  onArtistClick: (name: string) => void
}) {
  if (!artistList || artistList.length === 0) {
    return <EmptyState message="구매한 작가가 없습니다." />
  }

  return (
    <div className="space-y-6">
      {/* 작가별 구매 현황 테이블 */}
      {topArtists && topArtists.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">작가별 구매 현황</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-400">작가명</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-600 dark:text-slate-400">구매 금액</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-600 dark:text-slate-400">구매 횟수</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-600 dark:text-slate-400">최근 주문</th>
                </tr>
              </thead>
              <tbody>
                {topArtists.map((artist) => (
                  <tr key={artist.name} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-3">
                      <button
                        onClick={() => onArtistClick(artist.name)}
                        className="text-sky-600 dark:text-sky-400 hover:underline font-medium"
                      >
                        {artist.name}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(artist.gmv)}
                    </td>
                    <td className="py-2 px-3 text-right">{artist.orderCount}건</td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      {artist.lastOrder ? new Date(artist.lastOrder).toLocaleDateString('ko-KR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 작가 태그 클라우드 */}
      <div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
          구매한 작가 목록 ({artistList.length}명)
        </h4>
        <div className="flex flex-wrap gap-2">
          {artistList.map((artist) => (
            <button
              key={artist}
              onClick={() => onArtistClick(artist)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
            >
              {artist}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReviewsTab({ reviews }: { reviews?: Review[] }) {
  if (!reviews || reviews.length === 0) {
    return <EmptyState message="작성한 리뷰가 없습니다." />
  }

  // 평점 분포 계산
  const ratingDistribution: Record<number, number> = {}
  reviews.forEach((r) => {
    const rating = Math.round(r.rating)
    ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1
  })

  return (
    <div className="space-y-6">
      {/* 평점 분포 */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">평점 분포 (10점 만점)</h4>
        <div className="h-32">
          <Bar
            data={{
              labels: ['1-2점', '3-4점', '5-6점', '7-8점', '9-10점'],
              datasets: [{
                data: [
                  (ratingDistribution[1] || 0) + (ratingDistribution[2] || 0),
                  (ratingDistribution[3] || 0) + (ratingDistribution[4] || 0),
                  (ratingDistribution[5] || 0) + (ratingDistribution[6] || 0),
                  (ratingDistribution[7] || 0) + (ratingDistribution[8] || 0),
                  (ratingDistribution[9] || 0) + (ratingDistribution[10] || 0),
                ],
                backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'],
                borderRadius: 4,
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } }
              }
            }}
          />
        </div>
      </div>

      {/* 리뷰 목록 */}
      <div className="space-y-3">
        <p className="text-sm text-slate-500">총 {reviews.length}개의 리뷰</p>
        {reviews.map((review) => (
          <div key={review.reviewId} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate flex-1">
                {review.productName}
              </p>
              <div className="flex items-center gap-1 ml-2">
                <span className="text-amber-500 font-semibold text-sm">{review.rating}</span>
                <span className="text-slate-400 text-xs">/10</span>
              </div>
            </div>
            {review.content && (
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {review.content}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-2">
              {review.artistName} · {review.date ? new Date(review.date).toLocaleDateString('ko-KR') : 'N/A'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CouponsTab({
  couponStats,
  orders,
  onIssueCoupon,
}: {
  couponStats?: CouponStats
  orders?: Order[]
  onIssueCoupon: () => void
}) {
  // 쿠폰 사용 주문만 필터링
  const ordersWithCoupon = orders?.filter((o) => o.couponDiscount && o.couponDiscount > 0) || []

  return (
    <div className="space-y-6">
      {/* 쿠폰 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">총 절약 금액</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
            {formatCurrency(couponStats?.totalSavings || 0)}
          </p>
        </div>
        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4 text-center">
          <p className="text-xs text-sky-600 dark:text-sky-400 mb-1">쿠폰 사용 횟수</p>
          <p className="text-xl font-bold text-sky-700 dark:text-sky-300">
            {couponStats?.usageCount || 0}건
          </p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 text-center">
          <p className="text-xs text-violet-600 dark:text-violet-400 mb-1">쿠폰 사용률</p>
          <p className="text-xl font-bold text-violet-700 dark:text-violet-300">
            {couponStats?.usageRate || 0}%
          </p>
        </div>
      </div>

      {/* 쿠폰 사용 이력 */}
      <div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">쿠폰 사용 주문</h4>
        {ordersWithCoupon.length > 0 ? (
          <div className="space-y-2">
            {ordersWithCoupon.map((order) => (
              <div key={order.orderId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{order.orderId}</p>
                  <p className="text-xs text-slate-500">{new Date(order.orderDate).toLocaleDateString('ko-KR')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    -{formatCurrency(order.couponDiscount || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="쿠폰 사용 이력이 없습니다." />
        )}
      </div>

      {/* 쿠폰 발급 버튼 */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={onIssueCoupon}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
        >
          <Icon icon={Ticket} size="md" />
          이 고객에게 쿠폰 발급하기
        </button>
      </div>
    </div>
  )
}

// ============================================================
// 공통 컴포넌트
// ============================================================

function KPICard({
  title,
  value,
  suffix = '',
  icon: IconComponent,
  color,
}: {
  title: string
  value: string | number
  suffix?: string
  icon: any
  color: 'blue' | 'emerald' | 'violet' | 'amber' | 'pink' | 'cyan' | 'orange' | 'rose'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500',
    violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-500',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-500',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-500',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-500',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-500',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-500',
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${colorClasses[color]}`}>
        <Icon icon={IconComponent} size="sm" />
      </div>
      <p className="text-xs text-slate-500 mb-0.5 truncate">{title}</p>
      <p className="text-sm lg:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
        {value}{suffix && <span className="text-xs font-normal text-slate-500 ml-0.5">{suffix}</span>}
      </p>
    </div>
  )
}

function RFMScoreBar({
  label,
  score,
  description,
}: {
  label: string
  score: number
  description: string
}) {
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-emerald-500'
    if (score >= 3) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{score}/5</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getScoreColor(score)} rounded-full transition-all`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 min-w-[80px] text-right">{description}</span>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-slate-500">
      <Icon icon={AlertCircle} size="lg" className="mx-auto mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
