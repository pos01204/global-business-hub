'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { chatApi } from '@/lib/api'
import { Bar, Line, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  agent?: string
  data?: any
  charts?: any[]
  actions?: Array<{ label: string; action: string; data?: any }>
}

type AgentType = 'data_analyst' | 'performance_marketer' | 'business_manager' | 'auto'

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('auto')
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 챗봇 상태 확인
  const { data: healthData } = useQuery({
    queryKey: ['chat-health'],
    queryFn: () => chatApi.checkHealth(),
    refetchInterval: 30000,
  })

  // 사용 가능한 Agent 목록 조회
  const { data: agentsData } = useQuery({
    queryKey: ['chat-agents'],
    queryFn: () => chatApi.getAgents(),
  })

  // 연결 상태 업데이트
  useEffect(() => {
    if (healthData) {
      setIsConnected(healthData?.success && healthData?.data?.connected)
    }
  }, [healthData])

  // 메시지 전송 뮤테이션
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => {
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))
      return chatApi.sendMessage(message, history, selectedAgent, sessionId)
    },
    onSuccess: (data, message) => {
      // 사용자 메시지 추가
      setMessages(prev => [
        ...prev,
        {
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        },
      ])

      // AI 응답 추가
      if (data?.success && data?.data) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.data.message,
            timestamp: data.data.timestamp || new Date().toISOString(),
            agent: data.data.agent,
            data: data.data.data,
            charts: data.data.charts,
            actions: data.data.actions,
          },
        ])
      }
    },
    onError: (error: any) => {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`,
          timestamp: new Date().toISOString(),
        },
      ])
    },
  })

  // 메시지 전송 핸들러
  const handleSend = () => {
    if (!input.trim() || sendMessageMutation.isPending) return

    sendMessageMutation.mutate(input.trim())
    setInput('')
  }

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 초기 환영 메시지
  useEffect(() => {
    if (messages.length === 0 && isConnected) {
      setMessages([
        {
          role: 'assistant',
          content: '안녕하세요! 글로벌 비즈니스 허브 AI 어시스턴트입니다. 😊\n\n저는 다음과 같은 역할로 도움을 드릴 수 있습니다:\n\n📊 데이터 분석가: 데이터 조회, 분석, 통계, 트렌드 분석\n📈 퍼포먼스 마케터: 트렌드 추출, 마케팅 카피 생성, CRM 세그먼트\n💼 비즈니스 매니저: 전략 수립, 메트릭 예측, 시나리오 시뮬레이션\n\n위에서 역할을 선택하거나 "자동 선택"으로 두시면 질문 내용에 따라 자동으로 적절한 역할이 선택됩니다.\n\n무엇을 도와드릴까요?',
          timestamp: new Date().toISOString(),
        },
      ])
    }
  }, [isConnected])

  // 차트 렌더링
  const renderChart = (chartData: any) => {
    if (!chartData || !chartData.type) return null

    const { type, labels, values, title } = chartData

    const commonOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: !!title,
          text: title,
        },
      },
    }

    if (type === 'bar' && labels && values) {
      return (
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: title || '데이터',
                data: values,
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
              },
            ],
          }}
          options={commonOptions}
        />
      )
    }

    if (type === 'line' && labels && values) {
      return (
        <Line
          data={{
            labels,
            datasets: [
              {
                label: title || '데이터',
                data: values,
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
              },
            ],
          }}
          options={commonOptions}
        />
      )
    }

    if (type === 'pie' && labels && values) {
      return (
        <Pie
          data={{
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: [
                  'rgba(59, 130, 246, 0.5)',
                  'rgba(16, 185, 129, 0.5)',
                  'rgba(245, 158, 11, 0.5)',
                  'rgba(239, 68, 68, 0.5)',
                  'rgba(139, 92, 246, 0.5)',
                ],
              },
            ],
          }}
          options={commonOptions}
        />
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">💬 AI 어시스턴트</h1>
              <p className="text-sm text-gray-600 mt-1">
                자연어 기반 데이터 분석 및 질의응답 서비스
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-600">
                {isConnected ? '연결됨' : '연결 안 됨'}
              </span>
            </div>
          </div>

          {/* Agent 선택 */}
          {agentsData?.success && agentsData?.data && (
            <div className="flex flex-wrap gap-2">
              {agentsData.data.map((agent: any) => (
                <button
                  key={agent.type}
                  onClick={() => setSelectedAgent(agent.type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedAgent === agent.type
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {agent.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && !isConnected && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                AI 어시스턴트 연결 중...
              </h2>
              <p className="text-gray-600">
                OpenAI 서비스에 연결할 수 없습니다.
                <br />
                Railway Variables에서 OPENAI_API_KEY를 설정해주세요.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                {message.agent && message.role === 'assistant' && (
                  <div className="text-xs font-semibold text-gray-500 mb-2">
                    {message.agent}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>

                {/* 차트 표시 */}
                {message.charts && message.charts.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {message.charts.map((chart, chartIndex) => (
                      <div key={chartIndex} className="bg-gray-50 p-4 rounded-lg">
                        {renderChart(chart)}
                      </div>
                    ))}
                  </div>
                )}

                {/* 데이터 테이블 표시 */}
                {message.data && Array.isArray(message.data) && message.data.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {Object.keys(message.data[0]).map((key) => (
                            <th key={key} className="text-left py-2 px-3 font-semibold">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {message.data.slice(0, 10).map((row: any, rowIndex: number) => (
                          <tr key={rowIndex} className="border-b">
                            {Object.values(row).map((value: any, colIndex: number) => (
                              <td key={colIndex} className="py-2 px-3">
                                {typeof value === 'number'
                                  ? value.toLocaleString()
                                  : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {message.data.length > 10 && (
                      <div className="text-xs text-gray-500 mt-2 text-center">
                        총 {message.data.length}건 중 10건만 표시
                      </div>
                    )}
                  </div>
                )}

                {/* 액션 버튼 */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {message.actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => {
                          // 액션 처리 로직 (필요시 구현)
                          console.log('Action clicked:', action)
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`text-xs mt-2 ${
                    message.role === 'user'
                      ? 'text-white/70'
                      : 'text-gray-500'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}

          {sendMessageMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">답변 생성 중...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isConnected
                  ? '메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)'
                  : 'AI 어시스턴트가 연결되지 않았습니다.'
              }
              disabled={!isConnected || sendMessageMutation.isPending}
              rows={1}
              className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              style={{
                minHeight: '48px',
                maxHeight: '120px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !isConnected || sendMessageMutation.isPending}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              전송
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {isConnected
              ? `현재 역할: ${agentsData?.data?.find((a: any) => a.type === selectedAgent)?.name || '자동 선택'}`
              : 'OpenAI API 키를 설정하면 AI 어시스턴트를 사용할 수 있습니다.'}
          </p>
        </div>
      </div>
    </div>
  )
}
