/**
 * 공통 Hover 효과 유틸리티 클래스
 * 전체 허브에서 일관된 인터랙션 경험 제공
 */

export const hoverEffects = {
  // 카드 호버 - 부드러운 상승 + 그림자
  card: `
    transition-all duration-300 ease-out
    hover:shadow-lg hover:shadow-indigo-500/10
    hover:-translate-y-1
    hover:border-indigo-200 dark:hover:border-indigo-800
    cursor-pointer
  `.trim().replace(/\s+/g, ' '),

  // 버튼 호버 - 스케일 + 글로우
  button: `
    transition-all duration-200
    hover:scale-[1.02]
    hover:shadow-md hover:shadow-indigo-500/25
    active:scale-[0.98]
  `.trim().replace(/\s+/g, ' '),

  // 테이블 행 호버 - 좌측 강조선 + 배경
  tableRow: `
    transition-all duration-200
    hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20
  `.trim().replace(/\s+/g, ' '),

  // 아이콘 버튼 호버 - 회전 + 색상
  iconButton: `
    transition-all duration-300
    hover:rotate-12 hover:text-indigo-600
    hover:bg-indigo-50 dark:hover:bg-indigo-900/30
    rounded-full p-2
  `.trim().replace(/\s+/g, ' '),

  // 네비게이션 링크 호버 - 밑줄 애니메이션
  navLink: `
    relative
    after:absolute after:bottom-0 after:left-0
    after:h-0.5 after:w-0 after:bg-indigo-500
    after:transition-all after:duration-300
    hover:after:w-full
    hover:text-indigo-600
  `.trim().replace(/\s+/g, ' '),

  // 이미지 컨테이너 호버 - 줌 인
  imageContainer: `
    overflow-hidden rounded-lg
    [&_img]:transition-transform [&_img]:duration-500
    [&_img]:hover:scale-110
  `.trim().replace(/\s+/g, ' '),

  // 탭 호버 - 배경 슬라이드
  tab: `
    relative z-10
    transition-all duration-200
    hover:bg-indigo-50 dark:hover:bg-indigo-900/30
    hover:text-indigo-600 dark:hover:text-indigo-400
  `.trim().replace(/\s+/g, ' '),

  // KPI 카드 호버 - 테두리 그라데이션
  kpiCard: `
    transition-all duration-300 ease-out
    hover:shadow-xl hover:shadow-indigo-500/15
    hover:-translate-y-0.5
    hover:border-indigo-300 dark:hover:border-indigo-700
  `.trim().replace(/\s+/g, ' '),

  // 리스트 아이템 호버
  listItem: `
    transition-colors duration-200
    hover:bg-slate-50 dark:hover:bg-slate-800/50
  `.trim().replace(/\s+/g, ' '),

  // 뱃지 호버
  badge: `
    transition-all duration-200
    hover:scale-105 hover:shadow-sm
  `.trim().replace(/\s+/g, ' '),

  // 입력 필드 포커스
  input: `
    transition-all duration-200
    focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
    hover:border-slate-400 dark:hover:border-slate-500
  `.trim().replace(/\s+/g, ' '),

  // 드롭다운 메뉴 아이템
  dropdownItem: `
    transition-colors duration-150
    hover:bg-indigo-50 dark:hover:bg-indigo-900/30
    hover:text-indigo-700 dark:hover:text-indigo-300
  `.trim().replace(/\s+/g, ' '),
}

// Framer Motion용 카드 hover variants (EnhancedKPICard에서 사용)
export const cardHoverVariants = {
  initial: {
    y: 0,
    scale: 1,
    boxShadow: '0 0 0 rgba(15,23,42,0)',
  },
  hover: {
    y: -4,
    scale: 1.01,
    boxShadow: '0 20px 25px -5px rgba(15,23,42,0.15)',
  },
}

// 조합 헬퍼
export const combineHoverEffects = (...effects: string[]) => {
  return effects.join(' ')
}

