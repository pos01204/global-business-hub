'use client'

import React from 'react'
import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
  className?: string
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator,
  className = '',
}) => {
  const defaultSeparator = (
    <svg
      className="w-4 h-4 text-slate-400 dark:text-slate-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  )

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center flex-wrap gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 flex-shrink-0" aria-hidden="true">
                  {separator || defaultSeparator}
                </span>
              )}
              {isLast ? (
                <span
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-slate-100"
                  aria-current="page"
                >
                  {item.icon}
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-[#F78C3A] transition-colors"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  {item.icon}
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb
