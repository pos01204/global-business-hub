'use client'

import { useState, useEffect, useRef, RefObject } from 'react'

interface UseMessageBlankSizeReturn {
  blankSize: number
  messagesEndRef: RefObject<HTMLDivElement>
  lastMessageRef: RefObject<HTMLDivElement>
  updateBlankSize: () => void
}

/**
 * Blank Size 계산 훅
 * 마지막 메시지 하단과 뷰포트 끝 사이의 거리를 계산
 */
export function useMessageBlankSize(): UseMessageBlankSizeReturn {
  const [blankSize, setBlankSize] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)

  const calculateBlankSize = () => {
    if (!lastMessageRef.current) {
      setBlankSize(0)
      return
    }

    const lastMessage = lastMessageRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight

    // 마지막 메시지 하단과 뷰포트 끝 사이의 거리
    const distance = viewportHeight - lastMessage.bottom
    setBlankSize(Math.max(0, distance))
  }

  useEffect(() => {
    calculateBlankSize()

    // 리사이즈 이벤트 리스너
    const handleResize = () => {
      requestAnimationFrame(calculateBlankSize)
    }
    window.addEventListener('resize', handleResize)

    // Intersection Observer로 메시지 변경 감지
    const observer = new IntersectionObserver(
      () => {
        requestAnimationFrame(calculateBlankSize)
      },
      { threshold: 0.1 }
    )

    if (lastMessageRef.current) {
      observer.observe(lastMessageRef.current)
    }

    // MutationObserver로 DOM 변경 감지
    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(calculateBlankSize)
    })

    if (messagesEndRef.current) {
      mutationObserver.observe(messagesEndRef.current, {
        childList: true,
        subtree: true
      })
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  return {
    blankSize,
    messagesEndRef,
    lastMessageRef,
    updateBlankSize: calculateBlankSize
  }
}

