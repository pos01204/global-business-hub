'use client'

import { useEffect } from 'react'
import { Icon } from '@/components/ui/Icon'
import { X, Command, Keyboard } from 'lucide-react'
import { defaultShortcuts } from '@/hooks/useKeyboardShortcuts'

interface KeyboardShortcutHelpProps {
  isOpen: boolean
  onClose: () => void
}

// 단축키 표시 컴포넌트
function KeyCombo({ keys }: { keys: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {keys.map((key, idx) => (
        <span key={idx}>
          {idx > 0 && <span className="text-slate-400 mx-1">+</span>}
          <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-xs font-mono font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shadow-sm">
            {key}
          </kbd>
        </span>
      ))}
    </div>
  )
}

export function KeyboardShortcutHelp({ isOpen, onClose }: KeyboardShortcutHelpProps) {
  // ESC로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // 카테고리별 단축키 그룹화
  const navigationShortcuts = defaultShortcuts.filter(s => /^[1-8]$/.test(s.key))
  const actionShortcuts = defaultShortcuts.filter(s => s.ctrl)
  const otherShortcuts = defaultShortcuts.filter(s => !s.ctrl && !/^[1-8]$/.test(s.key))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 모달 */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-idus-100 dark:bg-idus-900/30 flex items-center justify-center">
              <Icon icon={Keyboard} size="md" className="text-idus-600 dark:text-idus-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                키보드 단축키
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                빠른 네비게이션을 위한 단축키
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Icon icon={X} size="md" className="text-slate-500" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-5 overflow-y-auto max-h-[60vh] space-y-6">
          {/* 네비게이션 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
              탭 네비게이션
            </h3>
            <div className="space-y-2">
              {navigationShortcuts.map((shortcut, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {shortcut.description}
                  </span>
                  <KeyCombo keys={[shortcut.key]} />
                </div>
              ))}
            </div>
          </div>

          {/* 빠른 액션 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
              빠른 액션
            </h3>
            <div className="space-y-2">
              {actionShortcuts.map((shortcut, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {shortcut.description}
                  </span>
                  <KeyCombo keys={[
                    navigator.platform.includes('Mac') ? '⌘' : 'Ctrl',
                    shortcut.key.toUpperCase()
                  ]} />
                </div>
              ))}
            </div>
          </div>

          {/* 기타 */}
          {otherShortcuts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
                기타
              </h3>
              <div className="space-y-2">
                {otherShortcuts.map((shortcut, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {shortcut.description}
                    </span>
                    <KeyCombo keys={[shortcut.key]} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            <KeyCombo keys={[navigator.platform.includes('Mac') ? '⌘' : 'Ctrl', '/']} />
            <span className="ml-2">를 눌러 이 도움말을 열거나 닫을 수 있습니다</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcutHelp

