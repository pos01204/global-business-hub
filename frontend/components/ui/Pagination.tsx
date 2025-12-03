'use client'

import React from 'react'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  siblingCount?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  siblingCount = 1,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: 'h-7 min-w-7 text-xs',
    md: 'h-9 min-w-9 text-sm',
    lg: 'h-11 min-w-11 text-base',
  }

  // 페이지 범위 계산
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const leftSibling = Math.max(currentPage - siblingCount, 1)
    const rightSibling = Math.min(currentPage + siblingCount, totalPages)

    const showLeftEllipsis = leftSibling > 2
    const showRightEllipsis = rightSibling < totalPages - 1

    if (!showLeftEllipsis && showRightEllipsis) {
      // 왼쪽에 ellipsis 없음
      for (let i = 1; i <= Math.min(3 + siblingCount * 2, totalPages); i++) {
        pages.push(i)
      }
      if (totalPages > 3 + siblingCount * 2) {
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    } else if (showLeftEllipsis && !showRightEllipsis) {
      // 오른쪽에 ellipsis 없음
      pages.push(1)
      pages.push('ellipsis')
      for (let i = Math.max(totalPages - 2 - siblingCount * 2, 1); i <= totalPages; i++) {
        pages.push(i)
      }
    } else if (showLeftEllipsis && showRightEllipsis) {
      // 양쪽에 ellipsis
      pages.push(1)
      pages.push('ellipsis')
      for (let i = leftSibling; i <= rightSibling; i++) {
        pages.push(i)
      }
      pages.push('ellipsis')
      pages.push(totalPages)
    } else {
      // ellipsis 없음
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    }

    return pages
  }

  if (totalPages <= 1) return null

  const pages = getPageNumbers()

  const buttonBase = `
    inline-flex items-center justify-center rounded-lg font-medium
    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1
  `

  const buttonStyles = {
    default: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
    active: 'bg-[#F78C3A] text-white shadow-sm',
    nav: 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300',
  }

  return (
    <nav
      className={`flex items-center justify-center gap-1 ${className}`}
      aria-label="페이지네이션"
    >
      {/* 처음으로 */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`${buttonBase} ${buttonStyles.nav} ${sizes[size]} px-2`}
          aria-label="처음 페이지"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 이전 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${buttonBase} ${buttonStyles.nav} ${sizes[size]} px-2`}
        aria-label="이전 페이지"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 페이지 번호 */}
      {pages.map((page, idx) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${idx}`}
            className={`${sizes[size]} flex items-center justify-center text-slate-400`}
          >
            ⋯
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              ${buttonBase}
              ${currentPage === page ? buttonStyles.active : buttonStyles.default}
              ${sizes[size]} px-3
            `}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      {/* 다음 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${buttonBase} ${buttonStyles.nav} ${sizes[size]} px-2`}
        aria-label="다음 페이지"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 마지막으로 */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`${buttonBase} ${buttonStyles.nav} ${sizes[size]} px-2`}
          aria-label="마지막 페이지"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </nav>
  )
}

export default Pagination
