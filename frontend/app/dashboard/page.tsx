'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api'
import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend
)

export default function DashboardPage() {
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  useEffect(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 29)
    
    setEndDate(format(today, 'yyyy-MM-dd'))
    setStartDate(format(thirtyDaysAgo, 'yyyy-MM-dd'))
  }, [])

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'main', startDate, endDate],
    queryFn: () => dashboardApi.getMain(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })

  const handleApply = () => {
    // 쿼리 자동 재실행됨
  }

  const formatCurrency = (value: number) => {
    return `₩${Math.round(value).toLocaleString()}`
  }

  const formatChange = (change: number) => {
    if (change === Infinity) return 'New'
    if (isNaN(change) || !isFinite(change)) return '-'
    const sign = change >= 0 ? '+' : ''
    return `${sign}${(change * 100).toFixed(1)}%`
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
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    const isNetworkError = errorMessage.includes('Network Error') || errorMessage.includes('ECONNREFUSED')
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card bg-red-50 border-red-200 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">오류 발생</h2>
          <p className="text-red-600 mb-4">데이터를 불러오는 중 문제가 발생했습니다.</p>
          
          {isNetworkError && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-semibold text-yellow-800 mb-2">네트워크 오류 감지</p>
              <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                <li>백엔드 서버가 실행 중인지 확인하세요</li>
                <li>포트 3001에서 서버가 실행 중인지 확인하세요</li>
                <li>터미널에서 <code className="bg-yellow-100 px-1 rounded">cd backend && npm run dev</code> 실행</li>
              </ul>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
            <p className="text-xs font-semibold text-gray-700 mb-1">상세 오류 정보:</p>
            <p className="text-xs text-gray-600 font-mono break-all">{errorMessage}</p>
          </div>
        </div>
      </div>
    )
  }

          return (
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 메인 대시보드</h1>
                <p className="text-gray-600">핵심 성과 지표 및 트렌드 분석</p>
              </div>

        {/* 날짜 필터 */}
        <div className="card mb-6">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <button
              onClick={handleApply}
              className="btn btn-primary"
            >
              조회
            </button>
          </div>
        </div>

        {/* KPI 카드 */}
        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <h3 className="text-sm font-medium text-muted-color mb-2">Total GMV</h3>
                <p className="text-2xl font-bold">{formatCurrency(data.kpis.gmv.value)}</p>
                <p className={`text-sm mt-2 ${data.kpis.gmv.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatChange(data.kpis.gmv.change)} vs 이전 기간
                </p>
              </div>

              <div className="card">
                <h3 className="text-sm font-medium text-muted-color mb-2">객단가 (AOV)</h3>
                <p className="text-2xl font-bold">{formatCurrency(data.kpis.aov.value)}</p>
                <p className={`text-sm mt-2 ${data.kpis.aov.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatChange(data.kpis.aov.change)} vs 이전 기간
                </p>
              </div>

              <div className="card">
                <h3 className="text-sm font-medium text-muted-color mb-2">주문 건수</h3>
                <p className="text-2xl font-bold">{data.kpis.orderCount.value.toLocaleString()}</p>
                <p className={`text-sm mt-2 ${data.kpis.orderCount.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatChange(data.kpis.orderCount.change)} vs 이전 기간
                </p>
              </div>

              <div className="card">
                <h3 className="text-sm font-medium text-muted-color mb-2">판매 작품 수</h3>
                <p className="text-2xl font-bold">{data.kpis.itemCount.value.toLocaleString()}</p>
                <p className={`text-sm mt-2 ${data.kpis.itemCount.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatChange(data.kpis.itemCount.change)} vs 이전 기간
                </p>
              </div>
            </div>

            {/* 트렌드 차트 */}
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">📊 GMV & 주문 추세 (7일 이동평균)</h2>
              <div style={{ position: 'relative', height: '350px' }}>
                {data.trend && (
                  <Chart
                    type="bar"
                    data={{
                      labels: data.trend.labels,
                      datasets: data.trend.datasets.map((dataset: any) => {
                        // Chart.js v4에서는 혼합 차트를 위해 각 데이터셋의 type을 명시적으로 설정
                        if (dataset.type === 'line') {
                          return {
                            ...dataset,
                            type: 'line' as const,
                          }
                        }
                        return {
                          ...dataset,
                          type: 'bar' as const,
                        }
                      }),
                    }}
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
                          labels: {
                            font: { size: 11 },
                            padding: 15,
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              let label = context.dataset.label || ''
                              if (label) {
                                label += ': '
                              }
                              if (context.parsed.y !== null) {
                                if (context.dataset.yAxisID === 'yGmv') {
                                  label += `₩${context.parsed.y.toLocaleString()}`
                                } else {
                                  label += `${context.parsed.y}건`
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
                          ticks: {
                            font: { size: 11 },
                            maxRotation: 0,
                            autoSkip: true,
                          },
                        },
                        yGmv: {
                          type: 'linear' as const,
                          position: 'left' as const,
                          grid: { color: '#eee' },
                          ticks: {
                            font: { size: 11 },
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
                            text: 'GMV (KRW)',
                            font: { size: 12 },
                          },
                          beginAtZero: true,
                        },
                        yOrders: {
                          type: 'linear' as const,
                          position: 'right' as const,
                          grid: { drawOnChartArea: false },
                          ticks: {
                            font: { size: 11 },
                            color: '#F79F79',
                            stepSize: 5,
                            precision: 0,
                          },
                          title: {
                            display: true,
                            text: '주문 건수',
                            font: { size: 12 },
                            color: '#F79F79',
                          },
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>

            {/* 미입고 현황 */}
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">📌 미입고 현황</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-color">총 미입고 작품</p>
                  <p className="text-2xl font-bold">{data.inventoryStatus.total.toLocaleString()} 건</p>
                </div>
                <div>
                  <p className="text-sm text-muted-color">🚨 {data.inventoryStatus.threshold}일 이상 지연</p>
                  <p className="text-2xl font-bold text-red-600">
                    {data.inventoryStatus.delayed.toLocaleString()} 건
                  </p>
                </div>
              </div>
            </div>

            {/* 스냅샷 */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">📌 성과 스냅샷</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl mb-2">🌍</p>
                  <p className="text-sm text-muted-color">활성 국가</p>
                  <p className="text-xl font-bold">{data.snapshot.activeCountries} 개국</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl mb-2">🧑‍🎨</p>
                  <p className="text-sm text-muted-color">활성 작가</p>
                  <p className="text-xl font-bold">{data.snapshot.activeArtists} 명</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl mb-2">🎨</p>
                  <p className="text-sm text-muted-color">활성 상품</p>
                  <p className="text-xl font-bold">{data.snapshot.activeItems} 개</p>
                </div>
              </div>
                    </div>
                  </>
                )}
            </div>
          )
        }

