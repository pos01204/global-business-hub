'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: boolean
  className?: string
}

const sizeMap = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[1280px]',
  full: 'max-w-full',
}

export function Container({
  children,
  size = 'xl',
  padding = true,
  className,
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        sizeMap[size],
        padding && 'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  )
}

