// 퍼포먼스 마케터 관련 타입 정의

export interface IdusProduct {
  id: string
  url: string
  title: string
  description: string
  price: number
  images: string[]
  category: string
  tags: string[]
  artist: {
    name: string
    url: string
    followers?: number
    productsCount?: number
  }
  stats?: {
    views?: number
    likes?: number
    reviews?: number
  }
}

export interface DiscoveryQuery {
  keyword?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'popular' | 'new' | 'price'
  limit?: number
}

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
    trendScore: number // 0-100
    targetAudience: string[]
    keywords: string[]
    similarProducts?: string[]
  }
  createdAt: string
}

export interface ContentGenerationRequest {
  discoveryId?: string
  productUrl?: string
  contentType: 'blog' | 'social' | 'email'
  platform: 'blog' | 'instagram' | 'facebook' | 'twitter' | 'email'
  language: 'korean' | 'english' | 'japanese'
  tone?: string
  includeSeo?: boolean
  targetAudience?: string[]
  additionalContext?: string
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

export interface ContentDraft {
  id: string
  discoveryId?: string
  type: 'blog' | 'social' | 'email'
  platform: 'blog' | 'instagram' | 'facebook' | 'twitter' | 'email'
  language: 'korean' | 'english' | 'japanese'
  title: string
  content: string
  metadata: {
    seoKeywords: string[]
    hashtags: string[]
    images: string[]
    callToAction?: string
  }
  status: 'draft' | 'review' | 'approved' | 'published'
  version: number
  createdAt: string
  updatedAt: string
}


