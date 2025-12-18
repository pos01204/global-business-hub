'use client'

import Image from 'next/image'
import { getDefaultProfile } from '@/lib/brand-assets'
import { cn } from '@/lib/utils'

interface BrandAvatarProps {
  /** 사용자 이미지 URL */
  src?: string | null
  /** 사용자 이름 */
  name?: string
  /** 사용자 이메일 (프로필 선택에 사용) */
  email?: string
  /** 아바타 크기 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** 추가 클래스명 */
  className?: string
  /** 테두리 표시 여부 */
  bordered?: boolean
  /** 온라인 상태 표시 */
  status?: 'online' | 'offline' | 'busy' | 'away'
}

const sizeMap = {
  xs: { container: 'w-6 h-6', image: 24, text: 'text-[10px]', status: 'w-1.5 h-1.5' },
  sm: { container: 'w-8 h-8', image: 32, text: 'text-xs', status: 'w-2 h-2' },
  md: { container: 'w-10 h-10', image: 40, text: 'text-sm', status: 'w-2.5 h-2.5' },
  lg: { container: 'w-12 h-12', image: 48, text: 'text-base', status: 'w-3 h-3' },
  xl: { container: 'w-16 h-16', image: 64, text: 'text-lg', status: 'w-3.5 h-3.5' },
}

const statusColors = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-400',
  busy: 'bg-red-500',
  away: 'bg-amber-500',
}

/**
 * 브랜드 아바타 컴포넌트
 * 사용자 이미지가 없을 경우 브랜드 프로필 아이콘 사용
 */
export function BrandAvatar({
  src,
  name,
  email,
  size = 'md',
  className,
  bordered = false,
  status,
}: BrandAvatarProps) {
  const { container, image, text, status: statusSize } = sizeMap[size]
  
  // 이미지가 있으면 사용, 없으면 브랜드 프로필 아이콘
  const imageSrc = src || getDefaultProfile(email || name || 'default')
  
  // 이니셜 (폴백용)
  const initial = name?.[0] || email?.[0] || 'U'

  return (
    <div className={cn('relative inline-flex', className)}>
      <div
        className={cn(
          container,
          'relative rounded-full overflow-hidden flex-shrink-0',
          bordered && 'ring-2 ring-white dark:ring-slate-800 shadow-sm',
        )}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={name || 'Profile'}
            width={image}
            height={image}
            className="object-cover w-full h-full"
          />
        ) : (
          // 이미지 로드 실패 시 이니셜 폴백
          <div
            className={cn(
              'w-full h-full flex items-center justify-center',
              'bg-gradient-to-br from-[#F78C3A] to-[#E67729]',
              'text-white font-semibold',
              text,
            )}
          >
            {initial.toUpperCase()}
          </div>
        )}
      </div>
      
      {/* 상태 표시 */}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-800',
            statusSize,
            statusColors[status],
          )}
        />
      )}
    </div>
  )
}

/**
 * 아바타 그룹 컴포넌트
 */
interface BrandAvatarGroupProps {
  /** 아바타 목록 */
  avatars: Array<{
    src?: string | null
    name?: string
    email?: string
  }>
  /** 최대 표시 개수 */
  max?: number
  /** 아바타 크기 */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** 추가 클래스명 */
  className?: string
}

export function BrandAvatarGroup({
  avatars,
  max = 4,
  size = 'sm',
  className,
}: BrandAvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max
  const { container, text } = sizeMap[size]

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleAvatars.map((avatar, index) => (
        <BrandAvatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          email={avatar.email}
          size={size}
          bordered
          className="hover:z-10 transition-transform hover:scale-110"
        />
      ))}
      
      {remainingCount > 0 && (
        <div
          className={cn(
            container,
            'relative rounded-full flex items-center justify-center',
            'bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800',
            'text-slate-600 dark:text-slate-300 font-medium',
            text,
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}

export default BrandAvatar

