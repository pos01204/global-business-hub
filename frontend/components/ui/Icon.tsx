// components/ui/Icon.tsx
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconProps {
  icon: LucideIcon
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
}

const variantMap = {
  default: 'text-slate-600 dark:text-slate-400',
  primary: 'text-idus-500 dark:text-idus-400',
  success: 'text-success dark:text-success',
  warning: 'text-warning dark:text-warning',
  danger: 'text-danger dark:text-danger',
}

export function Icon({ 
  icon: IconComponent, 
  size = 'md', 
  className,
  variant = 'default'
}: IconProps) {
  return (
    <IconComponent 
      className={cn(sizeMap[size], variantMap[variant], className)}
      aria-hidden="true"
      role="img"
    />
  )
}

