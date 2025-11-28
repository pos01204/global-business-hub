'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardApi, trendAnalysisApi, reviewsApi, customerAnalyticsApi } from '@/lib/api'
import Link from 'next/link'
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

  // 시계열 분석 고도화 데이터
  const { data: trendData } = useQuery({
    queryKey: ['trend-analysis', startDate, endDate],
    queryFn: () => trendAnalysisApi.getData(startDate, endDate, 'all'),
    enabled: !!startDate && !!endDate,
  })

  // 리뷰 요약 데이터
  const { data: reviewStats } = useQuery({
    queryKey: ['reviews-stats-dashboard'],
    queryFn: reviewsApi.getStats,
    staleTime: 5 * 60 * 1000,
  })

  // 최근 하이라이트 리뷰
  const { data: recentReviews } = useQuery({
    queryKey: ['reviews-highlights-dashboard'],
    queryFn: () => reviewsApi.getHighlights(4),
    staleTime: 5 * 60 * 1000,
  })

  // 오늘 할 일
  const { data: tasksData } = useQuery({
    queryKey: ['dashboard-tasks'],
    queryFn: dashboardApi.getTasks,
    staleTime: 2 * 60 * 1000,
  })

  const handleApply = () => {
    // 쿼리 자동 재실행됨
  }

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

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    const isNetworkError = errorMessage.includes('Network Error') || errorMessage.includes('ECONNREFUSED')
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-red-200 shadow-lg max-w-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-800">오류 발생</h2>
              <p className="text-sm text-red-600">데이터를 불러오는 중 문제가 발생했습니다.</p>
            </div>
          </div>
          
          {isNetworkError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <p className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                <span>🔌</span> 네트워크 오류 감지
              </p>
              <ul className="text-xs text-amber-700 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  백엔드 서버가 실행 중인지 확인하세요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  포트 3001에서 서버가 실행 중인지 확인하세요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  터미널에서 <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-800">cd backend && npm run dev</code> 실행
                </li>
              </ul>
            </div>
          )}
          
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-xs font-semibold text-gray-600 mb-1">상세 오류 정보:</p>
            <p className="text-xs text-gray-500 font-mono break-all">{errorMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
          <p className="text-slate-500 text-sm mt-1">Global Business 핵심 성과 지표</p>
        </div>
        
        {/* 날짜 필터 */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border-0 bg-transparent text-sm text-slate-700 focus:outline-none w-32"
          />
          <span className="text-slate-300">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border-0 bg-transparent text-sm text-slate-700 focus:outline-none w-32"
          />
          <button
            onClick={handleApply}
            className="ml-2 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors"
          >
            조회
          </button>
        </div>
      </div>

      {/* KPI 카드 */}
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* GMV */}
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-slate-500 text-sm font-medium">Total GMV</h3>
                <span className="text-lg">💰</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-2">{formatCurrency(data.kpis.gmv.value)}</p>
              <div className={`inline-flex items-center gap-1 text-xs font-medium ${
                data.kpis.gmv.change >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                <span>{data.kpis.gmv.change >= 0 ? '↑' : '↓'}</span>
                <span>{formatChange(data.kpis.gmv.change)}</span>
              </div>
            </div>

            {/* AOV */}
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-slate-500 text-sm font-medium">객단가 (AOV)</h3>
                <span className="text-lg">📊</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-2">{formatCurrency(data.kpis.aov.value)}</p>
              <div className={`inline-flex items-center gap-1 text-xs font-medium ${
                data.kpis.aov.change >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                <span>{data.kpis.aov.change >= 0 ? '↑' : '↓'}</span>
                <span>{formatChange(data.kpis.aov.change)}</span>
              </div>
            </div>

            {/* 주문 건수 */}
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-slate-500 text-sm font-medium">주문 건수</h3>
                <span className="text-lg">📦</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-2">
                {data.kpis.orderCount.value.toLocaleString()}
                <span className="text-base font-normal text-slate-500 ml-1">건</span>
              </p>
              <div className={`inline-flex items-center gap-1 text-xs font-medium ${
                data.kpis.orderCount.change >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                <span>{data.kpis.orderCount.change >= 0 ? '↑' : '↓'}</span>
                <span>{formatChange(data.kpis.orderCount.change)}</span>
              </div>
            </div>

            {/* 판매 작품 수 */}
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-slate-500 text-sm font-medium">판매 작품 수</h3>
                <span className="text-lg">🎨</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-2">
                {data.kpis.itemCount.value.toLocaleString()}
                <span className="text-base font-normal text-slate-500 ml-1">개</span>
              </p>
              <div className={`inline-flex items-center gap-1 text-xs font-medium ${
                data.kpis.itemCount.change >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                <span>{data.kpis.itemCount.change >= 0 ? '↑' : '↓'}</span>
                <span>{formatChange(data.kpis.itemCount.change)}</span>
              </div>
            </div>
          </div>

          {/* 트렌드 차트 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-idus-500 to-idus-600 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white text-lg">📈</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">GMV & 주문 추세</h2>
                  <p className="text-xs text-gray-500">7일 이동평균 포함</p>
                </div>
              </div>
              {startDate && endDate && (
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                  📅 {startDate} ~ {endDate}
                </span>
              )}
            </div>
            <div style={{ position: 'relative', height: '320px' }}>
              {data.trend && (
                <Chart
                  type="bar"
                  data={{
                    labels: data.trend.labels,
                    datasets: data.trend.datasets.map((dataset: any) => {
                      if (dataset.type === 'line') {
                        return {
                          ...dataset,
                          type: 'line' as const,
                          borderColor: '#F78C3A',
                          backgroundColor: 'rgba(247, 140, 58, 0.1)',
                        }
                      }
                      return {
                        ...dataset,
                        type: 'bar' as const,
                        backgroundColor: 'rgba(247, 140, 58, 0.6)',
                        hoverBackgroundColor: 'rgba(247, 140, 58, 0.8)',
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
                          font: { size: 11, weight: 500 },
                          padding: 20,
                          usePointStyle: true,
                          pointStyle: 'circle',
                        },
                      },
                      tooltip: {
                        backgroundColor: 'white',
                        titleColor: '#1f2937',
                        bodyColor: '#4b5563',
                        borderColor: '#e5e7eb',
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true,
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
                        grid: { color: '#f3f4f6' },
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
                          font: { size: 12, weight: 600 },
                          color: '#6b7280',
                        },
                        beginAtZero: true,
                      },
                      yOrders: {
                        type: 'linear' as const,
                        position: 'right' as const,
                        grid: { drawOnChartArea: false },
                        ticks: {
                          font: { size: 11 },
                          color: '#F78C3A',
                          stepSize: 5,
                          precision: 0,
                        },
                        title: {
                          display: true,
                          text: '주문 건수',
                          font: { size: 12, weight: 600 },
                          color: '#F78C3A',
                        },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>

          {/* 오늘 할 일 위젯 */}
          {tasksData?.tasks && tasksData.tasks.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white text-lg">📝</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">오늘 할 일</h3>
                    <p className="text-xs text-gray-500">{tasksData.totalTasks}개 항목 처리 필요</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{tasksData.date}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {tasksData.tasks.map((task: any) => (
                  <Link
                    key={task.id}
                    href={task.link}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md ${
                      task.priority === 'high'
                        ? 'bg-red-50 border-red-200 hover:border-red-300'
                        : task.priority === 'medium'
                        ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">{task.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${
                          task.priority === 'high' ? 'text-red-800' 
                          : task.priority === 'medium' ? 'text-amber-800' 
                          : 'text-slate-800'
                        }`}>
                          {task.title}
                        </p>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                          task.priority === 'high' ? 'bg-red-500 text-white' 
                          : task.priority === 'medium' ? 'bg-amber-500 text-white' 
                          : 'bg-slate-400 text-white'
                        }`}>
                          {task.count}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{task.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 하단 2단 레이아웃: 알림/미입고 + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 알림 & 미입고 현황 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white text-lg">🚨</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">주의 필요</h3>
                    <p className="text-xs text-gray-500">즉시 확인이 필요한 항목</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* 미입고 지연 알림 */}
                <Link 
                  href={data.inventoryStatus.delayed > 0 ? "/unreceived?delay=delayed" : "/unreceived"}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.01] ${
                    data.inventoryStatus.delayed > 0 
                      ? 'bg-red-50 border border-red-200 hover:bg-red-100' 
                      : 'bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{data.inventoryStatus.delayed > 0 ? '⚠️' : '✅'}</span>
                    <div>
                      <p className={`font-semibold ${data.inventoryStatus.delayed > 0 ? 'text-red-800' : 'text-emerald-800'}`}>
                        미입고 {data.inventoryStatus.threshold}일 이상 지연
                      </p>
                      <p className={`text-xs ${data.inventoryStatus.delayed > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        총 미입고: {data.inventoryStatus.total}건
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${data.inventoryStatus.delayed > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {data.inventoryStatus.delayed}건
                    </p>
                    <p className="text-xs text-gray-500">클릭하여 관리 →</p>
                  </div>
                </Link>

                {/* 성과 요약 */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-idus-50 to-white rounded-xl border border-idus-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌏</span>
                    <div>
                      <p className="font-semibold text-gray-800">기간 내 활동 현황</p>
                      <p className="text-xs text-gray-500">{startDate} ~ {endDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-center">
                    <div className="px-3">
                      <p className="text-lg font-bold text-idus-600">{data.snapshot.activeCountries}</p>
                      <p className="text-xs text-gray-500">국가</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="px-3">
                      <p className="text-lg font-bold text-idus-600">{data.snapshot.activeArtists}</p>
                      <p className="text-xs text-gray-500">작가</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="px-3">
                      <p className="text-lg font-bold text-idus-600">{data.snapshot.activeItems}</p>
                      <p className="text-xs text-gray-500">상품</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-idus-500 to-idus-600 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white text-lg">⚡</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">빠른 이동</h3>
                  <p className="text-xs text-gray-500">자주 사용하는 기능</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Link 
                  href="/unreceived" 
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-idus-300 hover:bg-idus-50 hover:shadow-md transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">📦</span>
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-idus-600">미입고 관리</p>
                    <p className="text-xs text-gray-500">입고 지연 처리</p>
                  </div>
                </Link>
                
                <Link 
                  href="/cost-analysis" 
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-idus-300 hover:bg-idus-50 hover:shadow-md transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">💰</span>
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-idus-600">비용 분석</p>
                    <p className="text-xs text-gray-500">손익 구조 확인</p>
                  </div>
                </Link>
                
                <Link 
                  href="/analytics" 
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-idus-300 hover:bg-idus-50 hover:shadow-md transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">📈</span>
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-idus-600">성과 분석</p>
                    <p className="text-xs text-gray-500">상세 분석 리포트</p>
                  </div>
                </Link>
                
                <Link 
                  href="/lookup" 
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-idus-300 hover:bg-idus-50 hover:shadow-md transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">🔍</span>
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-idus-600">통합 검색</p>
                    <p className="text-xs text-gray-500">주문/고객/작가</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* 고객 리뷰 요약 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-idus-500 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white text-lg">⭐</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">고객 리뷰</h3>
                  <p className="text-xs text-gray-500">전 세계 고객들의 이야기</p>
                </div>
              </div>
              <Link 
                href="/reviews"
                className="text-sm text-idus-500 hover:text-idus-600 font-semibold flex items-center gap-1 transition-colors"
              >
                전체 보기 →
              </Link>
            </div>

            {/* 리뷰 통계 */}
            {reviewStats?.data && (
              <div className="grid grid-cols-4 gap-4 mb-5">
                <div className="text-center p-3 bg-gradient-to-br from-idus-50 to-orange-50 rounded-xl border border-idus-100">
                  <p className="text-2xl font-bold text-idus-600">{reviewStats.data.totalReviews?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">총 리뷰</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                  <p className="text-2xl font-bold text-emerald-600">{reviewStats.data.avgRating || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">평균 평점</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <p className="text-2xl font-bold text-blue-600">{reviewStats.data.imageReviewRate || 0}%</p>
                  <p className="text-xs text-gray-500 mt-1">포토 리뷰</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100">
                  <p className="text-2xl font-bold text-violet-600">{reviewStats.data.countries?.length || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">국가</p>
                </div>
              </div>
            )}

            {/* 최근 베스트 리뷰 */}
            {recentReviews?.data && recentReviews.data.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentReviews.data.slice(0, 4).map((review: any) => (
                  <Link
                    key={review.id}
                    href="/reviews"
                    className="flex gap-3 p-3 bg-gray-50 hover:bg-idus-50 rounded-xl transition-colors group border border-transparent hover:border-idus-200"
                  >
                    {review.imageUrl && (
                      <img 
                        src={review.imageUrl} 
                        alt="" 
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{review.countryInfo?.emoji}</span>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">★ {review.rating}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 leading-snug group-hover:text-gray-800">
                        "{review.contents}"
                      </p>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {review.productName}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {(!recentReviews?.data || recentReviews.data.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                <span className="text-4xl mb-2 block">📭</span>
                <p className="text-sm">아직 등록된 리뷰가 없습니다</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
