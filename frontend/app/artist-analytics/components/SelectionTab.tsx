'use client'

import { useQuery } from '@tanstack/react-query'
import { artistAnalyticsApi } from '@/lib/api'
import { EnhancedLoadingPage } from '@/components/ui'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend)

export default function SelectionTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['artist-analytics-selection'],
    queryFn: () => artistAnalyticsApi.getSelection({ months: 12 }),
  })

  if (isLoading) {
    return <EnhancedLoadingPage message="셀렉션 데이터를 불러오는 중..." variant="default" size="md" />
  }

  if (error || !data?.success) {
    return <div className="card bg-red-50 p-6 text-red-600">데이터 로드 실패</div>
  }

  const { 
    summary, 
    productStats, 
    globalExpansion, 
    avgProductsPerArtist,
    monthlyTrend, 
    churnReasons, 
    onboarding, 
    deletedArtists, 
    recentRegistrations,
    noProductArtists,
    _debug 
  } = data

  // 디버그 정보 콘솔 출력
  if (_debug) {
    console.log('[SelectionTab] Debug info:', _debug)
  }

  const formatCurrency = (value: number) => {
    if (value >= 10000) return `₩${(value / 10000).toFixed(0)}만`
    return `₩${value.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      {/* 핵심 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">총 등록 작가</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalRegistered.toLocaleString()}<span className="text-lg font-normal text-gray-500">명</span></p>
            </div>
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">활성 작가</p>
              <p className="text-3xl font-bold text-emerald-600">{summary.activeArtists.toLocaleString()}<span className="text-lg font-normal text-gray-500">명</span></p>
              <p className="text-xs text-gray-400 mt-1">전체의 {Math.round((summary.activeArtists / summary.totalRegistered) * 100)}%</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">이탈 작가</p>
              <p className="text-3xl font-bold text-red-600">{summary.deletedArtists.toLocaleString()}<span className="text-lg font-normal text-gray-500">명</span></p>
              <p className="text-xs text-gray-400 mt-1">이탈률 {summary.churnRate}%</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚪</span>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">이번 달 신규</p>
              <p className="text-3xl font-bold text-blue-600">{(summary.thisMonthRegistered || 0).toLocaleString()}<span className="text-lg font-normal text-gray-500">명</span></p>
              <p className="text-xs text-gray-400 mt-1">신규 등록 작가</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🆕</span>
            </div>
          </div>
        </div>
      </div>

      {/* 월별 추이 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 누적 작가 수 추이 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">📈 전체 작가 수 추이</h3>
          <div className="h-64">
            <Line
              data={{
                labels: monthlyTrend.map((m: any) => m.month),
                datasets: [
                  {
                    label: '누적 작가 수',
                    data: monthlyTrend.map((m: any) => m.cumulative),
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    title: { display: true, text: '작가 수' },
                  },
                },
              }}
            />
          </div>
          <div className="mt-3 text-center text-sm text-gray-500">
            현재 총 <span className="font-semibold text-violet-600">{summary.activeArtists.toLocaleString()}명</span> 활성 작가
          </div>
        </div>

        {/* 월별 신규 등록 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🆕 월별 신규 등록 작가</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: monthlyTrend.map((m: any) => m.month),
                datasets: [
                  {
                    label: '신규 등록',
                    data: monthlyTrend.map((m: any) => m.registered),
                    backgroundColor: '#10B981',
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: '신규 작가 수' },
                  },
                },
              }}
            />
          </div>
          <div className="mt-3 text-center text-sm text-gray-500">
            12개월 총 <span className="font-semibold text-emerald-600">+{monthlyTrend.reduce((sum: number, m: any) => sum + m.registered, 0).toLocaleString()}명</span> 신규 등록
          </div>
        </div>
      </div>


      {/* 작품 등록 현황 & 글로벌 확장 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 작품 등록 현황 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">📦 작품 등록 현황</h3>
          <div className="space-y-4">
            {/* KR/Global Live 작품 수 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{(productStats?.krLive || 0).toLocaleString()}개</p>
                <p className="text-sm text-gray-600">KR Live 작품</p>
              </div>
              <div className="text-center p-4 bg-violet-50 rounded-xl">
                <p className="text-2xl font-bold text-violet-600">{(productStats?.globalLive || 0).toLocaleString()}개</p>
                <p className="text-sm text-gray-600">Global Live 작품</p>
              </div>
            </div>

            {/* KR→Global 전환율 */}
            <div className="p-4 bg-emerald-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">KR → Global 전환율</span>
                <span className="text-xl font-bold text-emerald-600">{productStats?.krToGlobalRate || 0}%</span>
              </div>
              <div className="h-3 bg-emerald-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${Math.min(productStats?.krToGlobalRate || 0, 100)}%` }} 
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                KR 작품 대비 Global 작품 등록 비율
              </p>
            </div>

            {/* 작가당 평균 작품 수 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-3">👤 작가당 평균 Live 작품 수</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-blue-600">{avgProductsPerArtist?.krLive || 0}개</p>
                  <p className="text-xs text-gray-500">KR</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-violet-600">{avgProductsPerArtist?.globalLive || 0}개</p>
                  <p className="text-xs text-gray-500">Global</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-600">{avgProductsPerArtist?.avgConversionRate || 0}%</p>
                  <p className="text-xs text-gray-500">전환율</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 작품 판매 현황 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🛒 작품 판매 현황</h3>
          <div className="space-y-4">
            {/* Global 작품 판매중 작가 */}
            <div className="p-4 bg-violet-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Global 작품 판매중 작가</span>
                <span className="text-xl font-bold text-violet-600">
                  {(globalExpansion?.globalArtistCount || 0).toLocaleString()}명
                </span>
              </div>
              <div className="h-3 bg-violet-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-violet-500 rounded-full" 
                  style={{ width: `${globalExpansion?.globalArtistRate || 0}%` }} 
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                전체 등록 작가 중 {globalExpansion?.globalArtistRate || 0}%가 작품 판매중
              </p>
            </div>

            {/* 언어별 판매 작가 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-3">언어별 판매 작가 (Global 판매중 작가 기준)</p>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">🇺🇸 EN (영어)</span>
                    <span className="text-sm font-semibold">{globalExpansion?.enCoverage || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${globalExpansion?.enCoverage || 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">🇯🇵 JA (일본어)</span>
                    <span className="text-sm font-semibold">{globalExpansion?.jaCoverage || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${globalExpansion?.jaCoverage || 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 이탈 현황 요약 */}
            <div className="p-4 bg-red-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">이탈 현황</span>
                <span className="text-lg font-bold text-red-600">{summary.deletedArtists}명</span>
              </div>
              {summary.deletedArtists > 0 ? (
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>판매 없이 이탈</span>
                    <span>{churnReasons.noSales.count}명 ({churnReasons.noSales.rate}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>저조한 판매 후 이탈</span>
                    <span>{churnReasons.lowSales.count}명 ({churnReasons.lowSales.rate}%)</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>활발한 활동 후 이탈 ⚠️</span>
                    <span>{churnReasons.activeThenChurn.count}명 ({churnReasons.activeThenChurn.rate}%)</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">이탈 작가가 없습니다 👍</p>
              )}
            </div>
          </div>
        </div>

        {/* 신규 작가 온보딩 현황 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🆕 신규 작가 온보딩</h3>
          <div className="space-y-4">
            {/* 최근 30일 신규 등록 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{onboarding.recentCount}명</p>
                <p className="text-sm text-gray-600">최근 30일 신규</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-xl">
                <p className="text-2xl font-bold text-emerald-600">{onboarding.withSalesCount}명</p>
                <p className="text-sm text-gray-600">첫 판매 달성</p>
              </div>
            </div>

            {/* 첫 판매 전환율 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">첫 판매 전환율</span>
                <span className={`text-xl font-bold ${onboarding.firstSaleConversionRate >= 50 ? 'text-emerald-600' : onboarding.firstSaleConversionRate >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
                  {onboarding.firstSaleConversionRate}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${onboarding.firstSaleConversionRate >= 50 ? 'bg-emerald-500' : onboarding.firstSaleConversionRate >= 20 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(onboarding.firstSaleConversionRate, 100)}%` }} 
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {onboarding.firstSaleConversionRate >= 50 
                  ? '✅ 우수한 전환율' 
                  : onboarding.firstSaleConversionRate >= 20 
                    ? '📊 평균 수준' 
                    : '⚠️ 온보딩 개선 필요'}
              </p>
            </div>

            {/* 첫 판매까지 평균 일수 */}
            {onboarding.avgDaysToFirstSale !== null ? (
              <div className="p-4 bg-violet-50 rounded-xl text-center">
                <p className="text-sm text-gray-600 mb-1">첫 판매까지 평균</p>
                <p className="text-2xl font-bold text-violet-600">{onboarding.avgDaysToFirstSale}일</p>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-500">아직 첫 판매 데이터가 없습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 신규 등록 & 이탈 작가 리스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 등록 작가 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">✨ 최근 등록 작가</h3>
          {recentRegistrations.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentRegistrations.map((artist: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                  <div>
                    <span className="font-medium">{artist.artistName}</span>
                    <span className="text-xs text-gray-500 ml-2">{artist.registrationDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {artist.hasSales ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">판매 시작</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">대기 중</span>
                    )}
                    <span className="text-xs text-gray-500">
                      {artist.products.global > 0 ? `${artist.products.global}개` : '작품 없음'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">최근 30일 내 신규 등록 작가가 없습니다.</p>
          )}
        </div>

        {/* 이탈 작가 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🚪 최근 이탈 작가</h3>
          {deletedArtists.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {deletedArtists.slice(0, 10).map((artist: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <div>
                    <span className="font-medium">{artist.artistName}</span>
                    <span className="text-xs text-gray-500 ml-2">삭제: {artist.deletionDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      artist.churnReason === '활발한 활동 후 이탈' 
                        ? 'bg-red-100 text-red-700' 
                        : artist.churnReason === '저조한 판매 후 이탈'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {artist.churnReason === '활발한 활동 후 이탈' ? '⚠️ ' : ''}{artist.churnReason}
                    </span>
                    {artist.totalGmv > 0 && (
                      <span className="text-xs text-gray-500">{formatCurrency(artist.totalGmv)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">이탈 작가 데이터가 없습니다.</p>
          )}
        </div>
      </div>

      {/* 작품 미등록 작가 */}
      {noProductArtists.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">⚠️ 작품 미등록 작가 (온보딩 필요)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">작가명</th>
                  <th className="text-center py-2 px-3">등록일</th>
                  <th className="text-center py-2 px-3">경과일</th>
                  <th className="text-center py-2 px-3">판매 여부</th>
                </tr>
              </thead>
              <tbody>
                {noProductArtists.slice(0, 10).map((artist: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{artist.artistName}</td>
                    <td className="py-2 px-3 text-center text-gray-600">{artist.registrationDate || '-'}</td>
                    <td className="py-2 px-3 text-center">
                      {artist.daysSinceRegistration !== null ? (
                        <span className={artist.daysSinceRegistration > 30 ? 'text-red-600 font-medium' : ''}>
                          {artist.daysSinceRegistration}일
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {artist.hasSales ? (
                        <span className="text-emerald-600">✓</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {noProductArtists.length > 10 && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              외 {noProductArtists.length - 10}명 더 있음
            </p>
          )}
        </div>
      )}

      {/* 디버그 정보 (개발용) */}
      {_debug && (
        <details className="card">
          <summary className="cursor-pointer text-sm text-gray-500 font-medium">
            🔧 디버그 정보 (클릭하여 펼치기)
          </summary>
          <div className="mt-4 space-y-3 text-xs">
            <div>
              <p className="font-medium text-gray-700">Artists 시트 컬럼명:</p>
              <p className="text-gray-500 break-all">{_debug.artistsSheetColumns?.join(', ') || '없음'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">샘플 데이터:</p>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
                {JSON.stringify(_debug.artistsSampleRow, null, 2)}
              </pre>
            </div>
            <div className="flex gap-4">
              <p><span className="font-medium">시트 내 작가 수:</span> {_debug.totalArtistsInSheet}</p>
              <p><span className="font-medium">판매 기록 있는 작가:</span> {_debug.logisticsArtistCount}</p>
            </div>
          </div>
        </details>
      )}
    </div>
  )
}
