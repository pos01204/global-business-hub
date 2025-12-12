'use client'

import { useQuery } from '@tanstack/react-query'
import { analyticsApi, customersApi, logisticsPerformanceApi, comparisonApi, dashboardApi } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import CustomerDetailModal from '@/components/CustomerDetailModal'
import OrderDetailModal from '@/components/OrderDetailModal'
import ArtistOrdersModal from '@/components/ArtistOrdersModal'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  ArcElement,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar, Pie, Doughnut, Chart } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  ArcElement,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend
)

// 물류 처리 시간 분석 탭 컴포넌트
function LogisticsPerformanceTab({
  dateRange,
  countryFilter,
  onArtistClick,
}: {
  dateRange: string
  countryFilter: string
  onArtistClick?: (artistName: string) => void
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['logistics-performance', dateRange, countryFilter],
    queryFn: () => logisticsPerformanceApi.getData(dateRange, countryFilter),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <h2 className="text-xl font-semibold text-red-800 mb-2">오류 발생</h2>
        <p className="text-red-600">데이터를 불러오는 중 문제가 발생했습니다.</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const formatDays = (days: number | null) => {
    if (days === null) return 'N/A'
    return `${days.toFixed(1)}일`
  }

  return (
    <div className="space-y-6">
      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-muted-color mb-2">주문 → 작가 발송</h3>
          <p className="text-2xl font-bold">{formatDays(data.summary.orderToShip.avg)}</p>
          <p className="text-xs text-gray-500 mt-1">
            평균 (최소: {data.summary.orderToShip.min}일, 최대: {data.summary.orderToShip.max}일)
          </p>
          <p className="text-xs text-gray-400 mt-1">
            중앙값: {data.summary.orderToShip.median}일 | 건수: {data.summary.orderToShip.count}
          </p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-muted-color mb-2">작가 발송 → 검수</h3>
          <p className="text-2xl font-bold">{formatDays(data.summary.shipToInspection.avg)}</p>
          <p className="text-xs text-gray-500 mt-1">
            평균 (최소: {data.summary.shipToInspection.min}일, 최대: {data.summary.shipToInspection.max}일)
          </p>
          <p className="text-xs text-gray-400 mt-1">
            중앙값: {data.summary.shipToInspection.median}일 | 건수: {data.summary.shipToInspection.count}
          </p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-muted-color mb-2">검수 → 배송 시작</h3>
          <p className="text-2xl font-bold">{formatDays(data.summary.inspectionToShipment.avg)}</p>
          <p className="text-xs text-gray-500 mt-1">
            평균 (최소: {data.summary.inspectionToShipment.min}일, 최대: {data.summary.inspectionToShipment.max}일)
          </p>
          <p className="text-xs text-gray-400 mt-1">
            중앙값: {data.summary.inspectionToShipment.median}일 | 건수: {data.summary.inspectionToShipment.count}
          </p>
        </div>

        <div className="card bg-gradient-to-br from-primary/10 to-accent/10">
          <h3 className="text-sm font-medium text-muted-color mb-2">전체 처리 시간</h3>
          <p className="text-2xl font-bold text-primary">{formatDays(data.summary.total.avg)}</p>
          <p className="text-xs text-gray-500 mt-1">
            평균 (최소: {data.summary.total.min}일, 최대: {data.summary.total.max}일)
          </p>
          <p className="text-xs text-gray-400 mt-1">
            중앙값: {data.summary.total.median}일 | 건수: {data.summary.total.count}
          </p>
        </div>
      </div>

      {/* 단계별 처리 시간 비교 차트 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">⏱️ 단계별 평균 처리 시간</h2>
        <div style={{ position: 'relative', height: '300px' }}>
          <Bar
            data={{
              labels: ['주문 → 작가 발송', '작가 발송 → 검수', '검수 → 배송 시작', '전체 처리 시간'],
              datasets: [
                {
                  label: '평균 처리 시간 (일)',
                  data: [
                    data.summary.orderToShip.avg,
                    data.summary.shipToInspection.avg,
                    data.summary.inspectionToShipment.avg,
                    data.summary.total.avg,
                  ],
                  backgroundColor: [
                    'rgba(74, 111, 165, 0.6)',
                    'rgba(247, 159, 121, 0.6)',
                    'rgba(39, 174, 96, 0.6)',
                    'rgba(156, 39, 176, 0.6)',
                  ],
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const value = context.parsed.y
                      return `평균: ${value != null ? value.toFixed(1) : '0'}일`
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: '#eee' },
                  ticks: {
                    callback: function (value) {
                      return value + '일'
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* 작가별 성과 */}
      {data.artistStats && data.artistStats.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">👨‍🎨 작가별 처리 시간 성과 (Top 20)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">작가명</th>
                  <th className="text-right py-2 px-4">주문 건수</th>
                  <th className="text-right py-2 px-4">주문→발송</th>
                  <th className="text-right py-2 px-4">발송→검수</th>
                  <th className="text-right py-2 px-4">검수→배송</th>
                  <th className="text-right py-2 px-4 font-semibold">전체 시간</th>
                </tr>
              </thead>
              <tbody>
                {data.artistStats.map((artist: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">
                      {onArtistClick ? (
                        <button
                          onClick={() => onArtistClick(artist.artistName)}
                          className="text-primary hover:underline font-medium"
                        >
                          {artist.artistName}
                        </button>
                      ) : (
                        artist.artistName
                      )}
                    </td>
                    <td className="py-2 px-4 text-right">{artist.orderCount}</td>
                    <td className="py-2 px-4 text-right">{formatDays(artist.avgOrderToShip)}</td>
                    <td className="py-2 px-4 text-right">{formatDays(artist.avgShipToInspection)}</td>
                    <td className="py-2 px-4 text-right">{formatDays(artist.avgInspectionToShipment)}</td>
                    <td className="py-2 px-4 text-right font-semibold text-primary">
                      {formatDays(artist.avgTotalTime)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 국가별 성과 */}
      {data.countryStats && data.countryStats.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">🌍 국가별 평균 처리 시간</h2>
          <div style={{ position: 'relative', height: '300px' }}>
            <Bar
              data={{
                labels: data.countryStats.map((c: any) => c.country),
                datasets: [
                  {
                    label: '평균 처리 시간 (일)',
                    data: data.countryStats.map((c: any) => c.avgTotalTime),
                    backgroundColor: 'rgba(74, 111, 165, 0.6)',
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const value = context.parsed.y
                        return `평균: ${value != null ? value.toFixed(1) : '0'}일`
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: '#eee' },
                    ticks: {
                      callback: function (value) {
                        return value + '일'
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* 처리 시간 분포 */}
      {data.dailyDistribution && Object.keys(data.dailyDistribution).length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">📊 처리 시간 분포</h2>
          <div style={{ position: 'relative', height: '300px' }}>
            <Bar
              data={{
                labels: Object.keys(data.dailyDistribution).sort((a, b) => {
                  const aDays = parseInt(a.replace('일', ''))
                  const bDays = parseInt(b.replace('일', ''))
                  return aDays - bDays
                }),
                datasets: [
                  {
                    label: '주문 건수',
                    data: Object.keys(data.dailyDistribution)
                      .sort((a, b) => {
                        const aDays = parseInt(a.replace('일', ''))
                        const bDays = parseInt(b.replace('일', ''))
                        return aDays - bDays
                      })
                      .map((key) => data.dailyDistribution[key]),
                    backgroundColor: 'rgba(247, 159, 121, 0.6)',
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const value = context.parsed.y
                              if (value === null || value === undefined) return '0건'
                              return `${value}건`
                            },
                          },
                        },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: '#eee' },
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// 비교 분석 탭 컴포넌트
function ComparisonTab({
  dateRange,
  countryFilter,
  onArtistClick,
}: {
  dateRange: string
  countryFilter: string
  onArtistClick?: (artistName: string) => void
}) {
  const [comparisonType, setComparisonType] = useState<'period' | 'artist' | 'country'>('period')
  const [periods, setPeriods] = useState(3)
  const [selectedArtists, setSelectedArtists] = useState<string[]>([])
  const [artistInput, setArtistInput] = useState('')
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['JP', 'US'])
  const [countryInput, setCountryInput] = useState('JP,US')

  // 기간 비교 데이터
  const { data: periodData, isLoading: periodLoading } = useQuery({
    queryKey: ['comparison', 'period', periods, dateRange, countryFilter],
    queryFn: () => comparisonApi.comparePeriods(periods, dateRange, countryFilter),
    enabled: comparisonType === 'period',
  })

  // 작가 비교 데이터
  const { data: artistData, isLoading: artistLoading } = useQuery({
    queryKey: ['comparison', 'artist', selectedArtists.join(','), dateRange, countryFilter],
    queryFn: () => comparisonApi.compareArtists(selectedArtists, dateRange, countryFilter),
    enabled: comparisonType === 'artist' && selectedArtists.length > 0,
  })

  // 국가 비교 데이터
  const { data: countryData, isLoading: countryLoading } = useQuery({
    queryKey: ['comparison', 'country', selectedCountries.join(','), dateRange],
    queryFn: () => comparisonApi.compareCountries(selectedCountries, dateRange),
    enabled: comparisonType === 'country' && selectedCountries.length > 0,
  })

  const isLoading = periodLoading || artistLoading || countryLoading
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '₩0'
    }
    return `₩${Math.round(value).toLocaleString()}`
  }

  // 날짜 포맷팅 함수
  const formatDateRange = (startDate: string, endDate: string): string => {
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const startFormatted = `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일`
      const endFormatted = `${end.getFullYear()}년 ${end.getMonth() + 1}월 ${end.getDate()}일`
      
      // 같은 달이면 간단하게 표시
      if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
        if (start.getDate() === end.getDate()) {
          return startFormatted
        }
        return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getDate()}일`
      }
      
      return `${startFormatted} ~ ${endFormatted}`
    } catch (e) {
      return `${startDate} ~ ${endDate}`
    }
  }

  // 기간 라벨 생성 함수
  const getPeriodLabel = (period: any, index: number, total: number): string => {
    if (period.period === '현재 기간') {
      return `현재 기간 (${formatDateRange(period.startDate, period.endDate)})`
    } else if (period.period === '이전 기간') {
      return `이전 기간 (${formatDateRange(period.startDate, period.endDate)})`
    } else {
      // "N기간 전" 형식인 경우
      const periodNum = total - index
      return `${periodNum}기간 전 (${formatDateRange(period.startDate, period.endDate)})`
    }
  }

  const handleAddArtist = () => {
    if (artistInput.trim() && !selectedArtists.includes(artistInput.trim())) {
      setSelectedArtists([...selectedArtists, artistInput.trim()])
      setArtistInput('')
    }
  }

  const handleRemoveArtist = (artist: string) => {
    setSelectedArtists(selectedArtists.filter((a) => a !== artist))
  }

  const handleUpdateCountries = () => {
    const countries = countryInput
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length > 0)
    setSelectedCountries(countries)
  }

  return (
    <div className="space-y-6">
      {/* 비교 유형 선택 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">📊 비교 분석</h2>
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setComparisonType('period')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              comparisonType === 'period'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            기간 비교
          </button>
          <button
            onClick={() => setComparisonType('artist')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              comparisonType === 'artist'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            작가 비교
          </button>
          <button
            onClick={() => setComparisonType('country')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              comparisonType === 'country'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            국가 비교
          </button>
        </div>

        {/* 기간 비교 설정 */}
        {comparisonType === 'period' && (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium flex items-center gap-2">
                <span>📅</span>
                <span>비교 기간 수:</span>
              </label>
              <select
                value={periods}
                onChange={(e) => setPeriods(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              >
                <option value="2">2개 기간</option>
                <option value="3">3개 기간</option>
                <option value="4">4개 기간</option>
                <option value="6">6개 기간</option>
              </select>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">💡 안내:</span> 각 기간은 선택한 기간 길이(예: 30일)로 나뉩니다. 
                현재 기간은 가장 최근 기간이며, 숫자가 클수록 더 이전 기간을 의미합니다.
              </p>
            </div>
          </div>
        )}

        {/* 작가 비교 설정 */}
        {comparisonType === 'artist' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={artistInput}
                onChange={(e) => setArtistInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddArtist()}
                placeholder="작가명 입력 후 Enter"
                className="flex-1 border border-gray-300 rounded px-3 py-2"
              />
              <button
                onClick={handleAddArtist}
                className="btn btn-primary px-4"
              >
                추가
              </button>
            </div>
            {selectedArtists.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedArtists.map((artist) => (
                  <span
                    key={artist}
                    className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                  >
                    {artist}
                    <button
                      onClick={() => handleRemoveArtist(artist)}
                      className="hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 국가 비교 설정 */}
        {comparisonType === 'country' && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <span className="font-semibold">💡 안내:</span> 비교하고 싶은 국가 코드를 쉼표로 구분하여 입력하세요. 
                예: JP,US,KR (일본, 미국, 한국)
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value)}
                placeholder="국가 코드 입력 (쉼표 구분, 예: JP,US,KR)"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
              <button
                onClick={handleUpdateCountries}
                className="btn btn-primary px-6"
              >
                적용
              </button>
            </div>
            {selectedCountries.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">선택된 국가 ({selectedCountries.length}개):</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCountries.map((country) => (
                    <span
                      key={country}
                      className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm"
                    >
                      <span>🌍</span>
                      <span>{country}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>데이터를 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 기간 비교 결과 */}
      {comparisonType === 'period' && periodData && (
        <div className="space-y-6">
          {/* 안내 문구 */}
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">기간 비교 안내</h3>
                <p className="text-sm text-blue-700">
                  각 기간은 선택한 기간 길이(예: 30일)로 나뉘어 비교됩니다. 
                  현재 기간은 가장 최근 기간이며, 숫자가 클수록 더 이전 기간을 의미합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">📅 기간별 성과 비교</h3>
              <div className="text-sm text-gray-500">
                기간 길이: {dateRange === '7d' ? '7일' : dateRange === '30d' ? '30일' : dateRange === '90d' ? '90일' : '365일'}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold">기간</th>
                    <th className="text-right py-3 px-4 font-semibold">매출 (GMV)</th>
                    <th className="text-right py-3 px-4 font-semibold">객단가 (AOV)</th>
                    <th className="text-right py-3 px-4 font-semibold">주문 건수</th>
                    <th className="text-right py-3 px-4 font-semibold">판매 작품 수</th>
                  </tr>
                </thead>
                <tbody>
                  {periodData.periods.map((period: any, index: number) => {
                    const isCurrentPeriod = index === periodData.periods.length - 1
                    const isPreviousPeriod = index === periodData.periods.length - 2
                    const periodNum = periodData.periods.length - index
                    
                    return (
                      <tr
                        key={index}
                        className={`border-b transition-colors ${
                          isCurrentPeriod
                            ? 'bg-primary/5 font-semibold hover:bg-primary/10' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {isCurrentPeriod ? '✅ 현재 기간' : 
                               isPreviousPeriod ? '이전 기간' :
                               `${periodNum}기간 전`}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              {formatDateRange(period.startDate, period.endDate)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold">{formatCurrency(period.kpis.gmv)}</span>
                            {index > 0 && (
                              <span className={`text-xs mt-1 ${
                                period.kpis.gmv > periodData.periods[index - 1].kpis.gmv 
                                  ? 'text-green-600' 
                                  : period.kpis.gmv < periodData.periods[index - 1].kpis.gmv
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                              }`}>
                                {period.kpis.gmv > periodData.periods[index - 1].kpis.gmv ? '↑' : 
                                 period.kpis.gmv < periodData.periods[index - 1].kpis.gmv ? '↓' : '→'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold">{formatCurrency(period.kpis.aov)}</span>
                            {index > 0 && (
                              <span className={`text-xs mt-1 ${
                                period.kpis.aov > periodData.periods[index - 1].kpis.aov 
                                  ? 'text-green-600' 
                                  : period.kpis.aov < periodData.periods[index - 1].kpis.aov
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                              }`}>
                                {period.kpis.aov > periodData.periods[index - 1].kpis.aov ? '↑' : 
                                 period.kpis.aov < periodData.periods[index - 1].kpis.aov ? '↓' : '→'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold">{period.kpis.orderCount.toLocaleString()}</span>
                            {index > 0 && (
                              <span className={`text-xs mt-1 ${
                                period.kpis.orderCount > periodData.periods[index - 1].kpis.orderCount 
                                  ? 'text-green-600' 
                                  : period.kpis.orderCount < periodData.periods[index - 1].kpis.orderCount
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                              }`}>
                                {period.kpis.orderCount > periodData.periods[index - 1].kpis.orderCount ? '↑' : 
                                 period.kpis.orderCount < periodData.periods[index - 1].kpis.orderCount ? '↓' : '→'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold">{period.kpis.itemCount.toLocaleString()}</span>
                            {index > 0 && (
                              <span className={`text-xs mt-1 ${
                                period.kpis.itemCount > periodData.periods[index - 1].kpis.itemCount 
                                  ? 'text-green-600' 
                                  : period.kpis.itemCount < periodData.periods[index - 1].kpis.itemCount
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                              }`}>
                                {period.kpis.itemCount > periodData.periods[index - 1].kpis.itemCount ? '↑' : 
                                 period.kpis.itemCount < periodData.periods[index - 1].kpis.itemCount ? '↓' : '→'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 변화율 차트 */}
          {periodData.changes && periodData.changes.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">📈 변화율 비교</h3>
              <div style={{ position: 'relative', height: '300px' }}>
                <Bar
                  data={{
                    labels: periodData.changes[0].changes.map((c: any) => c.period),
                    datasets: periodData.changes.map((change: any) => ({
                      label:
                        change.metric === 'gmv'
                          ? '매출'
                          : change.metric === 'aov'
                            ? '객단가'
                            : change.metric === 'orderCount'
                              ? '주문 건수'
                              : '판매 작품 수',
                      data: change.changes.map((c: any) => c.change),
                      backgroundColor:
                        change.metric === 'gmv'
                          ? 'rgba(74, 111, 165, 0.6)'
                          : change.metric === 'aov'
                            ? 'rgba(247, 159, 121, 0.6)'
                            : change.metric === 'orderCount'
                              ? 'rgba(39, 174, 96, 0.6)'
                              : 'rgba(156, 39, 176, 0.6)',
                    })),
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const value = context.parsed.y
                            if (value === null || value === undefined) return `${context.dataset.label}: 0%`
                            return `${context.dataset.label}: ${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        grid: { color: '#eee' },
                        ticks: {
                          callback: function (value) {
                            const num = typeof value === 'number' ? value : 0
                            return num + '%'
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 작가 비교 결과 */}
      {comparisonType === 'artist' && artistData && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">👨‍🎨 작가별 성과 비교</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">작가명</th>
                    <th className="text-right py-2 px-4">매출 (GMV)</th>
                    <th className="text-right py-2 px-4">객단가 (AOV)</th>
                    <th className="text-right py-2 px-4">주문 건수</th>
                    <th className="text-right py-2 px-4">판매 작품 수</th>
                    <th className="text-right py-2 px-4">작품 종류</th>
                  </tr>
                </thead>
                <tbody>
                  {artistData.artists.map((artist: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">
                        {onArtistClick ? (
                          <button
                            onClick={() => onArtistClick(artist.artistName)}
                            className="text-primary hover:underline font-medium"
                          >
                            {artist.artistName}
                          </button>
                        ) : (
                          <span className="font-medium">{artist.artistName}</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-right">{formatCurrency(artist.gmv)}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(artist.aov)}</td>
                      <td className="py-2 px-4 text-right">{artist.orderCount}</td>
                      <td className="py-2 px-4 text-right">{artist.itemCount}</td>
                      <td className="py-2 px-4 text-right">{artist.productCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 작가별 비교 차트 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">매출 비교</h3>
              <div style={{ position: 'relative', height: '250px' }}>
                <Bar
                  data={{
                    labels: artistData.artists.map((a: any) => a.artistName),
                    datasets: [
                      {
                        label: '매출 (KRW)',
                        data: artistData.artists.map((a: any) => a.gmv),
                        backgroundColor: 'rgba(74, 111, 165, 0.6)',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const value = context.parsed.y
                            if (value === null || value === undefined) return '매출: ₩0'
                            return `매출: ${formatCurrency(value)}`
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: '#eee' },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">주문 건수 비교</h3>
              <div style={{ position: 'relative', height: '250px' }}>
                <Bar
                  data={{
                    labels: artistData.artists.map((a: any) => a.artistName),
                    datasets: [
                      {
                        label: '주문 건수',
                        data: artistData.artists.map((a: any) => a.orderCount),
                        backgroundColor: 'rgba(247, 159, 121, 0.6)',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const value = context.parsed.y
                            if (value === null || value === undefined) return '주문 건수: 0건'
                            return `주문 건수: ${value}건`
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: '#eee' },
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 국가 비교 결과 */}
      {comparisonType === 'country' && countryData && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">🌍 국가별 성과 비교</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">국가</th>
                    <th className="text-right py-2 px-4">매출 (GMV)</th>
                    <th className="text-right py-2 px-4">객단가 (AOV)</th>
                    <th className="text-right py-2 px-4">주문 건수</th>
                    <th className="text-right py-2 px-4">판매 작품 수</th>
                    <th className="text-right py-2 px-4">고객 수</th>
                  </tr>
                </thead>
                <tbody>
                  {countryData.countries.map((country: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 font-medium">{country.country}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(country.gmv)}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(country.aov)}</td>
                      <td className="py-2 px-4 text-right">{country.orderCount}</td>
                      <td className="py-2 px-4 text-right">{country.itemCount}</td>
                      <td className="py-2 px-4 text-right">{country.customerCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 국가별 비교 차트 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">매출 비교</h3>
              <div style={{ position: 'relative', height: '250px' }}>
                <Bar
                  data={{
                    labels: countryData.countries.map((c: any) => c.country),
                    datasets: [
                      {
                        label: '매출 (KRW)',
                        data: countryData.countries.map((c: any) => c.gmv),
                        backgroundColor: 'rgba(74, 111, 165, 0.6)',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const value = context.parsed.y
                            if (value === null || value === undefined) return '매출: ₩0'
                            return `매출: ${formatCurrency(value)}`
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: '#eee' },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">고객 수 비교</h3>
              <div style={{ position: 'relative', height: '250px' }}>
                <Bar
                  data={{
                    labels: countryData.countries.map((c: any) => c.country),
                    datasets: [
                      {
                        label: '고객 수',
                        data: countryData.countries.map((c: any) => c.customerCount),
                        backgroundColor: 'rgba(39, 174, 96, 0.6)',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const value = context.parsed.y
                            if (value === null || value === undefined) return '고객 수: 0명'
                            return `고객 수: ${value}명`
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: '#eee' },
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


export default function AnalyticsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  
  const [dateRange, setDateRange] = useState('30d')
  const [countryFilter, setCountryFilter] = useState('all')
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'overview') // 기본 탭을 종합 성과로 변경

  // URL 쿼리 파라미터 변경 시 탭 업데이트
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    router.push(`/analytics?tab=${newTab}`, { scroll: false })
  }

  // Business Brain으로 네비게이션하는 함수
  const onNavigateToBusinessBrain = (params: Record<string, string>) => {
    const queryParams = new URLSearchParams(params)
    router.push(`/business-brain?${queryParams.toString()}`)
  }

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false)
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null)
  const [isArtistOrdersModalOpen, setIsArtistOrdersModalOpen] = useState(false)
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null)

  const openOrderDetailModal = (orderCode: string) => {
    setSelectedOrderCode(orderCode)
    setIsOrderDetailModalOpen(true)
  }

  const closeOrderDetailModal = () => {
    setIsOrderDetailModalOpen(false)
    setSelectedOrderCode(null)
  }

  const openCustomerDetailModal = (userId: string) => {
    setSelectedCustomerId(userId)
  }

  const closeCustomerDetailModal = () => {
    setSelectedCustomerId(null)
  }

  const openArtistOrdersModal = (artistName: string) => {
    setSelectedArtistName(artistName)
    setIsArtistOrdersModalOpen(true)
  }

  const closeArtistOrdersModal = () => {
    setIsArtistOrdersModalOpen(false)
    setSelectedArtistName(null)
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', dateRange, countryFilter],
    queryFn: () => analyticsApi.getData(dateRange, countryFilter),
  })

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '₩0'
    }
    return `₩${Math.round(value).toLocaleString()}`
  }

  const formatChange = (change: number) => {
    if (change === Infinity) return 'New'
    if (isNaN(change) || !isFinite(change)) return '-'
    const sign = change >= 0 ? '+' : ''
    return `${sign}${(change * 100).toFixed(1)}%`
  }

  const handleDownloadCSV = async (status: string) => {
    try {
      const blob = await customersApi.exportByStatus(status, countryFilter)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customers_${status}_${countryFilter}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('CSV 다운로드 오류:', error)
      alert('CSV 다운로드 중 오류가 발생했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card bg-red-50 border-red-200">
          <h2 className="text-xl font-semibold text-red-800 mb-2">오류 발생</h2>
          <p className="text-red-600">데이터를 불러오는 중 문제가 발생했습니다.</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 - idus 브랜드 스타일 */}
      <div className="relative bg-gradient-to-r from-idus-500 to-idus-600 rounded-2xl p-6 mb-6 overflow-hidden shadow-orange">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">📈</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">성과 분석</h1>
            <p className="text-idus-100 text-sm font-medium">상세한 성과 분석 및 리포트를 확인하세요</p>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🔍</span>
          <h2 className="text-lg font-semibold">분석 조건 설정</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <span>📅</span>
              <span>기간</span>
              <span className="text-xs text-gray-500 font-normal">(분석할 기간을 선택하세요)</span>
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
              <option value="90d">최근 90일</option>
              <option value="365d">최근 365일</option>
            </select>
            <p className="text-xs text-gray-500 mt-1.5">
              {dateRange === '7d' && '지난 7일간의 데이터를 분석합니다'}
              {dateRange === '30d' && '지난 30일간의 데이터를 분석합니다'}
              {dateRange === '90d' && '지난 90일간의 데이터를 분석합니다'}
              {dateRange === '365d' && '지난 1년간의 데이터를 분석합니다'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <span>🌍</span>
              <span>국가</span>
              <span className="text-xs text-gray-500 font-normal">(분석할 국가를 선택하세요)</span>
            </label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              <option value="all">전체 국가</option>
              <option value="jp">일본</option>
              <option value="non_jp">일본 외</option>
            </select>
            <p className="text-xs text-gray-500 mt-1.5">
              {countryFilter === 'all' && '모든 국가의 데이터를 포함합니다'}
              {countryFilter === 'jp' && '일본 고객의 데이터만 분석합니다'}
              {countryFilter === 'non_jp' && '일본을 제외한 모든 국가의 데이터를 분석합니다'}
            </p>
          </div>
        </div>
      </div>

      {/* 탭 - P2: 카테고리별 그룹화 */}
      <div className="mb-6">
        {/* 탭 그룹 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 lg:p-6">
          <div className="space-y-4">
            {[
              {
                name: '성과 분석',
                description: '매출, 고객, 작가 성과 분석',
                tabs: [
                  { id: 'overview', label: '종합 성과', icon: '📈' },
                  { id: 'customer', label: '고객 확보', icon: '👥' },
                  { id: 'channel', label: '채널 분석', icon: '📱' },
                  ...(countryFilter === 'all' ? [{ id: 'regional', label: '지역 분석', icon: '🌍' }] : []),
                ]
              },
              {
                name: '물류 운영',
                description: '물류 처리 시간 및 파이프라인',
                tabs: [
                  { id: 'logistics-performance', label: '물류 처리 시간', icon: '📦' },
                ]
              },
              {
                name: '비교 분석',
                description: '기간, 작가, 국가 비교',
                tabs: [
                  { id: 'comparison', label: '비교 분석', icon: '⚖️' },
                ]
              },
            ].map((group, groupIdx) => (
              <div key={group.name}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {group.name}
                  </h3>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {group.description}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`group relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-[#F78C3A] to-[#E67729] text-white shadow-md shadow-orange-500/25 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-102'
                      }`}
                    >
                      <span className="text-base">{tab.icon}</span>
                      <span>{tab.label}</span>
                      {activeTab === tab.id && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 탭별 콘텐츠 */}
      {activeTab === 'overview' && data && (
        <div className="space-y-6">
          {/* 매출 성과 KPI */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">📈 매출 성과</h2>
            {/* P2: Business Brain 연계 버튼 */}
            <button
              onClick={() => router.push('/business-brain?tab=trends&period=30d')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm"
            >
              <span>📊</span>
              <span>이 성과의 원인 분석하기</span>
              <span>→</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <h3 className="text-sm font-medium text-muted-color mb-2">Total GMV</h3>
              <p className="text-2xl font-bold">{formatCurrency(data.kpis.totalSales.value)}</p>
              <p
                className={`text-sm mt-2 ${
                  data.kpis.totalSales.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatChange(data.kpis.totalSales.change)} vs 이전 기간
              </p>
            </div>

            <div className="card">
              <h3 className="text-sm font-medium text-muted-color mb-2">객단가 (AOV)</h3>
              <p className="text-2xl font-bold">{formatCurrency(data.kpis.aov.value)}</p>
              <p
                className={`text-sm mt-2 ${
                  data.kpis.aov.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatChange(data.kpis.aov.change)} vs 이전 기간
              </p>
            </div>

            <div className="card">
              <h3 className="text-sm font-medium text-muted-color mb-2">주문 건수</h3>
              <p className="text-2xl font-bold">{data.kpis.orderCount.value.toLocaleString()}</p>
              <p
                className={`text-sm mt-2 ${
                  data.kpis.orderCount.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatChange(data.kpis.orderCount.change)} vs 이전 기간
              </p>
            </div>
          </div>

          {/* 활동 상태 요약 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              🏃 고객 활동 상태 요약 (전체 구매 고객 기준)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div
                className="card cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleDownloadCSV('Active')}
              >
                <h3 className="text-sm font-medium text-muted-color mb-2">활성 고객 (Active)</h3>
                <p className="text-2xl font-bold text-green-600">
                  {data.activitySummary?.active?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-muted-color mt-2">(최근 90일 내 구매)</p>
                <p className="text-xs text-primary mt-2">클릭하여 CSV 다운로드</p>
              </div>
              <div
                className="card cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleDownloadCSV('Inactive')}
              >
                <h3 className="text-sm font-medium text-muted-color mb-2">비활성 고객 (Inactive)</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {data.activitySummary?.inactive?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-muted-color mt-2">(91일 ~ 180일 내 구매)</p>
                <p className="text-xs text-primary mt-2">클릭하여 CSV 다운로드</p>
              </div>
              <div
                className="card cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleDownloadCSV('Churn Risk')}
              >
                <h3 className="text-sm font-medium text-muted-color mb-2">이탈 위험 고객 (Churn Risk)</h3>
                <p className="text-2xl font-bold text-red-600">
                  {data.activitySummary?.churnRisk?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-muted-color mt-2">(181일 이상 미구매)</p>
                <p className="text-xs text-primary mt-2">클릭하여 CSV 다운로드</p>
              </div>
            </div>
          </div>

          {/* Top 상품 */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Top 10 상품 (매출 기준)</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">순위</th>
                    <th className="text-left py-2 px-4">상품명</th>
                    <th className="text-right py-2 px-4">매출</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rankings.topProductsBySales.map((product: any[], index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{index + 1}</td>
                      <td className="py-2 px-4">
                        <a
                          href={product[2]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {product[0]}
                        </a>
                      </td>
                      <td className="py-2 px-4 text-right">{formatCurrency(product[1])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 작가 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Top 10 작가 (매출 기준)</h2>
              {/* P2: Business Brain 연계 버튼 */}
              <button
                onClick={() => router.push('/business-brain?tab=artist-health&period=30d')}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm"
              >
                <span>🎨</span>
                <span>작가 성과 분석</span>
                <span>→</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">순위</th>
                    <th className="text-left py-2 px-4">작가명</th>
                    <th className="text-right py-2 px-4">매출</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rankings.topArtistsBySales.map((artist: any[], index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{index + 1}</td>
                      <td className="py-2 px-4">
                        <button
                          onClick={() => openArtistOrdersModal(artist[0])}
                          className="text-primary hover:underline"
                        >
                          {artist[0]}
                        </button>
                      </td>
                      <td className="py-2 px-4 text-right">{formatCurrency(artist[1])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        )}

      {activeTab === 'customer' && data && (
          <div className="space-y-6">
            {/* 고객 생애주기 분석 차트 */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">🔄 고객 생애주기 분석 (전체 사용자 기준)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-center font-medium text-gray-600 mb-4">
                    고객 분포 현황 (Count)
                  </h3>
                  <div style={{ position: 'relative', height: '300px' }}>
                    {data.lifecycle?.distribution && (
                      <Doughnut
                        data={data.lifecycle.distribution}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom' as const,
                            },
                          },
                        }}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-center font-medium text-gray-600 mb-4">
                    단계별 매출 기여도 (Pay GMV)
                  </h3>
                  <div style={{ position: 'relative', height: '300px' }}>
                    {data.lifecycle?.revenue && (
                      <Doughnut
                        data={data.lifecycle.revenue}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom' as const,
                            },
                            tooltip: {
                              callbacks: {
                                label: function (context) {
                                  let label = context.label || ''
                                  if (label) {
                                    label += ': '
                                  }
                                  if (context.parsed !== null) {
                                    label += `₩${context.parsed.toLocaleString()}`
                                  }
                                  return label
                                },
                              },
                            },
                          },
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 사용자 확보 분석 */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">🚀 사용자 확보 분석</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="card">
                  <h3 className="text-sm font-medium text-muted-color mb-2">총 신규 가입자</h3>
                  <p className="text-2xl font-bold">
                    {data.acquisition?.kpis?.totalNewUsers?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-muted-color mt-2">선택 기간 내</p>
                </div>
                <div className="card">
                  <h3 className="text-sm font-medium text-muted-color mb-2">첫 구매 전환 수</h3>
                  <p className="text-2xl font-bold">
                    {data.acquisition?.kpis?.totalFtps?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-muted-color mt-2">신규 가입자 중</p>
                </div>
                <div className="card">
                  <h3 className="text-sm font-medium text-muted-color mb-2">첫 구매 전환율 (CVR)</h3>
                  <p className="text-2xl font-bold">
                    {data.acquisition?.kpis?.cvr
                      ? `${(data.acquisition.kpis.cvr * 100).toFixed(1)}%`
                      : '0.0%'}
                  </p>
                  <p className="text-sm text-muted-color mt-2">신규 가입자 중</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-center font-medium text-gray-600 mb-4">
                    월별 신규 가입자 및 전환율 추세
                  </h3>
                  <div style={{ position: 'relative', height: '300px' }}>
                    {data.acquisition?.trend && (
                      <Chart
                        type="bar"
                        data={data.acquisition.trend}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: {
                            mode: 'index' as const,
                            intersect: false,
                          },
                          plugins: {
                            legend: {
                              position: 'bottom' as const,
                            },
                            tooltip: {
                              callbacks: {
                                label: function (context) {
                                  let label = context.dataset.label || ''
                                  if (label) {
                                    label += ': '
                                  }
                                  if (context.parsed.y !== null) {
                                    if (context.dataset.yAxisID === 'yCvr') {
                                      label += `${(context.parsed.y * 100).toFixed(1)}%`
                                    } else {
                                      label += `${context.parsed.y}명`
                                    }
                                  }
                                  return label
                                },
                              },
                            },
                          },
                          scales: {
                            x: {
                              grid: { display: false },
                            },
                            ySignups: {
                              type: 'linear' as const,
                              position: 'left' as const,
                              grid: { color: '#eee' },
                              ticks: {
                                stepSize: 10,
                                precision: 0,
                              },
                              title: {
                                display: true,
                                text: '신규 가입자 수',
                              },
                              beginAtZero: true,
                            },
                            yCvr: {
                              type: 'linear' as const,
                              position: 'right' as const,
                              grid: { drawOnChartArea: false },
                              ticks: {
                                callback: function (value) {
                                  return `${(Number(value) * 100).toFixed(1)}%`
                                },
                              },
                              title: {
                                display: true,
                                text: '전환율',
                              },
                              beginAtZero: true,
                            },
                          },
                        }}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-center font-medium text-gray-600 mb-4">
                    기간 내 신규 가입자 국가 분포
                  </h3>
                  <div style={{ position: 'relative', height: '300px' }}>
                    {data.acquisition?.countries && (
                      <Bar
                        data={data.acquisition.countries}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                          },
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RFM 분석 테이블 */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">👑 핵심 고객 (VIP)</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">사용자 ID</th>
                      <th className="text-left py-2 px-4">이름</th>
                      <th className="text-left py-2 px-4">국가</th>
                      <th className="text-right py-2 px-4">R (일)</th>
                      <th className="text-right py-2 px-4">F</th>
                      <th className="text-right py-2 px-4">M (₩)</th>
                      <th className="text-right py-2 px-4">작가 수</th>
                      <th className="text-left py-2 px-4">최근 주문일</th>
                    </tr>
                  </thead>
                  <tbody>
                            {data.rfm?.topVips?.map((customer: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">
                          <button
                            onClick={() => setSelectedCustomerId(String(customer.userId))}
                            className="text-primary hover:underline"
                          >
                            {customer.userId}
                          </button>
                        </td>
                        <td className="py-2 px-4">{customer.name}</td>
                        <td className="py-2 px-4">{customer.country}</td>
                        <td className="py-2 px-4 text-right">
                          {customer.R === Infinity ? 'N/A' : customer.R}
                        </td>
                        <td className="py-2 px-4 text-right">{customer.F}</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(customer.M)}</td>
                        <td className="py-2 px-4 text-right">{customer.artistCount}</td>
                        <td className="py-2 px-4">{customer.lastOrderDate}</td>
                      </tr>
                    ))}
                    {(!data.rfm?.topVips || data.rfm.topVips.length === 0) && (
                      <tr>
                        <td colSpan={8} className="py-4 text-center text-muted-color">
                          데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">🚀 잠재적 충성 고객</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">사용자 ID</th>
                      <th className="text-left py-2 px-4">이름</th>
                      <th className="text-left py-2 px-4">국가</th>
                      <th className="text-right py-2 px-4">R (일)</th>
                      <th className="text-right py-2 px-4">F</th>
                      <th className="text-right py-2 px-4">M (₩)</th>
                      <th className="text-right py-2 px-4">작가 수</th>
                      <th className="text-left py-2 px-4">최근 주문일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rfm?.topPotentials?.map((customer: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">
                          <button
                            onClick={() => setSelectedCustomerId(String(customer.userId))}
                            className="text-primary hover:underline"
                          >
                            {customer.userId}
                          </button>
                        </td>
                        <td className="py-2 px-4">{customer.name}</td>
                        <td className="py-2 px-4">{customer.country}</td>
                        <td className="py-2 px-4 text-right">
                          {customer.R === Infinity ? 'N/A' : customer.R}
                        </td>
                        <td className="py-2 px-4 text-right">{customer.F}</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(customer.M)}</td>
                        <td className="py-2 px-4 text-right">{customer.artistCount}</td>
                        <td className="py-2 px-4">{customer.lastOrderDate}</td>
                      </tr>
                    ))}
                    {(!data.rfm?.topPotentials || data.rfm.topPotentials.length === 0) && (
                      <tr>
                        <td colSpan={8} className="py-4 text-center text-muted-color">
                          데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">🏃‍♂️ 신규 고객 (High-Value)</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">사용자 ID</th>
                      <th className="text-left py-2 px-4">이름</th>
                      <th className="text-left py-2 px-4">국가</th>
                      <th className="text-right py-2 px-4">R (일)</th>
                      <th className="text-right py-2 px-4">F</th>
                      <th className="text-right py-2 px-4">M (₩)</th>
                      <th className="text-right py-2 px-4">첫 주문 금액</th>
                      <th className="text-left py-2 px-4">첫 주문일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rfm?.topNewCustomers?.map((customer: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">
                          <button
                            onClick={() => setSelectedCustomerId(String(customer.userId))}
                            className="text-primary hover:underline"
                          >
                            {customer.userId}
                          </button>
                        </td>
                        <td className="py-2 px-4">{customer.name}</td>
                        <td className="py-2 px-4">{customer.country}</td>
                        <td className="py-2 px-4 text-right">
                          {customer.R === Infinity ? 'N/A' : customer.R}
                        </td>
                        <td className="py-2 px-4 text-right">{customer.F}</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(customer.M)}</td>
                        <td className="py-2 px-4 text-right">
                          {formatCurrency(customer.firstOrderAmount)}
                        </td>
                        <td className="py-2 px-4">{customer.firstOrderDate}</td>
                      </tr>
                    ))}
                    {(!data.rfm?.topNewCustomers || data.rfm.topNewCustomers.length === 0) && (
                      <tr>
                        <td colSpan={8} className="py-4 text-center text-muted-color">
                          데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 고객 분석 페이지 안내 */}
            <div className="card bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">👥</span>
                  <div>
                    <h3 className="font-semibold text-slate-800">더 상세한 고객 분석이 필요하신가요?</h3>
                    <p className="text-sm text-slate-600">RFM 세그먼트, 이탈 위험, 코호트, LTV 분석을 확인하세요</p>
                  </div>
                </div>
                <a
                  href="/customer-analytics"
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
                >
                  고객 분석 바로가기 →
                </a>
              </div>
            </div>
          </div>
        )}

      {activeTab === 'channel' && data && (
          <div className="space-y-6">
            {/* 채널별 상세 통계 */}
            {data.channelAnalysis && data.channelAnalysis.stats && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">📊 채널별 상세 성과</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">플랫폼</th>
                        <th className="text-right py-2 px-4">매출 (GMV)</th>
                        <th className="text-right py-2 px-4">객단가 (AOV)</th>
                        <th className="text-right py-2 px-4">주문 건수</th>
                        <th className="text-right py-2 px-4">고객 수</th>
                        <th className="text-right py-2 px-4">점유율</th>
                        <th className="text-right py-2 px-4">매출 변화율</th>
                        <th className="text-right py-2 px-4">주문 변화율</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.channelAnalysis.stats.map((channel: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 font-medium">{channel.platform}</td>
                          <td className="py-2 px-4 text-right">{formatCurrency(channel.revenue)}</td>
                          <td className="py-2 px-4 text-right">{formatCurrency(channel.aov)}</td>
                          <td className="py-2 px-4 text-right">{channel.orderCount.toLocaleString()}</td>
                          <td className="py-2 px-4 text-right">{channel.customerCount.toLocaleString()}</td>
                          <td className="py-2 px-4 text-right">{channel.share.toFixed(1)}%</td>
                          <td className={`py-2 px-4 text-right ${channel.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {channel.revenueChange >= 0 ? '+' : ''}{channel.revenueChange.toFixed(1)}%
                          </td>
                          <td className={`py-2 px-4 text-right ${channel.orderChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {channel.orderChange >= 0 ? '+' : ''}{channel.orderChange.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 기존 차트 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">플랫폼별 매출</h2>
                {data.charts.platformChart && (
                  <Bar
                    data={data.charts.platformChart}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const value = context.parsed.y
                              if (value === null || value === undefined) return '매출: N/A'
                              return `매출: ${formatCurrency(value)}`
                            },
                          },
                        },
                      },
                    }}
                  />
                )}
              </div>

              <div className="card">
                <h2 className="text-xl font-semibold mb-4">PG사별 주문</h2>
                {data.charts.pgChart && (
                  <Doughnut
                    data={data.charts.pgChart}
                    options={{
                      responsive: true,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const parsed = context.parsed
                              if (parsed === null || parsed === undefined) {
                                return `${context.label}: 0건 (0%)`
                              }
                              const total = context.dataset.data.reduce((a: any, b: any) => (a || 0) + (b || 0), 0)
                              const percentage = total > 0 ? ((parsed / total) * 100).toFixed(1) : '0'
                              return `${context.label}: ${parsed}건 (${percentage}%)`
                            },
                          },
                        },
                      },
                    }}
                  />
                )}
              </div>

              <div className="card">
                <h2 className="text-xl font-semibold mb-4">결제수단별 주문</h2>
                {data.charts.methodChart && (
                  <Pie
                    data={data.charts.methodChart}
                    options={{
                      responsive: true,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const parsed = context.parsed
                              if (parsed === null || parsed === undefined) {
                                return `${context.label}: 0건 (0%)`
                              }
                              const total = context.dataset.data.reduce((a: any, b: any) => (a || 0) + (b || 0), 0)
                              const percentage = total > 0 ? ((parsed / total) * 100).toFixed(1) : '0'
                              return `${context.label}: ${parsed}건 (${percentage}%)`
                            },
                          },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>

            {/* 채널별 AOV 비교 */}
            {data.channelAnalysis && data.channelAnalysis.stats && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">💰 채널별 객단가 (AOV) 비교</h2>
                <div style={{ position: 'relative', height: '300px' }}>
                  <Bar
                    data={{
                      labels: data.channelAnalysis.stats.map((c: any) => c.platform),
                      datasets: [
                        {
                          label: '객단가 (KRW)',
                          data: data.channelAnalysis.stats.map((c: any) => c.aov),
                          backgroundColor: 'rgba(247, 159, 121, 0.6)',
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const value = context.parsed.y
                              if (value === null || value === undefined) return '객단가: N/A'
                              return `객단가: ${formatCurrency(value)}`
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: '#eee' },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}

            {/* 채널별 고객 수 비교 */}
            {data.channelAnalysis && data.channelAnalysis.stats && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">👥 채널별 고객 수 비교</h2>
                <div style={{ position: 'relative', height: '300px' }}>
                  <Bar
                    data={{
                      labels: data.channelAnalysis.stats.map((c: any) => c.platform),
                      datasets: [
                        {
                          label: '고객 수',
                          data: data.channelAnalysis.stats.map((c: any) => c.customerCount),
                          backgroundColor: 'rgba(39, 174, 96, 0.6)',
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const value = context.parsed.y
                              if (value === null || value === undefined) return '고객 수: 0명'
                              return `고객 수: ${value}명`
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: '#eee' },
                          ticks: {
                            stepSize: 1,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

      {activeTab === 'regional' && data && data.regionalPerformance && (
          <div className="space-y-6">
            {/* 지역 성과 차트 */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">🌍 지역 성과 (매출액 기준)</h2>
              <div style={{ position: 'relative', height: '450px' }}>
                {(() => {
                  // Top 15 국가만 선택하고 가로막대 차트용으로 데이터 변환
                  const sortedData = [...data.regionalPerformance]
                    .sort((a: any, b: any) => b.totalSalesInKrw - a.totalSalesInKrw)
                    .slice(0, 15)
                    .reverse() // 가로막대 차트는 역순으로 표시

                  const chartData = {
                    labels: sortedData.map((r: any) => r.country),
                    datasets: [
                      {
                        label: '매출액 (KRW)',
                        data: sortedData.map((r: any) => Math.round(r.totalSalesInKrw)),
                        backgroundColor: 'rgba(74, 111, 165, 0.6)',
                      },
                    ],
                  }

                  return (
                    <Bar
                      data={chartData}
                      options={{
                        indexAxis: 'y' as const, // 가로막대 차트
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                const value = context.parsed.x
                                return `매출액: ₩${value != null ? value.toLocaleString() : '0'}`
                              },
                            },
                          },
                        },
                        scales: {
                          x: {
                            grid: { color: '#eee' },
                            ticks: {
                              callback: function (value) {
                                const num = Number(value)
                                if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B'
                                if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'
                                if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K'
                                return num.toLocaleString()
                              },
                            },
                            title: {
                              display: true,
                              text: '매출액 (KRW)',
                            },
                            beginAtZero: true,
                          },
                          y: {
                            grid: { display: false },
                          },
                        },
                      }}
                    />
                  )
                })()}
              </div>
            </div>

            {/* 지역별 상세 데이터 테이블 */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">국가별 상세 데이터</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">국가</th>
                      <th className="text-right py-2 px-4">매출</th>
                      <th className="text-right py-2 px-4">주문 건수</th>
                      <th className="text-right py-2 px-4">객단가</th>
                      <th className="text-right py-2 px-4">점유율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.regionalPerformance.map((region: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{region.country}</td>
                        <td className="py-2 px-4 text-right">
                          {formatCurrency(region.totalSalesInKrw)}
                        </td>
                        <td className="py-2 px-4 text-right">{region.orderCount}</td>
                        <td className="py-2 px-4 text-right">
                          {formatCurrency(region.aovInKrw)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {(region.salesShare * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 물류 처리 시간 분석 탭 */}
        {activeTab === 'logistics-performance' && (
          <LogisticsPerformanceTab 
            dateRange={dateRange} 
            countryFilter={countryFilter}
            onArtistClick={openArtistOrdersModal}
          />
        )}

        {/* 비교 분석 탭 */}
        {activeTab === 'comparison' && (
          <ComparisonTab 
            dateRange={dateRange} 
            countryFilter={countryFilter}
            onArtistClick={openArtistOrdersModal}
          />
        )}

      {/* 모달 */}
      {selectedCustomerId && (
        <CustomerDetailModal userId={selectedCustomerId} onClose={closeCustomerDetailModal} />
      )}
      {isOrderDetailModalOpen && selectedOrderCode && (
        <OrderDetailModal orderCode={selectedOrderCode} onClose={closeOrderDetailModal} />
      )}
      {isArtistOrdersModalOpen && selectedArtistName && (
        <ArtistOrdersModal artistName={selectedArtistName} onClose={closeArtistOrdersModal} />
      )}
    </div>
  )
}

