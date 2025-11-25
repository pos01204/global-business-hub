// 퍼포먼스 마케터 관련 타입 정의 (프론트엔드)

export interface DiscoveryResult {
  id: string
  type: 'product' | 'artist' | 'trend'
  source: {
    platform: 'idus'
    url: string
    scrapedAt: string
  }
  metadata: {
    title: string
    description: string
    images: string[]
    category: string
    tags: string[]
    price?: number
    artist?: {
      name: string
      followers?: number
      productsCount?: number
    }
  }
  analysis: {
    trendScore: number
    targetAudience: string[]
    keywords: string[]
    similarProducts?: string[]
  }
  createdAt: string
  generatedContent?: GeneratedContent
}

export interface GeneratedContent {
  id: string
  title: string
  content: string
  metadata: {
    seoKeywords: string[]
    hashtags: string[]
    images: string[]
    callToAction?: string
  }
  seoScore?: number
  readabilityScore?: number
  createdAt: string
}


