import axios from 'axios'
import * as cheerio from 'cheerio'
import { IdusProduct, DiscoveryResult } from '../types/marketer'
import { aiProductParser } from './aiProductParser'

// UUID 생성 함수 (간단한 버전)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Rate Limiter 클래스
class RateLimiter {
  private requests: number[] = []
  private maxRequests: number = 5 // 1분에 최대 5개 요청
  private timeWindow: number = 60000 // 1분

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    // 오래된 요청 제거
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    
    // 요청 제한 초과 시 대기
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.timeWindow - (now - oldestRequest) + 1000 // 1초 여유
      console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)} seconds...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      this.requests = this.requests.filter(time => Date.now() - time < this.timeWindow)
    }
    
    this.requests.push(Date.now())
  }
}

const rateLimiter = new RateLimiter()

export class IdusCrawler {
  private baseUrl = 'https://www.idus.com'

  /**
   * idus 작품 페이지에서 기본 정보 크롤링
   * 공개 정보만 수집하며, rate limiting을 적용합니다.
   * 
   * 주의사항:
   * - 공개 정보만 수집 (로그인 필요 정보 제외)
   * - Rate limiting 적용 (1분에 최대 5개 요청)
   * - 최소한의 데이터만 수집
   * - 에러 발생 시 폴백 데이터 반환
   */
  async crawlProduct(url: string): Promise<IdusProduct | null> {
    try {
      const productId = this.extractProductId(url)
      
      if (!productId) {
        console.warn('유효하지 않은 idus URL:', url)
        return null
      }

      // Rate limiting 적용
      await rateLimiter.waitIfNeeded()

      try {
        // 실제 크롤링 시도
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          timeout: 10000,
          maxRedirects: 5,
        })

        const $ = cheerio.load(response.data)
        
        // 작품 제목 추출 (여러 선택자 시도)
        // idus 사이트의 실제 구조에 맞는 선택자 추가
        let title = $('h1').first().text().trim() ||
                    $('h1[class*="product"]').first().text().trim() ||
                    $('h1[class*="title"]').first().text().trim() ||
                    $('[class*="product"][class*="title"]').first().text().trim() ||
                    $('[class*="item"][class*="name"]').first().text().trim() ||
                    $('[data-testid*="title"]').first().text().trim() ||
                    $('meta[property="og:title"]').attr('content')?.trim() ||
                    $('title').text().split('|')[0].split('-')[0].trim() ||
                    '작품명 없음'
        
        // 제목이 여전히 기본값이면 더 넓은 범위로 검색
        if (title === '작품명 없음' || title.length < 2) {
          // 모든 h1, h2 태그 확인
          const headings = $('h1, h2').map((_, el) => $(el).text().trim()).get()
          title = headings.find((h: string) => h.length > 2 && h.length < 100) || title
        }
        
        // 작품 설명 추출
        let description = $('[class*="product"][class*="description"]').first().text().trim() ||
                         $('[class*="product"][class*="detail"]').first().text().trim() ||
                         $('[class*="item"][class*="description"]').first().text().trim() ||
                         $('[class*="description"]').first().text().trim() ||
                         $('meta[name="description"]').attr('content')?.trim() ||
                         $('meta[property="og:description"]').attr('content')?.trim() ||
                         ''
        
        // 설명이 없으면 p 태그에서 찾기
        if (!description || description.length < 10) {
          const paragraphs = $('p').map((_, el) => $(el).text().trim()).get()
          description = paragraphs.find((p: string) => p.length > 20 && p.length < 500) || description
        }
        
        // 가격 추출 (더 많은 패턴 시도)
        let priceText = $('[class*="price"]').first().text().trim() ||
                       $('[class*="cost"]').first().text().trim() ||
                       $('[class*="amount"]').first().text().trim() ||
                       $('[data-testid*="price"]').first().text().trim() ||
                       $('span:contains("원")').first().text().trim() ||
                       $('span:contains("₩")').first().text().trim() ||
                       ''
        
        // 가격 텍스트에서 숫자만 추출
        const priceMatch = priceText.match(/[\d,]+/)
        const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0
        
        // 이미지 URL 추출 (최대 10개)
        const images: string[] = []
        $('img').each((_, el) => {
          const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src')
          if (src) {
            let imageUrl = src
            // 상대 경로를 절대 경로로 변환
            if (!imageUrl.startsWith('http')) {
              if (imageUrl.startsWith('//')) {
                imageUrl = 'https:' + imageUrl
              } else if (imageUrl.startsWith('/')) {
                imageUrl = this.baseUrl + imageUrl
              } else {
                imageUrl = url.split('/').slice(0, 3).join('/') + '/' + imageUrl
              }
            }
            // 중복 제거 및 유효한 이미지 URL만 추가
            if (imageUrl && !images.includes(imageUrl) && images.length < 10) {
              // 작은 아이콘이나 로고 제외
              if (!imageUrl.includes('icon') && !imageUrl.includes('logo') && !imageUrl.includes('avatar')) {
                images.push(imageUrl)
              }
            }
          }
        })
        
        // 태그/카테고리 추출
        const tags: string[] = []
        $('[class*="tag"], [class*="hashtag"], [class*="category"]').each((_, el) => {
          const tag = $(el).text().trim()
          if (tag && tag.length < 30 && !tags.includes(tag) && tags.length < 10) {
            tags.push(tag)
          }
        })
        
        // 작가 정보 추출
        const artistName = $('[class*="artist"], [class*="seller"], [class*="creator"]').first().text().trim() ||
                          $('a[href*="artist"]').first().text().trim() ||
                          '작가명 없음'
        
        const artistLink = $('a[href*="artist"]').first().attr('href') || ''
        const artistUrl = artistLink.startsWith('http') 
          ? artistLink 
          : artistLink.startsWith('/')
          ? `${this.baseUrl}${artistLink}`
          : ''

        const product: IdusProduct = {
          id: productId,
          url,
          title: title.substring(0, 200), // 최대 200자
          description: description.substring(0, 1000), // 최대 1000자
          price,
          images: images.slice(0, 10), // 최대 10개
          category: tags[0] || '기타',
          tags: tags.slice(0, 10),
          artist: {
            name: artistName.substring(0, 100),
            url: artistUrl,
          },
        }

        console.log(`✅ 크롤링 성공: ${product.title}`)
        return product
      } catch (crawlError: any) {
        console.warn('크롤링 실패, AI 파서 시도:', crawlError.message)
        
        // 크롤링 실패 시 AI 파서 사용
        try {
          const aiProduct = await aiProductParser.parseProductFromUrl(url)
          if (aiProduct) {
            console.log('✅ AI 파서로 작품 정보 추출 성공')
            return aiProduct
          }
        } catch (aiError: any) {
          console.warn('AI 파서도 실패:', aiError.message)
        }
        
        // 최종 폴백: 최소한의 정보만 반환
        return {
          id: productId,
          url,
          title: `작품 ${productId}`,
          description: '작품 정보를 가져올 수 없습니다. URL을 직접 확인해주세요.',
          price: 0,
          images: [],
          category: '기타',
          tags: [],
          artist: {
            name: '작가명 없음',
            url: '',
          },
        }
      }
    } catch (error) {
      console.error('크롤링 오류:', error)
      return null
    }
  }

  /**
   * 키워드로 작품 검색
   * idus 검색 페이지를 크롤링하여 결과를 반환합니다.
   * 
   * 주의사항:
   * - Rate limiting 적용
   * - 검색 결과 페이지 구조 변경 시 크롤링 로직 수정 필요
   * - 공개 검색 결과만 수집
   */
  async searchProducts(query: {
    keyword?: string
    category?: string
    limit?: number
  }): Promise<IdusProduct[]> {
    // 실제 구현 시 idus 검색 API 또는 크롤링 사용
    // 현재는 시뮬레이션 데이터 반환
    
    const sampleProducts = [
      {
        title: '수공예 도자기 세트',
        description: '전통 기법으로 제작된 아름다운 도자기 세트입니다. 각각의 작품은 손으로 직접 만들어져 독특한 매력을 가지고 있습니다.',
        price: 45000,
        category: '도자기',
        tags: ['도자기', '수공예', '전통', '홈데코'],
        artistName: '도예작가 김수진',
        followers: 2500,
        productsCount: 35,
        stats: { views: 1200, likes: 180, reviews: 45 },
      },
      {
        title: '핸드메이드 가죽 지갑',
        description: '프리미엄 가죽으로 제작된 클래식한 지갑입니다. 오래 사용할수록 멋스러운 빈티지 느낌이 살아납니다.',
        price: 89000,
        category: '가죽제품',
        tags: ['가죽', '지갑', '핸드메이드', '클래식'],
        artistName: '가죽공방 레더',
        followers: 1800,
        productsCount: 28,
        stats: { views: 950, likes: 120, reviews: 32 },
      },
      {
        title: '수제 비누 세트',
        description: '천연 원료로 만든 아로마 비누 세트입니다. 피부에 순하고 환경에도 좋은 친환경 제품입니다.',
        price: 32000,
        category: '뷰티',
        tags: ['비누', '천연', '아로마', '친환경'],
        artistName: '네이처 비누',
        followers: 3200,
        productsCount: 52,
        stats: { views: 2100, likes: 320, reviews: 78 },
      },
      {
        title: '핸드메이드 목걸이',
        description: '은과 천연 보석을 사용한 우아한 목걸이입니다. 특별한 날을 위한 완벽한 선물입니다.',
        price: 125000,
        category: '주얼리',
        tags: ['주얼리', '목걸이', '은', '보석'],
        artistName: '실버스튜디오',
        followers: 4200,
        productsCount: 68,
        stats: { views: 3500, likes: 580, reviews: 125 },
      },
      {
        title: '수공예 바구니',
        description: '천연 라탄으로 엮은 실용적인 바구니입니다. 거실이나 침실 인테리어 소품으로 활용하기 좋습니다.',
        price: 55000,
        category: '인테리어',
        tags: ['바구니', '라탄', '인테리어', '수공예'],
        artistName: '라탄공방',
        followers: 1500,
        productsCount: 22,
        stats: { views: 680, likes: 95, reviews: 18 },
      },
      {
        title: '수제 캔들 홀더',
        description: '도자기로 만든 세련된 캔들 홀더입니다. 따뜻한 불빛과 함께 공간을 아늑하게 만들어줍니다.',
        price: 38000,
        category: '인테리어',
        tags: ['캔들', '홀더', '도자기', '인테리어'],
        artistName: '캔들하우스',
        followers: 2800,
        productsCount: 41,
        stats: { views: 1450, likes: 210, reviews: 56 },
      },
      {
        title: '핸드메이드 가방',
        description: '천으로 만든 실용적인 에코백입니다. 환경을 생각하는 라이프스타일을 추구하는 분들에게 추천합니다.',
        price: 42000,
        category: '패션',
        tags: ['가방', '에코백', '천', '친환경'],
        artistName: '에코백스튜디오',
        followers: 1900,
        productsCount: 30,
        stats: { views: 1100, likes: 150, reviews: 42 },
      },
      {
        title: '수공예 우드 트레이',
        description: '천연 나무로 만든 우아한 트레이입니다. 테이블 위를 깔끔하게 정리해주는 실용적인 아이템입니다.',
        price: 67000,
        category: '인테리어',
        tags: ['트레이', '우드', '인테리어', '수공예'],
        artistName: '우드워크',
        followers: 2300,
        productsCount: 38,
        stats: { views: 1350, likes: 195, reviews: 48 },
      },
    ]

    const keyword = query.keyword?.toLowerCase() || ''
    const category = query.category || ''
    const limit = query.limit || 10

    // 키워드가 있으면 실제 검색 시도
    if (keyword) {
      try {
        await rateLimiter.waitIfNeeded()
        
        // idus 검색 URL 구성 (일반적인 패턴)
        const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(keyword)}`
        
        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9',
          },
          timeout: 10000,
        })

        const $ = cheerio.load(response.data)
        const products: IdusProduct[] = []
        
        // 검색 결과에서 작품 링크 추출 (일반적인 선택자 패턴)
        $('a[href*="/product/"], a[href*="/item/"]').each((_, el) => {
          if (products.length >= limit) return false // limit 도달 시 중단
          
          const href = $(el).attr('href')
          if (!href) return
          
          const productUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`
          const productId = this.extractProductId(productUrl)
          
          if (productId && !products.some(p => p.id === productId)) {
            // 간단한 정보만 추출 (상세 정보는 crawlProduct에서)
            const title = $(el).find('[class*="title"], [class*="name"]').first().text().trim() ||
                          $(el).text().trim() ||
                          '작품명 없음'
            
            const priceText = $(el).find('[class*="price"]').first().text().trim()
            const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0
            
            products.push({
              id: productId,
              url: productUrl,
              title: title.substring(0, 200),
              description: '',
              price,
              images: [],
              category: category || '기타',
              tags: [keyword],
              artist: {
                name: '작가명',
                url: '',
              },
            })
          }
        })

        // 실제 크롤링 결과가 있으면 반환
        if (products.length > 0) {
          console.log(`✅ 검색 성공: ${products.length}개 작품 발견`)
          return products.slice(0, limit)
        }
      } catch (searchError: any) {
        console.warn('검색 크롤링 실패, 샘플 데이터 사용:', searchError.message)
      }
    }

    // 폴백: 샘플 데이터 사용
    let filtered = sampleProducts.filter((product) => {
      const matchesKeyword = !keyword || 
        product.title.toLowerCase().includes(keyword) ||
        product.description.toLowerCase().includes(keyword) ||
        product.tags.some(tag => tag.toLowerCase().includes(keyword))
      const matchesCategory = !category || product.category === category
      return matchesKeyword && matchesCategory
    })

    // 키워드가 있으면 관련도 순으로 정렬
    if (keyword) {
      filtered = filtered.sort((a, b) => {
        const aScore = (a.title.toLowerCase().includes(keyword) ? 3 : 0) +
          (a.tags.some(t => t.toLowerCase().includes(keyword)) ? 2 : 0) +
          (a.description.toLowerCase().includes(keyword) ? 1 : 0)
        const bScore = (b.title.toLowerCase().includes(keyword) ? 3 : 0) +
          (b.tags.some(t => t.toLowerCase().includes(keyword)) ? 2 : 0) +
          (b.description.toLowerCase().includes(keyword) ? 1 : 0)
        return bScore - aScore
      })
    }

    // 제한된 수만큼 반환
    const products: IdusProduct[] = filtered.slice(0, limit).map((sample, i) => ({
      id: `product-${i + 1}`,
      url: `${this.baseUrl}/product/${i + 1}`,
      title: sample.title,
      description: sample.description,
      price: sample.price,
      images: [],
      category: sample.category,
      tags: sample.tags,
      artist: {
        name: sample.artistName,
        url: `${this.baseUrl}/artist/${i + 1}`,
        followers: sample.followers,
        productsCount: sample.productsCount,
      },
      stats: sample.stats,
    }))

    return products
  }

  /**
   * 작품 정보를 DiscoveryResult로 변환
   */
  async analyzeProduct(product: IdusProduct): Promise<DiscoveryResult> {
    // 트렌드 점수 계산 (간단한 로직)
    const trendScore = Math.min(
      100,
      (product.stats?.views || 0) / 10 +
        (product.stats?.likes || 0) * 2 +
        (product.stats?.reviews || 0) * 5
    )

    return {
      id: generateUUID(),
      type: 'product',
      source: {
        platform: 'idus',
        url: product.url,
        scrapedAt: new Date().toISOString(),
      },
      metadata: {
        title: product.title,
        description: product.description,
        images: product.images,
        category: product.category,
        tags: product.tags,
        price: product.price,
        artist: product.artist,
      },
      analysis: {
        trendScore: Math.round(trendScore),
        targetAudience: ['핸드메이드 애호가', '선물 구매자'],
        keywords: [...product.tags, product.category],
      },
      createdAt: new Date().toISOString(),
    }
  }

  private extractProductId(url: string): string | null {
    const match = url.match(/\/product\/([^\/]+)/)
    return match ? match[1] : null
  }
}

export const idusCrawler = new IdusCrawler()

