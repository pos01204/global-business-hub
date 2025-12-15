'use client'

import { EnhancedLoadingPage } from './EnhancedLoadingPage'

// 페이지별 커스텀 로딩 상태
export const LoadingStates = {
  // 기본 로딩
  default: (message?: string) => (
    <EnhancedLoadingPage
      message={message || '데이터를 불러오는 중...'}
      variant="default"
      size="md"
    />
  ),

  // 전체 화면 로딩
  fullscreen: (message?: string) => (
    <EnhancedLoadingPage
      message={message || '데이터를 불러오는 중...'}
      variant="fullscreen"
      size="lg"
    />
  ),

  // 미니멀 로딩 (작은 영역, 캐릭터 없음)
  minimal: (message?: string) => (
    <EnhancedLoadingPage
      message={message || '로딩 중...'}
      variant="minimal"
      size="sm"
      showCharacter={false}
      animate={false}
    />
  ),

  // 파일 업로드 중 (진행률 표시)
  uploading: (progress?: number, message?: string) => (
    <EnhancedLoadingPage
      message={message || '파일을 업로드하는 중...'}
      progress={progress}
      variant="default"
      size="md"
    />
  ),
}

