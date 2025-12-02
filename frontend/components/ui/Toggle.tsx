'use client'

import React from 'react'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4',
      label: 'text-sm',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
      label: 'text-sm',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
      label: 'text-base',
    },
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!disabled) onChange(!checked)
    }
  }

  return (
    <label
      className={`inline-flex items-start gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex flex-shrink-0 rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2
          ${sizes[size].track}
          ${checked ? 'bg-[#F78C3A]' : 'bg-slate-200'}
          ${disabled ? '' : 'hover:bg-opacity-90'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block rounded-full bg-white shadow-lg
            transform transition-transform duration-200 ease-in-out
            ${sizes[size].thumb}
            ${checked ? sizes[size].translate : 'translate-x-0.5'}
            mt-0.5
          `}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className={`font-medium text-slate-900 ${sizes[size].label}`}>
              {label}
            </span>
          )}
          {description && (
            <span className="text-sm text-slate-500 mt-0.5">{description}</span>
          )}
        </div>
      )}
    </label>
  )
}

export default Toggle
