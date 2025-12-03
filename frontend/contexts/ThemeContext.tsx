'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: ResolvedTheme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
  const [mounted, setMounted] = useState(false)

  // 초기 테마 로드
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('gb-hub-theme') as Theme | null
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setThemeState(saved)
    }
  }, [])

  // 테마 적용
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    let resolved: ResolvedTheme = 'light'

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      resolved = mediaQuery.matches ? 'dark' : 'light'
      
      // 시스템 테마 변경 감지
      const handler = (e: MediaQueryListEvent) => {
        const newResolved = e.matches ? 'dark' : 'light'
        setResolvedTheme(newResolved)
        root.classList.remove('light', 'dark')
        root.classList.add(newResolved)
      }
      mediaQuery.addEventListener('change', handler)
      
      root.classList.remove('light', 'dark')
      root.classList.add(resolved)
      setResolvedTheme(resolved)
      
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      resolved = theme
      root.classList.remove('light', 'dark')
      root.classList.add(resolved)
      setResolvedTheme(resolved)
    }
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('gb-hub-theme', newTheme)
  }

  // SSR 중에는 기본값 반환
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'system', setTheme: () => {}, resolvedTheme: 'light' }}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
