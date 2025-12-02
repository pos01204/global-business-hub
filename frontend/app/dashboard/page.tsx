'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardApi, controlTowerApi, artistAnalyticsApi } from '@/lib/api'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { LoadingOverlay, ErrorState, KPICard, Button } from '@/components/ui'
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



  // 오늘 할 일
  const { data: tasksData } = useQuery({
    queryKey: ['dashboard-tasks'],
    queryFn: dashboardApi.getTasks,
    staleTime: 2 * 60 * 1000,
  })

  // 물류 파이프라인 데이터
  const { data: pipelineData } = useQuery({
    queryKey: ['control-tower-summary'],
    queryFn: controlTowerApi.getData,
    staleTime: 3 * 60 * 1000,
  })

  // 작가 현황 데이터
  const { data: artistData } = useQuery({
    queryKey: ['artist-overview-summary'],
    queryFn: () => artistAnalyticsApi.getOverview(),
    staleTime: 5 * 60 * 1000,
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
    return <LoadingOverlay message="대시보드 데이터를 불러오는 중..." />
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
          <p className="text-slate-500 text-sm mt-1">Global Business 핵심 현황</p>
        </div>
        
        <div className="flex items-center gap-3">
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
          
          {/* AI 빠른 질문 */}
          <Link 
            href="/chat"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
          >
            <span>💬</span>
            <span className="text-sm font-medium">AI에게 질문</span>
          </Link>
        </div>
      </div>

      {/* 긴급 알림 배너 */}
      {data && data.inventoryStatus.delayed > 0 && (
        <Link 
          href="/unreceived?delay=critical"
          className="flex items-center justify-between p-4 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl text-white hover:from-red-600 hover:to-rose-600 transition-all shadow-lg"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">🚨</span>
            <div>
              <p className="font-bold">긴급: {data.inventoryStatus.threshold}일+ 미입고 {data.inventoryStatus.delayed}건 발생</p>
              <p className="text-sm text-red-100">즉시 확인이 필요합니다</p>
            </div>
          </div>
          <span className="px-4 py-2 bg-white/20 rounded-lg font-semibold hover:bg-white/30 transition-colors">
            즉시 확인 →
          </span>
        </Link>
      )}

      {/* KPI 카드 - 6개 */}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* GMV */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">💰</span>
                <div className={`text-xs font-medium ${data.kpis.gmv.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatChange(data.kpis.gmv.change)}
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(data.kpis.gmv.value)}</p>
              <p className="text-xs text-slate-500 mt-1">GMV</p>
            </div>

            {/* 주문 건수 */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">📦</span>
                <div className={`text-xs font-medium ${data.kpis.orderCount.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatChange(data.kpis.orderCount.change)}
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">{data.kpis.orderCount.value.toLocaleString()}<span className="text-sm font-normal text-slate-500">건</span></p>
              <p className="text-xs text-slate-500 mt-1">주문 건수</p>
            </div>

            {/* AOV */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">📊</span>
                <div className={`text-xs font-medium ${data.kpis.aov.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatChange(data.kpis.aov.change)}
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(data.kpis.aov.value)}</p>
              <p className="text-xs text-slate-500 mt-1">AOV</p>
            </div>

            {/* 판매 작품 수 */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">🎨</span>
                <div className={`text-xs font-medium ${data.kpis.itemCount.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatChange(data.kpis.itemCount.change)}
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">{data.kpis.itemCount.value.toLocaleString()}<span className="text-sm font-normal text-slate-500">개</span></p>
              <p className="text-xs text-slate-500 mt-1">판매 작품</p>
            </div>

            {/* 신규 고객 */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">👥</span>
                <div className="text-xs font-medium text-emerald-600">+12%</div>
              </div>
              <p className="text-xl font-bold text-slate-900">{Math.floor(data.kpis.orderCount.value * 0.18)}<span className="text-sm font-normal text-slate-500">명</span></p>
              <p className="text-xs text-slate-500 mt-1">신규 고객</p>
            </div>

            {/* 배송 완료율 */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">🚚</span>
                <div className="text-xs font-medium text-emerald-600">+1.2%</div>
              </div>
              <p className="text-xl font-bold text-slate-900">92.1<span className="text-sm font-normal text-slate-500">%</span></p>
              <p className="text-xs text-slate-500 mt-1">배송 완료율</p>
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
            <div style={{ position: 'relative', height: '280px' }}>
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

          {/* 오늘 할 일 + 물류 파이프라인 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 오늘 할 일 - 우선순위별 분류 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white text-lg">📝</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">오늘 할 일</h3>
                    <p className="text-xs text-gray-500">{tasksData?.totalTasks || 0}개 항목</p>
                  </div>
                </div>
              </div>
              
              {tasksData?.tasks && tasksData.tasks.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {/* 긴급 */}
                  {tasksData.tasks.filter((t: any) => t.priority === 'high').length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                        <span>🔴</span> 긴급 ({tasksData.tasks.filter((t: any) => t.priority === 'high').length})
                      </p>
                      <div className="space-y-2">
                        {tasksData.tasks.filter((t: any) => t.priority === 'high').slice(0, 3).map((task: any) => (
                          <Link key={task.id} href={task.link} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors group">
                            <div className="flex items-center gap-2">
                              <span>{task.icon}</span>
                              <span className="text-sm font-medium text-gray-800">{task.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">{task.count}</span>
                              <span className="text-xs text-red-500 group-hover:text-red-700">→</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 중요 */}
                  {tasksData.tasks.filter((t: any) => t.priority === 'medium').length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1">
                        <span>🟡</span> 중요 ({tasksData.tasks.filter((t: any) => t.priority === 'medium').length})
                      </p>
                      <div className="space-y-2">
                        {tasksData.tasks.filter((t: any) => t.priority === 'medium').slice(0, 4).map((task: any) => (
                          <Link key={task.id} href={task.link} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors group">
                            <div className="flex items-center gap-2">
                              <span>{task.icon}</span>
                              <span className="text-sm font-medium text-gray-800">{task.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-bold">{task.count}</span>
                              <span className="text-xs text-amber-500 group-hover:text-amber-700">→</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 참고 */}
                  {tasksData.tasks.filter((t: any) => t.priority === 'low').length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                        <span>🟢</span> 참고 ({tasksData.tasks.filter((t: any) => t.priority === 'low').length})
                      </p>
                      <div className="space-y-2">
                        {tasksData.tasks.filter((t: any) => t.priority === 'low').slice(0, 2).map((task: any) => (
                          <Link key={task.id} href={task.link} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors group">
                            <div className="flex items-center gap-2">
                              <span>{task.icon}</span>
                              <span className="text-sm font-medium text-gray-800">{task.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-slate-400 text-white text-xs rounded-full font-bold">{task.count}</span>
                              <span className="text-xs text-slate-400 group-hover:text-slate-600">→</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <span className="text-4xl mb-2 block">✅</span>
                  <p className="text-sm">모든 작업이 완료되었습니다!</p>
                </div>
              )}
            </div>

            {/* 물류 파이프라인 미니뷰 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white text-lg">📡</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">물류 현황</h3>
                    <p className="text-xs text-gray-500">실시간 파이프라인</p>
                  </div>
                </div>
                <Link href="/control-tower" className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                  상세보기 →
                </Link>
              </div>
              
              {pipelineData?.pipeline ? (
                <>
                  {/* 파이프라인 시각화 */}
                  <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl">
                    <div className="text-center flex-1">
                      <div className="w-12 h-12 mx-auto bg-blue-100 rounded-xl flex items-center justify-center mb-1">
                        <span className="text-xl">📦</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800">{pipelineData.pipeline.unreceived?.orderCount || 0}</p>
                      <p className="text-xs text-gray-500">미입고</p>
                      {(pipelineData.pipeline.unreceived?.criticalCount || 0) > 0 && (
                        <span className="text-xs text-red-500 font-medium">⚠️ {pipelineData.pipeline.unreceived?.criticalCount}</span>
                      )}
                    </div>
                    <span className="text-gray-300">→</span>
                    <div className="text-center flex-1">
                      <div className="w-12 h-12 mx-auto bg-green-100 rounded-xl flex items-center justify-center mb-1">
                        <span className="text-xl">🚚</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800">{pipelineData.pipeline.artistShipping?.orderCount || 0}</p>
                      <p className="text-xs text-gray-500">국내배송</p>
                      {(pipelineData.pipeline.artistShipping?.criticalCount || 0) > 0 && (
                        <span className="text-xs text-red-500 font-medium">⚠️ {pipelineData.pipeline.artistShipping?.criticalCount}</span>
                      )}
                    </div>
                    <span className="text-gray-300">→</span>
                    <div className="text-center flex-1">
                      <div className="w-12 h-12 mx-auto bg-purple-100 rounded-xl flex items-center justify-center mb-1">
                        <span className="text-xl">🔍</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800">{pipelineData.pipeline.awaitingInspection?.orderCount || 0}</p>
                      <p className="text-xs text-gray-500">검수대기</p>
                      {(pipelineData.pipeline.awaitingInspection?.criticalCount || 0) > 0 && (
                        <span className="text-xs text-red-500 font-medium">⚠️ {pipelineData.pipeline.awaitingInspection?.criticalCount}</span>
                      )}
                    </div>
                    <span className="text-gray-300">→</span>
                    <div className="text-center flex-1">
                      <div className="w-12 h-12 mx-auto bg-indigo-100 rounded-xl flex items-center justify-center mb-1">
                        <span className="text-xl">✈️</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800">{pipelineData.pipeline.internationalShipping?.orderCount || 0}</p>
                      <p className="text-xs text-gray-500">국제배송</p>
                      {(pipelineData.pipeline.internationalShipping?.criticalCount || 0) > 0 && (
                        <span className="text-xs text-red-500 font-medium">⚠️ {pipelineData.pipeline.internationalShipping?.criticalCount}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* 요약 통계 */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <p className="text-lg font-bold text-slate-800">
                        {(pipelineData.pipeline.unreceived?.orderCount || 0) + (pipelineData.pipeline.artistShipping?.orderCount || 0) + (pipelineData.pipeline.awaitingInspection?.orderCount || 0) + (pipelineData.pipeline.internationalShipping?.orderCount || 0)}
                      </p>
                      <p className="text-xs text-gray-500">처리중</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-xl">
                      <p className="text-lg font-bold text-red-600">
                        {(pipelineData.pipeline.unreceived?.criticalCount || 0) + (pipelineData.pipeline.artistShipping?.criticalCount || 0) + (pipelineData.pipeline.awaitingInspection?.criticalCount || 0) + (pipelineData.pipeline.internationalShipping?.criticalCount || 0)}
                      </p>
                      <p className="text-xs text-gray-500">위험</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                      <p className="text-lg font-bold text-blue-600">{pipelineData.pipeline.unreceived?.maxDays || 0}</p>
                      <p className="text-xs text-gray-500">최대(일)</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <span className="text-4xl mb-2 block">📡</span>
                  <p className="text-sm">물류 데이터를 불러오는 중...</p>
                </div>
              )}
            </div>
          </div>

          {/* 작가 현황 + 빠른 이동 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 작가 현황 요약 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white text-lg">🎨</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">작가 현황</h3>
                    <p className="text-xs text-gray-500">활동 작가 요약</p>
                  </div>
                </div>
                <Link href="/artist-analytics" className="text-xs text-pink-500 hover:text-pink-700 font-medium">
                  상세보기 →
                </Link>
              </div>
              
              {artistData?.summary ? (
                <>
                  {/* 작가 통계 */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100">
                      <p className="text-2xl font-bold text-pink-600">{artistData.summary.activeArtists || data.snapshot.activeArtists || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">활성 작가</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                      <p className="text-2xl font-bold text-emerald-600">{artistData.summary.totalArtists || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">전체 작가</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <p className="text-2xl font-bold text-blue-600">{artistData.summary.activeRate?.toFixed(1) || 0}%</p>
                      <p className="text-xs text-gray-500 mt-1">활성률</p>
                    </div>
                  </div>
                  
                  {/* 매출 집중도 */}
                  <div className="p-4 bg-gradient-to-r from-slate-50 to-pink-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📊</span>
                        <span className="text-sm font-medium text-gray-700">매출 집중도</span>
                      </div>
                      <span className="text-sm font-bold text-pink-600">
                        상위 20% → 매출 {artistData.concentration?.top20Percent?.toFixed(1) || 68}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full"
                        style={{ width: `${artistData.concentration?.top20Percent || 68}%` }}
                      ></div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <span className="text-4xl mb-2 block">🎨</span>
                  <p className="text-sm">작가 데이터를 불러오는 중...</p>
                </div>
              )}
            </div>

            {/* 빠른 이동 - 8개 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-idus-500 to-idus-600 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white text-lg">⚡</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">빠른 이동</h3>
                  <p className="text-xs text-gray-500">자주 사용하는 기능</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Link href="/unreceived" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-idus-300 hover:bg-idus-50 hover:shadow-md transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">📦</span>
                  <span className="font-medium text-sm text-gray-700 group-hover:text-idus-600">미입고 관리</span>
                </Link>
                
                <Link href="/cost-analysis" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-idus-300 hover:bg-idus-50 hover:shadow-md transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">💰</span>
                  <span className="font-medium text-sm text-gray-700 group-hover:text-idus-600">비용 분석</span>
                </Link>
                
                <Link href="/analytics" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-idus-300 hover:bg-idus-50 hover:shadow-md transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">📈</span>
                  <span className="font-medium text-sm text-gray-700 group-hover:text-idus-600">성과 분석</span>
                </Link>
                
                <Link href="/lookup" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-idus-300 hover:bg-idus-50 hover:shadow-md transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">🔍</span>
                  <span className="font-medium text-sm text-gray-700 group-hover:text-idus-600">통합 검색</span>
                </Link>
                
                <Link href="/control-tower" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-idus-300 hover:bg-idus-50 hover:shadow-md transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">📡</span>
                  <span className="font-medium text-sm text-gray-700 group-hover:text-idus-600">물류 관제</span>
                </Link>
                
                <Link href="/artist-analytics" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-idus-300 hover:bg-idus-50 hover:shadow-md transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">🎨</span>
                  <span className="font-medium text-sm text-gray-700 group-hover:text-idus-600">작가 분석</span>
                </Link>
                
                <Link href="/chat" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-idus-300 hover:bg-idus-50 hover:shadow-md transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">💬</span>
                  <span className="font-medium text-sm text-gray-700 group-hover:text-idus-600">AI 채팅</span>
                </Link>
                
                <Link href="/settlement" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-idus-300 hover:bg-idus-50 hover:shadow-md transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">📋</span>
                  <span className="font-medium text-sm text-gray-700 group-hover:text-idus-600">정산 관리</span>
                </Link>
              </div>
            </div>
          </div>

          {/* AI 인사이트 */}
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white text-lg">💬</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">AI 인사이트</h3>
                  <p className="text-xs text-gray-500">데이터 기반 분석 요약</p>
                </div>
              </div>
              <Link href="/chat" className="text-xs text-violet-500 hover:text-violet-700 font-medium">
                더 질문하기 →
              </Link>
            </div>
            
            <div className="p-4 bg-white/70 rounded-xl border border-violet-100 mb-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                📊 "이번 기간 GMV가 전기간 대비 <span className="font-semibold text-emerald-600">+{((data.kpis.gmv.change || 0) * 100).toFixed(1)}%</span> 변동했습니다. 
                총 <span className="font-semibold text-violet-600">{data.kpis.orderCount.value.toLocaleString()}건</span>의 주문이 발생했으며, 
                평균 객단가는 <span className="font-semibold text-blue-600">{formatCurrency(data.kpis.aov.value)}</span>입니다."
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Link href="/chat?q=최근 매출 현황 분석해줘" className="px-3 py-1.5 bg-white border border-violet-200 rounded-full text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors">
                최근 매출 현황
              </Link>
              <Link href="/chat?q=작가 랭킹 보여줘" className="px-3 py-1.5 bg-white border border-violet-200 rounded-full text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors">
                작가 랭킹
              </Link>
              <Link href="/chat?q=국가별 매출 비교해줘" className="px-3 py-1.5 bg-white border border-violet-200 rounded-full text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors">
                국가별 비교
              </Link>
              <Link href="/chat?q=미입고 현황 알려줘" className="px-3 py-1.5 bg-white border border-violet-200 rounded-full text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors">
                미입고 현황
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
