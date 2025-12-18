/**
 * AIQueryChat - AI 자연어 질의 채팅 컴포넌트
 * Business Brain의 LangChain 기반 AI 에이전트와 대화
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  MessageCircle, Send, Loader2, X, Sparkles, 
  HelpCircle, RefreshCw, ChevronDown, ChevronUp,
  Brain, Lightbulb, TrendingUp, Users, AlertTriangle
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  data?: any
  isLoading?: boolean
}

interface AIQueryChatProps {
  className?: string
  onInsightClick?: (insight: any) => void
}

// 추천 질문 목록
const SUGGESTED_QUESTIONS = [
  { icon: TrendingUp, text: '최근 매출 트렌드를 분석해줘', category: 'revenue' },
  { icon: Users, text: 'VIP 고객 현황을 알려줘', category: 'customer' },
  { icon: AlertTriangle, text: '이상 징후가 있는지 확인해줘', category: 'anomaly' },
  { icon: Lightbulb, text: '성장 기회를 찾아줘', category: 'opportunity' },
  { icon: Brain, text: '이번 달 매출 예측해줘', category: 'forecast' },
]

export function AIQueryChat({ className = '', onInsightClick }: AIQueryChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '안녕하세요! Business Brain AI입니다. 비즈니스 데이터에 대해 무엇이든 물어보세요. 매출 트렌드, 고객 분석, 이상 탐지, 예측 등 다양한 분석을 도와드립니다.',
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 메시지 목록 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 채팅창 열릴 때 포커스
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  // AI 쿼리 전송
  const sendQuery = async (query: string) => {
    if (!query.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    }

    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/business-brain/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      const data = await response.json()

      // 로딩 메시지 제거하고 실제 응답 추가
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isLoading)
        return [...filtered, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response || data.message || '응답을 생성하지 못했습니다.',
          timestamp: new Date(),
          data: data.data,
        }]
      })
    } catch (error) {
      console.error('AI Query Error:', error)
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isLoading)
        return [...filtered, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          timestamp: new Date(),
        }]
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 대화 초기화
  const resetConversation = async () => {
    try {
      await fetch('/api/business-brain/ai/reset', { method: 'POST' })
      setMessages([{
        id: 'welcome-reset',
        role: 'assistant',
        content: '대화가 초기화되었습니다. 새로운 질문을 해주세요!',
        timestamp: new Date(),
      }])
    } catch (error) {
      console.error('Reset Error:', error)
    }
  }

  // 추천 질문 클릭
  const handleSuggestedQuestion = (question: string) => {
    sendQuery(question)
  }

  // 키보드 이벤트
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendQuery(input)
    }
  }

  // 플로팅 버튼
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 ${className}`}
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-medium">AI에게 질문</span>
      </button>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className={`w-96 shadow-2xl border-0 overflow-hidden transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[500px]'}`}>
        {/* 헤더 */}
        <div 
          className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white cursor-pointer"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            <span className="font-semibold">Business Brain AI</span>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); resetConversation(); }}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="대화 초기화"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[360px] bg-slate-50 dark:bg-slate-900">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm rounded-bl-md'
                    }`}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">분석 중...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.data && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <button
                              onClick={() => onInsightClick?.(message.data)}
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              <Lightbulb className="w-3 h-3" />
                              상세 데이터 보기
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 추천 질문 (메시지가 적을 때만) */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">추천 질문</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUESTIONS.slice(0, 3).map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQuestion(q.text)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <q.icon className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 입력 영역 */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="질문을 입력하세요..."
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border-0 rounded-full focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder-slate-400"
                />
                <button
                  onClick={() => sendQuery(input)}
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default AIQueryChat




