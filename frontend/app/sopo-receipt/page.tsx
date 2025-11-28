'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sopoReceiptApi } from '@/lib/api'

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
  totalAmount: number
  totalAmountKRW?: number
  totalAmountUSD?: number
  orderCount: number
}

interface OrderDetail {
  orderCode: string
  shipmentId: string
  productName: string
  option: string
  quantity: number
  amount: number
  amountKRW?: number
  amountUSD?: number
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

  // 기간 목록 조회
  const { data: periodsData } = useQuery({
    queryKey: ['sopo-periods'],
    queryFn: sopoReceiptApi.getPeriods,
  })

  // 트래킹 데이터 조회
  const { data: trackingData, isLoading: trackingLoading } = useQuery({
    queryKey: ['sopo-tracking', selectedPeriod],
    queryFn: () => sopoReceiptApi.getTracking({ period: selectedPeriod }),
    enabled: activeTab === 'tracking',
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
    { id: 'upload' as const, label: '📤 선적 업로드', description: 'CSV 업로드 & 검증' },
    { id: 'artists' as const, label: '👥 대상 작가', description: '작가 관리 & 발송' },
    { id: 'tracking' as const, label: '📋 신청 현황', description: '트래킹 & 리마인더' },
    { id: 'history' as const, label: '📊 히스토리', description: '발급 이력' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-3xl">📦</span>
                소포수령증 관리
              </h1>
              <p className="text-sm text-gray-500 mt-1">해외 배송 주문 소포수령증 발급 자동화</p>
            </div>
            
            {/* 기간 선택 */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">기간:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {generatePeriodOptions().map(period => (
                  <option key={period} value={period}>{formatPeriodDisplay(period)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex gap-2 mt-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 탭 1: 선적 업로드 */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* 업로드 카드 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">📁</span>
                롯데 선적 CSV 업로드
              </h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="text-5xl mb-4">📄</div>
                  <p className="text-gray-600 mb-2">CSV 파일을 드래그하거나 클릭하여 업로드</p>
                  <p className="text-sm text-gray-400">backpa_XX월_선적내역_추출_YYYYMMDD.csv</p>
                </label>
              </div>

              {uploadMutation.isPending && (
                <div className="mt-4 text-center text-orange-600">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full mr-2"></div>
                  업로드 및 검증 중...
                </div>
              )}

              {uploadMutation.isError && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                  업로드 실패: {(uploadMutation.error as Error).message}
                </div>
              )}
            </div>

            {/* 검증 결과 */}
            {uploadResult && (
              <div className="space-y-6">
                {/* 요약 카드 */}
                <div className="grid grid-cols-5 gap-4">
                  <StatCard 
                    title="총 선적 건수" 
                    value={uploadResult.totalShipments} 
                    icon="📦"
                    color="blue"
                  />
                  <StatCard 
                    title="매칭 성공" 
                    value={uploadResult.matchedCount} 
                    icon="✅"
                    color="green"
                  />
                  <StatCard 
                    title="매칭 실패" 
                    value={uploadResult.unmatchedCount} 
                    icon="⚠️"
                    color={uploadResult.unmatchedCount > 0 ? 'red' : 'gray'}
                  />
                  <StatCard 
                    title="대상 작가" 
                    value={uploadResult.artistCount} 
                    icon="👤"
                    color="orange"
                  />
                  <StatCard 
                    title="이메일 보유" 
                    value={uploadResult.emailStats?.withEmail || uploadResult.artists.filter(a => a.artistEmail).length} 
                    icon="📧"
                    color="purple"
                  />
                </div>

                {/* 매칭 실패 경고 */}
                {uploadResult.unmatchedShipments.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-medium text-red-800 mb-2">⚠️ 매칭 실패 shipment_id</h3>
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">대상 작가 목록</h2>
                    <button
                      onClick={() => setActiveTab('artists')}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      작가 관리로 이동 →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">작가명</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">주문 수</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">총 금액</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">액션</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {uploadResult.artists.map(artist => (
                          <tr key={artist.artistName} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{artist.artistName}</td>
                            <td className="px-4 py-3 text-sm">
                              {artist.artistEmail ? (
                                <span className="text-gray-600">{artist.artistEmail}</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs">이메일 없음</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-sm">{artist.orderCount}건</td>
                            <td className="px-4 py-3 text-right text-sm font-medium">
                              {formatAmount(artist)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => setSelectedArtistDetail(artist)}
                                className="text-blue-600 hover:text-blue-800 text-sm mr-2"
                              >
                                상세
                              </button>
                              <button
                                onClick={() => handleDownloadOrderSheet(artist)}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">📧 안내 이메일 발송</h2>
                  <p className="text-sm text-gray-500 mt-1">
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
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    전체 선택
                  </button>
                  <button
                    onClick={() => setSelectedArtists(new Set())}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
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
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {notifyMutation.isPending ? '발송 중...' : '📧 안내 발송'}
                  </button>
                </div>
              </div>

              {notifyMutation.isSuccess && (
                <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg">
                  ✅ {notifyMutation.data.data.sentCount}명에게 발송 완료
                  {notifyMutation.data.data.failedCount > 0 && (
                    <span className="ml-2 text-red-600">
                      ({notifyMutation.data.data.failedCount}명 실패)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 작가 테이블 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
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
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">작가명</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">주문</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">금액</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">주문내역서</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {uploadResult.artists.map(artist => (
                    <tr key={artist.artistName} className="hover:bg-gray-50">
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
                          className="w-4 h-4 rounded border-gray-300 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{artist.artistName}</td>
                      <td className="px-4 py-3 text-sm">
                        {artist.artistEmail ? (
                          <span className="text-gray-600">{artist.artistEmail}</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs">이메일 없음</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">{artist.orderCount}건</td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {formatAmount(artist)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDownloadOrderSheet(artist)}
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          📥 다운로드
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
            {trackingLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin inline-block w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full"></div>
                <p className="mt-2 text-gray-500">로딩 중...</p>
              </div>
            ) : trackingData?.data ? (
              <>
                {/* 요약 카드 */}
                <div className="grid grid-cols-4 gap-4">
                  <StatCard title="전체" value={trackingData.data.summary.total} icon="📊" color="blue" />
                  <StatCard title="안내 발송" value={trackingData.data.summary.notified} icon="📧" color="purple" />
                  <StatCard title="신청 완료" value={trackingData.data.summary.submitted} icon="✅" color="green" />
                  <StatCard title="대기 중" value={trackingData.data.summary.pending} icon="⏳" color="orange" />
                </div>

                {/* 트래킹 테이블 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">작가명</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">주문</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">안내 발송</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">신청 상태</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">액션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {trackingData.data.records.map((record: TrackingRecord, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{record.artistName}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{record.artistEmail || '-'}</td>
                          <td className="px-4 py-3 text-right text-sm">{record.orderCount}건</td>
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
                            {record.applicationStatus === 'pending' && record.notificationSentAt && (
                              <button
                                onClick={() => {
                                  if (confirm(`${record.artistName} 작가님에게 리마인더를 발송하시겠습니까?`)) {
                                    reminderMutation.mutate({
                                      period: selectedPeriod,
                                      artistNames: [record.artistName],
                                    })
                                  }
                                }}
                                className="text-xs text-orange-600 hover:text-orange-800"
                              >
                                리마인더
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                해당 기간의 트래킹 데이터가 없습니다.
              </div>
            )}
          </div>
        )}

        {/* 탭 4: 히스토리 */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 발급 히스토리</h2>
            <div className="text-center py-12 text-gray-500">
              {periodsData?.data?.periods?.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">기록된 기간:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {periodsData.data.periods.map((period: string) => (
                      <button
                        key={period}
                        onClick={() => {
                          setSelectedPeriod(period)
                          setActiveTab('tracking')
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-orange-100 rounded-lg text-sm transition-colors"
                      >
                        {formatPeriodDisplay(period)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                '발급 이력이 없습니다.'
              )}
            </div>
          </div>
        )}
      </div>

      {/* 작가 상세 모달 */}
      {selectedArtistDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedArtistDetail.artistName} 주문 상세</h3>
              <button 
                onClick={() => setSelectedArtistDetail(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">주문번호</th>
                    <th className="px-3 py-2 text-left">작품명</th>
                    <th className="px-3 py-2 text-center">수량</th>
                    <th className="px-3 py-2 text-right">금액</th>
                    <th className="px-3 py-2 text-center">운송사</th>
                    <th className="px-3 py-2 text-left">국가</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedArtistDetail.orders.map((order, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-mono text-xs">{order.orderCode}</td>
                      <td className="px-3 py-2 truncate max-w-[200px]" title={order.productName}>
                        {order.productName}
                      </td>
                      <td className="px-3 py-2 text-center">{order.quantity}</td>
                      <td className="px-3 py-2 text-right">
                        ₩{(order.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {order.carrier}
                        </span>
                      </td>
                      <td className="px-3 py-2">{order.countryCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => handleDownloadOrderSheet(selectedArtistDetail)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                📥 주문내역서 다운로드
              </button>
              <button
                onClick={() => setSelectedArtistDetail(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
  icon: string
  color: 'blue' | 'green' | 'red' | 'orange' | 'gray' | 'purple'
}) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
    gray: 'from-gray-400 to-gray-500',
    purple: 'from-purple-500 to-purple-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white text-xl`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
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

