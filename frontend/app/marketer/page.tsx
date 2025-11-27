'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { marketerApi } from '@/lib/api'
import type { DiscoveryResult, GeneratedContent } from '@/types/marketer'

interface DiscoveryResultWithContent extends DiscoveryResult {
  generatedContent?: GeneratedContent
}

export default function MarketerPage() {
  const [activeTab, setActiveTab] = useState<'discovery' | 'generate' | 'image'>('discovery')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedDiscovery, setSelectedDiscovery] = useState<DiscoveryResultWithContent | null>(null)
  const [contentType, setContentType] = useState<'blog' | 'social' | 'email'>('social')
  const [platform, setPlatform] = useState<'blog' | 'instagram' | 'facebook' | 'twitter' | 'email'>('instagram')
  const [language, setLanguage] = useState<'korean' | 'english' | 'japanese'>('korean')
  const [tone, setTone] = useState('따뜻하고 감성적인')
  const [productUrl, setProductUrl] = useState('')
  const [savedContents, setSavedContents] = useState<any[]>([])
  const [showSavedContents, setShowSavedContents] = useState(false)
  const [showCampaigns, setShowCampaigns] = useState(false)
  const [editingContent, setEditingContent] = useState<GeneratedContent | null>(null)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [selectedContentIds, setSelectedContentIds] = useState<string[]>([])
  const [campaignSchedule, setCampaignSchedule] = useState({
    publishDate: new Date().toISOString().split('T')[0],
    platforms: [] as string[],
    timezone: 'Asia/Seoul',
  })

  // Ollama 연결 상태 확인
  const { data: healthData } = useQuery({
    queryKey: ['marketer', 'health'],
    queryFn: () => marketerApi.checkHealth(),
  })

  // 소재 탐색
  const {
    data: discoveryData,
    isLoading: isSearching,
    refetch: searchDiscovery,
  } = useQuery({
    queryKey: ['marketer', 'discovery', searchKeyword],
    queryFn: () => marketerApi.searchDiscovery({ keyword: searchKeyword, limit: 10 }),
    enabled: false,
  })

  // 저장된 콘텐츠 목록 조회
  const { data: savedContentsData, refetch: refetchSavedContents } = useQuery({
    queryKey: ['marketer', 'saved-contents'],
    queryFn: () => marketerApi.getSavedContents(),
    enabled: showSavedContents || showCampaigns,
  })

  // 캠페인 목록 조회
  const { data: campaignsData, refetch: refetchCampaigns } = useQuery({
    queryKey: ['marketer', 'campaigns'],
    queryFn: () => marketerApi.getCampaigns(),
    enabled: showCampaigns,
  })

  // 캠페인 생성
  const createCampaignMutation = useMutation({
    mutationFn: (campaign: { 
      name: string
      contentIds: string[]
      schedule?: {
        publishDate: string
        platforms: string[]
        timezone: string
      }
    }) => marketerApi.createCampaign(campaign),
    onSuccess: () => {
      alert('캠페인이 생성되었습니다.')
      setNewCampaignName('')
      setSelectedContentIds([])
      refetchCampaigns()
    },
  })

  // 캠페인 삭제
  const deleteCampaignMutation = useMutation({
    mutationFn: (id: string) => marketerApi.deleteCampaign(id),
    onSuccess: () => {
      alert('캠페인이 삭제되었습니다.')
      refetchCampaigns()
    },
  })

  // 콘텐츠 생성
  const generateContentMutation = useMutation({
    mutationFn: (request: any) => marketerApi.generateContent(request),
    onSuccess: (data) => {
      if (data.success) {
        if (selectedDiscovery) {
          setSelectedDiscovery({ ...selectedDiscovery, generatedContent: data.data } as DiscoveryResultWithContent)
        } else if (productUrl) {
          // URL만 있는 경우 임시 discovery 객체 생성
          const tempDiscovery: DiscoveryResultWithContent = {
            id: `temp-${Date.now()}`,
            type: 'product',
            source: {
              platform: 'idus',
              url: productUrl,
              scrapedAt: new Date().toISOString(),
            },
            metadata: {
              title: '작품',
              description: '',
              images: [],
              category: '',
              tags: [],
            },
            analysis: {
              trendScore: 0,
              targetAudience: [],
              keywords: [],
            },
            createdAt: new Date().toISOString(),
            generatedContent: data.data,
          }
          setSelectedDiscovery(tempDiscovery)
        }
      }
    },
  })

  // 콘텐츠 저장
  const saveContentMutation = useMutation({
    mutationFn: (content: any) => marketerApi.saveContent(content),
    onSuccess: () => {
      alert('콘텐츠가 저장되었습니다.')
      refetchSavedContents()
    },
  })

  // 콘텐츠 삭제
  const deleteContentMutation = useMutation({
    mutationFn: (id: string) => marketerApi.deleteContent(id),
    onSuccess: () => {
      alert('콘텐츠가 삭제되었습니다.')
      refetchSavedContents()
    },
  })

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      searchDiscovery()
    }
  }

  // URL 분석 mutation
  const analyzeUrlMutation = useMutation({
    mutationFn: (url: string) => marketerApi.analyzeProduct(url),
    onSuccess: (data) => {
      if (data.success && data.data) {
        setSelectedDiscovery(data.data as DiscoveryResultWithContent)
      }
    },
  })

  const handleUrlAnalyze = () => {
    if (productUrl.trim()) {
      analyzeUrlMutation.mutate(productUrl)
    }
  }

  const handleGenerateContent = () => {
    const request: any = {
      contentType,
      platform,
      language,
      tone,
    }

    if (selectedDiscovery && selectedDiscovery.metadata) {
      request.discoveryId = selectedDiscovery.id
      request.productUrl = selectedDiscovery.source?.url || productUrl
      request.additionalContext = `${selectedDiscovery.metadata?.title || ''}. ${selectedDiscovery.metadata?.description || ''}`.trim()
    } else if (productUrl.trim()) {
      request.productUrl = productUrl.trim()
    } else {
      alert('소재를 선택하거나 작품 URL을 입력해주세요.')
      return
    }

    generateContentMutation.mutate(request)
  }

  const generatedContent = selectedDiscovery && (selectedDiscovery as any).generatedContent

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 퍼포먼스 마케터</h1>
        <p className="text-gray-600">idus 소재 탐색 및 owned media 콘텐츠 생성</p>
      </div>

      {/* OpenAI 연결 상태 */}
      {healthData && (
        <div className={`card mb-6 ${
          healthData.openaiConnected
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                healthData.openaiConnected
                  ? 'bg-green-500' 
                  : 'bg-yellow-500'
              }`}></div>
              <p className="text-sm font-medium">
                {healthData.openaiConnected
                  ? `✅ OpenAI 서비스가 정상적으로 연결되었습니다. (모델: ${healthData.configuredModel || 'gpt-4o-mini'})`
                  : '⚠️ OpenAI 서비스에 연결할 수 없습니다. OPENAI_API_KEY 환경 변수를 확인하세요.'}
              </p>
            </div>
            {healthData.message && (
              <p className="text-xs text-gray-600 ml-6">{healthData.message}</p>
            )}
            {healthData.troubleshooting && healthData.troubleshooting.length > 0 && (
              <div className="ml-6 mt-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">해결 방법:</p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  {healthData.troubleshooting.map((step: string, idx: number) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
            {healthData.availableModels && healthData.availableModels.length > 0 && (
              <div className="ml-6 mt-2">
                <p className="text-xs text-gray-600">
                  사용 가능한 모델: {healthData.availableModels.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('discovery')
            setShowSavedContents(false)
            setShowCampaigns(false)
          }}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'discovery' && !showSavedContents
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-primary'
          }`}
        >
          소재 탐색
        </button>
        <button
          onClick={() => {
            setActiveTab('generate')
            setShowSavedContents(false)
            setShowCampaigns(false)
          }}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'generate' && !showSavedContents
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-primary'
          }`}
        >
          콘텐츠 생성
        </button>
        <button
          onClick={() => {
            setShowSavedContents(true)
            setShowCampaigns(false)
            refetchSavedContents()
          }}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            showSavedContents && !showCampaigns
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-primary'
          }`}
        >
          저장된 콘텐츠
          {savedContentsData?.data && savedContentsData.data.length > 0 && (
            <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
              {savedContentsData.data.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setShowCampaigns(true)
            setShowSavedContents(false)
            refetchCampaigns()
            refetchSavedContents()
          }}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            showCampaigns
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-primary'
          }`}
        >
          캠페인 관리
          {campaignsData?.data && campaignsData.data.length > 0 && (
            <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
              {campaignsData.data.length}
            </span>
          )}
        </button>
      </div>

      {/* 소재 탐색 탭 */}
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          {/* 검색 바 */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">작품 검색</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="키워드를 입력하세요 (예: 핸드메이드, 수공예)"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button onClick={handleSearch} className="btn btn-primary" disabled={isSearching}>
                {isSearching ? '검색 중...' : '검색'}
              </button>
            </div>
          </div>

          {/* 검색 결과 */}
          {isSearching && (
            <div className="card text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">소재를 검색하는 중...</p>
            </div>
          )}

          {discoveryData?.success && discoveryData.data && discoveryData.data.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  총 <span className="font-semibold text-primary">{discoveryData.count}</span>개의 작품을 찾았습니다.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discoveryData.data.map((item: DiscoveryResultWithContent) => (
                  <div
                    key={item.id}
                    className={`card cursor-pointer transition-all hover:shadow-lg ${
                      selectedDiscovery?.id === item.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedDiscovery(item)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg line-clamp-1">{item.metadata.title}</h3>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded whitespace-nowrap ml-2">
                        트렌드 {item.analysis.trendScore}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.metadata.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.metadata.tags.slice(0, 3).map((tag: string, idx: number) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                      {item.metadata.tags.length > 3 && (
                        <span className="text-xs text-gray-400 px-2 py-1">+{item.metadata.tags.length - 3}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      {item.metadata.price && (
                        <p className="text-lg font-bold text-primary">₩{item.metadata.price.toLocaleString()}</p>
                      )}
                      {item.metadata.artist && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">작가: {item.metadata.artist.name}</p>
                          {item.metadata.artist.followers && (
                            <p className="text-xs text-gray-400">팔로워 {item.metadata.artist.followers.toLocaleString()}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {discoveryData?.success && discoveryData.data && discoveryData.data.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-gray-600">검색 결과가 없습니다. 다른 키워드로 시도해보세요.</p>
            </div>
          )}
        </div>
      )}

      {/* 콘텐츠 생성 탭 */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          {/* 선택된 소재 또는 URL 입력 */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">소재 선택</h2>
            {selectedDiscovery && selectedDiscovery.metadata ? (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{selectedDiscovery.metadata?.title || '작품명 없음'}</h3>
                      {selectedDiscovery.source?.platform === 'idus' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {selectedDiscovery.source.scrapedAt ? '크롤링됨' : 'AI 분석됨'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                      {selectedDiscovery.metadata?.description || '설명 없음'}
                    </p>
                    {selectedDiscovery.metadata?.price && selectedDiscovery.metadata.price > 0 && (
                      <p className="text-sm font-semibold text-primary mt-2">
                        ₩{selectedDiscovery.metadata.price.toLocaleString()}
                      </p>
                    )}
                    {selectedDiscovery.metadata?.tags && selectedDiscovery.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedDiscovery.metadata.tags.slice(0, 5).map((tag: string, idx: number) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDiscovery(null)
                      setProductUrl('')
                    }}
                    className="text-gray-400 hover:text-gray-600 ml-4"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">작품 URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUrlAnalyze()}
                    placeholder="https://www.idus.com/product/..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleUrlAnalyze}
                    disabled={!productUrl.trim() || analyzeUrlMutation.isPending}
                    className="btn btn-secondary whitespace-nowrap"
                  >
                    {analyzeUrlMutation.isPending ? '분석 중...' : '분석'}
                  </button>
                </div>
                {analyzeUrlMutation.isPending && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-blue-700">
                        작품 정보를 분석하는 중입니다... (크롤링 → AI 파서 순서로 시도)
                      </p>
                    </div>
                  </div>
                )}
                {analyzeUrlMutation.isError && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      ⚠️ URL 분석 중 오류가 발생했습니다. URL을 직접 사용하여 콘텐츠를 생성할 수 있습니다.
                    </p>
                  </div>
                )}
                {analyzeUrlMutation.isSuccess && selectedDiscovery && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✅ 작품 정보를 성공적으로 가져왔습니다. 콘텐츠 생성 옵션을 설정하고 생성 버튼을 클릭하세요.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 콘텐츠 생성 옵션 */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">콘텐츠 생성 옵션</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">콘텐츠 타입</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="social">소셜 미디어</option>
                  <option value="blog">블로그 포스트</option>
                  <option value="email">이메일 뉴스레터</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">플랫폼</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {contentType === 'social' && (
                    <>
                      <option value="instagram">인스타그램</option>
                      <option value="facebook">페이스북</option>
                      <option value="twitter">X(트위터)</option>
                    </>
                  )}
                  {contentType === 'blog' && <option value="blog">블로그</option>}
                  {contentType === 'email' && <option value="email">이메일</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">언어</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="korean">한국어</option>
                  <option value="english">영어</option>
                  <option value="japanese">일본어</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">톤앤매너</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="따뜻하고 감성적인">따뜻하고 감성적인</option>
                  <option value="모던하고 세련된">모던하고 세련된</option>
                  <option value="유쾌하고 발랄한">유쾌하고 발랄한</option>
                  <option value="전문적이고 신뢰감 있는">전문적이고 신뢰감 있는</option>
                  <option value="미니멀하고 간결한">미니멀하고 간결한</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleGenerateContent}
              disabled={generateContentMutation.isPending || (!selectedDiscovery && !productUrl.trim())}
              className="btn btn-primary mt-4 w-full"
            >
              {generateContentMutation.isPending ? '생성 중...' : '콘텐츠 생성'}
            </button>
            {!selectedDiscovery && !productUrl.trim() && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                소재 탐색에서 작품을 선택하거나 작품 URL을 입력해주세요.
              </p>
            )}
          </div>

          {/* 생성된 콘텐츠 */}
          {generateContentMutation.isPending && (
            <div className="card text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">콘텐츠를 생성하는 중...</p>
              <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요.</p>
            </div>
          )}

          {generatedContent && !generateContentMutation.isPending && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">생성된 콘텐츠</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (editingContent) {
                        saveContentMutation.mutate({ ...generatedContent, id: editingContent.id })
                        setEditingContent(null)
                      } else {
                        saveContentMutation.mutate(generatedContent)
                      }
                    }}
                    className="btn btn-primary text-sm"
                    disabled={saveContentMutation.isPending}
                  >
                    {saveContentMutation.isPending ? '저장 중...' : editingContent ? '업데이트' : '저장'}
                  </button>
                  {editingContent && (
                    <button
                      onClick={() => {
                        setEditingContent(null)
                        if (selectedDiscovery) {
                          setSelectedDiscovery({
                            ...selectedDiscovery,
                            generatedContent: undefined,
                          } as DiscoveryResultWithContent)
                        }
                      }}
                      className="btn btn-secondary text-sm"
                    >
                      취소
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const text = `${generatedContent.title}\n\n${generatedContent.content}\n\n${generatedContent.metadata.hashtags.map((t: string) => t.startsWith('#') ? t : `#${t}`).join(' ')}`
                      navigator.clipboard.writeText(text)
                      alert('콘텐츠가 클립보드에 복사되었습니다.')
                    }}
                    className="btn btn-secondary text-sm"
                  >
                    복사
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {editingContent ? (
                      <input
                        type="text"
                        value={generatedContent.title}
                        onChange={(e) => {
                          if (selectedDiscovery) {
                            setSelectedDiscovery({
                              ...selectedDiscovery,
                              generatedContent: {
                                ...generatedContent,
                                title: e.target.value,
                              },
                            } as DiscoveryResultWithContent)
                          }
                        }}
                        className="flex-1 font-semibold text-lg px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <h3 className="font-semibold text-lg">{generatedContent.title}</h3>
                    )}
                    {editingContent && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">편집 모드</span>
                    )}
                  </div>
                  <textarea
                    value={generatedContent.content}
                    onChange={(e) => {
                      if (selectedDiscovery) {
                        setSelectedDiscovery({
                          ...selectedDiscovery,
                          generatedContent: {
                            ...generatedContent,
                            content: e.target.value,
                          },
                        } as DiscoveryResultWithContent)
                      }
                    }}
                    className="w-full bg-gray-50 p-4 rounded-lg whitespace-pre-wrap border border-gray-200 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {generatedContent.metadata.hashtags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">해시태그</h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.metadata.hashtags.map((tag: string, idx: number) => (
                        <span key={idx} className="text-sm bg-primary/10 text-primary px-3 py-1 rounded">
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {generatedContent.metadata.seoKeywords.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">SEO 키워드</h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.metadata.seoKeywords.map((keyword: string, idx: number) => (
                        <span key={idx} className="text-sm bg-gray-100 px-3 py-1 rounded">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {generatedContent.metadata.callToAction && (
                  <div>
                    <h4 className="font-medium mb-2">Call to Action</h4>
                    <p className="text-sm bg-accent/10 text-accent px-3 py-2 rounded">
                      {generatedContent.metadata.callToAction}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 저장된 콘텐츠 탭 */}
          {showSavedContents && (
            <div className="space-y-4">
              {savedContentsData?.success && savedContentsData.data && savedContentsData.data.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {savedContentsData.data.map((content: any) => (
                    <div key={content.id} className="card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{content.title}</h3>
                          <p className="text-sm text-gray-500 mb-2">
                            저장일: {new Date(content.savedAt).toLocaleString('ko-KR')}
                          </p>
                          <div className="bg-gray-50 p-3 rounded-lg mb-3 whitespace-pre-wrap text-sm">
                            {content.content.substring(0, 200)}
                            {content.content.length > 200 && '...'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingContent(content)
                            setSelectedDiscovery({
                              id: 'saved',
                              type: 'product',
                              source: { platform: 'idus', url: '', scrapedAt: content.createdAt },
                              metadata: { title: content.title, description: '', images: [], category: '', tags: [] },
                              analysis: { trendScore: 0, targetAudience: [], keywords: [] },
                              createdAt: content.createdAt,
                              generatedContent: content,
                            } as DiscoveryResultWithContent)
                            setShowSavedContents(false)
                            setActiveTab('generate')
                          }}
                          className="btn btn-secondary text-sm"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('정말 삭제하시겠습니까?')) {
                              deleteContentMutation.mutate(content.id)
                            }
                          }}
                          className="btn bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                        >
                          삭제
                        </button>
                        <button
                          onClick={() => {
                            const text = `${content.title}\n\n${content.content}\n\n${content.metadata.hashtags.map((t: string) => t.startsWith('#') ? t : `#${t}`).join(' ')}`
                            navigator.clipboard.writeText(text)
                            alert('콘텐츠가 클립보드에 복사되었습니다.')
                          }}
                          className="btn btn-primary text-sm"
                        >
                          복사
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              // 성과 데이터 추가 (시뮬레이션)
                              await marketerApi.addPerformanceMetric({
                                contentId: content.id,
                                views: Math.floor(Math.random() * 1000) + 100,
                                engagement: Math.floor(Math.random() * 100) + 10,
                                conversions: Math.floor(Math.random() * 20) + 1,
                                platform: 'instagram',
                              })
                              alert('성과 데이터가 추가되었습니다. (시뮬레이션)')
                            } catch (error) {
                              console.error('성과 데이터 추가 오류:', error)
                            }
                          }}
                          className="btn btn-secondary text-sm"
                        >
                          성과 추가
                        </button>
                  <button
                    onClick={() => {
                      const text = `${content.title}\n\n${content.content}\n\n${content.metadata.hashtags.map((t: string) => t.startsWith('#') ? t : `#${t}`).join(' ')}`
                      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${content.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.txt`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                    className="btn btn-secondary text-sm"
                  >
                    다운로드
                  </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card text-center py-8">
                  <p className="text-gray-600">저장된 콘텐츠가 없습니다.</p>
                </div>
              )}
            </div>
          )}

          {/* 캠페인 관리 탭 */}
          {showCampaigns && (
            <div className="space-y-6">
              {/* 새 캠페인 생성 */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">새 캠페인 생성</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">캠페인 이름</label>
                    <input
                      type="text"
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                      placeholder="예: 2024 봄 신상품 홍보 캠페인"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">배포 일정</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">배포 예정일</label>
                        <input
                          type="date"
                          value={campaignSchedule.publishDate}
                          onChange={(e) => setCampaignSchedule({ ...campaignSchedule, publishDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">타임존</label>
                        <select
                          value={campaignSchedule.timezone}
                          onChange={(e) => setCampaignSchedule({ ...campaignSchedule, timezone: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="Asia/Seoul">한국 (KST)</option>
                          <option value="America/New_York">미국 동부 (EST)</option>
                          <option value="America/Los_Angeles">미국 서부 (PST)</option>
                          <option value="Asia/Tokyo">일본 (JST)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">배포 플랫폼</label>
                      <div className="flex flex-wrap gap-2">
                        {['instagram', 'facebook', 'twitter', 'blog', 'email'].map((platform) => (
                          <label key={platform} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={campaignSchedule.platforms.includes(platform)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCampaignSchedule({
                                    ...campaignSchedule,
                                    platforms: [...campaignSchedule.platforms, platform],
                                  })
                                } else {
                                  setCampaignSchedule({
                                    ...campaignSchedule,
                                    platforms: campaignSchedule.platforms.filter((p) => p !== platform),
                                  })
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">
                              {platform === 'instagram' ? '인스타그램' :
                               platform === 'facebook' ? '페이스북' :
                               platform === 'twitter' ? 'X(트위터)' :
                               platform === 'blog' ? '블로그' :
                               '이메일'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">포함할 콘텐츠 선택</label>
                    {savedContentsData?.success && savedContentsData.data && savedContentsData.data.length > 0 ? (
                      <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                        {savedContentsData.data.map((content: any) => (
                          <label key={content.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedContentIds.includes(content.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedContentIds([...selectedContentIds, content.id])
                                } else {
                                  setSelectedContentIds(selectedContentIds.filter((id) => id !== content.id))
                                }
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{content.title}</p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{content.content}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">저장된 콘텐츠가 없습니다. 먼저 콘텐츠를 생성하고 저장해주세요.</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (!newCampaignName.trim()) {
                        alert('캠페인 이름을 입력해주세요.')
                        return
                      }
                      if (selectedContentIds.length === 0) {
                        alert('최소 1개 이상의 콘텐츠를 선택해주세요.')
                        return
                      }
                      createCampaignMutation.mutate({
                        name: newCampaignName,
                        contentIds: selectedContentIds,
                        schedule: campaignSchedule,
                      })
                    }}
                    className="btn btn-primary w-full"
                    disabled={createCampaignMutation.isPending}
                  >
                    {createCampaignMutation.isPending ? '생성 중...' : '캠페인 생성'}
                  </button>
                </div>
              </div>

              {/* 캠페인 목록 */}
              {campaignsData?.success && campaignsData.data && campaignsData.data.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">캠페인 목록</h2>
                  {campaignsData.data.map((campaign: any) => (
                    <div key={campaign.id} className="card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{campaign.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded ${
                              campaign.status === 'published' ? 'bg-green-100 text-green-700' :
                              campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              campaign.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {campaign.status === 'planning' ? '기획 중' :
                               campaign.status === 'draft' ? '초안' :
                               campaign.status === 'scheduled' ? '예정됨' :
                               campaign.status === 'published' ? '발행됨' :
                               '완료'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            포함된 콘텐츠: {campaign.contentIds.length}개
                          </p>
                          {campaign.schedule && (
                            <div className="mt-2 space-y-1">
                              {campaign.schedule.publishDate && (
                                <p className="text-xs text-gray-500">
                                  배포 예정일: {new Date(campaign.schedule.publishDate).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
                              )}
                              {campaign.schedule.platforms && campaign.schedule.platforms.length > 0 && (
                                <p className="text-xs text-gray-500">
                                  플랫폼: {campaign.schedule.platforms.map((p: string) => 
                                    p === 'instagram' ? '인스타그램' :
                                    p === 'facebook' ? '페이스북' :
                                    p === 'twitter' ? 'X(트위터)' :
                                    p === 'blog' ? '블로그' :
                                    '이메일'
                                  ).join(', ')}
                                </p>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            생성일: {new Date(campaign.createdAt).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('정말 삭제하시겠습니까?')) {
                              deleteCampaignMutation.mutate(campaign.id)
                            }
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                          disabled={deleteCampaignMutation.isPending}
                        >
                          삭제
                        </button>
                      </div>
                      {campaign.performance && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">조회수</p>
                              <p className="font-semibold">{campaign.performance.views?.toLocaleString() || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">참여도</p>
                              <p className="font-semibold">{campaign.performance.engagement?.toLocaleString() || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">전환</p>
                              <p className="font-semibold">{campaign.performance.conversions?.toLocaleString() || 0}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card text-center py-8">
                  <p className="text-gray-600">생성된 캠페인이 없습니다.</p>
                </div>
              )}
            </div>
          )}

          {generateContentMutation.isError && (
            <div className="card bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <div>
                  <p className="font-semibold text-red-800 mb-1">콘텐츠 생성 실패</p>
                  <p className="text-red-600 text-sm">
                    {generateContentMutation.error instanceof Error
                      ? generateContentMutation.error.message
                      : '알 수 없는 오류가 발생했습니다.'}
                  </p>
                  <button
                    onClick={() => generateContentMutation.reset()}
                    className="mt-2 text-sm text-red-700 underline hover:text-red-900"
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

