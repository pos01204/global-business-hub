'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { chatApi } from '@/lib/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 챗봇 상태 확인
  const { data: healthData } = useQuery({
    queryKey: ['chat-health'],
    queryFn: () => chatApi.checkHealth(),
    refetchInterval: 30000, // 30초마다 상태 확인
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
      return chatApi.sendMessage(message, history)
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
      if (data?.success && data?.data?.message) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.data.message,
            timestamp: data.data.timestamp || new Date().toISOString(),
          },
        ])
      }
    },
    onError: (error: any) => {
      // 에러 메시지 추가
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

  // Enter 키 처리 (Shift+Enter는 줄바꿈)
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
          content: '안녕하세요! 글로벌 비즈니스 허브 AI 어시스턴트입니다. 😊\n\n저는 다음과 같은 도움을 드릴 수 있습니다:\n\n📊 대시보드 데이터 분석 및 인사이트 제공\n🔍 주문, 고객, 물류 관련 질의응답\n💡 비즈니스 성과 분석 및 리포트 생성\n\n무엇을 도와드릴까요?',
          timestamp: new Date().toISOString(),
        },
      ])
    }
  }, [isConnected])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
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
              ? 'AI 어시스턴트가 대화를 도와드립니다.'
              : 'OpenAI API 키를 설정하면 AI 어시스턴트를 사용할 수 있습니다.'}
          </p>
        </div>
      </div>
    </div>
  )
}

