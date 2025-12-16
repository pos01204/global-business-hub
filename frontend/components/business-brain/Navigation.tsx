/**
 * Navigation - Business Brain 네비게이션
 * 3-뷰 구조 네비게이션 (Command Center, Deep Dive, Action Hub)
 */

'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { 
  LayoutDashboard, Search, Zap, ChevronRight,
  TrendingUp, Users, BarChart3, Target, Bell,
  Settings, HelpCircle, Moon, Sun
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ViewType = 'command-center' | 'deep-dive' | 'action-hub'

interface NavigationProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  alertCount?: number
  actionCount?: number
  className?: string
}

// 메인 뷰 정의
const mainViews = [
  {
    id: 'command-center' as ViewType,
    label: 'Command Center',
    description: '핵심 지표 & 알림',
    icon: LayoutDashboard,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'deep-dive' as ViewType,
    label: 'Deep Dive',
    description: '심층 분석 & 탐색',
    icon: Search,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'action-hub' as ViewType,
    label: 'Action Hub',
    description: '권장 조치 & 실행',
    icon: Zap,
    color: 'from-orange-500 to-amber-500',
  },
]

// 빠른 링크
const quickLinks = [
  { id: 'trends', label: '트렌드', icon: TrendingUp },
  { id: 'customers', label: '고객', icon: Users },
  { id: 'analytics', label: '분석', icon: BarChart3 },
  { id: 'forecast', label: '예측', icon: Target },
]

export function Navigation({
  currentView,
  onViewChange,
  alertCount = 0,
  actionCount = 0,
  className = '',
}: NavigationProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)

  return (
    <nav className={cn(
      'flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all',
      isExpanded ? 'w-64' : 'w-20',
      className
    )}>
      {/* 헤더 */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl">🧠</span>
          </div>
          {isExpanded && (
            <div>
              <h1 className="font-bold text-slate-800 dark:text-slate-100">Business Brain</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI 경영 인텔리전스</p>
            </div>
          )}
        </div>
      </div>

      {/* 메인 뷰 네비게이션 */}
      <div className="p-3 space-y-2">
        {isExpanded && (
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
            뷰
          </p>
        )}
        
        {mainViews.map(view => {
          const isActive = currentView === view.id
          const ViewIcon = view.icon
          
          return (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
                isActive
                  ? `bg-gradient-to-r ${view.color} text-white shadow-lg`
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                isActive 
                  ? 'bg-white/20' 
                  : 'bg-slate-100 dark:bg-slate-800'
              )}>
                <Icon icon={ViewIcon} size="md" />
              </div>
              
              {isExpanded && (
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{view.label}</span>
                    {view.id === 'command-center' && alertCount > 0 && (
                      <Badge variant="danger" className="ml-2">
                        {alertCount}
                      </Badge>
                    )}
                    {view.id === 'action-hub' && actionCount > 0 && (
                      <Badge variant="warning" className="ml-2">
                        {actionCount}
                      </Badge>
                    )}
                  </div>
                  <p className={cn(
                    'text-xs',
                    isActive ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                  )}>
                    {view.description}
                  </p>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* 구분선 */}
      <div className="mx-4 border-t border-slate-200 dark:border-slate-800" />

      {/* 빠른 링크 */}
      {isExpanded && (
        <div className="p-3 space-y-1">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
            빠른 분석
          </p>
          
          {quickLinks.map(link => (
            <button
              key={link.id}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <Icon icon={link.icon} size="sm" />
              <span className="text-sm">{link.label}</span>
              <Icon icon={ChevronRight} size="sm" className="ml-auto text-slate-400" />
            </button>
          ))}
        </div>
      )}

      {/* 스페이서 */}
      <div className="flex-1" />

      {/* 하단 메뉴 */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
        {/* 알림 */}
        <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
          <div className="relative">
            <Icon icon={Bell} size="sm" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </div>
          {isExpanded && <span className="text-sm">알림</span>}
        </button>

        {/* 다크모드 토글 */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <Icon icon={isDarkMode ? Sun : Moon} size="sm" />
          {isExpanded && <span className="text-sm">{isDarkMode ? '라이트 모드' : '다크 모드'}</span>}
        </button>

        {/* 설정 */}
        <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
          <Icon icon={Settings} size="sm" />
          {isExpanded && <span className="text-sm">설정</span>}
        </button>

        {/* 도움말 */}
        <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
          <Icon icon={HelpCircle} size="sm" />
          {isExpanded && <span className="text-sm">도움말</span>}
        </button>
      </div>

      {/* 확장/축소 버튼 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="m-3 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <Icon 
          icon={ChevronRight} 
          size="sm" 
          className={cn('transition-transform', isExpanded ? 'rotate-180' : '')} 
        />
      </button>
    </nav>
  )
}

// 탭 기반 네비게이션 (모바일/간소화 버전)
export function NavigationTabs({
  currentView,
  onViewChange,
  alertCount = 0,
  actionCount = 0,
  className = '',
}: NavigationProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm',
      className
    )}>
      {mainViews.map(view => {
        const isActive = currentView === view.id
        const ViewIcon = view.icon

        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
              isActive
                ? `bg-gradient-to-r ${view.color} text-white shadow-md`
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            )}
          >
            <Icon icon={ViewIcon} size="sm" />
            <span className="font-medium text-sm">{view.label}</span>
            {view.id === 'command-center' && alertCount > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs font-bold rounded-full',
                isActive ? 'bg-white/20' : 'bg-red-500 text-white'
              )}>
                {alertCount}
              </span>
            )}
            {view.id === 'action-hub' && actionCount > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs font-bold rounded-full',
                isActive ? 'bg-white/20' : 'bg-amber-500 text-white'
              )}>
                {actionCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default Navigation

