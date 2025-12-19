'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { businessBrainApi } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { 
  Brain, Bell, RefreshCw, Settings, ChevronRight,
  AlertTriangle, TrendingUp, Target, Zap, MessageCircle
} from 'lucide-react'
import { BusinessIQScoreCard, BusinessIQScoreData } from './BusinessIQScoreCard'
import { DailyBriefingPanel, DailyBriefingData } from './DailyBriefingPanel'
import { TriggerRuleManager, TriggerRule } from './TriggerRuleManager'

interface UnifiedCommandCenterProps {
  period: '7d' | '30d' | '90d' | '180d' | '365d'
  onPeriodChange?: (period: '7d' | '30d' | '90d' | '180d' | '365d') => void
}

export function UnifiedCommandCenter({ period, onPeriodChange }: UnifiedCommandCenterProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'alerts' | 'triggers' | 'chat'>('overview')
  const queryClient = useQueryClient()

  // IQ 스코어 조회
  const { data: iqScoreData, isLoading: iqLoading, refetch: refetchIQ } = useQuery({
    queryKey: ['business-brain', 'iq-score', period],
    queryFn: () => businessBrainApi.getIQScore(period),
    staleTime: 10 * 60 * 1000, // 10분
  })

  // 일일 브리핑 조회
  const { data: briefingData, isLoading: briefingLoading, refetch: refetchBriefing } = useQuery({
    queryKey: ['business-brain', 'daily-briefing'],
    queryFn: () => businessBrainApi.getDailyBriefing(),
    staleTime: 10 * 60 * 1000,
  })

  // 알림 조회
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['business-brain', 'alerts'],
    queryFn: () => businessBrainApi.getAlerts(),
    staleTime: 5 * 60 * 1000,
  })

  // 트리거 규칙 조회
  const { data: triggersData, isLoading: triggersLoading } = useQuery({
    queryKey: ['business-brain', 'triggers'],
    queryFn: () => businessBrainApi.getTriggers(),
    staleTime: 10 * 60 * 1000,
  })

  // 트리거 생성
  const createTriggerMutation = useMutation({
    mutationFn: businessBrainApi.createTrigger,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-brain', 'triggers'] })
    }
  })

  // 트리거 수정
  const updateTriggerMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TriggerRule> }) => 
      businessBrainApi.updateTrigger(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-brain', 'triggers'] })
    }
  })

  // 트리거 삭제
  const deleteTriggerMutation = useMutation({
    mutationFn: businessBrainApi.deleteTrigger,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-brain', 'triggers'] })
    }
  })

  // 알림 확인
  const acknowledgeAlertMutation = useMutation({
    mutationFn: businessBrainApi.acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-brain', 'alerts'] })
    }
  })

  const handleRefresh = () => {
    refetchIQ()
    refetchBriefing()
    refetchAlerts()
  }

  const activeAlertCount = alertsData?.data?.totalActive || 0

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              커맨드 센터
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              비즈니스 인텔리전스 통합 관제
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 기간 선택 */}
          <select
            value={period}
            onChange={(e) => onPeriodChange?.(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm"
          >
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
            <option value="90d">최근 90일</option>
            <option value="180d">최근 180일</option>
            <option value="365d">최근 1년</option>
          </select>
          
          {/* 알림 버튼 */}
          <button
            onClick={() => setActiveSection('alerts')}
            className={`relative p-2 rounded-lg transition-colors ${
              activeSection === 'alerts' 
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-5 h-5" />
            {activeAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeAlertCount}
              </span>
            )}
          </button>
          
          {/* 새로고침 */}
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* 섹션 탭 */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        {[
          { id: 'overview', label: '개요', icon: Target },
          { id: 'alerts', label: '알림', icon: Bell, count: activeAlertCount },
          { id: 'triggers', label: '트리거 설정', icon: Settings },
          { id: 'chat', label: 'AI 질의', icon: MessageCircle },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeSection === section.id
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <section.icon className="w-4 h-4" />
            <span>{section.label}</span>
            {section.count !== undefined && section.count > 0 && (
              <Badge variant="danger" size="sm">{section.count}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* 개요 섹션 */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* IQ 스코어 (왼쪽) */}
          <div className="lg:col-span-1">
            {iqLoading ? (
              <Card className="p-6 flex items-center justify-center h-96">
                <Spinner size="lg" />
              </Card>
            ) : iqScoreData?.data ? (
              <BusinessIQScoreCard 
                data={iqScoreData.data as BusinessIQScoreData}
                onDetailClick={() => {
                  // Business Brain 홈 탭의 고객/작가/매출 분석으로 이동
                  window.location.href = '/business-brain?tab=customer'
                }}
              />
            ) : (
              <Card className="p-6">
                <p className="text-slate-500 text-center">IQ 스코어를 불러올 수 없습니다.</p>
              </Card>
            )}
          </div>

          {/* 일일 브리핑 (오른쪽) */}
          <div className="lg:col-span-2">
            {briefingLoading ? (
              <Card className="p-6 flex items-center justify-center h-96">
                <Spinner size="lg" />
              </Card>
            ) : briefingData?.data ? (
              <DailyBriefingPanel 
                data={briefingData.data as DailyBriefingData}
                onRefresh={refetchBriefing}
                onAlertClick={(alert) => {
                  setActiveSection('alerts')
                }}
              />
            ) : (
              <Card className="p-6">
                <p className="text-slate-500 text-center">브리핑을 불러올 수 없습니다.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 알림 섹션 */}
      {activeSection === 'alerts' && (
        <div className="space-y-6">
          {/* 활성 알림 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              활성 알림 ({activeAlertCount})
            </h3>
            
            {alertsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : alertsData?.data?.activeAlerts?.length > 0 ? (
              <div className="space-y-3">
                {alertsData.data.activeAlerts.map((alert: any) => (
                  <div 
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.severity === 'critical' 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500' 
                        : alert.severity === 'warning'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-slate-100">
                          {alert.title}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span>지표: {alert.metric}</span>
                          <span>현재값: {alert.currentValue}</span>
                          <span>임계값: {alert.threshold}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                        className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-sm transition-colors"
                      >
                        확인
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>현재 활성 알림이 없습니다.</p>
              </div>
            )}
          </Card>

          {/* 알림 이력 */}
          {alertsData?.data?.alertHistory?.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                최근 알림 이력
              </h3>
              <div className="space-y-2">
                {alertsData.data.alertHistory.slice(0, 10).map((alert: any) => (
                  <div 
                    key={alert.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={alert.severity === 'critical' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {alert.severity}
                      </Badge>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {alert.title}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(alert.triggeredAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 트리거 설정 섹션 */}
      {activeSection === 'triggers' && (
        <TriggerRuleManager
          rules={triggersData?.data || []}
          isLoading={triggersLoading}
          onRuleCreate={(rule) => createTriggerMutation.mutate(rule as any)}
          onRuleUpdate={(id, updates) => updateTriggerMutation.mutate({ id, updates })}
          onRuleDelete={(id) => deleteTriggerMutation.mutate(id)}
          onRuleToggle={(id, enabled) => updateTriggerMutation.mutate({ id, updates: { enabled } })}
        />
      )}

      {/* AI 질의 섹션 */}
      {activeSection === 'chat' && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                AI 비즈니스 어시스턴트
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                비즈니스 데이터에 대해 자연어로 질문하세요.
              </p>
            </div>
            
            {/* 빠른 질문 예시 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { q: '이번 달 GMV 현황은?', icon: '📊' },
                { q: 'VIP 고객 중 이탈 위험은?', icon: '⚠️' },
                { q: '상위 작가 매출 기여도는?', icon: '🎨' },
                { q: '전월 대비 주문 변화는?', icon: '📈' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    // AI 질의 페이지로 이동 (플로팅 채팅 활성화)
                    const chatButton = document.querySelector('[data-ai-chat-toggle]') as HTMLButtonElement
                    if (chatButton) chatButton.click()
                  }}
                  className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{item.q}</span>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400 text-center">
                💡 우측 하단의 "AI에게 질문" 버튼을 클릭하여 대화를 시작하세요.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default UnifiedCommandCenter

