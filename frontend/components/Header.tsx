'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { ThemeToggle } from './ui/ThemeToggle'
import { BrandAvatar } from './brand'

interface Notification {
  id: string
  type: 'warning' | 'info' | 'success'
  title: string
  message: string
  time: string
  read: boolean
  link?: string
}

// 샘플 알림 데이터
const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: '미입고 알림',
    message: '7일 이상 미입고 주문 5건이 있습니다',
    time: '10분 전',
    read: false,
    link: '/unreceived?delay=critical',
  },
  {
    id: '2',
    type: 'info',
    title: 'QC 검수 대기',
    message: '검수 대기 중인 상품 12건',
    time: '30분 전',
    read: false,
    link: '/qc',
  },
  {
    id: '3',
    type: 'success',
    title: '정산 완료',
    message: '11월 물류비 정산이 완료되었습니다',
    time: '2시간 전',
    read: true,
    link: '/settlement',
  },
]

export default function Header() {
  const router = useRouter()
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState(sampleNotifications)
  const searchRef = useRef<HTMLInputElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 검색 실행
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/lookup?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // 알림 읽음 처리
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  // 모든 알림 읽음 처리
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const notificationIcons = {
    warning: '🚨',
    info: '📋',
    success: '✅',
  }

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        {/* 검색 바 - 데스크톱 */}
        <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-xl">
          <div className="relative">
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색... (주문번호, 사용자 ID, 작가명 등)"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800
                focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#F78C3A] focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30
                transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>

        {/* 검색 버튼 - 모바일 */}
        <button
          onClick={() => router.push('/lookup')}
          className="md:hidden p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="검색"
        >
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* 우측 메뉴 */}
        <div className="flex items-center gap-1 md:gap-2 ml-auto md:ml-6">
          {/* 테마 토글 */}
          <ThemeToggle />

          {/* 알림 */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="알림"
            >
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* 알림 드롭다운 */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-slideDown z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">알림</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-[#F78C3A] hover:text-orange-600 font-medium"
                    >
                      모두 읽음
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <Link
                        key={notification.id}
                        href={notification.link || '#'}
                        onClick={() => {
                          markAsRead(notification.id)
                          setShowNotifications(false)
                        }}
                        className={`
                          flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                          ${!notification.read ? 'bg-orange-50/50 dark:bg-orange-900/20' : ''}
                        `}
                      >
                        <span className="text-lg flex-shrink-0">
                          {notificationIcons[notification.type]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-slate-900 dark:text-slate-100`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-[#F78C3A] rounded-full flex-shrink-0 mt-2" />
                        )}
                      </Link>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                      <span className="text-3xl block mb-2">🔔</span>
                      <p className="text-sm">새로운 알림이 없습니다</p>
                    </div>
                  )}
                </div>
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="block px-4 py-3 text-center text-sm text-[#F78C3A] hover:bg-slate-50 dark:hover:bg-slate-800 border-t border-slate-100 dark:border-slate-800 font-medium"
                >
                  모든 알림 보기
                </Link>
              </div>
            )}
          </div>

          {/* 사용자 메뉴 */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm"
            >
              <BrandAvatar
                src={session?.user?.image}
                name={session?.user?.name}
                email={session?.user?.email}
                size="sm"
              />
              <div className="hidden md:block text-left max-w-[120px]">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate leading-tight">
                  {session?.user?.name || '사용자'}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight">
                  {session?.user?.email?.split('@')[0] || ''}
                </p>
              </div>
              <svg
                className={`hidden md:block w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 사용자 드롭다운 메뉴 */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-slideDown">
                {/* 프로필 헤더 */}
                <div className="px-4 py-4 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-800/50">
                  <div className="flex items-center gap-3">
                    <BrandAvatar
                      src={session?.user?.image}
                      name={session?.user?.name}
                      email={session?.user?.email}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {session?.user?.name || '사용자'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {session?.user?.email || ''}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* 로그아웃 버튼 */}
                <div className="p-2">
                  <button
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                    onClick={() => {
                      setShowUserMenu(false)
                      signOut({ callbackUrl: '/login' })
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
