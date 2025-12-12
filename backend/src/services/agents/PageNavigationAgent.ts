/**
 * 페이지 네비게이션 Agent
 * 자연어에서 페이지 이동 의도를 추출하고 액션을 생성
 */

import { openaiService } from '../openaiService'

export interface NavigationIntent {
  targetPage: string
  path: string
  params: Record<string, any>
  confidence: number
  isPrimaryAction?: boolean // true: 즉시 이동 제안, false: 보조 액션
}

export interface PageRoute {
  path: string
  description: string
  params: string[]
}

export class PageNavigationAgent {
  private pageRoutes: Map<string, PageRoute>

  constructor() {
    this.pageRoutes = new Map()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.pageRoutes.set('대시보드', {
      path: '/dashboard',
      description: '메인 대시보드 페이지',
      params: []
    })

    this.pageRoutes.set('성과 분석', {
      path: '/analytics',
      description: '성과 분석 페이지',
      params: ['tab', 'metric', 'period']
    })

    this.pageRoutes.set('비즈니스 브레인', {
      path: '/business-brain',
      description: 'Business Brain 페이지',
      params: ['tab', 'focus', 'period']
    })

    this.pageRoutes.set('작가 분석', {
      path: '/artist-analytics',
      description: '작가 분석 페이지',
      params: ['artist', 'period']
    })

    this.pageRoutes.set('물류 운영', {
      path: '/logistics',
      description: '물류 운영 페이지',
      params: []
    })

    this.pageRoutes.set('미입고 관리', {
      path: '/logistics/unreceived',
      description: '미입고 관리 페이지',
      params: []
    })

    this.pageRoutes.set('물류 추적', {
      path: '/logistics/tracking',
      description: '물류 추적 페이지',
      params: []
    })

    this.pageRoutes.set('물류 관제센터', {
      path: '/logistics/control',
      description: '물류 관제센터 페이지',
      params: []
    })

    this.pageRoutes.set('물류비 정산', {
      path: '/cost-analysis',
      description: '물류비 정산 페이지',
      params: []
    })

    this.pageRoutes.set('QC 관리', {
      path: '/qc',
      description: 'QC 관리 페이지',
      params: []
    })

    this.pageRoutes.set('소포수령증', {
      path: '/sopo-receipt',
      description: '소포수령증 페이지',
      params: []
    })

    this.pageRoutes.set('통합 검색', {
      path: '/search',
      description: '통합 검색 페이지',
      params: ['query']
    })
  }

  /**
   * 자연어에서 페이지 이동 의도 추출
   */
  async extractNavigationIntent(
    query: string
  ): Promise<NavigationIntent | null> {
    // OpenAI 연결 확인
    const isConnected = await openaiService.checkConnection()
    
    if (!isConnected) {
      return this.fallbackNavigationExtraction(query)
    }

    const availablePages = Array.from(this.pageRoutes.entries())
      .map(([name, route]) => `- ${name}: ${route.path} (${route.description})`)
      .join('\n')

    const prompt = `
사용자 질문: "${query}"

이 질문에서 관련 페이지가 있는지 판단하고, 관련 페이지와 필요한 파라미터를 추출하세요.

**중요**: 페이지 이동은 보조 도구입니다. 질문에 대한 답변을 먼저 제공해야 합니다.

사용 가능한 페이지:
${availablePages}

페이지 이동 관련 키워드:
- "이동", "보여줘", "보기", "열기", "가기", "페이지", "화면"
- "대시보드", "성과 분석", "비즈니스 브레인", "작가 분석" 등

**판단 기준**:
1. 질문이 "대시보드로 이동해줘"처럼 명확한 이동 요청인 경우: confidence > 0.95
2. 질문이 "매출 분석"처럼 관련 페이지가 있는 경우: confidence 0.7-0.95
3. 질문과 관련 페이지가 없는 경우: confidence < 0.7

응답 형식 (JSON):
{
  "isNavigation": true,
  "targetPage": "성과 분석",
  "path": "/analytics",
  "params": {
    "tab": "overview",
    "metric": "gmv"
  },
  "confidence": 0.95,
  "isPrimaryAction": false  // true: 즉시 이동, false: 보조 액션
}

페이지 이동이 아닌 경우:
{
  "isNavigation": false,
  "confidence": 0.1
}
`

    try {
      // generateChat 사용 (JSON 모드 지원)
      const response = await openaiService.generateChat(
        [
          {
            role: 'system',
            content: '당신은 사용자의 페이지 이동 의도를 정확히 파악하는 전문가입니다. 응답은 반드시 JSON 형식이어야 합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        {
          temperature: 0.2,
          maxTokens: 500
        }
      )

      const result = JSON.parse(response || '{}')

      if (result.isNavigation && result.confidence > 0.7) {
        return {
          targetPage: result.targetPage,
          path: result.path,
          params: result.params || {},
          confidence: result.confidence || 0.8,
          isPrimaryAction: result.isPrimaryAction === true // 명확한 이동 요청인 경우만 true
        }
      }

      return null
    } catch (error) {
      console.error('[PageNavigationAgent] 네비게이션 의도 추출 실패:', error)
      return this.fallbackNavigationExtraction(query)
    }
  }

  /**
   * 폴백 네비게이션 추출 (키워드 기반)
   */
  private fallbackNavigationExtraction(query: string): NavigationIntent | null {
    const lowerQuery = query.toLowerCase()

    // 키워드 매칭
    const keywordMap: Record<string, string> = {
      '대시보드': '대시보드',
      '성과 분석': '성과 분석',
      '비즈니스 브레인': '비즈니스 브레인',
      '작가 분석': '작가 분석',
      '물류': '물류 운영',
      '미입고': '미입고 관리',
      '물류 추적': '물류 추적',
      '물류 관제': '물류 관제센터',
      '물류비': '물류비 정산',
      'qc': 'QC 관리',
      '소포수령증': '소포수령증',
      '검색': '통합 검색',
    }

    for (const [keyword, pageName] of Object.entries(keywordMap)) {
      if (lowerQuery.includes(keyword) && (lowerQuery.includes('이동') || lowerQuery.includes('보여줘') || lowerQuery.includes('보기'))) {
        const route = this.pageRoutes.get(pageName)
        if (route) {
          // 키워드 기반은 보조 액션으로만 사용
          return {
            targetPage: pageName,
            path: route.path,
            params: {},
            confidence: 0.7,
            isPrimaryAction: false
          }
        }
      }
    }

    return null
  }

  /**
   * 액션 응답에 페이지 이동 추가 (보조 도구로만 사용)
   */
  enhanceResponseWithNavigation(
    response: any,
    navigationIntent: NavigationIntent
  ): any {
    // 응답이 비어있으면 페이지 이동만 제공하지 않음
    if (!response.response || response.response.trim().length === 0) {
      return response
    }

    return {
      ...response,
      actions: [
        ...(response.actions || []),
        {
          label: `🔗 ${navigationIntent.targetPage}에서 상세 확인`,
          action: 'navigate',
          data: {
            path: navigationIntent.path,
            params: navigationIntent.params
          }
        }
      ]
    }
  }

  /**
   * 카테고리별 관련 페이지 제안
   * 보조 도구로만 사용되며, 사용자가 필요할 때만 제안
   */
  getSuggestedPages(category: string): Array<{ label: string; path: string; params: any }> {
    const suggestions: Array<{ label: string; path: string; params: any }> = []

    switch (category) {
      case 'data_query':
        suggestions.push({
          label: '📊 성과 분석에서 상세 확인',
          path: '/analytics',
          params: { tab: 'overview' }
        })
        break

      case 'analysis_request':
        suggestions.push({
          label: '💡 Business Brain에서 인사이트 확인',
          path: '/business-brain',
          params: { tab: 'insights' }
        })
        break

      case 'strategy_suggestion':
        suggestions.push({
          label: '📈 Business Brain에서 전략 분석 확인',
          path: '/business-brain',
          params: { tab: 'strategy' }
        })
        break

      case 'insight_request':
        suggestions.push({
          label: '💡 Business Brain에서 상세 인사이트 확인',
          path: '/business-brain',
          params: { tab: 'insights' }
        })
        break

      case 'complex_query':
        // 복합 질문의 경우 여러 페이지 제안 가능
        suggestions.push({
          label: '📊 성과 분석에서 데이터 확인',
          path: '/analytics',
          params: { tab: 'overview' }
        })
        suggestions.push({
          label: '💡 Business Brain에서 인사이트 확인',
          path: '/business-brain',
          params: { tab: 'insights' }
        })
        break
    }

    return suggestions
  }
}

export const pageNavigationAgent = new PageNavigationAgent()

