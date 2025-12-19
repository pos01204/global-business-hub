'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tooltip } from '@/components/ui/Tooltip'
import { 
  RefreshCw, AlertTriangle, TrendingUp, TrendingDown, 
  Target, Calendar, ChevronDown, ChevronUp, ExternalLink,
  Bell, CheckCircle, XCircle
} from 'lucide-react'
import { formatKRW } from '@/lib/formatters'

export interface DailyBriefingData {
  date: string
  headline: string
  keyHighlights: Array<{
    type: 'positive' | 'negative' | 'neutral'
    icon: string
    title: string
    detail: string
    metric?: { value: number; change: number }
  }>
  urgentAlerts: Array<{
    severity: 'critical' | 'warning'
    message: string
    metric: string
    action: string
  }>
  todaysFocus: Array<{
    priority: number
    task: string
    reason: string
    expectedImpact: string
  }>
  weatherForecast: {
    overall: 'sunny' | 'cloudy' | 'rainy' | 'stormy'
    confidence: number
    factors: string[]
  }
}

interface DailyBriefingPanelProps {
  data: DailyBriefingData
  isLoading?: boolean
  onRefresh?: () => void
  onAlertClick?: (alert: DailyBriefingData['urgentAlerts'][0]) => void
}

const weatherIcons: Record<string, string> = {
  sunny: '☀️',
  cloudy: '⛅',
  rainy: '🌧️',
  stormy: '⛈️'
}

const weatherLabels: Record<string, string> = {
  sunny: '맑음',
  cloudy: '흐림',
  rainy: '비',
  stormy: '폭풍'
}

const weatherColors: Record<string, { bg: string; text: string }> = {
  sunny: { bg: 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20', text: 'text-emerald-800 dark:text-emerald-200' },
  cloudy: { bg: 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20', text: 'text-amber-800 dark:text-amber-200' },
  rainy: { bg: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20', text: 'text-blue-800 dark:text-blue-200' },
  stormy: { bg: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20', text: 'text-red-800 dark:text-red-200' }
}

export function DailyBriefingPanel({
  data,
  isLoading = false,
  onRefresh,
  onAlertClick
}: DailyBriefingPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    highlights: true,
    alerts: true,
    focus: true
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl mb-6" />
        <div className="space-y-4">
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </Card>
    )
  }

  const weatherStyle = weatherColors[data.weatherForecast.overall] || weatherColors.cloudy

  return (
    <Card className="overflow-hidden">
      {/* 헤드라인 배너 */}
      <div className={`p-6 ${weatherStyle.bg}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{weatherIcons[data.weatherForecast.overall]}</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(data.date).toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })} 브리핑
                </span>
              </div>
              <h2 className={`text-xl font-bold ${weatherStyle.text}`}>
                {data.headline}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant={data.weatherForecast.overall === 'sunny' ? 'success' : 
                          data.weatherForecast.overall === 'stormy' ? 'danger' : 
                          'warning'}
                  size="sm"
                >
                  비즈니스 날씨: {weatherLabels[data.weatherForecast.overall]}
                </Badge>
                <Tooltip content={`신뢰도: ${Math.round(data.weatherForecast.confidence * 100)}%`}>
                  <span className="text-xs text-slate-500 cursor-help">
                    ({Math.round(data.weatherForecast.confidence * 100)}%)
                  </span>
                </Tooltip>
              </div>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
              title="새로고침"
            >
              <RefreshCw className="w-5 h-5 text-slate-500" />
            </button>
          )}
        </div>
        
        {/* 날씨 요인 */}
        <div className="flex flex-wrap gap-2 mt-4">
          {data.weatherForecast.factors.map((factor, idx) => (
            <span 
              key={idx}
              className="px-2 py-1 bg-white/50 dark:bg-slate-800/50 rounded text-xs text-slate-600 dark:text-slate-400"
            >
              {factor}
            </span>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 긴급 알림 */}
        {data.urgentAlerts.length > 0 && (
          <div>
            <button 
              onClick={() => toggleSection('alerts')}
              className="flex items-center justify-between w-full mb-3"
            >
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                긴급 알림 ({data.urgentAlerts.length})
              </h3>
              {expandedSections.alerts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {expandedSections.alerts && (
              <div className="space-y-2">
                {data.urgentAlerts.map((alert, idx) => (
                  <div 
                    key={idx}
                    onClick={() => onAlertClick?.(alert)}
                    className={`p-4 rounded-lg border-l-4 cursor-pointer transition-colors ${
                      alert.severity === 'critical' 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500 hover:bg-red-100 dark:hover:bg-red-900/30' 
                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                        alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'
                      }`} />
                      <div className="flex-1">
                        <p className={`font-medium ${
                          alert.severity === 'critical' 
                            ? 'text-red-800 dark:text-red-200' 
                            : 'text-amber-800 dark:text-amber-200'
                        }`}>
                          {alert.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-500">{alert.metric}</span>
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            {alert.action}
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 핵심 하이라이트 */}
        <div>
          <button 
            onClick={() => toggleSection('highlights')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              핵심 하이라이트
            </h3>
            {expandedSections.highlights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {expandedSections.highlights && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.keyHighlights.map((highlight, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    highlight.type === 'positive' 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                      : highlight.type === 'negative'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{highlight.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium truncate ${
                        highlight.type === 'positive' 
                          ? 'text-emerald-800 dark:text-emerald-200' 
                          : highlight.type === 'negative'
                          ? 'text-red-800 dark:text-red-200'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {highlight.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {highlight.detail}
                      </p>
                      {highlight.metric && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            {typeof highlight.metric.value === 'number' && highlight.metric.value > 1000
                              ? formatKRW(highlight.metric.value)
                              : highlight.metric.value}
                          </span>
                          <span className={`text-sm flex items-center gap-1 ${
                            highlight.metric.change > 0 ? 'text-emerald-600' : 
                            highlight.metric.change < 0 ? 'text-red-600' : 
                            'text-slate-500'
                          }`}>
                            {highlight.metric.change > 0 ? <TrendingUp className="w-3 h-3" /> : 
                             highlight.metric.change < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                            {highlight.metric.change > 0 ? '+' : ''}{highlight.metric.change}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 오늘의 집중 과제 */}
        <div>
          <button 
            onClick={() => toggleSection('focus')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Target className="w-4 h-4" />
              오늘의 집중 과제
            </h3>
            {expandedSections.focus ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {expandedSections.focus && (
            <div className="space-y-3">
              {data.todaysFocus.map((task, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    task.priority === 1 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                      : task.priority === 2
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}>
                    <span className="font-bold text-sm">{task.priority}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800 dark:text-slate-100">
                      {task.task}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {task.reason}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" size="sm">
                        예상 효과: {task.expectedImpact}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors" title="완료">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </button>
                    <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="건너뛰기">
                      <XCircle className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default DailyBriefingPanel

