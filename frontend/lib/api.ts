import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

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
}

export default api

