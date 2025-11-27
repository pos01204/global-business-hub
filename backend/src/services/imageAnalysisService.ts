import { openaiService } from './openaiService'

export interface VisualAnalysis {
  colors: string[]
  materials: string[]
  style: string
  estimatedSize: string
  mood: string[]
  composition: string
  lighting: string
  overallDescription: string
}

export interface MarketingInsights {
  title: string
  description: string
  marketingCopy: string[]
  emotionalKeywords: string[]
  targetAudience: string[]
  useCases: string[]
  hashtags: string[]
  sellingPoints: string[]
}

export interface ImageAnalysisResult {
  visualAnalysis: VisualAnalysis
  marketingInsights: MarketingInsights
}

export class ImageAnalysisService {
  /**
   * 이미지를 분석하여 시각적 특징 추출
   */
  async analyzeImage(imageBase64: string): Promise<ImageAnalysisResult> {
    try {
      // 1단계: 시각적 분석
      const visualPrompt = `이 이미지는 핸드메이드 작품(도자기, 가죽제품, 주얼리, 인테리어 소품 등)의 사진입니다.

다음 정보를 JSON 형식으로 추출해주세요:
1. **색상** (colors): 이미지에서 보이는 주요 색상 3-5개 (예: ["파스텔 블루", "부드러운 베이지", "따뜻한 크림"])
2. **재료** (materials): 작품의 재료 추정 (예: ["도자기", "세라믹"])
3. **스타일** (style): 디자인 스타일 (예: "미니멀", "모던", "빈티지", "내추럴")
4. **추정 크기** (estimatedSize): 작품의 크기 추정 (예: "소형", "중형", "대형")
5. **분위기/감성** (mood): 이미지에서 느껴지는 감성 키워드 3-5개 (예: ["따뜻함", "평온함", "우아함"])
6. **구도** (composition): 사진의 구도 설명 (예: "단독 촬영", "라이프스타일 촬영")
7. **조명** (lighting): 조명의 느낌 (예: "자연광", "따뜻한 조명", "부드러운 조명")
8. **전체 설명** (overallDescription): 작품에 대한 전체적인 시각적 설명 (50-100자)

**출력 형식 (JSON만 반환, 다른 텍스트 없이):**
{
  "colors": ["색상1", "색상2"],
  "materials": ["재료1", "재료2"],
  "style": "스타일",
  "estimatedSize": "크기",
  "mood": ["감성1", "감성2"],
  "composition": "구도 설명",
  "lighting": "조명 설명",
  "overallDescription": "전체 설명"
}`

      const visualResponse = await openaiService.analyzeImage(imageBase64, visualPrompt, {
        temperature: 0.3, // 낮은 temperature로 정확한 분석
        maxTokens: 1000,
      })

      // JSON 파싱
      let visualAnalysis: VisualAnalysis
      try {
        const jsonMatch = visualResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          visualAnalysis = JSON.parse(jsonMatch[0])
        } else {
          visualAnalysis = JSON.parse(visualResponse)
        }
      } catch (e) {
        throw new Error('시각적 분석 결과 파싱 실패')
      }

      // 2단계: 마케팅 인사이트 생성
      const marketingPrompt = `당신은 핸드메이드 작품을 마케팅하는 전문 카피라이터입니다.

다음은 작품 이미지의 시각적 분석 결과입니다:
- 색상: ${visualAnalysis.colors.join(', ')}
- 재료: ${visualAnalysis.materials.join(', ')}
- 스타일: ${visualAnalysis.style}
- 크기: ${visualAnalysis.estimatedSize}
- 감성: ${visualAnalysis.mood.join(', ')}
- 전체 설명: ${visualAnalysis.overallDescription}

이 정보를 바탕으로 소비자가 관심을 가질 만한 마케팅 콘텐츠를 생성해주세요:

1. **제목** (title): 작품의 핵심을 담은 매력적인 제목 (30자 이내)
2. **설명** (description): 감성적이고 설득력 있는 작품 설명 (100-200자)
3. **마케팅 카피** (marketingCopy): 소비자 관심을 끄는 핵심 문구 3-5개 (각 20-40자)
4. **감성 키워드** (emotionalKeywords): 작품의 분위기와 느낌을 나타내는 키워드 5-8개
5. **타겟 오디언스** (targetAudience): 누구에게 어필할지 추정 3-5개 (예: ["집꾸미기 좋아하는 20-30대", "선물을 찾는 사람들"])
6. **사용 시나리오** (useCases): 언제, 어디서, 어떻게 사용할지 3-5개 (예: ["거실 인테리어 소품으로", "친구 생일 선물로"])
7. **해시태그** (hashtags): 플랫폼별 최적화된 해시태그 10-15개 (예: ["핸드메이드", "인테리어", "선물"])
8. **판매 포인트** (sellingPoints): 작품의 강조할 만한 특징 3-5개 (예: ["수공예의 따뜻함", "독특한 디자인"])

**출력 형식 (JSON만 반환, 다른 텍스트 없이):**
{
  "title": "제목",
  "description": "설명",
  "marketingCopy": ["카피1", "카피2"],
  "emotionalKeywords": ["키워드1", "키워드2"],
  "targetAudience": ["타겟1", "타겟2"],
  "useCases": ["시나리오1", "시나리오2"],
  "hashtags": ["해시태그1", "해시태그2"],
  "sellingPoints": ["포인트1", "포인트2"]
}`

      const marketingResponse = await openaiService.analyzeImage(imageBase64, marketingPrompt, {
        temperature: 0.7, // 창의적인 카피를 위해 높은 temperature
        maxTokens: 2000,
      })

      // JSON 파싱
      let marketingInsights: MarketingInsights
      try {
        const jsonMatch = marketingResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          marketingInsights = JSON.parse(jsonMatch[0])
        } else {
          marketingInsights = JSON.parse(marketingResponse)
        }
      } catch (e) {
        throw new Error('마케팅 인사이트 파싱 실패')
      }

      return {
        visualAnalysis,
        marketingInsights,
      }
    } catch (error: any) {
      console.error('[Image Analysis] 오류:', error)
      throw new Error(`이미지 분석 실패: ${error.message}`)
    }
  }
}

export const imageAnalysisService = new ImageAnalysisService()

