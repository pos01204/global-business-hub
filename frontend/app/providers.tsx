'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { useState } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1분
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              // 네트워크 오류나 4xx 오류는 재시도하지 않음
              if (error?.name === 'NetworkError' || error?.name?.startsWith('HTTP4')) {
                return false
              }
              // 그 외의 경우 최대 2번 재시도
              return failureCount < 2
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: false, // mutation은 재시도하지 않음
          },
        },
      })
  )

  return (
    <SessionProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}


