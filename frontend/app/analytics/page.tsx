'use client'

import { useQuery } from '@tanstack/react-query'
import { analyticsApi, customersApi, logisticsPerformanceApi, comparisonApi } from '@/lib/api'
import { useState } from 'react'
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
}: {
  dateRange: string
  countryFilter: string
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
                    <td className="py-2 px-4">{artist.artistName}</td>
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
                        return `${context.parsed.y}건`
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

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d')
  const [countryFilter, setCountryFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')
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

  const formatCurrency = (value: number) => {
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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📈 성과 분석</h1>
        <p className="text-gray-600">상세한 성과 분석 및 리포트를 확인하세요.</p>
      </div>

      {/* 필터 */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">기간</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
              <option value="90d">최근 90일</option>
              <option value="365d">최근 365일</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">국가</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">전체 국가</option>
              <option value="jp">일본</option>
              <option value="non_jp">일본 외</option>
            </select>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-4 font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-color hover:text-primary'
            }`}
          >
            종합 성과
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={`pb-2 px-4 font-medium ${
              activeTab === 'customer'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-color hover:text-primary'
            }`}
          >
            고객 분석
          </button>
          <button
            onClick={() => setActiveTab('channel')}
            className={`pb-2 px-4 font-medium ${
              activeTab === 'channel'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-color hover:text-primary'
            }`}
          >
            채널 분석
          </button>
          {countryFilter === 'all' && (
            <button
              onClick={() => setActiveTab('regional')}
              className={`pb-2 px-4 font-medium ${
                activeTab === 'regional'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-color hover:text-primary'
              }`}
            >
              지역 분석
            </button>
          )}
          <button
            onClick={() => setActiveTab('logistics-performance')}
            className={`pb-2 px-4 font-medium ${
              activeTab === 'logistics-performance'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-color hover:text-primary'
            }`}
          >
            물류 처리 시간
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`pb-2 px-4 font-medium ${
              activeTab === 'comparison'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-color hover:text-primary'
            }`}
          >
            비교 분석
          </button>
        </div>
      </div>

      {/* 탭별 콘텐츠 */}
      {activeTab === 'overview' && data && (
        <div className="space-y-6">
          {/* 매출 성과 KPI */}
          <h2 className="text-xl font-semibold mb-4">📈 매출 성과</h2>
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
            <h2 className="text-xl font-semibold mb-4">Top 10 작가 (매출 기준)</h2>
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
                              return `매출: ${formatCurrency(context.parsed.y)}`
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
                              const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0)
                              const percentage = ((context.parsed / total) * 100).toFixed(1)
                              return `${context.label}: ${context.parsed}건 (${percentage}%)`
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
                              const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0)
                              const percentage = ((context.parsed / total) * 100).toFixed(1)
                              return `${context.label}: ${context.parsed}건 (${percentage}%)`
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
                              return `객단가: ${formatCurrency(context.parsed.y)}`
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
                              return `고객 수: ${context.parsed.y}명`
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
          <LogisticsPerformanceTab dateRange={dateRange} countryFilter={countryFilter} />
        )}

        {/* 비교 분석 탭 */}
        {activeTab === 'comparison' && (
          <ComparisonTab dateRange={dateRange} countryFilter={countryFilter} />
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

