'use client'

import { useState, useEffect, useRef, useMemo } from 'react'

interface StaggeredFadeTextProps {
  text: string
  isStreaming: boolean
  staggerDelay?: number // ms 단위 지연 (기본: 32ms)
  maxConcurrent?: number // 동시에 애니메이션되는 최대 요소 수 (기본: 4)
}

/**
 * 스트리밍 콘텐츠 스태거드 페이드 애니메이션 컴포넌트
 * 텍스트를 단어 단위로 분할하여 순차적으로 페이드인
 */
export function StaggeredFadeText({ 
  text, 
  isStreaming, 
  staggerDelay = 32,
  maxConcurrent = 4 
}: StaggeredFadeTextProps) {
  const [words, setWords] = useState<Array<{ id: number; text: string; index: number }>>([])
  const [animatedIndices, setAnimatedIndices] = useState<Set<number>>(new Set())
  const wordIdCounter = useRef(0)
  const animationQueue = useRef<number[]>([])
  const activeAnimations = useRef<Set<number>>(new Set())

  // 텍스트를 단어로 분할
  const splitText = useMemo(() => {
    if (!text) return []
    
    // 공백을 기준으로 분할하되, 공백도 유지
    const parts = text.split(/(\s+)/).filter(w => w.length > 0)
    return parts.map((part, index) => ({
      id: wordIdCounter.current++,
      text: part,
      index
    }))
  }, [text])

  // 단어 목록 업데이트
  useEffect(() => {
    if (splitText.length === 0) {
      setWords([])
      return
    }

    // 새로 추가된 단어만 감지
    const newWords = splitText.slice(words.length)
    if (newWords.length > 0) {
      setWords(prev => [...prev, ...newWords])
    }
  }, [splitText, words.length])

  // 애니메이션 풀 관리
  const startAnimation = (index: number) => {
    // 이미 애니메이션 중이거나 완료된 경우 스킵
    if (animatedIndices.has(index) || activeAnimations.current.has(index)) {
      return
    }

    // 동시 애니메이션 수 제한
    if (activeAnimations.current.size >= maxConcurrent) {
      animationQueue.current.push(index)
      return
    }

    // 애니메이션 시작
    activeAnimations.current.add(index)
    setAnimatedIndices(prev => new Set([...prev, index]))

    // 애니메이션 완료 후 풀에서 제거 및 큐 처리
    setTimeout(() => {
      activeAnimations.current.delete(index)
      
      // 큐에서 다음 항목 처리
      if (animationQueue.current.length > 0) {
        const nextIndex = animationQueue.current.shift()!
        startAnimation(nextIndex)
      }
    }, 300) // 페이드인 애니메이션 시간
  }

  // 새 단어에 애니메이션 적용
  useEffect(() => {
    if (!isStreaming || words.length === 0) return

    // 마지막 단어부터 역순으로 확인하여 아직 애니메이션되지 않은 단어 찾기
    for (let i = words.length - 1; i >= 0; i--) {
      if (!animatedIndices.has(i)) {
        startAnimation(i)
        break
      }
    }
  }, [words, isStreaming, animatedIndices])

  // 스트리밍이 완료되면 모든 단어 즉시 표시
  useEffect(() => {
    if (!isStreaming && words.length > 0) {
      const allIndices = new Set(Array.from({ length: words.length }, (_, i) => i))
      setAnimatedIndices(allIndices)
      activeAnimations.current.clear()
      animationQueue.current = []
    }
  }, [isStreaming, words.length])

  return (
    <span className="whitespace-pre-wrap break-words leading-relaxed">
      {words.map((word, index) => {
        const isAnimated = animatedIndices.has(index)
        const delay = index * staggerDelay

        return (
          <span
            key={word.id}
            className={`inline transition-opacity duration-300 ${
              isAnimated ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transitionDelay: isAnimated ? `${delay}ms` : '0ms'
            }}
          >
            {word.text}
          </span>
        )
      })}
    </span>
  )
}

