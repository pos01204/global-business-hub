import express from 'express'
import { openaiService } from '../services/openaiService'

const router = express.Router()

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// 시스템 프롬프트: 비즈니스 데이터 분석 어시스턴트
const SYSTEM_PROMPT = `당신은 글로벌 비즈니스 통합 허브의 AI 어시스턴트입니다.
주요 기능:
1. 대시보드 데이터 분석 및 인사이트 제공
2. 주문, 고객, 물류 관련 질의응답
3. 비즈니스 성과 분석 및 리포트 생성

사용자가 비즈니스 데이터에 대해 질문하면, 친절하고 전문적으로 답변해주세요.
데이터가 없는 경우, 일반적인 비즈니스 인사이트를 제공하거나 다른 기능을 안내해주세요.

답변은 한국어로 작성해주세요.`

// 챗봇 메시지 전송
router.post('/message', async (req, res) => {
  try {
    const { message, history = [] } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: '메시지가 필요합니다.',
      })
    }

    // OpenAI 연결 확인
    const isConnected = await openaiService.checkConnection()
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: 'OpenAI 서비스에 연결할 수 없습니다. OPENAI_API_KEY 환경 변수를 확인하세요.',
        troubleshooting: [
          '1. OpenAI API 키 확인: https://platform.openai.com/api-keys 에서 키 발급',
          '2. 환경 변수 설정: Railway Variables에서 OPENAI_API_KEY=sk-... 추가',
          '3. API 키 유효성 확인: 발급받은 키가 활성화되어 있는지 확인',
        ],
      })
    }

    // 대화 히스토리 구성
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10), // 최근 10개 메시지만 사용 (컨텍스트 제한)
      { role: 'user', content: message },
    ]

    // OpenAI API 호출
    const response = await openaiService.generateChat(messages, {
      temperature: 0.7,
      maxTokens: 1000,
    })

    res.json({
      success: true,
      data: {
        message: response,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('챗봇 메시지 처리 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '메시지 처리 중 오류가 발생했습니다.',
    })
  }
})

// 챗봇 상태 확인
router.get('/health', async (req, res) => {
  try {
    const isConnected = await openaiService.checkConnection()
    const models = await openaiService.listModels()

    res.json({
      success: true,
      data: {
        connected: isConnected,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        availableModels: models,
        message: isConnected
          ? 'AI 어시스턴트가 정상적으로 작동 중입니다.'
          : 'OpenAI 서비스에 연결할 수 없습니다.',
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: '상태 확인 중 오류가 발생했습니다.',
      message: error.message,
    })
  }
})

export default router

