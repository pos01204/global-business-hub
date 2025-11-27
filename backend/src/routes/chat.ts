import express from 'express'
import { openaiService } from '../services/openaiService'
import { AgentRouter, AgentType } from '../services/agents/AgentRouter'

const router = express.Router()

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// 챗봇 메시지 전송 (고도화된 Agent 기반)
router.post('/message', async (req, res) => {
  try {
    const { message, history = [], agentType = 'auto', sessionId } = req.body

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

    // Agent Router 초기화
    const router = new AgentRouter({
      sessionId,
      history: history.slice(-10), // 최근 10개 메시지만 사용
    })

    // Agent를 통한 처리
    const result = await router.route(message, agentType as AgentType, {
      sessionId,
      history: history.slice(-10),
    })

    res.json({
      success: true,
      data: {
        message: result.response,
        agent: result.agent,
        data: result.data,
        charts: result.charts,
        actions: result.actions,
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
    const agentRouter = new AgentRouter()
    const availableAgents = agentRouter.getAvailableAgents()

    res.json({
      success: true,
      data: {
        connected: isConnected,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        availableModels: models,
        availableAgents,
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

// 사용 가능한 Agent 목록 조회
router.get('/agents', async (req, res) => {
  try {
    const agentRouter = new AgentRouter()
    const agents = agentRouter.getAvailableAgents()

    res.json({
      success: true,
      data: agents,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Agent 목록 조회 중 오류가 발생했습니다.',
      message: error.message,
    })
  }
})

export default router

