'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Plus, Edit2, Trash2, Bell, BellOff, AlertTriangle, 
  AlertCircle, Info, ChevronDown, ChevronUp, X, Check
} from 'lucide-react'

export interface TriggerRule {
  id: string
  name: string
  metric: string
  condition: {
    type: 'threshold' | 'change' | 'anomaly' | 'trend'
    operator: '>' | '<' | '>=' | '<=' | '==' | 'between'
    value: number | [number, number]
    period?: string
  }
  severity: 'critical' | 'warning' | 'info'
  actions: Array<{
    type: 'notification' | 'email' | 'slack' | 'auto-action'
    target: string
    message: string
  }>
  enabled: boolean
  lastTriggered?: string
}

interface TriggerRuleManagerProps {
  rules: TriggerRule[]
  onRuleCreate: (rule: Partial<TriggerRule>) => void
  onRuleUpdate: (id: string, updates: Partial<TriggerRule>) => void
  onRuleDelete: (id: string) => void
  onRuleToggle: (id: string, enabled: boolean) => void
  isLoading?: boolean
}

const severityConfig = {
  critical: { 
    icon: AlertTriangle, 
    color: 'text-red-500', 
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    label: '심각'
  },
  warning: { 
    icon: AlertCircle, 
    color: 'text-amber-500', 
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    label: '경고'
  },
  info: { 
    icon: Info, 
    color: 'text-blue-500', 
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    label: '정보'
  }
}

const operatorLabels: Record<string, string> = {
  '>': '초과',
  '<': '미만',
  '>=': '이상',
  '<=': '이하',
  '==': '같음',
  'between': '범위'
}

const conditionTypeLabels: Record<string, string> = {
  threshold: '임계값',
  change: '변화율',
  anomaly: '이상치',
  trend: '트렌드'
}

const metricLabels: Record<string, string> = {
  daily_gmv: '일일 GMV',
  daily_orders: '일일 주문수',
  delivery_delay_rate: '배송 지연율',
  churn_risk_count: '이탈 위험 고객수',
  nps_score: 'NPS 점수',
  aov: '평균 주문 금액'
}

export function TriggerRuleManager({
  rules,
  onRuleCreate,
  onRuleUpdate,
  onRuleDelete,
  onRuleToggle,
  isLoading = false
}: TriggerRuleManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newRule, setNewRule] = useState<Partial<TriggerRule>>({
    name: '',
    metric: 'daily_gmv',
    condition: { type: 'threshold', operator: '>', value: 0 },
    severity: 'warning',
    actions: [{ type: 'notification', target: 'all', message: '' }],
    enabled: true
  })

  const handleCreate = () => {
    if (newRule.name && newRule.metric) {
      onRuleCreate(newRule)
      setNewRule({
        name: '',
        metric: 'daily_gmv',
        condition: { type: 'threshold', operator: '>', value: 0 },
        severity: 'warning',
        actions: [{ type: 'notification', target: 'all', message: '' }],
        enabled: true
      })
      setIsCreating(false)
    }
  }

  const formatCondition = (condition: TriggerRule['condition']) => {
    const type = conditionTypeLabels[condition.type] || condition.type
    const operator = operatorLabels[condition.operator] || condition.operator
    const value = Array.isArray(condition.value) 
      ? `${condition.value[0]} ~ ${condition.value[1]}`
      : condition.value
    const period = condition.period ? ` (${condition.period})` : ''
    return `${type}: ${operator} ${value}${period}`
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            트리거 규칙 관리
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            비즈니스 이상 상황 자동 감지 규칙을 설정합니다.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 규칙
        </button>
      </div>

      {/* 새 규칙 생성 폼 */}
      {isCreating && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-800 dark:text-slate-100">새 트리거 규칙</h3>
            <button onClick={() => setIsCreating(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                규칙 이름
              </label>
              <input
                type="text"
                value={newRule.name || ''}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                placeholder="예: GMV 급락 경고"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                모니터링 지표
              </label>
              <select
                value={newRule.metric || 'daily_gmv'}
                onChange={(e) => setNewRule({ ...newRule, metric: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              >
                {Object.entries(metricLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                조건 유형
              </label>
              <select
                value={newRule.condition?.type || 'threshold'}
                onChange={(e) => setNewRule({ 
                  ...newRule, 
                  condition: { ...newRule.condition!, type: e.target.value as any }
                })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              >
                {Object.entries(conditionTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                연산자
              </label>
              <select
                value={newRule.condition?.operator || '>'}
                onChange={(e) => setNewRule({ 
                  ...newRule, 
                  condition: { ...newRule.condition!, operator: e.target.value as any }
                })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              >
                {Object.entries(operatorLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                임계값
              </label>
              <input
                type="number"
                value={typeof newRule.condition?.value === 'number' ? newRule.condition.value : 0}
                onChange={(e) => setNewRule({ 
                  ...newRule, 
                  condition: { ...newRule.condition!, value: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                심각도
              </label>
              <select
                value={newRule.severity || 'warning'}
                onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              >
                <option value="critical">심각</option>
                <option value="warning">경고</option>
                <option value="info">정보</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              알림 메시지
            </label>
            <input
              type="text"
              value={newRule.actions?.[0]?.message || ''}
              onChange={(e) => setNewRule({ 
                ...newRule, 
                actions: [{ type: 'notification', target: 'all', message: e.target.value }]
              })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              placeholder="트리거 발생 시 표시될 메시지"
            />
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              disabled={!newRule.name}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              생성
            </button>
          </div>
        </div>
      )}

      {/* 규칙 목록 */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>등록된 트리거 규칙이 없습니다.</p>
            <p className="text-sm mt-1">새 규칙을 추가하여 자동 알림을 설정하세요.</p>
          </div>
        ) : (
          rules.map((rule) => {
            const config = severityConfig[rule.severity]
            const Icon = config.icon
            const isExpanded = expandedId === rule.id
            
            return (
              <div 
                key={rule.id}
                className={`border rounded-xl overflow-hidden transition-all ${config.border} ${
                  rule.enabled ? config.bg : 'bg-slate-100 dark:bg-slate-800 opacity-60'
                }`}
              >
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {rule.name}
                        </span>
                        <Badge 
                          variant={rule.severity === 'critical' ? 'danger' : rule.severity === 'warning' ? 'warning' : 'secondary'}
                          size="sm"
                        >
                          {config.label}
                        </Badge>
                        {!rule.enabled && (
                          <Badge variant="default" size="sm">비활성</Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {metricLabels[rule.metric] || rule.metric} • {formatCondition(rule.condition)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRuleToggle(rule.id, !rule.enabled)
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        rule.enabled 
                          ? 'hover:bg-slate-200 dark:hover:bg-slate-700' 
                          : 'hover:bg-slate-300 dark:hover:bg-slate-600'
                      }`}
                      title={rule.enabled ? '비활성화' : '활성화'}
                    >
                      {rule.enabled 
                        ? <Bell className="w-4 h-4 text-indigo-500" /> 
                        : <BellOff className="w-4 h-4 text-slate-400" />
                      }
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRuleDelete(rule.id)
                      }}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">조건:</span>
                        <span className="ml-2 text-slate-800 dark:text-slate-100">
                          {formatCondition(rule.condition)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">알림 대상:</span>
                        <span className="ml-2 text-slate-800 dark:text-slate-100">
                          {rule.actions[0]?.target || 'all'}
                        </span>
                      </div>
                      {rule.lastTriggered && (
                        <div className="col-span-2">
                          <span className="text-slate-500 dark:text-slate-400">마지막 트리거:</span>
                          <span className="ml-2 text-slate-800 dark:text-slate-100">
                            {new Date(rule.lastTriggered).toLocaleString('ko-KR')}
                          </span>
                        </div>
                      )}
                      {rule.actions[0]?.message && (
                        <div className="col-span-2">
                          <span className="text-slate-500 dark:text-slate-400">메시지:</span>
                          <span className="ml-2 text-slate-800 dark:text-slate-100">
                            {rule.actions[0].message}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}

export default TriggerRuleManager

