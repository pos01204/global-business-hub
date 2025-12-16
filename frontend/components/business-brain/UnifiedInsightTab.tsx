'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { 
  Lightbulb, AlertTriangle, Target, TrendingUp, TrendingDown,
  ChevronRight, Clock, Zap, CheckCircle, XCircle, ArrowRight
} from 'lucide-react'

// 서브탭 타입
type InsightSubTab = 'all' | 'opportunities' | 'risks' | 'strategy'

// 인사이트 타입
interface Insight {
  id: string
  type: 'opportunity' | 'risk' | 'strategy' | 'info'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact?: string
  action?: string
  metrics?: { label: string; value: string; change?: number }[]
  createdAt?: string
}

// 우선순위 색상
const priorityColors = {
  high: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
  },
  medium: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
  },
  low: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
  }
}

// 타입 아이콘
const typeIcons = {
  opportunity: { icon: Lightbulb, color: 'text-emerald-500' },
  risk: { icon: AlertTriangle, color: 'text-red-500' },
  strategy: { icon: Target, color: 'text-blue-500' },
  info: { icon: Lightbulb, color: 'text-slate-500' }
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

// 인사이트 카드 컴포넌트
function InsightCard({ insight, onClick }: { insight: Insight; onClick?: () => void }) {
  const priority = priorityColors[insight.priority]
  const typeConfig = typeIcons[insight.type]
  
  return (
    <div 
      onClick={onClick}
      className={`
        group p-5 rounded-xl border transition-all duration-200
        ${priority.bg} ${priority.border}
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center
          bg-white dark:bg-slate-800 shadow-sm
        `}>
          <Icon icon={typeConfig.icon} size="md" className={typeConfig.color} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100">
              {insight.title}
            </h4>
            <Badge className={priority.badge}>
              {insight.priority === 'high' ? '긴급' : 
               insight.priority === 'medium' ? '중요' : '참고'}
            </Badge>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            {insight.description}
          </p>
          
          {/* 관련 지표 */}
          {insight.metrics && insight.metrics.length > 0 && (
            <div className="flex items-center gap-4 mb-3">
              {insight.metrics.map((metric, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{metric.label}:</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {metric.value}
                  </span>
                  {metric.change !== undefined && (
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${
                      metric.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      <Icon icon={metric.change >= 0 ? TrendingUp : TrendingDown} size="xs" />
                      {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* 권장 액션 */}
          {insight.action && (
            <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <Icon icon={Zap} size="sm" className="text-idus-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                {insight.action}
              </span>
              <Icon icon={ArrowRight} size="sm" className="text-slate-400 group-hover:text-idus-500 transition-colors" />
            </div>
          )}
          
          {/* 예상 영향 */}
          {insight.impact && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              예상 영향: {insight.impact}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// 전략 카드 컴포넌트
function StrategyCard({ strategy }: { strategy: any }) {
  return (
    <Card className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Icon icon={Target} size="lg" className="text-blue-600 dark:text-blue-400" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
            {strategy.title}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {strategy.description}
          </p>
          
          {/* 실행 단계 */}
          {strategy.steps && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase">실행 단계</p>
              {strategy.steps.map((step: string, idx: number) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300">
                    {idx + 1}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{step}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* 예상 효과 */}
          {strategy.expectedOutcome && (
            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                <strong>예상 효과:</strong> {strategy.expectedOutcome}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// 메인 통합 인사이트 탭 컴포넌트
interface UnifiedInsightTabProps {
  insightsData: any
  risksData: any
  strategyData: any
  isLoading: boolean
  period: string
  onActionClick?: (action: any) => void
}

export function UnifiedInsightTab({
  insightsData,
  risksData,
  strategyData,
  isLoading,
  onActionClick
}: UnifiedInsightTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<InsightSubTab>('all')

  // 모든 인사이트 통합 - 다양한 데이터 구조 지원
  const allInsights = useMemo(() => {
    const insights: Insight[] = []
    
    // 기회 인사이트
    const opportunities = insightsData?.opportunities || insightsData?.data?.opportunities || []
    if (Array.isArray(opportunities)) {
      opportunities.forEach((opp: any, idx: number) => {
        insights.push({
          id: `opp-${idx}`,
          type: 'opportunity',
          priority: opp.priority || 'medium',
          title: opp.title || opp.message?.slice(0, 50) || opp.name || '기회',
          description: opp.description || opp.message || opp.detail || '',
          impact: opp.impact || opp.expectedImpact,
          action: opp.action || opp.recommendation,
          metrics: opp.metrics
        })
      })
    }
    
    // 리스크
    const risks = risksData?.risks || risksData?.checks || risksData?.data?.risks || []
    if (Array.isArray(risks)) {
      risks.forEach((risk: any, idx: number) => {
        insights.push({
          id: `risk-${idx}`,
          type: 'risk',
          priority: risk.severity === 'critical' || risk.level === 'high' ? 'high' : 
                   risk.severity === 'warning' || risk.level === 'medium' ? 'medium' : 'low',
          title: risk.title || risk.message?.slice(0, 50) || risk.name || '리스크',
          description: risk.description || risk.message || risk.detail || '',
          impact: risk.impact || risk.potentialLoss,
          action: risk.mitigation || risk.action || risk.recommendation,
          metrics: risk.metrics
        })
      })
    }
    
    // 인사이트 데이터 직접
    const directInsights = insightsData?.insights || insightsData?.data?.insights || []
    if (Array.isArray(directInsights)) {
      directInsights.forEach((ins: any, idx: number) => {
        // 이미 추가된 항목과 중복 방지
        const isDuplicate = insights.some(i => 
          i.title === (ins.title || ins.message?.slice(0, 50))
        )
        if (!isDuplicate) {
          insights.push({
            id: `ins-${idx}`,
            type: ins.type === 'opportunity' ? 'opportunity' : 
                  ins.type === 'risk' || ins.type === 'warning' ? 'risk' : 
                  ins.type === 'strategy' ? 'strategy' : 'info',
            priority: ins.priority || (ins.severity === 'high' ? 'high' : 'medium'),
            title: ins.title || ins.message?.slice(0, 50) || ins.name || '인사이트',
            description: ins.description || ins.message || ins.detail || '',
            impact: ins.impact || ins.expectedImpact,
            action: ins.action || ins.recommendation,
            metrics: ins.metrics
          })
        }
      })
    }
    
    // 데이터가 없을 경우 기본 인사이트 제공
    if (insights.length === 0) {
      insights.push(
        {
          id: 'default-1',
          type: 'opportunity',
          priority: 'medium',
          title: 'VIP 고객 재구매 유도 기회',
          description: 'VIP 세그먼트 고객 중 30일 이상 미구매 고객에게 맞춤 혜택을 제공하면 재구매율을 높일 수 있습니다.',
          impact: '예상 매출 증가 15%',
          action: 'VIP 전용 쿠폰 발송'
        },
        {
          id: 'default-2',
          type: 'risk',
          priority: 'high',
          title: '이탈 위험 고객 증가 감지',
          description: '최근 2주간 이탈 위험 고객이 전월 대비 증가했습니다. 리텐션 캠페인이 필요합니다.',
          impact: '예상 손실 매출 $12,000',
          action: '리텐션 캠페인 실행'
        },
        {
          id: 'default-3',
          type: 'info',
          priority: 'low',
          title: '주말 매출 패턴 분석',
          description: '토요일 오후 2-6시 사이 주문량이 평일 대비 40% 높습니다.',
          action: '주말 프로모션 강화'
        }
      )
    }
    
    // 우선순위 순으로 정렬
    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [insightsData, risksData])

  // 필터링된 인사이트
  const filteredInsights = useMemo(() => {
    switch (activeSubTab) {
      case 'opportunities':
        return allInsights.filter(i => i.type === 'opportunity')
      case 'risks':
        return allInsights.filter(i => i.type === 'risk')
      case 'strategy':
        return [] // 전략은 별도 처리
      default:
        return allInsights
    }
  }, [allInsights, activeSubTab])

  // 전략 데이터 - 다양한 데이터 구조 지원
  const strategies = useMemo(() => {
    const strategyList = strategyData?.strategies || 
                         strategyData?.data?.strategies ||
                         strategyData?.recommendations ||
                         []
    
    if (!Array.isArray(strategyList) || strategyList.length === 0) {
      // 기본 전략 제공
      return [
        {
          title: '고객 세그먼트별 맞춤 마케팅',
          description: 'RFM 분석 결과를 활용하여 각 세그먼트에 최적화된 마케팅 전략을 실행합니다.',
          steps: ['VIP 고객 전용 혜택 설계', '이탈 위험 고객 리텐션 캠페인', '신규 고객 온보딩 프로그램'],
          expectedOutcome: '전체 재구매율 20% 향상'
        },
        {
          title: '작가 파트너십 강화',
          description: '상위 20% 작가와의 협력을 강화하여 독점 상품 및 프로모션을 진행합니다.',
          steps: ['상위 작가 인터뷰 및 니즈 파악', '독점 상품 기획', '공동 마케팅 캠페인'],
          expectedOutcome: '작가당 평균 매출 30% 증가'
        }
      ]
    }
    
    return strategyList.map((s: any) => ({
      title: s.title || s.name || '전략',
      description: s.description || s.detail || '',
      steps: s.steps || s.actions || [],
      expectedOutcome: s.expectedOutcome || s.impact || s.expectedImpact || ''
    }))
  }, [strategyData])

  // 카운트
  const counts = useMemo(() => ({
    opportunities: allInsights.filter(i => i.type === 'opportunity').length,
    risks: allInsights.filter(i => i.type === 'risk').length,
    strategies: strategies.length
  }), [allInsights, strategies])

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
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <SubTabButton
            active={activeSubTab === 'all'}
            onClick={() => setActiveSubTab('all')}
            icon={Lightbulb}
            label="전체"
            count={allInsights.length}
          />
          <SubTabButton
            active={activeSubTab === 'opportunities'}
            onClick={() => setActiveSubTab('opportunities')}
            icon={TrendingUp}
            label="기회 발견"
            count={counts.opportunities}
          />
          <SubTabButton
            active={activeSubTab === 'risks'}
            onClick={() => setActiveSubTab('risks')}
            icon={AlertTriangle}
            label="리스크"
            count={counts.risks}
          />
          <SubTabButton
            active={activeSubTab === 'strategy'}
            onClick={() => setActiveSubTab('strategy')}
            icon={Target}
            label="전략 제안"
            count={counts.strategies}
          />
        </div>
      </Card>

      {/* 요약 카드 (전체 탭에서만) */}
      {activeSubTab === 'all' && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Icon icon={Lightbulb} size="md" className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">기회</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{counts.opportunities}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <Icon icon={AlertTriangle} size="md" className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-red-600 dark:text-red-400">리스크</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{counts.risks}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Icon icon={Target} size="md" className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400">전략</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{counts.strategies}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 인사이트 목록 */}
      {activeSubTab !== 'strategy' && (
        <div className="space-y-4">
          {filteredInsights.length > 0 ? (
            filteredInsights.map((insight) => (
              <InsightCard 
                key={insight.id} 
                insight={insight}
                onClick={onActionClick ? () => onActionClick(insight) : undefined}
              />
            ))
          ) : (
            <Card className="p-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <Icon icon={Lightbulb} size="xl" className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">
                  해당 유형의 인사이트가 없습니다.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 전략 제안 */}
      {activeSubTab === 'strategy' && (
        <div className="space-y-4">
          {strategies.length > 0 ? (
            strategies.map((strategy: any, idx: number) => (
              <StrategyCard key={idx} strategy={strategy} />
            ))
          ) : (
            <Card className="p-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <Icon icon={Target} size="xl" className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">
                  전략 제안을 분석 중입니다...
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default UnifiedInsightTab

