// 성과 추적 관련 타입 정의

export interface PerformanceMetrics {
  contentId: string
  date: string
  views: number
  engagement: number // 좋아요, 댓글, 공유 합계
  conversions: number // 클릭, 구매 등 전환 수
  platform?: string
}

export interface ContentPerformance {
  contentId: string
  title: string
  totalViews: number
  totalEngagement: number
  totalConversions: number
  averageEngagementRate: number // 참여율 (참여/조회 * 100)
  metrics: PerformanceMetrics[]
  createdAt: string
  lastUpdated: string
}







