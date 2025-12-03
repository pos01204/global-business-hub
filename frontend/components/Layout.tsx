'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'
import { BottomNavigation } from './BottomNavigation'
import { ToastProvider } from './ui/Toast'

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const isLoginPage = pathname === '/login'

  // 로그인 페이지는 레이아웃 없이 렌더링
  if (isLoginPage) {
    return <>{children}</>
  }

  // 홈페이지는 전체 레이아웃 사용
  if (isHomePage) {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900">
          <div className="max-w-7xl mx-auto p-4 lg:p-8">{children}</div>
        </div>
      </ToastProvider>
    )
  }

  // 다른 페이지는 사이드바 + 헤더 레이아웃 사용
  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
        {/* 사이드바: 데스크톱에서만 표시 */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            <div className="p-4 lg:p-6">{children}</div>
          </main>
        </div>
        
        {/* 하단 네비: 모바일에서만 표시 */}
        <BottomNavigation />
      </div>
    </ToastProvider>
  )
}

