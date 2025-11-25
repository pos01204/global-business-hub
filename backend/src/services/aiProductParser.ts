import axios from 'axios'
import { openaiService } from './openaiService'
import { IdusProduct } from '../types/marketer'

/**
 * AI 기반 작품 정보 파서
 * 크롤링이 실패하거나 복잡한 구조일 때 OpenAI GPT를 사용하여 HTML에서 정보 추출
 */
export class AIProductParser {
  /**
   * URL에서 HTML을 가져와 AI로 작품 정보 추출
   */
  async parseProductFromUrl(url: string): Promise<IdusProduct | null> {
    try {
      // 1단계: HTML 가져오기
      const html = await this.fetchHtml(url)
      if (!html) {
        return null
      }

      // 2단계: HTML을 간소화 (불필요한 스크립트, 스타일 제거)
      const simplifiedHtml = this.simplifyHtml(html)

      // 3단계: AI로 정보 추출
      const productInfo = await this.extractProductInfoWithAI(url, simplifiedHtml)

      return productInfo
    } catch (error) {
      console.error('AI 파서 오류:', error)
      return null
    }
  }

  /**
   * URL에서 HTML 가져오기
   */
  private async fetchHtml(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9',
        },
        timeout: 15000,
        maxRedirects: 5,
      })
      return response.data
    } catch (error) {
      console.error('HTML 가져오기 실패:', error)
      return null
    }
  }

  /**
   * HTML 간소화 (AI 처리 속도 향상)
   */
  private simplifyHtml(html: string): string {
    // 스크립트와 스타일 태그 제거
    let simplified = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    // 너무 긴 경우 앞부분만 사용 (AI 토큰 제한 고려)
    if (simplified.length > 20000) {
      simplified = simplified.substring(0, 20000) + '...'
    }

    return simplified
  }

  /**
   * AI를 사용하여 HTML에서 작품 정보 추출
   */
  private async extractProductInfoWithAI(url: string, html: string): Promise<IdusProduct | null> {
    try {
      const productId = this.extractProductId(url)
      if (!productId) {
        return null
      }

      const prompt = `당신은 웹 페이지에서 작품 정보를 추출하는 전문 파서입니다.

다음은 idus 플랫폼의 작품 페이지 HTML입니다. HTML에서 작품 정보를 추출하여 JSON 형식으로 반환해주세요.

**URL:** ${url}

**HTML (일부):**
${html.substring(0, 15000)}

**추출해야 할 정보:**
1. 작품 제목 (title)
2. 작품 설명 (description) - 주요 특징, 재료, 크기 등
3. 가격 (price) - 숫자만 (예: 50000)
4. 작가명 (artistName)
5. 카테고리 (category) - 예: 도자기, 가죽제품, 주얼리 등
6. 태그 (tags) - 배열 형태, 최대 10개
7. 이미지 URL (images) - 배열 형태, 최대 5개

**출력 형식 (JSON만 반환, 다른 텍스트 없이):**
{
  "title": "작품 제목",
  "description": "작품 설명",
  "price": 50000,
  "artistName": "작가명",
  "category": "카테고리",
  "tags": ["태그1", "태그2"],
  "images": ["이미지URL1", "이미지URL2"]
}

HTML을 분석하여 위 정보를 추출해주세요. 정보를 찾을 수 없으면 null이나 빈 문자열을 사용하세요.`

      // OpenAI 연결 확인
      const isConnected = await openaiService.checkConnection()
      if (!isConnected) {
        console.warn('OpenAI가 연결되지 않아 AI 파서를 사용할 수 없습니다.')
        return null
      }

      const response = await openaiService.generate(prompt, {
        temperature: 0.3, // 낮은 temperature로 정확한 정보 추출
        maxTokens: 2000,
      })

      // JSON 응답 파싱
      let parsed: any
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        } else {
          parsed = JSON.parse(response)
        }
      } catch (e) {
        console.error('JSON 파싱 실패:', e)
        return null
      }

      // IdusProduct 형식으로 변환
      const product: IdusProduct = {
        id: productId,
        url,
        title: parsed.title || '작품명 없음',
        description: parsed.description || '',
        price: parsed.price || 0,
        images: Array.isArray(parsed.images) ? parsed.images.slice(0, 5) : [],
        category: parsed.category || '기타',
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10) : [],
        artist: {
          name: parsed.artistName || '작가명 없음',
          url: '',
        },
      }

      console.log(`✅ AI 파서 성공: ${product.title}`)
      return product
    } catch (error) {
      console.error('AI 정보 추출 오류:', error)
      return null
    }
  }

  private extractProductId(url: string): string | null {
    const match = url.match(/\/product\/([^\/\?]+)/)
    return match ? match[1] : null
  }
}

export const aiProductParser = new AIProductParser()

