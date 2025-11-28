'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { customerAnalyticsApi } from '@/lib/api'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

type TabType = 'rfm' | 'churn' | 'cohort' | 'ltv' | 'coupon'

export default function CustomerAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('rfm')

  const tabs = [
    { id: 'rfm' as const, label: 'RFM 세그먼트', icon: '👥' },
    { id: 'churn' as const, label: '이탈 위험', icon: '⚠️' },
    { id: 'cohort' as const, label: '코호트 분석', icon: '📊' },
    { id: 'ltv' as const, label: 'LTV 분석', icon: '💰' },
    { id: 'coupon' as const, label: '쿠폰 시뮬레이터', icon: '🎫' },
  ]

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 */}
      <div className="relative bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 mb-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
            <span className="text-3xl">📈</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">고객 분석</h1>
            <p className="text-slate-300 text-sm">RFM 세그먼테이션, 이탈 예측, 코호트 분석, LTV</p>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-800 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'rfm' && <RFMTab />}
      {activeTab === 'churn' && <ChurnRiskTab />}
      {activeTab === 'cohort' && <CohortTab />}
      {activeTab === 'ltv' && <LTVTab />}
      {activeTab === 'coupon' && <CouponSimulatorTab />}
    </div>
  )
}

// RFM 세그먼테이션 탭
function RFMTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rfm'],
    queryFn: customerAnalyticsApi.getRFM,
  })

  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.success) return <ErrorState />

  const segmentColors: Record<string, string> = {
    Champions: '#10B981',
    Loyal: '#3B82F6',
    Potential: '#8B5CF6',
    Promising: '#06B6D4',
    NeedsAttention: '#F59E0B',
    AtRisk: '#EF4444',
    Hibernating: '#6B7280',
    Lost: '#374151',
  }

  const chartData = {
    labels: data.segments.map((s: any) => s.label),
    datasets: [
      {
        data: data.segments.map((s: any) => s.count),
        backgroundColor: data.segments.map((s: any) => segmentColors[s.segment] || '#6B7280'),
        borderWidth: 0,
      },
    ],
  }

  const selectedData = selectedSegment
    ? data.segments.find((s: any) => s.segment === selectedSegment)
    : null

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="전체 고객"
          value={data.summary.totalCustomers.toLocaleString()}
          suffix="명"
          icon="👥"
        />
        <SummaryCard
          title="평균 구매주기"
          value={data.summary.avgRecencyDays}
          suffix="일"
          icon="📅"
        />
        <SummaryCard
          title="평균 구매횟수"
          value={data.summary.avgFrequency}
          suffix="회"
          icon="🛒"
        />
        <SummaryCard
          title="평균 구매금액"
          value={(data.summary.avgMonetary / 10000).toFixed(1)}
          suffix="만원"
          icon="💵"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 세그먼트 분포 차트 */}
        <div className="card lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">세그먼트 분포</h3>
          <div className="h-64">
            <Doughnut
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 8, font: { size: 11 } },
                  },
                },
                onClick: (_, elements) => {
                  if (elements.length > 0) {
                    const index = elements[0].index
                    setSelectedSegment(data.segments[index].segment)
                  }
                },
              }}
            />
          </div>
        </div>

        {/* 세그먼트 카드 그리드 */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">세그먼트별 현황</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.segments.map((segment: any) => (
              <button
                key={segment.segment}
                onClick={() => setSelectedSegment(segment.segment)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedSegment === segment.segment
                    ? 'border-slate-800 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full mb-2"
                  style={{ backgroundColor: segment.color }}
                />
                <p className="text-sm font-medium text-slate-900">{segment.label}</p>
                <p className="text-2xl font-bold text-slate-800">{segment.count.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">
                  평균 {(segment.avgOrderValue / 10000).toFixed(1)}만원
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 선택된 세그먼트 상세 */}
      {selectedData && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedData.color }}
              />
              <h3 className="text-lg font-semibold">{selectedData.label} 고객 상세</h3>
            </div>
            <button
              onClick={() => setSelectedSegment(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-slate-600 mb-4">{selectedData.description}</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-600">고객 ID</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600">국가</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-600">최근 구매</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-600">구매 횟수</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-600">총 금액</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-600">RFM</th>
                </tr>
              </thead>
              <tbody>
                {selectedData.customers.slice(0, 10).map((customer: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-xs">{customer.userId}</td>
                    <td className="py-2 px-3">{customer.country}</td>
                    <td className="py-2 px-3 text-right">{customer.recencyDays}일 전</td>
                    <td className="py-2 px-3 text-right">{customer.frequency}회</td>
                    <td className="py-2 px-3 text-right">{(customer.monetary / 10000).toFixed(1)}만원</td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">
                        {customer.rfmScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// 이탈 위험 탭
function ChurnRiskTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['churn-risk'],
    queryFn: customerAnalyticsApi.getChurnRisk,
  })

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.success) return <ErrorState />

  return (
    <div className="space-y-6">
      {/* 경고 배너 */}
      {data.summary.highRiskCount > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-semibold">
                이탈 위험 고객 {data.summary.highRiskCount}명 감지
              </p>
              <p className="text-sm opacity-90">
                예상 손실 매출: ₩{(data.summary.potentialRevenueLoss / 10000).toFixed(0)}만원
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="높은 위험"
          value={data.summary.highRiskCount}
          suffix="명"
          icon="🔴"
          highlight="danger"
        />
        <SummaryCard
          title="중간 위험"
          value={data.summary.mediumRiskCount}
          suffix="명"
          icon="🟡"
          highlight="warning"
        />
        <SummaryCard
          title="낮은 위험"
          value={data.summary.lowRiskCount}
          suffix="명"
          icon="🟢"
        />
        <SummaryCard
          title="예상 손실"
          value={(data.summary.potentialRevenueLoss / 10000).toFixed(0)}
          suffix="만원"
          icon="💸"
        />
      </div>

      {/* 높은 위험 고객 목록 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            높은 위험 고객
          </h3>
          <span className="text-sm text-slate-500">{data.highRisk.length}명</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">고객 ID</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">국가</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">미구매</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">구매 횟수</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">누적 금액</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">위험도</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">위험 요인</th>
              </tr>
            </thead>
            <tbody>
              {data.highRisk.slice(0, 20).map((customer: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-red-50">
                  <td className="py-2 px-3 font-mono text-xs">{customer.userId}</td>
                  <td className="py-2 px-3">{customer.country}</td>
                  <td className="py-2 px-3 text-right text-red-600 font-medium">
                    {customer.recencyDays}일
                  </td>
                  <td className="py-2 px-3 text-right">{customer.frequency}회</td>
                  <td className="py-2 px-3 text-right">
                    {(customer.totalAmount / 10000).toFixed(1)}만원
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${customer.riskScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-red-600 font-medium">{customer.riskScore}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex flex-wrap gap-1">
                      {customer.riskFactors.map((factor: string, i: number) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 중간 위험 고객 목록 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            중간 위험 고객
          </h3>
          <span className="text-sm text-slate-500">{data.mediumRisk.length}명</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">고객 ID</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">국가</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">미구매</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">구매 횟수</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">누적 금액</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">위험도</th>
              </tr>
            </thead>
            <tbody>
              {data.mediumRisk.slice(0, 10).map((customer: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-yellow-50">
                  <td className="py-2 px-3 font-mono text-xs">{customer.userId}</td>
                  <td className="py-2 px-3">{customer.country}</td>
                  <td className="py-2 px-3 text-right text-yellow-600 font-medium">
                    {customer.recencyDays}일
                  </td>
                  <td className="py-2 px-3 text-right">{customer.frequency}회</td>
                  <td className="py-2 px-3 text-right">
                    {(customer.totalAmount / 10000).toFixed(1)}만원
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 rounded-full"
                          style={{ width: `${customer.riskScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-yellow-600 font-medium">{customer.riskScore}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// 코호트 분석 탭
function CohortTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cohort'],
    queryFn: customerAnalyticsApi.getCohort,
  })

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.success) return <ErrorState />

  // 리텐션 히트맵 색상
  const getRetentionColor = (rate: number) => {
    if (rate >= 50) return 'bg-green-500 text-white'
    if (rate >= 30) return 'bg-green-400 text-white'
    if (rate >= 20) return 'bg-yellow-400 text-slate-800'
    if (rate >= 10) return 'bg-orange-400 text-white'
    if (rate > 0) return 'bg-red-400 text-white'
    return 'bg-slate-100 text-slate-400'
  }

  // 라인 차트 데이터
  const lineChartData = {
    labels: ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
    datasets: data.cohorts.map((cohort: any, idx: number) => ({
      label: cohort.cohortMonth,
      data: Object.values(cohort.retentionRates),
      borderColor: `hsl(${idx * 60}, 70%, 50%)`,
      backgroundColor: `hsla(${idx * 60}, 70%, 50%, 0.1)`,
      tension: 0.3,
      fill: false,
    })),
  }

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="M1 리텐션"
          value={data.summary.avgM1Retention}
          suffix="%"
          icon="📊"
        />
        <SummaryCard
          title="M3 리텐션"
          value={data.summary.avgM3Retention}
          suffix="%"
          icon="📈"
        />
        <SummaryCard
          title="M6 리텐션"
          value={data.summary.avgM6Retention}
          suffix="%"
          icon="🎯"
        />
        <SummaryCard
          title="분석 코호트"
          value={data.summary.totalCohorts}
          suffix="개월"
          icon="📅"
        />
      </div>

      {/* 리텐션 히트맵 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">월별 코호트 리텐션</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 font-medium text-slate-600 sticky left-0 bg-white">
                  가입월
                </th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">신규</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">M0</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">M1</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">M2</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">M3</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">M4</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">M5</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">M6</th>
              </tr>
            </thead>
            <tbody>
              {data.cohorts.map((cohort: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-2 px-3 font-medium sticky left-0 bg-white">
                    {cohort.cohortMonth}
                  </td>
                  <td className="py-2 px-3 text-center text-slate-600">{cohort.size}명</td>
                  {[0, 1, 2, 3, 4, 5, 6].map((month) => (
                    <td key={month} className="py-1 px-1 text-center">
                      <span
                        className={`inline-block w-12 py-1 rounded text-xs font-medium ${getRetentionColor(
                          cohort.retentionRates[month]
                        )}`}
                      >
                        {cohort.retentionRates[month]}%
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
              {/* 평균 행 */}
              <tr className="border-t-2 border-slate-300 bg-slate-50">
                <td className="py-2 px-3 font-semibold sticky left-0 bg-slate-50">평균</td>
                <td className="py-2 px-3 text-center">-</td>
                {[0, 1, 2, 3, 4, 5, 6].map((month) => (
                  <td key={month} className="py-1 px-1 text-center">
                    <span className="inline-block w-12 py-1 rounded text-xs font-bold bg-slate-700 text-white">
                      {data.avgRetention[month]}%
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 리텐션 추이 차트 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">코호트별 리텐션 추이</h3>
        <div className="h-80">
          <Line
            data={lineChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: { display: true, text: '리텐션율 (%)' },
                },
              },
              plugins: {
                legend: { position: 'bottom' },
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}

// LTV 분석 탭
function LTVTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ltv'],
    queryFn: customerAnalyticsApi.getLTV,
  })

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.success) return <ErrorState />

  const distributionData = {
    labels: ['Low (<5만)', 'Medium (5-20만)', 'High (20-50만)', 'VIP (50만+)'],
    datasets: [
      {
        data: [
          data.distribution.low,
          data.distribution.medium,
          data.distribution.high,
          data.distribution.vip,
        ],
        backgroundColor: ['#6B7280', '#3B82F6', '#8B5CF6', '#F59E0B'],
      },
    ],
  }

  const countryChartData = {
    labels: data.byCountry.map((c: any) => c.country),
    datasets: [
      {
        label: '평균 LTV',
        data: data.byCountry.map((c: any) => c.avgLTV / 10000),
        backgroundColor: '#3B82F6',
        borderRadius: 6,
      },
    ],
  }

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="전체 고객"
          value={data.summary.totalCustomers.toLocaleString()}
          suffix="명"
          icon="👥"
        />
        <SummaryCard
          title="평균 LTV"
          value={(data.summary.avgLTV / 10000).toFixed(1)}
          suffix="만원"
          icon="💰"
        />
        <SummaryCard
          title="중앙값 LTV"
          value={(data.summary.medianLTV / 10000).toFixed(1)}
          suffix="만원"
          icon="📊"
        />
        <SummaryCard
          title="총 매출"
          value={(data.summary.totalLTV / 100000000).toFixed(1)}
          suffix="억원"
          icon="💵"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LTV 분포 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">LTV 분포</h3>
          <div className="h-64">
            <Doughnut
              data={distributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' },
                },
              }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-600">{data.distribution.low}</p>
              <p className="text-xs text-slate-500">Low</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{data.distribution.medium}</p>
              <p className="text-xs text-slate-500">Medium</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{data.distribution.high}</p>
              <p className="text-xs text-slate-500">High</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{data.distribution.vip}</p>
              <p className="text-xs text-slate-500">VIP</p>
            </div>
          </div>
        </div>

        {/* 국가별 LTV */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">국가별 평균 LTV</h3>
          <div className="h-72">
            <Bar
              data={countryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                  x: {
                    title: { display: true, text: '만원' },
                  },
                },
                plugins: {
                  legend: { display: false },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Top 고객 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">🏆 Top 20 고객</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">순위</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">고객 ID</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">국가</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">지역</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">LTV</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">주문 횟수</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">평균 주문</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">첫 주문</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">고객 기간</th>
              </tr>
            </thead>
            <tbody>
              {data.topCustomers.map((customer: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3">
                    {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                  </td>
                  <td className="py-2 px-3 font-mono text-xs">{customer.userId}</td>
                  <td className="py-2 px-3">{customer.country || '-'}</td>
                  <td className="py-2 px-3 text-slate-500 text-xs">{customer.region || '-'}</td>
                  <td className="py-2 px-3 text-right font-semibold text-green-600">
                    {(customer.ltv / 10000).toFixed(1)}만원
                  </td>
                  <td className="py-2 px-3 text-right">{customer.orderCount}회</td>
                  <td className="py-2 px-3 text-right">
                    {(customer.avgOrderValue / 10000).toFixed(1)}만원
                  </td>
                  <td className="py-2 px-3 text-slate-600">{customer.firstOrder}</td>
                  <td className="py-2 px-3 text-right">{customer.lifetimeDays}일</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// 쿠폰 시뮬레이터 탭
function CouponSimulatorTab() {
  const [targetSegments, setTargetSegments] = useState<string[]>(['AtRisk'])
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed')
  const [discountValue, setDiscountValue] = useState(10000)
  const [minOrderAmount, setMinOrderAmount] = useState(50000)
  const [targetCountries, setTargetCountries] = useState<string[]>([])

  const mutation = useMutation({
    mutationFn: () =>
      customerAnalyticsApi.simulateCoupon({
        targetSegments,
        discountType,
        discountValue,
        minOrderAmount,
        targetCountries,
      }),
  })

  const segments = [
    { id: 'Champions', label: '챔피언', color: '#10B981' },
    { id: 'Loyal', label: '충성 고객', color: '#3B82F6' },
    { id: 'Potential', label: '성장 가능', color: '#8B5CF6' },
    { id: 'AtRisk', label: '이탈 위험', color: '#EF4444' },
    { id: 'Hibernating', label: '휴면', color: '#6B7280' },
  ]

  const countries = ['JP', 'US', 'SG', 'HK', 'AU', 'CA', 'GB', 'DE', 'FR', 'TW']

  const toggleSegment = (id: string) => {
    setTargetSegments((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const toggleCountry = (code: string) => {
    setTargetCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 설정 패널 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🎫 쿠폰 설정</h3>

          {/* 타겟 세그먼트 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              타겟 세그먼트
            </label>
            <div className="flex flex-wrap gap-2">
              {segments.map((seg) => (
                <button
                  key={seg.id}
                  onClick={() => toggleSegment(seg.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    targetSegments.includes(seg.id)
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={{
                    backgroundColor: targetSegments.includes(seg.id) ? seg.color : undefined,
                  }}
                >
                  {seg.label}
                </button>
              ))}
            </div>
          </div>

          {/* 할인 유형 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">할인 유형</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={discountType === 'fixed'}
                  onChange={() => setDiscountType('fixed')}
                  className="text-blue-600"
                />
                <span>정액 할인</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={discountType === 'percentage'}
                  onChange={() => setDiscountType('percentage')}
                  className="text-blue-600"
                />
                <span>정률 할인</span>
              </label>
            </div>
          </div>

          {/* 할인 금액/비율 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {discountType === 'fixed' ? '할인 금액' : '할인율'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-32 border border-slate-300 rounded-lg px-3 py-2"
              />
              <span className="text-slate-600">
                {discountType === 'fixed' ? '원' : '%'}
              </span>
            </div>
          </div>

          {/* 최소 주문 금액 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              최소 주문 금액
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                className="w-32 border border-slate-300 rounded-lg px-3 py-2"
              />
              <span className="text-slate-600">원</span>
            </div>
          </div>

          {/* 타겟 국가 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              타겟 국가 (선택)
            </label>
            <div className="flex flex-wrap gap-2">
              {countries.map((code) => (
                <button
                  key={code}
                  onClick={() => toggleCountry(code)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    targetCountries.includes(code)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              선택하지 않으면 전체 국가가 대상입니다
            </p>
          </div>

          {/* 시뮬레이션 버튼 */}
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || targetSegments.length === 0}
            className="w-full btn btn-primary py-3"
          >
            {mutation.isPending ? '계산 중...' : '📊 ROI 시뮬레이션'}
          </button>
        </div>

        {/* 결과 패널 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">📈 시뮬레이션 결과</h3>

          {!mutation.data && !mutation.isPending && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <span className="text-4xl mb-2">🎯</span>
              <p>설정을 완료하고 시뮬레이션을 실행하세요</p>
            </div>
          )}

          {mutation.isPending && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {mutation.data?.success && (
            <div className="space-y-6">
              {/* 주요 지표 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600">타겟 고객</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {mutation.data.simulation.targetCount.toLocaleString()}명
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-600">예상 사용률</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {mutation.data.simulation.expectedUsageRate}
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-green-600">예상 매출</p>
                  <p className="text-2xl font-bold text-green-800">
                    ₩{(mutation.data.simulation.expectedRevenue / 10000).toFixed(0)}만
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-sm text-red-600">쿠폰 비용</p>
                  <p className="text-2xl font-bold text-red-800">
                    ₩{(mutation.data.simulation.couponCost / 10000).toFixed(0)}만
                  </p>
                </div>
              </div>

              {/* ROI 하이라이트 */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">예상 순이익</p>
                    <p className="text-3xl font-bold">
                      ₩{(mutation.data.simulation.netRevenue / 10000).toFixed(0)}만원
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">ROI</p>
                    <p className="text-4xl font-bold">{mutation.data.simulation.roi}</p>
                  </div>
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-medium mb-2">상세 예측</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">예상 사용 고객</span>
                    <span className="font-medium">{mutation.data.simulation.expectedUsers}명</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">평균 주문 금액</span>
                    <span className="font-medium">
                      ₩{(mutation.data.simulation.avgOrderValue / 10000).toFixed(1)}만원
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 공통 컴포넌트
function SummaryCard({
  title,
  value,
  suffix,
  icon,
  highlight,
}: {
  title: string
  value: string | number
  suffix?: string
  icon: string
  highlight?: 'danger' | 'warning' | 'success'
}) {
  const bgColor =
    highlight === 'danger'
      ? 'bg-red-50 border-red-200'
      : highlight === 'warning'
      ? 'bg-yellow-50 border-yellow-200'
      : highlight === 'success'
      ? 'bg-green-50 border-green-200'
      : 'bg-white border-slate-200'

  return (
    <div className={`rounded-xl border p-4 ${bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">
        {value}
        {suffix && <span className="text-sm font-normal text-slate-500 ml-1">{suffix}</span>}
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto mb-4"></div>
        <p className="text-slate-600">데이터를 분석하고 있습니다...</p>
      </div>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="card bg-red-50 border-red-200">
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block">❌</span>
        <h3 className="text-lg font-semibold text-red-800 mb-2">데이터를 불러올 수 없습니다</h3>
        <p className="text-red-600">잠시 후 다시 시도해주세요.</p>
      </div>
    </div>
  )
}

