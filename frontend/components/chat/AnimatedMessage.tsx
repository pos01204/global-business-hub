'use client'

import { useState, useEffect, useRef } from 'react'

interface AnimatedMessageProps {
  message: {
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }
  index: number
  isNewMessage?: boolean
  children: React.ReactNode
}

/**
 * 메시지 전송 애니메이션 컴포넌트
 * 사용자 메시지: 위로 슬라이드하면서 페이드아웃
 * 어시스턴트 메시지: 페이드인
 */
export function AnimatedMessage({ 
  message, 
  index, 
  isNewMessage = false,
  children 
}: AnimatedMessageProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldFadeIn, setShouldFadeIn] = useState(false)
  const messageRef = useRef<HTMLDivElement>(null)
  const isUserMessage = message.role === 'user'

  useEffect(() => {
    if (!isUserMessage || !isNewMessage || !messageRef.current) return

    // 사용자 메시지 전송 애니메이션
    const startAnimation = () => {
      setIsAnimating(true)
      const messageElement = messageRef.current

      if (messageElement) {
        // 위로 슬라이드하면서 페이드아웃
        messageElement.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out'
        messageElement.style.transform = `translateY(-${window.innerHeight}px)`
        messageElement.style.opacity = '0'

        // 애니메이션 완료 후 어시스턴트 메시지 페이드인 시작
        setTimeout(() => {
          setIsAnimating(false)
          setShouldFadeIn(true)
        }, 400)
      }
    }

    // 메시지가 추가된 직후 애니메이션 시작
    const timer = setTimeout(startAnimation, 50)
    return () => clearTimeout(timer)
  }, [isNewMessage, isUserMessage])

  // 어시스턴트 메시지 페이드인
  const assistantFadeIn = !isUserMessage && (shouldFadeIn || !isNewMessage)

  return (
    <div
      ref={messageRef}
      className={`flex ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      } ${
        isUserMessage 
          ? '' // 사용자 메시지는 인라인 스타일로 처리
          : assistantFadeIn 
            ? 'opacity-100 translate-y-0 transition-all duration-350 ease-out' 
            : 'opacity-0 translate-y-4 transition-all duration-350 ease-out'
      }`}
    >
      {children}
    </div>
  )
}

