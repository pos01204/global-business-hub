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

// Agent 메타 정보
const AGENT_META: Record<AgentType, { icon: string; color: string; bgColor: string; description: string }> = {
  auto: { 
    icon: '🤖', 
    color: 'text-slate-700', 
    bgColor: 'bg-slate-100 hover:bg-slate-200 border-slate-300',
    description: '질문에 맞는 역할 자동 선택'
  },
  data_analyst: { 
    icon: '📊', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-300',
    description: '매출, 트렌드, 랭킹 분석'
  },
  performance_marketer: { 
    icon: '📈', 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-50 hover:bg-purple-100 border-purple-300',
    description: '마케팅 카피, CRM 세그먼트'
  },
  business_manager: { 
    icon: '💼', 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300',
    description: '전략 수립, 예측, 시뮬레이션'
  },
}

// 빠른 질문 카테고리 - 실제 구현된 Agent 기능 기반
const QUICK_QUESTIONS = [
  { 
    category: '📊 매출 분석', 
    icon: '📊',
    agent: 'data_analyst' as AgentType,
    questions: [
      '최근 30일 매출 현황 알려줘',
      '이번 달 vs 지난 달 매출 비교',
      '일별 매출 추이 보여줘',
      '주간 단위로 트렌드 분석해줘',
      '최근 90일 트렌드 분석해줘',
      '전월 대비 비교 분석해줘',
    ]
  },
  { 
    category: '🏆 랭킹 & 순위', 
    icon: '🏆',
    agent: 'data_analyst' as AgentType,
    questions: [
      '상위 10개 작가 매출 순위',
      '상위 20개 작가 랭킹 보여줘',
      '베스트셀러 상품 TOP 10',
      '국가별 매출 순위',
      '플랫폼별 매출 순위',
      '매출 상위 작가 상세 분석',
    ]
  },
  { 
    category: '🌏 국가별 분석', 
    icon: '🌏',
    agent: 'data_analyst' as AgentType,
    questions: [
      '국가별 주문 현황 비교해줘',
      '일본 데이터만 상세 분석해줘',
      '미국 시장 트렌드 분석',
      '홍콩 고객 구매 패턴',
      '대만 주문 현황 분석',
      '국가별로 비교 분석해줘',
    ]
  },
  { 
    category: '📦 물류 & 배송', 
    icon: '📦',
    agent: 'data_analyst' as AgentType,
    questions: [
      '배송 현황 분석해줘',
      '물류 처리 시간 분석',
      '국가별 배송 소요 시간',
      '미입고 현황 분석',
      '검수 대기 현황',
    ]
  },
  { 
    category: '👥 고객 분석', 
    icon: '👥',
    agent: 'data_analyst' as AgentType,
    questions: [
      '고객 세그먼트 분석',
      '재구매율 높은 고객 특성',
      '신규 고객 vs 기존 고객 비교',
      '고객별 평균 주문 금액',
      '국가별 고객 분포',
    ]
  },
  { 
    category: '🎨 작가 분석', 
    icon: '🎨',
    agent: 'data_analyst' as AgentType,
    questions: [
      '작가별 매출 분석',
      '작가별 인기 상품 분석해줘',
      '신규 작가 성과 분석',
      '작가별 주문 건수 비교',
      '작가 성장률 분석',
    ]
  },
  { 
    category: '💼 비즈니스 전략', 
    icon: '💼',
    agent: 'business_manager' as AgentType,
    questions: [
      '매출 증대 전략 제안해줘',
      '다음 분기 매출 예측해줘',
      '비즈니스 인사이트 생성해줘',
      '성장 전략 분석해줘',
      '시장 확장 전략 제안',
    ]
  },
  { 
    category: '📈 마케팅 인사이트', 
    icon: '📈',
    agent: 'performance_marketer' as AgentType,
    questions: [
      '마케팅 성과 분석해줘',
      '트렌드 기반 마케팅 카피 생성',
      'CRM 세그먼트 분석',
      '프로모션 효과 분석',
      '시즌별 마케팅 전략',
    ]
  },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('auto')
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const [useStreaming, setUseStreaming] = useState(true)
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedCategory, setExpandedCategory] = useState<string | null>('📊 매출 분석')
  const streamingContentRef = useRef('')
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
  const handleSend = async () => {
    if (!input.trim() || sendMessageMutation.isPending || isStreaming) return

    const userMessage = input.trim()
    setInput('')

    // 스트리밍 모드
    if (useStreaming) {
      // 사용자 메시지 추가
      setMessages(prev => [
        ...prev,
        {
          role: 'user',
          content: userMessage,
          timestamp: new Date().toISOString(),
        },
      ])

      setIsStreaming(true)
      setStreamingContent('')

      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))

      streamingContentRef.current = ''
      
      await chatApi.sendMessageStream(
        userMessage,
        history,
        selectedAgent,
        sessionId,
        // onChunk
        (chunk) => {
          streamingContentRef.current += chunk
          setStreamingContent(streamingContentRef.current)
        },
        // onMetadata
        (metadata) => {
          const finalContent = streamingContentRef.current
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: finalContent || metadata.content || '',
              timestamp: new Date().toISOString(),
              agent: metadata.agent,
              data: metadata.data,
              charts: metadata.charts,
              actions: metadata.actions,
            },
          ])
          streamingContentRef.current = ''
          setStreamingContent('')
        },
        // onError
        (error) => {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `오류가 발생했습니다: ${error}`,
              timestamp: new Date().toISOString(),
            },
          ])
          streamingContentRef.current = ''
          setStreamingContent('')
        },
        // onDone
        () => {
          setIsStreaming(false)
        }
      )
    } else {
      // 기존 방식
      sendMessageMutation.mutate(userMessage)
    }
  }

  // 액션 버튼 클릭 핸들러
  const handleActionClick = (action: { label: string; action: string; data?: any }) => {
    switch (action.action) {
      case 'query':
        // 새로운 질문 전송
        if (action.data?.query) {
          sendMessageMutation.mutate(action.data.query)
        }
        break
      case 'switch_agent':
        // Agent 전환
        if (action.data?.agent) {
          setSelectedAgent(action.data.agent as AgentType)
        }
        break
      case 'visualize':
        // 시각화 요청
        sendMessageMutation.mutate(`이전 데이터를 ${action.data?.type || '차트'}로 시각화해줘`)
        break
      case 'export':
        // 데이터 내보내기
        handleExportData(action.data)
        break
      case 'view_strategy':
        // 전략 상세 보기
        if (action.data?.strategies) {
          sendMessageMutation.mutate(`전략을 더 자세히 설명해줘: ${JSON.stringify(action.data.strategies.slice(0, 2))}`)
        } else {
          sendMessageMutation.mutate('제안된 전략에 대해 더 자세히 설명해줘')
        }
        break
      case 'generate_copy':
        // 마케팅 카피 생성
        sendMessageMutation.mutate('위 트렌드 데이터를 바탕으로 마케팅 카피를 생성해줘')
        break
      case 'export_segment':
        // 세그먼트 내보내기
        handleExportData(action.data)
        break
      case 'detail':
        // 상세 분석
        sendMessageMutation.mutate('이전 결과에 대해 더 자세히 분석해줘')
        break
      default:
        // 알 수 없는 액션은 질문으로 변환
        sendMessageMutation.mutate(`${action.label}에 대해 더 알려줘`)
    }
  }

  // 데이터 내보내기 핸들러
  const handleExportData = (data: any) => {
    try {
      // 마지막 메시지에서 데이터 찾기
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant' && m.data)
      const exportData = data?.segments || data || lastAssistantMessage?.data

      if (!exportData || (Array.isArray(exportData) && exportData.length === 0)) {
        alert('내보낼 데이터가 없습니다.')
        return
      }

      // CSV 변환
      const dataArray = Array.isArray(exportData) ? exportData : [exportData]
      const headers = Object.keys(dataArray[0])
      const csvContent = [
        headers.join(','),
        ...dataArray.map(row => 
          headers.map(h => {
            const val = row[h]
            // 쉼표나 줄바꿈이 있으면 따옴표로 감싸기
            if (typeof val === 'string' && (val.includes(',') || val.includes('\n'))) {
              return `"${val.replace(/"/g, '""')}"`
            }
            return val ?? ''
          }).join(',')
        )
      ].join('\n')

      // 다운로드
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('데이터 내보내기 중 오류가 발생했습니다.')
    }
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

  // 초기 환영 메시지는 빈 상태 UI로 대체됨 (messages.length === 0 && isConnected 조건에서 렌더링)

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

  // 빠른 질문 전송
  const handleQuickQuestion = (question: string) => {
    if (useStreaming) {
      setInput(question)
      setTimeout(() => handleSend(), 100)
    } else {
      sendMessageMutation.mutate(question)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* 사이드바 */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col overflow-hidden`}>
        {sidebarOpen && (
          <>
            {/* 사이드바 헤더 */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">💡 빠른 질문</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 빠른 질문 카테고리 */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {QUICK_QUESTIONS.map((cat) => {
                const agentMeta = AGENT_META[cat.agent]
                return (
                  <div key={cat.category} className="rounded-lg border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                      className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{cat.category}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${agentMeta.bgColor} ${agentMeta.color}`}>
                          {cat.questions.length}
                        </span>
                      </div>
                      <span className={`transition-transform text-xs ${expandedCategory === cat.category ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {expandedCategory === cat.category && (
                      <div className="p-2 space-y-1 bg-white">
                        {/* Agent 힌트 */}
                        <div className="px-3 py-1.5 text-[10px] text-slate-400 flex items-center gap-1">
                          <span>{agentMeta.icon}</span>
                          <span>{agentMeta.description}</span>
                        </div>
                        {cat.questions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              // 해당 Agent로 자동 전환
                              if (cat.agent !== 'auto') {
                                setSelectedAgent(cat.agent)
                              }
                              handleQuickQuestion(q)
                            }}
                            disabled={sendMessageMutation.isPending || isStreaming}
                            className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            <span className="text-slate-400">→</span>
                            <span>{q}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 새 대화 버튼 */}
            <div className="p-3 border-t border-slate-200">
              <button
                onClick={() => {
                  setMessages([])
                  setInput('')
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>🔄</span> 새 대화 시작
              </button>
            </div>
          </>
        )}
      </div>

      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 헤더 */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                  title="사이드바 열기"
                >
                  ☰
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-2xl">💬</span> AI 어시스턴트
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  자연어 기반 데이터 분석 및 질의응답
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* 스트리밍 토글 */}
              <button
                onClick={() => setUseStreaming(!useStreaming)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  useStreaming 
                    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300' 
                    : 'bg-slate-100 text-slate-600'
                }`}
                title={useStreaming ? '스트리밍 모드 (실시간 응답)' : '일반 모드'}
              >
                <span className={`w-2 h-2 rounded-full ${useStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {useStreaming ? '⚡ 실시간' : '📦 일반'}
              </button>
              
              {/* 연결 상태 */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {isConnected ? 'AI 연결됨' : '연결 안 됨'}
              </div>
            </div>
          </div>

          {/* Agent 선택 - 카드 형태 */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {(['auto', 'data_analyst', 'performance_marketer', 'business_manager'] as AgentType[]).map((agentType) => {
              const meta = AGENT_META[agentType]
              const agentInfo = agentsData?.data?.find((a: any) => a.type === agentType)
              const isSelected = selectedAgent === agentType
              
              return (
                <button
                  key={agentType}
                  onClick={() => setSelectedAgent(agentType)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected 
                      ? `${meta.bgColor} border-current ring-2 ring-offset-1 ${meta.color}` 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{meta.icon}</span>
                    <span className={`text-sm font-semibold ${isSelected ? meta.color : 'text-slate-700'}`}>
                      {agentInfo?.name || agentType}
                    </span>
                  </div>
                  <p className={`text-xs ${isSelected ? meta.color : 'text-slate-500'}`}>
                    {meta.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && !isConnected && (
              <div className="text-center py-16">
                <div className="text-7xl mb-4">🤖</div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  AI 어시스턴트 연결 중...
                </h2>
                <p className="text-slate-600">
                  OpenAI 서비스에 연결할 수 없습니다.
                  <br />
                  <span className="text-sm text-slate-500">Railway Variables에서 OPENAI_API_KEY를 설정해주세요.</span>
                </p>
              </div>
            )}

            {/* 빈 상태 - 시작 가이드 */}
            {messages.length === 0 && isConnected && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">👋</div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  무엇을 도와드릴까요?
                </h2>
                <p className="text-slate-600 mb-6">
                  왼쪽 사이드바에서 빠른 질문을 선택하거나, 아래에 직접 질문해보세요.
                </p>
                
                {/* 인기 질문 */}
                <div className="mb-6">
                  <p className="text-xs text-slate-400 mb-3">🔥 인기 질문</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['최근 30일 매출 현황', '상위 10개 작가 매출 순위', '국가별 주문 현황 비교해줘', '일별 매출 추이 보여줘'].map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickQuestion(q)}
                        className="px-4 py-2 bg-white border border-slate-200 hover:border-primary hover:bg-primary/5 rounded-full text-sm text-slate-700 hover:text-primary transition-all shadow-sm"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Agent별 추천 */}
                <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="text-2xl mb-2">📊</div>
                    <p className="text-xs font-medium text-blue-700 mb-2">데이터 분석</p>
                    <button
                      onClick={() => { setSelectedAgent('data_analyst'); handleQuickQuestion('이번 달 vs 지난 달 매출 비교'); }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      매출 비교 분석 →
                    </button>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="text-2xl mb-2">💼</div>
                    <p className="text-xs font-medium text-emerald-700 mb-2">비즈니스 전략</p>
                    <button
                      onClick={() => { setSelectedAgent('business_manager'); handleQuickQuestion('매출 증대 전략 제안해줘'); }}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      전략 제안 받기 →
                    </button>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="text-2xl mb-2">📈</div>
                    <p className="text-xs font-medium text-purple-700 mb-2">마케팅 인사이트</p>
                    <button
                      onClick={() => { setSelectedAgent('performance_marketer'); handleQuickQuestion('마케팅 성과 분석해줘'); }}
                      className="text-xs text-purple-600 hover:underline"
                    >
                      성과 분석 →
                    </button>
                  </div>
                </div>
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
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-primary to-primary/90 text-white'
                    : 'bg-white border border-slate-200 text-slate-900'
                }`}
              >
                {message.agent && message.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                    <span>{AGENT_META[message.agent.toLowerCase().replace(/ /g, '_') as AgentType]?.icon || '🤖'}</span>
                    <span>{message.agent}</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words leading-relaxed">
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
                        onClick={() => handleActionClick(action)}
                        disabled={sendMessageMutation.isPending || isStreaming}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`text-xs mt-2 flex items-center gap-1 ${
                    message.role === 'user'
                      ? 'text-white/70 justify-end'
                      : 'text-slate-400'
                  }`}
                >
                  <span>
                    {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* 스트리밍 중인 메시지 표시 */}
          {isStreaming && streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white border border-slate-200 text-slate-900 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                  <span>{AGENT_META[selectedAgent]?.icon || '🤖'}</span>
                  <span>응답 중...</span>
                </div>
                <div className="whitespace-pre-wrap break-words leading-relaxed">
                  {streamingContent}
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 rounded" />
                </div>
              </div>
            </div>
          )}

          {(sendMessageMutation.isPending || (isStreaming && !streamingContent)) && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span className="text-sm text-slate-500">
                    {isStreaming ? '응답 수신 중...' : '답변 생성 중...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

        {/* 입력 영역 */}
        <div className="bg-white border-t border-slate-200 px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
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
                  disabled={!isConnected || sendMessageMutation.isPending || isStreaming}
                  rows={1}
                  className="w-full resize-none border border-slate-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
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
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || !isConnected || sendMessageMutation.isPending || isStreaming}
                className="px-5 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                <span>전송</span>
                <span>→</span>
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>
                {isConnected && (
                  <>
                    <span className="inline-flex items-center gap-1">
                      {AGENT_META[selectedAgent]?.icon}
                      <span>{agentsData?.data?.find((a: any) => a.type === selectedAgent)?.name || '자동 선택'}</span>
                    </span>
                    <span className="mx-2">•</span>
                    <span>Enter로 전송</span>
                  </>
                )}
              </span>
              {messages.length > 0 && (
                <span className="text-slate-400">
                  {messages.filter(m => m.role === 'user').length}개 질문
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
