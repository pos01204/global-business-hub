'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { BottomNavigation } from './BottomNavigation'
import { ToastProvider } from './ui/Toast'

// Skip Link 컴포넌트 (접근성)
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      tabIndex={0}
    >
      본문으로 건너뛰기
    </a>
  )
}

// 키보드 단축키 훅
function useKeyboardShortcuts() {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl/Cmd + K: 검색 포커스
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      const searchInput = document.querySelector('input[type="text"][placeholder*="검색"]') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
    }
    
    // Ctrl/Cmd + /: 도움말 (키보드 단축키 안내)
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault()
      // 키보드 단축키 모달 표시 (추후 구현)
      console.log('키보드 단축키: Ctrl+K (검색), Ctrl+/ (도움말)')
    }

    // Escape: 모달/드롭다운 닫기
    if (e.key === 'Escape') {
      const activeElement = document.activeElement as HTMLElement
      if (activeElement) {
        activeElement.blur()
      }
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const isLoginPage = pathname === '/login'

  // 키보드 단축키 활성화
  useKeyboardShortcuts()

  // 로그인 페이지는 레이아웃 없이 렌더링
  if (isLoginPage) {
    return <>{children}</>
  }

  // 홈페이지는 전체 레이아웃 사용
  if (isHomePage) {
    return (
      <ToastProvider>
        <SkipLink />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900">
          <div id="main-content" className="max-w-7xl mx-auto p-4 lg:p-8" tabIndex={-1}>
            {children}
          </div>
        </div>
      </ToastProvider>
    )
  }

  // 다른 페이지는 사이드바 + 헤더 레이아웃 사용
  return (
    <ToastProvider>
      <SkipLink />
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
        {/* 사이드바: 데스크톱에서만 표시 */}
        <nav className="hidden lg:block" aria-label="메인 네비게이션">
          <Sidebar />
        </nav>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main 
            id="main-content" 
            className="flex-1 overflow-y-auto pb-20 lg:pb-0"
            tabIndex={-1}
            aria-label="메인 콘텐츠"
          >
            <div className="p-4 lg:p-6">{children}</div>
          </main>
        </div>
        
        {/* 하단 네비: 모바일에서만 표시 */}
        <BottomNavigation />
      </div>
    </ToastProvider>
  )
}

