import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY

export interface GeminiImagePart {
  inlineData: {
    data: string // base64
    mimeType: string
  }
}

export interface GeminiTextPart {
  text: string
}

export type GeminiPart = GeminiImagePart | GeminiTextPart

export interface GeminiGenerateContentOptions {
  temperature?: number
  maxTokens?: number
  responseMimeType?: 'application/json' | 'text/plain'
  responseSchema?: any
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null
  private model: string = 'gemini-2.5-flash'

  constructor() {
    if (GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
      console.log('✅ Google Gemini API 초기화 완료')
    } else {
      console.warn('⚠️ GEMINI_API_KEY가 설정되지 않았습니다. 환경 변수를 확인하세요.')
    }
  }

  /**
   * 텍스트 기반 콘텐츠 생성
   */
  async generateContent(
    prompt: string,
    options?: GeminiGenerateContentOptions
  ): Promise<string> {
    try {
      if (!this.genAI) {
        throw new Error('Gemini API 키가 설정되지 않았습니다. GEMINI_API_KEY 환경 변수를 설정하세요.')
      }

      const model = this.genAI.getGenerativeModel({
        model: this.model,
        generationConfig: {
          temperature: options?.temperature || 0.7,
          maxOutputTokens: options?.maxTokens || 2000,
          responseMimeType: options?.responseMimeType || 'text/plain',
          ...(options?.responseSchema && { responseSchema: options.responseSchema }),
        },
      })

      console.log(`[Gemini] 생성 요청 시작 - 모델: ${this.model}`)

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      console.log(`[Gemini] 생성 성공 - 응답 길이: ${text.length}`)

      return text
    } catch (error: any) {
      console.error('[Gemini] API 오류:', {
        message: error.message,
        code: error.code,
      })

      if (error.message?.includes('API_KEY')) {
        throw new Error('Gemini API 키가 유효하지 않습니다. GEMINI_API_KEY를 확인하세요.')
      } else if (error.message?.includes('quota')) {
        throw new Error('Gemini API 요청 한도가 초과되었습니다. 잠시 후 다시 시도하세요.')
      } else if (error.message) {
        throw new Error(`Gemini 오류: ${error.message}`)
      } else {
        throw new Error('콘텐츠 생성 중 오류가 발생했습니다.')
      }
    }
  }

  /**
   * 이미지와 텍스트를 함께 사용한 콘텐츠 생성
   */
  async generateContentWithImages(
    parts: GeminiPart[],
    options?: GeminiGenerateContentOptions
  ): Promise<string> {
    try {
      if (!this.genAI) {
        throw new Error('Gemini API 키가 설정되지 않았습니다. GEMINI_API_KEY 환경 변수를 설정하세요.')
      }

      const model = this.genAI.getGenerativeModel({
        model: this.model,
        generationConfig: {
          temperature: options?.temperature || 0.7,
          maxOutputTokens: options?.maxTokens || 2000,
          responseMimeType: options?.responseMimeType || 'application/json',
          ...(options?.responseSchema && { responseSchema: options.responseSchema }),
        },
      })

      console.log(`[Gemini] 이미지 포함 생성 요청 시작 - 모델: ${this.model}, 이미지 수: ${parts.filter(p => 'inlineData' in p).length}`)

      const result = await model.generateContent({ contents: [{ role: 'user', parts }] })
      const response = await result.response
      const text = response.text()

      console.log(`[Gemini] 이미지 포함 생성 성공 - 응답 길이: ${text.length}`)

      return text
    } catch (error: any) {
      console.error('[Gemini] 이미지 포함 API 오류:', {
        message: error.message,
        code: error.code,
      })

      if (error.message?.includes('API_KEY')) {
        throw new Error('Gemini API 키가 유효하지 않습니다. GEMINI_API_KEY를 확인하세요.')
      } else if (error.message?.includes('quota')) {
        throw new Error('Gemini API 요청 한도가 초과되었습니다. 잠시 후 다시 시도하세요.')
      } else if (error.message) {
        throw new Error(`Gemini 오류: ${error.message}`)
      } else {
        throw new Error('콘텐츠 생성 중 오류가 발생했습니다.')
      }
    }
  }

  /**
   * 연결 확인
   */
  async checkConnection(): Promise<boolean> {
    try {
      if (!this.genAI) {
        console.warn('[Gemini] API 키가 설정되지 않았습니다.')
        return false
      }

      // 간단한 테스트 요청으로 연결 확인
      console.log('[Gemini] 연결 확인 시작')
      const model = this.genAI.getGenerativeModel({
        model: this.model,
        generationConfig: {
          maxOutputTokens: 5,
        },
      })

      const result = await model.generateContent('test')
      const response = await result.response
      const isConnected = !!response.text()

      if (isConnected) {
        console.log(`✅ Gemini 연결 성공 - 모델: ${this.model}`)
      }

      return isConnected
    } catch (error: any) {
      console.error('[Gemini] 연결 확인 실패:', {
        message: error.message,
      })
      return false
    }
  }
}

export const geminiService = new GeminiService()

