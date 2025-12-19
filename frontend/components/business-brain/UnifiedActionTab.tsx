'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { Tooltip } from '@/components/ui/Tooltip'
import { 
  Zap, Play, Pause, CheckCircle, Clock, AlertTriangle,
  ArrowRight, Filter, Download, RefreshCw, Target,
  TrendingUp, DollarSign, Users, ChevronDown, Copy, FileDown,
  Eye, ExternalLink, X
} from 'lucide-react'

// 서브탭 타입
type ActionSubTab = 'recommended' | 'in-progress' | 'completed' | 'simulation'

// 액션 상태
type ActionStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled'

// 액션 타입
interface Action {
  id: string
  title: string
  description: string
  category: 'revenue' | 'customer' | 'artist' | 'operations'
  priority: 'high' | 'medium' | 'low'
  status: ActionStatus
  expectedImpact: string
  effort: 'low' | 'medium' | 'high'
  dueDate?: string
  progress?: number
  metrics?: { label: string; value: string }[]
  targetIds?: string[]  // 대상 고객/작가/상품 ID 목록
  targetType?: 'customer' | 'artist' | 'product'  // 대상 타입
}

// 카테고리 설정
const categoryConfig = {
  revenue: { icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  customer: { icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  artist: { icon: Target, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  operations: { icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' }
}

// 상태 설정
const statusConfig = {
  pending: { label: '대기', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  'in-progress': { label: '진행 중', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' },
  completed: { label: '완료', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' },
  cancelled: { label: '취소', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' }
}

// 우선순위 설정
const priorityConfig = {
  high: { label: '긴급', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' },
  medium: { label: '중요', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' },
  low: { label: '일반', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' }
}

// 노력도 설정
const effortConfig = {
  low: { label: '쉬움', color: 'text-emerald-600' },
  medium: { label: '보통', color: 'text-amber-600' },
  high: { label: '어려움', color: 'text-red-600' }
}

// 서브탭 버튼 컴포넌트
function SubTabButton({ 
  active, 
  onClick, 
  icon, 
  label,
  count
}: { 
  active: boolean
  onClick: () => void
  icon: any
  label: string
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-200
        ${active 
          ? 'bg-idus-500 text-white shadow-md' 
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
        }
      `}
    >
      <Icon icon={icon} size="sm" />
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <Badge className={active ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'}>
          {count}
        </Badge>
      )}
    </button>
  )
}

// 액션 카드 컴포넌트
function ActionCard({ 
  action, 
  onStart, 
  onComplete,
  onCancel,
  onViewTargets,
  onDownloadTargets
}: { 
  action: Action
  onStart?: () => void
  onComplete?: () => void
  onCancel?: () => void
  onViewTargets?: (action: Action) => void
  onDownloadTargets?: (action: Action) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const category = categoryConfig[action.category]
  const status = statusConfig[action.status]
  const priority = priorityConfig[action.priority]
  const effort = effortConfig[action.effort]

  const handleCopyIds = useCallback(async () => {
    if (action.targetIds && action.targetIds.length > 0) {
      try {
        await navigator.clipboard.writeText(action.targetIds.join('\n'))
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (err) {
        console.error('복사 실패:', err)
      }
    }
  }, [action.targetIds])

  const handleDownloadCsv = useCallback(() => {
    if (action.targetIds && action.targetIds.length > 0) {
      const targetTypeLabel = action.targetType === 'customer' ? '고객' : 
                              action.targetType === 'artist' ? '작가' : '상품'
      const header = `${targetTypeLabel}_ID`
      const csvContent = [header, ...action.targetIds].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${action.id}_${targetTypeLabel}_목록_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    }
    onDownloadTargets?.(action)
  }, [action, onDownloadTargets])
  
  return (
    <Card className="overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <div 
        className="p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${category.bg} flex items-center justify-center`}>
            <Icon icon={category.icon} size="lg" className={category.color} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                {action.title}
              </h4>
              <Badge className={priority.color}>{priority.label}</Badge>
              <Badge className={status.color}>{status.label}</Badge>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {action.description}
            </p>
            
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="text-slate-500">
                예상 효과: <span className="font-medium text-slate-700 dark:text-slate-300">{action.expectedImpact}</span>
              </span>
              <span className={`font-medium ${effort.color}`}>
                난이도: {effort.label}
              </span>
            </div>
          </div>
          
          <Icon 
            icon={ChevronDown} 
            size="sm" 
            className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
        
        {/* 진행률 표시 (진행 중인 경우) */}
        {action.status === 'in-progress' && action.progress !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">진행률</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{action.progress}%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-idus-500 rounded-full transition-all duration-500"
                style={{ width: `${action.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* 확장된 상세 정보 */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          {/* 관련 지표 */}
          {action.metrics && action.metrics.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 uppercase mb-2">관련 지표</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {action.metrics.map((metric, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-idus-300 dark:hover:border-idus-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewTargets?.(action)
                    }}
                  >
                    <p className="text-xs text-slate-500 mb-1">{metric.label}</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{metric.value}</p>
                    {action.targetIds && action.targetIds.length > 0 && metric.label.includes('대상') && (
                      <p className="text-xs text-idus-500 mt-1 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        클릭하여 ID 확인
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 대상 ID 관리 (targetIds가 있는 경우) */}
          {action.targetIds && action.targetIds.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    대상 {action.targetType === 'customer' ? '고객' : action.targetType === 'artist' ? '작가' : '상품'} ID 
                    <Badge className="ml-2 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                      {action.targetIds.length}개
                    </Badge>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip content={copySuccess ? '복사 완료!' : 'ID 목록 복사'}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopyIds(); }}
                      className={`p-2 rounded-lg transition-colors ${
                        copySuccess 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700'
                      }`}
                    >
                      {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </Tooltip>
                  <Tooltip content="CSV 다운로드">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownloadCsv(); }}
                      className="p-2 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>
              {/* ID 미리보기 */}
              <div className="max-h-24 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {action.targetIds.slice(0, 10).map((id, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 bg-white dark:bg-slate-800 rounded text-xs font-mono text-slate-700 dark:text-slate-300 border border-blue-200 dark:border-blue-700"
                    >
                      {id}
                    </span>
                  ))}
                  {action.targetIds.length > 10 && (
                    <span className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400">
                      +{action.targetIds.length - 10}개 더...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* 마감일 */}
          {action.dueDate && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Icon icon={Clock} size="sm" className="text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                마감일: <span className="font-medium">{action.dueDate}</span>
              </span>
            </div>
          )}
          
          {/* 액션 버튼 */}
          <div className="flex items-center gap-2 flex-wrap">
            {action.status === 'pending' && onStart && (
              <button 
                onClick={(e) => { e.stopPropagation(); onStart(); }}
                className="flex items-center gap-2 px-4 py-2 bg-idus-500 text-white rounded-lg hover:bg-idus-600 transition-colors text-sm font-medium"
              >
                <Icon icon={Play} size="xs" />
                실행 시작
              </button>
            )}
            {action.status === 'in-progress' && onComplete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onComplete(); }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
              >
                <Icon icon={CheckCircle} size="xs" />
                완료 처리
              </button>
            )}
            {action.status === 'in-progress' && (
              <button 
                onClick={(e) => { e.stopPropagation(); /* 일시 정지 로직 */ }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors text-sm font-medium"
              >
                <Icon icon={Pause} size="xs" />
                일시 정지
              </button>
            )}
            {(action.status === 'pending' || action.status === 'in-progress') && onCancel && (
              <button 
                onClick={(e) => { e.stopPropagation(); onCancel(); }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
              >
                <Icon icon={X} size="xs" />
                취소
              </button>
            )}
            {action.status === 'completed' && (
              <span className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                완료됨
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

// What-if 시뮬레이션 미니 카드
function SimulationCard({ 
  title, 
  description, 
  onClick 
}: { 
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <Card 
      onClick={onClick}
      className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md hover:border-idus-300 dark:hover:border-idus-700 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Icon icon={TrendingUp} size="md" className="text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{title}</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
        <Icon icon={ArrowRight} size="sm" className="text-slate-400" />
      </div>
    </Card>
  )
}

// 메인 통합 액션 탭 컴포넌트
interface UnifiedActionTabProps {
  actionsData: any
  isLoading: boolean
  period: string
  onActionStart?: (actionId: string) => void
  onActionComplete?: (actionId: string) => void
  onActionCancel?: (actionId: string) => void
  onSimulationClick?: () => void
}

export function UnifiedActionTab({
  actionsData,
  isLoading,
  onActionStart,
  onActionComplete,
  onActionCancel,
  onSimulationClick
}: UnifiedActionTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<ActionSubTab>('recommended')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // 액션 데이터 처리 - 다양한 데이터 구조 지원
  const actions = useMemo(() => {
    const rawActions = actionsData?.actions || 
                       actionsData?.data?.actions ||
                       actionsData?.recommendations || 
                       actionsData?.data?.recommendations ||
                       actionsData?.proposals ||
                       []
    
    if (!Array.isArray(rawActions) || rawActions.length === 0) {
      // 기본 더미 데이터 제공 - 실제 환경에서는 API에서 targetIds 포함 데이터를 받아야 함
      return [
        {
          id: 'action-1',
          title: 'VIP 고객 재활성화 캠페인',
          description: '30일 이상 미구매 VIP 고객에게 맞춤 혜택을 제공하여 재구매를 유도합니다.',
          category: 'customer' as const,
          priority: 'high' as const,
          status: 'pending' as const,
          expectedImpact: '매출 15% 증가 예상',
          effort: 'medium' as const,
          dueDate: '2024-01-15',
          metrics: [{ label: '대상 고객', value: '142명' }, { label: '예상 ROI', value: '320%' }],
          targetType: 'customer' as const,
          targetIds: ['VIP-001', 'VIP-002', 'VIP-003', 'VIP-004', 'VIP-005'] // 예시 ID
        },
        {
          id: 'action-2',
          title: '이탈 위험 고객 리텐션',
          description: '이탈 위험 점수가 70% 이상인 고객에게 리텐션 쿠폰을 발송합니다.',
          category: 'customer' as const,
          priority: 'high' as const,
          status: 'pending' as const,
          expectedImpact: '이탈률 25% 감소 예상',
          effort: 'low' as const,
          metrics: [{ label: '대상 고객', value: '89명' }, { label: '예상 절감', value: '$8,500' }],
          targetType: 'customer' as const,
          targetIds: ['RISK-001', 'RISK-002', 'RISK-003'] // 예시 ID
        },
        {
          id: 'action-3',
          title: '상위 작가 협업 강화',
          description: '매출 상위 20% 작가와 독점 프로모션을 기획합니다.',
          category: 'artist' as const,
          priority: 'medium' as const,
          status: 'pending' as const,
          expectedImpact: '작가 매출 20% 증가 예상',
          effort: 'high' as const,
          targetType: 'artist' as const,
          targetIds: ['ARTIST-001', 'ARTIST-002', 'ARTIST-003', 'ARTIST-004', 'ARTIST-005', 'ARTIST-006', 'ARTIST-007', 'ARTIST-008', 'ARTIST-009', 'ARTIST-010', 'ARTIST-011', 'ARTIST-012'] // 예시 ID
        }
      ] as Action[]
    }
    
    return rawActions.map((action: any, idx: number) => ({
      id: action.id || action.actionId || `action-${idx}`,
      title: action.title || action.action || action.name || '액션',
      description: action.description || action.details || action.detail || '',
      category: action.category || action.type || 'operations',
      priority: action.priority || action.urgency || 'medium',
      status: action.status || 'pending',
      expectedImpact: action.expectedImpact || action.impact || action.effect || '분석 중',
      effort: action.effort || action.difficulty || 'medium',
      dueDate: action.dueDate || action.deadline,
      progress: action.progress || action.completion,
      metrics: action.metrics || action.kpis
    })) as Action[]
  }, [actionsData])

  // 필터링된 액션
  const filteredActions = useMemo(() => {
    let filtered = actions

    // 상태 필터
    switch (activeSubTab) {
      case 'recommended':
        filtered = filtered.filter(a => a.status === 'pending')
        break
      case 'in-progress':
        filtered = filtered.filter(a => a.status === 'in-progress')
        break
      case 'completed':
        filtered = filtered.filter(a => a.status === 'completed')
        break
    }

    // 카테고리 필터
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(a => a.category === categoryFilter)
    }

    // 우선순위 순 정렬
    return filtered.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [actions, activeSubTab, categoryFilter])

  // 카운트
  const counts = useMemo(() => ({
    recommended: actions.filter(a => a.status === 'pending').length,
    inProgress: actions.filter(a => a.status === 'in-progress').length,
    completed: actions.filter(a => a.status === 'completed').length
  }), [actions])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 서브탭 네비게이션 */}
      <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <SubTabButton
              active={activeSubTab === 'recommended'}
              onClick={() => setActiveSubTab('recommended')}
              icon={Zap}
              label="권장 액션"
              count={counts.recommended}
            />
            <SubTabButton
              active={activeSubTab === 'in-progress'}
              onClick={() => setActiveSubTab('in-progress')}
              icon={Play}
              label="진행 중"
              count={counts.inProgress}
            />
            <SubTabButton
              active={activeSubTab === 'completed'}
              onClick={() => setActiveSubTab('completed')}
              icon={CheckCircle}
              label="완료"
              count={counts.completed}
            />
            <SubTabButton
              active={activeSubTab === 'simulation'}
              onClick={() => setActiveSubTab('simulation')}
              icon={TrendingUp}
              label="What-if 시뮬레이션"
            />
          </div>
          
          {activeSubTab !== 'simulation' && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-slate-700 dark:text-slate-300"
            >
              <option value="all">전체 카테고리</option>
              <option value="revenue">매출</option>
              <option value="customer">고객</option>
              <option value="artist">작가</option>
              <option value="operations">운영</option>
            </select>
          )}
        </div>
      </Card>

      {/* 요약 (권장 액션 탭에서만) */}
      {activeSubTab === 'recommended' && counts.recommended > 0 && (
        <Card className="p-4 bg-idus-50 dark:bg-idus-900/20 border border-idus-200 dark:border-idus-800">
          <div className="flex items-center gap-3">
            <Icon icon={Zap} size="md" className="text-idus-600 dark:text-idus-400" />
            <p className="text-sm text-idus-700 dark:text-idus-300">
              <strong>{counts.recommended}개</strong>의 권장 액션이 있습니다. 
              우선순위가 높은 액션부터 실행하면 최대 효과를 얻을 수 있습니다.
            </p>
          </div>
        </Card>
      )}

      {/* 액션 목록 */}
      {activeSubTab !== 'simulation' && (
        <div className="space-y-4">
          {filteredActions.length > 0 ? (
            filteredActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onStart={onActionStart ? () => onActionStart(action.id) : undefined}
                onComplete={onActionComplete ? () => onActionComplete(action.id) : undefined}
                onCancel={onActionCancel ? () => onActionCancel(action.id) : undefined}
                onViewTargets={(act) => {
                  // 대상 ID 목록 모달 표시 - 카드 내 ID 섹션이 이미 표시됨
                  if (act.targetIds && act.targetIds.length > 0) {
                    alert(`${act.targetType === 'customer' ? '고객' : act.targetType === 'artist' ? '작가' : '상품'} ID 목록:\n${act.targetIds.slice(0, 20).join('\n')}${act.targetIds.length > 20 ? `\n... 외 ${act.targetIds.length - 20}개` : ''}`)
                  }
                }}
                onDownloadTargets={(act) => {
                  // CSV 다운로드는 ActionCard 내부에서 처리됨
                }}
              />
            ))
          ) : (
            <Card className="p-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <Icon icon={CheckCircle} size="xl" className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">
                  {activeSubTab === 'recommended' && '현재 권장 액션이 없습니다.'}
                  {activeSubTab === 'in-progress' && '진행 중인 액션이 없습니다.'}
                  {activeSubTab === 'completed' && '완료된 액션이 없습니다.'}
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* What-if 시뮬레이션 */}
      {activeSubTab === 'simulation' && (
        <div className="space-y-4">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Icon icon={TrendingUp} size="xl" className="text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  What-if 시뮬레이션
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                  다양한 시나리오를 시뮬레이션하여 비즈니스 의사결정에 도움을 받으세요.
                  가격 변경, 마케팅 예산 조정 등의 영향을 미리 예측할 수 있습니다.
                </p>
                <button 
                  onClick={onSimulationClick}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  시뮬레이션 시작
                  <Icon icon={ArrowRight} size="xs" />
                </button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SimulationCard
              title="가격 변경 시뮬레이션"
              description="상품 가격 변경이 매출과 주문량에 미치는 영향 분석"
              onClick={() => onSimulationClick?.()}
            />
            <SimulationCard
              title="마케팅 예산 시뮬레이션"
              description="마케팅 예산 조정에 따른 신규 고객 획득 예측"
              onClick={() => onSimulationClick?.()}
            />
            <SimulationCard
              title="할인 캠페인 시뮬레이션"
              description="할인율별 매출 및 수익 변화 예측"
              onClick={() => onSimulationClick?.()}
            />
            <SimulationCard
              title="재고 관리 시뮬레이션"
              description="재고 수준 변경에 따른 비용 및 판매 영향 분석"
              onClick={() => onSimulationClick?.()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default UnifiedActionTab

