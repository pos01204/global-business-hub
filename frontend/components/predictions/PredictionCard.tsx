'use client'

import { ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Info, HelpCircle, ArrowRight, Lightbulb
} from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/formatters'

// ============================================================
// 타입 정의
// ============================================================

interface PredictionCardProps {
  title: string
  description?: string
  value: number | string
  confidence?: number
  trend?: 'up' | 'down' | 'stable'
  trendValue?: number
  status?: 'success' | 'warning' | 'danger' | 'info'
  icon?: ReactNode
  children?: ReactNode
  onClick?: () => void
  className?: string
}

interface ChurnPredictionCardProps {
  customerId: string
  customerEmail?: string
  riskScore: number
  riskLevel: 'high' | 'medium' | 'low'
  topFactors: Array<{
    factor: string
    importance: number
    value: string
  }>
  explanation?: string
  onAction?: () => void
}

interface GmvForecastCardProps {
  date: string
  predictedGmv: number
  lowerBound: number
  upperBound: number
  confidence: number
  trend?: 'up' | 'down' | 'stable'
}

interface LtvPredictionCardProps {
  customerId: string
  predictedLtv: number
  confidence: number
  segment: string
  recommendation?: string
}

// ============================================================
// 기본 예측 카드
// ============================================================

export function PredictionCard({
  title,
  description,
  value,
  confidence,
  trend,
  trendValue,
  status = 'info',
  icon,
  children,
  onClick,
  className = '',
}: PredictionCardProps) {
  const statusColors = {
    success: 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20',
    warning: 'border-amber-200 bg-amber-50 dark:bg-amber-900/20',
    danger: 'border-red-200 bg-red-50 dark:bg-red-900/20',
    info: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20',
  }

  const statusIconColors = {
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
    info: 'text-blue-500',
  }

  const trendIcons = {
    up: <Icon icon={TrendingUp} size="sm" className="text-emerald-500" />,
    down: <Icon icon={TrendingDown} size="sm" className="text-red-500" />,
    stable: <span className="text-slate-400">→</span>,
  }

  return (
    <Card
      className={`p-4 border ${statusColors[status]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && <span className={statusIconColors[status]}>{icon}</span>}
          <div>
            <h4 className="font-medium text-slate-800 dark:text-slate-100">{title}</h4>
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {confidence !== undefined && (
          <Tooltip content={`예측 신뢰도: ${(confidence * 100).toFixed(0)}%`}>
            <Badge color={confidence >= 0.8 ? 'green' : confidence >= 0.6 ? 'yellow' : 'red'}>
              {(confidence * 100).toFixed(0)}%
            </Badge>
          </Tooltip>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
          {trend && trendValue !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {trendIcons[trend]}
              <span className={`text-xs ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'}`}>
                {trend === 'up' ? '+' : ''}{trendValue.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        {onClick && (
          <Icon icon={ArrowRight} size="sm" className="text-slate-400" />
        )}
      </div>

      {children && <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">{children}</div>}
    </Card>
  )
}

// ============================================================
// 이탈 예측 카드
// ============================================================

export function ChurnPredictionCard({
  customerId,
  customerEmail,
  riskScore,
  riskLevel,
  topFactors,
  explanation,
  onAction,
}: ChurnPredictionCardProps) {
  const riskColors = {
    high: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200', text: 'text-red-600', badge: 'red' as const },
    medium: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200', text: 'text-amber-600', badge: 'yellow' as const },
    low: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200', text: 'text-emerald-600', badge: 'green' as const },
  }

  const colors = riskColors[riskLevel]

  return (
    <Card className={`p-4 border ${colors.border} ${colors.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon icon={AlertTriangle} size="md" className={colors.text} />
            <h4 className="font-medium text-slate-800 dark:text-slate-100">이탈 위험</h4>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {customerEmail || customerId}
          </p>
        </div>
        <Badge color={colors.badge}>
          {riskLevel === 'high' ? '고위험' : riskLevel === 'medium' ? '중위험' : '저위험'}
        </Badge>
      </div>

      {/* 위험 점수 게이지 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-600 dark:text-slate-400">이탈 확률</span>
          <span className={`font-bold ${colors.text}`}>{(riskScore * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              riskLevel === 'high' ? 'bg-red-500' :
              riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${riskScore * 100}%` }}
          />
        </div>
      </div>

      {/* 주요 요인 */}
      {topFactors.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">주요 이탈 요인</p>
          <div className="space-y-2">
            {topFactors.slice(0, 3).map((factor, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">{factor.factor}</span>
                <span className="text-slate-500">{factor.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 설명 */}
      {explanation && (
        <div className="p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg mb-3">
          <div className="flex items-start gap-2">
            <Icon icon={Lightbulb} size="sm" className="text-amber-500 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-400">{explanation}</p>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      {onAction && (
        <button
          onClick={onAction}
          className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          리텐션 액션 실행
        </button>
      )}
    </Card>
  )
}

// ============================================================
// GMV 예측 카드
// ============================================================

export function GmvForecastCard({
  date,
  predictedGmv,
  lowerBound,
  upperBound,
  confidence,
  trend,
}: GmvForecastCardProps) {
  return (
    <Card className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-slate-800 dark:text-slate-100">GMV 예측</h4>
          <p className="text-xs text-slate-500">{date}</p>
        </div>
        <Badge color={confidence >= 0.8 ? 'green' : confidence >= 0.6 ? 'yellow' : 'red'}>
          신뢰도 {(confidence * 100).toFixed(0)}%
        </Badge>
      </div>

      <div className="mb-3">
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {formatCurrency(predictedGmv)}
        </p>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {trend === 'up' ? (
              <Icon icon={TrendingUp} size="sm" className="text-emerald-500" />
            ) : trend === 'down' ? (
              <Icon icon={TrendingDown} size="sm" className="text-red-500" />
            ) : null}
          </div>
        )}
      </div>

      {/* 신뢰 구간 */}
      <div className="p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
        <p className="text-xs text-slate-500 mb-1">예측 범위 (95% 신뢰구간)</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            {formatCurrency(lowerBound)}
          </span>
          <span className="text-slate-400">~</span>
          <span className="text-slate-600 dark:text-slate-400">
            {formatCurrency(upperBound)}
          </span>
        </div>
      </div>
    </Card>
  )
}

// ============================================================
// LTV 예측 카드
// ============================================================

export function LtvPredictionCard({
  customerId,
  predictedLtv,
  confidence,
  segment,
  recommendation,
}: LtvPredictionCardProps) {
  return (
    <Card className="p-4 border border-violet-200 bg-violet-50 dark:bg-violet-900/20">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-slate-800 dark:text-slate-100">LTV 예측</h4>
          <p className="text-xs text-slate-500">{customerId}</p>
        </div>
        <Badge color="purple">{segment}</Badge>
      </div>

      <div className="mb-3">
        <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
          {formatCurrency(predictedLtv)}
        </p>
        <p className="text-xs text-slate-500 mt-1">향후 12개월 예상 가치</p>
      </div>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-slate-600 dark:text-slate-400">예측 신뢰도</span>
        <span className="font-medium text-slate-800 dark:text-slate-100">
          {(confidence * 100).toFixed(0)}%
        </span>
      </div>

      {recommendation && (
        <div className="p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
          <div className="flex items-start gap-2">
            <Icon icon={Lightbulb} size="sm" className="text-amber-500 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-400">{recommendation}</p>
          </div>
        </div>
      )}
    </Card>
  )
}

// ============================================================
// 모델 상태 카드
// ============================================================

interface ModelStatusCardProps {
  modelName: string
  modelType: string
  status: 'active' | 'training' | 'placeholder' | 'error'
  lastTrained?: string
  accuracy?: number
  description?: string
}

export function ModelStatusCard({
  modelName,
  modelType,
  status,
  lastTrained,
  accuracy,
  description,
}: ModelStatusCardProps) {
  const statusConfig = {
    active: { color: 'green', label: '활성', icon: CheckCircle },
    training: { color: 'yellow', label: '학습 중', icon: Info },
    placeholder: { color: 'gray', label: '준비 중', icon: HelpCircle },
    error: { color: 'red', label: '오류', icon: AlertTriangle },
  }

  const config = statusConfig[status]

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-slate-800 dark:text-slate-100">{modelName}</h4>
          <p className="text-xs text-slate-500">{modelType}</p>
        </div>
        <Badge color={config.color as any}>
          <Icon icon={config.icon} size="xs" className="mr-1" />
          {config.label}
        </Badge>
      </div>

      {description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{description}</p>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        {lastTrained && (
          <div>
            <p className="text-slate-500">마지막 학습</p>
            <p className="font-medium text-slate-700 dark:text-slate-300">{lastTrained}</p>
          </div>
        )}
        {accuracy !== undefined && (
          <div>
            <p className="text-slate-500">정확도</p>
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {(accuracy * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {status === 'placeholder' && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            ⚠️ 이 모델은 현재 placeholder 상태입니다. 실제 ML 모델은 향후 구현 예정입니다.
          </p>
        </div>
      )}
    </Card>
  )
}

// ============================================================
// 자동화 규칙 카드
// ============================================================

interface AutomationRuleCardProps {
  ruleName: string
  ruleType: string
  triggerConditions: Record<string, any>
  actionType: string
  isEnabled: boolean
  executionCount: number
  onToggle?: () => void
}

export function AutomationRuleCard({
  ruleName,
  ruleType,
  triggerConditions,
  actionType,
  isEnabled,
  executionCount,
  onToggle,
}: AutomationRuleCardProps) {
  return (
    <Card className={`p-4 ${isEnabled ? 'border-emerald-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-slate-800 dark:text-slate-100">{ruleName}</h4>
          <p className="text-xs text-slate-500">{ruleType}</p>
        </div>
        <button
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <p className="text-slate-500">트리거 조건</p>
          <p className="text-slate-700 dark:text-slate-300">
            {triggerConditions.metric} {triggerConditions.operator} {triggerConditions.threshold}
          </p>
        </div>
        <div>
          <p className="text-slate-500">실행 액션</p>
          <p className="text-slate-700 dark:text-slate-300">{actionType}</p>
        </div>
        <div>
          <p className="text-slate-500">실행 횟수</p>
          <p className="text-slate-700 dark:text-slate-300">{executionCount}회</p>
        </div>
      </div>

      {!isEnabled && (
        <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-500">
            ⚠️ 이 규칙은 비활성화 상태입니다. 실제 실행은 활성화 후 가능합니다.
          </p>
        </div>
      )}
    </Card>
  )
}

