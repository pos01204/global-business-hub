import axios from 'axios'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3'

interface OllamaResponse {
  model: string
  created_at: string
  response: string
  done: boolean
}

export class OllamaService {
  private baseUrl: string
  private model: string

  constructor() {
    this.baseUrl = OLLAMA_BASE_URL
    this.model = OLLAMA_MODEL
  }

  async generate(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    try {
      console.log(`[Ollama] 생성 요청 시작 - 모델: ${this.model}, URL: ${this.baseUrl}/api/generate`)
      
      const response = await axios.post<OllamaResponse>(
        `${this.baseUrl}/api/generate`,
        {
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: options?.temperature || 0.7,
            num_predict: options?.maxTokens || 1000,
          },
        },
        {
          timeout: 60000, // 60초 타임아웃
        }
      )

      console.log(`[Ollama] 생성 성공 - 응답 길이: ${response.data.response?.length || 0}`)
      return response.data.response
    } catch (error: any) {
      console.error('[Ollama] API 오류 상세:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        baseUrl: this.baseUrl,
        model: this.model,
      })
      
      // 더 상세한 에러 메시지 제공
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Ollama 서비스에 연결할 수 없습니다. ${this.baseUrl}에서 실행 중인지 확인하세요.`)
      } else if (error.response?.status === 404) {
        throw new Error(`모델 '${this.model}'을 찾을 수 없습니다. 'ollama pull ${this.model}' 명령어로 모델을 다운로드하세요.`)
      } else if (error.response?.data?.error) {
        throw new Error(`Ollama 오류: ${error.response.data.error}`)
      } else if (error.message) {
        throw new Error(`Ollama 연결 오류: ${error.message}`)
      } else {
        throw new Error('콘텐츠 생성 중 오류가 발생했습니다.')
      }
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      console.log(`[Ollama] 연결 확인 시작 - URL: ${this.baseUrl}/api/tags`)
      const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 })
      const isConnected = response.status === 200
      
      if (isConnected) {
        const models = response.data?.models || []
        console.log(`[Ollama] 연결 성공 - 사용 가능한 모델: ${models.map((m: any) => m.name).join(', ')}`)
        
        const hasModel = models.some((m: any) => 
          m.name === this.model || m.name.includes(this.model.split(':')[0])
        )
        
        if (!hasModel) {
          console.warn(`⚠️ Ollama는 연결되었지만 모델 '${this.model}'이 설치되지 않았습니다.`)
          console.warn(`사용 가능한 모델: ${models.map((m: any) => m.name).join(', ')}`)
        } else {
          console.log(`✅ 모델 '${this.model}' 확인됨`)
        }
      }
      
      return isConnected
    } catch (error: any) {
      console.error('[Ollama] 연결 확인 실패:', {
        message: error.message,
        code: error.code,
        url: `${this.baseUrl}/api/tags`,
      })
      return false
    }
  }

  /**
   * 사용 가능한 모델 목록 조회
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 })
      const models = response.data?.models || []
      return models.map((m: any) => m.name)
    } catch (error) {
      console.error('모델 목록 조회 실패:', error)
      return []
    }
  }
}

export const ollamaService = new OllamaService()

