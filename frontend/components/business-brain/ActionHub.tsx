/**
 * ActionHub - 액션 허브
 * 권장 조치 및 실행 가능한 인사이트 관리
 */

'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { FadeIn } from '@/components/ui/animations'
import { 
  CheckCircle, Clock, AlertTriangle, Play, Pause,
  ChevronRight, Filter, Search, Zap, Target,
  TrendingUp, Users, DollarSign, ArrowRight
} from 'lucide-react'

interface Action {
  id: string
  title: string
  description: string
  category: 'revenue' | 'customer' | 'operations' | 'growth'
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
  expectedImpact: {
    metric: string
    value: string
    confidence: number
  }
  effort: 'low' | 'medium' | 'high'
  timeline: string
  assignee?: string
  dueDate?: string
  completedAt?: string
  relatedInsights?: string[]
}

interface ActionHubProps {
  actions?: Action[]
  isLoading?: boolean
  onActionStart?: (actionId: string) => void
  onActionComplete?: (actionId: string) => void
  onActionDismiss?: (actionId: string) => void
  className?: string
}

// 우선순위 스타일
const priorityStyles = {
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
    badge: 'bg-red-500',
  },
  high: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-700',
    badge: 'bg-orange-500',
  },
  medium: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    badge: 'bg-amber-500',
  },
  low: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    badge: 'bg-slate-500',
  },
}

// 카테고리 아이콘
const categoryIcons = {
  revenue: DollarSign,
  customer: Users,
  operations: Zap,
  growth: TrendingUp,
}

// 카테고리 색상
const categoryColors = {
  revenue: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
  customer: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
  operations: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
  growth: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
}

export function ActionHub({
  actions,
  isLoading,
  onActionStart,
  onActionComplete,
  onActionDismiss,
  className = '',
}: ActionHubProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedAction, setExpandedAction] = useState<string | null>(null)

  // 샘플 데이터
  const actionData = useMemo<Action[]>(() => {
    if (actions) return actions

    return [
      {
        id: '1',
        title: '이탈 위험 고객 리텐션 캠페인 실행',
        description: '28명의 고객이 이탈 위험 상태입니다. 개인화된 할인 쿠폰과 리마인더 이메일을 발송하여 재구매를 유도하세요.',
        category: 'customer',
        priority: 'critical',
        status: 'pending',
        expectedImpact: {
          metric: '이탈률',
          value: '-20%',
          confidence: 85,
        },
        effort: 'low',
        timeline: '이번 주',
        relatedInsights: ['고객 이탈 패턴 분석', 'RFM 세그먼트 분석'],
      },
      {
        id: '2',
        title: 'VIP 고객 전용 프로모션 기획',
        description: 'VIP 세그먼트의 재구매율이 지난 달 대비 5% 하락했습니다. 특별 혜택을 제공하여 충성도를 유지하세요.',
        category: 'customer',
        priority: 'high',
        status: 'in_progress',
        expectedImpact: {
          metric: 'VIP 재구매율',
          value: '+10%',
          confidence: 75,
        },
        effort: 'medium',
        timeline: '2주 내',
        assignee: '마케팅팀',
      },
      {
        id: '3',
        title: '주얼리 카테고리 작가 영입 확대',
        description: '핸드메이드 주얼리 검색량이 25% 증가했습니다. 신규 작가 영입으로 공급을 확대하세요.',
        category: 'growth',
        priority: 'high',
        status: 'pending',
        expectedImpact: {
          metric: '카테고리 매출',
          value: '+30%',
          confidence: 70,
        },
        effort: 'high',
        timeline: '1개월',
      },
      {
        id: '4',
        title: '배송 지연 프로세스 개선',
        description: '평균 배송 기간이 2일 증가했습니다. 물류 파트너와 협의하여 배송 효율을 개선하세요.',
        category: 'operations',
        priority: 'medium',
        status: 'pending',
        expectedImpact: {
          metric: '고객 만족도',
          value: '+15%',
          confidence: 80,
        },
        effort: 'medium',
        timeline: '3주 내',
      },
      {
        id: '5',
        title: '크로스셀링 추천 알고리즘 개선',
        description: '장바구니 평균 금액을 높이기 위해 관련 상품 추천을 강화하세요.',
        category: 'revenue',
        priority: 'medium',
        status: 'pending',
        expectedImpact: {
          metric: '평균 주문액',
          value: '+8%',
          confidence: 65,
        },
        effort: 'medium',
        timeline: '2주 내',
      },
      {
        id: '6',
        title: '신규 고객 온보딩 이메일 시리즈 최적화',
        description: '신규 고객의 첫 구매 전환율을 높이기 위한 이메일 시리즈를 개선하세요.',
        category: 'customer',
        priority: 'low',
        status: 'completed',
        expectedImpact: {
          metric: '신규 고객 전환율',
          value: '+12%',
          confidence: 72,
        },
        effort: 'low',
        timeline: '완료',
        completedAt: '2024-01-10',
      },
    ]
  }, [actions])

  // 필터링된 액션
  const filteredActions = useMemo(() => {
    return actionData.filter(action => {
      const matchesCategory = filterCategory === 'all' || action.category === filterCategory
      const matchesPriority = filterPriority === 'all' || action.priority === filterPriority
      const matchesStatus = filterStatus === 'all' || action.status === filterStatus
      const matchesSearch = !searchQuery || 
        action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesCategory && matchesPriority && matchesStatus && matchesSearch
    })
  }, [actionData, filterCategory, filterPriority, filterStatus, searchQuery])

  // 통계
  const stats = useMemo(() => ({
    total: actionData.length,
    pending: actionData.filter(a => a.status === 'pending').length,
    inProgress: actionData.filter(a => a.status === 'in_progress').length,
    completed: actionData.filter(a => a.status === 'completed').length,
    critical: actionData.filter(a => a.priority === 'critical' && a.status === 'pending').length,
  }), [actionData])

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">전체 액션</p>
        </Card>
        <Card className="p-4 text-center bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.pending}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400">대기 중</p>
        </Card>
        <Card className="p-4 text-center bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.inProgress}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">진행 중</p>
        </Card>
        <Card className="p-4 text-center bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.completed}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">완료</p>
        </Card>
        <Card className="p-4 text-center bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.critical}</p>
          <p className="text-xs text-red-600 dark:text-red-400">긴급</p>
        </Card>
      </div>

      {/* 필터 */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Icon icon={Filter} size="sm" className="text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400">필터:</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
          >
            <option value="all">모든 상태</option>
            <option value="pending">대기 중</option>
            <option value="in_progress">진행 중</option>
            <option value="completed">완료</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
          >
            <option value="all">모든 카테고리</option>
            <option value="revenue">매출</option>
            <option value="customer">고객</option>
            <option value="operations">운영</option>
            <option value="growth">성장</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
          >
            <option value="all">모든 우선순위</option>
            <option value="critical">긴급</option>
            <option value="high">높음</option>
            <option value="medium">보통</option>
            <option value="low">낮음</option>
          </select>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Icon icon={Search} size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="액션 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 액션 목록 */}
      <div className="space-y-4">
        {filteredActions.map((action, idx) => {
          const styles = priorityStyles[action.priority]
          const CategoryIcon = categoryIcons[action.category]
          const isExpanded = expandedAction === action.id

          return (
            <FadeIn key={action.id} delay={idx * 50}>
              <Card className={`overflow-hidden border-l-4 ${styles.border}`}>
                {/* 헤더 */}
                <div
                  className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  onClick={() => setExpandedAction(isExpanded ? null : action.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* 카테고리 아이콘 */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColors[action.category]}`}>
                      <Icon icon={CategoryIcon} size="md" />
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {action.title}
                        </h3>
                        <Badge variant={
                          action.priority === 'critical' ? 'danger' :
                          action.priority === 'high' ? 'warning' : 'default'
                        }>
                          {action.priority === 'critical' ? '긴급' :
                           action.priority === 'high' ? '높음' :
                           action.priority === 'medium' ? '보통' : '낮음'}
                        </Badge>
                        {action.status === 'in_progress' && (
                          <Badge variant="info">진행 중</Badge>
                        )}
                        {action.status === 'completed' && (
                          <Badge variant="success">완료</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {action.description}
                      </p>
                    </div>

                    {/* 예상 영향 */}
                    <div className="text-right hidden md:block">
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {action.expectedImpact.value}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {action.expectedImpact.metric}
                      </p>
                    </div>

                    {/* 확장 아이콘 */}
                    <Icon
                      icon={ChevronRight}
                      size="md"
                      className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>

                {/* 확장된 내용 */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800">
                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                      {/* 예상 영향 상세 */}
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">예상 영향</p>
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                          {action.expectedImpact.value}
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          {action.expectedImpact.metric}
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                          <div className="flex-1 h-1.5 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${action.expectedImpact.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">
                            {action.expectedImpact.confidence}%
                          </span>
                        </div>
                      </div>

                      {/* 노력도 */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">예상 노력</p>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                          {action.effort === 'low' ? '낮음' :
                           action.effort === 'medium' ? '보통' : '높음'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          타임라인: {action.timeline}
                        </p>
                      </div>

                      {/* 담당자 */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">담당</p>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                          {action.assignee || '미지정'}
                        </p>
                        {action.dueDate && (
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            기한: {action.dueDate}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 관련 인사이트 */}
                    {action.relatedInsights && action.relatedInsights.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">관련 인사이트</p>
                        <div className="flex flex-wrap gap-2">
                          {action.relatedInsights.map((insight, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full"
                            >
                              {insight}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 액션 버튼 */}
                    {action.status !== 'completed' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {action.status === 'pending' && (
                          <button
                            onClick={() => onActionStart?.(action.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                          >
                            <Icon icon={Play} size="sm" />
                            시작하기
                          </button>
                        )}
                        {action.status === 'in_progress' && (
                          <button
                            onClick={() => onActionComplete?.(action.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                          >
                            <Icon icon={CheckCircle} size="sm" />
                            완료 처리
                          </button>
                        )}
                        <button
                          onClick={() => onActionDismiss?.(action.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                        >
                          무시
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </FadeIn>
          )
        })}

        {filteredActions.length === 0 && (
          <Card className="p-12 text-center">
            <span className="text-4xl">✅</span>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              해당 조건의 액션이 없습니다.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ActionHub

