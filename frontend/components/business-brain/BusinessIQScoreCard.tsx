'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tooltip } from '@/components/ui/Tooltip'
import { TrendingUp, TrendingDown, Minus, Info, Target, Zap } from 'lucide-react'
import { EChartsRadar } from './charts'

export interface BusinessIQScoreData {
  score: number
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
  components: {
    dataMaturity: number
    analyticsDepth: number
    insightQuality: number
    actionConversion: number
    predictionAccuracy: number
  }
  trend: 'improving' | 'stable' | 'declining'
  change: number
  benchmarks: {
    industry: number
    topPerformers: number
  }
  improvements?: Array<{
    area: string
    currentScore: number
    targetScore: number
    actions: string[]
    expectedGain: number
  }>
}

interface BusinessIQScoreCardProps {
  data: BusinessIQScoreData
  isLoading?: boolean
  onDetailClick?: () => void
  compact?: boolean
}

const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: 'bg-gradient-to-r from-yellow-400 to-amber-500', text: 'text-white', border: 'border-yellow-400' },
  A: { bg: 'bg-gradient-to-r from-emerald-400 to-green-500', text: 'text-white', border: 'border-emerald-400' },
  B: { bg: 'bg-gradient-to-r from-blue-400 to-indigo-500', text: 'text-white', border: 'border-blue-400' },
  C: { bg: 'bg-gradient-to-r from-orange-400 to-amber-500', text: 'text-white', border: 'border-orange-400' },
  D: { bg: 'bg-gradient-to-r from-red-400 to-rose-500', text: 'text-white', border: 'border-red-400' },
  F: { bg: 'bg-gradient-to-r from-slate-400 to-gray-500', text: 'text-white', border: 'border-slate-400' },
}

const componentLabels: Record<string, string> = {
  dataMaturity: '데이터 성숙도',
  analyticsDepth: '분석 깊이',
  insightQuality: '인사이트 품질',
  actionConversion: '액션 전환율',
  predictionAccuracy: '예측 정확도',
}

export function BusinessIQScoreCard({ 
  data, 
  isLoading = false, 
  onDetailClick,
  compact = false 
}: BusinessIQScoreCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="flex items-center justify-center h-48">
          <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
      </Card>
    )
  }

  const gradeStyle = gradeColors[data.grade] || gradeColors.C
  
  // 레이더 차트 데이터 변환
  const radarIndicators = [
    { name: '데이터 성숙도', max: 100 },
    { name: '분석 깊이', max: 100 },
    { name: '인사이트 품질', max: 100 },
    { name: '액션 전환율', max: 100 },
    { name: '예측 정확도', max: 100 },
  ]
  
  const radarSeries = [
    {
      name: 'Business IQ',
      values: [
        data.components.dataMaturity,
        data.components.analyticsDepth,
        data.components.insightQuality,
        data.components.actionConversion,
        data.components.predictionAccuracy,
      ],
      color: '#6366f1'
    }
  ]

  if (compact) {
    return (
      <Card 
        className={`p-4 cursor-pointer hover:shadow-lg transition-shadow border-l-4 ${gradeStyle.border}`}
        onClick={onDetailClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full ${gradeStyle.bg} flex items-center justify-center shadow-lg`}>
              <span className="text-2xl font-bold text-white">{data.score}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  비즈니스 IQ
                </span>
                <span className={`px-2 py-0.5 rounded text-sm font-bold ${gradeStyle.bg} ${gradeStyle.text}`}>
                  {data.grade}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                {data.trend === 'improving' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                {data.trend === 'declining' && <TrendingDown className="w-4 h-4 text-red-500" />}
                {data.trend === 'stable' && <Minus className="w-4 h-4 text-slate-400" />}
                <span className={
                  data.change > 0 ? 'text-emerald-600' : 
                  data.change < 0 ? 'text-red-600' : 
                  'text-slate-500'
                }>
                  {data.change > 0 ? '+' : ''}{data.change}점
                </span>
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>업계 평균: {data.benchmarks.industry}점</div>
            <div>상위 기업: {data.benchmarks.topPerformers}점</div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      {/* 헤더 - 그라데이션 배경 */}
      <div className={`p-6 ${gradeStyle.bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-white">{data.score}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">비즈니스 IQ 스코어</h2>
              <p className="text-xs text-white/70 mt-0.5">= 비즈니스 건강도</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-3 py-1 bg-white/30 rounded-full text-white font-bold text-lg">
                  {data.grade}등급
                </span>
                <div className="flex items-center gap-1 text-white/90">
                  {data.trend === 'improving' && <TrendingUp className="w-5 h-5" />}
                  {data.trend === 'declining' && <TrendingDown className="w-5 h-5" />}
                  {data.trend === 'stable' && <Minus className="w-5 h-5" />}
                  <span>{data.change > 0 ? '+' : ''}{data.change}점</span>
                </div>
              </div>
            </div>
          </div>
          <Tooltip content="비즈니스 데이터 활용 수준을 종합적으로 평가한 점수입니다. 비즈니스 건강도와 동일한 기준으로 계산됩니다.">
            <Info className="w-6 h-6 text-white/70 cursor-help" />
          </Tooltip>
        </div>
      </div>

      {/* 본문 */}
      <div className="p-6">
        {/* 레이더 차트 */}
        <div className="h-64 mb-6">
          <EChartsRadar 
            indicators={radarIndicators}
            series={radarSeries}
            height={256}
            showLegend={false}
            shape="polygon"
          />
        </div>

        {/* 구성 요소 점수 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(data.components).map(([key, value]) => (
            <div key={key} className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {value}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {componentLabels[key]}
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                <div 
                  className={`h-1.5 rounded-full ${
                    value >= 80 ? 'bg-emerald-500' : 
                    value >= 60 ? 'bg-blue-500' : 
                    value >= 40 ? 'bg-amber-500' : 
                    'bg-red-500'
                  }`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 벤치마크 비교 */}
        <div className="flex items-center justify-center gap-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-6">
          <div className="text-center">
            <div className="text-sm text-slate-500 dark:text-slate-400">업계 평균</div>
            <div className="text-xl font-bold text-slate-700 dark:text-slate-200">
              {data.benchmarks.industry}점
            </div>
            <div className={`text-sm ${data.score >= data.benchmarks.industry ? 'text-emerald-600' : 'text-red-600'}`}>
              {data.score >= data.benchmarks.industry ? '상회' : '하회'} 
              ({data.score - data.benchmarks.industry > 0 ? '+' : ''}{data.score - data.benchmarks.industry})
            </div>
          </div>
          <div className="w-px h-12 bg-slate-300 dark:bg-slate-600" />
          <div className="text-center">
            <div className="text-sm text-slate-500 dark:text-slate-400">상위 기업</div>
            <div className="text-xl font-bold text-slate-700 dark:text-slate-200">
              {data.benchmarks.topPerformers}점
            </div>
            <div className={`text-sm ${data.score >= data.benchmarks.topPerformers ? 'text-emerald-600' : 'text-amber-600'}`}>
              {data.score >= data.benchmarks.topPerformers ? '달성' : '목표'} 
              ({data.benchmarks.topPerformers - data.score > 0 ? '-' : '+'}{Math.abs(data.benchmarks.topPerformers - data.score)})
            </div>
          </div>
        </div>

        {/* 개선 제안 */}
        {data.improvements && data.improvements.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              개선 제안
            </h3>
            <div className="space-y-3">
              {data.improvements.map((improvement, idx) => (
                <div 
                  key={idx} 
                  className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-indigo-800 dark:text-indigo-200">
                      {componentLabels[improvement.area]}
                    </span>
                    <Badge variant="primary" size="sm">
                      +{improvement.expectedGain}점 예상
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                    <span>{improvement.currentScore}점</span>
                    <span>→</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {improvement.targetScore}점
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {improvement.actions.map((action, actionIdx) => (
                      <span 
                        key={actionIdx}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400"
                      >
                        <Zap className="w-3 h-3" />
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 상세 보기 버튼 */}
        {onDetailClick && (
          <button
            onClick={onDetailClick}
            className="w-full mt-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            상세 분석 보기
          </button>
        )}
      </div>
    </Card>
  )
}

export default BusinessIQScoreCard

