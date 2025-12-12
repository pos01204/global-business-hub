'use client'

import { Component, ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

// FadeIn 컴포넌트는 page.tsx에 정의되어 있으므로 인라인으로 정의
function FadeIn({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <div className={`animate-fade-in ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: any
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary] 에러 발생:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <FadeIn>
          <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
                  오류가 발생했습니다
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    다시 시도
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm"
                  >
                    페이지 새로고침
                  </button>
                </div>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded text-xs">
                    <summary className="cursor-pointer text-red-800 dark:text-red-400 font-medium">
                      개발자 정보 (클릭하여 확장)
                    </summary>
                    <pre className="mt-2 text-red-700 dark:text-red-300 overflow-auto">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </Card>
        </FadeIn>
      )
    }

    return this.props.children
  }
}

