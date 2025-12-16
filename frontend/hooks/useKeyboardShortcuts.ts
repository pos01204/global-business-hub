/**
 * 키보드 단축키 훅
 * Business Brain v6.0
 */

import { useEffect, useCallback, useState } from 'react'

// 단축키 정의
export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
  description: string
  action: () => void
}

// 기본 단축키 설정
export const defaultShortcuts: Omit<KeyboardShortcut, 'action'>[] = [
  { key: 'k', ctrl: true, description: '빠른 검색 열기' },
  { key: 'b', ctrl: true, description: 'AI 브리핑 새로고침' },
  { key: 'e', ctrl: true, description: 'CSV 내보내기' },
  { key: 'p', ctrl: true, description: 'PDF 리포트 생성' },
  { key: '/', ctrl: true, description: '단축키 도움말' },
  { key: '1', description: '홈 탭으로 이동' },
  { key: '2', description: '고객 탭으로 이동' },
  { key: '3', description: '작가 탭으로 이동' },
  { key: '4', description: '매출 탭으로 이동' },
  { key: '5', description: '인사이트 탭으로 이동' },
  { key: '6', description: '액션 탭으로 이동' },
  { key: '7', description: '탐색기 탭으로 이동' },
  { key: '8', description: '리포트 탭으로 이동' },
  { key: 'Escape', description: '모달/패널 닫기' },
]

// 단축키 훅
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 입력 필드에서는 단축키 비활성화
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true
      const altMatch = shortcut.alt ? event.altKey : !event.altKey
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
      const metaMatch = shortcut.meta ? event.metaKey : true

      if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
        event.preventDefault()
        shortcut.action()
        return
      }
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// 단축키 도움말 모달 훅
export function useShortcutHelp() {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  // Ctrl+/ 또는 ?로 도움말 열기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.key === '/' && (event.ctrlKey || event.metaKey)) ||
        (event.key === '?' && event.shiftKey)
      ) {
        event.preventDefault()
        toggle()
      }
      if (event.key === 'Escape' && isOpen) {
        close()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, toggle, close])

  return { isOpen, open, close, toggle }
}

// 탭 네비게이션 단축키 훅
export function useTabShortcuts(
  onTabChange: (tabId: string) => void,
  tabIds: string[] = ['home', 'customer', 'artist', 'revenue', 'insight', 'action', 'explorer', 'report']
) {
  const shortcuts: KeyboardShortcut[] = tabIds.map((tabId, index) => ({
    key: String(index + 1),
    description: `${tabId} 탭으로 이동`,
    action: () => onTabChange(tabId),
  }))

  useKeyboardShortcuts(shortcuts)
}

export default useKeyboardShortcuts

