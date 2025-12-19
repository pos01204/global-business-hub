'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Languages, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  Copy,
  Check,
  Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ReviewTranslationProps {
  /** 원문 리뷰 내용 */
  originalContent: string
  
  /** 원문 언어 */
  originalLanguage: 'ja' | 'en' | 'unknown'
  
  /** 번역된 내용 (이미 번역되어 있는 경우) */
  translatedContent?: string
  
  /** 번역 API 호출 함수 */
  onTranslate?: (content: string, fromLang: string) => Promise<string>
  
  /** 번역 자동 실행 여부 */
  autoTranslate?: boolean
  
  /** 컴팩트 모드 (인라인 표시) */
  compact?: boolean
  
  /** 추가 클래스 */
  className?: string
}

/**
 * 언어 감지 함수
 */
function detectLanguage(text: string): 'ja' | 'en' | 'unknown' {
  if (!text) return 'unknown'
  
  // 일본어 문자 (히라가나, 가타카나, 한자) 패턴
  const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
  
  // 일본어 문자가 포함되어 있으면 일본어로 판단
  if (japanesePattern.test(text)) {
    return 'ja'
  }
  
  // 영어/라틴 문자 패턴
  const englishPattern = /[a-zA-Z]/
  if (englishPattern.test(text)) {
    return 'en'
  }
  
  return 'unknown'
}

/**
 * 언어 레이블
 */
const languageLabels = {
  ja: { flag: '🇯🇵', name: '일본어', short: 'JA' },
  en: { flag: '🇺🇸', name: '영어', short: 'EN' },
  ko: { flag: '🇰🇷', name: '한국어', short: 'KO' },
  unknown: { flag: '🌍', name: '알 수 없음', short: '?' },
}

/**
 * 간단한 번역 (실제로는 API 연동 필요)
 * 여기서는 데모용으로 기본적인 일본어/영어 키워드를 한국어로 변환
 */
const simpleTranslate = async (content: string, fromLang: 'ja' | 'en'): Promise<string> => {
  // 실제 구현에서는 Google Translate API, DeepL API 등 사용
  // 여기서는 데모용 간단 변환
  
  await new Promise(resolve => setTimeout(resolve, 500)) // 시뮬레이션 딜레이
  
  if (fromLang === 'ja') {
    // 일본어 → 한국어 간단 변환 (데모)
    const jaToKo: Record<string, string> = {
      'ありがとう': '감사합니다',
      'とても': '매우',
      '良い': '좋은',
      '悪い': '나쁜',
      '商品': '상품',
      '配送': '배송',
      '遅い': '느린',
      '早い': '빠른',
      '品質': '품질',
      '満足': '만족',
      '不満': '불만',
      '素敵': '멋진',
      '可愛い': '귀여운',
      'きれい': '예쁜',
      '写真': '사진',
      '違う': '다른',
      '問題': '문제',
      '対応': '대응',
      'おすすめ': '추천',
      'また': '다시',
      '購入': '구매',
      'したい': '하고 싶다',
    }
    
    let translated = content
    Object.entries(jaToKo).forEach(([ja, ko]) => {
      translated = translated.replace(new RegExp(ja, 'g'), ko)
    })
    
    return `[자동 번역] ${translated}`
  } else {
    // 영어 → 한국어 간단 변환 (데모)
    const enToKo: Record<string, string> = {
      'thank you': '감사합니다',
      'very': '매우',
      'good': '좋은',
      'bad': '나쁜',
      'product': '상품',
      'delivery': '배송',
      'slow': '느린',
      'fast': '빠른',
      'quality': '품질',
      'satisfied': '만족',
      'disappointed': '실망',
      'beautiful': '아름다운',
      'cute': '귀여운',
      'pretty': '예쁜',
      'photo': '사진',
      'different': '다른',
      'problem': '문제',
      'recommend': '추천',
      'again': '다시',
      'purchase': '구매',
      'love': '사랑',
      'amazing': '놀라운',
      'great': '훌륭한',
      'nice': '좋은',
      'perfect': '완벽한',
      'shipping': '배송',
      'arrived': '도착했습니다',
      'ordered': '주문했습니다',
      'received': '받았습니다',
    }
    
    let translated = content.toLowerCase()
    Object.entries(enToKo).forEach(([en, ko]) => {
      translated = translated.replace(new RegExp(en, 'gi'), ko)
    })
    
    return `[자동 번역] ${translated}`
  }
}

/**
 * ReviewTranslation 컴포넌트
 * 영어/일본어 리뷰를 한국어로 번역하여 표시
 */
export function ReviewTranslation({
  originalContent,
  originalLanguage: propLanguage,
  translatedContent: initialTranslation,
  onTranslate,
  autoTranslate = false,
  compact = false,
  className,
}: ReviewTranslationProps) {
  const [isExpanded, setIsExpanded] = useState(autoTranslate)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedText, setTranslatedText] = useState(initialTranslation || '')
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 언어 감지
  const detectedLanguage = propLanguage === 'unknown' ? detectLanguage(originalContent) : propLanguage
  const langInfo = languageLabels[detectedLanguage]
  
  // 번역 실행
  const handleTranslate = async () => {
    if (translatedText || isTranslating) return
    if (detectedLanguage === 'unknown') {
      setError('언어를 감지할 수 없습니다')
      return
    }
    
    setIsTranslating(true)
    setError(null)
    
    try {
      const result = onTranslate 
        ? await onTranslate(originalContent, detectedLanguage)
        : await simpleTranslate(originalContent, detectedLanguage)
      setTranslatedText(result)
    } catch (err) {
      setError('번역 중 오류가 발생했습니다')
    } finally {
      setIsTranslating(false)
    }
  }
  
  // 복사
  const handleCopy = async () => {
    const textToCopy = translatedText || originalContent
    await navigator.clipboard.writeText(textToCopy)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }
  
  // 자동 번역
  React.useEffect(() => {
    if (autoTranslate && !translatedText && !isTranslating && detectedLanguage !== 'unknown') {
      handleTranslate()
    }
  }, [autoTranslate, detectedLanguage])
  
  // 컴팩트 모드
  if (compact) {
    return (
      <div className={cn('inline-flex items-center gap-2', className)}>
        <span className="text-sm">{langInfo.flag}</span>
        {!translatedText && detectedLanguage !== 'unknown' && (
          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
          >
            {isTranslating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Languages className="w-3 h-3" />
            )}
            번역
          </button>
        )}
        {translatedText && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">
            번역됨
          </span>
        )}
      </div>
    )
  }
  
  return (
    <div className={cn(
      'border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden',
      className
    )}>
      {/* 헤더 */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{langInfo.flag}</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {langInfo.name} 원문
          </span>
          {translatedText && (
            <span className="text-xs px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded">
              번역됨
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!translatedText && detectedLanguage !== 'unknown' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleTranslate()
              }}
              disabled={isTranslating}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded"
            >
              {isTranslating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Languages className="w-3 h-3" />
              )}
              한국어로 번역
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCopy()
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>
      
      {/* 내용 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3">
              {/* 원문 */}
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  원문 ({langInfo.name})
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {originalContent}
                </p>
              </div>
              
              {/* 번역 결과 */}
              {translatedText && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    🇰🇷 한국어 번역
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {translatedText}
                  </p>
                </div>
              )}
              
              {/* 에러 */}
              {error && (
                <div className="text-xs text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              
              {/* 번역 버튼 (내용 내부) */}
              {!translatedText && !isTranslating && detectedLanguage !== 'unknown' && (
                <button
                  onClick={handleTranslate}
                  className="w-full py-2 text-sm font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
                >
                  <Languages className="w-4 h-4 inline-block mr-1" />
                  한국어로 번역하기
                </button>
              )}
              
              {/* 번역 중 */}
              {isTranslating && (
                <div className="flex items-center justify-center py-2 text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  번역 중...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ReviewTranslation

