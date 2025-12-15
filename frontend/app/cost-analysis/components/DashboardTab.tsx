'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { costAnalysisApi } from '@/lib/api'
import { EnhancedLoadingPage } from '@/components/ui'
import { format, subDays } from 'date-fns'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function DashboardTab() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cost-analysis-dashboard', startDate, endDate],
    queryFn: () => costAnalysisApi.getDashboard({ startDate, endDate }),
    enabled: !!startDate && !!endDate,
  })

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `₩${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `₩${(value / 1000).toFixed(0)}K`
    }
    return `₩${value.toLocaleString()}`
  }

  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  if (isLoading) {
    return <EnhancedLoadingPage message="손익 데이터를 분석하고 있습니다..." variant="default" size="md" />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <span className="text-4xl mb-4 block">⚠️</span>
        <h3 className="text-lg font-semibold text-red-800 mb-2">데이터 로드 실패</h3>
        <p className="text-red-600 text-sm">
          {error instanceof Error ? error.message : '데이터를 불러오는 중 오류가 발생했습니다.'}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    )
  }

  const dashboardData = data?.data

  // 트렌드 차트 데이터
  const trendChartData = {
    labels: dashboardData?.trends?.map((t: any) => t.date.slice(5)) || [],
    datasets: [
      {
        type: 'bar' as const,
        label: 'GMV',
        data: dashboardData?.trends?.map((t: any) => t.gmv) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderRadius: 4,
        yAxisID: 'yGmv',
      },
      {
        type: 'line' as const,
        label: '물류비',
        data: dashboardData?.trends?.map((t: any) => t.logisticsCost) || [],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        yAxisID: 'yLogistics',
      },
    ],
  }

  // Tier별 도넛 차트
  const tierChartData = {
    labels: dashboardData?.byTier?.map((t: any) => `Tier ${t.tier}`) || [],
    datasets: [
      {
        data: dashboardData?.byTier?.map((t: any) => t.gmv) || [],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  }

  return (
    <div className="space-y-6">
      {/* 기간 선택 */}
      <div className="bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <span className="font-medium text-gray-700">분석 기간</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <span className="text-gray-400">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              조회
            </button>
          </div>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-5 gap-4">
        {/* 총 매출 */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-emerald-100 text-sm font-medium">총 매출 (GMV)</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(dashboardData?.kpis?.totalGMV || 0)}</p>
          <p className="text-emerald-100 text-xs mt-2">
            주문 {dashboardData?.kpis?.orderCount || 0}건
          </p>
        </div>

        {/* 총 물류비 */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-amber-100 text-sm font-medium">총 물류비</span>
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(dashboardData?.kpis?.totalLogisticsCost || 0)}</p>
          <p className="text-amber-100 text-xs mt-2">
            매출 대비 {formatPercent(dashboardData?.kpis?.logisticsCostRatio || 0)}
          </p>
        </div>

        {/* 고객 배송비 수입 */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-100 text-sm font-medium">배송비 수입</span>
            <span className="text-2xl">🚚</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(dashboardData?.kpis?.customerShippingRevenue || 0)}</p>
          <p className="text-blue-100 text-xs mt-2">
            고객 부담 배송비
          </p>
        </div>

        {/* 순 물류비 */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-rose-100 text-sm font-medium">순 물류비</span>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(dashboardData?.kpis?.netLogisticsCost || 0)}</p>
          <p className="text-rose-100 text-xs mt-2">
            Hidden Fee 필요액
          </p>
        </div>

        {/* 총 이익 */}
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-violet-100 text-sm font-medium">총 이익</span>
            <span className="text-2xl">✨</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(dashboardData?.kpis?.grossProfit || 0)}</p>
          <p className="text-violet-100 text-xs mt-2">
            마진율 {formatPercent(dashboardData?.kpis?.grossMarginPercent || 0)}
          </p>
        </div>
      </div>

      {/* Hidden Fee 적정성 분석 */}
      {dashboardData?.hiddenFeeAnalysis && (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Hidden Fee 적정성 분석</h3>
                <p className="text-xs text-slate-500">작품가에 포함된 물류비 보전금 분석</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
              dashboardData.hiddenFeeAnalysis.adequacyStatus === 'surplus' 
                ? 'bg-emerald-100 text-emerald-700'
                : dashboardData.hiddenFeeAnalysis.adequacyStatus === 'adequate'
                ? 'bg-blue-100 text-blue-700'
                : dashboardData.hiddenFeeAnalysis.adequacyStatus === 'deficit'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {dashboardData.hiddenFeeAnalysis.adequacyStatus === 'surplus' && '✅ 여유'}
              {dashboardData.hiddenFeeAnalysis.adequacyStatus === 'adequate' && '✅ 적정'}
              {dashboardData.hiddenFeeAnalysis.adequacyStatus === 'deficit' && '⚠️ 부족'}
              {dashboardData.hiddenFeeAnalysis.adequacyStatus === 'critical' && '🚨 심각'}
            </div>
          </div>

          {/* Hidden Fee 정책 현황 */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[1, 2, 3, 4].map((tier) => {
              const policy = dashboardData.hiddenFeeAnalysis.policy[`tier${tier}` as keyof typeof dashboardData.hiddenFeeAnalysis.policy]
              const tierData = dashboardData.byTier?.find((t: any) => t.tier === tier)
              return (
                <div key={tier} className={`rounded-lg p-3 ${
                  tier === 1 ? 'bg-emerald-50 border border-emerald-200' :
                  tier === 2 ? 'bg-blue-50 border border-blue-200' :
                  tier === 3 ? 'bg-amber-50 border border-amber-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold ${
                      tier === 1 ? 'text-emerald-700' :
                      tier === 2 ? 'text-blue-700' :
                      tier === 3 ? 'text-amber-700' : 'text-red-700'
                    }`}>Tier {tier}</span>
                    <span className="text-xs text-gray-500">{tierData?.orderCount || 0}건</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Hidden Fee</span>
                      <span className="font-bold">${policy?.hiddenFeeUSD}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">고객 배송비</span>
                      <span className="font-medium">${policy?.customerShippingFeeUSD}</span>
                    </div>
                    {tierData && (
                      <div className="pt-1 mt-1 border-t border-gray-200">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">보전율</span>
                          <span className={`font-bold ${
                            tierData.coverageRatio >= 100 ? 'text-emerald-600' :
                            tierData.coverageRatio >= 80 ? 'text-amber-600' : 'text-red-600'
                          }`}>{tierData.coverageRatio}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 분석 요약 */}
          <div className="grid grid-cols-5 gap-4 mb-5">
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Hidden Fee 수입</p>
              <p className="text-lg font-bold text-slate-800">
                {formatCurrency(dashboardData.hiddenFeeAnalysis.totalHiddenFeeRevenue)}
              </p>
              <p className="text-xs text-gray-400">주문당 {formatCurrency(dashboardData.hiddenFeeAnalysis.avgHiddenFeePerOrder)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 mb-1">고객 배송비 수입</p>
              <p className="text-lg font-bold text-slate-800">
                {formatCurrency(dashboardData.hiddenFeeAnalysis.totalCustomerShippingRevenue)}
              </p>
              <p className="text-xs text-gray-400">주문당 {formatCurrency(dashboardData.hiddenFeeAnalysis.avgCustomerShippingPerOrder)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 mb-1">총 보전액</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(dashboardData.hiddenFeeAnalysis.totalCoverage)}
              </p>
              <p className="text-xs text-gray-400">주문당 {formatCurrency(dashboardData.hiddenFeeAnalysis.avgCoveragePerOrder)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 mb-1">실제 물류비</p>
              <p className="text-lg font-bold text-amber-600">
                {formatCurrency(dashboardData.hiddenFeeAnalysis.totalLogisticsCost)}
              </p>
              <p className="text-xs text-gray-400">주문당 {formatCurrency(dashboardData.hiddenFeeAnalysis.avgLogisticsCostPerOrder)}</p>
            </div>
            <div className={`rounded-lg p-4 text-center shadow-sm ${
              dashboardData.hiddenFeeAnalysis.totalGap <= 0 
                ? 'bg-emerald-50' 
                : 'bg-red-50'
            }`}>
              <p className="text-xs text-gray-500 mb-1">GAP (보전액-물류비)</p>
              <p className={`text-lg font-bold ${
                dashboardData.hiddenFeeAnalysis.totalGap <= 0 
                  ? 'text-emerald-600' 
                  : 'text-red-600'
              }`}>
                {dashboardData.hiddenFeeAnalysis.totalGap <= 0 ? '+' : ''}
                {formatCurrency(Math.abs(dashboardData.hiddenFeeAnalysis.totalGap))}
                {dashboardData.hiddenFeeAnalysis.totalGap > 0 && ' 부족'}
              </p>
              <p className="text-xs text-gray-400">
                보전율 {dashboardData.hiddenFeeAnalysis.coverageRatio}%
              </p>
            </div>
          </div>

          {/* 권장 사항 */}
          <div className={`rounded-lg p-4 ${
            dashboardData.hiddenFeeAnalysis.isAdequate 
              ? 'bg-emerald-50 border border-emerald-200' 
              : 'bg-amber-50 border border-amber-200'
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-xl">
                {dashboardData.hiddenFeeAnalysis.isAdequate ? '💡' : '⚠️'}
              </span>
              <div>
                <p className={`font-semibold ${
                  dashboardData.hiddenFeeAnalysis.isAdequate 
                    ? 'text-emerald-800' 
                    : 'text-amber-800'
                }`}>
                  {dashboardData.hiddenFeeAnalysis.isAdequate ? '분석 결과' : '조치 필요'}
                </p>
                <p className={`text-sm mt-1 ${
                  dashboardData.hiddenFeeAnalysis.isAdequate 
                    ? 'text-emerald-700' 
                    : 'text-amber-700'
                }`}>
                  {dashboardData.hiddenFeeAnalysis.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 차트 섹션 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 트렌드 차트 */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📈</span>
            <h3 className="font-semibold text-gray-800">일별 GMV & 물류비 추이</h3>
          </div>
          <div style={{ height: '280px' }}>
            <Bar
              data={trendChartData as any}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { padding: 20, usePointStyle: true },
                  },
                },
                scales: {
                  x: { grid: { display: false } },
                  yGmv: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'GMV (KRW)' },
                    ticks: {
                      callback: (value) => {
                        const num = Number(value)
                        if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`
                        if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
                        return num.toString()
                      },
                    },
                  },
                  yLogistics: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: '물류비 (KRW)', color: '#f59e0b' },
                    grid: { drawOnChartArea: false },
                    ticks: {
                      color: '#f59e0b',
                      callback: (value) => {
                        const num = Number(value)
                        if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
                        return num.toString()
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Tier별 분포 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎯</span>
            <h3 className="font-semibold text-gray-800">Tier별 GMV 분포</h3>
          </div>
          <div style={{ height: '200px' }} className="flex items-center justify-center">
            <Doughnut
              data={tierChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { padding: 15, usePointStyle: true },
                  },
                },
                cutout: '60%',
              }}
            />
          </div>
          {/* Tier 설명 */}
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between px-2 py-1 bg-emerald-50 rounded">
              <span>Tier 1: 🇯🇵🇭🇰🇸🇬</span>
              <span className="text-emerald-600 font-medium">$1.49 배송비</span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 bg-blue-50 rounded">
              <span>Tier 2: 🇮🇩🇲🇾🇹🇼🇻🇳</span>
              <span className="text-blue-600 font-medium">$9.99 배송비</span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 bg-amber-50 rounded">
              <span>Tier 3: 🇺🇸🇨🇦🇦🇺🇳🇿</span>
              <span className="text-amber-600 font-medium">$19.99 배송비</span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 bg-red-50 rounded">
              <span>Tier 4: 유럽/기타</span>
              <span className="text-red-600 font-medium">$29.99 배송비</span>
            </div>
          </div>
        </div>
      </div>

      {/* 국가별 수익성 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌍</span>
            <h3 className="font-semibold text-gray-800">국가별 수익성 분석</h3>
          </div>
          <span className="text-sm text-gray-500">Top 10 국가</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">국가</th>
                <th className="px-4 py-3 text-center">Tier</th>
                <th className="px-4 py-3 text-right">주문수</th>
                <th className="px-4 py-3 text-right">GMV</th>
                <th className="px-4 py-3 text-right">평균 물류비</th>
                <th className="px-4 py-3 text-right">물류비 갭</th>
                <th className="px-4 py-3 text-right">수익률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dashboardData?.topCountries?.map((country: any, idx: number) => (
                <tr key={country.country} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCountryFlag(country.country)}</span>
                      <span className="font-medium text-gray-800">{country.countryName}</span>
                      <span className="text-xs text-gray-400">{country.country}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      country.tier === 1 ? 'bg-emerald-100 text-emerald-700' :
                      country.tier === 2 ? 'bg-blue-100 text-blue-700' :
                      country.tier === 3 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Tier {country.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{country.orderCount}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(country.totalGMV)}</td>
                  <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(country.avgLogisticsCost)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={country.logisticsGap > 0 ? 'text-red-600' : 'text-emerald-600'}>
                      {country.logisticsGap > 0 ? '-' : '+'}{formatCurrency(Math.abs(country.logisticsGap))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            country.profitMargin >= 70 ? 'bg-emerald-500' :
                            country.profitMargin >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, country.profitMargin)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${
                        country.profitMargin >= 70 ? 'text-emerald-600' :
                        country.profitMargin >= 50 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {formatPercent(country.profitMargin)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tier별 Hidden Fee 상세 분석 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h3 className="font-semibold text-gray-800">Tier별 물류비 보전 상세</h3>
          </div>
          <span className="text-sm text-gray-500">Hidden Fee 정책: 2023.10.25 기준</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Tier</th>
                <th className="px-4 py-3 text-center">주문수</th>
                <th className="px-4 py-3 text-right">Hidden Fee</th>
                <th className="px-4 py-3 text-right">고객 배송비 수입</th>
                <th className="px-4 py-3 text-right">총 보전액</th>
                <th className="px-4 py-3 text-right">실제 물류비</th>
                <th className="px-4 py-3 text-right">건당 물류비</th>
                <th className="px-4 py-3 text-center">보전율</th>
                <th className="px-4 py-3 text-center">GAP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dashboardData?.byTier?.map((tier: any) => (
                <tr key={tier.tier} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      tier.tier === 1 ? 'bg-emerald-100 text-emerald-700' :
                      tier.tier === 2 ? 'bg-blue-100 text-blue-700' :
                      tier.tier === 3 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Tier {tier.tier}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      (${tier.hiddenFeeUSD} / ${tier.customerShippingFeeUSD})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{tier.orderCount}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(tier.hiddenFeeRevenue)}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(tier.customerShippingRevenue)}</td>
                  <td className="px-4 py-3 text-right font-medium text-indigo-600">{formatCurrency(tier.totalCoverage)}</td>
                  <td className="px-4 py-3 text-right font-medium text-amber-600">{formatCurrency(tier.logisticsCost)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(tier.avgLogisticsCostPerOrder)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      tier.coverageRatio >= 100 ? 'bg-emerald-100 text-emerald-700' :
                      tier.coverageRatio >= 80 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {tier.coverageRatio}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${
                      tier.logisticsGap <= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {tier.logisticsGap <= 0 ? '+' : '-'}{formatCurrency(Math.abs(tier.logisticsGap))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 인사이트 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💡</span>
            <h4 className="font-semibold text-emerald-800">Tier 1 분석</h4>
          </div>
          <p className="text-sm text-emerald-700">
            핵심 시장(JP, HK, SG)은 Hidden Fee $3 + 배송비 $1.49로 
            운영 중입니다. 
            {dashboardData?.byTier?.find((t: any) => t.tier === 1)?.coverageRatio >= 100 
              ? ' 물류비 보전이 양호합니다.' 
              : ' 물류비 보전율 개선이 필요합니다.'}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⚠️</span>
            <h4 className="font-semibold text-amber-800">Tier 3, 4 분석</h4>
          </div>
          <p className="text-sm text-amber-700">
            영미권/유럽 시장은 물류비가 높아 Hidden Fee $7로도 
            {dashboardData?.byTier?.filter((t: any) => t.tier >= 3 && t.coverageRatio < 100).length > 0
              ? ' 보전이 부족할 수 있습니다. 배송비 정책 검토를 권장합니다.'
              : ' 현재 정책이 적정합니다.'}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🎯</span>
            <h4 className="font-semibold text-blue-800">권장 액션</h4>
          </div>
          <p className="text-sm text-blue-700">
            {dashboardData?.hiddenFeeAnalysis?.isAdequate 
              ? '현재 Hidden Fee 정책이 적정합니다. 무료배송 기준 최적화로 전환율 상승을 도모하세요.'
              : `Hidden Fee 인상 또는 무료배송 기준 상향을 검토하세요. 월 ${formatCurrency(Math.abs(dashboardData?.hiddenFeeAnalysis?.totalGap || 0))} 개선이 필요합니다.`}
          </p>
        </div>
      </div>
    </div>
  )
}

// 국가 플래그 이모지 반환
function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    JP: '🇯🇵', HK: '🇭🇰', SG: '🇸🇬', ID: '🇮🇩', MY: '🇲🇾', TW: '🇹🇼', VN: '🇻🇳',
    AU: '🇦🇺', CA: '🇨🇦', NZ: '🇳🇿', US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
    IT: '🇮🇹', ES: '🇪🇸', NL: '🇳🇱', BE: '🇧🇪', CH: '🇨🇭', AT: '🇦🇹', SE: '🇸🇪',
    NO: '🇳🇴', DK: '🇩🇰', FI: '🇫🇮', PL: '🇵🇱', CZ: '🇨🇿', HU: '🇭🇺', IE: '🇮🇪',
    PT: '🇵🇹', BR: '🇧🇷', MX: '🇲🇽', TH: '🇹🇭', PH: '🇵🇭', IN: '🇮🇳', AE: '🇦🇪',
    IL: '🇮🇱', ZA: '🇿🇦', TR: '🇹🇷', RU: '🇷🇺', CN: '🇨🇳',
  }
  return flags[code] || '🌍'
}

