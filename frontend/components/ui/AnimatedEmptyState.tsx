'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Search, Database, AlertCircle, Filter, BarChart3, Users, Package } from 'lucide-react'
import { BRAND_ASSETS, getLineIllust } from '@/lib/brand-assets'

// 브랜드 이모션 매핑
const brandEmotionMap: Record<string, { emotion: string; line: keyof typeof BRAND_ASSETS.lines.byType }> = {
  search: { emotion: BRAND_ASSETS.emotions.cheer, line: 'search' },
  data: { emotion: BRAND_ASSETS.emotions.cheer, line: 'loading' },
  error: { emotion: BRAND_ASSETS.emotions.sad, line: 'error' },
  filter: { emotion: BRAND_ASSETS.emotions.cheer, line: 'search' },
  chart: { emotion: BRAND_ASSETS.emotions.like, line: 'analytics' },
  customer: { emotion: BRAND_ASSETS.emotions.cheer, line: 'loading' },
  product: { emotion: BRAND_ASSETS.emotions.cheer, line: 'package' },
}

// 애니메이션 아이콘 컴포넌트 (Lottie 대신 Framer Motion 사용)
const AnimatedIcon = ({ type, useBrandIcon = false }: { type: string; useBrandIcon?: boolean }) => {
  const iconMap: Record<string, React.ReactNode> = {
    search: <Search className="w-16 h-16" />,
    data: <Database className="w-16 h-16" />,
    error: <AlertCircle className="w-16 h-16" />,
    filter: <Filter className="w-16 h-16" />,
    chart: <BarChart3 className="w-16 h-16" />,
    customer: <Users className="w-16 h-16" />,
    product: <Package className="w-16 h-16" />,
  }

  // 브랜드 아이콘 사용 시
  if (useBrandIcon) {
    const brandAssets = brandEmotionMap[type] || brandEmotionMap.data
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative flex flex-col items-center gap-2"
      >
        {/* 라인 일러스트 */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-20 h-20 opacity-60"
        >
          <Image
            src={getLineIllust(brandAssets.line)}
            alt=""
            fill
            className="object-contain"
          />
        </motion.div>
        {/* 이모션 아이콘 */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-14 h-14"
        >
          <Image
            src={brandAssets.emotion}
            alt=""
            fill
            className="object-contain"
          />
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
      }}
      className="relative"
    >
      {/* 배경 원 애니메이션 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full -m-4"
      />
      
      {/* 아이콘 펄스 애니메이션 */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative text-indigo-500 dark:text-indigo-400"
      >
        {iconMap[type] || iconMap.data}
      </motion.div>

      {/* 물결 효과 */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0.5 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        className="absolute inset-0 bg-indigo-200 dark:bg-indigo-700 rounded-full -m-4"
      />
    </motion.div>
  )
}

type AnimationType = 'search' | 'data' | 'error' | 'filter' | 'chart' | 'customer' | 'product'

export interface AnimatedEmptyStateProps {
  type?: AnimationType
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  size?: 'sm' | 'md' | 'lg'
  /** 브랜드 이모션 아이콘 사용 여부 */
  useBrandIcon?: boolean
}

const sizeConfig = {
  sm: { 
    container: 'py-8 px-4',
    icon: 'w-24 h-24',
    title: 'text-base', 
    desc: 'text-sm', 
    button: 'px-3 py-1.5 text-sm' 
  },
  md: { 
    container: 'py-12 px-6',
    icon: 'w-32 h-32',
    title: 'text-lg', 
    desc: 'text-sm', 
    button: 'px-4 py-2 text-sm' 
  },
  lg: { 
    container: 'py-16 px-8',
    icon: 'w-40 h-40',
    title: 'text-xl', 
    desc: 'text-base', 
    button: 'px-5 py-2.5 text-base' 
  },
}

export function AnimatedEmptyState({
  type = 'data',
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  useBrandIcon = false,
}: AnimatedEmptyStateProps) {
  const config = sizeConfig[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center ${config.container}`}
    >
      {/* 애니메이션 아이콘 */}
      <div className={`${config.icon} flex items-center justify-center mb-6`}>
        <AnimatedIcon type={type} useBrandIcon={useBrandIcon} />
      </div>

      {/* 텍스트 */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`font-semibold text-slate-800 dark:text-slate-100 text-center ${config.title}`}
      >
        {title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`text-slate-500 dark:text-slate-400 mt-2 max-w-md text-center ${config.desc}`}
      >
        {description}
      </motion.p>

      {/* 액션 버튼 */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3 mt-6"
        >
          {action && (
            <button
              onClick={action.onClick}
              className={`bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors ${config.button}`}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={`bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${config.button}`}
            >
              {secondaryAction.label}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

// 기존 EmptyState와 호환되는 간단한 버전
interface SimpleEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export function SimpleEmptyState({
  icon,
  title,
  description,
  action,
}: SimpleEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && (
        <div className="w-16 h-16 flex items-center justify-center text-slate-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

