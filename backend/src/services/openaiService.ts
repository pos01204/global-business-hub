import axios from 'axios'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'

interface OpenAIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenAIService {
  private apiKey: string
  private model: string
  private baseUrl: string

  constructor() {
    this.apiKey = OPENAI_API_KEY || ''
    this.model = OPENAI_MODEL
    this.baseUrl = OPENAI_BASE_URL

    if (!this.apiKey) {
      console.warn('⚠️ OPENAI_API_KEY가 설정되지 않았습니다. 환경 변수를 확인하세요.')
    }
  }

  async generate(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API 키가 설정되지 않았습니다. OPENAI_API_KEY 환경 변수를 설정하세요.')
      }

      console.log(`[OpenAI] 생성 요청 시작 - 모델: ${this.model}`)

      const response = await axios.post<OpenAIResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60초 타임아웃
        }
      )

      const content = response.data.choices[0]?.message?.content || ''
      console.log(`[OpenAI] 생성 성공 - 응답 길이: ${content.length}, 토큰 사용: ${response.data.usage.total_tokens}`)
      
      return content
    } catch (error: any) {
      console.error('[OpenAI] API 오류 상세:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        model: this.model,
      })

      // 더 상세한 에러 메시지 제공
      if (error.response?.status === 401) {
        throw new Error('OpenAI API 키가 유효하지 않습니다. OPENAI_API_KEY를 확인하세요.')
      } else if (error.response?.status === 429) {
        throw new Error('OpenAI API 요청 한도가 초과되었습니다. 잠시 후 다시 시도하세요.')
      } else if (error.response?.status === 404) {
        throw new Error(`모델 '${this.model}'을 찾을 수 없습니다. 사용 가능한 모델을 확인하세요.`)
      } else if (error.response?.data?.error?.message) {
        throw new Error(`OpenAI 오류: ${error.response.data.error.message}`)
      } else if (error.message) {
        throw new Error(`OpenAI 연결 오류: ${error.message}`)
      } else {
        throw new Error('콘텐츠 생성 중 오류가 발생했습니다.')
      }
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.warn('[OpenAI] API 키가 설정되지 않았습니다.')
        return false
      }

      // 간단한 테스트 요청으로 연결 확인
      console.log('[OpenAI] 연결 확인 시작')
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      )

      const isConnected = response.status === 200
      if (isConnected) {
        console.log(`✅ OpenAI 연결 성공 - 모델: ${this.model}`)
      }
      
      return isConnected
    } catch (error: any) {
      console.error('[OpenAI] 연결 확인 실패:', {
        message: error.message,
        status: error.response?.status,
        error: error.response?.data?.error?.message,
      })
      return false
    }
  }

  async generateChat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API 키가 설정되지 않았습니다. OPENAI_API_KEY 환경 변수를 설정하세요.')
      }

      console.log(`[OpenAI] 챗봇 요청 시작 - 모델: ${this.model}, 메시지 수: ${messages.length}`)

      const response = await axios.post<OpenAIResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60초 타임아웃
        }
      )

      const content = response.data.choices[0]?.message?.content || ''
      console.log(`[OpenAI] 챗봇 응답 성공 - 응답 길이: ${content.length}, 토큰 사용: ${response.data.usage.total_tokens}`)
      
      return content
    } catch (error: any) {
      console.error('[OpenAI] 챗봇 API 오류 상세:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        model: this.model,
      })

      // 더 상세한 에러 메시지 제공
      if (error.response?.status === 401) {
        throw new Error('OpenAI API 키가 유효하지 않습니다. OPENAI_API_KEY를 확인하세요.')
      } else if (error.response?.status === 429) {
        throw new Error('OpenAI API 요청 한도가 초과되었습니다. 잠시 후 다시 시도하세요.')
      } else if (error.response?.status === 404) {
        throw new Error(`모델 '${this.model}'을 찾을 수 없습니다. 사용 가능한 모델을 확인하세요.`)
      } else if (error.response?.data?.error?.message) {
        throw new Error(`OpenAI 오류: ${error.response.data.error.message}`)
      } else if (error.message) {
        throw new Error(`OpenAI 연결 오류: ${error.message}`)
      } else {
        throw new Error('챗봇 응답 생성 중 오류가 발생했습니다.')
      }
    }
  }

  /**
   * 이미지 분석 (Vision API)
   * @param imageBase64 base64 인코딩된 이미지
   * @param prompt 이미지 분석 프롬프트
   */
  async analyzeImage(
    imageBase64: string,
    prompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API 키가 설정되지 않았습니다. OPENAI_API_KEY 환경 변수를 설정하세요.')
      }

      // Vision API는 gpt-4o 또는 gpt-4o-mini 사용 (vision 지원 모델)
      const visionModel = this.model.includes('gpt-4o') ? this.model : 'gpt-4o-mini'

      console.log(`[OpenAI Vision] 이미지 분석 시작 - 모델: ${visionModel}`)

      const response = await axios.post<OpenAIResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: visionModel,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60초 타임아웃
        }
      )

      const content = response.data.choices[0]?.message?.content || ''
      console.log(`[OpenAI Vision] 분석 성공 - 응답 길이: ${content.length}, 토큰 사용: ${response.data.usage.total_tokens}`)
      
      return content
    } catch (error: any) {
      console.error('[OpenAI Vision] API 오류 상세:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        model: this.model,
      })

      if (error.response?.status === 401) {
        throw new Error('OpenAI API 키가 유효하지 않습니다. OPENAI_API_KEY를 확인하세요.')
      } else if (error.response?.status === 429) {
        throw new Error('OpenAI API 요청 한도가 초과되었습니다. 잠시 후 다시 시도하세요.')
      } else if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('image')) {
        throw new Error('이미지 형식이 올바르지 않거나 너무 큽니다. JPEG/PNG 형식의 20MB 이하 이미지를 사용하세요.')
      } else if (error.response?.data?.error?.message) {
        throw new Error(`OpenAI 오류: ${error.response.data.error.message}`)
      } else if (error.message) {
        throw new Error(`OpenAI 연결 오류: ${error.message}`)
      } else {
        throw new Error('이미지 분석 중 오류가 발생했습니다.')
      }
    }
  }

  /**
   * 사용 가능한 모델 목록 조회 (OpenAI는 API로 조회 불가, 일반적인 모델 목록 반환)
   */
  async listModels(): Promise<string[]> {
    // OpenAI는 모델 목록 API가 유료이므로 일반적인 모델 목록 반환
    return [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
    ]
  }

  /**
   * Function Calling을 사용한 구조화된 응답 생성
   */
  async generateWithFunctions(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    functions: Array<{
      name: string
      description: string
      parameters: {
        type: string
        properties: Record<string, any>
        required?: string[]
      }
    }>,
    options?: { temperature?: number; maxTokens?: number; functionCall?: string | { name: string } }
  ): Promise<{
    content: string | null
    functionCall?: {
      name: string
      arguments: Record<string, any>
    }
  }> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API 키가 설정되지 않았습니다.')
      }

      console.log(`[OpenAI] Function Calling 요청 - 모델: ${this.model}, 함수 수: ${functions.length}`)

      const requestBody: any = {
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature || 0.3,
        max_tokens: options?.maxTokens || 2000,
        tools: functions.map(fn => ({
          type: 'function',
          function: {
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters,
          },
        })),
      }

      // 특정 함수 강제 호출
      if (options?.functionCall) {
        requestBody.tool_choice = typeof options.functionCall === 'string'
          ? options.functionCall
          : { type: 'function', function: { name: options.functionCall.name } }
      }

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      )

      const choice = response.data.choices[0]
      const message = choice?.message

      // Function Call 응답 처리
      if (message?.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0]
        let parsedArgs: Record<string, any> = {}
        
        try {
          parsedArgs = JSON.parse(toolCall.function.arguments)
        } catch (e) {
          console.warn('[OpenAI] Function arguments 파싱 실패:', toolCall.function.arguments)
        }

        console.log(`[OpenAI] Function Call 성공 - 함수: ${toolCall.function.name}`)
        
        return {
          content: message.content,
          functionCall: {
            name: toolCall.function.name,
            arguments: parsedArgs,
          },
        }
      }

      return {
        content: message?.content || '',
      }
    } catch (error: any) {
      console.error('[OpenAI] Function Calling 오류:', error.message)
      throw error
    }
  }
}

export const openaiService = new OpenAIService()



