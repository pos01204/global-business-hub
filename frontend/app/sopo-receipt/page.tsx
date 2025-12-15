'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sopoReceiptApi } from '@/lib/api'
import { Icon } from '@/components/ui/Icon'
import { Package, Upload, Users, FileText, BarChart3, CheckCircle, Clock, RefreshCw, AlertTriangle, Mail, Download, X, Calendar } from 'lucide-react'

// 탭 타입
type SopoTab = 'upload' | 'artists' | 'tracking' | 'history'

interface UploadResult {
  period: string
  totalShipments: number
  matchedCount: number
  unmatchedCount: number
  unmatchedShipments: string[]
  artistCount: number
  artists: ArtistSummary[]
  emailStats?: {
    withEmail: number
    withoutEmail: number
  }
}

interface ArtistSummary {
  artistName: string
  artistId?: string
  artistEmail?: string
  orders: OrderDetail[]
  totalAmount: number // 작품 판매 금액(KRW) 합계 - 작가 정산 기준
  orderCount: number
}

interface OrderDetail {
  orderCode: string
  shipmentId: string
  shipmentItemId?: string // G열 - 고유 식별자 (동일 주문 내 옵션별 구분)
  productName: string
  option: string
  quantity: number
  amount: number // 작품 판매 금액(KRW) - 작가 정산 기준
  orderStatus: string
  shippedAt: string
  carrier: string
  trackingNumber: string
  countryCode: string
  recipient: string
}

interface TrackingRecord {
  period: string
  artistName: string
  artistEmail: string
  orderCount: number
  totalAmount: number
  notificationSentAt: string | null
  applicationStatus: 'pending' | 'submitted' | 'completed'
  applicationSubmittedAt: string | null
  jotformSubmissionId: string | null
  reminderSentAt: string | null
  receiptIssuedAt: string | null
}

export default function SopoReceiptPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<SopoTab>('upload')
  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentPeriod())
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set())
  const [selectedArtistDetail, setSelectedArtistDetail] = useState<ArtistSummary | null>(null)
  // 검색 & 필터 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // 기간 목록 조회
  const { data: periodsData } = useQuery({
    queryKey: ['sopo-periods'],
    queryFn: sopoReceiptApi.getPeriods,
  })

  // 트래킹 데이터 조회
  const { data: trackingData, isLoading: trackingLoading, refetch: refetchTracking } = useQuery({
    queryKey: ['sopo-tracking', selectedPeriod],
    queryFn: () => sopoReceiptApi.getTracking({ period: selectedPeriod }),
    enabled: activeTab === 'tracking' || activeTab === 'history',
  })

  // 파일 업로드 뮤테이션
  const uploadMutation = useMutation({
    mutationFn: ({ file, period }: { file: File; period: string }) => 
      sopoReceiptApi.upload(file, period),
    onSuccess: (data) => {
      if (data.success) {
        setUploadResult(data.data)
        queryClient.invalidateQueries({ queryKey: ['sopo-tracking'] })
      }
    },
  })

  // 안내 발송 뮤테이션
  const notifyMutation = useMutation({
    mutationFn: (params: { period: string; artistNames?: string[] }) => 
      sopoReceiptApi.notify(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sopo-tracking'] })
      setSelectedArtists(new Set())
    },
  })

  // 리마인더 발송 뮤테이션
  const reminderMutation = useMutation({
    mutationFn: (params: { period: string; artistNames: string[] }) =>
      sopoReceiptApi.sendReminder(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sopo-tracking'] })
    },
  })

  // JotForm 동기화 뮤테이션
  const syncJotformMutation = useMutation({
    mutationFn: () => sopoReceiptApi.syncJotform(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sopo-tracking'] })
      if (data.data) {
        alert(`JotForm 동기화 완료: ${data.data.synced}건 업데이트`)
      }
    },
  })

  // 트래킹 데이터 필터링
  const filteredTrackingRecords = trackingData?.data?.records?.filter((record: TrackingRecord) => {
    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        record.artistName.toLowerCase().includes(query) ||
        (record.artistEmail && record.artistEmail.toLowerCase().includes(query))
      if (!matchesSearch) return false
    }
    // 상태 필터
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && record.applicationStatus !== 'pending') return false
      if (statusFilter === 'notified' && !record.notificationSentAt) return false
      if (statusFilter === 'submitted' && record.applicationStatus !== 'submitted') return false
      if (statusFilter === 'no_email' && record.artistEmail) return false
    }
    return true
  }) || []

  // 파일 업로드 핸들러
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadMutation.mutate({ file, period: selectedPeriod })
    }
  }, [selectedPeriod, uploadMutation])

  // CSV 다운로드
  // 기존 양식: 주문번호,주문상태,작품명,옵션,수량,작품 금액
  // 금액: 작품 판매 금액(KRW) - 작가 정산 기준
  const handleDownloadOrderSheet = (artist: ArtistSummary) => {
    const header = '*상기 주문 내역서의 항목은 변경 될 수 있습니다.'
    const columns = '주문번호,주문상태,작품명,옵션,수량,작품 금액'
    const rows = artist.orders.map(order => {
      // 작품 금액 (KRW) - 작가 정산 기준
      const amount = (order.amount || 0).toLocaleString('ko-KR')
      return `${order.orderCode},${order.orderStatus},"${order.productName}","${order.option}",${order.quantity},"${amount}"`
    })
    
    const csvContent = [header, columns, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const periodShort = selectedPeriod.replace('-', '').slice(2)
    link.download = `${periodShort} 소포수령증 발급신청용 주문내역서_${artist.artistName}.csv`
    link.click()
  }

  // 금액 포맷 (작품 판매 금액 KRW - 작가 정산 기준)
  const formatAmount = (artist: ArtistSummary) => {
    const amount = artist.totalAmount || 0
    return `₩${amount.toLocaleString()}`
  }

  // 탭 설정
  const tabs = [
    { id: 'upload' as const, label: '선적 업로드', icon: Upload, description: 'CSV 업로드 & 검증' },
    { id: 'artists' as const, label: '대상 작가', icon: Users, description: '작가 관리 & 발송' },
    { id: 'tracking' as const, label: '신청 현황', icon: FileText, description: '트래킹 & 리마인더' },
    { id: 'history' as const, label: '히스토리', icon: BarChart3, description: '발급 이력' },
  ]

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 - idus 브랜드 스타일 */}
      <div className="relative bg-idus-500 dark:bg-orange-900/70 rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden shadow-lg dark:shadow-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 dark:bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg dark:shadow-none">
              <Icon icon={Package} size="xl" className="text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">소포수령증 관리</h1>
              <p className="text-idus-100 dark:text-orange-200/80 text-xs lg:text-sm font-medium">해외 배송 주문 소포수령증 발급 자동화</p>
            </div>
          </div>
          
          {/* 기간 선택 & 액션 */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-white/90">기간:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-lg text-white text-sm focus:ring-2 focus:ring-white/50 focus:border-white/50"
              >
                {generatePeriodOptions().map(period => (
                  <option key={period} value={period} className="text-gray-900">{formatPeriodDisplay(period)}</option>
                ))}
              </select>
            </div>
            
            {/* JotForm 동기화 버튼 */}
            <button
              onClick={() => syncJotformMutation.mutate()}
              disabled={syncJotformMutation.isPending}
              className="px-4 py-2 text-sm bg-white/20 backdrop-blur border border-white/30 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 flex items-center gap-2 transition-colors"
              title="JotForm 신청 데이터 동기화"
            >
              <Icon icon={syncJotformMutation.isPending ? Clock : RefreshCw} size="sm" className={syncJotformMutation.isPending ? 'animate-spin' : ''} />
              JotForm 동기화
            </button>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 - 모바일 최적화 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon={FileText} size="lg" className="text-slate-600 dark:text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">소포수령증 기능</h2>
        </div>
        
        {/* 모바일: 가로 스크롤 탭 */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
          <div className="flex gap-2 min-w-max lg:flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap
                  text-sm font-medium transition-all min-h-[48px]
                  ${activeTab === tab.id
                    ? 'bg-idus-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }
                `}
              >
                <Icon icon={tab.icon} size="sm" className={activeTab === tab.id ? 'text-white' : 'text-slate-600 dark:text-slate-400'} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div>
        {/* 탭 1: 선적 업로드 */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* 업로드 카드 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Icon icon={Upload} size="lg" className="text-idus-500" />
                롯데 선적 CSV 업로드
              </h2>
              
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 text-center hover:border-idus-400 dark:hover:border-idus-500 transition-colors bg-slate-50 dark:bg-slate-900/50">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer block">
                  <Icon icon={Upload} size="xl" className="mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                  <p className="text-slate-700 dark:text-slate-300 mb-2 font-medium">CSV 파일을 드래그하거나 클릭하여 업로드</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">backpa_XX월_선적내역_추출_YYYYMMDD.csv</p>
                </label>
              </div>

              {uploadMutation.isPending && (
                <div className="mt-4 text-center text-idus-600 dark:text-idus-400 flex items-center justify-center gap-2">
                  <Icon icon={Clock} size="md" className="animate-spin" />
                  업로드 및 검증 중...
                </div>
              )}

              {uploadMutation.isError && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-2">
                  <Icon icon={AlertTriangle} size="md" className="text-red-600 dark:text-red-400" />
                  <span>업로드 실패: {(uploadMutation.error as Error).message}</span>
                </div>
              )}
            </div>

            {/* 검증 결과 */}
            {uploadResult && (
              <div className="space-y-6">
                {/* 요약 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <StatCard 
                    title="총 선적 건수" 
                    value={uploadResult.totalShipments} 
                    icon={Package}
                    color="blue"
                  />
                  <StatCard 
                    title="매칭 성공" 
                    value={uploadResult.matchedCount} 
                    icon={CheckCircle}
                    color="green"
                  />
                  <StatCard 
                    title="매칭 실패" 
                    value={uploadResult.unmatchedCount} 
                    icon={AlertTriangle}
                    color={uploadResult.unmatchedCount > 0 ? 'red' : 'gray'}
                  />
                  <StatCard 
                    title="대상 작가" 
                    value={uploadResult.artistCount} 
                    icon={Users}
                    color="orange"
                  />
                  <StatCard 
                    title="이메일 보유" 
                    value={uploadResult.emailStats?.withEmail || uploadResult.artists.filter(a => a.artistEmail).length} 
                    icon={Mail}
                    color="purple"
                  />
                </div>

                {/* 매칭 실패 경고 */}
                {uploadResult.unmatchedShipments.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <h3 className="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                      <Icon icon={AlertTriangle} size="md" className="text-red-600 dark:text-red-400" />
                      매칭 실패 shipment_id
                    </h3>
                    <p className="text-sm text-red-600">
                      다음 선적 건이 logistics 데이터와 매칭되지 않았습니다:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {uploadResult.unmatchedShipments.map(id => (
                        <span key={id} className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 작가 목록 */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">대상 작가 목록</h2>
                    <button
                      onClick={() => setActiveTab('artists')}
                      className="px-4 py-2 bg-idus-500 text-white rounded-lg hover:bg-idus-600 transition-colors flex items-center gap-2"
                    >
                      작가 관리로 이동
                      <Icon icon={Users} size="sm" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">작가명</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">이메일</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">주문 수</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">총 금액</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">액션</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {uploadResult.artists.map(artist => (
                          <tr key={artist.artistName} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{artist.artistName}</td>
                            <td className="px-4 py-3 text-sm">
                              {artist.artistEmail ? (
                                <span className="text-slate-600 dark:text-slate-400">{artist.artistEmail}</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs">이메일 없음</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-300">{artist.orderCount}건</td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                              {formatAmount(artist)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => setSelectedArtistDetail(artist)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm mr-2"
                              >
                                상세
                              </button>
                              <button
                                onClick={() => handleDownloadOrderSheet(artist)}
                                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm flex items-center gap-1"
                              >
                                <Icon icon={Download} size="xs" />
                                다운로드
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 탭 2: 대상 작가 */}
        {activeTab === 'artists' && uploadResult && (
          <div className="space-y-6">
            {/* 일괄 발송 컨트롤 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Icon icon={Mail} size="lg" className="text-idus-500" />
                    안내 이메일 발송
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    선택된 작가: {selectedArtists.size}명 / 전체: {uploadResult.artists.filter(a => a.artistEmail).length}명
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const allWithEmail = new Set(
                        uploadResult.artists.filter(a => a.artistEmail).map(a => a.artistName)
                      )
                      setSelectedArtists(allWithEmail)
                    }}
                    className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    전체 선택
                  </button>
                  <button
                    onClick={() => setSelectedArtists(new Set())}
                    className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    선택 해제
                  </button>
                  <button
                    onClick={() => {
                      if (selectedArtists.size === 0) {
                        alert('발송할 작가를 선택해주세요.')
                        return
                      }
                      if (confirm(`${selectedArtists.size}명에게 안내 이메일을 발송하시겠습니까?`)) {
                        notifyMutation.mutate({
                          period: selectedPeriod,
                          artistNames: Array.from(selectedArtists),
                        })
                      }
                    }}
                    disabled={notifyMutation.isPending || selectedArtists.size === 0}
                    className="px-6 py-2 bg-idus-500 text-white rounded-lg hover:bg-idus-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {notifyMutation.isPending ? (
                      <>
                        <Icon icon={Clock} size="sm" className="animate-spin" />
                        발송 중...
                      </>
                    ) : (
                      <>
                        <Icon icon={Mail} size="sm" />
                        안내 발송
                      </>
                    )}
                  </button>
                </div>
              </div>

              {notifyMutation.isSuccess && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl flex items-center gap-2">
                  <Icon icon={CheckCircle} size="md" className="text-green-600 dark:text-green-400" />
                  <span>{notifyMutation.data.data.sentCount}명에게 발송 완료</span>
                  {notifyMutation.data.data.failedCount > 0 && (
                    <span className="ml-2 text-red-600">
                      ({notifyMutation.data.data.failedCount}명 실패)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 작가 테이블 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedArtists.size === uploadResult.artists.filter(a => a.artistEmail).length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedArtists(new Set(
                              uploadResult.artists.filter(a => a.artistEmail).map(a => a.artistName)
                            ))
                          } else {
                            setSelectedArtists(new Set())
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">작가명</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">이메일</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">주문</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">금액</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">주문내역서</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {uploadResult.artists.map(artist => (
                    <tr key={artist.artistName} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedArtists.has(artist.artistName)}
                          disabled={!artist.artistEmail}
                          onChange={(e) => {
                            const newSet = new Set(selectedArtists)
                            if (e.target.checked) {
                              newSet.add(artist.artistName)
                            } else {
                              newSet.delete(artist.artistName)
                            }
                            setSelectedArtists(newSet)
                          }}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{artist.artistName}</td>
                      <td className="px-4 py-3 text-sm">
                        {artist.artistEmail ? (
                          <span className="text-slate-600 dark:text-slate-400">{artist.artistEmail}</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs">이메일 없음</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-300">{artist.orderCount}건</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                        {formatAmount(artist)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDownloadOrderSheet(artist)}
                          className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 flex items-center gap-1"
                        >
                          <Icon icon={Download} size="xs" />
                          다운로드
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 탭 3: 신청 현황 */}
        {activeTab === 'tracking' && (
          <div className="space-y-6">
            {/* 검색 & 필터 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="작가명 또는 이메일로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-idus-500 focus:border-idus-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-idus-500"
                >
                  <option value="all">전체 상태</option>
                  <option value="pending">대기 중</option>
                  <option value="notified">안내 발송됨</option>
                  <option value="submitted">신청 완료</option>
                  <option value="no_email">이메일 없음</option>
                </select>
                <button
                  onClick={() => refetchTracking()}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <Icon icon={RefreshCw} size="sm" />
                  새로고침
                </button>
              </div>
            </div>

            {trackingLoading ? (
              <div className="text-center py-12">
                <Icon icon={Clock} size="xl" className="mx-auto mb-2 text-idus-500 animate-spin" />
                <p className="mt-2 text-slate-500 dark:text-slate-400">로딩 중...</p>
              </div>
            ) : trackingData?.data ? (
              <>
                {/* 요약 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <StatCard title="전체" value={trackingData.data.summary.total} icon={BarChart3} color="blue" />
                  <StatCard title="안내 발송" value={trackingData.data.summary.notified} icon={Mail} color="purple" />
                  <StatCard title="대기 중" value={trackingData.data.summary.pending} icon={Clock} color="orange" />
                  <StatCard title="신청 완료" value={trackingData.data.summary.submitted} icon={CheckCircle} color="green" />
                  <StatCard title="발급 완료" value={trackingData.data.summary.completed || 0} icon={CheckCircle} color="gray" />
                </div>

                {/* 트래킹 테이블 */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <span className="text-sm text-gray-500">검색 결과: {filteredTrackingRecords.length}건</span>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">작가명</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">주문</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">금액</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">안내</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">액션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredTrackingRecords.map((record: TrackingRecord, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{record.artistName}</td>
                          <td className="px-4 py-3 text-sm">
                            {record.artistEmail ? (
                              <span className="text-gray-600">{record.artistEmail}</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs">없음</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">{record.orderCount}건</td>
                          <td className="px-4 py-3 text-right text-sm font-medium">
                            ₩{(record.totalAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {record.notificationSentAt ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={record.applicationStatus} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {record.applicationStatus === 'pending' && record.notificationSentAt && record.artistEmail && (
                              <button
                                onClick={() => {
                                  if (confirm(`${record.artistName} 작가님에게 리마인더를 발송하시겠습니까?`)) {
                                    reminderMutation.mutate({
                                      period: selectedPeriod,
                                      artistNames: [record.artistName],
                                    })
                                  }
                                }}
                                disabled={reminderMutation.isPending}
                                className="text-xs text-orange-600 hover:text-orange-800 disabled:opacity-50"
                              >
                                리마인더
                              </button>
                            )}
                            {record.applicationStatus === 'pending' && !record.notificationSentAt && record.artistEmail && (
                              <button
                                onClick={() => {
                                  if (confirm(`${record.artistName} 작가님에게 안내를 발송하시겠습니까?`)) {
                                    notifyMutation.mutate({
                                      period: selectedPeriod,
                                      artistNames: [record.artistName],
                                    })
                                  }
                                }}
                                disabled={notifyMutation.isPending}
                                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                              >
                                안내 발송
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTrackingRecords.length === 0 && (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      {searchQuery || statusFilter !== 'all' 
                        ? '검색 조건에 맞는 데이터가 없습니다.'
                        : '해당 기간의 트래킹 데이터가 없습니다.'}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
                <Icon icon={FileText} size="xl" className="mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">트래킹 데이터가 없습니다</h3>
                <p className="text-slate-500 dark:text-slate-400">해당 기간의 선적 데이터를 먼저 업로드해주세요.</p>
              </div>
            )}
          </div>
        )}

        {/* 탭 4: 히스토리 */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* 전체 통계 */}
            {trackingData?.data?.summary && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Icon icon={BarChart3} size="lg" className="text-idus-500" />
                  {formatPeriodDisplay(selectedPeriod)} 발급 현황
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">대상 작가</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{trackingData.data.summary.total}명</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">안내 발송</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{trackingData.data.summary.notified}명</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-600 dark:text-green-400 mb-1">신청 완료</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{trackingData.data.summary.submitted}명</p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">신청률</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {trackingData.data.summary.notified > 0 
                        ? Math.round((trackingData.data.summary.submitted / trackingData.data.summary.notified) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 기간별 이력 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Icon icon={Calendar} size="lg" className="text-idus-500" />
                기간별 이력
              </h2>
              {periodsData?.data?.periods?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {periodsData.data.periods.map((period: string) => (
                    <button
                      key={period}
                      onClick={() => {
                        setSelectedPeriod(period)
                        setActiveTab('tracking')
                      }}
                      className={`p-4 border rounded-xl text-left transition-all hover:shadow-md ${
                        selectedPeriod === period 
                          ? 'border-idus-500 bg-idus-50 dark:bg-idus-900/20' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-idus-300 dark:hover:border-idus-600'
                      }`}
                    >
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatPeriodDisplay(period)}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">클릭하여 상세 보기</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  발급 이력이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 작가 상세 모달 */}
      {selectedArtistDetail && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedArtistDetail.artistName} 주문 상세</h3>
              <button 
                onClick={() => setSelectedArtistDetail(null)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <Icon icon={X} size="lg" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">주문번호</th>
                    <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">작품명</th>
                    <th className="px-3 py-2 text-center text-slate-500 dark:text-slate-400">수량</th>
                    <th className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">금액</th>
                    <th className="px-3 py-2 text-center text-slate-500 dark:text-slate-400">운송사</th>
                    <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">국가</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {selectedArtistDetail.orders.map((order, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{order.orderCode}</td>
                      <td className="px-3 py-2 truncate max-w-[200px] text-slate-900 dark:text-slate-100" title={order.productName}>
                        {order.productName}
                      </td>
                      <td className="px-3 py-2 text-center text-slate-700 dark:text-slate-300">{order.quantity}</td>
                      <td className="px-3 py-2 text-right text-slate-900 dark:text-slate-100 font-medium">
                        ₩{(order.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                          {order.carrier}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{order.countryCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => handleDownloadOrderSheet(selectedArtistDetail)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <Icon icon={Download} size="sm" />
                주문내역서 다운로드
              </button>
              <button
                onClick={() => setSelectedArtistDetail(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 유틸리티 컴포넌트 & 함수
function StatCard({ title, value, icon, color }: { 
  title: string
  value: number
  icon: any
  color: 'blue' | 'green' | 'red' | 'orange' | 'gray' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    gray: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon icon={icon} size="lg" />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-700',
    submitted: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
  }
  const labels = {
    pending: '대기',
    submitted: '신청완료',
    completed: '발급완료',
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  )
}

function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function generatePeriodOptions(): string[] {
  const periods: string[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    periods.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }
  return periods
}

function formatPeriodDisplay(period: string): string {
  const [year, month] = period.split('-')
  return `${year}년 ${parseInt(month)}월`
}

