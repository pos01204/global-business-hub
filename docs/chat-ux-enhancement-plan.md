# AI 어시스턴트 채팅 UX 고도화 계획

**작성일**: 2024-12-19  
**기준**: Vercel v0 iOS 앱 기술 분석 문서  
**목표**: 네이티브 수준의 부드럽고 즐거운 채팅 경험 구현

---

## 📋 목차

1. [현재 상태 분석](#1-현재-상태-분석)
2. [핵심 개선 영역](#2-핵심-개선-영역)
3. [구체적 구현 방안](#3-구체적-구현-방안)
4. [우선순위 및 로드맵](#4-우선순위-및-로드맵)

---

## 1. 현재 상태 분석

### 1.1 현재 구현된 기능

✅ **기본 기능**
- 스트리밍 메시지 지원
- 기본 타이핑 효과 (커서 깜빡임)
- 메시지 페이드인 애니메이션
- 키보드 Enter 전송
- 반응형 레이아웃

⚠️ **개선 필요 영역**
- 스트리밍 콘텐츠가 한 번에 나타남 (스태거드 페이드 없음)
- 메시지 전송 시 단순 페이드인만 (슬라이드 애니메이션 없음)
- 컴포저가 고정 위치 (플로팅 효과 없음)
- 키보드 상태에 따른 스크롤 조정 부족
- 동적 높이 처리 기본적

---

## 2. 핵심 개선 영역

### 2.1 스트리밍 콘텐츠 스태거드 페이드 애니메이션 ⭐ **최우선**

**목표**: AI 응답이 스트리밍될 때 단어/문장 단위로 순차적으로 페이드인되어 부드러운 타이핑 느낌 제공

**기대 효과**:
- 더 자연스러운 AI 응답 경험
- 사용자가 응답을 읽는 동안 시각적 피드백 제공
- 네이티브 앱 수준의 부드러운 느낌

**기술 요구사항**:
- Framer Motion 또는 CSS 애니메이션 활용
- 텍스트를 단어/문장 단위로 분할
- 동시에 애니메이션되는 요소 수 제한 (풀 기반 관리)
- 재애니메이션 방지 (이미 본 콘텐츠)

### 2.2 메시지 전송 애니메이션 ⭐ **높은 우선순위**

**목표**: 사용자 메시지가 위로 슬라이드되면서 사라지고, AI 응답이 부드럽게 페이드인

**기대 효과**:
- 메시지 전송의 시각적 피드백 강화
- 대화 흐름의 자연스러움 향상
- 사용자 만족도 증가

**기술 요구사항**:
- 사용자 메시지 높이 측정
- translateY 애니메이션으로 위로 슬라이드
- 애니메이션 완료 후 AI 응답 페이드인
- Framer Motion 또는 CSS Transform 활용

### 2.3 플로팅 컴포저 (Glass Morphism) ⭐ **중간 우선순위**

**목표**: iOS 26 iMessage 스타일의 반투명 떠있는 컴포저 구현

**기대 효과**:
- 현대적이고 세련된 디자인
- 네이티브 앱과 유사한 경험
- 시각적 계층 구조 명확화

**기술 요구사항**:
- CSS backdrop-filter (glass morphism)
- position: fixed + bottom: 0
- 키보드 상태에 따른 위치 조정
- 컴포저 높이 변화 시 스크롤 조정

### 2.4 동적 높이 및 스크롤 관리 ⭐ **중간 우선순위**

**목표**: Blank Size 개념을 웹에 적용하여 동적 메시지 높이와 키보드 상태를 정확히 처리

**기대 효과**:
- 메시지가 항상 올바른 위치에 표시
- 키보드 열림/닫힘 시 부드러운 전환
- 스크롤 위치 정확도 향상

**기술 요구사항**:
- 마지막 메시지 하단과 뷰포트 끝 사이의 거리 계산
- 동적 padding-bottom 적용
- 키보드 상태 감지 및 반응
- Intersection Observer 활용

### 2.5 컴포저블 채팅 구조 ⭐ **낮은 우선순위**

**목표**: Context Provider 기반의 모듈화된 구조로 확장성 향상

**기대 효과**:
- 기능별 독립적 개발 가능
- 유지보수성 향상
- 테스트 용이성 증가

**기술 요구사항**:
- React Context API
- 커스텀 훅 기반 기능 분리
- Provider 컴포지션

### 2.6 키보드 인식 개선 ⭐ **중간 우선순위**

**목표**: 키보드 상태에 따른 스마트한 스크롤 조정

**기대 효과**:
- 키보드 열림/닫힘 시 자연스러운 동작
- 입력 중 스크롤 위치 유지
- 모바일 경험 향상

**기술 요구사항**:
- Visual Viewport API 활용
- 키보드 높이 감지
- 스크롤 위치 계산 및 조정

---

## 3. 구체적 구현 방안

### 3.1 스트리밍 콘텐츠 스태거드 페이드 애니메이션

#### 3.1.1 컴포넌트 구조

```typescript
// frontend/components/chat/StaggeredFadeText.tsx

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

interface StaggeredFadeTextProps {
  text: string
  isStreaming: boolean
  staggerDelay?: number // ms 단위 지연 (기본: 32ms)
  maxConcurrent?: number // 동시에 애니메이션되는 최대 요소 수 (기본: 4)
}

// 풀 기반 애니메이션 상태 관리
function useAnimationPool(maxSize: number = 4) {
  const [pool, setPool] = useState<Set<string>>(new Set())
  const queueRef = useRef<string[]>([])

  const requestAnimation = (id: string): boolean => {
    if (pool.size < maxSize) {
      setPool(prev => new Set([...prev, id]))
      return true
    } else {
      queueRef.current.push(id)
      return false
    }
  }

  const releaseAnimation = (id: string) => {
    setPool(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })

    // 큐에서 다음 항목 처리
    if (queueRef.current.length > 0) {
      const nextId = queueRef.current.shift()!
      setPool(prev => new Set([...prev, nextId]))
    }
  }

  return { requestAnimation, releaseAnimation, poolSize: pool.size }
}

export function StaggeredFadeText({ 
  text, 
  isStreaming, 
  staggerDelay = 32,
  maxConcurrent = 4 
}: StaggeredFadeTextProps) {
  const { requestAnimation, releaseAnimation } = useAnimationPool(maxConcurrent)
  const [words, setWords] = useState<string[]>([])
  const [animatedWords, setAnimatedWords] = useState<Set<number>>(new Set())
  const wordIdCounter = useRef(0)

  // 텍스트를 단어로 분할
  useEffect(() => {
    if (!text) {
      setWords([])
      return
    }

    // 공백을 기준으로 분할하되, 공백도 유지
    const newWords = text.split(/(\s+)/).filter(w => w.length > 0)
    setWords(newWords)
  }, [text])

  // 새 단어에 애니메이션 적용
  useEffect(() => {
    if (!isStreaming || words.length === 0) return

    const lastIndex = words.length - 1
    if (animatedWords.has(lastIndex)) return

    const wordId = `word-${wordIdCounter.current++}`
    const canAnimate = requestAnimation(wordId)

    if (canAnimate) {
      setAnimatedWords(prev => new Set([...prev, lastIndex]))
      
      // 애니메이션 완료 후 풀에서 제거
      setTimeout(() => {
        releaseAnimation(wordId)
      }, 300) // 페이드인 애니메이션 시간
    }
  }, [words, isStreaming, animatedWords, requestAnimation, releaseAnimation])

  return (
    <span className="whitespace-pre-wrap break-words leading-relaxed">
      {words.map((word, index) => {
        const isAnimated = animatedWords.has(index)
        const delay = index * staggerDelay

        if (!isAnimated && isStreaming) {
          // 아직 애니메이션되지 않은 단어는 투명하게
          return (
            <span key={index} className="opacity-0">
              {word}
            </span>
          )
        }

        return (
          <motion.span
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: delay / 1000,
              ease: 'easeOut'
            }}
            className="inline"
          >
            {word}
          </motion.span>
        )
      })}
    </span>
  )
}
```

#### 3.1.2 채팅 페이지 통합

```typescript
// frontend/app/chat/page.tsx 수정

import { StaggeredFadeText } from '@/components/chat/StaggeredFadeText'

// 스트리밍 중인 메시지 표시 부분 수정
{isStreaming && streamingContent && (
  <div className="flex justify-start">
    <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white border border-slate-200 text-slate-900 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
        <span>{AGENT_META[selectedAgent]?.icon || '🤖'}</span>
        <span className="flex items-center gap-1">
          <span className="animate-pulse">응답 중</span>
          <span className="flex gap-0.5">
            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </span>
      </div>
      <StaggeredFadeText 
        text={streamingContent}
        isStreaming={isStreaming}
        staggerDelay={32}
        maxConcurrent={4}
      />
      <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 rounded" style={{ animation: 'blink 1s infinite' }} />
    </div>
  </div>
)}
```

### 3.2 메시지 전송 애니메이션

#### 3.2.1 메시지 애니메이션 훅

```typescript
// frontend/hooks/useMessageSendAnimation.ts

import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

interface UseMessageSendAnimationOptions {
  onAnimationComplete?: () => void
  messageIndex: number
  isUserMessage: boolean
}

export function useMessageSendAnimation({
  onAnimationComplete,
  messageIndex,
  isUserMessage
}: UseMessageSendAnimationOptions) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldFadeIn, setShouldFadeIn] = useState(false)
  const messageRef = useRef<HTMLDivElement>(null)
  const translateY = useMotionValue(0)
  const opacity = useMotionValue(1)

  useEffect(() => {
    if (!isUserMessage || !messageRef.current) return

    // 사용자 메시지 전송 시 애니메이션 시작
    const startAnimation = () => {
      setIsAnimating(true)
      const messageHeight = messageRef.current?.offsetHeight || 0
      const viewportHeight = window.innerHeight

      // 위로 슬라이드하면서 페이드아웃
      animate(translateY, -viewportHeight, {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] // ease-out
      })

      animate(opacity, 0, {
        duration: 0.3,
        ease: 'easeOut'
      }).then(() => {
        setIsAnimating(false)
        onAnimationComplete?.()
        // 다음 메시지(어시스턴트) 페이드인 시작
        setShouldFadeIn(true)
      })
    }

    // 메시지가 추가된 직후 애니메이션 시작
    const timer = setTimeout(startAnimation, 50)
    return () => clearTimeout(timer)
  }, [messageIndex, isUserMessage, translateY, opacity, onAnimationComplete])

  return {
    messageRef,
    translateY,
    opacity,
    isAnimating,
    shouldFadeIn,
    style: {
      transform: `translateY(${translateY.get()}px)`,
      opacity: opacity.get()
    }
  }
}
```

#### 3.2.2 메시지 컴포넌트 수정

```typescript
// frontend/components/chat/AnimatedMessage.tsx

'use client'

import { motion } from 'framer-motion'
import { useMessageSendAnimation } from '@/hooks/useMessageSendAnimation'

interface AnimatedMessageProps {
  message: Message
  index: number
  onAnimationComplete?: () => void
  children: React.ReactNode
}

export function AnimatedMessage({ 
  message, 
  index, 
  onAnimationComplete,
  children 
}: AnimatedMessageProps) {
  const isUserMessage = message.role === 'user'
  const { messageRef, translateY, opacity, isAnimating, shouldFadeIn } = useMessageSendAnimation({
    onAnimationComplete,
    messageIndex: index,
    isUserMessage
  })

  // 어시스턴트 메시지 페이드인
  const assistantFadeIn = !isUserMessage && shouldFadeIn

  return (
    <motion.div
      ref={messageRef}
      initial={assistantFadeIn ? { opacity: 0, y: 20 } : false}
      animate={assistantFadeIn ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.35,
        ease: 'easeOut'
      }}
      style={isUserMessage ? {
        transform: `translateY(${translateY.get()}px)`,
        opacity: opacity.get()
      } : {}}
      className={`flex ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      {children}
    </motion.div>
  )
}
```

### 3.3 플로팅 컴포저 (Glass Morphism)

#### 3.3.1 컴포저 컴포넌트

```typescript
// frontend/components/chat/FloatingComposer.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

interface FloatingComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
}

export function FloatingComposer({
  value,
  onChange,
  onSend,
  disabled,
  placeholder
}: FloatingComposerProps) {
  const [composerHeight, setComposerHeight] = useState(48)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const y = useMotionValue(0)
  const springY = useSpring(y, { stiffness: 300, damping: 30 })

  // 키보드 높이 감지
  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      const windowHeight = window.innerHeight
      const keyboardHeight = windowHeight - viewportHeight
      
      // 키보드가 열려있으면 컴포저를 위로 이동
      y.set(keyboardHeight > 0 ? -keyboardHeight : 0)
    }

    window.visualViewport?.addEventListener('resize', handleResize)
    return () => window.visualViewport?.removeEventListener('resize', handleResize)
  }, [y])

  // 텍스트 입력 높이 조정
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120)
      textareaRef.current.style.height = `${newHeight}px`
      setComposerHeight(newHeight)
    }
  }, [value])

  return (
    <motion.div
      style={{ y: springY }}
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 safe-area-pb"
    >
      <div className="max-w-3xl mx-auto">
        <div 
          className="relative backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl"
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
          }}
        >
          <div className="flex items-end gap-3 p-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    onSend()
                  }
                }}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className="w-full resize-none bg-transparent border-none outline-none text-base placeholder:text-slate-400 disabled:opacity-50 transition-all"
                style={{
                  minHeight: '48px',
                  maxHeight: '120px',
                }}
              />
            </div>
            <motion.button
              onClick={onSend}
              disabled={!value.trim() || disabled}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              전송 →
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
```

### 3.4 동적 높이 및 스크롤 관리

#### 3.4.1 Blank Size 훅

```typescript
// frontend/hooks/useMessageBlankSize.ts

import { useState, useEffect, useRef } from 'react'

export function useMessageBlankSize() {
  const [blankSize, setBlankSize] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const calculateBlankSize = () => {
      if (!messagesEndRef.current || !lastMessageRef.current) return

      const messagesEnd = messagesEndRef.current.getBoundingClientRect()
      const lastMessage = lastMessageRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight

      // 마지막 메시지 하단과 뷰포트 끝 사이의 거리
      const distance = viewportHeight - lastMessage.bottom
      setBlankSize(Math.max(0, distance))
    }

    calculateBlankSize()
    window.addEventListener('resize', calculateBlankSize)
    
    // 메시지 변경 시 재계산
    const observer = new MutationObserver(calculateBlankSize)
    if (messagesEndRef.current) {
      observer.observe(messagesEndRef.current, { childList: true, subtree: true })
    }

    return () => {
      window.removeEventListener('resize', calculateBlankSize)
      observer.disconnect()
    }
  }, [])

  return { blankSize, messagesEndRef, lastMessageRef }
}
```

#### 3.4.2 스크롤 컨테이너 수정

```typescript
// frontend/app/chat/page.tsx 수정

import { useMessageBlankSize } from '@/hooks/useMessageBlankSize'

export default function ChatPage() {
  const { blankSize, messagesEndRef, lastMessageRef } = useMessageBlankSize()
  const [composerHeight, setComposerHeight] = useState(80) // 컴포저 높이
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  // 키보드 높이 감지
  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      const windowHeight = window.innerHeight
      setKeyboardHeight(Math.max(0, windowHeight - viewportHeight))
    }

    window.visualViewport?.addEventListener('resize', handleResize)
    return () => window.visualViewport?.removeEventListener('resize', handleResize)
  }, [])

  // 메시지 영역 스타일
  const messagesContainerStyle = {
    paddingBottom: `${blankSize + composerHeight + keyboardHeight}px`
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 lg:py-6" style={messagesContainerStyle}>
      {/* 메시지 목록 */}
      {messages.map((message, index) => (
        <div
          key={index}
          ref={index === messages.length - 1 ? lastMessageRef : undefined}
        >
          {/* 메시지 내용 */}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
```

### 3.5 컴포저블 채팅 구조

#### 3.5.1 Context Provider 구조

```typescript
// frontend/contexts/ChatContext.tsx

'use client'

import { createContext, useContext, ReactNode } from 'react'

interface ChatContextValue {
  composerHeight: number
  setComposerHeight: (height: number) => void
  keyboardHeight: number
  setKeyboardHeight: (height: number) => void
  blankSize: number
  setBlankSize: (size: number) => void
  isStreaming: boolean
  setIsStreaming: (streaming: boolean) => void
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [composerHeight, setComposerHeight] = useState(80)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [blankSize, setBlankSize] = useState(0)
  const [isStreaming, setIsStreaming] = useState(false)

  return (
    <ChatContext.Provider value={{
      composerHeight,
      setComposerHeight,
      keyboardHeight,
      setKeyboardHeight,
      blankSize,
      setBlankSize,
      isStreaming,
      setIsStreaming
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider')
  }
  return context
}
```

#### 3.5.2 기능별 훅 분리

```typescript
// frontend/hooks/chat/useKeyboardAwareScroll.ts

import { useEffect } from 'react'
import { useChatContext } from '@/contexts/ChatContext'

export function useKeyboardAwareScroll() {
  const { keyboardHeight, blankSize, composerHeight } = useChatContext()
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!messagesContainerRef.current) return

    // 키보드가 열릴 때 스크롤 조정
    if (keyboardHeight > 0) {
      const container = messagesContainerRef.current
      const scrollDistance = blankSize + composerHeight + keyboardHeight
      
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [keyboardHeight, blankSize, composerHeight])

  return { messagesContainerRef }
}
```

### 3.6 재애니메이션 방지

```typescript
// frontend/components/chat/DisableFadeProvider.tsx

'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

const DisableFadeContext = createContext<{
  disabledMessageIds: Set<string>
  markAsSeen: (messageId: string) => void
}>({
  disabledMessageIds: new Set(),
  markAsSeen: () => {}
})

export function DisableFadeProvider({ children }: { children: ReactNode }) {
  const [disabledMessageIds, setDisabledMessageIds] = useState<Set<string>>(new Set())

  const markAsSeen = (messageId: string) => {
    setDisabledMessageIds(prev => new Set([...prev, messageId]))
  }

  return (
    <DisableFadeContext.Provider value={{ disabledMessageIds, markAsSeen }}>
      {children}
    </DisableFadeContext.Provider>
  )
}

export function useDisableFade() {
  return useContext(DisableFadeContext)
}
```

---

## 4. 우선순위 및 로드맵

### Phase 1: 핵심 UX 개선 (1주)

**목표**: 사용자가 가장 체감할 수 있는 개선 사항 우선 구현

1. **스트리밍 콘텐츠 스태거드 페이드 애니메이션** (3일)
   - `StaggeredFadeText` 컴포넌트 구현
   - 풀 기반 애니메이션 관리
   - 채팅 페이지 통합

2. **메시지 전송 애니메이션** (2일)
   - `useMessageSendAnimation` 훅 구현
   - `AnimatedMessage` 컴포넌트 구현
   - 통합 및 테스트

### Phase 2: 고급 UX 기능 (1주)

3. **플로팅 컴포저** (2일)
   - Glass Morphism 스타일 적용
   - 키보드 상태 감지 및 위치 조정
   - 컴포저 높이 동적 처리

4. **동적 높이 및 스크롤 관리** (3일)
   - `useMessageBlankSize` 훅 구현
   - 스크롤 컨테이너 수정
   - 키보드 인식 개선

### Phase 3: 아키텍처 개선 (1주)

5. **컴포저블 채팅 구조** (3일)
   - Context Provider 구조 구축
   - 기능별 훅 분리
   - 재애니메이션 방지 시스템

6. **통합 및 최적화** (2일)
   - 전체 통합 테스트
   - 성능 최적화
   - 에러 처리 강화

---

## 5. 기술 스택

### 필수 라이브러리

```json
{
  "dependencies": {
    "framer-motion": "^10.16.16", // 애니메이션
    "react-intersection-observer": "^9.5.3" // 스크롤 감지
  }
}
```

### 선택적 라이브러리

- `@react-spring/web`: 대안 애니메이션 라이브러리
- `react-use-measure`: 요소 크기 측정
- `use-gesture`: 제스처 처리

---

## 6. 예상 효과

### 사용자 경험
- ✅ 더 자연스러운 AI 응답 경험
- ✅ 메시지 전송의 시각적 피드백 강화
- ✅ 네이티브 앱 수준의 부드러운 느낌
- ✅ 모바일 경험 향상

### 기술적 이점
- ✅ 모듈화된 구조로 확장성 향상
- ✅ 재사용 가능한 컴포넌트 및 훅
- ✅ 성능 최적화된 애니메이션

---

**작성자**: AI Assistant  
**최종 업데이트**: 2024-12-19  
**다음 검토 예정일**: Phase 1 완료 후

