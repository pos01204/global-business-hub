// 캠페인 관련 타입 정의

export interface Campaign {
  id: string
  name: string
  contentIds: string[] // 저장된 콘텐츠 ID 목록
  schedule: {
    publishDate: string
    platforms: string[]
    timezone: string
  }
  status: 'planning' | 'draft' | 'scheduled' | 'published' | 'completed'
  performance?: {
    views?: number
    engagement?: number
    conversions?: number
  }
  createdAt: string
  updatedAt: string
}







