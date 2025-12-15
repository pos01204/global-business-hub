'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// GIF 반복 재생을 보장하는 컴포넌트
function GifImage({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  const [imageSrc, setImageSrc] = useState(src)
  
  useEffect(() => {
    // GIF가 한 사이클 끝나면 다시 로드하여 반복 재생 보장
    // src에 타임스탬프를 추가하여 브라우저가 이미지를 다시 로드하도록 함
    const interval = setInterval(() => {
      setImageSrc(`${src}?t=${Date.now()}`)
    }, 5000) // 5초마다 재로드 (GIF 사이클 시간에 맞게 조정 가능)
    
    return () => clearInterval(interval)
  }, [src])
  
  return (
    <img
      src={imageSrc}
      alt={alt}
      className="w-full h-full object-contain"
      style={{ width, height }}
      loading="eager"
    />
  )
}

interface EnhancedLoadingPageProps {
  message?: string
  progress?: number
  variant?: 'default' | 'minimal' | 'fullscreen'
  size?: 'sm' | 'md' | 'lg'
  showCharacter?: boolean
  // GIF 사용 여부 (true면 GIF, false면 PNG + CSS 애니메이션)
  useGif?: boolean
  // GIF 파일 경로 (useGif가 true일 때)
  gifSrc?: string
  // PNG 파일 경로 (useGif가 false일 때)
  pngSrc?: string
  // PNG 사용 시 추가 애니메이션 (useGif가 false일 때만)
  animate?: boolean
  // 하얀 박스 컨테이너로 감싸기 (기본값: true, variant="default"일 때만 적용)
  container?: boolean
  className?: string
}

const sizeMap = {
  sm: { character: 120, spacing: 24 },
  md: { character: 160, spacing: 32 },
  lg: { character: 200, spacing: 40 },
}

export function EnhancedLoadingPage({
  message = '데이터를 불러오는 중...',
  progress,
  variant = 'default',
  size = 'md',
  showCharacter = true,
  useGif = true, // 기본값: GIF 사용
  gifSrc = '/loading/3times.gif',
  pngSrc = '/characters/idus-character-3d.png',
  animate = true,
  container = true, // 기본값: 하얀 박스로 감싸기
  className,
}: EnhancedLoadingPageProps) {
  const { character: characterSize, spacing } = sizeMap[size]
  
  const isFullscreen = variant === 'fullscreen'
  const isMinimal = variant === 'minimal'
  const characterSrc = useGif ? gifSrc : pngSrc
  const useContainer = container && variant === 'default' && !isFullscreen && !isMinimal

  const content = (
      <>
      {/* 캐릭터 영역 */}
      {showCharacter && (
        <div className="relative mb-6 md:mb-8" style={{ width: characterSize, height: characterSize }}>
          {useGif ? (
            // GIF 사용: 네이티브 img 태그 사용 (Next.js Image는 GIF 애니메이션 미지원)
            // GIF는 파일 자체에 반복 정보가 포함되어 있지만, 반복 재생을 보장하기 위해 key를 사용
            <GifImage
              src={characterSrc}
              alt="idus 캐릭터"
              width={characterSize}
              height={characterSize}
            />
          ) : (
            // PNG 사용: Next.js Image + CSS 애니메이션
            <motion.div
              className="relative w-full h-full"
              style={{ width: characterSize, height: characterSize }}
              animate={animate ? {
                y: [0, -6, 0],
              } : {}}
              transition={animate ? {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              } : {}}
            >
              <Image
                src={characterSrc}
                alt="idus 캐릭터"
                fill
                className="object-contain"
                priority
              />
            </motion.div>
          )}
        </div>
      )}

      {/* 진행 바 */}
      {progress !== undefined && (
        <div className="w-64 max-w-full mb-4 md:mb-6">
          <div className="h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-idus-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* 메시지 영역 */}
      <motion.p
        className="text-sm md:text-base font-medium text-slate-600 dark:text-slate-400 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {message}
      </motion.p>
      </>
  )

  // Fullscreen variant: 전체 화면 오버레이
  if (isFullscreen) {
    return (
      <div
        className={cn(
          'fixed inset-0 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-50',
          className
        )}
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        {content}
      </div>
    )
  }

  // Container variant: 하얀 박스로 감싸기 (기본값)
  if (useContainer) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm',
          'flex flex-col items-center justify-center',
          'w-full min-h-[calc(100vh-120px)]',
          className
        )}
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        {content}
      </div>
    )
  }

  // Default variant (container=false): 투명 배경
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'py-12 min-h-[300px] md:min-h-[400px]',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {content}
    </div>
  )
}

