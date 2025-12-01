import express from 'express'
import { openaiService } from '../services/openaiService'
import { AgentRouter, AgentType } from '../services/agents/AgentRouter'

const router = express.Router()

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// 세션별 대화 컨텍스트 저장 (메모리 기반, 프로덕션에서는 Redis 등 사용 권장)
const sessionContexts = new Map<string, {
  lastQuery?: string
  lastIntent?: string
  lastData?: any
  conversationCount: number
  createdAt: Date
}>()

// 오래된 세션 정리 (1시간 이상)
const cleanupOldSessions = () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  for (const [sessionId, context] of sessionContexts.entries()) {
    if (context.createdAt < oneHourAgo) {
      sessionContexts.delete(sessionId)
    }
  }
}

// 5분마다 정리 실행
setInterval(cleanupOldSessions, 5 * 60 * 1000)

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

    // 세션 컨텍스트 가져오기 또는 생성
    const effectiveSessionId = sessionId || `temp-${Date.now()}`
    let sessionContext = sessionContexts.get(effectiveSessionId)
    if (!sessionContext) {
      sessionContext = {
        conversationCount: 0,
        createdAt: new Date(),
      }
      sessionContexts.set(effectiveSessionId, sessionContext)
    }

    // 대화 컨텍스트 강화
    const enhancedHistory = history.slice(-10).map((h: any) => ({
      role: h.role,
      content: h.content,
    }))

    // 이전 대화 참조 감지 ("이전", "아까", "그", "그것" 등)
    const referenceKeywords = ['이전', '아까', '그것', '그거', '위', '방금', '다시', '더']
    const hasReference = referenceKeywords.some(kw => message.includes(kw))
    
    // Agent Router 초기화
    const agentRouter = new AgentRouter({
      sessionId: effectiveSessionId,
      history: enhancedHistory,
      previousQuery: sessionContext.lastQuery,
      previousIntent: sessionContext.lastIntent,
      previousData: hasReference ? sessionContext.lastData : undefined,
    })

    // Agent를 통한 처리
    const result = await agentRouter.route(message, agentType as AgentType, {
      sessionId: effectiveSessionId,
      history: enhancedHistory,
      previousQuery: sessionContext.lastQuery,
      previousIntent: sessionContext.lastIntent,
      previousData: hasReference ? sessionContext.lastData : undefined,
    })

    // 세션 컨텍스트 업데이트
    sessionContext.lastQuery = message
    sessionContext.lastIntent = agentType
    sessionContext.lastData = result.data
    sessionContext.conversationCount++

    res.json({
      success: true,
      data: {
        message: result.response,
        agent: result.agent,
        data: result.data,
        charts: result.charts,
        actions: result.actions,
        timestamp: new Date().toISOString(),
        sessionInfo: {
          sessionId: effectiveSessionId,
          conversationCount: sessionContext.conversationCount,
        },
      },
    })
  } catch (error: any) {
    console.error('챗봇 메시지 처리 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '메시지 처리 중 오류가 발생했습니다.',
      suggestion: '잠시 후 다시 시도하거나, 다른 방식으로 질문해보세요.',
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

