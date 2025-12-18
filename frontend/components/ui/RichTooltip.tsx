'use client'

import { useState, useRef, cloneElement, isValidElement, ReactElement } from 'react'
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  arrow,
  FloatingArrow,
  Placement,
} from '@floating-ui/react'

export interface RichTooltipProps {
  children: ReactElement
  content: React.ReactNode
  placement?: Placement
  delay?: number
  maxWidth?: number
}

export function RichTooltip({
  children,
  content,
  placement = 'top',
  delay = 200,
  maxWidth = 300,
}: RichTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const arrowRef = useRef(null)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    middleware: [
      offset(10),
      flip({ fallbackAxisSideDirection: 'start' }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  })

  const hover = useHover(context, { delay: { open: delay, close: 0 } })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ])

  return (
    <>
      {isValidElement(children) &&
        cloneElement(children, {
          ref: refs.setReference,
          ...getReferenceProps(),
        } as any)}
      <FloatingPortal>
        {isOpen && (
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, maxWidth, zIndex: 9999 }}
            {...getFloatingProps()}
            className="px-3 py-2 text-sm bg-slate-900 dark:bg-slate-700 text-white rounded-lg shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
          >
            <FloatingArrow ref={arrowRef} context={context} fill="#1e293b" />
            {content}
          </div>
        )}
      </FloatingPortal>
    </>
  )
}

// KPI 설명 툴팁
export interface KPITooltipProps {
  children: ReactElement
  title: string
  description: string
  formula?: string
}

export function KPITooltip({
  children,
  title,
  description,
  formula,
}: KPITooltipProps) {
  return (
    <RichTooltip
      content={
        <div className="space-y-2">
          <p className="font-medium text-white">{title}</p>
          <p className="text-slate-300 text-xs">{description}</p>
          {formula && (
            <div className="bg-slate-800 rounded px-2 py-1 text-xs font-mono text-indigo-300">
              {formula}
            </div>
          )}
        </div>
      }
      maxWidth={280}
    >
      {children}
    </RichTooltip>
  )
}

// 상태 뱃지 툴팁
interface StatusTooltipProps {
  children: ReactElement
  status: string
  description: string
  lastUpdated?: string
}

export function StatusTooltip({
  children,
  status,
  description,
  lastUpdated,
}: StatusTooltipProps) {
  return (
    <RichTooltip
      content={
        <div className="space-y-1">
          <p className="font-medium text-white">{status}</p>
          <p className="text-slate-300 text-xs">{description}</p>
          {lastUpdated && (
            <p className="text-slate-400 text-xs">최근 업데이트: {lastUpdated}</p>
          )}
        </div>
      }
      maxWidth={250}
    >
      {children}
    </RichTooltip>
  )
}

