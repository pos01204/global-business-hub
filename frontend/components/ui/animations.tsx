/**
 * UI 애니메이션 컴포넌트
 * FadeIn, AnimatedNumber 등 재사용 가능한 애니메이션 컴포넌트
 */

'use client'

import { ReactNode, useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

// ==================== FadeIn 컴포넌트 ====================

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}

export function FadeIn({
  children,
  delay = 0,
  duration = 300,
  className,
  direction = 'up',
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up': return 'translateY(20px)'
        case 'down': return 'translateY(-20px)'
        case 'left': return 'translateX(20px)'
        case 'right': return 'translateX(-20px)'
        default: return 'none'
      }
    }
    return 'none'
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
      }}
    >
      {children}
    </div>
  )
}

// ==================== AnimatedNumber 컴포넌트 ====================

interface AnimatedNumberProps {
  value: number
  duration?: number
  formatter?: (value: number) => string
  className?: string
}

export function AnimatedNumber({
  value,
  duration = 1000,
  formatter = (v) => v.toLocaleString(),
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const startValueRef = useRef(0)

  useEffect(() => {
    startValueRef.current = displayValue
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValueRef.current + (value - startValueRef.current) * easeProgress

      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <span className={className}>
      {formatter(Math.round(displayValue))}
    </span>
  )
}

// ==================== SlideIn 컴포넌트 ====================

interface SlideInProps {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: 'left' | 'right' | 'up' | 'down'
  className?: string
}

export function SlideIn({
  children,
  delay = 0,
  duration = 300,
  direction = 'left',
  className,
}: SlideInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const getInitialTransform = () => {
    switch (direction) {
      case 'left': return 'translateX(-100%)'
      case 'right': return 'translateX(100%)'
      case 'up': return 'translateY(-100%)'
      case 'down': return 'translateY(100%)'
    }
  }

  return (
    <div
      className={className}
      style={{
        transform: isVisible ? 'none' : getInitialTransform(),
        transition: `transform ${duration}ms ease-out`,
      }}
    >
      {children}
    </div>
  )
}

// ==================== ScaleIn 컴포넌트 ====================

interface ScaleInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 300,
  className,
}: ScaleInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.9)',
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
      }}
    >
      {children}
    </div>
  )
}

// ==================== Pulse 컴포넌트 ====================

interface PulseProps {
  children: ReactNode
  className?: string
}

export function Pulse({ children, className }: PulseProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      {children}
    </div>
  )
}

// ==================== Stagger 컨테이너 ====================

interface StaggerContainerProps {
  children: ReactNode
  staggerDelay?: number
  className?: string
}

export function StaggerContainer({
  children,
  staggerDelay = 50,
  className,
}: StaggerContainerProps) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <FadeIn key={index} delay={index * staggerDelay}>
              {child}
            </FadeIn>
          ))
        : children}
    </div>
  )
}

export default FadeIn

