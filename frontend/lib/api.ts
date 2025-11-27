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
  sendMessage: async (message: string, history: Array<{ role: 'user' | 'assistant'; content: string }> = []) => {
    const response = await api.post('/api/chat/message', {
      message,
      history,
    })
    return response.data
  },
  checkHealth: async () => {
    const response = await api.get('/api/chat/health')
    return response.data
  },
}

export default api

