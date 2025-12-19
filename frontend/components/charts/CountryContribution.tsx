'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  ChevronRight, 
  Calendar 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Tooltip } from '@/components/ui/Tooltip'
import Link from 'next/link'

/**
 * 국가 코드별 국기 이모지 매핑
 */
const flagMap: Record<string, string> = {
  JP: '🇯🇵',
  US: '🇺🇸',
  KR: '🇰🇷',
  CN: '🇨🇳',
  TW: '🇹🇼',
  HK: '🇭🇰',
  SG: '🇸🇬',
  AU: '🇦🇺',
  GB: '🇬🇧',
  DE: '🇩🇪',
  FR: '🇫🇷',
  CA: '🇨🇦',
  OTHER: '🌏',
}

export interface CountryData {
  /** 국가 코드 (ISO 3166-1 alpha-2) */
  countryCode: string
  
  /** 국가명 */
  country: string
  
  /** 국기 이모지 (없으면 자동 매핑) */
  flag?: string
  
  /** 어제 GMV (원) */
  gmv: number
  
  /** GMV 비중 (%) */
  share: number
  
  /** 전일 대비 성장률 (%) */
  growthDoD: number
  
  /** 전주 동일 대비 성장률 (%) */
  growthWoW?: number
  
  /** 성장 기여도 (%) */
  contribution: number
}

export interface TopContributor {
  /** 국가명 */
  country: string
  
  /** 국기 이모지 */
  flag: string
  
  /** 기여도 변화 (%p) */
  contributionChange: number
  
  /** 변화 이유 */
  reason: string
}

export interface CountryContributionProps {
  /** 데이터 기준일 (어제) */
  referenceDate: string
  
  /** 국가별 데이터 */
  data: CountryData[]
  
  /** 성장 기여도 TOP 국가 */
  topContributors?: TopContributor[]
  
  /** 상세 링크 */
  detailLink?: string
  
  /** 로딩 상태 */
  isLoading?: boolean
  
  /** 추가 클래스 */
  className?: string
}

/**
 * CountryContribution 컴포넌트
 * 
 * 전일 국가별 GMV 기여도 및 성장 기여도를 시각화합니다.
 * 모든 데이터는 전일 (D-1) 마감 데이터 기준입니다.
 * 
 * @example
 * ```tsx
 * <CountryContribution
 *   referenceDate="2024-12-18"
 *   data={[
 *     { countryCode: 'JP', country: '일본', gmv: 6850000000, share: 68.5, growthDoD: 12.3, contribution: 8.4 },
 *     { countryCode: 'US', country: '미국', gmv: 2210000000, share: 22.1, growthDoD: 8.7, contribution: 1.9 },
 *   ]}
 *   topContributors={[
 *     { country: '일본', flag: '🇯🇵', contributionChange: 8.4, reason: '비중 증가 + 높은 성장률' }
 *   ]}
 *   detailLink="/analytics?tab=country"
 * />
 * ```
 */
export function CountryContribution({
  referenceDate,
  data,
  topContributors,
  detailLink,
  isLoading = false,
  className,
}: CountryContributionProps) {
  // 데이터 정렬 (비중 내림차순)
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.share - a.share)
  }, [data])

  // 최대 비중 (프로그레스 바 스케일용)
  const maxShare = useMemo(() => {
    return Math.max(...data.map(d => d.share), 1)
  }, [data])

  // 전체 GMV 합계
  const totalGMV = useMemo(() => {
    return data.reduce((sum, d) => sum + d.gmv, 0)
  }, [data])

  // 국기 이모지 가져오기
  const getFlag = (countryCode: string, flag?: string) => {
    return flag || flagMap[countryCode] || flagMap.OTHER
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={cn(
        'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6 shadow-sm',
        className
      )}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 빈 상태
  if (data.length === 0) {
    return (
      <div className={cn(
        'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6 shadow-sm',
        className
      )}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">국가별 GMV 기여도</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">어제 기준 성장 기여도 분석</p>
          </div>
        </div>
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">데이터가 없습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6 shadow-sm',
      className
    )}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
            <Globe className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">국가별 GMV 기여도</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              어제 기준 • 총 {formatCurrency(totalGMV)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            {formatDate(referenceDate, 'short')}
          </span>
          
          {detailLink && (
            <Link
              href={detailLink}
              className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
            >
              상세 보기 →
            </Link>
          )}
        </div>
      </div>

      {/* 국가별 프로그레스 바 */}
      <div className="space-y-3 mb-6">
        {sortedData.map((item, index) => {
          const flag = getFlag(item.countryCode, item.flag)
          
          return (
            <motion.div
              key={item.countryCode}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg" role="img" aria-label={item.country}>
                    {flag}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {item.country}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Tooltip content={`어제 GMV: ${formatCurrency(item.gmv)}`}>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 cursor-help">
                      {item.share.toFixed(1)}%
                    </span>
                  </Tooltip>
                  <span className={cn(
                    'text-xs font-medium flex items-center gap-0.5',
                    item.growthDoD >= 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-red-600 dark:text-red-400'
                  )}>
                    {item.growthDoD >= 0 ? (
                      <TrendingUp className="w-3 h-3" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="w-3 h-3" aria-hidden="true" />
                    )}
                    {item.growthDoD >= 0 ? '+' : ''}{item.growthDoD.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {/* 프로그레스 바 */}
              <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.share / maxShare) * 100}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 어제 성장 기여도 TOP */}
      {topContributors && topContributors.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              어제 성장 기여도 TOP
            </span>
          </div>
          
          <div className="space-y-2">
            {topContributors.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                    index === 0 ? 'bg-amber-400 text-amber-900' :
                    index === 1 ? 'bg-slate-300 text-slate-700' :
                    'bg-orange-300 text-orange-800'
                  )}>
                    {index + 1}
                  </span>
                  <span className="text-sm" role="img" aria-label={item.country}>
                    {item.flag}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {item.country}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm font-bold',
                    item.contributionChange >= 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-red-600 dark:text-red-400'
                  )}>
                    {item.contributionChange >= 0 ? '+' : ''}{item.contributionChange.toFixed(1)}%p
                  </span>
                  <Tooltip content={item.reason}>
                    <span className="text-xs text-slate-500 dark:text-slate-400 cursor-help">
                      기여
                    </span>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 상세 보기 링크 (하단) */}
      {detailLink && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Link
            href={detailLink}
            className="flex items-center justify-center gap-1 text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors"
          >
            국가별 상세 분석
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

export default CountryContribution

