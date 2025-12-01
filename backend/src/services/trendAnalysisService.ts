import { openaiService } from './openaiService'
import { geminiService } from './geminiService'

export interface TrendAnalysisResult {
  relatedKeywords: string[]
  marketingAngles: string[]
  targetAudience: string
}

export interface MultiLanguageTrendAnalysis {
  english: TrendAnalysisResult
  japanese: TrendAnalysisResult
}

export class TrendAnalysisService {
  /**
   * 키워드를 분석하여 트렌딩 키워드 및 마케팅 앵글 추출
   * Gemini API를 우선 사용하고, 없으면 OpenAI 사용
   */
  async analyzeKeyword(keyword: string): Promise<TrendAnalysisResult> {
    try {
      const prompt = `당신은 핸드메이드 작품 마케팅 전문가입니다. 다음 키워드를 분석하여 트렌딩 정보를 추출해주세요.

**분석 키워드:** ${keyword}

다음 정보를 JSON 형식으로 추출해주세요:

1. **관련 키워드** (relatedKeywords): 이 키워드와 연관된 트렌드 키워드 5-10개 (예: ["코지", "미니멀", "인테리어"])
2. **마케팅 앵글** (marketingAngles): 이 키워드를 활용한 마케팅 접근법 3-5개 (예: ["집꾸미기", "선물", "라이프스타일"])
3. **타겟 오디언스** (targetAudience): 이 키워드에 관심을 가질 타겟 고객층 (예: "집꾸미기를 좋아하는 20-30대 여성")

**출력 형식 (JSON만 반환, 다른 텍스트 없이):**
{
  "relatedKeywords": ["키워드1", "키워드2"],
  "marketingAngles": ["앵글1", "앵글2"],
  "targetAudience": "타겟 오디언스 설명"
}`

      // Gemini API 우선 사용
      const isGeminiAvailable = await geminiService.checkConnection()
      let response: string

      if (isGeminiAvailable) {
        try {
          response = await geminiService.generateContent(prompt, {
            temperature: 0.5,
            maxTokens: 1000,
            responseMimeType: 'application/json',
          })
        } catch (geminiError) {
          console.warn('[Trend Analysis] Gemini 실패, OpenAI로 폴백:', geminiError)
          response = await openaiService.generate(prompt, {
            temperature: 0.5,
            maxTokens: 1000,
          })
        }
      } else {
        // OpenAI 사용
        response = await openaiService.generate(prompt, {
          temperature: 0.5,
          maxTokens: 1000,
        })
      }

      // JSON 파싱
      let result: TrendAnalysisResult
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
        } else {
          result = JSON.parse(response)
        }
      } catch (e) {
        throw new Error('트렌드 분석 결과 파싱 실패')
      }

      return result
    } catch (error: any) {
      console.error('[Trend Analysis] 오류:', error)
      throw new Error(`트렌드 분석 실패: ${error.message}`)
    }
  }

  /**
   * 다국어 트렌드 분석 (영어, 일본어)
   */
  async analyzeKeywordMultiLanguage(keyword: string): Promise<MultiLanguageTrendAnalysis> {
    try {
      const prompt = `당신은 핸드메이드 작품 마케팅 전문가입니다. 다음 키워드를 분석하여 트렌딩 정보를 추출해주세요.

**분석 키워드:** ${keyword}

다음 정보를 JSON 형식으로 추출해주세요. 영어와 일본어로 각각 분석해주세요:

1. **관련 키워드** (relatedKeywords): 이 키워드와 연관된 트렌드 키워드 5-10개
2. **마케팅 앵글** (marketingAngles): 이 키워드를 활용한 마케팅 접근법 3-5개
3. **타겟 오디언스** (targetAudience): 이 키워드에 관심을 가질 타겟 고객층

**출력 형식 (JSON만 반환, 다른 텍스트 없이):**
{
  "english": {
    "relatedKeywords": ["keyword1", "keyword2"],
    "marketingAngles": ["angle1", "angle2"],
    "targetAudience": "target audience description"
  },
  "japanese": {
    "relatedKeywords": ["キーワード1", "キーワード2"],
    "marketingAngles": ["アングル1", "アングル2"],
    "targetAudience": "ターゲットオーディエンス説明"
  }
}`

      // Gemini API 우선 사용
      const isGeminiAvailable = await geminiService.checkConnection()
      let response: string

      if (isGeminiAvailable) {
        try {
          response = await geminiService.generateContent(prompt, {
            temperature: 0.5,
            maxTokens: 2000,
            responseMimeType: 'application/json',
          })
        } catch (geminiError) {
          console.warn('[Trend Analysis] Gemini 실패, OpenAI로 폴백:', geminiError)
          response = await openaiService.generate(prompt, {
            temperature: 0.5,
            maxTokens: 2000,
          })
        }
      } else {
        // OpenAI 사용
        response = await openaiService.generate(prompt, {
          temperature: 0.5,
          maxTokens: 2000,
        })
      }

      // JSON 파싱
      let result: MultiLanguageTrendAnalysis
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
        } else {
          result = JSON.parse(response)
        }
      } catch (e) {
        throw new Error('트렌드 분석 결과 파싱 실패')
      }

      return result
    } catch (error: any) {
      console.error('[Trend Analysis] 오류:', error)
      throw new Error(`트렌드 분석 실패: ${error.message}`)
    }
  }
}

export const trendAnalysisService = new TrendAnalysisService()






