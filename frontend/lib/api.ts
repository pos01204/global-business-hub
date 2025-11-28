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
  checkHealth: async () => {
    const response = await api.get('/api/chat/health')
    return response.data
  },
  getAgents: async () => {
    const response = await api.get('/api/chat/agents')
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

// 고객 분석 API
export const customerAnalyticsApi = {
  // RFM 세그먼테이션
  getRFM: async () => {
    const response = await api.get('/api/customer-analytics/rfm')
    return response.data
  },

  // 이탈 위험 분석
  getChurnRisk: async () => {
    const response = await api.get('/api/customer-analytics/churn-risk')
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

export default api

