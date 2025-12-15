'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Container } from './Container'
import { cn } from '@/lib/utils'

interface SectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  container?: boolean
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const spacingMap = {
  sm: 'mb-8',
  md: 'mb-12',
  lg: 'mb-16',
  xl: 'mb-24',
}

export function Section({
  title,
  description,
  children,
  container = true,
  containerSize = 'xl',
  spacing = 'md',
  className,
}: SectionProps) {
  const content = (
    <>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-slate-600 dark:text-slate-400">{description}</p>
          )}
        </div>
      )}
      {children}
    </>
  )

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(spacingMap[spacing], className)}
    >
      {container ? (
        <Container size={containerSize}>{content}</Container>
      ) : (
        content
      )}
    </motion.section>
  )
}

