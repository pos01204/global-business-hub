'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settlementApi } from '@/lib/api'

// 탭 타입
type SettlementTab = 'upload' | 'list' | 'country' | 'carrier' | 'weight' | 'trend' | 'validate'

// 국가 플래그 매핑
const countryFlags: Record<string, string> = {
  JP: '🇯🇵',
  US: '🇺🇸',
  AU: '🇦🇺',
  CA: '🇨🇦',
  NO: '🇳🇴',
  NZ: '🇳🇿',
  GB: '🇬🇧',
  DE: '🇩🇪',
  FR: '🇫🇷',
  KR: '🇰🇷',
  CN: '🇨🇳',
  TW: '🇹🇼',
  HK: '🇭🇰',
  SG: '🇸🇬',
  Unknown: '🌐',
}

export default function SettlementPage() {
  const [activeTab, setActiveTab] = useState<SettlementTab>('upload')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)

  const queryClient = useQueryClient()

  // 기간 목록 조회
  const { data: periodsData } = useQuery({
    queryKey: ['settlement', 'periods'],
    queryFn: settlementApi.getPeriods,
  })

  // 정산 목록 조회
  const { data: listData, isLoading: isListLoading } = useQuery({
    queryKey: ['settlement', 'list', selectedPeriod],
    queryFn: () => settlementApi.getList({ period: selectedPeriod || undefined, limit: 100 }),
    enabled: activeTab === 'list',
  })

  // 국가별 분석
  const { data: countryData, isLoading: isCountryLoading } = useQuery({
    queryKey: ['settlement', 'country', selectedPeriod],
    queryFn: () => settlementApi.getCountryAnalysis(selectedPeriod || undefined),
    enabled: activeTab === 'country',
  })

  // 운송사별 분석
  const { data: carrierData, isLoading: isCarrierLoading } = useQuery({
    queryKey: ['settlement', 'carrier', selectedPeriod],
    queryFn: () => settlementApi.getCarrierAnalysis(selectedPeriod || undefined),
    enabled: activeTab === 'carrier',
  })

  // 중량 분석
  const { data: weightData, isLoading: isWeightLoading } = useQuery({
    queryKey: ['settlement', 'weight', selectedPeriod],
    queryFn: () => settlementApi.getWeightAnalysis(selectedPeriod || undefined),
    enabled: activeTab === 'weight',
  })

  // 트렌드 분석
  const { data: trendData, isLoading: isTrendLoading } = useQuery({
    queryKey: ['settlement', 'trend'],
    queryFn: settlementApi.getTrendAnalysis,
    enabled: activeTab === 'trend',
  })

  // 요금 검증
  const validateMutation = useMutation({
    mutationFn: (period?: string) => settlementApi.validate(period),
  })

  // 파일 업로드 mutation
  const uploadMutation = useMutation({
    mutationFn: settlementApi.upload,
    onSuccess: (data) => {
      setUploadResult(data)
      queryClient.invalidateQueries({ queryKey: ['settlement'] })
    },
  })

  // 파일 드롭 핸들러
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      uploadMutation.mutate(file)
    } else {
      alert('CSV 파일만 업로드 가능합니다.')
    }
  }, [uploadMutation])

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadMutation.mutate(file)
    }
  }, [uploadMutation])

  // 금액 포맷
  const formatCurrency = (value: number) => {
    return `₩${Math.round(value).toLocaleString()}`
  }

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl">💰</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">물류비 정산</h1>
            <p className="text-gray-600 text-sm mt-1">물류비 정산서 업로드 및 비용 분석</p>
          </div>
        </div>
      </div>

      {/* 기간 필터 */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <label className="font-medium">정산 기간</label>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">전체 기간</option>
            {periodsData?.data?.map((p: any) => (
              <option key={p.period} value={p.period}>
                {p.period} ({p.count}건, {formatCurrency(p.totalCost)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>📤</span>
            <span>정산서 업로드</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'list'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>📋</span>
            <span>정산 내역</span>
          </button>
          <button
            onClick={() => setActiveTab('country')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'country'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>🌍</span>
            <span>국가별 분석</span>
          </button>
          <button
            onClick={() => setActiveTab('carrier')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'carrier'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>🚚</span>
            <span>운송사별 분석</span>
          </button>
          <button
            onClick={() => setActiveTab('weight')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'weight'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>⚖️</span>
            <span>중량 최적화</span>
          </button>
          <button
            onClick={() => setActiveTab('trend')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'trend'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>📈</span>
            <span>월별 트렌드</span>
          </button>
          <button
            onClick={() => setActiveTab('validate')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'validate'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>🔍</span>
            <span>요금 검증</span>
          </button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div>
        {/* 업로드 탭 */}
        {activeTab === 'upload' && (
          <div>
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>📤</span>
                정산서 업로드
              </h2>
              
              {/* 드래그 앤 드롭 영역 */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-5xl mb-4">📁</div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  CSV 파일을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  지원 형식: 롯데글로벌로지스 정산서 CSV
                </p>
                <label className="btn btn-primary cursor-pointer">
                  파일 선택
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 업로드 진행 중 */}
              {uploadMutation.isPending && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="text-blue-700">파일 처리 중...</span>
                  </div>
                </div>
              )}

              {/* 업로드 에러 */}
              {uploadMutation.isError && (
                <div className="mt-6 p-4 bg-red-50 rounded-lg">
                  <p className="text-red-700">
                    ❌ 업로드 실패: {(uploadMutation.error as Error)?.message || '알 수 없는 오류'}
                  </p>
                </div>
              )}

              {/* 업로드 성공 */}
              {uploadResult?.success && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-3">
                      ✅ 업로드 완료
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm text-gray-500">파일명</p>
                        <p className="font-medium">{uploadResult.data.fileName}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm text-gray-500">처리된 건수</p>
                        <p className="font-medium text-green-600">{uploadResult.data.processedRows}건</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm text-gray-500">총 운송료</p>
                        <p className="font-medium">{formatCurrency(uploadResult.data.summary.totalCost)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm text-gray-500">건당 평균</p>
                        <p className="font-medium">{formatCurrency(uploadResult.data.summary.avgCostPerShipment)}</p>
                      </div>
                    </div>
                    {uploadResult.data.skippedRows > 0 && (
                      <p className="mt-3 text-sm text-yellow-700">
                        ⚠️ {uploadResult.data.skippedRows}건의 행이 스킵되었습니다 (헤더/합계 행)
                      </p>
                    )}
                  </div>

                  {/* 검증 결과 */}
                  {uploadResult.data.validation && (
                    <div className={`p-4 rounded-lg ${
                      uploadResult.data.validation.summary.error > 0 
                        ? 'bg-red-50' 
                        : uploadResult.data.validation.summary.warning > 0 
                          ? 'bg-yellow-50' 
                          : 'bg-blue-50'
                    }`}>
                      <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                        uploadResult.data.validation.summary.error > 0 
                          ? 'text-red-800' 
                          : uploadResult.data.validation.summary.warning > 0 
                            ? 'text-yellow-800' 
                            : 'text-blue-800'
                      }`}>
                        {uploadResult.data.validation.summary.error > 0 
                          ? '❌ 요금 검증 오류 발견' 
                          : uploadResult.data.validation.summary.warning > 0 
                            ? '⚠️ 요금 검증 경고' 
                            : '✅ 요금 검증 완료'}
                      </h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-xs text-gray-500">총 검증</p>
                          <p className="font-bold">{uploadResult.data.validation.summary.total}건</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-xs text-green-600">정상</p>
                          <p className="font-bold text-green-600">{uploadResult.data.validation.summary.normal}건</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-xs text-yellow-600">경고</p>
                          <p className="font-bold text-yellow-600">{uploadResult.data.validation.summary.warning}건</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-xs text-red-600">오류</p>
                          <p className="font-bold text-red-600">{uploadResult.data.validation.summary.error}건</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-xs text-gray-500">미검증</p>
                          <p className="font-bold text-gray-500">{uploadResult.data.validation.summary.unknown}건</p>
                        </div>
                      </div>

                      {/* 비용 차이 요약 */}
                      {uploadResult.data.validation.summary.totalDifference !== 0 && (
                        <div className={`p-3 rounded-lg ${
                          uploadResult.data.validation.summary.totalDifference > 0 ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          <p className="text-sm">
                            {uploadResult.data.validation.summary.totalDifference > 0 
                              ? `📈 예상보다 ${formatCurrency(uploadResult.data.validation.summary.totalDifference)} 더 청구됨`
                              : `📉 예상보다 ${formatCurrency(Math.abs(uploadResult.data.validation.summary.totalDifference))} 적게 청구됨`
                            }
                          </p>
                        </div>
                      )}

                      {/* 이슈 목록 */}
                      {uploadResult.data.validation.issues?.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">주요 이슈 건:</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2">상태</th>
                                  <th className="text-left p-2">국가</th>
                                  <th className="text-left p-2">운송사</th>
                                  <th className="text-right p-2">중량</th>
                                  <th className="text-right p-2">예상요금</th>
                                  <th className="text-right p-2">실제요금</th>
                                  <th className="text-right p-2">차이</th>
                                </tr>
                              </thead>
                              <tbody>
                                {uploadResult.data.validation.issues.slice(0, 10).map((issue: any, idx: number) => (
                                  <tr key={idx} className="border-b hover:bg-white/50">
                                    <td className="p-2">
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        issue.status === 'error' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                                      }`}>
                                        {issue.status === 'error' ? '오류' : '경고'}
                                      </span>
                                    </td>
                                    <td className="p-2">{countryFlags[issue.details?.countryCode] || '🌐'} {issue.details?.countryCode}</td>
                                    <td className="p-2">{issue.details?.carrier}</td>
                                    <td className="p-2 text-right">{issue.details?.weight}kg</td>
                                    <td className="p-2 text-right">{issue.expectedRate ? formatCurrency(issue.expectedRate) : '-'}</td>
                                    <td className="p-2 text-right">{formatCurrency(issue.actualRate)}</td>
                                    <td className={`p-2 text-right font-medium ${
                                      issue.difference > 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                      {issue.difference > 0 ? '+' : ''}{formatCurrency(issue.difference)} ({issue.differencePercent}%)
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 사용 안내 */}
            <div className="card bg-gray-50">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>💡</span>
                사용 안내
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 롯데글로벌로지스 정산서 CSV 파일을 업로드하세요.</li>
                <li>• 정산서의 <strong>"주문번호"</strong>는 내부 시스템의 <strong>"shipment_id"</strong>로 매핑됩니다.</li>
                <li>• 업로드된 데이터는 Google Sheets에 자동으로 저장되어 아카이빙됩니다.</li>
                <li>• 중복 업로드 시 데이터가 추가됩니다 (덮어쓰기 아님).</li>
              </ul>
            </div>
          </div>
        )}

        {/* 정산 내역 탭 */}
        {activeTab === 'list' && (
          <div>
            {isListLoading ? (
              <div className="card text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                <p>데이터를 불러오는 중...</p>
              </div>
            ) : listData?.success ? (
              <>
                {/* 요약 통계 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="card">
                    <p className="text-sm text-gray-500">총 건수</p>
                    <p className="text-2xl font-bold">{listData.data.summary.totalRecords}건</p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-gray-500">총 운송료</p>
                    <p className="text-2xl font-bold">{formatCurrency(listData.data.summary.totalShippingFee)}</p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-gray-500">총 비용</p>
                    <p className="text-2xl font-bold">{formatCurrency(listData.data.summary.totalCost)}</p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-gray-500">건당 평균</p>
                    <p className="text-2xl font-bold">{formatCurrency(listData.data.summary.avgCostPerShipment)}</p>
                  </div>
                </div>

                {/* 데이터 테이블 */}
                <div className="card overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3">기간</th>
                        <th className="text-left p-3">Shipment ID</th>
                        <th className="text-left p-3">운송장번호</th>
                        <th className="text-left p-3">운송사</th>
                        <th className="text-left p-3">국가</th>
                        <th className="text-left p-3">받는분</th>
                        <th className="text-right p-3">청구중량</th>
                        <th className="text-right p-3">운송료</th>
                        <th className="text-right p-3">총 비용</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listData.data.records.map((record: any, idx: number) => (
                        <tr key={record.id || idx} className="border-b hover:bg-gray-50">
                          <td className="p-3">{record.period}</td>
                          <td className="p-3 font-mono text-sm">{record.shipment_id}</td>
                          <td className="p-3 font-mono text-xs">{record.tracking_number}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              record.carrier === 'LOTTEGLOBAL' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {record.carrier}
                            </span>
                          </td>
                          <td className="p-3">
                            {countryFlags[record.country_code] || '🌐'} {record.zone || record.country_code}
                          </td>
                          <td className="p-3">{record.recipient}</td>
                          <td className="p-3 text-right">{record.charged_weight}kg</td>
                          <td className="p-3 text-right">{formatCurrency(parseFloat(record.shipping_fee || 0))}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(parseFloat(record.total_cost || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {listData.data.records.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      데이터가 없습니다. 정산서를 업로드해주세요.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="card text-center py-8 text-red-500">
                데이터 로드 실패
              </div>
            )}
          </div>
        )}

        {/* 국가별 분석 탭 */}
        {activeTab === 'country' && (
          <div>
            {isCountryLoading ? (
              <div className="card text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                <p>분석 중...</p>
              </div>
            ) : countryData?.success ? (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>🌍</span>
                  국가별 운송비 분석
                </h2>
                
                <div className="space-y-4">
                  {countryData.data.map((item: any) => {
                    const maxCost = Math.max(...countryData.data.map((d: any) => d.avgCost));
                    const widthPercent = (item.avgCost / maxCost) * 100;
                    
                    return (
                      <div key={item.country} className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{countryFlags[item.country] || '🌐'}</span>
                            <span className="font-medium">{item.zone || item.country}</span>
                            <span className="text-gray-500 text-sm">({item.count}건)</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{formatCurrency(item.avgCost)}</span>
                            <span className="text-gray-500 text-sm">/건</span>
                          </div>
                        </div>
                        <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                        <div className="text-right text-xs text-gray-500 mt-1">
                          총 {formatCurrency(item.totalCost)} | 평균 {item.avgWeight}kg
                        </div>
                      </div>
                    );
                  })}
                </div>

                {countryData.data.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    데이터가 없습니다.
                  </div>
                )}
              </div>
            ) : (
              <div className="card text-center py-8 text-red-500">
                분석 실패
              </div>
            )}
          </div>
        )}

        {/* 운송사별 분석 탭 */}
        {activeTab === 'carrier' && (
          <div>
            {isCarrierLoading ? (
              <div className="card text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                <p>분석 중...</p>
              </div>
            ) : carrierData?.success ? (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>🚚</span>
                  운송사별 비용 비교
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {carrierData.data.map((item: any) => (
                    <div key={item.carrier} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold">{item.carrier}</h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {item.count}건
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">총 비용</span>
                          <span className="font-bold">{formatCurrency(item.totalCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">건당 평균</span>
                          <span className="font-bold text-primary">{formatCurrency(item.avgCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">추가 운임</span>
                          <span className={item.totalSurcharge > 0 ? 'text-red-600 font-medium' : ''}>
                            {formatCurrency(item.totalSurcharge)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">추가 운임 비율</span>
                          <span className={item.surchargeRate > 0 ? 'text-red-600 font-medium' : ''}>
                            {item.surchargeRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {carrierData.data.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    데이터가 없습니다.
                  </div>
                )}
              </div>
            ) : (
              <div className="card text-center py-8 text-red-500">
                분석 실패
              </div>
            )}
          </div>
        )}

        {/* 중량 최적화 탭 */}
        {activeTab === 'weight' && (
          <div>
            {isWeightLoading ? (
              <div className="card text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                <p>분석 중...</p>
              </div>
            ) : weightData?.success ? (
              <>
                {/* 요약 통계 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="card">
                    <p className="text-sm text-gray-500">전체 건수</p>
                    <p className="text-2xl font-bold">{weightData.data.summary.totalRecords}건</p>
                  </div>
                  <div className="card bg-yellow-50">
                    <p className="text-sm text-yellow-700">부피중량 초과 건</p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {weightData.data.summary.weightIssueCount}건
                      <span className="text-sm font-normal ml-2">
                        ({weightData.data.summary.weightIssueRate}%)
                      </span>
                    </p>
                  </div>
                  <div className="card bg-green-50">
                    <p className="text-sm text-green-700">예상 절감 가능액</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(weightData.data.summary.totalPotentialSaving)}
                    </p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-gray-500">평균 부피/실중량 비율</p>
                    <p className="text-2xl font-bold">{weightData.data.summary.avgWeightRatio}배</p>
                  </div>
                </div>

                {/* 최적화 필요 건 목록 */}
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span>⚠️</span>
                    포장 최적화 필요 건
                  </h2>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3">Shipment ID</th>
                          <th className="text-left p-3">국가</th>
                          <th className="text-left p-3">디멘션</th>
                          <th className="text-right p-3">실중량</th>
                          <th className="text-right p-3">부피중량</th>
                          <th className="text-right p-3">청구중량</th>
                          <th className="text-right p-3">비율</th>
                          <th className="text-right p-3">현재비용</th>
                          <th className="text-right p-3 text-green-700">절감가능</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weightData.data.issues.map((item: any, idx: number) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-mono text-sm">{item.shipment_id}</td>
                            <td className="p-3">{countryFlags[item.country] || '🌐'} {item.country}</td>
                            <td className="p-3 font-mono text-xs">{item.dimensions}</td>
                            <td className="p-3 text-right">{item.actual_weight}kg</td>
                            <td className="p-3 text-right text-yellow-600">{item.volumetric_weight}kg</td>
                            <td className="p-3 text-right font-medium">{item.charged_weight}kg</td>
                            <td className="p-3 text-right">
                              <span className={`px-2 py-1 rounded text-xs ${
                                item.weight_ratio > 3 
                                  ? 'bg-red-100 text-red-800' 
                                  : item.weight_ratio > 2 
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.weight_ratio}배
                              </span>
                            </td>
                            <td className="p-3 text-right">{formatCurrency(item.total_cost)}</td>
                            <td className="p-3 text-right font-bold text-green-600">
                              {formatCurrency(item.potential_saving)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {weightData.data.issues.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        최적화 필요 건이 없습니다.
                      </div>
                    )}
                  </div>
                </div>

                {/* 포장 가이드 */}
                <div className="card mt-6 bg-blue-50">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                    <span>💡</span>
                    포장 최적화 가이드
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li>• <strong>부피중량</strong> = (가로 × 세로 × 높이) ÷ 6000 (국제특송 기준)</li>
                    <li>• 부피중량이 실중량보다 크면 부피중량으로 청구됩니다.</li>
                    <li>• 상품 크기에 맞는 박스 사용으로 불필요한 공간을 줄이세요.</li>
                    <li>• 여러 소형 상품은 한 박스에 합포장을 고려하세요.</li>
                    <li>• 대형 상품은 분할 배송이 더 경제적일 수 있습니다.</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="card text-center py-8 text-red-500">
                분석 실패
              </div>
            )}
          </div>
        )}

        {/* 월별 트렌드 탭 */}
        {activeTab === 'trend' && (
          <div>
            {isTrendLoading ? (
              <div className="card text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                <p>분석 중...</p>
              </div>
            ) : trendData?.success ? (
              <>
                {/* 전체 요약 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="card">
                    <p className="text-sm text-gray-500">데이터 기간</p>
                    <p className="text-2xl font-bold">{trendData.data.summary.totalPeriods}개월</p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-gray-500">총 발송 건수</p>
                    <p className="text-2xl font-bold">{trendData.data.summary.totalRecords.toLocaleString()}건</p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-gray-500">총 물류비</p>
                    <p className="text-2xl font-bold">{formatCurrency(trendData.data.summary.totalCost)}</p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-gray-500">월평균 물류비</p>
                    <p className="text-2xl font-bold">{formatCurrency(trendData.data.summary.avgMonthlyCost)}</p>
                  </div>
                </div>

                {/* 월별 트렌드 차트 (텍스트 기반) */}
                <div className="card mb-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span>📈</span>
                    월별 물류비 추이
                  </h2>
                  
                  <div className="space-y-4">
                    {trendData.data.trend.map((item: any) => {
                      const maxCost = Math.max(...trendData.data.trend.map((d: any) => d.totalCost));
                      const widthPercent = maxCost > 0 ? (item.totalCost / maxCost) * 100 : 0;
                      
                      return (
                        <div key={item.period}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium w-20">{item.period}</span>
                              <span className="text-gray-500 text-sm">({item.count}건)</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold">{formatCurrency(item.totalCost)}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                (평균 {formatCurrency(item.avgCost)}/건)
                              </span>
                            </div>
                          </div>
                          <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                              style={{ width: `${widthPercent}%` }}
                            >
                              {item.surchargeRate > 0 && (
                                <span className="text-xs text-white font-medium">
                                  +{item.surchargeRate}% 추가운임
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* 국가별 세부 정보 */}
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {item.byCountry.slice(0, 5).map((c: any) => (
                              <span key={c.country} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {countryFlags[c.country] || '🌐'} {c.country}: {c.count}건
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {trendData.data.trend.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      데이터가 없습니다.
                    </div>
                  )}
                </div>

                {/* 인사이트 */}
                {trendData.data.trend.length >= 2 && (
                  <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span>💡</span>
                      인사이트
                    </h3>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li>• 월평균 <strong>{trendData.data.summary.avgMonthlyCount.toLocaleString()}건</strong> 발송</li>
                      <li>• 월평균 물류비 <strong>{formatCurrency(trendData.data.summary.avgMonthlyCost)}</strong></li>
                      {(() => {
                        const latest = trendData.data.trend[trendData.data.trend.length - 1];
                        const previous = trendData.data.trend[trendData.data.trend.length - 2];
                        if (latest && previous) {
                          const diff = latest.totalCost - previous.totalCost;
                          const diffPercent = ((diff / previous.totalCost) * 100).toFixed(1);
                          return (
                            <li>• 최근 월({latest.period}) vs 이전 월({previous.period}): 
                              <span className={diff > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                                {' '}{diff > 0 ? '+' : ''}{formatCurrency(diff)} ({diffPercent}%)
                              </span>
                            </li>
                          );
                        }
                        return null;
                      })()}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="card text-center py-8 text-red-500">
                분석 실패
              </div>
            )}
          </div>
        )}

        {/* 요금 검증 탭 */}
        {activeTab === 'validate' && (
          <div>
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>🔍</span>
                표준 요금표 대비 검증
              </h2>
              <p className="text-gray-600 mb-4">
                업로드된 정산서를 표준 요금표와 비교하여 이상 요금을 확인합니다.
              </p>
              
              <div className="flex items-center gap-4">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">전체 기간</option>
                  {periodsData?.data?.map((p: any) => (
                    <option key={p.period} value={p.period}>
                      {p.period} ({p.count}건)
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => validateMutation.mutate(selectedPeriod || undefined)}
                  disabled={validateMutation.isPending}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {validateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      검증 중...
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      검증 실행
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 검증 결과 */}
            {validateMutation.data?.success && (
              <div className="space-y-6">
                {/* 요약 */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="card">
                    <p className="text-sm text-gray-500">총 검증</p>
                    <p className="text-2xl font-bold">{validateMutation.data.data.summary.total}건</p>
                  </div>
                  <div className="card bg-green-50">
                    <p className="text-sm text-green-700">정상</p>
                    <p className="text-2xl font-bold text-green-700">{validateMutation.data.data.summary.normal}건</p>
                  </div>
                  <div className="card bg-yellow-50">
                    <p className="text-sm text-yellow-700">경고 (5~15%)</p>
                    <p className="text-2xl font-bold text-yellow-700">{validateMutation.data.data.summary.warning}건</p>
                  </div>
                  <div className="card bg-red-50">
                    <p className="text-sm text-red-700">오류 (15%+)</p>
                    <p className="text-2xl font-bold text-red-700">{validateMutation.data.data.summary.error}건</p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-gray-500">미검증</p>
                    <p className="text-2xl font-bold text-gray-500">{validateMutation.data.data.summary.unknown}건</p>
                  </div>
                </div>

                {/* 비용 비교 */}
                <div className="card">
                  <h3 className="font-semibold mb-4">비용 비교</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">예상 총 비용</p>
                      <p className="text-xl font-bold">{formatCurrency(validateMutation.data.data.summary.totalExpectedCost)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">실제 총 비용</p>
                      <p className="text-xl font-bold">{formatCurrency(validateMutation.data.data.summary.totalActualCost)}</p>
                    </div>
                    <div className={`rounded-lg p-4 ${
                      validateMutation.data.data.summary.totalDifference > 0 ? 'bg-red-50' : 'bg-green-50'
                    }`}>
                      <p className={`text-sm ${
                        validateMutation.data.data.summary.totalDifference > 0 ? 'text-red-700' : 'text-green-700'
                      }`}>차이</p>
                      <p className={`text-xl font-bold ${
                        validateMutation.data.data.summary.totalDifference > 0 ? 'text-red-700' : 'text-green-700'
                      }`}>
                        {validateMutation.data.data.summary.totalDifference > 0 ? '+' : ''}
                        {formatCurrency(validateMutation.data.data.summary.totalDifference)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 이슈 목록 */}
                {validateMutation.data.data.issues?.length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold mb-4">이슈 건 목록 ({validateMutation.data.data.issues.length}건)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3">상태</th>
                            <th className="text-left p-3">국가</th>
                            <th className="text-left p-3">운송사</th>
                            <th className="text-right p-3">중량</th>
                            <th className="text-right p-3">예상요금</th>
                            <th className="text-right p-3">실제요금</th>
                            <th className="text-right p-3">차이</th>
                            <th className="text-left p-3">메시지</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validateMutation.data.data.issues.map((issue: any, idx: number) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  issue.status === 'error' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {issue.status === 'error' ? '오류' : '경고'}
                                </span>
                              </td>
                              <td className="p-3">{countryFlags[issue.details?.countryCode] || '🌐'} {issue.details?.country}</td>
                              <td className="p-3">{issue.details?.carrier}</td>
                              <td className="p-3 text-right">{issue.details?.weight}kg</td>
                              <td className="p-3 text-right">{issue.expectedRate ? formatCurrency(issue.expectedRate) : '-'}</td>
                              <td className="p-3 text-right">{formatCurrency(issue.actualRate)}</td>
                              <td className={`p-3 text-right font-medium ${
                                issue.difference > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {issue.difference > 0 ? '+' : ''}{formatCurrency(issue.difference)}
                                <br />
                                <span className="text-xs">({issue.differencePercent}%)</span>
                              </td>
                              <td className="p-3 text-xs text-gray-600 max-w-xs truncate">{issue.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {validateMutation.data.data.issues?.length === 0 && (
                  <div className="card bg-green-50 text-center py-8">
                    <span className="text-4xl">✅</span>
                    <p className="text-green-800 font-medium mt-4">모든 정산 건이 정상 범위입니다!</p>
                  </div>
                )}
              </div>
            )}

            {/* 안내 */}
            <div className="card mt-6 bg-gray-50">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>💡</span>
                검증 기준
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <span className="text-green-600 font-medium">정상</span>: 예상 요금 대비 ±5% 이내</li>
                <li>• <span className="text-yellow-600 font-medium">경고</span>: 예상 요금 대비 5~15% 차이</li>
                <li>• <span className="text-red-600 font-medium">오류</span>: 예상 요금 대비 15% 이상 차이</li>
                <li>• <span className="text-gray-500 font-medium">미검증</span>: 요금표에 없는 국가/운송사 조합</li>
              </ul>
              <div className="mt-4 p-3 bg-white rounded-lg">
                <p className="text-xs text-gray-500">
                  * 표준 요금표: 롯데글로벌(YAMATO, USPS, CXC, CJ Logistics, Skynet, HCT, AusPost, CanadaPost), K-Packet, EMS
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

