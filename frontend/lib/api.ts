import axios, { AxiosError } from 'axios'

// 환경 변수 검증
const getApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  
  // 프로덕션 환경에서 API URL이 설정되지 않은 경우 경고
  if (typeof window !== 'undefined' && !apiUrl && process.env.NODE_ENV === 'production') {
    console.error('⚠️ NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다.')
  }
  
  return apiUrl || 'http://localhost:3001'
}

const API_URL = getApiUrl()

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30초 타임아웃
})

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    // 요청 전 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`)
    }
    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 에러 핸들링
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // 네트워크 오류 처리
    if (!error.response) {
      const networkError = new Error(
        error.code === 'ECONNABORTED'
          ? '요청 시간이 초과되었습니다. 서버가 응답하지 않습니다.'
          : '네트워크 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인하세요.'
      )
      networkError.name = 'NetworkError'
      return Promise.reject(networkError)
    }

    // HTTP 오류 처리
    const status = error.response.status
    let errorMessage = '알 수 없는 오류가 발생했습니다.'

    switch (status) {
      case 400:
        errorMessage = '잘못된 요청입니다.'
        break
      case 401:
        errorMessage = '인증이 필요합니다.'
        break
      case 403:
        errorMessage = '접근 권한이 없습니다.'
        break
      case 404:
        errorMessage = '요청한 리소스를 찾을 수 없습니다.'
        break
      case 500:
        errorMessage = '서버 내부 오류가 발생했습니다.'
        break
      case 502:
        errorMessage = '게이트웨이 오류가 발생했습니다.'
        break
      case 503:
        errorMessage = '서비스를 사용할 수 없습니다.'
        break
      default:
        errorMessage = `서버 오류가 발생했습니다. (${status})`
    }

    // 서버에서 제공한 에러 메시지가 있으면 사용
    const serverMessage = (error.response.data as any)?.message || (error.response.data as any)?.error
    if (serverMessage) {
      errorMessage = serverMessage
    }

    const apiError = new Error(errorMessage)
    apiError.name = `HTTP${status}Error`
    return Promise.reject(apiError)
  }
)

// 대시보드 API
export const dashboardApi = {
  getMain: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    const response = await api.get(`/api/dashboard/main?${params.toString()}`)
    return response.data
  },
  getTasks: async () => {
    const response = await api.get('/api/dashboard/tasks')
    return response.data
  },
}

// 미입고 관리 API
export const unreceivedApi = {
  getList: async () => {
    const response = await api.get('/api/unreceived')
    return response.data
  },
  updateStatus: async (orderCode: string, status: string) => {
    const response = await api.post('/api/unreceived/update-status', {
      orderCode,
      status,
    })
    return response.data
  },
}

// 물류 추적 API
export const logisticsApi = {
  getList: async () => {
    const response = await api.get('/api/logistics')
    return response.data
  },
}

// 물류 관제 센터 API
export const controlTowerApi = {
  getData: async () => {
    const response = await api.get('/api/control-tower')
    return response.data
  },
}

// 성과 분석 API
export const analyticsApi = {
  getData: async (dateRange: string = '30d', countryFilter: string = 'all') => {
    const response = await api.get('/api/analytics', {
      params: { dateRange, countryFilter },
    })
    return response.data
  },

  // 요약 (허브용)
  getSummary: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/analytics/summary', {
      params: { startDate, endDate },
    })
    return response.data
  },
}

// 통합 검색 API
export const lookupApi = {
  search: async (query: string, searchType: string) => {
    const response = await api.get('/api/lookup', {
      params: { query, searchType },
    })
    return response.data
  },
}

// 주문 상세 API
export const orderApi = {
  getDetail: async (orderCode: string) => {
    const response = await api.get(`/api/order/${orderCode}`)
    return response.data
  },
}

// 고객 상세 API
export const customerApi = {
  getDetail: async (userId: string) => {
    const response = await api.get(`/api/customer/${userId}`)
    return response.data
  },
}

// 작가 주문 내역 API
export const artistApi = {
  getOrders: async (artistName: string, dateRange: string = '30d') => {
    const response = await api.get(`/api/artist/${encodeURIComponent(artistName)}/orders`, {
      params: { dateRange },
    })
    return response.data
  },
}

// 고객 목록 내보내기 API
export const customersApi = {
  exportByStatus: async (status: string, countryFilter: string = 'all') => {
    const response = await api.get('/api/customers/export', {
      params: { status, countryFilter },
      responseType: 'blob', // CSV 파일 다운로드를 위해 blob 타입 사용
    })
    return response.data
  },
}

// 퍼포먼스 마케터 API
// 물류 처리 시간 분석 API
export const logisticsPerformanceApi = {
  getData: async (dateRange: string = '30d', countryFilter: string = 'all') => {
    const response = await api.get('/api/logistics-performance', {
      params: { dateRange, countryFilter },
    })
    return response.data
  },
}

// 시계열 분석 API
export const trendAnalysisApi = {
  getData: async (startDate: string, endDate: string, countryFilter: string = 'all') => {
    const response = await api.get('/api/trend-analysis', {
      params: { startDate, endDate, countryFilter },
    })
    return response.data
  },
}

// 비교 분석 API
export const comparisonApi = {
  comparePeriods: async (periods: number = 3, dateRange: string = '30d', countryFilter: string = 'all') => {
    const response = await api.get('/api/comparison', {
      params: { type: 'period', periods, dateRange, countryFilter },
    })
    return response.data
  },
  compareArtists: async (artists: string[], dateRange: string = '30d', countryFilter: string = 'all') => {
    const response = await api.get('/api/comparison', {
      params: { type: 'artist', artists: artists.join(','), dateRange, countryFilter },
    })
    return response.data
  },
  compareCountries: async (countries: string[], dateRange: string = '30d') => {
    const response = await api.get('/api/comparison', {
      params: { type: 'country', countries: countries.join(','), dateRange },
    })
    return response.data
  },
}

export const marketerApi = {
  checkHealth: async () => {
    const response = await api.get('/api/marketer/health')
    return response.data
  },
  searchDiscovery: async (params: { keyword?: string; category?: string; limit?: number }) => {
    const response = await api.get('/api/marketer/discovery/search', { params })
    return response.data
  },
  analyzeProduct: async (url: string) => {
    const response = await api.post('/api/marketer/discovery/analyze', { url })
    return response.data
  },
  generateContent: async (request: {
    discoveryId?: string
    productUrl?: string
    contentType: 'blog' | 'social' | 'email'
    platform: 'blog' | 'instagram' | 'facebook' | 'twitter' | 'email'
    language: 'korean' | 'english' | 'japanese'
    tone?: string
    includeSeo?: boolean
    targetAudience?: string[]
    additionalContext?: string
  }) => {
    const response = await api.post('/api/marketer/content/generate', request)
    return response.data
  },
  // 콘텐츠 저장 및 관리
  getSavedContents: async () => {
    const response = await api.get('/api/marketer/content')
    return response.data
  },
  saveContent: async (content: any) => {
    const response = await api.post('/api/marketer/content', content)
    return response.data
  },
  getContent: async (id: string) => {
    const response = await api.get(`/api/marketer/content/${id}`)
    return response.data
  },
  deleteContent: async (id: string) => {
    const response = await api.delete(`/api/marketer/content/${id}`)
    return response.data
  },
  // 캠페인 관리
  getCampaigns: async () => {
    const response = await api.get('/api/marketer/campaigns')
    return response.data
  },
  createCampaign: async (campaign: { name: string; contentIds: string[]; schedule?: any }) => {
    const response = await api.post('/api/marketer/campaigns', campaign)
    return response.data
  },
  getCampaign: async (id: string) => {
    const response = await api.get(`/api/marketer/campaigns/${id}`)
    return response.data
  },
  updateCampaign: async (id: string, updates: any) => {
    const response = await api.put(`/api/marketer/campaigns/${id}`, updates)
    return response.data
  },
  deleteCampaign: async (id: string) => {
    const response = await api.delete(`/api/marketer/campaigns/${id}`)
    return response.data
  },
  // 성과 추적
  getContentPerformance: async (contentId: string) => {
    const response = await api.get(`/api/marketer/performance/${contentId}`)
    return response.data
  },
  addPerformanceMetric: async (metric: {
    contentId: string
    views?: number
    engagement?: number
    conversions?: number
    platform?: string
    date?: string
  }) => {
    const response = await api.post('/api/marketer/performance', metric)
    return response.data
  },
  getPerformanceReport: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/api/marketer/performance/report/summary', { params })
    return response.data
  },
  // 이미지 분석 및 콘텐츠 생성
  analyzeImage: async (imageFile: File) => {
    const formData = new FormData()
    formData.append('image', imageFile)
    const response = await api.post('/api/marketer/materials/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
  generateContentFromImage: async (imageFiles: File[], options: {
    platforms?: string[]
    languages?: string[]
    tone?: string
    includeReasoning?: boolean
  }) => {
    const formData = new FormData()
    imageFiles.forEach((file) => {
      formData.append('images', file)
    })
    formData.append('platforms', JSON.stringify(options.platforms || ['meta', 'x']))
    formData.append('languages', JSON.stringify(options.languages || ['korean', 'english', 'japanese']))
    formData.append('tone', options.tone || '따뜻하고 감성적인')
    formData.append('includeReasoning', String(options.includeReasoning || false))
    
    const response = await api.post('/api/marketer/materials/generate-from-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
  // 트렌딩 키워드 분석
  analyzeTrendKeyword: async (keyword: string) => {
    const response = await api.post('/api/marketer/trend/analyze', { keyword })
    return response.data
  },
  analyzeTrendKeywordMultiLanguage: async (keyword: string) => {
    const response = await api.post('/api/marketer/trend/analyze-multi', { keyword })
    return response.data
  },
}

// 챗봇 API
export const chatApi = {
  sendMessage: async (
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    agentType: 'data_analyst' | 'performance_marketer' | 'business_manager' | 'auto' = 'auto',
    sessionId?: string
  ) => {
    const response = await api.post('/api/chat/message', {
      message,
      history,
      agentType,
      sessionId,
    })
    return response.data
  },
  // 스트리밍 메시지 전송
  sendMessageStream: async (
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    agentType: 'data_analyst' | 'performance_marketer' | 'business_manager' | 'auto' = 'auto',
    sessionId?: string,
    onChunk?: (chunk: string) => void,
    onMetadata?: (metadata: any) => void,
    onError?: (error: string) => void,
    onDone?: () => void
  ) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    
    try {
      const response = await fetch(`${apiUrl}/api/chat/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history,
          agentType,
          sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          
          try {
            const data = JSON.parse(line.slice(6))
            
            switch (data.type) {
              case 'chunk':
                onChunk?.(data.content)
                break
              case 'metadata':
                onMetadata?.(data)
                break
              case 'error':
                onError?.(data.error)
                break
              case 'done':
                onDone?.()
                break
            }
          } catch (e) {
            // JSON 파싱 실패 무시
          }
        }
      }
    } catch (error: any) {
      onError?.(error.message || '스트리밍 연결 오류')
    }
  },
  checkHealth: async () => {
    const response = await api.get('/api/chat/health')
    return response.data
  },
  getAgents: async () => {
    const response = await api.get('/api/chat/agents')
    return response.data
  },
  // 캐시 통계 조회
  getCacheStats: async () => {
    const response = await api.get('/api/chat/cache/stats')
    return response.data
  },
  // 캐시 클리어
  clearCache: async () => {
    const response = await api.post('/api/chat/cache/clear')
    return response.data
  },
  // 복합 질문 오케스트레이션 (다중 Agent 협업)
  orchestrate: async (
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    sessionId?: string
  ) => {
    const response = await api.post('/api/chat/orchestrate', {
      message,
      history,
      sessionId,
    })
    return response.data
  },
  // 심층 분석 (상관관계, 트렌드, 비교)
  deepAnalysis: async (
    message: string,
    analysisType: 'correlation' | 'trend' | 'comparison' = 'correlation',
    sessionId?: string
  ) => {
    const response = await api.post('/api/chat/deep-analysis', {
      message,
      analysisType,
      sessionId,
    })
    return response.data
  },
  // 메트릭 조회
  getMetrics: async (periodMinutes?: number) => {
    const params = periodMinutes ? { period: periodMinutes } : {}
    const response = await api.get('/api/chat/metrics', { params })
    return response.data
  },
  // 메트릭 내보내기
  exportMetrics: async () => {
    const response = await api.get('/api/chat/metrics/export', {
      responseType: 'blob',
    })
    return response.data
  },
  // Rate Limiter 상태 조회
  getRateLimitStatus: async () => {
    const response = await api.get('/api/chat/rate-limit/status')
    return response.data
  },
  // 응답 캐시 클리어
  clearResponseCache: async () => {
    const response = await api.post('/api/chat/response-cache/clear')
    return response.data
  },
}

// 물류비 정산 API
export const settlementApi = {
  // 정산서 업로드
  upload: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/api/settlement/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // 정산 목록 조회
  getList: async (params?: {
    period?: string
    carrier?: string
    country?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/api/settlement/list', { params })
    return response.data
  },

  // 국가별 분석
  getCountryAnalysis: async (period?: string) => {
    const response = await api.get('/api/settlement/analysis/country', {
      params: { period },
    })
    return response.data
  },

  // 운송사별 분석
  getCarrierAnalysis: async (period?: string) => {
    const response = await api.get('/api/settlement/analysis/carrier', {
      params: { period },
    })
    return response.data
  },

  // 중량 최적화 분석
  getWeightAnalysis: async (period?: string) => {
    const response = await api.get('/api/settlement/analysis/weight', {
      params: { period },
    })
    return response.data
  },

  // 트렌드 분석 (월별)
  getTrendAnalysis: async () => {
    const response = await api.get('/api/settlement/analysis/trend')
    return response.data
  },

  // 업로드된 기간 목록
  getPeriods: async () => {
    const response = await api.get('/api/settlement/periods')
    return response.data
  },

  // shipment_id로 정산 데이터 조회
  getByShipmentId: async (shipmentId: string) => {
    const response = await api.get(`/api/settlement/shipment/${shipmentId}`)
    return response.data
  },

  // 정산 데이터 검증
  validate: async (period?: string) => {
    const response = await api.post('/api/settlement/validate', { period })
    return response.data
  },

  // 예상 요금 조회
  getExpectedRate: async (carrier: string, country: string, weight: number) => {
    const response = await api.get('/api/settlement/rates/expected', {
      params: { carrier, country, weight },
    })
    return response.data
  },

  // 지원 국가 목록
  getSupportedCountries: async () => {
    const response = await api.get('/api/settlement/rates/countries')
    return response.data
  },

  // 교차 검증 (다중 운송사 비용 비교)
  crossValidate: async (period?: string, limit?: number) => {
    const response = await api.post('/api/settlement/cross-validate', { period, limit })
    return response.data
  },

  // 고도화된 트렌드 분석
  getTrendAdvanced: async () => {
    const response = await api.get('/api/settlement/analysis/trend-advanced')
    return response.data
  },

  // 물류비 시뮬레이션
  simulate: async (country: string, weight: number, isDocument?: boolean) => {
    const response = await api.get('/api/settlement/simulate', {
      params: { country, weight, isDocument },
    })
    return response.data
  },
}

// QC API
export const qcApi = {
  // CSV 업로드
  uploadText: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/api/qc/upload/text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/api/qc/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
  // 텍스트 QC 목록
  getTextList: async (params?: {
    status?: string
    page?: number
    limit?: number
    weeklyOnly?: boolean
  }) => {
    const response = await api.get('/api/qc/text/list', { params })
    return response.data
  },
  // 이미지 QC 목록
  getImageList: async (params?: {
    status?: string
    page?: number
    limit?: number
    weeklyOnly?: boolean
  }) => {
    const response = await api.get('/api/qc/image/list', { params })
    return response.data
  },
  // QC 상태 업데이트
  updateStatus: async (type: 'text' | 'image', id: string, status: string, needsRevision: boolean) => {
    const response = await api.put(`/api/qc/${type}/${id}/status`, {
      status,
      needsRevision,
    })
    return response.data
  },
  // QC 완료 처리
  complete: async (type: 'text' | 'image', id: string) => {
    const response = await api.post(`/api/qc/${type}/${id}/complete`)
    return response.data
  },
  // 작가 알람 명단
  getArtistNotifications: async () => {
    const response = await api.get('/api/qc/artists/notifications')
    return response.data
  },
  // 중복 검사
  checkDuplicates: async (type: string, ids: string[]) => {
    const response = await api.get('/api/qc/check-duplicates', {
      params: { type, ids: ids.join(',') },
    })
    return response.data
  },
  // QC 아카이브 조회
  getArchive: async (params?: {
    type?: 'all' | 'text' | 'image'
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
  }) => {
    const response = await api.get('/api/qc/archive', { params })
    return response.data
  },
  // Google Sheets 동기화
  sync: async () => {
    const response = await api.post('/api/qc/sync')
    return response.data
  },
  // 작가 알람 발송
  notifyArtist: async (artistId: string, items: string[]) => {
    const response = await api.post('/api/qc/artists/notify', {
      artistId,
      items,
    })
    return response.data
  },
}

// 비용 분석 & 손익 시뮬레이션 API
export const costAnalysisApi = {
  // 대시보드 데이터 조회
  getDashboard: async (params?: { startDate?: string; endDate?: string; country?: string }) => {
    const response = await api.get('/api/cost-analysis/dashboard', { params })
    return response.data
  },

  // 단일 주문 시뮬레이션
  simulate: async (input: {
    country: string
    productPriceKRW: number
    weightKg: number
    dimensions?: {
      lengthCm: number
      widthCm: number
      heightCm: number
    }
    itemCount?: number
    carrier?: string
  }) => {
    const response = await api.post('/api/cost-analysis/simulate', input)
    return response.data
  },

  // 운송사별 요금 조회
  getRates: async (params: { country: string; weight: number; height?: number }) => {
    const response = await api.get('/api/cost-analysis/rates', { params })
    return response.data
  },

  // 국가 목록 조회
  getCountries: async () => {
    const response = await api.get('/api/cost-analysis/countries')
    return response.data
  },

  // 배송 정책 조회
  getPolicies: async () => {
    const response = await api.get('/api/cost-analysis/policies')
    return response.data
  },

  // 운송사 목록 조회
  getCarriers: async () => {
    const response = await api.get('/api/cost-analysis/carriers')
    return response.data
  },

  // 환율 조회
  getExchangeRates: async () => {
    const response = await api.get('/api/cost-analysis/exchange-rates')
    return response.data
  },

  // 국가별 상세 분석
  getCountryDetail: async (countryCode: string, params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get(`/api/cost-analysis/country/${countryCode}`, { params })
    return response.data
  },

  // 정책 시뮬레이션
  simulatePolicy: async (input: {
    tier: number
    newFreeShippingThreshold?: number
    newCustomerShippingFee?: number
    newFreeShippingItemCount?: number | null
  }) => {
    const response = await api.post('/api/cost-analysis/policy-simulation', input)
    return response.data
  },

  // 매출 요약 조회
  getSalesSummary: async (params?: { 
    startDate?: string
    endDate?: string
    country?: string
    tier?: number
  }) => {
    const response = await api.get('/api/cost-analysis/sales-summary', { params })
    return response.data
  },
}

// 소포수령증 관리 API
export const sopoReceiptApi = {
  // 롯데 선적 CSV 업로드 & 검증
  upload: async (file: File, period: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('period', period)
    const response = await api.post('/api/sopo-receipt/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // 대상 작가 목록 조회
  getArtists: async (period?: string) => {
    const response = await api.get('/api/sopo-receipt/artists', { params: { period } })
    return response.data
  },

  // 주문내역서 데이터 조회
  getOrderSheet: async (artistName: string, period?: string) => {
    const response = await api.get(`/api/sopo-receipt/order-sheet/${encodeURIComponent(artistName)}`, {
      params: { period },
    })
    return response.data
  },

  // 안내 이메일 발송
  notify: async (params: { period: string; artistNames?: string[]; jotformLink?: string }) => {
    const response = await api.post('/api/sopo-receipt/notify', params)
    return response.data
  },

  // JotForm 데이터 동기화
  syncJotform: async () => {
    const response = await api.post('/api/sopo-receipt/sync-jotform')
    return response.data
  },

  // 신청 현황 트래킹 조회
  getTracking: async (params?: { period?: string; status?: string }) => {
    const response = await api.get('/api/sopo-receipt/tracking', { params })
    return response.data
  },

  // 리마인더 발송
  sendReminder: async (params: { period: string; artistNames: string[] }) => {
    const response = await api.post('/api/sopo-receipt/reminder', params)
    return response.data
  },

  // 기간 목록 조회
  getPeriods: async () => {
    const response = await api.get('/api/sopo-receipt/periods')
    return response.data
  },
}

// 리뷰 갤러리 API
export const reviewsApi = {
  // 갤러리 조회
  getGallery: async (params?: {
    country?: string
    hasImage?: boolean
    minRating?: number
    page?: number
    pageSize?: number
    sort?: string
    search?: string
  }) => {
    const response = await api.get('/api/reviews/gallery', { params })
    return response.data
  },

  // 하이라이트 리뷰 (쇼케이스용)
  getHighlights: async (limit?: number) => {
    const response = await api.get('/api/reviews/highlights', { params: { limit } })
    return response.data
  },

  // 통계 조회
  getStats: async () => {
    const response = await api.get('/api/reviews/stats')
    return response.data
  },

  // 캐시 새로고침
  refresh: async () => {
    const response = await api.post('/api/reviews/refresh')
    return response.data
  },
}

// 글로벌 마케팅 캘린더 API
export const calendarApi = {
  // 기념일 목록 조회
  getHolidays: async (params?: {
    year?: number
    month?: number
    countries?: string
    tier?: number
    category?: string
    importance?: string
  }) => {
    const response = await api.get('/api/calendar/holidays', { params })
    return response.data
  },

  // 특정 기념일 상세 조회
  getHolidayById: async (id: string) => {
    const response = await api.get(`/api/calendar/holidays/${id}`)
    return response.data
  },

  // 다가오는 기념일 조회
  getUpcoming: async (days?: number, countries?: string) => {
    const response = await api.get('/api/calendar/upcoming', {
      params: { days, countries },
    })
    return response.data
  },

  // 국가 목록 조회
  getCountries: async (tier?: number) => {
    const response = await api.get('/api/calendar/countries', {
      params: { tier },
    })
    return response.data
  },

  // 카테고리 추천 생성
  recommendCategories: async (holidayId: string, country: string) => {
    const response = await api.post('/api/calendar/recommend-categories', {
      holidayId,
      country,
    })
    return response.data
  },

  // AI 마케팅 전략 생성
  generateStrategy: async (params: {
    holidayId: string
    country: string
    budget?: 'low' | 'medium' | 'high'
    channels?: string[]
  }) => {
    const response = await api.post('/api/calendar/generate-strategy', params)
    return response.data
  },
}

// 고객 분석 API
export const customerAnalyticsApi = {
  // 요약 (허브용)
  getSummary: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/customer-analytics/summary', {
      params: { startDate, endDate },
    })
    return response.data
  },

  // RFM 세그먼테이션 (전체 유저 ID 포함)
  getRFM: async () => {
    const response = await api.get('/api/customer-analytics/rfm')
    return response.data
  },

  // 이탈 위험 분석 (전체 유저 ID 포함)
  getChurnRisk: async () => {
    const response = await api.get('/api/customer-analytics/churn-risk')
    return response.data
  },

  // 특정 세그먼트의 전체 유저 ID 조회 (쿠폰 발급용 경량 API)
  getSegmentUsers: async (segmentName: string, type: 'rfm' | 'churn' = 'rfm') => {
    const response = await api.get(`/api/customer-analytics/segment/${encodeURIComponent(segmentName)}/users`, {
      params: { type },
    })
    return response.data
  },

  // 코호트 분석
  getCohort: async () => {
    const response = await api.get('/api/customer-analytics/cohort')
    return response.data
  },

  // LTV 분석
  getLTV: async () => {
    const response = await api.get('/api/customer-analytics/ltv')
    return response.data
  },

  // 구매 전환 분석
  getConversion: async () => {
    const response = await api.get('/api/customer-analytics/conversion')
    return response.data
  },

  // 쿠폰 시뮬레이션
  simulateCoupon: async (params: {
    targetSegments: string[]
    discountType: 'fixed' | 'percentage'
    discountValue: number
    minOrderAmount: number
    targetCountries: string[]
  }) => {
    const response = await api.post('/api/customer-analytics/coupon-simulate', params)
    return response.data
  },
}

// 작가 분석 API
export const artistAnalyticsApi = {
  // 개요
  getOverview: async (params?: { dateRange?: string; countryFilter?: string }) => {
    const response = await api.get('/api/artist-analytics/overview', { params })
    return response.data
  },

  // 작가 성과 리스트
  getPerformance: async (params?: {
    dateRange?: string
    country?: string
    segment?: string
    sort?: string
    order?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/api/artist-analytics/performance', { params })
    return response.data
  },

  // 작품 분석
  getProducts: async (params?: { dateRange?: string; sort?: string; limit?: number }) => {
    const response = await api.get('/api/artist-analytics/products', { params })
    return response.data
  },

  // 성장 추이
  getTrend: async (params?: { months?: number }) => {
    const response = await api.get('/api/artist-analytics/trend', { params })
    return response.data
  },

  // 건강도
  getHealth: async () => {
    const response = await api.get('/api/artist-analytics/health')
    return response.data
  },

  // 작가 상세
  getDetail: async (artistName: string, params?: { dateRange?: string }) => {
    const response = await api.get(`/api/artist-analytics/detail/${encodeURIComponent(artistName)}`, { params })
    return response.data
  },

  // 셀렉션 관리
  getSelection: async (params?: { months?: number }) => {
    const response = await api.get('/api/artist-analytics/selection', { params })
    return response.data
  },
}

// Business Brain API
export const businessBrainApi = {
  // 경영 브리핑
  getBriefing: async (period: '7d' | '30d' | '90d' | '180d' | '365d' = '30d') => {
    const response = await api.get('/api/business-brain/briefing', { params: { period } })
    return response.data
  },

  // 건강도 점수
  getHealthScore: async (period: '7d' | '30d' | '90d' | '180d' | '365d' = '30d') => {
    const response = await api.get('/api/business-brain/health-score', { params: { period } })
    return response.data
  },

  // 인사이트 목록
  getInsights: async (params?: { type?: string; limit?: number }) => {
    const response = await api.get('/api/business-brain/insights', { params })
    return response.data
  },

  // 매출 분해 분석
  getDecomposition: async (startDate: string, endDate: string, compareWith?: string) => {
    const response = await api.get('/api/business-brain/decomposition', {
      params: { startDate, endDate, compareWith },
    })
    return response.data
  },

  // 큐브 분석
  getCubeAnalysis: async (params?: {
    dimensions?: string[]
    metrics?: string[]
    startDate?: string
    endDate?: string
  }) => {
    const response = await api.get('/api/business-brain/cube', {
      params: {
        dimensions: params?.dimensions?.join(','),
        metrics: params?.metrics?.join(','),
        startDate: params?.startDate,
        endDate: params?.endDate,
      },
    })
    return response.data
  },

  // AI 채팅
  chat: async (query: string, context?: any) => {
    const response = await api.post('/api/business-brain/chat', { query, context })
    return response.data
  },

  // 휴먼 에러 체크
  getHumanErrorChecks: async () => {
    const response = await api.get('/api/business-brain/human-error-checks')
    return response.data
  },

  // 장기 트렌드 분석
  getTrends: async (period: '7d' | '30d' | '90d' | '180d' | '365d' = '90d') => {
    const response = await api.get('/api/business-brain/trends', { params: { period } })
    return response.data
  },

  // 전략 제안
  getRecommendations: async () => {
    const response = await api.get('/api/business-brain/recommendations')
    return response.data
  },

  // 전략 분석 (v4.2 Phase 3)
  getStrategyAnalysis: async (period: '7d' | '30d' | '90d' | '180d' | '365d' = '90d') => {
    const response = await api.get('/api/business-brain/strategy-analysis', {
      params: { period },
    })
    return response.data
  },

  // 액션 제안 (v4.2 Phase 3)
  getActionProposals: async (period: '7d' | '30d' | '90d' | '180d' | '365d' = '90d') => {
    const response = await api.get('/api/business-brain/action-proposals', {
      params: { period },
    })
    return response.data
  },

  // 캐시 통계 (개발용)
  getCacheStats: async () => {
    const response = await api.get('/api/business-brain/cache/stats')
    return response.data
  },

  // 캐시 클리어 (개발용)
  clearCache: async (pattern?: string) => {
    const response = await api.delete('/api/business-brain/cache', {
      params: pattern ? { pattern } : {},
    })
    return response.data
  },

  // ==================== 새로운 고급 분석 API ====================

  // 코호트 분석
  getCohortAnalysis: async () => {
    const response = await api.get('/api/business-brain/cohort')
    return response.data
  },

  // RFM 세분화 분석
  getRFMAnalysis: async () => {
    const response = await api.get('/api/business-brain/rfm')
    return response.data
  },

  // 파레토 분석
  getParetoAnalysis: async () => {
    const response = await api.get('/api/business-brain/pareto')
    return response.data
  },

  // 상관관계 분석
  getCorrelationAnalysis: async () => {
    const response = await api.get('/api/business-brain/correlation')
    return response.data
  },

  // 이상 탐지
  getAnomalyDetection: async (sensitivity?: 'low' | 'medium' | 'high') => {
    const response = await api.get('/api/business-brain/anomaly', {
      params: sensitivity ? { sensitivity } : {},
    })
    return response.data
  },

  // 시계열 분석
  getTimeSeriesAnalysis: async () => {
    const response = await api.get('/api/business-brain/timeseries')
    return response.data
  },

  // 종합 고급 분석
  getAdvancedAnalytics: async () => {
    const response = await api.get('/api/business-brain/advanced')
    return response.data
  },

  // ==================== 기간별 분석 API (v2.1) ====================

  // 기간별 분석 (유형별)
  getAnalysisByPeriod: async (
    type: 'rfm' | 'pareto' | 'cohort' | 'anomaly' | 'timeseries',
    period: '7d' | '30d' | '90d' | '180d' | '365d' | 'custom' = '30d',
    customRange?: { startDate: string; endDate: string }
  ) => {
    const params: any = { period }
    if (customRange) {
      params.startDate = customRange.startDate
      params.endDate = customRange.endDate
    }
    const response = await api.get(`/api/business-brain/analysis/${type}`, { params })
    return response.data
  },

  // 매출 예측
  getForecast: async (
    period: '7d' | '30d' | '90d' | '180d' | '365d' = '90d',
    forecastDays: number = 30
  ) => {
    const response = await api.get('/api/business-brain/forecast', {
      params: { period, forecastDays },
    })
    return response.data
  },

  // 기간 비교 분석
  getPeriodComparison: async (
    period1: { start: string; end: string; label?: string },
    period2: { start: string; end: string; label?: string }
  ) => {
    const response = await api.get('/api/business-brain/compare', {
      params: {
        period1Start: period1.start,
        period1End: period1.end,
        period2Start: period2.start,
        period2End: period2.end,
        period1Label: period1.label,
        period2Label: period2.label,
      },
    })
    return response.data
  },

  // 다중 기간 트렌드 분석
  getMultiPeriodAnalysis: async (
    periodType: 'weekly' | 'monthly' | 'quarterly' = 'monthly',
    numPeriods: number = 6
  ) => {
    const response = await api.get('/api/business-brain/multi-period', {
      params: { periodType, numPeriods },
    })
    return response.data
  },

  // 종합 인사이트 분석
  getComprehensiveAnalysis: async (
    period: '7d' | '30d' | '90d' | '180d' | '365d' = '30d'
  ) => {
    const response = await api.get('/api/business-brain/comprehensive', {
      params: { period },
    })
    return response.data
  },

  // ==================== v4.0: 데이터 내보내기 API ====================

  // 지원하는 내보내기 유형 목록
  getExportTypes: async () => {
    const response = await api.get('/api/business-brain/export/types')
    return response.data
  },

  // 데이터 내보내기 URL 생성
  getExportUrl: (
    type: string,
    period: '7d' | '30d' | '90d' | '180d' | '365d' = '30d',
    segment?: string
  ) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const params = new URLSearchParams({ period })
    if (segment) params.append('segment', segment)
    return `${baseUrl}/api/business-brain/export/${type}?${params.toString()}`
  },

  // 데이터 내보내기 (직접 다운로드)
  exportData: async (
    type: string,
    period: '7d' | '30d' | '90d' | '180d' | '365d' = '30d',
    segment?: string
  ) => {
    const url = businessBrainApi.getExportUrl(type, period, segment)
    // 브라우저에서 직접 다운로드
    const link = document.createElement('a')
    link.href = url
    link.download = ''
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  // ==================== v4.3: What-if 시뮬레이션 API ====================

  // What-if 시뮬레이션 실행
  simulateWhatIf: async (
    scenario: {
      id: string
      name: string
      description: string
      variables: Array<{
        metric: string
        currentValue: number
        changeType: 'absolute' | 'percentage' | 'multiplier'
        changeValue: number
        description: string
      }>
      assumptions: string[]
      timeline: string
    },
    period: '7d' | '30d' | '90d' | '180d' | '365d' = '90d'
  ) => {
    const response = await api.post('/api/business-brain/what-if/simulate', {
      scenario,
      period,
    })
    return response.data
  },

  // 여러 시나리오 비교
  compareWhatIfScenarios: async (
    scenarios: Array<{
      id: string
      name: string
      description: string
      variables: Array<{
        metric: string
        currentValue: number
        changeType: 'absolute' | 'percentage' | 'multiplier'
        changeValue: number
        description: string
      }>
      assumptions: string[]
      timeline: string
    }>,
    period: '7d' | '30d' | '90d' | '180d' | '365d' = '90d'
  ) => {
    const response = await api.post('/api/business-brain/what-if/compare', {
      scenarios,
      period,
    })
    return response.data
  },

  // 시나리오 템플릿 조회
  getWhatIfTemplates: async () => {
    const response = await api.get('/api/business-brain/what-if/templates')
    return response.data
  },

  // ==================== v4.3: 리포트 생성 API ====================

  // 리포트 생성
  generateReport: async (options: {
    period: '7d' | '30d' | '90d' | '180d' | '365d'
    sections: Array<'overview' | 'health-score' | 'insights' | 'trends' | 'rfm' | 'churn' | 'artist-health' | 'recommendations'>
    includeCharts?: boolean
    format?: 'pdf' | 'html'
  }) => {
    const response = await api.post('/api/business-brain/report/generate', options)
    return response.data
  },

  // ==================== v4.0: 고객 이탈 예측 API ====================

  // 이탈 예측 목록
  getChurnPrediction: async (
    period: '30d' | '90d' | '180d' | '365d' = '90d',
    options?: { minOrders?: number; riskLevel?: string[] }
  ) => {
    const params: any = { period }
    if (options?.minOrders) params.minOrders = options.minOrders
    if (options?.riskLevel) params.riskLevel = options.riskLevel.join(',')
    const response = await api.get('/api/business-brain/churn-prediction', { params })
    return response.data
  },

  // 특정 고객 이탈 예측 상세
  getCustomerChurnPrediction: async (customerId: string) => {
    const response = await api.get(`/api/business-brain/churn-prediction/${customerId}`)
    return response.data
  },

  // ==================== v4.0: 작가 건강도 API ====================

  // 작가 건강도 목록
  getArtistHealth: async (
    period: '30d' | '90d' | '180d' | '365d' = '90d',
    tier?: string[]
  ) => {
    const params: any = { period }
    if (tier) params.tier = tier.join(',')
    const response = await api.get('/api/business-brain/artist-health', { params })
    return response.data
  },

  // 특정 작가 건강도 상세
  getArtistHealthDetail: async (artistId: string) => {
    const response = await api.get(`/api/business-brain/artist-health/${artistId}`)
    return response.data
  },

  // v4.1: 신규 유저 유치 분석
  getNewUserAcquisition: async (
    period: '30d' | '90d' | '180d' | '365d' = '90d'
  ) => {
    const response = await api.get(`/api/business-brain/new-user-acquisition`, {
      params: { period }
    })
    return response.data
  },

  // v4.1: 재구매율 향상 분석
  getRepurchaseAnalysis: async (
    period: '30d' | '90d' | '180d' | '365d' = '90d'
  ) => {
    const response = await api.get(`/api/business-brain/repurchase-analysis`, {
      params: { period }
    })
    return response.data
  },

  // ==================== Phase 4: 쿠폰/리뷰 인사이트 API ====================

  // 쿠폰 인사이트
  getCouponInsights: async (
    period: '7d' | '30d' | '90d' | '180d' | '365d' = '30d'
  ) => {
    const response = await api.get('/api/business-brain/coupon-insights', {
      params: { period },
    })
    return response.data
  },

  // 리뷰 인사이트
  getReviewInsights: async (
    period: '7d' | '30d' | '90d' | '180d' | '365d' = '30d'
  ) => {
    const response = await api.get('/api/business-brain/review-insights', {
      params: { period },
    })
    return response.data
  },
}

// ==================== 관리자 API ====================
export const adminApi = {
  /**
   * 수동 집계 트리거
   * @param date - 집계 대상 날짜 (YYYY-MM-DD)
   * @param types - 집계 유형 배열 (미지정 시 전체)
   */
  triggerAggregation: async (
    date: string,
    types?: ('metrics' | 'review' | 'coupon')[]
  ) => {
    const response = await api.post('/api/admin/trigger-aggregation', {
      date,
      types: types || ['metrics', 'review', 'coupon'],
    })
    return response.data
  },

  /**
   * 집계 상태 조회
   * @param date - 조회 대상 날짜 (YYYY-MM-DD)
   */
  getAggregationStatus: async (date: string) => {
    const response = await api.get('/api/admin/aggregation-status', {
      params: { date },
    })
    return response.data
  },

  /**
   * 배치 Job 로그 조회
   * @param limit - 조회 개수
   */
  getBatchLogs: async (limit: number = 10) => {
    const response = await api.get('/api/admin/batch-logs', {
      params: { limit },
    })
    return response.data
  },
}

// ==================== Phase 5: 예측 API ====================
export const predictionsApi = {
  /**
   * 고객 이탈 예측 목록 조회
   */
  getChurnPredictions: async (params?: { limit?: number; riskLevel?: string }) => {
    const response = await api.get('/api/predictions/churn', { params })
    return response.data
  },

  /**
   * GMV 예측 조회
   * @param horizon - 예측 기간 (일 단위, 기본 30일)
   */
  getGmvForecast: async (horizon: number = 30) => {
    const response = await api.get('/api/predictions/gmv', {
      params: { horizon },
    })
    return response.data
  },

  /**
   * 특정 고객 LTV 예측
   */
  getCustomerLtv: async (customerId: string) => {
    const response = await api.get(`/api/predictions/ltv/${customerId}`)
    return response.data
  },

  /**
   * 고객별 추천 목록 조회
   */
  getRecommendations: async (customerId: string, type?: 'product' | 'coupon' | 'action' | 'all') => {
    const response = await api.get(`/api/predictions/recommendations/${customerId}`, {
      params: { type: type || 'all' },
    })
    return response.data
  },

  /**
   * 자동화 규칙 목록 조회
   */
  getAutomationRules: async () => {
    const response = await api.get('/api/predictions/automation/rules')
    return response.data
  },

  /**
   * 자동화 규칙 생성
   */
  createAutomationRule: async (rule: {
    ruleName: string
    ruleType: string
    triggerConditions: Record<string, any>
    actionType: string
    actionParams: Record<string, any>
    targetSegment?: string
  }) => {
    const response = await api.post('/api/predictions/automation/rules', rule)
    return response.data
  },

  /**
   * 사용 가능한 예측 모델 목록
   */
  getModels: async () => {
    const response = await api.get('/api/predictions/models')
    return response.data
  },

  /**
   * 예측 시스템 상태 확인
   */
  getHealth: async () => {
    const response = await api.get('/api/predictions/health')
    return response.data
  },
}

// ==================== 집계 데이터 API ====================
export const metricsApi = {
  /**
   * 일별 집계 데이터 조회
   * @param date - 조회 날짜 (YYYY-MM-DD)
   */
  getDaily: async (date: string) => {
    const response = await api.get('/api/metrics/daily', {
      params: { date },
    })
    return response.data
  },

  /**
   * 기간 요약 조회
   * @param startDate - 시작일
   * @param endDate - 종료일
   */
  getSummary: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/metrics/summary', {
      params: { startDate, endDate },
    })
    return response.data
  },

  /**
   * 트렌드 데이터 조회
   * @param startDate - 시작일
   * @param endDate - 종료일
   * @param metric - 지표명
   */
  getTrend: async (startDate: string, endDate: string, metric: string) => {
    const response = await api.get('/api/metrics/trend', {
      params: { startDate, endDate, metric },
    })
    return response.data
  },
}

// ==================== 쿠폰 분석 API ====================
export const couponAnalyticsApi = {
  /**
   * 쿠폰 분석 요약
   */
  getSummary: async (startDate: string, endDate: string, compareWithPrevious: boolean = false) => {
    const response = await api.get('/api/coupon-analytics/summary', {
      params: { startDate, endDate, compareWithPrevious },
    })
    return response.data
  },

  /**
   * 쿠폰 트렌드
   */
  getTrend: async (startDate: string, endDate: string, aggregation: string = 'monthly') => {
    const response = await api.get('/api/coupon-analytics/trend', {
      params: { startDate, endDate, aggregation },
    })
    return response.data
  },

  /**
   * 유형별 분석
   */
  getByType: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/coupon-analytics/by-type', {
      params: { startDate, endDate },
    })
    return response.data
  },

  /**
   * 국가별 분석
   */
  getByCountry: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/coupon-analytics/by-country', {
      params: { startDate, endDate },
    })
    return response.data
  },

  /**
   * 쿠폰 유형별 분석 (Coupon_type: idus, CRM, Sodam 등)
   */
  getByCouponType: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/coupon-analytics/by-coupon-type', {
      params: { startDate, endDate },
    })
    return response.data
  },

  /**
   * TOP 성과 쿠폰
   */
  getTopPerformers: async (startDate: string, endDate: string, limit: number = 10) => {
    const response = await api.get('/api/coupon-analytics/top-performers', {
      params: { startDate, endDate, limit },
    })
    return response.data
  },

  /**
   * 실패 쿠폰 분석
   */
  getFailures: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/coupon-analytics/failures', {
      params: { startDate, endDate },
    })
    return response.data
  },

  /**
   * 자동 인사이트
   */
  getInsights: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/coupon-analytics/insights', {
      params: { startDate, endDate },
    })
    return response.data
  },
}

// ==================== 리뷰 분석 API ====================
export const reviewAnalyticsApi = {
  /**
   * NPS 분석
   */
  getNPS: async (startDate: string, endDate: string, compareWithPrevious: boolean = false) => {
    const response = await api.get('/api/review-analytics/nps', {
      params: { startDate, endDate, compareWithPrevious },
    })
    return response.data
  },

  /**
   * 리뷰 트렌드
   */
  getTrend: async (startDate: string, endDate: string, aggregation: string = 'monthly') => {
    const response = await api.get('/api/review-analytics/trend', {
      params: { startDate, endDate, aggregation },
    })
    return response.data
  },

  /**
   * 작가별 분석
   */
  getByArtist: async (startDate: string, endDate: string, limit: number = 20, sortBy: string = 'count') => {
    const response = await api.get('/api/review-analytics/by-artist', {
      params: { startDate, endDate, limit, sortBy },
    })
    return response.data
  },

  /**
   * 상품별 분석
   */
  getByProduct: async (startDate: string, endDate: string, limit: number = 20) => {
    const response = await api.get('/api/review-analytics/by-product', {
      params: { startDate, endDate, limit },
    })
    return response.data
  },

  /**
   * 국가별 분석
   */
  getByCountry: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/review-analytics/by-country', {
      params: { startDate, endDate },
    })
    return response.data
  },

  /**
   * 평점 분포
   */
  getRatingDistribution: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/review-analytics/rating-distribution', {
      params: { startDate, endDate },
    })
    return response.data
  },

  /**
   * 자동 인사이트
   */
  getInsights: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/review-analytics/insights', {
      params: { startDate, endDate },
    })
    return response.data
  },

  /**
   * 리뷰 내용 및 이미지 분석
   */
  getContentAnalysis: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/review-analytics/content-analysis', {
      params: { startDate, endDate },
    })
    return response.data
  },
}

// ==================== 주문 패턴 분석 API (개선 버전) ====================
export const orderPatternsApi = {
  /**
   * 패턴 요약 (전기간 대비 변화율 포함)
   */
  getSummary: async (startDate: string, endDate: string, includeComparison: boolean = true) => {
    const response = await api.get('/api/order-patterns/summary', {
      params: { startDate, endDate, includeComparison: includeComparison.toString() },
    })
    return response.data
  },

  /**
   * 요일별 패턴
   */
  getByDay: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/order-patterns/by-day', {
      params: { startDate, endDate },
    })
    return response.data
  },

  /**
   * 시간대별 패턴 (Raw Data에 시간 정보 없어 제한적)
   */
  getByHour: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/order-patterns/by-hour', {
      params: { startDate, endDate },
    })
    return response.data
  },

  /**
   * 국가별 패턴
   */
  getByCountry: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/order-patterns/by-country', {
      params: { startDate, endDate },
    })
    return response.data
  },

  /**
   * 월별 트렌드
   */
  getMonthlyTrend: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/order-patterns/monthly-trend', {
      params: { startDate, endDate },
    })
    return response.data
  },

  /**
   * 히트맵 데이터 (요일 x 월별)
   */
  getHeatmap: async (startDate: string, endDate: string, metric: 'orders' | 'gmv' | 'aov' = 'orders') => {
    const response = await api.get('/api/order-patterns/heatmap', {
      params: { startDate, endDate, metric },
    })
    return response.data
  },

  /**
   * 자동 인사이트
   */
  getInsights: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/order-patterns/insights', {
      params: { startDate, endDate },
    })
    return response.data
  },

  /**
   * 국가별 상세 비교
   */
  getCountryDetail: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/order-patterns/country-detail', {
      params: { startDate, endDate },
    })
    return response.data
  },
}

// ==================== 고객 360° 뷰 API ====================
export const customer360Api = {
  /**
   * 고객 검색
   */
  search: async (query: string, type: string = 'email', limit: number = 20) => {
    const response = await api.get('/api/customer-360/search', {
      params: { q: query, type, limit },
    })
    return response.data
  },

  /**
   * 고객 360° 뷰 조회
   */
  getCustomer: async (userId: string) => {
    const response = await api.get(`/api/customer-360/${userId}`)
    return response.data
  },

  /**
   * 세그먼트 요약
   */
  getSegmentsSummary: async () => {
    const response = await api.get('/api/customer-360/segments/summary')
    return response.data
  },
}

export default api

