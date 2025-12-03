'use client'

import React, { useEffect, useRef } from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'
export type MobileVariant = 'center' | 'bottom-sheet' | 'fullscreen'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: ModalSize
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  /** 모바일에서의 표시 방식 (기본: bottom-sheet) */
  mobileVariant?: MobileVariant
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
  footer,
  className = '',
  mobileVariant = 'bottom-sheet',
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  // ESC 키로 닫기
  useEffect(() => {
    if (!closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  // 모달 열릴 때 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // 포커스 트랩
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTab)
    firstElement?.focus()

    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  }

  // 모바일 바텀시트 스타일
  const getMobileStyles = () => {
    if (!isMobile) return ''
    
    switch (mobileVariant) {
      case 'bottom-sheet':
        return 'fixed bottom-0 left-0 right-0 rounded-t-2xl rounded-b-none max-h-[85vh] w-full max-w-none animate-slideUpFromBottom'
      case 'fullscreen':
        return 'fixed inset-0 rounded-none max-h-full w-full max-w-none'
      case 'center':
      default:
        return ''
    }
  }

  // 모바일 컨테이너 스타일
  const getContainerStyles = () => {
    if (isMobile && mobileVariant === 'bottom-sheet') {
      return 'fixed inset-0 z-50 flex items-end justify-center'
    }
    if (isMobile && mobileVariant === 'fullscreen') {
      return 'fixed inset-0 z-50'
    }
    return 'fixed inset-0 z-50 flex items-center justify-center p-4'
  }

  return (
    <div
      className={getContainerStyles()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className={`
          relative w-full ${!isMobile ? sizes[size] : ''} ${!isMobile ? 'max-h-[90vh]' : ''}
          bg-white dark:bg-slate-900 rounded-2xl shadow-2xl
          ${!isMobile ? 'animate-slideUp' : ''} overflow-hidden
          ${getMobileStyles()}
          ${className}
        `}
      >
        {/* 바텀시트 드래그 핸들 (모바일) */}
        {isMobile && mobileVariant === 'bottom-sheet' && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className={`flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-orange-50 to-white dark:from-slate-800 dark:to-slate-900 ${isMobile && mobileVariant === 'bottom-sheet' ? 'pt-2' : ''}`}>
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 -m-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={`p-5 overflow-y-auto ${isMobile && mobileVariant === 'bottom-sheet' ? 'max-h-[calc(85vh-140px)]' : isMobile && mobileVariant === 'fullscreen' ? 'max-h-[calc(100vh-140px)]' : 'max-h-[calc(90vh-140px)]'} ${isMobile ? 'pb-safe' : ''}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 ${isMobile ? 'pb-safe' : ''}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
