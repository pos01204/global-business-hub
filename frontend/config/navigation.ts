// frontend/config/navigation.ts
// 네비게이션 구조 정의 (Phase 4: IA 재설계)

import {
  LayoutDashboard,
  Package,
  Truck,
  Radio,
  Receipt,
  CheckSquare,
  FileText,
  Search,
  BarChart3,
  Users,
  Palette,
  DollarSign,
  Ticket,
  Star,
  Brain,
  Target,
  MessageSquare,
  Bot,
  TrendingUp,
  PieChart,
  UserCircle,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  name: string
  href?: string
  icon?: LucideIcon
  badge?: string
  external?: boolean
}

export interface NavSubGroup {
  name: string
  isHub?: boolean
  items: NavItem[]
}

export interface NavGroup {
  name: string
  icon?: LucideIcon
  items?: NavItem[]
  subGroups?: NavSubGroup[]
}

/**
 * 네비게이션 구조
 * Phase 4에서 허브 구조로 재설계
 */
export const navigation: NavGroup[] = [
  {
    name: '홈',
    icon: LayoutDashboard,
    items: [
      { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    name: '물류 운영',
    icon: Truck,
    items: [
      { name: '미입고 관리', href: '/unreceived', icon: Package },
      { name: '물류 추적', href: '/logistics', icon: Truck },
      { name: '물류 관제 센터', href: '/control-tower', icon: Radio },
      { name: '물류비 정산', href: '/settlement', icon: Receipt },
    ],
  },
  {
    name: '업무 지원',
    icon: CheckSquare,
    items: [
      { name: 'QC 관리', href: '/qc', icon: CheckSquare },
      { name: '소포수령증', href: '/sopo-receipt', icon: FileText },
      { name: '통합 검색', href: '/lookup', icon: Search },
    ],
  },
  {
    name: '분석',
    icon: BarChart3,
    subGroups: [
      {
        name: '성과 분석 허브',
        isHub: true,
        items: [
          { name: '성과 분석', href: '/analytics', icon: BarChart3 },
          { name: '주문 패턴 분석', href: '/order-patterns', icon: TrendingUp },
          { name: '쿠폰 효과 분석', href: '/coupon-analytics', icon: Ticket },
        ],
      },
      {
        name: '고객 분석 허브',
        isHub: true,
        items: [
          { name: '고객 분석', href: '/customer-analytics', icon: Users },
          { name: '고객 360° 뷰', href: '/customer-360', icon: UserCircle },
          { name: '리뷰 분석', href: '/review-analytics', icon: Star },
        ],
      },
      {
        name: '기타 분석',
        items: [
          { name: '작가 분석', href: '/artist-analytics', icon: Palette },
          { name: '비용 & 손익', href: '/cost-analysis', icon: DollarSign },
        ],
      },
    ],
  },
  {
    name: '경영 인사이트',
    icon: Brain,
    items: [
      { name: 'Business Brain', href: '/business-brain', icon: Brain },
    ],
  },
  {
    name: '고객 인사이트',
    icon: MessageSquare,
    items: [
      { name: '고객 리뷰', href: '/reviews', icon: Star },
    ],
  },
  {
    name: '도구',
    icon: Target,
    items: [
      { name: '퍼포먼스 마케터', href: '/marketer', icon: Target },
      { name: '쿠폰 생성/발급', href: '/coupon-generator', icon: Ticket },
      { name: 'AI 어시스턴트', href: '/chat', icon: Bot },
    ],
  },
]

/**
 * 플랫 네비게이션 (검색용)
 */
export const flatNavigation: NavItem[] = navigation.flatMap((group) => {
  if (group.items) {
    return group.items
  }
  if (group.subGroups) {
    return group.subGroups.flatMap((subGroup) => subGroup.items)
  }
  return []
})

/**
 * 경로로 네비게이션 아이템 찾기
 */
export function findNavItemByPath(path: string): NavItem | undefined {
  return flatNavigation.find((item) => item.href === path)
}

/**
 * 허브 그룹 찾기
 */
export function findHubByPath(path: string): NavSubGroup | undefined {
  for (const group of navigation) {
    if (group.subGroups) {
      for (const subGroup of group.subGroups) {
        if (subGroup.isHub && subGroup.items.some((item) => item.href === path)) {
          return subGroup
        }
      }
    }
  }
  return undefined
}

export default navigation

