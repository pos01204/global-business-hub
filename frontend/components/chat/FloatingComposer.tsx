'use client'

import { useState, useRef, useEffect } from 'react'

interface FloatingComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
  isConnected?: boolean
}

/**
 * 플로팅 컴포저 (Glass Morphism)
 * iOS 26 iMessage 스타일의 반투명 떠있는 컴포저
 */
export function FloatingComposer({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
  isConnected = true
}: FloatingComposerProps) {
  const [composerHeight, setComposerHeight] = useState(48)
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 키보드 높이 감지
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined' || !window.visualViewport) return

      const viewportHeight = window.visualViewport.height
      const windowHeight = window.innerHeight
      const keyboardHeight = Math.max(0, windowHeight - viewportHeight)
      
      // 키보드가 열려있으면 컴포저를 위로 이동
      setKeyboardOffset(keyboardHeight > 0 ? keyboardHeight : 0)
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 텍스트 입력 높이 조정
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120)
      textareaRef.current.style.height = `${newHeight}px`
      setComposerHeight(newHeight + 16) // padding 포함
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSend()
      }
    }
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 safe-area-pb transition-transform duration-300 ease-out"
      style={{
        transform: `translateY(-${keyboardOffset}px)`
      }}
    >
      <div className="max-w-3xl mx-auto">
        <div 
          className="relative rounded-2xl shadow-2xl border backdrop-blur-xl"
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            borderColor: 'rgba(148, 163, 184, 0.3)',
          }}
        >
          <div className="flex items-end gap-3 p-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || '메시지를 입력하세요...'}
                disabled={disabled || !isConnected}
                rows={1}
                className="w-full resize-none bg-transparent border-none outline-none text-base placeholder:text-slate-400 disabled:opacity-50 transition-all text-slate-900"
                style={{
                  minHeight: '48px',
                  maxHeight: '120px',
                }}
              />
            </div>
            <button
              onClick={onSend}
              disabled={!value.trim() || disabled || !isConnected}
              className="px-5 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              전송 →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

