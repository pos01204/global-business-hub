/**
 * AnalysisLoading - 분석 로딩 상태 컴포넌트
 * Business Brain 분석 중 표시되는 로딩 UI
 */

'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface AnalysisLoadingProps {
  type?: 'default' | 'brain' | 'chart' | 'data' | 'ai'
  message?: string
  subMessage?: string
  progress?: number
  showSteps?: boolean
  steps?: Array<{ label: string; completed: boolean; current: boolean }>
  className?: string
}

// 분석 단계 기본값
const defaultSteps = [
  { label: '데이터 수집', completed: false, current: true },
  { label: '패턴 분석', completed: false, current: false },
  { label: '인사이트 생성', completed: false, current: false },
  { label: '결과 정리', completed: false, current: false },
]

// 타입별 아이콘/애니메이션
const typeConfig = {
  default: {
    icon: '📊',
    gradient: 'from-indigo-500 to-purple-500',
    bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
  },
  brain: {
    icon: '🧠',
    gradient: 'from-violet-500 to-pink-500',
    bgGradient: 'from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20',
  },
  chart: {
    icon: '📈',
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
  },
  data: {
    icon: '🔍',
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
  },
  ai: {
    icon: '🤖',
    gradient: 'from-orange-500 to-amber-500',
    bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
  },
}

// 로딩 메시지 (랜덤)
const loadingMessages = [
  '데이터를 분석하고 있습니다...',
  '패턴을 찾고 있습니다...',
  '인사이트를 생성하고 있습니다...',
  'AI가 열심히 일하고 있습니다...',
  '최적의 결과를 계산 중입니다...',
]

export function AnalysisLoading({
  type = 'default',
  message,
  subMessage,
  progress,
  showSteps = false,
  steps = defaultSteps,
  className,
}: AnalysisLoadingProps) {
  const [currentMessage, setCurrentMessage] = useState(message || loadingMessages[0])
  const [dots, setDots] = useState('')

  const config = typeConfig[type]

  // 메시지 순환 (메시지가 제공되지 않은 경우)
  useEffect(() => {
    if (message) return

    const messageInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * loadingMessages.length)
      setCurrentMessage(loadingMessages[randomIndex])
    }, 3000)

    return () => clearInterval(messageInterval)
  }, [message])

  // 점 애니메이션
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => clearInterval(dotsInterval)
  }, [])

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6',
      `bg-gradient-to-br ${config.bgGradient}`,
      'rounded-xl',
      className
    )}>
      {/* 메인 로딩 애니메이션 */}
      <div className="relative mb-6">
        {/* 외부 링 */}
        <div className={cn(
          'w-24 h-24 rounded-full',
          'border-4 border-slate-200 dark:border-slate-700',
          'animate-spin-slow'
        )}>
          <div className={cn(
            'absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-3 h-3 rounded-full',
            `bg-gradient-to-r ${config.gradient}`
          )} />
        </div>

        {/* 중간 링 */}
        <div className={cn(
          'absolute inset-2',
          'w-20 h-20 rounded-full',
          'border-4 border-transparent',
          `border-t-gradient-to-r ${config.gradient}`,
          'animate-spin'
        )} style={{
          borderTopColor: type === 'brain' ? '#8B5CF6' :
                          type === 'chart' ? '#10B981' :
                          type === 'data' ? '#3B82F6' :
                          type === 'ai' ? '#F97316' : '#6366F1'
        }} />

        {/* 아이콘 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl animate-pulse">{config.icon}</span>
        </div>

        {/* 파티클 효과 */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'absolute w-2 h-2 rounded-full',
                `bg-gradient-to-r ${config.gradient}`,
                'animate-ping'
              )}
              style={{
                top: `${50 + 40 * Math.sin((i * Math.PI * 2) / 6)}%`,
                left: `${50 + 40 * Math.cos((i * Math.PI * 2) / 6)}%`,
                animationDelay: `${i * 0.2}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      </div>

      {/* 메시지 */}
      <div className="text-center mb-4">
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
          {currentMessage}{dots}
        </p>
        {subMessage && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {subMessage}
          </p>
        )}
      </div>

      {/* 진행률 바 */}
      {progress !== undefined && (
        <div className="w-64 mb-4">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>진행률</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                `bg-gradient-to-r ${config.gradient}`
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 단계 표시 */}
      {showSteps && (
        <div className="flex items-center gap-2 mt-4">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                step.completed
                  ? `bg-gradient-to-r ${config.gradient} text-white`
                  : step.current
                    ? 'bg-white dark:bg-slate-800 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              )}>
                {step.completed ? '✓' : idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div className={cn(
                  'w-8 h-0.5 mx-1',
                  step.completed
                    ? `bg-gradient-to-r ${config.gradient}`
                    : 'bg-slate-200 dark:bg-slate-700'
                )} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* 단계 라벨 */}
      {showSteps && (
        <div className="mt-3">
          {steps.find(s => s.current) && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {steps.find(s => s.current)?.label}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// 스켈레톤 로딩 변형
export function AnalysisSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

// 차트 스켈레톤
export function ChartSkeleton({ height = 300, className }: { height?: number; className?: string }) {
  return (
    <div className={cn('animate-pulse', className)} style={{ height }}>
      <div className="h-full bg-slate-200 dark:bg-slate-700 rounded-lg flex items-end justify-around p-4">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-300 dark:bg-slate-600 rounded-t"
            style={{
              width: '10%',
              height: `${30 + Math.random() * 50}%`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default AnalysisLoading

