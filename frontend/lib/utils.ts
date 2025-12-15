// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 클래스 이름을 병합하는 유틸리티 함수
 * clsx로 조건부 클래스를 처리하고, tailwind-merge로 충돌하는 Tailwind 클래스를 병합
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

