'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { customer360Api } from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'
import { EnhancedLoadingPage } from '@/components/ui'
import { Icon } from '@/components/ui/Icon'
import {
  Search, User, Mail, Globe, Calendar, ShoppingBag, Star,
  Ticket, TrendingUp, Award, Clock, Package, DollarSign,
  ChevronRight, RefreshCw, AlertCircle
} from 'lucide-react'

// ============================================================
// 타입 정의
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
}

interface CustomerStats {
  totalOrders: number
  totalSpent: number
  avgOrderValue: number
  totalReviews: number
  avgRating: number | null
  couponsUsed: number
}

interface Order {
  orderId: string
  orderDate: string
  totalAmount: number
  itemCount: number
  status: string
  artistName: string
  productName: string
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

// ============================================================
// 컴포넌트
// ============================================================

export default function Customer360Page() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'reviews'>('overview')

  // 검색 쿼리 (user_id 기준 - 가장 고유한 값)
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
  const ltv = customer?.ltv as LTV | undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 - 고객 인사이트 허브 (블루/시안 계열) */}
        <div className="relative bg-gradient-to-r from-sky-500 to-cyan-500 dark:from-sky-600 dark:to-cyan-600 rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden shadow-lg dark:shadow-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 dark:bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg dark:shadow-none">
              <Icon icon={User} size="xl" className="text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">고객 360° 뷰</h1>
              <p className="text-sky-100 dark:text-sky-200/80 text-xs lg:text-sm font-medium">고객 통합 프로필 및 RFM 분석</p>
            </div>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Icon icon={Search} size="md" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="고객 ID (user_id)로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Icon icon={User} size="sm" className="text-blue-500" />
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
                {/* 프로필 헤더 */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* 아바타 */}
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                      {(profile?.email || '?')[0].toUpperCase()}
                    </div>
                    
                    {/* 기본 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                          {profile?.name || profile?.email}
                        </h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          profile?.activityStatus === 'active' 
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : profile?.activityStatus === 'inactive'
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {profile?.activityStatus === 'active' ? '활성' : 
                           profile?.activityStatus === 'inactive' ? '비활성' : '이탈'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Icon icon={Mail} size="xs" />
                          {profile?.email}
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
                    </div>
                    
                    {/* RFM 세그먼트 */}
                    <div className="text-center p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl">
                      <p className="text-xs text-violet-600 dark:text-violet-400 mb-1">RFM 세그먼트</p>
                      <p className="text-lg font-bold text-violet-700 dark:text-violet-300">{rfm?.segment}</p>
                      <p className="text-xs text-slate-500 mt-1">점수: {rfm?.score}</p>
                    </div>
                  </div>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <StatCard
                    title="총 주문"
                    value={stats?.totalOrders || 0}
                    suffix="건"
                    icon={ShoppingBag}
                    color="blue"
                  />
                  <StatCard
                    title="총 구매액"
                    value={formatCurrency(stats?.totalSpent || 0)}
                    icon={DollarSign}
                    color="emerald"
                  />
                  <StatCard
                    title="평균 주문액"
                    value={formatCurrency(stats?.avgOrderValue || 0)}
                    icon={TrendingUp}
                    color="violet"
                  />
                  <StatCard
                    title="마지막 구매"
                    value={rfm?.recency || 0}
                    suffix="일 전"
                    icon={Clock}
                    color="amber"
                  />
                  <StatCard
                    title="리뷰 수"
                    value={stats?.totalReviews || 0}
                    suffix="건"
                    icon={Star}
                    color="pink"
                  />
                  <StatCard
                    title="쿠폰 사용"
                    value={stats?.couponsUsed || 0}
                    suffix="건"
                    icon={Ticket}
                    color="cyan"
                  />
                </div>

                {/* RFM 점수 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">RFM 분석</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <RFMScoreCard label="Recency" score={rfm?.scores.r || 0} description={`${rfm?.recency || 0}일 전`} />
                      <RFMScoreCard label="Frequency" score={rfm?.scores.f || 0} description={`${rfm?.frequency || 0}회`} />
                      <RFMScoreCard label="Monetary" score={rfm?.scores.m || 0} description={formatCurrency(rfm?.monetary || 0)} />
                    </div>
                  </div>

                  {/* LTV */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">예상 LTV</h3>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(ltv?.value || 0)}
                      </p>
                      <p className="text-sm text-slate-500 mt-2">신뢰도: {((ltv?.confidence || 0) * 100).toFixed(0)}%</p>
                      <p className="text-xs text-slate-400 mt-1">{ltv?.basis}</p>
                    </div>
                  </div>
                </div>

                {/* 탭 */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="flex">
                      {[
                        { id: 'overview', label: '개요', icon: User },
                        { id: 'orders', label: '주문 이력', icon: Package },
                        { id: 'reviews', label: '리뷰', icon: Star },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <Icon icon={tab.icon} size="sm" />
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-6">
                    {/* 주문 이력 탭 */}
                    {activeTab === 'orders' && (
                      <div className="space-y-3">
                        {orders && orders.length > 0 ? (
                          orders.map((order) => (
                            <div key={order.orderId} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <Icon icon={Package} size="md" className="text-blue-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                                  {order.productName || order.orderId}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {order.artistName} · {new Date(order.orderDate).toLocaleDateString('ko-KR')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                  {formatCurrency(order.totalAmount)}
                                </p>
                                <p className="text-xs text-slate-500">{order.status}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <EmptyState message="주문 이력이 없습니다." />
                        )}
                      </div>
                    )}

                    {/* 리뷰 탭 */}
                    {activeTab === 'reviews' && (
                      <div className="space-y-3">
                        {reviews && reviews.length > 0 ? (
                          reviews.map((review) => (
                            <div key={review.reviewId} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                  {review.productName}
                                </p>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Icon
                                      key={i}
                                      icon={Star}
                                      size="xs"
                                      className={i < review.rating ? 'text-amber-400' : 'text-slate-300'}
                                    />
                                  ))}
                                </div>
                              </div>
                              {review.content && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                  {review.content}
                                </p>
                              )}
                              <p className="text-xs text-slate-400 mt-2">
                                {review.artistName} · {new Date(review.date).toLocaleDateString('ko-KR')}
                              </p>
                            </div>
                          ))
                        ) : (
                          <EmptyState message="리뷰가 없습니다." />
                        )}
                      </div>
                    )}

                    {/* 개요 탭 */}
                    {activeTab === 'overview' && (
                      <div className="text-center py-8 text-slate-500">
                        <Icon icon={User} size="xl" className="mx-auto mb-4 opacity-50" />
                        <p>고객 프로필 및 통계를 확인하세요.</p>
                      </div>
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
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon icon={Search} size="xl" className="text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
              고객을 검색하세요
            </h3>
            <p className="text-sm text-slate-500">
              이메일 또는 이름으로 검색하여 고객의 360° 뷰를 확인할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// 서브 컴포넌트
// ============================================================

function StatCard({
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
  color: 'blue' | 'emerald' | 'violet' | 'amber' | 'pink' | 'cyan'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500',
    violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-500',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-500',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-500',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-500',
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colorClasses[color]}`}>
        <Icon icon={IconComponent} size="sm" />
      </div>
      <p className="text-xs text-slate-500 mb-1">{title}</p>
      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
        {value}{suffix && <span className="text-sm font-normal text-slate-500 ml-1">{suffix}</span>}
      </p>
    </div>
  )
}

function RFMScoreCard({
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
    <div className="text-center">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      <div className="flex justify-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${i <= score ? getScoreColor(score) : 'bg-slate-200 dark:bg-slate-700'}`}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{score}/5</p>
      <p className="text-xs text-slate-400 mt-1">{description}</p>
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

