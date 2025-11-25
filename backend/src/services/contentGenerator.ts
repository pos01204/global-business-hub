import { ContentGenerationRequest, GeneratedContent } from '../types/marketer'
import { ollamaService } from './ollamaService'

// UUID 생성 함수 (간단한 버전)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export class ContentGenerator {
  private buildPrompt(request: ContentGenerationRequest): string {
    const { contentType, platform, language, tone, targetAudience, additionalContext, productUrl } = request

    const langMap = {
      korean: '한국어',
      english: '영어',
      japanese: '일본어',
    }

    const platformMap = {
      blog: '블로그 포스트',
      instagram: '인스타그램',
      facebook: '페이스북',
      twitter: 'X(트위터)',
      email: '이메일 뉴스레터',
    }

    const toneGuide = tone || '따뜻하고 감성적인'

    // 소재 정보 추출 (discoveryId가 있으면 추가 컨텍스트로 활용)
    let materialContext = ''
    if (additionalContext) {
      materialContext = `\n**소재 정보:**\n${additionalContext}`
    } else if (productUrl) {
      materialContext = `\n**작품 정보:**\n작품 URL: ${productUrl}\n위 작품의 특징, 스토리, 가치를 분석하여 매력적인 콘텐츠를 작성하세요.`
    }

    let prompt = `당신은 한국의 핸드메이드 플랫폼 '아이디어스(Idus)'의 작품을 홍보하는 전문 마케팅 콘텐츠 작가입니다. 
핸드메이드 작품의 가치와 작가의 스토리를 감성적으로 전달하는 것이 당신의 전문 분야입니다.

**작업 요청:**
- 콘텐츠 타입: ${platformMap[platform]}
- 언어: ${langMap[language]}
- 톤앤매너: ${toneGuide}
${targetAudience ? `- 타겟 오디언스: ${targetAudience.join(', ')}` : ''}
${materialContext}

**콘텐츠 생성 가이드라인:**

1. **${platformMap[platform]} 최적화:**
`

    if (contentType === 'blog') {
      prompt += `   - SEO 최적화된 장문 콘텐츠 (800-1200자)
   - 제목, 소제목, 본문 구조화
   - 키워드 자연스럽게 포함
   - 작품의 스토리와 가치 강조
`
    } else if (contentType === 'social') {
      if (platform === 'instagram' || platform === 'facebook') {
        prompt += `   - 감성적이고 서술적인 스타일 (200-300자)
   - 이모티콘 적절히 활용
   - 줄바꿈으로 가독성 향상
   - 해시태그 5-10개 포함
`
      } else if (platform === 'twitter') {
        prompt += `   - 간결하고 핵심을 찌르는 스타일 (280자 이내)
   - 이모티콘 절제하여 사용
   - 해시태그 3-5개 포함
`
      }
    } else if (contentType === 'email') {
      prompt += `   - 개인적이고 따뜻한 톤 (300-500자)
   - 명확한 CTA (Call to Action)
   - 작가와 작품의 스토리 강조
`
    }

    prompt += `
2. **콘텐츠 품질 요구사항:**
   - 작품의 독특한 스토리와 가치를 강조
   - 감성적이고 설득력 있는 문구 사용
   - 구체적인 디테일 포함 (재료, 제작 과정, 사용 방법 등)
   - 독자가 공감할 수 있는 시나리오 제시
   - 과장 없이 진정성 있게 작성

3. **언어별 현지화:**
   - ${langMap[language]}로 자연스럽게 작성
   - 문화적 맥락과 관습 고려
   - 기계 번역 같은 표현 절대 피하기
   - 각 언어권 독자가 이해하기 쉬운 표현 사용

4. **해시태그 및 키워드:**
   - 작품과 관련된 트렌디한 해시태그 5-10개 생성
   - SEO에 유리한 키워드 3-5개 포함
   - 각 해시태그는 '#' 없이 단어만 제공 (예: "핸드메이드" not "#핸드메이드")

5. **출력 형식:**
   반드시 유효한 JSON 형식으로만 응답하세요. 다른 텍스트나 설명은 포함하지 마세요:
   {
     "title": "매력적인 콘텐츠 제목 (50자 이내)",
     "content": "본문 내용 (플랫폼별 길이 제한 준수)",
     "hashtags": ["해시태그1", "해시태그2", ...],
     "seoKeywords": ["키워드1", "키워드2", ...],
     "callToAction": "명확하고 행동을 유도하는 CTA 문구"
   }
`

    return prompt
  }

  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    try {
      // OpenAI 연결 확인
      const isConnected = await openaiService.checkConnection()
      
      let response: string
      if (isConnected) {
        // OpenAI GPT 사용
        const prompt = this.buildPrompt(request)
        response = await openaiService.generate(prompt, { temperature: 0.7, maxTokens: 2000 })
      } else {
        // OpenAI 없을 때 폴백: 템플릿 기반 생성
        console.warn('OpenAI 연결 실패, 폴백 콘텐츠 생성')
        response = this.generateFallbackContent(request)
      }

      // JSON 응답 파싱 시도
      let parsed: any
      try {
        // JSON 코드 블록 제거
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        } else {
          parsed = JSON.parse(response)
        }
      } catch (e) {
        // JSON 파싱 실패 시 기본 구조로 변환
        parsed = {
          title: '생성된 콘텐츠',
          content: response,
          hashtags: [],
          seoKeywords: [],
          callToAction: '',
        }
      }

      const content: GeneratedContent = {
        id: generateUUID(),
        title: parsed.title || '생성된 콘텐츠',
        content: parsed.content || response,
        metadata: {
          seoKeywords: parsed.seoKeywords || [],
          hashtags: parsed.hashtags || [],
          images: [],
          callToAction: parsed.callToAction || '',
        },
        createdAt: new Date().toISOString(),
      }

      return content
    } catch (error) {
      console.error('콘텐츠 생성 오류:', error)
      throw new Error('콘텐츠 생성 중 오류가 발생했습니다.')
    }
  }

  private generateFallbackContent(request: ContentGenerationRequest): string {
    // Ollama 없을 때 사용할 기본 템플릿
    const langMap = {
      korean: {
        title: '아이디어스 핸드메이드 작품',
        intro: '아이디어스에서 발견한 특별한 핸드메이드 작품을 소개합니다.',
        cta: '지금 바로 확인해보세요!',
        hashtags: ['#아이디어스', '#핸드메이드', '#수공예', '#온라인쇼핑'],
      },
      english: {
        title: 'Idus Handmade Product',
        intro: 'Discover a special handmade product from Idus.',
        cta: 'Check it out now!',
        hashtags: ['#idus', '#handmade', '#craft', '#onlineshopping'],
      },
      japanese: {
        title: 'アイデアス ハンドメイド作品',
        intro: 'アイデアスで見つけた特別なハンドメイド作品をご紹介します。',
        cta: '今すぐチェックしてみてください！',
        hashtags: ['#アイデアス', '#ハンドメイド', '#手作り', '#オンラインショッピング'],
      },
    }

    const lang = langMap[request.language]
    const platform = request.platform

    let content = ''
    if (platform === 'instagram' || platform === 'facebook') {
      content = `${lang.intro}\n\n${request.productUrl ? `작품 링크: ${request.productUrl}` : ''}\n\n${lang.cta}`
    } else if (platform === 'twitter') {
      content = `${lang.intro} ${lang.cta}`
    } else if (platform === 'blog') {
      content = `# ${lang.title}\n\n${lang.intro}\n\n## 작품 소개\n\n${request.productUrl ? `[작품 보기](${request.productUrl})` : ''}\n\n${lang.cta}`
    } else {
      content = `${lang.intro}\n\n${lang.cta}`
    }

    return JSON.stringify({
      title: lang.title,
      content: content,
      hashtags: lang.hashtags,
      seoKeywords: ['아이디어스', '핸드메이드', '수공예'],
      callToAction: lang.cta,
    })
  }
}

export const contentGenerator = new ContentGenerator()

